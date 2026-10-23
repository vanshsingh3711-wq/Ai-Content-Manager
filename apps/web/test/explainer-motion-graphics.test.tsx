import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphicCanvasRenderer } from "../components/editor/GraphicCanvasRenderer";
import { GraphicElement, TimelineProject } from "../lib/timeline-types";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import {
  timelineProjectToSceneDefinition,
  sceneDefinitionToTimelineProject,
  timelineProjectToMasterBlueprint,
} from "../lib/project-adapter";
import {
  RESOURCE_CATALOG,
  getResourceById,
  validateResource,
  searchResources,
  createOperationFromResource,
} from "../lib/library/resource-registry";

describe("Explainer & Educational Motion Graphics Pack - WYSIWYG Canvas", () => {
  it("renders 1. venn-diagram with 3 circles and center sweet spot", () => {
    const graphic: GraphicElement = {
      id: "exp-1",
      name: "3-Way Venn Diagram",
      compositionId: "venn-diagram",
      props: {
        title: "THE SWEET SPOT",
        subtitle: "WHERE PASSION MEETS PROFIT & MASTERY",
        circle1Label: "PASSION",
        circle2Label: "MASTERY",
        circle3Label: "MARKET",
        centerLabel: "IKIGAI",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-venn-diagram")).toBeDefined();
    expect(screen.getByText("THE SWEET SPOT")).toBeDefined();
    expect(screen.getByText("WHERE PASSION MEETS PROFIT & MASTERY")).toBeDefined();
    expect(screen.getByText("SYNTHESIS ARCHITECTURE")).toBeDefined();
    expect(screen.getByText("★ IKIGAI: THE UNFAIR ADVANTAGE ★")).toBeDefined();
  });

  it("renders 2. funnel-analysis with stage drop-offs and attrition alert", () => {
    const graphic: GraphicElement = {
      id: "exp-2",
      name: "Conversion Funnel",
      compositionId: "funnel-analysis",
      props: {
        title: "CONVERSION DROP-OFF",
        subtitle: "HIGH-TICKET CLIENT PIPELINE",
        dropoffNote: "99.9% ELIMINATED AT TOP OF FUNNEL",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-funnel-analysis")).toBeDefined();
    expect(screen.getByText("CONVERSION DROP-OFF")).toBeDefined();
    expect(screen.getByText("PIPELINE ATTRITION")).toBeDefined();
    expect(screen.getByText("99.9% ELIMINATED AT TOP OF FUNNEL")).toBeDefined();
  });

  it("renders 3. horizontal-process-flow with 4 sequential phases and active status", () => {
    const graphic: GraphicElement = {
      id: "exp-3",
      name: "Process Flow",
      compositionId: "horizontal-process-flow",
      props: {
        title: "HOW IT WORKS: 4-STEP BLUEPRINT",
        subtitle: "FROM ZERO TO SCALED AUTOMATION",
        activeStep: 3,
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-horizontal-process-flow")).toBeDefined();
    expect(screen.getByText("HOW IT WORKS: 4-STEP BLUEPRINT")).toBeDefined();
    expect(screen.getByText("EXECUTION PIPELINE")).toBeDefined();
    expect(screen.getByText("Deploy")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();
  });

  it("renders 4. feature-callout-pointer with HUD target lock and spec tag", () => {
    const graphic: GraphicElement = {
      id: "exp-4",
      name: "Feature Callout",
      compositionId: "feature-callout-pointer",
      props: {
        headline: "RETINAL HUD DISPLAY",
        category: "HARDWARE BREAKDOWN",
        detailText: "Micro-OLED 4K waveguides with real-time 120Hz spatial eye tracking.",
        specTag: "LATENCY < 12ms",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-feature-callout-pointer")).toBeDefined();
    expect(screen.getByText("RETINAL HUD DISPLAY")).toBeDefined();
    expect(screen.getByText("HARDWARE BREAKDOWN")).toBeDefined();
    expect(screen.getByText("LATENCY < 12ms")).toBeDefined();
    expect(screen.getByText("TARGET: [540, 720] LOCKED")).toBeDefined();
  });

  it("renders 5. quadrant-matrix with 2x2 grid and highlighted target zone", () => {
    const graphic: GraphicElement = {
      id: "exp-5",
      name: "Eisenhower Matrix",
      compositionId: "quadrant-matrix",
      props: {
        title: "EISENHOWER DECISION MATRIX",
        subtitle: "URGENCY VS IMPORTANCE FRAMEWORK",
        q1Title: "DO FIRST",
        q2Title: "SCHEDULE",
        activeQuadrant: 2,
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-quadrant-matrix")).toBeDefined();
    expect(screen.getByText("EISENHOWER DECISION MATRIX")).toBeDefined();
    expect(screen.getByText("2×2 DECISION MATRIX")).toBeDefined();
    expect(screen.getByText("DO FIRST")).toBeDefined();
    expect(screen.getByText("SCHEDULE")).toBeDefined();
    expect(screen.getByText("🎯 OPTIMIZE 70%+ ENERGY IN QUADRANT 2")).toBeDefined();
  });

  it("renders 6. spectrum-continuum with continuous spectrum and index marker", () => {
    const graphic: GraphicElement = {
      id: "exp-6",
      name: "Architecture Spectrum",
      compositionId: "spectrum-continuum",
      props: {
        title: "THE ARCHITECTURE SPECTRUM",
        leftLabel: "100% MONOLITH",
        rightLabel: "100% MICROSERVICES",
        currentValue: 68,
        markerTitle: "MODULAR MONOLITH",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-spectrum-continuum")).toBeDefined();
    expect(screen.getByText("THE ARCHITECTURE SPECTRUM")).toBeDefined();
    expect(screen.getByText("CONTINUOUS SPECTRUM")).toBeDefined();
    expect(screen.getByText("100% MONOLITH")).toBeDefined();
    expect(screen.getByText("100% MICROSERVICES")).toBeDefined();
    expect(screen.getByText("INDEX: 68%")).toBeDefined();
    expect(screen.getByText("MODULAR MONOLITH")).toBeDefined();
  });

  it("renders 7. iceberg-model with surface 10% and hidden underwater 90%", () => {
    const graphic: GraphicElement = {
      id: "exp-7",
      name: "Iceberg Illusion",
      compositionId: "iceberg-model",
      props: {
        title: "THE ICEBERG ILLUSION",
        surfaceTitle: "WHAT PEOPLE SEE (10%)",
        underwaterTitle: "WHAT LIES BENEATH (90%)",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-iceberg-model")).toBeDefined();
    expect(screen.getByText("THE ICEBERG ILLUSION")).toBeDefined();
    expect(screen.getByText("DEPTH ARCHITECTURE")).toBeDefined();
    expect(screen.getByText("▲ WHAT PEOPLE SEE (10%)")).toBeDefined();
    expect(screen.getByText("▼ WHAT LIES BENEATH (90%)")).toBeDefined();
  });

  it("renders 8. pros-cons-comparison with dual columns and executive verdict", () => {
    const graphic: GraphicElement = {
      id: "exp-8",
      name: "Pros & Cons Duel",
      compositionId: "pros-cons-comparison",
      props: {
        title: "FRAMEWORK DUEL: NEXT.JS VS VITE",
        prosTitle: "KEY ADVANTAGES",
        consTitle: "TRADE-OFFS & RISKS",
        verdictBadge: "VERDICT: SSR HYBRID WINS FOR SCALE",
      },
      start: 0,
      end: 5,
    };

    render(<GraphicCanvasRenderer graphic={graphic} playheadTime={2.0} />);

    expect(screen.getByTestId("graphic-pros-cons-comparison")).toBeDefined();
    expect(screen.getByText("FRAMEWORK DUEL: NEXT.JS VS VITE")).toBeDefined();
    expect(screen.getByText("TRADE-OFF EVALUATION")).toBeDefined();
    expect(screen.getByText("✓ KEY ADVANTAGES")).toBeDefined();
    expect(screen.getByText("✕ TRADE-OFFS & RISKS")).toBeDefined();
    expect(screen.getByText("★ VERDICT: SSR HYBRID WINS FOR SCALE ★")).toBeDefined();
  });

  describe("Phase 3: Central Resource Registry & Parameter Schemas", () => {
    const expectedExplainerIds = [
      "mg-venn-diagram",
      "mg-funnel-analysis",
      "mg-horizontal-process-flow",
      "mg-feature-callout-pointer",
      "mg-quadrant-matrix",
      "mg-spectrum-continuum",
      "mg-iceberg-model",
      "mg-pros-cons-comparison",
    ];

    it("verifies all 8 explainer resources exist in RESOURCE_CATALOG and validate cleanly", () => {
      expectedExplainerIds.forEach((id: string) => {
        const resource = getResourceById(id);
        expect(resource).toBeDefined();
        expect(resource.type).toBe("motion_graphic");
        expect(resource.category).toBe("Explainer Graphics");
        expect(resource.targetTrack).toBe("graphic");
        expect(resource.parameters.length).toBeGreaterThan(0);
        expect(resource.defaultProps).toBeDefined();

        const validated = validateResource(resource);
        expect(validated.id).toBe(id);
      });
    });

    it("filters explainer resources via search query and tags", () => {
      const vennResults = searchResources("venn");
      expect(vennResults.some((r: any) => r.id === "mg-venn-diagram")).toBe(true);

      const funnelResults = searchResources("funnel");
      expect(funnelResults.some((r: any) => r.id === "mg-funnel-analysis")).toBe(true);

      const icebergResults = searchResources("iceberg");
      expect(icebergResults.some((r: any) => r.id === "mg-iceberg-model")).toBe(true);

      const explainerResults = searchResources("explainer");
      expect(explainerResults.length).toBeGreaterThanOrEqual(8);
    });

    it("creates valid add_element edit operations for explainer motion graphics", () => {
      const vennResource = getResourceById("mg-venn-diagram");
      const result = createOperationFromResource(vennResource, { timestamp: 2.5 });

      expect(result.success).toBe(true);
      expect(result.operation.type).toBe("add_element");
      expect(result.operation.track).toBe("graphic");
      expect(result.operation.element.start).toBe(2.5);
      expect(result.operation.element.end).toBe(7.5);
      expect(result.operation.element.compositionId).toBe("venn-diagram");
      expect(result.operation.element.props.title).toBe("THE SWEET SPOT");
    });
  });

  describe("Phase 4: AI Copilot Natural Language Script Matching", () => {
    const mockContext = {
      projectId: "proj-explainer-ai",
      projectTitle: "AI Copilot Test",
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
      safeZones: [],
      transcriptWords: [
        { word: "this", start: 10.0, end: 10.3 },
        { word: "is", start: 10.3, end: 10.5 },
        { word: "the", start: 10.5, end: 10.7 },
        { word: "intersection", start: 10.7, end: 11.2 },
      ],
      scriptBeats: [],
    };

    it("parses 1. 'add a 3-way venn diagram from 00:02 to 00:07'", () => {
      const res = parseLocalCommand("add a 3-way venn diagram from 00:02 to 00:07", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation).toBeDefined();
      expect(res.operation?.type).toBe("add_element");
      expect(res.operation?.track).toBe("graphic");
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("venn-diagram");
      expect(elem.start).toBe(2);
      expect(elem.end).toBe(7);
      expect(elem.props.centerLabel).toBe("IKIGAI");
    });

    it("parses 2. 'add funnel analysis from 00:10 to 00:15'", () => {
      const res = parseLocalCommand("add funnel analysis from 00:10 to 00:15", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("funnel-analysis");
      expect(elem.start).toBe(10);
      expect(elem.end).toBe(15);
      expect(elem.props.stages.length).toBe(4);
    });

    it("parses 3. 'add a horizontal process flow for phase 2 from 00:20 to 00:25'", () => {
      const res = parseLocalCommand("add a horizontal process flow for phase 2 from 00:20 to 00:25", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("horizontal-process-flow");
      expect(elem.start).toBe(20);
      expect(elem.end).toBe(25);
      expect(elem.props.activeStep).toBe(2);
    });

    it("parses 4. 'add feature callout pointing to 'NEURAL ENGINE' at 00:30'", () => {
      const res = parseLocalCommand("add feature callout pointing to 'NEURAL ENGINE' at 00:30", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("feature-callout-pointer");
      expect(elem.start).toBe(30);
      expect(elem.props.headline).toBe("NEURAL ENGINE");
    });

    it("parses 5. 'add 2x2 decision matrix highlighting quadrant 3 from 00:35 to 00:40'", () => {
      const res = parseLocalCommand("add 2x2 decision matrix highlighting quadrant 3 from 00:35 to 00:40", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("quadrant-matrix");
      expect(elem.start).toBe(35);
      expect(elem.end).toBe(40);
      expect(elem.props.activeQuadrant).toBe(3);
    });

    it("parses 6. 'add spectrum continuum at 85% from 00:45 to 00:50'", () => {
      const res = parseLocalCommand("add spectrum continuum at 85% from 00:45 to 00:50", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("spectrum-continuum");
      expect(elem.start).toBe(45);
      expect(elem.end).toBe(50);
      expect(elem.props.currentValue).toBe(85);
    });

    it("parses 7. 'add the iceberg illusion from 00:55 to 01:00'", () => {
      const res = parseLocalCommand("add the iceberg illusion from 00:55 to 01:00", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("iceberg-model");
      expect(elem.start).toBe(55);
      expect(elem.end).toBe(60);
      expect(elem.props.surfaceItems.length).toBeGreaterThan(0);
      expect(elem.props.underwaterItems.length).toBeGreaterThan(0);
    });

    it("parses 8. 'add pros and cons comparison from 01:05 to 01:10'", () => {
      const res = parseLocalCommand("add pros and cons comparison from 01:05 to 01:10", mockContext);
      expect(res.matched).toBe(true);
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("pros-cons-comparison");
      expect(elem.start).toBe(65);
      expect(elem.end).toBe(70);
      expect(elem.props.prosList.length).toBeGreaterThan(0);
      expect(elem.props.consList.length).toBeGreaterThan(0);
    });

    it("synchronizes explainer graphics when spoken in transcript ('when I say intersection')", () => {
      const res = parseLocalCommand("add graphic venn-diagram when I say intersection", mockContext);
      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");
      const elem = (res.operation as any).element;
      expect(elem.compositionId).toBe("venn-diagram");
      expect(elem.start).toBe(10.7);
    });
  });

  describe("Phase 5: Studio Sound Design & Auto-Ducking", () => {
    const explainerAudioProject = {
      projectId: "proj-explainer-sfx",
      projectTitle: "Studio Audio & Ducking Test",
      duration: 60.0,
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
        graphicCount: 4,
        audioCount: 0,
        captionsList: [],
        graphicsList: [
          {
            id: "graphic-venn",
            name: "3-Way Venn Diagram",
            compositionId: "venn-diagram",
            start: 5.0,
            end: 10.0,
            props: { title: "THE SWEET SPOT" },
          },
          {
            id: "graphic-funnel",
            name: "Conversion Drop-Off Funnel",
            compositionId: "funnel-analysis",
            start: 15.0,
            end: 20.0,
            props: { title: "CONVERSION DROP-OFF" },
          },
          {
            id: "graphic-matrix",
            name: "2x2 Decision Matrix",
            compositionId: "quadrant-matrix",
            start: 25.0,
            end: 30.0,
            props: { activeQuadrant: 2 },
          },
          {
            id: "graphic-iceberg",
            name: "The Iceberg Illusion",
            compositionId: "iceberg-model",
            start: 35.0,
            end: 40.0,
            props: { title: "THE ICEBERG ILLUSION" },
          },
        ],
      },
      graphicsElements: [
        {
          id: "graphic-venn",
          name: "3-Way Venn Diagram",
          compositionId: "venn-diagram",
          start: 5.0,
          end: 10.0,
        },
        {
          id: "graphic-funnel",
          name: "Conversion Drop-Off Funnel",
          compositionId: "funnel-analysis",
          start: 15.0,
          end: 20.0,
        },
        {
          id: "graphic-matrix",
          name: "2x2 Decision Matrix",
          compositionId: "quadrant-matrix",
          start: 25.0,
          end: 30.0,
        },
        {
          id: "graphic-iceberg",
          name: "The Iceberg Illusion",
          compositionId: "iceberg-model",
          start: 35.0,
          end: 40.0,
        },
      ],
      constraints: [],
      safeZones: [],
      transcriptWords: [],
      scriptBeats: [],
    };

    it("pairs chime sound effect when 3-way venn diagram appears", () => {
      const res = parseLocalCommand(
        "Add chime sound when 3-way venn diagram appears",
        explainerAudioProject
      );

      expect(res.matched).toBe(true);
      expect(res.operation?.type).toBe("add_element");
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(5.0);
      expect(op.element.name).toBe("Chime SFX");
      expect(op.element.sourceUrl).toBe("/assets/audio/chime.mp3");
    });

    it("pairs whoosh sound effect when conversion funnel enters", () => {
      const res = parseLocalCommand(
        "Add whoosh sound when conversion funnel enters",
        explainerAudioProject
      );

      expect(res.matched).toBe(true);
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(15.0);
      expect(op.element.name).toBe("Whoosh SFX");
      expect(op.element.sourceUrl).toBe("/assets/audio/whoosh.mp3");
    });

    it("automatically pairs signature Impact SFX when sound effect is requested for quadrant matrix", () => {
      const res = parseLocalCommand(
        "Add a sound effect when quadrant matrix appears",
        explainerAudioProject
      );

      expect(res.matched).toBe(true);
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(25.0);
      expect(op.element.name).toBe("Impact SFX");
      expect(op.element.sourceUrl).toBe("/assets/audio/impact.mp3");
    });

    it("pairs impact sound effect when iceberg illusion appears", () => {
      const res = parseLocalCommand(
        "Add impact sound when iceberg illusion enters",
        explainerAudioProject
      );

      expect(res.matched).toBe(true);
      const op = res.operation as any;
      expect(op.track).toBe("audio");
      expect(op.element.start).toBe(35.0);
      expect(op.element.name).toBe("Impact SFX");
      expect(op.element.sourceUrl).toBe("/assets/audio/impact.mp3");
    });

    it("generates BGM track with -14dB narration ducking coexisting with explainer graphic cues", () => {
      const bgmRes = parseLocalCommand(
        "Add chill background music and duck it whenever I speak",
        explainerAudioProject
      );

      expect(bgmRes.matched).toBe(true);
      const bgmOp = bgmRes.operation as any;
      expect(bgmOp.track).toBe("audio");
      expect(bgmOp.element.isBgm).toBe(true);
      expect(bgmOp.element.ducking).toBe(true);
      expect(bgmOp.element.duckingDb).toBe(-14.0);
    });
  });

  describe("Phase 6: Render Bridge & Celery Worker Integration", () => {
    const createExplainerProject = (): TimelineProject => ({
      id: "proj-explainer-render",
      title: "Explainer Motion Graphics Master Production",
      aspectRatio: "9:16",
      duration: 40.0,
      fps: 30,
      tracks: {
        videoTrack: [
          {
            id: "vid-main",
            sourceUrl: "https://example.com/explainer_speaker.mp4",
            name: "Main Explainer Presenter",
            start: 0,
            end: 40.0,
            sourceStart: 0,
            sourceEnd: 40.0,
            speed: 1.0,
            volume: 100,
            zoomFactor: 1.0,
          },
        ],
        brollTrack: [],
        textTrack: [],
        audioTrack: [
          {
            id: "bgm-1",
            sourceUrl: "https://example.com/bgm.mp3",
            name: "Ambient Lo-Fi",
            start: 0,
            end: 40.0,
            volume: 25,
            isBgm: true,
            ducking: true,
            duckingDb: -14.0,
          },
        ],
        graphicsTrack: [
          { id: "g1", name: "3-Way Venn Diagram", compositionId: "venn-diagram", start: 0, end: 5.0, props: { title: "THE SWEET SPOT", centerLabel: "IKIGAI" } },
          { id: "g2", name: "Conversion Funnel", compositionId: "funnel-analysis", start: 5.0, end: 10.0, props: { title: "CONVERSION DROP-OFF" } },
          { id: "g3", name: "Process Flow", compositionId: "horizontal-process-flow", start: 10.0, end: 15.0, props: { title: "4-STEP BLUEPRINT", activeStep: 2 } },
          { id: "g4", name: "Feature Callout", compositionId: "feature-callout-pointer", start: 15.0, end: 20.0, props: { headline: "NEURAL ENGINE" } },
          { id: "g5", name: "Quadrant Matrix", compositionId: "quadrant-matrix", start: 20.0, end: 25.0, props: { activeQuadrant: 3 } },
          { id: "g6", name: "Spectrum Continuum", compositionId: "spectrum-continuum", start: 25.0, end: 30.0, props: { currentValue: 80 } },
          { id: "g7", name: "The Iceberg Illusion", compositionId: "iceberg-model", start: 30.0, end: 35.0, props: { title: "THE ICEBERG ILLUSION" } },
          { id: "g8", name: "Pros & Cons", compositionId: "pros-cons-comparison", start: 35.0, end: 40.0, props: { title: "FRAMEWORK DUEL" } },
        ],
      },
    });

    it("compiles all 8 explainer graphics into a Remotion SceneDefinition with frame accuracy", () => {
      const project = createExplainerProject();
      const scene = timelineProjectToSceneDefinition(project);

      expect(scene.id).toBe("proj-explainer-render");
      expect(scene.durationInFrames).toBe(1200); // 40s * 30fps

      const graphicElements = scene.elements.filter((e) => e.type === "asset");
      expect(graphicElements).toHaveLength(8);

      const compIds = graphicElements.map((e) => e.assetId);
      expect(compIds).toEqual([
        "venn-diagram",
        "funnel-analysis",
        "horizontal-process-flow",
        "feature-callout-pointer",
        "quadrant-matrix",
        "spectrum-continuum",
        "iceberg-model",
        "pros-cons-comparison",
      ]);

      // Check first element timing
      expect(graphicElements[0].timing.startFrame).toBe(0);
      expect(graphicElements[0].timing.durationInFrames).toBe(150); // 5s * 30fps
    });

    it("compiles all 8 explainer graphics into worker MasterBlueprint with EDL motion_graphics actions", () => {
      const project = createExplainerProject();
      const blueprint = timelineProjectToMasterBlueprint(project);

      expect(blueprint.id).toBe("proj-explainer-render");
      expect(blueprint.totalDuration).toBe(40.0);

      const mgEdits = blueprint.edits.filter((e) => e.action === "motion_graphics");
      expect(mgEdits).toHaveLength(8);

      mgEdits.forEach((edit) => {
        expect(edit.compositionId).toBeDefined();
        expect(edit.motion_graphics_type).toBe(edit.compositionId);
        expect(edit.props).toBeDefined();
        expect(edit.start).toBeLessThan(edit.end);
      });
    });

    it("performs lossless roundtrip between TimelineProject and Remotion SceneDefinition", () => {
      const project = createExplainerProject();
      const scene = timelineProjectToSceneDefinition(project);
      const restored = sceneDefinitionToTimelineProject(scene, {
        duration: project.duration,
        fps: project.fps,
        aspectRatio: project.aspectRatio,
      });

      expect(restored.tracks.graphicsTrack).toHaveLength(8);
      project.tracks.graphicsTrack.forEach((original) => {
        const matching = restored.tracks.graphicsTrack.find(
          (g) => g.compositionId === original.compositionId
        );
        expect(matching).toBeDefined();
        expect(matching?.start).toBeCloseTo(original.start, 2);
        expect(matching?.end).toBeCloseTo(original.end, 2);
        expect(matching?.props).toEqual(original.props);
      });
    });
  });
});




