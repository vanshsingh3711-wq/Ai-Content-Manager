#!/usr/bin/env python3
"""
Renders a preview video for the Phase 7 DecisionTreeFork motion graphic.
Includes multi-track sound effects (root entrance whoosh, bifurcation fork zap, and outcome impact thud).
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
ZAP_SFX = os.path.join(SFX_DIR, "glitch-zap.mp3")
IMPACT_SFX = os.path.join(SFX_DIR, "impact-deep-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_decision_tree_fork.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_decision_tree_fork.mp4")

props = {
    "title": "THE ARCHITECTURAL BIFURCATION",
    "subtitle": "HOW EARLY TECHNICAL DECISIONS LOCK IN IRREVERSIBLE SYSTEMIC TRAJECTORIES",
    "badge": "BIFURCATION DECISION FORK",
    "synthesis": "Path dependency is the silent killer in technology: choices made at the root dictate limits at the leaves.",
    "rootTitle": "FOUNDATION MODEL ARCHITECTURE",
    "rootDesc": "Initial engineering fork between proprietary API lock-in vs open-weights autonomous infrastructure.",
    "rootBadge": "DECISION FORK // T=0",
    "branch1Title": "Path A: Proprietary Closed API",
    "branch1Desc": "Vendor lock-in, recurring token marginal costs, and strict upstream rate limit constraints.",
    "branch1Badge": "WALLED GARDEN",
    "branch1Metric": "HIGH INITIAL MARGIN // ZERO MIGRATION FLEXIBILITY",
    "branch1Color": "#F43F5E",
    "branch2Title": "Path B: Open-Weights Swarm",
    "branch2Desc": "Self-hosted distilled models, zero marginal API taxes, and deterministic horizontal scale.",
    "branch2Badge": "AUTONOMOUS SWARM",
    "branch2Metric": "INFINITE SCALING // 100% OWNED INFRASTRUCTURE",
    "branch2Color": "#10B981",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering DecisionTreeFork MOV...")
res = render_motion_graphic(
    composition_id="decision-tree-fork",
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
    "[2:a]volume=0.80,adelay=650|650[a2];"
    "[3:a]volume=0.90,adelay=1200|1200[a3];"
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
frame_jpg = os.path.join(MEDIA_DIR, "decision_tree_fork_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "decision_tree_fork_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "decision_tree_fork_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
