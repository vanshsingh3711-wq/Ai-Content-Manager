import os
import traceback
import uuid
import json
import time
import concurrent.futures
from celery import Task
from celery_app import celery_app
from config import get_worker_db, get_worker_settings

# Import models
from models import VideoJob, VideoJobStatus, VideoType

# Import orchestration managers
from services.ingest_manager import stage_raw_video
from services.job_manager import set_job_status_downloading, set_job_status_completed, set_job_status_failed

# Import Services
from services.media_extractor import extract_audio_track, get_ffmpeg_binary_path
from services.transcriber import transcribe_and_compress, calculate_transcription_coverage
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.visual_analysis import analyze_visual_context, UnifiedAnalysis
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.character_planner import generate_character_plan
from services.blueprint_resolver import resolve_master_blueprint
from services.sfx_planner import generate_sfx_plan
from services.blueprint_validator import validate_blueprint, format_validation_report
from services.asset_manager import fetch_broll_assets
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration
from services.publisher import upload_rendered_video_to_storage, publish_to_youtube_shorts

# Logger & Context
from worker_logger import log_header, log_info, log_warning, log_error, log_summary, PipelineStep

settings = get_worker_settings()

@celery_app.task(bind=True, name="tasks.process_video_pipeline", max_retries=2)
def process_video_pipeline(self: Task, job_id: str) -> dict:
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

        if job.status == VideoJobStatus.COMPLETED:
            log_info(f"Job {job_id} is already in state '{job.status}'. Skipping idempotently.")
            return {"status": "skipped", "current_status": job.status}
        elif job.status not in [VideoJobStatus.QUEUED, VideoJobStatus.FAILED]:
            log_warning(f"Job {job_id} is in intermediate state '{job.status}'. Assuming previous worker crashed. Automatically recovering and restarting job.")
        job_title = job.title
        job_video_type = job.video_type
        job_user_id = str(job.user_id)
        job_source_url = job.source_url
        job_id_str = str(job.id)

        job_settings = {}
        if job.edit_decision_list:
            try:
                parsed_init = json.loads(job.edit_decision_list)
                if isinstance(parsed_init, dict) and "settings" in parsed_init:
                    job_settings = parsed_init["settings"]
            except Exception:
                pass
                
        session.close() # Close DB before heavy work

        log_info(f"Target Video Job: '{job_title}' | Type: {job_video_type} | Ratio: {job_settings.get('aspect_ratio', '9:16')} | Style: {job_settings.get('video_style', 'viral')}")

        # Prepare workspace paths
        os.makedirs(temp_job_dir, exist_ok=True)
        assets_dir = os.path.join(temp_job_dir, "assets")
        raw_video_path = os.path.join(temp_job_dir, "raw_source.mp4")
        extracted_wav_path = os.path.join(temp_job_dir, "extracted_audio.wav")
        subtitle_ass_path = os.path.join(temp_job_dir, "subtitles.ass")
        rendered_mp4_path = os.path.join(temp_job_dir, "final_rendered.mp4")

        # --- STEP 1: DOWNLOADING & STAGING ---
        with PipelineStep(1, 8, "DOWNLOADING & RAW MEDIA INGEST", f"Source: {job_source_url}"):
            set_job_status_downloading(job_uuid)
            if job_video_type != VideoType.FACELESS_SHORT:
                stage_raw_video(job_source_url, raw_video_path, settings.TEMP_DIR)
            else:
                log_info("Faceless video detected. Skipping raw video download.")

        # --- STEP 2: TRANSCRIBING & AUDIO ANALYSIS ---
        with PipelineStep(2, 8, "AUDIO EXTRACTION & SPEECH-TO-TEXT", "faster-whisper (int8 CPU / speech gap segmentation)"):
            if job_video_type != VideoType.FACELESS_SHORT:
                extract_audio_track(raw_video_path, extracted_wav_path, sample_rate=16000, channels=1)
                ffmpeg_bin = get_ffmpeg_binary_path()
                total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
            else:
                log_info("Generating TTS Audio for Faceless Video...")
                topic = job_settings.get("topic", job_title)
                script = f"Here is a brand new faceless video about {topic}. We are currently generating this completely with AI. Stay tuned for the final result."
                os.system(f'edge-tts --text "{script}" --write-media "{extracted_wav_path}"')
                ffmpeg_bin = get_ffmpeg_binary_path()
                total_duration = _probe_duration(ffmpeg_bin, extracted_wav_path)
                
                log_info("Generating blank base video with TTS audio for compositor...")
                os.system(
                    f'{ffmpeg_bin} -y -f lavfi -i color=c=black:s=1080x1920:d={total_duration} '
                    f'-i "{extracted_wav_path}" '
                    f'-c:v libx264 -preset ultrafast -c:a aac -shortest "{raw_video_path}"'
                )

            bracketed_transcript, timestamp_map = transcribe_and_compress(
                audio_path=extracted_wav_path,
                speech_gap_threshold_sec=0.8,
                model_size="small",
            )
            
            intervals = [(chunk["start"], chunk["end"]) for chunk in timestamp_map.values()]
            coverage_stats = calculate_transcription_coverage(intervals, total_duration)
            log_info(f"Transcription Coverage: {coverage_stats}")
            
            silence_results = detect_silences(extracted_wav_path)
            silence_intervals = [(s["start"], s["end"]) for s in silence_results]
            
            speech_intervals = [
                (word["start"], word["end"])
                for chunk in timestamp_map.values()
                for word in chunk["words"]
                if word["end"] > word["start"]
            ]
            
            unified_audio_regions = classify_audio_regions(total_duration, speech_intervals, silence_intervals)
            log_info(f"Unified Audio Regions preview: {unified_audio_regions[:5]}")

        # --- STEP 3: VISUAL ANALYSIS ---
        with PipelineStep(3, 8, "VISUAL INTELLIGENCE LAYER", "Extracting scenes, subjects, and safe regions"):
            if job_video_type != VideoType.FACELESS_SHORT:
                visual_timeline = analyze_visual_context(
                    video_path=raw_video_path,
                    video_id=job_id_str,
                    video_duration=total_duration,
                    temp_dir=temp_job_dir
                )
            else:
                visual_timeline = {"video_id": job_id_str, "scenes": [], "subjects": [], "safe_regions": []}
            unified_analysis = UnifiedAnalysis(
                transcript=bracketed_transcript,
                audio_analysis={"regions": unified_audio_regions},
                visual_analysis=visual_timeline
            )
            unified_json_str = unified_analysis.model_dump_json()

        # --- STEP 4: MULTI-AGENT AI DIRECTORS ---
        with PipelineStep(4, 8, "MULTI-AGENT AI DIRECTORS", "Parallel execution of B-Roll, Motion Graphics, and Character Planners"):
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_broll = executor.submit(generate_broll_plan, unified_json_str)
                future_mg = executor.submit(generate_motion_graphics_plan, unified_json_str)
                future_char = executor.submit(generate_character_plan, unified_json_str)

                broll_plan = future_broll.result()
                mg_plan = future_mg.result()
                char_plan = future_char.result()

        # --- STEP 5: MASTER BLUEPRINT RESOLVER & SFX PLANNER ---
        with PipelineStep(5, 8, "MASTER BLUEPRINT RESOLVER & SFX PLANNER", "Merging plans, resolving conflicts, adding sound"):
            resolved_visual_blueprint = resolve_master_blueprint(
                unified_analysis_json=unified_json_str,
                broll_plan=broll_plan,
                mg_plan=mg_plan,
                char_plan=char_plan
            )
            edit_decision_list = generate_sfx_plan(
                unified_analysis_json=unified_json_str,
                resolved_visual_blueprint=resolved_visual_blueprint
            )

        # --- STEP 6: BLUEPRINT VALIDATION ---
        with PipelineStep(6, 8, "BLUEPRINT VALIDATION", "Enforcing B-roll budgets, timestamp validity, and safety guardrails"):
            edits_dicts = [e.model_dump() for e in edit_decision_list.edits]
            validated_edits, validation_report = validate_blueprint(
                edits=edits_dicts,
                timestamp_map=timestamp_map,
                video_duration=total_duration,
            )
            log_info(f"Validation Report:\n{format_validation_report(validation_report)}")
            if validation_report.rejected_count > 0:
                log_warning(f"Rejected {validation_report.rejected_count} AI decisions")

            edits_json_str = json.dumps({
                "settings": job_settings,
                "unified_analysis": unified_analysis.model_dump(),
                "raw_edits": [e.model_dump() for e in edit_decision_list.edits],
                "validated_edits": validated_edits,
                "edits": validated_edits,
                "validation_report": validation_report.model_dump(),
                "timestamp_map": timestamp_map,
            }, indent=2)

        # --- STEP 7: ASSET SOURCING & SUBTITLES ---
        with PipelineStep(7, 8, "ASSET SOURCING & DYNAMIC SUBTITLES", "Pexels Video API & ASS Karaoke formatting"):
            broll_map = fetch_broll_assets(validated_edits, output_dir=assets_dir)
            
            caption_preset = job_settings.get("caption_preset", "tiktok_yellow")
            highlight_color = "&H0000FFFF"
            primary_color = "&H00FFFFFF"
            if caption_preset == "neon_cyber":
                highlight_color = "&H00FFFF00"
            elif caption_preset == "modern_clean":
                highlight_color = "&H00E0E0E0"
            elif caption_preset == "boxed_pill":
                highlight_color = "&H0000A5FF"

            generate_ass_subtitles(
                timestamp_map=timestamp_map,
                output_ass_path=subtitle_ass_path,
                edits=validated_edits,
                font_size=50,
                primary_color=primary_color,
                highlight_color=highlight_color,
            )

        # --- STEP 8: FFMPEG COMPOSITOR & PUBLISHING ---
        with PipelineStep(8, 8, "FFMPEG RENDERING & PUBLISHING", "Assembly of final MP4 and social export"):
            render_video_pipeline(
                raw_video_path=raw_video_path,
                output_mp4_path=rendered_mp4_path,
                subtitle_ass_path=subtitle_ass_path,
                broll_map=broll_map,
                edits=validated_edits,
                timestamp_map=timestamp_map,
            )
            
            final_video_url = upload_rendered_video_to_storage(
                local_mp4_path=rendered_mp4_path,
                job_id=job_id_str,
                user_id=job_user_id,
            )
            publish_to_youtube_shorts(
                video_path=rendered_mp4_path,
                title=job_title,
                description=f"{job_title} #Shorts #AI #ContentCreator",
                access_token=None,
            )

            set_job_status_completed(job_uuid, final_video_url, edits_json_str)

        total_duration = time.time() - pipeline_start
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
        set_job_status_failed(job_uuid, err_stack)
        raise self.retry(exc=exc, countdown=10)
