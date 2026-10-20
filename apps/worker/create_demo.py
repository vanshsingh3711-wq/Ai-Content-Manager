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

script_text = """
Content creation used to be manual, slow, and expensive. But AI is completely changing the game. 
Today, building a professional video requires just a few lines of code. 
The engine instantly understands your story, structures the scenes, creates visuals, and syncs the narration. 
Instead of wasting hours on editing, you get a fully rendered, premium documentary in seconds. 
From script, to motion. Your video is ready. Create. Animate. Publish.
"""

async def main():
    audio_path = "demo_audio.mp3"
    wav_path = "demo_audio.wav"
    raw_video = "demo_raw_16_9.mp4"

    if not os.path.exists(audio_path):
        print("Generating voice with edge-tts...")
        proc = await asyncio.create_subprocess_exec(
            ".venv/bin/edge-tts", "--voice", "en-US-ChristopherNeural", "--rate=+10%", "--text", script_text, "--write-media", audio_path
        )
        await proc.communicate()
        subprocess.run(["ffmpeg", "-y", "-i", audio_path, "-ac", "1", "-ar", "16000", wav_path], capture_output=True)
    
    if not os.path.exists(raw_video):
        print("Generating 16:9 background video (random visual)...")
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
    
    # Append instructions to unified analysis to force the director to use faceless style
    # and all the new components!
    extra_context = {
        "style_guidelines": "This is a FACELESS documentary promo video. Use 'b_roll' for backgrounds. Heavily use 'motion_graphics' like before_after, code_reveal, step_sequence, icon_reveal, media_reveal. Make it very dense and visually engaging. You are showcasing the motion graphics engine itself."
    }

    visual_timeline = {
        "video_id": "demo_test",
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
    
    # MOCK THE AI DIRECTOR OUTPUT DUE TO LLM API CREDIT ISSUES
    edits = [
      {
        "action": "b_roll",
        "search_query": "typing code late at night",
        "start": 0.0,
        "end": 4.5
      },
      {
        "action": "motion_graphics",
        "trigger_id": "ID_01",
        "motion_graphics_type": "before_after",
        "motion_graphics_targets": {
          "beforeLabel": "MANUAL",
          "before": "Slow and expensive",
          "afterLabel": "AI DRIVEN",
          "after": "Instant and automated"
        },
        "motion_graphics_personality": "premium",
        "transition": "fade",
        "start": 1.0,
        "end": 6.0
      },
      {
        "action": "b_roll",
        "search_query": "artificial intelligence neural network",
        "start": 4.5,
        "end": 9.0,
        "transition": "fade"
      },
      {
        "action": "motion_graphics",
        "trigger_id": "ID_02",
        "motion_graphics_type": "code_reveal",
        "motion_graphics_targets": {
          "code": "import ai_director\n\nvideo = ai_director.generate(\n    prompt='Documentary',\n    length=30\n)\n\nvideo.publish()"
        },
        "motion_graphics_personality": "technical",
        "start": 7.5,
        "end": 13.0
      },
      {
        "action": "b_roll",
        "search_query": "data center server room",
        "start": 9.0,
        "end": 17.0,
        "transition": "slide"
      },
      {
        "action": "motion_graphics",
        "trigger_id": "ID_03",
        "motion_graphics_type": "step_sequence",
        "motion_graphics_targets": {
          "title": "THE PIPELINE",
          "step1": "Audio Analysis",
          "step2": "Motion Graphics",
          "step3": "Compositing"
        },
        "motion_graphics_personality": "energetic",
        "start": 13.5,
        "end": 20.0
      },
      {
        "action": "b_roll",
        "search_query": "cinematic beautiful landscape",
        "start": 17.0,
        "end": 25.0,
        "transition": "fade"
      },
      {
        "action": "motion_graphics",
        "trigger_id": "ID_04",
        "motion_graphics_type": "metric_reveal",
        "motion_graphics_targets": {
          "label": "RENDER TIME",
          "metric": "14",
          "delta": "SECONDS"
        },
        "motion_graphics_personality": "premium",
        "start": 21.0,
        "end": 27.0
      },
      {
        "action": "b_roll",
        "search_query": "success celebration",
        "start": 25.0,
        "end": 35.0,
        "transition": "morph"
      },
      {
        "action": "motion_graphics",
        "trigger_id": "ID_05",
        "motion_graphics_type": "hero_reveal",
        "motion_graphics_targets": {
          "label": "AI DIRECTOR",
          "headline": "CREATE.",
          "accent": "ANIMATE.",
          "supporting": "PUBLISH."
        },
        "motion_graphics_personality": "premium",
        "start": 28.0,
        "end": 34.0
      }
    ]
    
    print("Finished Planning. Edits:")
    print(json.dumps(edits, indent=2))
    
    out_video = "demo_showcase.mp4"
    print("Running compositor...")
    start_time = time.time()
    try:
        final_out = render_video_pipeline(
            raw_video_path=raw_video,
            output_mp4_path=out_video,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "16:9"}
        )
        elapsed = time.time() - start_time
        print(f"\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
