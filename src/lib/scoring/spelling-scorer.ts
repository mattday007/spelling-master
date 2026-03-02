function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export interface SpellingScore {
  score: number; // 0-3 stars
  isCorrect: boolean;
  distance: number;
  normalizedSimilarity: number; // 0-1
}

/**
 * Build a hint string from the target word, masking letters the child got wrong.
 * Uses Levenshtein DP backtracking to align target and recognised text.
 * Correct letters are shown; wrong/missing letters become a placeholder.
 */
export function buildHint(target: string, recognised: string, placeholder = "\u25A1"): string {
  const t = target.trim().toLowerCase();
  const r = recognised.trim().toLowerCase();

  if (t === r) return target; // All correct — no masking

  const m = t.length;
  const n = r.length;

  // Build DP matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        t[i - 1] === r[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  // Backtrack to find which target characters matched
  const matched = new Array<boolean>(m).fill(false);
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (t[i - 1] === r[j - 1]) {
      // Characters match
      matched[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j - 1] <= dp[i - 1][j] && dp[i - 1][j - 1] <= dp[i][j - 1]) {
      // Substitution — target char was wrong
      i--;
      j--;
    } else if (dp[i - 1][j] <= dp[i][j - 1]) {
      // Deletion — target char was missed
      i--;
    } else {
      // Insertion — extra char in recognised
      j--;
    }
  }

  // Build hint: preserve original casing from target, mask unmatched chars
  return target
    .trim()
    .split("")
    .map((ch, idx) => (matched[idx] ? ch : placeholder))
    .join("");
}

export function scoreSpelling(target: string, recognised: string): SpellingScore {
  const t = target.trim().toLowerCase();
  const r = recognised.trim().toLowerCase();

  if (t === r) {
    return { score: 3, isCorrect: true, distance: 0, normalizedSimilarity: 1 };
  }

  const distance = levenshteinDistance(t, r);
  const maxLen = Math.max(t.length, r.length);
  const normalizedSimilarity = maxLen > 0 ? 1 - distance / maxLen : 0;

  let score: number;
  if (normalizedSimilarity >= 0.85) {
    score = 2; // close
  } else if (normalizedSimilarity >= 0.5) {
    score = 1; // partial
  } else {
    score = 0; // far off
  }

  return {
    score,
    isCorrect: normalizedSimilarity >= 0.85,
    distance,
    normalizedSimilarity,
  };
}
