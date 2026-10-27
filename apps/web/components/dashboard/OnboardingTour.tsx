"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Compass,
  Film,
  Layers,
  Scissors,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  ArrowRight,
} from "lucide-react";
import { Button, Card, Badge, Kbd } from "@/components/ui";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "ai-director-onboarding-completed";

interface TourStep {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  linkUrl: string;
  linkLabel: string;
  bulletPoints: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: "1. Create Video Wizard",
    badge: "Step 1 of 5",
    description:
      "Transform scripts, topics, or long articles into high-retention vertical shorts and widescreen explainers.",
    icon: Sparkles,
    shortcut: "⌘N",
    linkUrl: "/dashboard/create",
    linkLabel: "Open Create Wizard",
    bulletPoints: [
      "Faceless AI: Generates synthetic voiceover, subtitles, and B-roll automatically.",
      "Upload & Enhance: Cleans up talking-head audio, cuts dead-air, and adds overlays.",
      "Pre-built Templates: Feynman Educational Short, Finance Explainer, and Tech Reel.",
    ],
  },
  {
    title: "2. Live Safe-Zone Preview",
    badge: "Step 2 of 5",
    description:
      "Watch simulated karaoke pop-in subtitles inside TikTok / YouTube Shorts safe zones in real time.",
    icon: Play,
    linkUrl: "/dashboard/create",
    linkLabel: "Try Safe-Zone Preview",
    bulletPoints: [
      "Subtitles docked at y=1440 for vertical 9:16 shorts to avoid UI overlap.",
      "Real-time word count and audio duration calculator.",
      "1-click hook presets to maximize first 3-second viewer retention.",
    ],
  },
  {
    title: "3. Library & Slide-Over Inspector",
    badge: "Step 3 of 5",
    description:
      "Inspect generated videos without full-screen modal blockage using our responsive right drawer.",
    icon: Film,
    shortcut: "G then L",
    linkUrl: "/dashboard/videos",
    linkLabel: "Explore Video Library",
    bulletPoints: [
      "Toggle between dense List View and visual Grid View.",
      "Right slide-over drawer with HTML5 video player and transcript beats.",
      "Batch operations: multi-select to export, re-render, or delete.",
    ],
  },
  {
    title: "4. Real-Time Pipeline Queue",
    badge: "Step 4 of 5",
    description:
      "Track speech alignment, DeepSeek AI directing treatments, and Remotion video rendering live via SSE.",
    icon: Layers,
    shortcut: "G then Q",
    linkUrl: "/dashboard/queue",
    linkLabel: "View Render Queue",
    bulletPoints: [
      "Server-Sent Events (SSE) stream instant stage updates without polling.",
      "Interactive 6-stage tracker: Ingest → WhisperX → AI Directing → Remotion.",
      "Browser desktop alerts when your render completes or needs retry.",
    ],
  },
  {
    title: "5. Studio NLE & Keyboard Power",
    badge: "Step 5 of 5",
    description:
      "Full multi-track video editing canvas with 15+ keyboard hotkeys for rapid video adjustments.",
    icon: Scissors,
    shortcut: "⌘K or ?",
    linkUrl: "/dashboard/editor",
    linkLabel: "Launch Studio Editor",
    bulletPoints: [
      "Press ⌘K anywhere to open the unified Command Palette.",
      "Press ? to view the full keyboard shortcuts cheat sheet.",
      "Timeline split (S), playback (Space), and undo/redo (⌘Z / ⌘⇧Z).",
    ],
  },
];

/* ──────────────────────────────────────────────────────────
   Onboarding Welcome Banner (Dismissible)
   ────────────────────────────────────────────────────────── */

export function OnboardingBanner({ onStartTour }: { onStartTour: () => void }) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!stored) {
        setIsDismissed(false);
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {}
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/30 via-indigo-950/40 to-cyan-950/30 border border-violet-500/20 p-5 sm:p-6 shadow-[0_8px_30px_rgba(124,58,237,0.12)] animate-in fade-in slide-in-from-top-4 duration-200">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-5xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-cyan-300 text-[11px] font-mono font-medium border border-violet-500/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Get Started</span>
            </span>
            <span className="text-micro text-white/40 font-mono">
              2-Minute Fast Track
            </span>
          </div>

          <h2 className="text-title font-bold text-white tracking-tight">
            Welcome to AI Director!
          </h2>
          <p className="text-body text-white/60 max-w-2xl">
            Create high-retention educational shorts, explainers, and reels in
            under 60 seconds with autonomous speech alignment, B-roll directing,
            and Remotion motion graphics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <span>Pick template or script</span>
            </div>
            <span className="text-white/20">→</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-violet-400/20 text-violet-300 flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <span>AI Directing Autopilot</span>
            </div>
            <span className="text-white/20">→</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span>Studio & 1-Click Publish</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={onStartTour}
            leftIcon={<Compass className="w-4 h-4 text-cyan-400" />}
          >
            Take Quick Tour
          </Button>

          <Link href="/dashboard/create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
            >
              Create First Video
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Interactive Tour Stepper Modal
   ────────────────────────────────────────────────────────── */

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTourModal({ isOpen, onClose }: OnboardingTourModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Keyboard navigation inside tour modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {}
    onClose();
  };

  const handleNavigateAndClose = (url: string) => {
    handleFinish();
    router.push(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Product Tour"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-xl bg-[#0d1017] border border-white/[0.12] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-cyan-300">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              AI Director Interactive Tour
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-white/40">
              {step.badge}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {step.title}
                </h3>
                {step.shortcut && <Kbd shortcut={step.shortcut} />}
              </div>
              <p className="text-body text-white/60">{step.description}</p>
            </div>
          </div>

          {/* Bullet Highlights */}
          <div className="space-y-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            {step.bulletPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          {/* Direct Link CTA */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleNavigateAndClose(step.linkUrl)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>{step.linkLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    i === currentStep
                      ? "w-6 bg-cyan-400"
                      : "bg-white/20 hover:bg-white/40"
                  )}
                  aria-label={`Go to tour step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-black/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleFinish}>
              Skip Tour
            </Button>

            {isLast ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNavigateAndClose("/dashboard/create")}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
              >
                Start Creating
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
