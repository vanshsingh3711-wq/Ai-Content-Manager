from contextlib import asynccontextmanager
from typing import Dict
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from config import get_settings
from database import get_session, init_db
from models import VideoJob, User
from routers import storage, videos, jobs

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema on startup
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated AI Video Editing & Social Media Publishing Backend API",
    lifespan=lifespan,
)

# Configure Permissive CORS Middleware for Local & Network Dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(storage.router)
app.include_router(videos.router)
app.include_router(jobs.router)


@app.get("/health", tags=["System"])
def health_check() -> Dict[str, str]:
    """Health check endpoint for system monitoring and frontend verification."""
    return {
        "status": "healthy",
        "service": "api",
        "environment": settings.ENVIRONMENT,
        "queue": settings.CELERY_TASK_DEFAULT_QUEUE,
    }


@app.get("/", tags=["System"])
def root() -> Dict[str, str]:
    """Root endpoint."""
    return {
        "message": "AI Content Manager API is running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "presigned_url": "/api/v1/storage/presigned-url",
            "create_video_job": "/api/v1/videos/create-job",
            "list_videos": "/api/v1/videos",
            "list_queue_jobs": "/api/v1/jobs",
            "dispatch_job": "/api/v1/jobs/{job_id}/dispatch",
            "job_status": "/api/v1/jobs/{job_id}/status",
        }
    }


@app.get("/api/v1/system/stats", tags=["System"])
def system_stats(session: Session = Depends(get_session)) -> Dict[str, int]:
    """Basic system statistics."""
    users_count = len(session.exec(select(User)).all())
    jobs_count = len(session.exec(select(VideoJob)).all())
    return {
        "total_users": users_count,
        "total_video_jobs": jobs_count,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
