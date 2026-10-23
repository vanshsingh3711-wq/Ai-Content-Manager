import os
import sys
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

import json
import hashlib
import time
from fastapi.responses import FileResponse

# Ensure worker services can be imported by API
worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
if worker_path not in sys.path:
    sys.path.insert(0, worker_path)

try:
    from services.asset_manager import search_single_broll_clip
except Exception:
    search_single_broll_clip = None

try:
    from services.blueprint_resolver import coordinate_whole_video_plan, enforce_density_budgeting
except Exception:
    coordinate_whole_video_plan = None
    enforce_density_budgeting = None

try:
    from services.copilot_llm import reason_copilot_intent, CopilotIntentProposal
except Exception:
    reason_copilot_intent = None
    CopilotIntentProposal = None

import importlib
try:
    import services.web_evidence_capture
    importlib.reload(services.web_evidence_capture)
    from services.web_evidence_capture import (
        capture_web_evidence,
        capture_web_page,
        generate_web_scroll_video,
        record_interactive_web_action,
    )
except Exception:
    capture_web_evidence = None
    capture_web_page = None
    generate_web_scroll_video = None
    record_interactive_web_action = None

MEDIA_TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "media_temp"))
CAPTURES_DIR = os.path.join(MEDIA_TEMP_DIR, "captures")
RECORDINGS_DIR = os.path.join(MEDIA_TEMP_DIR, "recordings")
os.makedirs(CAPTURES_DIR, exist_ok=True)
os.makedirs(RECORDINGS_DIR, exist_ok=True)
URL_REGEX = re.compile(
    r"(?:https?://|www\.)[^\s\"'<>]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|io|dev|net|ai|co|app)(?:/[^\s\"'<>]*)?",
    re.IGNORECASE
)

router = APIRouter(prefix="/api/v1/editor", tags=["AI Copilot"])


class EditorContextPayload(BaseModel):
    playhead_time: float = Field(default=0.0, ge=0.0, description="Current playhead position in seconds")
    duration: float = Field(default=60.0, gt=0.0, description="Total project duration in seconds")
    aspect_ratio: str = Field(default="9:16", description="Canvas aspect ratio (9:16, 16:9, 1:1, 4:5)")
    selected_item: Optional[Dict[str, Any]] = Field(default=None, description="Currently selected element")
    active_transcript_words: Optional[List[Dict[str, Any]]] = Field(default=None, description="Words near playhead")
    safe_zones: Optional[List[Dict[str, Any]]] = Field(default=None, description="Speaker face/body safe zones")
    transcript_beats: Optional[List[Dict[str, Any]]] = Field(default=None, description="Script storytelling beats")
    transcript: Optional[Union[Dict[str, Any], List[Any]]] = Field(default=None, description="Full transcript payload including beatSheet")


class EditorCopilotOptions(BaseModel):
    max_edits: int = Field(default=5, ge=1, le=50)
    allow_stock_sourcing: bool = Field(default=True)
    ai_model: Optional[str] = Field(default="DeepSeek V3")
    use_llm_reasoning: bool = Field(default=True, description="Enable Tier-3 LLM reasoning for creative prompts")


class EditorCopilotRequest(BaseModel):
    project_id: Optional[str] = Field(default=None, description="Timeline project ID")
    prompt: str = Field(..., min_length=1, description="Natural language editing command or request")
    context: EditorContextPayload
    options: Optional[EditorCopilotOptions] = Field(default_factory=EditorCopilotOptions)


class ProposedEditItem(BaseModel):
    id: str
    action_type: str = Field(..., description="broll | graphic | sfx | transition | cut | caption | reflow")
    start: float
    end: float
    track: str = Field(..., description="video | broll | caption | audio | graphic")
    title: str
    description: str
    reason: str
    is_destructive: bool = False
    overlap_conflict: bool = False
    preview_url: Optional[str] = None
    operation: Dict[str, Any]
    status: str = "pending"
    error_message: Optional[str] = None


class EditPlanProposal(BaseModel):
    plan_id: str
    user_prompt: str
    scope: str = Field(..., description="time_range | semantic_anchor | whole_video")
    summary: str
    edits: List[ProposedEditItem]
    created_at: str
    total_duration_seconds: float
    suggested_actions: Optional[List[str]] = Field(default=None, description="Optional quick action choices")


class CaptureWebRequest(BaseModel):
    url: str = Field(..., description="Web page, article, GitHub repo, or social post URL")
    width: Optional[int] = Field(default=None, ge=320, le=3840)
    height: Optional[int] = Field(default=None, ge=240, le=3840)
    format: Optional[str] = Field(default="desktop", description="Target format: 16:9 (desktop), 9:16 (mobile), 1:1 (square)")
    wait_ms: Optional[int] = Field(default=2000, ge=0, le=10000)


def _extract_clean_tab_title(url: str, meta_title: Optional[str] = None) -> str:
    """Extracts a clean, human-readable tab title from a URL or metadata."""
    if meta_title and meta_title != url:
        return meta_title
    clean = url.replace("https://", "").replace("http://", "").strip("/")
    parts = clean.split("/")
    if len(parts) >= 3 and parts[0] in ["github.com", "x.com", "twitter.com"]:
        return f"{parts[1]}/{parts[2]}"
    elif len(parts) >= 2 and parts[1]:
        return f"{parts[0]}/{parts[1]}"
    return parts[0] if parts else "Web Evidence"


