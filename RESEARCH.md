# GLP Ultra Research

Last refreshed: 2026-08-13. This file records observed and reproducible facts; anything the
current public site would not expose without a legal agreement is explicitly unverified.

## Scope and release context

- Target: `https://www.godlikeproductions.com/*` and the equivalent apex-host routes.
- Project: `C:\repos\GLP Ultra`, branch `main`, MV3 extension plus a generated
  standalone userscript from `src/glp-ultra.user.js`.
- Desktop scope: 1440x900 primary and 1920x1080 secondary. Mobile behavior was not assessed.
- Live state on 2026-08-13: signed out. No authentication handoff was performed because the
  blocking page was a membership contract/age attestation, not a login page. The contract was
  not accepted and no live-site state was changed.
- Test state: real feed and thread MHTML captures dated 2026-05-19 are replayed at their original
  URLs in an isolated Chromium profile with the unpacked extension loaded.

## Live site snapshot

| Surface | URL/state observed on 2026-08-13 | Result | Navigation and project coverage |
| --- | --- | --- | --- |
| Public root | `https://www.godlikeproductions.com/`, 1440x900, signed out | Cloudflare interstitial first, then `Godlike Productions - Membership Contract` | Hard document load; covered by both extension matches and userscript `@match`. |
| Forum feed | `https://www.godlikeproductions.com/forum1/pg1`, 1440x900, signed out | Membership contract instead of the feed | Hard document load; feed DOM and live features are `UNVERIFIED. Legal agreement required`. |
| Thread | `https://www.godlikeproductions.com/forum1/message6170474/pg1`, 1440x900, signed out | Membership contract instead of the thread | Hard document load; thread DOM and live features are `UNVERIFIED. Legal agreement required`. |

The accessible contract is server-rendered HTML. It exposes two unchecked consent/age controls
and a submit control named `disclaimer`; no script or extension may accept those terms for the
reader. It also proves that the site's generic `ads` CSS class is not an advertising contract:
the class is used by the native **Adv. Search** and **Email Support** links. The live site exposed
no evidence of a History API router or client-side route transition in the accessible state.
The captured forum documents are also complete server-rendered pages. GLP Ultra nevertheless
observes bounded forum fragments so feed/thread rows appended after load are processed safely.

## Feature inventory

The engine has 41 lifecycle entries. `npm run check` verifies that every entry has an explicit
route and lifecycle contract, including 21 fragment-safe processors. `npm run verify:runtime`
replays the real feed/thread captures and exercises the extension bridge, storage, lifecycle,
settings, recovery, exports, and ad suppression. All 41 entries are reproducibly working in that
environment; current live feed/thread execution remains unverified because of the contract gate.

| Surface | Registry entries | Status on 2026-08-13 |
| --- | --- | --- |
| Global DOM/navigation | `dom.cleanup`, `nav.threadForumLink`, `nav.forumToolbar`, `time.relative` | Verified on capture replay; contract auto-accept code removed. |
| Feed | `feed.infiniteScroll`, `feed.hotBadges`, `feed.freshness`, `feed.pinnedVisibility`, `feed.hideThreads`, `feed.keywordFilters`, `feed.autoRefresh`, `feed.threadPreview` | Verified on feed capture replay; current live feed unverified. |
| Thread reading | `thread.infiniteScroll`, `thread.collapsiblePosts`, `thread.highlightOPPosts`, `thread.highlightOPBadges`, `thread.postNumbers`, `thread.memeFilter`, `thread.scrollProgress`, `thread.readerMode`, `thread.quoteDepthBadges`, `thread.quoteGraph`, `thread.nestedQuoteCollapse`, `thread.permalinks`, `thread.opNav`, `thread.collapseAll`, `thread.quickSearch`, `thread.export` | Verified on thread capture replay; current live thread unverified. |
| Users and watcher | `users.muteButtons`, `users.blockButtons`, `users.tags`, `users.reputation`, `thread.watcher` | Verified on replay and local storage/bridge tests; logged-in-only menu/profile states unverified. |
| Media and utility UI | `ui.backToTop`, `ui.noiseBudget`, `media.lightbox`, `media.actions`, `media.youtube`, `media.xEmbeds`, `media.privacy`, `media.hoverPreview` | Verified on thread/feed replay and teardown tests. |

