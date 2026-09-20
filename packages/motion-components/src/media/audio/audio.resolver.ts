import { CompositionDiagnostic } from '../../validation/validation.types';
import { AudioTrackDefinition, ResolvedAudioTrack } from './audio.types';

export function resolveAudioTrack(
  def: AudioTrackDefinition,
  sceneDurationInFrames: number
): { resolved?: ResolvedAudioTrack; diagnostics: CompositionDiagnostic[] } {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!def.id || def.id.trim() === '') {
    diagnostics.push({
      severity: 'error',
      reason: 'missing-metadata',
      message: 'Audio track is missing a required id.',
    });
    return { diagnostics };
  }

  if (!def.src || def.src.trim() === '') {
    diagnostics.push({
      severity: 'error',
      reason: 'missing-metadata',
      message: `Audio track ${def.id} is missing a required src.`,
    });
    return { diagnostics };
  }

  if (def.startFrame < 0) {
    diagnostics.push({
      severity: 'error',
      reason: 'invalid-bounds',
      message: `Audio track ${def.id} has startFrame < 0.`,
    });
    return { diagnostics };
  }

  let sourceStartFrame = 0;
  if (typeof def.sourceStartFrame === 'number') {
    sourceStartFrame = Math.max(0, Math.floor(def.sourceStartFrame));
    if (def.sourceStartFrame < 0) {
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} sourceStartFrame clamped to >= 0.`,
      });
    }
  }

  let sourceEndFrame: number | undefined;
  if (typeof def.sourceEndFrame === 'number') {
    if (def.sourceEndFrame <= sourceStartFrame) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} has sourceEndFrame <= sourceStartFrame. Ignored.`,
      });
    } else {
      sourceEndFrame = Math.floor(def.sourceEndFrame);
    }
  }

  let playbackRate = 1;
  if (typeof def.playbackRate === 'number') {
    if (def.playbackRate <= 0 || !isFinite(def.playbackRate) || isNaN(def.playbackRate)) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} has invalid playbackRate (${def.playbackRate}). Defaulting to 1.`,
      });
    } else {
      playbackRate = def.playbackRate;
    }
  }

  const loop = !!def.loop;
  const muted = def.muted !== undefined ? !!def.muted : false;

  let volume = 1;
  if (typeof def.volume === 'number') {
    volume = def.volume;
    if (volume < 0 || volume > 1 || !isFinite(volume) || isNaN(volume)) {
      volume = Math.max(0, Math.min(1, isFinite(volume) ? volume : 1));
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} volume clamped to 0-1.`,
      });
    }
  }

  let fadeInFrames = 0;
  if (typeof def.fadeInFrames === 'number') {
    fadeInFrames = Math.max(0, Math.floor(def.fadeInFrames));
    if (def.fadeInFrames < 0) {
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} fadeInFrames clamped to >= 0.`,
      });
    }
  }

  let fadeOutFrames = 0;
  if (typeof def.fadeOutFrames === 'number') {
    fadeOutFrames = Math.max(0, Math.floor(def.fadeOutFrames));
    if (def.fadeOutFrames < 0) {
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} fadeOutFrames clamped to >= 0.`,
      });
    }
  }

  // Determine Duration
  let durationInFrames = sceneDurationInFrames - def.startFrame; // Default fills the rest of the scene
  
  if (typeof def.durationInFrames === 'number') {
    if (def.durationInFrames <= 0) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Audio track ${def.id} has invalid durationInFrames. Using fallback.`,
      });
    } else {
      durationInFrames = def.durationInFrames;
    }
  } else if (def.metadata?.durationInFrames) {
    // If we know the source duration, compute the effective duration (accounting for start offset and rate)
    let effectiveSourceDuration = def.metadata.durationInFrames;
    if (sourceEndFrame !== undefined) {
      effectiveSourceDuration = sourceEndFrame - sourceStartFrame;
    } else {
      effectiveSourceDuration = Math.max(0, effectiveSourceDuration - sourceStartFrame);
    }
    
    // Scale by playback rate
    const trackDuration = Math.floor(effectiveSourceDuration / playbackRate);
    
    // If not looping, we don't play past the source duration
    if (!loop) {
      durationInFrames = Math.min(durationInFrames, trackDuration);
    }
  }

  // Fade overlap check
  if (fadeInFrames + fadeOutFrames > durationInFrames) {
    diagnostics.push({
      severity: 'warning',
      reason: 'invalid-bounds',
      message: `Audio track ${def.id} fades (${fadeInFrames} + ${fadeOutFrames}) exceed duration (${durationInFrames}). Fades will be clamped during playback.`,
    });
  }

  const resolved: ResolvedAudioTrack = {
    id: def.id,
    type: def.type,
    src: def.src,
    startFrame: def.startFrame,
    durationInFrames,
    sourceStartFrame,
    sourceEndFrame,
    playbackRate,
    volume,
    muted,
    fadeInFrames,
    fadeOutFrames,
    loop,
    metadata: def.metadata,
  };

  return { resolved, diagnostics };
}
