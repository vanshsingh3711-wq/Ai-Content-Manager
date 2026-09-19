import os
import shutil
import time
import requests
import socket
from worker_logger import log_info, log_success, log_warning, log_error

def stage_raw_video(job_source_url: str, raw_video_path: str, temp_dir: str):
    """
    Stages the raw video file from a given URL to the local disk.
    Supports HTTP streaming, local copies, and S3/R2 object keys.
    """
    staged = False

    # 1. Check if it's already a valid local path
    if os.path.exists(job_source_url):
        shutil.copyfile(job_source_url, raw_video_path)
        staged = True
        log_success(f"Staged local source file: {job_source_url} ({os.path.getsize(raw_video_path)} bytes)")
        
    # 2. Check if it's a Cloudflare R2 / S3 key
    elif "key=" in job_source_url:
        raw_key = job_source_url.split("key=")[-1]
        local_raw = os.path.join(temp_dir, raw_key.replace("/", os.sep))
        if os.path.exists(local_raw) and os.path.getsize(local_raw) > 0:
            shutil.copyfile(local_raw, raw_video_path)
            staged = True
            log_success(f"Staged uploaded video from local storage: {local_raw} ({os.path.getsize(local_raw)} bytes)")

    # 3. HTTP Streaming Download
    if not staged and (job_source_url.startswith("http://") or job_source_url.startswith("https://")):
        log_info(f"Streaming video bytes from HTTP endpoint...")
        attempt = 1
        while True:
            try:
                res = requests.get(job_source_url, timeout=30, stream=True)
                if res.status_code == 200:
                    with open(raw_video_path, "wb") as f:
                        for chunk in res.iter_content(chunk_size=16384):
                            f.write(chunk)
                    if os.path.getsize(raw_video_path) > 1024:
                        staged = True
                        log_success(f"Downloaded video stream: {os.path.getsize(raw_video_path)} bytes")
                break
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, socket.error) as e:
                log_warning(f"Network error downloading video: Waiting 10s for internet to return (Attempt {attempt})...")
                time.sleep(10)
                attempt += 1

    # 4. Failure validation
    if not staged:
        log_error(f"FAILED to stage raw video!")
        log_error(f"  Source URL: {job_source_url}")
        if "key=" in job_source_url:
            raw_key = job_source_url.split("key=")[-1]
            local_raw = os.path.join(temp_dir, raw_key.replace("/", os.sep))
            log_error(f"  Expected local path: {local_raw}")
            log_error(f"  File exists: {os.path.exists(local_raw)}")
            if os.path.exists(local_raw):
                log_error(f"  File size: {os.path.getsize(local_raw)} bytes")
        raise FileNotFoundError(
            f"Could not stage raw video. Source URL: {job_source_url}. "
            f"The file was not found on disk and could not be downloaded."
        )

    # 5. Size validation
    staged_size = os.path.getsize(raw_video_path)
    if staged_size < 1024:
        log_error(f"Staged video is only {staged_size} bytes — not a real video file!")
        raise ValueError(
            f"Staged video is only {staged_size} bytes. "
            f"The upload may have been corrupted or incomplete."
        )

    log_info(f"Staged video validated: {staged_size:,} bytes ({staged_size / 1024 / 1024:.2f} MB)")
