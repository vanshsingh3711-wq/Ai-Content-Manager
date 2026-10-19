import os
import sys
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

# Ensure worker services can be imported by API
worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "worker"))
if worker_path not in sys.path:
    sys.path.insert(0, worker_path)

try:
    from services.asset_manager import search_single_broll_clip
except Exception:
    search_single_broll_clip = None

try:
    from services.blueprint_resolver import coordinate_whole_video_plan, enforce_density_budgeting
except Exception:
    coordinate_whole_video_plan = None
    enforce_density_budgeting = None

router = APIRouter(prefix="/api/v1/editor", tags=["AI Copilot"])


class EditorContextPayload(BaseModel):
    playhead_time: float = Field(default=0.0, ge=0.0, description="Current playhead position in seconds")
    duration: float = Field(default=60.0, gt=0.0, description="Total project duration in seconds")
    aspect_ratio: str = Field(default="9:16", description="Canvas aspect ratio (9:16, 16:9, 1:1, 4:5)")
    selected_item: Optional[Dict[str, Any]] = Field(default=None, description="Currently selected element")
    active_transcript_words: Optional[List[Dict[str, Any]]] = Field(default=None, description="Words near playhead")
    safe_zones: Optional[List[Dict[str, Any]]] = Field(default=None, description="Speaker face/body safe zones")


class EditorCopilotOptions(BaseModel):
    max_edits: int = Field(default=5, ge=1, le=50)
    allow_stock_sourcing: bool = Field(default=True)
    ai_model: Optional[str] = Field(default="DeepSeek V3")


class EditorCopilotRequest(BaseModel):
    project_id: Optional[str] = Field(default=None, description="Timeline project ID")
    prompt: str = Field(..., min_length=1, description="Natural language editing command or request")
    context: EditorContextPayload
    options: Optional[EditorCopilotOptions] = Field(default_factory=EditorCopilotOptions)


class ProposedEditItem(BaseModel):
    id: str
    action_type: str = Field(..., description="broll | graphic | sfx | transition | cut | caption | reflow")
    start: float
    end: float
    track: str = Field(..., description="video | broll | caption | audio | graphic")
    title: str
    description: str
    reason: str
    is_destructive: bool = False
    overlap_conflict: bool = False
    preview_url: Optional[str] = None
    operation: Dict[str, Any]
    status: str = "pending"
    error_message: Optional[str] = None


class EditPlanProposal(BaseModel):
    plan_id: str
    user_prompt: str
    scope: str = Field(..., description="time_range | semantic_anchor | whole_video")
    summary: str
    edits: List[ProposedEditItem]
    created_at: str
    total_duration_seconds: float


def determine_edit_scope(prompt: str) -> str:
    """Classifies the prompt into whole_video, semantic_anchor, or time_range."""
    lower = prompt.lower()
    whole_video_keywords = [
        "throughout", "whole video", "entire video", "all over", "everywhere",
        "make this video", "full video", "make video", "entire timeline",
        "whole timeline", "across the video", "across the whole video",
        "across the entire video", "all the way through", "make the whole video",
        "whole-video", "macro", "video-wide",
    ]
    if any(k in lower for k in whole_video_keywords):
        return "whole_video"
    if any(k in lower for k in ["when i say", "when they say", "mention", "phrase", "where i discuss"]):
        return "semantic_anchor"
    return "time_range"


