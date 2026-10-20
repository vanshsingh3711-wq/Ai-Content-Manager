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
  const phraseSyncRegex = /add (?:a )?(badge|graphic|card|title|caption)(?: saying| that says| with text)?(?:\s+["']?([^"']+)["']?)?\s+when i say\s+["']?([^"']+)["']?$/i;
  const phraseSyncMatch = prompt.match(phraseSyncRegex);
  if (phraseSyncMatch) {
    const elementType = phraseSyncMatch[1].toLowerCase();
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
        // badge, graphic, card
        const operation: EditOperation = {
          type: "add_element",
          track: "graphic",
          element: {
            id: `graphic-${Date.now()}`,
            name: displayText.toUpperCase(),
            compositionId: "pop_up_badge",
            props: {
              text: displayText.toUpperCase(),
              variant: "success",
            },
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
  const beatAnchorRegex = /add (?:a )?(badge|graphic|card|title|caption)(?:\s+["']?([^"']+)["']?)?\s+at (?:the )?(hook|intro|cta|call to action|problem|solution|statistic|conclusion)$/i;
  const beatMatch = prompt.match(beatAnchorRegex);
  if (beatMatch) {
    const elementType = beatMatch[1].toLowerCase();
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

    const operation: EditOperation = {
      type: "add_element",
      track: "graphic",
      element: {
        id: `graphic-${Date.now()}`,
        name: displayText,
        compositionId: "pop_up_badge",
        props: {
          text: displayText,
          variant: "warning",
        },
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
  const titleRegex = /add (?:a )?(?:title|caption|text)(?: that says| saying| with text)?(?:\s+["']?([^"']+)["']?)?$/i;
  const titleMatch = promptToTest.match(titleRegex) || prompt.match(titleRegex);
  if (titleMatch) {
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
  // "add counter", "add animated counter", "add kpi", "add arrow", "add stat card", "add terminal", etc.
  const graphicConfigs: Array<{
    triggers: string[];
    compositionId: string;
    name: string;
    props: Record<string, any>;
  }> = [
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
      triggers: ["animated counter", "counter", "ticker", "growth counter"],
      compositionId: "animated_counter",
      name: "COUNTER",
      props: { startValue: 0, endValue: 100, prefix: "+", suffix: "%" },
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
      triggers: ["social post", "tweet", "social", "x.com post"],
      compositionId: "cooked-social-post",
      name: "SOCIAL POST",
      props: { name: "Creator Pro", handle: "@creator_pro", text: "Scaling to the next level 🚀", likes: "18.4K" },
    },
    {
      triggers: ["quote reveal", "quote", "saying", "wisdom"],
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
    {
      triggers: ["stat card", "card", "hero reveal", "headline", "title card"],
      compositionId: "hero_reveal",
      name: "HERO REVEAL",
      props: { title: "ESSENTIAL INSIGHT", label: "KEY TAKEAWAY" },
    },
  ];

  const testGraphicPrompt = (timeRange.cleanedPrompt || prompt).toLowerCase().trim();
  const isAddOrOverlay = /\b(?:add|insert|overlay|place|put|create)\b/i.test(testGraphicPrompt);
  const isSemanticSearch = /\b(?:find\s+(?:the\s+)?part|search\s+for|where\s+i\s+discuss)\b/i.test(testGraphicPrompt);

  if (isAddOrOverlay && !isSemanticSearch) {
    for (const config of graphicConfigs) {
      const matchedTrigger = config.triggers.find((t) => {
        const regex = new RegExp(
          `\\b(?:add|insert|overlay|place|put|create)\\s+(?:(?:a|an|the)\\s+)?(?:(?:motion\\s*graphic(?:s)?(?:\\s+(?:for|of)(?:\\s+(?:a|an|the))?)?|animated|visual)\\s+)?${t}\\b`,
          "i"
        );
        return regex.test(testGraphicPrompt) || (testGraphicPrompt.includes(t) && /\b(?:motion\s*graphic|animation)\b/i.test(testGraphicPrompt));
      });

      if (matchedTrigger) {
        const start = timeRange.start ?? context.playheadTime;
        const defaultEnd = Number((start + 4.0).toFixed(2));
        const end = timeRange.end ?? Math.min(context.duration, defaultEnd);

        const operation: EditOperation = {
          type: "add_element",
          track: "graphic",
          element: {
            id: `graphic-${Date.now()}`,
            name: config.name,
            compositionId: config.compositionId,
            props: { ...config.props },
            start,
            end: end <= start ? start + 4.0 : end,
            position: { x: 50, y: 50 },
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

  // Fallback: Candidate for Tier-2 Cloud LLM Copilot
  return {
    matched: false,
    isCloudCandidate: true,
    description: "Complex prompt requires cloud semantic model",
  };
}
