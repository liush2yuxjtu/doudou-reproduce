import { describe, expect, it } from 'vitest';
import { validatePaperclipsScene } from '../../src/core/scene-validator.js';
import type { RawPaperclipsScene } from '../../src/shared/types.js';

const baseScene = (overrides: Partial<RawPaperclipsScene> = {}): RawPaperclipsScene => ({
  captureId: 3,
  capturedAt: new Date('2026-04-23T12:00:00.000Z').toISOString(),
  isPaperclips: true,
  confidence: 0.88,
  fields: {
    clips: { value: 127, raw: '127 clips', confidence: 0.96, visible: true },
    funds: { value: 12.44, raw: '$12.44', unit: 'usd', confidence: 0.95, visible: true },
    unsoldInventory: { value: 34, raw: 'Unsold Inventory: 34', confidence: 0.94, visible: true },
    pricePerClip: { value: 0.25, raw: '$0.25 per clip', unit: 'usd', confidence: 0.92, visible: true },
    publicDemand: { value: 12, raw: 'Public Demand: 12%', unit: 'percent', confidence: 0.91, visible: true },
    wire: { value: 790, raw: 'Wire: 790 inches', unit: 'inches', confidence: 0.93, visible: true },
    wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.82, visible: true },
    clipsPerSecond: { value: 1, raw: '1 clip/sec', confidence: 0.81, visible: true },
    marketingLevel: { value: 1, raw: 'Marketing: 1', confidence: 0.79, visible: true },
    autoClipperCost: { value: 5, raw: 'AutoClippers cost $5', unit: 'usd', confidence: 0.84, visible: true }
  },
  unknowns: [],
  notes: ['early economy screen'],
  ...overrides
});

describe('validatePaperclipsScene', () => {
  it('accepts a fresh high-confidence Paperclips scene and normalizes its quality', () => {
    const result = validatePaperclipsScene(baseScene(), {
      now: new Date('2026-04-23T12:00:04.000Z')
    });

    expect(result.ok).toBe(true);
    expect(result.scene?.quality).toBe('high');
    expect(result.scene?.fields.publicDemand.value).toBe(12);
  });

  it('rejects stale scenes before they can ground advice', () => {
    const result = validatePaperclipsScene(baseScene(), {
      now: new Date('2026-04-23T12:00:15.500Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('scene_stale');
  });

  it('marks missing trigger-critical fields as insufficient evidence', () => {
    const scene = baseScene({
      fields: {
        ...baseScene().fields,
        publicDemand: { value: null, raw: 'blurred', confidence: 0.2, visible: false }
      }
    });

    const result = validatePaperclipsScene(scene, {
      now: new Date('2026-04-23T12:00:02.000Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('field_publicDemand_unusable');
  });
});
