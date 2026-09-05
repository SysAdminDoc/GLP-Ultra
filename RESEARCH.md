# Research — GLP Ultra

Date: 2026-09-05. Replaces all prior research (the previous file was dated 2026-08-13, before v3.8.2/3.8.3).

Confidence labels used below: **Verified** (read in this repo or in a primary source), **Likely**
(strong secondary evidence), **Needs live validation** (cannot be confirmed without the running
site or a headed browser).

## Executive summary

GLP Ultra is a single-site reading layer for godlikeproductions.com, shipped as an MV3 extension
and a Tampermonkey userscript generated from one 10,646-line dependency-free source. Its strongest
asset is not any single feature. It is the discipline around them: a generated settings schema that
cannot drift from the engine, per-feature error isolation, a selector registry checked against real
captured pages, and a 219-check runtime replay. Very few site enhancers of this size have any of
that. The weak points are all on the outside edges rather than in the engine, and they cluster in
three places: **storage has no failure path**, **the Firefox and extension distribution lanes are
effectively broken for real users**, and **the product never shows you what is new in a thread you
have already read**, which is the one thing every comparable forum enhancer does. That last one is
closer than it looks: the engine already stores a per-thread read position and only ever uses it to
compute a number.

Top opportunities in priority order:

1. localStorage writes have no quota handling, and the sanitizer ceilings exceed the 5 MiB origin
   limit they write into (`extension/content/gm-shim.js:46`).
2. The service worker keeps unread badge counts in a module-scope `Map` that Chrome discards after
   30 seconds idle (`extension/background/service-worker.js:137`).
3. Firefox cannot install the artifact the README tells users to install permanently. Unsigned XPIs
   are refused on Release and Beta with no override.
4. Extension users get no updates at all. Unpacked extensions never honour `update_url`.
5. The read position is recorded and never shown. `lastSeenPost` is maintained on watched threads
   and drives the unread count, but no post is ever marked as new in the page.
6. Three verification assertions pass vacuously, including the one guarding the sync boundary.
7. `strict_min_version: 128.0` pins the Firefox build to an unsupported ESR line and blocks the
   platform features that would delete hand-rolled code.
8. No `forced-colors` support, despite shipping a high-contrast setting.
9. Feature re-entry guards key off bare element ids that page content can collide with.
10. Local full-text search over threads you have read is what the paid reading apps charge for, and
    a fully local extension can give it away.

## Product map

**Core workflows**

- Read a thread with less noise: reader mode, collapsed quotes, post numbers, permalinks, OP
  highlighting, media lightbox.
- Triage the feed: sort toolbar, keyword filters, hidden threads, freshness colours, hot badges,
  infinite scroll, auto-refresh.
- Moderate your own experience: mute by name, block by numeric user id, per-user tags and notes,
  reaction-GIF and image-only-reply filters, with a recovery shelf that restores any of it.
- Keep track of threads: watcher with unread deltas, MV3 alarm scheduling, toolbar badge.
- Take a thread with you: Markdown / HTML / JSON export with a media manifest, plus full backup and
  restore.

**Personas.** One primary: a heavy anonymous reader of a single old-school PHP forum who wants the
page to stop shouting. A secondary maintainer persona (the author) uses the diagnostics panel and
selector-health drift warnings. There is no logged-in-poster persona served today, because the
composer, profile, and notification routes were never captured (`Roadmap_Blocked.md`).

**Platforms and distribution.** Chrome/Edge/Brave via an unpacked zip from GitHub Releases; Firefox
via a temporary add-on; Tampermonkey/Violentmonkey via a raw GitHub userscript with `@updateURL`.
No store listing anywhere. Of those three, only the userscript lane actually works end to end for a
non-technical user, and that is the finding with the widest blast radius in this document.

**Integrations and data flows.** Zero network egress except the engine's own same-origin fetch queue
(one raw `fetch`, gated by `verify-lifecycle.mjs:78`). Storage is localStorage first (synchronous, to
avoid a FOUC), mirrored to `chrome.storage.local`, with an opt-in settings-only mirror to
`chrome.storage.sync`. Nine `declarativeNetRequest` rules, every one scoped to
`initiatorDomains: ["godlikeproductions.com"]`.

## Competitive landscape

Repo statistics fetched from the GitHub API on 2026-09-05.

