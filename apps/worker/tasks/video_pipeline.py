import os
import sys
import shutil
import subprocess
import traceback
import uuid
import json
import time
import concurrent.futures
from typing import Optional, Any
from celery import Task
from celery_app import celery_app
from config import get_worker_db, get_worker_settings

# Import models
from models import VideoJob, VideoJobStatus, VideoType

# Import orchestration managers
from services.ingest_manager import stage_raw_video
from services.job_manager import (
    set_job_status_downloading,
    set_job_status_transcribing,
    set_job_status_ai_directing,
    set_job_status_rendering,
    set_job_status_publishing,
    set_job_status_completed,
    set_job_status_failed
)
from services.render_tracker import update_render_progress
# Import Services
from services.media_extractor import extract_audio_track, get_ffmpeg_binary_path
from services.transcriber import transcribe_and_compress, calculate_transcription_coverage
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.visual_analysis import analyze_visual_context, UnifiedAnalysis
from services.ai_director import EditList
from services.broll_planner import generate_broll_plan
from services.motion_graphic_planner import generate_motion_graphics_plan
from services.character_planner import generate_character_plan
from services.beat_analyzer import analyze_script
from services.treatment_assigner import assign_visual_treatments
from services.blueprint_resolver import resolve_master_blueprint
from services.sfx_planner import generate_sfx_plan
from services.blueprint_validator import validate_blueprint, format_validation_report
from services.asset_manager import fetch_broll_assets
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration
from services.publisher import upload_rendered_video_to_storage, publish_to_youtube

# Logger & Context
from worker_logger import log_header, log_info, log_warning, log_error, log_summary, PipelineStep

settings = get_worker_settings()

