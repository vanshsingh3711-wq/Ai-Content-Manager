import { describe, it, expect, beforeEach } from 'vitest';
import { registerAsset, clearRegistry } from './assets.registry';
import { selectAsset } from './assets.selection';

describe('Asset Selection System', () => {

  beforeEach(() => {
    clearRegistry();
    
    registerAsset({
      id: 'phone_model_x',
      type: 'object',
      categories: ['technology', 'communication'],
      tags: ['mobile', 'smartphone', 'device'],
      capabilities: ['shake', 'highlight', 'scale'],
      styles: ['minimal'],
      priority: 10
    });

    registerAsset({
      id: 'phone_model_y',
      type: 'object',
      categories: ['technology', 'communication'],
      tags: ['mobile', 'device'],
      capabilities: ['scale'],
      styles: ['editorial'],
      priority: 5
    });

    registerAsset({
      id: 'bar_chart_basic',
      type: 'chart',
      categories: ['finance', 'data'],
      tags: ['comparison'],
      capabilities: ['draw', 'highlight']
    });

    registerAsset({
      id: 'bar_chart_advanced',
      type: 'chart',
      categories: ['finance', 'data'],
      tags: ['comparison', 'trends'],
      capabilities: ['draw', 'highlight', 'animate']
    });
    
    registerAsset({
      id: 'credit_card',
      type: 'object',
      categories: ['finance', 'shopping'],
      capabilities: ['flip']
    });
  });

  it('selects by exact ID instantly', () => {
    const result = selectAsset({ id: 'credit_card' });
    expect(result.asset?.id).toBe('credit_card');
  });

  it('selects by manual override', () => {
    const result = selectAsset({ id: 'phone_model_x' }, 'bar_chart_basic');
    expect(result.asset?.id).toBe('bar_chart_basic');
  });

  it('selects by preferred IDs', () => {
    const result = selectAsset({ preferredIds: ['fake_id', 'bar_chart_advanced', 'credit_card'] });
    expect(result.asset?.id).toBe('bar_chart_advanced');
  });

  it('filters by hard capabilities', () => {
    // Both phones are technology/mobile, but only model_x can shake
    const result = selectAsset({
      type: 'object',
      tags: ['mobile'],
      capabilities: ['shake']
    });
    expect(result.asset?.id).toBe('phone_model_x');
  });

  it('scores categories and tags correctly', () => {
    // Both charts have 'draw', but advanced has 'trends' tag
    const result = selectAsset({
      type: 'chart',
      capabilities: ['draw'],
      tags: ['trends']
    });
    expect(result.asset?.id).toBe('bar_chart_advanced');
  });

  it('falls back to a generic compatible asset if type is completely missing but capabilities match', () => {
    // There is no type "vehicle" that can 'flip', but credit_card can flip
    const result = selectAsset({
      type: 'vehicle',
      capabilities: ['flip']
    });
    
    expect(result.asset?.id).toBe('credit_card');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'fallback-used' })
      ])
    );
  });

  it('returns no-match if capability is missing everywhere', () => {
    const result = selectAsset({
      type: 'chart',
      capabilities: ['explode']
    });
    
    expect(result.asset).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'no-match' })
      ])
    );
  });

  it('excludes specific IDs', () => {
    const result = selectAsset({
      type: 'chart',
      tags: ['comparison'], // Normally would match advanced because of stable tiebreak or priority (none set, alphabetical fallback)
      excludeIds: ['bar_chart_advanced']
    });
    expect(result.asset?.id).toBe('bar_chart_basic');
  });

  it('returns multiple assets deterministically based on count', () => {
    const result = selectAsset({
      type: 'object',
      categories: ['technology'],
      count: 2
    });
    
    expect(result.matches).toHaveLength(2);
    // Highest priority first (model_x = 10, model_y = 5)
    expect(result.matches?.[0].id).toBe('phone_model_x');
    expect(result.matches?.[1].id).toBe('phone_model_y');
  });

});
