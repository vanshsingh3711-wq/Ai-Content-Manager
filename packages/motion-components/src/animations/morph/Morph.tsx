import React, { useMemo } from 'react';
import { MorphProps } from './Morph.types';
import { interpolate, getEasingFunction } from '../utils/math';
import { interpolatePath } from '../utils/svg';

export const Morph: React.FC<MorphProps> = ({
  from,
  to,
  delayInFrames = 0,
  durationInFrames = 30,
  easing = 'linear',
  mode = 'path',
  currentFrame,
  children,
  testId = 'morph-wrapper',
}) => {
  const ease = getEasingFunction(easing);
  const endFrame = delayInFrames + durationInFrames;

  let progress = 0;

  if (currentFrame >= delayInFrames) {
    if (currentFrame >= endFrame || durationInFrames === 0) {
      progress = 1;
    } else {
      const rawProgress = interpolate(currentFrame, [delayInFrames, endFrame], [0, 1], 'clamp');
      progress = ease(rawProgress);
    }
  }

  // Use useMemo to avoid re-calculating the exact same path unnecessarily
  const morphedPath = useMemo(() => {
    return interpolatePath(from, to, progress);
  }, [from, to, progress]);

  // Recursively clone the child tree, injecting the `d` attribute into any <path> element
  const processChild = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    let newProps: any = { ...(node.props as any) };

    if (node.type === 'path') {
      newProps.d = morphedPath;
      if (testId) {
        newProps['data-testid'] = testId; // attach testId to the path for testing
      }
    }

    if (newProps.children) {
      newProps.children = React.Children.map(newProps.children, processChild);
    }

    return React.cloneElement(node, newProps);
  };

  return <>{React.Children.map(children, processChild)}</>;
};
