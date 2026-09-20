import { ResponsiveConfig, SceneLayout, LayoutElement, LayoutGroup, SafeZoneDefinition } from './layout.types';
import { resolveSafeZoneBounds } from './layout.safezone';

/**
 * Transforms a SceneLayout's base geometry from its authored design dimensions 
 * to the target dimensions using CSS-like object-fit rules.
 */
export function applyResponsiveScaling(layout: SceneLayout, config: ResponsiveConfig): SceneLayout {
  const newLayout: SceneLayout = JSON.parse(JSON.stringify(layout));

  const { designWidth, designHeight, targetWidth, targetHeight, mode = 'contain' } = config;

  if (designWidth <= 0 || designHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return newLayout; // Prevent invalid math
  }

  const scaleX = targetWidth / designWidth;
  const scaleY = targetHeight / designHeight;

  let finalScaleX = scaleX;
  let finalScaleY = scaleY;
  let offsetX = 0;
  let offsetY = 0;

  if (mode === 'contain') {
    const uniformScale = Math.min(scaleX, scaleY);
    finalScaleX = uniformScale;
    finalScaleY = uniformScale;
    offsetX = (targetWidth - (designWidth * uniformScale)) / 2;
    offsetY = (targetHeight - (designHeight * uniformScale)) / 2;
  } else if (mode === 'cover') {
    const uniformScale = Math.max(scaleX, scaleY);
    finalScaleX = uniformScale;
    finalScaleY = uniformScale;
    offsetX = (targetWidth - (designWidth * uniformScale)) / 2;
    offsetY = (targetHeight - (designHeight * uniformScale)) / 2;
  }

  // Helper to mathematically transform geometry
  const transformBox = (x: number, y: number, w: number, h: number) => ({
    x: x * finalScaleX + offsetX,
    y: y * finalScaleY + offsetY,
    width: w * finalScaleX,
    height: h * finalScaleY,
  });

  // 1. Transform Elements (Recursively for Groups)
  const transformElements = (elements: (LayoutElement | LayoutGroup)[]) => {
    for (const el of elements) {
      const transformed = transformBox(el.x, el.y, el.width, el.height);
      el.x = transformed.x;
      el.y = transformed.y;
      el.width = transformed.width;
      el.height = transformed.height;

      // Do NOT transform offsetX/offsetY for relative attachments here, because they are evaluated
      // post-anchor by resolveSceneLayout. Wait, actually if an element has offsetX=100 relative to another,
      // it SHOULD scale to 50 if the scene scales down. 
      if (el.offsetX) el.offsetX *= finalScaleX;
      if (el.offsetY) el.offsetY *= finalScaleY;

      if ('children' in el && Array.isArray(el.children)) {
        transformElements(el.children as (LayoutElement | LayoutGroup)[]);
      }
    }
  };

  transformElements(newLayout.elements);

  // 2. Transform Safe Zones
  if (newLayout.safeZones) {
    newLayout.safeZones = newLayout.safeZones.map((zone: SafeZoneDefinition) => {
      // Step A: Convert any normalized coordinates (0-1) to absolute design pixels
      const absoluteDesignBounds = resolveSafeZoneBounds(zone, designWidth, designHeight);
      
      // Step B: Transform those absolute pixels to target canvas pixels
      const transformed = transformBox(absoluteDesignBounds.x, absoluteDesignBounds.y, absoluteDesignBounds.width, absoluteDesignBounds.height);
      
      return {
        ...zone,
        x: transformed.x,
        y: transformed.y,
        width: transformed.width,
        height: transformed.height,
      };
    });
  }

  // 3. Update the global layout dimensions to the new target
  newLayout.width = targetWidth;
  newLayout.height = targetHeight;

  return newLayout;
}
