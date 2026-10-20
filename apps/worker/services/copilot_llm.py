import os
import re
import json
import time
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from config import get_worker_settings

settings = get_worker_settings()


class CopilotIntentProposal(BaseModel):
    intent: Literal["add_broll", "add_graphic", "capture_web_evidence", "split_clip", "clarification_needed"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    start_time: float = Field(..., description="Normalized start in seconds")
    end_time: float = Field(..., description="Normalized end in seconds")
    action_type: Optional[Literal["broll", "graphic", "caption", "cut", "sfx"]] = Field(default=None, description="Timeline track action type")
    summary: str = Field(..., description="Concise explanation of proposed change")
    graphic_template: Optional[Literal[
        "app_screen_upload",
        "browser_walkthrough",
        "chart_reveal",
        "metric_reveal",
        "cooked_terminal",
        "cooked_social_post",
        "hero_reveal",
        "quote_reveal",
    ]] = Field(default=None, description="Template ID if action_type is graphic")
    graphic_props: Optional[Dict[str, Any]] = Field(default=None, description="Props for motion graphic composition")
    search_query: Optional[str] = Field(default=None, description="Cleaned keyword query for stock video or web search")
    clarification_prompt: Optional[str] = Field(default=None, description="Conversational prompt if confidence < 0.65")
    suggested_actions: Optional[List[str]] = Field(default=None, description="Actionable button choices for the user")


COPILOT_SYSTEM_PROMPT = """You are the Tier-3 Creative Reasoning Copilot for an advanced timeline video editor.
Your job is to interpret natural language editing commands, reason over the current timeline state, and produce a structured JSON intent proposal.

Available Actions:
1. `add_broll`: Stock video clip, realistic footage, screen recording, scene visual overlay.
2. `add_graphic`: Motion graphics cards, animated UI screens, KPI counters, charts, code terminals, social posts.
   Templates:
   - `app_screen_upload`: Interactive software window showing video/file upload progress and status.
   - `browser_walkthrough`: Dark macOS browser frame presenting a live web URL or website screenshot.
   - `chart_reveal`: Rising growth chart / trend lines / data points (ONLY when user asks for charts, graphs, metrics trends).
   - `metric_reveal`: Animated KPI counter, percentages, dollar amounts, subscriber count.
   - `cooked_terminal`: Hacker / developer dark terminal showing commands and output.
   - `cooked_social_post`: X/Twitter or social media comment card.
   - `hero_reveal`: Bold headline card with key takeaway.
   - `quote_reveal`: Notable quote card with author attribution.
3. `capture_web_evidence`: User wants to show a live webpage, article, GitHub repo, or social post from a URL.
4. `split_clip`: Cut or split the video at the given timestamp.
5. `clarification_needed`: When the prompt is ambiguous, subjective, or confidence < 0.65 (e.g. "make it aesthetic", "make it look cooler").
   CRITICAL: NEVER generate blind subtitle captions from an ambiguous user prompt! Provide an explanatory `clarification_prompt` and 2-3 `suggested_actions`.

ACTION SELECTION GUIDELINES:
- `add_broll`: Choose this when the user asks for video footage, b-roll, stock clips, realistic recordings, or a visual video scene (e.g. 'person typing on laptop', 'person watching video', 'city traffic'). Set `action_type: "broll"` and provide a clean `search_query` for Pexels.
- `add_graphic`: Choose this when the user explicitly requests motion graphics, animations, cards, badges, counters, or interactive app UI mockups (e.g. 'screen in which user is uploading video', 'add this motion graphics', 'animated upload card', 'rising chart', 'terminal code'). Set `action_type: "graphic"` and select the appropriate `graphic_template`.
  - If user requests generic motion graphics without specifying subtype (e.g. 'add a cool motion graphics at 10s', 'motion graphics'): DO NOT mark clarification_needed! Default to `graphic_template: "hero_reveal"`.
  - For `app_screen_upload`: choose this when user asks for a screen/app where user is uploading a video or file (include `fileName: "upload_video.mp4"`).
  - For `chart_reveal`: include `title: "GROWTH TREND"`, `dataPoint1: "Stage 1: Baseline"`.
- `capture_web_evidence`: Choose this when a URL is present or user asks to capture a real website/article.
- CRITICAL RULE FOR WEBSITE RECORDINGS & SCREEN RECORDINGS:
  - NEVER add website recordings into motion graphics cards or phone frames!
  - Users want natural screen recordings that feel authentic, not cartoonish mockups or graphics cards.
  - Website recordings must ALWAYS be placed on the B-Roll track as clean, natural video footage (`action_type: "broll"`).
- `clarification_needed`: Choose this if prompt is purely subjective/vague (e.g. 'make it better', 'aesthetic'). NEVER output blind captions for vague prompts! Set `suggested_actions: ["Add stock video footage", "Add animated motion card", "Add subtitle caption"]`.

TIMING RULES:
- If the user specifies an explicit time range (e.g., "from 10s to 12s", "between 5s and 8s", "at 14s for 3s"), respect the exact boundaries.
- If no explicit timing is given, anchor `start_time` near the current `playhead_time` with a standard duration (3.0s to 4.0s).
- Ensure `0 <= start_time < end_time <= duration`.

TYPO RESILIENCE:
- Understand conversational typos and voice transcription slips:
  - "vidoe", "vedio", "vid" -> video
  - "grpahic", "grpahics" -> graphic / motion graphic
  - "sceen" -> screen
  - "uplaod" -> upload
  - "motion graphics" does NOT mean a rising chart unless words like "growth", "chart", or "trend" are also used!

You MUST respond strictly with valid JSON conforming to the following structure:
{
  "intent": "add_broll" | "add_graphic" | "capture_web_evidence" | "split_clip" | "clarification_needed",
  "confidence": 0.95,
  "start_time": 10.0,
  "end_time": 12.0,
  "action_type": "broll" | "graphic" | "caption" | "cut" | "sfx",
  "summary": "User uploading video mockup from 10.0s to 12.0s",
  "graphic_template": "app_screen_upload" | null,
  "graphic_props": {"title": "...", "appName": "...", "fileName": "...", "progress": 100} | null,
  "search_query": "user uploading video on screen" | null,
  "clarification_prompt": null,
  "suggested_actions": ["Add stock video footage", "Add animated app upload graphic"] | null
}
"""


def _clean_json_text(text: str) -> str:
    """Strips markdown code blocks, think tags, and whitespace."""
    cleaned = text.strip()
    if "<think>" in cleaned and "</think>" in cleaned:
        cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL).strip()
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned, re.DOTALL | re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    return cleaned


