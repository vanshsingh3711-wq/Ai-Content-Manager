import os
import json
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from google import genai
from config import get_worker_settings

settings = get_worker_settings()


class EditDecision(BaseModel):
    trigger_id: str = Field(..., description="The chunk ID (e.g., ID_01, ID_02) that triggers this action.")
    action: Literal["cut", "b_roll", "zoom_in", "sfx"] = Field(..., description="Editing action to apply.")
    search_query: Optional[str] = Field(None, description="Keywords for Pexels B-roll video search if action is 'b_roll'.")
    sound_effect: Optional[str] = Field(None, description="Sound effect name (e.g. 'whoosh', 'pop', 'ding') if action is 'sfx'.")


class EditList(BaseModel):
    edits: List[EditDecision] = Field(..., description="List of sequential editing decisions.")


SYSTEM_PROMPT = """You are an expert viral video editor and content strategist specializing in high-retention short-form and long-form video editing.
Your task is to analyze a bracketed transcript with chunk IDs and produce a high-impact Edit Decision List.

Guidelines for editing decisions:
1. 'cut': Remove filler words, excessive pauses, awkward stumbles, or repetitive statements.
2. 'b_roll': Identify visual, exciting, or explanatory sentences and provide specific, high-quality search queries for B-roll footage from Pexels (e.g. 'futuristic artificial intelligence robot', 'stock market chart graph', 'happy programmer typing').
3. 'zoom_in': Add dynamic zoom-ins to punch lines, surprising statistics, and key takeaways to reset viewer attention every 3-5 seconds.
4. 'sfx': Add subtle sound effects ('whoosh', 'pop', 'camera_shutter', 'cash_register') during transition points and hook reveals.

CRITICAL REQUIREMENT:
- ALWAYS reference the exact chunk IDs (e.g., ID_01, ID_02) provided in the transcript as the `trigger_id`.
- Do NOT hallucinate chunk IDs that do not exist.
"""


def generate_edit_decisions(bracketed_transcript: str) -> EditList:
    """
    Calls Gemini Flash using the Google GenAI SDK to generate a structured Edit Decision List.
    Tries modern available flash models with fallback.
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("[*] No GEMINI_API_KEY provided. Generating heuristic edit decision list.")
        return generate_mock_edit_decisions(bracketed_transcript)

    candidate_models = [
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.7-flash",
        "gemini-2.5-flash",
    ]
    client = genai.Client(api_key=api_key)

    prompt = f"""Here is the bracketed video transcript with chunk IDs:

{bracketed_transcript}

Analyze this transcript and produce the viral Edit Decision List with cuts, B-roll overlays, zooms, and sound effects."""

    for model_name in candidate_models:
        try:
            print(f"[*] Querying Gemini AI Director using model: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "response_schema": EditList,
                    "temperature": 0.4,
                },
            )

            if response.text:
                parsed_json = json.loads(response.text)
                return EditList.model_validate(parsed_json)
            elif hasattr(response, "parsed") and response.parsed:
                return response.parsed

        except Exception as e:
            print(f"[!] Model {model_name} attempt note: {e}")
            continue

    print("[!] All Gemini model attempts failed. Falling back to heuristic edit list.")
    return generate_mock_edit_decisions(bracketed_transcript)


def generate_mock_edit_decisions(bracketed_transcript: str) -> EditList:
    """
    Heuristic fallback generator when running offline or when models are unreachable.
    """
    lines = [l.strip() for l in bracketed_transcript.split("\n") if l.strip().startswith("ID_")]
    edits: List[EditDecision] = []

    for i, line in enumerate(lines):
        chunk_id = line.split(":")[0].strip()
        
        # Add zoom on hook (first item)
        if i == 0:
            edits.append(EditDecision(trigger_id=chunk_id, action="zoom_in", sound_effect="whoosh"))
            edits.append(EditDecision(trigger_id=chunk_id, action="b_roll", search_query="modern technology abstract"))
        elif i % 2 == 1:
            # Alternating B-roll
            edits.append(EditDecision(trigger_id=chunk_id, action="b_roll", search_query="cinematic workspace digital"))
        else:
            edits.append(EditDecision(trigger_id=chunk_id, action="zoom_in", sound_effect="pop"))

    if not edits:
        edits.append(EditDecision(trigger_id="ID_01", action="zoom_in", sound_effect="whoosh"))

    return EditList(edits=edits)