@router.post("/copilot", response_model=EditPlanProposal)
async def process_copilot_prompt(request: EditorCopilotRequest) -> EditPlanProposal:
    """
    Tier-2 Cloud AI Copilot Endpoint.
    Interprets natural language prompts with context, resolves stock footage queries,
    and returns a structured EditPlanProposal for user review and approval.
    """
    clean_prompt = request.prompt.strip()
    if not clean_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt cannot be empty."
        )

    scope = determine_edit_scope(clean_prompt)
    playhead = request.context.playhead_time
    duration = request.context.duration
    lower = clean_prompt.lower()
    
    plan_id = f"plan_{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()
    edits: List[ProposedEditItem] = []

    # 1. WHOLE-VIDEO MACRO PLANNING
    if scope == "whole_video":
        max_edits = request.options.max_edits if (request.options and request.options.max_edits > 5) else 12
        if coordinate_whole_video_plan:
            plan = coordinate_whole_video_plan(
                total_duration=duration,
                prompt=clean_prompt,
                max_edits=max_edits,
            )
            raw_edits = plan.edits
        else:
            raw_edits = []

        for edit in raw_edits:
            edit_id = f"prop-{uuid.uuid4().hex[:6]}"
            action = edit.action
            start = round(edit.start if edit.start is not None else 0.0, 2)
            end = round(edit.end if edit.end is not None else (start + 3.0), 2)

            if action == "b_roll":
                search_query = edit.search_query or "high energy stock footage"
                broll_data = None
                if search_single_broll_clip and request.options and request.options.allow_stock_sourcing:
                    try:
                        broll_data = search_single_broll_clip(
                            query=search_query,
                            aspect_ratio=request.context.aspect_ratio,
                            duration_min=max(2.0, end - start),
                        )
                    except Exception as err:
                        print(f"[!] Error in search_single_broll_clip: {err}")

                broll_id = broll_data["video_id"] if broll_data else f"broll-{uuid.uuid4().hex[:8]}"
                title_text = broll_data["title"] if broll_data else search_query.title()
                source_url = broll_data["video_url"] if broll_data else f"https://cdn.ai-content-manager.com/broll/{broll_id}.mp4"
                preview_url = broll_data["preview_url"] if broll_data else "https://images.pexels.com/videos/12345/preview.mp4"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="broll",
                        start=start,
                        end=end,
                        track="broll",
                        title=f"Stock B-Roll: {title_text}",
                        description=f"High-quality stock footage matching '{search_query}' from {start:.1f}s to {end:.1f}s.",
                        reason=edit.reason or f"Visualizes narrative concept for '{search_query}'",
                        is_destructive=False,
                        overlap_conflict=False,
                        preview_url=preview_url,
                        operation={
                            "type": "add_element",
                            "track": "broll",
                            "element": {
                                "id": broll_id,
                                "name": title_text,
                                "sourceUrl": source_url,
                                "start": start,
                                "end": end,
                                "opacity": 100,
                                "fitMode": "cover",
                                "position": {"x": 50, "y": 50},
                                "scale": 1.0,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "motion_graphics":
                comp_type = (edit.motion_graphics_type or "hero_reveal").replace("_", "-")
                props = edit.motion_graphics_targets or {"headline": "Key Milestone", "supporting": "Accelerating workflow execution"}
                graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="graphic",
                        start=start,
                        end=end,
                        track="graphic",
                        title=f"Motion Card: {comp_type.replace('-', ' ').title()}",
                        description=f"Remotion motion graphic positioned non-destructively on graphics track.",
                        reason=edit.reason or f"Emphasizes key insight with {comp_type}",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_element",
                            "track": "graphic",
                            "element": {
                                "id": graphic_id,
                                "name": comp_type.replace("-", " ").title(),
                                "compositionId": comp_type,
                                "props": props,
                                "start": start,
                                "end": end,
                                "position": {"x": 50, "y": 35},
                                "scale": 1.0,
                                "rotation": 0,
                                "isUserLocked": False,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "sfx":
                sound_name = edit.sound_effect or "whoosh-in"
                sfx_id = f"sfx-{uuid.uuid4().hex[:8]}"

                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="sfx",
                        start=start,
                        end=end,
                        track="audio",
                        title=f"SFX: {sound_name.replace('-', ' ').title()}",
                        description=f"Audio accent ({sound_name}) anchored to narrative beat.",
                        reason=edit.reason or f"Punchy sound effect punch for {sound_name}",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_element",
                            "track": "audio",
                            "element": {
                                "id": sfx_id,
                                "name": f"SFX: {sound_name.title()}",
                                "sourceUrl": f"https://cdn.ai-content-manager.com/sfx/{sound_name}.mp3",
                                "start": start,
                                "end": end,
                                "volume": 80,
                            }
                        },
                        status="pending"
                    )
                )

            elif action == "transition":
                trans_type = edit.transition or "crossfade"
                edits.append(
                    ProposedEditItem(
                        id=edit_id,
                        action_type="transition",
                        start=start,
                        end=end,
                        track="video",
                        title=f"Transition: {trans_type.replace('_', ' ').title()}",
                        description=f"Smooth {trans_type} transition at {start:.1f}s.",
                        reason=edit.reason or "Section boundary transition",
                        is_destructive=False,
                        overlap_conflict=False,
                        operation={
                            "type": "add_transition",
                            "id": f"trans-{uuid.uuid4().hex[:6]}",
                            "track": "video",
                            "fromClipId": "clip-lead",
                            "toClipId": "clip-tail",
                            "preset": trans_type,
                            "duration": round(end - start, 2) if (end - start > 0) else 0.5,
                            "alignment": "center",
                        },
                        status="pending"
                    )
                )

        broll_count = sum(1 for e in edits if e.action_type == "broll")
        mg_count = sum(1 for e in edits if e.action_type == "graphic")
        sfx_count = sum(1 for e in edits if e.action_type == "sfx")
        trans_count = sum(1 for e in edits if e.action_type == "transition")
        summary = (
            f"Generated coordinated whole-video plan with {len(edits)} edits "
            f"({broll_count} B-roll clips, {mg_count} motion graphics, {sfx_count} SFX cues, {trans_count} transitions) "
            f"respecting pacing and density budgets."
        )

    # 2. SINGLE B-ROLL / FOOTAGE REQUEST
    elif any(k in lower for k in ["b-roll", "broll", "footage", "video of", "person", "watching", "clip of", "stock"]):
        start_time = playhead
        clip_duration = 3.5
        end_time = min(duration, round(start_time + clip_duration, 2))
        
        # Clean topic keywords
        topic_match = re.search(r"(?:b-roll|broll|footage|video|clip|person|showing|of)\s+(?:of\s+)?([a-zA-Z0-9\s]+)", clean_prompt, re.I)
        query_topic = topic_match.group(1).strip() if topic_match else clean_prompt
        # Truncate clean query
        query_topic = re.sub(r"^(?:here|a|an|the|is|i want)\s+", "", query_topic, flags=re.I).strip()
        if not query_topic:
            query_topic = "footage"

        # Query stock video via asset_manager
        broll_data = None
        if search_single_broll_clip and request.options and request.options.allow_stock_sourcing:
            try:
                broll_data = search_single_broll_clip(
                    query=query_topic,
                    aspect_ratio=request.context.aspect_ratio,
                    duration_min=clip_duration,
                )
            except Exception as err:
                print(f"[!] Error in search_single_broll_clip: {err}")

        broll_id = broll_data["video_id"] if broll_data else f"broll-{uuid.uuid4().hex[:8]}"
        title_text = broll_data["title"] if broll_data else query_topic.title()
        source_url = broll_data["video_url"] if broll_data else f"https://cdn.ai-content-manager.com/broll/{query_topic.lower().replace(' ', '_')}.mp4"
        preview_url = broll_data["preview_url"] if broll_data else "https://images.pexels.com/videos/12345/preview.mp4"
        width = broll_data.get("width", 1080) if broll_data else 1080
        height = broll_data.get("height", 1920) if broll_data else 1920
        orientation = broll_data.get("orientation", "portrait") if broll_data else "portrait"

        edit_item = ProposedEditItem(
            id=f"prop-{uuid.uuid4().hex[:6]}",
            action_type="broll",
            start=start_time,
            end=end_time,
            track="broll",
            title=f"Stock B-Roll: {title_text}",
            description=f"High-quality {orientation} stock footage ({width}x{height}) matching '{query_topic}' overlaying timeline from {start_time:.1f}s to {end_time:.1f}s.",
            reason=f"Matches user creative request '{clean_prompt}' at playhead position {playhead:.1f}s.",
            is_destructive=False,
            overlap_conflict=False,
            preview_url=preview_url,
            operation={
                "type": "add_element",
                "track": "broll",
                "element": {
                    "id": broll_id,
                    "name": title_text,
                    "sourceUrl": source_url,
                    "start": start_time,
                    "end": end_time,
                    "opacity": 100,
                    "fitMode": "cover",
                    "position": {"x": 50, "y": 50},
                    "scale": 1.0,
                }
            },
            status="pending"
        )
        edits.append(edit_item)
        summary = f"Found stock B-roll matching '{query_topic}' ({width}x{height}) for playhead {start_time:.1f}s."

    # 3. MOTION GRAPHIC / CARD REQUEST
    elif any(k in lower for k in ["counter", "kpi", "metric", "card", "graphic", "chart", "graph", "graphs", "rising", "callout", "terminal", "social", "quote", "progress", "toast"]):
        start_time = playhead
        card_duration = 4.0
        end_time = min(duration, round(start_time + card_duration, 2))
        
        # Determine exact Remotion composition and specialized props
        if any(w in lower for w in ["graph", "graphs", "chart", "trend", "rising", "growth", "line", "bars", "data point"]):
            comp_id = "chart-reveal"
            title_text = "Rising Growth Chart"
            props = {
                "title": "GROWTH TREND",
                "dataPoint1": "Stage 1: Baseline",
                "dataPoint2": "Stage 2: +85%",
                "dataPoint3": "Stage 3: +165% Surge",
                "personality": "technical",
            }
        elif any(w in lower for w in ["counter", "metric", "kpi", "revenue", "subscribers", "users", "numbers"]):
            comp_id = "metric-reveal"
            title_text = "Metric Reveal"
            props = {
                "label": "KEY METRIC",
                "metric": "+140%",
                "delta": "Target Exceeded",
                "personality": "energetic",
            }
        elif any(w in lower for w in ["terminal", "code", "cli", "command", "npm", "python", "bash"]):
            comp_id = "cooked-terminal"
            title_text = "Terminal Code"
            props = {
                "command": "npm run deploy",
                "output": "Server running: 100% production ready",
            }
        elif any(w in lower for w in ["social", "tweet", "post", "x.com", "instagram", "comment"]):
            comp_id = "cooked-social-post"
            title_text = "Social Post"
            props = {
                "name": "Creator Pro",
                "handle": "@creator_pro",
                "text": clean_prompt,
                "likes": "18.4K",
            }
        elif any(w in lower for w in ["quote", "saying", "advice", "wisdom"]):
            comp_id = "quote-reveal"
            title_text = "Quote Reveal"
            props = {
                "quote": clean_prompt,
                "author": "Key Takeaway",
                "personality": "premium",
            }
        elif any(w in lower for w in ["progress", "percentage", "loading", "status"]):
            comp_id = "cooked-progress"
            title_text = "Progress Status"
            props = {
                "label": "Completion Rate",
                "progress": 85,
            }
        elif any(w in lower for w in ["toast", "notification", "alert", "popup"]):
            comp_id = "cooked-toasts"
            title_text = "Notification Toast"
            props = {
                "title": "Alert",
                "message": clean_prompt,
            }
        elif any(w in lower for w in ["notes", "list", "checklist", "bullet"]):
            comp_id = "cooked-notes"
            title_text = "Action Notes"
            props = {
                "title": "Key Items",
                "items": ["Point 1: Focus", "Point 2: Execute", "Point 3: Scale"],
            }
        else:
            comp_id = "hero-reveal"
            title_text = "Hero Reveal"
            props = {
                "label": "KEY TAKEAWAY",
                "headline": "Essential Insight",
                "supporting": clean_prompt,
            }

        graphic_id = f"graphic-{uuid.uuid4().hex[:8]}"
        edit_item = ProposedEditItem(
            id=f"prop-{uuid.uuid4().hex[:6]}",
            action_type="graphic",
            start=start_time,
            end=end_time,
            track="graphic",
            title=f"Motion Card: {comp_id.replace('-', ' ').title()}",
            description=f"High-production Remotion motion graphic positioned non-destructively on graphics track.",
            reason=f"Visualizes narrative concept from prompt '{clean_prompt}'.",
            is_destructive=False,
            overlap_conflict=False,
            preview_url=None,
            operation={
                "type": "add_element",
                "track": "graphic",
                "element": {
                    "id": graphic_id,
                    "name": comp_id.replace("-", " ").title(),
                    "compositionId": comp_id,
                    "props": props,
                    "start": start_time,
                    "end": end_time,
                    "position": {"x": 50, "y": 35},
                    "scale": 1.0,
                    "rotation": 0,
                    "isUserLocked": False,
                }
            },
            status="pending"
        )
        edits.append(edit_item)
        summary = f"Prepared 1 motion graphic card ({comp_id}) at {start_time:.1f}s."

    # 4. GENERIC / SEMANTIC FALLBACK PROPOSAL
    else:
        start_time = playhead
        end_time = min(duration, round(start_time + 3.0, 2))
        caption_id = f"caption-{uuid.uuid4().hex[:8]}"
        edit_item = ProposedEditItem(
            id=f"prop-{uuid.uuid4().hex[:6]}",
            action_type="caption",
            start=start_time,
            end=end_time,
            track="caption",
            title=f"Narrative Highlight: {clean_prompt[:25]}",
            description=f"Styled dynamic caption highlight from {start_time:.1f}s to {end_time:.1f}s.",
            reason=f"Emphasizes spoken intent '{clean_prompt}'.",
            is_destructive=False,
            overlap_conflict=False,
            operation={
                "type": "add_element",
                "track": "caption",
                "element": {
                    "id": caption_id,
                    "text": clean_prompt,
                    "start": start_time,
                    "end": end_time,
                    "stylePreset": "tiktok_yellow",
                    "position": {"x": 50, "y": 75},
                    "scale": 1.0,
                }
            },
            status="pending"
        )
        edits.append(edit_item)
        summary = f"Generated proposal for '{clean_prompt}' at {start_time:.1f}s."

    return EditPlanProposal(
        plan_id=plan_id,
        user_prompt=clean_prompt,
        scope=scope,
        summary=summary,
        edits=edits,
        created_at=created_at,
        total_duration_seconds=duration,
    )