| Project | Signal | Does well | Take from it | Avoid |
| --- | --- | --- | --- | --- |
| [Refined GitHub](https://github.com/refined-github/refined-github) | 32,059★, MIT, 83 open issues | The reference architecture for a large per-feature enhancer against a moving host | Feature-rename resolver so a renamed feature does not orphan stored state; a user-run bisect that halves the enabled feature set per reload; per-feature `init(signal)` teardown through an `AbortSignal` | Its remote broken-feature CSV feed fetches from a live host. GLP Ultra's no-remote-code rule is a build gate, so copy the bisect and the rename map, not the feed |
| [Reddit Enhancement Suite](https://github.com/honestbleeps/Reddit-Enhancement-Suite) | 4,513★, GPL-3.0, **683 open issues** | The canonical feature taxonomy for forum reading: `newCommentCount`, `readComments`, `saveComments`, `commentNavigator`, `userTagger`, `troubleshooter`, `presets` | `readComments` + `newCommentCount` is the behaviour to finish here, since the read position is already stored. `saveComments` has no equivalent at all. Also its `advanced: true` option tier, which hides a power-user setting without deleting it | 683 open issues at 4,513 stars against Refined GitHub's 83 at 32,059 is roughly a 60x worse open-issues-per-star ratio. Past ~100 features, triage tooling stops being optional, and GLP Ultra is at 141 settings |
| [4chan X](https://github.com/ccd0/4chan-x) | 1,152★, 1,012 open issues, last push 2026-08-27 | Thread watcher, filters, quote backlinks, and explicitly "remember your last read post in a thread" | Last-read-post memory, and marking your own posts | 1,012 open issues is the same untriaged-backlog failure mode as RES |
| [uBlock Origin](https://github.com/gorhill/uBlock) | 67,577★, 15 open issues | [Element picker](https://github.com/gorhill/uBlock/wiki/Element-picker): point at a thing, get a suggested filter, preview the effect before committing | GLP Ultra's keyword filters require typing. A point-and-preview filter builder is the single biggest usability jump available to the filtering surface | The zapper's temporary-removal mode is a separate concept; do not merge the two |
| [SingleFile](https://github.com/gildas-lormeau/SingleFile) | 22,316★, AGPL-3.0 | [Self-extracting ZIP](https://github.com/gildas-lormeau/SingleFileZ): one file that is simultaneously a valid ZIP and a valid HTML page, opens in any browser with no extension, ~30% smaller than inlined HTML | The best "keep this thread forever" share format. GLP Ultra's HTML export currently references remote media rather than carrying it | AGPL-3.0. Learn the format, do not lift the code into an MIT repo |
| [monolith](https://github.com/Y2Z/monolith) | 15,464★, CC0 | Single-file HTML with everything inlined as data URIs, no JS | Simplest correct implementation of "one file, no dependencies" for the export path | CLI-only, last push 2026-05-25 |
| [ArchiveBox](https://github.com/ArchiveBox/ArchiveBox) | 28,234★, MIT | Multi-format archiving with a durable local index | The index is the product, not the capture. Applies directly to thread export | Server-shaped. Do not grow a daemon |
| [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) | 5,134★, MIT, 261 open issues | Template-driven capture with user-editable extraction rules | Export templates the reader can edit beat a fixed Markdown shape | 261 open issues, mostly per-site extraction drift. A fixed selector registry plus drift warnings is the better answer for a single-site tool |
| [Violentmonkey](https://github.com/violentmonkey/violentmonkey) | 8,828★, MIT | Actively maintained userscript host, last push 2026-09-03 | The userscript lane is the one distribution channel here that genuinely works; treat it as primary | — |
| [Tampermonkey](https://github.com/Tampermonkey/tampermonkey) | 5,713★, repo last pushed 2025-03-30 | Largest install base | The public repo is issues-only and quiet; do not read repo activity as product activity | — |
| [Stylus](https://github.com/openstyles/stylus) | 6,866★, GPL-3.0 | Per-site CSS with a safe editor and import/export of styles | Its style-sharing model is the precedent for GLP Ultra's theme packs | — |
| Instapaper Premium / Readwise Reader / Matter Premium | Commercial | All three paywall the same thing: **full-text search over a permanent archive** ([Instapaper $5.99/mo](https://www.marqly.com/compare/instapaper-vs-readwise-reader), [Readwise Reader $119.88/yr](https://gleamr.io/blog/readwise-reader-pricing-2026), [Matter $8/mo](https://keep.md/compare/matter-vs-readwise-reader)) | The moat they charge for is server-side storage and sync. A local-only reader needs neither. Local search over threads you have visited is a free leapfrog | Do not chase TTS, AI summarising, or newsletter ingestion. Those are the parts that need a backend |

**What the landscape says.** Nobody is competing for this site. There is no maintained direct
competitor, which the 2026-08-13 pass also concluded. That means priority has to come from
structural evidence and from category table-stakes, not from a rival's feature list. The category
table-stakes GLP Ultra is missing is read tracking. The category leapfrog available to it is local
search over what it has already exported.

## Reported issues

`SysAdminDoc/GLP-Ultra` has issues enabled and **zero open issues, zero closed issues, zero pull
requests, zero forks, and zero stars** (GitHub API, 2026-09-05). There is no tracker signal.

This is not evidence of quality. Below a few hundred stars, the absence of bug reports carries no
information, and this repo has never had an outside contributor. Two consequences for
prioritisation:

- Every roadmap item below is sourced from code, from a primary platform document, or from a
  comparable project. None claims user demand it cannot show.
- The highest-value thing the project can build for itself is the report *generator*, not the report
  *request*. The diagnostics issue bundle already does most of this. A user-run bisect (Refined
  GitHub's `bisect.tsx` pattern) would finish it, and it moves triage to the only person who can
  reproduce a bug on a site that automation cannot reach.

## Security, privacy, and reliability

**Storage has no failure path (Verified).** `writeLocal` calls `localStorage.setItem` with no
try/catch (`extension/content/gm-shim.js:46-48`). localStorage is
[~5 MiB per origin](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
and throws `QuotaExceededError` past it. The sanitizer ceilings do not reconcile with that limit:
`sanitizeUserTags` accepts 5,000 entries each carrying a 2,000-character note
(`src/glp-ultra.user.js:976,985`), which alone can exceed 10 MB, and `sanitizeStringList` defaults to
`maxItems = 5000` (`:920`) across mutes, blocks, hidden threads, and hidden-thread titles. The
mirror write to `chrome.storage.local` (`gm-shim.js:67`) is wrapped, but only against a synchronous
throw; an async quota rejection lands in `chrome.runtime.lastError`, which is never read. The failure
shape is exactly the one already documented in `CLAUDE.md` for 2026-08-06: a throw inside the
engine's own catch reads as "nothing was ever saved."

**Service-worker state is discarded on the 30-second idle timeout (Verified).** `watchCounts`
(`extension/background/service-worker.js:137`) is a module-scope `Map`. Chrome's documented MV3
[service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
terminates the worker after 30 seconds of inactivity, and `chrome.storage.session` exists for this.
The alarm period floor is 30 seconds as of Chrome 120; the watcher's `Math.max(5, ...)` minutes
(`:74`) is comfortably above it, so alarms are fine.

**The badge never clears when a tab leaves GLP (Likely, needs live validation).**
`chrome.tabs.onUpdated` returns early on `!tab.url` (`service-worker.js:165`). With only
`host_permissions` for the two GLP hosts and no `tabs` permission, `tab.url` is omitted for URLs the
extension has no access to. Navigating a GLP tab to any other site therefore skips `paintBadge` and
leaves the stale count or the "on" marker in place, which is the opposite of the comment's stated
intent on `:163`.

**A page-forgeable channel into the badge (Verified in code, low severity).**
`ext-bridge.js:14` listens for a `glp:watch-count` DOM event on `window`. Content scripts and the
page share the DOM event path, so page-world script can dispatch it with any `detail.count`. The
extension only runs on GLP, so the practical attacker is GLP itself or an XSS on GLP, but the channel
has no shape validation and no marker distinguishing an engine-dispatched event.

**Re-entry guards collide with page content (Verified in code, exploitability needs live
validation).** Seven features guard creation on a bare id, for example
`if (document.getElementById('glp-back-to-top')) return;` (`src/glp-ultra.user.js:6202`, and
`:6676`, `:7401`, `:8304`, `:8502`, `:8635`), and their `destroy` handlers remove by the same id. Any
element on the page carrying that id, whether from post markup, a signature, or a future site
template, makes the feature skip creation and makes teardown delete a site element. This is the
[DOM clobbering](https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Vulnerabilities_Cheat_Sheet.html)
shape applied to ownership rather than to globals. The repo already has the right primitive:
`markFeatureOwned` exists and is required by `verify-lifecycle.mjs:41`, but the identifier appears
only 7 times in the whole engine including its own definition, against 41 registry entries.

**A confirmed teardown leak (Verified).** `media.hoverPreview` registers three global listeners on
init (`src/glp-ultra.user.js:9413-9415`) and its destroy removes two (`:9420-9421`). No
`removeEventListener` for `hideMediaPreview` exists anywhere in the file, so switching the feature
off leaves a `scroll` handler on `window` running for the life of the page. Repeated toggling does
not accumulate handlers, because an identical (type, listener, capture) triple is deduplicated, but
the handler outlives the feature that owns it. This is precisely what `addFeatureEventListener`
exists to prevent, and the counts show why it happened: 12 document- or window-level listeners are
registered directly, against 10 that go through the helper. The gate requires the helper to exist
and never asserts that anything uses it (`scripts/verify-lifecycle.mjs:39`).

**The Trusted Types policy sanitizes nothing (Verified, low severity).**
`createHTML: value => String(value)` (`src/glp-ultra.user.js:337`) is a pass-through. It would satisfy
a page's `require-trusted-types-for` CSP, but content scripts run in the isolated world and are not
subject to page CSP, so the policy buys nothing while reading as a safety control. Only one call site
uses it (`setTrustedHTML`, `:350`), and the engine has just three `innerHTML` occurrences total, so
the DOM-injection surface is genuinely small. Either delete the policy or document what it is for.

**Guardrails that are missing rather than broken.** No `minimum_chrome_version` in
`extension/manifest.json`. No `declarativeNetRequestFeedback` permission, so
`chrome.declarativeNetRequest.testMatchOutcome` cannot be used to assert the nine rules in CI. No
`forced-colors: active` block anywhere in the engine, despite a shipped `highContrast` setting; the
UA discards `box-shadow` and non-URL `background-image` in
[forced colors mode](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors),
so any state signalled that way disappears.

**Supply-chain posture.** The December 2024 campaign that compromised Cyberhaven and
[more than 30 other extensions](https://blog.sekoia.io/targeted-supply-chain-attack-against-chrome-browser-extensions/)
worked through a phished OAuth grant on a Chrome Web Store developer account, defeating MFA. This
repo publishes no store listing, so it has no such account to lose, which is a genuine advantage of
the current distribution choice and should be written down as one before any listing decision is
taken. Its exposure instead sits on the GitHub release path, where the userscript `@downloadURL`
points at `raw.githubusercontent.com/.../main/dist/` (`scripts/build-userscript.mjs:52`). That is a
branch, not a tag, so anything merged to `main` reaches installed userscripts on the manager's next
update check.

## Architecture assessment

**The generated-schema pattern is the best thing here and should not be touched.**
`scripts/build-userscript.mjs` parses `DEFAULT_SETTINGS`, `SETTING_CONSTRAINTS`, and every
`createSettingsSection(...)` out of the source, and the build fails when a setting has no panel home.
That removes an entire drift category. Version consistency is likewise well gated across
`package.json`, `manifest.json`, `@version`, and `SCRIPT_VERSION`
(`build-userscript.mjs:43,60,67`; `verify-extension.mjs:33,78,97`).

**Packaging is genuinely deterministic.** `package-extension.mjs` sorts entries (`:44`), fixes DOS
timestamps (`DOS_TIME`/`DOS_DATE`, `:71-72`), pins `deflateRawSync` level 9 (`:67`), and prints a
SHA-256 (`:126`).

**The runtime harness is configured correctly for 2026.** `chromium.launchPersistentContext` with
`channel: 'chromium'` and `headless: true` (`verify-runtime.mjs:72-74`) is the form that still works
now that Chrome removed the side-load flags. Playwright is pinned at `^1.62.1`.

**Three assertions pass vacuously.** The project's own `CLAUDE.md` records this bug class twice, and
it is still present:

- `verify-runtime.mjs:637` reads `chrome.storage.sync.get(null)` and asserts the result is empty
  while sync is off. On a fresh temp profile it is empty regardless, so the assertion has no positive
  control and cannot fail for the reason it names.
- `verify-runtime.mjs:254` and `:426` assert `(diag?.errors || []).length === 0`. When `diag` is
  undefined the expression is `[]` and the check passes. The neighbouring selector check on `:255`
  and `:436` gets this right with `?? -1`; the error check does not.
- `verify-runtime.mjs:1542-1543` reads the auto-refresh bar width as `parseFloat(...) || 0` with
  `.catch(() => -1)` and asserts `>= 0`. That passes for any bar that exists at all. It is labelled
  "the countdown is running"; it measures existence. The real assertion is the next one, `visibleEnd >
  visibleStart` (`:1548`).

**The lifecycle gate does not cover the bug it was written for.** `verify-lifecycle.mjs:26` only
checks that the substring `apply:` appears in an entry. The failure documented in `CLAUDE.md` for
2026-08-06, `apply: () => {}` meaning "needs a page reload", would pass today. The empty-handler
check on `:30` matches one exact spelling, `destroy: () => {}`, and misses `destroy: () => { }`,
`destroy() {}`, and any multi-line form. Separately, the entry regex on `:19` requires the whole
object literal on one line (`[^\n]*\}`). That is true of every entry today, but there is no
expected-count assertion, so an entry reformatted across lines would silently leave the gate rather
than fail it.

**Runtime coverage has one viewport.** `verify-options.mjs` checks both 1440x900 (`:48`) and
1920x1080 (`:278`). `verify-runtime.mjs` contains no `1920` and no narrow viewport at all, so the
README's claim that toolbars "wrap into touch-friendly rows on narrow screens" is unverified by any
gate. The engine has breakpoints at 900, 768, 760, 720, and 700px (`src/glp-ultra.user.js:1719,
2068, 2580, 3231, 4664, 4684`) and nothing below 700px.

**Refactor candidates.** The engine is 10,646 lines in one IIFE with 41 registry entries and 141
settings. The single-file constraint is deliberate and load-bearing (it is what makes the extension
and the userscript incapable of disagreeing), so splitting it is the wrong move. The right move is
the triage layer Refined GitHub built for exactly this scale: a feature-rename map so renames do not
orphan stored state, and a bisect that finds the offending feature in `ceil(log2(41)) + 1` ≈ 7
reloads.

**Documentation gaps.** `Roadmap_Blocked.md` lists Firefox runtime verification as blocked because
"Firefox will not load a temporary MV3 add-on from the command line without additional tooling."
That is now out of date: Puppeteer ships
[`browser.installExtension()`](https://github.com/puppeteer/puppeteer/pull/13810) over WebDriver
BiDi's `webExtension.install`, and Firefox support has been stable since Puppeteer 23. The same file
lists store listing as blocked on a distribution decision, which is accurate for Chrome but not for
Firefox, where unlisted signing is free and automated.

## Rejected ideas

- **Remote broken-feature disable feed** (Refined GitHub `hotfix.tsx`). It fetches a CSV from a live
  host on a schedule. The repo's no-remote-code rule is enforced by `npm run check`, and the
  no-analytics promise is in the README's first paragraph. A local bisect gets most of the value with
  none of the contradiction.
- **`chrome.userScripts` API.** Chrome 138 moved it behind a per-extension "Allow User Scripts"
  toggle that
  [defaults to off for new installs](https://developer.chrome.com/blog/chrome-userscript). It exists
  to run arbitrary user-supplied code, which this extension does not do. Content scripts remain the
  right injection path.
- **View Transitions for in-page UI.** `document.startViewTransition()` from a content script
  snapshots the entire host document, not just injected UI, and only one can run per document.
  Unusable for extension overlays.
- **Keyboard shortcuts for in-page actions.** House rule bans them. Noted only because every
  competitor in the table has them, so a future reader will keep re-proposing it. The Popover API
  covers Escape-to-dismiss without registering a key handler, which is the part that was actually
  worth having.
- **Speculative ad domains and broad cosmetic selectors.** Carried forward from the 2026-08-13 pass
  and still correct. GLP reuses `.ads` on native Adv. Search and Email Support links.
- **Splitting the engine into modules.** The single source is what makes the two distributions
  provably identical. Splitting it trades a real guarantee for a stylistic one.
- **TTS, AI summarising, newsletter ingestion.** The read-later apps that charge for these need a
  backend. This product has none by design.
- **Bumping to a Firefox floor high enough for the Navigation API** (Firefox 147). GLP serves
  server-rendered pages with no client router, confirmed live on 2026-08-13. There is nothing to
  detect.
- **A plugin or extension-point ecosystem.** Considered because Refined GitHub and RES both have a
  module surface. It contradicts the single-source constraint that makes the extension and the
  userscript provably identical, and there is no third-party audience to serve: the repo has zero
  forks and zero stars (GitHub API, 2026-09-05). User-authored Custom CSS plus theme packs already
  cover the extension point people actually want.
- **Multi-user, roles, or shared state.** Nothing in the product has a second user. Settings sync
  through `chrome.storage.sync` is one person across their own devices, and the private lists
  deliberately stay off it. There is no migration or conflict story to build beyond the existing
  timestamp arbitration.

## Sources

Platform and policy
- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://developer.chrome.com/docs/extensions/reference/api/userScripts
- https://developer.chrome.com/blog/chrome-userscript
- https://developer.chrome.com/docs/extensions/how-to/distribute/host-on-linux
- https://developer.chrome.com/docs/apps/autoupdate
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for
- https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
- https://wiki.mozilla.org/Add-ons/Extension_Signing
- https://endoflife.date/firefox
- https://web.dev/blog/css-content-visibility-baseline
- https://www.ntcompatible.com/story/microsoft-edge-manifest-v2-sunset-2026-ublock-origin-gone-ad-blockers-restricted/

Tooling and testing
- https://playwright.dev/docs/chrome-extensions
- https://github.com/puppeteer/puppeteer/pull/13810
- https://pptr.dev/webdriver-bidi
- https://developer.chrome.com/blog/firefox-support-in-puppeteer-with-webdriver-bidi
- https://qaskills.sh/blog/playwright-accessibility-testing-axe-complete-guide

Comparable projects
- https://github.com/refined-github/refined-github
- https://github.com/refined-github/refined-github/issues/3529
- https://github.com/honestbleeps/Reddit-Enhancement-Suite/tree/master/lib/modules
- https://github.com/ccd0/4chan-x
- https://github.com/gorhill/uBlock/wiki/Element-picker
- https://github.com/gorhill/uBlock/wiki/Element-zapper
- https://github.com/gildas-lormeau/SingleFileZ
- https://github.com/gildas-lormeau/SingleFile
- https://github.com/Y2Z/monolith
- https://github.com/ArchiveBox/ArchiveBox
- https://github.com/obsidianmd/obsidian-clipper
- https://github.com/openstyles/stylus
- https://github.com/violentmonkey/violentmonkey

Userscript hosting
- https://greasyfork.org/en/help/meta-keys
- https://greasyfork.org/en/help/antifeatures
- https://greasyfork.org/en/help/code-rules

Security
- https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Vulnerabilities_Cheat_Sheet.html
- https://blog.sekoia.io/targeted-supply-chain-attack-against-chrome-browser-extensions/
- https://www.securityweek.com/several-chrome-extensions-compromised-in-supply-chain-attack/

Commercial comparables
- https://gleamr.io/blog/readwise-reader-pricing-2026
- https://www.marqly.com/compare/instapaper-vs-readwise-reader
- https://keep.md/compare/matter-vs-readwise-reader

## Open questions

1. **Does GLP allow user-supplied HTML with `id` or `name` attributes in post bodies or signatures?**
   This decides whether the id-collision finding (GU-010) is a hardening chore or an
   anyone-can-kill-a-feature bug. Answerable only from a logged-in page or a fresh capture.
2. **What is the real distribution of local-store sizes for a heavy reader after a year?** The
   sanitizer ceilings say up to ~10 MB is reachable; nobody has measured what actually accumulates.
   This decides whether GU-001 needs pruning or only a failure path.
3. **Is a Firefox add-on id change acceptable?** If the current unsigned build has ever been
   installed by anyone, unlisted AMO signing under the same
   `glp-ultra@sysadmindoc.github.io` id keeps their profile data; a different id does not.
4. **Should the userscript `@downloadURL` move from `main` to a release tag?** Pinning to a tag
   removes the "anything merged reaches every install" exposure but costs the automatic update path
   that currently works. This is a maintainer risk-appetite call, not a technical one.
