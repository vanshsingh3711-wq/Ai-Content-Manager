import re

with open("services/compositor.py", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("def render_video_pipeline(")
end_idx = content.find("def _fix_missing_audio(")

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    exit(1)

new_func = """def render_video_pipeline(
    raw_video_path: str,
    output_mp4_path: str,
    subtitle_ass_path: Optional[str] = None,
    broll_map: Optional[Dict[str, str]] = None,
    edits: Optional[List[Dict[str, Any]]] = None,
    timestamp_map: Optional[Dict[str, Any]] = None,
    settings: Optional[Dict[str, Any]] = None,
) -> str:
    \"\"\"
    Composites the final video using a single-pass FFmpeg filter complex.
    This entirely prevents the `concat demuxer` audio gap/stutter bug.
    \"\"\"
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

    cmd = [ffmpeg_bin, "-y", "-i", raw_video_path]
    input_idx = 1
    
    filter_str = []
    concat_v = []
    concat_a = []
    
    _log("RENDER", "Building single-pass FFmpeg filtergraph...")

    for seg_idx, seg in enumerate(kept_segments):
        start_t = max(0, seg["start"])
        end_t = min(total_duration, seg["end"])
        duration = end_t - start_t
        if duration <= 0.05:
            continue
            
        action_types = {a["action"] for a in seg["actions"]}

        filter_str.append(f"[0:v]trim=start={start_t:.3f}:end={end_t:.3f},setpts=PTS-STARTPTS[base_v_{seg_idx}];")
        
        if source_has_audio:
            filter_str.append(f"[0:a]atrim=start={start_t:.3f}:end={end_t:.3f},asetpts=PTS-STARTPTS[base_a_{seg_idx}];")
            current_a = f"[base_a_{seg_idx}]"
        else:
            filter_str.append(f"anullsrc=d={duration:.3f}:r=44100:cl=stereo[base_a_{seg_idx}];")
            current_a = f"[base_a_{seg_idx}]"

        base_scale = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
        if "zoom_in" in action_types:
            zoom_w, zoom_h = int(target_w * 1.15), int(target_h * 1.15)
            base_scale = f"scale={zoom_w}:{zoom_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
            
        filter_str.append(f"[base_v_{seg_idx}]{base_scale}[norm_v_{seg_idx}];")
        current_v = f"[norm_v_{seg_idx}]"

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
            if a["action"] == "motion_graphics":
                motion_graphics_text = a.get("motion_graphics_text")
                mg_template = a.get("template", "MotionGraphicsPreview")
            elif a["action"] == "character":
                character_action = a.get("character_action")
            elif a["action"] == "sfx":
                has_sfx = True
                sfx_keyword = a.get("sound_effect", "pop")

        mg_path = None
        if motion_graphics_text:
            mg_path = _render_canvas_composition(
                mg_template, {"text": motion_graphics_text},
                duration, source_fps, target_w, target_h, temp_dir, f"mg_{seg['chunk_id']}"
            )
            
        char_path = None
        if character_action:
            char_props = {"isTalking": True, "isBlinking": True, "expression": "neutral", "gesture": "none"}
            action_lower = character_action.lower()
            if "surprised" in action_lower: char_props.update({"expression": "surprised", "gesture": "emphasize"})
            elif "point" in action_lower: char_props["gesture"] = "pointRight"
            elif "explain" in action_lower: char_props.update({"gesture": "present", "isNodding": True})
            char_component = settings.get("character_asset", "SvgCharacterPreview")
            char_path = _render_canvas_composition(
                char_component, char_props,
                duration, source_fps, target_w, target_h, temp_dir, f"char_{seg['chunk_id']}"
            )

        if broll_path:
            cmd.extend(["-an", "-i", broll_path])
            filter_str.append(f"[{input_idx}:v]fps={source_fps},scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},setpts=PTS-STARTPTS[broll_v_{seg_idx}];")
            filter_str.append(f"{current_v}[broll_v_{seg_idx}]overlay=x=0:y=0:eof_action=pass[with_broll_{seg_idx}];")
            current_v = f"[with_broll_{seg_idx}]"
            input_idx += 1
            
        if mg_path:
            cmd.extend(["-i", mg_path])
            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[mg_v_{seg_idx}];")
            filter_str.append(f"{current_v}[mg_v_{seg_idx}]overlay=x=0:y=0:eof_action=pass[with_mg_{seg_idx}];")
            current_v = f"[with_mg_{seg_idx}]"
            input_idx += 1
            
        if char_path:
            cmd.extend(["-i", char_path])
            filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[char_v_{seg_idx}];")
            filter_str.append(f"{current_v}[char_v_{seg_idx}]overlay=x=0:y=0:eof_action=pass[with_char_{seg_idx}];")
            current_v = f"[with_char_{seg_idx}]"
            input_idx += 1
            
        if has_sfx:
            sfx_path = os.path.join(temp_dir, f"sfx_{seg['chunk_id']}.wav")
            sfx_fetched = fetch_sfx(sfx_keyword, sfx_path) if sfx_keyword else False
            if not sfx_fetched:
                sfx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../apps/web/public/assets/audio/pop.wav"))
            if os.path.exists(sfx_path):
                cmd.extend(["-i", sfx_path])
                filter_str.append(f"[{input_idx}:a]adelay=0|0[sfx_a_{seg_idx}];")
                filter_str.append(f"{current_a}[sfx_a_{seg_idx}]amix=inputs=2:duration=first:dropout_transition=2[a_out_sfx_{seg_idx}];")
                current_a = f"[a_out_sfx_{seg_idx}]"
                input_idx += 1
                
        filter_str.append(f"{current_v}format=yuv420p[vout_{seg_idx}];")
        concat_v.append(f"[vout_{seg_idx}]")
        concat_a.append(current_a)

    for v in concat_v: filter_str.append(v)
    for a in concat_a: filter_str.append(a)
    filter_str.append(f"concat=n={len(concat_v)}:v=1:a=1[out_v][out_a]")
    final_v = "[out_v]"

    if subtitle_ass_path and os.path.exists(subtitle_ass_path) and os.path.getsize(subtitle_ass_path) > 50:
        escaped_ass = _escape_ass_path_for_filter(subtitle_ass_path)
        filter_str.append(f"; [out_v]subtitles={escaped_ass}[sub_v]")
        final_v = "[sub_v]"

    filter_complex = "".join(filter_str)
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", final_v,
        "-map", "[out_a]",
        "-r", str(source_fps),
        "-c:v", _get_video_codec(ffmpeg_bin), "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-movflags", "+faststart",
        output_mp4_path
    ])

    _log("FFMPEG", "Executing single-pass rendering. This perfectly syncs audio & video without stutters.")
    try:
        _run_ffmpeg(cmd, "single_pass_compositor")
    except RuntimeError as e:
        _log("ERROR", f"Single-pass rendering failed: {e}")
        raise

    _validate_rendered_output(ffmpeg_bin, output_mp4_path, source_has_audio)

    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if file.endswith('.webm') and (file.startswith('char_') or file.startswith('mg_')):
                try:
                    os.remove(os.path.join(root, file))
                except OSError:
                    pass

    return output_mp4_path

"""

new_content = content[:start_idx] + new_func + content[end_idx:]

with open("services/compositor.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Patched successfully")
