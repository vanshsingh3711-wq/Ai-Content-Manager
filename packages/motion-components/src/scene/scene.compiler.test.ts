import { describe, it, expect } from 'vitest';
import { DeterministicSceneCompiler } from './scene.compiler';
import { SceneJSON } from './scene-json.types';
import '../templates/index'; // Ensure templates are registered

describe('Scene Graph Compiler', () => {
  const compiler = new DeterministicSceneCompiler();

  it('should compile valid manual SceneJSON into SceneDefinition', () => {
    const sceneJson: SceneJSON = {
      id: 'test_manual',
      beatId: 'beat_1',
      elements: [
        { id: 'el_1', type: 'text', content: { text: 'Hello World' } },
        { id: 'el_2', type: 'object', assetRequest: { capabilities: ['object'] } }
      ],
      relationships: [
        { sourceId: 'el_2', targetId: 'el_1', relation: 'below' }
      ]
    };

    const compiled = compiler.compile(sceneJson);
    
    expect(compiled.id).toBe('compiled_test_manual');
    expect(compiled.elements.length).toBe(2);
    expect(compiled.elements[0].type).toBe('text');
    expect(compiled.elements[0].textContent).toBe('Hello World');
    expect(compiled.elements[1].type).toBe('asset');
    expect(compiled.elements[1].assetRequest).toBeDefined();
    expect(compiled.relationships?.length).toBe(1);
  });

  it('should resolve templates and map semantics automatically', () => {
    // "Chart Insight" template has slots: 'insight' (primary_text) and 'chart' (data_visual)
    const sceneJson: SceneJSON = {
      id: 'test_template',
      beatId: 'beat_2',
      template: 'chart_insight', // Core template
      elements: [
        { id: 'input_text', type: 'text', role: 'primary', content: { text: 'Debt is rising' } },
        { id: 'input_chart', type: 'chart', role: 'primary', content: { kind: 'line' } }
      ]
    };

    const compiled = compiler.compile(sceneJson);

    // It should have mapped input_text -> 'insight' and input_chart -> 'chart'
    expect(compiled.elements.length).toBe(2);
    
    const textEl = compiled.elements.find(e => e.id === 'insight');
    const chartEl = compiled.elements.find(e => e.id === 'chart');
    
    expect(textEl).toBeDefined();
    expect(textEl?.type).toBe('text');
    expect(textEl?.textContent).toBe('Debt is rising');
    
    expect(chartEl).toBeDefined();
    expect(chartEl?.type).toBe('asset');
    
    // Check if the template relationship was instantiated
    expect(compiled.relationships).toBeDefined();
    const rel = compiled.relationships?.find(r => r.sourceId === 'chart' && r.targetId === 'insight');
    expect(rel).toBeDefined();
    expect(rel?.relation).toBe('below');
  });

  it('should propagate attention and transition intents', () => {
    const sceneJson: SceneJSON = {
      id: 'test_intents',
      beatId: 'beat_3',
      elements: [
        { id: 'el', type: 'text' }
      ],
      attention: [
        { id: 'att_1', targetId: 'el', type: 'highlight' }
      ],
      transition: {
        type: 'fade',
        durationInFrames: 30
      }
    };

    const compiled = compiler.compile(sceneJson);
    
    expect(compiled.attention).toBeDefined();
    expect(compiled.attention![0].type).toBe('highlight');
    expect(compiled.transitionIn).toBeDefined();
    expect(compiled.transitionIn?.type).toBe('fade');
  });

  it('should throw deterministically on invalid input', () => {
    const sceneJson: any = {
      // Missing id/beatId
      elements: []
    };

    expect(() => compiler.compile(sceneJson)).toThrow(/invalid SceneJSON/i);
  });
});
