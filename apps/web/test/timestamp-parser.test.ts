import { describe, it, expect } from "vitest";
import {
  parseFlexibleTimestamp,
  extractTimeRangeFromPrompt,
  parseLocalCommand,
} from "../lib/ai/local-command-parser";
import { EditorContext } from "../lib/ai/editor-context";
import { TimelineProject } from "../lib/timeline-types";

const mockProject: TimelineProject = {
  id: "test-proj",
  title: "AI Video",
  aspectRatio: "9:16",
  duration: 120.0,
  fps: 30,
  tracks: {
    videoTrack: [
      {
        id: "v1",
        sourceUrl: "https://example.com/v1.mp4",
        name: "Main Video",
        start: 0,
        end: 120.0,
        sourceStart: 0,
        sourceEnd: 120.0,
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
};

const baseContext: EditorContext = {
  playheadTime: 0.0,
  duration: 120.0,
  fps: 30,
  aspectRatio: "9:16",
  selectedItem: null,
  activeElements: {
    activeVideo: mockProject.tracks.videoTrack[0],
    activeBroll: null,
    activeCaptions: [],
    activeGraphics: [],
    activeAudio: [],
  },
  transcriptWords: [
    { word: "welcome", start: 1.2, end: 1.8, confidence: 0.95 },
    { word: "to", start: 1.85, end: 2.0, confidence: 0.95 },
    { word: "our", start: 2.05, end: 2.2, confidence: 0.95 },
    { word: "product", start: 2.25, end: 2.8, confidence: 0.95 },
  ],
  scriptBeats: [],
  safeZones: [],
};

describe("parseFlexibleTimestamp utility", () => {
  it("parses MM:SS format into floating-point seconds", () => {
    expect(parseFlexibleTimestamp("01:23")).toBe(83.0);
    expect(parseFlexibleTimestamp("00:05")).toBe(5.0);
    expect(parseFlexibleTimestamp("02:00")).toBe(120.0);
    expect(parseFlexibleTimestamp("01:23.5")).toBe(83.5);
  });

  it("parses SMPTE timecode (MM:SS:FF) with rational fps frame fraction", () => {
    // 01 min (60s) + 23s + 15 frames / 30fps = 83.5s
    expect(parseFlexibleTimestamp("01:23:15", 30)).toBe(83.5);
    expect(parseFlexibleTimestamp("00:02:15", 30)).toBe(2.5);
    expect(parseFlexibleTimestamp("00:01:00", 30)).toBe(1.0);
  });

  it("parses SMPTE timecode 4-segment (HH:MM:SS:FF)", () => {
    // 1h (3600s) + 2m (120s) + 3s + 15 frames / 30fps = 3723.5s
    expect(parseFlexibleTimestamp("01:02:03:15", 30)).toBe(3723.5);
  });

  it("parses raw seconds notation", () => {
    expect(parseFlexibleTimestamp("14s")).toBe(14.0);
    expect(parseFlexibleTimestamp("14.5 seconds")).toBe(14.5);
    expect(parseFlexibleTimestamp("83")).toBe(83.0);
    expect(parseFlexibleTimestamp("0.75 sec")).toBe(0.75);
  });

  it("throws error on invalid timestamp strings", () => {
    expect(() => parseFlexibleTimestamp("")).toThrow("Empty timestamp string");
    expect(() => parseFlexibleTimestamp("invalid")).toThrow('Invalid timestamp format: "invalid"');
    expect(() => parseFlexibleTimestamp("abc:def")).toThrow();
  });
});

describe("extractTimeRangeFromPrompt utility", () => {
  it("extracts 'from <start> to <end>' patterns", () => {
    const res = extractTimeRangeFromPrompt("Add a title 'Welcome' from 01:20 to 01:25", 30);
    expect(res.error).toBeUndefined();
    expect(res.start).toBe(80.0);
    expect(res.end).toBe(85.0);
    expect(res.isExplicitRange).toBe(true);
    expect(res.cleanedPrompt).toBe("Add a title 'Welcome'");
  });

  it("extracts 'between <start> and <end>' patterns", () => {
    const res = extractTimeRangeFromPrompt("Add title Welcome between 10s and 15s", 30);
    expect(res.error).toBeUndefined();
    expect(res.start).toBe(10.0);
    expect(res.end).toBe(15.0);
    expect(res.isExplicitRange).toBe(true);
    expect(res.cleanedPrompt).toBe("Add title Welcome");
  });

  it("extracts 'at <start> for <duration>' patterns", () => {
    const res = extractTimeRangeFromPrompt("Add caption Hello at 01:20 for 5s", 30);
    expect(res.error).toBeUndefined();
    expect(res.start).toBe(80.0);
    expect(res.end).toBe(85.0);
    expect(res.isExplicitRange).toBe(true);
    expect(res.cleanedPrompt).toBe("Add caption Hello");
  });

  it("extracts point time 'at <time>' for cuts", () => {
    const res = extractTimeRangeFromPrompt("Split clip at 01:23", 30);
    expect(res.error).toBeUndefined();
    expect(res.splitTime).toBe(83.0);
    expect(res.cleanedPrompt).toBe("Split clip");
  });

  it("returns clear error on inverted ranges", () => {
    const res = extractTimeRangeFromPrompt("Add title from 01:25 to 01:20", 30);
    expect(res.error).toContain("must be before end time");
  });
});

describe("parseLocalCommand with explicit time ranges", () => {
  it("parses 'Add a title from 01:20 to 01:25' into an add_element caption operation with start=80 and end=85", () => {
    const res = parseLocalCommand("Add a title from 01:20 to 01:25", baseContext);
    expect(res.matched).toBe(true);
    expect(res.operation).toBeDefined();
    expect(res.operation?.type).toBe("add_element");

    if (res.operation?.type === "add_element") {
      expect(res.operation.track).toBe("caption");
      expect(res.operation.element.start).toBe(80.0);
      expect(res.operation.element.end).toBe(85.0);
    }
  });

  it("parses 'Add a title 'Welcome' from 01:20 to 01:25'", () => {
    const res = parseLocalCommand("Add a title 'Welcome' from 01:20 to 01:25", baseContext);
    expect(res.matched).toBe(true);
    expect(res.operation?.type).toBe("add_element");

    if (res.operation?.type === "add_element") {
      expect((res.operation.element as any).text).toBe("Welcome");
      expect(res.operation.element.start).toBe(80.0);
      expect(res.operation.element.end).toBe(85.0);
    }
  });

  it("parses 'Add counter from 01:00 to 01:05' into an add_element graphic operation with start=60 and end=65", () => {
    const res = parseLocalCommand("Add counter from 01:00 to 01:05", baseContext);
    expect(res.matched).toBe(true);
    expect(res.operation?.type).toBe("add_element");

    if (res.operation?.type === "add_element") {
      expect(res.operation.track).toBe("graphic");
      expect(res.operation.element.start).toBe(60.0);
      expect(res.operation.element.end).toBe(65.0);
      expect((res.operation.element as any).compositionId).toBe("animated_counter");
    }
  });

  it("parses 'Split clip at 00:04' and splits at 4.0s", () => {
    const res = parseLocalCommand("Split clip at 00:04", baseContext);
    expect(res.matched).toBe(true);
    expect(res.operation?.type).toBe("split_clip");
    if (res.operation?.type === "split_clip") {
      expect(res.operation.splitTime).toBe(4.0);
    }
  });

  it("returns error when start time exceeds video duration", () => {
    const res = parseLocalCommand("Add title from 03:00 to 03:10", baseContext);
    expect(res.matched).toBe(true);
    expect(res.error).toContain("exceeds video duration");
  });

  it("returns error when range is inverted", () => {
    const res = parseLocalCommand("Add title from 00:30 to 00:20", baseContext);
    expect(res.matched).toBe(true);
    expect(res.error).toContain("must be before end time");
  });
});
