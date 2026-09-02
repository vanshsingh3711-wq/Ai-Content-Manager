import os
import sys
import json
import subprocess

sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob
from services.transcriber import transcribe_and_compress
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.visual_analysis import analyze_visual_context, UnifiedAnalysis
from services.ai_director import generate_edit_decisions
from services.blueprint_validator import validate_blueprint
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin

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
    extracted_wav_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker\temp_test_audio.wav"
    
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    print(f"=== Source duration: {total_duration:.3f} ===")
    
    print("Transcribing (from cache if possible)...")
    # Actually, we can reuse the transcript we got from DB to save 20s
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()
    edl_data = json.loads(job.edit_decision_list)
    bracketed_transcript = edl_data["bracketed_transcript"]
    timestamp_map = edl_data["timestamp_map"]
    
    # We also need unified analysis. Let's just generate it fast by pulling regions
    print("Extracting analysis...")
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
    
    # Fake visual for speed
    visual_timeline = {
        "video_id": job_id,
        "duration": total_duration,
        "segments": [{"start": 0, "end": total_duration, "has_faces": True, "action_intensity": "low"}]
    }
    
    unified_analysis = UnifiedAnalysis(
        transcript=bracketed_transcript,
        audio_analysis={"regions": unified_audio_regions},
        visual_analysis=visual_timeline
    )
    
    print("AI Director generating cuts...")
    # Generate actual edit decisions!
    edit_decision_list = generate_edit_decisions(unified_analysis.model_dump_json())
    
    print("Validating blueprint...")
    edits_dicts = [e.model_dump() for e in edit_decision_list.edits]
    validated_edits, validation_report = validate_blueprint(
        edits=edits_dicts,
        timestamp_map=timestamp_map,
        video_duration=total_duration,
    )
    
    # Calculate expected final duration
    expected_cuts_duration = sum(e["end"] - e["start"] for e in validated_edits if e["action"] == "cut")
    expected_final_duration = total_duration - expected_cuts_duration
    
    print("=== Requested cut intervals ===")
    cuts = [e for e in validated_edits if e["action"] == "cut"]
    for cut in cuts:
        print(f"Cut: {cut['start']:.3f} - {cut['end']:.3f} (dur: {cut['end'] - cut['start']:.3f})")
    
    print(f"=== Expected Final Duration: {expected_final_duration:.3f} ===")
    
    if len(cuts) == 0:
        print("WARNING: AI Director produced no cuts. We cannot verify if first spoken sentence is kept without an intro cut.")
        
    print("=== Rendering... ===")
    temp_dir = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker"
    rendered_mp4_path = os.path.join(temp_dir, "final_full_diagnostic.mp4")
    subtitle_ass_path = os.path.join(temp_dir, "subtitles_full_diagnostic.ass")
    
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
        broll_map={},
        edits=validated_edits,
        timestamp_map=timestamp_map,
    )
    
    c_dur, v_dur, a_dur = get_stream_durations(rendered_mp4_path)
    print("=== FINAL RESULTS ===")
    print(f"Final Container Duration: {c_dur:.3f}")
    print(f"Final Video Duration: {v_dur:.3f}")
    print(f"Final Audio Duration: {a_dur:.3f}")
    print(f"A/V difference: {abs(v_dur - a_dur):.3f}")
    
if __name__ == "__main__":
    run_diagnostic()
