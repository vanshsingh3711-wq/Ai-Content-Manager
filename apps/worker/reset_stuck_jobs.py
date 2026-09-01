"""Reset stuck jobs to QUEUED state."""
import sys, os
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob, VideoJobStatus

session = next(get_session())

# Find jobs stuck in TRANSCRIBING or AI_DIRECTING or RENDERING
stuck_jobs = session.query(VideoJob).filter(
    VideoJob.status.in_([
        VideoJobStatus.TRANSCRIBING, 
        VideoJobStatus.AI_DIRECTING, 
        VideoJobStatus.RENDERING
    ])
).all()

print(f"Found {len(stuck_jobs)} stuck jobs.")

for job in stuck_jobs:
    print(f"Resetting job {job.id} (currently {job.status}) -> QUEUED")
    job.status = VideoJobStatus.QUEUED
    job.error_log = None
    session.add(job)

session.commit()
session.close()
print("Done! The Celery worker will now pick them up and process them.")
