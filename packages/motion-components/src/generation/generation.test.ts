import { describe, it, expect, vi } from 'vitest';
import { GenerationOrchestrator } from './generation.orchestrator';

describe('Generation Orchestrator', () => {
  it('runs the end to end generation pipeline successfully', () => {
    const orchestrator = new GenerationOrchestrator();
    const result = orchestrator.generate({
      topic: 'Why compound interest grows so quickly',
      durationInSeconds: 30,
      format: { width: 1080, height: 1920, fps: 30 },
      themeId: 'premium_dark',
      presenter: { enabled: true, presenterId: 'sarah' }
    });

    expect(result.success).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.project).toBeDefined();
    
    // Check if the project is wrapped properly
    expect(result.project!.id).toContain('gen_');
    expect(result.project!.themeId).toBe('premium_dark');
    
    // Check stages
    expect(result.stages?.story).toBeDefined();
    expect(result.stages?.visual).toBeDefined();
    expect(result.stages?.scenes).toBeDefined();
    
    // Expect elements to exist
    expect(result.project!.elements.length).toBeGreaterThan(0);
    
    // Expect presenter element to have the requested ID
    const presenterEl = result.project!.elements.find(el => el.type === 'presenter');
    if (presenterEl) {
      expect(presenterEl.assetId).toBe('sarah');
    }
  });

  it('fails gracefully when presenter is disabled but still generates', () => {
    const orchestrator = new GenerationOrchestrator();
    const result = orchestrator.generate({
      topic: 'Why compound interest grows so quickly',
      durationInSeconds: 30,
      format: { width: 1920, height: 1080, fps: 30 },
      themeId: 'clean_light',
      presenter: { enabled: false }
    });

    expect(result.success).toBe(true);
    expect(result.project!.themeId).toBe('clean_light');
  });

  it('handles errors in generation gracefully', () => {
    const orchestrator = new GenerationOrchestrator();
    
    // Force a failure by mocking
    vi.spyOn(orchestrator as any, 'storyPlanner', 'get').mockReturnValue({
      plan: () => ({ beats: [] }) // Empty beats should fail
    });

    const result = orchestrator.generate({
      topic: 'Fail me',
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].severity).toBe('error');
    expect(result.diagnostics[0].message).toContain('no narrative beats');
  });
});
