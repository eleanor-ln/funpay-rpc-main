import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const sendChannels = new Set([
  'close-window',
  'maximize-window',
  'minimize-window',
  'navigate-back',
  'navigate-forward',
  'refresh-page',
  'cancel-refresh',
  'title-bar-double-click',
]);

const invokeChannels = new Set(['get-navigation-controls-enabled', 'is-maximized']);
const onChannels = new Set(['navigation-state-changed', 'refresh-state-changed']);

contextBridge.exposeInMainWorld('headerAPI', {
  platform: process.platform,
  send: (channel: string, ...args: unknown[]) => {
    if (sendChannels.has(channel)) ipcRenderer.send(channel, ...args);
  },
  invoke: (channel: string, ...args: unknown[]) => {
    if (!invokeChannels.has(channel)) return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    if (!onChannels.has(channel)) return;
    ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: unknown[]) => listener(...args));
  },
});
