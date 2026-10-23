"""
remotion_renderer.py — Replaces render_html_motion.py

Renders a motion graphic composition using Remotion CLI and returns
a transparent ProRes MOV file (alpha channel preserved for FFmpeg overlay).

Usage from compositor.py:
    from services.remotion_renderer import render_motion_graphic
    mov_path = render_motion_graphic(
        composition_id="hero_reveal",
        props={"label": "INSIGHT", "headline": "You Are Wrong", "supporting": "Here's why"},
        duration_frames=90,
        fps=30,
        width=1080,
        height=1920,
        output_path="/tmp/mg_001.mov"
    )
"""

import os
import json
import subprocess
import tempfile
import shutil
from typing import Dict, Any, Optional

# Path to the motion-components package (where remotion lives)
_WORKER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_WORKER_DIR))
MOTION_PKG_DIR = os.path.join(_PROJECT_ROOT, "packages", "motion-components")
REMOTION_ROOT = os.path.join(MOTION_PKG_DIR, "src", "remotion", "index.ts")

# Codec map: transparent ProRes for compositing
_CODEC = "prores-4444"  # supports alpha channel

# Allowed composition IDs — must match Root.tsx registrations
ALLOWED_COMPOSITIONS = {
    "hero_reveal",
    "metric_reveal",
    "quote_reveal",
    "step_sequence",
    "before_after",
    "chart_reveal",
    "icon_reveal",
    "code_reveal",
    "stat_card_highlight",
    "browser_walkthrough",
    "vscode_code_typing",
    "kinetic_text",
    "app_screen_upload",
    "app-screen-upload",
    "animated_counter",
    "animated-counter",
    "showdown_duel",
    "showdown-duel",
    "battle_chart",
    "battle-chart",
    # 10 Finance Motion Graphics Pack
    "candlestick_hud",
    "candlestick-hud",
    "compound_growth_curve",
    "compound-growth-curve",
    "portfolio_donut",
    "portfolio-donut",
    "inflation_cash_burn",
    "inflation-cash-burn",
    "banking_notification",
    "banking-notification",
    "budget_waterfall",
    "budget-waterfall",
    "debt_payoff_tracker",
    "debt-payoff-tracker",
    "roi_balance_scale",
    "roi-balance-scale",
    "wealth_flywheel",
    "wealth-flywheel",
    "wall_street_failure_hook",
    "wall-street-failure-hook",
    "compound_formula",
    "compound-formula",
    # Universal Educational & Cognitive Motion Graphics Pack
    "spotlight_cone",
    "spotlight-cone",
    "perception_gauge",
    "perception-gauge",
    "brain_neural_scan",
    "brain-neural-scan",
    "cognitive_dialogue",
    "cognitive-dialogue",
    # Universal Phase 1: Newspaper & Document Highlighter
    "newspaper_highlighter",
    "newspaper-highlighter",
    # Universal Phase 2: Magnifying Glass & Detail Callout
    "magnifying_glass_zoom",
    "magnifying-glass-zoom",
    # Universal Phase 3: Urgency / Risk Dial Gauge
    "urgency_dial_gauge",
    "urgency-dial-gauge",
    # Universal Phase 4: Mind Map & Concept Node Web
    "mind_map_node_web",
    "mind-map-node-web",
    # Universal Phase 5: Timeline Roadmap & Milestone Pathway
    "timeline_roadmap",
    "timeline-roadmap",
    # Universal Phase 6: Hierarchy Pyramid & Foundation Architecture
    "hierarchy_pyramid",
    "hierarchy-pyramid",
    # Universal Phase 7: Tactile Checklist & Decision Matrix
    "tactile_checklist_stamp",
    "tactile-checklist-stamp",
    # Universal Phase 8: Split Slider Comparison & Transformation Wipe
    "split_slider_comparison",
    "split-slider-comparison",
    # 8 Explainer & Educational Motion Graphics Pack
    "venn_diagram",
    "venn-diagram",
    "funnel_analysis",
    "funnel-analysis",
    "horizontal_process_flow",
    "horizontal-process-flow",
    "feature_callout_pointer",
    "feature-callout-pointer",
    "quadrant_matrix",
    "quadrant-matrix",
    "spectrum_continuum",
    "spectrum-continuum",
    "iceberg_model",
    "iceberg-model",
    "pros_cons_comparison",
    "pros-cons-comparison",
    # Cooked Motion Templates
    "cooked_card",
    "cooked_likes",
    "cooked_terminal",
    "cooked_social_post",
    "cooked_chat",
    "cooked_notes",
    "cooked_progress",
    "cooked_toasts",
    "cooked_flow",
    # Creator & Broadcast Pack
    "lower_third",
    "lower-third",
    "subscribe_badge",
    "subscribe-badge",
    "countdown_timer",
    "countdown-timer",
    "review_card",
    "review-card",
    "social_handles",
    "social-handles",
    "animated_kpi",
    "animated-kpi",
    # Vector Shapes Pack
    "shape",
    "shape_element",
    "shape-element",
    "animated_arrow",
    "animated-arrow",
    # Creator, Badge & Utility Pack
    "pop_up_badge",
    "pop-up-badge",
    "badge",
    "notes_checklist",
    "notes-checklist",
    "checklist",
    "social_post",
    "social-post",
    "tweet",
    "progress_bar",
    "progress-bar",
    "completion_progress",
    "completion-progress",
    "timer",
    "countdown",
    "review",
    # Effects Pack
    "effect_overlay",
    "effect-overlay",
}


