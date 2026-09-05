import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

/**
 * The captures are the only offline substrate this repo has: the live site answers automation
 * with a Cloudflare challenge and then a membership contract, so a missing capture means the
 * selector registry is unverifiable, not that there is less to check. Both were deleted from
 * `main` on 2026-09-04 and restored on 2026-09-05; fail loudly rather than skipping the file.
 */
async function requireCaptures(files) {
  const problems = [];
  for (const file of files) {
    const full = path.join(root, file);
    let info;
    try {
      info = await stat(full);
    } catch {
      problems.push(`${file} is missing`);
      continue;
    }
    if (!info.isFile()) problems.push(`${file} is not a file`);
    else if (info.size === 0) problems.push(`${file} is empty`);
  }
  if (problems.length) {
    console.error('verify-captures: the MHTML capture substrate is not usable.');
    problems.forEach(problem => console.error(`  - ${problem}`));
    console.error('Restore them from history, then re-run:');
    console.error('  git show 3b2a45e^:captures/thread-message.mhtml > captures/thread-message.mhtml');
    console.error('  git show c2a1e9d^:captures/forum-feed.mhtml > captures/forum-feed.mhtml');
    process.exit(1);
  }
}

const captures = [
  {
    file: 'captures/forum-feed.mhtml',
    route: 'feed',
    urlPattern: /forum1\/pg1/i,
    checks: [
      ['pageRoot', [/id=3D"?wrap"?/i, /id="?wrap"?/i]],
      ['headerBanner', [/id=3D"?glpbanner"?/i, /id="?glpbanner"?/i]],
      ['notifications', [/id=3D"?glpNotifyToggle"?/i, /id="?glpNotifyToggle"?/i]],
      ['feedTable', [/class=3D"[^"]*threads/i, /class="[^"]*threads/i]],
      ['feedRows', [/class=3D"[^"]*sfr/i, /class="[^"]*sfr/i]],
      ['siteSearch', [/search\.php/i, /name=3D"?q"?/i, /name="?q"?/i]],
      ['sidebar', [/id=3D"?rightpanel_wrap"?/i, /id="?rightpanel_wrap"?/i]],
      ['ads', [/data-type=3D"?_mgwidget"?/i, /data-type="?_mgwidget"?/i]]
    ]
  },
  {
    file: 'captures/thread-message.mhtml',
    route: 'thread',
    urlPattern: /forum1\/message6170474\/pg1/i,
    checks: [
      ['threadTable', [/class=3D"[^"]*msg/i, /class="[^"]*msg/i]],
      ['postRows', [/id=3D"?post_/i, /id="?post_/i]],
      ['originalPost', [/id=3D"?post_1"?/i, /id="?post_1"?/i]],
      ['postAuthor', [/messageauthor/i, /replyauthor/i]],
      ['postBody', [/post_main/i]],
      ['postQuote', [/quoteo/i]],
      ['threadVote', [/\/bbs\/vote\.php/i]],
      ['threadSearch', [/replies_q/i, /highlight_q/i]],
      ['threadRelated', [/threads related/i, /related/i]],
      ['mediaTwitter', [/twitter-widget/i, /data-tweet-id/i]],
      ['ads', [/data-type=3D"?_mgwidget"?/i, /data-type="?_mgwidget"?/i]]
    ]
  }
];

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, '')
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractHtml(mhtml) {
  const htmlHeader = /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n/i.exec(mhtml);
  if (!htmlHeader) return '';
  const start = htmlHeader.index + htmlHeader[0].length;
  const rest = mhtml.slice(start);
  const nextBoundary = /\r?\n------/.exec(rest);
  const encoded = nextBoundary ? rest.slice(0, nextBoundary.index) : rest;
  return decodeQuotedPrintable(encoded);
}

function assertAny(text, patterns, label, file) {
  const matched = patterns.some(pattern => pattern.test(text));
  if (!matched) {
    throw new Error(`${file}: missing ${label}`);
  }
}

await requireCaptures(captures.map(capture => capture.file));

let passed = 0;

for (const capture of captures) {
  const capturePath = path.join(root, capture.file);
  const mhtml = await readFile(capturePath, 'latin1');
  assertAny(mhtml, [capture.urlPattern], `${capture.route} route URL`, capture.file);
  const html = extractHtml(mhtml);
  if (!html) throw new Error(`${capture.file}: could not extract HTML part`);

  for (const [label, patterns] of capture.checks) {
    assertAny(html, patterns, label, capture.file);
    passed++;
  }

  console.log(`${capture.file}: ${capture.route} capture passed (${capture.checks.length} selector surfaces)`);
}

console.log(`Capture verification passed: ${passed} selector surfaces.`);
