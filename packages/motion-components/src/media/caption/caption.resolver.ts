import { CompositionDiagnostic } from '../../validation/validation.types';
import { CaptionTrackDefinition, ResolvedCaptionTrack, CaptionCue } from './caption.types';

export function resolveCaptionTrack(
  def: CaptionTrackDefinition,
  sceneDurationInFrames: number
): { resolved?: ResolvedCaptionTrack; diagnostics: CompositionDiagnostic[] } {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!def.id || def.id.trim() === '') {
    diagnostics.push({
      severity: 'error',
      reason: 'missing-metadata',
      message: 'Caption track is missing a required id.',
    });
    return { diagnostics };
  }

  const enabled = def.enabled !== false;
  
  if (!def.cues || !Array.isArray(def.cues)) {
    diagnostics.push({
      severity: 'error',
      reason: 'invalid-bounds',
      message: `Caption track ${def.id} is missing cues array.`,
    });
    return { diagnostics };
  }

  const validCues: CaptionCue[] = [];
  const cueIds = new Set<string>();

  for (let i = 0; i < def.cues.length; i++) {
    const cue = def.cues[i];
    
    if (!cue.id || cue.id.trim() === '') {
      diagnostics.push({
        severity: 'error',
        reason: 'missing-metadata',
        message: `Caption cue at index ${i} is missing an id.`,
      });
      continue;
    }

    if (cueIds.has(cue.id)) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Duplicate caption cue id found: ${cue.id}.`,
      });
      continue;
    }
    cueIds.add(cue.id);

    if (!cue.text || cue.text.trim() === '') {
      diagnostics.push({
        severity: 'error',
        reason: 'missing-metadata',
        message: `Caption cue ${cue.id} is missing text content.`,
      });
      continue;
    }

    let { startFrame, endFrame } = cue;
    startFrame = Math.max(0, Math.floor(startFrame));
    endFrame = Math.max(0, Math.floor(endFrame));

    if (endFrame <= startFrame) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Caption cue ${cue.id} has invalid timing (endFrame ${endFrame} <= startFrame ${startFrame}).`,
      });
      continue;
    }

    if (startFrame >= sceneDurationInFrames) {
      // Cue is entirely after the scene ends. Just skip it with a warning.
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Caption cue ${cue.id} starts after scene duration (${sceneDurationInFrames}). It will not render.`,
      });
      continue;
    }

    // Clamp endFrame to scene boundary
    if (endFrame > sceneDurationInFrames) {
      endFrame = sceneDurationInFrames;
    }

    // Process Words if any
    const validWords = [];
    if (cue.words && Array.isArray(cue.words)) {
      const wordIds = new Set<string>();
      for (const word of cue.words) {
        if (!word.id) continue;
        if (wordIds.has(word.id)) {
          diagnostics.push({
            severity: 'error',
            reason: 'invalid-bounds',
            message: `Duplicate caption word id found: ${word.id} in cue ${cue.id}.`,
          });
          continue;
        }
        wordIds.add(word.id);

        const wStart = Math.floor(word.startFrame);
        const wEnd = Math.floor(word.endFrame);

        if (wStart < startFrame || wEnd > endFrame) {
          diagnostics.push({
            severity: 'warning',
            reason: 'invalid-bounds',
            message: `Caption word ${word.id} timing (${wStart}-${wEnd}) falls outside parent cue ${cue.id} bounds (${startFrame}-${endFrame}). Word highlight may clip.`,
          });
        }

        if (wEnd > wStart) {
          validWords.push({
            ...word,
            startFrame: wStart,
            endFrame: wEnd
          });
        }
      }
    }

    validCues.push({
      ...cue,
      startFrame,
      endFrame,
      words: validWords.length > 0 ? validWords : undefined
    });
  }

  // Sort cues by start frame deterministically
  validCues.sort((a, b) => a.startFrame - b.startFrame);

  // Check for overlapping cues
  for (let i = 0; i < validCues.length - 1; i++) {
    const current = validCues[i];
    const next = validCues[i + 1];
    
    if (next.startFrame < current.endFrame) {
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Caption cue ${next.id} overlaps with previous cue ${current.id}. Forcing sequential display.`,
      });
      // Force strict sequence: truncate current cue to make way for the next one
      current.endFrame = next.startFrame;
    }
  }

  const resolved: ResolvedCaptionTrack = {
    id: def.id,
    enabled,
    cues: validCues.filter(c => c.endFrame > c.startFrame),
    metadata: def.metadata,
  };

  return { resolved, diagnostics };
}
