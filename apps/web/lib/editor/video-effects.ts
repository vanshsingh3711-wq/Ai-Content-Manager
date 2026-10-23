import type { CSSProperties } from "react";
import { GraphicElement } from "../timeline-types";

export interface EffectPresetDefinition {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const EFFECT_CATEGORIES = [
  "Color Grading & LUTs",
  "Retro & Glitch",
  "Lens & Optics",
  "Tactical & Stylized",
  "Cinematic & Camera",
] as const;

export const EFFECT_PRESETS: EffectPresetDefinition[] = [
  // 1. Color Grading & LUTs
  {
    id: "teal_orange",
    label: "Teal & Orange Grade",
    category: "Color Grading & LUTs",
    description: "Hollywood blockbuster warm skin tones and deep cyan shadows.",
  },
  {
    id: "bw_noir",
    label: "Black & White Noir",
    category: "Color Grading & LUTs",
    description: "Dramatic high-contrast film noir monochrome.",
  },
  {
    id: "golden_hour",
    label: "Golden Hour Warmth",
    category: "Color Grading & LUTs",
    description: "Luminous amber sunset warmth and golden highlights.",
  },
  {
    id: "vintage_film",
    label: "Vintage 8mm Film",
    category: "Color Grading & LUTs",
    description: "Aged 1970s celluloid with sepia tones and film saturation.",
  },
  {
    id: "film_grain",
    label: "35mm Film Grain",
    category: "Color Grading & LUTs",
    description: "Subtle analog emulsion grain and organic film roll contrast.",
  },
  {
    id: "duotone_cyber",
    label: "Duotone Cyber Grade",
    category: "Color Grading & LUTs",
    description: "Two-tone gradient map with deep violet and hot pink.",
  },
  {
    id: "solarize_xray",
    label: "Solarize X-Ray Inversion",
    category: "Color Grading & LUTs",
    description: "High-contrast photographic tone reversal and medical X-ray style.",
  },

  // 2. Retro & Glitch
  {
    id: "rgb_glitch",
    label: "RGB Glitch Split",
    category: "Retro & Glitch",
    description: "High-voltage chromatic aberration with cyan and magenta channel offsets.",
  },
  {
    id: "vhs_scanlines",
    label: "Retro VHS Scanlines",
    category: "Retro & Glitch",
    description: "1980s cathode-ray analog tape scanlines and tracking jitter.",
  },
  {
    id: "crt_arcade",
    label: "CRT Arcade Phosphor",
    category: "Retro & Glitch",
    description: "Arcade coin-op monitor curvature with phosphor scanlines.",
  },
  {
    id: "halftone_comic",
    label: "Halftone Comic Pop",
    category: "Retro & Glitch",
    description: "Pop-art comic book dot screen and vibrant posterization.",
  },

  // 3. Lens & Optics
  {
    id: "lens_flare",
    label: "Anamorphic Lens Flare",
    category: "Lens & Optics",
    description: "Horizontal anamorphic cyan flare streak across highlights.",
  },
  {
    id: "prism_bokeh",
    label: "Prism Bokeh Dispersion",
    category: "Lens & Optics",
    description: "Glass prism chromatic refraction with soft light leaks.",
  },
  {
    id: "zoom_blur",
    label: "Radial Zoom Blur",
    category: "Lens & Optics",
    description: "High-velocity radial explosion blur radiating from the center.",
  },
  {
    id: "fisheye_warp",
    label: "Fisheye Lens Warp",
    category: "Lens & Optics",
    description: "Ultra-wide skate video fisheye barrel distortion.",
  },
  {
    id: "dreamy_bloom",
    label: "Dreamy Soft Bloom",
    category: "Lens & Optics",
    description: "Ethereal glow and mist bloom softening harsh highlights.",
  },

  // 4. Tactical & Stylized
  {
    id: "night_vision",
    label: "Tactical Night Vision",
    category: "Tactical & Stylized",
    description: "Military Gen-3 infrared phosphor green with digital HUD.",
  },
  {
    id: "thermal_heatmap",
    label: "Thermal Heatmap FLIR",
    category: "Tactical & Stylized",
    description: "FLIR infrared camera heatmap with temperature spectrum.",
  },
  {
    id: "cyberpunk_neon",
    label: "Cyberpunk Neon Edge",
    category: "Tactical & Stylized",
    description: "Futuristic synthwave neon perimeter with intense saturation.",
  },
  {
    id: "flash_burst",
    label: "Strobe Flash Burst",
    category: "Tactical & Stylized",
    description: "Sudden explosive photo strobe flash with natural decay.",
  },
  {
    id: "color_strobe",
    label: "Party Color Strobe",
    category: "Tactical & Stylized",
    description: "High-energy rave beat-synced rainbow hue cycle.",
  },

  // 5. Cinematic & Camera
  {
    id: "cinematic_letterbox",
    label: "Cinematic Letterbox (2.39:1)",
    category: "Cinematic & Camera",
    description: "Hollywood widescreen 2.39:1 black matte bars top and bottom.",
  },
  {
    id: "camera_shake",
    label: "Earthquake Camera Shake",
    category: "Cinematic & Camera",
    description: "Violent handheld camera shake and impact vibration.",
  },
  {
    id: "kaleidoscope_mirror",
    label: "Kaleidoscope Prism Mirror",
    category: "Cinematic & Camera",
    description: "Symmetrical multi-faceted prism reflection matrix.",
  },
  {
    id: "vignette",
    label: "Cinematic Vignette",
    category: "Cinematic & Camera",
    description: "Soft feathered radial edge darkening focusing viewer attention.",
  },
];

/**
 * Checks if a graphic element is a full-screen visual effect
 */
export function isEffectGraphic(graphic: GraphicElement | null | undefined): boolean {
  if (!graphic) return false;
  const compKey = (graphic.compositionId || "").toLowerCase().replace(/_/g, "-");
  return (
    compKey === "effect-overlay" ||
    compKey === "effect_overlay" ||
    compKey.startsWith("fx-") ||
    Boolean(graphic.props?.effectType)
  );
}

/**
 * Computes CSS filter and transform styles applied directly to video playback elements
 */
export function getVideoEffectStyle(
  effect: GraphicElement | null | undefined,
  playheadTime: number
): CSSProperties {
  if (!effect) return {};

  const effectType = (
    effect.props?.effectType ||
    (effect.compositionId || "").replace(/^fx[-_]/, "")
  ).toLowerCase();

  const intensity = typeof effect.props?.intensity === "number" ? effect.props.intensity : 80;
  const opacity = (effect.opacity ?? 100) / 100;
  const factor = Math.max(0, Math.min(1, (intensity / 100) * opacity));

  if (factor <= 0) return {};

  const localTime = Math.max(0, playheadTime - effect.start);

  // 1. RGB Glitch Split
  if (effectType.includes("glitch") || effectType.includes("rgb")) {
    const shift = 4 * factor;
    const jitterX = Math.sin(localTime * 45) * 3 * factor;
    const jitterY = Math.cos(localTime * 38) * 1.5 * factor;
    return {
      filter: `drop-shadow(-${shift.toFixed(1)}px 0px 0px rgba(0,255,255,${(0.75 * factor).toFixed(2)})) drop-shadow(${shift.toFixed(1)}px 0px 0px rgba(255,0,128,${(0.75 * factor).toFixed(2)})) contrast(${(1 + 0.25 * factor).toFixed(2)})`,
      transform: `translate(${jitterX.toFixed(1)}px, ${jitterY.toFixed(1)}px)`,
    };
  }

  // 2. Cinematic Teal & Orange Grade
  if (effectType.includes("teal") || effectType.includes("orange")) {
    return {
      filter: `contrast(${(1 + 0.25 * factor).toFixed(2)}) saturate(${(1 + 0.4 * factor).toFixed(2)}) hue-rotate(-${(8 * factor).toFixed(1)}deg) sepia(${(0.2 * factor).toFixed(2)})`,
    };
  }

  // 3. Retro VHS Scanlines
  if (effectType.includes("vhs") || effectType.includes("scanline")) {
    const vJitter = Math.sin(localTime * 30) * 1.5 * factor;
    return {
      filter: `sepia(${(0.25 * factor).toFixed(2)}) saturate(${(1 + 0.35 * factor).toFixed(2)}) contrast(${(1 + 0.2 * factor).toFixed(2)}) hue-rotate(5deg)`,
      transform: `translateY(${vJitter.toFixed(1)}px)`,
    };
  }

  // 4. Cyberpunk Neon Edge
  if (effectType.includes("cyberpunk") || effectType.includes("neon")) {
    return {
      filter: `contrast(${(1 + 0.4 * factor).toFixed(2)}) saturate(${(1 + 0.85 * factor).toFixed(2)}) hue-rotate(275deg) brightness(${(1 + 0.1 * factor).toFixed(2)})`,
    };
  }

  // 5. Black & White Noir
  if (
    effectType.includes("bw") ||
    effectType.includes("noir") ||
    effectType.includes("black_white") ||
    effectType.includes("black-white")
  ) {
    return {
      filter: `grayscale(${(100 * factor).toFixed(0)}%) contrast(${(1 + 0.55 * factor).toFixed(2)}) brightness(${(1 - 0.05 * factor).toFixed(2)})`,
    };
  }

  // 6. Vignette
  if (effectType.includes("vignette")) {
    return {
      filter: `contrast(${(1 + 0.18 * factor).toFixed(2)}) brightness(${(1 - 0.08 * factor).toFixed(2)})`,
    };
  }

  // 7. Golden Hour Warmth
  if (effectType.includes("golden") || effectType.includes("sunset")) {
    const warmth = (effect.props?.warmth ?? 80) / 100;
    return {
      filter: `sepia(${(0.38 * factor * warmth).toFixed(2)}) saturate(${(1 + 0.38 * factor).toFixed(2)}) brightness(${(1 + 0.08 * factor).toFixed(2)}) contrast(${(1 + 0.08 * factor).toFixed(2)}) hue-rotate(-10deg)`,
    };
  }

  // 8. Anamorphic Lens Flare
  if (effectType.includes("flare") || effectType.includes("anamorphic")) {
    return {
      filter: `brightness(${(1 + 0.18 * factor).toFixed(2)}) contrast(${(1 + 0.12 * factor).toFixed(2)}) saturate(${(1 + 0.22 * factor).toFixed(2)})`,
    };
  }

  // 9. Vintage 8mm Film
  if (effectType.includes("vintage") || effectType.includes("film") || effectType.includes("8mm")) {
    return {
      filter: `sepia(${(0.48 * factor).toFixed(2)}) contrast(${(1 + 0.22 * factor).toFixed(2)}) brightness(${(1 - 0.05 * factor).toFixed(2)}) saturate(${(1 - 0.18 * factor).toFixed(2)})`,
    };
  }

  // 10. Strobe Flash Burst
  if (effectType.includes("flash") || effectType.includes("burst")) {
    const decaySpeed = effect.props?.decaySpeed ?? 2;
    const flashDecay = Math.max(0, 1 - localTime * decaySpeed * 1.5);
    const flashBoost = flashDecay * factor;
    return {
      filter: `brightness(${(1 + flashBoost * 2.8).toFixed(2)}) contrast(${(1 + flashBoost * 0.7).toFixed(2)})`,
    };
  }

  // 11. Radial Zoom Blur
  if (effectType.includes("zoom") || effectType.includes("blur")) {
    return {
      filter: `blur(${(2 * factor).toFixed(1)}px) contrast(${(1 + 0.15 * factor).toFixed(2)})`,
      transform: `scale(${(1 + 0.06 * factor).toFixed(3)})`,
    };
  }

  // 12. CRT Arcade Phosphor
  if (effectType.includes("crt") || effectType.includes("arcade")) {
    return {
      filter: `saturate(${(1 + 0.55 * factor).toFixed(2)}) contrast(${(1 + 0.35 * factor).toFixed(2)}) brightness(${(1 + 0.1 * factor).toFixed(2)})`,
      transform: `scale(${(1 + 0.02 * factor).toFixed(3)})`,
    };
  }

  // 13. Halftone Comic Pop
  if (effectType.includes("halftone") || effectType.includes("comic")) {
    return {
      filter: `contrast(${(1 + 0.7 * factor).toFixed(2)}) saturate(${(1 + 0.8 * factor).toFixed(2)}) brightness(${(1 + 0.05 * factor).toFixed(2)})`,
    };
  }

  // 14. Prism Bokeh Dispersion
  if (effectType.includes("prism") || effectType.includes("bokeh")) {
    const offset = 2.5 * factor;
    return {
      filter: `drop-shadow(-${offset.toFixed(1)}px -${(offset * 0.5).toFixed(1)}px 0px rgba(255,0,100,${(0.45 * factor).toFixed(2)})) drop-shadow(${offset.toFixed(1)}px ${(offset * 0.5).toFixed(1)}px 0px rgba(0,200,255,${(0.45 * factor).toFixed(2)})) blur(${(0.7 * factor).toFixed(1)}px)`,
    };
  }

  // 15. Tactical Night Vision
  if (effectType.includes("night") || effectType.includes("vision")) {
    return {
      filter: `grayscale(1) sepia(1) hue-rotate(85deg) saturate(${(5.5 * factor).toFixed(1)}) brightness(${(1 + 0.45 * factor).toFixed(2)}) contrast(${(1 + 0.55 * factor).toFixed(2)})`,
    };
  }

  // 16. 35mm Film Grain
  if (effectType.includes("grain")) {
    return {
      filter: `contrast(${(1 + 0.18 * factor).toFixed(2)}) saturate(${(1 - 0.08 * factor).toFixed(2)}) brightness(${(1 - 0.03 * factor).toFixed(2)})`,
    };
  }

  // 17. Duotone Cyber
  if (effectType.includes("duotone")) {
    return {
      filter: `grayscale(${(0.8 * factor).toFixed(2)}) sepia(${(0.6 * factor).toFixed(2)}) hue-rotate(270deg) saturate(${(1 + 2.0 * factor).toFixed(2)}) contrast(${(1 + 0.4 * factor).toFixed(2)})`,
    };
  }

  // 18. Thermal Heatmap FLIR
  if (effectType.includes("thermal") || effectType.includes("heatmap")) {
    return {
      filter: `invert(${(0.92 * factor).toFixed(2)}) hue-rotate(180deg) saturate(${(1 + 2.8 * factor).toFixed(2)}) contrast(${(1 + 0.6 * factor).toFixed(2)})`,
    };
  }

  // 19. Dreamy Soft Bloom
  if (effectType.includes("dreamy") || effectType.includes("bloom")) {
    return {
      filter: `brightness(${(1 + 0.18 * factor).toFixed(2)}) contrast(${(1 - 0.06 * factor).toFixed(2)}) saturate(${(1 + 0.28 * factor).toFixed(2)}) blur(${(0.9 * factor).toFixed(1)}px)`,
    };
  }

  // 20. Party Color Strobe
  if (
    effectType.includes("party") ||
    effectType.includes("color_strobe") ||
    effectType.includes("color-strobe")
  ) {
    const hueAngle = Math.floor((localTime * 720) % 360);
    return {
      filter: `hue-rotate(${hueAngle}deg) saturate(${(1 + 0.9 * factor).toFixed(2)}) contrast(${(1 + 0.35 * factor).toFixed(2)})`,
    };
  }

  // 21. Fisheye Lens Warp
  if (effectType.includes("fisheye")) {
    return {
      filter: `contrast(${(1 + 0.22 * factor).toFixed(2)}) saturate(${(1 + 0.18 * factor).toFixed(2)})`,
      transform: `scale(${(1 + 0.14 * factor).toFixed(3)})`,
    };
  }

  // 22. Cinematic Letterbox
  if (effectType.includes("letterbox")) {
    return {
      filter: `contrast(${(1 + 0.15 * factor).toFixed(2)}) saturate(${(1 + 0.18 * factor).toFixed(2)})`,
    };
  }

  // 23. Earthquake Camera Shake
  if (effectType.includes("shake") || effectType.includes("earthquake")) {
    const shakeX = (Math.sin(localTime * 32) * 8 + Math.cos(localTime * 51) * 4) * factor;
    const shakeY = (Math.cos(localTime * 36) * 6 + Math.sin(localTime * 47) * 3) * factor;
    const rot = Math.sin(localTime * 22) * 1.5 * factor;
    return {
      transform: `translate(${shakeX.toFixed(1)}px, ${shakeY.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(1 + 0.05 * factor).toFixed(3)})`,
    };
  }

  // 24. Kaleidoscope Mirror
  if (effectType.includes("kaleidoscope") || effectType.includes("mirror")) {
    const rotAngle = Math.sin(localTime * 2) * 25 * factor;
    return {
      filter: `contrast(${(1 + 0.4 * factor).toFixed(2)}) saturate(${(1 + 0.65 * factor).toFixed(2)}) hue-rotate(${rotAngle.toFixed(1)}deg)`,
    };
  }

  // 25. Solarize X-Ray Inversion
  if (effectType.includes("solarize") || effectType.includes("xray")) {
    return {
      filter: `invert(${(1.0 * factor).toFixed(2)}) grayscale(${(0.85 * factor).toFixed(2)}) contrast(${(1 + 1.3 * factor).toFixed(2)}) brightness(${(1 + 0.12 * factor).toFixed(2)})`,
    };
  }

  return {};
}
