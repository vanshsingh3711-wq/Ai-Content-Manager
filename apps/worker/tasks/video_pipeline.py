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
from services.visual_analysis import analyze_visual_context, UnifiedAnalysis
from services.blueprint_validator import validate_blueprint, format_validation_report
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

        job_title = job.title
        job_video_type = job.video_type
        job_user_id = str(job.user_id)
        job_source_url = job.source_url
        job_id_str = str(job.id)

        log_info(f"Target Video Job: '{job_title}' | Type: {job_video_type} | Owner: {job_user_id}")

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
        log_step(1, 6, "DOWNLOADING & RAW MEDIA INGEST", f"Source: {job_source_url}")
        
        # Update status to signify task start, then immediately close DB
        job.status = VideoJobStatus.DOWNLOADING
        job.error_log = None
        job.updated_at = get_utc_now()
        session.add(job)
        session.commit()
        
        # CLOSE DATABASE CONNECTION BEFORE HEAVY AI WORK
        session.close()

        # Stage raw video file
        staged = False
        if os.path.exists(job_source_url):
            shutil.copyfile(job_source_url, raw_video_path)
            staged = True
            log_success(f"Staged local source file: {job_source_url} ({os.path.getsize(raw_video_path)} bytes)")
        elif "key=" in job_source_url:
            raw_key = job_source_url.split("key=")[-1]
            local_raw = os.path.join(settings.TEMP_DIR, raw_key.replace("/", os.sep))
            if os.path.exists(local_raw) and os.path.getsize(local_raw) > 0:
                shutil.copyfile(local_raw, raw_video_path)
                staged = True
                log_success(f"Staged uploaded video from local storage: {local_raw} ({os.path.getsize(local_raw)} bytes)")

        if not staged and (job_source_url.startswith("http://") or job_source_url.startswith("https://")):
            import requests
            import socket
            log_info(f"Streaming video bytes from HTTP endpoint...")
            attempt = 1
            while True:
                try:
                    res = requests.get(job_source_url, timeout=30, stream=True)
                    if res.status_code == 200:
                        with open(raw_video_path, "wb") as f:
                            for chunk in res.iter_content(chunk_size=16384):
                                f.write(chunk)
                        if os.path.getsize(raw_video_path) > 1024:
                            staged = True
                            log_success(f"Downloaded video stream: {os.path.getsize(raw_video_path)} bytes")
                    break
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, socket.error) as e:
                    log_warning(f"Network error downloading video: Waiting 10s for internet to return (Attempt {attempt})...")
                    time.sleep(10)
                    attempt += 1

        if not staged:
            log_error(f"FAILED to stage raw video!")
            log_error(f"  Source URL: {job_source_url}")
            if "key=" in job_source_url:
                raw_key = job_source_url.split("key=")[-1]
                local_raw = os.path.join(settings.TEMP_DIR, raw_key.replace("/", os.sep))
                log_error(f"  Expected local path: {local_raw}")
                log_error(f"  File exists: {os.path.exists(local_raw)}")
                if os.path.exists(local_raw):
                    log_error(f"  File size: {os.path.getsize(local_raw)} bytes")
            raise FileNotFoundError(
                f"Could not stage raw video for job {job_id_str}. "
                f"Source URL: {job_source_url}. "
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
        log_step(2, 6, "AUDIO EXTRACTION & SPEECH-TO-TEXT", "faster-whisper (int8 CPU / speech gap segmentation)")

        # 2a. Extract Audio Track to 16kHz WAV
        extract_audio_track(raw_video_path, extracted_wav_path, sample_rate=16000, channels=1)

        from services.compositor import _probe_duration
        from services.media_extractor import get_ffmpeg_binary_path
        from services.transcriber import calculate_transcription_coverage
        from services.silence_detector import detect_silences
        from services.audio_analysis import classify_audio_regions
        
        ffmpeg_bin = get_ffmpeg_binary_path()
        total_duration = _probe_duration(ffmpeg_bin, raw_video_path)

        # 2b. Transcribe speech with speech gap chunking and bracket compression
        bracketed_transcript, timestamp_map = transcribe_and_compress(
            audio_path=extracted_wav_path,
            speech_gap_threshold_sec=0.8,
            model_size="small",
        )
        
        # 2c. Log Transcription Coverage Diagnostics
        intervals = [(chunk["start"], chunk["end"]) for chunk in timestamp_map.values()]
        coverage_stats = calculate_transcription_coverage(intervals, total_duration)
        log_info(f"Transcription Coverage: {coverage_stats}")
        
        # 2d. Run Unified Audio Classification
        silence_results = detect_silences(extracted_wav_path)
        silence_intervals = [(s["start"], s["end"]) for s in silence_results]
        
        speech_intervals = [
            (word["start"], word["end"])
            for chunk in timestamp_map.values()
            for word in chunk["words"]
            if word["end"] > word["start"]
        ]
        
        unified_audio_regions = classify_audio_regions(
            total_duration=total_duration,
            speech_intervals=speech_intervals,
            silence_intervals=silence_intervals
        )
        # Log a small preview (first 5 regions) for diagnostics
        preview_regions = unified_audio_regions[:5]
        log_info(f"Unified Audio Regions preview: {preview_regions}")
        
        log_step_end("SPEECH-TO-TEXT", time.time() - step2_start)
        
        # -------------------------------------------------------------
        # Step 2.5: VISUAL ANALYSIS (Intelligent Context Extraction)
        # -------------------------------------------------------------
        step_vis_start = time.time()
        log_step(3, 7, "VISUAL INTELLIGENCE LAYER", "Extracting scenes, subjects, and safe regions")
        
        visual_timeline = analyze_visual_context(
            video_path=raw_video_path,
            video_id=job_id,
            video_duration=total_duration,
            temp_dir=temp_job_dir
        )
        
        unified_analysis = UnifiedAnalysis(
            transcript=bracketed_transcript,
            audio_analysis={"regions": unified_audio_regions},
            visual_analysis=visual_timeline
        )
        log_step_end("VISUAL ANALYSIS", time.time() - step_vis_start)

        # -------------------------------------------------------------
        # Step 3: AI_DIRECTING (Phase 4 - Gemini 3.6 Flash)
        # -------------------------------------------------------------
        step3_start = time.time()
        log_step(4, 7, "AI DIRECTOR REASONING", "Google Gemini 3.6 Flash structured EDL synthesis")

        # Query LLM to generate strict Pydantic JSON edit decisions
        edit_decision_list = generate_edit_decisions(unified_analysis.model_dump_json())
        log_step_end("AI DIRECTOR", time.time() - step3_start)

        # -------------------------------------------------------------
        # Step 3.5: BLUEPRINT VALIDATION (Deterministic guardrails)
        # -------------------------------------------------------------
        step_val_start = time.time()
        log_step(5, 8, "BLUEPRINT VALIDATION", "Enforcing B-roll budgets, timestamp validity, and safety guardrails")

        edits_dicts = [e.model_dump() for e in edit_decision_list.edits]
        validated_edits, validation_report = validate_blueprint(
            edits=edits_dicts,
            timestamp_map=timestamp_map,
            video_duration=total_duration,
        )

        # Log the full validation report for debugging
        report_str = format_validation_report(validation_report)
        log_info(f"Validation Report:\n{report_str}")

        if validation_report.rejected_count > 0:
            log_warning(f"Rejected {validation_report.rejected_count} AI decisions "
                        f"(B-roll budget: {validation_report.broll_budget_used:.1f}s / "
                        f"{validation_report.broll_budget_max:.1f}s)")

        log_step_end("BLUEPRINT VALIDATION", time.time() - step_val_start)

        # Persist validated EDL + validation report to database for observability
        edits_json_str = json.dumps({
            "unified_analysis": unified_analysis.model_dump(),
            "raw_edits": [e.model_dump() for e in edit_decision_list.edits],
            "validated_edits": validated_edits,
            "validation_report": validation_report.model_dump(),
            "timestamp_map": timestamp_map,
        }, indent=2)

        # -------------------------------------------------------------
        # Step 4: RENDERING (Phase 5 - Asset Manager + Subtitles + FFmpeg)
        # -------------------------------------------------------------
        step4_start = time.time()
        log_step(6, 8, "ASSET SOURCING & DYNAMIC SUBTITLES", "Pexels Video API & ASS Karaoke formatting")

        # 4a. Download requested B-roll video assets — ONLY for validated edits
        broll_map = fetch_broll_assets(validated_edits, output_dir=assets_dir)

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
        log_step(7, 8, "FFMPEG VIDEO COMPOSITING", "Assembly of cuts, B-roll, zooms, captions into 1080x1920 MP4")
        render_video_pipeline(
            raw_video_path=raw_video_path,
            output_mp4_path=rendered_mp4_path,
            subtitle_ass_path=subtitle_ass_path,
            broll_map=broll_map,
            edits=validated_edits,  # Use VALIDATED edits, not raw AI output
            timestamp_map=timestamp_map,
        )
        log_step_end("FFMPEG RENDERING", time.time() - step5_start)

        # -------------------------------------------------------------
        # Step 6: PUBLISHING & COMPLETION (Phase 5 - Cloudflare R2 / YouTube)
        # -------------------------------------------------------------
        step6_start = time.time()
        log_step(8, 8, "STORAGE EXPORT & SOCIAL PUBLISHING", "Persistent stream storage and YouTube Shorts distribution")

        # 6a. Upload final rendered MP4 to Cloud Storage or Local Stream Store
        final_video_url = upload_rendered_video_to_storage(
            local_mp4_path=rendered_mp4_path,
            job_id=job_id_str,
            user_id=job_user_id,
        )

        # 6b. Publish to YouTube Shorts (if channel linked)
        publish_to_youtube_shorts(
            video_path=rendered_mp4_path,
            title=job_title,
            description=f"{job_title} #Shorts #AI #ContentCreator",
            access_token=None,
        )

        # 6c. Final State Transition: COMPLETED
        total_duration = time.time() - pipeline_start
        
        # OPEN DATABASE CONNECTION TO SAVE FINAL RESULT
        session = get_worker_db()
        job = session.get(VideoJob, job_uuid)
        if job:
            job.status = VideoJobStatus.COMPLETED
            job.rendered_url = final_video_url
            job.edit_decision_list = edits_json_str
            job.error_log = None
            job.updated_at = get_utc_now()
            session.add(job)
            session.commit()
        
        log_step_end("EXPORT & PUBLISHING", time.time() - step6_start)
        log_summary(
            job_id=job_id_str,
            title=job_title,
            total_time=total_duration,
            edits_count=len(edit_decision_list.edits),
            export_url=final_video_url,
        )

        return {
            "status": "success",
            "job_id": job_id_str,
            "rendered_url": final_video_url,
            "edit_count": len(edit_decision_list.edits),
            "duration_sec": round(total_duration, 2),
        }

    except Exception as exc:
        err_stack = traceback.format_exc()
        log_error(f"Pipeline failure for Job {job_id}:\n{err_stack}")

        try:
            session = get_worker_db()
            job = session.get(VideoJob, job_uuid)
            if job:
                job.status = VideoJobStatus.FAILED
                job.error_log = err_stack
                job.updated_at = get_utc_now()
                session.add(job)
                session.commit()
                session.close()
        except Exception as db_err:
            log_error(f"Database error while recording failure: {db_err}")

        # Retry transient errors up to max_retries
        raise self.retry(exc=exc, countdown=10)

    finally:
        session.close()
        # Clean up temporary staging workspace
        shutil.rmtree(temp_job_dir, ignore_errors=True)
