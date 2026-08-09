/** Keep the extension surfaces in the same palette as the injected forum UI. */
function applyPageTheme(themeName) {
    const palettes = (window.GLP_SCHEMA && window.GLP_SCHEMA.palettes) || {};
    const palette = palettes[themeName] || palettes.midnight;
    if (!palette) return;
    const rgb = hex => {
        const value = String(hex || '').replace('#', '');
        const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
        const int = parseInt(full, 16);
        if (!Number.isFinite(int) || full.length !== 6) return '74,144,217';
        return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
    };
    const root = document.documentElement.style;
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-rgb', rgb(palette.accent));
    root.setProperty('--link', palette.link);
    root.setProperty('--bg', palette.bg);
}

/* The schema is generated from the engine source, so controls cannot drift from runtime. */
const SETTINGS_KEY = 'glpEnhancedSettings';
const LIST_KEYS = {
    muted: 'glpMutedUsers',
    blocked: 'glpBlockedUsers',
    hidden: 'glpHiddenThreads'
};

const NAV_GROUPS = [
    {
        label: 'Essentials',
        sections: ['Core', 'Ad Removal', 'Registration & Login']
    },
    {
        label: 'Reading',
        sections: [
            'Header Options', 'Navigation', 'Thread List (Forum Page)', 'Post Display (Thread Page)', 'Quote Styling',
            'Visual Enhancements', 'Thread List Enhancements', 'Post Enhancements', 'UI Enhancements'
        ]
    },
    {
        label: 'People & Data',
        sections: [
            'Filtering & Custom', 'Thread Watcher', 'User Intelligence', 'User Data',
            'Media & Embeds', 'Export & Data', 'Muted Users', 'Blocked Users', 'Presets'
        ]
    },
    {
        label: 'System',
        sections: ['Accessibility', 'Miscellaneous']
    }
];

const PAGE_COPY = {
    'Core': ['Runtime foundation', 'Tune the engine without losing the forum underneath it.'],
    'Ad Removal': ['Cleaner reading', 'Control visual noise while keeping the page structure stable.'],
    'Registration & Login': ['Account access', 'Keep sign-in and registration affordances available on your terms.'],
    'Header Options': ['Header studio', 'Shape the first layer of every GLP page.'],
    'Navigation': ['Wayfinding', 'Choose which routes stay one click away.'],
    'Thread List (Forum Page)': ['Forum index', 'Set the density and information hierarchy of thread rows.'],
    'Post Display (Thread Page)': ['Reading canvas', 'Make long threads calmer, clearer, and easier to scan.'],
    'Quote Styling': ['Conversation context', 'Separate quoted material from the live discussion.'],
    'Visual Enhancements': ['Theme studio', 'Create a cohesive palette across every GLP Ultra surface.'],
    'Thread List Enhancements': ['Signal over noise', 'Add useful context to the forum index without clutter.'],
    'Post Enhancements': ['Post toolkit', 'Keep high-value post actions close to the content.'],
    'UI Enhancements': ['Interaction polish', 'Refine feedback, motion, and small interface details.'],
    'Filtering & Custom': ['Content rules', 'Build precise local filters for the feed you want to read.'],
    'Thread Watcher': ['Watch desk', 'Track important threads and surface meaningful changes.'],
    'User Intelligence': ['People context', 'Turn local participation history into useful context.'],
    'User Data': ['Local inventory', 'See what GLP Ultra remembers and keep control of it.'],
    'Media & Embeds': ['Media boundary', 'Balance rich content, performance, and privacy.'],
    'Export & Data': ['Portable settings', 'Move or back up your configuration in a transparent format.'],
    'Muted Users': ['Quiet list', 'Review every locally muted account from one clear table.'],
    'Blocked Users': ['Safety list', 'Manage hard blocks without losing track of who was added.'],
    'Presets': ['Configuration sets', 'Move quickly between purposeful groups of settings.'],
    'Accessibility': ['Inclusive output', 'Prioritize contrast, focus, readability, and reduced motion.'],
    'Miscellaneous': ['Maintenance', 'Keep diagnostics and edge-case behavior tidy.']
};

const schema = window.GLP_SCHEMA;
let settings = {};
let lists = { muted: [], blocked: [], hidden: [] };
let activeSectionTitle = '';
let onlyChanged = false;
let saveTimer = 0;

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

function valuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function isSettingChanged(key) {
    return !valuesEqual(settings[key], schema.defaults[key]);
}

