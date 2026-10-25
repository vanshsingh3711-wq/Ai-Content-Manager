#!/usr/bin/env python3
"""
Renders a preview video for the Phase 3 ExplodedLayerStack motion graphic.
Includes multi-track sound effects (reverse whoosh, solid knock latch, and metric pop chime).
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

WHOOSH_SFX = os.path.join(SFX_DIR, "whoosh-reverse.mp3")
KNOCK_SFX = os.path.join(SFX_DIR, "knock-solid.mp3")
POP_SFX = os.path.join(SFX_DIR, "pop-reveal.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)

raw_mov = os.path.join(MEDIA_DIR, "raw_exploded_layer_stack.mov")
final_mp4 = os.path.join(MEDIA_DIR, "preview_exploded_layer_stack.mp4")

props = {
    "title": "THE AUTONOMOUS AGENT STACK",
    "subtitle": "DECONSTRUCTED COMPUTE ANATOMY & MULTI-TIER EXECUTION PIPELINE",
    "badge": "ISOMETRIC SYSTEM ARCHITECTURE",
    "synthesis": "Upper tiers inherit latency constraints and epistemic coherence directly from the foundational substrate below.",
    "layer1Title": "Foundational Neural Weights",
    "layer1Desc": "Quantized FP8 parameter clusters bound to ultra-dense HBM memory bandwidth.",
    "layer1Badge": "HARDWARE SUBSTRATE",
    "layer1Metric": "4.8 TB/S BANDWIDTH",
    "layer2Title": "Context Window Orchestration",
    "layer2Desc": "Attention routing, KV-cache compression, and speculative token draft verification.",
    "layer2Badge": "NEURAL LATENT CORE",
    "layer2Metric": "128K TOKENS / SEC",
    "layer3Title": "Long-Term Memory & Graph RAG",
    "layer3Desc": "Hierarchical vector indexing and real-time knowledge graph traversal.",
    "layer3Badge": "EPISTEMIC STATE",
    "layer3Metric": "1.2M EMBEDDINGS",
    "layer4Title": "Autonomous Tool Execution",
    "layer4Desc": "Sandboxed agent synthesis, deterministic code interpreter, and external API invocation.",
    "layer4Badge": "COGNITIVE RUNTIME",
    "layer4Metric": "< 150ms LATENCY",
    "accentColor": "#00E5FF",
    "durationInFrames": 135
}

print("🎬 Rendering ExplodedLayerStack MOV...")
res = render_motion_graphic(
    composition_id="exploded-layer-stack",
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
    "[2:a]volume=0.90,adelay=650|650[a2];"
    "[3:a]volume=0.80,adelay=1100|1100[a3];"
    "[a1][a2][a3]amix=inputs=3:duration=first:dropout_transition=2[aout]"
)

cmd = [
    "nice", "-n", "15", "ionice", "-c", "3",
    "ffmpeg", "-y",
    "-i", raw_mov,
    "-i", WHOOSH_SFX,
    "-i", KNOCK_SFX,
    "-i", POP_SFX,
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
frame_jpg = os.path.join(MEDIA_DIR, "exploded_layer_stack_frame_25s.jpg")
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
    shutil.copy2(final_mp4, os.path.join(ARTIFACT_DIR, "exploded_layer_stack_preview.mp4"))
    shutil.copy2(frame_jpg, os.path.join(ARTIFACT_DIR, "exploded_layer_stack_render.jpg"))

print(f"🎉 Complete! MP4: {final_mp4}, Frame: {frame_jpg}")
