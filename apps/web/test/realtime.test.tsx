import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  canUseDesktopNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
  useJobStream,
} from "../lib/realtime";
import { VideoJobData } from "@/components/queue/types";

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror();
    }
  }
}

// Test harness component for useJobStream
function TestStreamComponent({
  options = {},
  onState,
}: {
  options?: any;
  onState?: (state: any) => void;
}) {
  const stream = useJobStream(options);
  if (onState) onState(stream);

  return (
    <div>
      <div data-testid="status">{stream.status}</div>
      <div data-testid="active-count">{stream.activeCount}</div>
      <div data-testid="jobs-count">{stream.jobs.length}</div>
    </div>
  );
}

describe("Phase 8: Desktop Notifications Infrastructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks notification support and permissions", async () => {
    // Mock Notification global
    const mockRequestPermission = vi.fn().mockResolvedValue("granted");
    (window as any).Notification = {
      permission: "default",
      requestPermission: mockRequestPermission,
    };

    expect(canUseDesktopNotifications()).toBe(true);
    expect(getNotificationPermission()).toBe("default");

    const result = await requestNotificationPermission();
    expect(result).toBe("granted");
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it("sends a desktop notification when permission is granted", () => {
    const mockNotificationConstructor = vi.fn();
    (window as any).Notification = class MockNotification {
      title: string;
      options: any;
      onclick: any = null;
      close = vi.fn();

      constructor(title: string, options: any) {
        this.title = title;
        this.options = options;
        mockNotificationConstructor(title, options);
      }
      static permission = "granted";
    };

    const notif = sendDesktopNotification("Render Complete", {
      body: "Video has finished rendering",
      onClickUrl: "/dashboard/videos",
    });

    expect(notif).not.toBeNull();
    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      "Render Complete",
      expect.objectContaining({
        body: "Video has finished rendering",
      })
    );
  });
});

describe("Phase 8: Real-Time SSE Job Stream Hook", () => {
  let originalEventSource: any;

  beforeEach(() => {
    MockEventSource.instances = [];
    originalEventSource = (window as any).EventSource;
    (window as any).EventSource = MockEventSource;
  });

  afterEach(() => {
    (window as any).EventSource = originalEventSource;
  });

  it("connects to the SSE stream and updates status to connected", async () => {
    render(<TestStreamComponent />);

    expect(screen.getByTestId("status").textContent).toBe("connecting");

    // Wait for mock onopen
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId("status").textContent).toBe("connected");
  });

  it("receives jobs_update payload and updates jobs and active count", async () => {
    render(<TestStreamComponent />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const instance = MockEventSource.instances[0];
    expect(instance).toBeDefined();

    const sampleJobs: VideoJobData[] = [
      {
        id: "job-1",
        title: "Test Video 1",
        status: "RENDERING",
        source_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "job-2",
        title: "Test Video 2",
        status: "COMPLETED",
        source_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await act(async () => {
      instance.simulateMessage({
        type: "jobs_update",
        timestamp: new Date().toISOString(),
        jobs: sampleJobs,
        active_count: 1,
      });
    });

    expect(screen.getByTestId("jobs-count").textContent).toBe("2");
    expect(screen.getByTestId("active-count").textContent).toBe("1");
  });

  it("triggers onJobCompleted callback when a job transitions from RENDERING to COMPLETED", async () => {
    const onJobCompleted = vi.fn();
    render(<TestStreamComponent options={{ onJobCompleted }} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const instance = MockEventSource.instances[0];

    // First emission: job is RENDERING
    await act(async () => {
      instance.simulateMessage({
        type: "jobs_update",
        timestamp: new Date().toISOString(),
        jobs: [
          {
            id: "job-trans-1",
            title: "Transition Video",
            status: "RENDERING",
            source_url: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        active_count: 1,
      });
    });

    expect(onJobCompleted).not.toHaveBeenCalled();

    // Second emission: job transitions to COMPLETED
    await act(async () => {
      instance.simulateMessage({
        type: "jobs_update",
        timestamp: new Date().toISOString(),
        jobs: [
          {
            id: "job-trans-1",
            title: "Transition Video",
            status: "COMPLETED",
            source_url: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        active_count: 0,
      });
    });

    expect(onJobCompleted).toHaveBeenCalledTimes(1);
    expect(onJobCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job-trans-1", status: "COMPLETED" })
    );
  });
});
