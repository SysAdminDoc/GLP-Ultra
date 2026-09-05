# GLP Ultra Roadmap

Actionable work only. Historical and completed roadmap material is archived in CHANGELOG.md; blocked work is kept in Roadmap_Blocked.md.

## Actionable Items

No current actionable items.

## Research-Driven Additions

Added 2026-09-05 from the research pass recorded in RESEARCH.md. Item ids start a new `GU-` series;
the tracker had no prior scheme.

### P0

- [ ] P0 — GU-001 Handle `QuotaExceededError` on every localStorage write and reconcile the sanitizer ceilings with the 5 MiB origin limit
  Why: `writeLocal` has no try/catch, and the sanitizers accept more data than the store can hold, so a heavy reader eventually hits a throw that the engine's own catch turns into "everything reset to defaults".
  Evidence: `extension/content/gm-shim.js:46-48` (no try/catch); `src/glp-ultra.user.js:920` (`maxItems = 5000`), `:976`/`:985` (5,000 tags x 2,000-char notes); MDN storage quotas, ~5 MiB per origin. The identical silent-reset failure shape is recorded in CLAUDE.md for 2026-08-06.
  Touches: `extension/content/gm-shim.js`, `src/glp-ultra.user.js` (`sanitizeStringList`, `sanitizeUserTags`, `sanitizeHiddenThreadTitles`, `writeFeatureStore`), Recovery panel.
  Acceptance: a test that fills the origin to the quota and then writes shows a visible warning naming the store that could not be saved, the engine keeps running with its in-memory state, and the sum of every sanitizer ceiling is documented to sit under 5 MiB. Reverting the try/catch makes the test fail.
  Complexity: M

- [ ] P0 — GU-002 Move the service worker's `watchCounts` map into `chrome.storage.session`
  Why: it is module-scope state in an MV3 worker that Chrome terminates after 30 seconds idle, so watched-thread unread badges silently revert to the plain "on" marker.
  Evidence: `extension/background/service-worker.js:137` (`const watchCounts = new Map()`), read at `:140`, written at `:154`; Chrome service worker lifecycle documents a 30-second idle timeout and names `chrome.storage.session` as the persistence answer.
  Touches: `extension/background/service-worker.js`, `scripts/verify-runtime.mjs`.
  Acceptance: a runtime check sets a watch count, forces the worker to terminate (`chrome.processes` or an idle wait), wakes it with a tab update, and reads the same badge text back. The check fails against the current `Map` implementation.
  Complexity: S

- [ ] P0 — GU-003 Clear the toolbar badge when a tab navigates away from GLP
  Why: without the `tabs` permission `tab.url` is omitted for non-GLP URLs, so `chrome.tabs.onUpdated` returns early and the stale unread count stays on the toolbar for every other site in that tab, which is the opposite of the handler's stated intent.
  Evidence: `extension/background/service-worker.js:164-168`, comment on `:163` reads "Keep the toolbar button quiet on unrelated sites"; `chrome.tabs` docs gate `Tab.url` on host permission for that tab.
  Touches: `extension/background/service-worker.js`, `scripts/verify-runtime.mjs`.
  Acceptance: navigating a tab from a GLP capture to `about:blank` leaves the action badge empty. Confirm the cause before fixing (log whether `tab.url` is actually undefined off-origin), then treat `tab.url === undefined` as off-GLP rather than as unknown.
  Complexity: S

### P1

- [ ] P1 — GU-004 Ship a signed, permanently installable Firefox artifact
  Why: the README tells Firefox users to load the zip through `about:debugging` as a temporary add-on, which Firefox discards on restart, and an unsigned XPI cannot be installed on Release or Beta at all. Today the Firefox lane produces nothing a real user can keep.
  Evidence: Mozilla Extension Workshop signing overview ("unsigned extensions cannot be installed on release or beta Firefox versions"; self-distributed signing is free and automated, up to 24 hours to sign); `README.md` Firefox section; `scripts/build-firefox.mjs`.
  Touches: `scripts/build-firefox.mjs`, `package.json` (a `sign:firefox` script wrapping `web-ext sign --channel=unlisted`), `README.md`, release process.
  Acceptance: `npm run package:firefox` produces an `.xpi` that installs on current Firefox Release from the local filesystem and survives a browser restart. Keep the existing `glp-ultra@sysadmindoc.github.io` gecko id so any current install keeps its profile data.
  Complexity: M

