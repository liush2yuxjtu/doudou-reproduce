import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CodexAuthCredentials {
  apiKey?: string;
  hasCodexLogin: boolean;
  source: 'env' | 'codex_api_key' | 'codex_cli' | 'none';
}

interface CodexAuthFile {
  OPENAI_API_KEY?: unknown;
  tokens?: {
    access_token?: unknown;
  };
}

export function resolveOpenAiCredentials(): CodexAuthCredentials | null {
  if (process.env.OPENAI_API_KEY) {
    return { apiKey: process.env.OPENAI_API_KEY, hasCodexLogin: hasCodexLogin(), source: 'env' };
  }

  const auth = readCodexAuth();
  if (!auth) {
    return { hasCodexLogin: false, source: 'none' };
  }

  if (typeof auth.OPENAI_API_KEY === 'string' && auth.OPENAI_API_KEY.length > 0) {
    return { apiKey: auth.OPENAI_API_KEY, hasCodexLogin: hasCodexLogin(auth), source: 'codex_api_key' };
  }

  return { hasCodexLogin: hasCodexLogin(auth), source: hasCodexLogin(auth) ? 'codex_cli' : 'none' };
}

function readCodexAuth(path = join(homedir(), '.codex', 'auth.json')): CodexAuthFile | null {
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CodexAuthFile;
  } catch {
    return null;
  }
}

function hasCodexLogin(auth = readCodexAuth()): boolean {
  return typeof auth?.tokens?.access_token === 'string' && auth.tokens.access_token.length > 0;
}
