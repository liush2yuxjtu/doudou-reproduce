import { describe, expect, it } from 'vitest';
import { choosePaperclipsAction } from '../../src/core/policy-engine.js';
import { validatePaperclipsScene } from '../../src/core/scene-validator.js';
import type { RawPaperclipsScene } from '../../src/shared/types.js';

const scene = (fields: Partial<RawPaperclipsScene['fields']>) => {
  const raw: RawPaperclipsScene = {
    captureId: 10,
    capturedAt: new Date('2026-04-23T12:00:00.000Z').toISOString(),
    isPaperclips: true,
    confidence: 0.9,
    fields: {
      clips: { value: 100, raw: '100', confidence: 0.95, visible: true },
      funds: { value: 20, raw: '$20', unit: 'usd', confidence: 0.95, visible: true },
      unsoldInventory: { value: 0, raw: '0', confidence: 0.95, visible: true },
      pricePerClip: { value: 0.25, raw: '$0.25', unit: 'usd', confidence: 0.95, visible: true },
      publicDemand: { value: 50, raw: '50%', unit: 'percent', confidence: 0.95, visible: true },
      wire: { value: 400, raw: '400 inches', unit: 'inches', confidence: 0.95, visible: true },
      wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.95, visible: true },
      clipsPerSecond: { value: 1, raw: '1/sec', confidence: 0.95, visible: true },
      marketingLevel: { value: 1, raw: '1', confidence: 0.9, visible: true },
      autoClipperCost: { value: 5, raw: '$5', unit: 'usd', confidence: 0.9, visible: true },
      ...fields
    },
    unknowns: [],
    notes: []
  };

  const validated = validatePaperclipsScene(raw, {
    now: new Date('2026-04-23T12:00:01.000Z')
  });

  if (!validated.scene) throw new Error(validated.issues.join(','));
  return validated.scene;
};

describe('choosePaperclipsAction', () => {
  it('prioritizes lowering price when inventory piles up and demand is weak', () => {
    const action = choosePaperclipsAction(scene({
      unsoldInventory: { value: 42, raw: '42', confidence: 0.95, visible: true },
      publicDemand: { value: 12, raw: '12%', unit: 'percent', confidence: 0.95, visible: true }
    }));

    expect(action.id).toBe('lower_price');
    expect(action.requiredEvidence).toEqual(expect.arrayContaining([
      'fields.unsoldInventory',
      'fields.publicDemand',
      'fields.pricePerClip'
    ]));
  });

  it('recommends buying wire before production stalls', () => {
    const action = choosePaperclipsAction(scene({
      funds: { value: 30, raw: '$30', unit: 'usd', confidence: 0.95, visible: true },
      wire: { value: 25, raw: '25 inches', unit: 'inches', confidence: 0.95, visible: true },
      wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.95, visible: true }
    }));

    expect(action.id).toBe('buy_wire');
    expect(action.requiredEvidence).toContain('fields.wire');
  });

  it('falls back to watching when no safe action is visible', () => {
    const action = choosePaperclipsAction(scene({}));

    expect(action.id).toBe('watch');
    expect(action.speakable).toBe(false);
  });
});
