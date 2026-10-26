
import os
import shutil
import subprocess
import tempfile
import json
import sys
import math
import hashlib
import uuid
import time
from typing import Any, Dict, List, Optional, Tuple
from services.media_extractor import get_ffmpeg_binary_path
from services.editing_config import EDITING_CONFIG
from services.sfx_manager import fetch_sfx



# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log(tag: str, msg: str):
    """Loud, always-visible compositor log line."""
    print(f"  [COMPOSITOR:{tag}] {msg}", flush=True)


def prepare_ffmpeg_command(cmd: List[str], threads: int = 2) -> List[str]:
    """
    Normalizes and positions FFmpeg options correctly:
    1. Global options (e.g. -hide_banner) are placed immediately after the ffmpeg binary.
    2. Encoder options (e.g. -threads <N>) are placed in the output options section
       preceding the destination output file, ensuring the encoder AVCodecContext
       actually constrains worker CPU threads rather than misapplying to input decoders.
    """
    final_cmd = list(cmd)
    if not final_cmd:
        return final_cmd

    # Insert global options after binary
    if "-hide_banner" not in final_cmd:
        final_cmd.insert(1, "-hide_banner")

    # If threads is already explicitly specified anywhere, do not duplicate
    has_threads = any(arg == "-threads" or arg.startswith("-threads:") for arg in final_cmd)
    if not has_threads and len(final_cmd) >= 2:
        # Place -threads right before the output target file
        final_cmd.insert(-1, "-threads")
        final_cmd.insert(-1, str(threads))

    return final_cmd


def _run_ffmpeg(cmd: List[str], label: str) -> subprocess.CompletedProcess:
    """Run an FFmpeg command, log it, and raise on failure."""
    final_cmd = prepare_ffmpeg_command(cmd, threads=2)

    _log("CMD", f"({label}) {' '.join(final_cmd[:8])}... ({len(final_cmd)} args)")
    result = subprocess.run(final_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        stderr_text = result.stderr or ""
        log_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".log", mode="w") as f:
                f.write("CMD:\n" + " ".join(final_cmd) + "\n\nSTDERR:\n" + stderr_text)
                log_path = f.name
        except Exception:
            pass

        stderr_preview = stderr_text[-3000:]
        _log("STDERR", f"({label}) Failed! {('Log: ' + log_path) if log_path else ''}\n{stderr_preview}")
        raise RuntimeError(
            f"FFmpeg failed for '{label}' (exit code {result.returncode}).\n{stderr_preview}"
        )

    return result

def _render_canvas_composition(comp_id: str, props: dict, duration_sec: float, fps: float, width: int, height: int, temp_dir: str, prefix: str) -> Optional[str]:
    """Renders motion graphic overlay using Remotion (with HTML Playwright fallback)."""
    out_path = os.path.join(temp_dir, f"{prefix}.mov")

    # 1. Try Remotion (high quality React animations)
    try:
        from services.remotion_renderer import render_remotion_canvas
        remotion_out = render_remotion_canvas(
            comp_id=comp_id,
            props=props,
            duration_sec=duration_sec,
            fps=fps,
            width=width,
            height=height,
            out_path=out_path
        )
        if remotion_out and os.path.exists(remotion_out) and os.path.getsize(remotion_out) > 0:
            _log("REMOTION", f"Successfully rendered Remotion '{comp_id}' -> {remotion_out}")
            return remotion_out
    except Exception as e:
        _log("REMOTION_WARN", f"Remotion failed: {e}. Falling back to HTML renderer...")

    # 2. Fallback to HTML Playwright renderer
    frames = int(duration_sec * fps)
    html_props = {
        "type": comp_id,
        "targets": {k: v for k, v in props.items() if k != "componentId"}
    }
    props_json = json.dumps(html_props)

    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "motion_html/render_html_motion.py"))

    cmd = [
        sys.executable, script_path,
        out_path,
        str(frames),
        str(int(fps)),
        str(width),
        str(height),
        props_json
    ]

    _log("CANVAS", f"Rendering HTML {comp_id} to {out_path} ({frames} frames @ {fps}fps)")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        _log("CANVAS_ERR", result.stderr or result.stdout)
        return None
    return out_path

_HW_CODEC = None

def _get_video_codec(ffmpeg_bin: str) -> str:
    global _HW_CODEC
    if _HW_CODEC is not None:
        return _HW_CODEC

    _HW_CODEC = "libx264"
    try:
        res = subprocess.run([ffmpeg_bin, "-encoders"], capture_output=True, text=True)
        if "h264_nvenc" in res.stdout:
            # Test if nvenc actually works (needs GPU)
            test = subprocess.run(
                [ffmpeg_bin, "-hide_banner", "-y", "-f", "lavfi", "-i", "color=c=black:s=64x64", "-c:v", "h264_nvenc", "-t", "0.1", "-f", "null", "-"],
                capture_output=True
            )
            if test.returncode == 0:
                _HW_CODEC = "h264_nvenc"
        elif "h264_videotoolbox" in res.stdout:
            test = subprocess.run(
                [ffmpeg_bin, "-hide_banner", "-y", "-f", "lavfi", "-i", "color=c=black:s=64x64", "-c:v", "h264_videotoolbox", "-t", "0.1", "-f", "null", "-"],
                capture_output=True
            )
            if test.returncode == 0:
                _HW_CODEC = "h264_videotoolbox"
    except Exception:
        pass

    _log("HW_ACCEL", f"Selected video codec: {_HW_CODEC}")
    return _HW_CODEC

def _get_ffprobe_bin(ffmpeg_bin: str) -> str:
    """Derive the ffprobe binary path from the ffmpeg binary path.

    Resolution order:
    1. Sibling file next to the ffmpeg binary (basename replacement only).
    2. static_ffmpeg package (if installed and binaries pre-fetched).
    3. System PATH lookup.
    4. Bare 'ffprobe' (will fail at call-site, triggering ffmpeg -i fallback).
    """
    # 1. Sibling of the ffmpeg binary
    directory = os.path.dirname(ffmpeg_bin)
    basename = os.path.basename(ffmpeg_bin)
    probe_basename = basename.replace("ffmpeg", "ffprobe")
    candidate = os.path.join(directory, probe_basename) if directory else probe_basename
    if os.path.isfile(candidate):
        return candidate
    # 2. Try static_ffmpeg package
    try:
        import static_ffmpeg.run as _sfr
        _probe_candidate = os.path.join(
            _sfr.get_platform_dir(),
            "ffprobe.exe" if os.name == "nt" else "ffprobe",
        )
        if os.path.isfile(_probe_candidate):
            return _probe_candidate
    except Exception:
        pass
    # 3. System PATH
    system_probe = shutil.which("ffprobe")
    if system_probe:
        return system_probe
    return "ffprobe"


def _probe_duration(ffmpeg_bin: str, filepath: str) -> float:
    """Get duration of a media file in seconds using ffprobe."""
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())
    except Exception:
        # Fallback: try ffmpeg -i and parse duration from stderr
        try:
            result = subprocess.run(
                [ffmpeg_bin, "-i", filepath], capture_output=True, text=True, timeout=10,
            )
            for line in result.stderr.split("\n"):
                if "Duration:" in line:
                    # Format: Duration: 00:00:40.32
                    dur_str = line.split("Duration:")[1].split(",")[0].strip()
                    parts = dur_str.split(":")
                    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            raise RuntimeError(f"Duration not found in ffmpeg fallback output for {filepath}")
        except Exception as e:
            raise RuntimeError(f"Could not probe duration for {filepath}: {e}")