function sectionDefinition(title) {
    return schema.sections.find(section => section.title === title);
}

function sectionGroup(title) {
    return (NAV_GROUPS.find(group => group.sections.includes(title)) || { label: 'Settings' }).label;
}

function sectionChangedCount(sectionDef) {
    return (sectionDef && sectionDef.items ? sectionDef.items : []).filter(item => isSettingChanged(item.key)).length;
}

function setSaveStatus(message, settled = false) {
    const subtitle = document.getElementById('subtitle');
    const dot = document.querySelector('.status-dot');
    if (!subtitle || !dot) return;
    clearTimeout(saveTimer);
    subtitle.textContent = message;
    dot.style.background = settled ? 'var(--ok)' : 'var(--warning)';
    if (!settled) {
        saveTimer = setTimeout(() => setSaveStatus('All changes are saved locally and applied live.', true), 900);
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
    applyPageTheme(settings.colorTheme || 'midnight');
}

async function persistSettings(changes) {
    settings = { ...settings, ...changes };
    setSaveStatus('Saving changes locally...');
    await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(settings) });

    const tabs = await chrome.tabs.query({ url: '*://*.godlikeproductions.com/*' });
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'glp:patch-settings', patch: changes }, () => void chrome.runtime.lastError);
    });
    if (Object.prototype.hasOwnProperty.call(changes, 'colorTheme')) applyPageTheme(changes.colorTheme);
    refreshChangedState();
    setSaveStatus('All changes are saved locally and applied live.', true);
}

async function persistList(name, value) {
    lists[name] = value;
    setSaveStatus('Saving changes locally...');
    await chrome.storage.local.set({ [LIST_KEYS[name]]: JSON.stringify(value) });
    setSaveStatus('All changes are saved locally and applied live.', true);
}

function attachPersistence(input, item, readValue) {
    input.addEventListener('change', async () => {
        await persistSettings({ [item.key]: readValue() });
    });
}

function buildInput(item) {
    const value = settings[item.key];
    const input = item.type === 'textarea'
        ? document.createElement('textarea')
        : (item.type === 'select' ? document.createElement('select') : document.createElement('input'));
    input.id = `setting-${item.key}`;

    if (item.type === 'select') {
        Object.entries(item.options || {}).forEach(([optValue, optLabel]) => {
            const option = document.createElement('option');
            option.value = optValue;
            option.textContent = optLabel;
            if (optValue === value) option.selected = true;
            input.appendChild(option);
        });
        attachPersistence(input, item, () => input.value);
    } else if (item.type === 'textarea') {
        input.value = value || '';
        input.rows = 5;
        attachPersistence(input, item, () => input.value);
    } else if (item.type === 'number') {
        input.type = 'number';
        input.value = value;
        if (item.min !== undefined) input.min = item.min;
        if (item.max !== undefined) input.max = item.max;
        input.step = item.step || 1;
        attachPersistence(input, item, () => parseFloat(input.value));
    } else if (item.type === 'color') {
        input.type = 'color';
        input.value = value || '#4a90d9';
        attachPersistence(input, item, () => input.value);
    } else if (item.type === 'text') {
        input.type = 'text';
        input.value = value || '';
        attachPersistence(input, item, () => input.value);
    } else {
        input.type = 'checkbox';
        input.checked = !!value;
        attachPersistence(input, item, () => input.checked);
    }

    return input;
}

function buildItem(item, sectionTitle) {
    const help = schema.settingDescriptions[item.key] || '';
    const wide = item.type && item.type !== 'checkbox';
    const wrapper = document.createElement('div');
    wrapper.className = `item${wide ? ' wide' : ''}`;
    wrapper.dataset.key = item.key;
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

    const changed = document.createElement('span');
    changed.className = 'changed';
    changed.textContent = 'Customized';
    label.appendChild(changed);

    const input = buildInput(item);
    if (wide) wrapper.append(label, input);
    else wrapper.append(input, label);
    return wrapper;
}

