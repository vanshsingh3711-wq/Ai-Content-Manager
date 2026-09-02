import os
import json
import time
import socket
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from openai import OpenAI, APIConnectionError
from config import get_worker_settings

settings = get_worker_settings()


class EditDecision(BaseModel):
    action: Literal["cut", "b_roll", "zoom_in", "sfx"] = Field(..., description="Editing action to apply.")
    trigger_id: Optional[str] = Field(None, description="The chunk ID (e.g., ID_01) that triggers this action. Required for non-cut actions.")
    start: Optional[float] = Field(None, description="Start timestamp for cuts.")
    end: Optional[float] = Field(None, description="End timestamp for cuts.")
    search_query: Optional[str] = Field(None, description="Keywords for Pexels B-roll video search if action is 'b_roll'.")
    sound_effect: Optional[str] = Field(None, description="Sound effect name (e.g. 'whoosh', 'pop', 'ding') if action is 'sfx'.")
    reason: Optional[str] = Field(None, description="Required justification for B-roll decisions. Explains why B-roll adds value here.")


class EditList(BaseModel):
    edits: List[EditDecision] = Field(..., description="List of sequential editing decisions.")


# ─────────────────────────────────────────────────────────────────────────────
# System prompt: conservative editing philosophy
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a professional video editor. Your editing philosophy is:

PRESERVE THE ORIGINAL FOOTAGE. Only edit when it clearly improves the viewer experience.

You will receive a Unified Analysis JSON containing:
- A bracketed transcript with chunk IDs and timestamps
- Structured audio analysis containing speech, silence, and non-speech regions
- Visual context (scene changes, subject positions, safe regions)

AUDIO ANALYSIS RULES:
The audio_analysis.regions array provides supporting evidence for your decisions. You must still rely on the transcript and visual context; do not make decisions based on audio_analysis alone.
- 'SPEECH': Treat as spoken content. Do not cut through meaningful speech. Preserve sentence/word continuity.
- 'SILENCE': Represents genuinely quiet audio. May be considered for removal when long enough. Do not automatically remove every silence.
- 'NON_SPEECH_AUDIO': Represents audible music/noise/audio without detected speech. Do NOT interpret this as the speaker pausing. It may be trimmed when appropriate. Consider whether the music/noise contributes intentionally to the video before removing it.

PACING RULES:
1. Default target: Optimize pacing for short-form video while preserving natural speech.
2. Beginning: If the video begins with a non-speech region longer than 1.0 second before meaningful speech begins, consider trimming it.
3. Between speech: If NON_SPEECH_AUDIO occurs between two speech regions and lasts >= 1.0 second, consider cutting it when it does not appear intentionally rhythmic, musical, or important to the content.
4. Ending: If NON_SPEECH_AUDIO occurs immediately before or after the meaningful ending and lasts >= 1.0 second, consider trimming it.
5. Do not cut: meaningful speech, intentional music transitions, intentional sound effects, visually important moments, or natural short pauses.
6. Prefer shorter trims: When cutting a non-speech region, remove only the unnecessary portion rather than aggressively shortening the video.
7. NON_SPEECH_AUDIO is NOT automatically a cut. It is a candidate region that requires contextual judgment.
8. Preserve natural pacing. Do not remove every pause simply because doing so makes the video shorter.

Produce an Edit Decision List with these action types:

1. 'cut': Remove ONLY genuine mistakes — accidental fumbles, false starts, and stuttering where the speaker restarts a sentence. If a speaker intentionally repeats a phrase for emphasis (without fumbling), DO NOT cut it.

