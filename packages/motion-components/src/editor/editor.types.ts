import { SceneDefinition, SceneElementDefinition } from '../scene/scene.types';
import { KeyframeTrack } from '../keyframes/keyframes.types';

export interface EditorHistorySnapshot {
  project: SceneDefinition;
}

export interface EditorUIState {
  sceneId?: string;
  elementIds: string[];
  keyframeId?: string;
  
  playheadFrame: number;
  timelineZoom: number;
  timelineScrollX: number;
  timelineScrollY: number;
  
  keyframeMode: boolean;
  isDirty: boolean;
}

export interface EditorState extends EditorUIState {
  project: SceneDefinition | null;
  past: EditorHistorySnapshot[];
  future: EditorHistorySnapshot[];

  // Initialization
  initProject: (project: SceneDefinition) => void;
  loadProject: (project: SceneDefinition) => void;
  applyGeneratedProject: (project: SceneDefinition) => void;
  markClean: () => void;

  // Selection
  selectScene: (sceneId: string) => void;
  selectElement: (elementId: string) => void;
  selectElements: (elementIds: string[]) => void;
  selectKeyframe: (keyframeId: string) => void;
  clearSelection: () => void;

  // Playhead & UI
  setPlayheadFrame: (frame: number) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (x: number, y: number) => void;
  setKeyframeMode: (mode: boolean) => void;

  // History operations
  undo: () => void;
  redo: () => void;
  commitHistory: () => void; // Call this at the end of a drag operation

  // Project Modifiers (these automatically mutate the project and MAY commit to history)
  updateElementProperties: (elementId: string, updates: Partial<SceneElementDefinition>, saveHistory?: boolean) => void;
  moveElement: (elementId: string, dx: number, dy: number, saveHistory?: boolean) => void;
  resizeElement: (elementId: string, width: number, height: number, saveHistory?: boolean) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;

  // Keyframes operations
  addKeyframe: (elementId: string, property: string, frame: number, value: number, easing?: string, saveHistory?: boolean) => void;
  removeKeyframe: (elementId: string, property: string, frame: number, saveHistory?: boolean) => void;
}
