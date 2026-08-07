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
  await context.route('**/*', async route => {
    const url = route.request().url();
    for (const [key, capture] of Object.entries(CAPTURES)) {
      if (url === capture.url || url === `${capture.url}/`) {
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html[key] });
        return;
      }
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

  await sendMessage(worker, page, { type: 'glp:open-settings' });
  await page.waitForTimeout(400);
  check('feed: settings panel opens from the extension shell', await page.locator('#glp-enhanced-settings').count() === 1);
  check('feed: export section present in panel',
    await page.locator('#glp-enhanced-settings [data-search*="Export"]').count() > 0);
  await page.locator('#glp-enhanced-close-btn').click();

  // ---------------- Thread route ----------------
  await page.goto(CAPTURES.thread.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  check('thread: post numbers rendered', await page.locator('.glp-post-number').count() > 0);
  check('thread: mute buttons rendered', await page.locator('.glp-mute-btn').count() > 0);
  check('thread: block buttons rendered', await page.locator('.glp-block-btn').count() > 0);
  check('thread: quote depth badges rendered', await page.locator('.glp-quote-depth').count() > 0);
  check('thread: tools bar rendered', await page.locator('#glp-thread-tools-bar').count() === 1);
  check('thread: OP navigation rendered', await page.locator('.glp-op-nav').count() > 0);

  const threadDiag = await workerDiagnostics(worker, page);
  check('thread: route classified as thread', threadDiag?.route === 'thread', JSON.stringify(threadDiag));
  check('thread: no feature errors', (threadDiag?.errors || []).length === 0, JSON.stringify(threadDiag?.errors));

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
