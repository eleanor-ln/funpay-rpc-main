import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'fs/promises';
import { app, BrowserView, BrowserWindow, ipcMain, Menu, nativeImage, Notification, protocol, session, shell, Tray, type Event, type Input } from 'electron';
import path, { extname } from 'path';
import { PresenceService } from './services/presenceService';
import { SettingsManager } from './settings/settingsManager';
import type { PageInfo } from './types';

const THEME_SCHEME = 'funpay-theme';

protocol.registerSchemesAsPrivileged([{
  scheme: THEME_SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

const Store = require('electron-store');
const APP_NAME = 'FunPay';
const FOXEN_DEFAULT_ENABLED = false;
const BUNDLED_THEME_MARKER = 'funpay-rpc-theme-base: 171080-glass-v4';

const store = new Store({
  defaults: {
    discordRichPresence: true,
    customThemePath: '',
    notificationSoundPath: '',
    notificationSoundEnabled: true,
    desktopNotificationsEnabled: true,
    foxenEnabled: FOXEN_DEFAULT_ENABLED,
  },
  clearInvalidConfig: true,
  encryptionKey: 'funpay-rpc-config',
});

const HEADER_HEIGHT = 32;
const devMode = process.argv.includes('--dev');
const isMac = process.platform === 'darwin';
const resourcesPath = path.join(__dirname, '../assets');
const appIconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'funpay', process.platform === 'win32' ? 'funpay.ico' : 'funpay.png')
  : path.join(resourcesPath, 'funpay', process.platform === 'win32' ? 'funpay.ico' : 'funpay.png');

type CustomFileKind = 'theme' | 'sound';
type CustomFileEntry = { name: string; path: string };
type SettingsSnapshot = Record<string, string | boolean | CustomFileEntry[]>;

function customizationDirectory(kind: CustomFileKind): string {
  const root = app.isPackaged ? app.getPath('userData') : process.cwd();
  return path.join(root, kind === 'theme' ? 'themes' : 'sounds');
}

function customizationKey(kind: CustomFileKind): 'customThemePath' | 'notificationSoundPath' {
  return kind === 'theme' ? 'customThemePath' : 'notificationSoundPath';
}

function customizationExtensions(kind: CustomFileKind): string[] {
  return kind === 'theme'
    ? ['.css']
    : ['.mp3', '.ogg', '.oga', '.wav', '.m4a', '.aac', '.flac'];
}

async function ensureCustomizationDirectories(): Promise<void> {
  const themeDirectory = customizationDirectory('theme');
  const soundDirectory = customizationDirectory('sound');
  await Promise.all([
    mkdir(themeDirectory, { recursive: true }),
    mkdir(soundDirectory, { recursive: true }),
  ]);

  const bundledThemeNames = ['funpay.EleanorMay-theme.css', 'newRize-theme.css'];
  await Promise.all(bundledThemeNames.map(async (themeName) => {
    const bundledTheme = path.join(__dirname, '..', 'themes', themeName);
    const installedTheme = path.join(themeDirectory, themeName);
    try {
      const installedCss = await readFile(installedTheme, 'utf8');
      if (installedCss.includes(BUNDLED_THEME_MARKER)) return;
    } catch {
      // Install a missing bundled theme below.
    }
    try {
      await copyFile(bundledTheme, installedTheme);
    } catch (error) {
      if (devMode) console.warn(`Could not install bundled theme ${themeName}:`, error instanceof Error ? error.message : error);
    }
  }));

  const bundledThemeAssets = ['eleanor-wallpaper.gif', 'newrize-background.gif', 'sphere.png'];
  const bundledAssetsDirectory = path.join(__dirname, '..', 'themes', 'assets');
  const installedAssetsDirectory = path.join(themeDirectory, 'assets');
  await mkdir(installedAssetsDirectory, { recursive: true });
  await Promise.all(bundledThemeAssets.map(async (assetName) => {
    const bundledAsset = path.join(bundledAssetsDirectory, assetName);
    const installedAsset = path.join(installedAssetsDirectory, assetName);
    if (path.resolve(bundledAsset) === path.resolve(installedAsset)) return;
    try {
      await stat(installedAsset);
    } catch {
      try {
        await copyFile(bundledAsset, installedAsset);
      } catch (error) {
        if (devMode) console.warn(`Could not install bundled theme asset ${assetName}:`, error instanceof Error ? error.message : error);
      }
    }
  }));
}

async function listCustomizationFiles(kind: CustomFileKind): Promise<CustomFileEntry[]> {
  const directory = customizationDirectory(kind);
  await mkdir(directory, { recursive: true });
  const allowed = new Set(customizationExtensions(kind));
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && allowed.has(extname(entry.name).toLowerCase()))
    .map((entry) => ({ name: entry.name, path: path.join(directory, entry.name) }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
}

let mainWindow: BrowserWindow;
let contentView: BrowserView;
let headerView: BrowserView;
let presenceService: PresenceService;
let settingsManager: SettingsManager;
let tray: Tray | null = null;
let stylusWindow: BrowserWindow | null = null;
let stylusExtensionId = '';
const bundledExtensionIds = new Map<string, string>();
const bundledExtensionWindows = new Map<string, BrowserWindow>();
let lastPage: PageInfo = {
  title: 'FunPay',
  url: 'https://funpay.com/',
  artwork: '',
  section: 'FunPay',
  isFunPayPage: true,
  isCatalogPage: true,
  activityDetails: 'Browsing homepage',
  activityState: '',
  buttonLabel: '',
};
let scanTimer: NodeJS.Timeout | undefined;
let themePreloadId: string | undefined;
let ipcConfigured = false;
let customizationQueue: Promise<void> = Promise.resolve();
let contentLoaded = false;
let themeVersion = 0;
const shownNotificationSignatures = new Map<string, number>();

function stylusPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'stylus-mv2')
    : path.join(resourcesPath, 'stylus-mv2');
}

async function loadStylus(): Promise<void> {
  try {
    const extension = await session.defaultSession.extensions.loadExtension(stylusPath(), { allowFileAccess: true });
    stylusExtensionId = extension.id;
    console.info(`Stylus ${extension.version} loaded`);
  } catch (error) {
    console.warn('Stylus extension is unavailable:', error instanceof Error ? error.message : error);
  }
}

function bundledExtensionPath(name: string): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'extensions', name)
    : path.join(process.cwd(), 'extensions', name);
}

