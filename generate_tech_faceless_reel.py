"""
generate_tech_faceless_reel.py

Production-grade 1-minute viral Tech Reel (9:16 vertical 1080x1920):
"The Collapse of the 100-Person Software Company: Autonomous AI Swarms & The 10,000x Leverage Shift"

Pipeline:
1. Neural Edge TTS voiceover (en-US-ChristopherNeural at +3% rate)
2. Whisper word-level transcription with ASS yellow-highlight karaoke subtitles
3. High-definition Pexels B-rolls (cyberpunk matrix, server racks, typing code, AI network)
4. Suite of 4 Remotion Explainer Motion Graphics:
   - BottleneckConstriction (Legacy 50-person dev team vs PR review choke point)
   - RadarSpiderChart (Autonomous Swarms vs Monolithic LLM benchmark)
   - ParetoPowerLaw (80/20 leverage of core primitives)
   - ChronoDialClock (24-Hour AI history chronometer)
5. Multi-track synchronized sound design (whooshes, deep impacts, glitch zaps, chimes)
6. Looping BGM with -16 dB speech ducking
7. FFmpeg master compositing with continuous playback (zero black frames)
"""

import os
import sys
import json
import time
import asyncio
import subprocess
import requests
from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

# Prevent /tmp partition overflow by directing all temp files to project disk
os.environ["TMPDIR"] = os.path.join(ROOT_DIR, "media_temp", "tmp")
os.environ["TEMP"] = os.environ["TMPDIR"]
os.environ["TMP"] = os.environ["TMPDIR"]
os.makedirs(os.environ["TMPDIR"], exist_ok=True)

sys.path.insert(0, os.path.join(ROOT_DIR, "apps", "worker"))
os.chdir(os.path.join(ROOT_DIR, "apps", "worker"))

from services.compositor import render_video_pipeline
from services.transcriber import transcribe_and_compress
from services.subtitle_generator import generate_ass_subtitles

# High-retention tech script (~150 words ~ 54-58 seconds at +3% rate)
SCRIPT_TEXT = (
    "Ninety-nine percent of software startups with fifty engineers will be replaced by a single person in the next twenty-four months. "
    "Let that sink in. "
    "For twenty years, building tech meant raising millions, hiring armies of developers, and managing endless sprint tickets. "
    "That entire paradigm just hit a fatal bottleneck. "
    "Why? "
    "Because the marginal cost of cognitive intelligence collapsed by ten thousand x. "
    "When you evaluate modern architectures, you don't rely on a single prompt—you deploy an autonomous swarm. "
    "One agent writes code, a second runs unit tests in the terminal, and a third patches stack traces in milliseconds. "
    "This is the ultimate Pareto leverage: eighty percent of systemic yield is driven by twenty percent of core primitives. "
    "If computing history were a 24-hour clock, autonomous swarms only emerged in the final four seconds. "
    "The winners won't be those who memorize syntax. The winners will be the systems architects. "
    "Stop doing manual toil. Architect the machine that builds the future."
)

OUTPUT_VIDEO = os.path.join(ROOT_DIR, "youtube_tech_swarm_reel_master.mp4")
TEMP_DIR = os.path.join(ROOT_DIR, "media_temp", "tech_reel")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{TEMP_DIR}/assets", exist_ok=True)
os.makedirs(f"{TEMP_DIR}/preview_frames", exist_ok=True)

BROLL_QUERIES = {
    "broll_matrix_code": "matrix digital code dark screen vertical",
    "broll_server_room": "datacenter server room glowing lights vertical",
    "broll_hacker_typing": "programmer coding keyboard dark room vertical",
    "broll_cyber_network": "abstract neural network technology glowing vertical",
    "broll_future_city": "futuristic smart city night cyberpunk vertical",
    "bg_tech_grid": "abstract cyberspace digital lines vertical dark"
}

