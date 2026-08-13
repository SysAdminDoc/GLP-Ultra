/** Keep the extension surfaces in the same palette as the injected forum UI. */
function applyPageTheme(themeName) {
    const palettes = (window.GLP_SCHEMA && window.GLP_SCHEMA.palettes) || {};
    const palette = palettes[themeName] || palettes.midnight;
    if (!palette) return;
    const rgb = hex => {
        const value = String(hex || '').replace('#', '');
        const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
        const number = parseInt(full, 16);
        if (!Number.isFinite(number) || full.length !== 6) return '74,144,217';
        return ((number >> 16) & 255) + ',' + ((number >> 8) & 255) + ',' + (number & 255);
    };
    const root = document.documentElement.style;
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-rgb', rgb(palette.accent));
    root.setProperty('--link', palette.link);
    root.setProperty('--bg', palette.bg);
}

/* The schema is generated from the engine source, so controls cannot drift from runtime. */
const SETTINGS_KEY = 'glpEnhancedSettings';
const NETWORK_BLOCK_KEY = 'glpNetworkAdBlock';
const DATA_KEYS = Object.freeze({
    muted: 'glpMutedUsers',
    blocked: 'glpBlockedUsers',
    hidden: 'glpHiddenThreads',
    hiddenTitles: 'glpHiddenThreadTitles',
    tags: 'glpUserTags',
    watched: 'glpWatchedThreads',
    stats: 'glpUserStats',
    statsPages: 'glpUserStatsPages'
});

const NAV_GROUPS = [
    { label: 'Essentials', sections: ['Core', 'Ad Removal', 'Registration & Login'] },
    {
        label: 'Reading',
        sections: [
            'Header Options', 'Navigation', 'Thread List (Forum Page)', 'Post Display (Thread Page)',
            'Quote Styling', 'Visual Enhancements', 'Thread List Enhancements', 'Post Enhancements',
            'UI Enhancements'
        ]
    },
    {
        label: 'People & Data',
        sections: [
            'Filtering & Custom', 'Thread Watcher', 'User Intelligence', 'User Data',
            'Media & Embeds', 'Export & Data', 'Muted Users', 'Blocked Users', 'Presets'
        ]
    },
    { label: 'System', sections: ['Accessibility', 'Miscellaneous'] }
];

const PAGE_COPY = {
    'Core': ['Runtime foundation', 'Master controls for GLP Ultra itself.'],
    'Ad Removal': ['Cleaner reading', 'Remove confirmed ad surfaces while preserving native site actions.'],
    'Registration & Login': ['Account access', 'Keep account actions useful and every legal agreement manual.'],
    'Header Options': ['Header studio', 'Shape the first layer of every GLP page.'],
    'Navigation': ['Wayfinding', 'Choose which routes stay one click away.'],
    'Thread List (Forum Page)': ['Forum index', 'Set the density and information hierarchy of thread rows.'],
    'Post Display (Thread Page)': ['Reading canvas', 'Make long threads calmer, clearer, and easier to scan.'],
    'Quote Styling': ['Conversation context', 'Keep quoted context readable without letting deep chains take over.'],
    'Visual Enhancements': ['Theme studio', 'Create a cohesive palette and reading scale across every surface.'],
    'Thread List Enhancements': ['Signal over noise', 'Add useful context to the forum index without clutter.'],
    'Post Enhancements': ['Post toolkit', 'Keep high-value post actions close to the content.'],
    'UI Enhancements': ['Interaction polish', 'Refine feedback, motion, and small interface details.'],
    'Filtering & Custom': ['Content rules', 'Build precise local filters for the feed you want to read.'],
    'Thread Watcher': ['Watch desk', 'Track important threads and surface meaningful changes.'],
    'User Intelligence': ['People context', 'Turn local participation history into useful context.'],
    'User Data': ['Local inventory', 'Inspect, export, or clear everything GLP Ultra stores about users.'],
    'Media & Embeds': ['Media boundary', 'Balance rich content, performance, and privacy.'],
    'Export & Data': ['Portable threads', 'Choose which thread export tools appear in the reading toolbar.'],
    'Muted Users': ['Quiet list', 'Search, review, or clear every locally muted account.'],
    'Blocked Users': ['Safety list', 'Search, review, or clear every locally blocked account.'],
    'Presets': ['Configuration sets', 'Apply purposeful groups of settings with one-click undo.'],
    'Accessibility': ['Inclusive output', 'Prioritize contrast, focus, readability, and reduced motion.'],
    'Miscellaneous': ['Maintenance', 'Keep diagnostics, recovery, sync, and edge-case behavior tidy.']
};

const PAGE_GROUPS = {
    'Navigation': [
        ['Primary routes', ['hideTopLinks', 'hideMainNav', 'hideTabNav', 'hideThreadControls']],
        ['Secondary routes', ['hideRSS', 'hideChatRoom', 'hideJoinLink', 'hideMobilePostNew', 'hideExtrasMenu']],
        ['Layout', ['compactNav', 'stickyNav']]
    ],
    'Thread List (Forum Page)': [
        ['Columns', ['hideIconColumn', 'hideRatingColumn', 'hideViewsColumn', 'hideRepliesColumn', 'hidePostedColumn', 'hideUpdatedColumn', 'hidePosterColumn', 'hidePageLinks']],
        ['Mobile and density', ['hideMobileThreadMeta', 'hideThreadHeaderRow', 'hideForumPageNav', 'compactThreadList']],
        ['Ordering', ['sortControls', 'defaultSortByNew', 'hidePinnedThreads']],
        ['Emphasis', ['highlightPinnedThreads', 'highlightSuperPins', 'highlightOP', 'zebraStripes']]
    ],
    'Post Display (Thread Page)': [
        ['Author details', ['hideAvatars', 'hideKarmaBar', 'hideUserID', 'hideGeoLocation', 'hideSubscriberBadge', 'smallerAvatars']],
        ['Post chrome', ['hidePostDate', 'hideReportLinks', 'hideSignatures', 'hideLastEdited', 'hideRateSection', 'hidePostActions', 'hideReplyTitles', 'hideInlineReplyAds']],
        ['Reading layout', ['compactPosts', 'compactPostTitle', 'widerContent', 'collapseLongQuotes', 'readerMode', 'hideRelatedThreads']]
    ],
    'Post Enhancements': [
        ['Context', ['dimAnonPosters', 'highlightOPPosts', 'relativeTimestamps', 'inlinePostNumbers', 'postPermalinks']],
        ['Thread tools', ['opPostNav', 'collapseExpandAll', 'threadQuickSearch']],
        ['Media and cleanup', ['hideEmoticons', 'compactFlags', 'youtubeEmbed']]
    ],
    'UI Enhancements': [
        ['Page feedback', ['backToTopButton', 'scrollProgress', 'freshnessColors']],
        ['Images', ['imageLightbox', 'imageGallery']],
        ['Reading flow', ['collapsiblePosts', 'infiniteScroll', 'infiniteThreadScroll', 'threadPreview']],
        ['People and refresh', ['userMuteList', 'userTags', 'autoRefresh', 'autoRefreshInterval']]
    ],
    'Filtering & Custom': [
        ['Thread controls', ['hideThreadButtons', 'userBlockList']],
        ['Content cleanup', ['hideMemeReplies', 'hideBoomerGifs', 'keywordHighlight', 'keywordHide']],
        ['Advanced', ['customCSS']]
    ]
};

