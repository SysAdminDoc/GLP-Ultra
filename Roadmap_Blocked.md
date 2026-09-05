# Blocked roadmap items

Items that cannot be implemented without input from outside the codebase. Each names the
specific thing that would unblock it. Moved here out of `ROADMAP.md` so the active tracker holds
only work that can actually be done.

## Needs page access that only a consenting or logged-in human can provide

The repo verifies against real MHTML captures (`captures/`). On 2026-08-13 the public root, feed,
and thread routes progressed past Cloudflare but stopped at a membership contract with age and
legal-attestation controls. An automated pass cannot accept that contract for the reader.
Features whose DOM was never captured cannot be designed against real markup, and the selector
registry has nothing to validate them with.

- **Fresh public feed/thread contract and cold-load ad trace.** Needs a person to accept the
  membership contract in the isolated browser, followed by read-only 1440x900 and 1920x1080
  capture/network runs. This is required to upgrade the current capture-replay ad proof to a live
  current-template claim.

- **Floating reply launcher and draft autosave.** Needs a capture of `/bbs/reply.php`.
- **Composer cleanup.** Same capture.
- **Profile / member / karma page cleanup, and per-user notes keyed to a member page.** Needs a
  capture of a member profile page.
- **Notification digest and notification-menu cleanup.** Needs a capture of the logged-in
  notification menu in its real states; the logged-out capture shows none of them.

Unblocks with: save-as-MHTML of those pages while logged in, dropped into `captures/`, then
`npm run verify:captures` to bind them to the selector registry.

## Needs an addons.mozilla.org account and API credentials

- **GU-004 Ship a signed, permanently installable Firefox artifact.** Firefox Release and Beta
  refuse an unsigned extension outright, with no preference to override it, so the zip the README
  points Firefox users at can only be side-loaded through `about:debugging` as a temporary add-on
  and the browser drops it on the next restart. The Firefox lane therefore produces nothing a
  reader can keep.

  The fix is not a code problem. `web-ext sign --channel=unlisted` signs a self-distributed add-on
  for free with automated review, but it needs an AMO account plus a JWT issuer and secret from
  https://addons.mozilla.org/developers/addon/api/key/, which this machine does not have. Keep the
  existing `glp-ultra@sysadmindoc.github.io` gecko id when it is done, or every current install
  loses its stored data.

  Unblocks with: an AMO account, its API key and secret available to the build, and a decision on
  whether the signed `.xpi` becomes a release asset alongside the zip.

## Blocked on a distribution decision, not on code

- **Store listing prep (Chrome Web Store / AMO).** The project deliberately ships unsigned
  artifacts from GitHub Releases; both stores require a signed, reviewed submission and a
  developer account. Packaging itself is done. `npm run package` and `npm run package:firefox`
  produce deterministic zips.
- **CRX packaging.** A self-signed CRX is rejected on install by current Chrome, so the zip is
  the primary artifact by design.

## Cannot be machine-verified here

- **Hidden-tab timer behaviour.** Auto-refresh and the thread watcher both pause while
  `document.hidden`, but the test runner cannot observe it: headless Chromium reports background tabs
  as visible, so activating another tab does not set `document.hidden`, and the content script's
  isolated world cannot be patched from `page.evaluate`. An assertion written anyway passed for
  the wrong reason (both readings were -1 because no countdown bar existed at all), which is
  worse than not asserting. Unblocks with a headed run or an isolated-world CDP evaluate.

- **Firefox runtime verification.** The runtime test runner drives Playwright's Chromium. Firefox
  will not load a temporary MV3 add-on from the command line without additional tooling
  (`web-ext` or a Remote Debugging session), so the Gecko variant is gated structurally by
  `npm run verify:extension` and never behaviourally. Stated in the README rather than implied
  as parity.
