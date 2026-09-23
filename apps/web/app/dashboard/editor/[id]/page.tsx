"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorTopNav } from "@/components/editor/EditorTopNav";
import { PlayerMonitor } from "@/components/editor/PlayerMonitor";
import { TimelineToolbar } from "@/components/editor/TimelineToolbar";
import { TimelineContainer } from "@/components/editor/TimelineContainer";
import { MediaDrawer } from "@/components/editor/MediaDrawer";
import { InspectorPanel } from "@/components/editor/InspectorPanel";
import { MobileBottomBar } from "@/components/editor/MobileBottomBar";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { TimelineProject } from "@/lib/timeline-types";
import { CheckCircle2, X } from "lucide-react";

export default function StudioEditorPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "new";

  const { project, initProject } = useTimelineStore();
  const [activeDrawerTab, setActiveDrawerTab] = useState<"media" | "captions" | "broll" | "audio">("media");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopDrawerOpen, setIsDesktopDrawerOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize or load project
  useEffect(() => {
    if (!mounted) return;

    // Use getState() directly to avoid stale closures overwriting the draft
    const currentProject = useTimelineStore.getState().project;
    if (currentProject.id !== "default-project") {
      return;
    }

    // Default sample project to let users play immediately
    const sampleProject: TimelineProject = {
      id: projectId,
      title: "Viral TikTok Reel",
      aspectRatio: "9:16",
      duration: 12.0,
      fps: 30,
      tracks: {
        videoTrack: [
          {
            id: "clip-demo-1",
            sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            name: "Main Talking Head",
            start: 0,
            end: 12.0,
            sourceStart: 0,
            sourceEnd: 12.0,
            speed: 1,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
        brollTrack: [
          {
            id: "broll-demo-1",
            sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            name: "Tech Overlay",
            start: 3.5,
            end: 7.0,
            opacity: 100,
            fitMode: "cover",
          },
        ],
        textTrack: [
          {
            id: "caption-demo-1",
            text: "WELCOME TO THE FUTURE",
            start: 0.5,
            end: 3.5,
            stylePreset: "tiktok_yellow",
            positionY: 75,
          },
          {
            id: "caption-demo-2",
            text: "BUILD LIKE A PRO",
            start: 4.0,
            end: 8.0,
            stylePreset: "hormozi_bold",
            positionY: 75,
          },
        ],
        audioTrack: [],
      },
    };

    initProject(sampleProject);
  }, [mounted, projectId, initProject]);

  const handleExport = () => {
    setIsExporting(true);
    // Simulate local render completion
    setTimeout(() => {
      setIsExporting(false);
      setExportModalOpen(true);
    }, 2500);
  };

  const handleOpenDrawer = (tab: "media" | "captions" | "broll" | "audio") => {
    setActiveDrawerTab(tab);
    setIsMobileDrawerOpen(true);
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-neutral-500">
        Loading editor workspace...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-neutral-100 overflow-hidden select-none">
      {/* 1. Top Navbar */}
      <EditorTopNav
        onExport={handleExport}
        isExporting={isExporting}
        isDrawerOpen={isDesktopDrawerOpen}
        onToggleDrawer={() => setIsDesktopDrawerOpen(!isDesktopDrawerOpen)}
      />

      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Media & Tools Drawer */}
        {isDesktopDrawerOpen && (
          <MediaDrawer
            activeTab={activeDrawerTab}
            onTabChange={(tab) => setActiveDrawerTab(tab)}
            isOpenMobile={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />
        )}

        {/* Center: Video Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
          {/* Top Half: Video Monitor */}
          <div className="flex-1 flex flex-col min-h-0">
            <PlayerMonitor />
          </div>

          {/* Bottom Half: Toolbar + Timeline */}
          <div className="h-[270px] md:h-[300px] flex flex-col border-t border-neutral-900 bg-neutral-950">
            <TimelineToolbar onOpenDrawer={handleOpenDrawer} />
            <TimelineContainer />
          </div>
        </div>

        {/* Right Inspector Panel */}
        <InspectorPanel />
      </div>

      {/* 3. Mobile Bottom Action Tray (for screens < 768px) */}
      <MobileBottomBar onOpenDrawer={handleOpenDrawer} />

      {/* Export Success Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Export Recipe Ready!</span>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Your CapCut-style timeline has been compiled into high-resolution compositing instructions (cuts: {project.tracks.videoTrack.length}, captions: {project.tracks.textTrack.length}, overlays: {project.tracks.brollTrack.length}).
            </p>

            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify({
                aspectRatio: project.aspectRatio,
                duration: `${project.duration.toFixed(1)}s`,
                videoClips: project.tracks.videoTrack.length,
                captions: project.tracks.textTrack.map((t) => t.text),
              }, null, 2)}</pre>
            </div>

            <button
              onClick={() => setExportModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 font-bold text-xs text-black shadow-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
