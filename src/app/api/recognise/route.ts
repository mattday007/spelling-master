import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

interface StrokeInput {
  points: { x: number; y: number; time: number }[];
}

function buildRequestBody(
  strokes: StrokeInput[],
  width: number,
  height: number,
) {
  return {
    configuration: {
      lang: "en_GB",
      text: {
        mimeTypes: ["text/plain", "application/vnd.myscript.jiix"],
        guides: { enable: false },
      },
      export: {
        jiix: {
          "bounding-box": false,
          strokes: false,
          ids: false,
          "full-stroke-ids": false,
          text: { chars: false, words: true },
        },
      },
    },
    xDPI: 96,
    yDPI: 96,
    scaleX: 1,
    scaleY: 1,
    contentType: "Text",
    height,
    width,
    strokes: strokes.map((s, i) => ({
      x: s.points.map((p) => p.x),
      y: s.points.map((p) => p.y),
      t: s.points.map((p) => p.time),
      p: s.points.map(() => 1.0),
      id: `s${i}`,
    })),
  };
}

function computeHmac(
  applicationKey: string,
  hmacKey: string,
  body: string,
): string {
  return createHmac("sha512", applicationKey + hmacKey)
    .update(body)
    .digest("hex");
}

async function recognise(
  serverUrl: string,
  applicationKey: string,
  hmacKey: string,
  bodyObj: ReturnType<typeof buildRequestBody>,
  mimeType: string,
): Promise<string> {
  const bodyStr = JSON.stringify(bodyObj);
  const hmac = computeHmac(applicationKey, hmacKey, bodyStr);

  const res = await fetch(`${serverUrl}/api/v4.0/iink/recognize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/json,${mimeType}`,
      applicationKey,
      hmac,
    },
    body: bodyStr,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`MyScript API error (${mimeType}): ${res.status} ${error}`);
  }

  return res.text();
}

export async function POST(request: NextRequest) {
  const applicationKey = process.env.MYSCRIPT_APPLICATION_KEY;
  const hmacKey = process.env.MYSCRIPT_HMAC_KEY;
  const serverUrl =
    process.env.MYSCRIPT_SERVER_URL ?? "https://cloud.myscript.com";

  if (!applicationKey || !hmacKey) {
    return NextResponse.json(
      { error: "Handwriting recognition not configured" },
      { status: 503 },
    );
  }

  let body: { strokes?: StrokeInput[]; width?: number; height?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.strokes || body.strokes.length === 0) {
    return NextResponse.json(
      { error: "strokes is required" },
      { status: 400 },
    );
  }

  const width = body.width ?? 800;
  const height = body.height ?? 400;
  const requestBody = buildRequestBody(body.strokes, width, height);

  const [plainResult, jiixResult] = await Promise.all([
    recognise(serverUrl, applicationKey, hmacKey, requestBody, "text/plain").catch(
      (err) => {
        console.error("MyScript text/plain error:", err);
        return null;
      },
    ),
    recognise(
      serverUrl,
      applicationKey,
      hmacKey,
      requestBody,
      "application/vnd.myscript.jiix",
    ).catch((err) => {
      console.error("MyScript JIIX error:", err);
      return null;
    }),
  ]);

  if (plainResult === null && jiixResult === null) {
    return NextResponse.json(
      { error: "Recognition failed" },
      { status: 502 },
    );
  }

  let jiix: unknown = null;
  if (jiixResult) {
    try {
      jiix = JSON.parse(jiixResult);
    } catch {
      jiix = jiixResult;
    }
  }

  return NextResponse.json({
    results: {
      "text/plain": plainResult ?? "",
      "application/vnd.myscript.jiix": jiix,
    },
  });
}
