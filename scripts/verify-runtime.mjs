/**
 * Runtime verification: loads the unpacked extension in Playwright's Chromium and replays the
 * real GLP captures at their live URLs, so content scripts match exactly as they would on the site.
 *
 * The live site cannot be used - it answers automation with a Cloudflare challenge - and
 * `page.evaluate` cannot see the engine, which lives in the isolated content-script world.
 * DOM assertions work because the DOM is shared; anything needing the engine object is driven
 * through the service worker with `chrome.tabs.sendMessage`.
 */
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();
const extensionPath = path.join(root, 'extension');
const manifestVersion = JSON.parse(await readFile(path.join(extensionPath, 'manifest.json'), 'utf8')).version;

const CAPTURES = {
  feed: { file: 'captures/forum-feed.mhtml', url: 'https://www.godlikeproductions.com/forum1/pg1' },
  thread: { file: 'captures/thread-message.mhtml', url: 'https://www.godlikeproductions.com/forum1/message6170474/pg1' }
};

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractHtml(mhtml) {
  const htmlHeader = /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n/i.exec(mhtml);
  if (!htmlHeader) return '';
  const start = htmlHeader.index + htmlHeader[0].length;
  const rest = mhtml.slice(start);
  const nextBoundary = /\r?\n------/.exec(rest);
  return decodeQuotedPrintable(nextBoundary ? rest.slice(0, nextBoundary.index) : rest);
}

function withoutPage(url) {
  return url.replace(/\/$/, '').replace(/\/pg\d+$/, '');
}

