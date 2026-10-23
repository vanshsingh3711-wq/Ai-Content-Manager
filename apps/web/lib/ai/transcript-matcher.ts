/**
 * transcript-matcher.ts
 *
 * Faster-Whisper word-level transcript matching and storytelling beat synchronization engine.
 * Locates exact audio word onset timestamps (within 50ms accuracy) for natural language triggers
 * like "Add a badge when I say [phrase]" or "Add graphic at the hook".
 */

import { TranscriptWord, ScriptBeat, TranscriptData } from "../timeline-types";

export interface PhraseMatchResult {
  matched: boolean;
  start?: number;          // Exact start timestamp in seconds (within 50ms of audio word onset)
  end?: number;            // End timestamp in seconds
  duration?: number;
  matchedPhrase?: string;  // The actual words matched from the transcript
  confidence: number;      // 0.0 - 1.0 match score
  wordIndex?: number;      // Index of the first matched word
  wordCount?: number;      // Number of words matched
}

export interface BeatMatchResult {
  matched: boolean;
  beat?: ScriptBeat;
  start?: number;
  end?: number;
  role?: string;
}

export interface PhraseMatchOptions {
  threshold?: number;        // Minimum similarity threshold (default 0.75)
  caseSensitive?: boolean;
}

/**
 * Normalizes a word or phrase by lowercasing and stripping punctuation and whitespace.
 */
export function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>]/g, "")
    .trim();
}

/**
 * Computes Levenshtein distance between two strings for typo-tolerant fuzzy matching.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes similarity ratio between two tokens (0.0 - 1.0).
 */
