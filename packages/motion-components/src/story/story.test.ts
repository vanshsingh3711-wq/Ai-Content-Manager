import { describe, it, expect } from 'vitest';
import { DeterministicStoryPlanner } from './story.planner';
import { StoryPlanRequest } from './story.types';
import { validateStoryPlan } from './story.validation';

describe('Story Planner', () => {
  const planner = new DeterministicStoryPlanner();

  it('should generate a valid story plan for a finance topic', () => {
    const request: StoryPlanRequest = {
      topic: 'Explain why credit card debt grows quickly.'
    };

    const plan = planner.plan(request);
    const diagnostics = validateStoryPlan(plan);

    expect(diagnostics.length).toBe(0);
    expect(plan.topic).toBe(request.topic);
    expect(plan.beats.length).toBeGreaterThan(3);
    
    // Verify deterministic structure for "why"
    expect(plan.beats[0].type).toBe('hook');
    expect(plan.beats.some(b => b.type === 'problem')).toBe(true);
    expect(plan.beats.some(b => b.type === 'reveal')).toBe(true);
    expect(plan.beats[plan.beats.length - 1].type).toBe('conclusion');
  });

  it('should generate a valid story plan for a tech topic (niche-agnostic)', () => {
    const request: StoryPlanRequest = {
      topic: 'Explain how APIs work.'
    };

    const plan = planner.plan(request);
    const diagnostics = validateStoryPlan(plan);

    expect(diagnostics.length).toBe(0);
    expect(plan.topic).toBe(request.topic);
    
    // Verify deterministic structure for "how"
    expect(plan.beats[0].type).toBe('hook');
    expect(plan.beats.some(b => b.type === 'setup')).toBe(true);
    expect(plan.beats.some(b => b.type === 'example')).toBe(true);
    expect(plan.beats[plan.beats.length - 1].type).toBe('conclusion');
  });

  it('should generate a valid story plan for a comparison topic', () => {
    const request: StoryPlanRequest = {
      topic: 'React vs Vue: which is better?'
    };

    const plan = planner.plan(request);
    
    expect(plan.beats.some(b => b.type === 'comparison')).toBe(true);
    expect(plan.beats.some(b => b.type === 'evidence')).toBe(true);
  });

  it('should respect maxBeats constraint', () => {
    const request: StoryPlanRequest = {
      topic: 'Explain how APIs work.',
      constraints: {
        maxBeats: 3
      }
    };

    const plan = planner.plan(request);
    
    expect(plan.beats.length).toBe(3);
    expect(plan.beats[0].type).toBe('hook'); // Hook is preserved
    expect(plan.beats[2].type).toBe('conclusion'); // Conclusion is preserved
  });

  it('should allocate suggested duration proportionally', () => {
    const request: StoryPlanRequest = {
      topic: 'Explain how APIs work.',
      durationInFrames: 300 // 10 seconds at 30fps
    };

    const plan = planner.plan(request);
    
    // Ensure all beats have a duration assigned
    expect(plan.beats.every(b => b.suggestedDurationInFrames !== undefined && b.suggestedDurationInFrames > 0)).toBe(true);
    
    // Ensure total allocated is close to requested duration
    const totalAllocated = plan.beats.reduce((sum, b) => sum + (b.suggestedDurationInFrames || 0), 0);
    // Integer math floor might lose a frame or two depending on part splits
    expect(totalAllocated).toBeGreaterThanOrEqual(290);
    expect(totalAllocated).toBeLessThanOrEqual(300);
  });

  it('should be perfectly deterministic and not mutate input', () => {
    const request: StoryPlanRequest = {
      topic: 'Test Topic'
    };
    
    // Create copy for mutation check
    const originalRequest = JSON.parse(JSON.stringify(request));

    const plan1 = planner.plan(request);
    const plan2 = planner.plan(request);

    // Deep equality ensures IDs and contents are exactly the same
    expect(plan1).toEqual(plan2);
    
    // Ensure input was untouched
    expect(request).toEqual(originalRequest);
  });
});
