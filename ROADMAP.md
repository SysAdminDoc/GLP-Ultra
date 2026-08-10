# GLP Ultra Roadmap

Actionable work only. Historical and completed roadmap material is archived in CHANGELOG.md; blocked work is kept in Roadmap_Blocked.md.

## Actionable Items

- [ ] Verification: `npm run verify` (gates + captures + both builds + structure) and a Playwright run that loads the unpacked extension and replays the real GLP captures — 83/83 checks.

- [ ] No per-feature teardown audit.

- [ ] No migration layer for stored settings.

- [ ] No TrustedTypes abstraction.

- [ ] No `@updateURL` / `@downloadURL`.

- [ ] No distribution docs.

- [ ] No options page or popup.

- [ ] No DNR ad/widget blocking.

- [ ] No cross-device settings sync.

- [ ] No accessibility pass beyond visual cleanup.

- [ ] No built-in issue capture/export bundle.

- [ ] The site CSS does not expose a clean native design-token system.

- [ ] The decoded CSS and captured document contain many generated Dark Reader variables such as `--darkreader-*` and `--d2l-*`; do not depend on them.

- [ ] Features that fetch pages must parse returned HTML with `DOMParser` and process fragments, not replace full documents.

- [ ] All network features need a shared limiter: default 1 request per second, burst 2, exponential backoff on failures, pause on hidden tabs, and cache by URL plus content hash.

SPA and routing findings:

- [ ] Hooks are `document-start`, `DOMContentLoaded`, `pageshow`, `visibilitychange`, and explicit fragment processing after same-origin fetches.

- [ ] MutationObserver should be scoped to known roots (`#forum_l`, `table.msg`, `#rightpanel_inner`, notification menu) and process `addedNodes` only. Never full-document scan on every mutation.

- [ ] Query stable selectors first.

- [ ] If no stable match, try fallback selectors and log a selector health warning.

- [ ] For high-churn surfaces, use `findElement(surfaceKey, root)` over a selector list and cache per root.

- [ ] For async surfaces, use `waitForElement(surfaceKey, { root, timeout, backoff })`.

- [ ] Never bind features directly to hashed or obfuscated class names unless they are in fallback lists.

- [ ] MutationObserver callbacks process only `addedNodes`; each added node is normalized to candidate roots and passed through relevant feature processors.

- [ ] Reprocess fragments fetched by infinite scroll with the same registry used for initial load.

- [ ] `document-start`: load settings, add `glpx-boot`, inject critical CSS, set theme/density classes.

- [ ] `DOMContentLoaded`: initialize registry, classify route, process route root.

- [ ] `pageshow`: re-run lightweight route sanity for BFCache restores.

- [ ] `visibilitychange`: pause/resume fetch queues, auto-refresh, watcher timers, shimmer/animation work.

- [ ] Infinite-scroll fetch completion: parse with `DOMParser`, extract target rows/posts, append to stable insertion point, process appended fragment.

- [ ] Queue all same-origin background fetches.

- [ ] Priorities: visible user action > preview > infinite scroll > watcher > diagnostics.

- [ ] Abort queued background work on route change.

- [ ] Backoff on 429, 403, 5xx, network failure, or repeated parse misses.

- [ ] Cache preview/export HTML by URL and content hash.

- [ ] Never post forms automatically.

- [ ] Saved HTML does not show CSP or TrustedTypes meta restrictions.

- [ ] No inline app scripts were available for hook reuse.

- [ ] The page can include third-party iframes/widgets.

Required constraints anyway:

- [ ] All string HTML goes through a single `safeHTML`/TrustedTypes-compatible policy.

- [ ] Prefer `document.createElement`, `textContent`, `replaceChildren`, and template cloning.

- [ ] Never execute page scripts or parse third-party widget scripts.

- [ ] Keep userscript data local through `GM_getValue`/`GM_setValue`.

- [ ] MV3 extension uses least-privilege host permissions for GLP only, with optional permissions for media providers if a later feature needs them.

- [ ] Custom CSS is scoped under `body.glpx-enabled` and stored as user content; provide disable/recovery path.

- [ ] Single-file delivery.

- [ ] Fast install and update through script managers.

- [ ] Lower friction for GLP power users.

- [ ] Portability across Chromium/Firefox with Tampermonkey/Violentmonkey.

MV3 extension wins for:

- [ ] `declarativeNetRequest` blocking before DOM paint.

- [ ] Toolbar popup and full options page.

- [ ] Background alarms for watcher/digest.

- [ ] `chrome.storage.local`/optional `chrome.storage.sync`.

- [ ] Context menus.

- [ ] Store distribution.

- [ ] Cleaner packaging and reviewable permissions.

- [ ] `init()` registers observers/listeners once.

- [ ] `apply()` is idempotent and accepts a root node or fragment.

- [ ] `destroy()` reverses everything: body classes, injected nodes, inline data markers, listeners, observers, timers, caches where needed.

- [ ] Features tag DOM they own with `data-glpx-owner="<featureId>"`.

- [ ] No feature reads storage directly; it receives settings from context.

- [ ] No feature performs raw fetch directly; it uses the fetch queue.

- [ ] No feature injects raw HTML directly; it uses DOM helpers or `trustedHTML`.
