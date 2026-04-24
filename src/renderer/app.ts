import type {
  AdviceResponse,
  CaptureSourceSummary,
  PaperclipsScene,
  TranscriptEntry
} from '../shared/types.js';
import { DEFAULT_MAX_SCENE_AGE_MS } from '../core/scene-validator.js';

interface CompanionApi {
  listSources(): Promise<CaptureSourceSummary[]>;
  selectSource(sourceId: string): Promise<CaptureSourceSummary>;
  readiness(): Promise<Readiness>;
  captureScene(): Promise<IpcResult<{ scene: PaperclipsScene }>>;
  ask(question: string, fresh: boolean): Promise<IpcResult<AskResult>>;
  proactive(): Promise<IpcResult<AskResult | { skipped: string }>>;
}

interface Readiness {
  selectedSource?: CaptureSourceSummary;
  modelConfigured: boolean;
  latestScene?: PaperclipsScene;
  latestAdvice?: AdviceResponse;
  transcript: TranscriptEntry[];
}

interface AskResult {
  scene: PaperclipsScene;
  advice: AdviceResponse;
  transcript: TranscriptEntry[];
}

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string; duplicate?: boolean };

declare global {
  interface Window {
    companionApi: CompanionApi;
  }
}

const statusTitle = byId('status-title');
const freshness = byId('freshness');
const windowStatus = byId('window-status');
const modelStatus = byId('model-status');
const sourceList = byId('source-list') as HTMLElement;
const adviceTitle = byId('advice-title');
const adviceBody = byId('advice-body');
const evidenceChips = byId('evidence-chips');
const confidence = byId('confidence');
const sceneAge = byId('scene-age');
const sceneGrid = byId('scene-grid');
const question = byId('question') as HTMLTextAreaElement;
const transcript = byId('transcript');
const mute = byId('mute') as HTMLInputElement;
const askLatest = byId('ask-latest') as HTMLButtonElement;

let latestSpeech = '';

byId('select-window').addEventListener('click', () => void showSources());
byId('capture-ask').addEventListener('click', () => void ask(true));
byId('ask-latest').addEventListener('click', () => void ask(false));
byId('proactive').addEventListener('click', () => void proactive());
byId('stop-speech').addEventListener('click', stopSpeech);
byId('replay-speech').addEventListener('click', () => speak(latestSpeech));

void refreshReadiness();

async function refreshReadiness(): Promise<void> {
  const ready = await window.companionApi.readiness();
  renderReadiness(ready);
  if (ready.latestScene) renderScene(ready.latestScene);
  if (ready.latestAdvice) renderAdvice(ready.latestAdvice);
  renderTranscript(ready.transcript);
}

async function showSources(): Promise<void> {
  setBusy('Listing windows...');
  const sources = await window.companionApi.listSources();
  sourceList.innerHTML = '';
  sourceList.hidden = false;

  for (const source of sources) {
    const button = document.createElement('button');
    button.className = 'source-card';
    button.innerHTML = `<img alt="" src="${source.thumbnailDataUrl}" /><span>${escapeHtml(source.name)}</span>`;
    button.addEventListener('click', () => void selectSource(source.id));
    sourceList.append(button);
  }

  setIdle('Choose window');
}

async function selectSource(sourceId: string): Promise<void> {
  setBusy('Selecting...');
  const source = await window.companionApi.selectSource(sourceId);
  sourceList.hidden = true;
  windowStatus.textContent = source.name;
  setIdle('Ready');
}

async function ask(fresh: boolean): Promise<void> {
  setBusy(fresh ? 'Capturing...' : 'Thinking...');
  const result = await window.companionApi.ask(question.value, fresh);
  if (!result.ok) {
    if (result.duplicate === true) {
      renderDuplicateHint(result.error);
    } else {
      renderError(result.error);
    }
    return;
  }

  renderScene(result.data.scene);
  renderAdvice(result.data.advice);
  renderTranscript(result.data.transcript);
  setIdle('Fresh');

  if (result.data.advice.ttsAllowed) {
    speak(`${result.data.advice.title}. ${result.data.advice.body}`);
  }
}

async function proactive(): Promise<void> {
  setBusy('Checking...');
  const result = await window.companionApi.proactive();
  if (!result.ok) {
    renderError(result.error);
    return;
  }

  if ('skipped' in result.data) {
    setIdle(`Skipped: ${result.data.skipped}`);
    return;
  }

  renderScene(result.data.scene);
  renderAdvice(result.data.advice);
  renderTranscript(result.data.transcript);
  setIdle('Fresh');
  if (result.data.advice.ttsAllowed) {
    speak(`${result.data.advice.title}. ${result.data.advice.body}`);
  }
}

function renderReadiness(ready: Readiness): void {
  windowStatus.textContent = ready.selectedSource?.name ?? 'not selected';
  modelStatus.textContent = ready.modelConfigured ? 'ready' : 'missing OpenAI/Codex auth';
  askLatest.disabled = !ready.latestScene;
  setIdle(ready.selectedSource ? 'Ready' : 'Setup');
}

function renderScene(scene: PaperclipsScene): void {
  confidence.textContent = `confidence: ${Math.round(scene.confidence * 100)}%`;
  sceneAge.textContent = `${Math.round(scene.ageMs / 1000)}s old`;
  freshness.textContent = scene.quality;
  askLatest.disabled = scene.ageMs > DEFAULT_MAX_SCENE_AGE_MS;

  const rows = Object.entries(scene.fields).map(([key, field]) => {
    const value = field.value === null ? 'unknown' : `${field.value}${field.unit ? ` ${field.unit}` : ''}`;
    return `<dt>${labelFor(key)}</dt><dd>${escapeHtml(value)}</dd>`;
  });
  sceneGrid.innerHTML = rows.join('');
}

function renderAdvice(advice: AdviceResponse): void {
  adviceTitle.textContent = advice.title;
  adviceBody.textContent = advice.body;
  evidenceChips.innerHTML = advice.evidence
    .map((item) => `<span class="chip">${escapeHtml(item.label)}: ${escapeHtml(item.value)}</span>`)
    .join('');
  latestSpeech = `${advice.title}. ${advice.body}`;
}

function renderTranscript(entries: TranscriptEntry[]): void {
  transcript.innerHTML = entries
    .map((entry) => `<div class="turn"><strong>${entry.role}:</strong> ${escapeHtml(entry.text)}</div>`)
    .join('');
}

function renderError(error: string): void {
  statusTitle.textContent = 'Needs attention';
  freshness.textContent = 'error';
  adviceTitle.textContent = 'Recovery needed';
  adviceBody.innerHTML = `<span class="error">${escapeHtml(error)}</span>`;
}

function renderDuplicateHint(errMsg: string): void {
  statusTitle.textContent = 'Needs attention';
  freshness.textContent = 'error';
  adviceTitle.textContent = 'Recovery needed';
  adviceBody.innerHTML = `<p>${escapeHtml(errMsg)}</p><p class="ux-hint">同一画面反复失败，建议切换窗口或调整场景后重试。</p>`;
}

function speak(text: string): void {
  if (!text || mute.checked || !('speechSynthesis' in window)) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function setBusy(text: string): void {
  statusTitle.textContent = text;
  freshness.textContent = 'busy';
}

function setIdle(text: string): void {
  statusTitle.textContent = text;
  if (freshness.textContent === 'busy') freshness.textContent = 'idle';
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
}

function labelFor(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
