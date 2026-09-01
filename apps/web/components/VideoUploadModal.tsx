"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadStep = "idle" | "presigning" | "uploading" | "creating_job" | "completed" | "error";

export function VideoUploadModal({ isOpen, onClose, onSuccess }: VideoUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [videoType, setVideoType] = useState<"talking_head" | "faceless_short">("talking_head");
  const [step, setStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelected(file: File) {
    // Validate format
    const validExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setErrorMessage(`Unsupported format. Please upload ${validExtensions.join(", ")}.`);
      return;
    }

    // Validate size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage("File exceeds 500MB limit.");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  }

  async function handleStartUpload() {
    if (!selectedFile || !title.trim()) {
      console.warn("[FRONTEND: UPLOAD] ⚠️ Cannot start upload: File or Title missing.", { selectedFile, title });
      return;
    }

    console.group(`[FRONTEND: UPLOAD] 🚀 Starting Video Ingest Pipeline: "${title.trim()}"`);
    console.log("[FRONTEND: UPLOAD] 📄 Selected File Details:", {
      name: selectedFile.name,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      type: selectedFile.type || "video/mp4",
      mode: videoType,
    });

    setStep("presigning");
    setProgress(15);
    setErrorMessage(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // Step 1: Request Presigned URL
      console.log(`[FRONTEND: STEP 1/3] 📡 Requesting Presigned URL from API: ${apiUrl}/api/v1/storage/presigned-url`);
      const presignRes = await fetch(`${apiUrl}/api/v1/storage/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          content_type: selectedFile.type || "video/mp4",
          file_size_bytes: selectedFile.size,
          user_id: "default_user",
        }),
      });

      console.log(`[FRONTEND: STEP 1/3] 📥 Presign Response HTTP Status:`, presignRes.status);
      if (!presignRes.ok) {
        const errorText = await presignRes.text();
        console.error(`[FRONTEND: STEP 1/3] ❌ Presign failed:`, errorText);
        throw new Error(`Failed to get presigned URL: ${errorText}`);
      }

      const { upload_url, source_url, file_key, mode } = await presignRes.json();
      console.log(`[FRONTEND: STEP 1/3] ✅ Presigned URL acquired:`, { upload_url, source_url, file_key, mode });

      // Step 2: Binary Upload
      setStep("uploading");
      setProgress(40);
      console.log(`[FRONTEND: STEP 2/3] 📤 Uploading binary (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB) to: ${upload_url}`);

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "video/mp4",
        },
        body: selectedFile,
      });

      console.log(`[FRONTEND: STEP 2/3] 📥 Binary Upload HTTP Status:`, uploadRes.status);
      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`[FRONTEND: STEP 2/3] ❌ Direct upload failed:`, errText);
        throw new Error(`Direct storage upload failed (${uploadRes.status}): ${errText}`);
      }
      console.log(`[FRONTEND: STEP 2/3] ✅ Binary upload complete.`);

      // Step 3: Register Video Job in PostgreSQL
      setProgress(85);
      setStep("creating_job");
      console.log(`[FRONTEND: STEP 3/3] 📝 Creating Video Job in PostgreSQL at ${apiUrl}/api/v1/videos/create-job...`);

      const jobRes = await fetch(`${apiUrl}/api/v1/videos/create-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source_url: source_url,
          video_type: videoType,
          clerk_id: "user_default",
          email: "user@example.com",
        }),
      });

      console.log(`[FRONTEND: STEP 3/3] 📥 Job Creation HTTP Status:`, jobRes.status);
      if (!jobRes.ok) {
        const errText = await jobRes.text();
        console.error(`[FRONTEND: STEP 3/3] ❌ Job registration failed:`, errText);
        throw new Error(`Failed to register video job: ${errText}`);
      }

      const createdJob = await jobRes.json();
      console.log(`[FRONTEND: STEP 3/3] ✅ Video Job Registered & Dispatched:`, createdJob);
      console.groupEnd();

      setProgress(100);
      setStep("completed");

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      console.error(`[FRONTEND: UPLOAD ERROR] ❌`, err);
      console.groupEnd();
      setStep("error");
      setErrorMessage(err.message || "An unexpected error occurred during upload.");
    }
  }

  function handleClose() {
    setSelectedFile(null);
    setTitle("");
    setStep("idle");
    setProgress(0);
    setErrorMessage(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0d1017] border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ingest Raw Video</h2>
              <p className="text-xs text-slate-400">Direct S3/R2 presigned upload (zero server buffering)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === "uploading" || step === "creating_job"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === "completed" ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Video Ingested Successfully!</h3>
            <p className="text-xs text-slate-400">
              Video job created and queued in PostgreSQL state machine.
            </p>
          </div>
        ) : step !== "idle" && step !== "error" ? (
          /* Uploading Progress Screen */
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-sm font-semibold text-white">
                {step === "presigning" && "Requesting Presigned URL..."}
                {step === "uploading" && "Uploading direct to Cloudflare R2 / S3..."}
                {step === "creating_job" && "Enqueuing Video Job in PostgreSQL..."}
              </div>
              <div className="text-xs text-slate-400">
                Direct browser binary stream • 0% web server load
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{progress}% complete</span>
                <span>Fast Direct Pipe</span>
              </div>
            </div>
          </div>
        ) : (
          /* Form & Dropzone */
          <div className="space-y-5">
            {/* Dropzone */}
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-3",
                  dragActive
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-200">
                    Drag and drop your raw video here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    MP4, MOV, WebM, AVI up to 500MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white line-clamp-1">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Video Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5 AI Tools That Will Blow Your Mind"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Pipeline Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Processing Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVideoType("talking_head")}
                  className={cn(
                    "p-3.5 rounded-xl border text-left space-y-1.5 transition-all",
                    videoType === "talking_head"
                      ? "border-indigo-500/80 bg-indigo-950/30 text-indigo-300 shadow-sm"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Talking Head</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Whisper transcription, silence cutting, Pexels B-roll overlay & zooms.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoType("faceless_short")}
                  className={cn(
                    "p-3.5 rounded-xl border text-left space-y-1.5 transition-all",
                    videoType === "faceless_short"
                      ? "border-purple-500/80 bg-purple-950/30 text-purple-300 shadow-sm"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Faceless Short</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Edge-TTS neural voiceover, dynamic captions & automated B-roll assembly.
                  </p>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || !title.trim()}
                onClick={handleStartUpload}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Upload & Enqueue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
