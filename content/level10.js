/* Level 10：圖表點用 —— TradingView 設定實戰（時區、延長時段、Session Breaks、指標、畫圖、警報、Replay） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const C = window.Charts;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => v != null && e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; };
  const f2 = (v) => (v == null ? '—' : v.toFixed(2));
  const pad = (n) => String(n).padStart(2, '0');
  const hmOf = (min) => pad(Math.floor(((min % 1440) + 1440) % 1440 / 60)) + ':' + pad(((min % 60) + 60) % 60);

  /* ---------- 教學模擬數據：兩個交易日（04:00–20:00 美東），5 分鐘 K 線 ----------
     Day 1：正常時段 401 附近上落，收市 398.50；盤後慢慢跌。
     Day 2：隔夜壞消息，盤前跳空低開，04:00 一度反彈到 391，之後跌到 377；開市後再向下推（Opening Drive）。 */
  const DAYS = [{ key: 'd1', label: '11/04（三）' }, { key: 'd2', label: '11/05（四）' }];
  const ANCH = {
    d1: [[240, 400.8], [330, 401.6], [480, 401.9], [570, 402.2], [600, 405.6], [660, 401.0], [720, 398.9], [810, 400.6], [900, 399.4], [960, 398.5], [1080, 396.9], [1200, 396.2]],
    d2: [[240, 386.5], [262, 391.2], [330, 383.0], [420, 378.4], [480, 379.6], [560, 377.6], [570, 377.4], [590, 371.8], [615, 368.4], [645, 371.2], [690, 367.3], [720, 365.9]],
  };
  let cache = null;
  function data() {
    if (cache) return cache;
    const r = C.mulberry32(20261105);
    const bars = [];
    DAYS.forEach((D, di) => {
      const A = ANCH[D.key];
      let prev = A[0][1];
      for (let k = 0; k < A.length - 1; k++) {
        const [m0, p0] = A[k], [m1, p1] = A[k + 1];
        for (let m = m0; m < m1; m += 5) {
          const base = p0 + (p1 - p0) * (m - m0) / (m1 - m0);
          const rth = m >= 570 && m < 960;
          const nz = rth ? 0.55 : 0.22;
          const o = prev, c = base + (r() - 0.5) * nz * 1.4;
          const h = Math.max(o, c) + r() * nz, l = Math.min(o, c) - r() * nz;
          let v;
          if (!rth) v = 0.008 + r() * 0.03 + (m >= 480 && m < 570 ? 0.03 : 0) + (D.key === 'd2' && m < 300 ? 0.06 : 0);
          else { const t = (m - 570) / 390; v = 0.35 + 1.9 * Math.exp(-t * 9) + 0.5 * Math.exp(-(1 - t) * 10) + r() * 0.15; if (D.key === 'd2') v *= 1.9; }
          bars.push({ day: di, dayLabel: D.label, min: m, hm: hmOf(m), rth, pre: m < 570, o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v: +v.toFixed(3) });
          prev = c;
        }
      }
    });
    const d1 = bars.filter((b) => b.day === 0 && b.rth), d2pre = bars.filter((b) => b.day === 1 && b.pre);
    const lv = {
      pdh: Math.max(...d1.map((b) => b.h)), pdl: Math.min(...d1.map((b) => b.l)), pdc: d1[d1.length - 1].c,
      pmh: Math.max(...d2pre.map((b) => b.h)), pml: Math.min(...d2pre.map((b) => b.l)),
    };
    cache = { bars, lv };
    return cache;
  }
  /* 合併 K 線（5m → 15m／1h），同一日內先合併 */
  function agg(bars, mins) {
    const out = [];
    bars.forEach((b) => {
      const key = b.day + ':' + Math.floor(b.min / mins);
      const last = out[out.length - 1];
      if (last && last.key === key) { last.h = Math.max(last.h, b.h); last.l = Math.min(last.l, b.l); last.c = b.c; last.v = +(last.v + b.v).toFixed(3); last.rth = last.rth || b.rth; }
      else out.push(Object.assign({}, b, { key, min: Math.floor(b.min / mins) * mins, hm: hmOf(Math.floor(b.min / mins) * mins) }));
    });
    return out;
  }
  function emaOf(vals, n) { const k = 2 / (n + 1); let e = null; return vals.map((v, i) => { if (i < n - 1) return null; if (e == null) { e = vals.slice(0, n).reduce((a, b) => a + b, 0) / n; return e; } e = v * k + e * (1 - k); return e; }); }
  function vwapSeries(B, fromRthOnly) {
    let pv = 0, vv = 0, day = -1;
    return B.map((b) => {
      if (b.day !== day) { day = b.day; pv = 0; vv = 0; }
      if (fromRthOnly && !b.rth) return null;
      const tp = (b.h + b.l + b.c) / 3; pv += tp * b.v; vv += b.v;
      return vv ? pv / vv : null;
    });
  }

  /* ---------- 圖表繪製（模仿 TradingView 嘅顯示方式） ---------- */
  function draw(box, S) {
    const { lv } = data();
    const all = S.tf === 5 ? data().bars : agg(data().bars, S.tf);
    const B = S.eth ? all : all.filter((b) => b.rth);
    const W = 800, priceH = 300, volH = 70, H = priceH + volH + 30, m = { l: 8, r: 76, t: 22 };
    const plotW = W - m.l - m.r, step = plotW / B.length;
    const L = [];
    if (S.levels) { L.push(['PDH', lv.pdh, '#0ea5e9'], ['PDL', lv.pdl, '#0ea5e9'], ['PDC', lv.pdc, '#64748b'], ['PMH', lv.pmh, '#8b5cf6'], ['PML', lv.pml, '#8b5cf6']); }
    let lo = Math.min(...B.map((b) => b.l)), hi = Math.max(...B.map((b) => b.h));
    L.forEach(([, p]) => { lo = Math.min(lo, p); hi = Math.max(hi, p); });
    const pd = (hi - lo) * 0.06; lo -= pd; hi += pd;
    const y = (p) => m.t + (hi - p) / (hi - lo) * (priceH - m.t - 6);
    const x = (i) => m.l + step * i + step / 2;
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': '教學模擬 K 線圖' });
    // 延長時段背景
    if (S.eth && S.shade) {
      let i = 0;
      while (i < B.length) {
        if (B[i].rth) { i++; continue; }
        const pre = B[i].pre; let j = i;
        while (j + 1 < B.length && !B[j + 1].rth && B[j + 1].pre === pre && B[j + 1].day === B[i].day) j++;
        mk('rect', { x: m.l + step * i, y: m.t - 8, width: step * (j - i + 1), height: priceH + volH - m.t + 8, class: pre ? 'l10-pre' : 'l10-post' }, svg);
        i = j + 1;
      }
    }
    // 格線同價格
    for (let k = 0; k <= 5; k++) { const p = lo + (hi - lo) * k / 5; mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg); const t = mk('text', { x: W - m.r + 6, y: y(p) + 4, class: 'axis' }, svg); t.textContent = p.toFixed(1); }
    // Session breaks
    if (S.breaks) B.forEach((b, i) => { if (i > 0 && b.day !== B[i - 1].day) { mk('line', { x1: m.l + step * i, x2: m.l + step * i, y1: m.t - 10, y2: priceH + volH, class: 'l10-break' }, svg); const t = mk('text', { x: m.l + step * i + 4, y: m.t - 10, class: 'axis l10-daytag' }, svg); t.textContent = b.dayLabel; } });
    // 價位線
    // 價位標籤太近會重疊：由上至下排，每個最少相隔 19px
    const tags = L.map(([name, p, col]) => ({ name, p, col, ty: y(p) })).sort((a, b) => a.ty - b.ty);
    tags.forEach((t, k) => { if (k && t.ty - tags[k - 1].ty < 19) t.ty = tags[k - 1].ty + 19; });
    tags.forEach(({ name, p, col, ty }) => {
      mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), style: `stroke:${col};stroke-width:1.4;stroke-dasharray:6 4` }, svg);
      const g = mk('g', {}, svg); mk('rect', { x: W - m.r + 1, y: ty - 9, width: m.r - 2, height: 18, rx: 4, style: `fill:${col}` }, g);
      const t = mk('text', { x: W - m.r + 4, y: ty + 4, class: 'tag-text' }, g); t.textContent = `${name} ${p.toFixed(1)}`;
    });
    // 成交量 + K 線
    const vmax = Math.max(...B.map((b) => b.v)), vy0 = priceH + volH - 4, bw = Math.max(1.6, step * 0.64);
    mk('line', { x1: m.l, x2: W - m.r, y1: priceH + 4, y2: priceH + 4, class: 'grid' }, svg);
    B.forEach((b, i) => {
      const g = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg);
      mk('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), class: 'wick' }, g);
      const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c));
      mk('rect', { x: x(i) - bw / 2, y: top, width: bw, height: Math.max(1.2, bot - top), class: 'body' }, g);
      const vh = (b.v / vmax) * (volH - 12); mk('rect', { x: x(i) - bw / 2, y: vy0 - vh, width: bw, height: vh, class: 'vol' }, g);
      const tt = mk('title', {}, g); tt.textContent = `${b.dayLabel} ${S.tz === 'hk' ? hkLabel(b) : b.hm + ' 美東'}  O ${f2(b.o)} H ${f2(b.h)} L ${f2(b.l)} C ${f2(b.c)}  Vol ${b.v}M${b.rth ? '' : b.pre ? '（盤前）' : '（盤後）'}`;
    });
    // VWAP、EMA 9
    const line = (vals, cls) => { const pts = []; vals.forEach((v, i) => v != null && pts.push(x(i) + ',' + y(v))); if (pts.length > 1) mk('polyline', { points: pts.join(' '), class: cls }, svg); };
    // 指標名放左上角（好似 TradingView 嘅 Legend），唔放喺線尾，避免同 K 線、其他線重疊
    const legend = [];
    if (S.vwap !== 'off') { line(vwapSeries(B, S.vwap === 'rth'), 'vwap-line'); legend.push(['vwap-label', S.vwap === 'rth' ? 'VWAP（09:30 起）' : 'VWAP（Session，包盤前）']); }
    if (S.ema) { line(emaOf(B.map((b) => b.c), 9), 'l10-ema'); legend.push(['l10-ema-label', 'EMA 9（Close）']); }
    legend.forEach(([cls, txt], k) => { const t = mk('text', { x: m.l + 6, y: m.t + 12 + k * 16, class: cls + ' l10-lg' }, svg); t.textContent = txt; });
    // 時間軸
    const every = Math.max(1, Math.round(B.length / 9));
    B.forEach((b, i) => { if (i % every) return; const t = mk('text', { x: Math.max(x(i), m.l + 18), y: H - 6, class: 'axis', 'text-anchor': 'middle' }, svg); t.textContent = S.tz === 'hk' ? hkLabel(b) : b.hm; });
    box.innerHTML = '';
    box.appendChild(svg);
    return B;
  }
  // 冬令時間（11 月初至 3 月）：香港 = 美東 + 13 小時；夏令時間 + 12 小時
  const hkLabel = (b) => hmOf(b.min + 13 * 60);

  /* ① 主要示範：時區、延長時段、背景、Session Breaks、價位、VWAP、EMA 9 */
  window.WIDGETS_EXTRA['l10-session'] = (el) => {
    const S = { tf: 15, eth: true, shade: true, breaks: true, levels: true, vwap: 'eth', ema: true, tz: 'ny' };
    el.innerHTML = `<div class="l10-w">
      <div class="l10-bar" role="group" aria-label="圖表設定">
        <label><input type="checkbox" data-k="eth" checked> Extended Hours（盤前盤後）</label>
        <label><input type="checkbox" data-k="shade" checked> 盤前／盤後背景色</label>
        <label><input type="checkbox" data-k="breaks" checked> Session Breaks（分日線）</label>
        <label><input type="checkbox" data-k="levels" checked> PMH／PML／PDH／PDL／PDC</label>
        <label><input type="checkbox" data-k="ema" checked> EMA 9</label>
        <label>VWAP <select data-k="vwap"><option value="eth">Session（包盤前）</option><option value="rth">只計 09:30 起</option><option value="off">關</option></select></label>
        <label>時區 <select data-k="tz"><option value="ny">New York（美東）</option><option value="hk">Hong Kong（香港）</option></select></label>
        <label>時間框架 <select data-k="tf"><option value="5">5m</option><option value="15" selected>15m</option><option value="60">1h</option></select></label>
      </div>
      <div data-c></div>
      <div class="l10-legend"><span class="l10-sw pre"></span>盤前 04:00–09:30 <span class="l10-sw post"></span>盤後 16:00–20:00 <span class="l10-sw brk"></span>Session Break <span class="l10-sw vw"></span>VWAP <span class="l10-sw em"></span>EMA 9</div>
      <p class="l10-read" data-r aria-live="polite"></p>
      <p class="tool-fine">教學模擬數據，唔係真實行情。滑鼠停喺 K 線上面睇開高低收同時間。</p></div>`;
    const read = el.querySelector('[data-r]');
    const redraw = () => {
      const B = draw(el.querySelector('[data-c]'), S);
      // 用 10:00 嗰支 K 比較：包唔包盤前，EMA 9 同 VWAP 會唔同
      const allB = S.tf === 5 ? data().bars : agg(data().bars, S.tf);
      const at = (arr) => arr.findIndex((b) => b.day === 1 && b.min >= 600);
      const withE = allB, noE = allB.filter((b) => b.rth);
      const eA = emaOf(withE.map((b) => b.c), 9)[at(withE)], eB = emaOf(noE.map((b) => b.c), 9)[at(noE)];
      const vA = vwapSeries(withE, false)[at(withE)], vB = vwapSeries(withE, true)[at(withE)];
      const { lv } = data();
      read.innerHTML = `<b>而家顯示：</b>${B.length} 支 ${S.tf === 60 ? '1h' : S.tf + 'm'} K 線，時區 ${S.tz === 'hk' ? 'Hong Kong（冬令 = 美東 + 13 小時：美股 22:30 開市）' : 'New York（美東，09:30 開市）'}。<br>
        <b>11/05 10:00 嗰支 K：</b>EMA 9 包盤前 = $${f2(eA)}，只計正常時段 = $${f2(eB)}；VWAP 由 04:00 起計 = $${f2(vA)}，由 09:30 起計 = $${f2(vB)}。<br>
        <b>關鍵價位：</b>PDH $${f2(lv.pdh)}、PDL $${f2(lv.pdl)}、PDC $${f2(lv.pdc)}（昨日正常時段）；PMH $${f2(lv.pmh)}、PML $${f2(lv.pml)}（今日 04:00–09:30）。${S.eth ? '' : '<br>⚠️ 關咗 Extended Hours，圖上睇唔到盤前 K 線，但 PMH／PML 仍然存在 —— 好多新手就係咁漏咗關鍵價位。'}`;
    };
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.k; S[k] = inp.type === 'checkbox' ? inp.checked : k === 'tf' ? +inp.value : inp.value;
      el.querySelector('[data-k="shade"]').disabled = !S.eth; redraw();
    }));
    redraw();
  };

  /* ② 時間框架：同一段走勢，5m／15m／1h 點睇 */
  window.WIDGETS_EXTRA['l10-tf'] = (el) => {
    el.innerHTML = `<div class="l10-w"><div class="l10-bar" role="group" aria-label="時間框架"><button class="btn sm" data-tf="5">5m</button><button class="btn sm pri" data-tf="15">15m</button><button class="btn sm" data-tf="60">1h</button></div><div data-c></div><p class="l10-read" data-r></p></div>`;
    const TXT = { 5: '5 分鐘：睇到開市首幾支 K 嘅細節（開市推動、首 5 分鐘高低位），係入場同管理用嘅圖。', 15: '15 分鐘：雜訊少啲，用嚟睇日內結構（高低點、趨勢、VWAP 方向）。', 60: '1 小時：睇到盤前跳空同兩日之間嘅大方向，但入場位就太粗。' };
    const go = (tf) => {
      el.querySelectorAll('[data-tf]').forEach((b) => b.classList.toggle('pri', +b.dataset.tf === tf));
      const B = draw(el.querySelector('[data-c]'), { tf, eth: true, shade: true, breaks: true, levels: true, vwap: 'eth', ema: false, tz: 'ny' });
      el.querySelector('[data-r]').textContent = `${B.length} 支 K 線。${TXT[tf]}`;
    };
    el.querySelectorAll('[data-tf]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.tf)));
    go(15);
  };

  /* ③ Long／Short Position 工具（模仿 TradingView 嘅綠色／紅色方格） */
  window.WIDGETS_EXTRA['l10-position'] = (el) => {
    const S = { side: 'short', entry: 377.3, stop: 379.5, target: 372.9, acct: 10000, risk: 1 };
    el.innerHTML = `<div class="l10-w"><div class="l10-form">
      <label>方向 <select data-k="side"><option value="long">Long Position（做多）</option><option value="short" selected>Short Position（沽空）</option></select></label>
      <label>Entry <input type="number" step="0.01" data-k="entry" value="${S.entry}"></label>
      <label>Stop <input type="number" step="0.01" data-k="stop" value="${S.stop}"></label>
      <label>Target <input type="number" step="0.01" data-k="target" value="${S.target}"></label>
      <label>Account size $ <input type="number" step="100" data-k="acct" value="${S.acct}"></label>
      <label>Risk % <input type="number" step="0.1" data-k="risk" value="${S.risk}"></label></div>
      <div data-c></div><p class="l10-read" data-r aria-live="polite"></p></div>`;
    const draw2 = () => {
      const { side, entry, stop, target, acct, risk } = S;
      const long = side === 'long';
      const ok = [entry, stop, target, acct, risk].every((v) => isFinite(v) && v > 0) && (long ? stop < entry && entry < target : stop > entry && entry > target);
      const box = el.querySelector('[data-c]'), out = el.querySelector('[data-r]');
      if (!ok) { box.innerHTML = ''; out.innerHTML = `⚠️ ${long ? 'Long：Stop 要低過 Entry、Target 要高過 Entry' : 'Short：Stop 要高過 Entry、Target 要低過 Entry'}。`; return; }
      const W = 800, H = 260, hi = Math.max(stop, target), lo = Math.min(stop, target), pd = (hi - lo) * 0.25;
      const y = (p) => 16 + (hi + pd - p) / (hi - lo + 2 * pd) * (H - 32);
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': 'Position 工具示意' });
      mk('rect', { x: 260, width: 360, y: y(Math.max(entry, target)), height: Math.abs(y(entry) - y(target)), class: 'l10-rw' }, svg);
      mk('rect', { x: 260, width: 360, y: y(Math.max(entry, stop)), height: Math.abs(y(entry) - y(stop)), class: 'l10-rk' }, svg);
      [[entry, 'Entry', 'var(--text)'], [stop, 'Stop', 'var(--down)'], [target, 'Target', 'var(--up)']].forEach(([p, n, c]) => {
        mk('line', { x1: 260, x2: 620, y1: y(p), y2: y(p), style: `stroke:${c};stroke-width:2` }, svg);
        const t = mk('text', { x: 630, y: y(p) + 4, class: 'axis', style: `fill:${c};font-weight:700` }, svg); t.textContent = `${n} ${p.toFixed(2)}`;
      });
      const rps = Math.abs(entry - stop), rr = Math.abs(target - entry) / rps, dollars = acct * risk / 100, qty = Math.floor(dollars / rps);
      const t1 = mk('text', { x: 440, y: y((entry + target) / 2) + 5, class: 'l10-boxt', 'text-anchor': 'middle' }, svg); t1.textContent = `Reward ${Math.abs(target - entry).toFixed(2)}（${(Math.abs(target - entry) / entry * 100).toFixed(2)}%）`;
      const t2 = mk('text', { x: 440, y: y((entry + stop) / 2) + 5, class: 'l10-boxt', 'text-anchor': 'middle' }, svg); t2.textContent = `Risk ${rps.toFixed(2)}（${(rps / entry * 100).toFixed(2)}%）`;
      box.innerHTML = ''; box.appendChild(svg);
      const cash = Math.floor(acct / entry);
      out.innerHTML = `<b>Risk/Reward Ratio：${rr.toFixed(2)}</b>｜每股風險 $${rps.toFixed(2)}｜風險預算 $${dollars.toFixed(0)} → <b>Qty ${Math.min(qty, cash)} 股</b>${qty > cash ? `（風險計 ${qty} 股，但現金只夠 ${cash} 股）` : ''}｜中 Stop 蝕約 $${(Math.min(qty, cash) * rps).toFixed(0)}，到 Target 賺約 $${(Math.min(qty, cash) * Math.abs(target - entry)).toFixed(0)}（未計佣金同滑價）。`;
    };
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { S[inp.dataset.k] = inp.dataset.k === 'side' ? inp.value : parseFloat(inp.value); draw2(); }));
    draw2();
  };

  /* ④ 真實 TradingView 圖表（官方免費嵌入工具；撳掣先載入） */
  window.WIDGETS_EXTRA['l10-tv'] = (el) => {
    const S = { sym: 'NASDAQ:TSLA', tf: '5', eth: true, tz: 'America/New_York', vwap: true, ema: true };
    el.innerHTML = `<div class="l10-w"><div class="l10-bar" role="group" aria-label="TradingView 圖表設定">
      <label>股票 <select data-k="sym"><option>NASDAQ:TSLA</option><option>NASDAQ:NVDA</option><option>NASDAQ:AAPL</option><option>NASDAQ:AMZN</option><option>AMEX:SPY</option><option>NASDAQ:QQQ</option></select></label>
      <label>時間框架 <select data-k="tf"><option value="1">1m</option><option value="5" selected>5m</option><option value="15">15m</option><option value="60">1h</option><option value="D">1D</option></select></label>
      <label><input type="checkbox" data-k="eth" checked> Extended Hours</label>
      <label>時區 <select data-k="tz"><option value="America/New_York">New York</option><option value="Asia/Hong_Kong">Hong Kong</option></select></label>
      <label><input type="checkbox" data-k="vwap" checked> VWAP</label>
      <label><input type="checkbox" data-k="ema" checked> EMA 9</label>
      <button class="btn sm pri" data-load>📈 載入 TradingView 圖表</button></div>
      <div class="l10-tvbox" data-box><p class="muted">撳「載入」先會連去 TradingView（需要網絡，數據可能有延遲）。</p></div>
      <p class="tool-fine">由 TradingView 官方免費嵌入工具提供，喺本 App 入面只可以睇同簡單設定；想儲存畫線、模板、警報，要去 tradingview.com 開帳戶。</p></div>`;
    const load = () => {
      const box = el.querySelector('[data-box]');
      const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      const studies = []; if (S.vwap) studies.push('VWAP@tv-basicstudies'); if (S.ema) studies.push('MAExp@tv-basicstudies');
      box.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; s.async = true;
      s.text = JSON.stringify({ autosize: true, symbol: S.sym, interval: S.tf, timezone: S.tz, theme: dark ? 'dark' : 'light', style: '1', locale: 'zh_TW', extended_hours: S.eth, allow_symbol_change: true, hide_side_toolbar: false, withdateranges: true, calendar: false, studies, support_host: 'https://www.tradingview.com' });
      box.firstChild.appendChild(s);
    };
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('change', () => { S[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value; if (el.querySelector('iframe')) load(); }));
    el.querySelector('[data-load]').addEventListener('click', load);
  };
})();

