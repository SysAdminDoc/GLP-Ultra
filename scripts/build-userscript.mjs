import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourcePath = path.join(root, 'GLP_Enhanced_-_Godlike_Productions_Declutter.user.js');
const packagePath = path.join(root, 'package.json');
const manifestPath = path.join(root, 'extension', 'manifest.json');
const extensionContentDir = path.join(root, 'extension', 'content');
const extensionUserscriptPath = path.join(extensionContentDir, 'glp-enhanced.user.js');
const distDir = path.join(root, 'dist');
const distUserscriptPath = path.join(distDir, 'glp-enhanced.user.js');
const distMetaPath = path.join(distDir, 'glp-enhanced.meta.js');
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

const versionMatch = source.match(/\/\/ @version\s+([^\s]+)/);
if (!versionMatch) {
  fail('missing @version metadata');
} else if (versionMatch[1] !== packageJson.version) {
  fail(`@version ${versionMatch[1]} does not match package version ${packageJson.version}`);
}

if (manifest.version !== packageJson.version) {
  fail(`manifest version ${manifest.version} does not match package version ${packageJson.version}`);
}

const bannedChecks = [
  [/confirm\s*\(/, 'browser confirmation dialogs are not allowed'],
  [/\bkeyboard\b|\bshortcut\b/i, 'keyboard shortcut surfaces are not allowed'],
  [/backdrop-filter\s*:/i, 'content-script backdrop filters are not allowed'],
  [/border-radius\s*:\s*(?:999px|50%)/i, 'pill or circular backdrop radii are not allowed']
];

for (const [pattern, message] of bannedChecks) {
  if (pattern.test(source)) fail(message);
}

const innerHTMLLines = source
  .split(/\r?\n/)
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => /\.innerHTML\s*=/.test(line));

const unsafeInnerHTML = innerHTMLLines.filter(({ line }) => !line.includes('trustedHTML('));
if (unsafeInnerHTML.length > 0) {
  fail(`unsafe innerHTML assignment at line ${unsafeInnerHTML[0].index}`);
}

if (process.exitCode) {
  process.exit();
}

if (!checkOnly) {
  await mkdir(distDir, { recursive: true });
  await mkdir(extensionContentDir, { recursive: true });
  await writeFile(distUserscriptPath, source, 'utf8');
  await writeFile(distMetaPath, `${metadataMatch[0]}\n`, 'utf8');
  await writeFile(extensionUserscriptPath, source, 'utf8');
  console.log(`Built ${path.relative(root, distUserscriptPath)}`);
  console.log(`Built ${path.relative(root, distMetaPath)}`);
  console.log(`Built ${path.relative(root, extensionUserscriptPath)}`);
} else {
  console.log('Userscript checks passed.');
}
