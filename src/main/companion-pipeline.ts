import { buildDeterministicAdvice } from '../core/advisor.js';
import { approveAdvice } from '../core/evidence-validator.js';
import { FreshResultGate } from '../core/fresh-result-gate.js';
import { choosePaperclipsAction } from '../core/policy-engine.js';
import { validatePaperclipsScene } from '../core/scene-validator.js';
import { SessionMemory } from '../core/session-memory.js';
import type { AdviceResponse, CaptureFrame, PaperclipsScene, RawPaperclipsScene } from '../shared/types.js';
import { CaptureService } from './capture-service.js';
import { OpenAiVisionClient } from './openai-vision-client.js';

export interface AskResult {
  scene: PaperclipsScene;
  advice: AdviceResponse;
  transcript: ReturnType<SessionMemory['recentTranscript']>;
}

export class CompanionPipeline {
  private readonly gate = new FreshResultGate();
  private readonly memory = new SessionMemory();
  private latestFrameHash: string | null = null;

  constructor(
    private readonly captureService: CaptureService,
    private readonly visionClient: OpenAiVisionClient
  ) {}

  readiness() {
    return {
      selectedSource: this.captureService.getSelectedSource(),
      modelConfigured: this.visionClient.isConfigured(),
      latestScene: this.memory.latestScene(),
      latestAdvice: this.memory.latestAdvice(),
      transcript: this.memory.recentTranscript()
    };
  }

  async captureScene(): Promise<{ frame: CaptureFrame; scene: PaperclipsScene; duplicate: boolean }> {
    const captureId = this.gate.beginCapture();
    const frame = await this.captureService.captureFrame(captureId);
    const duplicate = frame.hash === this.latestFrameHash;

    const raw = await this.visionClient.extractScene(frame);
    const validated = validatePaperclipsScene(raw, { now: new Date() });

    if (!validated.scene || !validated.ok) {
      throw new Error(`SceneValidationFailed: ${validated.issues.join(', ')}`);
    }

    if (!this.gate.commitScene(captureId, validated.scene.id)) {
      throw new Error('StaleCaptureIgnored');
    }

    this.memory.recordScene(validated.scene);
    this.latestFrameHash = frame.hash;
    return { frame, scene: validated.scene, duplicate };
  }

  async ask(question: string, fresh: boolean): Promise<AskResult> {
    this.memory.recordTranscript({ role: 'user', text: question });

    const scene = fresh ? (await this.captureScene()).scene : this.requireFreshLatestScene();
    const action = choosePaperclipsAction(scene);
    const advice = buildDeterministicAdvice({ scene, action, question, now: new Date() });
    const approved = approveAdvice(advice, scene, { now: new Date() });

    if (!approved.advice || !approved.ok) {
      throw new Error(`AdviceBlocked: ${approved.issues.join(', ')}`);
    }

    if (!this.gate.canCommitAdvice(scene.id)) {
      throw new Error('StaleAdviceIgnored');
    }

    this.memory.recordAdvice(approved.advice);
    this.memory.recordTranscript({ role: 'assistant', text: `${approved.advice.title}. ${approved.advice.body}` });
    return {
      scene,
      advice: approved.advice,
      transcript: this.memory.recentTranscript()
    };
  }

  async proactive(): Promise<AskResult | { skipped: string }> {
    const scene = (await this.captureScene()).scene;
    const action = choosePaperclipsAction(scene);

    if (!action.speakable) {
      return { skipped: 'no_speakable_action' };
    }

    if (this.memory.hasRecentAction(action.id)) {
      return { skipped: 'cooldown' };
    }

    const advice = buildDeterministicAdvice({ scene, action, now: new Date() });
    const approved = approveAdvice(advice, scene, { now: new Date() });
    if (!approved.advice || !approved.ok) {
      return { skipped: `blocked_${approved.issues.join('_')}` };
    }

    this.memory.recordAdvice(approved.advice);
    this.memory.recordTranscript({ role: 'assistant', text: `${approved.advice.title}. ${approved.advice.body}` });
    return {
      scene,
      advice: approved.advice,
      transcript: this.memory.recentTranscript()
    };
  }

  private requireFreshLatestScene(): PaperclipsScene {
    const scene = this.memory.latestScene();
    if (!scene) {
      throw new Error('NoSceneAvailable');
    }

    const validated = validatePaperclipsScene(scene, { now: new Date() });
    if (!validated.scene || !validated.ok) {
      throw new Error(`SceneValidationFailed: ${validated.issues.join(', ')}`);
    }

    return validated.scene;
  }
}

export class MockVisionClient extends OpenAiVisionClient {
  constructor(private readonly scene: RawPaperclipsScene) {
    super('mock-model');
  }

  override isConfigured(): boolean {
    return true;
  }

  override async extractScene(frame: CaptureFrame): Promise<RawPaperclipsScene> {
    return {
      ...this.scene,
      captureId: frame.captureId,
      capturedAt: frame.capturedAt
    };
  }
}