def download_pexels_brolls():
    print("[0/6] 📥 Fetching high-retention portrait tech B-rolls from Pexels API...")
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        print("  [!] Warning: PEXELS_API_KEY not found in environment, falling back to local asset pool.")
        return

    headers = {"Authorization": api_key}
    for asset_name, query in BROLL_QUERIES.items():
        out_file = f"{TEMP_DIR}/assets/{asset_name}.mp4"
        if os.path.exists(out_file) and os.path.getsize(out_file) > 50000:
            print(f"  [✓] Cached: {asset_name}.mp4 ({os.path.getsize(out_file) / 1024 / 1024:.1f} MB)")
            continue

        print(f"  [*] Searching Pexels for: '{query}'...")
        try:
            url = f"https://api.pexels.com/videos/search?query={requests.utils.quote(query)}&orientation=portrait&per_page=5"
            res = requests.get(url, headers=headers, timeout=12)
            videos = res.json().get("videos", []) if res.status_code == 200 else []

            if not videos:
                # Fallback to general search
                url = f"https://api.pexels.com/videos/search?query={requests.utils.quote(query)}&per_page=5"
                res = requests.get(url, headers=headers, timeout=12)
                videos = res.json().get("videos", []) if res.status_code == 200 else []

            if not videos:
                print(f"  [!] No videos found for query '{query}'")
                continue

            chosen_file = None
            for v in videos:
                for vf in v.get("video_files", []):
                    if vf.get("width", 0) >= 720 or vf.get("height", 0) >= 1280:
                        chosen_file = vf.get("link")
                        break
                if chosen_file:
                    break

            if not chosen_file and videos[0].get("video_files"):
                chosen_file = videos[0]["video_files"][0].get("link")

            if chosen_file:
                print(f"  [↓] Downloading video for '{asset_name}'...")
                dl_res = requests.get(chosen_file, stream=True, timeout=30)
                temp_raw = f"{TEMP_DIR}/assets/raw_{asset_name}.mp4"
                with open(temp_raw, "wb") as f:
                    for chunk in dl_res.iter_content(chunk_size=65536):
                        if chunk:
                            f.write(chunk)

                # Normalize to 1080x1920 vertical H.264 30fps
                print(f"  [⚙] Normalizing {asset_name} to 1080x1920 vertical format...")
                norm_cmd = [
                    "ffmpeg", "-y", "-i", temp_raw,
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-an",
                    out_file
                ]
                subprocess.run(norm_cmd, capture_output=True, check=True)
                if os.path.exists(temp_raw):
                    os.remove(temp_raw)
                print(f"  [✓] Ready: {asset_name}.mp4 ({os.path.getsize(out_file) / 1024 / 1024:.1f} MB)")
        except Exception as e:
            print(f"  [!] Failed fetching {asset_name}: {e}")

    # Fallback copy from local cache if needed
    source_fallbacks = {
        "broll_server_room": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_supercomputers.mp4"),
        "broll_hacker_typing": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_analysts.mp4"),
        "broll_future_city": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_skyline.mp4"),
        "broll_matrix_code": os.path.join(ROOT_DIR, "media_temp/broll_cache/pexels_14209120_1920x1080.mp4"),
        "broll_cyber_network": os.path.join(ROOT_DIR, "media_temp/broll_cache/pexels_3141210_1920x1080.mp4"),
        "bg_tech_grid": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/ticker_bg.mp4")
    }
    for asset_name, fallback_src in source_fallbacks.items():
        target_path = f"{TEMP_DIR}/assets/{asset_name}.mp4"
        if (not os.path.exists(target_path) or os.path.getsize(target_path) < 10000) and os.path.exists(fallback_src):
            print(f"  [⚙] Normalizing fallback asset for {asset_name} from {os.path.basename(fallback_src)}...")
            try:
                norm_cmd = [
                    "ffmpeg", "-y", "-i", fallback_src,
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-an",
                    target_path
                ]
                subprocess.run(norm_cmd, capture_output=True, check=True)
                print(f"  [✓] Fallback ready: {asset_name}.mp4")
            except Exception as e:
                print(f"  [!] Fallback normalization failed for {asset_name}: {e}")

async def generate_speech(audio_mp3: str, audio_wav: str) -> float:
    print("[1/6] 🎙️ Generating neural AI voiceover with edge-tts (ChristopherNeural)...")
    import edge_tts
    communicate = edge_tts.Communicate(SCRIPT_TEXT, "en-US-ChristopherNeural", rate="+3%", pitch="+0Hz")
    await communicate.save(audio_mp3)

    subprocess.run([
        "ffmpeg", "-y", "-i", audio_mp3,
        "-ac", "1", "-ar", "16000",
        audio_wav
    ], capture_output=True, check=True)

    dur_proc = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audio_wav
    ], capture_output=True, text=True)
    duration = float(dur_proc.stdout.strip())
    print(f"      Voiceover duration: {duration:.2f} seconds.")
    return duration

