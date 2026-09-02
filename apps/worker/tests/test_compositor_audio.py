"""
Tests for the Compositor audio handling and post-render validation.
Verifies that:
  - B-roll FFmpeg commands always map original audio explicitly
  - B-roll audio is never selected as primary
  - Post-render validation catches missing audio
  - Segment timeline builds correctly with cuts
"""
import pytest
from unittest.mock import patch, MagicMock
from services.compositor import _build_segment_timeline


# ─── Timeline Building ────────────────────────────────────────────────────

class TestSegmentTimeline:
    def test_basic_timeline(self):
        """Timeline should contain all chunks in order with gaps filled."""
        timestamp_map = {
            "ID_01": {"start": 0.5, "end": 3.0, "text": "Hello"},
            "ID_02": {"start": 3.5, "end": 7.0, "text": "World"},
        }
        timeline = _build_segment_timeline([], timestamp_map, 8.0)
        # Should have: GAP_0 (0-0.5), ID_01, GAP_1 (3.0-3.5), ID_02, GAP_FINAL (7.0-8.0)
        assert len(timeline) == 5
        assert timeline[0]["chunk_id"] == "GAP_0"
        assert timeline[1]["chunk_id"] == "ID_01"
        assert timeline[2]["chunk_id"] == "GAP_1"
        assert timeline[3]["chunk_id"] == "ID_02"
        assert timeline[4]["chunk_id"] == "GAP_FINAL"

    def test_cut_segments_marked(self):
        """Segments with 'cut' action should have is_cut=True."""
        timestamp_map = {
            "ID_01": {"start": 0.0, "end": 3.0, "text": "Keep"},
            "ID_02": {"start": 3.0, "end": 6.0, "text": "Remove"},
        }
        edits = [{"action": "cut", "start": 3.0, "end": 6.0}]
        timeline = _build_segment_timeline(edits, timestamp_map, 6.0)
        kept = [s for s in timeline if not s["is_cut"]]
        cut = [s for s in timeline if s["is_cut"]]
        assert len(cut) == 1
        assert cut[0]["chunk_id"] == "ID_02"

    def test_broll_action_attached_to_segment(self):
        """B-roll actions should be attached to the correct segment."""
        timestamp_map = {
            "ID_01": {"start": 0.0, "end": 3.0, "text": "Hello"},
            "ID_02": {"start": 3.0, "end": 6.0, "text": "World"},
        }
        edits = [{"trigger_id": "ID_02", "action": "b_roll", "search_query": "test"}]
        timeline = _build_segment_timeline(edits, timestamp_map, 6.0)
        id02_seg = [s for s in timeline if s["chunk_id"] == "ID_02"][0]
        assert len(id02_seg["actions"]) == 1
        assert id02_seg["actions"][0]["action"] == "b_roll"

    def test_empty_timestamp_map_uses_full_video(self):
        """With no chunks, should use full video as single segment."""
        timeline = _build_segment_timeline([], {}, 10.0)
        assert len(timeline) == 1
        assert timeline[0]["chunk_id"] == "FULL"
        assert timeline[0]["start"] == 0.0
        assert timeline[0]["end"] == 10.0

    def test_cuts_and_keeps_are_synchronized(self):
        """Cutting a segment removes both video and audio at that time range."""
        timestamp_map = {
            "ID_01": {"start": 0.0, "end": 5.0, "text": "Keep"},
            "ID_02": {"start": 5.0, "end": 10.0, "text": "Cut this"},
            "ID_03": {"start": 10.0, "end": 15.0, "text": "Keep again"},
        }
        edits = [{"action": "cut", "start": 5.0, "end": 10.0}]
        timeline = _build_segment_timeline(edits, timestamp_map, 15.0)
        kept = [s for s in timeline if not s["is_cut"]]
        # After cut: segments at [0-5] and [10-15] remain
        kept_chunks = [s for s in kept if s["chunk_id"].startswith("ID_")]
        assert len(kept_chunks) == 2
        assert kept_chunks[0]["start"] == 0.0
        assert kept_chunks[0]["end"] == 5.0
        assert kept_chunks[1]["start"] == 10.0
        assert kept_chunks[1]["end"] == 15.0

    def test_arbitrary_cut_beginning(self):
        """Cutting from 0.0 to 3.75s removes exactly that gap."""
        timestamp_map = {
            "ID_01": {"start": 3.75, "end": 6.89, "text": "Keep this"},
            "ID_02": {"start": 7.00, "end": 10.0, "text": "And this"},
        }
        edits = [{"action": "cut", "start": 0.0, "end": 3.75}]
        timeline = _build_segment_timeline(edits, timestamp_map, 10.0)
        kept = [s for s in timeline if not s["is_cut"]]
        cut = [s for s in timeline if s["is_cut"]]
        
        # Original timeline: GAP_0(0-3.75), ID_01(3.75-6.89), GAP_1(6.89-7.00), ID_02(7.0-10.0)
        assert len(kept) == 3
        assert kept[0]["start"] == 3.75
        assert kept[0]["end"] == 6.89
        assert kept[0]["chunk_id"] == "ID_01"
        assert kept[1]["chunk_id"] == "GAP_1"
        assert kept[2]["chunk_id"] == "ID_02"
        
        assert len(cut) == 1
        assert cut[0]["start"] == 0.0
        assert cut[0]["end"] == 3.75
        assert cut[0]["chunk_id"] == "GAP_0"

    def test_arbitrary_cut_inside_chunk(self):
        """Cutting exactly 3.75-6.89 removes that exact chunk range."""
        timestamp_map = {
            "ID_01": {"start": 3.75, "end": 6.89, "text": "Cut this exact chunk bounds"},
        }
        edits = [{"action": "cut", "start": 3.75, "end": 6.89}]
        timeline = _build_segment_timeline(edits, timestamp_map, 10.0)
        kept = [s for s in timeline if not s["is_cut"]]
        cut = [s for s in timeline if s["is_cut"]]
        
        assert len(kept) == 2
        assert kept[0]["start"] == 0.0
        assert kept[0]["end"] == 3.75
        assert kept[0]["chunk_id"] == "GAP_0"
        assert kept[1]["start"] == 6.89
        assert kept[1]["end"] == 10.0
        assert kept[1]["chunk_id"] == "GAP_FINAL"

        assert len(cut) == 1
        assert cut[0]["start"] == 3.75
        assert cut[0]["end"] == 6.89
        assert cut[0]["chunk_id"] == "ID_01"



