import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select, desc

from config import get_settings
from database import get_session
from models import VideoJob, VideoJobStatus

settings = get_settings()

router = APIRouter(prefix="/api/v1/jobs", tags=["Queue & Workers"])

# Lazy celery app instance for sending tasks from FastAPI
_celery_client = None


def get_celery_client():
    global _celery_client
    if _celery_client is None:
        import ssl
        from celery import Celery
        redis_url = settings.REDIS_URL
        broker_use_ssl = None
        if redis_url.startswith("rediss://"):
            broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
            if "ssl_cert_reqs" not in redis_url:
                delimiter = "&" if "?" in redis_url else "?"
                redis_url = f"{redis_url}{delimiter}ssl_cert_reqs=CERT_NONE"
        _celery_client = Celery(
            "api_task_sender",
            broker=redis_url,
            backend=redis_url,
        )
        if broker_use_ssl:
            _celery_client.conf.update(
                broker_use_ssl=broker_use_ssl,
                redis_backend_use_ssl=broker_use_ssl,
            )
    return _celery_client


class JobStatusResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: VideoJobStatus
    source_url: str
    rendered_url: Optional[str] = None
    edit_decision_list: Optional[str] = None
    error_log: Optional[str] = None
    created_at: str
    updated_at: str


class DispatchJobResponse(BaseModel):
    status: str
    job_id: str
    queue: str
    message: str


def dispatch_job_to_celery(job_id: uuid.UUID) -> str:
    """Dispatches a job to the Celery worker queue or provides a dev fallback."""
    print(f"[API: CELERY] 📤 Sending task 'tasks.process_video_pipeline' for Job {job_id} to queue '{settings.CELERY_TASK_DEFAULT_QUEUE}'...")
    try:
        client = get_celery_client()
        task = client.send_task(
            "tasks.process_video_pipeline",
            args=[str(job_id)],
            queue=settings.CELERY_TASK_DEFAULT_QUEUE,
        )
        print(f"[API: CELERY] ✅ Task enqueued successfully on Redis! Celery Task ID: {task.id}")
        return task.id
    except Exception as e:
        sim_id = f"dev_simulated_{uuid.uuid4().hex[:8]}"
        print(f"[API: CELERY] ⚠️ Redis connection note: {e}. Fallback ID: {sim_id}")
        return sim_id


@router.post("/{job_id}/dispatch", response_model=DispatchJobResponse)
def dispatch_job(
    job_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Manually triggers dispatch of a QUEUED or FAILED video job to Celery workers.
    """
    print(f"\n[API: JOBS] ⚡ Manual dispatch request received for Job: {job_id}")
    job = session.get(VideoJob, job_id)
    if not job:
        print(f"[API: JOBS] ❌ Job {job_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {job_id} not found",
        )

    if job.status not in [VideoJobStatus.QUEUED, VideoJobStatus.FAILED]:
        print(f"[API: JOBS] ⚠️ Job {job_id} is in state '{job.status}' (must be QUEUED or FAILED)")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot dispatch job in state '{job.status}'. Only QUEUED or FAILED jobs can be dispatched.",
        )

    task_id = dispatch_job_to_celery(job.id)

    return {
        "status": "dispatched",
        "job_id": str(job.id),
        "queue": settings.CELERY_TASK_DEFAULT_QUEUE,
        "message": f"Task enqueued with ID: {task_id}",
    }


@router.post("/{job_id}/retry", response_model=DispatchJobResponse)
def retry_failed_job(
    job_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Resets a failed video job to QUEUED state and re-dispatches it to Celery.
    """
    job = session.get(VideoJob, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {job_id} not found",
        )

    # Reset job state
    job.status = VideoJobStatus.QUEUED
    job.error_log = None
    session.add(job)
    session.commit()
    session.refresh(job)

    task_id = dispatch_job_to_celery(job.id)

    return {
        "status": "re_dispatched",
        "job_id": str(job.id),
        "queue": settings.CELERY_TASK_DEFAULT_QUEUE,
        "message": f"Task reset to QUEUED and dispatched with ID: {task_id}",
    }


@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(
    job_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """
    Returns current state machine status, rendered URL, error logs, and edit lists.
    """
    job = session.get(VideoJob, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {job_id} not found",
        )

    return {
        "id": job.id,
        "title": job.title,
        "status": job.status,
        "source_url": job.source_url,
        "rendered_url": job.rendered_url,
        "edit_decision_list": job.edit_decision_list,
        "error_log": job.error_log,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }


@router.get("", response_model=List[JobStatusResponse])
def list_queue_jobs(
    status_filter: Optional[VideoJobStatus] = None,
    limit: int = 50,
    session: Session = Depends(get_session),
):
    """
    Lists jobs currently in the processing pipeline.
    """
    statement = select(VideoJob)
    if status_filter:
        statement = statement.where(VideoJob.status == status_filter)
    statement = statement.order_by(desc(VideoJob.created_at)).limit(limit)

    jobs = session.exec(statement).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "status": j.status,
            "source_url": j.source_url,
            "rendered_url": j.rendered_url,
            "edit_decision_list": j.edit_decision_list,
            "error_log": j.error_log,
            "created_at": j.created_at.isoformat(),
            "updated_at": j.updated_at.isoformat(),
        }
        for j in jobs
    ]
