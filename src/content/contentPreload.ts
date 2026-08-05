import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('funpayRpcNotifications', {
  send: (payload: unknown) => {
    if (!payload || typeof payload !== 'object') return;
    const value = payload as { nickname?: unknown; message?: unknown; signature?: unknown };
    if (typeof value.nickname !== 'string' || typeof value.message !== 'string') return;
    ipcRenderer.send('funpay-notification', {
      nickname: value.nickname.slice(0, 120),
      message: value.message.slice(0, 1000),
      signature: typeof value.signature === 'string' ? value.signature.slice(0, 300) : '',
    });
  },
});