- [ ] P1 — GU-005 Raise `strict_min_version` off the unsupported ESR 128 line and record the reason
  Why: 128 is a dead ESR line, so the floor excludes nobody on a supported browser while still forcing feature detection around `<dialog>`, `popover`, `:has()`, and `content-visibility`. `verify-extension.mjs` only checks that the key exists, so the stale value sails through.
  Evidence: `scripts/build-firefox.mjs` (`MIN_FIREFOX = '128.0'`); `scripts/verify-extension.mjs:101` (existence check only); https://endoflife.date/firefox.
  Touches: `scripts/build-firefox.mjs`, `scripts/verify-extension.mjs`, `CLAUDE.md`.
  Acceptance: the floor names a currently supported ESR line, the gate asserts the exact expected value rather than mere presence, and a one-line comment in `build-firefox.mjs` states which ESR line it tracks and where to re-check it.
  Complexity: S

- [ ] P1 — GU-006 Add a Firefox runtime lane with Puppeteer, and update Roadmap_Blocked.md
  Why: `Roadmap_Blocked.md` records Firefox behavioural verification as blocked on tooling. That is no longer true. The Gecko variant is currently gated structurally only, so a Firefox-only regression cannot be caught anywhere.
  Evidence: Puppeteer PR #13810 adds `Browser.installExtension` over WebDriver BiDi `webExtension.install`; Firefox support stable since Puppeteer 23. Playwright still cannot load Firefox extensions.
  Touches: new `scripts/verify-runtime-firefox.mjs`, `package.json`, `Roadmap_Blocked.md`, `README.md` (drop the "never machine-verified" caveat once it is).
  Acceptance: a Puppeteer run installs `dist/extension-firefox/`, replays both MHTML captures, and asserts at least the smoke set the Chromium harness covers: engine present, route classified, no feature errors, settings survive a reload. The Firefox entry leaves `Roadmap_Blocked.md`.
  Complexity: L

- [ ] P1 — GU-007 Give the extension build an update path
  Why: Chrome never applies `update_url` to an unpacked extension, so every extension user is frozen at whatever version they extracted, with no signal that a newer one exists. The userscript lane has `@updateURL`; the extension lane has nothing.
  Evidence: Chrome autoupdate docs and the chromium-extensions guidance thread both state unpacked developer-mode installs do not auto-update; `README.md` install steps; `extension/manifest.json` has no `update_url`.
  Touches: `extension/background/service-worker.js`, `extension/popup/`, `extension/options/`, `extension/manifest.json` (`optional_permissions` for the release host).
  Acceptance: an opt-in check compares `chrome.runtime.getManifest().version` against the latest GitHub release tag at most once a day and shows an "update available" row with a link in the popup and options page. It is off until the user grants the optional host permission, it fetches data and never code, and `npm run check`'s no-remote-code gate still passes.
  Complexity: M

- [ ] P1 — GU-008 Give the three vacuous runtime assertions a positive control
  Why: each is labelled as proving something it cannot fail to prove, and the project has already been burned twice by exactly this pattern.
  Evidence: `scripts/verify-runtime.mjs:637` (asserts `chrome.storage.sync` is empty on a fresh temp profile, where it is empty regardless); `:254` and `:426` (`(diag?.errors || []).length === 0` passes when `diag` is undefined, unlike `:255`/`:436` which correctly use `?? -1`); `:1542-1543` (`parseFloat(...) || 0` with `.catch(() => -1)` asserted `>= 0`, which only proves the element exists).
  Touches: `scripts/verify-runtime.mjs`.
  Acceptance: the sync check turns sync on, writes, asserts the key is present, turns sync off, clears, then asserts absence. The error checks fail when diagnostics are unreachable. The countdown check asserts movement only. Each rewritten assertion is proven capable of failing by planting the defect it names.
  Complexity: S

