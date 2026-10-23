/**
 * resource-types.ts
 *
 * Unified data models and discriminated union contracts for the Shared Resource Library.
 * Supports shapes, caption templates, transitions, motion graphics, audio SFX, stock B-roll, and effects.
 */

import { z } from "zod";
import { TrackItemType, CaptionPreset, TransitionPreset } from "../timeline-types";
import { EditOperation } from "../operations/operation-types";

export const LibraryResourceTypeSchema = z.enum([
  "shape",
  "caption_preset",
  "transition",
  "motion_graphic",
  "sfx",
  "broll",
  "effect",
]);

export type LibraryResourceType = z.infer<typeof LibraryResourceTypeSchema>;

export const ParameterTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "color",
  "select",
]);

export type ParameterType = z.infer<typeof ParameterTypeSchema>;

export const ResourceParameterDefinitionSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: ParameterTypeSchema,
  default: z.any(),
  description: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
});

export type ResourceParameterDefinition = z.infer<typeof ResourceParameterDefinitionSchema>;

export const ResourceAttributionSchema = z.object({
  source: z.string(),
  license: z.string(),
  author: z.string().optional(),
  url: z.string().optional(),
});

export type ResourceAttribution = z.infer<typeof ResourceAttributionSchema>;

export const LibraryResourceSchema = z.object({
  id: z.string().min(1),
  type: LibraryResourceTypeSchema,
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  tags: z.array(z.string()),
  isSupported: z.boolean().default(true),
  version: z.string().default("1.0.0"),
  targetTrack: z.enum(["graphic", "caption", "audio", "broll", "video", "transition"]),
  defaultDuration: z.number().positive().default(3.0),
  parameters: z.array(ResourceParameterDefinitionSchema).default([]),
  defaultProps: z.record(z.string(), z.any()).default({}),
  attribution: ResourceAttributionSchema.optional(),
  previewKey: z.string().optional(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "any"]).optional(),
  subCategory: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  useCase: z.string().optional(),
  madeFor: z.string().optional(),
  whereToUse: z.string().optional(),
});

export type LibraryResource = z.infer<typeof LibraryResourceSchema>;

export interface ResourceApplyOptions {
  timestamp: number;
  position?: { x: number; y: number };
  duration?: number;
  customProps?: Record<string, any>;
  targetClipAId?: string;
  targetClipBId?: string;
  text?: string;
  targetCaptionId?: string;
  existingCaptions?: any[];
  applyToAllCaptions?: boolean;
}

export interface ResourceApplyResult {
  success: boolean;
  operation?: EditOperation;
  error?: string;
}
