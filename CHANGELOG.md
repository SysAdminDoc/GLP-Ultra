# Changelog

## 3.9.0 (unreleased)

### Fixed

- **A full local store no longer looks like lost data.** Browsers give a site about 5 MB and throw
  once it is full. Every save now catches that, keeps your change in memory, and tells you which
  list could not be written instead of quietly reverting to defaults on the next page load. The
  Diagnostics report lists any store that failed to save.
- **Watched-thread counts stay on the toolbar button.** Chrome shuts the extension's background
  worker down after half a minute of quiet, and the unread counts were being kept somewhere that
  did not survive it, so the badge quietly dropped back to the plain marker. They are stored
  properly now.
- **The badge clears when you leave the forum.** A tab that had a watched-thread count kept showing
  it on every other site you visited in that tab. Chrome hides the address of pages the extension
  has no access to, and the old check read that as "unknown" instead of "not the forum".
- **The import limits now add up to something that fits.** Each list had its own ceiling, picked on
  its own, and together they allowed far more than a browser will store. They are sized against one
  shared budget that leaves room to spare, and the hidden-thread-title list is capped at all, which
  it was not before. Poster history now tops out at 1,000 people rather than 5,000.

- **The offline verification captures are back.** Both MHTML files were removed from the project on
  2026-09-04, which left the selector registry and the whole runtime replay with nothing to check
  against. They are restored byte for byte, and a missing or empty capture now stops
  `npm run verify:captures` and `npm run verify:runtime` with an explanation instead of a stack
  trace or a shorter suite that still reports success.

## 3.8.3 (2026-09-03)

### Changed

- **The GitHub project is now named `GLP-Ultra`.** Repository metadata, userscript update URLs,
  package links, and the build gate all point to the new address.
- **The README now starts with the product and the install path.** It describes the current reading
  experience, links each release build directly, and separates end-user installation from source work.
- **Project descriptions now match.** GitHub, the extension manifest, the userscript header, and
  package metadata use the same concise summary.

### Verified

- The complete extension gate passes after the identity and URL migration. Both browser packages
  were rebuilt from a clean output directory and checked as readable ZIP archives.

## 3.8.2 (2026-09-03)

### Redesigned

- **Thread pages now have a clear reading hierarchy.** Posts are separate cards with a compact
  author rail, a wide message surface, layered quotes, and an accent treatment for the original
  poster. The Midnight palette now uses a deeper navy canvas with brighter, clearer type.
- **The forum feed follows the same visual system.** Thread rows are separated, titles are easier
  to scan, and metadata uses consistent spacing and contrast across all ten themes.
- **Narrow layouts no longer feel like a squeezed desktop page.** Post cards stack cleanly, feed
  rows become full-width cards, and both navigation bars wrap without covering content.

### Fixed

- **OP navigation stays inside the thread toolbar and renders once.** Reapplying settings can no
  longer duplicate the controls or leave a floating overlay over the first post.
- **Narrow visual captures can open diagnostics and recovery reliably.** Their checks no longer
  depend on a footer button being visible in the current viewport.

### Verified

- Added computed-style checks for typography, card separation, author-to-message proportions,
  quote surfaces, feed rows, and OP navigation idempotency. The Chromium replay passes 227/227
  checks, including the membership-contract safeguards.
- Rendered 80 desktop screenshots across all ten palettes and checked the Midnight thread and feed
  again at 390x844. The options journey still passes 59/59 checks at both supported desktop sizes.

## 3.8.1 (2026-08-13)

### Hardened

- **Every settings and local-data ingress is now constrained.** Stored payloads, Options imports,
  in-page backups, shareable packs, pre-upgrade recovery, and extension messages normalize types,
  enums, colours, and numeric ranges before applying them. Local mutes, blocks, hidden threads,
  titles, tags, watcher entries, and poster-history stores are bounded, deduplicated, and cleaned.
- **Shareable themes cannot carry Custom CSS.** Theme packs now contain appearance values only, so
  an imported pack cannot inject a blanket rule that hides the page or its recovery controls.
- **Userscript and extension frame behavior is explicit and equivalent.** The userscript combines
  `@noframes` with a runtime top-frame guard; extension content scripts declare `all_frames: false`.
  Build gates reject a future drift in any of those contracts.
- **In-page backups now use the complete format-3 contract.** Watcher entries and visited
  poster-history pages join all existing local stores. Imports reject files over 8 MB, skip
  malformed store families without erasing healthy data, and retain empty arrays as intentional
  clears. Download URLs remain alive long enough for slower browsers to claim them.

### Verified

- Added fault-injected backup, pack, external-patch, local-data, and frame-policy regressions.
  Options passes 59/59 checks and the unpacked Chromium runtime passes 219/219 checks.

## 3.8.0 (2026-08-13)

### Fixed

- **Membership contracts remain a reader decision.** Removed the legacy club-disclaimer setting
  and automation after the current public site showed that the matched form is now a membership
  contract with age and legal-attestation controls. Schema migration prunes the old key, and the
  runtime test runner proves the controls remain unchecked and the form is never submitted.
- **Native site links no longer disappear with ads.** GLP uses the generic `ads` class for real
  **Adv. Search** and **Email Support** links. Cosmetic cleanup now targets confirmed MGID/AMP
  hooks only, preserves those links, and still removes empty rows left by real ad units.

### Redesigned

- **The complete 23-page settings interface is now an operational desktop control center.** One
  reference-led design direction per page informed a code-native shell with truthful local state,
  focused page hierarchy, compact desktop control matrices, dependency feedback, explicit theme
  and custom-colour behavior, and the real extension icon instead of decorative fake previews.
- **Reset and recovery are visible parts of the normal journey.** Every changed setting can be
  reset individually; every page can be reset with Undo; presets apply real setting patches with
  Undo; mute/block lists support search and reversible clearing; User Data reports real counts,
  exports the complete local backup, and clears poster history reversibly.
- **Diagnostics and Recovery are directly reachable from Options.** Search supports `Ctrl+K`,
  Escape, hashes, no-match recovery, saved feedback, and keyboard-visible focus across all pages.

### Verified

- Added a 57-check options journey gate covering all 23 routes, resets and undo, dependency
  states, presets, lists, data export/history recovery, direct tools, keyboard use, page errors,
  and zero horizontal overflow at 1440x900 and 1920x1080.
- Runtime replay now passes 213/213 checks. A real unpacked Chromium extension blocks GLP-origin
  MGID and DoubleClick probes with `ERR_BLOCKED_BY_CLIENT` while a control request succeeds; real
  feed/thread captures lose MGID/AMP DOM and empty shells while native `a.ads` links survive.
- All 23 pages were rendered at 1440x900, 1920x1080, and the mockups' exact 1586x992 size for
  direct visual comparison. Current live feed/thread cold-load proof remains blocked by the
  membership contract and is not claimed.

## 3.7.0 (2026-08-12)

### Hardened

- **The extension watcher now survives tab lifecycle changes.** MV3 builds schedule checks with
  `chrome.alarms`, route them through the content bridge, and clear the alarm when disabled;
  standalone userscripts retain their tab-local timer.
- **Feature stores now use a typed storage adapter.** Mutes, blocks, tags, hidden threads,
  watcher entries, and local history no longer reach into `GM_*` directly, while the engine-level
  migration and settings layer remains the single persistence boundary.
- **The roadmap's lifecycle and safety requirements are complete.** The registry has 41 explicit
  init/apply/destroy entries, 21 fragment-safe processors, owned-resource cleanup, scoped
  mutation processing, queued same-origin fetches, Trusted Types-compatible HTML, and local issue
  bundle export.

### Verified

- `npm run verify` gates, captures, Chrome/Firefox builds, extension structure, and the Chromium
  replay all pass. The runtime checks are 204/204. Firefox remains structurally gated and logged-in
  captures/store submission remain in `Roadmap_Blocked.md`.

## 3.6.0 (2026-08-08)

### Hardened

- **Versioned settings migration.** Upgrades now read the previous nested `glpx.settings.v1`
  payload and known legacy aliases, validate values against the current schema, migrate old list
  keys when their modern store is empty, and expose the migration source/schema in diagnostics.
  The pre-upgrade recovery backup accepts both string and parsed payloads, so migration cannot
  make an existing recovery path unreadable.
- **Userscript auto-updates are wired.** Generated metadata now carries GitHub Raw
  `@updateURL`/`@downloadURL` entries, and the build gate rejects missing or redirected metadata.
- **Feature lifecycle and fragment processing are explicit.** The registry now owns event-listener
  and observer cleanup, reverses inline timestamp/color/DOM markers, and processes newly appended
  forum fragments through stable scoped roots instead of rescanning the whole document. A lifecycle
  gate and runtime replay cover owner tags, live toggles, and teardown.
- **Diagnostics can be saved for support.** The diagnostics panel now downloads a local JSON issue
  bundle with selector health, feature timing/errors, settings, and local lists. The UI warns that
  the file should be reviewed before sharing.

### Redesigned

- **The 23 settings sections are now real routed pages.** Both the in-page panel and extension
  options surface use the same full-height control-center shell: grouped navigation, search,
  Only changed, live page metrics, compact switches, page-level reset affordances, local-save
  status, and one focused destination instead of a 142-control accordion or card wall.
- **Each destination has a purpose-built visual archetype.** Thread and post pages use dense
  control matrices, theme and accessibility pages pair controls with live specimens, user lists
  use management tables, and watcher, media, filtering, export, presets, and local-data pages
  expose previews suited to their job. Core stays deliberately direct, matching the generated
  design with its three foundational cards.
- **The extension popup now belongs to the same product.** Quick controls, theme selection,
  network blocking, and safe mode use the shared navy/OLED palette, restrained borders, compact
  switch treatment, and persistent action bar.

### Verified

- Added `npm run shots:pages`, an invisible Chromium sweep that visits and captures all 23 options
  routes into `dist/ui-pages/`, alongside the existing eight-surface, ten-theme sweep.
- Runtime verification now asserts that every rail destination selects exactly one visible page.
  The redesigned shell passes all 191 runtime checks, including changed-state filtering,
  section resets, narrow-viewport footer containment, diagnostics, recovery, and live apply.

## 3.5.0 (2026-08-07)

The roadmap's risk table has named five mitigations since Phase 3 with nothing behind them. This
is the four that were still missing, and the defect found while implementing the fifth.

### Fixed

- **A failing site got hammered as fast as it could refuse.** The fetch queue stamped its
  rate-limiter clock only after a *successful* response, so a run of failures made the elapsed
  time grow, the computed delay go negative, and the one-second floor between requests stop
  applying exactly when it mattered, such as when a watcher with twenty threads emptied its queue into
  a site already saying no. Both outcomes stamp the clock now, and a refusal also backs off: the
  server's own `Retry-After` when it sent one, otherwise exponential from the caller's floor,
  capped at a minute. Consecutive failures and the remaining backoff are reported in diagnostics.

### Added

- **Safe mode, so custom CSS cannot lock you out of the settings that undo it.** Pasting
  `* { display: none !important }` hid the settings panel along with the page and measured 0px
  wide. Because the setting is saved, reloading brought the same page back. The recovery surfaces
  are now re-asserted after the user's rules at a specificity their scoped selectors can reach,
  and safe mode drops custom CSS entirely. It is reachable from two places page CSS cannot touch:
  the userscript manager's menu, and the extension popup, which is a separate document.
- **GLP Ultra takes precedence over Dark Reader.** Two dark themes over one page wash out the
  accents each palette was measured against, and it reads as a theme bug rather than as two
  extensions disagreeing. Uses `<meta name="darkreader-lock">`, Dark Reader's own documented
  opt-out, honoured live; removed again the moment GLP Ultra stops theming. Dark Reader's
  presence is reported in diagnostics either way.
- **The settings payload an upgrade is about to prune is banked first.** Loading keeps only the
  keys the current schema declares and the next save writes the pruned object back, so anything a
  predecessor stored under an unknown name disappeared with the upgrade, silently. One copy of
  the pre-upgrade payload is kept and offered back from the recovery shelf with an undo. Mirrored
  to `chrome.storage`, because a recovery artifact that dies when site data is cleared is not
  much of one.

### Verification

189 runtime checks, up from 173. Each of the above is asserted by doing the thing: pasting the
blanket rule and measuring the panel, reloading with safe mode on because that is what a
locked-out reader tries first, serving `429 Retry-After: 7` to the thread the watcher polls, and
restoring a banked payload to see a pre-upgrade value come back.

## 3.4.0 (2026-08-07)

Three drift items closed, and four defects the new gates turned up on their first run.

### Fixed

- **Every semantic colour in the product was dead.** 3.3.0's token pass wrote
  `--glpx-success` / `--glpx-warning` / `--glpx-danger` as `var()` references to themselves. CSS
  resolves a cyclic custom property as invalid-at-computed-value-time, so all 19 usages fell back
  to inherit and success, warning and error toasts, danger buttons and every state chip painted
  in the surrounding text colour. Nothing errored, which is why it shipped.
- **The settings footer was clipped off the bottom of the panel.** At 900x700 it sat 207px below
  the panel's edge, and the panel clips its overflow. So Reset, Recovery, Diagnostics, Export,
  Import, Close and Save were all off screen with no scrollbar to reach them. The body reserved a
  hardcoded `88vh - 184px` for chrome whose real height depends on whether the footer and search
  bar wrap. The panel is a flex column now, and the body takes what is left.
