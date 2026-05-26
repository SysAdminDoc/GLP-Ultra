(function () {
    'use strict';

    if (typeof window.GM_getValue === 'function') return;

    const STORAGE_PREFIX = 'glpEnhanced.mv3.';

    function storageKey(key) {
        return `${STORAGE_PREFIX}${key}`;
    }

    window.GM_getValue = function GM_getValue(key, defaultValue) {
        const raw = window.localStorage.getItem(storageKey(key));
        if (raw === null) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return raw;
        }
    };

    window.GM_setValue = function GM_setValue(key, value) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        window.localStorage.setItem(storageKey(key), serialized);
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
})();
