"""Test script: Run the pipeline on the real 15.71 MB uploaded video."""
import sys, os, time
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob, VideoJobStatus

session = next(get_session())
# Get the job with the real 15.71 MB video
job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()

if not job:
    print("Job not found!")
    sys.exit(1)

job_id = str(job.id)
print(f"=== Resetting job {job_id} to QUEUED for re-processing ===")
print(f"  Source: {job.source_url}")
job.status = VideoJobStatus.QUEUED
job.error_log = None
session.add(job)
session.commit()
session.close()

print(f"\n=== Running pipeline... ===\n")
start = time.time()

from tasks.video_pipeline import process_video_pipeline
result = process_video_pipeline.apply(args=[job_id])
output = result.get()

elapsed = time.time() - start
print(f"\n=== PIPELINE COMPLETE in {elapsed:.1f}s ===")
print(f"Result: {output}")
