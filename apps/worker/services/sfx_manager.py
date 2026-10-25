import os
import shutil
import requests
import random
import subprocess
from typing import List, Dict, Any, Optional

SFX_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sfx", "clips"))
FREESOUND_API_KEY = os.environ.get("FREESOUND_API_KEY")

LOCAL_SFX_MAP = {
    "whoosh": "whoosh-soft.mp3",
    "swoosh": "whoosh-soft.mp3",
    "transition": "whoosh-soft.mp3",
    "wind": "whoosh-wind.mp3",
    "pop": "pop-reveal.mp3",
    "reveal": "pop-reveal.mp3",
    "ding": "chime-reward.mp3",
    "chime": "chime-reward.mp3",
    "reward": "chime-reward.mp3",
    "click": "ui-click-soft.mp3",
    "tap": "ui-click-soft.mp3",
    "toggle": "ui-toggle-on.mp3",
    "send": "ui-send.mp3",
    "typing": "keys-typing-soft.mp3",
    "riser": "riser-soft.mp3",
    "zoom": "riser-soft.mp3",
    "impact": "impact-soft.mp3",
    "thump": "launch-thump.mp3",
    "glitch": "glitch-zap.mp3",
    "sparkle": "sparkle-soft.mp3",
    "shimmer": "warm-shimmer.mp3",
    "camera": "camera-shutter.mp3",
    "cash": "chime-reward.mp3",
    "register": "chime-reward.mp3",
    "coin": "chime-reward.mp3",
    "coins": "chime-reward.mp3",
    "money": "chime-reward.mp3",
    "stamp": "impact-soft.mp3",
    "scale": "ui-click-soft.mp3",
    "clink": "ui-click-soft.mp3",
    "fire": "whoosh-soft.mp3",
    "sizzle": "whoosh-soft.mp3",
    "burn": "whoosh-soft.mp3",
    "bgm": "chill-bgm.mp3",
    "chill": "chill-bgm.mp3",
    "music": "chill-bgm.mp3",
}


def fetch_sfx(keyword: str, output_path: str) -> bool:
    """
    Retrieves sound effects for video transitions and motion graphics.
    First checks the local curated library (apps/worker/data/sfx/clips).
    Falls back to Freesound API with high-rating filters if needed.
    """
    kw_clean = (keyword or "pop").lower().strip()

    # 1. Check local curated library
    matched_clip = None
    for token, clip_name in LOCAL_SFX_MAP.items():
        if token in kw_clean:
            candidate = os.path.join(SFX_DIR, clip_name)
            if os.path.exists(candidate):
                matched_clip = candidate
                break

    if not matched_clip and os.path.isdir(SFX_DIR):
        direct_candidate = os.path.join(SFX_DIR, f"{kw_clean}.mp3")
        if os.path.exists(direct_candidate):
            matched_clip = direct_candidate

    if matched_clip:
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            shutil.copyfile(matched_clip, output_path)
            print(f"  [SFX_MANAGER] Used curated local SFX '{os.path.basename(matched_clip)}' for '{keyword}'")
            return True
        except Exception as e:
            print(f"  [SFX_MANAGER] Local copy failed: {e}")

    # 2. Procedural synthesis fallback (100% reliable, zero external dependencies)
    try:
        from services.audio_sfx_synthesizer import synthesize_cue
        synthesize_cue(kw_clean, output_path)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"  [SFX_MANAGER] Synthesized procedural SFX for '{keyword}' -> {output_path}")
            return True
    except Exception as e:
        print(f"  [SFX_MANAGER] Procedural SFX synthesis failed: {e}")

    # 3. Fallback to Freesound API if key is set

    search_url = "https://freesound.org/apiv2/search/text/"
    params = {
        "query": f"{keyword} sound effect",
        "token": FREESOUND_API_KEY,
        "filter": "duration:[0.2 TO 2.0]",
        "sort": "rating_desc",
        "fields": "id,name,previews",
        "page_size": 5,
    }

    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])
        if not results:
            print(f"  [SFX_MANAGER] No SFX found for '{keyword}' on Freesound.")
            return False

        result = results[0]  # Take highest-rated
        preview_url = result.get("previews", {}).get("preview-hq-mp3") or result.get("previews", {}).get("preview-lq-mp3")
        if not preview_url:
            return False

        print(f"  [SFX_MANAGER] Downloading SFX '{result['name']}' from Freesound...")
        audio_resp = requests.get(preview_url, timeout=10)
        audio_resp.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio_resp.content)

        return True

    except Exception as e:
        print(f"  [SFX_MANAGER] Failed to fetch SFX '{keyword}': {e}")
        return False


