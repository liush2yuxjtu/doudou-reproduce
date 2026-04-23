import type { RawPaperclipsScene } from '../shared/types.js';

export interface ParsedFrameContext {
  captureId: number;
  capturedAt: string;
}

export function parsePaperclipsSceneJson(text: string, frame: ParsedFrameContext): RawPaperclipsScene {
  const jsonText = extractJsonObject(text);
  const parsed = JSON.parse(jsonText) as Omit<RawPaperclipsScene, 'captureId' | 'capturedAt'>;

  if (!parsed.fields || typeof parsed.fields !== 'object') {
    throw new Error('vlm_scene_missing_fields');
  }

  return {
    captureId: frame.captureId,
    capturedAt: frame.capturedAt,
    isPaperclips: Boolean(parsed.isPaperclips),
    confidence: numberOrZero(parsed.confidence),
    fields: parsed.fields,
    unknowns: Array.isArray(parsed.unknowns) ? parsed.unknowns.map(String) : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes.map(String) : []
  };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Codex CLI transcripts can echo prompts before the final answer. Fall through
      // and search for the last parseable Paperclips scene object.
    }
  }

  let lastValid: string | null = null;
  const candidates = findJsonObjectCandidates(trimmed);
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const candidate = candidates[i];
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === 'object' && 'fields' in parsed) {
        return candidate;
      }
      lastValid = lastValid ?? candidate;
    } catch {
      // Keep scanning older candidates.
    }
  }

  if (lastValid) return lastValid;
  throw new Error('vlm_malformed_json');
}

function findJsonObjectCandidates(text: string): string[] {
  const candidates: string[] = [];
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== '{') continue;
    const end = findJsonObjectEnd(text, start);
    if (end !== -1) {
      candidates.push(text.slice(start, end + 1));
    }
  }
  return candidates;
}

function findJsonObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return i;
      if (depth < 0) return -1;
    }
  }

  return -1;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
