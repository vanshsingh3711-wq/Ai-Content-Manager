import os
import sys
import json
import time
import asyncio
import subprocess
import shutil
from dotenv import load_dotenv

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# Ensure sufficient disk space for Remotion and FFmpeg temp files
os.environ["TMPDIR"] = os.path.join(ROOT_DIR, "media_temp/tmp")
os.environ["TEMP"] = os.environ["TMPDIR"]
os.environ["TMP"] = os.environ["TMPDIR"]
os.makedirs(os.environ["TMPDIR"], exist_ok=True)

sys.path.append(os.path.join(ROOT_DIR, "apps/worker"))
os.chdir(os.path.join(ROOT_DIR, "apps/worker"))

from services.compositor import render_video_pipeline
from services.transcriber import transcribe_and_compress
from services.subtitle_generator import generate_ass_subtitles
from services.sfx_manager import fetch_sfx
from services.asset_manager import fetch_broll_assets

# High-retention educational narrative for 1-minute vertical Short (~57.6s)
SCRIPT_TEXT = (
    "Nobel Prize physicist Richard Feynman discovered that ninety percent of students study completely backwards. "
    "They spend hours highlighting textbooks and rereading notes, convincing themselves they understand the material. "
    "Cognitive scientists call this the Illusion of Competence. "
    "Your brain recognizes the words, but when test time comes, you blank out because passive rereading yields only twenty percent retention. "
    "Feynman proved that true mastery requires three steps. "
    "First, choose a concept and explain it out loud as if you are teaching a twelve-year-old. No jargon, no buzzwords. "
    "Second, pinpoint the exact moments you get stuck or use complex terms to mask your confusion. Those are your knowledge gaps. "
    "Third, return to the source material, simplify the concept, and anchor it with a real-world analogy. "
    "If you cannot explain it simply, you do not understand it. "
    "Stop rereading. Start explaining."
)

OUTPUT_VIDEO = os.path.join(ROOT_DIR, "youtube_educational_feynman_masterpiece.mp4")
TEMP_DIR = os.path.join(ROOT_DIR, "media_temp/educational_feynman_short")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{TEMP_DIR}/assets", exist_ok=True)
os.makedirs(f"{TEMP_DIR}/previews", exist_ok=True)

