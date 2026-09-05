/**
 * Drives the real MV3 options page and verifies the settings redesign as an operational surface,
 * not just a screenshot. This covers navigation, keyboard search, dependencies, resets with undo,
 * presets, user-data management, exports, and both required desktop widths.
 */
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();
const extensionPath = path.join(root, 'extension');
const schemaText = await readFile(path.join(extensionPath, 'generated', 'settings-schema.js'), 'utf8');
const schema = JSON.parse(schemaText.slice(schemaText.indexOf('{'), schemaText.lastIndexOf('}') + 1));
const userDataDir = await mkdtemp(path.join(tmpdir(), 'glp-options-verify-'));
const results = [];
const pageErrors = [];
let context;

function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label + (detail && !ok ? ' - ' + detail : ''));
}

async function readDownload(download) {
  if (!download) return '';
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function waitFor(read, ready, timeout = 5000, interval = 80) {
  const deadline = Date.now() + timeout;
  let value = await read();
  while (!ready(value) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, interval));
    value = await read();
  }
  return value;
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    viewport: { width: 1440, height: 900 },
    args: ['--disable-extensions-except=' + extensionPath, '--load-extension=' + extensionPath]
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
  check('options: service worker registered', !!worker);

  await worker.evaluate(async payload => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set(payload);
  }, {
    glpEnhancedSettings: JSON.stringify(schema.defaults),
    glpMutedUsers: JSON.stringify(['Alpha Reader', 'Beta Reader']),
    glpBlockedUsers: JSON.stringify([{ id: '42', name: 'Blocked Example' }]),
    glpHiddenThreads: JSON.stringify(['6170474']),
    glpHiddenThreadTitles: JSON.stringify({ 6170474: 'Example hidden thread' }),
    glpUserTags: JSON.stringify({ 'Tagged Example': { label: 'Source', note: 'Local note' } }),
    glpWatchedThreads: JSON.stringify([{ id: '6170474', title: 'Watched example' }]),
    glpUserStats: JSON.stringify({ 'Known Poster': { posts: 4, threads: ['6170474'], first: 1, last: 2 } }),
    glpUserStatsPages: JSON.stringify(['/forum1/message6170474/pg1'])
  });

  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto('chrome-extension://' + extensionId + '/options/options.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#section-nav .nav-item').first().waitFor();

  check('options: all schema pages are in the navigation',
    await page.locator('#section-nav .nav-item').count() === schema.sections.length);
  check('options: decorative fake previews are absent',
    await page.locator('.page-preview, .specimen').count() === 0
      && !(await page.locator('body').innerText()).includes('Live preview'));
  check('options: core reports two enabled default switches',
    (await page.locator('#metric-enabled').textContent()) === '2');
  check('options: no horizontal overflow at 1440x900',
    await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));

  await page.keyboard.press('Control+k');
  check('options: Ctrl+K focuses search', await page.locator('#search').evaluate(node => node === document.activeElement));
  await page.locator('#search').fill('not-a-real-setting');
  check('options: a no-match search has an honest empty state',
    (await page.locator('#page-title').textContent()) === 'No settings found');
  await page.locator('#search').press('Escape');
  check('options: Escape clears search', (await page.locator('#search').inputValue()) === '');

  const navigate = async title => {
    await page.locator('.nav-item[data-section-title="' + title + '"]').click();
    await page.locator('.section.page-active[data-title="' + title + '"]').waitFor();
  };

  await navigate('Core');
  const enabled = page.locator('.item[data-key="enabled"] input');
  await enabled.uncheck();
  await waitFor(() => page.locator('#reset-page').isDisabled(), value => value === false);
  check('options: changing a control enables page reset', !(await page.locator('#reset-page').isDisabled()));
  await page.locator('#reset-page').click();
  // The reset repaints asynchronously; asserting straight after the click made this the one
  // flaky check in the suite (seen failing once, then passing twice unchanged on 2026-09-05).
  check('options: page reset restores the default',
    await waitFor(() => enabled.isChecked(), value => value === true));
  await page.locator('.toast-action').last().click();
  await waitFor(() => enabled.isChecked(), value => value === false);
  check('options: page reset undo restores the prior value', !(await enabled.isChecked()));
  await enabled.check();

  await navigate('UI Enhancements');
  const autoRefresh = page.locator('.item[data-key="autoRefresh"] input');
  const autoRefreshInterval = page.locator('.item[data-key="autoRefreshInterval"] input');
  check('options: dependent refresh interval starts disabled', await autoRefreshInterval.isDisabled());
  await autoRefresh.check();
  await waitFor(() => autoRefreshInterval.isDisabled(), value => value === false);
  check('options: enabling auto refresh unlocks its interval', !(await autoRefreshInterval.isDisabled()));
  const resetAutoRefresh = page.locator('.item[data-key="autoRefresh"] .item-reset');
  check('options: changed settings expose an individual reset', await resetAutoRefresh.isVisible());
  await resetAutoRefresh.click();
  await waitFor(() => autoRefreshInterval.isDisabled(), value => value === true);
  check('options: individual reset restores dependency state', await autoRefreshInterval.isDisabled());

  await navigate('Quote Styling');
  const quoteColor = page.locator('.item[data-key="quoteBorderColor"]');
  check('options: theme-following colour is represented explicitly',
    await quoteColor.locator('.color-mode').first().getAttribute('aria-pressed') === 'true'
      && await quoteColor.locator('input[type="color"]').isDisabled());
  await quoteColor.locator('.color-mode').nth(1).click();
  await waitFor(() => quoteColor.locator('input[type="color"]').isDisabled(), value => value === false);
  check('options: custom colour mode unlocks a valid colour picker',
    !(await quoteColor.locator('input[type="color"]').isDisabled())
      && /^#[0-9a-f]{6}$/i.test(await quoteColor.locator('input[type="color"]').inputValue()));
  await quoteColor.locator('.color-mode').first().click();

  await navigate('Visual Enhancements');
  check('options: visual page has a truthful typography specimen',
    await page.locator('.typography-sample').count() === 1
      && (await page.locator('.typography-metrics').textContent()).includes(String(schema.defaults.fontSize)));

  await navigate('Presets');
  check('options: three operational presets are available', await page.locator('.preset-card').count() === 3);
  check('options: defaults are identified as current', await page.locator('.preset-card.current').count() === 1);
  await page.locator('.preset-card').nth(1).locator('.preset-apply').click();
  await waitFor(() => page.locator('.preset-card').nth(1).getAttribute('class'), value => value.includes('current'));
  check('options: quiet-reading preset applies', (await page.locator('.preset-card').nth(1).getAttribute('class')).includes('current'));
  await page.locator('.toast-action').last().click();
  await waitFor(() => page.locator('.preset-card').first().getAttribute('class'), value => value.includes('current'));
  check('options: preset undo returns to defaults', (await page.locator('.preset-card').first().getAttribute('class')).includes('current'));

  await navigate('Muted Users');
  const mutedPage = page.locator('.section.page-active');
  check('options: saved muted users render as searchable rows', await mutedPage.locator('.list-row').count() === 2);
  await mutedPage.locator('.list-search').fill('Beta');
  check('options: list search filters rows', await mutedPage.locator('.list-row:not(.filtered)').count() === 1);
  await mutedPage.locator('.list-clear').click();
  check('options: clear-all empties a managed list', await page.locator('.section.page-active .list-row').count() === 0);
  await page.locator('.toast-action').last().click();
  await waitFor(() => page.locator('.section.page-active .list-row').count(), value => value === 2);
  check('options: list clear undo restores entries', await page.locator('.section.page-active .list-row').count() === 2);

  await navigate('User Data');
  check('options: local inventory reports real data counts',
    (await page.locator('.local-data-grid').innerText()).includes('1')
      && (await page.locator('.section.page-active .status-strip').innerText()).includes('Muted'));
  const clearHistory = page.getByRole('button', { name: 'Clear poster history' });
  check('options: poster history can be cleared when records exist', !(await clearHistory.isDisabled()));
  await clearHistory.click();
  const storedAfterClear = await worker.evaluate(async () => chrome.storage.local.get(['glpUserStats', 'glpUserStatsPages']));
  check('options: history clear removes both record and page stores',
    storedAfterClear.glpUserStats === '{}' && storedAfterClear.glpUserStatsPages === '[]',
    JSON.stringify(storedAfterClear));
  await page.locator('.toast-action').last().click();
  const restoredHistory = await waitFor(
    () => worker.evaluate(async () => chrome.storage.local.get('glpUserStats')),
    value => value.glpUserStats && value.glpUserStats !== '{}'
  );
  check('options: history clear undo restores records', restoredHistory.glpUserStats !== '{}');

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
    page.locator('#export').click()
  ]);
  const exported = parseJSON(await readDownload(download), null);
  check('options: export includes settings and every local-data family',
    exported?.format === 'glp-ultra-backup'
      && exported?.settings
      && Array.isArray(exported?.mutedUsers)
      && exported?.userTags
      && exported?.userStats
      && Array.isArray(exported?.watchedThreads),
    download ? download.suggestedFilename() : 'no download');

  const hostileBackup = {
    format: 'glp-ultra-backup',
    formatVersion: 3,
    settings: {
      enabled: 'yes',
      colorTheme: 'not-a-theme',
      shapeStyle: 'pill',
      quoteBorderColor: 'red; } body { display: none',
      fontSize: 999,
      lineHeight: -5,
      autoRefreshInterval: 1,
      watcherIntervalMinutes: 9999,
      userMuteMatchMode: 'wildcard',
      userHistoryCap: 999999,
      mediaHoverPreviewSize: -20
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
  };
  await page.locator('#import-file').setInputFiles({
    name: 'hostile-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(hostileBackup))
  });
  await waitFor(() => page.locator('#toast-stack').innerText(), value => value.includes('Imported'));
  const importedStores = await worker.evaluate(async () => chrome.storage.local.get([
    'glpEnhancedSettings', 'glpMutedUsers', 'glpBlockedUsers', 'glpHiddenThreads',
    'glpHiddenThreadTitles', 'glpUserTags', 'glpWatchedThreads', 'glpUserStats', 'glpUserStatsPages'
  ]));
  const importedSettings = parseJSON(importedStores.glpEnhancedSettings, {});
  check('options: imported settings are type-checked and range-clamped',
    importedSettings.enabled === schema.defaults.enabled
      && importedSettings.colorTheme === schema.defaults.colorTheme
      && importedSettings.shapeStyle === schema.defaults.shapeStyle
      && importedSettings.quoteBorderColor === schema.defaults.quoteBorderColor
      && importedSettings.fontSize === 24
      && importedSettings.lineHeight === 1
      && importedSettings.autoRefreshInterval === 15
      && importedSettings.watcherIntervalMinutes === 240
      && importedSettings.userMuteMatchMode === schema.defaults.userMuteMatchMode
      && importedSettings.userHistoryCap === 1000
      && importedSettings.mediaHoverPreviewSize === 30,
    JSON.stringify(importedSettings));
  const importedMuted = parseJSON(importedStores.glpMutedUsers, []);
  const importedBlocked = parseJSON(importedStores.glpBlockedUsers, []);
  const importedHidden = parseJSON(importedStores.glpHiddenThreads, []);
  const importedTitles = parseJSON(importedStores.glpHiddenThreadTitles, {});
  const importedTags = parseJSON(importedStores.glpUserTags, {});
  const importedWatched = parseJSON(importedStores.glpWatchedThreads, []);
  const importedStats = parseJSON(importedStores.glpUserStats, {});
  const importedStatsPages = parseJSON(importedStores.glpUserStatsPages, []);
  check('options: imported local data drops malformed and duplicate entries',
    JSON.stringify(importedMuted) === JSON.stringify(['Valid Reader'])
      && importedBlocked.length === 1 && importedBlocked[0].id === '42'
      && JSON.stringify(importedHidden) === JSON.stringify(['6170474'])
      && Object.keys(importedTitles).length === 1 && importedTitles['6170474'] === 'Saved title'
      && importedTags['Known Poster']?.label === 'Friend'
      && importedTags['Known Poster']?.bg !== 'url(https://invalid.example)'
      && importedWatched.length === 1 && importedWatched[0].id === '6170474'
      && Object.keys(importedStats).length === 1
      && JSON.stringify(importedStatsPages) === JSON.stringify(['/forum1/message6170474/pg1']),
    JSON.stringify({ importedMuted, importedBlocked, importedHidden, importedTitles, importedTags, importedWatched, importedStats, importedStatsPages }));

  for (const section of schema.sections) {
    await navigate(section.title);
    check('options route: ' + section.title,
      await page.locator('.section.page-active').count() === 1
        && (await page.locator('#page-title').textContent()) === section.title);
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  await navigate('Presets');
  check('options: no horizontal overflow at 1920x1080',
    await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  check('options: all preset cards remain visible at secondary desktop width',
    await page.locator('.preset-card').count() === 3
      && await page.locator('.preset-card').last().isVisible());
  // The update row is the only signal an extension user gets that a newer build exists, because
  // Chrome never auto-updates an unpacked install. It must stay hidden and offline until the reader
  // grants the optional host permission, and this page is a real extension page so the round trip
  // through the worker's onMessage handler is genuinely exercised here.
  const updateRow = await page.evaluate(async () => {
    const row = document.getElementById('update-row');
    const button = document.getElementById('check-updates');
    const response = await chrome.runtime.sendMessage({ type: 'glp:update-state' }).catch(error => ({
      ok: false,
      error: String(error && error.message ? error.message : error)
    }));
    return {
      rowPresent: !!row,
      rowHidden: row ? row.hidden : null,
      buttonPresent: !!button,
      buttonLabel: button ? button.textContent.trim() : '',
      ok: response ? response.ok : false,
      granted: response && response.state ? response.state.granted : null,
      updateAvailable: response && response.state ? response.state.updateAvailable : null,
      error: response ? response.error : 'no response'
    };
  });
  check('options: the worker answers an update-state request from a real extension page',
    updateRow.ok === true && updateRow.granted === false && updateRow.updateAvailable === false,
    JSON.stringify(updateRow));
  check('options: the update row stays hidden and offers to turn checks on',
    updateRow.rowPresent && updateRow.rowHidden === true && updateRow.buttonPresent
      && updateRow.buttonLabel === 'Turn on update checks',
    JSON.stringify(updateRow));

  check('options: no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

function parseJSON(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

const failed = results.filter(result => !result.ok);
console.log('\nOptions verification: ' + (results.length - failed.length) + '/' + results.length + ' checks passed.');
if (failed.length) process.exitCode = 1;