def generate_cinematic_sfx_track(
    edits: List[Any],
    total_duration: float,
    output_wav: str,
    base_volume: float = 0.35,
) -> str:
    """
    Assembles a full-length, synchronized multi-track SFX audio file
    matching visual events (motion graphic entries, metric reveals,
    terminal typing, transitions, and graphic exits).
    Calibrated to sit comfortably below speech (-6 dB to -10 dB).
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_wav)), exist_ok=True)
    events: List[Dict[str, Any]] = []

    for edit in edits:
        if isinstance(edit, dict):
            action = edit.get("action", "")
            start = float(edit.get("start", 0.0) or 0.0)
            end = float(edit.get("end", start + 3.0) or (start + 3.0))
            mg_type = edit.get("motion_graphics_type", "")
            sound_effect = edit.get("sound_effect", "")
        else:
            action = getattr(edit, "action", "")
            start = float(getattr(edit, "start", 0.0) or 0.0)
            end = float(getattr(edit, "end", start + 3.0) or (start + 3.0))
            mg_type = getattr(edit, "motion_graphics_type", "")
            sound_effect = getattr(edit, "sound_effect", "")

        if action in ("motion_graphics", "motion_graphic"):
            # 1. Entrance swoosh
            whoosh_clip = os.path.join(SFX_DIR, "whoosh-soft.mp3")
            if os.path.exists(whoosh_clip):
                events.append({
                    "file": whoosh_clip,
                    "delay_ms": max(0, int(round((start + 0.05) * 1000))),
                    "volume": base_volume,
                })

            # 2. Contextual internal cue
            if mg_type in ("metric_reveal", "stat_card_highlight"):
                impact_clip = os.path.join(SFX_DIR, "impact-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 0.40) * 1000))),
                        "volume": min(1.0, base_volume * 1.15),
                    })
            elif mg_type in ("cooked_terminal", "vscode_code_typing"):
                typing_clip = os.path.join(SFX_DIR, "keys-typing-soft.mp3")
                if os.path.exists(typing_clip):
                    events.append({
                        "file": typing_clip,
                        "delay_ms": max(0, int(round((start + 0.35) * 1000))),
                        "volume": base_volume * 0.85,
                    })
            elif mg_type in ("hero_reveal", "quote_reveal", "todo_list"):
                typing_clip = os.path.join(SFX_DIR, "keys-typing-soft.mp3")
                if os.path.exists(typing_clip):
                    events.append({
                        "file": typing_clip,
                        "delay_ms": max(0, int(round((start + 0.25) * 1000))),
                        "volume": min(1.0, base_volume * 1.05),
                    })
            elif mg_type in ("architecture_pipeline", "architecture-pipeline"):
                scan_clip = os.path.join(SFX_DIR, "scan-hum.mp3")
                if os.path.exists(scan_clip):
                    events.append({
                        "file": scan_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.75,
                    })
                tick_clip = os.path.join(SFX_DIR, "clock-tick-soft.mp3")
                if os.path.exists(tick_clip):
                    events.append({
                        "file": tick_clip,
                        "delay_ms": max(0, int(round((start + 0.60) * 1000))),
                        "volume": base_volume * 0.85,
                    })
            elif mg_type in ("causal_loop", "causal-loop"):
                riser_clip = os.path.join(SFX_DIR, "riser-soft.mp3")
                if os.path.exists(riser_clip):
                    events.append({
                        "file": riser_clip,
                        "delay_ms": max(0, int(round((start + 0.10) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                impact_clip = os.path.join(SFX_DIR, "impact-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 0.40) * 1000))),
                        "volume": base_volume * 0.90,
                    })
            elif mg_type in ("exploded_layer_stack", "exploded-layer-stack"):
                whoosh_clip = os.path.join(SFX_DIR, "whoosh-reverse.mp3")
                if os.path.exists(whoosh_clip):
                    events.append({
                        "file": whoosh_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                knock_clip = os.path.join(SFX_DIR, "knock-solid.mp3")
                if os.path.exists(knock_clip):
                    events.append({
                        "file": knock_clip,
                        "delay_ms": max(0, int(round((start + 0.65) * 1000))),
                        "volume": base_volume * 0.90,
                    })
                pop_clip = os.path.join(SFX_DIR, "pop-reveal.mp3")
                if os.path.exists(pop_clip):
                    events.append({
                        "file": pop_clip,
                        "delay_ms": max(0, int(round((start + 1.10) * 1000))),
                        "volume": base_volume * 0.80,
                    })
            elif mg_type in ("bottleneck_constriction", "bottleneck-constriction"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.10) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                zap_clip = os.path.join(SFX_DIR, "zap-electric.mp3")
                if os.path.exists(zap_clip):
                    events.append({
                        "file": zap_clip,
                        "delay_ms": max(0, int(round((start + 0.55) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                impact_clip = os.path.join(SFX_DIR, "impact-deep-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 0.95) * 1000))),
                        "volume": base_volume * 0.90,
                    })
            elif mg_type in ("trilemma_tradeoff", "trilemma-tradeoff"):
                click_clip = os.path.join(SFX_DIR, "ui-click-soft.mp3")
                if os.path.exists(click_clip):
                    events.append({
                        "file": click_clip,
                        "delay_ms": max(0, int(round((start + 0.20) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                zap_clip = os.path.join(SFX_DIR, "glitch-zap.mp3")
                if os.path.exists(zap_clip):
                    events.append({
                        "file": zap_clip,
                        "delay_ms": max(0, int(round((start + 0.70) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                stamp_clip = os.path.join(SFX_DIR, "stamp-hit.mp3")
                if os.path.exists(stamp_clip):
                    events.append({
                        "file": stamp_clip,
                        "delay_ms": max(0, int(round((start + 1.40) * 1000))),
                        "volume": base_volume * 0.90,
                    })
            elif mg_type in ("scale_zoom_ladder", "scale-zoom-ladder"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                click_clip = os.path.join(SFX_DIR, "ui-click-soft.mp3")
                if os.path.exists(click_clip):
                    events.append({
                        "file": click_clip,
                        "delay_ms": max(0, int(round((start + 0.80) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                impact_clip = os.path.join(SFX_DIR, "impact-deep-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 1.50) * 1000))),
                        "volume": base_volume * 0.95,
                    })
            elif mg_type in ("decision_tree_fork", "decision-tree-fork"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                zap_clip = os.path.join(SFX_DIR, "glitch-zap.mp3")
                if os.path.exists(zap_clip):
                    events.append({
                        "file": zap_clip,
                        "delay_ms": max(0, int(round((start + 0.65) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                impact_clip = os.path.join(SFX_DIR, "impact-deep-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 1.20) * 1000))),
                        "volume": base_volume * 0.90,
                    })
            elif mg_type in ("radar_spider_chart", "radar-spider-chart"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                ping_clip = os.path.join(SFX_DIR, "chime-reward.mp3")
                if os.path.exists(ping_clip):
                    events.append({
                        "file": ping_clip,
                        "delay_ms": max(0, int(round((start + 0.60) * 1000))),
                        "volume": base_volume * 0.75,
                    })
                click_clip = os.path.join(SFX_DIR, "ui-click-soft.mp3")
                if os.path.exists(click_clip):
                    events.append({
                        "file": click_clip,
                        "delay_ms": max(0, int(round((start + 1.10) * 1000))),
                        "volume": base_volume * 0.80,
                    })
            elif mg_type in ("pareto_power_law", "pareto-power-law"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                laser_clip = os.path.join(SFX_DIR, "glitch-zap.mp3")
                if os.path.exists(laser_clip):
                    events.append({
                        "file": laser_clip,
                        "delay_ms": max(0, int(round((start + 0.70) * 1000))),
                        "volume": base_volume * 0.75,
                    })
                impact_clip = os.path.join(SFX_DIR, "impact-deep-soft.mp3")
                if os.path.exists(impact_clip):
                    events.append({
                        "file": impact_clip,
                        "delay_ms": max(0, int(round((start + 1.25) * 1000))),
                        "volume": base_volume * 0.90,
                    })
            elif mg_type in ("chrono_dial_clock", "chrono-dial-clock"):
                wind_clip = os.path.join(SFX_DIR, "whoosh-wind.mp3")
                if os.path.exists(wind_clip):
                    events.append({
                        "file": wind_clip,
                        "delay_ms": max(0, int(round((start + 0.15) * 1000))),
                        "volume": base_volume * 0.85,
                    })
                tick_clip = os.path.join(SFX_DIR, "clock-tick-soft.mp3")
                if os.path.exists(tick_clip):
                    events.append({
                        "file": tick_clip,
                        "delay_ms": max(0, int(round((start + 0.65) * 1000))),
                        "volume": base_volume * 0.75,
                    })
                    events.append({
                        "file": tick_clip,
                        "delay_ms": max(0, int(round((start + 1.05) * 1000))),
                        "volume": base_volume * 0.80,
                    })
                chime_clip = os.path.join(SFX_DIR, "chime-reward.mp3")
                if os.path.exists(chime_clip):
                    events.append({
                        "file": chime_clip,
                        "delay_ms": max(0, int(round((start + 1.40) * 1000))),
                        "volume": base_volume * 0.85,
                    })
            elif mg_type == "tactile_checklist_stamp":
                stamp_clip = os.path.join(SFX_DIR, "stamp-hit.mp3")
                if os.path.exists(stamp_clip):
                    events.append({
                        "file": stamp_clip,
                        "delay_ms": max(0, int(round((start + 0.50) * 1000))),
                        "volume": base_volume,
                    })
            elif mg_type == "split_slider_comparison":
                toggle_clip = os.path.join(SFX_DIR, "ui-toggle-on.mp3")
                if os.path.exists(toggle_clip):
                    events.append({
                        "file": toggle_clip,
                        "delay_ms": max(0, int(round((start + 0.45) * 1000))),
                        "volume": base_volume,
                    })

            # 3. Exit whoosh
            exit_whoosh = os.path.join(SFX_DIR, "whoosh-reverse.mp3")
            if os.path.exists(exit_whoosh) and (end - 0.25) > start:
                events.append({
                    "file": exit_whoosh,
                    "delay_ms": max(0, int(round((end - 0.25) * 1000))),
                    "volume": base_volume * 0.75,
                })

        elif action == "transition":
            riser_clip = os.path.join(SFX_DIR, "riser-soft.mp3")
            if os.path.exists(riser_clip) and start >= 0.5:
                events.append({
                    "file": riser_clip,
                    "delay_ms": max(0, int(round((start - 0.5) * 1000))),
                    "volume": base_volume * 0.75,
                })

        elif action == "sfx" and sound_effect:
            direct = os.path.join(SFX_DIR, f"{sound_effect}.mp3")
            alt = os.path.join(SFX_DIR, LOCAL_SFX_MAP.get(sound_effect, "pop-reveal.mp3"))
            chosen_clip = direct if os.path.exists(direct) else (alt if os.path.exists(alt) else None)
            if chosen_clip:
                events.append({
                    "file": chosen_clip,
                    "delay_ms": max(0, int(round(start * 1000))),
                    "volume": base_volume,
                })

    if not events:
        subprocess.run([
            "ffmpeg", "-y", "-threads", "2",
            "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={total_duration:.3f}",
            "-c:a", "pcm_s16le",
            output_wav
        ], capture_output=True, check=True)
        return output_wav

    inputs: List[str] = []
    filter_chains: List[str] = []
    for idx, ev in enumerate(events):
        inputs.extend(["-i", ev["file"]])
        filter_chains.append(
            f"[{idx}:a]volume={ev['volume']:.2f},adelay={ev['delay_ms']}|{ev['delay_ms']}[a_{idx}]"
        )

    mix_inputs = "".join(f"[a_{i}]" for i in range(len(events)))
    filter_chains.append(
        f"{mix_inputs}amix=inputs={len(events)}:normalize=0,atrim=0:{total_duration:.3f},apad=whole_dur={total_duration:.3f}[a_sfx_out]"
    )
    filter_str = ";\n".join(filter_chains)

    cmd = [
        "ffmpeg", "-y", "-threads", "2",
        *inputs,
        "-filter_complex", filter_str,
        "-map", "[a_sfx_out]",
        "-c:a", "pcm_s16le",
        "-t", f"{total_duration:.3f}",
        output_wav
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"  [SFX_MANAGER] Assembled multi-track cinematic SFX ({len(events)} synchronized sound cues) -> {output_wav}")
    return output_wav

