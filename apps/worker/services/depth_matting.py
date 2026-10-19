"""
Studio Depth Matting (Subject Rotoscoping / RVM).

Enables motion graphics, terminal cards, social posts, and diagrams to sit
realistically in 3D space *behind* the speaker's shoulders and head.

Architecture:
1. Target Range Isolation:
   Only matting the exact frame spans where behind cards are active (+ 0.5s handles),
   preventing expensive full-video processing.
2. Robust Video Matting (RVM - mobilenetv3):
   Recurrent neural network tracking human foreground while preserving hair strands,
   spectacles, and motion blur without edge flickering.
3. Temporal Median Filtering & Edge Refinement:
   - Median filter across t-2..t+2 locks stationary edge pixels.
   - Background unmixing removes wall color bleed from hair strands.
   - Soft alpha firming keeps skin soft and hair crisp.
4. Output Generation:
   Emits transparent ProRes 4444 .mov (or PNG image sequences) ready for direct FFmpeg
   sandwich compositing: [Base Plate] -> [Motion Card] -> [Speaker Cutout].
"""

import os
import sys
import time
import shutil
import urllib.request
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Model configuration
DEFAULT_MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx"
DEFAULT_CACHE_DIR = Path(os.environ.get("AI_CONTENT_MANAGER_CACHE", Path.home() / ".cache" / "ai-content-manager"))
MODEL_DIR = DEFAULT_CACHE_DIR / "models"
DEFAULT_MODEL_PATH = MODEL_DIR / "rvm_mobilenetv3_fp32.onnx"

# Tuned matting parameters
HANDLE_S = 0.5        # Padding handles before/after each behind card
WARM_S = 1.0          # Recurrent warm-up period so RVM hidden states settle
RATIO = 0.25          # Downsample ratio (0.25 is RVM's recommended sweet spot for people)
STILL_THRESH = 6.0    # Mean RGB diff under which a pixel is deemed stationary
RADIUS = 2            # Temporal stabilization window: t-2 .. t+2
LO, HI, SOFT_LO = 0.25, 0.90, 0.04    # Alpha firming thresholds
FLAT_LO, FLAT_HI = 18.0, 40.0         # Wall RMS error bounds for color unmixing


def _log(tag: str, msg: str):
    print(f"  [DEPTH_MATTE:{tag}] {msg}", flush=True)


def get_model_path() -> Path:
    """Return the absolute path to the RVM ONNX model."""
    env_path = os.environ.get("RVM_MODEL_PATH")
    if env_path:
        return Path(env_path).resolve()
    return DEFAULT_MODEL_PATH


def is_depth_matting_available() -> bool:
    """Check if onnxruntime, cv2, numpy, and the RVM model are available."""
    try:
        import onnxruntime
        import cv2
        import numpy
        m_path = get_model_path()
        return m_path.exists() and m_path.stat().st_size > 10 * 1024 * 1024
    except Exception:
        return False


def ensure_model_downloaded(target_path: Optional[Path] = None, timeout: int = 180) -> Path:
    """
    Ensure the RVM mobilenetv3 ONNX model is downloaded and cached.
    Downloads from GitHub releases if missing or incomplete.
    """
    out_path = Path(target_path) if target_path else get_model_path()
    if out_path.exists() and out_path.stat().st_size > 10 * 1024 * 1024:
        return out_path

    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = out_path.with_suffix(".tmp.onnx")

    _log("DOWNLOAD", f"Downloading RVM model to {out_path}...")
    headers = {"User-Agent": "AiContentManager-DepthMatting/1.0"}
    req = urllib.request.Request(DEFAULT_MODEL_URL, headers=headers)

    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as response, open(tmp_path, "wb") as f:
        shutil.copyfileobj(response, f)

    if tmp_path.stat().st_size < 10 * 1024 * 1024:
        if tmp_path.exists():
            tmp_path.unlink()
        raise RuntimeError("Downloaded RVM model is smaller than 10MB; download failed or corrupted.")

    os.replace(tmp_path, out_path)
    _log("DOWNLOAD", f"Downloaded RVM model ({out_path.stat().st_size / (1024*1024):.1f} MB) in {time.time() - t0:.1f}s")
    return out_path