@celery_app.task(bind=True, name="tasks.process_video_pipeline", max_retries=2)
def process_video_pipeline(self: Task, job_id: str) -> dict:
    pipeline_start = time.time()
    log_header("AUTOMATED VIDEO EDITING PIPELINE", job_id=job_id)
    
    job_uuid = uuid.UUID(job_id) if isinstance(job_id, str) else job_id
    temp_job_dir = os.path.join(settings.TEMP_DIR, str(job_uuid))

    try:
        # 1. Fetch Job from PostgreSQL (with retry if DB is waking up)
        job = None
        for attempt in range(3):
            session = get_worker_db()
            try:
                job = session.get(VideoJob, job_uuid)
                break
            except Exception as conn_err:
                session.close()
                if attempt == 2:
                    raise
                time.sleep(1.5 * (attempt + 1))

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

        job_settings = job.settings or {}
        if "USE_GRANULAR_OVERLAYS" not in job_settings:
            job_settings["USE_GRANULAR_OVERLAYS"] = True
                
        session.close() # Close DB before heavy work

        ai_model_pref = job_settings.get("ai_model", "DeepSeek-Hybrid")
        style_pref = job_settings.get("video_style", "viral")
        aspect_ratio = job_settings.get("aspect_ratio", "9:16")

        log_info(f"Target Video Job: '{job_title}' | Type: {job_video_type} | Ratio: {aspect_ratio} | Style: {style_pref} | Model: {ai_model_pref}")


        # Prepare workspace paths
        os.makedirs(temp_job_dir, exist_ok=True)
        assets_dir = os.path.join(temp_job_dir, "assets")
        os.makedirs(assets_dir, exist_ok=True)
        raw_video_path = os.path.join(temp_job_dir, "raw_source.mp4")
        extracted_wav_path = os.path.join(temp_job_dir, "extracted_audio.wav")
        subtitle_ass_path = os.path.join(temp_job_dir, "subtitles.ass")
        rendered_mp4_path = os.path.join(temp_job_dir, "final_rendered.mp4")
        deterministic_cuts = []

        # --- STEP 1: DOWNLOADING & STAGING ---
        with PipelineStep(1, 8, "DOWNLOADING & RAW MEDIA INGEST", f"Source: {job_source_url}"):
            set_job_status_downloading(job_uuid)
            if job_video_type != VideoType.FACELESS_SHORT:
                stage_raw_video(job_source_url, raw_video_path, settings.TEMP_DIR)
            elif job_settings.get("audio_url"):
                log_info("Faceless video with uploaded audio. Downloading audio...")
                stage_raw_video(job_settings["audio_url"], raw_video_path, settings.TEMP_DIR)
            else:
                log_info("Faceless video detected. Skipping raw video download.")

        # --- STEP 2: TRANSCRIBING & AUDIO ANALYSIS ---
        with PipelineStep(2, 8, "AUDIO EXTRACTION & SPEECH-TO-TEXT", "faster-whisper (int8 CPU / speech gap segmentation)"):
            set_job_status_transcribing(job_uuid)
            if job_video_type != VideoType.FACELESS_SHORT:
                extract_audio_track(raw_video_path, extracted_wav_path, sample_rate=16000, channels=1)
                ffmpeg_bin = get_ffmpeg_binary_path()
                total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
            else:
                if job_settings.get("audio_url"):
                    log_info("Using uploaded audio for Faceless Video. Extracting and converting to WAV...")
                    extract_audio_track(raw_video_path, extracted_wav_path, sample_rate=16000, channels=1)
                    
                    ffmpeg_bin = get_ffmpeg_binary_path()
                    total_duration = _probe_duration(ffmpeg_bin, extracted_wav_path)
                    
                    log_info("Generating blank base video with uploaded audio for compositor...")
                    # We need a temporary intermediate path because raw_video_path is currently our audio file
                    temp_base_video = os.path.join(temp_job_dir, "base_video.mp4")
                    os.system(
                        f'{ffmpeg_bin} -y -f lavfi -i color=c=black:s=1080x1920:d={total_duration} '
                        f'-i "{extracted_wav_path}" '
                        f'-c:v libx264 -preset ultrafast -c:a aac -shortest "{temp_base_video}"'
                    )
                    # Overwrite the raw uploaded file with the generated video base
                    os.rename(temp_base_video, raw_video_path)
                else:
                    log_info("Generating TTS Audio for Faceless Video...")
                    topic = job_settings.get("topic", job_title)
                    script = job_settings.get("script", f"Here is a brand new faceless video about {topic}. We are currently generating this completely with AI. Stay tuned for the final result.")
                    
                    import asyncio
                    import edge_tts
                    voice = job_settings.get("tts_voice", "en-US-ChristopherNeural")
                    
                    async def _generate_tts():
                        comm = edge_tts.Communicate(script, voice)
                        await comm.save(extracted_wav_path)

                    try:
                        asyncio.run(_generate_tts())
                    except Exception as tts_err:
                        log_warning(f"Async edge_tts failed: {tts_err}. Falling back to CLI...")
                        import subprocess
                        edge_tts_bin = os.path.join(os.path.dirname(sys.executable), "edge-tts")
                        if not os.path.exists(edge_tts_bin):
                            edge_tts_bin = shutil.which("edge-tts") or "edge-tts"
                        subprocess.run([edge_tts_bin, "--text", script, "--write-media", extracted_wav_path], timeout=30, check=True)

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

            from services.speech_pruner import generate_deterministic_silence_cuts, invert_cuts_to_kept_ranges
            if job_video_type != VideoType.FACELESS_SHORT:
                deterministic_cuts = generate_deterministic_silence_cuts(
                    total_duration=total_duration,
                    speech_intervals=speech_intervals,
                    silence_intervals=silence_intervals,
                    head_margin_s=0.15,
                    tail_margin_s=0.25,
                    min_gap_duration=0.60,
                    breath_cushion_s=0.10,
                )
                kept_preview = invert_cuts_to_kept_ranges(deterministic_cuts, total_duration)
                kept_sec = sum(ke - ks for ks, ke in kept_preview)
                log_info(
                    f"[SPEECH_SPINE] Generated {len(deterministic_cuts)} deterministic silence cuts | "
                    f"Trimming {total_duration - kept_sec:.1f}s dead air -> {kept_sec:.1f}s active speech"
                )

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

            # DeepSeek Model Routing:
            # - "DeepSeek-Hybrid" (default): R1 for Beat Sheet & Motion Graphics, V3 for B-roll and Character
            # - "DeepSeek-Reasoner" or "DeepSeek R1": R1 for all
            # - "DeepSeek-Chat" or "DeepSeek V3": V3 for all
            ai_model_setting = str(ai_model_pref).lower()
            if "reasoner" in ai_model_setting or "r1" in ai_model_setting or "pro" in ai_model_setting:
                beat_model = "deepseek-reasoner"
                mg_model = "deepseek-reasoner"
                broll_model = "deepseek-reasoner"
                char_model = "deepseek-reasoner"
            elif "chat" in ai_model_setting or ("v3" in ai_model_setting and "hybrid" not in ai_model_setting):
                beat_model = "deepseek-chat"
                mg_model = "deepseek-chat"
                broll_model = "deepseek-chat"
                char_model = "deepseek-chat"
            else:
                # Default: Auto-Hybrid mode (R1 for Director intelligence, V3 for footage search)
                beat_model = "deepseek-reasoner"
                mg_model = "deepseek-reasoner"
                broll_model = "deepseek-chat"
                char_model = "deepseek-chat"

            use_beat_sheet = os.getenv("USE_BEAT_SHEET", "true").lower() == "true"  # Beat sheet ON by default
            beat_sheet_dict = {}
            if use_beat_sheet:
                log_info(f"USE_BEAT_SHEET is true. Generating Beat Sheet with {beat_model}...")
                try:
                    words_for_beat = []
                    sorted_chunks = sorted(timestamp_map.values(), key=lambda x: x.get("start", 0))
                    for chunk in sorted_chunks:
                        for w in chunk.get("words", []):
                            words_for_beat.append({"word": w["word"], "start": w["start"], "end": w["end"]})

                    # Exclude words that fall completely inside a deterministic silence cut
                    def _word_in_cut(ws: float, we: float) -> bool:
                        for cut in deterministic_cuts:
                            cs = cut.get("start", 0.0)
                            ce = cut.get("end", 0.0)
                            if ws >= cs - 0.05 and we <= ce + 0.05:
                                return True
                        return False

                    kept_words_for_beat = [
                        w for w in words_for_beat
                        if not _word_in_cut(w["start"], w["end"])
                    ]
                    if not kept_words_for_beat:
                        kept_words_for_beat = words_for_beat

                    if kept_words_for_beat:
                        beat_sheet_obj = analyze_script(kept_words_for_beat, bracketed_transcript, ai_model_pref=beat_model)
                        beat_sheet_dict = beat_sheet_obj.model_dump()
                        
                        # Active speech duration for pacing calculation
                        active_speech_dur = total_duration
                        if deterministic_cuts:
                            from services.speech_pruner import invert_cuts_to_kept_ranges
                            kept_spans = invert_cuts_to_kept_ranges(deterministic_cuts, total_duration)
                            if kept_spans:
                                active_speech_dur = sum(ke - ks for ks, ke in kept_spans)

                        # Assign treatments
                        treatment_settings = {
                            "MAX_OVERLAYS_PER_MIN": 8,
                            "MIN_OVERLAY_DURATION": 2.0,
                            "MAX_OVERLAY_DURATION": 6.0,
                            "is_faceless": (job_video_type == VideoType.FACELESS_SHORT)
                        }
                        updated_sheet, log_table = assign_visual_treatments(beat_sheet_dict, active_speech_dur, treatment_settings)
                        beat_sheet_dict = updated_sheet
                        
                        log_info(f"Generated {len(beat_sheet_dict.get('beats', []))} beats on active speech ({active_speech_dur:.1f}s) with treatments assigned.")
                except Exception as e:
                    log_warning(f"Beat analyzer failed: {e}")

            unified_analysis = UnifiedAnalysis(
                transcript=bracketed_transcript,
                audio_analysis={"regions": unified_audio_regions},
                visual_analysis=visual_timeline,
                beat_sheet=beat_sheet_dict
            )
            unified_json_str = unified_analysis.model_dump_json()

        # --- STEP 4: MULTI-AGENT AI DIRECTORS ---
        with PipelineStep(4, 8, "MULTI-AGENT AI DIRECTORS", "Parallel execution of B-Roll, Motion Graphics, and Character Planners"):
            set_job_status_ai_directing(job_uuid)
            style_pref = job_settings.get("video_style", "viral")
            is_faceless_job = (job_video_type == VideoType.FACELESS_SHORT or "faceless" in str(job_video_type).lower())
            log_info(f"AI Directing Models -> Story & Motion Graphics: {mg_model} | B-Roll & Visuals: {broll_model} | Faceless: {is_faceless_job}")

            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_broll = executor.submit(generate_broll_plan, unified_json_str, broll_model, style_pref)
                future_mg = executor.submit(generate_motion_graphics_plan, unified_json_str, mg_model, style_pref)
                future_char = None
                if not is_faceless_job:
                    future_char = executor.submit(generate_character_plan, unified_json_str, char_model, style_pref)

                broll_plan = future_broll.result()
                mg_plan = future_mg.result()
                char_plan = future_char.result() if future_char else EditList(edits=[])
                
            # Save the plans for debugging/comparison
            with open(os.path.join(assets_dir, "broll_plan.json"), "w") as f:
                f.write(broll_plan.model_dump_json(indent=2))
            with open(os.path.join(assets_dir, "mg_plan.json"), "w") as f:
                f.write(mg_plan.model_dump_json(indent=2))

        # --- STEP 5: MASTER BLUEPRINT RESOLVER & SFX PLANNER ---
        with PipelineStep(5, 8, "MASTER BLUEPRINT RESOLVER & SFX PLANNER", "Merging plans, resolving conflicts, adding sound"):
            resolved_visual_blueprint = resolve_master_blueprint(
                unified_analysis_json=unified_json_str,
                broll_plan=broll_plan,
                mg_plan=mg_plan,
                char_plan=char_plan,
                ai_model_pref=ai_model_pref,
                deterministic_cuts=deterministic_cuts,
                is_faceless=is_faceless_job,
            )
            edit_decision_list = generate_sfx_plan(
                unified_analysis_json=unified_json_str,
                resolved_visual_blueprint=resolved_visual_blueprint,
                ai_model_pref=ai_model_pref,
                style_pref=style_pref
            )

        # --- STEP 6: BLUEPRINT VALIDATION ---
        with PipelineStep(6, 8, "BLUEPRINT VALIDATION", "Enforcing B-roll budgets, timestamp validity, and safety guardrails"):
            
            # --- FIX: Inject beat_sheet into timestamp_map so the validator doesn't reject beat triggers ---
            if beat_sheet_dict and "beats" in beat_sheet_dict:
                for b in beat_sheet_dict["beats"]:
                    b_id = f"beat_{b['id']}"
                    timestamp_map[b_id] = {
                        "start": b["start"],
                        "end": b["end"],
                        "text": b["text"]
                    }
                    
            is_faceless = (job_video_type == VideoType.FACELESS_SHORT or "faceless" in str(job_video_type).lower())
            edits_dicts = [e.model_dump() for e in edit_decision_list.edits]
            validated_edits, validation_report = validate_blueprint(
                edits=edits_dicts,
                timestamp_map=timestamp_map,
                video_duration=total_duration,
                is_faceless=is_faceless,
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
            edits_for_broll = list(validated_edits)
            if is_faceless:
                # In faceless mode, guarantee at least 10-14 unique stock footage clips for rich background rotation
                seen_triggers = {e.get("trigger_id") for e in edits_for_broll if e.get("action") == "b_roll"}
                if broll_plan and getattr(broll_plan, "edits", None):
                    for b_edit in broll_plan.edits:
                        b_dict = b_edit.model_dump() if hasattr(b_edit, "model_dump") else (b_edit if isinstance(b_edit, dict) else b_edit.__dict__)
                        tid = b_dict.get("trigger_id")
                        if tid and tid not in seen_triggers and b_dict.get("action") == "b_roll":
                            edits_for_broll.append(b_dict)
                            seen_triggers.add(tid)
                if len(seen_triggers) < 10 and beat_sheet_dict and "beats" in beat_sheet_dict:
                    for b in beat_sheet_dict["beats"]:
                        b_id = f"beat_{b['id']}"
                        if b_id not in seen_triggers:
                            query = b.get("focus_phrase") or b.get("text", "")[:40]
                            edits_for_broll.append({
                                "action": "b_roll",
                                "trigger_id": b_id,
                                "search_query": query,
                                "start": b["start"],
                                "end": b["end"],
                                "reason": f"Background footage diversity for beat {b['id']}",
                            })
                            seen_triggers.add(b_id)
                            if len(seen_triggers) >= 12:
                                break

            broll_map = fetch_broll_assets(
                edits_for_broll,
                output_dir=assets_dir,
                job_settings=job_settings,
            )

            # Continuous stock footage background for faceless videos (eliminates black screens completely)
            if is_faceless and broll_map:
                valid_broll_clips = [
                    p for p in broll_map.values()
                    if os.path.exists(p) and os.path.getsize(p) > 1024
                ]
                if valid_broll_clips:
                    log_info(f"Synthesizing continuous faceless background from {len(valid_broll_clips)} stock footage clips...")
                    try:
                        from services.compositor import build_faceless_background_video
                        target_aspect = job_settings.get("aspect_ratio", "9:16")
                        if target_aspect == "16:9": bg_w, bg_h = 1920, 1080
                        elif target_aspect == "1:1": bg_w, bg_h = 1080, 1080
                        elif target_aspect == "4:5": bg_w, bg_h = 1080, 1350
                        else: bg_w, bg_h = 1080, 1920

                        built_ok = build_faceless_background_video(
                            clips=valid_broll_clips,
                            total_duration=total_duration,
                            audio_path=extracted_wav_path,
                            output_path=raw_video_path,
                            target_w=bg_w,
                            target_h=bg_h,
                            ffmpeg_bin=get_ffmpeg_binary_path()
                        )
                        if built_ok:
                            log_info(f"Replaced blank canvas with continuous stock footage background: {raw_video_path}")
                    except Exception as e:
                        log_warning(f"Could not build continuous stock background: {e}")
            
            caption_preset = job_settings.get("caption_preset", "tiktok_yellow")
            aspect_ratio = job_settings.get("aspect_ratio", "9:16")

            generate_ass_subtitles(
                timestamp_map=timestamp_map,
                output_ass_path=subtitle_ass_path,
                edits=validated_edits,
                caption_preset=caption_preset,
                aspect_ratio=aspect_ratio,
                is_faceless=is_faceless,
            )

        # --- STEP 7.5: 3D AVATAR RENDERING ---
        with PipelineStep(7.5, 8, "3D AVATAR RENDERING", "Rendering headless WebGL character"):
            if job_settings.get("use_3d_avatar", False):
                import asyncio
                from services.engine_3d.renderer import render_3d_character
                character_webm_path = os.path.join(temp_job_dir, "character.mov")
                
                log_info(f"Rendering 3D character to {character_webm_path}...")
                # We pass the validated_edits dictionary directly, and the total_duration
                asyncio.run(render_3d_character(
                    ai_plan={"edits": validated_edits}, 
                    output_video_path=character_webm_path,
                    duration=total_duration
                ))
            else:
                log_info("Skipping 3D avatar rendering (use_3d_avatar is disabled)")
                character_webm_path = None

        # --- STEP 8: FFMPEG COMPOSITOR & PUBLISHING ---
        with PipelineStep(8, 8, "FFMPEG RENDERING & PUBLISHING", "Assembly of final MP4 and social export"):
            set_job_status_rendering(job_uuid)
            render_video_pipeline(
                raw_video_path=raw_video_path,
                output_mp4_path=rendered_mp4_path,
                subtitle_ass_path=subtitle_ass_path,
                broll_map=broll_map,
                edits=validated_edits,
                timestamp_map=timestamp_map,
                settings=job_settings,
                character_video_path=character_webm_path,
            )
            
            set_job_status_publishing(job_uuid)
            final_video_url = upload_rendered_video_to_storage(
                local_mp4_path=rendered_mp4_path,
                job_id=job_id_str,
                user_id=job_user_id,
            )
            is_shorts = job_settings.get("aspect_ratio", "9:16") not in ["16:9"]
            publish_to_youtube(
                video_path=rendered_mp4_path,
                title=job_title,
                description=f"{job_title} #AI #ContentCreator",
                is_shorts=is_shorts,
                access_token=None,
            )

            # --- NLE TIMELINE MULTI-TRACK EXPORT (PHASE 2) ---
            try:
                from services.nle_exporter import export_nle_project
                nle_export_dir = os.path.join(temp_job_dir, "nle_export")
                nle_res = export_nle_project(
                    output_dir=nle_export_dir,
                    project_name=job_title,
                    raw_video_path=raw_video_path,
                    edits=validated_edits,
                    timestamp_map=timestamp_map,
                    settings=job_settings,
                    create_zip=True,
                )
                log_info(f"Generated NLE multi-track timelines (.fcpxml, .xml, .edl, .srt): {nle_res.get('zip_path')}")
            except Exception as nle_err:
                log_warning(f"NLE Timeline export generation skipped: {nle_err}")

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


@celery_app.task(bind=True, name="tasks.render_timeline_pipeline")
def render_timeline_pipeline(self: Any, *args, **kwargs) -> dict:
    """
    Renders user-customized timeline project edits into production MP4 and NLE files.
    Executes real FFmpeg compositing, overlays, subtitles, and audio mixing.
    """
    job_id = None
    project_data = None

    if args:
        if args[0] is None and len(args) > 1:
            job_id = args[1]
            if len(args) > 2:
                project_data = args[2]
        else:
            job_id = args[0]
            if len(args) > 1:
                project_data = args[1]

    if not job_id and "job_id" in kwargs:
        job_id = kwargs["job_id"]
    if not project_data and "project_data" in kwargs:
        project_data = kwargs["project_data"]

    if project_data is None:
        project_data = {}

    job_uuid = uuid.UUID(str(job_id)) if isinstance(job_id, (str, uuid.UUID)) else uuid.uuid4()
    temp_job_dir = os.path.join(settings.TEMP_DIR, str(job_uuid))
    os.makedirs(temp_job_dir, exist_ok=True)
    assets_dir = os.path.join(temp_job_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    raw_video_path = os.path.join(temp_job_dir, "raw_source.mp4")
    rendered_mp4_path = os.path.join(temp_job_dir, "final_rendered.mp4")
    subtitle_ass_path = os.path.join(temp_job_dir, "subtitles.ass")

    log_header("TIMELINE COMPOSITOR PIPELINE", job_id=str(job_uuid))

    # 1. Fetch Job from PostgreSQL
    session = get_worker_db()
    job = session.get(VideoJob, job_uuid)
    if not job:
        session.close()
        log_error(f"Job {job_id} not found")
        return {"status": "error", "message": f"Job {job_id} not found"}

    title = job.title or "Studio Video"
    source_url = job.source_url or ""
    edl_raw = job.edit_decision_list
    stored_settings = job.settings or {}
    session.close()

    set_job_status_rendering(job_uuid)
    render_id = str(project_data.get("render_id") or f"render_{job_uuid.hex[:12]}")
    update_render_progress(
        render_id=render_id,
        video_id=str(job_uuid),
        progress=15,
        stage="compiling",
        message="Validating timeline edits and source media...",
    )

    try:
        # 2. Extract edits, timestamp_map, settings
        edl_data = {}
        if project_data and isinstance(project_data, dict) and ("edits" in project_data or "timeline_project" in project_data):
            edl_data = project_data
        elif edl_raw:
            try:
                parsed = json.loads(edl_raw) if isinstance(edl_raw, str) else edl_raw
                if isinstance(parsed, dict):
                    if "edl" in parsed:
                        edl_data = parsed["edl"]
                    elif "edits" in parsed:
                        edl_data = parsed
                    elif "timeline_project" in parsed:
                        try:
                            from routers.videos import _compile_timeline_project_to_edl
                            edl_data = _compile_timeline_project_to_edl(parsed["timeline_project"])
                        except Exception:
                            edl_data = parsed.get("timeline_project", {})
                elif isinstance(parsed, list):
                    edl_data = {"edits": parsed}
            except Exception as e:
                log_warning(f"Error parsing job EDL: {e}")

        edits = edl_data.get("edits") or []
        timestamp_map = edl_data.get("timestamp_map") or {}
        job_settings = {**stored_settings, **(edl_data.get("settings") or {})}
        if "USE_GRANULAR_OVERLAYS" not in job_settings:
            job_settings["USE_GRANULAR_OVERLAYS"] = True

        # 3. Resolve or Synthesize Base Video
        ffmpeg_bin = get_ffmpeg_binary_path()
        base_ready = False
        candidate_source = source_url
        if not candidate_source:
            for e in edits:
                if (e.get("action") == "cut" or e.get("type") == "cut") and e.get("sourceUrl"):
                    candidate_source = e.get("sourceUrl")
                    break

        if candidate_source:
            if candidate_source.startswith("http://") or candidate_source.startswith("https://"):
                try:
                    stage_raw_video(candidate_source, raw_video_path, settings.TEMP_DIR)
                    if os.path.exists(raw_video_path) and os.path.getsize(raw_video_path) > 1024:
                        base_ready = True
                except Exception as ex:
                    log_warning(f"Could not download source video: {ex}")
            elif os.path.exists(candidate_source) and os.path.getsize(candidate_source) > 1024:
                if os.path.abspath(candidate_source) != os.path.abspath(raw_video_path):
                    shutil.copy2(candidate_source, raw_video_path)
                base_ready = True

        if not base_ready:
            # Synthesize solid canvas base video
            total_duration = float(job_settings.get("duration", 10.0))
            if total_duration <= 0:
                total_duration = 10.0
            target_aspect = job_settings.get("aspect_ratio", "9:16")
            if target_aspect == "16:9":
                bw, bh = 1920, 1080
            elif target_aspect == "1:1":
                bw, bh = 1080, 1080
            elif target_aspect == "4:5":
                bw, bh = 1080, 1350
            else:
                bw, bh = 1080, 1920

            cmd = [
                ffmpeg_bin, "-y",
                "-f", "lavfi", "-i", f"color=c=black:s={bw}x{bh}:d={total_duration}:r=30",
                "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                "-c:v", "libx264", "-preset", "ultrafast",
                "-c:a", "aac", "-shortest",
                "-pix_fmt", "yuv420p",
                raw_video_path,
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            log_info(f"Synthesized blank base canvas ({bw}x{bh}, {total_duration}s) at {raw_video_path}")

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=30,
            stage="compiling",
            message="Base video canvas resolved and validated",
        )

        # 4. Resolve B-Roll Assets
        broll_map = {}
        media_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))
        recordings_dir = os.path.join(media_temp_dir, "recordings")
        captures_dir = os.path.join(media_temp_dir, "captures")

        for e in edits:
            if e.get("action") == "b_roll" or e.get("type") == "broll":
                tid = str(e.get("trigger_id") or e.get("id") or "")
                b_src = e.get("broll_path") or e.get("localPath") or e.get("path") or e.get("sourceUrl")
                if not tid or not b_src:
                    continue

                # A. Direct local file on disk
                if os.path.exists(b_src) and os.path.getsize(b_src) > 1024:
                    broll_map[tid] = b_src
                # B. Relative recording API URL
                elif b_src.startswith("/api/v1/editor/recordings/"):
                    fname = b_src.split("/api/v1/editor/recordings/")[-1].split("?")[0]
                    rec_disk_path = os.path.join(recordings_dir, fname)
                    if os.path.exists(rec_disk_path) and os.path.getsize(rec_disk_path) > 1024:
                        broll_map[tid] = rec_disk_path
                # C. Relative capture API URL
                elif b_src.startswith("/api/v1/editor/captures/"):
                    fname = b_src.split("/api/v1/editor/captures/")[-1].split("?")[0]
                    cap_disk_path = os.path.join(captures_dir, fname)
                    if os.path.exists(cap_disk_path) and os.path.getsize(cap_disk_path) > 1024:
                        broll_map[tid] = cap_disk_path
                # D. Remote HTTP/HTTPS URL
                elif b_src.startswith("http://") or b_src.startswith("https://"):
                    dest = os.path.join(assets_dir, f"{tid}.mp4")
                    try:
                        stage_raw_video(b_src, dest, settings.TEMP_DIR)
                        if os.path.exists(dest) and os.path.getsize(dest) > 1024:
                            broll_map[tid] = dest
                    except Exception as ex:
                        log_warning(f"B-roll download failed for {tid}: {ex}")

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=45,
            stage="rendering",
            message=f"Staged {len(broll_map)} B-roll asset(s)",
        )

        # 5. Dynamic Subtitles (.ass)
        has_subs = False
        sub_edits = [e for e in edits if e.get("action") == "subtitle" or e.get("type") == "subtitle"]
        if sub_edits or timestamp_map:
            try:
                if not (os.path.exists(subtitle_ass_path) and os.path.getsize(subtitle_ass_path) > 100):
                    is_faceless_val = ("faceless" in str((settings or {}).get("video_type", "")).lower() or bool((settings or {}).get("is_faceless", False)))
                    generate_ass_subtitles(
                        timestamp_map=timestamp_map,
                        output_ass_path=subtitle_ass_path,
                        edits=edits,
                        caption_preset=(settings or {}).get("caption_preset", "tiktok_yellow"),
                        aspect_ratio=(settings or {}).get("aspect_ratio", "9:16"),
                        is_faceless=is_faceless_val,
                    )
                if os.path.exists(subtitle_ass_path) and os.path.getsize(subtitle_ass_path) > 0:
                    has_subs = True
            except Exception as sub_err:
                log_warning(f"Subtitle generation warning: {sub_err}")

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=60,
            stage="rendering",
            message="Dynamic subtitles generated",
        )

        # 6. Compositor Rendering via FFmpeg
        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=70,
            stage="compositing",
            message=f"Executing FFmpeg multi-track compositing ({len(edits)} edits)...",
        )
        log_info(f"Rendering timeline edits ({len(edits)} edits) to {rendered_mp4_path}...")
        render_video_pipeline(
            raw_video_path=raw_video_path,
            output_mp4_path=rendered_mp4_path,
            subtitle_ass_path=subtitle_ass_path if has_subs else None,
            broll_map=broll_map,
            edits=edits,
            timestamp_map=timestamp_map,
            settings=job_settings,
        )

        # 7. Deliver Final Rendered File to permanent temp path
        final_dest = os.path.join(settings.TEMP_DIR, f"{job_uuid}.mp4")
        if os.path.abspath(rendered_mp4_path) != os.path.abspath(final_dest):
            shutil.copy2(rendered_mp4_path, final_dest)
        log_info(f"Final MP4 written to: {final_dest} ({os.path.getsize(final_dest)} bytes)")

        # 7b. Generate lightweight 540p proxy for smooth browser scrubbing
        proxy_dest = os.path.join(settings.TEMP_DIR, f"{job_uuid}_proxy.mp4")
        proxy_url = None
        try:
            from services.media_extractor import generate_video_proxy
            if os.path.exists(final_dest) and os.path.getsize(final_dest) > 1024:
                generate_video_proxy(final_dest, proxy_dest, target_height=540)
                proxy_url = f"/api/v1/videos/{job_uuid}/proxy-file"
                log_info(f"540p scrubbing proxy generated: {proxy_dest}")
        except Exception as proxy_err:
            log_warning(f"Proxy generation warning (non-fatal): {proxy_err}")

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=85,
            stage="compositing",
            message="Generated 540p lightweight scrubbing proxy",
            extra={"proxy_url": proxy_url},
        )

        # 8. Pre-generate NLE exports
        try:
            from services.nle_exporter import export_nle_project
            nle_export_dir = os.path.join(temp_job_dir, "nle_export")
            export_nle_project(
                output_dir=nle_export_dir,
                project_name=title,
                raw_video_path=raw_video_path,
                edits=edits,
                timestamp_map=timestamp_map,
                settings=job_settings,
                create_zip=True,
            )
        except Exception as nle_err:
            log_warning(f"NLE export warning: {nle_err}")

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=95,
            stage="exporting_nle",
            message="Packaging NLE multi-track sequences",
            extra={"proxy_url": proxy_url},
        )

        # 9. Mark Job Completed
        final_url = f"/api/v1/videos/{job_uuid}/rendered-file"
        payload_to_save = {
            "timeline_project": project_data.get("timeline_project") if project_data and "timeline_project" in project_data else (
                json.loads(edl_raw).get("timeline_project") if edl_raw and "timeline_project" in edl_raw else None
            ),
            "edl": edl_data,
            "edits": edits,
            "timestamp_map": timestamp_map,
            "settings": job_settings,
            "proxy_url": proxy_url,
        }
        set_job_status_completed(job_uuid, final_url, json.dumps(payload_to_save))

        update_render_progress(
            render_id=render_id,
            video_id=str(job_uuid),
            progress=100,
            stage="completed",
            message="Render completed successfully",
            extra={
                "download_url": final_url,
                "proxy_url": proxy_url,
                "file_size": os.path.getsize(final_dest) if os.path.exists(final_dest) else 0,
            },
        )

        return {
            "status": "success",
            "job_id": str(job_uuid),
            "rendered_url": final_url,
            "proxy_url": proxy_url,
            "file_size": os.path.getsize(final_dest),
            "message": "Render completed successfully",
        }


    except Exception as exc:
        err_stack = traceback.format_exc()
        log_error(f"Render pipeline failure for Job {job_id}:\n{err_stack}")
        set_job_status_failed(job_uuid, err_stack)
        update_render_progress(
            render_id=render_id if "render_id" in locals() else f"render_{job_uuid.hex[:12]}",
            video_id=str(job_uuid),
            progress=0,
            stage="error",
            message=f"Render pipeline failure: {exc}",
        )
        if self and hasattr(self, "retry"):
            raise self.retry(exc=exc, countdown=10)
        raise
