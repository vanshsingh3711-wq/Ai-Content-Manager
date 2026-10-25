import os
from typing import Any, Dict, List, Set, Optional, Tuple


def format_ass_time(seconds: float) -> str:
    """Converts seconds to ASS timestamp format: H:MM:SS.cc"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        secs += 1
        centis = 0
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def reconcile_transcript_words(raw_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sanitizes and reconciles Whisper word tokens:
    1. Stitches split hyphenated words (e.g. 're' + '-executes' -> 're-executes', '50' + '-person' -> '50-person').
    2. Stitches split numbers and commas (e.g. '10' + ',000' -> '10,000' or '10,' + '000' -> '10,000').
    3. Merges trailing hyphen words with subsequent token (e.g. 'self-' + 'healing' -> 'self-healing').
    4. Strips leading or trailing orphan punctuation characters like lone hyphens or stray dashes.
    5. Preserves correct timing boundaries (start = first_token['start'], end = last_token['end']).
    """
    if not raw_words:
        return []

    cleaned: List[Dict[str, Any]] = []
    i = 0
    n = len(raw_words)

    while i < n:
        curr = dict(raw_words[i])
        curr_text = curr.get("word", "").strip()

        # Skip pure empty or whitespace tokens
        if not curr_text:
            i += 1
            continue

        # Check if curr is an orphan hyphen / dash
        if curr_text in ("-", "--", "—"):
            if cleaned and i + 1 < n:
                prev = cleaned[-1]
                nxt = raw_words[i + 1]
                nxt_text = nxt.get("word", "").strip().lstrip("-")
                prev["word"] = f"{prev['word'].rstrip('-')}-{nxt_text}"
                prev["end"] = max(prev.get("end", 0.0), nxt.get("end", prev.get("end", 0.0)))
                i += 2
                continue
            else:
                i += 1
                continue

        # Look ahead for split patterns
        while i + 1 < n:
            nxt = raw_words[i + 1]
            nxt_text = nxt.get("word", "").strip()
            if not nxt_text:
                i += 1
                continue

            # Case A: Number comma split, e.g. "10" and ",000" or ",000x"
            if curr_text.isdigit() and (
                nxt_text.startswith(",")
                and len(nxt_text) > 1
                and nxt_text[1:].replace("x", "").replace("X", "").isdigit()
            ):
                curr_text = f"{curr_text}{nxt_text}"
                curr["word"] = curr_text
                curr["end"] = nxt.get("end", curr["end"])
                i += 1
                continue

            # Case B: Number comma split, e.g. "10," and "000"
            if (
                curr_text.rstrip(",").isdigit()
                and curr_text.endswith(",")
                and (nxt_text.isdigit() or nxt_text.rstrip("xX").isdigit())
            ):
                curr_text = f"{curr_text}{nxt_text}"
                curr["word"] = curr_text
                curr["end"] = nxt.get("end", curr["end"])
                i += 1
                continue

            # Case C: Next word starts with a hyphen, e.g. "-executes", "-person", "-healing", "-weight", "-speed", "-10", "-level", "-specific"
            # Unless curr_text ends with sentence terminators (. ! ?)
            if nxt_text.startswith("-") and len(nxt_text) > 1 and not curr_text.endswith((".", "!", "?")):
                clean_curr = curr_text.rstrip(",;:- ")
                clean_nxt = nxt_text.lstrip("-")
                curr_text = f"{clean_curr}-{clean_nxt}"
                curr["word"] = curr_text
                curr["end"] = nxt.get("end", curr["end"])
                i += 1
                continue

            # Case D: Current word ends with hyphen, e.g. "self-", "multi-", "re-"
            if curr_text.endswith("-") and len(curr_text) > 1 and not nxt_text.startswith((".", "!", "?")):
                clean_curr = curr_text.rstrip("-")
                clean_nxt = nxt_text.lstrip("-")
                curr_text = f"{clean_curr}-{clean_nxt}"
                curr["word"] = curr_text
                curr["end"] = nxt.get("end", curr["end"])
                i += 1
                continue

            break

        curr["word"] = curr_text
        cleaned.append(curr)
        i += 1

    return cleaned