const DEPENDENCIES = Object.freeze({
    autoRefreshInterval: { key: 'autoRefresh', note: 'Turn on Auto Refresh to set its interval.' },
    watcherIntervalMinutes: { key: 'watcherEnabled', note: 'Turn on the Thread Watcher to set its interval.' },
    watcherDigest: { key: 'watcherEnabled', note: 'Turn on the Thread Watcher to use the digest.' },
    watcherBadge: { key: 'watcherEnabled', note: 'Turn on the Thread Watcher to show its badge.' },
    watcherPauseHidden: { key: 'watcherEnabled', note: 'Turn on the Thread Watcher to pause background checks.' },
    mediaHoverPreviewSize: { key: 'mediaHoverPreview', note: 'Turn on Hover Preview to choose its size.' },
    userHistoryCap: { key: 'userReputationOverlay', note: 'Turn on the Local Trust Overlay to keep poster history.' }
});

const PRESETS = [
    {
        id: 'balanced',
        title: 'Balanced defaults',
        description: 'The supported default mix of cleanup, context, and safeguards.',
        bullets: ['Smart cleanup with context preserved', 'Thread navigation with essential cues', 'Guardrails for safety and clarity'],
        defaults: true
    },
    {
        id: 'quiet',
        title: 'Quiet reading',
        description: 'Reduce navigation noise, compact threads, and focus on post content.',
        bullets: ['Hide non-essential navigation and chrome', 'Compact threads and streamline layout', 'Reduce visual noise for easier reading'],
        patch: {
            hideHeaderBanner: true, hideStatsBar: true, hideHeaderTime: true, hideNotifications: true,
            hideRSS: true, hideChatRoom: true, hideJoinLink: true, hideExtrasMenu: true,
            compactHeader: true, compactNav: true, compactThreadList: true, compactPosts: true,
            compactPostTitle: true, compactQuotes: true, hideKarmaBar: true, hideSignatures: true,
            hideLastEdited: true, hideRateSection: true, hideReportLinks: true, hideRelatedThreads: true,
            hideFooter: true, hideMobileThreadMeta: true, hideThreadHeaderRow: true, widerContent: true,
            smallerAvatars: true, collapseLongQuotes: true, hideMemeReplies: true, readerMode: true
        }
    },
    {
        id: 'power',
        title: 'Power user',
        description: 'Keep navigation visible and enable advanced thread, watcher, and media tools.',
        bullets: ['Show full navigation and thread structure', 'Enable advanced thread and watcher tools', 'Unlock media and embed power features'],
        patch: {
            hideTopLinks: false, hideMainNav: false, hideTabNav: false, hideThreadControls: false,
            compactHeader: false, compactNav: false, compactThreadList: false, compactPosts: false,
            sortControls: true, dimVisitedThreads: true, hotThreadBadge: true, relativeTimestamps: true,
            inlinePostNumbers: true, postPermalinks: true, opPostNav: true, collapseExpandAll: true,
            threadQuickSearch: true, backToTopButton: true, imageLightbox: true, imageGallery: true,
            collapsiblePosts: true, infiniteScroll: true, infiniteThreadScroll: true, freshnessColors: true,
            userTags: true, watcherEnabled: true, watcherDigest: true, watcherBadge: true,
            mediaPrivacyMode: true, mediaXEmbeds: true, mediaActions: true, mediaHoverPreview: true,
            noiseBudget: true
        }
    }
];

const schema = window.GLP_SCHEMA;
let settings = {};
let data = {
    muted: [], blocked: [], hidden: [], hiddenTitles: {}, tags: {}, watched: [], stats: {}, statsPages: []
};
let networkBlockEnabled = true;
let activeSectionTitle = '';
let onlyChanged = false;
let saveTimer = 0;
let ignoreStorageChanges = false;

function parseJSON(raw, fallback) {
    if (typeof raw !== 'string') return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return fallback;
    }
}

function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cleanImportText(value, maxLength = 200) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value).trim().slice(0, maxLength);
}

function sanitizeStringList(value, { numeric = false, maxItems = 5000, maxLength = 160 } = {}) {
    if (!Array.isArray(value)) return undefined;
    const seen = new Set();
    const result = [];
    value.forEach(entry => {
        const text = cleanImportText(entry, maxLength);
        if (!text || (numeric && !/^\d+$/.test(text)) || seen.has(text)) return;
        seen.add(text);
        if (result.length < maxItems) result.push(text);
    });
    return result;
}

function sanitizeBlockedUsers(value) {
    if (!Array.isArray(value)) return undefined;
    const seen = new Set();
    const result = [];
    value.forEach(entry => {
        const source = isRecord(entry) ? entry : { id: entry, name: entry };
        const id = cleanImportText(source.id, 40);
        if (!/^\d+$/.test(id) || seen.has(id) || result.length >= 5000) return;
        seen.add(id);
        result.push({ id, name: cleanImportText(source.name, 160) || id });
    });
    return result;
}

function sanitizeHiddenThreadTitles(value) {
    if (!isRecord(value)) return undefined;
    const result = Object.create(null);
    Object.entries(value).forEach(([id, title]) => {
        if (!/^\d+$/.test(id)) return;
        const text = cleanImportText(title, 160);
        if (text) result[id] = text;
    });
    return result;
}

