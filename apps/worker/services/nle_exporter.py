"""
NLE Timeline Exporter Service (Phase 2)
Exports AI edits, cut segments, motion graphics overlays, B-rolls, SFX cues, and subtitles
into professional non-destructive timelines for Adobe Premiere Pro, DaVinci Resolve, Final Cut Pro, and CapCut.

Supported Formats:
1. FCPXML 1.10 (.fcpxml): DaVinci Resolve 18+, Final Cut Pro 10.6+
2. FCP7 XML / xmeml 4 (.xml): Adobe Premiere Pro, DaVinci Resolve
3. CMX3600 EDL (.edl): Standard EDL for multi-platform editorial conformity
4. SRT Subtitles (.srt): Native subtitle track import for all NLEs
5. CapCut Guide (CAPCUT.md): Step-by-step instructions and timing table for CapCut
"""

import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from fractions import Fraction
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union


# ---------------------------------------------------------------------------
# Timing & Rational Time Helpers
# ---------------------------------------------------------------------------

def get_frame_rate(fps: float) -> Tuple[int, int]:
    """
    Returns (numerator, denominator) for frame rate.
    e.g. 29.97 -> (30000, 1001), 23.976 -> (24000, 1001), 30.0 -> (30, 1).
    """
    n = round(fps)
    if abs(fps - n * 1000 / 1001) < 0.005 and abs(fps - n) > 0.005:
        return n * 1000, 1001
    frac = Fraction(fps).limit_denominator(1001)
    return frac.numerator, frac.denominator


def seconds_to_frames(seconds: float, fps: float) -> int:
    return max(0, int(round(seconds * fps)))


def frames_to_seconds(frames: int, fps: float) -> float:
    return max(0.0, frames / fps)


def format_rational_time(frames: int, rate: Tuple[int, int]) -> str:
    """FCPXML rational time string, e.g. '1001/30000s' or '10/30s' or '0s'."""
    num, den = rate
    return f"{frames * den}/{num}s" if frames else "0s"


def format_timecode(frames: int, timebase: int) -> str:
    """Formats frames into SMPTE timecode string HH:MM:SS:FF."""
    s, f = divmod(int(frames), timebase)
    hours = s // 3600
    minutes = (s // 60) % 60
    seconds = s % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}:{f:02d}"


