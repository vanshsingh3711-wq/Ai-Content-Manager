export type VideoJobStatus =
  | 'QUEUED'
  | 'DOWNLOADING'
  | 'TRANSCRIBING'
  | 'AI_DIRECTING'
  | 'RENDERING'
  | 'PUBLISHING'
  | 'COMPLETED'
  | 'FAILED';

export type VideoType = 'talking_head' | 'faceless_short';

export type SocialPlatform = 'youtube' | 'instagram' | 'linkedin';

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  platform_account_id?: string;
}

export interface EditDecision {
  trigger_id: string;
  action: 'cut' | 'b_roll' | 'zoom_in' | 'sfx';
  search_query?: string;
  sound_effect?: string;
}

export interface EditList {
  edits: EditDecision[];
}

export interface VideoJob {
  id: string;
  user_id: string;
  title: string;
  source_url: string;
  rendered_url?: string;
  video_type: VideoType;
  status: VideoJobStatus;
  edit_decision_list?: string;
  error_log?: string;
  created_at: string;
  updated_at: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  source_url: string;
  file_key: string;
}
