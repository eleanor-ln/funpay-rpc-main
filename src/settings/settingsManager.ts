import { BrowserView, BrowserWindow } from 'electron';
import { join } from 'path';

export class SettingsManager {
  private view: BrowserView | null = null;
  private visible = false;

  constructor(private readonly parent: BrowserWindow) {
    this.parent.on('resize', () => this.updateBounds());
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  private ensureView(): BrowserView {
    if (this.view) return this.view;
    this.view = new BrowserView({
      webPreferences: {
        preload: join(__dirname, 'settingsPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.parent.addBrowserView(this.view);
    this.view.webContents.loadURL(`data:text/html,${encodeURIComponent(this.html())}`);
    return this.view;
  }

  private updateBounds(): void {
    if (!this.view || !this.visible) return;
    const { width, height } = this.parent.getContentBounds();
    const panelWidth = Math.min(420, Math.floor(width * 0.46));
    this.view.setBounds({ x: width - panelWidth, y: 32, width: panelWidth, height: Math.max(1, height - 32) });
  }

  private show(): void {
    const view = this.ensureView();
    this.visible = true;
    this.updateBounds();
    const reveal = () => view.webContents.executeJavaScript("document.body.classList.add('visible');").catch(() => undefined);
    if (view.webContents.isLoading()) view.webContents.once('did-finish-load', reveal);
    else reveal();
  }

  private hide(): void {
    if (!this.view) return;
    this.visible = false;
    this.view.webContents.executeJavaScript("document.body.classList.remove('visible');").catch(() => undefined);
    this.view.setBounds({ x: 0, y: -10000, width: 0, height: 0 });
  }

  private html(): string {
    return `<!doctype html><html><head><meta charset="UTF-8"><style>
       :root { color-scheme: dark; --text: #fff; --muted: #d7dce5; --accent: #fff; --border: rgba(121,185,255,.24); --track: rgba(255,255,255,.12); --track-on: rgba(44,105,166,.8); } body, button, select, option { color: #fff; } option { background: #111820; } .tool-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; } .tool-row + .tool-row { border-top: 1px solid rgba(130, 168, 207, .12); margin-top: 14px; padding-top: 14px; } .tool-button { flex: 0 0 auto; border: 1px solid rgba(121,185,255,.32); border-radius: 7px; padding: 7px 12px; color: #fff; background: rgba(10, 32, 58, .65); cursor: pointer; } .tool-button:hover { background: rgba(22, 66, 111, .8); }
       .tool-button:disabled { cursor: not-allowed; opacity: .45; }
       * { box-sizing: border-box; } html { min-height: 100%; background: transparent; } body { margin: 0; min-height: 100%; padding: 22px; overflow-y: auto; background: linear-gradient(135deg, rgba(8, 12, 18, .86), rgba(18, 20, 27, .76)); backdrop-filter: blur(30px) saturate(120%); -webkit-backdrop-filter: blur(30px) saturate(120%); color: var(--text); font: 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; opacity: 0; transform: translateX(16px); transition: opacity .2s,transform .2s; border-left: 1px solid rgba(255, 255, 255, .1); box-shadow: -18px 0 40px rgba(0, 0, 0, .22); } body.visible { opacity: 1; transform: translateX(0); }
       .close { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; color: var(--muted); font-size: 24px; cursor: pointer; } .close:hover { color: var(--text); } h1 { font-size: 18px; margin: 4px 0 22px; letter-spacing: .01em; } h2 { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin: 0 0 9px 3px; } .card { background: rgba(18, 22, 29, .72); border: 1px solid var(--border); border-radius: 12px; padding: 15px; box-shadow: 0 10px 30px rgba(0,0,0,.28); margin-bottom: 14px; } .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 28px; } .label { font-weight: 600; } .hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin-top: 9px; }
       .setting + .setting { border-top: 1px solid rgba(130, 168, 207, .12); margin-top: 13px; padding-top: 13px; } .setting .label { font-weight: 500; } .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex: 0 0 auto; } .toggle input { opacity: 0; width: 0; height: 0; } .slider { position: absolute; inset: 0; border-radius: 24px; background: var(--track); border: 1px solid rgba(130, 168, 207, .25); cursor: pointer; transition: .2s; } .slider:before { content: ""; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px; border-radius: 50%; background: #b7c9dc; transition: .2s; box-shadow: 0 1px 3px rgba(0,0,0,.4); } input:checked + .slider { background: var(--track-on); border-color: #2a629b; } input:checked + .slider:before { transform: translateX(20px); background: #eaf5ff; } .test-notification { margin-top: 10px; border: 1px solid rgba(121,185,255,.32); border-radius: 7px; padding: 7px 9px; color: var(--accent); background: rgba(10, 32, 58, .65); cursor: pointer; } .test-notification:hover { background: rgba(22, 66, 111, .8); } .test-notification:disabled { cursor: wait; opacity: .6; } .test-result { min-height: 17px; margin-top: 7px; color: var(--muted); font-size: 12px; }
      .file-setting + .file-setting { border-top: 1px solid rgba(130, 168, 207, .12); margin-top: 15px; padding-top: 15px; } .file-title { font-weight: 600; margin-bottom: 7px; } .file-path { color: var(--muted); background: rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.08); border-radius: 7px; padding: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; font-size: 12px; } .file-select { width: 100%; color: var(--text); background: rgba(0,0,0,.3); border: 1px solid rgba(121,185,255,.25); border-radius: 7px; padding: 8px; margin-bottom: 8px; } .file-actions { display: flex; flex-wrap: wrap; gap: 7px; } .file-actions button { border: 1px solid rgba(121,185,255,.32); border-radius: 7px; padding: 7px 9px; color: var(--accent); background: rgba(10, 32, 58, .65); cursor: pointer; } .file-actions button:hover { background: rgba(22, 66, 111, .8); } .file-actions .clear { color: var(--muted); border-color: rgba(255,255,255,.13); background: transparent; }
       .developer { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 38px; border: 1px solid rgba(121,185,255,.32); border-radius: 9px; color: var(--accent); background: rgba(10, 32, 58, .65); text-decoration: none; font-weight: 600; transition: background .2s,border-color .2s; } .developer + .developer { margin-top: 8px; } .developer:hover { background: rgba(22, 66, 111, .8); border-color: rgba(121,185,255,.65); }
    </style></head><body><button class="close" id="close" aria-label="Close">&times;</button><h1>Settings</h1><h2>Discord RPC</h2><div class="card"><div class="setting"><div class="row"><span class="label">Enable Rich Presence</span><label class="toggle"><input id="discordRichPresence" type="checkbox"><span class="slider"></span></label></div><div class="hint">Show your FunPay activity in Discord.</div></div></div><h2>Styles and sounds</h2><div class="card"><div class="file-setting"><div class="file-title">FunPay CSS theme</div><select class="file-select" id="themeSelect"><option value="">Not selected</option></select><div class="file-actions"><button id="refreshThemes" type="button">Refresh</button><button id="openThemes" type="button">Open folder</button><button class="clear" id="clearTheme" type="button">Reset</button></div><div class="hint">Put .css files in the themes folder, then press Refresh.</div></div><div class="file-setting"><div class="file-title">Notification sound</div><select class="file-select" id="soundSelect"><option value="">Not selected</option></select><div class="file-actions"><button id="refreshSounds" type="button">Refresh</button><button id="openSounds" type="button">Open folder</button><button class="clear" id="clearSound" type="button">Reset</button></div><div class="hint">Put audio files in the sounds folder, then press Refresh.</div></div></div><h2>Notifications</h2><div class="card"><div class="setting"><div class="row"><span class="label">Play notification sounds</span><label class="toggle"><input id="notificationSoundEnabled" type="checkbox"><span class="slider"></span></label></div></div><div class="setting"><div class="row"><span class="label">Show Windows notifications</span><label class="toggle"><input id="desktopNotificationsEnabled" type="checkbox"><span class="slider"></span></label></div><div class="hint">Shows the sender nickname and message text.</div><button class="test-notification" id="testNotification" type="button">Test notification</button><div class="test-result" id="testNotificationResult" role="status"></div></div></div><a class="developer" href="#" id="developer">FunPay.com</a><a class="developer" href="#" id="eleanorMay">EleanorMay</a><script>
      const api = window.settingsAPI; const stylusButton = document.createElement('button'); stylusButton.textContent = 'Open Stylus theme manager'; stylusButton.style.cssText = 'width:100%;margin:-8px 0 18px;min-height:38px;border:1px solid rgba(121,185,255,.32);border-radius:9px;color:#fff;background:rgba(10,32,58,.65);font-weight:600;cursor:pointer'; stylusButton.onclick = () => api.openStylusManager(); document.body.insertBefore(stylusButton, document.querySelector('h2'));
       const toolsHeading = document.createElement('h2'); toolsHeading.textContent = 'FunPay tools'; const toolsCard = document.createElement('div'); toolsCard.className = 'card'; toolsCard.innerHTML = '<div class="tool-row"><div><div class="file-title">Foxen</div><div class="hint">Disabled by default. Enable it to apply Foxen features to FunPay.</div></div><label class="toggle"><input id="foxenEnabled" type="checkbox"><span class="slider"></span></label></div><div class="tool-row"><div><div class="file-title">Foxen panel</div><div class="hint">Open the Foxen tools panel when the extension is enabled.</div></div><button class="tool-button" id="openFoxen" type="button">Open</button></div>'; const firstHeading = document.querySelector('h2'); document.body.insertBefore(toolsHeading, firstHeading); document.body.insertBefore(toolsCard, firstHeading);
       document.getElementById('openFoxen').addEventListener('click', () => api.openBundledExtension());
       const ids = ['discordRichPresence','notificationSoundEnabled','desktopNotificationsEnabled'];
      function renderFiles(selectId, files, selected) {
        const select = document.getElementById(selectId); select.innerHTML = '<option value="">Not selected</option>';
        (files || []).forEach(file => { const option = document.createElement('option'); option.value = file.path; option.textContent = file.name; select.appendChild(option); });
        if (selected && !Array.from(select.options).some(option => option.value === selected)) { const option = document.createElement('option'); option.value = selected; option.textContent = selected.split(/[\\/]/).pop() + ' (external)'; select.appendChild(option); }
        select.value = selected || '';
      }
      function updateSettings(settings) {
        ids.forEach(id => { const input = document.getElementById(id); input.checked = Boolean(settings[id]); });
        const foxenEnabled = document.getElementById('foxenEnabled'); foxenEnabled.checked = Boolean(settings.foxenEnabled); document.getElementById('openFoxen').disabled = !foxenEnabled.checked;
        renderFiles('themeSelect', settings.themeFiles, settings.customThemePath);
        renderFiles('soundSelect', settings.soundFiles, settings.notificationSoundPath);
      }
      api.getSettings().then(updateSettings);
      ids.forEach(id => document.getElementById(id).addEventListener('change', event => api.setSetting(id, event.target.checked)));
      document.getElementById('foxenEnabled').addEventListener('change', async event => { const input = event.currentTarget; input.disabled = true; try { updateSettings(await api.setFoxenEnabled(input.checked)); } finally { input.disabled = false; } });
      document.getElementById('themeSelect').addEventListener('change', event => { if (event.target.value) api.selectCustomFile('theme', event.target.value).then(updateSettings); else api.clearCustomFile('customThemePath').then(updateSettings); });
      document.getElementById('soundSelect').addEventListener('change', event => { if (event.target.value) api.selectCustomFile('sound', event.target.value).then(updateSettings); else api.clearCustomFile('notificationSoundPath').then(updateSettings); });
      document.getElementById('refreshThemes').addEventListener('click', () => api.refreshCustomFiles().then(updateSettings));
      document.getElementById('refreshSounds').addEventListener('click', () => api.refreshCustomFiles().then(updateSettings));
      document.getElementById('openThemes').addEventListener('click', () => api.openCustomFolder('theme'));
      document.getElementById('openSounds').addEventListener('click', () => api.openCustomFolder('sound'));
      document.getElementById('clearTheme').addEventListener('click', () => api.clearCustomFile('customThemePath').then(updateSettings));
      document.getElementById('clearSound').addEventListener('click', () => api.clearCustomFile('notificationSoundPath').then(updateSettings));
      document.getElementById('close').addEventListener('click', () => api.close()); document.getElementById('developer').addEventListener('click', event => { event.preventDefault(); api.openDeveloperLink(); }); document.getElementById('eleanorMay').addEventListener('click', event => { event.preventDefault(); api.openEleanorMayLink(); });
      document.getElementById('testNotification').addEventListener('click', async event => { const button = event.currentTarget; const result = document.getElementById('testNotificationResult'); button.disabled = true; result.textContent = 'Sending...'; try { const response = await api.testWindowsNotification(); result.textContent = response?.shown ? 'Test notification sent.' : (response?.reason || 'Notifications are unavailable.'); } catch { result.textContent = 'Could not test notifications.'; } finally { button.disabled = false; } });
    </script></body></html>`;
  }
}
