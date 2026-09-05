import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'glp-ultra.user.js');
const packagePath = path.join(root, 'package.json');
const manifestPath = path.join(root, 'extension', 'manifest.json');
const extensionContentDir = path.join(root, 'extension', 'content');
const extensionGeneratedDir = path.join(root, 'extension', 'generated');
const extensionUserscriptPath = path.join(extensionContentDir, 'glp-ultra.user.js');
const schemaPath = path.join(extensionGeneratedDir, 'settings-schema.js');
const distDir = path.join(root, 'dist');
const distUserscriptPath = path.join(distDir, 'glp-ultra.user.js');
const distMetaPath = path.join(distDir, 'glp-ultra.meta.js');
const checkOnly = process.argv.includes('--check-only');

const [source, packageJsonText, manifestText] = await Promise.all([
  readFile(sourcePath, 'utf8'),
  readFile(packagePath, 'utf8'),
  readFile(manifestPath, 'utf8')
]);

const packageJson = JSON.parse(packageJsonText);
const manifest = JSON.parse(manifestText);

function fail(message) {
  console.error(`build-userscript: ${message}`);
  process.exitCode = 1;
}

const metadataMatch = source.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!metadataMatch) {
  fail('missing userscript metadata block');
}
if (!metadataMatch?.[0].includes('// @noframes')) {
  fail('userscript must declare @noframes so it matches the extension top-frame contract');
}
if (!/if \(window\.top !== window\.self\) return;/.test(source)) {
  fail('userscript is missing its top-frame runtime guard');
}

const versionMatch = source.match(/\/\/ @version\s+([^\s]+)/);
if (!versionMatch) {
  fail('missing @version metadata');
} else if (versionMatch[1] !== packageJson.version) {
  fail(`@version ${versionMatch[1]} does not match package version ${packageJson.version}`);
}

const updateURL = source.match(/\/\/ @updateURL\s+([^\s]+)/)?.[1] || '';
const downloadURL = source.match(/\/\/ @downloadURL\s+([^\s]+)/)?.[1] || '';
const expectedRawBase = 'https://raw.githubusercontent.com/SysAdminDoc/GLP-Ultra/main/dist/';
if (updateURL !== `${expectedRawBase}glp-ultra.meta.js`) {
  fail(`@updateURL must point to ${expectedRawBase}glp-ultra.meta.js`);
}
if (downloadURL !== `${expectedRawBase}glp-ultra.user.js`) {
  fail(`@downloadURL must point to ${expectedRawBase}glp-ultra.user.js`);
}

const scriptVersionMatch = source.match(/const SCRIPT_VERSION = '([^']+)'/);
if (!scriptVersionMatch) {
  fail('missing SCRIPT_VERSION constant');
} else if (scriptVersionMatch[1] !== packageJson.version) {
  fail(`SCRIPT_VERSION ${scriptVersionMatch[1]} does not match package version ${packageJson.version}`);
}

if (manifest.version !== packageJson.version) {
  fail(`manifest version ${manifest.version} does not match package version ${packageJson.version}`);
}

const bannedChecks = [
  [/confirm\s*\(/, 'browser confirmation dialogs are not allowed'],
  [/\bkeyboard\b|\bshortcut\b/i, 'keyboard shortcut surfaces are not allowed'],
  [/backdrop-filter\s*:/i, 'content-script backdrop filters are not allowed'],
  [/border-radius\s*:\s*(?:999px|50%)/i, 'pill or circular backdrop radii are not allowed'],
  [/@require\s+http/i, 'remote code dependencies are not allowed in the extension build']
];

for (const [pattern, message] of bannedChecks) {
  if (pattern.test(source)) fail(message);
}

// A custom property whose own value references itself is a cycle, and CSS resolves a cycle as
// invalid-at-computed-value-time: every var() reading it silently falls back to inherit. It
// costs nothing at build time and is invisible at runtime, which is how three dead semantic
// colours shipped in 3.3.0. Catch the whole class here rather than one colour at a time.
const selfReferentialToken = source
  .split(/\r?\n/)
  .map((line, index) => ({ line, index: index + 1 }))
  .find(({ line }) => {
    const match = /(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)\s*[),]/.exec(line);
    return match && match[1] === match[2];
  });
if (selfReferentialToken) {
  fail(`custom property references itself at line ${selfReferentialToken.index}: ${selfReferentialToken.line.trim()}`);
}

const innerHTMLLines = source
  .split(/\r?\n/)
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => /\.innerHTML\s*=/.test(line));

const unsafeInnerHTML = innerHTMLLines.filter(({ line }) => !line.includes('trustedHTML('));
if (unsafeInnerHTML.length > 0) {
  fail(`unsafe innerHTML assignment at line ${unsafeInnerHTML[0].index}`);
}

/**
 * Extract a balanced literal starting at the opening bracket that follows `marker`.
 * The engine keeps its settings model in plain object/array literals precisely so the
 * options page can be generated from it instead of maintaining a second copy by hand.
 */
function extractBalanced(text, startIndex, open, close) {
  let depth = 0;
  let inString = null;
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
  }
  return null;
}