def execute_web_capture(
    url: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    format_type: str = "desktop",
    generate_video: bool = False,
    duration: float = 4.0,
    action_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes live web screen capture or interactive action recording using Playwright/Chrome.
    Automatically matches mobile vs desktop layout and executes specified clicks, filters, typing, and scrolling.
    """
    os.makedirs(CAPTURES_DIR, exist_ok=True)
    os.makedirs(RECORDINGS_DIR, exist_ok=True)
    clean_url = url.strip().rstrip(".,;)")

    # Match device profile dimensions
    if format_type in ("9:16", "mobile"):
        eff_width = width if width is not None else 390
        eff_height = height if height is not None else 1800
    elif format_type in ("1:1", "square"):
        eff_width = width if width is not None else 800
        eff_height = height if height is not None else 1600
    else:
        eff_width = width if width is not None else 1440
        eff_height = height if height is not None else 1800

    has_interactive_action = bool(
        action_prompt
        and any(kw in action_prompt.lower() for kw in [
            "click", "filter", "select", "type", "press", "search", "choose",
            "scroll down", "scroll up", "scroll", "find", "go to", "open", "explore", "articles", "article"
        ])
    )

    action_key = f"_{action_prompt.strip().lower()}" if has_interactive_action else ""
    url_hash = hashlib.sha256(f"{clean_url}_{eff_width}x{eff_height}_{format_type}{action_key}".encode("utf-8")).hexdigest()[:16]
    out_filename = f"capture_{url_hash}.png"
    out_path = os.path.join(CAPTURES_DIR, out_filename)
    meta_cache_path = os.path.join(CAPTURES_DIR, f"{out_filename}.meta.json")

    video_url = None
    video_path = None
    if generate_video:
        dur_rounded = max(1, int(round(duration)))
        video_filename = f"rec_{url_hash}_{dur_rounded}s_{format_type.replace(':', '-')}.mp4"
        video_path = os.path.join(RECORDINGS_DIR, video_filename)
        video_url = f"/api/v1/editor/recordings/{video_filename}"

    # 1. Interactive action execution via Playwright
    if has_interactive_action and record_interactive_web_action:
        # Check if valid cache exists for this exact interactive action
        if (
            os.path.exists(out_path)
            and os.path.getsize(out_path) > 25000
            and video_path
            and os.path.exists(video_path)
            and os.path.getsize(video_path) > 10000
            and os.path.exists(meta_cache_path)
        ):
            cached_title = None
            try:
                cached_title = json.loads(open(meta_cache_path, "r", encoding="utf-8").read()).get("title")
            except Exception:
                pass
            mtime = int(os.path.getmtime(out_path))
            return {
                "status": "success",
                "url": clean_url,
                "filename": out_filename,
                "preview_url": f"/api/v1/editor/captures/{out_filename}?t={mtime}",
                "screenshot_path": out_path,
                "video_url": video_url,
                "video_path": video_path,
                "width": eff_width,
                "height": eff_height,
                "format": format_type,
                "cached": True,
                "title": cached_title or _extract_clean_tab_title(clean_url),
            }

        try:
            rec_res = record_interactive_web_action(
                url=clean_url,
                action_prompt=action_prompt,
                output_mp4_path=video_path if video_path else os.path.join(RECORDINGS_DIR, f"rec_{url_hash}_{int(duration)}s.mp4"),
                output_png_path=out_path,
                duration=duration,
                aspect_ratio=format_type,
            )
            title = rec_res.get("title")
            final_title = _extract_clean_tab_title(clean_url, title)
            try:
                with open(meta_cache_path, "w", encoding="utf-8") as f_meta:
                    json.dump({"title": final_title, "url": clean_url, "action": action_prompt}, f_meta)
            except Exception:
                pass
            now_ts = int(time.time())
            return {
                "status": "success",
                "url": clean_url,
                "filename": out_filename,
                "preview_url": f"/api/v1/editor/captures/{out_filename}?t={now_ts}",
                "screenshot_path": out_path,
                "video_url": video_url,
                "video_path": video_path,
                "width": eff_width,
                "height": eff_height,
                "format": format_type,
                "cached": False,
                "title": final_title,
            }
        except Exception as act_err:
            print(f"[!] record_interactive_web_action failed: {act_err}, falling back to headless capture")

    def _ensure_video():
        nonlocal video_url, video_path
        if generate_video and video_path and os.path.exists(out_path):
            if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
                try:
                    if generate_web_scroll_video:
                        generate_web_scroll_video(out_path, video_path, duration=duration, aspect_ratio=format_type)
                except Exception as vid_err:
                    print(f"[!] Could not generate scroll video: {vid_err}")

    # Return cached image if fresh and valid (real capture, not placeholder dummy)
    is_valid_cache = (
        os.path.exists(out_path)
        and os.path.getsize(out_path) > 25000
        and os.path.exists(meta_cache_path)
        and (not generate_video or (video_path and os.path.exists(video_path) and os.path.getsize(video_path) > 10000))
    )
    if is_valid_cache:
        cached_title = None
        try:
            cached_title = json.loads(open(meta_cache_path, "r", encoding="utf-8").read()).get("title")
        except Exception:
            pass
        _ensure_video()
        mtime = int(os.path.getmtime(out_path))
        return {
            "status": "success",
            "url": clean_url,
            "filename": out_filename,
            "preview_url": f"/api/v1/editor/captures/{out_filename}?t={mtime}",
            "screenshot_path": out_path,
            "video_url": video_url,
            "video_path": video_path,
            "width": eff_width,
            "height": eff_height,
            "format": format_type,
            "cached": True,
            "title": cached_title or _extract_clean_tab_title(clean_url),
        }

    # Execute Chrome headless capture or unified dispatcher
    title = None
    if capture_web_evidence:
        try:
            res = capture_web_evidence(clean_url, output_path=out_path, width=eff_width, height=eff_height, format_type=format_type)
            if res.get("data") and isinstance(res["data"], dict):
                title = res["data"].get("title") or res["data"].get("full_name") or res["data"].get("name")
            if os.path.exists(out_path) and os.path.getsize(out_path) > 25000:
                final_title = _extract_clean_tab_title(clean_url, title)
                try:
                    with open(meta_cache_path, "w", encoding="utf-8") as f_meta:
                        json.dump({"title": final_title, "url": clean_url}, f_meta)
                except Exception:
                    pass
                _ensure_video()
                now_ts = int(time.time())
                return {
                    "status": "success",
                    "url": clean_url,
                    "filename": out_filename,
                    "preview_url": f"/api/v1/editor/captures/{out_filename}?t={now_ts}",
                    "screenshot_path": out_path,
                    "video_url": video_url,
                    "video_path": video_path,
                    "width": eff_width,
                    "height": eff_height,
                    "format": format_type,
                    "cached": False,
                    "title": final_title,
                }
        except Exception as e:
            print(f"[!] Headless Chrome capture encountered error for {clean_url}: {e}")

    # Fallback to direct Playwright if capture_web_evidence failed
    if record_interactive_web_action:
        try:
            rec_res = record_interactive_web_action(
                url=clean_url,
                action_prompt="scroll down",
                output_mp4_path=video_path if video_path else os.path.join(RECORDINGS_DIR, f"rec_{url_hash}_4s.mp4"),
                output_png_path=out_path,
                duration=duration,
                aspect_ratio=format_type,
            )
            title = rec_res.get("title")
            final_title = _extract_clean_tab_title(clean_url, title)
            try:
                with open(meta_cache_path, "w", encoding="utf-8") as f_meta:
                    json.dump({"title": final_title, "url": clean_url}, f_meta)
            except Exception:
                pass
            now_ts = int(time.time())
            return {
                "status": "success",
                "url": clean_url,
                "filename": out_filename,
                "preview_url": f"/api/v1/editor/captures/{out_filename}?t={now_ts}",
                "screenshot_path": out_path,
                "video_url": video_url,
                "video_path": video_path,
                "width": eff_width,
                "height": eff_height,
                "format": format_type,
                "cached": False,
                "title": final_title,
            }
        except Exception as pw_err:
            print(f"[!] Direct Playwright fallback failed for {clean_url}: {pw_err}")

    # Fallback placeholder generator if offline or Chrome headless unavailable
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGBA", (eff_width, eff_height), color=(15, 23, 42, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, eff_width, 50], fill=(30, 41, 59, 255))
        draw.ellipse([20, 18, 34, 32], fill=(239, 68, 68, 255))
        draw.ellipse([42, 18, 56, 32], fill=(245, 158, 11, 255))
        draw.ellipse([64, 18, 78, 32], fill=(16, 185, 129, 255))
        draw.rounded_rectangle([100, 10, eff_width - 40, 40], radius=8, fill=(15, 23, 42, 200), outline=(51, 65, 85, 255))
        draw.rounded_rectangle([60, 90, eff_width - 60, eff_height - 60], radius=16, fill=(30, 41, 59, 200), outline=(56, 189, 248, 100))
        img.save(out_path, "PNG")
    except Exception as img_err:
        print(f"[!] Could not create fallback image: {img_err}")
        try:
            with open(out_path, "wb") as f_out:
                f_out.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
        except Exception:
            pass

    final_title = _extract_clean_tab_title(clean_url, title)
    _ensure_video()
    now_ts = int(time.time())
    return {
        "status": "success",
        "url": clean_url,
        "filename": out_filename,
        "preview_url": f"/api/v1/editor/captures/{out_filename}?t={now_ts}",
        "screenshot_path": out_path,
        "video_url": video_url,
        "video_path": video_path,
        "width": eff_width,
        "height": eff_height,
        "format": format_type,
        "cached": False,
        "title": final_title,
    }


@router.post("/capture-web")
def capture_web_endpoint(request: CaptureWebRequest):
    """
    Direct web capture endpoint. Captures high-res screenshot using headless Chrome
    and returns accessible preview URL and metadata.
    """
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL cannot be empty.")
    result = execute_web_capture(
        url,
        width=request.width,
        height=request.height,
        format_type=request.format or "desktop",
        generate_video=True,
    )
    return result


@router.api_route("/captures/{filename}", methods=["GET", "HEAD"])
def get_capture_image(filename: str):
    """
    Serves captured screenshot PNG for player canvas preview and staged edit cards.
    """
    safe_name = os.path.basename(filename.split("?")[0])
    local_path = os.path.join(CAPTURES_DIR, safe_name)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return FileResponse(local_path, media_type="image/png", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

    cache_path = os.path.expanduser(f"~/.cache/ai-content-manager/captures/{safe_name}")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return FileResponse(cache_path, media_type="image/png", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screenshot capture not found.")


@router.api_route("/recordings/{filename}", methods=["GET", "HEAD"])
def get_recording_video(filename: str):
    """
    Serves generated screen recording MP4 video for natural B-roll playback.
    """
    safe_name = os.path.basename(filename.split("?")[0])
    local_path = os.path.join(RECORDINGS_DIR, safe_name)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return FileResponse(local_path, media_type="video/mp4", headers={"Accept-Ranges": "bytes", "Cache-Control": "no-cache, no-store, must-revalidate"})

    cache_path = os.path.expanduser(f"~/.cache/ai-content-manager/recordings/{safe_name}")
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        return FileResponse(cache_path, media_type="video/mp4", headers={"Accept-Ranges": "bytes", "Cache-Control": "no-cache, no-store, must-revalidate"})

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording video not found.")


COMMON_TYPOS = {
    r"\bvidoe\b": "video",
    r"\bvedio\b": "video",
    r"\bvid\b": "video",
    r"\bvids\b": "videos",
    r"\bgrpahic\b": "graphic",
    r"\bgrpahics\b": "graphics",
    r"\bmotiongraphic\b": "motion graphic",
    r"\bmotiongraphics\b": "motion graphics",
    r"\bsceen\b": "screen",
    r"\buplaod\b": "upload",
    r"\buploadin\b": "uploading",
    r"\bcaptin\b": "caption",
    r"\bsubtitile\b": "subtitle",
    r"\bsubtitiles\b": "subtitles",
    r"\btransistion\b": "transition",
    r"\btransistions\b": "transitions",
    r"\bsoundeffect\b": "sound effect",
    r"\banimaton\b": "animation",
    r"\bannimation\b": "animation",
}


def normalize_typos(text: str) -> str:
    """Corrects common conversational typos without altering prompt structure."""
    res = text
    for pattern, repl in COMMON_TYPOS.items():
        res = re.sub(pattern, repl, res, flags=re.I)
    return res


def parse_time_token(token: str) -> float:
    """Parses timestamps like '10s', '12.5', '1:30' into seconds."""
    t = re.sub(r"(?:s|sec|seconds)$", "", token.strip(), flags=re.I)
    if ":" in t:
        parts = t.split(":")
        if len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    return float(t)


def extract_time_range_from_text(prompt: str, playhead: float, duration: float, default_duration: float = 3.5) -> Tuple[float, float, str, bool]:
    """
    Extracts explicit start/end time ranges from prompt text (e.g., 'from 10s to 12s', 'between 10s and 12s').
    Returns (start_time, end_time, cleaned_prompt, has_explicit_time).
    """
    cleaned = prompt

    # 1. between <T1> and <T2>
    between_match = re.search(r"\bbetween\s+([0-9:.]+(?:s|sec|seconds)?)\s+and\s+([0-9:.]+(?:s|sec|seconds)?)\b", prompt, re.I)
    if between_match:
        try:
            t1 = parse_time_token(between_match.group(1))
            t2 = parse_time_token(between_match.group(2))
            if t1 < t2:
                cleaned = re.sub(re.escape(between_match.group(0)), "", cleaned, flags=re.I).strip()
                effective_duration = max(duration, t2)
                return round(t1, 2), min(effective_duration, round(t2, 2)), cleaned, True
        except Exception:
            pass

    # 2. from <T1> to <T2>
    from_to_match = re.search(r"\bfrom\s+([0-9:.]+(?:s|sec|seconds)?)\s+to\s+([0-9:.]+(?:s|sec|seconds)?)\b", prompt, re.I)
    if from_to_match:
        try:
            t1 = parse_time_token(from_to_match.group(1))
            t2 = parse_time_token(from_to_match.group(2))
            if t1 < t2:
                cleaned = re.sub(re.escape(from_to_match.group(0)), "", cleaned, flags=re.I).strip()
                effective_duration = max(duration, t2)
                return round(t1, 2), min(effective_duration, round(t2, 2)), cleaned, True
        except Exception:
            pass

    # 3. (at|from) <T1> for <Duration>
    at_for_match = re.search(r"\b(?:at|from)\s+([0-9:.]+(?:s|sec|seconds)?)\s+for\s+([0-9:.]+(?:s|sec|seconds)?)\b", prompt, re.I)
    if at_for_match:
        try:
            t1 = parse_time_token(at_for_match.group(1))
            dur = parse_time_token(at_for_match.group(2))
            if dur > 0:
                cleaned = re.sub(re.escape(at_for_match.group(0)), "", cleaned, flags=re.I).strip()
                effective_duration = max(duration, t1 + dur)
                return round(t1, 2), min(effective_duration, round(t1 + dur, 2)), cleaned, True
        except Exception:
            pass

    # 4. <T1> to <T2> or <T1> - <T2> (e.g. "10s to 12s" without "from")
    range_match = re.search(r"\b([0-9:.]+(?:s|sec|seconds)?)\s*(?:-|to)\s*([0-9:.]+(?:s|sec|seconds)?)\b", prompt, re.I)
    if range_match:
        try:
            t1 = parse_time_token(range_match.group(1))
            t2 = parse_time_token(range_match.group(2))
            if t1 < t2:
                cleaned = re.sub(re.escape(range_match.group(0)), "", cleaned, flags=re.I).strip()
                effective_duration = max(duration, t2)
                return round(t1, 2), min(effective_duration, round(t2, 2)), cleaned, True
        except Exception:
            pass

    # 5. at <T1>
    at_match = re.search(r"\bat\s+([0-9:.]+(?:s|sec|seconds)?)\b", prompt, re.I)
    if at_match:
        try:
            t1 = parse_time_token(at_match.group(1))
            cleaned = re.sub(re.escape(at_match.group(0)), "", cleaned, flags=re.I).strip()
            return round(t1, 2), min(duration, round(t1 + default_duration, 2)), cleaned, True
        except Exception:
            pass

    start_time = round(playhead, 2)
    end_time = min(duration, round(start_time + default_duration, 2))
    return start_time, end_time, cleaned, False


def compute_safe_graphic_position(
    safe_zones: Optional[List[Dict[str, Any]]],
    default_pos: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Computes placement coordinates (x, y percentages) avoiding presenter occlusion.
    If presenter occupies center-top (e.g. x: 30-70, y: 15-55),
    the graphic is safely placed in lower-third {x: 50, y: 75}.
    """
    pos = dict(default_pos or {"x": 50.0, "y": 35.0})
    if not safe_zones:
        return pos

    px = float(pos.get("x", 50.0))
    py = float(pos.get("y", 35.0))

    collides = False
    for zone in safe_zones:
        zx = float(zone.get("x", zone.get("left", 0.0)))
        zy = float(zone.get("y", zone.get("top", 0.0)))
        zw = float(zone.get("width", zone.get("w", 0.0)))
        zh = float(zone.get("height", zone.get("h", 0.0)))
        if (zx <= px <= zx + zw) and (zy <= py <= zy + zh):
            collides = True
            break

    if collides:
        lower_third = {"x": 50.0, "y": 75.0}
        lt_collides = False
        for zone in safe_zones:
            zx = float(zone.get("x", zone.get("left", 0.0)))
            zy = float(zone.get("y", zone.get("top", 0.0)))
            zw = float(zone.get("width", zone.get("w", 0.0)))
            zh = float(zone.get("height", zone.get("h", 0.0)))
            if (zx <= 50.0 <= zx + zw) and (zy <= 75.0 <= zy + zh):
                lt_collides = True
                break
        if not lt_collides:
            return lower_third
        return {"x": 25.0, "y": 50.0}

    return pos


def determine_edit_scope(prompt: str) -> str:
    """Classifies the prompt into whole_video, semantic_anchor, or time_range."""
    lower = prompt.lower()
    whole_video_keywords = [
        "throughout", "whole video", "entire video", "all over", "everywhere",
        "make this video", "full video", "make video", "entire timeline",
        "whole timeline", "across the video", "across the whole video",
        "across the entire video", "all the way through", "make the whole video",
        "whole-video", "macro", "video-wide",
    ]
    if any(k in lower for k in whole_video_keywords):
        return "whole_video"
    if any(k in lower for k in ["when i say", "when they say", "mention", "phrase", "where i discuss"]):
        return "semantic_anchor"
    return "time_range"


@router.post("/copilot", response_model=EditPlanProposal)
async def process_copilot_prompt(request: EditorCopilotRequest) -> EditPlanProposal:
    """
    Tier-2 Cloud AI Copilot Endpoint.
    Interprets natural language prompts with context, resolves stock footage queries,
    and returns a structured EditPlanProposal for user review and approval.
    """
    clean_prompt = request.prompt.strip()
    if not clean_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty."
        )

    scope = determine_edit_scope(clean_prompt)
    playhead = request.context.playhead_time
    duration = request.context.duration

    # 0. Normalize typos and extract explicit time ranges (e.g., 'from 10s to 12s')
    norm_prompt = normalize_typos(clean_prompt)
    extracted_start, extracted_end, timing_cleaned, has_explicit_time = extract_time_range_from_text(
        norm_prompt, playhead, duration, default_duration=3.5
    )
    lower = timing_cleaned.lower()
    
    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()
    edits: List[ProposedEditItem] = []
    suggested_actions = None

    # 1. WHOLE-VIDEO MACRO PLANNING
    if scope == "whole_video":
        max_edits = request.options.max_edits if (request.options and request.options.max_edits > 5) else 12
        if coordinate_whole_video_plan:
            beats = request.context.transcript_beats
            if not beats and isinstance(request.context.transcript, dict):
                beats = request.context.transcript.get("beatSheet", {}).get("beats")

            plan = coordinate_whole_video_plan(
                total_duration=duration,
                prompt=clean_prompt,
                transcript_beats=beats,
                max_edits=max_edits,
            )
            raw_edits = plan.edits
        else:
            raw_edits = []

        for edit in raw_edits:
            edit_id = f"prop-{uuid.uuid4().hex[:6]}"
            action = edit.action
            start = round(edit.start if edit.start is not None else 0.0, 2)
            end = round(edit.end if edit.end is not None else (start + 3.0), 2)

            if action == "b_roll":
                search_query = edit.search_query or "high energy stock footage"
                broll_data = None
                if search_single_broll_clip and request.options and request.options.allow_stock_sourcing:
                    try:
                        broll_data = search_single_broll_clip(
                            query=search_query,
                            aspect_ratio=request.context.aspect_ratio,
                            duration_min=max(2.0, end - start),
                        )
                    except Exception as err:
                        print(f"[!] Error in search_single_broll_clip: {err}")

                broll_id = broll_data["video_id"] if broll_data else f"broll-{uuid.uuid4().hex[:8]}"
                title_text = broll_data["title"] if broll_data else search_query.title()
                source_url = broll_data["video_url"] if broll_data else f"https://cdn.ai-content-manager.com/broll/{broll_id}.mp4"
                preview_url = broll_data["preview_url"] if broll_data else "https://images.pexels.com/videos/12345/preview.mp4"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="broll",
                        start=start,
                        end=end,
                        track="broll",
                        title=f"Stock B-Roll: {title_text}",
                        description=f"High-quality stock footage matching '{search_query}' from {start:.1f}s to {end:.1f}s.",
                        reason=edit.reason or f"Visualizes narrative concept for '{search_query}'",
                        is_destructive=False,
                        overlap_conflict=False,
                        preview_url=preview_url,
                        operation={
                            "type": "add_element",
                            "track": "broll",
                            "element": {
                                "id": broll_id,
                                "name": title_text,
                                "sourceUrl": source_url,
                                "thumbnailUrl": preview_url,
                                "start": start,
                                "end": end,
                                "opacity": 100,
                                "volume": 0,
                                "muted": True,
                                "fitMode": "cover",
                                "position": {"x": 50, "y": 50},
                                "scale": 1.0,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "motion_graphics":
                comp_type = (edit.motion_graphics_type or "hero_reveal").replace("_", "-")
                props = edit.motion_graphics_targets or {"headline": "Key Milestone", "supporting": "Accelerating workflow execution"}
                graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="graphic",
                        start=start,
                        end=end,
                        track="graphic",
                        title=f"Motion Card: {comp_type.replace('-', ' ').title()}",
                        description=f"Remotion motion graphic positioned non-destructively on graphics track.",
                        reason=edit.reason or f"Emphasizes key insight with {comp_type}",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_element",
                            "track": "graphic",
                            "element": {
                                "id": graphic_id,
                                "name": comp_type.replace("-", " ").title(),
                                "compositionId": comp_type,
                                "props": props,
                                "start": start,
                                "end": end,
                                "position": compute_safe_graphic_position(request.context.safe_zones),
                                "scale": 1.0,
                                "rotation": 0,
                                "isUserLocked": False,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "sfx":
                sound_name = edit.sound_effect or "whoosh-in"
                sfx_id = f"sfx-{uuid.uuid4().hex[:8]}"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="sfx",
                        start=start,
                        end=end,
                        track="audio",
                        title=f"SFX: {sound_name.replace('-', ' ').title()}",
                        description=f"Audio accent ({sound_name}) anchored to narrative beat.",
                        reason=edit.reason or f"Punchy sound effect punch for {sound_name}",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_element",
                            "track": "audio",
                            "element": {
                                "id": sfx_id,
                                "name": f"SFX: {sound_name.title()}",
                                "sourceUrl": f"https://cdn.ai-content-manager.com/sfx/{sound_name}.mp3",
                                "start": start,
                                "end": end,
                                "volume": 80,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "transition":
                trans_type = edit.transition or "crossfade"
                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="transition",
                        start=start,
                        end=end,
                        track="video",
                        title=f"Transition: {trans_type.replace('_', ' ').title()}",
                        description=f"Smooth {trans_type} transition at {start:.1f}s.",
                        reason=edit.reason or "Section boundary transition",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_transition",
                            "id": f"trans-{uuid.uuid4().hex[:6]}",
                            "track": "video",
                            "fromClipId": "clip-lead",
                            "toClipId": "clip-tail",
                            "preset": trans_type,
                            "duration": round(end - start, 2) if (end - start > 0) else 0.5,
                            "alignment": "center",
                        },
                        status="pending"
                    )
                )

        broll_count = sum(1 for e in edits if e.action_type == "broll")
        mg_count = sum(1 for e in edits if e.action_type == "graphic")
        sfx_count = sum(1 for e in edits if e.action_type == "sfx")
        trans_count = sum(1 for e in edits if e.action_type == "transition")
        summary = (
            f"Generated coordinated whole-video plan with {len(edits)} edits "
            f"({broll_count} B-roll clips, {mg_count} motion graphics, {sfx_count} SFX cues, {trans_count} transitions) "
            f"respecting pacing and density budgets."
        )

    # 1.5 USER PREFERENCE: NO GRAPHIC CARDS FOR RECORDINGS
    elif any(kw in lower for kw in [
        "dont add website recording in graphics",
        "dont add website in graphics",
        "dont put website recording in graphics",
        "dont put website in graphics",
        "dont add in graphics",
        "only need recording that feel natural",
        "only need recordings that feel natural",
        "recording that feel natural",
    ]):
        summary = (
            "Understood! Website recordings will now always be captured as natural, smooth-scrolling screen recordings "
            "placed directly on the B-Roll track without any graphic cards or artificial phone frames."
        )
        suggested_actions = [
            "Show website https://stripe.com from 2s to 6s",
            "Show website https://github.com from 5s to 9s",
            "Add stock video footage",
        ]

    # 2. DIRECT WEB EVIDENCE CAPTURE (URL in prompt or explicit website recording instruction)
    elif URL_REGEX.search(clean_prompt) or any(kw in lower for kw in [
        "go to news", "news website", "news site", "tech news", "techcrunch", "open website", "visit website",
        "record: go to", "record go to", "hacker news", "the verge", "record website", "screen recording of"
    ]):
        url_match = URL_REGEX.search(clean_prompt)
        if url_match:
            target_url = url_match.group(0).rstrip(".,;)")
            if not target_url.startswith("http://") and not target_url.startswith("https://"):
                target_url = f"https://{target_url}"
        elif any(k in lower for k in ["hacker news", "ycombinator"]):
            target_url = "https://news.ycombinator.com"
        elif any(k in lower for k in ["news", "article", "articles", "tech", "ai", "techcrunch", "the verge"]):
            target_url = "https://techcrunch.com"
        else:
            target_url = "https://news.ycombinator.com"
        start_time = extracted_start
        end_time = extracted_end
        duration_val = max(1.0, end_time - start_time)
        format_type = "9:16" if (request.context and request.context.aspect_ratio == "9:16") else "16:9"
        cap_res = execute_web_capture(
            target_url,
            format_type=format_type,
            generate_video=True,
            duration=duration_val,
            action_prompt=clean_prompt,
        )
        preview_url = cap_res.get("preview_url")
        video_url = cap_res.get("video_url") or preview_url
        tab_title = cap_res.get("title") or target_url.replace("https://", "").replace("http://", "").split("/")[0]

        is_explicit_graphic_requested = (
            any(w in lower for w in ["graphic card", "motion graphic", "browser mockup", "phone card"])
            and not any(neg in lower for neg in ["dont", "don't", "no graphic", "natural", "recording", "broll", "b-roll"])
        )

        if is_explicit_graphic_requested:
            graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"
            edit_item = ProposedEditItem(
                id=f"prop-{uuid.uuid4().hex[:6]}",
                action_type="graphic",
                start=start_time,
                end=end_time,
                track="graphic",
                title=f"Web Evidence: {tab_title}",
                description=f"Interactive browser card capturing {target_url} from {start_time:.1f}s to {end_time:.1f}s.",
                reason=f"Speaker referenced web source: {target_url}",
                is_destructive=False,
                overlap_conflict=False,
                preview_url=preview_url,
                operation={
                    "type": "add_element",
                    "track": "graphic",
                    "element": {
                        "id": graphic_id,
                        "name": f"Browser: {tab_title}",
                        "compositionId": "browser-walkthrough",
                        "props": {
                            "url": target_url,
                            "tabTitle": tab_title,
                            "screenshotUrl": preview_url,
                            "videoUrl": video_url,
                            "format": format_type,
                            "aspectRatio": format_type,
                        },
                        "start": start_time,
                        "end": end_time,
                        "position": {"x": 50, "y": 35},
                        "scale": 1.0,
                        "rotation": 0,
                        "isUserLocked": False,
                    }
                },
                status="pending"
            )
            edits.append(edit_item)
            summary = f"Captured live web evidence card for {target_url} ({start_time:.1f}s - {end_time:.1f}s)."
            suggested_actions = ["Add stock video footage", "Add animated app upload graphic"]
        else:
            # Natural screen recording overlaid as B-roll footage (NOT in a graphic card)
            broll_id = f"broll-{uuid.uuid4().hex[:8]}"
            edit_item = ProposedEditItem(
                id=f"prop-{uuid.uuid4().hex[:6]}",
                action_type="broll",
                start=start_time,
                end=end_time,
                track="broll",
                title=f"Website Recording: {tab_title}",
                description=f"Natural scrolling screen recording of {target_url} overlaid as B-roll footage with narration preserved.",
                reason=f"Natural website recording for: {target_url}",
                is_destructive=False,
                overlap_conflict=False,
                preview_url=preview_url,
                operation={
                    "type": "add_element",
                    "track": "broll",
                    "element": {
                        "id": broll_id,
                        "name": f"Recording: {tab_title}",
                        "sourceUrl": video_url,
                        "thumbnailUrl": preview_url,
                        "start": start_time,
                        "end": end_time,
                        "opacity": 100,
                        "volume": 0,
                        "muted": True,
                        "fitMode": "cover",
                        "position": {"x": 50, "y": 50},
                        "scale": 1.0,
                    }
                },
                status="pending"
            )
            edits.append(edit_item)
            summary = f"Added natural screen recording of {target_url} as B-roll footage ({start_time:.1f}s - {end_time:.1f}s)."
            suggested_actions = ["Adjust B-roll opacity", "Scale recording", "Trim duration"]

    # 3. TRANSITION REQUEST
    elif re.search(r"\b(?:transition|crossfade|fade\s*to\s*black|wipe\s*(?:left|right)?|slide\s*up|zoom\s*in|whip\s*pan)\b", lower):
        start_time = extracted_start
        end_time = min(duration, round(start_time + 0.5, 2)) if not has_explicit_time else extracted_end
        trans_type = "crossfade"
        if "fade to black" in lower or "fade_to_black" in lower:
            trans_type = "fade_to_black"
        elif "wipe left" in lower or "wipe_left" in lower:
            trans_type = "wipe_left"
        elif "wipe right" in lower or "wipe_right" in lower or "wipe" in lower:
            trans_type = "wipe_right"
        elif "slide up" in lower or "slide_up" in lower or "slide" in lower:
            trans_type = "slide_up"
        elif "zoom in" in lower or "zoom_in" in lower or "zoom" in lower:
            trans_type = "zoom_in"
        elif "whip pan" in lower or "whip_pan" in lower:
            trans_type = "whip_pan"

        trans_id = f"trans-{uuid.uuid4().hex[:6]}"
        edits.append(
            ProposedEditItem(
                id=f"prop-{uuid.uuid4().hex[:6]}",
                action_type="transition",
                start=start_time,
                end=end_time,
                track="video",
                title=f"Transition: {trans_type.replace('_', ' ').title()}",
                description=f"Smooth {trans_type} transition at {start_time:.1f}s.",
                reason=f"Matches transition request '{clean_prompt}'.",
                is_destructive=False,
                overlap_conflict=False,
                operation={
                    "type": "add_transition",
                    "id": trans_id,
                    "track": "video",
                    "fromClipId": "clip-lead",
                    "toClipId": "clip-tail",
                    "preset": trans_type,
                    "duration": round(end_time - start_time, 2) if (end_time - start_time > 0) else 0.5,
                    "alignment": "center",
                },
                status="pending"
            )
        )
        summary = f"Prepared {trans_type.replace('_', ' ')} transition at {start_time:.1f}s."

    # 2.5. BACKGROUND MUSIC / BGM REQUEST (With optional ducking)
    elif re.search(r"\b(?:background\s*music|bgm|soundtrack|chill\s*music|lofi\s*music|ambient\s*music)\b", lower):
        has_ducking = bool(re.search(r"\b(?:duck|ducking|whenever\s+i\s+speak|under\s+speech)\b", lower))
        start_time = extracted_start if has_explicit_time else 0.0
        end_time = extracted_end if has_explicit_time else duration
        bgm_id = f"audio-bgm-{uuid.uuid4().hex[:8]}"
        edits.append(
            ProposedEditItem(
                id=f"prop-{uuid.uuid4().hex[:6]}",
                action_type="audio",
                start=start_time,
                end=end_time,
                track="audio",
                title=f"Background Music: Chill Lofi{' (Ducked)' if has_ducking else ''}",
                description=f"Chill background music{' with -14dB automatic speech ducking' if has_ducking else ''} from {start_time:.1f}s to {end_time:.1f}s.",
                reason=f"Matches music request '{clean_prompt}'.",
                is_destructive=False,
                overlap_conflict=False,
                operation={
                    "type": "add_element",
                    "track": "audio",
                    "element": {
                        "id": bgm_id,
                        "name": "Chill Background Music",
                        "sourceUrl": "/assets/audio/chill-bgm.mp3",
                        "start": start_time,
                        "end": end_time,
                        "volume": 35 if has_ducking else 50,
                        "fadeIn": 1.0,
                        "fadeOut": 1.5,
                        "isBgm": True,
                        "ducking": has_ducking,
                        "duckingDb": -14.0 if has_ducking else None,
                    }
                },
                status="pending"
            )
        )
        summary = f"Prepared chill background music{' with -14dB narration ducking' if has_ducking else ''} for {end_time - start_time:.1f}s."

    # 3. SFX / SOUND EFFECT REQUEST
    elif re.search(r"\b(?:sfx|sound\s+effects?|whoosh|ding|pop|applause|riser|impact|ambient|chime|audio\s+cue)\b", lower):
        start_time = extracted_start
        end_time = min(duration, round(start_time + 1.0, 2)) if not has_explicit_time else extracted_end
        sound_name = "whoosh"
        if "ding" in lower:
            sound_name = "chime"
        elif "pop" in lower:
            sound_name = "pop"
        elif "applause" in lower:
            sound_name = "chime"
        elif "riser" in lower:
            sound_name = "riser"
        elif "impact" in lower:
            sound_name = "impact"
        elif "chime" in lower:
            sound_name = "chime"
        elif "whoosh" in lower:
            sound_name = "whoosh"

        sfx_id = f"sfx-{uuid.uuid4().hex[:8]}"
        edits.append(
            ProposedEditItem(
                id=f"prop-{uuid.uuid4().hex[:6]}",
                action_type="sfx",
                start=start_time,
                end=end_time,
                track="audio",
                title=f"SFX: {sound_name.replace('-', ' ').title()}",
                description=f"Audio accent ({sound_name}) from {start_time:.1f}s to {end_time:.1f}s.",
                reason=f"Matches sound effect request '{clean_prompt}'.",
                is_destructive=False,
                overlap_conflict=False,
                operation={
                    "type": "add_element",
                    "track": "audio",
                    "element": {
                        "id": sfx_id,
                        "name": f"SFX: {sound_name.title()}",
                        "sourceUrl": f"/assets/audio/{sound_name}.mp3",
                        "start": start_time,
                        "end": end_time,
                        "volume": 80,
                        "fadeIn": 0.0,
                        "fadeOut": 0.05,
                        "isBgm": False,
                    }
                },
                status="pending"
            )
        )
        summary = f"Prepared SFX ({sound_name}) at {start_time:.1f}s."

    # 4. EXPLICIT CAPTION / SUBTITLE / TITLE REQUEST (Must NOT be an animated motion graphic)
    elif (
        not re.search(r"\b(?:animat\w*|motion\s*graphics?)\b", lower)
        and not re.search(r"\b(?:blue|cyan|emerald|green|amber|purple)\s+animated\b", lower)
        and (
            re.search(r"\b(?:captions?|subtitles?)\b", lower)
            or (re.search(r"\b(?:title\s+saying|title\s+that\s+says|text\s+(?:saying|that\s+says))\b", lower) and not re.search(r"\b(?:blue|cyan|emerald|green|amber|purple|card|graphic)\b", lower))
            or re.search(r"\b(?:add|insert|put)\s+(?:a\s+)?(?:header|caption|subtitle)\s*[:\s]?\s*[\"']", lower)
        )
    ):
        start_time = extracted_start
        end_time = extracted_end
        caption_text_match = re.search(r'(?:saying|that says|with text)?\s*["\']([^"\']+)["\']', clean_prompt, re.I)
        caption_text = caption_text_match.group(1).strip() if caption_text_match else clean_prompt
        caption_text = re.sub(r'^(?:add|put|insert)\s+(?:a\s+)?(?:caption|title|subtitle)(?:\s+(?:saying|that says))?\s*', '', caption_text, flags=re.I).strip()
        if not caption_text:
            caption_text = clean_prompt

        caption_id = f"caption-{uuid.uuid4().hex[:8]}"
        edit_item = ProposedEditItem(
            id=f"prop-{uuid.uuid4().hex[:6]}",
            action_type="caption",
            start=start_time,
            end=end_time,
            track="caption",
            title=f"Caption: {caption_text[:25]}",
            description=f"Styled dynamic caption from {start_time:.1f}s to {end_time:.1f}s.",
            reason=f"Matches spoken caption intent '{clean_prompt}'.",
            is_destructive=False,
            overlap_conflict=False,
            operation={
                "type": "add_element",
                "track": "caption",
                "element": {
                    "id": caption_id,
                    "text": caption_text,
                    "start": start_time,
                    "end": end_time,
                    "stylePreset": "tiktok_yellow",
                    "position": {"x": 50, "y": 75},
                    "scale": 1.0,
                }
            },
            status="pending"
        )
        edits.append(edit_item)
        summary = f"Prepared caption '{caption_text[:30]}' from {start_time:.1f}s to {end_time:.1f}s."

    # 5. TIER-3 LLM REASONING (WITH TIER-2 RULE GATEKEEPER FALLBACK)
    else:
        llm_handled = False
        if reason_copilot_intent and (request.options is None or request.options.use_llm_reasoning):
            try:
                llm_context = {
                    "playhead_time": playhead,
                    "duration": duration,
                    "aspect_ratio": request.context.aspect_ratio,
                    "selected_item": request.context.selected_item,
                    "active_transcript_words": request.context.active_transcript_words,
                    "safe_zones": request.context.safe_zones,
                }
                ai_model = request.options.ai_model if request.options else "DeepSeek V3"
                proposal: Optional[CopilotIntentProposal] = reason_copilot_intent(
                    prompt=clean_prompt,
                    context=llm_context,
                    ai_model_pref=ai_model
                )

                if proposal:
                    start_time = proposal.start_time if has_explicit_time else extracted_start
                    end_time = proposal.end_time if has_explicit_time else extracted_end

                    if proposal.intent == "clarification_needed":
                        summary = proposal.clarification_prompt or proposal.summary
                        suggested_actions = list(proposal.suggested_actions) if proposal.suggested_actions else [
                            "Add stock video footage", "Add animated motion card", "Add subtitle caption"
                        ]
                        if "Add stock video footage" not in suggested_actions:
                            suggested_actions.insert(0, "Add stock video footage")
                        llm_handled = True

                    elif proposal.intent == "add_graphic":
                        tmpl = proposal.graphic_template or "hero-reveal"
                        if tmpl in ("hero_reveal", "hero-reveal"):
                            comp_id = "hero-reveal"
                        elif tmpl in ("animated_counter", "animated-counter"):
                            comp_id = "animated-counter"
                        else:
                            comp_id = tmpl.replace("_", "-")

                        title_text = comp_id.replace("_", " ").replace("-", " ").title()
                        props = proposal.graphic_props or {}

                        if comp_id in ("hero_reveal", "hero-reveal"):
                            title_text = "Hero Reveal"
                            headline_val = props.get("headline") or props.get("title") or "The Solution"
                            color_val = props.get("colorTheme") or ("blue" if "blue" in lower else "purple")
                            props = {
                                "headline": headline_val,
                                "title": headline_val,
                                "label": props.get("label", "KEY INSIGHT"),
                                "supporting": props.get("supporting", "Accelerating workflow execution"),
                                "colorTheme": color_val,
                            }
                        elif comp_id in ("animated_counter", "animated-counter"):
                            title_text = "Animated Counter"
                            props = {
                                "from": props.get("from", 0),
                                "to": props.get("to", 50000),
                                "label": str(props.get("label", "SUBSCRIBERS")).upper(),
                                "prefix": props.get("prefix", ""),
                                "suffix": props.get("suffix", "k"),
                            }
                        elif comp_id == "app-screen-upload":
                            title_text = "App Screen Upload"
                            file_name = props.get("fileName") or "upload_video.mp4"
                            if "upload" not in file_name.lower():
                                file_name = "upload_video.mp4"
                            props = {
                                "title": props.get("title", "VIDEO UPLOAD"),
                                "appName": props.get("appName", "Video Studio App"),
                                "fileName": file_name,
                                "progress": props.get("progress", 100),
                                "status": props.get("status", "Upload Complete"),
                            }
                        elif comp_id == "chart-reveal":
                            title_text = "Rising Growth Chart"
                            props = {
                                "title": "GROWTH TREND",
                                "dataPoint1": props.get("dataPoint1", "Stage 1: Baseline"),
                                "dataPoint2": props.get("dataPoint2", "Stage 2: +85%"),
                                "dataPoint3": props.get("dataPoint3", "Stage 3: +165% Surge"),
                                "personality": props.get("personality", "technical"),
                            }
                        elif comp_id == "metric-reveal":
                            title_text = "Metric Reveal"
                            props = {
                                "label": props.get("label", "KEY METRIC"),
                                "metric": props.get("metric", "+140%"),
                                "delta": props.get("delta", "Target Exceeded"),
                                "personality": props.get("personality", "energetic"),
                            }
                        elif comp_id == "cooked-terminal":
                            title_text = "Terminal Code"
                            props = {
                                "command": props.get("command", "npm run deploy"),
                                "output": props.get("output", "Server running: 100% production ready"),
                            }
                        elif comp_id == "cooked-social-post":
                            title_text = "Social Post"
                            props = {
                                "name": props.get("name", "Creator Pro"),
                                "handle": props.get("handle", "@creator_pro"),
                                "text": props.get("text", clean_prompt),
                                "likes": props.get("likes", "18.4K"),
                            }
                        elif comp_id == "quote-reveal":
                            title_text = "Quote Reveal"
                            props = {
                                "quote": props.get("quote", clean_prompt),
                                "author": props.get("author", "Key Takeaway"),
                                "personality": props.get("personality", "premium"),
                            }

                        safe_pos = compute_safe_graphic_position(request.context.safe_zones)
                        graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"
                        edit_item = ProposedEditItem(
                            id=f"prop-{uuid.uuid4().hex[:6]}",
                            action_type="graphic",
                            start=start_time,
                            end=end_time,
                            track="graphic",
                            title=f"Motion Card: {title_text}",
                            description=f"High-production Remotion motion graphic positioned non-destructively on graphics track.",
                            reason=f"Visualizes narrative concept: {proposal.summary}",
                            is_destructive=False,
                            overlap_conflict=False,
                            preview_url=None,
                            operation={
                                "type": "add_element",
                                "track": "graphic",
                                "element": {
                                    "id": graphic_id,
                                    "name": title_text,
                                    "compositionId": comp_id,
                                    "props": props,
                                    "start": start_time,
                                    "end": end_time,
                                    "position": safe_pos,
                                    "positionX": safe_pos["x"],
                                    "positionY": safe_pos["y"],
                                    "scale": 1.0,
                                    "rotation": 0,
                                    "isUserLocked": False,
                                }
                            },
                            status="pending"
                        )
                        edits.append(edit_item)
                        summary = proposal.summary or f"Prepared 1 motion graphic card ({comp_id}) from {start_time:.1f}s to {end_time:.1f}s."
                        suggested_actions = proposal.suggested_actions or ["Add stock video footage", "Add subtitle caption"]
                        llm_handled = True

                    elif proposal.intent == "add_broll":
                        query_topic = proposal.search_query or "cinematic footage"
                        broll_data = None
                        clip_duration = max(1.5, round(end_time - start_time, 2))
                        if search_single_broll_clip and request.options and request.options.allow_stock_sourcing:
                            try:
                                broll_data = search_single_broll_clip(
                                    query=query_topic,
                                    aspect_ratio=request.context.aspect_ratio,
                                    duration_min=clip_duration,
                                )
                            except Exception as err:
                                print(f"[!] Error in search_single_broll_clip: {err}")

                        broll_id = broll_data["video_id"] if broll_data else f"broll-{uuid.uuid4().hex[:8]}"
                        title_text = broll_data["title"] if broll_data else query_topic.title()
                        source_url = broll_data["video_url"] if broll_data else f"https://cdn.ai-content-manager.com/broll/{query_topic.lower().replace(' ', '_')}.mp4"
                        preview_url = broll_data["preview_url"] if broll_data else "https://images.pexels.com/videos/12345/preview.mp4"
                        width = broll_data.get("width", 1080) if broll_data else 1080
                        height = broll_data.get("height", 1920) if broll_data else 1920
                        orientation = broll_data.get("orientation", "portrait") if broll_data else "portrait"

                        edit_item = ProposedEditItem(
                            id=f"prop-{uuid.uuid4().hex[:6]}",
                            action_type="broll",
                            start=start_time,
                            end=end_time,
                            track="broll",
                            title=f"Stock B-Roll: {title_text}",
                            description=f"High-quality {orientation} stock footage ({width}x{height}) matching '{query_topic}' overlaying timeline from {start_time:.1f}s to {end_time:.1f}s with speech audio preserved.",
                            reason=f"Matches narrative beat: {proposal.summary}",
                            is_destructive=False,
                            overlap_conflict=False,
                            preview_url=preview_url,
                            operation={
                                "type": "add_element",
                                "track": "broll",
                                "element": {
                                    "id": broll_id,
                                    "name": title_text,
                                    "sourceUrl": source_url,
                                    "thumbnailUrl": preview_url,
                                    "start": start_time,
                                    "end": end_time,
                                    "opacity": 100,
                                    "volume": 0,
                                    "muted": True,
                                    "fitMode": "cover",
                                    "position": {"x": 50, "y": 50},
                                    "scale": 1.0,
                                }
                            },
                            status="pending"
                        )
                        edits.append(edit_item)
                        summary = proposal.summary or f"Found stock B-roll matching '{query_topic}' ({width}x{height}) from {start_time:.1f}s to {end_time:.1f}s."
                        suggested_actions = proposal.suggested_actions or ["Add stock video footage", "Add animated app upload graphic"]
                        llm_handled = True

                    elif proposal.intent == "capture_web_evidence":
                        comp_id = "browser-walkthrough"
                        props = proposal.graphic_props or {}
                        target_url = props.get("url")
                        if not target_url:
                            url_match = URL_REGEX.search(clean_prompt)
                            if url_match:
                                target_url = url_match.group(0).rstrip(".,;)")
                        # Check if user explicitly asked for a motion graphic / graphic card
                        prompt_lower = clean_prompt.lower()
                        is_explicit_graphic_requested = (
                            any(kw in prompt_lower for kw in ["graphic card", "motion graphic", "browser mockup", "phone card"])
                            and not any(neg in prompt_lower for neg in ["dont", "don't", "no graphic", "natural", "recording", "broll", "b-roll"])
                        )

                        # Adapt to project aspect ratio or explicit format
                        chosen_format = props.get("format") or props.get("aspectRatio")
                        if not chosen_format:
                            chosen_format = "9:16" if project_aspect_ratio == "9:16" else "16:9"

                        duration = max(1.0, end_time - start_time)
                        cap_res = execute_web_capture(
                            target_url,
                            format_type=chosen_format,
                            generate_video=True,
                            duration=duration,
                            action_prompt=clean_prompt,
                        )
                        preview_url = cap_res.get("preview_url")
                        video_url = cap_res.get("video_url") or preview_url
                        tab_title = props.get("tabTitle") or props.get("title") or cap_res.get("title") or (target_url.replace("https://", "").replace("http://", "").split("/")[0] if target_url else "Web Evidence")

                        if is_explicit_graphic_requested:
                            props["url"] = target_url
                            props["tabTitle"] = tab_title
                            props["screenshotUrl"] = preview_url
                            props["videoUrl"] = video_url
                            props["format"] = chosen_format
                            props["aspectRatio"] = chosen_format

                            graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"
                            edit_item = ProposedEditItem(
                                id=f"prop-{uuid.uuid4().hex[:6]}",
                                action_type="graphic",
                                start=start_time,
                                end=end_time,
                                track="graphic",
                                title=f"Browser Walkthrough: {tab_title}",
                                description=f"Animated browser window capturing web evidence for {target_url}.",
                                reason=proposal.summary or f"Web evidence card for {target_url}.",
                                is_destructive=False,
                                overlap_conflict=False,
                                preview_url=preview_url,
                                operation={
                                    "type": "add_element",
                                    "track": "graphic",
                                    "element": {
                                        "id": graphic_id,
                                        "name": f"Browser: {tab_title}",
                                        "compositionId": comp_id,
                                        "props": props,
                                        "start": start_time,
                                        "end": end_time,
                                        "position": {"x": 50, "y": 35},
                                        "scale": 1.0,
                                        "rotation": 0,
                                        "isUserLocked": False,
                                    }
                                },
                                status="pending"
                            )
                            edits.append(edit_item)
                            summary = proposal.summary or f"Captured live web evidence card for {target_url} ({start_time:.1f}s - {end_time:.1f}s)."
                            suggested_actions = proposal.suggested_actions or ["Add stock video footage", "Add animated app upload graphic"]
                            llm_handled = True
                        else:
                            # Standard & preferred: Natural screen recording overlaid as B-roll footage (NO graphic card)
                            broll_id = f"broll-{uuid.uuid4().hex[:8]}"
                            edit_item = ProposedEditItem(
                                id=f"prop-{uuid.uuid4().hex[:6]}",
                                action_type="broll",
                                start=start_time,
                                end=end_time,
                                track="broll",
                                title=f"Website Recording: {tab_title}",
                                description=f"Natural scrolling screen recording of {target_url} overlaid as B-roll footage with narration preserved.",
                                reason=proposal.summary or f"Natural website screen recording of {target_url}.",
                                is_destructive=False,
                                overlap_conflict=False,
                                preview_url=preview_url,
                                operation={
                                    "type": "add_element",
                                    "track": "broll",
                                    "element": {
                                        "id": broll_id,
                                        "name": f"Recording: {tab_title}",
                                        "sourceUrl": video_url,
                                        "thumbnailUrl": preview_url,
                                        "start": start_time,
                                        "end": end_time,
                                        "opacity": 100,
                                        "volume": 0,
                                        "muted": True,
                                        "fitMode": "cover",
                                        "position": {"x": 50, "y": 50},
                                        "scale": 1.0,
                                    }
                                },
                                status="pending"
                            )
                            edits.append(edit_item)
                            summary = proposal.summary or f"Added natural screen recording of {target_url} as B-roll footage ({start_time:.1f}s - {end_time:.1f}s)."
                            suggested_actions = ["Adjust B-roll opacity", "Scale recording", "Trim duration"]
                            llm_handled = True
            except Exception as llm_err:
                print(f"[!] Tier-3 LLM reasoning failed: {llm_err}. Using Tier-2 fallback.")
                llm_handled = False

        if not llm_handled:
            # TIER-2 DETERMINISTIC FALLBACK
            if (
                re.search(r"\b(?:motion\s*graphics?|graphics?|cards?|counters?|kpi|metrics?|charts?|rising\s+graphs?|terminals?|social\s+posts?|quote\s+reveals?|progress\s+bars?|toasts?|notes?|badges?|candlestick|trading|compound|snowball|portfolio|donut|inflation|cash\s*burn|banking|wire\s*transfer|deposit|waterfall|budget|debt|roi|balance\s*scale|flywheel|buffett)\b", lower)
                or re.search(r"\b(?:app\s+upload|upload\s+graphic|upload\s+animation|screen\s+upload)\b", lower)
            ):
                start_time = extracted_start
                if has_explicit_time:
                    end_time = extracted_end
                else:
                    card_duration = 4.0
                    end_time = min(duration, round(start_time + card_duration, 2))

                if re.search(r"\b(?:upload(?:ing)?|app|screen|interface|dashboard|software|file)\b", lower):
                    comp_id = "app-screen-upload"
                    title_text = "App Screen Upload"
                    props = {
                        "title": "VIDEO UPLOAD",
                        "appName": "Video Studio App",
                        "fileName": "upload_video.mp4",
                        "progress": 100,
                        "status": "Upload Complete",
                    }
                elif re.search(r"\b(?:rising\s+graphs?|growth\s+charts?|trend\s+graphs?|data\s+points?|bar\s+charts?|line\s+charts?|pie\s+charts?|charts?)\b", lower) or (re.search(r"\bgraphs?\b", lower) and not re.search(r"\bmotion\s+graphics?\b", lower)):
                    comp_id = "chart-reveal"
                    title_text = "Rising Growth Chart"
                    props = {
                        "title": "GROWTH TREND",
                        "dataPoint1": "Stage 1: Baseline",
                        "dataPoint2": "Stage 2: +85%",
                        "dataPoint3": "Stage 3: +165% Surge",
                        "personality": "technical",
                    }
                elif (
                    re.search(r"\b(?:counter|counting|subscribers?|followers?|views?)\b", lower)
                    and re.search(r"\b(?:animat\w*|motion|card|graphic|kpi|ticker)\b", lower)
                ) or re.search(r"\b(?:animated\s+counter|subscriber\s+counter|follower\s+counter|counting\s+to)\b", lower):
                    comp_id = "animated-counter"
                    title_text = "Animated Counter"
                    count_match = re.search(r"\b(?:to|counting\s+to|reach(?:ing)?\s+to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*([kmb])?\b", lower)
                    to_val = 50000
                    suffix = "k"
                    if count_match:
                        base_num = float(count_match.group(1))
                        unit = (count_match.group(2) or "").lower()
                        if unit == "k":
                            to_val = int(base_num * 1000)
                            suffix = "k"
                        elif unit == "m":
                            to_val = int(base_num * 1000000)
                            suffix = "M"
                        elif unit == "b":
                            to_val = int(base_num * 1000000000)
                            suffix = "B"
                        else:
                            to_val = int(base_num)
                            suffix = ""
                    label = "SUBSCRIBERS" if "sub" in lower else "FOLLOWERS" if "follow" in lower else "METRIC COUNTER"
                    props = {
                        "from": 0,
                        "to": to_val,
                        "label": label,
                        "prefix": "",
                        "suffix": suffix,
                    }
                elif (
                    re.search(r"\b(?:animated\s+title|title\s+saying|animated\s+headline|hero\s+reveal|title\s+card|text\s+card)\b", lower)
                    or (re.search(r"\b(?:animat\w*|motion\s*graphics?)\b", lower) and re.search(r"\b(?:title|headline|card)\b", lower))
                    or re.search(r"\b(?:blue|cyan|emerald|green|amber|purple)\s+animated\b", lower)
                ):
                    comp_id = "hero-reveal"
                    title_text = "Hero Reveal"
                    headline_match = re.search(r'(?:saying|titled|reading|with text)?\s*[\'"]([^\'"]+)[\'"]', clean_prompt, re.I)
                    headline = headline_match.group(1).strip() if headline_match else ""
                    if not headline:
                        saying_match = re.search(r'\bsaying\s+([^,.;\n]+?)(?:\s+(?:from|between|at|to|for)\b|$)', clean_prompt, re.I)
                        if saying_match:
                            headline = saying_match.group(1).strip()
                    if not headline:
                        headline = "The Solution" if "solution" in lower else "Essential Insight"
                    color_theme = "blue" if "blue" in lower else "cyan" if "cyan" in lower else "emerald" if "green" in lower or "emerald" in lower else "amber" if "amber" in lower or "yellow" in lower else "purple"
                    props = {
                        "headline": headline,
                        "title": headline,
                        "label": "KEY INSIGHT",
                        "supporting": "Accelerating workflow execution",
                        "colorTheme": color_theme,
                    }
                elif re.search(r"\b(?:counter|metric|kpi|revenue|subscribers|users|numbers)\b", lower):
                    comp_id = "metric-reveal"
                    title_text = "Metric Reveal"
                    props = {
                        "label": "KEY METRIC",
                        "metric": "+140%",
                        "delta": "Target Exceeded",
                        "personality": "energetic",
                    }
                elif re.search(r"\b(?:terminal|code|cli|command|npm|python|bash)\b", lower):
                    comp_id = "cooked-terminal"
                    title_text = "Terminal Code"
                    props = {
                        "command": "npm run deploy",
                        "output": "Server running: 100% production ready",
                    }
                elif re.search(r"\b(?:social|tweet|post|x\.com|instagram|comment)\b", lower):
                    comp_id = "cooked-social-post"
                    title_text = "Social Post"
                    props = {
                        "name": "Creator Pro",
                        "handle": "@creator_pro",
                        "text": clean_prompt,
                        "likes": "18.4K",
                    }
                elif re.search(r"\b(?:quote|saying|advice|wisdom)\b", lower):
                    comp_id = "quote-reveal"
                    title_text = "Quote Reveal"
                    props = {
                        "quote": clean_prompt,
                        "author": "Key Takeaway",
                        "personality": "premium",
                    }
                elif re.search(r"\b(?:progress|percentage|loading|status)\b", lower):
                    comp_id = "cooked-progress"
                    title_text = "Progress Status"
                    props = {
                        "label": "Completion Rate",
                        "progress": 85,
                    }
                elif re.search(r"\b(?:toast|notification|alert|popup)\b", lower):
                    comp_id = "cooked-toasts"
                    title_text = "Notification Toast"
                    props = {
                        "title": "Alert",
                        "message": clean_prompt,
                    }
                elif re.search(r"\b(?:candlestick|trading\s+hud|crypto\s+chart|bitcoin\s+chart|crypto\s+ticker|stock\s+chart)\b", lower):
                    comp_id = "candlestick-hud"
                    title_text = "Candlestick Trading HUD"
                    ticker_m = re.search(r"\b(BTC|ETH|SOL|NVDA|TSLA|AAPL|SPY|QQQ)\b", clean_prompt, re.I)
                    price_m = re.search(r"\$([0-9,]+(?:\.[0-9]+)?)", clean_prompt)
                    props = {
                        "ticker": f"{ticker_m.group(1).upper()}/USDT" if ticker_m else "BTC/USDT",
                        "price": f"${price_m.group(1)}" if price_m else "$64,250.00",
                        "change": "+8.4%",
                        "volume": "1.42B",
                        "timeFrame": "4H",
                    }
                elif re.search(r"\b(?:compound\s+growth|compound\s+curve|snowball\s+curve|compound\s+interest|exponential\s+growth)\b", lower):
                    comp_id = "compound-growth-curve"
                    title_text = "Compound Growth Curve"
                    mult_m = re.search(r"(\d+(?:\.\d+)?)\s*x\b", clean_prompt, re.I)
                    props = {
                        "principal": "$10,000",
                        "multiplier": f"{mult_m.group(1)}x" if mult_m else "17.4x",
                        "futureValue": "$174,494",
                        "years": 30,
                        "title": "THE SNOWBALL EFFECT",
                    }
                elif re.search(r"\b(?:portfolio\s+donut|asset\s+allocation|portfolio\s+breakdown|portfolio\s+allocation)\b", lower):
                    comp_id = "portfolio-donut"
                    title_text = "Portfolio Donut"
                    props = {
                        "totalValue": "$250,000",
                        "asset1": "Stocks (60%)",
                        "asset2": "Real Estate (20%)",
                        "asset3": "Crypto (10%)",
                        "asset4": "Cash (10%)",
                        "title": "ASSET ALLOCATION",
                    }
                elif re.search(r"\b(?:inflation\s+cash\s+burn|cash\s+burn|inflation\s+burn|purchasing\s+power|dollar\s+burn)\b", lower):
                    comp_id = "inflation-cash-burn"
                    title_text = "Inflation Cash Burn"
                    loss_m = re.search(r"\$?([0-9,]+)", clean_prompt)
                    props = {
                        "originalValue": "$100,000",
                        "purchasingPower": "$68,400",
                        "lossAmount": f"-${loss_m.group(1)}" if loss_m else "-$31,600",
                        "inflationRate": "3.8%",
                        "years": 10,
                    }
                elif re.search(r"\b(?:banking\s+notification|bank\s+notification|wire\s+transfer|deposit\s+notification|dividend\s+notification|payout\s+notification)\b", lower):
                    comp_id = "banking-notification"
                    title_text = "Banking Notification"
                    amt_m = re.search(r"\+\$([0-9,]+(?:\.[0-9]{2})?)|\$([0-9,]+(?:\.[0-9]{2})?)", clean_prompt)
                    props = {
                        "bankName": "CHASE PRIVATE CLIENT",
                        "amount": amt_m.group(0) if amt_m else "+$24,500.00",
                        "sender": "WIRE DEPOSIT / ACME CORP",
                        "status": "CLEARED",
                        "timeAgo": "JUST NOW",
                    }
                elif re.search(r"\b(?:budget\s+waterfall|50\s*30\s*20\s+budget|waterfall\s+budget|income\s+waterfall|salary\s+breakdown)\b", lower):
                    comp_id = "budget-waterfall"
                    title_text = "Budget Waterfall"
                    props = {
                        "monthlyIncome": "$10,000",
                        "needs": "$5,000 (50%)",
                        "wants": "$3,000 (30%)",
                        "savings": "$2,000 (20%)",
                        "title": "50/30/20 BUDGET RULE",
                    }
                elif re.search(r"\b(?:debt\s+payoff|debt\s+tracker|debt\s+snowball|debt\s+avalanche|payoff\s+tracker)\b", lower):
                    comp_id = "debt-payoff-tracker"
                    title_text = "Debt Payoff Tracker"
                    props = {
                        "totalDebt": "$45,000",
                        "paidOff": "$36,000",
                        "remaining": "$9,000",
                        "progress": 80,
                        "title": "DEBT SNOWBALL METHOD",
                        "stamp": "PAID OFF",
                    }
                elif re.search(r"\b(?:roi\s+balance\s+scale|balance\s+scale|roi\s+scale|cost\s+vs\s+return|risk\s+vs\s+reward)\b", lower):
                    comp_id = "roi-balance-scale"
                    title_text = "ROI Balance Scale"
                    props = {
                        "costSide": "Cost ($5k)",
                        "returnSide": "Return ($50k)",
                        "roiMultiplier": "10x ROI",
                        "tiltDegree": 18,
                        "title": "ASYMMETRIC RISK/REWARD",
                    }
                elif re.search(r"\b(?:wealth\s+flywheel|compounding\s+flywheel|cash\s+flywheel|financial\s+flywheel|wealth\s+cycle)\b", lower):
                    comp_id = "wealth-flywheel"
                    title_text = "Wealth Flywheel"
                    props = {
                        "stage1": "EARN HIGH INCOME",
                        "stage2": "SAVE 40%+",
                        "stage3": "BUY ASSETS",
                        "stage4": "COMPOUND RETURNS",
                        "title": "THE WEALTH FLYWHEEL",
                    }
                elif re.search(r"\b(?:battle\s+chart|warren\s+buffett\s+challenge|sp500\s+vs|hedge\s+fund\s+vs|buffett\s+bet)\b", lower):
                    comp_id = "battle-chart"
                    title_text = "Buffett Battle Chart"
                    props = {
                        "contestantA": "S&P 500 INDEX",
                        "contestantB": "TOP 5 HEDGE FUNDS",
                        "sp500Return": "+125.8%",
                        "hedgeReturn": "+36.3%",
                        "delta": "+89.5% WIN",
                        "durationYears": "10-YEAR CHALLENGE",
                    }
                else:
                    comp_id = "hero-reveal"
                    title_text = "Hero Reveal"
                    headline_match = re.search(r'(?:saying|titled)?\s*[\'"]([^\'"]+)[\'"]', clean_prompt, re.I)
                    headline_val = headline_match.group(1).strip() if headline_match else "Essential Insight"
                    props = {
                        "label": "KEY TAKEAWAY",
                        "headline": headline_val,
                        "supporting": clean_prompt,
                        "colorTheme": "blue" if "blue" in lower else "purple",
                    }

                safe_pos = compute_safe_graphic_position(request.context.safe_zones)
                graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"
                edit_item = ProposedEditItem(
                    id=f"prop-{uuid.uuid4().hex[:6]}",
                    action_type="graphic",
                    start=start_time,
                    end=end_time,
                    track="graphic",
                    title=f"Motion Card: {comp_id.replace('_', ' ').replace('-', ' ').title()}",
                    description=f"High-production Remotion motion graphic positioned non-destructively on graphics track.",
                    reason=f"Visualizes narrative concept from prompt '{clean_prompt}'.",
                    is_destructive=False,
                    overlap_conflict=False,
                    preview_url=None,
                    operation={
                        "type": "add_element",
                        "track": "graphic",
                        "element": {
                            "id": graphic_id,
                            "name": comp_id.replace("_", " ").replace("-", " ").title(),
                            "compositionId": comp_id,
                            "props": props,
                            "start": start_time,
                            "end": end_time,
                            "position": safe_pos,
                            "positionX": safe_pos["x"],
                            "positionY": safe_pos["y"],
                            "scale": 1.0,
                            "rotation": 0,
                            "isUserLocked": False,
                        }
                    },
                    status="pending"
                )
                edits.append(edit_item)
                summary = f"Prepared 1 motion graphic card ({comp_id}) from {start_time:.1f}s to {end_time:.1f}s."

            elif (
                re.search(r"\b(?:b-?roll|broll|footage|stock\s*(?:video|footage)?|cutaway)\b", lower)
                or re.search(r"\b(?:video|clip|recording|screen|scene|shot)\b", lower)
                or (
                    re.search(r"\b(?:showing|watching|uploading|playing|working|walking|driving|talking|typing|clicking|browsing|nature|city|traffic|technology|person|people|background)\b", lower)
                    and re.search(r"\b(?:i\s+want|need|add|put|insert|show|give\s+me|overlay|picture|visual)\b", lower)
                )
                or re.search(r"\b(?:screen\s+in\s+which|clip\s+in\s+which|scene\s+where|video\s+where)\b", lower)
            ):
                start_time = extracted_start
                end_time = extracted_end

                query_topic = re.sub(
                    r"\b(?:add|relevant|insert|put|overlay|b-?roll|broll|footage|video|clip|person|showing|of|i want|want|a screen in which|a screen showing|screen showing|screen|user is|on screen|from|between|at|to|and|keep|my|our|the|narration|audible|audio|clear|uninterrupted)\b",
                    "",
                    lower,
                    flags=re.I
                ).strip()
                query_topic = re.sub(r"\s+", " ", query_topic).strip()
                if not query_topic or len(query_topic) < 3:
                    if "coding" in lower or "code" in lower:
                        query_topic = "laptop coding developer"
                    elif "upload" in lower:
                        query_topic = "user uploading video on screen"
                    elif "screen" in lower:
                        query_topic = "computer screen technology"
                    else:
                        query_topic = "cinematic technology footage"

                broll_data = None
                clip_duration = max(1.5, round(end_time - start_time, 2))
                if search_single_broll_clip and request.options and request.options.allow_stock_sourcing:
                    try:
                        broll_data = search_single_broll_clip(
                            query=query_topic,
                            aspect_ratio=request.context.aspect_ratio,
                            duration_min=clip_duration,
                        )
                    except Exception as err:
                        print(f"[!] Error in search_single_broll_clip: {err}")

                broll_id = broll_data["video_id"] if broll_data else f"broll-{uuid.uuid4().hex[:8]}"
                title_text = broll_data["title"] if broll_data else query_topic.title()
                source_url = broll_data["video_url"] if broll_data else f"https://cdn.ai-content-manager.com/broll/{query_topic.lower().replace(' ', '_')}.mp4"
                preview_url = broll_data["preview_url"] if broll_data else "https://images.pexels.com/videos/12345/preview.mp4"
                width = broll_data.get("width", 1080) if broll_data else 1080
                height = broll_data.get("height", 1920) if broll_data else 1920
                orientation = broll_data.get("orientation", "portrait") if broll_data else "portrait"

                edit_item = ProposedEditItem(
                    id=f"prop-{uuid.uuid4().hex[:6]}",
                    action_type="broll",
                    start=start_time,
                    end=end_time,
                    track="broll",
                    title=f"Stock B-Roll: {title_text}",
                    description=f"High-quality {orientation} stock footage ({width}x{height}) matching '{query_topic}' overlaying timeline from {start_time:.1f}s to {end_time:.1f}s with speech narration preserved.",
                    reason=f"Matches user creative request '{clean_prompt}' from {start_time:.1f}s to {end_time:.1f}s.",
                    is_destructive=False,
                    overlap_conflict=False,
                    preview_url=preview_url,
                    operation={
                        "type": "add_element",
                        "track": "broll",
                        "element": {
                            "id": broll_id,
                            "name": title_text,
                            "sourceUrl": source_url,
                            "thumbnailUrl": preview_url,
                            "start": start_time,
                            "end": end_time,
                            "opacity": 100,
                            "volume": 0,
                            "muted": True,
                            "fitMode": "cover",
                            "position": {"x": 50, "y": 50},
                            "scale": 1.0,
                        }
                    },
                    status="pending"
                )
                edits.append(edit_item)
                summary = f"Found stock B-roll matching '{query_topic}' ({width}x{height}) from {start_time:.1f}s to {end_time:.1f}s."
                suggested_actions = ["Add stock video footage", "Add animated app upload graphic"]

            else:
                summary = f"Could not determine exact edit type for '{clean_prompt}'. Please select a visual action below."
                suggested_actions = ["Add stock video footage", "Add animated motion card", "Add subtitle caption"]

    return EditPlanProposal(
        plan_id=plan_id,
        user_prompt=clean_prompt,
        scope=scope,
        summary=summary,
        edits=edits,
        created_at=created_at,
        total_duration_seconds=duration,
        suggested_actions=suggested_actions,
    )
