import { StoryPlan } from '../story/story.types';
import { VisualPlan } from '../visual/visual.types';
import { DeterministicSceneJsonGenerator } from '../scene/scene-json.generator';
import { DeterministicChoreographyPlanner } from './choreography.planner';
import { DeterministicSceneCompiler } from '../scene/scene.compiler';

export function runDemoChoreographyPipeline() {
  const storyPlan: StoryPlan = {
    id: 'story_demo',
    topic: 'Credit Card Debt',
    beats: [
      { id: 'beat_1', type: 'hook', purpose: 'Grab attention', message: 'Debt is scary' },
      { id: 'beat_2', type: 'problem', purpose: 'Explain issue', message: 'It grows fast' },
      { id: 'beat_3', type: 'evidence', purpose: 'Show evidence', message: 'Look at this card' },
      { id: 'beat_4', type: 'explanation', purpose: 'Explain growth', message: 'Look at the chart' },
      { id: 'beat_5', type: 'reveal', purpose: 'Big number', message: '$42,000' },
      { id: 'beat_6', type: 'conclusion', purpose: 'Wrap up', message: 'Take control' },
      { id: 'beat_7', type: 'cta', purpose: 'Action', message: 'Subscribe' }
    ]
  };

  const visualPlan: VisualPlan = {
    id: 'vp_demo',
    storyPlanId: 'story_demo',
    scenes: [
      {
        id: 'vs_1', beatId: 'beat_1', purpose: 'Visual hook', visualType: 'single_focus', visualDescription: 'Intro',
        elements: []
      },
      {
        id: 'vs_2', beatId: 'beat_2', purpose: 'Visual problem', visualType: 'single_focus', visualDescription: 'Problem',
        elements: []
      },
      {
        id: 'vs_3', beatId: 'beat_3', purpose: 'Visual evidence', visualType: 'media', visualDescription: 'Card',
        elements: [
          { id: 'credit-card', role: 'primary', semanticType: 'object', description: 'Credit Card' }
        ],
        attention: [{ id: 'att_card', type: 'highlight', targetId: 'credit-card' }]
      },
      {
        id: 'vs_4', beatId: 'beat_4', purpose: 'Visual chart', visualType: 'chart', visualDescription: 'Chart',
        elements: [
          { id: 'debt-chart', role: 'primary', semanticType: 'chart', description: 'Debt Chart' }
        ],
        attention: [{ id: 'att_chart', type: 'spotlight', targetId: 'debt-chart' }]
      },
      {
        id: 'vs_5', beatId: 'beat_5', purpose: 'Visual KPI', visualType: 'kpi', visualDescription: 'KPI',
        elements: [
          { id: 'kpi-number', role: 'primary', semanticType: 'kpi', description: '$42,000' }
        ],
        attention: [{ id: 'att_kpi', type: 'highlight', targetId: 'kpi-number' }]
      },
      {
        id: 'vs_6', beatId: 'beat_6', purpose: 'Conclusion', visualType: 'single_focus', visualDescription: 'Wrap',
        elements: []
      },
      {
        id: 'vs_7', beatId: 'beat_7', purpose: 'CTA', visualType: 'single_focus', visualDescription: 'CTA',
        elements: []
      }
    ]
  };

  // 1. Scene JSON
  const jsonGenerator = new DeterministicSceneJsonGenerator();
  const baseScenes = jsonGenerator.generate(storyPlan, visualPlan);

  // 2. Choreography
  const choreographer = new DeterministicChoreographyPlanner();
  const choreographScenes = choreographer.applyChoreography(baseScenes, storyPlan, visualPlan);

  // 3. Compiler
  const compiler = new DeterministicSceneCompiler();
  const compiledScenes = choreographScenes.map(scene => compiler.compile(scene));

  return compiledScenes;
}
