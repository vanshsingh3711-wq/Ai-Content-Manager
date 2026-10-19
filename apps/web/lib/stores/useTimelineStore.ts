import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TimelineProject,
  VideoClip,
  BRollClip,
  CaptionBlock,
  AudioClip,
  GraphicElement,
  TrackItemType,
  AspectRatio,
  HistoryState,
  InterpolationType,
  SemanticConstraint,
  TranscriptData,
} from "../timeline-types";
import { EditOperation } from "../operations/operation-types";
import { executeOperation } from "../operations/operation-executor";
import { SnapGuide } from "../editor/snapping";
import { resolveProjectLayout, LayoutResolutionOptions } from "../layout/layout-resolver";
import { reflowProjectToAspectRatio } from "../layout/aspect-ratio-reflow";

interface SelectedItem {
  type: TrackItemType;
  id: string;
}

interface TimelineState {
  project: TimelineProject;
  playheadTime: number;
  isPlaying: boolean;
  zoomLevel: number; // Pixels per second (e.g. 40)
  selectedItem: SelectedItem | null;
  safeZoneVisible: boolean;
  subjectOverlayVisible: boolean;
  activeSnapGuides: SnapGuide[];

  // History stack for Undo / Redo
  past: HistoryState[];
  future: HistoryState[];

  // Actions
  initProject: (project: TimelineProject) => void;
  setPlayheadTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setZoomLevel: (zoom: number) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setSelectedItem: (item: SelectedItem | null) => void;
  setSafeZoneVisible: (visible: boolean) => void;
  setSubjectOverlayVisible: (visible: boolean) => void;
  toggleSubjectOverlay: () => void;
  setActiveSnapGuides: (guides: SnapGuide[]) => void;

  // Video track actions
  splitClipAtPlayhead: (targetType?: SelectedItem["type"], targetClipId?: string) => void;
  trimVideoClip: (clipId: string, newStart: number, newEnd: number) => void;
  deleteClip: (type: SelectedItem["type"], id: string) => void;
  updateVideoClip: (clipId: string, updates: Partial<VideoClip>, saveHistory?: boolean) => void;
  reorderVideoClips: (fromIndex: number, toIndex: number) => void;

  // B-Roll actions
  addBRollClip: (clip: Omit<BRollClip, "id">) => void;
  updateBRollClip: (id: string, updates: Partial<BRollClip>, saveHistory?: boolean) => void;

  // Caption actions
  addCaption: (caption?: Partial<CaptionBlock>) => void;
  updateCaption: (id: string, updates: Partial<CaptionBlock>, saveHistory?: boolean) => void;

  // Audio actions
  addAudioClip: (audio: Omit<AudioClip, "id">) => void;
  updateAudioClip: (id: string, updates: Partial<AudioClip>) => void;

  // Graphics actions
  addGraphicElement: (element: Omit<GraphicElement, "id">) => void;
  updateGraphicElement: (id: string, updates: Partial<GraphicElement>, saveHistory?: boolean) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;

  // Keyframes
  setKeyframe: (trackType: SelectedItem["type"], clipId: string, property: string, time: number, value: any, saveHistory?: boolean, interpolation?: InterpolationType) => void;
  removeKeyframe: (trackType: SelectedItem["type"], clipId: string, property: string, time: number) => void;

  // Operational Command Bus
  dispatchOperation: (op: EditOperation) => void;
  dispatchBatch: (ops: EditOperation[], description?: string) => void;

  // Semantic Constraints & Layout Resolution
  resolveLayout: (options?: LayoutResolutionOptions) => void;
  addConstraint: (constraint: SemanticConstraint) => void;
  removeConstraint: (constraintId: string) => void;

  // Transcript & Story Beats
  setTranscript: (transcript: TranscriptData) => void;
}

const DEFAULT_PROJECT: TimelineProject = {
  id: "default-project",
  title: "Untitled Studio Video",
  aspectRatio: "9:16",
  duration: 10,
  fps: 30,
  tracks: {
    videoTrack: [],
    brollTrack: [],
    textTrack: [],
    audioTrack: [],
    graphicsTrack: [],
  },
  constraints: [],
  safeZones: [],
};

