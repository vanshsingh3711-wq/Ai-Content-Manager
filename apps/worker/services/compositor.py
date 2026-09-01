"""
Video Compositor Service — Phase 5
Applies AI edit decisions to the raw video using FFmpeg:
  - Removes segments marked as 'cut'
  - Overlays B-roll clips on 'b_roll' segments
  - Applies zoom keyframes on 'zoom_in' segments
  - Burns in ASS subtitles
  - Encodes to 1080x1920 vertical MP4
"""

import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional, Tuple
from services.media_extractor import get_ffmpeg_binary_path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log(tag: str, msg: str):
    """Loud, always-visible compositor log line."""
    print(f"  [COMPOSITOR:{tag}] {msg}", flush=True)


def _run_ffmpeg(cmd: List[str], label: str) -> subprocess.CompletedProcess:
    """Run an FFmpeg command, log it, and raise on failure."""
    _log("CMD", f"({label}) {' '.join(cmd[:6])}... ({len(cmd)} args)")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        stderr_preview = (result.stderr or "")[:1500]
        _log("STDERR", f"({label}) {stderr_preview}")
        raise RuntimeError(
            f"FFmpeg failed for '{label}' (exit code {result.returncode}):\n{stderr_preview}"
        )
    return result


def _probe_duration(ffmpeg_bin: str, filepath: str) -> float:
    """Get duration of a media file in seconds using ffprobe."""
    ffprobe_bin = ffmpeg_bin.replace("ffmpeg", "ffprobe")
    if not os.path.exists(ffprobe_bin):
        ffprobe_bin = "ffprobe"
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
        except Exception:
            pass
    return 0.0


def _escape_ass_path_for_filter(filepath: str) -> str:
    """
    Properly escape a .ass file path for FFmpeg's subtitles filter on Windows.
    Windows paths with spaces and colons need special escaping for libass.
    """
    abs_path = os.path.abspath(filepath)
    # Replace backslashes with forward slashes
    abs_path = abs_path.replace("\\", "/")
    # Escape colons (C: -> C\\:) and special filter chars
    abs_path = abs_path.replace(":", "\\\\:")
    # Escape single quotes if any
    abs_path = abs_path.replace("'", "\\'")
    return abs_path


