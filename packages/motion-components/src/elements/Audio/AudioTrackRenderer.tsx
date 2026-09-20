import React from 'react';
import { ResolvedAudioTrack } from '../../media/audio/audio.types';
import { getAudioVolumeAtFrame } from '../../media/audio/audio.volume';

export interface AudioTrackRendererProps {
  track: ResolvedAudioTrack;
  localFrame: number;
}

export const AudioTrackRenderer: React.FC<AudioTrackRendererProps> = ({ track, localFrame }) => {
  // If track hasn't started or has finished, don't render anything
  if (localFrame < track.startFrame || localFrame >= track.startFrame + track.durationInFrames) {
    return null;
  }

  // Calculate local track frame relative to its own start
  const trackFrame = localFrame - track.startFrame;

  // Calculate current volume exactly at this frame
  const currentVolume = getAudioVolumeAtFrame({
    localFrame: trackFrame,
    durationInFrames: track.durationInFrames,
    baseVolume: track.volume,
    muted: track.muted,
    fadeInFrames: track.fadeInFrames,
    fadeOutFrames: track.fadeOutFrames,
  });

  return (
    <div
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        color: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${currentVolume > 0 ? '#3b82f6' : '#64748b'}`,
        fontFamily: 'monospace',
        fontSize: '14px',
        minWidth: '280px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'all 0.1s ease-in-out',
        opacity: track.muted ? 0.5 : 1,
        // The mock badge scales slightly based on volume for visual feedback
        transform: `scale(${0.98 + (currentVolume * 0.04)})`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{track.type.toUpperCase()}</span>
        <span style={{ color: '#94a3b8' }}>{track.id}</span>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', 
          backgroundColor: '#3b82f6', 
          width: `${(trackFrame / track.durationInFrames) * 100}%`,
          transition: 'width 0.1s linear'
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#cbd5e1', fontSize: '12px' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Frame</div>
          {trackFrame} / {track.durationInFrames}
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Current Vol</div>
          <span style={{ color: currentVolume > 0 ? '#4ade80' : '#f87171' }}>
            {currentVolume.toFixed(2)}
          </span>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Base Vol</div>
          {track.volume} {track.muted && '(MUTED)'}
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Rate</div>
          {track.playbackRate}x
        </div>
      </div>
    </div>
  );
};
