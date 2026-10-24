/* =========================================================
 * 真實市場數據：Alpaca（美股／ETF，2016 年至今）＋ Binance（加密貨幣，例如 BTC-USD）
 * - 5 分鐘 K 線，按月下載並存喺瀏覽器 IndexedDB（下次唔使再下載）
 * - 砌成「交易日」：正常交易時段 K 線、昨日高低收、20 日線、ATR20、同時段平均成交量
 * Alpaca 金鑰：雲端模式存喺 Firestore（只有成員讀到）；本機模式存喺呢部機。
 * ========================================================= */
(function () {
  const ALPACA = 'https://data.alpaca.markets/v2/stocks/';
  const BINANCE = 'https://api.binance.com/api/v3/klines';
  const DAY = 86400000;
  const isCrypto = (sym) => /-(USD|USDT)$/i.test(sym) || /USDT$/i.test(sym);
  const binSym = (sym) => sym.toUpperCase().replace(/-USD$/, 'USDT').replace(/-USDT$/, 'USDT').replace('-', '');

  /* ---------------- 金鑰 ---------------- */
  let keyCache = null;
  async function getKeys() {
    if (keyCache) return keyCache;
    if (window.Cloud && Cloud.enabled && Store.isCloud() && Cloud.getConfig) {
      try { const k = await Cloud.getConfig('alpaca'); if (k && k.keyId) return (keyCache = k); } catch (e) { console.warn(e); }
    }
    try { const k = JSON.parse(localStorage.getItem('ta:alpaca') || 'null'); if (k && k.keyId) return (keyCache = k); } catch (e) {}
    return null;
  }
  async function setKeys(k) {
    keyCache = k && k.keyId ? k : null;
    if (window.Cloud && Cloud.enabled && Store.isCloud() && Cloud.setConfig) { await Cloud.setConfig('alpaca', k); try { localStorage.removeItem('ta:alpaca'); } catch (e) {} }
    else localStorage.setItem('ta:alpaca', JSON.stringify(k));
  }
  window.addEventListener('ta:sync', () => { if (!Store.isCloud()) keyCache = null; });

  /* ---------------- IndexedDB 快取（每月一份） ---------------- */
  let idbP = null;
  function idb() {
    if (idbP) return idbP;
    idbP = new Promise((res) => {
      try {
        const r = indexedDB.open('ta-market', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('chunks');
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    return idbP;
  }
  async function cacheGet(key) { const d = await idb(); if (!d) return null; return new Promise((res) => { try { const q = d.transaction('chunks').objectStore('chunks').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
  async function cachePut(key, val) { const d = await idb(); if (!d) return; return new Promise((res) => { try { const t = d.transaction('chunks', 'readwrite'); t.objectStore('chunks').put(val, key); t.oncomplete = () => res(); t.onerror = () => res(); } catch (e) { res(); } }); }
  async function clearCache() { const d = await idb(); if (!d) return; return new Promise((res) => { const t = d.transaction('chunks', 'readwrite'); t.objectStore('chunks').clear(); t.oncomplete = () => res(); t.onerror = () => res(); }); }

  /* ---------------- 下載 ---------------- */
  let feedPref = null;
  async function alpacaRange(sym, startMs, endMs, keys) {
    const feed = feedPref || keys.feed || 'sip';
    const out = [];
    let token = null;
    do {
      const url = `${ALPACA}${encodeURIComponent(sym.toUpperCase())}/bars?timeframe=5Min&start=${new Date(startMs).toISOString()}&end=${new Date(endMs).toISOString()}&limit=10000&adjustment=split&feed=${feed}${token ? '&page_token=' + encodeURIComponent(token) : ''}`;
      let res;
      try { res = await fetch(url, { headers: { 'APCA-API-KEY-ID': keys.keyId, 'APCA-API-SECRET-KEY': keys.secret } }); }
      catch (e) { throw new Error('連唔到 Alpaca（網絡問題或者被瀏覽器擋咗）'); }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 403 && feed === 'sip' && /sip|subscription/i.test(text)) { feedPref = 'iex'; return alpacaRange(sym, startMs, endMs, keys); }
        if (res.status === 401 || res.status === 403) throw new Error('Alpaca 金鑰無效或者冇權限（' + res.status + '）');
        if (res.status === 422) throw new Error('Alpaca 唔認識呢個代號或者日期範圍');
        if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500)); continue; }
        throw new Error('Alpaca 錯誤 ' + res.status + '：' + text.slice(0, 120));
      }
      const j = await res.json();
      (j.bars || []).forEach((b) => out.push({ ts: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
      token = j.next_page_token;
    } while (token);
    return { bars: out, feed };
  }
  async function binanceRange(sym, startMs, endMs) {
    const out = [];
    let from = startMs;
    while (from < endMs) {
      const res = await fetch(`${BINANCE}?symbol=${binSym(sym)}&interval=5m&startTime=${from}&endTime=${endMs}&limit=1000`).catch(() => null);
      if (!res || !res.ok) throw new Error('Binance 下載失敗' + (res ? '（' + res.status + '）' : ''));
      const rows = await res.json();
      if (!rows.length) break;
      rows.forEach((r) => out.push({ ts: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] }));
      from = rows[rows.length - 1][0] + 1;
      if (rows.length < 1000) break;
    }
    return { bars: out, feed: 'binance' };
  }
  const monthKey = (d) => d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  async function fetchRange(sym, startMs, endMs, onProgress) {
    const crypto = isCrypto(sym);
    const keys = crypto ? null : await getKeys();
    if (!crypto && !keys) throw new Error('未設定 Alpaca 金鑰：去 ⚙️ 設定 → 市場數據 輸入');
    const src = crypto ? 'binance' : 'alpaca';
    const months = [];
    for (let d = new Date(Date.UTC(new Date(startMs).getUTCFullYear(), new Date(startMs).getUTCMonth(), 1)); d.getTime() < endMs; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) months.push(d);
    const all = []; let feed = crypto ? 'binance' : null, done = 0;
    for (const m of months) {
      const key = `${src}|${sym.toUpperCase()}|5m|${monthKey(m)}`;
      const mStart = m.getTime(), mEnd = Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1);
      let chunk = await cacheGet(key);
      const fresh = chunk && (chunk.complete || Date.now() - chunk.fetchedAt < 30 * 60000);
      if (!fresh) {
        const end = Math.min(mEnd, Date.now() - 16 * 60000);
        const r = crypto ? await binanceRange(sym, mStart, end) : await alpacaRange(sym, mStart, end, keys);
        chunk = { bars: r.bars, feed: r.feed, fetchedAt: Date.now(), complete: mEnd < Date.now() - DAY };
        await cachePut(key, chunk);
      }
      feed = feed || chunk.feed;
      chunk.bars.forEach((b) => { if (b.ts >= startMs && b.ts < endMs) all.push(b); });
      done++; if (onProgress) onProgress(done, months.length, monthKey(m));
    }
    all.sort((a, b) => a.ts - b.ts);
    return { bars: all, feed, src };
  }

  /* ---------------- 美東時間 ---------------- */
  const etFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const offCache = {};
  function etParts(ts) {
    // 時差每個鐘頭最多變一次，按鐘頭快取
    const hk = Math.floor(ts / 3600000);
    let off = offCache[hk];
    if (off == null) {
      const p = {}; etFmt.formatToParts(new Date(ts)).forEach((x) => (p[x.type] = x.value));
      off = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(ts / 60000) * 60000;
      offCache[hk] = off;
    }
    const d = new Date(ts + off);
    return { date: d.toISOString().slice(0, 10), mins: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  /* ---------------- 砌交易日 ---------------- */
  function buildSessions(raw, crypto) {
    const byDay = new Map();
    raw.forEach((b) => {
      let date, mins;
      if (crypto) { const d = new Date(b.ts); date = d.toISOString().slice(0, 10); mins = d.getUTCHours() * 60 + d.getUTCMinutes(); }
      else { const p = etParts(b.ts); date = p.date; mins = p.mins; if (mins < 570 || mins >= 960) return; }
      if (!byDay.has(date)) byDay.set(date, []);
      byDay.get(date).push({ t: hhmm(mins), slot: Math.floor((mins - (crypto ? 0 : 570)) / 5), ts: b.ts, o: b.o, h: b.h, l: b.l, c: b.c, v: crypto ? b.v : b.v / 1e6 });
    });
    const days = Array.from(byDay.keys()).sort();
    const sessions = [];
    days.forEach((date, k) => {
      const bars = byDay.get(date);
      if (bars.length < (crypto ? 200 : 30)) return; // 唔完整嘅日子（例如數據缺失）唔要
      const o = bars[0].o, c = bars[bars.length - 1].c;
      let h = -Infinity, l = Infinity; bars.forEach((x) => { if (x.h > h) h = x.h; if (x.l < l) l = x.l; });
      const cum = []; let acc = 0; bars.forEach((x) => { acc += x.v; cum[x.slot] = acc; });
      sessions.push({ date, bars, o, h, l, c, cum });
    });
    sessions.forEach((s, i) => {
      const prev = sessions[i - 1];
      s.pc = prev ? prev.c : null; s.pdh = prev ? prev.h : null; s.pdl = prev ? prev.l : null;
      if (i >= 20) {
        const win = sessions.slice(i - 20, i);
        s.sma20 = win.reduce((a, x) => a + x.c, 0) / 20;
        s.atr20 = win.reduce((a, x, j) => { const pc = j ? win[j - 1].c : (sessions[i - 21] || x).c; return a + Math.max(x.h - x.l, Math.abs(x.h - pc), Math.abs(x.l - pc)); }, 0) / 20;
        if (i >= 25) { const w5 = sessions.slice(i - 25, i - 5); s.sma20Prev = w5.reduce((a, x) => a + x.c, 0) / 20; }
        const avg = [];
        win.forEach((x) => x.cum.forEach((v, slot) => { if (v != null) { avg[slot] = (avg[slot] || 0) + v / 20; } }));
        s.avgCum = avg;
      }
    });
    return sessions;
  }

  /* ---------------- 對外 ---------------- */
  let last = null;
  async function load(sym, startDate, endDate, onProgress) {
    sym = (sym || 'TSLA').trim().toUpperCase();
    const crypto = isCrypto(sym);
    const startMs = Date.parse(startDate + 'T00:00:00Z') - 45 * DAY; // 預留 45 日計 20 日線
    const endMs = Math.min(Date.parse(endDate + 'T00:00:00Z') + DAY, Date.now());
    const r = await fetchRange(sym, startMs, endMs, onProgress);
    const all = buildSessions(r.bars, crypto);
    const sessions = all.filter((s) => s.date >= startDate && s.date <= endDate);
    last = { sym, src: r.src, feed: r.feed, crypto, startDate, endDate, sessions, loadedAt: Date.now() };
    try { Store.setUI({ mdLast: { sym, startDate, endDate } }); } catch (e) {}
    window.dispatchEvent(new CustomEvent('ta:market', { detail: last }));
    return last;
  }
  async function ensureLast() {
    if (last) return last;
    const p = (Store.ui() || {}).mdLast;
    if (!p) return null;
    try { return await load(p.sym, p.startDate, p.endDate); } catch (e) { return null; }
  }

  window.MarketData = { getKeys, setKeys, load, ensureLast, clearCache, isCrypto, buildSessions, etParts, get last() { return last; }, set last(v) { last = v; } };
})();
