#!/usr/bin/env python3
"""
Generates high-fidelity preview videos for the TodoList motion graphic.
Renders:
  1. Interactive Todo Checklist (format: 'todo') with checkmarks and sequential typing
  2. Sequential Steps (format: 'sequence') with numbered badges (01, 02, 03) and sequential typing
  3. Combined Showcase Video with synchronized multi-track sound effects (whoosh, keys typing, checkmark chimes)
"""

import os
import sys
import json
import shutil
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "apps", "worker"))

from services.remotion_renderer import render_motion_graphic

MEDIA_DIR = os.path.join(PROJECT_ROOT, "media_temp", "previews")
ARTIFACT_DIR = "/home/vansh/.gemini/antigravity-ide/brain/cb81d15f-5ba3-429a-ae18-c6b1399bf82f"
SFX_DIR = os.path.join(PROJECT_ROOT, "apps", "worker", "data", "sfx", "clips")

WHOOSH_SFX = os.path.join(SFX_DIR, "whoosh-soft.mp3")
TYPING_SFX = os.path.join(SFX_DIR, "keys-typing-soft.mp3")
TOGGLE_SFX = os.path.join(SFX_DIR, "ui-toggle-on.mp3")
CHIME_SFX = os.path.join(SFX_DIR, "chime-reward.mp3")

os.makedirs(MEDIA_DIR, exist_ok=True)


def mix_audio_and_encode(mov_path: str, mp4_out: str, duration_sec: float = 4.5):
    """
    Overlays transparent ProRes .mov onto solid black canvas (#050505)
    and mixes synchronized sound effects (whoosh, typing, completion toggles).
    """
    print(f"[Preview] 🎵 Mixing sound effects and encoding {mp4_out}...")

    # Filter graph for audio:
    # 1: whoosh-soft at 0.0s (volume 0.8)
    # 2: keys-typing at 0.25s (volume 1.0)
    # 3: keys-typing at 1.40s (volume 1.0)
    # 4: ui-toggle at 1.05s (volume 0.7) - item 1 checkmark
    # 5: ui-toggle at 1.95s (volume 0.7) - item 2 checkmark
    # 6: chime-reward at 2.95s (volume 0.8) - item 3 complete
    filter_complex = (
        "[0:v]format=yuva420p[fg];"
        "color=c=#050505:s=1920x1080:d=4.5[bg];"
        "[bg][fg]overlay=0:0:shortest=1[vout];"
        "[1:a]volume=0.8,adelay=50|50[a1];"
        "[2:a]volume=1.0,adelay=250|250[a2];"
        "[3:a]volume=0.9,adelay=1400|1400[a3];"
        "[4:a]volume=0.7,adelay=1050|1050[a4];"
        "[5:a]volume=0.7,adelay=1950|1950[a5];"
        "[6:a]volume=0.8,adelay=2950|2950[a6];"
        "[a1][a2][a3][a4][a5][a6]amix=inputs=6:duration=first:dropout_transition=2[aout]"
    )

    cmd = [
        "nice", "-n", "15", "ionice", "-c", "3",
        "ffmpeg", "-y",
        "-i", mov_path,
        "-i", WHOOSH_SFX,
        "-i", TYPING_SFX,
        "-i", TYPING_SFX,
        "-i", TOGGLE_SFX,
        "-i", TOGGLE_SFX,
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
        "-t", str(duration_sec),
        "-threads", "2",
        mp4_out
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"[Preview] ❌ FFmpeg error:\n{res.stderr[-500:]}")
        return False

    print(f"[Preview] ✅ Encoded: {mp4_out} ({os.path.getsize(mp4_out) / 1024:.1f} KB)")
    return True


