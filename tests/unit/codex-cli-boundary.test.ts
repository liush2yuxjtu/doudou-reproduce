import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import * as childProcess from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readCodexCliLastMessage } from '../../src/main/openai-vision-client.js';

// regression: fix(qa): close codex worker stdin (commit 55b5d5c)
// Before that fix, execFile was used — stdin was NOT explicitly closed → Codex CLI could block
// waiting for stdin input. After fix: spawn + stdio:['ignore','pipe','pipe'] closes stdin immediately.

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
vi.mock('../../src/main/codex-auth.js', () => ({
  resolveOpenAiCredentials: () => ({ hasCodexLogin: true, apiKey: undefined, source: 'codex_cli' })
}));
vi.mock('node:fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs/promises')>();
  return { ...real, symlink: vi.fn().mockResolvedValue(undefined) };
});

function buildFakeChild(exitCode: number | null, stderrMsg: string) {
  const makeStream = () => Object.assign(new EventEmitter(), { setEncoding: vi.fn() });

  const child = Object.assign(new EventEmitter(), {
    stdout: makeStream(),
    stderr: makeStream(),
    kill: vi.fn(),
    stdin: null
  });

  setImmediate(() => {
    if (stderrMsg) child.stderr.emit('data', stderrMsg);
    child.emit('close', exitCode, null);
  });

  return child;
}

const spawnMock = vi.mocked(childProcess.spawn);

describe('execCodexCli subprocess boundary — regression: fix(qa) close codex worker stdin', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('non-zero exit code (e.g. auth failure) → extractScene rejects with CodexCliFailed, does not hang', async () => {
    // Both primary and fallback model calls will fail
    spawnMock.mockImplementation(
      () => buildFakeChild(1, 'auth error: token expired') as ReturnType<typeof spawnMock>
    );

    const { OpenAiVisionClient } = await import('../../src/main/openai-vision-client.js');
    const client = new OpenAiVisionClient();
    const frame = {
      captureId: 42,
      capturedAt: '2026-04-24T00:00:00.000Z',
      dataUrl: 'data:image/png;base64,AA==',
      base64: 'AA=='
    };

    await expect(client.extractScene(frame)).rejects.toThrow(/CodexCliFailed/);
  }, 10_000);

  it('spawn is called with stdio:[ignore,pipe,pipe] — guards against stdin-hang regression', async () => {
    spawnMock.mockImplementation(
      () => buildFakeChild(0, '') as ReturnType<typeof spawnMock>
    );

    const { OpenAiVisionClient } = await import('../../src/main/openai-vision-client.js');
    const client = new OpenAiVisionClient();
    const frame = {
      captureId: 7,
      capturedAt: '2026-04-24T00:00:00.000Z',
      dataUrl: 'data:image/png;base64,AA==',
      base64: 'AA=='
    };

    // Call will fail at JSON parse stage; we only verify spawn stdio options
    await client.extractScene(frame).catch(() => {});

    expect(spawnMock).toHaveBeenCalled();
    const opts = spawnMock.mock.calls[0]?.[2] as { stdio?: unknown };
    expect(opts?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
  }, 10_000);
});

describe('readCodexCliLastMessage truncated output boundary', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'r5-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('empty output file + empty stdout/stderr → throws CodexCliEmptyOutput, not a crash', async () => {
    const outputPath = join(dir, 'empty.json');
    await writeFile(outputPath, '   ');

    await expect(
      readCodexCliLastMessage(outputPath, { stdout: '', stderr: '' })
    ).rejects.toThrow(/CodexCliEmptyOutput/);
  });

  it('missing output file + truncated stdout (no trailing newline) → returns raw truncated string without crash', async () => {
    const outputPath = join(dir, 'nonexistent.json');
    const truncated = '{"isPaperclips":true,"fields":{"clips":{"value":42';

    const result = await readCodexCliLastMessage(outputPath, { stdout: truncated, stderr: '' });

    expect(result).toBe(truncated);
  });
});