def _probe_streams(ffmpeg_bin: str, filepath: str) -> Dict[str, Any]:
    """
    Probe a media file for stream information.
    Returns dict with 'has_video', 'has_audio', 'video_duration', 'audio_duration'.
    """
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)

    info = {"has_video": False, "has_audio": False, "video_duration": 0.0, "audio_duration": 0.0, "fps": 30.0}

    probe_success = False
    try:
        result = subprocess.run(
            [ffprobe_bin, "-v", "error",
             "-show_entries", "stream=codec_type,duration,r_frame_rate",
             "-of", "json", filepath],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode == 0:
            probe_success = True
            import json
            data = json.loads(result.stdout)
            for stream in data.get("streams", []):
                codec_type = stream.get("codec_type", "")
                dur = float(stream.get("duration", 0) or 0)
                if codec_type == "video":
                    info["has_video"] = True
                    info["video_duration"] = max(info["video_duration"], dur)
                    fps_str = stream.get("r_frame_rate", "30/1")
                    try:
                        num, den = fps_str.split("/")
                        if den != "0":
                            info["fps"] = float(num) / float(den)
                    except Exception:
                        pass
                elif codec_type == "audio":
                    info["has_audio"] = True
                    info["audio_duration"] = max(info["audio_duration"], dur)
    except Exception as e:
        _log("PROBE", f"Stream probe failed: {e}")

    if not probe_success:
        # Fallback to ffmpeg -i parsing since imageio-ffmpeg doesn't bundle ffprobe
        try:
            result = subprocess.run(
                [ffmpeg_bin, "-i", filepath],
                capture_output=True, text=True, timeout=10
            )
            # ffmpeg -i returns exit code 1 when no output file is specified,
            # but outputs stream info to stderr.
            for line in result.stderr.split("\n"):
                if "Stream #" in line and ": Video:" in line:
                    info["has_video"] = True
                    # Try to parse fps
                    if " fps," in line:
                        try:
                            fps_part = line.split(" fps,")[0].split(",")[-1].strip()
                            info["fps"] = float(fps_part)
                        except Exception:
                            pass
                if "Stream #" in line and ": Audio:" in line:
                    info["has_audio"] = True

            if not info["has_video"] and not info["has_audio"]:
                raise RuntimeError(f"No streams detected in fallback ffmpeg probe for {filepath}")
        except Exception as e:
            raise RuntimeError(f"Could not probe streams for {filepath}: {e}")

    # Fallback durations
    if info["has_video"] and info["video_duration"] == 0:
        info["video_duration"] = _probe_duration(ffmpeg_bin, filepath)
    if info["has_audio"] and info["audio_duration"] == 0:
        info["audio_duration"] = _probe_duration(ffmpeg_bin, filepath)

    return info


def _escape_ass_path_for_filter(filepath: str) -> str:
    # Use relative path to avoid spaces from the root path
    import os
    try:
        rel_path = os.path.relpath(filepath, os.getcwd())
        # If it still has spaces, just use basename (assuming it's in the current dir)
        if " " in rel_path:
            return os.path.basename(filepath)
        return rel_path.replace("\\\\", "/")
    except Exception:
        return os.path.basename(filepath)



def _build_segment_timeline(
    edits: List[Dict[str, Any]],
    timestamp_map: Dict[str, Any],
    total_duration: float,
    settings: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Build an ordered timeline of segments from the transcript chunks and edit decisions.
    Each segment has: start, end, chunk_id, actions (list of edit actions for this chunk).
    Segments marked as 'cut' are excluded.

    CANONICAL TIMELINE: All timestamps use the ORIGINAL video timeline (pre-cut).
    The compositor handles the mapping to post-cut positions during rendering.
    """
    # 1. Collect cut intervals and group actions by trigger_id
    cut_intervals = []
    actions_by_chunk: Dict[str, List[Dict[str, Any]]] = {}

    for edit in edits:
        if edit.get("action") == "cut":
            start = edit.get("start")
            end = edit.get("end")
            if start is not None and end is not None and start < end:
                cut_intervals.append((float(start), float(end)))
        else:
            tid = edit.get("trigger_id", "")
            if tid:
                if tid not in actions_by_chunk:
                    actions_by_chunk[tid] = []
                actions_by_chunk[tid].append(edit)

    # Merge overlapping cut intervals
    cut_intervals.sort()
    merged_cuts = []
    if cut_intervals:
        merged_cuts = [cut_intervals[0]]
        for current in cut_intervals[1:]:
            prev = merged_cuts[-1]
            if current[0] <= prev[1]:
                merged_cuts[-1] = (prev[0], max(prev[1], current[1]))
            else:
                merged_cuts.append(current)

    # Determine "kept" intervals by inverting the cuts over [0.0, total_duration]
    kept_intervals = []
    current_time = 0.0
    for cut_start, cut_end in merged_cuts:
        if cut_start > current_time:
            kept_intervals.append((current_time, cut_start))
        current_time = max(current_time, cut_end)
    if current_time < total_duration:
        kept_intervals.append((current_time, total_duration))

    # 2. Build base chronological timeline of non-overlapping chunks
    # Filter out secondary/injected triggers (like beat_*) if transcript chunks (chunk_* or ID_*) exist
    has_transcript_chunks = any(not str(k).startswith("beat_") for k in timestamp_map.keys())
    candidate_items = [
        (cid, cdata) for cid, cdata in timestamp_map.items()
        if not (has_transcript_chunks and str(cid).startswith("beat_"))
    ]
    if not candidate_items:
        candidate_items = list(timestamp_map.items())

    raw_chunks = []
    for chunk_id, chunk_data in candidate_items:
        raw_chunks.append({
            "id": chunk_id,
            "start": float(chunk_data.get("start", 0.0)),
            "end": float(chunk_data.get("end", 0.0)),
            "text": chunk_data.get("text", ""),
        })
    raw_chunks.sort(key=lambda c: c["start"])

    # Ensure strictly non-overlapping, strictly increasing chunks
    chunks = []
    current_end = 0.0
    for c in raw_chunks:
        c_start = max(0.0, c["start"])
        c_end = min(total_duration, c["end"])
        if c_end <= c_start:
            continue
        if c_start < current_end:
            if c_end <= current_end:
                continue
            c_start = current_end
        c["start"] = c_start
        c["end"] = c_end
        chunks.append(c)
        current_end = c_end

    base_timeline = []

    if not chunks:
        _log("WARN", "No transcript chunks found. Using full video as single segment.")
        base_timeline = [{
            "start": 0.0,
            "end": total_duration,
            "chunk_id": "FULL",
            "actions": [],
            "text": "",
        }]
    else:
        last_end = 0.0
        for i, chunk in enumerate(chunks):
            if chunk["start"] > last_end:
                base_timeline.append({
                    "start": last_end,
                    "end": chunk["start"],
                    "chunk_id": f"GAP_{i}",
                    "actions": [],
                    "text": "",
                })
            actions = actions_by_chunk.get(chunk["id"], [])
            base_timeline.append({
                "start": chunk["start"],
                "end": chunk["end"],
                "chunk_id": chunk["id"],
                "actions": actions,
                "text": chunk["text"],
            })
            last_end = chunk["end"]

        if last_end < total_duration:
            base_timeline.append({
                "start": last_end,
                "end": total_duration,
                "chunk_id": "GAP_FINAL",
                "actions": [],
                "text": "",
            })

    # 3. Intersect base timeline with kept intervals
    timeline = []

    # We will generate "kept" segments (is_cut=False) and "cut" segments (is_cut=True)
    # to maintain compatibility with downstream logging and test expectations.

    for seg in base_timeline:
        seg_start = seg["start"]
        seg_end = seg["end"]

        # Find which kept_intervals overlap with this segment
        overlaps = []
        for k_start, k_end in kept_intervals:
            overlap_start = max(seg_start, k_start)
            overlap_end = min(seg_end, k_end)
            if overlap_start < overlap_end:
                overlaps.append((overlap_start, overlap_end))

        if not overlaps:
            # Fully cut
            timeline.append({
                **seg,
                "is_cut": True
            })
        else:
            # We have overlapping kept parts. What about the cut parts in between?
            # To be perfect we could output them, but downstream only looks for is_cut=True.
            # We'll just output the kept sub-segments. If there are cut parts, we output them too.
            current_seg_time = seg_start
            for overlap_start, overlap_end in overlaps:
                if overlap_start > current_seg_time:
                    # There was a cut portion before this kept portion
                    timeline.append({
                        **seg,
                        "start": current_seg_time,
                        "end": overlap_start,
                        "is_cut": True
                    })
                # The kept portion
                timeline.append({
                    **seg,
                    "start": overlap_start,
                    "end": overlap_end,
                    "is_cut": False
                })
                current_seg_time = overlap_end

            # If there's remaining cut portion at the end
            if current_seg_time < seg_end:
                timeline.append({
                    **seg,
                    "start": current_seg_time,
                    "end": seg_end,
                    "is_cut": True
                })

    use_granular = settings.get("USE_GRANULAR_OVERLAYS", False) if settings else False

    if use_granular:
        # Clear legacy actions
        for seg in timeline:
            seg["actions"] = []

        non_cut_edits = [e for e in edits if e.get("action") != "cut"]
        for edit in non_cut_edits:
            e_start = edit.get("start")
            e_end = edit.get("end")

            if e_start is None or e_end is None:
                tid = edit.get("trigger_id")
                if tid and tid in timestamp_map:
                    e_start = timestamp_map[tid].get("start", 0.0)
                    e_end = timestamp_map[tid].get("end", total_duration)
                else:
                    e_start, e_end = 0.0, total_duration

            dur = e_end - e_start

            for seg in timeline:
                if seg.get("is_cut"):
                    continue

                seg_start = seg["start"]
                seg_end = seg["end"]

                # An overlap occurs if the edit starts before the segment ends AND ends after the segment starts.
                if e_start < seg_end and e_end > seg_start:
                    overlap_start = max(seg_start, e_start)
                    overlap_end = min(seg_end, e_end)
                    frag_dur = overlap_end - overlap_start

                    min_frag_dur = settings.get("MIN_FRAGMENT_DURATION", 0.1) if settings else 0.1
                    if frag_dur < min_frag_dur and dur >= min_frag_dur:
                        continue

                    cloned = dict(edit)
                    cloned["original_start"] = e_start
                    cloned["original_end"] = e_end
                    cloned["seg_overlap_start"] = overlap_start
                    cloned["seg_overlap_end"] = overlap_end
                    seg["actions"].append(cloned)

    # Attach segment transitions across cut boundaries if specified in edits
    transition_edits = [
        e for e in edits
        if e.get("action") in ("transition", "add_transition") or e.get("type") == "add_transition"
    ]
    kept_timeline = [s for s in timeline if not s.get("is_cut")]
    for tr in transition_edits:
        tr_preset = tr.get("preset", "crossfade")
        tr_dur = float(tr.get("duration", 0.5) or 0.5)
        tr_start = tr.get("start")
        for i in range(len(kept_timeline) - 1):
            s_curr = kept_timeline[i]
            s_next = kept_timeline[i + 1]
            if tr_start is not None:
                if abs(float(tr_start) - s_curr["end"]) <= 1.0:
                    s_curr["transition_out"] = {"preset": tr_preset, "duration": tr_dur}
                    s_next["transition_in"] = {"preset": tr_preset, "duration": tr_dur}
                    break
            else:
                s_curr["transition_out"] = {"preset": tr_preset, "duration": tr_dur}
                s_next["transition_in"] = {"preset": tr_preset, "duration": tr_dur}
                break

    return timeline


def compute_segment_cache_key(
    raw_video_path: str,
    start_t: float,
    end_t: float,
    filter_complex: str,
    extra_inputs: Optional[List[str]] = None,
    codec: str = "libx264",
    fps: float = 30.0,
    target_w: int = 1080,
    target_h: int = 1920,
) -> str:
    """
    Computes a deterministic SHA-256 fingerprint for an intermediate render segment.
    Factors in source media metadata, exact time slices, canvas resolution,
    codec options, and the full multi-layer filtergraph string.
    """
    hasher = hashlib.sha256()

    # 1. Source file signature
    if raw_video_path and os.path.exists(raw_video_path):
        try:
            st = os.stat(raw_video_path)
            hasher.update(f"src:{raw_video_path}:{st.st_size}:{st.st_mtime_ns}".encode("utf-8"))
        except Exception:
            hasher.update(f"src:{raw_video_path}".encode("utf-8"))
    else:
        hasher.update(f"src:{raw_video_path}".encode("utf-8"))

    # 2. Slice timing & output resolution
    hasher.update(f":{start_t:.4f}:{end_t:.4f}:{fps:.2f}:{target_w}x{target_h}:{codec}".encode("utf-8"))

    # 3. Filtergraph
    hasher.update(filter_complex.encode("utf-8"))

    # 4. Extra input assets (B-roll, overlays, sound effects, cutouts)
    if extra_inputs:
        for extra in sorted(extra_inputs):
            if extra and os.path.exists(extra):
                try:
                    est = os.stat(extra)
                    hasher.update(f":extra:{extra}:{est.st_size}:{est.st_mtime_ns}".encode("utf-8"))
                except Exception:
                    hasher.update(f":extra:{extra}".encode("utf-8"))
            else:
                hasher.update(f":extra:{extra}".encode("utf-8"))

    return hasher.hexdigest()[:24]


def is_valid_cached_segment(
    file_path: str,
    min_size: int = 1024,
    ffprobe_bin: Optional[str] = None,
) -> bool:
    """
    Validates whether a cached video segment file is intact, readable, and non-corrupt.
    Performs size check, ISO BMFF container header check, and ffprobe stream verification.
    """
    if not file_path or not os.path.exists(file_path):
        return False

    try:
        size = os.path.getsize(file_path)
        if size < min_size:
            return False

        # Check MP4 ISO base media file format header atom
        with open(file_path, "rb") as f:
            header = f.read(32)
        if len(header) < 16:
            return False

        # In standard MP4/MOV files, bytes 4..8 usually represent 'ftyp', 'moov', or 'wide'
        atom_type = header[4:8]
        if atom_type not in (b"ftyp", b"moov", b"wide", b"mdat", b"free"):
            return False

        # If ffprobe binary is provided or discoverable, run a quick syntax probe
        if ffprobe_bin and os.path.exists(ffprobe_bin):
            probe_cmd = [
                ffprobe_bin, "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=codec_name",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path
            ]
            res = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
            if res.returncode != 0 or not res.stdout.strip():
                return False

        return True
    except Exception:
        return False


def clean_segment_cache(cache_dir: str, max_age_days: int = 7, max_size_bytes: Optional[int] = None) -> int:
    """
    Cleans up expired, corrupted, or over-quota files in segment_cache_dir.
    Returns the number of removed files.
    """
    if not os.path.exists(cache_dir):
        return 0

    now = time.time()
    max_age_sec = max_age_days * 86400
    removed_count = 0
    files_with_mtime = []

    try:
        for entry in os.scandir(cache_dir):
            if not entry.is_file() or not entry.name.endswith(".mp4"):
                continue

            # Remove any orphan tmp files older than 1 hour
            if entry.name.startswith("tmp_"):
                if now - entry.stat().st_mtime > 3600:
                    try:
                        os.remove(entry.path)
                        removed_count += 1
                    except OSError:
                        pass
                continue

            stat = entry.stat()
            # Remove expired segments
            if now - stat.st_mtime > max_age_sec:
                try:
                    os.remove(entry.path)
                    removed_count += 1
                except OSError:
                    pass
                continue

            files_with_mtime.append((entry.path, stat.st_size, stat.st_mtime))

        # Check total size quota if configured
        if max_size_bytes is not None and files_with_mtime:
            total_size = sum(sz for _, sz, _ in files_with_mtime)
            if total_size > max_size_bytes:
                # Sort oldest first (LRU)
                files_with_mtime.sort(key=lambda x: x[2])
                for path, sz, _ in files_with_mtime:
                    try:
                        os.remove(path)
                        removed_count += 1
                        total_size -= sz
                        if total_size <= max_size_bytes:
                            break
                    except OSError:
                        pass
    except Exception as e:
        _log("CACHE_WARN", f"Cache cleanup encountered error: {e}")

    return removed_count


# ---------------------------------------------------------------------------
# Main Render Function
# ---------------------------------------------------------------------------

def render_video_pipeline(
    raw_video_path: str,
    output_mp4_path: str,
    subtitle_ass_path: Optional[str] = None,
    broll_map: Optional[Dict[str, str]] = None,
    edits: Optional[List[Dict[str, Any]]] = None,
    timestamp_map: Optional[Dict[str, Any]] = None,
    settings: Optional[Dict[str, Any]] = None,
    character_video_path: Optional[str] = None,
) -> str:
    """
    Composites the final video using a chunked rendering pipeline.
    This prevents Out-of-Memory (OOM) errors by rendering one segment at a time.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    ffmpeg_bin = get_ffmpeg_binary_path()
    broll_map = broll_map or {}
    edits = edits or []
    timestamp_map = timestamp_map or {}
    settings = settings or {}

    for idx, e in enumerate(edits):
        if isinstance(e, dict) and "_edit_id" not in e:
            e["_edit_id"] = f"edit_{idx}"

    target_aspect = settings.get("aspect_ratio", "9:16")
    if target_aspect == "16:9": target_w, target_h = 1920, 1080
    elif target_aspect == "1:1": target_w, target_h = 1080, 1080
    elif target_aspect == "4:5": target_w, target_h = 1080, 1350
    else: target_w, target_h = 1080, 1920

    _log("START", f"raw_video={raw_video_path}")
    _log("START", f"output={output_mp4_path}")

    if not os.path.exists(raw_video_path):
        raise FileNotFoundError(f"Raw video not found: {raw_video_path}")

    file_size = os.path.getsize(raw_video_path)
    if file_size < 1024:
        raise ValueError("Raw video is suspiciously small.")

    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    if total_duration <= 0:
        raise ValueError("Could not determine video duration.")

    input_streams = _probe_streams(ffmpeg_bin, raw_video_path)
    source_has_audio = input_streams["has_audio"]
    source_fps = input_streams.get("fps", 30.0)

    timeline = _build_segment_timeline(edits, timestamp_map, total_duration, settings)
    kept_segments = [s for s in timeline if not s["is_cut"]]

    import tempfile
    base_temp = (
        settings.get("temp_dir")
        or os.environ.get("COMPOSITOR_TEMP_DIR")
        or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp"))
    )
    os.makedirs(base_temp, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="ai_compositor_", dir=base_temp)

    # Pre-synthesize procedural SFX kit calibrated to dialog volume
    speech_db = -21.0
    sfx_kit_dir = os.path.join(temp_dir, ".sfx")
    try:
        from services.audio_sfx_synthesizer import measure_speech_db, synthesize_project_sfx_library
        speech_db = measure_speech_db(raw_video_path)
        synthesize_project_sfx_library(sfx_kit_dir, speech_db)
        _log("SFX", f"Pre-synthesized procedural SFX kit calibrated to speech ({speech_db:.1f} dBFS)")
    except Exception as e:
        _log("SFX_WARN", f"Procedural SFX kit pre-synthesis skipped: {e}")

    if not kept_segments:
        kept_segments = [{"start": 0.0, "end": total_duration, "chunk_id": "FULL", "actions": [], "is_cut": False}]

    if settings.get("continuous_composition") or settings.get("SINGLE_PASS_COMPOSITION"):
        _log("TIMELINE", "Using continuous single-pass composition (zero segment chopping, zero concat blinking)")
        full_actions = []
        for e in edits:
            cloned = dict(e)
            e_start = e.get("start")
            e_end = e.get("end")
            if e_start is None: e_start = 0.0
            if e_end is None: e_end = total_duration
            cloned["original_start"] = float(e_start)
            cloned["original_end"] = float(e_end)
            cloned["seg_overlap_start"] = float(e_start)
            cloned["seg_overlap_end"] = float(e_end)
            full_actions.append(cloned)
        kept_segments = [{
            "start": 0.0,
            "end": total_duration,
            "chunk_id": "FULL_CONTINUOUS",
            "actions": full_actions,
            "is_cut": False
        }]

    use_granular = settings.get("USE_GRANULAR_OVERLAYS", False)

    # Pre-render MG overlays if using granular overlays
    if use_granular:
        for edit in edits:
            if edit.get("action") == "motion_graphics" or edit.get("motion_graphics_text"):
                e_start = edit.get("start")
                e_end = edit.get("end")
                if e_start is None or e_end is None:
                    tid = edit.get("trigger_id")
                    if tid and tid in timestamp_map:
                        e_start = timestamp_map[tid].get("start", 0.0)
                        e_end = timestamp_map[tid].get("end", total_duration)
                    else:
                        e_start, e_end = 0.0, total_duration
                dur = e_end - e_start
                if dur <= 0.05: continue

                if edit.get("motion_graphics_type"):
                    mg_template = edit.get("motion_graphics_type")
                    mg_props = edit.get("motion_graphics_targets", {})
                else:
                    mg_template = edit.get("template", "MotionGraphicsPreview")
                    mg_props = {"text": edit.get("motion_graphics_text")}

                if edit.get("visual_beats"): mg_props["visual_beats"] = edit.get("visual_beats")
                if edit.get("transition"): mg_props["transition"] = edit.get("transition")

                mg_id = str(uuid.uuid4())[:8]
                mg_path = _render_canvas_composition(
                    mg_template, mg_props,
                    dur, source_fps, target_w, target_h, temp_dir, f"mg_pre_{mg_id}"
                )
                edit["_pre_mg_path"] = mg_path

    # Studio Depth Matting: pre-render speaker cutouts for any behind cards
    # Check for direct cutout paths provided in edits
    for edit in edits:
        if not edit.get("_pre_cutout_path"):
            cand = edit.get("cutout_path") or edit.get("speaker_cutout")
            if cand and os.path.exists(cand):
                edit["_pre_cutout_path"] = cand
                edit["_cutout_start"] = edit.get("start", 0.0)
                edit["_cutout_end"] = edit.get("end", total_duration)

    try:
        from services.depth_matting import (
            extract_behind_ranges,
            cut_range_to_prores,
            is_depth_matting_available
        )
        behind_ranges = extract_behind_ranges(edits, timestamp_map, total_duration, fps=source_fps)
        can_matte = is_depth_matting_available() or settings.get("mock_depth_matting")
        if behind_ranges and can_matte:
            _log("DEPTH_MATTE", f"Found {len(behind_ranges)} behind range(s). Pre-rendering studio depth cutouts...")
            for r_idx, rng in enumerate(behind_ranges):
                cutout_path = os.path.join(temp_dir, f"cutout_{r_idx:02d}.mov")
                try:
                    if settings.get("mock_depth_matting"):
                        rng_dur = max(0.1, rng["end"] - rng["start"])
                        mock_cmd = [
                            ffmpeg_bin, "-y", "-threads", "2", "-hide_banner",
                            "-f", "lavfi", "-i", f"color=c=black@0.0:s={target_w}x{target_h}:d={rng_dur:.3f}:r={source_fps}",
                            "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
                            cutout_path
                        ]
                        subprocess.run(mock_cmd, capture_output=True, check=True)
                    else:
                        cut_range_to_prores(
                            video_path=raw_video_path,
                            start_s=rng["start"],
                            end_s=rng["end"],
                            output_mov_path=cutout_path,
                            fps=source_fps,
                            width=target_w,
                            height=target_h
                        )
                    for edit in edits:
                        eid = str(edit.get("_edit_id") or edit.get("trigger_id") or "")
                        if eid in rng["edit_ids"] or (
                            (str(edit.get("layer", "")).lower() == "behind" or str(edit.get("depth", "")).lower() == "behind" or edit.get("layout", {}).get("variant") == "cutout")
                            and edit.get("start", 0.0) >= rng["start"] - 0.1
                            and edit.get("end", total_duration) <= rng["end"] + 0.1
                        ):
                            edit["_pre_cutout_path"] = cutout_path
                            edit["_cutout_start"] = rng["start"]
                            edit["_cutout_end"] = rng["end"]
                except Exception as ex:
                    _log("DEPTH_MATTE_WARN", f"Failed to render cutout for range {rng['start']:.2f}-{rng['end']:.2f}: {ex}")
    except Exception as e:
        _log("DEPTH_MATTE_WARN", f"Depth matting initialization skipped: {e}")

    # Propagate _pre_mg_path and _pre_cutout_path from original edits into the shallow-copied
    # action clones inside each segment (build_segment_timeline clones before
    # pre-render runs, so the clones miss pre-renders without this step).
    for seg in kept_segments:
        for a in seg.get("actions", []):
            a_eid = a.get("_edit_id")
            tid = a.get("trigger_id")
            a_act = a.get("action")
            matched_edit = None
            if a_eid:
                for edit in edits:
                    if edit.get("_edit_id") == a_eid:
                        matched_edit = edit
                        break
            if not matched_edit and tid:
                for edit in edits:
                    if edit.get("trigger_id") == tid and (
                        edit.get("action") == a_act or
                        (a_act in ["motion_graphics", "kinetic_text"] and edit.get("action") in ["motion_graphics", "kinetic_text"])
                    ):
                        matched_edit = edit
                        break
            if matched_edit:
                if not a.get("_pre_mg_path") and matched_edit.get("_pre_mg_path"):
                    a["_pre_mg_path"] = matched_edit["_pre_mg_path"]
                if not a.get("_pre_cutout_path") and matched_edit.get("_pre_cutout_path"):
                    a["_pre_cutout_path"] = matched_edit["_pre_cutout_path"]
                    a["_cutout_start"] = matched_edit.get("_cutout_start")
                    a["_cutout_end"] = matched_edit.get("_cutout_end")

    _log("RENDER", f"Chunked rendering of {len(kept_segments)} segments to prevent OOM...")
    segment_files = []

    for seg_idx, seg in enumerate(kept_segments):
        start_t = max(0, seg["start"])
        end_t = min(total_duration, seg["end"])
        duration = end_t - start_t
        if duration <= 0.05:
            continue

        segment_mp4 = os.path.join(temp_dir, f"segment_{seg_idx:03d}.mp4")

        cmd = [ffmpeg_bin, "-y", "-i", raw_video_path]
        input_idx = 1

        filter_str = []
        action_types = {a["action"] for a in seg["actions"]}

        filter_str.append(f"[0:v]trim=start={start_t:.3f}:end={end_t:.3f},setpts=PTS-STARTPTS[base_v];")

        if source_has_audio:
            filter_str.append(f"[0:a]atrim=start={start_t:.3f}:end={end_t:.3f},asetpts=PTS-STARTPTS[base_a];")
            current_a = "[base_a]"
        else:
            filter_str.append(f"anullsrc=d={duration:.3f}:r=44100:cl=stereo[base_a];")
            current_a = "[base_a]"

        base_scale = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
        if "zoom_in" in action_types:
            zoom_frames = max(1, int(duration * source_fps))
            fps_val = int(round(source_fps)) if source_fps else 30
            base_scale = (
                f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},"
                f"zoompan=z='min(1.0+0.15*(in/{zoom_frames}),1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={target_w}x{target_h}:fps={fps_val}"
            )

        filter_str.append(f"[base_v]{base_scale}[norm_v];")
        current_v = "[norm_v]"

        if use_granular:
            mg_count = 0
            broll_count = 0
            # Multi-layer sandwich order:
            # 0: Fullscreen B-roll background
            # 1: Behind B-roll (background with cutout overlay)
            # 2: Behind motion graphics (card sits behind speaker, cutout placed on top)
            # 3: Character / avatar overlay
            # 4: Front motion graphics (card sits IN FRONT of speaker, never covered by cutout)
            def _action_layer_order(act_dict: dict) -> int:
                act = act_dict.get("action", "")
                is_behind = (
                    str(act_dict.get("layer", "")).lower() == "behind"
                    or str(act_dict.get("depth", "")).lower() == "behind"
                    or bool(act_dict.get("_pre_cutout_path"))
                )
                if act == "b_roll":
                    return 1 if is_behind else 0
                if act == "motion_graphics" or act_dict.get("motion_graphics_text"):
                    return 2 if is_behind else 4
                if act == "character":
                    return 3
                return 4

            actions_sorted = sorted(
                seg["actions"],
                key=lambda x: (
                    _action_layer_order(x),
                    x.get("seg_overlap_start", seg["start"])
                )
            )

            for a in actions_sorted:
                action_type = a.get("action")
                rel_start = a.get("seg_overlap_start", seg["start"]) - seg["start"]
                rel_end = a.get("seg_overlap_end", seg["end"]) - seg["start"]

                if action_type == "motion_graphics" or a.get("motion_graphics_text"):
                    mg_path = a.get("_pre_mg_path")
                    if mg_path and os.path.exists(mg_path):
                        offset = a.get("seg_overlap_start", seg["start"]) - a.get("original_start", seg["start"])
                        cmd.extend(["-ss", str(max(0, offset)), "-t", str(rel_end - rel_start), "-i", mg_path])

                        mg_v = f"[mg_{mg_count}_v]"
                        frag_dur = max(0.1, rel_end - rel_start)
                        mg_fade_in = min(0.35, frag_dur / 4.0)
                        mg_fade_out = min(0.35, frag_dur / 4.0)
                        mg_out_st = max(0.0, frag_dur - mg_fade_out)
                        filter_str.append(
                            f"[{input_idx}:v]format=yuva420p,"
                            f"fade=t=in:st=0:d={mg_fade_in:.3f}:alpha=1,"
                            f"fade=t=out:st={mg_out_st:.3f}:d={mg_fade_out:.3f}:alpha=1,"
                            f"setpts=PTS-STARTPTS+{rel_start}/TB{mg_v};"
                        )
                        filter_str.append(f"{current_v}{mg_v}overlay=x=0:y=0:enable='between(t,{rel_start},{rel_end})':eof_action=pass[with_mg_{mg_count}];")
                        current_v = f"[with_mg_{mg_count}]"
                        input_idx += 1

                        # Studio Depth Matting: layer-2 cutout overlay
                        cutout_path = a.get("_pre_cutout_path")
                        if cutout_path and os.path.exists(cutout_path):
                            cutout_start = a.get("_cutout_start", seg["start"])
                            cutout_offset = a.get("seg_overlap_start", seg["start"]) - cutout_start
                            cmd.extend(["-ss", str(max(0, cutout_offset)), "-t", str(rel_end - rel_start), "-i", cutout_path])
                            cutout_v = f"[cutout_mg_{mg_count}_v]"
                            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS+{rel_start}/TB{cutout_v};")
                            filter_str.append(f"{current_v}{cutout_v}overlay=x=0:y=0:enable='between(t,{rel_start},{rel_end})':eof_action=pass[with_cutout_mg_{mg_count}];")
                            current_v = f"[with_cutout_mg_{mg_count}]"
                            input_idx += 1

                        mg_count += 1

                elif action_type == "b_roll":
                    tid = a.get("trigger_id") or a.get("id")
                    broll_path_a = broll_map.get(tid) if (tid and tid in broll_map) else None
                    if not broll_path_a:
                        candidate = a.get("broll_path") or a.get("localPath") or a.get("path") or a.get("sourceUrl")
                        if candidate and os.path.exists(candidate) and os.path.getsize(candidate) > 1024:
                            broll_path_a = candidate
                    if broll_path_a and os.path.exists(broll_path_a) and os.path.getsize(broll_path_a) > 1024:
                        offset = a.get("seg_overlap_start", seg["start"]) - a.get("original_start", seg["start"])
                        cmd.extend(["-ss", str(max(0, offset)), "-an", "-t", str(rel_end - rel_start), "-i", broll_path_a])
                        bv = f"[broll_{broll_count}_v]"
                        broll_transition = a.get("transition", "fade")
                        frag_dur = max(0.1, rel_end - rel_start)
                        fade_in_d = min(0.35, frag_dur / 3.0)
                        fade_out_d = min(0.35, frag_dur / 3.0)
                        fade_out_st = max(0.0, frag_dur - fade_out_d)

                        broll_filter = f"[{input_idx}:v]fps={source_fps},scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
                        broll_filter += f",fade=t=in:st=0:d={fade_in_d:.3f},fade=t=out:st={fade_out_st:.3f}:d={fade_out_d:.3f}"
                        broll_filter += f",setpts=PTS-STARTPTS+{rel_start}/TB{bv};"
                        filter_str.append(broll_filter)

                        overlay_x, overlay_y = "0", "0"
                        if broll_transition == "slide" or broll_transition == "push":
                            overlay_x = f"'if(lte(t,{rel_start}+0.5), -w+(w/0.5)*(t-{rel_start}), 0)'"

                        filter_str.append(f"{current_v}{bv}overlay=x={overlay_x}:y={overlay_y}:enable='between(t,{rel_start},{rel_end})':eof_action=pass[with_broll_{broll_count}];")
                        current_v = f"[with_broll_{broll_count}]"
                        input_idx += 1

                        # Studio Depth Matting for behind B-roll
                        cutout_path = a.get("_pre_cutout_path")
                        if cutout_path and os.path.exists(cutout_path):
                            cutout_start = a.get("_cutout_start", seg["start"])
                            cutout_offset = a.get("seg_overlap_start", seg["start"]) - cutout_start
                            cmd.extend(["-ss", str(max(0, cutout_offset)), "-t", str(rel_end - rel_start), "-i", cutout_path])
                            cutout_v = f"[cutout_br_{broll_count}_v]"
                            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS+{rel_start}/TB{cutout_v};")
                            filter_str.append(f"{current_v}{cutout_v}overlay=x=0:y=0:enable='between(t,{rel_start},{rel_end})':eof_action=pass[with_cutout_br_{broll_count}];")
                            current_v = f"[with_cutout_br_{broll_count}]"
                            input_idx += 1

                        broll_count += 1

            # To ensure the legacy block doesn't trigger when using granular overlays:
            broll_path = None
            mg_path = None
        else:
            broll_path = None
            broll_action = None
            if "b_roll" in action_types:
                for a in seg["actions"]:
                    if a["action"] == "b_roll":
                        tid = a.get("trigger_id")
                        candidate = broll_map.get(tid) if (tid and tid in broll_map) else None
                        if not candidate:
                            candidate = a.get("broll_path") or a.get("localPath") or a.get("path") or a.get("sourceUrl")
                        if candidate and os.path.exists(candidate) and os.path.getsize(candidate) > 1024:
                            broll_path = candidate
                            broll_action = a
                            break

            mg_path = None
            mg_action = None
            for a in seg["actions"]:
                if a.get("action") == "motion_graphics" or a.get("motion_graphics_text") or a.get("motion_graphics_type"):
                    mg_action = a
                    break

            if mg_action:
                if mg_action.get("motion_graphics_type"):
                    mg_template = mg_action.get("motion_graphics_type")
                    mg_props = mg_action.get("motion_graphics_targets", {})
                else:
                    mg_template = mg_action.get("template", "MotionGraphicsPreview")
                    mg_props = {"text": mg_action.get("motion_graphics_text")}

                if mg_action.get("visual_beats"): mg_props["visual_beats"] = mg_action.get("visual_beats")
                if mg_action.get("transition"): mg_props["transition"] = mg_action.get("transition")

                mg_path = _render_canvas_composition(
                    mg_template, mg_props,
                    duration, source_fps, target_w, target_h, temp_dir, f"mg_{seg['chunk_id']}"
                )

        character_action = None
        has_sfx = False
        sfx_keyword = "pop"
        sfx_source_url = None
        sfx_volume = 80.0
        sfx_delay_ms = 0

        for a in seg["actions"]:
            if a.get("action") == "character" or a.get("character_action"):
                character_action = a.get("character_action")
                char_props_overrides = {}
                if a.get("visual_beats"): char_props_overrides["visual_beats"] = a.get("visual_beats")
                if a.get("transition"): char_props_overrides["transition"] = a.get("transition")

            if a.get("action") == "sfx" or a.get("sound_effect"):
                has_sfx = True
                sfx_keyword = a.get("sound_effect", "pop")
                sfx_source_url = a.get("sourceUrl") or a.get("source_url")
                sfx_volume = float(a.get("volume", 80) or 80)
                rel_s = max(0.0, a.get("seg_overlap_start", seg["start"]) - seg["start"])
                sfx_delay_ms = int(round(rel_s * 1000))

        # Procedural SFX: automatically pair sound cues with motion graphics and zoom_in
        if not has_sfx:
            if mg_path or (use_granular and mg_count > 0):
                from services.audio_sfx_synthesizer import recommend_sfx_for_action
                for a in seg.get("actions", []):
                    if a.get("action") == "motion_graphics" or a.get("motion_graphics_text"):
                        sfx_keyword = recommend_sfx_for_action(a)
                        has_sfx = True
                        rel_s = max(0.0, a.get("seg_overlap_start", seg["start"]) - seg["start"])
                        sfx_delay_ms = int(round(rel_s * 1000))
                        break
            elif "zoom_in" in action_types:
                sfx_keyword = "zoom"
                has_sfx = True
                sfx_delay_ms = 0

        broll_transition = None
        for a in seg["actions"]:
            if a["action"] == "b_roll" and a.get("transition"):
                broll_transition = a.get("transition")
                break

        if broll_path:
            cmd.extend(["-an", "-i", broll_path])
            broll_filter = f"[{input_idx}:v]fps={source_fps},scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},setpts=PTS-STARTPTS"
            if broll_transition in ["fade", "crossfade", "morph"]:
                broll_filter += ",fade=t=in:st=0:d=0.5"
            broll_filter += f"[broll_v];"
            filter_str.append(broll_filter)

            overlay_x = "0"
            overlay_y = "0"
            if broll_transition == "slide" or broll_transition == "push":
                overlay_x = "'if(lte(t,0.5), -w+(w/0.5)*t, 0)'"

            filter_str.append(f"{current_v}[broll_v]overlay=x={overlay_x}:y={overlay_y}:eof_action=pass[with_broll];")
            current_v = "[with_broll]"
            input_idx += 1

            cutout_path = broll_action.get("_pre_cutout_path") if broll_action else None
            if cutout_path and os.path.exists(cutout_path):
                cmd.extend(["-i", cutout_path])
                filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[cutout_br_v];")
                filter_str.append(f"{current_v}[cutout_br_v]overlay=x=0:y=0:eof_action=pass[with_cutout_br];")
                current_v = "[with_cutout_br]"
                input_idx += 1

        if mg_path:
            cmd.extend(["-i", mg_path])
            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[mg_v];")
            filter_str.append(f"{current_v}[mg_v]overlay=x=0:y=0:eof_action=pass[with_mg];")
            current_v = "[with_mg]"
            input_idx += 1

            cutout_path = mg_action.get("_pre_cutout_path") if mg_action else None
            if cutout_path and os.path.exists(cutout_path):
                cmd.extend(["-i", cutout_path])
                filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[cutout_v];")
                filter_str.append(f"{current_v}[cutout_v]overlay=x=0:y=0:eof_action=pass[with_cutout];")
                current_v = "[with_cutout]"
                input_idx += 1

        if character_video_path and os.path.exists(character_video_path):
            cmd.extend(["-i", character_video_path])
            char_idx = input_idx
            # Trim the 3D character WebM exactly like the raw video so lip sync matches the cut segments
            filter_str.append(f"[{char_idx}:v]trim=start={start_t:.3f}:end={end_t:.3f},setpts=PTS-STARTPTS[char_v_trim];")

            char_scale = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
            if "zoom_in" in action_types:
                zoom_frames = max(1, int(duration * source_fps))
                fps_val = int(round(source_fps)) if source_fps else 30
                char_scale = (
                    f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},"
                    f"zoompan=z='min(1.0+0.15*(in/{zoom_frames}),1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={target_w}x{target_h}:fps={fps_val}"
                )

            filter_str.append(f"[char_v_trim]{char_scale}[char_v_scaled];")
            filter_str.append(f"{current_v}[char_v_scaled]overlay=x=0:y=0:eof_action=pass[with_char];")
            current_v = "[with_char]"
            input_idx += 1

        if has_sfx:
            sfx_path = None
            if sfx_source_url:
                if os.path.exists(sfx_source_url):
                    sfx_path = sfx_source_url
                else:
                    base_name = os.path.basename(sfx_source_url)
                    cand_web = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "web", "public", "assets", "audio", base_name))
                    cand_worker = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips", base_name))
                    if os.path.exists(cand_web):
                        sfx_path = cand_web
                    elif os.path.exists(cand_worker):
                        sfx_path = cand_worker

            if not sfx_path or not os.path.exists(sfx_path):
                from services.audio_sfx_synthesizer import resolve_cue_name
                cue_resolved = resolve_cue_name(sfx_keyword)
                cached_sfx = os.path.join(sfx_kit_dir, f"{cue_resolved}.wav")
                if os.path.exists(cached_sfx):
                    sfx_path = cached_sfx
                else:
                    sfx_path = os.path.join(temp_dir, f"sfx_{seg['chunk_id']}.wav")
                    sfx_fetched = fetch_sfx(sfx_keyword, sfx_path) if sfx_keyword else False
                    if not sfx_fetched:
                        sfx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "web", "public", "assets", "audio", "pop.wav"))
            if sfx_path and os.path.exists(sfx_path):
                cmd.extend(["-i", sfx_path])
                vol_filter = f"volume={sfx_volume / 100.0:.2f}," if sfx_volume != 100 else ""
                filter_str.append(f"[{input_idx}:a]{vol_filter}adelay={sfx_delay_ms}|{sfx_delay_ms}[sfx_a];")
                filter_str.append(f"{current_a}[sfx_a]amix=inputs=2:duration=first:dropout_transition=2[a_out_sfx];")
                current_a = "[a_out_sfx]"
                input_idx += 1

        # Boundary transition smoothing across cut boundaries
        if seg.get("transition_out"):
            t_out = seg["transition_out"]
            dur_out = min(float(t_out.get("duration", 0.5) or 0.5) / 2.0, duration / 2.0)
            if dur_out > 0.05:
                st_out = max(0.0, duration - dur_out)
                filter_str.append(f"{current_v}fade=t=out:st={st_out:.3f}:d={dur_out:.3f}[v_out_fade];")
                current_v = "[v_out_fade]"
                filter_str.append(f"{current_a}afade=t=out:st={st_out:.3f}:d={dur_out:.3f}[a_out_fade];")
                current_a = "[a_out_fade]"

        if seg.get("transition_in"):
            t_in = seg["transition_in"]
            dur_in = min(float(t_in.get("duration", 0.5) or 0.5) / 2.0, duration / 2.0)
            if dur_in > 0.05:
                filter_str.append(f"{current_v}fade=t=in:st=0:d={dur_in:.3f}[v_in_fade];")
                current_v = "[v_in_fade]"
                filter_str.append(f"{current_a}afade=t=in:st=0:d={dur_in:.3f}[a_in_fade];")
                current_a = "[a_in_fade]"

        filter_str.append(f"{current_v}format=yuv420p[vout]")

        filter_complex = "".join(filter_str)
        filter_script_path = os.path.join(temp_dir, f"filter_{seg_idx}.txt")
        with open(filter_script_path, "w", encoding="utf-8") as f:
            f.write(filter_complex)

        cmd.extend([
            "-filter_complex_script", filter_script_path,
            "-map", "[vout]",
            "-map", current_a,
            "-r", str(source_fps),
            "-c:v", _get_video_codec(ffmpeg_bin), "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", "-video_track_timescale", "90000",
            "-pix_fmt", "yuv420p",
            "-shortest",
            segment_mp4
        ])

        # Incremental Segment Caching
        segment_cache_dir = (
            settings.get("segment_cache_dir")
            or os.environ.get("SEGMENT_CACHE_DIR")
            or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp", "segment_cache"))
        )
        enable_cache = settings.get("enable_segment_cache", settings.get("ENABLE_SEGMENT_CACHE", True))

        extra_inputs = []
        for i_arg, val in enumerate(cmd):
            if val == "-i" and i_arg + 1 < len(cmd):
                inp_file = cmd[i_arg + 1]
                if inp_file != raw_video_path and os.path.exists(inp_file):
                    extra_inputs.append(inp_file)

        codec_str = _get_video_codec(ffmpeg_bin)
        seg_hash = compute_segment_cache_key(
            raw_video_path=raw_video_path,
            start_t=start_t,
            end_t=end_t,
            filter_complex=filter_complex,
            extra_inputs=extra_inputs,
            codec=codec_str,
            fps=source_fps,
            target_w=target_w,
            target_h=target_h,
        )
        cached_segment_path = os.path.join(segment_cache_dir, f"seg_{seg_hash}.mp4")
        ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)

        if enable_cache and os.path.exists(cached_segment_path):
            if is_valid_cached_segment(cached_segment_path, ffprobe_bin=ffprobe_bin):
                _log("CACHE_HIT", f"Reusing valid cached segment {seg_idx+1}/{len(kept_segments)} (hash: {seg_hash})")
                shutil.copy2(cached_segment_path, segment_mp4)
                segment_files.append(segment_mp4)
                continue
            else:
                _log("CACHE_DISCARD", f"Discarding invalid/corrupt cached segment: {cached_segment_path}")
                try:
                    os.remove(cached_segment_path)
                except Exception:
                    pass

        _log("FFMPEG", f"Rendering segment {seg_idx+1}/{len(kept_segments)} (hash: {seg_hash})")
        try:
            _run_ffmpeg(cmd, f"render_segment_{seg_idx}")
            segment_files.append(segment_mp4)
            if enable_cache and os.path.exists(segment_mp4) and is_valid_cached_segment(segment_mp4, ffprobe_bin=ffprobe_bin):
                tmp_cache = os.path.join(segment_cache_dir, f"tmp_{seg_hash}_{os.getpid()}_{uuid.uuid4().hex[:8]}.mp4")
                try:
                    os.makedirs(segment_cache_dir, exist_ok=True)
                    shutil.copy2(segment_mp4, tmp_cache)
                    if is_valid_cached_segment(tmp_cache, ffprobe_bin=ffprobe_bin):
                        os.replace(tmp_cache, cached_segment_path)
                        _log("CACHE_SAVE", f"Cached segment {seg_idx+1} -> {cached_segment_path}")
                    else:
                        _log("CACHE_WARN", f"Temporary segment copy corrupt: {tmp_cache}")
                except Exception as cache_err:
                    _log("CACHE_WARN", f"Segment caching warning: {cache_err}")
                finally:
                    if os.path.exists(tmp_cache):
                        try:
                            os.remove(tmp_cache)
                        except Exception:
                            pass
        except RuntimeError as e:
            _log("ERROR", f"Rendering segment {seg_idx} failed: {e}")
            raise


    _log("FFMPEG", "Concatenating segments...")
    concat_txt_path = os.path.join(temp_dir, "concat.txt")
    with open(concat_txt_path, "w", encoding="utf-8") as f:
        for seg_file in segment_files:
            escaped_file = seg_file.replace("'", "'\\''")
            f.write(f"file '{escaped_file}'\n")

    cmd_concat = [
        ffmpeg_bin, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_txt_path
    ]

    if subtitle_ass_path and os.path.exists(subtitle_ass_path) and os.path.getsize(subtitle_ass_path) > 50:
        escaped_ass = _escape_ass_path_for_filter(subtitle_ass_path)
        cmd_concat.extend([
            "-vf", f"subtitles={escaped_ass}",
            "-c:v", _get_video_codec(ffmpeg_bin), "-preset", "fast", "-crf", "23",
            "-c:a", "copy",
        ])
    else:
        cmd_concat.extend(["-c:v", "copy", "-c:a", "copy"])

    cmd_concat.extend([
        "-movflags", "+faststart",
        output_mp4_path
    ])

    _log("FFMPEG", "Executing final concatenation and subtitles")
    try:
        _run_ffmpeg(cmd_concat, "final_concat")
    except RuntimeError as e:
        _log("ERROR", f"Concatenation failed: {e}")
        raise

    # Apply Background Music (BGM) & Speech Ducking if present
    bgm_edits = [e for e in edits if e.get("isBgm") or (e.get("action") == "audio" and e.get("isBgm"))]
    if bgm_edits and os.path.exists(output_mp4_path):
        bgm_edit = bgm_edits[0]
        bgm_url = bgm_edit.get("sourceUrl") or bgm_edit.get("source_url") or "chill-bgm.mp3"
        bgm_file = None
        if os.path.exists(bgm_url):
            bgm_file = bgm_url
        else:
            base_name = os.path.basename(bgm_url)
            web_cand = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "web", "public", "assets", "audio", base_name))
            worker_cand = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips", base_name))
            default_cand = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips", "chill-bgm.mp3"))
            if os.path.exists(web_cand):
                bgm_file = web_cand
            elif os.path.exists(worker_cand):
                bgm_file = worker_cand
            elif os.path.exists(default_cand):
                bgm_file = default_cand

        if bgm_file and os.path.exists(bgm_file):
            _log("BGM", f"Applying background music with ducking from {bgm_file}")
            bgm_output = os.path.join(temp_dir, "final_with_bgm.mp4")
            bgm_vol = float(bgm_edit.get("volume", 35) or 35) / 100.0
            ducking = bool(bgm_edit.get("ducking", True))
            ducking_db = float(bgm_edit.get("ducking_db", bgm_edit.get("duckingDb", -14.0)))
            fade_in = float(bgm_edit.get("fade_in", bgm_edit.get("fadeIn", 1.0)))
            fade_out = float(bgm_edit.get("fade_out", bgm_edit.get("fadeOut", 1.5)))

            success = apply_bgm_and_ducking(
                video_path=output_mp4_path,
                output_path=bgm_output,
                bgm_path=bgm_file,
                bgm_volume=bgm_vol,
                ducking=ducking,
                ducking_db=ducking_db,
                fade_in=fade_in,
                fade_out=fade_out,
                ffmpeg_bin=ffmpeg_bin,
            )
            if success and os.path.exists(bgm_output) and os.path.getsize(bgm_output) > 1024:
                shutil.move(bgm_output, output_mp4_path)

    _validate_rendered_output(ffmpeg_bin, output_mp4_path, source_has_audio)

    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if (file.endswith('.mov') and (file.startswith('char_') or file.startswith('mg_'))) or file.startswith('segment_') or file.startswith('filter_'):
                try:
                    # os.remove(os.path.join(root, file))
                    pass
                except OSError:
                    pass

    return output_mp4_path

