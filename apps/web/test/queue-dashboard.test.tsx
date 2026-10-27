import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PipelineStageTracker,
  JobCard,
  JobLogDrawer,
  QueueStatsBanner,
  QueueJob,
} from "../components/queue";
import QueueJobsPage from "../app/dashboard/queue/page.tsx";
import { ToastProvider } from "../components/ui";

const mockActiveJob: QueueJob = {
  id: "job-101",
  title: "Why Compound Interest Beats Hard Work",
  status: "RENDERING",
  source_url: "https://example.com/source.mp4",
  video_type: "faceless_short",
  progress: 85,
  stage: "Remotion 4K Multi-Track Render (Frame 760/900)",
  created_at: new Date(Date.now() - 120000).toISOString(),
  updated_at: new Date(Date.now() - 15000).toISOString(),
  error_log: "[00:01.00] [SYSTEM] Celery task started\n[00:04.00] [REMOTION] Rendering composition",
};

const mockFailedJob: QueueJob = {
  id: "job-102",
  title: "Roman Empire Concrete Secrets",
  status: "FAILED",
  source_url: "",
  video_type: "faceless_short",
  progress: 35,
  stage: "Audio alignment mismatch",
  created_at: new Date(Date.now() - 3600000).toISOString(),
  updated_at: new Date(Date.now() - 3500000).toISOString(),
  error_log: "[ERROR] Audio sample rate error",
};

describe("Phase 6: Queue & Real-Time Pipeline Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PipelineStageTracker Component", () => {
    it("renders six pipeline stages with active indicators", () => {
      render(<PipelineStageTracker status="AI_DIRECTING" />);

      expect(screen.getByText("Queued")).toBeInTheDocument();
      expect(screen.getByText("Ingest")).toBeInTheDocument();
      expect(screen.getByText("WhisperX")).toBeInTheDocument();
      expect(screen.getByText("AI Directing")).toBeInTheDocument();
      expect(screen.getByText("Remotion")).toBeInTheDocument();
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });
  });

  describe("JobCard Component", () => {
    it("renders job details, progress percentage, and triggers log drawer", () => {
      const handleLogs = vi.fn();
      const handleCancel = vi.fn();

      render(
        <JobCard
          job={mockActiveJob}
          onOpenLogs={handleLogs}
          onCancel={handleCancel}
        />
      );

      expect(
        screen.getByText("Why Compound Interest Beats Hard Work")
      ).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(
        screen.getByText(/Remotion 4K Multi-Track Render/)
      ).toBeInTheDocument();

      // Click worker logs
      fireEvent.click(screen.getByRole("button", { name: /worker logs/i }));
      expect(handleLogs).toHaveBeenCalledWith(mockActiveJob);

      // Click cancel
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(handleCancel).toHaveBeenCalledWith("job-101");
    });

    it("renders retry button for failed jobs", () => {
      const handleRetry = vi.fn();
      render(
        <JobCard
          job={mockFailedJob}
          onOpenLogs={vi.fn()}
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText("Failed")).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /retry job/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledWith("job-102");
    });
  });

  describe("JobLogDrawer Component", () => {
    it("renders terminal logs drawer with stdout content", () => {
      const handleClose = vi.fn();
      render(
        <JobLogDrawer
          job={mockActiveJob}
          isOpen={true}
          onClose={handleClose}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/worker-stdout\.log/i)).toBeInTheDocument();
      expect(
        screen.getByText(/\[00:01\.00\] \[SYSTEM\] Celery task started/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /copy raw logs/i })
      ).toBeInTheDocument();
    });
  });

  describe("QueueStatsBanner Component", () => {
    it("renders active, completed, failed metrics", () => {
      render(
        <QueueStatsBanner
          activeCount={2}
          completedCount={12}
          failedCount={1}
          avgDurationSec={34}
        />
      );

      expect(screen.getByText("Active Jobs")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Completed Renders")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("~34s")).toBeInTheDocument();
    });
  });

  describe("QueueJobsPage Integration", () => {
    it("renders header, telemetry banner, and handles tab switching", () => {
      render(
        <ToastProvider>
          <QueueJobsPage />
        </ToastProvider>
      );

      expect(
        screen.getByText("Rendering Queue & Worker Pipelines")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Why Compound Interest Grows Fast in Your 20s")
      ).toBeInTheDocument();

      // Switch to Failed tab
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      expect(
        screen.getByText("The Roman Empire's Secret Concrete Formula")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Why Compound Interest Grows Fast in Your 20s")
      ).not.toBeInTheDocument();
    });
  });
});
