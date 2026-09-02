# Implementation Plan: Fix AI Director Cut Representation

## Goal Description
The AI Director currently uses transcript `trigger_id` (e.g. `ID_01`) to perform cuts. This causes it to delete spoken content when it actually intends to cut non-speech gaps or intro silences, because gaps do not have a `trigger_id`. This plan will change the edit decision schema to allow arbitrary `start` and `end` timestamps for cuts, update the prompt to enforce this behavior, update validation logic to check bounds, and finally update the renderer to process timestamp-based cuts correctly.

## User Review Required
None of these changes will alter the underlying FFmpeg rendering mechanics (how B-roll is overlaid or how chunks are cropped). It will strictly modify how segments are sliced on the timeline.

## Open Questions
None.

## Proposed Changes

### AI Director Prompt & Schema
#### [MODIFY] `services/ai_director.py`
- Make `trigger_id` optional in `EditDecision` (set default to `None`).
- Add `start: Optional[float] = None` and `end: Optional[float] = None` to `EditDecision`.
- Update `SYSTEM_PROMPT`:
  - Output JSON schema documentation updated to show `start`/`end` usage for cuts.
  - Explicit instruction: "For cuts, you must use exact timeline `start` and `end`. Never use a transcript trigger_id as a proxy for a gap. Never cut a different region merely because it is the nearest transcript chunk."
  - Explicit instruction: "For b_roll, zoom_in, and sfx, you MUST use `trigger_id`."

### Blueprint Validator
#### [MODIFY] `services/blueprint_validator.py`
- In `validate_blueprint`, if `action == "cut"`:
  - Check that `start` and `end` are provided and valid (`start < end`, within video duration, duration >= `MIN_CUT_DURATION_SEC`).
  - If a `cut` action provides `trigger_id` instead (legacy/fallback), look up `start` and `end` from `timestamp_map`.
- For other actions (`b_roll`, `zoom_in`, `sfx`), enforce that `trigger_id` is present and exists in `timestamp_map`.
- Update `ValidationIssue` to handle cases where `trigger_id` is missing (use `"{start}-{end}"` as the display ID).

### Renderer (Compositor)
#### [MODIFY] `services/compositor.py`
- Update `_build_segment_timeline` to handle arbitrary cut intervals:
  1. Build the base timeline of gaps and chunks (0.0 to `total_duration`).
  2. Extract all cut intervals from the `edits` (using `start` and `end`, falling back to `chunk["start"]`/`chunk["end"]` if only `trigger_id` is provided).
  3. Merge overlapping cut intervals to simplify.
  4. Intersect the base timeline segments with the remaining "kept" intervals.
  5. Yield split/shortened segments for any base segment that partially overlaps a kept interval, preserving its `chunk_id` and `actions`.
  6. Ensure `render_video_pipeline` logs the new sub-segments appropriately.

### Tests
#### [MODIFY] `tests/test_compositor_audio.py`
- Add a regression test for `_build_segment_timeline` mimicking a 10s video with a cut from `0.0 - 3.75s`. Verify that the remainder (`3.75 - 10.0s`) is preserved and gap correctly trimmed.
- Add a test for `cut start=3.75, end=6.89` to verify exact range removal inside a chunk.
#### [MODIFY] `tests/test_ai_director.py`
- Update schema testing to verify `start` and `end` are in the prompt.
#### [MODIFY] `tests/test_blueprint_validator.py`
- Add tests validating that missing `trigger_id` on non-cut actions fails, and valid `start`/`end` cuts pass.

## Verification Plan
### Automated Tests
- Run `pytest tests/test_ai_director.py -v`
- Run `pytest tests/test_blueprint_validator.py -v`
- Run `pytest tests/test_compositor_audio.py -v`

### Manual Verification
- Will verify the small regression test outputs to ensure the exact ranges are preserved/removed as expected.
