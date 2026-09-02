"""
Tests for the Blueprint Validator.
Verifies that deterministic guardrails correctly reject, accept, and enforce
B-roll budgets, timestamp validity, overlap detection, and justification requirements.
"""
import pytest
from services.blueprint_validator import validate_blueprint, ValidationReport
from services.editing_config import EditingConfig


# ─── Helpers ──────────────────────────────────────────────────────────────

def make_timestamp_map(chunks):
    """Build a timestamp_map from a list of (id, start, end, text) tuples."""
    return {
        cid: {"start": s, "end": e, "text": t, "words": []}
        for cid, s, e, t in chunks
    }


def make_edit(trigger_id, action, **kwargs):
    """Build an edit dict."""
    d = {"trigger_id": trigger_id, "action": action}
    d.update(kwargs)
    return d


CHUNKS = [
    ("ID_01", 0.0,  3.0,  "Hello everyone"),
    ("ID_02", 3.5,  7.0,  "Today we talk about AI"),
    ("ID_03", 7.5,  11.0, "Machine learning is powerful"),
    ("ID_04", 11.5, 15.0, "Let me show you"),
    ("ID_05", 15.5, 19.0, "This is the result"),
    ("ID_06", 19.5, 23.0, "Thank you for watching"),
    ("ID_07", 23.5, 27.0, "Please subscribe"),
    ("ID_08", 27.5, 30.0, "See you next time"),
]
TMAP = make_timestamp_map(CHUNKS)
VIDEO_DURATION = 32.0


# ─── Basic Validation ─────────────────────────────────────────────────────

