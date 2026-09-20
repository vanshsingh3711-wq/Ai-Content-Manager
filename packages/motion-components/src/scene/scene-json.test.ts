import { describe, it, expect } from 'vitest';
import { DeterministicStoryPlanner } from '../story/story.planner';
import { DeterministicVisualPlanner } from '../visual/visual.planner';
import { DeterministicSceneJsonGenerator } from './scene-json.generator';

describe('Scene JSON Generator', () => {
  const storyPlanner = new DeterministicStoryPlanner();
  const visualPlanner = new DeterministicVisualPlanner();
  const sceneGenerator = new DeterministicSceneJsonGenerator();

  it('should generate valid SceneJSON from story and visual plans', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain why credit card debt grows quickly.'
    });
    const visualPlan = visualPlanner.plan(storyPlan);
    const sceneJsons = sceneGenerator.generate(storyPlan, visualPlan);

    // One scene JSON per visual scene
    expect(sceneJsons.length).toBe(visualPlan.scenes.length);

    // Check basic integrity
    const firstScene = sceneJsons[0];
    expect(firstScene.id).toBe(`scene_${storyPlan.beats[0].id}`);
    expect(firstScene.beatId).toBe(storyPlan.beats[0].id);
    expect(firstScene.template).toBe('hero_statement'); // Because 'hook' -> 'hero' -> 'hero_statement'
    expect(firstScene.elements.length).toBeGreaterThan(0);
    expect(firstScene.elements[0].type).toBe('text');
    expect(firstScene.elements[0].content).toHaveProperty('text');
  });

  it('should translate complex visual elements into asset requests or rich content', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain how APIs work.'
    });
    const visualPlan = visualPlanner.plan(storyPlan);
    const sceneJsons = sceneGenerator.generate(storyPlan, visualPlan);

    // Look for an 'explanation' beat which should map to a chart or diagram
    const explanationJson = sceneJsons.find(s => s.template === 'chart_insight');
    
    if (explanationJson) {
      const chartElement = explanationJson.elements.find(e => e.type === 'chart');
      expect(chartElement).toBeDefined();
      expect(chartElement?.content).toHaveProperty('kind', 'line');
      
      const textElement = explanationJson.elements.find(e => e.type === 'text');
      expect(textElement).toBeDefined();
    }
    
    // Look for a setup beat which maps to 'single_focus'
    const setupJson = sceneJsons.find(s => s.template === 'single_focus');
    if (setupJson) {
      const objectElement = setupJson.elements.find(e => e.type === 'object');
      expect(objectElement).toBeDefined();
      expect(objectElement?.assetRequest).toBeDefined();
      expect(objectElement?.assetRequest?.capabilities).toContain('object');
    }
  });

  it('should preserve deterministic IDs', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Test determinism.'
    });
    const visualPlan = visualPlanner.plan(storyPlan);
    
    const run1 = sceneGenerator.generate(storyPlan, visualPlan);
    const run2 = sceneGenerator.generate(storyPlan, visualPlan);

    expect(run1).toEqual(run2);
  });
  
  it('should preserve attention intents', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Reveal the hidden cost.'
    });
    const visualPlan = visualPlanner.plan(storyPlan);
    const sceneJsons = sceneGenerator.generate(storyPlan, visualPlan);
    
    // The reveal beat maps to 'kpi_visual' and gets an attention target
    const revealScene = sceneJsons.find(s => s.template === 'kpi_visual');
    if (revealScene) {
      expect(revealScene.attention).toBeDefined();
      expect(revealScene.attention?.length).toBeGreaterThan(0);
    }
  });
});
