export type AttentionType = 
  | 'highlight'
  | 'focus'
  | 'spotlight'
  | 'zoom'
  | 'pulse'
  | 'outline'
  | 'underline'
  | 'callout'
  | 'dimOthers';

export interface AttentionInstruction {
  id: string;
  
  /** The single target element to emphasize */
  targetId?: string;
  
  /** Or a group of targets */
  targetIds?: string[];
  
  type: AttentionType;
  
  /** 0 to 1, where 1 is maximum emphasis */
  intensity?: number;
  
  startFrame?: number;
  durationInFrames?: number;
  
  /** Higher priority wins in exclusive mode */
  priority?: number;
}

export interface AttentionDiagnostic {
  instructionId: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface ResolvedAttentionInstruction extends AttentionInstruction {
  // Normalize fields
  targetIds: string[]; // always an array
  intensity: number; // defaulted/clamped to 0-1
  priority: number; // defaulted to 0
  startFrame: number; // defaulted/resolved
  durationInFrames: number; // defaulted/resolved
  
  // Resolved geometry of all valid targets combined
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export interface ResolvedAttentionSequence {
  instructions: ResolvedAttentionInstruction[];
  diagnostics: AttentionDiagnostic[];
}
