export type AudioTrackType = 'voiceover' | 'music' | 'sfx' | 'video';

export interface AudioTrackDefinition {
  id: string;
  type: AudioTrackType;
  src: string;
  
  startFrame: number;
  durationInFrames?: number;
  
  sourceStartFrame?: number;
  sourceEndFrame?: number;
  
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
  
  fadeInFrames?: number;
  fadeOutFrames?: number;
  loop?: boolean;
  
  metadata?: {
    durationInFrames?: number;
    fps?: number;
    sampleRate?: number;
    channels?: number;
    mimeType?: string;
    [key: string]: unknown;
  };
}

export interface ResolvedAudioTrack {
  id: string;
  type: AudioTrackType;
  src: string;
  
  startFrame: number;
  durationInFrames: number;
  
  sourceStartFrame: number;
  sourceEndFrame?: number;
  
  playbackRate: number;
  volume: number;
  muted: boolean;
  
  fadeInFrames: number;
  fadeOutFrames: number;
  loop: boolean;
  
  metadata?: Record<string, unknown>;
}
