import Link from "next/link";
import { Sparkles, ArrowRight, Video, Layers, Wand2, Shield, Play } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              AI Content Manager
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous AI Video Editing & Social Publishing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Raw Footage Into Viral Content,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Automatically.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            High-efficiency pipeline powered by Next.js 15, FastAPI, faster-whisper, Gemini AI Director, and hardware-accelerated FFmpeg.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Control Plane</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 inline-flex items-center justify-center gap-2 transition-all"
            >
              <span>FastAPI Swagger Docs</span>
            </a>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-12">
            <div className="p-5 rounded-2xl bg-[#0d1017]/80 border border-slate-800/80 backdrop-blur-md space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Thin-Client Control Plane</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct client-to-R2 presigned uploads ensure zero server timeouts and minimal bandwidth overhead.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d1017]/80 border border-slate-800/80 backdrop-blur-md space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Director & Whisper</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic word-level timestamps matched with Gemini Flash edit decision lists to prevent hallucinations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d1017]/80 border border-slate-800/80 backdrop-blur-md space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Auto Social Publishing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-channel scheduling to YouTube Shorts, Instagram Reels, and LinkedIn with a single click.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1017]/60 py-6 text-center text-xs text-slate-400">
        AI Content Manager & Automated Video Editor &copy; {new Date().getFullYear()} — Phase 1 Scaffolding
      </footer>
    </div>
  );
}
