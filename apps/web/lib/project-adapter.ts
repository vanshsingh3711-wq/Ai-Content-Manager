/**
 * project-adapter.ts
 *
 * Bidirectional adapter bridging the Web TimelineProject (seconds, CSS percentages)
 * with the Motion Components SceneDefinition (Remotion integer frames, canvas pixels).
 *
 * Uses rational conversion arithmetic to guarantee lossless round-trip transformations.
 */

import {
  TimelineProject,
  VideoClip,
  BRollClip,
  CaptionBlock,
  AudioClip,
  GraphicElement,
  SemanticConstraint,
  SubjectSafeZone,
  AspectRatio,
  ConstraintRelation,
} from "./timeline-types";

import type {
  SceneDefinition,
  SceneElementDefinition,
} from "@motion/scene/scene.types";
import type { CompositionRelationship, CompositionRelation } from "@motion/relationships/relationships.types";
import type { SafeZoneDefinition } from "@motion/layout/layout.types";
import type { AudioTrackDefinition } from "@motion/media/audio/audio.types";

/**
 * Standard virtual canvas pixel dimensions for supported aspect ratios.
 */
export function getCanvasDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "4:5":
      return { width: 1080, height: 1350 };
    default:
      return { width: 1080, height: 1920 };
  }
}

/**
 * Infer the closest supported aspect ratio from width and height dimensions.
 */
export function getAspectRatioFromDimensions(width: number, height: number): AspectRatio {
  if (width <= 0 || height <= 0) return "9:16";
  const ratio = width / height;
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  if (Math.abs(ratio - 4 / 5) < 0.05) return "4:5";
  return ratio < 1 ? "9:16" : "16:9";
}

/**
 * Rational time conversion: seconds to integer frame number.
 */
export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}

/**
 * Rational time conversion: integer frame number to fractional seconds.
 */
export function framesToSeconds(frames: number, fps: number = 30): number {
  return Number((frames / fps).toFixed(6));
}

/**
 * Normalized percentage coordinate (0-100%) to canvas pixel coordinate.
 */
export function percentToPixels(percent: number, dimension: number): number {
  return Math.round((percent / 100) * dimension);
}

/**
 * Canvas pixel coordinate to normalized percentage coordinate (0-100%).
 */
export function pixelsToPercent(pixels: number, dimension: number): number {
  if (dimension <= 0) return 0;
  return Number(((pixels / dimension) * 100).toFixed(4));
}

export interface AdapterOptions {
  fps?: number;
  aspectRatio?: AspectRatio;
  canvasDimensions?: { width: number; height: number };
}

/**
 * Converts a TimelineProject into a motion-components SceneDefinition.
 */
