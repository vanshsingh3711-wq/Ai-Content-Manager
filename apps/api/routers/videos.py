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

settings = get_settings()

router = APIRouter(prefix="/api/v1/videos", tags=["Videos & Jobs"])


class CreateVideoJobRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    source_url: str = Field(..., description="S3/R2 direct upload URI")
    video_type: VideoType = Field(default=VideoType.TALKING_HEAD)
    clerk_id: Optional[str] = Field("user_default", description="Clerk user ID")
    email: Optional[str] = Field("user@example.com", description="User email")


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
