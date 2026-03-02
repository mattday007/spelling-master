import { NextRequest, NextResponse } from "next/server";

const TTS_VOICE = {
  languageCode: "en-AU",
  name: "en-AU-Neural2-C",
};

const TTS_AUDIO_CONFIG = {
  audioEncoding: "MP3" as const,
  speakingRate: 0.9,
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TTS not configured" },
      { status: 503 },
    );
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 },
    );
  }
  if (text.length > 200) {
    return NextResponse.json(
      { error: "text must be 200 characters or fewer" },
      { status: 400 },
    );
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: TTS_VOICE,
      audioConfig: TTS_AUDIO_CONFIG,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Google TTS error:", res.status, error);
    return NextResponse.json(
      { error: "TTS synthesis failed" },
      { status: 502 },
    );
  }

  const json = (await res.json()) as { audioContent: string };
  return NextResponse.json({ audioContent: json.audioContent });
}
