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
Did you know that space is completely silent? 
There is no atmosphere in space, which means that sound has no medium or way to travel to be heard.
Astronauts use radios to stay in communication while in space, since radio waves can still be sent and received.
Let's talk about the ocean now. The ocean covers more than 70 percent of the surface of our planet.
It's hard to imagine, but about 97 percent of the Earth's water can be found in our oceans.
And here's a crazy fact about animals. An octopus has three hearts, nine brains, and blue blood.
Two of the hearts work exclusively to move blood beyond the animal's gills, while the third keeps circulation flowing for the organs.
Finally, a day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once on its axis.
But it takes only 225 Earth days to complete one orbit around the Sun.
That is all for today's interesting facts!
"""

async def main():
    audio_path = "ai_random_audio.mp3"
    wav_path = "ai_random_audio.wav"
    raw_video = "ai_random_raw_9_16.mp4"

    if not os.path.exists(audio_path):
        print("Generating voice with edge-tts...")
        proc = await asyncio.create_subprocess_exec(
            "edge-tts", "--voice", "en-US-ChristopherNeural", "--text", script_text, "--write-media", audio_path
        )
        await proc.communicate()
        subprocess.run(["ffmpeg", "-y", "-i", audio_path, "-ac", "1", "-ar", "16000", wav_path], capture_output=True)
    
    if not os.path.exists(raw_video):
        print("Generating 9:16 background video (random visual)...")
        subprocess.run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", "mandelbrot=size=1080x1920:rate=30",
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
    
    visual_timeline = {
        "video_id": "random_test",
        "duration": total_duration,
        "segments": [{"start": 0, "end": total_duration, "has_faces": False, "action_intensity": "low"}]
    }
    
    unified_analysis = UnifiedAnalysis(
        transcript=bracketed_transcript,
        audio_analysis={"regions": unified_audio_regions},
        visual_analysis=visual_timeline
    )
    
    print("Invoking AI Director & Sub-Agents to plan visual beats and edits...")
    # This will call the LLM!
    edit_decision_list = generate_edit_decisions(unified_analysis.model_dump_json())
    edits = [e.model_dump() for e in edit_decision_list.edits]
    
    print("Finished Planning. Edits:")
    print(json.dumps(edits, indent=2))
    
    out_video = "random_1min_9_16_ai_director.mp4"
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
        print(f"\\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
    except Exception as e:
        print(f"\\nFAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
