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
import { VersionHistoryDrawer } from "@/components/editor/VersionHistoryDrawer";
import { useTimelineStore } from "@/lib/stores/useTimelineStore";
import { TimelineProject } from "@/lib/timeline-types";
import { convertVisualTimelineToSafeZones } from "@/lib/layout/subject-avoidance";
import { isPresetOrLocalId, getPresetProject } from "@/lib/editor/editor-presets";

export default function StudioEditorPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "new";

  const { project, initProject } = useTimelineStore();
  const [activeDrawerTab, setActiveDrawerTab] = useState<MediaDrawerTab>("media");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopDrawerOpen, setIsDesktopDrawerOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isExporting = false;
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const isPresetOrLocal = isPresetOrLocalId(projectId);
  const isRealProject = Boolean(projectId && !isPresetOrLocal);
  const [isLoading, setIsLoading] = useState(isRealProject);
  const [isLoadedFromServer, setIsLoadedFromServer] = useState(!isRealProject);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

    const loadProject = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // If opening an existing video project from API, fetch persisted timeline, visual timeline & transcript
      if (isRealProject) {
        setIsLoading(true);
        try {
          const [videoJobRes, timelineRes, visualRes, transcriptRes] = await Promise.all([
            fetch(`${apiBase}/api/v1/videos/${projectId}`).catch(() => null),
            fetch(`${apiBase}/api/v1/videos/${projectId}/timeline`).catch(() => null),
            fetch(`${apiBase}/api/v1/videos/${projectId}/visual-timeline`).catch(() => null),
            fetch(`${apiBase}/api/v1/videos/${projectId}/transcript`).catch(() => null),
          ]);

          let activeProject: TimelineProject | null = null;
          let videoJob: {
            title?: string;
            rendered_url?: string;
            source_url?: string;
            settings?: { duration?: string; aspect_ratio?: "9:16" | "16:9" | "1:1" | "4:5" };
          } | null = null;
          if (videoJobRes && videoJobRes.ok) {
            videoJob = await videoJobRes.json();
          }

          if (timelineRes && timelineRes.ok) {
            const serverProject = await timelineRes.json();
            if (serverProject && serverProject.tracks) {
              activeProject = {
                ...serverProject,
                id: projectId,
                videoId: projectId,
                title: videoJob?.title || serverProject.title || "Studio Video",
              };
            }
          }

          if (!activeProject) {
            // Fallback for real project whose timeline is not yet compiled
            const dur = parseFloat(videoJob?.settings?.duration || "12.0");
            activeProject = {
              id: projectId,
              videoId: projectId,
              title: videoJob?.title || "Studio Video",
              aspectRatio: videoJob?.settings?.aspect_ratio || "9:16",
              duration: dur,
              fps: 30,
              tracks: {
                videoTrack: [],
                brollTrack: [],
                textTrack: [],
                audioTrack: [],
                graphicsTrack: [],
              },
            };
          }

          // Ensure base video clip exists if media was rendered or uploaded
          const localProxyUrl = `${apiBase}/api/v1/videos/${projectId}/rendered-file`;
          const vTrack = activeProject.tracks.videoTrack || [];
          if (vTrack.length === 0) {
            activeProject.tracks.videoTrack = [
              {
                id: `clip-${projectId}`,
                name: activeProject.title || "AI Generated Video",
                sourceUrl: localProxyUrl,
                proxyUrl: localProxyUrl,
                start: 0,
                end: activeProject.duration,
                sourceStart: 0,
                sourceEnd: activeProject.duration,
                speed: 1,
                volume: 100,
                zoomFactor: 1.0,
              },
            ];
          } else {
            for (const clip of vTrack) {
              clip.proxyUrl = localProxyUrl;
              if (!clip.sourceUrl || (clip.sourceUrl.includes("amazonaws.com") && !clip.sourceUrl.includes("X-Amz-"))) {
                clip.sourceUrl = localProxyUrl;
              }
            }
          }

          if (visualRes && visualRes.ok) {
            const visualData = await visualRes.json();
            const convertedZones = convertVisualTimelineToSafeZones(visualData, activeProject.duration);
            if (convertedZones.length > 0) {
              activeProject.safeZones = convertedZones;
            }
          }

          if (transcriptRes && transcriptRes.ok) {
            const transcriptData = await transcriptRes.json();
            if (transcriptData && Array.isArray(transcriptData.words) && transcriptData.words.length > 0) {
              activeProject.transcript = transcriptData;
            }
          }

          initProject(activeProject);
          setIsLoadedFromServer(true);
        } catch (err) {
          console.error("Failed to load server project:", err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Default sample project for demo / new
      // For local uploads or presets, check if project is already initialized in memory with tracks
      const currentStoreProject = useTimelineStore.getState().project;
      if (
        currentStoreProject &&
        currentStoreProject.id === projectId &&
        (currentStoreProject.tracks?.videoTrack?.length || 0) > 0
      ) {
        setIsLoadedFromServer(true);
        setIsLoading(false);
        return;
      }

      // Load full preset configuration (viral, podcast, youtube, product, demo, etc.)
      const presetProject = getPresetProject(projectId);
      initProject(presetProject);

      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const tParam = urlParams.get("t");
        if (tParam) {
          const t = parseFloat(tParam);
          if (!isNaN(t) && t >= 0) {
            useTimelineStore.getState().setPlayheadTime(t);
          }
        }
      }

      setIsLoadedFromServer(true);
      setIsLoading(false);
    };

    loadProject();
  }, [mounted, projectId, isRealProject, initProject]);

  // Debounced Auto-Save to Backend: only when loaded from server for real database projects
  useEffect(() => {
    if (!mounted || !isLoadedFromServer || !isRealProject || !projectId || projectId === "new" || project.id === "default-project") return;

    const timer = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiBase}/api/v1/videos/${projectId}/timeline`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project }),
        });
      } catch {
        // Silently tolerate temporary network blips during local edit sessions
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [mounted, isLoadedFromServer, isRealProject, projectId, project]);

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleOpenDrawer = (tab: MediaDrawerTab) => {
    setActiveDrawerTab(tab);
    setIsMobileDrawerOpen(true);
  };

  if (!mounted || isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-neutral-400 gap-3">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading project timeline...</span>
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
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
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
          <div className="h-[270px] md:h-[300px] flex flex-col border-t border-white/[0.06] bg-[#090b10]">
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

      {/* Cloud Version History & Checkpoint Drawer */}
      <VersionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        videoId={projectId}
        currentProject={project}
        onRestoreProject={(restoredProject) => {
          initProject(restoredProject);
        }}
      />
    </div>
  );
}