- [ ] P1 — GU-009 Gate the `apply: () => {}` bug class and assert the registry entry count
  Why: the lifecycle gate was written after a bug where seven features needed a page reload because their `apply` was defused, and it still does not check for it. Its entry regex also requires a one-line object literal, so a reformatted entry leaves the gate silently instead of failing it.
  Evidence: `scripts/verify-lifecycle.mjs:26` (checks only that `apply:` appears), `:30` (matches the single exact spelling `destroy: () => {}`), `:19` (`[^\n]*\}` requires one line), no expected-count assertion anywhere.
  Touches: `scripts/verify-lifecycle.mjs`.
  Acceptance: the gate fails on `apply: () => {}` and on the whitespace and method-shorthand variants of an empty handler, and it fails when the number of matched entries differs from the number of `id:` occurrences inside the registry slice. Planting each defect in turn makes it exit non-zero.
  Complexity: S

- [ ] P1 — GU-010 Own the elements features guard on, instead of keying off a bare id
  Why: seven features skip creation when `document.getElementById('<their id>')` matches anything, and remove that same id on teardown. Page content carrying a colliding id kills the feature and lets teardown delete a site element. The correct primitive already exists and is used by only 7 of 41 features.
  Evidence: `src/glp-ultra.user.js:6202, 6676, 7401, 8304, 8502, 8635` (id guards); `markFeatureOwned` required by `scripts/verify-lifecycle.mjs:41` but present 7 times in the engine; OWASP browser-extension cheat sheet on treating host-page data as untrusted.
  Touches: `src/glp-ultra.user.js` (the seven guards and their matching `destroy` handlers), `scripts/verify-runtime.mjs`.
  Acceptance: a capture-replay check injects `<div id="glp-back-to-top">` into post content before startup; the feature still mounts its own surface, teardown removes only the surface it created, and the injected node survives. Repeat for one more of the seven.
  Complexity: M

- [ ] P1 — GU-011 Support `forced-colors: active`
  Why: the product ships a `highContrast` setting but never handles the OS-level forced-colors mode, where the UA discards `box-shadow` and non-URL `background-image`, so any state signalled that way vanishes. This is the standing blind spot for every restyling extension.
  Evidence: no `forced-colors` occurrence anywhere in `src/glp-ultra.user.js` (only `prefers-reduced-motion` at `:2089`); MDN `forced-colors` media feature.
  Touches: `src/glp-ultra.user.js` theme/accessibility CSS layer, `scripts/verify-runtime.mjs` or `scripts/verify-options.mjs`.
  Acceptance: under Playwright's `forcedColors: 'active'`, every injected control keeps a visible border in a system colour, no state is conveyed by background colour alone, and toolbar buttons remain distinguishable from each other. Rules go in the same last-emitted accessibility layer the existing toggles use so they beat the theme.
  Complexity: M

- [ ] P1 — GU-012 Surface the read position the watcher already records, and extend it past watched threads
  Why: the data exists and nothing shows it. `lastSeenPost` is tracked per watched thread and drives the unread delta count, but no post is ever marked as new in the page and there is no jump to the first unread. Threads the reader has not explicitly watched record nothing at all, so reopening a 400-post thread gives no idea where you stopped. This is the one table-stakes forum-reader behaviour missing here.
  Evidence: `src/glp-ultra.user.js:8830, 8872, 8899, 8978-8979` (`lastSeenPost` maintained on `glpWatchedThreads` only), `:1018` (already sanitised as a non-negative integer), `:996` (`sanitizeWatchedThreads`); no in-page rendering of it anywhere. RES ships `readComments` and `newCommentCount`; 4chan X advertises "remember your last read post in a thread".
  Touches: `src/glp-ultra.user.js` (new registry entry rendering the marker, `lastSeenPost` write path extended to visited threads), settings schema, `extension/content/gm-shim.js` `MIRRORED_KEYS`, backup format.
  Acceptance: opening a thread, scrolling partway, leaving, and returning marks every post after the recorded position as new and offers a jump to the first one. It works on a thread that was never explicitly watched. The visited-thread store is capped, reconciled with GU-001, and included in a format-3 backup. Reuse `lastSeenPost` rather than adding a second read-position concept.
  Complexity: M

