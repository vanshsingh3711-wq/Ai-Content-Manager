<div align="center">

<img src="./docs/assets/ai_director_brand_banner.jpg" alt="AI Director — Autonomous Video Creation Platform" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />

<br />
<br />

# AI DIRECTOR™
### Autonomous AI Video Director & Non-Linear Editing Platform
### Auto-Edit Videos for Creators from Audio, Script, or Raw Video

[![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Remotion](https://img.shields.io/badge/Remotion-0B84F3?style=for-the-badge&logo=remotion&logoColor=white)](https://www.remotion.dev/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg_Compositor-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Auto-edit complete video masterpieces from voice notes, written scripts, or raw camera footage in 60s.</b><br />
  A distributed, multi-agent AI video editing ecosystem engineered for high-retention TikTok, YouTube Shorts, Reels, and widescreen explainers.
</p>

[✨ Experience the Platform](#-product-tour) •
[🎛️ 3 Creation Modalities](#️-three-universal-creation-modalities) •
[⚡ Key Capabilities](#-core-capabilities) •
[🏛 System Architecture](#-system-architecture--diagrams) •
[🎬 Studio Timeline Editor](#-interactive-timeline-editor) •
[🔄 13-Stage Pipeline](#-deep-dive-13-stage-autonomous-pipeline) •
[🚀 Quickstart](#-quickstart-guide) •
[⚙️ Configuration](#-configuration--environment-variables)

---

</div>

<br />

## 🌟 Executive Summary

**AI Director** is an autonomous video directing and automated non-linear editing (NLE) platform. Built from the ground up to eliminate the manual bottleneck in digital video production, AI Director orchestrates a cognitive swarm of specialized LLM director agents, speech-to-text acoustic processors, computer vision models, procedural sound effect synthesizers, and hardware-accelerated video compositing engines.

Whether starting from **audio voiceovers**, **written scripts**, or **raw multi-gigabyte camera footage**, AI Director automatically cuts silences, tracks faces, sources contextually matched 4K B-roll, renders Remotion motion graphics, layers kinetic karaoke subtitles, and exports production-ready 4K video formatted for global distribution.

---

## 📸 Product Tour

<div align="center">
  <h3>Hero Showcase & Real-Time Conversion Engine</h3>
  <img src="./docs/assets/landing_hero.png" alt="AI Director Landing Hero" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>The landing experience featuring the 3 universal creation pathways (Audio, Script, Raw Video), dynamic 3D mobile simulation, and real-time hook analytics (+84% watch time, 99.4 hook score).</i></p>
</div>

<br />

<div align="center">
  <h3>The 3 Universal Creator Modalities in Action</h3>
  <img src="./docs/assets/landing_modalities.png" alt="3 Universal Creation Modalities" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>Direct ingestion matrix supporting Audio Ingest (Podcasts & Voice Notes), Script Ingest (Ideas, Prompts, Blogs), and Raw Video Ingest (Footage & Talking Heads).</i></p>
</div>

<br />

<div align="center">
  <h3>Autonomous Multi-Track Studio Editor (9:16 Mobile Preset)</h3>
  <img src="./docs/assets/studio_editor_viral.png" alt="AI Director Studio Timeline Editor" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>Full-fledged browser NLE featuring 4-track timeline (Video, Lo-Fi Audio, B-roll Overlays, Kinetic Captions), media drawers, player monitor, and property inspector.</i></p>
</div>

<br />

<div align="center">
  <h3>Widescreen 16:9 YouTube & Explainer Mode</h3>
  <img src="./docs/assets/studio_editor_explainer.png" alt="AI Director 16:9 Widescreen Editor" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>Directing widescreen 16:9 documentaries and technical explainers with embedded Remotion motion graphics, data charts, and dynamic safe zones.</i></p>
</div>

<br />

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <h4>GPU Worker Pipeline & Live Queue</h4>
      <img src="./docs/assets/dashboard_queue.png" alt="GPU Worker Pipeline" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>Real-time execution telemetry, distributed Celery task logs, and frame-by-frame Remotion/FFmpeg rendering monitors.</i></p>
    </td>
    <td width="50%" align="center">
      <h4>Omnichannel Social Publishing Hub</h4>
      <img src="./docs/assets/dashboard_socials.png" alt="Social Publishing Hub" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>Enterprise OAuth 2.0 gateway enabling 1-click scheduled publishing to YouTube, Instagram Reels, TikTok, and LinkedIn.</i></p>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <h4>Executive Video Asset Library</h4>
      <img src="./docs/assets/dashboard_videos.png" alt="Video Asset Library" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>Centralized media repository cataloging faceless masterpieces, talking-head cuts, aspect ratios, and render artifacts.</i></p>
    </td>
    <td width="50%" align="center">
      <h4>Operations Dashboard</h4>
      <img src="./docs/assets/dashboard_overview.png" alt="Operations Dashboard" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>High-level cockpit showing pipeline status, unsaved drafts, total render cycles, and API health diagnostics.</i></p>
    </td>
  </tr>
</table>

---

## 🎛️ Three Universal Creation Modalities

AI Director is built around three distinct creative starting points, allowing creators to produce videos regardless of how their content begins:

### 1. 🎙️ Audio-First Ingestion (`Audio → Complete Video`)
*Turn podcasts, voice memos, and spoken recordings into viral video shorts.*
- **Ideal For**: Podcasters, voiceover artists, musicians, speech authors, audiobook creators.
- **Accepted Inputs**: `MP3`, `WAV`, `M4A`, `AAC`, voice memos, raw mic stems.
- **Under The Hood**:
  - `transcriber.py`: Runs `faster-whisper` (int8 quantized) to extract word-level timestamps down to the millisecond.
  - `silence_detector.py` & `speech_pruner.py`: Analyzes dB thresholds (`-30dB`) and breath envelopes using voice activity detection (VAD), excising dead air without clipping speech transients.
  - `beat_analyzer.py`: Detects acoustic transients, tempo, and vocal cadence peaks to place visual cuts on musical downbeats.
  - `broll_planner.py`: Slices narration into semantic chunks and queries Pexels for 4K contextual B-roll.
  - `subtitle_generator.py`: Generates kinetic ASS karaoke subtitles styled to pop on every spoken syllable.
  - `audio_sfx_synthesizer.py`: Procedurally synthesizes whooshes, risers, and bass drops aligned with acoustic inflection points.

### 2. 📝 Script-First Ingestion (`Script → Faceless Masterpiece`)
*Turn written ideas, outlines, and prompts into high-production faceless videos.*
- **Ideal For**: Faceless YouTube creators, newsletter publishers, tech educators, financial influencers.
- **Accepted Inputs**: Raw text, Markdown, bullet-point outlines, prompts, article URLs.
- **Under The Hood**:
  - `script_chunker.py`: Deconstructs written text into hook, body arguments, contrast moments, and call-to-action blocks.
  - `director_taxonomy.py` & Multi-Agent Swarm: Assigns thematic visual treatments based on topic (Tech, Finance, Psychology, Education).
  - `motion_graphic_planner.py`: Instantiates animated Remotion React components (financial candlestick charts, isometric server architectures, Pareto curves, decision trees).
  - `web_evidence_capture.py`: Headless Chromium bot visits real-time web sources (GitHub trending, live financial graphs, Wikipedia, news) and records smooth screen-capture B-roll.
  - `compositor.py`: Merges AI voiceover or background Lo-Fi music, transitions, and kinetic typography into a widescreen (16:9) or vertical (9:16) export.

### 3. 📹 Raw Video Footage Ingestion (`Raw Footage → 10 Viral Shorts`)
*Turn long recordings and webcam footage into high-hook social clips.*
- **Ideal For**: Vloggers, YouTubers, course instructors, interviewers, remote podcast hosts.
- **Accepted Inputs**: `MP4`, `MOV`, `WebM`, ProRes, 4K 60fps smartphone/camera files.
- **Under The Hood**:
  - `visual_analysis/service.py`: Computes OpenCV color histogram deltas to find camera scene cuts.
  - MediaPipe Pose & Face Tracking: Calculates real-time 2D bounding boxes for speaker faces and locks them inside platform safe zones (avoiding TikTok/Instagram action buttons).
  - `depth_matting.py`: Estimates neural depth maps to isolate foreground speakers, allowing titles, charts, and graphics to float behind the presenter without green screens.
  - Non-Destructive Silence Cut: Automatically eliminates pauses and re-times footage for high-tempo retention.
  - `nle_exporter.py`: Allows one-click export to Adobe Premiere Pro (XML), Final Cut Pro (FCPXML), or DaVinci Resolve (EDL).

---

## ⚡ Core Capabilities

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                AI DIRECTOR CORE PILLARS                                │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 🤖 MULTI-AGENT SWARM     │ 🎙️ ACOUSTIC INTELLIGENCE  │ 👁️ VISUAL & SPATIAL ENGINE      │
│ • B-Roll Narrative Scout │ • Faster-Whisper (Word)  │ • Face Tracking Safe-Zones       │
│ • Motion Graphic Director│ • Silero VAD Silence Cut │ • Green-screenless Depth Matting │
│ • Character Animator     │ • Procedural SFX Synth   │ • OpenCV Scene Change Detector   │
│ • Master Resolver & SFX  │ • Beat & Cadence Matcher │ • Live Web Evidence Capture Bot  │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ 🎬 PRO STUDIO NLE        │ ⚡ DISTRIBUTED WORKERS    │ 🚀 LOSSLESS EXPORT & SYNC        │
│ • React 19 + Canvas WebGL│ • FastAPI Async I/O      │ • Native 4K FFmpeg Master Render │
│ • Word-Level ASS Karaoke │ • Celery + Upstash Redis │ • Premiere Pro XML / FCPXML      │
│ • Natural Language Edits │ • Cloudflare R2 / S3 CDN │ • DaVinci Resolve EDL Export     │
│ • Full History Undo/Redo │ • Neon Serverless SQL    │ • 1-Click Social OAuth Dispatch  │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 1. Multi-Agent AI Director Swarm
Instead of relying on a single brittle prompt, AI Director employs a collaborative council of specialized LLM agents (DeepSeek Chat / OpenRouter):
- **B-Roll Planner**: Analyzes narrative semantic beats and dispatches precision keyword queries to Pexels and high-definition asset libraries.
- **Motion Graphic Planner**: Detects abstract conceptual moments (statistics, architectures, comparisons, trade-offs) and instantiates high-impact Remotion motion components.
- **Character & Avatar Planner**: Coordinates talking avatars, camera focal lengths, and reaction inserts.
- **Master Blueprint Resolver**: Resolves layer collisions, balances visual density, ensures pacing rules, and emits a single, strictly typed Edit Decision Blueprint.
- **SFX & Sound Designer**: Analyzes acoustic energy transitions and injects synchronized whooshes, risers, bass impacts, and UI clicks.

### 2. Acoustic Intelligence & Smart Pruning
- **Sub-Word Timestamping**: Powered by `faster-whisper` (int8 quantized for real-time CPU/GPU transcription).
- **Aggressive Silence & Breath Deletion**: FFmpeg `silencedetect` paired with voice-activity detection (VAD) prunes awkward pauses and fillers with millisecond precision without audio clipping.
- **Cadence & Beat Matching**: Synchronizes B-roll cuts and transition triggers directly to voice emphasis peaks and background music rhythm.
- **Procedural SFX Synthesizer**: Generates dynamic audio assets on the fly (`audio_sfx_synthesizer.py`) when stock audio libraries lack the exact acoustic frequency required.

### 3. Visual Intelligence & Studio Matting
- **Face & Subject Centering**: OpenCV and MediaPipe detect active speakers, computing real-time tracking coordinates to guarantee human subjects never clip behind UI overlays or platform safe zones.
- **Depth Matting**: AI depth estimation isolates foreground subjects, allowing kinetic titles and motion graphics to float naturally *behind* the speaker without green screens.
- **Autonomous Web Evidence Capture**: Embedded headless Chromium bot (`fast_web_capture.mjs` / `web_evidence_capture.py`) scrapes real-time GitHub trending repositories, live financial graphs, breaking news headlines, and tweets, rendering them directly into dynamic video B-roll.

### 4. Professional Non-Linear Studio Timeline (Web NLE)
- **High-Performance Canvas / Remotion Player**: Zero-latency timeline scrubbing across multi-track audio, video, graphics, and subtitles.
- **AI Copilot (Natural Language Editing)**: Press <kbd>Cmd</kbd> + <kbd>K</kbd> to command the video: *"Make the font bolder"*, *"Add an animated line chart at second 4"*, or *"Split the clip at current playhead"*.
- **Lossless NLE Exporter**: Export your project directly into **Adobe Premiere Pro (XML)**, **Final Cut Pro (FCPXML)**, or **DaVinci Resolve (EDL)** for post-production finishing.

---

## 🏛 System Architecture & Diagrams

### High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer (Next.js 16 + React 19)"
        UI["Web App & Studio NLE<br/>(apps/web)"]
        STORE["Zustand Timeline Store<br/>+ IndexedDB Local Cache"]
        COPILOT_UI["AI Copilot Drawer<br/>(Cmd+K Natural Language)"]
        UI --- STORE
        UI --- COPILOT_UI
    end

    subgraph "API Gateway (FastAPI :8000)"
        API["apps/api/main.py"]
        AUTH["Clerk JWT Authentication"]
        COPILOT_API["Copilot Streaming Router<br/>(apps/api/routers/copilot.py)"]
        JOBS_API["Job Dispatch & Telemetry<br/>(apps/api/routers/jobs.py)"]
        VIDEOS_API["Video Management Router<br/>(apps/api/routers/videos.py)"]
        STORAGE_API["S3/R2 Presigned URLs<br/>(apps/api/routers/storage.py)"]
        
        API --> AUTH
        API --> COPILOT_API
        API --> JOBS_API
        API --> VIDEOS_API
        API --> STORAGE_API
    end

    subgraph "Data & Messaging Substrate"
        DB[(PostgreSQL / Neon<br/>SQLModel ORM)]
        REDIS["Upstash Redis<br/>(Message Broker & Celery Backend)"]
    end

    subgraph "Distributed Worker Engine (Celery)"
        WORKER["apps/worker/tasks/video_pipeline.py"]
        
        subgraph "Acoustic & Vision Pre-Processing"
            INGEST["Ingest & Audio Extraction"]
            WHISPER["Faster-Whisper STT<br/>(Word Timestamps)"]
            VAD["Silence & Breath Detector<br/>(FFmpeg silencedetect)"]
            VISION["Visual Analyzer<br/>(OpenCV + MediaPipe)"]
        end
        
        subgraph "AI Director Cognitive Swarm"
            DEEPSEEK["DeepSeek Reasoning Core<br/>(OpenRouter API)"]
            BROLL_PL["B-Roll Planner"]
            MG_PL["Motion Graphic Planner"]
            CHAR_PL["Character Planner"]
            RESOLVE["Master Blueprint Resolver"]
            SFX_PL["SFX & Music Planner"]
            VALID["Deterministic Linter & Validator"]
        end

        subgraph "Compositing & Post-Production"
            PEXELS["Pexels Video API / Web Bot"]
            ASS_GEN["ASS Subtitle Generator<br/>(Kinetic Karaoke Styles)"]
            REMOTION["Remotion React Engine<br/>(@ai-content-manager/motion)"]
            FFMPEG["FFmpeg Multi-Track Compositor<br/>(libx264, AAC, 60fps)"]
            NLE["NLE Exporter<br/>(FCPXML / Premiere XML)"]
        end
    end

    subgraph "Cloud Storage & Distribution"
        R2["Cloudflare R2 / AWS S3 CDN"]
        SOCIALS["YouTube / Instagram / TikTok / LinkedIn"]
    end

    UI -->|REST / SSE Streaming| API
    API -->|Read / Write| DB
    API -->|send_task| REDIS
    REDIS -->|Worker Task Consumption| WORKER

    WORKER --> INGEST --> WHISPER --> VAD --> VISION
    VISION --> DEEPSEEK
    DEEPSEEK --> BROLL_PL & MG_PL & CHAR_PL
    BROLL_PL & MG_PL & CHAR_PL --> RESOLVE --> SFX_PL --> VALID
    VALID --> PEXELS & ASS_GEN & REMOTION
    PEXELS & ASS_GEN & REMOTION --> FFMPEG
    FFMPEG --> R2
    FFMPEG --> NLE
    WORKER -->|Auto-Publish| SOCIALS
    WORKER -->|Status Webhook Update| API
```

<br />

### Autonomous Architecture & Data Flow Diagram

<div align="center">
  <img src="./docs/assets/diagram_autonomous_architecture.jpg" alt="Autonomous Reasoning Architecture" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>Figure 1: Autonomous Reasoning Architecture — Multimodal Ingestion, Vector Knowledge Core, Recursive Agent Loop, and Deterministic Compliance Gate.</i></p>
</div>

<br />

### Deconstructed Isometric Autonomous Agent Stack

<div align="center">
  <img src="./docs/assets/diagram_exploded_layer_stack.jpg" alt="The Autonomous Agent Stack" width="95%" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
  <p><i>Figure 2: Deconstructed 4-tier compute anatomy from foundational neural weights up to sandbox tool execution.</i></p>
</div>

<br />

### Architectural Trade-Offs & Capability Analysis

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <h4>System Architectural Fork Matrix</h4>
      <img src="./docs/assets/diagram_trilemma_tradeoff.jpg" alt="Architectural Bifurcation" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>Proprietary API Walled Gardens vs. Open-Weights Swarm Infrastructure.</i></p>
    </td>
    <td width="50%" align="center">
      <h4>Multimodal Engine Capability Radar</h4>
      <img src="./docs/assets/diagram_radar_spider_chart.jpg" alt="Engine Capability Radar" width="100%" style="border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      <p><i>Benchmarking latency, acoustic coherence, tracking precision, and visual aesthetic density.</i></p>
    </td>
  </tr>
</table>

---

## 🎬 Interactive Timeline Editor

The **Studio Editor** (`apps/web/app/dashboard/editor`) is a state-of-the-art web-based NLE that operates entirely within modern browsers:

### Timeline Features
- **Multi-Track Non-Linear Stacking**:
  - `Track 1: Video`: Primary video camera stream with live crop, zoom factor, opacity, and split-cut support.
  - `Track 2: Audio`: Synchronized background score, voice track, and procedural SFX impacts.
  - `Track 3: Overlay`: 4K B-roll overlays, live screen captures, and Remotion graphics.
  - `Track 4: Captions`: Frame-accurate kinetic subtitles with customizable styles (Hormozi, Dev, Minimal, Neon Glow).
- **Subject-Avoidance Safe Zones**: Visual overlay guarantees text and graphics never occlude the speaker's face or platform action icons (TikTok like/comment bar).
- **Smart Animation Presets**: Instant keyframed entrances: `Fade In`, `Slide Up`, `Pop In`, `Scale Bounce`, `Glitch`.
- **Keyboard Shortcuts**:
  - <kbd>Space</kbd>: Play / Pause
  - <kbd>S</kbd>: Split Clip at Playhead
  - <kbd>Cmd</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>: Infinite Undo / Redo
  - <kbd>Cmd</kbd> + <kbd>K</kbd>: Summon AI Copilot
  - <kbd>Delete</kbd> / <kbd>Backspace</kbd>: Remove Selected Element

---

## 🔄 Deep-Dive: 13-Stage Autonomous Pipeline

When a user submits a job via the API or dashboard, Celery triggers the 13-stage deterministic pipeline orchestrated by [`video_pipeline.py`](file:///home/vansh/WindowsData/Coding/Main%20Projects/Ai%20Content%20Manager/apps/worker/tasks/video_pipeline.py):

| Step | Engine / Service | Description | Output Artifact |
|:---:|---|---|---|
| **01** | `ingest_manager.py` | Validates input format (MP4/MOV/WebM) or downloads source media from S3/R2 presigned URL. | `local_source.mp4` |
| **02** | `transcriber.py` | Extracts audio track via FFmpeg and executes `faster-whisper` word-level STT with sub-second timestamps. | `transcript.json` |
| **03** | `silence_detector.py` | Runs FFmpeg `silencedetect` (threshold `-30dB`, min duration `0.4s`) to isolate pauses and dead air. | `silence_regions.json` |
| **04** | `speech_pruner.py` | Computes non-destructive edit cut points, removing filler words and silences while keeping natural breath. | `pruned_timeline.json` |
| **05** | `visual_analysis/` | Samples frames via OpenCV; detects camera cuts, human face bounding boxes, and body pose orientation. | `visual_profile.json` |
| **06** | `chunk_director.py` | Dispatches semantic script blocks to the multi-agent LLM swarm (B-Roll, Motion Graphics, SFX directors). | `director_proposals.json` |
| **07** | `blueprint_resolver.py` | Merges competing agent proposals, enforcing minimum spacing (≥1.8s between cuts) and visual variety. | `master_blueprint.json` |
| **08** | `sfx_planner.py` | Injects audio transitions (whooshes, risers, clicks) aligned with visual pop-ins and topic changes. | `sfx_manifest.json` |
| **09** | `blueprint_validator.py` | Strictly verifies that timestamps do not overlap, assets exist, and durations match audio limits. | `validated_edl.json` |
| **10** | `asset_manager.py` | Sources 4K portrait/landscape footage via Pexels API and runs headless Chromium web evidence capture. | `media_assets/` |
| **11** | `subtitle_generator.py` | Generates high-performance ASS (Advanced SubStation Alpha) subtitle files with word-level karaoke tags. | `subtitles.ass` |
| **12** | `compositor.py` | Spawns hardware-accelerated FFmpeg multi-filtergraph compositing pipeline (B-roll overlays + ASS + audio). | `output_master.mp4` |
| **13** | `publisher.py` | Uploads finalized `.mp4` master to Cloudflare R2 and triggers scheduled publishing to YouTube/Instagram. | CDN Link / Publish ID |

---

## 💻 Tech Stack Matrix

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               MONOREPO TECHNOLOGY STACK                           │
├────────────────────┬─────────────────────────────────┬────────────────────────────┤
│ LAYER              │ TECHNOLOGY                      │ PRIMARY DIRECTORY          │
├────────────────────┼─────────────────────────────────┼────────────────────────────┤
│ Web Application    │ Next.js 16 (App Router), React  │ apps/web                   │
│ Styling & Design   │ TailwindCSS v4, Lucide Icons    │ apps/web/app/globals.css   │
│ Client State       │ Zustand 5, IndexedDB            │ apps/web/lib/stores        │
│ Video Preview      │ @remotion/player, HTML5 Canvas  │ apps/web/components/editor │
│ Backend Server     │ FastAPI 0.115, Uvicorn, Python  │ apps/api                   │
│ Data Persistence   │ SQLModel, PostgreSQL 16 (Neon)  │ apps/api/models.py         │
│ Message Queue      │ Celery 5.4, Upstash Redis TLS   │ apps/worker/celery_app.py  │
│ Speech-to-Text     │ faster-whisper (CTranslate2)    │ apps/worker/services       │
│ Audio Processing   │ FFmpeg silencedetect, Librosa   │ apps/worker/services       │
│ Computer Vision    │ OpenCV-Python, MediaPipe        │ apps/worker/services       │
│ Reasoning Engine   │ DeepSeek Chat via OpenRouter    │ apps/worker/services       │
│ Motion Graphics    │ Remotion 4.0, React, TypeScript │ packages/motion-components │
│ Cloud Storage      │ Cloudflare R2 / AWS S3 SDK      │ apps/api/storage.py        │
│ Automation Bot     │ Puppeteer / Headless Chromium   │ apps/worker/services       │
└────────────────────┴─────────────────────────────────┴────────────────────────────┘
```

---

## 📂 Repository File Structure

```
ai-content-manager/
├── .env                                # Central unified configuration (AI, DB, S3/R2)
├── docker-compose.yml                  # PostgreSQL & Redis infrastructure containers
├── package.json                        # Monorepo root configuration (npm workspaces)
│
├── apps/
│   ├── web/                            # Next.js 16 Web Application & Video Studio
│   │   ├── app/
│   │   │   ├── page.tsx                # High-converting product landing page
│   │   │   └── dashboard/
│   │   │       ├── page.tsx            # Executive Operations Dashboard
│   │   │       ├── editor/             # Multi-Track Non-Linear Video Studio
│   │   │       │   ├── page.tsx        # Studio Launcher & Preset Chooser
│   │   │       │   └── [id]/page.tsx   # Interactive Timeline Canvas
│   │   │       ├── queue/page.tsx      # Distributed Worker Queue & Live Logs
│   │   │       ├── videos/page.tsx     # Video Asset Catalog & Details
│   │   │       └── socials/page.tsx    # Multi-Channel Social Hub
│   │   ├── components/
│   │   │   └── editor/                 # Studio Editor UI Subsystem
│   │   │       ├── TimelineContainer.tsx   # Multi-track scrubber & zoom controls
│   │   │       ├── PlayerMonitor.tsx       # Live viewport with aspect-ratio masking
│   │   │       ├── InspectorPanel.tsx      # Transform, keyframe, & style editor
│   │   │       ├── ChatAssistantDrawer.tsx # AI Copilot (Cmd+K) assistant
│   │   │       ├── RenderExportModal.tsx   # 4K & NLE XML export modal
│   │   │       └── MediaDrawer.tsx         # Media asset & motion graphics library
│   │   └── lib/
│   │       └── stores/
│   │           └── useTimelineStore.ts # Central Zustand timeline state engine
│   │
│   ├── api/                            # FastAPI High-Performance Backend
│   │   ├── main.py                     # Entry point, middleware, CORS, lifespan
│   │   ├── database.py                 # SQLModel database engine & session dependency
│   │   ├── models.py                   # Relational DB models (VideoJob, SocialAccount)
│   │   ├── storage.py                  # Presigned S3/R2 upload & download URLs
│   │   └── routers/
│   │       ├── copilot.py              # Natural language timeline editor endpoints
│   │       ├── videos.py               # Video CRUD & timeline compilation
│   │       ├── jobs.py                 # Task dispatch, telemetry, & retry logic
│   │       └── storage.py              # Media staging & dev asset endpoints
│   │
│   └── worker/                         # Celery Background Processing Engine
│       ├── celery_app.py               # Worker task broker & result backend config
│       ├── tasks/
│       │   └── video_pipeline.py       # Master 13-stage autonomous pipeline orchestrator
│       └── services/
│           ├── chunk_director.py       # Multi-agent LLM visual director
│           ├── transcriber.py          # Faster-whisper speech-to-text service
│           ├── silence_detector.py     # Millisecond silence & filler pruning
│           ├── compositor.py           # Multi-track FFmpeg video compositor
│           ├── remotion_renderer.py    # Headless Remotion motion graphics builder
│           ├── nle_exporter.py         # Premiere Pro XML / FCPXML / EDL generator
│           ├── depth_matting.py        # Background depth isolation engine
│           ├── web_evidence_capture.py # Playwright headless screenshot/video bot
│           ├── audio_sfx_synthesizer.py# Procedural sound effect generator
│           └── publisher.py            # YouTube / Instagram / TikTok dispatchers
│
└── packages/
    ├── motion-components/              # Reusable React Remotion Graphic Components
    │   └── src/
    │       ├── charts/                 # Animated financial & statistics charts
    │       ├── transitions/            # Cinematic camera & wipe transitions
    │       ├── typography/             # Hormozi & kinetic subtitle renderers
    │       └── scene/                  # Dynamic 3D device & isometric scenes
    └── shared-types/                   # Shared TypeScript interfaces & schemas
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Python**: `3.11` or higher
- **FFmpeg**: `6.0` or higher (with `libx264`, `libass`, and `aac` support)
- **Redis**: Local or Upstash Redis instance
- **PostgreSQL**: Local or Neon serverless database

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/ai-content-manager.git
cd ai-content-manager

# Install Node monorepo dependencies
npm install

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install API and Worker Python dependencies
pip install -r apps/api/requirements.txt
pip install -r apps/worker/requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and provide your API keys:

```bash
cp .env.example .env
```

### 3. Launch with Docker Compose (Database + Redis)

```bash
# Start local PostgreSQL and Redis services
docker-compose up -d
```

### 4. Run Development Services

In separate terminal tabs (or via root npm scripts):

```bash
# 1. Start the Next.js Web Application & Studio (Port 3000)
npm run dev:web

# 2. Start the FastAPI Backend Server (Port 8000)
npm run dev:api

# 3. Start the Celery AI Pipeline Worker
npm run dev:worker
```

Open **`http://localhost:3000`** in your browser to experience AI Director!

---

## ⚙️ Configuration & Environment Variables

All critical credentials and operational thresholds reside in the root `.env` file:

```ini
# ==============================================================================
# 1. APPLICATION ENVIRONMENT & NETWORKING
# ==============================================================================
ENVIRONMENT=development
PORT=8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# ==============================================================================
# 2. DATABASE & CACHE INFRASTRUCTURE
# ==============================================================================
DATABASE_URL=postgresql://user:password@localhost:5432/ai_content_manager
REDIS_URL=redis://localhost:6379/0

# ==============================================================================
# 3. AI & REASONING SERVICES
# ==============================================================================
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=deepseek/deepseek-chat
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# ==============================================================================
# 4. MEDIA ASSET APIS
# ==============================================================================
PEXELS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==============================================================================
# 5. OBJECT STORAGE (CLOUDFLARE R2 / AWS S3)
# ==============================================================================
S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET_NAME=ai-content-manager-videos
S3_REGION=auto

# ==============================================================================
# 6. SOCIAL NETWORK OAUTH CREDENTIALS
# ==============================================================================
YOUTUBE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx
INSTAGRAM_APP_ID=xxxxxxxxxxxxxxxx
INSTAGRAM_APP_SECRET=xxxxxxxxxxxxxxxxxxxx
```

---

## 🔌 API Endpoints & Copilot Protocol

### Video Management (`/api/v1/videos`)

- `POST /api/v1/videos/create-job`: Creates a new video job and enqueues Celery task.
- `GET /api/v1/videos/`: Lists all video projects with pagination and status filters.
- `GET /api/v1/videos/{id}`: Retrieves job details, status, and generated metadata.
- `GET /api/v1/videos/{id}/timeline`: Returns compiled `TimelineProject` schema for the Studio Editor.
- `PATCH /api/v1/videos/{id}/timeline`: Saves modified tracks from the Studio Editor.
- `POST /api/v1/videos/{id}/export-nle`: Generates Premiere Pro XML, FCPXML, or DaVinci EDL.

### AI Copilot (`/api/v1/copilot`)

The Copilot engine supports real-time conversational timeline mutations:

```http
POST /api/v1/copilot/chat
Content-Type: application/json

{
  "message": "Add a kinetic title saying 'THE SECRET BEHIND AI' at second 2.5 with a neon glow",
  "project_context": { ... }
}
```

**Supported Copilot Natural Language Actions**:
- `Add text overlay`: *"Add text 'Watch Until The End' at 0s for 3s"*
- `Trim & Split`: *"Cut video at current playhead"*
- `Sound & SFX`: *"Insert a whoosh transition sound at 4.2s"*
- `Visual styling`: *"Increase video scale to 1.25 and reposition face to center"*
- `B-Roll insertion`: *"Add a stock clip showing futuristic technology over the current sentence"*

---

## 📊 Performance & Benchmarks

Benchmarked on **AMD Ryzen 9 5900X / 32GB RAM / NVIDIA RTX 3080**:

| Pipeline Stage | 30s Short (9:16) | 2.5m Explainer (16:9) | Acceleration |
|---|---|---|---|
| **Audio Ingest & Silence Pruning** | 0.8s | 2.4s | FFmpeg C++ Native |
| **Whisper Transcription (int8)** | 1.6s | 5.2s | CTranslate2 GPU/CPU |
| **Multi-Agent Swarm Reasoning** | 3.2s | 7.8s | Parallel OpenRouter SSE |
| **4K B-Roll Sourcing & Validation** | 2.1s | 4.9s | Async Concurrent I/O |
| **Remotion Motion Graphic Render** | 4.8s | 16.5s | Headless Chrome NAPI |
| **FFmpeg Hardware Compositing** | 3.4s | 14.1s | NVENC / h264_nvenc |
| **Total Pipeline Turnaround** | **~15.9s** | **~50.9s** | **⚡ Real-Time+** |

---

## 🗺️ Product Roadmap

- [x] **v1.0 (Current)**:
  - Multi-Agent AI Director Swarm (DeepSeek).
  - Sub-word Faster-Whisper karaoke subtitle generation.
  - Multi-track web studio NLE with live canvas player.
  - Premiere Pro XML, FCPXML, and DaVinci Resolve export.
  - Autonomous web evidence capture bot (Chromium).
- [ ] **v1.1 (Q3 2026)**:
  - Zero-latency WebGPU browser-side rendering engine.
  - Multi-speaker voice cloning and dubbing in 40+ languages.
  - Real-time multiplayer collaborative video editing (CRDTs).
  - Direct integration with Midjourney v7 & Runway Gen-3 APIs.
- [ ] **v1.2 (Q4 2026)**:
  - Autonomous A/B thumbnail generator with neural click-through prediction.
  - Live AI stream clipping (automatically turn Twitch / YouTube livestreams into TikTok reels).

---

## 🤝 Contributing

We welcome contributions from engineers, video creators, and AI researchers!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <br />
  <p><b>Crafted with ❤️ by creators, for creators.</b></p>
  <p><sub>© 2026 AI Content Manager Inc. All rights reserved.</sub></p>
</div>
