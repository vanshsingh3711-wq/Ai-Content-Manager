/**
 * local-command-parser.ts
 *
 * Deterministic Regex & Rule-Based Local Command Parser (Tier 1).
 * Evaluates common video editing intents locally in <10ms with zero network requests.
 * Produces strictly typed EditOperation objects for immediate execution on the operational bus.
 */

import { EditOperation } from "../operations/operation-types";
import { EditorContext } from "./editor-context";
import { findNonOverlappingPlacement } from "../layout/subject-avoidance";
import { findPhraseTimestamp, findBeatByRoleOrKeyword } from "./transcript-matcher";
import { CaptionPreset } from "../timeline-types";

export interface LocalParseResult {
  matched: boolean;
  operation?: EditOperation;
  error?: string;
  isCloudCandidate?: boolean;
  description?: string;
}

/**
 * Parses flexible timestamp string inputs into floating-point seconds.
 * Supports:
 * - SMPTE timecode (HH:MM:SS:FF or MM:SS:FF)
 * - Standard minutes & seconds (MM:SS or MM:SS.mmm)
 * - Raw seconds (e.g. "14s", "14.5 seconds", "83")
 */
export function parseFlexibleTimestamp(input: string, fps: number = 30): number {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    throw new Error("Empty timestamp string");
  }

  // Format 1a: SMPTE timecode 4-segment (HH:MM:SS:FF)
  const smpte4Match = trimmed.match(/^(\d+):(\d+):(\d+):(\d+)$/);
  if (smpte4Match) {
    const hours = parseInt(smpte4Match[1], 10);
    const mins = parseInt(smpte4Match[2], 10);
    const secs = parseInt(smpte4Match[3], 10);
    const frames = parseInt(smpte4Match[4], 10);
    return Number((hours * 3600 + mins * 60 + secs + (frames / fps)).toFixed(3));
  }

  // Format 1b: SMPTE timecode 3-segment (MM:SS:FF)
  // e.g. "01:23:15" with 30fps -> 1 min (60s) + 23 sec (23s) + 15 frames (0.5s) = 83.5s
  const smpte3Match = trimmed.match(/^(\d+):(\d+):(\d+)$/);
  if (smpte3Match) {
    const mins = parseInt(smpte3Match[1], 10);
    const secs = parseInt(smpte3Match[2], 10);
    const frames = parseInt(smpte3Match[3], 10);
    return Number((mins * 60 + secs + (frames / fps)).toFixed(3));
  }

  // Format 2: Standard minutes & seconds (MM:SS or MM:SS.mmm)
  const minSecMatch = trimmed.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (minSecMatch) {
    const mins = parseInt(minSecMatch[1], 10);
    const secs = parseFloat(minSecMatch[2]);
    return Number((mins * 60 + secs).toFixed(3));
  }

  // Format 3: Raw seconds notation (e.g. "14s", "14.5 seconds", "83", "83.5")
  const secMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)?$/);
  if (secMatch) {
    return Number(parseFloat(secMatch[1]).toFixed(3));
  }

  throw new Error(`Invalid timestamp format: "${input}"`);
}

export interface ExtractedTimeRange {
  start?: number;
  end?: number;
  splitTime?: number;
  cleanedPrompt: string;
  isExplicitRange?: boolean;
  error?: string;
}

/**
 * Extracts explicit time ranges or timestamps from natural language prompts.
 * Supported patterns:
 * - "from <start> to <end>"
 * - "between <start> and <end>"
 * - "at <start> for <duration>"
 * - "at <timestamp>"
 */
export function extractTimeRangeFromPrompt(
  prompt: string,
  fps: number = 30
): ExtractedTimeRange {
  // Pattern A: "between <T1> and <T2>"
  const betweenMatch = prompt.match(/\bbetween\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\s+and\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\b/i);
  if (betweenMatch) {
    try {
      const start = parseFlexibleTimestamp(betweenMatch[1], fps);
      const end = parseFlexibleTimestamp(betweenMatch[2], fps);
      if (start >= end) {
        return {
          cleanedPrompt: prompt,
          error: `Invalid time range: start time (${start}s) must be before end time (${end}s).`,
        };
      }
      const cleaned = prompt.replace(betweenMatch[0], "").replace(/\s+/g, " ").trim();
      return { start, end, isExplicitRange: true, cleanedPrompt: cleaned };
    } catch (e: any) {
      return { cleanedPrompt: prompt, error: e.message };
    }
  }

  // Pattern B: "from <T1> to <T2>"
  const fromToMatch = prompt.match(/\bfrom\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\s+to\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\b/i);
  if (fromToMatch) {
    try {
      const start = parseFlexibleTimestamp(fromToMatch[1], fps);
      const end = parseFlexibleTimestamp(fromToMatch[2], fps);
      if (start >= end) {
        return {
          cleanedPrompt: prompt,
          error: `Invalid time range: start time (${start}s) must be before end time (${end}s).`,
        };
      }
      const cleaned = prompt.replace(fromToMatch[0], "").replace(/\s+/g, " ").trim();
      return { start, end, isExplicitRange: true, cleanedPrompt: cleaned };
    } catch (e: any) {
      return { cleanedPrompt: prompt, error: e.message };
    }
  }

  // Pattern C: "at <T1> for <Duration>"
  const atForMatch = prompt.match(/\bat\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\s+for\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\b/i);
  if (atForMatch) {
    try {
      const start = parseFlexibleTimestamp(atForMatch[1], fps);
      const dur = parseFlexibleTimestamp(atForMatch[2], fps);
      if (dur <= 0) {
        return {
          cleanedPrompt: prompt,
          error: `Invalid duration: duration must be positive.`,
        };
      }
      const end = Number((start + dur).toFixed(3));
      const cleaned = prompt.replace(atForMatch[0], "").replace(/\s+/g, " ").trim();
      return { start, end, isExplicitRange: true, cleanedPrompt: cleaned };
    } catch (e: any) {
      return { cleanedPrompt: prompt, error: e.message };
    }
  }

  // Pattern D: "at <T1>" (point in time, e.g. for split/cut)
  const atMatch = prompt.match(/\bat\s+([0-9:.]+(?:\s*(?:s|sec|seconds))?)\b/i);
  if (atMatch) {
    try {
      const t = parseFlexibleTimestamp(atMatch[1], fps);
      const cleaned = prompt.replace(atMatch[0], "").replace(/\s+/g, " ").trim();
      return { splitTime: t, start: t, cleanedPrompt: cleaned };
    } catch (e: any) {
      // Not a valid timestamp, leave as-is
    }
  }

  return { cleanedPrompt: prompt };
}

export interface GraphicConfig {
  triggers: string[];
  compositionId: string;
  name: string;
  props: Record<string, any>;
}

