import { 
  SceneDefinition, 
  SceneResolutionContext, 
  ResolvedSceneGraph, 
  ResolvedSceneElement 
} from './scene.types';
import { selectAsset } from '../assets/assets.selection';
import { resolvePlacement, PlacementContext } from '../placement/placement.resolve';
import { resolveRelationships } from '../relationships/relationships.solver';
import { validateComposition, canRenderComposition, UpstreamDiagnostic } from '../validation';
import { PlacementRequest, ResolvedPlacement } from '../placement/placement.types';
import { AssetDefinition } from '../assets/assets.types';
import { applyAutoPositioning } from '../layout/layout.auto';
import { getAnchorOffset } from '../layout/layout.utils';
import { resolveTheme } from '../themes/theme.registry';
import { resolveDesignTokens, validateDesignTokens } from '../themes/tokens.resolver';
import { resolveTypography, validateTextLayout } from '../typography/typography.resolver';
import { fitText } from '../typography/typography.measure';
import { resolveAttentionInstructions } from '../attention/attention.resolve';
import { ResolvedAttentionSequence } from '../attention/attention.types';
import { resolveImageMedia } from '../media/image/image.resolver';
import { resolveVideoMedia } from '../media/video/video.resolver';
import { resolveAudioTrack } from '../media/audio/audio.resolver';
import { ResolvedAudioTrack } from '../media/audio/audio.types';
import { resolveCaptionTrack } from '../media/caption/caption.resolver';

