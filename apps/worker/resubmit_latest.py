import sys, os
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob, VideoJobStatus
from tasks.video_pipeline import process_video_pipeline

session = next(get_session())
job = session.query(VideoJob).order_by(VideoJob.created_at.desc()).first()

print(f"Resubmitting latest job: {job.id}")
job.status = VideoJobStatus.QUEUED
session.add(job)
session.commit()

process_video_pipeline.delay(str(job.id))
print("Job resubmitted successfully!")
