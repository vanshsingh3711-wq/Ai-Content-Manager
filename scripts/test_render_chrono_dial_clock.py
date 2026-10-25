#!/usr/bin/env python3
"""
Renders a preview video for the Phase 10 ChronoDialClock motion graphic.
Includes multi-track sound effects (entrance wind whoosh, precision mechanical chronometer ticks, and final epoch chime).
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
TICK_SFX = os.path.join(SFX_DIR, "clock-tick-soft.mp3")
CHIME_SFX = os.path.join(SFX_DIR, "chime-reward.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_chrono_dial_clock.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_chrono_dial_clock.mp4")

props = {
    "title": "AI HISTORY IN 24 HOURS",
    "subtitle": "1950 TO 2026 COMPRESSED INTO A SINGLE 24-HOUR CHRONOMETER",
    "badge": "24-HOUR CHRONOMETER",
    "synthesis": "If the entire history of modern AI were compressed into a 24-hour day, generative foundation models and autonomous swarms only emerged in the final 4 seconds.",
    "currentTime": "23:59:56",
    "timeframe": "1950 — 2026 (76 Years)",
    "epoch1Time": "00:00",
    "epoch1Title": "Turing Test & Perceptron",
    "epoch1Desc": "1950: Foundational symbolic AI logic, Turing computability thesis, and initial artificial neurons.",
    "epoch1Badge": "GENESIS // T=0h",
    "epoch2Time": "18:30",
    "epoch2Title": "Deep Learning Resurgence",
    "epoch2Desc": "2012: AlexNet & GPU-accelerated backpropagation prove deep convolutional nets crush legacy heuristics.",
    "epoch2Badge": "CONVOLUTION // T=18.5h",
    "epoch3Time": "22:45",
    "epoch3Title": "Attention & Transformer Core",
    "epoch3Desc": "2017: Attention Is All You Need shifts the computational paradigm to massively parallel matrix self-attention.",
    "epoch3Badge": "TRANSFORMER // T=22.7h",
    "epoch4Time": "23:59:56",
    "epoch4Title": "Autonomous Reasoning Swarms",
    "epoch4Desc": "2026: Multi-agent autonomous swarms, self-healing code loops, and stateful recursive inference.",
    "epoch4Badge": "EXPONENTIAL // T=23.99h",
    "accentColor": "#00E5FF",
    "activeColor": "#10B981",
    "durationInFrames": 135
}

print("🎬 Rendering ChronoDialClock MOV...")
res = render_motion_graphic(
    composition_id="chrono-dial-clock",
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
    "[2:a]volume=0.75,adelay=650|650[a2];"
    "[3:a]volume=0.80,adelay=1050|1050[a3];"
    "[4:a]volume=0.85,adelay=1400|1400[a4];"
    "[a1][a2][a3][a4]amix=inputs=4:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WIND_SFX,
    "-i", TICK_SFX,
    "-i", TICK_SFX,
    "-i", CHIME_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "chrono_dial_clock_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "chrono_dial_clock_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "chrono_dial_clock_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