def render_previews():
    # 1. Format A: Todo Checklist
    todo_mov = os.path.join(MEDIA_DIR, "raw_todo_checklist.mov")
    todo_mp4 = os.path.join(MEDIA_DIR, "preview_todo_checklist.mp4")
    todo_props = {
        "title": "SYSTEMS ARCHITECT PLAYBOOK",
        "badge": "📋 ACTION PROTOCOL",
        "format": "todo",
        "point1": "Automate Diagnostic Friction Audits",
        "point2": "Deploy Scoped Autonomous Agents",
        "point3": "Anchor to Deterministic Verification Gates",
        "personality": "technical",
        "colorTheme": "cyan",
        "accentColor": "#00E5FF",
        "durationInFrames": 135
    }

    print("\n--- [1/3] Rendering Todo Checklist (Format A) ---")
    res1 = render_motion_graphic(
        composition_id="todo-list",
        props=todo_props,
        duration_frames=135,
        fps=30,
        width=1920,
        height=1080,
        output_path=todo_mov,
        concurrency=1
    )
    if not res1 or not os.path.exists(todo_mov):
        print("❌ Failed to render Todo Checklist MOV")
        return

    mix_audio_and_encode(todo_mov, todo_mp4, duration_sec=4.5)

    # 2. Format B: Sequence Steps
    seq_mov = os.path.join(MEDIA_DIR, "raw_todo_sequence.mov")
    seq_mp4 = os.path.join(MEDIA_DIR, "preview_todo_sequence.mp4")
    seq_props = {
        "title": "AUTONOMOUS REASONING LOOP",
        "badge": "⚡ SEQUENCE",
        "format": "sequence",
        "point1": "Perception & System State Ingestion",
        "point2": "Recursive Hypothesis Formulation",
        "point3": "Deterministic Verification Loop",
        "personality": "technical",
        "colorTheme": "emerald",
        "accentColor": "#10B981",
        "durationInFrames": 135
    }

    print("\n--- [2/3] Rendering Sequence Steps (Format B) ---")
    res2 = render_motion_graphic(
        composition_id="todo-list",
        props=seq_props,
        duration_frames=135,
        fps=30,
        width=1920,
        height=1080,
        output_path=seq_mov,
        concurrency=1
    )
    if not res2 or not os.path.exists(seq_mov):
        print("❌ Failed to render Sequence Steps MOV")
        return

    mix_audio_and_encode(seq_mov, seq_mp4, duration_sec=4.5)

    # 3. Concatenate both into unified showcase video
    print("\n--- [3/3] Assembling Unified Showcase Video ---")
    concat_list = os.path.join(MEDIA_DIR, "concat.txt")
    with open(concat_list, "w") as f:
        f.write(f"file '{todo_mp4}'\n")
        f.write(f"file '{seq_mp4}'\n")

    showcase_mp4 = os.path.join(MEDIA_DIR, "todo_list_motion_graphic_showcase.mp4")
    cmd_concat = [
        "nice", "-n", "15", "ionice", "-c", "3",
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        showcase_mp4
    ]
    subprocess.run(cmd_concat, check=True)

    # Copy showcase and individual previews to artifact directory
    if os.path.exists(ARTIFACT_DIR):
        dest_showcase = os.path.join(ARTIFACT_DIR, "todo_list_showcase.mp4")
        shutil.copy2(showcase_mp4, dest_showcase)
        shutil.copy2(todo_mp4, os.path.join(ARTIFACT_DIR, "todo_list_checklist_preview.mp4"))
        shutil.copy2(seq_mp4, os.path.join(ARTIFACT_DIR, "todo_list_sequence_preview.mp4"))
        print(f"[Preview] 🌟 Copied showcase to artifact: {dest_showcase}")

    print(f"\n=======================================================")
    print(f"🎉 ALL PREVIEWS GENERATED SUCCESSFULLY!")
    print(f"1. Checklist MP4: {todo_mp4}")
    print(f"2. Sequence MP4:  {seq_mp4}")
    print(f"3. Showcase MP4:  {showcase_mp4}")
    print(f"=======================================================\n")


if __name__ == "__main__":
    render_previews()
