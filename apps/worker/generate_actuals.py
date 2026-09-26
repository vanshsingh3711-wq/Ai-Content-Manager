import os
import sys
import time
import json
import subprocess

sys.path.append(os.getcwd())
from services.compositor import render_video_pipeline, _probe_duration
from services.transcriber import transcribe_and_compress
from services.subtitle_generator import generate_ass_subtitles
from services.media_extractor import get_ffmpeg_binary_path

script_text = """Your screen is lying to you. There's no motion here at all. Video is just still images. Thousands of them. Called frames. Play 24 to 60 frames per second, and your brain stitches them into smooth movement. That's it. That's the whole trick. Each frame? A grid of pixels. Every pixel stores three numbers — red, green, blue. 8 bits each. So one pixel = 3 bytes. Do the math: 1080p, 30fps equals 186 megabytes per second. Raw. Unwatchable. Impossible to stream. Enter codecs — like H.264 or AV1. They don't store every frame fully. They save one keyframe, then only what changed after it. Same video, 100x smaller. Video isn't moving pictures — it's compression magic. Follow for more CS in 60 seconds."""

def main():
    print("Generating TTS...")
    audio_path = "how_video_works.wav"
    raw_video = "how_video_works_raw.mp4"
    out_video = "how_video_works_final.mp4"
    sub_path = "how_video_works.ass"
    
    if not os.path.exists(audio_path):
        os.system(f'../../.venv/bin/edge-tts --text "{script_text}" --write-media "{audio_path}" --voice "en-US-ChristopherNeural"')
        
    ffmpeg_bin = get_ffmpeg_binary_path()
    total_duration = _probe_duration(ffmpeg_bin, audio_path)
    print(f"Audio duration: {total_duration}s")
    
    if not os.path.exists(raw_video):
        print("Generating raw dummy video...")
        os.system(f'{ffmpeg_bin} -y -f lavfi -i color=c=black:s=1080x1920:d={total_duration} -i "{audio_path}" -c:v libx264 -preset ultrafast -c:a aac -shortest "{raw_video}"')
        
    print("Transcribing...")
    bracketed, timestamp_map = transcribe_and_compress(audio_path, speech_gap_threshold_sec=0.5, model_size="small")
    
    # We will build edits
    edits = []
    
    # We map chunks to visuals based on their text content
    for chunk_id, chunk in timestamp_map.items():
        text = chunk["text"].lower()
        print(f"{chunk_id}: {text}")
        
        # Decide actions based on keywords
        if "screen is lying" in text or "motion here" in text:
            edits.append({"trigger_id": chunk_id, "action": "character", "character_action": "explain"})
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "Your Screen is Lying", "template": "MotionGraphicsPreview"})
        elif "still images" in text or "frames" in text:
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "Still Images = Frames", "template": "MotionGraphicsPreview"})
        elif "smooth movement" in text or "whole trick" in text:
            edits.append({"trigger_id": chunk_id, "action": "character", "character_action": "wave"})
        elif "grid of pixels" in text or "3 bytes" in text or "red, green, blue" in text:
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "1 Pixel = 3 Bytes", "template": "MotionGraphicsPreview"})
        elif "do the math" in text or "megabytes" in text or "impossible" in text:
            edits.append({"trigger_id": chunk_id, "action": "character", "character_action": "surprised"})
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "186 MB/sec", "template": "MotionGraphicsPreview"})
        elif "enter codecs" in text or "keyframe" in text:
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "Codecs (H.264/AV1)", "template": "MotionGraphicsPreview"})
        elif "100x smaller" in text or "compression magic" in text or "follow for more" in text:
            edits.append({"trigger_id": chunk_id, "action": "character", "character_action": "point"})
            edits.append({"trigger_id": chunk_id, "action": "motion_graphics", "motion_graphics_text": "Compression Magic", "template": "MotionGraphicsPreview"})
        else:
            edits.append({"trigger_id": chunk_id, "action": "character", "character_action": "neutral"})

    print(f"Generated {len(edits)} edits.")
    
    print("Generating subtitles...")
    generate_ass_subtitles(timestamp_map, sub_path, edits, font_size=55, primary_color="&H00FFFFFF", highlight_color="&H0000FFFF")
    
    print("Rendering final video...")
    try:
        final_out = render_video_pipeline(
            raw_video_path=raw_video,
            output_mp4_path=out_video,
            subtitle_ass_path=sub_path,
            edits=edits,
            timestamp_map=timestamp_map,
            settings={"aspect_ratio": "9:16"}
        )
        print(f"\nSUCCESS! Output saved to: {final_out}")
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    main()
