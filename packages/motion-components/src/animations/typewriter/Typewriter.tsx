import React, { useMemo } from 'react';
import { TypewriterProps } from './Typewriter.types';
import { interpolate, getEasingFunction } from '../utils/math';

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  direction = 'forward',
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'linear',
  cursor = {},
  currentFrame,
  style = {},
  testId = 'typewriter-wrapper',
}) => {
  const ease = getEasingFunction(easing);
  const endFrame = delayInFrames + durationInFrames;

  // Segment the text safely using Intl.Segmenter to avoid breaking emojis or grapheme clusters
  const graphemes = useMemo(() => {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).map(s => s.segment);
  }, [text]);

  const totalLength = graphemes.length;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = ease(rawProgress);
    }
  }

  // Calculate visible characters based on direction
  const visibleCount = Math.round(
    direction === 'forward' 
      ? interpolate(progress, [0, 1], [0, totalLength], 'clamp')
      : interpolate(progress, [0, 1], [totalLength, 0], 'clamp')
  );

  const visibleText = graphemes.slice(0, visibleCount).join('');

  // Cursor logic
  const isCursorEnabled = cursor.enabled !== false; // Default true if object passed, but wait, default in API is optional.
  // Actually, if cursor prop is omitted, it shouldn't show. If it's passed as empty object, we assume they want defaults.
  // Let's explicitly check:
  const showCursor = cursor.enabled === true;
  
  let cursorVisible = showCursor;
  if (showCursor && cursor.blink !== false) {
    // Blink every 15 frames
    cursorVisible = Math.floor(currentFrame / 15) % 2 === 0;
  }
  
  // Hide cursor entirely if animation is over (if desired). But actually traditional typewriters hide it when done.
  // We'll hide it after the animation ends to keep things clean.
  if (showCursor && progress === 1 && direction === 'forward') {
    cursorVisible = false;
  }

  return (
    <span
      data-testid={testId}
      style={{
        whiteSpace: 'pre-wrap', // Preserves \n as line breaks
        ...style,
      }}
    >
      {visibleText}
      {showCursor && (
        <span
          data-testid="typewriter-cursor"
          style={{
            opacity: cursorVisible ? 1 : 0,
            // Prevent the cursor from taking up space when hidden if we wanted, but opacity is better to avoid reflows
          }}
        >
          {cursor.character || '|'}
        </span>
      )}
    </span>
  );
};