- **Touching any setting turned every quote border black.** `quoteBorderColor` defaults to
  `var(--glpx-accent)`, an `<input type="color">` coerces anything it cannot parse to `#000000`,
  and reading the panel back is what saves it. The swatch shows the resolved accent and keeps
  following the theme until someone actually picks a colour.
- **The thread toolbar changed colour depending on which features were on.** Both
  `collapseExpandAll` and `threadQuickSearch` emitted a full copy of its chrome; whichever came
  last won. Emitted once now.
- A second definition of `--glpx-border` in the site block meant the same token drew one line on
  page content and a different one on product chrome, decided by whether the element was inside
  `<body>`. Ten further declarations there restated the token layer verbatim.

### Changed

- **The last five surfaces read the shared tokens.** Watch digest, tag picker, quick-search
  panel, lightbox and toast stack carried their own colours; the quick-search panel was `#1a1a2e`
  on `#4a4a6a`, so it sat as a blue-purple box on all ten palettes. The ghost control every small
  button uses is named once and tinted with the accent, so a toolbar button belongs to its theme
  at rest rather than only on hover.
- **The settings footer is grouped by job.** Rules separate destructive controls from inspection
  and data transfer. Reset gets daylight too; it used to sit shoulder to shoulder with Export. Every
  button now says what it does.

### Added

- **The theme sweep is a gate.** `npm run shots` rendered every surface in every theme and
  nothing ever read the result, which is how five surfaces stayed blue. The test runner now paints
  each surface under two opposite palettes, requires it to move, and checks its text clears 4.5:1
  on both.
- **The build rejects a custom property that references itself**, in both the bare and the
  `var(--x, fallback)` form. The latter is equally a cycle.
- Thirteen assertions on the settings panel, which previously had two: the section rail, the
  changed-state dots, the only-changed filter, the empty state, per-section reset, and the
  footer's geometry at a width that wraps it.
- A download that never arrives is one failed check rather than an uncaught throw. Two runs died
  on a slow export and took the ~40 later checks with them, reporting nothing about any of them.

## 3.3.0 (2026-08-06)

A design-system pass over every surface, and the layout defects looking properly at each one
turned up.

### Changed

- **One design-token layer, derived from the chosen theme.** The palette exposed eight values
  while the interface it was meant to theme carried 87 hardcoded literals, so picking Alien Green
  or Blood recoloured the forum while every extension control stayed blue, including settings,
  toasts, recovery, and diagnostic surfaces. Tokens for surfaces, text, borders, semantic
  colour, radius, elevation, and the focus ring are now emitted first and unconditionally. The
  accent is also published as an RGB channel so existing `rgba()` rules could be repointed at it
  without altering a single alpha. Semantic colours stay fixed: success is green on Blood too.
- **The options page and popup theme themselves.** They are separate documents and cannot read
  the injected layer, so the palette now travels with the generated schema. Three surfaces, one
  theme, one vocabulary of tokens.
- **The settings panel is navigable.** 140 controls across 23 sections had a search box and
  nothing else. It now has a section rail down the side, an *Only changed* filter, a live match
  count, a proper empty state, a dot on every row that differs from its default (echoed in the
  section header and the rail), and per-section reset with undo.
- Stray 2px/3px/5px radii normalised onto the 4/6/8/10/12 scale.

### Fixed

- **The thread toolbar rendered as a 92px vertical stack of nine wrapped buttons pinned to the
  right edge.** `.msgtitle` is a div parented straight to a `<tr>`, so inserting after it made the
  toolbar a child of that `<tr>` as well, but a div is not valid table content. Anchored outside the
  table, it is the horizontal toolbar it was always meant to be.
- **About 450px of dead space** above the first post, most of it rows the ad removal had emptied.
  `:empty` cannot match a row holding whitespace, so those are marked as they are emptied.
- The OP previous/next buttons were unthemed yellow and floated on top of the author column.
- The author column stacked one action chip per line, and mute/block/tag were three sizes and
  three colour stories inches apart.
- Nav links rendered as a bare vertical list of underlined text.
- **Diagnostics and the recovery shelf covered the settings panel that launches them**, including
  its rail and its buttons. They hand the screen over now, and offer the way back.
- The nav's theme picker went stale when the theme was changed from the panel, the popup, or
  another device.

### Added

- `npm run shots` captures every surface in every theme into `dist/ui-shots/`, so a polish pass
  cannot quietly become a one-screen-one-theme pass.

## 3.2.0 (2026-08-06)

### Added

- **Optional settings sync** (extension only, off by default). Turning it on keeps settings on the browser account so another signed-in device picks them up. Mutes, blocks, tags, and history stay local. Most recent change wins, arbitrated by a stamp so a device that merely opened a tab cannot overwrite one that changed a setting. Only the settings payload is synced because `chrome.storage.sync` caps an item at 8KB and the user lists are unbounded; an oversized payload stays local and says so.
- **Shareable packs.** A pack is one slice of a profile rather than a whole backup: a theme pack carries the look, while a filter pack carries mutes, blocks, and keyword rules. Importing a filter pack *adds* by unioning lists and merging keyword rules, so a pack someone else wrote can never delete your mutes. Packs live under Presets.
- **Noise budget.** A toolbar chip counts what GLP Ultra is keeping off the page, including ads, muted or blocked posts, keyword hits, hidden threads, and collapsed quotes. It opens a breakdown with a route straight to the recovery shelf. Every figure but the ad count is read from the live DOM, so it cannot drift from what is actually hidden.
- **Save / Open / Copy link buttons on post images.** Saving fetches the blob so the file keeps its real name; a hotlinked third-party image cannot be fetched from a content script, so it falls back to opening the image and says why.
- **Accessibility controls.** A new panel section: *Reduce Motion* stops every animation and transition the script adds (the OS `prefers-reduced-motion` setting is still always honoured, this forces it on regardless), *High Contrast* lifts injected text and borders and stops muted text fading below a readable level, and *Larger Click Targets* grows the script's own buttons and chips to a 32px minimum without reflowing the site's tables. They are emitted last in the stylesheet on purpose. A theme that beats the motion or contrast setting is a bug.
- **Quote backlinks.** GLP marks each post with its own `reply<id>` permalink and each quote block with a "Quoting:" footer naming the quoted author and linking the quoted post, which is enough to reconstruct who answered whom. A post now lists the replies that quoted it. Each chip names the answering post and author; hovering shows an excerpt, and clicking scrolls to it. Quotes that name a post on the same page gain an in-page jump beside the site's own link, which always left the page.

### Fixed

- **Seven settings did nothing until the next page load.** Back-to-top, both infinite scrolls, the scroll progress bar, thread previews, quick search, and auto-refresh had no apply handler, because their `init` appended a fresh element or listener on every call and would have stacked duplicates. Each now guards re-entry, so switching one on takes effect immediately and repeated applies leave exactly one of it. Thread previews additionally read the setting inside their document-level listeners, so switching them off stops them firing rather than only removing the last card.
- **Auto-refresh kept counting down in a background tab.** The fetch queue already deferred the request, but the countdown completed anyway and refreshes stacked up against the moment the tab came back. It now holds while `document.hidden`.
- **Turning auto-refresh on did nothing until the next page load.** Its registry entry had no apply handler, because `initAutoRefresh` was not idempotent and would have stacked a second interval. It now tears its own timer and bar down first, so enabling it or changing its interval takes effect immediately.
- **An extension tab could come up with the theme applied and not one feature running.** The shim's `chrome.storage` read lands at `document_start`; when the mirrored copy differed from localStorage it pushed the difference straight into the engine, which started the feature run against a body that had no posts in it yet and marked the run done. The real page was then never touched. CSS injected, body flagged active, no post numbers, no toolbar, no error. Feature startup now waits for the document when a settings push beats it.
- **Unmuting your last muted user left their posts hidden until a reload.** `applyMuteList()` returned early when the list was empty, skipping the pass that takes the class back off. Switching the mute feature off entirely had the same effect because its `destroy` removed the buttons but never unhid the posts. The noise budget exposed the mismatch.
- Images still loading were silently treated as chrome and skipped by the lightbox, the gallery, and the new media actions: `naturalWidth` is 0 until an image loads, and the shared predicate measured it during a document-idle pass. It now falls back to the declared `width`/`height`, and re-checks on load.

## 3.1.0 (2026-08-06)

### Added

- **Thread watcher.** Watch a thread and it is polled through the shared rate-limited fetch queue, walking to its last page before counting posts so an unread delta means new replies rather than a new page. The digest lists every watched thread with its unread count, last-checked age, and failed-check state, and each row can be marked read, opened, or unwatched. Hidden tabs pause background checks by default. In the extension, the toolbar badge shows the unread total instead of a plain "on".
- **Recovery shelf.** One surface lists hidden threads, muted users, blocked users, and the filters currently hiding things. Each item can be restored on its own from any route. Hidden threads now remember their titles, so the shelf names what it is about to restore. Older backups without titles still restore their ids.
- **Diagnostics panel.** The settings footer opens an in-page report with a Copy button. It covers the route, active features, changed settings, worst-run timings, fetch queue state, recorded feature errors, and selector health. Each registry entry says whether the page is using its primary selector or a fallback, which warns about site drift.
- **Context-menu actions.** Right-click on GLP offers Hide this thread, Mute this user, Tag this user, Preview this image, and Export this thread. Each reports why nothing happened rather than failing quietly.
- **Update notices.** After a version change, GLP Ultra names the settings the new build added, computed by diffing the stored payload against the defaults. Switch off with *Announce New Settings After An Update*.
- **Firefox build.** `npm run build:firefox` generates the Gecko variant (event-page background, extension id, `strict_min_version`) into `dist/extension-firefox/`, and `npm run package:firefox` zips it. Everything but the manifest is identical to the Chrome build.

### Fixed

- **Every setting, mute, block, tag, and hidden thread reset to defaults on reload in the extension build.** The engine follows Tampermonkey semantics: it serializes before every `GM_setValue` and parses after every `GM_getValue`. The MV3 shim also parsed on read, so the engine parsed an already-parsed object, threw, and fell back to defaults inside its own try/catch. Silent data loss followed on every page load.
- `mainNav`'s primary selector `.topnav.topnav_main` matches neither capture, so that surface had been resolving through fallbacks; `.mainpagenavlinks` is now the primary. The thread route no longer expects a site-wide main nav it does not have.
- The image lightbox added a document click listener on every `init` and never removed it, so disabling the feature left the handler live and re-enabling it stacked another copy. It now binds once and unbinds in `destroy`.

### Also in this release

- **Thread export.** Thread pages get Export MD / Export HTML / Export JSON / Copy Link buttons in the tools bar. Markdown preserves quote nesting as `>` depth, HTML is a standalone dark document with the original post markup, and JSON is a structured record of every post (author, member/user id, OP flag, date, quote depth, links, media). Every export carries the source URL, thread id, page number, and an export timestamp, and an optional media manifest listing each image, embed, and outbound link.
- **Mute match modes**: a muted entry can now match the exact name, any name containing it, or a regular expression. An invalid pattern is skipped rather than taking the whole mute list down.
- **Private notes on tagged users**: the tag editor gained a note field, kept beside the label and colour and shown on hover. Editing a tag now pre-fills what is already there instead of starting blank.
- **Local trust overlay** (off by default): counts how many posts you have actually seen from each poster and shows it beside their name, with thread count and first-seen date on hover. The result comes only from pages this browser rendered. There is no scoring service or network call, and the history is capped and prunable.
- **Full backup, not just settings**: export now bundles mutes, blocks, tags, notes, hidden threads, and the poster history alongside the settings, and import restores all of them. A new panel section clears the poster history with an undo toast.
- **Media privacy mode** (on by default): third-party embeds inside posts are replaced by a labelled click-to-load placeholder, so YouTube and X never see the page until the reader asks. YouTube auto-embedding builds the placeholder directly rather than loading and then unloading a player.
- **X / Twitter embed normalization**: widgets get a labelled frame and, where the page still carries the post id, a direct link to the post. A dead widget is now recognisable instead of an unexplained gap.
- **Hover preview for images** (off by default): hovering a shrunken thumbnail or an image link shows the full-size image, capped to a configurable share of the viewport.
- **Runtime verification** (`npm run verify:runtime`): loads the unpacked extension in Playwright's Chromium and replays the real GLP captures at their live URLs, then asserts the feed and thread surfaces, the messaging path, and the export outputs. Wired into `npm run verify`; 83 checks at this release.

## 3.0.0 (2026-08-06)

Merged the two separate userscripts into a single MV3 extension, "GLP Ultra".

### Merged

- `GodLikeProductions_Enhanced_Suite.user.js` (v9.0.0) has been absorbed and removed. Its jQuery dependency (loaded over plain HTTP from a CDN) and its key-driven surfaces are gone; every feature it contributed is now vanilla JS inside the shared engine.
- `GLP_Enhanced_-_Godlike_Productions_Declutter.user.js` (v2.1.0) became `src/glp-ultra.user.js`, the single source for both the extension and the userscript.

### Added from the Suite

- Sort controls toolbar: updated / posted / rating / views / replies, ascending and descending, plus hide-pinned and reset-sort actions.
- Newest-first default ordering for forum pages.
- Hide pinned and karma-pinned threads.
- Block users by numeric user ID, with a Block button on every post author and a managed list.
- Hide image-only replies (media with almost no text).
- Hide `/sm/` reaction GIFs.
- Country club disclaimer auto-accept.
- Collapse every quote by default.
- Corner style control (site default / rounded / square).
- Lean reading preset with an undo toast.

### Added in the extension shell

