"""
network_retry.py — Bounded, resilient network retry utility for AI Director worker services.

Provides bounded exponential backoff with jitter, configurable deadlines,
cancellation checks, and clean exception propagation to prevent infinite worker hanging.
Integrates smoothly with Celery's outer task retry policy.
"""

import functools
import logging
import os
import random
import socket
import time
from typing import Any, Callable, Optional, Sequence, Tuple, Type

logger = logging.getLogger("worker.network_retry")


class NetworkRetryExhaustedError(RuntimeError):
    """Raised when bounded network retries or deadline are exhausted."""
    pass


def calculate_backoff_delay(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
) -> float:
    """Computes bounded exponential backoff with optional full jitter."""
    if attempt < 1:
        attempt = 1
    raw_delay = base_delay * (backoff_factor ** (attempt - 1))
    bounded_delay = min(raw_delay, max_delay)
    if jitter:
        # Full jitter between 0.5 * bounded and bounded delay
        return random.uniform(bounded_delay * 0.5, bounded_delay)
    return bounded_delay


def bounded_network_retry(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    deadline_sec: Optional[float] = None,
    retryable_exceptions: Optional[Tuple[Type[Exception], ...]] = None,
    retry_condition: Optional[Callable[[Exception], bool]] = None,
    is_cancelled: Optional[Callable[[], bool]] = None,
    sleep_fn: Callable[[float], None] = time.sleep,
    time_fn: Callable[[], float] = time.time,
):
    """
    Decorator for bounding retry loops against network/API failures.

    - max_retries: Maximum number of attempts before raising NetworkRetryExhaustedError.
    - base_delay: Starting delay in seconds.
    - max_delay: Ceiling for exponential delay.
    - backoff_factor: Multiplier per failed attempt.
    - jitter: Whether to apply randomized jitter to avoid thundering herds.
    - deadline_sec: Optional maximum total seconds allowed before aborting.
    - retryable_exceptions: Tuple of exceptions to intercept. Defaults to socket/connection errors.
    - retry_condition: Optional filter function returning False if an exception should immediately be re-raised.
    - is_cancelled: Optional hook returning True if task has been cancelled / worker shutting down.
    - sleep_fn: Custom sleep function (pass mock for instant test execution).
    - time_fn: Custom clock function (pass mock for deadline tests).
    """
    if retryable_exceptions is None:
        # Standard default transient network errors
        retryable_exceptions = (socket.error, ConnectionError, TimeoutError, OSError)

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Allow environment variable overrides for worker resilience tuning
            env_max = os.environ.get("NETWORK_RETRY_MAX_RETRIES")
            effective_max_retries = int(env_max) if env_max and env_max.isdigit() else max_retries

            start_time = time_fn()
            attempt = 1
            last_exc: Optional[Exception] = None

            while True:
                # 1. Cancellation check
                if is_cancelled is not None and is_cancelled():
                    raise NetworkRetryExhaustedError(
                        f"Operation '{func.__name__}' aborted due to explicit cancellation."
                    )

                # 2. Deadline check
                elapsed = time_fn() - start_time
                if deadline_sec is not None and elapsed > deadline_sec:
                    raise NetworkRetryExhaustedError(
                        f"Operation '{func.__name__}' timed out after {elapsed:.2f}s "
                        f"(deadline: {deadline_sec}s, attempts made: {attempt - 1}). "
                        f"Last error: {last_exc}"
                    ) from last_exc

                # 3. Execution attempt
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as exc:
                    if retry_condition is not None and not retry_condition(exc):
                        raise

                    last_exc = exc

                    # If this was the last attempt, terminate
                    if attempt >= effective_max_retries:
                        raise NetworkRetryExhaustedError(
                            f"Operation '{func.__name__}' exhausted all {effective_max_retries} retries. "
                            f"Last error: {type(exc).__name__}: {str(exc)[:200]}"
                        ) from exc

                    delay = calculate_backoff_delay(
                        attempt=attempt,
                        base_delay=base_delay,
                        max_delay=max_delay,
                        backoff_factor=backoff_factor,
                        jitter=jitter,
                    )

                    # Clamp delay so it doesn't overshoot deadline
                    if deadline_sec is not None:
                        remaining = deadline_sec - (time_fn() - start_time)
                        if remaining <= 0:
                            raise NetworkRetryExhaustedError(
                                f"Operation '{func.__name__}' deadline of {deadline_sec}s expired "
                                f"before retry attempt {attempt + 1}. Last error: {exc}"
                            ) from exc
                        delay = min(delay, remaining)

                    # Log diagnostic without dumping sensitive kwargs
                    exc_desc = f"{type(exc).__name__}: {str(exc)[:160]}"
                    print(
                        f"[!] Network error in '{func.__name__}' ({exc_desc}). "
                        f"Retrying in {delay:.2f}s (Attempt {attempt}/{effective_max_retries})...",
                        flush=True,
                    )

                    sleep_fn(delay)
                    attempt += 1

        return wrapper

    return decorator
