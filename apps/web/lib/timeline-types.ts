export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

export interface VideoClip {
  id: string;
  sourceUrl: string;
  name: string;
  start: number;          // Position on project timeline (seconds)
  end: number;            // End position on project timeline (seconds)
  sourceStart: number;    // In-point of the raw source file (seconds)
  sourceEnd: number;      // Out-point of the raw source file (seconds)
  speed: number;          // 0.5x to 2.0x (default: 1)
  volume: number;         // 0 to 100 (default: 100)
  zoomFactor: number;     // 1.0 (default) to 1.3 (AI Face Zoom)
  transitionIn?: "fade" | "dissolve" | "slide_left" | "zoom_in";
  positionX?: number;     // 0-100% (default: 50)
  positionY?: number;     // 0-100% (default: 50)
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
}

export interface BRollClip {
  id: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  name: string;
  start: number;          // Start timestamp on timeline (seconds)
  end: number;            // End timestamp on timeline (seconds)
  opacity: number;        // 0 to 100 (default: 100)
  fitMode: "cover" | "contain";
  positionX?: number;     // 0-100% (default: 50)
  positionY?: number;     // 0-100% (default: 50)
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
}

export type CaptionPreset = "tiktok_yellow" | "hormozi_bold" | "clean_white" | "neon_glow";

export interface CaptionBlock {
  id: string;
  text: string;
  start: number;          // Start timestamp on timeline (seconds)
  end: number;            // End timestamp on timeline (seconds)
  stylePreset: CaptionPreset;
  fontSize?: number;
  textColor?: string;
  highlightColor?: string;
  positionY?: number;     // Vertical position % from top (e.g. 75)
  positionX?: number;     // Horizontal position % (default: 50)
  scale?: number;         // default: 1.0
  rotation?: number;      // degrees
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
}

export interface TimelineProject {
  id: string;
  videoId?: string;
  title: string;
  aspectRatio: AspectRatio;
  duration: number;       // Total project duration in seconds
  fps: number;            // Default: 30
  tracks: {
    textTrack: CaptionBlock[];
    brollTrack: BRollClip[];
    videoTrack: VideoClip[];
    audioTrack: AudioClip[];
  };
}

export interface HistoryState {
  tracks: TimelineProject["tracks"];
  duration: number;
  aspectRatio: AspectRatio;
}