async function loadBundledExtensions(): Promise<void> {
  if (!store.get('foxenEnabled', FOXEN_DEFAULT_ENABLED)) return;
  const extensions = [
    { key: 'foxen', name: 'Foxen' },
  ];
  for (const extension of extensions) {
    try {
      const loaded = await session.defaultSession.extensions.loadExtension(
        bundledExtensionPath(extension.key),
        { allowFileAccess: true },
      );
      bundledExtensionIds.set(extension.key, loaded.id);
      console.info(`${extension.name} ${loaded.version} loaded`);
    } catch (error) {
      console.warn(`${extension.name} is unavailable:`, error instanceof Error ? error.message : error);
    }
  }
}

async function setFoxenEnabled(enabled: boolean): Promise<SettingsSnapshot> {
  if (enabled) {
    store.set('foxenEnabled', true);
    if (!bundledExtensionIds.has('foxen')) await loadBundledExtensions();
    if (!bundledExtensionIds.has('foxen')) {
      store.set('foxenEnabled', false);
      return getSettingsSnapshotWithFiles();
    }
  } else {
    store.set('foxenEnabled', false);
    const extensionId = bundledExtensionIds.get('foxen');
    if (extensionId) {
      await session.defaultSession.extensions.removeExtension(extensionId);
      bundledExtensionIds.delete('foxen');
    }
  }

  if (contentView && !contentView.webContents.isDestroyed()) contentView.webContents.reload();
  return getSettingsSnapshotWithFiles();
}

