export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

export type InterpolationType = "linear" | "hold" | "easeIn" | "easeOut" | "easeInOut" | "bezier";

export interface Keyframe {
  time: number;  // Seconds relative to the START of the clip (0 = clip start)
  value: any;
  interpolation: InterpolationType;
  bezier?: { inHandle: {x: number, y: number}, outHandle: {x: number, y: number} };
}

export interface AnimationState {
  keyframes: Keyframe[];
}

export interface ClipTransformState {
  position?: AnimationState;
  scale?: AnimationState;
  rotation?: AnimationState;
  opacity?: AnimationState;
  volume?: AnimationState;
  zoomFactor?: AnimationState;
  [key: string]: AnimationState | undefined;
}

export interface VideoClip {
  id: string;
  sourceUrl: string;
  proxyUrl?: string;
  name: string;
  start: number;          // Position on project timeline (seconds)
  end: number;            // End position on project timeline (seconds)
  sourceStart: number;    // In-point of the raw source file (seconds)
  sourceEnd: number;      // Out-point of the raw source file (seconds)
  speed: number;          // 0.5x to 2.0x (default: 1)
  volume: number;         // 0 to 100 (default: 100)
  zoomFactor: number;     // 1.0 (default) to 1.3 (AI Face Zoom)
  transitionIn?: "fade" | "dissolve" | "slide_left" | "zoom_in";
  position?: { x: number, y: number }; // defaults to {x: 50, y: 50}
  positionX?: number;
  positionY?: number;
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
  isUserLocked?: boolean; // If true, AI/auto-layout will not displace or reposition this element
  animation?: ClipTransformState;
}

export interface BRollClip {
  id: string;
  sourceUrl: string;
  proxyUrl?: string;
  thumbnailUrl?: string;
  localPath?: string;
  name: string;
  start: number;          // Start timestamp on timeline (seconds)
  end: number;            // End timestamp on timeline (seconds)
  opacity: number;        // 0 to 100 (default: 100)
  volume?: number;        // 0 to 100 (default: 0 - keeps narration audible)
  muted?: boolean;        // default: true
  fitMode: "cover" | "contain";

  position?: { x: number, y: number }; // defaults to {x: 50, y: 50}
  positionX?: number;
  positionY?: number;
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
  isUserLocked?: boolean; // If true, AI/auto-layout will not displace or reposition this element
  animation?: ClipTransformState;
}

export type CaptionPreset =
  | "tiktok_yellow"
  | "hormozi_bold"
  | "clean_white"
  | "neon_glow"
  | "karaoke_gradient"
  | "boxed_pill"
  | "comic_pop"
  | "fire_gradient"
  | "minimal_boxed"
  | "neon_cyber"
  | "modern_clean";

export interface CaptionBlock {
  id: string;
  text: string;
  start: number;          // Start timestamp on timeline (seconds)
  end: number;            // End timestamp on timeline (seconds)
  stylePreset: CaptionPreset;
  fontSize?: number;
  textColor?: string;
  highlightColor?: string;
  position?: { x: number, y: number }; // defaults to {x: 50, y: 75}
  positionX?: number;
  positionY?: number;
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
  isUserLocked?: boolean; // If true, AI/auto-layout will not displace or reposition this element
  animation?: ClipTransformState;
}

export interface AudioClip {
  id: string;
  sourceUrl: string;
  name: string;
  start: number;
  end: number;
  volume: number;         // 0 to 100 (default: 80)
  fadeIn: number;         // Duration in seconds
  fadeOut: number;
  isBgm: boolean;         // If true, audio ducking is applied
  ducking?: boolean | { enabled: boolean; thresholdDb?: number; attenuationDb?: number };
  duckingDb?: number;     // e.g. -14 dB
  animation?: ClipTransformState;
}

