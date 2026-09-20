import { StoryPlan } from '../story/story.types';
import { AttentionInstruction } from '../attention/attention.types';
import { SceneTransition } from '../transitions/transitions.types';

export type VisualPlan = {
  id: string;
  storyPlanId: string;
  scenes: VisualScenePlan[];
  metadata?: Record<string, unknown>;
};

export type VisualType =
  | "hero"
  | "single_focus"
  | "text_visual"
  | "chart"
  | "comparison"
  | "before_after"
  | "steps"
  | "timeline"
  | "kpi"
  | "quote"
  | "process"
  | "diagram"
  | "media"
  | "custom";

export type VisualScenePlan = {
  id: string;
  beatId: string;

  purpose: string;
  visualType: VisualType;
  visualDescription: string;

  elements: VisualElementIntent[];

  attention?: AttentionInstruction[];
  transition?: SceneTransition;

  metadata?: Record<string, unknown>;
};

export type VisualRole =
  | "primary"
  | "secondary"
  | "supporting"
  | "background"
  | "label"
  | "data"
  | "emphasis";

export type VisualSemanticType =
  | "text"
  | "object"
  | "icon"
  | "illustration"
  | "chart"
  | "kpi"
  | "image"
  | "video"
  | "diagram"
  | "shape"
  | "character"
  | "media";

export type VisualElementIntent = {
  id: string;
  role: VisualRole;
  semanticType: VisualSemanticType;
  description: string;
  importance?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
};

export interface VisualPlanner {
  plan(storyPlan: StoryPlan): VisualPlan;
}
