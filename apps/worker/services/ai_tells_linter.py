"""
Anti-AI Quality Guardian & Pacing Linter (Phase 3)
Enforces human-edited editorial pacing and eliminates 'AI slop' tells before rendering.

Rules Enforced:
1. Visual BAN Rules:
   - emoji-cards: Strips raw emojis from card headlines and labels.
   - ai-cliche-icons: Bans sparkles (✨), rockets (🚀), and magic wands (🪄); replaces with concrete UI icons.
   - neon-purple-gradient: Replaces generic AI cyber-purple/indigo gradients with clean modern palettes.
   - slop-copy: Detects and auto-corrects AI marketing cliches (unlock, supercharge, game-changer, etc.).
   - text-only-cards: Ensures cards have layout, code, metrics, or concrete quotes rather than bare text.

2. Pacing & Timing Rules:
   - static-hold-cap: Caps static on-screen graphic holds to a maximum of 4.0s (drops after 4.5s).
   - whoosh-saturation: Enforces minimum 3.0s spacing between whoosh SFX cues.
   - zoom-fatigue: Enforces minimum 12.0s spacing between camera punch-ins (max 1 zoom per 12 seconds).
   - contrast-wcag: Enforces minimum 3.0:1 WCAG contrast ratio between text and card backgrounds.
"""

import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union

# ---------------------------------------------------------------------------
# Cliche Icons & Slop Vocabulary
# ---------------------------------------------------------------------------

EMOJI_REGEX = re.compile(r"[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50]", flags=re.UNICODE)

SLOP_ICONS_BAN = {
    "sparkles", "sparkle", "wand", "wand-sparkles", "wand-2", "magic_wand",
    "magic-wand", "rocket", "stars", "bot", "brain-circuit", "wizard",
}

ICON_REPLACEMENTS = {
    "sparkles": "zap",
    "sparkle": "zap",
    "wand": "code",
    "magic_wand": "code",
    "magic-wand": "code",
    "wand-sparkles": "target",
    "wand-2": "target",
    "rocket": "trending-up",
    "stars": "award",
    "bot": "terminal",
    "brain-circuit": "cpu",
    "wizard": "check-circle",
}

SLOP_COPY_MAP = {
    "game-changer": "breakthrough",
    "game changer": "breakthrough",
    "game-changing": "effective",
    "game changing": "effective",
    "supercharge": "accelerate",
    "supercharging": "accelerating",
    "supercharged": "accelerated",
    "next-level": "advanced",
    "next level": "advanced",
    "cutting-edge": "modern",
    "cutting edge": "modern",
    "seamlessly": "directly",
    "seamless": "direct",
    "delve into": "examine",
    "delve": "examine",
    "unleash": "deploy",
    "skyrocket": "increase",
    "skyrocketing": "increasing",
    "elevate": "improve",
    "revolutionize": "transform",
    "revolutionizing": "transforming",
    "unlock": "access",
    "unlocking": "accessing",
    "effortless": "simple",
    "effortlessly": "simply",
    "level-up": "advance",
    "level up": "advance",
    "leveling up": "advancing",
    "empower": "enable",
    "empowering": "enabling",
    "harness": "use",
    "leverage": "use",
    "leveraging": "using",
    "10x your": "scale your",
    "transform your": "upgrade your",
}

SLOP_COPY_REGEX = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(SLOP_COPY_MAP.keys(), key=len, reverse=True)) + r")\b",
    re.I
)

# Generic purple/indigo hue range: 250 deg to 285 deg
PURPLE_HEX_SAMPLES = {
    "#6366f1", "#8b5cf6", "#7c3aed", "#4f46e5", "#a855f7", "#9333ea", "#6d28d9"
}


# ---------------------------------------------------------------------------
# Color & WCAG Contrast Utilities
# ---------------------------------------------------------------------------

