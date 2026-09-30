import os
import json
import time
import socket
import re
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from openai import OpenAI, APIConnectionError
from config import get_worker_settings

settings = get_worker_settings()


class VisualBeat(BaseModel):
    timestamp: float = Field(..., description="Relative time in seconds when this beat occurs within the chunk")
    text: Optional[str] = Field(None, description="Text to display or emphasize")
    emphasis: Optional[str] = Field(None, description="Visual emphasis type (e.g. highlight, shake, dim, reveal, zoom)")
    animation_state: Optional[str] = Field(None, description="State of the animation (e.g. intro, idle, reacting, changing, exit)")

class EditDecision(BaseModel):
    action: Literal["cut", "b_roll", "zoom_in", "sfx", "motion_graphics", "character"] = Field(..., description="Editing action to apply.")
    trigger_id: Optional[str] = Field(None, description="The chunk ID (e.g., ID_01) that triggers this action. Required for non-cut actions.")
    start: Optional[float] = Field(None, description="Start timestamp for cuts.")
    end: Optional[float] = Field(None, description="End timestamp for cuts.")
    search_query: Optional[str] = Field(None, description="Keywords for Pexels B-roll video search if action is 'b_roll'.")
    sound_effect: Optional[str] = Field(None, description="Sound effect name (e.g. 'whoosh', 'pop', 'ding') if action is 'sfx'.")
    motion_graphics_type: Optional[str] = Field(None, description="Type of motion composition (e.g. hero_reveal, metric_reveal, step_sequence, quote_reveal)")
    motion_graphics_targets: Optional[dict] = Field(None, description="Dictionary of targets for the composition (e.g. {'headline': 'DATA-DRIVEN', 'label': 'NEW SYSTEM'})")
    motion_graphics_personality: Optional[str] = Field(None, description="Physics personality (e.g. energetic, premium, technical)")
    character_action: Optional[str] = Field(None, description="Action for 2D character (e.g., 'pointing', 'surprised', 'explaining') if action is 'character'.")
    transition: Optional[str] = Field(None, description="Transition type from previous scene (e.g., 'fade', 'slide', 'wipe', 'morph'). Leave null for a clean cut.")
    visual_beats: Optional[List[VisualBeat]] = Field(None, description="List of visual beats/animation changes within this scene. A scene should have multiple beats if the dialogue changes topics.")
    reason: Optional[str] = Field(None, description="Required justification for the decision. Explains why it adds value here.")


class EditList(BaseModel):
    edits: List[EditDecision] = Field(..., description="List of sequential editing decisions.")


def _wait_for_internet_retry(func):
    def wrapper(*args, **kwargs):
        attempt = 1
        while True:
            try:
                return func(*args, **kwargs)
            except (APIConnectionError, socket.error) as e:
                print(f"[!] Network connection lost. Waiting 10s for internet to return (Attempt {attempt})...")
                time.sleep(10)
                attempt += 1
    return wrapper


def _call_llm(system_prompt: str, user_prompt: str, ai_model_pref: str = "DeepSeek V3", raw_output: bool = False):
    deepseek_key = settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")

    configs = []
    if deepseek_key:
        configs.append({"key": deepseek_key, "url": "https://api.deepseek.com/v1", "model": "deepseek-chat"})
    else:
        raise ValueError("[!] No DEEPSEEK_API_KEY provided.")

    last_error = None
    response = None

    # Use OpenAI-compatible endpoint for DeepSeek
    import time
    for config in configs:
        client = OpenAI(api_key=config["key"], base_url=config["url"], timeout=45.0)
        
        for attempt in range(3):
            try:
                print(f"[*] Attempting LLM call with model: {config['model']} (Attempt {attempt+1}/3)")
                response = client.chat.completions.create(
                    model=config["model"],
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=8000,
                )
                
                if not hasattr(response, 'choices') or not response.choices:
                    raise ValueError(f"LLM Response missing choices: {response}")
                    
                break # Success
            except Exception as e:
                print(f"[!] Failed with {config['model']} - Error: {type(e).__name__}")
                last_error = e
                response = None # Reset response on failure
                time.sleep(2)
                
        if response is not None:
            break # Success across all configs

    if response is None:
        raise last_error

    content = response.choices[0].message.content
    if content:
        content = content.strip()
        # More robust markdown extraction
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            
        if raw_output:
            return content
            
        try:
            parsed_json = json.loads(content)
            print(f"[LLM: PARSED JSON] Successfully decoded JSON block from LLM.")
            if isinstance(parsed_json, list):
                parsed_json = {"edits": parsed_json}
            
            # Additional detailed logging of the exact decisions parsed
            print(f"[LLM: DECISIONS EXTRACTED] Found {len(parsed_json.get('edits', []))} edits.")
            for idx, edit in enumerate(parsed_json.get('edits', [])):
                print(f"  -> Decision #{idx+1} [Action: {edit.get('action')}] | Trigger: {edit.get('trigger_id')}")
                if 'reason' in edit and edit['reason']:
                     print(f"     Reasoning: {edit['reason']}")
                if 'visual_beats' in edit and edit['visual_beats']:
                     print(f"     Beats ({len(edit['visual_beats'])}): {[b.get('emphasis') for b in edit['visual_beats']]}")
            
            return EditList.model_validate(parsed_json)
        except Exception as e:
            print(f"[!] Failed to parse LLM output: {e}\nRaw output: {content}")
            return EditList(edits=[])
    
    print("[!] LLM returned empty content.")
    raise ValueError("LLM returned empty content")

def generate_edit_decisions(unified_analysis_json: str) -> EditList:
    """
    Orchestrates the multi-agent planning pipeline.
    Invokes specialized sub-agents and merges their plans via the master resolver.
    """
    from services.broll_planner import generate_broll_plan
    from services.motion_graphic_planner import generate_motion_graphics_plan
    from services.character_planner import generate_character_plan
    from services.blueprint_resolver import resolve_master_blueprint

    print("[*] Generating B-Roll Plan...")
    broll_plan = generate_broll_plan(unified_analysis_json)
    
    print("[*] Generating Motion Graphics Plan...")
    mg_plan = generate_motion_graphics_plan(unified_analysis_json)
    
    # Check if the user requested a faceless documentary style
    is_faceless = False
    try:
        analysis_data = json.loads(unified_analysis_json)
        # Look for faceless hints in style or metadata
        if "faceless" in str(analysis_data).lower() or "documentary" in str(analysis_data).lower():
            is_faceless = True
    except Exception:
        pass
        
    if is_faceless:
        print("[*] 'Faceless' mode detected. Skipping Character Plan...")
        from services.ai_director import EditList
        char_plan = EditList(edits=[])
    else:
        print("[*] Generating Character Plan...")
        char_plan = generate_character_plan(unified_analysis_json)
    
    print("[*] Resolving Master Blueprint...")
    final_plan = resolve_master_blueprint(
        unified_analysis_json=unified_analysis_json,
        broll_plan=broll_plan,
        mg_plan=mg_plan,
        char_plan=char_plan
    )
    
    return final_plan

