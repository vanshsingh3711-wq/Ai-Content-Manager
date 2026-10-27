"use client";

import React, { useState } from "react";
import { Sparkles, Wand2, RefreshCw, FileText, Check } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ScriptEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  script: string;
  onScriptChange: (script: string) => void;
  className?: string;
}

export function ScriptEditor({
  title,
  onTitleChange,
  script,
  onScriptChange,
  className,
}: ScriptEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(5, Math.round(wordCount / 2.5));

  const hookPresets = [
    {
      label: "Feynman Simplicity",
      text: "If you can't explain this to a 12-year-old, you don't truly understand it. Here is the single concept that changed how we view physics...",
    },
    {
      label: "Contrarian Myth",
      text: "Everything you've been told about compound interest is missing one crucial rule. Here's why 90% of people get it completely backward...",
    },
    {
      label: "Fast Tech Breakdown",
      text: "In the next 60 seconds, you will understand how modern neural networks actually learn — without any technical buzzwords...",
    },
  ];

  const applyHook = (hookText: string) => {
    onScriptChange(hookText + (script ? "\n\n" + script : ""));
  };

  const generateAIEnhancement = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (!script.trim()) {
        onScriptChange(
          "Here is the Feynman Technique in action. Step one: pick a topic you want to master. Step two: explain it out loud as if you were teaching a twelve-year-old. When you get stuck, that is where your knowledge gap is. Simplify the words, remove all jargon, and connect it to a real-world analogy. That is how real masters learn."
        );
        if (!title.trim()) {
          onTitleChange("The Feynman Technique Explained Simply");
        }
      } else {
        onScriptChange(
          script.trim() +
            "\n\nRemember: mastery isn't about using complex buzzwords. It's about explaining big ideas with pure clarity."
        );
      }
    }, 600);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Title Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
          <span>Video Project Title</span>
          <span className="text-[10px] text-white/40 font-mono">Required</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Why Compound Interest Beats Hard Work"
          className="w-full h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
        />
      </div>

      {/* Script Area with Word & Time Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/80 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spoken Script / Voiceover Prompt</span>
          </label>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-caption font-mono text-white/40">
              {wordCount} words
            </span>
            <Badge variant={estimatedSeconds > 60 ? "queued" : "done"} size="sm">
              ~{estimatedSeconds}s audio
            </Badge>
          </div>
        </div>

        <textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder="Paste or write your full spoken script here. The AI Director will synchronize word-level timing, character speech, and b-roll inserts automatically..."
          rows={7}
          className="w-full p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all leading-relaxed resize-y font-normal"
        />
      </div>

      {/* Hook Presets & AI Assist */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Quick High-Retention Hooks
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={generateAIEnhancement}
            isLoading={isGenerating}
            leftIcon={<Wand2 className="w-3 h-3 text-cyan-400" />}
          >
            AI Script Polish
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {hookPresets.map((hook) => (
            <button
              key={hook.label}
              type="button"
              onClick={() => applyHook(hook.text)}
              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/30 text-left transition-all group"
            >
              <div className="text-xs font-semibold text-white/90 group-hover:text-cyan-300 transition-colors">
                {hook.label}
              </div>
              <div className="text-[11px] text-white/40 truncate mt-0.5">
                {hook.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
