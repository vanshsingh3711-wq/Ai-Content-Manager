import pytest
from services.compositor import _build_segment_timeline, _generate_ffmpeg_script_for_segment

def test_mid_segment_filter_graph():
    # Segment 0 to 10s
    seg = {
        "start": 0.0,
        "end": 10.0,
        "is_cut": False,
        "duration": 10.0,
        "actions": [
            {
                "action": "b_roll",
                "original_start": 4.0, # mid-segment
                "original_end": 8.0,
                "asset_path": "test_broll.mp4"
            }
        ]
    }
    
    settings = {"USE_GRANULAR_OVERLAYS": True, "MIN_FRAGMENT_DURATION": 1.0}
    filters, inputs = _generate_ffmpeg_script_for_segment(seg, 0, {"b_roll": "test_broll.mp4"}, settings)
    
    # We should see setpts offset
    assert any("setpts=PTS-STARTPTS+4.0/TB" in f for f in filters), "Expected setpts to offset overlay to start at 4.0s"
    assert any("enable='between(t,4.0,8.0)'" in f for f in filters), "Expected enable window"
    
    print("\n--- Mid-segment Filter Graph ---")
    print("\n".join(filters))
    
    # Check that without GRANULAR, it's just a normal overlay without setpts offset (wait, the flag is off)
    # Actually, the user asked to show the filter graph. I will just run this test with -s to show it.