PRESET_CONFIGS = {
    "tiktok_yellow": {
        "fontname": "DejaVu Sans",
        "primary": "&H00E8E8E8",
        "active": "&H0000E6FF",
        "outline": "&H00000000",
        "back": "&H90000000",
        "outline_w": 6,
        "shadow_w": 3,
        "bold": -1,
        "pop_scale": 132,
        "border_style": 1,
    },
    "hormozi_bold": {
        "fontname": "DejaVu Sans",
        "primary": "&H00FFFFFF",
        "active": "&H0000FF00",
        "outline": "&H00000000",
        "back": "&H95000000",
        "outline_w": 7,
        "shadow_w": 4,
        "bold": -1,
        "pop_scale": 135,
        "border_style": 1,
    },
    "neon_glow": {
        "fontname": "DejaVu Sans",
        "primary": "&H00E0E0E0",
        "active": "&H00FFFF00",
        "outline": "&H00FFAA00",
        "back": "&H00FF6600",
        "outline_w": 5,
        "shadow_w": 6,
        "bold": -1,
        "pop_scale": 130,
        "border_style": 1,
    },
    "neon_cyber": {
        "fontname": "DejaVu Sans",
        "primary": "&H00E0E0E0",
        "active": "&H00FFFF00",
        "outline": "&H00FFAA00",
        "back": "&H00FF6600",
        "outline_w": 5,
        "shadow_w": 6,
        "bold": -1,
        "pop_scale": 130,
        "border_style": 1,
    },
    "boxed_pill": {
        "fontname": "DejaVu Sans",
        "primary": "&H00101010",
        "active": "&H000000FF",
        "outline": "&H0000D7FF",
        "back": "&H0000D7FF",
        "outline_w": 5,
        "shadow_w": 0,
        "bold": -1,
        "pop_scale": 126,
        "border_style": 3,
    },
    "comic_pop": {
        "fontname": "DejaVu Sans",
        "primary": "&H0000E8FF",
        "active": "&H000045FF",
        "outline": "&H00000000",
        "back": "&H90000000",
        "outline_w": 7,
        "shadow_w": 5,
        "bold": -1,
        "pop_scale": 132,
        "border_style": 1,
    },
    "fire_gradient": {
        "fontname": "DejaVu Sans",
        "primary": "&H00EAEAEA",
        "active": "&H000055FF",
        "outline": "&H00000000",
        "back": "&H90000000",
        "outline_w": 6,
        "shadow_w": 4,
        "bold": -1,
        "pop_scale": 132,
        "border_style": 1,
    },
    "karaoke_gradient": {
        "fontname": "DejaVu Sans",
        "primary": "&H00F0D0FF",
        "active": "&H00D020FF",
        "outline": "&H00300040",
        "back": "&H90000000",
        "outline_w": 6,
        "shadow_w": 3,
        "bold": -1,
        "pop_scale": 128,
        "border_style": 1,
    },
    "clean_white": {
        "fontname": "DejaVu Sans",
        "primary": "&H00CCCCCC",
        "active": "&H00FFFFFF",
        "outline": "&H00000000",
        "back": "&H80000000",
        "outline_w": 4,
        "shadow_w": 2,
        "bold": -1,
        "pop_scale": 115,
        "border_style": 1,
    },
    "modern_clean": {
        "fontname": "DejaVu Sans",
        "primary": "&H00CCCCCC",
        "active": "&H00FFFFFF",
        "outline": "&H00000000",
        "back": "&H80000000",
        "outline_w": 4,
        "shadow_w": 2,
        "bold": -1,
        "pop_scale": 115,
        "border_style": 1,
    },
    "minimal_boxed": {
        "fontname": "DejaVu Sans",
        "primary": "&H00E0E0E0",
        "active": "&H0050E050",
        "outline": "&H00181818",
        "back": "&H90101010",
        "outline_w": 5,
        "shadow_w": 3,
        "bold": -1,
        "pop_scale": 118,
        "border_style": 1,
    },
}


