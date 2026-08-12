/**
 * GLP Ultra service worker: context menu entry points, network ad-blocking toggle,
 * and per-tab action state.
 */

const RULESET_ID = 'glp-ad-network';
const NETWORK_BLOCK_KEY = 'glpNetworkAdBlock';
const WATCHER_ALARM = 'glp-ultra-watcher';
const WATCHER_SETTINGS_KEY = 'glpEnhancedSettings';

const GLP_PAGES = ['*://*.godlikeproductions.com/*'];

// Each entry maps a menu item to the engine action it runs. The engine resolves what the
// right-click landed on itself - MV3 hands the worker a URL at most, never the element.
const CONTEXT_ACTIONS = [
    { id: 'glp-hide-thread', title: 'Hide this thread', action: 'hide-thread', contexts: ['page', 'link'] },
    { id: 'glp-mute-user', title: 'Mute this user', action: 'mute-user', contexts: ['page', 'link'] },
    { id: 'glp-tag-user', title: 'Tag this user', action: 'tag-user', contexts: ['page', 'link'] },
    { id: 'glp-preview-media', title: 'Preview this image', action: 'preview-media', contexts: ['image'] },
    { id: 'glp-export-thread', title: 'Export this thread (Markdown)', action: 'export-thread', contexts: ['page'] }
];

const MENU_IDS = ['glp-open-settings', 'glp-open-options', ...CONTEXT_ACTIONS.map(entry => entry.id)];
// Read by the runtime harness: a menu that fails to register is otherwise invisible.
self.GLP_MENU_IDS = MENU_IDS;

function createMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'glp-open-settings',
            title: 'GLP Ultra settings',
            contexts: ['page', 'frame'],
            documentUrlPatterns: GLP_PAGES
        });
        chrome.contextMenus.create({
            id: 'glp-open-options',
            title: 'All GLP Ultra options',
            contexts: ['action']
        });
        CONTEXT_ACTIONS.forEach(entry => {
            chrome.contextMenus.create({
                id: entry.id,
                title: entry.title,
                contexts: entry.contexts,
                documentUrlPatterns: GLP_PAGES
            });
        });
    });
}

async function syncNetworkBlocking() {
    const stored = await chrome.storage.local.get(NETWORK_BLOCK_KEY);
    const enabled = stored[NETWORK_BLOCK_KEY] !== false;
    await chrome.declarativeNetRequest.updateEnabledRulesets(
        enabled
            ? { enableRulesetIds: [RULESET_ID] }
            : { disableRulesetIds: [RULESET_ID] }
    );
    return enabled;
}

async function syncWatcherAlarm() {
    const stored = await chrome.storage.local.get(WATCHER_SETTINGS_KEY);
    let settings = {};
    try {
        settings = JSON.parse(stored[WATCHER_SETTINGS_KEY] || '{}');
    } catch (error) {
        settings = {};
    }

    await chrome.alarms.clear(WATCHER_ALARM);
    if (settings.watcherEnabled !== true) return false;

    const minutes = Math.max(5, Number(settings.watcherIntervalMinutes) || 15);
    await chrome.alarms.create(WATCHER_ALARM, { periodInMinutes: minutes });
    return true;
}

async function runWatcherAlarm() {
    const tabs = await chrome.tabs.query({ url: GLP_PAGES });
    await Promise.all(tabs
        .filter(tab => tab.id != null)
        .map(tab => new Promise(resolve => {
            chrome.tabs.sendMessage(tab.id, { type: 'glp:watch-check' }, () => {
                void chrome.runtime.lastError;
                resolve();
            });
        })));
}

chrome.runtime.onInstalled.addListener(details => {
    createMenus();
    syncNetworkBlocking();
    syncWatcherAlarm();
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
});

chrome.runtime.onStartup.addListener(() => {
    createMenus();
    syncNetworkBlocking();
    syncWatcherAlarm();
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === WATCHER_ALARM) runWatcherAlarm().catch(() => {});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'glp-open-settings' && tab && tab.id != null) {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:open-settings' }, () => void chrome.runtime.lastError);
        return;
    }
    if (info.menuItemId === 'glp-open-options') {
        chrome.runtime.openOptionsPage();
        return;
    }

    const entry = CONTEXT_ACTIONS.find(item => item.id === info.menuItemId);
    if (!entry || !tab || tab.id == null) return;
    chrome.tabs.sendMessage(tab.id, {
        type: 'glp:context-action',
        action: entry.action,
        payload: { linkUrl: info.linkUrl || '', srcUrl: info.srcUrl || '', pageUrl: info.pageUrl || '' }
    }, () => void chrome.runtime.lastError);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes[NETWORK_BLOCK_KEY]) syncNetworkBlocking();
    if (changes[WATCHER_SETTINGS_KEY]) syncWatcherAlarm();
});

// Tabs that reported a watched-thread unread count keep it on the badge; the plain
// "on" marker is only for GLP tabs that have nothing to report.
const watchCounts = new Map();

function paintBadge(tabId, onGLP) {
    const unread = watchCounts.get(tabId) || 0;
    const text = unread > 0 ? String(unread) : (onGLP ? 'on' : '');
    chrome.action.setBadgeText({ tabId, text }, () => void chrome.runtime.lastError);
    chrome.action.setBadgeBackgroundColor({ tabId, color: unread > 0 ? '#e6a820' : '#4a90d9' },
        () => void chrome.runtime.lastError);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'glp:network-block-state') {
        syncNetworkBlocking().then(enabled => sendResponse({ ok: true, enabled }));
        return true;
    }
    if (message && message.type === 'glp:watch-count' && sender.tab && sender.tab.id != null) {
        const count = Number(message.count) || 0;
        if (count > 0) watchCounts.set(sender.tab.id, count);
        else watchCounts.delete(sender.tab.id);
        paintBadge(sender.tab.id, true);
        sendResponse({ ok: true });
        return false;
    }
    return false;
});

// Keep the toolbar button quiet on unrelated sites.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (!info.status || !tab.url) return;
    const onGLP = tab.url.includes('godlikeproductions.com');
    if (!onGLP) watchCounts.delete(tabId);
    paintBadge(tabId, onGLP);
});

chrome.tabs.onRemoved.addListener(tabId => watchCounts.delete(tabId));
