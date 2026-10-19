/**
 * drag-drop-types.ts
 *
 * Schemas, types, serialization, and coordinate projection utilities
 * for dragging media assets, captions, and motion cards onto the canvas and timeline.
 */

import { z } from "zod";
import { CaptionPreset } from "../timeline-types";
import { EditOperation, EditOperationSchema } from "../operations/operation-types";

export const EDITOR_DRAG_MIME = "application/x-editor-asset";

// 1. ZOD SCHEMAS FOR DRAG PAYLOADS

export const CaptionDragPayloadSchema = z.object({
  type: z.literal("caption"),
  stylePreset: z.enum(["tiktok_yellow", "hormozi_bold", "clean_white", "neon_glow"]),
  text: z.string().optional(),
});

export const BRollDragPayloadSchema = z.object({
  type: z.literal("broll"),
  name: z.string(),
  sourceUrl: z.string().url().or(z.string().startsWith("blob:")).or(z.string().startsWith("http")),
  duration: z.number().positive().optional().default(3.0),
  fitMode: z.enum(["cover", "contain"]).optional().default("cover"),
});

export const GraphicDragPayloadSchema = z.object({
  type: z.literal("graphic"),
  compositionId: z.string(),
  name: z.string(),
  duration: z.number().positive().optional().default(4.0),
  props: z.record(z.any()).optional().default({}),
});

export const AudioDragPayloadSchema = z.object({
  type: z.literal("audio"),
  name: z.string(),
  sourceUrl: z.string(),
  duration: z.number().positive().default(10.0),
  volume: z.number().min(0).max(100).optional().default(80),
  isBgm: z.boolean().optional().default(true),
});

export const VideoDragPayloadSchema = z.object({
  type: z.literal("video"),
  name: z.string(),
  sourceUrl: z.string(),
  duration: z.number().positive().default(5.0),
});

export const EditorDragPayloadSchema = z.discriminatedUnion("type", [
  CaptionDragPayloadSchema,
  BRollDragPayloadSchema,
  GraphicDragPayloadSchema,
  AudioDragPayloadSchema,
  VideoDragPayloadSchema,
]);

export type CaptionDragPayload = z.infer<typeof CaptionDragPayloadSchema>;
export type BRollDragPayload = z.infer<typeof BRollDragPayloadSchema>;
export type GraphicDragPayload = z.infer<typeof GraphicDragPayloadSchema>;
export type AudioDragPayload = z.infer<typeof AudioDragPayloadSchema>;
export type VideoDragPayload = z.infer<typeof VideoDragPayloadSchema>;
export type EditorDragPayload = z.infer<typeof EditorDragPayloadSchema>;

// 2. SERIALIZATION & DESERIALIZATION

export function serializeDragPayload(payload: EditorDragPayload): string {
  return JSON.stringify(payload);
}

export function deserializeDragPayload(raw: string): EditorDragPayload | null {
  try {
    const parsed = JSON.parse(raw);
    const validated = EditorDragPayloadSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    return null;
  } catch {
    return null;
  }
}

// 3. COORDINATE & TIMING PROJECTION UTILITIES

