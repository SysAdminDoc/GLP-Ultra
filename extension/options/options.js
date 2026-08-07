/* GLP Ultra options page. The schema is generated from the engine source at build time,
   so this page can never drift from the settings the content script actually reads. */

const SETTINGS_KEY = 'glpEnhancedSettings';
const LIST_KEYS = {
    muted: 'glpMutedUsers',
    blocked: 'glpBlockedUsers',
    hidden: 'glpHiddenThreads'
};

const schema = window.GLP_SCHEMA;
let settings = {};
let lists = { muted: [], blocked: [], hidden: [] };

function toast(message, kind = 'ok') {
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

function parseJSON(raw, fallback) {
    if (typeof raw !== 'string') return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

async function loadAll() {
    const stored = await chrome.storage.local.get([SETTINGS_KEY, ...Object.values(LIST_KEYS)]);
    settings = { ...schema.defaults, ...parseJSON(stored[SETTINGS_KEY], {}) };
    lists = {
        muted: parseJSON(stored[LIST_KEYS.muted], []),
        blocked: parseJSON(stored[LIST_KEYS.blocked], []),
        hidden: parseJSON(stored[LIST_KEYS.hidden], [])
    };
}

async function persistSettings(changes) {
    settings = { ...settings, ...changes };
    await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(settings) });

    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:patch-settings', patch: changes }, () => void chrome.runtime.lastError);
    });
}

async function persistList(name, value) {
    lists[name] = value;
    await chrome.storage.local.set({ [LIST_KEYS[name]]: JSON.stringify(value) });
}

function buildInput(item) {
    const value = settings[item.key];
    const input = item.type === 'textarea' ? document.createElement('textarea') : (item.type === 'select' ? document.createElement('select') : document.createElement('input'));
    input.id = `setting-${item.key}`;

    if (item.type === 'select') {
        Object.entries(item.options || {}).forEach(([optValue, optLabel]) => {
            const option = document.createElement('option');
            option.value = optValue;
            option.textContent = optLabel;
            if (optValue === value) option.selected = true;
            input.appendChild(option);
        });
        input.addEventListener('change', () => persistSettings({ [item.key]: input.value }));
    } else if (item.type === 'textarea') {
        input.value = value || '';
        input.rows = 5;
        input.addEventListener('change', () => persistSettings({ [item.key]: input.value }));
    } else if (item.type === 'number') {
        input.type = 'number';
        input.value = value;
        if (item.min !== undefined) input.min = item.min;
        if (item.max !== undefined) input.max = item.max;
        input.step = item.step || 1;
        input.addEventListener('change', () => persistSettings({ [item.key]: parseFloat(input.value) }));
    } else if (item.type === 'color') {
        input.type = 'color';
        input.value = value || '#4a90d9';
        input.addEventListener('change', () => persistSettings({ [item.key]: input.value }));
    } else if (item.type === 'text') {
        input.type = 'text';
        input.value = value || '';
        input.addEventListener('change', () => persistSettings({ [item.key]: input.value }));
    } else {
        input.type = 'checkbox';
        input.checked = !!value;
        input.addEventListener('change', () => persistSettings({ [item.key]: input.checked }));
    }

    return input;
}

function buildItem(item, sectionTitle) {
    const help = schema.settingDescriptions[item.key] || '';
    const wide = item.type && item.type !== 'checkbox';

    const wrapper = document.createElement('div');
    wrapper.className = `item${wide ? ' wide' : ''}`;
    wrapper.dataset.search = `${sectionTitle} ${item.key} ${item.label} ${help}`.toLowerCase();

    const label = document.createElement('label');
    label.htmlFor = `setting-${item.key}`;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.label;
    label.appendChild(name);

    if (help) {
        const helpEl = document.createElement('span');
        helpEl.className = 'help';
        helpEl.textContent = help;
        label.appendChild(helpEl);
    }

    const input = buildInput(item);

    if (wide) {
        wrapper.append(label, input);
    } else {
        wrapper.append(input, label);
    }
    return wrapper;
}

function buildListSection(name, rows, emptyText, onRemove) {
    const body = document.createElement('div');
    body.className = 'list';

    if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = emptyText;
        body.appendChild(empty);
        return body;
    }

    rows.forEach(row => {
        const item = document.createElement('div');
        item.className = 'list-row';

        const label = document.createElement('span');
        label.textContent = row.label;
        if (row.meta) {
            const meta = document.createElement('em');
            meta.textContent = ` ${row.meta}`;
            label.appendChild(meta);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Remove';
        btn.addEventListener('click', async () => {
            await onRemove(row.id);
            render();
            toast(`Removed ${row.label}.`);
        });

        item.append(label, btn);
        body.appendChild(item);
    });

    return body;
}

function sectionShell(title, description) {
    const section = document.createElement('section');
    section.className = 'section';
    section.dataset.title = title.toLowerCase();

    const head = document.createElement('div');
    head.className = 'section-head';

    const heading = document.createElement('h2');
    heading.textContent = title;
    head.appendChild(heading);

    if (description) {
        const p = document.createElement('p');
        p.textContent = description;
        head.appendChild(p);
    }

    section.appendChild(head);
    return section;
}

