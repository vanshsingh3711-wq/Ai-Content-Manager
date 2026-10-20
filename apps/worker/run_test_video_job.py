import os
import sys
import uuid
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import get_session
from models import VideoJob, VideoJobStatus, VideoType, User
from tasks.video_pipeline import process_video_pipeline


def get_session_with_retry(max_attempts: int = 3, delay: float = 2.0):
    for attempt in range(max_attempts):
        try:
            return next(get_session())
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            print(f"[*] DB connection attempt {attempt + 1} retrying in {delay}s...")
            time.sleep(delay)


def create_and_run_test_video():
    session = get_session_with_retry()

    # Ensure a default user exists
    user = session.query(User).filter(User.clerk_id == "user_default").first()
    if not user:
        user = User(
            clerk_id="user_default",
            email="test@example.com",
            first_name="Test",
            last_name="User",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    test_script = (
        "The secret to viral videos isn't luck. It's aggressive visual pacing. "
        "Over seventy-three percent of viewers swipe away within the first three seconds if nothing changes on screen. "
        "To keep retention above eighty percent, creators use three essential rules: "
        "First, cut dead silence and eliminate awkward pauses. "
        "Second, introduce dynamic motion graphic cards every few seconds. "
        "And third, layer micro-sound design behind every visual cut. "
        "Automated video editing is no longer a luxury. It is the new creative standard."
    )

    settings = {
        "topic": "The Science of High Retention Videos",
        "script": test_script,
        "character": "sarah",
        "niche": "Technology",
        "theme": "dark",
        "aspect_ratio": "9:16",
        "mood": "Energetic",
        "video_style": "viral",
        "ai_model": "DeepSeek-Chat",
        "use_3d_avatar": False,
        "caption_preset": "tiktok_yellow",
        "USE_GRANULAR_OVERLAYS": True,
    }

    job_id = uuid.uuid4()
    job = VideoJob(
        id=job_id,
        user_id=user.id,
        title="The Science of High Retention Videos",
        source_url="",
        video_type=VideoType.FACELESS_SHORT,
        status=VideoJobStatus.QUEUED,
        settings=settings,
    )

    session.add(job)
    session.commit()
    print(f"[*] Created Video Job: {job_id}")
    print(f"[*] Title: {job.title}")
    print(f"[*] Model: {settings['ai_model']}")
    print(f"[*] Ratio: {settings['aspect_ratio']}")
    session.close()

    print("\n[*] Running pipeline task with latest code...")
    result = process_video_pipeline.apply(args=[str(job_id)])
    output = result.get()
    
    print("\n🎉 PIPELINE FINISHED!")
    print(f"Result: {output}")

    s = get_session_with_retry()
    final_job = s.query(VideoJob).filter(VideoJob.id == job_id).first()
    if final_job:
        print(f"[*] Final Status: {final_job.status}")
        print(f"[*] Rendered URL: {final_job.rendered_url}")
        
        # Copy to sample_video/faceless_test_video.mp4 for easy user access
        sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_video"))
        target_local_mp4 = os.path.join(sample_dir, "faceless_test_video.mp4")
        if output and isinstance(output, dict) and output.get("output_path"):
            prod_path = output["output_path"]
            if os.path.exists(prod_path):
                import shutil
                shutil.copyfile(prod_path, target_local_mp4)
                print(f"[*] Copied final video to: {target_local_mp4}")
    s.close()


if __name__ == "__main__":
    create_and_run_test_video()