def reason_copilot_intent(
    prompt: str,
    context: Dict[str, Any],
    ai_model_pref: str = "DeepSeek V3"
) -> CopilotIntentProposal:
    """
    Tier-3 LLM Semantic Engine.
    Leverages DeepSeek V3 / Claude to parse creative intent, resolve typos,
    extract explicit timestamps, and map to appropriate templates.
    """
    playhead = float(context.get("playhead_time", 0.0))
    duration = float(context.get("duration", 60.0))
    aspect_ratio = context.get("aspect_ratio", "9:16")
    transcript_words = context.get("active_transcript_words") or []
    selected_item = context.get("selected_item")

    user_payload = {
        "user_prompt": prompt,
        "timeline_context": {
            "playhead_time": playhead,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "selected_item": selected_item,
            "nearby_transcript": [w.get("word") for w in transcript_words[:12]] if transcript_words else [],
        }
    }

    deepseek_key = getattr(settings, "DEEPSEEK_API_KEY", None) or os.getenv("DEEPSEEK_API_KEY")

    if deepseek_key:
        try:
            client = OpenAI(
                api_key=deepseek_key,
                base_url="https://api.deepseek.com/v1",
                timeout=25.0
            )

            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(user_payload, indent=2)}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=1500,
            )

            raw_content = response.choices[0].message.content or ""
            cleaned_json = _clean_json_text(raw_content)
            parsed = json.loads(cleaned_json)

            # Clamp boundaries safely handling None values
            start_raw = parsed.get("start_time")
            start = round(max(0.0, float(start_raw if start_raw is not None else playhead)), 2)
            end_raw = parsed.get("end_time")
            end = round(min(duration, max(start + 0.5, float(end_raw if end_raw is not None else (start + 3.5)))), 2)
            parsed["start_time"] = start
            parsed["end_time"] = end

            if parsed.get("intent") == "capture_web_evidence":
                parsed["action_type"] = "graphic"
                if not parsed.get("graphic_template"):
                    parsed["graphic_template"] = "browser_walkthrough"

            return CopilotIntentProposal(**parsed)
        except Exception as e:
            print(f"[!] Tier-3 DeepSeek call encountered error: {e}. Falling back to semantic heuristic.")

    # Graceful Offline / Fallback Heuristic
    return _semantic_heuristic_fallback(prompt, playhead, duration)


