#!/usr/bin/env python3
"""
Renders a preview video for the Phase 5 TrilemmaTradeoff motion graphic.
Includes multi-track sound effects (vertex lock click, laser edge energize zap, and sacrificed vertex stamp strike).
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

CLICK_SFX = os.path.join(SFX_DIR, "ui-click-soft.mp3")
ZAP_SFX = os.path.join(SFX_DIR, "glitch-zap.mp3")
STAMP_SFX = os.path.join(SFX_DIR, "stamp-hit.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_trilemma_tradeoff.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_trilemma_tradeoff.mp4")

props = {
    "title": "THE BLOCKCHAIN TRILEMMA",
    "subtitle": "YOU CAN ONLY OPTIMIZE TWO VERTICES. THE THIRD IS INEVITABLY SACRIFICED.",
    "badge": "ARCHITECTURAL TRADE-OFF THEOREM",
    "axiom": "Any attempt to forcefully scale throughput degrades either decentralized trust or consensus integrity.",
    "vertex1Title": "Decentralization",
    "vertex1Desc": "Distributed nodes worldwide with zero central point of failure",
    "vertex1Metric": "100% PRESERVED",
    "vertex2Title": "Security",
    "vertex2Desc": "Cryptographic proof-of-work consensus protecting state history",
    "vertex2Metric": "100% PRESERVED",
    "vertex3Title": "Scalability",
    "vertex3Desc": "High transaction throughput and low latency confirmation",
    "vertex3Metric": "15 TPS (SACRIFICED)",
    "sacrificedVertex": 3,
    "accentColor": "#00E5FF",
    "activeColor": "#10B981",
    "sacrificedColor": "#F43F5E",
    "durationInFrames": 135
}

print("🎬 Rendering TrilemmaTradeoff MOV...")
res = render_motion_graphic(
    composition_id="trilemma-tradeoff",
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
    "[1:a]volume=0.85,adelay=200|200[a1];"
    "[2:a]volume=0.80,adelay=700|700[a2];"
    "[3:a]volume=0.95,adelay=1400|1400[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", CLICK_SFX,
    "-i", ZAP_SFX,
    "-i", STAMP_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "trilemma_tradeoff_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "trilemma_tradeoff_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "trilemma_tradeoff_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