- Popup with master switch, theme picker, six quick toggles, and a network ad-blocking switch.
- Options page covering all 114 settings, generated at build time from the engine so the two can never drift; includes export, import, reset with undo, and management of muted users, blocked users, and hidden threads.
- Service worker: context-menu entry points, `declarativeNetRequest` ruleset toggle, per-tab badge.
- Network-level ad blocking (9 rules, scoped to `godlikeproductions.com`).
- `chrome.storage` mirroring so extension pages and open tabs stay in sync live, without a reload.
- Icon pipeline, deterministic zip packaging, and a structural extension verifier.

### Fixed

- `injectForumLink` called `insertBefore` on the wrong parent when `.navctrl` was not a direct child of the nav cell. It threw on thread pages, and because the feature registry had no error isolation, **every thread-page feature after it silently never ran**. Both the bug and the missing isolation are fixed; feature errors are now recorded and readable through the diagnostics channel.
- Turning a feature off in the settings panel now runs its `destroy`, instead of leaving its DOM changes behind until reload.

### Changed

- Product name is now GLP Ultra throughout the UI. Storage keys are unchanged, so existing settings carry over.
- Captures moved to `captures/` with stable names.

## Roadmap archive (2026-08-10, ROADMAP.md)

<details>
<summary>Original roadmap snapshot</summary>

````markdown
# GLP Ultra Roadmap

## Status: v3.1.0 (2026-08-06)

The two userscripts are merged and the MV3 extension is the primary vehicle, exactly as the delivery table below prescribes.

