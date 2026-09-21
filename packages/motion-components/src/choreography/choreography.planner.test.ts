import { describe, it, expect } from 'vitest';
import { DeterministicChoreographyPlanner } from './choreography.planner';
import { StoryPlan } from '../story/story.types';
import { VisualPlan } from '../visual/visual.types';
import { SceneJSON } from '../scene/scene-json.types';

describe('DeterministicChoreographyPlanner', () => {
  const planner = new DeterministicChoreographyPlanner();

  const getBaseScene = (beatId: string): SceneJSON => ({
    id: `scene_${beatId}`,
    beatId,
    elements: [],
    durationInFrames: 60
  });

  const getBasePlans = (beatType: any, visualType: any = 'single_focus', semanticType?: any): { story: StoryPlan, visual: VisualPlan } => {
    const story: StoryPlan = {
      id: 'story_1',
      topic: 'test',
      beats: [
        { id: 'beat_1', type: beatType, purpose: 'test', message: 'test' }
      ]
    };
    const visual: VisualPlan = {
      id: 'vp_1',
      storyPlanId: 'story_1',
      scenes: [
        {
          id: 'vs_1',
          beatId: 'beat_1',
          purpose: 'test',
          visualType,
          visualDescription: 'test',
          elements: semanticType ? [{ id: 'target_1', role: 'primary', semanticType, description: 'test' }] : []
        }
      ]
    };
    return { story, visual };
  };

  it('hides presenter on full screen visuals (hero)', () => {
    const { story, visual } = getBasePlans('hook', 'hero');
    const scenes = [getBaseScene('beat_1')];

    const updated = planner.applyChoreography(scenes, story, visual);
    const scene = updated[0];

    expect(scene.interactions).toBeUndefined(); // No presenter added
    expect(scene.elements.find(e => e.id === 'main-presenter')).toBeUndefined();
  });

  it('maps hook to talk + happy', () => {
    const { story, visual } = getBasePlans('hook', 'single_focus');
    const scenes = [getBaseScene('beat_1')];

    const updated = planner.applyChoreography(scenes, story, visual);
    const scene = updated[0];

    expect(scene.interactions).toBeDefined();
    expect(scene.interactions![0].action).toBe('talk');
    expect(scene.interactions![0].metadata?.expression).toBe('happy');
  });

  it('maps problem to talk + thinking', () => {
    const { story, visual } = getBasePlans('problem', 'single_focus');
    const scenes = [getBaseScene('beat_1')];

    const updated = planner.applyChoreography(scenes, story, visual);
    const scene = updated[0];

    expect(scene.interactions![0].action).toBe('talk');
    expect(scene.interactions![0].metadata?.expression).toBe('thinking');
  });

  it('targets KPI and uses emphasize', () => {
    const { story, visual } = getBasePlans('reveal', 'kpi', 'kpi');
    const scenes = [getBaseScene('beat_1')];

    const updated = planner.applyChoreography(scenes, story, visual);
    const scene = updated[0];

    expect(scene.interactions![0].action).toBe('emphasize');
    expect(scene.interactions![0].targetId).toBe('target_1');
  });

  it('targets chart and uses pointRight', () => {
    const { story, visual } = getBasePlans('evidence', 'chart', 'chart');
    const scenes = [getBaseScene('beat_1')];

    const updated = planner.applyChoreography(scenes, story, visual);
    const scene = updated[0];

    expect(scene.interactions![0].action).toBe('pointRight');
    expect(scene.interactions![0].targetId).toBe('target_1');
  });

  it('avoids repeating the exact same action', () => {
    const story: StoryPlan = {
      id: 'story_1',
      topic: 'test',
      beats: [
        { id: 'beat_1', type: 'setup', purpose: 'test', message: 'test' },
        { id: 'beat_2', type: 'setup', purpose: 'test', message: 'test' }
      ]
    };
    const visual: VisualPlan = {
      id: 'vp_1',
      storyPlanId: 'story_1',
      scenes: [
        { id: 'vs_1', beatId: 'beat_1', purpose: 'test', visualType: 'single_focus', visualDescription: 'test', elements: [] },
        { id: 'vs_2', beatId: 'beat_2', purpose: 'test', visualType: 'single_focus', visualDescription: 'test', elements: [] }
      ]
    };
    const scenes = [getBaseScene('beat_1'), getBaseScene('beat_2')];

    const updated = planner.applyChoreography(scenes, story, visual);

    expect(updated[0].interactions![0].action).toBe('talk');
    // The second beat is setup which maps to talk, but since lastAction was talk, it should rotate to 'present'
    expect(updated[1].interactions![0].action).not.toBe('talk');
    expect(updated[1].interactions![0].action).toBe('present');
  });

  it('respects explicit overrides in SceneJSON', () => {
    const { story, visual } = getBasePlans('hook', 'single_focus');
    const scenes = [getBaseScene('beat_1')];
    scenes[0].interactions = [
      {
        presenterId: 'main-presenter',
        action: 'wave',
        startFrame: 0,
        durationInFrames: 60
      }
    ];

    const updated = planner.applyChoreography(scenes, story, visual);
    
    // Should keep 'wave' instead of mapping 'hook' -> 'talk'
    expect(updated[0].interactions![0].action).toBe('wave');
  });
});
