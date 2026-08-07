/**
 * Generates the Firefox variant of the extension into dist/extension-firefox/.
 *
 * Everything but the manifest is byte-identical to the Chrome build - the engine, shim, bridge,
 * and worker are written against the callback-style `chrome.*` namespace, which Firefox also
 * provides. Only the manifest differs, and only where Firefox genuinely disagrees:
 *
 *   - background: Firefox MV3 has no service_worker background; it runs an event page, so the
 *     same file is listed under `scripts` instead.
 *   - browser_specific_settings: Firefox refuses to install an MV3 add-on without an extension
 *     id, and declarativeNetRequest ruleset toggling needs 128 or newer.
 *
 * Host permissions stay declared, but note that Firefox treats them as opt-in: the content
 * scripts register regardless, while the worker's ad-blocking rules need the user to grant the
 * host permission from the add-on's permissions tab.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const source = path.join(root, 'extension');
const outDir = path.join(root, 'dist', 'extension-firefox');

const GECKO_ID = 'glp-ultra@sysadmindoc.github.io';
const MIN_FIREFOX = '128.0';

const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const serviceWorker = manifest.background?.service_worker;
if (!serviceWorker) {
  console.error('build-firefox: the Chrome manifest has no background.service_worker to convert');
  process.exit(1);
}

const firefoxManifest = {
  ...manifest,
  background: { scripts: [serviceWorker] },
  browser_specific_settings: {
    gecko: { id: GECKO_ID, strict_min_version: MIN_FIREFOX }
  }
};

await rm(outDir, { recursive: true, force: true });
await mkdir(path.dirname(outDir), { recursive: true });
await cp(source, outDir, {
  recursive: true,
  filter: entry => !entry.includes(`${path.sep}_metadata`) && !entry.endsWith('.bak')
});
await writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(firefoxManifest, null, 2)}\n`, 'utf8');

console.log(`Firefox build written to ${path.relative(root, outDir)} (manifest v${firefoxManifest.version}, gecko id ${GECKO_ID}, min Firefox ${MIN_FIREFOX}).`);
