"""
Unit & Integration Tests for Anti-AI Quality Guardian & Pacing Linter (Phase 3)
Tests visual BAN rules (emojis, AI slop icons, purple gradients, marketing cliches)
and pacing rules (zoom fatigue, whoosh saturation, static hold caps, WCAG contrast).
"""

import pytest
from services.ai_tells_linter import (
    clean_emojis,
    sanitize_slop_copy,
    calculate_wcag_contrast,
    is_generic_purple_gradient,
    lint_and_guard_blueprint,
)
from services.blueprint_validator import validate_blueprint


def test_clean_emojis():
    """Verifies that raw Unicode emojis are stripped from text while keeping punctuation intact."""
    raw = "🚀 Supercharge your business ✨ with automated AI 🪄 (10x faster!)"
    cleaned = clean_emojis(raw)
    assert "🚀" not in cleaned
    assert "✨" not in cleaned
    assert "🪄" not in cleaned
    assert cleaned == "Supercharge your business with automated AI (10x faster!)"


def test_sanitize_slop_copy():
    """Verifies that AI marketing buzzwords are auto-corrected into concrete human terms."""
    text = "This game-changer will supercharge your workflow and unleash your potential."
    cleaned, cliches = sanitize_slop_copy(text)
    assert "game-changer" in cliches
    assert "supercharge" in cliches
    assert "unleash" in cliches
    assert "breakthrough" in cleaned
    assert "accelerate" in cleaned
    assert "deploy" in cleaned
    assert "supercharge" not in cleaned.lower()


def test_wcag_contrast_calculation():
    """Verifies WCAG 2.1 relative luminance and contrast calculations."""
    # Pure black (#000000) on pure white (#FFFFFF) has 21:1 contrast
    contrast_max = calculate_wcag_contrast("#000000", "#FFFFFF")
    assert contrast_max > 20.0

    # Low contrast: light gray on white
    contrast_low = calculate_wcag_contrast("#D1D5DB", "#FFFFFF")
    assert contrast_low < 3.0


def test_is_generic_purple_gradient():
    """Verifies detection of generic AI cyber-purple/indigo gradients."""
    assert is_generic_purple_gradient("#6366f1") is True
    assert is_generic_purple_gradient("#8b5cf6") is True
    assert is_generic_purple_gradient("#7c3aed") is True
    assert is_generic_purple_gradient("#0f172a") is False  # slate black
    assert is_generic_purple_gradient("#ffffff") is False  # white


def test_pacing_zoom_fatigue():
    """Verifies that camera punch-ins closer than 12.0s apart are rejected to avoid viewer fatigue."""
    edits = [
        {"action": "zoom_in", "start": 2.0, "end": 4.0, "trigger_id": "z1"},
        {"action": "zoom_in", "start": 8.0, "end": 10.0, "trigger_id": "z2"},   # 6s later -> REJECTED
        {"action": "zoom_in", "start": 22.0, "end": 24.0, "trigger_id": "z3"}, # 20s later -> ACCEPTED
    ]
    linted, summary = lint_and_guard_blueprint(edits, video_duration=30.0)

    # z2 should be rejected
    retained_ids = [e.get("trigger_id") for e in linted]
    assert "z1" in retained_ids
    assert "z2" not in retained_ids
    assert "z3" in retained_ids
    assert any(iss["rule"] == "zoom-fatigue" for iss in summary["issues"])


def test_pacing_whoosh_saturation():
    """Verifies that whoosh SFX closer than 3.0s apart are converted to subtle ticks."""
    edits = [
        {"action": "sfx", "sound_effect": "whoosh-in", "start": 1.0, "trigger_id": "w1"},
        {"action": "sfx", "sound_effect": "whoosh-in", "start": 2.5, "trigger_id": "w2"},  # 1.5s later -> converted to tick
        {"action": "sfx", "sound_effect": "whoosh-in", "start": 6.0, "trigger_id": "w3"},  # 3.5s later -> retained whoosh
    ]
    linted, summary = lint_and_guard_blueprint(edits, video_duration=30.0)

    assert linted[0]["sound_effect"] == "whoosh-in"
    assert linted[1]["sound_effect"] == "tick"
    assert linted[2]["sound_effect"] == "whoosh-in"
    assert any(iss["rule"] == "whoosh-saturation" for iss in summary["issues"])


def test_pacing_static_hold_cap():
    """Verifies that motion graphics held static longer than 4.5s are capped to 4.0s."""
    edits = [
        {
            "action": "motion_graphics",
            "motion_graphics_type": "hero_reveal",
            "start": 2.0,
            "end": 8.0,  # 6.0s duration!
            "trigger_id": "mg_long",
        }
    ]
    linted, summary = lint_and_guard_blueprint(edits, video_duration=30.0)
    assert linted[0]["end"] == 6.0  # 2.0 + 4.0s max hold cap
    assert any(iss["rule"] == "static-hold-cap" for iss in summary["issues"])


def test_visual_ban_slop_icons_and_purple_gradient():
    """Verifies that sparkles/rockets and neon purple gradients are sanitized."""
    edits = [
        {
            "action": "motion_graphics",
            "motion_graphics_type": "hero_reveal",
            "concept": "sparkles",
            "headline": "✨ Level-up your game ✨",
            "accentColor": "#6366f1",
            "start": 1.0,
            "end": 3.0,
            "trigger_id": "mg_slop",
        }
    ]
    linted, summary = lint_and_guard_blueprint(edits, video_duration=30.0)
    sanitized = linted[0]

    # concept 'sparkles' replaced with 'zap'
    assert sanitized["concept"] == "zap"
    # emojis stripped and slop copy cleaned
    assert "✨" not in sanitized["headline"]
    assert "level-up" not in sanitized["headline"].lower()
    # purple gradient replaced with clean accent
    assert sanitized["accentColor"] == "#38bdf8"


def test_blueprint_validator_full_integration():
    """Tests that validate_blueprint runs the linter and records issues in ValidationReport."""
    raw_edits = [
        {"action": "zoom_in", "start": 2.0, "end": 4.0, "trigger_id": "z1"},
        {"action": "zoom_in", "start": 5.0, "end": 7.0, "trigger_id": "z2"},  # zoom fatigue
        {
            "action": "motion_graphics",
            "motion_graphics_type": "hero_reveal",
            "headline": "🚀 Supercharge today",
            "start": 10.0,
            "end": 17.0,  # static hold cap
            "trigger_id": "mg1",
        },
    ]

    timestamp_map = {
        "z1": {"start": 2.0, "end": 4.0, "text": ""},
        "z2": {"start": 5.0, "end": 7.0, "text": ""},
        "mg1": {"start": 10.0, "end": 17.0, "text": ""},
    }

    validated, report = validate_blueprint(raw_edits, timestamp_map, video_duration=30.0)

    # z2 rejected due to zoom fatigue
    assert any("zoom-fatigue" in iss.issue for iss in report.issues)
    assert any("static-hold-cap" in iss.issue for iss in report.issues)
    assert any("slop-copy" in iss.issue for iss in report.issues)

    # Resulting motion graphic should have capped duration and clean copy
    mg = next(e for e in validated if e.get("action") == "motion_graphics")
    assert mg["end"] - mg["start"] <= 4.0
    assert "🚀" not in mg["headline"]
    assert "supercharge" not in mg["headline"].lower()
