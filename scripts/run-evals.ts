import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDeterministicAdvice } from '../src/core/advisor.js';
import { approveAdvice } from '../src/core/evidence-validator.js';
import { choosePaperclipsAction } from '../src/core/policy-engine.js';
import { validatePaperclipsScene } from '../src/core/scene-validator.js';
import type { EvalCaseRawScene, RawPaperclipsScene } from '../src/shared/types.js';

interface EvalCase {
  name: string;
  expectedAction: string;
  rawScene: EvalCaseRawScene;
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

const defaultEvalDir = fileURLToPath(new URL('../evals/paperclips/cases', import.meta.url));

function assertFixtureShape(file: string, raw: unknown): asserts raw is EvalCaseRawScene {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`fixture ${file} rawScene 不是 object`);
  }
  const scene = raw as Record<string, unknown>;
  if (typeof scene.isPaperclips !== 'boolean') {
    throw new Error(`fixture ${file} 缺 isPaperclips`);
  }
  if (typeof scene.confidence !== 'number') {
    throw new Error(`fixture ${file} 缺 confidence`);
  }
  if (!Array.isArray(scene.unknowns)) {
    throw new Error(`fixture ${file} 缺 unknowns`);
  }
  if (!Array.isArray(scene.notes)) {
    throw new Error(`fixture ${file} 缺 notes`);
  }
  if (!scene.fields || typeof scene.fields !== 'object') {
    throw new Error(`fixture ${file} 缺 fields`);
  }
}

export function runEvals(options: RunEvalsOptions = {}): EvalRunResult[] {
  const evalDir = options.evalDir ?? defaultEvalDir;
  const now = options.now ?? new Date();
  const files = readdirSync(evalDir).filter((file) => file.endsWith('.json')).sort();
  const results: EvalRunResult[] = [];

  for (const [index, file] of files.entries()) {
    const parsed = JSON.parse(readFileSync(join(evalDir, file), 'utf8')) as {
      name: string;
      expectedAction: string;
      rawScene: unknown;
    };
    assertFixtureShape(file, parsed.rawScene);
    const fixture: EvalCase = {
      name: parsed.name,
      expectedAction: parsed.expectedAction,
      rawScene: parsed.rawScene
    };
    const rawScene: RawPaperclipsScene = {
      ...fixture.rawScene,
      captureId: fixture.rawScene.captureId ?? index + 1,
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
