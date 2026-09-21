import { AssetRequest } from '../assets/assets.types';
import { CompositionRelationship } from '../relationships/relationships.types';
import { AttentionInstruction } from '../attention/attention.types';
import { SceneTransition } from '../transitions/transitions.types';
import { TimingConfig } from '../timing/timing.types';
import { PresenterAction } from '../character/presenter.types';
import { KeyframeTrack } from '../keyframes/keyframes.types';

export interface SceneJsonPresenterInteraction {
  presenterId: string;
  action: PresenterAction;
  targetId?: string;
  startFrame: number;
  durationInFrames?: number;
  intensity?: number;
  metadata?: Record<string, unknown>;
}

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
  | 'character'
  | 'presenter';

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
  keyframes?: KeyframeTrack[];
}

export interface SceneJSON {
  id: string;
  beatId: string;
  template?: string; // Corresponds to core templates e.g. "hero_statement", "chart_insight"
  durationInFrames?: number;
  
  elements: SceneElementJSON[];
  relationships?: CompositionRelationship[];
  attention?: AttentionInstruction[];
  interactions?: SceneJsonPresenterInteraction[];
  transition?: SceneTransition;
  
  metadata?: Record<string, unknown>;
}
