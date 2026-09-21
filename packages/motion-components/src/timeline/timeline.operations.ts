import { TimelineState, TimelineItem } from './timeline.types';

export class TimelineOperations {
  
  public moveItem(timeline: TimelineState, itemId: string, newStartFrame: number): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    const item = this.findItem(nextTimeline, itemId);
    if (item) {
      // Ensure positive start frame
      item.startFrame = Math.max(0, newStartFrame);
    }
    return nextTimeline;
  }

  public trimItemStart(timeline: TimelineState, itemId: string, newStartFrame: number): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    const item = this.findItem(nextTimeline, itemId);
    if (item) {
      const endFrame = item.startFrame + item.durationInFrames;
      const validStart = Math.max(0, Math.min(newStartFrame, endFrame - 1)); // Min 1 frame duration
      item.durationInFrames = endFrame - validStart;
      item.startFrame = validStart;
    }
    return nextTimeline;
  }

  public trimItemEnd(timeline: TimelineState, itemId: string, newEndFrame: number): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    const item = this.findItem(nextTimeline, itemId);
    if (item) {
      const validEnd = Math.max(newEndFrame, item.startFrame + 1); // Min 1 frame duration
      item.durationInFrames = validEnd - item.startFrame;
    }
    return nextTimeline;
  }

  public splitItem(timeline: TimelineState, itemId: string, splitFrame: number): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    const track = nextTimeline.tracks.find(t => t.items.some(i => i.id === itemId));
    if (!track) return nextTimeline;

    const itemIndex = track.items.findIndex(i => i.id === itemId);
    const item = track.items[itemIndex];
    
    if (item && splitFrame > item.startFrame && splitFrame < item.startFrame + item.durationInFrames) {
      const originalDuration = item.durationInFrames;
      
      // Update first half
      item.durationInFrames = splitFrame - item.startFrame;
      
      // Create second half
      const newItem: TimelineItem = {
        ...item,
        id: `${item.id}_split`,
        startFrame: splitFrame,
        durationInFrames: originalDuration - item.durationInFrames
      };
      
      track.items.splice(itemIndex + 1, 0, newItem);
    }
    return nextTimeline;
  }

  public deleteItem(timeline: TimelineState, itemId: string): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    for (const track of nextTimeline.tracks) {
      track.items = track.items.filter(i => i.id !== itemId);
    }
    return nextTimeline;
  }
  
  public duplicateItem(timeline: TimelineState, itemId: string): TimelineState {
    const nextTimeline: TimelineState = JSON.parse(JSON.stringify(timeline));
    const track = nextTimeline.tracks.find(t => t.items.some(i => i.id === itemId));
    if (!track) return nextTimeline;

    const item = track.items.find(i => i.id === itemId);
    if (item) {
      track.items.push({
        ...item,
        id: `${item.id}_copy_${Date.now()}`,
        startFrame: item.startFrame + item.durationInFrames // place immediately after
      });
    }
    return nextTimeline;
  }

  public findSnapFrame(targetFrame: number, threshold: number, timeline: TimelineState, excludeItemId?: string): number {
    const snapCandidates: number[] = [0]; // Always snap to 0

    // Collect all boundaries
    for (const track of timeline.tracks) {
      for (const item of track.items) {
        if (item.id === excludeItemId) continue;
        snapCandidates.push(item.startFrame);
        snapCandidates.push(item.startFrame + item.durationInFrames);
      }
    }
    
    // In a real editor, you'd also include the playhead frame here

    let closest = targetFrame;
    let minDistance = threshold;

    for (const candidate of snapCandidates) {
      const dist = Math.abs(candidate - targetFrame);
      if (dist <= minDistance) {
        closest = candidate;
        minDistance = dist;
      }
    }

    return closest;
  }

  private findItem(timeline: TimelineState, itemId: string): TimelineItem | undefined {
    for (const track of timeline.tracks) {
      const item = track.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return undefined;
  }
}