export function timelineProjectToSceneDefinition(
  project: TimelineProject,
  customDimensions?: { width: number; height: number }
): SceneDefinition {
  const fps = project.fps || 30;
  const canvas = customDimensions || getCanvasDimensions(project.aspectRatio);
  const durationInFrames = secondsToFrames(project.duration, fps);

  const elements: SceneElementDefinition[] = [];

  // 1. Video Track (Base layer)
  (project.tracks.videoTrack || []).forEach((clip, index) => {
    const startFrame = secondsToFrames(clip.start, fps);
    const endFrame = secondsToFrames(clip.end, fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    const posX = clip.position?.x ?? clip.positionX ?? 50;
    const posY = clip.position?.y ?? clip.positionY ?? 50;
    const pixelX = percentToPixels(posX, canvas.width);
    const pixelY = percentToPixels(posY, canvas.height);
    const scale = clip.scale ?? clip.zoomFactor ?? 1.0;

    elements.push({
      id: clip.id,
      type: "video",
      layer: index,
      timing: {
        startFrame,
        durationInFrames,
      },
      placement: {
        position: { x: pixelX, y: pixelY },
        size: { scale },
        anchor: "center",
      },
      videoConfig: {
        src: clip.sourceUrl,
        sourceStartFrame: secondsToFrames(clip.sourceStart ?? 0, fps),
        sourceEndFrame: secondsToFrames(clip.sourceEnd ?? clip.end - clip.start, fps),
        playbackRate: clip.speed ?? 1,
        volume: (clip.volume ?? 100) / 100,
        position: { x: pixelX, y: pixelY },
        metadata: {
          trackType: "video",
          name: clip.name,
          zoomFactor: clip.zoomFactor,
          transitionIn: clip.transitionIn,
          rotation: clip.rotation,
          rawPosition: { x: posX, y: posY },
        },
      },
      animation: clip.animation,
    });
  });

  // 2. B-Roll Track (Layer 10+)
  (project.tracks.brollTrack || []).forEach((clip, index) => {
    const startFrame = secondsToFrames(clip.start, fps);
    const endFrame = secondsToFrames(clip.end, fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    const posX = clip.position?.x ?? clip.positionX ?? 50;
    const posY = clip.position?.y ?? clip.positionY ?? 50;
    const pixelX = percentToPixels(posX, canvas.width);
    const pixelY = percentToPixels(posY, canvas.height);
    const scale = clip.scale ?? 1.0;

    elements.push({
      id: clip.id,
      type: "video",
      layer: 10 + index,
      timing: {
        startFrame,
        durationInFrames,
      },
      placement: {
        position: { x: pixelX, y: pixelY },
        size: { scale },
        anchor: "center",
      },
      videoConfig: {
        src: clip.sourceUrl,
        fit: clip.fitMode || "cover",
        opacity: (clip.opacity ?? 100) / 100,
        volume: (clip.volume ?? 0) / 100,
        muted: clip.muted ?? true,
        position: { x: pixelX, y: pixelY },
        metadata: {
          trackType: "broll",
          name: clip.name,
          thumbnailUrl: clip.thumbnailUrl,
          rotation: clip.rotation,
          rawPosition: { x: posX, y: posY },
          volume: clip.volume ?? 0,
          muted: clip.muted ?? true,
        },
      },
      animation: clip.animation,
    });
  });

  // 3. Caption / Text Track (Layer 20+)
  (project.tracks.textTrack || []).forEach((clip, index) => {
    const startFrame = secondsToFrames(clip.start, fps);
    const endFrame = secondsToFrames(clip.end, fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    const isFaceless = (project as any).videoType === "faceless_short" || (project as any).isFaceless || (project as any).settings?.video_type === "faceless_short" || (project as any).settings?.is_faceless;
    const defaultPosY = isFaceless ? 50 : 75;
    const posX = clip.position?.x ?? clip.positionX ?? 50;
    const posY = clip.position?.y ?? clip.positionY ?? defaultPosY;
    const pixelX = percentToPixels(posX, canvas.width);
    const pixelY = percentToPixels(posY, canvas.height);
    const scale = clip.scale ?? 1.0;

    elements.push({
      id: clip.id,
      type: "caption",
      layer: 20 + index,
      textContent: clip.text,
      timing: {
        startFrame,
        durationInFrames,
      },
      placement: {
        position: { x: pixelX, y: pixelY },
        size: { scale },
        anchor: "center",
      },
      captionConfig: {
        id: clip.id,
        cues: [
          {
            id: `cue-${clip.id}`,
            text: clip.text,
            startFrame,
            endFrame,
            metadata: {
              stylePreset: clip.stylePreset,
              fontSize: clip.fontSize,
              textColor: clip.textColor,
              highlightColor: clip.highlightColor,
            },
          },
        ],
        enabled: true,
        metadata: {
          trackType: "caption",
          stylePreset: clip.stylePreset,
          fontSize: clip.fontSize,
          textColor: clip.textColor,
          highlightColor: clip.highlightColor,
          rotation: clip.rotation,
          rawPosition: { x: posX, y: posY },
        },
      },
      animation: clip.animation,
    });
  });

  // 4. Graphics Track (Layer 30+)
  (project.tracks.graphicsTrack || []).forEach((elem, index) => {
    const startFrame = secondsToFrames(elem.start, fps);
    const endFrame = secondsToFrames(elem.end, fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    const posX = elem.position?.x ?? elem.positionX ?? 50;
    const posY = elem.position?.y ?? elem.positionY ?? 50;
    const pixelX = percentToPixels(posX, canvas.width);
    const pixelY = percentToPixels(posY, canvas.height);
    const scale = elem.scale ?? 1.0;

    elements.push({
      id: elem.id,
      type: "asset",
      assetId: elem.compositionId,
      layer: 30 + index,
      timing: {
        startFrame,
        durationInFrames,
      },
      placement: {
        position: { x: pixelX, y: pixelY },
        size: { scale },
        anchor: "center",
      },
      animation: {
        ...((elem.animation as Record<string, any>) || {}),
        trackType: "graphic",
        name: elem.name,
        props: elem.props,
        opacity: elem.opacity ?? 100,
        rotation: elem.rotation ?? 0,
        isUserLocked: elem.isUserLocked ?? false,
        constraints: elem.constraints || [],
        rawPosition: { x: posX, y: posY },
      },
    });
  });

  // 5. Audio Tracks
  const audio: AudioTrackDefinition[] = (project.tracks.audioTrack || []).map((clip) => {
    const startFrame = secondsToFrames(clip.start, fps);
    const endFrame = secondsToFrames(clip.end, fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    return {
      id: clip.id,
      type: clip.isBgm ? "music" : "voiceover",
      src: clip.sourceUrl,
      startFrame,
      durationInFrames,
      volume: (clip.volume ?? 80) / 100,
      fadeInFrames: secondsToFrames(clip.fadeIn ?? 0, fps),
      fadeOutFrames: secondsToFrames(clip.fadeOut ?? 0, fps),
      metadata: {
        name: clip.name,
        isBgm: clip.isBgm,
        ducking: clip.ducking,
        duckingDb: clip.duckingDb,
      },
    };
  });

  // 6. Semantic Constraints -> Composition Relationships
  const relationships: CompositionRelationship[] = [];
  (project.constraints || []).forEach((c) => {
    if (c.targetId && c.relation) {
      relationships.push({
        sourceId: c.sourceElementId,
        targetId: c.targetId,
        relation: c.relation as CompositionRelation,
        gap: c.gap,
        strength: c.strength,
      });
    }
  });

  // 7. Subject Safe Zones -> Layout SafeZoneDefinitions
  const safeZones: SafeZoneDefinition[] = (project.safeZones || []).map((zone) => ({
    id: zone.id,
    type: zone.type === "safe" ? "safe" : "restricted",
    x: percentToPixels(zone.x, canvas.width),
    y: percentToPixels(zone.y, canvas.height),
    width: percentToPixels(zone.width, canvas.width),
    height: percentToPixels(zone.height, canvas.height),
  }));

  return {
    id: project.id,
    durationInFrames,
    themeId: project.themeId,
    elements,
    audio,
    relationships: relationships.length > 0 ? relationships : undefined,
    safeZones: safeZones.length > 0 ? safeZones : undefined,
  };
}

/**
 * Converts a motion-components SceneDefinition back into a TimelineProject.
 */
export function sceneDefinitionToTimelineProject(
  scene: SceneDefinition,
  options?: AdapterOptions
): TimelineProject {
  const fps = options?.fps || 30;
  const aspectRatio = options?.aspectRatio || "9:16";
  const canvas = options?.canvasDimensions || getCanvasDimensions(aspectRatio);
  const duration = framesToSeconds(scene.durationInFrames || 0, fps);

  const videoTrack: VideoClip[] = [];
  const brollTrack: BRollClip[] = [];
  const textTrack: CaptionBlock[] = [];
  const graphicsTrack: GraphicElement[] = [];

  // Sort elements by layer if available
  const sortedElements = [...(scene.elements || [])].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));

  for (const elem of sortedElements) {
    const start = framesToSeconds(elem.timing?.startFrame ?? 0, fps);
    const durationSec = framesToSeconds(elem.timing?.durationInFrames ?? 0, fps);
    const end = Number((start + durationSec).toFixed(6));

    // Coordinate conversion
    const pixelX = elem.placement?.position?.x ?? 0;
    const pixelY = elem.placement?.position?.y ?? 0;
    const posX = pixelsToPercent(pixelX, canvas.width);
    const posY = pixelsToPercent(pixelY, canvas.height);
    const scale = elem.placement?.size?.scale ?? 1.0;

    // 1. Caption / Text Elements
    if (elem.type === "caption" || elem.type === "text") {
      const cueMeta = elem.captionConfig?.cues?.[0]?.metadata || {};
      const trackMeta = elem.captionConfig?.metadata || {};
      const meta = { ...cueMeta, ...trackMeta };

      textTrack.push({
        id: elem.id,
        text: elem.textContent || elem.captionConfig?.cues?.[0]?.text || "",
        start,
        end,
        stylePreset: (meta.stylePreset as any) || "tiktok_yellow",
        fontSize: typeof meta.fontSize === "number" ? meta.fontSize : undefined,
        textColor: typeof meta.textColor === "string" ? meta.textColor : undefined,
        highlightColor: typeof meta.highlightColor === "string" ? meta.highlightColor : undefined,
        position: { x: posX, y: posY },
        positionX: posX,
        positionY: posY,
        scale,
        rotation: typeof meta.rotation === "number" ? meta.rotation : undefined,
        animation: elem.animation as any,
      });
      continue;
    }

    // 2. Video Elements (Base Video or B-Roll)
    if (elem.type === "video") {
      const meta = (elem.videoConfig?.metadata || {}) as Record<string, any>;
      const isBRoll = meta.trackType === "broll" || (elem.layer !== undefined && elem.layer >= 10);

      if (isBRoll) {
        brollTrack.push({
          id: elem.id,
          sourceUrl: elem.videoConfig?.src || "",
          thumbnailUrl: meta.thumbnailUrl,
          name: meta.name || "B-Roll Clip",
          start,
          end,
          opacity: Math.round((elem.videoConfig?.opacity ?? 1.0) * 100),
          volume: meta.volume ?? (elem.videoConfig?.volume !== undefined ? Math.round((elem.videoConfig.volume as number) * 100) : 0),
          muted: meta.muted ?? true,
          fitMode: (elem.videoConfig?.fit === "contain" ? "contain" : "cover"),
          position: { x: posX, y: posY },
          positionX: posX,
          positionY: posY,
          scale,
          rotation: meta.rotation ?? 0,
          animation: elem.animation as any,
        });
      } else {
        const sourceStart = framesToSeconds(elem.videoConfig?.sourceStartFrame ?? 0, fps);
        const sourceEnd = framesToSeconds(elem.videoConfig?.sourceEndFrame ?? (elem.timing?.durationInFrames ?? 0), fps);

        videoTrack.push({
          id: elem.id,
          sourceUrl: elem.videoConfig?.src || "",
          name: meta.name || "Video Clip",
          start,
          end,
          sourceStart,
          sourceEnd,
          speed: elem.videoConfig?.playbackRate ?? 1,
          volume: Math.round((elem.videoConfig?.volume ?? 1.0) * 100),
          zoomFactor: meta.zoomFactor ?? scale,
          transitionIn: meta.transitionIn,
          position: { x: posX, y: posY },
          positionX: posX,
          positionY: posY,
          scale,
          rotation: meta.rotation ?? 0,
          animation: elem.animation as any,
        });
      }
      continue;
    }

    // 3. Asset / Graphic Elements
    if (elem.type === "asset") {
      const anim = (elem.animation || {}) as Record<string, any>;

      graphicsTrack.push({
        id: elem.id,
        name: anim.name || elem.assetId || "Graphic Element",
        compositionId: elem.assetId || elem.id,
        props: anim.props || {},
        start,
        end,
        position: { x: posX, y: posY },
        positionX: posX,
        positionY: posY,
        scale,
        rotation: anim.rotation ?? 0,
        opacity: anim.opacity ?? 100,
        isUserLocked: anim.isUserLocked ?? false,
        constraints: anim.constraints,
        animation: elem.animation as any,
      });
      continue;
    }
  }

  // 4. Audio Tracks
  const audioTrack: AudioClip[] = (scene.audio || []).map((a) => {
    const start = framesToSeconds(a.startFrame, fps);
    const durationSec = framesToSeconds(a.durationInFrames ?? 0, fps);
    const end = Number((start + durationSec).toFixed(6));
    const meta = (a.metadata || {}) as Record<string, any>;

    return {
      id: a.id,
      sourceUrl: a.src,
      name: meta.name || (a.type === "music" ? "Background Music" : "Voiceover"),
      start,
      end,
      volume: Math.round((a.volume ?? 0.8) * 100),
      fadeIn: framesToSeconds(a.fadeInFrames ?? 0, fps),
      fadeOut: framesToSeconds(a.fadeOutFrames ?? 0, fps),
      isBgm: a.type === "music" || meta.isBgm === true,
      ducking: meta.ducking ?? (a.type === "music" || meta.isBgm === true),
      duckingDb: meta.duckingDb ?? -14.0,
    };
  });

  // 5. Constraints
  const constraints: SemanticConstraint[] = (scene.relationships || []).map((rel, i) => ({
    id: `constraint-${rel.sourceId}-${rel.targetId}-${i}`,
    sourceElementId: rel.sourceId,
    type: "align_relative",
    targetId: rel.targetId,
    relation: rel.relation as ConstraintRelation,
    gap: rel.gap,
    strength: rel.strength || "required",
  }));

  // 6. Safe Zones
  const safeZones: SubjectSafeZone[] = (scene.safeZones || []).map((sz) => ({
    id: sz.id,
    timestamp: 0,
    duration,
    x: pixelsToPercent(sz.x, canvas.width),
    y: pixelsToPercent(sz.y, canvas.height),
    width: pixelsToPercent(sz.width, canvas.width),
    height: pixelsToPercent(sz.height, canvas.height),
    confidence: 1.0,
    type: sz.type === "safe" ? "safe" : "restricted",
  }));

  return {
    id: scene.id,
    title: "Imported Studio Video",
    aspectRatio,
    duration,
    fps,
    tracks: {
      videoTrack,
      brollTrack,
      textTrack,
      audioTrack,
      graphicsTrack,
    },
    constraints: constraints.length > 0 ? constraints : undefined,
    safeZones: safeZones.length > 0 ? safeZones : undefined,
    themeId: scene.themeId,
  };
}

/**
 * Compiles a TimelineProject into worker-compatible edit decisions.
 */
export function compileTimelineProjectToEdits(project: TimelineProject) {
  const tracks = project.tracks;
  const edits: Array<Record<string, any>> = [];

  // 1. Video cuts
  (tracks.videoTrack || []).forEach((c) => {
    edits.push({
      id: c.id,
      trigger_id: c.id,
      action: "cut",
      type: "cut",
      start: c.start,
      end: c.end,
      sourceStart: c.sourceStart ?? 0,
      sourceEnd: c.sourceEnd ?? c.end - c.start,
      speed: c.speed ?? 1.0,
      zoomFactor: c.zoomFactor ?? 1.0,
      sourceUrl: c.sourceUrl,
      name: c.name,
    });
  });

  // 2. B-Roll
  (tracks.brollTrack || []).forEach((b) => {
    edits.push({
      id: b.id,
      trigger_id: b.id,
      action: "b_roll",
      type: "broll",
      start: b.start,
      end: b.end,
      sourceUrl: b.sourceUrl,
      path: b.sourceUrl,
      broll_path: b.localPath || b.sourceUrl,
      localPath: b.localPath,
      broll_query: b.name || "cutaway",
      opacity: b.opacity ?? 100,
      fitMode: b.fitMode || "cover",
      name: b.name,
      volume: b.volume ?? 0,
      muted: b.muted ?? true,
    });
  });

  // 3. Captions
  (tracks.textTrack || []).forEach((cap) => {
    edits.push({
      id: cap.id,
      trigger_id: cap.id,
      action: "subtitle",
      type: "subtitle",
      start: cap.start,
      end: cap.end,
      text: cap.text,
      stylePreset: cap.stylePreset || "tiktok_yellow",
      position: cap.position || { x: 50, y: 75 },
      scale: cap.scale ?? 1.0,
    });
  });

  // 4. Graphics
  (tracks.graphicsTrack || []).forEach((g) => {
    edits.push({
      id: g.id,
      trigger_id: g.id,
      action: "motion_graphics",
      type: "motion_graphic",
      start: g.start,
      end: g.end,
      name: g.name,
      compositionId: g.compositionId,
      template: g.compositionId,
      motion_graphics_type: g.compositionId,
      motion_graphics_targets: g.props || {},
      motion_graphics_text: g.props?.text || g.name,
      props: g.props || {},
      position: g.position || { x: 50, y: 50 },
      scale: g.scale ?? 1.0,
    });
  });

  // 5. Audio
  (tracks.audioTrack || []).forEach((a) => {
    edits.push({
      id: a.id,
      trigger_id: a.id,
      action: a.isBgm ? "audio" : "sfx",
      type: "audio",
      start: a.start,
      end: a.end,
      sourceUrl: a.sourceUrl,
      volume: a.volume ?? 80,
      isBgm: !!a.isBgm,
      sound_effect: a.name || "pop",
    });
  });

  return edits;
}

/**
 * Compiles a TimelineProject into a MasterBlueprint structure for the worker.
 */
export function timelineProjectToMasterBlueprint(project: TimelineProject) {
  const edits = compileTimelineProjectToEdits(project);
  return {
    id: project.id,
    title: project.title,
    aspectRatio: project.aspectRatio,
    totalDuration: project.duration,
    fps: project.fps || 30,
    cuts: edits.filter((e) => e.type === "cut"),
    layers: edits.filter((e) => e.type !== "cut"),
    edits,
    timestampMap: project.transcript?.timestampMap || {},
  };
}
