import { app, BrowserView, BrowserWindow, ipcMain, Menu, nativeImage, shell, Tray, type Event, type Input } from 'electron';
import path from 'path';
import { PresenceService } from './services/presenceService';
import { SettingsManager } from './settings/settingsManager';
import type { PageInfo } from './types';

const Store = require('electron-store');
const store = new Store({
  defaults: {
    discordRichPresence: true,
    discordShowArtwork: true,
    discordShowButton: true,
    discordShowCatalog: false,
  },
  clearInvalidConfig: true,
  encryptionKey: 'vndb-rpc-config',
});

const HEADER_HEIGHT = 32;
const devMode = process.argv.includes('--dev');
const isMac = process.platform === 'darwin';
const resourcesPath = path.join(__dirname, '../assets');
const appIconPath = path.join(resourcesPath, 'newEleanorMay', 'all.ico');

let mainWindow: BrowserWindow;
let contentView: BrowserView;
let headerView: BrowserView;
let presenceService: PresenceService;
let settingsManager: SettingsManager;
let tray: Tray | null = null;
let lastPage: PageInfo = { title: 'VNDB', url: 'https://vndb.org/', artwork: '', vnId: '', isVisualNovel: false };
let scanTimer: NodeJS.Timeout | undefined;

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

function setupWindowControls(): void {
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
}

function setupTray(): void {
  const icon = nativeImage.createFromPath(appIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('VNDB RPC');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open VNDB', click: () => { mainWindow.show(); mainWindow.focus(); } },
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
      const isVisualNovel = /^\\/v\\d+(?:$|\\/)/.test(location.pathname);
      const heading = document.querySelector('h1')?.textContent?.trim();
      const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
      const title = heading || metaTitle || document.title.replace(/\\s*[|–-]\\s*VNDB.*$/i, '').trim() || 'VNDB';
      const artworkRaw = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || document.querySelector('main img')?.getAttribute('src') || '';
      const artwork = artworkRaw ? new URL(artworkRaw, pageUrl).toString() : '';
      const id = location.pathname.match(/^\\/(v\\d+)/)?.[1] || '';
      return { title, url: pageUrl, artwork, vnId: id, isVisualNovel };
    })()`);
    if (result && typeof result === 'object') return result as PageInfo;
  } catch (error) {
    if (devMode) console.warn('VNDB page scan failed:', error);
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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    title: 'VNDB RPC',
    icon: appIconPath,
    frame: isMac,
    titleBarStyle: isMac ? 'hidden' : undefined,
    trafficLightPosition: isMac ? { x: 10, y: 10 } : undefined,
    backgroundColor: '#18181b',
    webPreferences: { contextIsolation: true, nodeIntegration: false, devTools: devMode },
  });

  headerView = new BrowserView({ webPreferences: { preload: path.join(__dirname, 'header', 'headerPreload.js'), contextIsolation: true, sandbox: true } });
  contentView = new BrowserView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: devMode } });
  mainWindow.addBrowserView(headerView);
  mainWindow.addBrowserView(contentView);
  bounds();
  headerView.webContents.loadFile(path.join(__dirname, 'header', 'header.html'));
  contentView.webContents.loadURL('https://vndb.org/');

  presenceService = new PresenceService(store);
  settingsManager = new SettingsManager(mainWindow);
  setupWindowControls();
  ipcMain.on('toggle-settings', () => settingsManager.toggle());
  ipcMain.handle('get-rpc-settings', () => ({
    discordRichPresence: Boolean(store.get('discordRichPresence', true)),
    discordShowArtwork: Boolean(store.get('discordShowArtwork', true)),
    discordShowButton: Boolean(store.get('discordShowButton', true)),
    discordShowCatalog: Boolean(store.get('discordShowCatalog', false)),
  }));
  ipcMain.on('set-rpc-setting', (_event, key: unknown, enabled: unknown) => {
    const allowedKeys = new Set(['discordRichPresence', 'discordShowArtwork', 'discordShowButton', 'discordShowCatalog']);
    if (typeof key !== 'string' || !allowedKeys.has(key) || typeof enabled !== 'boolean') return;
    if (key === 'discordRichPresence') presenceService.setEnabled(enabled);
    else store.set(key, enabled);
    void presenceService.update(lastPage);
  });
  ipcMain.handle('open-developer-link', async () => { await shell.openExternal('https://t.me/notslep'); return true; });

  const openSettingsOnF1 = (event: Event, input: Input) => {
    if (input.type === 'keyDown' && input.key === 'F1') {
      event.preventDefault();
      settingsManager.toggle();
    }
  };
  contentView.webContents.on('before-input-event', openSettingsOnF1);
  headerView.webContents.on('before-input-event', openSettingsOnF1);

  mainWindow.on('resize', bounds);
  contentView.webContents.on('did-start-loading', () => headerView.webContents.send('refresh-state-changed', true));
  contentView.webContents.on('did-stop-loading', () => { headerView.webContents.send('refresh-state-changed', false); sendNavigationState(); scanPage(); });
  contentView.webContents.on('did-navigate', () => { sendNavigationState(); scanPage(); });
  contentView.webContents.on('did-navigate-in-page', () => { sendNavigationState(); scanPage(); });
  headerView.webContents.on('did-finish-load', () => sendNavigationState());
  mainWindow.on('closed', () => { tray?.destroy(); tray = null; });
  setupTray();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => { mainWindow?.show(); mainWindow?.focus(); });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => { if (!isMac) app.quit(); });
  app.on('activate', () => { if (!mainWindow) createWindow(); else mainWindow.show(); });
  app.on('before-quit', () => presenceService?.clear());
}
