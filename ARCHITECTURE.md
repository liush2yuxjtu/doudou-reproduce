# Paperclips Companion Architecture

The app is an Electron + TypeScript desktop sidecar for the Universal Paperclips interview demo.

Core loop:

```text
selected Paperclips window pixels
  -> Electron desktopCapturer frame
  -> OpenAI vision scene JSON
  -> scene validator
  -> deterministic Paperclips policy
  -> grounded advice response
  -> evidence validator
  -> sidecar UI
  -> optional browser TTS
```

Trust boundary:

- Runtime game state comes from captured image bytes only.
- Core runtime code does not use DOM selectors, browser automation state, web fetch state, local storage, or game internals.
- The sidecar is a separate Electron window and should not be selected as the capture source.

Important modules:

- `src/main/capture-service.ts`: lists selectable windows and captures selected-window screenshots.
- `src/main/openai-vision-client.ts`: sends image data either through `OPENAI_API_KEY` or through `codex exec --image` using local Codex auth.
- `src/core/scene-validator.ts`: rejects stale, low-confidence, or missing critical visible fields.
- `src/core/policy-engine.ts`: chooses the next allowed Paperclips action deterministically.
- `src/core/evidence-validator.ts`: blocks advice that cites unsupported or stale evidence.
- `src/renderer/app.ts`: sidecar UI and TTS controls.

Run:

```bash
npm install
cp .env.example .env
# optional: fill OPENAI_API_KEY. If empty, the app uses local Codex auth via codex exec.
npm run dev
```
