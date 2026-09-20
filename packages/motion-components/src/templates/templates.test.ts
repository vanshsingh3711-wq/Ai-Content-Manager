import { describe, it, expect, beforeEach } from 'vitest';
import { getTemplate, instantiateTemplate, templateRegistry } from './index';

describe('Scene Templates & Composition Patterns', () => {
  
  it('retrieves registered templates', () => {
    const template = getTemplate('hero_statement');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Hero Statement');
  });

  it('instantiates a simple template with filled slots', () => {
    const result = instantiateTemplate({
      templateId: 'hero_statement',
      slots: {
        title: {
          assetRequest: { type: 'text', tags: ['headline'] },
          placement: { positionMode: 'absolute', position: { x: 100, y: 100 } }
        }
      }
    });

    expect(result.diagnostics).toHaveLength(0);
    expect(result.scene).toBeDefined();
    expect(result.scene?.elements).toHaveLength(1); // visual is optional and wasn't provided
    
    // Check if the slot was correctly mapped to the element
    const titleEl = result.scene?.elements.find(e => e.id === 'title');
    expect(titleEl?.assetRequest?.type).toBe('text');
  });

  it('generates a diagnostic for missing required slots', () => {
    const result = instantiateTemplate({
      templateId: 'comparison',
      slots: {
        left: { assetRequest: { type: 'image' } }
        // missing 'right' which is required
      }
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].severity).toBe('error');
    expect(result.diagnostics[0].reason).toBe('missing-required-slot');
    expect(result.diagnostics[0].slotId).toBe('right');
    
    // The scene should still be generated with whatever was provided, so it doesn't crash downstream
    expect(result.scene?.elements).toHaveLength(1); 
    expect(result.scene?.elements[0].id).toBe('left');
  });

  it('safely purges relationships for missing optional slots', () => {
    const result = instantiateTemplate({
      templateId: 'single_focus',
      slots: {
        visual: { assetRequest: { type: 'video' } }
        // caption is optional and missing
      }
    });

    expect(result.diagnostics).toHaveLength(0); // No error for optional missing
    expect(result.scene?.elements).toHaveLength(1);
    
    // The relationship { sourceId: 'caption', targetId: 'visual' } should be purged
    // because caption doesn't exist
    expect(result.scene?.relationships).toHaveLength(0);
  });

  it('dynamically generates slots and relationships for step-by-step config', () => {
    const result = instantiateTemplate({
      templateId: 'step_by_step',
      config: { stepCount: 5, direction: 'horizontal', spacing: 100 },
      slots: {
        step_1: { assetRequest: { type: 'text' } },
        step_2: { assetRequest: { type: 'text' } },
        step_3: { assetRequest: { type: 'text' } },
        step_4: { assetRequest: { type: 'text' } },
        step_5: { assetRequest: { type: 'text' } }
      }
    });

    expect(result.diagnostics).toHaveLength(0);
    expect(result.scene?.elements).toHaveLength(5);
    expect(result.scene?.relationships).toHaveLength(4); // 5 elements means 4 links
    
    // Verify custom config was applied
    expect(result.scene?.relationships![0].relation).toBe('right'); // Due to horizontal config
    expect(result.scene?.relationships![0].gap).toBe(100);
  });

  it('produces deterministic output', () => {
    const input = {
      templateId: 'chart_insight',
      slots: {
        insight: { assetRequest: { type: 'text' } },
        chart: { assetRequest: { type: 'image' } }
      }
    };
    
    const run1 = instantiateTemplate(input);
    const run2 = instantiateTemplate(input);
    
    // We override IDs to ensure deep equality because Date.now() in the ID will differ
    run1.scene!.id = 'test';
    run2.scene!.id = 'test';

    expect(run1).toEqual(run2);
  });

});
