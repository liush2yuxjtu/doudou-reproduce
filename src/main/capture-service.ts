import { createHash } from 'node:crypto';
import { desktopCapturer } from 'electron';
import type { CaptureFrame, CaptureSourceSummary } from '../shared/types.js';

const THUMBNAIL_SIZE = { width: 480, height: 270 };
const CAPTURE_SIZE = { width: 1600, height: 1000 };

export class CaptureService {
  private selectedSource: CaptureSourceSummary | null = null;

  async listSources(): Promise<CaptureSourceSummary[]> {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: THUMBNAIL_SIZE,
      fetchWindowIcons: false
    });

    return sources
      .filter((source) => !isCompanionWindow(source.name))
      .map((source) => ({
        id: source.id,
        name: source.name,
        thumbnailDataUrl: source.thumbnail.toDataURL()
      }));
  }

  async selectSource(sourceId: string): Promise<CaptureSourceSummary> {
    const sources = await this.listSources();
    const source = sources.find((item) => item.id === sourceId);
    if (!source) {
      throw new Error('WindowUnavailable');
    }

    if (isCompanionWindow(source.name)) {
      throw new Error('CaptureMismatch');
    }

    this.selectedSource = source;
    return source;
  }

  getSelectedSource(): CaptureSourceSummary | null {
    return this.selectedSource;
  }

  async captureFrame(captureId: number): Promise<CaptureFrame> {
    if (!this.selectedSource) {
      throw new Error('WindowSelectionCancelled');
    }

    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: CAPTURE_SIZE,
      fetchWindowIcons: false
    });
    const source = sources.find((item) => item.id === this.selectedSource?.id);

    if (!source || source.thumbnail.isEmpty()) {
      throw new Error('WindowUnavailable');
    }

    if (isCompanionWindow(source.name)) {
      throw new Error('CaptureMismatch');
    }

    const dataUrl = source.thumbnail.toDataURL();
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const size = source.thumbnail.getSize();
    const hash = createHash('sha256').update(base64).digest('hex');

    return {
      captureId,
      sourceId: source.id,
      sourceName: source.name,
      capturedAt: new Date().toISOString(),
      mimeType: 'image/png',
      base64,
      dataUrl,
      hash,
      width: size.width,
      height: size.height
    };
  }
}

function isCompanionWindow(name: string): boolean {
  return /paperclips companion|doudou|逗逗/i.test(name);
}
