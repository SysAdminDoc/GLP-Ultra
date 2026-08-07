# Changelog

## 3.2.0 — 2026-08-06

### Added

- **Optional settings sync** (extension only, off by default). Turning it on keeps the settings — not mutes, blocks, tags, or history — on the browser account so another signed-in device picks them up. Most recent change wins, arbitrated by a stamp so a device that merely opened a tab cannot overwrite one that changed a setting. Only the settings payload is synced because `chrome.storage.sync` caps an item at 8KB and the user lists are unbounded; an oversized payload stays local and says so.
- **Shareable packs.** A pack is one slice of a profile rather than a whole backup: a theme pack carries the look, a filter pack carries mutes, blocks, and keyword rules. Importing a filter pack *adds* — lists are unioned and keyword rules merged — so a pack someone else wrote can never delete your mutes. Under Presets.
- **Noise budget.** A toolbar chip counts what GLP Ultra is keeping off the page — ads removed, posts from muted and blocked users, keyword hits, image-only replies, hidden and pinned threads, collapsed quotes — and opens a breakdown with a route straight to the recovery shelf. Every figure but the ad count is read off the live DOM, so it cannot drift from what is actually hidden.
- **Save / Open / Copy link buttons on post images.** Saving fetches the blob so the file keeps its real name; a hotlinked third-party image cannot be fetched from a content script, so it falls back to opening the image and says why.
- **Accessibility controls.** A new panel section: *Reduce Motion* stops every animation and transition the script adds (the OS `prefers-reduced-motion` setting is still always honoured, this forces it on regardless), *High Contrast* lifts injected text and borders and stops muted text fading below a readable level, and *Larger Click Targets* grows the script's own buttons and chips to a 32px minimum without reflowing the site's tables. They are emitted last in the stylesheet on purpose — a theme that beats the motion or contrast setting is a bug.
- **Quote backlinks.** GLP marks each post with its own `reply<id>` permalink and each quote block with a "Quoting:" footer naming the quoted author and linking the quoted post — enough to reconstruct who answered whom. A post now lists the replies that quoted it, each chip naming the answering post and author, hovering one shows an excerpt of that reply, and clicking scrolls to it and flashes it. Quotes that name a post on the same page gain an in-page jump beside the site's own link, which always left the page.

### Fixed

- **Seven settings did nothing until the next page load.** Back-to-top, both infinite scrolls, the scroll progress bar, thread previews, quick search, and auto-refresh had no apply handler, because their `init` appended a fresh element or listener on every call and would have stacked duplicates. Each now guards re-entry, so switching one on takes effect immediately and repeated applies leave exactly one of it. Thread previews additionally read the setting inside their document-level listeners, so switching them off stops them firing rather than only removing the last card.
- **Auto-refresh kept counting down in a background tab.** The fetch queue already deferred the request, but the countdown completed anyway and refreshes stacked up against the moment the tab came back. It now holds while `document.hidden`.
- **Turning auto-refresh on did nothing until the next page load.** Its registry entry had no apply handler, because `initAutoRefresh` was not idempotent and would have stacked a second interval. It now tears its own timer and bar down first, so enabling it — or changing its interval — takes effect immediately.
- **An extension tab could come up with the theme applied and not one feature running.** The shim's `chrome.storage` read lands at `document_start`; when the mirrored copy differed from localStorage it pushed the difference straight into the engine, which started the feature run against a body that had no posts in it yet and marked the run done. The real page was then never touched — CSS injected, body flagged active, no post numbers, no toolbar, no error. Feature startup now waits for the document when a settings push beats it.
- **Unmuting your last muted user left their posts hidden until a reload.** `applyMuteList()` returned early when the list was empty, skipping the pass that takes the class back off. Switching the mute feature off entirely had the same effect — its `destroy` removed the buttons but never unhid the posts. Found by the noise budget disagreeing with itself.
- Images still loading were silently treated as chrome and skipped by the lightbox, the gallery, and the new media actions: `naturalWidth` is 0 until an image loads, and the shared predicate measured it during a document-idle pass. It now falls back to the declared `width`/`height`, and re-checks on load.

## 3.1.0 — 2026-08-06

### Added

