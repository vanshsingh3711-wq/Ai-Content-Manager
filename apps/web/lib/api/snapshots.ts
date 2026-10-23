import { TimelineProject } from "../timeline-types";

export interface SnapshotClipCounts {
  video: number;
  audio: number;
  captions: number;
  graphics: number;
  broll: number;
}

export interface ProjectSnapshotSummary {
  id: string;
  video_id: string;
  version: number;
  label: string;
  description?: string | null;
  created_at: string;
  clip_counts: SnapshotClipCounts;
}

export interface ProjectSnapshotDetail extends ProjectSnapshotSummary {
  timeline_project: TimelineProject;
}

export interface CreateSnapshotPayload {
  label: string;
  description?: string;
  timeline_project?: TimelineProject;
}

export interface RestoreSnapshotResponse {
  status: string;
  snapshot_id: string;
  version: number;
  label: string;
  message: string;
  timeline_project: TimelineProject;
}

const getApiBase = (): string => {
  if (typeof window !== "undefined" && (window as any).__MOCK_API_URL__) {
    return (window as any).__MOCK_API_URL__;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

/**
 * Fetches all saved version checkpoints for a video project.
 */
export async function getSnapshots(videoId: string): Promise<ProjectSnapshotSummary[]> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/api/v1/videos/${videoId}/snapshots`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to fetch project snapshots (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.snapshots || [];
}

/**
 * Retrieves full details and timeline project payload for a specific snapshot.
 */
export async function getSnapshot(videoId: string, snapshotId: string): Promise<ProjectSnapshotDetail> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/api/v1/videos/${videoId}/snapshots/${snapshotId}`);
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to fetch snapshot ${snapshotId} (${res.status}): ${errorText}`);
  }
  return await res.json();
}

/**
 * Creates a new cloud checkpoint for the video timeline.
 */
export async function createSnapshot(
  videoId: string,
  payload: CreateSnapshotPayload
): Promise<ProjectSnapshotDetail> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/api/v1/videos/${videoId}/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to create snapshot (${res.status}): ${errorText}`);
  }
  return await res.json();
}

/**
 * Restores a snapshot into the active video timeline.
 */
export async function restoreSnapshot(
  videoId: string,
  snapshotId: string
): Promise<RestoreSnapshotResponse> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/api/v1/videos/${videoId}/snapshots/${snapshotId}/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to restore snapshot (${res.status}): ${errorText}`);
  }
  return await res.json();
}

/**
 * Deletes a snapshot checkpoint.
 */
export async function deleteSnapshot(
  videoId: string,
  snapshotId: string
): Promise<{ status: string; snapshot_id: string }> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/api/v1/videos/${videoId}/snapshots/${snapshotId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to delete snapshot (${res.status}): ${errorText}`);
  }
  return await res.json();
}
