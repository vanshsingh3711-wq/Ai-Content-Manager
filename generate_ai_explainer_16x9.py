import os
import sys
import json
import time
import asyncio
import subprocess
import shutil
from typing import Dict, List, Any
from dotenv import load_dotenv

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
# Ensure sufficient disk space for Remotion and FFmpeg temp files
os.environ["TMPDIR"] = os.path.join(ROOT_DIR, "media_temp/tmp")
os.environ["TEMP"] = os.environ["TMPDIR"]
os.environ["TMP"] = os.environ["TMPDIR"]
os.makedirs(os.environ["TMPDIR"], exist_ok=True)

sys.path.append(os.path.join(ROOT_DIR, "apps/worker"))
os.chdir(os.path.join(ROOT_DIR, "apps/worker"))

from services.transcriber import transcribe_and_compress
from services.subtitle_generator import generate_ass_subtitles
from services.remotion_renderer import render_motion_graphic

# Premium 2.5-Minute 16:9 Tech & AI Explainer Script
SCRIPT_TEXT = """In 2023, artificial intelligence was a novelty—a conversational chatbot waiting for a prompt.
Today, we have crossed the event horizon into the agentic era.
Software is no longer passive. Modern AI agents have terminal access, persistent memory, and the autonomy to plan, code, test, and deploy entire systems without human supervision.
The marginal cost of cognitive reasoning is collapsing by ten thousand x.
Let that sink in: for the first time in human history, intelligence is scaling exponentially while its cost drops toward zero.
Why are autonomous agents replacing traditional monolithic models?
Because a single large language model is fragile. It hallucinates, loses context, and operates in isolation.
In contrast, an agentic architecture runs on a closed feedback loop: Perception, Recursive Reasoning, Tool Invocation, and Deterministic Verification.
When an agent writes code that fails a unit test, it doesn't give up—it inspects the stack trace, rewrites the syntax, and verifies the build until it passes.
Instead of one human managing ten tasks, one human orchestrates a synchronized swarm of specialized agents running twenty-four seven.
This shift is triggering an economic earthquake across the tech landscape.
For twenty years, enterprise software moats were built on armies of junior engineers, manual ticket queues, and endless sprint cycles.
That entire paradigm is evaporating.
Today, a solo technical founder leveraging autonomous agent swarms can build, ship, and scale infrastructure that previously required a hundred-person venture-backed enterprise.
Software is no longer an asset that depreciates; it is a fluid, self-healing cognitive engine.
The winners of the next decade will not be those who memorize programming syntax or churn out repetitive workflows.
The winners will be the systems architects—the individuals who master cognitive leverage.
The playbook is simple:
First: Automate the diagnostic audit to identify friction.
Second: Deploy domain-specific agents with scoped permissions.
Third: Anchor them to deterministic verification gates.
And fourth: Direct the machine, while letting autonomous compute compound your output.
Stop doing the manual work. Architect the system that does the work for you."""

OUTPUT_VIDEO = os.path.join(ROOT_DIR, "youtube_ai_explainer_16x9_master.mp4")
PUBLIC_WEB_VIDEO = os.path.join(ROOT_DIR, "apps/web/public/ai_explainer_16x9.mp4")
TEMP_DIR = os.path.join(ROOT_DIR, "media_temp/ai_video")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f"{TEMP_DIR}/assets", exist_ok=True)
os.makedirs(f"{TEMP_DIR}/mg_overlays", exist_ok=True)