# ─── Audio Mapping Tests (Mock-based) ────────────────────────────────────

class TestBrollAudioMapping:
    """
    These tests verify the LOGIC of audio mapping without running FFmpeg.
    They check that the compositor correctly constructs FFmpeg commands
    that map the original audio (0:a) instead of B-roll audio.
    """

    def test_broll_command_uses_mandatory_audio_mapping(self):
        """
        The B-roll FFmpeg command must use '-map 0:a' (mandatory),
        NOT '-map 0:a?' (optional/silent-skip).
        """
        # Import the module to inspect the source code
        import inspect
        from services import compositor
        source = inspect.getsource(compositor.render_video_pipeline)

        # The B-roll section must map audio explicitly
        # It should contain '-map", "0:a"' (mandatory)
        # It should NOT contain '0:a?' (optional)
        assert '"-map", "0:a"' in source or '"0:a"' in source, \
            "B-roll FFmpeg command must use mandatory audio mapping '0:a', not optional '0:a?'"

    def test_broll_command_does_not_use_optional_audio(self):
        """
        The compositor must NOT use '0:a?' which silently drops audio.
        """
        import inspect
        from services import compositor
        source = inspect.getsource(compositor.render_video_pipeline)
        assert '"0:a?"' not in source, \
            "Found '0:a?' in compositor — this causes silent audio during B-roll segments!"

    def test_broll_command_uses_shortest_flag(self):
        """
        The B-roll FFmpeg command should use '-shortest' to prevent A/V duration mismatch.
        """
        import inspect
        from services import compositor
        source = inspect.getsource(compositor.render_video_pipeline)
        assert '"-shortest"' in source, \
            "B-roll FFmpeg command should use '-shortest' to sync A/V durations"


# ─── Post-Render Validation Tests ─────────────────────────────────────────

class TestPostRenderValidation:
    def test_validate_catches_missing_audio(self):
        """
        _validate_rendered_output should raise when source has audio
        but output doesn't.
        """
        from services.compositor import _validate_rendered_output
        with patch("services.compositor._probe_streams") as mock_probe:
            mock_probe.return_value = {
                "has_video": True,
                "has_audio": False,  # Missing audio!
                "video_duration": 30.0,
                "audio_duration": 0.0,
            }
            with patch("services.compositor.os.path.exists", return_value=True):
                with patch("services.compositor.os.path.getsize", return_value=50000):
                    with pytest.raises(RuntimeError, match="AUDIO FAILURE"):
                        _validate_rendered_output("ffmpeg", "/fake/output.mp4", source_has_audio=True)

    def test_validate_catches_short_audio(self):
        """
        _validate_rendered_output should raise when audio is suspiciously short
        compared to video.
        """
        from services.compositor import _validate_rendered_output
        with patch("services.compositor._probe_streams") as mock_probe:
            mock_probe.return_value = {
                "has_video": True,
                "has_audio": True,
                "video_duration": 35.0,
                "audio_duration": 4.0,  # Only 4s of audio for 35s video!
            }
            with patch("services.compositor.os.path.exists", return_value=True):
                with patch("services.compositor.os.path.getsize", return_value=50000):
                    with pytest.raises(RuntimeError, match="AUDIO FAILURE"):
                        _validate_rendered_output("ffmpeg", "/fake/output.mp4", source_has_audio=True)

    def test_validate_passes_with_good_output(self):
        """
        _validate_rendered_output should pass when audio/video are both present
        and durations match.
        """
        from services.compositor import _validate_rendered_output
        with patch("services.compositor._probe_streams") as mock_probe:
            mock_probe.return_value = {
                "has_video": True,
                "has_audio": True,
                "video_duration": 35.0,
                "audio_duration": 34.5,  # Within tolerance
            }
            with patch("services.compositor.os.path.exists", return_value=True):
                with patch("services.compositor.os.path.getsize", return_value=50000):
                    with patch("services.compositor._probe_duration", return_value=35.0):
                        # Should not raise
                        _validate_rendered_output("ffmpeg", "/fake/output.mp4", source_has_audio=True)

    def test_validate_no_video_stream_raises(self):
        """Output without video stream should be treated as failure."""
        from services.compositor import _validate_rendered_output
        with patch("services.compositor._probe_streams") as mock_probe:
            mock_probe.return_value = {
                "has_video": False,
                "has_audio": True,
                "video_duration": 0,
                "audio_duration": 30.0,
            }
            with patch("services.compositor.os.path.exists", return_value=True):
                with patch("services.compositor.os.path.getsize", return_value=50000):
                    with patch("services.compositor._probe_duration", return_value=0.0):
                        with pytest.raises(RuntimeError, match="NO video stream"):
                            _validate_rendered_output("ffmpeg", "/fake/output.mp4", source_has_audio=False)
