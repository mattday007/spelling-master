# Spelling Master

A Next.js app teaching NZ/UK spelling and pronunciation to children (ages 5-12). iPad-first with stylus support for handwriting recognition. All user data stored client-side in IndexedDB via Dexie.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router, SSR mode)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Database**: Dexie.js 4 (IndexedDB, client-side)
- **Handwriting**: MyScript iink REST API (server-side proxy)
- **TTS**: Pre-generated Google Cloud TTS MP3s + Web Speech API fallback
- **STT**: Web Speech API (pronunciation mode)
- **Deployment**: AWS Amplify (SSR)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file with:

```
MYSCRIPT_APPLICATION_KEY=<your-key>
MYSCRIPT_HMAC_KEY=<your-key>
MYSCRIPT_SERVER_URL=https://cloud.myscript.com
GOOGLE_CLOUD_API_KEY=<your-key>
```

These are **server-side only** (no `NEXT_PUBLIC_` prefix). They are used by API route proxies in `src/app/api/`.

### Pre-generated Audio

~658 preset word MP3s live in `public/audio/`. To regenerate:

```bash
npm run generate-audio
```

Requires `GOOGLE_CLOUD_API_KEY` in environment. The script is incremental and skips existing files.

## Architecture

### API Route Proxies

API keys are kept server-side via Next.js API routes:

| Route | Purpose | External API |
|-------|---------|-------------|
| `POST /api/tts` | Text-to-speech generation | Google Cloud TTS |
| `POST /api/recognise` | Handwriting recognition | MyScript iink REST v4.0 |

The TTS proxy is used for runtime audio generation of custom words. Pre-generated audio for preset words is served as static MP3 files.

### TTS Playback Chain

`speak(text)` in `src/lib/speech/tts.ts` tries sources in order:
1. **Static MP3** from `/audio/{word}.mp3`
2. **Cached audio** from IndexedDB (runtime-generated via `/api/tts`)
3. **Web Speech API** fallback (NZ/AU/UK voice priority)

### iOS Safari Considerations

- Audio `play()` must be called from a user gesture handler (touchend/click/keydown)
- HTMLAudioElement must be reset (`currentTime = 0`, `load()`) before replaying the same source
- Global 8-second safety timeout prevents `isSpeaking` from getting permanently stuck
- SpeechRecognition uses non-continuous mode for faster single-word results

### Project Structure

```
src/
  app/
    api/tts/route.ts          # TTS proxy
    api/recognise/route.ts     # Handwriting recognition proxy
    parent/page.tsx            # PIN-gated parent dashboard
    play/spelling/page.tsx     # Spelling practice
    play/pronunciation/page.tsx # Pronunciation practice
  components/
    spelling/SpellingSession.tsx
    spelling/HandwritingCanvas.tsx
    pronunciation/PronunciationSession.tsx
  lib/
    speech/tts.ts              # Three-tier TTS playback
    speech/stt.ts              # Web Speech API wrapper
    audio/audio-cache.ts       # Runtime TTS generation + IndexedDB cache
    handwriting/recognise.ts   # Client for /api/recognise proxy
    scoring/                   # Levenshtein (spelling), transcript match (pronunciation)
  db/
    database.ts                # Dexie schema
    word-lists.ts              # Preset word list data
    seed.ts                    # First-load seeding
  hooks/
    useTTS.ts                  # React hook wrapping tts.ts
    useSTT.ts                  # React hook for speech recognition
```

## Deployment (AWS Amplify)

Deployed as a Next.js SSR app on AWS Amplify.

### Environment Variables on Amplify

**Important**: Amplify does not automatically pass console environment variables to the SSR Lambda runtime. The `amplify.yml` build spec writes them to `.env.production` before the build:

```yaml
build:
  commands:
    - env | grep -e MYSCRIPT_ >> .env.production
    - env | grep -e GOOGLE_CLOUD_ >> .env.production
    - npm run build
```

Required Amplify Console environment variables:
- `MYSCRIPT_APPLICATION_KEY`
- `MYSCRIPT_HMAC_KEY`
- `MYSCRIPT_SERVER_URL`
- `GOOGLE_CLOUD_API_KEY`

### Audio File Deployment

Amplify's Next.js adapter (for Next.js 16) does not deploy the `public/` directory for SSR apps. Audio files are handled via:

1. `amplify.yml` copies `public/audio/` into `.next/static/audio/` during build
2. `next.config.ts` rewrites `/audio/*` to `/_next/static/audio/*`
3. Audio files are committed to git (not gitignored)

### Build Configuration

See `amplify.yml` for the full build spec. Key points:
- `baseDirectory: .next` (SSR mode, not static export)
- Audio files copied to `.next/static/audio/` post-build
- `node_modules` and `.next/cache` are cached between builds
