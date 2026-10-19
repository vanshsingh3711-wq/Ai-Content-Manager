import { describe, it, expect } from "vitest";
import {
  getCanvasDimensions,
  getAspectRatioFromDimensions,
  secondsToFrames,
  framesToSeconds,
  percentToPixels,
  pixelsToPercent,
  timelineProjectToSceneDefinition,
  sceneDefinitionToTimelineProject,
} from "../lib/project-adapter";
import { TimelineProject } from "../lib/timeline-types";

describe("project-adapter: Geometry and Timing Conversion Utilities", () => {
  it("resolves correct canvas dimensions for aspect ratios", () => {
    expect(getCanvasDimensions("9:16")).toEqual({ width: 1080, height: 1920 });
    expect(getCanvasDimensions("16:9")).toEqual({ width: 1920, height: 1080 });
    expect(getCanvasDimensions("1:1")).toEqual({ width: 1080, height: 1080 });
    expect(getCanvasDimensions("4:5")).toEqual({ width: 1080, height: 1350 });
  });

  it("infers aspect ratio correctly from dimensions", () => {
    expect(getAspectRatioFromDimensions(1080, 1920)).toBe("9:16");
    expect(getAspectRatioFromDimensions(1920, 1080)).toBe("16:9");
    expect(getAspectRatioFromDimensions(1080, 1080)).toBe("1:1");
    expect(getAspectRatioFromDimensions(1080, 1350)).toBe("4:5");
    expect(getAspectRatioFromDimensions(0, 0)).toBe("9:16");
  });

  it("converts seconds to frames and back with rational accuracy", () => {
    const fps = 30;
    expect(secondsToFrames(0, fps)).toBe(0);
    expect(secondsToFrames(1.5, fps)).toBe(45);
    expect(secondsToFrames(10.0, fps)).toBe(300);

    expect(framesToSeconds(0, fps)).toBe(0);
    expect(framesToSeconds(45, fps)).toBe(1.5);
    expect(framesToSeconds(300, fps)).toBe(10);

    // Round trip at 30 fps
    const testTimes = [0, 0.5, 1.0, 2.333333, 5.7, 12.25];
    testTimes.forEach((t) => {
      const frames = secondsToFrames(t, fps);
      const restored = framesToSeconds(frames, fps);
      expect(Math.abs(restored - t)).toBeLessThanOrEqual(1 / fps);
    });
  });

  it("converts percentages to pixels and back with sub-pixel precision", () => {
    const width = 1080;
    const height = 1920;

    expect(percentToPixels(0, width)).toBe(0);
    expect(percentToPixels(50, width)).toBe(540);
    expect(percentToPixels(100, width)).toBe(1080);

    expect(percentToPixels(0, height)).toBe(0);
    expect(percentToPixels(50, height)).toBe(960);
    expect(percentToPixels(100, height)).toBe(1920);

    expect(pixelsToPercent(540, width)).toBe(50);
    expect(pixelsToPercent(960, height)).toBe(50);
    expect(pixelsToPercent(1080, width)).toBe(100);
    expect(pixelsToPercent(0, width)).toBe(0);
    expect(pixelsToPercent(500, 0)).toBe(0);
  });
});

