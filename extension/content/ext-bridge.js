/**
 * Bridge between the extension surfaces (popup, options page, service worker) and the
 * engine running in this tab. Loaded after the engine so window.__GLP_ULTRA__ exists.
 */
(function () {
    'use strict';

    function engine() {
        return window.__GLP_ULTRA__ || null;
    }

    // The engine knows nothing about extension APIs; it announces the watched-thread
    // unread count on the window and this bridge is what turns it into a toolbar badge.
    window.addEventListener('glp:watch-count', event => {
        const count = Number(event.detail && event.detail.count) || 0;
        chrome.runtime.sendMessage({ type: 'glp:watch-count', count }, () => void chrome.runtime.lastError);
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const api = engine();

        switch (message && message.type) {
            case 'glp:ping':
                sendResponse({ ok: !!api, version: api ? api.version : null });
                return false;

            case 'glp:open-settings':
                if (api) api.openSettings();
                sendResponse({ ok: !!api });
                return false;

            case 'glp:diagnostics':
                sendResponse(api ? { ok: true, diagnostics: api.getDiagnostics() } : { ok: false });
                return false;

            case 'glp:open-diagnostics':
                if (api) api.openDiagnostics();
                sendResponse({ ok: !!api });
                return false;

            case 'glp:open-recovery':
                if (api) api.openRecovery();
                sendResponse({ ok: !!api });
                return false;

            case 'glp:get-state':
                sendResponse(api
                    ? { ok: true, version: api.version, settings: api.getSettings(), defaults: api.getDefaults(), lists: api.getLists() }
                    : { ok: false });
                return false;

            case 'glp:context-action':
                sendResponse(api
                    ? { ok: true, result: api.runContextAction(message.action, message.payload || {}) }
                    : { ok: false });
                return false;

            case 'glp:build-pack':
                sendResponse(api ? { ok: true, pack: api.buildPack(message.kind) } : { ok: false });
                return false;

            case 'glp:build-backup':
                sendResponse(api ? { ok: true, backup: api.buildBackup() } : { ok: false });
                return false;

            case 'glp:apply-backup':
                sendResponse(api ? { ok: true, result: api.applyBackup(message.backup) } : { ok: false });
                return false;

            case 'glp:apply-pack':
                sendResponse(api ? { ok: true, result: api.applyPack(message.pack) } : { ok: false });
                return false;

            case 'glp:patch-settings':
                if (api) {
                    api.applyExternalSettings(message.patch || {});
                    sendResponse({ ok: true, settings: api.getSettings() });
                } else {
                    sendResponse({ ok: false });
                }
                return false;

            case 'glp:watch-check':
                if (!api || typeof api.runWatcherCheck !== 'function') {
                    sendResponse({ ok: false });
                    return false;
                }
                Promise.resolve(api.runWatcherCheck())
                    .then(result => sendResponse({ ok: true, result }))
                    .catch(error => sendResponse({ ok: false, error: String(error) }));
                return true;

            default:
                return false;
        }
    });
})();
