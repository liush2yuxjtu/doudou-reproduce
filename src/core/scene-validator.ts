import type {
  FieldPath,
  PaperclipsFieldName,
  PaperclipsScene,
  RawPaperclipsScene,
  SceneField,
  SceneQuality,
  SceneValidationResult
} from '../shared/types.js';

const MIN_SCENE_CONFIDENCE = 0.55;
const MIN_FIELD_CONFIDENCE = 0.5;
export const DEFAULT_MAX_SCENE_AGE_MS = 60_000;

const CRITICAL_FIELDS: PaperclipsFieldName[] = [
  'clips',
  'funds',
  'unsoldInventory',
  'pricePerClip',
  'publicDemand',
  'wire'
];

export interface SceneValidationOptions {
  now?: Date;
  maxAgeMs?: number;
}

export const fieldPath = (name: PaperclipsFieldName): FieldPath => `fields.${name}`;

export const isUsableField = (field: SceneField | undefined): field is SceneField<number> => {
  return Boolean(
    field &&
      field.visible &&
      field.value !== null &&
      Number.isFinite(field.value) &&
      field.confidence >= MIN_FIELD_CONFIDENCE
  );
};

export const getSceneField = (scene: PaperclipsScene, path: FieldPath): SceneField<number> | undefined => {
  const name = path.slice('fields.'.length) as PaperclipsFieldName;
  return scene.fields[name];
};

export function validatePaperclipsScene(
  raw: RawPaperclipsScene,
  options: SceneValidationOptions = {}
): SceneValidationResult {
  const now = options.now ?? new Date();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_SCENE_AGE_MS;
  const issues: string[] = [];
  const capturedAtMs = Date.parse(raw.capturedAt);

  if (!Number.isFinite(capturedAtMs)) {
    issues.push('captured_at_invalid');
  }

  const ageMs = Number.isFinite(capturedAtMs) ? now.getTime() - capturedAtMs : Number.POSITIVE_INFINITY;

  if (ageMs > maxAgeMs) {
    issues.push('scene_stale');
  }

  if (ageMs < -1_000) {
    issues.push('scene_from_future');
  }

  if (!raw.isPaperclips) {
    issues.push('not_paperclips');
  }

  if (raw.confidence < MIN_SCENE_CONFIDENCE) {
    issues.push('scene_low_confidence');
  }

  for (const name of CRITICAL_FIELDS) {
    if (!isUsableField(raw.fields[name])) {
      issues.push(`field_${name}_unusable`);
    }
  }

  const quality = qualityFor(raw, issues);
  const scene: PaperclipsScene = {
    ...raw,
    unknowns: Array.isArray(raw.unknowns) ? raw.unknowns : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    id: `scene_${raw.captureId}_${Number.isFinite(capturedAtMs) ? capturedAtMs : Date.now()}`,
    quality,
    ageMs
  };

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, scene, issues };
}

function qualityFor(raw: RawPaperclipsScene, issues: string[]): SceneQuality {
  if (issues.includes('scene_low_confidence') || issues.some((issue) => issue.endsWith('_unusable'))) {
    return 'low';
  }

  if (raw.confidence >= 0.8 && raw.unknowns.length === 0) {
    return 'high';
  }

  return 'partial';
}
