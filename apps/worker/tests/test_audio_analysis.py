import pytest
from services.audio_analysis import classify_audio_regions

def test_classify_audio_regions_basic():
    duration = 10.0
    speech_intervals = [(0.0, 4.0), (8.0, 10.0)]
    silence_intervals = [(4.0, 6.0)]
    
    regions = classify_audio_regions(duration, speech_intervals, silence_intervals)
    
    assert len(regions) == 4
    assert regions[0] == {"start": 0.0, "end": 4.0, "type": "SPEECH"}
    assert regions[1] == {"start": 4.0, "end": 6.0, "type": "SILENCE"}
    assert regions[2] == {"start": 6.0, "end": 8.0, "type": "NON_SPEECH_AUDIO"}
    assert regions[3] == {"start": 8.0, "end": 10.0, "type": "SPEECH"}

def test_classify_audio_regions_overlap():
    duration = 5.0
    # Speech overrides silence if they overlap
    speech_intervals = [(1.0, 3.0)]
    silence_intervals = [(2.0, 4.0)]
    
    regions = classify_audio_regions(duration, speech_intervals, silence_intervals)
    
    assert len(regions) == 4
    assert regions[0] == {"start": 0.0, "end": 1.0, "type": "NON_SPEECH_AUDIO"}
    assert regions[1] == {"start": 1.0, "end": 3.0, "type": "SPEECH"}
    assert regions[2] == {"start": 3.0, "end": 4.0, "type": "SILENCE"}
    assert regions[3] == {"start": 4.0, "end": 5.0, "type": "NON_SPEECH_AUDIO"}

def test_classify_audio_regions_no_events():
    duration = 5.0
    regions = classify_audio_regions(duration, [], [])
    
    assert len(regions) == 1
    assert regions[0] == {"start": 0.0, "end": 5.0, "type": "NON_SPEECH_AUDIO"}

def test_classify_audio_regions_out_of_bounds():
    # Should clip to total_duration
    duration = 5.0
    speech_intervals = [(-1.0, 2.0), (4.0, 10.0)]
    silence_intervals = []
    
    regions = classify_audio_regions(duration, speech_intervals, silence_intervals)
    assert len(regions) == 3
    assert regions[0] == {"start": 0.0, "end": 2.0, "type": "SPEECH"}
    assert regions[1] == {"start": 2.0, "end": 4.0, "type": "NON_SPEECH_AUDIO"}
    assert regions[2] == {"start": 4.0, "end": 5.0, "type": "SPEECH"}

def test_classify_audio_regions_with_word_intervals():
    duration = 10.0
    # Simulate a single chunk that spans 0.0 to 10.0 with a large internal gap
    timestamp_map = {
        "ID_01": {
            "start": 0.0,
            "end": 10.0,
            "text": "hello world",
            "words": [
                {"word": "hello", "start": 0.0, "end": 2.0},
                {"word": "world", "start": 8.0, "end": 10.0}
            ]
        }
    }
    
    # Extract exact word boundaries instead of chunk boundaries
    speech_intervals = [
        (word["start"], word["end"])
        for chunk in timestamp_map.values()
        for word in chunk["words"]
        if word["end"] > word["start"]
    ]
    
    silence_intervals = []
    
    regions = classify_audio_regions(duration, speech_intervals, silence_intervals)
    
    # The large gap between 2.0 and 8.0 should be NON_SPEECH_AUDIO, not SPEECH.
    assert len(regions) == 3
    assert regions[0] == {"start": 0.0, "end": 2.0, "type": "SPEECH"}
    assert regions[1] == {"start": 2.0, "end": 8.0, "type": "NON_SPEECH_AUDIO"}
    assert regions[2] == {"start": 8.0, "end": 10.0, "type": "SPEECH"}
