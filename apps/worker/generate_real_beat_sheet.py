import json
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.beat_analyzer import analyze_script

def generate_and_save_beat_sheet():
    load_dotenv("../../.env")
    
    with open("real_timestamp_map.json", "r") as f:
        ts_map = json.load(f)
        
    words_for_beat = []
    sorted_chunks = sorted(ts_map.values(), key=lambda x: x.get("start", 0))
    for chunk in sorted_chunks:
        for w in chunk.get("words", []):
            words_for_beat.append({"word": w["word"], "start": w["start"], "end": w["end"]})
            
    transcript = " ".join(w["word"] for w in words_for_beat)
    
    beat_sheet_obj = analyze_script(words_for_beat, transcript)
    beat_sheet_dict = beat_sheet_obj.model_dump()
    
    out_file = "real_beat_sheet_final.json"
    with open(out_file, "w") as f:
        json.dump(beat_sheet_dict, f, indent=2)
        
    print(f"Generated {len(beat_sheet_dict['beats'])} beats and saved to {out_file}")

if __name__ == "__main__":
    generate_and_save_beat_sheet()
