# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-04-24

### Added
- Initial Electron + TypeScript scaffold for Paperclips AI companion
- Selected-window capture service with desktop capturer
- OpenAI Vision scene parser with JSON boundary validation
- Scene validator to reject stale, low-confidence, or missing fields
- Deterministic policy engine for Paperclips game actions
- Evidence validator to block unsupported or stale citations
- Sidecar UI renderer with TTS controls and state display
- Eval runner with unit test coverage for policy engine
- Architecture documentation and interview demo script

### Tested
- 19 unit tests passing (concurrency, parsing, validation, policy, evidence, API client)
- 3 evals passing (early economy pricing, wire management, stable state)
- Full build succeeds (TypeScript + esbuild)
- Health score: 100/100