function buildListSection(rows, emptyText, onRemove) {
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
        item.dataset.search = `${row.label} ${row.meta || ''}`.toLowerCase();
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
    section.dataset.title = title;
    section.dataset.search = `${title} ${description || ''}`.toLowerCase();
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

function previewMarkup(title) {
    const row = (width = '72%', accent = false) => `<div class="specimen-line${accent ? ' accent' : ''}" style="width:${width}"></div>`;
    const userRow = (width = '62%', enabled = true) => `<div class="specimen-row"><span class="mini-avatar"></span><span>${row(width, false)}${row('38%', true)}</span>${enabled ? '<span class="mini-switch"></span>' : ''}</div>`;
    const table = `${userRow('72%')}${userRow('56%', false)}${userRow('66%')}`;
    switch (title) {
        case 'Core':
            return `<div class="preview-stat-row"><div class="preview-stat"><strong>128</strong><span>Controls</span></div><div class="preview-stat"><strong>Local</strong><span>Storage</span></div><div class="preview-stat"><strong>Live</strong><span>Sync</span></div></div><div class="flow" style="margin-top:8px"><div class="flow-step">Load safely</div><span class="flow-arrow">&#8594;</span><div class="flow-step">Patch page</div><span class="flow-arrow">&#8594;</span><div class="flow-step">Recover</div></div>`;
        case 'Ad Removal':
            return `<div class="specimen-bar"><span class="specimen-dot accent"></span><span class="specimen-dot"></span><span class="specimen-dot"></span></div><div class="specimen-row"><span class="mini-avatar"></span><span>${row('82%')}${row('54%')}</span><span style="color:var(--subtle);font-size:9px">CONTENT</span></div><div class="specimen-row" style="opacity:.35"><span class="mini-avatar"></span><span>${row('63%')}${row('42%')}</span><span style="color:var(--danger);font-size:9px">HIDDEN</span></div>`;
        case 'Registration & Login':
            return `<div class="flow"><div class="flow-step">Guest</div><span class="flow-arrow">&#8594;</span><div class="flow-step">Sign in</div><span class="flow-arrow">&#8594;</span><div class="flow-step">Member tools</div></div><div class="specimen-quote" style="margin-top:9px">Account actions stay visible only when they are useful.</div>`;
        case 'Header Options':
            return `<div class="specimen-bar"><span class="specimen-dot accent"></span><span style="font-size:10px;font-weight:800">GODLIKE PRODUCTIONS</span><span style="margin-left:auto;color:var(--subtle);font-size:9px">SEARCH &nbsp; ACCOUNT</span></div>${row('100%', true)}${row('72%')}${row('46%')}`;
        case 'Navigation':
            return `<div class="flow"><div class="flow-step">Forum</div><div class="flow-step" style="border-color:var(--accent);color:#fff">Active threads</div><div class="flow-step">Favorites</div><div class="flow-step">Account</div></div>${row('100%', true)}${row('78%')}`;
        case 'Thread List (Forum Page)':
        case 'Thread List Enhancements':
            return table;
        case 'Post Display (Thread Page)':
            return `${userRow('48%', false)}<div class="specimen-quote" style="margin-top:6px">A focused reading surface separates author context, quotes, and the current reply.</div>`;
        case 'Quote Styling':
            return `<div class="specimen-quote"><strong style="display:block;color:var(--accent);margin-bottom:5px">Quoted context</strong>Distinct borders and measured contrast keep nested conversation readable.</div><div class="specimen-quote" style="margin:7px 0 0 18px;opacity:.72">Nested quote depth remains obvious.</div>`;
        case 'Visual Enhancements':
            return `<div class="swatches"><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span></div><div class="specimen-bar" style="margin:11px 0 0"><span style="color:var(--subtle);font-size:9px">OLED BLACK</span><span style="margin-left:auto;color:var(--accent);font-size:9px">AA CONTRAST</span></div><div class="specimen-quote" style="margin-top:18px"><strong style="display:block;margin-bottom:8px;color:var(--text);font:20px/1.2 Georgia,serif">The quick brown fox jumps over the lazy dog.</strong>GLP Ultra lets you tune type scale, line height, and reading width while preserving a calm hierarchy.</div><div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-soft)">${row('92%', true)}${row('74%')}${row('83%')}${row('58%')}</div>`;
        case 'Post Enhancements':
            return `${userRow('68%', false)}<div class="flow" style="margin-top:8px"><div class="flow-step">Quote</div><div class="flow-step">Copy link</div><div class="flow-step">Note</div><div class="flow-step">Block</div></div>`;
        case 'UI Enhancements':
            return `<div class="preview-stat-row"><div class="preview-stat"><strong>180ms</strong><span>Motion</span></div><div class="preview-stat"><strong>Clear</strong><span>Feedback</span></div><div class="preview-stat"><strong>0</strong><span>Distractions</span></div></div>${row('100%', true)}${row('64%')}`;
        case 'Filtering & Custom':
            return `<div class="flow"><div class="flow-step">Keyword</div><span class="flow-arrow">+</span><div class="flow-step">Author</div><span class="flow-arrow">&#8594;</span><div class="flow-step" style="border-color:var(--accent)">Hide row</div></div><div class="specimen-quote" style="margin-top:9px">Rules run locally. One rule per line keeps the system inspectable.</div>`;
        case 'Thread Watcher':
            return `<div class="specimen-row"><span class="mini-avatar"></span><span>${row('74%', true)}${row('43%')}</span><span style="color:var(--ok);font-size:9px">3 NEW</span></div><div class="specimen-row"><span class="mini-avatar"></span><span>${row('58%')}${row('35%')}</span><span style="color:var(--subtle);font-size:9px">QUIET</span></div>`;
        case 'User Intelligence':
            return `<div class="preview-stat-row"><div class="preview-stat"><strong>42</strong><span>Seen</span></div><div class="preview-stat"><strong>8</strong><span>Tagged</span></div><div class="preview-stat"><strong>12d</strong><span>History</span></div></div>${userRow('63%', false)}`;
        case 'User Data':
            return `<div class="preview-stat-row"><div class="preview-stat"><strong>${lists.muted.length}</strong><span>Muted</span></div><div class="preview-stat"><strong>${lists.blocked.length}</strong><span>Blocked</span></div><div class="preview-stat"><strong>${lists.hidden.length}</strong><span>Hidden</span></div></div><div class="specimen-quote" style="margin-top:8px">Your local inventory is exportable and removable at any time.</div>`;
        case 'Media & Embeds':
            return `<div style="display:grid;grid-template-columns:1.4fr .6fr;gap:7px"><div style="min-height:78px;display:grid;place-items:center;border:1px solid var(--border-soft);background:#08101b;color:var(--accent);font-size:10px">MEDIA PREVIEW</div><div>${row('100%', true)}${row('82%')}${row('65%')}</div></div><div class="specimen-bar" style="margin:9px 0 0;color:var(--subtle);font-size:9px">Click-to-load keeps external media under your control.</div>`;
        case 'Export & Data':
            return `<div class="flow"><div class="flow-step">Settings</div><span class="flow-arrow">+</span><div class="flow-step">Local lists</div><span class="flow-arrow">&#8594;</span><div class="flow-step" style="border-color:var(--accent)">JSON backup</div></div><div class="specimen-quote" style="margin-top:9px">Readable, portable, and versioned.</div>`;
        case 'Muted Users':
        case 'Blocked Users':
            return table;
        case 'Presets':
            return `<div class="flow"><div class="flow-step" style="border-color:var(--accent)">Balanced</div><div class="flow-step">Quiet reading</div><div class="flow-step">Power user</div></div><div class="swatches" style="margin-top:9px"><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span></div>`;
        case 'Accessibility':
            return `<div class="contrast-sample"><div><strong>High contrast</strong><br>Visible focus and readable type.</div><div><strong>Dark surface</strong><br>Reduced glare without lost detail.</div></div>`;
        case 'Miscellaneous':
            return `<div class="flow"><div class="flow-step">Diagnostics</div><span class="flow-arrow">&#8594;</span><div class="flow-step">Recovery</div><span class="flow-arrow">&#8594;</span><div class="flow-step" style="border-color:var(--ok)">Healthy</div></div>${row('100%', true)}${row('71%')}`;
        default:
            return `${row('100%', true)}${row('78%')}${row('56%')}`;
    }
}

function buildPagePreview(title) {
    const preview = document.createElement('div');
    preview.className = 'page-preview';
    const grid = document.createElement('div');
    grid.className = 'preview-grid';
    const copy = document.createElement('div');
    copy.className = 'preview-copy';
    const label = document.createElement('span');
    label.className = 'preview-label';
    label.textContent = 'Live preview';
    const heading = document.createElement('strong');
    const pageCopy = PAGE_COPY[title] || ['Settings preview', 'Make this page work the way you do.'];
    heading.textContent = pageCopy[0];
    const description = document.createElement('p');
    description.textContent = pageCopy[1];
    copy.append(label, heading, description);
    const stage = document.createElement('div');
    stage.className = 'preview-stage';
    const specimen = document.createElement('div');
    specimen.className = 'specimen';
    specimen.innerHTML = previewMarkup(title);
    stage.appendChild(specimen);
    grid.append(copy, stage);
    preview.appendChild(grid);
    return preview;
}

function renderNavigation() {
    const nav = document.getElementById('section-nav');
    nav.replaceChildren();
    let sequence = 1;
    NAV_GROUPS.forEach(group => {
        const present = group.sections.filter(title => sectionDefinition(title));
        if (!present.length) return;
        const groupEl = document.createElement('div');
        groupEl.className = 'nav-group';
        const heading = document.createElement('span');
        heading.className = 'nav-group-title';
        heading.textContent = group.label;
        groupEl.appendChild(heading);
        present.forEach(title => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nav-item';
            button.dataset.sectionTitle = title;
            const icon = document.createElement('span');
            icon.className = 'nav-icon';
            icon.textContent = String(sequence++).padStart(2, '0');
            const label = document.createElement('span');
            label.className = 'nav-label';
            label.textContent = title.replace(' (Forum Page)', '').replace(' (Thread Page)', '');
            const badge = document.createElement('span');
            badge.className = 'nav-badge';
            button.append(icon, label, badge);
            button.addEventListener('click', () => activateSection(title, { scroll: true }));
            groupEl.appendChild(button);
        });
        nav.appendChild(groupEl);
    });
}

