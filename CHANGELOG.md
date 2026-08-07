# Changelog

## Unreleased

### Added

- **Thread export.** Thread pages get Export MD / Export HTML / Export JSON / Copy Link buttons in the tools bar. Markdown preserves quote nesting as `>` depth, HTML is a standalone dark document with the original post markup, and JSON is a structured record of every post (author, member/user id, OP flag, date, quote depth, links, media). Every export carries the source URL, thread id, page number, and an export timestamp, and an optional media manifest listing each image, embed, and outbound link.
- **Runtime verification harness** (`npm run verify:runtime`): loads the unpacked extension in Playwright's Chromium and replays the real GLP captures at their live URLs, then asserts the feed and thread surfaces, the messaging path, and the export outputs. Wired into `npm run verify`.

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
