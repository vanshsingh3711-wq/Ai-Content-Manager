import sys
import json
from services.compositor import _get_video_codec

def test_pipeline():
    timeline = [
        {"is_cut": False, "start": 0.0, "end": 2.5, "chunk_id": "ID_01", "actions": [{"action": "motion_graphics", "motion_graphics_text": "Hello"}]},
        {"is_cut": False, "start": 2.5, "end": 5.0, "chunk_id": "ID_02", "actions": [{"action": "character", "character_action": "wave"}]},
    ]
    
    cmd = ["ffmpeg", "-y", "-i", "raw.mp4"]
    filter_str = []
    concat_v = []
    concat_a = []
    input_idx = 1
    
    target_w, target_h = 1080, 1920
    source_fps = 25
    
    for seg_idx, seg in enumerate(timeline):
        if seg["is_cut"]: continue
        
        start_t = seg["start"]
        end_t = seg["end"]
        duration = end_t - start_t
        if duration <= 0.05: continue
        
        # Audio and Video trims
        filter_str.append(f"[0:v]trim=start={start_t:.3f}:end={end_t:.3f},setpts=PTS-STARTPTS[base_v_{seg_idx}];")
        filter_str.append(f"[0:a]atrim=start={start_t:.3f}:end={end_t:.3f},asetpts=PTS-STARTPTS[base_a_{seg_idx}];")
        
        current_v = f"[base_v_{seg_idx}]"
        current_a = f"[base_a_{seg_idx}]"
        
        # Scale
        filter_str.append(f"{current_v}scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}[norm_v_{seg_idx}];")
        current_v = f"[norm_v_{seg_idx}]"
        
        for action in seg["actions"]:
            if action["action"] == "motion_graphics":
                cmd.extend(["-i", f"mg_{seg_idx}.webm"])
                filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[mg_v_{seg_idx}];")
                filter_str.append(f"{current_v}[mg_v_{seg_idx}]overlay=x=0:y=0:eof_action=pass[out_v_mg_{seg_idx}];")
                current_v = f"[out_v_mg_{seg_idx}]"
                input_idx += 1
            elif action["action"] == "character":
                cmd.extend(["-i", f"char_{seg_idx}.webm"])
                filter_str.append(f"[{input_idx}:v]setpts=PTS-STARTPTS[char_v_{seg_idx}];")
                filter_str.append(f"{current_v}[char_v_{seg_idx}]overlay=x=0:y=0:eof_action=pass[out_v_char_{seg_idx}];")
                current_v = f"[out_v_char_{seg_idx}]"
                input_idx += 1
                
        concat_v.append(current_v)
        concat_a.append(current_a)
        
    for v in concat_v: filter_str.append(v)
    for a in concat_a: filter_str.append(a)
    
    filter_str.append(f"concat=n={len(concat_v)}:v=1:a=1[out_v][out_a];")
    filter_str.append(f"[out_v]format=yuv420p[final_v]")
    
    cmd.extend([
        "-filter_complex", "".join(filter_str),
        "-map", "[final_v]",
        "-map", "[out_a]",
        "output.mp4"
    ])
    
    print(" ".join(cmd))

if __name__ == "__main__":
    test_pipeline()
