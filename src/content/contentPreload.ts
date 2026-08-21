import { contextBridge, ipcRenderer } from 'electron';

let cachedCss: string | undefined;

function getThemeCss(): string {
  if (cachedCss !== undefined) return cachedCss;
  try {
    cachedCss = String(ipcRenderer.sendSync('get-theme-css-sync') || '');
  } catch {
    cachedCss = '';
  }
  return cachedCss;
}

function ensureThemeInjected(): void {
  if (window.top !== window) return;
  const css = getThemeCss();
  if (!css) return;

  const target = document.documentElement || document.head || document.body;
  if (!target) return;

  let style = document.getElementById('__funpayRpcCustomTheme') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = '__funpayRpcCustomTheme';
    style.textContent = css;
    if (document.documentElement) {
      document.documentElement.insertBefore(style, document.documentElement.firstChild);
    } else {
      target.appendChild(style);
    }
  } else if (style.textContent !== css) {
    style.textContent = css;
  }
}

// 1. Immediate attempt if documentElement already exists
ensureThemeInjected();

// 2. Observe DOM creation so theme is attached the instant root element is parsed
const observer = new MutationObserver(() => {
  ensureThemeInjected();
  if (document.body && document.getElementById('__funpayRpcCustomTheme')) {
    observer.disconnect();
  }
});

try {
  observer.observe(document, { childList: true, subtree: true });
} catch {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureThemeInjected, { once: true });
}

ipcRenderer.on('theme-changed', (_event, themeCss: unknown) => {
  cachedCss = typeof themeCss === 'string' ? themeCss : '';
  const style = document.getElementById('__funpayRpcCustomTheme');
  if (!cachedCss) {
    style?.remove();
  } else if (style) {
    if (style.textContent !== cachedCss) {
      style.textContent = cachedCss;
    }
  } else {
    ensureThemeInjected();
  }
});

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
