import { describe, it, expect } from 'vitest';
import { validateExport } from './export.validation';
import { ResolvedSequence } from '../sequence/sequence.types';
import { ExportConfig } from './export.types';

describe('Export Pipeline Validation', () => {
  const validSequence: ResolvedSequence = {
    id: 'test-seq',
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 300,
    diagnostics: [],
    scenes: [
      { id: 'scene1', globalStartFrame: 0, globalEndFrame: 300, scene: {} as any }
    ]
  };

  const validConfig: ExportConfig = {
    format: 'mp4',
    codec: 'h264'
  };

  it('allows valid project and config', () => {
    const diags = validateExport(validSequence, validConfig);
    expect(diags.filter(d => d.severity === 'error')).toHaveLength(0);
  });

  it('blocks missing dimensions', () => {
    const invalidSeq = { ...validSequence, width: 0 };
    const diags = validateExport(invalidSeq, validConfig);
    expect(diags).toContainEqual(expect.objectContaining({ message: expect.stringMatching(/width must be greater than 0/) }));
  });

  it('blocks missing scenes', () => {
    const invalidSeq = { ...validSequence, scenes: [] };
    const diags = validateExport(invalidSeq, validConfig);
    expect(diags).toContainEqual(expect.objectContaining({ message: expect.stringMatching(/contain at least one scene/) }));
  });

  it('blocks unsupported formats', () => {
    const invalidConfig = { ...validConfig, format: 'gif' as any };
    const diags = validateExport(validSequence, invalidConfig);
    expect(diags).toContainEqual(expect.objectContaining({ message: expect.stringMatching(/Unsupported export format/) }));
  });

  it('propagates internal sequence errors', () => {
    const errorSeq: ResolvedSequence = { 
      ...validSequence, 
      diagnostics: [{ severity: 'error', type: 'invalid-bounds', message: 'Internal error' }]
    };
    const diags = validateExport(errorSeq, validConfig);
    expect(diags).toContainEqual(expect.objectContaining({ message: 'Internal error' }));
  });
});
