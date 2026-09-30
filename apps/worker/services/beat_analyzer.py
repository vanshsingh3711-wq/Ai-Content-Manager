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
    
    for edit in result_edits:
        if getattr(edit, "action", "") == "cut":
            valid_edits.append(edit)
            continue
            
        total_proposed += 1
        
        # We find the beat based on the edit's trigger_id if available
        trigger_id = getattr(edit, "trigger_id", "")
        target_beat = next((b for b in beats if str(b["id"]) == trigger_id.replace("beat_", "").replace("ID_", "")), None)
        
        if not target_beat:
            # Fallback to closest start time
            edit_start = getattr(edit, "start", None)
            if edit_start is None:
                dropped += 1
                continue
            target_beat = min(beats, key=lambda b: abs(b["start"] - edit_start))
            
        if target_beat.get("importance", 5) <= 2:
            dropped += 1
            continue
            
        old_start = edit.start
        old_end = edit.end
        
        action = getattr(edit, "action", "")
        if action == "motion_graphics":
            # Focus window logic
            # Start at focus phrase start
            edit.start = target_beat.get("focus_start", target_beat["start"])
            
            # Duration min 2.0s, max 6.0s
            duration = target_beat["end"] - edit.start
            if duration < 2.0:
                duration = 2.0
            if duration > 6.0:
                duration = 6.0
                
            edit.end = edit.start + duration
            # Bound by beat end (unless beat is shorter than 2s, in which case it might bleed, which is fine, 
            # but user says "within the beat", let's bind it if beat is longer than 2s).
            if edit.end > target_beat["end"] and (target_beat["end"] - edit.start >= 2.0):
                edit.end = target_beat["end"]
        else:
            # B-roll snaps to beat boundaries
            edit.start = target_beat["start"]
            edit.end = target_beat["end"]
            
        print(f"[{planner_name}] Enforced {action} for {trigger_id}: start {old_start:.2f}->{edit.start:.2f}, end {old_end:.2f}->{edit.end:.2f}")
            
        snapped = False
        if old_start != edit.start or old_end != edit.end:
            snapped = True
            
        if snapped:
            snapped_count += 1
            
        valid_edits.append(edit)
        
    print(f"[{planner_name} STATS] Pre-enforcement returned: {total_proposed} overlays. Dropped: {dropped}. Snapped: {snapped_count}. Post-enforcement: {total_proposed - dropped}.")
    return valid_edits
