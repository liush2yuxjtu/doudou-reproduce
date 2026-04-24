import { describe, expect, it } from 'vitest';
import { runEvals } from '../../scripts/run-evals.js';

describe('runEvals staleness handling', () => {
  it('records the stale-scene fixture as PASS via the validation_fail branch', () => {
    const results = runEvals();
    const stale = results.find((r) => r.name.startsWith('stale scene'));

    expect(stale, 'expected stale-scene fixture in eval results').toBeDefined();
    expect(stale?.status).toBe('pass');
    expect(stale?.detail).toMatch(/scene_stale/);
  });

  it('does not silently overwrite fixture-supplied capturedAt', () => {
    const results = runEvals();
    const stale = results.find((r) => r.name.startsWith('stale scene'));

    expect(stale?.detail).not.toMatch(/got watch|got lower_price|got buy_/);
    expect(stale?.detail).toMatch(/validation_fail/);
  });
});
