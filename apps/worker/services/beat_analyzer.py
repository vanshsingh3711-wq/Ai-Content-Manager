import json
import logging
import re
from typing import Literal, List, Dict, Any, Optional
from pydantic import BaseModel, Field, ValidationError

from services.ai_director import _call_llm

logger = logging.getLogger(__name__)

ROLES = Literal[
    "hook", "claim", "example", "statistic", "comparison", "list", 
    "story", "transition", "cta", "process", "definition", "analogy", 
    "setup", "conclusion", "other"
]

class Beat(BaseModel):
    id: int
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    start_word_index: int
    end_word_index: int
    text: str
    role: ROLES
    energy: Literal["low","medium","high"]
    key_entities: List[str]
    focus_start_word_index: int
    focus_end_word_index: int
    focus_start: float
    focus_end: float
    emphasis_words: List[str]
    concreteness: Literal["concrete","abstract","mixed"]
    visual_potential: str
    importance: int = Field(..., ge=1, le=5)

class LLMBeat(BaseModel):
    id: int
    start_word_index: int
    end_word_index: int
    text: str
    role: ROLES
    energy: Literal["low","medium","high"]
    key_entities: List[str]
    focus_start_word_index: int
    focus_end_word_index: int
    emphasis_words: List[str]
    concreteness: Literal["concrete","abstract","mixed"]
    visual_potential: str

class LLMBeatSheet(BaseModel):
    beats: List[LLMBeat]
    importance_ranking: List[int]
    language: str

class BeatSheet(BaseModel):
    beats: List[Beat]
    total_duration: float
    language: str

def has_number(text: str) -> bool:
    if bool(re.search(r'\d', text)):
        return True
    number_words = ["percent", "million", "thousand", "billion", "hundred", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "zero"]
    text_lower = text.lower()
    return any(w in text_lower for w in number_words)

def list_item_count(text: str) -> int:
    # Very rough heuristic for list item count
    return text.count(',') + text.count(' or ') + text.count(' and ') + 1

def validate_llm_beat_sheet(llm_beat_sheet: LLMBeatSheet, num_words: int, words: List[Dict[str, Any]] = None) -> str:
    """Validates consecutive word indices. Returns error string if invalid, else empty string."""
    errors = []
    
    if not llm_beat_sheet.beats:
        return "Beat sheet contains no beats."
        
    if llm_beat_sheet.beats[0].start_word_index != 0:
        errors.append(f"First beat must start at word index 0, got {llm_beat_sheet.beats[0].start_word_index}")
        
    last_expected_index = num_words - 1
    if llm_beat_sheet.beats[-1].end_word_index != last_expected_index:
        errors.append(f"Last beat must end at word index {last_expected_index}, got {llm_beat_sheet.beats[-1].end_word_index}")

    for i, beat in enumerate(llm_beat_sheet.beats):
        if beat.start_word_index > beat.end_word_index:
            errors.append(f"Beat {beat.id} has start_word_index > end_word_index")
            
        if i > 0:
            prev_beat = llm_beat_sheet.beats[i-1]
            if beat.start_word_index != prev_beat.end_word_index + 1:
                errors.append(f"Gap or overlap: beat {prev_beat.id} ends at {prev_beat.end_word_index}, but beat {beat.id} starts at {beat.start_word_index}. Must be consecutive.")
                
        # Focus phrase validation
        if beat.focus_start_word_index < beat.start_word_index or beat.focus_end_word_index > beat.end_word_index:
            errors.append(f"Beat {beat.id}: focus phrase indices out of bounds of the beat indices.")
            
        focus_len = beat.focus_end_word_index - beat.focus_start_word_index + 1
        if beat.role not in ["list", "comparison", "statistic", "process"] and focus_len > 4:
            errors.append(f"Beat {beat.id}: focus phrase is longer than 4 words for role {beat.role}.")
            
        if words:
            # Check function word
            first_focus_word = words[beat.focus_start_word_index]["word"].lower().strip(".,!?\"'")
            function_words = {"of", "the", "a", "an", "to", "in", "on", "at", "by", "for", "with", "about", "as", "into", "like", "through", "after", "over", "between", "out", "against", "during", "without", "before", "under", "around", "among", "and", "but", "or", "nor", "for", "yet", "so"}
            if first_focus_word in function_words:
                errors.append(f"Beat {beat.id}: focus phrase must not start with a function word (got '{first_focus_word}').")
                
            # Check punctuation crossing
            for idx in range(beat.focus_start_word_index, beat.focus_end_word_index):
                w = words[idx]["word"]
                if any(p in w for p in [".", "?", "!", ";", ":"]):
                    errors.append(f"Beat {beat.id}: focus phrase crosses a punctuation boundary at word index {idx} ('{w}').")
            
        # Validate emphasis words exist in text (case insensitive)
        beat_text_lower = beat.text.lower()
        missing_emphasis = [w for w in beat.emphasis_words if w.lower() not in beat_text_lower]
        if missing_emphasis:
            errors.append(f"Beat {beat.id} has emphasis_words not in its text: {missing_emphasis}")

    return "\n".join(errors)



