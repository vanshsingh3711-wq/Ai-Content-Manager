import os
import sys

sys.path.append(os.getcwd())
from services.compositor import _build_segment_timeline, _probe_duration, get_ffmpeg_binary_path

bin_path = get_ffmpeg_binary_path()
dur = _probe_duration(bin_path, r"C:\Users\asus\OneDrive\Documents\Main Projects\Ai Content Manager\media_temp\raw-uploads\default_user\05e8e841-e5f6-4339-8c85-1be7dfaec590-ejaz_testign_video.mp4")

# Mock what happens when there is no transcript map but there are edits
# AI Director outputs {"action": "cut", "start": 0.0, "end": 1.10}
timeline = _build_segment_timeline([{"action": "cut", "start": 0.0, "end": 1.10}], {}, dur)

print("Timeline:")
for seg in timeline:
    print(seg)
