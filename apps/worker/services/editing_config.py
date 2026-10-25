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
    MAX_BROLL_COUNT: int = 10           # Default for talking head (short)
    MAX_BROLL_COUNT_FACELESS: int = 20  # Minimum default for faceless short
    MAX_BROLL_PER_MINUTE: int = 24      # Fast-paced reel logic: 1 cut every 2.5s

    def get_max_broll_count(self, video_duration: float, is_faceless: bool = False) -> int:
        """Dynamically scales allowed B-roll cuts with video duration for reel-paced editing."""
        if not is_faceless:
            return self.MAX_BROLL_COUNT
        base_rate = self.MAX_BROLL_PER_MINUTE
        calculated = int(max(1.0, video_duration / 60.0) * base_rate)
        return max(self.MAX_BROLL_COUNT_FACELESS, calculated)

    # Maximum total B-roll duration as a fraction of final video duration
    # 0.50 = B-roll can occupy at most 50% of the final video for talking head
    MAX_BROLL_DURATION_RATIO: float = 0.50
    MAX_BROLL_DURATION_RATIO_FACELESS: float = 1.0  # Faceless videos can be 100% b-roll

    # Minimum duration for a single B-roll clip (seconds)
    MIN_BROLL_DURATION_SEC: float = 2.0
    MIN_BROLL_DURATION_SEC_FACELESS: float = 1.2

    # Maximum duration for a single B-roll clip (seconds)
    MAX_BROLL_DURATION_SEC: float = 8.0

    # Minimum spacing between consecutive B-roll events (seconds)
    MIN_BROLL_SPACING_SEC: float = 2.5
    MIN_BROLL_SPACING_SEC_FACELESS: float = 0.0  # Faceless videos allow continuous back-to-back b-roll

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

    # ── Motion Graphic Pacing & Budget Guardrails (Phase 3) ────────────
    MAX_MG_COUNT_60S: int = 4            # Max 3-4 motion graphics in a 60s reel
    MAX_MG_COUNT_EXPLAINER: int = 9      # Max 7-9 motion graphics in a 3-4m explainer
    MIN_MG_SPACING_SEC: float = 3.5      # Minimum seconds of B-roll between motion graphics
    MIN_MG_HOLD_SEC: float = 2.5         # Minimum display hold (seconds)
    MAX_MG_HOLD_SEC: float = 4.0         # Maximum display hold (seconds)
    ENFORCE_MG_PACING: bool = False      # Config toggle for blueprint validator

    def get_max_mg_count(self, video_duration: float, style: str = "viral") -> int:
        """Dynamically calculates maximum motion graphic cards allowed for video runtime."""
        from services.pacing_gatekeeper import get_motion_graphic_budget
        return get_motion_graphic_budget(video_duration, style=style)


# Singleton instance used throughout the pipeline
EDITING_CONFIG = EditingConfig()
