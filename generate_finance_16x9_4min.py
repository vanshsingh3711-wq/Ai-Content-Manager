import os
import sys
import json
import time
import asyncio
import sqlite3
import subprocess
import shutil
from typing import List, Dict, Any

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

# Ensure disk space / temp directory configuration
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

# High-retention, authoritative finance script designed specifically for 4:00 (240s) long-form YouTube video
SCRIPT_PARAGRAPHS = [
    # Act 1: The Six-Figure Trap (0:00 - 0:45)
    "Seventy-eight percent of full-time workers living paycheck to paycheck earn more than one hundred thousand dollars every single year. "
    "Let that statistic sink in for a moment. High income does not equal high net worth. "
    "Most people believe that earning more money solves financial stress, but without financial literacy, every salary increase is instantly swallowed by lifestyle inflation: a heavier car payment, a pricier mortgage, and expensive luxury consumption. "
    "The trap is believing that your physical labor is your only wealth engine. But labor does not scale. "
    "There are only twenty-four hours in a day, and trading hours for dollars is a linear treadmill you can never permanently win. "
    "True financial sovereignty begins the moment you realize that wealth is not what you spend; it is the cashflow-producing assets you quietly retain.",

    # Act 2: The Silent Wealth Destroyer (0:45 - 1:35)
    "The second immutable reality is that cash is a melting ice cube. "
    "Over the past fifty years, global central banks have dramatically expanded the total supply of fiat currency. "
    "While your high-yield savings account advertises a modest four or five percent annual yield, the true cost of living—housing, healthcare, quality nutrition, and higher education—compounds at a much steeper trajectory. "
    "Keeping your life savings in cash isn't safe; it is a guaranteed mathematical loss after accounting for inflation and capital gains taxes. "
    "In the game of capitalism, cash is merely a temporary transaction tool, not a store of enduring value. "
    "Wealthy individuals do not hoard paper currency. They convert depreciating fiat dollars into productive, dividend-bearing assets as quickly and consistently as humanly possible.",

    # Act 3: The Asymmetric Compounding Machine (1:35 - 2:35)
    "Back in 2007, legendary billionaire investor Warren Buffett issued a famous one-million-dollar challenge to the entire Wall Street hedge fund industry. "
    "He wagered that a simple, unmanaged S&P 500 index fund would outperform a handpicked portfolio of elite hedge fund managers over ten years. "
    "Despite multi-million dollar supercomputers, teams of Ivy League analysts, and exorbitant management fees, the index fund completely crushed the professionals, gaining one hundred twenty-six percent compared to just thirty-six percent for the hedge funds. "
    "Over any rolling twenty-year period in modern financial history, broad-market index investing has delivered consistent positive compound returns. "
    "If you automate an investment of five hundred dollars every single month into an index fund averaging nine percent annual returns, in thirty years you accumulate over nine hundred thousand dollars, with more than seven hundred thousand of that being pure compound growth. "
    "Time in the market always beats timing the market.",

    # Act 4: The Ownership Economy & Leverage (2:35 - 3:20)
    "To achieve true financial autonomy, you must transition from a seller of labor into an owner of productive capital. "
    "There are three distinct tiers of modern leverage: code and digital media that work for you around the clock with zero marginal cost of reproduction, tangible cashflow real estate that provides depreciation tax shields while tenants amortize your debt, and business equity that captures economic expansion. "
    "Tax codes worldwide are engineered by governments to incentivize risk-taking and asset ownership while heavily penalizing ordinary wage earners. "
    "When you own assets, you benefit from capital gains treatments, bonus depreciation, and asset-backed credit lines, allowing your net worth to compound without triggering massive annual tax liabilities.",

    # Act 5: The 4-Pillar Capital Allocation Blueprint (3:20 - 4:00)
    "To break free from the hamster wheel permanently, follow this actionable four-pillar blueprint. "
    "Pillar one: Liquidity Defense. Maintain three to six months of baseline living expenses in liquid short-term treasury bills so you never panic-sell during a market correction. "
    "Pillar two: The Automated Index Engine. Program recurring automatic transfers into low-cost broad index funds the day your paycheck arrives. "
    "Pillar three: Productive Cashflow Assets. Reinvest your profits into income-producing real estate and resilient private equity. "
    "Pillar four: Skill Arbitrage. Continuously invest in specialized, high-leverage skills that expand your earning velocity. "
    "Earn aggressively, spend intentionally, and let compound growth do the rest. Your future starts today."
]

