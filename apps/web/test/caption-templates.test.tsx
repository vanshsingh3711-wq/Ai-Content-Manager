import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CAPTION_TEMPLATES,
  normalizeCaptionPreset,
  getCaptionTemplate,
} from "../lib/editor/caption-templates";
import { CaptionDragPayloadSchema } from "../lib/editor/drag-drop-types";
import { RESOURCE_CATALOG, createOperationFromResource } from "../lib/library/resource-registry";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { PlayerMonitor } from "../components/editor/PlayerMonitor";
import { InspectorPanel } from "../components/editor/InspectorPanel";
import { MediaDrawer } from "../components/editor/MediaDrawer";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { CaptionElement, TimelineProject } from "../lib/timeline-types";

describe("Caption Templates & Rendering Engine", () => {
  beforeEach(() => {
    // Reset timeline store to clean project state
    const cleanProject: TimelineProject = {
      id: "test-proj",
      name: "Test Project",
      duration: 30,
      aspectRatio: "9:16",
      tracks: {
        videoTrack: [
          {
            id: "vid-1",
            name: "Main Video",
            start: 0,
            end: 30,
            sourceStart: 0,
            sourceEnd: 30,
            sourceUrl: "blob:test",
          },
        ],
        audioTrack: [],
        brollTrack: [],
        captionTrack: [],
        textTrack: [],
        graphicsTrack: [],
        transitionTrack: [],
      },
    };
    useTimelineStore.setState({
      project: cleanProject,
      playheadTime: 1.0,
      isPlaying: false,
      selectedItem: null,
    });
  });

  describe("Template Catalog & Normalization", () => {
    it("defines 9 distinct caption templates including the 5 new viral presets", () => {
      expect(CAPTION_TEMPLATES).toHaveLength(9);

      const templateIds = CAPTION_TEMPLATES.map((t) => t.id);
      // Original 4
      expect(templateIds).toContain("tiktok_yellow");
      expect(templateIds).toContain("hormozi_bold");
      expect(templateIds).toContain("clean_white");
      expect(templateIds).toContain("neon_glow");

      // 5 New templates
      expect(templateIds).toContain("karaoke_gradient");
      expect(templateIds).toContain("boxed_pill");
      expect(templateIds).toContain("comic_pop");
      expect(templateIds).toContain("fire_gradient");
      expect(templateIds).toContain("minimal_boxed");

      // Verify all templates have non-empty required properties
      CAPTION_TEMPLATES.forEach((tmpl) => {
        expect(tmpl.name.length).toBeGreaterThan(0);
        expect(tmpl.badge.length).toBeGreaterThan(0);
        expect(tmpl.description.length).toBeGreaterThan(0);
        expect(tmpl.renderClass.length).toBeGreaterThan(0);
        expect(tmpl.previewClass.length).toBeGreaterThan(0);
      });
    });

    it("normalizes legacy aliases and variant casing properly", () => {
      expect(normalizeCaptionPreset("neon_cyber")).toBe("neon_glow");
      expect(normalizeCaptionPreset("modern_clean")).toBe("clean_white");
      expect(normalizeCaptionPreset("karaoke")).toBe("karaoke_gradient");
      expect(normalizeCaptionPreset("boxed")).toBe("boxed_pill");
      expect(normalizeCaptionPreset("pill")).toBe("boxed_pill");
      expect(normalizeCaptionPreset("comic")).toBe("comic_pop");
      expect(normalizeCaptionPreset("fire")).toBe("fire_gradient");
      expect(normalizeCaptionPreset("blaze")).toBe("fire_gradient");
      expect(normalizeCaptionPreset("podcast")).toBe("minimal_boxed");
    });

    it("falls back gracefully to tiktok_yellow on empty or unknown preset", () => {
      expect(normalizeCaptionPreset(null)).toBe("tiktok_yellow");
      expect(normalizeCaptionPreset(undefined)).toBe("tiktok_yellow");
      expect(normalizeCaptionPreset("")).toBe("tiktok_yellow");
      expect(normalizeCaptionPreset("non_existent_preset_xyz")).toBe("tiktok_yellow");

      const fallback = getCaptionTemplate("completely_random_unknown");
      expect(fallback.id).toBe("tiktok_yellow");
    });
  });

  describe("Drag and Drop Validation", () => {
    it("validates drag payloads for all 9 caption presets without error", () => {
      CAPTION_TEMPLATES.forEach((tmpl) => {
        const payload = {
          type: "caption",
          stylePreset: tmpl.id,
          text: `Sample for ${tmpl.name}`,
        };
        const parsed = CaptionDragPayloadSchema.safeParse(payload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.stylePreset).toBe(tmpl.id);
        }
      });
    });

    it("allows payload without explicit stylePreset to default safely", () => {
      const payload = {
        type: "caption",
        text: "Default Preset Caption",
      };
      const parsed = CaptionDragPayloadSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.stylePreset).toBe("tiktok_yellow");
      }
    });
  });

  describe("Resource Library Integration", () => {
    it("registers all 5 new caption presets in the RESOURCE_CATALOG", () => {
      const newPresetIds = [
        "cap-karaoke-gradient",
        "cap-boxed-pill",
        "cap-comic-pop",
        "cap-fire-gradient",
        "cap-minimal-boxed",
      ];

      newPresetIds.forEach((id) => {
        const res = RESOURCE_CATALOG.find((r) => r.id === id);
        expect(res).toBeDefined();
        expect(res?.type).toBe("caption_preset");
        expect(res?.targetTrack).toBe("caption");
      });
    });

    it("applies each new caption preset resource to timeline as an add_element operation", () => {
      const newPresetIds = [
        "cap-karaoke-gradient",
        "cap-boxed-pill",
        "cap-comic-pop",
        "cap-fire-gradient",
        "cap-minimal-boxed",
      ];

      newPresetIds.forEach((id) => {
        const res = RESOURCE_CATALOG.find((r) => r.id === id)!;
        const result = createOperationFromResource(res, { timestamp: 2.5, text: "Hook Phrase" });
        expect(result.success).toBe(true);
        expect(result.operation?.type).toBe("add_element");
        expect(result.operation?.track).toBe("caption");

        const el = (result.operation as any).element;
        expect(el.text).toBe("Hook Phrase");
        expect(el.start).toBe(2.5);
        expect(el.stylePreset).toBe(res.defaultProps?.stylePreset);
      });
    });
  });

  describe("Live Canvas Rendering in PlayerMonitor", () => {
    it("renders each of the 9 templates on the player canvas with test ID and text", () => {
      CAPTION_TEMPLATES.forEach((tmpl) => {
        const captionClip: CaptionElement = {
          id: `cap-${tmpl.id}`,
          text: `Testing ${tmpl.name}`,
          start: 0,
          end: 10,
          stylePreset: tmpl.id,
          position: { x: 50, y: 75 },
          positionX: 50,
          positionY: 75,
          scale: 1,
          rotation: 0,
        };

        useTimelineStore.setState((state) => ({
          project: {
            ...state.project,
            tracks: {
              ...state.project.tracks,
              textTrack: [captionClip],
            },
          },
          playheadTime: 2.0,
        }));

        const { unmount } = render(<PlayerMonitor />);
        const rendered = screen.getByTestId(`active-caption-rendered-${tmpl.id}`);
        expect(rendered).toBeInTheDocument();
        expect(rendered.textContent).toBe(`Testing ${tmpl.name}`);
        unmount();
      });
    });

    it("renders fallback template when stylePreset is missing or corrupted", () => {
      const corruptClip: CaptionElement = {
        id: "cap-corrupt",
        text: "Corrupt Preset Caption",
        start: 0,
        end: 10,
        // @ts-expect-error test invalid string
        stylePreset: "unknown_future_preset",
        position: { x: 50, y: 75 },
      };

      useTimelineStore.setState((state) => ({
        project: {
          ...state.project,
          tracks: {
            ...state.project.tracks,
            textTrack: [corruptClip],
          },
        },
        playheadTime: 2.0,
      }));

      const { unmount } = render(<PlayerMonitor />);
      const rendered = screen.getByTestId("active-caption-rendered-tiktok_yellow");
      expect(rendered).toBeInTheDocument();
      expect(rendered.textContent).toBe("Corrupt Preset Caption");
      unmount();
    });
  });

  describe("InspectorPanel Preset Selection", () => {
    it("displays all 9 templates in the Style Preset dropdown", () => {
      const captionClip: CaptionElement = {
        id: "cap-inspect-1",
        text: "Inspect Caption",
        start: 0,
        end: 10,
        stylePreset: "karaoke_gradient",
        position: { x: 50, y: 75 },
      };

      useTimelineStore.setState((state) => ({
        project: {
          ...state.project,
          tracks: {
            ...state.project.tracks,
            textTrack: [captionClip],
          },
        },
        selectedItem: { type: "caption", id: captionClip.id },
      }));

      render(<InspectorPanel />);

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.options.length).toBe(9);
      expect(select.value).toBe("karaoke_gradient");

      // Verify changing option updates store
      fireEvent.change(select, { target: { value: "boxed_pill" } });
      const updated = useTimelineStore.getState().project.tracks.textTrack[0];
      expect(updated.stylePreset).toBe("boxed_pill");
    });
  });

  describe("Natural Language Command Parsing", () => {
    it("parses commands for all new caption styles", () => {
      const context = {
        selectedItem: { type: "caption" as const, id: "cap-1" },
        project: useTimelineStore.getState().project,
        playheadTime: 1.0,
      };

      // 1. Karaoke Gradient
      const resKaraoke = parseLocalCommand("switch captions to karaoke gradient", context);
      expect(resKaraoke.matched).toBe(true);
      expect((resKaraoke.operation as any)?.properties?.stylePreset).toBe("karaoke_gradient");

      // 2. Boxed Pill
      const resBoxed = parseLocalCommand("apply boxed pill caption style", context);
      expect(resBoxed.matched).toBe(true);
      expect((resBoxed.operation as any)?.properties?.stylePreset).toBe("boxed_pill");

      // 3. Comic Pop
      const resComic = parseLocalCommand("style subtitles with comic pop", context);
      expect(resComic.matched).toBe(true);
      expect((resComic.operation as any)?.properties?.stylePreset).toBe("comic_pop");

      // 4. Fire Blaze
      const resFire = parseLocalCommand("change caption style to fire blaze", context);
      expect(resFire.matched).toBe(true);
      expect((resFire.operation as any)?.properties?.stylePreset).toBe("fire_gradient");

      // 5. Minimal Boxed
      const resMinimal = parseLocalCommand("set captions to minimal boxed style", context);
      expect(resMinimal.matched).toBe(true);
      expect((resMinimal.operation as any)?.properties?.stylePreset).toBe("minimal_boxed");
    });
  });

  describe("MediaDrawer Caption Preset Application", () => {
    it("applies caption style preset directly to existing text without adding a new caption element", () => {
      const existingClip: CaptionElement = {
        id: "cap-existing-md",
        text: "Voiceover script speech",
        start: 0,
        end: 5,
        stylePreset: "clean_white",
      };

      useTimelineStore.setState((state) => ({
        project: {
          ...state.project,
          tracks: {
            ...state.project.tracks,
            textTrack: [existingClip],
          },
        },
        selectedItem: null,
      }));

      const { unmount } = render(<MediaDrawer activeTab="captions" />);

      // Find Hormozi Bold preset card in Tab 2
      const hormoziCard = screen.getByTestId("caption-preset-hormozi_bold");
      expect(hormoziCard).toBeDefined();

      fireEvent.click(hormoziCard);

      const textTrack = useTimelineStore.getState().project.tracks.textTrack;
      // Timeline caption count does NOT increase!
      expect(textTrack.length).toBe(1);
      // The existing text gets the caption effect!
      expect(textTrack[0].text).toBe("Voiceover script speech");
      expect(textTrack[0].stylePreset).toBe("hormozi_bold");

      unmount();
    });
  });
});
