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
import shutil
import subprocess
import tempfile
import json
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


def _run_ffmpeg(cmd: List[str], label: str) -> subprocess.CompletedProcess:
    """Run an FFmpeg command, log it, and raise on failure."""
    final_cmd = list(cmd)
    if "-threads" not in final_cmd:
        # Cap to 2 CPU threads to leave headroom for OS window manager and UI apps
        final_cmd[1:1] = ["-threads", "2"]
    if "-hide_banner" not in final_cmd:
        final_cmd[1:1] = ["-hide_banner"]
        
    _log("CMD", f"({label}) {' '.join(final_cmd[:8])}... ({len(final_cmd)} args)")
    result = subprocess.run(final_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        stderr_text = result.stderr or ""
        # The actual error is usually at the end of the FFmpeg output
        stderr_preview = stderr_text[-2000:] if len(stderr_text) > 2000 else stderr_text
        _log("STDERR", f"({label}) {stderr_preview}")
        raise RuntimeError(
            f"FFmpeg failed for '{label}' (exit code {result.returncode}):\n{stderr_preview}"
        )
    return result

def _render_canvas_composition(comp_id: str, props: dict, duration_sec: float, fps: float, width: int, height: int, temp_dir: str, prefix: str) -> Optional[str]:
    """Spawns Node.js Canvas renderer to generate a transparent WebM overlay."""
    out_path = os.path.join(temp_dir, f"{prefix}.mov")
    frames = int(duration_sec * fps)
    
    # Add componentId to props so the Node script knows what to draw
    props["componentId"] = comp_id
    props_json = json.dumps(props)
    
    motion_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packages/motion-components"))
    if not os.path.exists(motion_dir):
        motion_dir = "/app/packages/motion-components"
        
    cmd = [
        "node", "render_canvas.js",
        out_path,
        str(frames),
        str(int(fps)),
        str(width),
        str(height),
        props_json
    ]
    
    _log("CANVAS", f"Rendering {comp_id} to {out_path} ({frames} frames @ {fps}fps)")
    result = subprocess.run(cmd, cwd=motion_dir, capture_output=True, text=True)
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

    timeline = _build_segment_timeline(edits, timestamp_map, total_duration)
    kept_segments = [s for s in timeline if not s["is_cut"]]

    temp_dir = os.path.dirname(os.path.abspath(output_mp4_path))

    if not kept_segments:
        kept_segments = [{"start": 0.0, "end": total_duration, "chunk_id": "FULL", "actions": [], "is_cut": False}]

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
            zoom_w, zoom_h = int(target_w * 1.15), int(target_h * 1.15)
            base_scale = f"scale={zoom_w}:{zoom_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
            
        filter_str.append(f"[base_v]{base_scale}[norm_v];")
        current_v = "[norm_v]"

        broll_path = None
        if "b_roll" in action_types:
            for a in seg["actions"]:
                if a["action"] == "b_roll" and a.get("trigger_id") in broll_map:
                    candidate = broll_map[a["trigger_id"]]
                    if os.path.exists(candidate) and os.path.getsize(candidate) > 1024:
                        broll_path = candidate
                        break

        motion_graphics_text = None
        character_action = None
        has_sfx = False
        sfx_keyword = "pop"

        for a in seg["actions"]:
            if a.get("action") == "motion_graphics" or a.get("motion_graphics_text"):
                motion_graphics_text = a.get("motion_graphics_text")
                mg_template = a.get("template", "MotionGraphicsPreview")
                mg_props = {"text": motion_graphics_text}
                if a.get("visual_beats"): mg_props["visual_beats"] = a.get("visual_beats")
                if a.get("transition"): mg_props["transition"] = a.get("transition")
            
            if a.get("action") == "character" or a.get("character_action"):
                character_action = a.get("character_action")
                char_props_overrides = {}
                if a.get("visual_beats"): char_props_overrides["visual_beats"] = a.get("visual_beats")
                if a.get("transition"): char_props_overrides["transition"] = a.get("transition")
            
            if a.get("action") == "sfx" or a.get("sound_effect"):
                has_sfx = True
                sfx_keyword = a.get("sound_effect", "pop")

        mg_path = None
        if motion_graphics_text:
            mg_path = _render_canvas_composition(
                mg_template, mg_props,
                duration, source_fps, target_w, target_h, temp_dir, f"mg_{seg['chunk_id']}"
            )

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
                overlay_x = "if(lte(t,0.5), -w+(w/0.5)*t, 0)"
                
            filter_str.append(f"{current_v}[broll_v]overlay=x={overlay_x}:y={overlay_y}:eof_action=pass[with_broll];")
            current_v = "[with_broll]"
            input_idx += 1
            
        if mg_path:
            cmd.extend(["-i", mg_path])
            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[mg_v];")
            filter_str.append(f"{current_v}[mg_v]overlay=x=0:y=0:eof_action=pass[with_mg];")
            current_v = "[with_mg]"
            input_idx += 1
            
        if character_video_path and os.path.exists(character_video_path):
            cmd.extend(["-i", character_video_path])
            char_idx = input_idx
            # Trim the 3D character WebM exactly like the raw video so lip sync matches the cut segments
            filter_str.append(f"[{char_idx}:v]trim=start={start_t:.3f}:end={end_t:.3f},setpts=PTS-STARTPTS[char_v_trim];")
            
            char_scale = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
            if "zoom_in" in action_types:
                zoom_w, zoom_h = int(target_w * 1.15), int(target_h * 1.15)
                char_scale = f"scale={zoom_w}:{zoom_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
                
            filter_str.append(f"[char_v_trim]{char_scale}[char_v_scaled];")
            filter_str.append(f"{current_v}[char_v_scaled]overlay=x=0:y=0:eof_action=pass[with_char];")
            current_v = "[with_char]"
            input_idx += 1
            
        if has_sfx:
            sfx_path = os.path.join(temp_dir, f"sfx_{seg['chunk_id']}.wav")
            sfx_fetched = fetch_sfx(sfx_keyword, sfx_path) if sfx_keyword else False
            if not sfx_fetched:
                sfx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../apps/web/public/assets/audio/pop.wav"))
            if os.path.exists(sfx_path):
                cmd.extend(["-i", sfx_path])
                filter_str.append(f"[{input_idx}:a]adelay=0|0[sfx_a];")
                filter_str.append(f"{current_a}[sfx_a]amix=inputs=2:duration=first:dropout_transition=2[a_out_sfx];")
                current_a = "[a_out_sfx]"
                input_idx += 1
                
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

        _log("FFMPEG", f"Rendering segment {seg_idx+1}/{len(kept_segments)}")
        try:
            _run_ffmpeg(cmd, f"render_segment_{seg_idx}")
            segment_files.append(segment_mp4)
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

    _validate_rendered_output(ffmpeg_bin, output_mp4_path, source_has_audio)

    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if (file.endswith('.mov') and (file.startswith('char_') or file.startswith('mg_'))) or file.startswith('segment_') or file.startswith('filter_'):
                try:
                    os.remove(os.path.join(root, file))
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