describe("project-adapter: TimelineProject to SceneDefinition", () => {
  const sampleProject: TimelineProject = {
    id: "proj-123",
    title: "Test AI Video Project",
    aspectRatio: "9:16",
    duration: 10,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-1",
          sourceUrl: "https://assets.example.com/main.mp4",
          name: "Main Cam",
          start: 0,
          end: 6.0,
          sourceStart: 1.0,
          sourceEnd: 7.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
          rotation: 0,
        },
      ],
      brollTrack: [
        {
          id: "broll-1",
          sourceUrl: "https://assets.example.com/overlay.mp4",
          name: "B-Roll Cutaway",
          start: 2.0,
          end: 5.0,
          opacity: 90,
          fitMode: "cover",
          position: { x: 50, y: 50 },
          scale: 1.0,
          rotation: 0,
        },
      ],
      textTrack: [
        {
          id: "caption-1",
          text: "Never give up on your dreams!",
          start: 1.0,
          end: 4.0,
          stylePreset: "hormozi_bold",
          fontSize: 48,
          textColor: "#ffffff",
          highlightColor: "#eab308",
          position: { x: 50, y: 75 },
          scale: 1.2,
          rotation: 0,
        },
      ],
      graphicsTrack: [
        {
          id: "graphic-1",
          name: "KPI Counter",
          compositionId: "animated_kpi",
          props: { value: 99, label: "Efficiency" },
          start: 2.5,
          end: 6.5,
          position: { x: 30, y: 40 },
          scale: 1.0,
          rotation: 0,
          opacity: 100,
          isUserLocked: true,
          constraints: ["constraint-1"],
        },
      ],
      audioTrack: [
        {
          id: "audio-1",
          sourceUrl: "https://assets.example.com/bgm.mp3",
          name: "Upbeat Lo-Fi",
          start: 0,
          end: 10,
          volume: 50,
          fadeIn: 0.5,
          fadeOut: 1.0,
          isBgm: true,
        },
      ],
    },
    constraints: [
      {
        id: "constraint-1",
        sourceElementId: "graphic-1",
        type: "align_relative",
        targetId: "caption-1",
        relation: "above",
        gap: 20,
        strength: "required",
      },
    ],
    safeZones: [
      {
        id: "zone-speaker",
        timestamp: 0,
        duration: 10,
        x: 25,
        y: 20,
        width: 50,
        height: 40,
        confidence: 0.95,
        type: "restricted",
      },
    ],
  };

  it("converts all 5 tracks into SceneDefinition with appropriate Remotion frames and canvas pixels", () => {
    const scene = timelineProjectToSceneDefinition(sampleProject);

    expect(scene.id).toBe("proj-123");
    expect(scene.durationInFrames).toBe(300); // 10s * 30fps

    // Total elements: 1 video + 1 broll + 1 caption + 1 graphic = 4 elements
    expect(scene.elements.length).toBe(4);

    // Video element
    const videoElem = scene.elements.find((e) => e.id === "vid-1");
    expect(videoElem).toBeDefined();
    expect(videoElem?.type).toBe("video");
    expect(videoElem?.layer).toBe(0);
    expect(videoElem?.timing?.startFrame).toBe(0);
    expect(videoElem?.timing?.durationInFrames).toBe(180); // 6s * 30
    expect(videoElem?.placement?.position).toEqual({ x: 540, y: 960 }); // 50%, 50% on 1080x1920

    // B-Roll element
    const brollElem = scene.elements.find((e) => e.id === "broll-1");
    expect(brollElem).toBeDefined();
    expect(brollElem?.layer).toBe(10);
    expect(brollElem?.timing?.startFrame).toBe(60); // 2s * 30
    expect(brollElem?.timing?.durationInFrames).toBe(90); // 3s * 30
    expect(brollElem?.videoConfig?.fit).toBe("cover");
    expect(brollElem?.videoConfig?.opacity).toBe(0.9);

    // Caption element
    const captionElem = scene.elements.find((e) => e.id === "caption-1");
    expect(captionElem).toBeDefined();
    expect(captionElem?.type).toBe("caption");
    expect(captionElem?.layer).toBe(20);
    expect(captionElem?.textContent).toBe("Never give up on your dreams!");
    expect(captionElem?.placement?.position).toEqual({ x: 540, y: 1440 }); // 50%, 75% on 1080x1920

    // Graphic element
    const graphicElem = scene.elements.find((e) => e.id === "graphic-1");
    expect(graphicElem).toBeDefined();
    expect(graphicElem?.type).toBe("asset");
    expect(graphicElem?.assetId).toBe("animated_kpi");
    expect(graphicElem?.layer).toBe(30);
    expect(graphicElem?.timing?.startFrame).toBe(75); // 2.5s * 30
    expect(graphicElem?.timing?.durationInFrames).toBe(120); // 4s * 30
    expect(graphicElem?.placement?.position).toEqual({ x: 324, y: 768 }); // 30% of 1080, 40% of 1920

    // Audio
    expect(scene.audio?.length).toBe(1);
    expect(scene.audio?.[0].type).toBe("music");
    expect(scene.audio?.[0].volume).toBe(0.5);
    expect(scene.audio?.[0].fadeInFrames).toBe(15); // 0.5s * 30
    expect(scene.audio?.[0].fadeOutFrames).toBe(30); // 1.0s * 30

    // Constraints / Relationships
    expect(scene.relationships?.length).toBe(1);
    expect(scene.relationships?.[0].sourceId).toBe("graphic-1");
    expect(scene.relationships?.[0].targetId).toBe("caption-1");
    expect(scene.relationships?.[0].relation).toBe("above");
    expect(scene.relationships?.[0].gap).toBe(20);

    // Safe Zones
    expect(scene.safeZones?.length).toBe(1);
    expect(scene.safeZones?.[0].id).toBe("zone-speaker");
    expect(scene.safeZones?.[0].type).toBe("restricted");
    expect(scene.safeZones?.[0].x).toBe(270); // 25% of 1080
    expect(scene.safeZones?.[0].y).toBe(384); // 20% of 1920
    expect(scene.safeZones?.[0].width).toBe(540); // 50% of 1080
    expect(scene.safeZones?.[0].height).toBe(768); // 40% of 1920
  });

  it("handles empty tracks cleanly without crashing", () => {
    const emptyProj: TimelineProject = {
      id: "empty-proj",
      title: "Empty",
      aspectRatio: "16:9",
      duration: 5,
      fps: 30,
      tracks: {
        videoTrack: [],
        brollTrack: [],
        textTrack: [],
        audioTrack: [],
        graphicsTrack: [],
      },
    };

    const scene = timelineProjectToSceneDefinition(emptyProj);
    expect(scene.elements).toEqual([]);
    expect(scene.audio).toEqual([]);
    expect(scene.relationships).toBeUndefined();
    expect(scene.safeZones).toBeUndefined();
    expect(scene.durationInFrames).toBe(150);
  });
});

