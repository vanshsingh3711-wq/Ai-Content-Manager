import os
import sys
import json
import subprocess

sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob
from services.visual_analysis import UnifiedAnalysis
from services.ai_director import generate_edit_decisions
from services.blueprint_validator import validate_blueprint
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin
from services.asset_manager import fetch_broll_assets

def get_stream_durations(filepath):
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data = json.loads(result.stdout)
        v_dur = 0.0
        a_dur = 0.0
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                v_dur = float(stream.get("duration", 0) or 0)
            elif stream.get("codec_type") == "audio":
                a_dur = float(stream.get("duration", 0) or 0)
                
        result2 = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", filepath],
            capture_output=True, text=True
        )
        data2 = json.loads(result2.stdout)
        c_dur = float(data2.get("format", {}).get("duration", 0) or 0)
                
        return c_dur, v_dur, a_dur
    except:
        return 0.0, 0.0, 0.0

def run_diagnostic():
    job_id = "test-1234"
    raw_video_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    print(f"=== Source duration: {total_duration:.3f} ===")
    
    print("Loading cached DB state...")
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()
    edl_data = json.loads(job.edit_decision_list)
    bracketed_transcript = edl_data["bracketed_transcript"]
    timestamp_map = edl_data["timestamp_map"]
    
    print("Loading AI Director edits from DB...")
    edits_dicts = edl_data["edits"]
    
    print("Validating blueprint...")
    validated_edits, validation_report = validate_blueprint(
        edits=edits_dicts,
        timestamp_map=timestamp_map,
        video_duration=total_duration,
    )
    
    print("\n=== Validation Report ===")
    print(f"Accepted: {validation_report.accepted_count} | Rejected: {validation_report.rejected_count} | Modified: {validation_report.modified_count}")
    print(f"B-roll budget used: {validation_report.broll_budget_used:.2f}s / {validation_report.broll_budget_max:.2f}s")
    for issue in validation_report.issues:
        print(f"  [{issue.severity}] {issue.trigger_id} ({issue.action}): {issue.issue}")
    
    # 1. Read the validated EDL and list every B-roll decision
    print("\n=== Requested B-roll Decisions ===")
    broll_decisions = [e for e in validated_edits if e["action"] == "b_roll"]
    num_requested = len(broll_decisions)
    for b in broll_decisions:
        trig = b.get("trigger_id")
        t_start = timestamp_map.get(trig, {}).get("start", 0.0) if trig else b.get("start", 0.0)
        t_end = timestamp_map.get(trig, {}).get("end", 0.0) if trig else b.get("end", 0.0)
        print(f"B-roll: {t_start:.3f} - {t_end:.3f} | Trigger: {trig} | Reason: '{b.get('reason')}' | Query: '{b.get('search_query')}'")
        
    print(f"Total B-roll Requested: {num_requested}")
    
    # 2. Download assets
    print("\n=== Fetching B-roll Assets ===")
    broll_map = fetch_broll_assets(validated_edits)
    
    print(f"Assets Map: {json.dumps(broll_map, indent=2)}")
    
    # Calculate expected final duration
    expected_cuts_duration = sum(e["end"] - e["start"] for e in validated_edits if e["action"] == "cut")
    expected_final_duration = total_duration - expected_cuts_duration
    
    print(f"=== Expected Final Duration: {expected_final_duration:.3f} ===")
    
    print("=== Rendering... ===")
    temp_dir = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker"
    rendered_mp4_path = os.path.join(temp_dir, "final_broll_diagnostic.mp4")
    subtitle_ass_path = os.path.join(temp_dir, "subtitles_broll_diagnostic.ass")
    
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
    
    c_dur, v_dur, a_dur = get_stream_durations(rendered_mp4_path)
    print("\n=== FINAL RESULTS ===")
    print(f"Final Container Duration: {c_dur:.3f}")
    print(f"Final Video Duration: {v_dur:.3f}")
    print(f"Final Audio Duration: {a_dur:.3f}")
    print(f"A/V difference: {abs(v_dur - a_dur):.3f}")
    print(f"B-roll Requested: {num_requested}")
    print(f"B-roll Successfully Rendered: {len(broll_map)}")

if __name__ == "__main__":
    run_diagnostic()
