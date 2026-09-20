export type VideoFitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface VideoPosition {
  x: number;
  y: number;
}

export interface VideoMediaConfig {
  src?: string;
  fit?: VideoFitMode;
  position?: VideoPosition;
  opacity?: number;
  
  sourceStartFrame?: number;
  sourceEndFrame?: number;
  playbackRate?: number;
  loop?: boolean;
  muted?: boolean;
  volume?: number;

  metadata?: {
    width?: number;
    height?: number;
    durationInFrames?: number;
    fps?: number;
    mimeType?: string;
    source?: string;
    [key: string]: unknown;
  };
}

export interface ResolvedVideoMediaConfig {
  src: string;
  fit: VideoFitMode;
  position: VideoPosition;
  opacity: number;
  
  sourceStartFrame: number;
  sourceEndFrame?: number;
  playbackRate: number;
  loop: boolean;
  muted: boolean;
  volume: number;

  metadata?: Record<string, unknown>;
}
