/* Level 12：睇圖實戰 —— 由 Notes 到真圖（結構、斜線、Lower High、Gap 真相、練習方法） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const C = window.Charts;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => v != null && e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = (v) => (v == null || !isFinite(v) ? '—' : v.toFixed(2));
  const pct = (v) => (v == null ? '—' : v.toFixed(1) + '%');
  const pad = (n) => String(n).padStart(2, '0');
  const hmOf = (i) => { const m = 570 + i * 5; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  const tsGet = (k, d) => { try { const u = Store.user(); return (u && u.toolState && u.toolState[k]) || d; } catch (e) { return d; } };
  const tsSet = (k, v) => { try { const u = Store.user(); if (!u) return; u.toolState = u.toolState || {}; u.toolState[k] = v; Store.save(); } catch (e) {} };

  /* 真實 Gap 統計（scripts/research/gap-stats.mjs 用 Alpaca 5 分鐘 K 線計，只係統計數字） */
  const GAP = {"from":"2024-01-01","to":"2026-11-05","minGapPct":3,"universe":["TSLA","NVDA","AAPL","AMD","META","AMZN","MSFT","GOOGL","AVGO","NFLX","PLTR","COIN","MU","SMCI","MSTR","HOOD","ARM","INTC","ORCL","CRM","ADBE","SHOP","UBER","ABNB","SNOW","CRWD","PANW","NET","DDOG","MRVL","QCOM","LRCX","AMAT","ROKU","PYPL","RIVN","SOFI","AFRM","UPST","BABA","PDD","DIS","BA","NKE","SBUX","LLY","UNH","CVNA","DKNG","RBLX"],"source":"Alpaca SIP 5 分鐘 K 線（正常交易時段）","definitions":{"go":"收市比開市價再向 Gap 方向行多過 0.25 ATR","fade":"收市比開市價向反方向行多過 0.25 ATR","flat":"其餘（收市同開市價相差唔夠 0.25 ATR）","fill":"當日有冇掂返昨日收市價（補 Gap）","after10":"10:00 嗰刻向 Gap 方向入，揸到收市","rvol5":"開市首 5 分鐘成交 ÷ 過去 20 日首 5 分鐘平均"},"groups":{"all":{"n":3326,"go":33.2,"flat":29.8,"fade":37,"fill":21.4,"closeBeyondOpen":47.1,"avgFromOpenAtr":-0.02,"after10Win":48.9,"avgAfter10Atr":0,"avgMfeAtr":0.59},"up":{"n":1771,"go":32.6,"flat":30.5,"fade":36.9,"fill":21.5,"closeBeyondOpen":46.2,"avgFromOpenAtr":-0.03,"after10Win":48.7,"avgAfter10Atr":-0.02,"avgMfeAtr":0.61},"down":{"n":1555,"go":33.9,"flat":28.9,"fade":37.2,"fill":21.3,"closeBeyondOpen":48.2,"avgFromOpenAtr":-0.02,"after10Win":49.1,"avgAfter10Atr":0.01,"avgMfeAtr":0.57},"gap3to5":{"n":2124,"go":31.4,"flat":32.3,"fade":36.3,"fill":26.4,"closeBeyondOpen":46.7,"avgFromOpenAtr":-0.03,"after10Win":47.9,"avgAfter10Atr":-0.01,"avgMfeAtr":0.51},"gap5to8":{"n":778,"go":33.9,"flat":28.4,"fade":37.7,"fill":15.8,"closeBeyondOpen":47,"avgFromOpenAtr":-0.02,"after10Win":49.4,"avgAfter10Atr":0.01,"avgMfeAtr":0.62},"gap8plus":{"n":424,"go":41.3,"flat":19.6,"fade":39.2,"fill":6.8,"closeBeyondOpen":49.5,"avgFromOpenAtr":0.03,"after10Win":52.8,"avgAfter10Atr":0.04,"avgMfeAtr":0.9},"full":{"n":2710,"go":33.3,"flat":28.7,"fade":38,"fill":19.7,"closeBeyondOpen":46.6,"avgFromOpenAtr":-0.03,"after10Win":48.5,"avgAfter10Atr":0,"avgMfeAtr":0.61},"partial":{"n":616,"go":32.8,"flat":34.4,"fade":32.8,"fill":29.1,"closeBeyondOpen":49.5,"avgFromOpenAtr":-0.01,"after10Win":50.6,"avgAfter10Atr":0,"avgMfeAtr":0.48},"first5with":{"n":1555,"go":47.2,"flat":28.8,"fade":24,"fill":12.5,"closeBeyondOpen":62.4,"avgFromOpenAtr":0.26,"after10Win":49.6,"avgAfter10Atr":0,"avgMfeAtr":0.83},"first5against":{"n":1771,"go":20.9,"flat":30.6,"fade":48.4,"fill":29.2,"closeBeyondOpen":33.8,"avgFromOpenAtr":-0.27,"after10Win":48.3,"avgAfter10Atr":-0.01,"avgMfeAtr":0.38},"hold10":{"n":1565,"go":55,"flat":30,"fade":15.1,"fill":6.6,"closeBeyondOpen":71.6,"avgFromOpenAtr":0.4,"after10Win":50.4,"avgAfter10Atr":0.01,"avgMfeAtr":0.9},"lose10":{"n":1761,"go":13.9,"flat":29.6,"fade":56.5,"fill":34.6,"closeBeyondOpen":25.4,"avgFromOpenAtr":-0.4,"after10Win":47.6,"avgAfter10Atr":-0.01,"avgMfeAtr":0.31},"vwap10with":{"n":1538,"go":49.4,"flat":31.6,"fade":19,"fill":10.3,"closeBeyondOpen":65.4,"avgFromOpenAtr":0.31,"after10Win":49.8,"avgAfter10Atr":0,"avgMfeAtr":0.81},"vwap10against":{"n":1788,"go":19.3,"flat":28.2,"fade":52.5,"fill":31,"closeBeyondOpen":31.4,"avgFromOpenAtr":-0.31,"after10Win":48.1,"avgAfter10Atr":-0.01,"avgMfeAtr":0.4},"rvol5hi":{"n":754,"go":43.5,"flat":17.5,"fade":39,"fill":11,"closeBeyondOpen":51.7,"avgFromOpenAtr":0.06,"after10Win":50.1,"avgAfter10Atr":0.02,"avgMfeAtr":0.94},"rvol5lo":{"n":1491,"go":26.2,"flat":37.3,"fade":36.6,"fill":27.5,"closeBeyondOpen":42.8,"avgFromOpenAtr":-0.08,"after10Win":47.4,"avgAfter10Atr":-0.02,"avgMfeAtr":0.39},"allThree":{"n":790,"go":63.5,"flat":25.6,"fade":10.9,"fill":6.2,"closeBeyondOpen":77.7,"avgFromOpenAtr":0.56,"after10Win":49.7,"avgAfter10Atr":0.01,"avgMfeAtr":1.05},"noneThree":{"n":1009,"go":9.9,"flat":25.5,"fade":64.6,"fill":40.8,"closeBeyondOpen":18.9,"avgFromOpenAtr":-0.53,"after10Win":46.4,"avgAfter10Atr":-0.01,"avgMfeAtr":0.24},"allThreeRvol":{"n":220,"go":78.2,"flat":16.4,"fade":5.5,"fill":0,"closeBeyondOpen":85,"avgFromOpenAtr":0.97,"after10Win":53.6,"avgAfter10Atr":0.11,"avgMfeAtr":1.57}},"years":{"2024":{"n":955,"go":34.2,"flat":26.6,"fade":39.2,"fill":22.1,"closeBeyondOpen":46.6,"avgFromOpenAtr":-0.03,"after10Win":47.5,"avgAfter10Atr":0,"avgMfeAtr":0.65},"2025":{"n":1191,"go":30.7,"flat":30.6,"fade":38.7,"fill":23.4,"closeBeyondOpen":44,"avgFromOpenAtr":-0.07,"after10Win":47.4,"avgAfter10Atr":-0.04,"avgMfeAtr":0.57},"2026":{"n":1180,"go":34.9,"flat":31.5,"fade":33.6,"fill":18.8,"closeBeyondOpen":50.8,"avgFromOpenAtr":0.02,"after10Win":51.4,"avgAfter10Atr":0.03,"avgMfeAtr":0.55}}};

  /* ---------------- 練習圖產生器（教學模擬，用固定種子） ---------------- */
  /* 相鄰種子（1、2、3…）出嚟嘅頭幾個隨機數好相似，所以先打散，再丟走頭幾個 */
  function rng(seed) { const r = C.mulberry32(Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0); for (let k = 0; k < 5; k++) r(); return r; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  /* anchors：[[第幾支 K, 價格（ATR 單位，相對 P0）, 'H'|'L'|null]]；clamp(i) 回傳 {max, min}（ATR 單位）限制呢支 K 唔可以穿 */
  function genPath(r, P0, A, anchors, n = 78, clamp, volBoost) {
    const at = (i) => { for (let k = 0; k < anchors.length - 1; k++) { const [i0, p0] = anchors[k], [i1, p1] = anchors[k + 1]; if (i >= i0 && i <= i1) return p0 + (p1 - p0) * (i - i0) / Math.max(1, i1 - i0); } return anchors[anchors.length - 1][1]; };
    const mark = {}; anchors.forEach(([i, , t]) => t && (mark[i] = t));
    const bars = []; let prev = P0 + A * at(0); let ar = 0;
    for (let i = 0; i < n; i++) {
      ar = ar * 0.55 + gauss(r) * 0.035;
      let cr = at(i) + ar;
      let o = i === 0 ? P0 + A * at(0) : prev + A * gauss(r) * 0.006;
      let c = P0 + A * cr;
      let h = Math.max(o, c) + A * Math.abs(gauss(r)) * 0.035, l = Math.min(o, c) - A * Math.abs(gauss(r)) * 0.035;
      if (mark[i] === 'H') { h = P0 + A * at(i); c = Math.min(c, h - A * 0.06); o = Math.min(o, h - A * 0.02); l = Math.min(l, c, o); }
      if (mark[i] === 'L') { l = P0 + A * at(i); c = Math.max(c, l + A * 0.06); o = Math.max(o, l + A * 0.02); h = Math.max(h, c, o); }
      const cl = clamp && clamp(i);
      if (cl && !mark[i]) {
        if (cl.max != null) { const mx = P0 + A * cl.max; h = Math.min(h, mx); c = Math.min(c, mx - A * 0.01); o = Math.min(o, mx - A * 0.01); l = Math.min(l, c, o); }
        if (cl.min != null) { const mn = P0 + A * cl.min; l = Math.max(l, mn); c = Math.max(c, mn + A * 0.01); o = Math.max(o, mn + A * 0.01); h = Math.max(h, c, o); }
      }
      const t = i / (n - 1);
      let v = (0.6 + 2.2 * Math.exp(-t * 8) + 0.7 * Math.exp(-(1 - t) * 9)) * (0.75 + r() * 0.5);
      if (volBoost) v *= volBoost(i) || 1;
      bars.push({ t: hmOf(i), o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v: +v.toFixed(3) });
      prev = c;
    }
    return bars;
  }

  /* 斜線練習：下降（連 Lower High）或者上升（連 Higher Low）；之後守住（respect）定突破（break） */
  function genTrend(seed, variant, dir) {
    const r = rng(seed);
    const P0 = 80 + Math.round(r() * 300), A = P0 * (0.025 + r() * 0.02);
    const s = -(0.011 + r() * 0.009);
    const i1 = 4 + Math.floor(r() * 4), h1 = 0.22 + r() * 0.12;
    const i2 = i1 + 13 + Math.floor(r() * 5), i3 = i2 + 13 + Math.floor(r() * 5);
    const ln = (i) => h1 + s * (i - i1);
    const anc = [[0, 0], [i1, h1, 'H'], [Math.round((i1 + i2) / 2), ln(i1) - 0.5 - r() * 0.15, 'L'], [i2, ln(i2), 'H'], [i2 + 7, ln(i2) - 0.55 - r() * 0.15, 'L'], [i3, ln(i3) - 0.005, 'H']];
    if (variant === 'respect') anc.push([i3 + 9, ln(i3) - 0.65 - r() * 0.2], [i3 + 17, ln(i3) - 0.45], [77, ln(i3) - 0.85 - r() * 0.3]);
    else anc.push([i3 + 5, ln(i3) + 0.35 + r() * 0.1], [i3 + 12, ln(i3 + 12) + 0.12], [77, ln(i3) + 0.6 + r() * 0.3]);
    const sg = dir === 'up' ? -1 : 1;
    const anchors = anc.map(([i, p, t]) => [i, sg * p, t && (sg > 0 ? t : t === 'H' ? 'L' : 'H')]);
    const clamp = (i) => (i <= i3 ? (sg > 0 ? { max: ln(i) - 0.02 } : { min: -(ln(i) - 0.02) }) : null);
    const bars = genPath(r, P0, A, anchors, 78, clamp, (i) => (variant === 'break' && i > i3 && i < i3 + 6 ? 2.2 : 1));
    return { bars, atr: A, cut: i3 - 2, kind: variant, dir, label: '練習圖', truth: { i1, i2, i3 } };
  }
  function genChop(seed) {
    const r = rng(seed);
    const P0 = 60 + Math.round(r() * 250), A = P0 * (0.025 + r() * 0.02);
    const anchors = [[0, 0]]; let i = 0;
    while (i < 77) { i = Math.min(77, i + 5 + Math.floor(r() * 7)); anchors.push([i, (r() - 0.5) * 0.7]); }
    return { bars: genPath(r, P0, A, anchors), atr: A, cut: 44, kind: 'chop', dir: null, label: '練習圖' };
  }
  /* Gap 練習：go／fade／flat，另有「陷阱」：頭 30 分鐘似 go 但之後回落，或者相反 */
  function genGap(seed) {
    const r = rng(seed);
    const dir = r() < 0.6 ? 1 : -1;
    const pc = 40 + Math.round(r() * 300), g = 0.03 + r() * 0.06, O = pc * (1 + dir * g), A = pc * (0.03 + r() * 0.025);
    const gapAtr = Math.abs(O - pc) / A;
    const roll = r();
    let plan;
    if (roll < 0.34) plan = 'go'; else if (roll < 0.62) plan = 'fade'; else if (roll < 0.8) plan = 'flat'; else plan = r() < 0.5 ? 'trapGo' : 'trapFade';
    const P = {
      go: [[0, 0], [1, 0.16], [3, 0.06], [5, 0.3], [12, 0.22], [24, 0.6], [40, 0.5], [60, 0.85], [77, 0.95]],
      fade: [[0, 0], [1, -0.12], [3, 0.06], [5, -0.22], [12, -0.12], [24, -0.5], [40, -0.65], [58, -Math.min(gapAtr, 1.1)], [77, -0.85]],
      flat: [[0, 0], [1, 0.12], [3, -0.1], [5, 0.04], [12, 0.18], [24, -0.12], [40, 0.12], [60, -0.08], [77, 0.04]],
      trapGo: [[0, 0], [1, 0.15], [3, 0.08], [5, 0.25], [12, 0.3], [20, 0.05], [34, -0.35], [55, -0.5], [77, -0.6]],
      trapFade: [[0, 0], [1, -0.14], [3, -0.02], [5, -0.18], [12, -0.25], [22, 0.05], [36, 0.35], [60, 0.55], [77, 0.7]],
    }[plan];
    const bars = genPath(r, O, A, P.map(([i, p]) => [i, dir * p]), 78, null, (i) => 1.6);
    bars[0].o = +O.toFixed(2);
    const pdh = dir > 0 ? pc * (1 + 0.004 + r() * 0.012) : pc * (1 + 0.01 + r() * 0.015);
    const pdl = dir > 0 ? pc * (1 - 0.012 - r() * 0.015) : pc * (1 - 0.004 - r() * 0.012);
    return { bars, atr: A, pc, pdh, pdl, dir, label: '練習圖', plan };
  }

  /* ---------------- 真實數據（用 App 嘅 Alpaca 金鑰；冇金鑰就只用練習圖） ---------------- */
  const realCache = {};
  async function realSessions(sym, days) {
    const key = sym + ':' + days;
    if (realCache[key]) return realCache[key];
    const end = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const m = await MarketData.load(sym, start, end);
    const out = m.sessions.filter((s) => s.bars.length >= 70 && s.atr20).map((s) => ({
      sym: m.sym, date: s.date, pc: s.pc, pdh: s.pdh, pdl: s.pdl, atr: s.atr20,
      bars: s.bars.map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })),
    }));
    realCache[key] = out;
    return out;
  }
  async function hasKeys() { try { return !!(window.MarketData && (await MarketData.getKeys())); } catch (e) { return false; } }

  /* ---------------- 指標 ---------------- */
  function vwapOf(B) { let pv = 0, vv = 0; return B.map((b) => { pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; return vv ? pv / vv : null; }); }
  /* Swing High／Low：左右各 k 支 K 都冇佢咁高（低） */
  function pivots(B, k, upto) {
    const n = upto == null ? B.length : upto; const out = [];
    for (let i = k; i < n - k; i++) {
      let hi = true, lo = true;
      for (let j = i - k; j <= i + k; j++) { if (j === i) continue; if (B[j].h >= B[i].h) hi = false; if (B[j].l <= B[i].l) lo = false; }
      if (hi) out.push({ i, p: B[i].h, t: 'H' });
      if (lo) out.push({ i, p: B[i].l, t: 'L' });
    }
    let lastH = null, lastL = null;
    out.forEach((x) => {
      if (x.t === 'H') { x.lab = lastH == null ? 'H' : x.p > lastH ? 'HH' : 'LH'; lastH = x.p; }
      else { x.lab = lastL == null ? 'L' : x.p > lastL ? 'HL' : 'LL'; lastL = x.p; }
    });
    return out;
  }
  function structureOf(P) {
    const H = P.filter((x) => x.t === 'H').slice(-2), L = P.filter((x) => x.t === 'L').slice(-2);
    if (H.length < 2 || L.length < 2) return ['range', '未夠 Swing 點判斷'];
    const hh = H[1].p > H[0].p, hl = L[1].p > L[0].p;
    if (hh && hl) return ['up', '上升結構：Higher High + Higher Low'];
    if (!hh && !hl) return ['down', '下降結構：Lower High + Lower Low'];
    return ['range', hh ? '混合：高位創新高，但低位都創新低（擴闊／轉勢中）' : '混合：Lower High + Higher Low（收窄／橫行）'];
  }
  const lineAt = (L, i) => L.p1 + (L.p2 - L.p1) * (i - L.i1) / (L.i2 - L.i1);
  /* AI 參考線：最近兩個 Lower High（或者 Higher Low），中間冇收市穿線 */
  function autoLine(B, upto, atr) {
    const P = pivots(B, 3, upto);
    const H = P.filter((x) => x.t === 'H'), Lw = P.filter((x) => x.t === 'L');
    const ok = (a, b, kind) => { const L = { i1: a.i, p1: a.p, i2: b.i, p2: b.p, kind }; for (let i = a.i; i < upto; i++) { const v = lineAt(L, i); if (kind === 'res' ? B[i].c > v + atr * 0.03 : B[i].c < v - atr * 0.03) return null; } return L; };
    const find = (list, kind) => {
      for (let a = list.length - 2; a >= 0; a--) for (let b = list.length - 1; b > a; b--) {
        if (list[b].i - list[a].i < 6) continue;
        if (kind === 'res' ? list[b].p >= list[a].p : list[b].p <= list[a].p) continue;
        const L = ok(list[a], list[b], kind); if (L) return L;
      }
      return null;
    };
    const cands = [find(H, 'res'), find(Lw, 'sup')].filter(Boolean);
    if (!cands.length) return null;
    const up = B[upto - 1].c > B[0].c;
    return cands.find((L) => (up ? L.kind === 'sup' : L.kind === 'res')) || cands[0];
  }

  /* ---------------- 畫圖 ---------------- */
  function draw(box, S) {
    const all = S.bars, n = S.show == null ? all.length : S.show, B = all.slice(0, n);
    const W = 800, priceH = 310, volH = 64, H = priceH + volH + 26, m = { l: 8, r: 78, t: 16 };
    const total = all.length, plotW = W - m.l - m.r, step = plotW / total;
    const lv = S.levels || [];
    const scaleB = S.scaleAll ? all : B;
    let lo = Math.min(...scaleB.map((b) => b.l)), hi = Math.max(...scaleB.map((b) => b.h));
    lv.forEach(([, p]) => { if (p != null && isFinite(p)) { lo = Math.min(lo, p); hi = Math.max(hi, p); } });
    const pd = (hi - lo) * (S.scaleAll ? 0.06 : 0.22); lo -= pd; hi += pd;
    const y = (p) => m.t + (hi - p) / (hi - lo) * (priceH - m.t - 6);
    const x = (i) => m.l + step * i + step / 2;
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg l12-svg', role: 'img', 'aria-label': S.aria || 'K 線圖' });
    for (let k = 0; k <= 5; k++) { const p = lo + (hi - lo) * k / 5; mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg); const t = mk('text', { x: W - m.r + 6, y: y(p) + 4, class: 'axis' }, svg); t.textContent = p.toFixed(2); }
    if (n < total) mk('rect', { x: m.l + step * n, y: m.t - 8, width: step * (total - n), height: priceH + volH - m.t + 8, class: 'l12-future' }, svg);
    const tags = lv.filter(([, p]) => p != null && isFinite(p)).map(([name, p, col]) => ({ name, p, col, ty: y(p) })).sort((a, b) => a.ty - b.ty);
    tags.forEach((t, k) => { if (k && t.ty - tags[k - 1].ty < 19) t.ty = tags[k - 1].ty + 19; });
    tags.forEach(({ name, p, col, ty }) => {
      mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), style: `stroke:${col};stroke-width:1.3;stroke-dasharray:6 4` }, svg);
      const g = mk('g', {}, svg); mk('rect', { x: W - m.r + 1, y: ty - 9, width: m.r - 2, height: 18, rx: 4, style: `fill:${col}` }, g);
      const t = mk('text', { x: W - m.r + 4, y: ty + 4, class: 'tag-text' }, g); t.textContent = `${name} ${p.toFixed(2)}`;
    });
    const vmax = Math.max(...all.map((b) => b.v)), vy0 = priceH + volH - 4, bw = Math.max(1.6, step * 0.64);
    mk('line', { x1: m.l, x2: W - m.r, y1: priceH + 4, y2: priceH + 4, class: 'grid' }, svg);
    B.forEach((b, i) => {
      const g = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg);
      mk('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), class: 'wick' }, g);
      const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c));
      mk('rect', { x: x(i) - bw / 2, y: top, width: bw, height: Math.max(1.2, bot - top), class: 'body' }, g);
      const vh = (b.v / vmax) * (volH - 12); mk('rect', { x: x(i) - bw / 2, y: vy0 - vh, width: bw, height: vh, class: 'vol' }, g);
      const tt = mk('title', {}, g); tt.textContent = `${b.t}  O ${f2(b.o)} H ${f2(b.h)} L ${f2(b.l)} C ${f2(b.c)}`;
    });
    if (S.vwap) { const vw = vwapOf(B); const pts = vw.map((v, i) => x(i) + ',' + y(v)); if (pts.length > 1) mk('polyline', { points: pts.join(' '), class: 'vwap-line' }, svg); const t = mk('text', { x: m.l + 6, y: m.t + 10, class: 'vwap-label l10-lg' }, svg); t.textContent = 'VWAP'; }
    (S.lines || []).forEach((L) => {
      const x2i = L.extend ? total - 1 : L.i2;
      mk('line', { x1: x(L.i1), y1: y(L.p1), x2: x(x2i), y2: y(lineAt(L, x2i)), class: 'l12-line ' + (L.cls || '') }, svg);
      [[L.i1, L.p1], [L.i2, L.p2]].forEach(([i, p]) => mk('circle', { cx: x(i), cy: y(p), r: 4.5, class: 'l12-pt ' + (L.cls || '') }, svg));
    });
    (S.pending || []).forEach(([i, p]) => mk('circle', { cx: x(i), cy: y(p), r: 5, class: 'l12-pt' }, svg));
    (S.marks || []).forEach((k) => {
      const yy = k.below ? y(k.p) + 14 : y(k.p) - 7;
      const t = mk('text', { x: x(k.i), y: yy, class: 'l12-mark ' + (k.cls || ''), 'text-anchor': 'middle' }, svg); t.textContent = k.txt;
    });
    if (S.cutLine && n < total) mk('line', { x1: m.l + step * n, x2: m.l + step * n, y1: m.t - 8, y2: priceH + volH, class: 'l10-break' }, svg);
    const every = Math.max(1, Math.round(total / 9));
    all.forEach((b, i) => { if (i % every) return; const t = mk('text', { x: Math.max(x(i), m.l + 18), y: H - 6, class: 'axis', 'text-anchor': 'middle' }, svg); t.textContent = b.t; });
    if (S.onPick) {
      svg.classList.add('l12-pick');
      svg.addEventListener('click', (ev) => {
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const q = pt.matrixTransform(svg.getScreenCTM().inverse());
        const i = Math.max(0, Math.min(n - 1, Math.round((q.x - m.l - step / 2) / step)));
        const price = hi - (q.y - m.t) / (priceH - m.t - 6) * (hi - lo);
        const b = B[i]; const kind = price >= (b.h + b.l) / 2 ? 'H' : 'L';
        S.onPick(i, kind === 'H' ? b.h : b.l, kind);
      });
    }
    box.innerHTML = ''; box.appendChild(svg);
  }

  /* 共用：揀圖來源（練習圖／真實圖） */
  function sourceBar(id) {
    return `<div class="l10-bar"><label>來源 <select data-src="${id}"><option value="sim">練習圖（教學模擬）</option><option value="real">真實圖（Alpaca）</option></select></label>
      <label data-symwrap hidden>股票 <input data-sym value="TSLA" size="6" maxlength="10" aria-label="股票代號"></label>
      <button class="btn small" data-next>下一張 ▶</button><span class="muted" data-srcinfo></span></div>`;
  }

  /* ① Swing 點同市場結構 */
  window.WIDGETS_EXTRA['l12-pivots'] = (el) => {
    const S = { k: 3, labels: true, quiz: false, seed: 1, src: 'sim', real: null, idx: 0, answered: null };
    el.innerHTML = `<div class="l10-w">${sourceBar('pv')}
      <div class="l10-bar"><label>Swing 強度（左右各幾支 K） <select data-k><option>2</option><option selected>3</option><option>5</option></select></label>
      <label><input type="checkbox" data-lab checked> 顯示 HH／HL／LH／LL</label>
      <label><input type="checkbox" data-quiz> 測驗模式（自己判斷結構）</label></div>
      <div class="l12-chart" data-c></div>
      <div class="l12-quiz" data-q hidden>而家嘅結構係？ <button class="btn small" data-a="up">上升</button> <button class="btn small" data-a="down">下降</button> <button class="btn small" data-a="range">橫行／混合</button></div>
      <p class="l10-read" data-o aria-live="polite"></p></div>`;
    const $ = (s) => el.querySelector(s);
    let cur = null;
    const pick = () => {
      if (S.src === 'real' && S.real && S.real.length) { const s = S.real[S.idx % S.real.length]; cur = { bars: s.bars, atr: s.atr, label: `${s.sym} ${s.date}` }; }
      else { const kinds = ['respect', 'break', 'chop', 'respect']; const kd = kinds[S.seed % 4]; cur = kd === 'chop' ? genChop(7000 + S.seed) : genTrend(7000 + S.seed, kd, S.seed % 2 ? 'up' : 'down'); }
    };
    const render = () => {
      const P = pivots(cur.bars, S.k);
      const st = structureOf(P);
      const show = S.labels && (!S.quiz || S.answered);
      draw($('[data-c]'), { bars: cur.bars, scaleAll: true, marks: show ? P.map((x) => ({ i: x.i, p: x.p, txt: x.lab, below: x.t === 'L', cls: x.t === 'H' ? 'h' : 'l' })) : P.map((x) => ({ i: x.i, p: x.p, txt: x.t === 'H' ? '▼' : '▲', below: x.t === 'L', cls: 'dot' })), aria: 'Swing High／Low 示範圖' });
      $('[data-q]').hidden = !S.quiz;
      $('[data-srcinfo]').textContent = cur.label;
      if (S.quiz && !S.answered) { $('[data-o]').textContent = '▼ = Swing High，▲ = Swing Low。睇最後兩個高位同兩個低位，判斷結構。'; return; }
      const res = S.quiz ? (S.answered === st[0] ? '✅ 啱！' : '❌ 再睇吓：') : '';
      $('[data-o]').innerHTML = `${res}<b>${esc(st[1])}</b>。共 ${P.filter((x) => x.t === 'H').length} 個 Swing High、${P.filter((x) => x.t === 'L').length} 個 Swing Low（強度 ${S.k}）。強度越大，點越少、越重要；Day Trade 5 分鐘圖用 2–3 最常見。`;
    };
    const next = async () => {
      S.answered = null;
      if (S.src === 'real') { S.idx++; if (!S.real) return loadReal(); } else S.seed++;
      pick(); render();
    };
    const loadReal = async () => {
      if (!(await hasKeys())) { $('[data-srcinfo]').innerHTML = '未設定 Alpaca 金鑰：<a href="#/settings">去設定</a>（暫時用練習圖）'; S.src = 'sim'; $('[data-src]').value = 'sim'; return; }
      $('[data-srcinfo]').textContent = '下載緊…';
      try { S.real = (await realSessions($('[data-sym]').value || 'TSLA', 90)).slice().reverse(); S.idx = 0; pick(); render(); }
      catch (e) { $('[data-srcinfo]').textContent = String(e.message || e); S.src = 'sim'; $('[data-src]').value = 'sim'; }
    };
    $('[data-src]').addEventListener('change', (e) => { S.src = e.target.value; $('[data-symwrap]').hidden = S.src !== 'real'; S.real = null; if (S.src === 'real') loadReal(); else { pick(); render(); } });
    $('[data-sym]').addEventListener('change', () => { if (S.src === 'real') { S.real = null; loadReal(); } });
    $('[data-next]').addEventListener('click', next);
    $('[data-k]').addEventListener('change', (e) => { S.k = +e.target.value; render(); });
    $('[data-lab]').addEventListener('change', (e) => { S.labels = e.target.checked; render(); });
    $('[data-quiz]').addEventListener('change', (e) => { S.quiz = e.target.checked; S.answered = null; render(); });
    el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { S.answered = b.dataset.a; render(); }));
    pick(); render();
  };

  /* ② 畫斜線練習：撳兩個高位（或者兩個低位），再睇之後走勢 */
  function evalLine(B, L, from, atr) {
    const res = L.kind === 'res', tol = atr * 0.05;
    let j = -1;
    for (let i = from; i < B.length; i++) { const v = lineAt(L, i); if (res ? B[i].h >= v - tol : B[i].l <= v + tol) { j = i; break; } }
    if (j < 0) return { touch: false, text: '之後冇再掂到你條線，即係冇交易機會——呢個都係好常見嘅結果。' };
    let brk = -1;
    for (let i = j; i < Math.min(B.length, j + 8); i++) { const v = lineAt(L, i); if (res ? B[i].c > v + atr * 0.1 : B[i].c < v - atr * 0.1) { brk = i; break; } }
    /* 朋友嗰招：掂線後 3 支 K 內，有一支收返線下（上）面兼係陰（陽）燭先入；Stop 喺掂線嗰段最高（低）位再加少少；Target 2R */
    let e = -1;
    for (let i = j; i < Math.min(B.length - 1, j + 3); i++) { const v = lineAt(L, i); if (res ? B[i].c < v && B[i].c < B[i].o : B[i].c > v && B[i].c > B[i].o) { e = i; break; } }
    let trade = null;
    if (e >= 0) {
      const seg = B.slice(j, e + 1);
      const entry = B[e].c, stop = res ? Math.max(...seg.map((b) => b.h)) + atr * 0.03 : Math.min(...seg.map((b) => b.l)) - atr * 0.03;
      const risk = Math.abs(stop - entry), target = res ? entry - 2 * risk : entry + 2 * risk;
      let R = null, how = '';
      for (let i = e + 1; i < B.length; i++) {
        const hitS = res ? B[i].h >= stop : B[i].l <= stop, hitT = res ? B[i].l <= target : B[i].h >= target;
        if (hitS) { R = -1; how = `${B[i].t} 中 Stop`; break; }
        if (hitT) { R = 2; how = `${B[i].t} 到 Target（2R）`; break; }
      }
      if (R == null) { R = (res ? entry - B[B.length - 1].c : B[B.length - 1].c - entry) / risk; how = '收市平倉'; }
      trade = { e, entry, stop, target, R, how };
    }
    const outcome = brk >= 0 ? 'break' : 'respect';
    return { touch: true, j, brk, outcome, trade };
  }
  window.WIDGETS_EXTRA['l12-trendline'] = (el) => {
    const S = { seed: 0, src: 'sim', real: null, idx: 0, pts: [], line: null, ai: false, revealed: false };
    el.innerHTML = `<div class="l10-w">${sourceBar('tl')}
      <div class="l10-bar"><button class="btn small" data-clear>清除我條線</button><button class="btn small" data-ai>顯示 AI 參考線</button><button class="btn small primary" data-rev>顯示之後走勢</button><span class="muted" data-score></span></div>
      <p class="l12-hint">👆 撳兩支 K：<b>下降趨勢連兩個高位</b>（Lower High），<b>上升趨勢連兩個低位</b>（Higher Low）。撳 K 線上半部 = 揀高位，下半部 = 揀低位（自動吸住，好似 TradingView Magnet）。灰色係未發生嘅時間。</p>
      <div class="l12-chart" data-c></div>
      <div class="l11-out" data-o aria-live="polite"></div></div>`;
    const $ = (s) => el.querySelector(s);
    let cur = null;
    const score = () => { const t = tsGet('l12-tl', { n: 0, ok: 0 }); $('[data-score]').textContent = t.n ? `練咗 ${t.n} 張，畫得啱 ${t.ok} 張` : ''; };
    const pick = () => {
      S.pts = []; S.line = null; S.ai = false; S.revealed = false;
      if (S.src === 'real' && S.real && S.real.length) { const s = S.real[S.idx % S.real.length]; cur = { bars: s.bars, atr: s.atr, cut: 42, label: `${s.sym} ${s.date}（真實 5 分鐘圖）` }; }
      else { const kinds = ['respect', 'break', 'respect', 'chop', 'break', 'respect']; const kd = kinds[S.seed % kinds.length]; cur = kd === 'chop' ? genChop(9100 + S.seed) : genTrend(9100 + S.seed, kd, S.seed % 3 === 2 ? 'up' : 'down'); cur.label = `練習圖 #${S.seed + 1}`; }
    };
    const aiLine = () => autoLine(cur.bars, cur.cut, cur.atr);
    const render = () => {
      const lines = [];
      if (S.line) lines.push(Object.assign({ extend: true, cls: 'me' }, S.line));
      const A = S.ai ? aiLine() : null;
      if (A) lines.push(Object.assign({ extend: true, cls: 'ai' }, A));
      draw($('[data-c]'), { bars: cur.bars, show: S.revealed ? cur.bars.length : cur.cut, lines, pending: S.pts.map((p) => [p.i, p.p]), vwap: true, cutLine: true, aria: '斜線練習圖', onPick: S.revealed ? null : (i, p, kind) => {
        S.pts.push({ i, p, kind }); if (S.pts.length > 2) S.pts = S.pts.slice(-1);
        if (S.pts.length === 2) {
          const [a, b] = S.pts[0].i <= S.pts[1].i ? S.pts : [S.pts[1], S.pts[0]];
          if (a.i === b.i) { S.pts = [b]; }
          else if (a.kind !== b.kind) { S.line = null; S.pts = []; $('[data-o]').innerHTML = '<p class="neg">兩點要同一類：高位連高位（阻力線），或者低位連低位（支持線）。再撳過。</p>'; render(); return; }
          else { S.line = { i1: a.i, p1: a.p, i2: b.i, p2: b.p, kind: a.kind === 'H' ? 'res' : 'sup' }; S.pts = []; check(); }
        }
        render();
      } });
      $('[data-srcinfo]').textContent = cur.label;
      $('[data-ai]').textContent = S.ai ? '收埋 AI 參考線' : '顯示 AI 參考線';
      if (S.ai && !A) $('[data-o]').innerHTML = '<p>🤖 AI 喺呢張圖<b>搵唔到清楚嘅斜線</b>（冇兩個逐步降低嘅高位、或者逐步升高嘅低位，而中間冇 K 線收穿）。<b>冇線就唔好硬畫</b>——呢個都係答案。</p>';
    };
    const check = () => {
      const L = S.line, B = cur.bars; let bad = 0;
      for (let i = L.i1; i < cur.cut; i++) { const v = lineAt(L, i); if (L.kind === 'res' ? B[i].c > v + cur.atr * 0.03 : B[i].c < v - cur.atr * 0.03) bad++; }
      const slope = (L.p2 - L.p1) / (L.i2 - L.i1);
      const msgs = [];
      if (L.kind === 'res' && slope > 0) msgs.push('你連咗兩個<b>越嚟越高</b>嘅高位——呢條係上升通道頂，唔係 Lower High 斜線。');
      if (L.kind === 'sup' && slope < 0) msgs.push('你連咗兩個<b>越嚟越低</b>嘅低位——呢條係下降通道底，唔係 Higher Low 斜線。');
      if (bad) msgs.push(`⚠️ 兩點之間有 ${bad} 支 K <b>收市穿過</b>你條線，條線唔乾淨，可信度低。`);
      if (L.i2 - L.i1 < 5) msgs.push('兩點太近（少過 5 支 K），斜率好易畫錯。');
      $('[data-o]').innerHTML = `<p>你畫咗一條<b>${L.kind === 'res' ? '阻力（連高位）' : '支持（連低位）'}</b>斜線。${msgs.length ? '' : '兩點之間冇 K 線收穿，畫得乾淨 👍'}</p>${msgs.map((m) => `<p>${m}</p>`).join('')}<p class="muted">畫好就撳「顯示之後走勢」。</p>`;
    };
    const reveal = () => {
      if (S.revealed) return;
      S.revealed = true; S.ai = true;
      const A = aiLine();
      const parts = [];
      const judge = (L, who) => {
        const r = evalLine(cur.bars, L, cur.cut, cur.atr);
        if (!r.touch) return `<p><b>${who}：</b>${r.text}</p>`;
        const res = L.kind === 'res';
        let s = `<p><b>${who}：</b>${cur.bars[r.j].t} 掂到條線 → ${r.outcome === 'break' ? `<span class="neg">${cur.bars[r.brk].t} 收市${res ? '突破' : '跌穿'}咗</span>（條線失效，可能轉勢）` : `<span class="pos">守住</span>`}。`;
        if (r.trade) s += `　如果用「掂線 + ${res ? '陰燭收返線下' : '陽燭收返線上'}」入場：${res ? '沽空' : '做多'} ${f2(r.trade.entry)}，Stop ${f2(r.trade.stop)}，Target ${f2(r.trade.target)} → <b class="${r.trade.R > 0 ? 'pos' : 'neg'}">${r.trade.how}（${r.trade.R >= 0 ? '+' : ''}${r.trade.R.toFixed(2)}R）</b>`;
        else s += '　掂線後 3 支 K 內冇確認 K（收返線嘅另一邊），<b>唔入場</b>。';
        return s + '</p>';
      };
      if (S.line) parts.push(judge(S.line, '你條線'));
      else parts.push('<p>你未畫線。下次試吓先畫，再撳顯示。</p>');
      if (A) parts.push(judge(A, 'AI 參考線'));
      else parts.push('<p><b>AI 參考線：</b>呢張圖冇清楚斜線。</p>');
      if (cur.kind) parts.push(`<p class="muted">呢張練習圖嘅設計：${cur.kind === 'respect' ? '第三次掂線守住' : cur.kind === 'break' ? '第三次掂線之後被突破（假設你冇設 Stop 就會蝕大錢）' : '橫行亂波，冇乾淨斜線'}。</p>`);
      const good = S.line && A && Math.abs(S.line.i1 - A.i1) + Math.abs(S.line.i2 - A.i2) <= 4 && S.line.kind === A.kind;
      if (S.line) { const t = tsGet('l12-tl', { n: 0, ok: 0 }); t.n++; if (good || (!A && false)) t.ok++; tsSet('l12-tl', t); }
      if (S.line) parts.push(good ? '<p class="pos">✅ 你揀嘅兩點同 AI 參考線差唔多。</p>' : A ? '<p>你揀嘅點同 AI 唔同——對比一下：AI 只揀「左右各 3 支 K 都冇佢咁高（低）」嘅 Swing 點。</p>' : '');
      $('[data-o]').innerHTML = parts.join('');
      render(); score();
    };
    const loadReal = async () => {
      if (!(await hasKeys())) { $('[data-srcinfo]').innerHTML = '未設定 Alpaca 金鑰：<a href="#/settings">去設定</a>（暫時用練習圖）'; S.src = 'sim'; $('[data-src]').value = 'sim'; return; }
      $('[data-srcinfo]').textContent = '下載緊…';
      try { S.real = (await realSessions($('[data-sym]').value || 'TSLA', 90)).slice().reverse(); S.idx = 0; pick(); render(); $('[data-o]').innerHTML = ''; }
      catch (e) { $('[data-srcinfo]').textContent = String(e.message || e); S.src = 'sim'; $('[data-src]').value = 'sim'; }
    };
    $('[data-src]').addEventListener('change', (e) => { S.src = e.target.value; $('[data-symwrap]').hidden = S.src !== 'real'; S.real = null; if (S.src === 'real') loadReal(); else { pick(); render(); } });
    $('[data-sym]').addEventListener('change', () => { if (S.src === 'real') { S.real = null; loadReal(); } });
    $('[data-next]').addEventListener('click', () => { if (S.src === 'real') S.idx++; else S.seed++; pick(); render(); $('[data-o]').innerHTML = ''; });
    $('[data-clear]').addEventListener('click', () => { if (S.revealed) return; S.line = null; S.pts = []; render(); $('[data-o]').innerHTML = ''; });
    $('[data-ai]').addEventListener('click', () => { S.ai = !S.ai; render(); });
    $('[data-rev]').addEventListener('click', reveal);
    pick(); render(); score();
  };

  /* ③ 真實 Gap 統計 */
  const GROUPS = [
    ['all', '全部 Gap ≥ 3%'], ['up', '向上 Gap'], ['down', '向下 Gap'],
    ['gap3to5', 'Gap 3–5%'], ['gap5to8', 'Gap 5–8%'], ['gap8plus', 'Gap 8% 以上'],
    ['full', '完全跳空（開市已經過咗昨日高／低）'], ['partial', '部分跳空（開市仲喺昨日範圍內）'],
    ['first5with', '首 5 分鐘 K 順 Gap 方向'], ['first5against', '首 5 分鐘 K 逆 Gap 方向'],
    ['hold10', '10:00 價格仲喺開市價嘅 Gap 方向'], ['lose10', '10:00 已經返過開市價另一邊'],
    ['vwap10with', '10:00 喺 VWAP 嘅 Gap 方向'], ['vwap10against', '10:00 喺 VWAP 另一邊'],
    ['rvol5hi', '首 5 分鐘成交 ≥ 平時 3 倍'], ['rvol5lo', '首 5 分鐘成交 < 平時 1.5 倍'],
    ['allThree', '三個訊號全部順方向'], ['allThreeRvol', '三個訊號 + 首 5 分鐘成交 ≥ 3 倍'], ['noneThree', '三個訊號全部逆方向'],
  ];
  window.WIDGETS_EXTRA['l12-gapstats'] = (el) => {
    if (!GAP || !GAP.groups) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    const G = GAP.groups, a = G.all;
    const row = ([k, name]) => { const g = G[k]; if (!g || !g.n) return ''; return `<tr><th scope="row">${esc(name)}</th><td>${g.n}</td><td><div class="l12-stack" role="img" aria-label="延續 ${g.go}%、橫行 ${g.flat}%、回落 ${g.fade}%"><i class="go" style="width:${g.go}%"></i><i class="flat" style="width:${g.flat}%"></i><i class="fade" style="width:${g.fade}%"></i></div><small>${pct(g.go)}／${pct(g.flat)}／${pct(g.fade)}</small></td><td>${pct(g.fill)}</td><td>${pct(g.after10Win)}</td><td class="${g.avgAfter10Atr >= 0 ? 'pos' : 'neg'}">${g.avgAfter10Atr >= 0 ? '+' : ''}${f2(g.avgAfter10Atr)}</td></tr>`; };
    el.innerHTML = `<div class="l11-w">
      <div class="l11-kpis"><div><span>樣本</span><b>${a.n}</b><small>個 Gap ≥ 3% 嘅日子</small></div><div><span>收市延續</span><b class="pos">${pct(a.go)}</b><small>再向 Gap 方向行 ≥ 0.25 ATR</small></div><div><span>橫行</span><b>${pct(a.flat)}</b><small>收市同開市差唔多</small></div><div><span>回落</span><b class="neg">${pct(a.fade)}</b><small>反方向行 ≥ 0.25 ATR</small></div><div><span>當日補 Gap</span><b>${pct(a.fill)}</b><small>掂返昨日收市價</small></div></div>
      <p class="l12-legend"><i class="go"></i> 延續 <i class="flat"></i> 橫行 <i class="fade"></i> 回落</p>
      <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>條件</th><th>次數</th><th>收市結果</th><th>補 Gap</th><th>10:00 順方向入，收市贏</th><th>平均（ATR）</th></tr></thead><tbody>${GROUPS.map(row).join('')}</tbody></table></div>
      <p class="muted">數據：${esc(GAP.source)}，${esc(GAP.from)} 至 ${esc(GAP.to)}，${GAP.universe.length} 隻成交大嘅美股（${esc(GAP.universe.slice(0, 12).join('、'))}…）。「10:00 順方向入」= 10:00 向 Gap 方向買入（或者沽空）揸到收市，未計 Stop 同成本。過去統計唔代表將來。</p></div>`;
  };

  /* ④ Gap 預測練習：睇到 10:00，估收市延續、橫行定回落 */
  function outcomeOf(sc) {
    const B = sc.bars, O = B[0].o, dir = sc.dir, A = sc.atr;
    const fo = (dir * (B[B.length - 1].c - O)) / A;
    const first = B.slice(0, 6), vw = vwapOf(first);
    return {
      out: fo >= 0.25 ? 'go' : fo <= -0.25 ? 'fade' : 'flat', fo,
      fill: dir > 0 ? Math.min(...B.map((b) => b.l)) <= sc.pc : Math.max(...B.map((b) => b.h)) >= sc.pc,
      first5: dir * (B[0].c - O) > 0, hold10: dir * (first[5].c - O) > 0, vwap10: dir * (first[5].c - vw[5]) > 0,
    };
  }
  const OUTN = { go: '延續', flat: '橫行', fade: '回落' };
  window.WIDGETS_EXTRA['l12-gapdrill'] = (el) => {
    const S = { seed: 0, src: 'sim', real: null, idx: 0, ans: null };
    el.innerHTML = `<div class="l10-w">${sourceBar('gd')}
      <div class="l12-gapinfo" data-info></div>
      <div class="l12-chart" data-c></div>
      <div class="l12-quiz">睇到 10:00，你估收市會係？ <button class="btn small" data-a="go">📈 延續</button> <button class="btn small" data-a="flat">➖ 橫行</button> <button class="btn small" data-a="fade">📉 回落</button> <span class="muted" data-score></span></div>
      <div class="l11-out" data-o aria-live="polite"></div></div>`;
    const $ = (s) => el.querySelector(s);
    let cur = null;
    const score = () => { const t = tsGet('l12-gap', { n: 0, ok: 0 }); $('[data-score]').textContent = t.n ? `答咗 ${t.n} 題，啱 ${t.ok} 題（${Math.round((t.ok / t.n) * 100)}%）` : ''; };
    const pick = () => {
      S.ans = null;
      if (S.src === 'real' && S.real && S.real.length) { const s = S.real[S.idx % S.real.length]; cur = Object.assign({}, s, { dir: s.bars[0].o > s.pc ? 1 : -1, label: `${s.sym} ${s.date}` }); }
      else { cur = genGap(5300 + S.seed); cur.label = `練習圖 #${S.seed + 1}`; }
    };
    const render = () => {
      const B = cur.bars, O = B[0].o, g = (O / cur.pc - 1) * 100;
      $('[data-srcinfo]').textContent = cur.label;
      $('[data-info]').innerHTML = `<b>${g > 0 ? '向上' : '向下'} Gap ${g > 0 ? '+' : ''}${g.toFixed(1)}%</b>　昨日收市 ${f2(cur.pc)} → 今日開市 ${f2(O)}　ATR ${f2(cur.atr)}（Gap = ${(Math.abs(O - cur.pc) / cur.atr).toFixed(1)} ATR）`;
      draw($('[data-c]'), { bars: B, show: S.ans ? B.length : 6, vwap: true, cutLine: true, levels: [['PDC', cur.pc, '#64748b'], ['PDH', cur.pdh, '#0ea5e9'], ['PDL', cur.pdl, '#0ea5e9'], ['開市', O, '#8b5cf6']], aria: 'Gap 預測練習圖', scaleAll: !!S.ans });
      el.querySelectorAll('[data-a]').forEach((b) => (b.disabled = !!S.ans));
    };
    const answer = (a) => {
      if (S.ans) return; S.ans = a;
      const r = outcomeOf(cur);
      const t = tsGet('l12-gap', { n: 0, ok: 0 }); t.n++; if (a === r.out) t.ok++; tsSet('l12-gap', t);
      const sig = [r.first5, r.hold10, r.vwap10].filter(Boolean).length;
      const grp = sig === 3 ? 'allThree' : sig === 0 ? 'noneThree' : null;
      const hist = GAP && grp && GAP.groups[grp] ? `歷史數據：三個訊號${sig === 3 ? '全部順方向' : '全部逆方向'}嘅日子，收市延續 ${pct(GAP.groups[grp].go)}、回落 ${pct(GAP.groups[grp].fade)}（${GAP.groups[grp].n} 次）。${sig === 3 ? `但如果 10:00 先追入，收市贏只有 ${pct(GAP.groups[grp].after10Win)}——大部分走勢已經行咗，要等更好嘅入場位。` : '唔好再追 Gap 方向。'}` : '訊號有啲順、有啲逆——呢類日子最難估，真實交易通常唔做。';
      const ck = (v, t) => `<li>${v ? '✅' : '❌'} ${t}</li>`;
      $('[data-o]').innerHTML = `<p>${a === r.out ? '✅ 估啱！' : '❌ 估錯。'}收市結果：<b>${OUTN[r.out]}</b>（收市比開市 ${r.fo >= 0 ? '+' : ''}${r.fo.toFixed(2)} ATR，向 Gap 方向計）${r.fill ? '，當日<b>補咗 Gap</b>' : ''}。</p>
        <p><b>10:00 嘅三個訊號：</b></p><ul class="l12-sig">${ck(r.first5, '首 5 分鐘 K 順 Gap 方向')}${ck(r.hold10, '10:00 價格仲喺開市價嘅 Gap 方向')}${ck(r.vwap10, '10:00 喺 VWAP 嘅 Gap 方向')}</ul>
        <p>${hist}</p>${cur.plan && /trap/.test(cur.plan) ? '<p class="muted">呢張係「陷阱」圖：頭 30 分鐘嘅訊號之後反轉。真實市場都有，所以一定要有 Stop。</p>' : ''}`;
      render(); score();
    };
    const loadReal = async () => {
      if (!(await hasKeys())) { $('[data-srcinfo]').innerHTML = '未設定 Alpaca 金鑰：<a href="#/settings">去設定</a>（暫時用練習圖）'; S.src = 'sim'; $('[data-src]').value = 'sim'; return; }
      $('[data-srcinfo]').textContent = '下載緊（一年 5 分鐘 K，第一次要等一陣）…';
      try {
        const all = await realSessions($('[data-sym]').value || 'TSLA', 365);
        S.real = all.filter((s) => s.pc && Math.abs(s.bars[0].o / s.pc - 1) >= 0.03);
        for (let i = S.real.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [S.real[i], S.real[j]] = [S.real[j], S.real[i]]; }
        if (!S.real.length) { $('[data-srcinfo]').textContent = '呢隻股過去一年冇 Gap ≥ 3% 嘅日子，試吓 NVDA、AMD、COIN、PLTR。'; S.src = 'sim'; $('[data-src]').value = 'sim'; return; }
        S.idx = 0; pick(); render(); $('[data-o]').innerHTML = `<p class="muted">搵到 ${S.real.length} 個 Gap ≥ 3% 嘅真實日子（隨機次序）。</p>`;
      } catch (e) { $('[data-srcinfo]').textContent = String(e.message || e); S.src = 'sim'; $('[data-src]').value = 'sim'; }
    };
    $('[data-src]').addEventListener('change', (e) => { S.src = e.target.value; $('[data-symwrap]').hidden = S.src !== 'real'; S.real = null; if (S.src === 'real') loadReal(); else { pick(); render(); } });
    $('[data-sym]').addEventListener('change', () => { if (S.src === 'real') { S.real = null; loadReal(); } });
    $('[data-next]').addEventListener('click', () => { if (S.src === 'real') S.idx++; else S.seed++; pick(); render(); $('[data-o]').innerHTML = ''; });
    el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.a)));
    pick(); render(); score();
  };

  /* ⑤ 練習紀錄：目標 100 張圖 */
  window.WIDGETS_EXTRA['l12-reps'] = (el) => {
    const TYPES = { trend: '斜線／Lower High', gap: 'Gap 開市', struct: '市場結構', full: '完整一張圖分析', replay: 'TradingView Bar Replay' };
    el.innerHTML = `<div class="l11-w">
      <div class="l10-form"><label>類型 <select data-t>${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>股票／日期 <input data-what maxlength="40" placeholder="例如 NVDA 11/06"></label>
      <label>預測結果 <select data-r><option value="ok">啱</option><option value="half">一半啱</option><option value="bad">錯</option></select></label>
      <label>學到咩（一句） <input data-note maxlength="120" placeholder="例如：第三次掂線之前已經有大成交突破"></label></div>
      <p><button class="btn primary small" data-add>➕ 記低一張</button> <button class="btn small" data-undo>刪除最後一張</button></p>
      <div data-o aria-live="polite"></div></div>`;
    const $ = (s) => el.querySelector(s);
    const show = () => {
      const L = tsGet('l12-reps', []);
      const n = L.length, ok = L.filter((x) => x.r === 'ok').length + L.filter((x) => x.r === 'half').length * 0.5;
      const by = {}; L.forEach((x) => { const b = (by[x.t] = by[x.t] || { n: 0, s: 0 }); b.n++; b.s += x.r === 'ok' ? 1 : x.r === 'half' ? 0.5 : 0; });
      $('[data-o]').innerHTML = `<div class="l11-kpis"><div><span>已練</span><b>${n} / 100</b><small>張圖</small></div><div><span>準確度</span><b>${n ? Math.round((ok / n) * 100) + '%' : '—'}</b><small>啱 = 1，一半 = 0.5</small></div>${Object.entries(by).map(([k, b]) => `<div><span>${esc(TYPES[k] || k)}</span><b>${b.n}</b><small>${Math.round((b.s / b.n) * 100)}% 準</small></div>`).join('')}</div>
        <div class="l12-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, n)}"><i style="width:${Math.min(100, n)}%"></i></div>
        ${n ? `<ul class="l12-log">${L.slice(-8).reverse().map((x) => `<li><b>${esc(x.d)}</b> ${esc(TYPES[x.t] || x.t)}｜${esc(x.what || '—')}｜${x.r === 'ok' ? '✅' : x.r === 'half' ? '🟡' : '❌'} ${esc(x.note || '')}</li>`).join('')}</ul>` : '<p class="muted">未有紀錄。每練一張圖（App 練習、TradingView Replay 或者真實開市）就記低。</p>'}`;
    };
    $('[data-add]').addEventListener('click', () => {
      const L = tsGet('l12-reps', []).slice();
      L.push({ d: new Date().toISOString().slice(0, 10), t: $('[data-t]').value, what: $('[data-what]').value.trim(), r: $('[data-r]').value, note: $('[data-note]').value.trim() });
      tsSet('l12-reps', L.slice(-300)); $('[data-what]').value = ''; $('[data-note]').value = ''; show();
    });
    $('[data-undo]').addEventListener('click', () => { const L = tsGet('l12-reps', []).slice(0, -1); tsSet('l12-reps', L); show(); });
    show();
  };
})();

