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
    const MIRRORED_KEYS = [
        'glpEnhancedSettings',
        'glpMutedUsers',
        'glpBlockedUsers',
        'glpHiddenThreads',
        'glpUserTags'
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

    window.GM_getValue = function GM_getValue(key, defaultValue) {
        const raw = readLocal(key);
        if (raw === null) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return raw;
        }
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
    };

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

        chrome.storage.onChanged.addListener((changes, area) => {
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
