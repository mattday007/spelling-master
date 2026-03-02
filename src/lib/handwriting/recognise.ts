/**
 * Handwriting recognition using iink-ts REST API (MyScript).
 * Converts canvas strokes to text via the HTTP V2 recognizer.
 */

import { RecognizerHTTPV2, Stroke as IinkStroke } from "iink-ts";

const appKey = process.env.NEXT_PUBLIC_MYSCRIPT_APPLICATION_KEY ?? "";
const hmacKey = process.env.NEXT_PUBLIC_MYSCRIPT_HMAC_KEY ?? "";
const serverUrl = process.env.NEXT_PUBLIC_MYSCRIPT_SERVER_URL ?? "https://cloud.myscript.com";

let recognizer: RecognizerHTTPV2 | null = null;

function getRecognizer(): RecognizerHTTPV2 {
  if (recognizer) return recognizer;

  const url = new URL(serverUrl);

  recognizer = new RecognizerHTTPV2({
    server: {
      scheme: url.protocol.replace(":", "") as "https" | "http",
      host: url.host,
      applicationKey: appKey,
      hmacKey: hmacKey,
    },
    recognition: {
      type: "TEXT",
      lang: "en_GB",
      text: {
        mimeTypes: ["text/plain", "application/vnd.myscript.jiix"],
        guides: { enable: true },
      },
      export: {
        jiix: {
          "bounding-box": false,
          strokes: false,
          ids: false,
          "full-stroke-ids": false,
          text: {
            chars: false,
            words: true,
          },
        },
      },
    },
  });

  return recognizer;
}

export interface CanvasStroke {
  points: { x: number; y: number; time: number }[];
}

/**
 * Send collected canvas strokes to MyScript for recognition.
 * Returns the recognized text, or empty string if nothing was recognized.
 */
export async function recogniseStrokes(strokes: CanvasStroke[]): Promise<string> {
  if (!appKey || !hmacKey) {
    throw new Error("MyScript API keys not configured");
  }

  if (strokes.length === 0) return "";

  const rec = getRecognizer();

  // Convert canvas strokes to iink-ts Stroke format
  const iinkStrokes = strokes.map((s) => {
    const stroke = new IinkStroke({}, "pen");
    for (const pt of s.points) {
      stroke.pointers.push({
        x: pt.x,
        y: pt.y,
        t: pt.time,
        p: 1.0,
      });
    }
    return stroke;
  });

  const result = await rec.send(iinkStrokes, [
    "text/plain",
    "application/vnd.myscript.jiix",
  ]);

  const plainText = result["text/plain"];
  if (plainText) return plainText.trim();

  // Fallback: extract from JIIX
  const jiix = result["application/vnd.myscript.jiix"] as
    | { label?: string; words?: { label: string }[] }
    | undefined;
  if (jiix?.label) return jiix.label.trim();
  if (jiix?.words?.[0]?.label) return jiix.words[0].label.trim();

  return "";
}

export function isHandwritingConfigured(): boolean {
  return !!appKey && !!hmacKey && appKey !== "your_application_key_here";
}
