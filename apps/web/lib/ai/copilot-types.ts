import { EditOperation } from "../operations/operation-types";

export interface ProposedEditItem {
  id: string;
  action_type: "broll" | "graphic" | "sfx" | "transition" | "cut" | "caption" | "reflow" | string;
  start: number;
  end: number;
  track: "video" | "broll" | "caption" | "audio" | "graphic" | string;
  title: string;
  description: string;
  reason: string;
  is_destructive: boolean;
  overlap_conflict: boolean;
  preview_url?: string | null;
  operation: EditOperation;
  status: "pending" | "accepted" | "rejected" | "applied" | "failed";
  error_message?: string | null;
}

export interface EditPlanProposal {
  plan_id: string;
  user_prompt: string;
  scope: "time_range" | "semantic_anchor" | "whole_video" | string;
  summary: string;
  edits: ProposedEditItem[];
  created_at: string;
  total_duration_seconds: number;
  suggested_actions?: string[];
}
