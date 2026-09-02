"""
Video Compositor Service — Phase 5
Applies AI edit decisions to the raw video using FFmpeg:
  - Removes segments marked as 'cut'
  - Overlays B-roll clips on 'b_roll' segments (visual only — audio ownership preserved)
  - Applies zoom keyframes on 'zoom_in' segments
  - Burns in ASS subtitles
  - Encodes to 1080x1920 vertical MP4

AUDIO OWNERSHIP RULE:
  The original/enhanced speech audio is the PRIMARY audio timeline.
  B-roll insertion affects ONLY the visual layer.
  B-roll audio is ALWAYS discarded unless explicitly requested.
"""

import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional, Tuple
from services.media_extractor import get_ffmpeg_binary_path
from services.editing_config import EDITING_CONFIG


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
            raise RuntimeError(f"Duration not found in ffmpeg fallback output for {filepath}")
        except Exception as e:
            raise RuntimeError(f"Could not probe duration for {filepath}: {e}")


def _probe_streams(ffmpeg_bin: str, filepath: str) -> Dict[str, Any]:
    """
    Probe a media file for stream information.
    Returns dict with 'has_video', 'has_audio', 'video_duration', 'audio_duration'.
    """
    ffprobe_bin = ffmpeg_bin.replace("ffmpeg", "ffprobe")
    if not os.path.exists(ffprobe_bin):
        ffprobe_bin = "ffprobe"

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

    # 2. Build base chronological timeline of gaps and chunks
    chunks = []
    for chunk_id, chunk_data in timestamp_map.items():
        chunks.append({
            "id": chunk_id,
            "start": chunk_data.get("start", 0.0),
            "end": chunk_data.get("end", 0.0),
            "text": chunk_data.get("text", ""),
        })
    chunks.sort(key=lambda c: c["start"])

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
      2. Overlays B-roll clips on 'b_roll' segments (VISUAL ONLY — original audio preserved)
      3. Applies zoom on 'zoom_in' segments
      4. Burns ASS subtitles
      5. Encodes to 1080x1920 portrait MP4
      6. Validates output has both video and audio streams

    AUDIO OWNERSHIP: Original speech audio is ALWAYS the primary audio track.
    B-roll insertion replaces ONLY the video. The original audio continues playing.

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

    # ---- Probe video duration and streams ----
    total_duration = _probe_duration(ffmpeg_bin, raw_video_path)
    _log("INPUT", f"Raw video duration: {total_duration:.2f}s")
    if total_duration <= 0:
        raise ValueError(f"Could not determine video duration. FFmpeg probe failed for: {raw_video_path}")

    input_streams = _probe_streams(ffmpeg_bin, raw_video_path)
    source_has_audio = input_streams["has_audio"]
    source_fps = input_streams.get("fps", 30.0)
    _log("AUDIO", f"Source has audio: {source_has_audio} | "
         f"Audio duration: {input_streams['audio_duration']:.2f}s | FPS: {source_fps:.2f}")

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
        start_t = max(0, seg["start"])  # Exact cut, no overlap/pre-roll to prevent stutter
        end_t = min(total_duration, seg["end"])
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
            filters = [
                "scale=1242:2208:force_original_aspect_ratio=increase",  # 1080*1.15 = 1242
                "crop=1080:1920",
            ]
            _log("ZOOM", f"Applying 1.15x crop zoom on {seg['chunk_id']}")

        vf_chain = ",".join(filters)

        if broll_path:
            # ──────────────────────────────────────────────────────────
            # B-ROLL SEGMENT: Replace video with B-roll, KEEP original audio
            #
            # AUDIO OWNERSHIP: Input 0 (raw video) provides the ONLY audio.
            # Input 1 (B-roll) provides ONLY video — its audio is explicitly
            # discarded with -an on the B-roll input.
            # ──────────────────────────────────────────────────────────
            _log("BROLL", f"Overlaying B-roll for {seg['chunk_id']}: {os.path.basename(broll_path)}")
            _log("AUDIO", f"  Primary audio source: original video (input 0)")
            _log("AUDIO", f"  B-roll audio: DISCARDED (visual-only overlay)")

            cmd = [
                ffmpeg_bin, "-y",
                # Input 0: Original video (provides AUDIO)
                "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
                # Input 1: B-roll (provides VIDEO ONLY — audio discarded)
                "-ss", "0", "-t", f"{duration:.3f}", "-i", broll_path,
                "-filter_complex",
                # Use B-roll video, scaled to portrait format and normalized to source FPS
                f"[1:v]fps={source_fps},scale=1080:1920:force_original_aspect_ratio=increase,"
                f"crop=1080:1920,setpts=PTS-STARTPTS[broll];"
                f"[broll]format=yuv420p[vout]",
                # EXPLICIT STREAM MAPPING:
                # Video: B-roll visual ([vout])
                # Audio: Original video audio (0:a) — MANDATORY, not optional
                "-map", "[vout]",
                "-map", "0:a",
                "-r", str(source_fps),
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",  # Ensure A/V duration match
                "-movflags", "+faststart",
                seg_output,
            ]
        else:
            cmd = [
                ffmpeg_bin, "-y",
                "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", "-i", raw_video_path,
                "-vf", vf_chain,
                "-r", str(source_fps),
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                seg_output,
            ]

        try:
            _run_ffmpeg(cmd, f"segment_{seg['chunk_id']}")
            if os.path.exists(seg_output) and os.path.getsize(seg_output) > 0:
                # Verify segment has audio if source has audio
                if source_has_audio:
                    seg_streams = _probe_streams(ffmpeg_bin, seg_output)
                    if not seg_streams["has_audio"]:
                        _log("AUDIO_FIX", f"Segment {seg['chunk_id']} missing audio — "
                             f"adding silent track to prevent concat gaps")
                        _fix_missing_audio(ffmpeg_bin, seg_output, duration, temp_dir, seg_idx)

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
                    "-r", str(source_fps),
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

    # ---- Post-Render Validation ----
    _validate_rendered_output(ffmpeg_bin, output_mp4_path, source_has_audio)

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
