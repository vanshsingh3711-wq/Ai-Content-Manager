export type ExportFormat = "mp4";
export type ExportCodec = "h264";
export type ExportQuality = "draft" | "standard" | "high";

export type ExportStatus =
  | "idle"
  | "validating"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExportConfig {
  format: ExportFormat;
  codec: ExportCodec;
  quality?: ExportQuality;
}

export interface ExportResult {
  jobId: string;
  status: ExportStatus;
  outputPath?: string;
  videoUrl?: string; // URL for frontend to download
  duration?: number;
  diagnostics: Array<{ severity: string, message: string }>;
}
