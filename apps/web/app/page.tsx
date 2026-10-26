import Link from "next/link";
import {
  Upload,
  Globe,
  Wand2,
  Send,
  Users,
  Sliders,
  Film,
  Mic,
  FileText,
  Video,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComparisonSlider } from "@/components/landing/ComparisonSlider";
import { BentoFeatures } from "@/components/landing/BentoFeatures";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060709] text-white flex flex-col justify-between selection:bg-purple-500/30 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="w-full relative z-20">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-6 flex items-center justify-between">
          {/* Left Brand: Vibrant Gradient C-Logo + AI Director */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-full h-full rounded-full bg-[#07080c] flex items-center justify-center font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                C
              </div>
            </div>
            <span className="font-extrabold text-white text-[17px] tracking-tight">
              AI Director
            </span>
          </Link>

          {/* Center Capsule Menu Pill */}
          <nav className="hidden md:flex items-center gap-7 px-6 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-xs font-mono uppercase tracking-wider text-neutral-300">
            <Link href="#modalities" className="hover:text-white transition-colors">
              Creation Modes
            </Link>
            <Link href="#comparison" className="hover:text-white transition-colors">
              Before / After
            </Link>
            <Link href="#features" className="hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="/dashboard/editor" className="hover:text-white transition-colors">
              Studio NLE
            </Link>
          </nav>

          {/* Right Action: Pill Login / Dashboard */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-full text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.12] transition-all shadow-sm"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col items-center">
        {/* ── Redesigned 3D Fluid Chromatic Aurora & Live Cinema Hero ── */}
        <HeroSection />

        {/* ── SECTION: 3 Modalities Creators Use to Auto-Edit ── */}
        <section id="modalities" className="w-full max-w-6xl px-6 py-12 mb-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[11px] font-mono uppercase tracking-wider text-purple-300 mb-3 font-semibold">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Universal Creation Substrate
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Auto-Edit From Any Input
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
              Whether you start with a voice memo, a written prompt, or raw 4K camera footage, AI Director transforms your raw assets into finished, high-retention video.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 🎙️ MODALITY 1: AUDIO-FIRST */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#0f1422] to-[#090c15] border border-cyan-500/30 hover:border-cyan-400 shadow-[0_10px_35px_rgba(6,182,212,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                    <Mic className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                    AUDIO INGEST
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  Audio → Viral Video
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-normal">
                  Drop MP3, WAV, or voice notes. Whisper extracts sub-word timestamps, Silero VAD prunes awkward breaths, and the Director auto-generates matching 4K B-roll, beat-synced transitions, and kinetic captions.
                </p>

                {/* Sub-feature chips */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Faster-Whisper sub-word STT</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Silero VAD dead-air & filler pruner</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Acoustic beat & cadence matcher</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Procedural SFX whooshes & impacts</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Ideal for Podcasts & Notes</span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Upload Audio <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 📝 MODALITY 2: SCRIPT-FIRST */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#161224] to-[#0a0815] border-2 border-purple-500/60 shadow-[0_10px_40px_rgba(168,85,247,0.22)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold">
                    SCRIPT INGEST
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  Script → Faceless Masterpiece
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-normal">
                  Paste a script, bullet points, or prompt. The multi-agent DeepSeek reasoning swarm choreographs narrative scenes, sources 4K stock B-roll, renders Remotion motion graphics, and layers a Lo-Fi score.
                </p>

                {/* Sub-feature chips */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>DeepSeek multi-agent director swarm</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Remotion React charts & diagrams</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Automated 4K Pexels B-roll curation</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Real-time web evidence capture bot</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[10px] font-mono text-purple-300 uppercase">Ideal for Faceless YouTube</span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Paste Script <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 📹 MODALITY 3: RAW VIDEO FOOTAGE */}
            <div className="rounded-2xl p-6 bg-gradient-to-b from-[#0f1d18] to-[#090f0c] border border-emerald-500/30 hover:border-emerald-400 shadow-[0_10px_35px_rgba(16,185,129,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                    <Video className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                    RAW VIDEO INGEST
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Raw Footage → 10 Viral Shorts
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-normal">
                  Drop raw camera footage, Zoom calls, or interview recordings. OpenCV and MediaPipe track subjects, locking faces inside safe zones while cutting pauses and injecting high-hook B-roll cutaways.
                </p>

                {/* Sub-feature chips */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>MediaPipe face lock & 9:16 re-centering</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Green-screenless AI depth matting</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>OpenCV scene change detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lossless NLE XML / FCPXML export</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Ideal for Vloggers & Pros</span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Upload Footage <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Interactive Comparison Slider ── */}
        <section id="comparison" className="w-full">
          <ComparisonSlider />
        </section>

        {/* ── Section: How it works (4 Step Cards) ── */}
        <section className="w-full max-w-5xl px-5 my-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white text-left tracking-tight">
              Autonomous 4-Step Pipeline
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">Zero Manual Friction</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Step 1: Upload Modality */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">1</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">1. Choose Modality</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Provide an audio voiceover, paste a written script, or upload raw video footage.
                </p>
              </div>
            </div>

            {/* Step 2: AI Analysis */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">2</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">2. Multimodal AI</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Whisper sub-word STT, Silero silence pruner, and OpenCV/MediaPipe face tracking.
                </p>
              </div>
            </div>

            {/* Step 3: Auto Edit */}
            <div className="rounded-xl p-4 bg-[#0d1017]/95 border-2 border-purple-500/80 shadow-[0_0_28px_rgba(168,85,247,0.35)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Wand2 className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="text-[11px] font-mono text-purple-300 font-bold">3</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">3. Direct & Composite</h3>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  DeepSeek swarm choreographs kinetic captions, Remotion graphics, B-roll, and SFX.
                </p>
              </div>
            </div>

            {/* Step 4: Publish */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">4</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">4. Publish & Export</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Export lossless 4K or sync directly to TikTok, YouTube Shorts, Reels, and LinkedIn.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: Bento Feature Grid (Linear & Runway Architecture) ── */}
        <section id="features" className="w-full">
          <BentoFeatures />
        </section>

        {/* ── Section: Built for creators (3 Column Cards) ── */}
        <section className="w-full max-w-5xl px-5 mb-14">
          <h2 className="text-base font-bold text-white mb-4 text-left tracking-tight">
            Built for creators & high-volume media studios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Feature 1 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-semibold text-white">Creator workflows</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Scale video capacity from 1 video/week to 20 videos/day with zero manual editing fatigue.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white">Flexible Studio NLE</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Full autopilot hands-off creation, or fine-tune timing, keyframes, and cuts in our multi-track timeline.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Vertical & Widescreen</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Export 9:16 vertical reels for TikTok and Instagram, or 16:9 widescreen documentaries for YouTube.
              </p>
            </div>
          </div>
        </section>

        {/* ── Call To Action Banner with Conic Glow ── */}
        <section className="w-full max-w-5xl px-5 mb-14">
          <div className="relative rounded-2xl overflow-hidden p-0.5">
            <div className="border-beam-glow opacity-50" />
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#121624] to-[#0a0d16] py-12 px-8 text-center border border-white/[0.12] shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-mono uppercase text-violet-400 tracking-widest font-bold block mb-2">
                Autonomous Video Creation
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                Ready to auto-edit your next viral video?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
                Start with an audio recording, a written script, or raw video. The autonomous pipeline delivers in 60 seconds.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center bg-white text-black font-extrabold text-xs px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95"
                >
                  Launch Dashboard Now →
                </Link>
                <Link
                  href="/dashboard/editor"
                  className="inline-flex items-center justify-center bg-white/[0.06] border border-white/[0.12] text-white font-semibold text-xs px-6 py-3 rounded-xl hover:bg-white/[0.1] transition-all"
                >
                  Open Studio Editor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 py-6 flex items-center justify-between text-xs text-neutral-500">
          <span>Copyright © 2026 AI Director. All rights reserved.</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-neutral-400 font-mono text-[10px]">
            Autonomous NLE v1.0
          </span>
        </div>
      </footer>
    </div>
  );
}
