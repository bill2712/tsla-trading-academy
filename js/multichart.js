/* =========================================================
 * 📺 多圖同步看盤（免費版 Multi-Chart）  路由：#/charts
 * 用 TradingView 開源 Lightweight Charts™（Apache 2.0，免費）+ Alpaca 免費數據喺平台入面自己畫：
 *  - 1–4 個圖（Level 10 第 6.2 節建議：個股 5m + 個股日線 + QQQ 5m）
 *  - 同步：股票代號、十字線、時間軸；可以開第二個視窗放第二個螢幕，兩個視窗一樣同步
 *  - VWAP、EMA 9／20、日線 SMA 20／50、昨日高低收、盤前高低、開市 5 分鐘區間
 *  - A+ 檢查：由開市計 vs QQQ 嘅相對強弱、首 5 分鐘成交倍數、QQQ 喺 VWAP 上定下、11:30 收工倒數
 * 數據（Alpaca 免費帳戶）：SIP（全市場）延遲 15 分鐘；IEX（一間交易所）即時，成交量約全市場 2–3%。
 * 「智能」模式 = SIP 歷史 + 最近 15 分鐘用 IEX；IEX 成交量按同日重疊時段嘅 SIP／IEX 比例放大（標明「估算」）。
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const f2 = (v) => (num(v) == null ? '—' : v.toFixed(2));
  const pc = (v, d = 2) => (num(v) == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%');
  const big = (v) => { if (num(v) == null) return '—'; const a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(Math.round(v)); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const okSym = (s) => /^[A-Z][A-Z0-9.]{0,9}$/.test(s || '');

  const API = 'https://data.alpaca.markets/v2/stocks/';
  const LIB = 'js/vendor/lightweight-charts.standalone.production.js';
  const SIP_DELAY = 16 * 60e3; // 免費帳戶：SIP 只可以攞 15 分鐘之前嘅數據（留少少位俾電腦時鐘誤差）
  let sipExtra = 0; // 電腦時鐘快過 Alpaca 嘅話，自動再退後
  const TF = {
    '1Min': { label: '1m', sec: 60, days: 4 },
    '5Min': { label: '5m', sec: 300, days: 30 },
    '15Min': { label: '15m', sec: 900, days: 45 },
    '1Hour': { label: '1h', sec: 3600, days: 90 },
    '1Day': { label: '日線', sec: 86400, days: 420 },
  };
  const MODES = { hybrid: '智能：全市場 + 即時（建議）', iex: '即時：只用 IEX', sip: '全市場 SIP（延遲 15 分鐘）' };
  const LAYOUTS = {
    1: { name: '1 個圖', panes: [{ tf: '5Min' }] },
    2: { name: '2 個圖：5m + 日線', panes: [{ tf: '5Min' }, { tf: '1Day' }] },
    3: { name: '3 個圖：5m + 日線 + QQQ（建議）', panes: [{ tf: '5Min' }, { tf: '1Day' }, { tf: '5Min', sym: 'QQQ' }] },
    4: { name: '4 個圖：1m + 5m + 日線 + QQQ', panes: [{ tf: '1Min' }, { tf: '5Min' }, { tf: '1Day' }, { tf: '5Min', sym: 'QQQ' }] },
    d: { name: '2 個圖：日線 + QQQ（第二個螢幕）', panes: [{ tf: '1Day' }, { tf: '5Min', sym: 'QQQ' }] },
  };

  /* ---------------- 美東時間（圖表用「美東時鐘」顯示） ---------------- */
  const offCache = new Map();
  function etOff(ms) {
    const k = Math.floor(ms / 864e5); let o = offCache.get(k);
    if (o == null) { const h = +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(new Date(k * 864e5 + 12 * 36e5)); o = 12 - h; offCache.set(k, o); }
    return o;
  }
  const etSec = (ms) => Math.floor(ms / 1000) - etOff(ms) * 3600; // 「美東時鐘」秒數（當 UTC 顯示）
  const sDay = (s) => new Date(s * 1000).toISOString().slice(0, 10);
  const sHM = (s) => new Date(s * 1000).toISOString().slice(11, 16);
  const isRTH = (s) => { const hm = sHM(s); return hm >= '09:30' && hm < '16:00'; };
  const hkHM = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  function liveNow() { const s = etSec(Date.now()), wd = new Date(s * 1000).getUTCDay(), hm = sHM(s); return wd >= 1 && wd <= 5 && hm >= '04:00' && hm < '20:00'; }

  /* ---------------- 載入圖表程式庫（第一次入呢頁先載，約 160KB） ---------------- */
  let libP = null;
  function loadLib() {
    if (window.LightweightCharts) return Promise.resolve();
    if (!libP) libP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIB; s.onload = res; s.onerror = () => { libP = null; rej(new Error('載入圖表程式庫失敗（檢查網絡）')); }; document.head.appendChild(s); });
    return libP;
  }

  /* ---------------- Alpaca ---------------- */
  async function getBars(keys, sym, tf, feed, startMs, endMs) {
    const out = []; let token = null, tries = 0, back = 0;
    if (feed === 'sip' && endMs) endMs -= sipExtra;
    do {
      const u = `${API}${encodeURIComponent(sym)}/bars?timeframe=${tf}&start=${new Date(startMs).toISOString()}${endMs ? '&end=' + new Date(endMs).toISOString() : ''}&limit=10000&adjustment=split&feed=${feed}${token ? '&page_token=' + encodeURIComponent(token) : ''}`;
      let r;
      try { r = await fetch(u, { headers: { 'APCA-API-KEY-ID': keys.keyId, 'APCA-API-SECRET-KEY': keys.secret } }); } catch (e) { throw new Error('連唔到 Alpaca（網絡問題）'); }
      if (r.status === 429 && tries++ < 3) { await sleep(1500 * tries); continue; }
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        if (r.status === 403 && /recent SIP/i.test(t)) {
          if (feed === 'sip' && endMs && back++ < 3 && !token) { sipExtra = Math.min(sipExtra + 2 * 60e3, 10 * 60e3); endMs -= 2 * 60e3; continue; }
          throw new Error('免費帳戶唔可以攞最近 15 分鐘嘅全市場（SIP）數據（檢查電腦時鐘準唔準）');
        }
        if (r.status === 401 || r.status === 403) throw new Error('Alpaca 金鑰無效或者冇權限（' + r.status + '）');
        if (r.status === 422 || r.status === 400) throw new Error('Alpaca 唔認識「' + sym + '」');
        throw new Error('Alpaca 錯誤 ' + r.status);
      }
      const j = await r.json();
      (j.bars || []).forEach((b) => out.push({ t: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
      token = j.next_page_token;
    } while (token);
    return out;
  }

  /* ---------------- 數據源（同一隻股 + 同一個時間框架共用，唔會重複下載） ---------------- */
  const kBySym = {}; // 每隻股今日 SIP／IEX 成交比例（估算 IEX 成交用）
  const feeds = new Map();
  let queue = Promise.resolve();
  const serial = (fn) => (queue = queue.then(fn, fn)); // 一次一個請求，避免撞 Alpaca 限速
  class Feed {
    constructor(sym, tf, mode) { Object.assign(this, { sym, tf, mode, bars: new Map(), subs: new Set(), loaded: false, loading: null, error: null, sipLast: 0, nextSip: 0, nextTail: 0, updated: 0, k: null }); }
    get key() { return `${this.sym}|${this.tf}|${this.mode}`; }
    sorted() { return [...this.bars.values()].sort((a, b) => a.t - b.t); }
    emit() { this.updated = Date.now(); this.subs.forEach((f) => { try { f(this); } catch (e) { console.warn(e); } }); }
    async load(keys) {
      if (this.loading) return this.loading;
      this.loading = serial(async () => {
        try {
          const start = Date.now() - TF[this.tf].days * 864e5;
          if (this.mode === 'iex' && this.tf !== '1Day') (await getBars(keys, this.sym, this.tf, 'iex', start)).forEach((b) => this.bars.set(b.t, b));
          else {
            const s = await getBars(keys, this.sym, this.tf, 'sip', start, Date.now() - SIP_DELAY);
            s.forEach((b) => this.bars.set(b.t, b));
            this.sipLast = s.length ? s[s.length - 1].t : 0;
            if (this.mode === 'hybrid' && this.tf !== '1Day') await this.tail(keys);
          }
          this.loaded = true; this.error = null;
          this.nextSip = Date.now() + 60e3; this.nextTail = Date.now() + 15e3;
        } catch (e) { this.error = e.message || String(e); }
        if (!this.loaded) this.loading = null; // 失敗咗下次再試
        this.emit();
      });
      return this.loading;
    }
    /* 最近 15 分鐘：IEX 即時；包一個鐘重疊，計 SIP／IEX 成交比例 */
    async tail(keys) {
      const from = Math.min(this.sipLast || Date.now(), Date.now() - SIP_DELAY) - 60 * 60e3;
      const ie = await getBars(keys, this.sym, this.tf, 'iex', from);
      if (this.mode === 'iex') { ie.forEach((b) => this.bars.set(b.t, b)); return; }
      let s = 0, i = 0, n = 0;
      ie.forEach((b) => { const x = this.bars.get(b.t); if (b.t <= this.sipLast && x && !x.est && b.v > 0) { s += x.v; i += b.v; n++; } });
      if (n >= 5 && i > 0) { this.k = Math.max(1, Math.min(1000, s / i)); if (this.tf === '1Min' || this.tf === '5Min') kBySym[this.sym] = this.k; }
      const k = this.k || kBySym[this.sym] || null;
      ie.filter((b) => b.t > this.sipLast).forEach((b) => this.bars.set(b.t, Object.assign({}, b, { v: k ? b.v * k : b.v, vRaw: b.v, est: k ? 'scaled' : 'iex' })));
    }
    async poll(keys) {
      if (!this.loaded || this.tf === '1Day') return;
      const now = Date.now();
      try {
        if (this.mode !== 'iex' && now >= this.nextSip) {
          this.nextSip = now + 60e3;
          const s = await getBars(keys, this.sym, this.tf, 'sip', (this.sipLast || now - 864e5) - TF[this.tf].sec * 1000, now - SIP_DELAY);
          s.forEach((b) => this.bars.set(b.t, b));
          if (s.length) this.sipLast = Math.max(this.sipLast, s[s.length - 1].t);
          if (this.mode === 'sip') this.emit();
        }
        if (this.mode !== 'sip' && now >= this.nextTail) {
          this.nextTail = now + 15e3;
          if (this.mode === 'iex') { const last = this.sorted().pop(); const ie = await getBars(keys, this.sym, this.tf, 'iex', last ? last.t - TF[this.tf].sec * 2000 : now - 864e5); ie.forEach((b) => this.bars.set(b.t, b)); }
          else await this.tail(keys);
          this.emit();
        }
        this.error = null;
      } catch (e) { this.error = e.message || String(e); this.emit(); }
    }
  }
  function feedFor(sym, tf, mode) {
    const key = `${sym}|${tf}|${mode}`;
    if (!feeds.has(key)) feeds.set(key, new Feed(sym, tf, mode));
    return feeds.get(key);
  }

  /* ---------------- 計算 ---------------- */
  function emaArr(vals, n) { const k = 2 / (n + 1); let e = null; return vals.map((v, i) => { if (i < n - 1) return null; if (e == null) e = vals.slice(0, n).reduce((a, b) => a + b, 0) / n; else e = v * k + e * (1 - k); return e; }); }
  function smaArr(vals, n) { let s = 0; return vals.map((v, i) => { s += v; if (i >= n) s -= vals[i - n]; return i >= n - 1 ? s / n : null; }); }
  /* 由日內 K 線砌每個交易日（正常時段）同今日盤前 */
  function sessionsOf(bars) {
    const by = new Map();
    bars.forEach((b) => { const s = etSec(b.t), d = sDay(s); if (!by.has(d)) by.set(d, { d, rth: [], pre: [], post: [] }); const g = by.get(d), hm = sHM(s); (hm < '09:30' ? g.pre : hm < '16:00' ? g.rth : g.post).push(b); });
    return [...by.values()].sort((a, b) => (a.d < b.d ? -1 : 1));
  }
  const vwapOf = (B) => { let pv = 0, vv = 0; B.forEach((b) => { pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; }); return vv ? pv / vv : null; };
  function dayBar(rth) { if (!rth.length) return null; return { o: rth[0].o, h: Math.max(...rth.map((b) => b.h)), l: Math.min(...rth.map((b) => b.l)), c: rth[rth.length - 1].c, v: rth.reduce((a, b) => a + b.v, 0), est: rth.some((b) => b.est) }; }
  /* 關鍵位：昨日高低收、盤前高低、開市 5 分鐘區間 */
  function levelsOf(bars, tf) {
    const S = sessionsOf(bars); if (!S.length) return {};
    const cur = S[S.length - 1], prev = [...S].reverse().find((g) => g.d < cur.d && g.rth.length);
    const L = {};
    if (prev) { const p = dayBar(prev.rth); L.pdh = p.h; L.pdl = p.l; L.pdc = p.c; }
    if (cur.pre.length) { L.pmh = Math.max(...cur.pre.map((b) => b.h)); L.pml = Math.min(...cur.pre.map((b) => b.l)); }
    if ((tf === '1Min' || tf === '5Min') && cur.rth.length) {
      const or = cur.rth.filter((b) => sHM(etSec(b.t)) < '09:35');
      const done = tf === '1Min' ? or.length >= 5 : or.length >= 1 && cur.rth.length >= 2;
      if (done) { L.orh = Math.max(...or.map((b) => b.h)); L.orl = Math.min(...or.map((b) => b.l)); }
    }
    return L;
  }
  /* A+ 檢查：由開市計 RS、首 5 分鐘成交倍數、QQQ vs VWAP（全部用 5 分鐘數據） */
  function snapshot(bars) {
    const S = sessionsOf(bars); if (!S.length) return null;
    const today = sDay(etSec(Date.now()));
    const cur = S[S.length - 1], prev = [...S].reverse().find((g) => g.d < cur.d && g.rth.length);
    const last = bars[bars.length - 1];
    const o = {
      day: cur.d, isToday: cur.d === today, last: last.c, lastEst: !!last.est, prevClose: prev ? prev.rth[prev.rth.length - 1].c : null,
      open: cur.rth.length ? cur.rth[0].o : null, vwap: cur.rth.length ? vwapOf(cur.rth) : null,
    };
    // 正常時段開始之後用正常時段嘅價（收市後唔會用盤後價計「由開市」）
    if (cur.rth.length) { o.last = cur.rth[cur.rth.length - 1].c; o.lastEst = !!cur.rth[cur.rth.length - 1].est; }
    o.chgPrev = o.prevClose ? (o.last / o.prevClose - 1) * 100 : null;
    o.chgOpen = o.open ? (o.last / o.open - 1) * 100 : null;
    const first = cur.rth.find((b) => sHM(etSec(b.t)) === '09:30');
    const hist = S.filter((g) => g.d < cur.d).slice(-20).map((g) => g.rth.find((b) => sHM(etSec(b.t)) === '09:30')).filter((b) => b && b.v > 0 && !b.est);
    if (first && hist.length >= 5 && cur.rth.length >= 2) { o.rvol5 = first.v / (hist.reduce((a, b) => a + b.v, 0) / hist.length); o.rvol5Est = !!first.est; o.rvol5Days = hist.length; }
    return o;
  }

  /* ---------------- 狀態（每個視窗分開儲存：主視窗 = main，第二個視窗 = 2） ---------------- */
  const WID = Math.random().toString(36).slice(2);
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('ta-multichart') : null;
  let S = null, win = 'main', pop = false, panes = [], root = null, timer = null, clock = null, keys = null, picks = [], active = false, strip = { sym: null, qqq: null };
  const DEF = (w) => ({ sym: 'TSLA', layout: w === 'main' ? (innerWidth < 760 ? '1' : '3') : 'd', mode: 'hybrid', ext: true, xsync: true, tsync: true, lv: true, ema20: false, link: true, recent: [], panes: null });
  function loadState(w) {
    let all = {}; try { all = (Store.user().toolState || {}).multichart || {}; } catch (e) {}
    return Object.assign(DEF(w), all[w] || {});
  }
  function saveState() {
    try { const u = Store.user(); u.toolState = u.toolState || {}; const all = Object.assign({}, u.toolState.multichart || {}); all[win] = S; u.toolState.multichart = all; Store.save(); } catch (e) {}
  }
  const paneCfgs = () => S.panes && S.panes.length === LAYOUTS[S.layout].panes.length ? S.panes : LAYOUTS[S.layout].panes.map((p) => Object.assign({}, p));

  /* ---------------- 主題顏色 ---------------- */
  function colors() {
    const cs = getComputedStyle(document.documentElement), v = (k, d) => (cs.getPropertyValue(k) || '').trim() || d;
    return { text: v('--text', '#1b2333'), muted: v('--muted', '#6b7486'), border: v('--border', '#e2e6ef'), card: v('--card', '#fff'), up: v('--up', '#16a34a'), down: v('--down', '#dc2626') };
  }
  const alpha = (hex, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const COL = { vwap: '#f59e0b', ema9: '#8b5cf6', ema20: '#0ea5e9', sma20: '#0ea5e9', sma50: '#ec4899', pdh: '#0ea5e9', pdc: '#64748b', pm: '#a855f7', or: '#f97316' };

  /* ---------------- 一個圖 ---------------- */
  class Pane {
    constructor(i, cfg) { this.i = i; this.cfg = cfg; this.lines = []; this.times = []; this.byTime = new Map(); }
    get sym() { return this.cfg.sym || S.sym; }
    get daily() { return this.cfg.tf === '1Day'; }
    html() {
      const c = this.cfg;
      return `<section class="mc-pane" data-pane="${this.i}">
        <div class="mc-ph"><b data-title>${esc(this.sym)}</b>
          <select data-ptf aria-label="時間框架">${Object.entries(TF).map(([k, t]) => `<option value="${k}" ${k === c.tf ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
          <select data-psym aria-label="股票來源"><option value="" ${!c.sym ? 'selected' : ''}>🔗 跟主代號</option>${['QQQ', 'SPY', 'IWM', 'SMH'].map((s) => `<option value="${s}" ${c.sym === s ? 'selected' : ''}>${s}</option>`).join('')}${c.sym && !['QQQ', 'SPY', 'IWM', 'SMH'].includes(c.sym) ? `<option value="${esc(c.sym)}" selected>${esc(c.sym)}</option>` : ''}<option value="?">其他…</option></select>
          <span class="mc-badge" data-badge></span></div>
        <div class="mc-chart" data-chart><div class="mc-legend" data-legend></div><div class="mc-msg" data-msg>載入緊…</div></div></section>`;
    }
    mount(el) {
      this.el = el; const C = colors(), LW = window.LightweightCharts;
      this.chart = LW.createChart($('[data-chart]', el), {
        autoSize: true,
        layout: { background: { type: 'solid', color: C.card }, textColor: C.muted, fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' },
        grid: { vertLines: { color: alpha(C.border, 0.5) || C.border }, horzLines: { color: alpha(C.border, 0.5) || C.border } },
        rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.08, bottom: 0.22 } },
        timeScale: { borderColor: C.border, timeVisible: !this.daily, secondsVisible: false, rightOffset: 4 },
        crosshair: { mode: 0 },
        localization: { locale: 'en-US' },
      });
      this.candle = this.chart.addCandlestickSeries({ upColor: C.up, downColor: C.down, borderUpColor: C.up, borderDownColor: C.down, wickUpColor: C.up, wickDownColor: C.down, priceLineVisible: true });
      this.vol = this.chart.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false });
      this.chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, visible: false });
      const line = (color, w = 1.5, style = 0) => this.chart.addLineSeries({ color, lineWidth: w, lineStyle: style, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      if (this.daily) { this.sma20 = line(COL.sma20, 1.5); this.sma50 = line(COL.sma50, 1.5); }
      else { this.vwap = line(COL.vwap, 2); this.ema9 = line(COL.ema9, 1.5); this.ema20 = line(COL.ema20, 1.5, 2); }
      this.chart.subscribeCrosshairMove((p) => this.onCross(p));
      this.chart.timeScale().subscribeVisibleTimeRangeChange((r) => this.onRange(r));
      const box = $('[data-chart]', el);
      ['pointerenter', 'pointerdown', 'wheel', 'touchstart'].forEach((ev) => box.addEventListener(ev, () => { leader = this; }, { passive: true }));
      box.addEventListener('mouseleave', () => { this.legend(null); if (!S.xsync) return; panes.forEach((o) => { if (o !== this) o.showX(null); }); if (bc && S.link) bc.postMessage({ from: WID, type: 'x', t: null }); });
      $('[data-ptf]', el).addEventListener('change', (e) => { this.cfg.tf = e.target.value; savePanes(); build(); });
      $('[data-psym]', el).addEventListener('change', (e) => {
        let v = e.target.value;
        if (v === '?') { v = (prompt('輸入股票代號（例如 NVDA）', '') || '').trim().toUpperCase(); if (!okSym(v)) { e.target.value = this.cfg.sym || ''; return; } }
        this.cfg.sym = v || null; savePanes(); build();
      });
      this.attach();
    }
    attach() {
      if (this.feed) this.feed.subs.delete(this.cb);
      if (this.helper) this.helper.subs.delete(this.cb);
      this.cb = () => this.render();
      this.feed = feedFor(this.sym, this.cfg.tf, S.mode); this.feed.subs.add(this.cb);
      if (this.daily) { this.helper = feedFor(this.sym, '5Min', S.mode); this.helper.subs.add(this.cb); } else this.helper = null;
      $('[data-title]', this.el).textContent = this.sym;
      this.first = true;
      this.render();
    }
    destroy() { if (this.feed) this.feed.subs.delete(this.cb); if (this.helper) this.helper.subs.delete(this.cb); try { this.chart.remove(); } catch (e) {} }
    msg(t) { const m = $('[data-msg]', this.el); m.textContent = t || ''; m.hidden = !t; }
    render() {
      const F = this.feed;
      if (!F.loaded) { this.msg(F.error ? '⚠️ ' + F.error : '載入緊 ' + this.sym + '…'); return; }
      const C = colors();
      let bars = F.sorted();
      if (!bars.length) { this.msg(`${this.sym} 冇數據（代號啱唔啱？）`); return; }
      this.msg(F.error ? '⚠️ 更新失敗：' + F.error : '');
      const ts = this.chart.timeScale(), prevRange = this.first ? null : ts.getVisibleLogicalRange(), prevLen = this.times.length;
      let cd = [], vd = [];
      if (this.daily) {
        const today = sDay(etSec(Date.now()));
        bars = bars.filter((b) => sDay(etSec(b.t)) !== today);
        const H = this.helper && this.helper.loaded ? sessionsOf(this.helper.sorted()) : [];
        const cur = H[H.length - 1], tb = cur && cur.d === today ? dayBar(cur.rth) : null;
        const rows = bars.map((b) => ({ s: Date.parse(sDay(etSec(b.t)) + 'T00:00:00Z') / 1000, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
        if (tb) rows.push(Object.assign({ s: Date.parse(today + 'T00:00:00Z') / 1000 }, tb));
        cd = rows.map((r) => ({ time: r.s, open: r.o, high: r.h, low: r.l, close: r.c }));
        vd = rows.map((r) => ({ time: r.s, value: r.v, color: r.est ? 'rgba(148,163,184,.55)' : alpha(r.c >= r.o ? C.up : C.down, 0.35) }));
        const closes = rows.map((r) => r.c), s20 = smaArr(closes, 20), s50 = smaArr(closes, 50);
        this.sma20.setData(rows.map((r, i) => (s20[i] == null ? { time: r.s } : { time: r.s, value: s20[i] })));
        this.sma50.setData(rows.map((r, i) => (s50[i] == null ? { time: r.s } : { time: r.s, value: s50[i] })));
        const n = rows.length, lastClose = tb ? rows[n - 2] && rows[n - 2].c : rows[n - 1].c, i0 = tb ? n - 2 : n - 1;
        this.trend = s20[i0] != null && s50[i0] != null ? (lastClose > s20[i0] && s20[i0] > s50[i0] ? 'up' : lastClose < s20[i0] && s20[i0] < s50[i0] ? 'down' : 'mixed') : null;
        this.rows = rows; this.legendExtra = (i) => `<span style="color:${COL.sma20}">SMA20 ${f2(s20[i])}</span><span style="color:${COL.sma50}">SMA50 ${f2(s50[i])}</span>`;
        // 未開市：用盤前價畫一條線
        this.lines.forEach((l) => this.candle.removePriceLine(l)); this.lines = [];
        if (cur && cur.d === today && !tb && cur.pre.length) this.lines.push(this.candle.createPriceLine({ price: cur.pre[cur.pre.length - 1].c, color: COL.pm, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '盤前' }));
      } else {
        if (!S.ext) bars = bars.filter((b) => isRTH(etSec(b.t)));
        const rows = bars.map((b) => ({ s: etSec(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v, est: b.est }));
        cd = rows.map((r) => { const x = { time: r.s, open: r.o, high: r.h, low: r.l, close: r.c }; if (!isRTH(r.s)) { const col = alpha(r.c >= r.o ? C.up : C.down, 0.45); Object.assign(x, { color: col, borderColor: col, wickColor: col }); } return x; });
        vd = rows.map((r) => ({ time: r.s, value: r.v, color: r.est ? 'rgba(148,163,184,.6)' : alpha(r.c >= r.o ? C.up : C.down, isRTH(r.s) ? 0.38 : 0.18) }));
        // VWAP：每日由 09:30 開始計，盤前盤後唔計
        // 圖表庫唔會喺空白位斷線：盤前盤後同每日最後一點用透明色（線段顏色跟起點），咁唔同日子嘅 VWAP 就唔會連埋
        const HIDE = 'rgba(0,0,0,0)';
        let day = null, pv = 0, vv = 0, lastV = null; const vwOk = [];
        const vw = rows.map((r, i) => {
          if (!isRTH(r.s)) { vwOk[i] = false; return lastV == null ? { time: r.s } : { time: r.s, value: lastV, color: HIDE }; }
          const d = sDay(r.s); if (d !== day) { day = d; pv = 0; vv = 0; }
          pv += ((r.h + r.l + r.c) / 3) * r.v; vv += r.v;
          if (!vv) { vwOk[i] = false; return lastV == null ? { time: r.s } : { time: r.s, value: lastV, color: HIDE }; }
          lastV = pv / vv; vwOk[i] = true; return { time: r.s, value: lastV };
        });
        vw.forEach((x, i) => { const n = rows[i + 1]; if (vwOk[i] && n && (!isRTH(n.s) || sDay(n.s) !== sDay(rows[i].s))) x.color = HIDE; });
        const closes = rows.map((r) => r.c), e9 = emaArr(closes, 9), e20 = emaArr(closes, 20);
        this.vwap.setData(vw);
        this.ema9.setData(rows.map((r, i) => (e9[i] == null ? { time: r.s } : { time: r.s, value: e9[i] })));
        this.ema20.setData(S.ema20 ? rows.map((r, i) => (e20[i] == null ? { time: r.s } : { time: r.s, value: e20[i] })) : []);
        this.rows = rows;
        this.legendExtra = (i) => `${vwOk[i] ? `<span style="color:${COL.vwap}">VWAP ${f2(vw[i].value)}</span>` : ''}<span style="color:${COL.ema9}">EMA9 ${f2(e9[i])}</span>${S.ema20 ? `<span style="color:${COL.ema20}">EMA20 ${f2(e20[i])}</span>` : ''}`;
        this.lines.forEach((l) => this.candle.removePriceLine(l)); this.lines = [];
        if (S.lv) {
          const L = levelsOf(F.sorted(), this.cfg.tf);
          [['PDH', L.pdh, COL.pdh], ['PDL', L.pdl, COL.pdh], ['昨收', L.pdc, COL.pdc], ['PMH', L.pmh, COL.pm], ['PML', L.pml, COL.pm], ['ORH', L.orh, COL.or], ['ORL', L.orl, COL.or]]
            .forEach(([t, p, col]) => { if (num(p) != null) this.lines.push(this.candle.createPriceLine({ price: p, color: col, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: t })); });
        }
      }
      this.candle.setData(cd); this.vol.setData(vd);
      this.times = cd.map((x) => x.time); this.byTime = new Map(cd.map((x, i) => [x.time, i]));
      if (this.first) {
        const n = cd.length, show = this.daily ? 130 : { '1Min': 240, '5Min': 160, '15Min': 120, '1Hour': 120 }[this.cfg.tf] || 150;
        ts.setVisibleLogicalRange({ from: Math.max(0, n - show), to: n + 3 });
        this.first = false;
      } else if (prevRange) {
        const atEdge = prevRange.to >= prevLen - 2, add = cd.length - prevLen;
        if (atEdge && add > 0) ts.setVisibleLogicalRange({ from: prevRange.from + add, to: prevRange.to + add }); else ts.setVisibleLogicalRange(prevRange);
      }
      const est = this.rows.some((r) => r.est), live = S.mode !== 'sip' && liveNow();
      const b = $('[data-badge]', this.el);
      b.className = 'mc-badge ' + (S.mode === 'sip' ? 'delay' : live ? 'live' : '');
      b.textContent = S.mode === 'sip' ? '延遲 15 分鐘' : live ? (est ? '即時・最近成交量估算' : '即時') : '收市後';
      b.title = S.mode === 'iex' ? '價格同成交只係 IEX 一間交易所（約全市場 2–3% 成交）' : S.mode === 'sip' ? 'SIP 全市場數據，免費帳戶延遲 15 分鐘' : 'SIP 全市場數據（延遲 15 分鐘）+ 最近 15 分鐘用 IEX 即時價；灰色成交柱 = 按比例估算';
      if (this.daily && this.trend) b.textContent += this.trend === 'up' ? '・📈 日線升勢' : this.trend === 'down' ? '・📉 日線跌勢' : '・➖ 橫行';
      this.legend(null);
    }
    legend(i) {
      const R = this.rows; if (!R || !R.length) return;
      const k = i == null ? R.length - 1 : i, r = R[k];
      const prev = R[k - 1], chg = prev ? (r.c / prev.c - 1) * 100 : null;
      $('[data-legend]', this.el).innerHTML = `<b>${esc(this.sym)}</b> <em>${TF[this.cfg.tf].label}</em> <span>O ${f2(r.o)}</span><span>H ${f2(r.h)}</span><span>L ${f2(r.l)}</span><span class="${r.c >= r.o ? 'up' : 'dn'}">C ${f2(r.c)}</span>${chg != null ? `<span class="${chg >= 0 ? 'up' : 'dn'}">${pc(chg)}</span>` : ''}<span>Vol ${big(r.v)}${r.est ? '*' : ''}</span>${this.legendExtra ? this.legendExtra(k) : ''}`;
    }
    /* 某個時間喺呢個圖對應邊支 K */
    indexAt(t) {
      const T = this.times; if (!T.length) return -1;
      if (this.daily) { const d = Date.parse(sDay(t) + 'T00:00:00Z') / 1000; const i = this.byTime.get(d); return i == null ? -1 : i; }
      if (t < T[0]) return -1;
      let lo = 0, hi = T.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; }
      return t - T[lo] < Math.max(TF[this.cfg.tf].sec, 60) * 1.01 ? lo : -1;
    }
    showX(t) {
      const i = t == null ? -1 : this.indexAt(t);
      try { if (i < 0) this.chart.clearCrosshairPosition(); else this.chart.setCrosshairPosition(this.rows[i].c, this.times[i], this.candle); } catch (e) {}
      this.legend(i < 0 ? null : i);
    }
    /* 只有真係用滑鼠／手指郁先傳出去（程式設定嘅十字線冇 sourceEvent），咁就唔會互相彈嚟彈去 */
    onCross(p) {
      if (!p.sourceEvent) return;
      const i = p.time != null ? this.byTime.get(p.time) : null;
      this.legend(i == null ? null : i);
      if (!S.xsync) return;
      const t = p.time == null || !p.point ? null : this.daily ? p.time + 16 * 3600 : p.time; // 日線：對去當日 16:00
      panes.forEach((o) => { if (o !== this) o.showX(t); });
      if (bc && S.link) bc.postMessage({ from: WID, type: 'x', t });
    }
    /* 時間軸：只有你而家用緊嗰個圖（leader）帶動其他日內圖 */
    onRange(r) {
      if (leader !== this || this.daily || !S.tsync || !r) return;
      panes.forEach((o) => { if (o !== this && !o.daily && o.times.length) { try { o.chart.timeScale().setVisibleRange(r); } catch (e) {} } });
    }
  }
  let leader = null;
  function savePanes() { S.panes = panes.map((p) => Object.assign({}, p.cfg)); saveState(); }

  /* ---------------- 頁面 ---------------- */
  function toolbar() {
    const L = Object.entries(LAYOUTS).filter(([k]) => k !== 'd' || win !== 'main' || S.layout === 'd');
    const tg = (k, t, tip) => `<label class="mc-tg" title="${esc(tip)}"><input type="checkbox" data-tg="${k}" ${S[k] ? 'checked' : ''}> ${t}</label>`;
    return `<div class="mc-bar">
      <form class="mc-symf" data-symf><input data-sym value="${esc(S.sym)}" list="mc-dl" maxlength="10" autocomplete="off" spellcheck="false" aria-label="股票代號" placeholder="代號"><datalist id="mc-dl">${[...new Set([...picks.map((p) => p.sym), ...S.recent])].map((s) => `<option value="${esc(s)}">`).join('')}</datalist><button class="btn sm primary">睇</button></form>
      <select data-layout aria-label="版面">${L.map(([k, l]) => `<option value="${k}" ${k === S.layout ? 'selected' : ''}>${l.name}</option>`).join('')}</select>
      <select data-mode aria-label="數據來源">${Object.entries(MODES).map(([k, t]) => `<option value="${k}" ${k === S.mode ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <div class="mc-tgs">${tg('xsync', '十字線同步', '喺一個圖郁滑鼠，其他圖（同第二個視窗）一齊顯示同一時間')}${tg('tsync', '時間同步', '捲動／放大一個日內圖，其他日內圖跟住')}${tg('link', '視窗同步', '換股、十字線同其他開咗呢頁嘅視窗同步（第二個螢幕用）')}${tg('ext', '盤前盤後', '顯示 04:00–09:30 同 16:00–20:00（淡色 K 線）')}${tg('lv', '關鍵位', 'PDH／PDL／昨收、PMH／PML、開市 5 分鐘區間')}${tg('ema20', 'EMA 20', '加多條 EMA 20（藍色虛線）')}</div>
      <div class="mc-acts">${pop ? '' : '<button class="btn sm" data-popout title="開一個新視窗，拖去第二個螢幕">🪟 第二個視窗</button>'}<button class="btn sm" data-full title="全螢幕">⛶ 全螢幕</button>${pop ? '' : '<button class="btn sm ghost" data-help>❓</button>'}</div>
    </div>
    <div class="mc-chips" data-chips></div>
    <div class="mc-strip" data-strip aria-live="polite"></div>`;
  }
  function chipsHTML() {
    const seen = new Set(), out = [];
    picks.forEach((p) => { if (seen.has(p.sym)) return; seen.add(p.sym); out.push(`<button class="mc-chip ${p.sym === S.sym ? 'on' : ''} ${p.long ? 'long' : ''}" data-chip="${esc(p.sym)}" title="${esc(p.tip)}">${p.long ? '🌅 ' : ''}${esc(p.sym)}${num(p.gap) != null ? ` <small class="${p.gap >= 0 ? 'up' : 'dn'}">${pc(p.gap, 1)}</small>` : ''}</button>`); });
    const rec = S.recent.filter((s) => !seen.has(s)).slice(0, 8);
    return (out.length ? `<span class="mc-cl">今日選股</span>${out.join('')}` : '') + (rec.length ? `<span class="mc-cl">最近</span>${rec.map((s) => `<button class="mc-chip ${s === S.sym ? 'on' : ''}" data-chip="${esc(s)}">${esc(s)}</button>`).join('')}` : '') + '<span class="mc-cl mc-kb">打字即換股・[ ] 上／下一隻</span>';
  }
  function renderChips() { const el = $('[data-chips]', root); if (!el) return; el.innerHTML = chipsHTML(); $$('[data-chip]', el).forEach((b) => b.addEventListener('click', () => setSymbol(b.dataset.chip))); }

  function renderStrip() {
    const el = $('[data-strip]', root); if (!el) return;
    const s = strip.sym && strip.sym.loaded ? snapshot(strip.sym.sorted()) : null, q = strip.qqq && strip.qqq.loaded ? snapshot(strip.qqq.sorted()) : null;
    const now = etSec(Date.now()), hm = sHM(now), wd = new Date(now * 1000).getUTCDay(), weekday = wd >= 1 && wd <= 5;
    const mins = (a) => { const [h, m] = a.split(':').map(Number), [h2, m2] = hm.split(':').map(Number); return h * 60 + m - (h2 * 60 + m2); };
    let clockMsg = '';
    if (!weekday) clockMsg = '週末休市';
    else if (hm < '09:30') clockMsg = hm >= '04:00' ? `盤前・開市倒數 ${mins('09:30')} 分鐘` : '未開盤前市';
    else if (hm < '09:35') clockMsg = '⛔ 09:35 前唔落單';
    else if (hm < '11:30') clockMsg = `⏱️ 11:30 收工倒數 ${mins('11:30')} 分鐘`;
    else if (hm < '16:00') clockMsg = '已過 11:30：唔開新倉';
    else clockMsg = '已收市';
    const cell = (label, val, ok, tip) => `<div class="mc-s ${ok === true ? 'ok' : ok === false ? 'bad' : ''}" title="${esc(tip || '')}"><span>${label}</span><b>${val}</b></div>`;
    const parts = [cell('美東／香港', `${hm}｜${hkHM()}`, null, clockMsg), cell('時間規則', clockMsg, hm >= '09:35' && hm < '11:30' && weekday ? true : null)];
    if (s && s.isToday) {
      const useOpen = s.chgOpen != null, mine = useOpen ? s.chgOpen : s.chgPrev, qq = q && q.isToday ? (useOpen ? q.chgOpen : q.chgPrev) : null;
      parts.push(cell(`${esc(S.sym)} ${useOpen ? '由開市' : '對昨收'}`, pc(mine), null));
      if (qq != null && S.sym !== 'QQQ') { const rs = mine - qq; parts.push(cell(`vs QQQ（${pc(qq)}）`, `RS ${rs >= 0 ? '+' : '−'}${Math.abs(rs).toFixed(2)}`, rs > 0, 'Relative Strength：做多要強過 QQQ')); }
      if (num(s.rvol5) != null) parts.push(cell('首 5 分鐘成交', `${s.rvol5.toFixed(1)}× 平時${s.rvol5Est ? '（估算）' : ''}`, s.rvol5 >= 2, `09:30 嗰支 5 分鐘 K 嘅成交 ÷ 過去 ${s.rvol5Days} 日同一支嘅平均；A+ 過濾要 ≥ 2 倍`));
      if (s.vwap != null) parts.push(cell(`${esc(S.sym)} vs VWAP`, s.last >= s.vwap ? '上面' : '下面', s.last >= s.vwap));
    } else if (s) parts.push(cell(`${esc(S.sym)} 最後`, `${f2(s.last)}（${s.day}）`, null));
    if (q && q.isToday && q.vwap != null) parts.push(cell('QQQ vs VWAP', q.last >= q.vwap ? '上面 ✅' : '下面 ❌', q.last >= q.vwap, 'A+ 過濾：入場前 QQQ 要喺自己 VWAP 上面'));
    el.innerHTML = parts.join('');
  }

  function attachStrip() {
    if (strip.sym) strip.sym.subs.delete(renderStrip);
    if (strip.qqq) strip.qqq.subs.delete(renderStrip);
    strip.sym = feedFor(S.sym, '5Min', S.mode); strip.qqq = feedFor('QQQ', '5Min', S.mode);
    strip.sym.subs.add(renderStrip); strip.qqq.subs.add(renderStrip);
  }
  function activeFeeds() { const set = new Set(); panes.forEach((p) => { set.add(p.feed); if (p.helper) set.add(p.helper); }); if (strip.sym) set.add(strip.sym); if (strip.qqq) set.add(strip.qqq); return [...set]; }
  async function loadAll() { for (const f of activeFeeds()) if (!f.loaded) f.load(keys); }

  function build() {
    panes.forEach((p) => p.destroy()); panes = [];
    const grid = $('[data-grid]', root);
    const cfgs = paneCfgs();
    grid.className = 'mc-grid l' + S.layout;
    grid.innerHTML = cfgs.map((c, i) => new Pane(i, c).html()).join('');
    panes = cfgs.map((c, i) => new Pane(i, c));
    panes.forEach((p, i) => p.mount($$('.mc-pane', grid)[i]));
    attachStrip(); renderStrip(); loadAll();
  }
  function setSymbol(sym, broadcast = true) {
    sym = String(sym || '').trim().toUpperCase();
    if (!okSym(sym)) { App.toast('代號唔啱'); return; }
    if (sym === S.sym && panes.length) return;
    const prev = S.sym;
    // Alpaca 唔認識呢個代號：自動返去上一隻
    const chk = feedFor(sym, '5Min', S.mode);
    chk.load(keys).then(() => {
      if (!active || chk.loaded || !/唔認識/.test(chk.error || '') || S.sym !== sym || !okSym(prev) || prev === sym) return;
      App.toast(`Alpaca 唔認識 ${sym}，返去 ${prev}`);
      S.recent = S.recent.filter((x) => x !== sym); feeds.forEach((f, k) => { if (f.sym === sym && !f.loaded) feeds.delete(k); });
      setSymbol(prev, broadcast);
    });
    S.sym = sym; S.recent = [sym, ...S.recent.filter((x) => x !== sym)].slice(0, 12); saveState();
    const inp = $('[data-sym]', root); if (inp) inp.value = sym;
    panes.forEach((p) => { if (!p.cfg.sym) p.attach(); });
    attachStrip(); renderStrip(); renderChips(); loadAll();
    if (bc && S.link && broadcast) bc.postMessage({ from: WID, type: 'sym', sym });
  }

  async function tick() {
    if (!active || document.hidden || !keys) return;
    renderStrip();
    if (!liveNow()) return;
    for (const f of activeFeeds()) await serial(() => f.poll(keys));
  }

  function teardown() {
    active = false; clearInterval(timer); clearInterval(clock); timer = clock = null;
    panes.forEach((p) => p.destroy()); panes = [];
    if (strip.sym) strip.sym.subs.delete(renderStrip); if (strip.qqq) strip.qqq.subs.delete(renderStrip);
    document.body.classList.remove('mc-pop');
    document.removeEventListener('keydown', onKey);
    themeObs && themeObs.disconnect();
  }
  let themeObs = null;
  function onKey(e) {
    if (!active || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input,textarea,select,[contenteditable]') || $('.modal-wrap')) return;
    const list = [...new Set([...picks.map((p) => p.sym), ...S.recent])];
    if (e.key === '[' || e.key === ']') { if (!list.length) return; const i = list.indexOf(S.sym); setSymbol(list[(i + (e.key === ']' ? 1 : -1) + list.length) % list.length]); e.preventDefault(); return; }
    if (/^[a-zA-Z]$/.test(e.key)) { const inp = $('[data-sym]', root); inp.value = e.key.toUpperCase(); inp.focus(); inp.setSelectionRange(1, 1); e.preventDefault(); }
  }
  if (bc) bc.onmessage = (e) => {
    const m = e.data; if (!active || !m || m.from === WID || !S.link) return;
    if (m.type === 'sym' && m.sym !== S.sym) setSymbol(m.sym, false);
    if (m.type === 'hello' && win !== m.win) bc.postMessage({ from: WID, type: 'sym', sym: S.sym });
    if (m.type === 'x' && S.xsync) panes.forEach((p) => p.showX(m.t));
  };

  async function loadPicks() {
    try {
      const idx = await Picks.loadIndex(); const d0 = (idx.days || [])[0]; if (!d0) return [];
      const d = await Picks.loadDay(d0.date);
      const L = new Set(((d.longFocus || {}).items || []).map((x) => x.sym));
      const P = (d.picks || []).map((p) => ({ sym: p.sym, gap: p.gapPct, long: L.has(p.sym), tip: `${d.date}：${p.trade ? p.trade.side : ''} RVOL ${p.rvol ?? '—'}${p.trade ? `｜Entry ${p.trade.entry} Stop ${p.trade.stop} T1 ${p.trade.target1}` : ''}` }));
      return P.sort((a, b) => b.long - a.long);
    } catch (e) { return []; }
  }

  async function render(view, q) {
    teardown();
    const qs = new URLSearchParams(q || ''); win = /^[a-z0-9]{1,6}$/i.test(qs.get('w') || '') ? qs.get('w') : 'main'; pop = qs.get('pop') === '1';
    S = loadState(win);
    if (okSym((qs.get('sym') || '').toUpperCase())) { S.sym = qs.get('sym').toUpperCase(); S.recent = [S.sym, ...S.recent.filter((x) => x !== S.sym)].slice(0, 12); }
    if (pop) document.body.classList.add('mc-pop');
    view.innerHTML = `<div class="mc" data-mc>${pop ? '' : `<div class="page-head mc-head"><h1>📺 多圖同步看盤</h1><p class="muted">免費版「Multi-Chart」：個股 5 分鐘 + 日線 + QQQ 一齊睇，換股、十字線、時間軸全部同步；可以開第二個視窗放第二個螢幕。數據用你嘅 Alpaca 免費帳戶。</p></div>`}<div data-top><p class="muted">載入緊…</p></div><div class="mc-grid" data-grid></div>
      <p class="tool-fine mc-foot">數據：Alpaca 免費帳戶。<b>全市場（SIP）延遲 15 分鐘</b>；<b>IEX 即時，但只係一間交易所</b>（價格接近全市場，成交量約 2–3%）。「智能」模式：歷史用 SIP，最近 15 分鐘用 IEX 即時價，成交量按同日比例估算（灰色柱、旁邊有 *）。落單前一定要喺券商睇返即時報價。時間係美東時間。圖表：<a href="https://www.tradingview.com/lightweight-charts/" target="_blank" rel="noopener noreferrer">TradingView Lightweight Charts™</a>（Apache 2.0 開源）。</p></div>`;
    root = $('[data-mc]', view);
    try { await loadLib(); } catch (e) { $('[data-top]', root).innerHTML = `<div class="card"><p class="neg">${esc(e.message)}</p></div>`; return; }
    keys = await MarketData.getKeys().catch(() => null);
    if (!keys) {
      $('[data-top]', root).innerHTML = `<div class="card mc-nokey"><h3>🔑 要先設定 Alpaca 金鑰（免費）</h3><ol><li>去 <a href="https://alpaca.markets/" target="_blank" rel="noopener noreferrer">alpaca.markets</a> 開一個免費帳戶（唔使入錢，用 Paper Trading 帳戶就得）</li><li>喺 Alpaca 網頁攞 API Key ID 同 Secret</li><li>返嚟呢度 <a href="#/settings">⚙️ 設定 → 市場數據</a> 貼上</li></ol><p class="muted">金鑰只會存喺你部機（或者家庭雲端，只有成員讀到），淨係用嚟讀市場數據，唔會落單。</p></div>`;
      return;
    }
    if (!location.hash.startsWith('#/charts')) return;
    active = true;
    picks = await loadPicks();
    $('[data-top]', root).innerHTML = toolbar();
    renderChips();
    const top = $('[data-top]', root);
    $('[data-symf]', top).addEventListener('submit', (e) => { e.preventDefault(); setSymbol($('[data-sym]', top).value); $('[data-sym]', top).blur(); });
    $('[data-layout]', top).addEventListener('change', (e) => { S.layout = e.target.value; S.panes = null; saveState(); build(); });
    $('[data-mode]', top).addEventListener('change', (e) => { S.mode = e.target.value; saveState(); build(); });
    $$('[data-tg]', top).forEach((c) => c.addEventListener('change', () => { S[c.dataset.tg] = c.checked; saveState(); if (['ext', 'lv', 'ema20'].includes(c.dataset.tg)) panes.forEach((p) => p.render()); if (c.dataset.tg === 'xsync' && !c.checked) panes.forEach((p) => p.showX(null)); }));
    const po = $('[data-popout]', top);
    if (po) po.addEventListener('click', () => { const w = window.open(location.pathname + location.search + '#/charts?w=2&pop=1&sym=' + encodeURIComponent(S.sym), 'ta-charts-2', 'popup,width=1400,height=900'); if (!w) App.toast('瀏覽器擋咗彈出視窗：喺網址列允許彈出視窗再試'); });
    $('[data-full]', top).addEventListener('click', () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); });
    const hp = $('[data-help]', top);
    if (hp) hp.addEventListener('click', () => App.modal(`<h3>📺 點用多圖同步看盤</h3><ul>
      <li><b>換股：</b>喺任何地方直接打代號再按 Enter；或者撳上面「今日選股」（🌅 = Long 專區）。<kbd>[</kbd> <kbd>]</kbd> 上／下一隻。</li>
      <li><b>同步：</b>「🔗 跟主代號」嘅圖會跟住換股；QQQ 圖固定。十字線、時間軸會同步（日線圖會標返同一日）。</li>
      <li><b>兩個螢幕：</b>撳「🪟 第二個視窗」，將新視窗拖去第二個螢幕，再撳「⛶ 全螢幕」。兩個視窗會同步換股同十字線。第二個視窗嘅版面會另外記住。</li>
      <li><b>每個圖：</b>可以揀時間框架（1m／5m／15m／1h／日線）同股票（跟主代號、QQQ、SPY…）。</li>
      <li><b>線：</b>橙色 = VWAP（09:30 起計）、紫色 = EMA 9、藍色虛線 = EMA 20；日線：藍色 = SMA 20、粉紅 = SMA 50。虛線水平線 = PDH／PDL／昨收、PMH／PML、ORH／ORL（開市 5 分鐘區間）。</li>
      <li><b>上面一排：</b>Level 15 嘅 A+ 過濾即時檢查：首 5 分鐘成交 ≥ 平時 2 倍、QQQ 喺 VWAP 上面、相對 QQQ 強弱，同 11:30 收工倒數。</li>
      <li><b>數據：</b>免費帳戶全市場數據延遲 15 分鐘；「智能」模式最近 15 分鐘用 IEX 即時價。即時落單前喺券商再核對。</li></ul>`));
    themeObs = new MutationObserver(() => build()); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('keydown', onKey);
    build();
    if (bc && S.link && !okSym((qs.get('sym') || '').toUpperCase())) bc.postMessage({ from: WID, type: 'hello', win });
    timer = setInterval(tick, 5000);
    clock = setInterval(() => active && renderStrip(), 20000);
  }
  window.addEventListener('hashchange', () => { if (active && !location.hash.startsWith('#/charts')) teardown(); });
  window.MultiChart = { render, _test: { sessionsOf, levelsOf, snapshot, etSec, feeds, get panes() { return panes; } } };
})();
