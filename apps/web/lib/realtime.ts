"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VideoJobData } from "@/components/queue/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface StreamUpdatePayload {
  type: "jobs_update" | "error" | "heartbeat";
  timestamp: string;
  jobs: VideoJobData[];
  active_count: number;
}

export interface UseJobStreamOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
  enableDesktopNotifications?: boolean;
  onJobCompleted?: (job: VideoJobData) => void;
  onJobFailed?: (job: VideoJobData) => void;
}

/* ──────────────────────────────────────────────────────────
   Desktop Notifications Utilities
   ────────────────────────────────────────────────────────── */

export function canUseDesktopNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseDesktopNotifications()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!canUseDesktopNotifications()) return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return "denied";
  }
}

export function sendDesktopNotification(
  title: string,
  options: NotificationOptions & { onClickUrl?: string } = {}
): Notification | null {
  if (!canUseDesktopNotifications() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const { onClickUrl, ...notifOptions } = options;
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...notifOptions,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (onClickUrl && typeof window !== "undefined") {
        window.location.href = onClickUrl;
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("[Realtime: Notification] Failed to send desktop notification:", err);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────
   Live Job Stream Hook (SSE with Polling Fallback)
   ────────────────────────────────────────────────────────── */

export function useJobStream(options: UseJobStreamOptions = {}) {
  const {
    enabled = true,
    pollIntervalMs = 8000,
    enableDesktopNotifications = true,
    onJobCompleted,
    onJobFailed,
  } = options;

  const [jobs, setJobs] = useState<VideoJobData[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  // Keep stable refs to volatile callbacks so changing them does not recreate listeners or retrigger effects
  const onJobCompletedRef = useRef(onJobCompleted);
  onJobCompletedRef.current = onJobCompleted;
  const onJobFailedRef = useRef(onJobFailed);
  onJobFailedRef.current = onJobFailed;
  const enableDesktopNotificationsRef = useRef(enableDesktopNotifications);
  enableDesktopNotificationsRef.current = enableDesktopNotifications;

  // Keep a map of previous job statuses to detect transitions
  const previousJobsRef = useRef<Map<string, string>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync notification permission status on mount
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleJobTransitions = useCallback(
    (newJobs: VideoJobData[]) => {
      const prevMap = previousJobsRef.current;
      const isFirstLoad = prevMap.size === 0;

      for (const job of newJobs) {
        const prevStatus = prevMap.get(job.id);

        if (!isFirstLoad && prevStatus) {
          // Detect transition to COMPLETED
          if (prevStatus !== "COMPLETED" && job.status === "COMPLETED") {
            if (onJobCompletedRef.current) onJobCompletedRef.current(job);
            if (enableDesktopNotificationsRef.current) {
              sendDesktopNotification(`🎬 Video Render Ready: ${job.title}`, {
                body: "Your AI video has finished rendering and is available in your Library.",
                tag: `job-completed-${job.id}`,
                onClickUrl: "/dashboard/videos",
              });
            }
          }

          // Detect transition to FAILED
          if (prevStatus !== "FAILED" && job.status === "FAILED") {
            if (onJobFailedRef.current) onJobFailedRef.current(job);
            if (enableDesktopNotificationsRef.current) {
              sendDesktopNotification(`⚠️ Render Failed: ${job.title}`, {
                body: job.error_log || "An error occurred during video pipeline generation.",
                tag: `job-failed-${job.id}`,
                onClickUrl: "/dashboard/queue",
              });
            }
          }
        }

        // Update tracking map
        prevMap.set(job.id, job.status);
      }
    },
    []
  );

  const isPollingRef = useRef(false);

  // Fallback Polling Function
  const fetchJobsViaPoll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/jobs`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();
      const jobList: VideoJobData[] = Array.isArray(data) ? data : data.jobs || [];

      setJobs(jobList);
      const active = jobList.filter(
        (j) => j.status !== "COMPLETED" && j.status !== "FAILED"
      ).length;
      setActiveCount(active);
      setLastUpdated(new Date());
      setError(null);
      handleJobTransitions(jobList);
    } catch (err: any) {
      setError((prev) => (prev === (err?.message || "Failed to poll jobs") ? prev : (err?.message || "Failed to poll jobs")));
    } finally {
      isPollingRef.current = false;
    }
  }, [handleJobTransitions]);

  // Connect to SSE Endpoint
  useEffect(() => {
    if (!enabled) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const streamUrl = `${apiUrl}/api/v1/jobs/stream`;

    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    function connectSSE() {
      if (typeof window === "undefined" || !("EventSource" in window)) {
        setStatus("disconnected");
        // Start polling fallback
        fetchJobsViaPoll();
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(fetchJobsViaPoll, pollIntervalMs);
        }
        return;
      }

      setStatus("connecting");

      try {
        eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (!isSubscribed) return;
          setStatus("connected");
          setError(null);
          // If polling was active, clear it
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        };

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const payload: StreamUpdatePayload = JSON.parse(event.data);
            if (payload.type === "jobs_update" && Array.isArray(payload.jobs)) {
              setJobs(payload.jobs);
              setActiveCount(payload.active_count ?? 0);
              setLastUpdated(new Date());
              handleJobTransitions(payload.jobs);
            }
          } catch (parseErr) {
            console.warn("[Realtime: SSE] JSON parse error:", parseErr);
          }
        };

        eventSource.onerror = () => {
          if (!isSubscribed) return;
          setStatus("disconnected");
          eventSource?.close();
          eventSourceRef.current = null;

          // Start polling fallback with timer
          if (!pollTimerRef.current) {
            pollTimerRef.current = setInterval(fetchJobsViaPoll, pollIntervalMs);
          }
        };
      } catch (e: any) {
        setStatus("error");
        setError((prev) => (prev === (e?.message || "Failed to connect to SSE stream") ? prev : (e?.message || "Failed to connect to SSE stream")));
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(fetchJobsViaPoll, pollIntervalMs);
        }
      }
    }

    connectSSE();

    return () => {
      isSubscribed = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [enabled, pollIntervalMs, fetchJobsViaPoll, handleJobTransitions]);

  const requestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  };

  return {
    jobs,
    activeCount,
    status,
    lastUpdated,
    error,
    permission,
    requestPermission,
    refresh: fetchJobsViaPoll,
  };
}
