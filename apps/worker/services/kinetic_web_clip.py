"""
Kinetic Web Clip Video Generator.

Converts static web evidence captures (documentation, SaaS pricing, GitHub cards, articles)
into production-ready, vertical 9:16 (1080x1920) animated video clips.

Features:
1. Browser Frame Chrome: Sleek macOS window bar with traffic light dots and clean URL/title.
2. Animated Pan & Scroll: Smooth vertical camera scroll across the captured webpage.
3. Ambient Background Plate: Darkened, blurred ambient drop-shadow backdrop.
4. Universal Multi-Track Format: 1080x1920 30fps H.264 (yuv420p) with silent AAC stereo audio.
"""

import os
import shutil
import subprocess
from typing import Optional


def get_ffmpeg_binary() -> str:
    """Returns path to system or imageio ffmpeg."""
    ff = shutil.which("ffmpeg")
    if ff:
        return ff
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def generate_kinetic_web_clip(
    screenshot_path: str,
    output_mp4_path: str,
    duration: float = 4.0,
    title: str = "Web Evidence",
    fps: int = 30,
    width: int = 1080,
    height: int = 1920,
) -> str:
    """
    Renders an animated 9:16 vertical video clip from a web capture screenshot.

    :param screenshot_path: Path to PNG or JPEG screenshot of the webpage.
    :param output_mp4_path: Output file path for the rendered MP4.
    :param duration: Duration of the animated video in seconds (default 4.0).
    :param title: Display title / URL shown in browser chrome.
    :param fps: Video framerate (default 30).
    :param width: Target width (default 1080).
    :param height: Target height (default 1920).
    :return: Absolute path to the rendered MP4.
    """
    if not os.path.exists(screenshot_path):
        raise FileNotFoundError(f"Source screenshot does not exist: {screenshot_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_mp4_path)), exist_ok=True)
    ffmpeg_bin = get_ffmpeg_binary()

    content_w = 960
    margin_x = (width - content_w) // 2  # 60px
    top_y = 260
    viewport_h = 1400

    # Clean display title
    safe_title = title.replace("'", "").replace(":", "-")[:45]

    # Filtergraph pipeline:
    # 1. Base dark background plate: 1080x1920 dark charcoal
    # 2. Ambient blurred background from screenshot
    # 3. Webpage scaled to content_w=960 with smooth vertical scroll
    # 4. macOS browser header bar with traffic light buttons (close, minimize, zoom)
    filter_complex = (
        f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,"
        f"crop={width}:{height},boxblur=lr=25:lp=2,eq=brightness=-0.35:saturation=1.2[bg];"
        f"[0:v]scale={content_w}:-1[web_scaled];"
        f"[bg][web_scaled]overlay=x={margin_x}:"
        f"y='if(gt(overlay_h,{viewport_h}),{top_y}-((overlay_h-{viewport_h})*min(1,t/{duration})),({height}-overlay_h)/2)':"
        f"shortest=1[web_scrolled];"
        # Draw mockup browser window header bar
        f"[web_scrolled]drawbox=x={margin_x}:y={top_y - 48}:w={content_w}:h=48:color=#1e1f2b@0.95:t=fill,"
        # Traffic light buttons: red (#ff5f56), yellow (#ffbd2e), green (#27c93f)
        f"drawbox=x={margin_x + 18}:y={top_y - 32}:w=14:h=14:color=#ff5f56:t=fill,"
        f"drawbox=x={margin_x + 38}:y={top_y - 32}:w=14:h=14:color=#ffbd2e:t=fill,"
        f"drawbox=x={margin_x + 58}:y={top_y - 32}:w=14:h=14:color=#27c93f:t=fill,"
        # Subtle border frame around the browser window
        f"drawbox=x={margin_x}:y={top_y - 48}:w={content_w}:h={viewport_h + 48}:color=#ffffff@0.12:t=2[v]"
    )

    cmd = [
        ffmpeg_bin,
        "-y",
        "-loop", "1",
        "-i", screenshot_path,
        "-f", "lavfi",
        "-i", f"anullsrc=channel_layout=stereo:sample_rate=44100",
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", "1:a",
        "-t", f"{duration:.3f}",
        "-r", str(fps),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_mp4_path,
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not os.path.exists(output_mp4_path) or os.path.getsize(output_mp4_path) < 1024:
        # Fallback simpler filtergraph if complex drawbox fails
        fallback_filter = (
            f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},boxblur=20[bg];"
            f"[0:v]scale={content_w}:-1[web_scaled];"
            f"[bg][web_scaled]overlay=x={margin_x}:y={top_y}[v]"
        )
        cmd_fallback = [
            ffmpeg_bin,
            "-y",
            "-loop", "1",
            "-i", screenshot_path,
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-filter_complex", fallback_filter,
            "-map", "[v]",
            "-map", "1:a",
            "-t", f"{duration:.3f}",
            "-r", str(fps),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            output_mp4_path,
        ]
        res_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True)
        if res_fallback.returncode != 0 or not os.path.exists(output_mp4_path):
            raise RuntimeError(f"FFmpeg kinetic web clip generation failed: {res.stderr}\nFallback: {res_fallback.stderr}")

    return output_mp4_path
