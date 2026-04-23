<!-- /autoplan restore point: /Users/m1/.gstack/projects/doudou_reproduce/no-branch-autoplan-restore-20260423-175826.md -->

See the use cases in https://lynksoul.com/#usecase. We want to reproduce the core product experience in the fastest and easiest way so I can pass interviews for this project.

Important correction: we are NOT building an HTML demo or a static marketing page. We are building a real product demo.

## Goal

Build an interview-ready AI game companion product demo inspired by Lynksoul / 逗逗 AI. The demo should prove the real product loop:

screen or game-window capture -> VLM scene understanding -> LLM reasoning -> voice/text response -> lightweight companion overlay

The interviewer should feel that the product can actually watch gameplay, understand what is happening, and respond like a useful AI teammate.

## Fastest MVP Scope

Build one working desktop product demo first, not five games.

Core features:

- Select or capture a game window / screen.
- Periodically capture frames from the game view.
- Send frames to a VLM to summarize the current scene.
- Let the user ask questions by push-to-talk or text input.
- Use an LLM to answer based on the current visual scene and the user's question.
- Speak the response back with TTS.
- Show a small companion overlay with the latest scene summary, advice, and conversation.
- Keep simple local session memory for the current interview demo.

Use-case examples to copy from Lynksoul:

- Scene recognition: detect important gameplay moments and proactively comment.
- Strategy Q&A: answer game-related questions based on the screen.
- Real-time voice companion: the user can talk to the AI while playing.
- Emotional companionship: praise highlights, comfort after death or mistakes.
- Session memory: remember what happened earlier in the current run.

Game-specific examples from Lynksoul:

- League of Legends: post-game review, team-fight comments, missing enemy reminders, gold / item reminders, highlight praise, death comfort.
- Valorant: character guidance, team composition suggestions, kill praise, spike defuse celebration, shop / night-market reminders, pre-round encouragement.
- Black Myth: Wukong: boss strategy, collection guide, level flow, quest guide, item acquisition, achievement praise.
- Delta Force: highlight moments, operator recommendation, gun modification advice, mission reminders.
- Genshin Impact: chest collection, character development, Spiral Abyss team suggestions, wish-pull companionship, quest guidance, exploration companionship.

## Non-Goals

- Do not build a static website as the main deliverable.
- Do not build a fake HTML-only prototype.
- Do not support every game in the first version.
- Do not build production-grade long-term memory.
- Do not integrate with game internals or do anything that requires anti-cheat bypassing.

## Product Demo Plan Based On gstack

1. Use `/office-hours` to sharpen the interview goal and decide the narrowest impressive demo.
2. Use `/plan-eng-review` to lock the desktop-app architecture and implementation path.
3. Build the real MVP loop: capture -> VLM -> LLM -> voice/text response -> overlay.
4. Prepare interview artifacts:
   - `ARCHITECTURE.md`
   - `DEMO_SCRIPT.md`
   - `LIMITATIONS.md`
5. Use `/qa` to verify the demo flow, audio flow, screen capture, and interview script.

## Recommended First Version

Target one stable scenario:

- Best case: live capture from a real game window.
- Acceptable interview fallback: capture a prerecorded gameplay video window, while still running the real screen-capture, VLM, LLM, response, and overlay pipeline.

The first version is successful if I can run the app, show gameplay on screen, ask "what should I do now?", and receive a useful spoken answer based on the visual scene.

## Validation Command

Use this to check whether the proposal is clear:

```bash
claudefast -p "what we are going to do based on @proposal.md?"
```

---

## GSTACK AUTOPLAN REVIEW REPORT

### Phase 0 Intake

Plan summary: build an interview-ready desktop AI game companion demo that proves a real loop: selected game/window capture, frame sampling, VLM scene understanding, LLM reasoning, voice/text input, TTS output, and a lightweight companion overlay.

Repository context:

- Project root: `/Users/m1/projects/doudou_reproduce`
- Git status: no git repository detected in this directory
- Base branch fallback: `main`
- Existing project files: `proposal.md` only
- Existing design doc: none found under `~/.gstack/projects/doudou_reproduce/`
- UI scope: yes, because the plan includes screen/window capture, overlay, text input, voice response, visible scene summaries, and user-facing interaction states
- DX scope: no, because the product demo is for gamer/interviewer use, not a developer-facing API, CLI, SDK, or package

Review mode: `SELECTIVE_EXPANSION`, per `/autoplan` default. The current plan is the baseline, but expansions inside the blast radius can be considered if they make the demo materially more convincing.

### Source Reliability

