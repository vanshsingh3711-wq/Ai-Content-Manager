import json
import logging
from services.beat_analyzer import analyze_script

logging.basicConfig(level=logging.INFO)

def main():
    with open('real_timestamp_map.json', 'r') as f:
        raw_map = json.load(f)
        
    timestamp_map = []
    for chunk_id, chunk_data in raw_map.items():
        timestamp_map.extend(chunk_data.get("words", []))
        
    script_text = " ".join([w["word"] for w in timestamp_map])
    
    print("Running beat analyzer on real transcript...")
    beat_sheet = analyze_script(timestamp_map, script_text, max_retries=2)
    
    # Save the new beat sheet
    with open('real_beat_sheet_v2.json', 'w') as f:
        f.write(beat_sheet.model_dump_json(indent=2))
        
    print(f"\n{'ID':<3} | {'Role':<12} | {'Concreteness':<12} | {'Imp':<3} | {'Focus Phrase':<25} | {'Focus Dur'}")
    print("-" * 80)
    for b in beat_sheet.beats:
        words = [timestamp_map[i]["word"] for i in range(b.focus_start_word_index, b.focus_end_word_index + 1)]
        focus_phrase = " ".join(words)
        focus_dur = b.focus_end - b.focus_start
        print(f"{b.id:<3} | {b.role:<12} | {b.concreteness:<12} | {b.importance:<3} | {focus_phrase[:25]:<25} | {focus_dur:.2f}s")

if __name__ == "__main__":
    main()