describe("project-adapter: Lossless Bidirectional Round-Trip", () => {
  it("preserves element timing, geometry, styles, and metadata across a full round-trip conversion", () => {
    const original: TimelineProject = {
      id: "roundtrip-project",
      title: "Roundtrip Test",
      aspectRatio: "9:16",
      duration: 12.0,
      fps: 30,
      tracks: {
        videoTrack: [
          {
            id: "vid-main",
            sourceUrl: "https://example.com/video.mp4",
            name: "Main Camera Clip",
            start: 0,
            end: 8.0,
            sourceStart: 0,
            sourceEnd: 8.0,
            speed: 1.0,
            volume: 100,
            zoomFactor: 1.0,
            position: { x: 50, y: 50 },
            positionX: 50,
            positionY: 50,
            scale: 1.0,
            rotation: 0,
          },
        ],
        brollTrack: [
          {
            id: "broll-cut",
            sourceUrl: "https://example.com/broll.mp4",
            name: "B-Roll Cut",
            start: 3.0,
            end: 7.0,
            opacity: 85,
            fitMode: "cover",
            position: { x: 50, y: 50 },
            positionX: 50,
            positionY: 50,
            scale: 1.0,
            rotation: 0,
          },
        ],
        textTrack: [
          {
            id: "cap-1",
            text: "Important Callout",
            start: 2.0,
            end: 5.0,
            stylePreset: "tiktok_yellow",
            fontSize: 42,
            textColor: "#ffffff",
            highlightColor: "#facc15",
            position: { x: 50, y: 70 },
            positionX: 50,
            positionY: 70,
            scale: 1.1,
            rotation: 0,
          },
        ],
        graphicsTrack: [
          {
            id: "graphic-card",
            name: "Stat Box",
            compositionId: "hero_reveal",
            props: { title: "Growth", value: "+300%" },
            start: 4.0,
            end: 9.0,
            position: { x: 20, y: 30 },
            positionX: 20,
            positionY: 30,
            scale: 1.0,
            rotation: 0,
            opacity: 100,
            isUserLocked: true,
            constraints: ["rel-1"],
          },
        ],
        audioTrack: [
          {
            id: "audio-track-1",
            sourceUrl: "https://example.com/soundtrack.mp3",
            name: "Upbeat Track",
            start: 0,
            end: 12.0,
            volume: 75,
            fadeIn: 1.0,
            fadeOut: 1.5,
            isBgm: true,
          },
        ],
      },
      constraints: [
        {
          id: "rel-1",
          sourceElementId: "graphic-card",
          type: "align_relative",
          targetId: "cap-1",
          relation: "above",
          gap: 15,
          strength: "preferred",
        },
      ],
      safeZones: [
        {
          id: "safe-zone-1",
          timestamp: 0,
          duration: 12.0,
          x: 10,
          y: 10,
          width: 80,
          height: 80,
          confidence: 1.0,
          type: "safe",
        },
      ],
    };

    // 1. Forward conversion
    const scene = timelineProjectToSceneDefinition(original);

    // 2. Reverse conversion
    const reconstructed = sceneDefinitionToTimelineProject(scene, {
      fps: original.fps,
      aspectRatio: original.aspectRatio,
    });

    // Verify Project metadata
    expect(reconstructed.id).toBe(original.id);
    expect(reconstructed.duration).toBe(original.duration);
    expect(reconstructed.fps).toBe(original.fps);
    expect(reconstructed.aspectRatio).toBe(original.aspectRatio);

    // Verify Video Track
    expect(reconstructed.tracks.videoTrack.length).toBe(1);
    const revVid = reconstructed.tracks.videoTrack[0];
    expect(revVid.id).toBe("vid-main");
    expect(revVid.start).toBe(0);
    expect(revVid.end).toBe(8.0);
    expect(revVid.volume).toBe(100);
    expect(revVid.position?.x).toBe(50);
    expect(revVid.position?.y).toBe(50);

    // Verify B-Roll Track
    expect(reconstructed.tracks.brollTrack.length).toBe(1);
    const revBRoll = reconstructed.tracks.brollTrack[0];
    expect(revBRoll.id).toBe("broll-cut");
    expect(revBRoll.start).toBe(3.0);
    expect(revBRoll.end).toBe(7.0);
    expect(revBRoll.opacity).toBe(85);
    expect(revBRoll.fitMode).toBe("cover");

    // Verify Text Track
    expect(reconstructed.tracks.textTrack.length).toBe(1);
    const revCap = reconstructed.tracks.textTrack[0];
    expect(revCap.id).toBe("cap-1");
    expect(revCap.text).toBe("Important Callout");
    expect(revCap.start).toBe(2.0);
    expect(revCap.end).toBe(5.0);
    expect(revCap.stylePreset).toBe("tiktok_yellow");
    expect(revCap.fontSize).toBe(42);
    expect(revCap.position?.x).toBe(50);
    expect(revCap.position?.y).toBe(70);

    // Verify Graphics Track
    expect(reconstructed.tracks.graphicsTrack?.length).toBe(1);
    const revGraphic = reconstructed.tracks.graphicsTrack![0];
    expect(revGraphic.id).toBe("graphic-card");
    expect(revGraphic.compositionId).toBe("hero_reveal");
    expect(revGraphic.props).toEqual({ title: "Growth", value: "+300%" });
    expect(revGraphic.start).toBe(4.0);
    expect(revGraphic.end).toBe(9.0);
    expect(revGraphic.isUserLocked).toBe(true);
    expect(revGraphic.position?.x).toBe(20);
    expect(revGraphic.position?.y).toBe(30);

    // Verify Audio Track
    expect(reconstructed.tracks.audioTrack.length).toBe(1);
    const revAudio = reconstructed.tracks.audioTrack[0];
    expect(revAudio.id).toBe("audio-track-1");
    expect(revAudio.start).toBe(0);
    expect(revAudio.end).toBe(12.0);
    expect(revAudio.volume).toBe(75);
    expect(revAudio.fadeIn).toBe(1.0);
    expect(revAudio.fadeOut).toBe(1.5);
    expect(revAudio.isBgm).toBe(true);

    // Verify Constraints
    expect(reconstructed.constraints?.length).toBe(1);
    expect(reconstructed.constraints?.[0].sourceElementId).toBe("graphic-card");
    expect(reconstructed.constraints?.[0].targetId).toBe("cap-1");
    expect(reconstructed.constraints?.[0].relation).toBe("above");
    expect(reconstructed.constraints?.[0].strength).toBe("preferred");

    // Verify Safe Zones
    expect(reconstructed.safeZones?.length).toBe(1);
    expect(reconstructed.safeZones?.[0].type).toBe("safe");
    expect(reconstructed.safeZones?.[0].x).toBe(10);
    expect(reconstructed.safeZones?.[0].y).toBe(10);
    expect(reconstructed.safeZones?.[0].width).toBe(80);
    expect(reconstructed.safeZones?.[0].height).toBe(80);
  });
});
