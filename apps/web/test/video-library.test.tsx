import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  VideoCard,
  VideoTableRow,
  FilterBar,
  VideoDetailDrawer,
  BatchActionBar,
  VideoJob,
} from "../components/library";
import VideosLibraryPage from "../app/dashboard/videos/page.tsx";
import { ToastProvider } from "../components/ui";

const mockVideo: VideoJob = {
  id: "vid-001",
  user_id: "user-1",
  title: "Why Compound Interest Grows Fast",
  source_url: "https://example.com/source.mp4",
  rendered_url: "https://example.com/rendered.mp4",
  video_type: "faceless_short",
  status: "COMPLETED",
  created_at: new Date(Date.now() - 3600000).toISOString(),
  updated_at: new Date(Date.now() - 3600000).toISOString(),
  edit_decision_list: JSON.stringify({
    settings: { aspect_ratio: "9:16", video_style: "educational", caption_preset: "tiktok_yellow" },
    validated_edits: [
      { action: "cut", start_time: 0, description: "Hook intro" },
      { action: "b_roll", start_time: 4.5, description: "3D compound graph" },
    ],
    unified_analysis: {
      transcript: "Compound interest is exponential rather than linear.",
    },
  }),
};

describe("Phase 5: Video Library & Detail Drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("VideoCard Component", () => {
    it("renders video card with title, aspect ratio, and status badge", () => {
      const handleToggleSelect = vi.fn();
      const handleClick = vi.fn();

      render(
        <VideoCard
          video={mockVideo}
          isSelected={false}
          onToggleSelect={handleToggleSelect}
          onClick={handleClick}
        />
      );

      expect(screen.getByText("Why Compound Interest Grows Fast")).toBeInTheDocument();
      expect(screen.getByText("9:16")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();

      // Click card
      fireEvent.click(screen.getByText("Why Compound Interest Grows Fast"));
      expect(handleClick).toHaveBeenCalledWith(mockVideo);

      // Toggle selection
      const checkbox = screen.getByLabelText(/select why compound interest/i);
      fireEvent.click(checkbox);
      expect(handleToggleSelect).toHaveBeenCalledWith("vid-001");
    });
  });

  describe("VideoTableRow Component", () => {
    it("renders row with title, status, and studio action button", () => {
      const handleToggleSelect = vi.fn();
      const handleClick = vi.fn();

      render(
        <VideoTableRow
          video={mockVideo}
          isSelected={false}
          onToggleSelect={handleToggleSelect}
          onClick={handleClick}
        />
      );

      expect(screen.getByText("Why Compound Interest Grows Fast")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
      expect(screen.getByTitle("Open in Studio NLE")).toBeInTheDocument();
    });
  });

  describe("FilterBar Component", () => {
    it("handles search input, status switching, and view toggle", () => {
      const handleSearch = vi.fn();
      const handleStatus = vi.fn();
      const handleViewMode = vi.fn();
      const handleRefresh = vi.fn();

      render(
        <FilterBar
          searchQuery=""
          onSearchChange={handleSearch}
          statusFilter="ALL"
          onStatusFilterChange={handleStatus}
          typeFilter="ALL"
          onTypeFilterChange={vi.fn()}
          viewMode="grid"
          onViewModeChange={handleViewMode}
          onRefresh={handleRefresh}
          totalCount={10}
        />
      );

      expect(screen.getByPlaceholderText(/search 10 videos/i)).toBeInTheDocument();

      // Click Completed filter
      fireEvent.click(screen.getByText("Completed"));
      expect(handleStatus).toHaveBeenCalledWith("COMPLETED");

      // Switch to List view
      fireEvent.click(screen.getByLabelText("List view"));
      expect(handleViewMode).toHaveBeenCalledWith("list");

      // Click refresh
      fireEvent.click(screen.getByLabelText("Refresh library"));
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("BatchActionBar Component", () => {
    it("renders when videos are selected and confirms batch delete", () => {
      const handleClear = vi.fn();
      const handleDelete = vi.fn();

      render(
        <BatchActionBar
          selectedCount={3}
          onClearSelection={handleClear}
          onBatchDelete={handleDelete}
        />
      );

      expect(screen.getByText("3 videos selected")).toBeInTheDocument();

      // Click delete button
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      // Confirm dialog appears
      expect(screen.getByRole("dialog", { name: /delete 3 videos/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /yes, delete videos/i }));

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("VideoDetailDrawer Component", () => {
    it("renders drawer with inline video, edits tab, and transcript tab", () => {
      const handleClose = vi.fn();

      render(
        <VideoDetailDrawer
          video={mockVideo}
          isOpen={true}
          onClose={handleClose}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Why Compound Interest Grows Fast")).toBeInTheDocument();
      expect(screen.getByText(/Timeline Beats \(2\)/)).toBeInTheDocument();
      expect(screen.getByText("Hook intro")).toBeInTheDocument();
      expect(screen.getByText("3D compound graph")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /open in studio nle/i })).toBeInTheDocument();

      // Switch to Transcript tab
      fireEvent.click(screen.getByRole("tab", { name: /transcript/i }));
      expect(
        screen.getByText(/Compound interest is exponential rather than linear\./)
      ).toBeInTheDocument();
    });
  });

  describe("VideosLibraryPage Integration", () => {
    it("renders page header, videos, and toggles between grid and list", () => {
      render(
        <ToastProvider>
          <VideosLibraryPage />
        </ToastProvider>
      );

      expect(screen.getByText("Video Content Library")).toBeInTheDocument();
      expect(screen.getByText("Why Compound Interest Grows Exponentially")).toBeInTheDocument();

      // Switch to list view
      fireEvent.click(screen.getByLabelText("List view"));
      expect(screen.getByText("Format")).toBeInTheDocument();

      // Switch back to grid view
      fireEvent.click(screen.getByLabelText("Grid view"));
      expect(screen.queryByText("Format")).not.toBeInTheDocument();
    });
  });
});
