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

# High-retention finance script for 1-minute YouTube Short
SCRIPT_TEXT = """Ninety-two percent of professional Wall Street fund managers fail to beat one simple index fund.
Let that sink in.
Trillions of dollars, supercomputers, and teams of Ivy League analysts, yet they consistently lose to the S&P 500.
Why?
Because the stock market isn't a game of predicting winners; it's a game of minimizing mistakes.
Between high management fees, emotional panic selling, and chasing hype, individual stock pickers bleed out.
Back in 2007, Warren Buffett bet one million dollars that a basic S&P 500 index fund would outperform a handpicked basket of elite hedge funds over ten years.
The result? The index fund crushed them, up one hundred twenty-six percent compared to just thirty-six percent.
Stop looking for the needle in the haystack. Just buy the whole haystack.
Automate your investing, ignore the daily noise, and let compound growth do the rest."""

OUTPUT_VIDEO = os.path.join(ROOT_DIR, "youtube_finance_faceless_masterpiece.mp4")
TEMP_DIR = os.path.join(ROOT_DIR, "media_temp/finance_video")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{TEMP_DIR}/assets", exist_ok=True)

async def generate_speech(audio_mp3: str, audio_wav: str):
    print("[1/6] 🎙️ Generating crisp AI voiceover with edge-tts...")
    import edge_tts
    communicate = edge_tts.Communicate(SCRIPT_TEXT, "en-US-ChristopherNeural", rate="+5%")
    await communicate.save(audio_mp3)
    subprocess.run([
        "ffmpeg", "-y", "-i", audio_mp3,
        "-ac", "1", "-ar", "16000",
        audio_wav
    ], capture_output=True, check=True)

    # Get exact duration
    dur_proc = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audio_wav
    ], capture_output=True, text=True)
    duration = float(dur_proc.stdout.strip())
    print(f"      Voiceover duration: {duration:.2f} seconds.")
    return duration

