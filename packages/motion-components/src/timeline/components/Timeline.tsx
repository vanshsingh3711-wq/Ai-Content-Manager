import React, { useState } from 'react';
import { TimelineState, TimelineTrack, TimelineItem } from '../timeline.types';

export interface TimelineProps {
  timeline: TimelineState;
  currentFrame: number;
  onCurrentFrameChange?: (frame: number) => void;
  onItemMove?: (itemId: string, newStartFrame: number) => void;
  onItemTrimStart?: (itemId: string, newStartFrame: number) => void;
  onItemTrimEnd?: (itemId: string, newEndFrame: number) => void;
  pixelsPerFrame?: number;
  snapThreshold?: number;
  keyframeMode?: boolean;
  onKeyframeModeToggle?: (active: boolean) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  currentFrame,
  onCurrentFrameChange,
  onItemMove,
  onItemTrimStart,
  onItemTrimEnd,
  pixelsPerFrame = 2,
  snapThreshold = 5,
  keyframeMode = false,
  onKeyframeModeToggle
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: '#fff',
      fontFamily: 'sans-serif',
      width: '100%',
      height: '300px',
      overflow: 'hidden',
      borderTop: '1px solid #333'
    }}>
      {/* Toolbar / Header */}
      <div style={{ height: '30px', background: '#252525', display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #333', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Timeline</span>
        
        {/* Keyframe Toggle */}
        {onKeyframeModeToggle && (
          <button
            onClick={() => onKeyframeModeToggle(!keyframeMode)}
            style={{
              background: keyframeMode ? '#ff3b30' : 'transparent',
              color: keyframeMode ? '#fff' : '#aaa',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={keyframeMode ? 'Keyframe Mode is ON' : 'Turn ON Keyframe Mode'}
          >
            <span>{keyframeMode ? '◆' : '◇'}</span> Keyframes
          </button>
        )}
      </div>

      {/* Tracks Container */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        
        {/* Track Headers */}
        <div style={{ width: '120px', flexShrink: 0, background: '#2a2a2a', borderRight: '1px solid #333', zIndex: 10 }}>
          {timeline.tracks.map(track => (
            <div key={track.id} style={{ height: '40px', display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #333', fontSize: '12px' }}>
              {track.label}
            </div>
          ))}
        </div>

        {/* Track Content */}
        <div style={{ flex: 1, position: 'relative', overflowX: 'auto' }}>
          <div style={{ width: `${timeline.durationInFrames * pixelsPerFrame}px`, position: 'relative', minHeight: '100%' }}>
            
            {/* Playhead */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${currentFrame * pixelsPerFrame}px`,
              width: '1px',
              background: '#ff3b30',
              zIndex: 20,
              pointerEvents: 'none'
            }}>
              <div style={{ position: 'absolute', top: 0, left: '-4px', width: '9px', height: '9px', background: '#ff3b30', borderRadius: '50%' }} />
            </div>

            {/* Tracks */}
            {timeline.tracks.map((track, trackIndex) => (
              <div key={track.id} style={{ height: '40px', borderBottom: '1px solid #333', position: 'relative' }}>
                {track.items.map(item => (
                  <TimelineItemView 
                    key={item.id} 
                    item={item} 
                    pixelsPerFrame={pixelsPerFrame} 
                    onMove={(f) => onItemMove?.(item.id, f)}
                  />
                ))}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Item View for foundational architecture
const TimelineItemView: React.FC<{
  item: TimelineItem;
  pixelsPerFrame: number;
  onMove?: (newStart: number) => void;
}> = ({ item, pixelsPerFrame, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const left = item.startFrame * pixelsPerFrame;
  const width = item.durationInFrames * pixelsPerFrame;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragOffset(e.clientX - left);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && onMove) {
      const newLeft = e.clientX - dragOffset;
      const newFrame = Math.max(0, Math.round(newLeft / pixelsPerFrame));
      onMove(newFrame);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  // Color mapping
  const colors = {
    scene: '#4a90e2',
    visual: '#50e3c2',
    presenter: '#f5a623',
    audio: '#b8e986',
    caption: '#bd10e0',
    effect: '#9b9b9b'
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        top: '4px',
        left: `${left}px`,
        width: `${width}px`,
        height: '32px',
        background: colors[item.type] || '#ccc',
        borderRadius: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        boxSizing: 'border-box',
        fontSize: '11px',
        color: '#000',
        fontWeight: 'bold',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        opacity: isDragging ? 0.8 : 1,
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {item.label}
      
      {/* Keyframe Markers */}
      {item.keyframes && item.keyframes.map(kf => {
        // Position relative to the item's start frame
        const relativeFrame = kf.frame - item.startFrame;
        if (relativeFrame < 0 || relativeFrame > item.durationInFrames) return null;
        
        const kfLeft = relativeFrame * pixelsPerFrame;
        return (
          <div
            key={kf.id}
            style={{
              position: 'absolute',
              left: `${kfLeft}px`,
              top: '50%',
              transform: 'translate(-50%, -50%) rotate(45deg)',
              width: '6px',
              height: '6px',
              background: '#fff',
              border: '1px solid #000',
              zIndex: 5
            }}
            title={`Keyframe at frame ${kf.frame}`}
          />
        );
      })}
    </div>
  );
};
