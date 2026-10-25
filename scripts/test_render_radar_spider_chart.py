#!/usr/bin/env python3
"""
Renders a preview video for the Phase 8 RadarSpiderChart motion graphic.
Includes multi-track sound effects (entrance wind, radar ping shimmer, and comparative metric lock click).
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
PING_SFX = os.path.join(SFX_DIR, "chime-reward.mp3")
CLICK_SFX = os.path.join(SFX_DIR, "ui-click-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_radar_spider_chart.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_radar_spider_chart.mp4")

props = {
    "title": "FRONTIER MODEL BENCHMARK",
    "subtitle": "MULTI-DIMENSIONAL PERFORMANCE & ARCHITECTURAL TRADEOFF MATRIX",
    "badge": "POLYGONAL RADAR BENCHMARK",
    "synthesis": "Radar evaluations reveal asymmetric trade-offs: cognitive swarms sacrifice raw inference speed for epistemic accuracy.",
    "axis1": "Reasoning Depth",
    "axis2": "Inference Speed",
    "axis3": "Context Coherence",
    "axis4": "Cost Efficiency",
    "axis5": "Autonomous Agency",
    "entity1Name": "Autonomous Agent System",
    "entity1Score1": 96,
    "entity1Score2": 72,
    "entity1Score3": 98,
    "entity1Score4": 86,
    "entity1Score5": 94,
    "entity1Badge": "STATEFUL SWARM",
    "entity1Color": "#00E5FF",
    "entity2Name": "Monolithic Base LLM",
    "entity2Score1": 68,
    "entity2Score2": 94,
    "entity2Score3": 70,
    "entity2Score4": 64,
    "entity2Score5": 52,
    "entity2Badge": "ZERO-SHOT PROMPT",
    "entity2Color": "#F59E0B",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering RadarSpiderChart MOV...")
res = render_motion_graphic(
    composition_id="radar-spider-chart",
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
    "[1:a]volume=0.85,adelay=150|150[a1];"
    "[2:a]volume=0.75,adelay=600|600[a2];"
    "[3:a]volume=0.80,adelay=1100|1100[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WIND_SFX,
    "-i", PING_SFX,
    "-i", CLICK_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "radar_spider_chart_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "radar_spider_chart_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "radar_spider_chart_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