def extract_behind_ranges(
    edits: List[Dict[str, Any]],
    timestamp_map: Optional[Dict[str, Any]] = None,
    total_duration: float = 0.0,
    fps: float = 30.0,
    handle_s: float = HANDLE_S,
) -> List[Dict[str, Any]]:
    """
    Identify and merge all time ranges that require subject rotoscoping / cutout.

    Matches edits with:
    - layer == "behind"
    - depth == "behind"
    - or layout variant == "cutout"
    """
    spans: List[Tuple[float, float, str]] = []
    ts_map = timestamp_map or {}

    for edit in edits:
        layer = str(edit.get("layer", "")).lower()
        depth = str(edit.get("depth", "")).lower()
        is_behind = (layer == "behind") or (depth == "behind") or (edit.get("layout", {}).get("variant") == "cutout")

        if not is_behind:
            continue

        edit_id = str(edit.get("_edit_id") or edit.get("trigger_id") or "")
        start_s: Optional[float] = None
        end_s: Optional[float] = None

        tid = edit.get("trigger_id")
        if tid and tid in ts_map:
            start_s = float(ts_map[tid].get("start", 0.0))
            end_s = float(ts_map[tid].get("end", total_duration))
        elif edit.get("start") is not None and edit.get("end") is not None:
            try:
                start_s = float(edit["start"])
                end_s = float(edit["end"])
            except (ValueError, TypeError):
                pass

        if start_s is None or end_s is None:
            continue

        # Add handles and clamp to video duration
        pad_start = max(0.0, start_s - handle_s)
        pad_end = min(total_duration, end_s + handle_s) if total_duration > 0 else (end_s + handle_s)

        if pad_end > pad_start:
            spans.append((pad_start, pad_end, edit_id))

    if not spans:
        return []

    # Sort spans chronologically
    spans.sort(key=lambda s: s[0])

    # Merge overlapping or contiguous ranges
    merged: List[Dict[str, Any]] = []
    for s_start, s_end, eid in spans:
        if not merged:
            merged.append({
                "start": s_start,
                "end": s_end,
                "start_frame": max(0, int(round(s_start * fps))),
                "end_frame": max(0, int(round(s_end * fps))),
                "edit_ids": [eid] if eid else [],
            })
        else:
            prev = merged[-1]
            if s_start <= prev["end"] + 0.05:  # Overlapping or adjacent
                prev["end"] = max(prev["end"], s_end)
                prev["end_frame"] = max(prev["end_frame"], int(round(prev["end"] * fps)))
                if eid and eid not in prev["edit_ids"]:
                    prev["edit_ids"].append(eid)
            else:
                merged.append({
                    "start": s_start,
                    "end": s_end,
                    "start_frame": max(0, int(round(s_start * fps))),
                    "end_frame": max(0, int(round(s_end * fps))),
                    "edit_ids": [eid] if eid else [],
                })

    return merged


# ---------------------------------------------------------------------------
# Core Image Processing & Matting Algorithms
# ---------------------------------------------------------------------------

def _fill(img, mask, cv2, np):
    """
    Smooth background inpainting for edge color unmixing:
    Normalised Gaussian blur at widening radii at 1/4 resolution.
    """
    h, w = mask.shape
    sh, sw = max(1, h // 4), max(1, w // 4)
    s_img = cv2.resize(img * mask[..., None], (sw, sh), interpolation=cv2.INTER_AREA).reshape(sh, sw, -1)
    s_m = cv2.resize(mask, (sw, sh), interpolation=cv2.INTER_AREA)
    out = np.zeros_like(s_img)
    done = np.zeros(s_m.shape, bool)

    for k in (2, 6, 15):
        num = cv2.GaussianBlur(s_img, (0, 0), k).reshape(s_img.shape)
        den = cv2.GaussianBlur(s_m, (0, 0), k)
        sel = (den > 1e-3) & ~done
        out[sel] = num[sel] / den[sel][:, None]
        done |= sel

    return cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR).reshape(h, w, -1)