- **Thread watcher.** Watch a thread and it is polled through the shared rate-limited fetch queue, walking to its last page before counting posts so an unread delta means new replies rather than a new page. The digest lists every watched thread with its unread count, last-checked age, and failed-check state, and each row can be marked read, opened, or unwatched. Hidden tabs pause background checks by default. In the extension, the toolbar badge shows the unread total instead of a plain "on".
- **Recovery shelf.** One surface listing hidden threads, muted users, blocked users, and the filters currently hiding things — each restorable on its own, from any route. Hidden threads now remember their titles, so the shelf names what it is about to restore. Older backups without titles still restore their ids.
- **Diagnostics panel.** The settings footer opens an in-page report: route, active features, settings changed from defaults, per-feature worst-run timings, fetch queue state, recorded feature errors, and selector health — with a Copy button. Selector health names, per registry entry, whether the page is being carried by the primary selector or a fallback, which is the self-healing warning for site drift.
- **Context-menu actions.** Right-click on GLP offers Hide this thread, Mute this user, Tag this user, Preview this image, and Export this thread. Each reports why nothing happened rather than failing quietly.
- **Update notices.** After a version change, GLP Ultra names the settings the new build added, computed by diffing the stored payload against the defaults. Switch off with *Announce New Settings After An Update*.
- **Firefox build.** `npm run build:firefox` generates the Gecko variant (event-page background, extension id, `strict_min_version`) into `dist/extension-firefox/`, and `npm run package:firefox` zips it. Everything but the manifest is identical to the Chrome build.

### Fixed

- **Every setting, mute, block, tag, and hidden thread reset to defaults on reload in the extension build.** The engine is written against Tampermonkey semantics — serialize before every `GM_setValue`, `JSON.parse` after every `GM_getValue` — but the MV3 shim also parsed on read, so the engine parsed an already-parsed object, threw, and fell back to defaults inside its own try/catch. Silent data loss on every page load.
- `mainNav`'s primary selector `.topnav.topnav_main` matches neither capture, so that surface had been resolving through fallbacks; `.mainpagenavlinks` is now the primary. The thread route no longer expects a site-wide main nav it does not have.
- The image lightbox added a document click listener on every `init` and never removed it, so disabling the feature left the handler live and re-enabling it stacked another copy. It now binds once and unbinds in `destroy`.

### Also in this release

- **Thread export.** Thread pages get Export MD / Export HTML / Export JSON / Copy Link buttons in the tools bar. Markdown preserves quote nesting as `>` depth, HTML is a standalone dark document with the original post markup, and JSON is a structured record of every post (author, member/user id, OP flag, date, quote depth, links, media). Every export carries the source URL, thread id, page number, and an export timestamp, and an optional media manifest listing each image, embed, and outbound link.
- **Mute match modes**: a muted entry can now match the exact name, any name containing it, or a regular expression. An invalid pattern is skipped rather than taking the whole mute list down.
- **Private notes on tagged users**: the tag editor gained a note field, kept beside the label and colour and shown on hover. Editing a tag now pre-fills what is already there instead of starting blank.
- **Local trust overlay** (off by default): counts how many posts you have actually seen from each poster and shows it beside their name, with thread count and first-seen date on hover. Derived only from pages this browser rendered — no scoring service, no network calls, and the history is capped and prunable.
- **Full backup, not just settings**: export now bundles mutes, blocks, tags, notes, hidden threads, and the poster history alongside the settings, and import restores all of them. A new panel section clears the poster history with an undo toast.
- **Media privacy mode** (on by default): third-party embeds inside posts are replaced by a labelled click-to-load placeholder, so YouTube and X never see the page until the reader asks. YouTube auto-embedding builds the placeholder directly rather than loading and then unloading a player.
- **X / Twitter embed normalization**: widgets get a labelled frame and, where the page still carries the post id, a direct link to the post — a dead widget is now recognisable instead of an unexplained gap.
- **Hover preview for images** (off by default): hovering a shrunken thumbnail or an image link shows the full-size image, capped to a configurable share of the viewport.
- **Runtime verification harness** (`npm run verify:runtime`): loads the unpacked extension in Playwright's Chromium and replays the real GLP captures at their live URLs, then asserts the feed and thread surfaces, the messaging path, and the export outputs. Wired into `npm run verify`; 83 checks at this release.

## 3.0.0 — 2026-08-06

Merged the two separate userscripts into a single MV3 extension, "GLP Ultra".

### Merged

- `GodLikeProductions_Enhanced_Suite.user.js` (v9.0.0) has been absorbed and removed. Its jQuery dependency (loaded over plain HTTP from a CDN) and its key-driven surfaces are gone; every feature it contributed is now vanilla JS inside the shared engine.
- `GLP_Enhanced_-_Godlike_Productions_Declutter.user.js` (v2.1.0) became `src/glp-ultra.user.js`, the single source for both the extension and the userscript.

### Added — from the Suite

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

### Added — extension shell

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
