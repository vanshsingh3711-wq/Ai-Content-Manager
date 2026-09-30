import json
import subprocess
from unittest.mock import patch
from services.compositor import render_video_pipeline
import sys

def mock_run_ffmpeg(cmd, label):
    # If it's a probe command
    if "ffprobe" in cmd[0]:
        if "-show_entries" in cmd and "format=duration" in cmd:
            return subprocess.CompletedProcess(args=cmd, returncode=0, stdout=b"10.0\n", stderr=b"")
        elif "-show_streams" in cmd:
            out = json.dumps({"streams": [{"codec_type": "video", "width": 1080, "height": 1920}, {"codec_type": "audio"}]})
            return subprocess.CompletedProcess(args=cmd, returncode=0, stdout=out.encode(), stderr=b"")
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout=b"10.0\n", stderr=b"")

    if "-filter_complex_script" in cmd:
        idx = cmd.index("-filter_complex_script")
        script_file = cmd[idx+1]
        with open(script_file, "r") as sf:
            content = sf.read()
        print(content.strip())
    else:
        if "-filter_complex" in cmd:
            idx = cmd.index("-filter_complex")
            print(cmd[idx+1].strip())

    return subprocess.CompletedProcess(args=cmd, returncode=0, stdout=b"", stderr=b"")

def main():
    edits = [
        {"action": "b_roll", "start": 0.0, "end": 3.75, "trigger_id": "ID_0", "transition": "fade"},
        {"action": "motion_graphics", "start": 0.0, "end": 3.2, "trigger_id": "ID_1"}
    ]
    ts_map = {"0": {"start": 0.0, "end": 10.0}}
    broll_map = {"ID_0": "broll_red.mp4"}
    mg_map = {"ID_1": "mg_1.mov"}
    
    with patch("services.compositor._run_ffmpeg", side_effect=mock_run_ffmpeg):
        try:
            render_video_pipeline(
                raw_video_path="dummy_1min.mp4",
                output_mp4_path="out.mp4",
                subtitle_ass_path=None,
                broll_map=broll_map,
                edits=edits,
                timestamp_map=ts_map,
                settings={"USE_GRANULAR_OVERLAYS": sys.argv[1] == "true"}
            )
        except Exception as e:
            pass

if __name__ == "__main__":
    main()
