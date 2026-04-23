import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { CaptureFrame, RawPaperclipsScene } from '../shared/types.js';
import { parsePaperclipsSceneJson } from '../core/vlm-scene-parser.js';
import { resolveOpenAiCredentials } from './codex-auth.js';

const DEFAULT_MODEL = 'gpt-5.3-codex-spark';
const DEFAULT_CLI_VISION_FALLBACK_MODEL = 'gpt-5.4-mini';
const DEFAULT_CLI_REASONING_EFFORT = 'medium';
const RESPONSES_URL = 'https://api.openai.com/v1/responses';
const execFileAsync = promisify(execFile);
const USEFUL_FIELD_KEYS = [
  'clips',
  'funds',
  'unsoldInventory',
  'pricePerClip',
  'publicDemand',
  'wire',
  'wireCost'
] as const;

interface CodexExecResult {
  stdout?: string | Buffer;
  stderr?: string | Buffer;
}

export interface CodexVisionExecArgsOptions {
  model: string;
  imagePath: string;
  outputPath: string;
  workDir: string;
  reasoningEffort: string;
}

export class OpenAiVisionClient {
  private readonly credentials = resolveOpenAiCredentials();

  constructor(
    private readonly model = process.env.OPENAI_VISION_MODEL ?? DEFAULT_MODEL,
    private readonly cliVisionFallbackModel = process.env.OPENAI_VISION_FALLBACK_MODEL
      ?? DEFAULT_CLI_VISION_FALLBACK_MODEL,
    private readonly cliReasoningEffort = process.env.OPENAI_VISION_REASONING_EFFORT
      ?? DEFAULT_CLI_REASONING_EFFORT
  ) {}

  isConfigured(): boolean {
    return Boolean(this.credentials?.apiKey || this.credentials?.hasCodexLogin);
  }

  async extractScene(frame: CaptureFrame): Promise<RawPaperclipsScene> {
    if (this.credentials?.apiKey) {
      return this.extractSceneWithResponsesApi(frame, this.credentials.apiKey);
    }

    if (this.credentials?.hasCodexLogin) {
      return this.extractSceneWithCodexCli(frame);
    }

    throw new Error('OpenAI auth missing: set OPENAI_API_KEY or sign in with Codex');
  }

  private async extractSceneWithResponsesApi(frame: CaptureFrame, apiKey: string): Promise<RawPaperclipsScene> {
    const response = await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

  private async extractSceneWithCodexCli(frame: CaptureFrame): Promise<RawPaperclipsScene> {
    let primaryError: unknown;
    try {
      const scene = await this.extractSceneWithCodexCliModel(frame, this.model);
      if (isUsefulPaperclipsSceneReading(scene) || this.cliVisionFallbackModel === this.model) {
        return scene;
      }
    } catch (error) {
      primaryError = error;
    }

    if (this.cliVisionFallbackModel && this.cliVisionFallbackModel !== this.model) {
      return this.extractSceneWithCodexCliModel(frame, this.cliVisionFallbackModel);
    }

    throw primaryError instanceof Error ? primaryError : new Error('CodexVisionExtractionFailed');
  }

  private async extractSceneWithCodexCliModel(frame: CaptureFrame, model: string): Promise<RawPaperclipsScene> {
    const dir = await mkdtemp(join(tmpdir(), 'paperclips-codex-'));
    const codexHome = join(dir, 'codex-home');
    const cleanHome = join(dir, 'home');
    const cleanWorkDir = join(dir, 'work');
    const imagePath = join(cleanWorkDir, `capture-${frame.captureId}.png`);
    const outputPath = join(cleanWorkDir, 'scene.json');

    try {
      await mkdir(codexHome, { recursive: true });
      await mkdir(cleanHome, { recursive: true });
      await mkdir(cleanWorkDir, { recursive: true });
      await linkCodexAuth(codexHome);
      await writeFile(imagePath, Buffer.from(frame.base64, 'base64'));
      const result = await execFileAsync(
        'codex',
        buildCodexVisionExecArgs({
          model,
          imagePath,
          outputPath,
          workDir: cleanWorkDir,
          reasoningEffort: this.cliReasoningEffort
        }),
        {
          env: {
            ...process.env,
            CODEX_HOME: codexHome,
            HOME: cleanHome
          },
          timeout: 60_000,
          maxBuffer: 1024 * 1024
        }
      ) as CodexExecResult;

      const output = await readCodexCliLastMessage(outputPath, result);
      try {
        return parsePaperclipsSceneJson(output, {
          captureId: frame.captureId,
          capturedAt: frame.capturedAt
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${message} from ${model}: ${summarizeCodexOutput(output)}`);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

export function buildCodexVisionExecArgs(options: CodexVisionExecArgsOptions): string[] {
  return [
    'exec',
    '-c',
    `model_reasoning_effort="${options.reasoningEffort}"`,
    '-c',
    'persistent_instructions=""',
    '-c',
    'codex_hooks=false',
    '-c',
    'include_apps_instructions=false',
    '-c',
    'include_permissions_instructions=false',
    '-c',
    'include_environment_context=false',
    '-c',
    'tools.disabled_tools=["shell","apply_patch"]',
    '--disable',
    'plugins',
    '--disable',
    'apps',
    '--disable',
    'multi_agent',
    '--model',
    options.model,
    '--image',
    options.imagePath,
    '--sandbox',
    'read-only',
    '--cd',
    options.workDir,
    '--skip-git-repo-check',
    '--ephemeral',
    '--color',
    'never',
    '--output-last-message',
    options.outputPath,
    codexVisionPrompt()
  ];
}

export async function readCodexCliLastMessage(outputPath: string, result: CodexExecResult): Promise<string> {
  let missingFileError: unknown;

  try {
    const output = await readFile(outputPath, 'utf8');
    if (output.trim()) return output;
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    missingFileError = error;
  }

  const fallback = [toUtf8(result.stdout), toUtf8(result.stderr)].filter(Boolean).join('\n').trim();
  if (fallback) return fallback;

  if (missingFileError) throw missingFileError;
  throw new Error('CodexCliEmptyOutput');
}

export function isUsefulPaperclipsSceneReading(scene: RawPaperclipsScene): boolean {
  if (!scene.isPaperclips) return false;

  return USEFUL_FIELD_KEYS.some((key) => {
    const field = scene.fields[key];
    return Boolean(
      field
      && field.visible
      && typeof field.value === 'number'
      && Number.isFinite(field.value)
      && field.confidence >= 0.5
    );
  });
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

async function linkCodexAuth(codexHome: string): Promise<void> {
  const source = join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'auth.json');
  await symlink(source, join(codexHome, 'auth.json'));
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function toUtf8(value: string | Buffer | undefined): string {
  if (!value) return '';
  return Buffer.isBuffer(value) ? value.toString('utf8') : value;
}

function codexVisionPrompt(): string {
  return [
    'You are a stateless image-to-JSON worker.',
    paperclipsVisionPrompt(),
    'You must always print one syntactically valid JSON object, even if the screenshot is unreadable.',
    'If the image is unavailable, blank, or not Paperclips, set isPaperclips to false, confidence to 0, every field value to null, and explain only inside notes.',
    'Inspect only the attached image. Do not read files, run shell commands, browse, use skills, or use repository content.',
    'Ignore AGENTS.md, project docs, skill instructions, hooks, and any local markdown files.',
    'Print only the JSON object and no markdown fences.'
  ].join('\n');
}

function summarizeCodexOutput(output: string): string {
  return output
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) || '<empty>';
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