- [ ] P1 — GU-030 Route document- and window-level listeners through the tracked helper, and gate it
  Why: a confirmed teardown leak. `media.hoverPreview` adds three global listeners on init and its destroy removes only two, so turning the feature off leaves a `scroll` handler on `window` calling `hideMediaPreview()` for the life of the page. The lifecycle gate requires `addFeatureEventListener` to exist but never asserts any feature uses it, and 12 document/window listeners are registered directly against 10 that go through the helper.
  Evidence: `src/glp-ultra.user.js:9413-9415` (adds `mouseover`, `mouseout`, and `scroll`), `:9420-9421` (removes only `mouseover` and `mouseout`; no `removeEventListener` for `hideMediaPreview` exists anywhere in the file); `scripts/verify-lifecycle.mjs:39` requires the helper's definition only.
  Touches: `src/glp-ultra.user.js` (`initMediaHoverPreview` and its destroy, plus the other direct global registrations that belong to a toggleable feature), `scripts/verify-lifecycle.mjs`.
  Acceptance: toggling `media.hoverPreview` off removes every listener it added, provable by counting `getEventListeners`-equivalent state or by asserting the handler no longer fires after teardown. The engine-lifetime listeners (`visibilitychange`, `pageshow`, `popstate`, `hashchange`, `DOMContentLoaded`, `contextmenu`) stay direct and are listed as deliberate exceptions in the gate. The gate fails when a feature registers a document or window listener outside the helper and outside that list.
  Complexity: M

### P2

- [ ] P2 — GU-013 Local full-text search across threads you have exported or visited
  Why: full-text search over a permanent archive is the single feature Instapaper Premium, Readwise Reader, and Matter Premium all put behind a paywall, and all three charge for it because it needs server-side storage. A local-only reader needs none, so this is a free leapfrog rather than parity.
  Evidence: Instapaper Premium $5.99/mo, Readwise Reader $119.88/yr, Matter Premium $8/mo, all gating full-text search plus permanent archive; the engine already produces structured JSON exports (`thread.export`).
  Touches: `src/glp-ultra.user.js` (export path, a new index store), options page (a search destination), `extension/content/gm-shim.js`.
  Acceptance: exporting a thread adds it to a local index; a search box returns matching posts with thread title, author, and a link back; the index respects an explicit size cap and can be cleared from the Recovery panel with undo. No network request is made.
  Complexity: XL

- [ ] P2 — GU-014 Save individual posts to a local list
  Why: RES ships `saveComments` and it is the most-requested primitive the moderation surface does not cover. GLP Ultra can hide a post or its author but cannot keep one.
  Evidence: RES module list (`lib/modules/saveComments.js`); no `savedPost`/`bookmark` occurrence in `src/glp-ultra.user.js`.
  Touches: `src/glp-ultra.user.js` (post action row, new bounded store), settings schema, backup format, Recovery panel.
  Acceptance: a save action on any post adds it to a searchable list reachable from the options page, each entry restores to its permalink, the list is capped and backed up, and removal is undoable like the existing local lists.
  Complexity: M

- [ ] P2 — GU-015 Apply `content-visibility: auto` to post and feed rows
  Why: threads run to hundreds of posts and the product adds infinite scroll on top, so the browser lays out and paints everything off-screen. `content-visibility: auto` with `contain-intrinsic-size` is the cheapest available fix and is Baseline.
  Evidence: web.dev Baseline note for `content-visibility` (Chrome 85+, Firefox 125+, Safari 18.1+), reporting initial render dropping from 232ms to 30ms on long repeating lists; `src/glp-ultra.user.js` has `thread.infiniteScroll` and `feed.infiniteScroll` registry entries.
  Touches: `src/glp-ultra.user.js` CSS layer.
  Acceptance: post rows and feed rows carry `content-visibility: auto` plus a `contain-intrinsic-size` matching the measured median row height, in-thread quick search and browser find-in-page still reach off-screen posts, and a measured before/after on the thread capture shows a reduced initial layout cost. Gate the floor decision on GU-005.
  Complexity: M