async def generate_speech(audio_mp3: str, audio_wav: str):
    print("[1/6] 🎙️ Generating crisp AI voiceover with edge-tts (ChristopherNeural)...")
    import edge_tts
    communicate = edge_tts.Communicate(SCRIPT_TEXT, "en-US-ChristopherNeural", rate="+8%")
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
    print(f"[2/6] 🎨 Building 1080x1920 base canvas ({duration:.2f}s)...")
    if bg_video and os.path.exists(bg_video) and os.path.getsize(bg_video) > 10000:
        filter_str = (
            "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            "eq=brightness=-0.28:contrast=1.2:saturation=0.8,"
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
        filter_str = (
            "color=c=#030712:s=1080x1920:r=30,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.03"
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
    print(f"      Base video generated: {out_raw}")

def main():
    audio_mp3 = f"{TEMP_DIR}/speech.mp3"
    audio_wav = f"{TEMP_DIR}/speech.wav"
    raw_video = f"{TEMP_DIR}/base_canvas_9_16.mp4"
    ass_subs = f"{TEMP_DIR}/subtitles.ass"

    # Step 1: Voiceover
    duration = asyncio.run(generate_speech(audio_mp3, audio_wav))

    # Step 2: Base video canvas
    create_base_canvas(duration, audio_wav, raw_video)

    # Step 3: Transcription with word-level timestamps
    print("[3/6] 📝 Transcribing with faster-whisper for word-level sync...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(audio_wav)
    print(f"      Extracted {len(timestamp_map)} word-accurate chunks.")

    # Step 4: Define timeline edit decision list
    edits = [
        # --- BEAT 1: HOOK - NOBEL DISCOVERY NEWSPAPER HIGHLIGHTER (0.0s - 6.2s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_01",
            "motion_graphics_type": "newspaper-highlighter",
            "motion_graphics_targets": {
                "outlet": "NOBEL PRIZE ARCHIVES",
                "edition": "COGNITIVE PSYCHOLOGY SPECIAL REPORT",
                "date": "CAMBRIDGE UNIVERSITY REVIEW",
                "headline": "PASSIVE REREADING COLLAPSES MEMORY RETENTION",
                "preText": "Comprehensive cognitive learning evaluations confirm that ",
                "highlightText": "90% of students study completely backwards using passive rereading.",
                "postText": " Active synthetic recall remains the singular verified mechanism for deep long-term memory encoding.",
                "markerColor": "#FDE047",
                "stamp": "EMPIRICAL EVIDENCE",
                "badge": "COGNITIVE LAB REPORT",
                "personality": "premium"
            },
            "start": 0.0,
            "end": 6.2
        },
        {
            "action": "sfx",
            "trigger_id": "MG_01",
            "sound_effect": "whoosh-soft",
            "start": 0.0,
            "end": 0.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_01",
            "sound_effect": "pencil-scribble",
            "start": 0.8,
            "end": 1.8
        },
        {
            "action": "sfx",
            "trigger_id": "MG_01",
            "sound_effect": "stamp-hit",
            "start": 2.2,
            "end": 3.0
        },

        # --- BEAT 2: B-ROLL - HIGHLIGHTING TEXTBOOK (6.2s - 12.5s) ---
        {
            "action": "b_roll",
            "trigger_id": "broll_highlighting",
            "search_query": "student reading textbook highlighting",
            "broll_path": f"{TEMP_DIR}/assets/broll_highlighting.mp4",
            "transition": "fade",
            "start": 6.2,
            "end": 12.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_highlighting",
            "sound_effect": "whoosh-soft",
            "start": 6.2,
            "end": 6.7
        },
        {
            "action": "sfx",
            "trigger_id": "broll_highlighting",
            "sound_effect": "pencil-scribble",
            "start": 7.0,
            "end": 8.2
        },

        # --- BEAT 3: ILLUSION OF COMPETENCE - RISK DIAL GAUGE (12.5s - 17.5s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_02",
            "motion_graphics_type": "urgency-dial-gauge",
            "motion_graphics_targets": {
                "title": "THE ILLUSION OF COMPETENCE",
                "badge": "⚠️ FALSE MASTERY TRAP",
                "value": 88,
                "unit": "% ERROR",
                "zoneLabel": "ILLUSION TRAP ZONE",
                "subtext": "The brain confuses visual familiarity with true understanding, creating a dangerous false sense of competence.",
                "personality": "energetic"
            },
            "start": 12.5,
            "end": 17.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_02",
            "sound_effect": "glitch-zap",
            "start": 12.6,
            "end": 13.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_02",
            "sound_effect": "scan-hum",
            "start": 13.5,
            "end": 15.0
        },

        # --- BEAT 4A: B-ROLL - STRESSED EXAM TEST (17.5s - 20.5s) ---
        {
            "action": "b_roll",
            "trigger_id": "broll_stressed",
            "search_query": "stressed student head on desk studying",
            "broll_path": f"{TEMP_DIR}/assets/broll_stressed.mp4",
            "transition": "fade",
            "start": 17.5,
            "end": 20.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_stressed",
            "sound_effect": "whoosh-soft",
            "start": 17.5,
            "end": 18.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_stressed",
            "sound_effect": "riser-soft",
            "start": 18.2,
            "end": 20.2
        },

        # --- BEAT 4B: RETENTION CRASH - BATTLE CHART (20.5s - 26.5s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_03",
            "motion_graphics_type": "battle-chart",
            "motion_graphics_targets": {
                "title": "LEARNING RETENTION EXPERIMENT",
                "subtitle": "PASSIVE REREADING VS FEYNMAN SYNTHESIS",
                "sp500Label": "FEYNMAN ACTIVE RECALL",
                "sp500Return": 85,
                "side1Sub": "Active Recall • Child Explanation (Zero Jargon)",
                "side1FooterLabel": "Memory retention after 30 days:",
                "side1FooterVal": "85% Long-Term Synaptic Memory",
                "hedgeLabel": "PASSIVE REREADING",
                "hedgeReturn": 20,
                "side2Sub": "Highlighting & Re-reading Notes",
                "side2FooterLabel": "Memory retention after 30 days:",
                "side2FooterVal": "20% Rapid Memory Decay",
                "deltaLabel": "+65% RETENTION SURGE",
                "deltaSub": "Active Explanation Yields 4.2x Greater Cognitive Retention",
                "personality": "energetic"
            },
            "start": 20.5,
            "end": 26.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_03",
            "sound_effect": "impact-deep-soft",
            "start": 20.6,
            "end": 21.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_03",
            "sound_effect": "chime-reward",
            "start": 22.5,
            "end": 24.0
        },

        # --- BEAT 5: THE 3-STEP FEYNMAN PROTOCOL MATRIX (26.5s - 34.5s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_04",
            "motion_graphics_type": "tactile-checklist-stamp",
            "motion_graphics_targets": {
                "title": "THE 3-STEP FEYNMAN PROTOCOL",
                "badge": "📋 MASTERY BLUEPRINT",
                "item1Text": "1. Teach a 12-Year-Old (Zero Jargon)",
                "item1Detail": "Strip away technical buzzwords. Simple words expose hidden blindspots.",
                "item1Status": "pass",
                "item2Text": "2. Pinpoint Knowledge Confusion Gaps",
                "item2Detail": "Isolate the exact moments you hesitate or reach for complex vocabulary.",
                "item2Status": "pass",
                "item3Text": "3. Simplify & Anchor Real Analogy",
                "item3Detail": "Revisit source material and construct intuitive real-world mental models.",
                "item3Status": "pass",
                "verdictText": "VERDICT: RADICAL SIMPLICITY UNLOCKS MASTERY",
                "verdictStatus": "pass",
                "synthesis": "If you cannot explain it with child-like simplicity, you do not truly understand it."
            },
            "start": 26.5,
            "end": 34.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_04",
            "sound_effect": "whoosh-soft",
            "start": 26.5,
            "end": 27.0
        },
        {
            "action": "sfx",
            "trigger_id": "MG_04",
            "sound_effect": "stamp-hit",
            "start": 27.5,
            "end": 28.2
        },
        {
            "action": "sfx",
            "trigger_id": "MG_04",
            "sound_effect": "stamp-hit",
            "start": 29.5,
            "end": 30.2
        },
        {
            "action": "sfx",
            "trigger_id": "MG_04",
            "sound_effect": "stamp-hit",
            "start": 31.5,
            "end": 32.2
        },
        {
            "action": "sfx",
            "trigger_id": "MG_04",
            "sound_effect": "chime-reward",
            "start": 33.0,
            "end": 34.5
        },

        # --- BEAT 6: STEP 2 - FORENSIC KNOWLEDGE GAP INSPECTION (34.5s - 42.5s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_05",
            "motion_graphics_type": "magnifying-glass-zoom",
            "motion_graphics_targets": {
                "title": "KNOWLEDGE GAP FORENSICS",
                "badge": "🔬 EPISTEMIC AUDIT",
                "backgroundSnippet": "QUANTUM EQUATION: The state vector transitions via unitary operators across complex Hilbert phase-space manifold representations.",
                "zoomTarget": "COMPLEX JARGON MASKS CONFUSION",
                "calloutBadge": "EPISTEMIC GAP",
                "calloutTitle": "INTELLECTUAL CRUTCH DETECTED",
                "calloutDetail": "When you hide behind complex academic jargon, you are concealing your lack of intuitive understanding from yourself.",
                "personality": "technical"
            },
            "start": 34.5,
            "end": 42.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_05",
            "sound_effect": "whoosh-soft",
            "start": 34.5,
            "end": 35.0
        },
        {
            "action": "sfx",
            "trigger_id": "MG_05",
            "sound_effect": "scan-hum",
            "start": 35.2,
            "end": 37.0
        },
        {
            "action": "sfx",
            "trigger_id": "MG_05",
            "sound_effect": "ui-click-soft",
            "start": 37.2,
            "end": 37.8
        },

        # --- BEAT 7: STEP 3 - SYNAPTIC MIND MAP & ANALOGY (42.5s - 50.5s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_06",
            "motion_graphics_type": "mind-map-node-web",
            "motion_graphics_targets": {
                "title": "FEYNMAN SYNAPTIC ENCODING",
                "badge": "🧠 NEURAL MAP",
                "centerTitle": "CORE CONCEPT",
                "centerIcon": "⚡",
                "node1Title": "Simple Language",
                "node1Desc": "12-year-old clarity",
                "node1Icon": "👶",
                "node2Title": "Gap Pinpointing",
                "node2Desc": "Targeted review",
                "node2Icon": "🎯",
                "node3Title": "Real Analogy",
                "node3Desc": "Concrete anchor",
                "node3Icon": "🔗"
            },
            "start": 42.5,
            "end": 50.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_06",
            "sound_effect": "whoosh-wind",
            "start": 42.5,
            "end": 43.2
        },
        {
            "action": "sfx",
            "trigger_id": "MG_06",
            "sound_effect": "warm-shimmer",
            "start": 43.5,
            "end": 45.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_06",
            "sound_effect": "pop-reveal",
            "start": 46.0,
            "end": 46.8
        },

        # --- BEAT 8: CLIMAX - NOBEL QUOTE REVEAL (50.5s - 57.65s) ---
        {
            "action": "motion_graphics",
            "trigger_id": "MG_07",
            "motion_graphics_type": "quote-reveal",
            "motion_graphics_targets": {
                "quote": "If you cannot explain it simply, you do not understand it.",
                "author": "RICHARD FEYNMAN • NOBEL LAUREATE IN PHYSICS",
                "personality": "premium"
            },
            "start": 50.5,
            "end": 57.65
        },
        {
            "action": "sfx",
            "trigger_id": "MG_07",
            "sound_effect": "chime-reward",
            "start": 51.0,
            "end": 52.5
        },
        {
            "action": "sfx",
            "trigger_id": "MG_07",
            "sound_effect": "impact-deep-soft",
            "start": 54.5,
            "end": 55.5
        },

        # --- BACKGROUND MUSIC ---
        {
            "action": "audio",
            "isBgm": True,
            "sourceUrl": "chill-bgm.mp3",
            "volume": 22,
            "ducking": True,
            "ducking_db": -16.0,
            "fade_in": 1.0,
            "fade_out": 2.0
        }
    ]

    # Step 5: Subtitles (anchored below motion graphics when active, centered on B-roll)
    print("[4/6] ⚡ Generating viral ASS subtitles (anchored below motion graphics when active)...")
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=ass_subs,
        edits=edits,
        font_size=60,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000FFFF",
        is_faceless=True
    )

    # Step 6: B-roll downloads via Pexels API
    print("[5/6] 🎬 Fetching contextual 9:16 B-rolls from Pexels API...")
    broll_map = fetch_broll_assets(
        edits=edits,
        assets_dir=f"{TEMP_DIR}/assets",
        aspect_ratio="9:16",
        cache_dir=os.path.join(ROOT_DIR, "media_temp/broll_cache")
    )
    print(f"      Downloaded/cached {len(broll_map)} vertical B-roll assets.")
    for edit in edits:
        if edit.get("action") == "b_roll":
            tid = edit.get("trigger_id")
            if tid and tid in broll_map:
                edit["broll_path"] = broll_map[tid]
                print(f"      [B-ROLL] Bound '{tid}' -> {broll_map[tid]}")

    # Step 7: Render final composited MP4
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

    # Also copy to root educational video short
    short_path = os.path.join(ROOT_DIR, "youtube_educational_feynman_short.mp4")
    shutil.copy(rendered_path, short_path)

    print(f"\n✨ SUCCESS! Educational Short rendered in {elapsed:.1f} seconds.")
    print(f"📁 Masterpiece Location: {os.path.abspath(rendered_path)}")
    print(f"📁 Short Video Location:  {os.path.abspath(short_path)}")
    print(f"📊 File Size: {os.path.getsize(rendered_path) / 1024 / 1024:.2f} MB")

    # Extract 5 preview frames at key timestamps for showcase artifact
    preview_timestamps = [
        (3.0, "preview_03s_newspaper_hook.jpg"),
        (9.0, "preview_09s_highlighting_broll.jpg"),
        (15.0, "preview_15s_illusion_gauge.jpg"),
        (23.5, "preview_23s_retention_battle.jpg"),
        (30.0, "preview_30s_feynman_checklist.jpg"),
        (38.0, "preview_38s_gap_inspection.jpg"),
        (46.0, "preview_46s_synaptic_map.jpg"),
        (53.5, "preview_53s_feynman_quote.jpg"),
    ]
    print("\n📸 Extracting preview snapshots for artifact showcase...")
    for sec, fname in preview_timestamps:
        out_frame = os.path.join(TEMP_DIR, "previews", fname)
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(sec), "-i", rendered_path,
            "-vframes", "1", "-q:v", "2", out_frame
        ], capture_output=True)
        if os.path.exists(out_frame) and os.path.getsize(out_frame) > 0:
            print(f"  [✓] Snapshot @ {sec:.1f}s -> {fname} ({os.path.getsize(out_frame)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
