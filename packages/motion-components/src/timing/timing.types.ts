export type TimingState = 'before' | 'entering' | 'visible' | 'exiting' | 'after';

export interface TimingConfig {
  startFrame?: number;
  durationInFrames?: number;
  delayInFrames?: number;
  
  enter?: {
    durationInFrames?: number;
  };
  
  exit?: {
    durationInFrames?: number;
  };
}

export interface ResolvedTiming {
  state: TimingState;
  
  /** The frame number relative to the element's effective start time */
  localFrame: number; 
  
  /** Normalized 0-1 progress of the enter duration */
  enterProgress: number;

  /** Normalized 0-1 progress of the full visibility duration */
  visibleProgress: number; 
  
  /** Normalized 0-1 progress of the exit duration */
  exitProgress: number;
  
  /** Absolute bounds calculated including delays and group offsets */
  effectiveStartFrame: number;
  effectiveEndFrame: number | null;
}
