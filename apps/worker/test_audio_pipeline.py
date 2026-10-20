"""Test script: Run the pipeline on the real audio file."""
import sys, os, time, uuid
sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob, VideoJobStatus, VideoType
from datetime import datetime, timezone

session = next(get_session())

audio_path = os.path.abspath("sample_video/same_audio.mp3")

# Get an existing job's user_id to ensure foreign key constraint passes
existing_job = session.query(VideoJob).first()
if not existing_job:
    print("No existing jobs found to copy user_id from!")
    sys.exit(1)
valid_user_id = existing_job.user_id

# Read model from args if provided
ai_model_pref = sys.argv[1] if len(sys.argv) > 1 else "Claude Sonnet 5"

# Create a new VideoJob mimicking the frontend submission
job = VideoJob(
    user_id=valid_user_id,
    title=f"Test Audio Pipeline ({ai_model_pref})",
    source_url="",
    video_type=VideoType.FACELESS_SHORT,
    status=VideoJobStatus.QUEUED,
    settings={
        "topic": "AI Voice Video Test",
        "script": "", # Empty since we want it to transcribe the audio
        "audio_url": audio_path,
        "niche": "Tech",
        "theme": "dark",
        "aspect_ratio": "9:16",
        "mood": "Professional",
        "ai_model": ai_model_pref,
    },
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)
session.add(job)
session.commit()
session.refresh(job)

job_id = str(job.id)
session.close()

print(f"\n=== Running pipeline for job {job_id}... ===\n")
start = time.time()

from tasks.video_pipeline import process_video_pipeline
result = process_video_pipeline.apply(args=[job_id])
output = result.get()

elapsed = time.time() - start
print(f"\n=== PIPELINE COMPLETE in {elapsed:.1f}s ===")
print(f"Result: {output}")
