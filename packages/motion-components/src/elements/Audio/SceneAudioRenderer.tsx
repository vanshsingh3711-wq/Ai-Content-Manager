import React from 'react';
import { ResolvedAudioTrack } from '../../media/audio/audio.types';
import { AudioTrackRenderer } from './AudioTrackRenderer';

export interface SceneAudioRendererProps {
  tracks: ResolvedAudioTrack[];
  localFrame: number;
}

export const SceneAudioRenderer: React.FC<SceneAudioRendererProps> = ({ tracks, localFrame }) => {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999, // Render on top of visual scene for debug purposes
        pointerEvents: 'none' // Don't block interactions
      }}
    >
      {tracks.map((track) => (
        <AudioTrackRenderer 
          key={track.id} 
          track={track} 
          localFrame={localFrame} 
        />
      ))}
    </div>
  );
};
