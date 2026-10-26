import os
import time
import subprocess
import pytest
from services.compositor import (
    compute_segment_cache_key,
    is_valid_cached_segment,
    clean_segment_cache,
    get_ffmpeg_binary_path,
    _get_ffprobe_bin,
)


def test_cache_key_determinism():
    key1 = compute_segment_cache_key(
        raw_video_path="/tmp/fake_raw.mp4",
        start_t=0.0,
        end_t=5.0,
        filter_complex="scale=1080:1920",
        extra_inputs=["/tmp/broll1.mp4", "/tmp/broll2.mp4"],
        codec="libx264",
        fps=30.0,
        target_w=1080,
        target_h=1920,
    )
    key2 = compute_segment_cache_key(
        raw_video_path="/tmp/fake_raw.mp4",
        start_t=0.0,
        end_t=5.0,
        filter_complex="scale=1080:1920",
        extra_inputs=["/tmp/broll2.mp4", "/tmp/broll1.mp4"],  # Permuted order
        codec="libx264",
        fps=30.0,
        target_w=1080,
        target_h=1920,
    )
    assert key1 == key2, "Cache key should be deterministic and order-independent for extra_inputs"


def test_cache_key_sensitivity_to_parameters():
    base_kwargs = {
        "raw_video_path": "/tmp/video.mp4",
        "start_t": 1.0,
        "end_t": 6.0,
        "filter_complex": "crop=1080:1920",
        "extra_inputs": [],
        "codec": "libx264",
        "fps": 30.0,
        "target_w": 1080,
        "target_h": 1920,
    }
    base_key = compute_segment_cache_key(**base_kwargs)

    # 1. Change timing
    k_time = compute_segment_cache_key(**{**base_kwargs, "start_t": 1.001})
    assert k_time != base_key

    # 2. Change filter
    k_filter = compute_segment_cache_key(**{**base_kwargs, "filter_complex": "crop=1080:1920,setsar=1"})
    assert k_filter != base_key

    # 3. Change resolution
    k_res = compute_segment_cache_key(**{**base_kwargs, "target_h": 1080, "target_w": 1920})
    assert k_res != base_key

    # 4. Change codec
    k_codec = compute_segment_cache_key(**{**base_kwargs, "codec": "h264_nvenc"})
    assert k_codec != base_key


def test_is_valid_cached_segment_rejects_missing_and_tiny_files(tmp_path):
    assert not is_valid_cached_segment(str(tmp_path / "non_existent.mp4"))

    tiny_file = tmp_path / "tiny.mp4"
    tiny_file.write_bytes(b"small")
    assert not is_valid_cached_segment(str(tiny_file), min_size=100)


def test_is_valid_cached_segment_rejects_corrupted_header(tmp_path):
    corrupt_file = tmp_path / "corrupt.mp4"
    # Write 4KB of garbage text with no MP4 box atoms
    corrupt_file.write_bytes(b"GARBAGE_HEADER_DATA_NOT_AN_MP4" * 150)
    assert not is_valid_cached_segment(str(corrupt_file))


def test_is_valid_cached_segment_accepts_valid_mp4(tmp_path):
    ffmpeg_bin = get_ffmpeg_binary_path()
    valid_mp4 = str(tmp_path / "valid.mp4")

    # Generate small 0.2s synthetic video
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "color=c=green:s=64x64:d=0.2:r=25",
        "-c:v", "libx264", "-preset", "ultrafast",
        valid_mp4
    ]
    subprocess.run(cmd, capture_output=True, check=True)

    ffprobe_bin = _get_ffprobe_bin(ffmpeg_bin)
    assert is_valid_cached_segment(valid_mp4, ffprobe_bin=ffprobe_bin)


def test_clean_segment_cache_expiry_and_tmp_purging(tmp_path):
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()

    # Create old orphan tmp file (>1h old)
    orphan_tmp = cache_dir / "tmp_12345_999_abcd.mp4"
    orphan_tmp.write_bytes(b"tmp" * 500)
    old_mtime = time.time() - 7200  # 2 hours ago
    os.utime(orphan_tmp, (old_mtime, old_mtime))

    # Create fresh valid segment file
    fresh_seg = cache_dir / "seg_valid1.mp4"
    fresh_seg.write_bytes(b"seg" * 500)

    # Create expired segment file (>7 days old)
    expired_seg = cache_dir / "seg_expired.mp4"
    expired_seg.write_bytes(b"old" * 500)
    expired_mtime = time.time() - (8 * 86400)
    os.utime(expired_seg, (expired_mtime, expired_mtime))

    removed = clean_segment_cache(str(cache_dir), max_age_days=7)

    assert removed == 2
    assert not orphan_tmp.exists()
    assert not expired_seg.exists()
    assert fresh_seg.exists()


def test_clean_segment_cache_lru_quota_enforcement(tmp_path):
    cache_dir = tmp_path / "quota_cache"
    cache_dir.mkdir()

    # Create 3 segments of 1000 bytes each with distinct timestamps within retention window
    now = time.time()
    seg1 = cache_dir / "seg_old.mp4"
    seg1.write_bytes(b"1" * 1000)
    os.utime(seg1, (now - 3000, now - 3000))

    seg2 = cache_dir / "seg_mid.mp4"
    seg2.write_bytes(b"2" * 1000)
    os.utime(seg2, (now - 2000, now - 2000))

    seg3 = cache_dir / "seg_new.mp4"
    seg3.write_bytes(b"3" * 1000)
    os.utime(seg3, (now - 1000, now - 1000))

    # Max allowed size: 1500 bytes (should evict seg1 and seg2)
    removed = clean_segment_cache(str(cache_dir), max_age_days=30, max_size_bytes=1500)

    assert removed == 2
    assert not seg1.exists()
    assert not seg2.exists()
    assert seg3.exists()
