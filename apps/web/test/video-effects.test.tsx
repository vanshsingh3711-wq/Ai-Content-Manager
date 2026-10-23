import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  getVideoEffectStyle,
  isEffectGraphic,
  EFFECT_PRESETS,
  EFFECT_CATEGORIES,
} from "../lib/editor/video-effects";
import { GraphicElement, TimelineProject } from "../lib/timeline-types";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { PlayerMonitor } from "../components/editor/PlayerMonitor";
import { InspectorPanel } from "../components/editor/InspectorPanel";

describe("Video Effects & Shader Styling Engine", () => {
  it("contains all 25 effect presets categorized correctly", () => {
    expect(EFFECT_PRESETS.length).toBe(25);
    expect(EFFECT_CATEGORIES).toHaveLength(5);

    const categories = new Set(EFFECT_PRESETS.map((p) => p.category));
    EFFECT_CATEGORIES.forEach((cat) => {
      expect(categories.has(cat)).toBe(true);
    });
  });

  it("identifies visual effect graphic elements reliably", () => {
    const fx1: GraphicElement = {
      id: "fx-1",
      name: "Glitch",
      compositionId: "effect_overlay",
      start: 0,
      end: 5,
    };
    const fx2: GraphicElement = {
      id: "fx-2",
      name: "Retro",
      compositionId: "effect-overlay",
      start: 0,
      end: 5,
    };
    const fx3: GraphicElement = {
      id: "fx-3",
      name: "Neon",
      compositionId: "fx-cyberpunk",
      start: 0,
      end: 5,
    };
    const fx4: GraphicElement = {
      id: "fx-4",
      name: "Custom FX",
      compositionId: "custom",
      props: { effectType: "bw_noir" },
      start: 0,
      end: 5,
    };
    const standardGraphic: GraphicElement = {
      id: "g-1",
      name: "Growth Chart",
      compositionId: "chart-reveal",
      start: 0,
      end: 5,
    };

    expect(isEffectGraphic(fx1)).toBe(true);
    expect(isEffectGraphic(fx2)).toBe(true);
    expect(isEffectGraphic(fx3)).toBe(true);
    expect(isEffectGraphic(fx4)).toBe(true);
    expect(isEffectGraphic(standardGraphic)).toBe(false);
    expect(isEffectGraphic(null)).toBe(false);
  });

  it("returns empty style object when effect is null or factor is 0", () => {
    expect(getVideoEffectStyle(null, 1.0)).toEqual({});
    
    const zeroIntensityFx: GraphicElement = {
      id: "fx-zero",
      name: "Zero FX",
      compositionId: "effect_overlay",
      props: { effectType: "rgb_glitch", intensity: 0 },
      start: 0,
      end: 5,
    };
    expect(getVideoEffectStyle(zeroIntensityFx, 1.0)).toEqual({});

    const zeroOpacityFx: GraphicElement = {
      id: "fx-zero-op",
      name: "Zero Opacity FX",
      compositionId: "effect_overlay",
      opacity: 0,
      props: { effectType: "teal_orange", intensity: 80 },
      start: 0,
      end: 5,
    };
    expect(getVideoEffectStyle(zeroOpacityFx, 1.0)).toEqual({});
  });

  it("computes chromatic split and jitter for rgb_glitch", () => {
    const glitchFx: GraphicElement = {
      id: "fx-glitch",
      name: "RGB Glitch",
      compositionId: "effect_overlay",
      props: { effectType: "rgb_glitch", intensity: 80 },
      start: 1.0,
      end: 4.0,
    };

    const style = getVideoEffectStyle(glitchFx, 2.0);
    expect(style.filter).toContain("drop-shadow");
    expect(style.filter).toContain("rgba(0,255,255");
    expect(style.filter).toContain("rgba(255,0,128");
    expect(style.transform).toContain("translate");
  });

  it("computes Hollywood color grading for teal_orange", () => {
    const tealFx: GraphicElement = {
      id: "fx-teal",
      name: "Teal Orange",
      compositionId: "effect_overlay",
      props: { effectType: "teal_orange", intensity: 85 },
      start: 0,
      end: 5,
    };

    const style = getVideoEffectStyle(tealFx, 1.5);
    expect(style.filter).toContain("contrast");
    expect(style.filter).toContain("saturate");
    expect(style.filter).toContain("hue-rotate");
    expect(style.filter).toContain("sepia");
  });

  it("computes true monochrome grayscale for bw_noir", () => {
    const bwFx: GraphicElement = {
      id: "fx-bw",
      name: "Noir",
      compositionId: "effect_overlay",
      props: { effectType: "bw_noir", intensity: 100 },
      start: 0,
      end: 5,
    };

    const style = getVideoEffectStyle(bwFx, 1.0);
    expect(style.filter).toContain("grayscale(100%)");
    expect(style.filter).toContain("contrast(1.55)");
  });

  it("computes physical camera vibration and rotation for camera_shake", () => {
    const shakeFx: GraphicElement = {
      id: "fx-shake",
      name: "Camera Shake",
      compositionId: "effect_overlay",
      props: { effectType: "camera_shake", intensity: 90 },
      start: 0,
      end: 3,
    };

    const style = getVideoEffectStyle(shakeFx, 1.2);
    expect(style.transform).toContain("translate");
    expect(style.transform).toContain("rotate");
    expect(style.transform).toContain("scale");
  });

  it("computes green phosphor infrared grade for night_vision", () => {
    const nvFx: GraphicElement = {
      id: "fx-nv",
      name: "Night Vision",
      compositionId: "effect_overlay",
      props: { effectType: "night_vision", intensity: 90 },
      start: 0,
      end: 5,
    };

    const style = getVideoEffectStyle(nvFx, 2.0);
    expect(style.filter).toContain("grayscale(1)");
    expect(style.filter).toContain("hue-rotate(85deg)");
    expect(style.filter).toContain("saturate");
  });

  it("computes FLIR inverted heatmap for thermal_heatmap", () => {
    const thermalFx: GraphicElement = {
      id: "fx-thermal",
      name: "Thermal",
      compositionId: "effect_overlay",
      props: { effectType: "thermal_heatmap", intensity: 85 },
      start: 0,
      end: 5,
    };

    const style = getVideoEffectStyle(thermalFx, 2.0);
    expect(style.filter).toContain("invert");
    expect(style.filter).toContain("hue-rotate(180deg)");
  });

  it("computes radial scale and blur for zoom_blur", () => {
    const zoomFx: GraphicElement = {
      id: "fx-zoom",
      name: "Zoom Blur",
      compositionId: "effect_overlay",
      props: { effectType: "zoom_blur", intensity: 75 },
      start: 0,
      end: 4,
    };

    const style = getVideoEffectStyle(zoomFx, 1.0);
    expect(style.filter).toContain("blur");
    expect(style.transform).toContain("scale");
  });

  it("computes strobe burst with initial high brightness decay", () => {
    const flashFx: GraphicElement = {
      id: "fx-flash",
      name: "Flash Burst",
      compositionId: "effect_overlay",
      props: { effectType: "flash_burst", intensity: 90, decaySpeed: 2 },
      start: 2.0,
      end: 4.0,
    };

    // Right at flash start (localTime = 0.05s) -> very bright
    const initialStyle = getVideoEffectStyle(flashFx, 2.05);
    expect(initialStyle.filter).toContain("brightness");
    const match = initialStyle.filter?.match(/brightness\(([0-9.]+)\)/);
    expect(match).toBeTruthy();
    const initialBright = parseFloat(match![1]);
    expect(initialBright).toBeGreaterThan(2.0);

    // Later at localTime = 1.0s -> flash has decayed
    const laterStyle = getVideoEffectStyle(flashFx, 3.0);
    const laterMatch = laterStyle.filter?.match(/brightness\(([0-9.]+)\)/);
    const laterBright = parseFloat(laterMatch![1]);
    expect(laterBright).toBeLessThan(initialBright);
  });

  it("handles all 25 preset IDs without error and returns non-empty styles", () => {
    EFFECT_PRESETS.forEach((preset) => {
      const mockFx: GraphicElement = {
        id: `fx-${preset.id}`,
        name: preset.label,
        compositionId: "effect_overlay",
        props: { effectType: preset.id, intensity: 80 },
        start: 0,
        end: 5,
      };

      const style = getVideoEffectStyle(mockFx, 1.0);
      expect(style.filter || style.transform).toBeDefined();
    });
  });
});

