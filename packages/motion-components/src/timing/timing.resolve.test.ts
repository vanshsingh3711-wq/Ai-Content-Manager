import { describe, it, expect } from 'vitest';
import { resolveTimingState } from './timing.resolve';
import { getSceneDuration, secondsToFrames } from './timing.utils';

describe('Timing System', () => {

  describe('resolveTimingState', () => {
    
    it('resolves basic visibility', () => {
      const config = { startFrame: 100, durationInFrames: 50 };
      
      expect(resolveTimingState(50, config).state).toBe('before');
      expect(resolveTimingState(100, config).state).toBe('visible');
      expect(resolveTimingState(125, config).state).toBe('visible');
      expect(resolveTimingState(150, config).state).toBe('after');
    });

    it('calculates local frame correctly', () => {
      const config = { startFrame: 100 };
      // local frame bounds at 0 if before start
      expect(resolveTimingState(50, config).localFrame).toBe(-50);
      expect(resolveTimingState(100, config).localFrame).toBe(0);
      expect(resolveTimingState(150, config).localFrame).toBe(50);
    });

    it('handles enter progress and state', () => {
      const config = { startFrame: 100, durationInFrames: 50, enter: { durationInFrames: 10 } };
      
      // Before start
      expect(resolveTimingState(90, config).enterProgress).toBe(0);
      
      // Halfway through enter
      const half = resolveTimingState(105, config);
      expect(half.state).toBe('entering');
      expect(half.enterProgress).toBe(0.5);
      
      // Finished entering
      const done = resolveTimingState(110, config);
      expect(done.state).toBe('visible');
      expect(done.enterProgress).toBe(1);
    });

    it('handles exit progress and state', () => {
      const config = { startFrame: 100, durationInFrames: 50, exit: { durationInFrames: 10 } };
      
      // End frame is 150. Exit starts at 140.
      expect(resolveTimingState(130, config).exitProgress).toBe(0);
      
      // Halfway through exit
      const half = resolveTimingState(145, config);
      expect(half.state).toBe('exiting');
      expect(half.exitProgress).toBe(0.5);
      
      // Finished exiting
      const done = resolveTimingState(150, config);
      expect(done.state).toBe('after');
      expect(done.exitProgress).toBe(1);
    });

    it('handles delay', () => {
      const config = { startFrame: 100, delayInFrames: 20, durationInFrames: 50 };
      // Effective start is 120. End is 170.
      expect(resolveTimingState(110, config).state).toBe('before');
      expect(resolveTimingState(120, config).state).toBe('visible');
      expect(resolveTimingState(170, config).state).toBe('after');
    });

    it('handles group offset (inheritance)', () => {
      const config = { startFrame: 50, durationInFrames: 50 };
      // Parent group started at 100, so effective start is 150.
      const timing = resolveTimingState(150, config, 100);
      expect(timing.state).toBe('visible');
      expect(timing.localFrame).toBe(0);
      expect(timing.effectiveStartFrame).toBe(150);
    });

  });

  describe('getSceneDuration', () => {
    it('calculates the maximum duration of a flat scene', () => {
      const els = [
        { id: '1', timing: { startFrame: 0, durationInFrames: 100 } },
        { id: '2', timing: { startFrame: 50, durationInFrames: 100 } }, // ends at 150
        { id: '3', timing: { startFrame: 200, durationInFrames: 10 } }, // ends at 210
      ];
      expect(getSceneDuration(els)).toBe(210);
    });

    it('calculates the maximum duration of a nested scene with offsets', () => {
      const els = [
        { 
          id: 'group', 
          timing: { startFrame: 100, durationInFrames: 500 }, // Group ends at 600
          children: [
            // Child starts at 450 relative to group (100) = 550. Duration 100. Ends at 650.
            { id: 'child', timing: { startFrame: 450, durationInFrames: 100 } }
          ]
        }
      ];
      // Max should be 650 because the child outlives the parent group!
      expect(getSceneDuration(els)).toBe(650);
    });
  });

  describe('secondsToFrames', () => {
    it('converts correctly', () => {
      expect(secondsToFrames(2, 30)).toBe(60);
      expect(secondsToFrames(1.5, 60)).toBe(90);
    });
  });

});