def auto_repair_llm_beat_sheet(llm_beat_sheet: LLMBeatSheet, words: List[Dict[str, Any]] = None) -> LLMBeatSheet:
    repair_count = 0
    """Attempts basic auto-repairs, such as dropping missing emphasis words and applying deterministic detectors."""
    for beat in llm_beat_sheet.beats:
        beat_text_lower = beat.text.lower()
        beat.emphasis_words = [w for w in beat.emphasis_words if w.lower() in beat_text_lower][:3]
        
        if beat.role not in ["list", "comparison", "statistic", "process"]:
            if beat.focus_end_word_index - beat.focus_start_word_index >= 4:
                old_end = beat.focus_end_word_index
                beat.focus_end_word_index = beat.focus_start_word_index + 3
                logger.info(f"BeatAnalyzer: Repairing focus_end_word_index from {old_end} to {beat.focus_end_word_index} (max length) for beat {beat.id}")
                repair_count += 1
                
        if words:
            # Fix function words at the start
            function_words = {"of", "the", "a", "an", "to", "in", "on", "at", "by", "for", "with", "about", "as", "into", "like", "through", "after", "over", "between", "out", "against", "during", "without", "before", "under", "around", "among", "and", "but", "or", "nor", "for", "yet", "so"}
            while beat.focus_start_word_index <= beat.focus_end_word_index:
                first_w = words[beat.focus_start_word_index]["word"].lower().strip(".,!?\"'")
                if first_w in function_words:
                    old_start = beat.focus_start_word_index
                    beat.focus_start_word_index += 1
                    logger.info(f"BeatAnalyzer: Repairing focus_start_word_index from {old_start} to {beat.focus_start_word_index} (function word) for beat {beat.id}")
                    repair_count += 1
                else:
                    break
                    
            # Fix punctuation crossing (truncate at punctuation)
            for idx in range(beat.focus_start_word_index, beat.focus_end_word_index):
                w = words[idx]["word"]
                if any(p in w for p in [".", "?", "!", ";", ":"]):
                    old_end = beat.focus_end_word_index
                    beat.focus_end_word_index = idx
                    logger.info(f"BeatAnalyzer: Repairing focus_end_word_index from {old_end} to {beat.focus_end_word_index} (punctuation) for beat {beat.id}")
                    repair_count += 1
                    break
        
        # Deterministic role downgrades
        if beat.role == "statistic" and not has_number(beat.text):
            logger.info(f"BeatAnalyzer: Repairing role from statistic to claim for beat {beat.id} (no numbers detected)")
            beat.role = "claim"
            repair_count += 1
        elif beat.role == "list" and list_item_count(beat.text) < 3:
            logger.info(f"BeatAnalyzer: Repairing role from list to claim for beat {beat.id} (list_item_count < 3)")
            beat.role = "claim"
            repair_count += 1

    if repair_count > 0:
        logger.warning(f"BeatAnalyzer: Performed {repair_count} auto-repairs on this run.")

    return llm_beat_sheet

