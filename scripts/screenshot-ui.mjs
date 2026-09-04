/**
 * Captures every GLP Ultra surface in every theme, into dist/ui-shots/ (gitignored).
 *
 * Polish passes fail by only ever looking at one screen in one theme. This exists so that is
 * not possible: it drives the real unpacked extension against the real captures, opens each
 * surface, and writes one PNG per surface per theme.
 *
 *   node scripts/screenshot-ui.mjs                 # every theme
 *   node scripts/screenshot-ui.mjs midnight alien  # just these
 */
import { readFile, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();
const extensionPath = path.join(root, 'extension');

const ALL_THEMES = ['midnight', 'catppuccin', 'dracula', 'nord', 'gruvbox', 'amoled', 'solarized', 'blood', 'alien', 'highcontrast'];
const args = process.argv.slice(2);
const captureSettingsPages = args.includes('--settings-pages');
const viewportMatch = args.find(arg => arg.startsWith('--viewport='))?.match(/^(?:--viewport=)(\d+)x(\d+)$/i);
const viewport = viewportMatch
  ? { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) }
  : { width: 1440, height: 900 };
const viewportSuffix = viewport.width === 1440 && viewport.height === 900 ? '' : `-${viewport.width}x${viewport.height}`;
const outDir = path.join(root, 'dist', `ui-shots${viewportSuffix}`);
const pageOutDir = path.join(root, 'dist', `ui-pages${viewportSuffix}`);
const requestedThemes = args.filter(arg => !arg.startsWith('--'));
const themes = requestedThemes.length ? requestedThemes : ALL_THEMES;

const CAPTURES = {
  feed: { file: 'captures/forum-feed.mhtml', url: 'https://www.godlikeproductions.com/forum1/pg1' },
  thread: { file: 'captures/thread-message.mhtml', url: 'https://www.godlikeproductions.com/forum1/message6170474/pg1' }
};

const decode = text => text.replace(/=\r?\n/g, '').replace(/=([A-Fa-f0-9]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
function extractHtml(mhtml) {
  const header = /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n/i.exec(mhtml);
  const rest = mhtml.slice(header.index + header[0].length);
  const boundary = /\r?\n------/.exec(rest);
  return decode(boundary ? rest.slice(0, boundary.index) : rest);
}
const withoutPage = url => url.replace(/\/$/, '').replace(/\/pg\d+$/, '');

async function send(worker, message) {
  return worker.evaluate(async msg => {
    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    if (!tabs.length) return null;
    try {
      return await chrome.tabs.sendMessage(tabs[tabs.length - 1].id, msg);
    } catch (error) {
      return null;
    }
  }, message);
}

const userDataDir = await mkdtemp(path.join(tmpdir(), 'glp-shots-'));
await mkdir(outDir, { recursive: true });
if (captureSettingsPages) await mkdir(pageOutDir, { recursive: true });
let context;
let shots = 0;

try {
  const html = {};
  for (const [key, capture] of Object.entries(CAPTURES)) {
    html[key] = extractHtml(await readFile(path.join(root, capture.file), 'latin1'));
  }

  context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    viewport,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });

  await context.route('**/*', async route => {
    // The extension's own pages load their CSS and JS through this router too; aborting those
    // renders the options page as unstyled HTML with no sections.
    if (!route.request().url().startsWith('http')) return route.continue();
    const target = withoutPage(route.request().url());
    const key = Object.keys(CAPTURES).find(k => withoutPage(CAPTURES[k].url) === target);
    if (key) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html[key] });
    if (route.request().resourceType() === 'document' && route.request().url().includes('godlikeproductions.com')) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<html><body></body></html>' });
    }
    return route.abort();
  });

  const page = await context.newPage();
  const shoot = async (name) => {
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
    shots++;
  };
  const closeOverlays = async () => {
    await page.evaluate(() => {
      document.getElementById('glp-enhanced-overlay')?.remove();
      ['glp-diagnostics', 'glp-recovery', 'glp-noise-panel', 'glp-watch-digest'].forEach(id => document.getElementById(id)?.remove());
    });
  };

  for (const theme of themes) {
    await page.goto(CAPTURES.thread.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1100);
    await send(worker, { type: 'glp:patch-settings', patch: { colorTheme: theme } });
    await page.waitForTimeout(400);

    await shoot(`${theme}-01-thread`);

    await send(worker, { type: 'glp:open-settings' });
    await page.waitForTimeout(400);
    await shoot(`${theme}-02-settings`);

    await send(worker, { type: 'glp:open-diagnostics' });
    await page.waitForTimeout(350);
    await shoot(`${theme}-03-diagnostics`);
    await page.locator('#glp-diagnostics [data-glp-close]').click();

    // Direct shell messages keep narrow captures independent of footer visibility.
    await send(worker, { type: 'glp:open-recovery' });
    await page.waitForTimeout(350);
    await shoot(`${theme}-04-recovery`);
    await closeOverlays();

    await page.locator('#glp-noise-chip').click().catch(() => {});
    await page.waitForTimeout(350);
    await shoot(`${theme}-05-noise`);
    await closeOverlays();

    await page.goto(CAPTURES.feed.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1100);
    await shoot(`${theme}-06-feed`);

    // The extension's own pages are separate documents; they theme from the shared schema.
    const extensionId = new URL(worker.url()).host;
    await page.goto(`chrome-extension://${extensionId}/options/options.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await shoot(`${theme}-07-options`);
    if (captureSettingsPages) {
      const pageCount = await page.locator('#section-nav .nav-item').count();
      for (let index = 0; index < pageCount; index++) {
        const button = page.locator('#section-nav .nav-item').nth(index);
        const title = await button.getAttribute('data-section-title');
        await button.click();
        await page.waitForTimeout(100);
        await page.evaluate(() => {
          document.scrollingElement.scrollTop = 0;
          const content = document.querySelector('.content');
          if (content) content.scrollTop = 0;
        });
        const slug = String(title || `page-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await page.screenshot({ path: path.join(pageOutDir, `${theme}-${String(index + 1).padStart(2, '0')}-${slug}.png`) });
        shots++;
      }
    }
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await shoot(`${theme}-08-popup`);
  }
} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

console.log(`Wrote ${shots} screenshots to ${path.relative(root, outDir)}${captureSettingsPages ? ` and ${path.relative(root, pageOutDir)}` : ''} for: ${themes.join(', ')}`);
