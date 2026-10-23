import { CaptionPreset } from "../timeline-types";

export interface CaptionTemplateDefinition {
  id: CaptionPreset;
  name: string;
  badge: string;
  description: string;
  previewClass: string;
  renderClass: string;
  textStyle?: React.CSSProperties;
}

export const CAPTION_TEMPLATES: CaptionTemplateDefinition[] = [
  // 1. TikTok Yellow
  {
    id: "tiktok_yellow",
    name: "TikTok Yellow",
    badge: "bg-yellow-400 text-black font-extrabold",
    description: "Punchy viral TikTok yellow text with dark outline and shadow.",
    previewClass: "bg-black text-yellow-300 font-extrabold border border-yellow-400/40",
    renderClass:
      "font-black uppercase tracking-wider text-center text-sm sm:text-base md:text-[17px] text-white select-none whitespace-nowrap drop-shadow-[0_4px_8px_rgba(0,0,0,1)]",
    textStyle: {
      textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.95)",
    },
  },

  // 2. Hormozi Bold Red
  {
    id: "hormozi_bold",
    name: "Hormozi Bold",
    badge: "bg-red-600 text-white font-black tracking-wider uppercase",
    description: "Alex Hormozi high-impact all-caps white text inside a red banner box.",
    previewClass: "bg-red-600 text-white font-black border border-white",
    renderClass:
      "font-black uppercase tracking-tight text-center text-sm sm:text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,1)] px-3 py-1 bg-red-600 rounded-md border-2 border-white shadow-2xl rotate-[-1deg] whitespace-nowrap",
  },

  // 3. Clean Minimal White
  {
    id: "clean_white",
    name: "Clean Minimal",
    badge: "bg-white text-black font-semibold",
    description: "Sleek Apple-style minimalist white typography with frosted pill.",
    previewClass: "bg-black/70 text-white font-semibold",
    renderClass:
      "font-semibold text-center text-xs sm:text-sm text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] px-3 py-1 bg-black/45 backdrop-blur-xs rounded-lg border border-white/10 whitespace-nowrap",
  },

  // 4. Cyber Neon Glow
  {
    id: "neon_glow",
    name: "Cyber Neon Glow",
    badge: "bg-cyan-400 text-black font-bold shadow-cyan-400/50 shadow-md",
    description: "Electric cyan glow with futuristic dark shield and drop shadow.",
    previewClass: "bg-slate-900 text-cyan-300 font-bold border border-cyan-400/50",
    renderClass:
      "font-bold text-center text-sm sm:text-base text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.9)] px-3 py-1 bg-neutral-950/80 rounded-xl border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] whitespace-nowrap",
  },

  // 5. Karaoke Gradient (NEW #1)
  {
    id: "karaoke_gradient",
    name: "Karaoke Gradient",
    badge: "bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black",
    description: "Trendy violet-to-pink gradient text with frosted glass backdrop.",
    previewClass: "bg-neutral-950 text-fuchsia-300 font-black border border-fuchsia-500/40",
    renderClass:
      "font-black tracking-wide text-center text-sm sm:text-base bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(192,132,252,0.6)] px-3 py-1 bg-neutral-950/75 backdrop-blur-md rounded-xl border border-fuchsia-500/40 shadow-xl whitespace-nowrap",
  },

  // 6. Boxed Pill Badge (NEW #2)
  {
    id: "boxed_pill",
    name: "Boxed Pill Badge",
    badge: "bg-amber-400 text-black font-black uppercase",
    description: "High-contrast solid amber pill with bold black text (MrBeast style).",
    previewClass: "bg-amber-400 text-neutral-950 font-black border border-white",
    renderClass:
      "font-black uppercase tracking-wider text-center text-xs sm:text-sm text-neutral-950 bg-amber-400 px-3 py-1 rounded-full shadow-[0_4px_16px_rgba(251,191,36,0.6)] border border-white whitespace-nowrap",
  },

  // 7. Comic Pop Art (NEW #3)
  {
    id: "comic_pop",
    name: "Comic Pop Art",
    badge: "bg-yellow-300 text-black font-black tracking-widest",
    description: "Playful animated comic book font with heavy 3D drop-shadow.",
    previewClass: "bg-yellow-400 text-black font-black border-2 border-black",
    renderClass:
      "font-black uppercase tracking-wider text-center text-sm sm:text-base text-yellow-300 px-2.5 py-0.5 rotate-[1deg] whitespace-nowrap drop-shadow-[2px_2px_0px_#000]",
    textStyle: {
      textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
    },
  },

  // 8. Fire Blaze Gradient (NEW #4)
  {
    id: "fire_gradient",
    name: "Fire Blaze Gradient",
    badge: "bg-gradient-to-r from-amber-400 to-red-600 text-white font-black",
    description: "Burning amber-to-red fire gradient for intense, motivational clips.",
    previewClass: "bg-black text-orange-400 font-black border border-orange-500/40",
    renderClass:
      "font-black uppercase tracking-tight text-center text-sm sm:text-base bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent px-3 py-1 bg-neutral-950/85 rounded-xl border border-orange-500/50 shadow-[0_0_24px_rgba(249,115,22,0.4)] whitespace-nowrap",
  },

  // 9. Minimal Boxed Dark (NEW #5)
  {
    id: "minimal_boxed",
    name: "Minimal Boxed",
    badge: "bg-neutral-900 text-emerald-300 font-bold border border-emerald-500/40",
    description: "Cinematic interview card with dark glass and crisp emerald text.",
    previewClass: "bg-neutral-900 text-emerald-300 font-bold border border-emerald-500/30",
    renderClass:
      "font-bold tracking-normal text-center text-xs sm:text-sm text-emerald-300 px-3 py-1 bg-neutral-900/90 backdrop-blur-md rounded-lg border border-emerald-500/40 shadow-xl whitespace-nowrap",
  },
];

/**
 * Normalizes preset names, resolving legacy aliases like "neon_cyber" and "modern_clean"
 */
export function normalizeCaptionPreset(preset?: string | null): CaptionPreset {
  if (!preset) return "tiktok_yellow";
  const clean = preset.toLowerCase().trim();

  if (clean === "neon_cyber" || clean === "cyber_neon" || clean === "cyber_glow") {
    return "neon_glow";
  }
  if (clean === "modern_clean" || clean === "clean" || clean === "clean-white") {
    return "clean_white";
  }
  if (clean === "karaoke" || clean === "gradient" || clean === "karaoke-gradient") {
    return "karaoke_gradient";
  }
  if (clean === "boxed" || clean === "pill" || clean === "boxed-pill") {
    return "boxed_pill";
  }
  if (clean === "comic" || clean === "pop" || clean === "comic-pop") {
    return "comic_pop";
  }
  if (clean === "fire" || clean === "blaze" || clean === "fire-gradient") {
    return "fire_gradient";
  }
  if (clean === "minimal_boxed" || clean === "podcast" || clean === "minimal-boxed") {
    return "minimal_boxed";
  }

  const match = CAPTION_TEMPLATES.find((t) => t.id === clean);
  return match ? match.id : "tiktok_yellow";
}

/**
 * Retrieves the full template definition for a preset, with guaranteed fallback
 */
export function getCaptionTemplate(preset?: string | null): CaptionTemplateDefinition {
  const normalized = normalizeCaptionPreset(preset);
  return (
    CAPTION_TEMPLATES.find((t) => t.id === normalized) || CAPTION_TEMPLATES[0]
  );
}
