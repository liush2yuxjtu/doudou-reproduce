import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CaptureService } from './capture-service.js';
import { CompanionPipeline } from './companion-pipeline.js';
import { loadLocalEnv } from './env.js';
import { OpenAiVisionClient } from './openai-vision-client.js';
import { safeInvoke } from './ipc-envelope.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadLocalEnv();

let mainWindow: BrowserWindow | null = null;

const captureService = new CaptureService();
const pipeline = new CompanionPipeline(captureService, new OpenAiVisionClient());

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 380,
    minWidth: 340,
    height: 820,
    minHeight: 680,
    title: 'Paperclips Companion',
    alwaysOnTop: false,
    backgroundColor: '#f7f5ef',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  await mainWindow.loadFile(join(__dirname, '../../renderer/index.html'));
}

function registerIpc(): void {
  ipcMain.handle('sources:list', () => captureService.listSources());
  ipcMain.handle('sources:select', async (_event, sourceId: string) => captureService.selectSource(sourceId));
  ipcMain.handle('companion:readiness', () => pipeline.readiness());
  ipcMain.handle('companion:capture-scene', () => safeInvoke(() => pipeline.captureScene()));
  ipcMain.handle('companion:ask', (_event, input: { question: string; fresh: boolean }) =>
    safeInvoke(() => pipeline.ask(input.question, input.fresh))
  );
  ipcMain.handle('companion:proactive', () => safeInvoke(() => pipeline.proactive()));
}

registerIpc();

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
