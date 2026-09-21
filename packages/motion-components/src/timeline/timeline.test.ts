import { describe, it, expect } from 'vitest';
import { TimelineMapper } from './timeline.mapper';
import { TimelineOperations } from './timeline.operations';
import { SequenceDefinition } from '../sequence/sequence.types';
import { SceneDefinition } from '../scene/scene.types';

describe('Manual Timeline System', () => {
  const mockSequence: SequenceDefinition = {
    id: 'test_seq',
    scenes: [
      {
        id: 'scene_1',
        durationInFrames: 100,
        elements: [
          { id: 'el_1', type: 'asset', timing: { startFrame: 10, durationInFrames: 50 } }
        ],
        audio: [
          { id: 'audio_test_1', type: 'music', src: 'music.mp3', startFrame: 0, durationInFrames: 100, volume: 1 }
        ]
      },
      {
        id: 'scene_2',
        durationInFrames: 150,
        elements: [
          { id: 'el_2', type: 'asset', timing: { startFrame: 0, durationInFrames: 150 } }
        ]
      }
    ]
  };

  const mapper = new TimelineMapper();
  const operations = new TimelineOperations();

  it('maps sequence to timeline correctly', () => {
    const timeline = mapper.mapSequenceToTimeline(mockSequence);
    
    expect(timeline.durationInFrames).toBe(250);
    expect(timeline.tracks.length).toBe(5); // scene, visual, presenter, audio, caption
    
    const sceneTrack = timeline.tracks.find(t => t.type === 'scene');
    expect(sceneTrack?.items.length).toBe(2);
    expect(sceneTrack?.items[1].startFrame).toBe(100);

    const visualTrack = timeline.tracks.find(t => t.type === 'visual');
    expect(visualTrack?.items.length).toBe(2); // el_1 and el_2
    
    // el_2 should have start frame = 100 (global offset)
    const el2Item = visualTrack?.items.find(i => i.sourceId === 'el_2');
    expect(el2Item?.startFrame).toBe(100);
  });

  it('operations.moveItem preserves duration and updates startFrame', () => {
    const timeline = mapper.mapSequenceToTimeline(mockSequence);
    const itemId = 'tl_el_1';
    
    const updated = operations.moveItem(timeline, itemId, 30);
    const movedItem = updated.tracks.find(t => t.type === 'visual')?.items.find(i => i.id === itemId);
    
    expect(movedItem?.startFrame).toBe(30);
    expect(movedItem?.durationInFrames).toBe(50); // Original duration
  });

  it('operations.trimItemStart adjusts startFrame and duration', () => {
    const timeline = mapper.mapSequenceToTimeline(mockSequence);
    const itemId = 'tl_el_1'; // originally start 10, duration 50
    
    const updated = operations.trimItemStart(timeline, itemId, 20);
    const trimmedItem = updated.tracks.find(t => t.type === 'visual')?.items.find(i => i.id === itemId);
    
    expect(trimmedItem?.startFrame).toBe(20);
    expect(trimmedItem?.durationInFrames).toBe(40);
  });

  it('snapping targets nearby boundaries', () => {
    const timeline = mapper.mapSequenceToTimeline(mockSequence);
    
    // target frame 98, should snap to 100 (scene boundary) with threshold 5
    const snap = operations.findSnapFrame(98, 5, timeline);
    expect(snap).toBe(100);
    
    // target frame 90, shouldn't snap with threshold 5
    const noSnap = operations.findSnapFrame(90, 5, timeline);
    expect(noSnap).toBe(90);
  });

  it('maps timeline edits back to sequence definition (authoritative update)', () => {
    const timeline = mapper.mapSequenceToTimeline(mockSequence);
    const itemId = 'tl_el_2'; // Belongs to scene_2 (starts at global 100)
    
    // Move it in global space from 100 to 120
    const updatedTimeline = operations.moveItem(timeline, itemId, 120);
    
    // Map back
    const updatedSequence = mapper.mapTimelineToSequence(updatedTimeline, mockSequence);
    
    // el_2 local startFrame should be 20 (120 global - 100 scene offset)
    const el2 = updatedSequence.scenes[1].elements[0];
    expect(el2.timing?.startFrame).toBe(20);
  });
});