export interface GraphicElement {
  id: string;
  name: string;
  compositionId: string; // e.g. "hero_reveal", "metric_reveal", "cooked_card", "animated_counter"
  props: Record<string, any>;
  start: number;          // Position on project timeline (seconds)
  end: number;            // End position on project timeline (seconds)
  position?: { x: number; y: number }; // Percentage 0-100 (defaults to center {x: 50, y: 50})
  positionX?: number;     // Direct percentage X
  positionY?: number;     // Direct percentage Y
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
  opacity?: number;       // 0 to 100 (default: 100)
  isUserLocked?: boolean; // If true, AI/auto-layout will not displace or reposition this element
  constraints?: string[]; // IDs of constraints attached to this element
  animation?: ClipTransformState;
}

export type ConstraintType =
  | "away_from_subject"
  | "align_relative"
  | "clamp_safe_zone"
  | "anchor_beat";

export type ConstraintRelation =
  | "above"
  | "below"
  | "left"
  | "right"
  | "center"
  | "inside"
  | "align-left"
  | "align-right"
  | "align-top"
  | "align-bottom";

export interface SemanticConstraint {
  id: string;
  sourceElementId: string;
  type: ConstraintType;
  targetId?: string; // Element ID or "subject" or "safe_zone"
  relation?: ConstraintRelation;
  gap?: number;      // Distance in normalized percentage or canvas units
  strength: "required" | "preferred";
  padding?: number;
}

export interface SubjectSafeZone {
  id: string;
  timestamp: number;  // Start timestamp in seconds
  duration: number;   // Duration in seconds
  x: number;          // 0-100% normalized canvas X
  y: number;          // 0-100% normalized canvas Y
  width: number;      // 0-100% normalized width
  height: number;     // 0-100% normalized height
  confidence: number; // Detection confidence 0.0 - 1.0
  type?: "safe" | "restricted" | "subject";
}

export type TransitionPreset =
  | "crossfade"
  | "fade_to_black"
  | "wipe_left"
  | "wipe_right"
  | "slide_up"
  | "zoom_in"
  | "whip_pan";

export interface TransitionItem {
  id: string;
  track: "video" | "broll";
  fromClipId: string;
  toClipId: string;
  preset: TransitionPreset;
  duration: number; // in seconds
  alignment: "center" | "start" | "end";
}

export type TrackItemType = "video" | "broll" | "caption" | "audio" | "graphic" | "transition" | "constraint";

export interface TimelineProject {
  id: string;
  videoId?: string;
  title: string;
  aspectRatio: AspectRatio;
  videoType?: "talking_head" | "faceless_short";
  isFaceless?: boolean;
  duration: number;       // Total project duration in seconds
  fps: number;            // Default: 30
  tracks: {
    textTrack: CaptionBlock[];
    brollTrack: BRollClip[];
    videoTrack: VideoClip[];
    audioTrack: AudioClip[];
    graphicsTrack?: GraphicElement[];
  };
  transitions?: TransitionItem[];
  constraints?: SemanticConstraint[];
  safeZones?: SubjectSafeZone[];
  themeId?: string;
  transcript?: TranscriptData;
}

export interface TranscriptWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  probability?: number;
  chunkId?: string;
}

export interface ScriptBeat {
  id: number;
  start: number;
  end: number;
  text: string;
  role: string;
  energy?: "low" | "medium" | "high";
  importance?: number;
  emphasisWords?: string[];
}

export interface TranscriptData {
  videoId?: string;
  timestampMap?: Record<string, { start: number; end: number; text: string; words?: TranscriptWord[] }>;
  words: TranscriptWord[];
  beatSheet?: { beats: ScriptBeat[] };
  text: string;
}

export type CanonicalVideoProject = TimelineProject;

export interface HistoryState {
  tracks: TimelineProject["tracks"];
  duration: number;
  aspectRatio: AspectRatio;
  transitions?: TransitionItem[];
  constraints?: SemanticConstraint[];
  safeZones?: SubjectSafeZone[];
  transcript?: TranscriptData;
}

