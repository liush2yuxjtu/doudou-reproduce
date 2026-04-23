import type {
  AdviceEvidence,
  AdviceResponse,
  FieldPath,
  PaperclipsFieldName,
  PaperclipsScene,
  PolicyAction
} from '../shared/types.js';
import { getSceneField } from './scene-validator.js';

export interface BuildAdviceInput {
  scene: PaperclipsScene;
  action: PolicyAction;
  question?: string;
  now?: Date;
}

const LABELS: Record<PaperclipsFieldName, string> = {
  clips: 'Clips',
  funds: 'Funds',
  unsoldInventory: 'Unsold inventory',
  pricePerClip: 'Price',
  publicDemand: 'Demand',
  wire: 'Wire',
  wireCost: 'Wire cost',
  clipsPerSecond: 'Clips/sec',
  marketingLevel: 'Marketing',
  autoClipperCost: 'AutoClipper cost'
};

export function buildDeterministicAdvice(input: BuildAdviceInput): AdviceResponse {
  const now = input.now ?? new Date();
  const evidence = input.action.requiredEvidence
    .map((field) => evidenceFor(input.scene, field))
    .filter((item): item is AdviceEvidence => Boolean(item));

  const questionPrefix = input.question ? answerOpening(input.question) : '';

  return {
    id: `advice_${input.scene.captureId}_${now.getTime()}`,
    sceneId: input.scene.id,
    createdAt: now.toISOString(),
    actionId: input.action.id,
    title: input.action.title,
    body: `${questionPrefix}${input.action.body}${evidence.length > 0 ? ` Evidence I can see: ${evidence.map((item) => `${item.label} ${item.value}`).join(', ')}.` : ''}`,
    evidence,
    usedFields: input.action.requiredEvidence,
    confidence: input.scene.quality === 'high' ? 0.9 : 0.65,
    ttsAllowed: input.action.speakable && input.scene.quality === 'high'
  };
}

function answerOpening(question: string): string {
  if (question.trim().length === 0) return '';
  return 'For your current screen: ';
}

function evidenceFor(scene: PaperclipsScene, path: FieldPath): AdviceEvidence | null {
  const fieldName = path.slice('fields.'.length) as PaperclipsFieldName;
  const field = getSceneField(scene, path);

  if (!field || field.value === null || !field.visible) {
    return null;
  }

  return {
    field: path,
    label: LABELS[fieldName],
    value: formatFieldValue(fieldName, field.value, field.unit)
  };
}

export function formatFieldValue(field: PaperclipsFieldName, value: number, unit?: string): string {
  if (field === 'funds' || field === 'pricePerClip' || field === 'wireCost' || field === 'autoClipperCost') {
    return `$${value.toFixed(2)}`;
  }

  if (field === 'publicDemand') {
    return `${value}%`;
  }

  if (field === 'wire') {
    return `${value}${unit ? ` ${unit}` : ''}`;
  }

  return String(value);
}
