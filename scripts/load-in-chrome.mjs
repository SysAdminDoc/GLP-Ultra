/**
 * Opens chrome://extensions and puts the extension folder on the clipboard, so the
 * "Load unpacked" picker only needs a paste.
 *
 * Chrome 137+ ignores --load-extension, and as of Chrome 151 the old
 * --disable-features=DisableLoadExtensionCommandLineSwitch escape hatch is gone too:
 * loading an unpacked extension is a deliberate manual action. This just removes the typing.
 */
import { execFile, spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const extensionDir = path.join(root, 'extension');
const manifest = JSON.parse(await readFile(path.join(extensionDir, 'manifest.json'), 'utf8'));

await access(path.join(extensionDir, 'content', 'glp-ultra.user.js'));

const chromeCandidates = [
  path.join(process.env['ProgramFiles'] || '', 'Google/Chrome/Application/chrome.exe'),
  path.join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')
];

let chrome = null;
for (const candidate of chromeCandidates) {
  try {
    await access(candidate);
    chrome = candidate;
    break;
  } catch (e) {
    // try the next location
  }
}

try {
  await run('powershell', ['-NoProfile', '-Command', `Set-Clipboard -Value '${extensionDir}'`]);
  console.log('Folder path copied to clipboard.');
} catch (e) {
  console.log('Could not reach the clipboard; copy the path below by hand.');
}

console.log('');
console.log(`  ${manifest.name} v${manifest.version}`);
console.log(`  ${extensionDir}`);
console.log('');
console.log('  1. chrome://extensions opens in a moment');
console.log('  2. Turn on "Developer mode" (top right)');
console.log('  3. Click "Load unpacked"');
console.log('  4. Paste the path into the folder picker and confirm');
console.log('');

if (chrome) {
  spawn(chrome, ['chrome://extensions/'], { detached: true, stdio: 'ignore' }).unref();
} else {
  console.log('Chrome was not found in the usual locations - open chrome://extensions yourself.');
}