function sanitizeTagColor(value, fallback) {
    const color = cleanImportText(value, 40);
    return /^(?:#[0-9a-f]{3,8}|var\(--glpx-(?:accent|warning)\))$/i.test(color) ? color : fallback;
}

function sanitizeUserTags(value) {
    if (!isRecord(value)) return undefined;
    const result = Object.create(null);
    Object.entries(value).slice(0, 5000).forEach(([rawName, rawTag]) => {
        const name = cleanImportText(rawName, 160);
        if (!name || ['__proto__', 'prototype', 'constructor'].includes(name) || !isRecord(rawTag)) return;
        const label = cleanImportText(rawTag.label, 80);
        if (!label) return;
        result[name] = {
            bg: sanitizeTagColor(rawTag.bg, 'var(--glpx-accent)'),
            fg: sanitizeTagColor(rawTag.fg, '#fff'),
            label,
            note: typeof rawTag.note === 'string' ? rawTag.note.trim().slice(0, 2000) : ''
        };
    });
    return result;
}

function nonNegativeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function sanitizeWatchedThreads(value) {
    if (!Array.isArray(value)) return undefined;
    const seen = new Set();
    const result = [];
    value.forEach(rawEntry => {
        if (!isRecord(rawEntry) || result.length >= 25) return;
        const id = cleanImportText(rawEntry.id, 40);
        if (!/^\d+$/.test(id) || seen.has(id)) return;
        let parsed;
        try {
            parsed = new URL(String(rawEntry.url || ''));
        } catch (error) {
            return;
        }
        if (!/^https?:$/.test(parsed.protocol)
            || !/^(?:www\.)?godlikeproductions\.com$/i.test(parsed.hostname)
            || !new RegExp(`/forum\\d+/message${id}(?:/|$)`, 'i').test(parsed.pathname)) return;
        seen.add(id);
        result.push({
            id,
            url: `https://${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`,
            title: cleanImportText(rawEntry.title, 200) || `Thread ${id}`,
            lastSeenPost: nonNegativeInteger(rawEntry.lastSeenPost),
            latestPost: nonNegativeInteger(rawEntry.latestPost),
            unread: nonNegativeInteger(rawEntry.unread),
            lastCheckedAt: nonNegativeInteger(rawEntry.lastCheckedAt),
            pages: nonNegativeInteger(rawEntry.pages),
            error: cleanImportText(rawEntry.error, 300)
        });
    });
    return result;
}

function sanitizeUserStats(value) {
    if (!isRecord(value)) return undefined;
    const result = Object.create(null);
    Object.entries(value).slice(0, 5000).forEach(([rawName, rawEntry]) => {
        const name = cleanImportText(rawName, 160);
        if (!name || ['__proto__', 'prototype', 'constructor'].includes(name) || !isRecord(rawEntry)) return;
        result[name] = {
            posts: nonNegativeInteger(rawEntry.posts),
            threads: sanitizeStringList(rawEntry.threads, { maxItems: 50, maxLength: 80 }) || [],
            first: nonNegativeInteger(rawEntry.first),
            last: nonNegativeInteger(rawEntry.last)
        };
    });
    return result;
}

function sanitizeUserStatsPages(value) {
    const pages = sanitizeStringList(value, { maxItems: 200, maxLength: 240 });
    return pages?.filter(page => /^\/forum\d+\/message\d+(?:\/pg\d+)?$/i.test(page));
}

const DATA_SANITIZERS = Object.freeze({
    muted: value => sanitizeStringList(value),
    blocked: sanitizeBlockedUsers,
    hidden: value => sanitizeStringList(value, { numeric: true, maxItems: 5000, maxLength: 40 }),
    hiddenTitles: sanitizeHiddenThreadTitles,
    tags: sanitizeUserTags,
    watched: sanitizeWatchedThreads,
    stats: sanitizeUserStats,
    statsPages: sanitizeUserStatsPages
});

function sanitizeDataValue(name, value) {
    return DATA_SANITIZERS[name] ? DATA_SANITIZERS[name](value) : undefined;
}

function valuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function titleSlug(title) {
    return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sectionDefinition(title) {
    return schema.sections.find(section => section.title === title);
}

function sectionGroup(title) {
    return (NAV_GROUPS.find(group => group.sections.includes(title)) || { label: 'Settings' }).label;
}

function isSettingChanged(key) {
    return !valuesEqual(settings[key], schema.defaults[key]);
}

function sectionChangedCount(sectionDef) {
    return (sectionDef && sectionDef.items ? sectionDef.items : []).filter(item => isSettingChanged(item.key)).length;
}

function isBooleanItem(item) {
    return !item.type || item.type === 'checkbox';
}

function settingLabel(key) {
    for (const section of schema.sections) {
        const item = (section.items || []).find(candidate => candidate.key === key);
        if (item) return item.label;
    }
    return key;
}

function setSaveStatus(message, settled) {
    const subtitle = document.getElementById('subtitle');
    const dot = document.querySelector('.status-dot');
    if (!subtitle || !dot) return;
    clearTimeout(saveTimer);
    subtitle.textContent = message;
    dot.style.background = settled ? 'var(--ok)' : 'var(--warning)';
    if (!settled) {
        saveTimer = setTimeout(() => setSaveStatus('Saved locally · Applied to open GLP tabs', true), 900);
    }
}

function toast(message, kind, undoAction) {
    const stack = document.getElementById('toast-stack');
    const element = document.createElement('div');
    element.className = 'toast ' + (kind || 'ok');
    const text = document.createElement('span');
    text.textContent = message;
    element.appendChild(text);
    let timer = 0;
    if (typeof undoAction === 'function') {
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'toast-action';
        undo.textContent = 'Undo';
        undo.addEventListener('click', async () => {
            clearTimeout(timer);
            undo.disabled = true;
            await undoAction();
            element.remove();
            toast('Change undone.');
        });
        element.appendChild(undo);
    }
    stack.appendChild(element);
    timer = setTimeout(() => element.remove(), undoAction ? 8000 : 3400);
}

function safeSettingsPayload(candidate) {
    return Object.assign({}, schema.defaults, safeSettingsPatch(candidate));
}

function normalizeThemeValue(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    const aliases = {
        amoledblack: 'amoled',
        solarizeddark: 'solarized',
        aliengreen: 'alien',
        highcontrastdark: 'highcontrast',
        catppuccinmocha: 'catppuccin'
    };
    return aliases[normalized] || normalized;
}

function normalizeSettingValue(key, value) {
    const fallback = schema.defaults[key];
    if (key === 'colorTheme') {
        const theme = normalizeThemeValue(value);
        return Object.prototype.hasOwnProperty.call(schema.palettes || {}, theme) ? theme : fallback;
    }
    if (key === 'quoteBorderColor') {
        const color = typeof value === 'string' ? value.trim() : '';
        return color === fallback || /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
    }
    const constraint = (schema.constraints && schema.constraints[key]) || {};
    if (constraint.values) return constraint.values.includes(value) ? value : fallback;
    if (typeof fallback === 'boolean') return typeof value === 'boolean' ? value : fallback;
    if (typeof fallback === 'number') {
        const number = typeof value === 'number'
            ? value
            : (typeof value === 'string' && value.trim() ? Number(value) : NaN);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(constraint.max ?? number, Math.max(constraint.min ?? number, number));
    }
    if (typeof fallback === 'string') return typeof value === 'string' ? value : fallback;
    return fallback;
}

function safeSettingsPatch(candidate) {
    if (!isRecord(candidate)) return {};
    const accepted = {};
    Object.keys(schema.defaults).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(candidate, key)) {
            accepted[key] = normalizeSettingValue(key, candidate[key]);
        }
    });
    return accepted;
}

async function loadAll() {
    const keys = [SETTINGS_KEY, NETWORK_BLOCK_KEY].concat(Object.values(DATA_KEYS));
    const stored = await chrome.storage.local.get(keys);
    settings = safeSettingsPayload(parseJSON(stored[SETTINGS_KEY], {}));
    data = {
        muted: sanitizeDataValue('muted', parseJSON(stored[DATA_KEYS.muted], [])) || [],
        blocked: sanitizeDataValue('blocked', parseJSON(stored[DATA_KEYS.blocked], [])) || [],
        hidden: sanitizeDataValue('hidden', parseJSON(stored[DATA_KEYS.hidden], [])) || [],
        hiddenTitles: sanitizeDataValue('hiddenTitles', parseJSON(stored[DATA_KEYS.hiddenTitles], {})) || {},
        tags: sanitizeDataValue('tags', parseJSON(stored[DATA_KEYS.tags], {})) || {},
        watched: sanitizeDataValue('watched', parseJSON(stored[DATA_KEYS.watched], [])) || [],
        stats: sanitizeDataValue('stats', parseJSON(stored[DATA_KEYS.stats], {})) || {},
        statsPages: sanitizeDataValue('statsPages', parseJSON(stored[DATA_KEYS.statsPages], [])) || []
    };
    networkBlockEnabled = stored[NETWORK_BLOCK_KEY] !== false;
    applyPageTheme(settings.colorTheme || 'midnight');
}

async function persistSettings(changes) {
    const accepted = safeSettingsPatch(changes);
    settings = safeSettingsPayload(Object.assign({}, settings, accepted));
    setSaveStatus('Saving changes locally...', false);
    ignoreStorageChanges = true;
    await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(settings) });
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:patch-settings', patch: accepted }, () => void chrome.runtime.lastError);
    });
    if (Object.prototype.hasOwnProperty.call(accepted, 'colorTheme')) applyPageTheme(accepted.colorTheme);
    setTimeout(() => { ignoreStorageChanges = false; }, 0);
    refreshChangedState();
    setSaveStatus('Saved locally · Applied to open GLP tabs', true);
}

async function persistData(name, value) {
    const sanitized = sanitizeDataValue(name, value);
    if (sanitized === undefined) return false;
    data[name] = sanitized;
    setSaveStatus('Saving changes locally...', false);
    ignoreStorageChanges = true;
    await chrome.storage.local.set({ [DATA_KEYS[name]]: JSON.stringify(sanitized) });
    setTimeout(() => { ignoreStorageChanges = false; }, 0);
    setSaveStatus('Saved locally · Applied to open GLP tabs', true);
    return true;
}

