# GLP Ultra Roadmap

## Status — v3.1.0 (2026-08-06)

The two userscripts are merged and the MV3 extension is the primary vehicle, exactly as the delivery table below prescribes.

- Shipped: single engine at `src/glp-ultra.user.js` (133 settings / 22 sections), MV3 extension with popup, options page, service worker, and `declarativeNetRequest` ad blocking, plus the userscript build and the generated Firefox variant from the same source.
- Absorbed from `GodLikeProductions Enhanced Suite` v9.0.0 (now deleted): sort toolbar, newest-first default, pinned-thread hiding, user blocking by ID, image-only reply filter, reaction-GIF filter, country-club nag bypass, collapse-quotes-by-default, corner style, lean reading preset.
- Dropped deliberately: jQuery CDN dependency, key-driven surfaces (house rule), the Suite autopager (superseded by the engine's infinite scroll).
- Verification: `npm run verify` (gates + captures + both builds + structure) and a Playwright run that loads the unpacked extension and replays the real GLP captures — 83/83 checks.

### v3.1.0 closes the remaining phase work

- **v0.7.0 — Watcher, automation, recovery:** complete. Watch/unwatch, digest with unread delta, last-checked age and failed-check state, hidden-tab pause, and a recovery shelf covering hidden threads, muted users, blocked users, and active filters, each restorable on its own. Local history cleanup keeps its undo toast.
- **v0.8.0 — MV3 extension build:** complete. Context-menu actions (hide thread, mute user, tag user, preview image, export thread), watcher-count toolbar badge, and the Firefox-compatible manifest variant generated into `dist/extension-firefox/`.
- **v0.9.0 — Reliability and distribution:** diagnostics panel now reports settings version, enabled features, selector health, route, fetch queue status, and per-feature worst-run timings; self-healing selector warnings flag fallback hits and missing required surfaces; settings changes are announced per version bump.

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
C:\Users\--\repos\GLP_Userscript
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

Weak implementations to replace:

- Direct `innerHTML` without a TrustedTypes-compatible helper.
- Confirmation dialogs for reset/unhide operations.
- Keyboard shortcut controls.
- jQuery dependency in older suite.
- Broad class or text selectors.
- Full-document mutation rescans.
- Timers that keep running in hidden tabs.
- Theme CSS that assumes Dark Reader-generated variables.
- Ad hiding that uses broad `[class*=ad]` and accidentally matches normal site classes.
- Feature toggles that do not cleanup injected DOM/listeners.

Net-new ideas for GLP Ultra:

- Thread Radar: compact dashboard of watched threads, unread counts, hot movement, stale threads, and muted topics.
- Trust Lens: local-only user tags, notes, profile history, and post frequency signals.
- Noise Budget: per-page count of hidden ads, muted users, keyword-filtered posts, and collapsed quotes.
- Selector Doctor: visible health panel that reports which stable/fallback selectors are active.
- Capture Harness: future build tool that parses saved MHTML fixtures and verifies selectors without live-site access.
- Clean Export: export a thread as clean Markdown/HTML/JSON with quote depth, media manifest, source URL, and timestamp.
- Theme Lab: dark-only presets plus custom accent, density, contrast, font size, and CSS variable export.
- Recovery Shelf: one place to restore hidden threads/posts/users during the current session.

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
GLP_Userscript/
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

- [x] Source control initialized: the repository is `SysAdminDoc/GLP_Userscript` and every change since v3.0.0 has been committed and pushed to `main`.
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