def refine_matte_edge(cam_rgb, alpha, cv2, np) -> Tuple[Any, Any]:
    """
    Refine alpha matte boundary:
    1. Unmixes wall color bleed from hair strands: F = (C - (1-a)B) / a.
    2. Firms alpha on dark hair strands while keeping skin soft.
    Returns:
        (rgb_float32, alpha_float32)
    """
    c = cam_rgb.astype(np.float32)
    k3 = np.ones((3, 3), np.uint8)
    k5 = np.ones((5, 5), np.uint8)

    solid = cv2.erode((alpha >= 0.95).astype(np.float32), k5)
    ext = _fill(c, solid, cv2, np)          # Nearest solid foreground color

    bg = cv2.erode((alpha < 0.02).astype(np.float32), k5)
    B = _fill(c, bg, cv2, np)               # Wall plate behind edge

    # Measure wall texture error
    sd = np.sqrt(np.maximum(_fill(((c - B) ** 2).sum(2, keepdims=True), bg, cv2, np)[..., 0], 0))
    flat = 1.0 - np.clip((sd - FLAT_LO) / max(1e-5, FLAT_HI - FLAT_LO), 0.0, 1.0)

    A = np.maximum(alpha, 0.15)[..., None]
    F = np.clip((c - (1.0 - A) * B) / A, 0.0, 255.0)

    wt = (np.clip((alpha - 0.15) / 0.35, 0.0, 1.0) * flat)[..., None]
    keep = np.clip((alpha - 0.90) / 0.10, 0.0, 1.0)[..., None]

    rgb = c * keep + (F * wt + ext * (1.0 - wt)) * (1.0 - keep)

    ae = cv2.erode(alpha, k3)
    hard = np.clip((ae - LO) / (HI - LO), 0.0, 1.0)
    hard = hard * hard * (3.0 - 2.0 * hard)
    soft = np.clip((ae - SOFT_LO) / (HI - SOFT_LO), 0.0, 1.0)

    # 0 = dark hair, 1 = skin
    skin = np.clip((ext @ np.array([0.299, 0.587, 0.114], np.float32) - 60.0) / 50.0, 0.0, 1.0)
    final_alpha = hard * (1.0 - skin) + np.maximum(hard, soft) * skin

    return rgb, final_alpha


def stabilise_temporal_alpha(window_cams, window_alphas, center_idx: int, cv2, np) -> Any:
    """
    Temporal median filter over sliding window:
    Still pixels lock to the median alpha across frames, eliminating boundary shimmer.
    Moving pixels retain their own alpha so natural movement never lags.
    """
    st = np.stack(window_alphas)
    edge = ((st > 0.01) & (st < 0.99)).any(0)
    edge = cv2.dilate(edge.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)

    ys, xs = np.nonzero(edge)
    if len(ys) == 0:
        return window_alphas[center_idx].copy()

    c0 = window_cams[center_idx][ys, xs].astype(np.int16)
    still = np.ones(len(ys), bool)

    for j, c in enumerate(window_cams):
        if j != center_idx:
            still &= np.abs(c[ys, xs].astype(np.int16) - c0).mean(1) < STILL_THRESH

    # Guard pixels adjacent to moving edges
    moving = np.zeros(edge.shape, np.uint8)
    moving[ys[~still], xs[~still]] = 1
    still &= ~cv2.dilate(moving, np.ones((5, 5), np.uint8)).astype(bool)[ys, xs]

    out = window_alphas[center_idx].copy()
    out[ys, xs] = np.where(still, np.median(st[:, ys, xs], 0), out[ys, xs])
    return out


# ---------------------------------------------------------------------------
# Video Matting Execution Engine
# ---------------------------------------------------------------------------

