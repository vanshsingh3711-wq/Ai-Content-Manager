import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PipelineMonitor,
  QuickActions,
  ActivityFeed,
  ContinueEditingCard,
} from "../components/dashboard";
import DashboardOverviewPage from "../app/dashboard/page.tsx";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock VideoUploadModal
vi.mock("@/components/VideoUploadModal", () => ({
  VideoUploadModal: () => <div data-testid="upload-modal" />,
}));

describe("Phase 3: Command Center Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("PipelineMonitor Component", () => {
    it("renders stage counts, live badges, and progress ring", () => {
      const stages = {
        queued: 2,
        transcribing: 1,
        directing: 1,
        rendering: 1,
        completed: 10,
        failed: 0,
      };

      render(<PipelineMonitor stages={stages} totalVideos={15} />);

      expect(screen.getByText("Pipeline Engine Monitor")).toBeInTheDocument();
      expect(screen.getByText("5 In Pipeline")).toBeInTheDocument();
      expect(screen.getByText("Queued")).toBeInTheDocument();
      expect(screen.getByText("Transcribing")).toBeInTheDocument();
      expect(screen.getByText("AI Directing")).toBeInTheDocument();
      expect(screen.getByText("Rendering")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("QuickActions Component", () => {
    it("renders creation substrates and triggers callbacks", () => {
      const handleOpenUpload = vi.fn();
      render(<QuickActions onOpenUpload={handleOpenUpload} />);

      expect(screen.getByText("Creation Substrates")).toBeInTheDocument();
      expect(screen.getByText("Faceless AI Video")).toBeInTheDocument();
      expect(screen.getByText("Upload & Enhance Footage")).toBeInTheDocument();
      expect(screen.getByText("Studio NLE Editor")).toBeInTheDocument();
      expect(screen.getByText("Viral Presets & Formats")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Upload & Enhance Footage"));
      expect(handleOpenUpload).toHaveBeenCalledTimes(1);
    });
  });

  describe("ActivityFeed Component", () => {
    it("renders activity events and handles tab filtering", () => {
      const items = [
        {
          id: "1",
          type: "render_done" as const,
          title: "Video 1 Rendered",
          subtitle: "32s landscape",
          timestamp: "5m ago",
        },
        {
          id: "2",
          type: "draft" as const,
          title: "Draft Saved",
          subtitle: "Auto-saved locally",
          timestamp: "10m ago",
        },
      ];

      render(<ActivityFeed items={items} />);

      expect(screen.getByText("Recent Pipeline Activity")).toBeInTheDocument();
      expect(screen.getByText("Video 1 Rendered")).toBeInTheDocument();
      expect(screen.getAllByText("Draft Saved").length).toBeGreaterThanOrEqual(1);

      // Filter by Drafts
      const draftsTab = screen.getByRole("tab", { name: "Drafts" });
      fireEvent.click(draftsTab);

      expect(screen.queryByText("Video 1 Rendered")).not.toBeInTheDocument();
      expect(screen.getAllByText("Draft Saved").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ContinueEditingCard Component", () => {
    it("renders draft details and shows discard confirmation dialog", () => {
      const mockProject: any = {
        id: "proj-123",
        title: "Quantum Physics Short",
        duration: 42.5,
        aspectRatio: "9:16",
        tracks: { videoTrack: [{}], brollTrack: [{}] },
      };

      const handleDiscard = vi.fn();
      render(
        <ContinueEditingCard project={mockProject} onDiscard={handleDiscard} />
      );

      expect(screen.getByText("Quantum Physics Short")).toBeInTheDocument();
      expect(screen.getByText("42.5s")).toBeInTheDocument();
      expect(screen.getByText("2 clips on timeline")).toBeInTheDocument();
      expect(screen.getByText("Resume in Studio")).toBeInTheDocument();

      // Click discard button
      fireEvent.click(screen.getByRole("button", { name: /discard/i }));

      // Confirm dialog appears
      expect(
        screen.getByRole("dialog", { name: /discard saved draft/i })
      ).toBeInTheDocument();
      const confirmBtn = screen.getByRole("button", {
        name: /yes, discard draft/i,
      });
      fireEvent.click(confirmBtn);

      expect(handleDiscard).toHaveBeenCalledTimes(1);
    });
  });

  describe("DashboardOverviewPage", () => {
    it("renders greeting, quick action buttons, and recent videos", () => {
      render(<DashboardOverviewPage />);

      expect(screen.getByText(/Vansh\./i)).toBeInTheDocument();
      expect(screen.getByText("Open Studio")).toBeInTheDocument();
      expect(screen.getByText("New AI Video")).toBeInTheDocument();
      expect(screen.getByText("Recent Videos")).toBeInTheDocument();
      expect(
        screen.getByText("Why Compound Interest Grows Fast")
      ).toBeInTheDocument();
    });
  });
});
