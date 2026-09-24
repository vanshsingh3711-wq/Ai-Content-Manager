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
  Smartphone,
  Monitor,
  Square,
  Flame,
  Clapperboard,
  BookOpen,
  Sliders,
  Type,
  Scissors,
  Eye,
  ZoomIn,
  Volume2,
  UserCheck,
  Settings2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadStep = "idle" | "presigning" | "uploading" | "creating_job" | "completed" | "error";

export type AspectRatioType = "9:16" | "16:9" | "1:1" | "4:5";
export type VideoStyleType = "viral" | "cinematic" | "educational" | "minimal";
export type CaptionPresetType = "tiktok_yellow" | "neon_cyber" | "modern_clean" | "boxed_pill";

export function VideoUploadModal({ isOpen, onClose, onSuccess }: VideoUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [videoType, setVideoType] = useState<"talking_head" | "faceless_short">("talking_head");
  const [step, setStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Options & Styling State
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("9:16");
  const [videoStyle, setVideoStyle] = useState<VideoStyleType>("viral");
  const [captionPreset, setCaptionPreset] = useState<CaptionPresetType>("tiktok_yellow");
  const [characterAsset, setCharacterAsset] = useState<"SvgCharacterPreview" | "RiveCharacterPreview">("SvgCharacterPreview");
  const [activeTab, setActiveTab] = useState<"ratio" | "style" | "captions" | "ai" | "character">("ratio");

  // AI Feature Toggles
  const [aiFeatures, setAiFeatures] = useState({
    faceTracking: true,
    dynamicZooms: true,
    autoBroll: true,
    trimSilences: true,
    transitionSfx: true,
  });

  if (!isOpen) return null;

  function toggleAiFeature(key: keyof typeof aiFeatures) {
    setAiFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
    const validExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setErrorMessage(`Unsupported format. Please upload ${validExtensions.join(", ")}.`);
      return;
    }

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
      aspectRatio,
      videoStyle,
      captionPreset,
      characterAsset,
      aiFeatures,
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

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`[FRONTEND: STEP 2/3] ❌ Direct upload failed:`, errText);
        throw new Error(`Direct storage upload failed (${uploadRes.status}): ${errText}`);
      }
      console.log(`[FRONTEND: STEP 2/3] ✅ Binary upload complete.`);

      // Step 3: Register Video Job in PostgreSQL with Style & Ratio Settings
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
          settings: {
            aspect_ratio: aspectRatio,
            video_style: videoStyle,
            caption_preset: captionPreset,
            character_asset: characterAsset,
            ai_features: aiFeatures,
          },
        }),
      });

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

  const enabledAiCount = Object.values(aiFeatures).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0d1017] border border-slate-800 shadow-2xl p-6 md:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Ingest & Style Video</h2>
              <p className="text-xs text-slate-400">Configure ratio, editing style, subtitles and AI enhancements</p>
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
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Video Ingested Successfully!</h3>
            <p className="text-xs text-slate-400">
              Video job queued in PostgreSQL with your customized style, ratio, and AI preferences.
            </p>
          </div>
        ) : step !== "idle" && step !== "error" ? (
          /* Uploading Progress Screen */
          <div className="py-10 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-sm font-semibold text-white">
                {step === "presigning" && "Requesting Presigned URL..."}
                {step === "uploading" && "Uploading direct to Cloudflare R2 / S3..."}
                {step === "creating_job" && "Enqueuing Video Job in PostgreSQL with Style Profile..."}
              </div>
              <div className="text-xs text-slate-400">
                Direct browser binary stream • Zero web server memory load
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
                <span className="font-mono text-indigo-400">{aspectRatio} • {videoStyle}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Main Ingest & Style Form */
          <div className="space-y-5">
            {/* Dropzone / Selected File Preview */}
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2.5",
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
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-200">
                    Drag and drop your raw video here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    MP4, MOV, WebM up to 500MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white line-clamp-1">{selectedFile.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "video/mp4"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Video Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Video Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5 AI Secrets That Changed Everything"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Config Tabs: Ratio | Style | Captions | AI Features */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("ratio")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "ratio"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Video Ratio</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono">{aspectRatio}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("style")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "style"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Video Style</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("captions")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "captions"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Captions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "ai"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Enhancements</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    {enabledAiCount}/5
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab("character")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "character"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Character</span>
                </button>
              </div>

              {/* Tab 1: Video Ratio */}
              {activeTab === "ratio" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400">Select the target aspect ratio for your final export:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 9:16 Vertical */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio("9:16")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-2 transition-all relative flex flex-col justify-between",
                        aspectRatio === "9:16"
                          ? "border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-7 rounded-sm border-2 border-indigo-400 bg-indigo-500/20 flex items-center justify-center">
                          <span className="text-[7px] font-mono text-indigo-300">9:16</span>
                        </div>
                        {aspectRatio === "9:16" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">9:16 Vertical</div>
                        <div className="text-[10px] text-slate-400">Shorts / Reels / TikTok</div>
                        <div className="text-[9px] font-mono text-indigo-400 mt-0.5">1080 × 1920</div>
                      </div>
                    </button>

                    {/* 16:9 Landscape */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio("16:9")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-2 transition-all relative flex flex-col justify-between",
                        aspectRatio === "16:9"
                          ? "border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-7 h-4 rounded-sm border-2 border-slate-400 bg-slate-500/20 flex items-center justify-center">
                          <span className="text-[7px] font-mono text-slate-300">16:9</span>
                        </div>
                        {aspectRatio === "16:9" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">16:9 Landscape</div>
                        <div className="text-[10px] text-slate-400">YouTube / Web / TV</div>
                        <div className="text-[9px] font-mono text-indigo-400 mt-0.5">1920 × 1080</div>
                      </div>
                    </button>

                    {/* 1:1 Square */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio("1:1")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-2 transition-all relative flex flex-col justify-between",
                        aspectRatio === "1:1"
                          ? "border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-5 rounded-sm border-2 border-slate-400 bg-slate-500/20 flex items-center justify-center">
                          <span className="text-[7px] font-mono text-slate-300">1:1</span>
                        </div>
                        {aspectRatio === "1:1" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">1:1 Square</div>
                        <div className="text-[10px] text-slate-400">Instagram / LinkedIn</div>
                        <div className="text-[9px] font-mono text-indigo-400 mt-0.5">1080 × 1080</div>
                      </div>
                    </button>

                    {/* 4:5 Portrait */}
                    <button
                      type="button"
                      onClick={() => setAspectRatio("4:5")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-2 transition-all relative flex flex-col justify-between",
                        aspectRatio === "4:5"
                          ? "border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-5 h-6 rounded-sm border-2 border-slate-400 bg-slate-500/20 flex items-center justify-center">
                          <span className="text-[7px] font-mono text-slate-300">4:5</span>
                        </div>
                        {aspectRatio === "4:5" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">4:5 Portrait</div>
                        <div className="text-[10px] text-slate-400">IG Feed / Facebook</div>
                        <div className="text-[9px] font-mono text-indigo-400 mt-0.5">1080 × 1350</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Video Style */}
              {activeTab === "style" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400">Choose the pacing, transitions, and energy profile:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Viral Fast-Paced */}
                    <button
                      type="button"
                      onClick={() => setVideoStyle("viral")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        videoStyle === "viral"
                          ? "border-purple-500 bg-purple-950/30 text-white ring-1 ring-purple-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-purple-400" />
                          Viral Fast-Paced
                        </span>
                        <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                          Trending
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        High retention: punchy jump cuts, emphasis punch-ins, sound effects, and rapid dialogue flow.
                      </p>
                    </button>

                    {/* Cinematic Story */}
                    <button
                      type="button"
                      onClick={() => setVideoStyle("cinematic")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        videoStyle === "cinematic"
                          ? "border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
                          Cinematic Story
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                          Aesthetic
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Smooth atmospheric transitions, expressive B-roll overlays, natural speech cadence, and cinematic depth.
                      </p>
                    </button>

                    {/* Explainer / Tech */}
                    <button
                      type="button"
                      onClick={() => setVideoStyle("educational")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        videoStyle === "educational"
                          ? "border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          Explainer & Tech
                        </span>
                        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md">
                          Podcast / Tutor
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Structured clarity: key concept highlights, instructional B-roll, clean talking head framing, and zero fluff.
                      </p>
                    </button>

                    {/* Minimalist */}
                    <button
                      type="button"
                      onClick={() => setVideoStyle("minimal")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        videoStyle === "minimal"
                          ? "border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          Minimalist Clean
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          Authentic
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Pure speech preservation: trims long awkward silences while keeping the original camera angle untouched.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Subtitles & Captions */}
              {activeTab === "captions" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400">Select the typography & animated highlight preset:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* TikTok Yellow */}
                    <button
                      type="button"
                      onClick={() => setCaptionPreset("tiktok_yellow")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        captionPreset === "tiktok_yellow"
                          ? "border-amber-500 bg-amber-950/30 text-white ring-1 ring-amber-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">TikTok Bold Yellow</span>
                        <div className="px-2 py-0.5 rounded bg-black/80 font-black text-[11px] text-white">
                          Make it <span className="text-yellow-400 underline">POP</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Bold condensed sans-serif with high-contrast drop shadow and vibrant yellow karaoke word highlight.
                      </p>
                    </button>

                    {/* Neon Cyber */}
                    <button
                      type="button"
                      onClick={() => setCaptionPreset("neon_cyber")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        captionPreset === "neon_cyber"
                          ? "border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Neon Cyberpunk</span>
                        <div className="px-2 py-0.5 rounded bg-black/80 font-black text-[11px] text-white">
                          Ultra <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">CYAN</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Futuristic glow styling with cyan active words and subtle purple accent shadows for tech creators.
                      </p>
                    </button>

                    {/* Modern Clean */}
                    <button
                      type="button"
                      onClick={() => setCaptionPreset("modern_clean")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        captionPreset === "modern_clean"
                          ? "border-slate-400 bg-slate-800/40 text-white ring-1 ring-slate-400"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Modern Clean</span>
                        <div className="px-2 py-0.5 rounded bg-black/80 font-medium text-[11px] text-slate-200">
                          Elegant & Simple
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Minimalist typography with subtle outline, suitable for professional talk shows and documentaries.
                      </p>
                    </button>

                    {/* Boxed Pill */}
                    <button
                      type="button"
                      onClick={() => setCaptionPreset("boxed_pill")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        captionPreset === "boxed_pill"
                          ? "border-orange-500 bg-orange-950/30 text-white ring-1 ring-orange-500"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">High-Contrast Box</span>
                        <div className="px-2 py-0.5 rounded bg-orange-500 font-bold text-[11px] text-black">
                          HIGHLIGHT
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Vibrant rounded badge background wrapping the keyword phrase for maximum contrast on noisy video.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: AI Enhancements */}
              {activeTab === "ai" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400">Toggle individual AI pipeline features for this video:</div>
                  <div className="space-y-2">
                    {/* Face Tracking */}
                    <div
                      onClick={() => toggleAiFeature("faceTracking")}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Smart Face-Tracking (MediaPipe)</div>
                          <div className="text-[10px] text-slate-400">Keeps speaker centered in 9:16 vertical crop with smooth interpolation</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiFeatures.faceTracking}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </div>

                    {/* Dynamic Keyword Zooms */}
                    <div
                      onClick={() => toggleAiFeature("dynamicZooms")}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Dynamic Keyword Zooms</div>
                          <div className="text-[10px] text-slate-400">Applies 1.15x - 1.25x punch-in zooms during emphatic statements</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiFeatures.dynamicZooms}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </div>

                    {/* Auto B-Roll */}
                    <div
                      onClick={() => toggleAiFeature("autoBroll")}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Smart Stock B-Roll (Pexels)</div>
                          <div className="text-[10px] text-slate-400">Contextually downloads and overlays matching stock footage for visual metaphors</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiFeatures.autoBroll}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </div>

                    {/* Silence Trimming */}
                    <div
                      onClick={() => toggleAiFeature("trimSilences")}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                          <Scissors className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Silence & Stutter Trimming</div>
                          <div className="text-[10px] text-slate-400">Detects dead pauses &gt; 1.0s and false starts to tighten pacing</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiFeatures.trimSilences}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </div>

                    {/* Transition SFX */}
                    <div
                      onClick={() => toggleAiFeature("transitionSfx")}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                          <Volume2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Transition Sound Effects</div>
                          <div className="text-[10px] text-slate-400">Adds subtle audio whoosh/pop cues during visual B-roll cuts</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={aiFeatures.transitionSfx}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Character Selection */}
              {activeTab === "character" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400">Choose the animated character style:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* SVG Presenter */}
                    <button
                      type="button"
                      onClick={() => setCharacterAsset("SvgCharacterPreview")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        characterAsset === "SvgCharacterPreview"
                          ? "border-emerald-500 bg-emerald-950/30 text-white ring-1 ring-emerald-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          SVG Presenter (Recommended)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Fully animated SVG character with transparent background, blinking, talking, and arm gestures.
                      </p>
                    </button>

                    {/* Rive Presenter */}
                    <button
                      type="button"
                      onClick={() => setCharacterAsset("RiveCharacterPreview")}
                      className={cn(
                        "p-3 rounded-xl border text-left space-y-1.5 transition-all",
                        characterAsset === "RiveCharacterPreview"
                          ? "border-orange-500 bg-orange-950/30 text-white ring-1 ring-orange-500 shadow-sm"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          Rive 3D Boy (Experimental)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Static 3D canvas boy with a background block. (Animations are currently not synced with Remotion).
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Settings Summary Pill */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Config:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">{aspectRatio}</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 capitalize">{videoStyle}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 capitalize">{captionPreset.replace('_', ' ')}</span>
              </div>
              <span className="text-emerald-400 font-medium">✓ {enabledAiCount} AI modules ready</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
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
