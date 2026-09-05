import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const source = await readFile(path.join(root, 'src', 'glp-ultra.user.js'), 'utf8');

function fail(message) {
    console.error(`verify-lifecycle: ${message}`);
    process.exitCode = 1;
}

const registryStart = source.indexOf('function getFeatureRegistry()');
const registryEnd = source.indexOf('function runFeatureRegistry', registryStart);
if (registryStart < 0 || registryEnd < 0) {
    fail('could not locate the feature registry');
} else {
    const registry = source.slice(registryStart, registryEnd);
    const entries = [...registry.matchAll(/\{\s*id:\s*'([^']+)'[^\n]*\}/g)]
        .map(match => ({ id: match[1], text: match[0] }));
    const ids = entries.map(entry => entry.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    if (!entries.length) fail('feature registry is empty');
    if (duplicateIds.length) fail(`duplicate feature ids: ${[...new Set(duplicateIds)].join(', ')}`);

    // The entry pattern needs the whole object literal on one line. That is true today, but a
    // reformatted entry would simply stop matching and leave the gate silently - a smaller
    // registry, not a failure. Anchor the count to something the pattern cannot influence.
    const declaredIds = (registry.match(/\bid:\s*'/g) || []).length;
    if (declaredIds !== entries.length) {
        fail(`registry declares ${declaredIds} ids but only ${entries.length} entries matched; `
            + 'an entry is probably split across lines and is no longer being checked');
    }

    /**
     * True when `name` is present but does nothing. Covers the arrow, function-expression, and
     * method-shorthand spellings, with any whitespace inside the braces.
     *
     * `apply: () => {}` was a real bug here on 2026-08-06: seven features needed a page reload
     * because whoever wrote the registry defused `apply` instead of making `init` idempotent.
     * The gate written afterwards only checked that the string `apply:` appeared, so the exact
     * defect it existed to catch would have sailed through it.
     */
    function hasEmptyHandler(text, name) {
        return [
            new RegExp(`\\b${name}\\s*:\\s*(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>\\s*\\{\\s*\\}`),
            new RegExp(`\\b${name}\\s*:\\s*function\\s*[A-Za-z_$\\w]*\\s*\\([^)]*\\)\\s*\\{\\s*\\}`),
            new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*\\{\\s*\\}`)
        ].some(pattern => pattern.test(text));
    }

    entries.filter(entry => !entry.text.includes('init:') || !entry.text.includes('apply:'))
        .forEach(entry => fail(`${entry.id} must declare init and apply handlers`));
    entries.filter(entry => !entry.text.includes('destroy:'))
        .forEach(entry => fail(`${entry.id} must declare a destroy handler`));
    ['init', 'apply', 'destroy'].forEach(name => {
        entries.filter(entry => hasEmptyHandler(entry.text, name))
            .forEach(entry => fail(`${entry.id} has an empty ${name} handler; `
                + 'make the real handler idempotent instead of defusing it'));
    });

    const fragmentCount = entries.filter(entry => entry.text.includes('fragment: true')).length;
    // Only claim a pass if nothing failed. This line used to print unconditionally, so a run
    // with real failures still ended with "checks passed" on the last line.
    if (!process.exitCode) {
        console.log(`Lifecycle registry checks passed (${entries.length} features, ${fragmentCount} fragment-safe).`);
    }
}

const requiredHelpers = [
    'registerFeatureCleanup',
    'addFeatureEventListener',
    'clearFeatureResources',
    'markFeatureOwned',
    'waitForElement'
];
requiredHelpers.forEach(name => {
    if (!new RegExp(`function ${name}\\s*\\(`).test(source)) fail(`missing lifecycle helper ${name}`);
});

if (!/function readFeatureStore\s*\(/.test(source) || !/function writeFeatureStore\s*\(/.test(source)) {
    fail('feature storage must go through the typed store adapter');
}

// localStorage throws QuotaExceededError once the origin is full, and two of these writes run
// inside loadSettings() before injectEarlyCSS, so an uncaught one aborts init() and the page comes
// up with no engine rather than losing a single store. There is no way to prove that from the
// runtime harness - the stamps are a few bytes and the origin always has slack enough for them -
// so the invariant is held here instead: exactly one call site, inside the guarded writer.
const setValueCalls = [...source.matchAll(/GM_setValue\s*\(/g)];
if (setValueCalls.length !== 1) {
    fail(`expected exactly one GM_setValue call site (inside safeSetValue), found ${setValueCalls.length}; `
        + 'every engine write must go through safeSetValue so a full origin cannot abort startup');
} else {
    const guarded = /function safeSetValue\([^)]*\)\s*\{\s*try\s*\{\s*GM_setValue\s*\(/.test(source);
    if (!guarded) fail('the single GM_setValue call is not inside the safeSetValue try block');
}
if (/GM_(?:get|set)Value\(\s*['"]glp(?:MutedUsers|BlockedUsers|HiddenThreads|HiddenThreadTitles|UserTags|WatchedThreads|UserStats|UserStatsPages)['"]/.test(source)) {
    fail('feature code must not read or write its stores through GM_* directly');
}
if (!source.includes("runWatcherCheck: () => runWatcherPass()")
    || !source.includes("const extensionManaged = typeof chrome !== 'undefined' && !!chrome.runtime?.id")) {
    fail('the extension watcher must expose an alarm-driven check without removing userscript timers');
}

if (!/function runFeatureRegistry\(stage = 'init', root = document\)/.test(source)
    || !/runner\(scope, ctx\)/.test(source)) {
    fail('registry apply path must receive a scoped root');
}

const observer = source.match(/runtimeState\.observer\s*=\s*new MutationObserver\(\(mutations\) => \{[\s\S]*?\n        \}\);/);
if (!observer?.[0]) {
    fail('missing scoped mutation observer');
} else {
    const observerText = observer[0];
    if (!observerText.includes('addedNodes')) fail('mutation observer must process addedNodes');
    if (!source.includes('#forum_l, table.msg, table.threads, #rightpanel_inner, #glpNotifyMenu')) {
        fail('mutation observer must list known GLP roots');
    }
    if (!observerText.includes('runFeatureRegistry(\'apply\', added)')) {
        fail('mutation observer must pass added nodes through the registry');
    }
}

// A feature that registers a listener on document or window owns it for the life of the page
// unless something takes it off again, and the two failure modes are silent: forgetting the
// removal, or passing options on the add and not the remove so the capture flags do not match and
// removeEventListener quietly does nothing. The tag picker leaked one permanent capture-phase
// click listener per open exactly that way. Feature listeners belong on addFeatureEventListener,
// which registers its own teardown; anything that genuinely has to be direct declares why on a
// line above, so the exception is visible in review rather than assumed.
const sourceLines = source.split(/\r?\n/);
sourceLines.forEach((line, index) => {
    if (!/\b(?:document|window)\.addEventListener\s*\(/.test(line)) return;
    const preceding = sourceLines.slice(Math.max(0, index - 5), index).join('\n');
    if (/direct-listener:/.test(preceding)) return;
    fail(`line ${index + 1}: ${line.trim().slice(0, 60)} - use addFeatureEventListener so teardown `
        + 'is registered, or justify it with a "// direct-listener: <reason>" comment above');
});

// removeEventListener matches on type, callback AND the capture flag. An add that passes
// { capture: true } and a remove that passes nothing therefore never match, and the removal is a
// silent no-op - the tag picker leaked one permanent listener per open that way, confirmed in
// Chromium. This is not observable from the runtime harness: the content script has its own
// EventTarget.prototype so the page cannot count listeners, and CDP's DOMDebugger.getEventListeners
// resolves `document` in the main world and reported 0 both before and after a deliberately leaked
// listener. So require the two calls to pass the SAME third argument. Comparing the text rather
// than computing the flag is deliberate: the options are often a shared variable, which no static
// pass can evaluate, and identical text is the only property that guarantees identical flags.
const listenerCallPattern =
    /\.(add|remove)EventListener\s*\(\s*(['"])([^'"]+)\2\s*,\s*([A-Za-z_$][\w$.]*)\s*(?:,\s*([^)]*(?:\{[^}]*\})?[^)]*))?\)/g;
const normalizeOptions = value => (value === undefined ? '' : value.trim().replace(/\s+/g, ' '));

const listenerCalls = [...source.matchAll(listenerCallPattern)];
const listenerAdds = new Map();
listenerCalls.filter(match => match[1] === 'add').forEach(match => {
    listenerAdds.set(`${match[3]}|${match[4]}`, normalizeOptions(match[5]));
});
listenerCalls.filter(match => match[1] === 'remove').forEach(match => {
    const key = `${match[3]}|${match[4]}`;
    if (!listenerAdds.has(key)) return;
    const added = listenerAdds.get(key);
    const removed = normalizeOptions(match[5]);
    if (added !== removed) {
        fail(`${match[4]} is added for '${match[3]}' with options \`${added || '(none)'}\` but removed `
            + `with \`${removed || '(none)'}\`; pass the same argument to both or removeEventListener `
            + 'may not match the listener at all');
    }
});

const directFetches = [...source.matchAll(/\bfetch\s*\(/g)];
if (directFetches.length !== 1 || !source.includes('response = await fetch(next.url')) {
    fail(`expected one raw fetch inside the queue, found ${directFetches.length}`);
}

if (process.exitCode) process.exit();