function evalObjectLiteral(marker, open = '{', close = '}') {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`could not locate ${marker}`);
  const start = source.indexOf(open, markerIndex + marker.length - 1);
  const literal = extractBalanced(source, start, open, close);
  if (!literal) throw new Error(`unbalanced literal after ${marker}`);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

function extractSections() {
  const sections = [];
  const marker = 'createSettingsSection(';
  let index = source.indexOf(marker);

  while (index !== -1) {
    const argsStart = index + marker.length - 1;
    const args = extractBalanced(source, argsStart, '(', ')');
    const isDeclaration = source.slice(Math.max(0, index - 9), index) === 'function ';
    if (args && !isDeclaration) {
      try {
        // eslint-disable-next-line no-new-func
        const parsed = new Function(`return [${args.slice(1, -1)}];`)();
        if (typeof parsed[0] === 'string' && Array.isArray(parsed[1])) {
          sections.push({ title: parsed[0], items: parsed[1], specialId: parsed[2] || null });
        }
      } catch (e) {
        throw new Error(`could not parse createSettingsSection call at index ${index}: ${e.message}`);
      }
    }
    index = source.indexOf(marker, index + marker.length);
  }

  return sections;
}

let schemaPayload = null;
try {
  const defaults = evalObjectLiteral('const DEFAULT_SETTINGS =');
  const settingDescriptions = evalObjectLiteral('const SETTING_DESCRIPTIONS =');
  const sectionDescriptions = evalObjectLiteral('const SECTION_DESCRIPTIONS =');
  const constraints = evalObjectLiteral('const SETTING_CONSTRAINTS = Object.freeze(');
  // The extension pages are separate documents and cannot read the injected token layer, so the
  // palette travels with the schema. One source, three surfaces, one theme.
  const palettes = evalObjectLiteral('const THEME_PALETTES = Object.freeze(');
  // The options page runs in its own document with its own copy of the import sanitizers, so the
  // storage ceilings have to travel with the schema. Hardcoding them there once already let the
  // two copies disagree by 5x after the engine's budget was reconciled.
  const storeLimits = evalObjectLiteral('const STORE_LIMITS = Object.freeze(');
  const sections = extractSections();

  if (sections.length === 0) fail('no settings sections were extracted from the engine source');

  const covered = new Set(sections.flatMap(section => section.items.map(item => item.key)));
  const missing = Object.keys(defaults).filter(key => !covered.has(key));
  if (missing.length > 0) {
    fail(`settings missing from the panel schema: ${missing.join(', ')}`);
  }

  const itemByKey = new Map(sections.flatMap(section => section.items).map(item => [item.key, item]));
  Object.entries(constraints).forEach(([key, constraint]) => {
    const item = itemByKey.get(key);
    if (!Object.prototype.hasOwnProperty.call(defaults, key) || !item) {
      fail(`constraint ${key} does not map to a declared setting control`);
      return;
    }
    if (constraint.values) {
      const optionKeys = Object.keys(item.options || {});
      if (item.type !== 'select' || JSON.stringify(optionKeys) !== JSON.stringify(constraint.values)) {
        fail(`constraint values for ${key} do not match its select options`);
      }
    }
    if (constraint.min !== undefined || constraint.max !== undefined) {
      if (item.type !== 'number' || item.min !== constraint.min || item.max !== constraint.max) {
        fail(`constraint range for ${key} does not match its number control`);
      }
    }
    // Same rule as the numeric range: a free-text ceiling the control does not advertise is a
    // silent truncation, so the control has to carry it too.
    if (constraint.maxLength !== undefined) {
      if (!['text', 'textarea'].includes(item.type) || item.maxLength !== constraint.maxLength) {
        fail(`constraint maxLength for ${key} does not match its text control`);
      }
    }
  });

  schemaPayload = { version: packageJson.version, defaults, constraints, settingDescriptions, sectionDescriptions, sections, palettes, storeLimits };
} catch (error) {
  fail(error.message);
}

if (process.exitCode) {
  process.exit();
}

if (!checkOnly) {
  await mkdir(distDir, { recursive: true });
  await mkdir(extensionContentDir, { recursive: true });
  await mkdir(extensionGeneratedDir, { recursive: true });
  await writeFile(distUserscriptPath, source, 'utf8');
  await writeFile(distMetaPath, `${metadataMatch[0]}\n`, 'utf8');
  await writeFile(extensionUserscriptPath, source, 'utf8');
  await writeFile(
    schemaPath,
    `/* Generated by scripts/build-userscript.mjs from src/glp-ultra.user.js. Do not edit. */\nwindow.GLP_SCHEMA = ${JSON.stringify(schemaPayload, null, 2)};\n`,
    'utf8'
  );
  console.log(`Built ${path.relative(root, distUserscriptPath)}`);
  console.log(`Built ${path.relative(root, distMetaPath)}`);
  console.log(`Built ${path.relative(root, extensionUserscriptPath)}`);
  console.log(`Built ${path.relative(root, schemaPath)} (${schemaPayload.sections.length} sections, ${Object.keys(schemaPayload.defaults).length} settings)`);
} else {
  console.log(`Userscript checks passed (${Object.keys(schemaPayload.defaults).length} settings, ${schemaPayload.sections.length} panel sections).`);
}
