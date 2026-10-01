import os
import json
import argparse
from dotenv import load_dotenv
from openai import OpenAI

def merge_visual_events(events):
    """
    Phase 2A: Merges consecutive frame events of the same type and trigger
    into a single temporal event with a start and end time.
    """
    if not events:
        return []

    merged = []
    current_event = None

    for event in events:
        # Skip failed events
        if event.get("status") == "failed" or "what" not in event:
            continue

        timestamp = event["timestamp"]
        event_type = event["what"].get("type")
        
        # We merge based on type and the exact text spoken to ensure we're grouping
        # frames that belong to the same narrative beat.
        trigger_text = event.get("trigger", {}).get("exact_words_spoken", "")

        if current_event is None:
            current_event = {
                "start": timestamp,
                "end": timestamp,
                "type": event_type,
                "trigger_text": trigger_text,
                "details": event
            }
        else:
            # If it's the same type, same trigger, and within 4 seconds of the current block
            if (current_event["type"] == event_type and 
                current_event["trigger_text"] == trigger_text and
                timestamp - current_event["end"] <= 4.0):
                
                # Extend the current event
                current_event["end"] = timestamp
            else:
                # Save current and start a new one
                current_event["duration"] = current_event["end"] - current_event["start"]
                merged.append(current_event)
                
                current_event = {
                    "start": timestamp,
                    "end": timestamp,
                    "type": event_type,
                    "trigger_text": trigger_text,
                    "details": event
                }

    if current_event:
        current_event["duration"] = current_event["end"] - current_event["start"]
        merged.append(current_event)

    return merged

def extract_editorial_logic(analysis_data, merged_events):
    """
    Phase 2C: Sends the transcript and merged events to a text LLM
    to extract the underlying editorial rules and narrative structure.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY environment variable not set")
        
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

    # Extract the transcript for context
    beat_sheet = analysis_data.get("beat_sheet", {})
    beats = beat_sheet.get("beats", [])
    full_transcript = " ".join([b.get("text", "") for b in beats])
    
    # Prepare a condensed version of the merged events to save tokens
    condensed_events = []
    for e in merged_events:
        condensed_events.append({
            "time": f"{e['start']:.1f}s - {e['end']:.1f}s",
            "type": e["type"],
            "function": e["details"].get("function", "unknown"),
            "trigger_quote": e["trigger_text"],
            "b_roll_desc": e["details"].get("b_roll", {}).get("description", "")
        })

    sound_data = analysis_data.get("sound", {})
    
    prompt = f"""You are an expert video editor and YouTube strategist.
I am providing you with the transcript of a video, a chronological list of visual events (b-roll, motion graphics), and audio metadata (SFX types and music behavior).

Your job is to reverse-engineer the EDITORIAL LOGIC of this video. I don't want a summary of the video. I want the editing rules.

TRANSCRIPT:
{full_transcript}

VISUAL EVENTS:
{json.dumps(condensed_events, indent=2)}

AUDIO DATA (SFX & Music):
{json.dumps(sound_data, indent=2)}

Analyze the relationship between the spoken words, visual events, and audio. 
Output your analysis strictly as a JSON object matching this structure:

{{
  "narrative_arc": {{
    "hook_type": "string (e.g. bold_claim, question, problem_statement)",
    "structure": ["list", "of", "narrative", "beats"],
    "section_separator": "string (how does the editor visually separate sections?)"
  }},
  "pacing": {{
    "strategy": "string (e.g. slow_hook_fast_body, consistent, frenetic)",
    "avg_visual_hold_duration_s": float
  }},
  "motion_graphic_rules": [
    {{
      "trigger": "string (what concept or phrase in the transcript triggers a motion graphic?)",
      "function": "string (what is the purpose of this graphic?)",
      "typical_hold_s": float
    }}
  ],
  "broll_rules": {{
    "strategy": "string (literal vs symbolic vs abstract)",
    "trigger": "string (when do they cut to b-roll?)"
  }},
  "sfx_rules": [
    {{
      "trigger": "string (what visual or narrative event triggers this SFX?)",
      "type": "string (whoosh, chime, thud, etc.)",
      "timing": "string (e.g. on_appearance)"
    }}
  ],
  "music_rules": {{
    "bpm_range": [int, int],
    "mode": "string (major/minor)",
    "behavior": "string (e.g. continuous, ducked_under_speech, swells_on_transitions)"
  }}
}}
"""

    print("Sending sequence to DeepSeek Chat for editorial analysis...")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" },
        temperature=0.2
    )

    result = json.loads(response.choices[0].message.content)
    return result

def main(video_id):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    env_path = os.path.join(base_dir, ".env")
    load_dotenv(env_path)

    data_dir = os.path.join(base_dir, "data", "styles", video_id)
    analysis_file = os.path.join(data_dir, "analysis.json")

    if not os.path.exists(analysis_file):
        print(f"Error: Could not find analysis.json for video {video_id}")
        return

    print(f"Loading {analysis_file}...")
    with open(analysis_file, "r") as f:
        analysis = json.load(f)

    # 1. Merge the raw frames into continuous blocks (Phase 2A)
    raw_events = analysis.get("visual_events", [])
    print(f"Loaded {len(raw_events)} raw frame events.")
    
    merged_events = merge_visual_events(raw_events)
    print(f"Merged into {len(merged_events)} continuous visual sequences.")

    # 2. Extract Editorial Logic via LLM (Phase 2C)
    editorial_logic = extract_editorial_logic(analysis, merged_events)
    
    # 3. Save the result
    output_file = os.path.join(data_dir, "editorial_logic.json")
    with open(output_file, "w") as f:
        json.dump(editorial_logic, f, indent=2)

    print(f"\nSuccess! Editorial logic saved to: {output_file}")
    print(json.dumps(editorial_logic, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("video_id", help="The YouTube video ID to process (e.g. 2TlIg3VokY8)")
    args = parser.parse_args()
    main(args.video_id)
