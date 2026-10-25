#!/usr/bin/env python3
"""
Renders a preview video for the Phase 1 ArchitecturePipeline motion graphic.
Includes multi-track sound effects (whoosh, electronic scan hum, circuit packet ticks).
"""

import os
import sys
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "apps", "worker"))

from services.remotion_renderer import render_motion_graphic

MEDIA_DIR = os.path.join(PROJECT_ROOT, "media_temp", "previews")
ARTIFACT_DIR = "/home/vansh/.gemini/antigravity-ide/brain/cb81d15f-5ba3-429a-ae18-c6b1399bf82f"
SFX_DIR = os.path.join(PROJECT_ROOT, "apps", "worker", "data", "sfx", "clips")

WHOOSH_SFX = os.path.join(SFX_DIR, "whoosh-soft.mp3")
SCAN_SFX = os.path.join(SFX_DIR, "scan-hum.mp3")
TICK_SFX = os.path.join(SFX_DIR, "clock-tick-soft.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_architecture_pipeline.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_architecture_pipeline.mp4")

props = {
    "title": "AUTONOMOUS REASONING ARCHITECTURE",
    "subtitle": "END-TO-END DATA FLOW & VERIFICATION ENGINE",
    "badge": "⚡ SYSTEM ARCHITECTURE",
    "stage1Title": "Multimodal Ingestion",
    "stage1Desc": "Streaming sensor & API telemetry parsing",
    "stage1Badge": "INGEST",
    "stage1Metric": "100K EVT/S",
    "stage2Title": "Vector Knowledge Core",
    "stage2Desc": "Dense semantic hybrid retrieval",
    "stage2Badge": "EMBED & RAG",
    "stage2Metric": "4.2ms LATENCY",
    "stage3Title": "Recursive Agent Loop",
    "stage3Desc": "Autonomous multi-hop reasoning",
    "stage3Badge": "REASON",
    "stage3Metric": "99.4% RELIABILITY",
    "stage4Title": "Deterministic Gate",
    "stage4Desc": "Zero-regression compliance validation",
    "stage4Badge": "VERIFY",
    "stage4Metric": "100% AUDIT PASS",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering ArchitecturePipeline MOV...")
res = render_motion_graphic(
    composition_id="architecture-pipeline",
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
    "[2:a]volume=0.85,adelay=200|200[a2];"
    "[3:a]volume=0.9,adelay=650|650[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WHOOSH_SFX,
    "-i", SCAN_SFX,
    "-i", TICK_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "architecture_pipeline_frame_25s.jpg")
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
    import shutil
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "architecture_pipeline_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "architecture_pipeline_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
