import os
import sys
import argparse
import time
import json
import cv2
import math
import numpy as np
import io
from contextlib import redirect_stdout
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from style_learning.ingest import download_video
from style_learning.extractors import extract_timing, extract_color, extract_sound
from style_learning.vision import call_vision, estimate_cost
from services.beat_analyzer import analyze_script

MAX_FRAMES = 100

def drop_duplicates(frames_list, threshold=15.0):
    unique = []
    prev_img = None
    for t, f_path in frames_list:
        img = cv2.imread(f_path)
        if img is None: continue
        img_small = cv2.resize(img, (32, 32))
        img_gray = cv2.cvtColor(img_small, cv2.COLOR_BGR2GRAY)
        
        if prev_img is not None:
            mse = np.mean((img_gray - prev_img) ** 2)
            if mse < threshold:
                continue
                
        prev_img = img_gray
        unique.append((t, f_path))
    return unique

def generate_contact_sheet(sampled_files, output_path):
    if not sampled_files: return
    imgs = []
    for t, f_path in sampled_files:
        img = cv2.imread(f_path)
        if img is not None:
            img = cv2.resize(img, (160, 90))
            cv2.putText(img, f"{t:.1f}s", (5, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
            imgs.append(img)
    if not imgs: return
    cols = 5
    rows = (len(imgs) + cols - 1) // cols
    sheet = np.zeros((rows * 90, cols * 160, 3), dtype=np.uint8)
    for i, img in enumerate(imgs):
        r, c = i // cols, i % cols
        sheet[r*90:(r+1)*90, c*160:(c+1)*160] = img
    cv2.imwrite(output_path, sheet)

def generate_review_html(visual_events, output_path):
    html = ["<html><head><style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;} img{width:160px;}</style></head><body>"]
    html.append("<h2>Review Visual Events</h2>")
    html.append("<table><tr><th>Frame</th><th>Time</th><th>Spoken Words</th><th>Label</th><th>Reason</th><th>Confidence</th><th>Correct? (y/n)</th></tr>")
    
    for ev in visual_events:
        t = ev.get("timestamp", 0)
        img_url = f"frames/frame_{t:.1f}.jpg"
        words = ev.get("_text_context", "")
        what = ev.get("what", {})
        label = f"Type: {what.get('type', '')}<br>Overlay: {what.get('overlay_kind', '')}<br>Func: {ev.get('function', '')}"
        reason = ev.get("reason", "")
        conf = ev.get("confidence", "")
        html.append(f"<tr><td><img src='{img_url}'></td><td>{t:.1f}s</td><td>{words}</td><td>{label}</td><td>{reason}</td><td>{conf}</td><td></td></tr>")
        
    html.append("</table></body></html>")
    with open(output_path, "w") as f:
        f.write("\n".join(html))

def process_video(video_url, max_seconds, yes_flag):
    if "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[-1].split("?")[0]
    else:
        video_id = video_url.split("v=")[-1].split("&")[0]
        
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "styles", video_id))
    os.makedirs(output_dir, exist_ok=True)
    
    start_time = time.time()
    
    trap = io.StringIO()
    with redirect_stdout(trap):
        video_path, audio_path, video_title = download_video(video_url, output_dir)
        timing = extract_timing(video_path)
        duration = timing["duration"]
        if max_seconds and duration > max_seconds: duration = max_seconds
        
        from services.transcriber import get_whisper_model
        model = get_whisper_model(model_size="small")
        segments, _ = model.transcribe(audio_path, word_timestamps=True)
        
        words_for_beat = []
        for segment in segments:
            for w in segment.words:
                if max_seconds and w.end > max_seconds: continue
                words_for_beat.append({"word": w.word, "start": w.start, "end": w.end})
        transcript = " ".join([w["word"] for w in words_for_beat])
        
        beat_sheet = {}
        if words_for_beat:
            try:
                beat_sheet_obj = analyze_script(words_for_beat, transcript)
                beat_sheet = beat_sheet_obj.model_dump()
            except Exception as e:
                pass
                
        color = extract_color(video_path)
        
        cut_times = [c for c in timing["cut_times"] if c <= duration]
        interval_times = [float(i) for i in range(0, int(duration), 2)]
        sample_times = sorted(list(set([round(c, 1) for c in cut_times] + interval_times)))
        
        cap = cv2.VideoCapture(video_path)
        frames_dir = os.path.join(output_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        raw_sampled_files = []
        for t in sample_times:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ret, frame = cap.read()
            if ret:
                frame_path = os.path.join(frames_dir, f"frame_{t:.1f}.jpg")
                cv2.imwrite(frame_path, frame)
                raw_sampled_files.append((t, frame_path))
        cap.release()
        
        sampled_files = drop_duplicates(raw_sampled_files)
        
        if len(sampled_files) > MAX_FRAMES:
            sampled_files = sampled_files[:MAX_FRAMES]
            
        total_tokens_in, total_tokens_out, est_cost = estimate_cost(len(sampled_files))
        
    # Ask for confirmation if --yes not provided
    if not yes_flag:
        print(f"Video Title: {video_title}")
        print(f"Total unique frames to send: {len(sampled_files)}")
        print(f"Estimated Cost: ${est_cost:.4f}")
        print("\n[!] Please run with --yes to proceed with vision API calls.")
        sys.exit(0)

    # Proceed with vision inside trap to hide prints unless there's an error
    vision_start_time = time.time()
    visual_events = []
    failures = 0
    repairs = 0
    cache_file = os.path.join(output_dir, "vision_cache.json")
    
    with redirect_stdout(trap):
        for t, frame_path in sampled_files:
            context_words = [w["word"] for w in words_for_beat if abs((w["start"]+w["end"])/2 - t) < 5.0]
            text_context = " ".join(context_words)
            
            event = call_vision(frame_path, text_context, cache_file)
            if event:
                event["timestamp"] = t
                event["_text_context"] = text_context
                visual_events.append(event)
                if event.get("status") == "failed":
                    failures += 1
                if event.get("_repaired"):
                    repairs += 1
                    
        vision_end_time = time.time()
        
        sound = extract_sound(audio_path, cut_times)
        
        # Summary block
        summary = {
            "title": video_title,
            "duration": duration,
            "sfx_per_minute": sound["sfx_per_minute"],
            "cuts_per_minute": timing["cuts_per_minute"],
            "theme": color["brightness_summary"],
            "top_templates": [] # Could aggregate here
        }
        
        analysis = {
            "metadata": {
                "title": video_title,
                "duration": duration,
                "url": video_url
            },
            "timing": timing,
            "beat_sheet": beat_sheet,
            "color": color,
            "sound": sound,
            "visual_events": visual_events,
            "summary": summary
        }
        
        out_path = os.path.join(output_dir, "analysis.json")
        with open(out_path, "w") as f:
            json.dump(analysis, f, indent=2)
            
        generate_contact_sheet(sampled_files, os.path.join(output_dir, "contact_sheet.png"))
        generate_review_html(visual_events, os.path.join(output_dir, "review.html"))
        
    end_time = time.time()
    
    # Final structured output
    print(f"--- Style Extraction Complete ---")
    print(f"Outputs written to: {output_dir}/")
    print(f"  - analysis.json")
    print(f"  - contact_sheet.png")
    print(f"  - review.html")
    print("\n--- Timing Table ---")
    print(f"Ingest + Transcribe : {vision_start_time - start_time:.1f}s")
    print(f"Vision API Calls    : {vision_end_time - vision_start_time:.1f}s")
    print(f"Total Time          : {end_time - start_time:.1f}s")
    print("\n--- Frame Sampling ---")
    print(f"Frames from cuts    : {len(cut_times)}")
    print(f"Frames from 2s interval : {len(interval_times)}")
    print(f"Unique after dedupe : {len(sampled_files)}")
    print(f"Failures: {failures} | Auto-repairs: {repairs}")
    if words_for_beat:
        print(f"\nLast word end time: {words_for_beat[-1]['end']:.1f}s (Video duration: {duration:.1f}s)")
    print(f"\n--- Cost & Tokens ---")
    print(f"Input Tokens: {total_tokens_in}")
    print(f"Output Tokens: {total_tokens_out}")
    print(f"Total Cost: ${est_cost:.4f}")
    print(f"\n--- Summary Block ---")
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
    load_dotenv(env_path)
    
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="URL or file containing URLs")
    parser.add_argument("--max-seconds", type=float, default=None)
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()
    
    if os.path.isfile(args.url):
        with open(args.url, "r") as f:
            urls = [line.strip() for line in f if line.strip()]
        for url in urls:
            process_video(url, args.max_seconds, args.yes)
            break # Currently forced to only run the first video
    else:
        process_video(args.url, args.max_seconds, args.yes)