def _fix_missing_audio(
    ffmpeg_bin: str, segment_path: str, duration: float,
    temp_dir: str, seg_idx: int
):
    """
    If a segment is missing audio, add a silent audio track so concatenation
    doesn't break. This prevents the concat demuxer from producing silence gaps
    when mixing segments with and without audio.
    """
    fixed_path = os.path.join(temp_dir, f"seg_{seg_idx:03d}_fixed.mp4")
    cmd = [
        ffmpeg_bin, "-y",
        "-i", segment_path,
        "-f", "lavfi", "-t", f"{duration:.3f}", "-i", "anullsrc=r=44100:cl=stereo",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        fixed_path,
    ]
    try:
        _run_ffmpeg(cmd, f"fix_audio_seg_{seg_idx}")
        if os.path.exists(fixed_path) and os.path.getsize(fixed_path) > 0:
            os.replace(fixed_path, segment_path)
            _log("AUDIO_FIX", f"Added silent audio to segment {seg_idx}")
    except Exception as e:
        _log("WARN", f"Failed to add silent audio to segment {seg_idx}: {e}")


def _validate_rendered_output(ffmpeg_bin: str, output_path: str, source_has_audio: bool):
    """
    Post-render validation: verify the final video has expected streams.
    Raises RuntimeError if validation fails.
    """
    if not os.path.exists(output_path):
        raise RuntimeError(f"Final rendered video not found at: {output_path}")

    final_size = os.path.getsize(output_path)
    if final_size < 1024:
        raise RuntimeError(
            f"Final rendered video is suspiciously small ({final_size} bytes). "
            f"Something went wrong during rendering."
        )

    # Probe output streams
    output_streams = _probe_streams(ffmpeg_bin, output_path)
    final_duration = output_streams.get("video_duration", 0) or _probe_duration(ffmpeg_bin, output_path)

    _log("VALIDATE", f"Output file: {final_size:,} bytes ({final_size / 1024 / 1024:.2f} MB)")
    _log("VALIDATE", f"Video stream: {output_streams['has_video']} | duration: {output_streams['video_duration']:.2f}s")
    _log("VALIDATE", f"Audio stream: {output_streams['has_audio']} | duration: {output_streams['audio_duration']:.2f}s")

    # Check video stream exists
    if not output_streams["has_video"]:
        raise RuntimeError("Final rendered video has NO video stream!")

    # Check audio stream exists when source had audio
    if source_has_audio and not output_streams["has_audio"]:
        raise RuntimeError(
            "AUDIO FAILURE: Source video had audio but final render has NO audio stream. "
            "This indicates a rendering bug — B-roll may have replaced the audio."
        )

    # Check audio duration is reasonable compared to video duration
    if source_has_audio and output_streams["has_audio"]:
        audio_dur = output_streams["audio_duration"]
        video_dur = final_duration or output_streams["video_duration"]

        if video_dur > 0 and audio_dur > 0:
            # Check audio/video sync tolerance
            av_diff = abs(video_dur - audio_dur)
            if av_diff > EDITING_CONFIG.MAX_AV_SYNC_TOLERANCE_SEC:
                _log("WARN", f"Audio/video duration mismatch: video={video_dur:.2f}s, audio={audio_dur:.2f}s "
                     f"(diff={av_diff:.2f}s > tolerance={EDITING_CONFIG.MAX_AV_SYNC_TOLERANCE_SEC}s)")

            # Check audio isn't suspiciously short
            ratio = audio_dur / video_dur if video_dur > 0 else 0
            if ratio < EDITING_CONFIG.MIN_AUDIO_DURATION_RATIO:
                raise RuntimeError(
                    f"AUDIO FAILURE: Audio duration ({audio_dur:.1f}s) is only {ratio:.0%} of video "
                    f"duration ({video_dur:.1f}s). Expected at least {EDITING_CONFIG.MIN_AUDIO_DURATION_RATIO:.0%}. "
                    f"B-roll may have caused audio gaps."
                )

    _log("DONE", f"Final video: {final_size:,} bytes ({final_size / 1024 / 1024:.2f} MB) | "
         f"Duration: {final_duration:.2f}s | Audio: {'OK' if output_streams['has_audio'] else 'NONE'}")