def analyze_script(transcript_words: List[Dict[str, Any]], script_text: str, max_retries: int = 2) -> BeatSheet:
    system_prompt = """You are a master video editor breaking down a script into a 'Beat Sheet'.
A beat is a distinct idea or logical segment, typically covering 3-10 seconds of speech. Merge very short sentences; split only if a sentence carries two distinct ideas.

OUTPUT FORMAT (JSON ONLY):
{
  "beats": [
    {
      "id": 1,
      "start_word_index": 0,
      "end_word_index": 5,
      "text": "The exact words spoken in this beat.",
      "role": "hook|claim|example|statistic|comparison|list|story|transition|cta|process|definition|analogy|setup|conclusion|other",
      "energy": "low|medium|high",
      "key_entities": ["concrete nouns", "names", "numbers"],
      "focus_start_word_index": 3,
      "focus_end_word_index": 4,
      "emphasis_words": ["words", "to", "highlight"],
      "concreteness": "concrete|abstract|mixed",
      "visual_potential": "A short hint for what visual would fit (e.g. 'A bustling stock exchange')."
    }
  ],
  "importance_ranking": [1, 2, 3],
  "language": "en"
}

DEFINITIONS:
- concreteness: 'concrete' = can be filmed with a camera (e.g. a car, an apple). 'abstract' = concepts (e.g. AI, freedom, optimization).
- importance: 1 to 5. 5 = the beat the video's message depends on; 4 = key supporting point; 3 = normal content; 2 = setup/filler; 1 = pure transition. You MUST pick 1-2 "must-land" beats (importance 5) and at least one filler beat (<=2). Rank them relative to each other so scores spread out. Do not overuse 5s or 4s.
- role:
  - hook: first few seconds to grab attention.
  - cta: an explicit ask to the viewer (subscribe, try, follow, click).
  - statistic: a specific number or measurable quantity appears in the beat.
  - comparison: two named things are contrasted.
  - process, definition, analogy, setup, conclusion, claim, example, list, story, transition, other.

RULES:
- You will receive a numbered list of words. Return the `start_word_index` and `end_word_index` for each beat.
- The first beat must start at index 0. The last beat must end at the very last index provided.
- Beats must be completely consecutive. Beat N's end_word_index must be X, and Beat N+1's start_word_index MUST be X + 1. There can be NO gaps and NO overlapping words.
- `focus_start_word_index` and `focus_end_word_index` define the focus phrase. 
  - They must form a noun or verb phrase.
  - They must NOT start with a function word (e.g. of, the, a, to, in, on, at, by).
  - They must NOT cross a punctuation boundary.
  - Max 4 words normally. 
  - EXCEPTIONS: For roles 'list', 'comparison', 'statistic', 'process', the focus window MUST span the entire set of items/comparisons (can exceed 4 words).
- `emphasis_words` MUST appear exactly in the `text` field, limited to 3 words, and should fall within the focus phrase.
- `importance_ranking` MUST contain every beat's `id` exactly once, from most to least important.

FEW-SHOT EXAMPLES:
[
  {"index": 0, "word": "Welcome"},
  {"index": 1, "word": "to"},
  {"index": 2, "word": "the"},
  {"index": 3, "word": "future."}
] ->
{
  "beats": [
    {
      "id": 1,
      "start_word_index": 0,
      "end_word_index": 3,
      "text": "Welcome to the future.",
      "role": "hook",
      "energy": "high",
      "key_entities": ["future"],
      "focus_start_word_index": 2,
      "focus_end_word_index": 3,
      "emphasis_words": ["the", "future."],
      "concreteness": "abstract",
      "visual_potential": "Glowing futuristic city",
      "importance": 4
    }
  ],
  "language": "en"
}
"""

    indexed_words = []
    for i, w in enumerate(transcript_words):
        indexed_words.append({"index": i, "word": w["word"]})
        
    words_context = json.dumps(indexed_words, indent=2)
    user_prompt = f"Analyze the following transcript words and build a continuous beat sheet by word indices:\n\n{words_context}"
    
    error_feedback = ""
    num_words = len(transcript_words)
    
    for attempt in range(max_retries + 1):
        try:
            current_user_prompt = user_prompt
            if error_feedback:
                logger.warning(f"[BeatAnalyzer Schema Retry {attempt}/{max_retries}] Fixing errors:\n{error_feedback}")
                current_user_prompt += f"\n\nYOUR PREVIOUS OUTPUT HAD THESE ERRORS. FIX THEM:\n{error_feedback}"
                
            response_str = _call_llm(system_prompt, current_user_prompt, raw_output=True)
            data = json.loads(response_str)
            llm_beat_sheet = LLMBeatSheet.model_validate(data)
            
            # Auto-repair before validation to fix minor issues like length and function words
            llm_beat_sheet = auto_repair_llm_beat_sheet(llm_beat_sheet, transcript_words)
            
            # Validate strict requirements
            validation_errors = validate_llm_beat_sheet(llm_beat_sheet, num_words, transcript_words)
            if validation_errors:
                error_feedback = validation_errors
                raise ValueError(f"Beat Sheet Validation Failed:\n{validation_errors}")
                
            # Auto repair what we can (and downgrade deterministic roles)
            # llm_beat_sheet = auto_repair_llm_beat_sheet(llm_beat_sheet)
                
            # Map importance ranks to scores
            num_beats = len(llm_beat_sheet.beats)
            ranking = llm_beat_sheet.importance_ranking
            beat_importance = {}
            for i, beat_id in enumerate(ranking):
                percentile = i / num_beats
                # top 15% = 5, next 25% (up to 40%) = 4, bottom 20% (80-100%) = 1 or 2
                if percentile < 0.15:
                    score = 5
                elif percentile < 0.40:
                    score = 4
                elif percentile >= 0.80:
                    score = 2
                else:
                    score = 3
                beat_importance[beat_id] = score
                
            # Derived final BeatSheet
            final_beats = []
            for b in llm_beat_sheet.beats:
                start_time = transcript_words[b.start_word_index]["start"]
                end_time = transcript_words[b.end_word_index]["end"]
                
                f_start_time = transcript_words[b.focus_start_word_index]["start"]
                f_end_time = transcript_words[b.focus_end_word_index]["end"]
                
                final_beats.append(
                    Beat(
                        id=b.id,
                        start=start_time,
                        end=end_time,
                        start_word_index=b.start_word_index,
                        end_word_index=b.end_word_index,
                        text=b.text,
                        role=b.role,
                        energy=b.energy,
                        key_entities=b.key_entities,
                        focus_start_word_index=b.focus_start_word_index,
                        focus_end_word_index=b.focus_end_word_index,
                        focus_start=f_start_time,
                        focus_end=f_end_time,
                        emphasis_words=b.emphasis_words,
                        concreteness=b.concreteness,
                        visual_potential=b.visual_potential,
                        importance=beat_importance.get(b.id, 3)
                    )
                )
            
            total_duration = transcript_words[-1]["end"]
            return BeatSheet(beats=final_beats, total_duration=total_duration, language=llm_beat_sheet.language)
            
        except ValidationError as e:
            error_feedback = f"Schema validation error: {e}"
            if attempt == max_retries:
                raise
        except Exception as e:
            if attempt == max_retries:
                raise
            error_feedback = str(e)
            
    raise RuntimeError("Failed to generate valid beat sheet after retries.")

