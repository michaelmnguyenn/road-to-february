/* Local-first state with optional Supabase sync.

   State is a set of collections. Every entry is { v: value, t: timestamp }, and a deletion is stored as
   { v: null, t } so it can win a merge. Merging two copies keeps whichever entry has the later t, which
   means ticking on the phone and writing notes on the laptop never overwrite each other.

   Sync uses a private sync key instead of accounts. The key never leaves this device except inside the
   link you open on your other device, and the database only stores a SHA-256 hash of it. */
(function () {
  const LS_STATE = "rtf.state.v1";
  const LS_KEY = "rtf.syncKey";
  const LS_PUSHED = "rtf.lastPushed";
  const COLLS = ["steps", "notes", "habits", "zet", "brain", "deals", "firms", "bench", "answers", "refl", "settings", "cards", "maths", "cases", "companies", "markets", "time"];

  const cfg = window.RTF_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseKey);

  let state = load();
  const listeners = new Set();
  let status = { mode: configured ? "idle" : "local", at: null, error: null };
  let pushTimer = null;
  let syncing = false;
  let dirty = false;

  function blank() { const c = {}; COLLS.forEach(k => (c[k] = {})); return { c, v: 1 }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_STATE) || "null");
      if (s && s.c) { COLLS.forEach(k => (s.c[k] = s.c[k] || {})); return s; }
    } catch (e) {}
    return blank();
  }
  function persist() { try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) {} }
  function emit(kind) { listeners.forEach(fn => { try { fn(kind); } catch (e) { console.error(e); } }); }

  const now = () => Date.now();

  function get(coll, id) { const e = state.c[coll][id]; return e && e.v !== null ? e.v : undefined; }
  function put(coll, id, v, opts) {
    state.c[coll][id] = { v: v === undefined ? null : v, t: now() };
    persist(); dirty = true; schedulePush();
    if (!opts || !opts.silent) emit("local");
  }
  function del(coll, id, opts) { put(coll, id, null, opts); }
  function all(coll) {
    const out = [];
    const c = state.c[coll];
    for (const id in c) if (c[id].v !== null) out.push([id, c[id].v, c[id].t]);
    return out;
  }
  function raw(coll, id) { return state.c[coll][id]; }

  function mergeInto(target, incoming) {
    let changed = false;
    if (!incoming || !incoming.c) return false;
    for (const k of COLLS) {
      const src = incoming.c[k] || {};
      const dst = target.c[k];
      for (const id in src) {
        const a = dst[id], b = src[id];
        if (!b || typeof b.t !== "number") continue;
        if (!a || b.t > a.t) { dst[id] = { v: b.v === undefined ? null : b.v, t: b.t }; changed = true; }
      }
    }
    return changed;
  }
  function hasNewer(local, remote) {
    for (const k of COLLS) {
      const r = (remote.c && remote.c[k]) || {};
      const l = local.c[k];
      for (const id in l) if (!r[id] || l[id].t > r[id].t) return true;
    }
    return false;
  }

  /* ---------- sync ---------- */
  function syncKey() { try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; } }
  function setSyncKey(k) { try { localStorage.setItem(LS_KEY, k); } catch (e) {} }
  function newKey() {
    const b = new Uint8Array(24); crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // Legacy anon keys are JWTs and go in both headers. New sb_publishable_ keys only go in apikey.
  function headers() {
    const h = { "Content-Type": "application/json", apikey: cfg.supabaseKey };
    if (/^eyJ/.test(cfg.supabaseKey)) h.Authorization = "Bearer " + cfg.supabaseKey;
    return h;
  }
  async function rpc(fn, body) {
    const res = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST", headers: headers(), body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(fn + " " + res.status + " " + (await res.text()).slice(0, 200));
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  }

  function setStatus(s) { status = Object.assign({}, status, s); emit("status"); }

  async function sync(reason) {
    if (!configured) return;
    let key = syncKey();
    if (!key) { key = newKey(); setSyncKey(key); }
    if (syncing) { dirty = true; return; }
    syncing = true;
    setStatus({ mode: "busy" });
    try {
      const remote = await rpc("rtf_get", { p_key: key });
      const before = JSON.stringify(state);
      const changedLocal = remote ? mergeInto(state, remote) : false;
      if (changedLocal) persist();
      const needPush = !remote || dirty || hasNewer(state, remote);
      if (needPush) {
        dirty = false;
        await rpc("rtf_put", { p_key: key, p_data: state });
        try { localStorage.setItem(LS_PUSHED, String(now())); } catch (e) {}
      }
      setStatus({ mode: "ok", at: now(), error: null });
      if (changedLocal && JSON.stringify(state) !== before) emit("remote");
    } catch (e) {
      console.warn("sync failed", e);
      dirty = true;
      setStatus({ mode: "err", error: String(e.message || e) });
    } finally {
      syncing = false;
      if (dirty) {
        clearTimeout(pushTimer);
        pushTimer = setTimeout(() => sync("retry"), status.mode === "err" ? 30000 : 1500);
      }
    }
  }

  function schedulePush() {
    if (!configured) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => sync("push"), 1500);
  }

  function linkFromHash() {
    const m = location.hash.match(/[#&?]link=([A-Za-z0-9_-]{32,})/);
    if (!m) return false;
    setSyncKey(m[1]);
    history.replaceState(null, "", location.pathname + location.search + "#/settings");
    return true;
  }

  function start() {
    const linked = linkFromHash();
    if (!configured) return linked;
    sync("start");
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync("focus"); });
    window.addEventListener("online", () => sync("online"));
    setInterval(() => { if (document.visibilityState === "visible") sync("interval"); }, 120000);
    window.addEventListener("pagehide", () => {
      if (!dirty) return;
      try {
        fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/rtf_put", {
          method: "POST", keepalive: true,
          headers: headers(),
          body: JSON.stringify({ p_key: syncKey(), p_data: state })
        });
      } catch (e) {}
    });
    return linked;
  }

  /* ---------- import / export ---------- */
  function exportJSON() { return JSON.stringify(state, null, 1); }
  function importJSON(text) {
    const inc = JSON.parse(text);
    if (!inc || !inc.c) throw new Error("That file isn't a Road to February backup.");
    mergeInto(state, inc); persist(); dirty = true; schedulePush(); emit("remote");
  }
  function resetAll() {
    // Tombstone everything so the reset also reaches other devices.
    const t = now();
    for (const k of COLLS) for (const id in state.c[k]) state.c[k][id] = { v: null, t };
    persist(); dirty = true; schedulePush(); emit("remote");
  }

  window.RTFStore = {
    get, put, del, all, raw, on: fn => (listeners.add(fn), () => listeners.delete(fn)),
    start, sync, status: () => status, configured, syncKey, setSyncKey, newKey,
    exportJSON, importJSON, resetAll, _merge: mergeInto
  };
})();
