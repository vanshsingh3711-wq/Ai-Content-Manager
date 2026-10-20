"""
remotion_renderer.py — Replaces render_html_motion.py

Renders a motion graphic composition using Remotion CLI and returns
a transparent ProRes MOV file (alpha channel preserved for FFmpeg overlay).

Usage from compositor.py:
    from services.remotion_renderer import render_motion_graphic
    mov_path = render_motion_graphic(
        composition_id="hero_reveal",
        props={"label": "INSIGHT", "headline": "You Are Wrong", "supporting": "Here's why"},
        duration_frames=90,
        fps=30,
        width=1080,
        height=1920,
        output_path="/tmp/mg_001.mov"
    )
"""

import os
import json
import subprocess
import tempfile
import shutil
from typing import Dict, Any, Optional

# Path to the motion-components package (where remotion lives)
_WORKER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_WORKER_DIR))
MOTION_PKG_DIR = os.path.join(_PROJECT_ROOT, "packages", "motion-components")
REMOTION_ROOT = os.path.join(MOTION_PKG_DIR, "src", "remotion", "index.ts")

# Codec map: transparent ProRes for compositing
_CODEC = "prores-4444"  # supports alpha channel

# Allowed composition IDs — must match Root.tsx registrations
ALLOWED_COMPOSITIONS = {
    "hero_reveal",
    "metric_reveal",
    "quote_reveal",
    "step_sequence",
    "before_after",
    "chart_reveal",
    "icon_reveal",
    "code_reveal",
    "stat_card_highlight",
    "browser_walkthrough",
    "vscode_code_typing",
    "kinetic_text",
    "app_screen_upload",
    "app-screen-upload",
    # Cooked Motion Templates
    "cooked_card",
    "cooked_likes",
    "cooked_terminal",
    "cooked_social_post",
    "cooked_chat",
    "cooked_notes",
    "cooked_progress",
    "cooked_toasts",
    "cooked_flow",
}


def render_motion_graphic(
    composition_id: str,
    props: Dict[str, Any],
    duration_frames: int,
    fps: int,
    width: int,
    height: int,
    output_path: str,
    timeout_sec: int = 300,
) -> Optional[str]:
    """
    Renders a Remotion composition to a transparent ProRes MOV.

    Returns the output_path on success, or None on failure.
    """
    comp_kebab = composition_id.replace("_", "-")
    comp_snake = composition_id.replace("-", "_")

    if comp_snake not in ALLOWED_COMPOSITIONS and comp_kebab not in ALLOWED_COMPOSITIONS:
        print(f"[RemotionRenderer] ❌ Unknown composition: '{composition_id}'. Allowed: {ALLOWED_COMPOSITIONS}")
        return None

    if not os.path.isdir(MOTION_PKG_DIR):
        print(f"[RemotionRenderer] ❌ motion-components package not found at: {MOTION_PKG_DIR}")
        return None

    # Write props to a temp JSON file (avoids shell escaping issues)
    render_props = dict(props)
    render_props["durationInFrames"] = int(duration_frames)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(render_props, f)
        props_file = f.name

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    try:
        cmd = [
            "npx", "remotion", "render",
            REMOTION_ROOT,                   # Entry point
            comp_kebab,                      # Which composition (must be hyphenated for Remotion)
            output_path,                     # Output file
            f"--props={props_file}",          # Props as JSON file
            f"--frames=0-{max(1, duration_frames-1)}",
            f"--fps={fps}",
            f"--width={width}",
            f"--height={height}",
            "--codec=prores",
            "--prores-profile=4444",
            "--pixel-format=yuva444p10le",
            "--log=verbose",
            "--overwrite",
            "--concurrency=2",               # Limit CPU usage
            f"--timeout={timeout_sec * 1000}", # Prevent 30s puppeteer seek timeout
        ]

        print(f"[RemotionRenderer] 🎬 Rendering '{comp_kebab}' ({duration_frames}f @ {fps}fps, {width}x{height})")
        print(f"[RemotionRenderer] Props: {json.dumps(props, indent=2)}")

        result = subprocess.run(
            cmd,
            cwd=MOTION_PKG_DIR,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )

        if result.returncode != 0:
            print(f"[RemotionRenderer] ❌ Render failed (exit {result.returncode})")
            print(f"STDERR:\n{result.stderr[-3000:]}")
            print(f"STDOUT:\n{result.stdout[-1000:]}")
            return None

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            print(f"[RemotionRenderer] ❌ Output file missing or empty: {output_path}")
            return None

        size_mb = os.path.getsize(output_path) / 1024 / 1024
        print(f"[RemotionRenderer] ✅ Rendered → {output_path} ({size_mb:.1f} MB)")
        return output_path

    except subprocess.TimeoutExpired:
        print(f"[RemotionRenderer] ❌ Render timed out after {timeout_sec}s")
        return None
    except Exception as e:
        print(f"[RemotionRenderer] ❌ Unexpected error: {e}")
        return None
    finally:
        os.unlink(props_file)