function render() {
    const host = document.getElementById('sections');
    host.replaceChildren();

    schema.sections.forEach(sectionDef => {
        const section = sectionShell(sectionDef.title, schema.sectionDescriptions[sectionDef.title] || '');

        if (sectionDef.specialId === 'mute-list') {
            section.appendChild(buildListSection(
                'muted',
                lists.muted.map(name => ({ id: name, label: name })),
                'No muted users yet.',
                async id => persistList('muted', lists.muted.filter(u => u !== id))
            ));
        } else if (sectionDef.specialId === 'block-list') {
            section.appendChild(buildListSection(
                'blocked',
                lists.blocked.map(entry => (typeof entry === 'object' && entry
                    ? { id: entry.id, label: entry.name || `User ${entry.id}`, meta: `#${entry.id}` }
                    : { id: String(entry), label: `User ${entry}`, meta: `#${entry}` })),
                'No blocked users yet. Use the Block button on any post author.',
                async id => persistList('blocked', lists.blocked.filter(entry => String(typeof entry === 'object' && entry ? entry.id : entry) !== String(id)))
            ));
        } else if (sectionDef.specialId === 'user-data') {
            const body = document.createElement('div');
            body.className = 'section-body';
            const note = document.createElement('div');
            note.className = 'empty';
            note.textContent = 'Export below includes mutes, blocks, tags, private notes, hidden threads, and the local poster history. Clearing the history is available in the in-page panel, where an undo toast is offered.';
            body.appendChild(note);
            section.appendChild(body);
        } else if (sectionDef.specialId === 'presets') {
            const body = document.createElement('div');
            body.className = 'section-body';
            const note = document.createElement('div');
            note.className = 'empty';
            note.textContent = 'Presets apply from the in-page settings panel, where an undo toast is available.';
            body.appendChild(note);
            section.appendChild(body);
        } else {
            const body = document.createElement('div');
            body.className = 'section-body';
            sectionDef.items.forEach(item => body.appendChild(buildItem(item, sectionDef.title)));
            section.appendChild(body);
        }

        host.appendChild(section);
    });

    // Hidden threads get their own management card; the engine stores them outside the panel schema.
    const hiddenSection = sectionShell('Hidden Threads', 'Threads hidden from the feed with the row-level hide button.');
    hiddenSection.dataset.title = 'hidden threads';
    hiddenSection.appendChild(buildListSection(
        'hidden',
        lists.hidden.map(entry => (typeof entry === 'object' && entry
            ? { id: entry.id, label: entry.title || entry.id }
            : { id: String(entry), label: String(entry) })),
        'No hidden threads.',
        async id => persistList('hidden', lists.hidden.filter(entry => String(typeof entry === 'object' && entry ? entry.id : entry) !== String(id)))
    ));
    host.appendChild(hiddenSection);

    applySearch();
}

function applySearch() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    document.querySelectorAll('.section').forEach(section => {
        const sectionMatches = !query || (section.dataset.title || '').includes(query);
        let visible = 0;

        section.querySelectorAll('.item').forEach(item => {
            const match = sectionMatches || (item.dataset.search || '').includes(query);
            item.classList.toggle('filtered', !match);
            if (match) visible++;
        });

        const hasItems = section.querySelectorAll('.item').length > 0;
        section.classList.toggle('filtered', hasItems ? (visible === 0 && !sectionMatches) : !sectionMatches);
    });
}

function exportSettings() {
    const payload = JSON.stringify({
        version: schema.version,
        exportedFrom: 'GLP Ultra options',
        settings,
        lists
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glp-ultra-settings-v${schema.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Settings exported.');
}

function importSettings(file) {
    const reader = new FileReader();
    reader.onload = async () => {
        const parsed = parseJSON(String(reader.result), null);
        if (!parsed || typeof parsed !== 'object') {
            toast('That file is not a GLP Ultra export.', 'warn');
            return;
        }

        const incoming = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : parsed;
        const accepted = {};
        Object.keys(schema.defaults).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(incoming, key)) accepted[key] = incoming[key];
        });

        await persistSettings(accepted);

        if (parsed.lists && typeof parsed.lists === 'object') {
            for (const name of Object.keys(LIST_KEYS)) {
                if (Array.isArray(parsed.lists[name])) await persistList(name, parsed.lists[name]);
            }
        }

        render();
        toast(`Imported ${Object.keys(accepted).length} settings.`);
    };
    reader.readAsText(file);
}

async function resetSettings() {
    const previous = { ...settings };
    await persistSettings({ ...schema.defaults });
    render();

    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = 'toast warn';
    el.textContent = 'Settings reset to defaults. ';

    const undo = document.createElement('button');
    undo.type = 'button';
    undo.textContent = 'Undo';
    undo.className = 'btn';
    undo.style.marginLeft = '8px';
    undo.addEventListener('click', async () => {
        await persistSettings(previous);
        render();
        el.remove();
        toast('Reset undone.');
    });

    el.appendChild(undo);
    stack.appendChild(el);
    setTimeout(() => el.remove(), 8000);
}

async function init() {
    document.getElementById('subtitle').textContent =
        `${Object.keys(schema.defaults).length} controls - v${schema.version} - saved locally, applied live to open GLP tabs.`;

    await loadAll();
    render();

    document.getElementById('search').addEventListener('input', applySearch);
    document.getElementById('export').addEventListener('click', exportSettings);
    document.getElementById('reset').addEventListener('click', resetSettings);

    const fileInput = document.getElementById('import-file');
    document.getElementById('import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) importSettings(fileInput.files[0]);
        fileInput.value = '';
    });

    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local') return;
        if (!Object.keys(changes).some(key => key === SETTINGS_KEY || Object.values(LIST_KEYS).includes(key))) return;
        await loadAll();
        render();
    });
}

init();
