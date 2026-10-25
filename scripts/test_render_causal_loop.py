#!/usr/bin/env python3
"""
Renders a preview video for the Phase 2 CausalLoop motion graphic.
Includes multi-track sound effects (whoosh, cyclic riser, node impact hits).
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

WHOOSH_SFX = os.path.join(SFX_DIR, "whoosh-soft.mp3")
RISER_SFX = os.path.join(SFX_DIR, "riser-soft.mp3")
IMPACT_SFX = os.path.join(SFX_DIR, "impact-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_causal_loop.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_causal_loop.mp4")

props = {
    "title": "THE SYSTEMIC FEEDBACK LOOP",
    "subtitle": "HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES",
    "badge": "🔄 REINFORCING FLYWHEEL (+)",
    "loopType": "reinforcing",
    "centerLabel": "REINFORCING LOOP",
    "centerSub": "COMPOUNDING DRIFT",
    "synthesis": "Each phase intensifies the subsequent shock, locking the architecture into an accelerating trajectory.",
    "node1Title": "Aggressive Capital Injection",
    "node1Desc": "Unprecedented stimulus liquidity floods market sectors.",
    "node1Badge": "TRIGGER CAUSE",
    "node1Metric": "+$5.2T EXPANSION",
    "node2Title": "Asset Price Inflation",
    "node2Desc": "Equities and real estate valuations decouple from fundamentals.",
    "node2Badge": "AMPLIFICATION",
    "node2Metric": "+48% RUN-UP",
    "node3Title": "Aggressive Rate Hikes",
    "node3Desc": "Central banks overtighten into overleveraged balance sheets.",
    "node3Badge": "SECONDARY SHOCK",
    "node3Metric": "+525 BPS SURGE",
    "node4Title": "Cascading Liquidity Crunch",
    "node4Desc": "Forced deleveraging triggers emergency bailout demands.",
    "node4Badge": "FEEDBACK CLOSURE",
    "node4Metric": "CYCLE RE-IGNITED",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering CausalLoop MOV...")
res = render_motion_graphic(
    composition_id="causal-loop",
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
    "[1:a]volume=0.8,adelay=50|50[a1];"
    "[2:a]volume=0.8,adelay=150|150[a2];"
    "[3:a]volume=0.85,adelay=400|400[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WHOOSH_SFX,
    "-i", RISER_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "causal_loop_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "causal_loop_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "causal_loop_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