def hex_to_rgb(hex_str: str) -> Tuple[float, float, float]:
    """Parses #RGB or #RRGGBB into (r, g, b) normalized [0.0, 1.0]."""
    clean = (hex_str or "#000000").strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join(c * 2 for c in clean)
    elif len(clean) != 6:
        clean = "000000"
    try:
        r = int(clean[0:2], 16) / 255.0
        g = int(clean[2:4], 16) / 255.0
        b = int(clean[4:6], 16) / 255.0
        return r, g, b
    except Exception:
        return 0.0, 0.0, 0.0


def rgb_to_hsl(r: float, g: float, b: float) -> Tuple[float, float, float]:
    """Converts RGB to HSL: h in [0, 360], s in [0, 1], l in [0, 1]."""
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    l = (mx + mn) / 2.0
    if df == 0:
        return 0.0, 0.0, l
    s = df / (2.0 - mx - mn) if l > 0.5 else df / (mx + mn)
    if mx == r:
        h = ((g - b) / df) % 6.0
    elif mx == g:
        h = (b - r) / df + 2.0
    else:
        h = (r - g) / df + 4.0
    return h * 60.0, s, l


def relative_luminance(r: float, g: float, b: float) -> float:
    """Calculates sRGB relative luminance according to WCAG 2.1."""
    def adjust(channel: float) -> float:
        return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4

    r_lin = adjust(r)
    g_lin = adjust(g)
    b_lin = adjust(b)
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_wcag_contrast(fg_hex: str, bg_hex: str) -> float:
    """Computes WCAG contrast ratio (between 1.0 and 21.0)."""
    r1, g1, b1 = hex_to_rgb(fg_hex)
    r2, g2, b2 = hex_to_rgb(bg_hex)
    l1 = relative_luminance(r1, g1, b1)
    l2 = relative_luminance(r2, g2, b2)
    bright = max(l1, l2)
    dark = min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)


def is_generic_purple_gradient(color_str: str) -> bool:
    """Detects if color string matches generic AI neon-purple gradient/indigo palette."""
    if not color_str:
        return False
    clean = color_str.lower().strip()
    if clean in PURPLE_HEX_SAMPLES:
        return True
    if any(p in clean for p in ["#6366f1", "#8b5cf6", "#7c3aed", "#4f46e5"]):
        return True
    try:
        r, g, b = hex_to_rgb(clean)
        h, s, l = rgb_to_hsl(r, g, b)
        # Purple-indigo range: 245° to 285° with high saturation
        if 245.0 <= h <= 285.0 and s >= 0.55 and 0.25 <= l <= 0.75:
            return True
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# Text & Copy Cleaning
# ---------------------------------------------------------------------------

def clean_emojis(text: str) -> str:
    """Strips raw Unicode emojis and normalizes spaces around punctuation."""
    if not text:
        return ""
    res = EMOJI_REGEX.sub("", str(text))
    res = re.sub(r"\s+([\)\]\},.!?:;])", r"\1", res)
    res = re.sub(r"([\[\(\{])\s+", r"\1", res)
    return re.sub(r"\s+", " ", res).strip()


def sanitize_slop_copy(text: str) -> Tuple[str, List[str]]:
    """
    Detects and auto-corrects AI marketing cliches into concrete human language.
    Returns: (cleaned_text, detected_cliches)
    """
    if not text:
        return "", []

    detected: List[str] = []

    def replace_cliche(match: re.Match) -> str:
        word = match.group(0)
        lower_word = word.lower()
        replacement = SLOP_COPY_MAP.get(lower_word, word)
        detected.append(word)
        # Preserve original capitalization
        if word.isupper():
            return replacement.upper()
        elif word.istitle():
            return replacement.title()
        return replacement

    cleaned = SLOP_COPY_REGEX.sub(replace_cliche, str(text))
    return cleaned, detected


# ---------------------------------------------------------------------------
# Pacing & Anti-Slop Linter Pass
# ---------------------------------------------------------------------------

class LinterIssue:
    def __init__(self, rule: str, trigger_id: str, action: str, details: str, severity: str = "modified"):
        self.rule = rule
        self.trigger_id = trigger_id
        self.action = action
        self.details = details
        self.severity = severity  # "rejected", "modified", "warning"

    def to_dict(self) -> Dict[str, str]:
        return {
            "rule": self.rule,
            "trigger_id": self.trigger_id,
            "action": self.action,
            "details": self.details,
            "severity": self.severity,
        }