| Source | Author / Owner | Official? | Reliability | Used For |
|---|---:|---:|---:|---|
| [Lynksoul / 逗逗 AI](https://lynksoul.com/#usecase) | 心影随形 / 逗逗 AI | yes | ★★★★★ | Reference product loop, use cases, game-specific examples |
| [Sidekick AI](https://sidekick.modax.ai/) | Modax Inc. | yes | ★★★★☆ | Competitive signal for screen-watching voice coaching |
| [Questie AI](https://www.questie.ai/my-companions) | Questie | yes | ★★★★☆ | Competitive signal for custom AI game companions and screen reaction |
| [Razer Game Companion-AI](https://www.razer.ai/game-co-ai/) | Razer Inc. | yes | ★★★★★ | Competitive signal for vision-based coaching, ToS positioning, game-specific training |
| [OpenAI Images and Vision Docs](https://platform.openai.com/docs/guides/images-vision) | OpenAI | yes | ★★★★★ | Feasibility reference for image inputs and vision model calls |
| [Apple ScreenCaptureKit Docs](https://developer.apple.com/documentation/screencapturekit/capturing_screen_content_in_macos) | Apple | yes | ★★★★★ | Feasibility reference for macOS screen/window capture |
| [Apple AVSpeechSynthesizer Docs](https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer) | Apple | yes | ★★★★★ | Feasibility reference for local TTS |

### Phase 1 CEO Review: Premise Challenge

#### 0A. Premises Named And Evaluated

| # | Premise | Evaluation | Risk If Wrong | Recommendation |
|---|---|---|---|---|
| P1 | The strongest interview goal is to reproduce Lynksoul's core product experience. | Risky. This proves integration ability, but may not prove product judgment or differentiation. | The demo looks like a weaker clone of existing products. | Reframe around one undeniable gameplay cognition moment. |
| P2 | A full capture -> VLM -> LLM -> TTS -> overlay loop is the fastest credible MVP. | Partly true, but too wide. It stacks capture, model quality, latency, voice, overlay, memory, and proactive behavior in one pass. | One weak link makes the whole demo feel fake or unreliable. | Make one stable scenario primary, then add live polish after the core moment works. |
| P3 | Live game-window capture should be the best case and prerecorded gameplay should be fallback. | Backwards for interview reliability. Real capture over a prerecorded gameplay video still proves the capture/model loop while making the demo repeatable. | Live game variance burns the demo. The fallback can look fake if not framed as benchmark mode. | Use prerecorded gameplay as benchmark/demo mode, live game as stretch proof. |
| P4 | Periodic frames are enough for useful game advice. | Unproven. Many game moments require temporal context, OCR, HUD reading, previous mistakes, cooldowns, inventory, or map state. | The model gives generic advice from a single frame. | Use a rolling 5-10 frame buffer, scene schema, confidence, unknowns, and session memory. |
| P5 | "What should I do now?" is a good core demo question. | Too generic. It invites generic answers and makes quality hard to judge. | The answer sounds plausible but not game-aware. | Use a specific prompt tied to the chosen scene, like "I died to this boss twice. What mistake am I repeating?" |
| P6 | Session memory can stay lightweight. | Reasonable, but it must be visible in the demo. Memory is one of the few things that makes this feel like a companion rather than a screenshot chatbot. | The demo feels like stateless Q&A. | Keep local session memory, but show one memory-based callback during the script. |
| P7 | Avoiding anti-cheat bypass is enough for trust. | Incomplete. Screen capture still has privacy, ToS, ranked-play, and data upload concerns. | Interviewer asks the obvious trust question and the answer is vague. | State selected-window capture only, no hooks, no game memory, no input automation, no ranked multiplayer demo, and explicit upload disclosure. |
| P8 | Interview success can be judged by whether the interviewer feels the app understands gameplay. | Too subjective. | You cannot tell whether the demo worked beyond vibes. | Add eval criteria: fixed clips, expected observations, max latency, and pass/fail examples. |

#### 0B. Existing Code Leverage

There is no implementation code in this directory yet, so there is no existing capture, VLM, LLM, TTS, overlay, memory, or QA harness to reuse. Existing leverage is external and architectural:

| Sub-problem | Existing Local Code | External/Built-In Leverage |
|---|---|---|
| Window/screen capture | none | macOS ScreenCaptureKit or a cross-platform capture library |
| Frame sampling | none | Timer/stream loop in app runtime |
| VLM scene understanding | none | OpenAI vision input or another multimodal API |
| LLM answer synthesis | none | Existing LLM API client after scaffold |
| TTS | none | macOS AVSpeechSynthesizer for fastest local speech, or cloud TTS if voice quality matters |
| Push-to-talk/text input | none | Desktop app keyboard shortcut and input field |
| Overlay | none | Native always-on-top utility window or Electron/Tauri transparent window |
| Session memory | none | Local JSON/event log for current run |
| Eval/demo replay | none | Fixed gameplay clip set plus expected-answer markdown/JSON |

#### 0C. Dream State Mapping

```
CURRENT STATE
  One proposal file. No implementation. Clear desire to build a real product demo,
  but success criteria and wedge are still broad.

        --->

THIS PLAN
  A working desktop companion loop that can watch gameplay, answer questions,
  speak back, and show an overlay. High demo value if the chosen scene is repeatable.
  Risk: generic screen Q&A if quality, latency, and memory are not measured.

        --->

12-MONTH IDEAL
  A game-aware companion platform with supported-game skill packs, scene schemas,
  evals per game, low-latency voice, privacy-safe capture, personality/memory,
  and clear boundaries that keep it coaching rather than cheating.
```

Dream state delta: the current plan moves in the right direction technically, but it needs a narrower wedge and eval-first proof to move toward a durable product rather than a clone-shaped integration demo.

#### 0C-bis. Implementation Alternatives

| Approach | Summary | Effort | Risk | Pros | Cons | Reuses |
|---|---|---:|---:|---|---|---|
| A. Live Companion First | Build live capture, VLM, LLM, TTS, overlay, and session memory against a real game window. | L | High | Most impressive if it works. Proves the real product loop. | Demo variance, anti-cheat/privacy questions, latency risk, many integrations at once. | Public APIs and native capture/TTS |
| B. Benchmark Clip Companion | Capture a prerecorded gameplay video window with the same real capture -> VLM -> LLM -> overlay pipeline, plus fixed eval clips and expected answers. | M | Med | Repeatable, honest, fast to debug, lets interview show evaluation discipline. | Must frame clearly so it does not look like a fake demo. Live-game proof is stretch. | Same pipeline, controlled visual input |
| C. Post-Game Review First | Skip real-time assistant loop and build a clip/session reviewer with scene summaries, mistakes, and next-run advice. | M | Low | Much easier to make useful. Stronger for strategy and memory. | Does not prove live voice companion. Less similar to Lynksoul's real-time pitch. | Same VLM/LLM/memory primitives |

Recommendation: choose Approach B as the primary path, then add a live-game smoke path only after benchmark mode passes. It best serves the interview goal because it proves the real pipeline while giving you deterministic evidence.

#### 0D. Selective Expansion Scan

Candidate expansions inside the blast radius:

| Candidate | Decision Class | Autoplan Recommendation | Rationale |
|---|---|---|---|
| Add `EVALS.md` with 10 clips, 20 questions, expected observations, latency targets | User Challenge, because it changes the stated plan artifacts | Add | Both external voices flagged subjective success criteria as a critical weakness. |
| Make prerecorded gameplay benchmark mode the primary demo path, with live capture as stretch | User Challenge, because it changes the stated first-version posture | Add | Both external voices flagged the current fallback framing as strategically risky. |
| Add explicit latency budget to the plan | Mechanical | Add | Game companion usefulness depends on timing. |
| Add privacy/anti-cheat/ToS section to `LIMITATIONS.md` | Mechanical | Add | The plan's non-goal is too thin for an interview. |
| Add one visible session-memory callback to the demo script | Mechanical | Add | Proves companion behavior without long-term memory. |
| Add companion personality polish | Taste | Defer | Useful, but can distract from proving visual game cognition. |

#### 0E. Temporal Interrogation

| Time | Human Team Question | CC + gstack Equivalent | Decision To Resolve Now |
|---|---|---|---|
| Hour 1 foundations | Which desktop shell, OS, and capture API? | First 10-15 minutes | Pick macOS-first native or Electron/Tauri now. |
| Hour 2-3 core logic | What scene schema does the VLM produce? | Next 15-30 minutes | Define JSON fields: scene, player_state, visible_hazards, suggested_action, confidence, unknowns. |
| Hour 4-5 integration | What happens when VLM is slow, wrong, empty, or stale? | Same session | Add stale-answer suppression and confidence language. |
| Hour 6+ polish/tests | How do we prove the demo worked? | Same or next session | Add eval clips, expected outputs, latency budget, and demo script. |

#### 0F. Mode Confirmation

Mode selected by `/autoplan`: `SELECTIVE_EXPANSION`.

Implementation approach pending premise gate: Approach B, Benchmark Clip Companion, is recommended as the primary path.

### CEO Dual Voices Summary

#### CLAUDE SUBAGENT, CEO Strategic Independence

- Critical: the plan optimizes for reproducing a product loop instead of proving one interview-winning product moment.
- Critical: the MVP is still too wide, with seven integration risks stacked together.
- High: the VLM premise is assumed. Single frames may not support real strategy advice.
- High: success metrics are subjective.
- High: privacy, ToS, and anti-cheat risks need an explicit trust story.
- Medium: interview artifacts should include `EVALS.md`, `COMPETITIVE_TEARDOWN.md`, and `WHY_THIS_WEDGE.md`.

#### CODEX SAYS, CEO Strategy Challenge

- The real pipeline proves plumbing, not credible product usefulness.
- "What should I do now?" is too weak as the core moment.
- The plan copies Lynksoul breadth without choosing a wedge.
- Prerecorded gameplay is dangerous if framed as fallback, but strong if framed as benchmark mode.
- The plan lacks latency budget, evaluation strategy, and a compliance story.
- The 10x reframe is one undeniable gameplay cognition scene with memory and timing constraints.

#### CEO Dual Voices Consensus Table

```
CEO DUAL VOICES - CONSENSUS TABLE
===============================================================
  Dimension                            Claude  Codex  Consensus
  ------------------------------------ ------- ------ ----------
  1. Premises valid?                   NO      NO     CONFIRMED GAP
  2. Right problem to solve?           PARTIAL PARTIAL CONFIRMED GAP
  3. Scope calibration correct?        NO      NO     CONFIRMED GAP
  4. Alternatives sufficiently explored? NO    NO     CONFIRMED GAP
  5. Competitive/market risks covered? NO      NO     CONFIRMED GAP
  6. 6-month trajectory sound?         NO      NO     CONFIRMED GAP
===============================================================
```

### User Challenge 1: Reframe The Demo Around One Evaluated Gameplay Moment

What the user said: reproduce the core Lynksoul product experience quickly enough to pass interviews, with live game capture as best case and prerecorded gameplay as fallback.

What both models recommend: keep the real product loop, but reframe the plan around one game, one scenario, one benchmarkable demo moment. Make prerecorded gameplay benchmark mode the primary path, because it still uses real capture/VLM/LLM/TTS/overlay but makes the demo repeatable and testable. Treat live capture from an actual game window as stretch proof, not the foundation.

Why: both voices independently flagged the same risk. A broad Lynksoul-style loop can look like plumbing plus generic advice. An eval-first moment can prove visual understanding, latency, memory, and product judgment in 3 minutes.

What context might be missing: the interviewer may specifically expect a live-game clone and may discount prerecorded gameplay even if it uses real screen capture. If that is true, live capture deserves more weight.

If the models are wrong, the cost is: we over-index on repeatability and evaluation, and the demo feels less magical than a live game companion.

### Premises Awaiting User Confirmation

Recommended premise set for the rest of `/autoplan`:

1. The interview-winning demo is one undeniable game-aware teammate moment, not broad Lynksoul feature parity.
2. The first supported scenario should be a stable gameplay clip or video window captured by the real screen-capture pipeline.
3. Live game capture remains in scope, but as a stretch/smoke path after benchmark mode works.
4. The demo must include eval proof: fixed clips/questions, expected observations, failure cases, and latency budget.
5. Session memory should be shown once in the demo, but long-term cross-game memory remains out of scope.
6. Trust boundaries are part of the product: selected-window capture, no hooks, no memory reading, no input automation, no ranked/tournament positioning, clear upload disclosure.

### Office Hours Result

User chose to pause `/autoplan` and run `/office-hours`.

Approved design doc: `/Users/m1/.gstack/projects/doudou_reproduce/m1-no-branch-design-20260423-193616.md`

Updated direction after office hours:

- Game: Universal Paperclips.
- Scenario: early-economy guidance.
- Core proof: the companion reads visible game state from screenshots through a VLM only.
- Hard constraint: no DOM reads, no JavaScript game-state reads, no web fetch or browser automation state reads for game status.
- Demo behavior: one proactive reminder plus one "What should I do now?" Q&A flow.
- Product loop: live selected-window capture -> VLM scene parser -> LLM advisor -> overlay -> optional TTS.
- Quality gate: saved screenshot eval first, then live window capture.
- Success proof: VLM extracts at least 8 of 10 early-economy fields and advice cites visible evidence.

Premise gate status: PASSED via approved `/office-hours` design doc. The rest of `/autoplan` reviews this Paperclips screenshot companion plan, not the original broad multi-game Lynksoul clone.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| 1 | Phase 0 | Proceed with standard review despite no design doc | Mechanical | Bias toward action | User explicitly invoked `/autoplan proposal.md`; proposal has enough context to review. | Stop and require `/office-hours` first |
| 2 | Phase 0 | Mark UI scope as yes | Mechanical | Completeness | Overlay, screen/window capture, text/voice input, visible summaries, and conversation are user-facing UI. | Skip design phase |
| 3 | Phase 0 | Mark DX scope as no | Mechanical | Explicit over clever | The product is not a developer API, CLI, SDK, or package. Internal validation commands do not make the product developer-facing. | Run DX review |
| 4 | Phase 1 | Select `SELECTIVE_EXPANSION` mode | Mechanical | Completeness | The baseline is plausible, but in-blast-radius improvements can materially improve interview success. | Hold scope only |
| 5 | Phase 1 | Recommend Approach B, Benchmark Clip Companion, as primary path | User Challenge | Completeness | Both independent voices flagged the current live-first/fallback framing as a strategic risk. | Keep live game capture as primary |
| 6 | Office Hours | Adopt Paperclips early-economy screenshot companion as first wedge | User Approved | Explicit over clever | User selected exploration/task guidance and Paperclips, with a hard VLM-only status-reading constraint. | Broad multi-game demo |
| 7 | Office Hours | Treat saved screenshot eval as quality gate, not replacement for live capture | Mechanical | Completeness | This preserves the real product loop while making VLM quality measurable. | Fake benchmark-only demo |
| 8 | Phase 2 | Use right-side sidecar panel excluded from capture | Mechanical | Explicit over clever | Prevents VLM self-reading feedback loop and avoids covering game controls. | Floating always-on-top overlay |
| 9 | Phase 2 | Put next action before scene summary | Mechanical | User outcome | The player needs the move and evidence first; transcript is secondary. | Scene-summary-first debug sidebar |
| 10 | Phase 2 | Require one TTS answer in final demo, text-first | Taste | Completeness | Voice is part of the Lynksoul-like experience, but text-first preserves reliability. | Text-only final demo |
| 11 | Phase 3 | Lock first demo to Electron + TypeScript | Mechanical | Explicit over clever | One desktop stack unblocks capture, sidecar UI, env handling, tests, and local run scripts. | Leave shell unresolved or build native macOS first |
| 12 | Phase 3 | Lock first VLM provider to OpenAI vision-capable model | Mechanical | Pragmatic | One provider reduces integration risk and matches the existing feasibility reference. | Provider bake-off before MVP |
| 13 | Phase 3 | Split VLM parsing, scene validation, deterministic policy, LLM phrasing, and evidence validation | Mechanical | Explicit over clever | This prevents prompt soup and makes ungrounded advice blockable before UI/TTS. | Single advisor service that reads image and writes advice |
| 14 | Phase 3 | Treat DOM/web fetch prevention as a dependency-graph invariant | Mechanical | Completeness | Policy alone is too weak; import allowlists and parser signatures must enforce image-only state. | Rely on comments and discipline |
| 15 | Phase 3 | Use monotonic capture_id and scene_id to reject stale model results | Mechanical | Completeness | The game can change while VLM/LLM calls are in flight, so late responses cannot overwrite fresh state. | Last response wins |
| 16 | Phase 3 | Make controlled video-window capture the interview fallback | Mechanical | Pragmatic | It preserves the live capture pipeline while avoiding the fake-demo smell of screenshot-only fallback. | Saved screenshot mode as interview fallback |
| 17 | Phase 3 | Add negative eval fixtures for prompt injection, stale races, sidecar capture, low-confidence crop, and TTS cancellation | Mechanical | Completeness | These are the failure modes most likely to embarrass the demo if only happy-path screenshots are tested. | Happy-path screenshot eval only |
| 18 | Phase 3 | Defer mic / push-to-talk until text + TTS passes | Taste | Pragmatic | The voice feeling comes from spoken output first; microphone input adds timing and permission risk. | Voice-first UX from day one |

### Phase 1 CEO Review: Full Sections

#### NOT In Scope

| Item | Rationale |
|---|---|
| Multi-game support | The interview demo wins by proving one loop deeply, not five games shallowly. |
| Competitive ranked-game coaching | Adds ToS, anti-cheat, and precision risk. Paperclips avoids that while preserving the screen-understanding proof. |
| Long-term cross-session memory | Not needed for the first interview. Current-run memory proves companion behavior. |
| Public packaging / notarized app | Local demo is enough. Packaging can follow if this becomes a reusable product. |
| DOM/webpage state reading | Explicitly forbidden because it invalidates the VLM product claim. |
| Full voice-first UX | TTS is polish after text response and overlay are reliable. |
| Companion personality system | Useful later, but not load-bearing for the first proof. |

#### What Already Exists

This directory has only `proposal.md`; no app code exists. The approved design doc creates the first real system shape. External leverage is:

| Need | Reuse / Built-In |
|---|---|
| Browser game surface | Universal Paperclips official web page |
| Screen/window capture | macOS window capture / ScreenCaptureKit-class capability |
| Vision model input | VLM image input API |
| Text reasoning | LLM advisor from structured scene schema |
| Speech | Local macOS speech first, cloud TTS optional |
| QA proof | Saved screenshot eval harness |

#### Dream State Delta

The Paperclips plan moves toward the 12-month ideal because it introduces the right primitives: per-game scene schema, VLM-only trust boundary, evals, local memory, proactive triggers, and latency gates. It does not yet create a scalable multi-game platform, but it avoids painting the architecture into a clone-demo corner.

#### Section 1: Architecture Review

System architecture:

```
Universal Paperclips in Browser
        |
        | selected-window pixels only
        v
Capture Service
        |
        | image bytes + timestamp + crop metadata
        v
VLM Scene Parser
        |
        | PaperclipsScene JSON
        v
Session Memory <----- Advice Events
        |
        | latest scene + trends + user question
        v
Advisor / LLM
        |
        | AdviceResponse JSON
        v
Overlay UI  ---- optional ----> TTS
```

Before/after dependency graph:

```
BEFORE
  proposal.md only

AFTER
  app shell
    -> capture service
    -> VLM scene parser
    -> advisor
    -> session memory
    -> overlay UI
    -> optional TTS
```

Data flow shadow paths:

```
INPUT IMAGE -> VLM PARSE -> SCENE JSON -> ADVISOR -> OVERLAY
   |             |              |           |          |
   | nil         | timeout      | invalid   | stale    | render fallback
   | empty       | malformed    | unknowns  | low conf | no proactive msg
   | wrong win   | low conf     | missing   | repeats  | show uncertainty
```

State machine:

```
Idle
  -> WindowSelected
  -> Capturing
  -> ParsingScene
  -> SceneReady
  -> Advising
  -> AdviceReady
  -> Speaking(optional)
  -> Capturing

Failure transitions:
  Capturing -> PermissionBlocked
  Capturing -> WindowMissing
  ParsingScene -> ParseFailed
  Advising -> AdviceFailed
  Any active state -> StaleScene
```

Architecture finding:

- `[P1] The desktop stack and VLM provider were unresolved before Phase 3.` Phase 3 resolves this as Electron + TypeScript for the first desktop shell and an OpenAI vision-capable model for the first VLM provider. This unblocks capture APIs, sidecar implementation, image formatting, JSON validation, latency targets, and TTS integration.

Auto-decision: keep the product plan approved and lock these as first-demo implementation choices. Principle: explicit over clever.

#### Section 2: Error & Rescue Registry

| Method / Codepath | What Can Go Wrong | Exception / Error Class |
|---|---|---|
| `CaptureService.selectWindow` | user cancels selection | `WindowSelectionCancelled` |
| `CaptureService.captureFrame` | screen permission missing | `ScreenPermissionDenied` |
| `CaptureService.captureFrame` | selected window missing/minimized/occluded | `WindowUnavailable` |
| `CaptureService.captureFrame` | wrong monitor or stale frame | `CaptureMismatch` |
| `ImagePreprocessor.cropAndScale` | crop bounds invalid | `InvalidCropRegion` |
| `VlmSceneParser.parse` | model timeout | `VlmTimeout` |
| `VlmSceneParser.parse` | malformed JSON | `VlmMalformedJson` |
| `VlmSceneParser.parse` | low confidence / unreadable UI | `LowConfidenceScene` |
| `Advisor.respond` | missing required visible fields | `InsufficientEvidence` |
| `Advisor.respond` | answer cites non-visible value | `UngroundedAdvice` |
| `SessionMemory.record` | corrupt local JSON | `MemoryStoreCorrupt` |
| `Overlay.render` | overlay process/window fails | `OverlayUnavailable` |
| `Tts.speak` | speech engine unavailable | `TtsUnavailable` |

| Exception / Error Class | Rescued? | Rescue Action | User Sees |
|---|---:|---|---|
| `WindowSelectionCancelled` | Y | Return to idle | "Select the Paperclips window to start." |
| `ScreenPermissionDenied` | Y | Show setup instructions | "Enable screen recording permission." |
| `WindowUnavailable` | Y | Pause polling | "I cannot see the game window." |
| `CaptureMismatch` | Y | Re-run selection | "This does not look like Paperclips." |
| `InvalidCropRegion` | Y | Fall back to full selected-window capture | "Capture crop failed, using full window." |
| `VlmTimeout` | Y | Cancel stale request, allow retry | "Vision is taking too long." |
| `VlmMalformedJson` | Y | Retry once with stricter JSON instruction | "I could not parse the screen state." |
| `LowConfidenceScene` | Y | Suppress proactive advice | "I need a clearer/larger capture." |
| `InsufficientEvidence` | Y | Ask for clearer capture or give conditional advice | "I cannot see enough to advise confidently." |
| `UngroundedAdvice` | Y | EvidenceValidator blocks UI/TTS if advice references unsupported, stale, unknown, or mismatched fields | User should never see ungrounded advice |
| `MemoryStoreCorrupt` | Y | Reset current session memory | "Session memory reset for this run." |
| `OverlayUnavailable` | Y | Fallback to console/text panel | "Overlay unavailable, showing text response." |
| `TtsUnavailable` | Y | Continue text-only | Text answer still appears |

Critical gap closed by Phase 3: `UngroundedAdvice` now has a live guard. The advisor must emit `used_fields[]`, and EvidenceValidator blocks UI/TTS unless every claim maps to the current scene or validated memory.

#### Section 3: Security & Threat Model

| Threat | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Accidental DOM/game-state reading violates product claim | Med | High | Static dependency test, capture-only interface, `LIMITATIONS.md` audit |
| Screenshot uploads expose browser/private data | Med | Med | Selected-window capture only, Paperclips-only demo, no full desktop by default |
| API key leakage | Low | High | `.env.example`, never commit real keys, runtime env vars |
| Prompt injection through visible game/web text | Low | Med | VLM parser outputs constrained JSON; advisor treats screenshot text as observed content, not instructions |
| Model hallucinates values | High | Med | Eval gate, `unknown` fields, evidence requirement |
| TTS speaks wrong/stale advice | Med | Med | Text-first, stale timestamp guard, optional TTS |
| User mistakes assistant for game automation | Low | Med | No input automation, no game internals, coaching-only language |

Security conclusion: no payment/auth/customer data surface exists, but the privacy and trust boundary is central to credibility. The plan mitigates this if the VLM-only enforcement tests are actually built.

#### Section 4: Data Flow And Interaction Edge Cases

Data flow:

```
SELECTED WINDOW
  -> permission check
  -> image capture
  -> crop/scale
  -> VLM parse
  -> schema validation
  -> session memory update
  -> trigger evaluation / user Q&A
  -> advice JSON
  -> overlay render
  -> optional TTS
```

Interaction edge cases:

| Interaction | Edge Case | Handled? | How |
|---|---|---:|---|
| Window selection | user chooses wrong window | Y | Detect "not Paperclips" and ask to reselect |
| Capture | permission missing | Y | explicit setup message |
| Capture | tiny text unreadable | Y | crop/scale + ask user to zoom |
| Proactive polling | same reminder repeats | Y | 30s suppression |
| Proactive polling | model answer stale | Y | 10s stale marker |
| Q&A | user asks before first scene | Y | capture on demand first |
| Q&A | low confidence scene | Y | conditional answer or ask for clearer capture |
| Memory | prior event absent | Y | no fake memory callback |
| TTS | speech fails | Y | text answer remains |

No unhandled P0/P1 interaction edge case found after office-hours revision.

#### Section 5: Code Quality Review

No implementation code exists yet, so code quality is a plan-level review.

Plan quality risks:

- Keep VLM parsing and LLM advice in separate modules. Mixing these creates untestable prompt soup.
- Keep capture source as image bytes. Passing a browser page object into parsing code is the path to accidental cheating.
- Avoid a generic "GameCompanionService" god object. Use narrow modules from the approved design doc.
- Use typed schemas or runtime validation for `PaperclipsScene` and `AdviceResponse`.

Auto-decision: require schema validation and separate parser/advisor modules in the engineering plan. Principle: explicit over clever.

#### Section 6: Test Review

New UX flows:

```
[+] Select Paperclips window
[+] See scene summary in overlay
[+] Receive one proactive reminder
[+] Ask "What should I do now?"
[+] Receive grounded text answer
[+] Optional TTS speaks answer
[+] See one memory callback
```

New data flows:

```
[+] image bytes -> VLM scene JSON
[+] scene JSON -> advisor response JSON
[+] scene/advice events -> session memory
[+] advice response -> overlay
[+] advice response -> optional TTS
```

New codepaths:

```
CaptureService
  ├── happy path selected-window image
  ├── permission denied
  ├── window missing
  ├── wrong window
  └── crop/scale fallback

VlmSceneParser
  ├── valid JSON high confidence
  ├── malformed JSON retry
  ├── timeout
  ├── low confidence
  └── unknown fields

Advisor
  ├── grounded recommendation
  ├── insufficient evidence
  ├── stale scene
  ├── repeated proactive advice
  └── memory callback

Overlay
  ├── scene ready
  ├── loading
  ├── error
  └── stale/low confidence
```

Coverage target:

| Path | Test Type | Requirement |
|---|---|---|
| VLM field extraction from saved screenshots | Eval | 8-12 screenshot cases |
| No hallucinated visible values | Eval | 0 invented numbers |
| Advice cites evidence | Unit/eval | `evidence[]` required |
| No DOM/web fetch state reading | Static/unit | fail on forbidden imports/adapters |
| Capture permission missing | Unit/integration | user sees setup message |
| Window missing/wrong | Unit/integration | reselect flow |
| Proactive reminder cooldown | Unit | no repeat within 30s |
| Stale advice guard | Unit | advice older than 10s marked stale |
| Overlay states | UI/unit | loading, scene, advice, error, stale |
| TTS failure | Unit | text answer remains |

Test gap: the current proposal did not include `EVALS.md`, but the approved design requires it. Add it to implementation scope.

#### Section 7: Performance Review

No DB or N+1 risk. Performance risk is model latency and image size.

Slowest paths:

| Path | Risk | Target |
|---|---|---|
| capture -> VLM parse | image upload + vision latency | keep cropped image, target < 4s |
| VLM scene -> LLM advice | JSON validation + answer generation | target < 2s after scene |
| TTS start | speech engine startup | start within 2s after final answer |

Performance decisions:

- Crop/scale Paperclips content before VLM call.
- Do not poll faster than every 8-12 seconds for proactive reminders.
- Capture on demand for Q&A.
- Cancel or ignore stale model responses.

#### Section 8: Observability & Debuggability Review

Required logs/metrics:

| Signal | Why |
|---|---|
| capture timestamp and selected window name | debug stale/wrong-window reports |
| VLM latency and confidence | know whether vision is the bottleneck |
| unknown fields count | detect unreadable screenshots |
| advice latency | track interview demo responsiveness |
| evidence count | catch ungrounded advice |
| proactive reminder trigger and suppression reason | debug repeated/missing reminders |
| eval pass/fail per screenshot | prove quality before demo |

Day-one dashboard can be a local debug panel or log file; no production telemetry needed.

#### Section 9: Deployment & Rollout Review

Rollout sequence:

```
1. Build saved screenshot eval harness
2. Pass eval threshold
3. Add on-demand selected-window capture
4. Add text overlay Q&A
5. Add proactive low-frequency polling
6. Add optional TTS
7. Run 3-minute demo script
```

Rollback:

```
If live capture fails -> use controlled Paperclips video-window capture through the same selected-window pipeline
If VLM quality regresses -> use saved screenshot eval mode for diagnosis, not as the interview fallback
If proactive polling fails -> run Q&A only
If TTS fails -> text-only overlay
If overlay fails -> console/text panel fallback
```

Deployment conclusion: local demo distribution is enough. Public release, signing, notarization, and CI packaging stay deferred.

#### Section 10: Long-Term Trajectory Review

Reversibility: 4/5. The Paperclips-specific schema can be replaced by future game-specific schemas if parser/advisor boundaries stay clean.

Debt introduced:

- Game-specific trigger rules.
- Screenshot eval maintenance.
- Local-only packaging.

Trajectory:

```
Paperclips early economy
  -> one game-specific scene schema
  -> eval-backed visual grounding
  -> reusable capture/parser/advisor/overlay pipeline
  -> future game packs
```

This is a good first rung. It avoids pretending a generic VLM is already a game expert.

#### Section 11: Design And UX Review

User flow:

```
Open Paperclips
  -> Select window
  -> Overlay shows "watching"
  -> VLM scene summary appears
  -> Proactive reminder appears if confidence high
  -> User asks "What should I do now?"
  -> Overlay shows answer + visible evidence + confidence
  -> Optional TTS speaks answer
```

State coverage:

| Feature | Loading | Empty | Error | Success | Partial |
|---|---:|---:|---:|---:|---:|
| Window selection | Y | Y | Y | Y | N/A |
| Scene parsing | Y | Y | Y | Y | Y, unknown fields |
| Proactive reminder | Y | Y, no trigger | Y | Y | Y, low confidence |
| Q&A | Y | Y, no scene yet | Y | Y | Y, conditional advice |
| TTS | Y | N/A | Y | Y | N/A |

Design issues:

- The overlay must not hide Paperclips controls or enter the capture region. Decision: use a right-side browser-adjacent sidecar panel, 320-380px wide.
- Primary hierarchy must be next action first, not scene summary first.
- Confidence/uncertainty should be visible, not buried. This is part of the product's honesty.
- The demo should show screenshot-derived evidence chips, not just advice, so the interviewer sees the VLM claim.
- Startup, loading, stale, low-confidence, speaking, and error states need explicit UI behavior.

#### Phase 2 Design Review

Design scope: yes. The product has a user-facing sidecar panel, capture setup, evidence display, Q&A input, transcript, stale/low-confidence states, and voice controls.

Initial design completeness: 6/10 before design review, 8/10 after auto-decisions.

Design dual voices:

```
DESIGN DUAL VOICES - CONSENSUS TABLE
===============================================================
  Dimension                            Claude  Codex  Consensus
  ------------------------------------ ------- ------ ----------
  1. Information hierarchy correct?    NO      NO     CONFIRMED GAP
  2. Interaction states complete?      NO      NO     CONFIRMED GAP
  3. Layout/capture relationship safe? NO      NO     CONFIRMED GAP
  4. Accessibility sufficient?         PARTIAL PARTIAL CONFIRMED GAP
  5. UI specificity adequate?          NO      NO     CONFIRMED GAP
  6. Emotional arc clear?              PARTIAL PARTIAL CONFIRMED GAP
===============================================================
```

Auto-decisions applied to the approved design doc:

| Decision | Classification | Principle | Rationale |
|---|---|---|---|
| Use right-side browser-adjacent sidecar, not floating overlay | Mechanical | Explicit over clever | Prevents VLM reading its own advice and keeps Paperclips controls visible. |
| Make next action the primary card | Mechanical | User outcome | The player needs the next move first, scene summary second. |
| Add evidence chips directly under advice | Mechanical | Completeness | Proves the advice came from visible screenshot state. |
| Add strict UI states for setup/capturing/reading/thinking/fresh/partial/low-confidence/stale/speaking/error | Mechanical | Completeness | Latency and uncertainty must feel intentional, not broken. |
| Make text input primary, mic secondary | Mechanical | Pragmatic | Text input reduces voice complexity while preserving the companion loop through TTS. |
| Require one spoken answer in final interview path | Taste | Completeness | Voice matters to the Lynksoul-like feel, but text remains first for reliability. |

Design pass scores:

| Pass | Before | After | Notes |
|---|---:|---:|---|
| Information Architecture | 5/10 | 8/10 | Next action -> evidence -> confidence -> scene fields -> input -> transcript |
| Interaction State Coverage | 5/10 | 8/10 | Added setup, latency, stale, partial, low-confidence, speaking, error states |
| User Journey & Emotional Arc | 6/10 | 8/10 | Select window -> detected values -> nudge -> ask -> answer -> memory callback |
| AI Slop Risk | 7/10 | 8/10 | Evidence chips and confidence prevent generic chatbot feel |
| Design System Alignment | N/A | N/A | No `DESIGN.md` exists; use universal desktop utility principles |
| Responsive & Accessibility | 4/10 | 7/10 | Keyboard flow, readable font, mute/stop controls required |
| Unresolved Design Decisions | 6 unresolved | 1 unresolved | Mic / push-to-talk timing remains |

Design litmus scorecard:

| Question | Verdict |
|---|---|
| Does the user know whether the app is watching? | Yes, via status strip and freshness timer |
| Does the user know what to do next? | Yes, primary next-action card |
| Does the user know why the advice is grounded? | Yes, evidence chips |
| Does the app avoid stale or low-confidence lies? | Yes, stale/partial/low-confidence states |
| Does the UI preserve the VLM-only claim? | Yes, sidecar is excluded from capture |

Design completion summary:

```
+==============================================================+
| DESIGN REVIEW - COMPLETION SUMMARY                          |
+==============================================================+
| Step 0               | 6/10 -> 8/10                          |
| Pass 1 Info Arch     | 5/10 -> 8/10                          |
| Pass 2 States        | 5/10 -> 8/10                          |
| Pass 3 Journey       | 6/10 -> 8/10                          |
| Pass 4 AI Slop       | 7/10 -> 8/10                          |
| Pass 5 Design Sys    | N/A, no DESIGN.md                     |
| Pass 6 Responsive    | 4/10 -> 7/10                          |
| Pass 7 Decisions     | 5 resolved, 1 deferred                |
+--------------------------------------------------------------+
| Mandatory fix        | sidecar panel excluded from capture   |
| Remaining risk       | no visual mockups generated yet       |
+==============================================================+
```

#### CEO Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|---|---|---:|---:|---:|---:|
| Capture | permission denied | Y | Y | Y | Y |
| Capture | wrong/minimized window | Y | Y | Y | Y |
| VLM parse | timeout/malformed JSON | Y | Y | Y | Y |
| VLM parse | low confidence | Y | Y | Y | Y |
| Advisor | ungrounded advice | Y | Y | Blocked before UI/TTS | Y |
| Advisor | stale advice | Y | Y | Y | Y |
| Proactive reminder | repeated message | Y | Y | Suppressed | Y |
| Overlay | render failure | Y | Y | fallback | Y |
| TTS | unavailable | Y | Y | text-only | Y |

Critical gaps: 0 after Phase 3 engineering decisions.

#### CEO Completion Summary

```
+====================================================================+
|            MEGA PLAN REVIEW - COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| System Audit         | no git repo, proposal.md only, design doc approved |
| Step 0               | Paperclips early-economy VLM-only companion       |
| Section 1  (Arch)    | stack/provider resolved in Phase 3               |
| Section 2  (Errors)  | 13 error paths mapped, 0 open critical gaps      |
| Section 3  (Security)| 7 threats mapped, 0 high unmitigated             |
| Section 4  (Data/UX) | 9 edge cases mapped, 0 unhandled P1/P0           |
| Section 5  (Quality) | 4 plan-level guardrails required                 |
| Section 6  (Tests)   | Diagram produced, EVALS.md required              |
| Section 7  (Perf)    | 3 latency risks flagged                          |
| Section 8  (Observ)  | 7 local debug signals required                   |
| Section 9  (Deploy)  | local demo rollout defined                       |
| Section 10 (Future)  | Reversibility: 4/5, debt items: 3                |
| Section 11 (Design)  | 3 UI issues                                      |
+--------------------------------------------------------------------+
| NOT in scope         | written (7 items)                               |
| What already exists  | written                                         |
| Dream state delta    | written                                         |
| Error/rescue registry| 13 codepaths, 0 open critical gaps              |
| Failure modes        | 9 total, 0 open critical gaps                   |
| TODOS.md updates     | written in Phase 3                              |
| Scope proposals      | 6 proposed, 5 accepted/deferred                 |
| CEO plan             | office-hours design doc approved                |
| Outside voice        | ran (codex+subagent)                            |
| Lake Score           | 6/7 recommendations chose complete option       |
| Diagrams produced    | architecture, data flow, state machine, rollout |
| Stale diagrams found | 0                                               |
| Unresolved decisions | mic / push-to-talk timing only                  |
+====================================================================+
```

### Phase 3 Engineering Review

Engineering scope: full review required. The plan creates a desktop app from scratch with capture, image preprocessing, VLM parsing, schema validation, policy decisions, LLM phrasing, sidecar UI, TTS, evals, local memory, and demo artifacts.

#### Step 0 Scope Challenge

| Question | Finding | Decision |
|---|---|---|
| Existing code reuse | No implementation code exists. Only `proposal.md` and the approved design doc exist. | Start from a clean scaffold. |
| Minimum complete change | A real demo needs live selected-window capture, screenshot evals, scene schema, policy engine, evidence validator, sidecar Q&A, and one TTS answer. | Build the complete Paperclips slice, not a generic companion platform. |
| Complexity check | More than 2 services are required, but this is essential complexity, not overbuild. | Keep services narrow and test each boundary. |
| Search / built-ins | Use Electron/Chromium capture primitives, OpenAI vision API, TypeScript validation, and macOS local speech. | Avoid custom capture drivers or multi-provider abstraction first. |
| TODOS cross-reference | No `TODOS.md` existed before this review. | Create it with deferred non-blocking work. |
| Distribution | Public packaging is deferred. Local one-command demo is enough for interview use. | Document packaging as out of scope. |

#### Engineering Dual Voices

```
ENG DUAL VOICES - CONSENSUS TABLE
===============================================================
  Dimension                            Claude  Codex  Consensus
  ------------------------------------ ------- ------ ----------
  1. Architecture sound?               NO      NO     CONFIRMED GAP
  2. Test coverage sufficient?         NO      NO     CONFIRMED GAP
  3. Performance risks addressed?      PARTIAL PARTIAL CONFIRMED GAP
  4. Security threats covered?         PARTIAL PARTIAL CONFIRMED GAP
  5. Error paths handled?              PARTIAL PARTIAL CONFIRMED GAP
  6. Deployment risk manageable?       PARTIAL PARTIAL CONFIRMED GAP
===============================================================
```

Key Phase 3 fixes applied to the approved design doc:

| Finding | Severity | Auto-Decision | Result |
|---|---:|---|---|
| Stack/provider unresolved | P0 | Lock Electron + TypeScript and OpenAI vision-capable model | Resolved |
| VLM-only boundary too policy-based | P0 | Add dependency allowlist and parser signature tests | Resolved |
| LLM could invent strategy | P0 | Add deterministic Policy Engine before LLM phrasing | Resolved |
| Ungrounded advice could reach live UI/TTS | P0 | Add EvidenceValidator after LLM phrasing | Resolved |
| Late model responses could overwrite fresh scenes | P1 | Add monotonic `capture_id` / `scene_id` and queue size 1 | Resolved |
| Scene schema was too loose | P1 | Use typed field envelopes with value/raw/unit/confidence/visible | Resolved |
| Screenshot eval could overfit happy path | P1 | Add negative fixtures and trigger-critical field rules | Resolved |
| Saved screenshots as fallback smell fake | P1 | Use controlled video-window capture as interview fallback | Resolved |

#### Phase 3 Section 1: Architecture

Final dependency graph:

```
Electron Main Process
  -> Window Selection / Capture Service
  -> Image Preprocessor
  -> Model Client: OpenAI Vision
  -> Local Config / Env

Electron Renderer: Sidecar Panel
  -> Status Store
  -> Scene Store
  -> Advice Store
  -> Transcript Store
  -> TTS Controls

Runtime Pipeline
  selected window pixels
    -> CaptureFrame {capture_id, image, crop, timestamp, hash}
    -> VlmSceneParser(image bytes only)
    -> SceneValidator(PaperclipsScene)
    -> SessionMemory(validated scenes/advice only)
    -> PolicyEngine(validated scene + memory)
    -> Advisor / LLM Phraser(allowed action + evidence)
    -> EvidenceValidator(current scene + advice)
    -> Sidecar UI
    -> TTS
```

Architecture decision: split the model work into parser, validator, deterministic policy, phraser, and evidence validator. That is more modules than a prototype normally wants, but each boundary prevents a specific demo-killing failure.

Security architecture:

```
Allowed runtime state source:
  image bytes from selected Paperclips window

Forbidden runtime state sources:
  DOM selectors
  page.evaluate / JS variables
  Chrome DevTools state reads
  web fetch status reads
  local storage / indexed DB
  game internals
```

Distribution architecture: local Electron app only for first interview. `npm run dev` or equivalent is enough. Public packaging, signing, notarization, auto-update, and CI release are deferred.

#### Phase 3 Section 2: Code Quality

No implementation code exists yet, so findings are plan-level module risks.

| Issue | Severity | Decision |
|---|---:|---|
| Risk of a god `GameCompanionService` | P1 | Keep capture, parser, validator, policy, advisor, evidence, memory, UI state, and TTS separate. |
| Risk of prompt soup | P1 | VLM only extracts state; policy chooses action; LLM phrases one allowed action. |
| Risk of weak schemas | P1 | Use runtime validation for `PaperclipsScene`, `PolicyAction`, and `AdviceResponse`. |
| Risk of silent demo drift | P2 | Log capture age, confidence, unknown field count, policy action, evidence count, and latency. |

Implementation files that should contain ASCII diagrams or short comments:

| Future Area | Diagram / Comment Needed |
|---|---|
| `CaptureService` | Capture lifecycle and stale-frame rejection |
| `VlmSceneParser` | Image-only boundary and forbidden inputs |
| `PolicyEngine` | Paperclips early-economy trigger priority |
| `EvidenceValidator` | Advice approval/blocking pipeline |
| `SessionMemory` | Which events may be remembered and why |

#### Phase 3 Section 3: Test Review

No existing test framework is present because no app scaffold exists yet. The implementation must add the test stack as part of the first scaffold. Recommended default for Electron + TypeScript: Vitest for unit tests, Playwright for UI/integration smoke tests, and a local eval runner for VLM/advice cases.

Coverage diagram:

```
CODE PATHS                                             USER FLOWS
[GAP] CaptureService                                   [GAP] Select Paperclips window
  |-- [->UNIT] permission missing                         |-- [->E2E] cancel selection
  |-- [->UNIT] wrong/minimized window                     |-- [->E2E] wrong window selected
  |-- [->UNIT] crop invalid                               `-- [->E2E] valid window selected
  |-- [->UNIT] duplicate screenshot hash
  `-- [->UNIT] sidecar included in crop                 [GAP] Ask "What should I do now?"

[GAP] VlmSceneParser                                    |-- [->E2E] capture fresh scene first
  |-- [->EVAL] 8-12 screenshot field extraction          |-- [->UNIT] stale latest scene disables Ask latest
  |-- [->EVAL] low confidence screenshot                 |-- [->EVAL] answer cites visible evidence
  |-- [->UNIT] malformed JSON retry                      `-- [->E2E] transcript updates
  `-- [->UNIT] timeout

[GAP] SceneValidator                                   [GAP] Proactive reminder
  |-- [->UNIT] unknown critical field blocks policy      |-- [->UNIT] trigger fires only with required fields
  |-- [->UNIT] unit normalization                        |-- [->UNIT] duplicate reminder suppressed 30s
  `-- [->UNIT] confidence threshold                      `-- [->E2E] no speech on low confidence

[GAP] PolicyEngine                                     [GAP] TTS
  |-- [->UNIT] buy_wire trigger                          |-- [->UNIT] starts only after text display
  |-- [->UNIT] lower_price trigger                       |-- [->UNIT] stops on new capture / stale advice
  |-- [->UNIT] buy_marketing trigger                     `-- [->E2E] mute/stop controls work
  |-- [->UNIT] buy_auto_clipper trigger
  `-- [->UNIT] wait / capture_again fallback            [GAP] Setup and recovery states

[GAP] Advisor / EvidenceValidator                       |-- [->E2E] missing API key
  |-- [->UNIT] unsupported field blocks advice           |-- [->E2E] model timeout
  |-- [->UNIT] stale scene_id blocks advice              |-- [->E2E] low confidence recovery
  |-- [->UNIT] low-confidence memory cannot ground claim `-- [->E2E] reselect window
  `-- [->EVAL] prompt injection in visible screenshot

COVERAGE NOW: 0/43 paths tested because implementation has not started.
REQUIRED BEFORE DEMO: all P0/P1 unit paths, all screenshot evals, and 5 E2E smoke flows.
```

Mandatory test requirements:

| Test File / Area | Type | Requirement |
|---|---|---|
| `tests/unit/capture-service.test.ts` | Unit | Permission denied, window unavailable, crop invalid, duplicate hash, sidecar-in-crop rejection |
| `tests/unit/scene-validator.test.ts` | Unit | Typed field normalization, unknown critical fields, confidence thresholds, stale timestamp rejection |
| `tests/unit/policy-engine.test.ts` | Unit | All Paperclips trigger priorities and fallback action |
| `tests/unit/evidence-validator.test.ts` | Unit | Blocks unsupported fields, stale scene IDs, unknown values, low-confidence memory |
| `tests/unit/concurrency.test.ts` | Unit | Late VLM/LLM results ignored by `capture_id` / `scene_id` |
| `evals/paperclips/*.json` | Eval | 8-12 screenshot cases with expected visible fields and acceptable advice |
| `evals/paperclips/negative/*.json` | Eval | wrong window, low crop quality, prompt injection text, sidecar capture, stale response race |
| `tests/e2e/demo-flow.spec.ts` | E2E | select window, capture, ask question, show evidence, update transcript |
| `tests/e2e/setup-errors.spec.ts` | E2E | missing key, missing permission, wrong window, model timeout recovery |
| `tests/e2e/tts.spec.ts` | E2E | text appears before speech, stop/mute, cancel on stale advice |

#### Phase 3 Section 4: Performance

Slow paths:

| Path | Risk | Mitigation | Target |
|---|---|---|---|
| Capture -> VLM | image upload and vision latency | crop/scale, hash identical frames, queue size 1 | <4s |
| Scene -> advice | model call and validation | deterministic policy first, short phraser prompt | <2s |
| Proactive polling | model cost and repeated advice | 8-12s cadence, cooldown, no poll when stale or low confidence | one useful nudge |
| TTS | speech start and stale speech | text first, start <2s, cancel on new scene | no stale speech |

No database, N+1, or server scaling risk exists in the first local demo. The 10x risk is interaction load: repeated captures while a prior model call is still running. The queue and ID contract handle this.

#### Phase 3 Failure Modes Registry

| Codepath | Failure Mode | Test? | Error Handling? | User Sees? | Critical Gap? |
|---|---|---:|---:|---:|---:|
| Capture | permission denied | Required | Y | Y | N |
| Capture | wrong/minimized window | Required | Y | Y | N |
| Capture | sidecar enters crop | Required | Y | Y | N |
| Capture | duplicate screenshot | Required | Y | N/A | N |
| VLM parse | timeout/malformed JSON | Required | Y | Y | N |
| VLM parse | low confidence | Required | Y | Y | N |
| Scene validation | unknown trigger-critical field | Required | Y | Y | N |
| Policy engine | no allowed action | Required | Y | Y | N |
| Advisor | unsupported claim | Required | Y | Blocked | N |
| Evidence validator | stale scene or memory | Required | Y | Blocked | N |
| Proactive reminder | repeated message | Required | Y | Suppressed | N |
| TTS | speech unavailable or stale | Required | Y | text remains | N |

#### Phase 3 Parallelization Strategy

Dependency table:

| Step | Modules Touched | Depends On |
|---|---|---|
| App scaffold and config | app shell, config, scripts | none |
| Schemas and validators | shared schemas, validator | app scaffold |
| Policy engine and memory | runtime policy, memory | schemas and validators |
| Capture service | desktop main process, image processing | app scaffold |
| Model clients and parser | model client, VLM parser | schemas and validators |
| Advisor and evidence validator | advisor, policy, evidence | policy engine and parser contracts |
| Sidecar UI | renderer UI, state store | schemas and capture status contracts |
| Evals and tests | test/eval folders | schemas, parser, policy, evidence contracts |
| Demo docs | docs/artifacts | final behavior decisions |

Parallel lanes:

```
Lane A: app scaffold -> capture service
Lane B: schemas -> validator -> policy engine -> evidence validator
Lane C: sidecar UI skeleton -> UI states
Lane D: screenshot eval fixtures -> eval runner

Merge A+B before live model loop.
Merge B+D before quality gate.
Merge A+B+C before 3-minute demo.
```

Conflict flags: Lane B owns shared contracts. Other lanes should import schemas, not redefine local copies.

#### Phase 3 NOT In Scope

| Item | Rationale |
|---|---|
| Multi-game support | Paperclips is the first evaluated wedge. |
| Native macOS rewrite | Electron is locked for first interview speed. |
| Multi-provider VLM abstraction | One provider keeps the first demo shippable. |
| Public packaging, signing, notarization | Local interview demo is enough. |
| Voice-first mic / push-to-talk | Text input plus TTS proves the loop with less permission risk. |
| Long-term memory | Current-session memory is enough to show companion behavior. |

#### Phase 3 What Already Exists

| Sub-problem | Existing Code | Reuse Decision |
|---|---|---|
| Proposal and strategic scope | `proposal.md` | Updated by `/autoplan` |
| Product/design source of truth | approved office-hours design doc | Use as implementation contract |
| App shell | none | Create Electron + TypeScript scaffold |
| Capture/VLM/advice/overlay/TTS | none | Implement first Paperclips slice |
| Tests/evals | none | Create with scaffold |

#### Phase 3 Completion Summary

```
+====================================================================+
|                 ENGINEERING REVIEW - COMPLETION SUMMARY            |
+====================================================================+
| Step 0 Scope Challenge | accepted as complete Paperclips slice     |
| Architecture Review    | 8 issues found, 8 resolved in design doc   |
| Code Quality Review    | 4 plan-level risks, all constrained        |
| Test Review            | coverage diagram produced, 43 gaps mapped  |
| Performance Review     | 4 slow paths, all have targets/guards       |
| NOT in scope           | written                                    |
| What already exists    | written                                    |
| TODOS.md updates       | 4 items written                            |
| Failure modes          | 0 open critical gaps                       |
| Outside voice          | ran (codex+subagent)                       |
| Parallelization        | 4 lanes, 4 parallel until integration       |
| Lake Score             | 8/8 recommendations chose complete option  |
+====================================================================+
```

Phase 3.5 DX Review: skipped. The demo is user-facing, not developer-facing. The local run command and internal evals matter for implementation, but they do not make the product a developer API, SDK, CLI, or package.

### Cross-Phase Themes

| Theme | Flagged In | Resolution |
|---|---|---|
| Prove visual grounding, not generic chatbot behavior | CEO, Design, Eng | Paperclips early-economy VLM-only wedge, evidence chips, eval pass bar, and EvidenceValidator. |
| Avoid fake-demo smell | CEO, Eng | Live selected-window capture remains mandatory; saved screenshots are evals, controlled video-window capture is the fallback. |
| Block stale or unsupported advice before the user hears it | CEO, Design, Eng | Freshness states, monotonic IDs, queue size 1, EvidenceValidator, and TTS cancellation. |
| Keep the companion UI out of the capture | Design, Eng | Right-side sidecar panel, crop-boundary indicator, and sidecar-in-crop negative fixture. |
| Make the plan testable before implementation | CEO, Eng | Screenshot evals, negative fixtures, coverage diagram, and QA test plan artifact. |

### Final Approval

Status: APPROVED

Approved by user selection `A) Approve as-is` on 2026-04-23T12:46:29Z.
