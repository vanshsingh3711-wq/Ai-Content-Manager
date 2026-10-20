import os
import json
import base64
import tiktoken
from openai import OpenAI
import time

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def count_tokens(text):
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except:
        return len(text) // 4

def estimate_cost(num_frames):
    input_tokens = 360 * num_frames
    output_tokens = 500 * num_frames
    cost = (input_tokens / 1_000_000) * 0.14 + (output_tokens / 1_000_000) * 0.28
    return input_tokens, output_tokens, cost

def call_vision(image_path, text_context, cache_file):
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            cache = json.load(f)
    else:
        cache = {}
        
    cache_key = f"{image_path}_{hash(text_context)}"
    if cache_key in cache:
        return cache[cache_key]

    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("Warning: DEEPSEEK_API_KEY not set. Cannot run vision.")
        return {}
        
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    base64_image = encode_image(image_path)
    
    prompt = f"""
    Analyze this frame and the surrounding transcript.
    Transcript Context: {text_context}
    
    Return a JSON object with these keys:
    "what": {{ "type": "talking_head|b_roll|screen_recording|motion_graphic|full_screen_text|character|plain_background", "exact_text_shown": "", "overlay_kind": "lower_third|counter|chart|before_after|list|quote|icon|other", "placement": "", "size": "", "animation": "cut|fade|slide|pop|zoom|typewriter|other", "start": 0, "end": 0 }}
    "trigger": {{ "exact_words_spoken": "", "offset": "before|on|after", "trigger_type": "number|named_thing|contrast|list|definition|key_claim|topic_change|cta|none", "relation": "repeats_speech|adds_info|illustrates" }}
    "function": "emphasize_key_point|show_something|illustrate_claim|reset_attention|mark_transition|add_info"
    "reason": ""
    "evidence_quote": ""
    "confidence": "high|medium|low"
    "template_match": "before_after|hero_reveal|quote_reveal|step_sequence|unsupported: <desc>"
    "b_roll": {{ "description": "", "literal_ness": "literal|symbolic|unrelated" }}
    "tags": {{ "what": "observed|inferred", "trigger": "observed|inferred" }}
    """
    
    model = os.environ.get("VISION_MODEL", "deepseek-v4-flash-vision-exp")
    
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format={ "type": "json_object" },
                max_tokens=4000,
                temperature=0.2
            )
            result = json.loads(response.choices[0].message.content)
            
            # Record if it was an auto-repair
            if attempt == 1:
                result["_repaired"] = True
                
            cache[cache_key] = result
            with open(cache_file, "w") as f:
                json.dump(cache, f, indent=2)
            return result
        except Exception as e:
            print(f"Error calling vision API on attempt {attempt+1}: {e}")
            time.sleep(2)
            
    # If failed twice, return failed event
    failed_event = {"status": "failed", "error": "API or JSON parsing error after 2 attempts"}
    cache[cache_key] = failed_event
    with open(cache_file, "w") as f:
        json.dump(cache, f, indent=2)
    return failed_event