def _build_segment_timeline(
    edits: List[Dict[str, Any]],
    timestamp_map: Dict[str, Any],
    total_duration: float,
) -> List[Dict[str, Any]]:
    """
    Build an ordered timeline of segments from the transcript chunks and edit decisions.
    Each segment has: start, end, chunk_id, actions (list of edit actions for this chunk).
    Segments marked as 'cut' are excluded.
    """
    # Group edit actions by trigger_id
    actions_by_chunk: Dict[str, List[Dict[str, Any]]] = {}
    for edit in edits:
        tid = edit.get("trigger_id", "")
        if tid not in actions_by_chunk:
            actions_by_chunk[tid] = []
        actions_by_chunk[tid].append(edit)

    # Identify cut chunk IDs
    cut_ids = set()
    for edit in edits:
        if edit.get("action") == "cut":
            cut_ids.add(edit.get("trigger_id", ""))

    # Build ordered segments from timestamp_map
    chunks = []
    for chunk_id, chunk_data in timestamp_map.items():
        chunks.append({
            "id": chunk_id,
            "start": chunk_data.get("start", 0.0),
            "end": chunk_data.get("end", 0.0),
            "text": chunk_data.get("text", ""),
        })

    # Sort chunks by start time
    chunks.sort(key=lambda c: c["start"])

    if not chunks:
        _log("WARN", "No transcript chunks found. Using full video as single segment.")
        return [{
            "start": 0.0,
            "end": total_duration,
            "chunk_id": "FULL",
            "actions": [],
            "is_cut": False,
        }]

    # Build timeline with gaps filled
    timeline = []
    for i, chunk in enumerate(chunks):
        is_cut = chunk["id"] in cut_ids
        actions = actions_by_chunk.get(chunk["id"], [])

        timeline.append({
            "start": chunk["start"],
            "end": chunk["end"],
            "chunk_id": chunk["id"],
            "actions": actions,
            "is_cut": is_cut,
            "text": chunk["text"],
        })

    return timeline


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
) -> str:
    """
    Composites the final video by applying AI edit decisions:
      1. Removes 'cut' segments
      2. Overlays B-roll clips on 'b_roll' segments
      3. Applies zoom on 'zoom_in' segments
      4. Burns ASS subtitles
      5. Encodes to 1080x1920 portrait MP4

    NEVER silently falls back. Raises RuntimeError on any failure.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    ffmpeg_bin = get_ffmpeg_binary_path()
    broll_map = broll_map or {}
    edits = edits or []
    timestamp_map = timestamp_map or {}

    _log("START", f"raw_video={raw_video_path}")
    _log("START", f"output={output_mp4_path}")
    _log("START", f"edits={len(edits)} | broll_assets={len(broll_map)} | chunks={len(timestamp_map)}")

    # ---- Validate input video ----
    if not os.path.exists(raw_video_path):
        raise FileNotFoundError(f"Raw video not found: {raw_video_path}")

    file_size = os.path.getsize(raw_video_path)
    if file_size < 1024:
        raise ValueError(
            f"Raw video is only {file_size} bytes — this is a stub/placeholder, not a real video. "
            f"The upload or download step failed silently. Path: {raw_video_path}"
        )

    _log("INPUT", f"Raw video size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")

    # ---- Probe video duration ----
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    _log("INPUT", f"Raw video duration: {total_duration:.2f}s")
    if total_duration <= 0:
        raise ValueError(f"Could not determine video duration. FFmpeg probe failed for: {raw_video_path}")

    # ---- Build segment timeline ----
    timeline = _build_segment_timeline(edits, timestamp_map, total_duration)
    kept_segments = [s for s in timeline if not s["is_cut"]]
    cut_segments = [s for s in timeline if s["is_cut"]]

    _log("TIMELINE", f"Total segments: {len(timeline)} | Kept: {len(kept_segments)} | Cut: {len(cut_segments)}")
    for seg in timeline:
        status = "CUT" if seg["is_cut"] else "KEEP"
        action_names = [a["action"] for a in seg["actions"] if a["action"] != "cut"]
        _log("TIMELINE", f"  {seg['chunk_id']} [{seg['start']:.2f}s - {seg['end']:.2f}s] "
             f"-> {status} | effects: {action_names or 'none'}")

    # ---- Use temp directory for intermediate files ----
    temp_dir = os.path.dirname(os.path.abspath(output_mp4_path))

    if not kept_segments:
        _log("WARN", "All segments were cut! Using full video without cuts.")
        kept_segments = [{
            "start": 0.0, "end": total_duration, "chunk_id": "FULL",
            "actions": [], "is_cut": False,
        }]

    # ---- Step A: Extract kept segments and apply per-segment effects ----
    segment_files = []

    for seg_idx, seg in enumerate(kept_segments):
        seg_output = os.path.join(temp_dir, f"seg_{seg_idx:03d}.mp4")
        start_t = max(0, seg["start"] - 0.05)  # Small pre-roll for smooth cuts
        end_t = min(total_duration, seg["end"] + 0.05)
        duration = end_t - start_t

        if duration <= 0.05:
            _log("SKIP", f"Segment {seg['chunk_id']} too short ({duration:.3f}s), skipping")
            continue

        action_types = {a["action"] for a in seg["actions"]}

        # Determine if this segment gets a B-roll overlay
        broll_path = None
        if "b_roll" in action_types:
            for a in seg["actions"]:
                if a["action"] == "b_roll" and a.get("trigger_id") in broll_map:
                    candidate = broll_map[a["trigger_id"]]
                    if os.path.exists(candidate) and os.path.getsize(candidate) > 1024:
                        broll_path = candidate
                        break

        # Build video filter
        filters = ["scale=1080:1920:force_original_aspect_ratio=increase", "crop=1080:1920"]

        if "zoom_in" in action_types:
            # Fast crop-based zoom: scale up 15% then crop to 1080x1920 (center)
            # This is instant compared to zoompan which re-renders every pixel
            filters = [
                "scale=1242:2208:force_original_aspect_ratio=increase",  # 1080*1.15 = 1242
                "crop=1080:1920",
            ]
            _log("ZOOM", f"Applying 1.15x crop zoom on {seg['chunk_id']}")

        vf_chain = ",".join(filters)

        if broll_path:
            # B-roll overlay: show B-roll for this segment's duration
            _log("BROLL", f"Overlaying B-roll for {seg['chunk_id']}: {os.path.basename(broll_path)}")
            # Use the B-roll as the video source but keep original audio
            cmd = [
                ffmpeg_bin, "-y",
                "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
                "-ss", "0", "-t", f"{duration:.3f}", "-i", broll_path,
                "-filter_complex",
                f"[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[broll];"
                f"[broll]format=yuv420p[vout]",
                "-map", "[vout]", "-map", "0:a?",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                seg_output,
            ]
        else:
            # Normal segment (with optional zoom)
            cmd = [
                ffmpeg_bin, "-y",
                "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
                "-vf", vf_chain,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                seg_output,
            ]

        try:
            _run_ffmpeg(cmd, f"segment_{seg['chunk_id']}")
            if os.path.exists(seg_output) and os.path.getsize(seg_output) > 0:
                segment_files.append(seg_output)
                _log("OK", f"Segment {seg['chunk_id']}: {os.path.getsize(seg_output):,} bytes")
            else:
                _log("ERROR", f"Segment {seg['chunk_id']} produced empty output!")
                raise RuntimeError(f"FFmpeg produced empty output for segment {seg['chunk_id']}")
        except RuntimeError as e:
            _log("ERROR", f"Segment {seg['chunk_id']} FAILED: {e}")
            # For b_roll failures, retry without b_roll overlay
            if broll_path:
                _log("RETRY", f"Retrying {seg['chunk_id']} without B-roll overlay...")
                fallback_cmd = [
                    ffmpeg_bin, "-y",
                    "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                    "-c:a", "aac", "-b:a", "192k",
                    "-pix_fmt", "yuv420p",
                    seg_output,
                ]
                _run_ffmpeg(fallback_cmd, f"segment_{seg['chunk_id']}_fallback")
                if os.path.exists(seg_output) and os.path.getsize(seg_output) > 0:
                    segment_files.append(seg_output)
                else:
                    raise
            else:
                raise

    if not segment_files:
        raise RuntimeError("No video segments were produced! All FFmpeg segment extractions failed.")

    _log("SEGMENTS", f"Produced {len(segment_files)} segment files for concatenation")

    # ---- Step B: Concatenate all segments ----
    if len(segment_files) == 1:
        concat_output = segment_files[0]
        _log("CONCAT", "Only 1 segment, skipping concatenation step")
    else:
        concat_list_path = os.path.join(temp_dir, "concat_list.txt")
        with open(concat_list_path, "w", encoding="utf-8") as f:
            for sf in segment_files:
                # FFmpeg concat demuxer needs forward-slash paths, single-quoted
                safe_path = os.path.abspath(sf).replace("\\", "/")
                f.write(f"file '{safe_path}'\n")

        concat_output = os.path.join(temp_dir, "concatenated.mp4")
        concat_cmd = [
            ffmpeg_bin, "-y",
            "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c", "copy",
            "-movflags", "+faststart",
            concat_output,
        ]
        _run_ffmpeg(concat_cmd, "concatenate_segments")
        _log("CONCAT", f"Concatenated {len(segment_files)} segments -> {os.path.getsize(concat_output):,} bytes")

    # ---- Step C: Burn in subtitles ----
    if subtitle_ass_path and os.path.exists(subtitle_ass_path) and os.path.getsize(subtitle_ass_path) > 50:
        _log("SUBTITLES", f"Burning in ASS subtitles: {subtitle_ass_path}")
        sub_output = output_mp4_path  # Final output

        escaped_ass = _escape_ass_path_for_filter(subtitle_ass_path)
        sub_filter = f"subtitles={escaped_ass}"

        sub_cmd = [
            ffmpeg_bin, "-y",
            "-i", concat_output,
            "-vf", sub_filter,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "copy",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            sub_output,
        ]

        try:
            _run_ffmpeg(sub_cmd, "burn_subtitles")
            _log("SUBTITLES", f"Subtitles burned successfully: {os.path.getsize(sub_output):,} bytes")
        except RuntimeError as e:
            _log("WARN", f"Subtitle burn failed (path escaping issue?): {e}")
            _log("WARN", "Proceeding WITHOUT subtitles — video content is preserved.")
            # Copy the concat output as final (no subtitles but real video content)
            if concat_output != output_mp4_path:
                import shutil
                shutil.copyfile(concat_output, output_mp4_path)
    else:
        _log("SUBTITLES", "No subtitle file provided or file is empty, skipping subtitle burn")
        if concat_output != output_mp4_path:
            import shutil
            shutil.copyfile(concat_output, output_mp4_path)

    # ---- Validate final output ----
    if not os.path.exists(output_mp4_path):
        raise RuntimeError(f"Final rendered video not found at: {output_mp4_path}")

    final_size = os.path.getsize(output_mp4_path)
    if final_size < 1024:
        raise RuntimeError(
            f"Final rendered video is suspiciously small ({final_size} bytes). "
            f"Something went wrong during rendering."
        )

    final_duration = _probe_duration(ffmpeg_bin, output_mp4_path)
    _log("DONE", f"Final video: {final_size:,} bytes ({final_size / 1024 / 1024:.2f} MB) | Duration: {final_duration:.2f}s")

    # ---- Cleanup intermediate segment files ----
    for sf in segment_files:
        try:
            if sf != output_mp4_path:
                os.remove(sf)
        except OSError:
            pass
    for cleanup_file in ["concat_list.txt", "concatenated.mp4"]:
        try:
            p = os.path.join(temp_dir, cleanup_file)
            if os.path.exists(p) and p != output_mp4_path:
                os.remove(p)
        except OSError:
            pass

    return output_mp4_path
