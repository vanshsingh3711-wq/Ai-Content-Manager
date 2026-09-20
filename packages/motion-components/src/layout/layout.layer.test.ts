import { describe, it, expect } from 'vitest';
import { resolveLayerOrder, bringToFront, sendToBack, bringForward, sendBackward } from './layout.layer';
import { SceneLayout } from './layout.types';

describe('Layer Management', () => {

  const createElement = (id: string, layer?: number): any => ({
    id,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    layer
  });

  const createLayout = (elements: any[]): SceneLayout => ({
    width: 1000,
    height: 1000,
    elements
  });

  it('sorts by explicit layer correctly', () => {
    const elements = [
      createElement('c', 20),
      createElement('a', 0),
      createElement('b', 10)
    ];

    const sorted = resolveLayerOrder(elements);
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
    expect(sorted[2].id).toBe('c');
  });

  it('preserves insertion order for equal layers (stable sort)', () => {
    const elements = [
      createElement('a', 10),
      createElement('b', 10),
      createElement('c', 10)
    ];

    const sorted = resolveLayerOrder(elements);
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
    expect(sorted[2].id).toBe('c');
  });

  it('treats undefined layer as 0 and preserves insertion order relative to other 0s', () => {
    const elements = [
      createElement('a', 5),
      createElement('b'), // undefined -> 0
      createElement('c', -5),
      createElement('d', 0) // Explicit 0
    ];

    const sorted = resolveLayerOrder(elements);
    expect(sorted[0].id).toBe('c'); // -5
    expect(sorted[1].id).toBe('b'); // undefined (0)
    expect(sorted[2].id).toBe('d'); // 0 (comes after b due to insertion order)
    expect(sorted[3].id).toBe('a'); // 5
  });

  it('sorts children recursively within a group', () => {
    const group = {
      ...createElement('group', 0),
      children: [
        createElement('c', 10),
        createElement('a', 0),
        createElement('b', 5)
      ]
    };

    const sorted = resolveLayerOrder([group]);
    const sortedGroupChildren = (sorted[0] as any).children;

    expect(sortedGroupChildren[0].id).toBe('a');
    expect(sortedGroupChildren[1].id).toBe('b');
    expect(sortedGroupChildren[2].id).toBe('c');
  });

  describe('Modifiers', () => {
    it('bringToFront places element at max + 1', () => {
      let layout = createLayout([
        createElement('a', 10),
        createElement('b', 20),
        createElement('c', 30)
      ]);

      layout = bringToFront(layout, 'a');
      const sorted = resolveLayerOrder(layout.elements);
      
      expect(sorted[2].id).toBe('a');
      expect(sorted[2].layer).toBe(31);
    });

    it('sendToBack places element at min - 1', () => {
      let layout = createLayout([
        createElement('a', 10),
        createElement('b', 20),
        createElement('c', 30)
      ]);

      layout = sendToBack(layout, 'c');
      const sorted = resolveLayerOrder(layout.elements);
      
      expect(sorted[0].id).toBe('c');
      expect(sorted[0].layer).toBe(9);
    });

    it('bringForward places element just above the one currently covering it', () => {
      let layout = createLayout([
        createElement('a', 10),
        createElement('b', 20),
        createElement('c', 30)
      ]);

      layout = bringForward(layout, 'a');
      const sorted = resolveLayerOrder(layout.elements);
      
      // 'a' was at 10. The one covering it was 'b' at 20.
      // bringForward should set 'a' to 21.
      expect(sorted[1].id).toBe('a');
      expect(sorted[1].layer).toBe(21);
    });

    it('sendBackward places element just below the one currently under it', () => {
      let layout = createLayout([
        createElement('a', 10),
        createElement('b', 20),
        createElement('c', 30)
      ]);

      layout = sendBackward(layout, 'c');
      const sorted = resolveLayerOrder(layout.elements);
      
      // 'c' was at 30. The one under it was 'b' at 20.
      // sendBackward should set 'c' to 19.
      expect(sorted[1].id).toBe('c');
      expect(sorted[1].layer).toBe(19);
    });
  });

});
