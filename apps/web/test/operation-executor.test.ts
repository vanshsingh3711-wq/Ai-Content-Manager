import { describe, it, expect, beforeEach } from "vitest";
import {
  validateOperation,
  safeValidateOperation,
  createInverseOperation,
  executeOperation,
} from "../lib/operations/operation-executor";
import { EditOperation } from "../lib/operations/operation-types";
import { TimelineProject } from "../lib/timeline-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";

const createBaseProject = (): TimelineProject => ({
  id: "test-project-1",
  title: "Test Operations Project",
  aspectRatio: "9:16",
  duration: 15.0,
  fps: 30,
  tracks: {
    videoTrack: [
      {
        id: "v1",
        sourceUrl: "https://example.com/v1.mp4",
        name: "Clip 1",
        start: 0,
        end: 5.0,
        sourceStart: 0,
        sourceEnd: 5.0,
        speed: 1,
        volume: 100,
        zoomFactor: 1.0,
        position: { x: 50, y: 50 },
        scale: 1.0,
        rotation: 0,
      },
      {
        id: "v2",
        sourceUrl: "https://example.com/v2.mp4",
        name: "Clip 2",
        start: 5.0,
        end: 12.0,
        sourceStart: 0,
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
        id: "b1",
        sourceUrl: "https://example.com/broll.mp4",
        name: "B-Roll Cut",
        start: 2.0,
        end: 6.0,
        opacity: 80,
        fitMode: "cover",
        position: { x: 50, y: 50 },
        scale: 1.0,
        rotation: 0,
      },
    ],
    textTrack: [
      {
        id: "c1",
        text: "Initial Caption",
        start: 1.0,
        end: 4.0,
        stylePreset: "tiktok_yellow",
        fontSize: 40,
        position: { x: 50, y: 75 },
        scale: 1.0,
      },
    ],
    graphicsTrack: [
      {
        id: "g1",
        name: "Stat Card",
        compositionId: "hero_reveal",
        props: { title: "MRR", value: "$10k" },
        start: 3.0,
        end: 7.0,
        position: { x: 30, y: 40 },
        scale: 1.0,
        isUserLocked: false,
      },
    ],
    audioTrack: [
      {
        id: "a1",
        sourceUrl: "https://example.com/bgm.mp3",
        name: "BGM",
        start: 0,
        end: 15.0,
        volume: 70,
        fadeIn: 0.5,
        fadeOut: 0.5,
        isBgm: true,
      },
    ],
  },
  constraints: [],
  safeZones: [],
});

