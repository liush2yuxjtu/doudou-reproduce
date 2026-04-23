import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const evalDir = 'evals/paperclips/cases';
const files = readdirSync(evalDir).filter((file) => file.endsWith('.json')).sort();
const now = new Date();
let failures = 0;

for (const [index, file] of files.entries()) {
  const fixture = JSON.parse(readFileSync(join(evalDir, file), 'utf8')) as EvalCase;
  const rawScene: RawPaperclipsScene = {
    ...fixture.rawScene,
    captureId: index + 1,
    capturedAt: now.toISOString()
  };
  const validated = validatePaperclipsScene(rawScene, { now });

  if (!validated.scene || !validated.ok) {
    failures += 1;
    console.error(`FAIL ${fixture.name}: validation ${validated.issues.join(', ')}`);
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
    failures += 1;
    console.error(`FAIL ${fixture.name}: expected ${fixture.expectedAction}, got ${action.id}`);
    continue;
  }

  if (!approved.ok) {
    failures += 1;
    console.error(`FAIL ${fixture.name}: advice blocked ${approved.issues.join(', ')}`);
    continue;
  }

  console.log(`PASS ${fixture.name}: ${action.id}`);
}

if (failures > 0) {
  process.exitCode = 1;
}
