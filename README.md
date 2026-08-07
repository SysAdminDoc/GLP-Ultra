# GLP Ultra

[![version](https://img.shields.io/badge/version-3.5.0-4a90d9)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20userscript-1f6feb)](#install)
[![manifest](https://img.shields.io/badge/manifest-v3-8957e5)](extension/manifest.json)

Declutter, theming, filtering, blocking, and reading tools for [Godlike Productions](https://www.godlikeproductions.com/) — one MV3 browser extension, built from one source file that also ships as a standalone userscript.

v3.0.0 merged the two previously separate projects (the *GLP Enhanced Declutter* userscript and the *GodLikeProductions Enhanced Suite* userscript) into a single engine. Nothing is loaded from the network: no jQuery CDN, no remote fonts, no remote code of any kind.

## What it does

**140 settings across 23 sections**, all searchable from the in-page panel or the extension options page.

| Area | Highlights |
| --- | --- |
| Ads & nags | mgid/widget/AMP removal, network-level blocking via `declarativeNetRequest`, registration-nag bypass, country-club disclaimer auto-accept |
| Chrome | header, nav, tab-bar, footer, and layout-spacer cleanup; compact and sticky modes |
| Thread list | column control, sort toolbar (updated/posted/rating/views/replies, both directions), newest-first default, pinned-thread hide or highlight, freshness colors, hot-thread badges, hide-thread buttons, keyword filters, infinite scroll, auto-refresh, hover previews |
| Posts | compact/wider layouts, reader mode, OP highlighting, post numbers and permalinks, relative timestamps, collapsible posts, quote depth badges, nested-quote collapse, YouTube embedding, image lightbox with gallery navigation, in-thread quick search |
| Moderation | mute users by name, block users by numeric user ID, hide image-only replies, hide `/sm/` reaction GIFs, per-user tags, hidden-thread manager |
| Look | 10 dark themes, corner style, font size, line height, max width, custom CSS (scoped) |
| Watcher | watch threads, unread-delta digest with last-checked age and failed-check state, hidden-tab pause, toolbar badge |
| Export | thread to Markdown / HTML / JSON with a media manifest, copy thread link, full data backup and restore |
| Recovery | one shelf listing hidden threads, muted and blocked users, and active filters, each restorable on its own |
| Diagnostics | route, active features, per-feature worst-run timings, fetch queue state, and selector health with drift warnings |
| Quote graph | who answered a post, inferred from the site's own "Quoting:" links — backlink chips with hover excerpts and in-page jumps |
| Noise budget | a running count of what is being kept off the page, with a breakdown and a route to restore any of it |
| Media | Save / Open / Copy link on post images, click-to-load third-party embeds, lightbox and gallery |
| Accessibility | reduce motion, high contrast, larger click targets — emitted last so they beat the theme |
| Portability | full backup and restore, shareable theme and filter packs, optional settings sync across devices |

Every feature exposes `init`/`destroy` and unwinds itself completely when switched off. Errors in one feature can no longer take the rest of the page down with them.

## Install

### Extension (recommended)

The `extension/` folder is ready to load as-is — nothing to build first.

```bash
npm run load    # copies the folder path and opens chrome://extensions
```

1. `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked**
4. Paste the path into the folder picker: `<repo>/extension`

Chrome 137+ ignores `--load-extension`, and as of Chrome 151 the
`--disable-features=DisableLoadExtensionCommandLineSwitch` workaround is gone too — loading
unpacked is a deliberate manual action now, which is why `npm run load` only removes the typing.

The build is unsigned by design; Chrome/Edge will show the usual unpacked-extension notice.
Edge and Brave use the same flow. After editing `src/glp-ultra.user.js`, run `npm run build`
and hit **Reload** on the extension card.

```bash
npm run verify      # gates + build + structure checks
npm run package     # dist/glp-ultra-v3.5.0.zip
```

### Firefox

```bash
npm run package:firefox   # dist/extension-firefox/ + dist/glp-ultra-firefox-v3.5.0.zip
```

Everything but the manifest is identical to the Chrome build. The Gecko variant swaps the
service-worker background for an event page, and adds the extension id and `strict_min_version`
Firefox requires. Load `dist/extension-firefox/manifest.json` through `about:debugging` >
**This Firefox** > **Load Temporary Add-on**.

Firefox treats host permissions as opt-in: the content scripts register regardless, but the
network-level ad blocking stays inert until the host permission is granted from the add-on's
permissions tab. The variant is gated structurally by `npm run verify:extension` — the runtime
harness drives Chromium only, so Firefox behaviour is not machine-verified.

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
| `npm run load` | Copies the extension path and opens `chrome://extensions` |
| `npm run build` | Emits `dist/`, `extension/content/glp-ultra.user.js`, and the options-page schema |
| `npm run verify:captures` | Asserts the selector registry still matches real captured GLP pages |
| `npm run verify:extension` | Manifest/file/version/rule integrity, both browser variants |
| `npm run verify:runtime` | Loads the unpacked extension in Chromium and drives it against the real captures |
| `npm run verify` | All of the above |
| `npm run shots` | Screenshots every surface in every theme into `dist/ui-shots/` |
| `npm run icons` | Regenerates PNG icons from `assets/icon.svg` |
| `npm run build:firefox` | Generates `dist/extension-firefox/` |
| `npm run package` | Deterministic `dist/glp-ultra-v<version>.zip` |
| `npm run package:firefox` | Deterministic `dist/glp-ultra-firefox-v<version>.zip` |

The build fails if a setting exists without a home in the panel, so the options page can never drift from the engine.

## License

MIT — see [LICENSE](LICENSE).
