import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Typewriter } from './Typewriter';

describe('Typewriter Primitive', () => {
  const TEXT = 'Hello world';
  const DURATION = 11;
  const DELAY = 5;

  it('renders nothing before delay', () => {
    const { getByTestId } = render(
      <Typewriter text={TEXT} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={0} />
    );
    const element = getByTestId('typewriter-wrapper');
    expect(element.textContent).toBe('');
  });

  it('renders complete text at the end of duration', () => {
    const { getByTestId } = render(
      <Typewriter text={TEXT} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={16} />
    );
    const element = getByTestId('typewriter-wrapper');
    expect(element.textContent).toBe(TEXT);
  });

  it('remains complete after animation ends', () => {
    const { getByTestId } = render(
      <Typewriter text={TEXT} delayInFrames={DELAY} durationInFrames={DURATION} currentFrame={100} />
    );
    const element = getByTestId('typewriter-wrapper');
    expect(element.textContent).toBe(TEXT);
  });

  it('progressively reveals text during animation', () => {
    // 11 characters. 11 duration frames.
    // At currentFrame = 5 (middle), it should reveal ~half.
    const { getByTestId } = render(
      <Typewriter text={TEXT} delayInFrames={0} durationInFrames={11} currentFrame={5.5} easing="linear" />
    );
    const element = getByTestId('typewriter-wrapper');
    // 5.5 / 11 = 0.5. 11 * 0.5 = 5.5 => Math.round(5.5) = 6
    // "Hello " is 6 characters.
    expect(element.textContent).toBe('Hello ');
  });

  it('handles reverse mode correctly (starts complete, ends empty)', () => {
    const { getByTestId, rerender } = render(
      <Typewriter text={TEXT} direction="reverse" delayInFrames={0} durationInFrames={11} currentFrame={0} easing="linear" />
    );
    const element = getByTestId('typewriter-wrapper');
    expect(element.textContent).toBe(TEXT); // fully visible at start

    rerender(
      <Typewriter text={TEXT} direction="reverse" delayInFrames={0} durationInFrames={11} currentFrame={11} easing="linear" />
    );
    expect(element.textContent).toBe(''); // fully hidden at end
  });

  it('safely handles unicode graphemes (emojis)', () => {
    const EMOJI_TEXT = '👨‍👩‍👧‍👦 hello 👋🏽';
    // Length in JS UTF-16 code units is 20+
    // Length in graphemes is: [👨‍👩‍👧‍👦] [ ] [h] [e] [l] [l] [o] [ ] [👋🏽] = 9 graphemes
    const { getByTestId, rerender } = render(
      <Typewriter text={EMOJI_TEXT} delayInFrames={0} durationInFrames={10} currentFrame={10} />
    );
    const element = getByTestId('typewriter-wrapper');
    expect(element.textContent).toBe(EMOJI_TEXT);

    // Render partially to ensure it doesn't break the emoji
    rerender(
      <Typewriter text={EMOJI_TEXT} delayInFrames={0} durationInFrames={9} currentFrame={1} easing="linear" />
    );
    // progress = 1/9. 9 graphemes * (1/9) = 1 grapheme.
    // The first grapheme is the family emoji.
    expect(element.textContent).toBe('👨‍👩‍👧‍👦');
  });

  it('renders a blinking cursor if enabled', () => {
    const { getByTestId, rerender } = render(
      <Typewriter text={TEXT} delayInFrames={0} durationInFrames={10} currentFrame={0} cursor={{ enabled: true }} />
    );
    
    // Frame 0: visible (0/15 % 2 === 0)
    let cursor = getByTestId('typewriter-cursor');
    expect(cursor.style.opacity).toBe('1');
    expect(cursor.textContent).toBe('|');

    // Frame 15: hidden (15/15 % 2 === 1)
    rerender(
      <Typewriter text={TEXT} delayInFrames={0} durationInFrames={100} currentFrame={15} cursor={{ enabled: true }} />
    );
    cursor = getByTestId('typewriter-cursor');
    expect(cursor.style.opacity).toBe('0');
  });

  it('hides cursor completely at the end of a forward animation', () => {
    const { getByTestId } = render(
      <Typewriter text={TEXT} delayInFrames={0} durationInFrames={10} currentFrame={10} cursor={{ enabled: true }} />
    );
    
    // Frame 10: progress is 1. Should be hidden regardless of blink phase.
    const cursor = getByTestId('typewriter-cursor');
    expect(cursor.style.opacity).toBe('0');
  });
});
