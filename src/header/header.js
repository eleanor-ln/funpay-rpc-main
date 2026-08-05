/* eslint-disable */
const ipcRenderer = {
    send: (channel, ...args) => window.headerAPI.send(channel, ...args),
    invoke: (channel, ...args) => window.headerAPI.invoke(channel, ...args),
    on: (channel, listener) => window.headerAPI.on(channel, (...args) => listener(null, ...args)),
};

const platform = window.headerAPI.platform;
let isMaximized = false;
let canGoBack = false;
let canGoForward = false;
let isRefreshing = false;

const glyphs = {
    minimize: '\uE921',
    maximize: '\uE922',
    restore: '\uE923',
    close: '\uE8BB',
};

function navigationState(state = {}) {
    if ('canGoBack' in state) canGoBack = state.canGoBack;
    if ('canGoForward' in state) canGoForward = state.canGoForward;
    document.getElementById('back-btn')?.classList.toggle('disabled', !canGoBack);
    document.getElementById('forward-btn')?.classList.toggle('disabled', !canGoForward);
}

function refreshState(refreshing) {
    isRefreshing = refreshing;
    const button = document.getElementById('refresh-btn');
    button?.classList.toggle('refreshing', refreshing);
    if (button) button.title = refreshing ? 'Cancel Refresh' : 'Refresh Page';
}

function updateWindowControls() {
    const minimizeGlyph = document.querySelector('#minimize-btn .icon-glyph');
    const button = document.getElementById('maximize-btn');
    const glyph = button?.querySelector('.icon-glyph');
    const closeGlyph = document.querySelector('#close-btn .icon-glyph');
    if (platform !== 'win32') return;
    if (minimizeGlyph) minimizeGlyph.textContent = glyphs.minimize;
    if (closeGlyph) closeGlyph.textContent = glyphs.close;
    if (!button || !glyph) return;
    glyph.textContent = isMaximized ? glyphs.restore : glyphs.maximize;
    button.title = isMaximized ? 'Restore' : 'Maximize';
    button.setAttribute('aria-label', button.title);
}

document.body.classList.add(`platform-${platform}`);

document.querySelector('.navigation-controls')?.addEventListener('click', (event) => {
    const id = event.target.closest('.nav-button')?.id;
    if (id === 'back-btn' && canGoBack) ipcRenderer.send('navigate-back');
    if (id === 'forward-btn' && canGoForward) ipcRenderer.send('navigate-forward');
    if (id === 'refresh-btn') {
        if (isRefreshing) ipcRenderer.send('cancel-refresh');
        else ipcRenderer.send('refresh-page');
    }
});

document.getElementById('minimize-btn')?.addEventListener('click', () => ipcRenderer.send('minimize-window'));
document.getElementById('maximize-btn')?.addEventListener('click', () => ipcRenderer.send('maximize-window'));
document.getElementById('close-btn')?.addEventListener('click', () => ipcRenderer.send('close-window'));
document.querySelector('.title-bar')?.addEventListener('dblclick', () => ipcRenderer.send('title-bar-double-click'));

ipcRenderer.on('navigation-state-changed', (_, state) => navigationState(state));
ipcRenderer.on('refresh-state-changed', (_, refreshing) => refreshState(refreshing));

document.addEventListener('DOMContentLoaded', () => {
    updateWindowControls();
    ipcRenderer.invoke('get-navigation-controls-enabled').then((enabled) => {
        document.querySelector('.navigation-controls')?.classList.toggle('visible', enabled);
    });
    setInterval(() => {
        ipcRenderer.invoke('is-maximized').then((maximized) => {
            if (isMaximized !== maximized) {
                isMaximized = maximized;
                updateWindowControls();
            }
        });
    }, 250);
});
