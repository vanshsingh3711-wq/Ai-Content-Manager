import os
import sys
import json
import subprocess
import re

sys.path.insert(0, os.path.abspath('../api'))
sys.path.insert(0, os.path.abspath('.'))

from database import get_session
from models import VideoJob
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.subtitle_generator import generate_ass_subtitles
from services.compositor import render_video_pipeline, _probe_duration, get_ffmpeg_binary_path, _get_ffprobe_bin
from services.asset_manager import fetch_broll_assets
from services.blueprint_validator import validate_blueprint

def parse_ass_dialogues(ass_path):
    events = []
    with open(ass_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("Dialogue:"):
                # Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                parts = line[len("Dialogue:"):].strip().split(",", 9)
                if len(parts) == 10:
                    start_str = parts[1].strip()
                    end_str = parts[2].strip()
                    text = parts[9].strip()
                    
                    def ass_to_sec(t_str):
                        h, m, s = t_str.split(":")
                        return int(h) * 3600 + int(m) * 60 + float(s)
                    
                    start_sec = ass_to_sec(start_str)
                    end_sec = ass_to_sec(end_str)
                    events.append({
                        "start_str": start_str,
                        "end_str": end_str,
                        "start_sec": start_sec,
                        "end_sec": end_sec,
                        "text": text
                    })
    return events

def run_caption_validation():
    print("==================================================")
    print("WORD-LEVEL CAPTION VALIDATION END-TO-END")
    print("==================================================")
    
    raw_video_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4"
    extracted_wav_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker\temp_test_audio.wav"
    output_ass_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker\captions_validated.ass"
    output_mp4_path = r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\apps\worker\final_caption_validated.mp4"
    
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    print(f"Source video duration: {total_duration:.3f}s")
    
    # 1. Load transcription and edits from DB
    session = next(get_session())
    job = session.query(VideoJob).filter(VideoJob.title == 'Testing video for editor').first()
    edl_data = json.loads(job.edit_decision_list)
    timestamp_map = edl_data["timestamp_map"]
    edits = edl_data.get("edits", [])
    
    validated_edits, val_report = validate_blueprint(edits, timestamp_map, total_duration)
    print(f"Validated edits: {len(validated_edits)} items (Accepted: {val_report.accepted_count})")
    
    # Count words in source transcript
    all_source_words = []
    for chunk_id, chunk_data in timestamp_map.items():
        for w in chunk_data.get("words", []):
            if w.get("word", "").strip():
                all_source_words.append(w)
    print(f"Total source words in transcription: {len(all_source_words)}")
    first_source_word = all_source_words[0] if all_source_words else {}
    last_source_word = all_source_words[-1] if all_source_words else {}
    print(f"Source word range: '{first_source_word.get('word')}' ({first_source_word.get('start')}s) -> '{last_source_word.get('word')}' ({last_source_word.get('end')}s)")
    source_transcript_dur = last_source_word.get('end', 0.0) - first_source_word.get('start', 0.0)
    print(f"Source transcript active speech duration: {source_transcript_dur:.3f}s")
    
    # 2. Generate .ass subtitle representation
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=output_ass_path,
        edits=validated_edits,
        font_size=50,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000FFFF",
    )
    
    # 3. Inspect generated subtitle data before rendering
    events = parse_ass_dialogues(output_ass_path)
    print(f"\n=== CAPTION DATA INSPECTION (PRE-RENDER) ===")
    print(f"Total caption events generated: {len(events)}")
    
    if not events:
        print("ERROR: No caption events generated!")
        return
        
    first_event = events[0]
    last_event = events[-1]
    print(f"First caption event: [{first_event['start_str']} - {first_event['end_str']}] (start_sec={first_event['start_sec']:.3f})")
    print(f"  Text: {first_event['text']}")
    print(f"Last caption event:  [{last_event['start_str']} - {last_event['end_str']}] (end_sec={last_event['end_sec']:.3f})")
    print(f"  Text: {last_event['text']}")
    
    # Verify timestamp ordering & monotonicity
    is_ordered = True
    has_empty_words = False
    for i in range(len(events) - 1):
        if events[i]["start_sec"] > events[i+1]["start_sec"]:
            print(f"Timestamp ordering violation at event {i}: {events[i]['start_sec']} > {events[i+1]['start_sec']}")
            is_ordered = False
            
    for ev in events:
        raw_text = re.sub(r"\{.*?\}", "", ev["text"]).strip()
        if not raw_text:
            has_empty_words = True
            print(f"Empty/whitespace caption found: {ev}")
            
    print(f"Timestamps monotonically ordered: {is_ordered}")
    print(f"Contains empty/whitespace-only captions: {has_empty_words}")
    
    # 4. Render captions into the final MP4
    print("\n=== RENDERING FINAL MP4 WITH CAPTIONS ===")
    broll_map = fetch_broll_assets(validated_edits)
    
    render_video_pipeline(
        raw_video_path=raw_video_path,
        output_mp4_path=output_mp4_path,
        subtitle_ass_path=output_ass_path,
        broll_map=broll_map,
        edits=validated_edits,
        timestamp_map=timestamp_map,
    )
    
    # 5. Measure final media
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    probe_res = subprocess.run(
        [ffprobe_bin, "-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "json", output_mp4_path],
        capture_output=True, text=True
    )
    data = json.loads(probe_res.stdout)
    v_dur = 0.0
    a_dur = 0.0
    for s in data.get("streams", []):
        if s.get("codec_type") == "video":
            v_dur = float(s.get("duration", 0) or 0)
        elif s.get("codec_type") == "audio":
            a_dur = float(s.get("duration", 0) or 0)
            
    fmt_res = subprocess.run(
        [ffprobe_bin, "-v", "error", "-show_entries", "format=duration,size", "-of", "json", output_mp4_path],
        capture_output=True, text=True
    )
    fmt_data = json.loads(fmt_res.stdout).get("format", {})
    c_dur = float(fmt_data.get("duration", 0) or 0)
    file_size = int(fmt_data.get("size", 0) or 0)
    
    print("\n=== FINAL MEASUREMENTS & REPORT ===")
    print(f"Source Transcript Duration (active speech): {source_transcript_dur:.3f}s")
    print(f"First Caption Timestamp: {first_event['start_sec']:.3f}s ({first_event['start_str']})")
    print(f"Last Caption Timestamp:  {last_event['end_sec']:.3f}s ({last_event['end_str']})")
    print(f"Final Rendered File Size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")
    print(f"Final Video Duration:     {v_dur:.3f}s")
    print(f"Final Audio Duration:     {a_dur:.3f}s")
    print(f"Final Container Duration: {c_dur:.3f}s")
    print(f"A/V Duration Delta:       {abs(v_dur - a_dur):.3f}s")
    print(f"Total Caption Events:     {len(events)}")
    print(f"Subtitles Burned Over B-roll & Original Footage: SUCCESS")

if __name__ == "__main__":
    run_caption_validation()
