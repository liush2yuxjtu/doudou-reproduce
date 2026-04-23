import { describe, expect, it } from 'vitest';
import { parsePaperclipsSceneJson } from '../../src/core/vlm-scene-parser.js';

const sceneResponse = {
  isPaperclips: true,
  confidence: 0.9,
  fields: {
    clips: { value: 12, raw: '12', confidence: 0.9, visible: true },
    funds: { value: 1.23, raw: '$1.23', confidence: 0.9, visible: true },
    unsoldInventory: { value: 0, raw: '0', confidence: 0.9, visible: true },
    pricePerClip: { value: 0.25, raw: '$0.25', confidence: 0.9, visible: true },
    publicDemand: { value: 50, raw: '50%', confidence: 0.9, visible: true },
    wire: { value: 990, raw: '990 inches', confidence: 0.9, visible: true },
    wireCost: { value: 14, raw: '$14', confidence: 0.9, visible: true },
    clipsPerSecond: { value: 0, raw: '0/sec', confidence: 0.8, visible: true },
    marketingLevel: { value: 1, raw: '1', confidence: 0.8, visible: true },
    autoClipperCost: { value: 5, raw: '$5', confidence: 0.8, visible: true }
  },
  unknowns: [],
  notes: []
};

describe('parsePaperclipsSceneJson', () => {
  it('parses JSON text from a model response without requiring URL or DOM inputs', () => {
    const parsed = parsePaperclipsSceneJson(JSON.stringify(sceneResponse), {
      captureId: 1,
      capturedAt: '2026-04-23T12:00:00.000Z'
    });

    expect(parsed.captureId).toBe(1);
    expect(parsed.fields.funds.value).toBe(1.23);
  });

  it('extracts the final scene JSON from a Codex CLI transcript', () => {
    const transcript = [
      'Reading additional input from stdin...',
      'user',
      'Top level JSON shape:',
      '{"isPaperclips": boolean, "fields": {...}}',
      'codex',
      JSON.stringify(sceneResponse),
      'hook: Stop',
      'tokens used',
      '35,887'
    ].join('\n');

    const parsed = parsePaperclipsSceneJson(transcript, {
      captureId: 2,
      capturedAt: '2026-04-23T12:00:01.000Z'
    });

    expect(parsed.captureId).toBe(2);
    expect(parsed.isPaperclips).toBe(true);
    expect(parsed.fields.wire.value).toBe(990);
  });
});
