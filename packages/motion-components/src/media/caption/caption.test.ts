import { describe, it, expect } from 'vitest';
import { resolveCaptionTrack } from './caption.resolver';
import { CaptionTrackDefinition } from './caption.types';

describe('Caption Resolver', () => {
  it('should resolve a single valid cue', () => {
    const track: CaptionTrackDefinition = {
      id: 'track1',
      cues: [
        { id: 'cue1', text: 'Hello', startFrame: 10, endFrame: 50 }
      ]
    };

    const { resolved, diagnostics } = resolveCaptionTrack(track, 100);
    expect(diagnostics.length).toBe(0);
    expect(resolved?.cues.length).toBe(1);
    expect(resolved?.cues[0].startFrame).toBe(10);
    expect(resolved?.cues[0].endFrame).toBe(50);
  });

  it('should fix overlapping cues deterministically', () => {
    const track: CaptionTrackDefinition = {
      id: 'track1',
      cues: [
        { id: 'cue1', text: 'First', startFrame: 10, endFrame: 50 },
        { id: 'cue2', text: 'Second', startFrame: 40, endFrame: 80 }
      ]
    };

    const { resolved, diagnostics } = resolveCaptionTrack(track, 100);
    expect(diagnostics.length).toBe(1); // One overlap warning
    expect(resolved?.cues[0].startFrame).toBe(10);
    expect(resolved?.cues[0].endFrame).toBe(40); // Clamped to next startFrame
    expect(resolved?.cues[1].startFrame).toBe(40);
    expect(resolved?.cues[1].endFrame).toBe(80);
  });

  it('should clamp cue end bounds to scene duration', () => {
    const track: CaptionTrackDefinition = {
      id: 'track1',
      cues: [
        { id: 'cue1', text: 'Hello', startFrame: 90, endFrame: 150 }
      ]
    };

    const { resolved } = resolveCaptionTrack(track, 100);
    expect(resolved?.cues[0].startFrame).toBe(90);
    expect(resolved?.cues[0].endFrame).toBe(100); // Clamped to duration
  });

  it('should filter out invalid words and cues', () => {
    const track: CaptionTrackDefinition = {
      id: 'track1',
      cues: [
        { id: 'cue1', text: 'Invalid', startFrame: 50, endFrame: 10 }, // Invalid bounds
        { id: 'cue2', text: 'Valid', startFrame: 10, endFrame: 50, words: [
          { id: 'w1', text: 'Val', startFrame: 20, endFrame: 10 }, // Invalid
          { id: 'w2', text: 'id', startFrame: 30, endFrame: 40 } // Valid
        ]}
      ]
    };

    const { resolved, diagnostics } = resolveCaptionTrack(track, 100);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(resolved?.cues.length).toBe(1);
    expect(resolved?.cues[0].id).toBe('cue2');
    expect(resolved?.cues[0].words?.length).toBe(1);
    expect(resolved?.cues[0].words?.[0].id).toBe('w2');
  });

  it('should warn when word timing falls outside cue bounds', () => {
    const track: CaptionTrackDefinition = {
      id: 'track1',
      cues: [
        { id: 'cue1', text: 'Hello world', startFrame: 10, endFrame: 50, words: [
          { id: 'w1', text: 'Hello', startFrame: 5, endFrame: 20 }, // Outside cue start
          { id: 'w2', text: 'world', startFrame: 30, endFrame: 60 } // Outside cue end
        ]}
      ]
    };

    const { resolved, diagnostics } = resolveCaptionTrack(track, 100);
    expect(diagnostics.length).toBe(2);
    expect(diagnostics[0].message).toContain('falls outside parent cue');
    expect(resolved?.cues[0].words?.length).toBe(2);
  });
});
