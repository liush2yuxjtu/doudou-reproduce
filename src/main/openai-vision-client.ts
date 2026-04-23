import type { CaptureFrame, RawPaperclipsScene } from '../shared/types.js';
import { parsePaperclipsSceneJson } from '../core/vlm-scene-parser.js';

const DEFAULT_MODEL = 'gpt-4o-mini';
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

export class OpenAiVisionClient {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_VISION_MODEL ?? DEFAULT_MODEL
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async extractScene(frame: CaptureFrame): Promise<RawPaperclipsScene> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY missing');
    }

    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: paperclipsVisionPrompt() },
              { type: 'input_image', image_url: frame.dataUrl }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_object'
          }
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`VlmProviderError ${response.status}: ${body.slice(0, 500)}`);
    }

    const payload = (await response.json()) as unknown;
    const text = extractOutputText(payload);
    return parsePaperclipsSceneJson(text, {
      captureId: frame.captureId,
      capturedAt: frame.capturedAt
    });
  }
}

function paperclipsVisionPrompt(): string {
  return [
    'You are reading a screenshot of the early game Universal Paperclips UI.',
    'Return only valid JSON. Do not recommend actions.',
    'Use null for values you cannot read. Never infer hidden DOM or JavaScript state.',
    'Fields: clips, funds, unsoldInventory, pricePerClip, publicDemand, wire, wireCost, clipsPerSecond, marketingLevel, autoClipperCost.',
    'Each field must be { "value": number|null, "raw": string, "unit": string optional, "confidence": number 0-1, "visible": boolean }.',
    'Top level JSON shape:',
    '{"isPaperclips": boolean, "confidence": number, "fields": {...}, "unknowns": string[], "notes": string[]}'
  ].join('\n');
}

function extractOutputText(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'output_text' in payload) {
    const text = (payload as { output_text?: unknown }).output_text;
    if (typeof text === 'string') return text;
  }

  const chunks: string[] = [];
  collectText(payload, chunks);
  const text = chunks.join('\n').trim();
  if (!text) {
    throw new Error('VlmEmptyResponse');
  }
  return text;
}

function collectText(value: unknown, chunks: string[]): void {
  if (typeof value === 'string') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectText(item, chunks);
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.text === 'string') {
    chunks.push(record.text);
  }
  if (typeof record.content === 'string') {
    chunks.push(record.content);
  }

  for (const nested of Object.values(record)) {
    collectText(nested, chunks);
  }
}
