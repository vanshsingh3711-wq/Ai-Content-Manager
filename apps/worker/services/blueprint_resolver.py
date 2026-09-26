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
- A scene/chunk (`trigger_id`) CAN contain multiple visual beats (e.g., a character reacting, followed by a motion graphic).
- However, if multiple distinct visual assets (e.g., B-roll and Motion Graphics) are scheduled to appear at the EXACT SAME timestamp, you MUST resolve the conflict.
- Look at the transcript script for that chunk. If the script is highly visual and describes a real-world concept better suited for footage, keep the 'b_roll' and discard the others.
- If the script highlights a specific statistic, quote, or textual point, keep the 'motion_graphics' and discard the others.
- Ensure visual continuity. Do not arbitrarily cut if the visual still supports the dialogue.
- Allow complex visual beats within scenes. A 7-second scene could contain several coordinated animation events or text changes if the dialogue contains distinct ideas.

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

    print(f"\n[RESOLVER: STARTING CONFLICT RESOLUTION]")
    print(f" -> Received B-Roll Plan: {len(broll_plan.edits)} events")
    print(f" -> Received Motion Graphics Plan: {len(mg_plan.edits)} events")
    print(f" -> Received Character Plan: {len(char_plan.edits)} events")
    print(f" -> Master LLM is now analyzing the script to merge and resolve overlapping timestamps...")

    final_plan = _call_llm(system_prompt, user_prompt)
    
    print(f"\n[RESOLVER: FINALIZED MASTER BLUEPRINT]")
    print(f" -> Final merged events: {len(final_plan.edits)}")
    print(f" -> The conflict resolver successfully prioritized actions based on transcript context.")
    return final_plan
