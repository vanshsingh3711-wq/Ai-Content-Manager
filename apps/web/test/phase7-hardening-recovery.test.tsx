import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject, VideoClip, BRollClip } from "../lib/timeline-types";
import { PlayerMonitor } from "../components/editor/PlayerMonitor";

// Mock IndexedDB
vi.mock("../lib/idb", () => ({
  saveMediaToIDB: vi.fn().mockResolvedValue(undefined),
  getMediaFromIDB: vi.fn().mockImplementation(async (id: string) => {
    return new Blob(["dummy video content"], { type: "video/mp4" });
  }),
}));

describe("Phase 7: Production Hardening, Acceptance Test F & Proxy Scrubbing", () => {
  const baseProject: TimelineProject = {
    id: "proj-p7-recovery",
    title: "Production Resilience Test",
    aspectRatio: "9:16",
    duration: 15.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "clip-base-1",
          sourceUrl: "https://assets.mixkit.co/videos/sample.mp4",
          name: "Main Presenter",
          start: 0,
          end: 15.0,
          sourceStart: 0,
          sourceEnd: 15.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
        },
      ],
      brollTrack: [],
      textTrack: [],
      graphicsTrack: [],
      audioTrack: [],
    },
    transitions: [],
    constraints: [],
    safeZones: [],
  };

  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.getState().initProject(baseProject);
    useTimelineStore.getState().setPlayheadTime(0);
    useTimelineStore.getState().setSelectedItem(null);
  });

  it("Acceptance Test F: executes 5 manual edits + 2 AI edits, simulates browser refresh, and rehydrates exact state and playhead", async () => {
    const store = useTimelineStore.getState();

    // -------------------------------------------------------------------------
    // 5 MANUAL EDITS
    // -------------------------------------------------------------------------
    // 1. Manual Edit 1: Trim main clip from 0-15s to 0-12s
    store.trimVideoClip("clip-base-1", 0, 12.0);
    expect(useTimelineStore.getState().project.tracks.videoTrack[0].end).toBe(12.0);

    // 2. Manual Edit 2: Add B-Roll clip
    store.addBRollClip({
      name: "B-Roll Cut",
      sourceUrl: "https://assets.mixkit.co/broll.mp4",
      start: 2.0,
      end: 6.0,
      opacity: 90,
      fitMode: "cover",
      volume: 0,
      muted: true,
    });
    expect(useTimelineStore.getState().project.tracks.brollTrack.length).toBe(1);

    // 3. Manual Edit 3: Add Audio/SFX track
    store.addAudioClip({
      name: "Pop Cue",
      sourceUrl: "pop.wav",
      start: 2.0,
      end: 2.5,
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      isBgm: false,
    });
    expect(useTimelineStore.getState().project.tracks.audioTrack.length).toBe(1);

    // Add second clip for transition
    store.dispatchOperation({
      type: "add_element",
      track: "video",
      element: {
        id: "clip-base-2",
        sourceUrl: "https://assets.mixkit.co/videos/sample.mp4",
        name: "Second Clip",
        start: 12.0,
        end: 15.0,
        sourceStart: 12.0,
        sourceEnd: 15.0,
        speed: 1,
        volume: 100,
        zoomFactor: 1.0,
      },
    });

    // 4. Manual Edit 4: Add Transition
    store.dispatchOperation({
      type: "add_transition",
      id: "trans-crossfade-1",
      track: "video",
      fromClipId: "clip-base-1",
      toClipId: "clip-base-2",
      preset: "crossfade",
      duration: 0.8,
      alignment: "center",
    });
    expect(useTimelineStore.getState().project.transitions?.length).toBe(1);


    // 5. Manual Edit 5: Add Caption
    store.addCaption({
      text: "Manual Subtitle",
      start: 1.0,
      end: 3.5,
      stylePreset: "tiktok_yellow",
    });
    expect(useTimelineStore.getState().project.tracks.textTrack.length).toBe(1);

    // -------------------------------------------------------------------------
    // 2 AI EDITS (BATCH/COPILOT)
    // -------------------------------------------------------------------------
    // 6. AI Edit 1: Add Motion Graphic Hero Reveal
    store.addGraphicElement({
      name: "AI Hero Card",
      compositionId: "hero_reveal",
      props: { headline: "AI Verified", tag: "STUDIO" },
      start: 4.0,
      end: 7.0,
      position: { x: 50, y: 30 },
    });
    expect(useTimelineStore.getState().project.tracks.graphicsTrack.length).toBe(1);

    // 7. AI Edit 2: Set Scale Keyframe on Graphic
    const graphicId = useTimelineStore.getState().project.tracks.graphicsTrack[0].id;
    store.setKeyframe("graphic", graphicId, "scale", 1.0, 1.25, true);

    // Set playhead time to specific recovery position
    store.setPlayheadTime(4.25);
    expect(useTimelineStore.getState().playheadTime).toBe(4.25);

    // -------------------------------------------------------------------------
    // SIMULATE BROWSER REFRESH / CRASH RECOVERY (Acceptance Test F)
    // -------------------------------------------------------------------------
    // Verify that localStorage contains the exact serialized draft state
    const draftJson = localStorage.getItem("video-editor-draft");
    expect(draftJson).toBeDefined();
    expect(draftJson).not.toBeNull();

    const parsedDraft = JSON.parse(draftJson!);
    expect(parsedDraft.state).toBeDefined();
    expect(parsedDraft.state.playheadTime).toBe(4.25);
    expect(parsedDraft.state.project.tracks.videoTrack[0].end).toBe(12.0);
    expect(parsedDraft.state.project.tracks.brollTrack.length).toBe(1);
    expect(parsedDraft.state.project.tracks.audioTrack.length).toBe(1);
    expect(parsedDraft.state.project.tracks.textTrack.length).toBe(1);
    expect(parsedDraft.state.project.tracks.graphicsTrack.length).toBe(1);
    expect(parsedDraft.state.project.transitions.length).toBe(1);

    // Wipe memory store to simulate fresh tab startup
    useTimelineStore.setState({
      project: {
        id: "wiped",
        title: "",
        aspectRatio: "9:16",
        duration: 0,
        fps: 30,
        tracks: {
          videoTrack: [],
          brollTrack: [],
          textTrack: [],
          graphicsTrack: [],
          audioTrack: [],
        },
      },
      playheadTime: 0,
      past: [],
      future: [],
    });
    expect(useTimelineStore.getState().project.tracks.videoTrack.length).toBe(0);
    expect(useTimelineStore.getState().playheadTime).toBe(0);

    // Rehydrate from persisted storage
    useTimelineStore.setState({
      project: parsedDraft.state.project,
      playheadTime: parsedDraft.state.playheadTime,
    });

    const restoredState = useTimelineStore.getState();

    // Verify full fidelity restoration
    expect(restoredState.playheadTime).toBe(4.25);
    expect(restoredState.project.tracks.videoTrack[0].id).toBe("clip-base-1");
    expect(restoredState.project.tracks.videoTrack[0].end).toBe(12.0);

    expect(restoredState.project.tracks.brollTrack[0].name).toBe("B-Roll Cut");
    expect(restoredState.project.tracks.brollTrack[0].start).toBe(2.0);
    expect(restoredState.project.tracks.brollTrack[0].end).toBe(6.0);

    expect(restoredState.project.tracks.audioTrack[0].name).toBe("Pop Cue");
    expect(restoredState.project.tracks.audioTrack[0].start).toBe(2.0);

    expect(restoredState.project.tracks.textTrack[0].text).toBe("Manual Subtitle");
    expect(restoredState.project.tracks.textTrack[0].stylePreset).toBe("tiktok_yellow");

    expect(restoredState.project.tracks.graphicsTrack[0].name).toBe("AI Hero Card");
    expect(restoredState.project.tracks.graphicsTrack[0].compositionId).toBe("hero_reveal");
    expect(restoredState.project.tracks.graphicsTrack[0].props.headline).toBe("AI Verified");

    expect(restoredState.project.transitions?.length).toBe(1);
    expect(restoredState.project.transitions![0].preset).toBe("crossfade");
  });

  it("PlayerMonitor switches to 540p proxy video stream when proxyUrl is provided", () => {
    const projectWithProxy: TimelineProject = {
      ...baseProject,
      tracks: {
        ...baseProject.tracks,
        videoTrack: [
          {
            id: "clip-proxy-1",
            sourceUrl: "https://cdn.example.com/raw_1080p.mp4",
            proxyUrl: "https://cdn.example.com/proxy_540p.mp4",
            name: "Proxy Clip",
            start: 0,
            end: 10.0,
            sourceStart: 0,
            sourceEnd: 10.0,
            speed: 1,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
      },
    };

    useTimelineStore.getState().initProject(projectWithProxy);
    useTimelineStore.getState().setPlayheadTime(2.0);

    const { container } = render(<PlayerMonitor />);
    const videoElem = container.querySelector("video");

    expect(videoElem).toBeDefined();
    expect(videoElem).not.toBeNull();
    // Video player should prefer proxyUrl for low-memory 60fps scrubbing
    expect(videoElem?.getAttribute("src")).toBe("https://cdn.example.com/proxy_540p.mp4");
  });

  it("PlayerMonitor falls back to sourceUrl when proxyUrl is omitted", () => {
    const projectWithoutProxy: TimelineProject = {
      ...baseProject,
      tracks: {
        ...baseProject.tracks,
        videoTrack: [
          {
            id: "clip-source-1",
            sourceUrl: "https://cdn.example.com/standard_1080p.mp4",
            name: "Standard Clip",
            start: 0,
            end: 10.0,
            sourceStart: 0,
            sourceEnd: 10.0,
            speed: 1,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
      },
    };

    useTimelineStore.getState().initProject(projectWithoutProxy);
    useTimelineStore.getState().setPlayheadTime(1.5);

    const { container } = render(<PlayerMonitor />);
    const videoElem = container.querySelector("video");

    expect(videoElem).toBeDefined();
    expect(videoElem?.getAttribute("src")).toBe("https://cdn.example.com/standard_1080p.mp4");
  });
});