def build_faceless_background_video(
    clips: List[str],
    total_duration: float,
    audio_path: str,
    output_path: str,
    target_w: int = 1080,
    target_h: int = 1920,
    ffmpeg_bin: Optional[str] = None,
) -> bool:
    """
    Builds a continuous, seamless stock footage background video for faceless shorts.
    Loops / concatenates available stock footage clips so the video is never black,
    applies subtle contrast and cinematic darkening so foreground text/motion graphics pop,
    and muxes with the speech audio track.
    """
    if not clips or total_duration <= 0:
        return False

    ffmpeg_bin = ffmpeg_bin or get_ffmpeg_binary_path()
    valid_clips = [c for c in clips if os.path.exists(c) and os.path.getsize(c) > 1024]
    if not valid_clips:
        return False

    # Each B-roll clip in the background should rotate every ~3.5 to 4.0 seconds so no single clip hijacks the background
    clip_slice_dur = 3.5
    num_slices_needed = max(len(valid_clips), int(math.ceil(total_duration / clip_slice_dur)))
    expanded_clips = []
    while len(expanded_clips) < num_slices_needed:
        expanded_clips.extend(valid_clips)
    expanded_clips = expanded_clips[:num_slices_needed]

    inputs = []
    filter_parts = []
    for i, c in enumerate(expanded_clips):
        inputs.extend(["-i", c])
        filter_parts.append(
            f"[{i}:v]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,"
            f"crop={target_w}:{target_h},fps=30,setsar=1,trim=duration={clip_slice_dur:.2f},setpts=PTS-STARTPTS[v{i}];"
        )

    concat_inputs = "".join(f"[v{i}]" for i in range(len(expanded_clips)))
    filter_parts.append(f"{concat_inputs}concat=n={len(expanded_clips)}:v=1:a=0,eq=brightness=-0.1:contrast=1.1[vout]")

    tmp_out = output_path + ".tmp_base.mp4"
    cmd = [
        ffmpeg_bin, "-y",
        *inputs,
        "-i", audio_path,
        "-filter_complex", "".join(filter_parts),
        "-map", "[vout]",
        "-map", f"{len(expanded_clips)}:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac",
        "-t", str(round(total_duration, 3)),
        tmp_out
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if res.returncode == 0 and os.path.exists(tmp_out) and os.path.getsize(tmp_out) > 1024:
            os.replace(tmp_out, output_path)
            _log("FACELESS", f"Created continuous stock background ({os.path.getsize(output_path)} bytes, {total_duration:.2f}s)")
            return True
        else:
            _log("WARN", f"build_faceless_background_video failed (rc={res.returncode}): {res.stderr[-300:]}")
            if os.path.exists(tmp_out):
                os.remove(tmp_out)
            return False
    except Exception as e:
        _log("WARN", f"build_faceless_background_video exception: {e}")
        if os.path.exists(tmp_out):
            os.remove(tmp_out)
        return False


def build_sidechain_ducking_filter(
    bgm_volume: float = 0.35,
    ducking: bool = True,
    ducking_db: float = -14.0,
    fade_in: float = 1.0,
    fade_out: float = 1.5,
    total_duration: float = 30.0,
) -> str:
    """
    Builds the FFmpeg audio filtergraph for mixing BGM with narration speech.
    When ducking is True, speech on [0:a] acts as the sidechain control signal,
    attenuating the BGM on [1:a] via the sidechaincompress filter with ~ -14dB attenuation.
    """
    fade_parts = []
    if fade_in > 0:
        fade_parts.append(f"afade=t=in:st=0:d={fade_in:.2f}")
    if fade_out > 0 and total_duration > fade_out:
        fade_parts.append(f"afade=t=out:st={total_duration - fade_out:.2f}:d={fade_out:.2f}")

    fade_str = ("," + ",".join(fade_parts)) if fade_parts else ""
    bgm_prep = f"[1:a]volume={bgm_volume:.3f}{fade_str}[bgm_prep];"

    if ducking:
        # threshold=0.03 (~ -30 dBFS speech threshold), ratio=8 (8:1 compression -> ~14dB ducking)
        comp_str = f"[bgm_prep][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350:makeup=1[ducked_bgm];"
        mix_str = f"[0:a][ducked_bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        return f"{bgm_prep}{comp_str}{mix_str}"
    else:
        mix_str = f"[0:a][bgm_prep]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        return f"{bgm_prep}{mix_str}"


def apply_bgm_and_ducking(
    video_path: str,
    output_path: str,
    bgm_path: str,
    bgm_volume: float = 0.35,
    ducking: bool = True,
    ducking_db: float = -14.0,
    fade_in: float = 1.0,
    fade_out: float = 1.5,
    ffmpeg_bin: Optional[str] = None,
) -> bool:
    """
    Applies background music to a video file with automatic speech ducking.
    Uses lossless video copy (-c:v copy) and re-encodes only audio (-c:a aac).
    """
    ffmpeg_bin = ffmpeg_bin or get_ffmpeg_binary_path()
    if not os.path.exists(video_path) or not os.path.exists(bgm_path):
        _log("WARN", f"Cannot apply BGM: video ({video_path}) or BGM ({bgm_path}) missing")
        return False

    dur = _probe_duration(ffmpeg_bin, video_path)
    if dur <= 0:
        dur = 30.0

    filter_graph = build_sidechain_ducking_filter(
        bgm_volume=bgm_volume,
        ducking=ducking,
        ducking_db=ducking_db,
        fade_in=fade_in,
        fade_out=fade_out,
        total_duration=dur,
    )

    cmd = [
        ffmpeg_bin, "-y",
        "-i", video_path,
        "-stream_loop", "-1",
        "-i", bgm_path,
        "-filter_complex", filter_graph,
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-shortest",
        "-movflags", "+faststart",
        output_path,
    ]

    try:
        _run_ffmpeg(cmd, "apply_bgm_and_ducking")
        return os.path.exists(output_path) and os.path.getsize(output_path) > 1024
    except Exception as e:
        _log("WARN", f"Failed to apply BGM with ducking: {e}")
        return False


FFMPEG_XFADE_MAP: Dict[str, str] = {
    "crossfade": "fade",
    "fade_to_black": "fadeblack",
    "wipe_left": "wipeleft",
    "wipe_right": "wiperight",
    "slide_up": "slideup",
    "zoom_in": "zoomin",
    "whip_pan": "smoothleft",
}


def build_segment_xfade_filter(
    preset: str = "crossfade",
    duration: float = 0.5,
    offset: float = 0.0,
    has_audio: bool = True,
) -> str:
    """
    Builds FFmpeg filtergraph for dual-stream xfade and acrossfade.
    """
    xfade_filter = FFMPEG_XFADE_MAP.get(preset, "fade")
    v_filter = f"[0:v][1:v]xfade=transition={xfade_filter}:duration={duration:.3f}:offset={offset:.3f}[vout]"
    if has_audio:
        a_filter = f"[0:a][1:a]acrossfade=d={duration:.3f}[aout]"
        return f"{v_filter};{a_filter}"
    return v_filter


def apply_segment_xfade(
    seg_a_path: str,
    seg_b_path: str,
    output_path: str,
    preset: str = "crossfade",
    duration: float = 0.5,
    ffmpeg_bin: Optional[str] = None,
) -> bool:
    """
    Applies FFmpeg xfade transition between two video segments.
    Maps canonical transition presets (crossfade, fade_to_black, wipe_left, wipe_right,
    slide_up, zoom_in, whip_pan) to FFmpeg xfade filters with audio acrossfade.
    """
    ffmpeg_bin = ffmpeg_bin or get_ffmpeg_binary_path()
    if not os.path.exists(seg_a_path) or not os.path.exists(seg_b_path):
        _log("WARN", f"Cannot apply xfade: seg_a ({seg_a_path}) or seg_b ({seg_b_path}) missing")
        return False

    dur_a = _probe_duration(ffmpeg_bin, seg_a_path)
    if dur_a <= 0:
        dur_a = 5.0

    dur = min(duration, max(0.1, dur_a * 0.5))
    offset = max(0.01, dur_a - dur)

    streams_a = _probe_streams(ffmpeg_bin, seg_a_path)
    streams_b = _probe_streams(ffmpeg_bin, seg_b_path)
    has_audio = streams_a.get("has_audio", False) and streams_b.get("has_audio", False)

    filter_graph = build_segment_xfade_filter(
        preset=preset,
        duration=dur,
        offset=offset,
        has_audio=has_audio,
    )

    cmd = [
        ffmpeg_bin, "-y",
        "-i", seg_a_path,
        "-i", seg_b_path,
        "-filter_complex", filter_graph,
        "-map", "[vout]",
    ]
    if has_audio:
        cmd.extend(["-map", "[aout]", "-c:a", "aac", "-b:a", "192k"])
    cmd.extend([
        "-c:v", _get_video_codec(ffmpeg_bin),
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path,
    ])

    try:
        _run_ffmpeg(cmd, "apply_segment_xfade")
        return os.path.exists(output_path) and os.path.getsize(output_path) > 1024
    except Exception as e:
        _log("WARN", f"Failed to apply xfade transition: {e}")
        return False