No registry feature was confirmed dead. One former behavior was both unsafe and obsolete:
`autoBypassClubNag` checked and submitted the current membership contract. It was removed from
defaults, migration output, the settings schema, presets, initialization, and generated builds.
Regression coverage proves a legacy stored key is pruned while contract controls remain untouched.

## DOM and data contract

`SELECTOR_REGISTRY` is the bounded site map. The capture gate checks 19 required surfaces against
real documents, while runtime tests verify that each primary/fallback resolves to the intended
semantic element after extension startup.

| Context and dated evidence | Registry surfaces | Status |
| --- | --- | --- |
| Feed capture, `/forum1/pg1`, saved 2026-05-19 and replayed 2026-08-13 | `pageRoot`, `headerBanner`, `notifications`, `feedTable`, `feedRows`, `siteSearch`, `sidebar`, `ads` | `VERIFIED` against the capture. Current live equivalents are unverified because the feed is gated. |
| Thread capture, `/forum1/message6170474/pg1`, saved 2026-05-19 and replayed 2026-08-13 | `threadTable`, `postRows`, `originalPost`, `postAuthor`, `postBody`, `postQuote`, `threadVote`, `threadSearch`, `threadRelated`, `mediaTwitter`, `ads` | `VERIFIED` against the capture. Current live equivalents are unverified because the thread is gated. |
| Membership contract, root/feed/thread requests, observed live 2026-08-13 | `form` with submit `name="disclaimer"`, unchecked agreement controls, native links using `a.ads` | `VERIFIED` live. This is a consent boundary, not a registration nag or ad surface. |

The highest-risk assumptions are the site's terse table classes (`sfr`, `rfr`, `msg`) and
server-rendered post IDs. Failures are visible through selector health and diagnostics instead of
silently disabling later features. Captures should be refreshed whenever the site's templates
become legally accessible to a person operating the browser.

Operational persistence is local and synchronous through the userscript-compatible adapter,
then mirrored to `chrome.storage.local` in the extension. Stable stores cover settings, schema and
version stamps, pre-upgrade recovery, mutes, blocks, tags/notes, hidden threads/titles, watched
threads, user statistics and visited-stat pages. Optional settings sync sends only the bounded
settings payload to `chrome.storage.sync`; unbounded private lists remain local. The complete
format-3 backup carries every one of those stores. Stored settings, both import surfaces, packs,
and extension messages use the same generated type/enum/range constraints, while each local-data
family is bounded and sanitized before use or persistence.

## Advertising inventory and proof

| Placement / route | DOM hook and insertion evidence | Request layer | Result and limits |
| --- | --- | --- | --- |
| Native MGID units on feed and thread captures | `[data-type="_mgwidget"]`, IDs beginning `mgid`, `div[id*="ScriptRoot"]`, and MGID frames; present in both 2026-05-19 captures | Static DNR rule `||mgid.com`, scoped to GLP initiators and ad-capable resource types | A GLP-origin Chromium probe on 2026-08-13 reports `ERR_BLOCKED_BY_CLIENT`; the control resource loads and the MGID body never executes. DOM replay removes widgets and empty rows. |
| AMP-hosted MGID placements on feed/thread, including inline thread units | `amp-embed` (the captures contain MGID AMP embeds); inline floating wrappers are removed only when they contain an MGID/AMP hook | `||ampproject.org` blocks script/sub-frame loads from GLP; document-start CSS and DOM cleanup remove the container | Capture replay leaves no MGID/AMP element or reserved empty row. A current live cold-load is unverified because content routes are gated. |
| Google ad transport defense | No current visible placement was available; DoubleClick is used as a rule-level negative probe | `||googlesyndication.com` and `||doubleclick.net`, GLP initiators only | DoubleClick script is blocked with `ERR_BLOCKED_BY_CLIENT` in the same GLP-origin probe. Current route presence is unverified. |
| Other defensive network rules | No current placement was observable in the gated state | `||adnxs.com`, `||taboola.com`, `||outbrain.com`, `||revcontent.com`, `||zergnet.com`, GLP initiators only | Structure and least-privilege scope pass the extension gate; current live use is unverified and no additional speculative domains were added. |

