import uuid
import time
from typing import Callable, Optional
from datetime import datetime, timezone
from config import get_worker_db
from models import VideoJob, VideoJobStatus


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _update_job(job_uuid: uuid.UUID, update_fn: Callable[[VideoJob], None], max_attempts: int = 3, delay: float = 1.0) -> None:
    last_err = None
    for attempt in range(max_attempts):
        session = get_worker_db()
        try:
            job = session.get(VideoJob, job_uuid)
            if job:
                update_fn(job)
                job.updated_at = get_utc_now()
                session.add(job)
                session.commit()
            return
        except Exception as e:
            last_err = e
            if attempt < max_attempts - 1:
                time.sleep(delay * (attempt + 1))
        finally:
            try:
                session.close()
            except Exception:
                pass
    if last_err:
        raise last_err


def set_job_status_downloading(job_uuid: uuid.UUID):
    def update(job: VideoJob):
        job.status = VideoJobStatus.DOWNLOADING
        job.error_log = None
    _update_job(job_uuid, update)


def set_job_status_transcribing(job_uuid: uuid.UUID):
    def update(job: VideoJob):
        job.status = VideoJobStatus.TRANSCRIBING
    _update_job(job_uuid, update)


def set_job_status_ai_directing(job_uuid: uuid.UUID):
    def update(job: VideoJob):
        job.status = VideoJobStatus.AI_DIRECTING
    _update_job(job_uuid, update)


def set_job_status_rendering(job_uuid: uuid.UUID):
    def update(job: VideoJob):
        job.status = VideoJobStatus.RENDERING
    _update_job(job_uuid, update)


def set_job_status_publishing(job_uuid: uuid.UUID):
    def update(job: VideoJob):
        job.status = VideoJobStatus.PUBLISHING
    _update_job(job_uuid, update)


def set_job_status_completed(job_uuid: uuid.UUID, final_video_url: str, edits_json_str: str):
    def update(job: VideoJob):
        job.status = VideoJobStatus.COMPLETED
        job.rendered_url = final_video_url
        job.edit_decision_list = edits_json_str
        job.error_log = None
    _update_job(job_uuid, update)


def set_job_status_failed(job_uuid: uuid.UUID, err_stack: str):
    def update(job: VideoJob):
        job.status = VideoJobStatus.FAILED
        job.error_log = err_stack
    _update_job(job_uuid, update)