describe("PlayerMonitor & InspectorPanel Visual Effects Integration", () => {
  const initialProject: TimelineProject = {
    id: "proj-effects",
    name: "Effects Test Project",
    aspectRatio: "9:16",
    duration: 30.0,
    fps: 30,
    tracks: {
      videoTrack: [
        {
          id: "vid-1",
          name: "Main Clip 1",
          sourceUrl: "/assets/clip1.mp4",
          start: 0,
          end: 10,
          sourceStart: 0,
          sourceEnd: 10,
          speed: 1,
        },
      ],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [
        {
          id: "fx-noir-1",
          name: "Black & White Noir",
          compositionId: "effect_overlay",
          props: { effectType: "bw_noir", intensity: 90 },
          start: 2.0,
          end: 6.0,
          position: { x: 50, y: 50 },
          opacity: 100,
        },
        {
          id: "mg-card-1",
          name: "Rising Growth Chart",
          compositionId: "chart-reveal",
          props: { title: "GROWTH TREND" },
          start: 3.0,
          end: 7.0,
          position: { x: 50, y: 50 },
          opacity: 100,
        },
      ],
    },
    transitions: [],
  };

  it("renders active effect indicator in PlayerMonitor when playhead is in effect range", () => {
    useTimelineStore.getState().initProject(initialProject);

    // Playhead at 3.5s -> inside effect range (2.0s to 6.0s)
    useTimelineStore.getState().setPlayheadTime(3.5);
    const { rerender } = render(<PlayerMonitor />);

    const effectBadge = screen.getByTestId("active-effect-indicator");
    expect(effectBadge).toBeInTheDocument();
    expect(effectBadge).toHaveTextContent(/FX: bw noir \(90%\)/i);

    // Effect layer should be rendered
    const effectLayer = screen.getByTestId("active-effect-layer-fx-noir-1");
    expect(effectLayer).toBeInTheDocument();

    // Simultaneously, motion graphic card should also be rendered (at 3.5s both are active!)
    expect(screen.getByText("GROWTH TREND")).toBeInTheDocument();

    // Playhead at 8.0s -> outside effect range
    useTimelineStore.getState().setPlayheadTime(8.0);
    rerender(<PlayerMonitor />);
    expect(screen.queryByTestId("active-effect-indicator")).toBeNull();
    expect(screen.queryByTestId("active-effect-layer-fx-noir-1")).toBeNull();
  });

  it("renders specialized Visual Video Effect Inspector when an effect is selected", () => {
    useTimelineStore.getState().initProject(initialProject);
    useTimelineStore.getState().setSelectedItem({ type: "graphic", id: "fx-noir-1" });

    render(<InspectorPanel />);

    expect(screen.getByText("Visual Video Effect")).toBeInTheDocument();
    expect(screen.getByText("Filter Intensity")).toBeInTheDocument();
    expect(screen.getByText("Layer Opacity")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();

    // Change preset via dropdown to Teal & Orange
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "teal_orange" } });

    const updatedGraphic = useTimelineStore
      .getState()
      .project.tracks.graphicsTrack?.find((g) => g.id === "fx-noir-1");
    expect(updatedGraphic?.props?.effectType).toBe("teal_orange");
    expect(updatedGraphic?.name).toBe("Teal & Orange Grade");

    // Click Delete Effect button
    const deleteBtn = screen.getByText("Delete Effect");
    fireEvent.click(deleteBtn);

    const remaining = useTimelineStore
      .getState()
      .project.tracks.graphicsTrack?.filter((g) => g.id === "fx-noir-1");
    expect(remaining).toHaveLength(0);
    expect(useTimelineStore.getState().selectedItem).toBeNull();
  });
});

