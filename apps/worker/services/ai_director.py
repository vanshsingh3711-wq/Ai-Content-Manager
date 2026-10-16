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

def _load_style_profile(style_pref: str) -> str:
    # ai_director.py is at apps/worker/services/ → go 3 levels up to reach project root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    knowledge_dir = os.path.join(base_dir, "data", "styles", "knowledge")
    # Try exact name first, then common suffixes (e.g. "viral" → "viral_documentary")
    candidates = [style_pref, f"{style_pref}_documentary", f"{style_pref}_style"]
    for candidate in candidates:
        path = os.path.join(knowledge_dir, f"{candidate}.md")
        if os.path.exists(path):
            print(f"[StyleLoader] Loaded style profile: {candidate}.md")
            with open(path, "r") as f:
                return f.read()
    print(f"[StyleLoader] ⚠️  No style file found for '{style_pref}' (tried: {candidates}). Using default.")
    return "No explicit style profile provided. Default to a fast-paced viral style."

DEEPSEEK_MODEL_MAP = {
    # Reasoning models (R1)
    "deepseek-reasoner": "deepseek-reasoner",
    "deepseek-r1": "deepseek-reasoner",
    "r1": "deepseek-reasoner",
    "deepseek r1": "deepseek-reasoner",
    "deepseek-reasoner-pro": "deepseek-reasoner",
    "deepseek v4 pro": "deepseek-reasoner",
    "deepseek-v4-pro": "deepseek-reasoner",
    # Chat / fast models (V3 & V4)
    "deepseek-chat": "deepseek-chat",
    "deepseek v3": "deepseek-chat",
    "deepseek-v3": "deepseek-chat",
    "v3": "deepseek-chat",
    "deepseek-chat-v3": "deepseek-chat",
    "deepseek v4": "deepseek-chat",
    "deepseek-v4": "deepseek-chat",
    "deepseek-hybrid": "deepseek-chat",
}

def resolve_deepseek_model(model_pref: str) -> str:
    """Map user/internal model preference to exact DeepSeek model ID."""
    clean = (model_pref or "deepseek-chat").strip().lower()
    return DEEPSEEK_MODEL_MAP.get(clean, "deepseek-chat")

def _call_llm(system_prompt: str, user_prompt: str, ai_model_pref: str = "DeepSeek V3", raw_output: bool = False):
    deepseek_key = settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")

    if not deepseek_key:
        raise ValueError("[!] No DEEPSEEK_API_KEY provided. Please set DEEPSEEK_API_KEY in your .env file.")

    target_model = resolve_deepseek_model(ai_model_pref)
    base_url = "https://api.deepseek.com/v1"

    last_error = None
    response = None

    import time
    client = OpenAI(api_key=deepseek_key, base_url=base_url, timeout=60.0)

    for attempt in range(3):
        try:
            print(f"[*] Attempting DeepSeek call with model: {target_model} (Attempt {attempt+1}/3)")

            # deepseek-reasoner (R1) does not support response_format or custom temperature
            if target_model == "deepseek-reasoner":
                response = client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": system_prompt + "\n\nYou MUST output your final answer as a valid JSON object wrapped in ```json ... ``` markdown code block."},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=8000,
                )
            else:
                response = client.chat.completions.create(
                    model=target_model,
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

            # Log thinking if R1
            msg = response.choices[0].message
            if getattr(msg, "reasoning_content", None):
                snippet = msg.reasoning_content[:120].replace("\n", " ")
                print(f"[DeepSeek R1 Thinking] {snippet}...")

            break  # Success
        except Exception as e:
            print(f"[!] Failed with {target_model} - Error: {type(e).__name__}: {e}")
            last_error = e
            response = None
            time.sleep(2)

    if response is None:
        raise last_error

    content = response.choices[0].message.content
    if content:
        content = content.strip()
        # Clean reasoning tags if any leaked into content
        if "<think>" in content and "</think>" in content:
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()

        # Markdown extraction
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()

        if raw_output:
            return content

        try:
            parsed_json = json.loads(content)
            print(f"[LLM: PARSED JSON] Successfully decoded JSON block from {target_model}.")
            if isinstance(parsed_json, list):
                parsed_json = {"edits": parsed_json}

            print(f"[LLM: DECISIONS EXTRACTED] Found {len(parsed_json.get('edits', []))} edits.")
            for idx, edit in enumerate(parsed_json.get('edits', [])):
                print(f"  -> Decision #{idx+1} [Action: {edit.get('action')}] | Trigger: {edit.get('trigger_id')}")

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

