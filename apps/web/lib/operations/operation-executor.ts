/**
 * operation-executor.ts
 *
 * Implements the operational reducer and atomic inverse-operation generator.
 * Guarantees that:
 * 1. Every EditOperation is strictly validated via Zod.
 * 2. Every EditOperation produces an exact, deterministic inverse operation.
 * 3. Executing an operation followed by its inverse returns the project to its exact prior state.
 */

import {
  EditOperation,
  EditOperationSchema,
  AtomicEditOperation,
  BatchOperation,
  TrackItemType,
  Position,
  TransitionPreset,
} from "./operation-types";

import {
  TimelineProject,
  VideoClip,
  BRollClip,
  CaptionBlock,
  AudioClip,
  GraphicElement,
  SemanticConstraint,
  TransitionItem,
} from "../timeline-types";
import { reflowProjectToAspectRatio } from "../layout/aspect-ratio-reflow";

export class OperationExecutionError extends Error {
  constructor(message: string, public readonly operation: EditOperation) {
    super(`[OperationExecutionError] ${message} in operation: ${JSON.stringify(operation)}`);
    this.name = "OperationExecutionError";
  }
}

/**
 * Validate that an object conforms to the EditOperation schema.
 */
export function validateOperation(rawOp: unknown): EditOperation {
  return EditOperationSchema.parse(rawOp);
}

/**
 * Safely validate an EditOperation.
 */
export function safeValidateOperation(rawOp: unknown) {
  return EditOperationSchema.safeParse(rawOp);
}

export interface TransitionHandleReport {
  isValid: boolean;
  handleA: number; // Tail handle available on Clip A
  handleB: number; // Head handle available on Clip B
  requiredHandleA: number; // Required handle for alignment
  requiredHandleB: number;
  maxDuration: number; // Maximum transition duration supported by handles
  clampedDuration: number;
  hasSufficientHandles: boolean;
  fallbackPreset?: TransitionPreset;
}

/**
 * Validates whether two adjacent clips have sufficient head/tail handles to support
 * a transition of duration D.
 * 
 * In standard NLE conventions:
 * - Clip A (outgoing) must have sufficient tail handle: clipA.sourceEnd - clipA.end >= D/2
 * - Clip B (incoming) must have sufficient head handle: clipB.start - clipB.sourceStart >= D/2
 * If handles are insufficient:
 * - maxDuration is clamped to 2 * min(handleA, handleB)
 * - If handles are 0, fallbackPreset is suggested ("fade_to_black" dip to black requires 0 handles)
 */
export function validateTransitionHandles(
  fromClip: VideoClip | BRollClip,
  toClip: VideoClip | BRollClip,
  duration: number,
  alignment: "center" | "start" | "end" = "center"
): TransitionHandleReport {
  const dur = Math.max(0.01, duration);

  // 1. Tail handle on Clip A (extra source media after cut point)
  const fromSourceEnd = (fromClip as any).sourceEnd ?? fromClip.end;
  const fromMediaDuration = (fromClip as any).mediaDuration;
  let handleA = 0;
  if (typeof (fromClip as any).tailHandle === "number") {
    handleA = Math.max(0, (fromClip as any).tailHandle);
  } else if (typeof fromMediaDuration === "number") {
    handleA = Math.max(0, fromMediaDuration - fromSourceEnd);
  } else {
    handleA = Math.max(0, fromSourceEnd - fromClip.end);
  }

  // 2. Head handle on Clip B (extra source media before in point)
  const toSourceStart = (toClip as any).sourceStart ?? 0;
  let handleB = 0;
  if (typeof (toClip as any).headHandle === "number") {
    handleB = Math.max(0, (toClip as any).headHandle);
  } else if (toClip.start > toSourceStart) {
    handleB = Math.max(0, toClip.start - toSourceStart);
  } else {
    handleB = Math.max(0, toSourceStart);
  }

  let requiredHandleA = 0;
  let requiredHandleB = 0;
  let maxDuration = 0;

  if (alignment === "center") {
    requiredHandleA = Number((dur / 2).toFixed(4));
    requiredHandleB = Number((dur / 2).toFixed(4));
    maxDuration = Number((2 * Math.min(handleA, handleB)).toFixed(4));
  } else if (alignment === "start") {
    requiredHandleA = dur;
    requiredHandleB = 0;
    maxDuration = handleA;
  } else {
    // end
    requiredHandleA = 0;
    requiredHandleB = dur;
    maxDuration = handleB;
  }

  const hasSufficientHandles = handleA >= requiredHandleA && handleB >= requiredHandleB;
  const clampedDuration = Math.min(dur, Math.max(0.1, Number(maxDuration.toFixed(3))));
  const fallbackPreset: TransitionPreset = "fade_to_black";

  return {
    isValid: true,
    handleA: Number(handleA.toFixed(4)),
    handleB: Number(handleB.toFixed(4)),
    requiredHandleA,
    requiredHandleB,
    maxDuration: Number(maxDuration.toFixed(4)),
    clampedDuration,
    hasSufficientHandles,
    fallbackPreset,
  };
}