function captureKeyFor(url) {
  const target = withoutPage(url);
  return Object.keys(CAPTURES).find(key => withoutPage(CAPTURES[key].url) === target) || null;
}

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail && !ok ? ` - ${detail}` : ''}`);
}

const userDataDir = await mkdtemp(path.join(tmpdir(), 'glp-ultra-verify-'));
let context;

try {
  const html = {};
  for (const [key, capture] of Object.entries(CAPTURES)) {
    html[key] = extractHtml(await readFile(path.join(root, capture.file), 'latin1'));
    if (!html[key]) throw new Error(`could not extract HTML from ${capture.file}`);
  }

  context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
  check('service worker registered', !!worker);

  // The captures' subresources are dead links; only the documents themselves are served.
  // Page numbers are ignored when matching so the engine's own background fetches - the thread
  // watcher polls the thread's base URL, infinite scroll asks for /pgN - reach the capture too.
  await context.route('**/*', async route => {
    const url = route.request().url();
    const key = captureKeyFor(url);
    if (key) {
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html[key] });
      return;
    }
    if (route.request().resourceType() === 'document' && url.includes('godlikeproductions.com')) {
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<html><body></body></html>' });
      return;
    }
    await route.abort();
  });

  const page = await context.newPage();

  // ---------------- Feed route ----------------
  await page.goto(CAPTURES.feed.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  check('feed: engine marked the body active', await page.locator('body.glp-enhanced-active').count() === 1);
  check('feed: theme tokens injected', await page.locator('#glp-enhanced-styles').count() === 1);
  check('feed: toolbar rendered', await page.locator('#glp-forum-toolbar').count() === 1);
  check('feed: sort controls rendered', await page.locator('.glp-sort-btn').count() > 0);
  check('feed: settings gear present', await page.locator('#glp-open-settings-btn').count() === 1);
  check('feed: hide-thread buttons on rows', await page.locator('.glp-hide-col-btn').count() > 0);
  check('feed: ad widgets removed', await page.locator('[data-type="_mgwidget"]').count() === 0);

  const feedDiag = await workerDiagnostics(worker, page);
  check('feed: route classified as feed', feedDiag?.route === 'feed', JSON.stringify(feedDiag));
  check('feed: no feature errors', (feedDiag?.errors || []).length === 0, JSON.stringify(feedDiag?.errors));
  check('feed: no expected selector is missing', (feedDiag?.selectorHealth?.missing ?? -1) === 0,
    JSON.stringify(feedDiag?.selectorHealth?.warnings));
  check('feed: no feed-route surface has fallen back to an alternate selector',
    !(feedDiag?.selectorHealth?.warnings || []).some(warning => warning.required && warning.status === 'fallback'),
    JSON.stringify((feedDiag?.selectorHealth?.warnings || []).filter(warning => warning.required)));

  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(400);
  check('feed: settings panel opens from the extension shell', await page.locator('#glp-enhanced-settings').count() === 1);
  check('feed: export section present in panel',
    await page.locator('#glp-enhanced-settings [data-search*="Export"]').count() > 0);
  await page.locator('#glp-enhanced-close-btn').click();

  // ---------------- Recovery shelf ----------------
  const hiddenTitle = await page.evaluate(() => {
    const row = document.querySelector('.glp-hide-col-btn')?.closest('tr');
    const link = row?.querySelector('.sfr a[href*="/message"], a[href*="/message"]');
    return link ? link.textContent.trim() : '';
  });
  check('feed: found a thread row to hide', !!hiddenTitle, hiddenTitle);

  await page.locator('.glp-hide-col-btn').first().click();
  await page.waitForTimeout(300);
  check('feed: hiding a thread marks its row hidden', await page.locator('.threads tr.glp-thread-hidden').count() === 1);

  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(300);
  await page.locator('#glp-recovery-btn').click();
  await page.waitForTimeout(300);
  check('feed: the recovery shelf opens from the settings footer', await page.locator('#glp-recovery').count() === 1);
  const shelfThreads = await page.locator('#glp-recovery .glp-diag-group').first().innerText();
  check('feed: the shelf names the hidden thread rather than its id',
    shelfThreads.includes(hiddenTitle.slice(0, 24)), shelfThreads);

  await page.locator('#glp-recovery .glp-recovery-row button').first().click();
  await page.waitForTimeout(300);
  check('feed: restoring from the shelf unhides the row',
    await page.locator('.threads tr.glp-thread-hidden').count() === 0);
  check('feed: the shelf then reports nothing hidden',
    (await page.locator('#glp-recovery .glp-diag-group').first().innerText()).includes('Nothing hidden'));

  await page.locator('#glp-recovery .glp-diag-header .glp-btn').click();
  await page.waitForTimeout(200);
  check('feed: the recovery shelf closes', await page.locator('#glp-recovery').count() === 0);
  await page.locator('#glp-enhanced-close-btn').click();
  await page.waitForTimeout(200);

  // ---------------- Thread route ----------------
  await page.goto(CAPTURES.thread.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  check('thread: post numbers rendered', await page.locator('.glp-post-number').count() > 0);
  check('thread: mute buttons rendered', await page.locator('.glp-mute-btn').count() > 0);
  check('thread: block buttons rendered', await page.locator('.glp-block-btn').count() > 0);
  check('thread: quote depth badges rendered', await page.locator('.glp-quote-depth').count() > 0);
  check('thread: tools bar rendered', await page.locator('#glp-thread-tools-bar').count() === 1);
  check('thread: OP navigation rendered', await page.locator('.glp-op-nav').count() > 0);

  // Quote graph: inferred from the site's own "Quoting:" links, so it must find real edges in
  // the capture rather than merely rendering an empty bar.
  check('thread: quote backlinks rendered', await page.locator('.glp-backlinks').count() > 0);
  check('thread: in-page jump added to a quote that names a post on this page',
    await page.locator('.glp-quote-jump').count() > 0);
  const backlinkLabel = await page.locator('.glp-backlink').first().innerText().catch(() => '');
  check('thread: a backlink names the answering post and its author', /^#\d+\s+\S/.test(backlinkLabel), backlinkLabel);

  await page.locator('.glp-backlink').first().hover();
  await page.waitForTimeout(250);
  check('thread: hovering a backlink opens a context card',
    await page.locator('#glp-backlink-card.glp-backlink-card-visible').count() === 1);
  const cardText = await page.locator('#glp-backlink-card').innerText();
  check('thread: the context card carries the answering post, not the quote it contains',
    cardText.trim().length > 0 && !cardText.includes('Quoting:'), cardText.slice(0, 80));

  const jumpTarget = await page.locator('.glp-backlink').first().getAttribute('data-glp-jump-to');
  await page.locator('.glp-backlink').first().click();
  await page.waitForTimeout(300);
  check('thread: clicking a backlink flashes the post it points at',
    await page.locator(`#${jumpTarget}.glp-post-flash`).count() === 1, jumpTarget);

  const threadDiag = await workerDiagnostics(worker, page);
  check('thread: route classified as thread', threadDiag?.route === 'thread', JSON.stringify(threadDiag));
  check('thread: no feature errors', (threadDiag?.errors || []).length === 0, JSON.stringify(threadDiag?.errors));

  // Diagnostics have to answer the questions the roadmap promises they answer.
  check('thread: diagnostics report the running version', threadDiag?.version === manifestVersion, threadDiag?.version);
  check('thread: diagnostics list the active features', (threadDiag?.enabledFeatures || []).length > 0,
    String((threadDiag?.enabledFeatures || []).length));
  check('thread: diagnostics report fetch queue state',
    threadDiag?.fetchQueue && typeof threadDiag.fetchQueue.pending === 'number', JSON.stringify(threadDiag?.fetchQueue));
  // Against a real capture every surface the thread route depends on must resolve, and on its
  // primary selector - a fallback hit here means the registry's first choice has already rotted.
  check('thread: no expected selector is missing', (threadDiag?.selectorHealth?.missing ?? -1) === 0,
    JSON.stringify(threadDiag?.selectorHealth?.warnings));
  check('thread: no thread-route surface has fallen back to an alternate selector',
    !(threadDiag?.selectorHealth?.warnings || []).some(warning => warning.required && warning.status === 'fallback'),
    JSON.stringify((threadDiag?.selectorHealth?.warnings || []).filter(warning => warning.required)));

  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(300);
  await page.locator('#glp-diagnostics-btn').click();
  await page.waitForTimeout(300);
  check('thread: the diagnostics panel opens from the settings footer',
    await page.locator('#glp-diagnostics').count() === 1);
  check('thread: the diagnostics panel reports selector health',
    await page.locator('#glp-diagnostics .glp-diag-group').count() >= 4);
  check('thread: the diagnostics panel reports no feature errors',
    (await page.locator('#glp-diagnostics .glp-diag-group').nth(2).innerText()).includes('None recorded'));
  await page.locator('#glp-diagnostics .glp-diag-header .glp-btn:last-child').click();
  await page.waitForTimeout(200);
  check('thread: the diagnostics panel closes', await page.locator('#glp-diagnostics').count() === 0);
  await page.locator('#glp-enhanced-close-btn').click();
  await page.waitForTimeout(200);

  // Media adapters: the capture carries a real X/Twitter widget iframe.
  check('thread: third-party embeds replaced by click-to-load placeholders',
    await page.locator('.glp-media-placeholder').count() > 0);
  check('thread: no third-party iframe loaded under privacy mode',
    await page.locator('.post_main iframe[src*="twitter"], .post_main iframe[src*="x.com"], .post_main iframe[src*="youtube"]').count() === 0);
  check('thread: X embeds are wrapped and labelled',
    await page.locator('.glp-x-embed .glp-media-provider').count() > 0);

  await page.locator('.glp-media-placeholder .glp-media-load').first().click();
  await page.waitForTimeout(300);
  check('thread: clicking Load swaps the placeholder for the real embed',
    await page.locator('iframe[data-glp-media-loaded="1"]').count() > 0);

  // Turning privacy mode off through the extension shell must restore every embed.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { mediaPrivacyMode: false } });
  await page.waitForTimeout(400);
  check('thread: disabling privacy mode restores the embeds',
    await page.locator('.glp-media-placeholder').count() === 0);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { mediaPrivacyMode: true } });
  await page.waitForTimeout(400);

  // Persistence: the storage shim must hand back exactly what the engine stored, or every
  // store silently resets to defaults on the next page load.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { colorTheme: 'dracula', hideKarmaBar: false } });
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const restored = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('thread: settings survive a reload', restored?.settings?.colorTheme === 'dracula', restored?.settings?.colorTheme);
  check('thread: a non-default toggle survives a reload', restored?.settings?.hideKarmaBar === false, String(restored?.settings?.hideKarmaBar));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { colorTheme: 'midnight', hideKarmaBar: true } });
  await page.waitForTimeout(300);

  // Thread watcher: off by default, so drive it through the extension shell.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { watcherEnabled: true } });
  await page.waitForTimeout(500);
  check('thread: watch button appears when the watcher is on',
    await page.locator('[data-glp-thread-tool="watch"]').count() === 1);
  check('thread: watched digest toggle appears',
    await page.locator('#glp-watch-toggle').count() === 1);

  await page.locator('[data-glp-thread-tool="watch"]').click();
  await page.waitForTimeout(300);
  check('thread: watching flips the button to Unwatch',
    (await page.locator('[data-glp-thread-tool="watch"]').innerText()).trim() === 'Unwatch');

  await page.locator('#glp-watch-toggle').click();
  await page.waitForTimeout(600);
  check('thread: digest lists the watched thread',
    await page.locator('#glp-watch-digest .glp-watch-row').count() === 1);

  // Opening the digest kicks a manual pass; it fetches the thread's base URL through the
  // engine's rate-limited queue, so poll rather than guess a timeout.
  const digestMeta = await page
    .waitForFunction(() => {
      const meta = document.querySelector('#glp-watch-digest .glp-watch-meta');
      return meta && /checked/.test(meta.textContent) ? meta.textContent : false;
    }, null, { timeout: 15000 })
    .then(handle => handle.jsonValue())
    .catch(async () => page.locator('#glp-watch-digest .glp-watch-meta').first().innerText());
  check('thread: watcher check completes against the real thread page', /checked/.test(digestMeta), digestMeta);
  check('thread: a check with no new posts reports zero unread', /^0 new/.test(digestMeta.trim()), digestMeta);
  check('thread: the digest row is not in an error state',
    await page.locator('#glp-watch-digest .glp-watch-error').count() === 0);

  await page.locator('#glp-watch-digest [data-watch-action="unwatch"]').click();
  await page.waitForTimeout(300);
  check('thread: unwatching empties the digest',
    await page.locator('#glp-watch-digest .glp-watch-empty').count() === 1);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { watcherEnabled: false } });
  await page.waitForTimeout(400);
  check('thread: disabling the watcher removes its controls',
    await page.locator('[data-glp-thread-tool="watch"], #glp-watch-toggle, #glp-watch-digest').count() === 0);

  // User intelligence: the trust overlay is off by default and must appear on demand.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { userReputationOverlay: true } });
  await page.waitForTimeout(400);
  check('thread: trust overlay renders seen-post counts',
    await page.locator('.glp-user-rep').count() > 0);
  const repText = await page.locator('.glp-user-rep').first().innerText().catch(() => '');
  check('thread: trust overlay counts real posts', /\d+ seen/.test(repText), repText);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { userReputationOverlay: false } });
  await page.waitForTimeout(400);
  check('thread: disabling the trust overlay removes every badge',
    await page.locator('.glp-user-rep').count() === 0);

  // Export actions
  for (const tool of ['export-md', 'export-html', 'export-json', 'copy-thread-link']) {
    check(`thread: ${tool} button present`,
      await page.locator(`#glp-thread-tools-bar [data-glp-thread-tool="${tool}"]`).count() === 1);
  }

  const download = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('[data-glp-thread-tool="export-json"]').click()
  ]).then(([dl]) => dl);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  check('thread: JSON export downloads', /\.json$/.test(download.suggestedFilename()), download.suggestedFilename());
  check('thread: JSON export has posts', Array.isArray(payload.posts) && payload.posts.length > 0, `${payload.postCount} posts`);
  check('thread: JSON export records source URL', payload.source === CAPTURES.thread.url, payload.source);
  check('thread: JSON export carries a media manifest', Array.isArray(payload.media), typeof payload.media);
  check('thread: JSON export preserves quote depth',
    payload.posts.some(post => post.maxQuoteDepth > 0),
    payload.posts.map(p => p.maxQuoteDepth).join(','));
  check('thread: JSON export strips injected chrome',
    !JSON.stringify(payload.posts).includes('glp-post-number'));

  const mdDownload = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('[data-glp-thread-tool="export-md"]').click()
  ]).then(([dl]) => dl);
  const mdStream = await mdDownload.createReadStream();
  const mdChunks = [];
  for await (const chunk of mdStream) mdChunks.push(chunk);
  const markdown = Buffer.concat(mdChunks).toString('utf8');
  check('thread: Markdown export downloads', /\.md$/.test(mdDownload.suggestedFilename()), mdDownload.suggestedFilename());
  check('thread: Markdown export has a heading and posts', markdown.startsWith('# ') && markdown.includes('## #1 '));
  check('thread: Markdown export quotes nested material', markdown.includes('\n> '));
  check('thread: Markdown export lists the media manifest', markdown.includes('## Media manifest'));

  // ---------------- Settings sync (opt-in) ----------------
  const syncAfterOff = await worker.evaluate(() => chrome.storage.sync.get(null));
  check('sync: nothing is written to chrome.storage.sync while the setting is off',
    Object.keys(syncAfterOff).length === 0, JSON.stringify(Object.keys(syncAfterOff)));

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { syncSettings: true } });
  await page.waitForTimeout(500);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 17 } });
  await page.waitForTimeout(500);
  const synced = await worker.evaluate(() => chrome.storage.sync.get(null));
  check('sync: enabling it pushes the settings payload', typeof synced.glpEnhancedSettings === 'string',
    JSON.stringify(Object.keys(synced)));
  check('sync: the pushed payload carries the change', /"fontSize":17/.test(synced.glpEnhancedSettings || ''));
  check('sync: a stamp is written so the newest change can win',
    Number(synced.glpSettingsSyncedAt) > 0, String(synced.glpSettingsSyncedAt));
  check('sync: only the settings ride along, not the user lists',
    !('glpMutedUsers' in synced) && !('glpUserStats' in synced), JSON.stringify(Object.keys(synced)));

  // A remote device changing a setting: newer stamp wins and reaches the running tab.
  await worker.evaluate(async () => {
    const current = await chrome.storage.sync.get('glpEnhancedSettings');
    const parsed = JSON.parse(current.glpEnhancedSettings);
    parsed.fontSize = 19;
    await chrome.storage.sync.set({
      glpEnhancedSettings: JSON.stringify(parsed),
      glpSettingsSyncedAt: Date.now() + 5000
    });
  });
  await page.waitForTimeout(800);
  const afterRemote = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('sync: a newer remote change is adopted by the open tab',
    afterRemote?.settings?.fontSize === 19, String(afterRemote?.settings?.fontSize));

  // A stale remote write must lose rather than resurrect an old value.
  await worker.evaluate(async () => {
    const current = await chrome.storage.sync.get('glpEnhancedSettings');
    const parsed = JSON.parse(current.glpEnhancedSettings);
    parsed.fontSize = 11;
    await chrome.storage.sync.set({
      glpEnhancedSettings: JSON.stringify(parsed),
      glpSettingsSyncedAt: 1
    });
  });
  await page.waitForTimeout(800);
  const afterStale = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('sync: an older remote write is ignored', afterStale?.settings?.fontSize === 19,
    String(afterStale?.settings?.fontSize));

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { syncSettings: false, fontSize: 14 } });
  await worker.evaluate(() => chrome.storage.sync.clear());
  await page.waitForTimeout(400);

  // ---------------- Shareable packs ----------------
  // The property that matters is that a pack someone else wrote cannot delete what you have.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: 'mine', colorTheme: 'midnight' } });
  await page.waitForTimeout(300);

  const themePack = (await sendMessage(worker, page, { type: 'glp:build-pack', kind: 'theme' }))?.pack;
  check('packs: a theme pack carries the look and nothing else',
    themePack?.kind === 'theme' && 'colorTheme' in (themePack.settings || {}) && !('keywordHide' in (themePack.settings || {})),
    JSON.stringify(Object.keys(themePack?.settings || {})));
  check('packs: a theme pack carries no user lists',
    !themePack?.mutedUsers && !themePack?.blockedUsers);

  const applied = await sendMessage(worker, page, {
    type: 'glp:apply-pack',
    pack: { format: 'glp-ultra-pack', kind: 'theme', settings: { colorTheme: 'dracula' } }
  });
  check('packs: applying a theme pack changes the theme', applied?.result?.ok === true, JSON.stringify(applied));
  const themedState = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: the theme pack took effect', themedState?.settings?.colorTheme === 'dracula', themedState?.settings?.colorTheme);
  check('packs: a theme pack leaves filters untouched', themedState?.settings?.keywordHide === 'mine', themedState?.settings?.keywordHide);

  await sendMessage(worker, page, {
    type: 'glp:apply-pack',
    pack: {
      format: 'glp-ultra-pack',
      kind: 'filters',
      settings: { keywordHide: 'theirs, mine' },
      mutedUsers: ['PackedMuteOne', 'PackedMuteTwo']
    }
  });
  await page.waitForTimeout(400);
  const merged = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: an imported filter pack merges keywords instead of replacing them',
    /\bmine\b/.test(merged?.settings?.keywordHide || '') && /\btheirs\b/.test(merged?.settings?.keywordHide || ''),
    merged?.settings?.keywordHide);
  check('packs: keyword merge does not duplicate an entry both sides already had',
    (merged?.settings?.keywordHide || '').split(',').filter(part => part.trim() === 'mine').length === 1,
    merged?.settings?.keywordHide);
  check('packs: an imported filter pack adds its muted users',
    ['PackedMuteOne', 'PackedMuteTwo'].every(name => (merged?.lists?.mutedUsers || []).includes(name)),
    JSON.stringify(merged?.lists?.mutedUsers));

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: '', colorTheme: 'midnight' } });

  // Divergence between localStorage (the primary store) and its chrome.storage mirror is the
  // state that fires the shim's sync at document_start. Two things must hold afterwards: the
  // mirror wins, and the page still gets its features - an external settings push arriving
  // before the document is parsed must not mark the run done against an empty DOM.
  await page.evaluate(() => window.localStorage.removeItem('glpEnhanced.mv3.glpMutedUsers'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const mirrored = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: the chrome.storage mirror restores a store deleted from localStorage',
    ['PackedMuteOne', 'PackedMuteTwo'].every(name => (mirrored?.lists?.mutedUsers || []).includes(name)),
    JSON.stringify(mirrored?.lists?.mutedUsers));
  check('shim: features still run when a settings push beats the document',
    await page.locator('#glp-thread-tools-bar').count() === 1 && await page.locator('.glp-post-number').count() > 0,
    JSON.stringify(await page.evaluate(() => ({
      bars: document.querySelectorAll('#glp-thread-tools-bar').length,
      numbers: document.querySelectorAll('.glp-post-number').length
    }))));

  // Put the lists back the way the rest of the run expects them.
  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(300);
  await page.locator('#glp-recovery-btn').click();
  await page.waitForTimeout(300);
  for (const name of ['PackedMuteOne', 'PackedMuteTwo']) {
    const row = page.locator('.glp-recovery-row', { hasText: name });
    if (await row.count()) {
      await row.locator('button').first().click();
      await page.waitForTimeout(250);
    }
  }
  await page.locator('#glp-recovery .glp-diag-header .glp-btn').click();
  await page.locator('#glp-enhanced-close-btn').click();
  await page.waitForTimeout(300);
  const cleaned = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: pack-added mutes can be removed again from the shelf',
    !['PackedMuteOne', 'PackedMuteTwo'].some(name => (cleaned?.lists?.mutedUsers || []).includes(name)),
    JSON.stringify(cleaned?.lists?.mutedUsers));

  // ---------------- Noise budget ----------------
  // The whole point is that the number matches what is actually hidden, so mute someone and
  // watch it move rather than asserting a chip exists.
  check('noise: budget chip rendered in the thread tools bar',
    await page.locator('#glp-noise-chip').count() === 1,
    JSON.stringify(await page.evaluate(() => ({
      url: location.pathname,
      active: document.body.classList.contains('glp-enhanced-active'),
      chips: document.querySelectorAll('#glp-noise-chip').length,
      bars: document.querySelectorAll('#glp-thread-tools-bar').length,
      barAttached: !!document.getElementById('glp-thread-tools-bar')?.isConnected,
      msgtitle: document.querySelectorAll('.msgtitle').length,
      posts: document.querySelectorAll('.msg tr[id^="post_"]').length
    })))
    + ' errors=' + JSON.stringify((await workerDiagnostics(worker, page))?.errors || []));
  const noiseBefore = await page.locator('#glp-noise-chip').innerText();

  const noiseAuthor = await page.evaluate(() => {
    const header = [...document.querySelectorAll('.msg tr[id^="post_"] .author_header')]
      .find(node => {
        const link = node.querySelector('b a') || node.querySelector('a');
        return link && link.textContent.trim() && link.textContent.trim() !== 'Anonymous Coward';
      });
    const link = header?.querySelector('b a') || header?.querySelector('a');
    return link ? link.textContent.trim() : '';
  });
  await page.locator('.msg tr[id^="post_"] .author_header .glp-mute-btn').first().click();
  await page.waitForTimeout(400);
  const noiseAfter = await page.locator('#glp-noise-chip').innerText();
  const hiddenNow = await page.locator('.glp-muted-post').count();
  check('noise: muting a user raises the count by the posts it actually hid',
    hiddenNow > 0 && noiseAfter !== noiseBefore, `${noiseBefore} -> ${noiseAfter} (${hiddenNow} hidden, ${noiseAuthor})`);

  await page.locator('#glp-noise-chip').click();
  await page.waitForTimeout(300);
  const noisePanel = await page.locator('#glp-noise-panel').innerText();
  check('noise: the breakdown names muted posts and their count',
    /Posts from muted users/.test(noisePanel), noisePanel.replace(/\n/g, ' | ').slice(0, 120));
  check('noise: the breakdown offers a route back to the recovery shelf',
    await page.locator('#glp-noise-panel button:text("Recovery shelf")').count() === 1);
  check('noise: only non-zero rows are listed',
    !/Pinned threads hidden/.test(noisePanel), noisePanel.replace(/\n/g, ' | ').slice(0, 160));

  // Unmute through the shelf so the rest of the run sees an unfiltered thread.
  await page.locator('#glp-noise-panel button:text("Recovery shelf")').click();
  await page.waitForTimeout(400);
  await page.locator('#glp-recovery .glp-recovery-row button:text("Unmute")').first().click();
  await page.waitForTimeout(400);
  check('noise: unmuting from the shelf clears the hidden posts',
    await page.locator('.glp-muted-post').count() === 0);
  await page.locator('#glp-recovery .glp-diag-header .glp-btn').click();
  await page.waitForTimeout(200);

  // ---------------- Media actions ----------------
  // The thread capture carries no in-post content image (only avatars, banner, and smileys), so
  // plant the three cases the predicate has to separate: a loaded content image, a loaded
  // thumbnail, and an image that has not loaded and only declares its size in attributes.
  const PIXEL_60 = 'data:image/svg+xml;base64,' + Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#456"/></svg>'
  ).toString('base64');
  const PIXEL_10 = 'data:image/svg+xml;base64,' + Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#456"/></svg>'
  ).toString('base64');

  await page.evaluate(([big, small]) => {
    const body = document.querySelector('.post_main');
    const add = (src, attrs = {}) => {
      const img = document.createElement('img');
      Object.entries(attrs).forEach(([key, value]) => img.setAttribute(key, value));
      img.src = src;
      img.dataset.glpFixture = '1';
      body.appendChild(img);
      return img;
    };
    add(big, { id: 'fixture-content' });
    add(small, { id: 'fixture-thumb' });
    // Never resolves under the harness router: exercises the not-yet-loaded path.
    add('https://www.godlikeproductions.com/uploads/pending.jpg', { id: 'fixture-pending', width: '400', height: '300' });
  }, [PIXEL_60, PIXEL_10]);
  await page.waitForTimeout(300);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { mediaActions: true } });
  await page.waitForTimeout(400);

  check('media: a loaded content image gets an action bar',
    await page.locator('#fixture-content + .glp-media-actions').count() === 1);
  check('media: a loaded thumbnail gets none',
    await page.locator('#fixture-thumb + .glp-media-actions').count() === 0);
  check('media: an image that has not loaded is judged on its declared size, not naturalWidth',
    await page.locator('#fixture-pending + .glp-media-actions').count() === 1);
  check('media: chrome images (smileys, karma, flags) get no action bar', await page.evaluate(() =>
    [...document.querySelectorAll('.post_main img')]
      .filter(img => /\/sm\/|karma|div\.png|flags\//.test(img.src))
      .every(img => img.nextElementSibling?.className !== 'glp-media-actions')));

  const copyTarget = await page.locator('#fixture-content + .glp-media-actions [data-glp-media-action="copy"]')
    .getAttribute('data-glp-media-src');
  check('media: the copy action carries the image address', (copyTarget || '').startsWith('data:image/svg'), (copyTarget || '').slice(0, 32));

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { mediaActions: false } });
  await page.waitForTimeout(400);
  check('media: disabling the actions removes every bar',
    await page.locator('.glp-media-actions').count() === 0);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { mediaActions: true } });
  await page.waitForTimeout(400);
  check('media: re-enabling brings each bar back exactly once',
    await page.locator('.glp-media-actions').count() === 2,
    String(await page.locator('.glp-media-actions').count()));

  await page.evaluate(() => document.querySelectorAll('[data-glp-fixture]').forEach(node => {
    node.nextElementSibling?.classList.contains('glp-media-actions') && node.nextElementSibling.remove();
    node.remove();
  }));

  // ---------------- Accessibility overrides ----------------
  // Asserted as computed style on a real element: a rule that exists in the stylesheet but
  // loses to the theme is exactly the failure these settings are supposed to prevent.
  const motionBefore = await page.locator('.glp-backlink').first()
    .evaluate(node => getComputedStyle(node).transitionDuration);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { reduceMotion: true } });
  await page.waitForTimeout(300);
  const motionAfter = await page.locator('.glp-backlink').first()
    .evaluate(node => getComputedStyle(node).transitionDuration);
  check('a11y: reduce motion collapses transition durations',
    parseFloat(motionAfter) < 0.01 && parseFloat(motionBefore) >= parseFloat(motionAfter),
    `${motionBefore} -> ${motionAfter}`);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { reduceMotion: false } });
  await page.waitForTimeout(300);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { largeTargets: true } });
  await page.waitForTimeout(300);
  const targetBox = await page.locator('.glp-backlink').first().boundingBox();
  check('a11y: larger click targets reach 32px', (targetBox?.height ?? 0) >= 32, JSON.stringify(targetBox));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { largeTargets: false } });
  await page.waitForTimeout(300);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { highContrast: true } });
  await page.waitForTimeout(300);
  const contrast = await page.locator('.glp-backlinks-label').first().evaluate(node => {
    const style = getComputedStyle(node);
    return { color: style.color, opacity: style.opacity };
  });
  check('a11y: high contrast lifts muted label text to full opacity',
    contrast.opacity === '1' && contrast.color === 'rgb(214, 222, 238)', JSON.stringify(contrast));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { highContrast: false } });
  await page.waitForTimeout(300);

  // ---------------- Context menu actions ----------------
  // Playwright cannot open a native context menu, so drive the two halves separately: the
  // worker must actually register the items, and the engine must act on a right-click it saw.
  const menuIds = await worker.evaluate(() => self.GLP_MENU_IDS || []);
  for (const id of ['glp-hide-thread', 'glp-mute-user', 'glp-tag-user', 'glp-preview-media', 'glp-export-thread']) {
    check(`context: the worker registers ${id}`, menuIds.includes(id), JSON.stringify(menuIds));
  }

  await page.locator('.msg tr[id^="post_"] .author_header b a').first().click({ button: 'right' });
  await page.waitForTimeout(200);
  const seenContext = await sendMessage(worker, page, { type: 'glp:get-state' })
    .then(() => worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
      return chrome.tabs.sendMessage(tabs[tabs.length - 1].id, { type: 'glp:context-action', action: 'tag-user' });
    }));
  check('context: a right-click on a post identifies its author', seenContext?.result?.ok === true,
    JSON.stringify(seenContext));
  check('context: the tag action opens the picker for that author',
    await page.locator('#glp-tag-picker').count() === 1);
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('#glp-tag-picker').evaluate(node => node.remove()).catch(() => {});

  const exported = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    sendMessage(worker, page, { type: 'glp:context-action', action: 'export-thread' })
  ]).then(([dl]) => dl);
  check('context: the export action downloads the thread', /\.md$/.test(exported.suggestedFilename()),
    exported.suggestedFilename());

  const noThread = await sendMessage(worker, page, { type: 'glp:context-action', action: 'preview-media' });
  check('context: an action with nothing under the cursor reports why', noThread?.result?.ok === false,
    JSON.stringify(noThread));

  // ---------------- Persistence: the stores that are not settings ----------------
  // Mutes, blocks, tags and hidden threads each live in their own GM_* key and all went
  // through the same double-parse, so cover one of them end to end. Runs last: a mute hides posts.
  const muteTarget = await page.evaluate(() => {
    const headers = [...document.querySelectorAll('.msg tr[id^="post_"] .author_header')];
    for (let index = 0; index < headers.length; index++) {
      const link = headers[index].querySelector('b a') || headers[index].querySelector('a');
      const name = link ? link.textContent.trim() : '';
      if (name && name !== 'Anonymous Coward') return { index, name };
    }
    return null;
  });
  check('thread: found a named author to mute', !!muteTarget, JSON.stringify(muteTarget));

  if (muteTarget) {
    await page.locator('.msg tr[id^="post_"] .author_header .glp-mute-btn').nth(muteTarget.index).click();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const afterReload = await sendMessage(worker, page, { type: 'glp:get-state' });
    const mutedUsers = afterReload?.lists?.mutedUsers || [];
    check('thread: the mute list survives a reload', mutedUsers.includes(muteTarget.name), JSON.stringify(mutedUsers));
    check('thread: the muted author stays hidden after the reload',
      await page.locator('.glp-muted-post').count() > 0);
  }
  // ---------------- Settings that used to need a reload ----------------
  // Six features carried no apply handler, so switching them on did nothing until the next page
  // load. Each must now appear on toggle and appear exactly once after repeated applies.
  const TOGGLES = [
    { key: 'backToTopButton', selector: '#glp-back-to-top', label: 'back-to-top button' },
    { key: 'scrollProgress', selector: '#glp-scroll-progress', label: 'scroll progress bar' },
    { key: 'threadQuickSearch', selector: '#glp-quick-search', label: 'quick search panel' }
  ];
  for (const toggle of TOGGLES) {
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { [toggle.key]: false } });
    await page.waitForTimeout(350);
    check(`apply: the ${toggle.label} goes away when switched off`,
      await page.locator(toggle.selector).count() === 0);

    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { [toggle.key]: true } });
    await page.waitForTimeout(350);
    check(`apply: the ${toggle.label} appears without a reload`,
      await page.locator(toggle.selector).count() === 1);

    // A second apply must not stack a duplicate.
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 15 } });
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 14 } });
    await page.waitForTimeout(350);
    check(`apply: repeated applies leave exactly one ${toggle.label}`,
      await page.locator(toggle.selector).count() === 1,
      String(await page.locator(toggle.selector).count()));
  }

  // ---------------- Hidden-tab timers ----------------
  // A real second tab is the only honest way to hide the first: document.hidden defined from
  // page.evaluate lives in the main world and the content script would never see it.
  await page.goto(CAPTURES.feed.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { autoRefresh: true, autoRefreshInterval: 600 } });
  await page.waitForTimeout(1500);

  const barWidth = () => page.locator('#glp-auto-refresh-bar .bar')
    .evaluate(node => parseFloat(node.style.width) || 0).catch(() => -1);
  check('timers: the auto-refresh countdown is running while visible', await barWidth() >= 0);

  const visibleStart = await barWidth();
  await page.waitForTimeout(2500);
  const visibleEnd = await barWidth();
  check('timers: the countdown advances in a visible tab', visibleEnd > visibleStart,
    `${visibleStart} -> ${visibleEnd}`);

  // The hidden-tab half of this cannot be asserted here: headless Chromium reports background
  // tabs as visible, so bringing another tab to the front does not set `document.hidden`, and the
  // content script's isolated world cannot be patched from `page.evaluate`. Noted in
  // Roadmap_Blocked.md rather than asserted - a check that cannot fail is worse than none, and
  // this one did exactly that before auto-refresh was made re-appliable: with no bar on the page
  // both readings were -1 and "frozen" passed.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { autoRefresh: false } });
  await page.waitForTimeout(400);
  check('timers: switching auto-refresh off removes its countdown bar',
    await page.locator('#glp-auto-refresh-bar').count() === 0);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { autoRefresh: true } });
  await page.waitForTimeout(600);
  check('timers: switching it back on restores exactly one countdown bar',
    await page.locator('#glp-auto-refresh-bar').count() === 1);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { autoRefresh: false } });
} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

async function sendMessage(worker, page, message) {
  return worker.evaluate(async msg => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    if (!tabs.length) return { ok: false, reason: 'no GLP tab' };
    try {
      return await chrome.tabs.sendMessage(tabs[tabs.length - 1].id, msg);
    } catch (error) {
      return { ok: false, reason: String(error) };
    }
  }, message);
}

async function workerDiagnostics(worker, page) {
  const response = await sendMessage(worker, page, { type: 'glp:diagnostics' });
  return response && response.ok ? response.diagnostics : null;
}

const failed = results.filter(result => !result.ok);
console.log(`\nRuntime verification: ${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  process.exitCode = 1;
}
