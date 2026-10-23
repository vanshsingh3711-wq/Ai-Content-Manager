import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from services.copilot_llm import reason_copilot_intent
from services.remotion_renderer import ALLOWED_COMPOSITIONS, render_motion_graphic
from routers.copilot import compute_safe_graphic_position


client = TestClient(app)


def test_acceptance_test_a_prompt_1_hero_reveal():
    """
    Acceptance Test A.1:
    'Add a blue animated title saying 'The Solution' from 01:23 to 01:26'
    - Element on graphicsTrack (track: graphic)
    - start = 83.0, end = 86.0
    - compositionId = hero_reveal
    - headline = 'The Solution'
    - colorTheme = 'blue'
    - Safe-zone avoidance: y=75 when presenter bounding box occupies upper-center
    """
    payload = {
        "project_id": "test-phase3-proj",
        "prompt": "Add a blue animated title saying 'The Solution' from 01:23 to 01:26",
        "context": {
            "playhead_time": 0.0,
            "duration": 120.0,
            "aspect_ratio": "9:16",
            "safe_zones": [
                {
                    "x": 30,
                    "y": 20,
                    "width": 40,
                    "height": 45,
                    "confidence": 0.95,
                    "type": "subject",
                }
            ],
        },
        "options": {
            "max_edits": 1,
            "auto_avoid_subjects": True,
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]

    assert edit["action_type"] == "graphic"
    assert edit["track"] == "graphic"
    assert edit["start"] == 83.0
    assert edit["end"] == 86.0

    op = edit["operation"]
    assert op["type"] == "add_element"
    assert op["track"] == "graphic"
    elem = op["element"]
    assert elem["start"] == 83.0
    assert elem["end"] == 86.0
    assert elem["compositionId"] in ("hero_reveal", "hero-reveal")
    assert elem["props"]["headline"] == "The Solution"
    assert elem["props"]["colorTheme"] == "blue"

    # Presenter occupies x:30..70, y:20..80. Default y:35 collides!
    # Safe zone avoidance must shift graphic to lower third y:75
    assert elem["position"]["y"] == 75
    assert elem["position"]["x"] == 50


def test_acceptance_test_a_prompt_2_animated_counter():
    """
    Acceptance Test A.2:
    'Add an animated subscriber counter from 00:12 to 00:16 counting to 50k'
    - Element on graphicsTrack (track: graphic)
    - start = 12.0, end = 16.0
    - compositionId = animated_counter
    - props: from=0, to=50000, label='SUBSCRIBERS'
    """
    payload = {
        "project_id": "test-phase3-proj-2",
        "prompt": "Add an animated subscriber counter from 00:12 to 00:16 counting to 50k",
        "context": {
            "playhead_time": 0.0,
            "duration": 60.0,
            "aspect_ratio": "9:16",
        },
    }

    response = client.post("/api/v1/editor/copilot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["edits"]) == 1
    edit = data["edits"][0]

    assert edit["action_type"] == "graphic"
    assert edit["track"] == "graphic"
    assert edit["start"] == 12.0
    assert edit["end"] == 16.0

    elem = edit["operation"]["element"]
    assert elem["compositionId"] in ("animated_counter", "animated-counter")
    assert elem["props"]["from"] == 0
    assert elem["props"]["to"] == 50000
    assert elem["props"]["label"] == "SUBSCRIBERS"


def test_compute_safe_graphic_position():
    # 1. No safe zones -> default position
    default_pos = {"x": 50, "y": 35}
    assert compute_safe_graphic_position([], default_pos) == default_pos

    # 2. Presenter at upper-center collides with (50, 35) -> steers to lower-third (50, 75)
    presenter_zones = [{"x": 30, "y": 20, "width": 40, "height": 45}]
    steered = compute_safe_graphic_position(presenter_zones, default_pos)
    assert steered == {"x": 50, "y": 75}

    # 3. Presenter also in lower third -> steers to flank (25, 50)
    full_body_zones = [{"x": 20, "y": 10, "width": 60, "height": 80}]
    steered_flank = compute_safe_graphic_position(full_body_zones, default_pos)
    assert steered_flank == {"x": 25, "y": 50}


def test_copilot_llm_service_phase3_motion_graphics():
    context = {
        "playhead_time": 0.0,
        "duration": 120.0,
        "aspect_ratio": "9:16",
        "safe_zones": [{"x": 30, "y": 20, "width": 40, "height": 60}],
    }

    proposal = reason_copilot_intent(
        prompt="Add a blue animated title saying 'The Solution' from 01:23 to 01:26",
        context=context,
    )
    assert proposal is not None
    assert proposal.intent == "add_graphic"
    assert proposal.start_time == 83.0
    assert proposal.end_time == 86.0
    assert proposal.graphic_template in ("hero_reveal", "hero-reveal")
    assert proposal.graphic_props.get("headline") == "The Solution"
    assert proposal.graphic_props.get("colorTheme") == "blue"

    # Counter prompt
    counter_proposal = reason_copilot_intent(
        prompt="Add an animated subscriber counter from 00:12 to 00:16 counting to 50k",
        context={"playhead_time": 0.0, "duration": 60.0},
    )
    assert counter_proposal is not None
    assert counter_proposal.intent == "add_graphic"
    assert counter_proposal.start_time == 12.0
    assert counter_proposal.end_time == 16.0
    assert counter_proposal.graphic_template in ("animated_counter", "animated-counter")
    assert counter_proposal.graphic_props.get("to") == 50000
    assert counter_proposal.graphic_props.get("label") == "SUBSCRIBERS"


def test_remotion_renderer_hero_reveal_and_counter_alpha():
    assert "hero_reveal" in ALLOWED_COMPOSITIONS
    assert "animated_counter" in ALLOWED_COMPOSITIONS

    with patch("os.path.isdir", return_value=True), \
         patch("subprocess.run") as mock_run, \
         patch("os.path.exists", return_value=True), \
         patch("os.path.getsize", return_value=1024 * 1024 * 3):

        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")

        # Test Hero Reveal render
        res_hero = render_motion_graphic(
            composition_id="hero_reveal",
            props={"headline": "The Solution", "colorTheme": "blue"},
            duration_frames=90,
            fps=30,
            width=1080,
            height=1920,
            output_path="/tmp/test_hero.mov",
        )
        assert res_hero == "/tmp/test_hero.mov"
        cmd = mock_run.call_args[0][0]
        assert "hero-reveal" in cmd
        assert "--codec=prores" in cmd
        assert "--pixel-format=yuva444p10le" in cmd

        # Test Animated Counter render
        res_counter = render_motion_graphic(
            composition_id="animated_counter",
            props={"from": 0, "to": 50000, "label": "SUBSCRIBERS"},
            duration_frames=120,
            fps=30,
            width=1080,
            height=1920,
            output_path="/tmp/test_counter.mov",
        )
        assert res_counter == "/tmp/test_counter.mov"
        cmd2 = mock_run.call_args[0][0]
        assert "animated-counter" in cmd2
        assert "--codec=prores" in cmd2


def test_remotion_renderer_finance_pack_compositions():
    """
    Phase 6: Verifies all 10 Finance Motion Graphics are recognized by
    RemotionRenderer and properly dispatched to npx remotion render.
    """
    from services.remotion_renderer import build_props_from_edit

    finance_templates = [
        "candlestick-hud",
        "compound-growth-curve",
        "portfolio-donut",
        "inflation-cash-burn",
        "banking-notification",
        "budget-waterfall",
        "debt-payoff-tracker",
        "roi-balance-scale",
        "wealth-flywheel",
        "battle-chart",
    ]

    for comp in finance_templates:
        assert comp in ALLOWED_COMPOSITIONS
        assert comp.replace("-", "_") in ALLOWED_COMPOSITIONS

    with patch("subprocess.run") as mock_run, \
         patch("os.path.isdir", return_value=True), \
         patch("os.path.exists", return_value=True), \
         patch("os.path.getsize", return_value=1024 * 1024 * 2):

        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")

        # Test Banking Notification render
        res_bank = render_motion_graphic(
            composition_id="banking-notification",
            props={"bankName": "CHASE", "amount": "$10,000"},
            duration_frames=120,
            fps=30,
            width=1080,
            height=1920,
            output_path="/tmp/test_bank.mov",
        )
        assert res_bank == "/tmp/test_bank.mov"
        cmd = mock_run.call_args[0][0]
        assert "banking-notification" in cmd
        assert "--codec=prores" in cmd
        assert "--pixel-format=yuva444p10le" in cmd

        # Test Candlestick HUD render
        res_candle = render_motion_graphic(
            composition_id="candlestick_hud",
            props={"ticker": "BTC/USD", "currentPrice": 94500},
            duration_frames=150,
            fps=30,
            width=1080,
            height=1920,
            output_path="/tmp/test_candle.mov",
        )
        assert res_candle == "/tmp/test_candle.mov"
        cmd_candle = mock_run.call_args[0][0]
        assert "candlestick-hud" in cmd_candle

    # Verify build_props_from_edit
    edit_decision = {
        "motion_graphics_type": "debt-payoff-tracker",
        "motion_graphics_targets": {"initialDebt": 25000, "paidAmount": 25000, "debtName": "Visa Card"},
    }
    props = build_props_from_edit(edit_decision)
    assert props["initialDebt"] == 25000
    assert props["paidAmount"] == 25000
    assert props["debtName"] == "Visa Card"

