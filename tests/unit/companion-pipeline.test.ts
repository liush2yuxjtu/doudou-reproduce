import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanionPipeline } from '../../src/main/companion-pipeline.js';
import type { CaptureService } from '../../src/main/capture-service.js';
import type { OpenAiVisionClient } from '../../src/main/openai-vision-client.js';
import type { CaptureFrame, RawPaperclipsScene } from '../../src/shared/types.js';

const FIXED_HASH = 'sha256-test-frame-hash';
const ALT_HASH = 'sha256-different-frame-hash';

const buildFrame = (captureId: number, capturedAt: string, hash = FIXED_HASH): CaptureFrame => ({
  captureId,
  sourceId: 'window:test',
  sourceName: 'Universal Paperclips',
  capturedAt,
  mimeType: 'image/png',
  base64: 'AAAA',
  dataUrl: 'data:image/png;base64,AAAA',
  hash,
  width: 1600,
  height: 1000
});

const buildRawScene = (captureId: number, capturedAt: string): RawPaperclipsScene => ({
  captureId,
  capturedAt,
  isPaperclips: true,
  confidence: 0.88,
  fields: {
    clips: { value: 127, raw: '127 clips', confidence: 0.96, visible: true },
    funds: { value: 12.44, raw: '$12.44', unit: 'usd', confidence: 0.95, visible: true },
    unsoldInventory: { value: 34, raw: 'Unsold Inventory: 34', confidence: 0.94, visible: true },
    pricePerClip: { value: 0.25, raw: '$0.25', unit: 'usd', confidence: 0.92, visible: true },
    publicDemand: { value: 12, raw: 'Public Demand: 12%', unit: 'percent', confidence: 0.91, visible: true },
    wire: { value: 790, raw: 'Wire: 790', unit: 'inches', confidence: 0.93, visible: true },
    wireCost: { value: 14, raw: '$14', unit: 'usd', confidence: 0.82, visible: true },
    clipsPerSecond: { value: 1, raw: '1/sec', confidence: 0.81, visible: true },
    marketingLevel: { value: 1, raw: 'Marketing: 1', confidence: 0.79, visible: true },
    autoClipperCost: { value: 5, raw: 'AutoClippers $5', unit: 'usd', confidence: 0.84, visible: true }
  },
  unknowns: [],
  notes: []
});

describe('CompanionPipeline.captureScene frame hash ordering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:04.000Z'));
  });

  it('marks next capture as duplicate after VLM throws on the prior identical frame (R9-B)', async () => {
    const captureService = {
      captureFrame: vi.fn(async (captureId: number) =>
        buildFrame(captureId, '2026-04-23T12:00:03.500Z'))
    } as unknown as CaptureService;

    const visionClient = {
      extractScene: vi
        .fn<OpenAiVisionClient['extractScene']>()
        .mockRejectedValueOnce(new Error('VlmProviderError 503'))
        .mockImplementationOnce(async (frame: CaptureFrame) => buildRawScene(frame.captureId, frame.capturedAt))
    } as unknown as OpenAiVisionClient;

    const pipeline = new CompanionPipeline(captureService, visionClient);

    await expect(pipeline.captureScene()).rejects.toThrow('VlmProviderError 503');

    const second = await pipeline.captureScene();
    expect(second.duplicate).toBe(true);
    expect(second.frame.hash).toBe(FIXED_HASH);
  });

  it('writes latestFrameHash after VLM throw (回归 A)', async () => {
    const captureService = {
      captureFrame: vi.fn(async (captureId: number) =>
        buildFrame(captureId, '2026-04-23T12:00:03.500Z'))
    } as unknown as CaptureService;

    const visionClient = {
      extractScene: vi
        .fn<OpenAiVisionClient['extractScene']>()
        .mockRejectedValueOnce(new Error('VlmProviderError 503'))
    } as unknown as OpenAiVisionClient;

    const pipeline = new CompanionPipeline(captureService, visionClient);

    await expect(pipeline.captureScene()).rejects.toThrow('VlmProviderError 503');

    expect(pipeline.getLatestFrameHash()).toBe(FIXED_HASH);
  });

  it('writes latestFrameHash after validation throw (回归 B)', async () => {
    const captureService = {
      captureFrame: vi.fn(async (captureId: number) =>
        buildFrame(captureId, '2026-04-23T12:00:03.500Z'))
    } as unknown as CaptureService;

    const visionClient = {
      extractScene: vi.fn(async (frame: CaptureFrame) => ({
        captureId: frame.captureId,
        capturedAt: frame.capturedAt,
        isPaperclips: false,
        confidence: 0.1,
        fields: {},
        unknowns: [],
        notes: []
      }))
    } as unknown as OpenAiVisionClient;

    const pipeline = new CompanionPipeline(captureService, visionClient);

    await expect(pipeline.captureScene()).rejects.toThrow('SceneValidationFailed');

    expect(pipeline.getLatestFrameHash()).toBe(FIXED_HASH);
  });

  it('does not mark duplicate when different frame after VLM failure (回归 C)', async () => {
    let callCount = 0;
    const captureService = {
      captureFrame: vi.fn(async (captureId: number) => {
        callCount++;
        const hash = callCount === 1 ? FIXED_HASH : ALT_HASH;
        return buildFrame(captureId, '2026-04-23T12:00:03.500Z', hash);
      })
    } as unknown as CaptureService;

    const visionClient = {
      extractScene: vi
        .fn<OpenAiVisionClient['extractScene']>()
        .mockRejectedValueOnce(new Error('VlmProviderError 503'))
        .mockImplementationOnce(async (frame: CaptureFrame) => buildRawScene(frame.captureId, frame.capturedAt))
    } as unknown as OpenAiVisionClient;

    const pipeline = new CompanionPipeline(captureService, visionClient);

    await expect(pipeline.captureScene()).rejects.toThrow('VlmProviderError 503');

    const second = await pipeline.captureScene();
    expect(second.duplicate).toBe(false);
    expect(second.frame.hash).toBe(ALT_HASH);
  });
});
