import { CompositionDiagnostic } from '../validation/validation.types';
import { StoryPlan, StoryBeatType } from './story.types';

const VALID_BEAT_TYPES: Set<StoryBeatType> = new Set([
  'hook', 'setup', 'problem', 'explanation', 'evidence', 
  'example', 'comparison', 'reveal', 'transition', 'conclusion', 'cta'
]);

export function validateStoryPlan(plan: StoryPlan): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!plan.id) {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Story Plan is missing an ID.'
    });
  }

  if (!plan.topic || plan.topic.trim() === '') {
    diagnostics.push({
      severity: 'error',
      type: 'missing-metadata',
      message: 'Story Plan must have a valid topic.'
    });
  }

  if (!plan.beats || !Array.isArray(plan.beats) || plan.beats.length === 0) {
    diagnostics.push({
      severity: 'error',
      type: 'invalid-bounds',
      message: 'Story Plan must contain at least one beat.'
    });
    return diagnostics; // Stop further evaluation if there are no beats
  }

  const beatIds = new Set<string>();

  for (let i = 0; i < plan.beats.length; i++) {
    const beat = plan.beats[i];

    if (!beat.id) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Beat at index ${i} is missing an ID.`
      });
    } else if (beatIds.has(beat.id)) {
      diagnostics.push({
        severity: 'error',
        type: 'invalid-bounds',
        message: `Duplicate beat ID found: ${beat.id}`
      });
    } else {
      beatIds.add(beat.id);
    }

    if (!VALID_BEAT_TYPES.has(beat.type)) {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Beat ${beat.id || i} has an invalid type: ${beat.type}`
      });
    }

    if (!beat.purpose || beat.purpose.trim() === '') {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Beat ${beat.id || i} is missing a purpose.`
      });
    }

    if (!beat.message || beat.message.trim() === '') {
      diagnostics.push({
        severity: 'error',
        type: 'missing-metadata',
        message: `Beat ${beat.id || i} is missing a message.`
      });
    }

    if (beat.suggestedDurationInFrames !== undefined && beat.suggestedDurationInFrames <= 0) {
      diagnostics.push({
        severity: 'error',
        type: 'invalid-bounds',
        message: `Beat ${beat.id || i} has an invalid suggested duration: ${beat.suggestedDurationInFrames}`
      });
    }
  }

  return diagnostics;
}
