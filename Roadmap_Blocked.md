# Blocked roadmap items

Items that cannot be implemented without input from outside the codebase. Each names the
specific thing that would unblock it. Moved here out of `ROADMAP.md` so the active tracker holds
only work that can actually be done.

## Needs page captures that only a logged-in human can take

The repo verifies against real MHTML captures (`captures/`) because the live site answers
automation with a Cloudflare challenge. Features whose DOM was never captured cannot be designed
against real markup, and the selector registry has nothing to validate them with.

- **Floating reply launcher and draft autosave.** Needs a capture of `/bbs/reply.php`.
- **Composer cleanup.** Same capture.
- **Profile / member / karma page cleanup, and per-user notes keyed to a member page.** Needs a
  capture of a member profile page.
- **Notification digest and notification-menu cleanup.** Needs a capture of the logged-in
  notification menu in its real states; the logged-out capture shows none of them.

Unblocks with: save-as-MHTML of those pages while logged in, dropped into `captures/`, then
`npm run verify:captures` to bind them to the selector registry.

## Blocked on a distribution decision, not on code

- **Store listing prep (Chrome Web Store / AMO).** The project deliberately ships unsigned
  artifacts from GitHub Releases; both stores require a signed, reviewed submission and a
  developer account. Packaging itself is done — `npm run package` and `npm run package:firefox`
  produce deterministic zips.
- **CRX packaging.** A self-signed CRX is rejected on install by current Chrome, so the zip is
  the primary artifact by design.

## Cannot be machine-verified here

- **Hidden-tab timer behaviour.** Auto-refresh and the thread watcher both pause while
  `document.hidden`, but the harness cannot observe it: headless Chromium reports background tabs
  as visible, so activating another tab does not set `document.hidden`, and the content script's
  isolated world cannot be patched from `page.evaluate`. An assertion written anyway passed for
  the wrong reason (both readings were -1 because no countdown bar existed at all), which is
  worse than not asserting. Unblocks with a headed run or an isolated-world CDP evaluate.

- **Firefox runtime verification.** The runtime harness drives Playwright's Chromium. Firefox
  will not load a temporary MV3 add-on from the command line without additional tooling
  (`web-ext` or a Remote Debugging session), so the Gecko variant is gated structurally by
  `npm run verify:extension` and never behaviourally. Stated in the README rather than implied
  as parity.
