import { SceneTemplateFactory, SceneTemplate, TemplateConfig } from './templates.types';
import { CompositionRelationship } from '../relationships/relationships.types';

export const HeroStatementTemplate: SceneTemplateFactory = () => ({
  id: 'hero_statement',
  name: 'Hero Statement',
  category: 'hero',
  slots: [
    { id: 'title', role: 'primary_text', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } },
    { id: 'visual', role: 'supporting_visual', required: false, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } }
  ],
  relationships: [
    { sourceId: 'visual', targetId: 'title', relation: 'below', gap: 40 }
  ]
});

export const SingleFocusTemplate: SceneTemplateFactory = () => ({
  id: 'single_focus',
  name: 'Single Focus',
  category: 'explanation',
  slots: [
    { id: 'visual', role: 'primary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } },
    { id: 'caption', role: 'supporting_text', required: false, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } }
  ],
  relationships: [
    { sourceId: 'caption', targetId: 'visual', relation: 'below', gap: 20 }
  ]
});

export const TextVisualTemplate: SceneTemplateFactory = (config?: TemplateConfig) => {
  // If direction is vertical, it's top-bottom. Default horizontal (left-right).
  const direction = config?.direction || 'horizontal';
  const reverse = config?.alignment === 'end'; // Just an example of config usage to flip sides

  return {
    id: 'text_visual',
    name: 'Text + Visual',
    category: 'explanation',
    slots: [
      { id: 'text', role: 'primary_text', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-left' } },
      { id: 'visual', role: 'primary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-right' } }
    ],
    relationships: direction === 'horizontal' ? [
      { sourceId: reverse ? 'text' : 'visual', targetId: reverse ? 'visual' : 'text', relation: 'right', gap: config?.spacing || 50 }
    ] : [
      { sourceId: reverse ? 'text' : 'visual', targetId: reverse ? 'visual' : 'text', relation: 'below', gap: config?.spacing || 50 }
    ]
  };
};

export const ChartInsightTemplate: SceneTemplateFactory = () => ({
  id: 'chart_insight',
  name: 'Chart + Insight',
  category: 'data',
  slots: [
    { id: 'insight', role: 'primary_text', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } },
    { id: 'chart', role: 'data_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } }
  ],
  relationships: [
    { sourceId: 'chart', targetId: 'insight', relation: 'below', gap: 40 }
  ]
});

export const ComparisonTemplate: SceneTemplateFactory = () => ({
  id: 'comparison',
  name: 'Comparison',
  category: 'comparison',
  slots: [
    { id: 'left', role: 'primary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-right' } },
    { id: 'right', role: 'secondary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-left' } },
    { id: 'label', role: 'supporting_text', required: false, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } }
  ],
  relationships: [
    { sourceId: 'right', targetId: 'left', relation: 'right', gap: 100 },
    { sourceId: 'label', targetId: 'left', relation: 'below', gap: 60 } // E.g., centered below the left item or below the whole group
  ]
});

export const BeforeAfterTemplate: SceneTemplateFactory = () => ({
  id: 'before_after',
  name: 'Before / After',
  category: 'before_after',
  slots: [
    { id: 'before', role: 'primary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-right' } },
    { id: 'after', role: 'secondary_visual', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-left' } }
  ],
  relationships: [
    { sourceId: 'after', targetId: 'before', relation: 'right', gap: 20 }
  ]
});

export const StepByStepTemplate: SceneTemplateFactory = (config?: TemplateConfig) => {
  const stepCount = config?.stepCount || 3;
  const direction = config?.direction || 'vertical';
  
  const slots: any[] = [];
  const relationships: CompositionRelationship[] = [];

  for (let i = 1; i <= stepCount; i++) {
    slots.push({
      id: `step_${i}`,
      role: `step_${i}`,
      required: true,
      defaultPlacement: { positionMode: 'auto', anchor: 'center' as any }
    });

    if (i > 1) {
      relationships.push({
        sourceId: `step_${i}`,
        targetId: `step_${i - 1}`,
        relation: direction === 'vertical' ? 'below' : 'right',
        gap: config?.spacing || 40
      });
    }
  }

  return {
    id: 'step_by_step',
    name: 'Step-by-Step',
    category: 'process',
    slots,
    relationships
  };
};

export const TimelineTemplate: SceneTemplateFactory = (config?: TemplateConfig) => {
  const stepCount = config?.stepCount || 4;
  
  const slots: any[] = [];
  const relationships: CompositionRelationship[] = [];

  for (let i = 1; i <= stepCount; i++) {
    slots.push({
      id: `point_${i}`,
      role: `timeline_point`,
      required: true,
      defaultPlacement: { positionMode: 'auto', anchor: 'center' as any }
    });

    if (i > 1) {
      relationships.push({
        sourceId: `point_${i}`,
        targetId: `point_${i - 1}`,
        relation: 'right', // Standard horizontal timeline
        gap: config?.spacing || 120
      });
    }
  }

  return {
    id: 'timeline',
    name: 'Timeline',
    category: 'timeline',
    slots,
    relationships
  };
};

export const KPIVisualTemplate: SceneTemplateFactory = () => ({
  id: 'kpi_visual',
  name: 'KPI + Supporting Visual',
  category: 'data',
  slots: [
    { id: 'kpi', role: 'primary_text', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center-left' } },
    { id: 'visual', role: 'supporting_visual', required: false, defaultPlacement: { positionMode: 'auto', anchor: 'center-right' } }
  ],
  relationships: [
    { sourceId: 'visual', targetId: 'kpi', relation: 'right', gap: 30 }
  ]
});

export const FullScreenQuoteTemplate: SceneTemplateFactory = () => ({
  id: 'full_screen_quote',
  name: 'Full-Screen Quote',
  category: 'quote',
  slots: [
    { id: 'quote', role: 'primary_text', required: true, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } },
    { id: 'attribution', role: 'supporting_text', required: false, defaultPlacement: { positionMode: 'auto', anchor: 'center' as any } }
  ],
  relationships: [
    { sourceId: 'attribution', targetId: 'quote', relation: 'below', gap: 60 }
  ]
});
