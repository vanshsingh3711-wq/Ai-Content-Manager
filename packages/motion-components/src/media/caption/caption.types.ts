export interface CaptionWord {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface CaptionCue {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  words?: CaptionWord[];
  speakerId?: string;
  metadata?: Record<string, unknown>;
}

export interface CaptionTrackDefinition {
  id: string;
  cues: CaptionCue[];
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ResolvedCaptionTrack {
  id: string;
  cues: CaptionCue[];
  enabled: boolean;
  metadata?: Record<string, unknown>;
}
