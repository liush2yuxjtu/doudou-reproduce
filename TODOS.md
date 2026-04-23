# TODOS

## Paperclips Companion

### Add Mic / Push-To-Talk Input

**What:** Add microphone or push-to-talk input after text Q&A and TTS are reliable.

**Why:** Voice input makes the companion feel closer to Lynksoul / 逗逗 AI, but it is not required to prove visual grounding in the first interview.

**Context:** The approved design keeps text input primary and TTS required for one final answer. Add mic input only after capture, VLM parsing, evidence validation, sidecar states, and TTS cancellation pass the demo tests.

**Effort:** M
**Priority:** P2
**Depends on:** Text Q&A, TTS, stale-advice cancellation

### Package A macOS Build

**What:** Produce a packaged macOS app bundle once the local Electron demo is stable.

**Why:** Packaging improves interview polish and reuse, but a one-command local run is enough for the first demo.

**Context:** Phase 3 locked Electron + TypeScript for speed. Public signing, notarization, auto-update, and CI release are intentionally out of scope until the demo proves the product loop.

**Effort:** M
**Priority:** P3
**Depends on:** Stable local demo

### Explore Native macOS Rewrite

**What:** Revisit a native macOS shell after the Electron demo passes the interview loop.

**Why:** Native capture and speech integration may reduce runtime weight later, but switching stacks now would slow the first proof.

**Context:** Phase 3 chose Electron because it keeps capture, sidecar UI, local config, and test scaffolding in one TypeScript codebase. Native macOS is a later optimization, not a first-demo blocker.

**Effort:** L
**Priority:** P4
**Depends on:** Interview feedback from Electron demo

### Add Multi-Game Skill Packs

**What:** Add a second game-specific scene schema and policy pack after Paperclips works.

**Why:** Multi-game support is the 12-month platform direction, but first the Paperclips slice must prove VLM-only visual grounding.

**Context:** The architecture now separates capture, parser, validator, policy, advisor, evidence, memory, and UI. A second game should reuse that pipeline and only swap the schema, eval fixtures, and policy rules.

**Effort:** L
**Priority:** P3
**Depends on:** Paperclips eval pass and demo script

## Completed

### Implement First Electron Paperclips Companion Slice

**What:** Added Electron + TypeScript scaffold, selected-window capture, OpenAI vision scene parser boundary, scene validation, deterministic Paperclips policy, evidence blocking, sidecar UI, TTS controls, eval runner, and interview docs.

**Evidence:** `npm test`, `npm run build`, and `npm run eval` are the intended verification commands for this slice.
