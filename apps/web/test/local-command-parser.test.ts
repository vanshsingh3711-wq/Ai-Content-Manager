import { describe, it, expect } from "vitest";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { assembleEditorContext, EditorContext } from "../lib/ai/editor-context";
import { TimelineProject } from "../lib/timeline-types";

const mockProject: TimelineProject = {
  id: "test-proj",
  title: "AI Video",
  aspectRatio: "9:16",
  duration: 10.0,
  fps: 30,
  tracks: {
    videoTrack: [
      {
        id: "v1",
        sourceUrl: "https://example.com/v1.mp4",
        name: "Main Video",
        start: 0,
        end: 10.0,
        sourceStart: 0,
        sourceEnd: 10.0,
        speed: 1,
        volume: 100,
        zoomFactor: 1.0,
        position: { x: 50, y: 50 },
        scale: 1.0,
      },
    ],
    brollTrack: [],
    textTrack: [
      {
        id: "c1",
        text: "Sample Caption",
        start: 1.0,
        end: 4.0,
        stylePreset: "tiktok_yellow",
        position: { x: 50, y: 75 },
        positionX: 50,
        positionY: 75,
        scale: 1.0,
      },
    ],
    graphicsTrack: [
      {
        id: "g1",
        name: "Stats",
        compositionId: "animated_kpi",
        props: {},
        start: 2.0,
        end: 6.0,
        position: { x: 40, y: 30 },
        positionX: 40,
        positionY: 30,
        scale: 1.0,
        isUserLocked: false,
      },
    ],
    audioTrack: [],
  },
};

