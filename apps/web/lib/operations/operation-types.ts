/**
 * operation-types.ts
 *
 * Strict Zod validation schemas and TypeScript definitions for the 9 canonical
 * EditOperation types supporting deterministic local commands, AI copilot mutations,
 * and atomic transactional undo/redo.
 */

import { z } from "zod";

export const TrackItemTypeSchema = z.enum([
  "video",
  "broll",
  "caption",
  "audio",
  "graphic",
  "constraint",
  "transition",
]);
export type TrackItemType = z.infer<typeof TrackItemTypeSchema>;

export const PositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
export type Position = z.infer<typeof PositionSchema>;

// 1. add_element
export const AddElementOperationSchema = z.object({
  type: z.literal("add_element"),
  track: z.enum(["video", "broll", "caption", "audio", "graphic"]),
  element: z.record(z.any()),
  index: z.number().int().min(0).optional(),
});
export type AddElementOperation = z.infer<typeof AddElementOperationSchema>;

// 2. update_properties
export const UpdatePropertiesOperationSchema = z.object({
  type: z.literal("update_properties"),
  targetId: z.string().min(1),
  targetType: z.enum(["video", "broll", "caption", "audio", "graphic"]),
  properties: z.record(z.any()),
});
export type UpdatePropertiesOperation = z.infer<typeof UpdatePropertiesOperationSchema>;

// 3. move_element
export const MoveElementOperationSchema = z.object({
  type: z.literal("move_element"),
  targetId: z.string().min(1),
  targetType: z.enum(["video", "broll", "caption", "graphic"]),
  position: PositionSchema,
  isUserLocked: z.boolean().optional().default(true),
});
export type MoveElementOperation = z.infer<typeof MoveElementOperationSchema>;

// 4. resize_element
export const ResizeElementOperationSchema = z.object({
  type: z.literal("resize_element"),
  targetId: z.string().min(1),
  targetType: z.enum(["video", "broll", "caption", "graphic"]),
  scale: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isUserLocked: z.boolean().optional().default(true),
});
export type ResizeElementOperation = z.infer<typeof ResizeElementOperationSchema>;

// 5. set_timing
export const SetTimingOperationSchema = z.object({
  type: z.literal("set_timing"),
  targetId: z.string().min(1),
  targetType: z.enum(["video", "broll", "caption", "audio", "graphic"]),
  start: z.number().min(0),
  end: z.number().min(0),
});
export type SetTimingOperation = z.infer<typeof SetTimingOperationSchema>;

// 6. split_clip
export const SplitClipOperationSchema = z.object({
  type: z.literal("split_clip"),
  targetId: z.string().min(1),
  targetType: z.enum(["video", "broll", "caption", "audio", "graphic"]),
  splitTime: z.number().min(0),
  newClipAId: z.string().optional(),
  newClipBId: z.string().optional(),
});
export type SplitClipOperation = z.infer<typeof SplitClipOperationSchema>;

// 7. delete_element
export const DeleteElementOperationSchema = z.object({
  type: z.literal("delete_element"),
  targetId: z.string().min(1),
  targetType: TrackItemTypeSchema,
  ripple: z.boolean().optional().default(false),
});
export type DeleteElementOperation = z.infer<typeof DeleteElementOperationSchema>;

// Constraint helper schemas
export const ConstraintRelationSchema = z.enum([
  "above",
  "below",
  "left",
  "right",
  "center",
  "inside",
  "align-left",
  "align-right",
  "align-top",
  "align-bottom",
]);

export const SemanticConstraintSchema = z.object({
  id: z.string().min(1),
  sourceElementId: z.string().min(1),
  type: z.enum(["away_from_subject", "align_relative", "clamp_safe_zone", "anchor_beat"]),
  targetId: z.string().optional(),
  relation: ConstraintRelationSchema.optional(),
  gap: z.number().optional(),
  strength: z.enum(["required", "preferred"]),
  padding: z.number().optional(),
});

// 8. add_constraint
export const AddConstraintOperationSchema = z.object({
  type: z.literal("add_constraint"),
  constraint: SemanticConstraintSchema,
});
export type AddConstraintOperation = z.infer<typeof AddConstraintOperationSchema>;

// 9. set_aspect_ratio
export const SetAspectRatioOperationSchema = z.object({
  type: z.literal("set_aspect_ratio"),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "4:5"]),
});
export type SetAspectRatioOperation = z.infer<typeof SetAspectRatioOperationSchema>;

// 10. add_transition
export const TransitionPresetSchema = z.enum([
  "crossfade",
  "fade_to_black",
  "wipe_left",
  "wipe_right",
  "slide_up",
  "zoom_in",
  "whip_pan",
]);
export type TransitionPreset = z.infer<typeof TransitionPresetSchema>;

export const AddTransitionOperationSchema = z.object({
  type: z.literal("add_transition"),
  id: z.string().min(1),
  track: z.enum(["video", "broll"]),
  fromClipId: z.string().min(1),
  toClipId: z.string().min(1),
  preset: TransitionPresetSchema,
  duration: z.number().positive().default(0.5),
  alignment: z.enum(["center", "start", "end"]).default("center"),
});
export type AddTransitionOperation = z.infer<typeof AddTransitionOperationSchema>;

// 11. set_audio_mix
export const SetAudioMixOperationSchema = z.object({
  type: z.literal("set_audio_mix"),
  targetClipId: z.string().min(1),
  volume: z.number().min(0).max(100),
  fadeIn: z.number().min(0).optional(),
  fadeOut: z.number().min(0).optional(),
  ducking: z
    .object({
      enabled: z.boolean(),
      thresholdDb: z.number().default(-24).optional(),
      attenuationDb: z.number().default(-14).optional(),
    })
    .optional(),
});
export type SetAudioMixOperation = z.infer<typeof SetAudioMixOperationSchema>;

// Atomic edit operations (all non-batch operations)
export const AtomicEditOperationSchema = z.discriminatedUnion("type", [
  AddElementOperationSchema,
  UpdatePropertiesOperationSchema,
  MoveElementOperationSchema,
  ResizeElementOperationSchema,
  SetTimingOperationSchema,
  SplitClipOperationSchema,
  DeleteElementOperationSchema,
  AddConstraintOperationSchema,
  SetAspectRatioOperationSchema,
  AddTransitionOperationSchema,
  SetAudioMixOperationSchema,
]);
export type AtomicEditOperation = z.infer<typeof AtomicEditOperationSchema>;

// 12. batch
export interface BatchOperation {
  type: "batch";
  operations: EditOperation[];
  description?: string;
}

export const BatchOperationSchema: z.ZodType<BatchOperation> = z.lazy(() =>
  z.object({
    type: z.literal("batch"),
    operations: z.array(EditOperationSchema),
    description: z.string().optional(),
  })
);

export type EditOperation = AtomicEditOperation | BatchOperation;

export const EditOperationSchema: z.ZodType<EditOperation> = z.lazy(() =>
  z.union([
    AddElementOperationSchema,
    UpdatePropertiesOperationSchema,
    MoveElementOperationSchema,
    ResizeElementOperationSchema,
    SetTimingOperationSchema,
    SplitClipOperationSchema,
    DeleteElementOperationSchema,
    AddConstraintOperationSchema,
    SetAspectRatioOperationSchema,
    AddTransitionOperationSchema,
    SetAudioMixOperationSchema,
    BatchOperationSchema,
  ])
);