def render_motion_graphic(
    composition_id: str,
    props: Dict[str, Any],
    duration_frames: int,
    fps: int,
    width: int,
    height: int,
    output_path: str,
    timeout_sec: int = 300,
) -> Optional[str]:
    """
    Renders a Remotion composition to a transparent ProRes MOV.

    Returns the output_path on success, or None on failure.
    """
    comp_kebab = composition_id.replace("_", "-")
    comp_snake = composition_id.replace("-", "_")

    if comp_snake not in ALLOWED_COMPOSITIONS and comp_kebab not in ALLOWED_COMPOSITIONS:
        print(f"[RemotionRenderer] ❌ Unknown composition: '{composition_id}'. Allowed: {ALLOWED_COMPOSITIONS}")
        return None

    if not os.path.isdir(MOTION_PKG_DIR):
        print(f"[RemotionRenderer] ❌ motion-components package not found at: {MOTION_PKG_DIR}")
        return None

    # Write props to a temp JSON file (avoids shell escaping issues)
    render_props = dict(props)
    render_props["durationInFrames"] = int(duration_frames)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(render_props, f)
        props_file = f.name

    output_path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    try:
        cmd = [
            "npx", "remotion", "render",
            REMOTION_ROOT,                   # Entry point
            comp_kebab,                      # Which composition (must be hyphenated for Remotion)
            output_path,                     # Output file
            f"--props={props_file}",          # Props as JSON file
            f"--frames=0-{max(1, duration_frames-1)}",
            f"--fps={fps}",
            f"--width={width}",
            f"--height={height}",
            "--codec=prores",
            "--prores-profile=4444",
            "--pixel-format=yuva444p10le",
            "--log=verbose",
            "--overwrite",
            "--concurrency=2",               # Limit CPU usage
            f"--timeout={timeout_sec * 1000}", # Prevent 30s puppeteer seek timeout
        ]

        print(f"[RemotionRenderer] 🎬 Rendering '{comp_kebab}' ({duration_frames}f @ {fps}fps, {width}x{height})")
        print(f"[RemotionRenderer] Props: {json.dumps(props, indent=2)}")

        cmd_env = dict(os.environ)
        custom_tmp = os.path.join(_PROJECT_ROOT, "media_temp", "tmp")
        os.makedirs(custom_tmp, exist_ok=True)
        cmd_env["TMPDIR"] = custom_tmp
        cmd_env["TEMP"] = custom_tmp
        cmd_env["TMP"] = custom_tmp

        result = subprocess.run(
            cmd,
            cwd=MOTION_PKG_DIR,
            env=cmd_env,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )

        if result.returncode != 0:
            print(f"[RemotionRenderer] ❌ Render failed (exit {result.returncode})")
            print(f"STDERR:\n{result.stderr[-3000:]}")
            print(f"STDOUT:\n{result.stdout[-1000:]}")
            return None

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            print(f"[RemotionRenderer] ❌ Output file missing or empty: {output_path}")
            return None

        size_mb = os.path.getsize(output_path) / 1024 / 1024
        print(f"[RemotionRenderer] ✅ Rendered → {output_path} ({size_mb:.1f} MB)")
        return output_path

    except subprocess.TimeoutExpired:
        print(f"[RemotionRenderer] ❌ Render timed out after {timeout_sec}s")
        return None
    except Exception as e:
        print(f"[RemotionRenderer] ❌ Unexpected error: {e}")
        return None
    finally:
        os.unlink(props_file)