describe("local-command-parser: Natural Language Intent Parsing", () => {
  it("parses 'Add a title that says Welcome' into an add_element caption operation", () => {
    const context = assembleEditorContext(mockProject, 2.0, null);
    const result = parseLocalCommand("Add a title that says Welcome", context);

    expect(result.matched).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.operation?.type).toBe("add_element");

    const op = result.operation as any;
    expect(op.track).toBe("caption");
    expect(op.element.text).toBe("Welcome");
    expect(op.element.start).toBe(2.0);
    expect(op.element.stylePreset).toBe("tiktok_yellow");
  });

  it("parses quoted title command 'Add title \"Hello World\"'", () => {
    const context = assembleEditorContext(mockProject, 0, null);
    const result = parseLocalCommand('Add title "Hello World"', context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("add_element");
    const op = result.operation as any;
    expect(op.element.text).toBe("Hello World");
  });

  it("prompts user to select an element when 'Make the selected element bigger' is called without selection", () => {
    const context = assembleEditorContext(mockProject, 2.0, null);
    const result = parseLocalCommand("Make the selected element bigger", context);

    expect(result.matched).toBe(true);
    expect(result.error).toBe("Please select an element first.");
    expect(result.operation).toBeUndefined();
  });

  it("parses 'Make bigger' when an element is selected and increases its scale", () => {
    const context = assembleEditorContext(mockProject, 2.0, { type: "caption", id: "c1" });
    const result = parseLocalCommand("Make bigger", context);

    expect(result.matched).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.operation?.type).toBe("resize_element");

    const op = result.operation as any;
    expect(op.targetId).toBe("c1");
    expect(op.targetType).toBe("caption");
    expect(op.scale).toBe(1.25); // 1.0 * 1.25
  });

  it("parses 'Make smaller' when an element is selected and decreases its scale", () => {
    const context = assembleEditorContext(mockProject, 2.0, { type: "caption", id: "c1" });
    const result = parseLocalCommand("Make smaller", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("resize_element");

    const op = result.operation as any;
    expect(op.targetId).toBe("c1");
    expect(op.scale).toBe(0.8); // 1.0 * 0.8
  });

  it("prompts user when directional move is called without selection", () => {
    const context = assembleEditorContext(mockProject, 1.0, null);
    const result = parseLocalCommand("Move the selected element to the right", context);

    expect(result.matched).toBe(true);
    expect(result.error).toBe("Please select an element first.");
    expect(result.operation).toBeUndefined();
  });

  it("parses 'Move the selected element to the right' and updates coordinates with isUserLocked=true", () => {
    // Caption c1 is at { x: 50, y: 75 }
    const context = assembleEditorContext(mockProject, 1.0, { type: "caption", id: "c1" });
    const result = parseLocalCommand("Move the selected element to the right", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("move_element");

    const op = result.operation as any;
    expect(op.targetId).toBe("c1");
    expect(op.position).toEqual({ x: 60, y: 75 });
    expect(op.isUserLocked).toBe(true);
  });

  it("parses 'Move left', 'Move up', 'Move down', and 'Center it'", () => {
    const context = assembleEditorContext(mockProject, 2.0, { type: "graphic", id: "g1" });
    // g1 is at { x: 40, y: 30 }

    const moveLeft = parseLocalCommand("Move left", context);
    expect((moveLeft.operation as any).position).toEqual({ x: 30, y: 30 });

    const moveUp = parseLocalCommand("Move up", context);
    expect((moveUp.operation as any).position).toEqual({ x: 40, y: 20 });

    const moveDown = parseLocalCommand("Move down", context);
    expect((moveDown.operation as any).position).toEqual({ x: 40, y: 40 });

    const moveCenter = parseLocalCommand("Center it", context);
    expect((moveCenter.operation as any).position).toEqual({ x: 50, y: 50 });
  });

  it("parses 'Split clip' at playhead time", () => {
    const context = assembleEditorContext(mockProject, 3.5, { type: "video", id: "v1" });
    const result = parseLocalCommand("Split clip", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("split_clip");

    const op = result.operation as any;
    expect(op.targetId).toBe("v1");
    expect(op.targetType).toBe("video");
    expect(op.splitTime).toBe(3.5);
  });

  it("parses 'Delete selected element'", () => {
    const context = assembleEditorContext(mockProject, 2.0, { type: "graphic", id: "g1" });
    const result = parseLocalCommand("Delete selected element", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("delete_element");

    const op = result.operation as any;
    expect(op.targetId).toBe("g1");
    expect(op.targetType).toBe("graphic");
  });

  it("parses 'Add counter' into an add_element graphic operation", () => {
    const context = assembleEditorContext(mockProject, 1.5, null);
    const result = parseLocalCommand("Add counter", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("add_element");

    const op = result.operation as any;
    expect(op.track).toBe("graphic");
    expect(op.element.compositionId).toBe("animated_counter");
    expect(op.element.start).toBe(1.5);
  });

  it("parses 'add motion graphics for a rising graphs animation' into chart-reveal with props", () => {
    const context = assembleEditorContext(mockProject, 2.5, null);
    const result = parseLocalCommand("add motion graphics for a rising graphs animation", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("add_element");

    const op = result.operation as any;
    expect(op.track).toBe("graphic");
    expect(op.element.compositionId).toBe("chart-reveal");
    expect(op.element.name).toBe("RISING GRAPH");
    expect(op.element.start).toBe(2.5);
    expect(op.element.props.title).toBe("GROWTH TREND");
    expect(op.element.props.dataPoint1).toBe("Stage 1: Baseline");
  });

  it("parses 'add terminal' into cooked-terminal", () => {
    const context = assembleEditorContext(mockProject, 3.0, null);
    const result = parseLocalCommand("add terminal", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("add_element");
    const op = result.operation as any;
    expect(op.track).toBe("graphic");
    expect(op.element.compositionId).toBe("cooked-terminal");
    expect(op.element.props.command).toBe("npm run deploy");
  });

  it("handles punctuation cleanly when adding title (e.g. 'Add a title that says Welcome.')", () => {
    const context = assembleEditorContext(mockProject, 0, null);
    const result = parseLocalCommand("Add a title that says Welcome.", context);

    expect(result.matched).toBe(true);
    expect(result.operation?.type).toBe("add_element");
    const op = result.operation as any;
    expect(op.element.text).toBe("Welcome");
  });

  it("prompts user with exact message when deleting without selection", () => {
    const context = assembleEditorContext(mockProject, 2.0, null);
    const result = parseLocalCommand("Delete selected element", context);

    expect(result.matched).toBe(true);
    expect(result.error).toBe("Please select an element first.");
    expect(result.operation).toBeUndefined();
  });

  it("marks complex semantic requests as candidates for Tier-2 Cloud Copilot", () => {
    const context = assembleEditorContext(mockProject, 1.0, null);
    const result = parseLocalCommand(
      "Find the part where I discuss AI and add a futuristic stat card",
      context
    );

    expect(result.matched).toBe(false);
    expect(result.isCloudCandidate).toBe(true);
    expect(result.operation).toBeUndefined();
  });
});