export const GRAPHIC_CONFIGS: GraphicConfig[] = [
  {
    triggers: [
      "rising graph",
      "rising graphs",
      "rising chart",
      "growth chart",
      "trend graph",
      "bar chart",
      "line chart",
      "graph animation",
      "graphs animation",
      "chart animation",
      "graph",
      "graphs",
      "chart",
      "charts",
    ],
    compositionId: "chart-reveal",
    name: "RISING GRAPH",
    props: {
      title: "GROWTH TREND",
      dataPoint1: "Stage 1: Baseline",
      dataPoint2: "Stage 2: +85%",
      dataPoint3: "Stage 3: +165% Surge",
      personality: "technical",
    },
  },
  {
    triggers: ["animated counter", "counter", "ticker", "growth counter", "subscriber counter", "subscribers counter", "subscriber count"],
    compositionId: "animated_counter",
    name: "COUNTER",
    props: { from: 0, to: 50000, label: "SUBSCRIBERS", prefix: "", suffix: "" },
  },
  {
    triggers: ["animated kpi", "metric reveal", "kpi", "metric", "revenue", "subscribers"],
    compositionId: "animated_kpi",
    name: "KPI METRIC",
    props: { title: "MRR Growth", value: "$48,500", change: "+32%" },
  },
  {
    triggers: ["animated arrow", "arrow", "pointer", "callout"],
    compositionId: "animated_arrow",
    name: "ARROW",
    props: { label: "Look Here" },
  },
  {
    triggers: ["terminal", "code", "cli", "command prompt"],
    compositionId: "cooked-terminal",
    name: "TERMINAL",
    props: { command: "npm run deploy", output: "Server running: 100% production ready" },
  },
  {
    triggers: ["social post", "tweet", "x.com post"],
    compositionId: "cooked-social-post",
    name: "SOCIAL POST",
    props: { name: "Creator Pro", handle: "@creator_pro", text: "Scaling to the next level 🚀", likes: "18.4K" },
  },
  {
    triggers: ["lower third", "lower-third", "speaker badge", "speaker name", "speaker title", "interview badge", "host tag", "name tag"],
    compositionId: "lower-third",
    name: "LOWER THIRD",
    props: { name: "Alex Rivera", title: "Lead Product Architect", handle: "@alexrivera", accentColor: "#38bdf8" },
  },
  {
    triggers: ["subscribe badge", "subscribe button", "subscribe callout", "sub button", "bell callout", "subscribe and bell", "subscribe"],
    compositionId: "subscribe-badge",
    name: "SUBSCRIBE CALLOUT",
    props: { channelName: "Creator Studio", subCount: "1.25M", buttonText: "SUBSCRIBE", buttonColor: "#dc2626", showBell: true },
  },
  {
    triggers: ["before after", "before and after", "comparison card", "versus card", "before vs after", "split comparison"],
    compositionId: "before-after",
    name: "BEFORE & AFTER",
    props: { beforeLabel: "BEFORE", beforeText: "6 hrs manual editing", afterLabel: "AFTER", afterText: "60s AI automation", accentColor: "#10b981" },
  },
  {
    triggers: ["countdown timer", "countdown", "timer widget", "timer", "seconds remaining", "clock timer"],
    compositionId: "countdown-timer",
    name: "COUNTDOWN TIMER",
    props: { seconds: 5, label: "TIME REMAINING", accentColor: "#f59e0b" },
  },
  {
    triggers: ["review card", "review", "testimonial", "5 star review", "stars card", "rating card"],
    compositionId: "review-card",
    name: "REVIEW CARD",
    props: { author: "Sarah Jenkins", role: "Verified Creator", rating: 5, review: "Saved our team 20+ hours a week. Absolute game changer!", accentColor: "#fbbf24" },
  },
  {
    triggers: ["social handles", "social badge", "follow badge", "instagram handle", "youtube handle", "tiktok handle", "twitter handle"],
    compositionId: "social-handles",
    name: "SOCIAL HANDLES",
    props: { platform: "youtube", handle: "@contentmaster", actionText: "Follow for daily tips", accentColor: "#a855f7" },
  },
  {
    triggers: ["animated title", "title saying", "animated headline", "hero reveal", "title card", "stat card", "card", "headline"],
    compositionId: "hero_reveal",
    name: "HERO REVEAL",
    props: { headline: "The Solution", label: "KEY TAKEAWAY", colorTheme: "blue" },
  },
  {
    triggers: ["quote reveal", "quote", "famous quote", "inspirational quote", "wisdom"],
    compositionId: "quote-reveal",
    name: "QUOTE",
    props: { quote: "Consistency is what transforms average into excellence.", author: "Key Takeaway", personality: "premium" },
  },
  {
    triggers: ["progress bar", "progress", "loading bar"],
    compositionId: "cooked-progress",
    name: "PROGRESS",
    props: { label: "Completion Rate", progress: 85 },
  },
  {
    triggers: ["notes", "checklist", "bullet list", "bullet points"],
    compositionId: "cooked-notes",
    name: "NOTES",
    props: { title: "Action Items", items: ["Point 1: Focus", "Point 2: Execute", "Point 3: Scale"] },
  },
  {
    triggers: ["toast", "notification", "alert popup", "alert"],
    compositionId: "cooked-toasts",
    name: "NOTIFICATION",
    props: { title: "Alert", message: "Key milestone reached!" },
  },

  // Pack Finance: 10 High-Production Finance Motion Graphics
  {
    triggers: [
      "candlestick hud",
      "candlestick chart",
      "candlestick trading hud",
      "trading hud",
      "trading chart",
      "crypto chart",
      "bitcoin chart",
      "crypto ticker",
      "stock chart",
      "stock trading hud",
      "trading station",
      "candlestick",
    ],
    compositionId: "candlestick-hud",
    name: "CANDLESTICK HUD",
    props: {
      ticker: "BTC/USDT",
      price: "$64,250.00",
      change: "+8.4%",
      smaPeriod: 20,
      volume: "1.42B",
      timeFrame: "4H",
    },
  },
  {
    triggers: [
      "compound growth curve",
      "compound curve",
      "compound growth",
      "snowball curve",
      "compound interest curve",
      "exponential growth curve",
      "wealth curve",
      "compound interest",
      "snowball effect",
    ],
    compositionId: "compound-growth-curve",
    name: "COMPOUND GROWTH",
    props: {
      principal: "$10,000",
      rate: "10% Annual",
      years: 30,
      futureValue: "$174,494",
      multiplier: "17.4x",
      title: "THE SNOWBALL EFFECT",
    },
  },
  {
    triggers: [
      "portfolio donut",
      "asset allocation",
      "portfolio allocation",
      "portfolio breakdown",
      "investment portfolio",
      "portfolio pie chart",
      "asset allocation chart",
      "portfolio split",
    ],
    compositionId: "portfolio-donut",
    name: "PORTFOLIO DONUT",
    props: {
      totalValue: "$250,000",
      asset1: "Stocks (60%)",
      asset2: "Real Estate (20%)",
      asset3: "Crypto (10%)",
      asset4: "Cash (10%)",
      title: "ASSET ALLOCATION",
    },
  },
  {
    triggers: [
      "inflation cash burn",
      "cash burn",
      "inflation burn",
      "purchasing power",
      "dollar burn",
      "cash fire",
      "inflation meter",
      "inflation",
    ],
    compositionId: "inflation-cash-burn",
    name: "INFLATION CASH BURN",
    props: {
      originalValue: "$100,000",
      purchasingPower: "$68,400",
      inflationRate: "3.8%",
      years: 10,
      title: "INFLATION SILENT KILLER",
      lossAmount: "-$31,600",
    },
  },
  {
    triggers: [
      "banking notification",
      "bank notification",
      "wire transfer notification",
      "deposit notification",
      "dividend notification",
      "payout notification",
      "stripe notification",
      "wire transfer toast",
      "bank toast",
      "deposit alert",
    ],
    compositionId: "banking-notification",
    name: "BANKING NOTIFICATION",
    props: {
      bankName: "CHASE PRIVATE CLIENT",
      amount: "+$24,500.00",
      sender: "WIRE DEPOSIT / ACME CORP",
      timeAgo: "JUST NOW",
      status: "CLEARED",
    },
  },
  {
    triggers: [
      "budget waterfall",
      "50 30 20 budget",
      "50/30/20 budget",
      "budget breakdown",
      "waterfall budget",
      "income waterfall",
      "salary breakdown",
      "income breakdown",
      "50 30 20",
    ],
    compositionId: "budget-waterfall",
    name: "BUDGET WATERFALL",
    props: {
      monthlyIncome: "$10,000",
      needs: "$5,000 (50%)",
      wants: "$3,000 (30%)",
      savings: "$2,000 (20%)",
      title: "50/30/20 BUDGET RULE",
    },
  },
  {
    triggers: [
      "debt payoff tracker",
      "debt tracker",
      "debt payoff",
      "debt snowball tracker",
      "debt snowball",
      "debt avalanche",
      "debt meter",
      "payoff tracker",
    ],
    compositionId: "debt-payoff-tracker",
    name: "DEBT PAYOFF TRACKER",
    props: {
      totalDebt: "$45,000",
      paidOff: "$36,000",
      remaining: "$9,000",
      progress: 80,
      title: "DEBT SNOWBALL METHOD",
      stamp: "PAID OFF",
    },
  },
  {
    triggers: [
      "roi balance scale",
      "balance scale",
      "roi scale",
      "cost vs return",
      "investment scale",
      "risk vs reward scale",
      "roi comparison",
      "risk reward",
    ],
    compositionId: "roi-balance-scale",
    name: "ROI BALANCE SCALE",
    props: {
      costSide: "Cost ($5k)",
      returnSide: "Return ($50k)",
      roiMultiplier: "10x ROI",
      tiltDegree: 18,
      title: "ASYMMETRIC RISK/REWARD",
    },
  },
  {
    triggers: [
      "wealth flywheel",
      "compounding flywheel",
      "cash flywheel",
      "flywheel",
      "financial flywheel",
      "wealth cycle",
    ],
    compositionId: "wealth-flywheel",
    name: "WEALTH FLYWHEEL",
    props: {
      stage1: "EARN HIGH INCOME",
      stage2: "SAVE 40%+",
      stage3: "BUY ASSETS",
      stage4: "COMPOUND RETURNS",
      title: "THE WEALTH FLYWHEEL",
      speed: "dynamic",
    },
  },
  {
    triggers: [
      "battle chart",
      "warren buffett challenge",
      "sp500 vs hedge fund",
      "hedge fund challenge",
      "asset battle",
      "index fund vs hedge fund",
      "buffett bet",
    ],
    compositionId: "battle-chart",
    name: "BUFFETT BATTLE CHART",
    props: {
      contestantA: "S&P 500 INDEX",
      contestantB: "TOP 5 HEDGE FUNDS",
      sp500Return: "+125.8%",
      hedgeReturn: "+36.3%",
      delta: "+89.5% WIN",
      durationYears: "10-YEAR CHALLENGE",
    },
  },
];

/**
 * Parses a natural language user prompt against deterministic local command patterns.
 */
