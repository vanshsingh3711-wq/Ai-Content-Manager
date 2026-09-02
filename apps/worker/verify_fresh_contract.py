import os
import sys
import json
import subprocess

sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.visual_analysis.schemas import UnifiedVisualTimeline, SubjectEvent, BoundingBox, CompositionSegment
from services.visual_analysis import UnifiedAnalysis
from services.ai_director import generate_edit_decisions
from services.blueprint_validator import validate_blueprint, format_validation_report
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin
from services.asset_manager import fetch_broll_assets

def get_stream_durations(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration,start_time,nb_frames,r_frame_rate",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data = json.loads(result.stdout)
        v_dur = 0.0
        a_dur = 0.0
        v_start = 0.0
        a_start = 0.0
        fps = ""
        frames = 0
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                v_dur = float(stream.get("duration", 0) or 0)
                v_start = float(stream.get("start_time", 0) or 0)
                fps = stream.get("r_frame_rate", "")
                frames = int(stream.get("nb_frames", 0) or 0)
            elif stream.get("codec_type") == "audio":
                a_dur = float(stream.get("duration", 0) or 0)
                a_start = float(stream.get("start_time", 0) or 0)
                
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration,start_time,size,bit_rate",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data2 = json.loads(result2.stdout)
        fmt = data2.get("format", {})
        c_dur = float(fmt.get("duration", 0) or 0)
        c_start = float(fmt.get("start_time", 0) or 0)
                
        return {
            "container_duration": c_dur,
            "container_start": c_start,
            "video_duration": v_dur,
            "video_start": v_start,
            "audio_duration": a_dur,
            "audio_start": a_start,
            "fps": fps,
            "frames": frames,
        }
    except Exception as e:
        print(f"Error probing: {e}")
        return {}

def run_fresh_verification():
    job_id = "test-fresh-verify"
    raw_video_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    extracted_wav_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker\temp_test_audio.wav"
    
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    print(f"=== [1] SOURCE FILE INFO ===")
    print(f"Path: {raw_video_path}")
    print(f"Total Source Duration: {total_duration:.3f}s")
    
    # Load transcript & timestamp map from test job cache
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()
    edl_data = json.loads(job.edit_decision_list)
    bracketed_transcript = edl_data["bracketed_transcript"]
    timestamp_map = edl_data["timestamp_map"]
    
    print("\n=== [2] EXTRACTING AUDIO & VISUAL CONTEXT ===")
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
    
    visual_timeline = UnifiedVisualTimeline(
        video_id=job_id,
        scenes=[],
        subjects=[
            SubjectEvent(
                start=0.0,
                end=total_duration,
                role="primary",
                bounding_box=BoundingBox(x=0.3, y=0.2, width=0.4, height=0.6)
            )
        ],
        composition_segments=[
            CompositionSegment(
                start=0.0,
                end=total_duration,
                primary_subject_position="center",
                safe_regions=["top", "left", "right"],
                bottom_region_occupied=True
            )
        ],
        observations=[]
    )
    
    unified_analysis = UnifiedAnalysis(
        transcript=bracketed_transcript,
        audio_analysis={"regions": unified_audio_regions},
        visual_analysis=visual_timeline
    )
    
    print("\n=== [3] RUNNING FRESH AI DIRECTOR GENERATION ===")
    print("Calling generate_edit_decisions with real UnifiedAnalysis...")
    fresh_edl = generate_edit_decisions(unified_analysis.model_dump_json())
    raw_edits = [e.model_dump() for e in fresh_edl.edits]
    print(f"Total AI-generated decisions: {len(raw_edits)}")
    print("Decisions generated by AI Director:")
    for idx, e in enumerate(raw_edits):
        print(f"  {idx+1}. action={e.get('action')}, trigger={e.get('trigger_id')}, start={e.get('start')}, end={e.get('end')}, search_query={e.get('search_query')}, reason={e.get('reason')}")
    
    print("\n=== [4] RUNNING BLUEPRINT VALIDATOR (NO BYPASS) ===")
    validated_edits, validation_report = validate_blueprint(
        edits=raw_edits,
        timestamp_map=timestamp_map,
        video_duration=total_duration,
    )
    
    print(format_validation_report(validation_report))
    print(f"Validation Report details:")
    print(f"  Accepted: {validation_report.accepted_count}")
    print(f"  Rejected: {validation_report.rejected_count}")
    print(f"  Modified: {validation_report.modified_count}")
    print(f"  B-roll budget: {validation_report.broll_budget_used:.2f}s used / {validation_report.broll_budget_max:.2f}s max")
    for issue in validation_report.issues:
        print(f"  Issue [{issue.severity.upper()}]: trigger={issue.trigger_id}, action={issue.action} -> {issue.issue}")
        
    print("\n=== [5] B-ROLL ASSET SOURCING ===")
    broll_decisions = [e for e in validated_edits if e.get("action") == "b_roll"]
    print(f"Requested B-roll Decisions in validated EDL: {len(broll_decisions)}")
    for b in broll_decisions:
        trig = b.get("trigger_id")
        t_start = timestamp_map.get(trig, {}).get("start", 0.0) if trig else b.get("start", 0.0)
        t_end = timestamp_map.get(trig, {}).get("end", 0.0) if trig else b.get("end", 0.0)
        print(f"  - Trigger: {trig} [{t_start:.2f}s - {t_end:.2f}s] | Query: '{b.get('search_query')}' | Reason: '{b.get('reason')}'")
        
    broll_map = fetch_broll_assets(validated_edits)
    print(f"Downloaded B-roll assets count: {len(broll_map)}")
    for k, v in broll_map.items():
        print(f"  {k} -> {v} (size: {os.path.getsize(v) if os.path.exists(v) else 0} bytes)")
        
    print("\n=== [6] COMPOSITING FINAL VIDEO ===")
    temp_dir = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker"
    rendered_mp4_path = os.path.join(temp_dir, "final_fresh_verified.mp4")
    subtitle_ass_path = os.path.join(temp_dir, "subtitles_fresh_verified.ass")
    
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=subtitle_ass_path,
        font_size=50,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000FFFF",
    )
    
    render_video_pipeline(
        raw_video_path=raw_video_path,
        output_mp4_path=rendered_mp4_path,
        subtitle_ass_path=subtitle_ass_path,
        broll_map=broll_map,
        edits=validated_edits,
        timestamp_map=timestamp_map,
    )
    
    print("\n=== [7] PROBING FINAL RENDERED MEDIA ===")
    media_info = get_stream_durations(rendered_mp4_path)
    print(json.dumps(media_info, indent=2))
    
    v_dur = media_info.get("video_duration", 0.0)
    a_dur = media_info.get("audio_duration", 0.0)
    c_dur = media_info.get("container_duration", 0.0)
    delta = abs(v_dur - a_dur)
    
    print("\n=== [8] SUMMARY METRICS ===")
    print(f"Source Duration:          {total_duration:.3f}s")
    print(f"Final Container Duration: {c_dur:.3f}s")
    print(f"Final Video Duration:     {v_dur:.3f}s")
    print(f"Final Audio Duration:     {a_dur:.3f}s")
    print(f"A/V Duration Delta:       {delta:.3f}s")
    print(f"B-roll Validated Count:   {len(broll_decisions)}")
    print(f"B-roll Rendered Count:    {len(broll_map)}")
    
    # Detailed diagnosis of AV delta if delta > 0
    print("\n=== [9] A/V DELTA DIAGNOSTIC DETAILS ===")
    print(f"Video start time: {media_info.get('video_start')}s")
    print(f"Audio start time: {media_info.get('audio_start')}s")
    print(f"Video FPS: {media_info.get('fps')}, nb_frames: {media_info.get('frames')}")
    if media_info.get('frames') and '/' in str(media_info.get('fps')):
        num, den = map(float, str(media_info.get('fps')).split('/'))
        fps_val = num / den
        calc_video_dur = media_info.get('frames') / fps_val
        print(f"Frame count duration calculation: {media_info.get('frames')} / {fps_val:.2f} = {calc_video_dur:.4f}s")

if __name__ == "__main__":
    run_fresh_verification()
