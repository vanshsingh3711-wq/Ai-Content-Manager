import React from 'react';
import { StaggerProps } from './Stagger.types';
import { getEasingFunction } from '../utils/math';

export const Stagger: React.FC<StaggerProps> = ({
  delayInFrames = 0,
  staggerInFrames = 5,
  direction = 'forward',
  easing = 'linear',
  currentFrame,
  children,
  style = {},
  testId = 'stagger-wrapper',
}) => {
  const ease = getEasingFunction(easing);

  // We need to count valid children to calculate total stagger and reverse indexing
  const validChildren = React.Children.toArray(children).filter(React.isValidElement);
  const totalChildren = validChildren.length;

  const maxStaggerDelay = totalChildren > 1 ? (totalChildren - 1) * staggerInFrames : 0;

  // We recursively clone children to inject the computed delayInFrames.
  // Each top-level child gets a specific stagger index.
  const processChild = (node: React.ReactNode, staggerOffset: number): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    let newProps: any = { ...node.props };

    // Inject delayInFrames only into custom components (functions/classes), not DOM elements (strings)
    if (typeof node.type === 'function' || typeof node.type === 'object') {
      const existingDelay = newProps.delayInFrames || 0;
      newProps.delayInFrames = delayInFrames + existingDelay + staggerOffset;
      // Also forward the currentFrame if not already provided (helpful for nested composition)
      if (newProps.currentFrame === undefined) {
        newProps.currentFrame = currentFrame;
      }
    }

    if (newProps.children) {
      newProps.children = React.Children.map(newProps.children, (child) => processChild(child, staggerOffset));
    }

    return React.cloneElement(node, newProps);
  };

  const staggeredChildren = validChildren.map((child, index) => {
    // Calculate progress for easing the stagger timing
    const progress = totalChildren > 1 ? index / (totalChildren - 1) : 0;
    
    // For reverse direction, the last child gets the 0 progress, the first gets 1 progress
    const actualProgress = direction === 'reverse' ? 1 - progress : progress;
    
    const easedProgress = ease(actualProgress);
    const staggerOffset = easedProgress * maxStaggerDelay;

    return processChild(child, Math.round(staggerOffset)); // round to ensure discrete frame numbers
  });

  return (
    <div data-testid={testId} style={style}>
      {staggeredChildren}
    </div>
  );
};