The generic `.ads` selector was removed after it was shown to hide first-party navigation/support
links. A runtime regression asserts an `a.ads` native link survives while confirmed MGID hooks are
removed. The extension therefore has request-level and rendered-DOM proof in an isolated real
extension context, but not a truthful live cold-load claim: **UNVERIFIED. The current feed and
thread require a person to accept a legal membership contract before their network activity can
be observed.** The standalone userscript can suppress DOM at `document-start`, but it cannot
promise that an ad request initiated by the parser before userscript execution never starts;
request-level zero-ad behavior is extension-only.

## Settings-page matrix

The pre-redesign pages were captured at 1440x900 under `dist/ui-pages-current/`. Design exploration
produced one selected, high-fidelity dark desktop direction per destination in `design/mockups/`. The
code-native implementation was then rendered at 1440x900, 1920x1080, and the generator's exact
1586x992 output size. Exact-size side-by-side comparisons cover representative sparse, dense,
visual, data, and preset archetypes; every page also passed the automated geometry and functional
gate. Generated art was not embedded in the product.

| Page | Real controls / state | Selected mockup | Implementation and parity |
| --- | --- | --- | --- |
| Core | 3 | `design/mockups/01-core.png` | Implemented; status metrics, per-setting reset, page reset/undo. |
| Ad Removal | 4 | `design/mockups/02-ad-removal.png` | Implemented; precise ad semantics and extension network status. |
| Registration & Login | 2 | `design/mockups/03-registration-login.png` | Implemented; membership contract explicitly manual. |
| Header Options | 7 | `design/mockups/04-header-options.png` | Implemented; dense control grid. |
| Navigation | 11 | `design/mockups/05-navigation.png` | Implemented; dense control grid. |
| Thread List (Forum Page) | 19 | `design/mockups/06-thread-list.png` | Implemented; four-column desktop matrix. |
| Post Display (Thread Page) | 20 | `design/mockups/07-post-display.png` | Implemented; four-column desktop matrix. |
| Quote Styling | 6 | `design/mockups/08-quote-styling.png` | Implemented; theme-following/custom colour state. |
| Visual Enhancements | 7 | `design/mockups/09-visual-enhancements.png` | Implemented; truthful theme and typography sample. |
| Thread List Enhancements | 3 | `design/mockups/10-thread-list-enhancements.png` | Implemented. |
| Post Enhancements | 11 | `design/mockups/11-post-enhancements.png` | Implemented; dense control grid. |
| UI Enhancements | 13 | `design/mockups/12-ui-enhancements.png` | Implemented; dependent refresh interval state. |
| Filtering & Custom | 7 | `design/mockups/13-filtering-custom.png` | Implemented; full-width custom CSS and filter fields. |
| Thread Watcher | 5 | `design/mockups/14-thread-watcher.png` | Implemented; dependent watcher controls. |
| User Intelligence | 4 | `design/mockups/15-user-intelligence.png` | Implemented; local-only explanation and dependency state. |
| User Data | list/count actions | `design/mockups/16-user-data.png` | Implemented; truthful counts, full backup, clear history/undo. |
| Media & Embeds | 5 | `design/mockups/17-media-embeds.png` | Implemented; hover-size dependency state. |
| Export & Data | 5 | `design/mockups/18-export-data.png` | Implemented; format/manifest dependencies. |
| Muted Users | searchable local list | `design/mockups/19-muted-users.png` | Implemented; search, individual removal, clear/undo. |
| Blocked Users | searchable local list | `design/mockups/20-blocked-users.png` | Implemented; search, individual removal, clear/undo. |
| Presets | purposeful setting sets | `design/mockups/21-presets.png` | Implemented; current state, changed count, apply/undo. |
| Accessibility | 3 | `design/mockups/22-accessibility.png` | Implemented; explicit motion, contrast, and target controls. |
| Miscellaneous | 6 | `design/mockups/23-miscellaneous.png` | Implemented; sync capability/dependency state. |

The implementation deliberately departs from generated pixels where a mockup invented a control,
fake live content, or an icon the repository does not own. It uses the real extension icon,
actual local data, and only existing setting semantics. The product supports ten dark palettes,
not a separate light shell, so parity was performed in Midnight plus the existing theme sweep.

## Desktop UX journeys

- **Discovery:** open Options, see current/default state and local-save status, move among 23
  destinations, use `Ctrl+K` search, clear with Escape, and recover from a no-match result.
- **Change and recovery:** change one setting, see changed state immediately, reset it or its page,
  and undo; dependent controls visibly disable when their parent capability is off.
