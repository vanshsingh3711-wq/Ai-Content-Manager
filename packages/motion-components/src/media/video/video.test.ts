import { describe, it, expect } from 'vitest';
import { resolveVideoMedia } from './video.resolver';
import { getSourceFrame } from './video.frame';

describe('Video Resolver', () => {
  it('should provide default values for missing configs', () => {
    const { resolved, diagnostics } = resolveVideoMedia({ src: 'test.mp4' }, 'vid-1');
    expect(diagnostics.length).toBe(0);
    expect(resolved?.fit).toBe('contain');
    expect(resolved?.position).toEqual({ x: 0.5, y: 0.5 });
    expect(resolved?.playbackRate).toBe(1);
    expect(resolved?.loop).toBe(false);
    expect(resolved?.volume).toBe(1);
    expect(resolved?.muted).toBe(false);
  });

  it('should clamp playbackRate > 0 and volume 0-1', () => {
    const { resolved, diagnostics } = resolveVideoMedia({
      src: 'test.mp4',
      playbackRate: -1,
      volume: 1.5
    }, 'vid-1');
    
    expect(diagnostics.length).toBe(2);
    expect(resolved?.playbackRate).toBe(1); // Default fallback for invalid rate
    expect(resolved?.volume).toBe(1); // Clamped
  });

  it('should error if sourceEndFrame <= sourceStartFrame', () => {
    const { resolved, diagnostics } = resolveVideoMedia({
      src: 'test.mp4',
      sourceStartFrame: 100,
      sourceEndFrame: 90
    }, 'vid-1');

    expect(diagnostics.length).toBe(1);
    expect(resolved?.sourceEndFrame).toBeUndefined(); // Ignored
  });
});

describe('Video Frame Mapper', () => {
  it('should calculate pure 1:1 mapping', () => {
    expect(getSourceFrame({
      localFrame: 0,
      sourceStartFrame: 0,
      playbackRate: 1,
      loop: false
    })).toBe(0);

    expect(getSourceFrame({
      localFrame: 30,
      sourceStartFrame: 0,
      playbackRate: 1,
      loop: false
    })).toBe(30);
  });

  it('should respect sourceStartFrame', () => {
    expect(getSourceFrame({
      localFrame: 0,
      sourceStartFrame: 120,
      playbackRate: 1,
      loop: false
    })).toBe(120);

    expect(getSourceFrame({
      localFrame: 10,
      sourceStartFrame: 120,
      playbackRate: 1,
      loop: false
    })).toBe(130);
  });

  it('should calculate playback rate deterministically using floor', () => {
    // Rate 2x
    expect(getSourceFrame({
      localFrame: 10,
      sourceStartFrame: 0,
      playbackRate: 2,
      loop: false
    })).toBe(20);

    // Rate 0.5x
    expect(getSourceFrame({
      localFrame: 11,
      sourceStartFrame: 0,
      playbackRate: 0.5,
      loop: false
    })).toBe(5); // Math.floor(11 * 0.5) = Math.floor(5.5) = 5
  });

  it('should clamp to bounds if not looping', () => {
    expect(getSourceFrame({
      localFrame: 100,
      sourceStartFrame: 0,
      sourceEndFrame: 50,
      playbackRate: 1,
      loop: false
    })).toBe(50); // Clamped to 50
  });

  it('should wrap around bounds if looping', () => {
    expect(getSourceFrame({
      localFrame: 0,
      sourceStartFrame: 0,
      sourceEndFrame: 90,
      playbackRate: 1,
      loop: true
    })).toBe(0);

    expect(getSourceFrame({
      localFrame: 91, // 1 frame past end
      sourceStartFrame: 0,
      sourceEndFrame: 90, // Range length is 91 frames (0 to 90)
      playbackRate: 1,
      loop: true
    })).toBe(0); // Wrapped around to 0

    expect(getSourceFrame({
      localFrame: 182, // 2 cycles past end
      sourceStartFrame: 0,
      sourceEndFrame: 90, 
      playbackRate: 1,
      loop: true
    })).toBe(0);
  });

  it('should loop respecting sourceStartFrame offset', () => {
    expect(getSourceFrame({
      localFrame: 11, // 1 frame past range (length 11)
      sourceStartFrame: 10,
      sourceEndFrame: 20, 
      playbackRate: 1,
      loop: true
    })).toBe(10); // Wraps back to start
  });
});
