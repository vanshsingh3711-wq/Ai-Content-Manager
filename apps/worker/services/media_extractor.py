"""
Media Extractor Service
Extracts audio tracks from video files using FFmpeg for Whisper transcription.
"""

import os
import shutil
import subprocess
import ffmpeg
import imageio_ffmpeg


def get_ffmpeg_binary_path() -> str:
    """Returns path to the ffmpeg binary, resolving from PATH or bundled imageio-ffmpeg."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def extract_audio_track(
    video_path: str,
    output_wav_path: str,
    sample_rate: int = 16000,
    channels: int = 1,
) -> str:
    """
    Extracts the audio track from a video file and converts it into a
    16kHz, mono, 16-bit PCM .wav file for optimal faster-whisper transcription.

    Raises RuntimeError on failure instead of silently generating placeholder audio.
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    os.makedirs(os.path.dirname(os.path.abspath(output_wav_path)), exist_ok=True)

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"[EXTRACTOR:ERROR] Input video file not found at: {video_path}")

    file_size = os.path.getsize(video_path)
    if file_size < 1024:
        raise ValueError(
            f"[EXTRACTOR:ERROR] Input video is only {file_size} bytes — "
            f"this is a stub/placeholder, not a real video. Path: {video_path}"
        )

    print(f"  [EXTRACTOR] Extracting audio from {file_size:,} byte video -> {output_wav_path}", flush=True)

    try:
        stream = (
            ffmpeg.input(video_path)
            .output(
                output_wav_path,
                acodec="pcm_s16le",
                ac=channels,
                ar=str(sample_rate),
                vn=None,
                loglevel="error",
            )
            .overwrite_output()
        )

        ffmpeg.run(stream, cmd=ffmpeg_bin, capture_stdout=True, capture_stderr=True)

        if not os.path.exists(output_wav_path) or os.path.getsize(output_wav_path) == 0:
            raise RuntimeError(f"[EXTRACTOR:ERROR] Audio extraction produced empty WAV: {output_wav_path}")

        wav_size = os.path.getsize(output_wav_path)
        print(f"  [EXTRACTOR:OK] Extracted audio: {wav_size:,} bytes", flush=True)
        return output_wav_path

    except ffmpeg.Error as e:
        stderr_output = e.stderr.decode("utf-8", errors="replace") if e.stderr else str(e)
        raise RuntimeError(
            f"[EXTRACTOR:ERROR] FFmpeg audio extraction failed for {video_path}:\n{stderr_output}"
        ) from e


def generate_video_proxy(
    video_path: str,
    output_proxy_path: str,
    target_height: int = 540,
    fps: int = 30,
    crf: int = 26,
    preset: str = "veryfast",
    audio_bitrate: str = "96k",
) -> str:
    """
    Generates a lightweight 540p H.264 proxy video optimized for smooth HTML5 <video> scrubbing
    on hardware with constrained RAM (~8 GB). Places the 'moov' atom at the start (+faststart)
    for instant browser seeking without buffering the entire file.
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    os.makedirs(os.path.dirname(os.path.abspath(output_proxy_path)), exist_ok=True)

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"[PROXY:ERROR] Input video file not found at: {video_path}")

    file_size = os.path.getsize(video_path)
    if file_size < 1024:
        raise ValueError(
            f"[PROXY:ERROR] Input video is only {file_size} bytes — invalid video path: {video_path}"
        )

    print(f"  [PROXY] Generating {target_height}p proxy -> {output_proxy_path}", flush=True)

    cmd = [
        ffmpeg_bin, "-y",
        "-threads", "2",
        "-hide_banner",
        "-i", str(video_path),
        "-vf", f"scale=-2:{target_height}",
        "-r", str(fps),
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-c:a", "aac",
        "-b:a", audio_bitrate,
        "-movflags", "+faststart",
        str(output_proxy_path),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"[PROXY:ERROR] Proxy generation failed for {video_path} (code {result.returncode}):\n{result.stderr[-2000:]}"
        )

    if not os.path.exists(output_proxy_path) or os.path.getsize(output_proxy_path) == 0:
        raise RuntimeError(f"[PROXY:ERROR] Proxy generation produced empty file: {output_proxy_path}")

    proxy_size = os.path.getsize(output_proxy_path)
    print(f"  [PROXY:OK] Created {target_height}p proxy: {proxy_size:,} bytes", flush=True)
    return output_proxy_path

