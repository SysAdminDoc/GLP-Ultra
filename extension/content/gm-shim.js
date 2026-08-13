/**
 * GM_* compatibility shim for the MV3 content script.
 *
 * localStorage is the primary store because the engine reads settings synchronously at
 * document_start (chrome.storage is async and would cost a paint). Every write is mirrored
 * into chrome.storage.local so the popup and options page — which cannot touch page-origin
 * localStorage — see and control the same state.
 */
(function () {
    'use strict';

    if (typeof window.GM_getValue === 'function') return;

    const STORAGE_PREFIX = 'glpEnhanced.mv3.';
    const SETTINGS_KEY = 'glpEnhancedSettings';
    const SYNC_STAMP_KEY = 'glpSettingsSyncedAt';
    // chrome.storage.sync allows 8KB per item. Only the settings payload is synced - the mute,
    // block, tag and history stores are unbounded and would start failing writes silently.
    const SYNC_ITEM_LIMIT = 7500;
    const MIRRORED_KEYS = [
        'glpEnhancedSettings',
        'glpSettingsSchemaVersion',
        'glpMutedUsers',
        'glpBlockedUsers',
        'glpHiddenThreads',
        'glpHiddenThreadTitles',
        'glpUserTags',
        'glpWatchedThreads',
        'glpUserStats',
        'glpUserStatsPages',
        // The pre-upgrade settings backup is recovery data; mirroring it means clearing site data
        // does not also destroy the only copy of what the settings looked like before an upgrade.
        'glpEnhancedSettings_backup'
    ];

    let suppressMirror = false;

    function storageKey(key) {
        return `${STORAGE_PREFIX}${key}`;
    }

    function readLocal(key) {
        return window.localStorage.getItem(storageKey(key));
    }

    function writeLocal(key, serialized) {
        window.localStorage.setItem(storageKey(key), serialized);
    }

    /**
     * Returns exactly what was stored, the way Tampermonkey does. The engine serializes
     * before every write and parses after every read; parsing here as well made every
     * `JSON.parse(GM_getValue(...))` in the engine throw on an already-parsed object, so
     * settings, mutes, blocks, tags, and hidden threads all silently reset on reload.
     */
    window.GM_getValue = function GM_getValue(key, defaultValue) {
        const raw = readLocal(key);
        return raw === null ? defaultValue : raw;
    };

    window.GM_setValue = function GM_setValue(key, value) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        writeLocal(key, serialized);

        if (!suppressMirror && MIRRORED_KEYS.includes(key)) {
            try {
                chrome.storage.local.set({ [key]: serialized });
            } catch (e) {
                // Extension context invalidated (reload/update) — the local copy still holds.
            }
        }

        if (!suppressMirror && key === SETTINGS_KEY) pushSettingsToSync(serialized);
    };

    function syncEnabled(serializedSettings) {
        try {
            return JSON.parse(serializedSettings || readLocal(SETTINGS_KEY) || '{}').syncSettings === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Opt-in, settings only, last writer wins. The stamp is what makes the arbitration possible:
     * without it a device that merely opened a tab could overwrite a device that changed a setting.
     */
    function pushSettingsToSync(serialized) {
        if (!syncEnabled(serialized)) return;
        if (serialized.length > SYNC_ITEM_LIMIT) {
            console.warn('[GLP Ultra] settings payload too large for chrome.storage.sync; keeping it local only.');
            return;
        }
        try {
            const stamp = Date.now();
            window.localStorage.setItem(storageKey(SYNC_STAMP_KEY), String(stamp));
            chrome.storage.sync.set({ [SETTINGS_KEY]: serialized, [SYNC_STAMP_KEY]: stamp }, () => void chrome.runtime.lastError);
        } catch (e) {
            // No sync available (or context invalidated) — the local copy is still authoritative.
        }
    }

    function adoptSyncedSettings(values) {
        const incoming = values && values[SETTINGS_KEY];
        if (typeof incoming !== 'string' || !syncEnabled()) return false;
        if (readLocal(SETTINGS_KEY) === incoming) return false;

        const remoteStamp = Number(values[SYNC_STAMP_KEY]) || 0;
        const localStamp = Number(window.localStorage.getItem(storageKey(SYNC_STAMP_KEY))) || 0;
        if (remoteStamp <= localStamp) return false;

        suppressMirror = true;
        writeLocal(SETTINGS_KEY, incoming);
        window.localStorage.setItem(storageKey(SYNC_STAMP_KEY), String(remoteStamp));
        suppressMirror = false;

        try {
            chrome.storage.local.set({ [SETTINGS_KEY]: incoming });
            window.__GLP_ULTRA__?.applyExternalSettings(JSON.parse(incoming));
        } catch (e) {
            // Malformed remote payload — leave the running config alone.
        }
        return true;
    }

    window.GM_addStyle = function GM_addStyle(cssText) {
        const style = document.createElement('style');
        style.textContent = cssText;
        (document.head || document.documentElement).appendChild(style);
        return style;
    };

    window.GM_registerMenuCommand = function GM_registerMenuCommand(name, callback) {
        window.__glpEnhancedMenuCommands = window.__glpEnhancedMenuCommands || [];
        window.__glpEnhancedMenuCommands.push({ name, callback });
        return window.__glpEnhancedMenuCommands.length;
    };

    /**
     * Pull authoritative values written by extension pages into localStorage, then hand the
     * settings to the running engine. Returns true when something actually changed.
     */
    function syncFromExtensionStorage(values) {
        let changed = false;
        suppressMirror = true;
        MIRRORED_KEYS.forEach(key => {
            const incoming = values[key];
            if (typeof incoming !== 'string') return;
            if (readLocal(key) === incoming) return;
            writeLocal(key, incoming);
            changed = true;
        });
        suppressMirror = false;

        if (changed && typeof values.glpEnhancedSettings === 'string') {
            try {
                window.__GLP_ULTRA__?.applyExternalSettings(JSON.parse(values.glpEnhancedSettings));
            } catch (e) {
                // Malformed payload — leave the running config alone.
            }
        }
        return changed;
    }

    try {
        chrome.storage.local.get(MIRRORED_KEYS, values => {
            if (chrome.runtime.lastError) return;

            // First run inside the extension: seed chrome.storage from whatever the engine already has.
            const seed = {};
            MIRRORED_KEYS.forEach(key => {
                const local = readLocal(key);
                if (typeof values[key] !== 'string' && local !== null) seed[key] = local;
            });
            if (Object.keys(seed).length) chrome.storage.local.set(seed);

            syncFromExtensionStorage(values);
        });

        chrome.storage.sync.get([SETTINGS_KEY, SYNC_STAMP_KEY], values => {
            if (chrome.runtime.lastError) return;
            adoptSyncedSettings(values);
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                adoptSyncedSettings({
                    [SETTINGS_KEY]: changes[SETTINGS_KEY]?.newValue,
                    [SYNC_STAMP_KEY]: changes[SYNC_STAMP_KEY]?.newValue
                });
                return;
            }
            if (area !== 'local') return;
            const values = {};
            Object.entries(changes).forEach(([key, change]) => {
                if (typeof change.newValue === 'string') values[key] = change.newValue;
            });
            syncFromExtensionStorage(values);
        });
    } catch (e) {
        // Running outside an extension (plain userscript host) — localStorage only.
    }
})();
