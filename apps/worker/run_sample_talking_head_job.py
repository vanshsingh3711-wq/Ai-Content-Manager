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


def run_talking_head_job():
    session = get_session_with_retry()

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

    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_video"))
    if not os.path.exists(sample_dir):
        sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "testing_video"))

    video_candidates = [
        os.path.join(sample_dir, f) for f in os.listdir(sample_dir)
        if f.lower().endswith((".mp4", ".mov", ".mkv")) and not f.startswith(".")
    ]
    if not video_candidates:
        raise FileNotFoundError(f"No video files found in {sample_dir}")

    # Ensure we choose the raw camera take, not any previous rendered output
    raw_candidates = [
        f for f in video_candidates
        if "edited" not in os.path.basename(f).lower()
    ]
    if raw_candidates:
        video_source_path = raw_candidates[0]
    else:
        video_source_path = video_candidates[0]

    settings = {
        "topic": "AI Content Manager App - Talking Head Demo",
        "aspect_ratio": "9:16",
        "video_style": "viral",
        "caption_preset": "tiktok_yellow",
        "ai_model": "DeepSeek-Hybrid",
        "use_3d_avatar": False,
        "USE_GRANULAR_OVERLAYS": True,
    }

    job_id = uuid.uuid4()
    job = VideoJob(
        id=job_id,
        user_id=user.id,
        title="Sample Talking Head Video Edit",
        source_url=video_source_path,
        video_type=VideoType.TALKING_HEAD,
        status=VideoJobStatus.QUEUED,
        settings=settings,
    )

    session.add(job)
    session.commit()
    print(f"[*] Created Video Job: {job_id}")
    print(f"[*] Type: {job.video_type}")
    print(f"[*] Source: {video_source_path}")
    print(f"[*] Ratio: {settings['aspect_ratio']}")
    session.close()

    print("\n[*] Starting execution of process_video_pipeline...")
    pipeline_start = time.time()
    result = process_video_pipeline.apply(args=[str(job_id)])
    output = result.get()
    elapsed = time.time() - pipeline_start

    print(f"\n🎉 PIPELINE FINISHED in {elapsed:.2f}s!")
    print(f"Result: {output}")

    s = get_session_with_retry()
    final_job = s.query(VideoJob).filter(VideoJob.id == job_id).first()
    if final_job:
        print(f"[*] Final Status: {final_job.status}")
        print(f"[*] Rendered URL: {final_job.rendered_url}")
    s.close()

    # Copy final output video to sample_dir / testing_video
    import shutil
    media_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp", str(job_id)))
    rendered_local = os.path.join(media_temp_dir, "final_rendered.mp4")
    if not os.path.exists(rendered_local):
        candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp", "rendered-exports", str(user.id), f"{job_id}_final.mp4"))
        if os.path.exists(candidate):
            rendered_local = candidate

    if os.path.exists(rendered_local):
        old_out = os.path.join(sample_dir, "edited_test_video.mp4")
        phase_b_out = os.path.join(sample_dir, "edited_test_video_phase_b.mp4")
        shutil.copyfile(rendered_local, phase_b_out)
        shutil.copyfile(rendered_local, old_out)
        print(f"[OK] New edited video saved to: {old_out} and {phase_b_out} ({os.path.getsize(old_out) / (1024*1024):.1f} MB)")

    nle_dir = os.path.join(media_temp_dir, "nle_export")
    if os.path.exists(nle_dir):
        zip_files = [os.path.join(nle_dir, f) for f in os.listdir(nle_dir) if f.endswith(".zip")]
        if zip_files:
            dest_zip = os.path.join(sample_dir, f"nle_export_{str(job_id)[:8]}.zip")
            shutil.copyfile(zip_files[0], dest_zip)
            print(f"[OK] NLE project bundle saved to: {dest_zip}")

    return job_id


if __name__ == "__main__":
    run_talking_head_job()
