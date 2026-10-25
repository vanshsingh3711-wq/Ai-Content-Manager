#!/usr/bin/env python3
"""
Renders a preview video for the Phase 9 ParetoPowerLaw motion graphic.
Includes multi-track sound effects (entrance wind whoosh, laser divider drop zap, and 80% value impact stamp).
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
LASER_SFX = os.path.join(SFX_DIR, "glitch-zap.mp3")
IMPACT_SFX = os.path.join(SFX_DIR, "impact-deep-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_pareto_power_law.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_pareto_power_law.mp4")

props = {
    "title": "THE PARETO PRINCIPLE",
    "subtitle": "80/20 POWER LAW DISTRIBUTION & ASYMMETRIC SYSTEMIC LEVERAGE",
    "badge": "POWER LAW DYNAMICS",
    "synthesis": "In nonlinear complex systems, 80% of systemic yield is driven by 20% of critical architectural primitives.",
    "vitalPct": "20%",
    "vitalLabel": "THE VITAL FEW",
    "vitalDesc": "Core architectural primitives, foundational models & automated CI/CD pipelines",
    "vitalReturn": "80% SYSTEM IMPACT",
    "vitalColor": "#00E5FF",
    "trivialPct": "80%",
    "trivialLabel": "THE TRIVIAL MANY (LONG TAIL)",
    "trivialDesc": "Marginal feature edge-cases, manual configuration toil & vanity optimizations",
    "trivialReturn": "20% RESIDUAL VALUE",
    "trivialColor": "#F59E0B",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering ParetoPowerLaw MOV...")
res = render_motion_graphic(
    composition_id="pareto-power-law",
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
    "[2:a]volume=0.75,adelay=700|700[a2];"
    "[3:a]volume=0.90,adelay=1250|1250[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WIND_SFX,
    "-i", LASER_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "pareto_power_law_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "pareto_power_law_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "pareto_power_law_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
