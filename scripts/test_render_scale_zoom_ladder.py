#!/usr/bin/env python3
"""
Renders a preview video for the Phase 6 ScaleZoomLadder motion graphic.
Includes multi-track sound effects (stage 1 unit focus whoosh, stage 2 1000x cluster click, and stage 3 monolithic deep impact).
"""

import os
import sys
import subprocess
import shutil

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "apps", "worker"))

from services.remotion_renderer import render_motion_graphic

MEDIA_DIR = os.path.join(PROJECT_ROOT, "media_temp", "previews")
ARTIFACT_DIR = "/home/vansh/.gemini/antigravity-ide/brain/cb81d15f-5ba3-429a-ae18-c6b1399bf82f"
SFX_DIR = os.path.join(PROJECT_ROOT, "apps", "worker", "data", "sfx", "clips")

WIND_SFX = os.path.join(SFX_DIR, "whoosh-wind.mp3")
CLICK_SFX = os.path.join(SFX_DIR, "ui-click-soft.mp3")
IMPACT_SFX = os.path.join(SFX_DIR, "impact-deep-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_scale_zoom_ladder.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_scale_zoom_ladder.mp4")

props = {
    "title": "THE ILLUSION OF SCALE",
    "subtitle": "HOW HUMAN INTUITION FAILS AT ORDERS OF MAGNITUDE EXPANSION",
    "badge": "EXPONENTIAL MAGNITUDE LADDER",
    "synthesis": "The difference between a million and a billion is approximately one billion. Intuition flattens exponential scale.",
    "step1Value": "$1 MILLION",
    "step1Label": "11.5 DAYS",
    "step1Desc": "1 Million seconds elapsed in real time",
    "step1Metric": "1x (BASE UNIT)",
    "step2Value": "$1 BILLION",
    "step2Label": "31.7 YEARS",
    "step2Desc": "1 Billion seconds elapsed (entire career)",
    "step2Metric": "1,000x MULTIPLIER",
    "step3Value": "$1 TRILLION",
    "step3Label": "31,700 YEARS",
    "step3Desc": "1 Trillion seconds (before recorded civilization)",
    "step3Metric": "1,000,000x MONOLITH",
    "accentColor": "#00E5FF",
    "step1Color": "#38BDF8",
    "step2Color": "#818CF8",
    "step3Color": "#F43F5E",
    "durationInFrames": 135
}

print("🎬 Rendering ScaleZoomLadder MOV...")
res = render_motion_graphic(
    composition_id="scale-zoom-ladder",
    props=props,
    duration_frames=135,
    fps=30,
    width=1920,
    height=1080,
    output_path=raw_mov,
    concurrency=1
)

if not res or not os.path.exists(raw_mov):
    print("❌ Render failed")
    sys.exit(1)

print("🎵 Mixing audio and encoding MP4...")
filter_complex = (
    "[0:v]format=yuva420p[fg];"
    "color=c=#050505:s=1920x1080:d=4.5[bg];"
    "[bg][fg]overlay=0:0:shortest=1[vout];"
    "[1:a]volume=0.80,adelay=150|150[a1];"
    "[2:a]volume=0.85,adelay=800|800[a2];"
    "[3:a]volume=0.95,adelay=1500|1500[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WIND_SFX,
    "-i", CLICK_SFX,
    "-i", IMPACT_SFX,
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-map", "[aout]",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-t", "4.5",
    "-threads", "2",
    final_mp4
]

subprocess.run(cmd, check=True)

# Extract a high-res frame at 2.5s for visual inspection
frame_jpg = os.path.join(MEDIA_DIR, "scale_zoom_ladder_frame_25s.jpg")
cmd_frame = [
    "ffmpeg", "-y",
    "-ss", "2.5",
    "-i", final_mp4,
    "-vframes", "1",
    "-q:v", "2",
    frame_jpg
]
subprocess.run(cmd_frame, check=True)

# Copy to artifacts
if os.path.exists(ARTIFACT_DIR):
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "scale_zoom_ladder_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "scale_zoom_ladder_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
