/**
 * GLP Ultra service worker: context menu entry points, network ad-blocking toggle,
 * and per-tab action state.
 */

const RULESET_ID = 'glp-ad-network';
const NETWORK_BLOCK_KEY = 'glpNetworkAdBlock';

function createMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'glp-open-settings',
            title: 'GLP Ultra settings',
            contexts: ['page', 'frame'],
            documentUrlPatterns: ['*://*.godlikeproductions.com/*']
        });
        chrome.contextMenus.create({
            id: 'glp-open-options',
            title: 'All GLP Ultra options',
            contexts: ['action']
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

chrome.runtime.onInstalled.addListener(details => {
    createMenus();
    syncNetworkBlocking();
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
});

chrome.runtime.onStartup.addListener(() => {
    createMenus();
    syncNetworkBlocking();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'glp-open-settings' && tab && tab.id != null) {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:open-settings' }, () => void chrome.runtime.lastError);
    } else if (info.menuItemId === 'glp-open-options') {
        chrome.runtime.openOptionsPage();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[NETWORK_BLOCK_KEY]) syncNetworkBlocking();
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