function attachPersistence(input, item, readValue, afterChange) {
    input.addEventListener('change', async () => {
        await persistSettings({ [item.key]: readValue() });
        if (afterChange) afterChange();
        refreshChangedState();
    });
}

function currentAccent() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#4a90d9';
}

function buildColorControl(item) {
    const value = String(settings[item.key] || '');
    const followsTheme = !/^#[0-9a-f]{6}$/i.test(value);
    const group = document.createElement('div');
    group.className = 'color-control setting-control';
    group.dataset.followsTheme = String(followsTheme);

    const modes = document.createElement('div');
    modes.className = 'color-modes';
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'color-mode';
    theme.textContent = 'Theme accent';
    theme.setAttribute('aria-pressed', String(followsTheme));
    const custom = document.createElement('button');
    custom.type = 'button';
    custom.className = 'color-mode';
    custom.textContent = 'Custom';
    custom.setAttribute('aria-pressed', String(!followsTheme));
    modes.append(theme, custom);

    const pickerWrap = document.createElement('label');
    pickerWrap.className = 'color-picker';
    pickerWrap.htmlFor = 'setting-' + item.key;
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = 'setting-' + item.key;
    picker.value = followsTheme ? currentAccent() : value;
    picker.disabled = followsTheme;
    const code = document.createElement('span');
    code.textContent = followsTheme ? 'Uses current theme' : picker.value.toUpperCase();
    pickerWrap.append(picker, code);
    group.append(modes, pickerWrap);

    theme.addEventListener('click', async () => {
        await persistSettings({ [item.key]: schema.defaults[item.key] });
        render();
        toast('Quote border follows the theme accent.');
    });
    custom.addEventListener('click', async () => {
        const color = /^#[0-9a-f]{6}$/i.test(value) ? value : currentAccent();
        await persistSettings({ [item.key]: color });
        render();
        toast('Custom quote border enabled.');
    });
    attachPersistence(picker, item, () => picker.value, () => {
        code.textContent = picker.value.toUpperCase();
        custom.setAttribute('aria-pressed', 'true');
        theme.setAttribute('aria-pressed', 'false');
    });
    return group;
}

function buildInput(item) {
    if (item.type === 'color') return buildColorControl(item);
    const value = settings[item.key];
    const input = item.type === 'textarea'
        ? document.createElement('textarea')
        : (item.type === 'select' ? document.createElement('select') : document.createElement('input'));
    input.id = 'setting-' + item.key;
    input.className = 'setting-control';

    if (item.type === 'select') {
        Object.entries(item.options || {}).forEach(([optionValue, optionLabel]) => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionLabel;
            option.selected = optionValue === value;
            input.appendChild(option);
        });
        attachPersistence(input, item, () => input.value);
    } else if (item.type === 'textarea') {
        input.value = value || '';
        input.rows = 5;
        attachPersistence(input, item, () => input.value);
    } else if (item.type === 'number') {
        input.type = 'number';
        input.value = value;
        if (item.min !== undefined) input.min = item.min;
        if (item.max !== undefined) input.max = item.max;
        input.step = item.step || 1;
        attachPersistence(input, item, () => parseFloat(input.value));
    } else if (item.type === 'text') {
        input.type = 'text';
        input.value = value || '';
        attachPersistence(input, item, () => input.value);
    } else {
        input.type = 'checkbox';
        input.checked = !!value;
        attachPersistence(input, item, () => input.checked);
    }
    return input;
}

function buildItem(item, sectionTitle) {
    const help = schema.settingDescriptions[item.key] || '';
    const wide = item.type && item.type !== 'checkbox';
    const wrapper = document.createElement('div');
    wrapper.className = 'item' + (wide ? ' wide' : '');
    wrapper.dataset.key = item.key;
    wrapper.dataset.search = (sectionTitle + ' ' + item.key + ' ' + item.label + ' ' + help).toLowerCase();

    const label = document.createElement('label');
    label.htmlFor = 'setting-' + item.key;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.label;
    label.appendChild(name);
    if (help) {
        const helpElement = document.createElement('span');
        helpElement.className = 'help';
        helpElement.textContent = help;
        label.appendChild(helpElement);
    }
    const changed = document.createElement('span');
    changed.className = 'changed';
    changed.textContent = 'Customized';
    label.appendChild(changed);
    const dependency = document.createElement('span');
    dependency.className = 'dependency-note';
    label.appendChild(dependency);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.appendChild(buildInput(item));
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'item-reset';
    reset.textContent = 'Reset';
    reset.setAttribute('aria-label', 'Reset ' + item.label);
    reset.addEventListener('click', async () => {
        const previous = settings[item.key];
        await persistSettings({ [item.key]: schema.defaults[item.key] });
        render();
        toast(item.label + ' reset.', 'ok', async () => {
            await persistSettings({ [item.key]: previous });
            render();
        });
    });
    actions.appendChild(reset);
    wrapper.append(label, actions);
    return wrapper;
}

function appendGroupedItems(body, sectionDef) {
    const groups = PAGE_GROUPS[sectionDef.title];
    if (!groups) {
        sectionDef.items.forEach(item => body.appendChild(buildItem(item, sectionDef.title)));
        return;
    }
    const used = new Set();
    groups.forEach(([label, keys]) => {
        const items = keys.map(key => sectionDef.items.find(item => item.key === key)).filter(Boolean);
        if (!items.length) return;
        items.forEach(item => used.add(item.key));
        const group = document.createElement('section');
        group.className = 'control-group';
        const heading = document.createElement('h3');
        heading.textContent = label;
        const grid = document.createElement('div');
        grid.className = 'control-grid';
        items.forEach(item => grid.appendChild(buildItem(item, sectionDef.title)));
        group.append(heading, grid);
        body.appendChild(group);
    });
    const ungrouped = sectionDef.items.filter(item => !used.has(item.key));
    if (ungrouped.length) {
        const group = document.createElement('section');
        group.className = 'control-group';
        const heading = document.createElement('h3');
        heading.textContent = 'Other';
        const grid = document.createElement('div');
        grid.className = 'control-grid';
        ungrouped.forEach(item => grid.appendChild(buildItem(item, sectionDef.title)));
        group.append(heading, grid);
        body.appendChild(group);
    }
}

function presetPatch(preset) {
    return preset.defaults ? Object.assign({}, schema.defaults) : Object.assign({}, preset.patch);
}

function presetDifferenceCount(preset) {
    const patch = presetPatch(preset);
    return Object.keys(patch).filter(key => !valuesEqual(settings[key], patch[key])).length;
}

function activePreset() {
    return PRESETS.find(preset => presetDifferenceCount(preset) === 0) || null;
}