def format_srt_timestamp(seconds: float) -> str:
    """Formats seconds into SRT timestamp HH:MM:SS,mmm."""
    ms = int(round(max(0.0, seconds) * 1000))
    hours = ms // 3600000
    minutes = (ms // 60000) % 60
    secs = (ms // 1000) % 60
    millis = ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def path_to_uri(file_path: Union[str, Path]) -> str:
    """Converts a local file path into a file:// URI for NLE XMLs."""
    return Path(file_path).resolve().as_uri()


# ---------------------------------------------------------------------------
# Media Probing
# ---------------------------------------------------------------------------

def probe_media_file(media_path: str) -> Dict[str, Any]:
    """
    Probes video or audio file with ffprobe.
    Returns metadata dict: width, height, duration, fps, channels, sample_rate, timecode.
    """
    meta: Dict[str, Any] = {
        "duration": 0.0,
        "width": 1080,
        "height": 1920,
        "fps": 30.0,
        "channels": 2,
        "sample_rate": 48000,
        "timecode": None,
    }
    if not media_path or not os.path.exists(media_path):
        return meta

    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries",
            "format=duration:format_tags=timecode:stream=codec_type,width,height,r_frame_rate,sample_rate,channels:stream_tags=timecode",
            "-of", "json", str(media_path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            fmt = data.get("format", {})
            meta["duration"] = float(fmt.get("duration", 0.0) or 0.0)
            meta["timecode"] = (fmt.get("tags") or {}).get("timecode")

            for st in data.get("streams", []):
                ctype = st.get("codec_type")
                if ctype == "video":
                    if st.get("width"):
                        meta["width"] = int(st["width"])
                    if st.get("height"):
                        meta["height"] = int(st["height"])
                    r_rate = st.get("r_frame_rate")
                    if r_rate and "/" in r_rate:
                        num, den = r_rate.split("/")
                        if float(den) > 0:
                            meta["fps"] = float(num) / float(den)
                    if not meta["timecode"]:
                        meta["timecode"] = (st.get("tags") or {}).get("timecode")
                elif ctype == "audio":
                    if st.get("channels"):
                        meta["channels"] = int(st["channels"])
                    if st.get("sample_rate"):
                        meta["sample_rate"] = int(st["sample_rate"])
    except Exception as e:
        print(f"[NLE Exporter] Media probe warning: {e}")

    return meta


# ---------------------------------------------------------------------------
# Timeline Segment Resolution & Time Mapping
# ---------------------------------------------------------------------------

def resolve_kept_segments(
    total_duration: float,
    edits: List[Union[Dict[str, Any], Any]],
    timestamp_map: Optional[Dict[str, Any]] = None,
    fps: float = 30.0,
) -> Tuple[List[Dict[str, Any]], Callable[[float], Optional[float]]]:
    """
    Inverts cuts to determine kept source intervals, maps them to chronological
    timeline frames, and creates a mapping function from source_time -> timeline_time.
    """
    timestamp_map = timestamp_map or {}
    cut_intervals: List[Tuple[float, float]] = []

    for raw_e in edits:
        e = raw_e if isinstance(raw_e, dict) else (raw_e.model_dump() if hasattr(raw_e, "model_dump") else raw_e.__dict__)
        if e.get("action") == "cut":
            start = e.get("start")
            end = e.get("end")
            if start is not None and end is not None and float(start) < float(end):
                cut_intervals.append((float(start), float(end)))
            elif e.get("trigger_id") and e.get("trigger_id") in timestamp_map:
                chunk = timestamp_map[e["trigger_id"]]
                cs, ce = float(chunk.get("start", 0.0)), float(chunk.get("end", 0.0))
                if cs < ce:
                    cut_intervals.append((cs, ce))

    # Merge overlapping cuts
    cut_intervals.sort()
    merged_cuts: List[Tuple[float, float]] = []
    if cut_intervals:
        merged_cuts = [cut_intervals[0]]
        for cur in cut_intervals[1:]:
            prev = merged_cuts[-1]
            if cur[0] <= prev[1]:
                merged_cuts[-1] = (prev[0], max(prev[1], cur[1]))
            else:
                merged_cuts.append(cur)

    # Invert cuts into kept intervals over [0.0, total_duration]
    kept_raw: List[Tuple[float, float]] = []
    curr = 0.0
    for cs, ce in merged_cuts:
        if cs > curr:
            kept_raw.append((curr, min(total_duration, cs)))
        curr = max(curr, ce)
    if curr < total_duration:
        kept_raw.append((curr, total_duration))

    if not kept_raw:
        kept_raw = [(0.0, total_duration)]

    # Build kept segment descriptors with source & timeline frame indices
    kept_segments: List[Dict[str, Any]] = []
    timeline_sec = 0.0
    timeline_frames = 0

    for idx, (s_start, s_end) in enumerate(kept_raw):
        s_dur = max(0.01, s_end - s_start)
        s_start_f = seconds_to_frames(s_start, fps)
        s_end_f = seconds_to_frames(s_end, fps)
        dur_f = max(1, s_end_f - s_start_f)

        seg_info = {
            "seg_idx": idx,
            "source_start": s_start,
            "source_end": s_end,
            "source_duration": s_dur,
            "source_start_f": s_start_f,
            "source_end_f": s_end_f,
            "timeline_start": timeline_sec,
            "timeline_end": timeline_sec + s_dur,
            "timeline_start_f": timeline_frames,
            "timeline_end_f": timeline_frames + dur_f,
            "len_f": dur_f,
        }
        kept_segments.append(seg_info)
        timeline_sec += s_dur
        timeline_frames += dur_f

    def map_source_to_timeline(t_src: float) -> Optional[float]:
        for seg in kept_segments:
            if seg["source_start"] <= t_src <= seg["source_end"]:
                offset = t_src - seg["source_start"]
                return seg["timeline_start"] + offset
        # If inside a cut, find the nearest boundary
        for cs, ce in merged_cuts:
            if cs <= t_src <= ce:
                return None
        return min(timeline_sec, max(0.0, t_src))

    return kept_segments, map_source_to_timeline


# ---------------------------------------------------------------------------
# Track Items Collector
# ---------------------------------------------------------------------------

def collect_timeline_items(
    edits: List[Union[Dict[str, Any], Any]],
    timestamp_map: Dict[str, Any],
    map_time_fn: Callable[[float], Optional[float]],
    media_dir: Path,
    fps: float = 30.0,
    media_assets: Optional[Dict[str, str]] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Collects and maps motion graphics overlays, B-rolls, SFX sound cues, markers, and subtitles.
    """
    media_assets = media_assets or {}
    mg_overlays: List[Dict[str, Any]] = []
    broll_clips: List[Dict[str, Any]] = []
    sfx_cues: List[Dict[str, Any]] = []
    markers: List[Dict[str, Any]] = []
    subtitles: List[Dict[str, Any]] = []
    transitions: List[Dict[str, Any]] = []

    # 1. Process Edits
    for i, raw_e in enumerate(edits):
        e = raw_e if isinstance(raw_e, dict) else (raw_e.model_dump() if hasattr(raw_e, "model_dump") else raw_e.__dict__)
        action = e.get("action", "")
        t_src_start = float(e.get("start", 0.0) or 0.0)
        t_src_end = float(e.get("end", t_src_start + 1.0) or (t_src_start + 1.0))

        # Check trigger ID if timestamps aren't explicit
        if t_src_start == 0.0 and e.get("trigger_id") and e.get("trigger_id") in timestamp_map:
            t_data = timestamp_map[e["trigger_id"]]
            t_src_start = float(t_data.get("start", 0.0))
            t_src_end = float(t_data.get("end", t_src_start + 1.5))

        tl_start = map_time_fn(t_src_start)
        if tl_start is None:
            # Action occurs completely inside cut segment, skip
            continue

        tl_end = map_time_fn(t_src_end)
        if tl_end is None:
            tl_end = tl_start + max(0.5, t_src_end - t_src_start)
        dur = max(0.2, tl_end - tl_start)

        start_f = seconds_to_frames(tl_start, fps)
        len_f = max(1, seconds_to_frames(dur, fps))

        # Motion Graphics
        if action == "motion_graphics":
            mg_type = e.get("motion_graphics_type", "hero_reveal")
            mg_text = e.get("motion_graphics_text") or e.get("text") or mg_type
            file_key = e.get("rendered_path") or media_assets.get(f"mg_{i}") or media_assets.get(mg_type)
            dest_file = media_dir / f"mg_{len(mg_overlays) + 1:02d}.mov"
            if file_key and os.path.exists(file_key):
                try:
                    shutil.copy2(file_key, dest_file)
                    mov_path = str(dest_file)
                except Exception:
                    mov_path = str(file_key)
            else:
                mov_path = str(dest_file)

            layer_val = str(e.get("layer", "front")).lower()
            mg_overlays.append({
                "i": len(mg_overlays) + 1,
                "name": f"MG ({layer_val}): {mg_type}",
                "template": mg_type,
                "text": mg_text,
                "start_f": start_f,
                "len_f": len_f,
                "start_s": tl_start,
                "dur_s": dur,
                "path": mov_path,
                "lane": 1,
                "layer": layer_val,
            })

            # Add marker for motion graphics beat
            markers.append({
                "start_f": start_f,
                "text": f"Graphic [{layer_val}]: {mg_type} - {mg_text[:30]}",
            })

        # B-Roll
        elif action == "b_roll":
            broll_query = e.get("broll_query", "cutaway")
            file_key = e.get("broll_path") or media_assets.get(f"broll_{i}")
            dest_file = media_dir / f"broll_{len(broll_clips) + 1:02d}.mp4"
            if file_key and os.path.exists(file_key):
                try:
                    shutil.copy2(file_key, dest_file)
                    broll_path = str(dest_file)
                except Exception:
                    broll_path = str(file_key)
            else:
                broll_path = str(dest_file)

            broll_clips.append({
                "i": len(broll_clips) + 1,
                "name": f"B-Roll: {broll_query}",
                "query": broll_query,
                "start_f": start_f,
                "len_f": len_f,
                "start_s": tl_start,
                "dur_s": dur,
                "path": broll_path,
                "lane": 2,
            })

        # Sound Effects
        elif action == "sfx":
            sfx_name = e.get("sound_effect", "pop")
            sfx_file = media_dir / f"sfx_{len(sfx_cues) + 1:02d}.wav"
            # Attempt to use procedural synthesis if available
            try:
                from services.audio_sfx_synthesizer import synthesize_cue
                synthesize_cue(sfx_name, str(sfx_file))
            except Exception:
                # If synthesizer not available, fallback to empty touch file or placeholder
                if not sfx_file.exists():
                    sfx_file.touch()

            probe = probe_media_file(str(sfx_file))
            sfx_dur = probe["duration"] if probe["duration"] > 0 else 0.5
            sfx_len_f = max(1, seconds_to_frames(sfx_dur, fps))

            sfx_cues.append({
                "i": len(sfx_cues) + 1,
                "name": f"SFX: {sfx_name}",
                "sound_effect": sfx_name,
                "start_f": start_f,
                "len_f": sfx_len_f,
                "start_s": tl_start,
                "dur_s": sfx_dur,
                "path": str(sfx_file),
                "channels": probe["channels"] or 2,
                "rate": probe["sample_rate"] or 48000,
                "lane": 1,
            })

        # Transitions (Phase 4)
        elif action in ("transition", "add_transition") or e.get("type") == "add_transition":
            preset = e.get("preset", "crossfade")
            trans_dur = float(e.get("duration", 0.5) or 0.5)
            trans_start = tl_start if tl_start is not None else float(e.get("start", 0.0) or 0.0)
            transitions.append({
                "from_clip_id": e.get("from_clip_id") or e.get("fromClipId"),
                "to_clip_id": e.get("to_clip_id") or e.get("toClipId"),
                "preset": preset,
                "duration": trans_dur,
                "start_f": seconds_to_frames(trans_start, fps),
                "len_f": max(1, seconds_to_frames(trans_dur, fps)),
                "alignment": e.get("alignment", "center"),
            })

    # 2. Extract Subtitles & Markers from timestamp_map
    for tid, tdata in timestamp_map.items():
        if not isinstance(tdata, dict):
            continue
        ts_start = float(tdata.get("start", 0.0))
        ts_end = float(tdata.get("end", ts_start + 1.0))
        text = str(tdata.get("text", "")).strip()
        if not text:
            continue

        tl_s = map_time_fn(ts_start)
        tl_e = map_time_fn(ts_end)
        if tl_s is None or tl_e is None or tl_e <= tl_s:
            continue

        sf = seconds_to_frames(tl_s, fps)
        ef = seconds_to_frames(tl_e, fps)
        subtitles.append({
            "start_f": sf,
            "len_f": max(1, ef - sf),
            "start_s": tl_s,
            "end_s": tl_e,
            "text": text,
        })

    # Deduplicate and sort subtitles
    subtitles.sort(key=lambda s: s["start_s"])

    return mg_overlays, broll_clips, sfx_cues, markers, subtitles, transitions


# ---------------------------------------------------------------------------
# Format Writers: SRT, EDL, FCP7 XML (Premiere), FCPXML 1.10 (Resolve), CapCut
# ---------------------------------------------------------------------------

def generate_srt(subtitles: List[Dict[str, Any]]) -> str:
    """Generates standard SubRip (.srt) subtitle file."""
    lines = []
    for idx, sub in enumerate(subtitles, 1):
        start_ts = format_srt_timestamp(sub["start_s"])
        end_ts = format_srt_timestamp(sub["end_s"])
        lines.append(f"{idx}\n{start_ts} --> {end_ts}\n{sub['text']}\n")
    return "\n".join(lines)


def generate_cmx3600_edl(
    project_name: str,
    source_filename: str,
    kept_segments: List[Dict[str, Any]],
    timebase: int = 30,
) -> str:
    """Generates industry-standard CMX3600 EDL for the jump cuts."""
    lines = [
        f"TITLE: {project_name}",
        "FCM: NON-DROP FRAME",
        "",
    ]
    for seg in kept_segments:
        k = seg["seg_idx"] + 1
        src_in = format_timecode(seg["source_start_f"], timebase)
        src_out = format_timecode(seg["source_end_f"], timebase)
        tl_in = format_timecode(seg["timeline_start_f"], timebase)
        tl_out = format_timecode(seg["timeline_end_f"], timebase)
        lines.append(f"{k:03d}  AX       V     C        {src_in} {src_out} {tl_in} {tl_out}")
        lines.append(f"* FROM CLIP NAME: {source_filename}")
        lines.append("")
    return "\n".join(lines)


def generate_premiere_xmeml(
    project_name: str,
    width: int,
    height: int,
    fps: float,
    source_path: str,
    source_meta: Dict[str, Any],
    kept_segments: List[Dict[str, Any]],
    mg_overlays: List[Dict[str, Any]],
    broll_clips: List[Dict[str, Any]],
    sfx_cues: List[Dict[str, Any]],
    markers: List[Dict[str, Any]],
    transitions: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Generates Adobe Premiere Pro FCP7 XML (xmeml version 4).
    Organizes timeline onto multi-tracks:
    V1: Source cut camera takes with non-destructive in/out handles.
    V2: Motion graphics overlays (pre-rendered transparent MOVs).
    V3: B-Roll video overlays.
    A1: Camera dialog audio (linked to V1).
    A2: Sound effects cues.
    Sequence markers for every beat.
    """
    rate_num, rate_den = get_frame_rate(fps)
    timebase = round(fps)
    ntsc = "TRUE" if rate_den == 1001 else "FALSE"
    total_frames = sum(seg["len_f"] for seg in kept_segments)
    src_total_frames = max(1, seconds_to_frames(source_meta["duration"], fps))
    source_p = Path(source_path).resolve()

    root = ET.Element("xmeml", version="4")
    seq = ET.SubElement(root, "sequence", id="sequence-1")
    ET.SubElement(seq, "name").text = project_name
    ET.SubElement(seq, "duration").text = str(total_frames)

    def add_rate(parent: ET.Element):
        r = ET.SubElement(parent, "rate")
        ET.SubElement(r, "timebase").text = str(timebase)
        ET.SubElement(r, "ntsc").text = ntsc

    add_rate(seq)
    media_el = ET.SubElement(seq, "media")
    video_el = ET.SubElement(media_el, "video")
    audio_el = ET.SubElement(media_el, "audio")

    # Video Format
    fmt = ET.SubElement(video_el, "format")
    sc = ET.SubElement(fmt, "samplecharacteristics")
    add_rate(sc)
    ET.SubElement(sc, "width").text = str(width)
    ET.SubElement(sc, "height").text = str(height)
    ET.SubElement(sc, "pixelaspectratio").text = "square"

    files_cache: Dict[str, str] = {}

    def add_file_el(parent: ET.Element, fpath: str, dur_frames: int, has_video: bool = True, audio_channels: int = 0):
        key = str(fpath)
        if key in files_cache:
            ET.SubElement(parent, "file", id=files_cache[key])
            return
        fid = f"file-{len(files_cache) + 1}"
        files_cache[key] = fid
        f = ET.SubElement(parent, "file", id=fid)
        p = Path(fpath)
        ET.SubElement(f, "name").text = p.name
        ET.SubElement(f, "pathurl").text = path_to_uri(p)
        add_rate(f)
        ET.SubElement(f, "duration").text = str(dur_frames)
        m = ET.SubElement(f, "media")
        if has_video:
            v_sc = ET.SubElement(ET.SubElement(m, "video"), "samplecharacteristics")
            ET.SubElement(v_sc, "width").text = str(width)
            ET.SubElement(v_sc, "height").text = str(height)
        if audio_channels > 0:
            au = ET.SubElement(m, "audio")
            ET.SubElement(au, "channelcount").text = str(audio_channels)

    def add_clipitem(track: ET.Element, cid: str, name: str, start_f: int, len_f: int, in_f: int, fpath: str, total_f: int, is_video: bool = True, audio_channels: int = 0) -> ET.Element:
        c = ET.SubElement(track, "clipitem", id=cid)
        ET.SubElement(c, "name").text = name
        ET.SubElement(c, "enabled").text = "TRUE"
        ET.SubElement(c, "duration").text = str(total_f)
        add_rate(c)
        ET.SubElement(c, "start").text = str(start_f)
        ET.SubElement(c, "end").text = str(start_f + len_f)
        ET.SubElement(c, "in").text = str(in_f)
        ET.SubElement(c, "out").text = str(in_f + len_f)
        add_file_el(c, fpath, total_f, has_video=is_video, audio_channels=audio_channels)
        return c

    # V1: Source Video Cuts & A1: Dialog Audio
    v1_track = ET.SubElement(video_el, "track")
    a1_track = ET.SubElement(audio_el, "track")

    for seg in kept_segments:
        k = seg["seg_idx"] + 1
        v_clip = add_clipitem(
            v1_track, f"v-{k}", f"{source_p.name} [{k}]",
            seg["timeline_start_f"], seg["len_f"], seg["source_start_f"],
            str(source_p), src_total_frames, is_video=True, audio_channels=source_meta.get("channels", 2)
        )
        a_clip = add_clipitem(
            a1_track, f"a-{k}", f"{source_p.name} [{k}]",
            seg["timeline_start_f"], seg["len_f"], seg["source_start_f"],
            str(source_p), src_total_frames, is_video=False, audio_channels=source_meta.get("channels", 2)
        )
        # Link video and audio clip
        st = ET.SubElement(a_clip, "sourcetrack")
        ET.SubElement(st, "mediatype").text = "audio"
        ET.SubElement(st, "trackindex").text = "1"
        for clip_el, other_id in ((v_clip, f"a-{k}"), (a_clip, f"v-{k}")):
            lk = ET.SubElement(clip_el, "link")
            ET.SubElement(lk, "linkclipref").text = other_id
            ET.SubElement(lk, "mediatype").text = "audio" if clip_el == v_clip else "video"
            ET.SubElement(lk, "trackindex").text = "1"
            ET.SubElement(lk, "clipindex").text = str(k)

    # V1 Transitions (Phase 4)
    for tr in (transitions or []):
        trans_item = ET.SubElement(v1_track, "transitionitem")
        ET.SubElement(trans_item, "start").text = str(tr["start_f"])
        ET.SubElement(trans_item, "end").text = str(tr["start_f"] + tr["len_f"])
        ET.SubElement(trans_item, "alignment").text = tr.get("alignment", "center")
        eff = ET.SubElement(trans_item, "effect")
        p_name = tr.get("preset", "crossfade").replace("_", " ").title()
        ET.SubElement(eff, "name").text = p_name
        ET.SubElement(eff, "effectid").text = tr.get("preset", "crossfade")
        ET.SubElement(eff, "effectcategory").text = "Dissolve" if "fade" in tr.get("preset", "") else "Wipe"
        ET.SubElement(eff, "effecttype").text = "transition"
        ET.SubElement(eff, "mediatype").text = "video"

    # V2: Motion Graphics Overlays
    if mg_overlays:
        v2_track = ET.SubElement(video_el, "track")
        for mg in mg_overlays:
            add_clipitem(
                v2_track, f"mg-{mg['i']}", mg["name"],
                mg["start_f"], mg["len_f"], 0,
                mg["path"], mg["len_f"], is_video=True
            )

    # V3: B-Roll Clips
    if broll_clips:
        v3_track = ET.SubElement(video_el, "track")
        for broll in broll_clips:
            add_clipitem(
                v3_track, f"broll-{broll['i']}", broll["name"],
                broll["start_f"], broll["len_f"], 0,
                broll["path"], broll["len_f"], is_video=True
            )

    # A2: SFX Audio Track
    if sfx_cues:
        a2_track = ET.SubElement(audio_el, "track")
        for sfx in sfx_cues:
            add_clipitem(
                a2_track, f"sfx-{sfx['i']}", sfx["name"],
                sfx["start_f"], sfx["len_f"], 0,
                sfx["path"], sfx["len_f"], is_video=False, audio_channels=sfx.get("channels", 2)
            )

    # Sequence Markers
    for m in markers:
        mk = ET.SubElement(seq, "marker")
        ET.SubElement(mk, "name").text = m["text"][:60]
        ET.SubElement(mk, "comment").text = m["text"]
        ET.SubElement(mk, "in").text = str(m["start_f"])
        ET.SubElement(mk, "out").text = "-1"

    ET.indent(root)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n' + ET.tostring(root, encoding="unicode") + "\n"


def generate_fcpxml_1_10(
    project_name: str,
    width: int,
    height: int,
    fps: float,
    source_path: str,
    source_meta: Dict[str, Any],
    kept_segments: List[Dict[str, Any]],
    mg_overlays: List[Dict[str, Any]],
    broll_clips: List[Dict[str, Any]],
    sfx_cues: List[Dict[str, Any]],
    markers: List[Dict[str, Any]],
    subtitles: Optional[List[Dict[str, Any]]] = None,
    transitions: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """
    Generates Apple FCPXML 1.10 for DaVinci Resolve 18+ and Final Cut Pro.
    Supports primary spine for raw cuts and anchored clips for overlays, sound effects, and titles.
    """
    subtitles = subtitles or []
    rate = get_frame_rate(fps)
    timebase = round(fps)
    T = lambda f: format_rational_time(f, rate)
    total_frames = sum(seg["len_f"] for seg in kept_segments)
    src_total_frames = max(1, seconds_to_frames(source_meta["duration"], fps))
    source_p = Path(source_path).resolve()

    root = ET.Element("fcpxml", version="1.10")
    resources = ET.SubElement(root, "resources")

    if transitions:
        ET.SubElement(resources, "effect", id="r_crossfade", name="Cross Dissolve")

    # Format definitions
    ET.SubElement(resources, "format", id="r_seq_fmt", name=f"FFVideoFormat{width}x{height}p{timebase}",
                  frameDuration=T(1), width=str(width), height=str(height))
    ET.SubElement(resources, "format", id="r_src_fmt", frameDuration=T(1),
                  width=str(source_meta["width"]), height=str(source_meta["height"]))

    # Primary raw video asset
    src_asset = ET.SubElement(resources, "asset", id="r_src", name=source_p.stem,
                              start="0s", duration=T(src_total_frames),
                              hasVideo="1", format="r_src_fmt",
                              hasAudio="1" if source_meta.get("channels") else "0",
                              videoSources="1", audioSources="1",
                              audioChannels=str(source_meta.get("channels") or 2),
                              audioRate=str(source_meta.get("sample_rate") or 48000))
    ET.SubElement(src_asset, "media-rep", kind="original-media", src=path_to_uri(source_p))

    # Basic Title Effect
    TITLE_UID = ".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"
    ET.SubElement(resources, "effect", id="r_title_fx", name="Basic Title", uid=TITLE_UID)

    # Register assets for MG, B-Roll, and SFX
    asset_counter = 1
    for item in mg_overlays + broll_clips + sfx_cues:
        p = Path(item["path"])
        rid = f"r_asset_{asset_counter}"
        asset_counter += 1
        item["rid"] = rid

        is_audio = item in sfx_cues
        kw: Dict[str, str] = {
            "id": rid,
            "name": p.stem,
            "start": "0s",
            "duration": T(item["len_f"]),
        }
        if is_audio:
            kw.update(hasAudio="1", audioSources="1", audioChannels=str(item.get("channels", 2)),
                      audioRate=str(item.get("sample_rate", 48000)))
        else:
            fmt_id = f"r_fmt_{asset_counter}"
            asset_counter += 1
            ET.SubElement(resources, "format", id=fmt_id, frameDuration=T(1), width=str(width), height=str(height))
            kw.update(hasVideo="1", format=fmt_id, videoSources="1")

        asset_el = ET.SubElement(resources, "asset", **kw)
        ET.SubElement(asset_el, "media-rep", kind="original-media", src=path_to_uri(p))

    # Library / Event / Project / Sequence
    lib = ET.SubElement(root, "library")
    ev = ET.SubElement(lib, "event", name=f"AI Edit - {project_name}")
    pj = ET.SubElement(ev, "project", name=project_name)
    seq = ET.SubElement(pj, "sequence", format="r_seq_fmt", duration=T(total_frames),
                        tcStart="0s", tcFormat="NDF", audioLayout="stereo", audioRate="48k")
    spine = ET.SubElement(seq, "spine")

    # Spine primary clips (the jump cut)
    spine_clips: List[ET.Element] = []
    for k, seg in enumerate(kept_segments):
        c = ET.SubElement(spine, "asset-clip", ref="r_src", name=f"{source_p.stem} [{k + 1}]",
                          offset=T(seg["timeline_start_f"]),
                          start=T(seg["source_start_f"]),
                          duration=T(seg["len_f"]),
                          format="r_src_fmt", tcFormat="NDF")
        spine_clips.append(c)

    # Spine Transitions (Phase 4)
    for tr in (transitions or []):
        p_name = tr.get("preset", "crossfade").replace("_", " ").title()
        t_el = ET.SubElement(spine, "transition", name=p_name, offset=T(tr["start_f"]), duration=T(tr["len_f"]))
        ET.SubElement(t_el, "filter-video", ref="r_crossfade", name=p_name)

    # Attach overlays, audio cues, markers to the primary clip covering their start time
    anchors: Dict[int, List[ET.Element]] = {k: [] for k in range(len(spine_clips))}

    def get_spine_index(frame: int) -> Tuple[int, int]:
        for idx, seg in enumerate(kept_segments):
            if seg["timeline_start_f"] <= frame < seg["timeline_end_f"]:
                return idx, seg["source_start_f"] + (frame - seg["timeline_start_f"])
        last_idx = len(kept_segments) - 1
        seg = kept_segments[last_idx]
        return last_idx, seg["source_start_f"] + max(0, frame - seg["timeline_start_f"])

    # Overlays (Lane 1 & 2)
    for mg in mg_overlays:
        if not mg.get("rid"): continue
        k, off_f = get_spine_index(mg["start_f"])
        el = ET.Element("asset-clip", ref=mg["rid"], lane="1", offset=T(off_f),
                        name=mg["name"], start="0s", duration=T(mg["len_f"]))
        anchors[k].append(el)

    for broll in broll_clips:
        if not broll.get("rid"): continue
        k, off_f = get_spine_index(broll["start_f"])
        el = ET.Element("asset-clip", ref=broll["rid"], lane="2", offset=T(off_f),
                        name=broll["name"], start="0s", duration=T(broll["len_f"]))
        anchors[k].append(el)

    # SFX Cues (Lane -1)
    for sfx in sfx_cues:
        if not sfx.get("rid"): continue
        k, off_f = get_spine_index(sfx["start_f"])
        el = ET.Element("asset-clip", ref=sfx["rid"], lane="-1", offset=T(off_f),
                        name=sfx["name"], start="0s", duration=T(sfx["len_f"]))
        anchors[k].append(el)

    # Captions / Titles (Lane 3)
    for j, cap in enumerate(subtitles[:100], 1):  # Cap titles to first 100 chunks for clean import
        k, off_f = get_spine_index(cap["start_f"])
        t_el = ET.Element("title", ref="r_title_fx", lane="3", offset=T(off_f),
                          name=cap["text"][:30], start="0s", duration=T(cap["len_f"]))
        txt = ET.SubElement(t_el, "text")
        ET.SubElement(txt, "text-style", ref=f"ts_{j}").text = cap["text"]
        ts_def = ET.SubElement(t_el, "text-style-def", id=f"ts_{j}")
        ET.SubElement(ts_def, "text-style", font="Helvetica", fontSize="48",
                      fontColor="1 1 1 1", bold="1", alignment="center")
        anchors[k].append(t_el)

    # Markers
    for m in markers:
        k, off_f = get_spine_index(m["start_f"])
        anchors[k].append(ET.Element("marker", start=T(off_f), duration=T(1), value=m["text"][:120]))

    # Append all anchored elements to their spine clips
    for k, clip_el in enumerate(spine_clips):
        clip_el.extend(anchors[k])

    ET.indent(root)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n' + ET.tostring(root, encoding="unicode") + "\n"


def generate_capcut_markdown(
    project_name: str,
    width: int,
    height: int,
    fps: float,
    kept_segments: List[Dict[str, Any]],
    mg_overlays: List[Dict[str, Any]],
    broll_clips: List[Dict[str, Any]],
    sfx_cues: List[Dict[str, Any]],
) -> str:
    """
    Generates a clear step-by-step editorial guide for CapCut desktop and mobile users.
    CapCut does not support timeline XML import, so this guide provides an exact recreation table.
    """
    total_dur = sum(seg["source_duration"] for seg in kept_segments)

    mg_rows = [
        f"| {mg['i']} | `{Path(mg['path']).name}` | {mg['start_s']:.2f}s | {mg['start_s'] + mg['dur_s']:.2f}s | Overlay Track 1 |"
        for mg in mg_overlays
    ]
    broll_rows = [
        f"| {broll['i']} | `{Path(broll['path']).name}` | {broll['start_s']:.2f}s | {broll['start_s'] + broll['dur_s']:.2f}s | Overlay Track 2 |"
        for broll in broll_clips
    ]
    sfx_rows = [
        f"| {sfx['i']} | `{Path(sfx['path']).name}` | {sfx['start_s']:.2f}s | Audio Track 2 |"
        for sfx in sfx_cues
    ]

    return f"""# {project_name} — CapCut Rebuild Guide

CapCut does not have a native XML/EDL timeline import API. Follow these 4 simple steps to assemble this project in under 3 minutes:

### 1. New Project Setup
- **Resolution**: `{width}x{height}` ({'9:16 Vertical' if height > width else '16:9 Landscape'})
- **Framerate**: `{fps:.2f} fps`
- **Total Duration**: `{total_dur:.2f} seconds`

### 2. Import Assets
1. Drag the source cut clip onto the **Main Track (Track 1)**.
2. In the `Captions` panel, select **Add Captions > Import Local Subtitle** and choose `{project_name}.srt`.
3. Drag the files from the `media/` directory into your project bin.

### 3. Overlay Elements Placement
| # | File Name | Start Time | End Time | Recommended Track |
|---|---|---|---|---|
{chr(10).join(mg_rows) if mg_rows else '| - | No motion graphics | - | - | - |'}
{chr(10).join(broll_rows) if broll_rows else ''}

### 4. Audio & SFX Placement
| # | Sound Cue | Trigger Time | Recommended Track |
|---|---|---|---|
{chr(10).join(sfx_rows) if sfx_rows else '| - | No SFX cues | - | - |'}

---
*Generated automatically by AI Content Manager NLE Exporter.*
"""


# ---------------------------------------------------------------------------
# High-Level Project Packager
# ---------------------------------------------------------------------------

def export_nle_project(
    output_dir: str,
    project_name: str,
    raw_video_path: str,
    edits: List[Union[Dict[str, Any], Any]],
    timestamp_map: Optional[Dict[str, Any]] = None,
    settings: Optional[Dict[str, Any]] = None,
    media_assets: Optional[Dict[str, str]] = None,
    create_zip: bool = True,
) -> Dict[str, Any]:
    """
    Main entry point for Phase 2:
    Takes an edit plan and generates full multi-track export packages for
    Premiere Pro, DaVinci Resolve, Final Cut Pro, and CapCut.
    """
    settings = settings or {}
    timestamp_map = timestamp_map or {}
    media_assets = media_assets or {}

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    media_dir = out_path / "media"
    media_dir.mkdir(parents=True, exist_ok=True)

    # Probe source media
    meta = probe_media_file(raw_video_path)
    fps = float(settings.get("fps") or meta.get("fps") or 30.0)
    timebase = round(fps)
    width = int(settings.get("width") or meta.get("width") or 1080)
    height = int(settings.get("height") or meta.get("height") or 1920)

    # Inferred duration fallback if meta["duration"] is 0 (mock file or probe unavailable)
    dur = float(meta.get("duration", 0.0) or 0.0)
    if dur <= 0.0:
        max_t = 0.0
        for e in edits:
            e_dict = e if isinstance(e, dict) else (e.model_dump() if hasattr(e, "model_dump") else e.__dict__)
            max_t = max(max_t, float(e_dict.get("end") or e_dict.get("start") or 0.0))
        for tdata in timestamp_map.values():
            if isinstance(tdata, dict):
                max_t = max(max_t, float(tdata.get("end") or tdata.get("start") or 0.0))
        dur = max(max_t + 1.0, float(settings.get("duration") or 10.0))
        meta["duration"] = dur

    # Resolve kept cuts
    kept_segments, map_time_fn = resolve_kept_segments(
        total_duration=meta["duration"],
        edits=edits,
        timestamp_map=timestamp_map,
        fps=fps,
    )

    # Collect overlays, B-rolls, SFX cues, markers, subtitles, and transitions
    mg_overlays, broll_clips, sfx_cues, markers, subtitles, transitions = collect_timeline_items(
        edits=edits,
        timestamp_map=timestamp_map,
        map_time_fn=map_time_fn,
        media_dir=media_dir,
        fps=fps,
        media_assets=media_assets,
    )

    clean_name = re.sub(r"[^\w\-_]", "_", project_name) or "video_project"

    # 1. Write SRT Subtitles
    srt_content = generate_srt(subtitles)
    srt_file = out_path / f"{clean_name}.srt"
    srt_file.write_text(srt_content, encoding="utf-8")

    # 2. Write CMX3600 EDL
    edl_content = generate_cmx3600_edl(
        project_name=clean_name,
        source_filename=Path(raw_video_path).name,
        kept_segments=kept_segments,
        timebase=timebase,
    )
    edl_file = out_path / f"{clean_name}.edl"
    edl_file.write_text(edl_content, encoding="utf-8")

    # 3. Write Premiere Pro XML (xmeml 4)
    xmeml_content = generate_premiere_xmeml(
        project_name=clean_name,
        width=width,
        height=height,
        fps=fps,
        source_path=raw_video_path,
        source_meta=meta,
        kept_segments=kept_segments,
        mg_overlays=mg_overlays,
        broll_clips=broll_clips,
        sfx_cues=sfx_cues,
        markers=markers,
        transitions=transitions,
    )
    xml_file = out_path / f"{clean_name}.xml"
    xml_file.write_text(xmeml_content, encoding="utf-8")

    # 4. Write DaVinci Resolve & FCPX FCPXML (1.10)
    fcpxml_content = generate_fcpxml_1_10(
        project_name=clean_name,
        width=width,
        height=height,
        fps=fps,
        source_path=raw_video_path,
        source_meta=meta,
        kept_segments=kept_segments,
        mg_overlays=mg_overlays,
        broll_clips=broll_clips,
        sfx_cues=sfx_cues,
        markers=markers,
        subtitles=subtitles,
        transitions=transitions,
    )
    fcpxml_file = out_path / f"{clean_name}.fcpxml"
    fcpxml_file.write_text(fcpxml_content, encoding="utf-8")

    # 5. Write CapCut Rebuild Guide
    capcut_content = generate_capcut_markdown(
        project_name=clean_name,
        width=width,
        height=height,
        fps=fps,
        kept_segments=kept_segments,
        mg_overlays=mg_overlays,
        broll_clips=broll_clips,
        sfx_cues=sfx_cues,
    )
    capcut_file = out_path / "CAPCUT.md"
    capcut_file.write_text(capcut_content, encoding="utf-8")

    # 6. Optional ZIP Archive
    zip_path = None
    if create_zip:
        zip_file = out_path.parent / f"{clean_name}_nle_export.zip"
        with zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED) as zf:
            for root_d, _, files in os.walk(out_path):
                for f in files:
                    full_p = Path(root_d) / f
                    rel_p = full_p.relative_to(out_path.parent)
                    zf.write(full_p, arcname=str(rel_p))
        zip_path = str(zip_file)

    return {
        "status": "success",
        "project_name": clean_name,
        "export_dir": str(out_path),
        "zip_path": zip_path,
        "files": {
            "fcpxml": str(fcpxml_file),
            "premiere_xml": str(xml_file),
            "edl": str(edl_file),
            "srt": str(srt_file),
            "capcut_md": str(capcut_file),
        },
        "stats": {
            "cuts_count": len(kept_segments),
            "motion_graphics_count": len(mg_overlays),
            "broll_count": len(broll_clips),
            "sfx_count": len(sfx_cues),
            "markers_count": len(markers),
            "subtitles_count": len(subtitles),
        }
    }