async function openBundledExtensionPopup(key: string): Promise<boolean> {
  const extensionId = bundledExtensionIds.get(key);
  if (!extensionId) return false;
  const existing = bundledExtensionWindows.get(key);
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return true;
  }

  const title = 'Foxen';
  const window = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 640,
    minHeight: 520,
    title: `${title} — ${APP_NAME}`,
    icon: appIconPath,
    backgroundColor: '#18181b',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  bundledExtensionWindows.set(key, window);
  window.on('closed', () => bundledExtensionWindows.delete(key));
  try {
    await window.loadURL(`chrome-extension://${extensionId}/popup/popup.html`);
    return true;
  } catch (error) {
    bundledExtensionWindows.delete(key);
    window.close();
    if (devMode) console.warn(`Could not open ${title} popup:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function openStylusManager(): Promise<void> {
  if (!stylusExtensionId) await loadStylus();
  if (!stylusExtensionId) return;
  if (stylusWindow && !stylusWindow.isDestroyed()) {
    stylusWindow.show();
    stylusWindow.focus();
    return;
  }

  stylusWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 760,
    minHeight: 560,
    title: `Stylus — ${APP_NAME}`,
    icon: appIconPath,
    backgroundColor: '#202124',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  stylusWindow.on('closed', () => { stylusWindow = null; });
  await stylusWindow.loadURL(`chrome-extension://${stylusExtensionId}/manage.html`);
}

function bounds(): void {
  if (!mainWindow || !contentView || !headerView) return;
  const { width, height } = mainWindow.getContentBounds();
  headerView.setBounds({ x: 0, y: 0, width, height: HEADER_HEIGHT });
  contentView.setBounds({ x: 0, y: HEADER_HEIGHT, width, height: Math.max(1, height - HEADER_HEIGHT) });
}

function sendNavigationState(): void {
  if (!headerView || !contentView) return;
  headerView.webContents.send('navigation-state-changed', {
    canGoBack: contentView.webContents.navigationHistory.canGoBack(),
    canGoForward: contentView.webContents.navigationHistory.canGoForward(),
  });
}

function getSettingsSnapshot(): Record<string, string | boolean> {
  return {
    discordRichPresence: Boolean(store.get('discordRichPresence', true)),
    customThemePath: String(store.get('customThemePath', '')),
    notificationSoundPath: String(store.get('notificationSoundPath', '')),
    notificationSoundEnabled: Boolean(store.get('notificationSoundEnabled', true)),
    desktopNotificationsEnabled: Boolean(store.get('desktopNotificationsEnabled', true)),
    foxenEnabled: Boolean(store.get('foxenEnabled', FOXEN_DEFAULT_ENABLED)),
  };
}

async function getSettingsSnapshotWithFiles(): Promise<SettingsSnapshot> {
  const [themes, sounds] = await Promise.all([
    listCustomizationFiles('theme'),
    listCustomizationFiles('sound'),
  ]);
  return {
    ...getSettingsSnapshot(),
    themeDirectory: customizationDirectory('theme'),
    soundDirectory: customizationDirectory('sound'),
    themeFiles: themes,
    soundFiles: sounds,
  };
}

function flattenUserstyleDocuments(css: string): string {
  let result = '';
  let cursor = 0;
  while (true) {
    const start = css.indexOf('@-moz-document', cursor);
    if (start < 0) return result + css.slice(cursor);
    result += css.slice(cursor, start);
    const open = css.indexOf('{', start);
    if (open < 0) return result + css.slice(start);

    let depth = 1;
    let quote = '';
    let comment = false;
    let close = open + 1;
    for (; close < css.length && depth > 0; close += 1) {
      const character = css[close];
      const next = css[close + 1];
      if (comment) {
        if (character === '*' && next === '/') {
          comment = false;
          close += 1;
        }
        continue;
      }
      if (quote) {
        if (character === '\\') close += 1;
        else if (character === quote) quote = '';
        continue;
      }
      if (character === '/' && next === '*') {
        comment = true;
        close += 1;
      } else if (character === '"' || character === "'") quote = character;
      else if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
    }
    if (depth !== 0) return result + css.slice(start);
    result += css.slice(open + 1, close - 1);
    cursor = close;
  }
}

function setupThemeProtocol(): void {
  protocol.handle(THEME_SCHEME, async (request) => {
    const themePath = String(store.get('customThemePath', ''));
    if (!themePath) return new Response('', { status: 404 });

    try {
      const requestUrl = new URL(request.url);
      const themeHost = requestUrl.hostname.toLowerCase();
      const requestPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');

      // The stylesheet itself is loaded as funpay-theme://theme.css.
      if (themeHost === 'theme.css' && !requestPath) {
        const css = flattenUserstyleDocuments(await readFile(themePath, 'utf8'));
        return new Response(css, {
          headers: {
            'content-type': 'text/css; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      }

      // Resolve url("assets/..."), including requests produced as
      // funpay-theme://theme.css/assets/... by Chromium.
      const relativeAsset = themeHost === 'theme.css'
        ? requestPath
        : `${themeHost}${requestUrl.pathname}`;
      const themeDirectory = path.resolve(path.dirname(themePath));
      const assetPath = path.resolve(themeDirectory, relativeAsset);
      if (assetPath !== themeDirectory && !assetPath.startsWith(`${themeDirectory}${path.sep}`)) {
        return new Response('', { status: 403 });
      }

      const asset = await readFile(assetPath);
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };
      return new Response(new Uint8Array(asset), {
        headers: {
          'content-type': mimeTypes[extname(assetPath).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store',
        },
      });
    } catch (error) {
      if (devMode) console.warn('Could not serve custom FunPay CSS:', error instanceof Error ? error.message : error);
      return new Response('', { status: 404 });
    }
  });
}

function audioMimeType(filePath: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
  };
  return mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function applyUserCustomizations(reloadPage = false): Promise<void> {
  customizationQueue = customizationQueue.then(
    () => applyUserCustomizationsNow(reloadPage),
    () => applyUserCustomizationsNow(reloadPage),
  );
  return customizationQueue;
}

async function applyUserCustomizationsNow(reloadPage: boolean): Promise<void> {
  if (!contentView || contentView.webContents.isDestroyed()) return;

  const themePath = String(store.get('customThemePath', ''));
  let hasTheme = false;
  if (themePath) {
    try {
      hasTheme = (await stat(themePath)).isFile();
    } catch (error) {
      if (devMode) console.warn('Could not read custom FunPay CSS:', error instanceof Error ? error.message : error);
    }
  }

  themeVersion += 1;

  if (themePreloadId) {
    try {
      session.defaultSession.unregisterPreloadScript(themePreloadId);
    } catch (error) {
      if (devMode) console.warn('Could not unregister previous custom FunPay CSS:', error instanceof Error ? error.message : error);
    }
    themePreloadId = undefined;
  }
  if (hasTheme) {
    try {
      const themeScript = `(() => {
        if (!/^(?:https?:\\/\\/)(?:www\\.)?funpay\\.com\\//i.test(location.href)) return;
        if (window.top !== window) return;
        const install = () => {
          const root = document.documentElement;
          if (!root) { setTimeout(install, 0); return; }
          const oldLink = document.getElementById('__funpayRpcCustomThemeLink');
          document.getElementById('__funpayRpcCustomThemeGuard')?.remove();
          root.style.removeProperty('visibility');
          const link = document.createElement('link');
          link.id = '__funpayRpcCustomThemeLink';
          link.rel = 'stylesheet';
          link.href = '${THEME_SCHEME}://theme.css?v=${themeVersion}';
          let settled = false;
          let timeoutId: number | undefined;
          const finish = (loaded: boolean) => {
            if (settled) return;
            settled = true;
            if (timeoutId !== undefined) clearTimeout(timeoutId);
            if (loaded) oldLink?.remove();
            else link.remove();
          };
          link.addEventListener('load', () => finish(true), { once: true });
          link.addEventListener('error', () => finish(false), { once: true });
          root.appendChild(link);
          timeoutId = window.setTimeout(() => finish(false), 5000);
        };
        install();
      })()`;
      const preloadPath = path.join(app.getPath('userData'), 'funpay-rpc-theme-preload.js');
      await writeFile(preloadPath, themeScript, 'utf8');
      themePreloadId = session.defaultSession.registerPreloadScript({ filePath: preloadPath, type: 'frame' });
    } catch (error) {
      if (devMode) console.warn('Could not register custom FunPay CSS:', error instanceof Error ? error.message : error);
    }
  }

  const currentThemeScript = `(() => {
    const oldLink = document.getElementById('__funpayRpcCustomThemeLink');
    const oldGuard = document.getElementById('__funpayRpcCustomThemeGuard');
    const hasFunPayUrl = /^(?:https?:\\/\\/)(?:www\\.)?funpay\\.com\\//i.test(location.href);
    if (!${hasTheme} || !hasFunPayUrl) {
      oldLink?.remove();
      oldGuard?.remove();
      document.documentElement?.style.removeProperty('visibility');
      return;
    }
    const root = document.documentElement || document.head || document;
    oldGuard?.remove();
    root.style.removeProperty('visibility');
    const link = document.createElement('link');
    link.id = '__funpayRpcCustomThemeLink';
    link.rel = 'stylesheet';
    link.href = '${THEME_SCHEME}://theme.css?v=${themeVersion}';
    let settled = false;
    let timeoutId: number | undefined;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (loaded) oldLink?.remove();
      else link.remove();
    };
    link.addEventListener('load', () => finish(true), { once: true });
    link.addEventListener('error', () => finish(false), { once: true });
    root.appendChild(link);
    timeoutId = window.setTimeout(() => finish(false), 5000);
  })()`;
  if (contentLoaded && !contentView.webContents.isLoading()) {
    await contentView.webContents.executeJavaScript(currentThemeScript).catch(() => undefined);
    await applyNotificationSound();
  }
  if (reloadPage && contentView && !contentView.webContents.isDestroyed()) {
    contentView.webContents.reload();
  }
}

async function applyNotificationSound(): Promise<void> {
  let soundDataUrl = '';
  const soundPath = String(store.get('notificationSoundPath', ''));
  const soundEnabled = Boolean(store.get('notificationSoundEnabled', true));
  if (soundEnabled && soundPath) {
    try {
      const sound = await readFile(soundPath);
      soundDataUrl = `data:${audioMimeType(soundPath)};base64,${sound.toString('base64')}`;
    } catch (error) {
      if (devMode) console.warn('Could not load custom notification sound:', error instanceof Error ? error.message : error);
    }
  }

  const soundScript = `(() => {
    const dataUrl = ${JSON.stringify(soundDataUrl)};
    const soundEnabled = ${soundEnabled};
    const stateKey = '__funpayRpcSoundState';
    const existing = window[stateKey];
    if (existing?.originalPlay && HTMLMediaElement.prototype.play !== existing.originalPlay) {
      HTMLMediaElement.prototype.play = existing.originalPlay;
    }
    if (!soundEnabled) {
      const state = existing || { originalPlay: HTMLMediaElement.prototype.play };
      state.audio?.pause();
      window[stateKey] = state;
      HTMLMediaElement.prototype.play = function(...args) {
        if (this instanceof HTMLAudioElement) return Promise.resolve();
        return state.originalPlay.apply(this, args);
      };
      return;
    }
    if (!dataUrl) {
      if (existing?.audio) existing.audio.pause();
      delete window[stateKey];
      return;
    }
    const state = existing || { originalPlay: HTMLMediaElement.prototype.play };
    state.audio = new Audio(dataUrl);
    state.audio.preload = 'auto';
    window[stateKey] = state;
    HTMLMediaElement.prototype.play = function(...args) {
      if (this instanceof HTMLAudioElement && this !== state.audio) {
        state.audio.currentTime = 0;
        state.audio.volume = this.volume;
        const result = state.audio.play();
        if (result) result.catch(() => undefined);
        return Promise.resolve();
      }
      return state.originalPlay.apply(this, args);
    };
  })()`;
  await contentView.webContents.executeJavaScript(soundScript).catch(() => undefined);
}

function showWindowsNotification(nickname: string, message: string, signature: string): void {
  if (process.platform !== 'win32' || !store.get('desktopNotificationsEnabled', true) || !Notification.isSupported()) return;
  const cleanNickname = nickname.trim() || 'FunPay';
  const cleanMessage = message.trim();
  if (!cleanMessage) return;
  const key = signature || `${cleanNickname}\n${cleanMessage}`;
  const now = Date.now();
  const previous = shownNotificationSignatures.get(key);
  if (previous && now - previous < 15_000) return;
  shownNotificationSignatures.set(key, now);
  for (const [oldKey, timestamp] of shownNotificationSignatures) {
    if (now - timestamp > 60_000) shownNotificationSignatures.delete(oldKey);
  }
  const notification = new Notification({
    title: cleanNickname,
    body: cleanMessage,
    icon: appIconPath,
    silent: !store.get('notificationSoundEnabled', true),
  });
  notification.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
  notification.show();
}

function installNotificationObserver(): void {
  if (!contentView || contentView.webContents.isDestroyed()) return;
  const observerScript = `(() => {
    if (window.__funpayRpcNotificationObserver) return;
    const bridge = window.funpayRpcNotifications;
    if (!bridge || !document.body) return;
    const seen = new Set();
    let ready = false;
    const text = (node) => (node?.textContent || '').replace(/\\s+/g, ' ').trim();
    const find = (root, selectors) => { for (const selector of selectors) { const value = text(root.querySelector(selector)); if (value) return value; } return ''; };
    const contactSignature = (item, nickname, message) => (item.getAttribute('data-id') || nickname) + '|' + message;
    const notifyContact = (item) => {
      if (!ready || !item.classList.contains('unread')) return;
      const nickname = find(item, ['.contact-item-name', '.media-user-name', '.user-link-name', 'a']);
      const message = find(item, ['.contact-item-message', '.last-message', '.message']);
      if (!message) return;
      const signature = contactSignature(item, nickname, message);
      if (seen.has(signature)) return;
      seen.add(signature);
      bridge.send({ nickname, message, signature });
    };
    const prime = () => document.querySelectorAll('.contact-item.unread').forEach((item) => {
      const nickname = find(item, ['.contact-item-name', '.media-user-name', '.user-link-name', 'a']);
      const message = find(item, ['.contact-item-message', '.last-message', '.message']);
      if (message) seen.add(contactSignature(item, nickname, message));
    });
    const observer = new MutationObserver((records) => {
      if (!ready) return;
      for (const record of records) {
        if (record.type === 'attributes') {
          const item = record.target.closest?.('.contact-item');
          if (item) notifyContact(item);
        }
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('.contact-item')) notifyContact(node);
          node.querySelectorAll('.contact-item').forEach((item) => notifyContact(item));
        });
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-node-msg'] });
    window.__funpayRpcNotificationObserver = observer;
    setTimeout(() => { prime(); ready = true; }, 1200);
  })()`;
  contentView.webContents.executeJavaScript(observerScript).catch(() => undefined);
}

async function selectCustomizationFile(kind: CustomFileKind, selectedPath: unknown): Promise<SettingsSnapshot> {
  if (typeof selectedPath !== 'string' || !selectedPath) return getSettingsSnapshotWithFiles();
  const directory = path.resolve(customizationDirectory(kind));
  const candidate = path.resolve(selectedPath);
  const allowed = customizationExtensions(kind).includes(extname(candidate).toLowerCase());
  if (!allowed || (candidate !== directory && !candidate.startsWith(`${directory}${path.sep}`))) {
    return getSettingsSnapshotWithFiles();
  }
  try {
    if (!(await stat(candidate)).isFile()) return getSettingsSnapshotWithFiles();
    store.set(customizationKey(kind), candidate);
    if (kind === 'theme') await applyUserCustomizations(true);
    else await applyNotificationSound();
  } catch (error) {
    if (devMode) console.warn('Could not select custom file:', error instanceof Error ? error.message : error);
  }
  return getSettingsSnapshotWithFiles();
}

function setupWindowControls(): void {
  if (ipcConfigured) return;
  ipcConfigured = true;
  ipcMain.on('minimize-window', () => mainWindow?.minimize());
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('title-bar-double-click', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('close-window', () => mainWindow?.close());
  ipcMain.on('navigate-back', () => contentView?.webContents.navigationHistory.goBack());
  ipcMain.on('navigate-forward', () => contentView?.webContents.navigationHistory.goForward());
  ipcMain.on('refresh-page', () => contentView?.webContents.reload());
  ipcMain.on('cancel-refresh', () => contentView?.webContents.stop());
  ipcMain.handle('get-navigation-controls-enabled', () => true);
  ipcMain.handle('is-maximized', () => Boolean(mainWindow?.isMaximized()));
  ipcMain.handle('open-developer-link', async () => { await shell.openExternal('https://funpay.com/'); return true; });
  ipcMain.handle('open-eleanor-may-link', async () => { await shell.openExternal('https://t.me/notslep'); return true; });
  ipcMain.handle('open-stylus-manager', async () => { await openStylusManager(); return Boolean(stylusExtensionId); });
  ipcMain.handle('open-bundled-extension', async (_event, key: unknown) => {
    if (key !== 'foxen') return false;
    return openBundledExtensionPopup(key);
  });
  ipcMain.handle('set-foxen-enabled', async (_event, enabled: unknown) => {
    if (typeof enabled !== 'boolean') return getSettingsSnapshotWithFiles();
    return setFoxenEnabled(enabled);
  });
  ipcMain.handle('test-windows-notification', () => {
    if (process.platform !== 'win32') return { shown: false, reason: 'Windows notifications are only available on Windows.' };
    if (!Notification.isSupported()) return { shown: false, reason: 'Windows notifications are not supported on this system.' };
    if (!store.get('desktopNotificationsEnabled', true)) return { shown: false, reason: 'Enable Windows notifications first.' };
    showWindowsNotification(APP_NAME, 'Test notification: Windows notifications are working.', `test-${Date.now()}`);
    return { shown: true };
  });
  ipcMain.on('funpay-notification', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object') return;
    const value = payload as { nickname?: unknown; message?: unknown; signature?: unknown };
    if (typeof value.nickname !== 'string' || typeof value.message !== 'string') return;
    showWindowsNotification(value.nickname, value.message, typeof value.signature === 'string' ? value.signature : '');
  });
  ipcMain.on('toggle-settings', () => settingsManager.toggle());
  ipcMain.handle('get-rpc-settings', () => getSettingsSnapshotWithFiles());
  ipcMain.handle('refresh-custom-files', () => getSettingsSnapshotWithFiles());
  ipcMain.handle('select-custom-file', (_event, kind: unknown, selectedPath: unknown) => {
    if (kind !== 'theme' && kind !== 'sound') return getSettingsSnapshotWithFiles();
    return selectCustomizationFile(kind, selectedPath);
  });
  ipcMain.handle('open-custom-folder', async (_event, kind: unknown) => {
    if (kind !== 'theme' && kind !== 'sound') return false;
    await ensureCustomizationDirectories();
    const error = await shell.openPath(customizationDirectory(kind));
    if (error && devMode) console.warn('Could not open customization folder:', error);
    return !error;
  });
  ipcMain.handle('clear-custom-file', async (_event, key: unknown) => {
    if (key !== 'customThemePath' && key !== 'notificationSoundPath') return getSettingsSnapshot();
    store.set(key, '');
    if (key === 'customThemePath') await applyUserCustomizations(true);
    else await applyNotificationSound();
    return getSettingsSnapshotWithFiles();
  });
  ipcMain.on('set-rpc-setting', (_event, key: unknown, enabled: unknown) => {
    const allowedKeys = new Set(['discordRichPresence', 'notificationSoundEnabled', 'desktopNotificationsEnabled']);
    if (typeof key !== 'string' || !allowedKeys.has(key) || typeof enabled !== 'boolean') return;
    if (key === 'discordRichPresence') presenceService.setEnabled(enabled);
    else {
      store.set(key, enabled);
      if (key === 'notificationSoundEnabled') void applyNotificationSound();
    }
    if (key === 'discordRichPresence') void presenceService.update(lastPage);
  });
}

function setupTray(): void {
  const icon = nativeImage.createFromPath(appIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open FunPay', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Stylus themes', click: () => { void openStylusManager(); } },
    { label: 'Settings', click: () => settingsManager.toggle() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
  tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
}

async function readPage(): Promise<PageInfo> {
  const fallback: PageInfo = { ...lastPage, url: contentView.webContents.getURL() || lastPage.url };
  try {
    const result = await contentView.webContents.executeJavaScript(`(() => {
      const pageUrl = location.href;
      const isFunPayPage = /^(?:https?:\\/\\/)?(?:www\\.)?funpay\\.com\\//i.test(pageUrl);
      const normalizedPath = location.pathname.replace(/^\\/(?:en|ru)\\b/i, '') || '/';
      const [, page, id] = normalizedPath.split('/');
      const heading = document.querySelector('h1')?.textContent?.trim();
      const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
      const title = heading || metaTitle || document.title.replace(/\\s*[|–-]\\s*FunPay.*$/i, '').trim() || 'FunPay';
      const artworkRaw = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || document.querySelector('.game-card img, .offer-list-image img, main img')?.getAttribute('src') || '';
      const artwork = artworkRaw ? new URL(artworkRaw, pageUrl).toString() : '';
      const activityState = document.querySelector('h1')?.textContent?.trim() || '';
      let activityDetails = 'Browsing FunPay';
      let buttonLabel = '';
      let isCatalogPage = false;

      switch (page) {
        case '':
        case undefined:
          activityDetails = 'Browsing homepage';
          isCatalogPage = true;
          break;
        case 'lots':
          isCatalogPage = true;
          if (normalizedPath.includes('/offer')) {
            activityDetails = 'Viewing offer';
            buttonLabel = 'View Offer';
            isCatalogPage = false;
          } else if (normalizedPath.includes('/trade')) {
            activityDetails = 'Creating offer';
            isCatalogPage = false;
          } else if (id) {
            activityDetails = 'Browsing offers';
            buttonLabel = 'View Offers';
          }
          break;
        case 'chips':
          activityDetails = 'Browsing game currency';
          buttonLabel = 'View Currency';
          isCatalogPage = true;
          break;
        case 'users':
          activityDetails = 'Viewing profile';
          buttonLabel = 'View Profile';
          break;
        case 'orders':
          activityDetails = 'Viewing orders';
          break;
        case 'chat':
          activityDetails = 'Chatting';
          break;
        case 'account':
          activityDetails = 'Managing account';
          break;
      }

      return { title, url: pageUrl, artwork, section: activityState || 'FunPay', isFunPayPage, isCatalogPage, activityDetails, activityState, buttonLabel };
    })()`);
    if (result && typeof result === 'object') return result as PageInfo;
  } catch (error) {
    if (devMode) console.warn('FunPay page scan failed:', error);
  }
  return fallback;
}

function scanPage(): void {
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = setTimeout(async () => {
    const page = await readPage();
    lastPage = page;
    await presenceService.update(page);
  }, 350);
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    title: APP_NAME,
    icon: appIconPath,
    frame: isMac,
    titleBarStyle: isMac ? 'hidden' : undefined,
    trafficLightPosition: isMac ? { x: 10, y: 10 } : undefined,
    backgroundColor: '#18181b',
    webPreferences: { contextIsolation: true, nodeIntegration: false, devTools: devMode },
  });
  headerView = new BrowserView({ webPreferences: { preload: path.join(__dirname, 'header', 'headerPreload.js'), contextIsolation: true, sandbox: true } });
  contentView = new BrowserView({ webPreferences: { preload: path.join(__dirname, 'content', 'contentPreload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: devMode } });
  contentLoaded = false;
  mainWindow.addBrowserView(headerView);
  mainWindow.addBrowserView(contentView);
  bounds();
  headerView.webContents.loadFile(path.join(__dirname, 'header', 'header.html'));
  await applyUserCustomizations().catch((error) => {
    if (devMode) console.warn('Could not prepare custom FunPay CSS:', error instanceof Error ? error.message : error);
  });
  contentView.webContents.loadURL('https://funpay.com/');

  presenceService = new PresenceService(store);
  settingsManager = new SettingsManager(mainWindow);
  setupWindowControls();

  const openSettingsOnF1 = (event: Event, input: Input) => {
    if (input.type === 'keyDown' && input.key === 'F1') {
      event.preventDefault();
      settingsManager.toggle();
    }
  };
  contentView.webContents.on('before-input-event', openSettingsOnF1);
  headerView.webContents.on('before-input-event', openSettingsOnF1);

  mainWindow.on('resize', bounds);
  contentView.webContents.on('did-start-loading', () => {
    contentLoaded = false;
    headerView.webContents.send('refresh-state-changed', true);
  });
  contentView.webContents.on('did-stop-loading', () => {
    headerView.webContents.send('refresh-state-changed', false);
    sendNavigationState();
    scanPage();
  });
  contentView.webContents.on('did-finish-load', () => {
    contentLoaded = true;
    installNotificationObserver();
    void applyUserCustomizations();
    void applyNotificationSound();
    scanPage();
  });
  contentView.webContents.on('did-navigate', () => { sendNavigationState(); scanPage(); });
  contentView.webContents.on('did-navigate-in-page', () => { sendNavigationState(); scanPage(); });
  headerView.webContents.on('did-finish-load', () => sendNavigationState());
  mainWindow.on('closed', () => {
    tray?.destroy();
    tray = null;
    stylusWindow?.close();
    stylusWindow = null;
    for (const window of bundledExtensionWindows.values()) window.close();
    bundledExtensionWindows.clear();
  });
  setupTray();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.exit(0);
else {
  app.on('second-instance', () => { mainWindow?.show(); mainWindow?.focus(); });
  app.whenReady().then(async () => {
    setupThemeProtocol();
    await ensureCustomizationDirectories();
    await loadStylus();
    await loadBundledExtensions();
    await createWindow();
  });
  app.on('window-all-closed', () => { if (!isMac) app.quit(); });
  app.on('activate', () => { if (!mainWindow) createWindow(); else mainWindow.show(); });
  app.on('before-quit', () => presenceService?.clear());
}
