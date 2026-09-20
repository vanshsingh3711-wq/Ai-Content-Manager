export * from './templates.types';
export * from './templates.registry';
export * from './templates.instantiate';

import { registerTemplate } from './templates.registry';
import {
  HeroStatementTemplate,
  SingleFocusTemplate,
  TextVisualTemplate,
  ChartInsightTemplate,
  ComparisonTemplate,
  BeforeAfterTemplate,
  StepByStepTemplate,
  TimelineTemplate,
  KPIVisualTemplate,
  FullScreenQuoteTemplate
} from './core.templates';

// Auto-register core templates
registerTemplate('hero_statement', HeroStatementTemplate);
registerTemplate('single_focus', SingleFocusTemplate);
registerTemplate('text_visual', TextVisualTemplate);
registerTemplate('chart_insight', ChartInsightTemplate);
registerTemplate('comparison', ComparisonTemplate);
registerTemplate('before_after', BeforeAfterTemplate);
registerTemplate('step_by_step', StepByStepTemplate);
registerTemplate('timeline', TimelineTemplate);
registerTemplate('kpi_visual', KPIVisualTemplate);
registerTemplate('full_screen_quote', FullScreenQuoteTemplate);