function statusEntries(title) {
    const section = sectionDefinition(title);
    const controls = (section.items || []).length;
    const enabled = (section.items || []).filter(item => isBooleanItem(item) && settings[item.key]).length;
    const changed = sectionChangedCount(section);
    if (title === 'Core') {
        return [
            ['GLP Ultra', settings.enabled ? 'Active' : 'Paused'],
            ['Storage', 'Local only'],
            ['Theme ownership', settings.overrideDarkReader ? 'GLP Ultra' : 'Shared']
        ];
    }
    if (title === 'Ad Removal') {
        return [
            ['Network blocking', networkBlockEnabled ? 'Enabled' : 'Disabled'],
            ['DOM cleanup', settings.removeAds ? 'Enabled' : 'Disabled'],
            ['Native site links', 'Preserved']
        ];
    }
    if (title === 'Registration & Login') {
        return [
            ['Membership contract', 'Manual only'],
            ['Registration redirect', settings.autoBypassRegNag ? 'Enabled' : 'Manual'],
            ['Login controls', settings.hideLoginLinks ? 'Hidden' : 'Visible']
        ];
    }
    if (title === 'Quote Styling') {
        return [
            ['Depth handling', settings.collapseNestedQuotes ? 'Collapse nested' : 'Expanded'],
            ['Backlinks', settings.quoteBacklinks ? 'On' : 'Off'],
            ['Border', /^#/.test(String(settings.quoteBorderColor)) ? 'Custom' : 'Theme accent']
        ];
    }
    if (title === 'Visual Enhancements') {
        return [
            ['Theme', String(settings.colorTheme || 'midnight')],
            ['Type size', settings.fontSize + ' px'],
            ['Content width', Number(settings.maxContentWidth) ? settings.maxContentWidth + ' px' : 'Fluid']
        ];
    }
    if (title === 'Thread Watcher') {
        return [
            ['Watcher', settings.watcherEnabled ? 'Active' : 'Paused'],
            ['Check interval', settings.watcherEnabled ? settings.watcherIntervalMinutes + ' min' : 'Unavailable'],
            ['Digest', settings.watcherDigest ? 'On' : 'Off']
        ];
    }
    if (title === 'User Data') {
        return [
            ['Muted', String(data.muted.length)],
            ['Blocked', String(data.blocked.length)],
            ['Hidden', String(data.hidden.length)]
        ];
    }
    if (title === 'Presets') {
        return [
            ['Presets', String(PRESETS.length)],
            ['Active', activePreset() ? activePreset().title : 'Custom'],
            ['Changed', String(Object.keys(schema.defaults).filter(isSettingChanged).length)]
        ];
    }
    if (title === 'Media & Embeds') {
        return [
            ['Privacy mode', settings.mediaPrivacyMode ? 'On' : 'Off'],
            ['Hover preview', settings.mediaHoverPreview ? 'On' : 'Off'],
            ['Media actions', settings.mediaActions ? 'On' : 'Off']
        ];
    }
    if (title === 'Accessibility') {
        return [
            ['Reduced motion', settings.reduceMotion ? 'On' : 'System default'],
            ['High contrast', settings.highContrast ? 'On' : 'Theme default'],
            ['Larger targets', settings.largeTargets ? 'On' : 'Standard']
        ];
    }
    return [
        ['Scope', sectionGroup(title)],
        ['Controls enabled', controls ? enabled + ' of ' + controls : 'Managed'],
        ['Changed', String(changed)]
    ];
}

function buildStatusStrip(title) {
    const strip = document.createElement('div');
    strip.className = 'status-strip';
    strip.dataset.search = statusEntries(title).flat().join(' ').toLowerCase();
    statusEntries(title).forEach(([label, value]) => {
        const entry = document.createElement('div');
        const name = document.createElement('span');
        name.textContent = value;
        const state = document.createElement('strong');
        state.textContent = label;
        entry.append(state, name);
        strip.appendChild(entry);
    });
    return strip;
}

function buildTypographySample() {
    const sample = document.createElement('section');
    sample.className = 'typography-sample searchable-block';
    sample.dataset.search = 'typography sample font size line height content width';
    const header = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = 'Current typography sample';
    const metrics = document.createElement('span');
    metrics.className = 'typography-metrics';
    header.append(title, metrics);
    const heading = document.createElement('h3');
    heading.textContent = 'The quick brown fox jumps over the lazy dog.';
    const paragraph = document.createElement('p');
    paragraph.textContent = 'GLP Ultra lets you tune type scale, line height, and reading width while preserving a calm hierarchy across long threads.';
    sample.append(header, heading, paragraph);
    return sample;
}

function refreshTypographySample() {
    const sample = document.querySelector('.typography-sample');
    if (!sample) return;
    sample.style.fontSize = settings.fontSize + 'px';
    sample.style.lineHeight = String(settings.lineHeight);
    sample.style.maxWidth = Math.min(Number(settings.maxContentWidth) || 1200, 1200) + 'px';
    const metrics = sample.querySelector('.typography-metrics');
    if (metrics) {
        const width = Number(settings.maxContentWidth) ? settings.maxContentWidth + ' px width' : 'Fluid width';
        metrics.textContent = settings.fontSize + ' px · ' + settings.lineHeight + ' line height · ' + width;
    }
}

function sectionShell(title, description) {
    const section = document.createElement('section');
    section.className = 'section';
    section.dataset.title = title;
    section.dataset.search = (title + ' ' + (description || '') + ' ' + (PAGE_COPY[title] || []).join(' ')).toLowerCase();
    const heading = document.createElement('div');
    heading.className = 'section-head';
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    heading.appendChild(titleElement);
    section.append(heading, buildStatusStrip(title));
    return section;
}

function renderNavigation() {
    const nav = document.getElementById('section-nav');
    nav.replaceChildren();
    let sequence = 1;
    NAV_GROUPS.forEach(group => {
        const present = group.sections.filter(title => sectionDefinition(title));
        if (!present.length) return;
        const groupElement = document.createElement('div');
        groupElement.className = 'nav-group';
        const heading = document.createElement('span');
        heading.className = 'nav-group-title';
        heading.textContent = group.label;
        groupElement.appendChild(heading);
        present.forEach(title => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nav-item';
            button.dataset.sectionTitle = title;
            const number = document.createElement('span');
            number.className = 'nav-icon';
            number.textContent = String(sequence++).padStart(2, '0');
            const label = document.createElement('span');
            label.className = 'nav-label';
            label.textContent = title.replace(' (Forum Page)', '').replace(' (Thread Page)', '');
            const badge = document.createElement('span');
            badge.className = 'nav-badge';
            button.append(number, label, badge);
            button.addEventListener('click', () => activateSection(title, { scroll: true, updateHash: true }));
            groupElement.appendChild(button);
        });
        nav.appendChild(groupElement);
    });
}

function listRowModels(name) {
    if (name === 'muted') return data.muted.map(value => ({ id: String(value), label: String(value) }));
    if (name === 'blocked') {
        return data.blocked.map(value => {
            const entry = typeof value === 'object' && value ? value : { id: String(value), name: String(value) };
            return { id: String(entry.id), label: entry.name || 'User ' + entry.id, meta: '#' + entry.id };
        });
    }
    return data.hidden.map(value => {
        const id = String(typeof value === 'object' && value ? value.id : value);
        const title = typeof value === 'object' && value ? value.title : data.hiddenTitles[id];
        return { id, label: title || 'Thread ' + id, meta: '#' + id };
    });
}

async function removeListEntry(name, id) {
    if (name === 'muted') {
        await persistData('muted', data.muted.filter(value => String(value) !== String(id)));
        return;
    }
    if (name === 'blocked') {
        await persistData('blocked', data.blocked.filter(value => {
            const entryId = typeof value === 'object' && value ? value.id : value;
            return String(entryId) !== String(id);
        }));
        return;
    }
    const nextHidden = data.hidden.filter(value => {
        const entryId = typeof value === 'object' && value ? value.id : value;
        return String(entryId) !== String(id);
    });
    const nextTitles = Object.assign({}, data.hiddenTitles);
    delete nextTitles[id];
    await persistData('hidden', nextHidden);
    await persistData('hiddenTitles', nextTitles);
}

async function clearManagedList(name) {
    if (name === 'hidden') {
        await persistData('hidden', []);
        await persistData('hiddenTitles', {});
        return;
    }
    await persistData(name, []);
}