- [ ] P2 — GU-016 Add an accessibility gate over the injected UI
  Why: no major extension in this category publishes accessibility CI, and the options gate currently makes exactly one accessibility assertion. Regressions in the injected forum UI are invisible today.
  Evidence: `scripts/verify-options.mjs:127` is the only `aria` assertion in any gate; `@axe-core/playwright` is the maintained Deque wrapper and injects into an already-navigated page, which is what a content-script UI needs.
  Touches: `package.json` (devDependency), new `scripts/verify-a11y.mjs`, `scripts/verify-runtime.mjs`.
  Acceptance: axe runs scoped to injected selectors on the feed capture, the thread capture, and the in-page settings panel, with zero serious or critical violations. Planting a missing accessible name on an icon-only button makes it fail.
  Complexity: M

- [ ] P2 — GU-017 Verify the forum surfaces at a narrow viewport
  Why: the README claims toolbars "wrap into touch-friendly rows on narrow screens instead of covering posts or forcing horizontal scroll", and no gate checks it. The engine's narrowest breakpoint is 700px, so nothing below that has ever been exercised.
  Evidence: `scripts/verify-runtime.mjs` contains no `1920` and no viewport override; breakpoints at `src/glp-ultra.user.js:1719, 2068, 2580, 3231, 4664, 4684`; `scripts/verify-options.mjs` does cover both desktop sizes (`:48`, `:278`).
  Touches: `scripts/verify-runtime.mjs`, `src/glp-ultra.user.js` CSS layer.
  Acceptance: the thread and feed replays run at 390x844 as well as 1440x900 and assert no horizontal document overflow, no toolbar overlapping post text, and every toolbar control reachable. Either the claim is proven or the README drops it.
  Complexity: M

- [ ] P2 — GU-018 Build filters by pointing at the page instead of typing a keyword
  Why: keyword filters are the only way to hide something the product has no dedicated toggle for, and they require the reader to guess a string. uBlock Origin's element picker is the proven interaction: point, get a suggested rule, preview the effect, then commit.
  Evidence: https://github.com/gorhill/uBlock/wiki/Element-picker; `src/glp-ultra.user.js` `feed.keywordFilters` is text-entry only.
  Touches: `src/glp-ultra.user.js` (new picker surface reusing the existing context-action path), settings schema, Recovery panel.
  Acceptance: a picker mode highlights the row or post under the pointer, proposes a rule expressed in the product's own vocabulary (author, thread title fragment, or forum row) rather than a raw CSS selector, previews what disappears before committing, and the resulting rule appears in the existing filter list and Noise budget breakdown, restorable from Recovery.
  Complexity: L

- [ ] P2 — GU-019 Add a feature-rename resolver
  Why: 41 registry entries and 141 settings keyed by string. Any rename orphans stored state silently, and there is no map from historical ids to current ones. Refined GitHub treats this as a prerequisite at feature scale.
  Evidence: https://github.com/refined-github/refined-github (`feature-data.ts` maps historical ids); `src/glp-ultra.user.js` has a schema-version migration path but no id alias table.
  Touches: `src/glp-ultra.user.js` (migration), `scripts/build-userscript.mjs` (schema generation), `scripts/verify-lifecycle.mjs`.
  Acceptance: a declared alias table maps old setting keys and feature ids to current ones, migration consults it, and the build fails when a setting key present in the previous released schema is absent from both the current schema and the alias table.
  Complexity: M

- [ ] P2 — GU-020 Add a user-run feature bisect to the diagnostics panel
  Why: the site cannot be reached by automation, the tracker has never received a report, and 41 features can hide a breakage. Bisect moves triage to the only person who can reproduce it, in about seven reloads.
  Evidence: https://github.com/refined-github/refined-github (`bisect.tsx`, `ceil(log2(n)) + 1` steps); this repo's tracker is empty (GitHub API, 2026-09-05), and the diagnostics issue bundle already exists.
  Touches: `src/glp-ultra.user.js` (diagnostics panel, a session-scoped bisect state), `extension/popup/`.
  Acceptance: starting a bisect snapshots the enabled set, halves it per reload, ends by naming one feature or by reporting "could not identify" rather than blaming the survivor, and always restores the original settings on finish or cancel. The result is included in the diagnostics issue bundle.
  Complexity: L