- **Purposeful setup:** inspect a preset's exact changes, apply it, see the current marker, and undo.
- **Local-list management:** search mutes/blocks, remove one item, clear the list, and undo.
- **Data safety:** inspect real local counts, download a full local backup, clear poster history,
  and undo without affecting unrelated stores.
- **Support:** open Diagnostics or Recovery directly from Options, with accurate rather than
  decorative state. Keyboard focus, focus-visible treatment, route hashes, 1440x900 containment,
  and 1920x1080 horizontal overflow are machine-checked.

## Platform, security, and policy status

- Manifest V3 static `declarativeNetRequest` rules are browser-evaluated before matching
  requests; rules are limited to GLP initiators and only the resource types an ad can use.
- Permissions remain `storage`, `contextMenus`, `declarativeNetRequest`, and `alarms`, with host
  access limited to the two GLP HTTPS hosts. There is no remote executable code, analytics, or
  page-content exfiltration.
- The userscript has no network grant and runs at `document-start`; generated update/download
  metadata points to this repository's raw `main` artifacts. `@noframes` plus a runtime top-frame
  guard matches the extension's explicit `all_frames: false` execution policy.
- Firefox receives a generated MV3-compatible event-page manifest and passes structural gates.
  Its runtime behavior is unverified because the local test runner drives Chromium.
- The removed auto-contract behavior restores a legal/authentication boundary and the removed
  `.ads` rule restores first-party navigation/support links.

## Competitive evidence and opportunities

Accessible userscript-directory searches returned no current maintained direct competitor. The
closest public GitHub match found was `jaredsohn/userscript` version 1.2.1, last changed in 2014;
it bundles old jQuery/Base.js patterns and broad HTTP/IP includes, so it is historical context,
not a current parity target. Additional GitHub results were copies or older project lineage. The
priority therefore comes from current site evidence, safe browser-platform hooks, and observed
settings friction rather than speculative feature accumulation.

| Candidate | Evidence / concrete hook | Impact | Effort | Risk | Disposition |
| --- | --- | ---: | --- | --- | --- |
| Preserve consent and native links | Live contract form plus live/captured `a.ads` links | 5 | S | Low | **Now. Shipped:** removed auto-submit and generic selector. |
| Precise zero-ad extension path | Captured MGID/AMP hooks plus scoped MV3 DNR | 5 | M | Medium | **Now. Shipped:** request and DOM regressions added. |
| Complete operational settings control center | 23 pre-redesign screenshots and verified inert/unclear states | 5 | L | Low | **Now. Shipped:** reference-led redesign and journey gate. |
| Refresh signed-in/current page contracts and cold-load trace | Current feed/thread are hidden behind the legal agreement | 4 | M | External | **Next. Blocked:** needs a person to accept the contract and provide fresh captures/read-only trace. |
| Firefox behavioral parity | Generated Firefox manifest exists; no Gecko runtime driver is installed | 3 | M | Medium | **Next. Blocked:** add `web-ext` or a controlled Remote Debugging test runner. |
| Add speculative ad domains or broad cosmetic selectors | No current observed hook | 1 | S | High | **Rejected:** likely to hide native functionality or overclaim coverage. |
| Add another feature without a current page hook | Live content templates unavailable | 1 | L | High | **Rejected for this pass:** capture evidence must come first. |

## Sources

Accessed 2026-08-13:

- MDN, declarativeNetRequest:
  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest
- Chrome Extensions, declarativeNetRequest:
  https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest
- Chrome Extensions, content-script manifest (`all_frames`):
  https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
- Tampermonkey metadata (`@noframes`):
  https://www.tampermonkey.net/documentation.php#meta:noframes
- Violentmonkey metadata (`@noframes`):
  https://violentmonkey.github.io/api/metadata-block/#noframes
- Chrome Web Store Program Policies:
  https://developer.chrome.com/docs/webstore/program-policies/policies
- Chrome Web Store user-data FAQ:
  https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Chrome Web Store Manifest V3 requirements:
  https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- Chrome Extensions, improve extension security:
  https://developer.chrome.com/docs/extensions/develop/migrate/improve-security
- Historical competitor commit:
  https://github.com/jaredsohn/userscript/commit/f4222794f1f072219a95a5c425d59d9f8cb72dcd
