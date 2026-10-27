<div align="center">

<img src="./docs/assets/ai_director_brand_banner.jpg" alt="AI Director" width="100%" style="border-radius: 12px;" />

<br />
<br />

# AI Director

**Autonomous AI video editor. Drop in audio, a script, or raw footage — get a production-ready short.**

[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/vanshsingh3711-wq/Ai-Director/ci.yml?style=flat-square&label=CI)](https://github.com/vanshsingh3711-wq/Ai-Director/actions)

[Product Tour](#product-tour) · [How It Works](#how-it-works) · [Design System](#studio-command-center--design-system-v20) · [Tech Stack](#tech-stack) · [Quickstart](#quickstart) · [API Reference](#api-reference) · [Contributing](#contributing)

</div>

---

## What is AI Director?

AI Director is an open-source, distributed video production platform. It takes your raw creative input — a podcast recording, a written script, or a long footage file — and autonomously edits it into a platform-optimized short video.

The pipeline handles transcription, silence removal, B-roll sourcing, motion graphic rendering, kinetic subtitle generation, and multi-track compositing. You get an `.mp4` ready to upload.

There's also a browser-based non-linear editor (NLE) if you want to review or refine the result before exporting.

---

## Product Tour

<div align="center">

<img src="./docs/assets/dashboard_overview.jpg" alt="AI Director Command Center Dashboard v2.0" width="95%" style="border-radius: 8px;" />
<p><sub>AI Director Command Center (v2.0) — atmospheric glassmorphic workspace, executive KPI metrics, live 4-stage pipeline monitor, and creation substrates</sub></p>

<br />

<img src="./docs/assets/landing_hero.png" alt="AI Director landing page" width="95%" style="border-radius: 8px;" />
<p><sub>Landing page — three creation pathways: Audio, Script, and Raw Video</sub></p>

<br />

<img src="./docs/assets/studio_editor_viral.png" alt="Studio Timeline Editor (9:16)" width="95%" style="border-radius: 8px;" />
<p><sub>Browser-based NLE — 4-track timeline, player monitor, media drawer, and AI Copilot (⌘K)</sub></p>

<br />

<img src="./docs/assets/studio_editor_explainer.png" alt="Studio Editor (16:9 Explainer)" width="95%" style="border-radius: 8px;" />
<p><sub>Widescreen 16:9 explainer mode with embedded Remotion motion graphics and data charts</sub></p>

</div>

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <img src="./docs/assets/dashboard_queue.png" alt="Worker Queue" width="100%" style="border-radius: 6px;" />
      <p><sub>Live render queue with real-time Celery logs</sub></p>
    </td>
    <td width="50%" align="center">
      <img src="./docs/assets/dashboard_videos.png" alt="Video Library" width="100%" style="border-radius: 6px;" />
      <p><sub>Video asset library — manage outputs across projects and formats</sub></p>
    </td>
  </tr>
</table>

---

## How It Works

AI Director runs a 13-stage pipeline orchestrated by Celery workers. Here's what happens when you submit a job:

```
Input (Audio / Script / Video)
        │
        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │  Stage 1   Ingest & validate source media                    │
 │  Stage 2   Transcribe speech → word-level timestamps         │  faster-whisper (int8)
 │  Stage 3   Detect silence regions                            │  FFmpeg silencedetect
 │  Stage 4   Compute non-destructive speech cut points         │
 │  Stage 5   Analyze visual profile (faces, scene cuts)        │  OpenCV + MediaPipe
 │  Stage 6   Multi-agent AI planning                           │  DeepSeek R1/V3
 │              ├─ B-Roll Planner                               │
 │              ├─ Motion Graphic Planner                       │
 │              └─ SFX & Music Planner                          │
 │  Stage 7   Resolve competing plans into a single blueprint   │
 │  Stage 8   Inject audio transitions (whooshes, risers)       │
 │  Stage 9   Validate blueprint (timestamps, overlaps, assets) │
 │  Stage 10  Source 4K B-roll from Pexels                      │
 │  Stage 11  Generate ASS karaoke subtitle file                │
 │  Stage 12  Composite final video via FFmpeg                  │  libx264, AAC, SHA-256 cache
 │  Stage 13  Upload to R2/S3 and trigger publish               │
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
  output_master.mp4  +  CDN URL
```

### Three input modes

| Mode | What you provide | What you get |
| :--- | :--- | :--- |
| **Audio → Video** | Podcast, voice memo, `.mp3` / `.wav` | Vertical short with B-roll, subtitles, and SFX |
| **Script → Faceless** | Plain text, markdown, article URL | Faceless explainer with motion graphics and stock footage |
| **Raw Footage → Clips** | Long `.mp4` / `.mov` recording | Silence-cut, captioned clips ready for social |

---

## Feature Status

| Feature | Status | Notes |
| :--- | :---: | :--- |
| faster-whisper word-level transcription | ✅ Implemented | int8 quantized, CPU and GPU |
| FFmpeg silence detection & pruning | ✅ Implemented | `-30dB` threshold, VAD-aware |
| Multi-agent AI planning (DeepSeek R1/V3) | ✅ Implemented | B-roll, motion graphics, SFX directors |
| Pexels 4K B-roll sourcing | ✅ Implemented | Aspect-ratio filtered with local cache |
| Remotion motion graphic overlays | ✅ Implemented | ProRes 4444 transparent MOV composited via FFmpeg |
| ASS kinetic subtitle generation | ✅ Implemented | Karaoke-style, carry-normalized timestamps |
| FFmpeg multi-track compositor | ✅ Implemented | Chunked pipeline, SHA-256 segment cache |
| Studio Command Center Dashboard v2.0 | ✅ Implemented | Atmospheric glassmorphism, executive KPI stats row, 4-stage pipeline monitor & live hardware telemetry |
| Browser-based NLE (4-track timeline) | ✅ Implemented | React 19, Zustand, ⌘K AI Copilot |
| NLE export (Premiere XML / FCPXML / EDL) | ✅ Implemented | |
| Resilient bounded network retries | ✅ Implemented | Exponential backoff, jitter, deadline control |
| Headless web evidence capture | ✅ Implemented | Chromium / Playwright screenshot-to-9:16 kinetic animated scroll clip |
| Depth matting (foreground isolation) | ✅ Implemented | Robust RVM MobileNetV3 / TorchScript matting with 3-layer depth sandwich |
| MediaPipe face safe-zone centering | ✅ Implemented | Smart 9:16 pan-and-scan camera engine with EMA smoothing & caption safe-zones |
| Direct social OAuth publishing | ✅ Implemented | YouTube Shorts, TikTok Content Posting API v2 & Instagram Reels with AES-256 Fernet tokens |

---

## Studio Command Center & Design System v2.0

AI Director features a studio-grade dark design system engineered for high-velocity video production:

- **Atmospheric Glassmorphism**: Deep obsidian base (`#060709`) augmented by multi-stop backdrop blur (`20px`), subtle top-rim reflection lighting (`inset 0 1px 0 rgba(255,255,255,0.1)`), and radial neon atmospheric glows.
- **Executive KPI Metrics Row**: Real-time stats showcasing total video assets, active pipeline rendering jobs, completed ready-to-publish cuts, and autonomous AI reliability with trend tags.
- **Interactive 4-Stage Pipeline Monitor**: Visual production console featuring a live circular progress gauge (`<ProgressRing>`), connected numbered stage cards (`01 Queued` → `02 Transcribing` → `03 AI Directing` → `04 Rendering`), animated pulse node states, and real-time worker hardware stats (4-thread worker, 2.4x realtime throughput).
- **Creation Substrates**: Glowing high-contrast launcher tiles for Faceless AI Video generation (`⌘1`), Talking Head footage enhancement with kinetic captions (`⌘2`), Remotion multi-track Studio NLE Editor (`⌘3`), and viral formats (Feynman Shorts, Finance Reels) (`⌘4`).
- **Cinematic Asset Showcase & Audit Feed**: 9:16 Shorts / 16:9 Cinema preview cards with direct studio launch buttons, real-time audit event timeline, and live Remotion / GPU hardware status bar.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS v4, Framer Motion, Zustand |
| **Design System** | Luxury Dark Glassmorphism, CSS Tokens, Custom UI Component Kit |
| **Backend API** | FastAPI 0.115, SQLModel, PostgreSQL (Neon) |
| **Worker** | Celery 5.4, Redis (Upstash), Python 3.11+ |
| **AI / ML** | DeepSeek Chat & R1 via OpenRouter, faster-whisper (CTranslate2) |
| **Audio** | FFmpeg silencedetect, Librosa, procedural SFX synthesizer |
| **Vision** | OpenCV, MediaPipe Pose, neural depth estimation |
| **Motion Graphics** | Remotion 4.0, React, TypeScript (`packages/motion-components`) |
| **Compositing** | FFmpeg (libx264, AAC, libass) |
| **Storage** | Cloudflare R2 / AWS S3 |
| **CI** | GitHub Actions |

---

## Repository Structure

```
ai-content-manager/
├── apps/
│   ├── web/                        # Next.js frontend & browser NLE
│   │   ├── app/dashboard/editor/   # Multi-track timeline studio
│   │   └── components/editor/      # Timeline, player, inspector, copilot
│   │
│   ├── api/                        # FastAPI backend
│   │   ├── models.py               # VideoJob, SocialAccount models
│   │   └── routers/                # videos, jobs, copilot, storage
│   │
│   └── worker/                     # Celery pipeline workers
│       ├── tasks/video_pipeline.py # 13-stage orchestrator
│       └── services/
│           ├── transcriber.py
│           ├── silence_detector.py
│           ├── speech_pruner.py
│           ├── chunk_director.py   # Multi-agent AI planning
│           ├── compositor.py       # FFmpeg multi-track compositing
│           ├── subtitle_generator.py
│           ├── remotion_renderer.py
│           ├── asset_manager.py    # Pexels B-roll sourcing
│           ├── network_retry.py    # Bounded exponential backoff
│           ├── publisher.py        # Upload & publish
│           └── blueprint_validator.py
│
├── packages/
│   └── motion-components/          # Remotion React graphic library
│       └── src/
│           ├── charts/             # Animated bar, line, pie charts
│           ├── devices/            # Phone mockups, app screens
│           ├── effects/            # Highlight, zoom, underline
│           └── animations/         # Fade, slide, scale, typewriter
│
├── .github/workflows/ci.yml        # CI — tests, build, docker
├── docker-compose.yml              # Local PostgreSQL & Redis
└── package.json                    # npm workspaces root
```

---

## Quickstart

### Prerequisites

- Node.js `>= 20`
- Python `>= 3.11`
- FFmpeg `>= 6.0` with `libx264`, `libass`, and `aac`
- Redis (local or [Upstash](https://upstash.com/))
- PostgreSQL (local or [Neon](https://neon.tech/))

### 1. Clone and install

```bash
git clone https://github.com/vanshsingh3711-wq/Ai-Director.git
cd Ai-Director

# Node dependencies (all workspaces)
npm install

# Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

pip install -r apps/api/requirements.txt
pip install -r apps/worker/requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your keys (see Configuration section below)
```

### 3. Start infrastructure

```bash
docker-compose up -d   # PostgreSQL + Redis
```

### 4. Run services

Open three terminals:

```bash
# Terminal 1 — Next.js frontend (http://localhost:3000)
npm run dev:web

# Terminal 2 — FastAPI backend (http://localhost:8000)
npm run dev:api

# Terminal 3 — Celery worker
npm run dev:worker
```

### 5. Run tests

```bash
# Python worker tests
.venv/bin/python -m pytest apps/worker/tests/ -v

# Web frontend tests
npm run test --workspace=@ai-content-manager/web

# Motion component tests
npm run test --workspace=@ai-content-manager/motion-components
```

---

## Configuration

All settings live in the root `.env` file:

```ini
# App
ENVIRONMENT=development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database & Cache
DATABASE_URL=postgresql://user:password@localhost:5432/ai_director
REDIS_URL=redis://localhost:6379/0

# AI
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
WHISPER_MODEL_SIZE=small           # tiny, base, small, medium, large
WHISPER_DEVICE=cpu                 # cpu or cuda
WHISPER_COMPUTE_TYPE=int8

# Media assets
PEXELS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Object storage (Cloudflare R2 or AWS S3)
R2_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxx
R2_BUCKET_NAME=ai-director-videos

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

---

## API Reference

### Video jobs

```http
POST   /api/v1/videos/create-job          # Submit a new pipeline job
GET    /api/v1/videos/                    # List all video projects
GET    /api/v1/videos/{id}                # Job status and metadata
GET    /api/v1/videos/{id}/timeline       # Timeline schema for the studio editor
PATCH  /api/v1/videos/{id}/timeline       # Save timeline edits
POST   /api/v1/videos/{id}/export-nle     # Export Premiere XML / FCPXML / EDL
```

### AI Copilot

Natural language commands streamed over SSE:

```http
POST /api/v1/copilot/chat
Content-Type: application/json

{
  "message": "Add a neon title 'AI Changes Everything' at 2.5s",
  "project_context": { ... }
}
```

Supported actions: add/remove text overlays, trim clips, insert B-roll, adjust scale and position, apply animation presets, change subtitle style.

---

## Rendering Benchmark

Reproducible locally — no external APIs required:

```bash
.venv/bin/python apps/worker/benchmark_render.py
```

**Measured on Linux x86_64 / FFmpeg 6.1.1 / Python 3.12:**

| Metric | Value |
| :--- | :--- |
| Input | 5.0s, 1080×1920, 30fps synthetic fixture |
| Render time | 7.4s |
| Real-time factor | 1.47× |
| Peak RSS memory | 854 MB |
| Output video | h264, 1080×1920 |
| Output audio | AAC stereo |

The benchmark generates a local fixture and validates stream integrity with ffprobe. No API keys or network access required.

---

## Roadmap

- [x] **v1.0** — Core pipeline, multi-agent AI director, browser NLE, FFmpeg compositor, Remotion overlays
- [ ] **v1.1** — Multi-speaker voice dubbing, real-time multiplayer editing (CRDTs), WebGPU renderer
- [ ] **v1.2** — Live stream clipping (Twitch / YouTube → TikTok), autonomous thumbnail A/B testing

---

## Contributing

Contributions are welcome. Please open an issue first to discuss significant changes.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run the test suite: `pytest apps/worker/tests/`
5. Open a pull request

---

## License

[MIT](LICENSE)

<div align="center">
  <br />
  <sub>Built for creators who ship.</sub>
</div>
