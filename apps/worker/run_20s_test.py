import os
import subprocess
import asyncio
import time
import sys
import json
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.getcwd())
from services.compositor import render_video_pipeline
from services.transcriber import transcribe_and_compress
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.ai_director import generate_edit_decisions
from services.visual_analysis import UnifiedAnalysis

async def main():
    base_audio = "sample_video/same_audio.mp3"
    wav_path = "demo_20s.wav"
    raw_video = "demo_20s_raw.mp4"
    out_video = "demo_20s_final.mp4"

    if not os.path.exists(base_audio):
        print(f"Error: {base_audio} not found!")
        return

    print("Slicing audio to 20s...")
    subprocess.run([
        "ffmpeg", "-y", "-t", "20", "-i", base_audio, 
        "-ac", "1", "-ar", "16000", wav_path
    ], capture_output=True)
    
    print("Generating 9:16 background video (blank)...")
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30",
        "-i", wav_path,
        "-t", "20",
        "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p", raw_video
    ], capture_output=True)
    
    total_duration = 20.0
    
    print("Transcribing with Whisper...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(wav_path)
    
    print("Detecting silences and regions...")
    silence_results = detect_silences(wav_path)
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
    
    visual_timeline = {
        "video_id": "faceless documentary test",
        "duration": total_duration,
        "segments": [{"start": 0, "end": total_duration, "has_faces": False, "action_intensity": "high"}]
    }
    
    unified_analysis = UnifiedAnalysis(
        transcript=bracketed_transcript,
        audio_analysis={"regions": unified_audio_regions},
        visual_analysis=visual_timeline
    )
    
    print("Invoking AI Director & Sub-Agents to plan visual beats and edits...")
    edit_decision_list = generate_edit_decisions(unified_analysis.model_dump_json())
    edits = [e.model_dump() for e in edit_decision_list.edits]
    
    print("Finished Planning. Edits:")
    print(json.dumps(edits, indent=2))
    
    print("Running compositor...")
    start_time = time.time()
    try:
        final_out = render_video_pipeline(
            raw_video_path=raw_video,
            output_mp4_path=out_video,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "9:16"}
        )
        elapsed = time.time() - start_time
        print(f"\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
