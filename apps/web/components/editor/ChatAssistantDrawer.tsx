"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  CornerDownLeft,
  Undo2,
  AlertCircle,
  CheckCircle2,
  Target,
  Wand2,
  Clock,
  Layers,
  Film,
  Check,
  Loader2,
} from "lucide-react";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { useShallow } from "zustand/react/shallow";
import { assembleEditorContext } from "@/lib/ai/editor-context";
import { parseLocalCommand } from "@/lib/ai/local-command-parser";
import { EditOperation } from "@/lib/operations/operation-types";
import { EditPlanProposal, ProposedEditItem } from "@/lib/ai/copilot-types";
import { StagedEditReviewDrawer } from "./StagedEditReviewDrawer";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  operation?: EditOperation;
  error?: boolean;
  isLoading?: boolean;
  proposal?: EditPlanProposal;
  isApplied?: boolean;
  isRejected?: boolean;
}

interface ChatAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  "Add a title that says Welcome",
  "Make the selected element bigger",
  "Move the selected element to the right",
  "Split clip",
  "Add animated counter",
];

export function ChatAssistantDrawer({ isOpen, onClose }: ChatAssistantDrawerProps) {
  const {
    project,
    playheadTime,
    selectedItem,
    dispatchOperation,
    dispatchBatch,
    undo,
  } = useTimelineStore(
    useShallow((state) => ({
      project: state.project,
      playheadTime: state.playheadTime,
      selectedItem: state.selectedItem,
      dispatchOperation: state.dispatchOperation,
      dispatchBatch: state.dispatchBatch,
      undo: state.undo,
    }))
  );

  const [input, setInput] = useState("");
  const [reviewProposal, setReviewProposal] = useState<EditPlanProposal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "👋 I'm your AI Editing Copilot. You can tell me to add titles, resize elements, nudge positions, or split clips in natural language.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll chat to latest message and focus input
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [messages, isOpen, onClose]);

  const handleSubmit = async (textToSubmit?: string) => {
    const prompt = (textToSubmit || input).trim();
    if (!prompt) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: timeStr,
    };

    // 2. Assemble real-time context & parse locally
    const context = assembleEditorContext(project, playheadTime, selectedItem);
    const parseResult = parseLocalCommand(prompt, context);

    if (parseResult.matched && parseResult.operation) {
      // Execute operation immediately on the Tier-1 local bus
      dispatchOperation(parseResult.operation);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: parseResult.description || "Executed operation successfully.",
        timestamp: timeStr,
        operation: parseResult.operation,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      return;
    }

    if (parseResult.matched && parseResult.error) {
      // Missing selection or validation error
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: parseResult.error,
        timestamp: timeStr,
        error: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      return;
    }

    // 3. Dispatch to Tier-2 Cloud Copilot (FastAPI /api/v1/editor/copilot)
    const loadingMsgId = `loading-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: loadingMsgId,
        sender: "assistant",
        text: "⚡ Interpreting creative intent & searching stock assets...",
        timestamp: timeStr,
        isLoading: true,
      },
    ]);
    setInput("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/editor/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          prompt,
          context: {
            playhead_time: playheadTime,
            duration: project.duration,
            aspect_ratio: project.aspectRatio,
            selected_item: selectedItem,
            safe_zones: context.safeZones,
            active_transcript_words: context.transcriptWords,
          },
          options: {
            max_edits: 5,
            allow_stock_sourcing: true,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Copilot returned ${res.status}`);
      }

      const proposal: EditPlanProposal = await res.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
                id: `assistant-${Date.now()}`,
                sender: "assistant",
                text: proposal.summary,
                timestamp: timeStr,
                proposal,
              }
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
                id: `assistant-${Date.now()}`,
                sender: "assistant",
                text: "💡 I detected a complex creative request. You can drag footage directly from the Media Drawer onto the B-Roll track, or try rephrasing with specific actions like 'Add a title from 01:20 to 01:25' or 'Split clip at 4s'.",
                timestamp: timeStr,
                error: false,
              }
            : msg
        )
      );
    }
  };

  const handleApplySingleProposal = (msgId: string, edit: ProposedEditItem) => {
    dispatchOperation(edit.operation);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isApplied: true,
              operation: edit.operation,
            }
          : m
      )
    );
  };

  const handleRejectSingleProposal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isRejected: true,
            }
          : m
      )
    );
  };

  const handleApplyBatchProposal = (edits: ProposedEditItem[]) => {
    if (edits.length === 0) return;
    const ops = edits.map((e) => e.operation);
    const desc = edits.length === 1 ? edits[0].title : `AI Copilot: ${edits.length} edits`;
    dispatchBatch(ops, desc);
    if (reviewProposal) {
      const pId = reviewProposal.id;
      setMessages((prev) =>
        prev.map((m) =>
          m.proposal?.id === pId ? { ...m, isApplied: true } : m
        )
      );
    }
    setReviewProposal(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] md:w-[420px] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col transition-all duration-300 select-none">
      {/* 1. Header */}
      <div className="h-14 px-4 border-b border-neutral-900 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide">AI Editing Copilot</h2>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                Tier-1 Local
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Zero-latency command interpreter</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Close drawer (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Active Context Bar */}
      <div className="px-4 py-2 bg-neutral-900/60 border-b border-neutral-900/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          {selectedItem ? (
            <span className="text-white truncate">
              Target: <span className="text-yellow-400 font-bold uppercase">{selectedItem.type}</span> ({selectedItem.id})
            </span>
          ) : (
            <span className="text-neutral-500 italic">No element selected</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-neutral-400">
          <Clock className="w-3 h-3 text-neutral-500" />
          <span>{playheadTime.toFixed(1)}s</span>
        </div>
      </div>

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[88%] text-xs leading-relaxed",
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div
              className={cn(
                "p-3 rounded-2xl shadow-md",
                msg.sender === "user"
                  ? "bg-white text-black font-medium rounded-tr-xs"
                  : msg.error
                  ? "bg-red-950/40 border border-red-900/60 text-red-200 rounded-tl-xs"
                  : "bg-neutral-900/90 border border-neutral-800 text-neutral-200 rounded-tl-xs"
              )}
            >
              {msg.isLoading && (
                <div className="flex items-center gap-2 text-yellow-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="text-[11px] font-medium animate-pulse">{msg.text}</span>
                </div>
              )}

              {msg.error && (
                <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Action required</span>
                </div>
              )}

              {msg.operation && !msg.proposal && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Operation Applied: <code className="text-white font-mono">{msg.operation.type}</code></span>
                </div>
              )}

              {!msg.isLoading && <p>{msg.text}</p>}

              {/* Staged Proposal Card (Single Edit) */}
              {msg.proposal && msg.proposal.edits.length === 1 && (
                <div
                  data-testid="inline-proposal-card"
                  className="mt-2.5 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2"
                >
                  {msg.proposal.edits[0].preview_url && (
                    <div className="rounded-lg overflow-hidden border border-neutral-800 relative group">
                      <img
                        src={msg.proposal.edits[0].preview_url}
                        alt={msg.proposal.edits[0].title}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Film className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span className="uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                      {msg.proposal.edits[0].action_type}
                    </span>
                    <span>
                      {msg.proposal.edits[0].start.toFixed(1)}s – {msg.proposal.edits[0].end.toFixed(1)}s
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-white">
                    {msg.proposal.edits[0].title}
                  </p>

                  {msg.proposal.edits[0].reason && (
                    <div className="text-[10px] text-neutral-400 bg-neutral-900/60 p-1.5 rounded border border-neutral-800">
                      <span className="text-yellow-400 font-medium">💡 </span>
                      {msg.proposal.edits[0].reason}
                    </div>
                  )}

                  {!msg.isApplied && !msg.isRejected && (
                    <div className="pt-1.5 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRejectSingleProposal(msg.id)}
                        className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApplySingleProposal(msg.id, msg.proposal!.edits[0])}
                        className="px-2.5 py-1 text-[11px] font-bold text-neutral-950 bg-yellow-400 hover:bg-yellow-300 rounded transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Accept to Timeline
                      </button>
                    </div>
                  )}

                  {msg.isApplied && (
                    <div className="pt-1 flex items-center justify-between text-emerald-400 text-[10px] font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Applied to Timeline
                      </span>
                      <button
                        onClick={() => undo()}
                        className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3" /> Undo
                      </button>
                    </div>
                  )}

                  {msg.isRejected && (
                    <div className="pt-1 text-neutral-500 text-[10px]">
                      Proposal rejected
                    </div>
                  )}
                </div>
              )}

              {/* Staged Proposal Card (Multi-Edit Banner) */}
              {msg.proposal && msg.proposal.edits.length > 1 && (
                <div
                  data-testid="multi-edit-proposal-banner"
                  className="mt-2.5 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-yellow-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {msg.proposal.edits.length} Proposed Edits
                    </span>
                    <span className="text-neutral-400 font-mono text-[10px]">
                      {msg.proposal.scope}
                    </span>
                  </div>
                  <button
                    onClick={() => setReviewProposal(msg.proposal!)}
                    className="w-full py-1.5 px-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Review & Apply Changes ({msg.proposal.edits.length})
                  </button>
                </div>
              )}

              {msg.operation && !msg.proposal && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500">Atomic inverse logged</span>
                  <button
                    onClick={() => undo()}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Undo this operation"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[9px] text-neutral-600 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Prompts Carousel */}
      <div className="px-3 py-2 border-t border-neutral-900/60 bg-neutral-950/50">
        <p className="text-[10px] text-neutral-500 mb-1.5 font-medium flex items-center gap-1">
          <Wand2 className="w-3 h-3 text-yellow-400/80" />
          <span>Quick actions:</span>
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(suggestion)}
              className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Field */}
      <div className="p-3 border-t border-neutral-900 bg-black/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an editing command..."
            className="w-full pl-3.5 pr-18 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30 transition-all font-medium"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-mono">
              ↵
            </span>
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Send command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-neutral-600 mt-1.5 text-center">
          Press <kbd className="px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">Cmd+K</kbd> to toggle assistant anytime
        </p>
      </div>
    </aside>

    <StagedEditReviewDrawer
      isOpen={!!reviewProposal}
      onClose={() => setReviewProposal(null)}
      proposal={reviewProposal}
      onApplySelected={handleApplyBatchProposal}
      onApplySingle={(edit) => {
        dispatchOperation(edit.operation);
      }}
    />
  </>
  );
}
