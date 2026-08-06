/**
 * Bridge between the extension surfaces (popup, options page, service worker) and the
 * engine running in this tab. Loaded after the engine so window.__GLP_ULTRA__ exists.
 */
(function () {
    'use strict';

    function engine() {
        return window.__GLP_ULTRA__ || null;
    }

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

            case 'glp:get-state':
                sendResponse(api
                    ? { ok: true, version: api.version, settings: api.getSettings(), defaults: api.getDefaults(), lists: api.getLists() }
                    : { ok: false });
                return false;

            case 'glp:patch-settings':
                if (api) {
                    api.applyExternalSettings(message.patch || {});
                    sendResponse({ ok: true, settings: api.getSettings() });
                } else {
                    sendResponse({ ok: false });
                }
                return false;

            default:
                return false;
        }
    });
})();
