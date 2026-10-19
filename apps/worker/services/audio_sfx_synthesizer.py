"""
Procedural Audio SFX Synthesizer
Synthesizes 100% royalty-free sound cues on the fly using FFmpeg audio filtergraphs.
Calibrates output volume automatically to land safely below spoken dialog (-4 dB to -6 dB).
Deterministic, zero external assets, and zero licensing liabilities.
"""

import array
import json
import math
import os
import subprocess
import wave
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

SR = 48000
SPEECH_GATE_DB = -45  # A 50ms window louder than this counts as speech
MIN_S = 0.3           # Shorter files are padded with silence to prevent player clipping

# Sound cue definitions: (ffmpeg filtergraph with [out], offset_db relative to speech)
SFX_PRESETS = {
    # Card / motion graphic enters: filtered pink noise sweeping down
    "whoosh-in": (
        "anoisesrc=d=0.68:c=pink:a=1:r=48000:seed=1729,highpass=f=200,highpass=f=200,"
        "afade=t=in:st=0:d=0.14:curve=exp,afade=t=out:st=0.22:d=0.46:curve=log,"
        "afftfilt=real='re*exp(-pow((b/nb)/(0.14-0.112*min(1,(pts/sr)/0.62)),4))':"
        "imag='im*exp(-pow((b/nb)/(0.14-0.112*min(1,(pts/sr)/0.62)),4))':"
        "win_size=1024:overlap=0.75,lowpass=f=5000[out]",
        -4.0
    ),
    # Card leaves: air sweeping upwards
    "whoosh-out": (
        "anoisesrc=d=0.60:c=pink:a=1:r=48000:seed=1729,highpass=f=200,highpass=f=200,"
        "afade=t=in:st=0:d=0.14:curve=exp,afade=t=out:st=0.20:d=0.40:curve=log,"
        "afftfilt=real='re*exp(-pow((b/nb)/(0.035+0.075*min(1,(pts/sr)/0.55)),4))':"
        "imag='im*exp(-pow((b/nb)/(0.035+0.075*min(1,(pts/sr)/0.55)),4))':"
        "win_size=1024:overlap=0.75,lowpass=f=4200[out]",
        -4.0
    ),
    # Sticker / logo / node lands: 45 ms band-passed noise tap + 12 ms 1.1 kHz tone
    "pop": (
        "anoisesrc=d=0.06:c=white:a=1:r=48000:seed=7,highpass=f=2200,lowpass=f=7000,"
        "afade=t=out:st=0.002:d=0.043:curve=exp[n];"
        "sine=f=1100:d=0.06:sample_rate=48000,afade=t=out:st=0.001:d=0.012:curve=exp,volume=0.6[b];"
        "[n][b]amix=inputs=2:normalize=0,afade=t=in:st=0:d=0.001[out]",
        -4.0
    ),
    # Big number / statistic lands: air swelling into 200 Hz body
    "hit": (
        "anoisesrc=d=0.7:c=pink:a=1:r=48000:seed=1729,highpass=f=900,highpass=f=900,"
        "lowpass=f=5000,lowpass=f=5000,"
        "aeval='val(0)*(0.26*pow(min(1\\,t/0.5)\\,2)+0.85*gt(t\\,0.5)*(1-exp(-(t-0.5)*200))"
        "*exp(-(t-0.5)*40))'[air];"
        "aevalsrc='gt(t\\,0.5)*sin(2*PI*200*(t-0.5))*(1-exp(-(t-0.5)*170))*exp(-(t-0.5)*26)'"
        ":d=0.7:s=48000[body];"
        "[air][body]amix=inputs=2:weights=1 0.60:normalize=0,highpass=f=130,highpass=f=130,"
        "lowpass=f=6000,afade=t=in:st=0:d=0.06:curve=exp,afade=t=out:st=0.61:d=0.09:curve=log[out]",
        -4.0
    ),
    # Camera zoom punch-in: noise rise snapping into a 150 Hz thump
    "zoom": (
        "anoisesrc=d=0.4:c=pink:a=1:r=48000:seed=31,highpass=f=400,lowpass=f=4000,"
        "aeval='val(0)*(pow(min(1\\,t/0.2)\\,3)*exp(-max(0\\,t-0.2)*28))'[air];"
        "aevalsrc='gt(t\\,0.2)*sin(2*PI*150*(t-0.2))*(1-exp(-(t-0.2)*300))*exp(-(t-0.2)*30)'"
        ":d=0.4:s=48000[body];"
        "[air][body]amix=inputs=2:weights=1 0.5:normalize=0,highpass=f=90,"
        "afade=t=out:st=0.32:d=0.08:curve=log[out]",
        -5.0
    ),
    # Important impact / revelation: 55 Hz boom dropping to 40 Hz under a 40 ms crack
    "impact": (
        "aevalsrc='sin(2*PI*(55*t-19*t*t))*(1-exp(-t*400))*exp(-t*7)':d=0.6:s=48000[boom];"
        "anoisesrc=d=0.6:c=white:a=1:r=48000:seed=11,lowpass=f=9000,afade=t=out:st=0:d=0.04:curve=exp,"
        "volume=0.9[crack];[boom][crack]amix=inputs=2:normalize=0,afade=t=out:st=0.45:d=0.15:curve=log[out]",
        -3.0
    ),
    # Notification ding / chime
    "ding": (
        "sine=f=1760:d=0.5:sample_rate=48000,afade=t=out:st=0.02:d=0.48:curve=exp,volume=0.4[b1];"
        "sine=f=3520:d=0.3:sample_rate=48000,afade=t=out:st=0.01:d=0.29:curve=exp,volume=0.15[b2];"
        "[b1][b2]amix=inputs=2:normalize=0,afade=t=in:st=0:d=0.002[out]",
        -5.0
    ),
    # Camera shutter click
    "camera": (
        "anoisesrc=d=0.08:c=white:a=1:r=48000:seed=42,highpass=f=2500,lowpass=f=10000,"
        "afade=t=out:st=0.005:d=0.07:curve=exp[n];"
        "sine=f=800:d=0.04:sample_rate=48000,afade=t=out:st=0.001:d=0.035:curve=exp,volume=0.5[b];"
        "[n][b]amix=inputs=2:normalize=0,afade=t=in:st=0:d=0.001[out]",
        -4.0
    ),
    # Subtle UI tick / click
    "tick": (
        "anoisesrc=d=0.03:c=white:a=1:r=48000:seed=99,highpass=f=3500,lowpass=f=12000,"
        "afade=t=out:st=0.001:d=0.025:curve=exp[out]",
        -6.0
    ),
}

