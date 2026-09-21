import { SequenceDefinition } from '../sequence/sequence.types';
import { TimelineState, TimelineTrack, TimelineItem } from './timeline.types';

export class TimelineMapper {
  
  public mapSequenceToTimeline(sequence: SequenceDefinition, fps: number = 30): TimelineState {
    const sceneTrack: TimelineTrack = { id: 'track_scenes', type: 'scene', label: 'Scenes', items: [] };
    const visualTrack: TimelineTrack = { id: 'track_visuals', type: 'visual', label: 'Visuals', items: [] };
    const presenterTrack: TimelineTrack = { id: 'track_presenter', type: 'presenter', label: 'Presenter', items: [] };
    const audioTrack: TimelineTrack = { id: 'track_audio', type: 'audio', label: 'Audio', items: [] };
    const captionTrack: TimelineTrack = { id: 'track_captions', type: 'caption', label: 'Captions', items: [] };
    
    let globalFrameOffset = 0;
    
    for (const scene of sequence.scenes) {
      const sceneDuration = scene.durationInFrames || 150; // Fallback based on typical config
      
      sceneTrack.items.push({
        id: `tl_${scene.id}`,
        type: 'scene',
        sourceId: scene.id,
        sceneId: scene.id,
        startFrame: globalFrameOffset,
        durationInFrames: sceneDuration,
        trackId: sceneTrack.id,
        label: `Scene: ${scene.id}`
      });

      // Map Scene Elements
      for (const el of scene.elements) {
        const type = el.type || 'asset';
        const startFrame = globalFrameOffset + (el.timing?.startFrame || 0);
        const duration = el.timing?.durationInFrames || sceneDuration;
        
        if (type === 'presenter') {
          presenterTrack.items.push({
            id: `tl_${el.id}`,
            type: 'presenter',
            sourceId: el.id,
            sceneId: scene.id,
            startFrame,
            durationInFrames: duration,
            trackId: presenterTrack.id,
            label: 'Presenter'
          });
          
          // Also map presenter timeline items as sub-items (simplified for now as same track)
          if (el.presenterTimeline) {
            for (const p of el.presenterTimeline) {
              presenterTrack.items.push({
                id: `tl_p_${p.action}_${p.startFrame}`,
                type: 'presenter',
                sourceId: `${el.id}_${p.action}`,
                sceneId: scene.id,
                startFrame: startFrame + p.startFrame,
                durationInFrames: p.durationInFrames,
                trackId: presenterTrack.id,
                label: p.action
              });
            }
          }
        } else if (type === 'caption') {
          captionTrack.items.push({
            id: `tl_${el.id}`,
            type: 'caption',
            sourceId: el.id,
            sceneId: scene.id,
            startFrame,
            durationInFrames: duration,
            trackId: captionTrack.id,
            label: 'Caption'
          });
        } else {
          // generic visual
          visualTrack.items.push({
            id: `tl_${el.id}`,
            type: 'visual',
            sourceId: el.id,
            sceneId: scene.id,
            startFrame,
            durationInFrames: duration,
            trackId: visualTrack.id,
            label: el.id
          });
        }
      }

      // Map Scene Audio
      if (scene.audio) {
        for (let i = 0; i < scene.audio.length; i++) {
          const a = scene.audio[i];
          const startFrame = globalFrameOffset + (a.startFrame || 0);
          const duration = a.durationInFrames || sceneDuration;
          audioTrack.items.push({
            id: `tl_a_${scene.id}_${i}`,
            type: 'audio',
            sourceId: a.src,
            sceneId: scene.id,
            startFrame,
            durationInFrames: duration,
            trackId: audioTrack.id,
            label: 'Audio'
          });
        }
      }
      
      globalFrameOffset += sceneDuration;
    }

    return {
      tracks: [sceneTrack, visualTrack, presenterTrack, audioTrack, captionTrack],
      durationInFrames: globalFrameOffset,
      fps
    };
  }

  public mapTimelineToSequence(timeline: TimelineState, sequence: SequenceDefinition): SequenceDefinition {
    // Clone sequence to avoid mutating original reference deeply
    const updatedSequence: SequenceDefinition = JSON.parse(JSON.stringify(sequence));
    
    // We need to resolve global times back to local times.
    // 1. Calculate new global scene offsets from the scene track
    const sceneTrack = timeline.tracks.find(t => t.type === 'scene');
    if (!sceneTrack) return updatedSequence;
    
    // Sort scenes by start frame just in case they were moved
    const scenes = [...sceneTrack.items].sort((a, b) => a.startFrame - b.startFrame);
    
    // Keep a map of scene global start times
    const sceneGlobalStarts: Record<string, number> = {};
    for (const s of scenes) {
      sceneGlobalStarts[s.sourceId] = s.startFrame;
      // Update scene duration
      const targetScene = updatedSequence.scenes.find(seqScene => seqScene.id === s.sourceId);
      if (targetScene) {
        targetScene.durationInFrames = s.durationInFrames;
      }
    }
    
    // 2. Update elements based on their new global timing
    for (const track of timeline.tracks) {
      if (track.type === 'scene') continue;
      
      for (const item of track.items) {
        if (!item.sceneId) continue;
        
        const targetScene = updatedSequence.scenes.find(s => s.id === item.sceneId);
        if (!targetScene) continue;
        
        const sceneGlobalStart = sceneGlobalStarts[item.sceneId] || 0;
        const localStartFrame = item.startFrame - sceneGlobalStart;
        
        if (track.type === 'audio') {
          // Update Audio
          if (targetScene.audio) {
             const audioItem = targetScene.audio.find(a => a.src === item.sourceId);
             if (audioItem) {
               audioItem.startFrame = localStartFrame;
               audioItem.durationInFrames = item.durationInFrames;
             }
          }
        } else if (track.type === 'presenter' && item.id.includes('_p_')) {
          // It's a presenter sub-item (e.g. tl_p_action_10)
          // Simplified: we will skip updating presenter timelines deeply for this foundational version 
          // to avoid complex string parsing, assuming we only move the main presenter element.
        } else {
          // It's a regular element (visual, caption, presenter main)
          const targetEl = targetScene.elements.find(e => e.id === item.sourceId);
          if (targetEl) {
            targetEl.timing = targetEl.timing || {};
            targetEl.timing.startFrame = localStartFrame;
            targetEl.timing.durationInFrames = item.durationInFrames;
          }
        }
      }
    }
    
    return updatedSequence;
  }
}
