import type { AdviceApprovalResult, AdviceResponse, FieldPath, PaperclipsScene } from '../shared/types.js';
import { DEFAULT_MAX_SCENE_AGE_MS, getSceneField, isUsableField } from './scene-validator.js';

export interface AdviceApprovalOptions {
  now?: Date;
  maxAdviceAgeMs?: number;
}

const DEFAULT_MAX_ADVICE_AGE_MS = 10_000;

export function approveAdvice(
  advice: AdviceResponse,
  scene: PaperclipsScene,
  options: AdviceApprovalOptions = {}
): AdviceApprovalResult {
  const now = options.now ?? new Date();
  const maxAdviceAgeMs = options.maxAdviceAgeMs ?? DEFAULT_MAX_ADVICE_AGE_MS;
  const issues: string[] = [];

  if (advice.sceneId !== scene.id) {
    issues.push('scene_mismatch');
  }

  const adviceAgeMs = now.getTime() - Date.parse(advice.createdAt);
  if (!Number.isFinite(adviceAgeMs) || adviceAgeMs > maxAdviceAgeMs) {
    issues.push('advice_stale');
  }

  const sceneAgeMs = now.getTime() - Date.parse(scene.capturedAt);
  if (!Number.isFinite(sceneAgeMs) || sceneAgeMs > DEFAULT_MAX_SCENE_AGE_MS) {
    issues.push('advice_stale');
  }

  for (const fieldPath of advice.usedFields) {
    if (!fieldSupportedByScene(fieldPath, scene)) {
      issues.push(`unsupported_field_${fieldPath}`);
    }
  }

  for (const evidence of advice.evidence) {
    if (!advice.usedFields.includes(evidence.field) || !fieldSupportedByScene(evidence.field, scene)) {
      issues.push(`unsupported_evidence_${evidence.field}`);
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, advice, issues: [] };
}

function fieldSupportedByScene(path: FieldPath, scene: PaperclipsScene): boolean {
  return isUsableField(getSceneField(scene, path));
}
