/**
 * Structural gate for the packaged extension: every file the manifest promises must exist,
 * versions must line up, the generated schema must match the engine, and no remote code
 * may sneak into an extension page.
 */
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const extensionDir = path.join(root, 'extension');

let failures = 0;
function fail(message) {
  console.error(`verify-extension: ${message}`);
  failures++;
}

async function exists(relative) {
  try {
    await access(path.join(extensionDir, relative));
    return true;
  } catch (e) {
    return false;
  }
}

const manifest = JSON.parse(await readFile(path.join(extensionDir, 'manifest.json'), 'utf8'));
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (manifest.version !== packageJson.version) fail(`manifest ${manifest.version} != package ${packageJson.version}`);
if (/^\d+\.\d+\.\d+$/.test(manifest.version) === false) fail(`manifest version "${manifest.version}" is not a 3-part version`);
if (manifest.commands) fail('command shortcuts are not allowed');

const referenced = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  manifest.options_ui?.page,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
  ...(manifest.declarative_net_request?.rule_resources || []).map(resource => resource.path),
  ...(manifest.content_scripts || []).flatMap(entry => [...(entry.js || []), ...(entry.css || [])])
].filter(Boolean);

for (const relative of referenced) {
  if (!(await exists(relative))) fail(`manifest references missing file: ${relative}`);
}

// Extension pages must be self-contained: no CDN scripts, no remote stylesheets.
for (const page of ['popup/popup.html', 'options/options.html']) {
  const html = await readFile(path.join(extensionDir, page), 'utf8');
  if (/<script[^>]+src=["']https?:/i.test(html)) fail(`${page} loads a remote script`);
  if (/<link[^>]+href=["']https?:/i.test(html)) fail(`${page} loads a remote stylesheet`);
}

const engine = await readFile(path.join(extensionDir, 'content', 'glp-ultra.user.js'), 'utf8');
const engineSource = await readFile(path.join(root, 'src', 'glp-ultra.user.js'), 'utf8');
if (engine !== engineSource) fail('extension/content/glp-ultra.user.js is stale - run npm run build');
if (!engine.includes('window.__GLP_ULTRA__')) fail('engine does not expose the extension control surface');

const schemaText = await readFile(path.join(extensionDir, 'generated', 'settings-schema.js'), 'utf8');
const schema = JSON.parse(schemaText.slice(schemaText.indexOf('{'), schemaText.lastIndexOf('}') + 1));
if (schema.version !== packageJson.version) fail(`generated schema version ${schema.version} != package ${packageJson.version}`);

const rules = JSON.parse(await readFile(path.join(extensionDir, 'rules', 'ad-network.json'), 'utf8'));
const ruleIds = new Set();
for (const rule of rules) {
  if (ruleIds.has(rule.id)) fail(`duplicate declarativeNetRequest rule id ${rule.id}`);
  ruleIds.add(rule.id);
  if (!rule.condition?.initiatorDomains?.includes('godlikeproductions.com')) {
    fail(`rule ${rule.id} is not scoped to godlikeproductions.com`);
  }
}

if (failures > 0) {
  console.error(`verify-extension: ${failures} problem(s) found.`);
  process.exit(1);
}

console.log(`Extension verified: manifest v${manifest.version}, ${referenced.length} referenced files, ${rules.length} network rules, ${Object.keys(schema.defaults).length} settings in schema.`);
