import os
from typing import Any, Dict, List, Tuple
from faster_whisper import WhisperModel

_model_cache: Dict[str, WhisperModel] = {}


def get_whisper_model(
    model_size: str = "small",
    device: str = "cpu",
    compute_type: str = "int8",
) -> WhisperModel:
    """
    Lazily instantiates and caches the WhisperModel instance inside worker task executions.
    Avoids global initialization to prevent Celery fork memory locks.
    """
    cache_key = f"{model_size}_{device}_{compute_type}"
    if cache_key not in _model_cache:
        print(f"[*] Loading faster-whisper model ({model_size}, device={device}, compute_type={compute_type})...")
        _model_cache[cache_key] = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
            cpu_threads=4,
        )
    return _model_cache[cache_key]


def format_timestamp(seconds: float) -> str:
    """Converts raw seconds float to MM:SS.ss timestamp string."""
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes:02d}:{secs:05.2f}"


def calculate_transcription_coverage(intervals: List[Tuple[float, float]], total_duration: float) -> Dict[str, float]:
    """
    Calculates coverage ratio and largest gap from a list of transcription intervals.
    """
    if not intervals or total_duration <= 0:
        return {
            "source_duration": total_duration,
            "transcript_covered_duration": 0.0,
            "transcript_coverage_ratio": 0.0,
            "largest_transcript_gap": total_duration
        }

    # Sort and merge intervals
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            merged[-1] = (prev[0], max(prev[1], current[1]))
        else:
            merged.append(current)

    covered_duration = sum(end - start for start, end in merged)
    coverage_ratio = covered_duration / total_duration if total_duration > 0 else 0.0

    max_gap = 0.0
    # Gap before first interval
    max_gap = max(max_gap, merged[0][0])
    # Gaps between intervals
    for i in range(1, len(merged)):
        gap = merged[i][0] - merged[i-1][1]
        max_gap = max(max_gap, gap)
    # Gap after last interval
    if total_duration > merged[-1][1]:
        max_gap = max(max_gap, total_duration - merged[-1][1])

    return {
        "source_duration": round(total_duration, 2),
        "transcript_covered_duration": round(covered_duration, 2),
        "transcript_coverage_ratio": round(coverage_ratio, 3),
        "largest_transcript_gap": round(max_gap, 2)
    }



def transcribe_and_compress(
    audio_path: str,
    speech_gap_threshold_sec: float = 0.8,
    model_size: str = "small",
    initial_prompt: str = "This is a video featuring Hindi and English mixed language. नमस्ते, hello, kaise ho, how are you.",
) -> Tuple[str, Dict[str, Any]]:
    """
    Transcribes audio with word-level timestamps, detects speech gaps (>0.8s),
    and compresses speech into a token-efficient bracket format with a deterministic timestamp map.

    Returns:
        llm_payload (str): Bracket-compressed transcript for Gemini Flash.
        timestamp_map (dict): Mapping chunk IDs to exact deterministic timestamps.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found at: {audio_path}")

    model = get_whisper_model(model_size=model_size)

    # Execute word-level transcription (VAD disabled so it doesn't accidentally skip speech)
    segments, info = model.transcribe(
        audio_path,
        word_timestamps=True,
        beam_size=5,
        vad_filter=True,
        initial_prompt=initial_prompt,
    )

    all_words = []
    for segment in segments:
        if segment.words:
            for word in segment.words:
                stripped_word = word.word.strip()
                if not stripped_word:
                    continue
                all_words.append({
                    "word": stripped_word,
                    "start": round(word.start, 2),
                    "end": round(word.end, 2),
                    "probability": round(word.probability, 2),
                })
        else:
            # Fallback if segment lacks word breakdown
            stripped_text = segment.text.strip()
            if not stripped_text:
                continue
            all_words.append({
                "word": stripped_text,
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "probability": 1.0,
            })

    if not all_words:
        return ("ID_01: [00:00.00 - 00:01.00] (No speech detected)", {
            "ID_01": {"start": 0.0, "end": 1.0, "text": "(No speech detected)", "words": []}
        })

    # Group words into logical chunks based on punctuation and speech gaps > 0.8s
    chunks: List[Dict[str, Any]] = []
    current_chunk_words: List[Dict[str, Any]] = []

    for i, word_info in enumerate(all_words):
        if not current_chunk_words:
            current_chunk_words.append(word_info)
            continue

        prev_word = current_chunk_words[-1]
        speech_gap = word_info["start"] - prev_word["end"]
        prev_word_text = prev_word["word"]

        # Break conditions: speech gap > threshold OR sentence punctuation OR chunk size >= 18 words
        is_speech_gap_break = speech_gap >= speech_gap_threshold_sec
        is_punct_break = any(prev_word_text.endswith(p) for p in [".", "!", "?", "\n"])
        is_len_break = len(current_chunk_words) >= 18

        if is_speech_gap_break or is_punct_break or is_len_break:
            # Finalize current chunk
            chunk_start = current_chunk_words[0]["start"]
            chunk_end = current_chunk_words[-1]["end"]
            chunk_text = " ".join(w["word"] for w in current_chunk_words)
            chunks.append({
                "start": chunk_start,
                "end": chunk_end,
                "text": chunk_text,
                "words": current_chunk_words,
            })
            current_chunk_words = [word_info]
        else:
            current_chunk_words.append(word_info)

    # Add final remaining chunk
    if current_chunk_words:
        chunks.append({
            "start": current_chunk_words[0]["start"],
            "end": current_chunk_words[-1]["end"],
            "text": " ".join(w["word"] for w in current_chunk_words),
            "words": current_chunk_words,
        })

    # Build outputs
    llm_lines: List[str] = []
    timestamp_map: Dict[str, Any] = {}

    for idx, chunk in enumerate(chunks, start=1):
        chunk_id = f"ID_{idx:02d}"
        start_str = format_timestamp(chunk["start"])
        end_str = format_timestamp(chunk["end"])
        
        # LLM line format: ID_01: [00:12.40 - 00:15.20] The text content.
        llm_lines.append(f"{chunk_id}: [{start_str} - {end_str}] {chunk['text']}")
        timestamp_map[chunk_id] = chunk

    llm_payload = "\n".join(llm_lines)
    return llm_payload, timestamp_map
