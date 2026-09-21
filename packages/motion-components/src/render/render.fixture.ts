import { ResolvedSequence } from '../sequence/sequence.types';
import { CompositionDiagnostic } from '../validation/validation.types';

export const renderFixtureDiagnosticMock: CompositionDiagnostic[] = [];

export const renderFixtureSequence: ResolvedSequence = {
  id: 'fixture-seq',
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 300,
  diagnostics: [],
  scenes: [
    {
      id: 'scene-1',
      globalStartFrame: 0,
      globalEndFrame: 150,
      scene: {
        id: 'scene-1',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 150,
        theme: {} as any,
        tokens: {} as any,
        elements: [
          {
            id: 'element-1',
            type: 'text',
            textContent: 'Test',
            geometry: { x: 0, y: 0, width: 100, height: 100 },
            anchor: 'center',
            layer: 0,
            timing: { startFrame: 0, durationInFrames: 150, endFrame: 150 }
          }
        ],
        attention: { type: 'sequence', tracks: [] },
        audio: [],
        diagnostics: [],
        valid: true
      }
    }
  ]
};
