import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCodexCliLastMessage } from '../../src/main/openai-vision-client.js';

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
