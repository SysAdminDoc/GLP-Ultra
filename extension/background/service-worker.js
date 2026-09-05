/**
 * GLP Ultra service worker: context menu entry points, network ad-blocking toggle,
 * and per-tab action state.
 */

const RULESET_ID = 'glp-ad-network';
const NETWORK_BLOCK_KEY = 'glpNetworkAdBlock';
const WATCHER_ALARM = 'glp-ultra-watcher';
const WATCHER_SETTINGS_KEY = 'glpEnhancedSettings';

const GLP_PAGES = ['*://*.godlikeproductions.com/*'];

// Chrome never applies `update_url` to an extension loaded unpacked, and unpacked is the only way
// this one is installed, so an extension user is frozen at whatever they extracted with nothing to
// tell them otherwise. The userscript build has `@updateURL` and updates itself; this is the
// equivalent for the extension lane.
//
// Data, never code: the response is a release tag, which is compared against the running version.
// Nothing is downloaded or executed. The host permission is optional and unrequested until the
// reader turns the check on, so an install that never opts in makes no network request at all.
const RELEASES_API = 'https://api.github.com/repos/SysAdminDoc/GLP-Ultra/releases/latest';
const RELEASE_HOST = { origins: ['https://api.github.com/*'] };
const UPDATE_STATE_KEY = 'glpUpdateState';
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** [3, 8, 3] from "v3.8.3" or "3.8.3". Anything unparseable becomes an empty list, which loses. */
function versionParts(value) {
    return String(value || '').trim().replace(/^v/i, '').split('.')
        .map(part => Number.parseInt(part, 10))
        .filter(part => Number.isFinite(part));
}

function isNewerVersion(candidate, current) {
    const left = versionParts(candidate);
    const right = versionParts(current);
    if (!left.length) return false;
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
        const a = left[i] || 0;
        const b = right[i] || 0;
        if (a !== b) return a > b;
    }
    return false;
}

async function readUpdateState() {
    const stored = await chrome.storage.local.get(UPDATE_STATE_KEY);
    const state = stored[UPDATE_STATE_KEY];
    return state && typeof state === 'object' ? state : {};
}

/**
 * Returns the current state without touching the network unless a check is actually due.
 * `force` is the reader pressing the button; it still requires the permission.
 */
async function checkForUpdate({ force = false } = {}) {
    const current = chrome.runtime.getManifest().version;
    const granted = await chrome.permissions.contains(RELEASE_HOST);
    const previous = await readUpdateState();

    if (!granted) {
        const state = { granted: false, current, checkedAt: previous.checkedAt || 0, latest: previous.latest || '' };
        await chrome.storage.local.set({ [UPDATE_STATE_KEY]: state });
        return { ...state, updateAvailable: false };
    }

    const due = force || !previous.checkedAt || (Date.now() - previous.checkedAt) > UPDATE_INTERVAL_MS;
    if (!due) {
        return { ...previous, granted: true, current, updateAvailable: isNewerVersion(previous.latest, current) };
    }

    let latest = previous.latest || '';
    let error = '';
    try {
        const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
        const payload = await response.json();
        latest = String(payload.tag_name || '').trim();
    } catch (failure) {
        error = String(failure && failure.message ? failure.message : failure);
    }

    const state = { granted: true, current, latest, checkedAt: Date.now(), error };
    await chrome.storage.local.set({ [UPDATE_STATE_KEY]: state });
    return { ...state, updateAvailable: isNewerVersion(latest, current) };
}

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
//
// This lives in chrome.storage.session rather than a module-scope Map because MV3 terminates the
// worker after 30 seconds idle and takes module state with it. A Map here loses every unread
// count the first time the user pauses, and the badge silently drops back to "on".
const WATCH_COUNTS_KEY = 'glpWatchCounts';