MAX_UNTREATED_GAP_SEC = 9.0

def _apply_window_logic(edit, target_beat, action):
    old_start = getattr(edit, "start", 0)
    old_end = getattr(edit, "end", 0)
    if action == "motion_graphics":
        edit.start = target_beat.get("focus_start", target_beat["start"])
        duration = target_beat["end"] - edit.start
        if duration > 6.0:
            duration = 6.0
        edit.end = edit.start + duration
        if edit.end > target_beat["end"]:
            edit.end = target_beat["end"]
        if edit.end - edit.start < 2.0:
            edit.start = max(target_beat["start"], edit.end - 2.0)
    else:
        edit.start = target_beat["start"]
        edit.end = target_beat["end"]
    return old_start != edit.start or old_end != edit.end

def enforce_beat_sheet_constraints(result_edits: list, beat_sheet_dict: dict, planner_name: str) -> list:
    if not beat_sheet_dict or not beat_sheet_dict.get("beats"):
        return result_edits
    
    beats = beat_sheet_dict["beats"]
    if not beats:
        return result_edits
        
    valid_edits = []
    total_proposed = 0
    dropped = 0
    snapped_count = 0
    
    # Track which beats got treated
    treated_beat_ids = set()
    
    for edit in result_edits:
        if getattr(edit, "action", "") == "cut":
            valid_edits.append(edit)
            continue
            
        total_proposed += 1
        
        trigger_id = getattr(edit, "trigger_id", "")
        target_beat = next((b for b in beats if f"beat_{b['id']}" == str(trigger_id)), None)
        
        if not target_beat:
            edit_start = getattr(edit, "start", None)
            if edit_start is None:
                dropped += 1
                continue
            target_beat = min(beats, key=lambda b: abs(b["start"] - edit_start))
            
        if target_beat.get("importance", 5) <= 2:
            dropped += 1
            continue
            
        action = getattr(edit, "action", "")
        old_start = edit.start
        old_end = edit.end
        
        snapped = _apply_window_logic(edit, target_beat, action)
        if snapped:
            snapped_count += 1
            
        # Bind the beat ID for later logic
        setattr(edit, "_beat_id", target_beat["id"])
        treated_beat_ids.add(target_beat["id"])
        valid_edits.append(edit)

    # Sort valid edits (excluding cuts) to compute gaps
    overlays = [e for e in valid_edits if getattr(e, "action", "") != "cut"]
    overlays.sort(key=lambda e: e.start)
    
    # GAP LOGIC
    # We find gaps between the end of one overlay and the start of the next.
    # The first gap is from 0 to the first overlay.
    # The last gap is from the last overlay to total_duration.
    total_duration = beat_sheet_dict.get("total_duration", 0)
    
    def get_gaps():
        gaps = []
        last_end = 0.0
        for ov in overlays:
            if ov.start - last_end > 0:
                gaps.append((last_end, ov.start))
            last_end = max(last_end, ov.end)
        if total_duration - last_end > 0:
            gaps.append((last_end, total_duration))
        return gaps

    def promote_beat_in_gap(gap_start, gap_end):
        # find untreated beats inside gap
        # beat must start inside the gap
        candidates = [b for b in beats if b["id"] not in treated_beat_ids and b["start"] >= gap_start and b["start"] < gap_end and b.get("importance", 5) > 1]
        if not candidates:
            return False
            
        candidates.sort(key=lambda b: (-b.get("importance", 5), b["start"]))
        chosen = candidates[0]
        
        from services.ai_director import EditDecision
        # Use simplest option: hero_reveal
        print(f"[{planner_name}] GAP PROMOTION: Promoting beat {chosen['id']} inside gap ({gap_start:.1f}-{gap_end:.1f}) using simplest option 'hero_reveal'")
        new_edit = EditDecision(
            action="motion_graphics" if planner_name == "MOTION GRAPHICS PLANNER" else "broll",
            trigger_id=f"beat_{chosen['id']}",
            start=chosen["start"],
            end=chosen["end"],
            motion_graphics_type="hero_reveal",
            motion_graphics_targets={"text": chosen["text"][:30]}
        )
        
        _apply_window_logic(new_edit, chosen, getattr(new_edit, "action"))
        setattr(new_edit, "_beat_id", chosen["id"])
        overlays.append(new_edit)
        overlays.sort(key=lambda e: e.start)
        treated_beat_ids.add(chosen["id"])
        valid_edits.append(new_edit)
        return True

    while True:
        current_gaps = get_gaps()
        promoted_any = False
        for gs, ge in current_gaps:
            if ge - gs > MAX_UNTREATED_GAP_SEC:
                if promote_beat_in_gap(gs, ge):
                    promoted_any = True
                    break # Recompute gaps
        if not promoted_any:
            break

    # MAX CONSECUTIVE RULE
    # Find consecutive treated beats
    sorted_beats = sorted(beats, key=lambda b: b["start"])
    consecutive = 0
    conflict_reported = False
    for b in sorted_beats:
        if b["id"] in treated_beat_ids:
            consecutive += 1
            if consecutive > 2:
                print(f"[{planner_name}] CONFLICT: gap rule and max-2-consecutive rule conflict at beat {b['id']}")
                conflict_reported = True
        else:
            consecutive = 0

    # Print Table
    print(f"\n[{planner_name}] FINAL TABLE:")
    print("OVERLAY | BEAT | TEMPLATE | START | END")
    for ov in overlays:
        tmpl = getattr(ov, "motion_graphics_type", "N/A")
        print(f"{ov.action} | {getattr(ov, '_beat_id', 'N/A')} | {tmpl} | {ov.start:.2f} | {ov.end:.2f}")
    
    print("GAPS (sec):")
    for gs, ge in get_gaps():
        print(f" - {ge - gs:.2f}s ({gs:.2f} to {ge:.2f})")
    
    print(f"[{planner_name} STATS] Pre-enforcement returned: {total_proposed} overlays. Dropped: {dropped}. Snapped: {snapped_count}. Post-enforcement: {len(overlays)}.")
    return valid_edits
