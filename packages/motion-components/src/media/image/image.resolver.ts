import { ImageMediaConfig, ResolvedImageMediaConfig, ImageFitMode, ImagePosition } from './image.types';
import { CompositionDiagnostic } from '../../validation/validation.types';

export function resolveImageMedia(
  config: ImageMediaConfig | undefined,
  elementId: string
): { resolved: ResolvedImageMediaConfig | undefined; diagnostics: CompositionDiagnostic[] } {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!config) {
    diagnostics.push({
      elementIds: [elementId],
      type: 'missing-metadata',
      severity: 'error',
      message: `Image media configuration is missing for element ${elementId}.`,
    });
    return { resolved: undefined, diagnostics };
  }

  if (!config.src || config.src.trim() === '') {
    diagnostics.push({
      elementIds: [elementId],
      type: 'missing-metadata',
      severity: 'error',
      message: `Image source (src) is required but was empty for element ${elementId}.`,
    });
    return { resolved: undefined, diagnostics };
  }

  // Validate and default fit mode
  const validFitModes: ImageFitMode[] = ['contain', 'cover', 'fill', 'none'];
  let fit: ImageFitMode = 'contain'; // Project default
  if (config.fit) {
    if (validFitModes.includes(config.fit)) {
      fit = config.fit;
    } else {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'warning',
        message: `Invalid image fit mode "${config.fit}" for element ${elementId}. Falling back to default "contain".`,
      });
    }
  }

  // Validate and default focal position
  let position: ImagePosition = { x: 0.5, y: 0.5 };
  if (config.position) {
    const { x, y } = config.position;
    const clampedX = Math.max(0, Math.min(1, x ?? 0.5));
    const clampedY = Math.max(0, Math.min(1, y ?? 0.5));
    
    if (x !== undefined && (x < 0 || x > 1)) {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'warning',
        message: `Image position x (${x}) out of bounds [0, 1]. Clamped to ${clampedX}.`,
      });
    }
    if (y !== undefined && (y < 0 || y > 1)) {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'warning',
        message: `Image position y (${y}) out of bounds [0, 1]. Clamped to ${clampedY}.`,
      });
    }
    
    position = { x: clampedX, y: clampedY };
  }

  // Validate and default opacity
  let opacity = 1;
  if (config.opacity !== undefined) {
    opacity = Math.max(0, Math.min(1, config.opacity));
    if (config.opacity < 0 || config.opacity > 1) {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'warning',
        message: `Image opacity (${config.opacity}) out of bounds [0, 1]. Clamped to ${opacity}.`,
      });
    }
  }

  // Validate metadata (dimensions) if provided
  if (config.metadata) {
    if (config.metadata.width !== undefined && config.metadata.width <= 0) {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'error',
        message: `Image metadata width must be greater than 0.`,
      });
    }
    if (config.metadata.height !== undefined && config.metadata.height <= 0) {
      diagnostics.push({
        elementIds: [elementId],
      type: 'missing-metadata',
        severity: 'error',
        message: `Image metadata height must be greater than 0.`,
      });
    }
  }

  const resolved: ResolvedImageMediaConfig = {
    src: config.src,
    fit,
    position,
    opacity,
    alt: config.alt,
    metadata: config.metadata,
  };

  return { resolved, diagnostics };
}
