export interface PronunciationScore {
  score: number; // 0-3 stars
  isCorrect: boolean;
  confidence: number;
  transcriptMatch: boolean;
  heardAs: string; // what was actually heard (for display)
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z\s]/g, "");
}

function wordMatch(target: string, transcript: string): boolean {
  const t = normalize(target);
  const r = normalize(transcript);

  if (t === r) return true;

  // Check if the target word appears in the transcript
  const words = r.split(/\s+/);
  if (words.includes(t)) return true;

  // Check if transcript contains the target as a substring
  if (r.includes(t)) return true;

  // Check if target starts with or ends with transcript (partial recognition)
  if (t.startsWith(r) || t.endsWith(r)) return true;

  return false;
}

interface Alternative {
  transcript: string;
  confidence: number;
}

export function scorePronunciation(
  target: string,
  transcript: string,
  confidence: number,
  alternatives?: Alternative[]
): PronunciationScore {
  // Check the best transcript first
  const bestMatch = wordMatch(target, transcript);

  // Also check all alternatives — speech recognition often puts the
  // correct word as a lower-ranked alternative
  let altMatch = false;
  let bestAltConfidence = confidence;
  let matchedTranscript = transcript;

  if (alternatives && alternatives.length > 0) {
    for (const alt of alternatives) {
      if (wordMatch(target, alt.transcript)) {
        altMatch = true;
        bestAltConfidence = Math.max(bestAltConfidence, alt.confidence);
        matchedTranscript = alt.transcript;
        break;
      }
    }
  }

  const anyMatch = bestMatch || altMatch;
  const effectiveConfidence = anyMatch ? Math.max(confidence, bestAltConfidence) : confidence;

  let score: number;
  if (anyMatch && effectiveConfidence >= 0.5) {
    score = 3;
  } else if (anyMatch) {
    score = 2;
  } else if (effectiveConfidence >= 0.4 && normalize(transcript).length > 0) {
    // They said something but it didn't match — give partial credit
    // if the transcript is phonetically close
    score = 1;
  } else {
    score = 0;
  }

  return {
    score,
    isCorrect: score >= 2,
    confidence: effectiveConfidence,
    transcriptMatch: anyMatch,
    heardAs: bestMatch ? transcript : matchedTranscript,
  };
}
