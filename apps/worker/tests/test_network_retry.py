import socket
import pytest
from unittest.mock import MagicMock
from services.network_retry import (
    bounded_network_retry,
    calculate_backoff_delay,
    NetworkRetryExhaustedError,
)


def test_calculate_backoff_delay_exponential_growth():
    # Test without jitter for exact math verification
    d1 = calculate_backoff_delay(attempt=1, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=False)
    d2 = calculate_backoff_delay(attempt=2, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=False)
    d3 = calculate_backoff_delay(attempt=3, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=False)
    d4 = calculate_backoff_delay(attempt=4, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=False)
    d10 = calculate_backoff_delay(attempt=10, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=False)

    assert d1 == 1.0
    assert d2 == 2.0
    assert d3 == 4.0
    assert d4 == 8.0
    assert d10 == 30.0  # Capped at max_delay


def test_calculate_backoff_delay_with_jitter():
    # Jitter should stay within [0.5 * bounded, bounded]
    for _ in range(50):
        delay = calculate_backoff_delay(attempt=3, base_delay=1.0, max_delay=30.0, backoff_factor=2.0, jitter=True)
        assert 2.0 <= delay <= 4.0


def test_immediate_successful_connection():
    call_count = 0
    mock_sleep = MagicMock()

    @bounded_network_retry(max_retries=3, sleep_fn=mock_sleep)
    def quick_op(val):
        nonlocal call_count
        call_count += 1
        return f"success_{val}"

    res = quick_op("payload")
    assert res == "success_payload"
    assert call_count == 1
    mock_sleep.assert_not_called()


def test_temporary_failure_followed_by_recovery():
    attempts = 0
    sleeps = []

    def fake_sleep(d):
        sleeps.append(d)

    @bounded_network_retry(
        max_retries=4,
        base_delay=1.0,
        backoff_factor=2.0,
        jitter=False,
        sleep_fn=fake_sleep,
    )
    def flaky_service():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise socket.error("Connection reset by peer")
        return "recovered_data"

    result = flaky_service()
    assert result == "recovered_data"
    assert attempts == 3
    assert len(sleeps) == 2
    assert sleeps[0] == 1.0
    assert sleeps[1] == 2.0


def test_retry_exhaustion_raises_terminal_exception():
    attempts = 0
    sleeps = []

    @bounded_network_retry(
        max_retries=3,
        base_delay=0.5,
        jitter=False,
        sleep_fn=lambda s: sleeps.append(s),
    )
    def permanently_broken():
        nonlocal attempts
        attempts += 1
        raise ConnectionRefusedError("Endpoint unavailable")

    with pytest.raises(NetworkRetryExhaustedError) as exc_info:
        permanently_broken()

    assert "exhausted all 3 retries" in str(exc_info.value)
    assert attempts == 3
    assert len(sleeps) == 2  # 2 sleeps between 3 attempts


def test_deadline_expiry_aborts_retries():
    # Simulate virtual clock
    current_time = 100.0

    def fake_time():
        return current_time

    def fake_sleep(duration):
        nonlocal current_time
        current_time += duration

    @bounded_network_retry(
        max_retries=10,
        base_delay=5.0,
        backoff_factor=2.0,
        deadline_sec=12.0,
        jitter=False,
        sleep_fn=fake_sleep,
        time_fn=fake_time,
    )
    def slow_failing_call():
        raise TimeoutError("Gateway timeout")

    with pytest.raises(NetworkRetryExhaustedError) as exc_info:
        slow_failing_call()

    assert "deadline" in str(exc_info.value).lower() or "timed out" in str(exc_info.value).lower()


def test_explicit_cancellation_hook():
    cancelled = False

    @bounded_network_retry(
        max_retries=5,
        is_cancelled=lambda: cancelled,
        sleep_fn=lambda _: None,
    )
    def cancellable_call():
        raise socket.error("Network dropped")

    cancelled = True
    with pytest.raises(NetworkRetryExhaustedError) as exc_info:
        cancellable_call()

    assert "explicit cancellation" in str(exc_info.value)


def test_conditional_retry_filter():
    import requests

    mock_sleep = MagicMock()

    class Custom404(requests.exceptions.HTTPError):
        def __init__(self):
            resp = MagicMock()
            resp.status_code = 404
            super().__init__(response=resp)

    class Custom429(requests.exceptions.HTTPError):
        def __init__(self):
            resp = MagicMock()
            resp.status_code = 429
            super().__init__(response=resp)

    # 404 should fail immediately without retrying
    @bounded_network_retry(
        max_retries=4,
        retryable_exceptions=(requests.exceptions.HTTPError,),
        retry_condition=lambda exc: getattr(exc.response, "status_code", None) in [429, 500],
        sleep_fn=mock_sleep,
    )
    def call_api(status):
        if status == 404:
            raise Custom404()
        elif status == 429:
            raise Custom429()
        return "ok"

    with pytest.raises(Custom404):
        call_api(404)

    mock_sleep.assert_not_called()