function render() {
    const host = document.getElementById('sections');
    host.replaceChildren();

    schema.sections.forEach(sectionDef => {
        const description = schema.sectionDescriptions[sectionDef.title] || '';
        const section = sectionShell(sectionDef.title, description);
        section.appendChild(buildPagePreview(sectionDef.title));
        const body = document.createElement('div');
        body.className = 'section-body';

        if (sectionDef.specialId === 'mute-list') {
            body.appendChild(buildListSection(
                lists.muted.map(name => ({ id: name, label: name })),
                'No muted users yet. Muted accounts will appear here.',
                async id => persistList('muted', lists.muted.filter(user => user !== id))
            ));
        } else if (sectionDef.specialId === 'block-list') {
            body.appendChild(buildListSection(
                lists.blocked.map(entry => (typeof entry === 'object' && entry
                    ? { id: entry.id, label: entry.name || `User ${entry.id}`, meta: `#${entry.id}` }
                    : { id: String(entry), label: `User ${entry}`, meta: `#${entry}` })),
                'No blocked users yet. Use the Block button on any post author.',
                async id => persistList('blocked', lists.blocked.filter(entry => String(typeof entry === 'object' && entry ? entry.id : entry) !== String(id)))
            ));
        } else if (sectionDef.specialId === 'user-data') {
            const note = document.createElement('div');
            note.className = 'empty';
            note.textContent = 'Exports include mutes, blocks, tags, private notes, hidden threads, and local poster history. History clearing with undo remains available in the in-page control center.';
            body.appendChild(note);
            body.appendChild(buildListSection(
                lists.hidden.map(entry => (typeof entry === 'object' && entry
                    ? { id: entry.id, label: entry.title || entry.id }
                    : { id: String(entry), label: String(entry) })),
                'No hidden threads.',
                async id => persistList('hidden', lists.hidden.filter(entry => String(typeof entry === 'object' && entry ? entry.id : entry) !== String(id)))
            ));
        } else if (sectionDef.specialId === 'presets') {
            const note = document.createElement('div');
            note.className = 'empty';
            note.textContent = 'Preset application stays in the in-page control center so every multi-setting change can offer an immediate undo.';
            body.appendChild(note);
        } else {
            sectionDef.items.forEach(item => body.appendChild(buildItem(item, sectionDef.title)));
        }

        section.appendChild(body);
        host.appendChild(section);
    });

    renderNavigation();
    if (!sectionDefinition(activeSectionTitle)) activeSectionTitle = schema.sections[0].title;
    refreshChangedState();
    applySearch();
}

