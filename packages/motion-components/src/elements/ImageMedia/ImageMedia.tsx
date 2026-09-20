import React from 'react';
import { ResolvedSceneElement } from '../../scene/scene.types';

export interface ImageMediaProps {
  element: ResolvedSceneElement;
}

export const ImageMedia: React.FC<ImageMediaProps> = ({ element }) => {
  if (element.type !== 'image' || !element.imageConfig) return null;

  const { src, fit, position, opacity, alt } = element.imageConfig;
  const { width, height } = element.geometry;

  // Convert logical focal point (0-1) to CSS object-position percentage
  const objectPosition = `${position.x * 100}% ${position.y * 100}%`;

  // Determine CSS object-fit
  let objectFit: React.CSSProperties['objectFit'] = 'contain';
  if (fit === 'cover') objectFit = 'cover';
  if (fit === 'fill') objectFit = 'fill';
  if (fit === 'none') objectFit = 'none';

  return (
    <div
      style={{
        width,
        height,
        opacity,
        overflow: 'hidden', // Ensures "none" fit doesn't break out of the geometry bounds
      }}
    >
      <img
        src={src}
        alt={alt || ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          objectPosition,
          display: 'block',
        }}
      />
    </div>
  );
};