# Aliases to map keywords and edit intents to presets
ALIAS_MAP = {
    "whoosh": "whoosh-in",
    "whoosh_in": "whoosh-in",
    "swoosh": "whoosh-in",
    "transition": "whoosh-in",
    "enter": "whoosh-in",
    "whoosh_out": "whoosh-out",
    "exit": "whoosh-out",
    "leave": "whoosh-out",
    "pop": "pop",
    "reveal": "pop",
    "sticker": "pop",
    "node": "pop",
    "badge": "pop",
    "hit": "hit",
    "metric": "hit",
    "stat": "hit",
    "number": "hit",
    "count": "hit",
    "zoom": "zoom",
    "punch": "zoom",
    "punch_in": "zoom",
    "zoom_in": "zoom",
    "impact": "impact",
    "boom": "impact",
    "chime": "ding",
    "ding": "ding",
    "bell": "ding",
    "reward": "ding",
    "toast": "ding",
    "camera": "camera",
    "shutter": "camera",
    "snap": "camera",
    "click": "tick",
    "tap": "tick",
    "tick": "tick",
    "keyboard": "tick",
}

# Template defaults when no specific sound_effect keyword is given
TEMPLATE_SFX_MAP = {
    "cooked_likes": "hit",
    "cooked_progress": "hit",
    "metric_reveal": "hit",
    "stat_card_highlight": "hit",
    "chart_reveal": "hit",
    "cooked_toasts": "ding",
    "cooked_terminal": "tick",
    "vscode_code_typing": "tick",
    "code_reveal": "tick",
    "cooked_social_post": "pop",
    "cooked_chat": "pop",
    "cooked_flow": "pop",
    "icon_reveal": "pop",
    "cooked_notes": "whoosh-in",
    "hero_reveal": "whoosh-in",
    "step_sequence": "whoosh-in",
    "before_after": "whoosh-in",
    "quote_reveal": "whoosh-in",
    "kinetic_text": "pop",
    "browser_walkthrough": "whoosh-in",
}


def _db(v: float) -> float:
    return 20.0 * math.log10(max(v, 1e-9))