function buildListManager(name, title, emptyText) {
    const rows = listRowModels(name);
    const manager = document.createElement('div');
    manager.className = 'list-manager searchable-block';
    manager.dataset.search = (title + ' ' + rows.map(row => row.label + ' ' + (row.meta || '')).join(' ')).toLowerCase();
    const toolbar = document.createElement('div');
    toolbar.className = 'list-toolbar';
    const heading = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    const count = document.createElement('span');
    count.textContent = rows.length + ' saved';
    heading.append(strong, count);
    toolbar.appendChild(heading);

    let filter = null;
    if (rows.length) {
        filter = document.createElement('input');
        filter.type = 'search';
        filter.className = 'list-search';
        filter.placeholder = 'Search this list';
        filter.setAttribute('aria-label', 'Search ' + title);
        toolbar.appendChild(filter);
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'btn list-clear';
        clear.textContent = 'Clear all';
        clear.addEventListener('click', async () => {
            const previous = {
                values: Array.isArray(data[name]) ? data[name].slice() : data[name],
                titles: Object.assign({}, data.hiddenTitles)
            };
            await clearManagedList(name);
            render();
            toast(title + ' cleared.', 'warn', async () => {
                await persistData(name, previous.values);
                if (name === 'hidden') await persistData('hiddenTitles', previous.titles);
                render();
            });
        });
        toolbar.appendChild(clear);
    }
    manager.appendChild(toolbar);

    const list = document.createElement('div');
    list.className = 'list';
    if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = emptyText;
        list.appendChild(empty);
    } else {
        rows.forEach(row => {
            const element = document.createElement('div');
            element.className = 'list-row';
            element.dataset.search = (row.label + ' ' + (row.meta || '')).toLowerCase();
            const label = document.createElement('span');
            label.textContent = row.label;
            if (row.meta) {
                const meta = document.createElement('em');
                meta.textContent = ' ' + row.meta;
                label.appendChild(meta);
            }
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Remove';
            remove.addEventListener('click', async () => {
                const previous = {
                    values: Array.isArray(data[name]) ? data[name].slice() : data[name],
                    titles: Object.assign({}, data.hiddenTitles)
                };
                await removeListEntry(name, row.id);
                render();
                toast('Removed ' + row.label + '.', 'ok', async () => {
                    await persistData(name, previous.values);
                    if (name === 'hidden') await persistData('hiddenTitles', previous.titles);
                    render();
                });
            });
            element.append(label, remove);
            list.appendChild(element);
        });
    }
    manager.appendChild(list);
    if (filter) {
        filter.addEventListener('input', () => {
            const query = filter.value.trim().toLowerCase();
            list.querySelectorAll('.list-row').forEach(row => {
                row.classList.toggle('filtered', !!query && !row.dataset.search.includes(query));
            });
        });
    }
    return manager;
}

function dataCount(value) {
    if (Array.isArray(value)) return value.length;
    return value && typeof value === 'object' ? Object.keys(value).length : 0;
}

function downloadJSON(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportAllData() {
    downloadJSON('glp-ultra-backup-v' + schema.version + '.json', {
        format: 'glp-ultra-backup',
        formatVersion: 3,
        version: schema.version,
        exportedAt: new Date().toISOString(),
        settings,
        mutedUsers: data.muted,
        blockedUsers: data.blocked,
        hiddenThreads: data.hidden,
        hiddenThreadTitles: data.hiddenTitles,
        userTags: data.tags,
        watchedThreads: data.watched,
        userStats: data.stats,
        userStatsPages: data.statsPages
    });
    toast('All settings and local user data exported.');
}

function buildUserDataPage() {
    const wrapper = document.createElement('div');
    wrapper.className = 'special-page';
    const actions = document.createElement('div');
    actions.className = 'action-panel searchable-block';
    actions.dataset.search = 'export all data clear poster history local privacy';
    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.className = 'btn primary';
    exportButton.textContent = 'Export all data';
    exportButton.addEventListener('click', exportAllData);
    const clearHistory = document.createElement('button');
    clearHistory.type = 'button';
    clearHistory.className = 'btn danger-outline';
    clearHistory.textContent = 'Clear poster history';
    clearHistory.disabled = dataCount(data.stats) === 0 && data.statsPages.length === 0;
    clearHistory.addEventListener('click', async () => {
        const previousStats = Object.assign({}, data.stats);
        const previousPages = data.statsPages.slice();
        await persistData('stats', {});
        await persistData('statsPages', []);
        render();
        toast('Local poster history cleared.', 'warn', async () => {
            await persistData('stats', previousStats);
            await persistData('statsPages', previousPages);
            render();
        });
    });
    const copy = document.createElement('p');
    copy.textContent = 'Exports a readable JSON backup. Clearing poster history leaves mutes, blocks, tags, notes, and watched threads intact.';
    const privacy = document.createElement('p');
    privacy.className = 'privacy-copy';
    privacy.textContent = 'Nothing is uploaded. Every action stays on this device.';
    actions.append(exportButton, clearHistory, copy, privacy);
    wrapper.appendChild(actions);

    const cards = document.createElement('div');
    cards.className = 'data-cards';
    [
        ['Muted users', data.muted.length, 'Muted Users'],
        ['Blocked users', data.blocked.length, 'Blocked Users'],
        ['Hidden threads', data.hidden.length, null]
    ].forEach(([label, count, destination]) => {
        const card = document.createElement('div');
        card.className = 'data-card searchable-block';
        card.dataset.search = String(label).toLowerCase();
        const summary = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = label + ' · ' + count;
        const description = document.createElement('span');
        description.textContent = count ? 'Stored locally and removable at any time.' : 'Nothing stored.';
        summary.append(title, description);
        card.appendChild(summary);
        if (destination) {
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'btn';
            open.textContent = 'Open ' + label;
            open.addEventListener('click', () => activateSection(destination, { scroll: true, updateHash: true }));
            card.appendChild(open);
        }
        cards.appendChild(card);
    });
    wrapper.appendChild(cards);

    const other = document.createElement('div');
    other.className = 'local-data-grid searchable-block';
    other.dataset.search = 'tags notes watched threads poster history';
    const noteCount = Object.values(data.tags).filter(entry => entry && entry.note).length;
    [
        ['Tagged users', dataCount(data.tags)],
        ['Private notes', noteCount],
        ['Watched threads', dataCount(data.watched)],
        ['Poster records', dataCount(data.stats)]
    ].forEach(([label, count]) => {
        const cell = document.createElement('div');
        const value = document.createElement('strong');
        value.textContent = String(count);
        const name = document.createElement('span');
        name.textContent = label;
        cell.append(value, name);
        other.appendChild(cell);
    });
    wrapper.append(other, buildListManager('hidden', 'Hidden threads', 'No hidden threads.'));
    return wrapper;
}

function buildPresetPage() {
    const wrapper = document.createElement('div');
    wrapper.className = 'preset-page';
    const cards = document.createElement('div');
    cards.className = 'preset-grid';
    PRESETS.forEach(preset => {
        const patch = presetPatch(preset);
        const difference = presetDifferenceCount(preset);
        const card = document.createElement('article');
        card.className = 'preset-card searchable-block' + (difference === 0 ? ' current' : '');
        card.dataset.search = (preset.title + ' ' + preset.description + ' ' + preset.bullets.join(' ')).toLowerCase();
        const header = document.createElement('header');
        const title = document.createElement('h3');
        title.textContent = preset.title;
        header.appendChild(title);
        if (difference === 0) {
            const current = document.createElement('span');
            current.className = 'current-badge';
            current.textContent = 'Current';
            header.appendChild(current);
        }
        const description = document.createElement('p');
        description.textContent = preset.description;
        const count = document.createElement('strong');
        count.className = 'preset-count';
        count.textContent = difference + ' setting change' + (difference === 1 ? '' : 's');
        const bullets = document.createElement('ul');
        preset.bullets.forEach(text => {
            const item = document.createElement('li');
            item.textContent = text;
            bullets.appendChild(item);
        });
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Review changes';
        const changes = document.createElement('ul');
        Object.keys(patch).filter(key => !valuesEqual(settings[key], patch[key])).slice(0, 12).forEach(key => {
            const item = document.createElement('li');
            item.textContent = settingLabel(key) + ': ' + String(patch[key]);
            changes.appendChild(item);
        });
        if (difference > 12) {
            const remainder = document.createElement('li');
            remainder.textContent = '+' + (difference - 12) + ' more';
            changes.appendChild(remainder);
        }
        details.append(summary, changes);
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'btn primary preset-apply';
        apply.textContent = difference === 0 ? 'Current' : 'Apply preset';
        apply.disabled = difference === 0;
        apply.addEventListener('click', async () => {
            const previous = Object.assign({}, settings);
            await persistSettings(patch);
            render();
            toast(preset.title + ' applied.', 'ok', async () => {
                await persistSettings(previous);
                render();
            });
        });
        card.append(header, description, count, bullets, details, apply);
        cards.appendChild(card);
    });
    const note = document.createElement('p');
    note.className = 'preset-note';
    note.textContent = 'Applying a preset saves locally and offers Undo for 8 seconds.';
    wrapper.append(cards, note);
    return wrapper;
}

async function openSiteTool(messageType, label) {
    const active = await chrome.tabs.query({ active: true, currentWindow: true });
    let tab = active.find(candidate => /godlikeproductions\.com/i.test(candidate.url || ''));
    if (!tab) {
        const matches = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
        tab = matches[0];
    }
    if (!tab) {
        await chrome.tabs.create({ url: 'https://www.godlikeproductions.com/forum1/pg1' });
        toast('Opened GLP. Run ' + label + ' after the page finishes loading.', 'warn');
        return;
    }
    const response = await chrome.tabs.sendMessage(tab.id, { type: messageType }).catch(() => null);
    if (!response || !response.ok) {
        toast(label + ' is unavailable on that tab. Reload GLP and try again.', 'warn');
        return;
    }
    await chrome.tabs.update(tab.id, { active: true });
    toast(label + ' opened on the GLP tab.');
}

function buildMaintenanceTools() {
    const panel = document.createElement('div');
    panel.className = 'tool-panel searchable-block';
    panel.dataset.search = 'diagnostics recovery maintenance inspect restore';
    [
        ['Diagnostics', 'Inspect selector health, feature errors, timing, and fetch state.', 'glp:open-diagnostics'],
        ['Recovery', 'Restore hidden threads, muted users, filters, and pre-upgrade settings.', 'glp:open-recovery']
    ].forEach(([title, description, message]) => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        const copy = document.createElement('div');
        const heading = document.createElement('strong');
        heading.textContent = title;
        const text = document.createElement('span');
        text.textContent = description;
        copy.append(heading, text);
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'btn';
        open.textContent = 'Open ' + title.toLowerCase();
        open.addEventListener('click', () => openSiteTool(message, title));
        card.append(copy, open);
        panel.appendChild(card);
    });
    return panel;
}