def create_base_canvas(duration: float, audio_wav: str, out_raw: str, ticker_bg: str = None):
    print(f"[2/6] 🎨 Building 1080x1920 base canvas ({duration:.2f}s)...")
    if ticker_bg and os.path.exists(ticker_bg) and os.path.getsize(ticker_bg) > 10000:
        # Loop ticker bg, crop to 1080x1920, apply dark grading / vignette
        filter_str = (
            "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
            "eq=brightness=-0.25:contrast=1.2:saturation=0.8,"
            "drawbox=x=0:y=0:w=1080:h=1920:color=black@0.45:t=fill"
        )
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1", "-i", ticker_bg,
            "-i", audio_wav,
            "-vf", filter_str,
            "-t", f"{duration:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            out_raw
        ]
    else:
        # Clean premium dark gradient canvas
        filter_str = (
            "color=c=#030712:s=1080x1920:r=30,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.04"
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
    ticker_bg = f"{TEMP_DIR}/assets/ticker_bg.mp4"

    # Step 1: Voiceover
    duration = asyncio.run(generate_speech(audio_mp3, audio_wav))

    # Seed ticker background if available
    test_bg = os.path.join(ROOT_DIR, "media_temp/test_assets/broll_test_finance.mp4")
    if os.path.exists(test_bg) and (not os.path.exists(ticker_bg) or os.path.getsize(ticker_bg) < 1000):
        print(f"      Seeding dynamic trading background canvas: {test_bg}")
        shutil.copy(test_bg, ticker_bg)

    # Step 2: Base video
    create_base_canvas(duration, audio_wav, raw_video, ticker_bg)

    # Step 3: Transcription
    print("[3/6] 📝 Transcribing with faster-whisper for word-level sync...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(audio_wav)
    print(f"      Extracted {len(timestamp_map)} word-accurate chunks.")

    # Define edit decision list (B-rolls, Motion Graphics, Audio/SFX)
    edits = [
        # --- BEAT 1: HOOK - INVESTIGATION EVIDENCE (0.0s - 5.2s) ---
        # "92% of professional Wall Street fund managers fail to beat one simple index fund."
        # Universal Phase 1: Aged Financial Newspaper with authentic animated highlighter & rubber stamp
        {
            "action": "motion_graphics",
            "trigger_id": "ID_01",
            "motion_graphics_type": "newspaper-highlighter",
            "motion_graphics_targets": {
                "outlet": "THE WALL STREET JOURNAL",
                "date": "ANNUAL SPIVA REPORT",
                "headline": "ACTIVE MANAGERS FAIL TO BEAT INDEX",
                "bodyText": "Standard & Poor's comprehensive 15-year scorecard confirms that across all domestic equity categories,",
                "highlightText": "92% of professional Wall Street fund managers fail to beat one simple index fund.",
                "markerColor": "#FDE047",
                "stamp": "VERIFIED EVIDENCE",
                "personality": "premium"
            },
            "start": 0.0,
            "end": 5.2
        },
        {
            "action": "sfx",
            "trigger_id": "ID_01",
            "sound_effect": "whoosh",
            "start": 0.0,
            "end": 0.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_01",
            "sound_effect": "impact",
            "start": 0.8,
            "end": 1.5
        },

        # --- BEAT 2: B-ROLL CUT 1 - WALL STREET EXTERIOR (5.2s - 7.6s) ---
        # "Let that sink in."
        {
            "action": "b_roll",
            "trigger_id": "broll_wallstreet",
            "search_query": "wall street stock exchange buildings new york",
            "broll_path": f"{TEMP_DIR}/assets/broll_wallstreet.mp4",
            "transition": "fade",
            "start": 5.2,
            "end": 7.6
        },
        {
            "action": "sfx",
            "trigger_id": "broll_wallstreet",
            "sound_effect": "whoosh",
            "start": 5.2,
            "end": 5.7
        },

        # --- BEAT 2: B-ROLL CUT 2 - CASH COUNTING (7.6s - 9.8s) ---
        # "Trillions of dollars..."
        {
            "action": "b_roll",
            "trigger_id": "broll_cash_count",
            "search_query": "counting dollar bills money cash",
            "broll_path": f"{TEMP_DIR}/assets/broll_cash_count.mp4",
            "transition": "fade",
            "start": 7.6,
            "end": 9.8
        },
        {
            "action": "sfx",
            "trigger_id": "broll_cash_count",
            "sound_effect": "whoosh",
            "start": 7.6,
            "end": 8.1
        },

        # --- BEAT 2: B-ROLL CUT 3 - SUPERCOMPUTERS (9.8s - 12.0s) ---
        # "...supercomputers..."
        {
            "action": "b_roll",
            "trigger_id": "broll_supercomputers",
            "search_query": "server room data center technology supercomputer",
            "broll_path": f"{TEMP_DIR}/assets/broll_supercomputers.mp4",
            "transition": "fade",
            "start": 9.8,
            "end": 12.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_supercomputers",
            "sound_effect": "whoosh",
            "start": 9.8,
            "end": 10.3
        },

        # --- BEAT 2: B-ROLL CUT 4 - IVY LEAGUE ANALYSTS (12.0s - 15.0s) ---
        # "...and teams of Ivy League analysts, yet they consistently lose to the S&P 500."
        {
            "action": "b_roll",
            "trigger_id": "broll_analysts",
            "search_query": "financial analysts investment meeting",
            "broll_path": f"{TEMP_DIR}/assets/broll_analysts.mp4",
            "transition": "fade",
            "start": 12.0,
            "end": 15.0
        },
        {
            "action": "sfx",
            "trigger_id": "broll_analysts",
            "sound_effect": "whoosh",
            "start": 12.0,
            "end": 12.5
        },

        # --- BEAT 3: THE FINE PRINT CALLOUT - MAGNIFYING GLASS (15.5s - 21.5s) ---
        # "Because the stock market isn't a game of predicting winners; it's a game of minimizing mistakes."
        # Universal Phase 2: Optical glass inspection targeting hidden advisory drag
        {
            "action": "motion_graphics",
            "trigger_id": "ID_06",
            "motion_graphics_type": "magnifying-glass-zoom",
            "motion_graphics_targets": {
                "backgroundSnippet": "ACTIVE FUND PROSPECTUS // 2.15% ADVISORY MANAGEMENT FEE // 85% CHURN TURNOVER RATE // NET NEGATIVE ALPHA SPREAD",
                "zoomTarget": "2.15% ADVISORY FEE BLEED",
                "calloutBadge": "HIDDEN FRICTION",
                "calloutTitle": "SYSTEMIC WEALTH LEAK",
                "calloutDetail": "Compounding management fees siphon over 40% of investor wealth over a 30-year horizon.",
                "personality": "technical"
            },
            "start": 15.5,
            "end": 21.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_06",
            "sound_effect": "whoosh",
            "start": 15.5,
            "end": 16.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_06",
            "sound_effect": "chime",
            "start": 16.2,
            "end": 17.2
        },

        # --- BEAT 4: STOCK CRASH B-ROLL WITH URGENCY RISK GAUGE (21.5s - 29.5s) ---
        # "Between high management fees, emotional panic selling, and chasing hype, individual stock pickers bleed out."
        {
            "action": "b_roll",
            "trigger_id": "broll_crash",
            "search_query": "stock market crash red candle financial chart",
            "broll_path": f"{TEMP_DIR}/assets/broll_crash.mp4",
            "transition": "fade",
            "start": 21.5,
            "end": 29.5
        },
        {
            "action": "sfx",
            "trigger_id": "broll_crash",
            "sound_effect": "whoosh",
            "start": 21.5,
            "end": 22.0
        },
        # Universal Phase 3: Tachometer Speedometer leaping into the Danger Red Zone
        {
            "action": "motion_graphics",
            "trigger_id": "ID_07",
            "motion_graphics_type": "urgency-dial-gauge",
            "motion_graphics_targets": {
                "title": "SPECULATIVE EMOTIONAL VOLATILITY",
                "badge": "⚠️ CAPITAL BLEED WARNING",
                "value": 94,
                "unit": "% RISK",
                "zoneLabel": "MAXIMUM HAZARD ZONE",
                "subtext": "Panic selling and performance chasing push investor drawdown into the catastrophic red zone.",
                "personality": "energetic"
            },
            "start": 23.5,
            "end": 29.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_07",
            "sound_effect": "riser",
            "start": 23.6,
            "end": 25.0
        },

        # --- BEAT 5: BUFFETT'S $1M BET - SHOWDOWN DUEL (29.5s - 39.5s) ---
        # "Back in 2007, Warren Buffett bet one million dollars that a basic S&P 500 index fund would outperform a handpicked basket of elite hedge funds over ten years."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_08",
            "motion_graphics_type": "showdown-duel",
            "motion_graphics_targets": {
                "title": "THE $1,000,000 SHOWDOWN",
                "wagerAmount": "$1,000,000 WAGER",
                "timeframe": "10-YEAR CONTEST • 2007 ➔ 2017",
                "side1Title": "S&P 500 INDEX",
                "side1Sub": "Warren Buffett (Vanguard)",
                "side1Fee": "0.03% Fee • Passive",
                "side2Title": "5 HEDGE FUNDS",
                "side2Sub": "Protégé Partners Elites",
                "side2Fee": "2% + 20% Fee • High Risk",
                "personality": "premium"
            },
            "start": 29.5,
            "end": 39.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_08",
            "sound_effect": "chime",
            "start": 29.8,
            "end": 30.8
        },

        # --- BEAT 6: CASH / RESULT HOOK B-ROLL (39.5s - 41.5s) ---
        # "The result?"
        {
            "action": "b_roll",
            "trigger_id": "broll_cash",
            "search_query": "falling dollars money wealth cash",
            "broll_path": f"{TEMP_DIR}/assets/broll_cash.mp4",
            "transition": "fade",
            "start": 39.5,
            "end": 41.5
        },

        # --- BEAT 7: THE 10-YEAR VERDICT / BATTLE CHART (41.5s - 47.5s) ---
        # "The index fund crushed them, up one hundred twenty-six percent compared to just thirty-six percent."
        {
            "action": "motion_graphics",
            "trigger_id": "ID_11",
            "motion_graphics_type": "battle-chart",
            "motion_graphics_targets": {
                "title": "10-YEAR RESULTS: THE VERDICT",
                "subtitle": "BUFFETT $1,000,000 CHALLENGE",
                "sp500Label": "S&P 500 INDEX FUND",
                "sp500Return": 126,
                "hedgeLabel": "TOP 5 HEDGE FUNDS",
                "hedgeReturn": 36,
                "deltaLabel": "+90% S&P 500 ADVANTAGE",
                "personality": "energetic"
            },
            "start": 41.5,
            "end": 47.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_11",
            "sound_effect": "reward",
            "start": 41.8,
            "end": 43.0
        },

        # --- BEAT 8: THE HAYSTACK TRANSFORMATION - SPLIT SLIDER (47.5s - 53.0s) ---
        # "Stop looking for the needle in the haystack. Just buy the whole haystack."
        # Universal Phase 8: Interactive before-and-after slider wipe
        {
            "action": "motion_graphics",
            "trigger_id": "ID_13",
            "motion_graphics_type": "split-slider-comparison",
            "motion_graphics_targets": {
                "title": "THE INDEX TRANSFORMATION",
                "badge": "⚖️ OLD PARADIGM VS NEW REALITY",
                "leftTag": "NEEDLE CHASER",
                "leftTitle": "Stock Picking Grind",
                "leftMetric": "18.5 HOURS/WK",
                "leftDetail": "Chasing individual needles, emotional anxiety, high fee drag, and underperformance.",
                "leftIcon": "⏳",
                "rightTag": "HAYSTACK STRATEGY",
                "rightTitle": "Total Market Index",
                "rightMetric": "4.2 MINUTES",
                "rightDetail": "Owning the entire haystack with zero prediction risk, 0.03% expense ratio, and pure alpha.",
                "rightIcon": "⚡",
                "sliderStart": 75,
                "sliderEnd": 50,
                "synthesis": "TRANSFORMATION: Buying the haystack eliminates 100% of individual stock selection risk."
            },
            "start": 47.5,
            "end": 53.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_13",
            "sound_effect": "whoosh",
            "start": 47.5,
            "end": 48.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_13",
            "sound_effect": "impact-soft",
            "start": 48.8,
            "end": 49.6
        },

        # --- BEAT 9: THE DECISION CHECKLIST STAMP (53.0s - 58.5s) ---
        # "Automate your investing, ignore the daily noise, and let compound growth do the rest."
        # Universal Phase 7: Tactile Pass/Fail checklist matrix with rubber stamp impacts
        {
            "action": "motion_graphics",
            "trigger_id": "ID_14",
            "motion_graphics_type": "tactile-checklist-stamp",
            "motion_graphics_targets": {
                "title": "WEALTH GENERATION AUDIT",
                "badge": "📋 RIGOROUS CRITERIA MATRIX",
                "item1Text": "Total Market Index Diversification",
                "item1Status": "pass",
                "item2Text": "Emotional Market Timing & Hype",
                "item2Status": "fail",
                "item3Text": "Automated Compounding Frequency",
                "item3Status": "pass",
                "verdictText": "VERDICT: DISCIPLINED AUTOMATION DEFEATS WALL STREET",
                "verdictStatus": "pass",
                "synthesis": "AUDIT RESULT: Automated passive indexing crushes 92% of Wall Street active managers."
            },
            "start": 53.0,
            "end": 58.5
        },
        {
            "action": "sfx",
            "trigger_id": "ID_14",
            "sound_effect": "impact",
            "start": 53.2,
            "end": 54.0
        },
        {
            "action": "sfx",
            "trigger_id": "ID_14",
            "sound_effect": "chime-reward",
            "start": 55.5,
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

    # Step 4: Subtitles (anchored below motion graphics when active, centered on B-roll)
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

    # Step 5: B-roll downloads via Pexels API
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

    # Step 6: Render final composited MP4
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

    # Also copy to youtube_finance_faceless_short.mp4
    short_path = os.path.join(ROOT_DIR, "youtube_finance_faceless_short.mp4")
    shutil.copy(rendered_path, short_path)

    print(f"\n✨ SUCCESS! Video rendered in {elapsed:.1f} seconds.")
    print(f"📁 Output Video Location: {os.path.abspath(rendered_path)}")
    print(f"📁 Short Video Location:  {os.path.abspath(short_path)}")
    print(f"📊 File Size: {os.path.getsize(rendered_path) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()
