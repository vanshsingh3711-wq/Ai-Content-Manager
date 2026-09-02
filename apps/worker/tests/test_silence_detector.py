import pytest
import tempfile
import os
import wave
import struct
from services.silence_detector import detect_silences

def create_test_wav(filepath: str, sample_rate: int = 16000):
    """Creates a 3-second WAV file: 1s noise, 1s silence, 1s noise"""
    with wave.open(filepath, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        
        # 1 sec noise (amplitude 10000)
        noise_frames = struct.pack(f"<{sample_rate}h", *[10000] * sample_rate)
        # 1 sec silence (amplitude 0)
        silence_frames = struct.pack(f"<{sample_rate}h", *[0] * sample_rate)
        
        wav_file.writeframes(noise_frames)
        wav_file.writeframes(silence_frames)
        wav_file.writeframes(noise_frames)

def test_detect_silences():
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        test_wav = tmp.name
        
    try:
        create_test_wav(test_wav)
        
        # Test silence detection
        silences = detect_silences(test_wav, noise_tolerance="-30dB", min_duration=0.5)
        
        assert len(silences) == 1
        assert 0.9 <= silences[0]["start"] <= 1.1
        assert 1.9 <= silences[0]["end"] <= 2.1
        assert 0.9 <= silences[0]["duration"] <= 1.1
    finally:
        if os.path.exists(test_wav):
            os.remove(test_wav)

def test_no_silence():
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        test_wav = tmp.name
        
    try:
        with wave.open(test_wav, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(16000)
            noise_frames = struct.pack(f"<{16000 * 2}h", *[10000] * (16000 * 2))
            wav_file.writeframes(noise_frames)
            
        silences = detect_silences(test_wav, min_duration=0.5)
        assert len(silences) == 0
    finally:
        if os.path.exists(test_wav):
            os.remove(test_wav)
