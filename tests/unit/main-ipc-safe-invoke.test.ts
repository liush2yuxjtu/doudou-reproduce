import { describe, expect, it } from 'vitest';
import { safeInvoke } from '../../src/main/ipc-envelope.js';

describe('safeInvoke duplicate 透传', () => {
  it('case A: fn 抛出带 duplicate=true 的 Error → ok:false + duplicate:true', async () => {
    const err = Object.assign(new Error('StaleCaptureIgnored'), { duplicate: true });
    const result = await safeInvoke(() => Promise.reject(err));
    expect(result).toEqual({ ok: false, error: 'StaleCaptureIgnored', duplicate: true });
  });

  it('case B: fn 抛出普通 Error → ok:false 且无 duplicate 字段', async () => {
    const err = new Error('普通错误');
    const result = await safeInvoke(() => Promise.reject(err));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('普通错误');
      expect(result.duplicate).toBeUndefined();
    }
  });

  it('case C: fn 成功返回 → ok:true + data 原样透传', async () => {
    const data = { scene: { id: 'abc' }, duplicate: false };
    const result = await safeInvoke(() => Promise.resolve(data));
    expect(result).toEqual({ ok: true, data });
  });
});
