/* Road to February: the app. Hash routing, no build step, works offline. */
(function () {
  const R = window.RTF, S = window.RTFStore;
  const { WEEKS, BLOCKS, HABITS, TRACKS, PRIMERS, CONCEPTS, RECORDS } = R;

  /* ================================================================ utils */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Escape, then turn [label](url) and [label](%token%) into links.
  function md(s) {
    return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const h = href.replace(/^%(.+)%$/, (x, t) => R.resolve(t.replace(/&amp;/g, "&")));
      return `<a href="${h}" target="_blank" rel="noopener">${label}</a>`;
    });
  }
  const plain = s => String(s || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const DAY = 864e5;
  const pad = n => String(n).padStart(2, "0");
  const dkey = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseD = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtD = (d, o) => d.toLocaleDateString("en-AU", o || { day: "numeric", month: "short" });
  const mins = m => m < 60 ? m + " min" : (Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : ""));
  const hrs = m => (Math.round(m / 6) / 10).toFixed(1).replace(/\.0$/, "") + "h";
  const uid = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ago = t => {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 45) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago"; return Math.round(s / 86400) + "d ago";
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const I = {
    today: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="14" height="13"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/></svg>',
    plan: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 5h10M7 10h10M7 15h10M3 5h1.5M3 10h1.5M3 15h1.5"/></svg>',
    brain: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3.5h9l3 3V17H4z"/><path d="M7 9h6M7 12h6M7 6h3"/></svg>',
    deals: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h12l-3-3M17 13H5l3 3"/></svg>',
    firms: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17h14M5 17V7h10v10M8 10h1M11 10h1M8 13h1M11 13h1M7 7V3.5h6V7"/></svg>',
    primers: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h5a2 2 0 012 2v11a2 2 0 00-2-2H3zM17 4h-5a2 2 0 00-2 2v11a2 2 0 012-2h5z"/></svg>',
    bench: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17h14M5 17v-5M9 17V8M13 17v-7M17 17V4"/></svg>',
    std: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14"/><path d="M3 8h14M3 12.5h14M8 3v14"/></svg>',
    lib: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3v14M8 3v14M12 4l4 12.5"/></svg>',
    settings: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h9M15 6h2M3 14h2M8 14h9"/><rect x="12" y="4" width="3" height="4"/><rect x="5" y="12" width="3" height="4"/></svg>',
    more: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="9" width="2.5" height="2.5"/><rect x="8.75" y="9" width="2.5" height="2.5"/><rect x="14.5" y="9" width="2.5" height="2.5"/></svg>',
    search: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="5"/><path d="M12.5 12.5L17 17"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l10 10M15 5L5 15"/></svg>',
    up: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12l5-5 5 5"/></svg>',
    down: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8l5 5 5-5"/></svg>',
    back: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4l-6 6 6 6"/></svg>',
    review: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="11" height="11"/><path d="M6 3h11v11"/></svg>',
    maths: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h5M6.5 3.5v5M11.5 6h5M4 14.5h5M11.5 12.5h5M11.5 16h5"/></svg>',
    cases: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6.5" width="14" height="10"/><path d="M7.5 6.5V4h5v2.5M3 11h14"/></svg>',
    companies: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3.5h12v13H4zM7 7h6M7 10h6M7 13h3"/></svg>',
    markets: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 16.5h14M4 13l4-4 3 3 5-6"/></svg>',
    after: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10h13M11 5l5 5-5 5"/></svg>',
    logs: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 5h14v3H3zM3 10.5h14v3H3zM5 16h10"/></svg>',
    plus: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 4v12M4 10h12"/></svg>'
  };

  /* ================================================================ plan maths */
  const TASKS = WEEKS.flatMap(w => w.tasks);
  const TASK = Object.fromEntries(TASKS.map(t => [t.id, t]));
  const ALL_STEPS = TASKS.reduce((a, t) => a + t.s.length, 0);

  function startDate() {
    const k = S.get("settings", "start") || "2026-09-28";
    return parseD(k);
  }
  function todayD() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function weekStart(n) { const d = startDate(); d.setDate(d.getDate() + (n - 1) * 7); return d; }
  function weekEnd(n) { const d = weekStart(n); d.setDate(d.getDate() + 6); return d; }
  function currentWeek() {
    const diff = Math.floor((todayD() - startDate()) / DAY);
    if (diff < 0) return { n: 1, before: true };
    const n = Math.floor(diff / 7) + 1;
    return n > WEEKS.length ? { n: WEEKS.length, after: true } : { n };
  }
  const blockOf = n => BLOCKS.find(b => n >= b.r[0] && n <= b.r[1]);
  const endDate = () => { const d = weekEnd(WEEKS.length); d.setDate(d.getDate() + 1); return d; };

  const stepDone = id => S.get("steps", id) === 1;
  function tProg(t) { const d = t.stepIds.filter(stepDone).length; return { d, n: t.s.length }; }
  function wProg(w) { let d = 0, n = 0; w.tasks.forEach(t => { const p = tProg(t); d += p.d; n += p.n; }); return { d, n }; }
  function allProg() { let d = 0; TASKS.forEach(t => (d += tProg(t).d)); return { d, n: ALL_STEPS }; }
  function wRemaining(w) { return w.tasks.reduce((a, t) => { const p = tProg(t); return a + Math.round(t.m * (1 - p.d / p.n)); }, 0); }
  const pct = p => (p.n ? Math.round(p.d / p.n * 100) : 0);

  function stBox(p) {
    const s = p.d === 0 ? 0 : p.d === p.n ? 2 : 1;
    return `<span class="st s${s}" style="--p:${s === 1 ? pct(p) : 0}%" aria-hidden="true"></span>`;
  }
  function statusText(p) { return p.d === 0 ? "Not started" : p.d === p.n ? "Done" : "In progress"; }

  /* ================================================================ router */
  function parseRoute() {
    let h = location.hash.replace(/^#\/?/, "").split("#")[0];
    let q = {};
    const qi = h.indexOf("?");
    if (qi >= 0) { new URLSearchParams(h.slice(qi + 1)).forEach((v, k) => (q[k] = v)); h = h.slice(0, qi); }
    const parts = h.split("/").filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || "today", a: parts[1], b: parts[2], q, path: parts.join("/") };
  }
  const withTask = (base, id) => "#/" + base + "?t=" + id;
  function go(h) { if (location.hash !== h) location.hash = h; else render(); }
  let route = parseRoute();

  /* ================================================================ shell */
  const NAV = [
    [null, [["today", "Today", I.today], ["plan", "Plan", I.plan], ["review", "Review", I.review]]],
    ["Practice", [["maths", "Maths", I.maths], ["cases", "Cases", I.cases], ["benchmark", "Benchmark", I.bench]]],
    ["Logs", [["brain", "Brain", I.brain], ["deals", "Deals", I.deals], ["companies", "Companies", I.companies], ["markets", "Markets", I.markets], ["firms", "Firms", I.firms]]],
    ["Reference", [["primers", "Primers", I.primers], ["standards", "Standards", I.std], ["library", "Library", I.lib], ["after", "After February", I.after]]]
  ];
  const LOGS = ["brain", "deals", "cases", "companies", "markets", "firms"];
  function navCount(k) {
    if (k === "brain") return brainList().length;
    if (k === "review") { const n = reviewDue().length + reviewNewAllowance(); return n || ""; }
    if (RECORDS[k]) return S.all(k).length;
    return "";
  }
  function shell() {
    document.body.innerHTML = `
      <aside class="side" aria-label="Navigation">
        <a class="brand" href="#/today"><b>Road to February</b><span id="brandSub"></span></a>
        <button class="search-btn" data-act="search">${I.search.replace("<svg", '<svg width="14" height="14"')}<span>Search</span><kbd>⌘K</kbd></button>
        <nav id="sideNav"></nav>
        <div class="side-foot"><span class="dot" id="syncDot"></span><span id="syncTxt">Saved on this device</span><a href="#/settings">Settings</a></div>
      </aside>
      <header class="topbar">
        <span class="tt" id="topTitle">Road to February</span>
        <span class="sync-mini"><span class="dot" id="syncDotM"></span></span>
        <button class="icon-btn" data-act="search" aria-label="Search">${I.search}</button>
      </header>
      <main class="main" id="main" tabindex="-1"></main>
      <nav class="tabbar" id="tabbar" aria-label="Sections"></nav>
      <div class="scrim" id="scrim" hidden></div>
      <aside class="peek" id="peek" aria-label="Task" hidden></aside>
      <div id="palRoot"></div>`;
  }

  function renderNav() {
    const cw = currentWeek().n;
    const active = route.name === "week" ? "plan" : route.name;
    let h = NAV.map(([label, items]) => (label ? `<span class="nav-label">${label}</span>` : "") + items.map(([k, l, ic]) => {
      const cnt = navCount(k);
      return `<a class="nav-a" href="#/${k}" ${active === k && route.name !== "week" ? 'aria-current="page"' : ""}>${ic}<span>${l}</span>${cnt !== "" ? `<span class="count">${cnt}</span>` : ""}</a>`;
    }).join("")).join("");
    h += `<span class="nav-label">Weeks</span>`;
    h += WEEKS.map(w => {
      const p = wProg(w);
      const cur = route.name === "week" && +route.a === w.n;
      return `<a class="nav-wk${w.n === cw ? " now" : ""}${p.d === p.n ? " done" : ""}" href="#/week/${w.n}" ${cur ? 'aria-current="page"' : ""} title="${esc(w.title)}"><span class="n">${w.n}</span><span class="t">${esc(w.title)}</span></a>`;
    }).join("");
    $("#sideNav").innerHTML = h;
    const tabs = [["today", "Today", I.today], ["plan", "Plan", I.plan], ["review", "Review", I.review], ["logs", "Logs", I.logs], ["more", "More", I.more]];
    const tabActive = route.name === "week" ? "plan" : [...LOGS, "logs"].includes(route.name) ? "logs" : ["today", "plan", "review"].includes(route.name) ? route.name : "more";
    $("#tabbar").innerHTML = tabs.map(([k, l, ic]) => `<a href="#/${k}" ${tabActive === k ? 'aria-current="page"' : ""}>${ic}<span>${l}</span></a>`).join("");
    $("#brandSub").textContent = fmtD(startDate(), { day: "numeric", month: "short", year: "numeric" }) + " to " + fmtD(weekEnd(WEEKS.length), { day: "numeric", month: "short", year: "numeric" });
  }

  function renderSync() {
    const st = S.status();
    let cls = "", txt = "Saved on this device";
    if (st.mode === "busy") { cls = "busy"; txt = "Syncing"; }
    else if (st.mode === "ok") { cls = "ok"; txt = "Synced " + ago(st.at); }
    else if (st.mode === "err") { cls = "err"; txt = "Offline, saved on this device"; }
    else if (st.mode === "idle") { txt = "Connecting"; }
    ["#syncDot", "#syncDotM"].forEach(s => { const el = $(s); if (el) el.className = "dot " + cls; });
    const t = $("#syncTxt"); if (t) t.textContent = txt;
    const ss = $("#settingsSync"); if (ss) ss.textContent = txt + (st.error ? " (" + st.error + ")" : "");
  }

  /* ================================================================ shared bits */
  function taskRow(t, base, opts) {
    const p = tProg(t);
    const sel = route.q.t === t.id;
    return `<a class="trow${p.d === p.n ? " done" : ""}" href="${withTask(base, t.id)}" data-task="${t.id}" ${sel ? 'aria-current="true"' : ""}>
      ${stBox(p)}
      <span class="trow-t">${esc(t.t)}</span>
      <span class="trow-m${opts && opts.week ? " wk" : ""}${opts && opts.noTrack ? " nt" : ""}">${opts && opts.week ? `<span>Week ${t.week}</span>` : ""}${opts && opts.noTrack ? "" : `<span class="trk trk-${t.k}">${TRACKS[t.k].short}</span>`}<span>${mins(t.m)}</span><span class="frac">${p.d}/${p.n}</span></span>
    </a>`;
  }
  function bar(p, thin) { return `<div class="bar${thin ? " thin" : ""}"><i style="width:${pct(p)}%"></i></div>`; }
  function sec(title, aside, body) {
    return `<section class="sec"><div class="sec-h"><h2>${title}</h2>${aside ? `<span class="aside">${aside}</span>` : ""}</div>${body}</section>`;
  }
  function setTitle(t) { document.title = t ? t + " · Road to February" : "Road to February"; const el = $("#topTitle"); if (el) el.textContent = t || "Road to February"; }

  /* ================================================================ Today */
  function viewToday() {
    const cw = currentWeek(), w = WEEKS[cw.n - 1], b = blockOf(w.n);
    const ap = allProg(), wp = wProg(w);
    const t = todayD();
    const daysLeft = Math.max(0, Math.ceil((endDate() - t) / DAY));
    setTitle("Today");
    const lead = cw.before ? `The plan starts on ${fmtD(startDate(), { weekday: "long", day: "numeric", month: "long" })}.`
      : cw.after ? "The 22 weeks are done. Application season is next." : "";
    const open = w.tasks.filter(x => { const p = tProg(x); return p.d < p.n; });
    const behind = cw.before ? [] : TASKS.filter(x => x.week < w.n && tProg(x).d < x.s.length);
    const due = reviewDue().length, fresh = reviewNewAllowance();
    const logged = weekLogged(w);
    const done = w.tasks.filter(x => { const p = tProg(x); return p.d === p.n; });
    return `<div class="page">
      <p class="eyebrow">${fmtD(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      <h1>Week ${w.n}: ${esc(w.title)}</h1>
      <p class="sub">${esc(b.name)} · ${fmtD(weekStart(w.n))} to ${fmtD(weekEnd(w.n))} · ${hrs(wRemaining(w))} of ${hrs(w.minutes)} left this week${logged ? ` · ${hrs(logged)} logged` : ""} · ${daysLeft} days to ${fmtD(endDate(), { day: "numeric", month: "long" })}</p>
      ${lead ? `<p class="lede">${lead}</p>` : ""}
      <div class="meter">${bar(ap)}<div class="meter-row"><span><b>${pct(ap)}%</b> of the plan</span><span>${ap.d} of ${ap.n} steps</span></div></div>

      ${sec("This week", `<a href="#/week/${w.n}">Open week ${w.n}</a>`,
        `<div class="rows">${open.map(x => taskRow(x, "today")).join("") || `<div class="empty">Every task this week is done. Get ahead on <a class="link" href="#/week/${Math.min(22, w.n + 1)}">next week</a>.</div>`}</div>
         ${done.length ? `<div class="group-h"><span class="muted">Done this week</span><span class="muted">${done.length}</span></div><div class="rows">${done.map(x => taskRow(x, "today")).join("")}</div>` : ""}`)}

      ${behind.length ? sec("Carried over", `${behind.length} unfinished from earlier weeks`, `<div class="rows">${behind.slice(0, 8).map(x => taskRow(x, "today", { week: true })).join("")}</div>${behind.length > 8 ? `<p class="note">${behind.length - 8} more on the <a class="link" href="#/plan">Plan page</a>. If a light week has fallen behind, it's fine to leave optional reading and keep the models and cases.</p>` : ""}`) : ""}

      ${sec("Review", `<a href="#/review">Open review</a>`, `<a class="li" href="#/review" style="border-top:1px solid var(--rule)"><div class="li-top"><span class="li-t">${due ? `${due} card${due > 1 ? "s" : ""} due` : "Nothing due"}${fresh ? ` and ${fresh} new` : ""}</span><span class="li-m">${reviewPool().length} unlocked · ${reviewMastered()} mastered</span></div><div class="li-s">Technical questions from the weeks you've covered, spaced so each comes back just before you'd forget it.</div></a>`)}

      ${t.getDay() === 0 && !cw.before ? `<p class="callout" style="margin-top:36px">It's Sunday, so write this week's company one-pager in <a class="link" href="#/companies">Companies</a>, then do the <a class="link" href="#/week/${w.n}#reflection">weekly review</a> and read next week's briefing.</p>` : ""}

      ${sec("Daily habits", habitStreakText(), habitsBlock())}

      ${sec("Zetamac", `<a href="${R.U.zeta}" target="_blank" rel="noopener">Open Zetamac</a>`, zetBlock())}

      ${sec("This week's hard question", `<a href="#/week/${w.n}#answer">Answer it</a>`, `<p class="callout now">${md(w.push)}</p>`)}
    </div>`;
  }

  function habitDone(dk, hid) { return !!S.get("habits", dk + "|" + hid); }
  const habitDue = (h, d) => h.day == null || d.getDay() === h.day;
  function habitsFor(d) { return HABITS.filter(h => habitDue(h, d)); }
  function habitStreakText() {
    // A day counts if every habit due that day was ticked. Today doesn't break the streak until it's over.
    let n = 0; const d = todayD();
    const full = x => habitsFor(x).every(h => habitDone(dkey(x), h.id));
    if (full(d)) n++;
    d.setDate(d.getDate() - 1);
    while (d >= startDate() && full(d)) { n++; d.setDate(d.getDate() - 1); }
    return n ? `${n}-day streak` : "";
  }
  function habitsBlock() {
    const t = todayD(), tk = dkey(t);
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(t); d.setDate(d.getDate() - i); days.push(d); }
    return `<div class="rows">${HABITS.map(h => {
      const due = habitDue(h, t);
      const grid = days.map(d => {
        const applies = habitDue(h, d);
        const on = habitDone(dkey(d), h.id);
        return `<i class="${!applies ? "off" : on ? "on" : ""}${dkey(d) === tk ? " today" : ""}" title="${fmtD(d)}"></i>`;
      }).join("");
      return `<label class="habit"${due ? "" : ' style="opacity:.55"'}>
        <input type="checkbox" data-habit="${h.id}" ${habitDone(tk, h.id) ? "checked" : ""} ${due ? "" : "disabled"}>
        <span><span class="ht">${esc(h.t)}</span><span class="when">${esc(h.when)}${due ? "" : " · not due today"}${h.link && due ? ` · <a class="link" href="${h.link}">open</a>` : ""}</span></span>
        <span class="hgrid" aria-hidden="true">${grid}</span>
      </label>`;
    }).join("")}</div><p class="note">The squares show the last fourteen days. The seven questions for a headline are on the <a class="link" href="#/plan#questions">Plan page</a>.</p>`;
  }

  function zetScores() { return S.all("zet").map(([id, v]) => ({ id, ...v })).sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.at - b.at); }
  function zetBlock() {
    const sc = zetScores();
    const best = sc.reduce((m, x) => Math.max(m, x.s), 0);
    const base = sc[0], last = sc[sc.length - 1];
    let spark = "";
    if (sc.length > 1) {
      const W = 600, H = 56, lo = Math.min(...sc.map(x => x.s)), hi = Math.max(...sc.map(x => x.s)), rng = Math.max(1, hi - lo);
      const pts = sc.map((x, i) => [i / (sc.length - 1) * W, H - 4 - (x.s - lo) / rng * (H - 8)]);
      spark = `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Zetamac scores over time"><path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join(" L")}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
    }
    return `<form class="inline-form" data-form="zet"><input class="in" name="s" type="number" inputmode="numeric" min="0" max="200" placeholder="Score" aria-label="Zetamac score" required><button class="btn" type="submit">Log score</button></form>
      <div class="stats">
        <div><b>${base ? base.s : "–"}</b><span>baseline</span></div>
        <div><b>${sc.length ? best : "–"}</b><span>best</span></div>
        <div><b>${last ? last.s : "–"}</b><span>latest</span></div>
        <div><b>${base && last && sc.length > 1 ? (last.s - base.s >= 0 ? "+" : "") + (last.s - base.s) : "–"}</b><span>since baseline</span></div>
      </div>${spark}
      ${sc.length ? `<p class="note">Last logged ${esc(fmtD(parseD(last.d)))}. <a class="link" href="#/zetamac">All scores</a></p>` : `<p class="note">Default settings, two minutes. Log your best of three.</p>`}`;
  }
  function viewZetamac() {
    setTitle("Zetamac scores");
    const sc = zetScores().reverse();
    return `<div class="page"><div class="crumbs"><a href="#/today">Today</a><span>/</span><span>Zetamac</span></div>
      <h1>Zetamac scores</h1>${zetBlock()}
      ${sec("History", sc.length + " scores", sc.length ? `<table class="simple"><thead><tr><th>Date</th><th class="r">Score</th><th></th></tr></thead><tbody>${sc.map(x => `<tr><td>${esc(fmtD(parseD(x.d), { weekday: "short", day: "numeric", month: "short" }))}</td><td class="r num">${x.s}</td><td class="r"><button class="btn ghost" data-act="zet-del" data-id="${x.id}">Delete</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No scores yet.</div>`)}
    </div>`;
  }

  /* ================================================================ Plan */
  function viewPlan() {
    setTitle("Plan");
    const cw = currentWeek().n;
    const rows = [];
    BLOCKS.forEach(b => {
      const ws = WEEKS.filter(w => w.n >= b.r[0] && w.n <= b.r[1]);
      const m = ws.reduce((a, w) => a + w.minutes, 0);
      rows.push(`<tr class="block-row"><td colspan="6">${esc(b.name)}<span>Weeks ${b.r[0]}–${b.r[1]} · ${hrs(m)}</span></td></tr>`);
      ws.forEach(w => {
        const p = wProg(w);
        rows.push(`<tr class="link-row${w.n === cw ? " now" : ""}" data-href="#/week/${w.n}">
          <td class="n">${w.n}</td>
          <td class="t"><a href="#/week/${w.n}">${esc(w.title)}</a>${w.lite ? ' <span class="tag lite">light</span>' : ""}${w.n === cw ? ' <span class="tag now">this week</span>' : ""}</td>
          <td class="d">${fmtD(weekStart(w.n))} – ${fmtD(weekEnd(w.n))}</td>
          <td class="co muted">${esc(w.co || "")}</td>
          <td class="h num muted">${hrs(w.minutes)}</td>
          <td class="pr"><span class="frac">${p.d}/${p.n}</span>${bar(p, true)}</td>
        </tr>`);
      });
    });
    const phases = BLOCKS.map(b => {
      const cls = cw > b.r[1] ? "past" : cw >= b.r[0] ? "on" : "";
      return `<div class="ph ${cls}"><b>${esc(b.name)}</b><span>Weeks ${b.r[0]}–${b.r[1]}</span></div>`;
    }).join("");
    const total = WEEKS.reduce((a, w) => a + w.minutes, 0);
    return `<div class="page wide">
      <p class="eyebrow">${WEEKS.length} weeks · ${hrs(total)} of planned work · ${TASKS.length} tasks · ${ALL_STEPS} steps</p>
      <h1>The plan</h1>
      <p class="lede">The target is to be able to take an unfamiliar company, deal, industry or strategic problem and work out what matters. Finance, Excel and slides, and consulting run together every week on the same company, so Woolworths in Week 2 is a three-statement exercise, a formatting exercise and a case about why profit fell.</p>
      <div class="phases">${phases}</div>

      ${sec("Week by week", "", `<table class="wtable"><thead><tr><th>#</th><th>Week</th><th>Dates</th><th>Company</th><th>Time</th><th>Progress</th></tr></thead><tbody>${rows.join("")}</tbody></table>
      <p class="note">Weeks 5 to 7 are light on the assumption that Semester 2 exams run late October to mid November, and you can move the start date in <a class="link" href="#/settings">Settings</a>. The plan ends in February because penultimate-year IB applications in Australia usually open around May for Macquarie and June for the bulge brackets.</p>`)}

      ${sec("Six capabilities", "", `<div class="cols">${R.CAPABILITIES.map(([h, p]) => `<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>`)}

      ${sec("One company, four exercises", "", `<div class="cols">${R.STREAMS.map(([h, p]) => `<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>`)}

      <section class="sec" id="questions"><div class="sec-h"><h2>Seven questions for any headline</h2></div>
        <ol class="olist">${R.SEVEN_QUESTIONS.map(q => `<li>${esc(q)}</li>`).join("")}</ol></section>

      ${sec("A serious week, by activity", "20 hours", `<table class="simple"><thead><tr><th>Activity</th><th class="r">Hours</th></tr></thead><tbody>${R.ALLOCATION.map(([a, h]) => `<tr><td>${esc(a)}</td><td class="r num">${h}</td></tr>`).join("")}</tbody></table>
      <p class="note">Ten focused hours a week still compounds. The benchmark on the <a class="link" href="#/benchmark">Benchmark page</a> is what all of this is building toward.</p>`)}
    </div>`;
  }

  /* ================================================================ Week */
  function viewWeek(n) {
    const w = WEEKS[n - 1];
    if (!w) return notFound();
    setTitle("Week " + n);
    const cw = currentWeek().n, b = blockOf(n), p = wProg(w);
    const prim = (w.primers || []).map(id => { const x = PRIMERS.find(pp => pp.id === id); return x ? `<a class="tag" href="#/primers/${id}">${esc(x.n)}</a>` : ""; }).join("");
    const groups = ["F", "X", "C"].map(k => {
      const ts = w.tasks.filter(t => t.k === k);
      if (!ts.length) return "";
      const m = ts.reduce((a, t) => a + t.m, 0);
      return `<div class="group-h"><span class="trk trk-${k}">${TRACKS[k].name}</span><span class="muted">${ts.length} task${ts.length > 1 ? "s" : ""} · ${mins(m)}</span></div>
        <div class="rows" style="border-top:0">${ts.map(t => taskRow(t, "week/" + n, { noTrack: true })).join("")}</div>`;
    }).join("");
    const prev = WEEKS[n - 2], next = WEEKS[n];
    return `<div class="page">
      <div class="crumbs"><a href="#/plan">Plan</a><span>/</span><span>Week ${n}</span></div>
      <p class="eyebrow">Week ${n} of ${WEEKS.length} · ${esc(b.name)}${n === cw ? ' · <span class="now">this week</span>' : ""}</p>
      <h1>${esc(w.title)}</h1>
      <dl class="props">
        <dt>Dates</dt><dd>${fmtD(weekStart(n), { weekday: "short", day: "numeric", month: "short" })} to ${fmtD(weekEnd(n), { weekday: "short", day: "numeric", month: "short" })}</dd>
        ${w.co ? `<dt>Company</dt><dd>${esc(w.co)}</dd>` : ""}
        <dt>Time</dt><dd>${hrs(w.minutes)} planned, ${hrs(wRemaining(w))} left${weekLogged(w) ? `, ${hrs(weekLogged(w))} logged` : ""}${w.lite ? ' <span class="tag lite">light week</span>' : ""}</dd>
        ${prim ? `<dt>Primers</dt><dd>${prim}</dd>` : ""}
        <dt>Progress</dt><dd style="display:block"><span class="num">${p.d} of ${p.n} steps · ${pct(p)}%</span><div style="margin-top:6px">${bar(p, true)}</div></dd>
      </dl>

      <section class="sec"><div class="sec-h"><h2>Briefing</h2></div><div class="prose" style="margin-top:14px">${w.brief.map(x => `<p>${md(x)}</p>`).join("")}</div></section>

      <section class="sec"><div class="sec-h"><h2>Tasks</h2><span class="aside">${w.tasks.length} tasks · open one to see its steps</span></div>${groups}</section>

      <section class="sec"><div class="sec-h"><h2>Done means</h2></div><p class="prose" style="margin-top:14px">${md(w.deliv)}</p></section>

      <section class="sec" id="answer"><div class="sec-h"><h2>Hard question</h2></div>
        <p class="callout now">${md(w.push)}</p>
        <label class="field"><span>Your answer</span><textarea class="ta notes" data-save="answers|${w.id}" placeholder="Write the answer you'd give in an interview.">${esc(S.get("answers", w.id) || "")}</textarea></label>
        <div class="saved" data-saved="answers|${w.id}"></div>
      </section>

      <section class="sec" id="reflection"><div class="sec-h"><h2>Reflection</h2></div>
        <label class="field"><span>What stuck, what didn't, and what to carry into next week</span><textarea class="ta" data-save="refl|${w.id}">${esc(S.get("refl", w.id) || "")}</textarea></label>
        <div class="saved" data-saved="refl|${w.id}"></div>
      </section>

      <nav class="pager">${prev ? `<a href="#/week/${prev.n}"><small>Week ${prev.n}</small>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="next" href="#/week/${next.n}"><small>Week ${next.n}</small>${esc(next.title)}</a>` : ""}</nav>
    </div>`;
  }

  /* ================================================================ Task peek */
  function peekHTML(t) {
    const w = WEEKS[t.week - 1], p = tProg(t);
    const idx = w.tasks.indexOf(t);
    const prev = w.tasks[idx - 1], next = w.tasks[idx + 1];
    const base = route.path || "today";
    return `<div class="peek-bar">
        <button class="icon-btn" data-act="peek-close" aria-label="Close">${I.close}</button>
        <a class="icon-btn" ${prev ? `href="${withTask(base, prev.id)}"` : "disabled"} aria-label="Previous task">${I.up}</a>
        <a class="icon-btn" ${next ? `href="${withTask(base, next.id)}"` : "disabled"} aria-label="Next task">${I.down}</a>
        <span class="pos">Week ${w.n} · task ${idx + 1} of ${w.tasks.length}</span>
      </div>
      <div class="peek-body" id="peekBody">
        <span class="trk trk-${t.k}">${TRACKS[t.k].name}</span>
        <h2>${esc(t.t)}</h2>
        <dl class="props">
          <dt>Week</dt><dd><a class="link" href="#/week/${w.n}">Week ${w.n}: ${esc(w.title)}</a></dd>
          <dt>Estimate</dt><dd>${mins(t.m)}</dd>
          <dt>Time spent</dt><dd><input class="pin" type="number" inputmode="numeric" min="0" step="5" data-time="${t.id}" value="${esc(S.get("time", t.id) || "")}" placeholder="Minutes" style="max-width:120px"><span class="muted" style="font-size:12px">minutes</span></dd>
          <dt>Status</dt><dd data-peek-status>${statusText(p)}</dd>
          <dt>Steps</dt><dd style="display:block"><span class="num" data-peek-frac>${p.d} of ${p.n}</span><div style="margin-top:6px" data-peek-bar>${bar(p, true)}</div></dd>
        </dl>
        <h3>Steps</h3>
        <ol class="steps">${t.s.map((s, i) => `<li><label>
            <input type="checkbox" data-step="${t.stepIds[i]}" ${stepDone(t.stepIds[i]) ? "checked" : ""}>
            <span class="sn">${i + 1}</span><span class="stx">${md(s)}</span></label></li>`).join("")}</ol>
        <div class="btns"><button class="btn" data-act="task-all" data-id="${t.id}">Tick every step</button><button class="btn ghost" data-act="task-clear" data-id="${t.id}">Clear</button></div>
        <h3>What you should have at the end</h3>
        <p class="output">${md(t.o)}</p>
        <h3>Notes</h3>
        <textarea class="ta notes" data-save="notes|${t.id}" placeholder="Working, answers, numbers you found, links. Saved as you type.">${esc(S.get("notes", t.id) || "")}</textarea>
        <div class="saved" data-saved="notes|${t.id}"></div>
      </div>`;
  }
  let peekOpenId = null;
  function renderPeek() {
    const peek = $("#peek"), scrim = $("#scrim");
    const t = route.q.t && TASK[route.q.t];
    if (!t) {
      if (peekOpenId) {
        peek.classList.remove("on"); scrim.classList.remove("on");
        setTimeout(() => { if (!peekOpenId) { peek.hidden = true; scrim.hidden = true; peek.innerHTML = ""; } }, 200);
        document.body.style.overflow = "";
      }
      peekOpenId = null; return;
    }
    const keepScroll = peekOpenId === t.id ? ($("#peekBody") || {}).scrollTop || 0 : 0;
    peek.innerHTML = peekHTML(t);
    peek.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => { peek.classList.add("on"); scrim.classList.add("on"); });
    $("#peekBody").scrollTop = keepScroll;
    if (window.matchMedia("(max-width: 899px)").matches) document.body.style.overflow = "hidden";
    if (peekOpenId !== t.id) setTimeout(() => { const f = $("#peek .peek-bar .icon-btn"); if (f && !isTyping()) f.focus({ preventScroll: true }); }, 50);
    peekOpenId = t.id;
  }
  function closePeek() {
    const q = new URLSearchParams(location.hash.split("?")[1] || ""); q.delete("t");
    const base = location.hash.split("?")[0] || "#/today";
    const qs = q.toString();
    go(base + (qs ? "?" + qs : ""));
  }

  // Update progress everywhere without re-rendering, so focus and scroll stay put.
  function refreshProgress() {
    const y = window.scrollY, html = viewHTML();
    if (html != null) { $("#main").innerHTML = html; window.scrollTo(0, y); }
    $$("#peek [data-task]").forEach(el => {
      const t = TASK[el.dataset.task]; if (!t) return;
      const p = tProg(t);
      const st = el.querySelector(".st"); if (st) st.outerHTML = stBox(p);
      const fr = el.querySelector(".frac"); if (fr) fr.textContent = p.d + "/" + p.n;
      el.classList.toggle("done", p.d === p.n);
    });
    const t = route.q.t && TASK[route.q.t];
    if (t) {
      const p = tProg(t);
      const s = $("[data-peek-status]"); if (s) s.textContent = statusText(p);
      const f = $("[data-peek-frac]"); if (f) f.textContent = p.d + " of " + p.n;
      const b = $("[data-peek-bar]"); if (b) b.innerHTML = bar(p, true);
    }
    renderNav();
  }

  /* ================================================================ Primers */
  function viewPrimers(id) {
    if (id) {
      const p = PRIMERS.find(x => x.id === id); if (!p) return notFound();
      setTitle(p.n);
      const weeks = WEEKS.filter(w => (w.primers || []).includes(id));
      return `<div class="page"><div class="crumbs"><a href="#/primers">Primers</a><span>/</span><span>${esc(p.n)}</span></div>
        <p class="eyebrow">${esc(p.names)}</p><h1>${esc(p.n)}</h1>
        ${weeks.length ? `<dl class="props"><dt>Used in</dt><dd>${weeks.map(w => `<a class="tag" href="#/week/${w.n}">Week ${w.n}</a>`).join("")}</dd></dl>` : ""}
        <section class="sec"><dl class="dl">
          <dt>Revenue equation</dt><dd class="eq">${esc(p.eq)}</dd>
          <dt>Margin drivers</dt><dd>${esc(p.margin)}</dd>
          <dt>KPIs to track</dt><dd>${esc(p.kpi)}</dd>
          <dt>How it's valued</dt><dd>${esc(p.val)}</dd>
          <dt>Why winners win</dt><dd>${esc(p.win)}</dd>
          <dt>How it goes wrong</dt><dd>${esc(p.fail)}</dd>
          <dt>Interview angle</dt><dd>${esc(p.angle)}</dd>
        </dl></section>
        <p class="note">Structural points are stable. For any current number, check the company's latest results.</p>
      </div>`;
    }
    setTitle("Primers");
    return `<div class="page"><h1>Industry primers</h1>
      <p class="lede">Each primer gives the revenue equation, margin drivers, KPIs, valuation method, why winners win, how companies fail, the ASX names and the interview angle. Use the matching one as the checklist for your Sunday one-pager.</p>
      <section class="sec"><div class="list">${PRIMERS.map(p => `<a class="li" href="#/primers/${p.id}"><div class="li-top"><span class="li-t">${esc(p.n)}</span><span class="li-m">${esc(p.names)}</span></div><div class="li-s">${esc(p.eq)}</div></a>`).join("")}</div></section>
    </div>`;
  }

  /* ================================================================ Brain */
  const BRAIN_FIELDS = [["def", "Definition"], ["mech", "Mechanics"], ["formula", "Formula"], ["intuition", "Economic intuition"], ["example", "Real example"], ["question", "Interview question"]];
  function brainList() {
    const map = new Map();
    CONCEPTS.forEach(c => map.set(c.id, { ...c, seeded: true }));
    S.all("brain").forEach(([id, v]) => {
      const seed = CONCEPTS.find(c => c.id === id);
      const edited = !seed || ["term", "tags", ...BRAIN_FIELDS.map(f => f[0])].some(k => (v[k] || "") !== (seed[k] || ""));
      map.set(id, { ...(seed || {}), ...v, id, seeded: !!seed, edited });
    });
    // Respect deletions of seeded entries.
    CONCEPTS.forEach(c => { const r = S.raw("brain", c.id); if (r && r.v === null) map.delete(c.id); });
    return [...map.values()].sort((a, b) => (a.term || "").localeCompare(b.term || ""));
  }
  let brainQ = "", brainTag = "";
  function viewBrain(id) {
    if (id) return viewBrainEntry(id);
    setTitle("Brain");
    const list = brainList();
    const tags = [...new Set(list.flatMap(c => (c.tags || "").split(/[·,]/).map(s => s.trim()).filter(Boolean)))].sort();
    return `<div class="page">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><h1>Brain</h1><button class="btn primary" data-act="brain-new">${I.plus}New entry</button></div>
      <p class="lede">One entry per concept, each with a definition, the mechanics, the formula, the intuition, a real example and the interview question that tests it. The seeded entries show the standard, and your own go in alongside them.</p>
      <section class="sec">
        <input class="search-in" type="search" placeholder="Filter ${list.length} entries" value="${esc(brainQ)}" data-filter="brain" aria-label="Filter entries">
        <div class="chips">${["", ...tags].map(t => `<button class="chip" data-brain-tag="${esc(t)}" aria-pressed="${brainTag === t}">${t ? esc(t) : "All"}</button>`).join("")}</div>
        <div class="list" style="margin-top:14px" id="brainList">${brainRows(list)}</div>
      </section></div>`;
  }
  function brainRows(list) {
    const q = brainQ.toLowerCase().split(/\s+/).filter(Boolean);
    const rows = list.filter(c => {
      if (brainTag && !(c.tags || "").toLowerCase().includes(brainTag.toLowerCase())) return false;
      const hay = [c.term, c.tags, ...BRAIN_FIELDS.map(f => c[f[0]])].join(" ").toLowerCase();
      return q.every(w => hay.includes(w));
    });
    if (!rows.length) return `<div class="empty">Nothing matches.</div>`;
    return rows.map(c => `<a class="li" href="#/brain/${encodeURIComponent(c.id)}"><div class="li-top"><span class="li-t">${esc(c.term || "Untitled")}</span><span class="li-m">${esc(c.tags || "")}${c.seeded ? (c.edited ? " · edited" : " · seeded") : " · yours"}</span></div>${c.def ? `<div class="li-s">${esc(c.def)}</div>` : ""}</a>`).join("");
  }
  function viewBrainEntry(id) {
    const c = brainList().find(x => x.id === id);
    if (!c) return notFound();
    setTitle(c.term || "Untitled");
    const seed = CONCEPTS.find(x => x.id === id);
    return `<div class="page"><div class="crumbs"><a href="#/brain">Brain</a><span>/</span><span>${esc(c.term || "Untitled")}</span></div>
      <input class="in title-in" data-brain="${esc(id)}" data-f="term" value="${esc(c.term || "")}" placeholder="Concept name" aria-label="Concept name">
      <dl class="props"><dt>Tags</dt><dd><input class="pin" data-brain="${esc(id)}" data-f="tags" value="${esc(c.tags || "")}" placeholder="valuation, M&A"></dd>
        <dt>Source</dt><dd>${c.seeded ? (c.edited ? "Seeded, edited by you" : "Seeded") : "Yours"}</dd></dl>
      ${BRAIN_FIELDS.map(([k, l]) => `<label class="doc-f"><span>${l}</span><textarea class="ta doc${k === "formula" ? " mono" : ""}" data-brain="${esc(id)}" data-f="${k}" rows="1" placeholder="Empty">${esc(c[k] || "")}</textarea></label>`).join("")}
      <div class="saved" data-saved="brain|${esc(id)}"></div>
      <div class="btns">${seed && c.edited ? `<button class="btn" data-act="brain-restore" data-id="${esc(id)}">Restore the original</button>` : ""}<button class="btn danger" data-act="brain-del" data-id="${esc(id)}">Delete entry</button></div>
    </div>`;
  }

  /* ================================================================ Records (deals, firms) */
  function recList(kind) {
    return S.all(kind).map(([id, v, t]) => ({ id, ...v, _t: t })).sort((a, b) => {
      if (RECORDS[kind].fields.some(f => f.k === "date")) return (b.date || "").localeCompare(a.date || "") || b._t - a._t;
      return (a.name || "").localeCompare(b.name || "");
    });
  }
  function viewRecords(kind, id) {
    const def = RECORDS[kind];
    if (id) return viewRecord(kind, id);
    setTitle(def.title);
    const list = recList(kind), cols = def.fields.filter(f => f.list);
    return `<div class="page wide">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><h1>${def.title}</h1><button class="btn primary" data-act="rec-new" data-kind="${kind}">${I.plus}New ${def.singular}</button></div>
      <p class="lede">${esc(def.intro)}</p>
      ${def.target ? `<div class="meter">${bar({ d: Math.min(list.length, def.target), n: def.target })}<div class="meter-row"><span><b>${list.length}</b> logged</span><span>${esc(def.targetNote)}</span></div></div>` : ""}
      ${kind === "cases" && list.length ? caseSummary(list) : ""}
      <section class="sec">${list.length ? `<table class="rtable"><thead><tr>${cols.map(f => `<th>${esc(f.l)}</th>`).join("")}</tr></thead><tbody>${list.map(r => `<tr data-href="#/${kind}/${r.id}">${cols.map(f => `<td class="${f.primary ? "p" : ""}">${f.primary ? `<a href="#/${kind}/${r.id}" style="text-decoration:none">${esc(r[f.k] || "Untitled")}</a>` : esc(f.type === "date" && r[f.k] ? fmtD(parseD(r[f.k]), { day: "numeric", month: "short", year: "numeric" }) : r[f.k] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`
        : `<div class="empty">No ${def.title.toLowerCase()} yet. ${({ deals: "Week 1 starts you with the Qube takeover.", firms: "Week 1 has you build this list.", cases: "Week 1's flat white sizing can be the first.", companies: "The first one-pager is due on Sunday.", markets: "The first snapshot is due on Friday." })[kind] || ""}</div>`}</section>
    </div>`;
  }
  function viewRecord(kind, id) {
    const def = RECORDS[kind], r = S.get(kind, id);
    if (!r) return notFound();
    const prim = def.fields.find(f => f.primary);
    setTitle(r[prim.k] || "Untitled");
    const field = f => {
      const v = r[f.k] || "", a = `data-rec="${kind}|${id}" data-f="${f.k}"`;
      if (f.type === "text") return `<textarea class="ta doc" ${a} rows="1" placeholder="Empty">${esc(v)}</textarea>`;
      if (f.type === "select") return `<select class="pin" ${a}><option value="">Empty</option>${f.opts.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
      if (f.type === "date") return `<input class="pin" type="date" ${a} value="${esc(v)}">`;
      return `<input class="pin" ${a} value="${esc(v)}" placeholder="Empty" ${f.num ? 'inputmode="decimal"' : ""}>`;
    };
    const short = def.fields.filter(f => !f.primary && f.type !== "text"), long = def.fields.filter(f => f.type === "text");
    return `<div class="page"><div class="crumbs"><a href="#/${kind}">${def.title}</a><span>/</span><span>${esc(r[prim.k] || "Untitled")}</span></div>
      <input class="in title-in" data-rec="${kind}|${id}" data-f="${prim.k}" value="${esc(r[prim.k] || "")}" placeholder="${esc(prim.l)}" aria-label="${esc(prim.l)}">
      <dl class="props">${short.map(f => `<dt>${esc(f.l)}</dt><dd>${field(f)}</dd>`).join("")}</dl>
      ${long.map(f => `<label class="doc-f"><span>${esc(f.l)}</span>${field(f)}</label>`).join("")}
      ${kind === "deals" ? `<details style="margin-top:22px"><summary class="muted" style="cursor:pointer;font-size:13px">The seven questions</summary><ol class="olist" style="margin-top:8px">${R.SEVEN_QUESTIONS.map(q => `<li>${esc(q)}</li>`).join("")}</ol></details>` : ""}
      <div class="saved" data-saved="${kind}|${id}"></div>
      <div class="btns"><a class="btn" href="#/${kind}">Done</a><button class="btn danger" data-act="rec-del" data-kind="${kind}" data-id="${id}">Delete</button></div>
    </div>`;
  }

  /* ================================================================ Benchmark */
  function benchList() { return S.all("bench").map(([id, v]) => ({ id, ...v })).sort((a, b) => (b.date || "").localeCompare(a.date || "")); }
  const benchTotal = b => (b.scores || []).reduce((a, x) => a + (x || 0), 0);
  function viewBenchmark(id) {
    if (id) return viewBenchEntry(id);
    setTitle("Benchmark");
    const list = benchList();
    return `<div class="page">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><h1>The benchmark</h1><button class="btn primary" data-act="bench-new">${I.plus}New attempt</button></div>
      <p class="lede">Take a random ASX 200 company, give yourself about two hours with its filings, then score yourself from 0 to 3 on each of the fifteen points. If you can do this consistently you understand companies, which is the skill IB, capital markets and MBB are all selecting for.</p>
      ${sec("Attempts", list.length ? list.length + " so far" : "", list.length ? `<div class="list">${list.map(b => `<a class="li" href="#/benchmark/${b.id}"><div class="li-top"><span class="li-t">${esc(b.company || "Untitled")}</span><span class="li-m num">${benchTotal(b)} / 45</span></div><div class="li-s">${b.date ? esc(fmtD(parseD(b.date), { day: "numeric", month: "long", year: "numeric" })) : ""}</div></a>`).join("")}</div>` : `<div class="empty">No attempts yet. Week 21 is the formal test, and nothing stops you trying earlier.</div>`)}
      ${sec("The fifteen points", "", `<ol class="olist">${R.BENCHMARK.map(x => `<li>${esc(x)}</li>`).join("")}</ol>`)}
    </div>`;
  }
  function viewBenchEntry(id) {
    const b = S.get("bench", id); if (!b) return notFound();
    setTitle(b.company || "Benchmark attempt");
    const prev = benchList().filter(x => x.id !== id && (x.date || "") < (b.date || ""))[0];
    const scores = b.scores || [];
    const ranked = R.BENCHMARK.map((l, i) => [i, scores[i]]).filter(x => x[1] != null).sort((a, c) => a[1] - c[1]).slice(0, 3);
    return `<div class="page"><div class="crumbs"><a href="#/benchmark">Benchmark</a><span>/</span><span>${esc(b.company || "Attempt")}</span></div>
      <input class="in title-in" data-bench="${id}" data-f="company" value="${esc(b.company || "")}" placeholder="Company" aria-label="Company">
      <dl class="props"><dt>Date</dt><dd><input class="pin" type="date" data-bench="${id}" data-f="date" value="${esc(b.date || "")}" style="max-width:200px"></dd>
        <dt>Score</dt><dd><b class="num" id="benchTotal">${benchTotal(b)} / 45</b>${prev ? `<span class="muted">previous ${benchTotal(prev)} on ${esc(prev.company || "")}</span>` : ""}</dd>
        <dt>Weakest</dt><dd id="benchWeak">${ranked.length ? ranked.map(([i]) => esc(R.BENCHMARK[i])).join(" · ") : '<span class="muted">Score the points below</span>'}</dd></dl>
      <section class="sec"><div class="rows">${R.BENCHMARK.map((l, i) => `<div class="habit" style="cursor:default;grid-template-columns:28px 1fr auto"><span class="muted num" style="font-size:12px">${i + 1}</span><span>${esc(l)}${prev && prev.scores && prev.scores[i] != null ? `<span class="when">Last time ${prev.scores[i]}</span>` : ""}</span>
        <span class="seg" role="group" aria-label="Score for ${esc(l)}">${[0, 1, 2, 3].map(s => `<button type="button" data-bench-score="${id}|${i}|${s}" aria-pressed="${scores[i] === s}">${s}</button>`).join("")}</span></div>`).join("")}</div></section>
      <label class="field"><span>Notes: what went wrong and what to fix</span><textarea class="ta notes" data-bench="${id}" data-f="notes">${esc(b.notes || "")}</textarea></label>
      <div class="saved" data-saved="bench|${id}"></div>
      <div class="btns"><button class="btn danger" data-act="bench-del" data-id="${id}">Delete attempt</button></div>
    </div>`;
  }

  /* ================================================================ Standards, library, more */
  function viewStandards() {
    setTitle("Standards");
    return `<div class="page wide"><h1>Excel and slide standard</h1>
      <p class="lede">Hold yourself to this from Week 2. Banks and consulting firms run Windows Excel, so practise in a uni computer lab when you can, and on a Mac turn on System Settings → Keyboard → Use F1, F2, etc. keys as standard function keys.</p>
      ${sec("Model formatting", "", `<ol class="olist">${R.EXCEL_RULES.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="note"><a class="link" href="${R.U.macab}" target="_blank" rel="noopener">Macabacus on colour formatting</a></p>`)}
      ${sec("Slides", "", `<ol class="olist">${R.SLIDE_RULES.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="note">Study real decks: <a class="link" href="${R.U.aa600}" target="_blank" rel="noopener">600+ consulting decks</a> and <a class="link" href="${R.U.rarePres}" target="_blank" rel="noopener">27 IB pitch books</a>.</p>`)}
      ${sec("Shortcuts", "learn each in the week shown", `<table class="simple stack"><thead><tr><th>Do this</th><th>Windows</th><th>Mac</th><th class="r">Week</th></tr></thead><tbody>${R.SHORTCUTS.map(([a, w, m, n]) => `<tr><td>${esc(a)}</td><td data-l="Windows">${kbds(w)}</td><td data-l="Mac">${kbds(m)}</td><td class="r num" data-l="Week">${n}</td></tr>`).join("")}</tbody></table>`)}
    </div>`;
  }
  function kbds(s) {
    if (/→/.test(s)) return esc(s);
    const k = x => `<kbd class="k">${esc(x)}</kbd>`;
    return s.split(" / ").map(a => a.split(" or ").map(b => b.includes(" + ") ? b.split(" + ").map(k).join("+") : b.split(" ").map(k).join(" ")).join(" or ")).join(" / ");
  }
  function viewLibrary() {
    setTitle("Library");
    return `<div class="page wide"><h1>Library</h1><p class="lede">Everything here is free. Books come through UQ Library, and don't collect fifty of them when two read properly will do more.</p>
      ${R.LIBRARY.map(g => sec(esc(g.h), "", `<div class="list">${g.items.map(([t, u, n]) => `<a class="li" href="${esc(u)}" target="_blank" rel="noopener"><div class="li-top"><span class="li-t">${esc(t)}</span>${n ? `<span class="li-m">${esc(n)}</span>` : ""}</div></a>`).join("")}</div>`)).join("")}
    </div>`;
  }
  function viewMore() {
    setTitle("More");
    const items = [["maths", "Maths drill"], ["benchmark", "Benchmark"], ["primers", "Primers"], ["standards", "Standards"], ["library", "Library"], ["after", "After February"], ["zetamac", "Zetamac scores"], ["settings", "Settings"]];
    return `<div class="page"><h1>More</h1><section class="sec"><div class="list">${items.map(([k, l]) => `<a class="li" href="#/${k}"><div class="li-top"><span class="li-t">${l}</span><span class="li-m">›</span></div></a>`).join("")}</div></section>
      ${sec("Weeks", "", `<div class="list">${WEEKS.map(w => { const p = wProg(w); return `<a class="li" href="#/week/${w.n}"><div class="li-top"><span class="li-t">${w.n}. ${esc(w.title)}</span><span class="li-m num">${p.d}/${p.n}</span></div></a>`; }).join("")}</div>`)}</div>`;
  }

  /* ================================================================ time logging */
  function weekLogged(w) { return w.tasks.reduce((a, t) => a + (+S.get("time", t.id) || 0), 0); }

  /* ================================================================ Review (spaced repetition) */
  // Boxes 1–7 with intervals in days. "Knew it" moves a card up a box, "Shaky" keeps it and halves the gap,
  // "Didn't know" sends it back to box 1 and shows it again before the session ends.
  const INT = [0, 1, 3, 7, 14, 30, 60, 120];
  const NEW_PER_DAY = 8;
  const addDays = (k, n) => { const d = parseD(k); d.setDate(d.getDate() + n); return dkey(d); };
  function reviewPool() {
    const cw = currentWeek(), unlock = cw.before ? 1 : cw.after ? 99 : cw.n;
    const qs = R.QUESTIONS.filter(c => c.w <= unlock);
    const own = brainList().filter(c => c.edited && c.term && (c.def || c.mech)).map(c => ({
      id: "b:" + c.id, topic: "Your Brain", q: c.question ? c.question : "Explain " + c.term + ".",
      a: [c.def, c.mech, c.formula].filter(Boolean).join("\n\n"), brain: c.id
    }));
    return qs.concat(own);
  }
  const cardSt = id => S.get("cards", id);
  function reviewDue() { const t = dkey(todayD()); return reviewPool().filter(c => { const s = cardSt(c.id); return s && s.due <= t; }); }
  function reviewNewAllowance() {
    const t = dkey(todayD()), pool = reviewPool();
    const introduced = pool.filter(c => { const s = cardSt(c.id); return s && s.first === t; }).length;
    return Math.min(pool.filter(c => !cardSt(c.id)).length, Math.max(0, NEW_PER_DAY - introduced));
  }
  function reviewMastered() { return reviewPool().filter(c => { const s = cardSt(c.id); return s && s.box >= 4; }).length; }

  let rv = null; // { queue: [ids], shown: bool, done: n, again: Set }
  function buildQueue(extra) {
    const pool = reviewPool(), byId = Object.fromEntries(pool.map(c => [c.id, c]));
    const due = reviewDue().sort((a, b) => cardSt(a.id).due.localeCompare(cardSt(b.id).due)).map(c => c.id);
    const fresh = pool.filter(c => !cardSt(c.id)).slice(0, reviewNewAllowance()).map(c => c.id);
    // Interleave new cards among due ones so a session mixes topics.
    const q = [];
    while (due.length || fresh.length) { if (due.length) q.push(due.shift()); if (due.length) q.push(due.shift()); if (fresh.length) q.push(fresh.shift()); }
    if (extra) {
      const rest = pool.filter(c => !q.includes(c.id) && cardSt(c.id)).sort(() => Math.random() - .5).slice(0, 10).map(c => c.id);
      q.push(...rest);
    }
    rv = { queue: q.filter(id => byId[id]), shown: false, done: 0, again: new Set() };
  }
  function gradeCard(id, g) {
    const t = dkey(todayD());
    const s = Object.assign({ box: 0, n: 0, lapses: 0, first: t }, cardSt(id) || {});
    if (g === 0) { s.box = 1; s.lapses++; s.due = addDays(t, 1); }
    else if (g === 1) { s.box = Math.max(1, s.box); s.due = addDays(t, Math.max(1, Math.round(INT[s.box] / 2))); }
    else { s.box = Math.min(7, s.box + 1); s.due = addDays(t, INT[s.box]); }
    s.n++; s.last = t;
    S.put("cards", id, s, { silent: true });
    rv.queue.shift(); rv.done++; rv.shown = false;
    if (g === 0 && !rv.again.has(id)) { rv.again.add(id); rv.queue.splice(Math.min(3, rv.queue.length), 0, id); }
  }
  function viewReview() {
    setTitle("Review");
    const pool = reviewPool(), byId = Object.fromEntries(pool.map(c => [c.id, c]));
    if (route.q.card && byId[route.q.card]) { rv = { queue: [route.q.card], shown: false, done: 0, again: new Set() }; history.replaceState(null, "", "#/review"); route.q = {}; }
    if (!rv) buildQueue(false);
    const cur = byId[rv.queue[0]];
    const topics = [...new Set(pool.map(c => c.topic))];
    const next = pool.map(c => cardSt(c.id)).filter(Boolean).map(s => s.due).filter(d => d > dkey(todayD())).sort()[0];
    const card = cur ? `<div class="card-r" id="reviewCard">
        <div class="card-top"><span class="muted">${esc(cur.topic)}</span><span class="muted num">${rv.queue.length} left</span></div>
        <p class="card-q">${esc(cur.q)}</p>
        ${rv.shown ? `<div class="card-a prose">${esc(cur.a).split("\n\n").map(x => `<p>${x}</p>`).join("")}</div>
          <div class="grade"><button class="btn" data-grade="0">Didn't know <kbd class="k">1</kbd></button><button class="btn" data-grade="1">Shaky <kbd class="k">2</kbd></button><button class="btn primary" data-grade="2">Knew it <kbd class="k">3</kbd></button></div>
          ${cur.brain ? `<p class="note"><a class="link" href="#/brain/${encodeURIComponent(cur.brain)}">Edit this entry</a></p>` : ""}`
        : `<p class="note">Say the answer out loud first, as you would in an interview.</p><div class="grade"><button class="btn primary" data-act="rv-show">Show answer <kbd class="k">Space</kbd></button></div>`}
      </div>`
      : `<div class="card-r"><p class="card-q" style="margin-top:0">${rv.done ? `Done. You reviewed ${rv.done} card${rv.done > 1 ? "s" : ""}.` : "Nothing due right now."}</p>
          <p class="note">${next ? "The next card comes back on " + esc(fmtD(parseD(next), { weekday: "long", day: "numeric", month: "long" })) + "." : "New cards unlock as the weeks go on."} Brain entries you write yourself join the deck automatically.</p>
          <div class="grade"><button class="btn" data-act="rv-extra">Practise ten more anyway</button></div></div>`;
    return `<div class="page">
      <h1>Review</h1>
      <p class="lede">Interview questions from the weeks you have covered. Each card comes back after 1, 3, 7, 14, 30 and 60 days as long as you know it, and sooner when you don't, which is the cheapest way to make technical answers automatic.</p>
      <div class="stats"><div><b>${reviewDue().length}</b><span>due now</span></div><div><b>${reviewNewAllowance()}</b><span>new today</span></div><div><b>${pool.length}</b><span>unlocked</span></div><div><b>${reviewMastered()}</b><span>mastered</span></div></div>
      <section class="sec">${card}</section>
      ${sec("By topic", "mastered means a card has reached a two-week gap", `<table class="simple"><thead><tr><th>Topic</th><th class="r">Unlocked</th><th class="r">Seen</th><th class="r">Mastered</th></tr></thead><tbody>${topics.map(tp => {
        const cs = pool.filter(c => c.topic === tp), seen = cs.filter(c => cardSt(c.id)), m = cs.filter(c => (cardSt(c.id) || {}).box >= 4);
        return `<tr><td>${esc(tp)}</td><td class="r num">${cs.length}</td><td class="r num">${seen.length}</td><td class="r num">${m.length}</td></tr>`;
      }).join("")}</tbody></table><p class="note">${R.QUESTIONS.length - R.QUESTIONS.filter(c => c.w <= (currentWeek().after ? 99 : currentWeek().n)).length} more questions unlock as the plan moves on.</p>`)}
    </div>`;
  }

  /* ================================================================ Maths drill */
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmtN = n => Number.isInteger(n) ? n.toLocaleString("en-AU") : n.toLocaleString("en-AU", { maximumFractionDigits: 2 });
  const GEN = [
    () => { const p = pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75]), b = pick([240, 360, 480, 640, 720, 840, 960, 1200, 1500, 2400]); return { q: `${p}% of ${fmtN(b)}`, a: p * b / 100 }; },
    () => { const a = pick([200, 250, 400, 500, 800, 1200]), g = pick([-30, -20, -15, -10, 8, 12, 15, 20, 25, 40, 60]); return { q: `From ${fmtN(a)} to ${fmtN(a * (1 + g / 100))}: % change?`, a: g, unit: "%" }; },
    () => { const e = pick([45, 60, 85, 120, 140, 250, 320]), m = pick([6, 7.5, 8, 9, 11, 12, 14]); return { q: `EBITDA $${e}m at ${m}×. EV in $m?`, a: e * m }; },
    () => { const r = pick([400, 640, 800, 1200, 2500]), mg = pick([8, 12, 15, 18, 22, 35]); return { q: `Revenue $${fmtN(r)}m, EBIT $${fmtN(r * mg / 100)}m. EBIT margin %?`, a: mg, unit: "%" }; },
    () => { const f = pick([1.2, 2.4, 3.6, 4.8, 6]), p = pick([40, 50, 60, 80]), v = pick([10, 15, 20, 25, 30]); return { q: `Fixed costs $${f}m, price $${p}, variable cost $${v}. Breakeven units (thousands)?`, a: Math.round(f * 1e6 / (p - v)) / 1000 }; },
    () => { const h = pick([2, 3.2, 4, 8, 10]), s = pick([20, 25, 40, 60]), sp = pick([150, 300, 450, 600, 1200]); return { q: `${h}m households × ${s}% × $${sp} a year. Market in $m?`, a: h * s / 100 * sp }; },
    () => { const ev = pick([1500, 2500, 4000, 6000]), nd = pick([300, 500, 700, 1000]), sh = pick([50, 80, 100, 125, 200]); return { q: `EV $${fmtN(ev)}m, net debt $${nd}m, ${sh}m shares. Price per share $?`, a: (ev - nd) / sh }; },
    () => { const y = pick([4, 6, 8, 9, 12]); return { q: `Rule of 72: annual growth to double in ${y} years (%)?`, a: 72 / y, unit: "%" }; },
    () => { const b = pick([100, 200, 400]), g = pick([5, 8, 10, 20]); return { q: `$${b}m growing ${g}% a year for 2 years. Value in $m?`, a: b * (1 + g / 100) ** 2 }; },
    () => { const eq = pick([300, 400, 500]), m = pick([2, 2.5, 3]), y = 5; return { q: `Equity $${eq}m becomes $${eq * m}m in ${y} years. MOIC?`, a: m, unit: "x" }; },
    () => { const s = pick([100, 200]), n = pick([20, 25, 40, 50]), px = pick([8, 10, 12]), d = pick([10, 20, 25]); const np = px * (1 - d / 100); return { q: `${s}m shares at $${px}, issue ${n}m at $${np.toFixed(2)}. TERP $?`, a: (s * px + n * np) / (s + n) }; },
    () => { const c = pick([1.2, 2.4, 3.6, 4.8]), sp = pick([2, 3, 4]); return { q: `$${c}bn market split across ${sp * 4}m customers. Spend per customer $?`, a: c * 1000 / (sp * 4) }; }
  ];
  let mdr = null; // running drill
  function newQ() { const g = pick(GEN)(); g.a = Math.round(g.a * 100) / 100; return g; }
  function parseAns(v) { const n = parseFloat(String(v).replace(/[$,%x×\s]/gi, "").replace(/m$|bn$/i, "")); return isNaN(n) ? null : n; }
  function mathsScores() { return S.all("maths").map(([id, v]) => ({ id, ...v })).sort((a, b) => a.at - b.at); }
  function drillHTML() {
    if (!mdr) return "";
    const left = Math.max(0, Math.ceil((mdr.end - Date.now()) / 1000));
    return `<div class="card-r" id="drill">
      <div class="card-top"><span class="muted num" id="drillClock">${Math.floor(left / 60)}:${pad(left % 60)}</span><span class="muted num">${mdr.right} right of ${mdr.n}</span></div>
      <p class="card-q" id="drillQ">${esc(mdr.q.q)}</p>
      <form data-form="drill" class="inline-form"><input class="in" id="drillIn" name="a" inputmode="decimal" autocomplete="off" placeholder="Answer" aria-label="Answer" style="max-width:220px"><button class="btn primary" type="submit">Enter</button></form>
      <p class="note" id="drillFb">${mdr.fb || "Within 2% counts. Enter moves on."}</p></div>`;
  }
  function viewMaths() {
    setTitle("Maths drill");
    const sc = mathsScores(), best = sc.reduce((m, x) => Math.max(m, x.s), 0), last = sc[sc.length - 1];
    return `<div class="page"><h1>Business maths drill</h1>
      <p class="lede">Zetamac trains arithmetic. This trains the calculations that come up in cases and interviews: percentages, margins, multiples, breakevens, market sizes, share prices and returns, three minutes at a time.</p>
      <section class="sec">${mdr ? drillHTML() : `<div class="grade" style="margin-top:0"><button class="btn primary" data-act="drill-start">Start a three-minute drill</button></div>`}</section>
      <div class="stats"><div><b>${sc[0] ? sc[0].s : "–"}</b><span>first</span></div><div><b>${sc.length ? best : "–"}</b><span>best</span></div><div><b>${last ? last.s : "–"}</b><span>latest</span></div><div><b>${sc.length}</b><span>drills</span></div></div>
      ${sc.length ? sec("History", "", `<table class="simple"><thead><tr><th>Date</th><th class="r">Right</th><th class="r">Attempted</th></tr></thead><tbody>${sc.slice().reverse().slice(0, 15).map(x => `<tr><td>${esc(fmtD(parseD(x.d), { weekday: "short", day: "numeric", month: "short" }))}</td><td class="r num">${x.s}</td><td class="r num">${x.n}</td></tr>`).join("")}</tbody></table>`) : ""}
    </div>`;
  }
  function drillTick() {
    if (!mdr) return;
    const left = Math.max(0, Math.ceil((mdr.end - Date.now()) / 1000));
    const c = $("#drillClock"); if (c) c.textContent = Math.floor(left / 60) + ":" + pad(left % 60);
    if (left <= 0) {
      clearInterval(mdr.timer);
      S.put("maths", uid("x"), { d: dkey(todayD()), s: mdr.right, n: mdr.n, at: Date.now() }, { silent: true });
      const r = mdr.right, n = mdr.n; mdr = null;
      if (route.name === "maths") { $("#main").innerHTML = viewMaths(); }
      toast(`${r} right of ${n}. Saved.`);
    }
  }

  /* ================================================================ Logs hub, After February */
  function caseSummary(list) {
    const types = {}; list.forEach(r => { if (r.type) types[r.type] = (types[r.type] || 0) + 1; });
    const avg = k => { const v = list.map(r => parseInt(r[k], 10)).filter(n => n > 0); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "–"; };
    return `<div class="stats"><div><b>${avg("sStructure")}</b><span>structure</span></div><div><b>${avg("sMaths")}</b><span>maths</span></div><div><b>${avg("sSynthesis")}</b><span>synthesis</span></div><div><b>${avg("sComms")}</b><span>communication</span></div></div>
      <p class="note">Average scores out of 5. ${Object.keys(types).length ? "By type: " + Object.entries(types).map(([k, v]) => esc(k) + " " + v).join(" · ") + "." : ""} Work on the lowest average first.</p>`;
  }
  function viewLogs() {
    setTitle("Logs");
    const rows = [["brain", "Brain", brainList().length, "concepts"], ...["deals", "cases", "companies", "markets", "firms"].map(k => [k, RECORDS[k].title, S.all(k).length, RECORDS[k].target ? "of " + RECORDS[k].target : ""])];
    return `<div class="page"><h1>Logs</h1><p class="lede">The records that build commercial context over the 22 weeks.</p>
      <section class="sec"><div class="list">${rows.map(([k, l, n, extra]) => `<a class="li" href="#/${k}"><div class="li-top"><span class="li-t">${l}</span><span class="li-m num">${n} ${extra}</span></div>${RECORDS[k] ? `<div class="li-s">${esc(RECORDS[k].intro)}</div>` : ""}</a>`).join("")}</div></section></div>`;
  }
  function viewAfter() {
    setTitle("After February");
    return `<div class="page"><h1>After February</h1>
      <p class="lede">The 22 weeks build the skill, and recruiting runs from May to November. This is the path from here to an offer on the Australian penultimate-year cycle, where almost every graduate seat is filled through the summer internship.</p>
      ${R.AFTER.map(x => sec(esc(x.m), esc(x.t), `<ol class="olist">${x.items.map(i => `<li>${esc(i)}</li>`).join("")}</ol>`)).join("")}
      <p class="note">Dates follow the usual cycle. Check each firm's portal and the Firms tab, since opening dates move a few weeks from year to year.</p></div>`;
  }

  /* ================================================================ Settings */
  function viewSettings() {
    setTitle("Settings");
    const key = S.syncKey();
    const link = location.origin + location.pathname + "#link=" + key;
    const theme = localStorage.getItem("rtf.theme") || "auto";
    return `<div class="page"><h1>Settings</h1>
      ${sec("Sync", "", S.configured ? `
        <p class="prose" style="margin-top:14px">Your progress is saved on this device and backed up to Supabase under a private sync key. To use the same progress on your phone, open the link below on the phone once, and from then on both devices stay in step.</p>
        <dl class="props"><dt>Status</dt><dd id="settingsSync"></dd><dt>This device's link</dt><dd style="display:block"><input class="in" readonly value="${esc(link)}" id="syncLink" style="font:12.5px var(--mono)"><div class="btns"><button class="btn" data-act="copy-link">Copy link</button><button class="btn" data-act="sync-now">Sync now</button></div></dd>
          <dt>On your phone</dt><dd style="display:block"><div id="qr" class="qr" aria-label="QR code for this device's link"></div><span class="muted" style="font-size:12px">Point the phone's camera at this once.</span></dd></dl>
        <label class="field"><span>Already have a link from another device? Paste it here</span><input class="in" id="pasteLink" placeholder="https://…#link=…"></label>
        <div class="btns"><button class="btn" data-act="use-link">Use that link</button></div>
        <p class="note">Anyone with the link can read and change your progress, so treat it like a password and don't post it anywhere.</p>`
      : `<p class="prose" style="margin-top:14px">Sync isn't set up yet, so progress is saved in this browser only. Once Supabase is connected in <code>config.js</code>, this page gives you a link to open on your phone.</p>`)}
      ${sec("Plan dates", "", `<label class="field"><span>Start date (a Monday)</span><input class="in" type="date" id="startDate" value="${esc(S.get("settings", "start") || "2026-09-28")}" style="max-width:220px"></label><p class="note">Moving it shifts every week's dates, and your ticks stay where they are.</p>`)}
      ${sec("Appearance", "", `<div class="chips">${[["auto", "Match the system"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button class="chip" data-theme-set="${v}" aria-pressed="${theme === v}">${l}</button>`).join("")}</div>`)}
      ${sec("Your data", "", `<p class="prose" style="margin-top:14px">Download a backup now and then, since it contains every tick, note, Brain entry, deal and benchmark attempt.</p>
        <div class="btns"><button class="btn" data-act="export">Download backup</button><label class="btn" style="cursor:pointer">Restore from backup<input type="file" accept="application/json" id="importFile" hidden></label><button class="btn danger" data-act="reset">Clear everything</button></div>`)}
    </div>`;
  }

  function notFound() { setTitle("Not found"); return `<div class="page"><h1>Nothing here</h1><p class="lede"><a class="link" href="#/today">Back to Today</a></p></div>`; }

  /* ================================================================ search palette */
  function searchIndex() {
    const out = [];
    WEEKS.forEach(w => out.push({ ty: "Week", t: `Week ${w.n}: ${w.title}`, sub: w.co || "", h: `#/week/${w.n}`, hay: [w.title, w.co, ...w.brief].join(" ") }));
    TASKS.forEach(t => out.push({ ty: "Task", t: t.t, sub: `Week ${t.week} · ${plain(t.s[0])}`, h: withTask("week/" + t.week, t.id), hay: [t.t, ...t.s, t.o, S.get("notes", t.id) || ""].map(plain).join(" ") }));
    PRIMERS.forEach(p => out.push({ ty: "Primer", t: p.n, sub: p.names, h: `#/primers/${p.id}`, hay: Object.values(p).join(" ") }));
    brainList().forEach(c => out.push({ ty: "Brain", t: c.term || "Untitled", sub: c.def || "", h: `#/brain/${encodeURIComponent(c.id)}`, hay: [c.term, c.tags, ...BRAIN_FIELDS.map(f => c[f[0]])].join(" ") }));
    recList("deals").forEach(r => out.push({ ty: "Deal", t: r.target || "Untitled", sub: r.buyer || "", h: `#/deals/${r.id}`, hay: Object.values(r).join(" ") }));
    recList("firms").forEach(r => out.push({ ty: "Firm", t: r.name || "Untitled", sub: r.type || "", h: `#/firms/${r.id}`, hay: Object.values(r).join(" ") }));
    recList("cases").forEach(r => out.push({ ty: "Case", t: r.name || "Untitled", sub: r.type || "", h: `#/cases/${r.id}`, hay: Object.values(r).join(" ") }));
    recList("companies").forEach(r => out.push({ ty: "Company", t: r.name || "Untitled", sub: r.ticker || "", h: `#/companies/${r.id}`, hay: Object.values(r).join(" ") }));
    R.QUESTIONS.forEach(c => out.push({ ty: "Question", t: c.q, sub: c.a, h: "#/review?card=" + c.id, hay: c.a + " " + c.topic }));
    [["Today", "#/today"], ["Plan", "#/plan"], ["Review", "#/review"], ["Maths drill", "#/maths"], ["After February", "#/after"], ["Logs", "#/logs"], ["Standards", "#/standards"], ["Library", "#/library"], ["Benchmark", "#/benchmark"], ["Settings", "#/settings"], ["Zetamac scores", "#/zetamac"]]
      .forEach(([t, h]) => out.push({ ty: "Page", t, sub: "", h, hay: t }));
    return out;
  }
  function openPalette() {
    if ($("#pal")) return;
    const idx = searchIndex();
    $("#palRoot").innerHTML = `<div class="pal-wrap" id="palWrap"><div class="pal" id="pal" role="dialog" aria-label="Search"><input id="palIn" type="search" placeholder="Search weeks, tasks, steps, notes, Brain, deals" autocomplete="off" aria-label="Search"><ul id="palList" role="listbox"></ul></div></div>`;
    const inp = $("#palIn"), ul = $("#palList");
    let sel = 0, res = [];
    const draw = () => {
      const q = inp.value.toLowerCase().split(/\s+/).filter(Boolean);
      res = q.length ? idx.filter(x => { const h = (x.t + " " + x.hay).toLowerCase(); return q.every(w => h.includes(w)); })
        .sort((a, b) => (b.t.toLowerCase().includes(q[0]) ? 1 : 0) - (a.t.toLowerCase().includes(q[0]) ? 1 : 0)).slice(0, 40)
        : idx.filter(x => x.ty === "Page" || (x.ty === "Week" && x.h === "#/week/" + currentWeek().n));
      sel = Math.min(sel, Math.max(0, res.length - 1));
      ul.innerHTML = res.length ? res.map((x, i) => `<li><a href="${x.h}" role="option" aria-selected="${i === sel}" data-i="${i}"><span class="ty">${x.ty}</span><span>${esc(x.t)}${x.sub ? `<small>${esc(plain(x.sub))}</small>` : ""}</span></a></li>`).join("") : `<li class="none">Nothing found.</li>`;
      const a = ul.querySelector('[aria-selected="true"]'); if (a) a.scrollIntoView({ block: "nearest" });
    };
    inp.addEventListener("input", () => { sel = 0; draw(); });
    inp.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { sel = Math.min(res.length - 1, sel + 1); draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      else if (e.key === "Enter" && res[sel]) { e.preventDefault(); closePalette(); location.hash = res[sel].h; }
      else if (e.key === "Escape") closePalette();
    });
    $("#palWrap").addEventListener("click", e => { if (e.target.id === "palWrap") closePalette(); else if (e.target.closest("a")) closePalette(); });
    draw(); inp.focus();
  }
  function closePalette() { $("#palRoot").innerHTML = ""; }

  /* ================================================================ render */
  function grow(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  function isTyping() { const a = document.activeElement; return a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && !["checkbox", "button", "submit"].includes(a.type)) || a.tagName === "SELECT"); }

  let lastPath = null;
  function viewHTML() {
    const r = route;
    let html;
    switch (r.name) {
      case "today": html = viewToday(); break;
      case "plan": html = viewPlan(); break;
      case "week": html = viewWeek(+r.a); break;
      case "task": { const t = TASK[r.a]; if (t) { location.replace(withTask("week/" + t.week, t.id)); return; } html = notFound(); break; }
      case "primers": html = viewPrimers(r.a); break;
      case "brain": html = viewBrain(r.a); break;
      case "deals": case "firms": case "cases": case "companies": case "markets": html = viewRecords(r.name, r.a); break;
      case "review": html = viewReview(); break;
      case "maths": html = viewMaths(); break;
      case "logs": html = viewLogs(); break;
      case "after": html = viewAfter(); break;
      case "benchmark": html = viewBenchmark(r.a); break;
      case "standards": html = viewStandards(); break;
      case "library": html = viewLibrary(); break;
      case "settings": html = viewSettings(); break;
      case "zetamac": html = viewZetamac(); break;
      case "more": html = viewMore(); break;
      default: html = notFound();
    }
    return html;
  }
  function render() {
    const prev = route && route.name;
    route = parseRoute();
    if (route.name === "review" && prev !== "review") rv = null;
    const r = route;
    const html = viewHTML();
    if (html == null) return;
    const main = $("#main");
    const pathChanged = lastPath !== r.path;
    const y = window.scrollY;
    main.innerHTML = html;
    if (pathChanged) {
      const anchor = location.hash.split("#")[2];
      const target = anchor && document.getElementById(anchor);
      if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
    } else window.scrollTo(0, y);
    lastPath = r.path;
    renderNav(); renderPeek(); renderSync();
    $$(".ta.doc").forEach(grow);
    if ($("#qr")) drawQR($("#qr"), $("#syncLink").value);
  }

  /* ================================================================ events */
  const saveText = debounce((coll, id, v) => {
    S.put(coll, id, v, { silent: true });
    const el = document.querySelector(`[data-saved="${coll}|${CSS.escape(id)}"]`);
    if (el) el.textContent = "Saved";
  }, 400);

  function patchObj(coll, id, f, v, silent) {
    const cur = S.get(coll, id) || {};
    S.put(coll, id, { ...cur, [f]: v }, { silent: silent !== false });
    const el = document.querySelector(`[data-saved="${coll}|${CSS.escape(id)}"]`);
    if (el) el.textContent = "Saved";
  }
  const patchDebounced = {};
  function patchLater(coll, id, f, v) {
    const k = coll + id + f;
    patchDebounced[k] = patchDebounced[k] || debounce((vv) => patchObj(coll, id, f, vv), 350);
    patchDebounced[k](v);
  }
  function brainPatch(id, f, v) {
    // Editing a seeded entry copies it into your own collection first.
    const cur = S.get("brain", id) || (() => { const s = CONCEPTS.find(c => c.id === id); if (!s) return {}; const { id: _i, ...rest } = s; return rest; })();
    S.put("brain", id, { ...cur, [f]: v }, { silent: true });
    const el = document.querySelector(`[data-saved="brain|${CSS.escape(id)}"]`); if (el) el.textContent = "Saved";
  }
  const brainPatchLater = debounce(brainPatch, 350);
  const timeLater = debounce((id, v) => { const n = parseInt(v, 10); S.put("time", id, n > 0 ? n : null, { silent: true }); }, 400);
  function rerenderMain() { const y = window.scrollY; $("#main").innerHTML = viewHTML(); window.scrollTo(0, y); renderNav(); }

  function toast(msg) {
    const d = document.createElement("div"); d.className = "toast"; d.textContent = msg; d.setAttribute("role", "status");
    document.body.appendChild(d); setTimeout(() => d.remove(), 2400);
  }

  function bind() {
    document.addEventListener("change", e => {
      const el = e.target;
      if (el.dataset.step) { S.put("steps", el.dataset.step, el.checked ? 1 : null, { silent: true }); refreshProgress(); return; }
      if (el.dataset.habit) {
        S.put("habits", dkey(todayD()) + "|" + el.dataset.habit, el.checked ? 1 : null, { silent: true });
        const sec = el.closest(".sec"); if (sec) { const y = window.scrollY; $("#main").innerHTML = viewToday(); window.scrollTo(0, y); }
        return;
      }
      if (el.dataset.rec && (el.tagName === "SELECT" || el.type === "date")) { const [k, id] = el.dataset.rec.split("|"); patchObj(k, id, el.dataset.f, el.value); return; }
      if (el.dataset.bench && el.type === "date") { patchObj("bench", el.dataset.bench, "date", el.value); return; }
      if (el.id === "startDate" && el.value) { S.put("settings", "start", el.value); toast("Dates updated"); return; }
      if (el.id === "importFile" && el.files[0]) {
        el.files[0].text().then(txt => { try { S.importJSON(txt); toast("Backup restored and merged"); } catch (err) { toast(err.message); } });
      }
    });

    document.addEventListener("input", e => {
      const el = e.target;
      if (el.classList && el.classList.contains("doc")) grow(el);
      if (el.dataset.save) { const [c, id] = el.dataset.save.split("|"); const s = document.querySelector(`[data-saved="${el.dataset.save}"]`); if (s) s.textContent = "Saving"; saveText(c, id, el.value); return; }
      if (el.dataset.brain) { brainPatchLater(el.dataset.brain, el.dataset.f, el.value); return; }
      if (el.dataset.rec && el.tagName !== "SELECT" && el.type !== "date") { const [k, id] = el.dataset.rec.split("|"); patchLater(k, id, el.dataset.f, el.value); return; }
      if (el.dataset.bench && el.type !== "date") { patchLater("bench", el.dataset.bench, el.dataset.f, el.value); return; }
      if (el.dataset.time) { timeLater(el.dataset.time, el.value); return; }
      if (el.dataset.filter === "brain") { brainQ = el.value; $("#brainList").innerHTML = brainRows(brainList()); }
    });

    document.addEventListener("submit", e => {
      const f = e.target;
      if (f.dataset.form === "drill" && mdr) {
        e.preventDefault();
        const v = parseAns(f.a.value); if (v === null) return;
        const ok = Math.abs(v - mdr.q.a) <= Math.max(0.02 * Math.abs(mdr.q.a), 0.01);
        mdr.n++; if (ok) mdr.right++;
        mdr.fb = ok ? "Right." : `Not quite: ${esc(mdr.q.q)} = ${fmtN(mdr.q.a)}${mdr.q.unit || ""}.`;
        mdr.q = newQ();
        $("#drill").outerHTML = drillHTML(); const i = $("#drillIn"); if (i) i.focus();
        return;
      }
      if (f.dataset.form === "zet") {
        e.preventDefault();
        const s = parseInt(f.s.value, 10); if (!(s >= 0)) return;
        S.put("zet", uid("z"), { d: dkey(todayD()), s, at: Date.now() });
        toast("Score logged");
      }
    });

    document.addEventListener("click", e => {
      const row = e.target.closest("tr[data-href]");
      if (row && !e.target.closest("a,button")) { location.hash = row.dataset.href; return; }
      if (e.target.id === "scrim") { closePeek(); return; }
      const tagBtn = e.target.closest("[data-brain-tag]");
      if (tagBtn) { brainTag = tagBtn.dataset.brainTag; render(); return; }
      const th = e.target.closest("[data-theme-set]");
      if (th) { setTheme(th.dataset.themeSet); render(); return; }
      const sc = e.target.closest("[data-bench-score]");
      if (sc) {
        const [id, i, s] = sc.dataset.benchScore.split("|");
        const b = S.get("bench", id) || {}; const scores = (b.scores || Array(15).fill(null)).slice();
        scores[+i] = scores[+i] === +s ? null : +s;
        S.put("bench", id, { ...b, scores }, { silent: true });
        const y = window.scrollY; $("#main").innerHTML = viewBenchEntry(id); window.scrollTo(0, y);
        return;
      }
      const gb = e.target.closest("[data-grade]");
      if (gb && rv && rv.queue.length) { gradeCard(rv.queue[0], +gb.dataset.grade); rerenderMain(); return; }
      const a = e.target.closest("[data-act]"); if (!a) return;
      const act = a.dataset.act, id = a.dataset.id;
      switch (act) {
        case "search": openPalette(); break;
        case "rv-show": if (rv) { rv.shown = true; rerenderMain(); } break;
        case "rv-extra": buildQueue(true); rerenderMain(); break;
        case "drill-start": {
          mdr = { end: Date.now() + 180000, right: 0, n: 0, q: newQ(), fb: "" };
          mdr.timer = setInterval(drillTick, 250);
          rerenderMain(); const i = $("#drillIn"); if (i) i.focus(); break;
        }
        case "peek-close": closePeek(); break;
        case "task-all": case "task-clear": {
          const t = TASK[id]; t.stepIds.forEach(s => S.put("steps", s, act === "task-all" ? 1 : null, { silent: true }));
          $$("#peek [data-step]").forEach(cb => (cb.checked = act === "task-all")); refreshProgress(); break;
        }
        case "brain-new": { const nid = uid("b"); S.put("brain", nid, { term: "", tags: "" }, { silent: true }); go("#/brain/" + nid); setTimeout(() => { const t = $(".title-in"); if (t) t.focus(); }, 30); break; }
        case "brain-del": if (confirm("Delete this entry?")) { S.del("brain", id, { silent: true }); go("#/brain"); } break;
        case "brain-restore": if (confirm("Throw away your edits and restore the seeded version?")) { const { id: _i, ...seed } = CONCEPTS.find(c => c.id === id); S.put("brain", id, seed); } break;
        case "rec-new": { const k = a.dataset.kind, nid = uid(k[0]); S.put(k, nid, RECORDS[k].fields.some(f => f.k === "date") ? { date: dkey(todayD()) } : {}, { silent: true }); go(`#/${k}/${nid}`); setTimeout(() => { const t = $(".title-in"); if (t) t.focus(); }, 30); break; }
        case "rec-del": if (confirm("Delete this " + RECORDS[a.dataset.kind].singular + "?")) { S.del(a.dataset.kind, id, { silent: true }); go("#/" + a.dataset.kind); } break;
        case "bench-new": { const nid = uid("m"); S.put("bench", nid, { date: dkey(todayD()), company: "", scores: Array(15).fill(null) }, { silent: true }); go("#/benchmark/" + nid); break; }
        case "bench-del": if (confirm("Delete this attempt?")) { S.del("bench", id, { silent: true }); go("#/benchmark"); } break;
        case "zet-del": S.del("zet", id); break;
        case "copy-link": { const v = $("#syncLink").value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast("Link copied"), () => { $("#syncLink").select(); toast("Select and copy the link"); }); break; }
        case "sync-now": S.sync("manual"); break;
        case "use-link": {
          const m = ($("#pasteLink").value || "").match(/link=([A-Za-z0-9_-]{32,})/);
          if (!m) { toast("That doesn't look like a sync link"); break; }
          S.setSyncKey(m[1]); S.sync("linked"); toast("Linked. Your progress from both devices is merged."); render(); break;
        }
        case "export": {
          const blob = new Blob([S.exportJSON()], { type: "application/json" });
          const u = URL.createObjectURL(blob), l = document.createElement("a");
          l.href = u; l.download = "road-to-february-" + dkey(new Date()) + ".json"; document.body.appendChild(l); l.click(); l.remove();
          setTimeout(() => URL.revokeObjectURL(u), 1000); break;
        }
        case "reset": if (confirm("Clear every tick, note and entry on every linked device? Download a backup first if you might want it.")) { S.resetAll(); toast("Cleared"); } break;
      }
    });

    document.addEventListener("keydown", e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#pal") ? closePalette() : openPalette(); return; }
      if (e.key === "Escape") { if ($("#pal")) closePalette(); else if (route.q.t) closePeek(); return; }
      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); openPalette(); }
      if (route.name === "review" && rv && rv.queue.length) {
        if (e.key === " " && !rv.shown) { e.preventDefault(); rv.shown = true; rerenderMain(); return; }
        if (rv.shown && ["1", "2", "3"].includes(e.key)) { gradeCard(rv.queue[0], +e.key - 1); rerenderMain(); return; }
      }
      if (route.q.t && (e.key === "j" || e.key === "k")) {
        const t = TASK[route.q.t], w = WEEKS[t.week - 1], i = w.tasks.indexOf(t);
        const n = w.tasks[i + (e.key === "j" ? 1 : -1)]; if (n) go(withTask(route.path || "today", n.id));
      }
    });

    window.addEventListener("hashchange", render);
    window.addEventListener("resize", debounce(() => $$(".ta.doc").forEach(grow), 150));
  }

  function drawQR(el, text) {
    const make = () => { el.innerHTML = ""; new window.QRCode(el, { text, width: 168, height: 168, colorDark: "#1a1a17", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M }); };
    if (window.QRCode) return make();
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    sc.onload = make; sc.onerror = () => { el.textContent = "Couldn't load the QR code, so copy the link instead."; };
    document.head.appendChild(sc);
  }
  function setTheme(v) {
    try { localStorage.setItem("rtf.theme", v); } catch (e) {}
    if (v === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v);
  }

  /* ================================================================ boot */
  setTheme((() => { try { return localStorage.getItem("rtf.theme") || "auto"; } catch (e) { return "auto"; } })());
  shell();
  bind();
  const linked = S.start();
  S.on(kind => {
    if (kind === "status") { renderSync(); return; }
    // Remote changes re-render unless you're typing, in which case wait until you stop.
    if (mdr) return;
    if (isTyping()) { const el = document.activeElement; el.addEventListener("blur", () => render(), { once: true }); return; }
    render();
  });
  render();
  if (linked) toast("This device is now linked");
  setInterval(renderSync, 30000);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