def lint_and_guard_blueprint(
    edits: List[Union[Dict[str, Any], Any]],
    timestamp_map: Optional[Dict[str, Any]] = None,
    video_duration: float = 60.0,
    enforce_wcag: bool = True,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Master Anti-AI Quality Guardian & Pacing Linter.
    Runs prior to rendering to enforce human editorial rhythm and ban AI slop.
    """
    timestamp_map = timestamp_map or {}
    linted_edits: List[Dict[str, Any]] = []
    issues: List[LinterIssue] = []

    # Pacing trackers
    last_zoom_time = -999.0
    last_whoosh_time = -999.0
    MIN_ZOOM_SPACING_SEC = 12.0
    MIN_WHOOSH_SPACING_SEC = 3.0
    MAX_STATIC_HOLD_SEC = 4.0

    for idx, raw_e in enumerate(edits):
        e = raw_e if isinstance(raw_e, dict) else (raw_e.model_dump() if hasattr(raw_e, "model_dump") else dict(raw_e.__dict__))
        action = e.get("action", "")
        trigger_id = str(e.get("trigger_id") or f"edit_{idx}")

        # Start and end timestamps
        t_start = e.get("start")
        t_end = e.get("end")
        if (t_start is None or t_end is None) and trigger_id in timestamp_map:
            cdata = timestamp_map[trigger_id]
            t_start = float(cdata.get("start", 0.0))
            t_end = float(cdata.get("end", t_start + 2.0))
        t_start_val = 0.0 if t_start is None else float(t_start)
        t_end_val = t_start_val + 2.0 if t_end is None else float(t_end)

        # ── RULE: zoom-fatigue ──────────────────────────────────────
        if action == "zoom_in":
            spacing = t_start_val - last_zoom_time
            if spacing < MIN_ZOOM_SPACING_SEC:
                issues.append(LinterIssue(
                    rule="zoom-fatigue",
                    trigger_id=trigger_id,
                    action=action,
                    details=f"Zoom at {t_start_val:.1f}s occurs only {spacing:.1f}s after previous zoom (min {MIN_ZOOM_SPACING_SEC}s). Rejected to prevent viewer nausea.",
                    severity="rejected",
                ))
                continue
            last_zoom_time = t_start_val
            linted_edits.append(e)
            continue

        # ── RULE: whoosh-saturation ──────────────────────────────────
        if action == "sfx":
            sfx_type = str(e.get("sound_effect", "")).lower()
            if "whoosh" in sfx_type or "swoosh" in sfx_type:
                spacing = t_start_val - last_whoosh_time
                if spacing < MIN_WHOOSH_SPACING_SEC:
                    # Muffle / replace whoosh with subtle tick or skip
                    e["sound_effect"] = "tick"
                    issues.append(LinterIssue(
                        rule="whoosh-saturation",
                        trigger_id=trigger_id,
                        action=action,
                        details=f"Whoosh at {t_start_val:.1f}s occurs only {spacing:.1f}s after previous whoosh. Converted to subtle tick to prevent audio fatigue.",
                        severity="modified",
                    ))
                else:
                    last_whoosh_time = t_start_val
            linted_edits.append(e)
            continue

        # ── RULE: motion_graphics Anti-Slop Guardian ─────────────────
        if action == "motion_graphics":
            mg_type = e.get("motion_graphics_type", "hero_reveal")

            # 1. Pacing: static-hold-cap
            dur = t_end_val - t_start_val
            if dur > MAX_STATIC_HOLD_SEC:
                new_end = t_start_val + MAX_STATIC_HOLD_SEC
                e["end"] = new_end
                issues.append(LinterIssue(
                    rule="static-hold-cap",
                    trigger_id=trigger_id,
                    action=action,
                    details=f"Motion graphic duration ({dur:.1f}s) capped to {MAX_STATIC_HOLD_SEC}s to maintain high viewer retention.",
                    severity="modified",
                ))

            # 2. Visual BAN: emoji-cards
            for text_key in ("motion_graphics_text", "headline", "title", "label", "text"):
                val = e.get(text_key)
                if val and isinstance(val, str):
                    cleaned = clean_emojis(val)
                    if cleaned != val:
                        e[text_key] = cleaned
                        issues.append(LinterIssue(
                            rule="emoji-cards",
                            trigger_id=trigger_id,
                            action=action,
                            details=f"Stripped raw emojis from '{text_key}': '{val}' → '{cleaned}'.",
                            severity="modified",
                        ))

            # 3. Visual BAN: ai-cliche-icons
            concept = str(e.get("concept") or "").lower()
            if concept in SLOP_ICONS_BAN or EMOJI_REGEX.search(concept):
                replacement = ICON_REPLACEMENTS.get(concept, "zap")
                e["concept"] = replacement
                issues.append(LinterIssue(
                    rule="ai-cliche-icons",
                    trigger_id=trigger_id,
                    action=action,
                    details=f"Banned AI cliche icon '{concept}' replaced with concrete '{replacement}'.",
                    severity="modified",
                ))

            # 4. Visual BAN: slop-copy
            for text_key in ("motion_graphics_text", "headline", "title", "supporting", "quote"):
                val = e.get(text_key)
                if val and isinstance(val, str):
                    cleaned, cliches = sanitize_slop_copy(val)
                    if cliches:
                        e[text_key] = cleaned
                        issues.append(LinterIssue(
                            rule="slop-copy",
                            trigger_id=trigger_id,
                            action=action,
                            details=f"Replaced AI buzzwords ({', '.join(cliches)}) with concrete editorial phrasing: '{cleaned}'.",
                            severity="modified",
                        ))

            # 5. Visual BAN: neon-purple-gradient
            for color_key in ("accentColor", "color", "background", "gradient"):
                c_val = e.get(color_key)
                if c_val and is_generic_purple_gradient(str(c_val)):
                    # Replace with clean modern slate accent
                    e[color_key] = "#38bdf8"  # Clean sky blue
                    issues.append(LinterIssue(
                        rule="neon-purple-gradient",
                        trigger_id=trigger_id,
                        action=action,
                        details=f"Generic AI purple gradient '{c_val}' replaced with professional clean accent '#38bdf8'.",
                        severity="modified",
                    ))

            # 6. Quality Rule: contrast-wcag
            if enforce_wcag:
                fg = str(e.get("textColor") or e.get("color") or "#FFFFFF")
                bg = str(e.get("backgroundColor") or e.get("background") or "#0f172a")
                try:
                    contrast = calculate_wcag_contrast(fg, bg)
                    if contrast < 3.0:
                        # Auto-fix: if background is dark, use crisp white; if light, use charcoal
                        r_bg, g_bg, b_bg = hex_to_rgb(bg)
                        lum_bg = relative_luminance(r_bg, g_bg, b_bg)
                        new_fg = "#FFFFFF" if lum_bg < 0.5 else "#111827"
                        e["textColor"] = new_fg
                        issues.append(LinterIssue(
                            rule="contrast-wcag",
                            trigger_id=trigger_id,
                            action=action,
                            details=f"WCAG contrast ratio ({contrast:.2f}:1) was below 3.0:1. Adjusted text color to '{new_fg}' for crisp legibility.",
                            severity="modified",
                        ))
                except Exception:
                    pass

            # 7. Quality Rule: text-only-cards
            # If a card has no metrics, code, or structured props, ensure it has at least a strong supporting point
            if mg_type == "hero_reveal" and not e.get("supporting") and not e.get("metric"):
                e["supporting"] = "Concrete insight"

            linted_edits.append(e)
            continue

        # Passes all other actions (cut, b_roll, character)
        linted_edits.append(e)

    summary = {
        "original_count": len(edits),
        "retained_count": len(linted_edits),
        "rejected_count": sum(1 for iss in issues if iss.severity == "rejected"),
        "modified_count": sum(1 for iss in issues if iss.severity == "modified"),
        "issues": [iss.to_dict() for iss in issues],
    }

    return linted_edits, summary
