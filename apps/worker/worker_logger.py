import sys
import os
from datetime import datetime

# Configure UTF-8 encoding for Windows standard output safely
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def log_header(title: str, job_id: str = ""):
    timestamp = datetime.now().strftime("%H:%M:%S")
    separator = "=" * 70
    print(f"\n{separator}")
    print(f" [*] [AI VIDEO PIPELINE] {title.upper()}")
    if job_id:
        print(f"     Job ID: {job_id} | Timestamp: {timestamp}")
    print(f"{separator}")
    sys.stdout.flush()


def log_step(step_num: int, total_steps: int, title: str, details: str = ""):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"\n[STEP {step_num}/{total_steps}] >>> {title.upper()} ({timestamp}) <<<")
    if details:
        print(f"  | Details: {details}")
    sys.stdout.flush()


def log_info(msg: str):
    print(f"  [i] {msg}")
    sys.stdout.flush()


def log_success(msg: str):
    print(f"  [OK] {msg}")
    sys.stdout.flush()


def log_warning(msg: str):
    print(f"  [WARN] {msg}")
    sys.stdout.flush()


def log_error(msg: str):
    print(f"  [ERROR] {msg}")
    sys.stdout.flush()


def log_step_end(step_name: str, duration_sec: float = 0.0):
    dur_str = f" in {duration_sec:.2f}s" if duration_sec > 0 else ""
    print(f"[STEP COMPLETE] {step_name}{dur_str}\n")
    sys.stdout.flush()


def log_summary(job_id: str, title: str, total_time: float, edits_count: int, export_url: str):
    separator = "=" * 70
    print(f"\n{separator}")
    print(f" [SUCCESS] Video Job Processing Succeeded!")
    print(f"{separator}")
    print(f" Title:            {title}")
    print(f" Job ID:           {job_id}")
    print(f" Total Time:       {total_time:.2f}s")
    print(f" AI Edits Applied: {edits_count}")
    print(f" Stream URL:       {export_url}")
    print(f"{separator}\n")
    sys.stdout.flush()

import time

class PipelineStep:
    """Context manager to automate logging step start, end, and timing."""
    def __init__(self, step_num: int, total_steps: int, title: str, details: str = ""):
        self.step_num = step_num
        self.total_steps = total_steps
        self.title = title
        self.details = details
        self.start_time = 0.0

    def __enter__(self):
        self.start_time = time.time()
        log_step(self.step_num, self.total_steps, self.title, self.details)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        if exc_type is None:
            log_step_end(self.title, duration)
        else:
            log_error(f"Step '{self.title}' failed after {duration:.2f}s: {exc_val}")
        return False  # Propagate exceptions
