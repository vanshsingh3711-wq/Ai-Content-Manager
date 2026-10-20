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

async def main():
    # 1. No voiceover needed! We'll just generate an empty silent audio track to keep FFmpeg happy.
    wav_path = "silent_35s.wav"
    raw_video = "demo_raw_16_9.mp4"
    total_duration = 35.0

    if not os.path.exists(wav_path):
        print("Generating 35s silent audio track...")
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "35", wav_path], capture_output=True)
    
    if not os.path.exists(raw_video):
        print("Generating 16:9 background video (dark cinematic base)...")
        subprocess.run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:r=30",
            "-i", wav_path,
            "-c:v", "libx264", "-c:a", "aac", "-shortest", "-pix_fmt", "yuv420p", raw_video
        ], capture_output=True)

    print("Mapping the User's Exact Scene Script to the Motion Engine...")
    
    edits = [
        # Scene 1: The Input (0 - 4.5s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_1",
            "search_query": "typing on keyboard dark mode",
            "start": 0.0,
            "end": 4.5,
            "transition": "fade"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_1",
            "motion_graphics_type": "code_reveal",
            "motion_graphics_targets": {
                "code": "> Create a 30-second video explaining how AI is changing content creation.\n\n[16:9]\n[Premium]\n[Motion Graphics]\n\nGenerating..."
            },
            "motion_graphics_personality": "technical",
            "start": 0.0,
            "end": 4.5
        },

        # Scene 2: The Engine Starts (4.5 - 7.5s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_2",
            "search_query": "abstract digital network data",
            "start": 4.5,
            "end": 7.5,
            "transition": "slide"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_2",
            "motion_graphics_type": "quote_reveal",
            "motion_graphics_targets": {
                "quote": "Understanding your story...",
                "author": "Engine Core"
            },
            "motion_graphics_personality": "premium",
            "start": 4.5,
            "end": 7.5
        },

        # Scene 3: AI Builds the Video (7.5 - 15s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_3",
            "search_query": "3d geometric shapes floating dark",
            "start": 7.5,
            "end": 15.0,
            "transition": "fade"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_3",
            "motion_graphics_type": "step_sequence",
            "motion_graphics_targets": {
                "title": "SYSTEM STATES",
                "step1": "Structuring scenes",
                "step2": "Creating visuals",
                "step3": "Applying motion"
            },
            "motion_graphics_personality": "energetic",
            "start": 7.5,
            "end": 15.0
        },

        # Scene 4: The Motion Engine (15 - 21s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_4",
            "search_query": "server rack lights flashing",
            "start": 15.0,
            "end": 21.0,
            "transition": "wipe"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_4",
            "motion_graphics_type": "before_after",
            "motion_graphics_targets": {
                "beforeLabel": "SCRIPT",
                "before": "Raw text input",
                "afterLabel": "MOTION",
                "after": "Fully composed layers"
            },
            "motion_graphics_personality": "premium",
            "start": 15.0,
            "end": 21.0
        },

        # Scene 5: Rendering (21 - 25s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_5",
            "search_query": "futuristic loading screen",
            "start": 21.0,
            "end": 25.0,
            "transition": "fade"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_5",
            "motion_graphics_type": "metric_reveal",
            "motion_graphics_targets": {
                "label": "RENDERING ENGINE",
                "metric": "100",
                "delta": "COMPLETE"
            },
            "motion_graphics_personality": "energetic",
            "start": 21.0,
            "end": 25.0
        },

        # Scene 6: The Notification (25 - 29s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_6",
            "search_query": "laptop screen modern desk dark",
            "start": 25.0,
            "end": 29.0,
            "transition": "fade"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_6",
            "motion_graphics_type": "icon_reveal",
            "motion_graphics_targets": {
                "icon": "check-circle",
                "label": "Your video is ready."
            },
            "motion_graphics_personality": "premium",
            "start": 25.0,
            "end": 29.0
        },

        # Scene 7: Final Reveal (29 - 35s)
        {
            "action": "b_roll",
            "trigger_id": "ID_SCENE_7",
            "search_query": "cinematic dark subtle movement",
            "start": 29.0,
            "end": 35.0,
            "transition": "fade"
        },
        {
            "action": "motion_graphics",
            "trigger_id": "ID_SCENE_7",
            "motion_graphics_type": "hero_reveal",
            "motion_graphics_targets": {
                "label": "THE NEW STANDARD",
                "headline": "CREATE.",
                "accent": "ANIMATE.",
                "supporting": "PUBLISH."
            },
            "motion_graphics_personality": "premium",
            "start": 29.0,
            "end": 35.0
        }
    ]

    # Create a precise timestamp map corresponding to the scenes so the compositor can splice it accurately
    timestamp_map = {
        "ID_SCENE_1": {"start": 0.0, "end": 4.5, "text": "Scene 1"},
        "ID_SCENE_2": {"start": 4.5, "end": 7.5, "text": "Scene 2"},
        "ID_SCENE_3": {"start": 7.5, "end": 15.0, "text": "Scene 3"},
        "ID_SCENE_4": {"start": 15.0, "end": 21.0, "text": "Scene 4"},
        "ID_SCENE_5": {"start": 21.0, "end": 25.0, "text": "Scene 5"},
        "ID_SCENE_6": {"start": 25.0, "end": 29.0, "text": "Scene 6"},
        "ID_SCENE_7": {"start": 29.0, "end": 35.0, "text": "Scene 7"}
    }

    out_video = "user_script_showcase.mp4"
    print("Running compositor with explicit visual timeline...")
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