export function parseLocalCommand(prompt: string, context: EditorContext): LocalParseResult {
  const cleanPrompt = prompt.trim().toLowerCase();
  if (!cleanPrompt) {
    return { matched: false };
  }

  // Extract explicit time range or point time if specified
  const timeRange = extractTimeRangeFromPrompt(prompt, 30);
  if (timeRange.error) {
    return {
      matched: true,
      error: timeRange.error,
    };
  }

  if (timeRange.start !== undefined && timeRange.start > context.duration) {
    return {
      matched: true,
      error: `Start time (${timeRange.start}s) exceeds video duration (${context.duration}s).`,
    };
  }

  // 0. ASPECT RATIO RESPONSIVE REFLOW ("change aspect ratio to 16:9", "switch to tiktok", etc.)
  const aspectRatioRegex = /(?:change|switch|set|convert|reflow|make|turn)\s+(?:the\s+)?(?:aspect\s*ratio|canvas|format|layout|video)?\s*(?:to\s+)?(16:9|9:16|1:1|4:5|landscape|widescreen|vertical|portrait|tiktok|shorts|reels|square|youtube)$/i;
  const aspectMatch = prompt.match(aspectRatioRegex);
  if (aspectMatch) {
    const rawTarget = aspectMatch[1].toLowerCase();
    let targetRatio: "9:16" | "16:9" | "1:1" | "4:5" | null = null;
    if (rawTarget === "16:9" || rawTarget === "landscape" || rawTarget === "widescreen" || rawTarget === "youtube") {
      targetRatio = "16:9";
    } else if (rawTarget === "9:16" || rawTarget === "vertical" || rawTarget === "tiktok" || rawTarget === "shorts" || rawTarget === "reels") {
      targetRatio = "9:16";
    } else if (rawTarget === "1:1" || rawTarget === "square") {
      targetRatio = "1:1";
    } else if (rawTarget === "4:5" || rawTarget === "portrait") {
      targetRatio = "4:5";
    }

    if (targetRatio) {
      const operation: EditOperation = {
        type: "set_aspect_ratio",
        aspectRatio: targetRatio,
      };
      return {
        matched: true,
        operation,
        description: `Reflow project to ${targetRatio} aspect ratio with responsive layout adaptation`,
      };
    }
  }

  // 0.1. SPOKEN PHRASE TRANSCRIPT SYNCHRONIZATION ("when I say ...")
  // Patterns:
  // "Add a badge when I say Welcome"
  // "Add badge when I say 'Hello World'"
  // "Add graphic when I say Subscribe"
  // "Add title Welcome when I say Welcome"
  // 0.1. SPOKEN PHRASE TRANSCRIPT SYNCHRONIZATION ("when I say ...")
  // Patterns:
  // "Add a badge when I say Welcome"
  // "Add badge when I say 'Hello World'"
  // "Add graphic when I say Subscribe"
  // "Add title Welcome when I say Welcome"
  // "Add candlestick hud when I say Bitcoin"
  const phraseSyncRegex = /add (?:a )?(badge|graphic|card|title|caption|[a-z0-9\s-]+?)(?: saying| that says| with text)?(?:\s+["']?([^"']+)["']?)?\s+when i say\s+["']?([^"']+)["']?$/i;
  const phraseSyncMatch = prompt.match(phraseSyncRegex);
  if (phraseSyncMatch) {
    const elementType = phraseSyncMatch[1].toLowerCase().trim();
    const explicitText = phraseSyncMatch[2]?.replace(/["']/g, "").trim();
    const targetSpokenPhrase = phraseSyncMatch[3].replace(/["']/g, "").trim().replace(/[.!?]+$/, "");

    if (targetSpokenPhrase.length > 0) {
      const matchRes = findPhraseTimestamp(targetSpokenPhrase, context.transcriptWords);
      if (!matchRes.matched || matchRes.start === undefined) {
        return {
          matched: true,
          error: `Phrase "${targetSpokenPhrase}" was not found in the video transcript.`,
        };
      }

      const onsetTime = matchRes.start;
      const duration = 3.0;
      const end = Math.min(context.duration, Number((onsetTime + duration).toFixed(2)));

      // Check subject safe zones at the exact audio onset timestamp
      const placement = findNonOverlappingPlacement({
        elementSize: { width: 45, height: 15 },
        safeZones: context.safeZones,
        playheadTime: onsetTime,
        defaultPosition: elementType === "title" || elementType === "caption" ? { x: 50, y: 75 } : { x: 50, y: 30 },
      });

      const displayText = explicitText || targetSpokenPhrase;

      if (elementType === "title" || elementType === "caption") {
        const operation: EditOperation = {
          type: "add_element",
          track: "caption",
          element: {
            id: `caption-${Date.now()}`,
            text: displayText,
            start: onsetTime,
            end: end <= onsetTime ? onsetTime + duration : end,
            stylePreset: "tiktok_yellow",
            position: placement.position,
            positionX: placement.position.x,
            positionY: placement.position.y,
            scale: 1.0,
          },
        };

        return {
          matched: true,
          operation,
          description: `Add caption "${displayText}" synchronized to phrase "${targetSpokenPhrase}" at ${onsetTime.toFixed(2)}s`,
        };
      } else {
        // badge, graphic, card, or specific motion graphic template
        const matchedConfig = GRAPHIC_CONFIGS.find(
          (c) =>
            c.compositionId === elementType ||
            elementType.includes(c.compositionId) ||
            c.triggers.some((t) => elementType === t || elementType.includes(t))
        );

        const compositionId = matchedConfig ? matchedConfig.compositionId : "pop_up_badge";
        const props = matchedConfig
          ? { ...matchedConfig.props }
          : { text: displayText.toUpperCase(), variant: "success" };
        const name = matchedConfig ? matchedConfig.name : displayText.toUpperCase();

        const operation: EditOperation = {
          type: "add_element",
          track: "graphic",
          element: {
            id: `graphic-${Date.now()}`,
            name,
            compositionId,
            props,
            start: onsetTime,
            end: end <= onsetTime ? onsetTime + duration : end,
            position: placement.position,
            positionX: placement.position.x,
            positionY: placement.position.y,
            scale: 1.0,
            isUserLocked: false,
          },
        };

        return {
          matched: true,
          operation,
          description: `Add ${elementType} "${displayText}" synchronized to phrase "${targetSpokenPhrase}" at ${onsetTime.toFixed(2)}s`,
        };
      }
    }
  }

  // 0.5. STORYTELLING BEAT ANCHORING ("at the hook", "at the cta", etc.)
  // Patterns:
  // "Add a badge at the hook"
  // "Add card at the cta"
  // "Add graphic at the intro"
  // "Add candlestick hud at the hook"
  const beatAnchorRegex = /add (?:a )?(badge|graphic|card|title|caption|[a-z0-9\s-]+?)(?:\s+["']?([^"']+)["']?)?\s+at (?:the )?(hook|intro|cta|call to action|problem|solution|statistic|conclusion|finance|trading|crypto)$/i;
  const beatMatch = prompt.match(beatAnchorRegex);
  if (beatMatch) {
    const elementType = beatMatch[1].toLowerCase().trim();
    const explicitText = beatMatch[2]?.replace(/["']/g, "").trim();
    const beatRole = beatMatch[3].toLowerCase().trim();

    const beatRes = findBeatByRoleOrKeyword(beatRole, context.scriptBeats);
    if (!beatRes.matched || beatRes.start === undefined) {
      return {
        matched: true,
        error: `Storytelling beat "${beatRole}" was not found in the script beat sheet.`,
      };
    }

    const onsetTime = beatRes.start;
    const duration = Math.min(3.0, (beatRes.end ?? onsetTime + 3.0) - onsetTime);
    const end = Math.min(context.duration, Number((onsetTime + Math.max(1.0, duration)).toFixed(2)));

    const placement = findNonOverlappingPlacement({
      elementSize: { width: 45, height: 15 },
      safeZones: context.safeZones,
      playheadTime: onsetTime,
      defaultPosition: { x: 50, y: 30 },
    });

    const displayText = explicitText || beatRole.toUpperCase();

    const matchedConfig = GRAPHIC_CONFIGS.find(
      (c) =>
        c.compositionId === elementType ||
        elementType.includes(c.compositionId) ||
        c.triggers.some((t) => elementType === t || elementType.includes(t))
    );

    const compositionId = matchedConfig ? matchedConfig.compositionId : "pop_up_badge";
    const props = matchedConfig
      ? { ...matchedConfig.props }
      : { text: displayText, variant: "warning" };
    const name = matchedConfig ? matchedConfig.name : displayText;

    const operation: EditOperation = {
      type: "add_element",
      track: "graphic",
      element: {
        id: `graphic-${Date.now()}`,
        name,
        compositionId,
        props,
        start: onsetTime,
        end: end <= onsetTime ? onsetTime + 3.0 : end,
        position: placement.position,
        positionX: placement.position.x,
        positionY: placement.position.y,
        scale: 1.0,
        isUserLocked: false,
      },
    };

    return {
      matched: true,
      operation,
      description: `Add ${elementType} anchored to ${beatRole.toUpperCase()} beat at ${onsetTime.toFixed(2)}s`,
    };
  }

  // 1. ADD TITLE / CAPTION
  // Patterns:
  // "add a title that says Welcome"
  // "add title 'Hello World'"
  // "add a title Welcome"
  // "add caption saying Welcome"
  // "add text 'Breaking News'"
  // "add a title from 01:20 to 01:25"
  // "add a title 'Welcome' from 01:20 to 01:25"
  const promptToTest = timeRange.cleanedPrompt || prompt;
  const isMotionOrCounter = /\b(?:animated|motion|counter|reveal|kpi|badge|ticker)\b/i.test(promptToTest) || /\b(?:animated|motion|counter|reveal|kpi|badge|ticker)\b/i.test(prompt);
  const titleRegex = /add (?:a )?(?:title|caption|text)(?: that says| saying| with text)?(?:\s+["']?([^"']+)["']?)?$/i;
  const titleMatch = promptToTest.match(titleRegex) || prompt.match(titleRegex);
  if (!isMotionOrCounter && titleMatch) {
    const rawText = titleMatch[1]?.replace(/["']/g, "").trim().replace(/[.!?]+$/, "");
    const textContent = rawText && rawText.length > 0 ? rawText : "Title";

    const start = timeRange.start ?? context.playheadTime;
    const defaultEnd = Number((start + 3.0).toFixed(2));
    const end = timeRange.end ?? Math.min(context.duration, defaultEnd);

    // Calculate subject avoidance placement if safe zones exist
    const placement = findNonOverlappingPlacement({
      elementSize: { width: 50, height: 14 },
      safeZones: context.safeZones,
      playheadTime: start,
      defaultPosition: { x: 50, y: 75 },
    });

    const operation: EditOperation = {
      type: "add_element",
      track: "caption",
      element: {
        id: `caption-${Date.now()}`,
        text: textContent,
        start,
        end: end <= start ? start + 3.0 : end,
        stylePreset: "tiktok_yellow",
        position: placement.position,
        positionX: placement.position.x,
        positionY: placement.position.y,
        scale: 1.0,
      },
    };

    const descriptionSuffix = placement.isAvoided ? ` (placed in ${placement.region} safe zone)` : "";
    const timingDesc = timeRange.isExplicitRange
      ? `from ${start.toFixed(1)}s to ${end.toFixed(1)}s`
      : `at ${start.toFixed(1)}s`;

    return {
      matched: true,
      operation,
      description: `Add title "${textContent}" ${timingDesc}${descriptionSuffix}`,
    };
  }

  // 2. MAKE BIGGER / INCREASE SCALE
  // Patterns: "make the selected element bigger", "make bigger", "increase size", "scale up", "enlarge"
  const biggerRegex = /\b(?:make|scale|resize|increase).*(?:bigger|larger|increase|up)\b|\b(?:enlarge|scale up|bigger)\b/i;
  if (biggerRegex.test(cleanPrompt)) {
    if (!context.selectedItem || !context.selectedItem.element) {
      return {
        matched: true,
        error: "Please select an element first.",
      };
    }

    const { type, id, element } = context.selectedItem;
    if (type === "audio") {
      return {
        matched: true,
        error: "Cannot resize audio tracks.",
      };
    }

    const currentScale = (element as any).scale ?? 1.0;
    const newScale = Number(Math.min(3.0, currentScale * 1.25).toFixed(2));

    const operation: EditOperation = {
      type: "resize_element",
      targetId: id,
      targetType: type as "video" | "broll" | "caption" | "graphic",
      scale: newScale,
    };

    return {
      matched: true,
      operation,
      description: `Increase scale of ${type} to ${newScale}x`,
    };
  }

  // 3. MAKE SMALLER / DECREASE SCALE
  // Patterns: "make the selected element smaller", "make smaller", "decrease size", "scale down"
  const smallerRegex = /\b(?:make|scale|resize|decrease).*(?:smaller|decrease|down)\b|\b(?:shrink|scale down|smaller)\b/i;
  if (smallerRegex.test(cleanPrompt)) {
    if (!context.selectedItem || !context.selectedItem.element) {
      return {
        matched: true,
        error: "Please select an element first.",
      };
    }

    const { type, id, element } = context.selectedItem;
    if (type === "audio") {
      return {
        matched: true,
        error: "Cannot resize audio tracks.",
      };
    }

    const currentScale = (element as any).scale ?? 1.0;
    const newScale = Number(Math.max(0.2, currentScale * 0.8).toFixed(2));

    const operation: EditOperation = {
      type: "resize_element",
      targetId: id,
      targetType: type as "video" | "broll" | "caption" | "graphic",
      scale: newScale,
    };

    return {
      matched: true,
      operation,
      description: `Decrease scale of ${type} to ${newScale}x`,
    };
  }

  // 4. MOVE / REPOSITION
  // Patterns: "move the selected element to the right", "move right", "move left", "move up", "move down", "center it"
  const moveRightRegex = /\b(?:move|shift|nudge).*(?:to the )?right\b/i;
  const moveLeftRegex = /\b(?:move|shift|nudge).*(?:to the )?left\b/i;
  const moveUpRegex = /\b(?:move|shift|nudge).*(?:to the )?(?:up|higher|top)\b/i;
  const moveDownRegex = /\b(?:move|shift|nudge).*(?:to the )?(?:down|lower|bottom)\b/i;
  const moveCenterRegex = /\b(?:center|move to center|middle)\b/i;

  if (
    moveRightRegex.test(cleanPrompt) ||
    moveLeftRegex.test(cleanPrompt) ||
    moveUpRegex.test(cleanPrompt) ||
    moveDownRegex.test(cleanPrompt) ||
    moveCenterRegex.test(cleanPrompt)
  ) {
    if (!context.selectedItem || !context.selectedItem.element) {
      return {
        matched: true,
        error: "Please select an element first.",
      };
    }

    const { type, id, element } = context.selectedItem;
    if (type === "audio") {
      return {
        matched: true,
        error: "Cannot move audio tracks spatially.",
      };
    }

    const currentX = (element as any).position?.x ?? (element as any).positionX ?? 50;
    const currentY = (element as any).position?.y ?? (element as any).positionY ?? 50;

    let targetX = currentX;
    let targetY = currentY;

    if (moveRightRegex.test(cleanPrompt)) {
      targetX = Math.min(100, currentX + 10);
    } else if (moveLeftRegex.test(cleanPrompt)) {
      targetX = Math.max(0, currentX - 10);
    } else if (moveUpRegex.test(cleanPrompt)) {
      targetY = Math.max(0, currentY - 10);
    } else if (moveDownRegex.test(cleanPrompt)) {
      targetY = Math.min(100, currentY + 10);
    } else if (moveCenterRegex.test(cleanPrompt)) {
      targetX = 50;
      targetY = type === "caption" ? 75 : 50;
    }

    const operation: EditOperation = {
      type: "move_element",
      targetId: id,
      targetType: type as "video" | "broll" | "caption" | "graphic",
      position: { x: targetX, y: targetY },
      isUserLocked: true,
    };

    return {
      matched: true,
      operation,
      description: `Move ${type} to (${targetX}%, ${targetY}%)`,
    };
  }

  // 5. SPLIT CLIP
  // Patterns: "split clip", "split here", "split at playhead", "cut here", "cut clip"
  const splitRegex = /\b(?:split|cut|slice)(?:\s+(?:this|the|selected)?\s*(?:clip|video|track))?\b|\bcut here\b/i;
  if (splitRegex.test(cleanPrompt)) {
    // If an element is selected, use it. Otherwise, look for an active video/broll clip at the playhead.
    let targetId: string | null = null;
    let targetType: "video" | "broll" | "caption" | "audio" | "graphic" | null = null;
    let clipBounds: { start: number; end: number } | null = null;

    if (context.selectedItem && context.selectedItem.element) {
      targetId = context.selectedItem.id;
      targetType = context.selectedItem.type as any;
      clipBounds = {
        start: (context.selectedItem.element as any).start,
        end: (context.selectedItem.element as any).end,
      };
    } else if (context.activeElements.activeVideo) {
      targetId = context.activeElements.activeVideo.id;
      targetType = "video";
      clipBounds = {
        start: context.activeElements.activeVideo.start,
        end: context.activeElements.activeVideo.end,
      };
    } else if (context.activeElements.activeBroll) {
      targetId = context.activeElements.activeBroll.id;
      targetType = "broll";
      clipBounds = {
        start: context.activeElements.activeBroll.start,
        end: context.activeElements.activeBroll.end,
      };
    }

    if (!targetId || !targetType || !clipBounds) {
      return {
        matched: true,
        error: "Please select a clip to split or position playhead over a clip.",
      };
    }

    const targetSplitTime = timeRange.splitTime ?? context.playheadTime;
    if (
      targetSplitTime <= clipBounds.start + 0.1 ||
      targetSplitTime >= clipBounds.end - 0.1
    ) {
      return {
        matched: true,
        error: `Split time (${targetSplitTime.toFixed(1)}s) is outside the body of clip [${clipBounds.start.toFixed(1)}s - ${clipBounds.end.toFixed(1)}s]. Move playhead or specify a time inside the clip.`,
      };
    }

    const operation: EditOperation = {
      type: "split_clip",
      targetId,
      targetType,
      splitTime: targetSplitTime,
    };

    return {
      matched: true,
      operation,
      description: `Split ${targetType} at ${targetSplitTime.toFixed(2)}s`,
    };
  }

  // 6. DELETE ELEMENT
  // Patterns: "delete selected element", "delete this", "remove selected clip", "delete clip"
  const deleteRegex = /\b(?:delete|remove)\s+(?:this|the|selected)?\s*(?:element|clip|item|card|caption)?\b/i;
  if (deleteRegex.test(cleanPrompt)) {
    if (!context.selectedItem || !context.selectedItem.element) {
      return {
        matched: true,
        error: "Please select an element first.",
      };
    }

    const { type, id } = context.selectedItem;
    const operation: EditOperation = {
      type: "delete_element",
      targetId: id,
      targetType: type,
      ripple: type === "video",
    };

    return {
      matched: true,
      operation,
      description: `Delete ${type} (${id})`,
    };
  }

  // 7. ADD MOTION GRAPHIC ELEMENT
  // Patterns:
  // "add motion graphics for a rising graphs animation", "add rising graph", "add chart",
  // "add counter", "add animated counter", "add kpi", "add arrow", "add stat card", "add terminal",
  // "add candlestick hud", "add compound growth curve", "add banking notification", etc.
  const graphicConfigs = GRAPHIC_CONFIGS;

  const testGraphicPrompt = (timeRange.cleanedPrompt || prompt).toLowerCase().trim();
  const isAddOrOverlay = /\b(?:add|insert|overlay|place|put|create)\b/i.test(testGraphicPrompt);
  const isSemanticSearch = /\b(?:find\s+(?:the\s+)?part|search\s+for|where\s+i\s+discuss)\b/i.test(testGraphicPrompt);

  if (isAddOrOverlay && !isSemanticSearch) {
    let bestMatchConfig: GraphicConfig | null = null;
    let longestTriggerLength = 0;

    for (const config of graphicConfigs) {
      for (const t of config.triggers) {
        const regex = new RegExp(
          `\\b(?:add|insert|overlay|place|put|create)\\s+(?:(?:a|an|the)\\s+)?(?:(?:motion\\s*graphic(?:s)?(?:\\s+(?:for|of)(?:\\s+(?:a|an|the))?)?|animated|visual|[a-z]+)\\s+)?\\b${t}\\b`,
          "i"
        );
        const wordRegex = new RegExp(`\\b${t}\\b`, "i");
        const isMatched =
          regex.test(testGraphicPrompt) ||
          (wordRegex.test(testGraphicPrompt) && /\b(?:motion\s*graphic|animation|animat\w*)\b/i.test(testGraphicPrompt));

        if (isMatched && t.length > longestTriggerLength) {
          longestTriggerLength = t.length;
          bestMatchConfig = config;
        }
      }
    }

    if (bestMatchConfig) {
      const config = bestMatchConfig;
      const start = timeRange.start ?? context.playheadTime;
      const defaultEnd = Number((start + 4.0).toFixed(2));
      const effectiveDuration = Math.max(context.duration, timeRange.end ?? 0);
      const end = timeRange.end ?? (effectiveDuration > 0 ? Math.min(effectiveDuration, defaultEnd) : defaultEnd);

      const finalProps = { ...config.props };
      let defaultPos = { x: 50, y: 50 };

      if (config.compositionId === "hero_reveal") {
        const sayingMatch =
          prompt.match(/(?:saying|titled|with text)\s+['"]([^'"]+)['"]/i) ||
          prompt.match(/(?:saying|titled|with text)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:from|to|between|at)|$)/i);
        if (sayingMatch) {
          finalProps.headline = sayingMatch[1].trim();
        }
        const colorMatch = prompt.match(/\b(blue|cyan|emerald|green|amber|yellow|rose|red|purple|indigo)\b/i);
        if (colorMatch) {
          finalProps.colorTheme = colorMatch[1].toLowerCase();
        }
      } else if (config.compositionId === "animated_counter") {
        const searchPrompt = timeRange.cleanedPrompt || prompt;
        const countMatch =
          searchPrompt.match(/(?:counting\s+to|reach(?:ing)?(?:\s+to)?)\s+(\d+(?:\.\d+)?)\s*(k|m|b)?/i) ||
          searchPrompt.match(/\bto\s+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i) ||
          searchPrompt.match(/\bto\s+(\d+(?:\.\d+)?)\b/i);
        if (countMatch) {
          let num = parseFloat(countMatch[1]);
          const mult = (countMatch[2] || "").toLowerCase();
          if (mult === "k") num *= 1000;
          else if (mult === "m") num *= 1000000;
          else if (mult === "b") num *= 1000000000;
          finalProps.to = Math.round(num);
          finalProps.from = 0;
        }
        if (/subscriber/i.test(prompt)) {
          finalProps.label = "SUBSCRIBERS";
        } else if (/follower/i.test(prompt)) {
          finalProps.label = "FOLLOWERS";
        }
      } else if (config.compositionId === "lower-third") {
        defaultPos = { x: 50, y: 82 };
        const nameMatch =
          prompt.match(/(?:for|named|speaker|name)\s+['"]([^'"]+)['"]/i) ||
          prompt.match(/(?:for|named|speaker|name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (nameMatch) {
          finalProps.name = nameMatch[1].trim();
        }
        const handleMatch = prompt.match(/(@[a-zA-Z0-9_]+)/);
        if (handleMatch) {
          finalProps.handle = handleMatch[1].trim();
        }
      } else if (config.compositionId === "countdown-timer") {
        const secMatch = prompt.match(/\b(\d+)\s*(?:seconds|second|secs|sec|s)\b/i);
        if (secMatch) {
          finalProps.seconds = Math.max(1, Math.min(60, parseInt(secMatch[1], 10)));
        }
      } else if (config.compositionId === "review-card") {
        const ratingMatch = prompt.match(/(\d+)\s*star/i);
        if (ratingMatch) {
          finalProps.rating = Math.max(1, Math.min(5, parseInt(ratingMatch[1], 10)));
        }
      } else if (config.compositionId === "subscribe-badge") {
        defaultPos = { x: 50, y: 80 };
      } else if (config.compositionId === "candlestick-hud") {
        const tickerMatch =
          prompt.match(/\b(BTC|ETH|SOL|NVDA|TSLA|AAPL|SPY|QQQ|DOGE|XRP)\b/i) ||
          prompt.match(/(?:ticker|coin|symbol|asset|stock)\s+([A-Z0-9/]+)/i);
        if (tickerMatch) {
          finalProps.ticker = tickerMatch[1].toUpperCase().includes("/")
            ? tickerMatch[1].toUpperCase()
            : `${tickerMatch[1].toUpperCase()}/USDT`;
        }
        const priceMatch = prompt.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
        if (priceMatch) {
          finalProps.price = `$${priceMatch[1]}`;
        }
      } else if (config.compositionId === "compound-growth-curve") {
        const yearsMatch = prompt.match(/(\d+)\s*(?:years|year|yr|yrs)/i);
        if (yearsMatch) {
          finalProps.years = parseInt(yearsMatch[1], 10);
        }
        const multMatch = prompt.match(/(\d+(?:\.\d+)?)\s*x\b/i);
        if (multMatch) {
          finalProps.multiplier = `${multMatch[1]}x`;
        }
        const principalMatch = prompt.match(/(?:from|principal|invest(?:ing)?)\s*\$([0-9,]+)/i);
        if (principalMatch) {
          finalProps.principal = `$${principalMatch[1]}`;
        }
      } else if (config.compositionId === "banking-notification") {
        defaultPos = { x: 50, y: 22 };
        const amtMatch = prompt.match(/\+\$([0-9,]+(?:\.[0-9]{2})?)/) || prompt.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
        if (amtMatch) {
          finalProps.amount = amtMatch[0].startsWith("+") ? amtMatch[0] : `+${amtMatch[0]}`;
        }
        const bankMatch = prompt.match(/(?:from|bank)\s+(chase|wells fargo|stripe|paypal|revolut|barclays|mercury)/i);
        if (bankMatch) {
          finalProps.bankName = bankMatch[1].toUpperCase();
        }
      } else if (config.compositionId === "inflation-cash-burn") {
        const lossMatch = prompt.match(/(?:lost|loss|burned)\s*\$?([0-9,]+)/i);
        if (lossMatch) {
          finalProps.lossAmount = `-$${lossMatch[1]}`;
        }
      } else if (config.compositionId === "debt-payoff-tracker") {
        const debtMatch = prompt.match(/(?:debt of|total debt)\s*\$([0-9,]+)/i);
        if (debtMatch) {
          finalProps.totalDebt = `$${debtMatch[1]}`;
        }
        const progressMatch = prompt.match(/(\d+)%\s*(?:paid|complete|progress)/i);
        if (progressMatch) {
          finalProps.progress = parseInt(progressMatch[1], 10);
        }
      } else if (config.compositionId === "roi-balance-scale") {
        const roiMatch = prompt.match(/(\d+(?:\.\d+)?)\s*x\s*roi/i);
        if (roiMatch) {
          finalProps.roiMultiplier = `${roiMatch[1]}x ROI`;
        }
      }

      let position = defaultPos;
      if (context.safeZones && context.safeZones.length > 0) {
        const placement = findNonOverlappingPlacement({
          elementSize: { width: 50, height: 16 },
          safeZones: context.safeZones,
          playheadTime: start,
          defaultPosition: defaultPos,
        });
        position = placement.position;
      }

      const operation: EditOperation = {
        type: "add_element",
        track: "graphic",
        element: {
          id: `graphic-${Date.now()}`,
          name: config.name,
          compositionId: config.compositionId,
          props: finalProps,
          start,
          end: end <= start ? start + 4.0 : end,
          position,
          positionX: position.x,
          positionY: position.y,
          scale: 1.0,
          rotation: 0,
        },
      };

      const timingDesc = timeRange.isExplicitRange
        ? `from ${start.toFixed(1)}s to ${end.toFixed(1)}s`
        : `at ${start.toFixed(1)}s`;

      return {
        matched: true,
        operation,
        description: `Add graphic ${config.compositionId} ${timingDesc}`,
      };
    }
  }

  // 7.4.5. ADD VISUAL EFFECTS & COLOR FILTERS
  // Patterns:
  // "Add vignette effect at 2s"
  // "Add golden hour effect from 3s to 8s"
  // "Add lens flare effect at 5s"
  // "Add night vision effect"
  // "Add flash burst effect"
  const isAudioPrompt = /\b(?:sound\s*effect|sfx|audio\s*cue|audio|whoosh|swoosh|pop|ding|chime|click|tap|riser|impact|thump)\b/i.test(cleanPrompt);
  const visualFxRegex = /\b(?:add|insert|apply|overlay)\s+(?:a\s+)?(?:cinematic\s+|subtle\s+)?(vignette|golden\s*hour|sunset|lens\s*flare|anamorphic|vintage\s*film|8mm|flash(?:\s*burst)?|strobe|zoom\s*blur|radial\s*blur|crt|arcade|halftone|comic(?:\s*pop)?|prism(?:\s*bokeh)?|bokeh|night\s*vision|infrared|tactical|glitch|teal\s*(?:and|&)?\s*orange|vhs|scanlines|neon|noir|bw)(?:\s+(?:visual\s*effect|filter|fx|effect|overlay|look))?\b/i;

  if (!isAudioPrompt && visualFxRegex.test(cleanPrompt)) {
    const match = cleanPrompt.match(visualFxRegex);
    const rawKey = (match ? match[1] : "").toLowerCase().replace(/\s+/g, "_");

    const FX_MAP: Record<string, { id: string; name: string; effectType: string; duration: number }> = {
      vignette: { id: "fx-cinematic-vignette", name: "Cinematic Vignette", effectType: "vignette", duration: 5.0 },
      golden_hour: { id: "fx-golden-hour-glow", name: "Golden Hour Glow", effectType: "golden_hour", duration: 4.5 },
      sunset: { id: "fx-golden-hour-glow", name: "Golden Hour Glow", effectType: "golden_hour", duration: 4.5 },
      lens_flare: { id: "fx-anamorphic-lens-flare", name: "Anamorphic Lens Flare", effectType: "lens_flare", duration: 3.0 },
      anamorphic: { id: "fx-anamorphic-lens-flare", name: "Anamorphic Lens Flare", effectType: "lens_flare", duration: 3.0 },
      vintage_film: { id: "fx-8mm-vintage-film", name: "8mm Vintage Film Burn", effectType: "vintage_film", duration: 4.0 },
      "8mm": { id: "fx-8mm-vintage-film", name: "8mm Vintage Film Burn", effectType: "vintage_film", duration: 4.0 },
      flash: { id: "fx-strobe-flash-burst", name: "Strobe Flash Burst", effectType: "flash_burst", duration: 1.2 },
      flash_burst: { id: "fx-strobe-flash-burst", name: "Strobe Flash Burst", effectType: "flash_burst", duration: 1.2 },
      strobe: { id: "fx-strobe-flash-burst", name: "Strobe Flash Burst", effectType: "flash_burst", duration: 1.2 },
      zoom_blur: { id: "fx-radial-zoom-blur", name: "Radial Zoom Blur", effectType: "zoom_blur", duration: 2.0 },
      radial_blur: { id: "fx-radial-zoom-blur", name: "Radial Zoom Blur", effectType: "zoom_blur", duration: 2.0 },
      crt: { id: "fx-crt-arcade-retro", name: "CRT Arcade Phosphor", effectType: "crt_arcade", duration: 4.0 },
      arcade: { id: "fx-crt-arcade-retro", name: "CRT Arcade Phosphor", effectType: "crt_arcade", duration: 4.0 },
      halftone: { id: "fx-halftone-comic-pop", name: "Comic Pop Halftone", effectType: "halftone_comic", duration: 3.0 },
      comic: { id: "fx-halftone-comic-pop", name: "Comic Pop Halftone", effectType: "halftone_comic", duration: 3.0 },
      comic_pop: { id: "fx-halftone-comic-pop", name: "Comic Pop Halftone", effectType: "halftone_comic", duration: 3.0 },
      prism: { id: "fx-prism-bokeh-rainbow", name: "Prismatic Rainbow Bokeh", effectType: "prism_bokeh", duration: 4.5 },
      prism_bokeh: { id: "fx-prism-bokeh-rainbow", name: "Prismatic Rainbow Bokeh", effectType: "prism_bokeh", duration: 4.5 },
      bokeh: { id: "fx-prism-bokeh-rainbow", name: "Prismatic Rainbow Bokeh", effectType: "prism_bokeh", duration: 4.5 },
      night_vision: { id: "fx-night-vision-tactical", name: "Tactical Night Vision", effectType: "night_vision", duration: 5.0 },
      infrared: { id: "fx-night-vision-tactical", name: "Tactical Night Vision", effectType: "night_vision", duration: 5.0 },
      tactical: { id: "fx-night-vision-tactical", name: "Tactical Night Vision", effectType: "night_vision", duration: 5.0 },
      glitch: { id: "fx-rgb-glitch", name: "RGB Glitch Split", effectType: "rgb_glitch", duration: 2.5 },
      teal_orange: { id: "fx-cinematic-teal-orange", name: "Teal & Orange Grade", effectType: "teal_orange", duration: 5.0 },
      vhs: { id: "fx-vhs-scanlines", name: "Retro VHS Scanlines", effectType: "vhs_scanlines", duration: 4.0 },
      scanlines: { id: "fx-vhs-scanlines", name: "Retro VHS Scanlines", effectType: "vhs_scanlines", duration: 4.0 },
      neon: { id: "fx-cyberpunk-neon", name: "Cyberpunk Neon Glow", effectType: "cyberpunk_neon", duration: 3.5 },
      noir: { id: "fx-bw-noir", name: "Black & White Noir", effectType: "bw_noir", duration: 5.0 },
      bw: { id: "fx-bw-noir", name: "Black & White Noir", effectType: "bw_noir", duration: 5.0 },
    };

    const fxKey = Object.keys(FX_MAP).find((k) => rawKey.includes(k)) || "vignette";
    const fxItem = FX_MAP[fxKey] || FX_MAP.vignette;

    const timeRange = extractTimeRangeFromPrompt(cleanPrompt, context.fps || 30);
    const start = timeRange.start !== undefined ? Math.max(0, timeRange.start) : context.playheadTime;
    const end = timeRange.end !== undefined && timeRange.end > start
      ? timeRange.end
      : Number((start + fxItem.duration).toFixed(3));

    const operation: EditOperation = {
      type: "add_element",
      track: "graphic",
      element: {
        id: `fx-${Date.now()}`,
        name: fxItem.name,
        compositionId: "effect_overlay",
        props: {
          effectType: fxItem.effectType,
          intensity: 80,
        },
        start,
        end,
        position: { x: 50, y: 50 },
        positionX: 50,
        positionY: 50,
        scale: 1.0,
        rotation: 0,
      },
    };

    return {
      matched: true,
      operation,
      description: `Add effect ${fxItem.name} from ${start.toFixed(1)}s to ${end.toFixed(1)}s`,
    };
  }

  // 7.5. ADD AUDIO SFX / SOUND ACCENTS
  // Patterns:
  // "Add a subtle whoosh sound when the headline enters between 00:12 and 00:13"
  // "Add a subtle whoosh when the headline enters between 00:12 and 00:13"
  // "Add cash register sound when banking notification appears"
  // "Add impact sound when debt payoff enters"
  // "Add subtle whoosh at candlestick hud"
  // "Add whoosh sound effect at 12s"
  // "Add pop sfx between 1.0 and 1.5"
  // "Add chime sound effect"
  const sfxKeywords = "cash\\s*register|whoosh|swoosh|pop|ding|chime|click|tap|riser|sweep|impact|thump|stamp|glitch|zap|camera|shutter|coin(?:s)?|money|cash|register|fire|sizzle|clink|creak";
  const sfxRegex = new RegExp(
    `\\b(?:add|insert|put|play)\\s+(?:a\\s+)?(?:subtle\\s+|soft\\s+|loud\\s+|quick\\s+)?(${sfxKeywords})(?:\\s+(?:sound\\s*effect|sound|effect|sfx|cue))?\\b`,
    "i"
  );
  const genericSfxRegex = /\b(?:add|insert|put|play)\s+(?:a\s+)?(?:sound\s*effect|sfx|audio\s*cue)\s*(?:named|called)?\s*([a-zA-Z_-]+)?\b/i;

  const isBgmPrompt = /\b(?:background\s*music|bgm|soundtrack|chill\s*music|lofi\s*music|ambient\s*music)\b/i.test(cleanPrompt);

  if (!isBgmPrompt && (sfxRegex.test(cleanPrompt) || genericSfxRegex.test(cleanPrompt))) {
    const sfxMatch = cleanPrompt.match(sfxRegex);
    const genericMatch = cleanPrompt.match(genericSfxRegex);
    const rawSoundName = (sfxMatch ? sfxMatch[1] : (genericMatch ? genericMatch[1] : "pop"))?.toLowerCase() || "pop";

    const SFX_ASSET_MAP: Record<string, { name: string; url: string; duration: number }> = {
      "cash register": { name: "Cash Register SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      cash: { name: "Cash Register SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      register: { name: "Cash Register SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      coin: { name: "Coin Drop SFX", url: "/assets/audio/chime.mp3", duration: 0.6 },
      coins: { name: "Coin Drop SFX", url: "/assets/audio/chime.mp3", duration: 0.6 },
      money: { name: "Cash SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      whoosh: { name: "Whoosh SFX", url: "/assets/audio/whoosh.mp3", duration: 1.0 },
      swoosh: { name: "Whoosh SFX", url: "/assets/audio/whoosh.mp3", duration: 1.0 },
      pop: { name: "Pop SFX", url: "/assets/audio/pop.mp3", duration: 0.5 },
      ding: { name: "Chime SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      chime: { name: "Chime SFX", url: "/assets/audio/chime.mp3", duration: 0.8 },
      click: { name: "Click SFX", url: "/assets/audio/click.mp3", duration: 0.3 },
      tap: { name: "Click SFX", url: "/assets/audio/click.mp3", duration: 0.3 },
      riser: { name: "Riser SFX", url: "/assets/audio/riser.mp3", duration: 1.5 },
      sweep: { name: "Riser Sweep SFX", url: "/assets/audio/riser.mp3", duration: 1.5 },
      impact: { name: "Impact SFX", url: "/assets/audio/impact.mp3", duration: 1.0 },
      thump: { name: "Impact SFX", url: "/assets/audio/impact.mp3", duration: 0.8 },
      stamp: { name: "Stamp Thud SFX", url: "/assets/audio/impact.mp3", duration: 0.7 },
      fire: { name: "Fire Sizzle SFX", url: "/assets/audio/whoosh.mp3", duration: 1.0 },
      sizzle: { name: "Fire Sizzle SFX", url: "/assets/audio/whoosh.mp3", duration: 1.0 },
      clink: { name: "Balance Scale Clink SFX", url: "/assets/audio/click.mp3", duration: 0.4 },
      creak: { name: "Balance Scale SFX", url: "/assets/audio/click.mp3", duration: 0.4 },
      glitch: { name: "Glitch Zap SFX", url: "/assets/audio/whoosh.mp3", duration: 0.6 },
      zap: { name: "Glitch Zap SFX", url: "/assets/audio/whoosh.mp3", duration: 0.6 },
      camera: { name: "Camera Shutter SFX", url: "/assets/audio/click.mp3", duration: 0.5 },
      shutter: { name: "Camera Shutter SFX", url: "/assets/audio/click.mp3", duration: 0.5 },
    };

    const sfxKey = Object.keys(SFX_ASSET_MAP)
      .sort((a, b) => b.length - a.length)
      .find((k) => rawSoundName.includes(k)) || "pop";
    let sfxItem = SFX_ASSET_MAP[sfxKey] || { name: "Pop SFX", url: "/assets/audio/pop.mp3", duration: 0.5 };

    const timeRange = extractTimeRangeFromPrompt(cleanPrompt, context.fps || 30);
    let start = context.playheadTime;
    let end = start + sfxItem.duration;

    if (timeRange.start !== undefined && timeRange.end !== undefined) {
      start = timeRange.start;
      end = timeRange.end;
    } else if (timeRange.start !== undefined) {
      start = timeRange.start;
      end = Number((start + sfxItem.duration).toFixed(3));
    } else {
      // Check if prompt refers to headline/title or motion graphic entrance ("when the headline enters", "when banking notification appears", "at candlestick hud", etc.)
      const graphicTriggerMatch = /(?:headline|title|badge|card|intro|graphic|chart|candlestick|compound|growth|curve|donut|portfolio|inflation|cash\s*burn|burn|banking|notification|waterfall|budget|debt|payoff|scale|balance|roi|flywheel|wealth|battle)/i.test(cleanPrompt);
      const availableGraphics = (context.graphicsElements || context.trackSummary?.graphicsList || []) as any[];
      if (graphicTriggerMatch && availableGraphics.length > 0) {
        const targetGraphic = availableGraphics.find((g: any) => {
          const compId = (g.compositionId || "").toLowerCase();
          const name = (g.name || "").toLowerCase();
          const targetStr = `${compId} ${name}`;
          if (/\b(?:banking|notification)\b/i.test(cleanPrompt) && (targetStr.includes("banking") || targetStr.includes("notification"))) return true;
          if (/\b(?:candlestick|hud)\b/i.test(cleanPrompt) && (targetStr.includes("candlestick") || targetStr.includes("hud"))) return true;
          if (/\b(?:compound|growth|curve)\b/i.test(cleanPrompt) && (targetStr.includes("compound") || targetStr.includes("growth") || targetStr.includes("curve"))) return true;
          if (/\b(?:portfolio|donut)\b/i.test(cleanPrompt) && (targetStr.includes("portfolio") || targetStr.includes("donut"))) return true;
          if (/\b(?:inflation|burn)\b/i.test(cleanPrompt) && (targetStr.includes("inflation") || targetStr.includes("burn"))) return true;
          if (/\b(?:waterfall|budget)\b/i.test(cleanPrompt) && (targetStr.includes("waterfall") || targetStr.includes("budget"))) return true;
          if (/\b(?:debt|payoff)\b/i.test(cleanPrompt) && (targetStr.includes("debt") || targetStr.includes("payoff"))) return true;
          if (/\b(?:scale|balance|roi)\b/i.test(cleanPrompt) && (targetStr.includes("scale") || targetStr.includes("balance") || targetStr.includes("roi"))) return true;
          if (/\b(?:flywheel|wealth)\b/i.test(cleanPrompt) && (targetStr.includes("flywheel") || targetStr.includes("wealth"))) return true;
          if (/\b(?:battle|versus|duel)\b/i.test(cleanPrompt) && (targetStr.includes("battle") || targetStr.includes("versus") || targetStr.includes("duel"))) return true;
          if (/\b(?:headline|title|hero|card|intro)\b/i.test(cleanPrompt) && /(?:headline|title|hero|card|intro)/i.test(targetStr)) return true;
          return false;
        }) || availableGraphics[0];

        if (targetGraphic && typeof targetGraphic.start === "number") {
          start = targetGraphic.start;

          // If a generic sound was requested without explicit sound name, default to the graphic's signature SFX
          if (!sfxMatch && targetGraphic) {
            const comp = (targetGraphic.compositionId || targetGraphic.name || "").toLowerCase();
            let signatureKey = "pop";
            if (comp.includes("banking") || comp.includes("notification")) signatureKey = "cash register";
            else if (comp.includes("candlestick")) signatureKey = "riser";
            else if (comp.includes("compound")) signatureKey = "whoosh";
            else if (comp.includes("portfolio") || comp.includes("donut")) signatureKey = "click";
            else if (comp.includes("inflation") || comp.includes("burn")) signatureKey = "fire";
            else if (comp.includes("waterfall") || comp.includes("budget")) signatureKey = "whoosh";
            else if (comp.includes("debt") || comp.includes("payoff")) signatureKey = "stamp";
            else if (comp.includes("scale") || comp.includes("roi")) signatureKey = "clink";
            else if (comp.includes("flywheel")) signatureKey = "whoosh";
            else if (comp.includes("battle")) signatureKey = "impact";

            if (SFX_ASSET_MAP[signatureKey]) {
              sfxItem = SFX_ASSET_MAP[signatureKey];
            }
          }

          end = Number((start + sfxItem.duration).toFixed(3));
        }
      }
    }

    start = Math.max(0, Number(start.toFixed(3)));
    end = Math.max(start + 0.1, Number(end.toFixed(3)));

    const isSubtle = /\b(?:subtle|soft|quiet)\b/i.test(cleanPrompt);
    const volume = isSubtle ? 65 : 80;

    const operation: EditOperation = {
      type: "add_element",
      track: "audio",
      element: {
        id: `audio-sfx-${Date.now()}`,
        name: isSubtle ? `Subtle ${sfxItem.name}` : sfxItem.name,
        start,
        end,
        sourceUrl: sfxItem.url,
        volume,
        fadeIn: 0,
        fadeOut: 0.05,
        isBgm: false,
      },
    };

    return {
      matched: true,
      operation,
      description: `Add ${isSubtle ? "subtle " : ""}${sfxItem.name} from ${start.toFixed(1)}s to ${end.toFixed(1)}s`,
    };
  }

  // 7.6. ADD BACKGROUND MUSIC / BGM WITH DUCKING
  // Patterns:
  // "Add chill background music and duck it whenever I speak"
  // "Add background music and duck it"
  // "Add chill bgm ducked under speech"
  // "Add background music"
  // "Add chill background music"
  const bgmRegex = /\b(?:add|insert|put|play)\s+(?:a\s+)?(?:(chill|lofi|ambient|calm|soft|upbeat|acoustic)\s+)?(?:background\s*music|bgm|soundtrack|music)\b/i;
  if (bgmRegex.test(cleanPrompt)) {
    const timeRange = extractTimeRangeFromPrompt(cleanPrompt, context.fps || 30);
    const start = timeRange.start !== undefined ? Math.max(0, timeRange.start) : 0;
    const end = timeRange.end !== undefined && timeRange.end > start
      ? timeRange.end
      : Math.max(10.0, context.duration || 30.0);

    const hasDucking = /\b(?:duck(?:ing)?(?:\s+it)?(?:\s+(?:whenever|when)\s+(?:i|someone|speaker)\s+speaks?)?|with\s+(?:speech\s+|narration\s+)?ducking|duck\s+under\s+speech)\b/i.test(cleanPrompt);

    const matchRes = cleanPrompt.match(bgmRegex);
    const mood = (matchRes ? matchRes[1] : "chill")?.toLowerCase() || "chill";
    const titleMood = mood.charAt(0).toUpperCase() + mood.slice(1);

    const operation: EditOperation = {
      type: "add_element",
      track: "audio",
      element: {
        id: `audio-bgm-${Date.now()}`,
        name: `${titleMood} Background Music`,
        start,
        end,
        sourceUrl: "/assets/audio/chill-bgm.mp3",
        volume: hasDucking ? 35 : 50,
        fadeIn: 1.0,
        fadeOut: 1.5,
        isBgm: true,
        ducking: hasDucking,
        duckingDb: hasDucking ? -14.0 : undefined,
      },
    };

    return {
      matched: true,
      operation,
      description: `Add ${mood} background music${hasDucking ? " with -14dB narration ducking" : ""} from ${start.toFixed(1)}s to ${end.toFixed(1)}s`,
    };
  }

  // 8. ADD TRANSITION
  // Patterns: "add crossfade transition between clips", "add transition crossfade", "add wipe transition", "add fade to black transition"
  if (
    cleanPrompt.includes("transition") ||
    /\b(?:crossfade|fade to black|wipe left|wipe right|slide up|zoom in|whip pan)\b/i.test(cleanPrompt)
  ) {
    if (/\b(?:add|insert|apply|put|use)\b/i.test(cleanPrompt)) {
      let preset: "crossfade" | "fade_to_black" | "wipe_left" | "wipe_right" | "slide_up" | "zoom_in" | "whip_pan" = "crossfade";
      if (/fade\s*to\s*black/i.test(cleanPrompt)) preset = "fade_to_black";
      else if (/wipe\s*left/i.test(cleanPrompt)) preset = "wipe_left";
      else if (/wipe\s*right/i.test(cleanPrompt) || /wipe/i.test(cleanPrompt)) preset = "wipe_right";
      else if (/slide\s*up/i.test(cleanPrompt) || /slide/i.test(cleanPrompt)) preset = "slide_up";
      else if (/zoom\s*in/i.test(cleanPrompt) || /zoom/i.test(cleanPrompt)) preset = "zoom_in";
      else if (/whip\s*pan/i.test(cleanPrompt)) preset = "whip_pan";
      else if (/crossfade/i.test(cleanPrompt)) preset = "crossfade";

      const videoClips = context.videoClips || [];
      if (videoClips.length < 2) {
        return {
          matched: true,
          error: "Adding a transition requires at least 2 adjacent clips on the video track.",
        };
      }

      let fromClip = videoClips[0];
      let toClip = videoClips[1];
      for (let i = 0; i < videoClips.length - 1; i++) {
        const c1 = videoClips[i];
        const c2 = videoClips[i + 1];
        if (context.playheadTime >= c1.start && context.playheadTime <= c2.end) {
          fromClip = c1;
          toClip = c2;
          break;
        }
      }

      const operation: EditOperation = {
        type: "add_transition",
        id: `trans-${Date.now()}`,
        track: "video",
        fromClipId: fromClip.id,
        toClipId: toClip.id,
        preset,
        duration: 0.5,
        alignment: "center",
      };

      return {
        matched: true,
        operation,
        description: `Add ${preset} transition between ${fromClip.name || fromClip.id} and ${toClip.name || toClip.id}`,
      };
    }
  }

  // 9. SET AUDIO MIX / VOLUME
  // Patterns: "set volume to 20%", "set background music volume to 20%", "mute audio", "lower volume to 30%"
  const volumeMatch = cleanPrompt.match(/(?:set|change|lower|raise|turn)?\s*(?:the\s+)?(?:music|bgm|audio|clip|video)?\s*volume\s*(?:to\s*)?(\d+)(?:%)?/i);
  const muteMatch = /\bmute(?:\s+(?:the\s+)?(?:music|bgm|audio|clip|video))?\b/i.test(cleanPrompt);

  if (volumeMatch || muteMatch) {
    let volume = 100;
    if (muteMatch) {
      volume = 0;
    } else if (volumeMatch && volumeMatch[1]) {
      volume = Math.max(0, Math.min(100, parseInt(volumeMatch[1], 10)));
    }

    let targetClipId: string | null = null;
    let targetType: string = "audio";

    if (context.selectedItem && (context.selectedItem.type === "audio" || context.selectedItem.type === "video")) {
      targetClipId = context.selectedItem.id;
      targetType = context.selectedItem.type;
    } else if (cleanPrompt.includes("music") || cleanPrompt.includes("bgm") || cleanPrompt.includes("audio")) {
      const audioClips = context.audioClips || [];
      if (audioClips.length > 0) {
        targetClipId = audioClips[0].id;
        targetType = "audio";
      }
    }

    if (!targetClipId) {
      const audioClips = context.audioClips || [];
      if (audioClips.length > 0) {
        targetClipId = audioClips[0].id;
        targetType = "audio";
      } else if (context.activeElements.activeVideo) {
        targetClipId = context.activeElements.activeVideo.id;
        targetType = "video";
      }
    }

    if (!targetClipId) {
      return {
        matched: true,
        error: "No audio or video clip found on the timeline to adjust volume.",
      };
    }

    const isMusic = cleanPrompt.includes("music") || cleanPrompt.includes("bgm");
    const operation: EditOperation = {
      type: "set_audio_mix",
      targetClipId,
      volume,
      ...(isMusic ? { ducking: { enabled: true, thresholdDb: -24, attenuationDb: -14 } } : {}),
    };

    return {
      matched: true,
      operation,
      description: `Set volume of ${targetType} clip (${targetClipId}) to ${volume}%`,
    };
  }

  // 10. KINETIC CAPTIONS STYLER (Phase 6)
  // Supports:
  // "apply tiktok caption style"
  // "change caption style to tiktok_yellow"
  // "switch subtitles to hormozi bold"
  // "apply hormozi caption style"
  // "style captions clean white"
  // "switch captions to neon glow"
  // "apply neon glow caption style"
  const isCaptionStyleIntent =
    (/\b(?:caption|captions|subtitle|subtitles)\b/i.test(cleanPrompt) &&
      /\b(?:tiktok|hormozi|clean|neon|yellow|bold|white|glow|cyber|style|preset|look|theme|karaoke|gradient|boxed|pill|comic|pop|fire|blaze|minimal)\b/i.test(cleanPrompt)) ||
    /\b(?:apply|change|switch|set|use)\s+.*?\b(tiktok|hormozi|clean|neon|karaoke|gradient|boxed|pill|comic|pop|fire|blaze|minimal)\b/i.test(cleanPrompt);

  if (isCaptionStyleIntent) {
    let preset: CaptionPreset | null = null;
    if (/\btik\s*tok/i.test(cleanPrompt) || /tiktok_yellow/i.test(cleanPrompt) || /yellow/i.test(cleanPrompt)) {
      preset = "tiktok_yellow";
    } else if (/\bhormozi/i.test(cleanPrompt) || /hormozi_bold/i.test(cleanPrompt)) {
      preset = "hormozi_bold";
    } else if (/\bclean/i.test(cleanPrompt) || /clean_white/i.test(cleanPrompt) || /\bminimal_white/i.test(cleanPrompt)) {
      preset = "clean_white";
    } else if (/\bneon/i.test(cleanPrompt) || /neon_glow/i.test(cleanPrompt) || /\bcyber/i.test(cleanPrompt) || /\bglow/i.test(cleanPrompt)) {
      preset = "neon_glow";
    } else if (/\bkaraoke/i.test(cleanPrompt) || /karaoke_gradient/i.test(cleanPrompt)) {
      preset = "karaoke_gradient";
    } else if (/\b(minimal_boxed|minimal\s+boxed|podcast)\b/i.test(cleanPrompt)) {
      preset = "minimal_boxed";
    } else if (/\b(boxed_pill|boxed\s+pill|pill)\b/i.test(cleanPrompt) || (/\bboxed\b/i.test(cleanPrompt) && !/minimal/i.test(cleanPrompt))) {
      preset = "boxed_pill";
    } else if (/\b(comic_pop|comic|pop)\b/i.test(cleanPrompt)) {
      preset = "comic_pop";
    } else if (/\b(fire_gradient|fire|blaze)\b/i.test(cleanPrompt)) {
      preset = "fire_gradient";
    }

    if (preset) {
      // 1. If a single caption is currently selected, update only that caption
      if (context.selectedItem && context.selectedItem.type === "caption") {
        const operation: EditOperation = {
          type: "update_properties",
          targetId: context.selectedItem.id,
          targetType: "caption",
          properties: { stylePreset: preset },
        };
        return {
          matched: true,
          operation,
          description: `Applied ${preset.replace(/_/g, " ")} style to selected caption (${context.selectedItem.id})`,
        };
      }

      // 2. Otherwise update all captions in the text track
      const existingCaptions = context.textTrack || (context.trackSummary?.captionsList as any[]) || [];
      if (existingCaptions.length > 0) {
        const subOps: EditOperation[] = existingCaptions.map((c) => ({
          type: "update_properties",
          targetId: c.id,
          targetType: "caption",
          properties: { stylePreset: preset },
        }));

        const operation: EditOperation = {
          type: "batch",
          operations: subOps,
          description: `Apply ${preset.replace(/_/g, " ")} caption style across timeline`,
        };

        return {
          matched: true,
          operation,
          description: `Applied ${preset.replace(/_/g, " ")} style across ${subOps.length} captions`,
        };
      }

      // 3. If no captions exist but transcript words exist, generate kinetic captions from transcript
      const words = context.transcriptWords || [];
      if (words.length > 0) {
        const subOps: EditOperation[] = [];
        const chunkSize = 4;
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize);
          const phrase = chunk.map((w) => w.word).join(" ");
          const start = chunk[0].start;
          const end = chunk[chunk.length - 1].end;
          subOps.push({
            type: "add_element",
            track: "caption",
            element: {
              id: `caption-gen-${Date.now()}-${i}`,
              text: phrase,
              start,
              end,
              stylePreset: preset,
              position: { x: 50, y: 75 },
              scale: 1.0,
            },
          });
        }

        const operation: EditOperation = {
          type: "batch",
          operations: subOps,
          description: `Generate ${preset.replace(/_/g, " ")} captions from transcript across video`,
        };

        return {
          matched: true,
          operation,
          description: `Generated ${subOps.length} ${preset.replace(/_/g, " ")} captions from transcript`,
        };
      }
    }
  }

  // Fallback: Candidate for Tier-2 Cloud LLM Copilot
  return {
    matched: false,
    isCloudCandidate: true,
    description: "Complex prompt requires cloud semantic model",
  };
}
