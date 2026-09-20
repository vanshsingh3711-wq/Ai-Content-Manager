import { AssetRequest } from '../assets/assets.types';
import { PlacementRequest } from '../placement/placement.types';
import { TimingConfig } from '../timing/timing.types';
import { CompositionRelationship } from '../relationships/relationships.types';
import { SceneDefinition } from '../scene/scene.types';

export interface TemplateConfig {
  direction?: 'horizontal' | 'vertical';
  alignment?: 'start' | 'center' | 'end';
  spacing?: number;
  padding?: number;
  stepCount?: number;
  style?: string;
  [key: string]: unknown;
}

export interface TemplateSlot {
  id: string;
  role: string;
  required?: boolean;
  // Default fallback requirements if the user doesn't provide them
  defaultAssetRequest?: AssetRequest;
  defaultPlacement?: PlacementRequest;
  defaultTiming?: TimingConfig;
}

// Function signature for templates to allow dynamic slot/relationship generation
export type SceneTemplateFactory = (config?: TemplateConfig) => SceneTemplate;

export interface SceneTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  slots: TemplateSlot[];
  relationships?: CompositionRelationship[];
  metadata?: Record<string, unknown>;
}

export interface TemplateSlotInput {
  assetRequest?: AssetRequest; // Optionally override/provide asset specs
  placement?: PlacementRequest; // Optionally override/provide placement specs
  timing?: TimingConfig; // Optionally override/provide timing specs
}

export interface TemplateInput {
  templateId: string;
  config?: TemplateConfig;
  slots: Record<string, TemplateSlotInput>;
}

export interface TemplateDiagnostic {
  severity: 'error' | 'warning' | 'info';
  reason: string;
  message: string;
  slotId?: string;
}

export interface TemplateInstantiationResult {
  scene?: SceneDefinition;
  diagnostics: TemplateDiagnostic[];
}
