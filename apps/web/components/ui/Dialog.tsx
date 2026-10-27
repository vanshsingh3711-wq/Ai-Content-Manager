"use client";

import React, { useEffect, useId, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  confirmVariant?: "primary" | "danger" | "accent";
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "primary",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false,
  children,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-md bg-[#0e121a] border border-white/[0.10] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-6 space-y-4 outline-none",
          confirmVariant === "danger"
            ? "border-red-500/30"
            : "gradient-border-violet"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {confirmVariant === "danger" && (
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
            )}
            <div>
              <h2
                id={titleId}
                className="text-base font-semibold text-white tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-xs text-white/40 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children && <div className="py-2 text-sm text-white/70">{children}</div>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              type="button"
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