function render() {
    const host = document.getElementById('sections');
    host.replaceChildren();
    schema.sections.forEach(sectionDef => {
        const description = schema.sectionDescriptions[sectionDef.title] || '';
        const section = sectionShell(sectionDef.title, description);
        const body = document.createElement('div');
        body.className = 'section-body';
        if (sectionDef.specialId === 'mute-list') {
            body.appendChild(buildListManager('muted', 'Muted users', 'No muted users yet. Muted accounts will appear here.'));
        } else if (sectionDef.specialId === 'block-list') {
            body.appendChild(buildListManager('blocked', 'Blocked users', 'No blocked users yet. Use the Block button on a post author.'));
        } else if (sectionDef.specialId === 'user-data') {
            body.appendChild(buildUserDataPage());
        } else if (sectionDef.specialId === 'presets') {
            body.appendChild(buildPresetPage());
        } else {
            if (sectionDef.title === 'Miscellaneous') body.appendChild(buildMaintenanceTools());
            if (sectionDef.title === 'Visual Enhancements') body.appendChild(buildTypographySample());
            appendGroupedItems(body, sectionDef);
        }
        section.appendChild(body);
        host.appendChild(section);
    });
    renderNavigation();
    refreshTypographySample();
    if (!sectionDefinition(activeSectionTitle)) activeSectionTitle = schema.sections[0].title;
    refreshChangedState();
    applySearch();
}

function updatePageHero(title) {
    const section = sectionDefinition(title);
    if (!section) return;
    document.getElementById('page-eyebrow').textContent = sectionGroup(title);
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-description').textContent =
        (PAGE_COPY[title] && PAGE_COPY[title][1]) || schema.sectionDescriptions[title] || 'Configure this part of GLP Ultra.';
    const special = !!section.specialId;
    const count = (section.items || []).length;
    const enabled = (section.items || []).filter(item => isBooleanItem(item) && settings[item.key]).length;
    document.getElementById('metric-controls').textContent = special
        ? (title === 'Presets' ? String(PRESETS.length) : 'Manage')
        : String(count);
    document.getElementById('metric-enabled').textContent = special
        ? (title === 'Presets' ? (activePreset() ? activePreset().title.replace(' defaults', '') : 'Custom') : 'Local')
        : String(enabled);
    document.getElementById('metric-custom').textContent = String(sectionChangedCount(section));
    document.getElementById('metric-label-controls').textContent = title === 'Presets' ? 'Presets' : (special ? 'Data' : 'Controls');
    document.getElementById('metric-label-enabled').textContent = title === 'Presets' ? 'Active' : (special ? 'Storage' : 'Enabled');
    document.getElementById('metric-label-custom').textContent = 'Changed';
    const reset = document.getElementById('reset-page');
    const changed = sectionChangedCount(section);
    reset.hidden = !count;
    reset.disabled = changed === 0;
    reset.textContent = changed ? 'Reset page · ' + changed : 'Reset page';
    document.title = title + ' - GLP Ultra';
}