def build_props_from_edit(edit: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts a motion_graphic edit decision dict into Remotion props.
    Maps the motion_graphics_targets keys to the composition's expected props.
    """
    comp_id = edit.get("motion_graphics_type", "hero_reveal")
    targets = edit.get("motion_graphics_targets", {})
    personality = edit.get("personality", "premium")

    # Base props preserving all targets passed in by planner or inspector
    props: Dict[str, Any] = dict(targets) if isinstance(targets, dict) else {}
    props["personality"] = personality

    if comp_id.startswith("cooked_") or comp_id.startswith("cooked-"):
        return props

    # Template-specific prop mapping
    PROP_MAPS = {
        "hero_reveal":        {"label": "label", "headline": "headline", "supporting": "supporting", "colorTheme": "colorTheme", "accentColor": "accentColor"},
        "hero-reveal":        {"label": "label", "headline": "headline", "supporting": "supporting", "colorTheme": "colorTheme", "accentColor": "accentColor"},
        "animated_counter":   {"label": "label", "from": "from", "to": "to", "prefix": "prefix", "suffix": "suffix"},
        "animated-counter":   {"label": "label", "from": "from", "to": "to", "prefix": "prefix", "suffix": "suffix"},
        "metric_reveal":      {"label": "label", "metric": "metric", "delta": "delta"},
        "quote_reveal":       {"quote": "quote", "author": "author"},
        "step_sequence":      {"title": "title", "step1": "step1", "step2": "step2", "step3": "step3", "step4": "step4"},
        "before_after":       {"beforeLabel": "beforeLabel", "before": "before", "afterLabel": "afterLabel", "after": "after"},
        "chart_reveal":       {"title": "title", "dataPoint1": "dataPoint1", "dataPoint2": "dataPoint2", "dataPoint3": "dataPoint3"},
        "icon_reveal":        {"concept": "concept", "label": "label", "sublabel": "sublabel"},
        "code_reveal":        {"code": "code", "language": "language"},
        "stat_card_highlight":{"label": "label", "stat": "stat", "delta": "delta", "context": "context"},
        "browser_walkthrough":{"url": "url", "tabTitle": "tabTitle", "highlightText": "highlightText"},
        "vscode_code_typing": {"title": "title", "activeFile": "activeFile", "code": "code", "language": "language"},
        "kinetic_text":       {"text": "text"},
        "animated_arrow":     {"direction": "direction", "accentColor": "accentColor"},
        "animated-arrow":     {"direction": "direction", "accentColor": "accentColor"},
        "pop_up_badge":       {"text": "text", "label": "label", "accentColor": "accentColor"},
        "pop-up-badge":       {"text": "text", "label": "label", "accentColor": "accentColor"},
        "showdown_duel":      {"title": "title", "wagerAmount": "wagerAmount", "timeframe": "timeframe", "side1Title": "side1Title", "side1Sub": "side1Sub", "side1Fee": "side1Fee", "side2Title": "side2Title", "side2Sub": "side2Sub", "side2Fee": "side2Fee"},
        "showdown-duel":      {"title": "title", "wagerAmount": "wagerAmount", "timeframe": "timeframe", "side1Title": "side1Title", "side1Sub": "side1Sub", "side1Fee": "side1Fee", "side2Title": "side2Title", "side2Sub": "side2Sub", "side2Fee": "side2Fee"},
        "battle_chart":       {"title": "title", "subtitle": "subtitle", "sp500Label": "sp500Label", "sp500Return": "sp500Return", "hedgeLabel": "hedgeLabel", "hedgeReturn": "hedgeReturn", "deltaLabel": "deltaLabel", "side1Sub": "side1Sub", "side1FooterLabel": "side1FooterLabel", "side1FooterVal": "side1FooterVal", "side2Sub": "side2Sub", "side2FooterLabel": "side2FooterLabel", "side2FooterVal": "side2FooterVal", "deltaSub": "deltaSub"},
        "battle-chart":       {"title": "title", "subtitle": "subtitle", "sp500Label": "sp500Label", "sp500Return": "sp500Return", "hedgeLabel": "hedgeLabel", "hedgeReturn": "hedgeReturn", "deltaLabel": "deltaLabel", "side1Sub": "side1Sub", "side1FooterLabel": "side1FooterLabel", "side1FooterVal": "side1FooterVal", "side2Sub": "side2Sub", "side2FooterLabel": "side2FooterLabel", "side2FooterVal": "side2FooterVal", "deltaSub": "deltaSub"},
        "compound_formula":   {"title": "title", "autoAmount": "autoAmount", "compoundTotal": "compoundTotal", "step1Title": "step1Title", "step1Sub": "step1Sub", "step1Badge": "step1Badge", "step1Icon": "step1Icon", "step2Title": "step2Title", "step2Sub": "step2Sub", "step2Badge": "step2Badge", "step2Icon": "step2Icon", "step3Title": "step3Title", "step3Sub": "step3Sub", "step3Prefix": "step3Prefix", "step3Suffix": "step3Suffix", "step3Icon": "step3Icon", "bottomBanner": "bottomBanner", "bannerIcon": "bannerIcon"},
        "compound-formula":   {"title": "title", "autoAmount": "autoAmount", "compoundTotal": "compoundTotal", "step1Title": "step1Title", "step1Sub": "step1Sub", "step1Badge": "step1Badge", "step1Icon": "step1Icon", "step2Title": "step2Title", "step2Sub": "step2Sub", "step2Badge": "step2Badge", "step2Icon": "step2Icon", "step3Title": "step3Title", "step3Sub": "step3Sub", "step3Prefix": "step3Prefix", "step3Suffix": "step3Suffix", "step3Icon": "step3Icon", "bottomBanner": "bottomBanner", "bannerIcon": "bannerIcon"},
        "wall_street_failure_hook": {"headline": "headline", "badge": "badge", "source": "source", "failureRate": "failureRate", "label": "label", "failLabel": "failLabel", "passLabel": "passLabel", "bottomStamp": "bottomStamp", "stampEmoji": "stampEmoji"},
        "wall-street-failure-hook": {"headline": "headline", "badge": "badge", "source": "source", "failureRate": "failureRate", "label": "label", "failLabel": "failLabel", "passLabel": "passLabel", "bottomStamp": "bottomStamp", "stampEmoji": "stampEmoji"},
        # Universal Educational & Cognitive Pack
        "spotlight_cone":     {"headline": "headline", "subtext": "subtext", "badge": "badge", "egoPercent": "egoPercent", "tagline": "tagline"},
        "spotlight-cone":     {"headline": "headline", "subtext": "subtext", "badge": "badge", "egoPercent": "egoPercent", "tagline": "tagline"},
        "perception_gauge":   {"title": "title", "badge": "badge", "perceivedLabel": "perceivedLabel", "perceivedValue": "perceivedValue", "perceivedSub": "perceivedSub", "actualLabel": "actualLabel", "actualValue": "actualValue", "actualSub": "actualSub", "deltaLabel": "deltaLabel", "deltaSub": "deltaSub"},
        "perception-gauge":   {"title": "title", "badge": "badge", "perceivedLabel": "perceivedLabel", "perceivedValue": "perceivedValue", "perceivedSub": "perceivedSub", "actualLabel": "actualLabel", "actualValue": "actualValue", "actualSub": "actualSub", "deltaLabel": "deltaLabel", "deltaSub": "deltaSub"},
        "brain_neural_scan":  {"title": "title", "badge": "badge", "cortexTitle": "cortexTitle", "cortexSub": "cortexSub", "amygdalaTitle": "amygdalaTitle", "amygdalaSub": "amygdalaSub", "verdictBadge": "verdictBadge", "verdictSub": "verdictSub"},
        "brain-neural-scan":  {"title": "title", "badge": "badge", "cortexTitle": "cortexTitle", "cortexSub": "cortexSub", "amygdalaTitle": "amygdalaTitle", "amygdalaSub": "amygdalaSub", "verdictBadge": "verdictBadge", "verdictSub": "verdictSub"},
        "cognitive_dialogue": {"title": "title", "badge": "badge", "firstPersonText": "firstPersonText", "firstPersonLabel": "firstPersonLabel", "thirdPersonText": "thirdPersonText", "thirdPersonLabel": "thirdPersonLabel", "bottomCallout": "bottomCallout"},
        "cognitive-dialogue": {"title": "title", "badge": "badge", "firstPersonText": "firstPersonText", "firstPersonLabel": "firstPersonLabel", "thirdPersonText": "thirdPersonText", "thirdPersonLabel": "thirdPersonLabel", "bottomCallout": "bottomCallout"},
        # Universal Phase 1: Newspaper & Document Highlighter
        "newspaper_highlighter": {"outlet": "outlet", "date": "date", "headline": "headline", "bodyText": "bodyText", "highlightText": "highlightText", "markerColor": "markerColor", "stamp": "stamp"},
        "newspaper-highlighter": {"outlet": "outlet", "date": "date", "headline": "headline", "bodyText": "bodyText", "highlightText": "highlightText", "markerColor": "markerColor", "stamp": "stamp"},
        # Universal Phase 2: Magnifying Glass & Detail Callout
        "magnifying_glass_zoom": {"backgroundSnippet": "backgroundSnippet", "zoomTarget": "zoomTarget", "calloutTitle": "calloutTitle", "calloutDetail": "calloutDetail", "calloutBadge": "calloutBadge"},
        "magnifying-glass-zoom": {"backgroundSnippet": "backgroundSnippet", "zoomTarget": "zoomTarget", "calloutTitle": "calloutTitle", "calloutDetail": "calloutDetail", "calloutBadge": "calloutBadge"},
        # Universal Phase 3: Urgency / Risk Dial Gauge
        "urgency_dial_gauge": {"title": "title", "badge": "badge", "value": "value", "unit": "unit", "zoneLabel": "zoneLabel", "subtext": "subtext"},
        "urgency-dial-gauge": {"title": "title", "badge": "badge", "value": "value", "unit": "unit", "zoneLabel": "zoneLabel", "subtext": "subtext"},
        # Universal Phase 4: Mind Map & Concept Node Web
        "mind_map_node_web": {"title": "title", "badge": "badge", "centerTitle": "centerTitle", "centerIcon": "centerIcon", "node1Title": "node1Title", "node1Desc": "node1Desc", "node1Icon": "node1Icon", "node2Title": "node2Title", "node2Desc": "node2Desc", "node2Icon": "node2Icon", "node3Title": "node3Title", "node3Desc": "node3Desc", "node3Icon": "node3Icon"},
        "mind-map-node-web": {"title": "title", "badge": "badge", "centerTitle": "centerTitle", "centerIcon": "centerIcon", "node1Title": "node1Title", "node1Desc": "node1Desc", "node1Icon": "node1Icon", "node2Title": "node2Title", "node2Desc": "node2Desc", "node2Icon": "node2Icon", "node3Title": "node3Title", "node3Desc": "node3Desc", "node3Icon": "node3Icon"},
        # Universal Phase 5: Timeline Roadmap & Milestone Pathway
        "timeline_roadmap": {"title": "title", "badge": "badge", "step1Title": "step1Title", "step1Date": "step1Date", "step1Desc": "step1Desc", "step2Title": "step2Title", "step2Date": "step2Date", "step2Desc": "step2Desc", "step3Title": "step3Title", "step3Date": "step3Date", "step3Desc": "step3Desc"},
        "timeline-roadmap": {"title": "title", "badge": "badge", "step1Title": "step1Title", "step1Date": "step1Date", "step1Desc": "step1Desc", "step2Title": "step2Title", "step2Date": "step2Date", "step2Desc": "step2Desc", "step3Title": "step3Title", "step3Date": "step3Date", "step3Desc": "step3Desc"},
        # Universal Phase 6: Hierarchy Pyramid & Foundation Architecture
        "hierarchy_pyramid": {"title": "title", "badge": "badge", "tier1Title": "tier1Title", "tier1Desc": "tier1Desc", "tier2Title": "tier2Title", "tier2Desc": "tier2Desc", "tier3Title": "tier3Title", "tier3Desc": "tier3Desc"},
        "hierarchy-pyramid": {"title": "title", "badge": "badge", "tier1Title": "tier1Title", "tier1Desc": "tier1Desc", "tier2Title": "tier2Title", "tier2Desc": "tier2Desc", "tier3Title": "tier3Title", "tier3Desc": "tier3Desc"},
        # Universal Phase 7: Tactile Checklist & Decision Matrix
        "tactile_checklist_stamp": {"title": "title", "badge": "badge", "item1Text": "item1Text", "item1Status": "item1Status", "item2Text": "item2Text", "item2Status": "item2Status", "item3Text": "item3Text", "item3Status": "item3Status", "verdictText": "verdictText", "verdictStatus": "verdictStatus", "synthesis": "synthesis"},
        "tactile-checklist-stamp": {"title": "title", "badge": "badge", "item1Text": "item1Text", "item1Status": "item1Status", "item2Text": "item2Text", "item2Status": "item2Status", "item3Text": "item3Text", "item3Status": "item3Status", "verdictText": "verdictText", "verdictStatus": "verdictStatus", "synthesis": "synthesis"},
        # Universal Phase 8: Split Slider Comparison & Transformation Wipe
        "split_slider_comparison": {"title": "title", "badge": "badge", "leftTag": "leftTag", "leftTitle": "leftTitle", "leftMetric": "leftMetric", "leftDetail": "leftDetail", "leftIcon": "leftIcon", "rightTag": "rightTag", "rightTitle": "rightTitle", "rightMetric": "rightMetric", "rightDetail": "rightDetail", "rightIcon": "rightIcon", "sliderStart": "sliderStart", "sliderEnd": "sliderEnd", "synthesis": "synthesis"},
        "split-slider-comparison": {"title": "title", "badge": "badge", "leftTag": "leftTag", "leftTitle": "leftTitle", "leftMetric": "leftMetric", "leftDetail": "leftDetail", "leftIcon": "leftIcon", "rightTag": "rightTag", "rightTitle": "rightTitle", "rightMetric": "rightMetric", "rightDetail": "rightDetail", "rightIcon": "rightIcon", "sliderStart": "sliderStart", "sliderEnd": "sliderEnd", "synthesis": "synthesis"},
        # Finance Motion Graphics Pack
        "candlestick_hud": {"ticker": "ticker", "currentPrice": "currentPrice", "openPrice": "openPrice", "highPrice": "highPrice", "lowPrice": "lowPrice", "changePercent": "changePercent", "title": "title", "volume": "volume"},
        "candlestick-hud": {"ticker": "ticker", "currentPrice": "currentPrice", "openPrice": "openPrice", "highPrice": "highPrice", "lowPrice": "lowPrice", "changePercent": "changePercent", "title": "title", "volume": "volume"},
        "compound_growth_curve": {"initialDeposit": "initialDeposit", "monthlyContribution": "monthlyContribution", "annualReturnRate": "annualReturnRate", "years": "years", "title": "title", "currency": "currency"},
        "compound-growth-curve": {"initialDeposit": "initialDeposit", "monthlyContribution": "monthlyContribution", "annualReturnRate": "annualReturnRate", "years": "years", "title": "title", "currency": "currency"},
        "portfolio_donut": {"title": "title", "slices": "slices", "totalValue": "totalValue", "currency": "currency"},
        "portfolio-donut": {"title": "title", "slices": "slices", "totalValue": "totalValue", "currency": "currency"},
        "inflation_cash_burn": {"initialAmount": "initialAmount", "inflationRate": "inflationRate", "years": "years", "title": "title", "currency": "currency", "purchasingPowerLoss": "purchasingPowerLoss"},
        "inflation-cash-burn": {"initialAmount": "initialAmount", "inflationRate": "inflationRate", "years": "years", "title": "title", "currency": "currency", "purchasingPowerLoss": "purchasingPowerLoss"},
        "banking_notification": {"bankName": "bankName", "amount": "amount", "senderName": "senderName", "accountMask": "accountMask", "notificationType": "notificationType", "title": "title"},
        "banking-notification": {"bankName": "bankName", "amount": "amount", "senderName": "senderName", "accountMask": "accountMask", "notificationType": "notificationType", "title": "title"},
        "budget_waterfall": {"income": "income", "categories": "categories", "savings": "savings", "title": "title", "currency": "currency"},
        "budget-waterfall": {"income": "income", "categories": "categories", "savings": "savings", "title": "title", "currency": "currency"},
        "debt_payoff_tracker": {"initialDebt": "initialDebt", "currentBalance": "currentBalance", "paidAmount": "paidAmount", "interestRate": "interestRate", "title": "title", "debtName": "debtName"},
        "debt-payoff-tracker": {"initialDebt": "initialDebt", "currentBalance": "currentBalance", "paidAmount": "paidAmount", "interestRate": "interestRate", "title": "title", "debtName": "debtName"},
        "roi_balance_scale": {"cost": "cost", "returns": "returns", "costLabel": "costLabel", "returnLabel": "returnLabel", "roiMultiple": "roiMultiple", "title": "title"},
        "roi-balance-scale": {"cost": "cost", "returns": "returns", "costLabel": "costLabel", "returnLabel": "returnLabel", "roiMultiple": "roiMultiple", "title": "title"},
        "wealth_flywheel": {"stages": "stages", "activeStage": "activeStage", "title": "title", "centerLabel": "centerLabel"},
        "wealth-flywheel": {"stages": "stages", "activeStage": "activeStage", "title": "title", "centerLabel": "centerLabel"},
        # 8 Explainer & Educational Motion Graphics Pack
        "venn_diagram": {"title": "title", "subtitle": "subtitle", "circle1Label": "circle1Label", "circle1Sub": "circle1Sub", "circle2Label": "circle2Label", "circle2Sub": "circle2Sub", "circle3Label": "circle3Label", "circle3Sub": "circle3Sub", "centerLabel": "centerLabel", "centerSub": "centerSub", "accentColor": "accentColor"},
        "venn-diagram": {"title": "title", "subtitle": "subtitle", "circle1Label": "circle1Label", "circle1Sub": "circle1Sub", "circle2Label": "circle2Label", "circle2Sub": "circle2Sub", "circle3Label": "circle3Label", "circle3Sub": "circle3Sub", "centerLabel": "centerLabel", "centerSub": "centerSub", "accentColor": "accentColor"},
        "funnel_analysis": {"title": "title", "subtitle": "subtitle", "dropoffNote": "dropoffNote", "stages": "stages"},
        "funnel-analysis": {"title": "title", "subtitle": "subtitle", "dropoffNote": "dropoffNote", "stages": "stages"},
        "horizontal_process_flow": {"title": "title", "subtitle": "subtitle", "activeStep": "activeStep", "steps": "steps"},
        "horizontal-process-flow": {"title": "title", "subtitle": "subtitle", "activeStep": "activeStep", "steps": "steps"},
        "feature_callout_pointer": {"headline": "headline", "category": "category", "detailText": "detailText", "specTag": "specTag", "pointerX": "pointerX", "pointerY": "pointerY", "cardX": "cardX", "cardY": "cardY", "accentColor": "accentColor"},
        "feature-callout-pointer": {"headline": "headline", "category": "category", "detailText": "detailText", "specTag": "specTag", "pointerX": "pointerX", "pointerY": "pointerY", "cardX": "cardX", "cardY": "cardY", "accentColor": "accentColor"},
        "quadrant_matrix": {"title": "title", "subtitle": "subtitle", "xAxisLabel": "xAxisLabel", "yAxisLabel": "yAxisLabel", "q1Title": "q1Title", "q1Desc": "q1Desc", "q2Title": "q2Title", "q2Desc": "q2Desc", "q3Title": "q3Title", "q3Desc": "q3Desc", "q4Title": "q4Title", "q4Desc": "q4Desc", "activeQuadrant": "activeQuadrant"},
        "quadrant-matrix": {"title": "title", "subtitle": "subtitle", "xAxisLabel": "xAxisLabel", "yAxisLabel": "yAxisLabel", "q1Title": "q1Title", "q1Desc": "q1Desc", "q2Title": "q2Title", "q2Desc": "q2Desc", "q3Title": "q3Title", "q3Desc": "q3Desc", "q4Title": "q4Title", "q4Desc": "q4Desc", "activeQuadrant": "activeQuadrant"},
        "spectrum_continuum": {"title": "title", "subtitle": "subtitle", "leftLabel": "leftLabel", "leftSub": "leftSub", "rightLabel": "rightLabel", "rightSub": "rightSub", "currentValue": "currentValue", "markerTitle": "markerTitle", "markerDesc": "markerDesc", "accentColor": "accentColor"},
        "spectrum-continuum": {"title": "title", "subtitle": "subtitle", "leftLabel": "leftLabel", "leftSub": "leftSub", "rightLabel": "rightLabel", "rightSub": "rightSub", "currentValue": "currentValue", "markerTitle": "markerTitle", "markerDesc": "markerDesc", "accentColor": "accentColor"},
        "iceberg_model": {"title": "title", "subtitle": "subtitle", "surfaceTitle": "surfaceTitle", "surfaceItems": "surfaceItems", "underwaterTitle": "underwaterTitle", "underwaterItems": "underwaterItems"},
        "iceberg-model": {"title": "title", "subtitle": "subtitle", "surfaceTitle": "surfaceTitle", "surfaceItems": "surfaceItems", "underwaterTitle": "underwaterTitle", "underwaterItems": "underwaterItems"},
        "pros_cons_comparison": {"title": "title", "subtitle": "subtitle", "prosTitle": "prosTitle", "prosList": "prosList", "consTitle": "consTitle", "consList": "consList", "verdictBadge": "verdictBadge"},
        "pros-cons-comparison": {"title": "title", "subtitle": "subtitle", "prosTitle": "prosTitle", "prosList": "prosList", "consTitle": "consTitle", "consList": "consList", "verdictBadge": "verdictBadge"},
    }

    prop_map = PROP_MAPS.get(comp_id, {})

    for remotion_key, target_key in prop_map.items():
        value = targets.get(target_key) if target_key in targets else targets.get(remotion_key)
        if value is not None:
            props[remotion_key] = value

    return props


def render_remotion_canvas(
    comp_id: str,
    props: Dict[str, Any],
    duration_sec: float,
    fps: float,
    width: int,
    height: int,
    out_path: str,
) -> Optional[str]:
    """
    Direct drop-in for compositor.py's _render_canvas_composition.
    """
    clean_id = (comp_id or "hero_reveal").lower().replace("-", "_")
    if clean_id in ("motiongraphicspreview", "preview", "kinetictext"):
        clean_id = "kinetic_text"
    elif clean_id == "media_reveal":
        clean_id = "hero_reveal"

    targets = props.get("targets", props)
    personality = props.get("personality") or props.get("motion_graphics_personality") or "premium"

    final_props = build_props_from_edit({
        "motion_graphics_type": clean_id,
        "motion_graphics_targets": targets,
        "personality": personality,
    })

    # If targets had raw text and no headline/quote was resolved, provide it as fallback
    if "text" in targets and not any(k in final_props for k in ("headline", "quote", "text")):
        if clean_id in ("hero_reveal", "browser_walkthrough"):
            final_props["headline"] = str(targets["text"])
        elif clean_id == "quote_reveal":
            final_props["quote"] = str(targets["text"])
        else:
            final_props["text"] = str(targets["text"])

    frames = max(1, int(duration_sec * fps))
    return render_motion_graphic(
        composition_id=clean_id,
        props=final_props,
        duration_frames=frames,
        fps=int(fps),
        width=width,
        height=height,
        output_path=out_path,
    )

