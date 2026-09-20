/**
 * Minimal deterministic SVG path tokenization and morphing utility.
 * Fails gracefully by returning the 'from' path if the paths are incompatible
 * (i.e., different command lengths or different command structures).
 */

type PathToken = 
  | { type: 'cmd'; val: string }
  | { type: 'num'; val: number };

function tokenizePath(path: string): PathToken[] {
  const tokens: PathToken[] = [];
  // Matches letters (commands) or numbers (including negative and decimals)
  const regex = /([a-zA-Z])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let match;
  
  while ((match = regex.exec(path)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'cmd', val: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'num', val: parseFloat(match[2]) });
    }
  }
  
  return tokens;
}

export function interpolatePath(from: string, to: string, progress: number): string {
  if (from === to) return from;
  if (progress <= 0) return from;
  if (progress >= 1) return to;

  const t1 = tokenizePath(from);
  const t2 = tokenizePath(to);

  // If the paths don't have the same number of tokens, they are structurally incompatible.
  if (t1.length !== t2.length) return from;

  let result = '';
  
  for (let i = 0; i < t1.length; i++) {
    const p1 = t1[i];
    const p2 = t2[i];

    // If token types mismatch, or if they are commands and the commands differ
    if (p1.type !== p2.type) return from;
    if (p1.type === 'cmd' && p2.type === 'cmd' && p1.val !== p2.val) return from;

    if (p1.type === 'cmd') {
      result += p1.val + ' ';
    } else if (p1.type === 'num' && p2.type === 'num') {
      const interpolated = p1.val + (p2.val - p1.val) * progress;
      // Round to 4 decimal places for clean SVG output
      result += parseFloat(interpolated.toFixed(4)) + ' ';
    }
  }

  return result.trim();
}
