import uuid
from typing import Optional
from datetime import datetime, timezone
from config import get_worker_db
from models import VideoJob, VideoJobStatus

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

def set_job_status_downloading(job_uuid: uuid.UUID):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.DOWNLOADING
            job.error_log = None
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_transcribing(job_uuid: uuid.UUID):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.TRANSCRIBING
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_ai_directing(job_uuid: uuid.UUID):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.AI_DIRECTING
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_rendering(job_uuid: uuid.UUID):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.RENDERING
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_publishing(job_uuid: uuid.UUID):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.PUBLISHING
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_completed(job_uuid: uuid.UUID, final_video_url: str, edits_json_str: str):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.COMPLETED
            job.rendered_url = final_video_url
            job.edit_decision_list = edits_json_str
            job.error_log = None
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()

def set_job_status_failed(job_uuid: uuid.UUID, err_stack: str):
    session = get_worker_db()
    try:
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.FAILED
            job.error_log = err_stack
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
    finally:
        session.close()
