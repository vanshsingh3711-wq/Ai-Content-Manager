import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';
import { TimelineProject } from '@/lib/timeline-types';

describe('useTimelineStore Smoke Test', () => {
  beforeEach(() => {
    const defaultProject: TimelineProject = {
      id: 'test-smoke-project',
      title: 'Smoke Test Project',
      aspectRatio: '9:16',
      duration: 30,
      fps: 30,
      tracks: {
        videoTrack: [],
        brollTrack: [],
        textTrack: [],
        audioTrack: [],
      },
    };
    useTimelineStore.getState().initProject(defaultProject);
  });

  it('initializes store with the specified project state', () => {
    const state = useTimelineStore.getState();
    expect(state.project.id).toBe('test-smoke-project');
    expect(state.project.aspectRatio).toBe('9:16');
    expect(state.project.duration).toBe(30);
    expect(state.playheadTime).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it('updates playheadTime within valid bounds', () => {
    useTimelineStore.getState().setPlayheadTime(12.5);
    expect(useTimelineStore.getState().playheadTime).toBe(12.5);

    // Should clamp to duration
    useTimelineStore.getState().setPlayheadTime(999);
    expect(useTimelineStore.getState().playheadTime).toBe(30);

    // Should clamp to 0
    useTimelineStore.getState().setPlayheadTime(-10);
    expect(useTimelineStore.getState().playheadTime).toBe(0);
  });

  it('updates zoomLevel within allowed min and max range', () => {
    useTimelineStore.getState().setZoomLevel(80);
    expect(useTimelineStore.getState().zoomLevel).toBe(80);

    useTimelineStore.getState().setZoomLevel(5); // Below min (10)
    expect(useTimelineStore.getState().zoomLevel).toBe(10);

    useTimelineStore.getState().setZoomLevel(500); // Above max (200)
    expect(useTimelineStore.getState().zoomLevel).toBe(200);
  });

  it('switches aspect ratio and records history snapshot for undo', () => {
    expect(useTimelineStore.getState().project.aspectRatio).toBe('9:16');
    useTimelineStore.getState().setAspectRatio('16:9');
    expect(useTimelineStore.getState().project.aspectRatio).toBe('16:9');
    expect(useTimelineStore.getState().past.length).toBe(1);

    // Test undo
    useTimelineStore.getState().undo();
    expect(useTimelineStore.getState().project.aspectRatio).toBe('9:16');
  });
});
