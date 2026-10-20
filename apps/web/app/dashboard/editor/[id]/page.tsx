"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditorTopNav } from "@/components/editor/EditorTopNav";
import { PlayerMonitor } from "@/components/editor/PlayerMonitor";
import { TimelineToolbar } from "@/components/editor/TimelineToolbar";
import { TimelineContainer } from "@/components/editor/TimelineContainer";
import { MediaDrawer, MediaDrawerTab } from "@/components/editor/MediaDrawer";
import { InspectorPanel } from "@/components/editor/InspectorPanel";
import { MobileBottomBar } from "@/components/editor/MobileBottomBar";
import { ChatAssistantDrawer } from "@/components/editor/ChatAssistantDrawer";
import { RenderExportModal } from "@/components/editor/RenderExportModal";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { TimelineProject } from "@/lib/timeline-types";
import { convertVisualTimelineToSafeZones } from "@/lib/layout/subject-avoidance";
import { CheckCircle2, X } from "lucide-react";

export default function StudioEditorPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "new";

  const { project, initProject } = useTimelineStore();
  const [activeDrawerTab, setActiveDrawerTab] = useState<MediaDrawerTab>("media");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopDrawerOpen, setIsDesktopDrawerOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Cmd+K / Ctrl+K listener for AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize or load project
  useEffect(() => {
    if (!mounted) return;

    // Use getState() directly to avoid stale closures overwriting the draft
    const currentProject = useTimelineStore.getState().project;
    if (currentProject.id !== "default-project") {
      return;
    }

    const loadProject = async () => {
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
        safeZones: [
          {
            id: "sample-presenter-sz-1",
            timestamp: 0,
            duration: 12.0,
            x: 25,
            y: 35,
            width: 50,
            height: 55,
            confidence: 0.96,
            type: "subject",
          },
        ],
        transcript: {
          videoId: projectId,
          words: [
            { word: "Welcome", start: 0.5, end: 1.1, probability: 0.98 },
            { word: "to", start: 1.15, end: 1.35, probability: 0.99 },
            { word: "the", start: 1.4, end: 1.6, probability: 0.99 },
            { word: "future", start: 1.65, end: 2.3, probability: 0.97 },
            { word: "of", start: 2.35, end: 2.55, probability: 0.99 },
            { word: "automated", start: 2.6, end: 3.2, probability: 0.96 },
            { word: "video", start: 3.25, end: 3.7, probability: 0.98 },
            { word: "creation.", start: 3.75, end: 4.3, probability: 0.95 },
            { word: "Build", start: 4.5, end: 5.0, probability: 0.99 },
            { word: "viral", start: 5.05, end: 5.5, probability: 0.97 },
            { word: "clips", start: 5.55, end: 6.0, probability: 0.98 },
            { word: "like", start: 6.05, end: 6.35, probability: 0.99 },
            { word: "a", start: 6.4, end: 6.55, probability: 0.99 },
            { word: "pro", start: 6.6, end: 7.2, probability: 0.98 },
            { word: "with", start: 7.3, end: 7.6, probability: 0.99 },
            { word: "synchronized", start: 7.65, end: 8.4, probability: 0.95 },
            { word: "motion", start: 8.45, end: 9.0, probability: 0.97 },
            { word: "graphics.", start: 9.05, end: 9.8, probability: 0.96 },
            { word: "Subscribe", start: 10.0, end: 10.7, probability: 0.99 },
            { word: "for", start: 10.75, end: 11.0, probability: 0.99 },
            { word: "more!", start: 11.05, end: 11.8, probability: 0.98 },
          ],
          beatSheet: {
            beats: [
              { id: 1, start: 0.5, end: 4.3, text: "Welcome to the future of automated video creation", role: "hook", energy: "high", importance: 5 },
              { id: 2, start: 4.5, end: 9.8, text: "Build viral clips like a pro with synchronized motion graphics", role: "story", energy: "medium", importance: 4 },
              { id: 3, start: 10.0, end: 12.0, text: "Subscribe for more content", role: "cta", energy: "high", importance: 5 },
            ],
          },
          text: "Welcome to the future of automated video creation. Build viral clips like a pro with synchronized motion graphics. Subscribe for more!",
        },
      };

      // If opening an existing video project from API, fetch pre-computed visual timeline & transcript
      if (projectId && projectId !== "new") {
        try {
          const [visualRes, transcriptRes] = await Promise.all([
            fetch(`/api/v1/videos/${projectId}/visual-timeline`).catch(() => null),
            fetch(`/api/v1/videos/${projectId}/transcript`).catch(() => null),
          ]);

          if (visualRes && visualRes.ok) {
            const visualData = await visualRes.json();
            const convertedZones = convertVisualTimelineToSafeZones(visualData, sampleProject.duration);
            if (convertedZones.length > 0) {
              sampleProject.safeZones = convertedZones;
            }
          }

          if (transcriptRes && transcriptRes.ok) {
            const transcriptData = await transcriptRes.json();
            if (transcriptData && Array.isArray(transcriptData.words) && transcriptData.words.length > 0) {
              sampleProject.transcript = transcriptData;
            }
          }
        } catch {
          // Graceful fallback to default sample project when offline or testing
        }
      }

      initProject(sampleProject);
    };

    loadProject();
  }, [mounted, projectId, initProject]);

  const handleExport = () => {
    setExportModalOpen(true);
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
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
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

      {/* Production Render & NLE Export Modal */}
      <RenderExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        project={project}
      />

      {/* AI Assistant Drawer (Cmd+K) */}
      <ChatAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
