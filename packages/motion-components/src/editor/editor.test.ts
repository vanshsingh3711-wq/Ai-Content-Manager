import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editor.store';
import { SceneDefinition } from '../scene/scene.types';

describe('Editor State & Undo/Redo System', () => {
  const initialProject: SceneDefinition = {
    id: 'test-scene',
    durationInFrames: 100,
    elements: [
      {
        id: 'el-1',
        type: 'text',
        textContent: 'Hello World',
        placement: {
          position: { x: 100, y: 100 },
          positionMode: 'absolute'
        }
      }
    ]
  };

  beforeEach(() => {
    // Reset store before each test
    useEditorStore.setState({
      project: null,
      past: [],
      future: [],
      elementIds: [],
      sceneId: undefined,
      keyframeId: undefined,
      playheadFrame: 0,
      timelineZoom: 1,
      timelineScrollX: 0,
      timelineScrollY: 0,
      keyframeMode: false,
    });
  });

  it('initializes the project properly', () => {
    const store = useEditorStore.getState();
    store.initProject(initialProject);

    const state = useEditorStore.getState();
    expect(state.project?.id).toBe('test-scene');
    expect(state.sceneId).toBe('test-scene');
    expect(state.past.length).toBe(0);
    expect(state.future.length).toBe(0);
  });

  it('selects elements without affecting history', () => {
    useEditorStore.getState().initProject(initialProject);
    useEditorStore.getState().selectElement('el-1');

    const state = useEditorStore.getState();
    expect(state.elementIds).toContain('el-1');
    expect(state.past.length).toBe(0);
  });

  it('playhead does not affect history', () => {
    useEditorStore.getState().initProject(initialProject);
    useEditorStore.getState().setPlayheadFrame(50);

    const state = useEditorStore.getState();
    expect(state.playheadFrame).toBe(50);
    expect(state.past.length).toBe(0);
  });

  it('undoes and redoes project modifications properly', () => {
    useEditorStore.getState().initProject(initialProject);
    
    // Move element (adds to history)
    useEditorStore.getState().moveElement('el-1', 50, 0);

    let state = useEditorStore.getState();
    expect(state.project?.elements[0].placement?.position?.x).toBe(150);
    expect(state.past.length).toBe(1);

    // Undo
    useEditorStore.getState().undo();
    state = useEditorStore.getState();
    expect(state.project?.elements[0].placement?.position?.x).toBe(100);
    expect(state.past.length).toBe(0);
    expect(state.future.length).toBe(1);

    // Redo
    useEditorStore.getState().redo();
    state = useEditorStore.getState();
    expect(state.project?.elements[0].placement?.position?.x).toBe(150);
    expect(state.past.length).toBe(1);
    expect(state.future.length).toBe(0);
  });

  it('clears future history on new edits after undo', () => {
    useEditorStore.getState().initProject(initialProject);
    
    // Edit 1
    useEditorStore.getState().moveElement('el-1', 50, 0); // x=150
    // Edit 2
    useEditorStore.getState().moveElement('el-1', 50, 0); // x=200
    
    expect(useEditorStore.getState().past.length).toBe(2);

    // Undo back to Edit 1
    useEditorStore.getState().undo(); 
    expect(useEditorStore.getState().project?.elements[0].placement?.position?.x).toBe(150);
    expect(useEditorStore.getState().future.length).toBe(1);

    // New Edit 3
    useEditorStore.getState().moveElement('el-1', 0, 50); // x=150, y=150
    
    const state = useEditorStore.getState();
    expect(state.past.length).toBe(2);
    expect(state.future.length).toBe(0); // Future should be cleared!
    expect(state.project?.elements[0].placement?.position?.y).toBe(150);
  });

  it('coalesces history correctly with commitHistory', () => {
    useEditorStore.getState().initProject(initialProject);

    // Drag operation - saveHistory = false
    useEditorStore.getState().moveElement('el-1', 10, 0, false);
    useEditorStore.getState().moveElement('el-1', 10, 0, false);
    useEditorStore.getState().moveElement('el-1', 10, 0, false);
    
    let state = useEditorStore.getState();
    expect(state.project?.elements[0].placement?.position?.x).toBe(130);
    expect(state.past.length).toBe(0); // No history yet

    // Mouse up -> commit
    useEditorStore.getState().commitHistory();
    state = useEditorStore.getState();
    expect(state.past.length).toBe(1); // One coalesced history entry!
  });
});
