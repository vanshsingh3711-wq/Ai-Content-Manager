import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { StagedEditReviewDrawer } from "../components/editor/StagedEditReviewDrawer";
import { EditPlanProposal, ProposedEditItem } from "../lib/ai/copilot-types";
import { executeOperation, createInverseOperation } from "../lib/operations/operation-executor";
import { TimelineProject } from "../lib/timeline-types";

describe("Phase 3: Prompt-Driven Motion Graphics & Dynamic Customization", () => {
  const baseContext = {
    projectId: "proj-p3",
    projectTitle: "Phase 3 Test Project",
    duration: 120.0,
    playheadTime: 0.0,
    aspectRatio: "9:16",
    fps: 30,
    selectedItem: null,
    activeElements: {
      activeVideo: null,
      activeBroll: null,
      activeCaption: null,
      activeGraphic: null,
    },
    trackSummary: {
      videoCount: 1,
      brollCount: 0,
      captionCount: 0,
      graphicCount: 0,
      audioCount: 0,
      captionsList: [],
      graphicsList: [],
    },
    constraints: [],
    safeZones: [
      {
        id: "sz-presenter",
        timestamp: 0,
        duration: 120,
        x: 30,
        y: 20,
        width: 40,
        height: 45,
        confidence: 0.98,
        type: "subject" as const,
      },
    ],
    transcriptWords: [],
    scriptBeats: [],
  };

  it("Acceptance Test A.1: parses 'Add a blue animated title saying 'The Solution' from 01:23 to 01:26'", () => {
    const prompt = "Add a blue animated title saying 'The Solution' from 01:23 to 01:26";
    const result = parseLocalCommand(prompt, baseContext);

    expect(result.matched).toBe(true);
    expect(result.operation).toBeDefined();

    const op = result.operation!;
    expect(op.type).toBe("add_element");
    expect(op.track).toBe("graphic");

    const elem = (op as any).element;
    expect(elem.start).toBe(83.0);
    expect(elem.end).toBe(86.0);
    expect(["hero_reveal", "hero-reveal"]).toContain(elem.compositionId);
    expect(elem.props.headline).toBe("The Solution");
    expect(elem.props.colorTheme).toBe("blue");

    // Safe zone avoidance: presenter occupies upper-center (y: 20..80, x: 30..70).
    // Graphic is placed in lower third (y >= 70) away from presenter's face/body.
    expect(elem.position.y).toBeGreaterThanOrEqual(70);
  });

  it("Acceptance Test A.2: parses 'Add an animated subscriber counter from 00:12 to 00:16 counting to 50k'", () => {
    const prompt = "Add an animated subscriber counter from 00:12 to 00:16 counting to 50k";
    const result = parseLocalCommand(prompt, {
      ...baseContext,
      duration: 60.0,
    });

    expect(result.matched).toBe(true);
    expect(result.operation).toBeDefined();

    const op = result.operation!;
    expect(op.type).toBe("add_element");
    expect(op.track).toBe("graphic");

    const elem = (op as any).element;
    expect(elem.start).toBe(12.0);
    expect(elem.end).toBe(16.0);
    expect(["animated_counter", "animated-counter"]).toContain(elem.compositionId);
    expect(elem.props.from).toBe(0);
    expect(elem.props.to).toBe(50000);
    expect(elem.props.label).toBe("SUBSCRIBERS");
  });

  it("renders StagedEditReviewDrawer with hero-reveal props and allows dynamic editing", () => {
    const mockEdit: ProposedEditItem = {
      id: "edit-hero-1",
      action_type: "graphic",
      track: "graphic",
      start: 83.0,
      end: 86.0,
      title: "Hero Reveal Title",
      description: "Customized Hero Reveal motion card",
      reason: "Visualizes breakthrough concept",
      operation: {
        type: "add_element",
        track: "graphic",
        element: {
          id: "graphic-hero-1",
          name: "Hero Reveal Title",
          compositionId: "hero-reveal",
          start: 83.0,
          end: 86.0,
          position: { x: 50, y: 75 },
          scale: 1.0,
          props: {
            headline: "The Solution",
            label: "KEY TAKEAWAY",
            supporting: "Breakthrough concept",
            colorTheme: "blue",
          },
        },
      },
    };

    const mockProposal: EditPlanProposal = {
      plan_id: "plan-phase3-test",
      user_prompt: "Add a blue animated title saying 'The Solution' from 01:23 to 01:26",
      summary: "Add blue animated hero title",
      scope: "time_range",
      confidence: 0.95,
      edits: [mockEdit],
    };

    const onUpdateEdit = vi.fn();
    const onApplySelected = vi.fn();

    render(
      <StagedEditReviewDrawer
        isOpen={true}
        onClose={vi.fn()}
        proposal={mockProposal}
        onApplySelected={onApplySelected}
        onUpdateEdit={onUpdateEdit}
      />
    );

    // Expand parameters customizer
    const expandBtn = screen.getByTestId("customize-edit-btn-edit-hero-1");
    fireEvent.click(expandBtn);

    // Check that headline input exists and contains 'The Solution'
    const headlineInput = screen.getByTestId("prop-hero-headline-edit-hero-1") as HTMLInputElement;
    expect(headlineInput.value).toBe("The Solution");

    // Edit headline
    fireEvent.change(headlineInput, { target: { value: "A New Paradigm" } });
    expect(onUpdateEdit).toHaveBeenCalled();

    // Check color switcher button exists and click 'Cyan'
    const cyanBtn = screen.getByTestId("prop-hero-color-cyan-edit-hero-1");
    fireEvent.click(cyanBtn);
    expect(onUpdateEdit).toHaveBeenCalled();

    // Switch to Counter template
    const counterTemplateBtn = screen.getByTestId("template-btn-counter-edit-hero-1");
    fireEvent.click(counterTemplateBtn);
    expect(onUpdateEdit).toHaveBeenCalled();
  });

  it("verifies clean undo/redo inversion for motion graphic add_element operation", () => {
    const initialProject: TimelineProject = {
      id: "proj-1",
      title: "Undo Test Project",
      duration: 120,
      aspectRatio: "9:16",
      fps: 30,
      tracks: {
        videoTrack: [],
        brollTrack: [],
        textTrack: [],
        audioTrack: [],
        graphicsTrack: [],
      },
      transitions: [],
      constraints: [],
      safeZones: [],
    };

    const addGraphicOp = {
      type: "add_element" as const,
      track: "graphic" as const,
      element: {
        id: "graphic-test-undo",
        name: "Hero Reveal Title",
        compositionId: "hero-reveal",
        start: 83.0,
        end: 86.0,
        props: { headline: "The Solution", colorTheme: "blue" },
        position: { x: 50, y: 75 },
        scale: 1.0,
        rotation: 0,
      },
    };

    // 1. Apply add_element
    const { nextProject: projectWithGraphic, inverse } = executeOperation(initialProject, addGraphicOp);
    expect(projectWithGraphic.tracks.graphicsTrack.length).toBe(1);
    expect(projectWithGraphic.tracks.graphicsTrack[0].id).toBe("graphic-test-undo");

    // 2. Verify generated inverse operation
    expect(inverse).toBeDefined();
    expect(inverse.type).toBe("delete_element");
    expect((inverse as any).targetId).toBe("graphic-test-undo");

    // 3. Apply inverse operation (Undo)
    const { nextProject: restoredProject } = executeOperation(projectWithGraphic, inverse);
    expect(restoredProject.tracks.graphicsTrack.length).toBe(0);
  });
});
