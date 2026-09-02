# Diagnosis: Video Segment Duration Drift (+1.06s)

## 1. Expected vs. Actual Segment Durations
When applying the single cut from `0.0s` to `1.10s` (which results in one main segment from `1.10s` to the end of the video), the durations are as follows:

- **Expected duration:** 40.09s (41.19s original duration - 1.10s)
- **Actual video duration:** ~41.11s
- **Difference (Drift):** ~+1.02s to +1.06s

## 2. Source of the Difference
The difference is entirely caused by the **video duration** rounding upward. The audio duration trims exactly to the sample, but the video stream captures extra frames at the beginning of the segment.

## 3. Root Cause of the +1.06s Drift
The root cause is the placement of the `-ss` and `-t` arguments **before** the input file (`-i`) in `compositor.py`.
```python
# Current Logic in compositor.py
cmd = [
    ffmpeg_bin, "-y",
    "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}", 
    "-i", raw_video_path,
    # ...
]
```

When `-ss` is placed before the input file, FFmpeg performs an **input-side seek** (fast seek). FFmpeg seeks to the nearest keyframe *before* the requested timestamp. In this case, for `-ss 1.10`, the nearest keyframe is at `0.00s`. 

Instead of dropping the frames between `0.00s` and `1.10s` and starting the encode at `1.10s`, FFmpeg starts decoding and encoding the video immediately from the `0.00s` keyframe. Because the `-t` duration is also evaluated relative to this starting point, the resulting segment includes the frames from `0.00s` to `1.10s` that were supposed to be cut out! This essentially negates the cut, resulting in a segment that is almost the length of the original video (hence the 41.11s output instead of 40.07s).

When this happens across multiple smaller segments, the start of *every* segment gets rounded backward to the nearest keyframe, causing each segment's duration to inflate (drift upwards) by an average of 0.05s - 0.15s per segment.

## 4. Required Fix in the Compositor
To fix this and achieve accurate timestamp-based video trimming, the `-ss` and `-t` arguments must be moved to the **output options** (after the input file and before the output filename). 

**Which part of the compositor should be changed:**
In `apps/worker/services/compositor.py`, within the `_run_segment_render` loop (around line 521 for normal segments, and line 512 for B-roll segments), the command structure should be changed to:

```python
cmd = [
    ffmpeg_bin, "-y",
    "-i", raw_video_path,
    "-ss", f"{start_t:.3f}", "-t", f"{duration:.3f}",
    "-vf", vf_chain,
    # ...
]
```

When `-ss` and `-t` are output options, FFmpeg performs an **output-side seek**. It decodes the video from the nearest keyframe but *discards* the decoded frames until it reaches exactly `1.10s`. It then accurately encodes frames for exactly the requested `-t` duration. This provides frame-accurate cuts and completely eliminates the GOP keyframe rounding drift.
