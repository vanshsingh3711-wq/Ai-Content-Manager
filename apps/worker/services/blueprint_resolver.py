import json
from pydantic import BaseModel, Field
from typing import List
from services.ai_director import EditList, _call_llm, _wait_for_internet_retry

@_wait_for_internet_retry
def resolve_master_blueprint(
    unified_analysis_json: str,
    broll_plan: EditList,
    mg_plan: EditList,
    char_plan: EditList
) -> EditList:
    """
    Acts as the Master Director. Takes the independent plans from the visual sub-agents
    and resolves any conflicts based on the script context.
    """
    
    system_prompt = """You are the Master Blueprint Resolver for an AI video editing pipeline.
You will receive a unified analysis of a video (transcript and timing) AND three separate visual plans from specialized AI sub-agents:
1. B-Roll Plan
2. Motion Graphics Plan
3. 2D Character Plan

Your job is to merge these into a single, cohesive Edit Decision List.

CONFLICT RESOLUTION RULES:
- If multiple visual events (e.g., B-roll and Motion Graphics) are scheduled for the exact same `trigger_id` or timestamp, you MUST resolve the conflict.
- Look at the transcript script for that chunk. If the script is highly visual and describes a real-world concept better suited for footage, keep the 'b_roll' and discard the others.
- If the script highlights a specific statistic, quote, or textual point, keep the 'motion_graphics' and discard the others.
- Do not overload the viewer. Ensure there is breathing room between visual elements.

OUTPUT FORMAT:
Output ONLY a valid JSON object containing the finalized, merged "edits" array.
"""

    user_prompt = f"""--- UNIFIED ANALYSIS (Transcript & Context) ---
{unified_analysis_json}

--- B-ROLL PLAN ---
{broll_plan.model_dump_json(indent=2)}

--- MOTION GRAPHICS PLAN ---
{mg_plan.model_dump_json(indent=2)}

--- 2D CHARACTER PLAN ---
{char_plan.model_dump_json(indent=2)}

Please merge these plans, resolving conflicts based on the script, and output the final JSON EditList.
"""

    return _call_llm(system_prompt, user_prompt)