export interface CanvasDimensions {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Projects a pointer screen coordinate (clientX, clientY) to normalized canvas percentage coordinates (0% to 100%).
 */
export function projectPointerToCanvasCoordinates(
  clientX: number,
  clientY: number,
  canvasRect: CanvasDimensions
): { x: number; y: number } {
  if (canvasRect.width <= 0 || canvasRect.height <= 0) {
    return { x: 50, y: 50 };
  }

  const relativeX = clientX - canvasRect.left;
  const relativeY = clientY - canvasRect.top;

  const rawPercentX = (relativeX / canvasRect.width) * 100;
  const rawPercentY = (relativeY / canvasRect.height) * 100;

  // Clamp strictly between 5% and 95% so dropped items stay comfortably within canvas bounds
  const clampedX = Math.max(5, Math.min(95, rawPercentX));
  const clampedY = Math.max(5, Math.min(95, rawPercentY));

  return {
    x: Number(clampedX.toFixed(1)),
    y: Number(clampedY.toFixed(1)),
  };
}

export interface TimelineTrackDimensions {
  left: number;
  width: number;
}

/**
 * Projects a pointer clientX coordinate into timeline timestamp (seconds).
 */
export function projectPointerToTimelineTimestamp(
  clientX: number,
  trackRect: TimelineTrackDimensions,
  projectDuration: number,
  zoomLevel: number,
  scrollLeft: number = 0
): number {
  if (zoomLevel <= 0) return 0;

  const relativePixelX = clientX - trackRect.left + scrollLeft;
  const rawTime = relativePixelX / zoomLevel;

  const clampedTime = Math.max(0, Math.min(projectDuration, rawTime));
  return Number(clampedTime.toFixed(2));
}

// 4. FACTORY FOR PRODUCING STRICT EDITOPERATION (add_element)

export interface AddElementDropOptions {
  timestamp: number;
  position?: { x: number; y: number };
  durationLimit?: number;
}

/**
 * Translates a dropped asset payload and its target position / timestamp into a valid add_element EditOperation.
 */
export function createAddElementOperationFromDrop(
  payload: EditorDragPayload,
  options: AddElementDropOptions
): EditOperation {
  const start = Math.max(0, Number(options.timestamp.toFixed(2)));
  const idPrefix = `${payload.type}-${Date.now()}`;

  switch (payload.type) {
    case "caption": {
      const defaultDuration = 3.0;
      const end = options.durationLimit
        ? Math.min(options.durationLimit, start + defaultDuration)
        : start + defaultDuration;

      const pos = options.position ?? { x: 50, y: 75 };

      return {
        type: "add_element",
        track: "caption",
        element: {
          id: idPrefix,
          text: payload.text || "New Text",
          start,
          end: end <= start ? start + 3.0 : end,
          stylePreset: payload.stylePreset,
          position: pos,
          positionX: pos.x,
          positionY: pos.y,
          scale: 1.0,
          rotation: 0,
        },
      };
    }

    case "graphic": {
      const defaultDuration = payload.duration ?? 4.0;
      const end = options.durationLimit
        ? Math.min(options.durationLimit, start + defaultDuration)
        : start + defaultDuration;

      const pos = options.position ?? { x: 50, y: 50 };

      return {
        type: "add_element",
        track: "graphic",
        element: {
          id: idPrefix,
          name: payload.name,
          compositionId: payload.compositionId,
          props: payload.props || {},
          start,
          end: end <= start ? start + 4.0 : end,
          position: pos,
          positionX: pos.x,
          positionY: pos.y,
          scale: 1.0,
          rotation: 0,
        },
      };
    }

    case "broll": {
      const defaultDuration = payload.duration ?? 3.0;
      const end = options.durationLimit
        ? Math.min(options.durationLimit, start + defaultDuration)
        : start + defaultDuration;

      const pos = options.position ?? { x: 50, y: 50 };

      return {
        type: "add_element",
        track: "broll",
        element: {
          id: idPrefix,
          name: payload.name,
          sourceUrl: payload.sourceUrl,
          start,
          end: end <= start ? start + 3.0 : end,
          opacity: 100,
          fitMode: payload.fitMode ?? "cover",
          position: pos,
          positionX: pos.x,
          positionY: pos.y,
          scale: 1.0,
        },
      };
    }

    case "audio": {
      const duration = payload.duration ?? 10.0;
      const end = options.durationLimit
        ? Math.min(options.durationLimit, start + duration)
        : start + duration;

      return {
        type: "add_element",
        track: "audio",
        element: {
          id: idPrefix,
          name: payload.name,
          sourceUrl: payload.sourceUrl,
          start,
          end: end <= start ? start + duration : end,
          volume: payload.volume ?? 80,
          fadeIn: 0.5,
          fadeOut: 0.5,
          isBgm: payload.isBgm ?? true,
        },
      };
    }

    case "video": {
      const duration = payload.duration ?? 5.0;
      const end = options.durationLimit
        ? Math.min(options.durationLimit, start + duration)
        : start + duration;

      return {
        type: "add_element",
        track: "video",
        element: {
          id: idPrefix,
          name: payload.name,
          sourceUrl: payload.sourceUrl,
          start,
          end: end <= start ? start + duration : end,
          sourceStart: 0,
          sourceEnd: duration,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
        },
      };
    }
  }
}