def create_base_canvas(duration: float, audio_wav: str, out_raw: str, bg_video: str = None):
    print(f"[2/6] 🎨 Building 1080x1920 tech base canvas ({duration:.2f}s)...")
    if bg_video and os.path.exists(bg_video) and os.path.getsize(bg_video) > 50000:
        filter_str = (
            "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            "eq=brightness=-0.32:contrast=1.35:saturation=0.8,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.025,"
            "drawbox=x=0:y=0:w=1080:h=1920:color=black@0.50:t=fill"
        )
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1", "-i", bg_video,
            "-i", audio_wav,
            "-vf", filter_str,
            "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            out_raw
        ]
    else:
        # High-tech cyberpunk dark canvas with grid pattern
        filter_str = (
            "color=c=#030712:s=1080x1920:r=30,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.03,"
            "drawgrid=width=360:height=360:thickness=2:color=#00e5ff@0.04"
        )
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", filter_str,
            "-i", audio_wav,
            "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            out_raw
        ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"      Base canvas generated: {out_raw}")

def main():
    audio_mp3 = f"{TEMP_DIR}/speech.mp3"
    audio_wav = f"{TEMP_DIR}/speech.wav"
    raw_video = f"{TEMP_DIR}/base_canvas_9_16.mp4"
    ass_subs = f"{TEMP_DIR}/subtitles.ass"
    bg_video = f"{TEMP_DIR}/assets/bg_tech_grid.mp4"

    # Step 0: Download & cache B-rolls
    download_pexels_brolls()

    # Step 1: Voiceover
    duration = asyncio.run(generate_speech(audio_mp3, audio_wav))

    # Step 2: Base video canvas
    create_base_canvas(duration, audio_wav, raw_video, bg_video)

    # Step 3: Faster-Whisper word-level transcription
    print("[3/6] 📝 Transcribing with faster-whisper for word-level sync...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(audio_wav)
    print(f"      Extracted {len(timestamp_map)} word-accurate chunks.")

    # Step 4: Kinetic ASS Subtitles with yellow word highlights
    print("[4/6] ⚡ Generating viral ASS subtitles (9:16 vertical styling)...")
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=ass_subs,
        font_size=58,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000FFFF"
    )

    # Step 5: B-roll map & edits
    print("[5/6] 🎬 Assembling edit decision list (B-rolls + 4 Tech Remotion Graphics + SFX)...")
    broll_map = {
        "broll_matrix_code": f"{TEMP_DIR}/assets/broll_matrix_code.mp4",
        "broll_server_room": f"{TEMP_DIR}/assets/broll_server_room.mp4",
        "broll_hacker_typing": f"{TEMP_DIR}/assets/broll_hacker_typing.mp4",
        "broll_cyber_network": f"{TEMP_DIR}/assets/broll_cyber_network.mp4",
        "broll_future_city": f"{TEMP_DIR}/assets/broll_future_city.mp4",
    }

    # Structured 60s Tech Narrative Timeline:
    # 0.0s - 4.5s: Hook: "99% of software startups with 50 engineers will be replaced by a single person..." (B-roll matrix code + whoosh)
    # 4.5s - 7.5s: Shock Beat: "Let that sink in." (B-roll server room + deep impact)
    # 7.5s - 17.5s: Paradigm Breakdown: "For 20 years... That entire paradigm just hit a fatal bottleneck." (BottleneckConstriction + whoosh + impact)
    # 17.5s - 22.0s: The Reason: "Why? Because the marginal cost of cognitive intelligence collapsed by 10,000x." (B-roll cyber network + riser)
    # 22.0s - 32.5s: Swarm Architecture: "When you evaluate modern architectures... deploy an autonomous swarm." (RadarSpiderChart + chime)
    # 32.5s - 38.5s: Agentic Execution: "One agent writes code, a second runs unit tests... patches stack traces in milliseconds." (B-roll hacker typing + glitch-zap)
    # 38.5s - 48.0s: Pareto Leverage: "This is the ultimate Pareto leverage: 80% of systemic yield..." (ParetoPowerLaw + whoosh + reward)
    # 48.0s - 55.5s: 24-Hour Epoch Chronometer: "If computing history were a 24-hour clock... final four seconds." (ChronoDialClock + clock-tick + riser)
    # 55.5s - duration: Call to Action: "Stop doing manual toil. Architect the machine that builds the future." (B-roll future city + impact)

    edits = [
        # --- BEAT 1: HOOK (0.0s - 4.5s) ---
        {
            "action": "b_roll",
            "trigger_id": "broll_matrix_code",
            "broll_path": broll_map["broll_matrix_code"],
            "transition": "fade",
            "start": 0.0,
            "end": 4.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_matrix_code",
            "sound_effect": "whoosh",
            "start": 0.0,
            "end": 0.6
        },
        {
            "action": "sfx",
            "trigger_id": "broll_matrix_code",
            "sound_effect": "impact-soft",
            "start": 1.5,
            "end": 2.2
        },

        # --- BEAT 2: SHOCK BEAT (4.5s - 7.5s) ---
        # "Let that sink in."
        {
            "action": "b_roll",
            "trigger_id": "broll_server_room",
            "broll_path": broll_map["broll_server_room"],
            "transition": "fade",
            "start": 4.5,
            "end": 7.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_server_room",
            "sound_effect": "impact-deep-soft",
            "start": 4.6,
            "end": 5.8
        },

        # --- BEAT 3: MOTION GRAPHIC 1 - BOTTLENECK CONSTRICTION (7.5s - 17.5s) ---
        # "For twenty years, building tech meant raising millions, hiring armies of developers, and managing endless sprint tickets. That entire paradigm just hit a fatal bottleneck."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_BOTTLENECK",
            "motion_graphics_type": "bottleneck-constriction",
            "motion_graphics_targets": {
                "title": "THE 50-ENGINEER DEV BOTTLENECK",
                "subtitle": "COMMUNICATION TOIL & PULL REQUEST CONGESTION",
                "badge": "⚠️ SYSTEMIC THROUGHPUT CHOKE POINT",
                "inputLabel": "ENGINEERING HEADCOUNT",
                "inputMetric": "50 DEVELOPERS",
                "inputDesc": "Millions in venture funding & sprint coordination",
                "chokeLabel": "PR REVIEW & MERGE CONFLICTS",
                "chokeMetric": "CHOKE POINT: 4.8 DAYS",
                "chokeDesc": "Manual review friction, regression testing & meeting toil",
                "restrictionPct": "-88%",
                "outputLabel": "EFFECTIVE CODE SHIPPED",
                "outputMetric": "1.2 RELEASES / MO",
                "outputDesc": "Sluggish delivery velocity under coordination drag",
                "efficiency": "12% YIELD",
                "synthesis": "Brooks' Law: Adding manpower to complex software architectures exponentially increases communication friction.",
                "personality": "technical"
            },
            "start": 7.5,
            "end": 17.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_BOTTLENECK",
            "sound_effect": "whoosh",
            "start": 7.5,
            "end": 8.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_BOTTLENECK",
            "sound_effect": "launch-thump",
            "start": 9.2,
            "end": 10.2
        },

        # --- BEAT 4: THE 10,000x COLLAPSE (17.5s - 22.0s) ---
        # "Why? Because the marginal cost of cognitive intelligence collapsed by ten thousand x."
        {
            "action": "b_roll",
            "trigger_id": "broll_cyber_network",
            "broll_path": broll_map["broll_cyber_network"],
            "transition": "fade",
            "start": 17.5,
            "end": 22.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_cyber_network",
            "sound_effect": "riser-soft",
            "start": 17.6,
            "end": 19.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_cyber_network",
            "sound_effect": "impact-soft",
            "start": 19.5,
            "end": 20.5
        },

        # --- BEAT 5: MOTION GRAPHIC 2 - RADAR SPIDER CHART (22.0s - 32.5s) ---
        # "When you evaluate modern architectures, you don't rely on a single prompt—you deploy an autonomous swarm."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_RADAR",
            "motion_graphics_type": "radar-spider-chart",
            "motion_graphics_targets": {
                "title": "COGNITIVE ARCHITECTURE BENCHMARK",
                "subtitle": "AUTONOMOUS AGENT SWARM VS LEGACY DEV TEAM",
                "badge": "POLYGONAL CAPABILITY RADAR",
                "synthesis": "Autonomous swarms achieve 10,000x cost leverage and continuous deterministic test verification.",
                "axis1": "Execution Speed",
                "axis2": "Unit Cost Efficiency",
                "axis3": "Deterministic Test Pass",
                "axis4": "Continuous 24/7 Agency",
                "axis5": "Context Coherence",
                "entity1Name": "Autonomous Swarm",
                "entity1Score1": 98,
                "entity1Score2": 96,
                "entity1Score3": 99,
                "entity1Score4": 97,
                "entity1Score5": 92,
                "entity1Badge": "AUTONOMOUS SYSTEM",
                "entity1Color": "#00E5FF",
                "entity2Name": "Legacy 50-Dev Team",
                "entity2Score1": 42,
                "entity2Score2": 26,
                "entity2Score3": 65,
                "entity2Score4": 30,
                "entity2Score5": 58,
                "entity2Badge": "MANUAL TOIL",
                "entity2Color": "#F59E0B",
                "accentColor": "#00E5FF",
                "personality": "technical"
            },
            "start": 22.0,
            "end": 32.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_RADAR",
            "sound_effect": "whoosh",
            "start": 22.0,
            "end": 22.6
        },
        {
            "action": "sfx",
            "trigger_id": "ID_RADAR",
            "sound_effect": "chime-reward",
            "start": 24.5,
            "end": 25.8
        },

        # --- BEAT 6: RAPID AGENT EXECUTION (32.5s - 38.5s) ---
        # "One agent writes code, a second runs unit tests in the terminal, and a third patches stack traces in milliseconds."
        {
            "action": "b_roll",
            "trigger_id": "broll_hacker_typing",
            "broll_path": broll_map["broll_hacker_typing"],
            "transition": "fade",
            "start": 32.5,
            "end": 38.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_hacker_typing",
            "sound_effect": "glitch-zap",
            "start": 32.8,
            "end": 33.6
        },
        {
            "action": "sfx",
            "trigger_id": "broll_hacker_typing",
            "sound_effect": "ui-click-soft",
            "start": 34.5,
            "end": 35.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_hacker_typing",
            "sound_effect": "glitch-zap",
            "start": 36.2,
            "end": 37.0
        },

        # --- BEAT 7: MOTION GRAPHIC 3 - PARETO POWER LAW (38.5s - 48.0s) ---
        # "This is the ultimate Pareto leverage: eighty percent of systemic yield is driven by twenty percent of core primitives."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_PARETO",
            "motion_graphics_type": "pareto-power-law",
            "motion_graphics_targets": {
                "title": "THE CODE LEVERAGE PRINCIPLE",
                "subtitle": "80/20 POWER LAW: CORE ARCHITECTURE VS REPETITIVE TOIL",
                "badge": "POWER LAW DYNAMICS",
                "synthesis": "In software development, 80% of enterprise value is generated by 20% of foundational system primitives.",
                "vitalPct": "20%",
                "vitalLabel": "SYSTEM ARCHITECTS",
                "vitalDesc": "Foundational harness, autonomous agents & deterministic verification gates",
                "vitalReturn": "80% SYSTEM IMPACT",
                "vitalColor": "#00E5FF",
                "trivialPct": "80%",
                "trivialLabel": "SYNTAX & REPETITIVE TOIL",
                "trivialDesc": "Boilerplate code, manual PR review queues & endless sprint updates",
                "trivialReturn": "20% RESIDUAL VALUE",
                "trivialColor": "#F59E0B",
                "accentColor": "#00E5FF",
                "personality": "technical"
            },
            "start": 38.5,
            "end": 48.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_PARETO",
            "sound_effect": "whoosh",
            "start": 38.5,
            "end": 39.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_PARETO",
            "sound_effect": "chime-reward",
            "start": 41.0,
            "end": 42.2
        },

        # --- BEAT 8: MOTION GRAPHIC 4 - CHRONO DIAL CLOCK (48.0s - 55.5s) ---
        # "If computing history were a 24-hour clock, autonomous swarms only emerged in the final four seconds. The winners won't be those who memorize syntax. The winners will be the systems architects."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_CHRONO",
            "motion_graphics_type": "chrono-dial-clock",
            "motion_graphics_targets": {
                "title": "COMPUTING HISTORY IN 24 HOURS",
                "subtitle": "76 YEARS OF COMPUTING COMPRESSED INTO A SINGLE 24-HOUR CLOCK",
                "badge": "24-HOUR CHRONOMETER",
                "synthesis": "If modern computing were a 24-hour day, autonomous agent swarms emerged in the final four seconds.",
                "currentTime": "23:59:56",
                "timeframe": "1950 — 2026 (76 Years)",
                "epoch1Time": "00:00",
                "epoch1Title": "Turing & Mainframes",
                "epoch1Desc": "1950: Vacuum tubes, punch cards & foundational symbolic logic.",
                "epoch1Badge": "GENESIS // T=0h",
                "epoch2Time": "18:00",
                "epoch2Title": "Personal Computers & Web",
                "epoch2Desc": "1995: PC revolution, TCP/IP internet protocol & web software.",
                "epoch2Badge": "NETWORK // T=18h",
                "epoch3Time": "22:30",
                "epoch3Title": "Cloud & Mobile Era",
                "epoch3Desc": "2015: Mass distributed cloud infrastructure & mobile edge devices.",
                "epoch3Badge": "CLOUD // T=22.5h",
                "epoch4Time": "23:59:56",
                "epoch4Title": "Autonomous Swarms",
                "epoch4Desc": "2026: Multi-agent self-healing reasoning swarms emerge in final 4s.",
                "epoch4Badge": "EXPONENTIAL // T=23.99h",
                "accentColor": "#00E5FF",
                "activeColor": "#10B981",
                "personality": "technical"
            },
            "start": 48.0,
            "end": 55.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_CHRONO",
            "sound_effect": "clock-tick-soft",
            "start": 48.2,
            "end": 49.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_CHRONO",
            "sound_effect": "riser-soft",
            "start": 51.5,
            "end": 53.0
        },

        # --- BEAT 9: CLIMAX & CALL TO ACTION (55.5s - duration) ---
        # "Stop doing manual toil. Architect the machine that builds the future."
        {
            "action": "b_roll",
            "trigger_id": "broll_future_city",
            "broll_path": broll_map["broll_future_city"],
            "transition": "fade",
            "start": 55.5,
            "end": max(58.0, duration)
        },
        {
            "action": "sfx",
            "trigger_id": "broll_future_city",
            "sound_effect": "impact-deep-soft",
            "start": 55.6,
            "end": 57.0
        },

        # --- BACKGROUND MUSIC ---
        {
            "action": "audio",
            "isBgm": True,
            "sourceUrl": "chill-bgm.mp3",
            "volume": 20,
            "ducking": True,
            "ducking_db": -16.0,
            "fade_in": 1.0,
            "fade_out": 2.0
        }
    ]

    for edit in edits:
        tid = edit.get("trigger_id")
        if tid and tid not in timestamp_map:
            timestamp_map[tid] = {
                "start": edit.get("start", 0.0),
                "end": edit.get("end", 5.0),
                "text": edit.get("motion_graphics_type", "Tech Feature")
            }

    # Step 6: Render final composited master MP4
    print("[6/6] 🚀 Rendering complete video pipeline (FFmpeg + Remotion + ASS Karaoke)...")
    start_time = time.time()
    rendered_path = render_video_pipeline(
        raw_video_path=raw_video,
        output_mp4_path=OUTPUT_VIDEO,
        subtitle_ass_path=ass_subs,
        broll_map=broll_map,
        edits=edits,
        timestamp_map=timestamp_map,
        settings={
            "aspect_ratio": "9:16",
            "USE_GRANULAR_OVERLAYS": True,
            "continuous_composition": True,
            "caption_preset": "tiktok_yellow"
        }
    )
    elapsed = time.time() - start_time
    print(f"\n✨ SUCCESS! Video rendered in {elapsed:.1f} seconds.")
    print(f"📁 Output Video Location: {os.path.abspath(rendered_path)}")
    print(f"📊 File Size: {os.path.getsize(rendered_path) / 1024 / 1024:.2f} MB")

    # Extract preview frame at 25s (Radar Chart) and 50s (Chrono Dial)
    for t_sec in [12, 25, 42, 51]:
        frame_out = f"{TEMP_DIR}/preview_frames/frame_{t_sec}s.jpg"
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(t_sec), "-i", rendered_path,
            "-vframes", "1", "-q:v", "2", frame_out
        ], capture_output=True)
        if os.path.exists(frame_out):
            print(f"📸 Preview frame saved: {frame_out}")

if __name__ == "__main__":
    main()
