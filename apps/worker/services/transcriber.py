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


def transcribe_and_compress(
    audio_path: str,
    silence_threshold_sec: float = 0.8,
    model_size: str = "small",
    initial_prompt: str = "This is a video featuring Hindi and English mixed language. नमस्ते, hello, kaise ho, how are you.",
) -> Tuple[str, Dict[str, Any]]:
    """
    Transcribes audio with word-level timestamps, detects silence gaps (>0.8s),
    and compresses speech into a token-efficient bracket format with a deterministic timestamp map.

    Returns:
        llm_payload (str): Bracket-compressed transcript for Gemini Flash.
        timestamp_map (dict): Mapping chunk IDs to exact deterministic timestamps.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found at: {audio_path}")

    model = get_whisper_model(model_size=model_size)

    # Execute word-level transcription with Voice Activity Detection (VAD) filter
    segments, info = model.transcribe(
        audio_path,
        word_timestamps=True,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        initial_prompt=initial_prompt,
    )

    all_words = []
    for segment in segments:
        if segment.words:
            for word in segment.words:
                all_words.append({
                    "word": word.word.strip(),
                    "start": round(word.start, 2),
                    "end": round(word.end, 2),
                    "probability": round(word.probability, 2),
                })
        else:
            # Fallback if segment lacks word breakdown
            all_words.append({
                "word": segment.text.strip(),
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "probability": 1.0,
            })

    if not all_words:
        return ("ID_01: [00:00.00 - 00:01.00] (No speech detected)", {
            "ID_01": {"start": 0.0, "end": 1.0, "text": "(No speech detected)", "words": []}
        })

    # Group words into logical chunks based on punctuation and silences > 0.8s
    chunks: List[Dict[str, Any]] = []
    current_chunk_words: List[Dict[str, Any]] = []

    for i, word_info in enumerate(all_words):
        if not current_chunk_words:
            current_chunk_words.append(word_info)
            continue

        prev_word = current_chunk_words[-1]
        silence_gap = word_info["start"] - prev_word["end"]
        prev_word_text = prev_word["word"]

        # Break conditions: silence > threshold OR sentence punctuation OR chunk size >= 18 words
        is_silence_break = silence_gap >= silence_threshold_sec
        is_punct_break = any(prev_word_text.endswith(p) for p in [".", "!", "?", "\n"])
        is_len_break = len(current_chunk_words) >= 18

        if is_silence_break or is_punct_break or is_len_break:
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
