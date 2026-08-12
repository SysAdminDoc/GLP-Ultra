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
    entries.filter(entry => !entry.text.includes('init:') || !entry.text.includes('apply:'))
        .forEach(entry => fail(`${entry.id} must declare init and apply handlers`));
    entries.filter(entry => !entry.text.includes('destroy:'))
        .forEach(entry => fail(`${entry.id} must declare a destroy handler`));
    entries.filter(entry => entry.text.includes('destroy: () => {}'))
        .forEach(entry => fail(`${entry.id} has an empty destroy handler`));

    const fragmentCount = entries.filter(entry => entry.text.includes('fragment: true')).length;
    console.log(`Lifecycle registry checks passed (${entries.length} features, ${fragmentCount} fragment-safe).`);
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

const directFetches = [...source.matchAll(/\bfetch\s*\(/g)];
if (directFetches.length !== 1 || !source.includes('response = await fetch(next.url')) {
    fail(`expected one raw fetch inside the queue, found ${directFetches.length}`);
}

if (process.exitCode) process.exit();
