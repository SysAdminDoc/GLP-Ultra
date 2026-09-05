/**
 * Paints this extension page with the palette the user picked for the site. Without it the
 * options page and popup stay blue while the forum is green, which reads as two products.
 */
function applyPageTheme(themeName) {
    const palettes = (window.GLP_SCHEMA && window.GLP_SCHEMA.palettes) || {};
    const palette = palettes[themeName] || palettes.midnight;
    if (!palette) return;
    const rgb = hex => {
        const value = String(hex || '').replace('#', '');
        const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
        const int = parseInt(full, 16);
        if (!Number.isFinite(int) || full.length !== 6) return '74,144,217';
        return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
    };
    const root = document.documentElement.style;
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-rgb', rgb(palette.accent));
    root.setProperty('--link', palette.link);
    root.setProperty('--bg', palette.bg);
}

/* GLP Ultra popup: quick control over the settings the engine reads from chrome.storage.local. */

/**
 * Shows whether a newer release exists, and offers to turn the check on.
 *
 * The host permission is optional and is requested from this click, because Chrome only grants one
 * from a user gesture in an extension page. Until it is granted nothing is fetched, so an install
 * that never presses this makes no network request at all.
 */
async function renderUpdateRow(row, text, link, button) {
    if (!row) return null;
    const response = await chrome.runtime.sendMessage({ type: 'glp:update-state' })
        .catch(() => null);
    const state = response && response.ok ? response.state : null;
    if (!state) {
        row.hidden = true;
        return null;
    }

    if (state.updateAvailable) {
        row.hidden = false;
        text.textContent = `Version ${state.latest} is available. You are on ${state.current}.`;
        link.href = 'https://github.com/SysAdminDoc/GLP-Ultra/releases/latest';
        link.hidden = false;
    } else if (state.granted && state.error) {
        row.hidden = false;
        text.textContent = `Could not check for updates: ${state.error}`;
        link.hidden = true;
    } else {
        row.hidden = true;
    }

    if (button) {
        button.textContent = state.granted ? 'Check for updates' : 'Turn on update checks';
    }
    return state;
}

async function requestUpdateCheck(row, text, link, button) {
    const granted = await chrome.permissions.request({ origins: ['https://api.github.com/*'] })
        .catch(() => false);
    if (!granted) {
        row.hidden = false;
        text.textContent = 'Update checks stay off until access to the releases page is allowed.';
        link.hidden = true;
        return;
    }
    await chrome.runtime.sendMessage({ type: 'glp:update-state', force: true }).catch(() => null);
    const state = await renderUpdateRow(row, text, link, button);
    if (state && !state.updateAvailable && !state.error) {
        row.hidden = false;
        text.textContent = `You are on the latest version (${state.current}).`;
        link.hidden = true;
    }
}


const SETTINGS_KEY = 'glpEnhancedSettings';
const NETWORK_BLOCK_KEY = 'glpNetworkAdBlock';

const QUICK_TOGGLES = [
    { key: 'removeAds', label: 'Remove ads', help: 'Ad slots, widgets, and AMP embeds.' },
    { key: 'readerMode', label: 'Reader mode', help: 'Distraction-free thread reading.' },
    { key: 'hideMemeReplies', label: 'Hide image-only replies', help: 'Drops low-effort reaction posts.' },
    { key: 'hidePinnedThreads', label: 'Hide pinned threads', help: 'Keeps the feed chronological.' },
    { key: 'infiniteScroll', label: 'Infinite scroll', help: 'Auto-loads the next forum page.' },
    { key: 'hideBoomerGifs', label: 'Hide reaction GIFs', help: 'Blocks the /sm/ animated smilies.' }
];

let settings = {};

function setStatus(message) {
    const el = document.getElementById('status');
    if (!message) {
        el.hidden = true;
        el.textContent = '';
        return;
    }
    el.hidden = false;
    el.textContent = message;
}

