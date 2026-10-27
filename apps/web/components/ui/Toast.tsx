"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (type !== "loading" && duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ type: "success", title, description }),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      toast({ type: "error", title, description }),
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      toast({ type: "info", title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, info }}>
      {children}
      {/* Toast viewport */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
    loading: <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30",
    error: "border-rose-500/30",
    info: "border-cyan-500/30",
    loading: "border-violet-500/30",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-[#0e121a]/95 backdrop-blur-md border shadow-[0_8px_30px_rgba(0,0,0,0.7)] text-xs transition-all duration-200 animate-in slide-in-from-bottom-2",
        borders[item.type]
      )}
    >
      {icons[item.type]}
      <div className="flex-1 min-w-0 pr-2">
        <div className="font-semibold text-white tracking-tight">{item.title}</div>
        {item.description && (
          <div className="text-white/40 mt-0.5 leading-relaxed">
            {item.description}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-white/30 hover:text-white p-1 rounded-md transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const defaultToastContext: ToastContextType = {
  toasts: [],
  toast: () => "",
  dismiss: () => {},
  success: () => "",
  error: () => "",
  info: () => "",
};

export function useToast() {
  const context = useContext(ToastContext);
  return context ?? defaultToastContext;
}
