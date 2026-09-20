export type StoryBeatType =
  | 'hook'
  | 'setup'
  | 'problem'
  | 'explanation'
  | 'evidence'
  | 'example'
  | 'comparison'
  | 'reveal'
  | 'transition'
  | 'conclusion'
  | 'cta';

export interface StoryBeatPlan {
  id: string;
  type: StoryBeatType;
  purpose: string;
  message: string;
  importance?: 'low' | 'medium' | 'high';
  suggestedDurationInFrames?: number;
  metadata?: Record<string, unknown>;
}

export interface StoryPlan {
  id: string;
  topic: string;
  objective?: string;
  audience?: string;
  durationInFrames?: number;
  beats: StoryBeatPlan[];
  metadata?: Record<string, unknown>;
}

export interface StoryPlanRequest {
  topic: string;
  objective?: string;
  audience?: string;
  durationInFrames?: number;
  tone?: string;
  format?: string;
  constraints?: {
    maxBeats?: number;
    requiredSections?: StoryBeatType[];
    prohibitedTopics?: string[];
  };
}

export interface StoryPlanner {
  plan(request: StoryPlanRequest): StoryPlan;
}
