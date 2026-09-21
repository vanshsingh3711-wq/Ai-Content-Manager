export type PresenterAction =
  | "idle"
  | "talk"
  | "blink"
  | "smile"
  | "think"
  | "surprised"
  | "pointLeft"
  | "pointRight"
  | "pointUp"
  | "pointDown"
  | "present"
  | "emphasize"
  | "wave"
  | "nod"
  | "lookAt";

export interface PresenterInstruction {
  presenterId: string;
  characterAssetId: string;
  action: PresenterAction;
  startFrame: number;
  durationInFrames: number;
  targetId?: string;
  intensity?: number;
  /** Semantic expression states */
  expression?: "neutral" | "happy" | "surprised" | "thinking" | string;
  metadata?: Record<string, unknown>;
}

export interface ResolvedPresenterInstruction extends PresenterInstruction {
  resolvedTargetGeometry?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CharacterCapabilities {
  supportedActions: PresenterAction[];
  supportsIntensity: boolean;
  supportsTargets: boolean;
}
