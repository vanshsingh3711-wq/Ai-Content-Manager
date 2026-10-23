import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VersionHistoryDrawer } from "../components/editor/VersionHistoryDrawer";
import { EditorTopNav } from "../components/editor/EditorTopNav";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 9: Studio Cloud Version History Drawer & Interactive Checkpoints", () => {
  const mockCurrentProject: TimelineProject = {
    id: "proj-phase9-test",
    videoId: "vid-test-123",
    title: "Phase 9 Test Reel",
    aspectRatio: "9:16",
    duration: 12.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "clip-1",
          sourceUrl: "https://example.com/clip1.mp4",
          name: "Main Scene",
          start: 0,
          end: 12.0,
          sourceStart: 0,
          sourceEnd: 12.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
        },
      ],
      brollTrack: [
        {
          id: "broll-1",
          sourceUrl: "https://example.com/broll.mp4",
          name: "Overlay Scene",
          start: 3.0,
          end: 6.0,
          opacity: 90,
          fitMode: "cover",
        },
      ],
      textTrack: [
        {
          id: "cap-1",
          text: "WELCOME TO PHASE 9",
          start: 0.5,
          end: 3.5,
          stylePreset: "tiktok_yellow",
          positionY: 75,
        },
        {
          id: "cap-2",
          text: "CLOUD RESTORE ACTIVE",
          start: 4.0,
          end: 8.0,
          stylePreset: "hormozi_bold",
          positionY: 75,
        },
      ],
      audioTrack: [
        {
          id: "audio-1",
          sourceUrl: "https://example.com/audio.mp3",
          name: "BGM Track",
          start: 0,
          end: 12.0,
          volume: 50,
        },
      ],
      graphicsTrack: [
        {
          id: "gfx-1",
          type: "badge",
          start: 1.0,
          end: 4.0,
          content: "Trending",
          positionX: 50,
          positionY: 20,
        },
      ],
    },
  };

  const mockHistoricalSnapshots = [
    {
      id: "snap-v2-uuid",
      video_id: "vid-test-123",
      version: 2,
      label: "Viral Hook Applied",
      description: "Added snappy hook caption and motion badge",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      clip_counts: {
        video: 1,
        audio: 1,
        captions: 2,
        graphics: 1,
        broll: 1,
      },
    },
    {
      id: "snap-v1-uuid",
      video_id: "vid-test-123",
      version: 1,
      label: "Initial Rough Cut",
      description: "Raw ingested talking head without graphics",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      clip_counts: {
        video: 1,
        audio: 0,
        captions: 0,
        graphics: 0,
        broll: 0,
      },
    },
  ];

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("1. Fetches and displays existing version checkpoints with clip counts and version tags", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/snapshots") && !url.includes("/restore")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              snapshots: mockHistoricalSnapshots,
              total: 2,
            }),
        });
      }
      return Promise.reject(new Error("Unexpected endpoint"));
    });
    global.fetch = mockFetch;

    render(
      <VersionHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        videoId="vid-test-123"
        currentProject={mockCurrentProject}
        onRestoreProject={vi.fn()}
      />
    );

    // Verify Drawer Header
    expect(screen.getByText("Version History")).toBeDefined();
    expect(screen.getByText("Cloud")).toBeDefined();

    // Verify Active live draft preview
    expect(screen.getByText("Live Active Project")).toBeDefined();
    expect(screen.getByText("12.0s total")).toBeDefined();

    // Wait for snapshots list to load
    await waitFor(() => {
      expect(screen.getByText("Checkpoints (2)")).toBeDefined();
      expect(screen.getByText("v2")).toBeDefined();
      expect(screen.getByText("Viral Hook Applied")).toBeDefined();
      expect(screen.getByText("Added snappy hook caption and motion badge")).toBeDefined();

      expect(screen.getByText("v1")).toBeDefined();
      expect(screen.getByText("Initial Rough Cut")).toBeDefined();
      expect(screen.getByText("Raw ingested talking head without graphics")).toBeDefined();
    });

    // Check clip counts chip display within snapshot item card
    const snapshotV2Card = screen.getByTestId("snapshot-item-2");
    expect(snapshotV2Card.textContent).toContain("2 Captions");
    expect(snapshotV2Card.textContent).toContain("1 Graphic");
  });

  it("2. Allows creating a new snapshot checkpoint via the form and updates the list", async () => {
    let listCalls = 0;
    let createCalledWith: any = null;

    const mockFetch = vi.fn().mockImplementation((url: string, options: any = {}) => {
      if (url.includes("/snapshots") && options.method === "POST") {
        createCalledWith = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "snap-v3-uuid",
              video_id: "vid-test-123",
              version: 3,
              label: createCalledWith.label,
              description: createCalledWith.description,
              created_at: new Date().toISOString(),
              clip_counts: { video: 1, audio: 1, captions: 2, graphics: 1, broll: 1 },
              timeline_project: mockCurrentProject,
            }),
        });
      }

      if (url.includes("/snapshots")) {
        listCalls++;
        const currentList =
          listCalls === 1
            ? mockHistoricalSnapshots
            : [
                {
                  id: "snap-v3-uuid",
                  video_id: "vid-test-123",
                  version: 3,
                  label: "Polished Hook & Captions",
                  description: "Finalized caption styles",
                  created_at: new Date().toISOString(),
                  clip_counts: { video: 1, audio: 1, captions: 2, graphics: 1, broll: 1 },
                },
                ...mockHistoricalSnapshots,
              ];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ snapshots: currentList, total: currentList.length }),
        });
      }

      return Promise.reject(new Error("Unexpected endpoint"));
    });
    global.fetch = mockFetch;

    render(
      <VersionHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        videoId="vid-test-123"
        currentProject={mockCurrentProject}
        onRestoreProject={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Viral Hook Applied")).toBeDefined();
    });

    // Type into checkpoint name and notes input
    const nameInput = screen.getByPlaceholderText(/Checkpoint name/i);
    const notesInput = screen.getByPlaceholderText(/Optional notes/i);

    fireEvent.change(nameInput, { target: { value: "Polished Hook & Captions" } });
    fireEvent.change(notesInput, { target: { value: "Finalized caption styles" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Save Checkpoint/i });
    fireEvent.click(saveBtn);

    // Verify API call payload
    await waitFor(() => {
      expect(createCalledWith).toBeDefined();
      expect(createCalledWith.label).toBe("Polished Hook & Captions");
      expect(createCalledWith.description).toBe("Finalized caption styles");
      expect(createCalledWith.timeline_project).toBeDefined();
    });

    // Verify success status banner
    await waitFor(() => {
      expect(screen.getByText(/created successfully!/i)).toBeDefined();
    });
  });

  it("3. Restores an earlier version checkpoint and triggers onRestoreProject callback", async () => {
    const onRestoreSpy = vi.fn();
    const restoredProjectData = {
      ...mockCurrentProject,
      title: "Restored v1 Project",
      tracks: {
        ...mockCurrentProject.tracks,
        textTrack: [], // In v1 there were 0 captions
      },
    };

    const mockFetch = vi.fn().mockImplementation((url: string, options: any = {}) => {
      if (url.includes("/restore") && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "restored",
              snapshot_id: "snap-v1-uuid",
              version: 1,
              label: "Initial Rough Cut",
              message: "Successfully restored to version 1 ('Initial Rough Cut')",
              timeline_project: restoredProjectData,
            }),
        });
      }

      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              snapshots: mockHistoricalSnapshots,
              total: 2,
            }),
        });
      }

      return Promise.reject(new Error("Unexpected endpoint"));
    });
    global.fetch = mockFetch;

    render(
      <VersionHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        videoId="vid-test-123"
        currentProject={mockCurrentProject}
        onRestoreProject={onRestoreSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Initial Rough Cut")).toBeDefined();
    });

    // Click "Restore Version" on snapshot v1
    const snapshotV1Card = screen.getByTestId("snapshot-item-1");
    const restoreBtn = snapshotV1Card.querySelector("button")!;
    expect(restoreBtn.textContent).toContain("Restore Version");
    fireEvent.click(restoreBtn);

    // Confirm prompt should appear
    await waitFor(() => {
      expect(screen.getByText("Rollback to v1?")).toBeDefined();
      expect(screen.getByText("Confirm")).toBeDefined();
    });

    // Click Confirm
    const confirmBtn = screen.getByText("Confirm");
    fireEvent.click(confirmBtn);

    // Verify onRestoreProject was called with restored project data
    await waitFor(() => {
      expect(onRestoreSpy).toHaveBeenCalledTimes(1);
      expect(onRestoreSpy).toHaveBeenCalledWith(restoredProjectData, "v1 - Initial Rough Cut");
      expect(screen.getByText(/Successfully restored to Version 1/i)).toBeDefined();
    });
  });

  it("4. Deletes a checkpoint from the history list upon user confirmation", async () => {
    let deleteCalled = false;

    const mockFetch = vi.fn().mockImplementation((url: string, options: any = {}) => {
      if (url.includes("/snapshots/snap-v1-uuid") && options.method === "DELETE") {
        deleteCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "deleted", snapshot_id: "snap-v1-uuid" }),
        });
      }

      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              snapshots: mockHistoricalSnapshots,
              total: 2,
            }),
        });
      }

      return Promise.reject(new Error("Unexpected endpoint"));
    });
    global.fetch = mockFetch;

    render(
      <VersionHistoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        videoId="vid-test-123"
        currentProject={mockCurrentProject}
        onRestoreProject={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Initial Rough Cut")).toBeDefined();
    });

    // Find delete button on snapshot v1
    const snapshotV1Card = screen.getByTestId("snapshot-item-1");
    const deleteBtn = snapshotV1Card.querySelector("button[title='Delete checkpoint']")!;
    fireEvent.click(deleteBtn);

    // Confirm deletion prompt appears
    await waitFor(() => {
      expect(screen.getByText("Delete?")).toBeDefined();
      expect(screen.getByText("Yes")).toBeDefined();
    });

    // Click Yes
    fireEvent.click(screen.getByText("Yes"));

    // Verify DELETE request and removal from UI
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(screen.queryByText("Initial Rough Cut")).toBeNull();
      expect(screen.getByText(/Checkpoint removed from version history/i)).toBeDefined();
    });
  });

  it("5. EditorTopNav integrates Versions button and triggers onToggleHistory", () => {
    const onToggleHistorySpy = vi.fn();

    render(
      <EditorTopNav
        isHistoryOpen={false}
        onToggleHistory={onToggleHistorySpy}
      />
    );

    const versionsBtn = screen.getByTitle("Project Version History & Checkpoints");
    expect(versionsBtn).toBeDefined();
    expect(versionsBtn.textContent).toContain("Versions");

    fireEvent.click(versionsBtn);
    expect(onToggleHistorySpy).toHaveBeenCalledTimes(1);
  });
});
