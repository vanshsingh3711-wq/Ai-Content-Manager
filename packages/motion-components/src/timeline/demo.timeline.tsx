import React, { useState, useMemo } from 'react';
import { Timeline } from './components/Timeline';
import { TimelineMapper } from './timeline.mapper';
import { TimelineOperations } from './timeline.operations';
import { SequenceDefinition } from '../sequence/sequence.types';
import { SceneDefinition } from '../scene/scene.types';

// Mock data
const mockScene1: SceneDefinition = {
  id: 'scene_1',
  durationInFrames: 150,
  elements: [
    { id: 'pres_1', type: 'presenter', timing: { startFrame: 0, durationInFrames: 150 } },
    { id: 'txt_1', type: 'text', timing: { startFrame: 30, durationInFrames: 60 } }
  ]
};

const mockScene2: SceneDefinition = {
  id: 'scene_2',
  durationInFrames: 120,
  elements: [
    { id: 'chart_1', type: 'asset', timing: { startFrame: 0, durationInFrames: 120 } }
  ],
  audio: [
    { id: 'audio_1', type: 'music', src: 'music.mp3', startFrame: 0, durationInFrames: 120, volume: 1 }
  ]
};

const initialSequence: SequenceDefinition = {
  id: 'seq_demo',
  scenes: [mockScene1, mockScene2]
};

export const TimelineDemo: React.FC = () => {
  const [sequence, setSequence] = useState<SequenceDefinition>(initialSequence);
  const [currentFrame, setCurrentFrame] = useState(0);

  const mapper = useMemo(() => new TimelineMapper(), []);
  const operations = useMemo(() => new TimelineOperations(), []);

  // Compute timeline state from authoritative sequence
  const timeline = useMemo(() => mapper.mapSequenceToTimeline(sequence, 30), [sequence, mapper]);

  const handleItemMove = (itemId: string, newStartFrame: number) => {
    // 1. Snap (optional in this basic demo, but utilizing it to show architecture)
    const snappedFrame = operations.findSnapFrame(newStartFrame, 5, timeline, itemId);
    
    // 2. Perform operation on TimelineState
    const updatedTimeline = operations.moveItem(timeline, itemId, snappedFrame);
    
    // 3. Map back to authoritative Sequence
    const updatedSequence = mapper.mapTimelineToSequence(updatedTimeline, sequence);
    
    // 4. Update project state
    setSequence(updatedSequence);
  };

  return (
    <div style={{ padding: '20px', background: '#000', height: '100vh', color: '#fff' }}>
      <h2>Manual Timeline System Demo</h2>
      <p>Current Frame: {currentFrame}</p>
      
      {/* Fake playback control */}
      <input 
        type="range" 
        min={0} 
        max={timeline.durationInFrames} 
        value={currentFrame} 
        onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
        style={{ width: '100%', marginBottom: '20px' }}
      />

      <Timeline 
        timeline={timeline}
        currentFrame={currentFrame}
        onCurrentFrameChange={setCurrentFrame}
        onItemMove={handleItemMove}
      />
    </div>
  );
};