- [ ] P2 — GU-021 Move overlays onto `<dialog>` and the Popover API
  Why: the engine hand-rolls every overlay, including the settings panel, lightbox, and tag picker, which means hand-rolled focus handling, stacking against the site's z-indexes, and no light dismiss. Both primitives are Baseline and cover Escape without registering a key handler, which matters under the no-shortcuts house rule.
  Evidence: zero `popover`, `showModal`, or `<dialog>` occurrences in `src/glp-ultra.user.js`; `popover` Baseline since 2025-01-27 (Chrome 116 / Firefox 125), `<dialog>` and `::backdrop` widely available since 2024-09-14.
  Touches: `src/glp-ultra.user.js` (settings panel, lightbox, tag picker, noise panel, recovery shelf), `scripts/verify-runtime.mjs`.
  Acceptance: each overlay opens in the top layer, dismisses on Escape and on outside click without a registered key handler, restores focus to the control that opened it, and cannot be covered by site CSS. Depends on GU-005 for the Firefox floor. Keep the safe-mode escape hatch outside the dialog layer so custom CSS still cannot lock the reader out.
  Complexity: L

- [ ] P2 — GU-022 Export a thread as one self-contained file
  Why: the HTML export references remote media, so it stops working when the images move or the reader is offline. A single file that opens in any browser with nothing installed is the format people actually keep.
  Evidence: https://github.com/gildas-lormeau/SingleFileZ (self-extracting ZIP, valid ZIP and valid HTML at once, opens with no extension, ~30% smaller than inlined HTML); https://github.com/Y2Z/monolith (data-URI inlining); the product already builds a media manifest (`exportMediaManifest`).
  Touches: `src/glp-ultra.user.js` export path, settings schema, `scripts/verify-runtime.mjs`.
  Acceptance: an export option produces one file that renders the thread offline with images intact and no network requests, the existing media manifest drives the inlining, and the size cost is stated in the export UI before the user commits. Learn the format from SingleFileZ; do not copy its AGPL code into this MIT repo.
  Complexity: L

- [ ] P2 — GU-023 Test the `declarativeNetRequest` rules in CI
  Why: the nine ad rules are asserted structurally (scoped to the right initiator) but never evaluated. `testMatchOutcome` exists for exactly this and needs a permission the manifest does not request.
  Evidence: `scripts/verify-extension.mjs:86` checks scoping only; `extension/manifest.json` requests `declarativeNetRequest` but not `declarativeNetRequestFeedback`; `extension/rules/ad-network.json` holds 9 rules.
  Touches: `extension/manifest.json`, `scripts/verify-runtime.mjs`.
  Acceptance: the runtime harness calls `testMatchOutcome` for each of the nine domains with a GLP initiator and asserts a block, and for a control URL and a non-GLP initiator and asserts no match. Add the permission to the Chrome build only if it can be kept out of the shipped manifest; otherwise document why it is present.
  Complexity: M

### P3

- [ ] P3 — GU-024 Decide the i18n question and write the answer down
  Why: there is no i18n layer at all (zero `chrome.i18n` or `getMessage` calls in the engine or the options page) and roughly 141 setting labels plus 23 section descriptions are hardcoded English. For a single English-language forum that is probably correct, but the decision is currently implicit and will be re-proposed by every future reviewer.
  Evidence: `grep -c "chrome.i18n\|getMessage"` returns 0 for both `src/glp-ultra.user.js` and `extension/options/options.js`; the target site serves English only.
  Touches: `README.md` or `CLAUDE.md`.
  Acceptance: one short paragraph states that the product is English-only because the target site is, names what would have to change if that stops being true (`_locales`, a message-key pass over the generated schema), and the settings schema keeps using `Intl` for dates and numbers rather than hardcoded formats.
  Complexity: S

