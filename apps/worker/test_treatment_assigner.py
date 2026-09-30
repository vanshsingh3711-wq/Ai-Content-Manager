import json
from services.treatment_assigner import assign_visual_treatments

def main():
    with open("real_beat_sheet.json", "r") as f:
        beat_sheet = json.load(f)
    
    total_dur = beat_sheet.get("total_duration", 60.0)
    settings = {"MAX_OVERLAYS_PER_MIN": 8, "MIN_OVERLAY_DURATION": 2.0, "MAX_OVERLAY_DURATION": 6.0, "MAX_UNTREATED_GAP_SEC": 9.0}
    
    updated, log_table = assign_visual_treatments(beat_sheet, total_dur, settings)
    
    print(f"{'Beat':<5} | {'Start':<6} | {'End':<6} | {'Gap':<6} | {'Treatment':<15} | {'Reason'}")
    print("-" * 70)
    
    current_gap_start = 0.0
    for beat in updated["beats"]:
        if beat["treatment"] != "none":
            gap = beat["start"] - current_gap_start
            current_gap_start = beat["end"]
        else:
            gap = 0.0
        
        # This isn't completely accurate gap display, but let's just print the table
        print(f"{beat['id']:<5} | {beat['start']:<6.1f} | {beat['end']:<6.1f} | {gap:<6.1f} | {beat['treatment']:<15} | {beat.get('treatment_reason', '')}")
        
    final_gap = total_dur - current_gap_start
    print(f"Final gap: {final_gap:.1f}s")

if __name__ == "__main__":
    main()
