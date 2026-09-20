export type AnchorPoint =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface LayoutElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scale?: number;
  anchor?: AnchorPoint;
  positionMode?: 'absolute' | 'auto'; // Defaults to 'absolute'
  layer?: number; // Explicit z-index representation. Defaults to 0 or implicit array order.

  // Safe Zone configuration
  safeZoneId?: string; // ID of the safe zone to constrain this element to
  priority?: number; // Priority for auto-positioning tie-breaking (higher = placed first)

  // Relative positioning
  relativeTo?: string;
  relativeAnchor?: AnchorPoint; // Which point on the target element to attach to
  offsetX?: number;
  offsetY?: number;
}

export interface LayoutGroup extends LayoutElement {
  children: (LayoutElement | LayoutGroup)[];
}

export interface SafeZoneDefinition {
  id: string;
  type: 'safe' | 'restricted';
  // Coordinates can be absolute pixels (>1) or normalized percentages (0-1)
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneLayout {
  width: number; // Canvas width
  height: number; // Canvas height
  elements: (LayoutElement | LayoutGroup)[];
  safeZones?: SafeZoneDefinition[];
}

export interface ResponsiveConfig {
  designWidth: number;
  designHeight: number;
  targetWidth: number;
  targetHeight: number;
  mode?: 'contain' | 'cover' | 'stretch';
}

// Internal / Output representation of bounding boxes
export interface BoundingBox {
  id: string;
  x: number; // Absolute top-left X coordinate
  y: number; // Absolute top-left Y coordinate
  width: number;
  height: number;
}

export interface AutoPositionConfig {
  container?: { x?: number; y?: number; width?: number; height?: number };
  direction?: 'vertical' | 'horizontal'; // default 'vertical'
  alignment?: 'start' | 'center' | 'end'; // default 'start'
  gap?: number; // default 0
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface AutoPositionResult {
  layout: SceneLayout;
  diagnostics: {
    overflow: boolean;
    overflowDirection?: 'bottom' | 'right' | 'top' | 'left';
  };
}