def _pcm_from_ffmpeg(graph: Optional[str] = None, media_file: Optional[str] = None) -> array.array:
    """Reads mono f32le PCM samples at 48000Hz from an FFmpeg filtergraph or media file."""
    if graph:
        args = ["-filter_complex", graph, "-map", "[out]"]
    elif media_file:
        args = ["-i", str(media_file), "-vn", "-af", "pan=mono|c0=0.5*c0+0.5*c1"]
    else:
        raise ValueError("Must provide either graph or media_file")

    cmd = ["ffmpeg", "-v", "error", *args, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    res = subprocess.run(cmd, capture_output=True, check=True)
    samples = array.array("f")
    samples.frombytes(res.stdout)
    return samples


def _windows_rms(samples: array.array, step_sec: float = 0.05) -> list[float]:
    """Calculates RMS values in sliding windows."""
    w = max(1, int(step_sec * SR))
    stride = max(1, w // 4)
    return [
        math.sqrt(sum(v * v for v in samples[i:i + w]) / w)
        for i in range(0, max(1, len(samples) - w + 1), stride)
    ]


def measure_speech_db(media_path: str) -> float:
    """
    Measures the mean vocal energy in dBFS of the spoken regions in a video or audio file.
    Gated at SPEECH_GATE_DB (-45 dB) to exclude room silence. Defaults to -21.0 dBFS if empty.
    """
    try:
        if not os.path.exists(media_path):
            return -21.0
        samples = _pcm_from_ffmpeg(media_file=media_path)
        if len(samples) < int(0.1 * SR):
            return -21.0
        w = int(0.05 * SR)
        rms_vals = [
            math.sqrt(sum(v * v for v in samples[i:i + w]) / w)
            for i in range(0, len(samples) - w, w)
        ]
        speech_rms = [r for r in rms_vals if _db(r) > SPEECH_GATE_DB]
        if not speech_rms:
            return -21.0
        return _db(math.sqrt(sum(r * r for r in speech_rms) / len(speech_rms)))
    except Exception as e:
        print(f"[SFX Synthesizer] Speech measurement fallback (-21 dB): {e}")
        return -21.0


def calculate_attack_sec(samples: array.array) -> float:
    """Returns the offset (seconds) from the beginning of the file to the loudest 10ms hit."""
    r = _windows_rms(samples, step_sec=0.01)
    if not r:
        return 0.0
    max_idx = r.index(max(r))
    stride = max(1, int(0.01 * SR) // 4)
    return round((max_idx * stride) / SR + 0.005, 3)


def write_wav(
    out_path: str,
    samples: array.array,
    gain: float = 1.0,
    channels: int = 2,
) -> None:
    """Writes normalized, clip-protected PCM 16-bit WAV to disk."""
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    max_amp = max(abs(v) for v in samples) if len(samples) > 0 else 1.0
    peak_db = _db(max_amp * gain)
    if peak_db >= -1.0:
        gain = (10.0 ** (-1.1 / 20.0)) / max(max_amp, 1e-9)

    out_int16 = array.array("h")
    for v in samples:
        val = int(max(-1.0, min(1.0, v * gain)) * 32767)
        out_int16.extend((val,) * channels)

    with wave.open(str(out_path), "wb") as f:
        f.setnchannels(channels)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(out_int16.tobytes())


def resolve_cue_name(raw_name: str) -> str:
    """Normalizes any keyword into an available SFX preset."""
    clean = (raw_name or "whoosh-in").lower().strip().replace(" ", "_")
    if clean in SFX_PRESETS:
        return clean
    if clean in ALIAS_MAP:
        return ALIAS_MAP[clean]
    for k, v in ALIAS_MAP.items():
        if k in clean:
            return v
    return "whoosh-in"


def synthesize_cue(
    cue_name: str,
    out_wav_path: str,
    speech_level_db: float = -21.0,
    channels: int = 2,
) -> Dict[str, Any]:
    """
    Synthesizes a specific sound cue at speech-calibrated volume.
    Returns: {"name": str, "path": str, "attack_s": float, "db": float}
    """
    preset_key = resolve_cue_name(cue_name)
    graph, offset_db = SFX_PRESETS[preset_key]

    samples = _pcm_from_ffmpeg(graph=graph)
    # Pad shorter files to MIN_S so audio engines never drop them
    if len(samples) < int(MIN_S * SR):
        samples.extend([0.0] * (int(MIN_S * SR) - len(samples)))

    w_rms = _windows_rms(samples, step_sec=0.05)
    loudest_50ms_db = _db(max(w_rms)) if w_rms else -20.0

    target_db = speech_level_db + offset_db
    gain = 10.0 ** ((target_db - loudest_50ms_db) / 20.0)

    write_wav(out_wav_path, samples, gain=gain, channels=channels)
    attack_s = calculate_attack_sec(samples)

    return {
        "name": preset_key,
        "path": out_wav_path,
        "attack_s": attack_s,
        "db": round(target_db, 1),
    }


def synthesize_project_sfx_library(out_dir: str, speech_level_db: float = -21.0) -> Dict[str, Any]:
    """
    Pre-synthesizes the entire SFX suite for a project in one pass.
    Saves kit.json with attack offsets and calibrated dB levels.
    """
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    kit: Dict[str, Any] = {
        "speech_db": round(speech_level_db, 1),
        "cues": {}
    }

    for name in SFX_PRESETS:
        wav_file = out_path / f"{name}.wav"
        cue_info = synthesize_cue(name, str(wav_file), speech_level_db)
        kit["cues"][name] = {
            "attack_s": cue_info["attack_s"],
            "db": cue_info["db"],
            "path": str(wav_file)
        }

    kit_file = out_path / "kit.json"
    kit_file.write_text(json.dumps(kit, indent=2), encoding="utf-8")
    return kit


def recommend_sfx_for_action(action: Dict[str, Any]) -> str:
    """
    Determines the ideal SFX cue based on the action type and motion graphic template.
    """
    act_type = action.get("action", "")
    if act_type == "zoom_in":
        return "zoom"
    if act_type == "sfx":
        return action.get("sound_effect") or "pop"
    if act_type == "motion_graphics":
        mg_type = action.get("motion_graphics_type", "hero_reveal")
        return TEMPLATE_SFX_MAP.get(mg_type, "whoosh-in")
    return "whoosh-in"