function updatePageHero(title) {
    const sectionDef = sectionDefinition(title);
    if (!sectionDef) return;
    const copy = PAGE_COPY[title];
    document.getElementById('page-eyebrow').textContent = sectionGroup(title);
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-description').textContent =
        schema.sectionDescriptions[title] || (copy ? copy[1] : 'Configure this part of GLP Ultra.');
    const count = (sectionDef.items || []).length;
    document.getElementById('metric-controls').textContent = count || 'Manage';
    document.getElementById('metric-enabled').textContent = (sectionDef.items || [])
        .filter(item => item.type !== 'number' && item.type !== 'text' && item.type !== 'textarea' && item.type !== 'select' && item.type !== 'color' && !!settings[item.key]).length;
    document.getElementById('metric-custom').textContent = sectionChangedCount(sectionDef);
    document.title = `${title} - GLP Ultra`;
}

function activateSection(title, options = {}) {
    const target = document.querySelector(`.section[data-title="${CSS.escape(title)}"]`);
    if (!target || target.classList.contains('search-hidden')) return;
    activeSectionTitle = title;
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('page-active', section.dataset.title === title);
    });
    document.querySelectorAll('.nav-item').forEach(button => {
        const active = button.dataset.sectionTitle === title;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    updatePageHero(title);
    if (options.scroll) document.querySelector('.content').scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshChangedState() {
    let total = 0;
    document.querySelectorAll('.item[data-key]').forEach(item => {
        const changed = isSettingChanged(item.dataset.key);
        item.classList.toggle('is-changed', changed);
        if (changed) total++;
    });
    document.getElementById('changed-total').textContent = total;
    document.querySelectorAll('.nav-item').forEach(button => {
        const count = sectionChangedCount(sectionDefinition(button.dataset.sectionTitle));
        const badge = button.querySelector('.nav-badge');
        if (badge) badge.textContent = count ? String(count) : '';
    });
    if (activeSectionTitle) updatePageHero(activeSectionTitle);
    if (onlyChanged) applySearch();
}

function applySearch() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const candidates = [];

    document.querySelectorAll('.section').forEach(section => {
        const sectionDef = sectionDefinition(section.dataset.title);
        const titleMatches = !query || (section.dataset.search || '').includes(query);
        const items = [...section.querySelectorAll('.item')];
        const rows = [...section.querySelectorAll('.list-row')];
        let visibleItems = 0;

        items.forEach(item => {
            const queryMatch = titleMatches || !query || (item.dataset.search || '').includes(query);
            const changedMatch = !onlyChanged || isSettingChanged(item.dataset.key);
            const visible = queryMatch && changedMatch;
            item.classList.toggle('filtered', !visible);
            if (visible) visibleItems++;
        });

        rows.forEach(row => {
            const visible = !query || titleMatches || (row.dataset.search || '').includes(query);
            row.classList.toggle('filtered', !visible);
        });
        const visibleRows = rows.filter(row => !row.classList.contains('filtered')).length;
        const changed = sectionChangedCount(sectionDef);
        const specialVisible = items.length === 0 && (!query || titleMatches || visibleRows > 0) && (!onlyChanged || changed > 0);
        const visible = items.length ? visibleItems > 0 : specialVisible;
        section.classList.toggle('search-hidden', !visible);
        if (visible) candidates.push(section.dataset.title);
    });

    document.querySelectorAll('.nav-item').forEach(button => {
        button.classList.toggle('search-hidden', !candidates.includes(button.dataset.sectionTitle));
    });
    document.querySelectorAll('.nav-group').forEach(group => {
        group.classList.toggle('search-hidden', !group.querySelector('.nav-item:not(.search-hidden)'));
    });

    const summary = document.getElementById('search-summary');
    summary.textContent = query || onlyChanged
        ? `${candidates.length} page${candidates.length === 1 ? '' : 's'}`
        : `${schema.sections.length} pages`;

    if (!candidates.length) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('page-active'));
        document.getElementById('page-eyebrow').textContent = 'Search';
        document.getElementById('page-title').textContent = 'No settings found';
        document.getElementById('page-description').textContent = 'Try a broader term or turn off Only changed.';
        document.getElementById('metric-controls').textContent = '0';
        document.getElementById('metric-enabled').textContent = '0';
        document.getElementById('metric-custom').textContent = '0';
        return;
    }

    activateSection(candidates.includes(activeSectionTitle) ? activeSectionTitle : candidates[0]);
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
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `glp-ultra-settings-v${schema.version}.json`;
    anchor.click();
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
    el.textContent = 'All settings reset to defaults. ';
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
    await loadAll();
    document.getElementById('brand-version').textContent = `v${schema.version}`;
    activeSectionTitle = schema.sections[0].title;
    render();

    const search = document.getElementById('search');
    search.addEventListener('input', applySearch);
    search.addEventListener('keydown', event => {
        if (event.key === 'Escape' && search.value) {
            search.value = '';
            applySearch();
        }
    });
    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            search.focus();
            search.select();
        }
    });

    document.getElementById('only-changed').addEventListener('click', event => {
        onlyChanged = !onlyChanged;
        event.currentTarget.setAttribute('aria-pressed', String(onlyChanged));
        applySearch();
    });
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
