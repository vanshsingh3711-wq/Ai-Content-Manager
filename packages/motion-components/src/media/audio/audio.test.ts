import { describe, it, expect } from 'vitest';
import { resolveAudioTrack } from './audio.resolver';
import { getAudioVolumeAtFrame } from './audio.volume';
import { AudioTrackDefinition } from './audio.types';

describe('Audio Resolver', () => {
  it('should resolve a basic audio track with correct defaults', () => {
    const def: AudioTrackDefinition = {
      id: 'bgm-1',
      type: 'music',
      src: 'music.mp3',
      startFrame: 30,
    };
    
    const { resolved, diagnostics } = resolveAudioTrack(def, 300);
    expect(diagnostics).toHaveLength(0);
    expect(resolved).toMatchObject({
      id: 'bgm-1',
      type: 'music',
      src: 'music.mp3',
      startFrame: 30,
      durationInFrames: 270, // 300 - 30
      sourceStartFrame: 0,
      playbackRate: 1,
      volume: 1,
      muted: false,
      fadeInFrames: 0,
      fadeOutFrames: 0,
      loop: false
    });
  });

  it('should clamp volume to 0-1', () => {
    const def: AudioTrackDefinition = {
      id: 'bgm-1',
      type: 'music',
      src: 'music.mp3',
      startFrame: 0,
      volume: 2.5
    };
    
    const { resolved, diagnostics } = resolveAudioTrack(def, 100);
    expect(resolved?.volume).toBe(1);
    expect(diagnostics.some(d => d.message.includes('volume clamped'))).toBe(true);
  });

  it('should respect source metadata and playback rate for duration', () => {
    const def: AudioTrackDefinition = {
      id: 'vo-1',
      type: 'voiceover',
      src: 'vo.mp3',
      startFrame: 0,
      playbackRate: 2,
      metadata: {
        durationInFrames: 120
      }
    };
    
    // Original is 120, playing at 2x rate = 60 frames. Scene duration is 300.
    const { resolved } = resolveAudioTrack(def, 300);
    expect(resolved?.durationInFrames).toBe(60);
  });
});

describe('Audio Volume Math', () => {
  it('should return 0 when muted', () => {
    expect(getAudioVolumeAtFrame({
      localFrame: 10,
      durationInFrames: 100,
      baseVolume: 1,
      muted: true,
      fadeInFrames: 0,
      fadeOutFrames: 0
    })).toBe(0);
  });

  it('should calculate linear fade-in', () => {
    expect(getAudioVolumeAtFrame({
      localFrame: 0,
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 11,
      fadeOutFrames: 0
    })).toBe(0);

    expect(getAudioVolumeAtFrame({
      localFrame: 5,
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 11,
      fadeOutFrames: 0
    })).toBe(0.5);

    expect(getAudioVolumeAtFrame({
      localFrame: 10,
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 11,
      fadeOutFrames: 0
    })).toBe(1);
  });

  it('should calculate linear fade-out', () => {
    expect(getAudioVolumeAtFrame({
      localFrame: 99,
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 0,
      fadeOutFrames: 11 // frames 89 to 99
    })).toBe(0);

    expect(getAudioVolumeAtFrame({
      localFrame: 94, // (100 - 94) = 6 frames from end. (6-1)/10 = 0.5
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 0,
      fadeOutFrames: 11
    })).toBe(0.5);

    expect(getAudioVolumeAtFrame({
      localFrame: 89, // (100 - 89) = 11 frames from end. (11-1)/10 = 1.0
      durationInFrames: 100,
      baseVolume: 1,
      muted: false,
      fadeInFrames: 0,
      fadeOutFrames: 11
    })).toBe(1);
  });

  it('should handle overlapping fades gracefully', () => {
    const vol = getAudioVolumeAtFrame({
      localFrame: 5,
      durationInFrames: 10, // frames 0-9
      baseVolume: 1,
      muted: false,
      fadeInFrames: 10,
      fadeOutFrames: 10
    });
    // Proportionally: in=5 (frames 0-4), out=5 (frames 5-9)
    // localFrame=5 is the very start of fade-out: framesFromEnd = 5. (5-1)/(5-1) = 1.0
    expect(vol).toBe(1);
  });
});