def generate_ass_subtitles(
    timestamp_map: Dict[str, Any],
    output_ass_path: str,
    edits: Optional[List[Dict[str, Any]]] = None,
    font_size: Optional[int] = None,
    primary_color: Optional[str] = None,
    highlight_color: Optional[str] = None,
    caption_preset: str = "tiktok_yellow",
    aspect_ratio: str = "9:16",
    is_faceless: bool = True,
    alignment: Optional[int] = None,
    **kwargs,
) -> str:
    """
    Generates an Advanced SubStation Alpha (.ass) subtitle file formatted
    with viral animation templates. For faceless videos, captions are positioned
    in the exact center of the video canvas (Alignment=5) regardless of aspect ratio.
    """
    edits = edits or []
    os.makedirs(os.path.dirname(os.path.abspath(output_ass_path)), exist_ok=True)

    # 1. Determine canvas resolution based on aspect ratio
    ar_map = {
        "9:16": (1080, 1920),
        "16:9": (1920, 1080),
        "1:1": (1080, 1080),
        "4:5": (1080, 1350),
    }
    play_res_x, play_res_y = ar_map.get(aspect_ratio, (1080, 1920))

    # 2. Position alignment:
    # In ASS format:
    # Alignment 5 = Middle-Center (horizontal & vertical center of the video frame)
    # Alignment 2 = Bottom-Center (lower third for talking head)
    if alignment is not None:
        eff_alignment = alignment
        margin_v = 0 if eff_alignment == 5 else (160 if play_res_y > 1500 else 110)
    elif is_faceless or kwargs.get("is_faceless", False):
        # Faceless videos (9:16, 16:9, etc.) place dynamic viral captions in the exact center
        eff_alignment = 5
        margin_v = 0
    elif aspect_ratio == "16:9":
        # Talking head 16:9 widescreen videos use lower-third (bottom-center)
        eff_alignment = 2
        margin_v = 90
    else:
        eff_alignment = 2
        margin_v = 160 if play_res_y > 1500 else 110

    # 3. Retrieve preset style config
    clean_preset = caption_preset.lower().strip()
    cfg = PRESET_CONFIGS.get(clean_preset, PRESET_CONFIGS["tiktok_yellow"])

    # Responsive font size calculation
    if font_size is None or font_size == 50:
        if play_res_y >= 1900:
            eff_font_size = 68
        elif play_res_y <= 1100:
            eff_font_size = 54
        else:
            eff_font_size = 60
    else:
        eff_font_size = font_size

    # Override colors if explicitly provided
    style_primary = primary_color if (primary_color and primary_color.startswith("&H")) else cfg["primary"]
    style_active = highlight_color if (highlight_color and highlight_color.startswith("&H")) else cfg["active"]
    style_outline = cfg["outline"]
    style_back = cfg["back"]
    outline_w = cfg["outline_w"]
    shadow_w = cfg["shadow_w"]
    bold = cfg["bold"]
    pop_scale = cfg["pop_scale"]
    border_style = cfg["border_style"]
    fontname = cfg["fontname"]

    # 4. Identify cut intervals and motion graphics intervals
    cut_intervals: List[Tuple[float, float]] = []
    mg_intervals: List[Tuple[float, float]] = []
    for e in edits:
        act = (e.get("action") or e.get("type") or "").lower()
        start = e.get("start")
        end = e.get("end")

        if act == "cut":
            if start is not None and end is not None:
                cut_intervals.append((float(start), float(end)))
            elif e.get("trigger_id") and e.get("trigger_id") in timestamp_map:
                chunk = timestamp_map[e["trigger_id"]]
                cut_intervals.append((float(chunk.get("start", 0.0)), float(chunk.get("end", 0.0))))
        elif act in ("motion_graphics", "motion_graphic"):
            if start is not None and end is not None and float(end) > float(start):
                mg_intervals.append((float(start), float(end)))
            elif e.get("trigger_id") and e.get("trigger_id") in timestamp_map:
                chunk = timestamp_map[e["trigger_id"]]
                mg_intervals.append((float(chunk.get("start", 0.0)), float(chunk.get("end", 0.0))))

    def _map_time(t: float) -> float:
        shift = 0.0
        for c_start, c_end in sorted(cut_intervals):
            if t <= c_start:
                break
            elif c_start < t < c_end:
                shift += (t - c_start)
                break
            else:
                shift += (c_end - c_start)
        return max(0.0, t - shift)

    def _is_inside_cut(s: float, e: float) -> bool:
        for c_start, c_end in cut_intervals:
            if s >= c_start - 0.05 and e <= c_end + 0.05:
                return True
        return False

    def _is_inside_motion_graphic(s: float, e: float) -> bool:
        """
        Suppresses subtitles during motion graphic intervals so motion graphics
        have exclusive, unobstructed visual focus on screen.
        Includes a 0.1s buffer to prevent edge collisions or lingering transitions.
        """
        for mg_start, mg_end in mg_intervals:
            mapped_mg_s = _map_time(mg_start) - 0.1
            mapped_mg_e = _map_time(mg_end) + 0.1
            overlap = max(0.0, min(e, mapped_mg_e) - max(s, mapped_mg_s))
            if overlap > 0.0:
                return True
        return False

    # 5. Build .ass Header and Style definitions
    header = f"""[Script Info]
; Script generated by AI Content Manager (Faceless & Social Video Pipeline)
Title: Viral AI Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: {play_res_x}
PlayResY: {play_res_y}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{fontname},{eff_font_size},{style_primary},{style_active},{style_outline},{style_back},{bold},0,0,0,100,100,0,0,{border_style},{outline_w},{shadow_w},{eff_alignment},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    dialogue_lines: List[str] = []

    # 6. Filter canonical transcript chunks
    has_transcript_chunks = any(not str(k).startswith("beat_") for k in timestamp_map.keys())
    candidate_items = [
        (cid, cdata) for cid, cdata in timestamp_map.items()
        if not (has_transcript_chunks and str(cid).startswith("beat_"))
    ]
    if not candidate_items:
        candidate_items = list(timestamp_map.items())

    # For centered faceless captions, 3 words per window gives maximum punch and zero clutter
    words_per_window = 3 if eff_alignment == 5 else 4

    # Calculate exact coordinate positions
    center_x = play_res_x // 2
    if eff_alignment == 5:
        center_y = play_res_y // 2
        pos_prefix = rf"{{\an5\pos({center_x},{center_y})}}"
    else:
        bottom_y = play_res_y - margin_v
        pos_prefix = rf"{{\an2\pos({center_x},{bottom_y})}}"

    for chunk_id, chunk_data in candidate_items:
        chunk_start = chunk_data.get("start", 0.0)
        chunk_end = chunk_data.get("end", 0.0)

        if _is_inside_cut(chunk_start, chunk_end):
            continue

        raw_words = chunk_data.get("words", [])
        words = [w for w in raw_words if w.get("word", "").strip() and not _is_inside_cut(w["start"], w["end"])]
        words = reconcile_transcript_words(words)

        if not words:
            text = chunk_data.get("text", "").strip()
            if text:
                m_start = _map_time(chunk_start)
                m_end = _map_time(chunk_end)
                if _is_inside_motion_graphic(m_start, m_end):
                    continue
                start_str = format_ass_time(m_start)
                end_str = format_ass_time(m_end)
                dialogue_lines.append(
                    f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{pos_prefix}{text.upper()}"
                )
            continue

        # Create subtitle event with active-word kinetic spring bounce animation
        for active_idx, active_word_info in enumerate(words):
            word_start = active_word_info["start"]
            
            if active_idx < len(words) - 1:
                word_end = words[active_idx + 1]["start"]
            else:
                word_end = chunk_data.get("end", active_word_info["end"])
                if word_end - word_start < 0.2:
                    word_end = word_start + 0.2
            
            if word_end <= word_start:
                word_end = word_start + 0.15

            mapped_start = _map_time(word_start)
            mapped_end = _map_time(word_end)

            if mapped_end <= mapped_start:
                mapped_end = mapped_start + 0.15

            # Suppress subtitle if this spoken word collides with an active motion graphic!
            if _is_inside_motion_graphic(mapped_start, mapped_end):
                continue

            start_str = format_ass_time(mapped_start)
            end_str = format_ass_time(mapped_end)

            dur_ms = max(120, int((mapped_end - mapped_start) * 1000))
            pop_in = min(45, max(25, int(dur_ms * 0.25)))
            pop_settle = min(95, pop_in + 35)

            # Rolling window keeps subtitles clean and centered
            window_start = (active_idx // words_per_window) * words_per_window
            window_end = min(len(words), window_start + words_per_window)
            window_words = words[window_start:window_end]

            formatted_words = []
            for w_i, w in enumerate(window_words):
                actual_idx = window_start + w_i
                clean_word = w["word"].strip().upper()
                if not clean_word:
                    continue
                if actual_idx == active_idx:
                    # High-impact kinetic spring bounce animation:
                    # 1. Explosive scale-up to pop_scale (132%) with kinetic blur
                    # 2. Springs smoothly into elevated active state (108%) with bold outline
                    active_tag = (
                        rf"{{\c{style_active}&\3c&H00000000&\bord{outline_w + 1}"
                        rf"\t(0,{pop_in},\fscx{pop_scale}\fscy{pop_scale}\blur2)"
                        rf"\t({pop_in},{pop_settle},\fscx108\fscy108\blur0)}}"
                        f"{clean_word}"
                        rf"{{\c{style_primary}&\fscx100\fscy100\bord{outline_w}\blur0}}"
                    )
                    formatted_words.append(active_tag)
                else:
                    formatted_words.append(
                        rf"{{\c{style_primary}&\fscx100\fscy100\bord{outline_w}}}{clean_word}"
                    )

            rendered_text = f"{pos_prefix}{' '.join(formatted_words)}"
            dialogue_lines.append(
                f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{rendered_text}"
            )

    full_ass_content = header + "\n".join(dialogue_lines) + "\n"

    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(full_ass_content)

    print(f"[OK] Generated dynamic ASS subtitles ({caption_preset}, Alignment={eff_alignment}, Canvas={play_res_x}x{play_res_y}) with {len(dialogue_lines)} events: {output_ass_path}")
    return output_ass_path

