import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const source = path.join(root, 'assets', 'icon.svg');
const outDir = path.join(root, 'extension', 'icons');
const sizes = [16, 32, 48, 128, 512];

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const out = path.join(outDir, `icon${size}.png`);
  await run('magick', [
    '-background', 'none',
    '-density', '384',
    source,
    '-resize', `${size}x${size}`,
    'PNG32:' + out
  ]);
  console.log(`Built ${path.relative(root, out)}`);
}