- [ ] P3 — GU-025 Validate the shape of the page-reachable `glp:watch-count` event
  Why: `ext-bridge.js` listens for a DOM event on `window`, which page-world script can dispatch, so any script on the page can set an arbitrary toolbar badge count. Low severity because the extension only runs on one site, but the channel has no validation at all.
  Evidence: `extension/content/ext-bridge.js:14-17`; content scripts and page share the DOM event path.
  Touches: `extension/content/ext-bridge.js`, `src/glp-ultra.user.js` (dispatch site).
  Acceptance: the bridge accepts the event only when it carries a marker the engine mints per page load, clamps the count to a sane range, and ignores anything else. A test dispatching a forged event from the page world leaves the badge unchanged.
  Complexity: S

- [ ] P3 — GU-026 Delete or document the pass-through Trusted Types policy
  Why: `createHTML: value => String(value)` sanitizes nothing, and content scripts run in the isolated world where page CSP does not apply, so the policy reads as a safety control while providing none.
  Evidence: `src/glp-ultra.user.js:335-350`; the engine has only three `innerHTML` occurrences total (`:351`, `:6155`, `:9600`).
  Touches: `src/glp-ultra.user.js`.
  Acceptance: either the policy is removed along with its single call site, or a comment states that it exists only to satisfy a future page-level `require-trusted-types-for` header and performs no sanitisation by design.
  Complexity: S

- [ ] P3 — GU-027 Declare `minimum_chrome_version`
  Why: the manifest declares no floor, so the extension installs on Chrome versions that predate APIs it uses and fails in ways the diagnostics panel cannot explain.
  Evidence: `extension/manifest.json` has no `minimum_chrome_version`; the build relies on `chrome.storage.session` after GU-002 (Chrome 102), `declarativeNetRequest.updateEnabledRulesets`, and the 30-second alarm floor (Chrome 120).
  Touches: `extension/manifest.json`, `scripts/verify-extension.mjs`.
  Acceptance: the manifest names a floor justified by the newest API the code actually calls, and the extension gate asserts that exact value so it cannot drift from the code.
  Complexity: S

- [ ] P3 — GU-028 Give the userscript a first-run and post-update surface, and Greasy Fork metadata
  Why: the extension opens the options page on install (`service-worker.js:95-97`) and the userscript gets nothing. `updateNotices` names new settings after an upgrade but there is no first-run moment at all in the userscript lane, which is the only lane that reliably reaches users today.
  Evidence: `extension/background/service-worker.js:95-97` (extension only); `src/glp-ultra.user.js:1246` (`updateNotices` fires only on version change); Greasy Fork reads `@license`, `@supportURL`, and `@antifeature` from the metadata block.
  Touches: `src/glp-ultra.user.js` (first-run notice), `scripts/build-userscript.mjs` (metadata block), `scripts/verify-extension.mjs`.
  Acceptance: a first-run notice appears once, points at the settings panel and the safe-mode escape hatch, and never reappears. The generated metadata block carries `@license MIT` and `@supportURL`, and the build gate asserts both, matching how it already gates `@updateURL` and `@downloadURL`.
  Complexity: S

- [ ] P3 — GU-029 Record the distribution posture as a deliberate decision
  Why: `Roadmap_Blocked.md` frames store listing as blocked on a decision, but the decision has real security value that is nowhere written down, and the Chrome and Firefox cases are no longer the same after GU-004.
  Evidence: the December 2024 campaign compromised Cyberhaven and 30-plus other extensions through a phished OAuth grant on a Chrome Web Store developer account, defeating MFA; Edge is phasing out MV2 through the end of 2026, which moves users; CWS registration is a one-time $5.
  Touches: `Roadmap_Blocked.md`, `README.md`.
  Acceptance: the file separates the Chrome case (no store account is an asset, not just an omission) from the Firefox case (unlisted signing is free, automated, and needs no listing), and states what would change the Chrome answer. Note the Edge MV2 timeline as context rather than as a reason.
  Complexity: S
