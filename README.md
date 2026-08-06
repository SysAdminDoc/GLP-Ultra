# GLP Ultra

[![version](https://img.shields.io/badge/version-3.0.0-4a90d9)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20userscript-1f6feb)](#install)
[![manifest](https://img.shields.io/badge/manifest-v3-8957e5)](extension/manifest.json)

Declutter, theming, filtering, blocking, and reading tools for [Godlike Productions](https://www.godlikeproductions.com/) — one MV3 browser extension, built from one source file that also ships as a standalone userscript.

v3.0.0 merges the two previously separate projects (the *GLP Enhanced Declutter* userscript and the *GodLikeProductions Enhanced Suite* userscript) into a single engine. Nothing is loaded from the network: no jQuery CDN, no remote fonts, no remote code of any kind.

## What it does

**114 settings across 17 sections**, all searchable from the in-page panel or the extension options page.

| Area | Highlights |
| --- | --- |
| Ads & nags | mgid/widget/AMP removal, network-level blocking via `declarativeNetRequest`, registration-nag bypass, country-club disclaimer auto-accept |
| Chrome | header, nav, tab-bar, footer, and layout-spacer cleanup; compact and sticky modes |
| Thread list | column control, sort toolbar (updated/posted/rating/views/replies, both directions), newest-first default, pinned-thread hide or highlight, freshness colors, hot-thread badges, hide-thread buttons, keyword filters, infinite scroll, auto-refresh, hover previews |
| Posts | compact/wider layouts, reader mode, OP highlighting, post numbers and permalinks, relative timestamps, collapsible posts, quote depth badges, nested-quote collapse, YouTube embedding, image lightbox with gallery navigation, in-thread quick search |
| Moderation | mute users by name, block users by numeric user ID, hide image-only replies, hide `/sm/` reaction GIFs, per-user tags, hidden-thread manager |
| Look | 10 dark themes, corner style, font size, line height, max width, custom CSS (scoped) |

Every feature exposes `init`/`destroy` and unwinds itself completely when switched off. Errors in one feature can no longer take the rest of the page down with them.

## Install

### Extension (recommended)

```bash
npm run verify      # gates + build
npm run package     # dist/glp-ultra-v3.0.0.zip
```

Then `chrome://extensions` → enable Developer mode → **Load unpacked** → select `extension/`.
The build is unsigned by design; Chrome/Edge will note that it is unpacked.

### Userscript

Install `dist/glp-ultra.user.js` in Tampermonkey or Violentmonkey. Same engine, same settings panel; the popup, options page, and network-level ad blocking are extension-only.

## Layout

```
src/glp-ultra.user.js        Engine — the single source of truth
extension/
  manifest.json              MV3, document_start content scripts
  content/gm-shim.js         GM_* -> localStorage, mirrored to chrome.storage
  content/glp-ultra.user.js  Built from src/ (do not edit)
  content/ext-bridge.js      Messaging bridge for popup/options/service worker
  background/                Service worker: context menus, DNR toggle, badge
  popup/ options/            Extension UI (options page generated from the engine schema)
  rules/ad-network.json      declarativeNetRequest rules, scoped to GLP
  generated/                 settings-schema.js (build output)
captures/*.mhtml             Real GLP pages used for offline verification
scripts/                     build, icons, package, verification gates
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run check` | Syntax + policy gates (no remote code, no confirm dialogs, schema coverage) |
| `npm run build` | Emits `dist/`, `extension/content/glp-ultra.user.js`, and the options-page schema |
| `npm run verify:captures` | Asserts the selector registry still matches real captured GLP pages |
| `npm run verify:extension` | Manifest/file/version/rule integrity |
| `npm run verify` | All of the above |
| `npm run icons` | Regenerates PNG icons from `assets/icon.svg` |
| `npm run package` | Deterministic `dist/glp-ultra-v<version>.zip` |

The build fails if a setting exists without a home in the panel, so the options page can never drift from the engine.

## License

MIT — see [LICENSE](LICENSE).