describe("operation-types: Schema Validation for all 9 Operations", () => {
  it("validates add_element schema", () => {
    const op = {
      type: "add_element",
      track: "caption",
      element: { id: "c2", text: "New Caption", start: 5, end: 8 },
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates update_properties schema", () => {
    const op = {
      type: "update_properties",
      targetId: "c1",
      targetType: "caption",
      properties: { text: "Updated text", fontSize: 52 },
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates move_element schema", () => {
    const op = {
      type: "move_element",
      targetId: "g1",
      targetType: "graphic",
      position: { x: 75, y: 25 },
      isUserLocked: true,
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates resize_element schema", () => {
    const op = {
      type: "resize_element",
      targetId: "g1",
      targetType: "graphic",
      scale: 1.5,
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates set_timing schema", () => {
    const op = {
      type: "set_timing",
      targetId: "b1",
      targetType: "broll",
      start: 3.5,
      end: 8.0,
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates split_clip schema", () => {
    const op = {
      type: "split_clip",
      targetId: "v1",
      targetType: "video",
      splitTime: 2.5,
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates delete_element schema", () => {
    const op = {
      type: "delete_element",
      targetId: "b1",
      targetType: "broll",
      ripple: false,
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates add_constraint schema", () => {
    const op = {
      type: "add_constraint",
      constraint: {
        id: "rel-1",
        sourceElementId: "g1",
        type: "align_relative",
        targetId: "c1",
        relation: "above",
        gap: 15,
        strength: "required",
      },
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("validates batch schema", () => {
    const op = {
      type: "batch",
      description: "Batch update",
      operations: [
        {
          type: "move_element",
          targetId: "g1",
          targetType: "graphic",
          position: { x: 50, y: 50 },
        },
        {
          type: "resize_element",
          targetId: "g1",
          targetType: "graphic",
          scale: 1.2,
        },
      ],
    };
    expect(safeValidateOperation(op).success).toBe(true);
  });

  it("rejects invalid operations with invalid types or negative coordinates", () => {
    expect(safeValidateOperation({ type: "unknown_op" }).success).toBe(false);
    expect(
      safeValidateOperation({
        type: "move_element",
        targetId: "g1",
        targetType: "graphic",
        position: { x: -10, y: 50 }, // negative position
      }).success
    ).toBe(false);
    expect(
      safeValidateOperation({
        type: "set_timing",
        targetId: "g1",
        targetType: "graphic",
        start: -1, // negative start time
        end: 5,
      }).success
    ).toBe(false);
  });
});

describe("operation-executor: Atomic Execution & Inverse Verification", () => {
  let project: TimelineProject;

  beforeEach(() => {
    project = createBaseProject();
  });

  it("executes add_element and inverts it cleanly", () => {
    const op: EditOperation = {
      type: "add_element",
      track: "graphic",
      element: {
        id: "g2",
        name: "Arrow Callout",
        compositionId: "animated_arrow",
        props: {},
        start: 5.0,
        end: 9.0,
        position: { x: 60, y: 60 },
      },
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.graphicsTrack?.length).toBe(2);
    expect(nextProject.tracks.graphicsTrack?.[1].id).toBe("g2");

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.graphicsTrack?.length).toBe(1);
    expect(reverted.tracks.graphicsTrack?.[0].id).toBe("g1");
  });

  it("executes add_element on broll and sets volume to 0 and muted to true to preserve narration", () => {
    const op: EditOperation = {
      type: "add_element",
      track: "broll",
      element: {
        id: "b-new",
        name: "Coding B-Roll",
        src: "https://example.com/coding.mp4",
        start: 30.0,
        end: 35.0,
        opacity: 100,
        fitMode: "cover",
      },
    };

    const { nextProject, inverse } = executeOperation(project, op);
    const addedBroll = nextProject.tracks.brollTrack.find((b) => b.id === "b-new");
    expect(addedBroll).toBeDefined();
    expect(addedBroll?.volume).toBe(0);
    expect(addedBroll?.muted).toBe(true);
    expect(addedBroll?.sourceUrl).toBe("https://example.com/coding.mp4");

    // Inverse execution cleanly removes the broll
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.brollTrack.find((b) => b.id === "b-new")).toBeUndefined();
  });

  it("executes update_properties and inverts it cleanly", () => {
    const op: EditOperation = {
      type: "update_properties",
      targetId: "c1",
      targetType: "caption",
      properties: { text: "Brand New Text", fontSize: 60 },
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.textTrack[0].text).toBe("Brand New Text");
    expect(nextProject.tracks.textTrack[0].fontSize).toBe(60);

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.textTrack[0].text).toBe("Initial Caption");
    expect(reverted.tracks.textTrack[0].fontSize).toBe(40);
  });

  it("executes move_element and locks position, then inverts cleanly", () => {
    const op: EditOperation = {
      type: "move_element",
      targetId: "g1",
      targetType: "graphic",
      position: { x: 80, y: 20 },
      isUserLocked: true,
    };

    const { nextProject, inverse } = executeOperation(project, op);
    const updatedGraphic = nextProject.tracks.graphicsTrack![0];
    expect(updatedGraphic.position).toEqual({ x: 80, y: 20 });
    expect(updatedGraphic.isUserLocked).toBe(true);

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    const restoredGraphic = reverted.tracks.graphicsTrack![0];
    expect(restoredGraphic.position).toEqual({ x: 30, y: 40 });
    expect(restoredGraphic.isUserLocked).toBe(false);
  });

  it("executes resize_element and inverts cleanly", () => {
    const op: EditOperation = {
      type: "resize_element",
      targetId: "g1",
      targetType: "graphic",
      scale: 1.8,
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.graphicsTrack![0].scale).toBe(1.8);

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.graphicsTrack![0].scale).toBe(1.0);
  });

  it("executes set_timing and inverts cleanly", () => {
    const op: EditOperation = {
      type: "set_timing",
      targetId: "b1",
      targetType: "broll",
      start: 4.0,
      end: 10.0,
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.brollTrack[0].start).toBe(4.0);
    expect(nextProject.tracks.brollTrack[0].end).toBe(10.0);

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.brollTrack[0].start).toBe(2.0);
    expect(reverted.tracks.brollTrack[0].end).toBe(6.0);
  });

  it("executes split_clip and inverts cleanly back to the single clip", () => {
    const op: EditOperation = {
      type: "split_clip",
      targetId: "v1",
      targetType: "video",
      splitTime: 2.0,
      newClipAId: "v1-left",
      newClipBId: "v1-right",
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.videoTrack.length).toBe(3); // v1 split into 2 + v2 = 3
    expect(nextProject.tracks.videoTrack[0].id).toBe("v1-left");
    expect(nextProject.tracks.videoTrack[0].end).toBe(2.0);
    expect(nextProject.tracks.videoTrack[1].id).toBe("v1-right");
    expect(nextProject.tracks.videoTrack[1].start).toBe(2.0);

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.videoTrack.length).toBe(2);
    expect(reverted.tracks.videoTrack[0].id).toBe("v1");
    expect(reverted.tracks.videoTrack[0].start).toBe(0);
    expect(reverted.tracks.videoTrack[0].end).toBe(5.0);
  });

  it("executes delete_element and inverts cleanly", () => {
    const op: EditOperation = {
      type: "delete_element",
      targetId: "b1",
      targetType: "broll",
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.brollTrack.length).toBe(0);

    // Inverse execution restores the deleted clip at original position
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.brollTrack.length).toBe(1);
    expect(reverted.tracks.brollTrack[0].id).toBe("b1");
    expect(reverted.tracks.brollTrack[0].start).toBe(2.0);
    expect(reverted.tracks.brollTrack[0].end).toBe(6.0);
  });

  it("executes delete_element with ripple and restores subsequent clip timings on inverse", () => {
    const op: EditOperation = {
      type: "delete_element",
      targetId: "v1",
      targetType: "video",
      ripple: true,
    };

    // v1 was 0 to 5.0 (duration 5s). v2 was 5.0 to 12.0.
    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.tracks.videoTrack.length).toBe(1);
    expect(nextProject.tracks.videoTrack[0].id).toBe("v2");
    // v2 should be shifted back by 5s -> start at 0, end at 7
    expect(nextProject.tracks.videoTrack[0].start).toBe(0);
    expect(nextProject.tracks.videoTrack[0].end).toBe(7.0);

    // Inverse restores v1 and shifts v2 back forward
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.videoTrack.length).toBe(2);
    expect(reverted.tracks.videoTrack[0].id).toBe("v1");
    expect(reverted.tracks.videoTrack[0].start).toBe(0);
    expect(reverted.tracks.videoTrack[0].end).toBe(5.0);
    expect(reverted.tracks.videoTrack[1].id).toBe("v2");
    expect(reverted.tracks.videoTrack[1].start).toBe(5.0);
    expect(reverted.tracks.videoTrack[1].end).toBe(12.0);
  });

  it("executes add_constraint and inverts cleanly", () => {
    const op: EditOperation = {
      type: "add_constraint",
      constraint: {
        id: "c-rel-1",
        sourceElementId: "g1",
        type: "align_relative",
        targetId: "c1",
        relation: "above",
        strength: "required",
      },
    };

    const { nextProject, inverse } = executeOperation(project, op);
    expect(nextProject.constraints?.length).toBe(1);
    expect(nextProject.constraints?.[0].id).toBe("c-rel-1");

    // Inverse execution
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.constraints?.length).toBe(0);
  });

  it("executes batch operations and produces an atomic reversed inverse", () => {
    const batchOp: EditOperation = {
      type: "batch",
      description: "Reposition and style caption and graphic",
      operations: [
        {
          type: "move_element",
          targetId: "g1",
          targetType: "graphic",
          position: { x: 70, y: 30 },
        },
        {
          type: "resize_element",
          targetId: "g1",
          targetType: "graphic",
          scale: 1.4,
        },
        {
          type: "update_properties",
          targetId: "c1",
          targetType: "caption",
          properties: { text: "Batch modified text" },
        },
      ],
    };

    const { nextProject, inverse } = executeOperation(project, batchOp);
    expect(nextProject.tracks.graphicsTrack![0].position?.x).toBe(70);
    expect(nextProject.tracks.graphicsTrack![0].scale).toBe(1.4);
    expect(nextProject.tracks.textTrack[0].text).toBe("Batch modified text");

    // Execute inverse batch
    const reverted = executeOperation(nextProject, inverse).nextProject;
    expect(reverted.tracks.graphicsTrack![0].position?.x).toBe(30);
    expect(reverted.tracks.graphicsTrack![0].scale).toBe(1.0);
    expect(reverted.tracks.textTrack[0].text).toBe("Initial Caption");
  });
});