class TestBasicValidation:
    def test_empty_edits_pass(self):
        validated, report = validate_blueprint([], TMAP, VIDEO_DURATION)
        assert validated == []
        assert report.original_count == 0
        assert report.accepted_count == 0

    def test_valid_zoom_accepted(self):
        edits = [make_edit("ID_01", "zoom_in")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 1
        assert report.accepted_count == 1

    def test_valid_sfx_accepted(self):
        edits = [make_edit("ID_01", "sfx", sound_effect="whoosh")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 1

    def test_unknown_action_rejected(self):
        edits = [make_edit("ID_01", "explode")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 0
        assert report.rejected_count == 1

    def test_missing_trigger_id_rejected(self):
        edits = [{"action": "zoom_in"}]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 0
        assert report.rejected_count == 1

    def test_nonexistent_trigger_id_rejected(self):
        edits = [make_edit("ID_99", "zoom_in")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 0
        assert report.rejected_count == 1


# ─── Cut Validation ───────────────────────────────────────────────────────

class TestCutValidation:
    def test_valid_cut_accepted(self):
        edits = [{"action": "cut", "start": 3.5, "end": 7.0}]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 1
        assert report.accepted_count == 1

    def test_short_cut_rejected(self):
        """Cuts shorter than MIN_CUT_DURATION_SEC should be rejected."""
        edits = [{"action": "cut", "start": 0.0, "end": 0.1}]
        validated, report = validate_blueprint(edits, TMAP, 1.0)
        assert len(validated) == 0
        assert report.rejected_count == 1

    def test_missing_timestamps_cut_rejected(self):
        edits = [{"action": "cut", "start": 0.0}] # Missing end
        validated, report = validate_blueprint(edits, TMAP, 1.0)
        assert len(validated) == 0
        assert report.rejected_count == 1



# ─── B-roll Validation ───────────────────────────────────────────────────

class TestBrollValidation:
    def test_valid_broll_accepted(self):
        edits = [make_edit("ID_03", "b_roll",
                           search_query="machine learning visualization",
                           reason="Speaker discusses ML but footage is talking-head only")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 1
        assert report.accepted_count == 1
        assert report.broll_budget_used > 0

    def test_broll_missing_reason_rejected(self):
        edits = [make_edit("ID_03", "b_roll",
                           search_query="machine learning")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 0
        assert report.rejected_count == 1
        assert "reason" in report.issues[0].issue.lower()

    def test_broll_missing_query_rejected(self):
        edits = [make_edit("ID_03", "b_roll",
                           reason="Visual would help")]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(validated) == 0
        assert report.rejected_count == 1

    def test_excessive_broll_count_rejected(self):
        """Only MAX_BROLL_COUNT B-rolls should be accepted."""
        edits = [
            make_edit("ID_01", "b_roll", search_query="a", reason="reason a"),
            make_edit("ID_03", "b_roll", search_query="b", reason="reason b"),
            make_edit("ID_05", "b_roll", search_query="c", reason="reason c"),
            make_edit("ID_07", "b_roll", search_query="d", reason="reason d"),  # Over limit
        ]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        broll_count = sum(1 for e in validated if e["action"] == "b_roll")
        assert broll_count <= 3
        assert report.rejected_count >= 1

    def test_broll_budget_enforced(self):
        """Total B-roll duration must not exceed MAX_BROLL_DURATION_RATIO * video_duration."""
        # Each chunk is 3-3.5s. For a 32s video with 0.20 ratio, budget = 6.4s
        # Two B-roll clips of ~3.5s each = 7s, should reject the second
        edits = [
            make_edit("ID_02", "b_roll", search_query="a", reason="reason"),  # 3.5s
            make_edit("ID_05", "b_roll", search_query="b", reason="reason"),  # 3.5s -> over budget
        ]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert report.broll_budget_used <= report.broll_budget_max

    def test_overlapping_broll_rejected(self):
        """B-roll events covering overlapping time ranges must be rejected."""
        # Create overlapping chunks in a 60s video so budget isn't the issue
        overlap_tmap = make_timestamp_map([
            ("ID_01", 0.0, 5.0, "First"),
            ("ID_02", 3.0, 8.0, "Overlapping"),  # Overlaps with ID_01
        ])
        edits = [
            make_edit("ID_01", "b_roll", search_query="a", reason="reason"),
            make_edit("ID_02", "b_roll", search_query="b", reason="reason"),
        ]
        validated, report = validate_blueprint(edits, overlap_tmap, 60.0)
        broll_count = sum(1 for e in validated if e["action"] == "b_roll")
        assert broll_count == 1  # Only first accepted, second rejected for overlap

    def test_broll_spacing_enforced(self):
        """B-roll events too close together should be rejected."""
        # ID_03 ends at 11.0, ID_04 starts at 11.5 — only 0.5s gap < MIN_BROLL_SPACING_SEC
        edits = [
            make_edit("ID_03", "b_roll", search_query="a", reason="reason"),
            make_edit("ID_04", "b_roll", search_query="b", reason="reason"),
        ]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        broll_count = sum(1 for e in validated if e["action"] == "b_roll")
        assert broll_count == 1  # Second rejected for spacing

    def test_short_broll_rejected(self):
        """B-roll on a very short chunk should be rejected."""
        short_tmap = make_timestamp_map([("ID_01", 0.0, 0.5, "uh")])
        edits = [make_edit("ID_01", "b_roll", search_query="a", reason="reason")]
        validated, report = validate_blueprint(edits, short_tmap, 5.0)
        assert len(validated) == 0


# ─── Mixed Edits ──────────────────────────────────────────────────────────

class TestMixedEdits:
    def test_mixed_edits_validated_correctly(self):
        """A realistic mix of valid and invalid edits."""
        edits = [
            make_edit("ID_01", "zoom_in"),                                        # Valid
            {"action": "cut", "start": 3.5, "end": 7.0},                                          # Valid
            make_edit("ID_03", "b_roll", search_query="ml", reason="Explains ML"), # Valid
            make_edit("ID_04", "b_roll", search_query="demo"),                    # Invalid: no reason
            make_edit("ID_99", "zoom_in"),                                        # Invalid: bad ID
            make_edit("ID_06", "sfx", sound_effect="pop"),                        # Valid
        ]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert report.accepted_count == 4  # zoom + cut + broll + sfx
        assert report.rejected_count == 2  # no reason + bad ID

    def test_report_contains_rejection_reasons(self):
        """Ensure rejection issues are logged with explanations."""
        edits = [
            make_edit("ID_03", "b_roll", search_query="ml"),  # No reason
        ]
        validated, report = validate_blueprint(edits, TMAP, VIDEO_DURATION)
        assert len(report.issues) == 1
        assert "reason" in report.issues[0].issue.lower()
