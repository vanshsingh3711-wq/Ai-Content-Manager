import Link from "next/link";
import {
  Upload,
  Globe,
  Wand2,
  Send,
  Users,
  Sliders,
  Film,
} from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060709] text-white flex flex-col justify-between selection:bg-purple-500/30 selection:text-white">
      {/* ── Top Navigation Bar matching Proposal 3 Mockup ── */}
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

          {/* Center Capsule Menu Pill (Matching Mockup) */}
          <nav className="hidden md:flex items-center gap-7 px-6 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-xs font-mono uppercase tracking-wider text-neutral-300">
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Login
            </Link>
          </nav>

          {/* Right Action: Pill Login / Dashboard */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-full text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.12] transition-all shadow-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col items-center">
        {/* ── Redesigned 3D Fluid Chromatic Aurora & Live Cinema Hero ── */}
        <HeroSection />

        {/* ── Section 1: How it works (4 Step Cards) ── */}
        <section className="w-full max-w-5xl px-5 mb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white text-left tracking-tight">
              How it works
            </h2>
            <span className="text-[11px] font-mono text-neutral-500">Autonomous 4-Step Flow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Step 1: Upload */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">1</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">Upload</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Upload raw footage or paste a script for automated ingestion.
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
                <h3 className="text-xs font-semibold text-white mb-1">AI Analysis</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Whisper transcription, facial tracking, audio levels, and scene cuts.
                </p>
              </div>
            </div>

            {/* Step 3: Auto Edit (Highlighted Card with Purple Glow in Mockup) */}
            <div className="rounded-xl p-4 bg-[#0d1017]/95 border-2 border-purple-500/80 shadow-[0_0_28px_rgba(168,85,247,0.35)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Wand2 className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="text-[11px] font-mono text-purple-300 font-bold">3</span>
                </div>
                <h3 className="text-xs font-semibold text-white mb-1">Auto Edit</h3>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Auto-compositing: kinetic captions, stock B-roll, SFX, and transitions.
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
                <h3 className="text-xs font-semibold text-white mb-1">Publish</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Export 4K video formatted for TikTok, YouTube Shorts, and Reels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Built for creators (3 Column Cards) ── */}
        <section className="w-full max-w-5xl px-5 mb-12">
          <h2 className="text-base font-bold text-white mb-4 text-left tracking-tight">
            Built for creators
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Feature 1 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-semibold text-white">Creator workflows</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Scale video capacity and track performance for serious creators and content studios.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-white">Flexible tools</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Precise NLE timeline controls when you want them, full hands-off autopilot when you don&apos;t.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl p-4 bg-[#0d1017]/90 border border-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Short-form & Long-form</h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Transform 20-minute podcast interviews into 5 high-hook vertical TikTok & Reel clips.
              </p>
            </div>
          </div>
        </section>

        {/* ── Call To Action Banner with Conic Glow ── */}
        <section className="w-full max-w-5xl px-5 mb-14">
          <div className="relative rounded-2xl overflow-hidden p-0.5">
            <div className="border-beam-glow opacity-50" />
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#121624] to-[#0a0d16] py-10 px-8 text-center border border-white/[0.12] shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-mono uppercase text-violet-400 tracking-widest font-bold block mb-2">
                Autonomous Engine Access
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3 tracking-tight">
                Ready to automate your content production?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
                Drop your raw footage or text script. Watch the autonomous pipeline transcode, edit, and deliver in minutes.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-black font-extrabold text-xs px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95"
              >
                Launch Dashboard Now →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer matching Mockup ── */}
      <footer className="w-full border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 py-6 flex items-center justify-between text-xs text-neutral-500">
          <span>Copyright © 2026 AI Director. All rights reserved.</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-neutral-400 font-mono text-[10px]">
            Version
          </span>
        </div>
      </footer>
    </div>
  );
}
