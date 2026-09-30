import { MotionPersonalityConfig, MotionPersonalityId } from './types';

const personalities: Record<MotionPersonalityId, MotionPersonalityConfig> = {
  premium: {
    id: 'premium',
    name: 'Premium',
    speedMultiplier: 1.0,
    overshoot: 0.15,
    staggerMultiplier: 1.2,
    defaultEasing: 'easeOut',
    scalePunchIntensity: 0.7,
    enterDurationMultiplier: 1.3,
    exitDurationMultiplier: 1.1,
  },

  energetic: {
    id: 'energetic',
    name: 'Energetic',
    speedMultiplier: 1.4,
    overshoot: 0.6,
    staggerMultiplier: 0.7,
    defaultEasing: 'spring',
    scalePunchIntensity: 1.3,
    enterDurationMultiplier: 0.7,
    exitDurationMultiplier: 0.6,
  },

  editorial: {
    id: 'editorial',
    name: 'Editorial',
    speedMultiplier: 0.9,
    overshoot: 0.0,
    staggerMultiplier: 1.0,
    defaultEasing: 'easeInOut',
    scalePunchIntensity: 0.4,
    enterDurationMultiplier: 1.1,
    exitDurationMultiplier: 1.0,
  },

  technical: {
    id: 'technical',
    name: 'Technical',
    speedMultiplier: 1.2,
    overshoot: 0.05,
    staggerMultiplier: 0.8,
    defaultEasing: 'easeOut',
    scalePunchIntensity: 0.5,
    enterDurationMultiplier: 0.8,
    exitDurationMultiplier: 0.7,
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    speedMultiplier: 0.8,
    overshoot: 0.0,
    staggerMultiplier: 1.5,
    defaultEasing: 'easeInOut',
    scalePunchIntensity: 0.3,
    enterDurationMultiplier: 1.5,
    exitDurationMultiplier: 1.2,
  },
};

export function getPersonality(id?: MotionPersonalityId): MotionPersonalityConfig {
  if (!id || !personalities[id]) {
    return personalities.premium;
  }
  return personalities[id];
}

export function getAllPersonalities(): MotionPersonalityConfig[] {
  return Object.values(personalities);
}
