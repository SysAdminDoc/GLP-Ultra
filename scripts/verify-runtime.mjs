/**
 * Runtime verification: loads the unpacked extension in Playwright's Chromium and replays the
 * real GLP captures at their live URLs, so content scripts match exactly as they would on the site.
 *
 * The live site cannot be used - it answers automation with a Cloudflare challenge - and
 * `page.evaluate` cannot see the engine, which lives in the isolated content-script world.
 * DOM assertions work because the DOM is shared; anything needing the engine object is driven
 * through the service worker with `chrome.tabs.sendMessage`.
 */
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
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

// Every assertion below replays one of these. A missing capture must stop the run rather than
// leave a shorter suite reporting all-green: this whole harness is the capture substrate.
for (const [key, capture] of Object.entries(CAPTURES)) {
  const info = await stat(path.join(root, capture.file)).catch(() => null);
  if (!info?.isFile() || info.size === 0) {
    console.error(`verify-runtime: ${capture.file} is missing or empty, so the ${key} replay cannot run.`);
    console.error('Restore the captures (see scripts/verify-captures.mjs) before running this gate.');
    process.exit(1);
  }
}

const CONTRACT_PROOF_URL = 'https://www.godlikeproductions.com/glp-contract-proof';
// A thread-shaped URL on purpose: classifyRoute() drives which features run, and a made-up path
// classifies as generic, so every thread-only feature would sit out and the check would pass by
// never building anything. The route handler matches this exact URL before the capture matcher.
const HOSTILE_ID_URL = 'https://www.godlikeproductions.com/forum1/message6170474/pg7';
const AD_PROOF_URL = 'https://www.godlikeproductions.com/glp-ad-proof';
const AD_PROBE_URLS = [
  'https://cdn.mgid.com/glp-probe.js',
  'https://securepubads.g.doubleclick.net/glp-probe.js'
];

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
    if (url === CONTRACT_PROOF_URL) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><body>
          <form id="membership" onsubmit="window.contractSubmitted = true; return false">
            <label><input type="checkbox" name="adult"> I am 18 or older</label>
            <label><input type="checkbox" name="terms"> I accept the membership contract</label>
            <input type="submit" name="disclaimer" value="Enter">
          </form>
        </body></html>`
      });
      return;
    }
    if (url === AD_PROOF_URL) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><body>
          <script src="https://assets.example.test/glp-control.js"></script>
          <script src="${AD_PROBE_URLS[0]}"></script>
          <script src="${AD_PROBE_URLS[1]}"></script>
        </body></html>`
      });
      return;
    }
    if (url === 'https://assets.example.test/glp-control.js') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.glpControlLoaded = true;' });
      return;
    }
    if (AD_PROBE_URLS.includes(url)) {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.glpAdProbeLoaded = true;' });
      return;
    }
    if (url === HOSTILE_ID_URL) {
      // The thread capture with two of our own surface ids planted in page content, the way a
      // forum post carrying markup would. Injected ahead of everything so they are present
      // before the engine runs.
      const planted = html.thread.replace(
        /<body([^>]*)>/i,
        '<body$1><div id="glp-back-to-top" data-planted="yes">not ours</div>'
        + '<div id="glp-scroll-progress" data-planted="yes">not ours either</div>'
      );
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: planted });
      return;
    }
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

  // Migration: an older userscript may have kept a nested payload under the pre-v2 key and a
  // mute list under its old name. Exercise the actual document-start path, not a copied helper,
  // then clear both stores before the main golden-path run.
  const migrationPage = await context.newPage();
  await migrationPage.addInitScript(() => {
    localStorage.setItem('glpx.settings.v1', JSON.stringify({
      version: 1,
      settings: { theme: 'alien-green', hideAds: false, fontSize: '17' }
    }));
    localStorage.setItem('glpMuteList', JSON.stringify(['LegacyMute']));
  });
  await migrationPage.goto(CAPTURES.feed.url, { waitUntil: 'domcontentloaded' });
  await migrationPage.waitForTimeout(500);
  const migrated = await sendMessage(worker, migrationPage, { type: 'glp:get-state' });
  check('migration: nested legacy settings are imported',
    migrated?.settings?.colorTheme === 'alien' && migrated?.settings?.removeAds === false
      && migrated?.settings?.fontSize === 17,
    JSON.stringify(migrated?.settings));
  check('migration: legacy list keys are imported',
    migrated?.lists?.mutedUsers?.includes('LegacyMute'), JSON.stringify(migrated?.lists?.mutedUsers));
  const migrationDiag = await workerDiagnostics(worker, migrationPage);
  check('migration: diagnostics record the source and schema version',
    migrationDiag?.settingsSchema?.source === 'glpx.settings.v1'
      && migrationDiag?.settingsSchema?.schemaVersion >= 2,
    JSON.stringify(migrationDiag?.settingsSchema));
  await migrationPage.evaluate(() => localStorage.clear());
  await migrationPage.close();
  await worker.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
  });

  // A removed v3.7 setting used to tick both legal checkboxes and submit this form. Loading an
  // old payload must now prune that key and leave consent entirely to the person at the browser.
  const contractPage = await context.newPage();
  await contractPage.addInitScript(() => {
    localStorage.setItem('glpEnhanced.mv3.glpEnhancedSettings', JSON.stringify({
      enabled: true,
      autoBypassClubNag: true
    }));
    localStorage.setItem('glpEnhanced.mv3.glpSettingsSchemaVersion', '2');
  });
  await contractPage.goto(CONTRACT_PROOF_URL, { waitUntil: 'domcontentloaded' });
  await contractPage.waitForTimeout(500);
  check('consent: membership contract remains unchecked',
    await contractPage.locator('input[type="checkbox"]:checked').count() === 0);
  check('consent: membership contract is never auto-submitted',
    await contractPage.evaluate(() => window.contractSubmitted !== true));
  const contractState = await sendMessage(worker, contractPage, { type: 'glp:get-state' });
  check('consent: removed auto-accept key is pruned during migration',
    !Object.prototype.hasOwnProperty.call(contractState?.settings || {}, 'autoBypassClubNag'),
    JSON.stringify(contractState?.settings));
  await contractPage.evaluate(() => localStorage.clear());
  await contractPage.close();
  await worker.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
  });

  // Exercise the installed declarative rules instead of merely parsing their JSON. The control
  // resource proves the page can load a script; both ad-network resources must fail before their
  // bodies execute, with Chromium identifying the extension block.
  const adProofPage = await context.newPage();
  const adFailures = [];
  adProofPage.on('requestfailed', request => {
    if (AD_PROBE_URLS.includes(request.url())) {
      adFailures.push({ url: request.url(), error: request.failure()?.errorText || '' });
    }
  });
  await adProofPage.goto(AD_PROOF_URL, { waitUntil: 'domcontentloaded' });
  await adProofPage.waitForTimeout(500);
  const probeState = await adProofPage.evaluate(() => ({
    control: window.glpControlLoaded === true,
    ad: window.glpAdProbeLoaded === true
  }));
  check('network: non-ad control resource loads', probeState.control, JSON.stringify(probeState));
  check('network: MGID and DoubleClick scripts do not execute', !probeState.ad, JSON.stringify(probeState));
  check('network: browser reports both ad probes blocked by the extension',
    AD_PROBE_URLS.every(url => adFailures.some(entry => entry.url === url && /BLOCKED_BY_CLIENT/i.test(entry.error))),
    JSON.stringify(adFailures));
  await adProofPage.close();

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
  check('feed: native links using the site ads class are not targeted',
    await page.locator('a.ads').evaluateAll(nodes => nodes.length > 0
      && nodes.every(node => getComputedStyle(node).display !== 'none')));

  const feedSurface = await page.locator('.threads tr:not(.threads_header_row)').first().evaluate(row => {
    const titleCell = row.querySelector('.sfr');
    const titleStyle = getComputedStyle(titleCell);
    return {
      fontFamily: titleStyle.fontFamily,
      background: titleStyle.backgroundColor,
      borderTop: titleStyle.borderTopWidth,
      borderSpacing: getComputedStyle(row.closest('table.threads')).borderSpacing
    };
  });
  const feedGap = Number((feedSurface.borderSpacing.match(/[\d.]+/g) || []).at(-1) || 0);
  check('feed: thread rows use the shared system UI typography',
    !/times new roman/i.test(feedSurface.fontFamily), feedSurface.fontFamily);
  check('feed: thread rows have separated themed surfaces',
    feedSurface.background !== 'transparent'
      && feedSurface.background !== 'rgba(0, 0, 0, 0)'
      && parseFloat(feedSurface.borderTop) >= 1
      && feedGap >= 4,
    JSON.stringify(feedSurface));

  const feedDiag = await workerDiagnostics(worker, page);
  check('feed: route classified as feed', feedDiag?.route === 'feed', JSON.stringify(feedDiag));
  check('feed: no feature errors', (feedDiag?.errors?.length ?? -1) === 0,
    feedDiag ? JSON.stringify(feedDiag.errors) : 'diagnostics unreachable');
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

  check('feed: opening the shelf hands the screen over instead of covering the panel',
    await page.locator('#glp-enhanced-overlay').count() === 0);
  check('feed: the shelf offers the way back to settings',
    await page.locator('#glp-recovery .glp-diag-header button:text("Back to settings")').count() === 1);
  await page.locator('#glp-recovery [data-glp-close]').click();
  await page.waitForTimeout(200);
  check('feed: the recovery shelf closes', await page.locator('#glp-recovery').count() === 0);

  const directDiagnostics = await sendMessage(worker, page, { type: 'glp:open-diagnostics' });
  await page.waitForTimeout(200);
  check('feed: options bridge opens diagnostics directly',
    directDiagnostics?.ok && await page.locator('#glp-diagnostics').count() === 1);
  await page.locator('#glp-diagnostics [data-glp-close]').click();
  const directRecovery = await sendMessage(worker, page, { type: 'glp:open-recovery' });
  await page.waitForTimeout(200);
  check('feed: options bridge opens recovery directly',
    directRecovery?.ok && await page.locator('#glp-recovery').count() === 1);
  await page.locator('#glp-recovery [data-glp-close]').click();

  // A forum update is a fragment, not a reason to rescan the whole document. Append a clean
  // capture row and require the scoped fragment registry to add its owned control in place.
  await page.locator('.threads tbody tr:not(.threads_header_row)').first().evaluate(row => {
    const clone = row.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove(...[...clone.classList].filter(name => name.startsWith('glp-')));
    clone.querySelectorAll('[id^="glp-"], [class*="glp-"], [data-glp-converted], [data-glp-freshness], [data-glp-badged]').forEach(node => node.remove());
    clone.dataset.glpRuntimeAdded = '1';
    row.parentElement.appendChild(clone);
  });
  await waitFor(
    () => page.locator('[data-glp-runtime-added] .glp-hide-col-btn').count(),
    count => count === 1,
    3000,
    150
  );
  const addedRowState = await page.evaluate(() => {
    const row = document.querySelector('[data-glp-runtime-added]');
    return row ? { buttons: row.querySelectorAll('.glp-hide-col-btn').length, html: row.outerHTML.slice(0, 500) } : null;
  });
  const addedDiag = await workerDiagnostics(worker, page);
  const fragmentTiming = (addedDiag?.timings || []).find(entry => entry.id === 'feed.hideThreads' && entry.stage === 'apply');
  check('feed: added rows are processed by the scoped fragment registry',
    await page.locator('[data-glp-runtime-added] .glp-hide-col-btn').count() === 1,
    JSON.stringify({ addedRowState, fragmentTiming, setting: await sendMessage(worker, page, { type: 'glp:get-state' }).then(state => state?.settings?.hideThreadButtons) }));

  // ---------------- Thread route ----------------
  await page.goto(CAPTURES.thread.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  check('thread: post numbers rendered', await page.locator('.glp-post-number').count() > 0);
  check('thread: mute buttons rendered', await page.locator('.glp-mute-btn').count() > 0);
  check('thread: block buttons rendered', await page.locator('.glp-block-btn').count() > 0);
  check('thread: quote depth badges rendered', await page.locator('.glp-quote-depth').count() > 0);
  check('thread: tools bar rendered', await page.locator('#glp-thread-tools-bar').count() === 1);
  check('thread: OP navigation rendered once', await page.locator('.glp-op-nav').count() === 1);

  const threadSurface = await page.locator('.msg tr[id^="post_"]').first().evaluate(row => {
    const author = row.querySelector('.messageauthor, .replyauthor');
    const content = row.querySelector('.messagecontent, .replycontent');
    const quote = document.querySelector('.quoteo');
    const table = row.closest('table.msg');
    const authorStyle = getComputedStyle(author);
    const contentStyle = getComputedStyle(content);
    const quoteStyle = quote ? getComputedStyle(quote) : null;
    return {
      fontFamily: contentStyle.fontFamily,
      tableBorderSpacing: getComputedStyle(table).borderSpacing,
      authorBackground: authorStyle.backgroundColor,
      contentBackground: contentStyle.backgroundColor,
      authorWidth: author.getBoundingClientRect().width,
      contentWidth: content.getBoundingClientRect().width,
      authorBorderLeft: authorStyle.borderLeftWidth,
      contentBorderRight: contentStyle.borderRightWidth,
      authorRadius: authorStyle.borderTopLeftRadius,
      contentRadius: contentStyle.borderTopRightRadius,
      quoteBackground: quoteStyle?.backgroundColor || ''
    };
  });
  const visiblePaint = value => value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)';
  const rowGap = Number((threadSurface.tableBorderSpacing.match(/[\d.]+/g) || []).at(-1) || 0);
  check('thread: reading surface uses system UI typography',
    !/times new roman/i.test(threadSurface.fontFamily), threadSurface.fontFamily);
  check('thread: posts have distinct author and message surfaces',
    visiblePaint(threadSurface.authorBackground)
      && visiblePaint(threadSurface.contentBackground)
      && threadSurface.authorBackground !== threadSurface.contentBackground,
    JSON.stringify(threadSurface));
  check('thread: posts read as separated cards',
    rowGap >= 8
      && parseFloat(threadSurface.authorBorderLeft) >= 1
      && parseFloat(threadSurface.contentBorderRight) >= 1
      && parseFloat(threadSurface.authorRadius) >= 8
      && parseFloat(threadSurface.contentRadius) >= 8,
    JSON.stringify(threadSurface));
  check('thread: the author rail leaves the post as the primary reading surface',
    threadSurface.authorWidth <= 220 && threadSurface.contentWidth >= threadSurface.authorWidth * 2,
    JSON.stringify(threadSurface));
  check('thread: quotes have their own readable surface',
    visiblePaint(threadSurface.quoteBackground), threadSurface.quoteBackground);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { opPostNav: true } });
  await page.waitForTimeout(250);
  check('thread: reapplying OP navigation remains idempotent',
    await page.locator('.glp-op-nav').count() === 1,
    String(await page.locator('.glp-op-nav').count()));

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
  check('thread: no feature errors', (threadDiag?.errors?.length ?? -1) === 0,
    threadDiag ? JSON.stringify(threadDiag.errors) : 'diagnostics unreachable');

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
  check('thread: the diagnostics panel offers an issue bundle export',
    await page.locator('#glp-diagnostics button:text("Save report")').count() === 1);
  const issueDownload = await captureDownload(page,
    () => page.locator('#glp-diagnostics button:text("Save report")').click());
  const issueText = issueDownload ? await readDownload(issueDownload) : '';
  let issueBundle = null;
  try { issueBundle = JSON.parse(issueText); } catch (error) { /* asserted below */ }
  check('thread: the issue bundle has a reviewable JSON shape',
    issueDownload?.suggestedFilename().startsWith('glp-issue-')
      && issueBundle?.format === 'glp-ultra-issue-bundle'
      && issueBundle?.diagnostics?.route === 'thread'
      && issueBundle?.settings
      && issueBundle?.lists,
    issueDownload ? issueDownload.suggestedFilename() : 'no download');
  await page.locator('#glp-diagnostics [data-glp-close]').click();
  await page.waitForTimeout(200);
  check('thread: the diagnostics panel closes', await page.locator('#glp-diagnostics').count() === 0);
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

  // Feature teardown must restore page-owned state, not only remove GLP nodes. Capture one
  // converted date and exercise both reversible data markers and listener-backed controls.
  const timestampBefore = await page.locator('.author_date').first().evaluate(node => ({
    text: node.dataset.glpOriginalText || node.textContent,
    title: node.dataset.glpOriginalTitle || node.getAttribute('title') || ''
  }));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { relativeTimestamps: false } });
  await page.waitForTimeout(350);
  const timestampOff = await page.locator('.author_date').first().evaluate(node => ({
    text: node.textContent,
    title: node.getAttribute('title') || '',
    converted: node.hasAttribute('data-glp-converted')
  }));
  check('lifecycle: disabling relative timestamps restores original text and title',
    !timestampOff.converted && timestampOff.text === timestampBefore.text && timestampOff.title === timestampBefore.title,
    JSON.stringify({ timestampBefore, timestampOff }));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { relativeTimestamps: true } });
  await page.waitForTimeout(350);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { collapsiblePosts: false } });
  await page.waitForTimeout(350);
  check('lifecycle: disabling collapsible posts removes indicators and markers',
    await page.locator('.glp-collapse-indicator').count() === 0
      && await page.locator('[data-glp-collapsible]').count() === 0);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { collapsiblePosts: true } });
  await page.waitForTimeout(350);
  check('lifecycle: re-enabling collapsible posts restores one indicator per author',
    await page.locator('.glp-collapse-indicator').count() > 0);
  check('lifecycle: injected thread toolbar carries its feature owner',
    await page.locator('#glp-thread-tools-bar[data-glpx-owner]').count() === 1);

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
  const watcherAlarm = await waitFor(
    () => worker.evaluate(() => chrome.alarms.get('glp-ultra-watcher')),
    alarm => !!alarm,
    8000);
  check('thread: the extension schedules the watcher with chrome.alarms',
    watcherAlarm?.name === 'glp-ultra-watcher' && watcherAlarm.periodInMinutes >= 5,
    JSON.stringify(watcherAlarm));
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

  const alarmCheck = await sendMessage(worker, page, { type: 'glp:watch-check' });
  check('thread: a service-worker alarm reaches the watcher bridge',
    alarmCheck?.ok === true && alarmCheck?.result?.checked === 1,
    JSON.stringify(alarmCheck));

  await page.locator('#glp-watch-digest [data-watch-action="unwatch"]').click();
  await page.waitForTimeout(300);
  check('thread: unwatching empties the digest',
    await page.locator('#glp-watch-digest .glp-watch-empty').count() === 1);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { watcherEnabled: false } });
  await page.waitForTimeout(400);
  const clearedWatcherAlarm = await waitFor(
    () => worker.evaluate(() => chrome.alarms.get('glp-ultra-watcher')),
    alarm => alarm == null,
    8000);
  check('thread: disabling the watcher clears its background alarm', clearedWatcherAlarm == null,
    JSON.stringify(clearedWatcherAlarm));
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

  const download = await captureDownload(page, () => page.locator('[data-glp-thread-tool="export-json"]').click());
  check('thread: JSON export downloads', /\.json$/.test(download?.suggestedFilename() ?? ''),
    download ? download.suggestedFilename() : 'no download event');
  const payload = download ? JSON.parse(await readDownload(download)) : { posts: [], media: null, source: null };
  check('thread: JSON export has posts', Array.isArray(payload.posts) && payload.posts.length > 0, `${payload.postCount} posts`);
  check('thread: JSON export records source URL', payload.source === CAPTURES.thread.url, payload.source);
  check('thread: JSON export carries a media manifest', Array.isArray(payload.media), typeof payload.media);
  check('thread: JSON export preserves quote depth',
    payload.posts.some(post => post.maxQuoteDepth > 0),
    payload.posts.map(p => p.maxQuoteDepth).join(','));
  check('thread: JSON export strips injected chrome',
    !JSON.stringify(payload.posts).includes('glp-post-number'));

  const mdDownload = await captureDownload(page, () => page.locator('[data-glp-thread-tool="export-md"]').click());
  check('thread: Markdown export downloads', /\.md$/.test(mdDownload?.suggestedFilename() ?? ''),
    mdDownload ? mdDownload.suggestedFilename() : 'no download event');
  const markdown = mdDownload ? await readDownload(mdDownload) : '';
  check('thread: Markdown export has a heading and posts', markdown.startsWith('# ') && markdown.includes('## #1 '));
  check('thread: Markdown export quotes nested material', markdown.includes('\n> '));
  check('thread: Markdown export lists the media manifest', markdown.includes('## Media manifest'));

  // ---------------- Settings sync (opt-in) ----------------
  // The off-state assertion lives at the end of this section, after sync has been proven to
  // write. Asserting an empty sync area here would run against a fresh temp profile, where it
  // is empty whatever the code does.

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

  // Now the off-state means something: the checks above proved this area does receive writes
  // when the setting is on, so an empty area after a real change is evidence rather than a
  // property of the fresh profile.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 15 } });
  await page.waitForTimeout(600);
  const syncAfterOff = await worker.evaluate(() => chrome.storage.sync.get(null));
  check('sync: nothing is written to chrome.storage.sync while the setting is off',
    Object.keys(syncAfterOff).length === 0, JSON.stringify(Object.keys(syncAfterOff)));

  // ---------------- Shareable packs ----------------
  // The property that matters is that a pack someone else wrote cannot delete what you have.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: 'mine', colorTheme: 'midnight' } });
  await page.waitForTimeout(300);

  const themePack = (await sendMessage(worker, page, { type: 'glp:build-pack', kind: 'theme' }))?.pack;
  check('packs: a theme pack carries the look and nothing else',
    themePack?.kind === 'theme' && 'colorTheme' in (themePack.settings || {})
      && !('keywordHide' in (themePack.settings || {})) && !('customCSS' in (themePack.settings || {})),
    JSON.stringify(Object.keys(themePack?.settings || {})));
  check('packs: a theme pack carries no user lists',
    !themePack?.mutedUsers && !themePack?.blockedUsers);

  const fullBackup = (await sendMessage(worker, page, { type: 'glp:build-backup' }))?.backup;
  check('backup: the in-page export uses the complete format-3 data contract',
    fullBackup?.format === 'glp-ultra-backup' && fullBackup?.formatVersion === 3
      && Array.isArray(fullBackup?.watchedThreads) && Array.isArray(fullBackup?.userStatsPages),
    JSON.stringify({ formatVersion: fullBackup?.formatVersion, keys: Object.keys(fullBackup || {}) }));

  const applied = await sendMessage(worker, page, {
    type: 'glp:apply-pack',
    pack: { format: 'glp-ultra-pack', kind: 'theme', settings: { colorTheme: 'dracula' } }
  });
  check('packs: applying a theme pack changes the theme', applied?.result?.ok === true, JSON.stringify(applied));
  const themedState = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: the theme pack took effect', themedState?.settings?.colorTheme === 'dracula', themedState?.settings?.colorTheme);
  check('packs: a theme pack leaves filters untouched', themedState?.settings?.keywordHide === 'mine', themedState?.settings?.keywordHide);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { customCSS: '.local-rule { color: red; }' } });
  const hostileTheme = await sendMessage(worker, page, {
    type: 'glp:apply-pack',
    pack: {
      format: 'glp-ultra-pack',
      kind: 'theme',
      settings: {
        colorTheme: 'not-a-theme',
        shapeStyle: 'pill',
        quoteBorderColor: 'red; } body { display: none',
        fontSize: 999,
        customCSS: '* { display: none !important; }'
      }
    }
  });
  const afterHostileTheme = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('packs: imported theme values are validated before application',
    hostileTheme?.result?.ok === true
      && afterHostileTheme?.settings?.colorTheme === 'midnight'
      && afterHostileTheme?.settings?.shapeStyle === 'default'
      && afterHostileTheme?.settings?.quoteBorderColor === 'var(--glpx-accent)'
      && afterHostileTheme?.settings?.fontSize === 24,
    JSON.stringify(afterHostileTheme?.settings));
  check('packs: shareable themes cannot import executable custom CSS',
    afterHostileTheme?.settings?.customCSS === '.local-rule { color: red; }',
    afterHostileTheme?.settings?.customCSS);

  const hostilePatch = await sendMessage(worker, page, {
    type: 'glp:patch-settings',
    patch: {
      enabled: 'yes', colorTheme: 'invalid', shapeStyle: 'pill',
      quoteBorderColor: 'red; } body { display: none', fontSize: 999, lineHeight: -5,
      autoRefreshInterval: 1, watcherIntervalMinutes: 9999, userMuteMatchMode: 'wildcard',
      userHistoryCap: 999999, mediaHoverPreviewSize: -20
    }
  });
  check('settings API: external patches are type-checked and range-clamped',
    hostilePatch?.settings?.enabled === true
      && hostilePatch?.settings?.colorTheme === 'midnight'
      && hostilePatch?.settings?.shapeStyle === 'default'
      && hostilePatch?.settings?.quoteBorderColor === 'var(--glpx-accent)'
      && hostilePatch?.settings?.fontSize === 24
      && hostilePatch?.settings?.lineHeight === 1
      && hostilePatch?.settings?.autoRefreshInterval === 15
      && hostilePatch?.settings?.watcherIntervalMinutes === 240
      && hostilePatch?.settings?.userMuteMatchMode === 'exact'
      && hostilePatch?.settings?.userHistoryCap === 1000
      && hostilePatch?.settings?.mediaHoverPreviewSize === 30,
    JSON.stringify(hostilePatch?.settings));

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

  await sendMessage(worker, page, {
    type: 'glp:patch-settings',
    patch: {
      keywordHide: '', colorTheme: 'midnight', customCSS: '', fontSize: 14, lineHeight: 1.5,
      autoRefreshInterval: 60, watcherIntervalMinutes: 15, userMuteMatchMode: 'exact',
      userHistoryCap: 400, mediaHoverPreviewSize: 70
    }
  });

  // Divergence between localStorage (the primary store) and its chrome.storage mirror is the
  // state that fires the shim's sync at document_start. Two things must hold afterwards: the
  // mirror wins, and the page still gets its features - an external settings push arriving
  // before the document is parsed must not mark the run done against an empty DOM.
  // Establish the precondition explicitly: GM_setValue is synchronous while chrome.storage.set
  // is not, so deleting the primary store before the mirror has accepted the imported list tests
  // a lost write rather than restoration and turns machine load into a false negative.
  const storedMuteMirror = await waitFor(
    () => worker.evaluate(async () => {
      const stored = await chrome.storage.local.get('glpMutedUsers');
      try {
        return JSON.parse(stored.glpMutedUsers || '[]');
      } catch (error) {
        return [];
      }
    }),
    muted => ['PackedMuteOne', 'PackedMuteTwo'].every(name => muted.includes(name)));
  check('packs: the imported mute list reaches the chrome.storage mirror',
    ['PackedMuteOne', 'PackedMuteTwo'].every(name => storedMuteMirror.includes(name)),
    JSON.stringify(storedMuteMirror));
  await page.evaluate(() => window.localStorage.removeItem('glpEnhanced.mv3.glpMutedUsers'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  // The shim's restore is an async chrome.storage read racing a page load, so a fixed sleep is a
  // coin toss - this check failed once in eight runs on a loaded machine, which is the worst
  // possible outcome: a gate people learn to re-run rather than believe.
  const mirrored = await waitFor(
    () => sendMessage(worker, page, { type: 'glp:get-state' }),
    state => ['PackedMuteOne', 'PackedMuteTwo'].every(name => (state?.lists?.mutedUsers || []).includes(name)));
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
  await page.locator('#glp-recovery [data-glp-close]').click();
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
  await page.locator('#glp-recovery [data-glp-close]').click();
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

  // ---------------- Semantic colour tokens ----------------
  // The static gate rejects a token that references itself; this one proves the tokens survive
  // all the way to a painted element. A dead token does not disappear - `border-left-color`
  // falls back to `currentColor`, so a broken success toast is still bordered, just in the text
  // colour. Comparing against the element's own colour is what makes that visible.
  const semantic = await page.evaluate(() => {
    const read = variant => {
      const probe = document.createElement('div');
      probe.className = `glp-toast glp-toast-${variant}`;
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const parse = value => (value.match(/\d+/g) || []).slice(0, 3).map(Number);
      const out = { border: parse(style.borderLeftColor), text: parse(style.color) };
      probe.remove();
      return out;
    };
    const root = getComputedStyle(document.documentElement);
    return {
      tokens: ['success', 'warning', 'danger'].map(name => root.getPropertyValue(`--glpx-${name}`).trim()),
      // The danger token is worn by the `error` variant; naming a class that does not exist
      // reads the base toast's accent border and looks like a broken token.
      success: read('success'),
      warning: read('warning'),
      danger: read('error')
    };
  });
  check('theme: the semantic tokens resolve to real, distinct colours',
    semantic.tokens.every(value => /^#[0-9a-f]{3,8}$/i.test(value)) && new Set(semantic.tokens).size === 3,
    JSON.stringify(semantic.tokens));
  const painted = (variant, dominant) => {
    const { border, text } = semantic[variant];
    if (border.length !== 3 || text.length !== 3) return false;
    // Not merely inherited from the text colour, and the channel the name promises leads.
    if (border.every((channel, index) => channel === text[index])) return false;
    return border[dominant] > border[(dominant + 1) % 3] && border[dominant] > border[(dominant + 2) % 3];
  };
  check('theme: a success toast paints green, not the inherited text colour',
    painted('success', 1), JSON.stringify(semantic.success));
  check('theme: a danger toast paints red, not the inherited text colour',
    painted('danger', 0), JSON.stringify(semantic.danger));
  check('theme: a warning toast paints warm, not the inherited text colour',
    painted('warning', 0) && semantic.warning.border[1] > semantic.warning.border[2],
    JSON.stringify(semantic.warning));

  // ---------------- Fetch queue backoff ----------------
  // A watcher with twenty threads on it is twenty requests a cycle, and failures used to leave
  // the limiter's clock untouched — so `elapsed` grew, the delay computed negative, and a site
  // that was refusing got hammered as fast as it could refuse. Make it refuse and watch.
  const before = await workerDiagnostics(worker, page);
  check('fetch: a healthy queue reports no backoff',
    before?.fetchQueue?.backoffMs === 0 && before?.fetchQueue?.consecutiveFailures === 0,
    JSON.stringify(before?.fetchQueue));

  // Page-level routes win over the context-level capture router, so this only affects the
  // watcher's own polling for as long as it is installed. Matched as a glob: the watcher polls
  // the thread's *base* URL, not the /pg1 one the capture is keyed on.
  const threadGlob = `${withoutPage(CAPTURES.thread.url)}*`;
  await page.route(threadGlob, route => route.fulfill({
    status: 429,
    headers: { 'retry-after': '7' },
    contentType: 'text/plain',
    body: 'slow down'
  }));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { watcherEnabled: true } });
  await page.waitForTimeout(700);
  await page.locator('[data-glp-thread-tool="watch"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-glp-thread-tool="watch-digest"]').click();

  const backedOff = await waitFor(
    () => workerDiagnostics(worker, page),
    state => (state?.fetchQueue?.consecutiveFailures ?? 0) > 0,
    15000);
  check('fetch: a refusal is counted as a failure', (backedOff?.fetchQueue?.consecutiveFailures ?? 0) > 0,
    JSON.stringify(backedOff?.fetchQueue));
  // 7s stated by the server, so anything near that proves the header was read rather than the
  // exponential default (which from a 1s floor would be 2s on the first failure).
  check('fetch: the queue honours the Retry-After the server stated',
    (backedOff?.fetchQueue?.backoffMs ?? 0) > 3000, `${backedOff?.fetchQueue?.backoffMs}ms`);

  await page.unroute(threadGlob);
  await page.locator('#glp-watch-digest [data-watch-action="unwatch"]').click().catch(() => {});
  await page.evaluate(() => document.getElementById('glp-watch-digest')?.remove());
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { watcherEnabled: false } });
  await page.waitForTimeout(400);

  // ---------------- Pre-upgrade settings backup ----------------
  // Loading keeps only keys the current schema declares, and the next save writes the pruned
  // object back — so an upgrade silently discards whatever a predecessor stored under a name
  // this build does not know. That is acceptable only because the old payload is recoverable.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: 'pre-upgrade-marker' } });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.localStorage.setItem('glpEnhanced.mv3.glpSettingsVersion', '3.0.0'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);

  const upgraded = await waitFor(
    () => workerDiagnostics(worker, page),
    state => !!state?.settingsBackup);
  check('backup: an upgrade banks the payload it is about to prune',
    upgraded?.settingsBackup?.from === '3.0.0' && upgraded?.settingsBackup?.to === manifestVersion,
    JSON.stringify(upgraded?.settingsBackup));

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: 'after-the-upgrade' } });
  await page.waitForTimeout(400);
  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(350);
  await page.locator('#glp-recovery-btn').click();
  await page.waitForTimeout(400);
  const backupRow = page.locator('#glp-recovery .glp-diag-group:has-text("Settings backup") .glp-recovery-row');
  check('backup: the recovery shelf offers it back', await backupRow.count() === 1,
    await page.locator('#glp-recovery .glp-diag-group:has-text("Settings backup")').innerText().catch(() => 'no group'));

  await backupRow.locator('button').click();
  await page.waitForTimeout(500);
  const afterRestore = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('backup: restoring it brings the pre-upgrade value back',
    afterRestore?.settings?.keywordHide === 'pre-upgrade-marker', restored?.settings?.keywordHide);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { keywordHide: '' } });
  await page.evaluate(() => window.localStorage.removeItem('glpEnhanced.mv3.glpEnhancedSettings_backup'));
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('glp-recovery')?.remove());

  // ---------------- Dark Reader coexistence ----------------
  // GLP Ultra is already a dark theme; Dark Reader inverting on top of it washes the palette out.
  // `<meta name="darkreader-lock">` is Dark Reader's own documented opt-out and is read live.
  const lockPresent = () => page.locator('meta[name="darkreader-lock"]').count();
  check('dark reader: the lock meta is present while GLP Ultra is theming', await lockPresent() === 1);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { overrideDarkReader: false } });
  await page.waitForTimeout(400);
  check('dark reader: switching the override off hands the page back', await lockPresent() === 0);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { overrideDarkReader: true } });
  await page.waitForTimeout(400);
  check('dark reader: switching it back on re-locks without a reload', await lockPresent() === 1);

  // The thread capture was saved from a browser that had Dark Reader running, so its <html>
  // already carries `data-darkreader-mode` — clear both markers before asserting absence, or the
  // detector looks stuck on. Two-sided on purpose: a detector that only ever says yes is not one.
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-darkreader-scheme');
    document.documentElement.removeAttribute('data-darkreader-mode');
  });
  const withoutDarkReader = await workerDiagnostics(worker, page);
  check('dark reader: not reported when none of its markers are on the page',
    withoutDarkReader?.darkReader?.detected === false,
    JSON.stringify(withoutDarkReader?.darkReader));

  await page.evaluate(() => document.documentElement.setAttribute('data-darkreader-scheme', 'dark'));
  const withDarkReader = await workerDiagnostics(worker, page);
  check('dark reader: reported, and the lock held, once its marker appears',
    withDarkReader?.darkReader?.detected === true && withDarkReader?.darkReader?.locked === true,
    JSON.stringify(withDarkReader?.darkReader));
  await page.evaluate(() => document.documentElement.removeAttribute('data-darkreader-scheme'));

  // ---------------- Custom CSS lockout and safe mode ----------------
  // Custom CSS is the only setting that can hide the interface for changing settings, and it is
  // saved, so a reload does not undo it. Paste the classic footgun and prove there is a way back.
  await sendMessage(worker, page, {
    type: 'glp:patch-settings',
    // Carries a marker: plenty of declutter rules legitimately emit `display: none !important`,
    // so the safe-mode assertion below needs a string only this stylesheet can contribute.
    patch: { customCSS: '* { display: none !important; } .glp-lockout-probe { outline: 3px solid magenta; }' }
  });
  await page.waitForTimeout(500);
  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(400);
  const lockedOut = await page.evaluate(() => {
    const overlay = document.getElementById('glp-enhanced-overlay');
    if (!overlay) return { open: false };
    const style = getComputedStyle(overlay);
    const box = overlay.getBoundingClientRect();
    return { open: true, display: style.display, visibility: style.visibility, width: Math.round(box.width) };
  });
  check('custom css: a blanket display:none cannot hide the settings panel',
    lockedOut.open && lockedOut.display !== 'none' && lockedOut.visibility !== 'hidden' && lockedOut.width > 200,
    JSON.stringify(lockedOut));

  // Safe mode is the answer to rules the armour cannot outrank, and it must survive the reload
  // that a locked-out reader will inevitably try.
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { safeMode: true } });
  await page.waitForTimeout(400);
  const stylesheet = await page.evaluate(() =>
    document.getElementById('glp-enhanced-styles')?.textContent ?? '');
  check('safe mode: the custom CSS is no longer emitted at all',
    !stylesheet.includes('glp-lockout-probe') && stylesheet.includes('Safe mode'),
    `probe present: ${stylesheet.includes('glp-lockout-probe')}`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  const afterReload = await waitFor(
    () => page.evaluate(() => ({
      safe: document.getElementById('glp-enhanced-styles')?.textContent.includes('Safe mode') ?? false,
      posts: document.querySelectorAll('.glp-post-number').length
    })),
    state => state.safe && state.posts > 0);
  check('safe mode: it survives the reload a locked-out reader would try',
    afterReload.safe, JSON.stringify(afterReload));
  check('safe mode: the page still runs its features while it is on',
    afterReload.posts > 0, JSON.stringify(afterReload));

  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(400);
  check('safe mode: the panel says why the custom CSS is not applied',
    await page.locator('#glp-safe-mode-notice').count() === 1);
  await page.locator('#glp-enhanced-close-btn').click();
  await page.waitForTimeout(200);

  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { safeMode: false, customCSS: '' } });
  await page.waitForTimeout(400);

  // ---------------- Settings panel ----------------
  // The panel is the primary interface and had exactly two assertions against it: that it opens
  // and that one section exists. Everything the navigation rewrite added went unverified.
  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(500);
  check('settings: the section rail lists every panel section',
    await page.locator('#glp-settings-nav .glp-nav-item').count()
      === await page.locator('#glp-enhanced-settings .glp-settings-section').count(),
    `${await page.locator('#glp-settings-nav .glp-nav-item').count()} rail entries vs `
    + `${await page.locator('#glp-enhanced-settings .glp-settings-section').count()} sections`);
  const routeAudit = await page.evaluate(() => {
    const failures = [];
    const links = [...document.querySelectorAll('#glp-settings-nav .glp-nav-item')];
    links.forEach(link => {
      link.click();
      const activePages = [...document.querySelectorAll('#glp-enhanced-settings .glp-settings-section.glp-page-active')]
        .filter(section => getComputedStyle(section).display !== 'none');
      const activeLinks = [...document.querySelectorAll('#glp-settings-nav .glp-nav-item.glp-nav-active')];
      if (activePages.length !== 1 || activeLinks.length !== 1
          || activePages[0].dataset.sectionId !== link.dataset.navSection) {
        failures.push(link.dataset.navSection);
      }
    });
    return { routes: links.length, failures };
  });
  check('settings: every rail destination routes to exactly one visible page',
    routeAudit.routes === 23 && routeAudit.failures.length === 0,
    JSON.stringify(routeAudit));

  // Grouping: the only destructive action in the footer used to sit against Export in a row of
  // seven. Assert the daylight, not the markup - a divider that renders as nothing is not one.
  // The panel clips its own overflow, so anything the layout pushes past its bottom edge simply
  // vanishes - and boundingBox() still reports the geometry of something that is not on screen,
  // which is why this asks the panel, not the button. Measured at a width that forces the footer
  // to wrap onto a second row, because that is the case a fixed chrome reservation gets wrong:
  // the body's height used to be `88vh - 184px` regardless of how tall the chrome really was.
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 900, height: 700 });
  await page.waitForTimeout(300);
  const footerVisible = await page.evaluate(() => {
    const panel = document.getElementById('glp-enhanced-settings');
    const footer = document.getElementById('glp-enhanced-settings-footer');
    if (!panel || !footer) return null;
    const panelRect = panel.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return {
      overflow: Math.round(footerRect.bottom - panelRect.bottom),
      insideViewport: footerRect.bottom <= window.innerHeight + 1,
      footerHeight: Math.round(footerRect.height),
      panel: [Math.round(panelRect.top), Math.round(panelRect.bottom)],
      footer: [Math.round(footerRect.top), Math.round(footerRect.bottom)]
    };
  });
  check('settings: the footer survives a width that wraps it, instead of being clipped away',
    footerVisible !== null && footerVisible.overflow <= 1 && footerVisible.insideViewport,
    JSON.stringify(footerVisible));
  await page.setViewportSize(viewport);
  await page.waitForTimeout(300);

  const resetBox = await page.locator('#glp-reset-btn').boundingBox();
  const exportBox = await page.locator('#glp-export-btn').boundingBox();
  const footerGap = (resetBox && exportBox) ? exportBox.x - (resetBox.x + resetBox.width) : -1;
  check('settings: the destructive reset is set apart from the rest of the footer',
    footerGap >= 24, `${Math.round(footerGap)}px between Reset and Export`);
  check('settings: the footer is grouped by job rather than one undifferentiated row',
    await page.locator('#glp-enhanced-settings-footer .glp-footer-cluster .glp-footer-group').count() === 3,
    `${await page.locator('#glp-enhanced-settings-footer .glp-footer-cluster .glp-footer-group').count()} groups`);

  // Changed-state tracking. Flip one setting and the dot, the rail and the section reset should
  // all agree with it; the only-changed filter should then show that setting and little else.
  const changedBefore = await page.locator('#glp-enhanced-settings .glp-setting-changed').count();
  await page.locator('[data-nav-section="post-enhancements"]').click();
  await page.locator('#setting-inlinePostNumbers').click();
  await page.waitForTimeout(350);
  const changedAfter = await page.locator('#glp-enhanced-settings .glp-setting-changed').count();
  const changedKeys = await page.locator('#glp-enhanced-settings .glp-setting-changed')
    .evaluateAll(nodes => nodes.map(node => node.dataset.settingKey));
  check('settings: changing a control marks that row as changed', changedAfter === changedBefore + 1,
    `${changedBefore} -> ${changedAfter}: ${changedKeys.join(', ')}`);
  // <input type="color"> coerces anything it cannot parse to #000000, so a setting whose default
  // is `var(--glpx-accent)` used to be read back as literal black the moment the panel was read -
  // which is any time any other control was touched.
  check('settings: the theme-following colour swatch shows the accent rather than black',
    await page.locator('#setting-quoteBorderColor').inputValue() !== '#000000',
    await page.locator('#setting-quoteBorderColor').inputValue());
  check('settings: touching an unrelated control leaves the theme-following colour alone',
    !changedKeys.includes('quoteBorderColor'), changedKeys.join(', '));
  check('settings: the rail marks the section holding the change',
    await page.locator('#glp-settings-nav .glp-nav-item.glp-nav-changed').count() >= 1);
  check('settings: that section offers its own reset',
    await page.locator('.glp-settings-section:has(.glp-setting-changed) [data-reset-section]:visible').count() >= 1);

  await page.locator('#glp-only-changed').click();
  await page.waitForTimeout(350);
  const visibleRows = await page.locator('#glp-enhanced-settings .glp-setting-item:visible').count();
  check('settings: the only-changed filter hides everything unchanged',
    visibleRows > 0 && visibleRows === changedAfter, `${visibleRows} rows visible, ${changedAfter} changed`);
  check('settings: the status line reports the filtered count',
    /\d/.test(await page.locator('#glp-settings-status').innerText()),
    await page.locator('#glp-settings-status').innerText());

  // A search that matches nothing must say so rather than showing a blank panel.
  await page.locator('#glp-settings-search').fill('zzzznotasetting');
  await page.waitForTimeout(350);
  check('settings: a search matching nothing shows the empty state',
    await page.locator('#glp-settings-empty:visible').count() === 1);
  await page.locator('#glp-settings-empty-reset').click();
  await page.waitForTimeout(350);
  check('settings: clearing the filters brings every control back',
    await page.locator('#glp-enhanced-settings .glp-setting-item:visible').count() > changedAfter,
    `${await page.locator('#glp-enhanced-settings .glp-setting-item:visible').count()} rows`);

  // Put it back so later sections see the defaults they expect.
  await page.locator('#setting-inlinePostNumbers').click();
  await page.waitForTimeout(300);
  await page.locator('#glp-enhanced-close-btn').click();
  await page.waitForTimeout(300);

  // ---------------- Theme sweep ----------------
  // `npm run shots` renders every surface in every theme, but nothing ever looked at the result,
  // so five surfaces sat on hardcoded blues through all ten themes without anything noticing.
  // This is the assertion that sweep was missing: paint each surface under two deliberately
  // opposite palettes and require it to actually move. A hardcoded colour reads the same twice.
  //
  // These are stylesheet probes rather than opened features - the question is whether the rules
  // that dress a surface are themed, and each feature's own open/close behaviour is asserted
  // elsewhere. A probe still fails honestly: hardcode a background and both readings match.
  const THEME_PROBES = [
    { name: 'toast', markup: ['glp-toast'] },
    { name: 'quick search panel', id: 'glp-quick-search' },
    { name: 'tag picker', id: 'glp-tag-picker' },
    { name: 'watch digest', id: 'glp-watch-digest' },
    // The scrim itself stays theme-neutral on purpose: nothing should tint a full-screen image
    // backdrop. Its controls are the part that has to belong to the theme.
    { name: 'lightbox control', id: 'glp-lightbox', child: 'button', childClass: 'glp-gallery-nav' },
    { name: 'thread toolbar button', id: 'glp-thread-tools-bar', child: 'button' }
  ];

  const readProbes = probes => page.evaluate(specs => {
    // color-mix() resolves to `color(srgb 0.18 0.18 0.22)` - 0-1 floats, not 0-255 - and reading
    // those as 8-bit channels makes a themed panel look both unthemed and nearly black.
    const parse = value => {
      const parts = (value.match(/[\d.]+/g) || []).map(Number);
      if (parts.length < 3) return null;
      const scale = /^color\(/.test(value.trim()) ? 255 : 1;
      return {
        r: parts[0] * scale,
        g: parts[1] * scale,
        b: parts[2] * scale,
        a: parts.length > 3 ? parts[3] : 1
      };
    };
    const pageBg = parse(getComputedStyle(document.body).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 };
    return specs.map(spec => {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-9999px;top:0';
      (spec.markup || []).forEach(cls => host.classList.add(cls));
      // Id-keyed rules only apply to the id, so borrow it from the real surface while measuring.
      const real = spec.id ? document.getElementById(spec.id) : null;
      if (real) real.removeAttribute('id');
      if (spec.id) host.id = spec.id;
      let target = host;
      if (spec.child) {
        target = document.createElement(spec.child);
        if (spec.childClass) target.className = spec.childClass;
        host.appendChild(target);
      }
      document.body.appendChild(host);
      const style = getComputedStyle(target);
      const reading = {
        name: spec.name,
        bg: parse(style.backgroundColor),
        border: parse(style.borderTopColor) || parse(style.borderLeftColor),
        text: parse(style.color),
        pageBg
      };
      host.remove();
      if (real && spec.id) real.id = spec.id;
      return reading;
    });
  }, probes);

  const setTheme = async theme => {
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { colorTheme: theme } });
    await page.waitForTimeout(450);
  };

  await setTheme('midnight');
  const midnightProbes = await readProbes(THEME_PROBES);
  await setTheme('alien');
  const alienProbes = await readProbes(THEME_PROBES);

  const distance = (one, two) => (one && two)
    ? Math.abs(one.r - two.r) + Math.abs(one.g - two.g) + Math.abs(one.b - two.b)
    : -1;

  THEME_PROBES.forEach((probe, index) => {
    const before = midnightProbes[index];
    const after = alienProbes[index];
    const moved = Math.max(distance(before?.bg, after?.bg), distance(before?.border, after?.border));
    check(`theme: the ${probe.name} repaints between opposite palettes`, moved >= 24,
      `channel distance ${moved} — midnight ${JSON.stringify(before?.bg)}/${JSON.stringify(before?.border)}`
      + ` vs alien ${JSON.stringify(after?.bg)}/${JSON.stringify(after?.border)}`);
  });

  // Contrast on the same readings. A surface that themes itself into unreadable text is not a
  // themed surface. Composited over the page background, so a translucent panel is judged on
  // what the reader actually sees rather than on a colour nothing ever paints.
  const contrastRatio = reading => {
    if (!reading?.text || !reading?.bg) return 0;
    const channel = value => {
      const ratio = value / 255;
      return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
    };
    const luminance = colour => 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1
    });
    const opaquePage = over(reading.pageBg, { r: 0, g: 0, b: 0, a: 1 });
    const backdrop = over(reading.bg, opaquePage);
    const foreground = over(reading.text, backdrop);
    const lighter = Math.max(luminance(foreground), luminance(backdrop));
    const darker = Math.min(luminance(foreground), luminance(backdrop));
    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  };

  alienProbes.forEach(reading => {
    check(`theme: ${reading.name} text clears 4.5:1 on the Alien palette`,
      contrastRatio(reading) >= 4.5, `${contrastRatio(reading)}:1`);
  });
  midnightProbes.forEach(reading => {
    check(`theme: ${reading.name} text clears 4.5:1 on the Midnight palette`,
      contrastRatio(reading) >= 4.5, `${contrastRatio(reading)}:1`);
  });

  await setTheme('midnight');

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

  const exported = await captureDownload(page,
    () => sendMessage(worker, page, { type: 'glp:context-action', action: 'export-thread' }));
  check('context: the export action downloads the thread', /\.md$/.test(exported?.suggestedFilename() ?? ''),
    exported ? exported.suggestedFilename() : 'no download event');

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
  // waitFor rather than a fixed sleep. A 350ms budget is fine on an idle machine and is not on a
  // loaded one, and these three checks were the suite's flakiest as a result. The deadline still
  // fails an assertion that never settles, so a real regression is caught either way.
  const settles = (selector, expected) =>
    waitFor(() => page.locator(selector).count(), value => value === expected, 6000);

  for (const toggle of TOGGLES) {
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { [toggle.key]: false } });
    check(`apply: the ${toggle.label} goes away when switched off`,
      await settles(toggle.selector, 0) === 0);

    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { [toggle.key]: true } });
    check(`apply: the ${toggle.label} appears without a reload`,
      await settles(toggle.selector, 1) === 1);

    // A second apply must not stack a duplicate.
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 15 } });
    await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { fontSize: 14 } });
    const settled = await settles(toggle.selector, 1);
    check(`apply: repeated applies leave exactly one ${toggle.label}`, settled === 1, String(settled));
  }

  // ---------------- Hidden-tab timers ----------------
  // A real second tab is the only honest way to hide the first: document.hidden defined from
  // page.evaluate lives in the main world and the content script would never see it.
  await page.goto(CAPTURES.feed.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { autoRefresh: true, autoRefreshInterval: 600 } });
  await page.waitForTimeout(1500);

  // null, not a numeric sentinel: a sentinel that satisfies the comparison is how the earlier
  // version of this check passed for a bar that had never rendered.
  const barWidth = () => page.locator('#glp-auto-refresh-bar .bar')
    .evaluate(node => {
      const parsed = parseFloat(node.style.width);
      return Number.isFinite(parsed) ? parsed : null;
    }).catch(() => null);
  check('timers: the auto-refresh countdown bar renders with a measurable width',
    Number.isFinite(await barWidth()), String(await barWidth()));

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

  // ---------------- Full backup ingress ----------------
  // This exercises the engine's own file-import path through its parsed-payload boundary. The
  // Options page has a separate document and a separate copy of these guards, tested elsewhere.
  const engineImport = await sendMessage(worker, page, {
    type: 'glp:apply-backup',
    backup: {
      format: 'glp-ultra-backup',
      formatVersion: 3,
      settings: {
        enabled: 'yes', colorTheme: 'not-a-theme', shapeStyle: 'pill',
        quoteBorderColor: 'red; } body { display: none', fontSize: 999,
        lineHeight: -5, autoRefreshInterval: 1, watcherIntervalMinutes: 9999,
        userMuteMatchMode: 'wildcard', userHistoryCap: 999999, mediaHoverPreviewSize: -20
      },
      mutedUsers: ['  Valid Reader  ', '', null, 'Valid Reader'],
      blockedUsers: [{ id: '42', name: 123 }, { id: 'not-numeric', name: 'Bad' }, null],
      hiddenThreads: ['6170474', 'not-a-thread', 6170474],
      hiddenThreadTitles: { 6170474: '  Saved title  ', nope: 'Bad' },
      userTags: {
        'Known Poster': { label: '  Friend  ', note: 42, bg: 'url(https://invalid.example)', fg: '#fff' }
      },
      watchedThreads: [
        { id: '6170474', url: 'https://www.godlikeproductions.com/forum1/message6170474', title: ' Watched ', unread: 2 },
        { id: '5', url: 'javascript:alert(1)', title: 'Bad' }
      ],
      userStats: {
        'Known Poster': { posts: 4, threads: ['6170474', null], first: 1, last: 2 },
        Broken: 'not-an-entry'
      },
      userStatsPages: ['/forum1/message6170474/pg1', 'javascript:alert(1)', null]
    }
  });
  const afterEngineImport = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('backup: the in-page importer validates settings before applying them',
    engineImport?.result?.ok === true
      && afterEngineImport?.settings?.enabled === true
      && afterEngineImport?.settings?.colorTheme === 'midnight'
      && afterEngineImport?.settings?.shapeStyle === 'default'
      && afterEngineImport?.settings?.quoteBorderColor === 'var(--glpx-accent)'
      && afterEngineImport?.settings?.fontSize === 24
      && afterEngineImport?.settings?.lineHeight === 1
      && afterEngineImport?.settings?.autoRefreshInterval === 15
      && afterEngineImport?.settings?.watcherIntervalMinutes === 240
      && afterEngineImport?.settings?.userMuteMatchMode === 'exact'
      && afterEngineImport?.settings?.userHistoryCap === 1000
      && afterEngineImport?.settings?.mediaHoverPreviewSize === 30,
    JSON.stringify(afterEngineImport?.settings));

  const engineStores = await waitFor(
    () => worker.evaluate(async () => chrome.storage.local.get([
      'glpMutedUsers', 'glpBlockedUsers', 'glpHiddenThreads', 'glpHiddenThreadTitles',
      'glpUserTags', 'glpWatchedThreads', 'glpUserStats', 'glpUserStatsPages'
    ])),
    stored => {
      try {
        return JSON.parse(stored.glpUserStatsPages || '[]').length === 1;
      } catch (error) {
        return false;
      }
    });
  const engineMuted = JSON.parse(engineStores.glpMutedUsers || '[]');
  const engineBlocked = JSON.parse(engineStores.glpBlockedUsers || '[]');
  const engineHidden = JSON.parse(engineStores.glpHiddenThreads || '[]');
  const engineTitles = JSON.parse(engineStores.glpHiddenThreadTitles || '{}');
  const engineTags = JSON.parse(engineStores.glpUserTags || '{}');
  const engineWatched = JSON.parse(engineStores.glpWatchedThreads || '[]');
  const engineStats = JSON.parse(engineStores.glpUserStats || '{}');
  const engineStatsPages = JSON.parse(engineStores.glpUserStatsPages || '[]');
  check('backup: the in-page importer drops malformed and duplicate local data',
    JSON.stringify(engineMuted) === JSON.stringify(['Valid Reader'])
      && engineBlocked.length === 1 && engineBlocked[0].id === '42'
      && JSON.stringify(engineHidden) === JSON.stringify(['6170474'])
      && Object.keys(engineTitles).length === 1 && engineTitles['6170474'] === 'Saved title'
      && engineTags['Known Poster']?.label === 'Friend'
      && engineTags['Known Poster']?.bg !== 'url(https://invalid.example)'
      && engineWatched.length === 1 && engineWatched[0].id === '6170474'
      && Object.keys(engineStats).length === 1
      && JSON.stringify(engineStatsPages) === JSON.stringify(['/forum1/message6170474/pg1']),
    JSON.stringify({ engineMuted, engineBlocked, engineHidden, engineTitles, engineTags, engineWatched, engineStats, engineStatsPages }));

  // ---------------- Storage quota ----------------
  // The engine parses on read and falls back to defaults on a throw, so a swallowed
  // QuotaExceededError is indistinguishable from "nothing was ever saved". Fill the origin,
  // then prove the write fails loudly and the running config survives it.
  // Fill in shrinking blocks. Stopping at the first 256 KB failure leaves up to 256 KB free,
  // which is enough for a small key to still be created - and a boot-path write that succeeds
  // proves nothing.
  const filled = await page.evaluate(() => {
    let written = 0;
    let threw = null;
    for (const size of [256 * 1024, 16 * 1024, 1024, 64]) {
      const blob = 'x'.repeat(size);
      for (let i = 0; i < 400; i += 1) {
        try {
          window.localStorage.setItem(`glp-quota-ballast-${size}-${i}`, blob);
          written += 1;
        } catch (error) {
          threw = error.name || String(error);
          break;
        }
      }
    }
    // Nothing at all must fit now, or "the origin is full" is not true.
    let tinyFits = true;
    try {
      window.localStorage.setItem('glp-quota-ballast-probe', 'y');
      window.localStorage.removeItem('glp-quota-ballast-probe');
    } catch (error) {
      tinyFits = false;
    }
    return { written, threw, tinyFits };
  });
  check('quota: the test can actually push the origin past its limit',
    !!filled.threw, JSON.stringify(filled));

  // Replacing a key with a same-sized value needs no new space, so the write has to actually
  // grow the settings blob past the headroom the ballast leaves behind. customCSS is capped at
  // 20,000 characters, which is ~40 KB of UTF-16 and far more than the few bytes of slack left.
  const CSS_CAP = 20000;
  const OVERSIZE_CSS = `/*${'q'.repeat(400 * 1024)}*/`;
  const patchUnderQuota = await sendMessage(worker, page, {
    type: 'glp:patch-settings',
    patch: { customCSS: OVERSIZE_CSS }
  });
  // The in-page panel is the surface a reader actually types into, and it used to assign
  // input.value straight onto settings and save. The maxlength attribute stops typing, not a
  // programmatic set, so the ceiling was a DOM constraint rather than a code one. Set the value
  // the way script does and confirm the save path clamps it.
  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(400);
  const panelClamp = await page.evaluate(() => {
    const field = document.getElementById('setting-customCSS');
    if (!field) return { error: 'no customCSS control in the panel' };
    const attribute = field.getAttribute('maxlength');
    field.value = `/*${'z'.repeat(60000)}*/`;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    const typed = field.value.length;
    document.getElementById('glp-save-btn')?.click();
    return { attribute, typed, error: null };
  });
  await page.waitForTimeout(600);
  const afterPanelSave = await sendMessage(worker, page, { type: 'glp:get-state' });
  check('settings: the panel clamps an oversized value it was handed programmatically',
    panelClamp.error === null
      && panelClamp.attribute === '20000'
      && afterPanelSave?.settings?.customCSS?.length === 20000,
    JSON.stringify({ ...panelClamp, saved: afterPanelSave?.settings?.customCSS?.length }));
  await sendMessage(worker, page, { type: 'glp:patch-settings', patch: { customCSS: '' } });
  await page.waitForTimeout(200);

  check('settings: an oversized customCSS is truncated to its declared ceiling, not rejected',
    patchUnderQuota?.settings?.customCSS?.length === CSS_CAP,
    String(patchUnderQuota?.settings?.customCSS?.length));
  const quotaDiag = await workerDiagnostics(worker, page);
  const quotaFailures = quotaDiag?.storageFailures || [];
  const settingsFailure = quotaFailures.find(entry => entry.key === 'glpEnhancedSettings');

  check('quota: a full origin is recorded as a named storage failure',
    !!settingsFailure && settingsFailure.quota === true && settingsFailure.label === 'settings',
    JSON.stringify(quotaFailures.map(entry => ({ key: entry.key, quota: entry.quota }))));
  check('quota: the failure names the store in a visible toast',
    await page.locator('.glp-toast-error', { hasText: 'settings' }).count() > 0,
    await page.locator('.glp-toast').allInnerTexts().then(texts => JSON.stringify(texts)));
  check('quota: the engine keeps the change in memory instead of resetting',
    patchUnderQuota?.ok === true
      && patchUnderQuota?.settings?.customCSS?.length === CSS_CAP
      && (quotaDiag?.enabledFeatures || []).length > 0,
    JSON.stringify({
      ok: patchUnderQuota?.ok,
      cssLength: patchUnderQuota?.settings?.customCSS?.length,
      features: (quotaDiag?.enabledFeatures || []).length
    }));

  // The boot path is the dangerous one. loadSettings() stamps the schema version and the version
  // marker before injectEarlyCSS runs, so an uncaught throw there aborts init() outright and the
  // page comes up with no engine at all - a far worse outcome than losing one store. Exhausting
  // the origin after load, as the checks above do, never reaches it.
  // Drop the engine's own keys first so the boot path has to CREATE them rather than replace
  // same-sized values. Replacing an existing key needs no new space, so without this the boot
  // writes never touch the quota and the check cannot fail. Refill whatever the deletions freed.
  await page.evaluate(() => {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('glpEnhanced.mv3.'))
      .forEach(key => window.localStorage.removeItem(key));
    for (const size of [16 * 1024, 1024, 64]) {
      const blob = 'x'.repeat(size);
      for (let i = 0; i < 400; i += 1) {
        try {
          window.localStorage.setItem(`glp-quota-refill-${size}-${i}`, blob);
        } catch (error) {
          break;
        }
      }
    }
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const bootedFull = await page.evaluate(() => ({
    active: document.body.classList.contains('glp-enhanced-active'),
    styled: !!document.getElementById('glp-enhanced-styles'),
    ballast: Object.keys(window.localStorage).filter(key => key.startsWith('glp-quota-')).length
  }));
  // Honest scope: this proves the engine boots with the origin at its limit and its own keys
  // gone. It does NOT prove every boot-time write is guarded - the schema and version stamps are
  // a few bytes each and there is always slack enough for them, so they cannot be made to throw
  // from here. That invariant is held statically instead, by the single-call-site check in
  // scripts/verify-lifecycle.mjs.
  check('quota: a first run on a full origin still starts the engine',
    bootedFull.active && bootedFull.styled && bootedFull.ballast > 0, JSON.stringify(bootedFull));

  await page.evaluate(() => {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('glp-quota-'))
      .forEach(key => window.localStorage.removeItem(key));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const recovered = await sendMessage(worker, page, {
    type: 'glp:patch-settings',
    patch: { customCSS: '.recovered { color: red; }' }
  });
  const recoveredStored = await page.evaluate(() => {
    try {
      return JSON.parse(window.localStorage.getItem('glpEnhanced.mv3.glpEnhancedSettings') || '{}').customCSS;
    } catch (error) {
      return `parse failed: ${error.message}`;
    }
  });
  check('quota: writes resume once the origin has room again',
    recovered?.ok === true && recoveredStored === '.recovered { color: red; }',
    JSON.stringify({ ok: recovered?.ok, stored: String(recoveredStored).slice(0, 60) }));

  // ---------------- Toolbar badge across a worker restart ----------------
  // MV3 kills the worker after 30s idle. Anything the badge needs has to outlive that, so the
  // unread counts live in chrome.storage.session rather than a module-scope Map.
  const glpTabId = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    return tabs.length ? tabs[tabs.length - 1].id : null;
  });
  check('badge: a GLP tab is available to paint', typeof glpTabId === 'number', String(glpTabId));

  const paintedBefore = await worker.evaluate(async tabId => {
    await setWatchCount(tabId, 7);
    await paintBadge(tabId, true);
    return chrome.action.getBadgeText({ tabId });
  }, glpTabId);
  check('badge: a reported unread count reaches the toolbar', paintedBefore === '7', paintedBefore);

  // What actually has to be true for the badge to survive the 30s idle kill is that the count
  // lives in chrome.storage.session rather than in worker module state. Assert that directly:
  // read the raw storage area, not the accessor, so a module-scope Map cannot satisfy it.
  // (Stopping the worker through CDP `ServiceWorker.stopAllWorkers` was tried first and hangs
  // the run - the harness never gets a replacement worker back.)
  const survived = await worker.evaluate(async tabId => {
    const raw = await chrome.storage.session.get('glpWatchCounts');
    return {
      persisted: raw?.glpWatchCounts?.[tabId] ?? null,
      viaAccessor: (await readWatchCounts())[tabId] ?? null
    };
  }, glpTabId);
  check('badge: the unread count is held in chrome.storage.session, not worker module state',
    survived.persisted === 7 && survived.viaAccessor === 7, JSON.stringify(survived));

  const revived = worker;

  // GU-003: `tab.url` is absent off-origin because the extension holds no host permission there,
  // so the handler has to read that absence as "not GLP" rather than skipping the paint.
  const offGlpTab = await revived.evaluate(async () => {
    const tab = await chrome.tabs.create({ url: 'about:blank' });
    await new Promise(resolve => setTimeout(resolve, 400));
    const seen = await chrome.tabs.get(tab.id);
    return { id: tab.id, url: seen.url ?? null, hasUrl: Object.prototype.hasOwnProperty.call(seen, 'url') };
  });
  check('badge: an off-GLP tab really does hide its URL from this extension',
    offGlpTab.url === null || offGlpTab.url === '' || offGlpTab.url === undefined,
    JSON.stringify(offGlpTab));

  const clearedAfterNavigation = await revived.evaluate(async ({ tabId, blankId }) => {
    await setWatchCount(tabId, 4);
    await paintBadge(tabId, true);
    const before = await chrome.action.getBadgeText({ tabId });
    await chrome.tabs.update(tabId, { url: 'about:blank' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const after = await chrome.action.getBadgeText({ tabId });
    const counts = await readWatchCounts();
    await chrome.tabs.remove(blankId).catch(() => {});
    return { before, after, stillCounted: counts[tabId] ?? null };
  }, { tabId: glpTabId, blankId: offGlpTab.id });
  check('badge: navigating away from GLP clears the stale unread count',
    clearedAfterNavigation.before === '4'
      && clearedAfterNavigation.after === ''
      && clearedAfterNavigation.stillCounted === null,
    JSON.stringify(clearedAfterNavigation));

  // ---------------- Surface ownership ----------------
  // Re-entry guards used to ask getElementById whether an id existed, which answers "is there
  // something called this" rather than "did we build it". A forum post carrying our id therefore
  // stopped the feature mounting, and teardown deleted the post's element instead of ours.
  const hostilePage = await context.newPage();
  await hostilePage.goto(HOSTILE_ID_URL, { waitUntil: 'domcontentloaded' });
  await hostilePage.waitForTimeout(2000);

  // Earlier blocks in this run leave settings wherever they left them, so state both features
  // explicitly rather than depending on a default surviving 240 checks.
  const hostileTabIdEarly = await worker.evaluate(async url => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    const match = tabs.find(tab => tab.url === url);
    return match ? match.id : null;
  }, HOSTILE_ID_URL);
  await worker.evaluate(tabId => chrome.tabs.sendMessage(tabId, {
    type: 'glp:patch-settings',
    patch: { backToTopButton: true, scrollProgress: true }
  }), hostileTabIdEarly);
  await hostilePage.waitForTimeout(800);

  const hostileState = await hostilePage.evaluate(() => {
    const describe = id => {
      const all = [...document.querySelectorAll(`#${id}`)];
      return {
        total: all.length,
        planted: all.filter(node => node.dataset.planted === 'yes').length,
        owned: all.filter(node => node.hasAttribute('data-glpx-owner')).length
      };
    };
    return { backToTop: describe('glp-back-to-top'), scrollProgress: describe('glp-scroll-progress') };
  });
  check('ownership: a planted id does not stop the feature building its own surface',
    hostileState.backToTop.owned === 1 && hostileState.backToTop.planted === 1
      && hostileState.scrollProgress.owned === 1 && hostileState.scrollProgress.planted === 1,
    JSON.stringify(hostileState));

  // Now tear both features down and confirm only our own surfaces go.
  await hostilePage.evaluate(() => {
    document.dispatchEvent(new CustomEvent('glp-test-noop'));
  });
  const hostileTabId = await worker.evaluate(async url => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    const match = tabs.find(tab => tab.url === url);
    return match ? match.id : null;
  }, HOSTILE_ID_URL);
  await worker.evaluate(tabId => chrome.tabs.sendMessage(tabId, {
    type: 'glp:patch-settings',
    patch: { backToTopButton: false, scrollProgress: false }
  }), hostileTabId);
  await hostilePage.waitForTimeout(800);

  const afterTeardown = await hostilePage.evaluate(() => {
    const describe = id => {
      const all = [...document.querySelectorAll(`#${id}`)];
      return {
        total: all.length,
        planted: all.filter(node => node.dataset.planted === 'yes').length,
        owned: all.filter(node => node.hasAttribute('data-glpx-owner')).length
      };
    };
    return { backToTop: describe('glp-back-to-top'), scrollProgress: describe('glp-scroll-progress') };
  });
  check('ownership: teardown removes only the surface we created',
    afterTeardown.backToTop.owned === 0 && afterTeardown.backToTop.planted === 1
      && afterTeardown.scrollProgress.owned === 0 && afterTeardown.scrollProgress.planted === 1,
    JSON.stringify(afterTeardown));

  await hostilePage.close();

  // ---------------- Forced colors ----------------
  // Windows High Contrast and its equivalents discard box-shadow and every non-URL
  // background-image, so anything this script signalled with a shadow or a tint disappears. A
  // dedicated page rather than the shared one: the badge block above navigates the main tab away.
  const forcedPage = await context.newPage();
  await forcedPage.goto('https://www.godlikeproductions.com/forum1/message6170474/pg5',
    { waitUntil: 'domcontentloaded' });
  await forcedPage.waitForTimeout(2000);

  // The ownership block above deliberately leaves scrollProgress off, and 240 earlier checks move
  // other settings around, so state what this page needs rather than inheriting whatever is left.
  const forcedTabId = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    const match = tabs.find(tab => tab.url.endsWith('/pg5'));
    return match ? match.id : null;
  });
  await worker.evaluate(tabId => chrome.tabs.sendMessage(tabId, {
    type: 'glp:patch-settings',
    patch: { scrollProgress: true, backToTopButton: true }
  }), forcedTabId);
  await forcedPage.waitForTimeout(800);

  const SAMPLED_CONTROLS = ['.glp-toolbar-btn', '.glp-mute-btn', '.glp-post-number', '.glp-quote-jump'];
  const readBorders = () => forcedPage.evaluate(selectors => {
    const out = { matches: window.matchMedia('(forced-colors: active)').matches, controls: {} };
    selectors.forEach(selector => {
      const node = document.querySelector(selector);
      if (!node) { out.controls[selector] = null; return; }
      const style = getComputedStyle(node);
      out.controls[selector] = {
        width: parseFloat(style.borderTopWidth) || 0,
        style: style.borderTopStyle
      };
    });
    return out;
  }, SAMPLED_CONTROLS);

  const beforeForced = await readBorders();
  check('forced-colors: the sampled controls are actually present to measure',
    SAMPLED_CONTROLS.every(selector => beforeForced.controls[selector] !== null),
    JSON.stringify(beforeForced.controls));

  await forcedPage.emulateMedia({ forcedColors: 'active' });
  await forcedPage.waitForTimeout(300);
  const afterForced = await readBorders();


  // Positive control: without this the border assertions below would pass in ordinary colours,
  // proving nothing about forced-colors mode at all.
  check('forced-colors: emulation actually puts the page in forced-colors mode',
    beforeForced.matches === false && afterForced.matches === true,
    JSON.stringify({ before: beforeForced.matches, after: afterForced.matches }));

  // Measured 2026-09-05: all four already carry a 1px border outside forced colours, so this is a
  // regression guard on that, not evidence the forced-colors layer works. The two checks below
  // are the ones that fail when the layer is removed.
  check('forced-colors: every sampled control keeps a visible border',
    SAMPLED_CONTROLS.every(selector => {
      const entry = afterForced.controls[selector];
      return entry && entry.width > 0 && entry.style !== 'none';
    }),
    JSON.stringify(afterForced.controls));

  const forcedPanel = await forcedPage.evaluate(async () => {
    const style = getComputedStyle(document.documentElement);
    const sheet = document.getElementById('glp-enhanced-styles');
    return {
      hasRule: !!sheet && sheet.textContent.includes('forced-colors: active'),
      scrollBar: (() => {
        const bar = document.querySelector('#glp-scroll-progress');
        if (!bar) return null;
        return parseFloat(getComputedStyle(bar).borderBottomWidth) || 0;
      })(),
      root: style.colorScheme
    };
  });
  check('forced-colors: the injected stylesheet carries the forced-colors layer',
    forcedPanel.hasRule === true, JSON.stringify(forcedPanel));
  check('forced-colors: the scroll progress track keeps an edge when its fill colour is taken away',
    forcedPanel.scrollBar !== null && forcedPanel.scrollBar > 0, JSON.stringify(forcedPanel));

  await forcedPage.emulateMedia({ forcedColors: 'none' });
  await forcedPage.close();

  // ---------------- Read position ----------------
  // The thread used here is never watched, which is the half that previously recorded nothing at
  // all: lastSeenPost only ever existed on the 25 watched entries.
  const READ_THREAD_ID = '6170474';
  const READ_POSITION_KEY = 'glpEnhanced.mv3.glpReadPositions';
  const readPage = await context.newPage();

  // Part one: scrolling records a position. pagehide fires on the reload, which is the real path.
  await readPage.goto('https://www.godlikeproductions.com/forum1/message6170474/pg6',
    { waitUntil: 'domcontentloaded' });
  await readPage.waitForTimeout(1800);
  await readPage.evaluate(() => window.localStorage.removeItem('glpEnhanced.mv3.glpReadPositions'));
  await readPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await readPage.waitForTimeout(600);
  await readPage.reload({ waitUntil: 'domcontentloaded' });
  await readPage.waitForTimeout(1500);

  const recorded = await readPage.evaluate(key => {
    try {
      return JSON.parse(window.localStorage.getItem(key) || '{}');
    } catch (error) {
      return { error: String(error) };
    }
  }, READ_POSITION_KEY);
  check('read position: scrolling an unwatched thread records how far you got',
    Number(recorded[READ_THREAD_ID]) > 0, JSON.stringify(recorded));

  // Part two: a known position marks exactly the posts after it. Set it directly so the assertion
  // does not depend on how tall the capture happens to render.
  //
  // Two things make this fiddlier than it looks, and both were seen failing here first.
  // gm-shim treats chrome.storage.local as authoritative at document_start and pushes it back over
  // the page copy, so planting into page localStorage is undone by the next load - hence the
  // worker-side write. And reloading the page fires pagehide, which is exactly when this feature
  // persists how far the reader got, so a reload races the plant and sometimes overwrites it with
  // the previous view's position. A brand new page has no previous view to persist.
  //
  // The watched list is cleared in the same breath: an earlier block watches this thread, which
  // sets lastSeenPost to the last post on the page, and readPositionFor deliberately answers with
  // whichever position is furthest along. Unwatched is also the case this item is about.
  await readPage.close();
  const plantState = async positions => {
    await worker.evaluate(async payload => {
      await chrome.storage.local.set({
        glpReadPositions: JSON.stringify(payload),
        glpWatchedThreads: JSON.stringify([])
      });
    }, positions);
  };

  await plantState({ [READ_THREAD_ID]: 2 });
  const markedPage = await context.newPage();
  await markedPage.goto('https://www.godlikeproductions.com/forum1/message6170474/pg6',
    { waitUntil: 'domcontentloaded' });
  await markedPage.waitForTimeout(2200);

  // Expectation comes from the page, not from arithmetic on the row count: GLP reuses a post id
  // across several rows of the same post, so there are 14 matching rows over 6 distinct ordinals
  // and "total minus two" is not the number of posts after position 2.
  const marked = await markedPage.evaluate(baseline => {
    const rows = [...document.querySelectorAll('.msg tr[id^="post_"]')];
    const ordinal = row => parseInt(String(row.id).replace('post_', ''), 10) || 0;
    const shouldBeNew = rows.filter(row => ordinal(row) > baseline);
    const areNew = rows.filter(row => row.classList.contains('glp-new-post'));
    return {
      total: rows.length,
      expected: shouldBeNew.length,
      actual: areNew.length,
      missed: shouldBeNew.filter(row => !row.classList.contains('glp-new-post')).map(row => row.id),
      overreached: areNew.filter(row => ordinal(row) <= baseline).map(row => row.id),
      firstNew: rows.filter(row => row.classList.contains('glp-first-new-post')).map(ordinal),
      jumpButton: document.querySelectorAll('[data-glp-thread-tool="first-new"]').length
    };
  }, 2);
  check('read position: every post after the recorded one is marked new, and no earlier one is',
    marked.expected > 0
      && marked.actual === marked.expected
      && marked.missed.length === 0
      && marked.overreached.length === 0,
    JSON.stringify(marked));
  check('read position: the first new post is singled out and offers a jump',
    marked.firstNew.length === 1 && marked.firstNew[0] === 3 && marked.jumpButton === 1,
    JSON.stringify({ firstNew: marked.firstNew, jumpButton: marked.jumpButton }));
  await markedPage.close();

  // A fresh reader has no position, so nothing should be shouting at them.
  await plantState({});
  const freshPage = await context.newPage();
  await freshPage.goto('https://www.godlikeproductions.com/forum1/message6170474/pg6',
    { waitUntil: 'domcontentloaded' });
  await freshPage.waitForTimeout(2000);
  const firstVisit = await freshPage.evaluate(() => ({
    newRows: document.querySelectorAll('.glp-new-post').length,
    jumpButton: document.querySelectorAll('[data-glp-thread-tool="first-new"]').length
  }));
  check('read position: a thread you have never opened marks nothing new',
    firstVisit.newRows === 0 && firstVisit.jumpButton === 0, JSON.stringify(firstVisit));

  const readBackup = (await sendMessage(worker, freshPage, { type: 'glp:build-backup' }))?.backup;
  check('read position: the store travels in a format-3 backup',
    readBackup?.formatVersion === 3 && !!readBackup && typeof readBackup.readPositions === 'object',
    JSON.stringify({ formatVersion: readBackup?.formatVersion, hasReadPositions: !!readBackup?.readPositions }));

  await freshPage.close();


} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

/**
 * Runs `trigger` and returns the download it caused, or null if none arrived.
 *
 * A bare `page.waitForEvent('download')` throws on timeout, and an uncaught throw here does not
 * fail one check - it aborts the process and takes every later check's evidence with it. Two
 * runs died that way at different export buttons, reporting nothing about the ~40 checks that
 * never ran. Returning null instead turns a slow export into one honest failure.
 */
async function captureDownload(page, trigger, timeout = 30000) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout }).catch(() => null),
    Promise.resolve().then(trigger).catch(() => null)
  ]);
  return download;
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Polls `read` until `ready` accepts its result, then returns it; returns the last result if the
 * deadline passes. Lets a check assert on a settled state without paying a fixed sleep for it,
 * and without turning machine load into a random failure.
 */
async function waitFor(read, ready, timeout = 8000, interval = 200) {
  const deadline = Date.now() + timeout;
  let last = await read();
  while (!ready(last) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, interval));
    last = await read();
  }
  return last;
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
