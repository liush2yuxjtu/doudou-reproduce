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
    return trimmed;
  }

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('vlm_malformed_json');
  }

  return trimmed.slice(first, last + 1);
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
