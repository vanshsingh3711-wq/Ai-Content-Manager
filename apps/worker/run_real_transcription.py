import json
import asyncio
from services.transcriber import transcribe_and_compress
from services.beat_analyzer import analyze_script

async def run():
    wav_path = "new_explain_audio.wav"
    print(f"Transcribing {wav_path}...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(wav_path)
    
    with open("real_timestamp_map.json", "w") as f:
        json.dump(timestamp_map, f, indent=2)
    print("Saved real_timestamp_map.json")
    
    words = []
    sorted_chunks = sorted(timestamp_map.values(), key=lambda x: x["start"])
    for chunk in sorted_chunks:
        for w in chunk.get("words", []):
            words.append({
                "word": w["word"],
                "start": w["start"],
                "end": w["end"]
            })
            
    print(f"Analyzing {len(words)} words...")
    beat_sheet = analyze_script(words, "dummy script")
    
    with open("real_beat_sheet.json", "w") as f:
        f.write(beat_sheet.model_dump_json(indent=2))
        
    print(f"Generated {len(beat_sheet.beats)} beats. Saved real_beat_sheet.json")

if __name__ == "__main__":
    asyncio.run(run())
