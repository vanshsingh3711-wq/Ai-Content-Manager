import { evaluateKeyframeTrack } from './keyframes.evaluator';
import { KeyframeTrack } from './keyframes.types';

describe('Keyframe Evaluator', () => {
  it('returns base value when no keyframes exist', () => {
    const track: KeyframeTrack = { property: 'x', keyframes: [] };
    expect(evaluateKeyframeTrack(track, 10, 100)).toBe(100);
  });

  it('holds static value for a single keyframe', () => {
    const track: KeyframeTrack = { 
      property: 'x', 
      keyframes: [{ id: 'k1', frame: 30, value: 500 }] 
    };
    expect(evaluateKeyframeTrack(track, 10, 100)).toBe(500);
    expect(evaluateKeyframeTrack(track, 60, 100)).toBe(500);
  });

  it('returns first keyframe value before first keyframe', () => {
    const track: KeyframeTrack = { 
      property: 'x', 
      keyframes: [
        { id: 'k1', frame: 30, value: 500 },
        { id: 'k2', frame: 60, value: 1000 }
      ] 
    };
    expect(evaluateKeyframeTrack(track, 10, 100)).toBe(500);
  });

  it('returns last keyframe value after last keyframe', () => {
    const track: KeyframeTrack = { 
      property: 'x', 
      keyframes: [
        { id: 'k1', frame: 30, value: 500 },
        { id: 'k2', frame: 60, value: 1000 }
      ] 
    };
    expect(evaluateKeyframeTrack(track, 90, 100)).toBe(1000);
  });

  it('linearly interpolates between keyframes', () => {
    const track: KeyframeTrack = { 
      property: 'x', 
      keyframes: [
        { id: 'k1', frame: 0, value: 0 },
        { id: 'k2', frame: 100, value: 100, easing: 'linear' }
      ] 
    };
    expect(evaluateKeyframeTrack(track, 50, 100)).toBe(50);
    expect(evaluateKeyframeTrack(track, 25, 100)).toBe(25);
  });

  it('handles unordered keyframes correctly', () => {
    const track: KeyframeTrack = { 
      property: 'x', 
      keyframes: [
        { id: 'k2', frame: 100, value: 100 },
        { id: 'k1', frame: 0, value: 0 }
      ] 
    };
    expect(evaluateKeyframeTrack(track, 50, 100)).toBe(50);
  });
});
