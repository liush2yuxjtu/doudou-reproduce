export type PaperclipsFieldName =
  | 'clips'
  | 'funds'
  | 'unsoldInventory'
  | 'pricePerClip'
  | 'publicDemand'
  | 'wire'
  | 'wireCost'
  | 'clipsPerSecond'
  | 'marketingLevel'
  | 'autoClipperCost';

export type FieldPath = `fields.${PaperclipsFieldName}`;

export type SceneQuality = 'high' | 'partial' | 'low';

export interface SceneField<T = number> {
  value: T | null;
  raw: string;
  unit?: string;
  confidence: number;
  visible: boolean;
}

export interface PaperclipsFields {
  clips: SceneField<number>;
  funds: SceneField<number>;
  unsoldInventory: SceneField<number>;
  pricePerClip: SceneField<number>;
  publicDemand: SceneField<number>;
  wire: SceneField<number>;
  wireCost: SceneField<number>;
  clipsPerSecond: SceneField<number>;
  marketingLevel: SceneField<number>;
  autoClipperCost: SceneField<number>;
}

export interface RawPaperclipsScene {
  captureId: number;
  capturedAt: string;
  isPaperclips: boolean;
  confidence: number;
  fields: PaperclipsFields;
  unknowns: string[];
  notes: string[];
}

export interface EvalCaseRawScene extends Omit<RawPaperclipsScene, 'captureId' | 'capturedAt'> {
  captureId?: number;
  capturedAt?: string;
}

export interface PaperclipsScene extends RawPaperclipsScene {
  id: string;
  quality: SceneQuality;
  ageMs: number;
}

export interface SceneValidationResult {
  ok: boolean;
  scene?: PaperclipsScene;
  issues: string[];
}

export type PolicyActionId =
  | 'lower_price'
  | 'buy_wire'
  | 'buy_marketing'
  | 'buy_auto_clipper'
  | 'make_clips'
  | 'watch'
  | 'capture_again';

export interface PolicyAction {
  id: PolicyActionId;
  title: string;
  body: string;
  priority: number;
  speakable: boolean;
  requiredEvidence: FieldPath[];
}

export interface AdviceEvidence {
  field: FieldPath;
  label: string;
  value: string;
}

export interface AdviceResponse {
  id: string;
  sceneId: string;
  createdAt: string;
  actionId: PolicyActionId;
  title: string;
  body: string;
  evidence: AdviceEvidence[];
  usedFields: FieldPath[];
  confidence: number;
  ttsAllowed: boolean;
}

export interface AdviceApprovalResult {
  ok: boolean;
  advice?: AdviceResponse;
  issues: string[];
}

export interface CaptureFrame {
  captureId: number;
  sourceId: string;
  sourceName: string;
  capturedAt: string;
  mimeType: 'image/png' | 'image/jpeg';
  base64: string;
  dataUrl: string;
  hash: string;
  width: number;
  height: number;
}

export interface CaptureSourceSummary {
  id: string;
  name: string;
  thumbnailDataUrl: string;
}

export interface CompanionState {
  selectedSource?: CaptureSourceSummary;
  latestScene?: PaperclipsScene;
  latestAdvice?: AdviceResponse;
  transcript: TranscriptEntry[];
}

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
}