- Shipped: single engine at `src/glp-ultra.user.js` (133 settings / 22 sections), MV3 extension with popup, options page, service worker, and `declarativeNetRequest` ad blocking, plus the userscript build and the generated Firefox variant from the same source.
- Absorbed from `GodLikeProductions Enhanced Suite` v9.0.0 (now deleted): sort toolbar, newest-first default, pinned-thread hiding, user blocking by ID, image-only reply filter, reaction-GIF filter, country-club nag bypass, collapse-quotes-by-default, corner style, lean reading preset.
- Dropped deliberately: jQuery CDN dependency, key-driven surfaces (house rule), the Suite autopager (superseded by the engine's infinite scroll).
- Verification: `npm run verify` (gates + captures + both builds + structure) and a Playwright run that loads the unpacked extension and replays the real GLP captures. 83/83 checks.

### v3.1.0 closes the remaining phase work

- **v0.7.0: Watcher, automation, and recovery.** Complete. Watch/unwatch, digest with unread delta, last-checked age and failed-check state, hidden-tab pause, and a recovery shelf covering hidden threads, muted users, blocked users, and active filters, each restorable on its own. Local history cleanup keeps its undo toast.
- **v0.8.0: MV3 extension build.** Complete. Context-menu actions (hide thread, mute user, tag user, preview image, export thread), watcher-count toolbar badge, and the Firefox-compatible manifest variant generated into `dist/extension-firefox/`.
- **v0.9.0: Reliability and distribution.** Diagnostics now report settings version, enabled features, selector health, route, fetch queue status, and per-feature worst-run timings. Self-healing selector warnings flag fallback hits and missing required surfaces; settings changes are announced per version bump.

Items blocked on input from outside the codebase live in `Roadmap_Blocked.md`.


Research date: 2026-05-19  
Target site: Godlike Productions, `https://www.godlikeproductions.com/` and `https://godlikeproductions.com/`  
Primary delivery: single-file userscript  
Secondary delivery: Manifest V3 extension generated from the same source modules

## Project Overview

GLP Ultra is a dark-only premium power layer for Godlike Productions: declutter, theme, filter, moderate, navigate, read, watch, export, and recover every GLP workflow from one dense but reversible control surface.

The project should ship both vehicles:

| Vehicle | Role | Rationale |
| --- | --- | --- |
| Userscript | Primary portable build | Single-file install, fast iteration, Tampermonkey/Violentmonkey support, easiest distribution for power users, can run at `document-start` for anti-FOUC. |
| MV3 extension | Distribution and privileged capabilities | Needed for Chrome/Edge/Firefox stores, `declarativeNetRequest` ad/widget blocking, toolbar popup, full options page, background alarms, storage sync, context menus, and cleaner cross-origin media handling. |

Versioning convention: `vMAJOR.MINOR.PATCH`. Early phases start at `v0.1.0`; `v1.0.0` means the product beats every GLP-specific public/private tool found and absorbs the strongest adjacent forum-extension patterns.

House style:

- Dark-only. No light theme.
- Premium paid-software look: OLED palettes, glass panels without content-script blur filters, shimmer, hover lift, spring easing, staggered entrances, dense mode, branded accent, and custom scrollbar.
- Border radii stay restrained: `0`, `4`, `6`, `8`, `10`, or `12px`. No pill or oval UI.
- No keyboard shortcuts. Use visible buttons, segmented controls, menus, command surfaces, and context actions.
- No confirmation dialogs. Destructive actions apply immediately with toast feedback and an undo affordance where possible.
- Every feature exposes `init()` and `destroy()` and must fully remove DOM, CSS classes, observers, timers, listeners, and stored ephemeral state on disable.
- Settings overlays keep inactive shells at `pointer-events: none`.
- Userscript CSS is scoped to body feature classes and `--glpx-*` custom properties.
- All HTML injection routes through a TrustedTypes-compatible helper. Prefer DOM construction; use a policy wrapper for any string HTML. This is mandatory for shared modules that may later run on Google/YouTube or any TrustedTypes-enforcing surface.
- Target obfuscated or fragile classes only as fallbacks. Stable selectors use ids, form actions, semantic class names, attributes, and structure.

## Phase 0: Local Repository Ingest

Full repo tree:

```text
C:\repos\GLP Ultra
|-- dist
|   |-- glp-enhanced.meta.js
|   `-- glp-enhanced.user.js
|-- extension
|   |-- content
|   |   |-- early.css
|   |   |-- glp-enhanced.user.js
|   |   `-- gm-shim.js
|   `-- manifest.json
|-- GLP_Enhanced_-_Godlike_Productions_Declutter.user.js
|-- Godlike Productions - Discussion Forum.mhtml
|-- package.json
|-- Pentagon Urged No Resumption Of Strikes As Iran Grew More Effective Tracking US Air Ops_ NYT.mhtml
|-- ROADMAP.md
`-- scripts
    |-- build-userscript.mjs
    `-- verify-captures.mjs
```

Repository state:

| Area | Current state | Keep | Change before v1 |
| --- | --- | --- | --- |
| Git | Folder is not a Git repository. | No repo mutation required for this research artifact. | Add source control before implementation work. |
| Userscript | One large userscript, `@version 2.1.0`, `@run-at document-start`, grants `GM_getValue`, `GM_setValue`, `GM_registerMenuCommand`, `GM_addStyle`. | It already proves many GLP selectors and feature ideas. | Split into generated single-file build from modules; sync metadata and update URLs. |
| Build | `package.json` and `scripts/build-userscript.mjs` now verify the source and emit `dist/glp-enhanced.user.js`, `dist/glp-enhanced.meta.js`, and `extension/content/glp-enhanced.user.js`. | Dependency-free Node build is readable and portable. | Future modular source should feed the same dist names. |
| Extension | Minimal MV3 boot path exists with `extension/manifest.json`, early CSS, and a GM compatibility shim. | Same userscript source now runs through the extension content-script path. | Replace shim persistence with `chrome.storage.local`, add popup/options/DNR packaging in later phases. |
| Docs | No README, LICENSE, CHANGELOG, or existing roadmap in this folder. | This roadmap is the only deliverable for this run. | README.md is a planned build deliverable. |
| Settings | Local script has about 101 defaults across ads, header, nav, thread list, posts, quotes, visual, filtering, and UI tools. | Broad coverage and categories. | Move to a schema-driven settings registry with migration and destroy handlers. |
| Styling | Early anti-FOUC CSS and 8 dark themes are already present. | Dark-only direction and anti-FOUC. | Replace ad hoc CSS with tokenized `--glpx-*` theme layer and no content-script blur filters. |
| Feature lifecycle | Current features mostly apply once or append listeners with little teardown. | Existing behavior map. | Every feature must be reversible through `destroy()`. |
| Safety | Uses direct string HTML injection and confirmation dialogs in places. | Existing panel structure can inspire schema. | Add TrustedTypes-compatible injection helper, DOM construction, undo toasts, and no confirmation dialogs. |
| Existing keyboard behavior | Local and prior scripts include keyboard shortcut settings. | None. | Remove from final scope. No keyboard shortcuts are shipped. |

Current local userscript feature inventory:

| Category | Already present locally |
| --- | --- |
| Ad and nag cleanup | MGID/widget removal, AMP embed hiding, message ads, inline reply ads, registration nag bypass. |
| Header and navigation cleanup | Banner, stats, clock, login links, notifications, theme switcher, viewport toggle, top links, main nav, tabs, controls, RSS, chat, join, extras, compact/sticky nav. |
| Thread list cleanup | Icon/rating/views/posted/updated/poster/replies columns, page links, mobile meta, header row, forum page nav, compact list, pinned/superpin/OP highlight, zebra stripes. |
| Post cleanup | Avatars, karma, user id, geo, date, report links, signatures, edits, rate section, actions, reply titles, subscriber badge, compact posts, smaller avatars, long quote collapse. |
| Themes | Midnight, Catppuccin, Dracula, Nord, Gruvbox, AMOLED, Solarized, Blood. |
| Reading tools | OP highlight, post numbers, relative timestamps, permalinks, YouTube embeds, OP nav, collapse/expand all, quick search. |
| Thread tools | Hot badges, dim visited, title truncation, infinite forum scroll, infinite thread scroll, freshness colors, thread preview, auto refresh. |
| User tools | User mute list, user tags. |
| Media | Image lightbox, image gallery, auto-expand images. |
| Filtering | Hide thread buttons, keyword highlight, keyword hide, custom CSS. |
| Utility UI | Back-to-top, scroll progress, export/import settings. |

Missing or weak locally:

- No feature registry with lifecycle contracts.
- No per-feature teardown audit.
- No generated single-file userscript build.
- No MV3 source in this repo.
- No source-of-truth settings schema.
- No migration layer for stored settings.
- No TrustedTypes abstraction.
- No stable selector catalog embedded as code/data.
- No snapshot parser or fixture validation around the MHTML captures.
- No rate limiter for preview, auto-refresh, watcher, or infinite-scroll fetches.
- No `@updateURL` / `@downloadURL`.
- No distribution docs.
- No options page or popup.
- No DNR ad/widget blocking.
- No cross-device settings sync.
- No diagnostics panel.
- No accessibility pass beyond visual cleanup.
- No built-in issue capture/export bundle.

## MHTML Capture Findings

Both `.mhtml` files were parsed as multipart MHTML captures. The HTML and CSS parts decoded successfully. The captures are treated as the DOM ground truth for this roadmap.

### Capture: Forum Index

File: `Godlike Productions - Discussion Forum.mhtml`  
Saved URL: `https://www.godlikeproductions.com/forum1/pg1`  
Saved date: 2026-05-19 09:53:15 -0400  
MIME parts: 39  
HTML size: about 136 KB  
External CSS parts:

- `https://www.godlikeproductions.com/css/min-threads.css?v=1.48260106.6`
- `https://www.godlikeproductions.com/css/min-glpv4.css?v=4.167`

Observed framework and app model:

- Server-rendered, table-heavy multi-page app.
- No React, Vue, Angular, Next, Nuxt, GraphQL, or client-side store signal in the saved HTML.
- No inline scripts of interest in the capture.
- No visible CSP or TrustedTypes meta tag in the decoded HTML.
- Dark Reader attributes were present in the captured HTML, so generated `--darkreader-*` and `--d2l-*` CSS variables are not native site tokens.

Important ids and classes:

| Surface | Stable selector | Fragile or fallback selector | Notes |
| --- | --- | --- | --- |
| Page root | `html.glp_viewport_mobile`, `body.has_hdr_time_login_row` | `#wrap > #wrap_in` | Use body classes for feature scoping. |
| Header banner | `#glpbanner` | `.hdr_banner img`, `img[alt*="Godlike"]` | Safe to hide or replace. |
| Header time | `#glpHeaderTimeSrc`, `#glpHeaderTimeDst` | `.hdr_time`, `.hdr_time_login_row` | May be duplicated between source and destination. |
| Notifications | `#glpNotifyToggle`, `#glpNotifyBadge`, `#glpNotifyMenu`, `#glpNotifyList` | `.glp_notify_switch`, `.glp_notify_menu` | Stable ids are preferred. |
| Theme switcher | `#glpThemeMode` | `.theme_mode_switch` | Hide or harmonize with GLP Ultra theme state. |
| Viewport switcher | `#glpViewportToggle`, `#glpViewportMeta` | `.viewport_mode_switch` | Do not break mobile viewport behavior. |
| Top links | `#mainpagetoplinks` | `.pagetoplinks2`, `.hdr_top` | Hide or compress. |
| Login links | `#topnavlogin` | `.topnav_login`, `.loginlinks` | Preserve access when hidden through compact drawer. |
| Main nav | `.topnav.topnav_main`, `.mainpagenavlinks`, `.navlinks` | `.topnav a`, `table .navlinks` | Stable semantic classes exist. |
| Tab nav | `ul.tabnav`, `.tab_forum`, `.tab_day`, `.tab_extras` | `#tab_forum_1`, `#tab_curdate` | Use tabs as surface for compacting. |
| Forum container | `#forum_l`, `.threads-wrapper` | `#wrap_in > table`, `.rightpanel_ipad + *` | Main feed surface. |
| Thread table | `table.threads` | `.threads-wrapper table:first-of-type` | Central feed list. |
| Header row | `table.threads tr.threads_header_row` | `.threads tr:first-child` | Hide per settings. |
| Thread rows | `table.threads tbody tr:not(.threads_header_row)` | `table.threads tr:has(td.sfr)` | Avoid `:has` in runtime unless guarded. |
| Thread title cell | `table.threads td.sfr` | `td[class$="fr"]:has(a[href*="/message"])` | `.sfr` is semantic but class-based. |
| Thread link | `table.threads td.sfr > a[href*="/forum1/message"]` | `.threads a[href*="/message"]` | Best anchor for previews, hide, tags. |
| Icon column | `td.ifr` | `.threads tr > td:nth-child(1)` | Hideable. |
| Replies column | `td.rfr` | `.threads tr > td:nth-last-child(5)` | Numeric parsing needed. |
| Views column | `td.vifr` | `.threads tr > td:nth-last-child(4)` | Numeric parsing needed. |
| Posted/updated | `td.pfr`, `td.mfr`, `.vfr` | `.mobile-thread-meta .mtd-times` | Desktop and mobile differ. |
| Poster/user | `td.ufr`, `.mtd-poster` | `a[href*="/members/"]` | User tags and mutes. |
| Mobile thread meta | `.mobile-thread-meta`, `.mobile-thread-meta-details` | `[class*="mobile-thread"]` | Keep mobile-specific controls compact. |
| Pagination | `.navpages a[href*="/pg"]`, `.footer a[href*="/pg"]`, `.navdiv > a[href*="/pg"]` | `a[href*="/forum1/pg"]` | Avoid broad `a[href*="/pg"]` because other links include anchors. |
| Sidebar | `#rightpanel_wrap`, `#rightpanel_inner`, `.rightpanel_ipad` | `td.rightpanel`, `table[align="right"]` | Right rail and widgets. |
| Search | `form[action*="search.php"] input[name="q"]` | `input[aria-label="Search"]` | Only meaningful aria label found. |
| Ads/widgets | `[data-type="_mgwidget"]`, `amp-embed` | `iframe[src*="mgid"]`, `div[id*="M"][id*="Composite"]` | Avoid broad `[class*=ad]`; it collides with normal content. |
| Footer | `#footer`, `.footer` | `body > center:last-child` | Cleanup target. |
| Profile/member links | `a[href*="/members/"]`, `a[href*="karma"]`, `a[href*="profile"]` | `a[href*="member"]` | Base for user intelligence. |

Forms and endpoints observed on the forum index:

| Endpoint | Method | Controls | Use |
| --- | --- | --- | --- |
| `/search.php` | GET | `q`, submit | Site search integration and enhanced search launch. |
| `/forum1/pgN` | GET | path pagination | Infinite scroll, pager, prefetch, history restore. |

CSS token findings:

- The site CSS does not expose a clean native design-token system.
- The decoded CSS and captured document contain many generated Dark Reader variables such as `--darkreader-*` and `--d2l-*`; do not depend on them.
- Site colors are mostly hard-coded blues, dark grays, whites, and table-row colors.
- GLP Ultra should create its own token layer and map it over the site: `--glpx-bg`, `--glpx-bg-elevated`, `--glpx-panel`, `--glpx-panel-2`, `--glpx-border`, `--glpx-border-strong`, `--glpx-text`, `--glpx-muted`, `--glpx-accent`, `--glpx-accent-2`, `--glpx-danger`, `--glpx-warning`, `--glpx-success`, `--glpx-radius`, `--glpx-shadow`, `--glpx-z-overlay`, `--glpx-z-toast`, `--glpx-z-modal`.

### Capture: Thread Page

File: `Pentagon Urged No Resumption Of Strikes As Iran Grew More Effective Tracking US Air Ops_ NYT.mhtml`  
Saved URL pattern: `https://www.godlikeproductions.com/forum1/message6170474/pg1`  
Saved date: 2026-05-19 09:53:23 -0400  
HTML/CSS model: same server-rendered table app as the forum index.

Important ids and classes:

| Surface | Stable selector | Fragile or fallback selector | Notes |
| --- | --- | --- | --- |
| Thread table | `table.msg` | `.rightpanel_ipad > table.msg` | Main thread surface. |
| Post rows | `table.msg tr[id^="post_"]` | `tr[id^="post_"][class*="post_uid_"]` | Seven rows in capture. |
| Original post row | `#post_1` | `table.msg tr[id^="post_"]:first-of-type` | OP navigation anchor. |
| Member/user classes | `tr[class*="post_member_"]`, `tr[class*="post_uid_"]` | `tr[id^="post_"][class]` | Useful as fragile fingerprint only. |
| Author cell | `td.messageauthor`, `td.replyauthor` | `tr[id^="post_"] > td:first-child` | User tools attach here. |
| Author header | `.author_header` | `td.messageauthor b`, `td.replyauthor b` | Extract display name. |
| Author date | `.author_date` | `td.messageauthor small`, `td.replyauthor small` | Date transforms. |
| Post content cell | `td.messagecontent`, `td.replycontent` | `tr[id^="post_"] > td:nth-child(2)` | Layout cleanup. |
| Post body | `.post_main` | `.messagecontent .post_wrap > div:nth-of-type(2)`, `.replycontent .post_wrap > div:nth-of-type(2)` | Core reader transforms. |
| Post title | `.msgtitle` | `.post_wrap > div:first-child` | Hide or compact. |
| Quotes | `.quoteo` | `.post_main div[class*="quote"]` | Collapse, expand, style. |
| Top nav | `.messagetopnavlinks`, `.messagetoplinks`, `.glp_msgnav_wrap`, `.navctrl` | `td.nav a[href*="/message"]` | Pagination and thread tools. |
| Bottom nav | `.messagebottomnavlinks`, `.glp_msgnav_wrap` | `td.nav:last-child a` | Keep access in compact nav. |
| Thread vote | `form[action*="/bbs/vote.php"]` | `.thread_top_controls form` | Preserve or hide. |
| Reply/composer link | `a[href*="/bbs/reply.php"]`, `form[action*="/bbs/reply.php"]` | `.messagetoplinks a[href*="reply"]` | Captures links; full composer page was not present. |
| In-thread search | `#replies_q`, `#highlight_q`, `tr#msgsearch form` | `form[action*="/message"][method="GET"]` | Build enhanced thread search on top. |
| Related threads | `table.threads.related` | `.threads-wrapper table.threads` scoped outside main feed | Hide or collapse. |
| Report/reply/karma actions | `a[href*="report"]`, `a[href*="reply"]`, `a[href*="karma"]` | `.post_actions a` | Per-post action cleanup and command row. |
| X/Twitter embed | `iframe#twitter-widget-0[title="X Post"]`, `iframe[data-tweet-id]` | `iframe[src*="twitter"]`, `iframe[src*="x.com"]` | Media expando/lightbox handling. |
| Media widgets | `[data-type="_mgwidget"]`, `[data-website="1017911"]` | `iframe[src*="mgid"]`, `amp-embed` | Network and DOM blocking. |

Forms and endpoints observed on the thread page:

| Endpoint | Method | Controls | Use |
| --- | --- | --- | --- |
| `/forum1/message{threadId}/pgN` | GET | path pagination | Infinite thread scroll, thread watcher, page prefetch, export. |
| `/bbs/vote.php` | POST | `vote=1..5` | Rating UI preservation or compact replacement. |
| `/bbs/reply.php` | GET/POST link surface | message id, page, forum parameters inferred from links | Floating reply launcher and draft support need a live composer capture. |
| Current thread URL | GET | `replies_q`, `highlight_q` | Enhanced thread search and highlight. |

API and script findings:

- No GraphQL endpoints, query ids, feature flags, auth headers, or client state stores were present in either MHTML capture.
- No reusable inline script APIs were available in the saved documents.
- The site relies on normal same-origin HTML requests and cookies.
- Features that fetch pages must parse returned HTML with `DOMParser` and process fragments, not replace full documents.
- All network features need a shared limiter: default 1 request per second, burst 2, exponential backoff on failures, pause on hidden tabs, and cache by URL plus content hash.

SPA and routing findings:

- This is not an SPA in the captures.
- Hooks are `document-start`, `DOMContentLoaded`, `pageshow`, `visibilitychange`, and explicit fragment processing after same-origin fetches.
- MutationObserver should be scoped to known roots (`#forum_l`, `table.msg`, `#rightpanel_inner`, notification menu) and process `addedNodes` only. Never full-document scan on every mutation.

## Phase 1: Competitive Landscape

The research covered userscript directories, userstyle archives, extension stores, GitHub repositories/code search, ad-filter repos, and adjacent best-in-class forum/browser customization tools. GLP-specific public tooling is sparse; the strongest site-specific baselines are the local script, an internal GLP Enhanced extension/userscript repository, a public legacy suite userscript, an old UserStyles theme, and ad-filter rules. Adjacent tools define the quality bar for features GLP tools do not yet implement.

### Ranked Tools And Sources

| Rank | Tool/source | Author/owner | Type | Popularity | Last updated | Feature count used for roadmap | Best implementation observed | Source |
| ---: | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1 | Dark Reader | `darkreader` | Extension | 22,011 GitHub stars, 2,707 forks | 2026-05-19 repo update; v4.9.125 on 2026-04-28 | 10 | Mature dark rendering, per-site fixes, color controls, image dimming, cross-browser release discipline. | `https://github.com/darkreader/darkreader` |
| 2 | Stylus | `openstyles` | Extension/userstyle manager | 6,629 GitHub stars, 362 forks | 2026-05-19 repo update; v2.3.24 on 2026-05-19 | 9 | Theme management, updateable userstyles, editor/import/export, site scoping. | `https://github.com/openstyles/stylus` |
| 3 | Reddit Enhancement Suite | `honestbleeps` | Forum extension | 4,433 GitHub stars, 887 forks | 2026-05-19 repo update; v5.24.8 on 2025-01-22 | 22 | Large modular settings console, never-ending pages, filters, user tagging, media tools, per-module enablement. | `https://github.com/honestbleeps/Reddit-Enhancement-Suite` |
| 4 | Hover Zoom+ | `extesy` | Extension | 2,025 GitHub stars, 211 forks | 2026-05-14 repo update; 1.1.14 on 2026-04-27 | 6 | Image hover zoom, gallery style preview, site plug-in pattern. | `https://github.com/extesy/hoverzoom` |
| 5 | 4chan X | `ccd0` | Imageboard userscript/extension | 1,118 GitHub stars, 157 forks | 2026-05-18 repo update | 28 | Thread watcher, post tracking, filters, imageboard navigation, settings import/export, cross-device data sync concerns. | `https://github.com/ccd0/4chan-x` |
| 6 | GLP Enhanced | `SysAdminDoc` | Private GLP MV3 extension + userscript | 0 stars, private repo | 2026-04-26 repo update; v3.0.1 on 2026-04-10 | 36 | Best current GLP-specific baseline: MV3 plus userscript, 8 themes, ad cleanup, infinite scroll, lightbox, mute/tag, filters. | `https://github.com/SysAdminDoc/GLP-Enhanced` |
| 7 | Local GLP Enhanced Declutter | Local repo | GLP userscript | Local only | 2026-05-19 file timestamp | 40 | Broadest local single-file feature surface and current DOM assumptions. | `GLP_Enhanced_-_Godlike_Productions_Declutter.user.js` |
| 8 | GodLikeProductions Enhanced Suite | Matthew Parker / `SysAdminDoc/Scripts` | Public GLP userscript | 0 repo stars, install count unavailable | 2026-05-18 repo update | 34 | Older all-in-one GLP cleanup suite with tabs, block lists, theme controls, autopager, meme filters. | `https://github.com/SysAdminDoc/Scripts` |
| 9 | God Like Productions - Alien Green | MuskMan | UserStyle | 371 total installs, 0 weekly installs in archive | 2010-08-28 | 7 | Only found GLP-specific archived theme: black/green styling and ad/table hiding. | `https://raw.githubusercontent.com/uso-archive/data/master/data/uso-styles/36180.json` |
| 10 | uBlock Origin uAssets GLP filters | uBlock Origin maintainers | Filter rules | uBlock ecosystem scale; repo-specific count not used | 2025 filter file hit | 3 | Scriptlet blocking for GLP anti-adblock or blocker prompts. | `https://github.com/uBlockOrigin/uAssets/blob/3ade1e4e1b064a90ca044c86ac6bfbfc82d56d52/filters/filters-2025.txt` |
| 11 | Greasy Fork GLP search | Greasy Fork | Userscript directory | No GLP results found | Checked 2026-05-19 | 0 | Negative evidence: no active public GLP-specific script in Greasy Fork API search. | `https://api.greasyfork.org/en/scripts/by-site/godlikeproductions.com.json` |
| 12 | OpenUserJS GLP search | OpenUserJS | Userscript directory | No result page observed; later rate limited | Checked 2026-05-19 | 0 | Negative evidence: no active public GLP-specific script found. | `https://openuserjs.org/?q=Godlike%20Productions` |
| 13 | Edge Add-ons search | Microsoft Edge Add-ons | Extension store | No GLP result text in fetched search page | Checked 2026-05-19 | 0 | Negative evidence: no obvious GLP-specific Edge listing. | `https://microsoftedge.microsoft.com/addons/search/godlike%20productions` |
| 14 | Chrome Web Store and AMO searches | Google/Mozilla stores | Extension stores | No exact GLP-specific listing found by web/store search; AMO API fetch was blocked locally | Checked 2026-05-19 | 0 | Negative evidence plus distribution opportunity. | `https://chromewebstore.google.com/`, `https://addons.mozilla.org/` |

### Competitive Feature Notes

| Tool | Full feature list captured for planning |
| --- | --- |
| GLP Enhanced / local GLP userscript | Ad/widget/AMP removal, header cleanup, nav cleanup, thread columns, post metadata hiding, compact modes, 8 dark themes, OP highlighting, post numbers, relative timestamps, permalinks, YouTube embeds, OP nav, collapse all, thread quick search, hot badges, dim visited/anon, infinite forum/thread scroll, freshness colors, mute list, user tags, scroll progress, thread preview, auto refresh, image lightbox/gallery, collapsible posts, hide thread buttons, keyword highlight/hide, custom CSS, settings import/export, anti-FOUC. |
| Legacy GodLikeProductions Enhanced Suite | Banner/footer/related/karma/action/nav/poll/signature/report/header hiding, compact posts, wider content, compact quotes, user id/geo/date hiding, compact thread list, pinned highlighting, sticky nav, smooth scrolling, font/line-height/quote color controls, user blocker, meme filter, autopager, tabbed settings, manual thread hiding, hide pinned/karma threads, avatar/animated-gif hiding, collapsible quotes, collapse by default, sort-by-new, old jQuery-driven behavior, light theme that GLP Ultra will not carry forward. |
| God Like Productions - Alien Green | Black and green theme, Courier-style typography, old right-panel/table hiding, row spacing/borders, link hover/visited styling, red title accents, quote coloring, aggressive legacy table selectors. |
| uBlock uAssets | GLP and godlike.com scriptlet rule for removing blocker/alert scripts. |
| Dark Reader | Dynamic dark rendering, static/dynamic modes, per-site fixes, brightness/contrast/sepia/grayscale controls, image dimming, export/import, browser extension packaging. |
| Stylus | Userstyle install/update/edit, site matching, CSS variable/theme composition, backup/import/export, browser extension UI. |
| RES | Module registry, settings console, never-ending pages, filtering, user tags, comment navigation, media viewer, account/subreddit tooling, import/export, per-module documentation. |
| 4chan X | Thread watcher, last-read tracking, quote/backlink tooling, post hiding/filtering, image expansion, catalog/thread UX, sync/data caveats, settings backup. |
| Hover Zoom+ | Hover image preview, media source resolution, per-site plug-in rules, gallery-like preview controls. |

## Phase 2: Feature Catalog And Gap Analysis

The final scope is the union of observed GLP features, strong adjacent forum-extension features, and practical gap-fill ideas that fit GLP's DOM and user workflows.

### Feature Matrix

Legend: `Y` = present or strongly represented, `P` = partial/weak/adjacent, `-` = not observed, `N/A` = not applicable.

| Feature | Local GLP | GLP Enhanced | Legacy Suite | Alien Green | uBlock | Dark Reader | Stylus | RES | 4chan X | Hover Zoom+ | Best implementation note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dark-only theme presets | Y | Y | P | Y | - | Y | Y | P | P | - | Combine local 8 themes with Dark Reader-grade controls and Stylus-grade user CSS. |
| OLED/AMOLED mode | Y | Y | - | P | - | P | Y | - | - | - | Use true black base plus accessible contrast tokens. |
| Site CSS token layer | P | P | - | - | - | P | Y | - | - | - | GLP Ultra must own `--glpx-*` tokens because site has no native tokens. |
| Dense mode | Y | Y | Y | P | - | - | Y | Y | Y | - | Add density presets with stable row heights and no layout shift. |
| Glass premium overlay | P | P | - | - | - | - | - | - | - | - | Use translucent panels, borders, and shadows without content-script blur filters. |
| Anti-FOUC at document-start | Y | Y | Y | - | N/A | Y | Y | - | Y | - | Early body class plus critical CSS block before idle modules. |
| MGID/widget removal | Y | Y | P | P | Y | - | - | - | - | - | DOM removal plus MV3 DNR rules. |
| AMP embed hiding | Y | Y | - | - | - | - | - | - | - | - | Preserve user option to show. |
| Anti-adblock prompt mitigation | P | P | P | - | Y | - | - | - | - | - | MV3 DNR and DOM scriptlet strategy; avoid brittle message text. |
| Header/banner cleanup | Y | Y | Y | P | - | - | Y | P | P | - | Hide, compress, or move into utility drawer. |
| Sidebar/right rail cleanup | Y | Y | Y | Y | P | - | Y | P | P | - | Use `#rightpanel_wrap` stable id first. |
| Nav/tab compacting | Y | Y | Y | P | - | - | Y | Y | Y | - | Keep all actions reachable through compact menu. |
| Thread column controls | Y | Y | P | - | - | - | Y | P | P | - | Per-column toggles for icon, replies, views, rating, posted, updated, poster. |
| Compact thread list | Y | Y | Y | P | - | - | Y | Y | Y | - | Dense but scannable rows. |
| Thread hide with restore bar | Y | Y | Y | - | - | - | - | P | Y | - | Add undo toast, hidden count, per-thread reason. |
| Thread mute/watch states | P | P | - | - | - | - | - | Y | Y | - | Add watched, muted, read, unread delta, and stale states. |
| Visited/read dimming | Y | Y | - | - | - | - | - | Y | Y | - | Use URL + thread id cache. |
| Hot/fresh/stale badges | Y | Y | - | - | - | - | - | P | P | - | Compute from replies/views/update time. |
| Thread preview hover/card | Y | Y | - | - | - | - | - | P | P | P | Rate-limited same-origin fetch, cache, sanitize. |
| Infinite forum scroll | Y | Y | Y | - | - | - | - | Y | P | - | Fragment parser and scoped feature reapply. |
| Infinite thread scroll | Y | Y | P | - | - | - | - | Y | P | - | Preserve anchors and page boundaries. |
| Reader mode | - | P | P | - | - | Y | Y | P | P | - | New GLP gap: distraction-free thread reading. |
| Post metadata controls | Y | Y | Y | - | - | - | Y | P | P | - | Hide avatar, karma, uid, geo, date, edits, report/rate. |
| OP highlight and OP nav | Y | Y | - | - | - | - | - | P | Y | - | Add OP-only timeline and sticky mini-map. |
| Post numbers/permalinks | Y | Y | - | - | - | - | - | Y | Y | - | Stable copy action with toast. |
| Quote styling/collapse | Y | Y | Y | P | - | - | Y | Y | Y | - | Add nested quote depth and expand-on-demand. |
| Backlinks/quote graph | - | - | - | - | - | - | - | P | Y | - | New GLP gap: inferred quote/backlink relationships where possible. |
| Collapsible posts | Y | Y | P | - | - | - | - | P | Y | - | Preserve hidden count and undo. |
| Collapse all / expand all | Y | Y | P | - | - | - | - | P | Y | - | Visible toolbar controls only. |
| In-thread quick search | Y | Y | P | - | - | - | - | P | Y | - | Wrap native `replies_q` with instant client filter. |
| Keyword highlight | Y | Y | P | - | - | - | - | Y | Y | - | Regex and plain text modes with preview. |
| Keyword hide/filter | Y | Y | Y | - | - | - | - | Y | Y | - | Actions: dim, hide, tag, toast, watch. |
| User mute/block | Y | Y | Y | - | - | - | - | Y | Y | - | Match display name plus member/profile href. |
| User tags | Y | Y | - | - | - | - | - | Y | P | - | Add color, note, source, export/import. |
| User reputation overlay | - | P | - | - | - | - | - | Y | P | - | New GLP gap: local reputation only, not public scoring. |
| Per-user notes | - | - | - | - | - | - | - | Y | P | - | Attach private notes to profile/member id. |
| Media lightbox | Y | Y | - | - | - | - | - | P | Y | Y | Hover Zoom+ sets media quality bar. |
| Image gallery | Y | Y | - | - | - | - | - | P | Y | Y | Thread-level media strip. |
| Auto image expansion | Y | Y | P | - | - | - | - | P | Y | Y | Safe lazy expansion with max size controls. |
| YouTube/X embed handling | Y | Y | - | - | - | - | - | P | Y | P | Add privacy mode and fallback links. |
| Download/open media actions | - | - | - | - | - | - | - | P | Y | Y | New GLP gap for extension build; userscript same-origin limits apply. |
| Floating reply launcher | - | P | - | - | - | - | - | P | Y | - | Needs live composer capture before implementation. |
| Draft autosave | - | - | - | - | - | - | - | P | P | - | New GLP gap, local-only drafts. |
| Thread watcher | - | P | - | - | - | - | - | Y | Y | - | Background alarms in MV3, tab-local timer in userscript. |
| Auto-refresh | Y | Y | - | - | - | - | - | P | P | - | Shared rate limiter, hidden-tab pause. |
| Notifications digest | - | - | - | - | - | - | - | P | P | - | New GLP gap: local watched-thread digest. |
| Data export | P | P | - | - | - | - | P | Y | Y | - | Settings plus thread export to Markdown/HTML/JSON. |
| Settings import/export | Y | Y | P | - | - | Y | Y | Y | Y | - | Schema versioned backups. |
| Settings search | - | P | P | - | - | Y | Y | Y | Y | - | New GLP gap in local script. |
| Extension options page | - | Y | - | - | - | Y | Y | Y | Y | Y | MV3 build only. |
| Toolbar popup | - | Y | - | - | - | Y | Y | Y | P | Y | Quick toggles, current page stats, pause. |
| Storage sync | - | P | - | - | - | P | P | Y | P | - | MV3 optional sync, userscript export fallback. |
| Context menu actions | - | P | - | - | - | P | - | P | P | P | MV3 only: hide thread/user, tag user, preview media. |
| DNR/network blocking | - | P | - | - | Y | - | - | - | - | - | MV3 advantage over userscript. |
| Diagnostics panel | - | - | - | - | - | - | - | P | P | - | New GLP gap: selector health and performance timings. |
| Self-healing selector registry | - | - | - | - | - | - | - | P | P | - | New GLP gap, mandatory for churn. |
| Accessibility controls | P | P | P | - | - | Y | P | P | P | - | Add motion, contrast, font, target size, semantic labels. |
| Reduced motion | - | - | - | - | - | Y | P | P | P | - | New GLP requirement due premium animations. |
| Custom CSS | Y | Y | P | Y | - | P | Y | P | P | - | Sandbox and scope under `body.glpx-enabled`. |
| Plugin/preset packs | - | P | - | - | - | - | Y | Y | P | P | New GLP gap: importable filter/theme packs. |
| README/distribution docs | - | Y | P | - | - | Y | Y | Y | Y | Y | Planned build deliverable. |
| No-confirm undo flow | - | - | - | - | N/A | P | P | P | P | P | GLP Ultra requirement. |
| No keyboard shortcuts | - | - | - | N/A | N/A | N/A | N/A | - | - | N/A | GLP Ultra requirement: all command access is visible. |

### Gap Analysis

High-value gaps: none open. Items blocked on input from outside the codebase live in
`Roadmap_Blocked.md`.

Nothing open. Items blocked on input from outside the codebase live in `Roadmap_Blocked.md`.

## Phase 3: Technical Reconnaissance

### Selector Strategy

Use a selector registry:

```text
surfaceKey:
  stable: [selectors chosen from ids, attributes, form actions, semantic classes, structure]
  fallback: [fragile class or positional fallback selectors]
  mode: one | many
  churn: low | medium | high
  ownerFeature: core | feed | thread | media | settings | moderation
```

Runtime rules:

- Query stable selectors first.
- If no stable match, try fallback selectors and log a selector health warning.
- For high-churn surfaces, use `findElement(surfaceKey, root)` over a selector list and cache per root.
- For async surfaces, use `waitForElement(surfaceKey, { root, timeout, backoff })`.
- Never bind features directly to hashed or obfuscated class names unless they are in fallback lists.
- MutationObserver callbacks process only `addedNodes`; each added node is normalized to candidate roots and passed through relevant feature processors.
- Reprocess fragments fetched by infinite scroll with the same registry used for initial load.

High-churn surfaces:

| Surface | Reason | Required protection |
| --- | --- | --- |
| Thread rows | Forum list classes and mobile/desktop table variants can drift. | Stable link extraction by URL pattern plus row normalization. |
| Post body | Table wrappers differ between OP and replies. | Normalize post row object with author/content/actions/body fields. |
| Ads/widgets | Ad vendors rotate ids and wrapper shapes. | Attribute-first blockers plus DNR in extension. |
| Notifications | Site ids are stable now but menu internals may change. | Guard optional controls and avoid replacing native handlers. |
| Composer/reply | Full composer capture is missing. | Live-site capture required before implementation. |
| Embedded media | Twitter/X/YouTube iframe attributes change often. | Provider-specific media adapter registry. |

### Route And View Handling

Route classifier:

| Route | URL pattern | View key | Features |
| --- | --- | --- | --- |
| Forum index | `/forum1/pgN`, `/forum1/` | `feed` | Feed declutter, thread list, filters, previews, infinite scroll. |
| Thread page | `/forum1/message{threadId}/pgN` | `thread` | Reader tools, post filters, media, OP nav, watcher, export. |
| Search | `/search.php` | `search` | Search cleanup and saved searches. |
| Reply/composer | `/bbs/reply.php` | `composer` | Drafts, compact composer, upload/media helpers after capture. |
| Member/profile | `/members/`, `profile`, `karma` | `profile` | User notes/tags, profile cleanup after capture. |
| Other | fallback | `generic` | Theme, ads, header/nav/sidebar cleanup only. |

Lifecycle:

- `document-start`: load settings, add `glpx-boot`, inject critical CSS, set theme/density classes.
- `DOMContentLoaded`: initialize registry, classify route, process route root.
- `pageshow`: re-run lightweight route sanity for BFCache restores.
- `visibilitychange`: pause/resume fetch queues, auto-refresh, watcher timers, shimmer/animation work.
- Infinite-scroll fetch completion: parse with `DOMParser`, extract target rows/posts, append to stable insertion point, process appended fragment.

### Site APIs And Network Use

No JSON, GraphQL, or documented API was found. Treat GLP as an HTML endpoint site.

| Capability | Endpoint/source | Auth | Rate limit | Notes |
| --- | --- | --- | --- | --- |
| Forum page fetch | `/forum1/pgN` | Site cookies | 1 req/sec, burst 2 | Used for infinite scroll and feed prefetch. |
| Thread page fetch | `/forum1/message{id}/pgN` | Site cookies | 1 req/sec, burst 2 | Used for thread scroll, previews, watcher, export. |
| Search | `/search.php?q=...` | Site cookies | User-initiated only | Keep native search reachable. |
| Thread search | current thread URL with `replies_q`, `highlight_q` | Site cookies | User-initiated only | Enhance locally where possible. |
| Vote | `/bbs/vote.php` POST | Site cookies/session | User-initiated only | Do not automate voting. |
| Reply | `/bbs/reply.php` | Site cookies/session | User-initiated only | Do not automate posting; drafts are local until user submits. |
| Notifications | DOM ids only in capture | Site cookies/session | No fetch until live check | Preserve native UI; optional digest later. |
| Media embeds | iframe/link URLs | Provider-specific | Lazy and user-initiated | Avoid surprise cross-origin fetch in userscript. |

Rate limiter:

- Queue all same-origin background fetches.
- Priorities: visible user action > preview > infinite scroll > watcher > diagnostics.
- Abort queued background work on route change.
- Backoff on 429, 403, 5xx, network failure, or repeated parse misses.
- Cache preview/export HTML by URL and content hash.
- Never post forms automatically.

### CSP, TrustedTypes, And Security

Observed constraints:

- Saved HTML does not show CSP or TrustedTypes meta restrictions.
- No inline app scripts were available for hook reuse.
- The page can include third-party iframes/widgets.

Required constraints anyway:

- All string HTML goes through a single `safeHTML`/TrustedTypes-compatible policy.
- Prefer `document.createElement`, `textContent`, `replaceChildren`, and template cloning.
- Never execute page scripts or parse third-party widget scripts.
- Keep userscript data local through `GM_getValue`/`GM_setValue`.
- MV3 extension uses least-privilege host permissions for GLP only, with optional permissions for media providers if a later feature needs them.
- Custom CSS is scoped under `body.glpx-enabled` and stored as user content; provide disable/recovery path.

### Userscript Versus Extension Recommendation

Build both from a shared source tree.

Userscript wins for:

- Single-file delivery.
- Fast install and update through script managers.
- Lower friction for GLP power users.
- Portability across Chromium/Firefox with Tampermonkey/Violentmonkey.

MV3 extension wins for:

- `declarativeNetRequest` blocking before DOM paint.
- Toolbar popup and full options page.
- Background alarms for watcher/digest.
- `chrome.storage.local`/optional `chrome.storage.sync`.
- Context menus.
- Store distribution.
- Cleaner packaging and reviewable permissions.

Shared code should not depend on extension-only APIs. Use adapters:

| Adapter | Userscript | MV3 extension |
| --- | --- | --- |
| Storage | `GM_getValue`, `GM_setValue` | `chrome.storage.local`, optional sync |
| Style | `GM_addStyle` plus `<style data-glpx>` | content CSS plus dynamic `<style data-glpx>` |
| Menu | `GM_registerMenuCommand` | toolbar popup/options/context menus |
| Network | same-origin `fetch` with cookies | content fetch plus background fetch where needed |
| Blocking | DOM removal | DNR plus DOM cleanup |
| Notifications | toast only | toast plus optional browser notifications |

### Architecture

Future file layout:

```text
GLP-Ultra/
|-- README.md
|-- CHANGELOG.md
|-- LICENSE
|-- ROADMAP.md
|-- package.json
|-- src/
|   |-- core/
|   |   |-- boot.js
|   |   |-- registry.js
|   |   |-- routes.js
|   |   |-- selectors.js
|   |   |-- settings-schema.js
|   |   |-- storage.js
|   |   |-- trusted-html.js
|   |   |-- dom.js
|   |   |-- css.js
|   |   |-- observer.js
|   |   |-- fetch-queue.js
|   |   |-- toast.js
|   |   `-- diagnostics.js
|   |-- features/
|   |   |-- ads.js
|   |   |-- theme.js
|   |   |-- layout.js
|   |   |-- feed.js
|   |   |-- thread.js
|   |   |-- media.js
|   |   |-- filters.js
|   |   |-- users.js
|   |   |-- watcher.js
|   |   |-- export.js
|   |   |-- accessibility.js
|   |   `-- custom-css.js
|   |-- ui/
|   |   |-- settings-panel.js
|   |   |-- popup-shared.js
|   |   |-- command-drawer.js
|   |   |-- recovery-shelf.js
|   |   `-- components.js
|   |-- adapters/
|   |   |-- userscript.js
|   |   `-- extension.js
|   |-- styles/
|   |   |-- critical.css
|   |   |-- base.css
|   |   |-- themes.css
|   |   `-- components.css
|   `-- manifest/
|       |-- userscript.meta.js
|       |-- manifest.chrome.json
|       |-- manifest.firefox.json
|       `-- rules.dnr.json
|-- scripts/
|   |-- parse-mhtml.js
|   |-- build-userscript.js
|   |-- build-extension.js
|   |-- package-extension.js
|   `-- verify-captures.js
|-- captures/
|   |-- forum-index.mhtml
|   `-- thread-page.mhtml
`-- dist/
    |-- glp-ultra.user.js
    |-- glp-ultra-mv3.zip
    `-- glp-ultra-mv3.crx
```

Feature contract:

```text
feature = {
  id,
  title,
  category,
  routes,
  settingsKeys,
  init(ctx),
  apply(ctx, root),
  destroy(ctx),
  diagnostics(ctx)
}
```

Rules:

- `init()` registers observers/listeners once.
- `apply()` is idempotent and accepts a root node or fragment.
- `destroy()` reverses everything: body classes, injected nodes, inline data markers, listeners, observers, timers, caches where needed.
- Features tag DOM they own with `data-glpx-owner="<featureId>"`.
- No feature reads storage directly; it receives settings from context.
- No feature performs raw fetch directly; it uses the fetch queue.
- No feature injects raw HTML directly; it uses DOM helpers or `trustedHTML`.

State strategy:

| State | Storage | Notes |
| --- | --- | --- |
| Settings | `glpx.settings.v1` | Schema versioned object. |
| Hidden threads | `glpx.hiddenThreads.v1` | Thread id, title, reason, timestamp. |
| Hidden posts | `glpx.hiddenPosts.v1` | Thread id, post id, reason, timestamp. |
| Muted users | `glpx.mutedUsers.v1` | Name/profile key, match mode, note, timestamp. |
| User tags | `glpx.userTags.v1` | Profile key, label, color, note, timestamp. |
| Watched threads | `glpx.watchedThreads.v1` | Thread id, URL, title, last seen post/page, last checked. |
| Read state | `glpx.readState.v1` | Thread id, page, post id, timestamp. |
| Drafts | `glpx.drafts.v1` | Thread id, text, updated; only after composer capture. |
| Theme customizations | `glpx.theme.v1` | Preset, accent, density, contrast, custom CSS hash. |
| Diagnostics opt-in | `glpx.diagnostics.v1` | Local debug data only; exportable by user. |

## Selector And API Reference

Use this as the initial implementation registry.

| Surface key | Stable selectors | Fallback selectors | Churn | Feature owners |
| --- | --- | --- | --- | --- |
| `root.wrap` | `#wrap`, `#wrap_in` | `body > center`, `body > table` | Medium | core, theme |
| `header.banner` | `#glpbanner` | `.hdr_banner img`, `img[alt*="Godlike"]` | Low | layout |
| `header.time` | `#glpHeaderTimeSrc`, `#glpHeaderTimeDst` | `.hdr_time`, `.hdr_time_login_row` | Medium | layout |
| `header.notifications` | `#glpNotifyToggle`, `#glpNotifyMenu`, `#glpNotifyList` | `.glp_notify_switch`, `.glp_notify_menu` | Medium | layout, notifications |
| `header.themeSwitch` | `#glpThemeMode` | `.theme_mode_switch` | Low | theme |
| `nav.topLinks` | `#mainpagetoplinks` | `.pagetoplinks2`, `.hdr_top` | Low | layout |
| `nav.main` | `.topnav.topnav_main`, `.mainpagenavlinks`, `.navlinks` | `.topnav a` | Medium | layout |
| `nav.tabs` | `ul.tabnav`, `.tab_forum`, `.tab_day`, `.tab_extras` | `#tab_forum_1`, `#tab_curdate` | Medium | layout |
| `feed.container` | `#forum_l`, `.threads-wrapper` | `#wrap_in table`, `.rightpanel_ipad + *` | Medium | feed |
| `feed.table` | `table.threads` | `.threads-wrapper table:first-of-type` | Medium | feed |
| `feed.headerRow` | `table.threads tr.threads_header_row` | `.threads tr:first-child` | Low | feed |
| `feed.rows` | `table.threads tbody tr:not(.threads_header_row)` | `.threads tr` filtered by message link | High | feed, filters |
| `feed.threadLink` | `table.threads td.sfr > a[href*="/forum1/message"]` | `.threads a[href*="/message"]` | Medium | feed, previews |
| `feed.iconCell` | `td.ifr` | `.threads tr > td:nth-child(1)` | Medium | feed |
| `feed.titleCell` | `td.sfr` | `td[class$="fr"]` with message link | High | feed, filters |
| `feed.userCell` | `td.ufr`, `.mtd-poster` | `a[href*="/members/"]` near row | High | users |
| `feed.repliesCell` | `td.rfr` | numeric cell near views/rating | High | feed |
| `feed.viewsCell` | `td.vifr` | numeric cell near replies/rating | High | feed |
| `feed.ratingCell` | `td.hfr` | rating icon/number cell | High | feed |
| `feed.postedCell` | `td.pfr`, `.mtd-posted` | `.mobile-thread-meta .mtd-times` | High | feed |
| `feed.updatedCell` | `td.mfr`, `.mtd-updated` | `.mobile-thread-meta .mtd-times` | High | feed |
| `feed.pagination` | `.navpages a[href*="/pg"]`, `.footer a[href*="/pg"]`, `.navdiv > a[href*="/pg"]` | `a[href*="/forum1/pg"]` | Medium | infinite-scroll |
| `sidebar.root` | `#rightpanel_wrap`, `#rightpanel_inner`, `.rightpanel_ipad` | `td.rightpanel`, `table[align="right"]` | Medium | layout, ads |
| `search.site` | `form[action*="search.php"] input[name="q"]` | `input[aria-label="Search"]` | Low | search |
| `ads.widgets` | `[data-type="_mgwidget"]`, `amp-embed` | `iframe[src*="mgid"]`, `div[id*="Composite"]` | High | ads |
| `footer.root` | `#footer`, `.footer` | `body > center:last-child` | Medium | layout |
| `thread.table` | `table.msg` | `.rightpanel_ipad > table.msg` | Medium | thread |
| `thread.rows` | `table.msg tr[id^="post_"]` | `tr[id^="post_"][class*="post_uid_"]` | Medium | thread, filters |
| `thread.op` | `#post_1` | `table.msg tr[id^="post_"]:first-of-type` | Low | thread |
| `post.authorCell` | `td.messageauthor`, `td.replyauthor` | `tr[id^="post_"] > td:first-child` | Medium | users |
| `post.authorName` | `.author_header` | `td.messageauthor b`, `td.replyauthor b` | Medium | users |
| `post.date` | `.author_date` | author-cell date text | Medium | thread |
| `post.contentCell` | `td.messagecontent`, `td.replycontent` | `tr[id^="post_"] > td:nth-child(2)` | Medium | thread |
| `post.body` | `.post_main` | `.messagecontent .post_wrap > div:nth-of-type(2)`, `.replycontent .post_wrap > div:nth-of-type(2)` | High | thread, filters |
| `post.title` | `.msgtitle` | `.post_wrap > div:first-child` | Medium | thread |
| `post.quote` | `.quoteo` | `.post_main div[class*="quote"]` | High | thread |
| `thread.topNav` | `.messagetopnavlinks`, `.messagetoplinks`, `.glp_msgnav_wrap`, `.navctrl` | `td.nav a[href*="/message"]` | Medium | thread |
| `thread.bottomNav` | `.messagebottomnavlinks`, `.glp_msgnav_wrap` | `td.nav:last-child a` | Medium | thread |
| `thread.vote` | `form[action*="/bbs/vote.php"]` | `.thread_top_controls form` | Medium | thread |
| `thread.replyLink` | `a[href*="/bbs/reply.php"]`, `form[action*="/bbs/reply.php"]` | `.messagetoplinks a[href*="reply"]` | High | composer |
| `thread.search` | `#replies_q`, `#highlight_q`, `tr#msgsearch form` | `form[action*="/message"][method="GET"]` | Medium | search |
| `thread.related` | `table.threads.related` | `.threads-wrapper table.threads` outside feed route | Medium | layout |
| `post.actions` | `a[href*="report"]`, `a[href*="reply"]`, `a[href*="karma"]` | `.post_actions a` | High | thread |
| `media.twitter` | `iframe[title="X Post"]`, `iframe[data-tweet-id]` | `iframe[src*="twitter"]`, `iframe[src*="x.com"]` | High | media |
| `media.youtube` | `a[href*="youtube.com/watch"]`, `a[href*="youtu.be/"]`, `iframe[src*="youtube"]` | text URL parser in post body | High | media |
| `profile.link` | `a[href*="/members/"]`, `a[href*="profile"]`, `a[href*="karma"]` | author cell links | Medium | users |
| `modal.regNag` | `.prompt-register a[href*="regp="]` | `[class*="prompt"] a[href*="regp="]` | High | ads, layout |
| `settings.native` | none | none | N/A | GLP Ultra owns settings UI |

## Architecture Details

### Settings Schema

Storage key: `glpx.settings.v1`  
Migration key: `glpx.schemaVersion`  
Default mode: enabled, dark-only, dense but readable, reduced motion follows system preference.

Each setting has:

```text
{
  key,
  category,
  label,
  control,
  default,
  apply: immediate,
  routes,
  featureId
}
```

Controls:

- `toggle` for binary settings.
- `select` for presets.
- `slider` or `stepper` for numeric values.
- `textarea` for lists, regexes, and custom CSS.
- `action` for export, import, reset with undo, and diagnostics.

### Settings Panel Spec

The settings panel is a dark glass command surface with left category rail, search, current-route summary, and immediate-apply controls. It is not a marketing page. It must be dense, scannable, and reversible.

Global panel behavior:

- Inactive overlay shell uses `pointer-events: none`; active panel restores pointer events on the dialog surface.
- No confirmation dialogs. Reset and destructive list actions show toast with undo.
- Every toggle applies immediately and calls feature `init/apply/destroy` as needed.
- Toasts are short, dark, and stacked. Each action toast may include one undo button.
- Search filters settings by label, key, category, and feature id.
- Each category shows changed-count and reset-category action.
- Export/import validates schema and previews changed categories before applying through a non-modal drawer.

Settings list:

| Category | Key | Default | Control | Description |
| --- | --- | --- | --- | --- |
| Core | `core.enabled` | `true` | toggle | Master enable. Destroy all features when disabled. |
| Core | `core.vehicleMode` | `auto` | select | Userscript, extension, or auto adapter behavior. |
| Core | `core.routeBadges` | `true` | toggle | Show compact current-route and processed-node status in diagnostics. |
| Core | `core.toasts` | `true` | toggle | Enable toast feedback for actions. |
| Core | `core.undoWindowSeconds` | `8` | stepper | Undo timeout for reversible actions. |
| Core | `core.diagnostics` | `false` | toggle | Enable local diagnostics panel. |
| Core | `core.reducedMotion` | `system` | select | System, on, or off. |
| Theme | `theme.preset` | `midnight` | select | Midnight, AMOLED, Catppuccin, Dracula, Nord, Gruvbox, Solarized Dark, Blood, Alien Green, High Contrast Dark. |
| Theme | `theme.accent` | `blue` | select | Accent color family. |
| Theme | `theme.contrast` | `normal` | select | Normal, high, maximum. |
| Theme | `theme.density` | `compact` | select | Comfortable, compact, dense. |
| Theme | `theme.fontScale` | `100` | slider | UI font scale. |
| Theme | `theme.lineHeight` | `1.45` | slider | Reader line height. |
| Theme | `theme.maxContentWidth` | `1280` | slider | Content width cap. |
| Theme | `theme.customCss` | empty | textarea | Scoped custom CSS under `body.glpx-enabled`. |
| Theme | `theme.customScrollbar` | `true` | toggle | Branded dark scrollbar. |
| Theme | `theme.shimmer` | `true` | toggle | Premium shimmer accents, disabled by reduced motion. |
| Theme | `theme.hoverLift` | `true` | toggle | Subtle row/button hover lifts. |
| Ads | `ads.removeWidgets` | `true` | toggle | Remove `[data-type="_mgwidget"]` and known widget shells. |
| Ads | `ads.removeAmpEmbeds` | `true` | toggle | Hide AMP ad/embed blocks. |
| Ads | `ads.removeInlineReplyAds` | `true` | toggle | Remove inline reply ads. |
| Ads | `ads.removeMessageAds` | `true` | toggle | Remove thread message ads. |
| Ads | `ads.bypassRegNag` | `true` | toggle | Hide registration prompts and preserve content flow. |
| Ads | `ads.dnrBlocking` | `true` | toggle | MV3 only: DNR ad/widget rules. |
| Layout | `layout.hideBanner` | `true` | toggle | Hide GLP banner. |
| Layout | `layout.hideStatsBar` | `true` | toggle | Hide site stats strip. |
| Layout | `layout.hideHeaderTime` | `false` | toggle | Hide header time. |
| Layout | `layout.hideLoginLinks` | `false` | toggle | Move login links into compact drawer. |
| Layout | `layout.hideNativeNotifications` | `false` | toggle | Hide native notification surface. |
| Layout | `layout.hideThemeSwitcher` | `true` | toggle | Hide native theme switcher. |
| Layout | `layout.hideViewportToggle` | `false` | toggle | Hide native viewport toggle. |
| Layout | `layout.hideTopLinks` | `true` | toggle | Hide top link clutter. |
| Layout | `layout.hideMainNav` | `false` | toggle | Collapse main nav into drawer. |
| Layout | `layout.hideTabNav` | `false` | toggle | Collapse forum tabs. |
| Layout | `layout.hideThreadControls` | `false` | toggle | Compact native thread controls. |
| Layout | `layout.hideSidebar` | `true` | toggle | Hide right rail. |
| Layout | `layout.hideFooter` | `true` | toggle | Hide footer clutter. |
| Layout | `layout.stickyNav` | `true` | toggle | Compact sticky nav bar. |
| Layout | `layout.wideContent` | `true` | toggle | Reclaim content width. |
| Feed | `feed.compactRows` | `true` | toggle | Compact thread rows. |
| Feed | `feed.zebraRows` | `true` | toggle | Subtle alternating row tone. |
| Feed | `feed.hideIconColumn` | `true` | toggle | Hide icon column. |
| Feed | `feed.hideRatingColumn` | `false` | toggle | Hide rating column. |
| Feed | `feed.hideViewsColumn` | `false` | toggle | Hide views column. |
| Feed | `feed.hideRepliesColumn` | `false` | toggle | Hide replies column. |
| Feed | `feed.hidePosterColumn` | `false` | toggle | Hide poster column. |
| Feed | `feed.hidePostedColumn` | `false` | toggle | Hide posted column. |
| Feed | `feed.hideUpdatedColumn` | `false` | toggle | Hide updated column. |
| Feed | `feed.hidePageLinks` | `false` | toggle | Hide per-thread page links. |
| Feed | `feed.highlightPinned` | `true` | toggle | Highlight pinned/superpin threads. |
| Feed | `feed.highlightOPThreads` | `true` | toggle | Highlight OP-marked rows where detectable. |
| Feed | `feed.hotBadges` | `true` | toggle | Hot/reply/view badges. |
| Feed | `feed.freshnessColors` | `true` | toggle | Fresh/stale row color accents. |
| Feed | `feed.dimVisited` | `true` | toggle | Dim visited/read threads. |
| Feed | `feed.truncateTitles` | `false` | toggle | Truncate long titles with tooltip. |
| Feed | `feed.hideThreadButtons` | `true` | toggle | Add visible hide buttons per thread. |
| Feed | `feed.threadPreview` | `true` | toggle | Rate-limited hover/click preview cards. |
| Feed | `feed.infiniteScroll` | `true` | toggle | Infinite forum pagination. |
| Feed | `feed.prefetchNextPage` | `false` | toggle | Conservative next-page prefetch. |
| Feed | `feed.recoveryShelf` | `true` | toggle | Restore hidden threads/posts/users. |
| Thread | `thread.compactPosts` | `true` | toggle | Compact post layout. |
| Thread | `thread.readerMode` | `false` | toggle | Transform thread into distraction-free reader. |
| Thread | `thread.hideAvatars` | `false` | toggle | Hide avatars. |
| Thread | `thread.smallerAvatars` | `true` | toggle | Reduce avatar footprint. |
| Thread | `thread.hideKarma` | `true` | toggle | Hide karma bars. |
| Thread | `thread.hideUserId` | `false` | toggle | Hide user id. |
| Thread | `thread.hideGeo` | `false` | toggle | Hide geolocation. |
| Thread | `thread.hidePostDate` | `false` | toggle | Hide post date. |
| Thread | `thread.relativeTimestamps` | `true` | toggle | Show relative timestamps. |
| Thread | `thread.hideReportLinks` | `true` | toggle | Hide report links. |
| Thread | `thread.hideSignatures` | `true` | toggle | Hide signatures. |
| Thread | `thread.hideLastEdited` | `false` | toggle | Hide edit markers. |
| Thread | `thread.hideRateSection` | `true` | toggle | Hide rate UI. |
| Thread | `thread.hidePostActions` | `false` | toggle | Compact post actions. |
| Thread | `thread.hideReplyTitles` | `true` | toggle | Hide repeated reply titles. |
| Thread | `thread.postNumbers` | `true` | toggle | Add inline post numbers. |
| Thread | `thread.permalinks` | `true` | toggle | Add copyable post permalinks. |
| Thread | `thread.highlightOP` | `true` | toggle | Highlight OP posts. |
| Thread | `thread.opNavigator` | `true` | toggle | Visible OP post navigator. |
| Thread | `thread.collapsePosts` | `true` | toggle | Collapse individual posts. |
| Thread | `thread.collapseAllControl` | `true` | toggle | Visible collapse/expand all controls. |
| Thread | `thread.quickSearch` | `true` | toggle | Client-side quick search over loaded posts. |
| Thread | `thread.infiniteScroll` | `true` | toggle | Infinite thread pages. |
| Thread | `thread.autoRefresh` | `false` | toggle | Refresh current thread through limiter. |
| Thread | `thread.autoRefreshInterval` | `60` | stepper | Refresh interval in seconds. |
| Quotes | `quotes.compact` | `true` | toggle | Compact quote blocks. |
| Quotes | `quotes.collapseLong` | `true` | toggle | Collapse long quotes. |
| Quotes | `quotes.collapseNested` | `true` | toggle | Collapse nested quote chains. |
| Quotes | `quotes.depthBadges` | `true` | toggle | Show quote depth badges. |
| Quotes | `quotes.backlinkGraph` | `false` | toggle | Infer quote/backlink relationships. |
| Media | `media.lightbox` | `true` | toggle | Click-to-open image lightbox. |
| Media | `media.gallery` | `true` | toggle | Thread media gallery strip. |
| Media | `media.autoExpandImages` | `false` | toggle | Auto expand images under size limit. |
| Media | `media.hoverPreview` | `false` | toggle | Hover media preview. |
| Media | `media.youtubeEmbeds` | `true` | toggle | Convert YouTube links to embeds. |
| Media | `media.xEmbeds` | `true` | toggle | Normalize X/Twitter embeds and fallbacks. |
| Media | `media.privacyMode` | `true` | toggle | Prefer no-cookie embeds and click-to-load third-party media. |
| Filters | `filters.keywordHighlight` | empty | textarea | Highlight terms/regex. |
| Filters | `filters.keywordHide` | empty | textarea | Hide terms/regex. |
| Filters | `filters.caseSensitive` | `false` | toggle | Case-sensitive matching. |
| Filters | `filters.regexMode` | `false` | toggle | Treat filters as regex. |
| Filters | `filters.action` | `dim` | select | Dim, hide, tag, or collapse matches. |
| Filters | `filters.showHiddenCounts` | `true` | toggle | Show counts and restore access. |
| Users | `users.muteList` | empty | textarea | Muted users. |
| Users | `users.tags` | empty | action/list | User tags with color and note. |
| Users | `users.notes` | empty | action/list | Local private profile notes. |
| Users | `users.reputationOverlay` | `false` | toggle | Local-only trust/reputation hints. |
| Users | `users.dimAnon` | `false` | toggle | Dim anonymous posters. |
| Users | `users.compactFlags` | `true` | toggle | Compact country/flag metadata. |
| Watcher | `watcher.enabled` | `false` | toggle | Watch selected threads. |
| Watcher | `watcher.intervalMinutes` | `15` | stepper | Check interval. |
| Watcher | `watcher.digest` | `true` | toggle | Show watched-thread digest. |
| Watcher | `watcher.badgeCounts` | `true` | toggle | MV3 toolbar badge or in-page badge. |
| Watcher | `watcher.pauseHidden` | `true` | toggle | Pause when tab hidden. |
| Export | `export.threadMarkdown` | `true` | toggle | Enable Markdown export action. |
| Export | `export.threadHtml` | `true` | toggle | Enable clean HTML export action. |
| Export | `export.threadJson` | `true` | toggle | Enable structured JSON export action. |
| Export | `export.mediaManifest` | `true` | toggle | Include media manifest. |
| Export | `export.settingsBackup` | `true` | action | Export full settings/data backup. |
| Accessibility | `a11y.highContrast` | `false` | toggle | High contrast dark mode. |
| Accessibility | `a11y.focusRings` | `true` | toggle | Visible focus outlines. |
| Accessibility | `a11y.largerTargets` | `false` | toggle | Larger click targets without pill shapes. |
| Accessibility | `a11y.dyslexiaFont` | `false` | toggle | Optional readable font stack if locally available. |
| Accessibility | `a11y.reduceAnimations` | `system` | select | System/on/off. |
| Extension | `extension.contextMenus` | `true` | toggle | MV3 context menus. |
| Extension | `extension.storageSync` | `false` | toggle | Optional sync storage for small settings. |
| Extension | `extension.browserNotifications` | `false` | toggle | Optional watcher browser notifications. |
| Extension | `extension.toolbarPopup` | `true` | toggle | Popup quick controls. |
| Extension | `extension.optionsPage` | `true` | toggle | Full options page. |

## Phased Build Plan

### v0.1.0 - Core Engine And Settings

Status: in progress. Core userscript runtime and build slices completed on 2026-05-19 in `GLP_Enhanced_-_Godlike_Productions_Declutter.user.js` v2.1.0.

Features:

- [x] Shared boot pipeline for userscript and MV3.
- [x] Settings schema/defaults/import/export hardening in the userscript.
- [x] Feature registry with `init/apply/destroy` wrappers for the existing userscript features.
- [x] Route classifier.
- [x] Selector registry skeleton.
- [x] TrustedTypes-compatible HTML helper.
- [x] Toast system with undo.
- [x] Settings panel with categories, search, immediate apply, no confirmation dialogs.
- [x] Critical anti-FOUC CSS and dark token base.
- [x] Remove any keyboard shortcut feature from the product plan and defaults.

Dependencies:

- [x] Source control initialized: the repository is `SysAdminDoc/GLP-Ultra` and every change since v3.0.0 has been committed and pushed to `main`.
- [x] Build script for single-file userscript.

Acceptance criteria:

- [x] Toggling master enable destroys injected UI/classes without reload while keeping the settings panel usable.
- [x] Settings persist in userscript and MV3 adapters. Current MV3 shim uses origin-local storage; v0.8 will move extension settings to `chrome.storage.local`.
- [x] Settings panel can open, search, toggle, export, import, and reset with undo toast.
- [x] No direct raw string HTML insertion outside the trusted helper in new/core settings paths.
- [x] No keyboard shortcut setting or listener exists.

### v0.2.0 - DOM Recon, Theme, And Declutter Baseline

Status: completed for the current single-file userscript and local MHTML fixtures on 2026-05-19. Later MV3 packaging work may add more extension-specific polish.

Features:

- [x] Full selector registry from this roadmap.
- [x] Capture verifier using saved MHTML files.
- [x] Theme tokens and presets: Midnight, AMOLED, Catppuccin, Dracula, Nord, Gruvbox, Solarized Dark, Blood, Alien Green, High Contrast Dark.
- [x] Header/nav/sidebar/footer cleanup.
- [x] Ad/widget/AMP/nag cleanup.
- [x] Compact layout and wide content.
- [x] Custom CSS scoped under `body.glpx-enabled`.

Dependencies:

- [x] v0.1.0 registry and settings.

Acceptance criteria:

- [x] Both saved MHTML captures pass selector verification with `npm run verify:captures`.
- [x] Theme applies at `document-start` without visible light flash.
- [x] Cleanup features can toggle on/off through immediate settings application or the master enable destroy path.
- [x] Ad/widget selectors avoid broad `[class*=ad]` collisions.

### v0.3.0 - Forum Feed Power Tools

Features:

- Thread row normalization.
- Column controls.
- Compact/dense feed modes.
- Pin/superpin/OP highlighting.
- Hot badges and freshness colors.
- Visited/read dimming.
- Hide thread buttons with recovery shelf and undo.
- Keyword highlight/hide filters.
- User tag/mute surfaces on feed rows.
- Thread preview cards with fetch limiter and cache.
- Infinite forum scroll.

Dependencies:

- Stable feed selectors and fetch queue.

Acceptance criteria:

- Infinite scroll appends only new rows and reprocesses only appended fragments.
- Preview fetches are rate limited, cached, sanitized, and cancel on route change.
- Hidden rows can be restored from recovery shelf.
- Filters show counts and never delete original nodes permanently.

### v0.4.0 - Thread Reader And Post Tools

Features:

- Post row normalization.
- Compact posts and reader mode.
- Metadata controls.
- OP highlight and visible OP navigator.
- Post numbers and permalinks.
- Quote styling, long quote collapse, nested quote collapse, depth badges.
- Post collapse and collapse/expand controls.
- Client-side quick search over loaded posts.
- Infinite thread scroll.
- Related-thread cleanup.
- Relative timestamps.

Dependencies:

- Thread selectors and fragment processing.

Acceptance criteria:

- Thread pages keep native reply/report/karma actions reachable unless the user hides them.
- Reader mode can enable and disable without losing native table content.
- Infinite thread scroll preserves page boundaries and anchors.
- Quote collapse is reversible per quote and globally.

### v0.7.0 - Watcher, Automation, And Recovery

Features:

- Watch/unwatch thread action.
- Watched-thread digest.
- Unread delta tracking.
- Auto-refresh through shared limiter.
- Hidden-tab pause.
- Recovery shelf for threads, posts, users, filters.
- Local history cleanup controls.

Dependencies:

- Fetch queue, read state, thread id parser.

Acceptance criteria:

- Watcher never exceeds configured rate limit.
- Hidden tabs pause background checks by default.
- Digest shows last checked time, unread delta, and failed-check state.
- User can clear watcher/read/history data with undo toast where practical.

### v0.8.0 - MV3 Extension Build

Features:

- Manifest V3 Chrome/Edge package.
- Firefox-compatible manifest variant where possible.
- Document-start critical CSS/content script.
- Document-idle feature content script.
- Popup quick controls.
- Options page using same settings schema.
- `chrome.storage.local` adapter and optional sync.
- DNR rules for GLP ad/widgets and anti-blocker prompt scripts.
- Context menu actions: hide thread, tag user, mute user, preview media, export thread.
- Toolbar badge for watcher count.

Dependencies:

- Shared source modules and extension adapter.

Acceptance criteria:

- Extension installs from unpacked directory in a clean browser profile.
- Popup and options page update live tabs through storage change events.
- DNR rules are GLP-scoped.
- Userscript and extension builds share settings keys.

### v0.9.0 - Reliability, Distribution, And Documentation

Features:

- Capture-based selector verification.
- Diagnostics panel.
- Performance timings.
- Self-healing selector warnings.
- Settings changelog/migration notices.
- README.md build deliverable.
- CHANGELOG.md and release checklist.
- Userscript metadata with update/download URLs.
- MV3 ZIP and optional CRX packaging.
- Store listing prep.

Dependencies:

- Mature userscript and extension feature set.

Acceptance criteria:

- Saved captures validate selectors and route classification.
- Diagnostics export includes settings version, enabled features, selector health, route, and fetch queue status.
- README explains install, update, settings, privacy, and build outputs.
- Release package can be installed fresh with defaults and upgraded from prior settings.

### v1.0.0 - Beats Every Competitor

Features:

- All GLP-specific competitor features, excluding light themes, confirmation dialogs, jQuery dependency, and keyboard shortcuts.
- All accepted adjacent best-in-class forum features adapted to GLP.
- Userscript and MV3 extension released from same source.
- Full dark-only theme suite.
- Complete feed/thread/media/user/filter/export/watcher/settings functionality.
- Recovery, diagnostics, and accessibility surfaces complete.

Acceptance criteria:

- Feature matrix has no unhandled viable feature from researched competitors.
- Every feature has a tested `destroy()`.
- No full-document mutation rescans.
- No raw untrusted HTML injection.
- No keyboard shortcuts.
- No confirmation dialogs.
- No content-script blur filter dependency.
- All settings apply immediately and persist.
- Userscript is installable as one file.
- MV3 extension packages cleanly.
- README, changelog, and release artifacts are complete.

## Risks And Open Questions

| Risk/question | Impact | Mitigation |
| --- | --- | --- |
| Composer page was not captured. | Floating reply, drafts, and composer cleanup cannot be designed with selector certainty. | Capture `/bbs/reply.php` before implementing composer features. |
| Profile/member pages were not captured. | User notes/profile cleanup need selector confirmation. | Capture member/profile/karma pages before implementing profile features. |
| Notification menu internals may differ when logged in. | Notification digest and cleanup may miss real states. | Capture logged-in notification states. |
| GLP DOM is table-heavy and class names may drift. | Feature breakage after site update. | Selector registry, fallbacks, diagnostics, capture verification. |
| Third-party ad/widget markup rotates frequently. | Ad cleanup misses or false positives. | Attribute-first selectors, conservative DOM cleanup, MV3 DNR for extension. |
| Aggressive fetch features can overload or annoy site. | Rate limit, blocks, or poor user trust. | Shared limiter, hidden-tab pause, backoff, no automatic posting/voting. |
| No CSP/TrustedTypes in capture, but future site changes may add it. | String injection could break. | TrustedTypes-compatible helper from v0.1.0. |
| Browser store review may object to broad permissions or anti-adblock wording. | Distribution delay. | GLP-scoped permissions, clear privacy statement, no broad host access. |
| Custom CSS can break recovery UI. | User can lock themselves out. | Safe mode menu command, recovery body class, reset action outside custom CSS scope. |
| Userscript manager MV3 behavior varies. | Inconsistent grants or injection context. | Prefer DOM-safe APIs, avoid page-context assumptions, document supported managers. |
| Dark Reader may already be installed. | Double-dark styling conflicts. | Detect Dark Reader attributes and keep GLP Ultra tokens authoritative. |
| Existing local stored settings may conflict with new schema. | Upgrade confusion. | Migrate old keys into `glpx.settings.v1` with backup. |

## Definition Of Done

`v1.0.0` is done when GLP Ultra is the most complete GLP enhancement layer available:

- Ships as a single-file userscript and MV3 extension from one source.
- Supersets the local script, internal GLP Enhanced, legacy GLP suite, Alien Green style, uBlock GLP cleanup ideas, and the relevant best parts of RES, 4chan X, Dark Reader, Stylus, and Hover Zoom+.
- Provides a polished dark-only premium UI with no light mode.
- Provides comprehensive settings grouped by category, searchable, persistent, immediate-apply, and reversible.
- Provides complete declutter, theme, feed, thread, media, filter, user, watcher, export, accessibility, diagnostics, and recovery capabilities.
- Uses stable selectors first and self-healing fallbacks second.
- Handles GLP as a server-rendered multi-page site with fragment-based enhancement and scoped observers.
- Uses a rate-limited fetch queue for previews, infinite scroll, watcher, and export.
- Routes HTML injection through safe DOM helpers and a TrustedTypes-compatible policy.
- Has no keyboard shortcuts, no confirmation dialogs, no jQuery, no content-script blur filter dependency, no broad ad-class matching, and no permanent DOM deletion without a recovery path.
- Every feature has a clean `destroy()`.
- README.md, changelog, userscript metadata, extension manifests, DNR rules, and release packages are generated as build deliverables.

## Research Source Index

| Source | Result |
| --- | --- |
| `https://api.greasyfork.org/en/scripts/by-site/godlikeproductions.com.json` | Empty array on 2026-05-19. |
| `https://api.greasyfork.org/en/scripts.json?q=Godlike%20Productions` | Empty array on 2026-05-19. |
| `https://openuserjs.org/?q=Godlike%20Productions` | No result page observed earlier; later requests hit 429. |
| `https://raw.githubusercontent.com/uso-archive/data/master/data/uso-styles/36180.json` | Archived `God Like Productions - Alien Green`, 371 total installs, updated 2010-08-28. |
| `https://github.com/SysAdminDoc/GLP-Enhanced` | Private GLP Enhanced repo, v3.0.1 release on 2026-04-10, repo updated 2026-04-26. |
| `https://github.com/SysAdminDoc/Scripts` | Public script collection, updated 2026-05-18, includes legacy `GodLikeProductions Enhanced Suite` userscript found by code search. |
| `https://github.com/uBlockOrigin/uAssets/blob/3ade1e4e1b064a90ca044c86ac6bfbfc82d56d52/filters/filters-2025.txt` | GLP/godlike.com scriptlet rule for blocker/alert script removal. |
| `https://github.com/darkreader/darkreader` | Adjacent dark-mode baseline, 22,011 stars, updated 2026-05-19. |
| `https://github.com/openstyles/stylus` | Adjacent userstyle/theme manager baseline, 6,629 stars, updated 2026-05-19. |
| `https://github.com/honestbleeps/Reddit-Enhancement-Suite` | Adjacent forum extension baseline, 4,433 stars, updated 2026-05-19. |
| `https://github.com/ccd0/4chan-x` | Adjacent imageboard/forum enhancer baseline, 1,118 stars, updated 2026-05-18. |
| `https://github.com/extesy/hoverzoom` | Adjacent media preview baseline, 2,025 stars, updated 2026-05-14. |
| `https://microsoftedge.microsoft.com/addons/search/godlike%20productions` | Search page fetched; no GLP result text found. |
| `https://chromewebstore.google.com/` | Web search found no exact GLP-specific extension listing. |
| `https://addons.mozilla.org/` | Web search found no exact GLP-specific extension listing; local API request was blocked. |
````

</details>
