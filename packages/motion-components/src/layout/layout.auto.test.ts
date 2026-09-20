import { describe, it, expect } from 'vitest';
import { applyAutoPositioning } from './layout.auto';
import { SceneLayout } from './layout.types';

describe('Auto Positioning', () => {

  const createLayout = (elements: any[]): SceneLayout => ({
    width: 1000,
    height: 1000,
    elements
  });

  it('stacks vertically with gap and handles basic collision logic inherently', () => {
    const layout = createLayout([
      { id: '1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 50 },
      { id: '2', positionMode: 'auto', x: 0, y: 0, width: 200, height: 60 }
    ]);

    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      gap: 20,
      container: { x: 0, y: 0, width: 1000, height: 1000 }
    });

    const els = result.layout.elements;
    // Expected: top-left logic.
    // 1st: y=0
    // 2nd: y=50 + 20 = 70
    expect(els[0].y).toBe(0);
    expect(els[1].y).toBe(70);
    
    // Cross axis (width) should be aligned start by default (x=0)
    expect(els[0].x).toBe(0);
    expect(els[1].x).toBe(0);
  });

  it('aligns center horizontally and vertically', () => {
    const layout = createLayout([
      { id: '1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 50 },
      { id: '2', positionMode: 'auto', x: 0, y: 0, width: 200, height: 50 }
    ]);

    // Container 1000x1000
    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      alignment: 'center',
      gap: 50
    });

    const els = result.layout.elements;
    // Total height = 50 + 50 + 50 = 150
    // Usable height = 1000
    // Start Y = (1000 - 150) / 2 = 425
    expect(els[0].y).toBe(425);
    expect(els[1].y).toBe(425 + 50 + 50); // 525

    // Cross-axis (horizontal) center
    // 1st width=100. (1000-100)/2 = 450
    expect(els[0].x).toBe(450);
    // 2nd width=200. (1000-200)/2 = 400
    expect(els[1].x).toBe(400);
  });

  it('subtracts padding from container bounds', () => {
    const layout = createLayout([
      { id: '1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 100 }
    ]);

    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      alignment: 'start',
      padding: { top: 50, left: 100 }
    });

    expect(result.layout.elements[0].x).toBe(100);
    expect(result.layout.elements[0].y).toBe(50);
  });

  it('compensates for anchors to ensure top-left placement is consistent', () => {
    const layout = createLayout([
      { id: '1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 100, anchor: 'center' }
    ]);

    // We want the rendering top-left to be 0,0. 
    // Since anchor is center, to get top-left at 0,0, the layout X,Y must be 50,50.
    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      alignment: 'start'
    });

    expect(result.layout.elements[0].x).toBe(50);
    expect(result.layout.elements[0].y).toBe(50);
  });

  it('preserves absolute elements and ignores them in the flow', () => {
    const layout = createLayout([
      { id: 'abs1', positionMode: 'absolute', x: 999, y: 999, width: 10, height: 10 },
      { id: 'auto1', positionMode: 'auto', x: 0, y: 0, width: 10, height: 10 }
    ]);

    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      alignment: 'start'
    });

    const abs = result.layout.elements[0];
    const auto = result.layout.elements[1];

    expect(abs.x).toBe(999);
    expect(abs.y).toBe(999);

    expect(auto.x).toBe(0);
    expect(auto.y).toBe(0);
  });

  it('reports overflow without modifying sizes', () => {
    const layout = createLayout([
      { id: '1', positionMode: 'auto', x: 0, y: 0, width: 100, height: 600 },
      { id: '2', positionMode: 'auto', x: 0, y: 0, width: 100, height: 600 }
    ]); // Total 1200 > 1000

    const result = applyAutoPositioning(layout, {
      direction: 'vertical',
      alignment: 'start'
    });

    expect(result.diagnostics.overflow).toBe(true);
    expect(result.diagnostics.overflowDirection).toBe('bottom');

    // Element sizes are preserved
    expect(result.layout.elements[0].height).toBe(600);
    expect(result.layout.elements[1].height).toBe(600);
  });

});
