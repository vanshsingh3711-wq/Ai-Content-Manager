export type JobStatus =
  | "QUEUED"
  | "DOWNLOADING"
  | "TRANSCRIBING"
  | "AI_DIRECTING"
  | "RENDERING"
  | "PUBLISHING"
  | "COMPLETED"
  | "FAILED";

export interface QueueJob {
  id: string;
  title: string;
  status: JobStatus;
  source_url: string;
  rendered_url?: string | null;
  video_type?: "talking_head" | "faceless_short";
  edit_decision_list?: string | null;
  error_log?: string | null;
  progress?: number;
  stage?: string;
  created_at: string;
  updated_at: string;
}

export type QueueTabFilter = "active" | "completed" | "failed" | "all";
