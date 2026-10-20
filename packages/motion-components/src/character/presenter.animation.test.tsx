import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { PresenterRenderer } from './PresenterRenderer';
import { ResolvedSceneElement } from '../scene/scene.types';
import * as remotion from 'remotion';

// Mock remotion's useCurrentFrame to test deterministic evaluation
vi.mock('remotion', async () => {
  const actual = await vi.importActual('remotion');
  return {
    ...actual,
    useCurrentFrame: vi.fn(),
    useVideoConfig: () => ({ fps: 30 })
  };
});

// Since SvgCharacter uses remotion hooks, we mock it out to just inspect props passed to it
vi.mock('./SvgCharacter', () => ({
  SvgCharacter: (props: any) => <div data-testid="svg-character" data-props={JSON.stringify(props)} />
}));

const mockElement: ResolvedSceneElement = {
  id: 'p1',
  type: 'presenter',
  geometry: { x: 0, y: 0, width: 400, height: 400 },
  anchor: 'center',
  timing: { startFrame: 0, durationInFrames: 300, endFrame: 300 },
  layer: 1,
  presenterTimeline: [
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'idle',
      expression: 'neutral',
      startFrame: 0,
      durationInFrames: 60
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'talk',
      expression: 'happy',
      startFrame: 60,
      durationInFrames: 60
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'talk',
      expression: 'surprised',
      startFrame: 120,
      durationInFrames: 60
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'blink',
      startFrame: 80,
      durationInFrames: 5 // overlapping blink while talking+happy
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'pointRight',
      resolvedTargetGeometry: { x: 500, y: 0, width: 100, height: 100 },
      startFrame: 0,
      durationInFrames: 180
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'nod',
      startFrame: 180,
      durationInFrames: 60
    },
    {
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'present',
      startFrame: 240,
      durationInFrames: 60
    }
  ]
};

describe('PresenterRenderer Animation Resolution', () => {
  it('resolves idle + neutral + pointRight correctly at frame 30', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(30);

    const { getByTestId } = render(<PresenterRenderer element={mockElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.isTalking).toBe(false);
    expect(props.isBlinking).toBe(false);
    expect(props.expression).toBe('neutral');
    expect(props.state).toBe('pointRight'); // pointRight overrides idle
    expect(props.pointerRotation).not.toBe(0); // pointing to target
  });

  it('resolves talk + happy + pointRight correctly at frame 70', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(70);

    const { getByTestId } = render(<PresenterRenderer element={mockElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.isTalking).toBe(true);
    expect(props.isBlinking).toBe(false);
    expect(props.expression).toBe('happy');
    expect(props.state).toBe('talk'); // talk overrides pointing for state string, but pointerRotation is still passed
    expect(props.pointerRotation).not.toBe(0);
  });

  it('resolves talk + happy + blink + pointRight at frame 82 (overlapping)', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(82);

    const { getByTestId } = render(<PresenterRenderer element={mockElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.isTalking).toBe(true);
    expect(props.isBlinking).toBe(true); // From the overlapping blink action
    expect(props.expression).toBe('happy');
    expect(props.state).toBe('talk');
  });

  it('resolves talk + surprised + pointRight at frame 150', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(150);

    const { getByTestId } = render(<PresenterRenderer element={mockElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.isTalking).toBe(true);
    expect(props.isBlinking).toBe(false);
    expect(props.expression).toBe('surprised');
    expect(props.gesture).toBe('pointRight');
  });

  it('resolves talk + nod correctly at frame 200', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(200);

    // Provide a modified element with 'talk' active at frame 200 to test overlapping
    const customElement = JSON.parse(JSON.stringify(mockElement));
    customElement.presenterTimeline.push({
      presenterId: 'p1',
      characterAssetId: 'svg-presenter',
      action: 'talk',
      expression: 'happy',
      startFrame: 180,
      durationInFrames: 60
    });

    const { getByTestId } = render(<PresenterRenderer element={customElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.isTalking).toBe(true);
    expect(props.isNodding).toBe(true);
    expect(props.expression).toBe('happy');
    expect(props.gesture).toBe('none'); // nod does not set gesture
  });

  it('resolves present gesture correctly at frame 250', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(250);

    const { getByTestId } = render(<PresenterRenderer element={mockElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    expect(props.gesture).toBe('present');
    expect(props.state).toBe('present');
  });

  it('resolves conflicts deterministically (later startFrame wins, then later index wins)', () => {
    vi.mocked(remotion.useCurrentFrame).mockReturnValue(100);

    const conflictingElement = JSON.parse(JSON.stringify(mockElement));
    conflictingElement.presenterTimeline = [
      {
        presenterId: 'p1',
        characterAssetId: 'svg-presenter',
        action: 'pointLeft',
        startFrame: 0,
        durationInFrames: 200 // declared first
      },
      {
        presenterId: 'p1',
        characterAssetId: 'svg-presenter',
        action: 'pointRight',
        startFrame: 50,
        durationInFrames: 100 // declared later, later start frame
      },
      {
        presenterId: 'p1',
        characterAssetId: 'svg-presenter',
        action: 'pointUp',
        startFrame: 50,
        durationInFrames: 100 // same start frame, but declared last
      }
    ];

    const { getByTestId } = render(<PresenterRenderer element={conflictingElement} />);
    const props = JSON.parse(getByTestId('svg-character').getAttribute('data-props') || '{}');

    // Should resolve to pointUp because it has the same latest start frame (50) and is last in the array.
    expect(props.gesture).toBe('pointUp');
  });
});
