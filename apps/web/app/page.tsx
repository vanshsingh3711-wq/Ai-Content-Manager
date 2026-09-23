import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  Wand2,
  Layers,
  Zap,
  Upload,
  Play,
  Cpu,
  Share2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white/10 selection:text-white">
      {/* ─── NAVIGATION ─── */}
      <header className="border-b border-neutral-900 bg-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-black font-bold text-sm">AI</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white">
                AI Director
              </span>
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                Content Engine
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">
              Autonomous Video Pipeline
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
              Turn raw footage into
              <br />
              viral content.
            </h1>

            <p className="max-w-xl mx-auto text-base text-neutral-500 leading-relaxed">
              Upload your video. The AI Director handles transcription,
              B-roll sourcing, motion graphics, captions, SFX, and
              multi-platform publishing — automatically.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 inline-flex items-center gap-2 transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/queue"
                className="px-6 py-3 rounded-lg text-sm font-medium bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 inline-flex items-center gap-2 transition-colors"
              >
                <span>View Pipeline</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="border-t border-neutral-900">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">
                  Pipeline
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  How it works
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Upload",
                  desc: "Drop your raw video or paste a script for faceless content. Direct-to-cloud upload with zero server overhead.",
                },
                {
                  step: "02",
                  icon: Wand2,
                  title: "AI Analysis",
                  desc: "Whisper transcription, visual scene detection, silence analysis, and audio classification run in parallel.",
                },
                {
                  step: "03",
                  icon: Cpu,
                  title: "Auto Edit",
                  desc: "Multi-agent AI directors plan B-roll, motion graphics, characters, and SFX. FFmpeg composites the final cut.",
                },
                {
                  step: "04",
                  icon: Share2,
                  title: "Publish",
                  desc: "One-click export to YouTube Shorts, Instagram Reels, and LinkedIn. GPU-accelerated rendering on AWS.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-4 group hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-neutral-400" />
                      </div>
                      <span className="text-xs font-mono text-neutral-700">
                        {item.step}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="border-t border-neutral-900">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">
                Capabilities
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Built for creators
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group p-6 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <Film className="w-5 h-5 text-neutral-500" />
                  <ArrowUpRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Talking Head & Faceless
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Upload existing footage or generate faceless shorts from a
                  text script with AI characters and TTS audio.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <Layers className="w-5 h-5 text-neutral-500" />
                  <ArrowUpRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Dynamic Overlays
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Auto-generated B-roll from Pexels, Remotion motion graphics
                  templates, Rive characters, and Freesound SFX.
                </p>
              </div>

              <div className="group p-6 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-5 h-5 text-neutral-500" />
                  <ArrowUpRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  GPU-Accelerated Rendering
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  NVIDIA NVENC hardware encoding with automatic CPU fallback.
                  Deployed on AWS ECS with crash-safe Celery workers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="border-t border-neutral-900">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-3">
              Ready to automate your content?
            </h2>
            <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto">
              Upload your first video and watch the AI Director transform it
              into a publish-ready short in minutes.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-black" />
              Launch Dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-neutral-900 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-neutral-600">
            AI Content Manager &copy; {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
            <span>v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
