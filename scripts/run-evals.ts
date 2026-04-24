import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDeterministicAdvice } from '../src/core/advisor.js';
import { approveAdvice } from '../src/core/evidence-validator.js';
import { choosePaperclipsAction } from '../src/core/policy-engine.js';
import { validatePaperclipsScene } from '../src/core/scene-validator.js';
import type { RawPaperclipsScene } from '../src/shared/types.js';

interface EvalCase {
  name: string;
  expectedAction: string;
  rawScene: RawPaperclipsScene;
}

export interface EvalRunResult {
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}

export interface RunEvalsOptions {
  evalDir?: string;
  now?: Date;
}

export function runEvals(options: RunEvalsOptions = {}): EvalRunResult[] {
  const evalDir = options.evalDir ?? 'evals/paperclips/cases';
  const now = options.now ?? new Date();
  const files = readdirSync(evalDir).filter((file) => file.endsWith('.json')).sort();
  const results: EvalRunResult[] = [];

  for (const [index, file] of files.entries()) {
    const fixture = JSON.parse(readFileSync(join(evalDir, file), 'utf8')) as EvalCase;
    const rawScene: RawPaperclipsScene = {
      ...fixture.rawScene,
      captureId: index + 1,
      capturedAt: fixture.rawScene.capturedAt ?? now.toISOString()
    };
    const validated = validatePaperclipsScene(rawScene, { now });

    if (!validated.ok || !validated.scene) {
      if (fixture.expectedAction === 'validation_fail') {
        results.push({
          name: fixture.name,
          status: 'pass',
          detail: `validation_fail: ${validated.issues.join(', ')}`
        });
      } else {
        results.push({
          name: fixture.name,
          status: 'fail',
          detail: `validation ${validated.issues.join(', ')}`
        });
      }
      continue;
    }

    if (fixture.expectedAction === 'validation_fail') {
      results.push({
        name: fixture.name,
        status: 'fail',
        detail: 'expected validation_fail but scene validated ok'
      });
      continue;
    }

    const action = choosePaperclipsAction(validated.scene);
    const advice = buildDeterministicAdvice({
      scene: validated.scene,
      action,
      question: 'What should I do now?',
      now
    });
    const approved = approveAdvice(advice, validated.scene, { now });

    if (action.id !== fixture.expectedAction) {
      results.push({
        name: fixture.name,
        status: 'fail',
        detail: `expected ${fixture.expectedAction}, got ${action.id}`
      });
      continue;
    }

    if (!approved.ok) {
      results.push({
        name: fixture.name,
        status: 'fail',
        detail: `advice blocked ${approved.issues.join(', ')}`
      });
      continue;
    }

    results.push({ name: fixture.name, status: 'pass', detail: action.id });
  }

  return results;
}

const isMain = (() => {
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();

if (isMain) {
  const results = runEvals();
  let failures = 0;
  for (const result of results) {
    if (result.status === 'pass') {
      console.log(`PASS ${result.name}: ${result.detail}`);
    } else {
      failures += 1;
      console.error(`FAIL ${result.name}: ${result.detail}`);
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  }
}
