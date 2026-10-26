"""
benchmark_render.py — Reproducible, deterministic rendering benchmark for AI Director.

Measures local FFmpeg compositing throughput, encoding latency, peak RSS memory,
and validates stream integrity without external API or cloud dependencies.
"""

import json
import os
import platform
import resource
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict

# Ensure apps/worker is on python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from services.compositor import render_video_pipeline, get_ffmpeg_binary_path, _get_ffprobe_bin
from services.subtitle_generator import generate_ass_subtitles


def get_system_info() -> Dict[str, str]:
    """Collects host environment details for benchmark context."""
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffmpeg_ver = "unknown"
    try:
        ver_res = subprocess.run([ffmpeg_bin, "-version"], capture_output=True, text=True, timeout=5)
        if ver_res.returncode == 0:
            ffmpeg_ver = ver_res.stdout.splitlines()[0]
    except Exception:
        pass

    return {
        "os": f"{platform.system()} {platform.release()}",
        "architecture": platform.machine(),
        "python_version": platform.python_version(),
        "ffmpeg_version": ffmpeg_ver,
    }


def generate_synthetic_fixture(output_path: str, duration: float = 5.0, width: int = 1080, height: int = 1920, fps: int = 30) -> None:
    """Generates a deterministic 1080x1920 test video with continuous audio tone."""
    ffmpeg_bin = get_ffmpeg_binary_path()
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", f"testsrc2=size={width}x{height}:rate={fps}:duration={duration}",
        "-f", "lavfi", "-i", f"sine=frequency=440:sample_rate=44100:duration={duration}",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "26",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        output_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Failed to generate synthetic fixture: {res.stderr}")


