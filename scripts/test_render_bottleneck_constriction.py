#!/usr/bin/env python3
"""
Renders a preview video for the Phase 4 BottleneckConstriction motion graphic.
Includes multi-track sound effects (intake fluid whoosh, electrical friction zap, and hydraulic clamp impact).
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
ZAP_SFX = os.path.join(SFX_DIR, "zap-electric.mp3")
IMPACT_SFX = os.path.join(SFX_DIR, "impact-deep-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_bottleneck_constriction.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_bottleneck_constriction.mp4")

props = {
    "title": "THE COMPUTE MEMORY WALL",
    "subtitle": "WHY RAW FLOP CAPACITY IS CONSTRAINED BY INTERCONNECT BANDWIDTH",
    "badge": "THROUGHPUT CAPACITY FUNNEL",
    "inputLabel": "INCOMING CAPACITY",
    "inputMetric": "1,000 TFLOPS",
    "inputDesc": "Peak GPU arithmetic core saturation",
    "chokeLabel": "HBM INTERCONNECT BANDWIDTH",
    "chokeMetric": "CHOKE POINT: 3.2 TB/S",
    "chokeDesc": "Off-chip pin density & memory bus limit",
    "restrictionPct": "-98.8%",
    "outputLabel": "EFFECTIVE OUTPUT",
    "outputMetric": "12 TFLOPS",
    "outputDesc": "Sustained throughput under starvation",
    "efficiency": "1.2% YIELD",
    "synthesis": "Amdahl's Law in practice: Scaling raw processing power yields zero benefit when the communication bus cannot feed the execution units.",
    "accentColor": "#00E5FF",
    "warningColor": "#F43F5E",
    "durationInFrames": 135
}

print("🎬 Rendering BottleneckConstriction MOV...")
res = render_motion_graphic(
    composition_id="bottleneck-constriction",
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
    "[1:a]volume=0.85,adelay=100|100[a1];"
    "[2:a]volume=0.80,adelay=550|550[a2];"
    "[3:a]volume=0.90,adelay=950|950[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WIND_SFX,
    "-i", ZAP_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "bottleneck_constriction_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "bottleneck_constriction_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "bottleneck_constriction_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
