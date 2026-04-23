import type { AdviceResponse, PaperclipsScene, TranscriptEntry } from '../shared/types.js';

const MAX_SCENES = 5;
const MAX_ADVICE = 5;
const MAX_TRANSCRIPT = 20;

export class SessionMemory {
  private scenes: PaperclipsScene[] = [];
  private adviceEvents: AdviceResponse[] = [];
  private transcript: TranscriptEntry[] = [];

  recordScene(scene: PaperclipsScene): void {
    this.scenes = [scene, ...this.scenes.filter((item) => item.id !== scene.id)].slice(0, MAX_SCENES);
  }

  recordAdvice(advice: AdviceResponse): void {
    this.adviceEvents = [advice, ...this.adviceEvents.filter((item) => item.id !== advice.id)].slice(0, MAX_ADVICE);
  }

  recordTranscript(entry: Omit<TranscriptEntry, 'id' | 'createdAt'>): TranscriptEntry {
    const item: TranscriptEntry = {
      ...entry,
      id: `turn_${Date.now()}_${this.transcript.length + 1}`,
      createdAt: new Date().toISOString()
    };
    this.transcript = [...this.transcript, item].slice(-MAX_TRANSCRIPT);
    return item;
  }

  latestScene(): PaperclipsScene | undefined {
    return this.scenes[0];
  }

  latestAdvice(): AdviceResponse | undefined {
    return this.adviceEvents[0];
  }

  recentTranscript(): TranscriptEntry[] {
    return [...this.transcript];
  }

  hasRecentAction(actionId: AdviceResponse['actionId'], now = new Date(), cooldownMs = 30_000): boolean {
    return this.adviceEvents.some((event) => {
      if (event.actionId !== actionId) return false;
      const ageMs = now.getTime() - Date.parse(event.createdAt);
      return Number.isFinite(ageMs) && ageMs <= cooldownMs;
    });
  }
}
