// ==UserScript==
// @name         GLP Ultra
// @namespace    https://github.com/SysAdminDoc/GLP-Ultra
// @version      3.8.3
// @description  Responsive dark themes, cleaner threads, filtering, moderation, and exports for Godlike Productions.
// @author       Matthew Parker
// @updateURL    https://raw.githubusercontent.com/SysAdminDoc/GLP-Ultra/main/dist/glp-ultra.meta.js
// @downloadURL  https://raw.githubusercontent.com/SysAdminDoc/GLP-Ultra/main/dist/glp-ultra.user.js
// @match        *://www.godlikeproductions.com/*
// @match        *://godlikeproductions.com/*
// @icon         https://www.godlikeproductions.com/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // The extension manifest is explicitly top-frame-only. Userscript managers inject into
    // matching child frames unless told otherwise, so keep the two distributions equivalent
    // even if a manager ignores or predates the metadata directive.
    if (window.top !== window.self) return;

    const SCRIPT_VERSION = '3.8.3';

    // ============================================
    // DEFAULT SETTINGS
    // ============================================
    const DEFAULT_SETTINGS = {
        // Core
        enabled: true,
        safeMode: false,
        overrideDarkReader: true,

        // Ad Removal
        removeAds: true,
        removeWidgets: true,
        removeMsgAds: true,
        removeAmpEmbeds: true,

        // Registration Nag
        autoBypassRegNag: true,

        // Header Options
        hideHeaderBanner: true,
        hideStatsBar: true,
        hideHeaderTime: true,
        hideLoginLinks: true,
        hideNotifications: false,
        hideThemeSwitcher: true,
        hideViewportToggle: true,
        compactHeader: true,

        // Navigation
        hideTopLinks: true,
        hideMainNav: true,
        hideTabNav: true,
        hideThreadControls: true,
        hideRSS: true,
        hideChatRoom: true,
        hideJoinLink: true,
        hideMobilePostNew: true,
        hideExtrasMenu: false,
        compactNav: true,
        stickyNav: false,

        // Thread List (Forum Page)
        hideIconColumn: false,
        hideRatingColumn: true,
        hideViewsColumn: false,
        hidePostedColumn: true,
        hideUpdatedColumn: false,
        hidePosterColumn: false,
        hideRepliesColumn: false,
        hidePageLinks: true,
        hideMobileThreadMeta: true,
        hideThreadHeaderRow: true,
        hideForumPageNav: false,
        compactThreadList: true,
        sortControls: true,
        defaultSortByNew: false,
        hidePinnedThreads: false,
        highlightPinnedThreads: true,
        highlightSuperPins: true,
        highlightOP: true,
        zebraStripes: true,

        // Post Display (Thread Page)
        hideAvatars: false,
        hideKarmaBar: true,
        hideUserID: false,
        hideGeoLocation: false,
        hidePostDate: false,
        hideReportLinks: true,
        hideSignatures: true,
        hideLastEdited: true,
        hideRateSection: true,
        hidePostActions: false,
        hideReplyTitles: true,
        hideSubscriberBadge: false,
        hideInlineReplyAds: true,
        compactPosts: true,
        compactPostTitle: true,
        widerContent: true,
        smallerAvatars: true,
        collapseLongQuotes: true,
        readerMode: false,
        hideRelatedThreads: true,

        // Quote Styling
        compactQuotes: true,
        quoteDepthBadges: true,
        collapseNestedQuotes: true,
        collapseQuotesByDefault: false,
        quoteBorderColor: 'var(--glpx-accent)',
        quoteBacklinks: true,

        // Visual Enhancements
        colorTheme: 'midnight',
        shapeStyle: 'default',
        fontSize: 14,
        lineHeight: 1.5,
        maxContentWidth: 0,
        darkModeEnhance: true,
        smoothScrolling: true,

        // Thread List Enhancements
        dimVisitedThreads: true,
        truncateTitles: true,
        hotThreadBadge: true,

        // Post Enhancements
        dimAnonPosters: true,
        hideEmoticons: false,
        compactFlags: true,
        highlightOPPosts: true,
        relativeTimestamps: true,
        inlinePostNumbers: true,
        postPermalinks: true,
        youtubeEmbed: true,
        opPostNav: true,
        collapseExpandAll: true,
        threadQuickSearch: true,

        // UI Enhancements
        backToTopButton: true,
        imageLightbox: true,
        imageGallery: true,
        collapsiblePosts: true,
        infiniteScroll: true,
        infiniteThreadScroll: true,
        freshnessColors: true,
        userMuteList: true,
        userTags: true,
        scrollProgress: true,
        threadPreview: true,
        autoRefresh: false,
        autoRefreshInterval: 60,

        // Filtering
        hideThreadButtons: true,
        userBlockList: true,
        hideMemeReplies: false,
        hideBoomerGifs: false,
        keywordHighlight: '',
        keywordHide: '',
        customCSS: '',

        // Watcher
        watcherEnabled: false,
        watcherIntervalMinutes: 15,
        watcherDigest: true,
        watcherBadge: true,
        watcherPauseHidden: true,

        // User Intelligence
        userMuteMatchMode: 'exact',
        userNotes: true,
        userReputationOverlay: false,
        userHistoryCap: 400,

        // Media
        mediaPrivacyMode: true,
        mediaActions: true,
        mediaXEmbeds: true,
        mediaHoverPreview: false,
        mediaHoverPreviewSize: 70,

        // Export & Data
        exportThreadMarkdown: true,
        exportThreadHtml: true,
        exportThreadJson: true,
        exportMediaManifest: true,
        exportCopyThreadLink: true,

        // Accessibility
        reduceMotion: false,
        highContrast: false,
        largeTargets: false,

        // Misc
        autoExpandImages: false,
        hideFooter: true,
        hideAllClfix: true,
        updateNotices: true,
        syncSettings: false,
        noiseBudget: true
    };

    const SECTION_DESCRIPTIONS = {
        'Core': 'Master controls for GLP Ultra itself.',
        'Ad Removal': 'Quiet the page by removing ad slots, embeds, and visual interruptions.',
        'Registration & Login': 'Keep account prompts and login surfaces under control.',
        'Header Options': 'Trim the top chrome while preserving access to important site actions.',
        'Navigation': 'Reduce nav clutter and keep movement through GLP predictable.',
        'Thread List (Forum Page)': 'Tune feed density, columns, and scan behavior.',
        'Post Display (Thread Page)': 'Refine thread readability and reduce repeated metadata.',
        'Quote Styling': 'Make quoted material easier to scan without losing context.',
        'Visual Enhancements': 'Control the dark theme, type scale, and reading width.',
        'Thread List Enhancements': 'Add useful ranking, freshness, and visited-thread cues.',
        'Post Enhancements': 'Add reader tools for posts, timestamps, OP replies, and links.',
        'UI Enhancements': 'Enable high-value helpers for scrolling, media, previews, and feedback.',
        'Filtering & Custom': 'Filter noisy topics, low-effort replies, and add carefully scoped custom CSS.',
        'Thread Watcher': 'Follow threads and see what changed without leaving them open in tabs.',
        'User Intelligence': 'Local-only knowledge about the people you read. None of it leaves this browser.',
        'User Data': 'Back up or clear everything GLP Ultra has learned about users.',
        'Media & Embeds': 'Decide how third-party media behaves before it can phone home.',
        'Export & Data': 'Save a thread as a clean local file. Nothing is uploaded anywhere.',
        'Muted Users': 'Review and restore users muted by the local script.',
        'Blocked Users': 'Review and restore users blocked by numeric user ID.',
        'Presets': 'One-click configurations for common browsing modes.',
        'Accessibility': 'Motion, contrast, and target size. These override the theme, not the other way round.',
        'Miscellaneous': 'Low-level cleanup options for GLP layout cruft.'
    };

    const SETTING_DESCRIPTIONS = {
        enabled: 'Turns every GLP Ultra page modification on or off without clearing saved settings.',
        overrideDarkReader: 'Tells Dark Reader to leave this site alone while GLP Ultra is theming it. Two dark themes over one page wash out every colour the theme picked.',
        safeMode: 'Ignores your custom CSS for this browser. The way back when a rule you pasted has hidden the controls you would need to remove it.',
        removeAds: 'Targets MGID and common ad containers.',
        removeWidgets: 'Removes empty widget placeholders after ads are hidden.',
        removeMsgAds: 'Hides ad rows injected into thread pages.',
        removeAmpEmbeds: 'Removes AMP embed blocks used by ad widgets.',
        autoBypassRegNag: 'Skips the registration interstitial when GLP exposes a bypass link.',
        sortControls: 'Adds sort buttons (updated, posted, rating, views, replies) above the thread list.',
        defaultSortByNew: 'Redirects forum pages to newest-first ordering when no sort is specified.',
        hidePinnedThreads: 'Hides pinned and karma-pinned rows from the thread list.',
        collapseQuotesByDefault: 'Starts every collapsible quote chain closed instead of open.',
        shapeStyle: 'Overrides corner treatment across GLP surfaces.',
        userBlockList: 'Adds a Block button to post authors and hides posts from blocked user IDs.',
        hideMemeReplies: 'Hides image-only replies with almost no text.',
        hideBoomerGifs: 'Hides the animated smiley/reaction images GLP serves from /sm/.',
        hideLoginLinks: 'Useful for read-only browsing sessions.',
        compactHeader: 'Compresses header whitespace and redundant breaks.',
        compactNav: 'Keeps navigation available with less vertical weight.',
        stickyNav: 'Pins native navigation while scrolling.',
        compactThreadList: 'Improves feed scanning density.',
        highlightSuperPins: 'Adds a stronger cue for high-priority pinned rows.',
        compactPosts: 'Tightens thread pages for sustained reading.',
        widerContent: 'Lets posts use more horizontal space.',
        collapseLongQuotes: 'Keeps deeply nested quotes from overwhelming posts.',
        readerMode: 'Distraction-free reading surface: hides author metadata, sidebar, and non-essential chrome.',
        hideRelatedThreads: 'Hides the related threads section at the bottom of thread pages.',
        quoteDepthBadges: 'Shows quote nesting depth with a small numbered badge.',
        quoteBacklinks: 'Reads the "Quoting:" links to work out who answered whom, then lists the replies to a post underneath it and adds an in-page jump to the post being quoted.',
        collapseNestedQuotes: 'Collapses quote chains deeper than two levels with an expand toggle.',
        darkModeEnhance: 'Applies the selected GLP Ultra dark theme.',
        smoothScrolling: 'Uses smoother page movement where supported.',
        dimVisitedThreads: 'Makes already-read topics quieter.',
        hotThreadBadge: 'Emphasizes busy threads by reply count.',
        relativeTimestamps: 'Adds quick age cues beside GLP timestamps.',
        postPermalinks: 'Copies a clean link when clicking a post number.',
        youtubeEmbed: 'Embeds YouTube links with the no-cookie player.',
        opPostNav: 'Adds visible previous/next OP controls.',
        collapseExpandAll: 'Adds visible thread-wide collapse tools.',
        threadQuickSearch: 'Adds an on-page thread search control.',
        imageLightbox: 'Opens large post images in a focused viewer.',
        imageGallery: 'Adds previous/next controls inside the image viewer.',
        infiniteScroll: 'Loads more forum rows as you near the end.',
        infiniteThreadScroll: 'Loads more reply pages as you read.',
        userMuteList: 'Adds local mute controls beside authors.',
        userTags: 'Adds private local labels for recurring posters.',
        threadPreview: 'Fetches a small cached preview before opening a thread.',
        autoRefresh: 'Refreshes the thread list on a timer.',
        hideThreadButtons: 'Adds per-row hide controls and a recovery shelf.',
        customCSS: 'Injected after the theme; keep it scoped and reversible.',
        hideAllClfix: 'Removes spacer elements that create dead space.',
        syncSettings: 'Extension only: keeps the settings (not your mutes, blocks, or history) on your browser account so another signed-in device picks them up. Off by default. The most recent change wins; a payload too large for the sync quota stays local and says so in the console.',
        noiseBudget: 'Shows how much this page is having kept off it - ads removed, muted and blocked posts, keyword hits, collapsed quotes - with a breakdown and a route to restore any of it.',
        mediaActions: 'Adds Save / Open / Copy link buttons under every content image in a post. A hotlinked third-party image cannot be fetched from the page, so saving it opens it instead and says so.',
        updateNotices: 'After an update, names the settings this version added so nothing new stays hidden.',
        reduceMotion: 'Stops every animation and transition GLP Ultra adds. Your operating system setting is always honoured; this forces it on regardless.',
        highContrast: 'Raises text and border contrast across the injected UI and stops muted text from fading below a readable level.',
        largeTargets: 'Grows the buttons and chips this script adds to a minimum 32px hit area, without changing the page layout.',
        exportThreadMarkdown: 'Adds a Markdown export button to the thread toolbar. Quotes keep their nesting depth.',
        exportThreadHtml: 'Adds a standalone dark HTML export of the thread with the original post markup preserved.',
        exportThreadJson: 'Adds a structured JSON export: posts, authors, dates, quote depth, links, and media.',
        exportMediaManifest: 'Appends the list of every image, embed, and outbound link found in the thread to each export.',
        exportCopyThreadLink: 'Adds a button that copies the canonical thread URL without page or tracking suffixes.',
        mediaPrivacyMode: 'Third-party embeds load only when you click them, so YouTube and X never see the page unless you ask.',
        mediaXEmbeds: 'Labels X/Twitter embeds and always shows a direct link, so the post is reachable when the widget fails.',
        mediaHoverPreview: 'Hovering a thumbnail or an image link shows the full-size image in a floating panel.',
        mediaHoverPreviewSize: 'Largest share of the viewport a hover preview may cover.',
        userMuteMatchMode: 'How a muted name is matched: exactly, anywhere in the name, or as a regular expression.',
        userNotes: 'Adds a private note field to the tag editor. Notes are stored with the tag and never sent anywhere.',
        userReputationOverlay: 'Counts how often you have seen each poster locally and shows it beside their name. No public scoring, no network calls.',
        userHistoryCap: 'How many posters the local history keeps before the least recently seen are dropped.',
        watcherEnabled: 'Adds a Watch button to threads and checks them on a timer through the shared request queue.',
        watcherIntervalMinutes: 'Minutes between watched-thread checks. Checks are queued, never parallel.',
        watcherDigest: 'Adds a digest panel listing every watched thread, its unread count, and when it was last checked.',
        watcherBadge: 'Shows the total unread count on the digest button, and on the extension toolbar icon.',
        watcherPauseHidden: 'Skips checks entirely while the tab is in the background.'
    };

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function escapeAttribute(value) {
        return escapeHTML(value).replace(/`/g, '&#96;');
    }

    const trustedHTMLPolicy = (() => {
        try {
            if (window.trustedTypes?.createPolicy) {
                return window.trustedTypes.createPolicy('glp-enhanced', {
                    createHTML: value => String(value)
                });
            }
        } catch (e) {
            return null;
        }
        return null;
    })();

    function trustedHTML(value) {
        return trustedHTMLPolicy ? trustedHTMLPolicy.createHTML(value) : String(value);
    }

    function setTrustedHTML(element, html) {
        element.innerHTML = trustedHTML(html);
    }

    function appendHighlightedText(parent, text, regex, className) {
        regex.lastIndex = 0;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            const mark = document.createElement('span');
            mark.className = className;
            mark.textContent = match[0];
            parent.appendChild(mark);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            parent.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
    }

    const ROUTE_PATTERNS = Object.freeze({
        feed: /\/forum\d+\/(?:pg\d+)?$/i,
        thread: /\/forum\d+\/message\d+(?:\/pg\d+)?$/i,
        search: /\/search\.php$/i,
        composer: /\/bbs\/reply\.php$/i,
        profile: /\/members\/|profile|karma/i
    });

    const SELECTOR_REGISTRY = Object.freeze({
        pageRoot: ['html.glp_viewport_mobile', 'body.has_hdr_time_login_row', '#wrap > #wrap_in'],
        headerBanner: ['#glpbanner', '.hdr_banner img', 'img[alt*="Godlike"]'],
        headerTime: ['#glpHeaderTimeSrc', '#glpHeaderTimeDst', '.hdr_time', '.hdr_time_login_row'],
        notifications: ['#glpNotifyToggle', '#glpNotifyMenu', '#glpNotifyList', '.glp_notify_switch', '.glp_notify_menu'],
        themeSwitch: ['#glpThemeMode', '.theme_mode_switch'],
        viewportSwitch: ['#glpViewportToggle', '#glpViewportMeta', '.viewport_mode_switch'],
        topLinks: ['#mainpagetoplinks', '.pagetoplinks2', '.hdr_top'],
        loginLinks: ['#topnavlogin', '.topnav_login', '.loginlinks'],
        // `.mainpagenavlinks` is what the captures actually carry; `.topnav.topnav_main` matches
        // nothing in either one, and bare `.navlinks` also names the thread's own nav rows.
        mainNav: ['.mainpagenavlinks', '.topnav.topnav_main', '.navlinks', '.topnav a'],
        tabNav: ['ul.tabnav', '.tab_forum', '.tab_day', '.tab_extras', '#tab_forum_1', '#tab_curdate'],
        feedContainer: ['#forum_l', '.threads-wrapper'],
        feedTable: ['table.threads'],
        feedHeaderRow: ['table.threads tr.threads_header_row', '.threads tr:first-child'],
        feedRows: ['table.threads tbody tr:not(.threads_header_row)'],
        feedTitleCell: ['table.threads td.sfr', '.threads td[class$="fr"]'],
        feedThreadLink: ['table.threads td.sfr > a[href*="/forum1/message"]', '.threads a[href*="/message"]'],
        feedIconCell: ['td.ifr', '.threads tr > td:nth-child(1)'],
        feedUserCell: ['td.ufr', '.mtd-poster', 'a[href*="/members/"]'],
        feedRepliesCell: ['td.rfr'],
        feedViewsCell: ['td.vifr'],
        feedRatingCell: ['td.hfr'],
        feedPostedCell: ['td.pfr', '.mtd-posted'],
        feedUpdatedCell: ['td.mfr', '.mtd-updated'],
        feedMobileMeta: ['.mobile-thread-meta', '.mobile-thread-meta-details'],
        feedPagination: ['.navpages a[href*="/pg"]', '.footer a[href*="/pg"]', '.navdiv > a[href*="/pg"]'],
        threadTable: ['table.msg'],
        postRows: ['table.msg tr[id^="post_"]'],
        originalPost: ['#post_1', 'table.msg tr[id^="post_"]:first-of-type'],
        postBody: ['.post_main'],
        postAuthor: ['td.messageauthor', 'td.replyauthor'],
        postAuthorName: ['.author_header', 'td.messageauthor b', 'td.replyauthor b'],
        postDate: ['.author_date'],
        postContentCell: ['td.messagecontent', 'td.replycontent'],
        postTitle: ['.msgtitle'],
        postQuote: ['.quoteo', '.post_main div[class*="quote"]'],
        threadTopNav: ['.messagetopnavlinks', '.messagetoplinks', '.glp_msgnav_wrap', '.navctrl'],
        threadBottomNav: ['.messagebottomnavlinks', '.glp_msgnav_wrap'],
        threadVote: ['form[action*="/bbs/vote.php"]', '.thread_top_controls form'],
        threadReplyLink: ['a[href*="/bbs/reply.php"]', 'form[action*="/bbs/reply.php"]'],
        threadSearch: ['#replies_q', '#highlight_q', 'tr#msgsearch form'],
        threadRelated: ['table.threads.related'],
        postActions: ['a[href*="report"]', 'a[href*="reply"]', 'a[href*="karma"]'],
        sidebar: ['#rightpanel_wrap', '#rightpanel_inner', '.rightpanel_ipad'],
        siteSearch: ['form[action*="search.php"] input[name="q"]', 'input[aria-label="Search"]'],
        ads: ['[data-type="_mgwidget"]', 'amp-embed', 'iframe[src*="mgid"]'],
        footer: ['#footer', '.footer'],
        profileLinks: ['a[href*="/members/"]', 'a[href*="profile"]', 'a[href*="karma"]'],
        mediaTwitter: ['iframe[title="X Post"]', 'iframe[data-tweet-id]', 'iframe[src*="twitter"]', 'iframe[src*="x.com"]'],
        mediaYoutube: ['a[href*="youtube.com/watch"]', 'a[href*="youtu.be/"]', 'iframe[src*="youtube"]'],
        registrationNag: ['.prompt-register a[href*="regp="]', '[class*="prompt"] a[href*="regp="]']
    });

    const runtimeState = {
        route: 'generic',
        featuresStarted: false,
        observer: null,
        settingsApplyTimer: null,
        featureErrors: [],
        storageFailures: [],
        storageFailuresReported: new Set(),
        featureTimings: {},
        quoteGraphBound: false,
        mediaActionsBound: false,
        threadPreviewBound: false,
        adsRemoved: 0,
        contextBound: false,
        returnToSettings: null,
        lastContext: null,
        newSettingKeys: [],
        previousVersion: '',
        fetchQueue: [],
        fetchActive: false,
        lastFetchAt: 0,
        fetchFailures: 0,
        fetchBackoffUntil: 0,
        mediaHoverBound: false,
        lightboxBound: false,
        permalinksBound: false,
        contextHandler: null,
        activeFeatureId: null,
        featureResources: new Map(),
        featureListenerSequence: 0,
        routePath: '',
        routeEpoch: 0,
        fetchSequence: 0,
        fetchController: null,
        fetchCache: new Map(),
        routeHooksBound: false,
        migration: {
            schemaVersion: 0,
            source: 'defaults',
            fromVersion: 0,
            migratedKeys: [],
            migratedStores: []
        }
    };

    function featureResourceBucket(featureId = runtimeState.activeFeatureId) {
        if (!featureId) return null;
        let bucket = runtimeState.featureResources.get(featureId);
        if (!bucket) {
            bucket = new Map();
            runtimeState.featureResources.set(featureId, bucket);
        }
        return bucket;
    }

    function registerFeatureCleanup(key, cleanup, featureId = runtimeState.activeFeatureId) {
        if (!featureId || typeof cleanup !== 'function') return;
        const bucket = featureResourceBucket(featureId);
        const resourceKey = String(key || `resource-${++runtimeState.featureListenerSequence}`);
        const previous = bucket.get(resourceKey);
        if (previous) {
            try { previous(); } catch (error) { recordFeatureError(featureId, 'destroy', error); }
        }
        bucket.set(resourceKey, cleanup);
    }

    function addFeatureEventListener(target, type, listener, options, key = type) {
        if (!target?.addEventListener) return;
        target.addEventListener(type, listener, options);
        const owner = runtimeState.activeFeatureId;
        if (!owner) return;
        registerFeatureCleanup(`listener:${key}`, () => target.removeEventListener(type, listener, options), owner);
    }

    function clearFeatureResources(featureId) {
        const bucket = runtimeState.featureResources.get(featureId);
        if (!bucket) return;
        [...bucket.values()].reverse().forEach(cleanup => {
            try { cleanup(); } catch (error) { recordFeatureError(featureId, 'destroy', error); }
        });
        bucket.clear();
        runtimeState.featureResources.delete(featureId);
    }

    function markFeatureOwned(node, featureId = runtimeState.activeFeatureId) {
        if (node?.setAttribute && featureId) node.setAttribute('data-glpx-owner', featureId);
        return node;
    }

    /**
     * Sets the id on a surface this script created, and records that it owns it.
     *
     * Page content can carry any id it likes, including ours. A bare getElementById answers
     * "does something with this id exist", not "did we build it", so a forum post containing
     * `<a id="glp-back-to-top">` made the feature skip its own creation - the re-entry guard saw
     * something already there - and made teardown delete the post's element instead of ours.
     * Ownership is what those guards always meant.
     */
    function ownSurface(node, id) {
        if (!node) return node;
        node.id = id;
        if (node.setAttribute) node.setAttribute('data-glpx-owner', runtimeState.activeFeatureId || 'engine');
        return node;
    }

    /**
     * The surface we own with this id, or null. Deliberately not getElementById: that returns the
     * first match in document order, so a hostile element placed earlier in the page would hide
     * ours and the guard would build a second one.
     */
    function ownedElement(id) {
        return document.querySelector(`#${id}[data-glpx-owner]`);
    }

    function removeOwnedElement(id) {
        const node = ownedElement(id);
        if (node) node.remove();
        return !!node;
    }

    function featureScope(root = document) {
        if (!root || typeof root.querySelectorAll !== 'function') return document;
        // A scoped query does not consider the scope element itself when a selector starts with
        // `.threads` or `.msg`. Lift known container roots one level so fragment processors can
        // keep their stable selectors without falling back to document-wide scans.
        if (root.nodeType === 1) {
            const container = root.matches?.('#forum_l, table.msg, table.threads, #rightpanel_inner, #glpNotifyMenu')
                ? root
                : root.closest?.('#forum_l, table.msg, table.threads, #rightpanel_inner, #glpNotifyMenu');
            if (container?.parentElement) return container.parentElement;
        }
        return root;
    }

    function mutationRoots(nodes) {
        const knownRoot = '#forum_l, table.msg, table.threads, #rightpanel_inner, #glpNotifyMenu';
        return [...new Set(nodes
            .filter(node => node?.nodeType === 1)
            .map(node => {
                const container = node.closest?.(knownRoot);
                return container?.parentElement || node.parentElement || node;
            })
            .filter(Boolean))];
    }

    function queryFeatureNodes(root, selector) {
        const scope = featureScope(root);
        const matches = [...scope.querySelectorAll(selector)];
        if (matches.length) return matches;
        if (scope.nodeType !== 1) return matches;
        if (scope.matches?.('tbody')) return [...scope.children].filter(node => node.matches(selector.split(' ').pop()));
        return scope.matches?.(selector) ? [scope] : matches;
    }

    function wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    function hashFetchedText(text) {
        let hash = 2166136261;
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16);
    }

    function fetchQueued(url, options = {}) {
        return new Promise((resolve, reject) => {
            runtimeState.fetchQueue.push({
                url,
                options,
                resolve,
                reject,
                routeEpoch: runtimeState.routeEpoch,
                sequence: runtimeState.fetchSequence++,
                priority: Number(options.priority) || 0
            });
            runtimeState.fetchQueue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
            processFetchQueue();
        });
    }

    function fetchTextQueued(url, options = {}) {
        return fetchQueued(url, { ...options, responseType: 'text' });
    }

    function fetchResponseQueued(url, options = {}) {
        return fetchQueued(url, { ...options, responseType: 'response' });
    }

    // The floor between requests, and the ceiling on how far failure backs us off. A watcher
    // with twenty threads on it is twenty requests per cycle, so the failure path is the one that
    // decides whether a bad afternoon looks like a client or looks like a flood.
    const FETCH_BACKOFF_CAP_MS = 60000;

    function fetchRetryDelay(response) {
        if (!response || (response.status !== 429 && response.status !== 503)) return 0;
        const header = response.headers?.get?.('retry-after');
        if (!header) return 0;
        const seconds = Number(header);
        if (Number.isFinite(seconds)) return Math.min(Math.max(seconds, 0) * 1000, FETCH_BACKOFF_CAP_MS);
        const date = Date.parse(header);
        if (!Number.isFinite(date)) return 0;
        return Math.min(Math.max(date - Date.now(), 0), FETCH_BACKOFF_CAP_MS);
    }

    async function processFetchQueue() {
        if (runtimeState.fetchActive) return;
        runtimeState.fetchActive = true;

        while (runtimeState.fetchQueue.length > 0) {
            if (document.hidden) {
                await wait(1000);
                continue;
            }

            const next = runtimeState.fetchQueue.shift();
            if (next.routeEpoch !== runtimeState.routeEpoch) {
                next.reject(new Error('background request cancelled after route change'));
                continue;
            }
            const minDelay = next.options.minDelay ?? 1000;
            // Failures used to leave lastFetchAt untouched, so a run of them made `elapsed` large
            // and the limiter waited for nothing: the queue then drained as fast as the network
            // could refuse it. Both outcomes stamp the clock now, and a refusal also backs off.
            const backoffWait = runtimeState.fetchBackoffUntil - Date.now();
            if (backoffWait > 0) await wait(Math.min(backoffWait, FETCH_BACKOFF_CAP_MS));
            const elapsed = Date.now() - runtimeState.lastFetchAt;
            if (elapsed < minDelay) await wait(minDelay - elapsed);

            let response = null;
            try {
                const cached = next.options.cacheKey && runtimeState.fetchCache.get(next.options.cacheKey);
                if (cached && cached.expiresAt > Date.now() && next.options.responseType !== 'response') {
                    next.resolve(cached.text);
                    continue;
                }

                const fetchOptions = { ...(next.options.fetchOptions || {}) };
                if (!fetchOptions.signal) {
                    runtimeState.fetchController = new AbortController();
                    fetchOptions.signal = runtimeState.fetchController.signal;
                }
                response = await fetch(next.url, fetchOptions);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                if (next.routeEpoch !== runtimeState.routeEpoch) {
                    next.reject(new Error('background request cancelled after route change'));
                    continue;
                }
                if (next.options.responseType === 'response') {
                    runtimeState.fetchFailures = 0;
                    runtimeState.fetchBackoffUntil = 0;
                    next.resolve(response);
                    continue;
                }
                const text = await response.text();
                if (next.options.cacheKey) {
                    runtimeState.fetchCache.set(next.options.cacheKey, {
                        hash: hashFetchedText(text),
                        text,
                        expiresAt: Date.now() + (next.options.cacheTtl ?? 300000)
                    });
                }
                runtimeState.fetchFailures = 0;
                runtimeState.fetchBackoffUntil = 0;
                next.resolve(text);
            } catch (error) {
                runtimeState.fetchFailures += 1;
                // The server's own number when it gave one, otherwise back off exponentially from
                // the caller's floor. Capped, so a long outage does not park the queue for hours.
                const stated = fetchRetryDelay(response);
                const backoff = stated || Math.min(minDelay * (2 ** runtimeState.fetchFailures), FETCH_BACKOFF_CAP_MS);
                runtimeState.fetchBackoffUntil = Date.now() + backoff;
                next.reject(error);
            } finally {
                runtimeState.lastFetchAt = Date.now();
                runtimeState.fetchController = null;
            }
        }

        runtimeState.fetchActive = false;
    }

    function abortQueuedBackgroundWork(reason = 'route changed') {
        runtimeState.routeEpoch += 1;
        const error = new Error(`background request cancelled: ${reason}`);
        runtimeState.fetchQueue.splice(0).forEach(item => item.reject(error));
        runtimeState.fetchController?.abort();
        runtimeState.fetchController = null;
    }

    function handleVisibilityChange() {
        if (!document.hidden) {
            processFetchQueue();
            if (runtimeState.featuresStarted && settings.watcherEnabled) renderWatchControls();
        }
    }

    // direct-listener: engine lifetime, paused timers follow the tab for the life of the page.
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function classifyRoute(pathname = window.location.pathname) {
        if (ROUTE_PATTERNS.thread.test(pathname)) return 'thread';
        if (ROUTE_PATTERNS.feed.test(pathname)) return 'feed';
        if (ROUTE_PATTERNS.search.test(pathname)) return 'search';
        if (ROUTE_PATTERNS.composer.test(pathname)) return 'composer';
        if (ROUTE_PATTERNS.profile.test(pathname)) return 'profile';
        return 'generic';
    }

    function runRouteSanity({ forceApply = false } = {}) {
        const path = window.location.pathname;
        const route = classifyRoute(path);
        const changed = runtimeState.routePath && runtimeState.routePath !== path;
        if (changed) {
            abortQueuedBackgroundWork('route changed');
            if (runtimeState.featuresStarted) destroyEnhancedUI({ keepStyles: true });
        }
        runtimeState.routePath = path;
        runtimeState.route = route;

        if (!settings.enabled) return;
        if (!runtimeState.featuresStarted) {
            startFeatures();
        } else if (changed || forceApply) {
            runFeatureRegistry('apply');
        }
    }

    function bindRouteHooks() {
        if (runtimeState.routeHooksBound) return;
        runtimeState.routeHooksBound = true;
        // direct-listener: route lifecycle, bound once and never torn down.
        window.addEventListener('pageshow', () => runRouteSanity({ forceApply: true }));
        // direct-listener: route lifecycle.
        window.addEventListener('popstate', () => runRouteSanity());
        // direct-listener: route lifecycle.
        window.addEventListener('hashchange', () => runRouteSanity({ forceApply: true }));
    }

    // Surfaces that must resolve on a given route. A miss here is a real site change, not a
    // feature that simply has nothing to do on this page - which is what makes the health
    // report worth reading instead of a wall of "not on this page".
    const ROUTE_SURFACES = Object.freeze({
        feed: ['pageRoot', 'mainNav', 'feedTable', 'feedRows', 'feedTitleCell', 'feedThreadLink', 'feedPostedCell'],
        // The thread route has no site-wide main nav - its nav rows are the thread's own.
        thread: ['pageRoot', 'threadTopNav', 'threadTable', 'postRows', 'postBody', 'postAuthorName', 'postDate', 'postTitle'],
        search: ['pageRoot', 'mainNav'],
        composer: ['pageRoot', 'mainNav'],
        profile: ['pageRoot', 'mainNav'],
        generic: ['pageRoot']
    });

    /**
     * Which selector in each registry entry is actually carrying the page. The first entry is
     * the primary; anything below it is a fallback that only matches once the site has drifted,
     * so a fallback hit is an early warning and a total miss on an expected surface is a break.
     */
    function selectorHealth(route = runtimeState.route) {
        const expected = new Set(ROUTE_SURFACES[route] || ROUTE_SURFACES.generic);
        return Object.keys(SELECTOR_REGISTRY).map(key => {
            const selectors = SELECTOR_REGISTRY[key];
            const index = selectors.findIndex(selector => {
                try {
                    return !!document.querySelector(selector);
                } catch (error) {
                    return false;
                }
            });
            const required = expected.has(key);
            let status = 'primary';
            if (index < 0) status = required ? 'missing' : 'absent';
            else if (index > 0) status = 'fallback';
            return { key, status, required, selector: index < 0 ? null : selectors[index], depth: index };
        });
    }

    function selectorWarnings(route = runtimeState.route) {
        return selectorHealth(route).filter(entry => entry.status === 'missing' || entry.status === 'fallback');
    }

    function querySurface(surfaceKey, root = document) {
        const selectors = SELECTOR_REGISTRY[surfaceKey] || [];
        for (const selector of selectors) {
            const match = root.querySelector(selector);
            if (match) return match;
        }
        return null;
    }

    function queryAllSurface(surfaceKey, root = document) {
        const selectors = SELECTOR_REGISTRY[surfaceKey] || [];
        const found = new Set();
        selectors.forEach(selector => {
            root.querySelectorAll(selector).forEach(node => found.add(node));
        });
        return Array.from(found);
    }

    function waitForElement(surfaceKey, { root = document, timeout = 5000, backoff = 100 } = {}) {
        const scope = featureScope(root);
        const deadline = Date.now() + Math.max(0, timeout);
        const find = (delay = backoff) => {
            const match = querySurface(surfaceKey, scope);
            if (match || Date.now() >= deadline) return Promise.resolve(match || null);
            return new Promise(resolve => window.setTimeout(() => resolve(find(Math.min(delay * 1.5, 500))), delay));
        };
        return find();
    }

    function scopeCustomCSS(cssText) {
        const raw = String(cssText || '').trim();
        if (!raw) return '';

        return raw.split('}').map(block => {
            const parts = block.split('{');
            if (parts.length < 2) return '';
            const selector = parts.shift().trim();
            const body = parts.join('{').trim();
            if (!selector || !body) return '';
            if (selector.startsWith('@')) return `${selector} { ${body} }`;
            const scopedSelectors = selector.split(',').map(part => {
                const trimmed = part.trim();
                if (!trimmed) return '';
                if (trimmed.startsWith('body.glpx-enabled') || trimmed.startsWith('body.glp-enhanced-active')) {
                    return trimmed;
                }
                if (trimmed.startsWith('body')) {
                    return trimmed.replace(/^body\b/, 'body.glpx-enabled');
                }
                return `body.glpx-enabled ${trimmed}`;
            }).filter(Boolean).join(', ');
            return `${scopedSelectors} { ${body} }`;
        }).filter(Boolean).join('\n');
    }

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================
    let settings = {};

    const SETTINGS_BACKUP_KEY = 'glpEnhancedSettings_backup';
    const SETTINGS_SCHEMA_KEY = 'glpSettingsSchemaVersion';
    const SETTINGS_SCHEMA_VERSION = 3;

    // Every non-boolean setting with a bounded domain is declared once here. The build exports
    // this into the options schema and checks it against the panel metadata, so migration,
    // backup import, packs, external extension edits, and visible inputs cannot disagree.
    const SETTING_CONSTRAINTS = Object.freeze({
        shapeStyle: { values: ['default', 'rounded', 'square'] },
        fontSize: { min: 10, max: 24 },
        lineHeight: { min: 1, max: 2.5 },
        maxContentWidth: { min: 0, max: 2000 },
        autoRefreshInterval: { min: 15, max: 600 },
        watcherIntervalMinutes: { min: 5, max: 240 },
        userMuteMatchMode: { values: ['exact', 'contains', 'regex'] },
        userHistoryCap: { min: 50, max: 1000 },
        customCSS: { maxLength: 20000 },
        keywordHighlight: { maxLength: 2000 },
        keywordHide: { maxLength: 2000 },
        mediaHoverPreviewSize: { min: 30, max: 95 }
    });

    const LEGACY_SETTINGS_KEYS = Object.freeze([
        'glpx.settings.v1',
        'glpSettings',
        'glpSettingsV1',
        'glpEnhancedConfig'
    ]);

    const SETTING_ALIASES = Object.freeze({
        theme: 'colorTheme',
        themeName: 'colorTheme',
        darkTheme: 'colorTheme',
        hideAds: 'removeAds',
        hideWidgets: 'removeWidgets',
        hideAmp: 'removeAmpEmbeds',
        hideAmpEmbeds: 'removeAmpEmbeds',
        muteList: 'userMuteList',
        blockList: 'userBlockList',
        quoteDepth: 'quoteDepthBadges',
        quoteBacklinksEnabled: 'quoteBacklinks',
        quickSearch: 'threadQuickSearch',
        infiniteForumScroll: 'infiniteScroll',
        infiniteThread: 'infiniteThreadScroll',
        watchEnabled: 'watcherEnabled',
        watchInterval: 'watcherIntervalMinutes',
        sync: 'syncSettings',
        customCss: 'customCSS',
        customCssText: 'customCSS',
        reduceAnimations: 'reduceMotion',
        largerTargets: 'largeTargets'
    });

    const LEGACY_STORE_KEYS = Object.freeze({
        glpMutedUsers: ['glpMuteList', 'glpMuted', 'glpUserMuteList'],
        glpBlockedUsers: ['glpBlockList', 'glpBlocked'],
        glpUserTags: ['glpTags', 'glpTaggedUsers'],
        glpHiddenThreads: ['glpHiddenThreadIds', 'glpHidden'],
        glpHiddenThreadTitles: ['glpThreadTitles'],
        glpWatchedThreads: ['glpWatchList', 'glpWatched'],
        glpUserStats: ['glpPosterStats'],
        glpUserStatsPages: ['glpSeenPages']
    });

    function parseStoredJSON(raw, fallback = null) {
        if (raw === null || raw === undefined || raw === '') return fallback;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (error) {
            return fallback;
        }
    }

    function isRecord(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function cleanImportText(value, maxLength = 200) {
        if (typeof value !== 'string' && typeof value !== 'number') return '';
        return String(value).trim().slice(0, maxLength);
    }

    // localStorage gives an origin about 5 MiB and throws QuotaExceededError past it, so the
    // sanitizer ceilings have to be chosen against that number rather than each on their own.
    // Worst case with every store full, JSON punctuation included:
    //
    //   glpMutedUsers          2000 x  170 =  340 KB
    //   glpBlockedUsers        2000 x  220 =  440 KB
    //   glpHiddenThreads       5000 x   45 =  225 KB
    //   glpHiddenThreadTitles  2000 x  175 =  350 KB
    //   glpUserTags            1000 x  840 =  840 KB
    //   glpWatchedThreads        25 x  600 =   15 KB
    //   glpUserStats           1000 x 1080 = 1080 KB
    //   glpUserStatsPages       200 x  250 =   50 KB
    //                                        -------
    //                                        3.34 MB, leaving roughly 1.8 MB of head room under
    //                                        the 5 MiB limit. The settings blob and its
    //                                        pre-upgrade backup live in that head room: ~8 KB
    //                                        each in normal use, and bounded above by the free
    //                                        text ceilings in SETTING_CONSTRAINTS (customCSS
    //                                        20,000 chars, the two keyword fields 2,000 each),
    //                                        so the worst case is ~50 KB per copy.
    //
    // Changing any number here changes that sum. STORE_LIMITS.userStats is also the ceiling the
    // `userHistoryCap` setting is allowed to reach, so the two cannot drift apart.
    const STORE_LIMITS = Object.freeze({
        mutedUsers: 2000,
        blockedUsers: 2000,
        hiddenThreads: 5000,
        hiddenThreadTitles: 2000,
        userTags: 1000,
        tagNoteLength: 500,
        userStats: 1000,
        userStatsThreads: 10,
        userStatsPages: 200
    });

    function sanitizeStringList(value, { numeric = false, maxItems = STORE_LIMITS.mutedUsers, maxLength = 160 } = {}) {
        if (!Array.isArray(value)) return undefined;
        const seen = new Set();
        const result = [];
        value.forEach(entry => {
            const text = cleanImportText(entry, maxLength);
            if (!text || (numeric && !/^\d+$/.test(text)) || seen.has(text)) return;
            seen.add(text);
            if (result.length < maxItems) result.push(text);
        });
        return result;
    }

    function sanitizeMutedUsers(value) {
        return sanitizeStringList(value);
    }

    function sanitizeBlockedUsers(value) {
        if (!Array.isArray(value)) return undefined;
        const seen = new Set();
        const result = [];
        value.forEach(entry => {
            const source = isRecord(entry) ? entry : { id: entry, name: entry };
            const id = cleanImportText(source.id, 40);
            if (!/^\d+$/.test(id) || seen.has(id) || result.length >= STORE_LIMITS.blockedUsers) return;
            seen.add(id);
            result.push({ id, name: cleanImportText(source.name, 160) || id });
        });
        return result;
    }

    function sanitizeHiddenThreads(value) {
        return sanitizeStringList(value, { numeric: true, maxItems: STORE_LIMITS.hiddenThreads, maxLength: 40 });
    }

    function sanitizeHiddenThreadTitles(value) {
        if (!isRecord(value)) return undefined;
        const result = Object.create(null);
        Object.entries(value).slice(0, STORE_LIMITS.hiddenThreadTitles).forEach(([rawId, title]) => {
            const id = cleanImportText(rawId, 40);
            if (!/^\d+$/.test(id)) return;
            const text = cleanImportText(title, 160);
            if (text) result[id] = text;
        });
        return result;
    }

    function sanitizeTagColor(value, fallback) {
        const color = cleanImportText(value, 40);
        return /^(?:#[0-9a-f]{3,8}|var\(--glpx-(?:accent|warning)\))$/i.test(color)
            ? color
            : fallback;
    }

    function sanitizeUserTags(value) {
        if (!isRecord(value)) return undefined;
        const result = Object.create(null);
        Object.entries(value).slice(0, STORE_LIMITS.userTags).forEach(([rawName, rawTag]) => {
            const name = cleanImportText(rawName, 160);
            if (!name || ['__proto__', 'prototype', 'constructor'].includes(name) || !isRecord(rawTag)) return;
            const label = cleanImportText(rawTag.label, 80);
            if (!label) return;
            result[name] = {
                bg: sanitizeTagColor(rawTag.bg, 'var(--glpx-accent)'),
                fg: sanitizeTagColor(rawTag.fg, '#fff'),
                label,
                note: typeof rawTag.note === 'string' ? rawTag.note.trim().slice(0, STORE_LIMITS.tagNoteLength) : ''
            };
        });
        return result;
    }

    function nonNegativeInteger(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
    }

    function sanitizeWatchedThreads(value) {
        if (!Array.isArray(value)) return undefined;
        const seen = new Set();
        const result = [];
        value.forEach(rawEntry => {
            if (!isRecord(rawEntry) || result.length >= 25) return;
            const id = cleanImportText(rawEntry.id, 40);
            if (!/^\d+$/.test(id) || seen.has(id)) return;
            let parsed;
            try {
                parsed = new URL(String(rawEntry.url || ''));
            } catch (error) {
                return;
            }
            if (!/^https?:$/.test(parsed.protocol)
                || !/^(?:www\.)?godlikeproductions\.com$/i.test(parsed.hostname)
                || !new RegExp(`/forum\\d+/message${id}(?:/|$)`, 'i').test(parsed.pathname)) return;
            seen.add(id);
            result.push({
                id,
                url: `https://${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`,
                title: cleanImportText(rawEntry.title, 200) || `Thread ${id}`,
                lastSeenPost: nonNegativeInteger(rawEntry.lastSeenPost),
                latestPost: nonNegativeInteger(rawEntry.latestPost),
                unread: nonNegativeInteger(rawEntry.unread),
                lastCheckedAt: nonNegativeInteger(rawEntry.lastCheckedAt),
                pages: nonNegativeInteger(rawEntry.pages),
                error: cleanImportText(rawEntry.error, 300)
            });
        });
        return result;
    }

    function sanitizeUserStats(value) {
        if (!isRecord(value)) return undefined;
        const result = Object.create(null);
        Object.entries(value).slice(0, STORE_LIMITS.userStats).forEach(([rawName, rawEntry]) => {
            const name = cleanImportText(rawName, 160);
            if (!name || ['__proto__', 'prototype', 'constructor'].includes(name) || !isRecord(rawEntry)) return;
            const threads = sanitizeStringList(rawEntry.threads, { maxItems: STORE_LIMITS.userStatsThreads, maxLength: 80 }) || [];
            result[name] = {
                posts: nonNegativeInteger(rawEntry.posts),
                threads,
                first: nonNegativeInteger(rawEntry.first),
                last: nonNegativeInteger(rawEntry.last)
            };
        });
        return result;
    }

    function sanitizeUserStatsPages(value) {
        const pages = sanitizeStringList(value, { maxItems: STORE_LIMITS.userStatsPages, maxLength: 240 });
        return pages?.filter(page => /^\/forum\d+\/message\d+(?:\/pg\d+)?$/i.test(page));
    }

    function readStoredValue(key, fallback = null) {
        let value = GM_getValue(key, null);
        if (value !== null && value !== undefined) return value;
        // v1 stored its settings under a plain localStorage key in some userscript managers.
        // Reading that key is migration-only; all new data still goes through GM_*.
        try {
            const local = window.localStorage?.getItem(key);
            return local === null ? fallback : local;
        } catch (error) {
            return fallback;
        }
    }

    // Feature code uses this narrow adapter instead of reaching into GM_* directly. Settings
    // migration and persistence stay here in the engine layer; feature stores only exchange
    // typed JSON values through these two helpers.
    function readFeatureStore(key, fallback) {
        return parseStoredJSON(readStoredValue(key, null), fallback);
    }

    // What the reader sees when a store cannot be saved. Without a name the toast is useless:
    // "storage is full" does not tell anyone which of their lists just stopped growing.
    const STORE_LABELS = Object.freeze({
        glpEnhancedSettings: 'settings',
        glpMutedUsers: 'muted users',
        glpBlockedUsers: 'blocked users',
        glpHiddenThreads: 'hidden threads',
        glpHiddenThreadTitles: 'hidden thread titles',
        glpUserTags: 'user tags and notes',
        glpWatchedThreads: 'watched threads',
        glpUserStats: 'poster history',
        glpUserStatsPages: 'poster history pages'
    });

    function isQuotaError(error) {
        if (!error) return false;
        const name = String(error.name || '');
        const code = Number(error.code);
        return name === 'QuotaExceededError'
            || name === 'NS_ERROR_DOM_QUOTA_REACHED'
            || code === 22
            || code === 1014
            || /quota/i.test(String(error.message || ''));
    }

    /**
     * A storage write that throws must not look like a write that never happened. The engine
     * parses on read and falls back to defaults on a throw, so a swallowed QuotaExceededError
     * reads exactly like "nothing was ever saved" - the 2026-08-06 failure shape, arriving by a
     * different route. Record it, name the store, and tell the reader once per store per load.
     */
    function recordStorageFailure(key, error) {
        const quota = isQuotaError(error);
        const label = STORE_LABELS[key] || key;
        const entry = {
            key,
            label,
            quota,
            message: String(error && error.message ? error.message : error),
            at: Date.now()
        };
        runtimeState.storageFailures.push(entry);
        if (runtimeState.storageFailures.length > 20) runtimeState.storageFailures.shift();

        if (runtimeState.storageFailuresReported.has(key)) return entry;
        const message = quota
            ? `Local storage is full, so your ${label} could not be saved. Clear some history or hidden threads from Recovery.`
            : `Your ${label} could not be saved to local storage.`;
        try {
            // Only count it as reported once a toast actually rendered. This can run at
            // document_start, before document.body exists, and marking it reported there would
            // spend the one warning on a notification nobody could see.
            showNotification(message, 'error');
            runtimeState.storageFailuresReported.add(key);
        } catch (notifyError) {
            console.warn(`[GLP Ultra] ${message}`, notifyError);
        }
        return entry;
    }

    /**
     * The single guarded write. Every GM_setValue in the engine goes through here, including the
     * boot-time schema and version stamps: an uncaught throw from those runs before
     * `injectEarlyCSS`, so a full origin used to abort startup entirely rather than lose one store.
     */
    function safeSetValue(key, serialized) {
        try {
            GM_setValue(key, serialized);
            return true;
        } catch (error) {
            recordStorageFailure(key, error);
            return false;
        }
    }

    function writeFeatureStore(key, value) {
        return safeSetValue(key, JSON.stringify(value));
    }

    function normalizeThemeValue(value) {
        const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
        const aliases = {
            amoledblack: 'amoled',
            solarizeddark: 'solarized',
            aliengreen: 'alien',
            highcontrastdark: 'highcontrast',
            catppuccinmocha: 'catppuccin'
        };
        return aliases[normalized] || normalized;
    }

    function normalizeSettingValue(key, value) {
        const fallback = DEFAULT_SETTINGS[key];
        if (key === 'colorTheme') {
            const theme = normalizeThemeValue(value);
            return Object.prototype.hasOwnProperty.call(THEME_PALETTES, theme) ? theme : fallback;
        }
        if (key === 'quoteBorderColor') {
            const color = typeof value === 'string' ? value.trim() : '';
            return color === fallback || /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
        }
        const constraint = SETTING_CONSTRAINTS[key] || {};
        if (constraint.values) return constraint.values.includes(value) ? value : fallback;
        if (typeof fallback === 'boolean') return typeof value === 'boolean' ? value : fallback;
        if (typeof fallback === 'number') {
            const number = typeof value === 'number'
                ? value
                : (typeof value === 'string' && value.trim() ? Number(value) : NaN);
            if (!Number.isFinite(number)) return fallback;
            return Math.min(constraint.max ?? number, Math.max(constraint.min ?? number, number));
        }
        if (typeof fallback === 'string') {
            if (typeof value !== 'string') return fallback;
            return constraint.maxLength ? value.slice(0, constraint.maxLength) : value;
        }
        return value;
    }

    function extractSettingsPayload(payload) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
        const nested = [payload.settings, payload.payload?.settings, payload.config, payload.options]
            .find(candidate => candidate && typeof candidate === 'object' && !Array.isArray(candidate));
        return nested || payload;
    }

    function migrateSettingsPayload(payload) {
        const source = extractSettingsPayload(payload) || {};
        const migrated = {};
        const migratedKeys = [];

        Object.entries(source).forEach(([key, value]) => {
            const target = Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)
                ? key
                : SETTING_ALIASES[key];
            if (!target || !Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, target)) return;
            if (Object.prototype.hasOwnProperty.call(migrated, target) && target !== key) return;
            migrated[target] = normalizeSettingValue(target, value);
            if (target !== key || migrated[target] !== value) migratedKeys.push(target);
        });

        return { settings: migrated, migratedKeys };
    }

    function migrateLegacyStore(targetKey, fallback, transform = value => value) {
        const current = parseStoredJSON(GM_getValue(targetKey, null), null);
        if (current !== null) return;

        const candidates = LEGACY_STORE_KEYS[targetKey] || [];
        for (const key of candidates) {
            const value = parseStoredJSON(readStoredValue(key, null), null);
            if (value === null) continue;
            const migrated = transform(value);
            safeSetValue(targetKey, JSON.stringify(migrated));
            runtimeState.migration.migratedStores.push(targetKey);
            return;
        }

        if (fallback !== undefined) return fallback;
        return null;
    }

    function migrateLegacyStores() {
        Object.entries(LEGACY_STORE_KEYS).forEach(([targetKey]) => migrateLegacyStore(targetKey));
    }

    /**
     * Keeps one copy of the settings payload as it was before the most recent upgrade.
     *
     * Loading keeps only keys the current schema declares, and the first save after that writes
     * the pruned object back - so anything a predecessor stored under a name this build does not
     * know is gone, silently, with the upgrade. That is fine as long as the pre-upgrade payload
     * is recoverable, which is what this is for. An empty previous version counts as an upgrade:
     * it means the payload predates version stamping, which is exactly the legacy case.
     */
    function backupSettingsBeforeUpgrade(saved, previous) {
        if (!saved || previous === SCRIPT_VERSION) return;
        try {
            safeSetValue(SETTINGS_BACKUP_KEY, JSON.stringify({
                version: previous || 'unstamped',
                upgradedTo: SCRIPT_VERSION,
                savedAt: new Date().toISOString(),
                payload: typeof saved === 'string' ? saved : JSON.stringify(saved)
            }));
        } catch (e) {
            /* A backup that cannot be written must not stop the upgrade. */
        }
    }

    function readSettingsBackup() {
        try {
            const raw = GM_getValue(SETTINGS_BACKUP_KEY, null);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && parsed.payload ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    function loadSettings() {
        const saved = readStoredValue('glpEnhancedSettings', null);
        runtimeState.previousVersion = String(GM_getValue('glpSettingsVersion', '') || '');
        const schemaVersion = Number(GM_getValue(SETTINGS_SCHEMA_KEY, 0)) || 0;
        const currentPayload = parseStoredJSON(saved, null);
        let source = currentPayload;
        let sourceName = currentPayload ? 'glpEnhancedSettings' : 'defaults';

        if (!source) {
            for (const key of LEGACY_SETTINGS_KEYS) {
                const candidate = parseStoredJSON(readStoredValue(key, null), null);
                if (candidate && typeof candidate === 'object') {
                    source = candidate;
                    sourceName = key;
                    break;
                }
            }
        }

        backupSettingsBeforeUpgrade(source || saved, runtimeState.previousVersion || schemaVersion);
        const { settings: migrated, migratedKeys } = migrateSettingsPayload(source);
        settings = { ...DEFAULT_SETTINGS, ...migrated };

        // Keys the stored payload never heard of are exactly the settings this build added, so
        // the update notice can name them without a hand-kept changelog.
        const knownSource = extractSettingsPayload(source) || {};
        runtimeState.newSettingKeys = Object.keys(DEFAULT_SETTINGS)
            .filter(key => !Object.prototype.hasOwnProperty.call(knownSource, key)
                && !Object.entries(SETTING_ALIASES).some(([legacy, current]) => current === key
                    && Object.prototype.hasOwnProperty.call(knownSource, legacy)));

        runtimeState.migration = {
            schemaVersion: SETTINGS_SCHEMA_VERSION,
            source: sourceName,
            fromVersion: schemaVersion,
            migratedKeys: [...new Set(migratedKeys)],
            migratedStores: []
        };

        if (source && (sourceName !== 'glpEnhancedSettings' || schemaVersion < SETTINGS_SCHEMA_VERSION || migratedKeys.length)) {
            saveSettings();
        }
        safeSetValue(SETTINGS_SCHEMA_KEY, String(SETTINGS_SCHEMA_VERSION));
        migrateLegacyStores();
    }

    /**
     * Shown once per version bump, and only to users who already had settings stored - a fresh
     * install has nothing to migrate and does not need to be told what changed.
     */
    function announceVersionChange() {
        const previous = runtimeState.previousVersion;
        safeSetValue('glpSettingsVersion', SCRIPT_VERSION);
        if (!previous || previous === SCRIPT_VERSION) return;
        if (!settings.updateNotices) return;

        const added = runtimeState.newSettingKeys;
        const summary = added.length
            ? `${added.length} new setting${added.length === 1 ? '' : 's'}: ${added.slice(0, 4).join(', ')}${added.length > 4 ? `, +${added.length - 4} more` : ''}`
            : 'no new settings';
        showNotification(`GLP Ultra updated ${previous} to ${SCRIPT_VERSION} - ${summary}.`, 'info', {
            label: 'Open settings',
            onClick: createSettingsPanel
        });
    }

    function saveSettings() {
        return safeSetValue('glpEnhancedSettings', JSON.stringify(settings));
    }

    function resetSettings() {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings();
    }

    // ============================================
    // EARLY CSS INJECTION (before page renders)
    // ============================================
    function injectEarlyCSS() {
        const css = generateCSS();
        const style = document.createElement('style');
        ownSurface(style, 'glp-enhanced-styles');
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    // One palette, resolved once. Everything the script paints - the site, the settings panel,
    // the diagnostics and recovery surfaces, the toasts - reads the tokens derived from this, so
    // choosing Alien Green does not leave a blue control panel sitting on a green page.
    const THEME_PALETTES = Object.freeze({
            midnight: { bg: '#070b13', accent: '#4f9cf9', link: '#78b7ff', linkHover: '#a4ceff', hover: 'rgba(79,156,249,0.10)', headerBg: 'rgba(15,24,42,0.94)', titleBg: 'rgba(11,19,34,0.88)', border: '#243248' },
            catppuccin: { bg: '#1e1e2e', accent: '#cba6f7', link: '#89b4fa', linkHover: '#b4d0fb', hover: 'rgba(203,166,247,0.08)', headerBg: 'rgba(49,50,68,0.9)', titleBg: 'rgba(49,50,68,0.6)', border: '#45475a' },
            dracula: { bg: '#282a36', accent: '#bd93f9', link: '#8be9fd', linkHover: '#a8f0ff', hover: 'rgba(189,147,249,0.08)', headerBg: 'rgba(68,71,90,0.9)', titleBg: 'rgba(68,71,90,0.6)', border: '#44475a' },
            nord: { bg: '#2e3440', accent: '#88c0d0', link: '#81a1c1', linkHover: '#8fbcbb', hover: 'rgba(136,192,208,0.08)', headerBg: 'rgba(59,66,82,0.9)', titleBg: 'rgba(59,66,82,0.6)', border: '#4c566a' },
            gruvbox: { bg: '#1d2021', accent: '#fe8019', link: '#83a598', linkHover: '#8ec07c', hover: 'rgba(254,128,25,0.08)', headerBg: 'rgba(50,48,47,0.9)', titleBg: 'rgba(50,48,47,0.6)', border: '#504945' },
            amoled: { bg: '#000000', accent: '#4a90d9', link: '#6ab0f3', linkHover: '#8ac4f7', hover: 'rgba(74,144,217,0.06)', headerBg: 'rgba(15,15,15,0.95)', titleBg: 'rgba(15,15,15,0.8)', border: '#1a1a1a' },
            solarized: { bg: '#002b36', accent: '#268bd2', link: '#2aa198', linkHover: '#35bdb4', hover: 'rgba(38,139,210,0.08)', headerBg: 'rgba(7,54,66,0.9)', titleBg: 'rgba(7,54,66,0.6)', border: '#073642' },
            blood: { bg: '#0a0a0a', accent: '#c0392b', link: '#e74c3c', linkHover: '#ff6b5b', hover: 'rgba(192,57,43,0.08)', headerBg: 'rgba(30,10,10,0.9)', titleBg: 'rgba(30,10,10,0.6)', border: '#2c1010' },
            alien: { bg: '#020502', accent: '#18ff6d', link: '#5cff9d', linkHover: '#a4ffc7', hover: 'rgba(24,255,109,0.08)', headerBg: 'rgba(4,22,9,0.94)', titleBg: 'rgba(4,22,9,0.72)', border: '#153d20' },
            highcontrast: { bg: '#000000', accent: '#78b7ff', link: '#9fd0ff', linkHover: '#ffffff', hover: 'rgba(120,183,255,0.16)', headerBg: 'rgba(12,12,16,0.98)', titleBg: 'rgba(12,12,16,0.88)', border: '#6f7f9f' }
    });

    function hexToRgbChannel(hex) {
        const value = String(hex || '').replace('#', '');
        const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
        const int = parseInt(full, 16);
        if (!Number.isFinite(int) || full.length !== 6) return '106,168,255';
        return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
    }

    /**
     * The design tokens. Emitted unconditionally and first, so every later rule can lean on them
     * and a theme switch repaints the whole product rather than only the page behind it.
     */
    function buildThemeTokens(t) {
        const accentRgb = hexToRgbChannel(t.accent);
        const linkRgb = hexToRgbChannel(t.link);
        return `
:root,
body.glp-enhanced-active,
#glp-enhanced-overlay,
#glp-diagnostics,
#glp-recovery,
#glp-noise-panel,
#glp-watch-digest,
.glp-toast-stack {
    --glpx-accent-rgb: ${accentRgb};
    --glpx-link-rgb: ${linkRgb};
    --glpx-accent: ${t.accent};
    --glpx-link: ${t.link};
    --glpx-link-hover: ${t.linkHover};

    /* Surfaces, back to front. */
    --glpx-bg: ${t.bg};
    --glpx-surface: ${t.titleBg};
    --glpx-surface-2: ${t.headerBg};
    --glpx-elevated: color-mix(in srgb, ${t.bg} 86%, #ffffff 14%);
    --glpx-canvas: color-mix(in srgb, ${t.bg} 94%, #000000 6%);
    --glpx-surface-low: color-mix(in srgb, ${t.bg} 94%, #ffffff 6%);
    --glpx-surface-mid: color-mix(in srgb, ${t.bg} 90%, #ffffff 10%);
    --glpx-surface-high: color-mix(in srgb, ${t.bg} 84%, #ffffff 16%);
    --glpx-scrim: rgba(2, 5, 13, 0.84);

    /* Text. */
    --glpx-text: #eef3ff;
    --glpx-muted: #a9b6cf;
    --glpx-subtle: #8190ad;
    --glpx-on-accent: #05070f;

    /* Lines. */
    --glpx-border: rgba(var(--glpx-accent-rgb), 0.20);
    --glpx-border-soft: rgba(147, 168, 211, 0.14);
    --glpx-border-strong: rgba(var(--glpx-accent-rgb), 0.46);

    /* Semantic - deliberately not theme-tinted: green must stay green on the Blood theme.
       These must be literals. A custom property that references itself is a cycle, which CSS
       resolves as invalid-at-computed-value-time, so every var(--glpx-success) in the product
       silently falls back to inherit and all three states paint the same colour. */
    --glpx-success: #43d38b;
    --glpx-warning: #f5bd5f;
    --glpx-danger: #ff6b6b;
    /* As a channel too, so a tint can pick its own alpha without restating the colour. */
    --glpx-warning-rgb: 245, 189, 95;

    /* The "ghost" control: every small button the script adds to the page. Named once because it
       was previously restated per surface at four slightly different alphas - and tinted with the
       accent rather than plain white, so a toolbar button belongs to the theme at rest and not
       only on hover. A white-alpha ghost reads identically on all ten palettes. */
    --glpx-ghost: rgba(var(--glpx-accent-rgb), 0.10);
    --glpx-ghost-border: rgba(var(--glpx-accent-rgb), 0.26);
    --glpx-ghost-hover: rgba(var(--glpx-accent-rgb), 0.20);

    /* Radius scale. Nothing outside this set, and never a pill. */
    --glpx-r-xs: 4px;
    --glpx-r-sm: 6px;
    --glpx-r-md: 8px;
    --glpx-r-lg: 10px;
    --glpx-r-xl: 12px;

    /* Elevation. */
    --glpx-shadow-1: 0 2px 8px rgba(0, 0, 0, 0.28);
    --glpx-shadow-2: 0 14px 36px rgba(0, 0, 0, 0.46);
    --glpx-shadow-3: 0 24px 80px rgba(0, 0, 0, 0.58);

    --glpx-focus: 0 0 0 3px rgba(var(--glpx-accent-rgb), 0.38);
    --glpx-ease: 0.18s cubic-bezier(0.22, 0.61, 0.36, 1);
}
`;
    }

    function generateCSS() {
        const t = THEME_PALETTES[settings.colorTheme] || THEME_PALETTES.midnight;
        let css = buildThemeTokens(t);
        css += `
/* GLP Ultra Base Styles */
.glp-enhanced-hidden { display: none !important; }
body.glp-enhanced-active { color-scheme: dark; }

/* Settings Panel Styles */
#glp-enhanced-overlay {
    /* The panel is a view onto the same design system, not a separate blue product. */
    --glp-panel-bg: var(--glpx-elevated);
    --glp-panel-bg-2: var(--glpx-surface-2);
    --glp-panel-bg-3: var(--glpx-surface);
    --glp-panel-border: var(--glpx-border);
    --glp-panel-border-strong: var(--glpx-border-strong);
    --glp-panel-text: var(--glpx-text);
    --glp-panel-muted: var(--glpx-muted);
    --glp-panel-subtle: var(--glpx-subtle);
    --glp-panel-accent: var(--glpx-accent);
    --glp-panel-accent-2: var(--glpx-link-hover);
    --glp-panel-danger: var(--glpx-danger);
    --glp-panel-success: var(--glpx-success);
    --glp-panel-warning: var(--glpx-warning);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
        radial-gradient(circle at 18% 8%, rgba(var(--glpx-accent-rgb), 0.16), transparent 30%),
        radial-gradient(circle at 82% 18%, rgba(var(--glpx-link-rgb), 0.10), transparent 32%),
        var(--glpx-scrim);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    pointer-events: auto;
}

#glp-enhanced-settings {
    background:
        linear-gradient(180deg, rgba(var(--glpx-accent-rgb), 0.07), transparent 220px),
        var(--glp-panel-bg);
    border: 1px solid var(--glp-panel-border);
    border-radius: var(--glpx-r-xl);
    width: min(1040px, 96vw);
    max-height: min(88vh, 980px);
    overflow: hidden;
    /* A column, so the scrolling body takes whatever the header, search bar and footer leave.
       The body used to subtract a hardcoded 184px for chrome that actually measures ~222px, and
       the panel clips its overflow - so the footer, with Save and Close in it, was cut off the
       bottom of the panel entirely at ordinary window heights. */
    display: flex;
    flex-direction: column;
    box-shadow: var(--glpx-shadow-3), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--glp-panel-text);
}

#glp-enhanced-settings-header {
    flex: none;
    background: linear-gradient(135deg, rgba(var(--glpx-accent-rgb), 0.10) 0%, transparent 70%), var(--glp-panel-bg-2);
    padding: 18px 22px 16px;
    border-bottom: 1px solid var(--glp-panel-border);
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
}

.glp-settings-title-block {
    min-width: 0;
}

.glp-settings-kicker {
    color: var(--glp-panel-accent-2);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 5px;
}

#glp-enhanced-settings-header h2 {
    margin: 0;
    color: var(--glp-panel-text);
    font-size: 20px;
    line-height: 1.2;
    font-weight: 720;
}

#glp-enhanced-settings-header .version {
    color: var(--glp-panel-muted);
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
}

.glp-settings-subtitle {
    color: var(--glp-panel-muted);
    font-size: 13px;
    line-height: 1.45;
    margin: 7px 0 0;
    max-width: 720px;
}

.glp-settings-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.glp-safe-mode-notice {
    margin: 10px 0 0;
    padding: 8px 12px;
    border: 1px solid var(--glpx-warning);
    border-radius: var(--glpx-r-sm);
    background: rgba(var(--glpx-warning-rgb), 0.12);
    color: var(--glpx-text);
    font-size: 12px;
}

.glp-settings-search-wrap {
    flex: none;
    padding: 14px 22px;
    background: rgba(5, 8, 18, 0.44);
    border-bottom: 1px solid rgba(147, 168, 211, 0.13);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
}

#glp-settings-search {
    width: 100%;
    box-sizing: border-box;
    background: rgba(8, 12, 26, 0.96);
    color: var(--glp-panel-text);
    border: 1px solid var(--glp-panel-border);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

#glp-settings-search::placeholder {
    color: var(--glp-panel-subtle);
}

#glp-settings-search:focus {
    border-color: var(--glp-panel-accent);
    box-shadow: 0 0 0 3px rgba(var(--glpx-accent-rgb), 0.16);
    background: rgba(10, 15, 31, 1);
}

.glp-settings-summary {
    color: var(--glp-panel-muted);
    font-size: 12px;
    white-space: nowrap;
}

.glp-settings-summary strong {
    color: var(--glp-panel-text);
    font-weight: 700;
}

#glp-enhanced-close-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.10);
    color: var(--glp-panel-muted);
    width: 34px;
    height: 34px;
    border-radius: 8px;
    font-size: 22px;
    cursor: pointer;
    line-height: 1;
    transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

#glp-enhanced-close-btn:hover {
    color: var(--glp-panel-text);
    border-color: var(--glp-panel-border-strong);
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
}

/* Two panes: a rail that maps the 23 sections, and the sections themselves. */
#glp-enhanced-settings-main {
    display: grid;
    grid-template-columns: 208px minmax(0, 1fr);
    align-items: stretch;
    min-height: 0;
}

#glp-settings-nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 10px 8px 14px;
    max-height: calc(min(88vh, 980px) - 184px);
    overflow-y: auto;
    border-right: 1px solid var(--glp-panel-border);
    background: rgba(0, 0, 0, 0.16);
}

.glp-nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: var(--glpx-r-sm);
    background: transparent;
    color: var(--glp-panel-muted);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    line-height: 1.3;
    cursor: pointer;
    font-family: inherit;
    transition: background var(--glpx-ease), color var(--glpx-ease), border-color var(--glpx-ease);
}

.glp-nav-item:hover {
    background: rgba(var(--glpx-accent-rgb), 0.10);
    color: var(--glp-panel-text);
}

.glp-nav-item.glp-nav-active {
    background: rgba(var(--glpx-accent-rgb), 0.16);
    border-color: rgba(var(--glpx-accent-rgb), 0.34);
    color: var(--glp-panel-text);
}

.glp-nav-item.glp-filtered { display: none; }

/* A dot, not colour alone: the rail has to say "changed here" without relying on hue. */
.glp-nav-dot {
    width: 6px; height: 6px; flex: none;
    border-radius: var(--glpx-r-xs);
    background: transparent;
    border: 1px solid transparent;
}

.glp-nav-item.glp-nav-changed .glp-nav-dot {
    background: var(--glpx-accent);
    border-color: var(--glpx-accent);
}

.glp-search-field { position: relative; display: flex; align-items: center; }

.glp-search-clear {
    position: absolute; right: 8px;
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--glp-panel-border);
    border-radius: var(--glpx-r-xs);
    color: var(--glp-panel-muted);
    font-size: 11px; cursor: pointer; line-height: 1;
}

.glp-search-clear:hover { color: var(--glp-panel-text); background: rgba(var(--glpx-accent-rgb), 0.18); }

.glp-search-tools { display: flex; align-items: center; gap: 12px; }

.glp-chip-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 11px;
    border-radius: var(--glpx-r-sm);
    border: 1px solid var(--glp-panel-border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--glp-panel-muted);
    font-size: 12px; font-weight: 650; cursor: pointer; white-space: nowrap;
    font-family: inherit;
    transition: background var(--glpx-ease), color var(--glpx-ease), border-color var(--glpx-ease);
}

.glp-chip-toggle:hover { color: var(--glp-panel-text); border-color: var(--glp-panel-border-strong); }

.glp-chip-toggle.glp-toggle-on {
    background: rgba(var(--glpx-accent-rgb), 0.20);
    border-color: rgba(var(--glpx-accent-rgb), 0.46);
    color: var(--glp-panel-text);
}

/* Changed-from-default marker. Present on the row, echoed in the header and the rail. */
.glp-setting-item.glp-setting-changed {
    border-color: rgba(var(--glpx-accent-rgb), 0.32);
    background: rgba(var(--glpx-accent-rgb), 0.06);
}

.glp-setting-item.glp-setting-changed::after {
    content: "";
    position: absolute; top: 8px; right: 8px;
    width: 6px; height: 6px;
    border-radius: var(--glpx-r-xs);
    background: var(--glpx-accent);
}

.glp-section-changed-count {
    color: var(--glpx-accent);
    font-weight: 700;
}

.glp-section-reset {
    padding: 3px 8px;
    border-radius: var(--glpx-r-xs);
    border: 1px solid var(--glp-panel-border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--glp-panel-muted);
    font-size: 11px; font-weight: 650; cursor: pointer;
    font-family: inherit;
}

.glp-section-reset:hover {
    color: var(--glp-panel-text);
    border-color: var(--glp-panel-border-strong);
    background: rgba(var(--glpx-accent-rgb), 0.16);
}

.glp-settings-empty {
    padding: 44px 24px;
    text-align: center;
    display: grid;
    gap: 10px;
    justify-items: center;
}

.glp-empty-title { color: var(--glp-panel-text); font-size: 15px; font-weight: 700; }
.glp-empty-body { color: var(--glp-panel-muted); font-size: 13px; max-width: 46ch; line-height: 1.5; }

@media (max-width: 900px) {
    #glp-enhanced-settings-main { grid-template-columns: minmax(0, 1fr); }
    #glp-settings-nav {
        flex-direction: row; flex-wrap: wrap; gap: 6px;
        max-height: 132px; border-right: none;
        border-bottom: 1px solid var(--glp-panel-border);
    }
    .glp-nav-item { width: auto; }
}

#glp-enhanced-settings-body {
    padding: 0;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    scrollbar-color: rgba(var(--glpx-accent-rgb), 0.42) rgba(255,255,255,0.04);
}

#glp-enhanced-settings-body::-webkit-scrollbar {
    width: 10px;
}

#glp-enhanced-settings-body::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.04);
}

#glp-enhanced-settings-body::-webkit-scrollbar-thumb {
    background: rgba(var(--glpx-accent-rgb), 0.38);
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
}

.glp-settings-section {
    border-bottom: 1px solid rgba(147, 168, 211, 0.12);
}

.glp-settings-section:last-child {
    border-bottom: none;
}

.glp-settings-section-header {
    background: rgba(255, 255, 255, 0.025);
    padding: 14px 22px;
    cursor: pointer;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    user-select: none;
    transition: background 0.18s ease;
}

.glp-settings-section-header:hover {
    background: rgba(var(--glpx-accent-rgb), 0.07);
}

.glp-section-heading {
    min-width: 0;
}

.glp-settings-section-header h3 {
    margin: 0;
    color: var(--glp-panel-text);
    font-size: 14px;
    line-height: 1.25;
    font-weight: 700;
}

.glp-section-desc {
    margin-top: 4px;
    color: var(--glp-panel-subtle);
    font-size: 12px;
    line-height: 1.35;
}

.glp-section-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--glp-panel-subtle);
    font-size: 11px;
    white-space: nowrap;
}

.glp-settings-section-header .toggle-icon {
    color: var(--glp-panel-muted);
    transition: transform 0.18s ease;
}

.glp-settings-section.collapsed .toggle-icon {
    transform: rotate(-90deg);
}

.glp-settings-section-content {
    padding: 16px 22px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    gap: 12px 14px;
}

.glp-settings-section.collapsed .glp-settings-section-content {
    display: none;
}

.glp-settings-section.glp-filtered,
.glp-setting-item.glp-filtered {
    display: none !important;
}

.glp-setting-item {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    background: rgba(255, 255, 255, 0.026);
    border: 1px solid rgba(147, 168, 211, 0.10);
    border-radius: 8px;
    padding: 10px 11px;
    min-height: 42px;
    box-sizing: border-box;
    transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.glp-setting-item:hover {
    background: rgba(var(--glpx-accent-rgb), 0.055);
    border-color: rgba(var(--glpx-accent-rgb), 0.22);
    transform: translateY(-1px);
}

.glp-setting-item.full-width {
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
}

.glp-setting-item label {
    color: var(--glp-panel-text);
    font-size: 13px;
    line-height: 1.35;
    cursor: pointer;
    min-width: 0;
}

.glp-setting-label {
    display: block;
    font-weight: 650;
}

.glp-setting-help {
    display: block;
    color: var(--glp-panel-subtle);
    font-size: 11px;
    line-height: 1.35;
    margin-top: 3px;
}

.glp-setting-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--glp-panel-accent);
    margin-top: 1px;
}

.glp-setting-item input[type="number"],
.glp-setting-item input[type="text"],
.glp-setting-item input[type="color"],
.glp-setting-item select,
.glp-setting-item textarea {
    background: rgba(8, 12, 26, 0.94);
    border: 1px solid var(--glp-panel-border);
    color: var(--glp-panel-text);
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.glp-setting-item input[type="number"] {
    width: 92px;
}

.glp-setting-item input[type="text"] {
    width: min(260px, 100%);
}

.glp-setting-item select {
    width: min(240px, 100%);
}

.glp-setting-item input:focus,
.glp-setting-item select:focus,
.glp-setting-item textarea:focus,
.glp-btn:focus-visible,
#glp-enhanced-close-btn:focus-visible,
.glp-hide-col-btn:focus-visible,
.glp-op-nav button:focus-visible,
#glp-back-to-top:focus-visible {
    border-color: var(--glp-panel-accent) !important;
    box-shadow: 0 0 0 3px rgba(var(--glpx-accent-rgb), 0.18) !important;
    outline: none;
}

.glp-setting-item input[type="color"] {
    width: 44px;
    height: 34px;
    padding: 2px;
    cursor: pointer;
}

#glp-enhanced-settings-footer {
    flex: none;
    background: rgba(5, 8, 18, 0.72);
    padding: 14px 22px;
    border-top: 1px solid var(--glp-panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.glp-footer-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* Seven buttons in one undifferentiated row, with the only destructive action shoulder to
   shoulder with Export. Grouped by job now - destroy, inspect, move data - with a rule between
   each, and the destructive group separated by more than a rule. */
.glp-footer-cluster {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 0;
    min-width: 0;
}

.glp-footer-cluster .glp-footer-group {
    padding: 0 14px;
}

.glp-footer-cluster .glp-footer-group + .glp-footer-group {
    border-left: 1px solid var(--glp-panel-border);
}

.glp-footer-cluster .glp-footer-destructive {
    padding-left: 0;
    padding-right: 22px;
}

.glp-btn {
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.glp-btn-primary {
    background: linear-gradient(135deg, var(--glp-panel-accent), #4f82ff);
    color: #fff;
    box-shadow: 0 8px 22px rgba(79, 130, 255, 0.22);
}

.glp-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(79, 130, 255, 0.30);
}

.glp-btn-secondary {
    background: rgba(255, 255, 255, 0.055);
    color: var(--glp-panel-text);
    border-color: rgba(147, 168, 211, 0.16);
}

.glp-btn-secondary:hover {
    background: rgba(var(--glpx-accent-rgb), 0.12);
    border-color: var(--glp-panel-border-strong);
    transform: translateY(-1px);
}

.glp-btn-danger {
    background: rgba(255, 107, 107, 0.10);
    color: #ffd1d1;
    border-color: rgba(255, 107, 107, 0.28);
}

.glp-btn-danger:hover {
    background: rgba(255, 107, 107, 0.18);
    border-color: rgba(255, 107, 107, 0.46);
    transform: translateY(-1px);
}

.glp-toast-stack {
    position: fixed;
    right: 20px;
    bottom: 22px;
    display: grid;
    gap: 10px;
    z-index: 1000002;
    pointer-events: none;
    width: min(360px, calc(100vw - 40px));
}

.glp-toast {
    pointer-events: auto;
    background: var(--glpx-elevated);
    color: var(--glpx-text);
    border: 1px solid var(--glpx-border-soft);
    border-left: 3px solid var(--glpx-accent);
    border-radius: var(--glpx-r-md);
    padding: 11px 12px;
    box-shadow: var(--glpx-shadow-2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    animation: glp-toast-in 0.18s ease-out;
}

.glp-toast-success { border-left-color: var(--glpx-success); }
.glp-toast-warning { border-left-color: var(--glpx-warning); }
.glp-toast-error { border-left-color: var(--glpx-danger); }

.glp-toast button {
    background: rgba(var(--glpx-accent-rgb), 0.13);
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.28);
    color: var(--glpx-text);
    border-radius: var(--glpx-r-sm);
    padding: 5px 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
}

@keyframes glp-toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 720px) {
    #glp-enhanced-overlay { padding: 10px; align-items: stretch; }
    #glp-enhanced-settings { width: 100%; max-height: 96vh; }
    #glp-enhanced-settings-header { padding: 16px; }
    .glp-settings-search-wrap { grid-template-columns: 1fr; padding: 12px 16px; }

    .glp-settings-section-header { padding: 13px 16px; }
    .glp-settings-section-content { padding: 14px 16px 18px; grid-template-columns: 1fr; }
    #glp-enhanced-settings-footer { padding: 12px 16px; align-items: stretch; flex-direction: column; }
    .glp-footer-cluster { flex-direction: column; align-items: stretch; gap: 10px; }
    .glp-footer-cluster .glp-footer-group { padding: 0; }
    .glp-footer-cluster .glp-footer-group + .glp-footer-group {
        border-left: none;
        border-top: 1px solid var(--glp-panel-border);
        padding-top: 10px;
    }
    .glp-footer-cluster .glp-footer-destructive { padding-right: 0; }
    .glp-footer-group { width: 100%; }
    .glp-footer-group .glp-btn { flex: 1; }
}

@media (prefers-reduced-motion: reduce) {
    #glp-enhanced-overlay *,
    .glp-toast,
    .glp-btn,
    .glp-setting-item {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

#glp-diagnostics {
    position: fixed; right: 18px; bottom: 18px; z-index: 2147483646;
    width: min(460px, calc(100vw - 36px)); max-height: min(70vh, 640px);
    display: flex; flex-direction: column;
    background: var(--glp-panel-bg, #0d1220);
    border: 1px solid var(--glp-panel-border, rgba(147, 168, 211, 0.22));
    border-radius: 12px; box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
    color: var(--glp-panel-text, #e6ecf7);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;
}

.glp-diag-header {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 14px; border-bottom: 1px solid var(--glp-panel-border, rgba(147, 168, 211, 0.22));
    font-weight: 700;
}

.glp-diag-body { overflow-y: auto; padding: 10px 14px 14px; }
.glp-diag-group { margin-top: 12px; }
.glp-diag-group:first-child { margin-top: 0; }
.glp-diag-group h4 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #93a8d3; }
.glp-diag-row { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; border-bottom: 1px solid rgba(147, 168, 211, 0.10); }
.glp-diag-row:last-child { border-bottom: none; }
.glp-diag-row span:last-child { color: #b9c6e2; font-family: 'JetBrains Mono', ui-monospace, Consolas, monospace; text-align: right; }
.glp-diag-ok span:last-child { color: #7fd39b; }
.glp-diag-warn span:last-child { color: #e6c14a; }
.glp-diag-bad span:last-child { color: #ff8f8f; }
.glp-diag-empty { color: #8592b0; padding: 3px 0; }

#glp-noise-panel {
    position: fixed; right: 18px; bottom: 18px; z-index: 2147483646;
    width: min(420px, calc(100vw - 36px)); max-height: min(60vh, 520px);
    display: flex; flex-direction: column;
    background: var(--glp-panel-bg, #0d1220);
    border: 1px solid var(--glp-panel-border, rgba(147, 168, 211, 0.22));
    border-radius: 12px; box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
    color: var(--glp-panel-text, #e6ecf7);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;
}

#glp-recovery {
    position: fixed; left: 18px; bottom: 18px; z-index: 2147483646;
    width: min(460px, calc(100vw - 36px)); max-height: min(70vh, 640px);
    display: flex; flex-direction: column;
    background: var(--glp-panel-bg, #0d1220);
    border: 1px solid var(--glp-panel-border, rgba(147, 168, 211, 0.22));
    border-radius: 12px; box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
    color: var(--glp-panel-text, #e6ecf7);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;
}

.glp-recovery-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 5px 0; border-bottom: 1px solid rgba(147, 168, 211, 0.10);
}
.glp-recovery-row:last-child { border-bottom: none; }
.glp-recovery-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.glp-recovery-row button {
    flex: none; background: rgba(255, 255, 255, 0.055); border: 1px solid rgba(255, 255, 255, 0.12);
    color: #dce7ff; border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 11px;
}
.glp-recovery-row button:hover { background: rgba(var(--glpx-accent-rgb), 0.16); border-color: rgba(var(--glpx-accent-rgb), 0.38); }

`;

        if (!settings.enabled) {
            return css;
        }

        // ---- Ad Removal ----
        if (settings.removeAds) {
            css += `
[data-type="_mgwidget"],
[id^="mgid"],
iframe[src*="mgid"],
div[id*="ScriptRoot"] { display: none !important; }
`;
        }

        if (settings.removeMsgAds) {
            css += `.msgad { display: none !important; }
`;
        }

        if (settings.removeAmpEmbeds) {
            css += `amp-embed { display: none !important; }
`;
        }

        // ---- Header ----
        if (settings.hideHeaderBanner) {
            css += `.hdr_banner { display: none !important; }
`;
        }

        if (settings.hideStatsBar) {
            css += `.sitestats { display: none !important; }
`;
        }

        if (settings.hideHeaderTime) {
            css += `.hdr_time_login_row { display: none !important; }
body.has_hdr_time_login_row .hdr_clear_both { display: none !important; }
`;
        }

        if (settings.hideLoginLinks) {
            css += `
.hdr_login_inline,
.hdr_login_mobile,
.hdr_login_btn_row,
.hdr_login_btn,
#topnavlogin,
.thread_login_link,
.topnav_login_btn { display: none !important; }
`;
        }

        if (settings.hideNotifications) {
            css += `.glp_notify_switch { display: none !important; }
`;
        }

        if (settings.hideThemeSwitcher) {
            css += `.theme_mode_switch { display: none !important; }
`;
        }

        if (settings.hideViewportToggle) {
            css += `.viewport_mode_switch { display: none !important; }
`;
        }

        if (settings.compactHeader) {
            css += `
.hdr_top { padding: 2px 10px !important; margin: 0 !important; }
.hdr_top .pagetoplinks2 { margin: 0 !important; padding: 0 !important; }
.hdr_top .pagetoplinks2 li { margin: 0 2px !important; }
.hdr_top br.clfix { display: none !important; }
br.hdr_clear_both { display: none !important; }
`;
        }

        // ---- Navigation ----
        if (settings.hideTopLinks) {
            css += `.hdr_top { display: none !important; }
`;
        }

        if (settings.hideMainNav) {
            css += `.topnav.topnav_main, .topnav_main.topnav { display: none !important; }
`;
        }

        if (settings.hideTabNav) {
            css += `.tabnav { display: none !important; }
`;
        }

        if (settings.hideThreadControls) {
            css += `.thread_top_controls { display: none !important; }
`;
        }

        if (settings.hideRSS) {
            css += `.tab_rss, .sm_rss, a[id="rss_link"] { display: none !important; }
`;
        }

        if (settings.hideChatRoom) {
            css += `li:has(a[href*="glpvc.com"]) { display: none !important; }
`;
        }

        if (settings.hideJoinLink) {
            css += `li:has(a[href*="join.php"]) { display: none !important; }
`;
        }

        if (settings.hideMobilePostNew) {
            css += `.mobile_postnew_wrap { display: none !important; }
`;
        }

        if (settings.hideExtrasMenu) {
            css += `.tab_extras { display: none !important; }
`;
        }

        if (settings.compactNav) {
            css += `
.topnav { padding: 0 !important; }
.mainpagenavlinks { height: auto !important; min-height: 0 !important; min-width: 0 !important; padding: 6px 0 !important; }
.mainpagenavlinks ul { display: flex !important; align-items: center !important; gap: 8px !important; }
.mainpagenavlinks li { margin: 0 !important; }
.mainpagenavlinks li > div { display: none !important; }
.mainpagenavlinks li > br { display: none !important; }
.messagetopnavlinks { padding: 4px 0 !important; }
.messagetoplinks li > br { display: none !important; }
.messagetoplinks li > a > span { display: none !important; }
.tabnav { margin: 0 !important; }
.tab { padding: 4px 8px !important; }
.topnav_search_mobile { display: none !important; }
`;
        }

        if (settings.stickyNav) {
            css += `
.topnav { position: sticky !important; top: 0 !important; z-index: 1000 !important; background: inherit !important; }
.thread_top_controls { position: sticky !important; top: 0 !important; z-index: 1000 !important; }
`;
        }

        // ---- Thread List ----
        if (settings.hideIconColumn) {
            css += `.ih, .ifr { display: none !important; }
`;
        }

        if (settings.hideRatingColumn) {
            css += `.vh, .vfr { display: none !important; }
`;
        }

        if (settings.hideViewsColumn) {
            css += `.vih, .vifr { display: none !important; }
`;
        }

        if (settings.hidePostedColumn) {
            css += `.ph, .pfr { display: none !important; }
`;
        }

        if (settings.hideUpdatedColumn) {
            css += `.mh, .mfr { display: none !important; }
`;
        }

        if (settings.hidePosterColumn) {
            css += `.hh, .hfr { display: none !important; }
`;
        }

        if (settings.hideRepliesColumn) {
            css += `.rh, .rfr { display: none !important; }
`;
        }

        if (settings.hidePageLinks) {
            css += `.mlinks { display: none !important; }
`;
        }

        if (settings.hideMobileThreadMeta) {
            css += `.mobile-thread-meta { display: none !important; }
`;
        }

        if (settings.hideThreadHeaderRow) {
            css += `.threads_header_row { display: none !important; }
`;
        }

        if (settings.hideForumPageNav) {
            css += `.threads-wrapper > .title { display: none !important; }
`;
        }

        if (settings.compactThreadList) {
            css += `
.threads td { padding: 3px 6px !important; }
.threads .sfr { line-height: 1.3 !important; }
.threads .sfr a { display: block !important; }
.threads-wrapper .title { padding: 2px 0 !important; margin: 0 !important; }
.threads .ufr { display: none !important; }
.threads .uh { display: none !important; }
.threads { border-collapse: collapse !important; }
.navpages { padding: 4px 8px !important; font-size: 12px !important; }
`;
        }

        if (settings.zebraStripes) {
            css += `
.threads tr.even { background: rgba(255, 255, 255, 0.03) !important; }
.threads tr.odd { background: rgba(255, 255, 255, 0.01) !important; }
`;
        }

        if (settings.highlightPinnedThreads) {
            css += `
tr:has(.ifr span[title="Pinned Thread"]),
tr:has(.ifr span[title="Karma Pin"]) {
    border-left: 3px solid var(--glpx-accent) !important;
}
`;
        }

        if (settings.highlightSuperPins) {
            css += `
tr:has(.ifr img[src*="superpin"]) {
    border-left: 3px solid var(--glpx-warning) !important;
    background: linear-gradient(90deg, rgba(230, 168, 32, 0.08) 0%, transparent 40%) !important;
}
`;
        }

        // ---- Post Display ----
        if (settings.hideAvatars) {
            css += `.author_avatar { display: none !important; }
`;
        }

        if (settings.hideKarmaBar) {
            css += `.author_karma { display: none !important; }
`;
        }

        if (settings.hideUserID) {
            css += `.author_uid { display: none !important; }
`;
        }

        if (settings.hideGeoLocation) {
            css += `.author_geo { display: none !important; }
`;
        }

        if (settings.hidePostDate) {
            css += `.author_date { display: none !important; }
`;
        }

        if (settings.hideReportLinks) {
            css += `.post_report_links { display: none !important; }
`;
        }

        if (settings.hideSignatures) {
            css += `.sig1, .sig2 { display: none !important; }
`;
        }

        if (settings.hideLastEdited) {
            css += `.lastedit { display: none !important; }
`;
        }

        if (settings.hideRateSection) {
            css += `.section.rate { display: none !important; }
`;
        }

        if (settings.hidePostActions) {
            css += `.post_actions { display: none !important; }
`;
        }

        if (settings.hideReplyTitles) {
            css += `.post_hdr > b { display: none !important; }
`;
        }

        if (settings.hideSubscriberBadge) {
            css += `.rmember { display: none !important; }
`;
        }

        if (settings.hideInlineReplyAds) {
            css += `
.post_main > div[style*="float: right"][style*="padding"]:has([data-type="_mgwidget"]),
.post_main > div[style*="float: right"][style*="padding"]:has(amp-embed),
.post_main > div[style*="float"][style*="replies inline"] { display: none !important; }
`;
        }

        if (settings.compactPostTitle) {
            css += `
.msgtitle { padding: 6px 10px !important; }
.msgtitle h1 { font-size: 16px !important; margin: 0 !important; }
.msgtitle .sm_rss { display: none !important; }
`;
        }

        if (settings.smallerAvatars) {
            css += `
.author_avatar img { max-width: 80px !important; max-height: 80px !important; width: auto !important; height: auto !important; }
.author_avatar > br { display: none !important; }
`;
        }

        if (settings.readerMode) {
            css += `
body.glpx-reader-active .messageauthor,
body.glpx-reader-active .replyauthor { display: none !important; }
body.glpx-reader-active .msg colgroup col.msgcol_author { width: 0 !important; }
body.glpx-reader-active .messagecontent,
body.glpx-reader-active .replycontent {
    padding: 16px 20px !important;
    max-width: 720px !important;
    margin: 0 auto !important;
    font-size: 15px !important;
    line-height: 1.6 !important;
}
body.glpx-reader-active .msgtitle { text-align: center !important; padding: 16px 20px !important; }
body.glpx-reader-active .msgtitle h1 { font-size: 20px !important; }
body.glpx-reader-active #rightpanel_wrap,
body.glpx-reader-active .rightpanel_ipad,
body.glpx-reader-active .post_report_links,
body.glpx-reader-active .author_karma,
body.glpx-reader-active .post_actions,
body.glpx-reader-active .author_meta_pre,
body.glpx-reader-active .author_meta_post,
body.glpx-reader-active table.threads.related { display: none !important; }
body.glpx-reader-active .msg tr + tr[id^="post_"] > td {
    border-top: 1px solid rgba(255,255,255,0.06) !important;
    padding-top: 14px !important;
}
body.glpx-reader-active .post_hdr {
    font-size: 11px !important; color: #9aa8c7 !important;
    margin-bottom: 8px !important; padding-bottom: 6px !important;
    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}
body.glpx-reader-active .glp-reader-byline {
    display: block; font-size: 12px; color: #9aa8c7;
    margin-bottom: 4px; font-weight: 600;
}
`;
        }

        if (settings.highlightOP) {
            css += `
.glp-op-badge { color: var(--glpx-warning) !important; font-weight: bold !important; }
`;
        }

        if (settings.collapseLongQuotes) {
            css += `
.quoteo .quoteo .quoteo { max-height: 80px; overflow: hidden; position: relative; }
.quoteo .quoteo .quoteo::after {
    content: "...deeply nested quote collapsed...";
    display: block;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(transparent, var(--glpx-surface-2));
    color: var(--glpx-muted);
    font-size: 11px;
    text-align: center;
    line-height: 30px;
}
`;
        }

        if (settings.compactPosts) {
            css += `
.messageauthor, .replyauthor { padding: 6px 8px !important; }
.messagecontent, .replycontent { padding: 8px 10px !important; }
.author_inner { gap: 3px !important; }
.author_meta_pre { gap: 0 !important; }
.author_meta_post { margin-top: 0 !important; }
.author_meta_post > br { display: none !important; }
.author_header { margin-bottom: 2px !important; }
.author_header > br { display: none !important; }
.post_hdr { padding-bottom: 4px !important; margin-bottom: 6px !important; }
.post_wrap { padding: 0 !important; }
.msg .nav { padding: 4px 8px !important; }
.msg .navpages { font-size: 12px !important; }
.msg .navctrl { padding: 0 6px !important; }
.msg tr + tr.post_member_0 > td,
.msg tr + tr[class*="post_member_"] > td { border-top: 1px solid rgba(255,255,255,0.05) !important; }
`;
        }

        if (settings.widerContent) {
            css += `
.msg .msgcol_author { width: 120px !important; min-width: 120px !important; }
.msg colgroup col.msgcol_author { width: 120px !important; }
@media (max-width: 768px) {
    .msg .msgcol_author { width: 90px !important; min-width: 90px !important; }
}
`;
        }

        // ---- Quote Styling ----
        if (settings.compactQuotes) {
            css += `
.quoteo { margin: 6px 0 !important; padding: 6px 10px !important; }
.quotei { padding: 0 !important; }
.quoteo font[size="1"] { font-size: 11px !important; opacity: 0.7; }
`;
        }

        if (settings.quoteDepthBadges) {
            css += `
.glp-quote-depth {
    display: inline-block; font-size: 9px; font-weight: 700;
    background: rgba(var(--glpx-accent-rgb),0.15); color: var(--glpx-accent);
    padding: 0 4px; border-radius: 4px; margin-right: 4px;
    vertical-align: middle; line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`;
        }

        if (settings.mediaActions) {
            css += `
.glp-media-actions {
    display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.glp-media-action {
    cursor: pointer; font-size: 11px; line-height: 1.5;
    color: #dce7ff; background: rgba(255,255,255,0.055);
    border: 1px solid rgba(147,168,211,0.22); border-radius: 6px; padding: 2px 8px;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
    font-family: inherit;
}
.glp-media-action:hover,
.glp-media-action:focus-visible {
    background: rgba(var(--glpx-accent-rgb),0.18); border-color: rgba(var(--glpx-accent-rgb),0.44);
    transform: translateY(-1px);
}
`;
        }

        if (settings.quoteBacklinks) {
            css += `
.glp-backlinks {
    display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
    margin-top: 10px; padding-top: 8px;
    border-top: 1px solid rgba(147,168,211,0.14);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
}
.glp-backlinks-label { color: #8592b0; font-weight: 650; letter-spacing: 0.02em; }
.glp-backlink,
.glp-quote-jump {
    cursor: pointer; font-size: 11px; line-height: 1.5;
    color: #dce7ff; background: rgba(var(--glpx-accent-rgb),0.10);
    border: 1px solid rgba(var(--glpx-accent-rgb),0.24);
    border-radius: 6px; padding: 2px 7px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.glp-backlink:hover,
.glp-quote-jump:hover,
.glp-backlink:focus-visible,
.glp-quote-jump:focus-visible {
    background: rgba(var(--glpx-accent-rgb),0.20); border-color: rgba(var(--glpx-accent-rgb),0.46);
    transform: translateY(-1px);
}
.glp-quote-jump { margin-left: 6px; vertical-align: middle; }
.glp-post-flash { animation: glp-post-flash 1.6s ease-out; }
@keyframes glp-post-flash {
    0% { box-shadow: inset 0 0 0 9999px rgba(var(--glpx-accent-rgb),0.22); }
    100% { box-shadow: inset 0 0 0 9999px rgba(var(--glpx-accent-rgb),0); }
}
#glp-backlink-card {
    position: absolute; z-index: 2147483645; pointer-events: none;
    max-width: 340px; padding: 8px 10px;
    background: var(--glpx-elevated); color: var(--glpx-text);
    border: 1px solid var(--glpx-border); border-radius: var(--glpx-r-md);
    box-shadow: var(--glpx-shadow-2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px; line-height: 1.45;
    opacity: 0; transition: opacity 0.12s ease;
}
#glp-backlink-card.glp-backlink-card-visible { opacity: 1; }
`;
        }

        if (settings.collapseNestedQuotes) {
            css += `
.glp-nested-collapsed {
    max-height: 0 !important; overflow: hidden !important;
    padding: 0 !important; margin: 0 !important; border: none !important;
    transition: max-height 0.2s ease;
}
.glp-nested-collapsed.glp-nested-expanded {
    max-height: none !important; overflow: visible !important;
    padding: 6px 10px !important; margin: 6px 0 !important;
    border-left: 3px solid ${settings.quoteBorderColor} !important;
}
.glp-nested-toggle {
    display: inline-block; cursor: pointer;
    font-size: 11px; color: var(--glpx-accent); margin: 4px 0;
    background: rgba(var(--glpx-accent-rgb),0.08); border: 1px solid rgba(var(--glpx-accent-rgb),0.18);
    border-radius: 4px; padding: 2px 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.15s, border-color 0.15s;
}
.glp-nested-toggle:hover { background: rgba(var(--glpx-accent-rgb),0.16); border-color: rgba(var(--glpx-accent-rgb),0.34); }
`;
        }

        css += `.quoteo { border-left: 3px solid ${settings.quoteBorderColor} !important; }
`;

        // ---- Visual Enhancements ----
        css += `
body, .post_main, .sfr a, td { font-size: ${settings.fontSize}px !important; }
.post_main { line-height: ${settings.lineHeight} !important; }
`;

        if (settings.maxContentWidth > 0) {
            css += `
#wrap, #wrap_in { max-width: ${settings.maxContentWidth}px !important; margin: 0 auto !important; }
`;
        }

        // ---- Color Theme ---- (palette hoisted to THEME_PALETTES)

        if (settings.darkModeEnhance) {
            css += `
body.glp-enhanced-active,
body.glpx-enabled {
    /* Everything else is inherited from the token layer, which is the one place those names are
       defined. A second definition of --glpx-border lived here, so the same token drew one line
       on page content and a different one on product chrome. */
    --glpx-z-overlay: 999999;
    --glpx-z-toast: 1000002;
}
body { background: var(--glpx-bg, ${t.bg}) !important; }
#wrap, #wrap_in { background: transparent !important; }
#rightpanel_wrap, #rightpanel_inner, .rightpanel_ipad { background: transparent !important; }
.threads tr:hover { background: ${t.hover} !important; }
.msg tr:hover td { background: rgba(255, 255, 255, 0.02) !important; }
a { color: ${t.link} !important; }
a:hover { color: ${t.linkHover} !important; }
.post_hdr b { color: #fff !important; }
.threads-wrapper, .navdiv { background: transparent !important; }
.threads { background: transparent !important; }
.threads tr.even, .threads tr.odd { background: transparent !important; }
.threads td { border-color: ${t.border} !important; }
.threads_header_row th { background: ${t.headerBg} !important; border-bottom: 1px solid ${t.border} !important; }
.threads_header_row th a { color: #999 !important; font-size: 12px !important; }
.navpages a { color: ${t.link} !important; }
.navpages b { color: #fff !important; }
.msgtitle { background: ${t.titleBg} !important; }
.msgtitle h1 { color: #fff !important; }
.msg td { background: transparent !important; }
.messageauthor, .replyauthor { background: rgba(255,255,255,0.02) !important; }
.messagecontent, .replycontent { background: transparent !important; }
.nav { background: ${t.headerBg} !important; }
.section, .title { background: transparent !important; }
td.nav { border-color: ${t.border} !important; }
.glp-btn-primary { background: ${t.accent} !important; }
.quoteo { border-left-color: ${t.accent} !important; }
#glp-back-to-top { background: ${t.accent}cc !important; }
#glp-back-to-top:hover { background: ${t.accent} !important; }
.glp-post-number { background: ${t.accent}26 !important; color: ${t.link} !important; }
#glp-hidden-threads-bar .count { color: ${t.link} !important; }

/* Theme selector in nav */
#glp-theme-select {
    background: ${t.headerBg}; color: ${t.link}; border: 1px solid ${t.border};
    padding: 5px 8px; border-radius: 6px; font-size: 12px; cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
#glp-theme-select option { background: ${t.bg}; color: #ccc; }
#glp-forum-toolbar {
    background: ${t.headerBg}; border: 1px solid ${t.border};
    border-radius: 8px; margin: 8px 0; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.glp-toolbar-label { color: #9aa8c7; font-weight: 650; }
.glp-toolbar-spacer { flex: 1; }
.glp-settings-inline-btn,
.glp-nav-gear a {
    display: inline-flex; align-items: center; gap: 6px;
    color: #dce7ff !important; text-decoration: none !important;
    background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px; padding: 5px 9px; cursor: pointer; font-size: 12px; font-weight: 650;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.glp-settings-inline-btn:hover,
.glp-nav-gear a:hover {
    color: #fff !important; background: rgba(var(--glpx-accent-rgb),0.16);
    border-color: rgba(var(--glpx-accent-rgb),0.38); transform: translateY(-1px);
}

/* Thread reading surface. GLP's native table is kept intact, but each row gets enough visual
   structure to read as a post instead of one uninterrupted sheet of tiny text. */
html { background: var(--glpx-canvas) !important; }
body.glp-enhanced-active {
    background:
        radial-gradient(circle at 84% -10%, rgba(var(--glpx-accent-rgb), 0.14), transparent 34rem),
        linear-gradient(180deg, color-mix(in srgb, var(--glpx-bg) 92%, var(--glpx-accent) 8%) 0, var(--glpx-canvas) 30rem)
        !important;
    color: var(--glpx-text) !important;
    font-family: "Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important;
    font-kerning: normal;
    text-rendering: optimizeLegibility;
}
body.glp-enhanced-active :where(button, input, select, textarea) { font-family: inherit !important; }
body.glp-enhanced-active #wrap,
body.glp-enhanced-active #wrap_in {
    width: calc(100% - 24px) !important;
    margin-inline: auto !important;
    box-sizing: border-box !important;
}
body.glp-enhanced-active .msg,
body.glp-enhanced-active .msg :where(td, div, span, a, button, input, select),
body.glp-enhanced-active .post_main {
    font-family: inherit !important;
}

body.glp-enhanced-active .threads-wrapper > .title {
    min-height: 0 !important;
    margin: 0 0 6px !important;
    padding: 8px 11px !important;
    background: var(--glpx-surface-low) !important;
    border: 1px solid var(--glpx-border-soft) !important;
    border-radius: var(--glpx-r-md) !important;
    box-shadow: var(--glpx-shadow-1);
    color: var(--glpx-muted) !important;
    font-size: 12px !important;
}
body.glp-enhanced-active .threads-wrapper > .title .navpages {
    float: none !important;
    color: var(--glpx-muted) !important;
}
body.glp-enhanced-active table.threads {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 5px !important;
    background: transparent !important;
}
body.glp-enhanced-active .threads tr:not(.threads_header_row) > td {
    padding: 8px 9px !important;
    background: var(--glpx-surface-low) !important;
    border-top: 1px solid var(--glpx-border-soft) !important;
    border-bottom: 1px solid var(--glpx-border-soft) !important;
    color: var(--glpx-text) !important;
    vertical-align: middle !important;
    transition: background var(--glpx-ease), border-color var(--glpx-ease);
}
body.glp-enhanced-active .threads tr:not(.threads_header_row) > td:first-child {
    border-left: 1px solid var(--glpx-border-soft) !important;
    border-radius: var(--glpx-r-sm) 0 0 var(--glpx-r-sm) !important;
}
body.glp-enhanced-active .threads tr:not(.threads_header_row) > td:last-child {
    border-right: 1px solid var(--glpx-border-soft) !important;
    border-radius: 0 var(--glpx-r-sm) var(--glpx-r-sm) 0 !important;
}
body.glp-enhanced-active .threads tr:not(.threads_header_row):hover > td {
    background: color-mix(in srgb, var(--glpx-surface-mid) 88%, var(--glpx-accent) 12%) !important;
    border-color: var(--glpx-border) !important;
}
body.glp-enhanced-active .threads .sfr {
    line-height: 1.35 !important;
}
body.glp-enhanced-active .threads .sfr > a {
    color: var(--glpx-link-hover) !important;
    font-weight: 630;
    text-decoration: none !important;
}
body.glp-enhanced-active .threads .sfr > a:hover {
    color: var(--glpx-text) !important;
    text-decoration: underline !important;
    text-decoration-color: rgba(var(--glpx-link-rgb), 0.48) !important;
    text-underline-offset: 3px;
}
body.glp-enhanced-active .threads :where(.hfr, .rfr, .vifr, .pfr, .mfr) {
    color: var(--glpx-muted) !important;
    font-size: 12px !important;
}
body.glp-enhanced-active .threads :where(.rfr, .vifr) {
    color: var(--glpx-text) !important;
    font-variant-numeric: tabular-nums;
}
body.glp-enhanced-active .threads tr:has(.ifr span[title="Pinned Thread"]) > td:first-child,
body.glp-enhanced-active .threads tr:has(.ifr span[title="Karma Pin"]) > td:first-child {
    border-left: 3px solid var(--glpx-accent) !important;
}
body.glp-enhanced-active .threads :where(.glp-mute-btn, .glp-tag-btn) {
    min-height: 22px;
    margin: 3px 2px 0 0 !important;
    padding: 2px 6px !important;
    font-size: 9px !important;
    opacity: 0.72;
}
body.glp-enhanced-active .threads :where(.glp-mute-btn, .glp-tag-btn):hover,
body.glp-enhanced-active .threads :where(.glp-mute-btn, .glp-tag-btn):focus-visible { opacity: 1; }

body.glp-enhanced-active table.msg {
    width: 100% !important;
    table-layout: auto !important;
    border-collapse: separate !important;
    border-spacing: 0 10px !important;
    background: transparent !important;
}
body.glp-enhanced-active .msg colgroup col.msgcol_author {
    width: ${settings.widerContent ? '140px' : '180px'} !important;
}

body.glp-enhanced-active .msg td.nav {
    padding: 8px 10px !important;
    background: linear-gradient(180deg, rgba(var(--glpx-accent-rgb), 0.08), transparent), var(--glpx-surface-low) !important;
    border: 1px solid var(--glpx-border-soft) !important;
    border-radius: var(--glpx-r-lg) !important;
    box-shadow: var(--glpx-shadow-1);
    color: var(--glpx-muted) !important;
}
body.glp-enhanced-active .msg td.nav > .navctrl,
body.glp-enhanced-active .msg td.nav > .navpages,
body.glp-enhanced-active .msg td.nav > form > .navctrl,
body.glp-enhanced-active .msg td.nav > form > .navpages {
    float: none !important;
    display: inline-flex !important;
    align-items: center !important;
    min-height: 32px;
    margin: 0 5px 0 0 !important;
    padding: 0 !important;
    vertical-align: middle;
    color: var(--glpx-muted) !important;
}
body.glp-enhanced-active .msg td.nav > form {
    display: flex !important;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
}
body.glp-enhanced-active .msg td.nav .navctrl > a,
body.glp-enhanced-active .msg td.nav .navdisabled {
    display: inline-flex !important;
    align-items: center;
    min-height: 32px;
    box-sizing: border-box;
    padding: 6px 10px !important;
    background: var(--glpx-ghost) !important;
    border: 1px solid var(--glpx-ghost-border) !important;
    border-radius: var(--glpx-r-sm) !important;
    color: var(--glpx-text) !important;
    font-size: 12px !important;
    font-weight: 650;
    line-height: 1.2;
    text-decoration: none !important;
}
body.glp-enhanced-active .msg td.nav .navctrl > a:hover {
    background: var(--glpx-ghost-hover) !important;
    border-color: var(--glpx-border-strong) !important;
}
body.glp-enhanced-active .msg td.nav .navdisabled {
    color: var(--glpx-subtle) !important;
    opacity: 0.62;
}
body.glp-enhanced-active .msg td.nav .navpages {
    margin-left: 4px !important;
    padding: 0 8px !important;
    font-size: 12px !important;
    white-space: nowrap;
}
body.glp-enhanced-active .msg td.nav :where(input[type="text"], input[type="submit"]) {
    min-height: 32px;
    box-sizing: border-box;
    border: 1px solid var(--glpx-border) !important;
    border-radius: var(--glpx-r-sm) !important;
}
body.glp-enhanced-active .msg td.nav input[type="text"] {
    background: var(--glpx-canvas) !important;
    color: var(--glpx-text) !important;
    padding: 6px 9px !important;
}
body.glp-enhanced-active .msg td.nav input[type="submit"] {
    background: var(--glpx-accent) !important;
    color: var(--glpx-on-accent) !important;
    padding: 6px 11px !important;
    font-weight: 750;
}

body.glp-enhanced-active #glp-theme-select {
    min-width: 138px;
    min-height: 32px;
    box-sizing: border-box;
    background: var(--glpx-surface-mid) !important;
    color: var(--glpx-text) !important;
    border: 1px solid var(--glpx-border) !important;
    border-radius: var(--glpx-r-sm) !important;
    padding: 5px 28px 5px 9px !important;
}

body.glp-enhanced-active .msgtitle {
    display: table-cell !important;
    vertical-align: middle !important;
    padding: ${settings.compactPostTitle ? '14px 18px' : '18px 22px'} !important;
    background:
        linear-gradient(120deg, rgba(var(--glpx-accent-rgb), 0.17), rgba(var(--glpx-link-rgb), 0.05) 48%, transparent 72%),
        var(--glpx-surface-low) !important;
    border: 1px solid var(--glpx-border) !important;
    border-left: 4px solid var(--glpx-accent) !important;
    border-radius: var(--glpx-r-lg) !important;
    box-shadow: var(--glpx-shadow-1);
}
body.glp-enhanced-active .msgtitle h1 {
    margin: 0 !important;
    color: var(--glpx-text) !important;
    font-family: inherit !important;
    font-size: ${settings.compactPostTitle ? '20px' : '24px'} !important;
    font-weight: 760 !important;
    line-height: 1.22 !important;
    letter-spacing: -0.025em;
    text-wrap: balance;
}
body.glp-enhanced-active .msg td.nav .navpages b { margin-left: 4px; }

body.glp-enhanced-active .msg tr[id^="post_"] > .messageauthor,
body.glp-enhanced-active .msg tr[id^="post_"] > .replyauthor {
    width: ${settings.widerContent ? '168px' : '208px'} !important;
    min-width: ${settings.widerContent ? '168px' : '208px'} !important;
    max-width: ${settings.widerContent ? '168px' : '208px'} !important;
    box-sizing: border-box;
    padding: ${settings.compactPosts ? '11px 12px' : '16px 15px'} !important;
    background:
        linear-gradient(180deg, rgba(var(--glpx-accent-rgb), 0.09), transparent 9rem),
        var(--glpx-surface-mid) !important;
    border: 1px solid var(--glpx-border-soft) !important;
    border-right-color: rgba(var(--glpx-accent-rgb), 0.13) !important;
    border-radius: var(--glpx-r-lg) 0 0 var(--glpx-r-lg) !important;
    box-shadow: -6px 10px 24px -18px rgba(0, 0, 0, 0.86);
    color: var(--glpx-muted) !important;
    vertical-align: top !important;
}
body.glp-enhanced-active .msg tr[id^="post_"] > .messagecontent,
body.glp-enhanced-active .msg tr[id^="post_"] > .replycontent {
    padding: ${settings.compactPosts ? '12px 16px' : '18px 22px'} !important;
    background:
        linear-gradient(145deg, rgba(255, 255, 255, 0.025), transparent 32rem),
        var(--glpx-surface-low) !important;
    border: 1px solid var(--glpx-border-soft) !important;
    border-left: 0 !important;
    border-radius: 0 var(--glpx-r-lg) var(--glpx-r-lg) 0 !important;
    box-shadow: 8px 10px 28px -20px rgba(0, 0, 0, 0.9);
    color: var(--glpx-text) !important;
    vertical-align: top !important;
}
body.glp-enhanced-active .msg tr[id^="post_"]:hover > .messageauthor,
body.glp-enhanced-active .msg tr[id^="post_"]:hover > .replyauthor {
    background:
        linear-gradient(180deg, rgba(var(--glpx-accent-rgb), 0.14), transparent 10rem),
        var(--glpx-surface-mid) !important;
    border-color: var(--glpx-border) !important;
}
body.glp-enhanced-active .msg tr[id^="post_"]:hover > .messagecontent,
body.glp-enhanced-active .msg tr[id^="post_"]:hover > .replycontent {
    background:
        linear-gradient(145deg, rgba(var(--glpx-accent-rgb), 0.055), transparent 34rem),
        var(--glpx-surface-low) !important;
    border-color: var(--glpx-border) !important;
    border-left: 0 !important;
}

body.glp-enhanced-active .author_header {
    margin: 0 0 8px !important;
    padding: 0 0 8px;
    border-bottom: 1px solid var(--glpx-border-soft);
    color: var(--glpx-text) !important;
    font-size: 13px !important;
    font-weight: 720;
    line-height: 1.35 !important;
}
body.glp-enhanced-active .author_header a {
    color: var(--glpx-link-hover) !important;
    text-decoration: none !important;
}
body.glp-enhanced-active :where(.author_meta_pre, .author_meta_post) {
    margin-top: 7px !important;
    color: var(--glpx-muted) !important;
    font-size: 11px !important;
    line-height: 1.5 !important;
}
body.glp-enhanced-active .author_uid { color: var(--glpx-subtle) !important; }
body.glp-enhanced-active .author_avatar { margin-top: 10px !important; }
body.glp-enhanced-active .author_avatar img {
    display: block;
    margin: 0 auto;
    border: 1px solid var(--glpx-border) !important;
    border-radius: var(--glpx-r-md) !important;
    box-shadow: var(--glpx-shadow-1);
}
body.glp-enhanced-active .msg :where(.glp-mute-btn, .glp-tag-btn, .glp-block-btn) {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    min-height: 26px;
    box-sizing: border-box;
    margin: 7px 4px 0 0 !important;
    padding: 4px 7px !important;
    border-radius: var(--glpx-r-sm) !important;
    font-size: 10px !important;
    font-weight: 720;
    line-height: 1.2 !important;
    opacity: 0.78;
}
body.glp-enhanced-active .msg :where(.glp-mute-btn, .glp-tag-btn, .glp-block-btn):hover,
body.glp-enhanced-active .msg :where(.glp-mute-btn, .glp-tag-btn, .glp-block-btn):focus-visible { opacity: 1; }

body.glp-enhanced-active .post_hdr {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    margin: 0 0 11px !important;
    padding: 0 0 9px !important;
    border-bottom: 1px solid var(--glpx-border-soft) !important;
    color: var(--glpx-muted) !important;
}
body.glp-enhanced-active .post_hdr > b {
    min-width: 0;
    overflow: hidden;
    color: var(--glpx-muted) !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-overflow: ellipsis;
    white-space: nowrap;
}
body.glp-enhanced-active .post_actions {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
}
body.glp-enhanced-active .glp-post-number {
    padding: 3px 7px !important;
    background: var(--glpx-ghost) !important;
    border: 1px solid var(--glpx-ghost-border);
    border-radius: var(--glpx-r-xs) !important;
    color: var(--glpx-link-hover) !important;
    font-size: 11px !important;
    font-weight: 760 !important;
    line-height: 1.2;
}
body.glp-enhanced-active .post_main {
    color: var(--glpx-text) !important;
    font-size: ${settings.fontSize}px !important;
    line-height: ${settings.lineHeight} !important;
    overflow-wrap: anywhere;
}
body.glp-enhanced-active .post_main > a:not(:has(img)) {
    text-decoration-line: underline !important;
    text-decoration-color: rgba(var(--glpx-link-rgb), 0.42) !important;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
}
body.glp-enhanced-active .post_main img { max-width: 100% !important; height: auto; }

body.glp-enhanced-active .quoteo {
    margin: 10px 0 !important;
    padding: 10px 12px !important;
    background:
        linear-gradient(135deg, rgba(var(--glpx-accent-rgb), 0.07), transparent 22rem),
        var(--glpx-surface-mid) !important;
    border: 1px solid var(--glpx-border-soft) !important;
    border-left: 3px solid var(--glpx-accent) !important;
    border-radius: var(--glpx-r-md) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
    color: color-mix(in srgb, var(--glpx-text) 90%, var(--glpx-muted) 10%) !important;
}
body.glp-enhanced-active .quoteo .quoteo {
    margin: 8px 0 !important;
    background: color-mix(in srgb, var(--glpx-surface-high) 76%, var(--glpx-canvas) 24%) !important;
}
body.glp-enhanced-active .quotei { line-height: 1.55 !important; }
body.glp-enhanced-active .quoteo font[size="1"] {
    display: block;
    margin-top: 7px;
    padding-top: 7px;
    border-top: 1px solid var(--glpx-border-soft);
    color: var(--glpx-muted) !important;
    font-size: 11px !important;
    line-height: 1.45;
}
body.glp-enhanced-active .glp-backlinks {
    margin-top: 12px;
    padding-top: 9px;
    border-top-color: var(--glpx-border-soft);
}

body.glp-enhanced-active .glp-op-post > .messageauthor,
body.glp-enhanced-active .glp-op-post > .replyauthor {
    background:
        linear-gradient(180deg, rgba(var(--glpx-warning-rgb), 0.14), transparent 10rem),
        var(--glpx-surface-mid) !important;
    border-left: 3px solid var(--glpx-warning) !important;
}
body.glp-enhanced-active .glp-op-post > .messagecontent,
body.glp-enhanced-active .glp-op-post > .replycontent {
    border-top-color: rgba(var(--glpx-warning-rgb), 0.38) !important;
    border-right-color: rgba(var(--glpx-warning-rgb), 0.28) !important;
    border-bottom-color: rgba(var(--glpx-warning-rgb), 0.28) !important;
}
body.glp-enhanced-active .glp-op-badge {
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    margin-left: 4px;
    padding: 2px 5px;
    background: rgba(var(--glpx-warning-rgb), 0.13);
    border: 1px solid rgba(var(--glpx-warning-rgb), 0.36);
    border-radius: var(--glpx-r-xs);
    color: var(--glpx-warning) !important;
    font-size: 9px;
    line-height: 1;
}

body.glp-enhanced-active #glp-thread-tools-bar,
body.glp-enhanced-active #glp-collapse-all-bar {
    gap: 6px;
    padding: 10px;
    margin: 10px 0 4px;
    background:
        linear-gradient(110deg, rgba(var(--glpx-accent-rgb), 0.13), transparent 36rem),
        var(--glpx-surface-low);
    border-color: var(--glpx-border);
    box-shadow: 0 10px 30px -20px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.025);
}
body.glp-enhanced-active #glp-thread-tools-bar button,
body.glp-enhanced-active #glp-collapse-all-bar button {
    min-height: 32px;
    padding: 6px 10px;
    line-height: 1.2;
}
body.glp-enhanced-active #glp-noise-chip {
    background: rgba(var(--glpx-accent-rgb), 0.20);
    border-color: var(--glpx-border-strong);
    color: var(--glpx-link-hover);
}

@media (max-width: 760px) {
    body.glp-enhanced-active #wrap,
    body.glp-enhanced-active #wrap_in { width: calc(100% - 12px) !important; }
    body.glp-enhanced-active #glp-forum-toolbar {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 8px !important;
        padding: 10px !important;
    }
    body.glp-enhanced-active #glp-forum-toolbar > .glp-toolbar-label { grid-column: 1; grid-row: 1; }
    body.glp-enhanced-active #glp-forum-toolbar > #glp-theme-select {
        grid-column: 2;
        grid-row: 1;
        min-width: 0;
        width: 100%;
    }
    body.glp-enhanced-active #glp-forum-toolbar > .glp-toolbar-spacer { display: none !important; }
    body.glp-enhanced-active #glp-forum-toolbar > #glp-open-settings-btn {
        grid-column: 3;
        grid-row: 1;
        min-height: 32px;
    }
    body.glp-enhanced-active #glp-forum-toolbar > .glp-sort-group {
        grid-column: 1 / -1;
        grid-row: 2;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        width: 100%;
    }
    body.glp-enhanced-active #glp-forum-toolbar .glp-sort-item {
        justify-content: space-between;
        min-width: 0;
    }
    body.glp-enhanced-active #glp-forum-toolbar .glp-toolbar-btn { min-height: 30px; }

    body.glp-enhanced-active .threads-wrapper { min-width: 0 !important; overflow: hidden !important; }
    body.glp-enhanced-active table.threads,
    body.glp-enhanced-active table.threads > tbody { display: block !important; width: 100% !important; }
    body.glp-enhanced-active .threads tr.threads_header_row { display: none !important; }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) {
        display: flex !important;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px 10px;
        width: 100%;
        margin: 0 0 6px;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--glpx-surface-low) !important;
        border: 1px solid var(--glpx-border-soft) !important;
        border-radius: var(--glpx-r-md) !important;
    }
    body.glp-enhanced-active .threads tr:has(.ifr span[title="Pinned Thread"]),
    body.glp-enhanced-active .threads tr:has(.ifr span[title="Karma Pin"]) {
        border-left: 3px solid var(--glpx-accent) !important;
    }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > td {
        flex: 0 0 auto;
        width: auto !important;
        max-width: 100%;
        padding: 2px 4px !important;
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
    }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > .sfr {
        order: 1;
        flex: 1 1 calc(100% - 34px);
        min-width: 0;
    }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > .sfr > a {
        display: -webkit-box !important;
        overflow: hidden !important;
        white-space: normal !important;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > .ifr { order: 0; flex-basis: 20px; }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > .glp-hide-col { order: 2; margin-left: auto; }
    body.glp-enhanced-active .threads tr:not(.threads_header_row) > :where(.hfr, .ufr, .rfr, .vifr, .vfr, .pfr, .mfr) {
        order: 3;
        font-size: 11px !important;
    }

    body.glp-enhanced-active table.msg { table-layout: auto !important; border-spacing: 0 8px !important; }
    body.glp-enhanced-active .msg colgroup { display: none !important; }
    body.glp-enhanced-active .msg tr[id^="post_"] {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr);
        width: 100%;
    }
    body.glp-enhanced-active .msg tr[id^="post_"] > .messageauthor,
    body.glp-enhanced-active .msg tr[id^="post_"] > .replyauthor,
    body.glp-enhanced-active .msg tr[id^="post_"] > .messagecontent,
    body.glp-enhanced-active .msg tr[id^="post_"] > .replycontent {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        box-sizing: border-box;
    }
    body.glp-enhanced-active .msg tr[id^="post_"] > .messageauthor,
    body.glp-enhanced-active .msg tr[id^="post_"] > .replyauthor {
        border-right: 1px solid var(--glpx-border-soft) !important;
        border-bottom: 0 !important;
        border-radius: var(--glpx-r-lg) var(--glpx-r-lg) 0 0 !important;
    }
    body.glp-enhanced-active .msg tr[id^="post_"] > .messagecontent,
    body.glp-enhanced-active .msg tr[id^="post_"] > .replycontent {
        border-left: 1px solid var(--glpx-border-soft) !important;
        border-radius: 0 0 var(--glpx-r-lg) var(--glpx-r-lg) !important;
    }
    body.glp-enhanced-active .author_avatar img { margin-inline: 0; }
    body.glp-enhanced-active .msgtitle h1 { font-size: 18px !important; }
    body.glp-enhanced-active .msg td.nav .navpages { display: block !important; margin: 6px 0 0 !important; }
    body.glp-enhanced-active .glp-op-nav { width: 100%; margin-left: 0; }
    body.glp-enhanced-active .glp-op-nav button { flex: 1; min-width: 0; height: 30px; }
}

`;
        }

        // ---- Merged suite chrome (always styled, independent of theme toggle) ----
        css += `
/* Sort controls */
.glp-sort-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.glp-sort-item {
    display: inline-flex; align-items: center; gap: 3px;
    background: rgba(255,255,255,0.04); border: 1px solid ${t.border};
    border-radius: 6px; padding: 3px 6px;
}
.glp-sort-label { color: #9aa8c7; font-size: 11px; font-weight: 650; letter-spacing: 0.02em; }
.glp-sort-btn {
    background: transparent; border: 1px solid transparent; color: #8d9bbb;
    border-radius: 4px; padding: 1px 5px; font-size: 10px; line-height: 1.4; cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.glp-sort-btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
.glp-sort-btn.glp-sort-active {
    color: ${t.bg}; background: ${t.accent}; border-color: ${t.accent}; font-weight: 700;
}

/* Block button */
.glp-block-btn {
    display: inline-block; margin-top: 5px;
    background: rgba(192,57,43,0.16); color: #ff9b91 !important;
    border: 1px solid rgba(192,57,43,0.42); border-radius: 4px;
    padding: 2px 7px; font-size: 10px; font-weight: 700; cursor: pointer;
    transition: background 0.15s, color 0.15s;
}
.glp-block-btn:hover { background: rgba(192,57,43,0.36); color: #fff !important; }

/* Filtered rows */
tr.glp-user-blocked, tr.glp-meme-hidden, tr.glp-pinned-hidden { display: none !important; }
`;

        // ---- Shape treatment ----
        if (settings.shapeStyle === 'rounded') {
            css += `body.glp-enhanced-active table.threads,
body.glp-enhanced-active table.msg,
body.glp-enhanced-active .post_wrap,
body.glp-enhanced-active .quoteo,
body.glp-enhanced-active .threads-wrapper { border-radius: 10px !important; overflow: hidden; }
body.glp-enhanced-active .author_avatar img { border-radius: 8px !important; }
`;
        } else if (settings.shapeStyle === 'square') {
            css += `body.glp-enhanced-active table.threads,
body.glp-enhanced-active table.msg,
body.glp-enhanced-active .post_wrap,
body.glp-enhanced-active .quoteo,
body.glp-enhanced-active .threads-wrapper,
body.glp-enhanced-active .author_avatar img,
body.glp-enhanced-active .msgtitle,
body.glp-enhanced-active .msg td.nav,
body.glp-enhanced-active #glp-thread-tools-bar,
body.glp-enhanced-active #glp-collapse-all-bar,
body.glp-enhanced-active .threads tr:not(.threads_header_row) > td,
body.glp-enhanced-active .msg tr[id^="post_"] > .messageauthor,
body.glp-enhanced-active .msg tr[id^="post_"] > .replyauthor,
body.glp-enhanced-active .msg tr[id^="post_"] > .messagecontent,
body.glp-enhanced-active .msg tr[id^="post_"] > .replycontent { border-radius: 0 !important; }
`;
        }

        if (settings.hideBoomerGifs) {
            css += `.post_main img[src*="/sm/"] { display: none !important; }
`;
        }

        if (settings.smoothScrolling) {
            css += `html { scroll-behavior: smooth !important; }
`;
        }

        // ---- Misc ----
        if (settings.hideRelatedThreads) {
            css += `table.threads.related, .threads-wrapper:has(table.threads.related) { display: none !important; }
`;
        }

        if (settings.hideFooter) {
            css += `#footer { display: none !important; }
`;
        }

        if (settings.hideAllClfix) {
            css += `br.clfix, br[style*="clear: both"], br[style*="clear:both"] { display: none !important; }
`;
        }

        // ---- Thread List Enhancements ----
        if (settings.dimVisitedThreads) {
            css += `
.threads .sfr a:visited { opacity: 0.55 !important; }
`;
        }

        if (settings.truncateTitles) {
            css += `
.threads .sfr a {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 100% !important;
}
`;
        }

        if (settings.hotThreadBadge) {
            css += `
.threads .rfr { font-weight: bold !important; }
`;
        }

        // ---- Post Enhancements ----
        if (settings.dimAnonPosters) {
            css += `
.msg tr.post_member_0 .author_header { opacity: 0.5 !important; }
`;
        }

        if (settings.hideEmoticons) {
            css += `
.post_main img[src*="/sm/"],
.post_main img[alt="1rof1"],
.post_main img[src*="smileys"],
.post_main img[src*="emoticon"] { display: none !important; }
`;
        }

        if (settings.compactFlags) {
            css += `
.author_geo img { width: 14px !important; height: 10px !important; vertical-align: middle !important; margin-right: 3px !important; }
.author_geo { font-size: 11px !important; line-height: 1.3 !important; }
.author_geo > br { display: none !important; }
`;
        }

        if (settings.highlightOPPosts) {
            css += `
.msg tr[class*="post_member_"]:not(.post_member_0) { }
.glp-op-post > td.replycontent { border-left: 3px solid var(--glpx-warning) !important; }
.glp-op-post .author_header b a { color: var(--glpx-warning) !important; }
`;
        }

        if (settings.inlinePostNumbers) {
            css += `
.glp-post-number {
    display: inline-block;
    background: rgba(var(--glpx-accent-rgb), 0.15);
    color: var(--glpx-link);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    margin-right: 6px;
    font-weight: 600;
    vertical-align: middle;
}
`;
        }

        // ---- UI Enhancements ----
        if (settings.backToTopButton) {
            css += `
#glp-back-to-top {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 42px;
    height: 42px;
    background: rgba(var(--glpx-accent-rgb), 0.8);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 10px;
    cursor: pointer;
    z-index: 99998;
    display: none;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 10px 26px rgba(0,0,0,0.34);
}
#glp-back-to-top:hover { transform: translateY(-2px); background: rgba(var(--glpx-accent-rgb), 1); box-shadow: 0 14px 34px rgba(0,0,0,0.42); }
#glp-back-to-top { color: #fff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
#glp-back-to-top.visible { display: flex; }
`;
        }

        if (settings.imageLightbox) {
            css += `
#glp-lightbox {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: var(--glpx-scrim); z-index: 1000000;
    display: flex; align-items: center; justify-content: center;
    cursor: zoom-out;
}
#glp-lightbox img {
    max-width: 95vw; max-height: 95vh; object-fit: contain;
    border-radius: var(--glpx-r-xs); box-shadow: var(--glpx-shadow-3);
}
.post_main img:not([src*="/sm/"]):not([src*="karma"]):not([src*="div.png"]):not([src*="flags/"]):not(.glp-no-lightbox) {
    cursor: zoom-in;
}
`;
        }

        if (settings.collapsiblePosts) {
            css += `
.msg tr[id^="post_"] .messageauthor,
.msg tr[id^="post_"] .replyauthor { cursor: pointer; user-select: none; }
.msg tr[id^="post_"] .messageauthor:hover,
.msg tr[id^="post_"] .replyauthor:hover { opacity: 0.8; }
.glp-collapsed .messagecontent,
.glp-collapsed .replycontent { display: none !important; }
.glp-collapsed .messageauthor,
.glp-collapsed .replyauthor { opacity: 0.4 !important; }
.glp-collapse-indicator {
    display: inline-block; font-size: 10px; color: #888;
    margin-left: 6px; vertical-align: middle;
}
`;
        }

        if (settings.infiniteScroll) {
            css += `
#glp-infinite-loader {
    text-align: center; padding: 20px; color: #888;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
}
#glp-infinite-loader.loading::after {
    content: ''; display: inline-block; width: 16px; height: 16px;
    border: 2px solid var(--glpx-accent); border-top-color: transparent;
    border-radius: 6px; animation: glp-spin 0.8s linear infinite;
    margin-left: 8px; vertical-align: middle;
}
@keyframes glp-spin { to { transform: rotate(360deg); } }
`;
        }

        if (settings.freshnessColors) {
            css += `
.glp-fresh-now { color: #4ade80 !important; font-weight: bold !important; }
.glp-fresh-recent { color: var(--glpx-link) !important; }
.glp-fresh-stale { color: #666 !important; }
`;
        }

        if (settings.userMuteList) {
            css += `
.glp-muted-post { display: none !important; }
.glp-mute-btn {
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 10px; color: #ffd1d1;
    margin-left: 5px; opacity: 0.58; vertical-align: middle;
    background: rgba(217,74,74,0.10); border: 1px solid rgba(217,74,74,0.24);
    border-radius: 6px; padding: 1px 5px; line-height: 1.4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: opacity 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
}
.glp-mute-btn:hover,
.glp-mute-btn:focus-visible { opacity: 1; background: rgba(217,74,74,0.18); border-color: rgba(217,74,74,0.42); transform: translateY(-1px); }
#glp-mute-list {
    max-height: 120px; overflow-y: auto; margin-top: 8px;
    padding: 6px; background: #1a1a2e; border-radius: 4px;
    border: 1px solid #4a4a6a;
}
.glp-mute-entry {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3px 6px; font-size: 12px; color: #ccc;
}
.glp-mute-entry button {
    background: none; border: none; color: #d94a4a; cursor: pointer;
    font-size: 14px; padding: 0 4px;
}
`;
        }

        if (settings.imageGallery) {
            css += `
#glp-lightbox .glp-gallery-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: var(--glpx-elevated); color: var(--glpx-text);
    border: 1px solid var(--glpx-border); font-size: 32px;
    width: 50px; height: 80px; cursor: pointer; border-radius: var(--glpx-r-sm);
    transition: background 0.2s;
}
#glp-lightbox .glp-gallery-nav:hover { background: rgba(var(--glpx-accent-rgb),0.6); }
#glp-lightbox .glp-gallery-prev { left: 15px; }
#glp-lightbox .glp-gallery-next { right: 15px; }
#glp-lightbox .glp-gallery-counter {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    color: var(--glpx-muted); font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`;
        }

        if (settings.userTags) {
            css += `
.glp-user-tag {
    display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 4px;
    margin-left: 4px; vertical-align: middle; font-weight: 600;
    cursor: pointer; line-height: 1.4;
}
.glp-tag-btn {
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 10px; color: var(--glpx-muted);
    margin-left: 4px; vertical-align: middle; opacity: 0.58;
    background: var(--glpx-ghost); border: 1px solid var(--glpx-ghost-border);
    border-radius: var(--glpx-r-sm); padding: 1px 5px; line-height: 1.4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: opacity 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
}
.glp-tag-btn:hover,
.glp-tag-btn:focus-visible { opacity: 1; background: rgba(var(--glpx-accent-rgb),0.14); border-color: rgba(var(--glpx-accent-rgb),0.34); transform: translateY(-1px); }
#glp-tag-picker {
    position: absolute; z-index: 100000; background: var(--glpx-elevated);
    border: 1px solid var(--glpx-border); border-radius: var(--glpx-r-md); padding: 10px;
    box-shadow: var(--glpx-shadow-2);
    min-width: 190px;
}
#glp-tag-picker input {
    background: var(--glpx-bg); border: 1px solid var(--glpx-border);
    color: var(--glpx-text); padding: 7px 8px; border-radius: var(--glpx-r-sm); font-size: 12px;
    width: 100%; box-sizing: border-box; margin-bottom: 8px; outline: none;
}
#glp-tag-picker input:focus { border-color: var(--glpx-accent); box-shadow: var(--glpx-focus); }
.glp-tag-colors { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.glp-tag-swatch {
    width: 28px; height: 24px; border-radius: var(--glpx-r-sm); cursor: pointer;
    border: 2px solid var(--glpx-ghost-border); box-sizing: border-box;
    transition: transform 0.15s, border-color 0.15s;
}
.glp-tag-swatch:hover,
.glp-tag-swatch:focus-visible { transform: translateY(-1px); border-color: var(--glpx-text); outline: none; }
`;
        }


        if (settings.scrollProgress) {
            css += `
#glp-scroll-progress {
    position: fixed; top: 0; left: 0; height: 3px; z-index: 999999;
    background: linear-gradient(90deg, var(--glpx-accent), #8ac4f7);
    transition: width 0.1s linear; pointer-events: none;
}
`;
        }

        if (settings.threadPreview) {
            css += `
.glp-thread-preview {
    position: absolute; z-index: 99999; background: #1a1a2e;
    border: 1px solid #4a4a6a; border-radius: 8px; padding: 12px 16px;
    max-width: 450px; width: max-content; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    font-size: 13px; line-height: 1.5; color: #ccc; pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.glp-thread-preview .glp-preview-title { color: #fff; font-weight: 600; margin-bottom: 6px; font-size: 13px; }
.glp-thread-preview .glp-preview-body { color: #aaa; font-size: 12px; max-height: 120px; overflow: hidden; }
`;
        }

        if (settings.postPermalinks) {
            css += `
.glp-post-number { cursor: pointer; }
.glp-post-number:hover { background: rgba(var(--glpx-accent-rgb),0.3) !important; }
.glp-copied-toast {
    position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
    background: var(--glpx-accent); color: #fff; padding: 8px 18px; border-radius: 6px;
    font-size: 13px; z-index: 999999; pointer-events: none;
    animation: glp-fade 1.5s ease forwards;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
@keyframes glp-fade { 0%,70% { opacity: 1; } 100% { opacity: 0; } }
`;
        }

        if (settings.youtubeEmbed) {
            css += `
.glp-yt-embed {
    margin: 8px 0; border-radius: 8px; overflow: hidden;
    max-width: 560px; aspect-ratio: 16/9;
}
.glp-yt-embed iframe { width: 100%; height: 100%; border: none; border-radius: 8px; }
`;
        }

        if (settings.opPostNav) {
            css += `
/* Keep OP navigation with the rest of the thread tools instead of covering a post. */
.glp-op-nav {
    position: static;
    display: flex; flex-direction: row; gap: 6px; z-index: 99997;
    margin-left: auto;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
}
.glp-op-nav button {
    background: rgba(var(--glpx-accent-rgb), 0.14);
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.30);
    color: var(--glpx-text);
    min-width: 54px; height: 32px; border-radius: var(--glpx-r-sm); cursor: pointer;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.2s, transform 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.glp-op-nav button:hover { background: rgba(var(--glpx-accent-rgb), 0.28); border-color: var(--glpx-border-strong); transform: translateY(-1px); }
`;
        }


        if (settings.threadQuickSearch) {
            css += `
#glp-quick-search {
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
    background: var(--glpx-elevated); border: 1px solid var(--glpx-border);
    border-radius: var(--glpx-r-lg);
    padding: 10px 16px; z-index: 1000001; display: none;
    box-shadow: var(--glpx-shadow-2); width: 400px; max-width: 90vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
#glp-quick-search.open { display: flex; gap: 8px; align-items: center; }
#glp-quick-search input {
    flex: 1; background: var(--glpx-bg); border: 1px solid var(--glpx-border); color: var(--glpx-text);
    padding: 6px 10px; border-radius: var(--glpx-r-sm); font-size: 13px; outline: none;
}
#glp-quick-search input:focus { border-color: var(--glpx-accent); box-shadow: var(--glpx-focus); }
#glp-quick-search .count { color: var(--glpx-muted); font-size: 12px; white-space: nowrap; }
#glp-quick-search button {
    background: var(--glpx-ghost); color: var(--glpx-text); border: 1px solid var(--glpx-ghost-border);
    border-radius: var(--glpx-r-sm); padding: 6px 9px; font-size: 12px; cursor: pointer;
}
#glp-quick-search button:hover { background: var(--glpx-ghost-hover); border-color: var(--glpx-accent); }
#glp-quick-search button:disabled { opacity: 0.45; cursor: default; }
.glp-search-match { background: rgba(var(--glpx-warning-rgb), 0.35) !important; border-radius: var(--glpx-r-xs); }
.glp-search-current { background: rgba(var(--glpx-warning-rgb), 0.7) !important; outline: 2px solid var(--glpx-warning); }
`;
        }

        // ---- Filtering ----
        css += `
.glp-hide-col {
    width: 24px !important; min-width: 24px !important; max-width: 24px !important;
    text-align: center !important; padding: 0 !important; vertical-align: middle !important;
}
.glp-hide-col-btn {
    display: inline-block; width: 18px; height: 18px; line-height: 18px;
    text-align: center; font-size: 12px; color: #555; cursor: pointer;
    border-radius: 4px; border: none; background: none; padding: 0;
    transition: color 0.15s, background 0.15s;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.glp-hide-col-btn:hover { color: #ff4444; background: rgba(255,68,68,0.15); }
.glp-thread-hidden { display: none !important; }
#glp-hidden-threads-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 8px 10px; font-size: 12px; color: #aeb9d2;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid rgba(var(--glpx-accent-rgb),0.18);
    border-left: 3px solid rgba(var(--glpx-accent-rgb),0.72);
    border-radius: 8px;
    margin: 8px 0;
    background: rgba(var(--glpx-accent-rgb),0.075);
    user-select: none;
}
#glp-hidden-threads-bar .count { color: var(--glpx-link); font-weight: 600; }
#glp-hidden-threads-bar .glp-hidden-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
#glp-hidden-threads-bar button {
    background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.12);
    color: #dce7ff; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px;
}
#glp-hidden-threads-bar button:hover { background: rgba(var(--glpx-accent-rgb),0.16); border-color: rgba(var(--glpx-accent-rgb),0.38); }
#glp-hidden-threads-bar button.glp-hidden-clear { color: #ffd1d1; border-color: rgba(217,74,74,0.35); }
.glp-keyword-highlight { background: rgba(230, 168, 32, 0.3) !important; border-radius: 4px; padding: 0 2px; }
.glp-keyword-hidden { display: none !important; }
#glp-filter-status {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 7px 10px; margin: 8px 0; font-size: 12px; color: #aeb9d2;
    border: 1px solid rgba(230,168,32,0.2); border-left: 3px solid rgba(230,168,32,0.72);
    border-radius: 8px; background: rgba(230,168,32,0.07);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
#glp-filter-status strong { color: #ffd678; font-weight: 650; }
#glp-filter-status button {
    background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.12);
    color: #dce7ff; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px;
}
#glp-filter-status button:hover { background: rgba(230,168,32,0.14); border-color: rgba(230,168,32,0.42); }
#glp-auto-refresh-bar {
    position: fixed; top: 0; left: 0; right: 0; height: 3px;
    background: transparent; z-index: 999998; pointer-events: none;
}
#glp-auto-refresh-bar .bar {
    height: 100%; width: 0%; background: var(--glpx-accent);
    transition: width 1s linear;
}
.glp-mute-manage-list { margin-top: 8px; }
.glp-mute-manage-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px; margin: 2px 0; background: #2d2d4a; border-radius: 4px;
    font-size: 12px; color: #ccc;
}
.glp-mute-manage-item button {
    background: #d94a4a; border: none; color: #fff; padding: 2px 8px;
    border-radius: 4px; cursor: pointer; font-size: 11px;
}
.glp-empty-state {
    color: #8c98b3;
    font-size: 12px;
    line-height: 1.45;
    padding: 10px;
    border: 1px dashed rgba(147,168,211,0.22);
    border-radius: 8px;
    background: rgba(255,255,255,0.025);
}
.glp-setting-item textarea {
    background: #2d2d4a; border: 1px solid #4a4a6a; color: #fff;
    padding: 6px 10px; border-radius: 4px; width: 100%; min-height: 50px;
    font-size: 12px; font-family: monospace; resize: vertical;
}
`;

        // ---- Thread watcher ----
        css += `
#glp-watch-toggle { display: inline-flex; align-items: center; gap: 6px; }
.glp-watch-badge { display: none; }
.glp-watch-badge-active {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px; border-radius: var(--glpx-r-sm);
    background: var(--glpx-accent); color: var(--glpx-on-accent); font-size: 11px; font-weight: 800;
}
[data-glp-thread-tool="watch"].glp-watching { border-color: var(--glpx-accent) !important; color: var(--glpx-link) !important; }
#glp-watch-digest {
    position: fixed; right: 18px; bottom: 18px; width: min(420px, 92vw);
    max-height: min(60vh, 560px); overflow-y: auto; z-index: 1000000;
    background: var(--glpx-elevated); border: 1px solid var(--glpx-border);
    border-radius: var(--glpx-r-xl);
    box-shadow: var(--glpx-shadow-3); color: var(--glpx-text); font-size: 12px;
}
.glp-watch-digest-header {
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    border-bottom: 1px solid var(--glpx-border); font-weight: 700; position: sticky; top: 0;
    background: var(--glpx-elevated);
}
.glp-watch-digest-header span { flex: 1; }
.glp-watch-digest-header button,
.glp-watch-actions button {
    background: var(--glpx-ghost); border: 1px solid var(--glpx-border); color: var(--glpx-text);
    border-radius: var(--glpx-r-sm); padding: 3px 8px; cursor: pointer; font-size: 11px; font-weight: 650;
}
.glp-watch-digest-header button:hover,
.glp-watch-actions button:hover { background: var(--glpx-ghost-hover); border-color: var(--glpx-accent); }
.glp-watch-row {
    display: grid; grid-template-columns: 1fr auto; gap: 4px 10px;
    padding: 10px 12px; border-bottom: 1px solid var(--glpx-border);
}
.glp-watch-row:last-child { border-bottom: none; }
.glp-watch-title { grid-column: 1; color: var(--glpx-link) !important; font-weight: 650; text-decoration: none !important; }
.glp-watch-title:hover { text-decoration: underline !important; }
.glp-watch-meta { grid-column: 1; color: var(--glpx-muted); font-size: 11px; }
.glp-watch-actions { grid-column: 2; grid-row: 1 / span 2; display: flex; flex-direction: column; gap: 4px; align-self: center; }
.glp-watch-unread .glp-watch-title { color: var(--glpx-text) !important; }
.glp-watch-unread { background: rgba(var(--glpx-accent-rgb), 0.08); }
.glp-watch-error .glp-watch-meta { color: var(--glpx-danger); }
.glp-watch-empty { padding: 16px 12px; color: var(--glpx-muted); }
`;

        // ---- Thread tool bars ----
        // Emitted unconditionally: the bar exists whenever any thread tool does, and two optional
        // features used to ship a full copy of this each, so its colours depended on which of
        // them was switched on.
        css += `
#glp-thread-tools-bar,
#glp-collapse-all-bar {
    display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
    width: 100%; box-sizing: border-box;
    padding: 9px 12px; margin: 10px 0; font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(180deg, rgba(var(--glpx-accent-rgb), 0.09), transparent), var(--glpx-surface);
    border: 1px solid var(--glpx-border);
    border-radius: var(--glpx-r-lg);
    box-shadow: var(--glpx-shadow-1);
}
#glp-thread-tools-bar button,
#glp-collapse-all-bar button {
    background: var(--glpx-ghost); border: 1px solid var(--glpx-ghost-border); color: var(--glpx-text);
    padding: 6px 10px; border-radius: var(--glpx-r-sm); cursor: pointer; font-size: 12px; font-weight: 650;
    transition: background var(--glpx-ease), border-color var(--glpx-ease), transform var(--glpx-ease);
}
#glp-thread-tools-bar button:hover,
#glp-collapse-all-bar button:hover {
    background: var(--glpx-ghost-hover); border-color: var(--glpx-border-strong); transform: translateY(-1px);
}
`;

        // ---- User intelligence ----
        css += `
.glp-user-rep {
    display: inline-flex; align-items: center; margin-left: 6px;
    padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.02em; color: ${t.link}; background: ${t.accent}1f;
    border: 1px solid ${t.border}; cursor: help; white-space: nowrap;
}
.glp-user-tag-noted { box-shadow: inset 0 -2px 0 rgba(255,255,255,0.45); }
.glp-tag-note {
    width: 100%; box-sizing: border-box; margin-top: 6px; resize: vertical;
    background: var(--glpx-bg); border: 1px solid var(--glpx-border); color: var(--glpx-text);
    border-radius: var(--glpx-r-sm); padding: 6px 8px; font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.glp-tag-save {
    margin-top: 6px; width: 100%; cursor: pointer; font-size: 12px; font-weight: 650;
    background: var(--glpx-accent); border: 1px solid var(--glpx-border); color: var(--glpx-on-accent);
    border-radius: var(--glpx-r-sm); padding: 5px 8px;
}
.glp-tag-save:hover { filter: brightness(1.08); }
`;

        // ---- Media adapters ----
        css += `
.glp-media-placeholder {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin: 10px 0; padding: 10px 12px;
    border: 1px dashed ${t.border}; border-radius: 8px;
    background: rgba(255,255,255,0.03); color: #c6d2ea; font-size: 12px;
}
.glp-media-provider { color: ${t.link}; font-weight: 700; letter-spacing: 0.02em; }
.glp-media-note { color: #8592b0; }
.glp-media-load {
    background: rgba(255,255,255,0.06); border: 1px solid ${t.border};
    color: #e7eeff; border-radius: 6px; padding: 4px 10px; cursor: pointer;
    font-size: 12px; font-weight: 650; margin-left: auto;
    transition: background 0.15s, border-color 0.15s;
}
.glp-media-load:hover { background: ${t.hover}; border-color: ${t.accent}; }
.glp-media-fallback { color: ${t.link} !important; text-decoration: none !important; font-weight: 650; }
.glp-media-fallback:hover { text-decoration: underline !important; }
.glp-x-embed {
    margin: 10px 0; border: 1px solid ${t.border}; border-radius: 10px; overflow: hidden;
    background: rgba(255,255,255,0.02);
}
.glp-x-embed-header {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 10px; border-bottom: 1px solid ${t.border}; font-size: 12px;
}
.glp-x-embed-header .glp-media-fallback { margin-left: auto; }
.glp-x-embed .glp-media-placeholder { margin: 10px; }
#glp-media-preview {
    position: fixed; z-index: 1000001; display: none;
    padding: 6px; border: 1px solid ${t.border}; border-radius: 10px;
    background: ${t.headerBg}; box-shadow: 0 18px 48px rgba(0,0,0,0.55);
    pointer-events: none;
}
#glp-media-preview img { display: block; border-radius: 6px; }
`;

        // Always clean up misc layout cruft
        css += `
.rightpanel_inner { margin-left: 0 !important; }
br.hdr_clear_both { display: none !important; margin: 0 !important; }
div[style*="text-align: center"][style*="margin-bottom"] { display: none !important; }
center:has([data-type="_mgwidget"]) { display: none !important; }
.rightpanel_ipad > div[style*="text-align: center"] { display: none !important; }
.rightpanel_ipad > br[style*="clear"] { display: none !important; }
#rightpanel_wrap { padding: 0 !important; margin: 0 !important; }
#wrap, #wrap_in { padding-top: 0 !important; margin-top: 0 !important; }
`;

        // ---- Site surface polish ----
        // The site's own markup is a 2003 table layout; these rules give it the rhythm, chip
        // vocabulary, and type scale the rest of the product already has. Always on: this is the
        // baseline the themes paint over, not an optional extra.
        css += `
/* One chip vocabulary. Mute, Block, Tag and the tag pills were three different sizes and
   three different colour stories sitting inches apart in the same column. */
.glp-mute-btn,
.glp-block-btn,
.glp-tag-btn {
    display: inline-flex !important; align-items: center; justify-content: center;
    vertical-align: middle;
    height: 20px; padding: 0 8px !important; margin: 0 !important;
    font-size: 10px !important; font-weight: 650 !important; line-height: 1 !important;
    letter-spacing: 0.02em;
    border-radius: var(--glpx-r-xs) !important;
    background: rgba(var(--glpx-accent-rgb), 0.10) !important;
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.24) !important;
    color: var(--glpx-text) !important;
    opacity: 0.72;
    transition: opacity var(--glpx-ease), background var(--glpx-ease), border-color var(--glpx-ease);
}
.glp-mute-btn:hover,
.glp-tag-btn:hover { opacity: 1; background: rgba(var(--glpx-accent-rgb), 0.22) !important; }
.glp-block-btn {
    background: rgba(255, 107, 107, 0.10) !important;
    border-color: rgba(255, 107, 107, 0.26) !important;
    color: #ffd9d9 !important;
}
.glp-block-btn:hover { opacity: 1; background: rgba(255, 107, 107, 0.20) !important; }

/* The author column: name first, actions next to it, metadata quiet underneath. */
.msg td.messageauthor,
.msg td.replyauthor {
    padding: 12px 12px 12px 14px !important;
    vertical-align: top !important;
    line-height: 1.45 !important;
}
/* Deliberately block, not flex: the site writes the OP marker as literal "(" and ")" text
   nodes around a badge, and flex makes every one of those its own line. Inline flow keeps
   "Name (OP)" together and lets the action chips wrap like words. */
.msg .author_header {
    display: block !important;
    margin-bottom: 5px; line-height: 1.9 !important;
}
.msg .author_header b a,
.msg .author_header > a {
    font-size: 13px !important; font-weight: 700 !important; line-height: 1.3 !important;
    color: var(--glpx-link) !important;
    overflow-wrap: anywhere;
}
.msg .glp-op-badge {
    display: inline-flex; align-items: center; vertical-align: middle;
    height: 18px; padding: 0 7px; margin: 0 1px !important;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    border-radius: var(--glpx-r-xs);
    background: rgba(var(--glpx-accent-rgb), 0.18);
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.32);
    color: var(--glpx-link);
}
.msg td.messageauthor .author_date,
.msg td.replyauthor .author_date,
.msg td.messageauthor font[size="1"],
.msg td.replyauthor font[size="1"] {
    display: block;
    font-size: 10px !important; color: var(--glpx-subtle) !important;
    line-height: 1.35 !important; text-align: left !important;
}
/* The site centres some of this metadata and left-aligns the rest, inside a 120px column. */
.msg td.messageauthor *,
.msg td.replyauthor * { text-align: left !important; }
.msg td.messageauthor,
.msg td.replyauthor { font-size: 11px !important; }

/* Post rows: a quiet separator and a hover cue, instead of edge-to-edge sameness. */
.msg tr[id^="post_"] > td { transition: background var(--glpx-ease); }
.msg tr[id^="post_"]:hover > td { background: rgba(var(--glpx-accent-rgb), 0.035) !important; }

/* Thread title: it is the most important text on the page and read like body copy. */
.msgtitle h1,
.msgtitle {
    font-size: 20px !important; line-height: 1.3 !important; font-weight: 700 !important;
    letter-spacing: -0.01em;
    padding: 4px 0 10px !important; margin: 0 0 4px !important;
    border-bottom: 1px solid var(--glpx-border-soft);
}

/* Nav links rendered as a bare vertical list of underlined text. Make it a row. */
.messagetopnavlinks,
.messagebottomnavlinks,
.mainpagenavlinks {
    display: flex !important; flex-wrap: wrap; align-items: center; gap: 6px;
    padding: 8px 0 !important;
}
.messagetopnavlinks a,
.messagebottomnavlinks a,
.mainpagenavlinks a {
    display: inline-flex; align-items: center;
    padding: 4px 9px; border-radius: var(--glpx-r-sm);
    font-size: 12px; text-decoration: none !important;
    color: var(--glpx-link) !important;
    background: rgba(var(--glpx-accent-rgb), 0.07);
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.16);
    transition: background var(--glpx-ease), border-color var(--glpx-ease), color var(--glpx-ease);
}
.messagetopnavlinks a:hover,
.messagebottomnavlinks a:hover,
.mainpagenavlinks a:hover {
    background: rgba(var(--glpx-accent-rgb), 0.18);
    border-color: var(--glpx-border-strong);
    color: var(--glpx-link-hover) !important;
}

/* Rows left behind empty by ad removal were holding open a ~90px band under the title. */
.msg tr:empty,
.threads tr:empty,
tr.glp-empty-row { display: none !important; }

/* Post number chips lined up with the text they label. */
.glp-post-number {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 26px; height: 18px; padding: 0 6px;
    font-size: 10px; font-weight: 700;
    border-radius: var(--glpx-r-xs);
    background: rgba(var(--glpx-accent-rgb), 0.12);
    border: 1px solid rgba(var(--glpx-accent-rgb), 0.22);
    color: var(--glpx-link);
}
`;

        // ---- Accessibility ----
        // Last, and deliberately so: these are overrides. A theme that wins against the motion
        // or contrast setting is a bug, not a style choice.
        if (settings.reduceMotion) {
            css += `
body.glp-enhanced-active *,
#glp-enhanced-overlay *,
#glp-diagnostics *,
#glp-recovery *,
.glp-toast,
.glp-thread-preview,
#glp-backlink-card {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
}
`;
        }

        if (settings.highContrast) {
            css += `
body.glp-enhanced-active {
    --glp-panel-text: #ffffff;
    --glp-panel-muted: #d6deee;
    --glp-panel-subtle: #c2cbe0;
}
#glp-enhanced-overlay,
#glp-diagnostics,
#glp-recovery {
    --glp-panel-text: #ffffff;
    --glp-panel-muted: #d6deee;
    --glp-panel-subtle: #c2cbe0;
    --glp-panel-border: rgba(203, 216, 240, 0.55);
    --glp-panel-border-strong: rgba(226, 235, 255, 0.75);
}
/* Muted text is the first thing a contrast requirement loses; pin it back up. */
.glp-setting-help,
.glp-diag-empty,
.glp-diag-row span:last-child,
.glp-backlinks-label,
.glp-watch-meta,
.glp-toolbar-label,
#glp-hidden-threads-bar,
#glp-filter-status { color: #d6deee !important; opacity: 1 !important; }
.glp-btn,
.glp-backlink,
.glp-quote-jump,
.glp-toolbar-btn,
.glp-mute-btn,
.glp-block-btn,
.glp-tag-btn,
.glp-recovery-row button { border-color: rgba(226, 235, 255, 0.62) !important; color: #ffffff !important; }
.glp-post-number,
.glp-quote-depth,
.glp-user-rep { opacity: 1 !important; }
body.glp-enhanced-active .quoteo { border-left-width: 4px !important; }
`;
        }

        if (settings.largeTargets) {
            // Only GLP Ultra's own controls grow. Resizing the site's own layout to hit a target
            // size would reflow every table on the page.
            css += `
.glp-btn,
.glp-toolbar-btn,
.glp-sort-btn,
.glp-backlink,
.glp-quote-jump,
.glp-mute-btn,
.glp-block-btn,
.glp-tag-btn,
.glp-hide-col-btn,
.glp-nested-toggle,
.glp-recovery-row button,
#glp-hidden-threads-bar button,
#glp-watch-digest button,
[data-glp-thread-tool] {
    min-height: 32px !important;
    min-width: 32px !important;
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.glp-hide-col-btn { line-height: 1 !important; }
`;
        }

        /* The settings surface is a routed control center: one destination at a time, with the
           same rail, toolbar, page hierarchy, card rhythm, and persistent save state as the
           extension options page. This block intentionally comes after the legacy panel rules so
           older feature styles remain stable while the shell can evolve as one coherent layer. */
        css += `
#glp-enhanced-overlay {
    padding: 14px;
    background: rgba(2, 5, 10, 0.86);
}

#glp-enhanced-settings {
    position: relative;
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    grid-template-rows: 62px minmax(0, 1fr) 54px;
    width: min(1480px, 98vw);
    height: min(94vh, 980px);
    max-height: none;
    border-radius: var(--glpx-r-lg);
    background:
        radial-gradient(860px 480px at 75% -12%, rgba(var(--glpx-accent-rgb), 0.12), transparent 62%),
        #070a10;
}

#glp-enhanced-settings-header {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
    padding: 12px 14px;
    align-items: center;
    border-right: 1px solid rgba(147, 168, 211, 0.13);
    border-bottom-color: rgba(147, 168, 211, 0.13);
    background: #090e16;
}

.glp-settings-title-block {
    position: relative;
    min-height: 36px;
    padding: 0 0 0 46px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.glp-settings-title-block::before {
    content: "G";
    position: absolute;
    left: 0;
    top: 0;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(255, 255, 255, 0.20);
    border-radius: var(--glpx-r-md);
    background: linear-gradient(145deg, var(--glpx-link-hover), var(--glpx-accent) 58%, #235a98);
    color: #03101e;
    font-size: 14px;
    font-weight: 900;
    box-shadow: 0 8px 22px rgba(var(--glpx-accent-rgb), 0.22);
}

.glp-settings-kicker {
    order: 2;
    margin: 2px 0 0;
    color: var(--glp-panel-subtle);
    font-size: 9px;
    letter-spacing: 0.13em;
}

#glp-enhanced-settings-header h2 {
    order: 1;
    font-size: 14px;
    letter-spacing: 0.02em;
}

#glp-enhanced-settings-header .version {
    padding: 2px 5px;
    border: 1px solid var(--glp-panel-border);
    border-radius: var(--glpx-r-xs);
    font-size: 9px;
}

.glp-settings-subtitle,
#glp-safe-mode-notice { display: none; }

.glp-settings-header-actions {
    position: absolute;
    right: 14px;
    top: 13px;
    z-index: 3;
}

#glp-enhanced-close-btn {
    width: 34px;
    height: 34px;
    border-color: rgba(147, 168, 211, 0.16);
    border-radius: var(--glpx-r-md);
    background: #0d141f;
}

.glp-settings-search-wrap {
    grid-column: 2;
    grid-row: 1;
    grid-template-columns: minmax(250px, 470px) minmax(0, auto);
    padding: 11px 292px 11px 22px;
    border-bottom-color: rgba(147, 168, 211, 0.13);
    background: rgba(7, 10, 16, 0.88);
}

#glp-settings-search {
    height: 36px;
    padding: 8px 34px 8px 12px;
    border-color: rgba(147, 168, 211, 0.16);
    border-radius: var(--glpx-r-md);
    background: #0b111b;
    font-size: 12px;
}

.glp-search-tools { min-width: 0; }
.glp-settings-summary { overflow: hidden; text-overflow: ellipsis; }

#glp-enhanced-settings-main {
    grid-column: 1 / -1;
    grid-row: 2;
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    min-height: 0;
}

#glp-settings-nav {
    position: relative;
    display: block;
    max-height: none;
    min-height: 0;
    padding: 11px 12px 12px;
    border-right-color: rgba(147, 168, 211, 0.13);
    background: linear-gradient(180deg, #090e16, #070b11);
    scrollbar-width: thin;
}

.glp-nav-group + .glp-nav-group { margin-top: 10px; }

.glp-nav-group-title {
    display: block;
    padding: 0 8px 4px;
    color: var(--glp-panel-subtle);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.glp-nav-item {
    position: relative;
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) auto;
    gap: 7px;
    min-height: 29px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 560;
}

.glp-nav-item.glp-nav-active::before {
    content: "";
    position: absolute;
    left: -3px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    border-radius: 2px;
    background: var(--glp-panel-accent);
}

.glp-nav-icon {
    color: var(--glp-panel-subtle);
    font-size: 9px;
    font-weight: 800;
}

.glp-nav-item.glp-nav-active .glp-nav-icon { color: var(--glp-panel-accent); }
.glp-nav-item .glp-nav-dot { justify-self: end; }
.glp-nav-group.glp-filtered { display: none; }

.glp-local-privacy {
    position: static;
    margin-top: 12px;
    padding: 9px 10px;
    border: 1px solid rgba(72, 213, 151, 0.20);
    border-radius: var(--glpx-r-md);
    background: rgba(72, 213, 151, 0.055);
    color: var(--glp-panel-subtle);
    font-size: 9px;
    line-height: 1.4;
}

.glp-local-privacy strong {
    display: block;
    margin-bottom: 2px;
    color: var(--glp-panel-text);
    font-size: 10px;
}

#glp-enhanced-settings-body {
    padding: 0;
    background: transparent;
}

.glp-settings-section {
    display: none;
    min-height: 100%;
    padding: 30px clamp(24px, 3vw, 48px) 44px;
    border: 0;
    animation: glp-control-page-in 0.18s ease both;
}

.glp-settings-section.glp-page-active:not(.glp-filtered) { display: block; }
.glp-settings-section.collapsed.glp-page-active .glp-settings-section-content { display: grid; }

@keyframes glp-control-page-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
}

.glp-settings-section-header {
    padding: 0 0 22px;
    align-items: end;
    cursor: default;
    background: transparent;
}

.glp-settings-section-header:hover { background: transparent; }

.glp-section-heading::before {
    content: attr(data-group-label);
    display: block;
    margin-bottom: 7px;
    color: var(--glp-panel-accent);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

.glp-settings-section-header h3 {
    font-size: clamp(25px, 3vw, 36px);
    line-height: 1.08;
    letter-spacing: -0.035em;
}

.glp-section-desc {
    max-width: 680px;
    margin-top: 8px;
    color: var(--glp-panel-muted);
    font-size: 12px;
}

.glp-section-meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(78px, 1fr));
    gap: 7px;
    min-width: 270px;
    padding: 0;
    border: 0;
    background: transparent;
}

.glp-section-stat {
    min-height: 50px;
    padding: 8px 10px;
    border: 1px solid rgba(147, 168, 211, 0.14);
    border-radius: var(--glpx-r-md);
    background: rgba(13, 19, 30, 0.78);
}

.glp-section-stat strong,
.glp-section-stat small { display: block; }
.glp-section-stat strong { color: var(--glp-panel-text); font-size: 13px; }
.glp-section-stat small { margin-top: 2px; color: var(--glp-panel-subtle); font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; }
.glp-section-count { color: var(--glp-panel-text); }
.glp-section-changed-count { display: block; color: var(--glp-panel-accent) !important; }
.glp-section-change-stat .glp-section-reset { margin-top: 5px; }
.glp-settings-section-header .toggle-icon { display: none; }

.glp-settings-section-content {
    padding: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.glp-settings-section[data-section-id="thread-list-forum-page"] .glp-settings-section-content,
.glp-settings-section[data-section-id="post-display-thread-page"] .glp-settings-section-content {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.glp-settings-section[data-section-id="navigation"] .glp-settings-section-content,
.glp-settings-section[data-section-id="ui-enhancements"] .glp-settings-section-content {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.glp-settings-section[data-section-id="thread-list-forum-page"] .glp-setting-item,
.glp-settings-section[data-section-id="post-display-thread-page"] .glp-setting-item,
.glp-settings-section[data-section-id="navigation"] .glp-setting-item,
.glp-settings-section[data-section-id="ui-enhancements"] .glp-setting-item {
    min-height: 66px;
    padding: 11px 12px;
    gap: 10px;
}

.glp-setting-item {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    min-height: 78px;
    padding: 14px 15px;
    border-color: rgba(147, 168, 211, 0.13);
    border-radius: var(--glpx-r-md);
    background: linear-gradient(180deg, rgba(17, 26, 40, 0.92), rgba(13, 19, 30, 0.92));
}

.glp-setting-item > label { grid-column: 1; grid-row: 1; }
.glp-setting-item > input,
.glp-setting-item > select { grid-column: 2; grid-row: 1; }
.glp-setting-item.full-width { min-height: 104px; }
.glp-setting-item.full-width > label,
.glp-setting-item.full-width > textarea { grid-column: 1; }

.glp-setting-label { font-size: 12px; }
.glp-setting-help { color: var(--glp-panel-muted); font-size: 10px; line-height: 1.45; }

.glp-setting-item input[type="checkbox"] {
    appearance: none;
    position: relative;
    width: 40px;
    height: 22px;
    margin: 1px 0 0;
    border: 1px solid #31405a;
    border-radius: 12px;
    background: #161f2e;
    accent-color: transparent;
    transition: background var(--glpx-ease), border-color var(--glpx-ease);
}

.glp-setting-item input[type="checkbox"]::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 2px;
    width: 16px;
    height: 16px;
    border-radius: var(--glpx-r-xs);
    background: #8592a7;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.42);
    transition: transform var(--glpx-ease), background var(--glpx-ease);
}

.glp-setting-item input[type="checkbox"]:checked {
    border-color: var(--glp-panel-accent);
    background: var(--glp-panel-accent);
}

.glp-setting-item input[type="checkbox"]:checked::before {
    transform: translateX(18px);
    background: #fff;
}

.glp-setting-item input[type="number"],
.glp-setting-item input[type="text"],
.glp-setting-item input[type="color"],
.glp-setting-item select,
.glp-setting-item textarea {
    border-color: rgba(147, 168, 211, 0.20);
    border-radius: var(--glpx-r-sm);
    background: #080d15;
}

#glp-enhanced-settings-footer {
    grid-column: 1 / -1;
    grid-row: 3;
    min-width: 0;
    padding: 9px 18px 9px 360px;
    border-top-color: rgba(147, 168, 211, 0.13);
    background: #090d14;
}

.glp-footer-save-state {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
    color: var(--glp-panel-muted);
    font-size: 10px;
}

.glp-footer-save-state::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: var(--glp-panel-success);
    box-shadow: 0 0 0 3px rgba(72, 213, 151, 0.10);
}

.glp-footer-cluster { position: absolute; left: 14px; bottom: 9px; }
.glp-footer-cluster .glp-footer-group { padding: 0 8px; }
.glp-footer-cluster .glp-footer-destructive { padding-left: 0; padding-right: 10px; }

#glp-enhanced-settings-footer .glp-footer-cluster .glp-footer-group:nth-child(3) {
    position: fixed;
    top: calc(3vh + 13px);
    right: calc(1vw + 56px);
    z-index: 1000001;
    padding: 0;
    border-left: 0;
}

.glp-btn { min-height: 34px; padding: 7px 11px; font-size: 11px; border-radius: var(--glpx-r-md); }

@media (max-width: 900px) {
    #glp-enhanced-settings {
        grid-template-columns: 208px minmax(0, 1fr);
        height: min(94vh, 880px);
    }
    #glp-enhanced-settings-main { grid-template-columns: 208px minmax(0, 1fr); }
    .glp-settings-search-wrap { grid-column: 2; padding-right: 218px; }
    .glp-settings-summary { display: none; }
    #glp-settings-nav { flex-direction: initial; flex-wrap: initial; max-height: none; border-bottom: 0; }
    .glp-nav-item { width: 100%; }
    .glp-settings-section-content { grid-template-columns: 1fr; }
    .glp-settings-section[data-section-id="thread-list-forum-page"] .glp-settings-section-content,
    .glp-settings-section[data-section-id="post-display-thread-page"] .glp-settings-section-content,
    .glp-settings-section[data-section-id="navigation"] .glp-settings-section-content,
    .glp-settings-section[data-section-id="ui-enhancements"] .glp-settings-section-content { grid-template-columns: 1fr; }
    #glp-enhanced-settings-footer { padding-left: 220px; }
    .glp-footer-save-state { display: none; }
    #glp-enhanced-settings-footer .glp-footer-cluster .glp-footer-group:nth-child(3) { right: calc(1vw + 54px); }
}

@media (max-width: 700px) {
    #glp-enhanced-settings { grid-template-columns: 1fr; grid-template-rows: 56px 92px minmax(0, 1fr) 58px; }
    #glp-enhanced-settings-header { grid-column: 1; grid-row: 1; border-right: 0; }
    .glp-settings-search-wrap { grid-column: 1; grid-row: 2; padding: 9px 54px 9px 12px; grid-template-columns: 1fr; }
    .glp-search-tools { display: none; }
    #glp-enhanced-settings-main { grid-column: 1; grid-row: 3; grid-template-columns: 1fr; }
    #glp-settings-nav { display: flex; max-height: 92px; padding: 8px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--glp-panel-border); }
    .glp-nav-group { display: contents; }
    .glp-nav-group-title, .glp-local-privacy { display: none; }
    .glp-nav-item { min-width: 138px; width: auto; }
    .glp-settings-section-header { grid-template-columns: 1fr; align-items: start; }
    .glp-section-meta { width: 100%; min-width: 0; }
    #glp-enhanced-settings-footer { grid-column: 1; grid-row: 4; padding: 9px 12px; }
    .glp-footer-cluster { display: none; }
    #glp-enhanced-settings-footer .glp-footer-group:last-child { margin-left: auto; }
    .glp-footer-save-state { display: none; }
    #glp-enhanced-settings-footer .glp-footer-cluster .glp-footer-group:nth-child(3) { display: none; }
}
`;

        // Custom CSS injection
        // Custom CSS is the one setting that can make the interface for changing settings
        // unreachable, and it survives a reload, so "just refresh" is not a way out. Safe
        // mode is reachable from surfaces page CSS cannot touch: the userscript manager's
        // menu, and the extension popup.
        if (settings.safeMode) {
            css += `\n/* Safe mode: custom CSS is not applied. */\n`;
        } else if (settings.customCSS && settings.customCSS.trim()) {
            css += `\n/* User Custom CSS - scoped */\n${scopeCustomCSS(settings.customCSS)}\n`;
            // Emitted after the user's rules and at a specificity their scoped selectors can
            // reach, so a blanket rule cannot take the recovery surfaces down with the page.
            // Deliberately out-specifying this is still possible - safe mode answers that.
            css += `
body.glpx-enabled #glp-enhanced-overlay,
body.glpx-enabled #glp-diagnostics,
body.glpx-enabled #glp-recovery,
body.glpx-enabled .glp-toast-stack,
body.glpx-enabled #glp-enhanced-overlay *,
body.glpx-enabled #glp-diagnostics *,
body.glpx-enabled #glp-recovery *,
body.glpx-enabled .glp-toast-stack * {
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
}
body.glpx-enabled #glp-enhanced-overlay { display: flex !important; }
body.glpx-enabled #glp-diagnostics,
body.glpx-enabled #glp-recovery { display: block !important; }
body.glpx-enabled .glp-toast-stack { display: grid !important; }
`;
        }

        return css;
    }

    // ============================================
    // SETTINGS UI
    // ============================================
    function createSettingsPanel() {
        const existing = ownedElement('glp-enhanced-overlay');
        if (existing) existing.remove();
        SECTION_ORDER.length = 0;
        loadMutedUsers();
        loadBlockedUsers();
        loadUserTags();
        loadUserStats();

        const overlay = document.createElement('div');
        ownSurface(overlay, 'glp-enhanced-overlay');
        overlay.tabIndex = -1;

        const panel = document.createElement('div');
        ownSurface(panel, 'glp-enhanced-settings');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'glp-settings-title');

        const panelHTML = `
            <div id="glp-enhanced-settings-header">
                <div class="glp-settings-title-block">
                    <div class="glp-settings-kicker">Premium control center</div>
                    <h2 id="glp-settings-title">GLP Ultra <span class="version">v${SCRIPT_VERSION}</span></h2>
                    <p class="glp-settings-subtitle">Tune the forum into a cleaner, quieter, faster reading surface. Changes are saved locally and can be exported at any time.</p>
                    ${settings.safeMode ? '<p class="glp-safe-mode-notice" id="glp-safe-mode-notice">Safe mode is on - your custom CSS is not being applied. Switch it off under Core once the page looks right.</p>' : ''}
                </div>
                <div class="glp-settings-header-actions">
                    <button id="glp-enhanced-close-btn" aria-label="Close settings">&times;</button>
                </div>
            </div>
            <div class="glp-settings-search-wrap">
                <div class="glp-search-field">
                    <input id="glp-settings-search" type="search" placeholder="Search settings by name, or by what they do..." autocomplete="off" aria-describedby="glp-settings-status">
                    <button type="button" id="glp-settings-clear" class="glp-search-clear" title="Clear the search" aria-label="Clear the search" style="display:none">&#x2715;</button>
                </div>
                <div class="glp-search-tools">
                    <button type="button" id="glp-only-changed" class="glp-chip-toggle" aria-pressed="false" title="Show only the settings you have changed">Only changed</button>
                    <div class="glp-settings-summary" id="glp-settings-status" role="status" aria-live="polite">${Object.keys(DEFAULT_SETTINGS).length} controls - local only</div>
                </div>
            </div>
            <div id="glp-enhanced-settings-main">
            <nav id="glp-settings-nav" aria-label="Settings sections">__SECTION_NAV__</nav>
            <div id="glp-enhanced-settings-body">
                <div id="glp-settings-empty" class="glp-settings-empty" style="display:none">
                    <div class="glp-empty-title">No settings match that search</div>
                    <div class="glp-empty-body">Try a shorter word, or search by what a setting does - "hide", "quote", "export".</div>
                    <button type="button" class="glp-btn glp-btn-secondary" id="glp-settings-empty-reset">Clear filters</button>
                </div>
                ${createSettingsSection('Core', [
                    { key: 'enabled', label: 'Enable GLP Ultra' },
                    { key: 'safeMode', label: 'Safe Mode (ignore custom CSS)' },
                    { key: 'overrideDarkReader', label: 'Take Precedence Over Dark Reader' }
                ])}
                ${createSettingsSection('Ad Removal', [
                    { key: 'removeAds', label: 'Remove Advertisements (mgid)' },
                    { key: 'removeWidgets', label: 'Remove Widget Placeholders' },
                    { key: 'removeMsgAds', label: 'Remove In-Thread Ads' },
                    { key: 'removeAmpEmbeds', label: 'Remove AMP Embeds' }
                ])}
                ${createSettingsSection('Registration & Login', [
                    { key: 'autoBypassRegNag', label: 'Auto-Bypass Registration Nag' },
                    { key: 'hideLoginLinks', label: 'Hide All Login Buttons' }
                ])}
                ${createSettingsSection('Header Options', [
                    { key: 'hideHeaderBanner', label: 'Hide Header Banner Image' },
                    { key: 'hideStatsBar', label: 'Hide Stats Bar (Users/Views/Posts)' },
                    { key: 'hideHeaderTime', label: 'Hide Time & Login Row' },
                    { key: 'hideNotifications', label: 'Hide Notifications Bell' },
                    { key: 'hideThemeSwitcher', label: 'Hide Theme Switcher' },
                    { key: 'hideViewportToggle', label: 'Hide Desktop/Mobile Toggle' },
                    { key: 'compactHeader', label: 'Compact Header' }
                ])}
                ${createSettingsSection('Navigation', [
                    { key: 'hideTopLinks', label: 'Hide Top Links Bar (Directory/Search/Topics)' },
                    { key: 'hideMainNav', label: 'Hide Main Nav (Post/Popular/Topics/Chat)' },
                    { key: 'hideTabNav', label: 'Hide Tab Bar (Forum/Day/Extras/RSS)' },
                    { key: 'hideThreadControls', label: 'Hide Thread Controls (Back/Reply/Vote)' },
                    { key: 'hideRSS', label: 'Hide RSS Links' },
                    { key: 'hideChatRoom', label: 'Hide Chat Room Link' },
                    { key: 'hideJoinLink', label: 'Hide "Join GLP" Link' },
                    { key: 'hideMobilePostNew', label: 'Hide Mobile Post Button' },
                    { key: 'hideExtrasMenu', label: 'Hide Extras Menu' },
                    { key: 'compactNav', label: 'Compact Navigation Bar' },
                    { key: 'stickyNav', label: 'Sticky Navigation' }
                ])}
                ${createSettingsSection('Thread List (Forum Page)', [
                    { key: 'hideIconColumn', label: 'Hide Pin Icon Column' },
                    { key: 'hideRatingColumn', label: 'Hide Rating Column' },
                    { key: 'hideViewsColumn', label: 'Hide Views Column' },
                    { key: 'hideRepliesColumn', label: 'Hide Replies Column' },
                    { key: 'hidePostedColumn', label: 'Hide Posted Date Column' },
                    { key: 'hideUpdatedColumn', label: 'Hide Updated Date Column' },
                    { key: 'hidePosterColumn', label: 'Hide Poster Column' },
                    { key: 'hidePageLinks', label: 'Hide Page Links in Threads' },
                    { key: 'hideMobileThreadMeta', label: 'Hide Mobile Thread Meta' },
                    { key: 'hideThreadHeaderRow', label: 'Hide Column Headers Row' },
                    { key: 'hideForumPageNav', label: 'Hide Forum Page Navigation' },
                    { key: 'compactThreadList', label: 'Compact Thread List' },
                    { key: 'sortControls', label: 'Sort Controls Toolbar' },
                    { key: 'defaultSortByNew', label: 'Default to Newest First' },
                    { key: 'hidePinnedThreads', label: 'Hide Pinned Threads' },
                    { key: 'highlightPinnedThreads', label: 'Highlight Pinned Threads' },
                    { key: 'highlightSuperPins', label: 'Highlight Super Pins (Gold)' },
                    { key: 'highlightOP', label: 'Highlight OP Badge (Gold)' },
                    { key: 'zebraStripes', label: 'Zebra Stripe Rows' }
                ])}
                ${createSettingsSection('Post Display (Thread Page)', [
                    { key: 'hideAvatars', label: 'Hide Avatars' },
                    { key: 'hideKarmaBar', label: 'Hide Karma Bar' },
                    { key: 'hideUserID', label: 'Hide User ID' },
                    { key: 'hideGeoLocation', label: 'Hide Geo Location' },
                    { key: 'hidePostDate', label: 'Hide Post Date' },
                    { key: 'hideReportLinks', label: 'Hide Report Links' },
                    { key: 'hideSignatures', label: 'Hide Signatures' },
                    { key: 'hideLastEdited', label: 'Hide "Last Edited" Notices' },
                    { key: 'hideRateSection', label: 'Hide "Rate this Thread"' },
                    { key: 'hidePostActions', label: 'Hide Post Action Buttons' },
                    { key: 'hideReplyTitles', label: 'Hide "Re: Title" in Posts' },
                    { key: 'hideSubscriberBadge', label: 'Hide Subscriber Badges' },
                    { key: 'hideInlineReplyAds', label: 'Hide Inline Reply Ads' },
                    { key: 'compactPosts', label: 'Compact Posts' },
                    { key: 'compactPostTitle', label: 'Compact Thread Title Bar' },
                    { key: 'widerContent', label: 'Wider Content Area' },
                    { key: 'smallerAvatars', label: 'Smaller Avatars (80px max)' },
                    { key: 'collapseLongQuotes', label: 'Collapse Deeply Nested Quotes' },
                    { key: 'readerMode', label: 'Reader Mode (Distraction-Free)' },
                    { key: 'hideRelatedThreads', label: 'Hide Related Threads' }
                ])}
                ${createSettingsSection('Quote Styling', [
                    { key: 'compactQuotes', label: 'Compact Quotes' },
                    { key: 'quoteDepthBadges', label: 'Quote Depth Badges' },
                    { key: 'quoteBacklinks', label: 'Quote Backlinks (who answered this post)' },
                    { key: 'collapseNestedQuotes', label: 'Collapse Nested Quote Chains' },
                    { key: 'collapseQuotesByDefault', label: 'Collapse Every Quote by Default' },
                    { key: 'quoteBorderColor', label: 'Quote Border Color', type: 'color' }
                ])}
                ${createSettingsSection('Visual Enhancements', [
                    { key: 'colorTheme', label: 'Color Theme', type: 'select', options: {midnight:'Midnight',catppuccin:'Catppuccin Mocha',dracula:'Dracula',nord:'Nord',gruvbox:'Gruvbox',amoled:'AMOLED Black',solarized:'Solarized Dark',blood:'Blood',alien:'Alien Green',highcontrast:'High Contrast Dark'} },
                    { key: 'shapeStyle', label: 'Corner Style', type: 'select', options: {default:'Site Default',rounded:'Rounded',square:'Square'} },
                    { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 10, max: 24 },
                    { key: 'lineHeight', label: 'Line Height', type: 'number', min: 1, max: 2.5, step: 0.1 },
                    { key: 'maxContentWidth', label: 'Max Width (0=none)', type: 'number', min: 0, max: 2000 },
                    { key: 'darkModeEnhance', label: 'Enhanced Dark Mode' },
                    { key: 'smoothScrolling', label: 'Smooth Scrolling' }
                ])}
                ${createSettingsSection('Thread List Enhancements', [
                    { key: 'dimVisitedThreads', label: 'Dim Visited Threads' },
                    { key: 'truncateTitles', label: 'Truncate Long Titles (Ellipsis)' },
                    { key: 'hotThreadBadge', label: 'Color-Code Reply Counts (Hot Threads)' }
                ])}
                ${createSettingsSection('Post Enhancements', [
                    { key: 'dimAnonPosters', label: 'Dim "Anonymous Coward" Names' },
                    { key: 'hideEmoticons', label: 'Hide Emoticon/Smiley Images' },
                    { key: 'compactFlags', label: 'Compact Country Flags' },
                    { key: 'highlightOPPosts', label: 'Highlight OP Replies (Gold Border)' },
                    { key: 'relativeTimestamps', label: 'Relative Timestamps (2h ago)' },
                    { key: 'inlinePostNumbers', label: 'Show Post Numbers (#1, #2...)' },
                    { key: 'postPermalinks', label: 'Click Post # to Copy Link' },
                    { key: 'youtubeEmbed', label: 'Auto-Embed YouTube Links' },
                    { key: 'opPostNav', label: 'OP Post Navigation Buttons' },
                    { key: 'collapseExpandAll', label: 'Collapse/Expand All Buttons' },
                    { key: 'threadQuickSearch', label: 'Quick Search in Thread' }
                ])}
                ${createSettingsSection('UI Enhancements', [
                    { key: 'backToTopButton', label: 'Back-to-Top Button' },
                    { key: 'imageLightbox', label: 'Image Lightbox (Click to Zoom)' },
                    { key: 'imageGallery', label: 'Image Gallery (Prev/Next in Lightbox)' },
                    { key: 'collapsiblePosts', label: 'Collapsible Posts (Click Author)' },
                    { key: 'infiniteScroll', label: 'Infinite Scroll (Forum Pages)' },
                    { key: 'infiniteThreadScroll', label: 'Infinite Scroll (Thread Posts)' },
                    { key: 'freshnessColors', label: 'Thread Freshness Colors' },
                    { key: 'userMuteList', label: 'User Mute List ([mute] on Hover)' },
                    { key: 'userTags', label: 'User Tags (Custom Labels)' },
                    { key: 'scrollProgress', label: 'Scroll Progress Bar (Threads)' },
                    { key: 'threadPreview', label: 'Thread Preview on Hover' },
                    { key: 'autoRefresh', label: 'Auto-Refresh Thread List' },
                    { key: 'autoRefreshInterval', label: 'Refresh Interval (seconds)', type: 'number', min: 15, max: 600 }
                ])}
                ${createSettingsSection('Filtering & Custom', [
                    { key: 'hideThreadButtons', label: 'Show Hide Thread Buttons (x)' },
                    { key: 'userBlockList', label: 'User Block Buttons (by User ID)' },
                    { key: 'hideMemeReplies', label: 'Hide Image-Only Replies' },
                    { key: 'hideBoomerGifs', label: 'Hide Reaction GIFs (/sm/)' },
                    { key: 'keywordHighlight', label: 'Highlight Keywords (comma-sep)', type: 'text', maxLength: 2000 },
                    { key: 'keywordHide', label: 'Hide Keywords (comma-sep)', type: 'text', maxLength: 2000 },
                    { key: 'customCSS', label: 'Custom CSS', type: 'textarea', maxLength: 20000 }
                ])}
                ${createSettingsSection('Thread Watcher', [
                    { key: 'watcherEnabled', label: 'Enable Thread Watcher' },
                    { key: 'watcherIntervalMinutes', label: 'Check Interval (minutes)', type: 'number', min: 5, max: 240 },
                    { key: 'watcherDigest', label: 'Show Watched-Thread Digest' },
                    { key: 'watcherBadge', label: 'Show Unread Count Badge' },
                    { key: 'watcherPauseHidden', label: 'Pause Checks in Background Tabs' }
                ])}
                ${createSettingsSection('User Intelligence', [
                    { key: 'userMuteMatchMode', label: 'Mute Match Mode', type: 'select', options: {exact:'Exact name',contains:'Name contains',regex:'Regular expression'} },
                    { key: 'userNotes', label: 'Private Notes on Tagged Users' },
                    { key: 'userReputationOverlay', label: 'Local Trust Overlay (posts seen)' },
                    { key: 'userHistoryCap', label: 'Posters Kept in Local History', type: 'number', min: 50, max: 1000 }
                ])}
                ${createSettingsSection('User Data', [], 'user-data')}
                ${createSettingsSection('Media & Embeds', [
                    { key: 'mediaPrivacyMode', label: 'Click-to-Load Third-Party Embeds' },
                    { key: 'mediaXEmbeds', label: 'Normalize X / Twitter Embeds' },
                    { key: 'mediaActions', label: 'Save / Open / Copy Buttons on Images' },
                    { key: 'mediaHoverPreview', label: 'Hover Preview for Images' },
                    { key: 'mediaHoverPreviewSize', label: 'Hover Preview Size (% of viewport)', type: 'number', min: 30, max: 95 }
                ])}
                ${createSettingsSection('Export & Data', [
                    { key: 'exportThreadMarkdown', label: 'Export Thread as Markdown' },
                    { key: 'exportThreadHtml', label: 'Export Thread as HTML' },
                    { key: 'exportThreadJson', label: 'Export Thread as JSON' },
                    { key: 'exportMediaManifest', label: 'Include Media Manifest' },
                    { key: 'exportCopyThreadLink', label: 'Copy Thread Link Button' }
                ])}
                ${createSettingsSection('Muted Users', [], 'mute-list')}
                ${createSettingsSection('Blocked Users', [], 'block-list')}
                ${createSettingsSection('Presets', [], 'presets')}
                ${createSettingsSection('Accessibility', [
                    { key: 'reduceMotion', label: 'Reduce Motion (No Animations)' },
                    { key: 'highContrast', label: 'High Contrast Text And Borders' },
                    { key: 'largeTargets', label: 'Larger Click Targets' }
                ])}
                ${createSettingsSection('Miscellaneous', [
                    { key: 'autoExpandImages', label: 'Auto-Expand Images' },
                    { key: 'hideFooter', label: 'Hide Footer' },
                    { key: 'hideAllClfix', label: 'Remove Layout Spacers (br/clfix)' },
                    { key: 'updateNotices', label: 'Announce New Settings After An Update' },
                    { key: 'noiseBudget', label: 'Noise Budget (What Is Being Hidden)' },
                    { key: 'syncSettings', label: 'Sync Settings Across Devices (Extension Only)' }
                ])}
            </div>
            </div>
            <div id="glp-enhanced-settings-footer">
                <div class="glp-footer-save-state">All changes are saved locally</div>
                <div class="glp-footer-cluster">
                    <div class="glp-footer-group glp-footer-destructive">
                        <button class="glp-btn glp-btn-danger" id="glp-reset-btn" title="Restore every setting to its default. Undoable from the toast.">Reset to defaults</button>
                    </div>
                    <div class="glp-footer-group">
                        <button class="glp-btn glp-btn-secondary" id="glp-recovery-btn" title="Everything currently hidden, muted, blocked or filtered - restorable one at a time">Recovery</button>
                        <button class="glp-btn glp-btn-secondary" id="glp-diagnostics-btn" title="Route, selector health, feature timings and recent errors">Diagnostics</button>
                    </div>
                    <div class="glp-footer-group">
                        <button class="glp-btn glp-btn-secondary" id="glp-export-btn" title="Download every setting and list as a JSON backup">Export</button>
                        <button class="glp-btn glp-btn-secondary" id="glp-import-btn" title="Load settings and lists from a backup file">Import</button>
                    </div>
                </div>
                <div class="glp-footer-group">
                    <button class="glp-btn glp-btn-secondary" id="glp-cancel-btn">Close</button>
                    <button class="glp-btn glp-btn-primary" id="glp-save-btn">Save changes</button>
                </div>
            </div>
        `;

        // The rail is rendered above the sections but can only be built after them: the section
        // ids are collected as each one renders. Substitute once, into the finished string.
        setTrustedHTML(panel, panelHTML.replace('__SECTION_NAV__', buildSettingsNavHTML()));

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        document.getElementById('glp-enhanced-close-btn').addEventListener('click', closeSettings);
        document.getElementById('glp-cancel-btn').addEventListener('click', closeSettings);
        document.getElementById('glp-save-btn').addEventListener('click', saveAndApply);
        document.getElementById('glp-reset-btn').addEventListener('click', resetSettingsWithUndo);
        document.getElementById('glp-export-btn').addEventListener('click', exportSettings);
        document.getElementById('glp-import-btn').addEventListener('click', importSettings);
        document.getElementById('glp-recovery-btn').addEventListener('click', toggleRecoveryShelf);
        document.getElementById('glp-diagnostics-btn').addEventListener('click', toggleDiagnosticsPanel);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSettings();
        });

        initSettingsSearch();
        bindImmediateSettings();

        requestAnimationFrame(() => {
            document.getElementById('glp-settings-search')?.focus();
        });

        // Mute list unmute buttons
        const muteManage = document.getElementById('glp-mute-manage');
        if (muteManage) {
            muteManage.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-unmute]');
                if (btn) {
                    unmuteUser(btn.dataset.unmute);
                    setTrustedHTML(muteManage, getMuteListHTML());
                }
            });
        }

        // Block list unblock buttons
        const blockManage = document.getElementById('glp-block-manage');
        if (blockManage) {
            blockManage.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-unblock]');
                if (btn) {
                    unblockUser(btn.dataset.unblock);
                    setTrustedHTML(blockManage, getBlockListHTML());
                }
            });
        }

        document.getElementById('glp-clear-user-history')?.addEventListener('click', () => {
            const previousStats = { ...userStats };
            const previousPages = [...userStatsPages];
            clearUserHistory();
            showNotification('Local poster history cleared.', 'warning', {
                label: 'Undo',
                onClick: () => {
                    userStats = previousStats;
                    userStatsPages = previousPages;
                    saveUserStats();
                    applyReputationOverlay();
                    showNotification('Poster history restored.', 'success');
                }
            });
        });

        document.getElementById('glp-preset-reader')?.addEventListener('click', () => {
            applyReaderPreset();
            closeSettings();
        });
        document.getElementById('glp-pack-export-theme')?.addEventListener('click', () => exportPack('theme'));
        document.getElementById('glp-pack-export-filters')?.addEventListener('click', () => exportPack('filters'));
        document.getElementById('glp-pack-import')?.addEventListener('click', importPack);
    }

    // Stable ids for the jump rail. Derived from the title so the rail and the sections cannot
    // drift apart when a section is added.
    const SECTION_ORDER = [];
    const SECTION_NAV_GROUPS = [
        { label: 'Essentials', titles: ['Core', 'Ad Removal', 'Registration & Login'] },
        { label: 'Reading', titles: ['Header Options', 'Navigation', 'Thread List (Forum Page)', 'Post Display (Thread Page)', 'Quote Styling', 'Visual Enhancements', 'Thread List Enhancements', 'Post Enhancements', 'UI Enhancements'] },
        { label: 'People & Data', titles: ['Filtering & Custom', 'Thread Watcher', 'User Intelligence', 'User Data', 'Media & Embeds', 'Export & Data', 'Muted Users', 'Blocked Users', 'Presets'] },
        { label: 'System', titles: ['Accessibility', 'Miscellaneous'] }
    ];

    function sectionGroupTitle(title) {
        const group = SECTION_NAV_GROUPS.find(entry => entry.titles.includes(title));
        return group ? group.label : 'Settings';
    }

    function buildSettingsNavHTML() {
        let sequence = 1;
        const known = new Set();
        const groups = SECTION_NAV_GROUPS.map(group => {
            const entries = group.titles.map(title => SECTION_ORDER.find(entry => entry.title === title)).filter(Boolean);
            entries.forEach(entry => known.add(entry.id));
            if (!entries.length) return '';
            const buttons = entries.map(entry =>
                `<button type="button" class="glp-nav-item" data-nav-section="${escapeAttribute(entry.id)}">` +
                `<span class="glp-nav-icon" aria-hidden="true">${String(sequence++).padStart(2, '0')}</span>` +
                `<span>${escapeHTML(entry.title.replace(' (Forum Page)', '').replace(' (Thread Page)', ''))}</span>` +
                `<span class="glp-nav-dot" aria-hidden="true"></span></button>`
            ).join('');
            return `<div class="glp-nav-group" data-nav-group="${escapeAttribute(group.label)}">` +
                `<span class="glp-nav-group-title">${escapeHTML(group.label)}</span>${buttons}</div>`;
        }).join('');
        const extras = SECTION_ORDER.filter(entry => !known.has(entry.id)).map(entry =>
            `<button type="button" class="glp-nav-item" data-nav-section="${escapeAttribute(entry.id)}">` +
            `<span class="glp-nav-icon" aria-hidden="true">${String(sequence++).padStart(2, '0')}</span>` +
            `<span>${escapeHTML(entry.title)}</span><span class="glp-nav-dot" aria-hidden="true"></span></button>`
        ).join('');
        return groups + (extras ? `<div class="glp-nav-group"><span class="glp-nav-group-title">More</span>${extras}</div>` : '') +
            '<div class="glp-local-privacy"><strong>Private by design</strong>Settings and user data stay in this browser.</div>';
    }

    function sectionSlug(title) {
        const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!SECTION_ORDER.some(entry => entry.id === slug)) SECTION_ORDER.push({ id: slug, title: title });
        return slug;
    }

    function createSettingsSection(title, items, specialId) {
        let contentHTML = '';
        const desc = SECTION_DESCRIPTIONS[title] || '';
        const changedCount = items.filter(item => settings[item.key] !== DEFAULT_SETTINGS[item.key]).length;
        const enabledCount = items.filter(item => typeof settings[item.key] === 'boolean' && settings[item.key]).length;

        if (specialId === 'mute-list') {
            contentHTML = `<div class="glp-mute-manage-list" id="glp-mute-manage">${getMuteListHTML()}</div>`;
        } else if (specialId === 'block-list') {
            contentHTML = `<div class="glp-mute-manage-list" id="glp-block-manage">${getBlockListHTML()}</div>`;
        } else if (specialId === 'user-data') {
            contentHTML = `
                <div class="glp-setting-item full-width" data-search="user data export import backup mutes tags notes history">
                    <label><span class="glp-setting-label">Local user data</span><span class="glp-setting-help">Mutes, blocks, tags, private notes, hidden threads, and the local poster history are all included in the Export button below. Clearing the history removes only the seen-post counters.</span></label>
                    <button type="button" class="glp-btn glp-btn-danger" id="glp-clear-user-history">Clear local poster history</button>
                </div>
            `;
        } else if (specialId === 'presets') {
            contentHTML = `
                <div class="glp-setting-item full-width" data-search="presets lean reading preset declutter">
                    <label><span class="glp-setting-label">Lean reading preset</span><span class="glp-setting-help">Turns on every ad, chrome, and metadata cleanup at once. Applies immediately with an undo toast.</span></label>
                    <button type="button" class="glp-btn glp-btn-secondary" id="glp-preset-reader">Apply lean reading preset</button>
                </div>
                <div class="glp-setting-item full-width" data-search="packs share theme filters export import pack">
                    <label><span class="glp-setting-label">Shareable packs</span><span class="glp-setting-help">A pack is one slice of this configuration, not the whole profile: a theme pack carries the look, a filter pack carries mutes, blocks, and keyword rules. Importing a filter pack adds to your lists instead of replacing them, so someone else's pack cannot wipe yours.</span></label>
                    <div class="glp-footer-group">
                        <button type="button" class="glp-btn glp-btn-secondary" id="glp-pack-export-theme">Export theme pack</button>
                        <button type="button" class="glp-btn glp-btn-secondary" id="glp-pack-export-filters">Export filter pack</button>
                        <button type="button" class="glp-btn glp-btn-secondary" id="glp-pack-import">Import pack</button>
                    </div>
                </div>
            `;
        } else {
            contentHTML = items.map(item => {
                const value = settings[item.key];
                const help = SETTING_DESCRIPTIONS[item.key] || '';
                const label = escapeHTML(item.label);
                const key = escapeAttribute(item.key);
                const searchText = escapeAttribute(`${title} ${item.key} ${item.label} ${help}`);
                let input;

                if (item.type === 'number') {
                    input = `<input type="number" id="setting-${key}" value="${escapeAttribute(value)}"
                             min="${item.min || 0}" max="${item.max || 9999}" step="${item.step || 1}">`;
                } else if (item.type === 'color') {
                    // <input type="color"> cannot hold `var(--glpx-accent)` and silently coerces
                    // an unparseable value to #000000. Show the resolved accent instead, and flag
                    // the control as still following the theme so reading the panel back does not
                    // turn that into a literal black the user never chose.
                    const followsTheme = typeof value === 'string' && value.trim().startsWith('var(');
                    const swatch = followsTheme ? (THEME_PALETTES[settings.colorTheme] || THEME_PALETTES.midnight).accent : value;
                    input = `<input type="color" id="setting-${key}" value="${escapeAttribute(swatch)}"` +
                            `${followsTheme ? ` data-follows-theme="${escapeAttribute(value)}"` : ''}>`;
                } else if (item.type === 'select') {
                    const opts = Object.entries(item.options).map(([v, l]) =>
                        `<option value="${escapeAttribute(v)}"${v === value ? ' selected' : ''}>${escapeHTML(l)}</option>`
                    ).join('');
                    input = `<select id="setting-${key}">${opts}</select>`;
                } else if (item.type === 'text') {
                    input = `<input type="text" id="setting-${key}" value="${escapeAttribute(value || '')}"${item.maxLength ? ` maxlength="${item.maxLength}"` : ''}>`;
                } else if (item.type === 'textarea') {
                    input = `<textarea id="setting-${key}" rows="4"${item.maxLength ? ` maxlength="${item.maxLength}"` : ''}>${escapeHTML(value || '')}</textarea>`;
                } else {
                    input = `<input type="checkbox" id="setting-${key}" ${value ? 'checked' : ''}>`;
                }

                const fullWidth = (item.type === 'textarea') ? ' full-width' : '';
                return `
                    <div class="glp-setting-item${fullWidth}" data-search="${searchText}" data-setting-key="${key}">
                        ${item.type === 'textarea' ? `<label for="setting-${key}"><span class="glp-setting-label">${label}</span>${help ? `<span class="glp-setting-help">${escapeHTML(help)}</span>` : ''}</label>${input}` : `${input}<label for="setting-${key}"><span class="glp-setting-label">${label}</span>${help ? `<span class="glp-setting-help">${escapeHTML(help)}</span>` : ''}</label>`}
                    </div>
                `;
            }).join('');
        }

        const sectionId = escapeAttribute(sectionSlug(title));

        return `
            <div class="glp-settings-section" data-section-title="${escapeAttribute(title)}" data-section-id="${sectionId}" data-section-group="${escapeAttribute(sectionGroupTitle(title))}">
                <div class="glp-settings-section-header">
                    <div class="glp-section-heading" data-group-label="${escapeAttribute(sectionGroupTitle(title))}">
                        <h3>${escapeHTML(title)}</h3>
                        ${desc ? `<div class="glp-section-desc">${escapeHTML(desc)}</div>` : ''}
                    </div>
                    <div class="glp-section-meta">
                        <span class="glp-section-stat"><strong class="glp-section-count">${items.length || 'Manage'}</strong><small>Controls</small></span>
                        <span class="glp-section-stat"><strong class="glp-section-enabled-count">${enabledCount}</strong><small>Enabled</small></span>
                        <span class="glp-section-stat glp-section-change-stat"><strong class="glp-section-changed-count">${changedCount}</strong><small>Changed</small><button type="button" class="glp-section-reset" data-reset-section="${sectionId}" title="Put this section back to its defaults" style="display:none">Reset</button></span>
                        <span class="toggle-icon" aria-hidden="true">&#x25BC;</span>
                    </div>
                </div>
                <div class="glp-settings-section-content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    /**
     * Marks every row whose value differs from the default. 140 settings across 23 sections is
     * unnavigable without an answer to "what have I actually changed?" - the dot answers it in
     * place, and the Only changed filter turns that into a view.
     */
    function markChangedSettings() {
        let changed = 0;
        document.querySelectorAll('.glp-setting-item[data-setting-key]').forEach(item => {
            const key = item.dataset.settingKey;
            const isChanged = Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key) &&
                String(settings[key]) !== String(DEFAULT_SETTINGS[key]);
            item.classList.toggle('glp-setting-changed', isChanged);
            if (isChanged) changed++;
        });

        document.querySelectorAll('.glp-settings-section').forEach(section => {
            const count = section.querySelectorAll('.glp-setting-changed').length;
            const enabled = section.querySelectorAll('.glp-setting-item input[type="checkbox"]:checked').length;
            section.classList.toggle('glp-section-has-changes', count > 0);
            const enabledBadge = section.querySelector('.glp-section-enabled-count');
            if (enabledBadge) enabledBadge.textContent = String(enabled);
            const badge = section.querySelector('.glp-section-changed-count');
            if (badge) {
                badge.textContent = String(count);
                badge.style.display = '';
            }
            const reset = section.querySelector('[data-reset-section]');
            if (reset) reset.style.display = count ? '' : 'none';
            const navItem = document.querySelector('[data-nav-section="' + section.dataset.sectionId + '"]');
            if (navItem) navItem.classList.toggle('glp-nav-changed', count > 0);
        });

        return changed;
    }

    function initSettingsSearch() {
        const search = document.getElementById('glp-settings-search');
        if (!search) return;

        const status = document.getElementById('glp-settings-status');
        const empty = document.getElementById('glp-settings-empty');
        const onlyChanged = document.getElementById('glp-only-changed');
        const body = document.getElementById('glp-enhanced-settings-body');
        let activeSectionId = SECTION_ORDER[0] ? SECTION_ORDER[0].id : '';

        const activatePage = (sectionId, { scroll = false } = {}) => {
            const section = document.querySelector('.glp-settings-section[data-section-id="' + sectionId + '"]');
            if (!section || section.classList.contains('glp-filtered')) return false;
            activeSectionId = sectionId;
            document.querySelectorAll('.glp-settings-section').forEach(node => {
                node.classList.toggle('glp-page-active', node === section);
            });
            document.querySelectorAll('#glp-settings-nav .glp-nav-item').forEach(node => {
                const active = node.dataset.navSection === sectionId;
                node.classList.toggle('glp-nav-active', active);
                node.setAttribute('aria-current', active ? 'page' : 'false');
            });
            if (scroll && body) body.scrollTo({ top: 0, behavior: settings.reduceMotion ? 'auto' : 'smooth' });
            return true;
        };

        const applyFilter = () => {
            const query = search.value.trim().toLowerCase();
            const changedOnly = onlyChanged && onlyChanged.getAttribute('aria-pressed') === 'true';
            let matches = 0;
            let visibleSections = 0;
            const candidates = [];

            document.querySelectorAll('.glp-settings-section').forEach(section => {
                let visibleItems = 0;
                const sectionTitle = (section.dataset.sectionTitle || '').toLowerCase();
                const sectionMatches = !query || sectionTitle.includes(query);
                section.querySelectorAll('.glp-setting-item').forEach(item => {
                    const haystack = (item.dataset.search || '').toLowerCase();
                    const textMatch = sectionMatches || haystack.includes(query);
                    const changeMatch = !changedOnly || item.classList.contains('glp-setting-changed');
                    const match = textMatch && changeMatch;
                    item.classList.toggle('glp-filtered', !match);
                    if (match) visibleItems++;
                });

                const isSpecial = section.querySelector('#glp-mute-manage, #glp-block-manage');
                const showSection = changedOnly
                    ? visibleItems > 0
                    : (isSpecial ? sectionMatches : visibleItems > 0 || sectionMatches);
                section.classList.toggle('glp-filtered', !showSection);
                matches += visibleItems;
                if (showSection) {
                    visibleSections++;
                    candidates.push(section.dataset.sectionId);
                }

                const navItem = document.querySelector('[data-nav-section="' + section.dataset.sectionId + '"]');
                if (navItem) navItem.classList.toggle('glp-filtered', !showSection);
            });

            document.querySelectorAll('#glp-settings-nav .glp-nav-group').forEach(group => {
                group.classList.toggle('glp-filtered', !group.querySelector('.glp-nav-item:not(.glp-filtered)'));
            });

            if (status) {
                if (changedOnly) status.textContent = matches + ' changed from default';
                else if (query) status.textContent = matches + ' match' + (matches === 1 ? '' : 'es') + ' in ' + visibleSections + ' page' + (visibleSections === 1 ? '' : 's');
                else status.textContent = Object.keys(DEFAULT_SETTINGS).length + ' controls - ' + SECTION_ORDER.length + ' pages';
            }
            if (empty) empty.style.display = visibleSections === 0 ? '' : 'none';
            const clear = document.getElementById('glp-settings-clear');
            if (clear) clear.style.display = query ? '' : 'none';

            if (candidates.length) {
                activatePage(candidates.includes(activeSectionId) ? activeSectionId : candidates[0]);
            } else {
                document.querySelectorAll('.glp-settings-section').forEach(section => section.classList.remove('glp-page-active'));
                document.querySelectorAll('#glp-settings-nav .glp-nav-active').forEach(node => node.classList.remove('glp-nav-active'));
            }
        };

        search.addEventListener('input', applyFilter);

        const clearButton = document.getElementById('glp-settings-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                search.value = '';
                applyFilter();
                search.focus();
            });
        }

        if (onlyChanged) {
            onlyChanged.addEventListener('click', () => {
                const next = onlyChanged.getAttribute('aria-pressed') !== 'true';
                onlyChanged.setAttribute('aria-pressed', String(next));
                onlyChanged.classList.toggle('glp-toggle-on', next);
                applyFilter();
            });
        }

        const emptyReset = document.getElementById('glp-settings-empty-reset');
        if (emptyReset) {
            emptyReset.addEventListener('click', () => {
                search.value = '';
                if (onlyChanged) {
                    onlyChanged.setAttribute('aria-pressed', 'false');
                    onlyChanged.classList.remove('glp-toggle-on');
                }
                applyFilter();
                search.focus();
            });
        }

        // The rail is page routing, not a set of anchors into one very long accordion.
        const nav = document.getElementById('glp-settings-nav');
        if (nav) {
            nav.addEventListener('click', event => {
                const link = event.target.closest('[data-nav-section]');
                if (!link) return;
                activatePage(link.dataset.navSection, { scroll: true });
            });
        }

        // Per-section reset. The global reset is all-or-nothing, which is not what anyone wants
        // when a single section has drifted.
        if (body) {
            body.addEventListener('click', event => {
                const button = event.target.closest('[data-reset-section]');
                if (!button) return;
                event.stopPropagation();
                const section = button.closest('.glp-settings-section');
                const restored = [];
                section.querySelectorAll('.glp-setting-item[data-setting-key]').forEach(item => {
                    const key = item.dataset.settingKey;
                    const input = document.getElementById('setting-' + key);
                    if (!input || !Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
                    if (String(settings[key]) === String(DEFAULT_SETTINGS[key])) return;
                    restored.push({ key: key, previous: settings[key] });
                    settings[key] = DEFAULT_SETTINGS[key];
                    if (input.type === 'checkbox') input.checked = DEFAULT_SETTINGS[key];
                    else input.value = DEFAULT_SETTINGS[key];
                });
                if (!restored.length) return;
                saveSettings();
                applyStyles();
                runFeatureRegistry('apply');
                markChangedSettings();
                applyFilter();
                showNotification(section.dataset.sectionTitle + ': ' + restored.length + ' setting' + (restored.length === 1 ? '' : 's') + ' back to default.', 'info', {
                    label: 'Undo',
                    onClick: () => {
                        restored.forEach(entry => {
                            settings[entry.key] = entry.previous;
                            const input = document.getElementById('setting-' + entry.key);
                            if (input) {
                                if (input.type === 'checkbox') input.checked = entry.previous;
                                else input.value = entry.previous;
                            }
                        });
                        saveSettings();
                        applyStyles();
                        runFeatureRegistry('apply');
                        markChangedSettings();
                        applyFilter();
                    }
                });
            });

            // Any edit re-marks, so the dots and counts never lag behind the panel.
            body.addEventListener('change', () => {
                readSettingsFromPanel();
                markChangedSettings();
                applyFilter();
            });
        }

        markChangedSettings();
        applyFilter();
    }

    function readSettingsFromPanel() {
        Object.keys(DEFAULT_SETTINGS).forEach(key => {
            const input = document.getElementById(`setting-${key}`);
            if (!input) return;
            let raw;
            if (input.type === 'checkbox') {
                raw = input.checked;
            } else if (input.type === 'number') {
                raw = parseFloat(input.value);
            } else if (input.type === 'color' && input.dataset.followsTheme) {
                raw = input.dataset.followsTheme;
            } else {
                raw = input.value;
            }
            // The panel is an ingress like any other. It used to assign straight through, so a
            // free-text ceiling was enforced only by the HTML maxlength attribute - a DOM
            // constraint, not a code one - and an emptied number box stored NaN, which
            // JSON.stringify turns into null. normalizeSettingValue clamps, truncates and
            // type-checks the same way every other ingress already did.
            settings[key] = normalizeSettingValue(key, raw);
        });
    }

    function applyPanelSettings({ notify = false } = {}) {
        const wasEnabled = settings.enabled;
        readSettingsFromPanel();
        saveSettings();
        applyStyles();

        if (!settings.enabled) {
            destroyEnhancedUI({ keepSettingsPanel: true, keepStyles: true });
        } else if (!wasEnabled || !runtimeState.featuresStarted) {
            startFeatures();
        } else {
            document.body.classList.add('glp-enhanced-active', 'glpx-enabled');
            runFeatureRegistry('apply');
        }

        if (notify) showNotification('Settings saved and applied.', 'success');
    }

    function bindImmediateSettings() {
        document.querySelectorAll('[id^="setting-"]').forEach(input => {
            const eventName = input.type === 'text' || input.tagName === 'TEXTAREA' ? 'input' : 'change';
            if (input.type === 'color') {
                input.addEventListener('input', () => { delete input.dataset.followsTheme; }, { once: true });
            }
            input.addEventListener(eventName, () => {
                window.clearTimeout(runtimeState.settingsApplyTimer);
                runtimeState.settingsApplyTimer = window.setTimeout(() => {
                    applyPanelSettings();
                }, 160);
            });
        });
    }

    function closeSettings() {
        const overlay = ownedElement('glp-enhanced-overlay');
        if (overlay) overlay.remove();
    }

    function saveAndApply() {
        applyPanelSettings({ notify: true });
        closeSettings();
    }

    function resetSettingsWithUndo() {
        const previousSettings = { ...settings };
        resetSettings();
        applyStyles();
        closeSettings();
        showNotification('Settings reset to refined defaults.', 'warning', {
            label: 'Undo',
            onClick: () => {
                settings = { ...DEFAULT_SETTINGS, ...previousSettings };
                saveSettings();
                applyStyles();
                showNotification('Previous settings restored.', 'success');
            }
        });
    }

    // The backup carries every local store, not just the toggles: a settings file that
    // loses your mutes, tags, notes, and hidden threads is not a backup.
    function buildBackupPayload() {
        loadMutedUsers();
        loadBlockedUsers();
        loadUserTags();
        loadHiddenThreads();
        loadUserStats();
        loadWatchedThreads();
        return {
            format: 'glp-ultra-backup',
            formatVersion: 3,
            version: SCRIPT_VERSION,
            exportedAt: new Date().toISOString(),
            settings,
            mutedUsers,
            blockedUsers,
            userTags,
            userStats,
            userStatsPages,
            hiddenThreads,
            hiddenThreadTitles,
            watchedThreads
        };
    }

    // ============================================
    // SHAREABLE PACKS
    // ============================================

    // A pack is one slice of a profile, not a backup. Keeping the key lists explicit means a
    // future setting is not silently swept into a file people hand to each other.
    const PACK_KEYS = Object.freeze({
        theme: ['colorTheme', 'shapeStyle', 'fontSize', 'lineHeight', 'maxContentWidth',
            'darkModeEnhance', 'quoteBorderColor'],
        filters: ['keywordHide', 'keywordHighlight', 'hideMemeReplies', 'hideBoomerGifs',
            'userMuteMatchMode']
    });

    function buildPack(kind) {
        const keys = PACK_KEYS[kind] || [];
        const pack = {
            format: 'glp-ultra-pack',
            kind,
            version: SCRIPT_VERSION,
            exportedAt: new Date().toISOString(),
            settings: {}
        };
        keys.forEach(key => { pack.settings[key] = settings[key]; });

        if (kind === 'filters') {
            loadMutedUsers();
            loadBlockedUsers();
            pack.mutedUsers = [...mutedUsers];
            pack.blockedUsers = blockedUsers.map(user => ({ ...user }));
        }
        return pack;
    }

    function exportPack(kind) {
        const data = JSON.stringify(buildPack(kind), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glp-ultra-${kind}-pack-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification(`${kind === 'theme' ? 'Theme' : 'Filter'} pack exported.`, 'success');
    }

    function mergeCommaList(current, incoming) {
        const seen = new Set();
        return [...String(current || '').split(','), ...String(incoming || '').split(',')]
            .map(part => part.trim())
            .filter(part => {
                if (!part) return false;
                const key = part.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .join(', ');
    }

    /**
     * Applies a pack over the current configuration. A theme pack replaces the look, because a
     * half-merged theme is nobody's theme. A filter pack *adds*: lists are unioned and keyword
     * rules are merged, so importing someone else's pack can never delete your own mutes.
     */
    function applyPack(pack) {
        const kind = pack && pack.kind;
        const keys = PACK_KEYS[kind];
        if (!keys || pack.format !== 'glp-ultra-pack' || !isRecord(pack.settings)) {
            return { ok: false, reason: 'invalid pack' };
        }

        let changed = 0;
        keys.forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(pack.settings, key)) return;
            const incoming = normalizeSettingValue(key, pack.settings[key]);
            if (kind === 'filters' && (key === 'keywordHide' || key === 'keywordHighlight')) {
                const merged = mergeCommaList(settings[key], incoming);
                if (merged !== settings[key]) { settings[key] = merged; changed++; }
                return;
            }
            if (settings[key] !== incoming) { settings[key] = incoming; changed++; }
        });

        let addedUsers = 0;
        if (kind === 'filters') {
            loadMutedUsers();
            loadBlockedUsers();
            const previousMuted = mutedUsers.length;
            const previousBlocked = blockedUsers.length;
            mutedUsers = sanitizeMutedUsers([...mutedUsers, ...(sanitizeMutedUsers(pack.mutedUsers) || [])]) || [];
            blockedUsers = sanitizeBlockedUsers([...blockedUsers, ...(sanitizeBlockedUsers(pack.blockedUsers) || [])]) || [];
            addedUsers = (mutedUsers.length - previousMuted) + (blockedUsers.length - previousBlocked);
            saveMutedUsers();
            saveBlockedUsers();
        }

        saveSettings();
        applyStyles();
        runFeatureRegistry('apply');
        return { ok: true, changed, addedUsers };
    }

    function importPack() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                let pack;
                try {
                    pack = JSON.parse(String(reader.result));
                } catch (error) {
                    showNotification('That file is not valid JSON.', 'error');
                    return;
                }
                if (!pack || pack.format !== 'glp-ultra-pack') {
                    showNotification('That is not a GLP Ultra pack. Use Import under Export & Data for a full backup.', 'error');
                    return;
                }
                const result = applyPack(pack);
                if (!result.ok) {
                    showNotification(`Pack not applied: ${result.reason}.`, 'error');
                    return;
                }
                const parts = [`${result.changed} setting${result.changed === 1 ? '' : 's'}`];
                if (result.addedUsers) parts.push(`${result.addedUsers} list entr${result.addedUsers === 1 ? 'y' : 'ies'}`);
                showNotification(`${pack.kind === 'theme' ? 'Theme' : 'Filter'} pack applied: ${parts.join(', ')}.`, 'success');
                closeSettings();
            };
            reader.readAsText(file);
        });
        input.click();
    }

    function exportSettings() {
        const data = JSON.stringify(buildBackupPayload(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glp-ultra-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification('Settings and user data exported.', 'success');
    }

    /**
     * Restores a parsed backup through the same constraints used for stored settings. A malformed
     * family is ignored instead of replacing healthy local data; a present, valid empty family
     * still clears that family, which keeps intentional empty backups useful.
     */
    function applyBackupPayload(data) {
        if (!isRecord(data)) return { ok: false, reason: 'invalid backup' };

        const directSettings = isRecord(data.settings)
            ? data.settings
            : (!data.format && Object.keys(data).some(key => Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key))
                ? data
                : null);
        const source = isRecord(data.data) ? data.data : data;
        const oldLists = isRecord(data.lists) ? data.lists : {};
        const candidates = {
            mutedUsers: source.mutedUsers ?? oldLists.muted,
            blockedUsers: source.blockedUsers ?? oldLists.blocked,
            hiddenThreads: source.hiddenThreads ?? oldLists.hidden,
            hiddenThreadTitles: source.hiddenThreadTitles,
            userTags: source.userTags,
            watchedThreads: source.watchedThreads,
            userStats: source.userStats,
            userStatsPages: source.userStatsPages
        };

        const hasRecognizedData = Object.values(candidates).some(value => value !== undefined);
        if (!directSettings && !hasRecognizedData) return { ok: false, reason: 'unrecognized backup' };

        let importedSettings = 0;
        let importedStores = 0;
        if (directSettings) {
            const migrated = migrateSettingsPayload(directSettings).settings;
            importedSettings = Object.keys(migrated).length;
            settings = { ...DEFAULT_SETTINGS, ...migrated };
            saveSettings();
        }

        const nextMuted = sanitizeMutedUsers(candidates.mutedUsers);
        if (nextMuted !== undefined) {
            mutedUsers = nextMuted;
            saveMutedUsers();
            importedStores++;
        }

        const nextBlocked = sanitizeBlockedUsers(candidates.blockedUsers);
        if (nextBlocked !== undefined) {
            blockedUsers = nextBlocked;
            saveBlockedUsers();
            importedStores++;
        }

        const nextHidden = sanitizeHiddenThreads(candidates.hiddenThreads);
        const nextTitles = sanitizeHiddenThreadTitles(candidates.hiddenThreadTitles);
        if (nextHidden !== undefined || nextTitles !== undefined) {
            if (nextHidden !== undefined) hiddenThreads = nextHidden;
            if (nextTitles !== undefined) hiddenThreadTitles = nextTitles;
            saveHiddenThreads();
            importedStores += Number(nextHidden !== undefined) + Number(nextTitles !== undefined);
        }

        const nextTags = sanitizeUserTags(candidates.userTags);
        if (nextTags !== undefined) {
            userTags = nextTags;
            saveUserTags();
            importedStores++;
        }

        const nextWatched = sanitizeWatchedThreads(candidates.watchedThreads);
        if (nextWatched !== undefined) {
            watchedThreads = nextWatched;
            saveWatchedThreads();
            importedStores++;
        }

        const nextStats = sanitizeUserStats(candidates.userStats);
        const nextStatsPages = sanitizeUserStatsPages(candidates.userStatsPages);
        if (nextStats !== undefined || nextStatsPages !== undefined) {
            if (nextStats !== undefined) userStats = nextStats;
            if (nextStatsPages !== undefined) userStatsPages = nextStatsPages;
            saveUserStats();
            importedStores += Number(nextStats !== undefined) + Number(nextStatsPages !== undefined);
        }

        applyStyles();
        if (!settings.enabled) {
            destroyEnhancedUI({ keepStyles: true });
        } else if (!runtimeState.featuresStarted) {
            startFeatures();
        } else {
            runFeatureRegistry('apply');
        }
        return { ok: true, importedSettings, importedStores };
    }

    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 8 * 1024 * 1024) {
                showNotification('Import failed. The selected backup is larger than 8 MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const result = applyBackupPayload(data);
                    if (!result.ok) throw new Error(result.reason);
                    closeSettings();
                    showNotification(`Imported ${result.importedSettings} settings and ${result.importedStores} local data stores.`, 'success');
                } catch (err) {
                    showNotification('Import failed. Choose a valid GLP Ultra JSON file.', 'error');
                }
            };
            reader.onerror = () => showNotification('Import failed. The selected file could not be read.', 'error');
            reader.readAsText(file);
        });
        input.click();
    }

    function showNotification(message, type = 'info', action = null) {
        let stack = document.querySelector('.glp-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'glp-toast-stack';
            stack.setAttribute('aria-live', 'polite');
            stack.setAttribute('aria-atomic', 'false');
            document.body.appendChild(stack);
        }

        const notification = document.createElement('div');
        notification.className = `glp-toast glp-toast-${type}`;
        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        if (action && action.label && typeof action.onClick === 'function') {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                action.onClick();
                notification.remove();
            });
            notification.appendChild(btn);
        }

        stack.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(6px)';
            notification.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            setTimeout(() => notification.remove(), 300);
        }, action ? 5500 : 3200);
    }

    // ============================================
    // TOGGLE BUTTON
    // ============================================
    function createToggleButton() {
        // Settings gear is now in the toolbar/nav bar, no floating button needed
    }

    // ============================================
    // APPLY STYLES
    // ============================================
    /**
     * Dark Reader inverts pages it does not recognise, and GLP Ultra is already a dark theme, so
     * the two stack: the palette's accents wash out and contrast drops below what the theme was
     * measured at. `<meta name="darkreader-lock">` is Dark Reader's own documented way for a page
     * to say it handles its own dark mode, and it is honoured live, not only at load.
     *
     * Removed again the moment GLP Ultra stops theming, so switching this off hands the page back
     * rather than leaving it light.
     */
    const DARK_READER_LOCK_ID = 'glp-darkreader-lock';

    function darkReaderPresent() {
        return document.documentElement.hasAttribute('data-darkreader-scheme')
            || document.documentElement.hasAttribute('data-darkreader-mode')
            || !!document.querySelector('style.darkreader, style[class*="darkreader"]');
    }

    function syncDarkReaderLock() {
        const wanted = settings.enabled && settings.overrideDarkReader;
        const existing = document.getElementById(DARK_READER_LOCK_ID);
        if (!wanted) {
            existing?.remove();
            return;
        }
        if (existing) return;
        const meta = document.createElement('meta');
        meta.id = DARK_READER_LOCK_ID;
        meta.name = 'darkreader-lock';
        (document.head || document.documentElement).appendChild(meta);
    }

    function applyStyles() {
        let styleEl = ownedElement('glp-enhanced-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            ownSurface(styleEl, 'glp-enhanced-styles');
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = generateCSS();
        syncDarkReaderLock();
    }

    function destroyEnhancedUI({ keepSettingsPanel = false, keepStyles = false } = {}) {
        runtimeState.featuresStarted = false;
        if (!keepStyles) document.getElementById(DARK_READER_LOCK_ID)?.remove();
        destroyRegisteredFeatures();

        if (runtimeState.observer) {
            runtimeState.observer.disconnect();
            runtimeState.observer = null;
        }

        if (runtimeState.contextHandler) {
            document.removeEventListener('contextmenu', runtimeState.contextHandler, true);
            runtimeState.contextHandler = null;
        }
        runtimeState.contextBound = false;
        runtimeState.lastContext = null;

        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }

        if (watcherTimer) {
            clearInterval(watcherTimer);
            watcherTimer = null;
        }

        if (previewTimeout) {
            clearTimeout(previewTimeout);
            previewTimeout = null;
        }

        if (!keepStyles) {
            removeOwnedElement('glp-enhanced-styles');
        }

        const removableSelectors = [
            '#glp-back-to-top',
            '#glp-lightbox',
            '#glp-infinite-loader',
            '#glp-scroll-progress',
            '#glp-auto-refresh-bar',
            '#glp-hidden-threads-bar',
            '#glp-tag-picker',
            '#glp-thread-tools-bar',
            '#glp-quick-search',
            '#glp-forum-toolbar',
            '#glp-media-preview',
            '#glp-watch-digest',
            '#glp-diagnostics',
            '#glp-recovery',
            '.glp-thread-preview',
            '.glp-op-nav',
            '.glp-copied-toast',
            '.glp-toast-stack',
            '.glp-forum-link',
            '.glp-nav-gear',
            '.glp-hide-col',
            '.glp-mute-btn',
            '.glp-tag-btn',
            '.glp-user-tag',
            '.glp-post-number',
            '.glp-user-rep',
            '.glp-collapse-indicator',
            '.glp-yt-embed',
            '.glp-reader-byline',
            '.glp-quote-depth',
            '.glp-backlinks',
            '.glp-media-actions',
            '#glp-noise-chip',
            '#glp-noise-panel',
            '.glp-quote-jump',
            '#glp-backlink-card',
            '.glp-nested-toggle',
            '.glp-block-btn',
            '.glp-sort-group'
        ];

        if (!keepSettingsPanel) {
            removableSelectors.push('#glp-enhanced-overlay');
        }

        document.querySelectorAll(removableSelectors.join(',')).forEach(node => node.remove());

        document.querySelectorAll('[class*="glp-"]').forEach(node => {
            if (keepSettingsPanel && node.closest('#glp-enhanced-overlay')) return;
            Array.from(node.classList).forEach(cls => {
                if (cls.startsWith('glp-')) node.classList.remove(cls);
            });
        });

        document.querySelectorAll('[data-glp-highlighted], [data-glp-collapsible], [data-glp-yt], [data-glp-nested-processed]').forEach(node => {
            delete node.dataset.glpHighlighted;
            delete node.dataset.glpCollapsible;
            delete node.dataset.glpYt;
            delete node.dataset.glpNestedProcessed;
        });

        document.body?.classList.remove('glp-enhanced-active', 'glpx-enabled', 'glpx-reader-active');
    }

    function recordFeatureError(id, stage, error) {
        const entry = { id, stage, message: error && error.message ? error.message : String(error) };
        runtimeState.featureErrors.push(entry);
        if (runtimeState.featureErrors.length > 20) runtimeState.featureErrors.shift();
        console.warn(`[GLP Ultra] feature "${id}" failed during ${stage}:`, error);
    }

    function routeAllowsFeature(feature) {
        const routes = feature.routes || ['all'];
        return routes.includes('all') || routes.includes(runtimeState.route);
    }

    function settingAllowsFeature(feature) {
        return !feature.settingKey || settings[feature.settingKey] !== false;
    }

    function getFeatureRegistry() {
        return [
            { id: 'dom.cleanup', routes: ['all'], fragment: true, init: applyDOMModifications, apply: applyDOMModifications, destroy: destroyDOMModifications },
            { id: 'nav.threadForumLink', routes: ['thread'], init: injectForumLink, apply: injectForumLink, destroy: () => document.querySelectorAll('.glp-forum-link, .glp-nav-gear').forEach(node => node.remove()) },
            { id: 'nav.forumToolbar', routes: ['feed', 'generic'], init: injectForumToolbar, apply: injectForumToolbar, destroy: () => removeOwnedElement('glp-forum-toolbar') },
            { id: 'ui.backToTop', routes: ['all'], settingKey: 'backToTopButton', init: initBackToTop, apply: initBackToTop, destroy: () => removeOwnedElement('glp-back-to-top') },
            { id: 'media.lightbox', routes: ['thread'], settingKey: 'imageLightbox', init: initGalleryLightbox, apply: initGalleryLightbox, destroy: destroyGalleryLightbox },
            { id: 'ui.noiseBudget', routes: ['thread', 'feed'], settingKey: 'noiseBudget', init: renderNoiseBudget, apply: renderNoiseBudget, destroy: destroyNoiseBudget },
            { id: 'media.actions', routes: ['thread'], settingKey: 'mediaActions', init: initMediaActions, apply: initMediaActions, destroy: destroyMediaActions },
            { id: 'thread.collapsiblePosts', routes: ['thread'], settingKey: 'collapsiblePosts', fragment: true, init: initCollapsiblePosts, apply: initCollapsiblePosts, destroy: () => { document.querySelectorAll('.glp-collapse-indicator').forEach(node => node.remove()); document.querySelectorAll('[data-glp-collapsible]').forEach(node => { delete node.dataset.glpCollapsible; node.closest('tr')?.classList.remove('glp-collapsed'); }); } },
            { id: 'feed.infiniteScroll', routes: ['feed'], settingKey: 'infiniteScroll', init: initInfiniteScroll, apply: initInfiniteScroll, destroy: () => removeOwnedElement('glp-infinite-loader') },
            { id: 'thread.infiniteScroll', routes: ['thread'], settingKey: 'infiniteThreadScroll', init: initInfiniteThreadScroll, apply: initInfiniteThreadScroll, destroy: () => removeOwnedElement('glp-infinite-loader') },
            { id: 'thread.highlightOPPosts', routes: ['thread'], settingKey: 'highlightOPPosts', fragment: true, init: highlightOPPosts, apply: highlightOPPosts, destroy: () => document.querySelectorAll('.glp-op-post').forEach(node => node.classList.remove('glp-op-post')) },
            { id: 'thread.highlightOPBadges', routes: ['thread'], settingKey: 'highlightOP', init: highlightOPBadges, apply: highlightOPBadges, destroy: () => document.querySelectorAll('.glp-op-badge').forEach(node => node.classList.remove('glp-op-badge')) },
            { id: 'thread.postNumbers', routes: ['thread'], settingKey: 'inlinePostNumbers', fragment: true, init: addPostNumbers, apply: addPostNumbers, destroy: () => document.querySelectorAll('.glp-post-number').forEach(node => node.remove()) },
            { id: 'time.relative', routes: ['all'], settingKey: 'relativeTimestamps', fragment: true, init: convertTimestamps, apply: convertTimestamps, destroy: destroyRelativeTimestamps },
            { id: 'feed.hotBadges', routes: ['feed'], settingKey: 'hotThreadBadge', fragment: true, init: applyHotThreadBadges, apply: applyHotThreadBadges, destroy: destroyHotThreadBadges },
            { id: 'feed.freshness', routes: ['feed'], settingKey: 'freshnessColors', fragment: true, init: applyFreshnessColors, apply: applyFreshnessColors, destroy: destroyFreshnessColors },
            { id: 'users.muteButtons', routes: ['all'], settingKey: 'userMuteList', fragment: true, init: initMuteButtons, apply: initMuteButtons, destroy: () => { document.querySelectorAll('.glp-mute-btn').forEach(node => node.remove()); document.querySelectorAll('.glp-muted-post').forEach(node => node.classList.remove('glp-muted-post')); } },
            { id: 'users.blockButtons', routes: ['thread'], settingKey: 'userBlockList', fragment: true, init: initUserBlockButtons, apply: initUserBlockButtons, destroy: () => { document.querySelectorAll('.glp-block-btn').forEach(node => node.remove()); document.querySelectorAll('.glp-user-blocked').forEach(node => node.classList.remove('glp-user-blocked')); } },
            { id: 'thread.memeFilter', routes: ['thread'], settingKey: 'hideMemeReplies', fragment: true, init: applyMemeFilter, apply: applyMemeFilter, destroy: clearMemeFilter },
            { id: 'feed.pinnedVisibility', routes: ['feed'], fragment: true, init: applyPinnedVisibility, apply: applyPinnedVisibility, destroy: clearPinnedVisibility },
            { id: 'feed.hideThreads', routes: ['feed'], settingKey: 'hideThreadButtons', fragment: true, init: initHideThreadButtons, apply: initHideThreadButtons, destroy: destroyHiddenThreads },
            { id: 'feed.keywordFilters', routes: ['feed'], fragment: true, init: applyKeywordFilters, apply: applyKeywordFilters, destroy: clearKeywordFilters },
            { id: 'feed.autoRefresh', routes: ['feed'], settingKey: 'autoRefresh', init: initAutoRefresh, apply: initAutoRefresh, destroy: () => { if (refreshTimer) clearInterval(refreshTimer); refreshTimer = null; refreshBar = null; removeOwnedElement('glp-auto-refresh-bar'); } },
            { id: 'users.tags', routes: ['thread', 'feed'], settingKey: 'userTags', init: initUserTags, apply: initUserTags, destroy: () => document.querySelectorAll('.glp-user-tag, .glp-tag-btn, #glp-tag-picker').forEach(node => node.remove()) },
            { id: 'thread.scrollProgress', routes: ['thread'], settingKey: 'scrollProgress', init: initScrollProgress, apply: initScrollProgress, destroy: () => removeOwnedElement('glp-scroll-progress') },
            { id: 'feed.threadPreview', routes: ['feed'], settingKey: 'threadPreview', init: initThreadPreview, apply: initThreadPreview, destroy: destroyThreadPreview },
            { id: 'thread.readerMode', routes: ['thread'], settingKey: 'readerMode', fragment: true, init: initReaderMode, apply: initReaderMode, destroy: destroyReaderMode },
            { id: 'thread.quoteDepthBadges', routes: ['thread'], settingKey: 'quoteDepthBadges', fragment: true, init: initQuoteDepthBadges, apply: initQuoteDepthBadges, destroy: () => document.querySelectorAll('.glp-quote-depth').forEach(n => n.remove()) },
            { id: 'thread.quoteGraph', routes: ['thread'], settingKey: 'quoteBacklinks', fragment: true, init: buildQuoteGraph, apply: buildQuoteGraph, destroy: destroyQuoteGraph },
            { id: 'thread.nestedQuoteCollapse', routes: ['thread'], settingKey: 'collapseNestedQuotes', fragment: true, init: initNestedQuoteCollapse, apply: initNestedQuoteCollapse, destroy: () => { document.querySelectorAll('.glp-nested-toggle').forEach(n => n.remove()); document.querySelectorAll('.glp-nested-collapsed').forEach(n => { n.classList.remove('glp-nested-collapsed', 'glp-nested-expanded'); delete n.dataset.glpNestedProcessed; }); } },
            { id: 'thread.permalinks', routes: ['thread'], settingKey: 'postPermalinks', fragment: true, init: initPostPermalinks, apply: initPostPermalinks, destroy: destroyPostPermalinks },
            { id: 'media.youtube', routes: ['thread'], settingKey: 'youtubeEmbed', fragment: true, init: embedYouTubeLinks, apply: embedYouTubeLinks, destroy: () => document.querySelectorAll('.glp-yt-embed').forEach(node => node.remove()) },
            { id: 'thread.opNav', routes: ['thread'], settingKey: 'opPostNav', init: initOPPostNav, apply: initOPPostNav, destroy: () => document.querySelectorAll('.glp-op-nav').forEach(node => node.remove()) },
            { id: 'thread.collapseAll', routes: ['thread'], settingKey: 'collapseExpandAll', init: initCollapseExpandAll, apply: initCollapseExpandAll, destroy: () => document.querySelectorAll('[data-glp-thread-tool="collapse-all"], [data-glp-thread-tool="expand-all"], [data-glp-thread-tool="collapse-quotes"], [data-glp-thread-tool="search"]').forEach(node => node.remove()) },
            { id: 'thread.quickSearch', routes: ['thread'], settingKey: 'threadQuickSearch', init: initQuickSearch, apply: initQuickSearch, destroy: () => removeOwnedElement('glp-quick-search') },
            { id: 'thread.watcher', routes: ['thread', 'feed'], settingKey: 'watcherEnabled', init: initWatcher, apply: initWatcher, destroy: destroyWatcher },
            { id: 'users.reputation', routes: ['thread'], settingKey: 'userReputationOverlay', init: applyReputationOverlay, apply: applyReputationOverlay, destroy: destroyReputationOverlay },
            { id: 'thread.export', routes: ['thread'], init: initThreadExport, apply: initThreadExport, destroy: destroyThreadExport },
            // X normalization runs first: a rendered widget only carries its provenance
            // until privacy mode swaps the iframe out for a placeholder.
            { id: 'media.xEmbeds', routes: ['thread'], settingKey: 'mediaXEmbeds', fragment: true, init: normalizeXEmbeds, apply: normalizeXEmbeds, destroy: destroyXEmbeds },
            { id: 'media.privacy', routes: ['thread'], settingKey: 'mediaPrivacyMode', fragment: true, init: applyMediaPrivacy, apply: applyMediaPrivacy, destroy: destroyMediaPrivacy },
            { id: 'media.hoverPreview', routes: ['thread'], settingKey: 'mediaHoverPreview', init: initMediaHoverPreview, apply: initMediaHoverPreview, destroy: destroyMediaHoverPreview }
        ];
    }

    function runFeatureRegistry(stage = 'init', root = document) {
        const roots = Array.isArray(root) ? mutationRoots(root) : [featureScope(root)];
        roots.forEach(scope => {
            const ctx = { route: runtimeState.route, settings, selectors: SELECTOR_REGISTRY, root: scope };
            getFeatureRegistry().forEach(feature => {
            const routeOk = routeAllowsFeature(feature);
            if (!routeOk) return;
            if (stage === 'apply' && scope !== document && !feature.fragment) return;

            // One failing feature must never take the rest of the page down with it.
            try {
                if (!settingAllowsFeature(feature)) {
                    // A feature switched off in the panel must undo itself, not linger in the DOM.
                    if (stage === 'apply') {
                        clearFeatureResources(feature.id);
                        if (typeof feature.destroy === 'function') feature.destroy(ctx);
                    }
                    return;
                }
                const runner = feature[stage] || feature.init;
                if (typeof runner === 'function') {
                    const startedAt = performance.now();
                    const previousFeatureId = runtimeState.activeFeatureId;
                    runtimeState.activeFeatureId = feature.id;
                    try {
                        runner(scope, ctx);
                    } finally {
                        runtimeState.activeFeatureId = previousFeatureId;
                    }
                    recordFeatureTiming(feature.id, stage, performance.now() - startedAt);
                }
            } catch (error) {
                recordFeatureError(feature.id, stage, error);
            }
            });
        });
    }

    /**
     * Keeps the slowest observed run per feature and stage. Cumulative totals would just grow
     * with page age; the worst single run is what a user feels.
     */
    function recordFeatureTiming(id, stage, ms) {
        const key = `${id}:${stage}`;
        const previous = runtimeState.featureTimings[key];
        if (!previous) {
            runtimeState.featureTimings[key] = { id, stage, runs: 1, worstMs: ms, lastMs: ms };
            return;
        }
        previous.runs += 1;
        previous.lastMs = ms;
        if (ms > previous.worstMs) previous.worstMs = ms;
    }

    function destroyRegisteredFeatures() {
        getFeatureRegistry().forEach(feature => {
            clearFeatureResources(feature.id);
            if (typeof feature.destroy !== 'function') return;
            try {
                feature.destroy({ route: runtimeState.route, settings });
            } catch (error) {
                recordFeatureError(feature.id, 'destroy', error);
            }
        });
    }

    // ============================================
    // DOM MODIFICATIONS
    // ============================================
    function applyDOMModifications(root = document) {
        const scope = featureScope(root);
        // Everything else the noise budget reports can be counted off the live DOM. A removed ad
        // leaves nothing behind, so it has to be counted at the moment it goes.
        const removeAndCount = (nodes) => {
            nodes.forEach(el => el.remove());
            runtimeState.adsRemoved += nodes.length;
        };

        if (settings.removeAds || settings.removeWidgets) {
            removeAndCount([...scope.querySelectorAll(
                '[data-type="_mgwidget"], [id^="mgid"], iframe[src*="mgid"], div[id*="ScriptRoot"]'
            )]);
        }

        if (settings.removeAmpEmbeds) {
            removeAndCount([...scope.querySelectorAll('amp-embed')]);
        }

        if (settings.hideInlineReplyAds) {
            removeAndCount([...scope.querySelectorAll('.post_main > div[style*="float"]')].filter(div =>
                div.querySelector('[data-type="_mgwidget"], amp-embed') ||
                div.innerHTML.includes('replies inline')));
        }

        // Pulling an ad out leaves a row holding nothing but whitespace, which still reserves its
        // height - that was the ~90px dead band under the thread title. `:empty` does not match a
        // node containing whitespace, so this has to be done here rather than in CSS.
        if (settings.removeAds || settings.removeWidgets) {
            scope.querySelectorAll('.msg tbody > tr, .threads tbody > tr').forEach(row => {
                if (row.id || row.querySelector('img, iframe, input, button, a, .post_main')) return;
                if (row.textContent.trim()) return;
                row.classList.add('glp-empty-row');
            });
        }

        if (settings.autoExpandImages) {
            scope.querySelectorAll('.post_main img').forEach(img => {
                if (img.style.maxWidth) {
                    if (!img.dataset.glpAutoExpanded) {
                        img.dataset.glpOriginalMaxWidth = img.style.maxWidth;
                        img.dataset.glpOriginalCursor = img.style.cursor;
                    }
                    img.style.maxWidth = 'none';
                    img.style.cursor = 'pointer';
                    img.dataset.glpAutoExpanded = '1';
                }
            });
        }
    }

    function destroyDOMModifications() {
        document.querySelectorAll('.glp-empty-row').forEach(row => row.classList.remove('glp-empty-row'));
        document.querySelectorAll('[data-glp-auto-expanded]').forEach(img => {
            img.style.maxWidth = img.dataset.glpOriginalMaxWidth || '';
            img.style.cursor = img.dataset.glpOriginalCursor || '';
            delete img.dataset.glpAutoExpanded;
            delete img.dataset.glpOriginalMaxWidth;
            delete img.dataset.glpOriginalCursor;
        });
    }

    // ============================================
    // BACK TO TOP BUTTON
    // ============================================
    function initBackToTop() {
        if (!settings.backToTopButton) return;
        // Re-entry guard: this doubles as the `apply` handler, so a second call must not stack
        // another button and another scroll listener on top of the first.
        if (ownedElement('glp-back-to-top')) return;

        const btn = markFeatureOwned(document.createElement('button'));
        ownSurface(btn, 'glp-back-to-top');
        btn.title = 'Back to top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.textContent = 'Up';
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(btn);

        let ticking = false;
        addFeatureEventListener(window, 'scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true }, 'scroll');
    }

    // ============================================
    // READER MODE (distraction-free thread reading)
    // ============================================
    function initReaderMode(root = document) {
        const scope = featureScope(root);
        if (!settings.readerMode) return;
        if (!scope.querySelector('.msg')) return;

        document.body.classList.add('glpx-reader-active');

        // Add author byline above each post content when author cell is hidden
        scope.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            if (tr.querySelector('.glp-reader-byline')) return;
            const authorCell = tr.querySelector('.messageauthor, .replyauthor');
            const contentCell = tr.querySelector('.messagecontent, .replycontent');
            if (!authorCell || !contentCell) return;

            const nameEl = authorCell.querySelector('.author_header b a') || authorCell.querySelector('.author_header b') || authorCell.querySelector('.author_header');
            const dateEl = authorCell.querySelector('.author_date');
            const name = nameEl ? nameEl.textContent.replace(/\(OP\)/g, '').trim() : 'Anonymous';
            const date = dateEl ? dateEl.title || dateEl.textContent.trim() : '';

            const byline = document.createElement('span');
            byline.className = 'glp-reader-byline';
            byline.textContent = date ? `${name} · ${date}` : name;

            const postHdr = contentCell.querySelector('.post_hdr');
            if (postHdr) {
                postHdr.insertBefore(byline, postHdr.firstChild);
            } else {
                const wrap = contentCell.querySelector('.post_wrap');
                if (wrap) wrap.insertBefore(byline, wrap.firstChild);
            }
        });
    }

    function destroyReaderMode() {
        document.body.classList.remove('glpx-reader-active');
        document.querySelectorAll('.glp-reader-byline').forEach(el => el.remove());
    }

    // ============================================
    // QUOTE DEPTH BADGES AND NESTED COLLAPSE
    // ============================================
    function computeQuoteDepth(quoteEl) {
        let depth = 0;
        let el = quoteEl;
        while (el) {
            el = el.parentElement?.closest('.quoteo');
            if (el) depth++;
        }
        return depth;
    }

    function initQuoteDepthBadges(root = document) {
        if (!settings.quoteDepthBadges) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.quoteo').forEach(quote => {
            if (quote.querySelector('.glp-quote-depth')) return;
            const depth = computeQuoteDepth(quote);
            if (depth > 0) {
                const badge = document.createElement('span');
                badge.className = 'glp-quote-depth';
                badge.textContent = `Q${depth + 1}`;
                badge.title = `Quote depth: ${depth + 1}`;
                // Insert at start of the quote's first text/element
                const firstFontTag = quote.querySelector('font[size="1"]');
                if (firstFontTag) {
                    firstFontTag.insertBefore(badge, firstFontTag.firstChild);
                } else {
                    quote.insertBefore(badge, quote.firstChild);
                }
            }
        });
    }

    // ============================================
    // QUOTE GRAPH (backlinks)
    // ============================================

    /**
     * GLP marks every post with its own `reply<id>` permalink and every quote block with a
     * "Quoting:" footer carrying the quoted author and a link to the post being quoted. That is
     * enough to reconstruct who answered whom on this page — forward, which the site already
     * offers, and *backward*, which it does not: a post has no idea it was quoted.
     */
    function postReplyId(row) {
        const link = row.querySelector('a.sm_postn[href*="/reply"], a[href*="/reply"][title^="Post #"]');
        return (link?.getAttribute('href') || '').match(/reply(\d+)/)?.[1] || '';
    }

    function postNumberOf(row) {
        return (row.id || '').replace('post_', '');
    }

    function postAuthorOf(row) {
        const header = row.querySelector('.author_header');
        const link = header?.querySelector('b a') || header?.querySelector('a');
        return link ? link.textContent.trim() : 'Anonymous Coward';
    }

    function postExcerpt(row, limit = 180) {
        const body = row.querySelector('.post_main');
        if (!body) return '';
        const clone = body.cloneNode(true);
        clone.querySelectorAll('.quoteo, .glp-backlinks, .glp-quote-jump, .glp-quote-depth').forEach(node => node.remove());
        const text = clone.textContent.replace(/\s+/g, ' ').trim();
        return text.length > limit ? `${text.slice(0, limit)}...` : text;
    }

    function buildQuoteGraph(root = document) {
        if (!settings.quoteBacklinks) return;
        const scope = featureScope(root);

        const rows = [...scope.querySelectorAll('.msg tr[id^="post_"]')];
        if (!rows.length) return;

        const byReplyId = new Map();
        rows.forEach(row => {
            const id = postReplyId(row);
            if (id) byReplyId.set(id, row);
        });

        // replyId of the quoted post -> the rows that quoted it, in page order.
        const backlinks = new Map();

        rows.forEach(row => {
            row.querySelectorAll('.quoteo').forEach(quote => {
                const footer = quote.querySelector(':scope > font[size="1"]');
                const target = footer?.querySelector('a[href*="/reply"]');
                const quotedId = (target?.getAttribute('href') || '').match(/reply(\d+)/)?.[1] || '';
                if (!quotedId) return;

                const quotedRow = byReplyId.get(quotedId);
                if (!quotedRow || quotedRow === row) return;

                if (!backlinks.has(quotedId)) backlinks.set(quotedId, []);
                if (!backlinks.get(quotedId).includes(row)) backlinks.get(quotedId).push(row);

                // Forward jump: the site's own link leaves the page even when the quoted post is
                // right here, so offer an in-page hop beside it.
                if (!footer.querySelector('.glp-quote-jump')) {
                    const jump = document.createElement('button');
                    jump.type = 'button';
                    jump.className = 'glp-quote-jump';
                    jump.dataset.glpJumpTo = quotedRow.id;
                    jump.textContent = `#${postNumberOf(quotedRow)}`;
                    jump.title = `Jump to post #${postNumberOf(quotedRow)} on this page`;
                    footer.appendChild(jump);
                }
            });
        });

        backlinks.forEach((quotingRows, quotedId) => {
            const row = byReplyId.get(quotedId);
            if (!row) return;

            const body = row.querySelector('.post_main');
            if (!body) return;

            row.querySelector(':scope .glp-backlinks')?.remove();

            const bar = document.createElement('div');
            bar.className = 'glp-backlinks';
            const label = document.createElement('span');
            label.className = 'glp-backlinks-label';
            label.textContent = quotingRows.length === 1 ? 'Answered by' : `Answered by ${quotingRows.length}`;
            bar.appendChild(label);

            quotingRows.forEach(quoting => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'glp-backlink';
                chip.dataset.glpJumpTo = quoting.id;
                chip.dataset.glpExcerpt = postExcerpt(quoting);
                chip.textContent = `#${postNumberOf(quoting)} ${postAuthorOf(quoting)}`;
                bar.appendChild(chip);
            });

            body.appendChild(bar);
        });

        bindQuoteGraphEvents();
    }

    function bindQuoteGraphEvents() {
        if (runtimeState.quoteGraphBound) return;
        runtimeState.quoteGraphBound = true;

        addFeatureEventListener(document, 'click', event => {
            const jump = event.target.closest('[data-glp-jump-to]');
            if (!jump) return;
            event.preventDefault();
            const target = document.getElementById(jump.dataset.glpJumpTo);
            if (!target) return;
            target.scrollIntoView({ behavior: settings.smoothScrolling ? 'smooth' : 'auto', block: 'center' });
            target.classList.add('glp-post-flash');
            window.setTimeout(() => target.classList.remove('glp-post-flash'), 1600);
        }, undefined, 'jump');

        // Context card: reading who answered you should not cost a scroll.
        addFeatureEventListener(document, 'mouseover', event => {
            const chip = event.target.closest('.glp-backlink');
            if (!chip || !chip.dataset.glpExcerpt) return;
            showBacklinkCard(chip);
        }, undefined, 'hover-in');
        addFeatureEventListener(document, 'mouseout', event => {
            if (event.target.closest('.glp-backlink')) hideBacklinkCard();
        }, undefined, 'hover-out');
    }

    function showBacklinkCard(chip) {
        let card = ownedElement('glp-backlink-card');
        if (!card) {
            card = document.createElement('div');
            ownSurface(card, 'glp-backlink-card');
            document.body.appendChild(card);
        }
        card.textContent = chip.dataset.glpExcerpt;
        const rect = chip.getBoundingClientRect();
        card.style.top = `${Math.max(8, rect.top + window.scrollY - card.offsetHeight - 8)}px`;
        card.style.left = `${Math.min(window.innerWidth - 340, rect.left + window.scrollX)}px`;
        card.classList.add('glp-backlink-card-visible');
    }

    function hideBacklinkCard() {
        ownedElement('glp-backlink-card')?.classList.remove('glp-backlink-card-visible');
    }

    function destroyQuoteGraph() {
        document.querySelectorAll('.glp-backlinks, .glp-quote-jump').forEach(node => node.remove());
        removeOwnedElement('glp-backlink-card');
        runtimeState.quoteGraphBound = false;
    }

    function initNestedQuoteCollapse(root = document) {
        if (!settings.collapseNestedQuotes) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.quoteo').forEach(quote => {
            if (quote.dataset.glpNestedProcessed) return;
            quote.dataset.glpNestedProcessed = '1';

            const depth = computeQuoteDepth(quote);
            if (depth >= (settings.collapseQuotesByDefault ? 0 : 2)) {
                quote.classList.add('glp-nested-collapsed');

                const toggle = document.createElement('span');
                toggle.className = 'glp-nested-toggle';
                toggle.textContent = `Show nested quote (depth ${depth + 1})`;
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = quote.classList.toggle('glp-nested-expanded');
                    toggle.textContent = isExpanded
                        ? `Hide nested quote (depth ${depth + 1})`
                        : `Show nested quote (depth ${depth + 1})`;
                });
                quote.parentNode.insertBefore(toggle, quote);
            }
        });
    }

    // ============================================
    // OP POST HIGHLIGHTING (JS-based)
    // ============================================
    function highlightOPPosts(root = document) {
        if (!settings.highlightOPPosts) return;
        const scope = featureScope(root);

        const opPost = scope.querySelector('.msg tr[id="post_1"]') || document.querySelector('.msg tr[id="post_1"]');
        if (!opPost) return;

        const opClass = opPost.className.match(/post_member_(\d+)/);
        if (!opClass || opClass[1] === '0') return;

        const opMemberClass = `post_member_${opClass[1]}`;
        scope.querySelectorAll(`.msg tr.${opMemberClass}`).forEach(tr => {
            if (tr.id !== 'post_1') {
                tr.classList.add('glp-op-post');
            }
        });
    }

    // ============================================
    // INLINE POST NUMBERS
    // ============================================
    function addPostNumbers(root = document) {
        if (!settings.inlinePostNumbers) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const num = tr.id.replace('post_', '');
            const hdr = tr.querySelector('.post_hdr');
            if (hdr && !hdr.querySelector('.glp-post-number')) {
                const badge = document.createElement('span');
                badge.className = 'glp-post-number';
                badge.textContent = `#${num}`;
                hdr.insertBefore(badge, hdr.firstChild);
            }
        });
    }

    // ============================================
    // RELATIVE TIMESTAMPS
    // ============================================
    function convertTimestamps(root = document) {
        if (!settings.relativeTimestamps) return;
        const scope = featureScope(root);

        const now = new Date();

        function parseGLPTime(text) {
            text = text.trim();
            if (text.startsWith('today')) {
                const timePart = text.replace('today', '').trim();
                const dateStr = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()} ${timePart}`;
                return new Date(dateStr);
            }
            const match = text.match(/(\d{2})\/(\d{2})\/(\d{2})\s*(.*)/);
            if (match) {
                const year = 2000 + parseInt(match[3]);
                return new Date(`${match[1]}/${match[2]}/${year} ${match[4]}`);
            }
            return null;
        }

        function toRelative(date) {
            const diff = Math.floor((now - date) / 1000);
            if (diff < 60) return 'just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            if (diff < 172800) return 'yesterday';
            return `${Math.floor(diff / 86400)}d ago`;
        }

        // Thread list: .pfr and .mfr cells
        scope.querySelectorAll('.threads .pfr, .threads .mfr').forEach(td => {
            if (td.dataset.glpConverted) return;
            const original = td.textContent;
            const date = parseGLPTime(original.replace(/\n/g, ' '));
            if (date && !isNaN(date)) {
                td.dataset.glpOriginalText = original;
                if (td.hasAttribute('title')) td.dataset.glpOriginalTitle = td.getAttribute('title');
                td.textContent = toRelative(date);
                td.title = original.trim();
                td.dataset.glpConverted = '1';
            }
        });

        // Post author dates
        scope.querySelectorAll('.author_date').forEach(div => {
            if (div.dataset.glpConverted) return;
            const original = div.textContent;
            const date = parseGLPTime(original);
            if (date && !isNaN(date)) {
                div.dataset.glpOriginalText = original;
                if (div.hasAttribute('title')) div.dataset.glpOriginalTitle = div.getAttribute('title');
                div.textContent = toRelative(date);
                div.title = original.trim();
                div.dataset.glpConverted = '1';
            }
        });
    }

    function destroyRelativeTimestamps() {
        document.querySelectorAll('[data-glp-converted]').forEach(node => {
            if (Object.prototype.hasOwnProperty.call(node.dataset, 'glpOriginalText')) {
                node.textContent = node.dataset.glpOriginalText;
            }
            if (Object.prototype.hasOwnProperty.call(node.dataset, 'glpOriginalTitle')) {
                node.setAttribute('title', node.dataset.glpOriginalTitle);
            } else {
                node.removeAttribute('title');
            }
            delete node.dataset.glpConverted;
            delete node.dataset.glpOriginalText;
            delete node.dataset.glpOriginalTitle;
        });
    }

    // ============================================
    // HOT THREAD BADGE
    // ============================================
    function applyHotThreadBadges(root = document) {
        if (!settings.hotThreadBadge) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.threads .rfr').forEach(td => {
            if (td.dataset.glpBadged) return;
            const count = parseInt(td.textContent.replace(/,/g, ''));
            if (isNaN(count)) return;
            td.dataset.glpOriginalColor = td.style.color;
            if (count >= 100) {
                td.style.color = '#ff4444';
            } else if (count >= 50) {
                td.style.color = 'var(--glpx-warning)';
            } else if (count >= 20) {
                td.style.color = 'var(--glpx-accent)';
            }
            td.dataset.glpBadged = '1';
        });
    }

    function destroyHotThreadBadges() {
        document.querySelectorAll('[data-glp-badged]').forEach(node => {
            node.style.color = node.dataset.glpOriginalColor || '';
            delete node.dataset.glpBadged;
            delete node.dataset.glpOriginalColor;
        });
    }

    function destroyFreshnessColors() {
        document.querySelectorAll('[data-glp-freshness]').forEach(node => {
            node.classList.remove('glp-fresh-now', 'glp-fresh-recent', 'glp-fresh-stale');
            delete node.dataset.glpFreshness;
        });
    }


    // ============================================
    // COLLAPSIBLE POSTS
    // ============================================
    function initCollapsiblePosts(root = document) {
        if (!settings.collapsiblePosts) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const authorCell = tr.querySelector('.messageauthor, .replyauthor');
            if (!authorCell || authorCell.dataset.glpCollapsible) return;
            authorCell.dataset.glpCollapsible = '1';

            const indicator = document.createElement('span');
            indicator.className = 'glp-collapse-indicator';
            indicator.textContent = '[-]';
            const header = authorCell.querySelector('.author_header');
            if (header) header.appendChild(indicator);

            const onCollapseClick = (e) => {
                if (e.target.closest('a') || e.target.closest('.glp-mute-btn')) return;
                tr.classList.toggle('glp-collapsed');
                indicator.textContent = tr.classList.contains('glp-collapsed') ? '[+]' : '[-]';
            };
            addFeatureEventListener(authorCell, 'click', onCollapseClick, undefined, `collapse:${tr.id}`);
        });
    }

    // ============================================
    // INFINITE SCROLL (Forum thread list)
    // ============================================
    function initInfiniteScroll() {
        if (!settings.infiniteScroll) return;
        if (ownedElement('glp-infinite-loader')) return;

        const tbody = document.querySelector('.threads tbody');
        if (!tbody) return;

        const currentPageMatch = window.location.pathname.match(/\/pg(\d+)/);
        let nextPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 2;
        let loading = false;
        let exhausted = false;
        const basePath = window.location.pathname.replace(/\/pg\d+$/, '');

        const loader = document.createElement('div');
        ownSurface(loader, 'glp-infinite-loader');
        loader.textContent = 'Scroll for more...';
        const threadsWrapper = document.querySelector('.threads-wrapper') || tbody.closest('div');
        if (threadsWrapper) threadsWrapper.appendChild(loader);

        const loadNext = async () => {
            if (loading || exhausted) return;
            loading = true;
            loader.textContent = 'Loading';
            loader.classList.add('loading');

            try {
                const url = `${basePath}/pg${nextPage}${window.location.search}`;
                const html = await fetchTextQueued(url, { priority: 10 });
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const rows = doc.querySelectorAll('.threads tbody tr:not(.threads_header_row)');
                if (rows.length === 0) { exhausted = true; return; }

                rows.forEach(row => tbody.appendChild(document.importNode(row, true)));
                nextPage++;

                // Re-apply enhancements on new rows
                if (settings.hotThreadBadge) applyHotThreadBadges();
                if (settings.relativeTimestamps) convertTimestamps();
                if (settings.freshnessColors) applyFreshnessColors();
                if (settings.hideThreadButtons) initHideThreadButtons();
                if (settings.userMuteList) { initMuteButtons(); applyMuteList(); }
                if (settings.userTags) initUserTags();
                applyPinnedVisibility();
                applyDOMModifications();
            } catch (e) {
                exhausted = true;
            } finally {
                loading = false;
                loader.classList.remove('loading');
                loader.textContent = exhausted ? 'No more threads' : 'Scroll for more...';
            }
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadNext();
        }, { rootMargin: '400px' });
        observer.observe(loader);
        registerFeatureCleanup('intersection', () => observer.disconnect());
    }

    // ============================================
    // FRESHNESS COLORS
    // ============================================
    function applyFreshnessColors(root = document) {
        if (!settings.freshnessColors) return;
        const scope = featureScope(root);
        const now = new Date();

        scope.querySelectorAll('.threads .mfr').forEach(td => {
            if (td.dataset.glpFreshness) return;
            const text = td.title || td.textContent;
            let date = null;

            if (text.includes('ago')) {
                const m = text.match(/(\d+)([mhd])\s*ago/);
                if (m) {
                    const val = parseInt(m[1]);
                    const unit = m[2];
                    date = new Date(now);
                    if (unit === 'm') date.setMinutes(date.getMinutes() - val);
                    else if (unit === 'h') date.setHours(date.getHours() - val);
                    else if (unit === 'd') date.setDate(date.getDate() - val);
                }
            }
            if (text.includes('just now')) date = now;

            if (date) {
                const diffMin = (now - date) / 60000;
                if (diffMin < 15) td.classList.add('glp-fresh-now');
                else if (diffMin < 120) td.classList.add('glp-fresh-recent');
                else td.classList.add('glp-fresh-stale');
            }
            td.dataset.glpFreshness = '1';
        });
    }

    // ============================================
    // USER MUTE LIST
    // ============================================
    let mutedUsers = [];

    function loadMutedUsers() {
        const stored = readFeatureStore('glpMutedUsers', []);
        mutedUsers = sanitizeMutedUsers(stored) || [];
    }

    function saveMutedUsers() {
        writeFeatureStore('glpMutedUsers', mutedUsers);
    }

    function muteUser(username) {
        if (!username || mutedUsers.includes(username)) return;
        mutedUsers.push(username);
        saveMutedUsers();
        applyMuteList();
        showNotification(`Muted ${username}.`, 'warning');
    }

    function unmuteUser(username) {
        mutedUsers = mutedUsers.filter(u => u !== username);
        saveMutedUsers();
        applyMuteList();
        showNotification(`Unmuted ${username}.`, 'success');
    }

    // A muted entry can be an exact name, a fragment, or a pattern. Compiling once per
    // pass keeps regex mode from paying for a rebuild on every row.
    function buildMuteMatcher() {
        const mode = settings.userMuteMatchMode || 'exact';
        const entries = mutedUsers.map(name => String(name || '').trim()).filter(Boolean);

        if (mode === 'contains') {
            const needles = entries.map(entry => entry.toLowerCase());
            return name => {
                const haystack = name.toLowerCase();
                return needles.some(needle => haystack.includes(needle));
            };
        }

        if (mode === 'regex') {
            const patterns = [];
            entries.forEach(entry => {
                // A broken pattern must not silently mute nobody *and* not throw the feature away.
                try { patterns.push(new RegExp(entry, 'i')); } catch (error) { /* skipped */ }
            });
            return name => patterns.some(pattern => pattern.test(name));
        }

        const exact = new Set(entries);
        return name => exact.has(name);
    }

    function applyMuteList(root = document) {
        if (!settings.userMuteList) return;
        const scope = featureScope(root);
        // Not `mutedUsers.length === 0 -> return`: unmuting the last name has to run the pass
        // that takes the class back off, or those posts stay hidden until a reload.
        const isMuted = mutedUsers.length ? buildMuteMatcher() : () => false;

        // Thread list: hide rows by muted poster
        scope.querySelectorAll('.threads .hfr').forEach(td => {
            const name = td.textContent.trim();
            const row = td.closest('tr');
            if (row) row.classList.toggle('glp-muted-post', !!name && isMuted(name));
        });

        // Thread page: hide posts by muted user
        scope.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const name = postAuthorName(tr);
            if (name) tr.classList.toggle('glp-muted-post', isMuted(name));
        });

        renderNoiseBudget();
    }

    function postAuthorName(tr) {
        const authorLink = tr.querySelector('.author_header b a');
        if (authorLink) return authorLink.textContent.trim();
        const authorText = tr.querySelector('.author_header');
        return authorText ? authorText.textContent.replace(/\(OP\)/g, '').trim() : '';
    }

    // ============================================
    // LOCAL USER HISTORY AND TRUST OVERLAY
    // ============================================
    // Everything here is derived from pages this browser has already rendered. There is no
    // scoring service, no upload, and no attempt to identify anyone beyond the display name.
    let userStats = {};
    let userStatsPages = [];

    function loadUserStats() {
        const storedStats = readFeatureStore('glpUserStats', {});
        const storedPages = readFeatureStore('glpUserStatsPages', []);
        userStats = sanitizeUserStats(storedStats) || {};
        userStatsPages = sanitizeUserStatsPages(storedPages) || [];
    }

    function saveUserStats() {
        const cap = Math.min(STORE_LIMITS.userStats, Math.max(50, Number(settings.userHistoryCap) || 400));
        const names = Object.keys(userStats);
        if (names.length > cap) {
            // Drop the least recently seen posters first; the overlay is about people you keep meeting.
            names
                .sort((a, b) => (userStats[a].last || 0) - (userStats[b].last || 0))
                .slice(0, names.length - cap)
                .forEach(name => delete userStats[name]);
        }
        writeFeatureStore('glpUserStats', userStats);
        writeFeatureStore('glpUserStatsPages', userStatsPages.slice(-STORE_LIMITS.userStatsPages));
    }

    function clearUserHistory() {
        userStats = {};
        userStatsPages = [];
        writeFeatureStore('glpUserStats', {});
        writeFeatureStore('glpUserStatsPages', []);
        document.querySelectorAll('.glp-user-rep').forEach(node => node.remove());
    }

    function recordUserHistory() {
        const pageKey = window.location.pathname;
        if (userStatsPages.includes(pageKey)) return;

        const threadId = (pageKey.match(/message(\d+)/) || [])[1] || pageKey;
        const now = Date.now();
        let touched = false;

        document.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const name = postAuthorName(tr);
            if (!name || name === 'Anonymous Coward') return;
            const entry = userStats[name] || { posts: 0, threads: [], first: now, last: now };
            entry.posts += 1;
            entry.last = now;
            if (!entry.threads.includes(threadId)) entry.threads.push(threadId);
            if (entry.threads.length > STORE_LIMITS.userStatsThreads) entry.threads = entry.threads.slice(-STORE_LIMITS.userStatsThreads);
            userStats[name] = entry;
            touched = true;
        });

        if (!touched) return;
        userStatsPages.push(pageKey);
        saveUserStats();
    }

    function reputationLabel(entry) {
        if (entry.posts >= 50) return 'familiar';
        if (entry.posts >= 12) return 'recurring';
        if (entry.posts >= 3) return 'seen before';
        return 'new to you';
    }

    function applyReputationOverlay() {
        if (!settings.userReputationOverlay) return;
        loadUserStats();
        recordUserHistory();

        document.querySelectorAll('.msg tr[id^="post_"] .author_header').forEach(header => {
            const name = postAuthorName(header.closest('tr'));
            const entry = name ? userStats[name] : null;
            const existing = header.querySelector('.glp-user-rep');
            if (!entry) {
                existing?.remove();
                return;
            }

            const badge = existing || document.createElement('span');
            badge.className = 'glp-user-rep';
            markFeatureOwned(badge, 'users.reputation');
            badge.textContent = `${entry.posts} seen`;
            badge.title = [
                `${reputationLabel(entry)} - ${entry.posts} posts seen locally`,
                `${entry.threads.length} thread${entry.threads.length === 1 ? '' : 's'}`,
                `first seen ${new Date(entry.first).toLocaleDateString()}`
            ].join('\n');
            if (!existing) header.appendChild(badge);
        });
    }

    function destroyReputationOverlay() {
        document.querySelectorAll('.glp-user-rep').forEach(node => node.remove());
    }

    function initMuteButtons(root = document) {
        if (!settings.userMuteList) return;
        loadMutedUsers();
        const scope = featureScope(root);

        scope.querySelectorAll('.msg tr[id^="post_"] .author_header, .threads .hfr').forEach(el => {
            if (el.querySelector('.glp-mute-btn')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'glp-mute-btn';
            btn.textContent = 'Mute';
            btn.title = 'Mute this user';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const link = el.querySelector('b a') || el.querySelector('a');
                const name = link ? link.textContent.trim() : el.textContent.replace(/Mute|\(OP\)/g, '').trim();
                if (name && name !== 'Anonymous Coward') muteUser(name);
            });
            el.appendChild(btn);
        });

        applyMuteList(scope);
    }

    // ============================================
    // USER BLOCK LIST (numeric user id)
    // ============================================
    let blockedUsers = [];

    function loadBlockedUsers() {
        const parsed = readFeatureStore('glpBlockedUsers', []);
        blockedUsers = sanitizeBlockedUsers(parsed) || [];
    }

    function saveBlockedUsers() {
        writeFeatureStore('glpBlockedUsers', blockedUsers);
    }

    function isUserBlocked(userId) {
        return blockedUsers.some(entry => entry.id === String(userId));
    }

    function blockUser(userId, userName) {
        const id = String(userId || '').trim();
        if (!id || isUserBlocked(id)) return;
        const name = (userName || '').trim() || `User ${id}`;
        blockedUsers.push({ id, name });
        saveBlockedUsers();
        applyUserBlocks();
        showNotification(`Blocked ${name}.`, 'warning', {
            label: 'Undo',
            onClick: () => unblockUser(id)
        });
    }

    function unblockUser(userId) {
        const id = String(userId);
        const entry = blockedUsers.find(u => u.id === id);
        blockedUsers = blockedUsers.filter(u => u.id !== id);
        saveBlockedUsers();
        applyUserBlocks();
        showNotification(`Unblocked ${entry ? entry.name : id}.`, 'success');
    }

    function applyUserBlocks(root = document) {
        const scope = featureScope(root);
        scope.querySelectorAll('tr[class*="post_uid_"]').forEach(tr => {
            const match = tr.className.match(/post_uid_(\d+)/);
            const blocked = !!(settings.userBlockList && match && isUserBlocked(match[1]));
            tr.classList.toggle('glp-user-blocked', blocked);
        });

        renderNoiseBudget();
    }

    function initUserBlockButtons(root = document) {
        if (!settings.userBlockList) return;
        loadBlockedUsers();

        const scope = featureScope(root);
        scope.querySelectorAll('td.messageauthor, td.replyauthor').forEach(cell => {
            if (cell.querySelector('.glp-block-btn')) return;
            const row = cell.closest('tr');
            const match = row && row.className ? row.className.match(/post_uid_(\d+)/) : null;
            if (!match) return;

            const userId = match[1];
            const header = cell.querySelector('.author_header');
            const link = header ? header.querySelector('b a, a') : null;
            const userName = link
                ? link.textContent.trim()
                : (header ? header.textContent.replace(/\(OP\)|Mute|Block/g, '').trim() : `User ${userId}`);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'glp-block-btn';
            btn.textContent = 'Block';
            btn.title = `Block user ${userId}`;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                blockUser(userId, userName);
            });
            cell.appendChild(btn);
        });

        applyUserBlocks(scope);
    }

    function getBlockListHTML() {
        if (blockedUsers.length === 0) {
            return '<div class="glp-empty-state">No blocked users yet. Use the Block button on any post author.</div>';
        }
        return blockedUsers.map(u => `
            <div class="glp-mute-manage-item">
                <span>${escapeHTML(u.name)} <em>#${escapeHTML(u.id)}</em></span>
                <button data-unblock="${escapeAttribute(u.id)}">Unblock</button>
            </div>
        `).join('');
    }

    // ============================================
    // CONTENT FILTERS (low-effort replies, reaction GIFs)
    // ============================================
    function applyMemeFilter(root = document) {
        const scope = featureScope(root);
        if (!settings.hideMemeReplies) {
            scope.querySelectorAll('.glp-meme-hidden').forEach(tr => tr.classList.remove('glp-meme-hidden'));
            return;
        }

        scope.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const body = tr.querySelector('.post_main');
            if (!body) return;

            const clone = body.cloneNode(true);
            clone.querySelectorAll('.quoteo, .quotei, .sig1, .sig2, font[size="1"], .glp-post-number, .glp-quote-depth').forEach(node => node.remove());

            const mediaCount = clone.querySelectorAll('img:not([src*="/sm/"]), iframe, video').length;
            if (mediaCount === 0) {
                tr.classList.remove('glp-meme-hidden');
                return;
            }

            const text = clone.textContent.replace(/\s+/g, ' ').trim();
            tr.classList.toggle('glp-meme-hidden', text.length < 20);
        });

        renderNoiseBudget();
    }

    function clearMemeFilter() {
        document.querySelectorAll('.glp-meme-hidden').forEach(tr => tr.classList.remove('glp-meme-hidden'));
    }

    // ============================================
    // PINNED THREAD VISIBILITY
    // ============================================
    function applyPinnedVisibility(root = document) {
        const scope = featureScope(root);
        scope.querySelectorAll('.threads:not(.related) tbody tr').forEach(tr => {
            const pinned = !!tr.querySelector('span[title="Pinned Thread"], span[title="Karma Pin"]');
            tr.classList.toggle('glp-pinned-hidden', !!settings.hidePinnedThreads && pinned);
        });
    }

    function clearPinnedVisibility() {
        document.querySelectorAll('.glp-pinned-hidden').forEach(tr => tr.classList.remove('glp-pinned-hidden'));
    }

    // ============================================
    // FEED SORT CONTROLS
    // ============================================
    const SORT_CONTROLS = Object.freeze([
        { key: 'updated', label: 'Updated' },
        { key: 'posted', label: 'Posted' },
        { key: 'rating', label: 'Rating' },
        { key: 'views', label: 'Views' },
        { key: 'replies', label: 'Replies' }
    ]);

    function currentForumBase() {
        const match = window.location.pathname.match(/\/(forum\d+)\//);
        return `${window.location.origin}/${match ? match[1] : 'forum1'}/pg1`;
    }

    function buildSortControls(bar) {
        if (!settings.sortControls) return;

        const params = new URLSearchParams(window.location.search);
        const activeSort = params.get('sort');
        const activeOrder = params.get('order');

        const group = document.createElement('div');
        group.className = 'glp-sort-group';

        SORT_CONTROLS.forEach(control => {
            const wrap = document.createElement('span');
            wrap.className = 'glp-sort-item';

            const label = document.createElement('span');
            label.className = 'glp-sort-label';
            label.textContent = control.label;
            wrap.appendChild(label);

            [['desc', 'Newest / highest first', '▼'], ['asc', 'Oldest / lowest first', '▲']].forEach(([order, title, glyph]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'glp-sort-btn';
                btn.textContent = glyph;
                btn.title = `${control.label}: ${title}`;
                if (activeSort === control.key && activeOrder === order) btn.classList.add('glp-sort-active');
                btn.addEventListener('click', () => {
                    window.location.href = `${currentForumBase()}?sort=${control.key}&order=${order}`;
                });
                wrap.appendChild(btn);
            });

            group.appendChild(wrap);
        });

        const pinnedBtn = document.createElement('button');
        pinnedBtn.type = 'button';
        pinnedBtn.className = 'glp-settings-inline-btn glp-toolbar-btn';
        pinnedBtn.textContent = settings.hidePinnedThreads ? 'Show pinned' : 'Hide pinned';
        pinnedBtn.title = 'Toggle pinned thread rows';
        pinnedBtn.addEventListener('click', () => {
            settings.hidePinnedThreads = !settings.hidePinnedThreads;
            saveSettings();
            applyPinnedVisibility();
            pinnedBtn.textContent = settings.hidePinnedThreads ? 'Show pinned' : 'Hide pinned';
            showNotification(`Pinned threads ${settings.hidePinnedThreads ? 'hidden' : 'shown'}.`, 'info');
        });
        group.appendChild(pinnedBtn);

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'glp-settings-inline-btn glp-toolbar-btn';
        resetBtn.textContent = 'Reset sort';
        resetBtn.title = 'Return to the default forum ordering';
        resetBtn.addEventListener('click', () => {
            window.location.href = currentForumBase();
        });
        group.appendChild(resetBtn);

        bar.appendChild(group);
    }

    function applyDefaultSort() {
        if (!settings.defaultSortByNew) return false;
        if (runtimeState.route !== 'feed') return false;

        const params = new URLSearchParams(window.location.search);
        if (params.get('sort')) return false;

        params.set('sort', 'posted');
        params.set('order', 'desc');
        window.location.replace(`${window.location.pathname}?${params.toString()}`);
        return true;
    }

    // ============================================
    // PRESETS
    // ============================================
    const READER_PRESET_KEYS = Object.freeze([
        'removeAds', 'removeWidgets', 'removeMsgAds', 'removeAmpEmbeds',
        'autoBypassRegNag',
        'hideHeaderBanner', 'hideStatsBar', 'hideHeaderTime', 'hideLoginLinks',
        'hideTopLinks', 'hideMainNav', 'hideTabNav', 'hideRSS', 'hideChatRoom', 'hideJoinLink',
        'compactHeader', 'compactNav', 'compactThreadList', 'compactPosts', 'compactQuotes',
        'hideKarmaBar', 'hideSignatures', 'hideLastEdited', 'hideRateSection', 'hideReportLinks',
        'hideRelatedThreads', 'hideFooter', 'hideMobileThreadMeta', 'hideThreadHeaderRow',
        'widerContent', 'smallerAvatars', 'collapseLongQuotes', 'hideMemeReplies'
    ]);

    function applyReaderPreset() {
        const previous = {};
        READER_PRESET_KEYS.forEach(key => {
            previous[key] = settings[key];
            settings[key] = true;
        });
        saveSettings();
        applyStyles();
        runFeatureRegistry('apply');
        showNotification('Lean reading preset applied.', 'success', {
            label: 'Undo',
            onClick: () => {
                Object.entries(previous).forEach(([key, value]) => { settings[key] = value; });
                saveSettings();
                applyStyles();
                runFeatureRegistry('apply');
                showNotification('Preset reverted.', 'info');
            }
        });
    }

    // ============================================
    // INJECT FORUM LINK INTO THREAD NAV
    // ============================================
    function injectForumLink() {
        document.querySelectorAll('.msg td.nav').forEach(navCell => {
            if (navCell.querySelector('.glp-forum-link')) return;
            const firstCtrl = navCell.querySelector('.navctrl');
            if (!firstCtrl) return;
            // .navctrl is not always a direct child of the nav cell, so insert against its
            // real parent - insertBefore on the wrong parent throws and aborts the page.
            const ctrlParent = firstCtrl.parentNode;
            if (!ctrlParent) return;

            // Forum link
            const div = document.createElement('div');
            div.className = 'navctrl glp-forum-link';
            const a = document.createElement('a');
            a.href = '/forum1/pg1';
            a.textContent = 'Forum';
            div.appendChild(a);
            ctrlParent.insertBefore(div, firstCtrl);

            // Theme selector
            if (!navCell.querySelector('#glp-theme-select')) {
                const themeDiv = document.createElement('div');
                themeDiv.className = 'navctrl';
                const select = document.createElement('select');
                ownSurface(select, 'glp-theme-select');
                select.title = 'Color Theme';
                const themeNames = {
                    midnight: 'Midnight',
                    catppuccin: 'Catppuccin Mocha',
                    dracula: 'Dracula',
                    nord: 'Nord',
                    gruvbox: 'Gruvbox',
                    amoled: 'AMOLED Black',
                    solarized: 'Solarized Dark',
                    blood: 'Blood',
                    alien: 'Alien Green',
                    highcontrast: 'High Contrast Dark'
                };
                Object.entries(themeNames).forEach(([value, label]) => {
                    const opt = document.createElement('option');
                    opt.value = value;
                    opt.textContent = label;
                    if (value === settings.colorTheme) opt.selected = true;
                    select.appendChild(opt);
                });
                select.addEventListener('change', () => {
                    settings.colorTheme = select.value;
                    saveSettings();
                    applyStyles();
                    // Update all theme selectors on page
                    document.querySelectorAll('#glp-theme-select').forEach(s => {
                        if (s !== select) s.value = select.value;
                    });
                });
                themeDiv.appendChild(select);
                ctrlParent.insertBefore(themeDiv, firstCtrl);
            }

            // Settings gear
            if (!navCell.querySelector('.glp-nav-gear')) {
                const gearDiv = document.createElement('div');
                gearDiv.className = 'navctrl glp-nav-gear';
                const gear = document.createElement('a');
                gear.href = '#';
                gear.textContent = 'Settings';
                gear.title = 'Open GLP Ultra settings';
                gear.setAttribute('aria-label', 'Open GLP Ultra settings');
                gear.addEventListener('click', (e) => { e.preventDefault(); createSettingsPanel(); });
                gearDiv.appendChild(gear);
                ctrlParent.appendChild(gearDiv);
            }
        });
    }

    // ============================================
    // FORUM TOOLBAR (theme selector on forum page)
    // ============================================
    function injectForumToolbar() {
        if (document.querySelector('.msg')) return; // thread page, skip
        const threadsWrapper = document.querySelector('.threads-wrapper') || document.querySelector('.threads');
        if (!threadsWrapper || ownedElement('glp-forum-toolbar')) return;

        const bar = markFeatureOwned(document.createElement('div'));
        ownSurface(bar, 'glp-forum-toolbar');
        bar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

        // Theme selector
        const themeLabel = document.createElement('span');
        themeLabel.className = 'glp-toolbar-label';
        themeLabel.textContent = 'Theme';
        bar.appendChild(themeLabel);

        const select = document.createElement('select');
        ownSurface(select, 'glp-theme-select');
        select.title = 'Color Theme';
        const themeNames = {
            midnight: 'Midnight',
            catppuccin: 'Catppuccin Mocha',
            dracula: 'Dracula',
            nord: 'Nord',
            gruvbox: 'Gruvbox',
            amoled: 'AMOLED Black',
            solarized: 'Solarized Dark',
            blood: 'Blood',
            alien: 'Alien Green',
            highcontrast: 'High Contrast Dark'
        };
        Object.entries(themeNames).forEach(([value, label]) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            if (value === settings.colorTheme) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', () => {
            settings.colorTheme = select.value;
            saveSettings();
            applyStyles();
        });
        bar.appendChild(select);

        buildSortControls(bar);

        // Settings gear
        const spacer = document.createElement('span');
        spacer.className = 'glp-toolbar-spacer';
        bar.appendChild(spacer);

        const settingsBtn = document.createElement('button');
        settingsBtn.type = 'button';
        settingsBtn.className = 'glp-settings-inline-btn';
        ownSurface(settingsBtn, 'glp-open-settings-btn');
        settingsBtn.textContent = 'Settings';
        settingsBtn.title = 'Open GLP Ultra settings';
        settingsBtn.addEventListener('click', createSettingsPanel);
        bar.appendChild(settingsBtn);

        threadsWrapper.parentElement.insertBefore(bar, threadsWrapper);
    }

    // ============================================
    // INFINITE THREAD SCROLL (Post pages)
    // ============================================
    function initInfiniteThreadScroll() {
        if (!settings.infiniteThreadScroll) return;
        if (ownedElement('glp-infinite-loader')) return;

        const msgTable = document.querySelector('.msg tbody');
        if (!msgTable) return;

        const currentPageMatch = window.location.pathname.match(/\/pg(\d+)/);
        let nextPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 2;
        let loading = false;
        let exhausted = false;
        const basePath = window.location.pathname.replace(/\/pg\d+$/, '');

        // Check if next page exists via nav links
        const navPages = document.querySelector('.msg .navpages');
        if (!navPages) return;

        const loader = document.createElement('div');
        ownSurface(loader, 'glp-infinite-loader');
        loader.textContent = 'Scroll for more replies...';
        const msgWrapper = msgTable.closest('.msg');
        if (msgWrapper) msgWrapper.after(loader);

        const loadNext = async () => {
            if (loading || exhausted) return;
            loading = true;
            loader.textContent = 'Loading';
            loader.classList.add('loading');

            try {
                const url = `${basePath}/pg${nextPage}`;
                const html = await fetchTextQueued(url, { priority: 10 });
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const posts = doc.querySelectorAll('.msg tbody tr[id^="post_"]');
                if (posts.length === 0) { exhausted = true; return; }

                // Add a page separator
                const sep = document.createElement('tr');
                const sepCell = document.createElement('td');
                sepCell.colSpan = 2;
                sepCell.style.cssText = 'text-align:center;padding:8px;color:#8c98b3;font-size:11px;border-top:1px solid rgba(255,255,255,0.08);';
                sepCell.textContent = `Page ${nextPage}`;
                sep.appendChild(sepCell);
                msgTable.appendChild(sep);

                posts.forEach(post => {
                    msgTable.appendChild(document.importNode(post, true));
                });

                // Also grab in-between ad rows and skip them
                nextPage++;

                // Re-apply enhancements
                if (settings.highlightOPPosts) highlightOPPosts();
                if (settings.inlinePostNumbers) addPostNumbers();
                if (settings.relativeTimestamps) convertTimestamps();
                if (settings.collapsiblePosts) initCollapsiblePosts();
                if (settings.userMuteList) initMuteButtons();
                if (settings.userTags) initUserTags();
                if (settings.youtubeEmbed) embedYouTubeLinks();
                if (settings.quoteDepthBadges) initQuoteDepthBadges();
                if (settings.collapseNestedQuotes) initNestedQuoteCollapse();
                if (settings.userBlockList) initUserBlockButtons();
                if (settings.hideMemeReplies) applyMemeFilter();
                if (settings.readerMode) initReaderMode();
                highlightOPBadges();
                applyDOMModifications();
            } catch (e) {
                exhausted = true;
            } finally {
                loading = false;
                loader.classList.remove('loading');
                loader.textContent = exhausted ? 'End of thread' : 'Scroll for more replies...';
            }
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadNext();
        }, { rootMargin: '600px' });
        observer.observe(loader);
        registerFeatureCleanup('intersection', () => observer.disconnect());
    }

    // ============================================
    // HIDE THREAD BUTTONS
    // ============================================
    let hiddenThreads = [];

    // Titles live beside the id list rather than inside it: the id array is what older
    // backups carry, and a recovery shelf that can only offer "6170474" is not a recovery shelf.
    let hiddenThreadTitles = {};

    function loadHiddenThreads() {
        const storedThreads = readFeatureStore('glpHiddenThreads', []);
        const storedTitles = readFeatureStore('glpHiddenThreadTitles', {});
        hiddenThreads = sanitizeHiddenThreads(storedThreads) || [];
        hiddenThreadTitles = sanitizeHiddenThreadTitles(storedTitles) || {};
    }

    function saveHiddenThreads() {
        writeFeatureStore('glpHiddenThreads', hiddenThreads);
        // Drop titles for threads that are no longer hidden so the store cannot grow forever.
        Object.keys(hiddenThreadTitles).forEach(id => {
            if (!hiddenThreads.includes(id)) delete hiddenThreadTitles[id];
        });
        writeFeatureStore('glpHiddenThreadTitles', hiddenThreadTitles);
    }

    function normalizeThreadRow(row) {
        const link = row?.querySelector('.sfr a[href*="/message"], a[href*="/message"]');
        const href = link?.href || '';
        const idMatch = href.match(/message(\d+)/);
        const repliesText = row?.querySelector('.rfr')?.textContent || '0';
        const viewsText = row?.querySelector('.vifr')?.textContent || '0';
        return {
            row,
            id: idMatch ? idMatch[1] : null,
            href,
            title: link?.textContent.trim() || '',
            link,
            authorCell: row?.querySelector('.ufr, .hfr, .mtd-poster') || null,
            replies: parseInt(repliesText.replace(/,/g, ''), 10) || 0,
            views: parseInt(viewsText.replace(/,/g, ''), 10) || 0,
            updatedCell: row?.querySelector('.mfr, .mtd-updated') || null
        };
    }

    function getThreadId(row) {
        return normalizeThreadRow(row).id;
    }

    function hideThread(threadId, title = 'Thread') {
        if (!threadId || hiddenThreads.includes(threadId)) return;
        hiddenThreads.push(threadId);
        hiddenThreadTitles[threadId] = String(title || 'Thread').slice(0, 160);
        saveHiddenThreads();
        applyHiddenThreads();
        showNotification(`${title.substring(0, 80)} hidden.`, 'info', {
            label: 'Undo',
            onClick: () => unhideThread(threadId)
        });
    }

    function unhideThread(threadId, { silent = false } = {}) {
        if (!hiddenThreads.includes(threadId)) return false;
        hiddenThreads = hiddenThreads.filter(id => id !== threadId);
        saveHiddenThreads();
        applyHiddenThreads();
        if (!silent) showNotification('Thread restored.', 'success');
        return true;
    }

    function unhideAllThreads() {
        hiddenThreads = [];
        saveHiddenThreads();
        applyHiddenThreads();
    }

    function applyHiddenThreads(root = document) {
        if (!settings.hideThreadButtons) return;
        const scope = featureScope(root);
        let hiddenCount = 0;

        queryFeatureNodes(root, '.threads tbody tr:not(.threads_header_row)').forEach(row => {
            const threadId = getThreadId(row);
            if (threadId && hiddenThreads.includes(threadId)) {
                row.classList.add('glp-thread-hidden');
                hiddenCount++;
            } else {
                row.classList.remove('glp-thread-hidden');
            }
        });

        updateHiddenBar(hiddenCount);

        renderNoiseBudget();
    }

    function destroyHiddenThreads() {
        document.querySelectorAll('.glp-thread-hidden').forEach(row => row.classList.remove('glp-thread-hidden'));
        document.querySelectorAll('.glp-hide-col, #glp-hidden-threads-bar').forEach(node => node.remove());
        renderNoiseBudget();
    }

    function updateHiddenBar(count) {
        let bar = ownedElement('glp-hidden-threads-bar');
        if (count === 0) {
            if (bar) bar.remove();
            return;
        }
        if (!bar) {
            bar = document.createElement('div');
            ownSurface(bar, 'glp-hidden-threads-bar');
            bar.addEventListener('click', (e) => {
                const action = e.target.closest('[data-glp-hidden-action]')?.dataset.glpHiddenAction;
                if (!action) return;
                if (action === 'show') {
                    document.querySelectorAll('.threads .glp-thread-hidden').forEach(r => r.classList.remove('glp-thread-hidden'));
                    bar.dataset.showing = '1';
                    updateHiddenBar(hiddenThreads.length);
                } else if (action === 'rehide') {
                    bar.dataset.showing = '0';
                    applyHiddenThreads();
                } else if (action === 'clear') {
                    unhideAllThreads();
                }
            });
            const table = document.querySelector('.threads');
            if (table) table.parentElement.insertBefore(bar, table);
        }

        const showing = bar.dataset.showing === '1';
        bar.replaceChildren();
        const label = document.createElement('div');
        label.className = 'glp-hidden-label';
        const countSpan = document.createElement('span');
        countSpan.className = 'count';
        countSpan.textContent = String(count);
        label.appendChild(countSpan);
        label.append(` hidden thread${count !== 1 ? 's' : ''}${showing ? ' shown temporarily' : ''}`);

        const actions = document.createElement('div');
        actions.className = 'glp-hidden-actions';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.dataset.glpHiddenAction = showing ? 'rehide' : 'show';
        toggleBtn.textContent = showing ? 'Hide again' : 'Show';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'glp-hidden-clear';
        clearBtn.dataset.glpHiddenAction = 'clear';
        clearBtn.textContent = 'Clear';

        actions.appendChild(toggleBtn);
        actions.appendChild(clearBtn);
        bar.appendChild(label);
        bar.appendChild(actions);
    }

    function initHideThreadButtons(root = document) {
        if (!settings.hideThreadButtons) return;
        loadHiddenThreads();
        const scope = featureScope(root);

        // Add header column if missing
        const headerRow = scope.querySelector('.threads .threads_header_row') || document.querySelector('.threads .threads_header_row');
        if (headerRow && !headerRow.querySelector('.glp-hide-col')) {
            const th = document.createElement('th');
            th.className = 'glp-hide-col';
            th.textContent = '';
            headerRow.appendChild(th);
        }

        // Add hide button cell to each row
        queryFeatureNodes(root, '.threads tbody tr:not(.threads_header_row)').forEach(row => {
            if (row.querySelector('.glp-hide-col')) return;

            const td = document.createElement('td');
            td.className = 'glp-hide-col';
            const btn = document.createElement('button');
            btn.className = 'glp-hide-col-btn';
            btn.textContent = 'x';
            btn.title = 'Hide this thread';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rowInfo = normalizeThreadRow(row);
                if (rowInfo.id) hideThread(rowInfo.id, rowInfo.title || 'Thread');
            });
            td.appendChild(btn);
            row.appendChild(td);
        });

        applyHiddenThreads(scope);
    }

    // ============================================
    // KEYWORD FILTER
    // ============================================
    function applyKeywordFilters(root = document) {
        const scope = featureScope(root);
        const highlightWords = (settings.keywordHighlight || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
        const hideWords = (settings.keywordHide || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);

        if (highlightWords.length === 0 && hideWords.length === 0) {
            clearKeywordFilters(scope);
            return;
        }

        let hiddenCount = 0;
        let highlightCount = 0;

        scope.querySelectorAll('.threads tbody tr:not(.threads_header_row)').forEach(row => {
            const rowInfo = normalizeThreadRow(row);
            const link = rowInfo.link;
            if (!row) return;
            if (!link) return;

            const sourceText = link.dataset.glpOriginalTitle || rowInfo.title || link.textContent;
            link.dataset.glpOriginalTitle = sourceText;
            link.replaceChildren(document.createTextNode(sourceText));
            link.dataset.glpHighlighted = '';
            row.classList.remove('glp-keyword-hidden');
            const title = sourceText.toLowerCase();

            if (hideWords.some(w => title.includes(w))) {
                row.classList.add('glp-keyword-hidden');
                hiddenCount++;
                return;
            }

            if (highlightWords.some(w => title.includes(w))) {
                const matchedWords = highlightWords.filter(w => title.includes(w));
                const pattern = matchedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                const regex = new RegExp(`(${pattern})`, 'gi');
                link.replaceChildren();
                appendHighlightedText(link, sourceText, regex, 'glp-keyword-highlight');
                link.dataset.glpHighlighted = '1';
                highlightCount++;
            }
        });

        updateKeywordFilterStatus(hiddenCount, highlightCount);

        renderNoiseBudget();
    }

    function updateKeywordFilterStatus(hiddenCount, highlightCount) {
        let status = ownedElement('glp-filter-status');
        const threads = document.querySelector('.threads');
        if (!threads) return;

        if (!status) {
            status = document.createElement('div');
            ownSurface(status, 'glp-filter-status');
            const label = document.createElement('span');
            label.className = 'glp-filter-status-text';
            const clear = document.createElement('button');
            clear.type = 'button';
            clear.textContent = 'Clear filters';
            clear.addEventListener('click', () => {
                settings.keywordHighlight = '';
                settings.keywordHide = '';
                saveSettings();
                clearKeywordFilters();
                applyPanelSettings();
            });
            status.appendChild(label);
            status.appendChild(clear);
            threads.before(status);
        }

        const label = status.querySelector('.glp-filter-status-text');
        if (label) {
            label.replaceChildren(
                document.createTextNode('Filters: '),
                strongText(`${hiddenCount} hidden`),
                document.createTextNode(' / '),
                strongText(`${highlightCount} highlighted`)
            );
        }
    }

    function strongText(text) {
        const strong = document.createElement('strong');
        strong.textContent = text;
        return strong;
    }

    function clearKeywordFilters(root = document) {
        const scope = featureScope(root);
        scope.querySelectorAll('.threads tbody tr').forEach(row => {
            row.classList.remove('glp-keyword-hidden');
        });
        scope.querySelectorAll('.threads .sfr a[data-glp-original-title]').forEach(link => {
            link.replaceChildren(document.createTextNode(link.dataset.glpOriginalTitle || link.textContent));
            delete link.dataset.glpOriginalTitle;
            delete link.dataset.glpHighlighted;
        });
        removeOwnedElement('glp-filter-status');
    }

    // ============================================
    // AUTO REFRESH
    // ============================================
    let refreshTimer = null;
    let refreshBar = null;

    function initAutoRefresh() {
        // Idempotent, so this can serve as the `apply` handler too: turning auto-refresh on (or
        // changing its interval) has to take effect now, not at the next page load.
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
        removeOwnedElement('glp-auto-refresh-bar');
        refreshBar = null;

        if (!settings.autoRefresh) return;
        if (!document.querySelector('.threads')) return;

        const interval = Math.max(15, settings.autoRefreshInterval) * 1000;

        refreshBar = document.createElement('div');
        ownSurface(refreshBar, 'glp-auto-refresh-bar');
        const progress = document.createElement('div');
        progress.className = 'bar';
        refreshBar.appendChild(progress);
        document.body.appendChild(refreshBar);

        let elapsed = 0;
        const tick = 1000;

        refreshTimer = setInterval(() => {
            // A background tab must not keep counting down to a fetch nobody is looking at.
            // The queue already defers the request itself; without this the countdown still
            // completes and refreshes stack up against the moment the tab comes back.
            if (document.hidden) return;
            elapsed += tick;
            const pct = (elapsed / interval) * 100;
            refreshBar.querySelector('.bar').style.width = `${Math.min(pct, 100)}%`;

            if (elapsed >= interval) {
                elapsed = 0;
                refreshBar.querySelector('.bar').style.width = '0%';
                refreshThreadList();
            }
        }, tick);
    }

    async function refreshThreadList() {
        try {
            const html = await fetchTextQueued(window.location.href, { priority: 3 });
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTbody = doc.querySelector('.threads tbody');
            const oldTbody = document.querySelector('.threads tbody');
            if (newTbody && oldTbody) {
                oldTbody.replaceChildren(...Array.from(newTbody.children).map(row => document.importNode(row, true)));
                // Re-apply all enhancements
                if (settings.hotThreadBadge) applyHotThreadBadges();
                if (settings.relativeTimestamps) convertTimestamps();
                if (settings.freshnessColors) applyFreshnessColors();
                if (settings.userMuteList) { initMuteButtons(); applyMuteList(); }
                if (settings.hideThreadButtons) initHideThreadButtons();
                applyKeywordFilters();
                applyPinnedVisibility();
                applyDOMModifications();
            }
        } catch (e) { /* silent */ }
    }

    // ============================================
    // OP BADGE HIGHLIGHTING (JS-based)
    // ============================================
    function highlightOPBadges() {
        if (!settings.highlightOP) return;
        document.querySelectorAll('.msg tr[id^="post_"] .author_header b').forEach(b => {
            if (b.textContent.trim() === 'OP') {
                b.classList.add('glp-op-badge');
            }
        });
    }

    // ============================================
    // MUTE LIST MANAGEMENT HTML
    // ============================================
    function getMuteListHTML() {
        if (mutedUsers.length === 0) {
            return '<div class="glp-empty-state">No muted users yet. Muted authors will appear here with one-click restore.</div>';
        }
        return mutedUsers.map(u => `
            <div class="glp-mute-manage-item">
                <span>${escapeHTML(u)}</span>
                <button data-unmute="${escapeAttribute(u)}">Unmute</button>
            </div>
        `).join('');
    }

    // ============================================
    // IMAGE GALLERY (prev/next in lightbox)
    // ============================================
    let galleryImages = [];
    let galleryIndex = 0;

    // Smileys, karma icons, flags and spacer gifs are chrome, not content. One predicate, so the
    // lightbox, the gallery, and the media actions can never disagree about what an image is.
    function isChromeImage(src) {
        return src.includes('/sm/') || src.includes('karma') ||
            src.includes('div.png') || src.includes('flags/');
    }

    /**
     * `naturalWidth` is 0 until an image has actually loaded, so measuring it during a
     * document-idle pass silently rejects every image still in flight. Fall back to the declared
     * attributes, and treat an image of unknown size as content until it loads and says otherwise.
     */
    function imageIsThumbnailSized(img) {
        if (img.complete && img.naturalWidth) return img.naturalWidth < 50 || img.naturalHeight < 50;
        const width = parseInt(img.getAttribute('width') || '0', 10);
        const height = parseInt(img.getAttribute('height') || '0', 10);
        if (width && height) return width < 50 || height < 50;
        return false;
    }

    function isContentImage(img) {
        if (!img || !img.src) return false;
        if (isChromeImage(img.src)) return false;
        return !imageIsThumbnailSized(img);
    }

    function contentImages(root = document) {
        return [...root.querySelectorAll('.post_main img')].filter(isContentImage);
    }

    function onLightboxClick(e) {
        const img = e.target.closest('.post_main img');
        if (!img || !isContentImage(img)) return;

        e.preventDefault();

        if (settings.imageGallery) {
            galleryImages = contentImages();
            galleryIndex = galleryImages.indexOf(img);
            if (galleryIndex === -1) galleryIndex = 0;
        }

        showLightbox(img.src);
    }

    // ============================================
    // MEDIA ACTIONS (save / open / copy)
    // ============================================

    /**
     * Saving an image off GLP meant right-click > Save As, which the site's own context menu and
     * the extension's menu both compete for. These are explicit, and honest about the one case
     * that cannot work: a hotlinked third-party image cannot be fetched from a content script,
     * so the download falls back to opening it and says so rather than doing nothing.
     */
    function initMediaActions() {
        if (!settings.mediaActions) return;

        contentImages().forEach(img => {
            if (img.dataset.glpMediaActions) return;
            img.dataset.glpMediaActions = '1';

            const bar = document.createElement('div');
            bar.className = 'glp-media-actions';

            [
                { action: 'save', label: 'Save', title: 'Download this image' },
                { action: 'open', label: 'Open', title: 'Open the full image in a new tab' },
                { action: 'copy', label: 'Copy link', title: 'Copy the image address' }
            ].forEach(spec => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'glp-media-action';
                button.dataset.glpMediaAction = spec.action;
                button.dataset.glpMediaSrc = img.src;
                button.textContent = spec.label;
                button.title = spec.title;
                bar.appendChild(button);
            });

            img.insertAdjacentElement('afterend', bar);

            // An image that had not loaded yet was given the benefit of the doubt; if it turns
            // out to be a thumbnail, take the bar back.
            if (!img.complete || !img.naturalWidth) {
                img.addEventListener('load', () => {
                    if (!isContentImage(img)) bar.remove();
                }, { once: true });
            }
        });

        if (runtimeState.mediaActionsBound) return;
        runtimeState.mediaActionsBound = true;
        addFeatureEventListener(document, 'click', onMediaActionClick, undefined, 'actions');
    }

    function onMediaActionClick(event) {
        const button = event.target.closest('[data-glp-media-action]');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();

        const src = button.dataset.glpMediaSrc;
        if (!src) return;

        if (button.dataset.glpMediaAction === 'open') {
            window.open(src, '_blank', 'noopener,noreferrer');
            return;
        }

        if (button.dataset.glpMediaAction === 'copy') {
            navigator.clipboard.writeText(src)
                .then(() => showNotification('Image address copied.', 'success'))
                .catch(() => showNotification('Clipboard refused the copy.', 'error'));
            return;
        }

        downloadImage(src);
    }

    function imageFileName(src) {
        try {
            const name = new URL(src, window.location.href).pathname.split('/').pop() || '';
            return /\.[a-z0-9]{2,5}$/i.test(name) ? name : `glp-image-${Date.now()}.jpg`;
        } catch (error) {
            return `glp-image-${Date.now()}.jpg`;
        }
    }

    async function downloadImage(src) {
        const name = imageFileName(src);
        try {
            // Same-origin GLP uploads fetch fine. A hotlinked image is a cross-origin request
            // from a content script, which is subject to the page's CORS rules and will throw.
            const response = await fetchResponseQueued(src, { priority: 30 });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            showNotification(`Saved ${name}.`, 'success');
        } catch (error) {
            window.open(src, '_blank', 'noopener,noreferrer');
            showNotification('That image is hosted elsewhere and cannot be fetched from the page - opened it instead.', 'warning');
        }
    }

    function destroyMediaActions() {
        document.querySelectorAll('.glp-media-actions').forEach(node => node.remove());
        document.querySelectorAll('[data-glp-media-actions]').forEach(node => delete node.dataset.glpMediaActions);
        if (runtimeState.mediaActionsBound) {
            document.removeEventListener('click', onMediaActionClick);
            runtimeState.mediaActionsBound = false;
        }
    }

    function initGalleryLightbox() {
        if (!settings.imageLightbox) return;
        if (runtimeState.lightboxBound) return;
        runtimeState.lightboxBound = true;
        addFeatureEventListener(document, 'click', onLightboxClick, undefined, 'lightbox');
    }

    function destroyGalleryLightbox() {
        if (runtimeState.lightboxBound) {
            document.removeEventListener('click', onLightboxClick);
            runtimeState.lightboxBound = false;
        }
        galleryImages = [];
        galleryIndex = 0;
        removeOwnedElement('glp-lightbox');
    }

    function showLightbox(src) {
        let overlay = ownedElement('glp-lightbox');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        ownSurface(overlay, 'glp-lightbox');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Image preview');
        const fullImg = document.createElement('img');
        fullImg.src = src;

        overlay.appendChild(fullImg);

        if (settings.imageGallery && galleryImages.length > 1) {
            const prev = document.createElement('button');
            prev.className = 'glp-gallery-nav glp-gallery-prev';
            prev.type = 'button';
            prev.setAttribute('aria-label', 'Previous image');
            prev.textContent = '<';
            prev.addEventListener('click', (e) => { e.stopPropagation(); galleryNav(-1); });

            const next = document.createElement('button');
            next.className = 'glp-gallery-nav glp-gallery-next';
            next.type = 'button';
            next.setAttribute('aria-label', 'Next image');
            next.textContent = '>';
            next.addEventListener('click', (e) => { e.stopPropagation(); galleryNav(1); });

            const counter = document.createElement('div');
            counter.className = 'glp-gallery-counter';
            counter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;

            overlay.appendChild(prev);
            overlay.appendChild(next);
            overlay.appendChild(counter);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target === fullImg) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    function galleryNav(dir) {
        if (galleryImages.length === 0) return;
        galleryIndex = (galleryIndex + dir + galleryImages.length) % galleryImages.length;
        const overlay = ownedElement('glp-lightbox');
        if (!overlay) return;
        const img = overlay.querySelector('img');
        img.src = galleryImages[galleryIndex].src;
        const counter = overlay.querySelector('.glp-gallery-counter');
        if (counter) counter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
    }

    // ============================================
    // USER TAGS
    // ============================================
    let userTags = {};

    function loadUserTags() {
        const stored = readFeatureStore('glpUserTags', {});
        userTags = sanitizeUserTags(stored) || {};
    }

    function saveUserTags() {
        writeFeatureStore('glpUserTags', userTags);
    }

    const tagColors = [
        { bg: 'var(--glpx-accent)', fg: '#fff', name: 'Blue' },
        { bg: '#27ae60', fg: '#fff', name: 'Green' },
        { bg: 'var(--glpx-warning)', fg: '#000', name: 'Gold' },
        { bg: '#e74c3c', fg: '#fff', name: 'Red' },
        { bg: '#9b59b6', fg: '#fff', name: 'Purple' },
        { bg: '#1abc9c', fg: '#000', name: 'Teal' },
        { bg: '#e67e22', fg: '#fff', name: 'Orange' },
        { bg: '#64748b', fg: '#fff', name: 'Slate' },
    ];

    function initUserTags() {
        if (!settings.userTags) return;
        loadUserTags();

        // Thread page: author headers
        document.querySelectorAll('.msg tr[id^="post_"] .author_header').forEach(header => {
            if (header.querySelector('.glp-tag-btn')) return;
            const link = header.querySelector('b a');
            if (!link) return;
            const username = link.textContent.trim();

            // Show existing tag
            if (userTags[username]) {
                const tag = createTagElement(username, userTags[username]);
                header.appendChild(tag);
            }

            // Add [tag] button
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'glp-tag-btn';
            btn.textContent = 'Tag';
            btn.title = 'Tag this user';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showTagPicker(username, header);
            });
            header.appendChild(btn);
        });

        // Feed page: poster cells
        document.querySelectorAll('.threads .hfr, .threads .ufr').forEach(cell => {
            if (cell.querySelector('.glp-user-tag, .glp-tag-btn')) return;
            const link = cell.querySelector('a');
            const username = link ? link.textContent.trim() : cell.textContent.trim();
            if (!username || username === 'Anonymous Coward') return;

            if (userTags[username]) {
                const tag = createTagElement(username, userTags[username]);
                cell.appendChild(tag);
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'glp-tag-btn';
            btn.textContent = 'Tag';
            btn.title = 'Tag this user';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showTagPicker(username, cell);
            });
            cell.appendChild(btn);
        });
    }

    function createTagElement(username, tagData) {
        const tag = document.createElement('span');
        tag.className = 'glp-user-tag';
        tag.style.background = tagData.bg;
        tag.style.color = tagData.fg;
        tag.textContent = tagData.label;
        tag.title = tagData.note
            ? `Tag: ${tagData.label}\nNote: ${tagData.note}\n(click to remove)`
            : `Tag: ${tagData.label} (click to remove)`;
        if (tagData.note) tag.classList.add('glp-user-tag-noted');
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            delete userTags[username];
            saveUserTags();
            document.querySelectorAll('.glp-user-tag').forEach(t => {
                if (t.textContent === tagData.label && t.closest('.author_header')?.querySelector('b a')?.textContent.trim() === username) {
                    t.remove();
                }
            });
        });
        return tag;
    }

    function showTagPicker(username, header) {
        let picker = ownedElement('glp-tag-picker');
        if (picker) picker.remove();

        picker = document.createElement('div');
        ownSurface(picker, 'glp-tag-picker');

        const existing = userTags[username] || null;

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.placeholder = 'Label this user';
        labelInput.value = existing?.label || '';
        picker.appendChild(labelInput);

        let noteInput = null;
        if (settings.userNotes) {
            noteInput = document.createElement('textarea');
            noteInput.className = 'glp-tag-note';
            noteInput.rows = 3;
            noteInput.placeholder = 'Private note (local only)';
            noteInput.value = existing?.note || '';
            picker.appendChild(noteInput);
        }

        const commit = (color) => {
            const label = labelInput.value.trim() || color.name;
            userTags[username] = {
                bg: color.bg,
                fg: color.fg,
                label,
                note: noteInput ? noteInput.value.trim() : (existing?.note || '')
            };
            saveUserTags();
            picker.remove();
            // Remove old tags, add new
            header.querySelectorAll('.glp-user-tag').forEach(t => t.remove());
            header.insertBefore(createTagElement(username, userTags[username]), header.querySelector('.glp-tag-btn'));
        };

        const colorRow = document.createElement('div');
        colorRow.className = 'glp-tag-colors';
        tagColors.forEach(c => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'glp-tag-swatch';
            swatch.style.background = c.bg;
            swatch.title = c.name;
            swatch.setAttribute('aria-label', `Use ${c.name} tag color`);
            swatch.addEventListener('click', () => commit(c));
            colorRow.appendChild(swatch);
        });
        picker.appendChild(colorRow);

        if (noteInput) {
            const save = document.createElement('button');
            save.type = 'button';
            save.className = 'glp-tag-save';
            save.textContent = existing ? 'Save note' : 'Save';
            save.addEventListener('click', () => {
                const current = tagColors.find(c => c.bg === existing?.bg) || tagColors[0];
                commit(current);
            });
            picker.appendChild(save);
        }

        // The options object is shared deliberately. removeEventListener matches on the capture
        // flag, so passing { capture: true } on the add and nothing on the remove meant the
        // removal never matched and every picker open left another permanent listener behind.
        const dismissOptions = { capture: true };
        function dismiss(e) {
            if (picker.contains(e.target)) return;
            picker.remove();
            document.removeEventListener('click', dismiss, dismissOptions);
        }
        // direct-listener: opened from a click handler, outside any feature init, so there is no
        // active feature to own it. It removes itself on the first outside click.
        document.addEventListener('click', dismiss, dismissOptions);

        header.style.position = 'relative';
        header.appendChild(picker);
        labelInput.focus();
    }


    // ============================================
    // SCROLL PROGRESS BAR
    // ============================================
    function initScrollProgress() {
        if (!settings.scrollProgress) return;
        if (!document.querySelector('.msg')) return; // thread pages only
        if (ownedElement('glp-scroll-progress')) return;

        const bar = document.createElement('div');
        ownSurface(bar, 'glp-scroll-progress');
        bar.style.width = '0%';
        document.body.appendChild(bar);

        let ticking = false;
        addFeatureEventListener(window, 'scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    bar.style.width = `${pct}%`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true }, 'scroll');
    }

    // ============================================
    // THREAD PREVIEW ON HOVER
    // ============================================
    let previewTimeout = null;
    let previewCache = {};
    let previewToken = 0;

    function initThreadPreview() {
        if (!settings.threadPreview) return;
        if (runtimeState.threadPreviewBound) return;
        runtimeState.threadPreviewBound = true;

        // These live on `document` for the life of the page, so they read the setting at call
        // time: switching previews off has to stop them firing, not just remove the last card.
        const onPreviewMouseOver = (e) => {
            if (!settings.threadPreview) return;
            const link = e.target.closest('.threads .sfr > a');
            if (!link) return;
            const token = ++previewToken;
            const rowInfo = normalizeThreadRow(link.closest('tr'));

            previewTimeout = setTimeout(async () => {
                const url = rowInfo.href || link.href;
                const id = rowInfo.id || (url.match(/message(\d+)/) || [])[1];
                if (!id || token !== previewToken) return;

                let content = previewCache[id];
                if (!content) {
                    try {
                        const html = await fetchTextQueued(url, {
                            minDelay: 1200,
                            priority: 20,
                            cacheKey: `preview:${url}`,
                            cacheTtl: 300000
                        });
                        if (token !== previewToken) return;
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const postMain = doc.querySelector('#post_1 .post_main');
                        if (!postMain) return;
                        content = postMain.textContent.trim().substring(0, 300);
                        previewCache[id] = content;
                    } catch (e) { return; }
                }

                if (token !== previewToken || !document.body.contains(link)) return;
                removePreview();
                const preview = document.createElement('div');
                preview.className = 'glp-thread-preview';
                const title = document.createElement('div');
                title.className = 'glp-preview-title';
                title.textContent = (rowInfo.title || link.textContent.trim()).substring(0, 100);
                const body = document.createElement('div');
                body.className = 'glp-preview-body';
                body.textContent = `${content}${content.length >= 300 ? '...' : ''}`;
                preview.appendChild(title);
                preview.appendChild(body);

                const rect = link.getBoundingClientRect();
                preview.style.top = `${rect.bottom + window.scrollY + 5}px`;
                preview.style.left = `${rect.left + window.scrollX}px`;
                document.body.appendChild(preview);

                // Keep within viewport
                const pRect = preview.getBoundingClientRect();
                if (pRect.right > window.innerWidth - 10) {
                    preview.style.left = `${window.innerWidth - pRect.width - 10}px`;
                }
            }, 500);
        };
        addFeatureEventListener(document, 'mouseover', onPreviewMouseOver, undefined, 'hover-in');

        const onPreviewMouseOut = (e) => {
            if (!settings.threadPreview) return;
            if (e.target.closest('.threads .sfr > a')) {
                previewToken++;
                clearTimeout(previewTimeout);
                removePreview();
            }
        };
        addFeatureEventListener(document, 'mouseout', onPreviewMouseOut, undefined, 'hover-out');
    }

    function destroyThreadPreview() {
        runtimeState.threadPreviewBound = false;
        previewToken++;
        clearTimeout(previewTimeout);
        previewTimeout = null;
        previewCache = {};
        removePreview();
    }

    function removePreview() {
        document.querySelectorAll('.glp-thread-preview').forEach(p => p.remove());
    }

    // ============================================
    // POST PERMALINKS (click post # to copy)
    // ============================================
    function initPostPermalinks() {
        if (!settings.postPermalinks) return;
        runtimeState.permalinksBound = true;

        addFeatureEventListener(document, 'click', (e) => {
            const badge = e.target.closest('.glp-post-number');
            if (!badge) return;
            e.stopPropagation();
            const tr = badge.closest('tr[id^="post_"]');
            if (!tr) return;
            const anchor = tr.querySelector('a[name]');
            const postId = anchor ? anchor.name : tr.id.replace('post_', '');
            const base = window.location.pathname.replace(/\/pg\d+$/, '');
            const url = `${window.location.origin}${base}/reply${postId}`;

            navigator.clipboard.writeText(url).then(() => {
                const toast = document.createElement('div');
                toast.className = 'glp-copied-toast';
                toast.textContent = 'Link copied!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 1500);
            });
        }, undefined, 'copy');
    }

    function destroyPostPermalinks() {
        runtimeState.permalinksBound = false;
    }

    // ============================================
    // YOUTUBE AUTO-EMBED
    // ============================================
    function embedYouTubeLinks(root = document) {
        if (!settings.youtubeEmbed) return;
        const scope = featureScope(root);

        scope.querySelectorAll('.post_main a[href*="youtube.com/watch"], .post_main a[href*="youtu.be/"]').forEach(link => {
            if (link.dataset.glpYt) return;
            link.dataset.glpYt = '1';

            let videoId = null;
            try {
                const url = new URL(link.href);
                if (url.hostname.includes('youtu.be')) {
                    videoId = url.pathname.slice(1);
                } else {
                    videoId = url.searchParams.get('v');
                }
            } catch (e) { return; }

            if (!videoId) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'glp-yt-embed';
            const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
            const allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

            // Privacy mode never lets the player fetch until the reader asks for it.
            if (settings.mediaPrivacyMode) {
                wrapper.appendChild(buildMediaPlaceholder(embedSrc, { allow }));
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = embedSrc;
                iframe.allow = allow;
                iframe.allowFullscreen = true;
                wrapper.appendChild(iframe);
            }

            link.parentNode.insertBefore(wrapper, link.nextSibling);
        });
    }

    // ============================================
    // OP POST NAVIGATION (prev/next OP posts)
    // ============================================
    function initOPPostNav() {
        if (!settings.opPostNav) return;
        if (!document.querySelector('.msg')) return;
        if (ownedElement('glp-op-nav')) return;

        const opPost = document.querySelector('.msg tr[id="post_1"]');
        if (!opPost) return;
        const opClass = opPost.className.match(/post_member_(\d+)/);
        if (!opClass || opClass[1] === '0') return;

        const opSelector = `.msg tr.post_member_${opClass[1]}[id^="post_"]`;
        const getOPPosts = () => Array.from(document.querySelectorAll(opSelector));

        const nav = document.createElement('div');
        ownSurface(nav, 'glp-op-nav');
        nav.className = 'glp-op-nav';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.textContent = 'Prev';
        prevBtn.title = 'Previous OP post';
        prevBtn.addEventListener('click', () => navigateOP(-1, getOPPosts()));

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.textContent = 'Next';
        nextBtn.title = 'Next OP post';
        nextBtn.addEventListener('click', () => navigateOP(1, getOPPosts()));

        nav.appendChild(prevBtn);
        nav.appendChild(nextBtn);
        getThreadToolsBar().appendChild(nav);
    }

    function navigateOP(dir, posts) {
        if (posts.length === 0) return;
        const scrollY = window.scrollY + 100;
        let target = dir > 0 ? posts.find(p => p.getBoundingClientRect().top > 50) : null;

        if (dir < 0) {
            for (let i = posts.length - 1; i >= 0; i--) {
                if (posts[i].getBoundingClientRect().top < -10) { target = posts[i]; break; }
            }
        }

        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getThreadToolsBar() {
        let bar = ownedElement('glp-thread-tools-bar');
        if (bar) return bar;

        bar = markFeatureOwned(document.createElement('div'));
        ownSurface(bar, 'glp-thread-tools-bar');

        // `.msgtitle` is a div parented straight to a <tr>, so inserting after it made this bar a
        // child of that <tr> too. A div is not table content: the browser keeps it in the DOM and
        // lays it out as a stray box beside the row - the toolbar rendered as a 92px vertical
        // stack of nine wrapped buttons pinned to the right edge. Anchor outside the table.
        const table = document.querySelector('table.msg');
        if (table && table.parentElement) {
            table.parentElement.insertBefore(bar, table);
        } else {
            const title = document.querySelector('.msgtitle');
            const host = title?.closest('table')?.parentElement || document.body;
            host.insertBefore(bar, host.firstChild);
        }
        return bar;
    }

    // ============================================
    // COLLAPSE / EXPAND ALL POSTS
    // ============================================
    function initCollapseExpandAll() {
        if (!settings.collapseExpandAll) return;
        if (!document.querySelector('.msg tr[id^="post_"]')) return;

        const bar = getThreadToolsBar();
        if (bar.querySelector('[data-glp-thread-tool="collapse-all"]')) return;

        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.dataset.glpThreadTool = 'collapse-all';
        collapseBtn.textContent = 'Collapse All';
        collapseBtn.addEventListener('click', () => {
            document.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
                tr.classList.add('glp-collapsed');
                const ind = tr.querySelector('.glp-collapse-indicator');
                if (ind) ind.textContent = '[+]';
            });
        });

        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.dataset.glpThreadTool = 'expand-all';
        expandBtn.textContent = 'Expand All';
        expandBtn.addEventListener('click', () => {
            document.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
                tr.classList.remove('glp-collapsed');
                const ind = tr.querySelector('.glp-collapse-indicator');
                if (ind) ind.textContent = '[-]';
            });
        });

        const collapseQuotesBtn = document.createElement('button');
        collapseQuotesBtn.type = 'button';
        collapseQuotesBtn.dataset.glpThreadTool = 'collapse-quotes';
        collapseQuotesBtn.textContent = 'Collapse Quoted';
        collapseQuotesBtn.addEventListener('click', () => {
            document.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
                const hasQuote = tr.querySelector('.quoteo');
                const main = tr.querySelector('.post_main');
                const isQuoteOnly = hasQuote && main &&
                    main.textContent.trim().replace(tr.querySelector('.quoteo')?.textContent || '', '').trim().length < 20;
                if (isQuoteOnly) {
                    tr.classList.add('glp-collapsed');
                    const ind = tr.querySelector('.glp-collapse-indicator');
                    if (ind) ind.textContent = '[+]';
                }
            });
        });

        bar.appendChild(collapseBtn);
        bar.appendChild(expandBtn);
        bar.appendChild(collapseQuotesBtn);
    }

    // ============================================
    // QUICK SEARCH WITHIN THREAD
    // ============================================
    let searchMatches = [];
    let searchCurrentIdx = -1;

    function initQuickSearch() {
        if (!settings.threadQuickSearch) return;
        if (!document.querySelector('.msg')) return;
        if (ownedElement('glp-quick-search')) return;

        const panel = document.createElement('div');
        ownSurface(panel, 'glp-quick-search');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search in thread...';
        const counter = document.createElement('span');
        counter.className = 'count';
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.textContent = 'Prev';
        prevButton.disabled = true;
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.textContent = 'Next';
        nextButton.disabled = true;
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = 'Close';
        panel.appendChild(input);
        panel.appendChild(counter);
        panel.appendChild(prevButton);
        panel.appendChild(nextButton);
        panel.appendChild(closeButton);
        document.body.appendChild(panel);

        const toolsBar = getThreadToolsBar();
        if (toolsBar && !toolsBar.querySelector('[data-glp-thread-tool="search"]')) {
            const openSearchBtn = document.createElement('button');
            openSearchBtn.type = 'button';
            openSearchBtn.dataset.glpThreadTool = 'search';
            openSearchBtn.textContent = 'Search posts';
            openSearchBtn.addEventListener('click', openQuickSearch);
            toolsBar.appendChild(openSearchBtn);
        }

        input.addEventListener('input', () => {
            clearSearchHighlights();
            const query = input.value.trim();
            if (query.length < 2) {
                counter.textContent = '';
                searchMatches = [];
                prevButton.disabled = true;
                nextButton.disabled = true;
                return;
            }
            highlightSearchMatches(query);
            counter.textContent = searchMatches.length > 0 ? `${searchCurrentIdx + 1}/${searchMatches.length}` : '0';
            prevButton.disabled = searchMatches.length === 0;
            nextButton.disabled = searchMatches.length === 0;
        });

        prevButton.addEventListener('click', () => moveSearchResult(-1, counter));
        nextButton.addEventListener('click', () => moveSearchResult(1, counter));
        closeButton.addEventListener('click', () => closeQuickSearch(panel, input, counter, prevButton, nextButton));
    }

    function openQuickSearch() {
        const panel = ownedElement('glp-quick-search');
        if (!panel) return;
        panel.classList.add('open');
        panel.querySelector('input').focus();
    }

    function highlightSearchMatches(query) {
        searchMatches = [];
        searchCurrentIdx = -1;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

        document.querySelectorAll('.post_main').forEach(post => {
            const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);

            textNodes.forEach(node => {
                if (!regex.test(node.textContent)) return;
                regex.lastIndex = 0;
                const span = document.createElement('span');
                appendHighlightedText(span, node.textContent, regex, 'glp-search-match');
                node.parentNode.replaceChild(span, node);
            });
        });

        searchMatches = Array.from(document.querySelectorAll('.glp-search-match'));
        if (searchMatches.length > 0) {
            searchCurrentIdx = 0;
            updateSearchCurrent();
        }
    }

    function updateSearchCurrent() {
        document.querySelectorAll('.glp-search-current').forEach(m => m.classList.remove('glp-search-current'));
        if (searchMatches[searchCurrentIdx]) {
            searchMatches[searchCurrentIdx].classList.add('glp-search-current');
            searchMatches[searchCurrentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function moveSearchResult(dir, counter) {
        if (searchMatches.length === 0) return;
        searchCurrentIdx = (searchCurrentIdx + dir + searchMatches.length) % searchMatches.length;
        updateSearchCurrent();
        counter.textContent = `${searchCurrentIdx + 1}/${searchMatches.length}`;
    }

    function closeQuickSearch(panel, input, counter, prevButton, nextButton) {
        clearSearchHighlights();
        panel.classList.remove('open');
        input.value = '';
        counter.textContent = '';
        prevButton.disabled = true;
        nextButton.disabled = true;
    }

    function clearSearchHighlights() {
        document.querySelectorAll('.post_main span:has(> .glp-search-match)').forEach(span => {
            span.replaceWith(document.createTextNode(span.textContent));
        });
        document.querySelectorAll('.glp-search-match').forEach(m => {
            m.replaceWith(document.createTextNode(m.textContent));
        });
        searchMatches = [];
        searchCurrentIdx = -1;
    }

    // ============================================
    // THREAD WATCHER
    // ============================================
    // Watched threads are tracked by the highest post number seen, which is the only
    // monotonic signal GLP exposes without an API. Every check goes through the shared
    // fetch queue, so the watcher can never outrun the site's rate budget.
    const WATCH_LIMIT = 25;

    let watchedThreads = [];
    let watcherTimer = null;
    let watcherRunning = false;

    function loadWatchedThreads() {
        const parsed = readFeatureStore('glpWatchedThreads', []);
        watchedThreads = sanitizeWatchedThreads(parsed) || [];
    }

    function saveWatchedThreads() {
        writeFeatureStore('glpWatchedThreads', watchedThreads.slice(0, WATCH_LIMIT));
    }

    function highestPostNumber(root = document) {
        let highest = 0;
        root.querySelectorAll('.msg tr[id^="post_"]').forEach(tr => {
            const value = parseInt(tr.id.replace('post_', ''), 10);
            if (Number.isFinite(value) && value > highest) highest = value;
        });
        return highest;
    }

    function watchedEntryFor(threadId) {
        return watchedThreads.find(entry => entry.id === String(threadId)) || null;
    }

    function totalUnread() {
        return watchedThreads.reduce((sum, entry) => sum + (entry.unread || 0), 0);
    }

    function publishWatchCount() {
        const count = settings.watcherBadge ? totalUnread() : 0;
        // The engine stays vehicle-agnostic: the extension bridge listens for this and
        // forwards it to the service worker, and a plain userscript simply has no listener.
        window.dispatchEvent(new CustomEvent('glp:watch-count', { detail: { count } }));
        const badge = document.querySelector('#glp-watch-toggle .glp-watch-badge');
        if (badge) {
            badge.textContent = count > 0 ? String(count) : '';
            badge.classList.toggle('glp-watch-badge-active', count > 0);
        }
    }

    function watchCurrentThread() {
        const meta = currentThreadMeta();
        if (!meta.id) return;
        loadWatchedThreads();

        if (watchedEntryFor(meta.id)) {
            unwatchThread(meta.id);
            return;
        }

        if (watchedThreads.length >= WATCH_LIMIT) {
            showNotification(`Watch list is full (${WATCH_LIMIT} threads). Unwatch one first.`, 'warning');
            return;
        }

        watchedThreads.push({
            id: meta.id,
            url: meta.url,
            title: meta.title,
            lastSeenPost: highestPostNumber(),
            unread: 0,
            lastCheckedAt: Date.now(),
            error: ''
        });
        saveWatchedThreads();
        renderWatchControls();
        publishWatchCount();
        showNotification(`Watching "${meta.title.slice(0, 48)}".`, 'success', {
            label: 'Undo',
            onClick: () => unwatchThread(meta.id, { silent: true })
        });
    }

    function unwatchThread(threadId, { silent = false } = {}) {
        loadWatchedThreads();
        const entry = watchedEntryFor(threadId);
        if (!entry) return;
        watchedThreads = watchedThreads.filter(item => item.id !== String(threadId));
        saveWatchedThreads();
        renderWatchControls();
        renderWatchDigest();
        publishWatchCount();
        if (!silent) {
            showNotification('Stopped watching.', 'info', {
                label: 'Undo',
                onClick: () => {
                    loadWatchedThreads();
                    watchedThreads.push(entry);
                    saveWatchedThreads();
                    renderWatchControls();
                    renderWatchDigest();
                    publishWatchCount();
                }
            });
        }
    }

    function markWatchedRead(threadId) {
        loadWatchedThreads();
        const entry = watchedEntryFor(threadId);
        if (!entry) return;
        entry.lastSeenPost = entry.latestPost || entry.lastSeenPost;
        entry.unread = 0;
        saveWatchedThreads();
        renderWatchDigest();
        publishWatchCount();
    }

    async function checkWatchedThread(entry) {
        const firstPage = await fetchTextQueued(entry.url, { minDelay: 1200, priority: 5 });
        const parser = new DOMParser();
        let doc = parser.parseFromString(firstPage, 'text/html');

        let lastPage = 1;
        doc.querySelectorAll('.navpages a[href*="/pg"]').forEach(link => {
            const value = parseInt((link.getAttribute('href') || '').match(/\/pg(\d+)/)?.[1] || '0', 10);
            if (Number.isFinite(value) && value > lastPage) lastPage = value;
        });

        if (lastPage > 1) {
            const lastHtml = await fetchTextQueued(`${entry.url}/pg${lastPage}`, { minDelay: 1200, priority: 5 });
            doc = parser.parseFromString(lastHtml, 'text/html');
        }

        const latest = highestPostNumber(doc);
        const title = doc.querySelector('.msgtitle h1')?.textContent.replace(/\s+/g, ' ').trim();

        entry.latestPost = latest || entry.lastSeenPost;
        entry.unread = Math.max(0, entry.latestPost - (entry.lastSeenPost || 0));
        entry.lastCheckedAt = Date.now();
        entry.pages = lastPage;
        entry.error = '';
        if (title) entry.title = title;
    }

    async function runWatcherPass({ manual = false } = {}) {
        if (watcherRunning) return { skipped: true, reason: 'already-running' };
        if (!settings.watcherEnabled) return { skipped: true, reason: 'disabled' };
        if (!manual && settings.watcherPauseHidden && document.hidden) return { skipped: true, reason: 'hidden' };

        loadWatchedThreads();
        if (!watchedThreads.length) return { skipped: true, reason: 'empty' };

        watcherRunning = true;
        let checked = 0;
        try {
            for (const entry of watchedThreads) {
                if (!manual && settings.watcherPauseHidden && document.hidden) break;
                try {
                    await checkWatchedThread(entry);
                    checked++;
                } catch (error) {
                    entry.error = error && error.message ? error.message : String(error);
                    entry.lastCheckedAt = Date.now();
                }
            }
            saveWatchedThreads();
            renderWatchDigest();
            publishWatchCount();
        } finally {
            watcherRunning = false;
        }
        return { checked, total: watchedThreads.length };
    }

    function relativeAge(timestamp) {
        if (!timestamp) return 'never';
        const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    function watchHostBar() {
        if (runtimeState.route === 'thread') return getThreadToolsBar();
        return ownedElement('glp-forum-toolbar');
    }

    function renderWatchControls() {
        if (!settings.watcherEnabled) {
            destroyWatchControls();
            return;
        }

        loadWatchedThreads();
        const bar = watchHostBar();
        if (!bar) return;

        if (runtimeState.route === 'thread') {
            const meta = currentThreadMeta();
            let btn = bar.querySelector('[data-glp-thread-tool="watch"]');
            if (!btn) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.glpThreadTool = 'watch';
                btn.addEventListener('click', watchCurrentThread);
                bar.appendChild(btn);
            }
            const watching = !!watchedEntryFor(meta.id);
            btn.textContent = watching ? 'Unwatch' : 'Watch';
            btn.classList.toggle('glp-watching', watching);

            // Opening the thread is the natural "I have read this" signal.
            if (watching) {
                const entry = watchedEntryFor(meta.id);
                const seen = highestPostNumber();
                if (seen > (entry.lastSeenPost || 0)) {
                    entry.lastSeenPost = seen;
                    entry.latestPost = Math.max(seen, entry.latestPost || 0);
                    entry.unread = 0;
                    saveWatchedThreads();
                }
            }
        }

        if (settings.watcherDigest) {
            let toggle = bar.querySelector('#glp-watch-toggle');
            if (!toggle) {
                toggle = document.createElement('button');
                toggle.type = 'button';
                ownSurface(toggle, 'glp-watch-toggle');
                toggle.dataset.glpThreadTool = 'watch-digest';
                const label = document.createElement('span');
                label.textContent = 'Watched';
                const badge = document.createElement('span');
                badge.className = 'glp-watch-badge';
                toggle.append(label, badge);
                toggle.addEventListener('click', toggleWatchDigest);
                bar.appendChild(toggle);
            }
        }

        publishWatchCount();
    }

    function destroyWatchControls() {
        document.querySelectorAll('[data-glp-thread-tool="watch"], #glp-watch-toggle').forEach(node => node.remove());
    }

    function toggleWatchDigest() {
        const panel = ownedElement('glp-watch-digest');
        if (panel) {
            panel.remove();
            return;
        }
        renderWatchDigest({ open: true });
        runWatcherPass({ manual: true });
    }

    function renderWatchDigest({ open = false } = {}) {
        let panel = ownedElement('glp-watch-digest');
        if (!panel && !open) return;

        if (!panel) {
            panel = document.createElement('div');
            ownSurface(panel, 'glp-watch-digest');
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-label', 'Watched threads');
            panel.addEventListener('click', onWatchDigestClick);
            document.body.appendChild(panel);
        }

        loadWatchedThreads();
        panel.replaceChildren();

        const header = document.createElement('div');
        header.className = 'glp-watch-digest-header';
        const title = document.createElement('span');
        title.textContent = `Watched threads (${watchedThreads.length})`;
        const refresh = document.createElement('button');
        refresh.type = 'button';
        refresh.dataset.watchAction = 'refresh';
        refresh.textContent = watcherRunning ? 'Checking...' : 'Check now';
        const close = document.createElement('button');
        close.type = 'button';
        close.dataset.watchAction = 'close';
        close.textContent = 'Close';
        close.setAttribute('aria-label', 'Close watched threads');
        header.append(title, refresh, close);
        panel.appendChild(header);

        if (!watchedThreads.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-watch-empty';
            empty.textContent = 'Nothing watched yet. Open a thread and press Watch.';
            panel.appendChild(empty);
            return;
        }

        watchedThreads.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'glp-watch-row';
            if (entry.unread > 0) row.classList.add('glp-watch-unread');
            if (entry.error) row.classList.add('glp-watch-error');

            const link = document.createElement('a');
            link.className = 'glp-watch-title';
            link.href = entry.url;
            link.textContent = entry.title || `Thread ${entry.id}`;

            const meta = document.createElement('span');
            meta.className = 'glp-watch-meta';
            meta.textContent = entry.error
                ? `check failed - ${entry.error} (${relativeAge(entry.lastCheckedAt)})`
                : `${entry.unread || 0} new - checked ${relativeAge(entry.lastCheckedAt)}`;

            const actions = document.createElement('span');
            actions.className = 'glp-watch-actions';
            const read = document.createElement('button');
            read.type = 'button';
            read.dataset.watchAction = 'read';
            read.dataset.watchId = entry.id;
            read.textContent = 'Mark read';
            const drop = document.createElement('button');
            drop.type = 'button';
            drop.dataset.watchAction = 'unwatch';
            drop.dataset.watchId = entry.id;
            drop.textContent = 'Unwatch';
            actions.append(read, drop);

            row.append(link, meta, actions);
            panel.appendChild(row);
        });
    }

    function onWatchDigestClick(event) {
        const btn = event.target.closest('[data-watch-action]');
        if (!btn) return;
        const action = btn.dataset.watchAction;
        if (action === 'close') removeOwnedElement('glp-watch-digest');
        else if (action === 'refresh') runWatcherPass({ manual: true }).then(() => renderWatchDigest());
        else if (action === 'read') markWatchedRead(btn.dataset.watchId);
        else if (action === 'unwatch') unwatchThread(btn.dataset.watchId);
    }

    function initWatcher() {
        if (!settings.watcherEnabled) {
            destroyWatcher();
            return;
        }

        loadWatchedThreads();
        renderWatchControls();

        if (watcherTimer) clearInterval(watcherTimer);
        watcherTimer = null;
        const extensionManaged = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
        if (!extensionManaged) {
            const minutes = Math.max(5, Number(settings.watcherIntervalMinutes) || 15);
            watcherTimer = setInterval(() => runWatcherPass(), minutes * 60000);
        }
    }

    function destroyWatcher() {
        if (watcherTimer) {
            clearInterval(watcherTimer);
            watcherTimer = null;
        }
        destroyWatchControls();
        removeOwnedElement('glp-watch-digest');
        window.dispatchEvent(new CustomEvent('glp:watch-count', { detail: { count: 0 } }));
    }

    // ============================================
    // MEDIA ADAPTERS, PRIVACY MODE, HOVER PREVIEW
    // ============================================
    // Provider-specific handling lives in one table because embed markup rotates often;
    // an unknown provider still gets the generic click-to-load treatment.
    const MEDIA_PROVIDERS = Object.freeze([
        {
            id: 'youtube',
            label: 'YouTube',
            test: url => /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i.test(url),
            canonical: url => {
                const id = (url.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) || [])[1];
                return id ? `https://www.youtube.com/watch?v=${id}` : url;
            }
        },
        {
            id: 'x',
            label: 'X / Twitter',
            test: url => /(?:^|\/\/|\.)(?:twitter\.com|x\.com|platform\.twitter\.com)/i.test(url),
            canonical: url => {
                const id = (url.match(/(?:id=|status(?:es)?\/)(\d{6,})/) || [])[1];
                return id ? `https://x.com/i/status/${id}` : url;
            }
        },
        {
            id: 'generic',
            label: 'External embed',
            test: () => true,
            canonical: url => url
        }
    ]);

    const IMAGE_URL_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;

    function mediaProviderFor(url) {
        return MEDIA_PROVIDERS.find(provider => provider.test(url)) || MEDIA_PROVIDERS[MEDIA_PROVIDERS.length - 1];
    }

    function isThirdPartyMedia(url) {
        try {
            return new URL(url, window.location.href).origin !== window.location.origin;
        } catch (error) {
            return false;
        }
    }

    function buildMediaPlaceholder(src, { width = '', height = '', allow = '', title = '', providerId = '' } = {}) {
        const provider = MEDIA_PROVIDERS.find(entry => entry.id === providerId) || mediaProviderFor(src);
        const placeholder = document.createElement('div');
        placeholder.className = 'glp-media-placeholder';
        markFeatureOwned(placeholder);
        placeholder.dataset.glpMediaSrc = src;
        placeholder.dataset.glpMediaProvider = provider.id;
        if (width) placeholder.dataset.glpMediaWidth = width;
        if (height) placeholder.dataset.glpMediaHeight = height;
        if (allow) placeholder.dataset.glpMediaAllow = allow;
        if (title) placeholder.dataset.glpMediaTitle = title;

        const label = document.createElement('span');
        label.className = 'glp-media-provider';
        label.textContent = provider.label;

        const note = document.createElement('span');
        note.className = 'glp-media-note';
        note.textContent = 'Blocked until you load it';

        const load = document.createElement('button');
        load.type = 'button';
        load.className = 'glp-media-load';
        load.textContent = 'Load embed';
        load.addEventListener('click', () => loadPlaceholderEmbed(placeholder));

        placeholder.append(label, note, load);

        // A `cid:` or otherwise unroutable source has no honest "open directly" target.
        if (/^https?:/i.test(src)) {
            const open = document.createElement('a');
            open.className = 'glp-media-fallback';
            open.href = provider.canonical(src);
            open.target = '_blank';
            open.rel = 'noopener noreferrer';
            open.textContent = 'Open directly';
            placeholder.appendChild(open);
        }

        return placeholder;
    }

    function loadPlaceholderEmbed(placeholder) {
        const iframe = document.createElement('iframe');
        iframe.src = placeholder.dataset.glpMediaSrc;
        if (placeholder.dataset.glpMediaWidth) iframe.width = placeholder.dataset.glpMediaWidth;
        if (placeholder.dataset.glpMediaHeight) iframe.height = placeholder.dataset.glpMediaHeight;
        if (placeholder.dataset.glpMediaAllow) iframe.allow = placeholder.dataset.glpMediaAllow;
        if (placeholder.dataset.glpMediaTitle) iframe.title = placeholder.dataset.glpMediaTitle;
        iframe.allowFullscreen = true;
        iframe.dataset.glpMediaLoaded = '1';
        placeholder.replaceWith(iframe);
    }

    function applyMediaPrivacy(root = document) {
        const scope = featureScope(root);
        if (!settings.mediaPrivacyMode) return;

        scope.querySelectorAll('.post_main iframe, .glp-yt-embed iframe, .glp-x-embed iframe').forEach(iframe => {
            const src = iframe.getAttribute('src') || '';
            if (!src || !isThirdPartyMedia(src)) return;
            const absolute = /^https?:/i.test(src) ? new URL(src, window.location.href).href : src;
            iframe.replaceWith(buildMediaPlaceholder(absolute, {
                width: iframe.getAttribute('width') || '',
                height: iframe.getAttribute('height') || '',
                allow: iframe.getAttribute('allow') || '',
                title: iframe.getAttribute('title') || '',
                providerId: iframe.dataset.glpMediaProvider || ''
            }));
        });
    }

    function destroyMediaPrivacy() {
        document.querySelectorAll('.glp-media-placeholder').forEach(placeholder => loadPlaceholderEmbed(placeholder));
    }

    // X/Twitter widgets fail often and silently, and a rendered widget keeps no trace of the
    // post URL. Recover the id where the page still has it and label the block either way,
    // so a dead widget is recognisable instead of being an unexplained gap in the thread.
    const X_EMBED_SELECTORS = [
        'iframe[title="X Post"]',
        'iframe[id^="twitter-widget"]',
        'iframe[data-tweet-id]',
        'iframe[src*="twitter.com"]',
        'iframe[src*="x.com"]',
        '.twitter-tweet iframe'
    ];

    function recoverTweetId(node) {
        const direct = node.getAttribute('data-tweet-id');
        if (direct) return direct;
        const src = node.getAttribute('src') || '';
        const fromSrc = (src.match(/(?:id=|status(?:es)?\/)(\d{6,})/) || [])[1];
        if (fromSrc) return fromSrc;
        const container = node.closest('.twitter-tweet, blockquote, .post_main');
        const link = container?.querySelector('a[href*="/status/"], a[href*="/statuses/"]');
        return link ? (link.href.match(/status(?:es)?\/(\d{6,})/) || [])[1] || '' : '';
    }

    function normalizeXEmbeds(root = document) {
        const scope = featureScope(root);
        if (!settings.mediaXEmbeds) return;

        const candidates = new Set();
        X_EMBED_SELECTORS.forEach(selector => scope.querySelectorAll(selector).forEach(node => candidates.add(node)));

        candidates.forEach(node => {
            if (node.closest('.glp-x-embed')) return;
            if (!node.closest('.post_main')) return;

            const tweetId = recoverTweetId(node);
            node.dataset.glpMediaProvider = 'x';

            const wrapper = document.createElement('div');
            wrapper.className = 'glp-x-embed';
            markFeatureOwned(wrapper);

            const header = document.createElement('div');
            header.className = 'glp-x-embed-header';
            const label = document.createElement('span');
            label.className = 'glp-media-provider';
            label.textContent = 'X / Twitter';
            header.appendChild(label);

            if (tweetId) {
                const link = document.createElement('a');
                link.className = 'glp-media-fallback';
                link.href = `https://x.com/i/status/${tweetId}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = `Open post ${tweetId}`;
                header.appendChild(link);
            } else {
                const note = document.createElement('span');
                note.className = 'glp-media-note glp-media-fallback-missing';
                note.textContent = 'No direct link in the page';
                header.appendChild(note);
            }

            node.parentNode.insertBefore(wrapper, node);
            wrapper.append(header, node);
        });
    }

    function destroyXEmbeds() {
        document.querySelectorAll('.glp-x-embed').forEach(wrapper => {
            const media = wrapper.querySelector('iframe, .glp-media-placeholder');
            if (media) wrapper.replaceWith(media);
            else wrapper.remove();
        });
    }

    let mediaHoverTarget = null;

    function mediaPreviewSource(target) {
        if (target.tagName === 'IMG') {
            const src = target.currentSrc || target.getAttribute('src') || '';
            if (!src || src.includes('/sm/')) return '';
            // Only worth previewing when the page is showing a shrunken copy.
            const shrunk = target.naturalWidth > target.clientWidth + 24 || target.clientWidth < 320;
            return shrunk ? src : '';
        }
        if (target.tagName === 'A') {
            const href = target.getAttribute('href') || '';
            return IMAGE_URL_PATTERN.test(href) ? target.href : '';
        }
        return '';
    }

    function showMediaPreview(src, anchorRect) {
        let panel = ownedElement('glp-media-preview');
        if (!panel) {
            panel = document.createElement('div');
            ownSurface(panel, 'glp-media-preview');
            document.body.appendChild(panel);
        }
        panel.replaceChildren();

        const cap = Math.min(95, Math.max(30, Number(settings.mediaHoverPreviewSize) || 70));
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.style.maxWidth = `${cap}vw`;
        img.style.maxHeight = `${cap}vh`;
        panel.appendChild(img);

        panel.style.visibility = 'hidden';
        panel.style.display = 'block';
        requestAnimationFrame(() => {
            const rect = panel.getBoundingClientRect();
            let left = anchorRect.right + 16;
            if (left + rect.width > window.innerWidth - 12) left = Math.max(12, anchorRect.left - rect.width - 16);
            let top = anchorRect.top;
            if (top + rect.height > window.innerHeight - 12) top = Math.max(12, window.innerHeight - rect.height - 12);
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.visibility = 'visible';
        });
    }

    function hideMediaPreview() {
        mediaHoverTarget = null;
        const panel = ownedElement('glp-media-preview');
        if (panel) panel.remove();
    }

    function onMediaHoverOver(event) {
        if (!settings.mediaHoverPreview) return;
        const target = event.target.closest('.post_main img, .post_main a[href]');
        if (!target || target === mediaHoverTarget) return;
        const src = mediaPreviewSource(target);
        if (!src) {
            hideMediaPreview();
            return;
        }
        mediaHoverTarget = target;
        showMediaPreview(src, target.getBoundingClientRect());
    }

    function onMediaHoverOut(event) {
        if (!mediaHoverTarget) return;
        if (event.relatedTarget && mediaHoverTarget.contains(event.relatedTarget)) return;
        hideMediaPreview();
    }

    function initMediaHoverPreview() {
        if (!settings.mediaHoverPreview) {
            destroyMediaHoverPreview();
            return;
        }
        if (runtimeState.mediaHoverBound) return;
        runtimeState.mediaHoverBound = true;
        addFeatureEventListener(document, 'mouseover', onMediaHoverOver, true, 'hover-over');
        addFeatureEventListener(document, 'mouseout', onMediaHoverOut, true, 'hover-out');
        addFeatureEventListener(window, 'scroll', hideMediaPreview, { passive: true }, 'hover-scroll');
    }

    function destroyMediaHoverPreview() {
        if (runtimeState.mediaHoverBound) {
            document.removeEventListener('mouseover', onMediaHoverOver, true);
            document.removeEventListener('mouseout', onMediaHoverOut, true);
            window.removeEventListener('scroll', hideMediaPreview);
            runtimeState.mediaHoverBound = false;
        }
        hideMediaPreview();
    }

    // ============================================
    // THREAD EXPORT
    // ============================================
    // Everything GLP Ultra injects is tagged so the serializer can strip it back out;
    // an export must look like the thread, not like the thread plus our chrome.
    const EXPORT_STRIP_SELECTOR = [
        '.glp-post-number', '.glp-quote-depth', '.glp-nested-toggle', '.glp-collapse-indicator',
        '.glp-mute-btn', '.glp-block-btn', '.glp-tag-btn', '.glp-user-tag', '.glp-yt-embed',
        '.glp-media-placeholder', 'script', 'style', 'noscript', '[data-type="_mgwidget"]', 'amp-embed'
    ].join(', ');

    const EXPORT_BLOCK_TAGS = new Set(['DIV', 'P', 'BLOCKQUOTE', 'LI', 'UL', 'OL', 'TR', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'PRE', 'HR']);

    function exportSlug(text, fallback = 'thread') {
        const slug = String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60);
        return slug || fallback;
    }

    function currentThreadMeta() {
        const path = window.location.pathname;
        const id = (path.match(/message(\d+)/) || [])[1] || '';
        const page = parseInt((path.match(/\/pg(\d+)/) || [])[1] || '1', 10);
        const titleEl = document.querySelector('.msgtitle h1') || document.querySelector('.msgtitle');
        const title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : document.title.trim();
        return {
            id,
            page,
            title,
            url: `${window.location.origin}${path.replace(/\/pg\d+$/, '')}`,
            pageUrl: window.location.href
        };
    }

    function exportPushLine(state) {
        const last = state.lines[state.lines.length - 1];
        if (last && last.text === '' && last.depth === state.quoteDepth) return;
        state.lines.push({ depth: state.quoteDepth, text: '' });
    }

    function exportAppend(state, text) {
        if (!text) return;
        const last = state.lines[state.lines.length - 1];
        if (last.depth !== state.quoteDepth) {
            exportPushLine(state);
            state.lines[state.lines.length - 1].depth = state.quoteDepth;
        }
        state.lines[state.lines.length - 1].text += text;
    }

    function walkExportNode(node, state) {
        if (node.nodeType === 3) {
            exportAppend(state, node.nodeValue.replace(/\s+/g, ' '));
            return;
        }
        if (node.nodeType !== 1) return;

        const tag = node.tagName;
        if (tag === 'BR') { exportPushLine(state); return; }

        if (tag === 'IMG') {
            const src = node.getAttribute('src') || '';
            if (!src) return;
            const absolute = new URL(src, window.location.href).href;
            state.media.push({ type: 'image', url: absolute, alt: node.getAttribute('alt') || '' });
            exportAppend(state, `![${node.getAttribute('alt') || 'image'}](${absolute})`);
            return;
        }

        if (tag === 'IFRAME' || tag === 'VIDEO' || tag === 'EMBED') {
            const src = node.getAttribute('src') || node.querySelector?.('source')?.getAttribute('src') || '';
            if (!src) return;
            const absolute = new URL(src, window.location.href).href;
            state.media.push({ type: 'embed', url: absolute, alt: '' });
            exportPushLine(state);
            exportAppend(state, `[embedded media](${absolute})`);
            exportPushLine(state);
            return;
        }

        if (tag === 'A') {
            const href = node.getAttribute('href') || '';
            const text = node.textContent.replace(/\s+/g, ' ').trim();
            if (href) {
                const absolute = new URL(href, window.location.href).href;
                state.links.push({ text, url: absolute });
                exportAppend(state, text ? `[${text}](${absolute})` : absolute);
            } else if (text) {
                exportAppend(state, text);
            }
            return;
        }

        const isQuote = node.classList && node.classList.contains('quoteo');
        if (isQuote) {
            exportPushLine(state);
            state.quoteDepth++;
            state.maxQuoteDepth = Math.max(state.maxQuoteDepth, state.quoteDepth);
            exportPushLine(state);
        } else if (EXPORT_BLOCK_TAGS.has(tag)) {
            exportPushLine(state);
        }

        node.childNodes.forEach(child => walkExportNode(child, state));

        if (isQuote) {
            state.quoteDepth--;
            exportPushLine(state);
        } else if (EXPORT_BLOCK_TAGS.has(tag)) {
            exportPushLine(state);
        }
    }

    function serializePostBody(bodyEl) {
        const state = { lines: [{ depth: 0, text: '' }], quoteDepth: 0, maxQuoteDepth: 0, media: [], links: [] };
        if (bodyEl) bodyEl.childNodes.forEach(child => walkExportNode(child, state));

        const rendered = [];
        state.lines.forEach(line => {
            const text = line.text.replace(/\s+/g, ' ').trim();
            const prefix = line.depth > 0 ? `${'> '.repeat(line.depth)}` : '';
            if (!text) {
                if (rendered.length && rendered[rendered.length - 1] !== '') rendered.push('');
                return;
            }
            rendered.push(`${prefix}${text}`);
        });
        while (rendered.length && rendered[rendered.length - 1] === '') rendered.pop();

        return { text: rendered.join('\n'), media: state.media, links: state.links, maxQuoteDepth: state.maxQuoteDepth };
    }

    function collectThreadExport() {
        const meta = currentThreadMeta();
        const posts = [];
        const media = [];
        const links = [];

        document.querySelectorAll('.msg tr[id^="post_"]').forEach((tr, index) => {
            const authorCell = tr.querySelector('.messageauthor, .replyauthor');
            const bodyEl = tr.querySelector('.post_main');
            if (!bodyEl) return;

            const clone = bodyEl.cloneNode(true);
            clone.querySelectorAll(EXPORT_STRIP_SELECTOR).forEach(node => node.remove());

            const nameEl = authorCell?.querySelector('.author_header b a')
                || authorCell?.querySelector('.author_header b')
                || authorCell?.querySelector('.author_header');
            const dateEl = authorCell?.querySelector('.author_date');
            const profileLink = authorCell?.querySelector('a[href*="/members/"], a[href*="profile"]');
            const uidMatch = tr.className.match(/post_uid_(\d+)/);
            const memberMatch = tr.className.match(/post_member_(\d+)/);
            const serialized = serializePostBody(clone);

            serialized.media.forEach(item => media.push({ ...item, post: index + 1 }));
            serialized.links.forEach(item => links.push({ ...item, post: index + 1 }));

            posts.push({
                number: index + 1,
                id: tr.id.replace('post_', ''),
                author: nameEl ? nameEl.textContent.replace(/\(OP\)/g, '').replace(/\s+/g, ' ').trim() : 'Anonymous',
                profileUrl: profileLink ? profileLink.href : '',
                userId: uidMatch ? uidMatch[1] : '',
                memberId: memberMatch ? memberMatch[1] : '',
                isOP: !!(memberMatch && document.querySelector('.msg tr[id="post_1"]')?.classList.contains(`post_member_${memberMatch[1]}`)),
                date: dateEl ? (dateEl.getAttribute('title') || dateEl.textContent.replace(/\s+/g, ' ').trim()) : '',
                maxQuoteDepth: serialized.maxQuoteDepth,
                text: serialized.text,
                html: clone.innerHTML,
                media: serialized.media,
                links: serialized.links
            });
        });

        return {
            generator: `GLP Ultra v${SCRIPT_VERSION}`,
            exportedAt: new Date().toISOString(),
            source: meta.pageUrl,
            thread: meta,
            postCount: posts.length,
            posts,
            media,
            links
        };
    }

    function downloadExport(filename, text, mime) {
        const blob = new Blob([text], { type: `${mime};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function buildMediaManifestMarkdown(data) {
        if (!settings.exportMediaManifest) return '';
        const lines = ['', '---', '', '## Media manifest', ''];
        if (!data.media.length) lines.push('_No images or embeds in this page._');
        data.media.forEach(item => lines.push(`- \`${item.type}\` post #${item.post} - ${item.url}`));
        lines.push('', '## Outbound links', '');
        if (!data.links.length) lines.push('_No links in this page._');
        data.links.forEach(item => lines.push(`- post #${item.post} - [${item.text || item.url}](${item.url})`));
        return lines.join('\n');
    }

    function exportThreadAsMarkdown() {
        const data = collectThreadExport();
        const head = [
            `# ${data.thread.title || 'GLP thread'}`,
            '',
            `- Source: ${data.source}`,
            `- Thread id: ${data.thread.id || 'unknown'}`,
            `- Page: ${data.thread.page}`,
            `- Posts on this page: ${data.postCount}`,
            `- Exported: ${data.exportedAt}`,
            `- Generated by: ${data.generator}`,
            ''
        ];
        const body = data.posts.map(post => {
            const badge = post.isOP ? ' (OP)' : '';
            const meta = [post.date, post.userId ? `uid ${post.userId}` : ''].filter(Boolean).join(' - ');
            return [`## #${post.number} ${post.author}${badge}`, '', meta ? `*${meta}*` : '', '', post.text, ''].join('\n');
        }).join('\n---\n\n');

        const text = `${head.join('\n')}\n${body}${buildMediaManifestMarkdown(data)}\n`;
        downloadExport(`glp-${data.thread.id || 'thread'}-${exportSlug(data.thread.title)}-pg${data.thread.page}.md`, text, 'text/markdown');
        showNotification(`Exported ${data.postCount} posts as Markdown.`, 'success');
    }

    function exportThreadAsHtml() {
        const data = collectThreadExport();
        const manifest = settings.exportMediaManifest
            ? `<section class="manifest"><h2>Media manifest</h2><ul>${
                data.media.map(item => `<li><code>${escapeHTML(item.type)}</code> post #${item.post} - <a href="${escapeAttribute(item.url)}">${escapeHTML(item.url)}</a></li>`).join('')
                || '<li>No images or embeds in this page.</li>'
            }</ul><h2>Outbound links</h2><ul>${
                data.links.map(item => `<li>post #${item.post} - <a href="${escapeAttribute(item.url)}">${escapeHTML(item.text || item.url)}</a></li>`).join('')
                || '<li>No links in this page.</li>'
            }</ul></section>`
            : '';

        const articles = data.posts.map(post => `
    <article id="post-${escapeAttribute(post.id)}">
      <header><span class="num">#${post.number}</span> <span class="who">${escapeHTML(post.author)}${post.isOP ? ' <em>(OP)</em>' : ''}</span> <span class="when">${escapeHTML(post.date)}</span></header>
      <div class="body">${post.html}</div>
    </article>`).join('\n');

        const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(data.thread.title || 'GLP thread')}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px 16px; background: #0d0d1a; color: #e8ecf6;
         font: 15px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  main { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  .meta { color: #93a1c0; font-size: 13px; margin-bottom: 24px; }
  .meta a { color: var(--glpx-link); }
  article { border: 1px solid #2a3350; border-radius: 10px; padding: 14px 16px; margin: 0 0 14px; background: #121826; }
  article header { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap;
                   border-bottom: 1px solid #232c46; padding-bottom: 8px; margin-bottom: 10px; }
  .num { color: var(--glpx-link); font-weight: 700; }
  .who { font-weight: 650; }
  .when { color: #8592b0; font-size: 12px; margin-left: auto; }
  .body img { max-width: 100%; height: auto; border-radius: 6px; }
  .quoteo { border-left: 3px solid var(--glpx-accent); padding-left: 12px; margin: 8px 0; color: #b8c4dd; }
  a { color: var(--glpx-link); }
  .manifest { margin-top: 28px; border-top: 1px solid #232c46; padding-top: 16px; font-size: 13px; }
  .manifest h2 { font-size: 15px; }
  code { background: #1b2336; padding: 1px 5px; border-radius: 4px; }
</style></head>
<body><main>
  <h1>${escapeHTML(data.thread.title || 'GLP thread')}</h1>
  <p class="meta">
    <a href="${escapeAttribute(data.source)}">${escapeHTML(data.source)}</a><br>
    Thread ${escapeHTML(data.thread.id || 'unknown')} - page ${data.thread.page} - ${data.postCount} posts<br>
    Exported ${escapeHTML(data.exportedAt)} by ${escapeHTML(data.generator)}
  </p>
${articles}
${manifest}
</main></body></html>
`;
        downloadExport(`glp-${data.thread.id || 'thread'}-${exportSlug(data.thread.title)}-pg${data.thread.page}.html`, html, 'text/html');
        showNotification(`Exported ${data.postCount} posts as HTML.`, 'success');
    }

    function exportThreadAsJson() {
        const data = collectThreadExport();
        if (!settings.exportMediaManifest) {
            delete data.media;
            delete data.links;
        }
        downloadExport(
            `glp-${data.thread.id || 'thread'}-${exportSlug(data.thread.title)}-pg${data.thread.page}.json`,
            JSON.stringify(data, null, 2),
            'application/json'
        );
        showNotification(`Exported ${data.postCount} posts as JSON.`, 'success');
    }

    function copyThreadLink() {
        const meta = currentThreadMeta();
        copyTextToClipboard(meta.url, 'Thread link copied.');
    }

    function copyTextToClipboard(text, successMessage) {
        const done = () => showNotification(successMessage, 'success');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
            return;
        }
        fallbackCopy(text, done);
    }

    function fallbackCopy(text, done) {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', 'readonly');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        try {
            document.execCommand('copy');
            done();
        } catch (error) {
            showNotification('Copy failed. The link is in the console.', 'error');
            console.info('[GLP Ultra] link:', text);
        }
        helper.remove();
    }

    const EXPORT_ACTIONS = Object.freeze([
        { tool: 'export-md', settingKey: 'exportThreadMarkdown', label: 'Export MD', run: exportThreadAsMarkdown },
        { tool: 'export-html', settingKey: 'exportThreadHtml', label: 'Export HTML', run: exportThreadAsHtml },
        { tool: 'export-json', settingKey: 'exportThreadJson', label: 'Export JSON', run: exportThreadAsJson },
        { tool: 'copy-thread-link', settingKey: 'exportCopyThreadLink', label: 'Copy Link', run: copyThreadLink }
    ]);

    function initThreadExport() {
        if (!document.querySelector('.msg tr[id^="post_"]')) return;
        const enabled = EXPORT_ACTIONS.filter(action => settings[action.settingKey]);
        if (!enabled.length) {
            destroyThreadExport();
            return;
        }

        const bar = getThreadToolsBar();
        EXPORT_ACTIONS.forEach(action => {
            const existing = bar.querySelector(`[data-glp-thread-tool="${action.tool}"]`);
            if (!settings[action.settingKey]) {
                existing?.remove();
                return;
            }
            if (existing) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.glpThreadTool = action.tool;
            btn.textContent = action.label;
            btn.addEventListener('click', action.run);
            bar.appendChild(btn);
        });
    }

    function destroyThreadExport() {
        EXPORT_ACTIONS.forEach(action => {
            document.querySelectorAll(`[data-glp-thread-tool="${action.tool}"]`).forEach(node => node.remove());
        });
    }

    // ============================================
    // REGISTRATION NAG BYPASS
    // ============================================
    function bypassRegistrationNag() {
        const regLink = document.querySelector('.prompt-register a[href*="regp="]');
        if (regLink) {
            window.location.href = regLink.href;
            return true;
        }
        return false;
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        loadSettings();

        if (document.head || document.documentElement) {
            injectEarlyCSS();
        } else {
            // direct-listener: boot.
            document.addEventListener('DOMContentLoaded', injectEarlyCSS);
        }

        if (document.readyState === 'loading') {
            // direct-listener: boot.
            document.addEventListener('DOMContentLoaded', onDOMReady);
        } else {
            onDOMReady();
        }
    }

    function toggleSafeMode() {
        settings.safeMode = !settings.safeMode;
        saveSettings();
        applyStyles();
        showNotification(settings.safeMode
            ? 'Safe mode on - custom CSS is not being applied.'
            : 'Safe mode off - custom CSS is applied again.', settings.safeMode ? 'warning' : 'success');
        return settings.safeMode;
    }

    function onDOMReady() {
        runtimeState.route = classifyRoute();
        runtimeState.routePath = window.location.pathname;
        bindRouteHooks();

        if (typeof GM_registerMenuCommand !== 'undefined' && !runtimeState.menuRegistered) {
            GM_registerMenuCommand('GLP Ultra Settings', createSettingsPanel);
            // Registered whatever state the page is in: this is what someone reaches for after
            // pasting custom CSS that hid the settings button along with everything else.
            GM_registerMenuCommand('GLP Ultra: toggle safe mode (ignore custom CSS)', toggleSafeMode);
            runtimeState.menuRegistered = true;
        }

        if (!settings.enabled) {
            destroyEnhancedUI({ keepStyles: true });
            return;
        }

        if (settings.autoBypassRegNag && bypassRegistrationNag()) return;
        if (applyDefaultSort()) return;

        loadBlockedUsers();
        startFeatures();
    }

    function startFeatures() {
        if (runtimeState.featuresStarted || !settings.enabled) return;

        // An external settings push can arrive before the document has been parsed: the shim's
        // chrome.storage read lands at document_start, and if the mirrored copy differs from
        // localStorage it applies the difference immediately. Starting here would mark the run
        // done against a body with no posts in it, and the real page would never be touched -
        // CSS injected, body flagged active, and not one feature applied.
        if (document.readyState === 'loading' || !document.body) {
            // direct-listener: boot, once.
            document.addEventListener('DOMContentLoaded', startFeatures, { once: true });
            return;
        }

        runtimeState.featuresStarted = true;
        document.body.classList.add('glp-enhanced-active', 'glpx-enabled');

        createToggleButton();
        bindContextTracking();
        runFeatureRegistry('init');

        if (runtimeState.observer) runtimeState.observer.disconnect();
        runtimeState.observer = new MutationObserver((mutations) => {
            // Only new site nodes are candidates. Ignoring GLP-owned nodes prevents the
            // enhancements we append from recursively retriggering the entire registry.
            const added = mutations.flatMap(mutation => [...mutation.addedNodes])
                .filter(node => node.nodeType === 1)
                .filter(node => {
                    if (node.matches?.('[data-glpx-owner], [id^="glp-"], [class*="glp-"]')) return false;
                    const owner = node.parentElement?.closest?.('[data-glpx-owner], [id^="glp-"], [class*="glp-"]');
                    return !owner || owner === document.body;
                });
            if (added.length) runFeatureRegistry('apply', added);
        });

        const roots = [...new Set([
            ...document.querySelectorAll('#forum_l, table.msg, table.threads, #rightpanel_inner, #glpNotifyMenu')
        ])];
        (roots.length ? roots : [document.body]).forEach(root => {
            runtimeState.observer.observe(root, { childList: true, subtree: true });
        });
        announceVersionChange();
    }

    // ============================================
    // NOISE BUDGET
    // ============================================

    /**
     * What this page would have looked like without GLP Ultra, as a number. Hiding things
     * silently is how a filter loses trust: a reader has no way to tell an empty thread from an
     * over-eager mute list. Every count is read off the live DOM except removed ads, which leave
     * nothing to count.
     */
    function noiseBudget() {
        const count = selector => document.querySelectorAll(selector).length;
        const items = [
            { key: 'ads', label: 'Ads and widgets removed', value: runtimeState.adsRemoved },
            { key: 'mutedPosts', label: 'Posts from muted users', value: count('.glp-muted-post') },
            { key: 'blockedPosts', label: 'Posts from blocked users', value: count('.glp-user-blocked') },
            { key: 'keyword', label: 'Posts hidden by keyword', value: count('.glp-keyword-hidden') },
            { key: 'imageOnly', label: 'Image-only replies hidden', value: count('.glp-meme-hidden') },
            { key: 'hiddenThreads', label: 'Threads hidden on this page', value: count('.glp-thread-hidden') },
            { key: 'pinned', label: 'Pinned threads hidden', value: count('.glp-pinned-hidden') },
            { key: 'quotes', label: 'Nested quotes collapsed', value: count('.glp-nested-collapsed:not(.glp-nested-expanded)') }
        ];
        return { items, total: items.reduce((sum, item) => sum + item.value, 0) };
    }

    function renderNoiseBudget() {
        if (!settings.noiseBudget) {
            destroyNoiseBudget();
            return;
        }

        const bar = runtimeState.route === 'thread' ? getThreadToolsBar() : ownedElement('glp-forum-toolbar');
        if (!bar) return;

        const budget = noiseBudget();
        let chip = bar.querySelector('#glp-noise-chip');
        if (!chip) {
            chip = document.createElement('button');
            chip.type = 'button';
            ownSurface(chip, 'glp-noise-chip');
            chip.className = 'glp-toolbar-btn';
            chip.addEventListener('click', toggleNoisePanel);
            bar.appendChild(chip);
        }
        chip.textContent = budget.total ? `Filtered ${budget.total}` : 'Filtered nothing';
        chip.title = 'What GLP Ultra is keeping off this page';

        if (ownedElement('glp-noise-panel')) renderNoisePanel();
    }

    function toggleNoisePanel() {
        if (ownedElement('glp-noise-panel')) {
            ownedElement('glp-noise-panel').remove();
            return;
        }
        renderNoisePanel();
    }

    function renderNoisePanel() {
        const budget = noiseBudget();
        let panel = ownedElement('glp-noise-panel');
        if (!panel) {
            panel = document.createElement('div');
            ownSurface(panel, 'glp-noise-panel');
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-label', 'Noise budget');
            document.body.appendChild(panel);
        }
        panel.replaceChildren();

        const header = document.createElement('div');
        header.className = 'glp-diag-header';
        const title = document.createElement('span');
        title.textContent = `Kept off this page (${budget.total})`;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'glp-btn glp-btn-secondary';
        close.textContent = 'Close';
        close.dataset.glpClose = '1';
        close.addEventListener('click', () => panel.remove());
        header.append(title, close);

        const body = document.createElement('div');
        body.className = 'glp-diag-body';
        const group = diagnosticsGroup(body, 'Breakdown');
        budget.items.filter(item => item.value > 0)
            .forEach(item => diagnosticsRow(group, item.label, String(item.value)));

        if (!budget.total) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'Nothing on this page is being hidden.';
            group.appendChild(empty);
        }

        const recovery = document.createElement('div');
        recovery.className = 'glp-recovery-row';
        const hint = document.createElement('span');
        hint.className = 'glp-recovery-label';
        hint.textContent = 'Restore any of it';
        const openShelf = document.createElement('button');
        openShelf.type = 'button';
        openShelf.textContent = 'Recovery shelf';
        openShelf.addEventListener('click', () => {
            panel.remove();
            renderRecoveryShelf();
        });
        recovery.append(hint, openShelf);
        body.appendChild(recovery);

        panel.append(header, body);
    }

    function destroyNoiseBudget() {
        removeOwnedElement('glp-noise-chip');
        removeOwnedElement('glp-noise-panel');
    }

    // ============================================
    // RECOVERY SHELF
    // ============================================

    /**
     * Everything this script is currently keeping out of sight, in one place, each item
     * restorable on its own. The hidden-threads bar only ever offered "clear all" and only on
     * the feed; mutes and blocks were buried in the settings panel; filters had no inventory.
     */
    function restoreSettingsBackup() {
        const backup = readSettingsBackup();
        if (!backup) return false;
        const current = GM_getValue('glpEnhancedSettings', null);
        const parsed = parseStoredJSON(backup.payload, null);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            showNotification('That settings backup could not be read.', 'error');
            return false;
        }
        const migrated = migrateSettingsPayload(parsed).settings;
        if (!Object.keys(migrated).length) {
            showNotification('That settings backup has no recognized settings.', 'error');
            return false;
        }
        settings = { ...DEFAULT_SETTINGS, ...migrated };
        saveSettings();
        applyStyles();
        runFeatureRegistry('apply');
        showNotification(`Settings restored from before the ${backup.version} to ${backup.upgradedTo} upgrade.`, 'success', {
            label: 'Undo',
            onClick: () => {
                if (current) safeSetValue('glpEnhancedSettings', current);
                loadSettings();
                applyStyles();
                runFeatureRegistry('apply');
                showNotification('Back to the current settings.', 'info');
            }
        });
        return true;
    }

    function recoveryInventory() {
        loadMutedUsers();
        loadBlockedUsers();
        loadHiddenThreads();

        const filters = [];
        if (settings.keywordHide && settings.keywordHide.trim()) {
            filters.push({ key: 'keywordHide', label: `Keyword filter: ${settings.keywordHide.trim()}` });
        }
        if (settings.hideMemeReplies) filters.push({ key: 'hideMemeReplies', label: 'Hiding image-only replies' });
        if (settings.hideBoomerGifs) filters.push({ key: 'hideBoomerGifs', label: 'Hiding reaction GIFs' });
        if (settings.userMuteList === false) filters.push({ key: 'userMuteList', label: 'Mute list is switched off' });

        return {
            threads: hiddenThreads.map(id => ({ id, title: hiddenThreadTitles[id] || `Thread ${id}` })),
            users: mutedUsers.map(name => ({ name })),
            blocked: blockedUsers.map(user => ({ ...user })),
            filters
        };
    }

    function recoveryRow(parent, label, actionLabel, onClick) {
        const row = document.createElement('div');
        row.className = 'glp-recovery-row';
        const text = document.createElement('span');
        text.className = 'glp-recovery-label';
        text.textContent = label;
        text.title = label;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = actionLabel;
        button.addEventListener('click', onClick);
        row.append(text, button);
        parent.appendChild(row);
        return row;
    }

    function toggleRecoveryShelf() {
        const existing = ownedElement('glp-recovery');
        if (existing) {
            existing.remove();
            return;
        }
        leaveSettingsFor('recovery');
        renderRecoveryShelf();
    }

    function renderRecoveryShelf() {
        removeOwnedElement('glp-recovery');
        const inventory = recoveryInventory();
        const total = inventory.threads.length + inventory.users.length + inventory.blocked.length + inventory.filters.length;

        const panel = document.createElement('div');
        ownSurface(panel, 'glp-recovery');
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'GLP Ultra recovery shelf');

        const header = document.createElement('div');
        header.className = 'glp-diag-header';
        const title = document.createElement('span');
        title.textContent = `Recovery shelf (${total})`;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'glp-btn glp-btn-secondary';
        close.textContent = 'Close';
        close.dataset.glpClose = '1';
        close.addEventListener('click', () => panel.remove());
        const actions = document.createElement('div');
        actions.className = 'glp-footer-group';
        actions.appendChild(close);
        header.append(title, actions);
        addBackToSettings(header);

        const body = document.createElement('div');
        body.className = 'glp-diag-body';

        const threads = diagnosticsGroup(body, `Hidden threads (${inventory.threads.length})`);
        if (!inventory.threads.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'Nothing hidden.';
            threads.appendChild(empty);
        } else {
            inventory.threads.forEach(entry => recoveryRow(threads, entry.title, 'Restore', () => {
                unhideThread(entry.id);
                renderRecoveryShelf();
            }));
            recoveryRow(threads, 'All hidden threads', 'Restore all', () => {
                unhideAllThreads();
                showNotification('All hidden threads restored.', 'success');
                renderRecoveryShelf();
            });
        }

        const backup = readSettingsBackup();
        const backupGroup = diagnosticsGroup(body, 'Settings backup');
        if (!backup) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'No upgrade has replaced a saved payload yet.';
            backupGroup.appendChild(empty);
        } else {
            recoveryRow(backupGroup,
                `From before the ${backup.version} to ${backup.upgradedTo} upgrade (${String(backup.savedAt).slice(0, 10)})`,
                'Restore',
                () => {
                    if (restoreSettingsBackup()) renderRecoveryShelf();
                });
        }

        const users = diagnosticsGroup(body, `Muted users (${inventory.users.length})`);
        if (!inventory.users.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'Nobody muted.';
            users.appendChild(empty);
        } else {
            inventory.users.forEach(entry => recoveryRow(users, entry.name, 'Unmute', () => {
                unmuteUser(entry.name);
                renderRecoveryShelf();
            }));
        }

        const blocked = diagnosticsGroup(body, `Blocked users (${inventory.blocked.length})`);
        if (!inventory.blocked.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'Nobody blocked.';
            blocked.appendChild(empty);
        } else {
            inventory.blocked.forEach(entry => recoveryRow(blocked, entry.name || `User ${entry.id}`, 'Unblock', () => {
                unblockUser(entry.id);
                renderRecoveryShelf();
            }));
        }

        const filters = diagnosticsGroup(body, `Active filters (${inventory.filters.length})`);
        if (!inventory.filters.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'No filter is hiding anything.';
            filters.appendChild(empty);
        } else {
            inventory.filters.forEach(entry => recoveryRow(filters, entry.label, 'Clear', () => {
                settings[entry.key] = DEFAULT_SETTINGS[entry.key];
                if (entry.key === 'keywordHide') settings.keywordHide = '';
                saveSettings();
                applyStyles();
                runFeatureRegistry('apply');
                showNotification('Filter cleared.', 'success');
                renderRecoveryShelf();
            }));
        }

        panel.append(header, body);
        document.body.appendChild(panel);
        return panel;
    }

    // ============================================
    // CONTEXT MENU ACTIONS (extension shell)
    // ============================================

    /**
     * A context-menu click reaches the service worker, not the page, and MV3 never says which
     * element was under the cursor. So the page remembers it: every right-click records the
     * post, thread, author, and media it landed on, and the action reads that.
     */
    function bindContextTracking() {
        if (runtimeState.contextBound) return;
        runtimeState.contextBound = true;
        runtimeState.contextHandler = event => {
            runtimeState.lastContext = describeContextTarget(event.target);
        };
        // direct-listener: engine lifetime, removed in destroyEnhancedUI with a matching capture flag.
        document.addEventListener('contextmenu', runtimeState.contextHandler, true);
    }

    function describeContextTarget(target) {
        const node = target && target.nodeType === 1 ? target : (target && target.parentElement);
        const context = { author: '', threadId: '', threadTitle: '', mediaSrc: '' };
        if (!node) return context;

        const image = node.closest('img') || (node.matches?.('img') ? node : null);
        if (image && image.src) context.mediaSrc = image.src;
        const link = node.closest('a[href]');
        if (!context.mediaSrc && link && /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(link.href)) {
            context.mediaSrc = link.href;
        }

        const post = node.closest('tr[id^="post_"]');
        if (post) {
            const header = post.querySelector('.author_header');
            const nameLink = header?.querySelector('b a') || header?.querySelector('a');
            const name = nameLink ? nameLink.textContent.trim() : '';
            if (name && name !== 'Anonymous Coward') context.author = name;
        }

        const feedRow = node.closest('.threads tbody tr:not(.threads_header_row)');
        if (feedRow) {
            const info = normalizeThreadRow(feedRow);
            if (info.id) {
                context.threadId = info.id;
                context.threadTitle = info.title;
            }
            if (!context.author) {
                const feedAuthor = info.authorCell?.querySelector('a')?.textContent.trim() || '';
                if (feedAuthor && feedAuthor !== 'Anonymous Coward') context.author = feedAuthor;
            }
        } else if (runtimeState.route === 'thread') {
            const meta = currentThreadMeta();
            context.threadId = meta.id;
            context.threadTitle = meta.title;
        }

        if (link && !context.threadId) {
            const linked = link.href.match(/message(\d+)/);
            if (linked) {
                context.threadId = linked[1];
                context.threadTitle = link.textContent.trim();
            }
        }

        return context;
    }

    /**
     * Runs one context-menu action against whatever the last right-click landed on. Returns a
     * reason rather than failing silently, so the shell can say why nothing happened.
     */
    function runContextAction(action, payload = {}) {
        const context = { ...(runtimeState.lastContext || {}) };
        if (payload.linkUrl) {
            const linked = String(payload.linkUrl).match(/message(\d+)/);
            if (linked) context.threadId = linked[1];
        }
        if (payload.srcUrl) context.mediaSrc = payload.srcUrl;

        switch (action) {
            case 'hide-thread':
                if (!context.threadId) return { ok: false, reason: 'no thread under the cursor' };
                hideThread(context.threadId, context.threadTitle || 'Thread');
                return { ok: true, threadId: context.threadId };

            case 'mute-user':
                if (!context.author) return { ok: false, reason: 'no named author under the cursor' };
                muteUser(context.author);
                return { ok: true, author: context.author };

            case 'tag-user': {
                if (!context.author) return { ok: false, reason: 'no named author under the cursor' };
                const header = [...document.querySelectorAll('.author_header')].find(node => {
                    const link = node.querySelector('b a') || node.querySelector('a');
                    return link && link.textContent.trim() === context.author;
                }) || null;
                showTagPicker(context.author, header);
                return { ok: true, author: context.author };
            }

            case 'preview-media':
                if (!context.mediaSrc) return { ok: false, reason: 'no image under the cursor' };
                showLightbox(context.mediaSrc);
                return { ok: true, src: context.mediaSrc };

            case 'export-thread':
                if (runtimeState.route !== 'thread') return { ok: false, reason: 'not a thread page' };
                exportThreadAsMarkdown();
                return { ok: true };

            default:
                return { ok: false, reason: `unknown action "${action}"` };
        }
    }

    // ============================================
    // DIAGNOSTICS
    // ============================================

    /**
     * Everything needed to answer "why is GLP Ultra behaving like this on this page" without a
     * console: what route it thinks it is on, which features are live, which selectors are
     * carrying the page, what the fetch queue is doing, and what has been slow.
     */
    function buildDiagnostics() {
        const health = selectorHealth();
        const counts = health.reduce((acc, entry) => {
            acc[entry.status] = (acc[entry.status] || 0) + 1;
            return acc;
        }, {});

        return {
            version: SCRIPT_VERSION,
            settingsVersionSeen: runtimeState.previousVersion || SCRIPT_VERSION,
            settingsSchema: { ...runtimeState.migration, migratedKeys: [...runtimeState.migration.migratedKeys], migratedStores: [...runtimeState.migration.migratedStores] },
            route: runtimeState.route,
            url: window.location.href,
            settingsBackup: (() => {
                const backup = readSettingsBackup();
                return backup ? { from: backup.version, to: backup.upgradedTo, savedAt: backup.savedAt } : null;
            })(),
            darkReader: {
                detected: darkReaderPresent(),
                locked: !!document.getElementById(DARK_READER_LOCK_ID)
            },
            featuresStarted: runtimeState.featuresStarted,
            enabledFeatures: getFeatureRegistry()
                .filter(feature => routeAllowsFeature(feature) && settingAllowsFeature(feature))
                .map(feature => feature.id),
            changedSettings: Object.keys(DEFAULT_SETTINGS).filter(key => settings[key] !== DEFAULT_SETTINGS[key]),
            errors: [...runtimeState.featureErrors],
            storageFailures: [...runtimeState.storageFailures],
            selectorHealth: {
                total: health.length,
                primary: counts.primary || 0,
                fallback: counts.fallback || 0,
                missing: counts.missing || 0,
                absent: counts.absent || 0,
                warnings: health
                    .filter(entry => entry.status === 'missing' || entry.status === 'fallback')
                    .map(entry => ({ key: entry.key, status: entry.status, required: entry.required, selector: entry.selector }))
            },
            timings: Object.values(runtimeState.featureTimings)
                .sort((a, b) => b.worstMs - a.worstMs)
                .slice(0, 8)
                .map(entry => ({ ...entry, worstMs: Number(entry.worstMs.toFixed(2)), lastMs: Number(entry.lastMs.toFixed(2)) })),
            fetchQueue: {
                pending: runtimeState.fetchQueue.length,
                consecutiveFailures: runtimeState.fetchFailures,
                backoffMs: Math.max(0, runtimeState.fetchBackoffUntil - Date.now()),
                active: runtimeState.fetchActive,
                cachedResponses: runtimeState.fetchCache.size,
                lastFetchAge: runtimeState.lastFetchAt ? relativeAge(runtimeState.lastFetchAt) : 'never'
            }
        };
    }

    function buildIssueBundle() {
        return {
            format: 'glp-ultra-issue-bundle',
            schemaVersion: 1,
            generator: `GLP Ultra v${SCRIPT_VERSION}`,
            createdAt: new Date().toISOString(),
            context: {
                route: runtimeState.route,
                url: window.location.href,
                userAgent: navigator.userAgent,
                language: navigator.language || ''
            },
            diagnostics: buildDiagnostics(),
            settings: { ...settings },
            lists: {
                mutedUsers: [...mutedUsers],
                blockedUsers: blockedUsers.map(user => ({ ...user })),
                hiddenThreads: [...hiddenThreads],
                hiddenThreadTitles: { ...hiddenThreadTitles }
            }
        };
    }

    function downloadIssueBundle() {
        const bundle = buildIssueBundle();
        const stamp = bundle.createdAt.replace(/[:.]/g, '-');
        downloadExport(`glp-issue-${stamp}.json`, JSON.stringify(bundle, null, 2), 'application/json');
        showNotification('Issue bundle saved. Review local details before sharing.', 'success');
        return bundle;
    }

    function diagnosticsRow(parent, label, value, tone) {
        const row = document.createElement('div');
        row.className = tone ? `glp-diag-row glp-diag-${tone}` : 'glp-diag-row';
        const name = document.createElement('span');
        name.textContent = label;
        const detail = document.createElement('span');
        detail.textContent = value;
        row.append(name, detail);
        parent.appendChild(row);
        return row;
    }

    function diagnosticsGroup(parent, title) {
        const group = document.createElement('div');
        group.className = 'glp-diag-group';
        const heading = document.createElement('h4');
        heading.textContent = title;
        group.appendChild(heading);
        parent.appendChild(group);
        return group;
    }

    /**
     * Diagnostics and the recovery shelf are opened from the settings footer, then rendered as
     * fixed panels - straight over the panel that launched them, covering its nav rail and its
     * buttons. They are full inspectors, so hand the screen over and offer the way back.
     */
    function leaveSettingsFor(surface) {
        const overlay = ownedElement('glp-enhanced-overlay');
        if (!overlay) return false;
        overlay.remove();
        runtimeState.returnToSettings = surface;
        return true;
    }

    function addBackToSettings(header) {
        if (!runtimeState.returnToSettings) return;
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'glp-btn glp-btn-secondary';
        back.textContent = 'Back to settings';
        back.addEventListener('click', () => {
            removeOwnedElement('glp-diagnostics');
            removeOwnedElement('glp-recovery');
            runtimeState.returnToSettings = null;
            createSettingsPanel();
        });
        header.querySelector('.glp-footer-group')?.prepend(back);
        if (!header.querySelector('.glp-footer-group')) header.appendChild(back);
    }

    function toggleDiagnosticsPanel() {
        const existing = ownedElement('glp-diagnostics');
        if (existing) {
            existing.remove();
            return;
        }
        leaveSettingsFor('diagnostics');
        renderDiagnosticsPanel();
    }

    function renderDiagnosticsPanel() {
        const report = buildDiagnostics();

        const panel = document.createElement('div');
        ownSurface(panel, 'glp-diagnostics');
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'GLP Ultra diagnostics');

        const header = document.createElement('div');
        header.className = 'glp-diag-header';
        const title = document.createElement('span');
        title.textContent = `Diagnostics - v${report.version}`;
        const actions = document.createElement('div');
        actions.className = 'glp-footer-group';

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'glp-btn glp-btn-secondary';
        copy.textContent = 'Copy';
        copy.addEventListener('click', () => {
            const text = JSON.stringify(buildDiagnostics(), null, 2);
            navigator.clipboard.writeText(text)
                .then(() => showNotification('Diagnostics copied.', 'success'))
                .catch(() => showNotification('Clipboard refused the copy.', 'error'));
        });

        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'glp-btn glp-btn-secondary';
        save.textContent = 'Save report';
        save.title = 'Save diagnostics, settings, and local lists as a JSON issue bundle';
        save.addEventListener('click', downloadIssueBundle);

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'glp-btn glp-btn-secondary';
        close.textContent = 'Close';
        close.dataset.glpClose = '1';
        close.addEventListener('click', () => panel.remove());

        actions.append(copy, save, close);
        header.append(title, actions);
        addBackToSettings(header);

        const body = document.createElement('div');
        body.className = 'glp-diag-body';

        const state = diagnosticsGroup(body, 'State');
        diagnosticsRow(state, 'Route', report.route);
        diagnosticsRow(state, 'Features started', report.featuresStarted ? 'yes' : 'no',
            report.featuresStarted ? 'ok' : 'bad');
        diagnosticsRow(state, 'Active features', String(report.enabledFeatures.length));
        diagnosticsRow(state, 'Settings changed from defaults', String(report.changedSettings.length));
        diagnosticsRow(state, 'Settings version last seen', report.settingsVersionSeen);

        const selectors = diagnosticsGroup(body, 'Selector health');
        diagnosticsRow(selectors, 'Primary selector matched', `${report.selectorHealth.primary}/${report.selectorHealth.total}`, 'ok');
        diagnosticsRow(selectors, 'Fell back to an alternate', String(report.selectorHealth.fallback),
            report.selectorHealth.fallback ? 'warn' : 'ok');
        diagnosticsRow(selectors, 'Expected but missing', String(report.selectorHealth.missing),
            report.selectorHealth.missing ? 'bad' : 'ok');
        report.selectorHealth.warnings.forEach(warning => {
            diagnosticsRow(selectors, warning.key, warning.status === 'missing' ? 'no match' : warning.selector,
                warning.status === 'missing' ? 'bad' : 'warn');
        });

        const errors = diagnosticsGroup(body, 'Feature errors');
        if (!report.errors.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'None recorded.';
            errors.appendChild(empty);
        } else {
            report.errors.forEach(error => diagnosticsRow(errors, `${error.id} (${error.stage})`, error.message, 'bad'));
        }

        const timings = diagnosticsGroup(body, 'Slowest features (worst run)');
        if (!report.timings.length) {
            const empty = document.createElement('div');
            empty.className = 'glp-diag-empty';
            empty.textContent = 'Nothing measured yet.';
            timings.appendChild(empty);
        } else {
            report.timings.forEach(entry => diagnosticsRow(timings, `${entry.id} (${entry.runs}x)`, `${entry.worstMs} ms`,
                entry.worstMs > 50 ? 'warn' : ''));
        }

        const queue = diagnosticsGroup(body, 'Fetch queue');
        diagnosticsRow(queue, 'Pending', String(report.fetchQueue.pending));
        diagnosticsRow(queue, 'Active', report.fetchQueue.active ? 'yes' : 'no');
        diagnosticsRow(queue, 'Last fetch', report.fetchQueue.lastFetchAge);
        diagnosticsRow(queue, 'Consecutive failures', String(report.fetchQueue.consecutiveFailures));
        diagnosticsRow(queue, 'Backing off', report.fetchQueue.backoffMs
            ? `${Math.ceil(report.fetchQueue.backoffMs / 1000)}s` : 'no');

        panel.append(header, body);
        document.body.appendChild(panel);
        return panel;
    }

    // Control surface for the browser-extension shell (popup, options page, service worker).
    // Harmless when running as a plain userscript: nothing else reads it.
    window.__GLP_ULTRA__ = {
        version: SCRIPT_VERSION,
        openSettings: createSettingsPanel,
        getSettings: () => ({ ...settings }),
        getDefaults: () => ({ ...DEFAULT_SETTINGS }),
        applyExternalSettings(patch) {
            if (!isRecord(patch)) return false;
            const migrated = migrateSettingsPayload(patch).settings;
            if (!Object.keys(migrated).length) return false;
            Object.assign(settings, migrated);
            saveSettings();
            applyStyles();
            // The nav's theme picker is a plain <select>; nothing repaints it when the theme is
            // changed from the panel, the popup, or another device.
            const themeSelect = ownedElement('glp-theme-select');
            if (themeSelect && themeSelect.value !== settings.colorTheme) themeSelect.value = settings.colorTheme;
            if (!settings.enabled) {
                destroyEnhancedUI({ keepStyles: true });
            } else if (!runtimeState.featuresStarted) {
                startFeatures();
            } else {
                runFeatureRegistry('apply');
            }
            return true;
        },
        getLists: () => ({ mutedUsers: [...mutedUsers], blockedUsers: blockedUsers.map(u => ({ ...u })), hiddenThreads: [...hiddenThreads] }),
        getDiagnostics: buildDiagnostics,
        openDiagnostics: renderDiagnosticsPanel,
        runContextAction,
        describeContext: () => ({ ...(runtimeState.lastContext || {}) }),
        openRecovery: renderRecoveryShelf,
        getRecoveryInventory: recoveryInventory,
        buildBackup: buildBackupPayload,
        applyBackup: applyBackupPayload,
        buildPack,
        applyPack,
        buildIssueBundle,
        downloadIssueBundle,
        runWatcherCheck: () => runWatcherPass()
    };

    init();

})();