2. 'b_roll': B-roll is OPTIONAL but VALUABLE. Prefer original footage by default, but you may use B-roll when it provides meaningful visual reinforcement, even if the original footage is understandable.
   
   Guidelines for adding B-roll:
   - Use it when it visually reinforces an important concept, demonstrates what the speaker is describing, adds meaningful visual variety, makes an abstract concept easier to understand, or strengthens an important hook or value proposition.
   - Do NOT add B-roll merely because a keyword appears.
   - Do NOT add B-roll to every sentence.
   - Prefer a small number of high-value B-roll moments.
   - For a short video, normally choose approximately 1-3 strongest B-roll opportunities.
   - Avoid consecutive B-roll clips.
   - If no moment genuinely benefits from B-roll, output zero.
   - If the original footage already visually demonstrates the concept, prefer keeping it.
   - B-roll should normally be short and purposeful.
   
   Every B-roll decision MUST include a 'reason' field explaining why it adds value.

3. 'zoom_in': Use sparingly — only at genuine punch lines, surprising statistics, or key takeaways. Maximum 2-3 zoom events per 30 seconds of video. Do NOT zoom on routine statements.

4. 'sfx': Add subtle sound effects only at major transition points or hook reveals. Maximum 1-2 per video.

AUDIO OWNERSHIP RULE:
B-roll affects ONLY the visual layer. The original speech audio ALWAYS continues during B-roll.
B-roll means "show a different visual while the speaker keeps talking."
B-roll does NOT mean "replace both video and audio."

COMPOSITION & SAFE SPACE RULE:
Respect `safe_regions` from the visual analysis. Do not place overlays on the primary subject.

CRITICAL REQUIREMENTS:
- For 'cut' actions, you MUST specify exact `start` and `end` timestamps. NEVER use `trigger_id` for cuts. NEVER use a transcript chunk ID as a proxy for a gap.
- For all other actions ('b_roll', 'zoom_in', 'sfx'), you MUST specify a valid `trigger_id` that exists in the transcript (e.g., ID_01, ID_02).
- Do NOT hallucinate chunk IDs.
- Default action is: DO NOTHING. Keep the original footage.
- Fewer high-value edits are ALWAYS better than constant visual changes.

OUTPUT FORMAT:
You MUST output valid JSON matching this schema:
{
  "edits": [
    {
      "action": "cut | b_roll | zoom_in | sfx",
      "trigger_id": "ID_01 (Required for b_roll, zoom_in, sfx. Omit for cut)",
      "start": 0.0, 
      "end": 3.75,
      "search_query": "Optional keywords for B-roll",
      "sound_effect": "Optional sfx name",
      "reason": "Required explanation for B-roll"
    }
  ]
}
"""

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


@_wait_for_internet_retry
def generate_edit_decisions(unified_analysis_json: str) -> EditList:
    """
    Calls DeepSeek (or OpenRouter fallback) using the official OpenAI SDK 
    to generate a structured Edit Decision List.
    """
    api_key = settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY")
    openrouter_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY")

    if not api_key and not openrouter_key:
        raise ValueError("[!] No DEEPSEEK_API_KEY or OPENROUTER_API_KEY provided.")

    prompt = f"""Here is the Unified Video Analysis data containing the transcript, audio analysis, and visual context:

{unified_analysis_json}

Analyze this unified context and produce a conservative Edit Decision List.
Remember: KEEP the original footage by default. Only add edits that clearly improve the video.
B-roll is optional and must include a reason. Maximum 2 B-roll clips for short videos.
IMPORTANT: Return ONLY valid JSON matching the exact schema."""

    if openrouter_key:
        print("[*] Querying AI Director using OpenRouter...")
        client = OpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
        model_name = "deepseek/deepseek-chat"  # Default openrouter fallback
    elif api_key:
        print("[*] Querying AI Director using DeepSeek (deepseek-chat)...")
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
        model_name = "deepseek-chat"
    else:
        raise ValueError("[!] No DEEPSEEK_API_KEY or OPENROUTER_API_KEY provided.")

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    content = response.choices[0].message.content
    if content:
        # DeepSeek might wrap it in markdown code blocks even with json_object
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        parsed_json = json.loads(content)
        # Ensure it's nested under "edits" if the model just returns a list
        if isinstance(parsed_json, list):
            parsed_json = {"edits": parsed_json}
        return EditList.model_validate(parsed_json)
    
    raise ValueError("LLM returned empty content")
