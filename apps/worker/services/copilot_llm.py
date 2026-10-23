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
    intent: Literal["add_broll", "add_graphic", "capture_web_evidence", "split_clip", "add_audio", "clarification_needed"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    start_time: float = Field(..., description="Normalized start in seconds")
    end_time: float = Field(..., description="Normalized end in seconds")
    action_type: Optional[Literal["broll", "graphic", "caption", "cut", "sfx", "audio"]] = Field(default=None, description="Timeline track action type")
    summary: str = Field(..., description="Concise explanation of proposed change")
    graphic_template: Optional[Literal[
        "app_screen_upload",
        "browser_walkthrough",
        "chart_reveal",
        "metric_reveal",
        "animated_counter",
        "animated-counter",
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
   - `metric_reveal`: Animated KPI counter, percentages, dollar amounts.
   - `animated_counter`: Animated subscriber/follower/metric counter counting to a target number (e.g. counting to 50k).
   - `cooked_terminal`: Hacker / developer dark terminal showing commands and output.
   - `cooked_social_post`: X/Twitter or social media comment card.
   - `hero_reveal`: Bold headline card with key takeaway or animated title (e.g. blue animated title saying 'The Solution').
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
            effective_duration = max(duration, float(end_raw if end_raw is not None else (start + 3.5)))
            end = round(min(effective_duration, max(start + 0.5, float(end_raw if end_raw is not None else (start + 3.5)))), 2)
            parsed["start_time"] = start
            parsed["end_time"] = end

            if parsed.get("graphic_props"):
                props = parsed["graphic_props"]
                if "title" in props and "label" not in props:
                    props["label"] = str(props["title"]).upper()
                if "label" in props and "title" not in props:
                    props["title"] = str(props["label"]).upper()
                if "title" in props and "headline" not in props:
                    props["headline"] = props["title"]
                if "color" in props and "colorTheme" not in props:
                    props["colorTheme"] = props["color"]
                if "label" in props and isinstance(props["label"], str):
                    props["label"] = props["label"].upper()
                if "to" not in props:
                    val_str = str(props.get("targetValue") or props.get("target") or props.get("endValue") or "")
                    if val_str:
                        m = re.search(r"(\d+(?:\.\d+)?)\s*([kmb])?", val_str, re.I)
                        if m:
                            num = float(m.group(1))
                            unit = (m.group(2) or "").lower()
                            if unit == "k":
                                num *= 1000
                            elif unit == "m":
                                num *= 1000000
                            elif unit == "b":
                                num *= 1000000000
                            props["to"] = int(num)
                if "to" in props and "from" not in props:
                    props["from"] = 0

            if parsed.get("intent") == "capture_web_evidence":
                parsed["action_type"] = "graphic"
                if not parsed.get("graphic_template"):
                    parsed["graphic_template"] = "browser_walkthrough"

            return CopilotIntentProposal(**parsed)
        except Exception as e:
            print(f"[!] Tier-3 DeepSeek call encountered error: {e}. Falling back to semantic heuristic.")

    # Graceful Offline / Fallback Heuristic
    return _semantic_heuristic_fallback(prompt, playhead, duration)


def _parse_time_token(token: str) -> float:
    t = re.sub(r"(?:s|sec|seconds)$", "", token.strip(), flags=re.I)
    if ":" in t:
        parts = t.split(":")
        if len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    return float(t)


def _semantic_heuristic_fallback(prompt: str, playhead: float, duration: float) -> CopilotIntentProposal:
    """Deterministic semantic fallback when LLM is offline or times out."""
    lower = prompt.lower()

    # Time extraction
    start_time = round(playhead, 2)
    end_time = min(duration, round(start_time + 3.5, 2))
    from_to = re.search(r"\b(?:from|between)\s+([0-9:.]+(?:s|sec|seconds)?)\s*(?:to|and)\s+([0-9:.]+(?:s|sec|seconds)?)\b", lower)
    if from_to:
        try:
            t1 = _parse_time_token(from_to.group(1))
            t2 = _parse_time_token(from_to.group(2))
            if t1 < t2:
                start_time = round(t1, 2)
                effective_duration = max(duration, t2)
                end_time = min(effective_duration, round(t2, 2))
        except Exception:
            pass
    else:
        bare_range = re.search(r"\b([0-9:.]+(?:s|sec|seconds)?)\s*(?:to|-)\s*([0-9:.]+(?:s|sec|seconds)?)\b", lower)
        if bare_range:
            try:
                t1 = _parse_time_token(bare_range.group(1))
                t2 = _parse_time_token(bare_range.group(2))
                if t1 < t2:
                    start_time = round(t1, 2)
                    effective_duration = max(duration, t2)
                    end_time = min(effective_duration, round(t2, 2))
            except Exception:
                pass

    # Animated Title / Hero Reveal (e.g., "Add a blue animated title saying 'The Solution' from 01:23 to 01:26")
    if (
        re.search(r"\b(?:animated\s+title|title\s+saying|animated\s+headline|hero\s+reveal|title\s+card|text\s+card)\b", lower)
        or (re.search(r"\b(?:animat\w*|motion\s*graphics?)\b", lower) and re.search(r"\b(?:title|headline)\b", lower))
        or (re.search(r"\b(?:blue|cyan|emerald|green|amber|purple)\s+animated\b", lower))
    ) and not re.search(r"\b(?:upload|screen|browser|terminal|counter|metric|kpi)\b", lower):
        headline_match = re.search(r'(?:saying|titled|reading|with text)?\s*[\'"]([^\'"]+)[\'"]', prompt, re.I)
        headline = headline_match.group(1).strip() if headline_match else ""
        if not headline:
            saying_match = re.search(r'\bsaying\s+([^,.;\n]+?)(?:\s+(?:from|between|at|to|for)\b|$)', prompt, re.I)
            if saying_match:
                headline = saying_match.group(1).strip()
        if not headline:
            headline = "The Solution" if "solution" in lower else "Essential Insight"

        color_theme = "blue" if "blue" in lower else "cyan" if "cyan" in lower else "emerald" if "green" in lower or "emerald" in lower else "amber" if "amber" in lower or "yellow" in lower else "purple"
        return CopilotIntentProposal(
            intent="add_graphic",
            confidence=0.95,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"{color_theme.title()} animated title saying '{headline}' from {start_time:.1f}s to {end_time:.1f}s",
            graphic_template="hero_reveal",
            graphic_props={
                "headline": headline,
                "title": headline,
                "label": "KEY INSIGHT",
                "supporting": "Accelerating workflow execution",
                "colorTheme": color_theme,
            },
            suggested_actions=["Customize title text", "Change color theme"],
        )

    # Animated Counter (e.g., "Add an animated subscriber counter from 00:12 to 00:16 counting to 50k")
    if (
        re.search(r"\b(?:counter|counting|subscribers?|followers?|views?)\b", lower)
        and re.search(r"\b(?:animat\w*|motion|card|graphic|kpi|ticker)\b", lower)
    ) or re.search(r"\b(?:animated\s+counter|subscriber\s+counter|follower\s+counter)\b", lower):
        count_match = re.search(r"\b(?:to|counting\s+to|reach(?:ing)?\s+to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*([kmb])?\b", lower)
        to_val = 50000
        suffix = "k"
        if count_match:
            base_num = float(count_match.group(1))
            unit = (count_match.group(2) or "").lower()
            if unit == "k":
                to_val = int(base_num * 1000)
                suffix = "k"
            elif unit == "m":
                to_val = int(base_num * 1000000)
                suffix = "M"
            elif unit == "b":
                to_val = int(base_num * 1000000000)
                suffix = "B"
            else:
                to_val = int(base_num)
                suffix = ""

        label = "SUBSCRIBERS" if "sub" in lower else "FOLLOWERS" if "follow" in lower else "METRIC COUNTER"
        return CopilotIntentProposal(
            intent="add_graphic",
            confidence=0.95,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"Animated subscriber counter from {start_time:.1f}s to {end_time:.1f}s counting to {count_match.group(0).strip() if count_match else to_val}",
            graphic_template="animated_counter",
            graphic_props={
                "from": 0,
                "to": to_val,
                "label": label,
                "prefix": "",
                "suffix": suffix,
            },
            suggested_actions=["Adjust counter target", "Change count duration"],
        )

    # Web URL / Web evidence capture
    url_match = re.search(r'(?:https?://|www\.)[^\s\"\'<>]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|io|dev|net|ai|co|app)(?:/[^\s\"\'<>]*)?', prompt, re.I)
    if url_match:
        url = url_match.group(0).rstrip(".,;)")
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        is_explicit_broll = bool(re.search(r"\b(?:b-?roll|broll|recording|footage|clip|video)\b", lower)) and not bool(re.search(r"\b(?:graphic|card|mockup)\b", lower))
        return CopilotIntentProposal(
            intent="capture_web_evidence",
            confidence=0.95,
            start_time=start_time,
            end_time=end_time,
            action_type="broll" if is_explicit_broll else "graphic",
            summary=f"Web recording for {url}",
            graphic_template="browser_walkthrough",
            graphic_props={"url": url, "title": "Web Source", "is_broll": is_explicit_broll},
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

    # B-Roll / Stock Footage / Coding / Technology
    if (
        re.search(r"\b(?:b-?roll|broll|footage|stock\s*(?:video|footage)?|cutaway)\b", lower)
        or re.search(r"\b(?:laptop\s*coding|coding|programming|developer|technology|typing|working|nature|city|drone\s*shot)\b", lower)
    ):
        clean_query = re.sub(
            r"\b(?:add|relevant|insert|put|overlay|b-?roll|broll|footage|video|clip|showing|of|i want|want|a screen in which|a screen showing|screen showing|screen|user is|on screen|from|between|at|to|and|keep|my|our|the|narration|audible|audio|clear|uninterrupted)\b",
            "",
            prompt,
            flags=re.I
        ).strip()
        clean_query = re.sub(r"\s+", " ", clean_query).strip()
        if not clean_query or len(clean_query) < 3:
            clean_query = "laptop coding developer" if "coding" in lower else "cinematic technology footage"

        return CopilotIntentProposal(
            intent="add_broll",
            confidence=0.92,
            start_time=start_time,
            end_time=end_time,
            action_type="broll",
            summary=f"Add B-roll footage of {clean_query} from {start_time:.1f}s to {end_time:.1f}s with speech audio preserved",
            search_query=clean_query,
            suggested_actions=["Add stock video footage", "Adjust B-roll timing"],
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

    # Generic Motion Graphics request without specific subtype
    if re.search(r"\b(?:motion\s*graphics?|moton\s*graphicss?|motion\s*card|animated\s*card|graphic\s*card)\b", lower):
        return CopilotIntentProposal(
            intent="add_graphic",
            confidence=0.91,
            start_time=start_time,
            end_time=end_time,
            action_type="graphic",
            summary=f"Animated motion graphic card from {start_time:.1f}s to {end_time:.1f}s",
            graphic_template="hero_reveal",
            graphic_props={
                "headline": "KEY MOMENT",
                "label": "FEATURED",
                "supporting": "Dynamic Motion Graphics",
                "personality": "premium",
            },
            suggested_actions=["Customize headline", "Change motion style"],
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
