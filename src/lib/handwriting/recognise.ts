/**
 * Handwriting recognition via server-side proxy to MyScript iink REST API.
 * Converts canvas strokes to text by calling /api/recognise.
 */

export interface CanvasStroke {
  points: { x: number; y: number; time: number }[];
}

/**
 * Send collected canvas strokes to the recognition proxy.
 * Returns the recognized text, or empty string if nothing was recognized.
 */
export async function recogniseStrokes(strokes: CanvasStroke[]): Promise<string> {
  if (strokes.length === 0) return "";

  const res = await fetch("/api/recognise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strokes, width: 800, height: 400 }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Recognition proxy error: ${res.status} ${error}`);
  }

  const json = (await res.json()) as {
    results: {
      "text/plain"?: string;
      "application/vnd.myscript.jiix"?: { label?: string; words?: { label: string }[] };
    };
  };

  const plainText = json.results["text/plain"];
  if (plainText) return plainText.trim();

  const jiix = json.results["application/vnd.myscript.jiix"];
  if (jiix?.label) return jiix.label.trim();
  if (jiix?.words?.[0]?.label) return jiix.words[0].label.trim();

  return "";
}

export function isHandwritingConfigured(): boolean {
  return true;
}