export function resolveSceneGraph(
  scene: SceneDefinition,
  context: SceneResolutionContext
): ResolvedSceneGraph {
  
  const upstreamDiagnostics: UpstreamDiagnostic[] = [];
  
  // 0. Theme Resolution
  const resolvedTheme = resolveTheme(scene.themeId, scene.themeOverrides);
  const resolvedTokens = resolveDesignTokens(resolvedTheme, scene.tokenOverrides);
  
  const tokenDiagnostics = validateDesignTokens(resolvedTokens);

  const activePlacements: ResolvedPlacement[] = [];
  const resolvedAssets = new Map<string, AssetDefinition>();
  const elementTimingMap = new Map<string, { startFrame: number; durationInFrames: number; endFrame: number }>();
  
  // Track Layer Fallbacks based on original array index
  const elementLayerMap = new Map<string, number>();

  // 1. Asset Selection, Initial Timing, and Base Geometry Resolution
  for (let i = 0; i < scene.elements.length; i++) {
    const el = scene.elements[i];
    
    // Layer default
    elementLayerMap.set(el.id, el.layer !== undefined ? el.layer : i);

    // Timing extraction
    const startFrame = el.timing?.startFrame || 0;
    const durationInFrames = el.timing?.durationInFrames || context.fps * 2; // Default 2 seconds if missing
    const endFrame = startFrame + durationInFrames;
    elementTimingMap.set(el.id, { startFrame, durationInFrames, endFrame });

    // Asset Resolution
    let assetId = el.assetId;
    if (!assetId && el.assetRequest) {
      const { asset } = selectAsset(el.assetRequest);
      if (asset) {
        assetId = asset.id;
        resolvedAssets.set(el.id, asset);
      } else {
        upstreamDiagnostics.push({
          reason: 'asset-resolution-failed',
          severity: 'error',
          elementIds: [el.id],
          message: `Failed to resolve asset for request: ${JSON.stringify(el.assetRequest)}`
        } as any);
        continue;
      }
    } else if (assetId) {
      resolvedAssets.set(el.id, { id: assetId, type: 'unknown', tags: [], capabilities: [] });
    } else if (el.type === 'text') {
      // Text elements don't strictly require an assetId for the initial placement
      // because they have geometry determined by text measurement.
    } else if (el.type === 'image') {
      // Images rely on imageConfig.src and have their own media definitions.
    } else if (el.type === 'video') {
      // Videos rely on videoConfig.src and have their own media definitions.
    } else if (el.type === 'caption') {
      // Captions rely on captionConfig.
    } else {
      upstreamDiagnostics.push({
        reason: 'missing-asset-definition',
        severity: 'error',
        elementIds: [el.id],
        message: 'Element missing both assetId and assetRequest.'
      } as any);
      continue;
    }

    // 1.5 Text Layout Resolution
    let resolvedTextMeasurement = undefined;
    let resolvedTextConfig = undefined;
    let fullTextContent = el.textContent || (el.textSegments ? el.textSegments.map(s => s.text).join('') : undefined);

    if (el.type === 'text' && fullTextContent) {
      resolvedTextConfig = el.textConfig || {};
      const typography = resolveTypography(resolvedTextConfig.role as any, resolvedTokens, resolvedTextConfig as any);
      const textDiagnostics = validateTextLayout(typography);
      if (textDiagnostics.length > 0) {
        upstreamDiagnostics.push(...textDiagnostics);
      }
      
      const measurement = fitText(fullTextContent, typography, resolvedTextConfig);
      resolvedTextMeasurement = measurement;
      
      if (measurement.reason) {
        upstreamDiagnostics.push({
          type: 'text-overflow',
          severity: 'warning',
          elementIds: [el.id],
          message: `Text overflowed constraints: ${measurement.reason}`
        } as any);
      }
    }

    // 1.7 Image Resolution
    let resolvedImageConfig = undefined;
    if (el.type === 'image') {
      const imgRes = resolveImageMedia(el.imageConfig, el.id);
      resolvedImageConfig = imgRes.resolved;
      if (imgRes.diagnostics.length > 0) {
        upstreamDiagnostics.push(...imgRes.diagnostics);
      }
    }

    // 1.8 Video Resolution
    let resolvedVideoConfig = undefined;
    if (el.type === 'video') {
      const vidRes = resolveVideoMedia(el.videoConfig, el.id);
      resolvedVideoConfig = vidRes.resolved;
      if (vidRes.diagnostics.length > 0) {
        upstreamDiagnostics.push(...vidRes.diagnostics);
      }
    }

    // 1.9 Caption Resolution
    let resolvedCaptionConfig = undefined;
    if (el.type === 'caption') {
      if (el.captionConfig) {
        const capRes = resolveCaptionTrack(el.captionConfig, scene.durationInFrames || 0);
        resolvedCaptionConfig = capRes.resolved;
        if (capRes.diagnostics.length > 0) {
          upstreamDiagnostics.push(...capRes.diagnostics);
        }

        // We must also measure the captions to reserve layout space.
        // We find the max width/height across all cues to ensure layout stability.
        resolvedTextConfig = el.textConfig || { role: 'caption' };
        const typography = resolveTypography(resolvedTextConfig.role as any, resolvedTokens, resolvedTextConfig as any);
        
        let maxWidth = 0;
        let maxHeight = 0;
        
        if (resolvedCaptionConfig) {
          for (const cue of resolvedCaptionConfig.cues) {
            const measurement = fitText(cue.text, typography, resolvedTextConfig as any);
            if (measurement.width > maxWidth) maxWidth = measurement.width;
            if (measurement.height > maxHeight) maxHeight = measurement.height;
          }
        }
        
        // Mock a text measurement result so the auto-positioner reserves space
        resolvedTextMeasurement = {
          width: maxWidth,
          height: maxHeight,
          lines: [], // Not used for auto positioning
          fontSize: typography.fontSize
        };
      }
    }

    // 2. Initial Placement Resolution (Base Geometry)
    const placementReq: PlacementRequest = {
      ...(el.placement || { positionMode: 'auto' }),
      assetId: assetId || el.id
    };
    
    // Inject text dimensions into placement request if it's a text element
    if (resolvedTextMeasurement) {
      if (!placementReq.size) placementReq.size = { width: resolvedTextMeasurement.width, height: resolvedTextMeasurement.height }; else { placementReq.size.width = resolvedTextMeasurement.width; placementReq.size.height = resolvedTextMeasurement.height; }
    } else if (resolvedImageConfig && resolvedImageConfig.metadata) {
      // If image has intrinsic metadata, we can optionally use it for default sizing
      // But typically placement.size overrides this anyway.
      if (!placementReq.size) placementReq.size = { width: resolvedImageConfig.metadata.width as number, height: resolvedImageConfig.metadata.height as number }; else { if (resolvedImageConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedImageConfig.metadata.width as number; if (resolvedImageConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedImageConfig.metadata.height as number; }
    } else if (resolvedVideoConfig && resolvedVideoConfig.metadata) {
      if (!placementReq.size) placementReq.size = { width: resolvedVideoConfig.metadata.width as number, height: resolvedVideoConfig.metadata.height as number }; else { if (resolvedVideoConfig.metadata.width && !placementReq.size.width) placementReq.size.width = resolvedVideoConfig.metadata.width as number; if (resolvedVideoConfig.metadata.height && !placementReq.size.height) placementReq.size.height = resolvedVideoConfig.metadata.height as number; }
    }
    
    const placementContext: PlacementContext = {
      assets: Array.from(resolvedAssets.values()),
      existingPlacements: activePlacements,
      safeZones: scene.safeZones || [],
      canvas: context.canvas
    };

    const placement = resolvePlacement(placementReq, placementContext);
    placement.id = el.id;
    
    // Stash the properties on the placement temporarily so we can map them back later
    (placement as any)._textMeasurement = resolvedTextMeasurement;
    (placement as any)._textConfig = resolvedTextConfig;
    (placement as any)._textContent = fullTextContent;
    (placement as any)._textSegments = el.textSegments;
    (placement as any)._imageConfig = resolvedImageConfig;
    (placement as any)._videoConfig = resolvedVideoConfig;
    (placement as any)._captionConfig = resolvedCaptionConfig;
    (placement as any)._type = el.type || 'asset';

    activePlacements.push(placement);
    
    if (placement.diagnostics) {
      upstreamDiagnostics.push(...placement.diagnostics);
      delete placement.diagnostics;
    }
  }

  // 3. Relationships Resolution (Compute relative offsets first)
  let finalPlacements = activePlacements;
  if (scene.relationships && scene.relationships.length > 0) {
    const relResult = resolveRelationships(activePlacements, scene.relationships);
    finalPlacements = relResult.placements;
    upstreamDiagnostics.push(...relResult.diagnostics);
  }

  // 4. Cluster-Based Auto Positioning
  // Instead of auto-positioning individual elements (which breaks relationships and centering),
  // we group interconnected elements into structural clusters, find their bounding box,
  // auto-position the bounding box (centering it on screen), and then shift the elements.
  
  const adjacency = new Map<string, string[]>();
  for (const p of finalPlacements) adjacency.set(p.id, []);
  if (scene.relationships) {
    for (const rel of scene.relationships) {
      if (adjacency.has(rel.sourceId) && adjacency.has(rel.targetId)) {
        adjacency.get(rel.sourceId)!.push(rel.targetId);
        adjacency.get(rel.targetId)!.push(rel.sourceId);
      }
    }
  }

  const visited = new Set<string>();
  const virtualElements: any[] = [];
  const clusterData: any[] = [];
  let clusterIndex = 0;

  for (const p of finalPlacements) {
    if (!visited.has(p.id)) {
      const cluster: ResolvedPlacement[] = [];
      const queue = [p.id];
      visited.add(p.id);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        cluster.push(finalPlacements.find(x => x.id === curr)!);
        for (const neighbor of adjacency.get(curr)!) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      const isAuto = cluster.some(el => el.positionMode === 'auto');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const el of cluster) {
        const offset = getAnchorOffset(el.width, el.height, el.anchor);
        const absX = el.x + offset.x;
        const absY = el.y + offset.y;
        minX = Math.min(minX, absX);
        minY = Math.min(minY, absY);
        maxX = Math.max(maxX, absX + el.width);
        maxY = Math.max(maxY, absY + el.height);
      }

      if (isAuto) {
        const virtualId = `cluster_${clusterIndex++}`;
        virtualElements.push({
          id: virtualId,
          positionMode: 'auto',
          anchor: 'top-left', // We track the cluster by its top-left bounds
          width: maxX - minX,
          height: maxY - minY,
          x: minX,
          y: minY,
          safeZoneId: cluster[0].safeZoneId
        });
        
        clusterData.push({ cluster, isAuto, initialMinX: minX, initialMinY: minY, virtualId });
      } else {
        clusterData.push({ cluster, isAuto: false });
      }
    }
  }

  const autoLayout = applyAutoPositioning(
    {
      elements: virtualElements,
      width: context.canvas.width,
      height: context.canvas.height,
      safeZones: scene.safeZones || []
    },
    { alignment: 'center', direction: 'vertical', gap: 60 } // Default centering for scene clusters
  );
  
  if (autoLayout.diagnostics.overflow) {
    upstreamDiagnostics.push({
      severity: 'warning',
      reason: 'layout-overflow',
      message: 'Auto positioning caused layout overflow.'
    } as any);
  }
  
  // Shift elements based on cluster AutoPositioning results
  for (const data of clusterData) {
    if (data.isAuto) {
      const virtualRes = autoLayout.layout.elements.find((e: any) => e.id === data.virtualId);
      if (virtualRes) {
        const dx = virtualRes.x - data.initialMinX;
        const dy = virtualRes.y - data.initialMinY;
        
        for (const el of data.cluster) {
          el.x += dx;
          el.y += dy;
          el.positionMode = 'absolute';
        }
      }
    }
  }

  // 5. Composition Validation & Auto-Repair
  const validationConfig = { autoRepair: context.autoRepair, repairOverflow: true, allowClamping: true };
  const validationResult = validateComposition(
    finalPlacements,
    context.canvas,
    validationConfig,
    upstreamDiagnostics,
    scene.safeZones || []
  );

  // 5. Final Output Mapping & Scene Duration Calc
  const elements: ResolvedSceneElement[] = [];
  let calculatedSceneEndFrame = 0;

  for (const placement of validationResult.placements) {
    const originalEl = scene.elements.find(e => e.id === placement.id)!;
    const timing = elementTimingMap.get(placement.id)!;
    const layer = elementLayerMap.get(placement.id)!;

    if (timing.endFrame > calculatedSceneEndFrame) {
      calculatedSceneEndFrame = timing.endFrame;
    }

    elements.push({
      id: placement.id,
      type: (placement as any)._type || 'asset',
      assetId: placement.assetId,
      textContent: (placement as any)._textContent,
      textSegments: (placement as any)._textSegments,
      textConfig: (placement as any)._textConfig,
      textMeasurement: (placement as any)._textMeasurement,
      imageConfig: (placement as any)._imageConfig,
      videoConfig: (placement as any)._videoConfig,
      captionConfig: (placement as any)._captionConfig,
      geometry: {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height
      },
      anchor: placement.anchor || 'center',
      timing,
      layer,
      animation: originalEl.animation
    });
  }

  const finalDuration = scene.durationInFrames !== undefined ? scene.durationInFrames : calculatedSceneEndFrame;

  // Render Gate checking
  const valid = canRenderComposition(validationResult);

  // 6. Audio Resolution
  const resolvedAudio: ResolvedAudioTrack[] = [];
  const audioDiagnostics: any[] = [];
  if (scene.audio) {
    for (const audioDef of scene.audio) {
      const res = resolveAudioTrack(audioDef, finalDuration);
      if (res.resolved) resolvedAudio.push(res.resolved);
      audioDiagnostics.push(...res.diagnostics);
    }
  }

  // 7. Attention Resolution
  let resolvedAttention: ResolvedAttentionSequence = { instructions: [], diagnostics: [] };
  
  const baseSceneGraph: ResolvedSceneGraph = {
    id: scene.id,
    width: context.canvas.width,
    height: context.canvas.height,
    fps: context.fps,
    durationInFrames: finalDuration,
    theme: resolvedTheme,
    tokens: resolvedTokens,
    elements: elements.sort((a, b) => a.layer - b.layer),
    attention: resolvedAttention,
    audio: resolvedAudio,
    diagnostics: [...validationResult.diagnostics, ...tokenDiagnostics, ...audioDiagnostics],
    valid: valid && tokenDiagnostics.length === 0 && audioDiagnostics.filter(d => d.severity === 'error').length === 0
  };

  if (scene.attention && scene.attention.length > 0) {
    resolvedAttention = resolveAttentionInstructions(scene.attention, baseSceneGraph, { mode: 'exclusive' });
    baseSceneGraph.attention = resolvedAttention;
    baseSceneGraph.diagnostics.push(...resolvedAttention.diagnostics.map(d => ({
      severity: d.severity,
      reason: 'attention-diagnostic',
      message: d.message
    } as any)));
  }

  return baseSceneGraph;
}
