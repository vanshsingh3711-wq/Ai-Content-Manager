import pytest
from services.transcriber import calculate_transcription_coverage

def test_calculate_transcription_coverage_empty():
    res = calculate_transcription_coverage([], 10.0)
    assert res["source_duration"] == 10.0
    assert res["transcript_covered_duration"] == 0.0
    assert res["transcript_coverage_ratio"] == 0.0
    assert res["largest_transcript_gap"] == 10.0

def test_calculate_transcription_coverage_full():
    intervals = [(0.0, 10.0)]
    res = calculate_transcription_coverage(intervals, 10.0)
    assert res["transcript_covered_duration"] == 10.0
    assert res["transcript_coverage_ratio"] == 1.0
    assert res["largest_transcript_gap"] == 0.0

def test_calculate_transcription_coverage_gaps():
    # 0..2 (2s gap) 4..6 (4s gap) 10..11
    intervals = [(0.0, 2.0), (4.0, 6.0), (10.0, 11.0)]
    res = calculate_transcription_coverage(intervals, 15.0)
    
    assert res["source_duration"] == 15.0
    # covered: 2 + 2 + 1 = 5
    assert res["transcript_covered_duration"] == 5.0
    assert res["transcript_coverage_ratio"] == round(5.0 / 15.0, 3)
    
    # gaps:
    # 0 to 0 = 0
    # 2 to 4 = 2
    # 6 to 10 = 4
    # 11 to 15 = 4
    assert res["largest_transcript_gap"] == 4.0

def test_calculate_transcription_coverage_overlapping():
    intervals = [(1.0, 4.0), (3.0, 5.0), (4.5, 6.0)]
    res = calculate_transcription_coverage(intervals, 10.0)
    
    assert res["source_duration"] == 10.0
    # union is 1.0 to 6.0 = 5.0s
    assert res["transcript_covered_duration"] == 5.0
    assert res["transcript_coverage_ratio"] == 0.5
    
    # gaps:
    # 0 to 1 = 1.0
    # 6 to 10 = 4.0
    assert res["largest_transcript_gap"] == 4.0

from unittest.mock import patch, MagicMock

@patch("services.transcriber.get_whisper_model")
def test_transcribe_and_compress_ignores_whitespace(mock_get_model):
    mock_model = MagicMock()
    mock_get_model.return_value = mock_model
    
    class MockWord:
        def __init__(self, word, start, end, probability=0.9):
            self.word = word
            self.start = start
            self.end = end
            self.probability = probability

    class MockSegment:
        def __init__(self, text, start, end, words):
            self.text = text
            self.start = start
            self.end = end
            self.words = words
            
    mock_model.transcribe.return_value = (
        [
            MockSegment(
                text="hello   world", 
                start=0.0, 
                end=10.0, 
                words=[
                    MockWord("hello", 0.0, 2.0),
                    MockWord("   ", 4.0, 7.0),
                    MockWord("world", 8.0, 10.0)
                ]
            )
        ],
        None
    )
    
    from services.transcriber import transcribe_and_compress
    
    # Run the function
    with patch("os.path.exists", return_value=True):
        llm_payload, timestamp_map = transcribe_and_compress("fake_audio.wav")
    
    # Verify the whitespace word was completely skipped
    # Since the whitespace word (4.0-7.0) was removed, the gap between "hello" (2.0) 
    # and "world" (8.0) is now 6.0s. This exceeds the 0.8s threshold, splitting them into two chunks.
    assert "ID_01" in timestamp_map
    assert "ID_02" in timestamp_map
    
    chunk1_words = timestamp_map["ID_01"]["words"]
    chunk2_words = timestamp_map["ID_02"]["words"]
    
    assert len(chunk1_words) == 1
    assert chunk1_words[0]["word"] == "hello"
    
    assert len(chunk2_words) == 1
    assert chunk2_words[0]["word"] == "world"
    
    all_words = [w["word"] for w in chunk1_words] + [w["word"] for w in chunk2_words]
    assert "   " not in all_words
