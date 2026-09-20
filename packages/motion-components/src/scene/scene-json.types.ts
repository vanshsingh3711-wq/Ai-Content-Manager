import { AssetRequest } from '../assets/assets.types';
import { CompositionRelationship } from '../relationships/relationships.types';
import { AttentionInstruction } from '../attention/attention.types';
import { SceneTransition } from '../transitions/transitions.types';
import { TimingConfig } from '../timing/timing.types';

export type SceneJsonVisualType =
  | 'text'
  | 'object'
  | 'icon'
  | 'illustration'
  | 'chart'
  | 'kpi'
  | 'image'
  | 'video'
  | 'diagram'
  | 'shape'
  | 'media'
  | 'character';

export type SceneJsonRole =
  | 'primary'
  | 'secondary'
  | 'supporting'
  | 'background'
  | 'label'
  | 'data'
  | 'emphasis';

export interface SceneElementJSON {
  id: string;
  type: SceneJsonVisualType;
  role?: SceneJsonRole;
  description?: string;
  
  assetRequest?: AssetRequest;
  
  // Minimal representation for raw semantic content (e.g. text or KPIs)
  content?: Record<string, unknown>;
  
  layout?: Record<string, unknown>;
  animation?: Record<string, unknown>;
  timing?: TimingConfig;
  
  metadata?: Record<string, unknown>;
}

export interface SceneJSON {
  id: string;
  beatId: string;
  template?: string; // Corresponds to core templates e.g. "hero_statement", "chart_insight"
  durationInFrames?: number;
  
  elements: SceneElementJSON[];
  relationships?: CompositionRelationship[];
  attention?: AttentionInstruction[];
  transition?: SceneTransition;
  
  metadata?: Record<string, unknown>;
}