function activateSection(title, options) {
    const settingsOptions = options || {};
    const target = document.querySelector('.section[data-title="' + CSS.escape(title) + '"]');
    if (!target || target.classList.contains('search-hidden')) return;
    activeSectionTitle = title;
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('page-active', section.dataset.title === title);
    });
    document.querySelectorAll('.nav-item').forEach(button => {
        const active = button.dataset.sectionTitle === title;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    updatePageHero(title);
    if (settingsOptions.updateHash) history.replaceState(null, '', '#' + titleSlug(title));
    if (settingsOptions.scroll) document.querySelector('.content').scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDependencies() {
    document.querySelectorAll('.item[data-key]').forEach(item => {
        const dependency = DEPENDENCIES[item.dataset.key];
        const unavailable = dependency && !settings[dependency.key];
        item.classList.toggle('is-dependent-disabled', !!unavailable);
        item.querySelectorAll('.setting-control input, .setting-control select, .setting-control textarea, input.setting-control, select.setting-control, textarea.setting-control, .color-mode').forEach(control => {
            const themeFollower = control.matches('input[type="color"]')
                && control.closest('.color-control')?.dataset.followsTheme === 'true';
            control.disabled = !!unavailable || themeFollower;
        });
        const note = item.querySelector('.dependency-note');
        if (note) note.textContent = unavailable ? dependency.note : '';
    });
}

function refreshStatusStrip() {
    const section = document.querySelector('.section[data-title="' + CSS.escape(activeSectionTitle) + '"]');
    const existing = section && section.querySelector('.status-strip');
    if (existing) existing.replaceWith(buildStatusStrip(activeSectionTitle));
}

function refreshChangedState() {
    let total = 0;
    document.querySelectorAll('.item[data-key]').forEach(item => {
        const changed = isSettingChanged(item.dataset.key);
        item.classList.toggle('is-changed', changed);
        const reset = item.querySelector('.item-reset');
        if (reset) reset.hidden = !changed;
        if (changed) total++;
    });
    document.getElementById('changed-total').textContent = String(total);
    document.querySelectorAll('.nav-item').forEach(button => {
        const count = sectionChangedCount(sectionDefinition(button.dataset.sectionTitle));
        const badge = button.querySelector('.nav-badge');
        if (badge) badge.textContent = count ? String(count) : '';
    });
    updateDependencies();
    if (activeSectionTitle) {
        updatePageHero(activeSectionTitle);
        refreshStatusStrip();
    }
    refreshTypographySample();
    if (onlyChanged) applySearch();
}

function applySearch() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const candidates = [];
    document.querySelectorAll('.section').forEach(section => {
        const definition = sectionDefinition(section.dataset.title);
        const titleMatches = !query || (section.dataset.search || '').includes(query);
        const items = Array.from(section.querySelectorAll('.item'));
        const blocks = Array.from(section.querySelectorAll('.searchable-block'));
        let visibleItems = 0;
        items.forEach(item => {
            const queryMatch = titleMatches || !query || (item.dataset.search || '').includes(query);
            const changedMatch = !onlyChanged || isSettingChanged(item.dataset.key);
            const visible = queryMatch && changedMatch;
            item.classList.toggle('filtered', !visible);
            if (visible) visibleItems++;
        });
        let visibleBlocks = 0;
        blocks.forEach(block => {
            const visible = !onlyChanged && (titleMatches || !query || (block.dataset.search || '').includes(query));
            block.classList.toggle('filtered', !visible);
            if (visible) visibleBlocks++;
        });
        const hasControls = items.length > 0;
        const visible = hasControls ? (visibleItems > 0 || visibleBlocks > 0) : visibleBlocks > 0;
        section.classList.toggle('search-hidden', !visible);
        if (visible) candidates.push(section.dataset.title);
        if (!definition) section.classList.add('search-hidden');
    });
    document.querySelectorAll('.nav-item').forEach(button => {
        button.classList.toggle('search-hidden', !candidates.includes(button.dataset.sectionTitle));
    });
    document.querySelectorAll('.nav-group').forEach(group => {
        group.classList.toggle('search-hidden', !group.querySelector('.nav-item:not(.search-hidden)'));
    });
    document.getElementById('search-summary').textContent = query || onlyChanged
        ? candidates.length + ' page' + (candidates.length === 1 ? '' : 's')
        : schema.sections.length + ' pages';
    if (!candidates.length) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('page-active'));
        document.getElementById('page-eyebrow').textContent = 'Search';
        document.getElementById('page-title').textContent = 'No settings found';
        document.getElementById('page-description').textContent = 'Try a broader term or turn off Only changed.';
        document.getElementById('metric-controls').textContent = '0';
        document.getElementById('metric-enabled').textContent = '0';
        document.getElementById('metric-custom').textContent = '0';
        document.getElementById('reset-page').hidden = true;
        return;
    }
    activateSection(candidates.includes(activeSectionTitle) ? activeSectionTitle : candidates[0]);
}

async function importSettings(file) {
    if (file.size > 8 * 1024 * 1024) {
        toast('That backup is larger than 8 MB and was not imported.', 'warn');
        return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
        const parsed = parseJSON(String(reader.result), null);
        if (!isRecord(parsed)) {
            toast('That file is not a GLP Ultra export.', 'warn');
            return;
        }
        const nestedSettings = [parsed.settings, parsed.payload?.settings, parsed.config, parsed.options]
            .find(isRecord);
        const incomingSettings = nestedSettings
            || (Object.keys(parsed).some(key => Object.prototype.hasOwnProperty.call(schema.defaults, key)) ? parsed : null);
        const accepted = safeSettingsPatch(incomingSettings);
        const source = isRecord(parsed.data) ? parsed.data : parsed;
        const oldLists = isRecord(parsed.lists) ? parsed.lists : {};
        const imports = {
            muted: source.mutedUsers ?? oldLists.muted,
            blocked: source.blockedUsers ?? oldLists.blocked,
            hidden: source.hiddenThreads ?? oldLists.hidden,
            hiddenTitles: source.hiddenThreadTitles,
            tags: source.userTags,
            watched: source.watchedThreads,
            stats: source.userStats,
            statsPages: source.userStatsPages
        };

        if (!incomingSettings && !Object.values(imports).some(value => value !== undefined)) {
            toast('That file has no recognized GLP Ultra settings or local data.', 'warn');
            return;
        }

        if (incomingSettings) {
            const replacement = nestedSettings
                ? Object.assign({}, schema.defaults, accepted)
                : Object.assign({}, settings, accepted);
            await persistSettings(replacement);
        }

        let importedStores = 0;
        for (const [name, value] of Object.entries(imports)) {
            if (value !== undefined && await persistData(name, value)) importedStores++;
        }
        render();
        toast('Imported ' + Object.keys(accepted).length + ' settings and ' + importedStores + ' local data stores.');
    };
    reader.onerror = () => toast('The selected backup could not be read.', 'warn');
    reader.readAsText(file);
}

async function resetPage() {
    const section = sectionDefinition(activeSectionTitle);
    if (!section || !section.items.length) return;
    const previous = {};
    const patch = {};
    section.items.forEach(item => {
        previous[item.key] = settings[item.key];
        patch[item.key] = schema.defaults[item.key];
    });
    await persistSettings(patch);
    render();
    toast(activeSectionTitle + ' reset to defaults.', 'warn', async () => {
        await persistSettings(previous);
        render();
    });
}

async function resetSettings() {
    const previous = Object.assign({}, settings);
    await persistSettings(Object.assign({}, schema.defaults));
    render();
    toast('All settings reset to defaults.', 'warn', async () => {
        await persistSettings(previous);
        render();
    });
}

async function init() {
    await loadAll();
    document.getElementById('brand-version').textContent = 'v' + schema.version;
    const hash = location.hash.slice(1);
    activeSectionTitle = schema.sections.find(section => titleSlug(section.title) === hash)?.title || schema.sections[0].title;
    render();

    const search = document.getElementById('search');
    search.addEventListener('input', applySearch);
    search.addEventListener('keydown', event => {
        if (event.key === 'Escape' && search.value) {
            search.value = '';
            applySearch();
        }
    });
    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            search.focus();
            search.select();
        }
    });
    document.getElementById('only-changed').addEventListener('click', event => {
        onlyChanged = !onlyChanged;
        event.currentTarget.setAttribute('aria-pressed', String(onlyChanged));
        applySearch();
    });
    document.getElementById('export').addEventListener('click', exportAllData);
    document.getElementById('reset').addEventListener('click', resetSettings);
    document.getElementById('reset-page').addEventListener('click', resetPage);

    const fileInput = document.getElementById('import-file');
    document.getElementById('import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) importSettings(fileInput.files[0]);
        fileInput.value = '';
    });
    window.addEventListener('hashchange', () => {
        const next = schema.sections.find(section => titleSlug(section.title) === location.hash.slice(1));
        if (next) activateSection(next.title, { scroll: true });
    });
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local' || ignoreStorageChanges) return;
        const relevant = [SETTINGS_KEY, NETWORK_BLOCK_KEY].concat(Object.values(DATA_KEYS));
        if (!Object.keys(changes).some(key => relevant.includes(key))) return;
        await loadAll();
        render();
    });
}

init();
