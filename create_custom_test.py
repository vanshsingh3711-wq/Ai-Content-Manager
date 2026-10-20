import os
import subprocess
import asyncio
import time
import sys
import json
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.getcwd() + "/apps/worker")
os.chdir("apps/worker")

from services.compositor import render_video_pipeline
from services.transcriber import transcribe_and_compress
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.ai_director import generate_edit_decisions
from services.visual_analysis import UnifiedAnalysis

script_text = """
Every day, businesses generate massive amounts of data.
Customer messages. Sales numbers. Reports. Emails. Invoices.
And most of it still requires someone to manually process it.
But what if your software could understand that information and actually do something with it?
Imagine dropping a messy collection of customer data into one system.
The AI analyzes it, identifies important patterns, finds unusual activity, and turns the raw information into something you can actually use.
It could tell you which customers are most likely to leave. Which products are performing best. Where you're losing money. And what needs your attention right now.
Instead of spending hours searching through spreadsheets and dashboards, you get the important information immediately.
The AI handles the analysis. The system organizes everything. And you stay in control of the decisions.
Because the future of software isn't about giving you more information.
It's about turning information into action.
"""

async def main():
    audio_path = "test_audio.mp3"
    wav_path = "test_audio.wav"
    raw_video = "test_raw_16_9.mp4"

    print("Generating voice with edge-tts...")
    proc = await asyncio.create_subprocess_exec(
        "../../.venv/bin/edge-tts", "--voice", "en-US-ChristopherNeural", "--rate=+10%", "--text", script_text, "--write-media", audio_path
    )
    await proc.communicate()
    subprocess.run(["ffmpeg", "-y", "-i", audio_path, "-ac", "1", "-ar", "16000", wav_path], capture_output=True)
    
    print("Generating 16:9 background video (black placeholder)...")
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:r=30",
        "-i", wav_path,
        "-c:v", "libx264", "-c:a", "aac", "-shortest", "-pix_fmt", "yuv420p", raw_video
    ], capture_output=True)
    
    # Get total duration
    dur_proc = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", raw_video], capture_output=True, text=True)
    total_duration = float(dur_proc.stdout.strip())
    
    print(f"Total video duration: {total_duration}")
    
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
    
    extra_context = {
        "style_guidelines": "This is a FACELESS software promo video. Focus entirely on UI overlays and abstract B-Roll. Heavily use 'motion_graphics' overlays (hero_reveal, step_sequence, quote_reveal, metric_reveal, before_after) over dark dramatic b_roll clips to make it look extremely premium and professional."
    }

    visual_timeline = {
        "video_id": "custom_test",
        "duration": total_duration,
        "segments": [{"start": 0, "end": total_duration, "has_faces": False, "action_intensity": "high"}],
        "meta": extra_context
    }
    
    unified_analysis = UnifiedAnalysis(
        transcript=bracketed_transcript,
        audio_analysis={"regions": unified_audio_regions},
        visual_analysis=visual_timeline
    )
    
    print("Invoking AI Director & Sub-Agents to plan visual beats and edits...")
    
    edits = [
      {
        "action": "motion_graphics",
        "trigger_id": "MOCK_01",
        "motion_graphics_type": "metric_reveal",
        "motion_graphics_targets": {"label": "DATA GENERATED", "metric": "2.5", "delta": "QUINTILLION BYTES"},
        "motion_graphics_personality": "premium",
        "start": 0.0,
        "end": 6.0
      },
      {
        "action": "motion_graphics",
        "trigger_id": "MOCK_02",
        "motion_graphics_type": "before_after",
        "motion_graphics_targets": {"beforeLabel": "MESSY DATA", "before": "Spreadsheets & Invoices", "afterLabel": "ACTIONABLE", "after": "Insights & Decisions"},
        "motion_graphics_personality": "technical",
        "start": 13.0,
        "end": 20.0
      },
      {
        "action": "motion_graphics",
        "trigger_id": "MOCK_03",
        "motion_graphics_type": "step_sequence",
        "motion_graphics_targets": {"title": "THE AI PROCESS", "step1": "Analyze Data", "step2": "Identify Patterns", "step3": "Take Action"},
        "motion_graphics_personality": "energetic",
        "start": 21.0,
        "end": 28.0
      },
      {
        "action": "motion_graphics",
        "trigger_id": "MOCK_04",
        "motion_graphics_type": "hero_reveal",
        "motion_graphics_targets": {"label": "THE FUTURE", "headline": "INFORMATION", "accent": "INTO ACTION.", "supporting": "STAY IN CONTROL"},
        "motion_graphics_personality": "premium",
        "start": 48.0,
        "end": 60.0
      }
    ]
    
    print("Finished Planning. Edits:")
    print(json.dumps(edits, indent=2))
    
    out_video = "../../custom_test_video.mp4"
    print("Running compositor...")
    start_time = time.time()
    try:
        final_out = render_video_pipeline(
            raw_video_path=raw_video,
            output_mp4_path=out_video,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "16:9", "USE_GRANULAR_OVERLAYS": True}
        )
        elapsed = time.time() - start_time
        print(f"\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
