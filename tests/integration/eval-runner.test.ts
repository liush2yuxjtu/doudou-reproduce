import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('runEvals fixture schema & evalDir decoupling', () => {
  const validFields = {
    clips: { value: 1, raw: '1', confidence: 0.9, visible: true },
    funds: { value: 1, raw: '$1', unit: 'usd', confidence: 0.9, visible: true },
    unsoldInventory: { value: 0, raw: '0', confidence: 0.9, visible: true },
    pricePerClip: { value: 0.25, raw: '$0.25', unit: 'usd', confidence: 0.9, visible: true },
    publicDemand: { value: 50, raw: '50%', unit: 'percent', confidence: 0.9, visible: true },
    wire: { value: 1000, raw: '1000 inches', unit: 'inches', confidence: 0.9, visible: true },
    wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.9, visible: true },
    clipsPerSecond: { value: 1, raw: '1/sec', confidence: 0.9, visible: true },
    marketingLevel: { value: 1, raw: 'Marketing: 1', confidence: 0.9, visible: true },
    autoClipperCost: { value: 10, raw: '$10', unit: 'usd', confidence: 0.9, visible: true }
  };

  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('runs from a non-root cwd because evalDir is derived from import.meta.url', () => {
    process.chdir(tmpdir());
    const results = runEvals();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => typeof r.name === 'string')).toBe(true);
  });

  it('fills in defaults when fixture is missing captureId / capturedAt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r8-fixture-'));
    try {
      writeFileSync(
        join(dir, 'watch.json'),
        JSON.stringify({
          name: 'missing capturedAt sanity case',
          expectedAction: 'watch',
          rawScene: {
            isPaperclips: true,
            confidence: 0.95,
            fields: validFields,
            unknowns: [],
            notes: []
          }
        })
      );
      const results = runEvals({ evalDir: dir, now: new Date('2026-04-24T00:00:00.000Z') });
      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe('pass');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws a readable error when fixture is missing isPaperclips', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r8-broken-'));
    try {
      writeFileSync(
        join(dir, 'broken.json'),
        JSON.stringify({
          name: 'broken schema',
          expectedAction: 'watch',
          rawScene: {
            confidence: 0.9,
            fields: validFields,
            unknowns: [],
            notes: []
          }
        })
      );
      expect(() => runEvals({ evalDir: dir })).toThrow(/broken\.json.*isPaperclips/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
