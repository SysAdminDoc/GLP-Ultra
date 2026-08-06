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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'glp:network-block-state') {
        syncNetworkBlocking().then(enabled => sendResponse({ ok: true, enabled }));
        return true;
    }
    return false;
});

// Keep the toolbar button quiet on unrelated sites.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (!info.status || !tab.url) return;
    const onGLP = tab.url.includes('godlikeproductions.com');
    chrome.action.setBadgeText({ tabId, text: onGLP ? 'on' : '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#4a90d9' });
});
