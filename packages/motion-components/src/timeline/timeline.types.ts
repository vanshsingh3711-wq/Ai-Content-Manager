export type TimelineItemType = 'scene' | 'visual' | 'presenter' | 'audio' | 'caption' | 'effect';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  sourceId: string; // References Scene or SceneElement ID
  sceneId?: string; // Parent scene ID (if applicable, to help mapping back)
  startFrame: number; // Global start frame
  durationInFrames: number;
  trackId: string;
  label: string;
  keyframes?: { frame: number; id: string }[];
}

export interface TimelineTrack {
  id: string;
  type: TimelineItemType;
  label: string;
  items: TimelineItem[];
}

export interface TimelineState {
  tracks: TimelineTrack[];
  durationInFrames: number;
  fps: number;
}