def cut_range_to_prores(
    video_path: str,
    start_s: float,
    end_s: float,
    output_mov_path: str,
    fps: float = 30.0,
    width: Optional[int] = None,
    height: Optional[int] = None,
    model_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Renders an alpha-matted ProRes 4444 .mov cut of the speaker for [start_s, end_s].
    Direct drop-in for FFmpeg overlay filter.
    """
    import cv2
    import numpy as np
    import onnxruntime as ort

    m_path = str(ensure_model_downloaded(Path(model_path) if model_path else None))
    dur = max(0.05, end_s - start_s)
    warm = min(start_s, WARM_S)
    decode_start = max(0.0, start_s - warm)
    total_decode_dur = dur + warm
    expected_frames = int(round(dur * fps))
    warm_frames = int(round(warm * fps))

    # Determine resolution if not provided
    if not width or not height:
        cap = cv2.VideoCapture(str(video_path))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1080)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1920)
        cap.release()

    Path(output_mov_path).parent.mkdir(parents=True, exist_ok=True)

    # 1. FFmpeg input pipe: decode camera take to raw RGB24
    vf_scale = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
    dec_cmd = [
        "ffmpeg", "-v", "error",
        "-ss", f"{decode_start:.6f}",
        "-t", f"{total_decode_dur + 0.1:.6f}",
        "-i", str(video_path),
        "-vf", vf_scale,
        "-r", str(fps),
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-"
    ]
    dec_proc = subprocess.Popen(dec_cmd, stdout=subprocess.PIPE)

    # 2. FFmpeg output pipe: encode RGBA raw frames to ProRes 4444 (yuva444p10le)
    enc_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "rawvideo",
        "-pix_fmt", "rgba",
        "-s", f"{width}x{height}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "prores_ks",
        "-profile:v", "4444",
        "-pix_fmt", "yuva444p10le",
        "-an",
        str(output_mov_path)
    ]
    enc_proc = subprocess.Popen(enc_cmd, stdin=subprocess.PIPE)

    # Initialize ONNX inference session
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if "CUDAExecutionProvider" in ort.get_available_providers() else ["CPUExecutionProvider"]
    sess = ort.InferenceSession(m_path, providers=providers)

    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    ratio = np.array([RATIO], np.float32)

    win_c: List[Any] = []
    win_a: List[Any] = []
    t0 = time.time()
    frames_in, frames_written = 0, 0
    frame_size = width * height * 3

    def emit_frame(idx: int):
        nonlocal frames_written
        al = stabilise_temporal_alpha(win_c, win_a, idx, cv2, np)
        rgb, al = refine_matte_edge(win_c[idx], al, cv2, np)
        rgba = np.concatenate([np.clip(rgb, 0, 255), al[..., None] * 255], 2).round().astype(np.uint8)
        # Clear color on fully transparent pixels to optimize compression
        rgba[rgba[..., 3] == 0] = 0
        enc_proc.stdin.write(rgba.tobytes())
        frames_written += 1

    try:
        while True:
            buf = dec_proc.stdout.read(frame_size)
            if len(buf) < frame_size:
                break

            cam = np.frombuffer(buf, np.uint8).reshape(height, width, 3)
            # RVM inference
            src_norm = (cam.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
            _, pha, *rec = sess.run(
                None,
                {
                    "src": src_norm,
                    "r1i": rec[0],
                    "r2i": rec[1],
                    "r3i": rec[2],
                    "r4i": rec[3],
                    "downsample_ratio": ratio,
                }
            )
            frames_in += 1

            if frames_in <= warm_frames - RADIUS:
                continue  # Recurrent warm-up period only

            win_c.append(cam)
            win_a.append(pha[0, 0])

            if frames_in == warm_frames + 1:
                # Pad window head
                while len(win_c) < RADIUS + 1:
                    win_c.insert(0, cam)
                    win_a.insert(0, pha[0, 0])

            if len(win_c) == 2 * RADIUS + 1:
                emit_frame(RADIUS)
                win_c.pop(0)
                win_a.pop(0)

        # Emit remaining buffered frames
        while win_c and frames_written < expected_frames:
            win_c.append(win_c[-1])
            win_a.append(win_a[-1])
            emit_frame(RADIUS)
            win_c.pop(0)
            win_a.pop(0)

    finally:
        if dec_proc.stdout:
            dec_proc.stdout.close()
        dec_proc.wait()
        if enc_proc.stdin:
            enc_proc.stdin.close()
        enc_proc.wait()

    wall_s = time.time() - t0
    _log("RENDER", f"Matted {frames_written} frames in {wall_s:.1f}s ({frames_written / max(0.1, wall_s):.1f} fps) -> {output_mov_path}")
    return {
        "frames": frames_written,
        "wall_s": round(wall_s, 2),
        "fps": round(frames_written / max(0.1, wall_s), 1),
        "output_path": str(output_mov_path),
    }


def cut_range_to_png_sequence(
    video_path: str,
    start_s: float,
    end_s: float,
    output_dir: str,
    fps: float = 30.0,
    width: Optional[int] = None,
    height: Optional[int] = None,
    model_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Renders an alpha-matted PNG sequence {frame:06d}.png of the speaker for [start_s, end_s].
    Compatible with Remotion and web image sequence loaders.
    """
    import cv2
    import numpy as np
    import onnxruntime as ort

    m_path = str(ensure_model_downloaded(Path(model_path) if model_path else None))
    dur = max(0.05, end_s - start_s)
    warm = min(start_s, WARM_S)
    decode_start = max(0.0, start_s - warm)
    total_decode_dur = dur + warm
    expected_frames = int(round(dur * fps))
    warm_frames = int(round(warm * fps))
    start_frame_idx = int(round(start_s * fps))

    if not width or not height:
        cap = cv2.VideoCapture(str(video_path))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1080)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1920)
        cap.release()

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    vf_scale = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
    dec_cmd = [
        "ffmpeg", "-v", "error",
        "-ss", f"{decode_start:.6f}",
        "-t", f"{total_decode_dur + 0.1:.6f}",
        "-i", str(video_path),
        "-vf", vf_scale,
        "-r", str(fps),
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-"
    ]
    dec_proc = subprocess.Popen(dec_cmd, stdout=subprocess.PIPE)

    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if "CUDAExecutionProvider" in ort.get_available_providers() else ["CPUExecutionProvider"]
    sess = ort.InferenceSession(m_path, providers=providers)

    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    ratio = np.array([RATIO], np.float32)

    win_c: List[Any] = []
    win_a: List[Any] = []
    t0 = time.time()
    frames_in, frames_written = 0, 0
    frame_size = width * height * 3

    def emit_png(idx: int):
        nonlocal frames_written
        al = stabilise_temporal_alpha(win_c, win_a, idx, cv2, np)
        rgb, al = refine_matte_edge(win_c[idx], al, cv2, np)
        rgba = np.concatenate([np.clip(rgb, 0, 255), al[..., None] * 255], 2).round().astype(np.uint8)
        rgba[rgba[..., 3] == 0] = 0

        frame_no = start_frame_idx + frames_written
        tmp = out / f"{frame_no:06d}.tmp.png"
        target = out / f"{frame_no:06d}.png"
        cv2.imwrite(str(tmp), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_PNG_COMPRESSION, 3])
        os.replace(tmp, target)
        frames_written += 1

    try:
        while True:
            buf = dec_proc.stdout.read(frame_size)
            if len(buf) < frame_size:
                break

            cam = np.frombuffer(buf, np.uint8).reshape(height, width, 3)
            src_norm = (cam.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
            _, pha, *rec = sess.run(
                None,
                {
                    "src": src_norm,
                    "r1i": rec[0],
                    "r2i": rec[1],
                    "r3i": rec[2],
                    "r4i": rec[3],
                    "downsample_ratio": ratio,
                }
            )
            frames_in += 1

            if frames_in <= warm_frames - RADIUS:
                continue

            win_c.append(cam)
            win_a.append(pha[0, 0])

            if frames_in == warm_frames + 1:
                while len(win_c) < RADIUS + 1:
                    win_c.insert(0, cam)
                    win_a.insert(0, pha[0, 0])

            if len(win_c) == 2 * RADIUS + 1:
                emit_png(RADIUS)
                win_c.pop(0)
                win_a.pop(0)

        while win_c and frames_written < expected_frames:
            win_c.append(win_c[-1])
            win_a.append(win_a[-1])
            emit_png(RADIUS)
            win_c.pop(0)
            win_a.pop(0)

    finally:
        if dec_proc.stdout:
            dec_proc.stdout.close()
        dec_proc.wait()

    wall_s = time.time() - t0
    return {
        "frames": frames_written,
        "wall_s": round(wall_s, 2),
        "fps": round(frames_written / max(0.1, wall_s), 1),
        "output_path": str(output_dir),
    }
