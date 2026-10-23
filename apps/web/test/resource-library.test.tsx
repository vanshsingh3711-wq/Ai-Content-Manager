import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import {
  RESOURCE_CATALOG,
  getAllResources,
  getResourceById,
  getResourcesByType,
  searchResources,
  validateResource,
  createOperationFromResource,
} from "../lib/library/resource-registry";
import { LibraryResource } from "../lib/library/resource-types";
import { ResourceLibraryDrawer } from "../components/editor/ResourceLibraryDrawer";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { executeOperation, createInverseOperation } from "../lib/operations/operation-executor";
import { TimelineProject } from "../lib/timeline-types";

describe("Shared Asset Resource Library Foundation & First Working Packs", () => {
  const mockBaseProject: TimelineProject = {
    id: "proj-resource-test",
    title: "Resource Test Project",
    aspectRatio: "9:16",
    duration: 15.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "clip-1",
          sourceUrl: "https://example.com/clip1.mp4",
          name: "Main Scene 1",
          start: 0,
          end: 6.0,
          sourceStart: 0,
          sourceEnd: 6.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
        },
        {
          id: "clip-2",
          sourceUrl: "https://example.com/clip2.mp4",
          name: "Main Scene 2",
          start: 6.0,
          end: 15.0,
          sourceStart: 0,
          sourceEnd: 9.0,
          speed: 1.0,
          volume: 100,
          zoomFactor: 1.0,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [],
    },
    transitions: [],
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(mockBaseProject);
    useTimelineStore.getState().setPlayheadTime(3.0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Resource Catalog Integrity & Schema Validation", () => {
    it("ensures all registered resources have valid schemas and unique stable IDs", () => {
      const all = getAllResources();
      expect(all.length).toBeGreaterThanOrEqual(15);

      const idSet = new Set<string>();
      all.forEach((res) => {
        expect(() => validateResource(res)).not.toThrow();
        expect(idSet.has(res.id)).toBe(false);
        idSet.add(res.id);

        expect(res.name).toBeTruthy();
        expect(res.category).toBeTruthy();
        expect(res.defaultDuration).toBeGreaterThan(0);
        expect(Array.isArray(res.tags)).toBe(true);
        expect(res.tags.length).toBeGreaterThan(0);
      });
    });

    it("verifies Pack A: Shapes definitions", () => {
      const shapes = getResourcesByType("shape");
      const shapeIds = shapes.map((s) => s.id);

      expect(shapeIds).toContain("shape-rectangle");
      expect(shapeIds).toContain("shape-rounded-rect");
      expect(shapeIds).toContain("shape-circle");
      expect(shapeIds).toContain("shape-line");
      expect(shapeIds).toContain("shape-arrow");
      expect(shapeIds).toContain("shape-speech-bubble");
      expect(shapeIds).toContain("shape-divider");

      const rect = getResourceById("shape-rectangle")!;
      expect(rect.targetTrack).toBe("graphic");
      expect(rect.defaultProps.shapeType).toBe("rectangle");
      expect(rect.parameters.some((p) => p.name === "fillColor")).toBe(true);
    });

    it("verifies Pack B: Caption templates definitions", () => {
      const captions = getResourcesByType("caption_preset");
      const captionIds = captions.map((c) => c.id);

      expect(captionIds).toContain("cap-tiktok-yellow");
      expect(captionIds).toContain("cap-hormozi-bold");
      expect(captionIds).toContain("cap-clean-white");
      expect(captionIds).toContain("cap-neon-glow");

      const tiktokCap = getResourceById("cap-tiktok-yellow")!;
      expect(tiktokCap.targetTrack).toBe("caption");
      expect(tiktokCap.defaultProps.stylePreset).toBe("tiktok_yellow");
    });

    it("verifies Pack C: Transition presets definitions", () => {
      const transitions = getResourcesByType("transition");
      const transitionIds = transitions.map((t) => t.id);

      expect(transitionIds).toContain("trans-crossfade");
      expect(transitionIds).toContain("trans-fade-to-black");
      expect(transitionIds).toContain("trans-wipe-left");
      expect(transitionIds).toContain("trans-wipe-right");
      expect(transitionIds).toContain("trans-slide-up");
      expect(transitionIds).toContain("trans-zoom-in");

      const crossfade = getResourceById("trans-crossfade")!;
      expect(crossfade.targetTrack).toBe("transition");
      expect(crossfade.defaultProps.preset).toBe("crossfade");
    });

    it("verifies Pack G: Visual Effects definitions and all 25 effects", () => {
      const effects = getResourcesByType("effect");
      expect(effects.length).toBe(25);

      const effectIds = effects.map((e) => e.id);
      // Original 5
      expect(effectIds).toContain("fx-rgb-glitch");
      expect(effectIds).toContain("fx-cinematic-teal-orange");
      expect(effectIds).toContain("fx-vhs-scanlines");
      expect(effectIds).toContain("fx-cyberpunk-neon");
      expect(effectIds).toContain("fx-bw-noir");
      // Wave 2 (10 effects)
      expect(effectIds).toContain("fx-cinematic-vignette");
      expect(effectIds).toContain("fx-golden-hour-glow");
      expect(effectIds).toContain("fx-anamorphic-lens-flare");
      expect(effectIds).toContain("fx-8mm-vintage-film");
      expect(effectIds).toContain("fx-strobe-flash-burst");
      expect(effectIds).toContain("fx-radial-zoom-blur");
      expect(effectIds).toContain("fx-crt-arcade-retro");
      expect(effectIds).toContain("fx-halftone-comic-pop");
      expect(effectIds).toContain("fx-prism-bokeh-rainbow");
      expect(effectIds).toContain("fx-night-vision-tactical");
      // Wave 3 (10 new effects)
      expect(effectIds).toContain("fx-film-grain-cinematic");
      expect(effectIds).toContain("fx-duotone-cyber");
      expect(effectIds).toContain("fx-thermal-heatmap");
      expect(effectIds).toContain("fx-dreamy-glow-diffusion");
      expect(effectIds).toContain("fx-color-party-strobe");
      expect(effectIds).toContain("fx-fisheye-chromatic");
      expect(effectIds).toContain("fx-cinematic-letterbox");
      expect(effectIds).toContain("fx-camera-shake-quake");
      expect(effectIds).toContain("fx-kaleidoscope-quad");
      expect(effectIds).toContain("fx-solarize-xray");

      const filmGrain = getResourceById("fx-film-grain-cinematic")!;
      expect(filmGrain.targetTrack).toBe("graphic");
      expect(filmGrain.defaultProps.effectType).toBe("film_grain");
      expect(filmGrain.defaultProps.grainDensity).toBe(80);

      const letterbox = getResourceById("fx-cinematic-letterbox")!;
      expect(letterbox.defaultProps.effectType).toBe("cinematic_letterbox");
      expect(letterbox.defaultProps.barHeight).toBe(12);
    });
  });

  describe("2. Search and Filtering", () => {
    it("filters resources by query string across name, category, and tags", () => {
      const arrowSearch = searchResources("arrow");
      expect(arrowSearch.some((r) => r.id === "shape-arrow")).toBe(true);

      const sfxSearch = searchResources("whoosh");
      expect(sfxSearch.some((r) => r.id === "sfx-whoosh")).toBe(true);

      const captionSearch = searchResources("viral");
      expect(captionSearch.some((r) => r.id === "cap-tiktok-yellow")).toBe(true);
    });

    it("filters resources by category", () => {
      const shapesOnly = searchResources("", { category: "Shapes" });
      expect(shapesOnly.every((r) => r.category === "Shapes")).toBe(true);
      expect(shapesOnly.length).toBeGreaterThanOrEqual(7);

      const transitionsOnly = searchResources("", { category: "Transitions" });
      expect(transitionsOnly.every((r) => r.category === "Transitions")).toBe(true);
      expect(transitionsOnly.length).toBeGreaterThanOrEqual(6);
    });

    it("filters B-Roll resources by aspect ratio (exactly 10 vertical 9:16 and 10 horizontal 16:9)", () => {
      const verticalBroll = searchResources("", { category: "B-Roll Stock", aspectRatio: "9:16" });
      expect(verticalBroll.length).toBe(10);
      expect(verticalBroll.every((b) => b.aspectRatio === "9:16")).toBe(true);
      const verticalIds = verticalBroll.map((b) => b.id);
      expect(verticalIds).toContain("broll-v-city-street");
      expect(verticalIds).toContain("broll-v-laptop-typing");
      expect(verticalIds).toContain("broll-v-coffee-cafe");
      expect(verticalIds).toContain("broll-v-phone-scroll");
      expect(verticalIds).toContain("broll-v-podcast-mic");
      expect(verticalIds).toContain("broll-v-fitness-workout");
      expect(verticalIds).toContain("broll-v-forest-sunlight");
      expect(verticalIds).toContain("broll-v-business-meeting");
      expect(verticalIds).toContain("broll-v-modern-architecture");
      expect(verticalIds).toContain("broll-v-neon-abstract");

      const landscapeBroll = searchResources("", { category: "B-Roll Stock", aspectRatio: "16:9" });
      expect(landscapeBroll.length).toBe(10);
      expect(landscapeBroll.every((b) => b.aspectRatio === "16:9")).toBe(true);
      const landscapeIds = landscapeBroll.map((b) => b.id);
      expect(landscapeIds).toContain("broll-cyberpunk-city");
      expect(landscapeIds).toContain("broll-coding-screen");
      expect(landscapeIds).toContain("broll-mountain-aerial");
      expect(landscapeIds).toContain("broll-h-creative-collaboration");
      expect(landscapeIds).toContain("broll-h-highway-timelapse");
      expect(landscapeIds).toContain("broll-h-stock-trading");
      expect(landscapeIds).toContain("broll-h-ocean-sunset");
      expect(landscapeIds).toContain("broll-h-coffee-pour");
      expect(landscapeIds).toContain("broll-h-server-datacenter");
      expect(landscapeIds).toContain("broll-h-cloudscape-timelapse");
    });

    it("filters B-Roll resources by subCategory theme", () => {
      const techBroll = searchResources("", { category: "B-Roll Stock", subCategory: "Tech" });
      expect(techBroll.length).toBeGreaterThanOrEqual(3);
      expect(techBroll.every((b) => b.subCategory === "Tech")).toBe(true);

      const urbanBroll = searchResources("", { category: "B-Roll Stock", subCategory: "Urban" });
      expect(urbanBroll.length).toBeGreaterThanOrEqual(3);
      expect(urbanBroll.every((b) => b.subCategory === "Urban")).toBe(true);
    });

    it("sorts resources by name and duration", () => {
      const sortedByName = searchResources("", { category: "B-Roll Stock", sortBy: "name" });
      for (let i = 0; i < sortedByName.length - 1; i++) {
        expect(sortedByName[i].name.localeCompare(sortedByName[i + 1].name)).toBeLessThanOrEqual(0);
      }

      const sortedByDurationAsc = searchResources("", { sortBy: "duration_asc" });
      for (let i = 0; i < sortedByDurationAsc.length - 1; i++) {
        expect(sortedByDurationAsc[i].defaultDuration).toBeLessThanOrEqual(sortedByDurationAsc[i + 1].defaultDuration);
      }
    });
  });

  describe("3. Operational Mapping & Undo/Redo Reversibility", () => {
    it("creates an add_element operation for shape and verifies inverse undo", () => {
      const rectResource = getResourceById("shape-rectangle")!;
      const result = createOperationFromResource(rectResource, {
        timestamp: 2.0,
        duration: 4.0,
        customProps: {
          fillColor: "#ff0055",
          strokeWidth: 4,
        },
      });

      expect(result.success).toBe(true);
      const op = result.operation!;
      expect(op.type).toBe("add_element");
      if (op.type === "add_element") {
        expect(op.track).toBe("graphic");
        expect(op.element.compositionId).toBe("shape");
        expect(op.element.props.fillColor).toBe("#ff0055");
        expect(op.element.start).toBe(2.0);
        expect(op.element.end).toBe(6.0);
      }

      // Execute on project
      const { nextProject } = executeOperation(mockBaseProject, op);
      expect(nextProject.tracks.graphicsTrack?.length).toBe(1);
      expect(nextProject.tracks.graphicsTrack![0].props.fillColor).toBe("#ff0055");

      // Verify deterministic inverse
      const inverse = createInverseOperation(nextProject, op);
      expect(inverse.type).toBe("delete_element");
      const reverted = executeOperation(nextProject, inverse).nextProject;
      expect(reverted.tracks.graphicsTrack?.length).toBe(0);
    });

    it("creates an add_element operation for caption preset", () => {
      const capResource = getResourceById("cap-hormozi-bold")!;
      const result = createOperationFromResource(capResource, {
        timestamp: 1.5,
        duration: 3.0,
        text: "SCALE WITH HORMOZI",
      });

      expect(result.success).toBe(true);
      const op = result.operation!;
      expect(op.type).toBe("add_element");
      if (op.type === "add_element") {
        expect(op.track).toBe("caption");
        expect(op.element.stylePreset).toBe("hormozi_bold");
        expect(op.element.text).toBe("SCALE WITH HORMOZI");
      }

      const { nextProject } = executeOperation(mockBaseProject, op);
      expect(nextProject.tracks.textTrack.length).toBe(1);
      expect(nextProject.tracks.textTrack[0].text).toBe("SCALE WITH HORMOZI");
    });

    it("creates an update_properties operation when applying caption preset to existing target caption", () => {
      const neonCap = getResourceById("cap-neon-glow")!;
      const existingCaption = {
        id: "cap-existing-1",
        text: "Active voiceover phrase",
        start: 1.0,
        end: 4.0,
        stylePreset: "clean_white" as const,
      };

      const result = createOperationFromResource(neonCap, {
        timestamp: 1.0,
        targetCaptionId: "cap-existing-1",
        existingCaptions: [existingCaption],
      });

      expect(result.success).toBe(true);
      const op = result.operation!;
      // Must be update_properties, NOT add_element
      expect(op.type).toBe("update_properties");
      if (op.type === "update_properties") {
        expect(op.targetType).toBe("caption");
        expect(op.targetId).toBe("cap-existing-1");
        expect(op.properties.stylePreset).toBe("neon_glow");
      }

      const projectWithCaption = {
        ...mockBaseProject,
        tracks: {
          ...mockBaseProject.tracks,
          textTrack: [existingCaption],
        },
      };

      const { nextProject } = executeOperation(projectWithCaption, op);
      // Timeline caption count does NOT increase!
      expect(nextProject.tracks.textTrack.length).toBe(1);
      // The text gets the caption effect!
      expect(nextProject.tracks.textTrack[0].text).toBe("Active voiceover phrase");
      expect(nextProject.tracks.textTrack[0].stylePreset).toBe("neon_glow");
    });

    it("creates a batch update_properties operation when applying caption preset across multiple existing captions without adding new timeline clips", () => {
      const karaokeCap = getResourceById("cap-karaoke-gradient")!;
      const existingCaptions = [
        { id: "c1", text: "First subtitle", start: 0, end: 2, stylePreset: "clean_white" as const },
        { id: "c2", text: "Second subtitle", start: 2, end: 4, stylePreset: "clean_white" as const },
      ];

      const result = createOperationFromResource(karaokeCap, {
        timestamp: 0,
        existingCaptions,
      });

      expect(result.success).toBe(true);
      const op = result.operation!;
      expect(op.type).toBe("batch");
      if (op.type === "batch") {
        expect(op.operations.length).toBe(2);
        expect(op.operations[0].type).toBe("update_properties");
        expect(op.operations[1].type).toBe("update_properties");
      }

      const projectWithCaptions = {
        ...mockBaseProject,
        tracks: {
          ...mockBaseProject.tracks,
          textTrack: existingCaptions,
        },
      };

      const { nextProject } = executeOperation(projectWithCaptions, op);
      expect(nextProject.tracks.textTrack.length).toBe(2);
      expect(nextProject.tracks.textTrack[0].stylePreset).toBe("karaoke_gradient");
      expect(nextProject.tracks.textTrack[1].stylePreset).toBe("karaoke_gradient");
    });

    it("creates an add_transition operation between selected adjacent clips", () => {
      const transResource = getResourceById("trans-crossfade")!;
      const result = createOperationFromResource(transResource, {
        timestamp: 6.0,
        duration: 0.5,
        targetClipAId: "clip-1",
        targetClipBId: "clip-2",
      });

      expect(result.success).toBe(true);
      const op = result.operation!;
      expect(op.type).toBe("add_transition");
      if (op.type === "add_transition") {
        expect(op.preset).toBe("crossfade");
        expect(op.fromClipId).toBe("clip-1");
        expect(op.toClipId).toBe("clip-2");
        expect(op.duration).toBe(0.5);
      }

      const { nextProject } = executeOperation(mockBaseProject, op);
      expect(nextProject.transitions?.length).toBe(1);
      expect(nextProject.transitions![0].preset).toBe("crossfade");

      const inverse = createInverseOperation(nextProject, op);
      const reverted = executeOperation(nextProject, inverse).nextProject;
      expect(reverted.transitions?.length).toBe(0);
    });

    it("gracefully rejects transition application if adjacent clips are missing", () => {
      const transResource = getResourceById("trans-crossfade")!;
      const result = createOperationFromResource(transResource, {
        timestamp: 6.0,
        // no target clips provided
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("requires selecting two adjacent clips");
    });

    it("gracefully rejects unsupported/expansion resource entries", () => {
      const fakeUnsupported: LibraryResource = {
        id: "unsupported-3d-model",
        type: "effect",
        name: "Experimental 3D Mesh",
        description: "Future expansion item",
        category: "Visual Effects",
        tags: ["3d", "mesh"],
        isSupported: false,
        version: "2.0.0",
        targetTrack: "graphic",
        defaultDuration: 3.0,
        parameters: [],
        defaultProps: {},
      };

      const result = createOperationFromResource(fakeUnsupported, { timestamp: 0 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("expansion entry and not yet supported");
    });
  });

  describe("4. ResourceLibraryDrawer Component UI & Store Integration", () => {
    it("renders categories, search input, and resource cards", () => {
      render(<ResourceLibraryDrawer />);

      expect(screen.getByText("Resource Library")).toBeDefined();
      expect(screen.getByPlaceholderText(/Search shapes, captions, SFX/i)).toBeDefined();

      // Check category buttons
      expect(screen.getByText("All Packs")).toBeDefined();
      expect(screen.getAllByText("Shapes").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Captions").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Transitions").length).toBeGreaterThan(0);

      // Check resource presence
      expect(screen.getByText("Solid Rectangle")).toBeDefined();
      expect(screen.getByText("TikTok Yellow")).toBeDefined();
      expect(screen.getByText("Crossfade Dissolve")).toBeDefined();
    });

    it("filters resources interactively by typing in search bar", async () => {
      render(<ResourceLibraryDrawer />);

      const searchInput = screen.getByPlaceholderText(/Search shapes, captions, SFX/i);
      fireEvent.change(searchInput, { target: { value: "speech bubble" } });

      await waitFor(() => {
        expect(screen.getByText("Speech Bubble")).toBeDefined();
        expect(screen.queryByText("TikTok Yellow")).toBeNull();
      });
    });

    it("inserts a shape into the timeline via 1-click Add button", async () => {
      render(<ResourceLibraryDrawer />);

      const rectCard = screen.getByTestId("library-resource-card-shape-rectangle");
      const addBtn = rectCard.querySelector("button[title='Insert at Playhead']")!;
      fireEvent.click(addBtn);

      await waitFor(() => {
        const storeProject = useTimelineStore.getState().project;
        expect(storeProject.tracks.graphicsTrack?.length).toBe(1);
        const inserted = storeProject.tracks.graphicsTrack![0];
        expect(inserted.name).toBe("Solid Rectangle");
        expect(inserted.compositionId).toBe("shape");
        expect(inserted.start).toBe(3.0); // inserted at playhead time
      });
    });

    it("verifies Pack G: Visual Effects can be filtered and applied", async () => {
      render(<ResourceLibraryDrawer />);

      // Switch category to Effects
      const effectsTab = screen.getByText("Effects");
      fireEvent.click(effectsTab);

      await waitFor(() => {
        expect(screen.getByText("RGB Glitch Split")).toBeDefined();
        expect(screen.getByText("Teal & Orange Grade")).toBeDefined();
        expect(screen.getByText("Cinematic Vignette")).toBeDefined();
        expect(screen.getByText("Golden Hour Glow")).toBeDefined();
        expect(screen.getByText("Tactical Night Vision")).toBeDefined();
        expect(screen.getByText("35mm Motion Film Grain")).toBeDefined();
        expect(screen.getByText("2.39:1 Anamorphic Letterbox")).toBeDefined();
        expect(screen.getByText("Duotone Cyber Ultraviolet")).toBeDefined();
      });

      const vignetteCard = screen.getByTestId("library-resource-card-fx-cinematic-vignette");
      const addVignetteBtn = vignetteCard.querySelector("button[title='Insert at Playhead']")!;
      fireEvent.click(addVignetteBtn);

      await waitFor(() => {
        const storeProject = useTimelineStore.getState().project;
        const inserted = storeProject.tracks.graphicsTrack?.find((g) => g.name === "Cinematic Vignette");
        expect(inserted).toBeDefined();
        expect(inserted?.compositionId).toBe("effect_overlay");
        expect(inserted?.props.effectType).toBe("vignette");
      });

      const letterboxCard = screen.getByTestId("library-resource-card-fx-cinematic-letterbox");
      const addLetterboxBtn = letterboxCard.querySelector("button[title='Insert at Playhead']")!;
      fireEvent.click(addLetterboxBtn);

      await waitFor(() => {
        const storeProject = useTimelineStore.getState().project;
        const inserted = storeProject.tracks.graphicsTrack?.find((g) => g.name === "2.39:1 Anamorphic Letterbox");
        expect(inserted).toBeDefined();
        expect(inserted?.compositionId).toBe("effect_overlay");
        expect(inserted?.props.effectType).toBe("cinematic_letterbox");
      });
    });

    it("verifies Pack F: B-Roll footage can be filtered and applied", async () => {
      render(<ResourceLibraryDrawer />);

      // Switch category to B-Roll
      const brollTab = screen.getByText("B-Roll");
      fireEvent.click(brollTab);

      await waitFor(() => {
        expect(screen.getByText("Cyberpunk City Lights")).toBeDefined();
        expect(screen.getByText("Developer Coding Screen")).toBeDefined();
      });

      const brollCard = screen.getByTestId("library-resource-card-broll-cyberpunk-city");
      const addBtn = brollCard.querySelector("button[title='Insert at Playhead']")!;
      fireEvent.click(addBtn);

      await waitFor(() => {
        const storeProject = useTimelineStore.getState().project;
        expect(storeProject.tracks.brollTrack.length).toBe(1);
        expect(storeProject.tracks.brollTrack[0].name).toBe("Cyberpunk City Lights");
      });
    });

    it("filters B-Roll resources in UI by aspect ratio (9:16 and 16:9)", async () => {
      render(<ResourceLibraryDrawer initialCategory="B-Roll Stock" />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-aspect-9:16")).toBeDefined();
        expect(screen.getByTestId("filter-aspect-16:9")).toBeDefined();
      });

      // Click 9:16 vertical filter
      fireEvent.click(screen.getByTestId("filter-aspect-9:16"));

      await waitFor(() => {
        expect(screen.getByText("Urban City Walk")).toBeDefined();
        expect(screen.getByText("Laptop Coding & Typing")).toBeDefined();
        // 16:9 clips should be filtered out
        expect(screen.queryByText("Cyberpunk City Lights")).toBeNull();
        expect(screen.queryByText("Mountain Drone Aerial")).toBeNull();
      });

      // Click 16:9 landscape filter
      fireEvent.click(screen.getByTestId("filter-aspect-16:9"));

      await waitFor(() => {
        expect(screen.getByText("Cyberpunk City Lights")).toBeDefined();
        expect(screen.getByText("Mountain Drone Aerial")).toBeDefined();
        // 9:16 clips should be filtered out
        expect(screen.queryByText("Urban City Walk")).toBeNull();
      });

      // Click Reset Filters
      const resetBtn = screen.getByTestId("reset-filters-btn");
      fireEvent.click(resetBtn);

      await waitFor(() => {
        // Both vertical and landscape are visible again
        expect(screen.getByText("Urban City Walk")).toBeDefined();
        expect(screen.getByText("Cyberpunk City Lights")).toBeDefined();
      });
    });

    it("filters B-Roll resources in UI by theme chips and allows sorting", async () => {
      render(<ResourceLibraryDrawer initialCategory="B-Roll Stock" />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-theme-tech")).toBeDefined();
      });

      // Click Tech theme filter
      fireEvent.click(screen.getByTestId("filter-theme-tech"));

      await waitFor(() => {
        expect(screen.getByText("Developer Coding Screen")).toBeDefined();
        expect(screen.getByText("Cloud Data Center Servers")).toBeDefined();
        // Nature should be hidden
        expect(screen.queryByText("Mountain Drone Aerial")).toBeNull();
      });

      // Change sort order to Name (A-Z)
      const sortSelect = screen.getByTestId("resource-sort-select");
      fireEvent.change(sortSelect, { target: { value: "name" } });

      await waitFor(() => {
        expect(screen.getByText("Cloud Data Center Servers")).toBeDefined();
      });
    });

    it("plays pure visual previews without overlay text and without cluttered explanation guides", async () => {
      render(<ResourceLibraryDrawer />);

      const rectCard = screen.getByTestId("library-resource-card-shape-rectangle");
      const brollCard = screen.getByTestId("library-resource-card-broll-cyberpunk-city");

      // Verify no cluttered text badges like "REC 4K" or "Stock Footage" on preview
      expect(brollCard.textContent).not.toContain("REC 4K");
      expect(brollCard.textContent).not.toContain("Stock Footage");

      // Verify no cluttered explanation guides on card
      expect(rectCard.textContent).not.toContain("Best for:");
      expect(rectCard.textContent).not.toContain("Made for:");
      expect(rectCard.textContent).not.toContain("Where to use:");

      // Trigger mouse enter
      fireEvent.mouseEnter(rectCard);

      await waitFor(() => {
        // No unwanted text badges like "PLAYING" on the preview
        expect(rectCard.textContent).not.toContain("PLAYING");
        expect(rectCard.textContent).not.toContain("Where to use:");
      });

      // Trigger mouse leave
      fireEvent.mouseLeave(rectCard);

      await waitFor(() => {
        expect(rectCard.textContent).not.toContain("Best for:");
      });
    });

    it("applies caption effect to existing text in timeline rather than adding a new caption element", async () => {
      // Set existing caption in timeline store
      useTimelineStore.setState({
        project: {
          ...mockBaseProject,
          tracks: {
            ...mockBaseProject.tracks,
            textTrack: [
              {
                id: "cap-101",
                text: "Original Subtitle Text",
                start: 0,
                end: 3.5,
                stylePreset: "clean_white",
              },
            ],
          },
        },
        selectedItem: null,
      });

      render(<ResourceLibraryDrawer initialCategory="Captions" />);

      // Find the TikTok Yellow caption preset card
      const tiktokCard = screen.getByTestId("library-resource-card-cap-tiktok-yellow");
      expect(tiktokCard).toBeDefined();

      // Find the Apply button on the card
      const applyBtn = within(tiktokCard).getByTitle("Apply caption effect to text");
      expect(applyBtn.textContent).toContain("Apply Style");

      fireEvent.click(applyBtn);

      await waitFor(() => {
        const textTrack = useTimelineStore.getState().project.tracks.textTrack;
        // MUST NOT add a new caption element to the timeline! Still 1 caption
        expect(textTrack.length).toBe(1);
        // The text must get the caption style effect!
        expect(textTrack[0].id).toBe("cap-101");
        expect(textTrack[0].text).toBe("Original Subtitle Text");
        expect(textTrack[0].stylePreset).toBe("tiktok_yellow");
      });
    });

    it("renders Finance category tab and displays all 10 finance motion graphic cards", () => {
      render(<ResourceLibraryDrawer initialCategory="Finance" />);

      expect(screen.getByTestId("library-resource-card-mg-candlestick-hud")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-compound-growth-curve")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-portfolio-donut")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-inflation-cash-burn")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-banking-notification")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-budget-waterfall")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-debt-payoff-tracker")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-roi-balance-scale")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-wealth-flywheel")).toBeDefined();
      expect(screen.getByTestId("library-resource-card-mg-battle-chart")).toBeDefined();
    });

    it("adds a finance motion graphic to timeline graphicsTrack on Add button click", async () => {
      render(<ResourceLibraryDrawer initialCategory="Finance" />);

      const candleCard = screen.getByTestId("library-resource-card-mg-candlestick-hud");
      const addBtn = within(candleCard).getByTitle("Insert at Playhead");

      fireEvent.click(addBtn);

      await waitFor(() => {
        const graphics = useTimelineStore.getState().project.tracks.graphicsTrack;
        expect(graphics.length).toBe(1);
        expect(graphics[0].compositionId).toBe("candlestick-hud");
        expect(graphics[0].props?.symbol).toBe("BTC / USD");
        expect(graphics[0].start).toBe(3.0);
        expect(graphics[0].end).toBe(8.0);
      });
    });
  });

  describe("5. Pack Finance: Registry & Operations Verification", () => {
    const expectedFinanceIds = [
      "mg-candlestick-hud",
      "mg-compound-growth-curve",
      "mg-portfolio-donut",
      "mg-inflation-cash-burn",
      "mg-banking-notification",
      "mg-budget-waterfall",
      "mg-debt-payoff-tracker",
      "mg-roi-balance-scale",
      "mg-wealth-flywheel",
      "mg-battle-chart",
    ];

    it("ensures all 10 finance resources exist in RESOURCE_CATALOG and validate cleanly", () => {
      expectedFinanceIds.forEach((id) => {
        const res = getResourceById(id);
        expect(res).toBeDefined();
        expect(res?.category).toBe("Finance");
        expect(res?.type).toBe("motion_graphic");
        expect(res?.targetTrack).toBe("graphic");
        expect(res?.defaultDuration).toBe(5.0);
        expect(() => validateResource(res!)).not.toThrow();
      });
    });

    it("filters finance resources via searchResources category and tags", () => {
      const financeOnly = searchResources("", { category: "Finance" });
      expect(financeOnly.length).toBe(10);
      expect(financeOnly.every((r) => r.category === "Finance")).toBe(true);

      const cryptoSearch = searchResources("crypto");
      expect(cryptoSearch.some((r) => r.id === "mg-candlestick-hud")).toBe(true);

      const dalioSearch = searchResources("dalio");
      expect(dalioSearch.some((r) => r.id === "mg-portfolio-donut")).toBe(true);

      const buffettSearch = searchResources("buffett");
      expect(buffettSearch.some((r) => r.id === "mg-battle-chart")).toBe(true);
    });

    it("creates valid add_element edit operations for finance graphics", () => {
      const res = getResourceById("mg-compound-growth-curve")!;
      const result = createOperationFromResource(res, {
        timestamp: 4.5,
        targetTrack: "graphic",
      });

      expect(result.success).toBe(true);
      expect(result.operation?.type).toBe("add_element");

      if (result.operation && result.operation.type === "add_element") {
        expect(result.operation.track).toBe("graphic");
        expect(result.operation.element.compositionId).toBe("compound-growth-curve");
        expect(result.operation.element.start).toBe(4.5);
        expect(result.operation.element.end).toBe(9.5);
        expect((result.operation.element.props as any).title).toBe("THE EXPONENTIAL SNOWBALL EFFECT");
      }
    });
  });
});
