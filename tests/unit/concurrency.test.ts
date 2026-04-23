import { describe, expect, it } from 'vitest';
import { FreshResultGate } from '../../src/core/fresh-result-gate.js';

describe('FreshResultGate', () => {
  it('accepts the latest capture result and rejects late older results', () => {
    const gate = new FreshResultGate();
    const first = gate.beginCapture();
    const second = gate.beginCapture();

    expect(gate.canCommitCapture(first)).toBe(false);
    expect(gate.canCommitCapture(second)).toBe(true);
  });

  it('accepts advice only for the current scene', () => {
    const gate = new FreshResultGate();
    const capture = gate.beginCapture();
    gate.commitScene(capture, 'scene_current');

    expect(gate.canCommitAdvice('scene_old')).toBe(false);
    expect(gate.canCommitAdvice('scene_current')).toBe(true);
  });
});
