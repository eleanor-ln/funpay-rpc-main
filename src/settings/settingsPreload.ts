import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('get-rpc-settings'),
  setSetting: (key: string, enabled: boolean) => {
    if (typeof key === 'string' && typeof enabled === 'boolean') ipcRenderer.send('set-rpc-setting', key, enabled);
  },
  close: () => ipcRenderer.send('toggle-settings'),
  openDeveloperLink: () => ipcRenderer.invoke('open-developer-link'),
});
