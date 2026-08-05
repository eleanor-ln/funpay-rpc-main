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
    const panelWidth = Math.min(380, Math.floor(width * 0.42));
    this.view.setBounds({ x: width - panelWidth, y: 32, width: panelWidth, height: height - 32 });
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
      :root { color-scheme: dark; --text: #f4f4f4; --muted: #9b9b9b; --panel: rgba(12, 12, 13, .94); --card: rgba(23, 23, 24, .94); --border: rgba(255, 255, 255, .1); --track: #101a2b; --track-on: #1d3658; --accent: #8dbdf2; }
      * { box-sizing: border-box; } html { background: #0b0b0c; } body { margin: 0; min-height: 100%; padding: 22px; background: var(--panel); backdrop-filter: blur(26px) saturate(110%); -webkit-backdrop-filter: blur(26px) saturate(110%); color: var(--text); font: 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; opacity: 0; transform: translateX(16px); transition: opacity .2s,transform .2s; border-left: 1px solid rgba(255, 255, 255, .1); } body.visible { opacity: 1; transform: translateX(0); }
      .close { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; color: var(--muted); font-size: 24px; cursor: pointer; } .close:hover { color: var(--text); } h1 { font-size: 18px; margin: 4px 0 22px; letter-spacing: .01em; } h2 { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin: 0 0 9px 3px; } .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 15px; box-shadow: 0 10px 30px rgba(0,0,0,.18); margin-bottom: 14px; } .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 28px; } .label { font-weight: 600; } .hint { color: var(--muted); font-size: 12px; line-height: 1.45; margin-top: 9px; }
      .setting + .setting { border-top: 1px solid rgba(130, 168, 207, .12); margin-top: 13px; padding-top: 13px; } .setting .label { font-weight: 500; } .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex: 0 0 auto; } .toggle input { opacity: 0; width: 0; height: 0; } .slider { position: absolute; inset: 0; border-radius: 24px; background: var(--track); border: 1px solid rgba(130, 168, 207, .25); cursor: pointer; transition: .2s; } .slider:before { content: ""; position: absolute; width: 18px; height: 18px; left: 2px; top: 2px; border-radius: 50%; background: #b7c9dc; transition: .2s; box-shadow: 0 1px 3px rgba(0,0,0,.4); } input:checked + .slider { background: var(--track-on); border-color: #2a629b; } input:checked + .slider:before { transform: translateX(20px); background: #eaf5ff; }
      .developer { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 38px; border: 1px solid rgba(121,185,255,.32); border-radius: 9px; color: var(--accent); background: rgba(10, 32, 58, .65); text-decoration: none; font-weight: 600; transition: background .2s,border-color .2s; } .developer:hover { background: rgba(22, 66, 111, .8); border-color: rgba(121,185,255,.65); }
    </style></head><body><button class="close" id="close" aria-label="Close">&times;</button><h1>Settings</h1><h2>Discord Rich Presence</h2><div class="card"><div class="setting"><div class="row"><span class="label">Enable Rich Presence</span><label class="toggle"><input id="discordRichPresence" type="checkbox"><span class="slider"></span></label></div><div class="hint">Show your VNDB activity in Discord.</div></div><div class="setting"><div class="row"><span class="label">Show novel cover</span><label class="toggle"><input id="discordShowArtwork" type="checkbox"><span class="slider"></span></label></div></div><div class="setting"><div class="row"><span class="label">Show VNDB button</span><label class="toggle"><input id="discordShowButton" type="checkbox"><span class="slider"></span></label></div></div><div class="setting"><div class="row"><span class="label">Show while browsing catalog</span><label class="toggle"><input id="discordShowCatalog" type="checkbox"><span class="slider"></span></label></div></div></div><a class="developer" href="#" id="developer">Developer</a><script>
      const api = window.settingsAPI; const ids = ['discordRichPresence','discordShowArtwork','discordShowButton','discordShowCatalog'];
      api.getSettings().then(settings => ids.forEach(id => { const input = document.getElementById(id); input.checked = Boolean(settings[id]); }));
      ids.forEach(id => document.getElementById(id).addEventListener('change', event => api.setSetting(id, event.target.checked)));
      document.getElementById('close').addEventListener('click', () => api.close()); document.getElementById('developer').addEventListener('click', event => { event.preventDefault(); api.openDeveloperLink(); });
    </script></body></html>`;
  }
}
