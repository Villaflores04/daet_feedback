/*
 * FB Feedback Collector v2 — paste into Chrome DevTools > Console.
 *
 * Best starting pages (set Facebook's language to English first):
 *   https://www.facebook.com/hashtag/bagasbas
 *   https://www.facebook.com/search/posts?q=%23bagasbas
 *   or any single post page
 *
 * What changed from v1:
 *  - FEED ONLY: reads posts only inside the main feed (or an open post window).
 *    Messenger chat tabs, sidebars, top bar, notifications, stories and
 *    sponsored posts are ignored, and the script never clicks anything there.
 *  - COMMENTS: for each post that shows "N comments", it opens that post's
 *    comment window, switches to "All comments" when possible, loads and
 *    expands comments/replies, saves them, then closes the window.
 *    On a single post page it just scrolls and expands in place.
 *  - Per-session salted 53-bit hash for author pseudonyms.
 *  - Emoji / apostrophe sentiment fixes, a few Bikol words (verify them).
 *  - Optional auto-download of the CSV every N rows.
 *
 * Facebook changes its markup often. If a field is blank, its selector needs updating.
 */
(() => {
  if (window.__fbFeedbackCollector) {
    console.warn("Collector is already initialized on this page.");
    return;
  }
  window.__fbFeedbackCollector = true;

  const CONFIG = {
    anonymizeAuthors: true,  // true = "user_xxxx" instead of real names
    openComments: true,      // open each post's comment window to read comments
    skipSponsored: true,
    tickMs: 2000,            // pause between feed scroll steps
    scrollRatio: 0.8,
    idleTicksToStop: 12,     // feed steps with nothing new before stopping
    maxItems: 5000,
    maxPostsPerPass: 5,      // posts whose comments are opened per feed step
    commentTickMs: 1500,     // pause between steps inside a comment window
    commentIdleTicks: 4,     // steps with nothing new before closing the window
    maxCommentTicks: 30,     // hard cap per post (single post pages use 200)
    autoDownloadEvery: 500,  // auto-save CSV every N new rows (0 = off)
  };

  const SALT = Math.floor(Math.random() * 1e9);
  const rows = new Map();     // key -> row, so re-renders never create duplicates
  const deepDone = new Set(); // posts whose comment window was already read
  let running = false;
  let idleTicks = 0;
  let errors = 0;
  let lastBlocks = 0;
  let lastSaved = 0;
  const stats = { found: 0, missing: 0 };

  // ---------- helpers ----------
  // cyrb53: 53-bit string hash (far fewer collisions than a 32-bit one)
  const hash = (s, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * ms * 0.3));
  const clean = (t) => (t || "").replace(/\s+/g, " ").replace(/\bSee more$/i, "").trim();
  const toNum = (s) => {
    if (!s) return 0;
    const m = String(s).replace(/,/g, "").match(/([\d.]+)\s*([KkMm])?/);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    return Math.round(m[2] ? n * (/k/i.test(m[2]) ? 1e3 : 1e6) : n);
  };
  const who = (name) => {
    const n = clean(name).replace(/['’]s post$/i, "");
    if (!n) return "";
    return CONFIG.anonymizeAuthors ? "user_" + hash(n, SALT) : n;
  };
  const cleanUrl = (href) => {
    try {
      const u = new URL(href, location.origin);
      if (/permalink\.php|story\.php|\/watch/.test(u.pathname)) {
        const keep = new URLSearchParams();
        ["story_fbid", "id", "v"].forEach((k) => { if (u.searchParams.get(k)) keep.set(k, u.searchParams.get(k)); });
        return u.origin + u.pathname + "?" + keep.toString();
      }
      return u.origin + u.pathname;
    } catch (e) { return String(href).split("?")[0]; }
  };

  // ---------- scope: feed only ----------
  // Anything inside these is never read and never clicked.
  const BLOCKED = [
    "#fbc-panel",
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[data-pagelet*="Chat"]',
    '[data-pagelet*="Messenger"]',
    '[data-pagelet*="RightRail"]',
    '[data-pagelet*="LeftRail"]',
    '[data-pagelet*="Stories"]',
    '[aria-label="Messenger"]',
    '[aria-label="Chats"]',
    '[aria-label^="New message"]',
    '[aria-label="Notifications"]',
  ].join(",");
  const inScope = (el) => !!el && !el.closest(BLOCKED);

  const MSG_SEL = '[data-ad-rendering-role="story_message"], [data-ad-comet-preview="message"], [data-ad-preview="message"]';

  const isCommentEl = (el) => {
    const label = el.getAttribute("aria-label") || "";
    if (/^(comment|reply)\b/i.test(label)) return true;
    // a labelled article nested inside another article is a comment/reply
    return !!label && !!(el.parentElement && el.parentElement.closest('div[role="article"]'));
  };

  // an open post window (dialog) that actually contains a post, never chat dialogs
  const getDialog = () => {
    const ds = [...document.querySelectorAll('div[role="dialog"]')].filter(
      (d) => inScope(d) && (d.querySelector(MSG_SEL) || d.querySelector('div[role="article"]')));
    return ds[ds.length - 1] || null;
  };
  const isSinglePost = () =>
    !document.querySelector('[role="feed"]') && /pfbid|\/posts\/|permalink|story_fbid|\/videos\/|\/reel\/|\/watch/.test(location.href);

  // where we are allowed to read right now
  const roots = () => {
    const d = getDialog();
    if (d) return [d];
    const mains = [...document.querySelectorAll('[role="main"]')].filter(inScope);
    return mains.length ? mains : [document.body];
  };

  const outerArticle = (el) => {
    let a = el.closest('div[role="article"]');
    let best = null;
    while (a) {
      if (!isCommentEl(a)) best = a;
      a = a.parentElement ? a.parentElement.closest('div[role="article"]') : null;
    }
    return best;
  };

  const findContainers = () => {
    const found = new Set();
    const add = (el) => { if (el && inScope(el)) found.add(el); };
    roots().forEach((r) => {
      if (r.matches('div[role="dialog"]')) { add(r); return; }
      r.querySelectorAll("[aria-posinset]").forEach(add);
      r.querySelectorAll('div[role="article"]').forEach((a) => { if (!isCommentEl(a)) add(outerArticle(a)); });
      r.querySelectorAll(MSG_SEL).forEach((m) => {
        if (m.closest("[aria-posinset]") || outerArticle(m)) return;
        let el = m;
        for (let i = 0; i < 8 && el.parentElement; i++) el = el.parentElement;
        add(el);
      });
    });
    const list = [...found];
    return list.filter((c) => !list.some((o) => o !== c && o.contains(c)));
  };

  // ---------- rough rule-based sentiment (English + Filipino) ----------
  const POS = new Set(("good great nice awesome amazing love loved lovely happy thank thanks congrats congratulations proud excited best wonderful beautiful " +
    "perfect fun enjoy enjoyed helpful clean galing ganda maganda saya masaya salamat mahal bongga astig solid angat husay mabuti ayos sulit " +
    "marhay magayon").split(" ")); // marhay, magayon (Bikol): verify with native speakers
  const NEG = new Set(("bad worst poor terrible awful hate hated angry disappointed disappointing slow dirty rude unfair problem sad boring waste " +
    "galit pangit panget mali bulok kadiri nakakainis nakakadismaya malungkot lungkot mabagal madumi grabe reklamo sayang").split(" "));
  const NEGATORS = new Set("not no never dont don't doesn't isn't wasn't hindi di wala walang ayaw dai daing".split(" "));
  const POS_EMO = /[😍❤😊👍🥰🎉👏😁😄💙💚🙌🤩]/gu;
  const NEG_EMO = /[😡😢😭👎😠😞😤😩💔🤬]/gu;
  const norm = (t) => (t || "").replace(/\uFE0F/g, "").replace(/[’‘]/g, "'");

  const sentiment = (raw) => {
    const text = norm(raw);
    const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}'\s]/gu, " ").split(/\s+/).filter(Boolean);
    let score = 0;
    tokens.forEach((tok, i) => {
      const polarity = POS.has(tok) ? 1 : NEG.has(tok) ? -1 : 0;
      if (!polarity) return;
      let negated = false;
      for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
        if (POS.has(tokens[j]) || NEG.has(tokens[j])) break;
        if (NEGATORS.has(tokens[j])) { negated = true; break; }
      }
      score += negated ? -polarity : polarity;
    });
    score += (text.match(POS_EMO) || []).length - (text.match(NEG_EMO) || []).length;
    return { score, label: score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral" };
  };

  // ---------- expanding collapsed content (only inside the allowed scope) ----------
  const SEE_MORE = /^see more$/i;
  const EXPAND_COMMENTS = [
    /^view (\d+ )?more comments?$/i,
    /^view all [\d.,KkMm]+ comments?$/i,
    /^view (\d+ )?(more |previous )?(repl(y|ies)|comments?)$/i,
    /^\d+ repl(y|ies)$/i,
    /replied\s*·\s*\d+ repl(y|ies)$/i,
  ];
  // allowComments=false in the plain feed: "View all N comments" there would open a window by accident
  const expandAll = (allowComments, only) => {
    const now = Date.now();
    (only ? [only] : roots()).forEach((r) => {
      r.querySelectorAll('div[role="button"], span[role="button"]').forEach((btn) => {
        if (!inScope(btn)) return;
        if (btn.dataset.fbcDone && now - Number(btn.dataset.fbcDone) < 8000) return;
        const text = (btn.innerText || "").trim();
        if (text.length > 60) return;
        if (!(SEE_MORE.test(text) || (allowComments && EXPAND_COMMENTS.some((re) => re.test(text))))) return;
        btn.dataset.fbcDone = String(now);
        try { btn.click(); } catch (e) { /* ignore */ }
      });
    });
  };

  // ---------- extraction ----------
  const reactionInfo = (scope, filter) => {
    const out = { total: 0, like: "", love: "", care: "", haha: "", wow: "", sad: "", angry: "" };
    let sum = 0;
    let labelTotal = 0;
    scope.querySelectorAll("[aria-label]").forEach((el) => {
      if (!filter(el)) return;
      const label = el.getAttribute("aria-label") || "";
      const b = label.match(/^(Like|Love|Care|Haha|Wow|Sad|Angry)\s*:\s*([\d.,KkMm]+)/i);
      if (b) {
        const n = toNum(b[2]);
        const k = b[1].toLowerCase();
        if (out[k] === "") { out[k] = n; sum += n; }
        return;
      }
      const t = label.match(/([\d.,]+\s*[KkMm]?)\s+(reactions?|likes?)\b/i);
      if (t) labelTotal = Math.max(labelTotal, toNum(t[1]));
    });
    out.total = Math.max(sum, labelTotal);
    return out;
  };

  const tKey = (text) => String(text || "").normalize("NFKC").toLowerCase()
    .replace(/(see more|…|\.\.\.)\s*$/i, "").replace(/[^\p{L}\p{N}]/gu, "").slice(0, 20);
  const byText = new Map(); // text key -> post key (feed rows)

  const TIME_RE = /^(\d+\s*(s|m|h|d|w|y|secs?|mins?|hrs?)|just now|yesterday|[A-Z][a-z]+ \d{1,2}.*)$/i;
  const revealLinks = (post) => {
    post.querySelectorAll('a[role="link"]').forEach((a) => {
      const h = a.getAttribute("href") || "";
      const t = (a.innerText || "").trim();
      if ((h === "#" || h === "") && t && t.length <= 24 && TIME_RE.test(t)) {
        try { ["pointerover", "mouseover", "mouseenter"].forEach((ev) => a.dispatchEvent(new MouseEvent(ev, { bubbles: true }))); } catch (e) { /* ignore */ }
      }
    });
  };

  const UI_WORDS = /^(like|reply|share|edited|author|top fan|follow|most relevant|write a comment\.{0,3}|comment)$/i;

  // forced = post key to attach comments to (used while a post window is open)
  const processPost = (post, now, forced) => {
    const inComment = (el) => {
      const a = el.closest('div[role="article"]');
      return !!(a && a !== post && isCommentEl(a) && post.contains(a));
    };
    const mine = (el) => !inComment(el);

    if (!forced) revealLinks(post);
    if (CONFIG.skipSponsored && post.querySelector('a[href*="/ads/about"], a[aria-label="Sponsored"]')) return null;

    const msgEl = [...post.querySelectorAll(MSG_SEL)].find(mine);
    let text = clean(msgEl ? msgEl.innerText : "");
    if (!text) {
      const cands = [...post.querySelectorAll('div[dir="auto"]')].filter(mine).map((d) => clean(d.innerText));
      text = cands.sort((a, b) => b.length - a.length)[0] || "";
    }
    const linkEl = [...post.querySelectorAll("a[href]")].find((a) =>
      mine(a) && /\/(posts|videos|reel|permalink)\/|story_fbid|multi_permalinks|pfbid/.test(a.href));
    const url = linkEl ? cleanUrl(linkEl.href) : "";
    if (!forced && !text && !url) return null;

    const authorEl = [...post.querySelectorAll('h2 a[role="link"], h3 a[role="link"], strong a')].find(mine)
      || [...post.querySelectorAll("h2 span, h3 span")].find(mine);
    const author = who(authorEl ? authorEl.innerText : "");
    const textKey = tKey(text);
    const postKey = forced || "post_" + hash(author + "|" + (textKey || url));

    if (!forced) {
      const r = reactionInfo(post, mine);
      const existing = rows.get(postKey);
      if (existing) {
        if (!existing.post_url && url) existing.post_url = url;
        if (!existing.time_text && linkEl) existing.time_text = clean(linkEl.innerText);
        if (text.length > String(existing.comment || "").length) { existing.comment = text; Object.assign(existing, sentiment(text)); } // keep the fuller text
        existing.reactions = Math.max(existing.reactions || 0, r.total);
      } else if (rows.size < CONFIG.maxItems) {
        if (textKey) byText.set(textKey, postKey);
        rows.set(postKey, { type: "post", post_id: postKey, post_url: url, time_text: linkEl ? clean(linkEl.innerText) : "", author, comment: text,
          reactions: r.total, like: r.like, love: r.love, care: r.care, haha: r.haha, wow: r.wow, sad: r.sad, angry: r.angry,
          ...sentiment(text), scraped_at: now });
      }
    }
    const postRow = rows.get(postKey);
    const postUrl = postRow ? postRow.post_url : url;

    // comments and replies inside this post
    post.querySelectorAll('div[role="article"]').forEach((c) => {
      if (!isCommentEl(c)) return;
      const own = (el) => el.closest('div[role="article"]') === c;
      const label = (c.getAttribute("aria-label") || "").replace(/^(comment|reply)\s+by\s+/i, "");
      const linkWithName = [...c.querySelectorAll('a[role="link"]')].find((a) => own(a) && clean(a.innerText));
      const name = clean(linkWithName ? linkWithName.innerText : label);
      const bodies = [...c.querySelectorAll('div[dir="auto"]')]
        .filter(own)
        .map((d) => clean(d.innerText))
        .filter((t) => t && t !== name && !UI_WORDS.test(t));
      const body = bodies.sort((a, b) => b.length - a.length)[0] || "";
      if (!body) return;
      const key = "cmt_" + hash(postKey + "|" + name + "|" + body);
      if (rows.has(key) || rows.size >= CONFIG.maxItems) return;
      const rc = reactionInfo(c, () => true);
      const timeEl = c.querySelector('a[href*="comment_id"]');
      rows.set(key, { type: /^reply/i.test(c.getAttribute("aria-label") || "") ? "reply" : "comment", post_id: postKey, post_url: postUrl,
        time_text: timeEl ? clean(timeEl.innerText) : "", author: who(name), comment: body,
        reactions: rc.total, like: "", love: "", care: "", haha: "", wow: "", sad: "", angry: "", ...sentiment(body), scraped_at: now });
    });
    return postKey;
  };

  // returns [{el, key}] for the post blocks currently readable
  const collect = (forced) => {
    const now = new Date().toISOString();
    const out = [];
    const blocks = findContainers();
    lastBlocks = blocks.length;
    blocks.forEach((el) => {
      try {
        const key = processPost(el, now, forced);
        if (key) out.push({ el, key });
      } catch (e) { errors++; if (errors <= 3) console.error("Collector error:", e); }
    });
    return out;
  };

  // ---------- export ----------
  const COLUMNS = ["type", "post_id", "post_url", "time_text", "author", "comment", "reactions", "like", "love", "care", "haha", "wow", "sad", "angry", "label", "score", "scraped_at"];
  const csvCell = (v) => {
    if (typeof v === "number") return String(v);
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const save = (name, mime, data) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: mime }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const settle = () => { if (!running && !getDialog()) collect(); };
  const downloadCsv = (tag = "") => {
    settle();
    const header = COLUMNS.map((c) => (c === "label" ? "sentiment" : c)).join(",");
    const lines = [...rows.values()].map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","));
    save(`fb-feedback-${tag}${stamp()}.csv`, "text/csv;charset=utf-8", "\ufeff" + [header, ...lines].join("\r\n"));
    lastSaved = rows.size;
  };
  const downloadJson = () => {
    settle();
    save(`fb-feedback-${stamp()}.json`, "application/json", JSON.stringify([...rows.values()], null, 2));
  };
  const autosave = () => {
    if (CONFIG.autoDownloadEvery > 0 && rows.size - lastSaved >= CONFIG.autoDownloadEvery) downloadCsv("autosave-");
  };

  // ---------- comment windows ----------
  const scrollerFor = (root) => {
    if (!root || root === document.body || !root.matches('div[role="dialog"]')) return null; // null = window
    return [...root.querySelectorAll("div")].find((d) => d.scrollHeight > d.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)) || null;
  };
  const scrollOnce = (el) => {
    if (el) el.scrollBy(0, el.clientHeight * CONFIG.scrollRatio);
    else window.scrollBy(0, window.innerHeight * CONFIG.scrollRatio);
  };

  // switch "Most relevant" to "All comments" if that menu is available
  const showAllComments = async (root) => {
    try {
      const btn = [...root.querySelectorAll('div[role="button"], span[role="button"]')]
        .find((b) => inScope(b) && /^(most relevant|top comments)$/i.test((b.innerText || "").trim()));
      if (!btn) return;
      btn.click();
      await sleep(700);
      const item = [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')]
        .find((m) => /^all comments/i.test((m.innerText || "").trim()));
      if (item) { item.click(); await sleep(1200); }
    } catch (e) { /* ignore */ }
  };

  const harvest = async (root, forcedKey, maxTicks, inlinePost) => {
    await showAllComments(inlinePost || root);
    const el = inlinePost ? null : scrollerFor(root);
    const grab = () => {
      if (inlinePost) processPost(inlinePost, new Date().toISOString(), forcedKey);
      else collect(forcedKey);
    };
    let idle = 0;
    for (let i = 0; i < maxTicks && running; i++) {
      if (root && root.matches && root.matches('div[role="dialog"]') && !root.isConnected) break; // window was closed
      const before = rows.size;
      expandAll(true, inlinePost);
      grab();
      if (!inlinePost) scrollOnce(el);
      await sleep(CONFIG.commentTickMs);
      grab();
      idle = rows.size === before ? idle + 1 : 0;
      render();
      if (idle >= CONFIG.commentIdleTicks || rows.size >= CONFIG.maxItems) break;
    }
  };

  const pressEscape = () =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));

  const closeWindow = async (dlg, navigated) => {
    if (navigated) { history.back(); await sleep(2000); return; }
    const x = dlg && dlg.querySelector('[aria-label="Close"]');
    if (x) x.click(); else pressEscape();
    await sleep(800);
    if (getDialog()) { pressEscape(); await sleep(800); }
  };

  const findCommentButton = (post) => {
    const btns = [...post.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]')].filter((b) => {
      if (!inScope(b)) return false;
      const a = b.closest('div[role="article"]');
      return !(a && isCommentEl(a)); // ignore buttons that belong to comments
    });
    const counter = btns.find((b) => /^[\d.,KkMm]+\s*comments?$/i.test((b.innerText || "").trim()));
    if (counter) return counter;
    const action = btns.find((b) => /^(leave a comment|comment)$/i.test((b.getAttribute("aria-label") || "").trim()) || /^comment$/i.test((b.innerText || "").trim()));
    if (action) return action;
    // last resort: the post's timestamp link opens the post (window or page) just like a person clicking it
    return [...post.querySelectorAll('a[role="link"]')].find((a) => {
      const t = (a.innerText || "").trim();
      const art = a.closest('div[role="article"]');
      return inScope(a) && t && t.length <= 24 && TIME_RE.test(t) && !(art && isCommentEl(art));
    }) || null;
  };

  // opens the post's comments (window, page, or inline), reads them, closes. Returns "ok" | "navigated" | "skip"
  const readPostComments = async (post, key) => {
    const btn = findCommentButton(post);
    if (!btn) { stats.missing++; render(); console.warn("[collector] no comment button or timestamp link found for a post"); return "skip"; }
    stats.found++;
    const href = location.href;
    btn.scrollIntoView({ block: "center" });
    await sleep(600);
    const before = rows.size;
    btn.click();
    await sleep(2200);
    const dlg = getDialog();
    const navigated = !dlg && location.href !== href;
    const mode = dlg ? "window" : navigated ? "page" : "inline";
    if (mode === "inline") await harvest(null, key, 8, post);
    else await harvest(dlg || roots()[0], key, CONFIG.maxCommentTicks);
    if (mode !== "inline") await closeWindow(dlg, navigated);
    console.log(`[collector] ${mode} mode: +${rows.size - before} rows`);
    return navigated ? "navigated" : "ok";
  };

  const deepPass = async () => {
    if (getDialog()) return;
    let n = 0;
    for (const { el, key } of collect()) {
      if (!running || n >= CONFIG.maxPostsPerPass) break;
      const row = rows.get(key);
      if (!row || row.type !== "post" || deepDone.has(key)) continue;
      deepDone.add(key);
      n++;
      status.textContent = `Reading comments of post ${deepDone.size}...`;
      try {
        const res = await readPostComments(el, key);
        if (res === "navigated") break; // page changed, old elements are stale
      } catch (e) { errors++; if (errors <= 3) console.error("Comment read error:", e); }
    }
  };

  // ---------- main loop ----------
  const finish = (msg) => { running = false; refreshToggle(); status.textContent = msg; render(); };

  const run = async () => {
    if (running) return;
    running = true;
    idleTicks = 0;
    refreshToggle();
    status.textContent = "Collecting...";
    try {
      if (isSinglePost()) {
        collect();
        await harvest(roots()[0], undefined, 200);
        finish(rows.size ? "Done with this post. Download your files." : "Done, but nothing collected. Check the console.");
        return;
      }
      while (running) {
        const before = rows.size;
        expandAll(false);
        collect();
        if (CONFIG.openComments) await deepPass();
        if (!running) break;
        window.scrollBy(0, window.innerHeight * CONFIG.scrollRatio);
        await sleep(CONFIG.tickMs);
        idleTicks = rows.size === before ? idleTicks + 1 : 0;
        render();
        autosave();
        if (idleTicks >= CONFIG.idleTicksToStop || rows.size >= CONFIG.maxItems) {
          finish(rows.size ? "Done: nothing new is loading. Download your files." : `Done, but nothing collected (${lastBlocks} blocks seen). Check the console.`);
          return;
        }
      }
    } catch (e) {
      errors++; console.error("Collector error:", e);
    } finally {
      if (running) { running = false; refreshToggle(); }
      if (!/^Done/.test(status.textContent)) status.textContent = "Paused";
    }
  };
  // Watch mode: you open a post's comments yourself, the script reads them automatically.
  const dialogKey = (dlg) => {
    const m = dlg.querySelector(MSG_SEL);
    const k = m ? tKey(clean(m.innerText)) : "";
    return (k && byText.get(k)) || undefined;
  };
  const watch = async () => {
    if (running) return;
    running = true;
    refreshToggle();
    const seen = new Set();
    try {
      while (running) {
        const dlg = getDialog();
        if (dlg) {
          const m = dlg.querySelector(MSG_SEL);
          const id = (m && tKey(clean(m.innerText))) || "dialog";
          if (!seen.has(id)) {
            seen.add(id);
            status.textContent = "Reading this post's comments...";
            await harvest(dlg, dialogKey(dlg), CONFIG.maxCommentTicks);
            status.textContent = "Comments saved. Close it and open the next post.";
          }
        } else {
          expandAll(false);
          collect();
          status.textContent = "Watching: scroll the feed and open a post's comments.";
        }
        render();
        autosave();
        await sleep(1000);
      }
    } catch (e) { errors++; console.error("Watch error:", e); }
    finally { running = false; refreshToggle(); if (!/^Done/.test(status.textContent)) status.textContent = "Paused"; }
  };
  const stop = () => { running = false; };

  // ---------- panel ----------
  const panel = document.createElement("div");
  panel.id = "fbc-panel";
  panel.style.cssText = "position:fixed;top:70px;right:16px;z-index:2147483647;width:250px;padding:12px;border-radius:12px;background:#1c1e21;color:#fff;font:13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45)";
  const title = document.createElement("div");
  title.textContent = "FB Feedback Collector v2";
  title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:4px";
  const counts = document.createElement("div");
  const status = document.createElement("div");
  status.style.cssText = "opacity:.7;font-size:12px;margin-bottom:8px";
  status.textContent = "Ready";
  const mkBtn = (label, color, fn) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = `display:block;width:100%;margin-top:6px;padding:8px;border:0;border-radius:8px;cursor:pointer;color:#fff;font-weight:600;background:${color}`;
    b.addEventListener("click", fn);
    return b;
  };
  const toggle = mkBtn("Start auto-scroll", "#c0392b", () => (running ? stop() : run()));
  const refreshToggle = () => { toggle.textContent = running ? "Pause" : "Start auto-scroll"; };
  const watchBtn = mkBtn("Watch mode (I open comments)", "#e67e22", () => watch());
  const cmtBtn = mkBtn("", "#8e44ad", () => {
    CONFIG.openComments = !CONFIG.openComments;
    cmtBtn.textContent = "Read comments: " + (CONFIG.openComments ? "ON" : "OFF");
  });
  cmtBtn.textContent = "Read comments: " + (CONFIG.openComments ? "ON" : "OFF");
  const scanBtn = mkBtn("Scan what's on screen", "#2d6cdf", () => {
    if (running) return;
    collect(); render(); status.textContent = `Scanned ${lastBlocks} post block(s) on screen`;
  });
  const debugDump = () => {
    const cut = (x, n = 60) => String(x || "").replace(/\s+/g, " ").trim().slice(0, n);
    const blocks = findContainers().slice(0, 3);
    const out = [`path: ${location.pathname}`, `post blocks: ${blocks.length}`, `dialog open: ${!!getDialog()}`];
    blocks.forEach((b, i) => {
      out.push(`\n=== POST ${i + 1}: <${b.tagName.toLowerCase()}> role=${b.getAttribute("role")} aria-label=${cut(b.getAttribute("aria-label"), 30)}`);
      out.push("-- buttons:");
      b.querySelectorAll('[role="button"]').forEach((x) => out.push(`  <${x.tagName.toLowerCase()}> text="${cut(x.innerText, 40)}" aria="${cut(x.getAttribute("aria-label"), 40)}"`));
      out.push("-- links:");
      b.querySelectorAll("a[href]").forEach((a) => out.push(`  text="${cut(a.innerText, 25)}" href="${cut((a.getAttribute("href") || "").split("?")[0], 80)}"`));
      out.push("-- aria-labels:");
      b.querySelectorAll("[aria-label]").forEach((x) => out.push(`  ${cut(x.getAttribute("aria-label"), 60)}`));
    });
    save(`fb-debug-${stamp()}.txt`, "text/plain;charset=utf-8", out.join("\n"));
    status.textContent = "Saved a debug .txt (no post text inside)";
  };
  const debugBtn = mkBtn("Debug: save page structure", "#7f8c8d", debugDump);
  const csvBtn = mkBtn("Download CSV", "#2e9e44", () => downloadCsv());
  const jsonBtn = mkBtn("Download JSON", "#44484d", downloadJson);
  const warn = (e) => { if (rows.size) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", warn);
  const closeBtn = mkBtn("Close and reset", "#44484d", () => {
    stop(); panel.remove(); window.removeEventListener("beforeunload", warn); delete window.__fbFeedbackCollector;
  });
  panel.append(title, counts, status, toggle, watchBtn, cmtBtn, scanBtn, debugBtn, csvBtn, jsonBtn, closeBtn);
  document.body.appendChild(panel);

  function render() {
    const v = [...rows.values()];
    const posts = v.filter((r) => r.type === "post").length;
    counts.textContent = `Posts: ${posts} | Comments: ${v.length - posts}` + (errors ? ` | Errors: ${errors}` : "") +
      (stats.found + stats.missing ? ` | Comment link: ${stats.found}/${stats.found + stats.missing}` : "");
  }
  render();
  console.log("FB Feedback Collector v2 ready. Use the panel on the right.");
})();