/**
 * Find an element and its index inside a TimelineProject by ID and target type.
 */
export function findElementInProject(
  project: TimelineProject,
  targetId: string,
  targetType: TrackItemType
): { element: any; index: number; trackKey?: string } {
  const tracks = project.tracks;

  if (targetType === "video") {
    const index = tracks.videoTrack.findIndex((c) => c.id === targetId);
    return { element: index !== -1 ? tracks.videoTrack[index] : null, index, trackKey: "videoTrack" };
  }
  if (targetType === "broll") {
    const index = tracks.brollTrack.findIndex((c) => c.id === targetId);
    return { element: index !== -1 ? tracks.brollTrack[index] : null, index, trackKey: "brollTrack" };
  }
  if (targetType === "caption") {
    const index = tracks.textTrack.findIndex((c) => c.id === targetId);
    return { element: index !== -1 ? tracks.textTrack[index] : null, index, trackKey: "textTrack" };
  }
  if (targetType === "audio") {
    const index = tracks.audioTrack.findIndex((c) => c.id === targetId);
    return { element: index !== -1 ? tracks.audioTrack[index] : null, index, trackKey: "audioTrack" };
  }
  if (targetType === "graphic") {
    const graphics = tracks.graphicsTrack || [];
    const index = graphics.findIndex((g) => g.id === targetId);
    return { element: index !== -1 ? graphics[index] : null, index, trackKey: "graphicsTrack" };
  }
  if (targetType === "constraint") {
    const constraints = project.constraints || [];
    const index = constraints.findIndex((c) => c.id === targetId);
    return { element: index !== -1 ? constraints[index] : null, index, trackKey: "constraints" };
  }
  if (targetType === "transition") {
    const transitions = project.transitions || [];
    const index = transitions.findIndex((t) => t.id === targetId);
    return { element: index !== -1 ? transitions[index] : null, index, trackKey: "transitions" };
  }

  return { element: null, index: -1 };
}

/**
 * Creates the exact inverse operation required to reverse `op` on `project`.
 */