async def generate_speech(audio_mp3: str, audio_wav: str) -> float:
    print("[1/7] 🎙️ Generating crisp neural voiceover with edge-tts (ChristopherNeural)...")
    import edge_tts
    # Paced delivery with natural pauses
    communicate = edge_tts.Communicate(SCRIPT_TEXT, "en-US-ChristopherNeural", rate="+3%", pitch="+0Hz")
    await communicate.save(audio_mp3)

    # Convert to 16kHz mono WAV for Whisper transcription & high quality master
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
    mins = int(duration // 60)
    secs = int(duration % 60)
    print(f"      Voiceover duration: {duration:.2f}s (~{mins}m {secs}s).")
    return duration

def create_base_canvas_16x9(duration: float, audio_wav: str, out_raw: str, bg_video: str = None):
    print(f"[2/7] 🎨 Building 1920x1080 16:9 base canvas ({duration:.2f}s)...")
    if bg_video and os.path.exists(bg_video) and os.path.getsize(bg_video) > 10000:
        filter_str = (
            "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
            "eq=brightness=-0.25:contrast=1.3:saturation=0.8,"
            "drawgrid=width=120:height=120:thickness=1:color=white@0.025,"
            "drawbox=x=0:y=0:w=1920:h=1080:color=black@0.40:t=fill"
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
        # High-tech cyberpunk dark canvas with ambient cyan/purple glow grid
        filter_str = (
            "color=c=#030712:s=1920x1080:r=30,"
            "drawgrid=width=80:height=80:thickness=1:color=white@0.02,"
            "drawgrid=width=320:height=320:thickness=2:color=#00e5ff@0.04"
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
    print(f"      16:9 Base canvas generated: {out_raw}")

def prepare_broll_pool(target_dir: str) -> Dict[str, str]:
    print("[3/7] 📦 Resolving high-resolution 16:9 tech B-rolls...")
    source_pool = {
        "broll_supercomputers": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_supercomputers.mp4"),
        "broll_analysts": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_analysts.mp4"),
        "broll_skyline": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_skyline.mp4"),
        "broll_desk": os.path.join(ROOT_DIR, "apps/web/public/demo_media/desk.mp4"),
        "broll_walk": os.path.join(ROOT_DIR, "apps/web/public/demo_media/walk.mp4"),
        "broll_mindful": os.path.join(ROOT_DIR, "apps/web/public/demo_media/mindful.mp4"),
        "broll_phone": os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_phone_investing.mp4"),
    }
    resolved = {}
    for k, src in source_pool.items():
        dst = os.path.join(target_dir, f"{k}.mp4")
        if os.path.exists(src) and os.path.getsize(src) > 1000:
            if not os.path.exists(dst):
                try:
                    shutil.copyfile(src, dst)
                except Exception:
                    pass
            resolved[k] = dst if os.path.exists(dst) else src
    print(f"      Mapped {len(resolved)} high-res tech clips.")
    return resolved

def render_all_motion_graphics(mg_list: List[Dict[str, Any]], output_dir: str) -> Dict[str, str]:
    print(f"[4/7] ⚛️ Pre-rendering {len(mg_list)} Remotion motion graphics overlays (1920x1080 ProRes 4444)...")
    rendered_map = {}
    for idx, item in enumerate(mg_list, 1):
        mg_id = item["id"]
        comp_id = item["composition_id"]
        props = item["props"]
        dur = item["end"] - item["start"]
        frames = max(1, int(dur * 30))
        out_file = os.path.join(output_dir, f"{mg_id}.mov")

        print(f"      [{idx}/{len(mg_list)}] Rendering '{comp_id}' ({frames} frames, {dur:.1f}s)...")
        t0 = time.time()
        res = render_motion_graphic(
            composition_id=comp_id,
            props=props,
            duration_frames=frames,
            fps=30,
            width=1920,
            height=1080,
            output_path=out_file
        )
        elapsed = time.time() - t0
        if res and os.path.exists(res):
            mb = os.path.getsize(res) / (1024 * 1024)
            print(f"          ✅ Rendered in {elapsed:.1f}s ({mb:.1f} MB) -> {os.path.basename(res)}")
            rendered_map[mg_id] = res
        else:
            print(f"          ⚠️ Failed to render Remotion composition {comp_id}")
    return rendered_map

def composite_final_video(
    base_video: str,
    output_video: str,
    brolls: List[Dict[str, Any]],
    motion_graphics: List[Dict[str, Any]],
    rendered_mg_map: Dict[str, str],
    ass_subs: str,
    bgm_path: str,
    total_duration: float
):
    print("[6/7] 🎬 Compositing complete master (Base + B-Rolls + Motion Graphics Overlays + Subtitles + BGM)...")
    
    # Build FFmpeg input list and filter_complex graph
    inputs = ["-i", base_video]  # Input 0: base canvas with voiceover
    current_idx = 1

    # Add B-roll inputs
    broll_inputs = []
    for b in brolls:
        inputs.extend(["-i", b["path"]])
        broll_inputs.append((current_idx, b))
        current_idx += 1

    # Add Motion Graphics MOV inputs
    mg_inputs = []
    for mg in motion_graphics:
        mg_file = rendered_mg_map.get(mg["id"])
        if mg_file and os.path.exists(mg_file):
            inputs.extend(["-i", mg_file])
            mg_inputs.append((current_idx, mg))
            current_idx += 1

    # Add BGM input if exists
    has_bgm = bgm_path and os.path.exists(bgm_path)
    bgm_idx = None
    if has_bgm:
        inputs.extend(["-stream_loop", "-1", "-i", bgm_path])
        bgm_idx = current_idx
        current_idx += 1

    # Filter graph construction
    filter_parts = []
    last_v = "0:v"

    # 1. Overlay B-rolls onto base canvas
    for inp_idx, b in broll_inputs:
        scaled_label = f"broll_scaled_{inp_idx}"
        out_v = f"v_broll_{inp_idx}"
        b_dur = b["end"] - b["start"]
        # Scale & crop to 1920x1080, trim
        filter_parts.append(
            f"[{inp_idx}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
            f"setpts=PTS-STARTPTS,trim=duration={b_dur:.3f}[{scaled_label}]"
        )
        filter_parts.append(
            f"[{last_v}][{scaled_label}]overlay=0:0:enable='between(t,{b['start']:.2f},{b['end']:.2f})'[{out_v}]"
        )
        last_v = out_v

    # 2. Overlay Motion Graphics MOV files with Alpha Channel on top
    for inp_idx, mg in mg_inputs:
        out_v = f"v_mg_{inp_idx}"
        mg_dur = mg["end"] - mg["start"]
        # Delay the motion graphic stream to start at mg["start"]
        filter_parts.append(
            f"[{inp_idx}:v]setpts=PTS-STARTPTS+{mg['start']:.2f}/TB[{inp_idx}_delayed]"
        )
        filter_parts.append(
            f"[{last_v}][{inp_idx}_delayed]overlay=0:0:enable='between(t,{mg['start']:.2f},{mg['end']:.2f})':format=auto[{out_v}]"
        )
        last_v = out_v

    # 3. Burn Subtitles (ASS format)
    # Escape path for FFmpeg subtitles filter
    escaped_ass = ass_subs.replace("\\", "/").replace(":", "\\:")
    final_v = "v_final"
    filter_parts.append(f"[{last_v}]subtitles='{escaped_ass}'[{final_v}]")

    # 4. Audio mixing (Voiceover + BGM with ducking)
    if has_bgm:
        filter_parts.append(
            f"[{bgm_idx}:a]volume=0.18,atrim=0:{total_duration:.2f},asetpts=PTS-STARTPTS[bgm_mix]"
        )
        filter_parts.append(
            f"[0:a][bgm_mix]amix=inputs=2:duration=first:dropout_transition=2[a_final]"
        )
        audio_map = "-map [a_final]"
    else:
        audio_map = "-map 0:a"

    filter_complex_str = ";\n".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex_str,
        "-map", f"[{final_v}]",
        audio_map.split()[0], audio_map.split()[1],
        "-t", f"{total_duration:.3f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        output_video
    ]

    print("      Executing FFmpeg master assembly command...")
    subprocess.run(cmd, check=True)
    print(f"      ✅ Master MP4 rendered: {output_video}")

def main():
    start_all = time.time()
    audio_mp3 = f"{TEMP_DIR}/speech.mp3"
    audio_wav = f"{TEMP_DIR}/speech.wav"
    raw_video = f"{TEMP_DIR}/base_canvas_16x9.mp4"
    ass_subs = f"{TEMP_DIR}/subtitles.ass"
    mg_dir = f"{TEMP_DIR}/mg_overlays"
    bg_video = os.path.join(ROOT_DIR, "media_temp/finance_video/assets/broll_supercomputers.mp4")
    bgm_path = os.path.join(ROOT_DIR, "apps/web/public/assets/audio/chill-bgm.mp3")

    # Step 1: Voiceover
    duration = asyncio.run(generate_speech(audio_mp3, audio_wav))

    # Step 2: Base video
    create_base_canvas_16x9(duration, audio_wav, raw_video, bg_video)

    # Step 3: B-rolls
    broll_pool = prepare_broll_pool(f"{TEMP_DIR}/assets")

    # Step 4: Whisper Transcription
    print("[4/7] 📝 Transcribing with faster-whisper for word-level sync...")
    bracketed_transcript, timestamp_map = transcribe_and_compress(audio_wav)
    print(f"      Extracted {len(timestamp_map)} word-accurate chunks.")

    # Step 5: Subtitles
    print("[5/7] ⚡ Generating high-legibility 16:9 ASS subtitles...")
    generate_ass_subtitles(
        timestamp_map=timestamp_map,
        output_ass_path=ass_subs,
        font_size=42,
        primary_color="&H00FFFFFF",
        highlight_color="&H0000FFFF"
    )

    # Step 6: Define Motion Graphics Overlays & B-Rolls
    motion_graphics_list = [
        {
            "id": "mg_1_reasoning_cost",
            "composition_id": "metric-reveal",
            "props": {
                "label": "MARGINAL COST OF REASONING",
                "metric": "10,000x",
                "delta": "-99.9% Collapse",
                "personality": "energetic"
            },
            "start": 18.0,
            "end": 26.0,
        },
        {
            "id": "mg_2_agent_loop",
            "composition_id": "horizontal-process-flow",
            "props": {
                "title": "THE AUTONOMOUS AGENT LOOP",
                "subtitle": "PERCEIVE • REASON • ACT • VERIFY",
                "activeStep": 2,
                "personality": "premium"
            },
            "start": 44.0,
            "end": 54.0,
        },
        {
            "id": "mg_3_showdown",
            "composition_id": "showdown-duel",
            "props": {
                "title": "ARCHITECTURAL SHOWDOWN",
                "wagerAmount": "REASONING COMPARISON",
                "timeframe": "MONOLITH VS SWARM",
                "side1Title": "MONOLITHIC CHATBOT",
                "side1Sub": "Single Prompt • Static Output",
                "side1Fee": "High Hallucination Rate",
                "side2Title": "AUTONOMOUS SWARM",
                "side2Sub": "Recursive Loop • Self-Healing",
                "side2Fee": "Deterministic Execution",
                "personality": "energetic"
            },
            "start": 62.0,
            "end": 74.0,
        },
        {
            "id": "mg_4_split_slider",
            "composition_id": "split-slider-comparison",
            "props": {
                "title": "ENTERPRISE SCALING PARADIGM",
                "badge": "⚡ SCALING TRANSFORMATION",
                "leftTag": "LEGACY DEV TEAM",
                "leftTitle": "100-Person Enterprise",
                "leftMetric": "100 ENGINEERS",
                "leftDetail": "Manual ticket queues, endless sprint cycles, high coordination overhead.",
                "leftIcon": "🏢",
                "rightTag": "AUTONOMOUS SWARM",
                "rightTitle": "Solo Technical Founder",
                "rightMetric": "1 FOUNDER",
                "rightDetail": "Swarm of specialized agents running continuous integration & deployment 24/7.",
                "rightIcon": "⚡",
                "sliderStart": 70,
                "sliderEnd": 50,
                "synthesis": "TRANSFORMATION: Autonomous agents compress 100-person output to a single architect.",
                "personality": "premium"
            },
            "start": 86.0,
            "end": 98.0,
        },
        {
            "id": "mg_5_pyramid",
            "composition_id": "hierarchy-pyramid",
            "props": {
                "title": "THE COGNITIVE LEVERAGE STACK",
                "subtitle": "THE 3-TIER AGENTIC ARCHITECTURE",
                "level1": "1. GLOBAL COMPUTE & FOUNDATION MODELS",
                "level2": "2. SPECIALIZED RECURSIVE AGENTS",
                "level3": "3. HUMAN SYSTEMS ARCHITECT",
                "personality": "premium"
            },
            "start": 108.0,
            "end": 118.0,
        },
        {
            "id": "mg_6_checklist",
            "composition_id": "tactile-checklist-stamp",
            "props": {
                "title": "AUTONOMOUS EXECUTION AUDIT",
                "badge": "📋 PRODUCTION CRITERIA",
                "item1Text": "Deterministic Verification Gates",
                "item1Status": "pass",
                "item2Text": "Self-Healing Recursive Debugging",
                "item2Status": "pass",
                "item3Text": "24/7 Agent Swarm Orchestration",
                "item3Status": "pass",
                "verdictText": "VERDICT: 10X COGNITIVE LEVERAGE",
                "verdictStatus": "pass",
                "synthesis": "AUDIT RESULT: Autonomous systems achieve complete operational scalability.",
                "personality": "premium"
            },
            "start": 124.0,
            "end": 136.0,
        }
    ]

    brolls_schedule = [
        {"path": broll_pool["broll_supercomputers"], "start": 3.0, "end": 10.0},
        {"path": broll_pool["broll_desk"], "start": 11.0, "end": 17.5},
        {"path": broll_pool["broll_skyline"], "start": 27.0, "end": 35.0},
        {"path": broll_pool["broll_analysts"], "start": 36.0, "end": 43.0},
        {"path": broll_pool["broll_supercomputers"], "start": 55.0, "end": 61.0},
        {"path": broll_pool["broll_desk"], "start": 75.0, "end": 85.0},
        {"path": broll_pool["broll_phone"], "start": 99.0, "end": 107.0},
        {"path": broll_pool["broll_skyline"], "start": 119.0, "end": 123.5},
        {"path": broll_pool["broll_walk"], "start": 137.0, "end": duration},
    ]

    # Pre-render motion graphics to ProRes MOV files
    rendered_mg = render_all_motion_graphics(motion_graphics_list, mg_dir)

    # Composite master video
    composite_final_video(
        base_video=raw_video,
        output_video=OUTPUT_VIDEO,
        brolls=brolls_schedule,
        motion_graphics=motion_graphics_list,
        rendered_mg_map=rendered_mg,
        ass_subs=ass_subs,
        bgm_path=bgm_path,
        total_duration=duration
    )

    # Copy to public web stream
    if os.path.exists(OUTPUT_VIDEO):
        shutil.copyfile(OUTPUT_VIDEO, PUBLIC_WEB_VIDEO)
        print(f"      Copied to public stream: {PUBLIC_WEB_VIDEO}")

    total_time = time.time() - start_all
    size_mb = os.path.getsize(OUTPUT_VIDEO) / 1024 / 1024
    print("\n" + "=" * 60)
    print(f"🎉 MASTER VIDEO SUCCESSFULLY GENERATED!")
    print(f"📁 Video Location: {OUTPUT_VIDEO}")
    print(f"🌐 Public Stream:  {PUBLIC_WEB_VIDEO}")
    print(f"⏱️ Duration:       {duration:.2f} seconds (~{int(duration//60)}m {int(duration%60)}s)")
    print(f"💾 File Size:      {size_mb:.2f} MB")
    print(f"⚡ Total Runtime:  {total_time:.1f} seconds")
    print("=" * 60)

if __name__ == "__main__":
    main()
