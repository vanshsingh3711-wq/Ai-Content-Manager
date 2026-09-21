import { create } from 'zustand';
import { EditorState, EditorHistorySnapshot } from './editor.types';
import { SceneDefinition, SceneElementDefinition } from '../scene/scene.types';
import { KeyframeTrack } from '../keyframes/keyframes.types';

const MAX_HISTORY_LENGTH = 50;

const createSnapshot = (project: SceneDefinition): EditorHistorySnapshot => {
  // Deep clone the project to ensure immutability in history
  return { project: JSON.parse(JSON.stringify(project)) };
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  project: null,
  past: [],
  future: [],

  // UI State
  elementIds: [],
  sceneId: undefined,
  keyframeId: undefined,
  playheadFrame: 0,
  timelineZoom: 1,
  timelineScrollX: 0,
  timelineScrollY: 0,
  keyframeMode: false,
  isDirty: false,

  initProject: (project: SceneDefinition) => {
    set({
      project: JSON.parse(JSON.stringify(project)),
      past: [],
      future: [],
      elementIds: [],
      sceneId: project.id,
      keyframeId: undefined,
      playheadFrame: 0,
      isDirty: false,
    });
  },

  loadProject: (project: SceneDefinition) => {
    set({
      project: JSON.parse(JSON.stringify(project)),
      past: [],
      future: [],
      elementIds: [],
      sceneId: project.id,
      keyframeId: undefined,
      playheadFrame: 0,
      isDirty: false,
    });
  },

  applyGeneratedProject: (project: SceneDefinition) => {
    set((state) => {
      const currentSnapshot = state.project ? createSnapshot(state.project) : null;
      const newPast = currentSnapshot ? [currentSnapshot, ...state.past].slice(0, MAX_HISTORY_LENGTH) : state.past;
      
      return {
        project: JSON.parse(JSON.stringify(project)),
        past: newPast,
        future: [],
        elementIds: [],
        sceneId: project.id,
        keyframeId: undefined,
        playheadFrame: 0,
        isDirty: true,
      };
    });
  },

  markClean: () => set({ isDirty: false }),

  selectScene: (sceneId: string) => set({ sceneId, elementIds: [], keyframeId: undefined }),
  selectElement: (elementId: string) => set({ elementIds: [elementId], keyframeId: undefined }),
  selectElements: (elementIds: string[]) => set({ elementIds, keyframeId: undefined }),
  selectKeyframe: (keyframeId: string) => set({ keyframeId, elementIds: [] }),
  clearSelection: () => set({ sceneId: undefined, elementIds: [], keyframeId: undefined }),

  setPlayheadFrame: (frame: number) => {
    const { project } = get();
    if (!project) return;
    const clampedFrame = Math.max(0, Math.min(frame, project.durationInFrames || 0));
    set({ playheadFrame: clampedFrame });
  },

  setTimelineZoom: (zoom: number) => set({ timelineZoom: zoom }),
  setTimelineScroll: (timelineScrollX: number, timelineScrollY: number) => set({ timelineScrollX, timelineScrollY }),
  setKeyframeMode: (keyframeMode: boolean) => set({ keyframeMode }),

  undo: () => {
    const { past, future, project } = get();
    if (past.length === 0 || !project) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot = createSnapshot(project);

    set({
      project: JSON.parse(JSON.stringify(previous.project)),
      past: newPast,
      future: [currentSnapshot, ...future],
      isDirty: true,
      // Do not clear selection automatically unless necessary, but safer to let UI handle selection sync.
    });
  },

  redo: () => {
    const { past, future, project } = get();
    if (future.length === 0 || !project) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = createSnapshot(project);

    set({
      project: JSON.parse(JSON.stringify(next.project)),
      past: [...past, currentSnapshot],
      future: newFuture,
      isDirty: true,
    });
  },

  commitHistory: () => {
    const { project, past } = get();
    if (!project) return;
    
    // We only commit if it's different from the last past snapshot
    const currentSnapshot = createSnapshot(project);
    if (past.length > 0) {
      const lastSnapshot = past[past.length - 1];
      if (JSON.stringify(lastSnapshot.project) === JSON.stringify(currentSnapshot.project)) {
        return; // No changes
      }
    }

    set({
      past: [...past.slice(-MAX_HISTORY_LENGTH + 1), currentSnapshot],
      future: [], // Discard future when a new edit happens
    });
  },

  updateElementProperties: (elementId: string, updates: Partial<SceneElementDefinition>, saveHistory = true) => {
    const { project, past } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    const newElements = project.elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );

    const newState: Partial<EditorState> = {
      project: { ...project, elements: newElements }, isDirty: true
    };

    if (saveHistory) {
      newState.past = [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot];
      newState.future = [];
    }

    set(newState);
  },

  moveElement: (elementId: string, dx: number, dy: number, saveHistory = true) => {
    const { project, past } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    const newElements = project.elements.map(el => {
      if (el.id === elementId) {
        const currentPlacement = el.placement || { position: { x: 0, y: 0 }, positionMode: 'absolute' };
        const currentPos = currentPlacement.position || { x: 0, y: 0 };
        return {
          ...el,
          placement: {
            ...currentPlacement,
            position: {
              ...currentPos,
              x: (currentPos.x || 0) + dx,
              y: (currentPos.y || 0) + dy
            }
          }
        };
      }
      return el;
    });

    const newState: Partial<EditorState> = {
      project: { ...project, elements: newElements }, isDirty: true
    };

    if (saveHistory) {
      newState.past = [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot];
      newState.future = [];
    }

    set(newState);
  },

  resizeElement: (elementId: string, width: number, height: number, saveHistory = true) => {
    const { project, past } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    const newElements = project.elements.map(el => {
      if (el.id === elementId) {
        const currentPlacement = el.placement || { positionMode: 'absolute' };
        return {
          ...el,
          placement: {
            ...currentPlacement,
            width,
            height
          }
        };
      }
      return el;
    });

    const newState: Partial<EditorState> = {
      project: { ...project, elements: newElements }, isDirty: true
    };

    if (saveHistory) {
      newState.past = [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot];
      newState.future = [];
    }

    set(newState);
  },

  deleteElement: (elementId: string) => {
    const { project, past, elementIds } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    const newElements = project.elements.filter(el => el.id !== elementId);
    
    // Also remove from relationships if any
    const newRelationships = project.relationships?.filter(
      r => r.sourceId !== elementId && r.targetId !== elementId
    );

    set({
      project: { ...project, elements: newElements, relationships: newRelationships },
      past: [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot],
      future: [],
      elementIds: elementIds.filter(id => id !== elementId),
      isDirty: true
    });
  },

  duplicateElement: (elementId: string) => {
    const { project, past } = get();
    if (!project) return;

    const targetEl = project.elements.find(el => el.id === elementId);
    if (!targetEl) return;

    const snapshot = createSnapshot(project);
    const newId = `${elementId}-copy-${Date.now()}`;
    const duplicatedEl = JSON.parse(JSON.stringify(targetEl));
    duplicatedEl.id = newId;
    
    // Offset slightly so it's visible
    if (duplicatedEl.placement?.position) {
      duplicatedEl.placement.position.x = (duplicatedEl.placement.position.x || 0) + 20;
      duplicatedEl.placement.position.y = (duplicatedEl.placement.position.y || 0) + 20;
    }

    set({
      project: { ...project, elements: [...project.elements, duplicatedEl] },
      past: [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot],
      future: [],
      elementIds: [newId],
      isDirty: true
    });
  },

  addKeyframe: (elementId: string, property: string, frame: number, value: number, easing = 'easeInOut', saveHistory = true) => {
    const { project, past } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    
    const newElements = project.elements.map(el => {
      if (el.id === elementId) {
        const keyframes = el.keyframes ? JSON.parse(JSON.stringify(el.keyframes)) : [];
        let track = keyframes.find((k: KeyframeTrack) => k.property === property);
        
        if (!track) {
          track = { property, keyframes: [] };
          keyframes.push(track);
        }
        
        const existingKfIndex = track.keyframes.findIndex((k: any) => k.frame === frame);
        if (existingKfIndex >= 0) {
          track.keyframes[existingKfIndex] = { ...track.keyframes[existingKfIndex], value, easing };
        } else {
          track.keyframes.push({ id: `kf-${Date.now()}`, frame, value, easing });
          track.keyframes.sort((a: any, b: any) => a.frame - b.frame);
        }

        return { ...el, keyframes };
      }
      return el;
    });

    const newState: Partial<EditorState> = {
      project: { ...project, elements: newElements }, isDirty: true
    };

    if (saveHistory) {
      newState.past = [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot];
      newState.future = [];
    }

    set(newState);
  },

  removeKeyframe: (elementId: string, property: string, frame: number, saveHistory = true) => {
    const { project, past } = get();
    if (!project) return;

    const snapshot = createSnapshot(project);
    
    const newElements = project.elements.map(el => {
      if (el.id === elementId && el.keyframes) {
        const keyframes = JSON.parse(JSON.stringify(el.keyframes));
        const trackIndex = keyframes.findIndex((k: KeyframeTrack) => k.property === property);
        
        if (trackIndex >= 0) {
          const track = keyframes[trackIndex];
          track.keyframes = track.keyframes.filter((k: any) => k.frame !== frame);
          
          if (track.keyframes.length === 0) {
            keyframes.splice(trackIndex, 1);
          }
          
          return { ...el, keyframes: keyframes.length > 0 ? keyframes : undefined };
        }
      }
      return el;
    });

    const newState: Partial<EditorState> = {
      project: { ...project, elements: newElements }, isDirty: true
    };

    if (saveHistory) {
      newState.past = [...past.slice(-MAX_HISTORY_LENGTH + 1), snapshot];
      newState.future = [];
    }

    set(newState);
  }
}));
