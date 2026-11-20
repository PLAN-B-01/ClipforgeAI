# ClipForge AI — Online AI Video Studio

A responsive browser video editor for Android Chrome and desktop. FFmpeg.wasm renders edits locally in the browser; AI edit planning and online speech transcription use server-side API routes.

## Features
- Local video selection and preview (source video is not uploaded for AI edit planning)
- Natural-language AI Director at `/api/ai-edit`
- Online English speech-to-subtitle generation at `/api/transcribe`
- Timestamped transcript and downloadable SRT
- FFmpeg.wasm trim, 9:16 / 16:9 crop, speed, rotation, volume, fade in/out
- Motion presets: zoom in/out, pan left/right, light shake
- Looks: cinematic contrast, grayscale, vintage, soft blur, sharpen
- Subtitle burn-in where the FFmpeg WASM build supports the `subtitles` filter
- PWA shell caching

## Deploy (Vercel recommended)
1. Push the contents of this folder to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel Project Settings → Environment Variables, add:
   - `OPENAI_API_KEY` — required, server-side only
   - `OPENAI_MODEL` — optional; defaults to `gpt-4.1-mini`
   - `OPENAI_TRANSCRIPTION_MODEL` — optional; defaults to `whisper-1`
4. Deploy. The `/api` directory is deployed as serverless functions automatically.
5. Open the HTTPS deployment URL. Never put the API key in `index.html` or commit it to GitHub.

## Run locally
The API routes require a serverless-compatible runtime. Use Vercel CLI:
```bash
npm i -g vercel
vercel dev
```
Then open the local URL printed by Vercel. A plain `python -m http.server` can preview the interface but will not run `/api/ai-edit` or `/api/transcribe`.

## Online subtitles privacy and size
- The browser extracts a mono MP3 audio track from the selected video and sends only that audio to `/api/transcribe`.
- The server forwards the audio to OpenAI using the server-side key and returns timestamped segments.
- The source video itself is not uploaded for subtitle generation or AI edit planning.
- Audio is intentionally limited to about 3 MB in the browser request to stay within common serverless request-size limits. Trim long videos into shorter clips if needed.
- Online transcription requires an internet connection and may incur API charges under the configured OpenAI account.

## Important limitations
- AI commands create a structured edit plan and populate the supported controls; the user reviews the settings and presses Export.
- FFmpeg.wasm runs in browser memory. Large/high-resolution videos may exceed mobile device memory; start with short clips.
- Zoom/pan/shake and visual looks are FFmpeg filter presets, not generative object animation. They animate the existing footage; they do not create new characters, scenes, or motion that was not filmed.
- Subtitle burn-in depends on the FFmpeg WASM build supporting `subtitles`/libass. If unavailable, export the video and download the SRT separately.
- The app is a web app/PWA, not a native Android APK.
