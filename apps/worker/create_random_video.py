import os
import random
import subprocess
import asyncio
import time
import sys

sys.path.append(os.getcwd())
from services.compositor import render_video_pipeline

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
    print("Generating voice with edge-tts...")
    audio_path = "random_audio.mp3"
    proc = await asyncio.create_subprocess_exec(
        "edge-tts", "--voice", "en-US-ChristopherNeural", "--text", script_text, "--write-media", audio_path
    )
    await proc.communicate()
    
    print("Generating 16:9 background video (random visual)...")
    raw_video = "random_raw_16_9.mp4"
    # Create a mandelbrot fractal video
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "mandelbrot=size=1920x1080:rate=30",
        "-i", audio_path,
        "-c:v", "libx264", "-c:a", "aac", "-shortest", "-pix_fmt", "yuv420p", raw_video
    ], capture_output=True)
    
    print("Setting up visual beats...")
    
    timestamp_map = {
        "chunk1": {"start": 0.0, "end": 15.0, "text": "Space is completely silent."},
        "chunk2": {"start": 15.0, "end": 30.0, "text": "The ocean covers 70% of Earth."},
        "chunk3": {"start": 30.0, "end": 45.0, "text": "An octopus has 3 hearts."},
        "chunk4": {"start": 45.0, "end": 60.0, "text": "A day on Venus is longer than a year."}
    }
    
    edits = [
        {
            "trigger_id": "chunk1",
            "action": "motion_graphics",
            "motion_graphics_text": "Space is Silent",
            "transition": "fade",
            "visual_beats": [
                {"timestamp": 0.0, "text": "Space is Silent", "emphasis": "intro", "animation_state": "intro"},
                {"timestamp": 5.0, "text": "No atmosphere", "emphasis": "highlight", "animation_state": "changing"}
            ]
        },
        {
            "trigger_id": "chunk2",
            "action": "character",
            "character_action": "explaining",
            "transition": "slide",
            "visual_beats": [
                {"timestamp": 0.0, "text": "Ocean", "emphasis": "intro", "animation_state": "explaining"},
                {"timestamp": 5.0, "text": "97% of water", "emphasis": "nod", "animation_state": "explaining"}
            ]
        },
        {
            "trigger_id": "chunk3",
            "action": "motion_graphics",
            "motion_graphics_text": "Octopus Facts",
            "transition": "push",
            "visual_beats": [
                {"timestamp": 0.0, "text": "Octopus: 3 Hearts", "emphasis": "intro", "animation_state": "intro"},
                {"timestamp": 5.0, "text": "9 Brains!", "emphasis": "zoom", "animation_state": "changing"}
            ]
        },
        {
            "trigger_id": "chunk4",
            "action": "character",
            "character_action": "surprised",
            "transition": "fade",
            "visual_beats": [
                {"timestamp": 0.0, "text": "Venus Day > Year", "emphasis": "jump", "animation_state": "surprised"},
                {"timestamp": 7.0, "text": "That's all!", "emphasis": "nod", "animation_state": "happy"}
            ]
        }
    ]
    
    out_video = "random_1min_16_9_final.mp4"
    
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
        print(f"\\nSUCCESS! Rendered in {elapsed:.2f} seconds.")
        print(f"Output saved to: {final_out}")
    except Exception as e:
        print(f"\\nFAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
