/**
 * editor-context.ts
 *
 * Real-time Editor Context Assembler.
 * Extracts a concise, structured snapshot of the current project, playhead position,
 * active selections, and track elements for deterministic local parsing and Tier-2 AI copilot.
 */

import {
  TimelineProject,
  TrackItemType,
  VideoClip,
  BRollClip,
  CaptionBlock,
  AudioClip,
  GraphicElement,
  SemanticConstraint,
  SubjectSafeZone,
  TranscriptWord,
  ScriptBeat,
} from "../timeline-types";

export interface SelectedItemContext {
  type: TrackItemType;
  id: string;
  element: VideoClip | BRollClip | CaptionBlock | AudioClip | GraphicElement | null;
}

export interface ActiveElementsContext {
  activeVideo: VideoClip | null;
  activeBroll: BRollClip | null;
  activeCaption: CaptionBlock | null;
  activeGraphic: GraphicElement | null;
}

export interface TrackSummaryContext {
  videoCount: number;
  brollCount: number;
  captionCount: number;
  graphicCount: number;
  audioCount: number;
  captionsList: { id: string; text: string; start: number; end: number }[];
  graphicsList: { id: string; name: string; compositionId: string; start: number; end: number }[];
}

export interface EditorContext {
  projectId: string;
  projectTitle: string;
  duration: number;
  playheadTime: number;
  aspectRatio: string;
  fps: number;
  selectedItem: SelectedItemContext | null;
  activeElements: ActiveElementsContext;
  trackSummary: TrackSummaryContext;
  constraints: SemanticConstraint[];
  safeZones: SubjectSafeZone[];
  transcriptWords: TranscriptWord[];
  scriptBeats: ScriptBeat[];
  videoClips?: { id: string; name: string; start: number; end: number }[];
  audioClips?: { id: string; name: string; start: number; end: number; volume?: number }[];
  textTrack?: CaptionBlock[];
}

/**
 * Resolves the full element definition for a given selected item ID and type.
 */
export function getSelectedElement(
  project: TimelineProject,
  selectedItem: { type: TrackItemType; id: string } | null
): VideoClip | BRollClip | CaptionBlock | AudioClip | GraphicElement | null {
  if (!selectedItem) return null;

  const { type, id } = selectedItem;
  if (type === "video") return project.tracks.videoTrack.find((c) => c.id === id) || null;
  if (type === "broll") return project.tracks.brollTrack.find((b) => b.id === id) || null;
  if (type === "caption") return project.tracks.textTrack.find((t) => t.id === id) || null;
  if (type === "audio") return project.tracks.audioTrack.find((a) => a.id === id) || null;
  if (type === "graphic") return (project.tracks.graphicsTrack || []).find((g) => g.id === id) || null;

  return null;
}

/**
 * Assembles a comprehensive EditorContext from timeline store state.
 */
export function assembleEditorContext(
  project: TimelineProject,
  playheadTime: number,
  selectedItem: { type: TrackItemType; id: string } | null
): EditorContext {
  const selectedElement = getSelectedElement(project, selectedItem);

  const activeVideo =
    project.tracks.videoTrack.find((c) => playheadTime >= c.start && playheadTime < c.end) || null;

  const activeBroll =
    project.tracks.brollTrack.find((b) => playheadTime >= b.start && playheadTime < b.end) || null;

  const activeCaption =
    project.tracks.textTrack.find((t) => playheadTime >= t.start && playheadTime < t.end) || null;

  const activeGraphic =
    (project.tracks.graphicsTrack || []).find((g) => playheadTime >= g.start && playheadTime < g.end) || null;

  const captionsList = (project.tracks.textTrack || []).map((c) => ({
    id: c.id,
    text: c.text,
    start: c.start,
    end: c.end,
  }));

  const graphicsList = (project.tracks.graphicsTrack || []).map((g) => ({
    id: g.id,
    name: g.name,
    compositionId: g.compositionId,
    start: g.start,
    end: g.end,
  }));

  return {
    projectId: project.id,
    projectTitle: project.title,
    duration: project.duration,
    playheadTime,
    aspectRatio: project.aspectRatio,
    fps: project.fps || 30,
    selectedItem: selectedItem
      ? {
          type: selectedItem.type,
          id: selectedItem.id,
          element: selectedElement,
        }
      : null,
    activeElements: {
      activeVideo,
      activeBroll,
      activeCaption,
      activeGraphic,
    },
    trackSummary: {
      videoCount: project.tracks.videoTrack.length,
      brollCount: project.tracks.brollTrack.length,
      captionCount: project.tracks.textTrack.length,
      graphicCount: (project.tracks.graphicsTrack || []).length,
      audioCount: project.tracks.audioTrack.length,
      captionsList,
      graphicsList,
    },
    constraints: project.constraints || [],
    safeZones: project.safeZones || [],
    transcriptWords: project.transcript?.words || [],
    scriptBeats: project.transcript?.beatSheet?.beats || [],
    videoClips: (project.tracks.videoTrack || []).map((v) => ({
      id: v.id,
      name: v.name,
      start: v.start,
      end: v.end,
    })),
    audioClips: (project.tracks.audioTrack || []).map((a) => ({
      id: a.id,
      name: a.name,
      start: a.start,
      end: a.end,
      volume: a.volume,
    })),
    textTrack: project.tracks.textTrack,
  };
}

/**
 * Formats the EditorContext into a concise markdown text summary for AI copilot prompts.
 */
export function formatContextForLLM(context: EditorContext): string {
  const selectedStr = context.selectedItem
    ? `Type: ${context.selectedItem.type}, ID: ${context.selectedItem.id}`
    : "None";

  return `
[Editor Context]
- Project: "${context.projectTitle}" (${context.aspectRatio}, ${context.duration.toFixed(1)}s, ${context.fps} fps)
- Current Playhead: ${context.playheadTime.toFixed(2)}s
- Selected Element: ${selectedStr}
- Tracks: ${context.trackSummary.videoCount} video, ${context.trackSummary.brollCount} b-roll, ${context.trackSummary.captionCount} captions, ${context.trackSummary.graphicCount} graphics, ${context.trackSummary.audioCount} audio
- Active at playhead: Video=${context.activeElements.activeVideo?.name ?? "None"}, Caption=${context.activeElements.activeCaption?.text ?? "None"}, Graphic=${context.activeElements.activeGraphic?.name ?? "None"}
`.trim();
}