export function tokenSimilarity(a: string, b: string): number {
  const normA = normalizeToken(a);
  const normB = normalizeToken(b);
  if (!normA && !normB) return 1.0;
  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshteinDistance(normA, normB);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Flattens timestamp_map chunks into a chronological list of word tokens.
 */
export function flattenTranscriptWords(
  timestampMap: Record<string, { start: number; end: number; text: string; words?: TranscriptWord[] }> = {}
): TranscriptWord[] {
  const words: TranscriptWord[] = [];

  const sortedChunks = Object.entries(timestampMap).sort(
    ([, a], [, b]) => (a.start ?? 0) - (b.start ?? 0)
  );

  for (const [chunkId, chunk] of sortedChunks) {
    if (Array.isArray(chunk.words) && chunk.words.length > 0) {
      for (const w of chunk.words) {
        words.push({
          word: w.word,
          start: Number(w.start.toFixed(2)),
          end: Number(w.end.toFixed(2)),
          probability: w.probability ?? 1.0,
          chunkId,
        });
      }
    } else if (chunk.text) {
      const split = chunk.text.trim().split(/\s+/);
      const span = Math.max(0.1, (chunk.end ?? 0) - (chunk.start ?? 0));
      const wordDur = span / (split.length || 1);

      split.forEach((w, idx) => {
        const wStart = (chunk.start ?? 0) + idx * wordDur;
        words.push({
          word: w,
          start: Number(wStart.toFixed(2)),
          end: Number((wStart + wordDur).toFixed(2)),
          probability: 1.0,
          chunkId,
        });
      });
    }
  }

  return words;
}

/**
 * Locates the exact audio word onset timestamp for a target spoken phrase.
 * Supports exact matching and sliding window fuzzy search.
 */
export function findPhraseTimestamp(
  targetPhrase: string,
  transcriptInput: TranscriptWord[] | TranscriptData,
  options: PhraseMatchOptions = {}
): PhraseMatchResult {
  const words: TranscriptWord[] = Array.isArray(transcriptInput)
    ? transcriptInput
    : transcriptInput.words || [];

  if (!targetPhrase || words.length === 0) {
    return { matched: false, confidence: 0 };
  }

  const queryTokens = targetPhrase
    .split(/\s+/)
    .map(normalizeToken)
    .filter((t) => t.length > 0);

  if (queryTokens.length === 0) {
    return { matched: false, confidence: 0 };
  }

  const threshold = options.threshold ?? 0.75;
  const qLen = queryTokens.length;

  // 1. Exact Match Pass
  for (let i = 0; i <= words.length - qLen; i++) {
    let exactMatch = true;
    for (let j = 0; j < qLen; j++) {
      if (normalizeToken(words[i + j].word) !== queryTokens[j]) {
        exactMatch = false;
        break;
      }
    }

    if (exactMatch) {
      const startWord = words[i];
      const endWord = words[i + qLen - 1];
      const matchedPhrase = words
        .slice(i, i + qLen)
        .map((w) => w.word)
        .join(" ");

      return {
        matched: true,
        start: startWord.start,
        end: endWord.end,
        duration: Number((endWord.end - startWord.start).toFixed(2)),
        matchedPhrase,
        confidence: 1.0,
        wordIndex: i,
        wordCount: qLen,
      };
    }
  }

  // 2. Fuzzy Window Pass (Typo & ASR variance tolerance)
  let bestMatch: PhraseMatchResult = { matched: false, confidence: 0 };
  let highestScore = 0;

  for (let i = 0; i <= words.length - qLen; i++) {
    let windowScoreSum = 0;

    for (let j = 0; j < qLen; j++) {
      const sim = tokenSimilarity(words[i + j].word, queryTokens[j]);
      windowScoreSum += sim;
    }

    const avgScore = windowScoreSum / qLen;

    if (avgScore >= threshold && avgScore > highestScore) {
      highestScore = avgScore;
      const startWord = words[i];
      const endWord = words[i + qLen - 1];
      const matchedPhrase = words
        .slice(i, i + qLen)
        .map((w) => w.word)
        .join(" ");

      bestMatch = {
        matched: true,
        start: startWord.start,
        end: endWord.end,
        duration: Number((endWord.end - startWord.start).toFixed(2)),
        matchedPhrase,
        confidence: Number(avgScore.toFixed(2)),
        wordIndex: i,
        wordCount: qLen,
      };
    }
  }

  return bestMatch;
}

/**
 * Maps storytelling beat queries (e.g. "hook", "cta", "intro", "climax") to exact BeatSheet timestamps.
 */
export function findBeatByRoleOrKeyword(
  query: string,
  beats: ScriptBeat[] = []
): BeatMatchResult {
  if (!query || beats.length === 0) {
    return { matched: false };
  }

  const cleanQuery = query.toLowerCase().trim();

  // Role alias mapping
  const roleAliases: Record<string, string[]> = {
    hook: ["hook", "opening", "intro", "introduction", "attention"],
    cta: ["cta", "call to action", "subscribe", "follow", "outro", "conclusion"],
    problem: ["problem", "pain", "setup", "struggle", "debt", "inflation", "burn", "loss"],
    solution: ["solution", "answer", "process", "resolution", "compound", "flywheel", "snowball"],
    statistic: ["statistic", "metric", "number", "data", "stats", "roi", "yield", "rate", "percentage", "return", "multiplier"],
    example: ["example", "demo", "story", "proof", "challenge", "battle"],
    finance: ["finance", "trading", "investing", "crypto", "bitcoin", "stocks", "portfolio", "budget", "wealth"],
  };

  // 1. Direct role match or alias match
  for (const [canonicalRole, aliases] of Object.entries(roleAliases)) {
    if (aliases.some((a) => cleanQuery.includes(a))) {
      const found = beats.find(
        (b) => b.role.toLowerCase() === canonicalRole || aliases.includes(b.role.toLowerCase())
      );
      if (found) {
        return {
          matched: true,
          beat: found,
          start: found.start,
          end: found.end,
          role: found.role,
        };
      }
    }
  }

  // 2. Fallback: match keyword inside beat narrative text
  const textMatch = beats.find((b) => b.text.toLowerCase().includes(cleanQuery));
  if (textMatch) {
    return {
      matched: true,
      beat: textMatch,
      start: textMatch.start,
      end: textMatch.end,
      role: textMatch.role,
    };
  }

  return { matched: false };
}

/**
 * Returns the word actively being spoken at the current player playhead timestamp.
 */
export function getActiveWordAtTimestamp(
  words: TranscriptWord[] = [],
  playheadTime: number
): TranscriptWord | null {
  if (words.length === 0) return null;

  for (const word of words) {
    if (playheadTime >= word.start && playheadTime <= word.end) {
      return word;
    }
  }

  return null;
}

/**
 * Maps a spoken text snippet or beat role to the optimal finance motion graphic composition.
 */
export function suggestFinanceGraphicForBeat(
  textOrRole: string
): { compositionId: string; name: string; props: Record<string, any> } | null {
  const lower = textOrRole.toLowerCase();

  if (/\b(?:bitcoin|btc|crypto|trading|candlestick|ticker|stock)\b/i.test(lower)) {
    return {
      compositionId: "candlestick-hud",
      name: "CANDLESTICK HUD",
      props: { ticker: "BTC/USDT", price: "$64,250.00", change: "+8.4%", volume: "1.42B" },
    };
  }
  if (/\b(?:debt|payoff|avalanche)\b/i.test(lower)) {
    return {
      compositionId: "debt-payoff-tracker",
      name: "DEBT PAYOFF TRACKER",
      props: { totalDebt: "$45,000", paidOff: "$36,000", remaining: "$9,000", progress: 80, stamp: "PAID OFF" },
    };
  }
  if (/\b(?:compound|snowball|exponential|wealth\s*curve)\b/i.test(lower)) {
    return {
      compositionId: "compound-growth-curve",
      name: "COMPOUND GROWTH",
      props: { principal: "$10,000", multiplier: "17.4x", years: 30, title: "THE SNOWBALL EFFECT" },
    };
  }
  if (/\b(?:portfolio|allocation|diversif\w*|asset\s*split)\b/i.test(lower)) {
    return {
      compositionId: "portfolio-donut",
      name: "PORTFOLIO DONUT",
      props: { totalValue: "$250,000", asset1: "Stocks (60%)", asset2: "Real Estate (20%)" },
    };
  }
  if (/\b(?:inflation|cash\s*burn|purchasing\s*power|burn\w*)\b/i.test(lower)) {
    return {
      compositionId: "inflation-cash-burn",
      name: "INFLATION CASH BURN",
      props: { originalValue: "$100,000", purchasingPower: "$68,400", lossAmount: "-$31,600" },
    };
  }
  if (/\b(?:wire|deposit|dividend|payout|bank\s*notification|stripe)\b/i.test(lower)) {
    return {
      compositionId: "banking-notification",
      name: "BANKING NOTIFICATION",
      props: { bankName: "CHASE PRIVATE CLIENT", amount: "+$24,500.00", status: "CLEARED" },
    };
  }
  if (/\b(?:budget|waterfall|50\s*30\s*20|income\s*breakdown)\b/i.test(lower)) {
    return {
      compositionId: "budget-waterfall",
      name: "BUDGET WATERFALL",
      props: { monthlyIncome: "$10,000", needs: "$5,000 (50%)", wants: "$3,000 (30%)", savings: "$2,000 (20%)" },
    };
  }
  if (/\b(?:roi|balance\s*scale|return\s*on\s*investment|risk\s*reward)\b/i.test(lower)) {
    return {
      compositionId: "roi-balance-scale",
      name: "ROI BALANCE SCALE",
      props: { costSide: "Cost ($5k)", returnSide: "Return ($50k)", roiMultiplier: "10x ROI" },
    };
  }
  if (/\b(?:flywheel|compounding\s*engine|cash\s*flywheel)\b/i.test(lower)) {
    return {
      compositionId: "wealth-flywheel",
      name: "WEALTH FLYWHEEL",
      props: { title: "THE WEALTH FLYWHEEL", stage1: "EARN HIGH INCOME", stage2: "SAVE 40%+" },
    };
  }
  if (/\b(?:battle|buffett|hedge\s*fund|sp500|index\s*vs)\b/i.test(lower)) {
    return {
      compositionId: "battle-chart",
      name: "BUFFETT BATTLE CHART",
      props: { contestantA: "S&P 500 INDEX", contestantB: "TOP 5 HEDGE FUNDS", sp500Return: "+125.8%", hedgeReturn: "+36.3%" },
    };
  }

  return null;
}
