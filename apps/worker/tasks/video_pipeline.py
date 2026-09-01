import os
import shutil
import traceback
import uuid
import json
from datetime import datetime, timezone
import time
from celery import Task
from celery_app import celery_app
from config import get_worker_db, get_worker_settings

# Import models from API package
from models import VideoJob, VideoJobStatus, User

# Import Services (Phases 4 & 5)
from services.media_extractor import extract_audio_track
from services.transcriber import transcribe_and_compress
from services.ai_director import generate_edit_decisions
from services.asset_manager import fetch_broll_assets
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline
from services.publisher import upload_rendered_video_to_storage, publish_to_youtube_shorts
from worker_logger import log_header, log_step, log_step_end, log_info, log_success, log_warning, log_error, log_summary

settings = get_worker_settings()


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


@celery_app.task(bind=True, name="tasks.process_video_pipeline", max_retries=2)
def process_video_pipeline(self: Task, job_id: str) -> dict:
    """
    Master background video pipeline execution task.
    Orchestrates the entire end-to-end editing lifecycle:
    DOWNLOADING -> TRANSCRIBING -> AI_DIRECTING -> RENDERING -> PUBLISHING -> COMPLETED.
    """
    pipeline_start = time.time()
    log_header("AUTOMATED VIDEO EDITING PIPELINE", job_id=job_id)
    session = get_worker_db()
    job_uuid = uuid.UUID(job_id) if isinstance(job_id, str) else job_id
    temp_job_dir = os.path.join(settings.TEMP_DIR, str(job_uuid))

    try:
        # 1. Fetch Job from PostgreSQL
        job = session.get(VideoJob, job_uuid)
        if not job:
            error_msg = f"Job {job_id} not found in database"
            log_error(error_msg)
            return {"status": "error", "message": error_msg}

        # 2. Idempotency Check
        if job.status not in [VideoJobStatus.QUEUED, VideoJobStatus.FAILED]:
            log_info(f"Job {job_id} is already in state '{job.status}'. Skipping idempotently.")
            return {"status": "skipped", "current_status": job.status}

        log_info(f"Target Video Job: '{job.title}' | Type: {job.video_type} | Owner: {job.user_id}")

        # Prepare workspace paths
        os.makedirs(temp_job_dir, exist_ok=True)
        assets_dir = os.path.join(temp_job_dir, "assets")
        raw_video_path = os.path.join(temp_job_dir, "raw_source.mp4")
        extracted_wav_path = os.path.join(temp_job_dir, "extracted_audio.wav")
        subtitle_ass_path = os.path.join(temp_job_dir, "subtitles.ass")
        rendered_mp4_path = os.path.join(temp_job_dir, "final_rendered.mp4")

        # -------------------------------------------------------------
        # Step 1: DOWNLOADING (Raw media ingest from S3 / Cloudflare R2)
        # -------------------------------------------------------------
        step1_start = time.time()
        log_step(1, 6, "DOWNLOADING & RAW MEDIA INGEST", f"Source: {job.source_url}")
        job.status = VideoJobStatus.DOWNLOADING
        job.error_log = None
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        # Stage raw video file
        staged = False
        if os.path.exists(job.source_url):
            shutil.copyfile(job.source_url, raw_video_path)
            staged = True
            log_success(f"Staged local source file: {job.source_url} ({os.path.getsize(raw_video_path)} bytes)")
        elif "key=" in job.source_url:
            raw_key = job.source_url.split("key=")[-1]
            local_raw = os.path.join(settings.TEMP_DIR, raw_key.replace("/", os.sep))
            if os.path.exists(local_raw) and os.path.getsize(local_raw) > 0:
                shutil.copyfile(local_raw, raw_video_path)
                staged = True
                log_success(f"Staged uploaded video from local storage: {local_raw} ({os.path.getsize(local_raw)} bytes)")

        if not staged and (job.source_url.startswith("http://") or job.source_url.startswith("https://")):
            try:
                import requests
                log_info(f"Streaming video bytes from HTTP endpoint...")
                res = requests.get(job.source_url, timeout=30, stream=True)
                if res.status_code == 200:
                    with open(raw_video_path, "wb") as f:
                        for chunk in res.iter_content(chunk_size=16384):
                            f.write(chunk)
                    if os.path.getsize(raw_video_path) > 1024:
                        staged = True
                        log_success(f"Downloaded video stream: {os.path.getsize(raw_video_path)} bytes")
            except Exception as e:
                log_warning(f"Download stream note: {e}")

        if not staged:
            log_error(f"FAILED to stage raw video!")
            log_error(f"  Source URL: {job.source_url}")
            if "key=" in job.source_url:
                raw_key = job.source_url.split("key=")[-1]
                local_raw = os.path.join(settings.TEMP_DIR, raw_key.replace("/", os.sep))
                log_error(f"  Expected local path: {local_raw}")
                log_error(f"  File exists: {os.path.exists(local_raw)}")
                if os.path.exists(local_raw):
                    log_error(f"  File size: {os.path.getsize(local_raw)} bytes")
            raise FileNotFoundError(
                f"Could not stage raw video for job {job.id}. "
                f"Source URL: {job.source_url}. "
                f"The file was not found on disk and could not be downloaded."
            )

        # Validate the staged file is a real video
        staged_size = os.path.getsize(raw_video_path)
        if staged_size < 1024:
            log_error(f"Staged video is only {staged_size} bytes — not a real video file!")
            raise ValueError(
                f"Staged video is only {staged_size} bytes. "
                f"The upload may have been corrupted or incomplete."
            )

        log_info(f"Staged video validated: {staged_size:,} bytes ({staged_size / 1024 / 1024:.2f} MB)")
        log_step_end("INGEST & STAGING", time.time() - step1_start)

        # -------------------------------------------------------------
        # Step 2: TRANSCRIBING (Phase 4 - faster-whisper)
        # -------------------------------------------------------------
        step2_start = time.time()
        log_step(2, 6, "AUDIO EXTRACTION & SPEECH-TO-TEXT", "faster-whisper (int8 CPU / silence segmentation)")
        job.status = VideoJobStatus.TRANSCRIBING
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        # 2a. Extract Audio Track to 16kHz WAV
        extract_audio_track(raw_video_path, extracted_wav_path, sample_rate=16000, channels=1)

        # 2b. Transcribe speech with silence chunking and bracket compression
        bracketed_transcript, timestamp_map = transcribe_and_compress(
            audio_path=extracted_wav_path,
            silence_threshold_sec=0.8,
            model_size="small",
        )
        log_step_end("SPEECH-TO-TEXT", time.time() - step2_start)

        # -------------------------------------------------------------
        # Step 3: AI_DIRECTING (Phase 4 - Gemini 3.6 Flash)
        # -------------------------------------------------------------
        step3_start = time.time()
        log_step(3, 6, "AI DIRECTOR REASONING", "Google Gemini 3.6 Flash structured EDL synthesis")
        job.status = VideoJobStatus.AI_DIRECTING
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        # Query LLM to generate strict Pydantic JSON edit decisions
        edit_decision_list = generate_edit_decisions(bracketed_transcript)
        edits_json_str = json.dumps({
            "bracketed_transcript": bracketed_transcript,
            "edits": [e.model_dump() for e in edit_decision_list.edits],
            "timestamp_map": timestamp_map,
        }, indent=2)

        # Persist intermediate EDL to database for transparency
        job.edit_decision_list = edits_json_str
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)
        log_step_end("AI DIRECTOR", time.time() - step3_start)

        # -------------------------------------------------------------
        # Step 4: RENDERING (Phase 5 - Asset Manager + Subtitles + FFmpeg)
        # -------------------------------------------------------------
        step4_start = time.time()
        log_step(4, 6, "ASSET SOURCING & DYNAMIC SUBTITLES", "Pexels Video API & ASS Karaoke formatting")
        job.status = VideoJobStatus.RENDERING
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        # 4a. Download requested B-roll video assets from Pexels API
        edits_dicts = [e.model_dump() for e in edit_decision_list.edits]
        broll_map = fetch_broll_assets(edits_dicts, output_dir=assets_dir)

        # 4b. Generate word-level styled .ass subtitle file with TikTok yellow highlighting
        generate_ass_subtitles(
            timestamp_map=timestamp_map,
            output_ass_path=subtitle_ass_path,
            font_size=50,
            primary_color="&H00FFFFFF",     # White
            highlight_color="&H0000FFFF",   # TikTok Yellow
        )
        log_step_end("ASSETS & SUBTITLES", time.time() - step4_start)

        # -------------------------------------------------------------
        # Step 5: FFMPEG COMPOSITOR (Phase 5 - Hardware Accelerated Encoding)
        # -------------------------------------------------------------
        step5_start = time.time()
        log_step(5, 6, "FFMPEG VIDEO COMPOSITING", "Assembly of cuts, B-roll, zooms, captions into 1080x1920 MP4")
        render_video_pipeline(
            raw_video_path=raw_video_path,
            output_mp4_path=rendered_mp4_path,
            subtitle_ass_path=subtitle_ass_path,
            broll_map=broll_map,
            edits=edits_dicts,
            timestamp_map=timestamp_map,
        )
        log_step_end("FFMPEG RENDERING", time.time() - step5_start)

        # -------------------------------------------------------------
        # Step 6: PUBLISHING & COMPLETION (Phase 5 - Cloudflare R2 / YouTube)
        # -------------------------------------------------------------
        step6_start = time.time()
        log_step(6, 6, "STORAGE EXPORT & SOCIAL PUBLISHING", "Persistent stream storage and YouTube Shorts distribution")
        job.status = VideoJobStatus.PUBLISHING
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        # 6a. Upload final rendered MP4 to Cloud Storage or Local Stream Store
        final_video_url = upload_rendered_video_to_storage(
            local_mp4_path=rendered_mp4_path,
            job_id=str(job.id),
            user_id=str(job.user_id),
        )

        # 6b. Publish to YouTube Shorts (if channel linked)
        publish_to_youtube_shorts(
            video_path=rendered_mp4_path,
            title=job.title,
            description=f"{job.title} #Shorts #AI #ContentCreator",
            access_token=None,
        )

        # 6c. Final State Transition: COMPLETED
        total_duration = time.time() - pipeline_start
        job.status = VideoJobStatus.COMPLETED
        job.rendered_url = final_video_url
        job.error_log = None
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        session.refresh(job)

        log_step_end("EXPORT & PUBLISHING", time.time() - step6_start)
        log_summary(
            job_id=str(job.id),
            title=job.title,
            total_time=total_duration,
            edits_count=len(edit_decision_list.edits),
            export_url=final_video_url,
        )

        return {
            "status": "success",
            "job_id": str(job.id),
            "rendered_url": final_video_url,
            "edit_count": len(edit_decision_list.edits),
            "duration_sec": round(total_duration, 2),
        }

    except Exception as exc:
        err_stack = traceback.format_exc()
        log_error(f"Pipeline failure for Job {job_id}:\n{err_stack}")

        try:
            job = session.get(VideoJob, job_uuid)
            if job:
                job.status = VideoJobStatus.FAILED
                job.error_log = err_stack
                job.updated_at = get_utc_now()
                session.add(job)
                session.commit()
        except Exception as db_err:
            log_error(f"Database error while recording failure: {db_err}")

        # Retry transient errors up to max_retries
        raise self.retry(exc=exc, countdown=10)

    finally:
        session.close()
        # Clean up temporary staging workspace
        shutil.rmtree(temp_job_dir, ignore_errors=True)