window.COURSE.push({
  id: 'l12',
  code: 'Level 12',
  title: '睇圖實戰：由 Notes 到真圖',
  subtitle: 'Swing 點同市場結構、斜線點畫、Lower High 沽空、突破同 Retest、水平位反應、Gap 真實數據、開市頭 30 分鐘、K 線同成交量、睇圖流程、100 張圖練習同搵師傅',
  icon: '📐',
  color: '#7c3aed',
  question: '我睇得明 Notes，但打開真圖點解仲係唔知點做？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l12-c1', num: '1', title: '點解睇 Notes 同睇真圖差咁遠？', mins: 6,
  summary: '知道規則係「知識」，喺真圖即時認出嚟係「技術」。技術要靠大量「先估、後揭」嘅練習，再即時對答案。呢個 Level 每一章都有練習圖，可以用真實 Alpaca 數據。',
  keywords: ['Deliberate Practice', 'Screen Time', '睇圖'],
  md: `
:::info 呢個 Level 點嚟
有用戶話：「睇嗰啲 Notes 同真係睇圖差好遠」「AI 冇教真正睇圖嘅技巧」「就算有 Gap，佢都未必真係會再 Break Out，好多時係平或者回落」。**呢三點都啱。** 呢個 Level 就係補呢個缺口：少啲定義，多啲喺真圖上面練。
:::

## 1.1 知識 vs 技術

| | 知識（Notes） | 技術（睇圖） |
|---|---|---|
| 例子 | 「下降趨勢連 Lower High 畫斜線」 | 喺一張亂嘅 5 分鐘圖，**幾秒內**揀到邊兩個高位 |
| 點學 | 睇書、睇 Notes | 練好多張圖，每張即刻對答案 |
| 測試 | 答到問題 | 未知結果之前，講得出計劃 |
| 要幾耐 | 幾日 | 幾百張圖、幾個月 |

好似學游水：睇完游水書都唔識游，要落水。**睇圖都一樣，要練到「睇一眼就見到」。**

## 1.2 「先估、後揭」：唯一有效嘅練法

最常見嘅錯：打開一張**已經行完**嘅圖，話「你睇，呢度明明係 Lower High 啦」。呢個叫**事後孔明**（Hindsight Bias）——你已經知道結果，當然覺得好易。

有效嘅練法（交易教練同 Replay 工具都用呢個方法）：

:::steps 每張圖都跟呢 4 步
1. **遮住未來**：只睇到某一刻（App 用灰色遮住；TradingView 用 Bar Replay）
2. **寫低預測**：畫線、講方向、寫入場／Stop／Target
3. **揭開結果**：睇返之後走勢
4. **對答案、記低**：啱定錯？點解？下一張改進咩
:::

:::coach 呢個 Level 可以做到同做唔到嘅嘢
**做到：**清楚規則、真實統計數字、大量練習圖（練習圖同真實圖都有）、每張即刻對答案、記錄你嘅準確度。

**做唔到：**有經驗嘅人坐喺你隔離，睇住你實盤、即刻話你知「呢下唔好追」。呢樣嘢真係要搵人（第 12 章講點揀）。所以最好嘅組合係：**呢個 Level 打好基本功 + 自己大量練 + 有個信得過嘅人覆盤。**
:::

## 1.3 點用呢個 Level

- 每個練習都有「**練習圖**」（教學模擬，唔使金鑰）同「**真實圖**」（用 ⚙️ 設定入面嘅 Alpaca 金鑰，攞真實 5 分鐘 K 線）兩個來源
- 每做一張，就喺第 12 章嘅**練習紀錄**記低，目標 **100 張**
- 唔好求快：一日 10 張認真練，好過 100 張亂撳

## 1.4 點解 Notes 睇得明，真圖都唔識？三個原因

| 原因 | Notes 入面 | 真圖入面 |
|---|---|---|
| **例子太乾淨** | 一個 Lower High 好明顯，旁邊冇雜訊 | 十幾個細高位，邊個先算？ |
| **已知結局** | 圖畫完先講解，所以每個訊號都「啱」 | 未知結果，同一個形狀可能有三種結局 |
| **冇時間壓力** | 慢慢讀 | 一支 5 分鐘 K 只得 5 分鐘，要即刻決定 |

所以要練嘅唔係「明白」，而係**喺雜訊入面揀出重要嘅點、喺未知結果下作決定、喺有限時間內完成**。

## 1.5 一張圖要練幾耐先算「識」？

可以用三個階段衡量：

| 階段 | 你做到 | 大約練習量 |
|---|---|---|
| 1. 識認 | 畀你一張行完嘅圖，你標得出 Swing 點、斜線、關鍵位 | 20–30 張 |
| 2. 識預備 | 遮住右邊，你寫得出 If-Then 計劃 | 50–80 張 |
| 3. 識執行 | 喺 Replay 逐支播放時，喺正確嗰支 K 做決定 | 100 張以上 |

大部分人停喺第 1 階段就以為自己識咗，所以一開真盤就亂。

:::coach 一日 10 張嘅建議時間分配
- 每張 2 分鐘：畫線 + 寫計劃。
- 揭開 30 秒：對答案。
- 每張 30 秒：喺練習紀錄寫低一句「學到乜」。
合共大約 30 分鐘。持續 10 日，就完成第一個 100 張。
:::

[[quiz:l12-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c2', num: '2', title: 'Swing High、Swing Low 同市場結構', mins: 8,
  summary: '所有畫線都由 Swing 點開始。Swing High = 左右幾支 K 都冇佢咁高；Swing Low 相反。連續兩個高位同低位，就話你知結構係上升（HH + HL）、下降（LH + LL）定橫行。',
  keywords: ['Swing High', 'Swing Low', 'HH', 'HL', 'LH', 'LL', 'Market Structure'],
  md: `
## 2.1 點樣客觀咁搵 Swing 點

好多新手畫線畫唔準，原因係**揀錯點**。用呢個規則就唔會亂：

:::key Swing 點嘅定義
- **Swing High**：呢支 K 嘅高位，比**左邊 k 支同右邊 k 支** K 都高
- **Swing Low**：呢支 K 嘅低位，比左右各 k 支都低
- **k 叫強度**：5 分鐘圖用 2–3；k 越大，點越少、越重要
- ⚠️ 右邊要等 k 支 K 行完先確認。即係話，**Swing 點一定遲幾支 K 先見到**
:::

## 2.2 四個英文字

| 縮寫 | 全寫 | 意思 |
|---|---|---|
| **HH** | Higher High | 新高位比上一個高位高 |
| **HL** | Higher Low | 新低位比上一個低位高 |
| **LH** | Lower High | 新高位比上一個高位低 ← 你朋友講嗰個 |
| **LL** | Lower Low | 新低位比上一個低位低 |

- **上升結構** = HH + HL（買家控制）
- **下降結構** = LH + LL（賣家控制）
- **混合** = 例如 LH + HL（收窄、等突破），或者 HH + LL（亂、擴闊）

## 2.3 試吓

轉吓 Swing 強度，睇吓點樣變。再剔「測驗模式」，自己判斷結構先揭答案。揀「真實圖」就用真實 5 分鐘 K 線：

[[widget:l12-pivots]]

:::tip 結構點樣「轉」
上升結構入面，第一次出現 **Lower High**，係第一個警號；之後再跌穿上一個 **Higher Low**（即係出現 LL），結構先正式轉咗做下降。**一個 LH 唔等於轉勢**，要等埋 LL。
:::

## 2.4 用數字練一次：k = 2 點樣搵 Swing High

10 支 5 分鐘 K 嘅高位：

| K | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| High | 101.0 | 101.6 | **102.3** | 101.9 | 101.4 | 101.8 | **102.0** | 101.5 | 101.2 | 101.9 |

- K3（102.3）：左邊 K1、K2 都低，右邊 K4、K5 都低 → **Swing High**。
- K7（102.0）：左邊 K5、K6 低，右邊 K8、K9 低 → **Swing High**。
- K10（101.9）：右邊未有兩支 K → **未確認**，唔可以當 Swing High。

結論：K3 102.3 → K7 102.0 = **Lower High**。K7 要等到 K9 收市先確認，即係 K7 之後 10 分鐘先知。

## 2.5 結構轉變嘅完整次序

以上升轉下降為例：

:::steps
1. 升勢：HH、HL、HH、HL…
2. **第一個警號**：反彈去唔返上一個高位 → 出現 LH。
3. **轉勢確認**：跌穿最近一個 HL → 出現 LL。
4. **新跌勢**：之後反彈再形成 LH，結構變成 LH + LL。
:::

好多交易者喺第 3 步先改方向，喺第 4 步嘅 LH 先研究沽空 —— 呢個位置有清楚嘅 Stop（LH 上面），而唔係喺第 2 步就估頂。

:::bad 常見錯誤
- 用 k = 1 搵 Swing 點：每兩三支 K 就一個「高位」，結構永遠睇落好亂。5 分鐘圖用 2–3。
- 將盤前嘅高低位同正常時段混埋判斷結構：盤前成交少，高低位唔可靠，結構最好由 09:30 開始數（PMH、PML 另外當價位線用）。
:::

[[quiz:l12-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c3', num: '3', title: '斜線（Trendline）點畫先啱', mins: 9,
  summary: '下降趨勢連 Lower High，上升趨勢連 Higher Low；用 Swing 點、全圖一致用影線或者實體、兩點之間冇 K 線收穿；兩點畫線，第三次掂先係交易機會。',
  keywords: ['Trendline', '斜線', 'Third Touch'],
  md: `
## 3.1 九條規則

| # | 規則 | 點解 |
|---|---|---|
| 1 | **下降趨勢連高位，上升趨勢連低位** | 下降時賣家喺每次反彈高位出貨，所以高位先有意義 |
| 2 | 只用 **Swing 點**（第 2 章） | 隨便揀中間一支 K，條線冇意思 |
| 3 | **影線定實體揀一種，全圖一致** | Day Trade 建議用影線（Wick），因為 Stop 係俾影線掃 |
| 4 | **兩點畫線，第三次掂先係機會** | 兩點只係「假設」，第三次反應先確認 |
| 5 | 兩點之間**冇 K 線收市穿過**條線 | 有收穿 = 條線唔乾淨 |
| 6 | 兩點之間最少隔 **5–6 支 K** | 太近，斜率好易畫錯 |
| 7 | **角度唔好太斜** | 太斜嘅線好快會被突破，係最常見嘅失敗 |
| 8 | 條線係一個**區域**，唔係一個精確價 | 容許少少誤差（例如 ±0.05 ATR） |
| 9 | **冇清楚兩點就唔好畫** | 硬畫出嚟嘅線，市場唔會理 |

:::warn 兩點定三點？
有啲交易者話兩點已經夠；有啲話一定要三點。我哋嘅做法：**兩點畫線，第三次掂線而且有確認 K，先考慮入場**。即係話，第三次掂唔係入場訊號，係「留意」嘅時候。
:::

## 3.2 自己畫

下面張圖只顯示到某一刻（灰色 = 未發生）。撳兩支 K 畫你條線，再撳「顯示之後走勢」。可以對比 **AI 參考線**（AI 只用「左右各 3 支 K」嘅 Swing 點）：

[[widget:l12-trendline]]

:::tip 用 TradingView 畫
Trend Line 工具（快捷鍵 Alt + T）→ 開 **Magnet**，令點吸住 K 線高低位（Level 10 第 9 章）→ 喺線上撳右掣揀 **Extend Right**，條線就會伸去未來。
:::

[[link:c/l10-c9|📖 溫習：Level 10 第 9 章畫價位]]

## 3.3 一步一步畫一條下降斜線

5 分鐘圖，NVDA 由 $186 跌落嚟：

:::steps
1. 開 Swing 點（k = 3），搵最近兩個 **Swing High**：10:05 嘅 $185.60、10:45 嘅 $184.80。
2. 檢查兩點之間隔幾多支 K：10:05 → 10:45 = 8 支 ✔（最少 5–6 支）。
3. 檢查兩點之間有冇 K 線**收市**穿過條線：冇 ✔。
4. 用影線高位連線，Extend Right 伸去右邊。
5. 計斜率：每支 K 低 $0.10（$0.80 ÷ 8）。11:25（再過 8 支 K）條線大約喺 **$184.00**。
6. 等：價格 11:20 反彈到 $183.95 附近 → 呢個就係「第三次掂線」，開始留意 Rejection。
:::

## 3.4 點判斷一條線係咪太斜？

用「每支 K 移動幾多 ATR」量度。5 分鐘 ATR 如果係 $0.40：

| 斜率（每支 K） | 相當於 | 評語 |
|---|---|---|
| $0.04 | 0.1 ATR | 平緩，條線可以持續好耐 |
| $0.10 | 0.25 ATR | 正常 |
| $0.30 | 0.75 ATR | 太斜，通常幾支 K 內就會被突破 |

太斜嘅線代表走勢急，急嘅走勢好難持續；佢被突破唔一定代表轉勢，可能只係走勢由急變慢。

:::tip 斜線同水平位一齊睇
斜線每支 K 都會變價位，水平位唔變。當兩者喺同一個價交匯（例如下降斜線 11:25 去到 $184.00，正好係 PDL），呢個時間點同價位就特別值得留意。
:::

[[quiz:l12-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c4', num: '4', title: '朋友嗰招：喺 Lower High 斜線沽空', mins: 10,
  summary: '下降結構入面，連住之前嘅高位畫一條下降斜線；價格反彈到條線（新嘅 Lower High），出現確認 K 先沽空，Stop 喺高位上面，Target 上一個低位或者 2R。上升結構就反轉用。',
  keywords: ['Lower High', 'Short', '斜線沽空'],
  md: `
## 4.1 張圖講緊咩

用戶朋友畫咗一張圖：**藍色線**連住之前嘅高位，一路向下斜；**紅色**價格每次反彈都去唔返上一個高位（Lower High），而且就快再掂藍線。佢嘅諗法：**「之後喺掂到條線嗰點 Short。」**

呢個係真實存在嘅方法，叫 **Trendline Rejection**（斜線阻力沽空）。但要有規則先用得，唔係見線就沽。

## 4.2 完整 If-Then 計劃

:::card 前提（全部要啱先考慮）
- 結構係**下降**：最少兩個 Lower High + 一個 Lower Low（第 2 章）
- 價格喺 **VWAP 下面**（今日買家冇控制）
- 大市或者板塊**唔係大升**（例如 QQQ 唔係大升緊）
- **唔係開市頭 15 分鐘**：太亂，假突破最多（我哋嘅後備 ORB 紀錄就係咁蝕）
:::

:::steps 入場、Stop、Target
1. **等**：價格反彈到條線附近（±0.05 ATR）
2. **確認**：掂線後 3 支 K 之內，出現一支**陰燭收返線下面**，或者長上影線（Rejection）
3. **入場**：確認 K 收市沽空（進取），或者跌穿確認 K 低位先沽（保守）
4. **Stop**：掂線嗰段最高位上面少少
5. **Target**：上一個 Swing Low，或者 2R；到 1R 可以將 Stop 移返入場價
:::

:::bad 以下情況唔做
- 大成交直接**衝穿**條線（唔係慢慢掂，係一支大陽燭穿過）
- 價格已經企返 **VWAP 上面**
- 已經係**第 4、第 5 次**掂線（掂得越多，條線越弱）
- 有**新聞催化**（例如突然有好消息）
- Cash 戶口（唔可以沽空，Level 11 第 8 章）→ 只可以用上升結構嘅**反轉版**：連 Higher Low，喺支持線做多
:::

## 4.3 練習

同上一章一樣，但今次專心練「第三次掂線點做」。App 會用上面嘅規則幫你計：有冇確認 K、入場、Stop、Target、結果幾多 R：

[[widget:l12-trendline]]

:::coach 誠實講
呢招我哋**未用大量真數據回測**，所以唔知佢嘅真實勝率。練習圖係教學模擬，有守住、有突破、有亂波，比例係我哋設定，唔代表真實市場。真正知道有冇用，要：
1. 用「真實圖」練 50 張以上，喺第 12 章記低結果
2. 用 Paper Trading 做 20 次
3. 計 Expectancy（Level 8）先決定用唔用真錢
:::

## 4.4 用數字行一次完整交易

AMD 5 分鐘圖，11:00。下降斜線連 10:10 $164.80 同 10:40 $164.20 兩個 LH，每支 K 低 $0.10。VWAP $163.90，價格喺下面。ATR(5m) $0.40。

:::steps
1. **前提**：兩個 LH（$164.80、$164.20）+ 一個 LL（$162.90）✔；VWAP 下面 ✔；QQQ 平穩 ✔；唔係開市頭 15 分鐘 ✔。
2. **等**：11:10 條線大約喺 $163.80。價格反彈到 $163.75 ✔（±0.05 ATR = ±$0.02，接近）。
3. **確認**：11:10 嗰支 K 上影線到 $163.85，收 $163.55，係陰燭 ✔。
4. **入場**：保守做法 —— 跌穿確認 K 低位 $163.45 先沽，成交 $163.43。
5. **Stop**：掂線嗰段最高 $163.85 + $0.05 = **$163.90**。風險 = $0.47。
6. **Target**：上一個 Swing Low $162.90（$0.53，約 1.1R）唔夠 2R；改用 2R = $163.43 − $0.94 = **$162.49**，但要留意 $162.90 可能有支持。
7. **管理**：去到 1R（$162.96）將 Stop 移返入場價 $163.43。
:::

呢個例子反映一個現實：**Target 到上一個低位只得 1.1R**，好多時入場前就應該問「值唔值得做」。如果你堅持 2R，就要接受價格可能喺 $162.90 反彈，打和出場。

## 4.5 掂線次數同成功率嘅關係

| 第幾次掂線 | 意思 | 處理 |
|---|---|---|
| 第 2 次 | 條線先成立 | 只係畫線，唔做 |
| 第 3 次 | 第一次「測試」 | 主要機會 |
| 第 4 次 | 賣家喺度守咗好多次，但買家每次都嚟 | 降一級，細注或者唔做 |
| 第 5 次或以上 | 好大機會突破 | 唔做沽空，反而留意突破 |

:::warn 你朋友張圖可能漏咗嘅嘢
淨係一條斜線唔夠。要同時睇：價格喺 VWAP 邊邊、大市方向、係咪有消息。斜線只係其中一個位置參考，同水平位重疊先最有力。
:::

[[quiz:l12-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c5', num: '5', title: '斜線被突破之後：Break、Retest、Second Entry', mins: 8,
  summary: '斜線被突破唔等於即刻轉勢。第一次突破好多時失敗；有成交、收市企穩先算數。突破後回測舊線（Retest）同「第二次訊號」（Second Entry）通常比第一下可靠。',
  keywords: ['Trendline Break', 'Retest', 'Second Entry', 'Wedge'],
  md: `
## 5.1 突破之後有三種劇本

| 劇本 | 點樣 | 點做 |
|---|---|---|
| **假突破** | 穿過條線 1–2 支 K，之後收返原本嗰邊 | 原本嘅方向繼續；啱啱追突破嘅人中 Stop |
| **真突破 + Retest** | 大成交收市穿線，之後回落試返條舊線，守住 | 舊阻力變支持（角色互換），可以喺 Retest 守住時做 |
| **突破後橫行** | 穿過咗但冇力，橫行 | 唔做，等結構清楚 |

## 5.2 Second Entry（第二次訊號）

價格行為交易者 Al Brooks 嘅講法：趨勢線被突破之後，**第一個反轉訊號好多時失敗**；**第二個**同方向訊號通常較可靠。如果第二個都失敗，就假設你睇錯咗市。

:::key 實戰意思
- 下降斜線第一次被突破：**唔好即刻做多**
- 等價格回落（第一次回測），再有第二次向上嘅訊號，先考慮
- 三次推動（三個高位越推越弱）叫 **Wedge（楔形）**，係常見嘅轉勢形態
:::

## 5.3 點分真突破

- **收市**穿過，唔係淨係影線穿
- **成交量**明顯大過之前幾支 K
- 穿過之後**下一支 K 唔即刻返轉頭**
- 穿過嘅位同時係其他重要位（例如 VWAP、PDH）

## 5.4 一個 Second Entry 嘅例子

NVDA 喺下降斜線下面跌咗成朝，11:30 第一次升穿斜線：

| 時間 | 發生咗乜 | 新手反應 | 較好做法 |
|---|---|---|---|
| 11:30 | 陽燭收市穿過斜線 | 即刻做多 | 第一個訊號，先記低 |
| 11:45 | 回落，跌返斜線附近，形成一個高過早上低位嘅低位 | 中 Stop、好嬲 | 留意：呢個係 HL 嘅候選 |
| 12:00 | 再一支陽燭升穿 11:30 嗰個高位 | 唔敢再入 | **Second Entry**：入場，Stop 放 11:45 低位下面 |

第二次訊號較可靠嘅原因：第一次突破時，好多沽空者仲未走、好多人覺得「只係反彈」；回落但冇創新低，證明賣家冇力，第二次升穿時，沽空者要平倉，買家亦更有信心。

## 5.5 突破之後幾時放棄？

| 情況 | 處理 |
|---|---|
| 突破後回測，收市跌返入原本斜線另一邊 | 突破失敗，放棄 |
| Second Entry 都失敗（再跌穿 HL） | 假設你睇錯，當日唔再做呢個方向 |
| 突破後橫行超過 6 支 K（30 分鐘） | 冇動力，放棄或者等新結構 |

:::key 一句記住
斜線被突破代表「原本嘅走勢暫停」，唔代表「反方向開始」。要等新結構（HL 或者 LH）形成，先有新方向。
:::

[[quiz:l12-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c6', num: '6', title: '水平位：價格喺關鍵位點反應', mins: 7,
  summary: '斜線之外，最重要係水平位：PDH、PDL、PDC、PMH、PML、整數位。價格去到呢啲位有四種反應：測試、拒絕、突破、突破後回測。斜線同水平位重疊嘅位置最重要。',
  keywords: ['Support', 'Resistance', 'Role Reversal', 'Confluence'],
  md: `
## 6.1 四種反應

| 反應 | 張圖點睇 | 意思 |
|---|---|---|
| **測試** | 慢慢行近，細 K、成交細 | 未有答案，等 |
| **拒絕（Rejection）** | 長影線刺穿，收返轉頭 | 呢個位有人守 |
| **突破** | 大實體 K 收市穿過，成交大 | 可能開始新一段 |
| **回測（Retest）** | 突破後返嚟試，守住 | 舊阻力變新支持（角色互換） |

## 6.2 最強嘅位置：重疊（Confluence）

**兩樣嘢喺同一個價**，比一樣嘢強好多：

- 下降斜線 + 昨日低位（PDL）
- 上升斜線 + VWAP
- PMH + 整數位（例如 $200）

你朋友張圖，如果藍線同時係昨日收市價，沽空嘅理由就更強。

:::tip 練習方法
每次畫完斜線，再畫埋 PDH、PDL、PDC、PMH、PML（Level 10 第 9 章），睇吓邊度有重疊。重疊嘅地方先值得等。
:::

## 6.3 點樣喺開市前判斷邊個位最重要？

AMD 開市前嘅價位：PDH $166.20、PMH $164.00、整數位 $165.00、PDC $159.30、PML $162.10、PDL $157.80，仲有一條下降斜線預計 10:30 喺 $164.10。

| 價位 | 重疊嘅嘢 | 重要程度 |
|---|---|---|
| $164.00–164.10 | PMH + 斜線（10:30） | ⭐⭐⭐ 最重要 |
| $165.00 | 整數位 | ⭐ |
| $166.20 | PDH | ⭐⭐ |
| $162.10 | PML | ⭐⭐ |

開市後先集中睇 $164.00–164.10：喺度被拒絕 → 研究受阻；收市企穩上面 → 突破，下一個目標 $165.00 同 $166.20。

## 6.4 四種反應嘅時間感

| 反應 | 通常幾耐出結果 |
|---|---|
| 拒絕 | 1–3 支 K（快速刺穿再收返） |
| 突破 | 1 支大 K 收市穿過，下一支唔返轉頭 |
| 回測 | 突破後 2–6 支 K 內回嚟 |
| 測試（未有答案） | 可以拖 30 分鐘以上 |

如果價格喺關鍵位附近磨咗半個鐘都未有結果，通常代表雙方都未有優勢，**等佢離開呢個區域先再判斷**。

:::bad 常見錯誤
價格一掂關鍵位就入場（掂 PMH 就買、掂阻力就沽）。關鍵位只係叫你留神，要等以上四種反應其中一種出現，先知道邊一方贏。
:::

[[quiz:l12-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c7', num: '7', title: 'Gap 真相：數據話你知幾多會延續', mins: 8,
  summary: '用真實 5 分鐘數據計（3,326 個 Gap ≥ 3% 嘅日子）：只有大約 33% 收市繼續向 Gap 方向行，37% 回落，30% 橫行；當日補 Gap 嘅有 21%。即係話「有 Gap 就會 Break Out」唔成立，三分二嘅日子唔會延續。',
  keywords: ['Gap', 'Gap and Go', 'Gap Fade', 'Gap Fill', '統計'],
  md: `
## 7.1 用戶嘅觀察係啱嘅

「就算有個 Gap，佢都未必真係會再 Break Out，好多時候都係平或者回落返。」我哋用真實數據驗證咗：

[[widget:l12-gapstats]]

:::key 點睇呢個表
- **收市結果**：延續／橫行／回落嘅比例（以開市價計，0.25 ATR 為界）
- **補 Gap**：當日有冇掂返昨日收市價
- **10:00 順方向入，收市贏**：如果 10:00 先向 Gap 方向入，揸到收市，幾多次係賺（未計 Stop 同成本）
- **平均（ATR）**：上面嗰個做法平均賺蝕幾多個 ATR
:::

## 7.2 學到咩

1. **只有大約三分一延續**：Gap ≥ 3% 嘅日子，延續只有 33%，回落反而有 37%。所以開市前見到 Gap，**唔可以預早假設佢會繼續升（跌）**
2. **Gap 越大，越少補 Gap**：3–5% 嘅 Gap 當日補返嘅有 26%，8% 以上只有 7%；但 8% 以上嘅回落都有 39%，大 Gap 唔係穩陣
3. **開市後嘅表現比 Gap 本身重要**：比較「三個訊號全部順方向」同「全部逆方向」嗰兩行，差別好大（第 8 章詳細講）
4. **淨係 10:00 跟 Gap 方向入，冇著數**：全部 Gap 計，10:00 入揸到收市，贏嘅只有 49%，平均差唔多 0 ATR
5. **呢個就係點解我哋嘅報告要等觸發**：主計劃等升穿盤前高先入，唔係開市就買

:::warn 限制
呢個統計只用 50 隻成交大嘅美股，同埋過去兩年左右嘅數據；細價股、新聞股嘅行為可能好唔同。過去統計唔代表將來。
:::

## 7.3 「延續、橫行、回落」點樣計？

以 Gap 向上為例，用開市價做基準，0.25 ATR 做界線：

| 結果 | 定義 | 例子（開市 $164.00、ATR $5.80，界線 $1.45） |
|---|---|---|
| 延續 | 收市高過開市價 0.25 ATR 以上 | 收 $165.80（+$1.80） |
| 橫行 | 收市喺開市價 ±0.25 ATR 之內 | 收 $163.20（−$0.80） |
| 回落 | 收市低過開市價 0.25 ATR 以上 | 收 $161.90（−$2.10） |

留意：「回落」係由**開市價**計，唔係由昨收計。一隻高開 3% 嘅股收市只升 1%，以昨收計仲係升咗，但以開市價計就係「回落」—— 開市買入嘅人蝕緊錢。

## 7.4 呢個統計對你嘅實際影響

| 你嘅習慣 | 數據講乜 | 改為 |
|---|---|---|
| 見高開就預設做多 | 只有大約三分一延續 | 等開市後嘅證據（三個訊號、觸發價） |
| 見高開就預設會補缺口 | 3–5% 嘅 Gap 大約四分一當日補 | 唔好假設會補 |
| 大 Gap（8% 以上）開市即追 | 回落比例接近四成 | 至少等開市區間形成 |

:::key 一句記住
Gap 只話你知「今日有事」，唔話你知「今日點走」。方向要由開市後嘅價格行為決定。
:::

[[quiz:l12-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c8', num: '8', title: '開市頭 30 分鐘：點分 Gap & Go、Fade、橫行', mins: 9,
  summary: '開市後睇三個訊號：首 5 分鐘 K、10:00 價格對比開市價、10:00 對比 VWAP。三個都逆，回落機會大，唔好追 Gap 方向。三個都順，當日收市延續嘅機會高好多，但大部分升幅喺 10:00 前已經行咗：10:00 先追入，平均幾乎冇著數。所以訊號係用嚟「過濾」，唔係入場訊號。',
  keywords: ['Gap and Go', 'Gap Fade', 'VWAP', 'Opening Range'],
  md: `
## 8.1 三個訊號

| # | 訊號（以 Gap 向上為例） | 點睇 |
|---|---|---|
| 1 | **首 5 分鐘 K 係陽燭** | 09:30–09:35 收市高過開市價 |
| 2 | **10:00 仲高過開市價** | 頭 30 分鐘冇跌返開市價下面 |
| 3 | **10:00 喺 VWAP 上面** | 今日入場嘅人平均都賺緊 |

Gap 向下就反轉睇（陰燭、低過開市價、喺 VWAP 下面）。

## 8.2 真實數據

| 情況 | 次數 | 收市延續（由開市計） | 回落 | 10:00 先入，收市贏 | 10:00 先入，平均 |
|---|---|---|---|---|---|
| 三個訊號全部順方向 | 790 | 64% | 11% | 50% | +0.01 ATR |
| 三個 + 首 5 分鐘成交 ≥ 3 倍 | 220 | 78% | 6% | 54% | +0.11 ATR |
| 三個訊號全部逆方向 | 1,009 | 10% | 65% | 46% | -0.01 ATR |
| 全部 Gap（參考） | 3,326 | 33% | 37% | 49% | 0.00 ATR |

:::warn 呢個表最重要嘅一課
「三個訊號全順，收市延續 64%」聽落好勁，但**大部分升幅喺 10:00 之前已經行咗**（訊號本身就係量度開市到 10:00 嘅走勢）。如果你 **10:00 先追入**，揸到收市只係贏 50%，平均 +0.01 ATR，即係差唔多冇著數，仲未計成本。只有加埋「首 5 分鐘成交 ≥ 3 倍」，先見到少少優勢（平均 +0.11 ATR、220 次），樣本仲細。
:::

:::coach 點用
- 三個都逆 → **唔好再追 Gap 方向**（延續只有 10%）
- 有順有逆 → **唔做**。呢類日子最難估
- 三個都順 → 只係話你知「今日呢隻股值得睇」，**唔係入場訊號**。仲要等更好嘅位置：例如回調到 VWAP／EMA 9 守住再向上，或者突破開市區間高位，同埋一定要有 Stop
- 呢啲數字未計 Stop、成本同滑價，亦都未測試過「回調入場」。想用真錢之前，要自己用 Paper Trading 驗證
:::

## 8.3 點解唔好 09:30 即刻入

開市頭幾分鐘最亂：隔夜嘅單、開市競價、止蝕單一齊湧入。好多交易教學都提醒：09:30 一開即刻追，好多時正正買喺 Fade 之前。我哋嘅後備 5 分鐘 ORB 紀錄（6 日約 −8R）都證明咗開市頭 15 分鐘好易被掃 Stop。

[[check:l12-open]]

## 8.4 用三個訊號判斷：一個例子

AMD 高開 +3%，開市價 $164.00：

| 訊號 | 實際 | 順／逆 |
|---|---|---|
| 首 5 分鐘 K | 開 $164.00 收 $164.80 → 陽燭 | 順 |
| 10:00 vs 開市價 | $165.30 > $164.00 | 順 |
| 10:00 vs VWAP | $165.30 > $164.70 | 順 |
| 首 5 分鐘成交 | 平時 3.4 倍 | 加分 |

三個訊號全順 + 成交 ≥ 3 倍 → 屬於數據入面最好嗰組（收市延續約 78%）。但記住：大部分升幅已經喺 10:00 前發生。**而家唔係追，而係等**：回調到 VWAP（$164.70）或者 EMA 9 守住再升，先入場；Stop 放回調低位下面。

## 8.5 有順有逆嘅日子點樣？

例子：陽燭開市（順），但 10:00 已經跌返開市價下面（逆），仲喺 VWAP 下面（逆）。

呢類日子買家同賣家都未贏，數據顯示結果好分散。最好嘅做法係**唔做呢隻股**，將注意力放去三個訊號一致嘅股票。一日入面通常有好幾隻候選股，冇必要喺最亂嗰隻度搵機會。

:::warn 樣本限制
「三個訊號 + 成交 ≥ 3 倍」得 220 次樣本，平均 +0.11 ATR 仲未扣成本（大約要扣 0.02–0.05 ATR）。呢個係「值得研究」，唔係「已經證明賺錢」。
:::

[[quiz:l12-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c9', num: '9', title: 'Gap 預測練習：睇到 10:00，估收市', mins: 12,
  summary: '只睇到 10:00（頭 6 支 5 分鐘 K），估收市係延續、橫行定回落，再揭答案。隨便估大約 33% 啱；目標係練到穩定高過 50%，而且識認「唔好做」嘅日子。',
  keywords: ['Gap 練習', 'Replay'],
  md: `
## 9.1 點練

1. 睇 Gap 大細、PDC（昨收）、PDH／PDL、開市價、VWAP
2. 數吓三個訊號（第 8 章）
3. 揀「延續／橫行／回落」
4. 揭開，睇返之後走勢同當日有冇補 Gap

[[widget:l12-gapdrill]]

:::tip 用真實圖
揀「真實圖」，輸入波動大嘅股（例如 NVDA、AMD、TSLA、COIN、PLTR），App 會搵過去一年 Gap ≥ 3% 嘅日子，隨機出題。第一次要下載一年 5 分鐘 K 線，要等一陣；之後存喺部機。
:::

:::key 目標
- 隨便估：大約 33% 啱
- 練 50 題之後：目標 **50% 以上**
- 更重要：認得「三個訊號有順有逆」嘅日子，**呢啲日子真實交易唔做**
:::

## 9.2 一題示範：點樣諗

題目：NVDA 高開 +4.2%（Gap ÷ ATR = 0.9），PDC $180.00、開市 $187.56、PDH $184.20。10:00 時價格 $186.90，VWAP $187.30，首 5 分鐘係陰燭。

:::steps
1. **三個訊號**：首 5 分鐘陰燭（逆）、10:00 低過開市價（逆）、10:00 喺 VWAP 下面（逆）→ 三個全逆。
2. **數據**：三個全逆嘅日子，延續只有約 10%，回落約 65%。
3. **位置**：下面 PDH $184.20 係第一個支持；再下面 PDC $180 係補缺口目標。
4. **答案**：揀「回落」。信心中等：PDH 可能有支持，收市可能喺 $184–186。
:::

揭開之後，唔好淨係睇啱定錯，仲要睇：當日有冇去到 PDH？有冇補缺口？下晝有冇反彈？呢啲細節會令你下次判斷更準。

## 9.3 練習紀錄要分類

| 類型 | 你嘅準確率 | 說明 |
|---|---|---|
| 三個全順 | ? | 應該最高 |
| 三個全逆 | ? | 應該第二高 |
| 有順有逆 | ? | 通常接近亂估，真實交易唔做 |

做 50 題之後計一次。如果「全順」同「全逆」都超過 60%，而「有順有逆」接近 33%，代表你已經識用呢三個訊號。

[[quiz:l12-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c10', num: '10', title: 'K 線同成交量：喺關鍵位先有意思', mins: 7,
  summary: '一支 Pin Bar 喺半空冇意思，喺斜線或者 PDH 先有意思。確認 K 要喺關鍵位出現；突破要有成交，回調要成交細。',
  keywords: ['Rejection Wick', 'Engulfing', 'Volume'],
  md: `
## 10.1 喺關鍵位要認嘅 K 線

| K 線 | 樣 | 喺阻力位（斜線／PDH）代表 |
|---|---|---|
| **長上影線**（Rejection） | 上面一條長影，實體細 | 買家推上去，被賣家打返落嚟 |
| **陰燭吞噬**（Bearish Engulfing） | 陰燭實體包住上一支陽燭 | 賣家接管 |
| **Inside Bar 跌穿** | 一支細 K 喺上一支範圍內，之後跌穿低位 | 猶豫完向下 |
| **大陽燭收市穿線** | 實體大、收近高位 | ⚠️ 唔係沽空訊號，係突破 |

## 10.2 成交量規則

- **突破**要有大成交：冇成交嘅突破好多時係假
- **回調**要成交細：價格回落但成交少，代表賣家唔積極（趨勢健康）
- **掂線時大成交但收唔穿**：可能係大量買家被困，之後跌得更快
- **開市頭 5 分鐘成交**：比平時大 3 倍以上，代表今日真係多人關注（第 7 章數據）

:::warn 唔好單睇一支 K
一支 K 只係一個線索。要配合：結構（第 2 章）＋ 位置（第 3、6 章）＋ 成交量。三樣都啱先係訊號。
:::

## 10.3 同一支 K，喺唔同位置意思唔同

一支長上影線（上影線佔成支 K 六成，實體細）：

| 出現位置 | 意思 | 處理 |
|---|---|---|
| PDH 或者下降斜線 | 阻力有人守 | 留意受阻，等跌穿呢支 K 低位 |
| 區間中間，冇任何價位 | 冇特別意思 | 忽略 |
| 升勢中、VWAP 上面、離阻力好遠 | 可能只係短暫獲利回吐 | 唔好因為一支 K 就估頂 |
| 開市第一支 K | 開市競價後嘅震盪 | 參考價值低 |

## 10.4 成交量四個情境嘅數字例子

平時一支 5 分鐘 K 成交約 20 萬股：

| 情境 | 成交量 | 解讀 |
|---|---|---|
| 突破 PDH 嘅大陽燭 | 60 萬（3 倍） | 突破有人參與，較可信 |
| 突破 PDH 嘅陽燭 | 18 萬（0.9 倍） | 冇特別多人參與，小心假突破 |
| 突破後回調三支陰燭 | 12 萬、9 萬、8 萬 | 回調冇人急住沽，健康 |
| 掂斜線嘅長上影線 | 55 萬，但收唔穿 | 大量買家喺高位被困，之後可能跌得快 |

:::tip 點樣快速判斷「大」
喺 Volume 開 MA 20：柱高過平均線 2 倍或以上就算明顯放大。開市頭 30 分鐘本身就大，最好用同時段 RVOL 比較。
:::

[[quiz:l12-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c11', num: '11', title: '一張圖由零開始：睇圖流程', mins: 8,
  summary: '每張圖都用同一個次序睇：日線方向 → 15 分鐘結構 → 水平位 → 斜線 → VWAP／EMA 9 → 寫 If-Then → 等觸發。用固定流程，就唔會「見到乜都想做」。',
  keywords: ['Top-down', '多時間框架', '流程'],
  md: `
## 11.1 七步流程

:::steps 開市前同開市後都用
1. **日線**：大方向（20、50 日線上定下）？今日 Gap 喺邊個位置？
2. **15 分鐘**：結構係 HH/HL、LH/LL 定橫行？
3. **水平位**：畫 PDH、PDL、PDC、PMH、PML、整數位
4. **斜線**：有冇清楚嘅兩個 Swing 點？冇就唔畫
5. **5 分鐘**：價格喺 VWAP、EMA 9 邊邊？
6. **寫 If-Then**：「如果 X，就 Y；Stop Z；Target W」，同埋「咩情況唔做」
7. **等觸發**：冇觸發就冇交易
:::

:::key 多時間框架點分工
- **15 分鐘**畫重要斜線同水平位（比 5 分鐘可靠）
- **5 分鐘**等確認 K 同入場
- **1 分鐘**只用嚟微調 Stop（新手可以唔睇）
:::

[[check:l12-process]]

## 11.2 例子：用今日報告練

打開今日選股報告，揀一隻 pick，跟上面 7 步自己睇一次，再對比報告寫嘅計劃。開市後用真實圖睇返結果，記低喺第 12 章。

[[link:picks|📋 打開今日選股]]

## 11.3 用流程行一次：AMD 開市前 5 分鐘

| 步 | 做咩 | 例子結果 |
|---|---|---|
| 1 日線 | 睇均線同 Gap 位置 | 50 日線上面，跳空 +2.6% 去到 20 日高附近 |
| 2 15 分鐘 | 睇結構 | 昨日尾市 HH + HL，盤前喺 $162.10–164.00 窄幅 |
| 3 水平位 | 畫線 | PDH 166.20、PMH 164.00、PDC 159.30、PML 162.10 |
| 4 斜線 | 有冇兩個清楚 Swing 點 | 冇 → 唔畫 |
| 5 5 分鐘 | VWAP、EMA 9 | 開市後先睇 |
| 6 If-Then | 寫計劃 | 「升穿 PMH 164.00 並收市企穩，回測守住入場；Stop 163.60；Target 166.20。跌穿 PML 162.10 就唔做多。」 |
| 7 等 | — | 冇觸發 = 冇交易 |

整個流程熟咗之後，每隻股 3–5 分鐘就做得完。

## 11.4 If-Then 點樣寫先清楚？

一個好嘅 If-Then 要有五樣嘢：

1. **觸發**：咩價、咩 K 線條件（例如「5 分鐘收市企穩 $164.00 上面」）。
2. **入場**：用咩單、咩價（例如「回測守住後，升穿陽燭高位用 Stop 單入」）。
3. **Stop**：一個價（例如 $163.60），唔係「睇情況」。
4. **Target**：一個或兩個價。
5. **唔做條件**：例如「QQQ 跌超過 0.5%」「09:45 之前」「跌穿 PML」。

:::bad 唔清楚嘅寫法
「如果強就買」「睇吓 VWAP 點」—— 開市時你會發現自己乜都做唔到決定。寫唔出具體數字，代表你未準備好。
:::

[[quiz:l12-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l12-c12', num: '12', title: '點樣練到識：100 張圖、Replay、日誌、搵師傅', mins: 10,
  summary: '目標 100 張「先估、後揭」嘅圖，每張記低。用 TradingView Bar Replay 練真實歷史，每星期覆盤錯得最多嗰類。最好再搵一個有真實紀錄、肯講風險嘅人或者群組幫你覆盤；小心賣課騙局。',
  keywords: ['練習', 'Bar Replay', '日誌', 'Mentor'],
  md: `
## 12.1 練習紀錄

每練一張（App 練習、TradingView Replay、或者真實開市睇圖），就喺呢度記低：

[[widget:l12-reps]]

## 12.2 一個星期嘅練習表

| 日子 | 練咩 | 份量 |
|---|---|---|
| 一、三、五 | 斜線練習（第 3、4 章），真實圖 | 10 張 |
| 二、四 | Gap 預測（第 9 章），真實圖 | 10 題 |
| 開市日 | 用報告嘅 pick 跟第 11 章流程睇，開市後對答案 | 1–2 隻 |
| 星期六 | 睇返紀錄，搵錯得最多嗰類，重溫相關章節 | 30 分鐘 |

:::tip TradingView Bar Replay
揀一隻股、揀一日，用 Replay 由 09:30 一支一支 K 播，播之前先畫線同寫計劃。免費版有限制（Level 10 第 12 章）。
:::

[[link:c/l10-c12|📖 溫習：Level 10 第 12 章 Bar Replay]]

## 12.3 搵師傅：揀人嘅標準

用戶講得啱：Day Trade 好多技巧網上冇齊。有經驗嘅人覆盤，可以快好多。但呢個行業好多人賣課多過真係識做。

:::good 值得信嘅人通常會
- 公開**真實交易紀錄**（包括蝕錢嗰啲），唔係淨係曬贏
- 每次都講 **Stop 同風險**，教你細注
- 教你**自己判斷**，唔係叫你跟單
- 收費清楚、合理，唔會催你「今日報名先有優惠」
:::

:::bad 紅旗（Level 11 第 10 章）
- 保證回報、「月賺 30%」
- 叫你加入喊單群組、跟佢買細價股
- 要你俾帳戶密碼或者幫你操作
- 淨係曬豪車、曬單日大賺
:::

[[link:c/l11-c10|📖 溫習：Level 11 第 10 章騙局]]

:::coach 最後
睇圖係練出嚟嘅，冇捷徑。做完 100 張圖，再睇返第 1 張，你會見到自己進步咗幾多。到時再配合報告同 Paper Trading，先考慮真錢。
:::

[[check:l12-grad]]

[[quiz:l12-final]]

## 12.4 練習紀錄要睇邊幾個數

做到 30、60、100 張時，各檢討一次：

| 數字 | 計法 | 目標 |
|---|---|---|
| 結構判斷準確率 | 啱 ÷ 總數 | 由 50% 升到 70% 以上 |
| 斜線「第三次掂線」有確認 K 嘅比例 | — | 知道大約幾多次會出現機會 |
| Gap 預測準確率 | 啱 ÷ 總數 | 隨便估約 33%；目標 50% 以上 |
| 每張用嘅時間 | 平均分鐘 | 由 5 分鐘縮到 2 分鐘 |
| 最常錯嘅類型 | 分類 | 每次檢討改一樣 |

準確率冇進步，通常係因為練習時偷睇右邊，或者冇記低錯嘅原因。

## 12.5 搵師傅之前，可以先做嘅事

就算暫時冇人覆盤，都可以：

- **錄低自己**：開市時用螢幕錄影，收市後睇返自己喺邊一刻猶豫、邊一刻衝動。
- **同朋友交換紀錄**：互相睇對方 10 張圖嘅 If-Then，問「點解唔做」「點解做」。
- **用報告做對照**：每日報告嘅計劃同你自己嘅計劃比較，唔同嘅地方就係學習機會（報告都會錯，但佢有固定規則）。

:::key 練習嘅終點
當你可以喺 Replay 入面，未睇結果就寫出清楚嘅 If-Then，而且大約一半時間跟到計劃發展，你就準備好進入 Setup 單元，將最熟嘅情境寫成規則。
:::

[[link:level/l13|➡️ 下一課：Level 13 落盤效率]]

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l12-c1': { title: '小測：知識 vs 技術', questions: [
  { q: '最有效嘅睇圖練習方法係？', options: ['睇已經行完嘅圖，搵啱嘅位', '遮住未來，先寫預測，再揭開對答案', '睇多啲 Notes'], answer: 1, explain: '先估後揭，避免事後孔明。' },
  { q: '「Hindsight Bias」係咩？', options: ['知道結果之後，覺得一早睇得出', '睇太多圖', '用錯時間框架'], answer: 0, explain: '所以練習一定要遮住未來。' },
  { q: '呢個 Level 做唔到嘅係？', options: ['俾練習圖', '對答案', '有經驗嘅人即時睇住你實盤'], answer: 2, explain: '呢樣要搵人（第 12 章）。' },
]},
'l12-c2': { title: '小測：市場結構', questions: [
  { q: '下降結構係？', options: ['HH + HL', 'LH + LL', 'HH + LL'], answer: 1, explain: 'Lower High + Lower Low。' },
  { q: 'Swing 強度 k = 3 嘅 Swing High 要等幾支 K 先確認？', options: ['即刻', '右邊 3 支 K 行完', '10 支'], answer: 1, explain: '右邊 k 支 K 都要冇佢咁高。' },
  { q: '上升結構第一次出現 Lower High，代表？', options: ['已經轉勢', '第一個警號，要等跌穿 Higher Low 先確認', '冇意思'], answer: 1, explain: '一個 LH 唔等於轉勢。' },
]},
'l12-c3': { title: '小測：畫斜線', questions: [
  { q: '下降趨勢嘅斜線連邊啲點？', options: ['低位', '高位（Lower High）', '收市價'], answer: 1, explain: '上升趨勢先連低位。' },
  { q: '兩點之間有 K 線收市穿過條線，代表？', options: ['條線更強', '條線唔乾淨，可信度低', '冇影響'], answer: 1, explain: '有效斜線中間唔應該有收穿。' },
  { q: '第三次掂線應該？', options: ['即刻入場', '留意，等確認 K 先考慮', '唔理'], answer: 1, explain: '第三次掂係「留意」，確認先入。' },
]},
'l12-c4': { title: '小測：Lower High 沽空', questions: [
  { q: '以下邊個唔係前提？', options: ['下降結構', '價格喺 VWAP 下面', '開市頭 5 分鐘'], answer: 2, explain: '開市頭 15 分鐘太亂，唔做。' },
  { q: '掂線後點先入？', options: ['一掂就沽', '3 支 K 內有陰燭收返線下或者長上影線', '等收市'], answer: 1, explain: '要確認 K。' },
  { q: '一支大陽燭大成交衝穿條線，應該？', options: ['沽空', '唔沽，條線可能已經失效', '加注'], answer: 1, explain: '衝穿 = 突破，唔係阻力。' },
]},
'l12-c5': { title: '小測：突破同 Retest', questions: [
  { q: '下降斜線第一次被突破，應該？', options: ['即刻做多', '等回測同第二次訊號', '加注沽空'], answer: 1, explain: '第一次反轉訊號好多時失敗。' },
  { q: '真突破通常有？', options: ['只係影線穿過', '收市穿過 + 成交大', '成交細'], answer: 1, explain: '收市同成交係關鍵。' },
  { q: '三次推動、越推越弱嘅形態叫？', options: ['Wedge（楔形）', 'Flag', 'Gap'], answer: 0, explain: '常見轉勢形態。' },
]},
'l12-c6': { title: '小測：水平位', questions: [
  { q: '長影線刺穿 PDH 之後收返落嚟，叫？', options: ['突破', '拒絕（Rejection）', '回測'], answer: 1, explain: '有人守呢個位。' },
  { q: '最強嘅位置通常係？', options: ['單一條線', '兩樣嘢重疊（例如斜線 + PDL）', '圖中間'], answer: 1, explain: 'Confluence。' },
  { q: '突破後返嚟試舊阻力而守住，代表？', options: ['舊阻力變新支持', '假突破', '冇意思'], answer: 0, explain: '角色互換。' },
]},
'l12-c7': { title: '小測：Gap 數據', questions: [
  { q: '根據統計，Gap ≥ 3% 嘅日子收市繼續向 Gap 方向行嘅比例大約係？', options: ['九成', '33%', '一成'], answer: 1, explain: '只有大約三分一延續。' },
  { q: '所以見到盤前 Gap，應該？', options: ['開市即刻追', '等開市後確認先做', '一定做反方向'], answer: 1, explain: '開市後表現比 Gap 本身重要。' },
  { q: '呢個統計嘅限制係？', options: ['冇限制', '只用 50 隻大型股同近兩年數據，過去唔代表將來', '用咗假數據'], answer: 1, explain: '細價股可能好唔同。' },
]},
'l12-c8': { title: '小測：開市頭 30 分鐘', questions: [
  { q: 'Gap 向上，以下邊個係「順方向」訊號？', options: ['首 5 分鐘陰燭', '10:00 喺 VWAP 上面', '10:00 低過開市價'], answer: 1, explain: '另外兩個係逆方向。' },
  { q: '三個訊號有順有逆，應該？', options: ['加大注碼', '唔做', '隨便揀'], answer: 1, explain: '最難估嘅日子。' },
  { q: '點解唔好 09:30 即刻追？', options: ['開市最亂，好易買喺 Fade 之前', '交易所唔俾', '冇成交'], answer: 0, explain: 'ORB 紀錄都證明咗。' },
  { q: '三個訊號全順，10:00 先追入揸到收市，數據顯示？', options: ['平均大賺', '平均差唔多冇著數，因為大部分走勢已經行咗', '一定蝕'], answer: 1, explain: '訊號係過濾用，要等更好嘅入場位。' },
]},
'l12-c9': { title: '小測：Gap 練習', questions: [
  { q: '三個選擇隨便估，大約幾多 % 啱？', options: ['10%', '33%', '80%'], answer: 1, explain: '三選一。' },
  { q: '練習嘅目標係？', options: ['100% 估啱', '穩定高過 50%，同埋認得唔好做嘅日子', '做最多題'], answer: 1, explain: '認得唔做嘅日子都好重要。' },
  { q: 'PDC 喺 Gap 圖入面代表？', options: ['昨日收市價，補 Gap 嘅位置', '今日高位', 'VWAP'], answer: 0, explain: '掂返 PDC = 補 Gap。' },
]},
'l12-c10': { title: '小測：K 線同成交量', questions: [
  { q: 'Pin Bar 喺邊度先有意思？', options: ['任何地方', '關鍵位（斜線、PDH、VWAP）', '開市前'], answer: 1, explain: '位置最重要。' },
  { q: '健康趨勢嘅回調，成交通常係？', options: ['好大', '細', '冇所謂'], answer: 1, explain: '賣家唔積極。' },
  { q: '喺阻力位見到大陽燭收市穿線，係？', options: ['沽空訊號', '突破訊號，唔好沽', '冇意思'], answer: 1, explain: '收市穿過 = 突破。' },
]},
'l12-c11': { title: '小測：睇圖流程', questions: [
  { q: '流程第一步係？', options: ['5 分鐘入場', '睇日線大方向', '畫斜線'], answer: 1, explain: '由大到細。' },
  { q: '重要斜線同水平位最好喺邊個時間框架畫？', options: ['1 分鐘', '15 分鐘', '月線'], answer: 1, explain: '15 分鐘比 5 分鐘可靠。' },
  { q: '搵唔到清楚嘅 Swing 點畫斜線，應該？', options: ['硬畫', '唔畫，用水平位或者唔做', '用 1 分鐘圖搵'], answer: 1, explain: '冇線就唔好硬畫。' },
]},
'l12-final': { title: 'Level 12 總測驗', questions: [
  { q: '下降結構入面，價格第三次反彈到下降斜線，出現長上影線兼陰燭收返線下，價格喺 VWAP 下面。合理做法？', options: ['做多', '考慮沽空，Stop 喺高位上面，Target 上一個低位或者 2R', '唔理'], answer: 1, explain: '前提、位置、確認全部齊。' },
  { q: '盤前 Gap +6%，開市首 5 分鐘陰燭，10:00 已經低過開市價同 VWAP。根據數據？', options: ['一定會延續', '三個訊號全部逆方向，唔好追升', '加注做多'], answer: 1, explain: '呢類日子回落機會大。' },
  { q: '下降斜線被一支大陽燭收市突破，第一下應該？', options: ['即刻做多', '等回測同第二次訊號', '沽空'], answer: 1, explain: 'Second Entry。' },
  { q: '睇圖練習最重要嘅原則？', options: ['睇已經行完嘅圖', '先估、後揭、記低', '睇得越快越好'], answer: 1, explain: '避免事後孔明。' },
  { q: '揀師傅時，最大紅旗係？', options: ['公開蝕錢紀錄', '保證月賺 30%、叫你跟單買細價股', '教你計 Stop'], answer: 1, explain: 'Level 11 第 10 章。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l12-open': { title: 'Gap 日開市頭 30 分鐘檢查', items: [
  '09:30–09:35：唔落單，淨係睇',
  '首 5 分鐘 K 順唔順 Gap 方向？',
  '10:00 價格仲喺開市價嘅 Gap 方向？',
  '10:00 喺 VWAP 邊邊？',
  '首 5 分鐘成交係唔係平時 3 倍以上？',
  '三個訊號全順 → 等回調或者突破開市區間先考慮；有順有逆 → 唔做',
  '寫低 Stop 先落單',
]},
'l12-process': { title: '一張圖由零開始', items: [
  '日線：20、50 日線上定下？',
  '15 分鐘：HH/HL、LH/LL 定橫行？',
  '畫 PDH、PDL、PDC、PMH、PML、整數位',
  '有冇清楚兩個 Swing 點畫斜線？冇就唔畫',
  '5 分鐘：價格喺 VWAP、EMA 9 邊邊？',
  '寫 If-Then：入場、Stop、Target、唔做嘅情況',
  '等觸發，冇觸發就冇交易',
]},
'l12-grad': { title: 'Level 12 完成檢查', items: [
  '用 Swing 強度 2–3 搵到 Swing High／Low，講得出結構',
  '識跟 9 條規則畫斜線，知道兩點同三點嘅分別',
  '講得出 Lower High 沽空嘅前提、確認、Stop、Target 同唔做嘅情況',
  '知道斜線第一次被突破唔好即刻反手',
  '知道 Gap ≥ 3% 只有大約三分一延續，同埋開市三個訊號點用（過濾，唔係入場訊號）',
  'Gap 預測練習做咗 50 題以上',
  '斜線練習用真實圖做咗 30 張以上',
  '練習紀錄累積 100 張圖',
]},
});

window.GLOSSARY.push(
  { term: 'Market Structure', zh: '市場結構', def: '用連續 Swing High 同 Swing Low 判斷趨勢：上升、下降或者橫行。', lv: 'l12' },
  { term: 'Swing Strength', zh: 'Swing 強度', def: '確認 Swing 點用嘅 K 線數：左右各 k 支都冇佢咁高（低）。5 分鐘圖常用 2–3。', lv: 'l12' },
  { term: 'Trendline', zh: '斜線／趨勢線', def: '下降趨勢連 Lower High、上升趨勢連 Higher Low 嘅斜線，用嚟搵反彈阻力或者回調支持。', lv: 'l12' },
  { term: 'Third Touch', zh: '第三次掂線', def: '兩點畫線之後，價格第三次去到條線。係「留意」嘅時候，要有確認 K 先考慮入場。', lv: 'l12' },
  { term: 'Trendline Rejection', zh: '斜線阻力反應', def: '價格掂到斜線之後被打返轉頭（例如長影線、陰燭收返線下），係斜線沽空（或者做多）嘅確認。', lv: 'l12' },
  { term: 'Trendline Break', zh: '斜線突破', def: '價格收市穿過斜線，通常配合大成交。第一次突破好多時失敗，要等回測或者第二次訊號。', lv: 'l12' },
  { term: 'Second Entry', zh: '第二次訊號', def: 'Al Brooks 嘅概念：趨勢線被突破後，第一個反轉訊號常失敗，第二個同方向訊號較可靠。', lv: 'l12' },
  { term: 'Wedge', zh: '楔形', def: '三次推動、每次越推越弱嘅形態，常見於轉勢之前。', lv: 'l12' },
  { term: 'Gap Fade', zh: '跳空回落', def: 'Gap 之後價格向反方向行（向上 Gap 之後跌返落嚟），可能一路補 Gap。', lv: 'l12' },
  { term: 'Full Gap / Partial Gap', zh: '完全／部分跳空', def: '完全跳空：開市價已經超過昨日高位（或者低過昨日低位）；部分跳空：開市價仲喺昨日範圍入面。', lv: 'l12' },
  { term: 'Confluence', zh: '重疊位', def: '兩樣或以上重要價位喺同一個位置（例如斜線 + PDL），通常比單一價位更重要。', lv: 'l12' },
  { term: 'Hindsight Bias', zh: '事後孔明', def: '知道結果之後，覺得一早睇得出。練習要遮住未來，先估後揭。', lv: 'l12' },
);