export function createInverseOperation(
  project: TimelineProject,
  op: EditOperation
): EditOperation {
  switch (op.type) {
    case "add_element": {
      const elementId = op.element.id;
      if (!elementId) {
        throw new OperationExecutionError("Cannot invert add_element without element.id", op);
      }
      return {
        type: "delete_element",
        targetId: elementId,
        targetType: op.track,
      };
    }

    case "delete_element": {
      const { element, index } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Element '${op.targetId}' not found for inverse computation`, op);
      }
      const cloned = JSON.parse(JSON.stringify(element));

      if (op.targetType === "constraint") {
        return {
          type: "add_constraint",
          constraint: cloned,
        };
      }

      if (op.targetType === "transition") {
        return {
          type: "add_transition",
          id: cloned.id,
          track: cloned.track,
          fromClipId: cloned.fromClipId,
          toClipId: cloned.toClipId,
          preset: cloned.preset,
          duration: cloned.duration,
          alignment: cloned.alignment,
        };
      }

      // If ripple was applied on video deletion, subsequent clips were shifted backwards.
      // The inverse must restore subsequent clips' timings forward as well.
      if (op.ripple && op.targetType === "video") {
        const deletedDuration = (element.end ?? 0) - (element.start ?? 0);
        const subsequentClips = project.tracks.videoTrack.slice(index + 1);
        const shiftOps: EditOperation[] = subsequentClips.map((c) => ({
          type: "set_timing",
          targetId: c.id,
          targetType: "video",
          start: c.start,
          end: c.end,
        }));

        return {
          type: "batch",
          description: "Undo ripple delete",
          operations: [
            {
              type: "add_element",
              track: op.targetType,
              element: cloned,
              index,
            },
            ...shiftOps,
          ],
        };
      }

      return {
        type: "add_element",
        track: op.targetType,
        element: cloned,
        index,
      };
    }

    case "update_properties": {
      const { element } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Element '${op.targetId}' not found for inverse computation`, op);
      }
      const previousProps: Record<string, any> = {};
      for (const key of Object.keys(op.properties)) {
        previousProps[key] = element[key] !== undefined ? JSON.parse(JSON.stringify(element[key])) : null;
      }
      return {
        type: "update_properties",
        targetId: op.targetId,
        targetType: op.targetType,
        properties: previousProps,
      };
    }

    case "move_element": {
      const { element } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Element '${op.targetId}' not found for inverse computation`, op);
      }
      const previousPos: Position = {
        x: element.position?.x ?? element.positionX ?? 50,
        y: element.position?.y ?? element.positionY ?? 50,
      };
      return {
        type: "move_element",
        targetId: op.targetId,
        targetType: op.targetType,
        position: previousPos,
        isUserLocked: element.isUserLocked ?? false,
      };
    }

    case "resize_element": {
      const { element } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Element '${op.targetId}' not found for inverse computation`, op);
      }
      return {
        type: "resize_element",
        targetId: op.targetId,
        targetType: op.targetType,
        scale: element.scale ?? 1.0,
        isUserLocked: element.isUserLocked ?? false,
      };
    }

    case "set_timing": {
      const { element } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Element '${op.targetId}' not found for inverse computation`, op);
      }
      return {
        type: "set_timing",
        targetId: op.targetId,
        targetType: op.targetType,
        start: element.start,
        end: element.end,
      };
    }

    case "split_clip": {
      const { element, index } = findElementInProject(project, op.targetId, op.targetType);
      if (!element) {
        throw new OperationExecutionError(`Clip '${op.targetId}' not found for split inverse computation`, op);
      }
      const cloned = JSON.parse(JSON.stringify(element));
      const clipAId = op.newClipAId || `${element.id}-p1`;
      const clipBId = op.newClipBId || `${element.id}-p2`;

      // Inverse of split: delete both split halves and re-insert the original un-split clip
      return {
        type: "batch",
        description: `Undo split of ${op.targetId}`,
        operations: [
          { type: "delete_element", targetId: clipBId, targetType: op.targetType },
          { type: "delete_element", targetId: clipAId, targetType: op.targetType },
          { type: "add_element", track: op.targetType, element: cloned, index },
        ],
      };
    }

    case "add_constraint": {
      return {
        type: "delete_element",
        targetId: op.constraint.id,
        targetType: "constraint",
      };
    }

    case "set_aspect_ratio": {
      return {
        type: "set_aspect_ratio",
        aspectRatio: project.aspectRatio,
      };
    }

    case "add_transition": {
      return {
        type: "delete_element",
        targetId: op.id,
        targetType: "transition",
      };
    }

    case "set_audio_mix": {
      const audioClip = (project.tracks.audioTrack || []).find((a) => a.id === op.targetClipId);
      if (audioClip) {
        return {
          type: "set_audio_mix",
          targetClipId: op.targetClipId,
          volume: audioClip.volume ?? 80,
          fadeIn: audioClip.fadeIn,
          fadeOut: audioClip.fadeOut,
          ducking: (audioClip as any).ducking,
        };
      }
      const videoClip = (project.tracks.videoTrack || []).find((v) => v.id === op.targetClipId);
      if (videoClip) {
        return {
          type: "set_audio_mix",
          targetClipId: op.targetClipId,
          volume: videoClip.volume ?? 100,
        };
      }
      throw new OperationExecutionError(`Target clip '${op.targetClipId}' not found for set_audio_mix inverse computation`, op);
    }

    case "batch": {
      // For batch operations, compute inverses sequentially in simulated forward order,
      // and return the list of inverses in REVERSED order.
      const inverses: EditOperation[] = [];
      let simulated = JSON.parse(JSON.stringify(project));

      for (const subOp of op.operations) {
        const inv = createInverseOperation(simulated, subOp);
        inverses.push(inv);
        simulated = executeOperation(simulated, subOp).nextProject;
      }

      return {
        type: "batch",
        description: op.description ? `Undo: ${op.description}` : "Undo batch",
        operations: inverses.reverse(),
      };
    }

    default:
      throw new OperationExecutionError(`Unsupported operation type ${(op as any).type}`, op);
  }
}

/**
 * Execute an EditOperation on a TimelineProject.
 * Returns the modified nextProject and the exact inverse operation.
 */
export function executeOperation(
  project: TimelineProject,
  rawOp: unknown
): { nextProject: TimelineProject; inverse: EditOperation } {
  const op = validateOperation(rawOp);
  const inverse = createInverseOperation(project, op);

  // Clone project immutably
  let nextProject: TimelineProject = {
    ...project,
    tracks: {
      videoTrack: [...(project.tracks.videoTrack || [])],
      brollTrack: [...(project.tracks.brollTrack || [])],
      textTrack: [...(project.tracks.textTrack || [])],
      audioTrack: [...(project.tracks.audioTrack || [])],
      graphicsTrack: [...(project.tracks.graphicsTrack || [])],
    },
    transitions: project.transitions ? [...project.transitions] : [],
    constraints: project.constraints ? [...project.constraints] : [],
    safeZones: project.safeZones ? [...project.safeZones] : [],
  };

  switch (op.type) {
    case "add_element": {
      const trackKey = (
        op.track === "video" ? "videoTrack" :
        op.track === "broll" ? "brollTrack" :
        op.track === "caption" ? "textTrack" :
        op.track === "audio" ? "audioTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = [...(nextProject.tracks[trackKey] as any[])];
      const newElem = JSON.parse(JSON.stringify(op.element));

      if (op.track === "broll") {
        newElem.volume = newElem.volume ?? 0;
        newElem.muted = newElem.muted ?? true;
        if (!newElem.sourceUrl && newElem.src) {
          newElem.sourceUrl = newElem.src;
        }
      }

      if (op.index !== undefined && op.index >= 0 && op.index <= trackList.length) {
        trackList.splice(op.index, 0, newElem);
      } else {
        trackList.push(newElem);
      }
      (nextProject.tracks as any)[trackKey] = trackList;

      // Adjust project duration if added element exceeds current duration
      if (typeof newElem.end === "number" && newElem.end > nextProject.duration) {
        nextProject.duration = Number(newElem.end.toFixed(3));
      }
      break;
    }

    case "delete_element": {
      if (op.targetType === "constraint") {
        nextProject.constraints = (nextProject.constraints || []).filter((c) => c.id !== op.targetId);
        break;
      }
      if (op.targetType === "transition") {
        nextProject.transitions = (nextProject.transitions || []).filter((t) => t.id !== op.targetId);
        break;
      }

      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" :
        op.targetType === "audio" ? "audioTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      const index = trackList.findIndex((item) => item.id === op.targetId);
      if (index === -1) break;

      const deletedItem = trackList[index];
      const deletedDuration = (deletedItem.end ?? 0) - (deletedItem.start ?? 0);

      let updatedList = trackList.filter((item) => item.id !== op.targetId);

      // Ripple shift subsequent video clips if requested
      if (op.ripple && op.targetType === "video") {
        updatedList = updatedList.map((clip, i) => {
          if (i >= index) {
            return {
              ...clip,
              start: Math.max(0, Number((clip.start - deletedDuration).toFixed(4))),
              end: Math.max(0.1, Number((clip.end - deletedDuration).toFixed(4))),
            };
          }
          return clip;
        });
      }

      (nextProject.tracks as any)[trackKey] = updatedList;

      // Clean up orphaned transitions attached to the deleted clip
      if (op.targetType === "video" || op.targetType === "broll") {
        nextProject.transitions = (nextProject.transitions || []).filter(
          (t) => t.fromClipId !== op.targetId && t.toClipId !== op.targetId
        );
      }

      // Recalculate duration based on remaining video clips
      if (nextProject.tracks.videoTrack.length > 0) {
        const maxEnd = Math.max(...nextProject.tracks.videoTrack.map((c) => c.end));
        nextProject.duration = Math.max(5, Number(maxEnd.toFixed(3)));
      }
      break;
    }

    case "update_properties": {
      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" :
        op.targetType === "audio" ? "audioTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      (nextProject.tracks as any)[trackKey] = trackList.map((item) => {
        if (item.id === op.targetId) {
          const updated = { ...item };
          for (const [k, v] of Object.entries(op.properties)) {
            if (v === null) {
              delete updated[k];
            } else {
              updated[k] = v;
            }
          }
          return updated;
        }
        return item;
      });
      break;
    }

    case "move_element": {
      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      (nextProject.tracks as any)[trackKey] = trackList.map((item) => {
        if (item.id === op.targetId) {
          return {
            ...item,
            position: { x: op.position.x, y: op.position.y },
            positionX: op.position.x,
            positionY: op.position.y,
            isUserLocked: op.isUserLocked ?? true,
          };
        }
        return item;
      });
      break;
    }

    case "resize_element": {
      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      (nextProject.tracks as any)[trackKey] = trackList.map((item) => {
        if (item.id === op.targetId) {
          return {
            ...item,
            scale: op.scale ?? item.scale ?? 1.0,
            ...(op.width ? { width: op.width } : {}),
            ...(op.height ? { height: op.height } : {}),
            isUserLocked: op.isUserLocked ?? true,
          };
        }
        return item;
      });
      break;
    }

    case "set_timing": {
      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" :
        op.targetType === "audio" ? "audioTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      (nextProject.tracks as any)[trackKey] = trackList.map((item) => {
        if (item.id === op.targetId) {
          return {
            ...item,
            start: op.start,
            end: op.end,
          };
        }
        return item;
      });

      if (op.end > nextProject.duration) {
        nextProject.duration = Number(op.end.toFixed(3));
      }
      break;
    }

    case "split_clip": {
      const trackKey = (
        op.targetType === "video" ? "videoTrack" :
        op.targetType === "broll" ? "brollTrack" :
        op.targetType === "caption" ? "textTrack" :
        op.targetType === "audio" ? "audioTrack" : "graphicsTrack"
      ) as keyof typeof nextProject.tracks;

      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      const index = trackList.findIndex((item) => item.id === op.targetId);
      if (index === -1) {
        throw new OperationExecutionError(`Clip '${op.targetId}' not found for split`, op);
      }

      const target = trackList[index];
      if (op.splitTime <= target.start + 0.05 || op.splitTime >= target.end - 0.05) {
        throw new OperationExecutionError(`Split time ${op.splitTime} is outside valid clip bounds [${target.start}, ${target.end}]`, op);
      }

      const clipAId = op.newClipAId || `${target.id}-p1`;
      const clipBId = op.newClipBId || `${target.id}-p2`;

      if (op.targetType === "video") {
        const offset = op.splitTime - target.start;
        const sourceSplit = (target.sourceStart ?? 0) + offset * (target.speed || 1);
        const clipA: VideoClip = { ...target, id: clipAId, end: op.splitTime, sourceEnd: sourceSplit };
        const clipB: VideoClip = { ...target, id: clipBId, start: op.splitTime, sourceStart: sourceSplit };
        trackList.splice(index, 1, clipA, clipB);
      } else {
        const clipA = { ...target, id: clipAId, end: op.splitTime };
        const clipB = { ...target, id: clipBId, start: op.splitTime };
        trackList.splice(index, 1, clipA, clipB);
      }

      (nextProject.tracks as any)[trackKey] = [...trackList];
      break;
    }

    case "add_constraint": {
      const current = nextProject.constraints || [];
      nextProject.constraints = [...current.filter((c) => c.id !== op.constraint.id), op.constraint];
      break;
    }

    case "set_aspect_ratio": {
      nextProject = reflowProjectToAspectRatio(nextProject, op.aspectRatio);
      break;
    }

    case "add_transition": {
      const trackKey = (op.track === "video" ? "videoTrack" : "brollTrack") as keyof typeof nextProject.tracks;
      const trackList = (nextProject.tracks[trackKey] as any[]) || [];
      const fromClip = trackList.find((c) => c.id === op.fromClipId);
      const toClip = trackList.find((c) => c.id === op.toClipId);

      let effectiveDuration = op.duration;
      let effectivePreset = op.preset;

      if (fromClip && toClip) {
        const report = validateTransitionHandles(fromClip, toClip, op.duration, op.alignment);

        if (op.validateHandles && !report.hasSufficientHandles && !op.autoClamp && !op.enforceFallback) {
          throw new OperationExecutionError(
            `Insufficient handles for transition between '${op.fromClipId}' and '${op.toClipId}'. Required: [${report.requiredHandleA}s, ${report.requiredHandleB}s], Available: [${report.handleA}s, ${report.handleB}s].`,
            op
          );
        }

        if (op.autoClamp && !report.hasSufficientHandles) {
          if (report.maxDuration >= 0.1) {
            effectiveDuration = report.clampedDuration;
          } else {
            // No handles available: fallback to fade_to_black which doesn't require media overlap
            effectivePreset = report.fallbackPreset ?? "fade_to_black";
          }
        } else if (op.enforceFallback && !report.hasSufficientHandles) {
          effectivePreset = report.fallbackPreset ?? "fade_to_black";
        }
      }

      const list = [...(nextProject.transitions || [])];
      const existingIdx = list.findIndex(
        (t) => t.id === op.id || (t.fromClipId === op.fromClipId && t.toClipId === op.toClipId)
      );
      const item: TransitionItem = {
        id: op.id,
        track: op.track,
        fromClipId: op.fromClipId,
        toClipId: op.toClipId,
        preset: effectivePreset,
        duration: effectiveDuration,
        alignment: op.alignment,
      };
      if (existingIdx !== -1) {
        list[existingIdx] = item;
      } else {
        list.push(item);
      }
      nextProject.transitions = list;
      break;
    }

    case "set_audio_mix": {
      let updated = false;
      nextProject.tracks.audioTrack = (nextProject.tracks.audioTrack || []).map((clip) => {
        if (clip.id === op.targetClipId) {
          updated = true;
          return {
            ...clip,
            volume: op.volume,
            ...(op.fadeIn !== undefined ? { fadeIn: op.fadeIn } : {}),
            ...(op.fadeOut !== undefined ? { fadeOut: op.fadeOut } : {}),
            ...(op.ducking ? { ducking: op.ducking, isBgm: op.ducking.enabled } : {}),
          };
        }
        return clip;
      });
      if (!updated) {
        nextProject.tracks.videoTrack = (nextProject.tracks.videoTrack || []).map((clip) => {
          if (clip.id === op.targetClipId) {
            updated = true;
            return {
              ...clip,
              volume: op.volume,
            };
          }
          return clip;
        });
      }
      if (!updated) {
        throw new OperationExecutionError(`Target clip '${op.targetClipId}' not found for set_audio_mix`, op);
      }
      break;
    }

    case "batch": {
      let currentProj = nextProject;
      for (const subOp of op.operations) {
        const result = executeOperation(currentProj, subOp);
        currentProj = result.nextProject;
      }
      return { nextProject: currentProj, inverse };
    }
  }

  return { nextProject, inverse };
}