async function readSettings() {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    try {
        applyPageTheme(JSON.parse(stored[SETTINGS_KEY] || '{}').colorTheme);
    } catch (e) {
        applyPageTheme('midnight');
    }
    const raw = stored[SETTINGS_KEY];
    if (typeof raw !== 'string') return {};
    try {
        return JSON.parse(raw);
    } catch (e) {
        return {};
    }
}

async function activeGLPTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab && tab.url && tab.url.includes('godlikeproductions.com') ? tab : null;
}

async function patch(changes) {
    settings = { ...settings, ...changes };
    await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(settings) });

    const tab = await activeGLPTab();
    if (tab) {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:patch-settings', patch: changes }, () => void chrome.runtime.lastError);
    }
}

function renderQuickToggles() {
    const list = document.getElementById('quick-toggles');
    list.replaceChildren();

    QUICK_TOGGLES.forEach(item => {
        const li = document.createElement('li');

        const label = document.createElement('label');
        label.htmlFor = `toggle-${item.key}`;

        const name = document.createElement('span');
        name.className = 'label';
        name.textContent = item.label;

        const help = document.createElement('span');
        help.className = 'help';
        help.textContent = item.help;

        label.append(name, help);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `toggle-${item.key}`;
        input.checked = !!settings[item.key];
        input.addEventListener('change', () => patch({ [item.key]: input.checked }));

        li.append(label, input);
        list.appendChild(li);
    });
}

async function init() {
    settings = await readSettings();

    const master = document.getElementById('master-toggle');
    master.checked = settings.enabled !== false;
    master.addEventListener('change', () => patch({ enabled: master.checked }));

    // Deliberately not part of the quick-toggle list: this is the way back when the page's own
    // controls have been styled out of existence, so it must be present whatever else is.
    const safeMode = document.getElementById('safe-mode');
    safeMode.checked = settings.safeMode === true;
    safeMode.addEventListener('change', () => patch({ safeMode: safeMode.checked }));

    const theme = document.getElementById('theme-select');
    theme.value = settings.colorTheme || 'midnight';
    theme.addEventListener('change', () => patch({ colorTheme: theme.value }));

    renderQuickToggles();

    const stored = await chrome.storage.local.get(NETWORK_BLOCK_KEY);
    const networkBlock = document.getElementById('network-block');
    networkBlock.checked = stored[NETWORK_BLOCK_KEY] !== false;
    networkBlock.addEventListener('change', () => {
        chrome.storage.local.set({ [NETWORK_BLOCK_KEY]: networkBlock.checked });
    });

    document.getElementById('open-options').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    const panelBtn = document.getElementById('open-panel');
    const tab = await activeGLPTab();
    const version = document.getElementById('version-line');

    const updateRow = document.getElementById('update-row');
    const updateText = document.getElementById('update-text');
    const updateLink = document.getElementById('update-link');
    const updateButton = document.getElementById('check-updates');
    renderUpdateRow(updateRow, updateText, updateLink, updateButton);
    if (updateButton) {
        updateButton.addEventListener('click', () =>
            requestUpdateCheck(updateRow, updateText, updateLink, updateButton));
    }

    if (!tab) {
        panelBtn.disabled = true;
        version.textContent = `v${chrome.runtime.getManifest().version} - open a GLP page`;
        setStatus('Not on Godlike Productions. Toggles still save and apply on your next visit.');
        return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'glp:ping' }, response => {
        if (chrome.runtime.lastError || !response || !response.ok) {
            version.textContent = `v${chrome.runtime.getManifest().version} - engine idle`;
            setStatus('Engine has not loaded in this tab yet. Reload the page.');
            panelBtn.disabled = true;
            return;
        }
        version.textContent = `v${response.version} - active on this tab`;
    });

    panelBtn.addEventListener('click', () => {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:open-settings' }, () => void chrome.runtime.lastError);
        window.close();
    });
}

init();