const createHistorySnapshot = (project: TimelineProject): HistoryState => ({
  tracks: JSON.parse(JSON.stringify(project.tracks)),
  duration: project.duration,
  aspectRatio: project.aspectRatio,
  constraints: project.constraints ? JSON.parse(JSON.stringify(project.constraints)) : [],
  safeZones: project.safeZones ? JSON.parse(JSON.stringify(project.safeZones)) : [],
  transcript: project.transcript ? JSON.parse(JSON.stringify(project.transcript)) : undefined,
});

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
  project: DEFAULT_PROJECT,
  playheadTime: 0,
  isPlaying: false,
  zoomLevel: 40,
  selectedItem: null,
  safeZoneVisible: false,
  subjectOverlayVisible: false,
  activeSnapGuides: [],
  past: [],
  future: [],

  initProject: (project) => {
    set({
      project,
      playheadTime: 0,
      isPlaying: false,
      selectedItem: null,
      activeSnapGuides: [],
      past: [],
      future: [],
    });
  },

  setActiveSnapGuides: (activeSnapGuides) => set({ activeSnapGuides }),

  setPlayheadTime: (time) => {
    const { project } = get();
    const clampedTime = Math.max(0, Math.min(time, project.duration));
    set({ playheadTime: clampedTime });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setZoomLevel: (zoomLevel) => {
    const clamped = Math.max(10, Math.min(zoomLevel, 200));
    set({ zoomLevel: clamped });
  },

  setAspectRatio: (aspectRatio) => {
    const { project, past } = get();
    if (project.aspectRatio === aspectRatio) return;

    const snapshot = createHistorySnapshot(project);
    const reflowedProject = reflowProjectToAspectRatio(project, aspectRatio);

    set({
      project: reflowedProject,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  setSelectedItem: (selectedItem) => set({ selectedItem }),

  setSafeZoneVisible: (safeZoneVisible) => set({ safeZoneVisible }),

  setSubjectOverlayVisible: (subjectOverlayVisible) => set({ subjectOverlayVisible }),

  toggleSubjectOverlay: () => set((state) => ({ subjectOverlayVisible: !state.subjectOverlayVisible })),

  splitClipAtPlayhead: (targetType = "video", targetClipId) => {
    const { project, playheadTime, past } = get();
    const tracks = { ...project.tracks };
    const snapshot = createHistorySnapshot(project);

    const splitOffset = (start: number) => playheadTime - start;

    if (targetType === "video") {
      const videoTrack = [...tracks.videoTrack];
      const clipIndex = targetClipId
        ? videoTrack.findIndex((c) => c.id === targetClipId)
        : videoTrack.findIndex((c) => playheadTime > c.start + 0.1 && playheadTime < c.end - 0.1);

      if (clipIndex === -1) return;
      const target = videoTrack[clipIndex];
      if (playheadTime <= target.start + 0.1 || playheadTime >= target.end - 0.1) return;

      const sourceSplitPoint = target.sourceStart + splitOffset(target.start) * (target.speed || 1);
      const clipA: VideoClip = { ...target, id: `${target.id}-p1-${Date.now()}`, end: playheadTime, sourceEnd: sourceSplitPoint };
      const clipB: VideoClip = { ...target, id: `${target.id}-p2-${Date.now()}`, start: playheadTime, sourceStart: sourceSplitPoint };
      videoTrack.splice(clipIndex, 1, clipA, clipB);
      tracks.videoTrack = videoTrack;
      
      set({
        project: { ...project, tracks },
        selectedItem: { type: "video", id: clipB.id },
        past: [...past.slice(-29), snapshot],
        future: [],
      });
    } else if (targetType === "broll") {
      const brollTrack = [...tracks.brollTrack];
      const clipIndex = targetClipId
        ? brollTrack.findIndex((c) => c.id === targetClipId)
        : brollTrack.findIndex((c) => playheadTime > c.start + 0.1 && playheadTime < c.end - 0.1);

      if (clipIndex === -1) return;
      const target = brollTrack[clipIndex];
      if (playheadTime <= target.start + 0.1 || playheadTime >= target.end - 0.1) return;

      const clipA: BRollClip = { ...target, id: `${target.id}-p1-${Date.now()}`, end: playheadTime };
      const clipB: BRollClip = { ...target, id: `${target.id}-p2-${Date.now()}`, start: playheadTime };
      brollTrack.splice(clipIndex, 1, clipA, clipB);
      tracks.brollTrack = brollTrack;

      set({
        project: { ...project, tracks },
        selectedItem: { type: "broll", id: clipB.id },
        past: [...past.slice(-29), snapshot],
        future: [],
      });
    } else if (targetType === "caption") {
      const textTrack = [...tracks.textTrack];
      const clipIndex = targetClipId
        ? textTrack.findIndex((c) => c.id === targetClipId)
        : textTrack.findIndex((c) => playheadTime > c.start + 0.1 && playheadTime < c.end - 0.1);

      if (clipIndex === -1) return;
      const target = textTrack[clipIndex];
      if (playheadTime <= target.start + 0.1 || playheadTime >= target.end - 0.1) return;

      const clipA: CaptionBlock = { ...target, id: `${target.id}-p1-${Date.now()}`, end: playheadTime };
      const clipB: CaptionBlock = { ...target, id: `${target.id}-p2-${Date.now()}`, start: playheadTime };
      textTrack.splice(clipIndex, 1, clipA, clipB);
      tracks.textTrack = textTrack;

      set({
        project: { ...project, tracks },
        selectedItem: { type: "caption", id: clipB.id },
        past: [...past.slice(-29), snapshot],
        future: [],
      });
    } else if (targetType === "audio") {
      const audioTrack = [...tracks.audioTrack];
      const clipIndex = targetClipId
        ? audioTrack.findIndex((c) => c.id === targetClipId)
        : audioTrack.findIndex((c) => playheadTime > c.start + 0.1 && playheadTime < c.end - 0.1);

      if (clipIndex === -1) return;
      const target = audioTrack[clipIndex];
      if (playheadTime <= target.start + 0.1 || playheadTime >= target.end - 0.1) return;

      const clipA: AudioClip = { ...target, id: `${target.id}-p1-${Date.now()}`, end: playheadTime };
      const clipB: AudioClip = { ...target, id: `${target.id}-p2-${Date.now()}`, start: playheadTime };
      audioTrack.splice(clipIndex, 1, clipA, clipB);
      tracks.audioTrack = audioTrack;

      set({
        project: { ...project, tracks },
        selectedItem: { type: "audio", id: clipB.id },
        past: [...past.slice(-29), snapshot],
        future: [],
      });
    } else if (targetType === "graphic") {
      const graphicsTrack = [...(tracks.graphicsTrack || [])];
      const clipIndex = targetClipId
        ? graphicsTrack.findIndex((c) => c.id === targetClipId)
        : graphicsTrack.findIndex((c) => playheadTime > c.start + 0.1 && playheadTime < c.end - 0.1);

      if (clipIndex === -1) return;
      const target = graphicsTrack[clipIndex];
      if (playheadTime <= target.start + 0.1 || playheadTime >= target.end - 0.1) return;

      const clipA: GraphicElement = { ...target, id: `${target.id}-p1-${Date.now()}`, end: playheadTime };
      const clipB: GraphicElement = { ...target, id: `${target.id}-p2-${Date.now()}`, start: playheadTime };
      graphicsTrack.splice(clipIndex, 1, clipA, clipB);
      tracks.graphicsTrack = graphicsTrack;

      set({
        project: { ...project, tracks },
        selectedItem: { type: "graphic", id: clipB.id },
        past: [...past.slice(-29), snapshot],
        future: [],
      });
    }
  },

  trimVideoClip: (clipId, newStart, newEnd) => {
    const { project, past } = get();
    const videoTrack = [...project.tracks.videoTrack];
    const index = videoTrack.findIndex((c) => c.id === clipId);
    if (index === -1) return;

    const clip = videoTrack[index];
    if (newEnd - newStart < 0.2) return; // minimum 0.2s length

    const snapshot = createHistorySnapshot(project);

    // Calculate source time mapping
    const updatedClip: VideoClip = {
      ...clip,
      start: Math.max(0, newStart),
      end: Math.max(newStart + 0.2, newEnd),
      sourceEnd: clip.sourceStart + (newEnd - newStart) * (clip.speed || 1),
    };

    videoTrack[index] = updatedClip;

    // Recalculate duration
    const maxEnd = Math.max(
      ...videoTrack.map((c) => c.end),
      ...project.tracks.brollTrack.map((b) => b.end),
      ...project.tracks.textTrack.map((t) => t.end),
      project.duration
    );

    set({
      project: {
        ...project,
        duration: maxEnd,
        tracks: {
          ...project.tracks,
          videoTrack,
        },
      },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  deleteClip: (type, id) => {
    const { project, past, selectedItem } = get();
    const snapshot = createHistorySnapshot(project);
    const tracks = { ...project.tracks };

    if (type === "video") {
      const index = tracks.videoTrack.findIndex((c) => c.id === id);
      if (index !== -1) {
        const deletedClip = tracks.videoTrack[index];
        const clipDuration = deletedClip.end - deletedClip.start;
        tracks.videoTrack = tracks.videoTrack.filter((c) => c.id !== id);

        // Ripple delete: shift all subsequent clips backwards
        tracks.videoTrack = tracks.videoTrack.map((c, i) => {
          if (i >= index) {
            return {
              ...c,
              start: Math.max(0, c.start - clipDuration),
              end: Math.max(0.1, c.end - clipDuration),
            };
          }
          return c;
        });
      }
    } else if (type === "broll") {
      tracks.brollTrack = tracks.brollTrack.filter((b) => b.id !== id);
    } else if (type === "caption") {
      tracks.textTrack = tracks.textTrack.filter((t) => t.id !== id);
    } else if (type === "audio") {
      tracks.audioTrack = tracks.audioTrack.filter((a) => a.id !== id);
    } else if (type === "graphic") {
      tracks.graphicsTrack = (tracks.graphicsTrack || []).filter((g) => g.id !== id);
    }

    const newDuration = Math.max(
      ...tracks.videoTrack.map((c) => c.end),
      5
    );

    set({
      project: {
        ...project,
        duration: newDuration,
        tracks,
      },
      selectedItem: selectedItem?.id === id ? null : selectedItem,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  updateVideoClip: (clipId, updates, saveHistory = true) => {
    const { project, past } = get();
    const videoTrack = project.tracks.videoTrack.map((clip) =>
      clip.id === clipId ? { ...clip, ...updates } : clip
    );

    const newState: any = {
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          videoTrack,
        },
      },
    };

    if (saveHistory) {
      newState.past = [...past.slice(-29), createHistorySnapshot(project)];
      newState.future = [];
    }

    set(newState);
  },

  reorderVideoClips: (fromIndex, toIndex) => {
    const { project, past } = get();
    const videoTrack = [...project.tracks.videoTrack];
    if (
      fromIndex < 0 ||
      fromIndex >= videoTrack.length ||
      toIndex < 0 ||
      toIndex >= videoTrack.length
    ) {
      return;
    }

    const snapshot = createHistorySnapshot(project);
    const [moved] = videoTrack.splice(fromIndex, 1);
    videoTrack.splice(toIndex, 0, moved);

    // Recompute contiguous start and end times for all video clips
    let runningTime = 0;
    const recalculated = videoTrack.map((clip) => {
      const length = clip.end - clip.start;
      const updated = {
        ...clip,
        start: runningTime,
        end: runningTime + length,
      };
      runningTime += length;
      return updated;
    });

    set({
      project: {
        ...project,
        duration: Math.max(runningTime, 5),
        tracks: {
          ...project.tracks,
          videoTrack: recalculated,
        },
      },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  addBRollClip: (clipData) => {
    const { project, playheadTime, past } = get();
    const snapshot = createHistorySnapshot(project);
    const duration = clipData.end > clipData.start ? clipData.end - clipData.start : 3.0;

    const newClip: BRollClip = {
      ...clipData,
      id: `broll-${Date.now()}`,
      start: playheadTime,
      end: playheadTime + duration,
      opacity: clipData.opacity ?? 100,
      fitMode: clipData.fitMode ?? "cover",
    };

    set({
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          brollTrack: [...project.tracks.brollTrack, newClip],
        },
      },
      selectedItem: { type: "broll", id: newClip.id },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  updateBRollClip: (id, updates, saveHistory = true) => {
    const { project, past } = get();
    const brollTrack = project.tracks.brollTrack.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    
    const newState: any = {
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          brollTrack,
        },
      },
    };

    if (saveHistory) {
      newState.past = [...past.slice(-29), createHistorySnapshot(project)];
      newState.future = [];
    }

    set(newState);
  },

  addCaption: (caption) => {
    const { project, playheadTime, past } = get();
    const snapshot = createHistorySnapshot(project);

    const newCaption: CaptionBlock = {
      id: `caption-${Date.now()}`,
      text: caption?.text || "Add caption here...",
      start: playheadTime,
      end: playheadTime + 2.5,
      stylePreset: caption?.stylePreset || "tiktok_yellow",
      fontSize: caption?.fontSize || 28,
      textColor: caption?.textColor || "#FFFFFF",
      highlightColor: caption?.highlightColor || "#FBBF24",
      positionY: caption?.positionY || 75,
    };

    set({
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          textTrack: [...project.tracks.textTrack, newCaption],
        },
      },
      selectedItem: { type: "caption", id: newCaption.id },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  updateCaption: (id, updates, saveHistory = true) => {
    const { project, past } = get();
    const textTrack = project.tracks.textTrack.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    
    const newState: any = {
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          textTrack,
        },
      },
    };

    if (saveHistory) {
      newState.past = [...past.slice(-29), createHistorySnapshot(project)];
      newState.future = [];
    }

    set(newState);
  },

  addAudioClip: (audioData) => {
    const { project, playheadTime, past } = get();
    const snapshot = createHistorySnapshot(project);
    const newAudio: AudioClip = {
      ...audioData,
      id: `audio-${Date.now()}`,
      start: playheadTime,
      end: playheadTime + (audioData.end - audioData.start || 15),
    };

    set({
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          audioTrack: [...project.tracks.audioTrack, newAudio],
        },
      },
      selectedItem: { type: "audio", id: newAudio.id },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  updateAudioClip: (id, updates) => {
    const { project, past } = get();
    const audioTrack = project.tracks.audioTrack.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          audioTrack,
        },
      },
      past: [...past.slice(-29), createHistorySnapshot(project)],
      future: [],
    });
  },

  addGraphicElement: (element) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const newElement: GraphicElement = {
      ...element,
      id: `graphic-${Date.now()}`,
    };
    const currentGraphics = project.tracks.graphicsTrack || [];
    set({
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          graphicsTrack: [...currentGraphics, newElement],
        },
      },
      selectedItem: { type: "graphic", id: newElement.id },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  updateGraphicElement: (id, updates, saveHistory = true) => {
    const { project, past } = get();
    const currentGraphics = project.tracks.graphicsTrack || [];
    const graphicsTrack = currentGraphics.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    const newState: any = {
      project: {
        ...project,
        tracks: {
          ...project.tracks,
          graphicsTrack,
        },
      },
    };
    if (saveHistory) {
      newState.past = [...past.slice(-29), createHistorySnapshot(project)];
      newState.future = [];
    }
    set(newState);
  },

  dispatchOperation: (rawOp) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const { nextProject } = executeOperation(project, rawOp);
    const resolved = resolveProjectLayout(nextProject);

    set({
      project: resolved.project,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  dispatchBatch: (ops, description) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const batchOp: EditOperation = {
      type: "batch",
      operations: ops as any,
      description,
    };
    const { nextProject } = executeOperation(project, batchOp);
    const resolved = resolveProjectLayout(nextProject);

    set({
      project: resolved.project,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  resolveLayout: (options) => {
    const { project, past } = get();
    const resolved = resolveProjectLayout(project, options);
    if (resolved.changedElementIds.length > 0) {
      set({
        project: resolved.project,
        past: [...past.slice(-29), createHistorySnapshot(project)],
        future: [],
      });
    }
  },

  addConstraint: (constraint) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const existing = project.constraints || [];
    const nextProject = {
      ...project,
      constraints: [...existing.filter((c) => c.id !== constraint.id), constraint],
    };
    const resolved = resolveProjectLayout(nextProject);
    set({
      project: resolved.project,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  removeConstraint: (constraintId) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const existing = project.constraints || [];
    const nextProject = {
      ...project,
      constraints: existing.filter((c) => c.id !== constraintId),
    };
    const resolved = resolveProjectLayout(nextProject);
    set({
      project: resolved.project,
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  undo: () => {
    const { past, future, project } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot = createHistorySnapshot(project);

    set({
      project: {
        ...project,
        tracks: previous.tracks,
        duration: previous.duration,
        aspectRatio: previous.aspectRatio,
        constraints: previous.constraints || [],
        safeZones: previous.safeZones || [],
      },
      past: newPast,
      future: [currentSnapshot, ...future],
    });
  },

  redo: () => {
    const { past, future, project } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = createHistorySnapshot(project);

    set({
      project: {
        ...project,
        tracks: next.tracks,
        duration: next.duration,
        aspectRatio: next.aspectRatio,
        constraints: next.constraints || [],
        safeZones: next.safeZones || [],
      },
      past: [...past, currentSnapshot],
      future: newFuture,
    });
  },
  
  commitHistory: () => {
    const { project, past } = get();
    const resolved = resolveProjectLayout(project);
    set({
      project: resolved.project,
      past: [...past.slice(-29), createHistorySnapshot(resolved.project)],
      future: [],
    });
  },

  setKeyframe: (trackType, clipId, property, time, value, saveHistory = true, interpolation = "linear") => {
    const { project, past } = get();
    const tracks = { ...project.tracks };

    const updateClipKeyframes = (clip: any) => {
      const animation = clip.animation ? { ...clip.animation } : {};
      const propState = animation[property] ? { ...animation[property] } : { keyframes: [] };
      const propKeyframes = [...propState.keyframes];
      
      const existingIndex = propKeyframes.findIndex((kf) => Math.abs(kf.time - time) < 0.05);
      if (existingIndex !== -1) {
        propKeyframes[existingIndex] = { ...propKeyframes[existingIndex], time, value };
      } else {
        propKeyframes.push({ time, value, interpolation });
        propKeyframes.sort((a, b) => a.time - b.time);
      }
      
      propState.keyframes = propKeyframes;
      animation[property] = propState;
      return { ...clip, animation };
    };

    if (trackType === "video") {
      tracks.videoTrack = tracks.videoTrack.map((c) => c.id === clipId ? updateClipKeyframes(c) : c);
    } else if (trackType === "broll") {
      tracks.brollTrack = tracks.brollTrack.map((c) => c.id === clipId ? updateClipKeyframes(c) : c);
    } else if (trackType === "caption") {
      tracks.textTrack = tracks.textTrack.map((c) => c.id === clipId ? updateClipKeyframes(c) : c);
    } else if (trackType === "audio") {
      tracks.audioTrack = tracks.audioTrack.map((c) => c.id === clipId ? updateClipKeyframes(c) : c);
    } else if (trackType === "graphic") {
      tracks.graphicsTrack = (tracks.graphicsTrack || []).map((c) => c.id === clipId ? updateClipKeyframes(c) : c);
    }

    const newState: any = { project: { ...project, tracks } };

    if (saveHistory) {
      newState.past = [...past.slice(-29), createHistorySnapshot(project)];
      newState.future = [];
    }

    set(newState);
  },

  removeKeyframe: (trackType, clipId, property, time) => {
    const { project, past } = get();
    const snapshot = createHistorySnapshot(project);
    const tracks = { ...project.tracks };

    const removeClipKeyframe = (clip: any) => {
      if (!clip.animation || !clip.animation[property]) return clip;
      const animation = { ...clip.animation };
      const propState = { ...animation[property] };
      propState.keyframes = propState.keyframes.filter((kf: any) => Math.abs(kf.time - time) > 0.05);
      
      if (propState.keyframes.length === 0) {
        delete animation[property];
      } else {
        animation[property] = propState;
      }
      
      return { ...clip, animation };
    };

    if (trackType === "video") {
      tracks.videoTrack = tracks.videoTrack.map((c) => c.id === clipId ? removeClipKeyframe(c) : c);
    } else if (trackType === "broll") {
      tracks.brollTrack = tracks.brollTrack.map((c) => c.id === clipId ? removeClipKeyframe(c) : c);
    } else if (trackType === "caption") {
      tracks.textTrack = tracks.textTrack.map((c) => c.id === clipId ? removeClipKeyframe(c) : c);
    } else if (trackType === "audio") {
      tracks.audioTrack = tracks.audioTrack.map((c) => c.id === clipId ? removeClipKeyframe(c) : c);
    } else if (trackType === "graphic") {
      tracks.graphicsTrack = (tracks.graphicsTrack || []).map((c) => c.id === clipId ? removeClipKeyframe(c) : c);
    }

    set({
      project: { ...project, tracks },
      past: [...past.slice(-29), snapshot],
      future: [],
    });
  },

  setTranscript: (transcript: TranscriptData) => {
    set((state) => ({
      project: {
        ...state.project,
        transcript,
      },
    }));
  },

    }),
    {
      name: "video-editor-draft",
      partialize: (state) => ({ project: state.project }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        
        // Asynchronously restore expired blob: URLs from IndexedDB
        (async () => {
          try {
            const { getMediaFromIDB } = await import("@/lib/idb");
            const videoTrack = [...state.project.tracks.videoTrack];
            let changed = false;
            
            for (let i = 0; i < videoTrack.length; i++) {
              const clip = videoTrack[i];
              if (clip.sourceUrl.startsWith("blob:")) {
                const blob = await getMediaFromIDB(clip.id);
                if (blob) {
                  videoTrack[i] = { ...clip, sourceUrl: URL.createObjectURL(blob) };
                  changed = true;
                }
              }
            }
            
            if (changed) {
              useTimelineStore.setState((s) => ({
                project: {
                  ...s.project,
                  tracks: {
                    ...s.project.tracks,
                    videoTrack,
                  },
                },
              }));
            }
          } catch (e) {
            console.error("Hydration blob restore failed", e);
          }
        })();
      },
    }
  )
);