async function readWatchCounts() {
    const stored = await chrome.storage.session.get(WATCH_COUNTS_KEY);
    const counts = stored[WATCH_COUNTS_KEY];
    return counts && typeof counts === 'object' ? counts : {};
}

// Reading, mutating and writing the counts is three awaits long, so two overlapping messages
// would both read the same starting object and the second write would drop the first tab's
// entry. Painting has the same problem in reverse: two paints for one tab can resolve out of
// order and leave the stale text showing. One queue orders every badge operation. It is module
// state, which the worker loses on restart, and that is correct: it orders work in flight, while
// the counts themselves live in session storage.
let badgeQueue = Promise.resolve();

function queueBadgeWork(work) {
    const result = badgeQueue.then(work);
    // The queue must survive a failed step, but the caller has to be able to see that failure.
    // Returning the already-caught chain made every rejection invisible and left the onMessage
    // error branch unreachable, so a failed storage write still answered { ok: true }.
    badgeQueue = result.catch(() => {});
    return result;
}

function setWatchCount(tabId, count) {
    return queueBadgeWork(async () => {
        const counts = await readWatchCounts();
        if (count > 0) counts[tabId] = count;
        else delete counts[tabId];
        await chrome.storage.session.set({ [WATCH_COUNTS_KEY]: counts });
    });
}

function paintBadge(tabId, onGLP) {
    return queueBadgeWork(async () => {
        const counts = await readWatchCounts();
        const unread = counts[tabId] || 0;
        const text = unread > 0 ? String(unread) : (onGLP ? 'on' : '');
        chrome.action.setBadgeText({ tabId, text }, () => void chrome.runtime.lastError);
        chrome.action.setBadgeBackgroundColor({ tabId, color: unread > 0 ? '#e6a820' : '#4a90d9' },
            () => void chrome.runtime.lastError);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'glp:update-state') {
        checkForUpdate({ force: message.force === true })
            .then(state => sendResponse({ ok: true, state }))
            .catch(error => sendResponse({ ok: false, error: String(error) }));
        return true;
    }
    if (message && message.type === 'glp:network-block-state') {
        syncNetworkBlocking().then(enabled => sendResponse({ ok: true, enabled }));
        return true;
    }
    if (message && message.type === 'glp:watch-count' && sender.tab && sender.tab.id != null) {
        const tabId = sender.tab.id;
        // A content script can still be running while its tab navigates away, and a count that
        // lands after the tab-update handler has cleared it resurrects a stale badge for a page
        // that is no longer GLP. The sender carries its own URL, and this extension only holds
        // host permission for GLP, so an absent one means the report is no longer welcome.
        if (!isGLPUrl(sender.tab.url)) {
            sendResponse({ ok: false, reason: 'sender is no longer on GLP' });
            return false;
        }
        const count = Number(message.count) || 0;
        setWatchCount(tabId, count)
            .then(() => paintBadge(tabId, true))
            .then(() => sendResponse({ ok: true }))
            .catch(error => sendResponse({ ok: false, error: String(error) }));
        return true;
    }
    return false;
});

function isGLPUrl(url) {
    return typeof url === 'string' && url.includes('godlikeproductions.com');
}

// Keep the toolbar button quiet on unrelated sites.
//
// `tab.url` is only populated for URLs this extension holds host permission for, and the only
// hosts it asks for are the two GLP ones. So off-GLP the field is absent, and the old
// `if (!tab.url) return` treated "not our site" as "unknown" and left the previous tab's unread
// count sitting on the toolbar for every other site the user visited in that tab. An absent URL
// is the definitive off-GLP signal here, not a reason to skip.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (!info.status) return;
    const onGLP = isGLPUrl(tab && tab.url);
    const done = onGLP ? Promise.resolve() : setWatchCount(tabId, 0);
    done.then(() => paintBadge(tabId, onGLP)).catch(() => {});
});

chrome.tabs.onRemoved.addListener(tabId => { setWatchCount(tabId, 0).catch(() => {}); });
