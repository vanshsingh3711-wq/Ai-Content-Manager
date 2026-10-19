import { describe, it, expect, beforeEach } from "vitest";
import {
  serializeDragPayload,
  deserializeDragPayload,
  projectPointerToCanvasCoordinates,
  projectPointerToTimelineTimestamp,
  createAddElementOperationFromDrop,
  EditorDragPayload,
  EDITOR_DRAG_MIME,
} from "../lib/editor/drag-drop-types";
import { EditOperationSchema } from "../lib/operations/operation-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 6: Drag-and-Drop System", () => {
  const initialProject: TimelineProject = {
    id: "drag-drop-proj",
    title: "Drag Drop Demo",
    aspectRatio: "9:16",
    duration: 15.0,
    fps: 30,
    tracks: {
      videoTrack: [],
      brollTrack: [],
      textTrack: [],
      graphicsTrack: [],
      audioTrack: [],
    },
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setPlayheadTime(0);
    useTimelineStore.getState().setSelectedItem(null);
  });

  describe("Payload Serialization and Deserialization", () => {
    it("round-trips a caption preset drag payload", () => {
      const payload: EditorDragPayload = {
        type: "caption",
        stylePreset: "tiktok_yellow",
        text: "Custom Subtitle",
      };

      const serialized = serializeDragPayload(payload);
      const deserialized = deserializeDragPayload(serialized);
      expect(deserialized).toEqual(payload);
    });

    it("round-trips a graphic card drag payload", () => {
      const payload: EditorDragPayload = {
        type: "graphic",
        compositionId: "animated_counter",
        name: "Stats Counter",
        duration: 4.5,
        props: { startValue: 0, endValue: 100 },
      };

      const serialized = serializeDragPayload(payload);
      const deserialized = deserializeDragPayload(serialized);
      expect(deserialized).toEqual(payload);
    });

    it("round-trips an audio track drag payload", () => {
      const payload: EditorDragPayload = {
        type: "audio",
        name: "Lofi Beat",
        sourceUrl: "https://example.com/audio.mp3",
        duration: 25.0,
        volume: 85,
        isBgm: true,
      };

      const serialized = serializeDragPayload(payload);
      const deserialized = deserializeDragPayload(serialized);
      expect(deserialized).toEqual(payload);
    });

    it("returns null for malformed or unknown drag data", () => {
      expect(deserializeDragPayload("not-json")).toBeNull();
      expect(deserializeDragPayload(JSON.stringify({ type: "unknown_type" }))).toBeNull();
    });
  });

  describe("Coordinate and Time Projection", () => {
    it("projects screen pointer to normalized canvas coordinates with clamping", () => {
      const canvasRect = { left: 100, top: 50, width: 400, height: 600 };

      // Exact center
      const center = projectPointerToCanvasCoordinates(300, 350, canvasRect);
      expect(center).toEqual({ x: 50, y: 50 });

      // Near top-left (clamped to 5% safe boundary)
      const topLeft = projectPointerToCanvasCoordinates(100, 50, canvasRect);
      expect(topLeft.x).toBe(5);
      expect(topLeft.y).toBe(5);

      // Outside bounds (clamped to 95% safe boundary)
      const farRight = projectPointerToCanvasCoordinates(999, 999, canvasRect);
      expect(farRight.x).toBe(95);
      expect(farRight.y).toBe(95);
    });

    it("projects screen pointer clientX to exact timeline timestamp based on zoomLevel and scroll", () => {
      const trackRect = { left: 100, width: 800 };
      const duration = 20.0;
      const zoomLevel = 40; // 40px per second

      // At left edge with 0 scroll: 0s
      const t0 = projectPointerToTimelineTimestamp(100, trackRect, duration, zoomLevel, 0);
      expect(t0).toBe(0);

      // 200px from left edge = 5s (200 / 40)
      const t5 = projectPointerToTimelineTimestamp(300, trackRect, duration, zoomLevel, 0);
      expect(t5).toBe(5.0);

      // With scrollLeft = 80px (2s scroll) + 200px client = 280px / 40 = 7s
      const t7 = projectPointerToTimelineTimestamp(300, trackRect, duration, zoomLevel, 80);
      expect(t7).toBe(7.0);

      // Clamped to duration
      const tMax = projectPointerToTimelineTimestamp(2000, trackRect, duration, zoomLevel, 0);
      expect(tMax).toBe(20.0);
    });
  });

  describe("Operation Factory & Store Dispatch", () => {
    it("creates a valid add_element operation for canvas graphic drop and applies cleanly", () => {
      const payload: EditorDragPayload = {
        type: "graphic",
        compositionId: "animated_counter",
        name: "Stats Counter",
        duration: 3.5,
      };

      const operation = createAddElementOperationFromDrop(payload, {
        timestamp: 2.0,
        position: { x: 35.5, y: 65.0 },
      });

      // Validate schema
      const parseCheck = EditOperationSchema.safeParse(operation);
      expect(parseCheck.success).toBe(true);
      expect(operation.type).toBe("add_element");

      // Dispatch to store
      useTimelineStore.getState().dispatchOperation(operation);

      const state = useTimelineStore.getState();
      expect(state.project.tracks.graphicsTrack.length).toBe(1);
      const droppedGraphic = state.project.tracks.graphicsTrack[0];
      expect(droppedGraphic.compositionId).toBe("animated_counter");
      expect(droppedGraphic.start).toBe(2.0);
      expect(droppedGraphic.end).toBe(5.5); // 2.0 + 3.5
      expect(droppedGraphic.position).toEqual({ x: 35.5, y: 65.0 });

      // Undo rollback removes element
      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().project.tracks.graphicsTrack.length).toBe(0);
    });

    it("creates a valid add_element operation for timeline audio drop and applies cleanly", () => {
      const payload: EditorDragPayload = {
        type: "audio",
        name: "Background Lofi",
        sourceUrl: "https://example.com/lofi.mp3",
        duration: 8.0,
        volume: 70,
        isBgm: true,
      };

      const operation = createAddElementOperationFromDrop(payload, {
        timestamp: 4.5,
        durationLimit: 15.0,
      });

      expect(operation.type).toBe("add_element");
      useTimelineStore.getState().dispatchOperation(operation);

      const state = useTimelineStore.getState();
      expect(state.project.tracks.audioTrack.length).toBe(1);
      const droppedAudio = state.project.tracks.audioTrack[0];
      expect(droppedAudio.name).toBe("Background Lofi");
      expect(droppedAudio.start).toBe(4.5);
      expect(droppedAudio.end).toBe(12.5); // 4.5 + 8.0
      expect(droppedAudio.volume).toBe(70);

      // Undo rollback removes audio clip
      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().project.tracks.audioTrack.length).toBe(0);
    });

    it("creates a valid add_element operation for canvas caption drop", () => {
      const payload: EditorDragPayload = {
        type: "caption",
        stylePreset: "hormozi_bold",
        text: "Dropped Title",
      };

      const operation = createAddElementOperationFromDrop(payload, {
        timestamp: 1.0,
        position: { x: 50, y: 80 },
      });

      useTimelineStore.getState().dispatchOperation(operation);

      const state = useTimelineStore.getState();
      expect(state.project.tracks.textTrack.length).toBe(1);
      const caption = state.project.tracks.textTrack[0];
      expect(caption.text).toBe("Dropped Title");
      expect(caption.stylePreset).toBe("hormozi_bold");
      expect(caption.position).toEqual({ x: 50, y: 80 });

      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().project.tracks.textTrack.length).toBe(0);
    });

    it("creates a valid add_element operation for canvas B-Roll drop", () => {
      const payload: EditorDragPayload = {
        type: "broll",
        name: "Cyberpunk City",
        sourceUrl: "https://example.com/city.mp4",
        duration: 3.0,
      };

      const operation = createAddElementOperationFromDrop(payload, {
        timestamp: 0.5,
        position: { x: 50, y: 50 },
      });

      useTimelineStore.getState().dispatchOperation(operation);

      const state = useTimelineStore.getState();
      expect(state.project.tracks.brollTrack.length).toBe(1);
      const broll = state.project.tracks.brollTrack[0];
      expect(broll.name).toBe("Cyberpunk City");
      expect(broll.start).toBe(0.5);
      expect(broll.end).toBe(3.5);

      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().project.tracks.brollTrack.length).toBe(0);
    });

    it("handles consecutive drops of multiple asset types and performs consecutive clean undos", () => {
      // 1. Drop a motion card
      const graphicPayload: EditorDragPayload = {
        type: "graphic",
        compositionId: "animated_kpi",
        name: "Revenue KPI",
        duration: 4.0,
      };
      const op1 = createAddElementOperationFromDrop(graphicPayload, {
        timestamp: 1.0,
        position: { x: 25, y: 30 },
      });
      useTimelineStore.getState().dispatchOperation(op1);

      // 2. Drop an audio track
      const audioPayload: EditorDragPayload = {
        type: "audio",
        name: "Upbeat Track",
        sourceUrl: "https://example.com/upbeat.mp3",
        duration: 10.0,
      };
      const op2 = createAddElementOperationFromDrop(audioPayload, {
        timestamp: 2.0,
      });
      useTimelineStore.getState().dispatchOperation(op2);

      let state = useTimelineStore.getState();
      expect(state.project.tracks.graphicsTrack.length).toBe(1);
      expect(state.project.tracks.audioTrack.length).toBe(1);
      expect(state.past.length).toBe(2);

      // 3. Consecutive Undo 1: removes audio track
      useTimelineStore.getState().undo();
      state = useTimelineStore.getState();
      expect(state.project.tracks.audioTrack.length).toBe(0);
      expect(state.project.tracks.graphicsTrack.length).toBe(1);

      // 4. Consecutive Undo 2: removes motion card
      useTimelineStore.getState().undo();
      state = useTimelineStore.getState();
      expect(state.project.tracks.graphicsTrack.length).toBe(0);
      expect(state.past.length).toBe(0);
    });
  });
});