def build_props_from_edit(edit: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts a motion_graphic edit decision dict into Remotion props.
    Maps the motion_graphics_targets keys to the composition's expected props.
    """
    comp_id = edit.get("motion_graphics_type", "hero_reveal")
    targets = edit.get("motion_graphics_targets", {})
    personality = edit.get("personality", "premium")

    if comp_id.startswith("cooked_") or comp_id.startswith("cooked-"):
        props = dict(targets) if isinstance(targets, dict) else {}
        props["personality"] = personality
        return props

    # Template-specific prop mapping
    PROP_MAPS = {
        "hero_reveal":        {"label": "label", "headline": "headline", "supporting": "supporting"},
        "metric_reveal":      {"label": "label", "metric": "metric", "delta": "delta"},
        "quote_reveal":       {"quote": "quote", "author": "author"},
        "step_sequence":      {"title": "title", "step1": "step1", "step2": "step2", "step3": "step3", "step4": "step4"},
        "before_after":       {"beforeLabel": "beforeLabel", "before": "before", "afterLabel": "afterLabel", "after": "after"},
        "chart_reveal":       {"title": "title", "dataPoint1": "dataPoint1", "dataPoint2": "dataPoint2", "dataPoint3": "dataPoint3"},
        "icon_reveal":        {"concept": "concept", "label": "label", "sublabel": "sublabel"},
        "code_reveal":        {"code": "code", "language": "language"},
        "stat_card_highlight":{"label": "label", "stat": "stat", "delta": "delta", "context": "context"},
        "browser_walkthrough":{"url": "url", "tabTitle": "tabTitle", "highlightText": "highlightText"},
        "vscode_code_typing": {"title": "title", "activeFile": "activeFile", "code": "code", "language": "language"},
        "kinetic_text":       {"text": "text"},
    }

    prop_map = PROP_MAPS.get(comp_id, {})
    props: Dict[str, Any] = {"personality": personality}

    for remotion_key, target_key in prop_map.items():
        value = targets.get(target_key) or targets.get(remotion_key)
        if value is not None:
            props[remotion_key] = str(value)

    return props


def render_remotion_canvas(
    comp_id: str,
    props: Dict[str, Any],
    duration_sec: float,
    fps: float,
    width: int,
    height: int,
    out_path: str,
) -> Optional[str]:
    """
    Direct drop-in for compositor.py's _render_canvas_composition.
    """
    clean_id = (comp_id or "hero_reveal").lower().replace("-", "_")
    if clean_id in ("motiongraphicspreview", "preview", "kinetictext"):
        clean_id = "kinetic_text"
    elif clean_id == "media_reveal":
        clean_id = "hero_reveal"

    targets = props.get("targets", props)
    personality = props.get("personality") or props.get("motion_graphics_personality") or "premium"

    final_props = build_props_from_edit({
        "motion_graphics_type": clean_id,
        "motion_graphics_targets": targets,
        "personality": personality,
    })

    # If targets had raw text and no headline/quote was resolved, provide it as fallback
    if "text" in targets and not any(k in final_props for k in ("headline", "quote", "text")):
        if clean_id in ("hero_reveal", "browser_walkthrough"):
            final_props["headline"] = str(targets["text"])
        elif clean_id == "quote_reveal":
            final_props["quote"] = str(targets["text"])
        else:
            final_props["text"] = str(targets["text"])

    frames = max(1, int(duration_sec * fps))
    return render_motion_graphic(
        composition_id=clean_id,
        props=final_props,
        duration_frames=frames,
        fps=int(fps),
        width=width,
        height=height,
        output_path=out_path,
    )

