from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select, desc

from config import get_settings
from database import get_session
from models import User, VideoJob, VideoJobStatus, VideoType
from routers.jobs import dispatch_job_to_celery
from storage import get_presigned_url_from_full_url

settings = get_settings()

router = APIRouter(prefix="/api/v1/videos", tags=["Videos & Jobs"])


class CreateVideoJobRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    source_url: str = Field(default="", description="S3/R2 direct upload URI. Empty for faceless videos.")
    video_type: VideoType = Field(default=VideoType.TALKING_HEAD)
    clerk_id: Optional[str] = Field("user_default", description="Clerk user ID")
    email: Optional[str] = Field("user@example.com", description="User email")
    settings: Optional[dict] = Field(default=None, description="Video style, aspect ratio, and editing preferences")


class VideoJobResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    source_url: str
    rendered_url: Optional[str] = None
    video_type: VideoType
    status: VideoJobStatus
    edit_decision_list: Optional[str] = None
    error_log: Optional[str] = None
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class UpdateJobStatusRequest(BaseModel):
    status: VideoJobStatus
    rendered_url: Optional[str] = None
    edit_decision_list: Optional[str] = None
    error_log: Optional[str] = None


@router.post("/create-job", response_model=VideoJobResponse, status_code=status.HTTP_201_CREATED)
def create_video_job(
    payload: CreateVideoJobRequest,
    session: Session = Depends(get_session),
):
    """
    Registers a new video job in PostgreSQL once direct R2/S3 upload completes.
    Initializes the state machine in status QUEUED and dispatches to Celery.
    """
    clerk_id = payload.clerk_id or "user_default"
    email = payload.email or "user@example.com"
    print(f"\n[API: VIDEOS] 🚀 Received Create Job Request: '{payload.title}' ({payload.video_type})")
    print(f"[API: VIDEOS] 🔗 Source URL: {payload.source_url}")

    # Find or create user
    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
    if not user:
        user = User(
            clerk_id=clerk_id,
            email=email,
            created_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"[API: VIDEOS] 👤 Created new User profile: {user.id} ({email})")

    # Create VideoJob
    job = VideoJob(
        user_id=user.id,
        title=payload.title,
        source_url=payload.source_url,
        video_type=payload.video_type,
        status=VideoJobStatus.QUEUED,
        settings=payload.settings,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    print(f"[API: VIDEOS] ✅ Registered VideoJob {job.id} with status QUEUED")

    # Auto-dispatch to Celery worker if enabled
    if settings.AUTO_DISPATCH_JOBS:
        print(f"[API: VIDEOS] ⚡ Auto-dispatching job {job.id} to Celery queue '{settings.CELERY_TASK_DEFAULT_QUEUE}'...")
        dispatch_job_to_celery(job.id)

    # Sign the urls before returning
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.get("", response_model=List[VideoJobResponse])
def list_video_jobs(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
):
    """Lists all video processing jobs ordered by creation date."""
    statement = select(VideoJob).order_by(desc(VideoJob.created_at)).offset(offset).limit(limit)
    jobs = session.exec(statement).all()
    print(f"[API: VIDEOS] 📋 Listing {len(jobs)} video jobs from database")
    # Sign urls
    for j in jobs:
        j.source_url = get_presigned_url_from_full_url(j.source_url)
        j.rendered_url = get_presigned_url_from_full_url(j.rendered_url)
    return jobs


@router.get("/{video_id}", response_model=VideoJobResponse)
def get_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Retrieves a single video job and its current processing status."""
    job = session.get(VideoJob, video_id)
    if not job:
        print(f"[API: VIDEOS] ❌ Video job {video_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    print(f"[API: VIDEOS] 🔍 Retrieved job {job.id}: Status={job.status}")
    # Sign urls
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.patch("/{video_id}/status", response_model=VideoJobResponse)
def update_video_job_status(
    video_id: uuid.UUID,
    payload: UpdateJobStatusRequest,
    session: Session = Depends(get_session),
):
    """Updates the state machine status of a video job (used by background workers)."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    
    job.status = payload.status
    if payload.rendered_url is not None:
        job.rendered_url = payload.rendered_url
    if payload.edit_decision_list is not None:
        job.edit_decision_list = payload.edit_decision_list
    if payload.error_log is not None:
        job.error_log = payload.error_log
        
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()
    session.refresh(job)
    
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job

@router.post("/{video_id}/retry", response_model=VideoJobResponse)
def retry_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Retries a failed video job by resetting its status and dispatching it to Celery."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    if job.status != VideoJobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only failed jobs can be retried. Current status is {job.status}",
        )
    
    # Reset job state
    job.status = VideoJobStatus.QUEUED
    job.error_log = None
    job.rendered_url = None
    job.updated_at = datetime.now(timezone.utc)
    
    session.add(job)
    session.commit()
    session.refresh(job)
    print(f"[API: VIDEOS] 🔄 Retrying VideoJob {job.id} (Status reset to QUEUED)")
    
    if settings.AUTO_DISPATCH_JOBS:
        print(f"[API: VIDEOS] ⚡ Auto-dispatching job {job.id} to Celery queue '{settings.CELERY_TASK_DEFAULT_QUEUE}'...")
        dispatch_job_to_celery(job.id)
        
    job.source_url = get_presigned_url_from_full_url(job.source_url)
    job.rendered_url = get_presigned_url_from_full_url(job.rendered_url)
    return job


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_job(
    video_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    """Deletes a video job from PostgreSQL."""
    job = session.get(VideoJob, video_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job with ID {video_id} not found",
        )
    session.delete(job)
    session.commit()
    return None
