import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('get-rpc-settings'),
  setSetting: (key: string, enabled: boolean) => {
    if (typeof key === 'string' && typeof enabled === 'boolean') ipcRenderer.send('set-rpc-setting', key, enabled);
  },
  refreshCustomFiles: () => ipcRenderer.invoke('refresh-custom-files'),
  selectCustomFile: (kind: 'theme' | 'sound', filePath: string) => ipcRenderer.invoke('select-custom-file', kind, filePath),
  openCustomFolder: (kind: 'theme' | 'sound') => ipcRenderer.invoke('open-custom-folder', kind),
  clearCustomFile: (key: string) => ipcRenderer.invoke('clear-custom-file', key),
  openStylusManager: () => ipcRenderer.invoke('open-stylus-manager'),
  close: () => ipcRenderer.send('toggle-settings'),
  openDeveloperLink: () => ipcRenderer.invoke('open-developer-link'),
});