FULL_SCRIPT = " ".join(SCRIPT_PARAGRAPHS)

OUTPUT_VIDEO = os.path.join(ROOT_DIR, "youtube_finance_faceless_4min_16x9.mp4")
PUBLIC_WEB_VIDEO = os.path.join(ROOT_DIR, "apps/web/public/finance_4min_16x9.mp4")
TEMP_DIR = os.path.join(ROOT_DIR, "media_temp/finance_4min_16x9")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{TEMP_DIR}/assets", exist_ok=True)

async def generate_speech(audio_mp3: str, audio_wav: str) -> float:
    print("[1/7] 🎙️ Synthesizing 4-minute voiceover via edge-tts (en-US-ChristopherNeural)...")
    import edge_tts
    communicate = edge_tts.Communicate(FULL_SCRIPT, "en-US-ChristopherNeural", rate="-2%")
    await communicate.save(audio_mp3)

    # Convert to 16kHz mono WAV for high-accuracy Whisper transcription
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
    mins = int(duration // 60)
    secs = int(duration % 60)
    print(f"      Voiceover duration: {duration:.2f}s (~{mins}m {secs}s).")
    return duration

def create_base_canvas_16x9(duration: float, audio_wav: str, out_raw: str, bg_video: str = None):
    print(f"[2/7] 🎨 Building 1920x1080 16:9 base canvas ({duration:.2f}s)...")
    if bg_video and os.path.exists(bg_video) and os.path.getsize(bg_video) > 10000:
        filter_str = (
            "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
            "eq=brightness=-0.28:contrast=1.25:saturation=0.75,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.02,"
            "drawbox=x=0:y=0:w=1920:h=1080:color=black@0.45:t=fill"
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
        # High-tech dark financial aesthetic grid with ambient glow
        filter_str = (
            "color=c=#040711:s=1920x1080:r=30,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.025,"
            "drawgrid=width=480:height=480:thickness=2:color=#00e6ff@0.04"
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
    print(f"      16:9 Base video generated: {out_raw}")

def copy_broll_assets(target_dir: str) -> Dict[str, str]:
    print("[3/7] 📦 Mapping and preparing high-resolution B-roll assets...")
    source_pool = {
        "broll_wallstreet": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_wallstreet.mp4"),
        "broll_cash_count": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_cash_count.mp4"),
        "broll_supercomputers": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_supercomputers.mp4"),
        "broll_analysts": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_analysts.mp4"),
        "broll_crash": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_crash.mp4"),
        "broll_cash": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_cash.mp4"),
        "broll_magnifying_glass": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_magnifying_glass.mp4"),
        "broll_skyline": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_skyline.mp4"),
        "broll_phone_investing": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_phone_investing.mp4"),
        "broll_desk": os.path.join(ROOT_DIR, "apps/web/public/demo_media/desk.mp4"),
        "broll_walk": os.path.join(ROOT_DIR, "apps/web/public/demo_media/walk.mp4"),
        "broll_mindful": os.path.join(ROOT_DIR, "apps/web/public/demo_media/mindful.mp4"),
    }

    resolved_map = {}
    for key, src in source_pool.items():
        dst = os.path.join(target_dir, f"{key}.mp4")
        if os.path.exists(src) and os.path.getsize(src) > 1000:
            if not os.path.exists(dst):
                try:
                    shutil.copyfile(src, dst)
                except Exception:
                    pass
            resolved_map[key] = dst if os.path.exists(dst) else src
        else:
            resolved_map[key] = src

    print(f"      Resolved {len(resolved_map)} B-roll clips.")
    return resolved_map

def build_edit_decision_list(duration: float, broll_map: Dict[str, str]) -> List[Dict[str, Any]]:
    print(f"[4/7] ⏱️ Constructing Edit Decision List across {duration:.1f}s...")
    edits = []

    # Helper to schedule B-roll
    def add_broll(clip_key: str, start: float, end: float, transition="fade"):
        if clip_key in broll_map and os.path.exists(broll_map[clip_key]):
            edits.append({
                "action": "b_roll",
                "trigger_id": clip_key,
                "broll_path": broll_map[clip_key],
                "transition": transition,
                "start": round(start, 2),
                "end": round(min(end, duration), 2),
                "fitMode": "cover"
            })
            edits.append({
                "action": "sfx",
                "trigger_id": clip_key,
                "sound_effect": "whoosh",
                "start": round(start, 2),
                "end": round(start + 0.5, 2)
            })

    # Helper to schedule SFX
    def add_sfx(sfx_name: str, timestamp: float):
        edits.append({
            "action": "sfx",
            "trigger_id": f"sfx_{sfx_name}_{int(timestamp)}",
            "sound_effect": sfx_name,
            "start": round(timestamp, 2),
            "end": round(timestamp + 0.6, 2)
        })

    # Helper to schedule Motion Graphics Overlays
    def add_motion_graphics(trigger_id: str, comp_type: str, targets: dict, start: float, end: float):
        edits.append({
            "action": "motion_graphics",
            "trigger_id": trigger_id,
            "motion_graphics_type": comp_type,
            "motion_graphics_targets": targets,
            "start": round(start, 2),
            "end": round(min(end, duration), 2)
        })

    # --- ACT 1: THE SIX-FIGURE TRAP (0:00 - 0:45) ---
    add_sfx("impact", 0.5)
    add_motion_graphics(
        "mg_hook_kpi", "metric-reveal",
        {"title": "THE SIX-FIGURE TRAP", "label": "EARNING $100K+ LIVING PAYCHECK TO PAYCHECK", "metric": "78%", "delta": "SYSTEMIC WEALTH TRAP"},
        0.5, 8.5
    )
    add_broll("broll_wallstreet", 3.0, 9.5)
    add_sfx("chime", 10.0)
    add_motion_graphics(
        "mg_balance_scale", "roi-balance-scale",
        {"title": "WEALTH WEIGHING SCALE", "leftName": "Financed $75k Luxury SUV (Depreciating)", "rightName": "$75k S&P 500 Index Core (Compounding)"},
        13.0, 22.5
    )
    add_broll("broll_cash_count", 13.0, 20.0)
    add_broll("broll_desk", 23.5, 30.0)
    add_broll("broll_walk", 33.0, 42.0)

    # --- ACT 2: THE SILENT WEALTH DESTROYER (0:45 - 1:35) ---
    add_sfx("impact", 45.0)
    add_motion_graphics(
        "mg_cash_burn", "inflation-cash-burn",
        {"initialCapital": 10000, "terminalValue": 4980, "averageInflation": "7.2% / Year Real Drag", "lossPercentage": "-50.2%"},
        46.0, 57.5
    )
    add_broll("broll_crash", 47.0, 56.0)
    add_sfx("whoosh", 57.0)
    add_broll("broll_magnifying_glass", 59.0, 68.0)
    add_motion_graphics(
        "mg_candlestick", "candlestick-hud",
        {"symbol": "S&P 500 (SPY)", "timeframe": "DAILY MACRO BREAKOUT", "startingPrice": 485, "endingPrice": 585, "percentageGain": "+20.6%", "trend": "bullish", "headline": "BROAD MARKET INSTITUTIONAL INFLOW"},
        60.0, 72.0
    )
    add_broll("broll_analysts", 72.0, 81.0)
    add_sfx("chime", 82.0)
    add_broll("broll_cash", 84.0, 92.0)

    # --- ACT 3: THE ASYMMETRIC COMPOUNDING MACHINE (1:35 - 2:35) ---
    add_sfx("impact", 95.0)
    add_motion_graphics(
        "mg_battle_chart", "battle-chart",
        {"title": "10-YEAR RESULTS: THE VERDICT", "subtitle": "WARREN BUFFETT $1,000,000 CHALLENGE", "sp500Return": 126, "hedgeReturn": 36, "deltaLabel": "+90% S&P 500 ADVANTAGE"},
        96.0, 110.0
    )
    add_broll("broll_supercomputers", 97.0, 107.0)
    add_sfx("whoosh", 108.0)
    add_broll("broll_analysts", 110.0, 120.0)
    add_motion_graphics(
        "mg_snowball_curve", "compound-growth-curve",
        {"title": "THE EXPONENTIAL SNOWBALL EFFECT", "monthlyDeposit": "$500 / Month", "annualRate": "9.5% S&P 500 Historical", "terminalCompound": 924500, "terminalCash": 180000},
        112.0, 126.0
    )
    add_sfx("chime", 121.0)
    add_broll("broll_phone_investing", 125.0, 137.0)
    add_sfx("pop", 138.0)
    add_broll("broll_cash_count", 140.0, 152.0)

    # --- ACT 4: THE OWNERSHIP ECONOMY (2:35 - 3:20) ---
    add_sfx("impact", 155.0)
    add_motion_graphics(
        "mg_wealth_flywheel", "wealth-flywheel",
        {"title": "EXPONENTIAL WEALTH FLYWHEEL", "mode": "wealth"},
        156.0, 170.0
    )
    add_broll("broll_skyline", 157.0, 169.0)
    add_sfx("whoosh", 170.0)
    add_motion_graphics(
        "mg_banking_push", "banking-notification",
        {"headline": "Direct Deposit Received", "source": "VOO Quarterly Dividend Payout • Vanguard", "depositAmount": 4250, "newNetWorth": 485000, "badge": "100% PASSIVE CASHFLOW"},
        172.0, 186.0
    )
    add_broll("broll_desk", 172.0, 184.0)
    add_sfx("chime", 185.0)
    add_broll("broll_wallstreet", 188.0, 199.0)

    # --- ACT 5: THE 4-PILLAR PLAYBOOK (3:20 - 4:00) ---
    add_sfx("impact", 200.0)
    add_motion_graphics(
        "mg_portfolio_donut", "portfolio-donut",
        {"title": "THE 4-PILLAR PORTFOLIO", "subtitle": "ASYMMETRIC ALLOCATION BLUEPRINT", "totalValuation": 500000},
        201.0, 220.0
    )
    add_broll("broll_phone_investing", 202.0, 212.0)
    add_sfx("whoosh", 213.0)
    add_broll("broll_mindful", 215.0, 226.0)
    add_motion_graphics(
        "mg_process_flow", "horizontal-process-flow",
        {"title": "THE 4-STEP WEALTH EXECUTION PLAYBOOK", "subtitle": "DEFENSE • INDEX CORE • ASSETS • SKILL EQUITY", "activeStep": 2},
        222.0, 238.0
    )
    add_sfx("chime", 227.0)
    add_broll("broll_walk", 228.0, min(duration, 240.0))
    add_motion_graphics(
        "mg_freedom_kpi", "metric-reveal",
        {"title": "FINANCIAL INDEPENDENCE HORIZON", "label": "FREEDOM TIMELINE (DISCIPLINED INVESTING)", "metric": "100%", "delta": "TIME FREEDOM ACHIEVED"},
        242.0, 265.0
    )
    add_sfx("impact", min(duration - 1.0, 238.0))

    # --- BACKGROUND MUSIC TRACK ---
    edits.append({
        "action": "audio",
        "isBgm": True,
        "sourceUrl": "chill-bgm.mp3",
        "volume": 20,
        "ducking": True,
        "ducking_db": -14.0,
        "fade_in": 1.5,
        "fade_out": 2.5
    })

    print(f"      Generated {len(edits)} synced EDL timeline operations.")
    return edits

def register_project_in_database(
    video_path: str,
    duration: float,
    transcript_map: Dict[str, Any],
    edits: List[Dict[str, Any]],
    title: str = "The 4 Immutable Laws of Wealth (16:9 Faceless Masterpiece)"
):
    print("[7/7] 🗄️ Registering completed video in local SQLite database for Studio Editor...")
    db_path = os.path.join(ROOT_DIR, "apps/api/dev.db")
    if not os.path.exists(db_path):
        print("      dev.db not found, skipping SQLite registration.")
        return

    import uuid
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Find or create default user
    cursor.execute("SELECT id FROM users LIMIT 1")
    user_row = cursor.fetchone()
    if user_row:
        user_id = user_row[0]
    else:
        user_id = str(uuid.uuid4()).replace("-", "")
        cursor.execute(
            "INSERT INTO users (id, clerk_id, email, created_at) VALUES (?, ?, ?, datetime('now'))",
            (user_id, "user_default", "finance_creator@example.com")
        )

    job_id = str(uuid.uuid4()).replace("-", "")
    public_url = f"/finance_4min_16x9.mp4"
    settings_json = json.dumps({
        "duration": f"{duration:.2f}",
        "aspect_ratio": "16:9",
        "niche": "finance",
        "style": "faceless_explainer"
    })
    edl_json = json.dumps(edits)

    cursor.execute(
        """
        INSERT INTO video_jobs (
            id, user_id, title, source_url, rendered_url, video_type, status,
            edit_decision_list, settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'FACELESS_SHORT', 'COMPLETED', ?, ?, datetime('now'), datetime('now'))
        """,
        (job_id, user_id, title, public_url, public_url, edl_json, settings_json)
    )
    conn.commit()
    conn.close()
    print(f"      ✅ Project registered in database with ID: {job_id}")
    print(f"      🔗 Open in editor: http://localhost:3000/dashboard/editor/{job_id}")
    return job_id

def main():
    start_total = time.time()
    audio_mp3 = f"{TEMP_DIR}/speech.mp3"
    audio_wav = f"{TEMP_DIR}/speech.wav"
    raw_video = f"{TEMP_DIR}/base_canvas_16_9.mp4"
    ass_subs = f"{TEMP_DIR}/subtitles_16_9.ass"
    bg_video = os.path.join(ROOT_DIR, "media_temp/finance_video/assets/ticker_bg.mp4")

    # Step 1: Voiceover Generation
    duration = asyncio.run(generate_speech(audio_mp3, audio_wav))

    # Step 2: Base 16:9 Canvas Creation
    create_base_canvas_16x9(duration, audio_wav, raw_video, bg_video)

    # Step 3: Transcription with faster-whisper
    print("[3/7] 📝 Transcribing with faster-whisper for word-level sync...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(audio_wav)
    print(f"      Extracted {len(timestamp_map)} word-accurate chunks across 4 minutes.")

    # Step 4: ASS Subtitles for 16:9 Widescreen
    print("[4/7] ⚡ Generating 16:9 widescreen ASS subtitles...")
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=ass_subs,
        font_size=46,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000E6FF",
        caption_preset="minimal_boxed",
        aspect_ratio="16:9",
        is_faceless=True
    )

    # Step 5: B-Roll & EDL Assembly
    broll_map = copy_broll_assets(f"{TEMP_DIR}/assets")
    edits = build_edit_decision_list(duration, broll_map)

    # Step 6: Render Complete Video Pipeline (16:9 Widescreen)
    print("[6/7] 🚀 Rendering complete video pipeline (16:9 FFmpeg + Overlays + SFX + BGM)...")
    render_start = time.time()
    rendered_path = render_video_pipeline(
        raw_video_path=raw_video,
        output_mp4_path=OUTPUT_VIDEO,
        subtitle_ass_path=ass_subs,
        broll_map=broll_map,
        edits=edits,
        timestamp_map=timestamp_map,
        settings={
            "aspect_ratio": "16:9",
            "USE_GRANULAR_OVERLAYS": True,
            "continuous_composition": True,
            "caption_preset": "minimal_boxed"
        }
    )
    render_elapsed = time.time() - render_start
    print(f"      Render completed in {render_elapsed:.1f}s.")

    # Copy to public folder for direct browser streaming and editor loading
    shutil.copyfile(rendered_path, PUBLIC_WEB_VIDEO)
    print(f"      Copied to public asset path: {PUBLIC_WEB_VIDEO}")

    # Step 7: Register in Database
    job_id = register_project_in_database(
        video_path=PUBLIC_WEB_VIDEO,
        duration=duration,
        transcript_map=timestamp_map,
        edits=edits
    )

    total_time = time.time() - start_total
    file_mb = os.path.getsize(rendered_path) / 1024 / 1024

    print("\n" + "="*70)
    print("🎬 4-MINUTE 16:9 FINANCE FACELESS MASTERPIECE GENERATED!")
    print(f"⏱️ Exact Duration: {duration:.2f}s (~{int(duration//60)}m {int(duration%60)}s)")
    print(f"📐 Aspect Ratio: 16:9 (1920x1080 Widescreen Full HD)")
    print(f"💾 File Size: {file_mb:.2f} MB")
    print(f"📁 MP4 Path: {os.path.abspath(rendered_path)}")
    print(f"🌐 Public Stream: {PUBLIC_WEB_VIDEO}")
    if job_id:
        print(f"🛠️ Studio Editor URL: http://localhost:3000/dashboard/editor/{job_id}")
    print(f"⚡ Total Pipeline Execution Time: {total_time:.1f}s")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
