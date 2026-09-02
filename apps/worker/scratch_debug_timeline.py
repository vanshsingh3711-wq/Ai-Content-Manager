import os
import sys
import json
sys.path.append(os.getcwd())

from services.transcriber import transcribe_and_compress
from services.silence_detector import detect_silences
from services.audio_analysis import classify_audio_regions
from services.compositor import _probe_duration
from services.media_extractor import get_ffmpeg_binary_path

def main():
    audio_path = "temp_test_audio.wav"
    print("[*] Probing duration...")
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, audio_path)
    
    print("[*] Detecting FFmpeg silences...")
    silence_results = detect_silences(audio_path)
    silence_intervals = [(s["start"], s["end"]) for s in silence_results]
    
    print("[*] Transcribing audio with VAD and word-filtering...")
    llm_payload, timestamp_map = transcribe_and_compress(
        audio_path=audio_path,
        speech_gap_threshold_sec=0.8,
        model_size="small"
    )
    
    print("[*] Extracting word-level speech intervals...")
    speech_intervals = [
        (word["start"], word["end"])
        for chunk in timestamp_map.values()
        for word in chunk["words"]
        if word["end"] > word["start"]
    ]
    
    print("[*] Classifying audio regions...")
    regions = classify_audio_regions(total_duration, speech_intervals, silence_intervals)
    
    print("\n" + "="*50)
    print("FINAL UNIFIED AUDIO REGIONS:")
    print("="*50)
    print(json.dumps(regions, indent=2))

if __name__ == "__main__":
    main()
