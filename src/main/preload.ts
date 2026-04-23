import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('companionApi', {
  listSources: () => ipcRenderer.invoke('sources:list'),
  selectSource: (sourceId: string) => ipcRenderer.invoke('sources:select', sourceId),
  readiness: () => ipcRenderer.invoke('companion:readiness'),
  captureScene: () => ipcRenderer.invoke('companion:capture-scene'),
  ask: (question: string, fresh: boolean) => ipcRenderer.invoke('companion:ask', { question, fresh }),
  proactive: () => ipcRenderer.invoke('companion:proactive')
});
