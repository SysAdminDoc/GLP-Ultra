/**
 * Packages extension/ into dist/glp-ultra-v<version>.zip using a minimal store-only
 * ZIP writer, so packaging needs no third-party dependency.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const extensionDir = path.join(root, 'extension');
const distDir = path.join(root, 'dist');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const zipPath = path.join(distDir, `glp-ultra-v${packageJson.version}.zip`);

// Deterministic timestamp: the archive must not change when nothing in it changed.
const DOS_TIME = 0x6000; // 12:00:00
const DOS_DATE = 0x5a21; // 2025-01-01

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function walk(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    // Chrome writes _metadata/ into an unpacked directory it has loaded; it is not ours to ship.
    if (entry.name === '_metadata' || entry.name.endsWith('.bak')) continue;
    const full = path.join(dir, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(full, relative)));
    else files.push({ relative, full });
  }
  return files;
}

const files = await walk(extensionDir);
if (files.length === 0) {
  console.error('package-extension: nothing to package');
  process.exit(1);
}

const localParts = [];
const centralParts = [];
let offset = 0;

for (const file of files) {
  const content = await readFile(file.full);
  const compressed = deflateRawSync(content, { level: 9 });
  const useDeflate = compressed.length < content.length;
  const payload = useDeflate ? compressed : content;
  const nameBuffer = Buffer.from(file.relative, 'utf8');
  const crc = crc32(content);

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(useDeflate ? 8 : 0, 8);
  localHeader.writeUInt16LE(DOS_TIME, 10);
  localHeader.writeUInt16LE(DOS_DATE, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(payload.length, 18);
  localHeader.writeUInt32LE(content.length, 22);
  localHeader.writeUInt16LE(nameBuffer.length, 26);
  localHeader.writeUInt16LE(0, 28);

  localParts.push(localHeader, nameBuffer, payload);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(useDeflate ? 8 : 0, 10);
  centralHeader.writeUInt16LE(DOS_TIME, 12);
  centralHeader.writeUInt16LE(DOS_DATE, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(payload.length, 20);
  centralHeader.writeUInt32LE(content.length, 24);
  centralHeader.writeUInt16LE(nameBuffer.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(offset, 42);

  centralParts.push(centralHeader, nameBuffer);
  offset += localHeader.length + nameBuffer.length + payload.length;
}

const centralDirectory = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);

const archive = Buffer.concat([...localParts, centralDirectory, end]);

await mkdir(distDir, { recursive: true });
await rm(zipPath, { force: true });
await writeFile(zipPath, archive);

const info = await stat(zipPath);
const sha = createHash('sha256').update(archive).digest('hex');
console.log(`Packaged ${path.relative(root, zipPath)} (${files.length} files, ${(info.size / 1024).toFixed(1)} KB)`);
console.log(`sha256 ${sha}`);