describe("operation-bus: Zustand Store Integration", () => {
  beforeEach(() => {
    useTimelineStore.getState().initProject(createBaseProject());
  });

  it("dispatches operations via dispatchOperation and supports undo/redo", () => {
    const store = useTimelineStore.getState();

    // 1. Dispatch move_element
    store.dispatchOperation({
      type: "move_element",
      targetId: "g1",
      targetType: "graphic",
      position: { x: 90, y: 10 },
      isUserLocked: true,
    });

    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].position).toEqual({
      x: 90,
      y: 10,
    });

    // 2. Undo
    useTimelineStore.getState().undo();
    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].position).toEqual({
      x: 30,
      y: 40,
    });

    // 3. Redo
    useTimelineStore.getState().redo();
    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].position).toEqual({
      x: 90,
      y: 10,
    });
  });

  it("dispatches atomic batch operations and reverses everything in a single undo step", () => {
    const store = useTimelineStore.getState();

    store.dispatchBatch(
      [
        {
          type: "update_properties",
          targetId: "c1",
          targetType: "caption",
          properties: { text: "Step 1 text" },
        },
        {
          type: "resize_element",
          targetId: "g1",
          targetType: "graphic",
          scale: 2.0,
        },
      ],
      "Batch modification"
    );

    expect(useTimelineStore.getState().project.tracks.textTrack[0].text).toBe("Step 1 text");
    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].scale).toBe(2.0);

    // Single undo reverses both operations
    useTimelineStore.getState().undo();
    expect(useTimelineStore.getState().project.tracks.textTrack[0].text).toBe("Initial Caption");
    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].scale).toBe(1.0);

    // Redo restores both operations
    useTimelineStore.getState().redo();
    expect(useTimelineStore.getState().project.tracks.textTrack[0].text).toBe("Step 1 text");
    expect(useTimelineStore.getState().project.tracks.graphicsTrack![0].scale).toBe(2.0);
  });
});
