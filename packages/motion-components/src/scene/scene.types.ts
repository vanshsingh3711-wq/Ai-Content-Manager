import { AssetRequest } from '../assets/assets.types';
import { VideoTheme, DeepPartial as ThemeDeepPartial } from '../themes/theme.types';
import { DesignTokens, DeepPartial as TokenDeepPartial } from '../themes/tokens.types';
import { PlacementRequest, ResolvedPlacement } from '../placement/placement.types';
import { CompositionRelationship } from '../relationships/relationships.types';
import { SafeZoneDefinition } from '../layout/layout.types';
import { TimingConfig } from '../timing/timing.types';
import { CompositionDiagnostic } from '../validation/validation.types';
import { TextLayoutConfig, TextSegment, TextMeasurementResult } from '../typography/typography.types';
import { SceneTransition } from '../transitions/transitions.types';
import { AttentionInstruction, ResolvedAttentionSequence } from '../attention/attention.types';

export interface SceneElementDefinition {
  id: string;
  type?: 'asset' | 'text'; // Discriminator
  
  // For type === 'asset' (or default)
  assetId?: string; // Explicit ID mode
  assetRequest?: AssetRequest; // AI generic mode
  
  // For type === 'text'
  textContent?: string; // Simple text string
  textSegments?: TextSegment[]; // Rich text
  textConfig?: TextLayoutConfig; // Typography/layout settings
  
  // General Placement
  placement?: PlacementRequest; // Where it wants to be
  timing?: TimingConfig; // When it exists
  layer?: number; // Optional Z-Index override
  parentId?: string; // Composition grouping
  animation?: unknown; // Animation transforms (passed through to renderer)
}

export interface SceneDefinition {
  id: string;
  durationInFrames?: number;
  themeId?: string;
  themeOverrides?: ThemeDeepPartial<VideoTheme>;
  tokenOverrides?: TokenDeepPartial<DesignTokens>;
  transitionIn?: SceneTransition;
  elements: SceneElementDefinition[];
  relationships?: CompositionRelationship[];
  safeZones?: SafeZoneDefinition[];
  attention?: AttentionInstruction[];
}

export interface SceneResolutionContext {
  canvas: { width: number; height: number };
  fps: number;
  autoRepair?: boolean;
}

export interface ResolvedSceneElement {
  id: string;
  type: 'asset' | 'text';
  assetId?: string; // Resolved if type === 'asset'
  
  // Text specific
  textContent?: string;
  textSegments?: TextSegment[];
  textConfig?: TextLayoutConfig;
  textMeasurement?: TextMeasurementResult;
  
  geometry: { x: number; y: number; width: number; height: number };
  anchor: string;
  timing: {
    startFrame: number;
    durationInFrames: number;
    endFrame: number;
  };
  layer: number;
  animation?: unknown;
}

export interface ResolvedSceneGraph {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  theme: VideoTheme;
  tokens: DesignTokens;
  elements: ResolvedSceneElement[];
  attention: ResolvedAttentionSequence;
  diagnostics: CompositionDiagnostic[];
  valid: boolean;
}
