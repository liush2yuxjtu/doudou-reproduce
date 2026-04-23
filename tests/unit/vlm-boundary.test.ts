import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [
  'document.querySelector',
  'page.evaluate',
  'playwright',
  'puppeteer',
  'chrome.debugger',
  'localStorage',
  'indexedDB'
];

const collectTsFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return collectTsFiles(full);
    return full.endsWith('.ts') ? [full] : [];
  });
};

describe('VLM-only runtime boundary', () => {
  it('keeps runtime source free of DOM/game-state scraping APIs', () => {
    const files = collectTsFiles('src').filter((file) => !file.includes('/renderer/'));
    const offenders = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return forbidden
        .filter((needle) => text.includes(needle))
        .map((needle) => `${file}: ${needle}`);
    });

    expect(offenders).toEqual([]);
  });
});
