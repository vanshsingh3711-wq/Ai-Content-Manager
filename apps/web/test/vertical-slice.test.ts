import { describe, it, expect, beforeEach } from "vitest";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { timelineProjectToSceneDefinition } from "../lib/project-adapter";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 5: First End-to-End Vertical Slice Integration Test", () => {
  const initialProject: TimelineProject = {
    id: "vertical-slice-proj",
    title: "Vertical Slice Demo",
    aspectRatio: "9:16",
    duration: 10.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "clip-main",
          sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          name: "Talking Head",
          start: 0,
          end: 10.0,
          sourceStart: 0,
          sourceEnd: 10.0,
          speed: 1,
          volume: 100,
          zoomFactor: 1.0,
          position: { x: 50, y: 50 },
          scale: 1.0,
        },
      ],
      brollTrack: [],
      textTrack: [],
      graphicsTrack: [],
      audioTrack: [],
    },
    constraints: [],
    safeZones: [],
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setPlayheadTime(1.0);
    useTimelineStore.getState().setSelectedItem(null);
  });

  it("executes the 3 canonical commands end-to-end with full state sync and undo rollback", () => {
    const store = useTimelineStore.getState();

    // =========================================================================
    // STEP 1: Command 1 -> "Add a title that says Welcome."
    // =========================================================================
    let currentState = useTimelineStore.getState();
    let context = assembleEditorContext(
      currentState.project,
      currentState.playheadTime,
      currentState.selectedItem
    );

    const resultCmd1 = parseLocalCommand("Add a title that says Welcome.", context);
    expect(resultCmd1.matched).toBe(true);
    expect(resultCmd1.operation).toBeDefined();
    expect(resultCmd1.operation?.type).toBe("add_element");

    // Dispatch operation to operational bus
    useTimelineStore.getState().dispatchOperation(resultCmd1.operation!);

    // Verify Store State after Command 1
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack.length).toBe(1);

    const addedCaption = currentState.project.tracks.textTrack[0];
    expect(addedCaption.text).toBe("Welcome");
    expect(addedCaption.start).toBe(1.0); // Aligned with playhead
    expect(addedCaption.position).toEqual({ x: 50, y: 75 });
    expect(addedCaption.scale ?? 1.0).toBe(1.0);
    expect(currentState.past.length).toBe(1);

    // Verify Scene Adapter Sync (Canvas Projection)
    const sceneAfterCmd1 = timelineProjectToSceneDefinition(currentState.project);
    const captionElem = sceneAfterCmd1.elements.find((e) => e.id === addedCaption.id);
    expect(captionElem).toBeDefined();
    expect(captionElem?.textContent).toBe("Welcome");
    expect(captionElem?.placement?.position).toEqual({ x: 540, y: 1440 }); // 50% of 1080, 75% of 1920

    // =========================================================================
    // STEP 2: Command 2 -> "Make the selected element bigger."
    // =========================================================================
    // Select the new caption
    useTimelineStore.getState().setSelectedItem({ type: "caption", id: addedCaption.id });

    currentState = useTimelineStore.getState();
    context = assembleEditorContext(
      currentState.project,
      currentState.playheadTime,
      currentState.selectedItem
    );
    expect(context.selectedItem?.id).toBe(addedCaption.id);

    const resultCmd2 = parseLocalCommand("Make the selected element bigger.", context);
    expect(resultCmd2.matched).toBe(true);
    expect(resultCmd2.operation?.type).toBe("resize_element");

    // Dispatch resize operation
    useTimelineStore.getState().dispatchOperation(resultCmd2.operation!);

    // Verify Store State after Command 2
    currentState = useTimelineStore.getState();
    const enlargedCaption = currentState.project.tracks.textTrack[0];
    expect(enlargedCaption.scale).toBe(1.25); // 1.0 * 1.25
    expect(currentState.past.length).toBe(2);

    // =========================================================================
    // STEP 3: Command 3 -> "Move the selected element to the right."
    // =========================================================================
    currentState = useTimelineStore.getState();
    context = assembleEditorContext(
      currentState.project,
      currentState.playheadTime,
      currentState.selectedItem
    );

    const resultCmd3 = parseLocalCommand("Move the selected element to the right.", context);
    expect(resultCmd3.matched).toBe(true);
    expect(resultCmd3.operation?.type).toBe("move_element");

    // Dispatch move operation
    useTimelineStore.getState().dispatchOperation(resultCmd3.operation!);

    // Verify Store State after Command 3
    currentState = useTimelineStore.getState();
    const movedCaption = currentState.project.tracks.textTrack[0];
    expect(movedCaption.position?.x).toBe(60); // 50 + 10 = 60
    expect(movedCaption.position?.y).toBe(75);
    expect(movedCaption.isUserLocked).toBe(true);
    expect(currentState.past.length).toBe(3);

    // Verify Canvas Projection after Command 3
    const sceneAfterCmd3 = timelineProjectToSceneDefinition(currentState.project);
    const movedSceneElem = sceneAfterCmd3.elements.find((e) => e.id === addedCaption.id);
    expect(movedSceneElem?.placement?.position).toEqual({ x: 648, y: 1440 }); // 60% of 1080 = 648px
    expect(movedSceneElem?.placement?.size?.scale).toBe(1.25);

    // =========================================================================
    // STEP 4: Consecutive Undo Verification (Rollback through all 3 commands)
    // =========================================================================
    // 1st Undo -> Rollback Command 3 (Move)
    useTimelineStore.getState().undo();
    currentState = useTimelineStore.getState();
    let captionAfterUndo1 = currentState.project.tracks.textTrack[0];
    expect(captionAfterUndo1.position?.x).toBe(50); // Restored to 50%
    expect(captionAfterUndo1.scale).toBe(1.25); // Scale still 1.25
    expect(currentState.past.length).toBe(2);
    expect(currentState.future.length).toBe(1);

    // 2nd Undo -> Rollback Command 2 (Resize)
    useTimelineStore.getState().undo();
    currentState = useTimelineStore.getState();
    let captionAfterUndo2 = currentState.project.tracks.textTrack[0];
    expect(captionAfterUndo2.scale).toBe(1.0); // Restored to 1.0
    expect(captionAfterUndo2.position?.x).toBe(50);
    expect(currentState.past.length).toBe(1);
    expect(currentState.future.length).toBe(2);

    // 3rd Undo -> Rollback Command 1 (Add element)
    useTimelineStore.getState().undo();
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack.length).toBe(0); // Caption completely removed
    expect(currentState.past.length).toBe(0);
    expect(currentState.future.length).toBe(3);

    // =========================================================================
    // STEP 5: Redo Forward Playback
    // =========================================================================
    // 1st Redo -> Restores added title
    useTimelineStore.getState().redo();
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack.length).toBe(1);
    expect(currentState.project.tracks.textTrack[0].text).toBe("Welcome");

    // 2nd Redo -> Restores scale 1.25
    useTimelineStore.getState().redo();
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack[0].scale).toBe(1.25);

    // 3rd Redo -> Restores position 60%
    useTimelineStore.getState().redo();
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack[0].position?.x).toBe(60);
    expect(currentState.future.length).toBe(0);
  });

  it("synchronizes motion graphic element end-to-end across chat, store, canvas projection, and inspector", () => {
    // 1. User prompts: "Add animated counter"
    let currentState = useTimelineStore.getState();
    let context = assembleEditorContext(
      currentState.project,
      currentState.playheadTime,
      currentState.selectedItem
    );

    const parseResult = parseLocalCommand("Add animated counter", context);
    expect(parseResult.matched).toBe(true);
    expect(parseResult.operation?.type).toBe("add_element");
    expect(parseResult.operation?.track).toBe("graphic");

    // Dispatch operation
    useTimelineStore.getState().dispatchOperation(parseResult.operation!);

    // Verify Store Track
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.graphicsTrack.length).toBe(1);
    const addedGraphic = currentState.project.tracks.graphicsTrack[0];
    expect(addedGraphic.compositionId).toBe("animated_counter");
    expect(addedGraphic.position).toEqual({ x: 50, y: 50 });

    // Verify Canvas Projection (Adapter)
    const scene = timelineProjectToSceneDefinition(currentState.project);
    const graphicSceneItem = scene.elements.find((e) => e.id === addedGraphic.id);
    expect(graphicSceneItem).toBeDefined();
    expect(graphicSceneItem?.assetId).toBe("animated_counter");

    // 2. Select Graphic Element -> Verifies Inspector Sync
    useTimelineStore.getState().setSelectedItem({ type: "graphic", id: addedGraphic.id });
    currentState = useTimelineStore.getState();
    expect(currentState.selectedItem).toEqual({ type: "graphic", id: addedGraphic.id });

    // 3. User prompts: "Make the selected element bigger"
    context = assembleEditorContext(
      currentState.project,
      currentState.playheadTime,
      currentState.selectedItem
    );
    const resizeResult = parseLocalCommand("Make the selected element bigger", context);
    expect(resizeResult.matched).toBe(true);
    useTimelineStore.getState().dispatchOperation(resizeResult.operation!);

    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.graphicsTrack[0].scale).toBe(1.25);

    // 4. Consecutive Undo restores exact state
    useTimelineStore.getState().undo(); // Reverts resize
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.graphicsTrack[0].scale).toBe(1.0);

    useTimelineStore.getState().undo(); // Reverts add graphic
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.graphicsTrack.length).toBe(0);
  });

  it("handles missing selection gracefully with informative feedback and recovers on selection", () => {
    // 1. Initial state: add a caption
    useTimelineStore.getState().dispatchOperation({
      type: "add_element",
      track: "caption",
      element: {
        id: "caption-sel-test",
        text: "Test Title",
        start: 1.0,
        end: 4.0,
        stylePreset: "tiktok_yellow",
        position: { x: 50, y: 75 },
        scale: 1.0,
      },
    });

    // Ensure NO selection
    useTimelineStore.getState().setSelectedItem(null);
    let currentState = useTimelineStore.getState();
    let context = assembleEditorContext(currentState.project, 1.0, null);

    // 2. Try to resize without selection
    const resizeAttempt = parseLocalCommand("Make the selected element bigger", context);
    expect(resizeAttempt.matched).toBe(true);
    expect(resizeAttempt.error).toBe("Please select an element first.");
    expect(resizeAttempt.operation).toBeUndefined();

    // 3. Try to move without selection
    const moveAttempt = parseLocalCommand("Move the selected element to the right", context);
    expect(moveAttempt.matched).toBe(true);
    expect(moveAttempt.error).toBe("Please select an element first.");
    expect(moveAttempt.operation).toBeUndefined();

    // 4. Select the element and retry
    useTimelineStore.getState().setSelectedItem({ type: "caption", id: "caption-sel-test" });
    currentState = useTimelineStore.getState();
    context = assembleEditorContext(currentState.project, 1.0, currentState.selectedItem);

    const retryMove = parseLocalCommand("Move the selected element to the right", context);
    expect(retryMove.matched).toBe(true);
    expect(retryMove.error).toBeUndefined();
    expect(retryMove.operation).toBeDefined();

    // Dispatch and verify
    useTimelineStore.getState().dispatchOperation(retryMove.operation!);
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack[0].position?.x).toBe(60);

    // Undo restores position to 50
    useTimelineStore.getState().undo();
    currentState = useTimelineStore.getState();
    expect(currentState.project.tracks.textTrack[0].position?.x).toBe(50);
  });
});

