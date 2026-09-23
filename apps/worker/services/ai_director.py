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


class EditDecision(BaseModel):
    action: Literal["cut", "b_roll", "zoom_in", "sfx", "motion_graphics", "character"] = Field(..., description="Editing action to apply.")
    trigger_id: Optional[str] = Field(None, description="The chunk ID (e.g., ID_01) that triggers this action. Required for non-cut actions.")
    start: Optional[float] = Field(None, description="Start timestamp for cuts.")
    end: Optional[float] = Field(None, description="End timestamp for cuts.")
    search_query: Optional[str] = Field(None, description="Keywords for Pexels B-roll video search if action is 'b_roll'.")
    sound_effect: Optional[str] = Field(None, description="Sound effect name (e.g. 'whoosh', 'pop', 'ding') if action is 'sfx'.")
    motion_graphics_text: Optional[str] = Field(None, description="Text to display if action is 'motion_graphics'.")
    character_action: Optional[str] = Field(None, description="Action for 2D character (e.g., 'pointing', 'surprised', 'explaining') if action is 'character'.")
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


def _call_llm(system_prompt: str, user_prompt: str) -> EditList:
    api_key = settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")
    openrouter_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY")

    if not api_key and not openrouter_key:
        raise ValueError("[!] No DEEPSEEK_API_KEY or OPENROUTER_API_KEY provided.")

    if openrouter_key:
        client = OpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
        model_name = "deepseek/deepseek-chat"
    else:
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
        model_name = "deepseek-chat"

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    content = response.choices[0].message.content
    if content:
        content = content.strip()
        # More robust markdown extraction
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            
        try:
            parsed_json = json.loads(content)
            if isinstance(parsed_json, list):
                parsed_json = {"edits": parsed_json}
            return EditList.model_validate(parsed_json)
        except Exception as e:
            print(f"[!] Failed to parse LLM output: {e}\nRaw output: {content}")
            return EditList(edits=[])
    
    raise ValueError("LLM returned empty content")

