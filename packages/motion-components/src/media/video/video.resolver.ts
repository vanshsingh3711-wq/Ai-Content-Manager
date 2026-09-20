import { CompositionDiagnostic } from '../../validation/validation.types';
import { VideoMediaConfig, ResolvedVideoMediaConfig, VideoFitMode, VideoPosition } from './video.types';

export function resolveVideoMedia(
  config: VideoMediaConfig | undefined,
  elementId: string
): { resolved?: ResolvedVideoMediaConfig; diagnostics: CompositionDiagnostic[] } {
  const diagnostics: CompositionDiagnostic[] = [];

  if (!config) {
    diagnostics.push({
      severity: 'error',
      reason: 'missing-metadata',
      message: `Video element ${elementId} is missing videoConfig.`,
    });
    return { diagnostics };
  }

  if (!config.src || config.src.trim() === '') {
    diagnostics.push({
      severity: 'error',
      reason: 'missing-metadata', // Reusing existing error reasons
      message: `Video element ${elementId} is missing a required src.`,
    });
    return { diagnostics };
  }

  const validFitModes: VideoFitMode[] = ['contain', 'cover', 'fill', 'none'];
  let fit: VideoFitMode = 'contain';

  if (config.fit && validFitModes.includes(config.fit)) {
    fit = config.fit;
  } else if (config.fit) {
    diagnostics.push({
      severity: 'warning',
      reason: 'invalid-bounds',
      message: `Video element ${elementId} provided invalid fit mode "${config.fit}". Defaulting to "contain".`,
    });
  }

  let position: VideoPosition = { x: 0.5, y: 0.5 };
  if (config.position) {
    position = { ...config.position };
    if (position.x < 0 || position.x > 1) {
      position.x = Math.max(0, Math.min(1, position.x));
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} position.x clamped to 0-1.`,
      });
    }
    if (position.y < 0 || position.y > 1) {
      position.y = Math.max(0, Math.min(1, position.y));
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} position.y clamped to 0-1.`,
      });
    }
  }

  let opacity = 1;
  if (typeof config.opacity === 'number') {
    opacity = config.opacity;
    if (opacity < 0 || opacity > 1) {
      opacity = Math.max(0, Math.min(1, opacity));
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} opacity clamped to 0-1.`,
      });
    }
  }

  let sourceStartFrame = 0;
  if (typeof config.sourceStartFrame === 'number') {
    sourceStartFrame = Math.max(0, Math.floor(config.sourceStartFrame));
    if (config.sourceStartFrame < 0) {
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} sourceStartFrame clamped to >= 0.`,
      });
    }
  }

  let sourceEndFrame: number | undefined;
  if (typeof config.sourceEndFrame === 'number') {
    if (config.sourceEndFrame <= sourceStartFrame) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} has sourceEndFrame <= sourceStartFrame. Ignored.`,
      });
    } else {
      sourceEndFrame = Math.floor(config.sourceEndFrame);
    }
  }

  let playbackRate = 1;
  if (typeof config.playbackRate === 'number') {
    if (config.playbackRate <= 0 || !isFinite(config.playbackRate) || isNaN(config.playbackRate)) {
      diagnostics.push({
        severity: 'error',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} has invalid playbackRate (${config.playbackRate}). Defaulting to 1.`,
      });
    } else {
      playbackRate = config.playbackRate;
    }
  }

  const loop = !!config.loop;
  const muted = config.muted !== undefined ? !!config.muted : false; // Default explicitly to false unless otherwise specified

  let volume = 1;
  if (typeof config.volume === 'number') {
    volume = config.volume;
    if (volume < 0 || volume > 1 || !isFinite(volume) || isNaN(volume)) {
      volume = Math.max(0, Math.min(1, isFinite(volume) ? volume : 1));
      diagnostics.push({
        severity: 'warning',
        reason: 'invalid-bounds',
        message: `Video element ${elementId} volume clamped to 0-1.`,
      });
    }
  }

  // Metadata Validation
  let metadata = config.metadata;
  if (metadata) {
    if (typeof metadata.width === 'number' && metadata.width <= 0) {
      diagnostics.push({ severity: 'error', reason: 'invalid-bounds', message: `Video element ${elementId} has invalid metadata width.` });
    }
    if (typeof metadata.height === 'number' && metadata.height <= 0) {
      diagnostics.push({ severity: 'error', reason: 'invalid-bounds', message: `Video element ${elementId} has invalid metadata height.` });
    }
    if (typeof metadata.durationInFrames === 'number' && metadata.durationInFrames <= 0) {
      diagnostics.push({ severity: 'error', reason: 'invalid-bounds', message: `Video element ${elementId} has invalid metadata durationInFrames.` });
    }
    if (typeof metadata.fps === 'number' && metadata.fps <= 0) {
      diagnostics.push({ severity: 'error', reason: 'invalid-bounds', message: `Video element ${elementId} has invalid metadata fps.` });
    }
  }

  const resolved: ResolvedVideoMediaConfig = {
    src: config.src,
    fit,
    position,
    opacity,
    sourceStartFrame,
    sourceEndFrame,
    playbackRate,
    loop,
    muted,
    volume,
    metadata,
  };

  return { resolved, diagnostics };
}
