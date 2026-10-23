import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  normalizeToken,
  tokenSimilarity,
  flattenTranscriptWords,
  findPhraseTimestamp,
  findBeatByRoleOrKeyword,
  getActiveWordAtTimestamp,
  suggestFinanceGraphicForBeat,
} from "../lib/ai/transcript-matcher";
import { TranscriptWord, ScriptBeat, TimelineProject } from "../lib/timeline-types";
import { assembleEditorContext } from "../lib/ai/editor-context";
import { parseLocalCommand } from "../lib/ai/local-command-parser";
import { useTimelineStore } from "../lib/stores/useTimelineStore";
import { TranscriptDrawer } from "../components/editor/TranscriptDrawer";

describe("Phase 10: Transcript & Beat Timing Synchronization", () => {
  const sampleWords: TranscriptWord[] = [
    { word: "Welcome", start: 0.5, end: 1.1, probability: 0.98, chunkId: "ID_01" },
    { word: "to", start: 1.15, end: 1.35, probability: 0.99, chunkId: "ID_01" },
    { word: "the", start: 1.4, end: 1.6, probability: 0.99, chunkId: "ID_01" },
    { word: "future", start: 1.65, end: 2.3, probability: 0.97, chunkId: "ID_01" },
    { word: "of", start: 2.35, end: 2.55, probability: 0.99, chunkId: "ID_01" },
    { word: "automated", start: 2.6, end: 3.2, probability: 0.96, chunkId: "ID_01" },
    { word: "video", start: 3.25, end: 3.7, probability: 0.98, chunkId: "ID_01" },
    { word: "creation.", start: 3.75, end: 4.3, probability: 0.95, chunkId: "ID_01" },
    { word: "Build", start: 4.5, end: 5.0, probability: 0.99, chunkId: "ID_02" },
    { word: "viral", start: 5.05, end: 5.5, probability: 0.97, chunkId: "ID_02" },
    { word: "clips", start: 5.55, end: 6.0, probability: 0.98, chunkId: "ID_02" },
    { word: "like", start: 6.05, end: 6.35, probability: 0.99, chunkId: "ID_02" },
    { word: "a", start: 6.4, end: 6.55, probability: 0.99, chunkId: "ID_02" },
    { word: "pro", start: 6.6, end: 7.2, probability: 0.98, chunkId: "ID_02" },
    { word: "Subscribe", start: 10.0, end: 10.7, probability: 0.99, chunkId: "ID_03" },
    { word: "now!", start: 10.75, end: 11.4, probability: 0.98, chunkId: "ID_03" },
  ];

  const sampleBeats: ScriptBeat[] = [
    {
      id: 1,
      start: 0.5,
      end: 4.3,
      text: "Welcome to the future of automated video creation",
      role: "hook",
      energy: "high",
      importance: 5,
    },
    {
      id: 2,
      start: 4.5,
      end: 7.2,
      text: "Build viral clips like a pro",
      role: "story",
      energy: "medium",
      importance: 4,
    },
    {
      id: 3,
      start: 10.0,
      end: 11.4,
      text: "Subscribe now!",
      role: "cta",
      energy: "high",
      importance: 5,
    },
  ];

  const sampleProject: TimelineProject = {
    id: "proj-transcript-test",
    title: "Transcript Test Video",
    aspectRatio: "9:16",
    duration: 12.0,
    fps: 30,
    tracks: {
      videoTrack: [],
      brollTrack: [],
      textTrack: [],
      audioTrack: [],
      graphicsTrack: [],
    },
    safeZones: [],
    transcript: {
      videoId: "proj-transcript-test",
      words: sampleWords,
      beatSheet: { beats: sampleBeats },
      text: "Welcome to the future of automated video creation. Build viral clips like a pro. Subscribe now!",
    },
  };

  beforeEach(() => {
    useTimelineStore.getState().initProject(sampleProject);
    useTimelineStore.getState().setPlayheadTime(0);
  });

  describe("1. Token Normalization & Word Flattening", () => {
    it("normalizes tokens stripping punctuation and converting to lowercase", () => {
      expect(normalizeToken("Hello,")).toBe("hello");
      expect(normalizeToken("CREATION!")).toBe("creation");
      expect(normalizeToken(" 'quoted' ")).toBe("quoted");
    });

    it("calculates similarity ratio between tokens", () => {
      expect(tokenSimilarity("welcome", "welcome")).toBe(1.0);
      expect(tokenSimilarity("welcom", "welcome")).toBeGreaterThan(0.8);
      expect(tokenSimilarity("future", "banana")).toBe(0.0);
    });

    it("flattens timestamp_map chunks into sorted word list", () => {
      const timestampMap = {
        ID_02: {
          start: 4.5,
          end: 7.2,
          text: "Build viral clips",
          words: [
            { word: "Build", start: 4.5, end: 5.0, probability: 0.99 },
            { word: "viral", start: 5.05, end: 5.5, probability: 0.97 },
            { word: "clips", start: 5.55, end: 6.0, probability: 0.98 },
          ],
        },
        ID_01: {
          start: 0.5,
          end: 2.3,
          text: "Welcome future",
          words: [
            { word: "Welcome", start: 0.5, end: 1.1, probability: 0.98 },
            { word: "future", start: 1.65, end: 2.3, probability: 0.97 },
          ],
        },
      };

      const words = flattenTranscriptWords(timestampMap);
      expect(words).toHaveLength(5);
      expect(words[0].word).toBe("Welcome");
      expect(words[0].start).toBe(0.5);
      expect(words[2].word).toBe("Build");
      expect(words[2].start).toBe(4.5);
    });
  });

  describe("2. Spoken Phrase Search & Sub-50ms Onset Synchronization", () => {
    it("finds exact single word timestamp synchronized within 50ms of audio onset", () => {
      const match = findPhraseTimestamp("Welcome", sampleWords);
      expect(match.matched).toBe(true);
      expect(match.start).toBe(0.5);
      expect(match.end).toBe(1.1);
      expect(match.confidence).toBe(1.0);
      expect(match.matchedPhrase).toBe("Welcome");
    });

    it("finds exact multi-word phrase start and end timestamps", () => {
      const match = findPhraseTimestamp("future of automated video", sampleWords);
      expect(match.matched).toBe(true);
      expect(match.start).toBe(1.65); // Word "future" start
      expect(match.end).toBe(3.7);    // Word "video" end
      expect(match.wordCount).toBe(4);
    });

    it("finds phrase with slight ASR variation or typo using fuzzy matching", () => {
      // Query with missing character "welcom" instead of "Welcome"
      const match = findPhraseTimestamp("welcom", sampleWords);
      expect(match.matched).toBe(true);
      expect(match.start).toBe(0.5);
      expect(match.confidence).toBeGreaterThanOrEqual(0.75);
    });

    it("returns matched=false when phrase does not exist in transcript", () => {
      const match = findPhraseTimestamp("cryptocurrency blockchain", sampleWords);
      expect(match.matched).toBe(false);
      expect(match.start).toBeUndefined();
    });
  });

  describe("3. Storytelling Beat Anchoring", () => {
    it("matches beat by canonical role (hook, cta, story)", () => {
      const hookMatch = findBeatByRoleOrKeyword("hook", sampleBeats);
      expect(hookMatch.matched).toBe(true);
      expect(hookMatch.start).toBe(0.5);
      expect(hookMatch.end).toBe(4.3);

      const ctaMatch = findBeatByRoleOrKeyword("cta", sampleBeats);
      expect(ctaMatch.matched).toBe(true);
      expect(ctaMatch.start).toBe(10.0);
    });

    it("matches beat by alias (e.g. 'intro' for hook, 'call to action' for cta)", () => {
      const introMatch = findBeatByRoleOrKeyword("intro", sampleBeats);
      expect(introMatch.matched).toBe(true);
      expect(introMatch.start).toBe(0.5);

      const ctaAlias = findBeatByRoleOrKeyword("call to action", sampleBeats);
      expect(ctaAlias.matched).toBe(true);
      expect(ctaAlias.start).toBe(10.0);
    });

    it("matches beat by text content when role does not match directly", () => {
      const textMatch = findBeatByRoleOrKeyword("viral clips", sampleBeats);
      expect(textMatch.matched).toBe(true);
      expect(textMatch.start).toBe(4.5);
    });
  });

  describe("4. Active Spoken Word Tracking", () => {
    it("returns the exact word being spoken at playhead timestamp", () => {
      const wordAtStart = getActiveWordAtTimestamp(sampleWords, 0.8);
      expect(wordAtStart?.word).toBe("Welcome");

      const wordAtMid = getActiveWordAtTimestamp(sampleWords, 1.8);
      expect(wordAtMid?.word).toBe("future");

      const wordAtCTA = getActiveWordAtTimestamp(sampleWords, 10.2);
      expect(wordAtCTA?.word).toBe("Subscribe");
    });

    it("returns null when playhead is in silent pause", () => {
      const wordDuringPause = getActiveWordAtTimestamp(sampleWords, 8.5);
      expect(wordDuringPause).toBeNull();
    });
  });

  describe("5. Natural Language Prompt Synchronization (Local Command Parser)", () => {
    it("parses 'Add a badge when I say Welcome' and synchronizes to exact word onset", () => {
      const context = assembleEditorContext(sampleProject, 0, null);
      const result = parseLocalCommand("Add a badge when I say Welcome", context);

      expect(result.matched).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.operation?.type).toBe("add_element");

      const op = result.operation as any;
      expect(op.track).toBe("graphic");
      expect(op.element.compositionId).toBe("pop_up_badge");
      // Synchronized to within 50ms of audio word onset (0.5s)!
      expect(op.element.start).toBe(0.5);
      expect(result.description).toContain('synchronized to phrase "Welcome" at 0.50s');
    });

    it("parses 'Add graphic when I say Subscribe' and places at 10.0s", () => {
      const context = assembleEditorContext(sampleProject, 0, null);
      const result = parseLocalCommand("Add graphic when I say Subscribe", context);

      expect(result.matched).toBe(true);
      const op = result.operation as any;
      expect(op.track).toBe("graphic");
      expect(op.element.start).toBe(10.0);
      expect(result.description).toContain('synchronized to phrase "Subscribe" at 10.00s');
    });

    it("parses 'Add a badge at the hook' and anchors to hook beat onset", () => {
      const context = assembleEditorContext(sampleProject, 0, null);
      const result = parseLocalCommand("Add a badge at the hook", context);

      expect(result.matched).toBe(true);
      const op = result.operation as any;
      expect(op.element.start).toBe(0.5);
      expect(result.description).toContain("anchored to HOOK beat at 0.50s");
    });

    it("returns an error message when spoken phrase is not in the transcript", () => {
      const context = assembleEditorContext(sampleProject, 0, null);
      const result = parseLocalCommand("Add a badge when I say astronaut", context);

      expect(result.matched).toBe(true);
      expect(result.error).toContain('Phrase "astronaut" was not found in the video transcript');
      expect(result.operation).toBeUndefined();
    });
  });

  describe("6. Interactive Transcript Drawer UI (TranscriptDrawer.tsx)", () => {
    it("renders word chips and enables click-to-seek to jump player playhead", () => {
      render(<TranscriptDrawer />);

      const welcomeWord = screen.getByTestId("transcript-word-0.5");
      expect(welcomeWord).toBeInTheDocument();
      expect(welcomeWord).toHaveTextContent("Welcome");

      // Click "Welcome" word -> seeks store playhead to 0.5s!
      fireEvent.click(welcomeWord);
      expect(useTimelineStore.getState().playheadTime).toBe(0.5);

      // Click "future" word (start: 1.65s) -> seeks playhead to 1.65s!
      const futureWord = screen.getByTestId("transcript-word-1.65");
      fireEvent.click(futureWord);
      expect(useTimelineStore.getState().playheadTime).toBe(1.65);
    });

    it("renders script beat chips and jumps playhead on beat click", () => {
      render(<TranscriptDrawer />);

      const hookBeatChip = screen.getByTestId("beat-chip-hook");
      expect(hookBeatChip).toBeInTheDocument();

      const ctaBeatChip = screen.getByTestId("beat-chip-cta");
      expect(ctaBeatChip).toBeInTheDocument();

      // Click CTA beat -> seeks playhead to 10.0s!
      fireEvent.click(ctaBeatChip);
      expect(useTimelineStore.getState().playheadTime).toBe(10.0);
    });

    it("filters words in real-time when typing in search input", () => {
      render(<TranscriptDrawer />);

      const searchInput = screen.getByTestId("transcript-search-input");
      fireEvent.change(searchInput, { target: { value: "viral" } });

      expect(screen.getByText("viral")).toBeInTheDocument();
      expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
    });

    it("provides quick 'Add Badge' button for active word", () => {
      useTimelineStore.getState().setPlayheadTime(0.8); // Active word is "Welcome"
      render(<TranscriptDrawer />);

      expect(screen.getByText(/Current Spoken: "Welcome"/i)).toBeInTheDocument();

      const addBadgeBtn = screen.getByTestId("quick-add-badge-btn");
      fireEvent.click(addBadgeBtn);

      const graphics = useTimelineStore.getState().project.tracks.graphicsTrack || [];
      expect(graphics.length).toBeGreaterThan(0);
      expect(graphics[0].name).toBe("WELCOME");
      expect(graphics[0].start).toBe(0.5);
    });
  });

  describe("7. Finance Script Beat Detection & Graphic Suggestion", () => {
    it("suggests candlestick-hud for crypto and trading beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Watch this Bitcoin crypto breakout on the charts");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("candlestick-hud");
      expect(suggestion?.props.ticker).toBe("BTC/USDT");
    });

    it("suggests compound-growth-curve for snowball and compounding beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("The snowball method builds compounding exponential wealth");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("compound-growth-curve");
      expect(suggestion?.props.multiplier).toBe("17.4x");
    });

    it("suggests portfolio-donut for asset allocation beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Your investment portfolio asset allocation needs balance");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("portfolio-donut");
      expect(suggestion?.props.totalValue).toBe("$250,000");
    });

    it("suggests inflation-cash-burn for purchasing power loss beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Inflation is the silent killer burning your cash reserves");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("inflation-cash-burn");
      expect(suggestion?.props.purchasingPower).toBe("$68,400");
    });

    it("suggests banking-notification for wire and deposit payout beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("You receive a wire deposit notification cleared");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("banking-notification");
      expect(suggestion?.props.amount).toBe("+$24,500.00");
    });

    it("suggests budget-waterfall for 50/30/20 budget beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Follow the 50 30 20 budget waterfall breakdown");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("budget-waterfall");
      expect(suggestion?.props.needs).toBe("$5,000 (50%)");
    });

    it("suggests debt-payoff-tracker for debt payoff beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Use the debt payoff snowball method to become debt free");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("debt-payoff-tracker");
      expect(suggestion?.props.progress).toBe(80);
    });

    it("suggests roi-balance-scale for asymmetric ROI beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Weighing the asymmetric risk reward with a 10x ROI balance scale");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("roi-balance-scale");
      expect(suggestion?.props.roiMultiplier).toBe("10x ROI");
    });

    it("suggests wealth-flywheel for compounding engine beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("The wealth flywheel compounding engine drives financial freedom");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("wealth-flywheel");
    });

    it("suggests battle-chart for Buffett vs hedge fund challenge beats", () => {
      const suggestion = suggestFinanceGraphicForBeat("Warren Buffett challenge: S&P 500 index vs top hedge funds battle");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.compositionId).toBe("battle-chart");
    });

    it("matches finance category beat by alias", () => {
      const beatsWithFinance: ScriptBeat[] = [
        ...sampleBeats,
        {
          id: 4,
          start: 8.0,
          end: 10.0,
          text: "Let's review our investment portfolio strategy",
          role: "finance",
          energy: "high",
          importance: 5,
        },
      ];

      const match = findBeatByRoleOrKeyword("trading", beatsWithFinance);
      expect(match.matched).toBe(true);
      expect(match.start).toBe(8.0);
    });
  });
});