def probe_media_file(file_path: str, ffprobe_bin: str) -> Dict[str, Any]:
    """Extracts exact stream and container metrics using ffprobe."""
    cmd = [
        ffprobe_bin, "-v", "error",
        "-show_entries", "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
        "-of", "json",
        file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if res.returncode != 0:
        raise RuntimeError(f"ffprobe failed on {file_path}: {res.stderr}")
    return json.loads(res.stdout)


def run_benchmark(duration_sec: float = 5.0) -> Dict[str, Any]:
    """Executes the deterministic rendering benchmark and returns verified metrics."""
    ffmpeg_bin = get_ffmpeg_binary_path()
    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)

    if not shutil.which(ffmpeg_bin):
        raise FileNotFoundError(f"FFmpeg binary not found at '{ffmpeg_bin}'")

    sys_info = get_system_info()
    temp_dir = tempfile.mkdtemp(prefix="ai_director_bench_")

    try:
        raw_fixture = os.path.join(temp_dir, "raw_fixture.mp4")
        subtitle_ass = os.path.join(temp_dir, "subtitles.ass")
        output_mp4 = os.path.join(temp_dir, "benchmark_output.mp4")
        cache_dir = os.path.join(temp_dir, "cache")
        os.makedirs(cache_dir, exist_ok=True)

        print(f"[*] Generating synthetic {duration_sec}s 1080x1920 fixture...")
        generate_synthetic_fixture(raw_fixture, duration=duration_sec, width=1080, height=1920, fps=30)
        fixture_bytes = os.path.getsize(raw_fixture)

        # Generate sample subtitles
        timestamp_map = {
            "c1": {
                "start": 0.5,
                "end": 2.5,
                "text": "Benchmarking autonomous compositor",
                "words": [
                    {"word": "Benchmarking", "start": 0.5, "end": 1.2},
                    {"word": "autonomous", "start": 1.2, "end": 1.8},
                    {"word": "compositor", "start": 1.8, "end": 2.5},
                ]
            },
            "c2": {
                "start": 2.8,
                "end": 4.8,
                "text": "Production quality verification pass",
                "words": [
                    {"word": "Production", "start": 2.8, "end": 3.4},
                    {"word": "quality", "start": 3.4, "end": 4.0},
                    {"word": "verification", "start": 4.0, "end": 4.5},
                    {"word": "pass", "start": 4.5, "end": 4.8},
                ]
            }
        }
        generate_ass_subtitles(
            timestamp_map=timestamp_map,
            output_ass_path=subtitle_ass,
            caption_preset="tiktok_yellow",
            aspect_ratio="9:16",
        )

        # Baseline edits: 2 sequential scenes with speech, silence cut between 2.5s and 2.8s
        edits = [
            {"action": "speech", "start": 0.0, "end": 2.5, "trigger_id": "c1"},
            {"action": "cut_silence", "start": 2.5, "end": 2.8, "trigger_id": "silence_1"},
            {"action": "speech", "start": 2.8, "end": 5.0, "trigger_id": "c2"},
        ]

        # Reset memory watermark before render
        mem_before_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

        print("[*] Executing compositor rendering pipeline...")
        t0 = time.perf_counter()

        render_video_pipeline(
            raw_video_path=raw_fixture,
            output_mp4_path=output_mp4,
            subtitle_ass_path=subtitle_ass,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={
                "aspect_ratio": "9:16",
                "segment_cache_dir": cache_dir,
                "enable_segment_cache": True,
            }
        )

        elapsed_sec = time.perf_counter() - t0
        mem_after_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

        # Platform-specific maxrss scaling (Linux reports KB, macOS reports bytes)
        scale = 1024.0 if platform.system() == "Darwin" else 1.0
        peak_rss_mb = (mem_after_kb * scale) / 1024.0

        # Validate rendered output
        if not os.path.exists(output_mp4):
            raise RuntimeError(f"Output video was not created: {output_mp4}")

        probe_data = probe_media_file(output_mp4, ffprobe_bin)
        fmt = probe_data.get("format", {})
        streams = probe_data.get("streams", [])

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

        if not video_stream:
            raise RuntimeError("Validation failed: Output video stream missing")
        if not audio_stream:
            raise RuntimeError("Validation failed: Output audio stream missing")

        output_duration = float(fmt.get("duration", 0.0))
        output_bytes = int(fmt.get("size", 0))

        # Real-time factor (render time / video duration)
        rtf = elapsed_sec / output_duration if output_duration > 0 else 0.0

        results = {
            "status": "PASS",
            "benchmark_name": "compositor_local_deterministic_render",
            "system_info": sys_info,
            "input": {
                "fixture_duration_sec": duration_sec,
                "resolution": "1080x1920",
                "fps": 30,
                "size_bytes": fixture_bytes,
            },
            "output": {
                "duration_sec": round(output_duration, 3),
                "size_bytes": output_bytes,
                "video_codec": video_stream.get("codec_name"),
                "video_resolution": f"{video_stream.get('width')}x{video_stream.get('height')}",
                "audio_codec": audio_stream.get("codec_name"),
                "audio_channels": audio_stream.get("channels"),
            },
            "performance": {
                "elapsed_time_sec": round(elapsed_sec, 3),
                "real_time_factor": round(rtf, 2),
                "peak_rss_mb": round(peak_rss_mb, 2),
            },
            "reproduction_command": ".venv/bin/python apps/worker/benchmark_render.py",
        }

        return results

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    print(f"\n{'='*70}\n AI DIRECTOR — REPRODUCIBLE RENDERING BENCHMARK\n{'='*70}\n")
    try:
        report = run_benchmark(duration_sec=5.0)
        print("\n" + json.dumps(report, indent=2))
        print(f"\n[✓] Benchmark completed successfully.")
        print(f"    Elapsed: {report['performance']['elapsed_time_sec']}s (RTF: {report['performance']['real_time_factor']}x)")
        print(f"    Peak RSS Memory: {report['performance']['peak_rss_mb']} MB")
        print(f"    Output Resolution: {report['output']['video_resolution']}, Codec: {report['output']['video_codec']}")
        print(f"    Streams: Video ({report['output']['video_codec']}) + Audio ({report['output']['audio_codec']})\n")
    except Exception as err:
        print(f"\n[!] Benchmark failed: {err}")
        sys.exit(1)
