import { describe, it, expect } from 'vitest';
import { DeterministicStoryPlanner } from '../story/story.planner';
import { DeterministicVisualPlanner } from './visual.planner';
import { validateVisualPlan } from './visual.validation';

describe('Visual Planner', () => {
  const storyPlanner = new DeterministicStoryPlanner();
  const visualPlanner = new DeterministicVisualPlanner();

  it('should generate a valid visual plan from a story plan', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain why credit card debt grows quickly.'
    });

    const visualPlan = visualPlanner.plan(storyPlan);
    const diagnostics = validateVisualPlan(visualPlan);

    expect(diagnostics.length).toBe(0);
    expect(visualPlan.storyPlanId).toBe(storyPlan.id);
    expect(visualPlan.scenes.length).toBe(storyPlan.beats.length);
  });

  it('should map semantic beat types to varied visual templates', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain how compound interest works.'
    });

    const visualPlan = visualPlanner.plan(storyPlan);
    
    // Check that we got a diverse set of visual types
    const visualTypes = new Set(visualPlan.scenes.map(s => s.visualType));
    expect(visualTypes.size).toBeGreaterThan(1);
    
    // Specifically check that 'hook' became 'hero'
    const hookScene = visualPlan.scenes[0];
    expect(hookScene.visualType).toBe('hero');
    
    // Conclusion should be quote
    const conclusionScene = visualPlan.scenes[visualPlan.scenes.length - 1];
    expect(conclusionScene.visualType).toBe('quote');
  });

  it('should produce perfectly deterministic scene and element IDs', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain how APIs work.'
    });

    // Create copy for mutation check
    const originalPlan = JSON.parse(JSON.stringify(storyPlan));

    const visualPlan1 = visualPlanner.plan(storyPlan);
    const visualPlan2 = visualPlanner.plan(storyPlan);

    expect(visualPlan1).toEqual(visualPlan2);
    
    // Ensure scene IDs match beat IDs deterministically
    expect(visualPlan1.scenes[0].id).toBe(`visual_scene_${storyPlan.beats[0].id}`);
    expect(visualPlan1.scenes[0].beatId).toBe(storyPlan.beats[0].id);
    
    // Ensure story plan was not mutated
    expect(storyPlan).toEqual(originalPlan);
  });

  it('should generate attention intents for specific beats', () => {
    const storyPlan = storyPlanner.plan({
      topic: 'Explain why startup product-market fit matters.'
    });
    // Ensure we have a problem or reveal beat generated for this 'why' topic
    const visualPlan = visualPlanner.plan(storyPlan);
    
    const problemScene = visualPlan.scenes.find(s => s.purpose.includes('problem') || s.visualType === 'text_visual');
    
    // Only some beats generate attention rules
    if (problemScene) {
      expect(problemScene.attention).toBeDefined();
      expect(problemScene.attention?.length).toBeGreaterThan(0);
      expect(problemScene.attention?.[0].type).toBe('highlight');
    }
  });
});
