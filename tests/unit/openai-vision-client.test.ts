import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCodexVisionExecArgs,
  isUsefulPaperclipsSceneReading,
  readCodexCliLastMessage
} from '../../src/main/openai-vision-client.js';
import type { RawPaperclipsScene } from '../../src/shared/types.js';

describe('readCodexCliLastMessage', () => {
  it('falls back to Codex stdout when the last-message file is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'paperclips-codex-test-'));
    try {
      const output = await readCodexCliLastMessage(join(dir, 'missing-scene.json'), {
        stdout: Buffer.from('codex\n{"isPaperclips":true,"fields":{}}\nhook: Stop\n'),
        stderr: ''
      });

      expect(output).toContain('"isPaperclips":true');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prefers the last-message file when Codex writes one', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'paperclips-codex-test-'));
    const outputPath = join(dir, 'scene.json');
    try {
      await writeFile(outputPath, '{"isPaperclips":true,"fields":{"clips":{"value":1}}}');
      const output = await readCodexCliLastMessage(outputPath, {
        stdout: '{"isPaperclips":false,"fields":{}}',
        stderr: ''
      });

      expect(output).toContain('"clips"');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('buildCodexVisionExecArgs', () => {
  it('runs Codex vision in a clean non-repo worker context', () => {
    const args = buildCodexVisionExecArgs({
      model: 'gpt-5.4-mini',
      imagePath: '/tmp/capture.png',
      outputPath: '/tmp/scene.json',
      workDir: '/tmp/paperclips-worker',
      reasoningEffort: 'medium'
    });

    expect(args).toContain('model_reasoning_effort="medium"');
    expect(args).toContain('codex_hooks=false');
    expect(args).toContain('persistent_instructions=""');
    expect(args).toContain('tools.disabled_tools=["shell","apply_patch"]');
    expect(args).toContain('--skip-git-repo-check');
    expect(args).toContain('/tmp/paperclips-worker');
  });
});

describe('isUsefulPaperclipsSceneReading', () => {
  it('rejects all-null Codex readings so a vision-capable fallback can retry', () => {
    const scene = makeScene({
      clips: { value: null, raw: 'unreadable', confidence: 0, visible: false }
    });

    expect(isUsefulPaperclipsSceneReading(scene)).toBe(false);
  });

  it('accepts a visible high-confidence numeric reading', () => {
    const scene = makeScene({
      clips: { value: 42, raw: '42', confidence: 0.9, visible: true }
    });

    expect(isUsefulPaperclipsSceneReading(scene)).toBe(true);
  });
});

function makeScene(fields: Partial<RawPaperclipsScene['fields']>): RawPaperclipsScene {
  return {
    captureId: 1,
    capturedAt: '2026-04-23T12:00:00.000Z',
    isPaperclips: true,
    confidence: 0.9,
    fields: {
      clips: { value: null, raw: '', confidence: 0, visible: false },
      funds: { value: null, raw: '', confidence: 0, visible: false },
      unsoldInventory: { value: null, raw: '', confidence: 0, visible: false },
      pricePerClip: { value: null, raw: '', confidence: 0, visible: false },
      publicDemand: { value: null, raw: '', confidence: 0, visible: false },
      wire: { value: null, raw: '', confidence: 0, visible: false },
      wireCost: { value: null, raw: '', confidence: 0, visible: false },
      clipsPerSecond: { value: null, raw: '', confidence: 0, visible: false },
      marketingLevel: { value: null, raw: '', confidence: 0, visible: false },
      autoClipperCost: { value: null, raw: '', confidence: 0, visible: false },
      ...fields
    },
    unknowns: [],
    notes: []
  };
}