def _semantic_heuristic_fallback(prompt: str, playhead: float, duration: float) -> CopilotIntentProposal:
    """Deterministic semantic fallback when LLM is offline or times out."""
    lower = prompt.lower()

    # Time extraction
    start_time = round(playhead, 2)
    end_time = min(duration, round(start_time + 3.5, 2))
    from_to = re.search(r"\b(?:from|between)\s+([0-9:.]+(?:s|sec|seconds)?)\s*(?:to|and)\s+([0-9:.]+(?:s|sec|seconds)?)\b", lower)
    if from_to:
        try:
            t1 = float(re.sub(r"[^\d.]", "", from_to.group(1)))
            t2 = float(re.sub(r"[^\d.]", "", from_to.group(2)))
            if t1 < t2:
                start_time = round(t1, 2)
                end_time = min(duration, round(t2, 2))
        except Exception:
            pass

    # Web URL
    url_match = re.search(r'https?://[^\s]+', prompt)
    if url_match:
        url = url_match.group(0)
        return CopilotIntentProposal(
            intent="capture_web_evidence",
            confidence=0.95,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"Web walkthrough for {url}",
            graphic_template="browser_walkthrough",
            graphic_props={"url": url, "title": "Web Source"},
        )

    # App Screen Upload
    if re.search(r"\b(?:upload|app|screen\s+upload|software|dashboard)\b", lower):
        if re.search(r"\b(?:graphic|graphics|motion|animat\w*|card|ui)\b", lower):
            return CopilotIntentProposal(
                intent="add_graphic",
                confidence=0.92,
                start_time=start_time,
                end_time=end_time,
                action_type="graphic",
                summary=f"App upload animation from {start_time:.1f}s to {end_time:.1f}s",
                graphic_template="app_screen_upload",
                graphic_props={
                    "title": "VIDEO UPLOAD",
                    "appName": "Video Studio App",
                    "fileName": "production_export.mp4",
                    "progress": 100,
                    "status": "Upload Complete",
                },
                suggested_actions=["Add animated app upload graphic", "Add stock video footage"],
            )
        else:
            return CopilotIntentProposal(
                intent="add_broll",
                confidence=0.88,
                start_time=start_time,
                end_time=end_time,
                action_type="broll",
                summary=f"User uploading video footage from {start_time:.1f}s to {end_time:.1f}s",
                search_query="user uploading video on screen",
                suggested_actions=["Add stock video footage", "Add animated app upload graphic"],
            )

    # Web URL
    url_match = re.search(r'https?://[^\s]+', prompt)
    if url_match:
        url = url_match.group(0)
        return CopilotIntentProposal(
            intent="capture_web_evidence",
            confidence=0.95,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"Web walkthrough for {url}",
            graphic_template="browser_walkthrough",
            graphic_props={"url": url, "title": "Web Source"},
        )

    # Chart / Graph
    if re.search(r"\b(?:rising\s+graphs?|growth\s+charts?|charts?|data\s+points?)\b", lower) and not re.search(r"\bmotion\s+graphics?\b", lower):
        return CopilotIntentProposal(
            intent="add_graphic",
            confidence=0.90,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"Growth chart reveal from {start_time:.1f}s to {end_time:.1f}s",
            graphic_template="chart_reveal",
            graphic_props={"title": "GROWTH TREND", "dataPoint1": "Stage 1", "dataPoint2": "+85%"},
        )

    # Ambiguous / Subjective
    return CopilotIntentProposal(
        intent="clarification_needed",
        confidence=0.40,
        start_time=start_time,
        end_time=end_time,
        action_type="graphic",
        summary=f"Clarification needed for '{prompt}'",
        clarification_prompt=f"I understood your request: \"{prompt}\". Please choose the visual element you would like to create:",
        suggested_actions=["Add stock video footage", "Add animated motion card", "Add subtitle caption"],
    )
