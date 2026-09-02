"""
Editing Configuration — Centralized guardrails for the AI editing pipeline.

All B-roll limits, duration budgets, and validation thresholds live here.
These are configuration values, not hardcoded throughout the codebase.
"""


class EditingConfig:
    """
    Configurable limits for the editing pipeline.
    Tune these values to control how aggressively the AI edits.
    """

    # ── B-roll Guardrails ──────────────────────────────────────────────
    # Maximum number of B-roll events allowed in a single video
    MAX_BROLL_COUNT: int = 3

    # Maximum total B-roll duration as a fraction of final video duration
    # 0.40 = B-roll can occupy at most 40% of the final video
    MAX_BROLL_DURATION_RATIO: float = 0.40

    # Minimum duration for a single B-roll clip (seconds)
    MIN_BROLL_DURATION_SEC: float = 2.5

    # Maximum duration for a single B-roll clip (seconds)
    MAX_BROLL_DURATION_SEC: float = 6.0

    # Minimum spacing between consecutive B-roll events (seconds)
    MIN_BROLL_SPACING_SEC: float = 5.0

    # Whether every B-roll decision must include a reason/justification
    BROLL_REASON_REQUIRED: bool = True

    # ── Cut Guardrails ─────────────────────────────────────────────────
    # Minimum cut duration (seconds) — ignore cuts shorter than this
    MIN_CUT_DURATION_SEC: float = 0.3

    # ── Post-Render Validation ─────────────────────────────────────────
    # Maximum acceptable difference between audio and video duration (seconds)
    MAX_AV_SYNC_TOLERANCE_SEC: float = 1.0

    # Minimum expected audio duration as fraction of video duration
    # If audio_duration / video_duration < this value, flag as failure
    MIN_AUDIO_DURATION_RATIO: float = 0.8


# Singleton instance used throughout the pipeline
EDITING_CONFIG = EditingConfig()
