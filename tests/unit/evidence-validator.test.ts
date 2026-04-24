import { describe, expect, it } from 'vitest';
import { approveAdvice } from '../../src/core/evidence-validator.js';
import { buildDeterministicAdvice } from '../../src/core/advisor.js';
import { choosePaperclipsAction } from '../../src/core/policy-engine.js';
import { validatePaperclipsScene } from '../../src/core/scene-validator.js';
import type { AdviceResponse, RawPaperclipsScene } from '../../src/shared/types.js';

const validatedScene = () => {
  const raw: RawPaperclipsScene = {
    captureId: 22,
    capturedAt: new Date('2026-04-23T12:00:00.000Z').toISOString(),
    isPaperclips: true,
    confidence: 0.91,
    fields: {
      clips: { value: 180, raw: '180', confidence: 0.95, visible: true },
      funds: { value: 7.21, raw: '$7.21', unit: 'usd', confidence: 0.95, visible: true },
      unsoldInventory: { value: 51, raw: '51', confidence: 0.95, visible: true },
      pricePerClip: { value: 0.27, raw: '$0.27', unit: 'usd', confidence: 0.95, visible: true },
      publicDemand: { value: 9, raw: '9%', unit: 'percent', confidence: 0.95, visible: true },
      wire: { value: 810, raw: '810 inches', unit: 'inches', confidence: 0.95, visible: true },
      wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.9, visible: true },
      clipsPerSecond: { value: 2, raw: '2/sec', confidence: 0.9, visible: true },
      marketingLevel: { value: 1, raw: '1', confidence: 0.9, visible: true },
      autoClipperCost: { value: 10, raw: '$10', unit: 'usd', confidence: 0.9, visible: true }
    },
    unknowns: [],
    notes: []
  };

  const result = validatePaperclipsScene(raw, {
    now: new Date('2026-04-23T12:00:02.000Z')
  });
  if (!result.scene) throw new Error(result.issues.join(','));
  return result.scene;
};

describe('approveAdvice', () => {
  it('approves deterministic advice when every cited field is visible in the current scene', () => {
    const scene = validatedScene();
    const advice = buildDeterministicAdvice({
      scene,
      action: choosePaperclipsAction(scene),
      question: 'What should I do now?'
    });

    const result = approveAdvice(advice, scene, {
      now: new Date('2026-04-23T12:00:03.000Z')
    });

    expect(result.ok).toBe(true);
    expect(result.advice?.ttsAllowed).toBe(true);
  });

  it('blocks advice that cites unsupported fields', () => {
    const scene = validatedScene();
    const bad: AdviceResponse = {
      id: 'advice_1',
      sceneId: scene.id,
      createdAt: new Date('2026-04-23T12:00:03.000Z').toISOString(),
      actionId: 'lower_price',
      title: 'Buy more drones',
      body: 'You should buy drones because your drone count is low.',
      evidence: [{ field: 'fields.droneCount', label: 'Drones', value: '0' }],
      usedFields: ['fields.droneCount'],
      confidence: 0.9,
      ttsAllowed: true
    };

    const result = approveAdvice(bad, scene, {
      now: new Date('2026-04-23T12:00:04.000Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('unsupported_field_fields.droneCount');
  });

  it('都不超限 → issues 无 stale token', () => {
    const scene = validatedScene();
    const advice = buildDeterministicAdvice({
      scene,
      action: choosePaperclipsAction(scene),
      question: 'What should I do now?'
    });

    // advice.createdAt ≈ now=2026-04-23T12:00:05Z → advice age=0s<10s，scene age=5s<30s
    const result = approveAdvice(advice, scene, {
      now: new Date('2026-04-23T12:00:05.000Z')
    });

    expect(result.ok).toBe(true);
    expect(result.issues).not.toContain('advice_stale');
    expect(result.issues).not.toContain('approval_scene_stale');
  });

  it('advice + scene 都超限 → issues 同时含 advice_stale 和 approval_scene_stale', () => {
    const scene = validatedScene();
    // scene.capturedAt=2026-04-23T12:00:00Z，now=12:01:22Z → scene age=82s>30s
    // advice.createdAt=2026-04-23T12:00:00Z，now=12:01:22Z → advice age=82s>10s
    const advice: AdviceResponse = {
      id: 'advice_both_stale',
      sceneId: scene.id,
      createdAt: new Date('2026-04-23T12:00:00.000Z').toISOString(),
      actionId: 'lower_price',
      title: 'Lower the price',
      body: 'Demand is low; lowering price moves inventory.',
      evidence: [{ field: 'fields.publicDemand', label: 'Demand', value: '9%' }],
      usedFields: ['fields.publicDemand'],
      confidence: 0.9,
      ttsAllowed: true
    };

    const result = approveAdvice(advice, scene, {
      now: new Date('2026-04-23T12:01:22.000Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('advice_stale');
    expect(result.issues).toContain('approval_scene_stale');
  });

  it('仅 advice 超限 → issues 只含 advice_stale，不含 approval_scene_stale', () => {
    const scene = validatedScene();
    // scene.capturedAt=2026-04-23T12:00:00Z，now=12:00:15Z → scene age=15s<30s（新鲜）
    // advice.createdAt=2026-04-23T12:00:00Z，now=12:00:15Z → advice age=15s>10s（过期）
    const advice: AdviceResponse = {
      id: 'advice_r1',
      sceneId: scene.id,
      createdAt: new Date('2026-04-23T12:00:00.000Z').toISOString(),
      actionId: 'lower_price',
      title: 'Lower the price',
      body: 'Demand is low; lowering price moves inventory.',
      evidence: [{ field: 'fields.publicDemand', label: 'Demand', value: '9%' }],
      usedFields: ['fields.publicDemand'],
      confidence: 0.9,
      ttsAllowed: true
    };

    const result = approveAdvice(advice, scene, {
      now: new Date('2026-04-23T12:00:15.000Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('advice_stale');
    expect(result.issues).not.toContain('approval_scene_stale');
  });

  it('仅 scene 超限 → issues 只含 approval_scene_stale，不含 advice_stale', () => {
    const scene = validatedScene();
    // scene.capturedAt=2026-04-23T12:00:00Z，now=12:01:05Z → scene age=65s>30s（过期）
    // advice.createdAt=2026-04-23T12:01:00Z，now=12:01:05Z → advice age=5s<10s（新鲜）
    const advice: AdviceResponse = {
      id: 'advice_scene_stale',
      sceneId: scene.id,
      createdAt: new Date('2026-04-23T12:01:00.000Z').toISOString(),
      actionId: 'lower_price',
      title: 'Lower the price',
      body: 'Demand is low; lowering price moves inventory.',
      evidence: [{ field: 'fields.publicDemand', label: 'Demand', value: '9%' }],
      usedFields: ['fields.publicDemand'],
      confidence: 0.9,
      ttsAllowed: true
    };

    const result = approveAdvice(advice, scene, {
      now: new Date('2026-04-23T12:01:05.000Z')
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('approval_scene_stale');
    expect(result.issues).not.toContain('advice_stale');
  });
});
