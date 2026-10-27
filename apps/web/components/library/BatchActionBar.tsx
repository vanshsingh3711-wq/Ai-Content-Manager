"use client";

import React, { useState } from "react";
import { Trash2, RefreshCw, X, CheckSquare } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onBatchRerender?: () => void;
  className?: string;
}

export function BatchActionBar({
  selectedCount,
  onClearSelection,
  onBatchDelete,
  onBatchRerender,
  className,
}: BatchActionBarProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0f131c]/95 border border-white/[0.12] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 duration-200",
          className
        )}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08] text-xs font-semibold text-white">
          <CheckSquare className="w-4 h-4 text-cyan-400" />
          <span>
            {selectedCount} {selectedCount === 1 ? "video" : "videos"} selected
          </span>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-white/40 hover:text-white transition-colors"
        >
          Deselect
        </button>

        {onBatchRerender && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBatchRerender}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-render
          </Button>
        )}

        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteConfirmOpen(true)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete
        </Button>
      </div>

      <Dialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={`Delete ${selectedCount} ${selectedCount === 1 ? "video" : "videos"}?`}
        description="Are you sure you want to delete the selected videos? This will remove all associated renders and transcripts."
        confirmText="Yes, Delete Videos"
        confirmVariant="danger"
        onConfirm={() => {
          onBatchDelete();
          setDeleteConfirmOpen(false);
        }}
      />
    </>
  );
}