window.COURSE.push({
  id: 'l10',
  code: 'Level 10',
  title: '圖表點用：TradingView 設定實戰',
  subtitle: '時區、Extended Hours、盤前背景、Session Breaks、時間框架、VWAP／EMA 9／RVOL、畫關鍵價位、Position 工具、警報、Bar Replay',
  icon: '🖥️',
  color: '#0f766e',
  question: '我個圖表設定，係咪畫到我真正需要睇嘅嘢？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l10-c1', num: '1', title: '點解圖表設定咁重要？', mins: 5,
  summary: '同一隻股、同一日，開唔開 Extended Hours、用邊個時區、VWAP 由幾點計，畫出嚟嘅 Chart 可以好唔同。設定錯，PMH／PML、EMA 9、VWAP 全部會睇錯。',
  keywords: ['TradingView', 'Chart Settings', '圖表設定'],
  md: `
:::info 開始之前
你已經學咗 K 線、Volume、PDH／PDL、VWAP、盤前 9 個 Indicator。呢個 Level 教你**點樣喺 TradingView 開返呢啲嘢出嚟**。圖入面嘅價格係**教學模擬**；TradingView 介面會不時更新，選單名稱可能同下面略有不同。
:::

好多新手以為 Chart 開咗就得，其實 TradingView 預設設定未必啱 Day Trade：

| 預設可能係 | Day Trade 需要 | 唔改嘅後果 |
|---|---|---|
| 只顯示正常時段（RTH） | 顯示盤前盤後（Extended Hours） | 睇唔到 PMH／PML，唔知盤前發生咩事 |
| 你嘅電腦時區（香港） | New York 時區 | 開市變咗 22:30，同報告、新聞時間對唔上 |
| 冇分日線 | Session Breaks | 分唔清邊支 K 屬於昨日、邊支係今日 |
| 冇價位線 | PMH、PML、PDH、PDL、PDC | 入場、止蝕冇參考 |

## 1.1 試吓：一個設定改變，成張圖都唔同

逐個剔走上面嘅設定，睇吓張圖點變：

[[widget:l10-session]]

:::key 呢個 Level 學完你應該識
1. 將 TradingView 設定成 **New York 時區 + Extended Hours + 盤前背景 + Session Breaks**
2. 揀啱時間框架：**日線 → 15m → 5m**
3. 加 **Volume、VWAP、EMA 9、Relative Volume at Time**，知道佢哋包唔包盤前
4. 畫 **PMH／PML／PDH／PDL／PDC**，用 **Long／Short Position** 工具計 R:R 同股數
5. 設 **警報**、用 **Bar Replay** 練習
:::

## 1.2 一個真實會發生嘅錯：設定錯咗，計劃都錯

報告寫：「NVDA 做多：升穿盤前高 PMH $186.40 入場」。兩個人用唔同設定睇同一張圖：

| | 甲：預設設定（RTH、香港時區） | 乙：ETH + New York 時區 |
|---|---|---|
| 圖上見到嘅最高位 | 昨日 15:55 嘅 $185.90 | 今日 08:12 盤前嘅 $186.40 |
| 佢以為嘅「PMH」 | $185.90（其實係昨日尾市） | $186.40（正確） |
| 09:31 價格去到 $186.00 | 以為已經突破，即刻買 | 知道仲未到，等 |
| 結果 | 喺 PMH 下面買咗，價格喺 $186.40 受阻跌返落嚟 | 冇觸發，冇交易 |

甲唔係睇圖技術差，而係**張圖冇顯示佢需要嘅資料**。呢個 Level 每一章都係為咗避免呢類錯。

## 1.3 設定一次，之後每日都用

TradingView 會記住你嘅設定，但要記得：

- **Chart Layout** 會儲存：時區、ETH、Session Breaks、指標、畫線。改完撳頂部 Layout 名旁邊嘅「儲存」（或者開自動儲存）。
- **Indicator Templates**：將「Volume + VWAP + EMA 9」存成一個範本，換股或者開新圖時一撳就加返晒。
- 手機 App 同網頁版共用同一個帳戶嘅 Layout，但部分顯示設定（例如背景顏色）要分開調。

:::coach 自我檢查
打開任何一隻股票嘅 5 分鐘圖，10 秒內答到以下三條，代表你設定好咗：今日盤前最高係幾多？現價喺 VWAP 上面定下面？昨日收市喺邊條線？
:::

[[quiz:l10-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c2', num: '2', title: 'TradingView 介面導覽', mins: 6,
  summary: '頂部工具列（股票、時間框架、K 線類型、Indicators、Alert、Replay）、左邊畫圖工具、右邊 Watchlist、底部時區同 ETH 掣。',
  keywords: ['Toolbar', 'Watchlist', 'Object Tree'],
  md: `
打開 **tradingview.com → Products → Supercharts**（或者手機 App）。畫面大約分四部分：

| 位置 | 有咩 | 你最常用 |
|---|---|---|
| **頂部工具列** | 股票代號、時間框架（1m／5m／15m／1h／D）、K 線類型、**Indicators**、**Alert**、**Replay**、Layout | 換股、換時間框架、加指標 |
| **左邊工具列** | 畫圖工具：Trend Line、Horizontal Line／Ray、Rectangle、Fib、**Long／Short Position**、量度工具、文字、Magnet | 畫價位、計 R:R |
| **右邊面板** | Watchlist、Alerts、新聞、**Object Tree**（圖上所有線同指標嘅清單） | 管理畫線、睇警報 |
| **底部** | 日期範圍（1D／5D…）、**時區**、**ETH／RTH** 掣、log／auto 刻度 | 設時區、開盤前盤後 |

## 2.1 真實 TradingView 圖表

下面係 TradingView 官方免費嵌入工具（同你喺網站見到嘅介面一樣，但功能較少）。撳「載入」，試吓換股票、時間框架，同開關 Extended Hours：

[[widget:l10-tv]]

:::tip 免費版夠唔夠用？
免費帳戶已經夠練習同做基本 Day Trade 準備。常見限制（以 TradingView 官方說明為準，會變）：每個圖表可以加嘅指標數目有限（大約 2–3 個）、一個 Layout 只得一個圖、警報數量有限、分鐘圖 Bar Replay 要付費。指標唔夠用，就揀 **VWAP + EMA 9**，成交量用內置 Volume 欄（部分帳戶 Volume 唔計入限額）。
:::

## 2.2 最常用嘅快捷鍵

用熟快捷鍵，開市嗰陣畫線快好多（Mac 將 Alt 換做 Option）：

| 動作 | 快捷鍵 |
|---|---|
| 換股票 | 直接喺圖上打股票代號，例如打「NVDA」再按 Enter |
| 換時間框架 | 直接打數字，例如「5」Enter = 5 分鐘、「15」= 15 分鐘、「1D」= 日線 |
| 水平線 | Alt + H |
| 水平射線（只向右） | Alt + J |
| 趨勢線 | Alt + T |
| 加警報 | Alt + A |
| 重設圖表比例 | Alt + R |
| 量度 | 按住 Shift 再撳兩點 |
| 復原 | Ctrl + Z（Mac：Cmd + Z） |

（以 TradingView 現時版本為準，可以喺 Settings → Keyboard shortcuts 睇完整清單。）

## 2.3 Object Tree：圖上嘢太多時點算

每日畫線、加指標，好快就成張圖都係嘢。右邊 **Object Tree** 列出圖上所有物件：

- 撳眼仔圖示：暫時隱藏，唔使刪。
- 撳鎖頭：鎖定，避免拖圖時唔小心郁咗條線。
- 揀晒舊日子嘅 PMH／PML 一次過刪走。

:::tip 網頁版定 App？
落單前做準備（畫線、設警報）用電腦網頁版好過手機：畫面大、快捷鍵多。手機 App 適合收警報同出街時睇一眼。兩邊同一個帳戶，線同警報會同步。
:::

[[quiz:l10-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c3', num: '3', title: '時區：用 New York 定香港時間？', mins: 5,
  summary: '建議用 New York（美東）時區：盤前 04:00、開市 09:30、收市 16:00、經濟數據 08:30 全部對得上。香港時間冬令 +13、夏令 +12 小時。',
  keywords: ['Timezone', 'UTC-5', 'EST', 'EDT'],
  md: `
## 3.1 點改

撳圖表**右下角嘅時間**（例如「UTC+8」）→ 揀 **(UTC-5) New York**。（冬令時間顯示 UTC-5，夏令時間 UTC-4。）

## 3.2 點解唔用香港時間

| 事件 | 美東時間（New York） | 香港時間（冬令，11 月–3 月） | 香港時間（夏令） |
|---|---|---|---|
| 盤前開始 | 04:00 | 17:00 | 16:00 |
| 經濟數據（CPI、非農） | 08:30 | 21:30 | 20:30 |
| 開市 | 09:30 | 22:30 | 21:30 |
| 收市 | 16:00 | 05:00（翌日） | 04:00（翌日） |

我哋嘅每日選股報告、新聞、經濟日曆全部用美東時間。Chart 都用美東，就唔使每次心算 +13 定 +12 —— 夏令冬令轉換嗰兩個星期特別容易計錯。

:::warn 美國同香港轉時間唔同日
美國喺 3 月第二個星期日轉夏令、11 月第一個星期日轉冬令；香港冇夏令時間。所以「美股幾點開市（香港時間）」一年會變兩次。
:::

喺示範圖將「時區」轉做 Hong Kong，睇吓時間軸點變：盤前由 17:00 開始，開市變 22:30。

## 3.3 一個例子：轉時間嗰個星期最易出事

11 月第一個星期日美國轉返冬令時間，香港唔轉：

| 日子 | 美股開市（美東） | 香港時間 |
|---|---|---|
| 轉時間前嘅星期五 | 09:30 | 21:30 |
| 轉時間後嘅星期一 | 09:30 | **22:30** |

如果你張圖用香港時間，又記住「21:30 開市」，星期一 21:30 你會以為已經開市，其實仲係盤前；你見到嘅大成交、大波動，全部係盤前嘅 K 線。用 New York 時區，開市永遠係 09:30，唔會錯。

## 3.4 其他時間都要統一

| 地方 | 建議 |
|---|---|
| TradingView 網頁版、App | New York |
| 券商（IBKR TWS 等） | 交易時間顯示通常跟交易所，但你可以將電腦時鐘加一個美東時鐘 |
| 手機 | 世界時鐘加「紐約」 |
| 交易日誌 | 一律寫美東時間，例如「09:42 入場」，方便同圖對照 |

:::key 記住四個美東時間就夠
04:00 盤前開始・08:30 重要經濟數據・09:30 開市・16:00 收市。
:::

[[quiz:l10-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c4', num: '4', title: 'Extended Hours：開盤前盤後同背景顏色', mins: 8,
  summary: '開 Extended Hours（ETH）先睇到 04:00–09:30 盤前同 16:00–20:00 盤後嘅 K 線；再設盤前／盤後背景色，一眼分到邊段係正常時段。',
  keywords: ['Extended Hours', 'ETH', 'RTH', 'Pre-market', 'Post-market'],
  md: `
## 4.1 RTH 同 ETH

- **RTH（Regular Trading Hours）**：正常時段 09:30–16:00（美東）。
- **ETH（Extended Trading Hours）**：連埋盤前 04:00–09:30 同盤後 16:00–20:00。

## 4.2 點開

常見有兩個位：

:::steps
1. **快捷掣**：分鐘圖底部右邊通常有 **ETH／RTH** 掣，撳一下切換。
2. **設定**：撳圖表右上角 ⚙️ **Settings → Symbol → Session**，揀 **Extended trading hours**（延長交易時段）。
3. 同一頁通常可以設 **Pre-market／Post-market 背景顏色**（例如盤前淡橙、盤後淡藍）。
:::

> 只有**分鐘圖**（1m–4h）先會顯示盤前盤後 K 線；日線本身以正常時段計。

## 4.3 點解 Day Trade 一定要開

1. **PMH／PML** 只喺盤前 K 線入面先睇到 —— 係開市推動（Opening Drive）最重要嘅參考位。
2. **盤前成交量** 話你知今日有冇人玩（RVOL、Pre-Market Volume）。
3. 跳空（Gap %）係由**昨收**去**盤前現價**，唔開 ETH 你只會見到一個「空隙」。

喺示範圖剔走 **Extended Hours**：盤前 K 線全部消失，圖上只剩昨日同今日 09:30 之後。

:::warn 開咗 ETH，指標數值會變
EMA 9、VWAP 呢類指標會將盤前 K 線都計埋。示範圖下面寫咗 10:00 嗰支 K 嘅 EMA 9「包盤前」同「只計正常時段」兩個數 —— 唔同設定，會令你覺得價格喺 EMA 9 上面定下面都唔同。**你自己揀一套，之後固定用同一套**（我哋報告用嘅 EMA 9 係包盤前嘅 5 分鐘線）。
:::

## 4.4 盤前 K 線點樣睇先唔會被呃？

| 現象 | 解讀 |
|---|---|
| 一支盤前 K 有好長影線，但成交只得幾千股 | 一兩張細單造成，PMH／PML 參考價值低 |
| 盤前每支 K 都有幾萬股以上，價格慢慢推高 | 有實質參與，PMH 較有意思 |
| 08:30 經濟數據後一支大 K | 大市反應，之前嘅盤前高低位可能要重新睇 |
| 盤前後段（08:30–09:25）一直喺高位附近 | 買家守住，開市延續機會較高 |

**例子**：NVDA 盤前 07:12 有一支 K 刺到 $188.00，成交 2,000 股；其餘時間喺 $185.50–186.80 上落，成交每支 3–5 萬股。實際上更有意義嘅「盤前高位」係 $186.80 附近，$188.00 嗰下可以當噪音。報告用嘅係真實最高價，你喺圖上要自己判斷佢有冇成交支持。

:::tip 用背景顏色幫手
盤前淡色背景開咗之後，你可以一眼睇到開市前後兩段嘅成交量柱高度差幾遠 —— 呢個比例本身就話你知盤前有幾「薄」。
:::

[[quiz:l10-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c5', num: '5', title: 'Session Breaks：分返每一日', mins: 5,
  summary: 'Session Breaks 喺每個交易日開始位置畫一條直線，連日期標籤，分得清昨日同今日、盤後同盤前。',
  keywords: ['Session Breaks', '分日線', 'Day Separator'],
  md: `
## 5.1 點開

撳 ⚙️ **Settings → Canvas**（舊版喺 **Appearance**），剔 **Session breaks**。可以揀線嘅顏色同虛線樣式。

## 5.2 有咩用

| 冇 Session Breaks | 有 Session Breaks |
|---|---|
| 5 分鐘圖一路連住，好難分到昨日收市喺邊 | 每日開始有條直線，一眼見到 |
| 容易將昨日尾段當成今日走勢 | 清楚睇到昨日收市 → 盤後 → 盤前 → 今日開市 |
| 搵 PDH／PDL 要慢慢數 | 直線之間就係一日，高低位好易搵 |

:::tip 開咗 ETH 之後，分日線喺邊？
開咗 Extended Hours，每日嘅分界通常喺 **04:00（盤前開始）**；只睇 RTH 嘅話，就喺 **09:30**。示範圖兩樣都試吓。
:::

## 5.3 用 Session Breaks 一眼睇晒一日嘅故事

開咗 ETH 同 Session Breaks 之後，兩條直線之間嘅 K 線就係「一日」，由左到右係：

| 段落 | 美東時間 | 你睇咩 |
|---|---|---|
| 盤前 | 04:00–09:30 | 有冇跳空、PMH／PML、盤前成交量大唔大 |
| 正常時段 | 09:30–16:00 | 開市推動、日內高低、收市位置 |
| 盤後 | 16:00–20:00 | 財報反應（如果有） |

**例子**：昨日 NVDA 收 $180（PDC），盤後公布消息升到 $184，今日盤前喺 $183–185 上落。有 Session Breaks，你一眼見到「跳空約 +2%，盤前區間 $183–185」；冇嘅話，你可能以為呢個升勢係今日正常時段嘅走勢。

## 5.4 配合背景顏色更清楚

盤前、盤後設咗淡色背景，加上 Session Breaks，就算唔睇時間軸都知道每支 K 屬於邊段。

:::tip 數日子
5 分鐘圖拉闊睇過去 5 日，Session Breaks 令你好快數到「過去 5 日最高」喺邊日、價格係咪連續幾日喺同一個區間 —— 呢啲係揀股同設 Target 嘅背景資料。
:::

[[quiz:l10-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c6', num: '6', title: '時間框架同多時間框架 Layout', mins: 7,
  summary: '日線睇背景、15 分鐘睇結構、5 分鐘入場；免費版一個 Layout 只得一個圖，可以開幾個瀏覽器分頁代替。',
  keywords: ['Timeframe', 'Multi-timeframe', 'Layout'],
  md: `
## 6.1 同一段走勢，三個時間框架

[[widget:l10-tf]]

## 6.2 建議組合

| 時間框架 | 用途 | 睇咩 |
|---|---|---|
| **1D 日線** | 背景 | 趨勢（20／50 日線）、PDH／PDL、20 日高低、跳空去到邊 |
| **15m** | 結構 | 日內高低點、VWAP 方向、盤前區間 |
| **5m** | 執行 | 開市推動、首 5 分鐘高低位、入場、Stop |
| 1m（可選） | 微調 | 有經驗先用，新手容易被雜訊影響 |

## 6.3 Layout

- 付費方案可以一個畫面開 2–8 個圖（例如左邊 TSLA 5m、右邊 TSLA 日線、下面 QQQ 5m）。
- 免費版：開 **幾個瀏覽器分頁**，每個分頁一個時間框架。
- 開 **Sync**（同步股票代號、十字線、時間），換股時全部圖一齊變。

:::tip 唔想付費？用平台自己嘅「多圖同步看盤」
呢個平台有免費嘅多圖版面：**個股 5m + 個股日線 + QQQ 5m** 一個畫面睇晒，換股、十字線、時間軸全部同步，仲可以開第二個視窗放第二個螢幕。數據用你嘅 Alpaca 免費金鑰：全市場數據延遲 15 分鐘，最近 15 分鐘用 IEX 即時價補上。落單前喺券商再睇一次即時報價。
:::

[[link:charts|📺 打開多圖同步看盤]]

:::tip 用 TradingView 官網又想破「2 個指標」限制？
TradingView 係逐個 Script 計指標數目。平台整咗一個「Day Trading 一合一」Pine Script：VWAP（09:30 起計）、EMA 9／20、PDH／PDL／昨收、PMH／PML、開市 5 分鐘區間、今日 Entry／Stop／Target、A+ 檢查表，全部放入 **1 個指標**。免費帳戶喺 TradingView 官網睇美股係 Cboe 即時報價（唔係全市場合併報價）；**嵌入其他網站嘅 TradingView 圖表就只有延遲數據**，所以要喺官網用。
:::

[[link:tools/tv-allinone|🧩 攞 TradingView 一合一指標]]

:::key 新手唔好太多圖
兩至三個圖已經夠：**個股 5m + 個股日線 + QQQ（或者 SPY）5m**。QQQ 嗰個圖就係你嘅 Relative Strength 比較。
:::

## 6.4 由大到細：開市前 3 分鐘睇圖次序

:::steps
1. **日線（1 分鐘）**：價格喺 20 日、50 日均線上面定下面？今日跳空去到邊？上面最近嘅日線阻力喺邊（例如 20 日高位）？
2. **15 分鐘（1 分鐘）**：盤前區間幾闊？昨日最後一個鐘點收？有冇明顯嘅日內 S/R？
3. **5 分鐘（1 分鐘）**：畫好 PMH、PML、PDH、PDL，等開市。開市後主要睇呢張圖。
:::

**例子**：日線見到 AMD 喺 50 日線上面、跳空 +3% 去到 20 日高位附近 → 15 分鐘見到盤前喺 $162–164 窄幅上落 → 5 分鐘計劃：升穿 PMH $164 先考慮做多，但上面 $165（20 日高）好近，Target 唔可以太大。

**大時間框架決定方向同空間，細時間框架決定入場同 Stop。** 兩者矛盾（例如日線跌勢、5 分鐘升緊）時，通常唔做，或者只用細注做短線。

## 6.5 QQQ 圖點用？

QQQ（或者 SPY）5 分鐘圖用嚟比較強弱：

| QQQ | 你隻股 | 意思 |
|---|---|---|
| 跌 0.5% | 升 1% | 相對強勢：大市跌佢都升，做多較有利 |
| 升 0.5% | 跌 1% | 相對弱勢：做空較有利 |
| 同步上落 | 同步上落 | 只係跟大市，冇自己嘅理由 |

開市頭 30 分鐘，大部分股票都會跟大市走。大市急跌時，就算你隻股嘅 Setup 好靚，成功率都會降低。

[[quiz:l10-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c7', num: '7', title: 'K 線同價格軸設定', mins: 6,
  summary: 'Day Trade 用普通 Candles，唔好用 Heikin Ashi（價格唔係真實成交價）；日內用 Linear 刻度；開最後價格線同 K 線倒數。',
  keywords: ['Candles', 'Heikin Ashi', 'Log Scale', 'Auto Scale'],
  md: `
| 設定 | 建議 | 原因 |
|---|---|---|
| K 線類型 | **Candles** | 顯示真實開高低收 |
| Heikin Ashi | 唔好用嚟落單 | 佢係平均價，唔係真實成交價，PMH／Stop 會畫錯 |
| 價格刻度 | 日內用 **Linear**；幾年長線圖先用 **Log** | Log 會令日內距離睇落唔一樣 |
| Auto（右下角 A） | 開 | 自動將 K 線放滿畫面 |
| 最後價格線 | 開 | 即時見到現價喺邊 |
| Countdown to bar close | 開 | 知道呢支 K 仲有幾耐收，等收 K 先確認 |
| 顏色 | 升綠跌紅（或者你習慣嘅） | 同券商 App 一致，唔好撈亂 |

:::warn 「A」自動刻度同畫線
開咗 Auto，加一條遠離現價嘅線（例如 20 日高），圖會自動縮細。想暫時唔理遠嘅線，可以右鍵價格軸揀 **Scale price chart only**。
:::

## Linear 同 Log 有咩分別？

- **Linear（線性）**：每 $1 喺圖上距離一樣。$100 → $110 同 $200 → $210 一樣高。
- **Log（對數）**：每個 % 距離一樣。$100 → $110（+10%）同 $200 → $220（+10%）一樣高。

日內一日通常只郁幾個 %，兩種刻度差別好細；但用 Position 工具、Price Range 量度 Stop 距離時，Linear 嘅格仔大小同金額直接對應，比較直觀。睇幾年長線（例如由 $10 升到 $300）先用 Log，否則早期走勢會壓到一條平線。

## 點解唔好用 Heikin Ashi 落單？一個例子

Heikin Ashi 嘅「收市價」= (開 + 高 + 低 + 收) ÷ 4，開市價係上一支嘅平均。

| | 真實 K 線 | Heikin Ashi |
|---|---|---|
| 收市價 | $184.80 | $184.35 |
| 最低價 | $183.90 | $183.90 或者更高 |

你喺 Heikin Ashi 圖上將 Stop 放喺「上一支低位下面」，同真實價格可能差幾毫子；圖上見到嘅收市價亦唔係真實成交價。Heikin Ashi 令趨勢睇落更順，可以用嚟**輔助睇方向**，但畫價位、計 Stop、對照報告數字，一定要用普通 Candles。

## 等收 K：Countdown 點用

5 分鐘 K 線「升穿 PMH」要喺收市時仲企喺上面先算確認。開咗 Countdown，你會見到右邊價格軸顯示例如「01:23」，代表呢支 K 仲有 1 分 23 秒收。好多假突破就係喺最後一分鐘跌返落去，等埋呢 83 秒可以避開好多錯誤入場。

[[quiz:l10-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c8', num: '8', title: '指標設定：Volume、VWAP、EMA 9、Relative Volume', mins: 9,
  summary: '加 Volume、VWAP（Anchor = Session）、EMA 9（Source = Close）、Relative Volume at Time；記住開咗 ETH 會令 VWAP 由 04:00 起計。',
  keywords: ['VWAP', 'EMA 9', 'Relative Volume at Time', 'ATR'],
  md: `
撳頂部 **Indicators**，搜尋以下名稱：

| 指標 | 設定 | 注意 |
|---|---|---|
| **Volume** | 加 MA 20 | 睇成交有冇放大 |
| **VWAP** | Anchor Period = **Session**；Source = hlc3 | 開咗 ETH，VWAP 會**由 04:00 盤前計起**；想用正常時段 VWAP，可以用 RTH 圖，或者用 **Anchored VWAP** 放喺 09:30 |
| **Moving Average Exponential** | Length = **9**、Source = Close | 就係 EMA 9；包唔包盤前取決於 ETH |
| **Relative Volume at Time** | Anchor = 1 Day、Length = 10 | 同「之前 10 日同一時間」比較；開咗 ETH 先計盤前 |
| **ATR** | Length = 14，喺**日線**睇 | 日內圖嘅 ATR 係分鐘波幅，唔係我哋報告嗰個 ATR % |

## 8.1 VWAP：Session 定 09:30？

喺示範圖將 VWAP 由「Session（包盤前）」轉做「只計 09:30 起」，睇吓兩條線差幾遠。盤前成交愈少，差距通常愈細；盤前有大消息、大成交，差距就大。

:::key 統一規則
報告入面嘅 EMA 9 係**5 分鐘、包盤前**。你喺 TradingView 開 ETH + 5m + EMA 9，數值就會同報告接近（數據源唔同，會有少少差）。
:::

:::warn TradingView 嘅 RVOL 同我哋嘅 RVOL
TradingView Screener 入面嘅「Relative Volume」通常只計正常時段，**唔係**盤前同時段 RVOL。盤前要睇 **Pre-market Volume**，或者喺 ETH 圖用 **Relative Volume at Time**。
:::

## 8.2 將指標存成範本

加好 Volume、VWAP、EMA 9 之後：

:::steps
1. 撳頂部 **Indicators** 旁邊嘅範本圖示（Indicator Templates）。
2. 揀 **Save Indicator Template**，命名例如「Day Trade 5m」。
3. 以後開新圖，揀返呢個範本，三個指標連設定一齊加返。
:::

## 8.3 每個指標喺圖上應該睇到咩？

| 指標 | 正常樣子 | 要留意 |
|---|---|---|
| Volume + MA 20 | 開市頭幾支好高、午市低 | 午市突然有一支高過 MA 兩三倍 → 可能有消息或者大單 |
| VWAP | 開市後幾分鐘郁得快，之後愈嚟愈平 | 價格成朝喺佢上面 = 偏強；不停穿越 = 冇方向 |
| EMA 9 | 貼住價格走 | 強勢時價格回調只係掂到 EMA 9 就再升 |
| Relative Volume at Time | 1 倍左右 | 開市頭 15 分鐘 ≥ 2 倍 = 今日多人玩 |

## 8.4 免費版指標唔夠點算？

免費帳戶每張圖可以加嘅指標數目有限。優先次序：

1. **VWAP**（最重要嘅日內背景）
2. **EMA 9**（短線趨勢同回調位）
3. Volume（有啲帳戶唔計入限額）
4. 其他（RVOL、ATR）可以喺報告或者另一張圖睇

或者用平台嘅「一合一」Pine Script，一個指標包晒 VWAP、EMA、價位線同開市區間。

:::warn 數值同報告唔同係正常
TradingView、Alpaca、IBKR 用嘅數據源唔同（例如有冇計暗池成交、盤前由幾點計起），VWAP 同 EMA 可能差幾仙到一兩毫子。判斷「價格喺上面定下面」時，如果兩者差距細過呢個誤差，就當係「喺附近」，唔好當成明確訊號。
:::

[[quiz:l10-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c9', num: '9', title: '畫關鍵價位：PMH、PML、PDH、PDL、PDC', mins: 8,
  summary: '用 Horizontal Ray 畫五條線、加名同顏色；開 Magnet 吸住高低位；設定只喺分鐘圖顯示；用 Object Tree 管理。',
  keywords: ['Horizontal Ray', 'Magnet', 'Object Tree', 'PMH', 'PDH'],
  md: `
## 9.1 每日五條線

| 線 | 點搵 | 建議顏色 |
|---|---|---|
| **PDH** 昨日高 | 昨日 09:30–16:00 最高（Session Breaks 幫你分日） | 藍 |
| **PDL** 昨日低 | 昨日正常時段最低 | 藍 |
| **PDC** 昨收 | 昨日 16:00 收市價 | 灰 |
| **PMH** 盤前高 | 今日 04:00–09:30 最高（要開 ETH） | 紫 |
| **PML** 盤前低 | 今日盤前最低 | 紫 |

## 9.2 步驟

:::steps
1. 左邊工具列揀 **Horizontal Ray**（或者 Horizontal Line）。
2. 開 **Magnet**（磁石圖示），點擊 K 線高位／低位，線會吸住準確價格。
3. 雙擊條線 → **Text** 打「PMH」，揀顏色；**Visibility** 只剔分鐘圖，避免日線亂晒。
4. 右邊 **Object Tree** 睇到全部線，可以鎖定（Lock）同隱藏。
5. 收市後刪走當日嘅 PMH／PML，第二日重新畫（PDH／PDL 都要更新）。
:::

:::tip 每日報告已經計好數
報告每隻 pick 都有 PMH／PML／PDH／PDL／PDC，仲有 TradingCalc 計嘅 Market Profile（VAH／POC／VAL）。照住數字畫，再用 Magnet 對返圖上實際高低位 —— 數據源唔同，可能差幾仙。
:::

示範圖剔走同剔返「PMH／PML／PDH／PDL／PDC」，對比有冇價位線嘅分別。

## 9.3 線畫好之後點用？一個例子

AMD 今日五條線：PDH $166.20、PMH $164.00、PDC $159.30、PML $162.10、PDL $157.80。現價 $163.40。

| 問題 | 答案 |
|---|---|
| 上面最近嘅阻力 | PMH $164.00（差 $0.60），再上係 PDH $166.20 |
| 下面最近嘅支持 | PML $162.10（差 $1.30） |
| 跳空幾多 | ($163.40 − $159.30) ÷ $159.30 = **+2.6%** |
| 做多計劃 | 升穿 $164.00 入場，第一個 Target 可以參考 PDH $166.20 |
| 空間夠唔夠 | 入場 $164.05、Stop $163.40（$0.65），去 PDH 有 $2.15 = 約 3.3R → 空間足夠 |
| 做空計劃 | 跌穿 PML $162.10，但下面 PDC $159.30 係補缺口目標 |

五條線令你**開市前已經知道每個方向嘅入場位同空間**，開市後只需要等價格去到。

## 9.4 線同線好近點算？

例如 PMH $164.00、PDH $164.20 只差兩毫：當成**一個區域** $164.00–164.20。突破要企穩 $164.20 上面先算；只升穿 $164.00 未算突破。

:::bad 常見錯誤
- 用日線圖嘅 Magnet 吸 PDH，但日線包埋盤後？唔會 —— 日線只計正常時段，所以日線高位就係 PDH，可以放心用。但 5 分鐘 ETH 圖上目測「昨日最高」就可能錯吸咗盤後高位。
- 隔日唔刪舊線，圖上有三日嘅 PMH，搞亂晒。
:::

[[quiz:l10-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c10', num: '10', title: 'Long／Short Position 工具同量度工具', mins: 8,
  summary: 'Long／Short Position 工具一拉就見到 Risk、Reward、R:R 同股數；Price Range 量度距離同百分比。',
  keywords: ['Long Position', 'Short Position', 'Risk Reward', 'Price Range'],
  md: `
## 10.1 Position 工具

左邊工具列 **Forecasting and measurement tools → Long Position／Short Position**。點擊 Entry 位，拉上落設定 Stop（紅格）同 Target（綠格）。

雙擊工具可以設定 **Account size** 同 **Risk %**，佢會自動計 **Qty（股數）**。試吓用下面嘅示範（例子：示範圖 11/05 跌穿盤前低沽空，Entry 377.30、Stop 379.50、Target 372.90）：

[[widget:l10-position]]

## 10.2 量度工具

| 工具 | 用途 |
|---|---|
| **Price Range** | 量兩個價之間差幾多、幾多 %（例如 Stop 距離） |
| **Date Range** | 量經過幾多支 K、幾耐 |
| **Date and Price Range** | 兩樣一齊 |
| 快捷：按住 **Shift** 再拖 | 即時量度 |

:::key Position 工具唔會落單
佢只係計數同畫圖。真正落單要喺券商度做，記住實際成交價可能有滑價（Level 7）。
:::

## 10.3 自己計一次：Position 工具背後嘅數

例子：戶口 $10,000，每筆風險 1%（$100）。做多 Entry $50.00、Stop $49.20、Target $51.60。

:::steps
1. 每股風險 = $50.00 − $49.20 = **$0.80**。
2. 股數 = $100 ÷ $0.80 = **125 股**。
3. 需要資金 = 125 × $50 = **$6,250**（細過戶口，買得起）。
4. 每股潛在回報 = $51.60 − $50.00 = $1.60 → R:R = $1.60 ÷ $0.80 = **2:1**。
5. 去到 Target 賺 125 × $1.60 = **$200 = +2R**。
:::

Position 工具會顯示同樣嘅數。但佢唔會檢查你夠唔夠錢：如果 Stop 好近（例如 $0.10），股數 = 1,000 股 × $50 = $50,000，超過戶口。**股數要取「風險計出嚟」同「資金買得起」兩者較細嗰個。**

## 10.4 實戰用法

- **入場前**：拉好 Position 工具，睇 R:R 有冇 2:1，冇就唔做。
- **入場後**：將工具拖去實際成交價，睇自己嘅真實 R:R 變成點（有滑價時通常差咗少少）。
- **收市後**：保留工具喺圖上截圖，貼入交易日誌，之後檢討一目了然。

:::tip 量度 Stop 闊唔闊
用 Price Range 量一量 Stop 距離係幾多 %。大型股日內 Stop 通常約 0.3%–1%；細過 0.2% 好容易被正常波動掃走，大過 2% 就要減股數。
:::

[[quiz:l10-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c11', num: '11', title: '警報、Watchlist 同 Screener', mins: 7,
  summary: '喺 PMH／PML 線設 Crossing 警報，唔使成朝盯住；Watchlist 加盤前欄位；Screener 用 Pre-market 欄位，但 RVOL 要小心。',
  keywords: ['Alert', 'Watchlist', 'Screener', 'Pre-market Change'],
  md: `
## 11.1 喺價位線設警報

:::steps
1. 右鍵 PMH 條線 → **Add alert**（或者頂部 Alert 掣）。
2. Condition：**Crossing**（價格穿過）；Trigger：**Once**（響一次）。
3. 設到期時間 = 今日收市。
4. 通知方式：App 推送 + 聲音。
:::

警報響 ≠ 入場。響咗之後，先睇成交量、VWAP、EMA 9 同大市，按你嘅計劃決定。

## 11.2 Watchlist

右邊 Watchlist 可以加欄位，例如 **Pre-market Change %**、**Pre-market Volume**、**Change %**。每朝將報告嘅 picks 加入一個「今日」清單。

## 11.3 Screener

**Products → Screeners → Stock Screener**，揀 **Pre-market** 相關欄位（Pre-market Change %、Pre-market Volume、Pre-market Gap %），對應 Level 盤前 9 個 Indicator 嘅頭三個。

:::warn 三個容易撈亂嘅欄位
- **Pre-market Change %**：盤前現價對比昨收 —— 即係我哋嘅 Gap %。
- **Pre-market Gap %**：盤前**第一個價**對比昨收，同上面唔一樣。
- **Relative Volume**：通常只計正常時段，**唔係**盤前 RVOL。
:::

## 11.4 警報條件同觸發方式

| 設定 | 選項 | 幾時用 |
|---|---|---|
| Condition | **Crossing**（任何方向穿過） | 唔肯定方向，只想知去到 |
| | **Crossing Up／Crossing Down** | 只關心升穿（做多）或者跌穿（做空） |
| | **Greater Than／Less Than** | 價格企喺某價之上／下 |
| Trigger | **Only Once** | 價位警報，響一次就夠 |
| | **Once Per Bar Close** | 想等 K 線收市確認先響（減少假突破嘅提示） |

**對象唔一定係價格**：可以揀「NVDA 穿過 VWAP」，警報條件揀 VWAP 指標，咁就唔使一直望住。

## 11.5 一朝設幾多個警報？

每隻 pick 2–3 個已經夠：

| 警報 | 用途 |
|---|---|
| 入場位（例如 PMH 升穿） | 提你準備 |
| Stop 附近 | 如果已經入咗場而又冇掛 Stop 單（唔建議），至少有提示 |
| 補充位（例如穿 VWAP） | 走勢轉變嘅提示 |

免費帳戶可以同時開嘅警報數目有限，收市後記得刪走已響或者過期嘅警報。

:::warn 警報會遲
警報經網絡推送，通常延遲幾秒；網絡差或者手機省電模式可能更遲。警報係「叫你望一望」，唔係落單工具。要準時入場，用券商嘅條件單（例如 Stop 單），之後落單效率嗰個單元會詳細教。
:::

[[quiz:l10-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l10-c12', num: '12', title: 'Bar Replay 練習同開市前 10 分鐘 Chart 例行', mins: 10,
  summary: '用 Bar Replay 逐支 K 播返歷史走勢練習；每朝用固定步驟將報告嘅 pick 放上 Chart；最後做畢業測驗。',
  keywords: ['Bar Replay', 'Checklist', '開市前準備'],
  md: `
## 12.1 Bar Replay

頂部 **Replay**（⏪ 圖示）→ 點擊圖上想開始嘅位置 → 撳 ▶️ 或者「下一支」逐支 K 播。用嚟：

- 練習開市推動：停喺 09:30，自己決定入唔入，再播落去睇結果；
- 覆盤：報告嘅 picks 收市後，播返當日開市頭 30 分鐘。

> 免費版 Bar Replay 可能只限日線或以上，分鐘圖要付費方案（以官方為準）。App 入面嘅 K 線重播同交易模擬器可以免費練分鐘圖：

[[link:replay|⏯️ K 線重播]]

[[link:sim|🎮 交易模擬器]]

## 12.2 第一次設定（做一次就得）

[[check:l10-setup]]

## 12.3 每朝開市前 10 分鐘

用今日報告嘅一隻 pick 做：

[[check:l10-premarket]]

:::key 一個完整例子
報告寫：「QCOM 沽空：跌穿盤前低 154.50，首 5 分鐘成交 ≥ 59 萬股，價格喺 VWAP 同 EMA 9 之下；Entry 154.40、Stop 157.37、Target 148.46」。
1. 開 QCOM，5m，ETH 開，New York 時區。
2. 畫 PMH 158.59、PML 154.50、PDH 174.00、PDL 162.75、PDC 173.19。
3. 確認 VWAP 同 EMA 9 喺現價上面（沽空先合理）。
4. 用 Short Position 工具：Entry 154.40、Stop 157.37、Target 148.46，Risk 1% → 睇 Qty。
5. 喺 PML 154.50 設 Crossing 警報。
6. 09:30 之後：警報響 → 睇成交量夠唔夠、價格係咪仍然喺 VWAP 下面 → 先決定。
:::

## 12.5 Replay 練習一節點樣安排（30 分鐘）

:::steps
1. **揀日子**（2 分鐘）：揀一隻股、一個你未睇過嘅交易日（例如報告入面某隻 pick 嘅日子）。
2. **開市前準備**（5 分鐘）：Replay 停喺 09:25，畫 PMH、PML、PDH、PDL、PDC，寫低 If-Then。
3. **逐支播**（15 分鐘）：09:30–11:00，每支 K 收市先播下一支；觸發就用 Position 工具記入場、Stop、Target。
4. **對答案**（5 分鐘）：播到收市，睇結果；記錄 R。
5. **寫一句**（3 分鐘）：今次學到乜。
:::

每星期做三節，一個月就有 12 個完整交易日嘅練習，等於 12 次「真實開市」嘅經驗，而且冇真錢風險。

## 12.6 開市前 10 分鐘例行：常見遺漏

| 遺漏 | 後果 |
|---|---|
| 冇更新 PDH／PDL（用咗前日嘅線） | 參考位錯晒 |
| 冇確認 ETH 開咗 | 睇唔到盤前高低 |
| 警報冇設到期 | 舊警報第二日亂響 |
| 冇睇今日事件時間 | 數據公布嗰刻入咗場 |

## 12.4 Level 10 畢業測驗

[[quiz:l10-final]]

[[check:l10-grad]]

[[link:picks|📋 去今日選股，用 Chart 準備第一隻]]

[[link:level/l11|➡️ 下一課：Level 11 真錢之前]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l10-c1': { title: '小測：圖表設定嘅重要性', questions: [
  { q: '冇開 Extended Hours，最大問題係？', options: ['K 線顏色唔同', '睇唔到盤前 K 線，漏咗 PMH／PML', '冇問題'], answer: 1, explain: 'PMH／PML 只喺盤前 K 線入面。' },
  { q: '同一隻股，開唔開 ETH，EMA 9 數值會唔會變？', options: ['唔會', '會，因為盤前 K 線都計埋', '只係日線先變'], answer: 1, explain: '指標用顯示出嚟嘅 K 線計。' },
  { q: 'Day Trade 建議嘅時區？', options: ['香港', 'New York（美東）', 'London'], answer: 1, explain: '同報告、經濟數據時間一致。' },
]},
'l10-c2': { title: '小測：介面', questions: [
  { q: 'Long／Short Position 工具喺邊？', options: ['左邊畫圖工具列', '右邊 Watchlist', '底部時區'], answer: 0, explain: 'Forecasting and measurement tools。' },
  { q: 'Object Tree 有咩用？', options: ['睇新聞', '管理圖上所有線同指標', '落單'], answer: 1, explain: '可以鎖定、隱藏、刪除畫線。' },
  { q: '免費版指標唔夠加，優先揀？', options: ['RSI + MACD', 'VWAP + EMA 9', 'Bollinger + Ichimoku'], answer: 1, explain: '對應報告用嘅指標。' },
]},
'l10-c3': { title: '小測：時區', questions: [
  { q: '冬令時間美股 09:30 開市，香港時間係？', options: ['21:30', '22:30', '23:30'], answer: 1, explain: '冬令 +13 小時。' },
  { q: '08:30（美東）嘅非農數據，夏令時間香港係幾點？', options: ['20:30', '21:30', '22:30'], answer: 0, explain: '夏令 +12 小時。' },
  { q: '點改 TradingView 時區？', options: ['撳圖表右下角時間', '重新登入', '換股票'], answer: 0, explain: '右下角揀 (UTC-5) New York。' },
]},
'l10-c4': { title: '小測：Extended Hours', questions: [
  { q: '盤前時段（美東）係？', options: ['04:00–09:30', '08:00–09:30', '09:30–16:00'], answer: 0, explain: '盤後係 16:00–20:00。' },
  { q: '開 ETH 嘅位置之一？', options: ['Settings → Symbol → Session', 'Settings → Trading', 'Watchlist'], answer: 0, explain: '或者分鐘圖底部 ETH／RTH 掣。' },
  { q: '盤前背景色有咩用？', options: ['靚啲', '一眼分到邊段係盤前／盤後', '令成交量變大'], answer: 1, explain: '避免將盤前走勢當正常時段。' },
]},
'l10-c5': { title: '小測：Session Breaks', questions: [
  { q: 'Session Breaks 喺邊度開？', options: ['Settings → Canvas（舊版 Appearance）', 'Indicators', 'Alert'], answer: 0, explain: '剔 Session breaks。' },
  { q: '開咗 ETH，分日線通常喺幾點？', options: ['04:00', '09:30', '16:00'], answer: 0, explain: '只睇 RTH 就喺 09:30。' },
  { q: 'Session Breaks 最大好處？', options: ['自動交易', '分清昨日同今日，易搵 PDH／PDL', '計 RVOL'], answer: 1, explain: '直線之間就係一日。' },
]},
'l10-c6': { title: '小測：時間框架', questions: [
  { q: '入場同 Stop 主要睇邊個時間框架？', options: ['日線', '15m', '5m'], answer: 2, explain: '日線睇背景、15m 睇結構、5m 執行。' },
  { q: '免費版想同時睇幾個時間框架？', options: ['唔可以', '開幾個瀏覽器分頁', '一定要付費'], answer: 1, explain: '每個分頁一個圖。' },
  { q: 'QQQ 嗰個圖用嚟？', options: ['比較 Relative Strength', '睇 TSLA 新聞', '冇用'], answer: 0, explain: '個股強過定弱過大市。' },
]},
'l10-c7': { title: '小測：K 線同刻度', questions: [
  { q: 'Heikin Ashi 唔適合落單，因為？', options: ['顏色唔同', '佢係平均價，唔係真實成交價', '太慢'], answer: 1, explain: 'PMH、Stop 會畫錯。' },
  { q: '日內圖用邊種刻度？', options: ['Linear', 'Log', '冇所謂'], answer: 0, explain: 'Log 用喺幾年長線圖。' },
  { q: 'Countdown to bar close 有咩用？', options: ['知道支 K 幾時收，等收 K 先確認', '計 RVOL', '落單'], answer: 0, explain: '避免未收 K 就當確認。' },
]},
'l10-c8': { title: '小測：指標', questions: [
  { q: '開咗 ETH，Session VWAP 由幾點計起？', options: ['04:00 盤前', '09:30', '16:00'], answer: 0, explain: '想由 09:30 計，用 RTH 圖或者 Anchored VWAP。' },
  { q: 'EMA 9 嘅設定？', options: ['Moving Average Exponential，Length 9，Source Close', 'SMA 9', 'RSI 9'], answer: 0, explain: 'Exponential = EMA。' },
  { q: 'TradingView Screener 嘅 Relative Volume 等於盤前 RVOL？', options: ['係', '通常唔係，多數只計正常時段', '一定係'], answer: 1, explain: '盤前要睇 Pre-market Volume 或者 Relative Volume at Time。' },
]},
'l10-c9': { title: '小測：畫價位', questions: [
  { q: 'Magnet 模式有咩用？', options: ['令畫線吸住 K 線高低位嘅準確價格', '自動落單', '放大圖'], answer: 0, explain: '避免畫偏幾仙。' },
  { q: 'PDH 應該用邊段時間？', options: ['昨日 04:00–20:00 全部', '昨日 09:30–16:00 正常時段', '今日盤前'], answer: 1, explain: '同報告一致：正常時段。' },
  { q: '畫完 PMH 之後最好？', options: ['設定只喺分鐘圖顯示', '喺日線都顯示', '唔使理'], answer: 0, explain: 'Visibility 設定，避免日線亂。' },
]},
'l10-c10': { title: '小測：Position 工具', questions: [
  { q: 'Short：Entry 377.30、Stop 379.50、Target 372.90，R:R？', options: ['1.0', '2.0', '3.0'], answer: 1, explain: '4.40 ÷ 2.20 = 2.0。' },
  { q: 'Account $10,000、Risk 1%、每股風險 $2.20，按風險計 Qty 係？', options: ['45 股', '100 股', '22 股'], answer: 0, explain: '⌊100 ÷ 2.20⌋ = 45。但如果股價 $377、只用現金，$10,000 只夠買 26 股 —— 股數取兩個限制較細嗰個（Level 9 第 9 章）。' },
  { q: 'Position 工具會唔會幫你落單？', options: ['會', '唔會，只係計數同畫圖', '付費版會'], answer: 1, explain: '落單喺券商。' },
]},
'l10-c11': { title: '小測：警報同 Screener', questions: [
  { q: '喺 PMH 設警報，Condition 揀？', options: ['Crossing', 'Moving up %', 'Volume'], answer: 0, explain: '價格穿過條線就響。' },
  { q: 'Pre-market Change % 同 Pre-market Gap % 一樣？', options: ['一樣', '唔一樣：Gap % 用盤前第一個價', 'Gap % 用收市價'], answer: 1, explain: 'Change % 先係盤前現價對比昨收。' },
  { q: '警報響咗應該？', options: ['即刻入場', '按計劃檢查成交量、VWAP、EMA 9、大市再決定', '熄咗佢'], answer: 1, explain: '警報 ≠ 入場訊號。' },
]},
'l10-final': { title: 'Level 10 畢業測驗', final: true, questions: [
  { q: '你開 TSLA 5m 圖，見唔到 04:00–09:30 嘅 K 線。最可能原因？', options: ['TSLA 盤前冇成交', 'Session 設咗 Regular（冇開 Extended Hours）', '時區錯'], answer: 1, explain: '開 ETH 先顯示盤前盤後。' },
  { q: '圖表時區係香港，你見到開市第一支 K 喺 22:30。夏令時間開始之後，第一支 K 會喺？', options: ['22:30', '21:30', '23:30'], answer: 1, explain: '夏令 +12 小時，所以 21:30。' },
  { q: '開咗 ETH 之後，VWAP 同你券商 App（只計 09:30 起）唔一樣，點解？', options: ['TradingView 計錯', 'TradingView Session VWAP 由 04:00 盤前計起', '券商延遲'], answer: 1, explain: '兩個起點唔同。' },
  { q: 'Session Breaks 主要幫你？', options: ['分清每一日，搵 PDH／PDL／PDC', '自動畫 PMH', '計 ATR'], answer: 0, explain: '直線之間就係一日。' },
  { q: '用 Heikin Ashi 圖畫 Stop，問題係？', options: ['冇問題', 'Heikin Ashi 唔係真實成交價，Stop 位會錯', '顏色太多'], answer: 1, explain: 'Day Trade 用普通 Candles。' },
  { q: '報告寫 PMH 158.59，你圖上 Magnet 吸到 158.62，應該？', options: ['用圖上實際高位，差幾仙係數據源唔同', '一定係報告錯', '唔畫'], answer: 0, explain: '以你交易平台／券商嘅數據為準。' },
  { q: 'Long Position：Entry 100、Stop 99、Target 102，Account $5,000、Risk 1%，Qty？', options: ['50 股', '100 股', '25 股'], answer: 0, explain: '風險 $50 ÷ 每股 $1 = 50 股；R:R = 2。' },
  { q: '想 PML 被跌穿時通知你，應該？', options: ['喺 PML 條線設 Crossing 警報', '每秒刷新', '開多啲指標'], answer: 0, explain: 'Trigger 揀 Once，到期設今日收市。' },
  { q: 'TradingView Screener 揀盤前跳空股，應該用邊個欄位對應我哋嘅 Gap %？', options: ['Pre-market Change %', 'Pre-market Gap %', 'Relative Volume'], answer: 0, explain: 'Change % = 盤前現價對比昨收。' },
  { q: '免費版分鐘圖 Bar Replay 用唔到，點練？', options: ['唔練', '用日線 Replay，或者 App 嘅 K 線重播同模擬器', '直接真錢試'], answer: 1, explain: '先練好再用真錢。' },
]},
});
Object.assign(window.CHECKLISTS, {
'l10-setup': { title: 'TradingView 第一次設定', items: [
  '開帳戶，打開 Supercharts（電腦用瀏覽器或者 Desktop App）',
  '右下角時區揀 (UTC-5) New York',
  'Settings → Symbol → Session：Extended trading hours；設盤前、盤後背景色',
  'Settings → Canvas：剔 Session breaks',
  'K 線類型：Candles；刻度：Linear + Auto；開最後價格線同 Countdown',
  '加指標：Volume（MA 20）、VWAP（Session）、EMA 9',
  '（可選）Relative Volume at Time；日線另外加 ATR 14',
  '開 Magnet；設定好 Horizontal Ray 嘅預設顏色',
  '儲存成 Chart Layout，再儲存一個 Indicator Template',
  '整一個 Watchlist「今日」',
]},
'l10-premarket': { title: '開市前 10 分鐘 Chart 例行', resettable: true, items: [
  '打開今日報告，揀一隻 pick',
  '開 5m 圖（ETH 開、New York 時區），再開日線睇背景',
  '畫 PMH、PML、PDH、PDL、PDC（Magnet 吸準）',
  '（有就畫）報告嘅 Market Profile VAH／POC／VAL',
  '確認價格相對 VWAP 同 EMA 9 嘅位置同報告方向一致',
  '開 QQQ 5m，比較 Relative Strength',
  '用 Long／Short Position 工具放好 Entry、Stop、Target，睇 Qty',
  '喺觸發價位設 Crossing 警報',
  '寫低：唔做嘅情況（例如開市已經過咗入場價太遠）',
]},
'l10-grad': { title: 'Level 10 畢業自我檢查', items: [
  '識將時區設成 New York，講得出冬令／夏令香港時間',
  '識開 Extended Hours 同盤前盤後背景色',
  '識開 Session Breaks，分得清昨日同今日',
  '知道開咗 ETH 會改變 EMA 9 同 VWAP 嘅數值',
  '識用日線、15m、5m 三個時間框架',
  '識畫 PMH／PML／PDH／PDL／PDC 同用 Magnet',
  '識用 Long／Short Position 工具計 R:R 同 Qty',
  '識喺價位線設警報',
  '分得清 Pre-market Change %、Pre-market Gap %、Relative Volume',
  '用 Bar Replay 或者 App 重播練過 5 次開市推動',
]},
});
window.GLOSSARY.push(
  { term: 'ETH / Extended Hours', zh: '延長交易時段', def: 'Extended Trading Hours：連埋盤前 04:00–09:30 同盤後 16:00–20:00。TradingView 要開咗先顯示盤前盤後 K 線。', lv: 'l10' },
  { term: 'Session Breaks', zh: '分日線', def: 'TradingView 喺每個交易日開始位置畫嘅直線（Settings → Canvas），用嚟分清每一日。', lv: 'l10' },
  { term: 'Pre/Post-market Background', zh: '盤前盤後背景色', def: '將盤前、盤後時段塗上唔同底色，一眼分到邊段係正常時段。', lv: 'l10' },
  { term: 'Timezone', zh: '時區', def: '圖表時間軸用嘅時區。Day Trade 建議用 New York（美東）；香港冬令 +13、夏令 +12 小時。', lv: 'l10' },
  { term: 'Anchored VWAP', zh: '錨定 VWAP', def: '由你揀嘅一支 K（例如 09:30 開市）開始計嘅 VWAP。', lv: 'l10' },
  { term: 'Relative Volume at Time', zh: '同時段相對成交量', def: 'TradingView 內置指標：今日某時間嘅成交同之前 N 日同一時間比較。', lv: 'l10' },
  { term: 'Heikin Ashi', zh: '平均 K 線', def: '用平均價畫嘅 K 線，走勢較平滑，但唔係真實成交價，唔適合用嚟定入場同 Stop。', lv: 'l10' },
  { term: 'Long / Short Position Tool', zh: '多空倉位工具', def: 'TradingView 畫圖工具：畫出 Entry、Stop、Target 嘅紅綠方格，自動計 R:R 同股數。', lv: 'l10' },
  { term: 'Price Range Tool', zh: '價格量度工具', def: '量兩個價格之間嘅距離同百分比；按住 Shift 拖動可以快速量度。', lv: 'l10' },
  { term: 'Magnet Mode', zh: '磁石模式', def: '畫線時自動吸住附近 K 線嘅開高低收，畫價位更準。', lv: 'l10' },
  { term: 'Object Tree', zh: '物件清單', def: '列出圖上所有畫線同指標，可以鎖定、隱藏、刪除。', lv: 'l10' },
  { term: 'Chart Layout / Template', zh: '版面同模板', def: '儲存好嘅圖表設定（時區、指標、畫線樣式），下次一撳就用返。', lv: 'l10' },
  { term: 'Pre-market Change %', zh: '盤前漲跌幅', def: '盤前現價對比昨收嘅變化，即係報告嘅 Gap %；同 Pre-market Gap %（用盤前第一個價）唔同。', lv: 'l10' },
);
