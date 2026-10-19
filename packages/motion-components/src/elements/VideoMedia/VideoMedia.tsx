import React from 'react';
import { ResolvedSceneElement } from '../../scene/scene.types';
import { getSourceFrame } from '../../media/video/video.frame';

export interface VideoMediaProps {
  element: ResolvedSceneElement;
  localFrame: number;
}

export const VideoMedia: React.FC<VideoMediaProps> = ({ element, localFrame }) => {
  if (element.type !== 'video' || !element.videoConfig) return null;

  const {
    src,
    fit,
    position,
    opacity,
    sourceStartFrame,
    sourceEndFrame,
    playbackRate,
    loop,
    muted,
    volume,
    metadata
  } = element.videoConfig;
  
  const { width, height } = element.geometry;
  
  // Calculate exact source frame deterministically
  const sourceFrame = getSourceFrame({
    localFrame,
    sourceStartFrame,
    sourceEndFrame,
    playbackRate,
    loop,
    durationInFrames: metadata?.durationInFrames as number | undefined
  });

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
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 
        MOCK IMPLEMENTATION:
        Because remotion is not installed, and runtime 'video.currentTime' mutation is forbidden,
        we render an image of the video with the exact frame overlaid on top, proving deterministic math works.
        In a real Remotion environment, this would be: <OffthreadVideo src={src} startFrom={sourceStartFrame} />
      */}
      <img
        src={src}
        alt="Video Poster"
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          objectPosition,
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          filter: 'brightness(0.6)'
        }}
      />
      
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          color: '#fff',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '18px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <div><strong>VIDEO MEDIA</strong></div>
        <div style={{ marginTop: '4px', fontSize: '14px', color: '#a3e635' }}>
          LOCAL: {localFrame} → SRC: {sourceFrame}
        </div>
        <div style={{ marginTop: '2px', fontSize: '12px', color: '#9ca3af' }}>
          Rate: {playbackRate}x | Loop: {loop ? 'Yes' : 'No'}
        </div>
        <div style={{ marginTop: '2px', fontSize: '12px', color: '#9ca3af' }}>
          Vol: {muted ? 0 : volume}
        </div>
      </div>
    </div>
  );
};
