import subprocess
import re
from typing import List, Dict
from services.media_extractor import get_ffmpeg_binary_path

def detect_silences(
    audio_path: str,
    noise_tolerance: str = "-35dB",
    min_duration: float = 0.5
) -> List[Dict[str, float]]:
    """
    Analyzes an audio file using FFmpeg's silencedetect filter and returns a list of 
    true audio silence events (low volume).
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    
    # Run ffmpeg with silencedetect filter. We don't need an output file, so format is null
    # Example command: ffmpeg -i input.wav -af silencedetect=noise=-35dB:d=0.5 -f null -
    cmd = [
        ffmpeg_bin,
        "-i", audio_path,
        "-af", f"silencedetect=noise={noise_tolerance}:d={min_duration}",
        "-f", "null",
        "-"
    ]
    
    try:
        # We capture stderr because ffmpeg logs filter output there
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output = result.stderr
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"FFmpeg silence detection failed: {e.stderr}") from e

    # Parse FFmpeg output
    # Example lines:
    # [silencedetect @ 0x...] silence_start: 12.4
    # [silencedetect @ 0x...] silence_end: 14.1 | silence_duration: 1.7
    
    silences = []
    current_start = None
    
    for line in output.splitlines():
        if "silence_start:" in line:
            match = re.search(r"silence_start:\s*([\d\.]+)", line)
            if match:
                current_start = float(match.group(1))
        elif "silence_end:" in line:
            end_match = re.search(r"silence_end:\s*([\d\.]+)", line)
            dur_match = re.search(r"silence_duration:\s*([\d\.]+)", line)
            if end_match and dur_match and current_start is not None:
                end = float(end_match.group(1))
                duration = float(dur_match.group(1))
                silences.append({
                    "start": round(current_start, 3),
                    "end": round(end, 3),
                    "duration": round(duration, 3)
                })
                current_start = None
                
    return silences
