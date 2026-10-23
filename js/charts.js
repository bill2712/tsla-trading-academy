/* =========================================================
 * Charts：簡單 SVG K 線圖、折線圖、柱狀圖
 * 全部教學圖表都係「模擬數據」，唔係真實 TSLA 行情
 * ========================================================= */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (n, d = 2) => (n == null || isNaN(n) ? '—' : Number(n).toFixed(d));

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* 由一串收市價生成 OHLC（有種子，所以每次一樣） */
  function genBars(closes, opts = {}) {
    const rnd = mulberry32(opts.seed || 7);
    const wick = opts.wick || 0.35;
    const start = opts.start || '09:30';
    let [hh, mm] = start.split(':').map(Number);
    const out = [];
    let prev = opts.open != null ? opts.open : closes[0] - 0.2;
    closes.forEach((c, i) => {
      const o = i === 0 ? prev : prev + (rnd() - 0.5) * 0.08;
      const h = Math.max(o, c) + rnd() * wick;
      const l = Math.min(o, c) - rnd() * wick;
      const v = Math.round((opts.baseVol || 0.8) * (0.6 + rnd() * 0.8) * 100) / 100;
      out.push({ t: String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v });
      prev = c;
      mm += opts.step || 5; while (mm >= 60) { mm -= 60; hh++; }
    });
    return out;
  }

  /* 逐支 K 線計 Session VWAP */
  function vwapOf(bars) {
    let pv = 0, vv = 0;
    return bars.map((b) => { const tp = (b.h + b.l + b.c) / 3; pv += tp * (b.v || 1); vv += (b.v || 1); return pv / vv; });
  }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------------- K 線圖 ---------------- */
  function candles(container, cfg) {
    const bars = cfg.bars || [];
    const visible = cfg.visible != null ? cfg.visible : bars.length;
    const slots = cfg.slots || bars.length;
    const W = 800;
    const priceH = cfg.height || 300;
    const volH = cfg.showVolume === false ? 0 : 70;
    const H = priceH + volH + 26;
    const m = { l: 8, r: 70, t: 14 };
    const plotW = W - m.l - m.r;
    const step = plotW / Math.max(slots, 1);

    let lo = Infinity, hi = -Infinity;
    bars.forEach((b) => { lo = Math.min(lo, b.l); hi = Math.max(hi, b.h); });
    (cfg.zones || []).forEach((z) => { lo = Math.min(lo, z.lo); hi = Math.max(hi, z.hi); });
    (cfg.lines || []).forEach((ln) => { if (cfg.fitLines === false && !ln.fit) return; lo = Math.min(lo, ln.y); hi = Math.max(hi, ln.y); });
    if (cfg.yMin != null) lo = Math.min(lo, cfg.yMin);
    if (cfg.yMax != null) hi = Math.max(hi, cfg.yMax);
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    const y = (p) => m.t + (hi - p) / (hi - lo) * (priceH - m.t - 6);
    const x = (i) => m.l + step * i + step / 2;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': cfg.title || 'K 線圖' });

    // grid
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const p = lo + (hi - lo) * i / ticks;
      el('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg);
      const t = el('text', { x: W - m.r + 6, y: y(p) + 4, class: 'axis' }, svg); t.textContent = '$' + fmt(p);
    }

    // zones
    (cfg.zones || []).forEach((z) => {
      el('rect', { x: m.l, width: plotW, y: y(z.hi), height: Math.max(2, y(z.lo) - y(z.hi)), style: `fill:${z.color || 'var(--zone)'};opacity:${z.opacity || 0.18}` }, svg);
      if (z.label) { const t = el('text', { x: m.l + 6, y: y(z.hi) - 4, class: 'zone-label', style: `fill:${z.color || 'var(--zone-text)'}` }, svg); t.textContent = z.label; }
    });

    // highlight column
    if (cfg.highlight != null && cfg.highlight < visible) {
      el('rect', { x: m.l + step * cfg.highlight, y: m.t - 6, width: step, height: priceH + volH - m.t, class: 'hl-col' }, svg);
    }

    // lines
    (cfg.lines || []).forEach((ln) => {
      if (ln.y > hi || ln.y < lo) {
        const up = ln.y > hi, yy = up ? m.t + 4 : priceH - 10;
        const t = el('text', { x: m.l + 4, y: yy, class: 'axis', style: `fill:${ln.color || 'var(--muted)'}` }, svg); t.textContent = (up ? '↑ ' : '↓ ') + (ln.label || fmt(ln.y));
        return;
      }
      el('line', { x1: m.l, x2: W - m.r, y1: y(ln.y), y2: y(ln.y), style: `stroke:${ln.color || 'var(--muted)'};stroke-width:1.6;stroke-dasharray:${ln.dash === false ? '' : '6 4'}` }, svg);
      const g = el('g', {}, svg);
      el('rect', { x: W - m.r + 1, y: y(ln.y) - 9, width: m.r - 2, height: 18, rx: 4, style: `fill:${ln.color || 'var(--muted)'}` }, g);
      const t = el('text', { x: W - m.r + 5, y: y(ln.y) + 4, class: 'tag-text' }, g); t.textContent = ln.label || fmt(ln.y);
    });

    // vwap
    const vw = cfg.vwap === true ? vwapOf(bars) : cfg.vwap;
    if (vw && vw.length) {
      const pts = [];
      for (let i = 0; i < Math.min(visible, vw.length); i++) if (vw[i] != null) pts.push(x(i) + ',' + y(vw[i]));
      if (pts.length > 1) el('polyline', { points: pts.join(' '), class: 'vwap-line' }, svg);
      if (pts.length) {
        const last = Math.min(visible, vw.length) - 1;
        const t = el('text', { x: x(last) + 6, y: y(vw[last]) + 14, class: 'vwap-label' }, svg); t.textContent = 'VWAP';
      }
    }

    // volume pane
    let vmax = 0; bars.forEach((b) => (vmax = Math.max(vmax, b.v || 0)));
    const vy0 = priceH + volH - 4;
    if (volH) {
      el('line', { x1: m.l, x2: W - m.r, y1: priceH + 4, y2: priceH + 4, class: 'grid' }, svg);
      const t = el('text', { x: W - m.r + 6, y: priceH + 20, class: 'axis' }, svg); t.textContent = 'Volume';
      if (cfg.avgVol) {
        const ay = vy0 - (cfg.avgVol / vmax) * (volH - 12);
        el('line', { x1: m.l, x2: W - m.r, y1: ay, y2: ay, style: 'stroke:var(--muted);stroke-dasharray:3 3' }, svg);
        const t2 = el('text', { x: W - m.r + 6, y: ay + 4, class: 'axis' }, svg); t2.textContent = '同時段平均';
      }
    }

    // candles
    for (let i = 0; i < Math.min(visible, bars.length); i++) {
      const b = bars[i];
      const up = b.c >= b.o;
      const cls = b.color ? '' : up ? 'up' : 'down';
      const style = b.color ? `fill:${b.color};stroke:${b.color}` : null;
      const g = el('g', { class: 'candle ' + cls, style }, svg);
      el('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), class: 'wick', style: b.color ? `stroke:${b.color}` : null }, g);
      const bw = Math.max(3, step * 0.62);
      const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c));
      el('rect', { x: x(i) - bw / 2, y: top, width: bw, height: Math.max(1.5, bot - top), class: 'body', rx: 1 }, g);
      if (volH && b.v) {
        const vh = (b.v / vmax) * (volH - 12);
        el('rect', { x: x(i) - bw / 2, y: vy0 - vh, width: bw, height: vh, class: 'vol', rx: 1 }, g);
      }
      const hit = el('rect', { x: m.l + step * i, y: m.t, width: step, height: priceH + volH - m.t, style: 'fill:transparent;stroke:none' }, g);
      const tt = el('title', {}, hit);
      tt.textContent = `${b.t || ''}  O ${fmt(b.o)}  H ${fmt(b.h)}  L ${fmt(b.l)}  C ${fmt(b.c)}${b.v ? '  Vol ' + b.v + 'M' : ''}`;
    }

    // marks
    (cfg.marks || []).forEach((mk) => {
      if (mk.i >= visible) return;
      const b = bars[mk.i]; if (!b) return;
      const above = mk.pos !== 'below';
      const yy = above ? y(b.h) - 10 : y(b.l) + 18;
      const t = el('text', { x: x(mk.i), y: yy, class: 'mark', 'text-anchor': 'middle', style: mk.color ? `fill:${mk.color}` : null }, svg);
      t.textContent = mk.text;
    });

    // time labels
    const every = cfg.labelEvery || Math.max(1, Math.ceil(slots / 8));
    for (let i = 0; i < bars.length; i += every) {
      if (!bars[i].t) continue;
      const t = el('text', { x: x(i), y: H - 6, class: 'axis', 'text-anchor': 'middle' }, svg); t.textContent = bars[i].t;
    }

    container.innerHTML = '';
    const fig = document.createElement('figure');
    fig.className = 'chart';
    if (cfg.title) { const h = document.createElement('div'); h.className = 'chart-title'; h.textContent = cfg.title; fig.appendChild(h); }
    fig.appendChild(svg);
    if (cfg.caption) { const c = document.createElement('figcaption'); c.textContent = cfg.caption; fig.appendChild(c); }
    container.appendChild(fig);
    return { svg, y, x };
  }

  /* ---------------- 折線圖 ---------------- */
  function line(container, cfg) {
    const W = 800, H = cfg.height || 260;
    const m = { l: 64, r: 16, t: 16, b: 28 };
    const series = cfg.series || [];
    let lo = Infinity, hi = -Infinity, n = 0;
    series.forEach((s) => { n = Math.max(n, s.data.length); s.data.forEach((v) => { if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); });
    if (cfg.ref != null) { lo = Math.min(lo, cfg.ref); hi = Math.max(hi, cfg.ref); }
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const x = (i) => m.l + (W - m.l - m.r) * (n <= 1 ? 0 : i / (n - 1));
    const y = (v) => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
    const f = cfg.format || ((v) => fmt(v, 0));
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': cfg.title || '折線圖' });
    for (let i = 0; i <= 4; i++) {
      const v = lo + (hi - lo) * i / 4;
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'grid' }, svg);
      const t = el('text', { x: m.l - 6, y: y(v) + 4, class: 'axis', 'text-anchor': 'end' }, svg); t.textContent = f(v);
    }
    if (cfg.ref != null) el('line', { x1: m.l, x2: W - m.r, y1: y(cfg.ref), y2: y(cfg.ref), style: 'stroke:var(--muted);stroke-dasharray:5 4' }, svg);
    const labelEvery = Math.max(1, Math.ceil(n / 10));
    for (let i = 0; i < n; i += labelEvery) {
      const t = el('text', { x: x(i), y: H - 8, class: 'axis', 'text-anchor': 'middle' }, svg);
      t.textContent = cfg.labels ? cfg.labels[i] : i;
    }
    series.forEach((s) => {
      const pts = s.data.map((v, i) => (v == null ? null : x(i) + ',' + y(v))).filter(Boolean);
      el('polyline', { points: pts.join(' '), style: `fill:none;stroke:${s.color || 'var(--accent)'};stroke-width:${s.width || 2.2};opacity:${s.opacity || 1}` }, svg);
      if (s.dots) s.data.forEach((v, i) => { if (v != null) { const c = el('circle', { cx: x(i), cy: y(v), r: 3.5, style: `fill:${s.color || 'var(--accent)'}` }, svg); const tt = el('title', {}, c); tt.textContent = (cfg.labels ? cfg.labels[i] : i) + '：' + f(v); } });
    });
    container.innerHTML = '';
    const fig = document.createElement('figure'); fig.className = 'chart';
    if (cfg.title) { const h = document.createElement('div'); h.className = 'chart-title'; h.textContent = cfg.title; fig.appendChild(h); }
    fig.appendChild(svg);
    if (cfg.caption) { const c = document.createElement('figcaption'); c.textContent = cfg.caption; fig.appendChild(c); }
    container.appendChild(fig);
  }

  /* ---------------- 柱狀圖 ---------------- */
  function bars(container, cfg) {
    const W = 800, H = cfg.height || 240;
    const m = { l: 16, r: 16, t: 26, b: 34 };
    const vals = cfg.values;
    const max = Math.max(...vals, cfg.max || 0) || 1;
    const bw = (W - m.l - m.r) / vals.length;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': cfg.title || '柱狀圖' });
    vals.forEach((v, i) => {
      const h = (v / max) * (H - m.t - m.b);
      const xx = m.l + i * bw + bw * 0.15;
      el('rect', { x: xx, y: H - m.b - h, width: bw * 0.7, height: Math.max(1, h), rx: 4, style: `fill:${(cfg.colors && cfg.colors[i]) || cfg.color || 'var(--accent)'}` }, svg);
      const t = el('text', { x: xx + bw * 0.35, y: H - m.b - h - 6, 'text-anchor': 'middle', class: 'bar-val' }, svg); t.textContent = (cfg.format || ((q) => q))(v);
      const l = el('text', { x: xx + bw * 0.35, y: H - 10, 'text-anchor': 'middle', class: 'axis' }, svg); l.textContent = cfg.labels[i];
    });
    container.innerHTML = '';
    const fig = document.createElement('figure'); fig.className = 'chart';
    if (cfg.title) { const h = document.createElement('div'); h.className = 'chart-title'; h.textContent = cfg.title; fig.appendChild(h); }
    fig.appendChild(svg);
    if (cfg.caption) { const c = document.createElement('figcaption'); c.textContent = cfg.caption; fig.appendChild(c); }
    container.appendChild(fig);
  }

  /* ---------------- R:R 梯形圖 ---------------- */
  function rrLadder(container, { entry, stop, target, side = 'long', title }) {
    const risk = Math.abs(entry - stop), reward = Math.abs(target - entry);
    const rr = risk > 0 ? reward / risk : 0;
    const total = risk + reward || 1;
    const rewardPct = (reward / total) * 100, riskPct = (risk / total) * 100;
    const isLong = side === 'long';
    container.innerHTML = `
      <figure class="chart rr-ladder">
        ${title ? `<div class="chart-title">${title}</div>` : ''}
        <div class="rr-box">
          <div class="rr-row tgt"><span>Target</span><b>$${fmt(target)}</b><em>+${fmt(rr)}R</em></div>
          <div class="rr-zone reward" style="flex:${isLong ? rewardPct : riskPct}">${isLong ? `潛在盈利：每股 +$${fmt(reward)}` : `預定風險：每股 −$${fmt(risk)}`}</div>
          <div class="rr-row ent"><span>Entry</span><b>$${fmt(entry)}</b><em>${isLong ? '等待觸發' : 'Short 入場'}</em></div>
          <div class="rr-zone risk" style="flex:${isLong ? riskPct : rewardPct}">${isLong ? `預定風險：每股 −$${fmt(risk)}` : `潛在盈利：每股 +$${fmt(reward)}`}</div>
          <div class="rr-row stp"><span>Stop</span><b>$${fmt(stop)}</b><em>${isLong ? '假設失效位' : ''}</em></div>
        </div>
        <figcaption>Reward / Risk = ${fmt(reward)} ÷ ${fmt(risk)} = <b>${fmt(rr)} : 1</b></figcaption>
      </figure>`;
    if (!isLong) {
      // Short：Stop 喺上面
      const box = container.querySelector('.rr-box');
      box.innerHTML = `
        <div class="rr-row stp"><span>Stop</span><b>$${fmt(stop)}</b><em>假設失效位</em></div>
        <div class="rr-zone risk" style="flex:${riskPct}">預定風險：每股 −$${fmt(risk)}</div>
        <div class="rr-row ent"><span>Entry</span><b>$${fmt(entry)}</b><em>Short 入場</em></div>
        <div class="rr-zone reward" style="flex:${rewardPct}">潛在盈利：每股 +$${fmt(reward)}</div>
        <div class="rr-row tgt"><span>Target</span><b>$${fmt(target)}</b><em>+${fmt(rr)}R</em></div>`;
    }
  }

  /* ---------------- 課程內嘅示意圖 ---------------- */
  const UP = 'var(--up)', DOWN = 'var(--down)';
  const named = {
    'l3-breakout': () => {
      const pre = genBars([383.2, 383.9, 384.6, 383.8, 383.1, 384.2, 384.9, 384.1, 383.6, 384.5], { seed: 3, open: 383.0, start: '09:00', wick: 0.3 });
      const key = [
        { t: '09:50', o: 384.40, h: 385.65, l: 384.25, c: 385.50, v: 1.6 },
        { t: '09:55', o: 385.48, h: 385.80, l: 385.12, c: 385.34, v: 0.75 },
        { t: '10:00', o: 385.34, h: 386.05, l: 385.18, c: 385.95, v: 1.1 },
      ];
      const post = genBars([386.5, 387.2, 387.0, 387.9, 388.6], { seed: 9, open: 385.96, start: '10:05', wick: 0.3, baseVol: 1.0 });
      const all = pre.concat(key, post);
      return { bars: all, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance Zone $384.80–$385.20' }], vwap: true, avgVol: 0.8,
        marks: [{ i: 10, text: '① 突破' }, { i: 11, text: '② 回測', pos: 'below' }, { i: 12, text: '③ 確認' }],
        caption: '示意：區間橫行 → 突破 → 回測 → 再次向上。所有數字為教學模擬。', title: 'Setup A：Breakout + Retest' };
    },
    'l3-range': () => {
      const closes = [384.6, 383.9, 383.0, 381.9, 381.0, 380.4, 381.2, 382.5, 383.8, 384.7, 384.2, 383.1, 382.0, 381.0, 380.3];
      const b = genBars(closes, { seed: 5, open: 384.9, start: '10:00', wick: 0.35 });
      b.push({ t: '11:15', o: 380.12, h: 380.30, l: 379.55, c: 380.05, v: 1.3 });
      b.push({ t: '11:20', o: 380.04, h: 380.88, l: 379.98, c: 380.78, v: 1.5 });
      b.push({ t: '11:25', o: 380.76, h: 380.90, l: 380.35, c: 380.68, v: 0.8 });
      b.push({ t: '11:30', o: 380.70, h: 381.60, l: 380.62, c: 381.45, v: 1.1 });
      return { bars: b, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance $385', color: 'var(--down)' }, { lo: 379.8, hi: 380.2, label: 'Support $380', color: 'var(--up)' }],
        lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }],
        marks: [{ i: 15, text: 'Hammer', pos: 'below' }, { i: 16, text: '大綠燭' }, { i: 17, text: 'HL', pos: 'below' }],
        caption: '區間上落：價格去到下方支持後嘗試反彈。留意上方 VWAP 係第一個障礙。', title: 'Setup B：Range Support Reversal' };
    },
    'bull-trap': () => {
      const pre = genBars([382.4, 383.1, 383.9, 384.4, 383.7, 384.3], { seed: 11, open: 382.0, start: '10:00' });
      pre.push({ t: '10:30', o: 384.50, h: 386.20, l: 384.40, c: 384.60, v: 1.9 });
      pre.push({ t: '10:35', o: 384.60, h: 385.10, l: 384.10, c: 384.25, v: 1.1 });
      pre.push({ t: '10:40', o: 384.25, h: 384.35, l: 383.70, c: 383.90, v: 1.2 });
      const post = genBars([383.1, 382.4, 381.6, 381.0], { seed: 12, open: 383.9, start: '10:45' });
      return { bars: pre.concat(post), zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance Zone' }], lines: [{ y: 380.6, label: 'Support 380.6', color: 'var(--up)' }, { y: 385.3, label: 'VWAP 385.3', color: 'var(--vwap)' }],
        marks: [{ i: 6, text: '長上影' }, { i: 7, text: 'LH' }, { i: 8, text: '跌穿', pos: 'below' }], caption: 'Bull Trap：突破後收返落區間，反彈又企唔返上去。', title: 'Setup C：Failed Breakout（Bull Trap）' };
    },
    'bear-trap': () => {
      const pre = genBars([382.0, 381.3, 380.7, 380.4, 381.0, 380.5], { seed: 21, open: 382.4, start: '10:00' });
      pre.push({ t: '10:30', o: 380.30, h: 380.55, l: 378.70, c: 380.40, v: 1.9 });
      pre.push({ t: '10:35', o: 380.40, h: 380.95, l: 380.25, c: 380.80, v: 1.2 });
      pre.push({ t: '10:40', o: 380.80, h: 380.90, l: 380.20, c: 380.45, v: 0.8 });
      const post = genBars([381.2, 381.9, 382.4, 383.1], { seed: 22, open: 380.45, start: '10:45' });
      return { bars: pre.concat(post), zones: [{ lo: 379.8, hi: 380.2, label: 'Support Zone', color: 'var(--up)' }], vwap: true,
        marks: [{ i: 6, text: '跌穿後收復', pos: 'below' }, { i: 8, text: 'HL', pos: 'below' }], caption: 'Bear Trap：跌穿支持但無法維持，重新收復之後形成 Higher Low。', title: 'Failed Breakdown Reclaim（Bear Trap）' };
    },
    'trend-day': () => {
      const c = []; let p = 380; const r = mulberry32(31);
      for (let i = 0; i < 30; i++) { p += 0.35 + (r() - 0.5) * 1.1 - (i % 6 === 5 ? 0.9 : 0); c.push(p); }
      return { bars: genBars(c, { seed: 31, open: 380 }), vwap: true, showVolume: false, height: 200, title: 'A. Trending Day', caption: '持續 HH + HL，價格大部分時間企喺 VWAP 上面。' };
    },
    'range-day': () => {
      const c = []; const r = mulberry32(41);
      for (let i = 0; i < 30; i++) c.push(382.5 + Math.sin(i / 3.2) * 2.1 + (r() - 0.5) * 0.6);
      return { bars: genBars(c, { seed: 41, open: 382.5 }), vwap: true, showVolume: false, height: 200, zones: [{ lo: 384.4, hi: 384.9, label: '阻力' }, { lo: 380.1, hi: 380.6, label: '支持', color: 'var(--up)' }], title: 'B. Range Day', caption: '價格喺明顯支持同阻力之間上落。' };
    },
    'chop-day': () => {
      const c = []; const r = mulberry32(51);
      for (let i = 0; i < 30; i++) c.push(382.5 + (r() - 0.5) * 2.4);
      return { bars: genBars(c, { seed: 51, open: 382.5, wick: 0.7 }), vwap: true, showVolume: false, height: 200, title: 'C. Choppy Day', caption: 'K 線反覆穿越 VWAP，冇清晰結構 —— 初學者最好觀察唔落單。' };
    },
    'trailing': () => {
      const c = [385.2, 385.9, 385.5, 386.6, 387.2, 386.7, 387.9, 388.5, 387.9, 389.2, 389.8, 389.1, 390.3];
      const b = genBars(c, { seed: 61, open: 384.9, start: '10:00' });
      return { bars: b, showVolume: false, height: 260,
        lines: [{ y: 384.0, label: '初始 Stop', color: 'var(--down)' }, { y: 385.3, label: 'Stop ②', color: 'var(--warn)' }, { y: 386.5, label: 'Stop ③', color: 'var(--warn)' }, { y: 387.7, label: 'Stop ④', color: 'var(--up)' }],
        marks: [{ i: 2, text: 'HL', pos: 'below' }, { i: 5, text: 'HL', pos: 'below' }, { i: 8, text: 'HL', pos: 'below' }],
        title: 'Structure Trailing Stop', caption: '每當新 Higher Low 確認，先將 Stop 移到結構下方；唔係跟住每支 K 線亂移。' };
    },
    'l4-day': () => {
      const pre = genBars([383.6, 384.2, 383.4], { seed: 71, open: 383.2, start: '09:30', baseVol: 1.4 });
      const key = [
        { t: '09:45', o: 384.35, h: 385.75, l: 384.20, c: 385.55, v: 1.8 },
        { t: '09:50', o: 385.55, h: 385.80, l: 385.05, c: 385.35, v: 0.8 },
        { t: '09:55', o: 385.34, h: 386.05, l: 385.12, c: 385.95, v: 1.2 },
        { t: '10:00', o: 385.95, h: 386.40, l: 385.80, c: 386.25, v: 1.3 },
        { t: '10:05', o: 386.25, h: 387.05, l: 386.10, c: 387.00, v: 1.1 },
        { t: '10:10', o: 387.00, h: 387.55, l: 386.85, c: 387.50, v: 1.0 },
      ];
      return { bars: pre.concat(key), vwap: true, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance Zone' }],
        lines: [{ y: 386.10, label: 'Entry 386.10', color: 'var(--accent)' }, { y: 384.70, label: 'Stop 384.70', color: 'var(--down)' }, { y: 388.90, label: 'Target 388.90', color: 'var(--up)' }],
        marks: [{ i: 3, text: '突破' }, { i: 4, text: '回測', pos: 'below' }, { i: 5, text: '確認' }, { i: 6, text: '觸發' }, { i: 8, text: '+1R' }],
        title: 'Level 4：TSLA 模擬交易日', caption: '虛構交易日：由開市到 +1R。之後兩種可能結局見 14.10。' };
    },
  };

  window.Charts = { candles, line, bars, rrLadder, genBars, vwapOf, named, mulberry32, fmt };
})();
