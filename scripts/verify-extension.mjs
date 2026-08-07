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

function referencedFiles(m) {
  return [
    m.background?.service_worker,
    ...(m.background?.scripts || []),
    m.action?.default_popup,
    m.options_ui?.page,
    ...Object.values(m.icons || {}),
    ...Object.values(m.action?.default_icon || {}),
    ...(m.declarative_net_request?.rule_resources || []).map(resource => resource.path),
    ...(m.content_scripts || []).flatMap(entry => [...(entry.js || []), ...(entry.css || [])])
  ].filter(Boolean);
}

const referenced = referencedFiles(manifest);
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

// The Firefox variant is generated, so it is checked where it lands rather than in the repo.
// Firefox cannot be driven by the runtime harness, which makes this gate the only thing
// standing between a manifest edit and a broken add-on.
const firefoxDir = path.join(root, 'dist', 'extension-firefox');
let firefoxSummary = 'not built';
try {
  const firefox = JSON.parse(await readFile(path.join(firefoxDir, 'manifest.json'), 'utf8'));
  if (firefox.version !== packageJson.version) fail(`firefox manifest ${firefox.version} != package ${packageJson.version}`);
  if (firefox.background?.service_worker) fail('firefox manifest still declares a service_worker background');
  if (!firefox.background?.scripts?.length) fail('firefox manifest has no background scripts');
  if (!firefox.browser_specific_settings?.gecko?.id) fail('firefox manifest has no gecko extension id');
  if (!firefox.browser_specific_settings?.gecko?.strict_min_version) fail('firefox manifest has no strict_min_version');
  if (firefox.commands) fail('command shortcuts are not allowed');

  for (const relative of referencedFiles(firefox)) {
    try {
      await access(path.join(firefoxDir, relative));
    } catch (e) {
      fail(`firefox manifest references missing file: ${relative}`);
    }
  }

  // The two builds must not drift: same content, one manifest apart.
  const firefoxEngine = await readFile(path.join(firefoxDir, 'content', 'glp-ultra.user.js'), 'utf8');
  if (firefoxEngine !== engineSource) fail('dist/extension-firefox is stale - run npm run build:firefox');
  const gecko = firefox.browser_specific_settings?.gecko || {};
  firefoxSummary = `v${firefox.version}, gecko ${gecko.id || 'missing'}, min ${gecko.strict_min_version || 'missing'}`;
} catch (error) {
  if (error.code !== 'ENOENT') fail(`firefox variant could not be read: ${error.message}`);
}

if (failures > 0) {
  console.error(`verify-extension: ${failures} problem(s) found.`);
  process.exit(1);
}

console.log(`Extension verified: manifest v${manifest.version}, ${referenced.length} referenced files, ${rules.length} network rules, ${Object.keys(schema.defaults).length} settings in schema.`);
console.log(`Firefox variant: ${firefoxSummary}.`);
