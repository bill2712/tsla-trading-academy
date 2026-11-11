/* Level 14：常用 Setup 實戰 —— 點入、點出（示意圖、真實統計、辨認練習） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const C = window.Charts;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => v != null && e.setAttribute(k, v)); if (parent) parent.appendChild(e); return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = (v) => (v == null || !isFinite(v) ? '—' : v.toFixed(2));
  const pad = (n) => String(n).padStart(2, '0');
  const hmOf = (i) => { const m = 570 + i * 5; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  const tsGet = (k, d) => { try { const u = Store.user(); return (u && u.toolState && u.toolState[k]) || d; } catch (e) { return d; } };
  const tsSet = (k, v) => { try { const u = Store.user(); if (!u) return; u.toolState = u.toolState || {}; u.toolState[k] = v; Store.save(); } catch (e) {} };

  /* 真實 Setup 統計（scripts/research/setup-stats.mjs 用 Alpaca 5 分鐘 K 線計，只係統計數字） */
  const STATS = {"from":"2024-01-01","to":"2026-11-06","universe":["TSLA","NVDA","AAPL","AMD","META","AMZN","MSFT","GOOGL","AVGO","NFLX","PLTR","COIN","MU","SMCI","MSTR","HOOD","ARM","INTC","ORCL","CRM","ADBE","SHOP","UBER","ABNB","SNOW","CRWD","PANW","NET","DDOG","MRVL","QCOM","LRCX","AMAT","ROKU","PYPL","RIVN","SOFI","AFRM","UPST","BABA","PDD","DIS","BA","NKE","SBUX","LLY","UNH","CVNA","DKNG","RBLX"],"source":"Alpaca SIP 5 分鐘 K 線（正常交易時段）","daysAll":34868,"daysInPlay":7519,"rules":{"inPlay":"Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍","exit":"Target 2R；同一支 K 掂 Stop 同 Target 當 Stop；冇到就收市平倉","cost":"avgRCost = 平均 R 減 0.05R（大約嘅佣金同滑價）","qqq":"入場訊號嗰刻 QQQ 喺自己嘅 VWAP 同方向（做多：QQQ 喺 VWAP 上面）"},"setups":{"orb15":{"name":"15 分鐘 ORB","all":{"n":5396,"win":46.5,"target":9.5,"stop":32.9,"avgR":0.03,"avgRCost":-0.02},"long":{"n":2713,"win":47.1,"target":9.7,"stop":32.5,"avgR":0.04,"avgRCost":-0.01},"short":{"n":2683,"win":45.8,"target":9.3,"stop":33.3,"avgR":0.01,"avgRCost":-0.04},"qqqWith":{"n":3845,"win":47.4,"target":9.3,"stop":31.8,"avgR":0.04,"avgRCost":-0.01},"qqqAgainst":{"n":1551,"win":44.2,"target":10.1,"stop":35.7,"avgR":-0.01,"avgRCost":-0.06},"gapWith":{"n":2629,"win":44.8,"target":9.5,"stop":34.8,"avgR":0,"avgRCost":-0.05},"gapAgainst":{"n":2767,"win":48,"target":9.5,"stop":31.1,"avgR":0.05,"avgRCost":0},"years":{"2024":{"n":1512,"win":45,"target":8.9,"stop":35,"avgR":0,"avgRCost":-0.05},"2025":{"n":1951,"win":49.1,"target":11.8,"stop":33.6,"avgR":0.07,"avgRCost":0.02},"2026":{"n":1933,"win":45,"target":7.8,"stop":30.7,"avgR":0,"avgRCost":-0.05}}},"orb30":{"name":"30 分鐘 ORB","all":{"n":4330,"win":47.9,"target":5.3,"stop":24.2,"avgR":0.02,"avgRCost":-0.03},"long":{"n":2149,"win":48,"target":4.7,"stop":24.2,"avgR":0.02,"avgRCost":-0.03},"short":{"n":2181,"win":47.8,"target":5.9,"stop":24.2,"avgR":0.01,"avgRCost":-0.04},"qqqWith":{"n":3332,"win":48.4,"target":5.2,"stop":23.4,"avgR":0.03,"avgRCost":-0.02},"qqqAgainst":{"n":998,"win":46,"target":5.8,"stop":26.8,"avgR":-0.02,"avgRCost":-0.07},"gapWith":{"n":2085,"win":47.1,"target":5.4,"stop":25.1,"avgR":0.01,"avgRCost":-0.04},"gapAgainst":{"n":2245,"win":48.6,"target":5.2,"stop":23.3,"avgR":0.02,"avgRCost":-0.03},"years":{"2024":{"n":1211,"win":49.9,"target":5.3,"stop":23.4,"avgR":0.06,"avgRCost":0.01},"2025":{"n":1567,"win":50.3,"target":6.4,"stop":25.4,"avgR":0.04,"avgRCost":-0.01},"2026":{"n":1552,"win":43.9,"target":4.2,"stop":23.6,"avgR":-0.04,"avgRCost":-0.09}}},"flag":{"name":"開市推動後第一次回調（Bull／Bear Flag）","all":{"n":1166,"win":37.1,"target":27.7,"stop":59.3,"avgR":0.02,"avgRCost":-0.03},"long":{"n":580,"win":37.9,"target":28.3,"stop":59.3,"avgR":0.03,"avgRCost":-0.02},"short":{"n":586,"win":36.3,"target":27.1,"stop":59.4,"avgR":0,"avgRCost":-0.05},"qqqWith":{"n":803,"win":36.9,"target":27.4,"stop":58.9,"avgR":0.01,"avgRCost":-0.04},"qqqAgainst":{"n":363,"win":37.7,"target":28.4,"stop":60.3,"avgR":0.03,"avgRCost":-0.02},"gapWith":{"n":569,"win":36.7,"target":26.9,"stop":60.1,"avgR":0,"avgRCost":-0.05},"gapAgainst":{"n":597,"win":37.5,"target":28.5,"stop":58.6,"avgR":0.03,"avgRCost":-0.02},"years":{"2024":{"n":327,"win":39.1,"target":30.3,"stop":56,"avgR":0.1,"avgRCost":0.05},"2025":{"n":356,"win":37.9,"target":27.2,"stop":59.6,"avgR":0.01,"avgRCost":-0.04},"2026":{"n":483,"win":35.2,"target":26.3,"stop":61.5,"avgR":-0.04,"avgRCost":-0.09}}},"vwapPull":{"name":"VWAP 回調（趨勢延續）","all":{"n":2301,"win":37.4,"target":24.3,"stop":57.9,"avgR":-0.01,"avgRCost":-0.06},"long":{"n":1177,"win":38.5,"target":23.2,"stop":56.3,"avgR":0,"avgRCost":-0.05},"short":{"n":1124,"win":36.3,"target":25.4,"stop":59.6,"avgR":-0.02,"avgRCost":-0.07},"qqqWith":{"n":1322,"win":35.9,"target":22.8,"stop":58.5,"avgR":-0.05,"avgRCost":-0.1},"qqqAgainst":{"n":979,"win":39.4,"target":26.3,"stop":57.1,"avgR":0.04,"avgRCost":-0.01},"gapWith":{"n":1112,"win":36.2,"target":24.9,"stop":59.4,"avgR":-0.03,"avgRCost":-0.08},"gapAgainst":{"n":1189,"win":38.5,"target":23.6,"stop":56.6,"avgR":0,"avgRCost":-0.05},"years":{"2024":{"n":650,"win":39.4,"target":26.6,"stop":56.6,"avgR":0.05,"avgRCost":0},"2025":{"n":857,"win":39.1,"target":24.6,"stop":56.6,"avgR":0.02,"avgRCost":-0.03},"2026":{"n":794,"win":34,"target":21.9,"stop":60.5,"avgR":-0.1,"avgRCost":-0.15}}},"vwapReclaim":{"name":"VWAP 收復（反轉）","all":{"n":3431,"win":44.1,"target":13.7,"stop":41.2,"avgR":0.02,"avgRCost":-0.03},"long":{"n":1873,"win":43.4,"target":14.1,"stop":41.6,"avgR":0,"avgRCost":-0.05},"short":{"n":1558,"win":45,"target":13.3,"stop":40.8,"avgR":0.05,"avgRCost":0},"qqqWith":{"n":2033,"win":44.4,"target":13.9,"stop":40.8,"avgR":0.02,"avgRCost":-0.03},"qqqAgainst":{"n":1398,"win":43.6,"target":13.4,"stop":41.8,"avgR":0.02,"avgRCost":-0.03},"gapWith":{"n":1760,"win":44.3,"target":14.4,"stop":41,"avgR":0.04,"avgRCost":-0.01},"gapAgainst":{"n":1671,"win":43.9,"target":13,"stop":41.4,"avgR":0.01,"avgRCost":-0.04},"years":{"2024":{"n":973,"win":43.8,"target":14.2,"stop":40.6,"avgR":0.04,"avgRCost":-0.01},"2025":{"n":1218,"win":42.9,"target":14.8,"stop":44.5,"avgR":0,"avgRCost":-0.05},"2026":{"n":1240,"win":45.6,"target":12.3,"stop":38.5,"avgR":0.03,"avgRCost":-0.02}}},"r2g":{"name":"Red-to-Green／Green-to-Red（穿昨收）","all":{"n":749,"win":51.3,"target":7.6,"stop":20.6,"avgR":0.1,"avgRCost":0.05},"long":{"n":340,"win":46.2,"target":6.8,"stop":22.9,"avgR":0.03,"avgRCost":-0.02},"short":{"n":409,"win":55.5,"target":8.3,"stop":18.6,"avgR":0.15,"avgRCost":0.1},"qqqWith":{"n":597,"win":51.1,"target":7.5,"stop":19.3,"avgR":0.11,"avgRCost":0.06},"qqqAgainst":{"n":152,"win":52,"target":7.9,"stop":25.7,"avgR":0.06,"avgRCost":0.01},"gapWith":{"n":0},"gapAgainst":{"n":749,"win":51.3,"target":7.6,"stop":20.6,"avgR":0.1,"avgRCost":0.05},"years":{"2024":{"n":192,"win":52.1,"target":6.3,"stop":22.9,"avgR":0.09,"avgRCost":0.04},"2025":{"n":230,"win":48.3,"target":11.7,"stop":20.9,"avgR":0.17,"avgRCost":0.12},"2026":{"n":327,"win":52.9,"target":5.5,"stop":19,"avgR":0.05,"avgRCost":0}}},"gapFade":{"name":"Gap 失敗回落（Gap Fade）","all":{"n":1983,"win":44.3,"target":17.2,"stop":43.7,"avgR":0.05,"avgRCost":0},"long":{"n":946,"win":41.5,"target":14.7,"stop":46.1,"avgR":-0.02,"avgRCost":-0.07},"short":{"n":1037,"win":46.8,"target":19.5,"stop":41.5,"avgR":0.11,"avgRCost":0.06},"qqqWith":{"n":1606,"win":43.3,"target":16.3,"stop":44.8,"avgR":0.02,"avgRCost":-0.03},"qqqAgainst":{"n":377,"win":48.3,"target":21,"stop":38.7,"avgR":0.17,"avgRCost":0.12},"gapWith":{"n":0},"gapAgainst":{"n":1983,"win":44.3,"target":17.2,"stop":43.7,"avgR":0.05,"avgRCost":0},"years":{"2024":{"n":516,"win":48.4,"target":16.5,"stop":39.3,"avgR":0.1,"avgRCost":0.05},"2025":{"n":770,"win":44.9,"target":19.1,"stop":44.9,"avgR":0.08,"avgRCost":0.03},"2026":{"n":697,"win":40.5,"target":15.6,"stop":45.5,"avgR":-0.03,"avgRCost":-0.08}},"fillRate":52.7},"hodBreak":{"name":"午市整固後突破 HOD／LOD","all":{"n":2554,"win":44.9,"target":14.3,"stop":38.4,"avgR":0.05,"avgRCost":0},"long":{"n":1335,"win":42.1,"target":11.7,"stop":40.8,"avgR":-0.02,"avgRCost":-0.07},"short":{"n":1219,"win":48.1,"target":17.1,"stop":35.8,"avgR":0.12,"avgRCost":0.07},"qqqWith":{"n":2020,"win":44.7,"target":14.8,"stop":37.9,"avgR":0.05,"avgRCost":0},"qqqAgainst":{"n":534,"win":45.9,"target":12.4,"stop":40.3,"avgR":0.04,"avgRCost":-0.01},"gapWith":{"n":1256,"win":45.7,"target":15.6,"stop":37.5,"avgR":0.08,"avgRCost":0.03},"gapAgainst":{"n":1298,"win":44.2,"target":12.9,"stop":39.3,"avgR":0.01,"avgRCost":-0.04},"years":{"2024":{"n":783,"win":46,"target":14.4,"stop":37,"avgR":0.07,"avgRCost":0.02},"2025":{"n":922,"win":46.1,"target":14.6,"stop":39.9,"avgR":0.05,"avgRCost":0},"2026":{"n":849,"win":42.8,"target":13.7,"stop":38,"avgR":0.02,"avgRCost":-0.03}}}}};

  /* ---------------- 示意圖產生器（教學模擬） ---------------- */
  function rng(seed) { const r = C.mulberry32(Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0); for (let k = 0; k < 5; k++) r(); return r; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function genPath(r, P0, A, anchors, noise = 1) {
    const at = (i) => { for (let k = 0; k < anchors.length - 1; k++) { const [i0, p0] = anchors[k], [i1, p1] = anchors[k + 1]; if (i >= i0 && i <= i1) return p0 + (p1 - p0) * (i - i0) / Math.max(1, i1 - i0); } return anchors[anchors.length - 1][1]; };
    const B = []; let prev = P0, ar = 0;
    for (let i = 0; i < 78; i++) {
      ar = ar * 0.5 + gauss(r) * 0.03 * noise;
      const o = i === 0 ? P0 : prev + A * gauss(r) * 0.005;
      const c = P0 + A * (at(i) + ar);
      const h = Math.max(o, c) + A * Math.abs(gauss(r)) * 0.03 * noise, l = Math.min(o, c) - A * Math.abs(gauss(r)) * 0.03 * noise;
      const t = i / 77; const v = (0.6 + 2.2 * Math.exp(-t * 8) + 0.7 * Math.exp(-(1 - t) * 9)) * (0.75 + r() * 0.5);
      B.push({ t: hmOf(i), o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v: +v.toFixed(3) });
      prev = c;
    }
    return B;
  }
  function vwapOf(B) { let pv = 0, vv = 0; return B.map((b) => { pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; return vv ? pv / vv : b.c; }); }
  function emaOf(B) { const k = 2 / 10; let e = B[0].c; return B.map((b) => (e = b.c * k + e * (1 - k))); }
  const hiOf = (B, a, b) => Math.max(...B.slice(a, b + 1).map((x) => x.h));
  const loOf = (B, a, b) => Math.min(...B.slice(a, b + 1).map((x) => x.l));
  /* 鏡像：做空版本（價格上下反轉） */
  function mirror(B, P0) { return B.map((b) => ({ t: b.t, o: +(2 * P0 - b.o).toFixed(2), h: +(2 * P0 - b.l).toFixed(2), l: +(2 * P0 - b.h).toFixed(2), c: +(2 * P0 - b.c).toFixed(2), v: b.v })); }
  const jit = (r, anchors, amt) => anchors.map(([i, p], k) => [i, k === 0 ? p : p * (1 + (r() - 0.5) * amt)]);

  /* 每個 Setup：anchors（ATR 單位，Long 版本）+ 由 K 線計出觸發、入場、Stop、Target */
  const SET = {
    orb30: {
      name: '30 分鐘 ORB', short: true,
      anchors: [[0, 0], [2, 0.22], [4, -0.06], [5, 0.12], [7, 0.1], [9, 0.32], [14, 0.55], [20, 0.45], [30, 0.85], [50, 0.95], [77, 1.05]],
      plan(B, A, s) {
        const hi = s > 0 ? hiOf(B, 0, 5) : loOf(B, 0, 5), lo = s > 0 ? loOf(B, 0, 5) : hiOf(B, 0, 5);
        let k = 6; while (k < 30 && !(s > 0 ? B[k].h > hi : B[k].l < hi)) k++;
        return { k, entry: hi + s * 0.01, stop: lo - s * 0.01, box: [0, 5, Math.min(hi, lo), Math.max(hi, lo)], wait: '首 30 分鐘（09:30–10:00）畫出開市區間（紫色格）。', trig: `10:00 後${s > 0 ? '升穿區間高位' : '跌穿區間低位'}。` };
      },
    },
    flag: {
      name: '開市推動後第一次回調（Flag）', short: true,
      anchors: [[0, 0], [5, 0.62], [8, 0.42], [10, 0.47], [11, 0.44], [13, 0.68], [20, 1.0], [40, 1.1], [77, 1.2]],
      plan(B, A, s) {
        const pl = s > 0 ? loOf(B, 7, 11) : hiOf(B, 7, 11);
        const entry = (s > 0 ? B[11].h : B[11].l) + s * 0.01;
        return { k: 12, entry, stop: pl - s * 0.02 * A, wait: '開市頭 30 分鐘一支勁推（Opening Drive），之後細細地回調，冇穿 VWAP。', trig: `回調後出現一支${s > 0 ? '高位低過上一支' : '低位高過上一支'}嘅 K（Flag），下一支穿佢就入。` };
      },
    },
    vwapPull: {
      name: 'VWAP 回調（趨勢延續）', short: true,
      anchors: [[0, 0], [6, 0.42], [14, 0.6], [22, 0.3], [24, 0.32], [30, 0.62], [45, 0.85], [60, 0.8], [77, 1.0]],
      plan(B, A, s) {
        const vw = vwapOf(B); let k = 21, best = Infinity;
        for (let i = 18; i <= 26; i++) { const d = s * ((s > 0 ? B[i].l : B[i].h) - vw[i]); if (d < best) { best = d; k = i; } }
        if (s > 0) B[k].l = Math.min(B[k].l, +vw[k].toFixed(2)); else B[k].h = Math.max(B[k].h, +vw[k].toFixed(2));
        const entry = (s > 0 ? B[k].h : B[k].l) + s * 0.01, stop = (s > 0 ? Math.min(B[k].l, vw[k]) : Math.max(B[k].h, vw[k])) - s * 0.05 * A;
        return { k: k + 1, entry, stop, wait: `成朝${s > 0 ? '企喺 VWAP 上面' : '喺 VWAP 下面'}，趨勢清楚。`, trig: `回調掂到 VWAP，下一支 K ${s > 0 ? '升穿' : '跌穿'}掂 VWAP 嗰支嘅${s > 0 ? '高位' : '低位'}。` };
      },
    },
    vwapReclaim: {
      name: 'VWAP 收復（反轉）', short: true,
      anchors: [[0, 0], [3, -0.32], [6, -0.46], [10, -0.4], [14, -0.22], [17, -0.05], [19, 0.08], [26, 0.25], [40, 0.4], [77, 0.55]],
      plan(B, A, s) {
        const vw = vwapOf(B); let k = 7;
        while (k < 40 && !(s * (B[k].c - vw[k]) > 0)) k++;
        const entry = (s > 0 ? B[k].h : B[k].l) + s * 0.01, stop = (s > 0 ? loOf(B, k - 5, k) : hiOf(B, k - 5, k)) - s * 0.02 * A;
        return { k: k + 1, entry, stop, wait: `開市後${s > 0 ? '一路喺 VWAP 下面' : '一路喺 VWAP 上面'}（賣方${s > 0 ? '' : '／買方'}控制）。`, trig: `第一支收市${s > 0 ? '企返 VWAP 上面' : '跌返 VWAP 下面'}嘅 K，下一支穿佢${s > 0 ? '高位' : '低位'}。` };
      },
    },
    r2g: {
      name: 'Red-to-Green（穿昨收）', short: true,
      anchors: [[0, 0], [3, -0.2], [7, 0.05], [9, -0.05], [12, 0.35], [15, 0.55], [17, 0.75], [20, 0.98], [30, 1.3], [50, 1.5], [77, 1.6]],
      pc: 0.9,
      plan(B, A, s, P0) {
        const pc = P0 + s * 0.9 * A;
        let k = 1; while (k < 30 && !(s > 0 ? B[k].h >= pc : B[k].l <= pc)) k++;
        let sl = s > 0 ? loOf(B, Math.max(0, k - 8), k - 1) : hiOf(B, Math.max(0, k - 8), k - 1);
        return { k, entry: pc + s * 0.01, stop: sl - s * 0.02 * A, pc, wait: `Gap ${s > 0 ? '低開' : '高開'}，開市後慢慢${s > 0 ? '升返' : '跌返'}向昨日收市價（灰色線）。`, trig: `${s > 0 ? '升穿' : '跌穿'}昨日收市價（${s > 0 ? '由紅轉綠' : '由綠轉紅'}）。` };
      },
    },
    gapFade: {
      name: 'Gap 失敗回落（Gap Fade）', short: false, side: -1,
      anchors: [[0, 0], [2, 0.2], [4, 0.08], [5, 0.12], [8, -0.06], [11, -0.16], [13, -0.32], [20, -0.5], [35, -0.8], [55, -1.02], [77, -0.95]],
      plan(B, A, s, P0) {
        const pc = P0 - 1.0 * A, vw = vwapOf(B), orl = loOf(B, 0, 5);
        let k = 6; while (k < 40 && !(B[k].c < orl && B[k].c < vw[k])) k++;
        return { k: k + 1, entry: B[k].l - 0.01, stop: hiOf(B, k - 2, k) + 0.02 * A, pc, box: [0, 5, orl, hiOf(B, 0, 5)], wait: 'Gap 高開，但開市後升唔上，頭 30 分鐘畫出開市區間。', trig: '10:00 後一支 K 收市跌穿開市區間低位，而且喺 VWAP 下面。' };
      },
    },
    hodBreak: {
      name: '午市整固後突破 HOD', short: true,
      anchors: [[0, 0], [6, 0.5], [12, 0.3], [18, 0.58], [22, 0.5], [26, 0.55], [30, 0.52], [34, 0.56], [36, 0.54], [38, 0.78], [50, 0.95], [77, 1.05]],
      plan(B, A, s) {
        const hod = s > 0 ? hiOf(B, 0, 36) : loOf(B, 0, 36), bl = s > 0 ? loOf(B, 30, 36) : hiOf(B, 30, 36);
        return { k: 37, entry: hod + s * 0.01, stop: bl - s * 0.02 * A, box: [30, 36, Math.min(hod, bl), Math.max(hod, bl)], wait: `上晝${s > 0 ? '升' : '跌'}完之後，喺${s > 0 ? '高位' : '低位'}附近窄幅橫行（整固，紫色格）。`, trig: `${s > 0 ? '升穿全日最高（HOD）' : '跌穿全日最低（LOD）'}。` };
      },
    },
    trap: {
      name: '失敗突破（Trap）', short: false, side: -1,
      anchors: [[0, 0], [8, 0.5], [14, 0.3], [20, 0.48], [22, 0.56], [24, 0.42], [27, 0.32], [29, 0.24], [40, -0.05], [60, -0.2], [77, -0.3]],
      plan(B, A, s) {
        const ph = hiOf(B, 0, 12), th = hiOf(B, 20, 23), neck = loOf(B, 12, 18);
        let k = 24; while (k < 45 && !(B[k].l < neck)) k++;
        return { k, entry: neck - 0.01, stop: th + 0.02 * A, lines: [['之前高位', ph, '#0ea5e9']], wait: '價格升穿之前高位（好多人追入），但好快跌返落去。', trig: '跌穿兩個高位中間嘅低位（頸線），追高嘅人被困要斬倉。' };
      },
    },
  };
  const KEYS = Object.keys(SET);

  function build(key, seed, s, jitter) {
    const S = SET[key], r = rng(seed);
    const P0 = 50 + Math.round(r() * 300), A = P0 * (0.03 + r() * 0.015);
    let anchors = jitter ? jit(r, S.anchors, 0.18) : S.anchors;
    let side = S.side || s || 1;
    let B = genPath(r, P0, A, anchors, jitter ? 1 : 0.8);
    if (S.side == null && side < 0) B = mirror(B, P0);
    const p = S.plan(B, A, side, P0);
    const risk = side * (p.entry - p.stop);
    const target = p.entry + side * 2 * risk;
    // 結果：由入場 K 開始行
    let res = null;
    for (let i = p.k; i < 78; i++) {
      const b = B[i];
      if (res == null) { if (side > 0 ? b.h >= p.entry : b.l <= p.entry) res = { i, R: null }; else continue; }
      if (side > 0 ? b.l <= p.stop : b.h >= p.stop) { res.R = -1; res.exit = i; res.how = '中 Stop'; break; }
      if (side > 0 ? b.h >= target : b.l <= target) { res.R = 2; res.exit = i; res.how = '到 Target（2R）'; break; }
    }
    if (res && res.R == null) { res.R = (side * (B[77].c - p.entry)) / risk; res.exit = 77; res.how = '收市平倉'; }
    return { key, B, A, P0, side, ...p, target, risk, res };
  }

  /* ---------------- 畫圖 ---------------- */
  function draw(box, X, upto, show) {
    const B = X.B, n = Math.min(upto, B.length);
    const W = 800, priceH = 300, volH = 56, H = priceH + volH + 24, m = { l: 8, r: 84, t: 14 }, step = (W - m.l - m.r) / B.length;
    const lv = [];
    if (show.levels) { lv.push(['Entry', X.entry, '#7c3aed'], ['Stop', X.stop, '#dc2626'], ['Target', X.target, '#16a34a']); }
    if (X.pc != null) lv.push(['昨收', X.pc, '#64748b']);
    (X.lines || []).forEach((l) => lv.push(l));
    let lo = Math.min(...B.map((b) => b.l)), hi = Math.max(...B.map((b) => b.h));
    lv.forEach(([, p]) => { lo = Math.min(lo, p); hi = Math.max(hi, p); });
    const pd = (hi - lo) * 0.06; lo -= pd; hi += pd;
    const y = (p) => m.t + (hi - p) / (hi - lo) * (priceH - m.t - 6), x = (i) => m.l + step * i + step / 2;
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': SET[X.key].name + ' 示意圖' });
    for (let k = 0; k <= 4; k++) { const p = lo + (hi - lo) * k / 4; mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg); }
    if (n < B.length) mk('rect', { x: m.l + step * n, y: m.t - 6, width: step * (B.length - n), height: priceH + volH - m.t + 6, class: 'l12-future' }, svg);
    if (X.box) { const [i0, i1, a, b] = X.box; mk('rect', { x: m.l + step * i0, y: y(b), width: step * (i1 - i0 + 1), height: Math.max(2, y(a) - y(b)), class: 'l14-box' }, svg); }
    const tags = lv.map(([name, p, col]) => ({ name, p, col, ty: y(p) })).sort((a, b) => a.ty - b.ty);
    tags.forEach((t, k) => { if (k && t.ty - tags[k - 1].ty < 18) t.ty = tags[k - 1].ty + 18; });
    tags.forEach(({ name, p, col, ty }) => {
      mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), style: `stroke:${col};stroke-width:1.4;stroke-dasharray:6 4` }, svg);
      const g = mk('g', {}, svg); mk('rect', { x: W - m.r + 1, y: ty - 9, width: m.r - 2, height: 18, rx: 4, style: `fill:${col}` }, g);
      const t = mk('text', { x: W - m.r + 4, y: ty + 4, class: 'tag-text' }, g); t.textContent = `${name} ${p.toFixed(2)}`;
    });
    const vmax = Math.max(...B.map((b) => b.v)), vy0 = priceH + volH - 4, bw = Math.max(1.6, step * 0.64);
    B.slice(0, n).forEach((b, i) => {
      const g = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg);
      mk('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), class: 'wick' }, g);
      const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c));
      mk('rect', { x: x(i) - bw / 2, y: top, width: bw, height: Math.max(1.2, bot - top), class: 'body' }, g);
      const vh = (b.v / vmax) * (volH - 10); mk('rect', { x: x(i) - bw / 2, y: vy0 - vh, width: bw, height: vh, class: 'vol' }, g);
      const tt = mk('title', {}, g); tt.textContent = `${b.t}  O ${f2(b.o)} H ${f2(b.h)} L ${f2(b.l)} C ${f2(b.c)}`;
    });
    const vw = vwapOf(B).slice(0, n); if (vw.length > 1) mk('polyline', { points: vw.map((v, i) => x(i) + ',' + y(v)).join(' '), class: 'vwap-line' }, svg);
    const lg = mk('text', { x: m.l + 6, y: m.t + 10, class: 'vwap-label l10-lg' }, svg); lg.textContent = 'VWAP';
    if (X.ema) {
      const em = emaOf(B).slice(0, n);
      if (em.length > 1) mk('polyline', { points: em.map((v, i) => x(i) + ',' + y(v)).join(' '), class: 'l10-ema' }, svg);
      const t2 = mk('text', { x: m.l + 6, y: m.t + 26, class: 'l10-ema-label l10-lg' }, svg); t2.textContent = 'EMA 9';
    }
    if (show.amLine) {
      const xx = m.l + step * 24;
      mk('line', { x1: xx, x2: xx, y1: m.t - 6, y2: priceH + volH, class: 'l10-break' }, svg);
      const t3 = mk('text', { x: xx + 4, y: priceH - 2, class: 'axis' }, svg); t3.textContent = '11:30 收工';
    }
    if (show.levels && X.res && X.res.i < n) {
      const t = mk('text', { x: x(X.res.i), y: X.side > 0 ? y(B[X.res.i].l) + 16 : y(B[X.res.i].h) - 8, class: 'l14-mark in', 'text-anchor': 'middle' }, svg); t.textContent = X.side > 0 ? '▲ 入' : '▼ 入';
      if (X.res.exit < n) { const e = mk('text', { x: x(X.res.exit), y: X.side > 0 ? y(B[X.res.exit].h) - 8 : y(B[X.res.exit].l) + 16, class: 'l14-mark out', 'text-anchor': 'middle' }, svg); e.textContent = '出'; }
    }
    const every = 9;
    B.forEach((b, i) => { if (i % every) return; const t = mk('text', { x: Math.max(x(i), m.l + 18), y: H - 4, class: 'axis', 'text-anchor': 'middle' }, svg); t.textContent = b.t; });
    box.innerHTML = ''; box.appendChild(svg);
  }

  /* ① 每個 Setup 嘅示意圖：一步一步揭 */
  const diagram = (key, opts = {}) => (el) => {
    {
      const S = SET[key];
      let side = S.side || 1, stage = 0, seed = 300 + Object.keys(SET).indexOf(key);
      const steps = ['① 等：條件形成緊', '② 觸發：入場條件出現', '③ 入場：Entry、Stop、Target', '④ 出場：結果'];
      const render = () => {
        const X = build(key, seed, side, false);
        const upto = stage === 0 ? Math.max(6, X.k - 6) : stage === 1 ? X.k : stage === 2 ? Math.min(78, (X.res ? X.res.i : X.k) + 2) : 78;
        el.innerHTML = `<div class="l10-w"><div class="l10-bar">${steps.map((t, i) => `<button class="btn sm ${i === stage ? 'primary' : ''}" data-st="${i}">${t}</button>`).join('')}${S.short && !opts.longOnly ? `<label><select data-side><option value="1" ${side > 0 ? 'selected' : ''}>Long 版本</option><option value="-1" ${side < 0 ? 'selected' : ''}>Short 版本</option></select></label>` : ''}<button class="btn sm ghost" data-new>另一個例子</button></div>
          <div class="l12-chart" data-c></div>
          <p class="l10-read">${stage === 0 ? esc(X.wait) : stage === 1 ? '<b>觸發：</b>' + esc(X.trig) : stage === 2 ? `<b>${X.side > 0 ? '做多' : '沽空'}</b> Entry ${f2(X.entry)}（Stop 單）｜Stop ${f2(X.stop)}（每股風險 ${f2(X.risk)} = ${(X.risk / X.A).toFixed(2)} ATR）｜Target ${f2(X.target)}（2R）` : X.res ? `結果：${X.res.how}（${X.res.R >= 0 ? '+' : ''}${X.res.R.toFixed(2)}R）。<span class="muted">示意圖係教學模擬，真實勝率睇下面嘅統計。</span>` : '今次冇觸發入場價——冇觸發就冇交易。'}</p></div>`;
        draw(el.querySelector('[data-c]'), X, upto, { levels: stage >= 2, amLine: opts.amLine });
        el.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => { stage = +b.dataset.st; render(); }));
        const sd = el.querySelector('[data-side]'); if (sd) sd.addEventListener('change', () => { side = +sd.value; stage = 0; render(); });
        el.querySelector('[data-new]').addEventListener('click', () => { seed += 17; stage = 0; render(); });
      };
      render();
    }
  };
  KEYS.forEach((key) => { window.WIDGETS_EXTRA['l14-d-' + key] = diagram(key); });

  /* ② 真實統計表 */
  const ORDER = ['orb15', 'orb30', 'flag', 'vwapPull', 'vwapReclaim', 'r2g', 'gapFade', 'hodBreak'];
  window.WIDGETS_EXTRA['l14-stats'] = (el) => {
    if (!STATS || !STATS.setups) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    const cell = (g) => (g && g.n ? `<td>${g.n}</td><td>${g.win}%</td><td>${g.target}%</td><td class="${g.avgR >= 0 ? 'pos' : 'neg'}">${g.avgR >= 0 ? '+' : ''}${g.avgR.toFixed(2)}</td><td class="${g.avgRCost >= 0 ? 'pos' : 'neg'}">${g.avgRCost >= 0 ? '+' : ''}${g.avgRCost.toFixed(2)}</td>` : '<td colspan="5">—</td>');
    let view = 'all';
    const draw2 = () => {
      el.innerHTML = `<div class="l11-w"><div class="l13-tabs">${[['all', '全部'], ['qqqWith', 'QQQ 同方向'], ['qqqAgainst', 'QQQ 反方向'], ['long', '只做多'], ['short', '只沽空']].map(([k, t]) => `<button class="btn sm ${k === view ? 'primary' : ''}" data-v="${k}">${t}</button>`).join('')}</div>
        <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>Setup</th><th>次數</th><th>賺錢 %</th><th>到 2R %</th><th>平均 R</th><th>扣成本後</th></tr></thead><tbody>
        ${ORDER.filter((k) => STATS.setups[k]).map((k) => `<tr><th scope="row">${esc(STATS.setups[k].name)}</th>${cell(STATS.setups[k][view])}</tr>`).join('')}
        <tr class="l14-ref"><th scope="row">參考：我哋嘅後備 5 分鐘 ORB（每日報告，10/29 起）</th><td>12</td><td>8%</td><td>8%</td><td class="neg">−0.78</td><td class="neg">—</td></tr>
        </tbody></table></div>
        <p class="muted">數據：${esc(STATS.source)}，${esc(STATS.from)} 至 ${esc(STATS.to)}，${STATS.universe.length} 隻成交大嘅美股，只計「有人關注」嘅日子（${esc(STATS.rules.inPlay)}，共 ${STATS.daysInPlay.toLocaleString()} 日）。出場：${esc(STATS.rules.exit)}。扣成本：${esc(STATS.rules.cost)}。QQQ 同方向：${esc(STATS.rules.qqq)}。每個 Setup 用固定機械規則，真人做會有判斷，結果會唔同。過去統計唔代表將來。</p></div>`;
      el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.v; draw2(); }));
    };
    draw2();
  };

  /* ③ 辨認練習：睇到觸發前，估係邊個 Setup */
  const spot = (keys, storeKey, longOnly) => (el) => {
    let seed = Math.floor(Math.random() * 1e6), X = null, opts = [], ans = null;
    const next = () => {
      seed += 7919; ans = null;
      const r = rng(seed); const key = keys[Math.floor(r() * keys.length)];
      const S = SET[key]; const side = S.side || (!longOnly && S.short && r() < 0.4 ? -1 : 1);
      X = build(key, seed, side, true);
      const others = keys.filter((k) => k !== key).sort(() => r() - 0.5).slice(0, 3);
      opts = [key, ...others].sort(() => r() - 0.5);
      render();
    };
    const render = () => {
      const t = tsGet(storeKey, { n: 0, ok: 0 });
      el.innerHTML = `<div class="l10-w"><div class="l12-chart" data-c></div>
        <div class="l12-quiz">呢個係邊個 Setup？${opts.map((k) => `<button class="btn sm ${ans ? (k === X.key ? 'primary' : k === ans ? 'l14-wrong' : '') : ''}" data-a="${k}" ${ans ? 'disabled' : ''}>${esc(SET[k].name)}</button>`).join(' ')}</div>
        <div class="l11-out" aria-live="polite">${ans ? `<p>${ans === X.key ? '✅ 啱！' : '❌ 唔啱，'}呢個係 <b>${esc(SET[X.key].name)}</b>（${X.side > 0 ? '做多' : '沽空'}）。</p><p><b>觸發：</b>${esc(X.trig)}</p><p>Entry ${f2(X.entry)}｜Stop ${f2(X.stop)}｜Target ${f2(X.target)} → ${X.res ? `${X.res.how}（${X.res.R >= 0 ? '+' : ''}${X.res.R.toFixed(2)}R）` : '冇觸發'}</p>` : '<p class="muted">灰色係未發生嘅時間。睇結構、VWAP、開市區間同昨收，揀一個答案。</p>'}
        <p><button class="btn sm" data-next>下一題 ▶</button> <span class="muted">${t.n ? `答咗 ${t.n} 題，啱 ${t.ok} 題（${Math.round((t.ok / t.n) * 100)}%）` : ''}</span></p></div></div>`;
      draw(el.querySelector('[data-c]'), X, ans ? 78 : X.k, { levels: !!ans, amLine: longOnly });
      el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { if (ans) return; ans = b.dataset.a; const t2 = tsGet(storeKey, { n: 0, ok: 0 }); t2.n++; if (ans === X.key) t2.ok++; tsSet(storeKey, t2); render(); }));
      el.querySelector('[data-next]').addEventListener('click', next);
    };
    next();
  };
  window.WIDGETS_EXTRA['l14-spot'] = spot(KEYS, 'l14-spot');
  /* 俾其他 Level 共用（Level 15 會加自己嘅 Setup） */
  window.SetupLab = { SET, build, draw, diagram, spot, rng, genPath, vwapOf, emaOf, hiOf, loOf, mk, esc, f2 };
})();

window.COURSE.push({
  id: 'l14',
  code: 'Level 14',
  title: '常用 Setup 實戰：點入、點出',
  subtitle: 'ORB 15／30 分鐘、開市推動後第一次回調（Flag）、VWAP 回調、VWAP 收復、Red-to-Green、Gap Fade、午市 HOD 突破、失敗突破（Trap）；每個都有入場、Stop、Target、唔做嘅情況、示意圖同真實統計',
  icon: '🎯',
  color: '#be123c',
  question: '除咗 Breakout + Retest，仲有咩常見 Setup？每個點入、點出？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l14-c1', num: '1', title: 'Setup 地圖：幾點、咩市況、做咩 Setup', mins: 8,
  summary: '一日唔同時間有唔同 Setup：開市頭 30 分鐘睇 ORB、Red-to-Green；10:00–11:30 睇 Flag、VWAP 回調、VWAP 收復、Gap Fade；11:30 後睇 HOD 突破。真實數據（5,396 次以上）顯示：8 個 Setup 照機械規則做，扣成本後全部差唔多打和。Setup 只係工具，Edge 來自揀股、揀位、執行同出場。',
  keywords: ['Setup', 'Playbook', '統計'],
  md: `
:::info 呢個 Level 點嚟
用戶話：「Breakout + Retest 或者之前教過嘅都唔係好普遍，想學多啲普遍嘅 Setup，點入點出。」呢個 Level 教 8 個常見 Setup。每個都有固定規則、示意圖（一步一步揭），同埋用真實 5 分鐘數據計嘅成績。
:::

## 1.1 Setup 時間表

| 時間（美東） | 市況 | 常見 Setup | 章 |
|---|---|---|---|
| 09:30–10:00 | 最亂、成交最大 | 30 分鐘 ORB 準備、Red-to-Green | 3、7 |
| 10:00–11:30 | 方向開始清楚 | 開市推動後第一次回調（Flag）、VWAP 回調、VWAP 收復、Gap Fade | 4、5、6、8 |
| 11:30–14:00 | 午市淡靜 | 整固後突破 HOD／LOD | 9 |
| 全日 | 假突破 | 失敗突破（Trap） | 10 |

## 1.2 真實數據：8 個 Setup 嘅成績

每個 Setup 用**固定、機械化**嘅規則（Stop 單入場、Target 2R、冇到就收市平倉），喺 50 隻成交大嘅美股、**有人關注嘅日子**（Gap ≥ 2% 或者開市成交 ≥ 平時 2 倍）測試。撳上面嘅掣睇唔同條件：

[[widget:l14-stats]]

:::key 點睇
- **賺錢 %** 唔需要高過 50%：Target 係 2R，贏一次可以抵返蝕兩次
- **平均 R** 先係重點：+0.10R 即係平均每次賺 0.1 個風險單位
- **扣成本後**：每次大約扣 0.05R（佣金同滑價）。扣完仲係正數先有意思
- 機械規則係「最差情況」：真人可以加過濾（大市方向、位置、成交量），但亦可能做錯
:::

:::warn 誠實講：數據話你知嘅四件事
1. **冇一個 Setup 自己有 Edge**：8 個機械做法扣成本後全部喺大約 −0.06R 到 +0.05R 之間，即係差唔多打和。網上講到「勝率 80%」嘅 Setup，通常冇計 Stop、成本或者揀咗靚例子
2. **沽空版本做得好啲**：Green-to-Red（+0.15R）、Gap 高開失敗沽空（+0.11R）、午市跌穿 LOD（+0.12R）都好過做多版本。可能同 2024–2026 幾次大跌市有關，唔一定會繼續
3. **跟 QQQ 方向冇穩定幫助**：有啲 Setup 好啲、有啲差啲
4. **2026 年比 2024–2025 差**：市況會變，Setup 冇永遠有效

所以 Setup 只係「入場嘅形狀」。真正嘅分別來自：**揀咩股**（催化劑、RVOL、Level 6–7）、**喺咩位置**（VWAP、PDH、開市區間）、**避開差嘅日子**、**跟 Stop 同管理出場**。下面每章都講「**唔做嘅情況**」。
:::

[[quiz:l14-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c2', num: '2', title: '每個 Setup 都有五個部分', mins: 6,
  summary: '背景（Context）、位置（Level）、觸發（Trigger）、Stop、出場（Target 同管理）。五樣寫得出先叫 Setup；寫唔出就係感覺。',
  keywords: ['Setup', 'Trigger', 'Stop', 'Target'],
  md: `
## 2.1 五個部分

| 部分 | 問自己 | 例子（VWAP 回調做多） |
|---|---|---|
| **背景** | 今日係咩市況？大市方向？ | 趨勢日，股價成朝喺 VWAP 上面，QQQ 都升 |
| **位置** | 喺邊個價做？ | VWAP |
| **觸發** | 咩情況先入？ | 掂 VWAP 之後，下一支 K 升穿掂線嗰支嘅高位 |
| **Stop** | 錯咗喺邊？ | VWAP 下面少少（或者回調低位） |
| **出場** | 點樣賺錢離場？ | Target 2R；到 1R 移 Stop 返入場價 |

:::tip 用 Stop 單入場
本 Level 所有 Setup 都係「穿某個價先入」，即係用 **Stop（Stop Limit）單**：價格去到先觸發（Level 13 第 5 章）。好處：冇觸發就冇交易，唔使估。
:::

## 2.2 A+ Setup 檢查

[[check:l14-aplus]]

[[quiz:l14-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c3', num: '3', title: 'Opening Range Breakout（15／30 分鐘）', mins: 9,
  summary: '開市頭 15 或 30 分鐘畫出高低位（開市區間），之後穿邊邊就做邊邊。Stop 喺區間另一邊，Target 2R。區間太闊（超過 0.75 ATR）唔做。數據：機械做法差唔多打和，要加過濾。',
  keywords: ['ORB', 'Opening Range', '開市區間'],
  md: `
## 3.1 規則

:::card 30 分鐘 ORB（Long 版本，Short 反轉）
- **等**：09:30–10:00 畫出開市區間（最高、最低）
- **唔做**：區間闊過 0.75 ATR（Stop 太遠）；10:00 前已經穿咗好遠
- **觸發**：10:00 後升穿區間高位
- **入場**：Buy Stop 喺區間高位 + 0.01
- **Stop**：區間低位 − 0.01
- **Target**：2R；冇到就收市前平倉
:::

[[widget:l14-d-orb30]]

## 3.2 數據

| 版本 | 次數 | 賺錢 % | 平均 R | 扣成本後 |
|---|---|---|---|---|
| 15 分鐘 ORB | 5,396 | 46% | +0.03 | −0.02 |
| 30 分鐘 ORB | 4,330 | 48% | +0.02 | −0.03 |
| 30 分鐘 ORB，QQQ 同方向 | 3,332 | 48% | +0.03 | −0.02 |
| 我哋報告嘅 5 分鐘 ORB（10/29 起） | 12 | 8% | −0.78 | — |

:::coach 學到咩
- 區間越短（5 分鐘），越易俾開市亂波掃 Stop；15、30 分鐘好啲，但機械做法都只係差唔多打和（扣成本後 −0.03R）
- 到 2R 嘅比例好低（30 分鐘 ORB 得 5%），大部分係收市平倉：ORB 嘅利潤主要靠趨勢日
- ORB 唔係唔可以做，而係要**加過濾**：配合 Gap 方向、大市方向、PMH／PDH 位置、首 5 分鐘成交
- 呢個亦係點解每日報告主力用「盤前高低 + 成交確認」，而唔係純 ORB
:::

[[quiz:l14-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c4', num: '4', title: '開市推動後第一次回調（Bull／Bear Flag）', mins: 10,
  summary: '開市頭 30 分鐘一支勁推（最少 0.3 ATR），之後細細地回調、冇穿 VWAP、冇回超過一半；出現一支「高位低過上一支」嘅 K（Flag）之後，下一支穿佢高位入場。Stop 喺回調低位。',
  keywords: ['Bull Flag', 'Bear Flag', 'First Pullback', 'Opening Drive'],
  md: `
## 4.1 點解有效

開市推動（Opening Drive）代表有大買家（或者大賣家）。第一次回調係錯過咗嘅人等緊嘅位，亦係早入嘅人加注嘅位。回調細、成交縮，代表賣家唔積極。

## 4.2 規則

:::card Bull Flag（Short 反轉做 Bear Flag）
- **背景**：10:00 收市比開市高最少 0.3 ATR（開市推動）
- **回調**：由高位回落最少 0.15 ATR；**唔可以收穿 VWAP**；**唔可以回超過推動嘅一半**
- **觸發**：回調中出現一支高位低過上一支嘅 K（Flag），下一支升穿佢高位
- **入場**：Buy Stop 喺 Flag K 高位 + 0.01
- **Stop**：回調最低位下面少少；Stop 闊過 0.6 ATR 唔做
- **Target**：2R，或者之前高位（HOD）先食一半
:::

[[widget:l14-d-flag]]

## 4.3 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 1,166 | 37% | 28% | +0.02 | −0.03 |
| QQQ 同方向 | 803 | 37% | 27% | +0.01 | −0.04 |
| 只做多 | 580 | 38% | 28% | +0.03 | −0.02 |
| 只沽空 | 586 | 36% | 27% | 0.00 | −0.05 |

:::coach 數據點講
機械版本「賺錢 %」只有 37%，但到 2R 有 28%：典型嘅「贏少輸多、贏大輸細」，平均 +0.02R，扣成本後差唔多打和。新手常見問題係贏咗 1R 就走、輸咗唔走，咁就一定蝕。要賺錢，就要配合每日報告揀出嚟、有催化劑嘅股，同埋嚴格跟 2R 同 Stop。
:::

:::bad 唔做
- 回調收穿 VWAP：推動已經失敗
- 回調超過一半：唔係「細細地回」
- 第二、第三次回調：越後越弱，第一次最好
- 11:30 之後先出現：午市淡靜，突破容易失敗
:::

[[quiz:l14-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c5', num: '5', title: 'VWAP 回調（趨勢日延續）', mins: 9,
  summary: '開市後價格一路企喺 VWAP 上面（趨勢日），第一次回調到 VWAP，下一支 K 升穿掂線嗰支高位就入，Stop 喺 VWAP 下面少少。價格收穿 VWAP 就唔再做。',
  keywords: ['VWAP', 'Pullback', 'Trend Day'],
  md: `
## 5.1 規則

:::card VWAP 回調做多（Short 反轉）
- **背景**：09:45–10:00 每支 K 都收喺 VWAP 上面
- **位置**：價格回到 VWAP（低位掂到 VWAP 附近，0.05 ATR 之內）
- **觸發**：下一支 K 升穿掂 VWAP 嗰支嘅高位（3 支 K 之內）
- **Stop**：VWAP 同嗰支 K 低位較低嗰個，再減 0.05 ATR；Stop 闊過 0.6 ATR 唔做
- **Target**：2R，或者 HOD
- **失效**：任何一支 K 收穿 VWAP 下面
:::

[[widget:l14-d-vwapPull]]

## 5.2 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 2,301 | 37% | 24% | −0.01 | −0.06 |
| QQQ 同方向 | 1,322 | 36% | 23% | −0.05 | −0.10 |
| QQQ 反方向 | 979 | 39% | 26% | +0.04 | −0.01 |

:::tip 同 EMA 9 一齊用
強勢趨勢日，價格好多時回唔到 VWAP，只係回到 5 分鐘 EMA 9 就再升。EMA 9 回調做法一樣，但 Stop 細啲、假訊號多啲。新手先用 VWAP。
:::

[[quiz:l14-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c6', num: '6', title: 'VWAP 收復／失守（反轉）', mins: 8,
  summary: '開市後一路喺 VWAP 下面（10:00 仲低過開市價同 VWAP），之後第一支收市企返 VWAP 上面嘅 K，下一支升穿佢高位就做多。Stop 喺最近 6 支 K 低位。反轉 Setup，Stop 要細。',
  keywords: ['VWAP Reclaim', 'VWAP Rejection', 'Reversal'],
  md: `
## 6.1 規則

:::card VWAP 收復做多（Short 版本叫 VWAP 失守）
- **背景**：10:00 價格低過開市價、低過 VWAP（賣方控制咗頭 30 分鐘）
- **觸發**：10:00–13:00 第一支**收市企返 VWAP 上面**嘅 K
- **入場**：下一支 K 升穿佢高位（3 支 K 之內）
- **Stop**：最近 6 支 K 最低位下面少少；闊過 0.6 ATR 唔做
- **Target**：2R，或者開市價／HOD
:::

[[widget:l14-d-vwapReclaim]]

## 6.2 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 3,431 | 44% | 14% | +0.02 | −0.03 |
| QQQ 同方向 | 2,033 | 44% | 14% | +0.02 | −0.03 |
| 只做多（收復） | 1,873 | 43% | 14% | 0.00 | −0.05 |
| 只沽空（失守） | 1,558 | 45% | 13% | +0.05 | 0.00 |

:::warn 反轉 Setup 嘅風險
你係逆住頭 30 分鐘嘅方向做。收復之後再跌返落 VWAP 下面（假收復）好常見，所以 Stop 一定要跟，唔好「等佢返嚟」。
:::

[[quiz:l14-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c7', num: '7', title: 'Red-to-Green／Green-to-Red（穿昨收）', mins: 8,
  summary: 'Gap 低開（≥ 2%）嘅股，開市後升返穿昨日收市價（由紅轉綠）就做多；Gap 高開嘅股跌穿昨收（由綠轉紅）就沽空。Stop 喺最近低位（最多 0.75 ATR）。',
  keywords: ['Red to Green', 'Green to Red', 'PDC'],
  md: `
## 7.1 點解有效

昨日收市價（PDC）係好多人睇嘅位。Gap 低開之後升返過昨收，代表今早沽貨嘅人全部蝕緊，佢哋要買返（Short Cover），推高價格。

## 7.2 規則

:::card Red-to-Green 做多
- **背景**：Gap 低開 ≥ 2%；開市後築底、慢慢升
- **觸發**：升穿昨日收市價（PDC）
- **入場**：Buy Stop 喺 PDC + 0.01
- **Stop**：最近一個低位（或者全日最低）下面；Stop 闊過 0.75 ATR 唔做
- **Target**：2R，或者 PMH／PDH
:::

[[widget:l14-d-r2g]]

## 7.3 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 749 | 51% | 8% | +0.10 | +0.05 |
| Red-to-Green（做多） | 340 | 46% | 7% | +0.03 | −0.02 |
| Green-to-Red（沽空） | 409 | 56% | 8% | +0.15 | +0.10 |

:::coach 數據點講
8 個 Setup 入面，呢個平均最好（+0.10R，扣成本後 +0.05R），尤其係 **Green-to-Red 沽空**（+0.15R）。到 2R 嘅比例低（8%），大部分靠收市平倉賺。Red-to-Green 做多就差唔多打和（+0.03R）。
:::

[[quiz:l14-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c8', num: '8', title: 'Gap 失敗回落（Gap Fade）', mins: 8,
  summary: 'Gap 高開 ≥ 2%，但 10:00 後一支 K 收市跌穿開市區間低位兼喺 VWAP 下面：Gap 失敗，沽空。Stop 喺最近 3 支 K 高位，Target 2R 或者補 Gap（昨收）。',
  keywords: ['Gap Fade', 'Gap Fill', 'Failed Gap'],
  md: `
## 8.1 點解有效

Level 12 第 7 章嘅數據：Gap ≥ 3% 只有大約三分一延續。Gap 高開之後跌穿開市區間、失守 VWAP，代表早上追入嘅人被困。

## 8.2 規則

:::card Gap Fade 沽空（Gap 低開就反轉做多）
- **背景**：Gap 高開 ≥ 2%
- **觸發**：10:00–12:00 一支 K **收市跌穿開市區間（頭 30 分鐘）低位**，而且喺 VWAP 下面
- **入場**：Sell Stop 喺嗰支 K 低位 − 0.01（3 支 K 之內）
- **Stop**：最近 3 支 K 最高位上面；闊過 0.6 ATR 唔做
- **Target**：2R，或者昨日收市價（補 Gap）
:::

[[widget:l14-d-gapFade]]

## 8.3 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 1,983 | 44% | 17% | +0.05 | 0.00 |
| 沽空（Gap 高開失敗） | 1,037 | 47% | 20% | +0.11 | +0.06 |
| 做多（Gap 低開失敗） | 946 | 42% | 15% | −0.02 | −0.07 |

入場後當日掂返昨收（補 Gap）嘅比例：53%。沽空版本（Gap 高開失敗）比做多版本好（+0.11R 對 −0.02R）。

:::warn Cash 戶口
沽空要 Margin 戶口同借到貨（Level 11 第 8 章）。Cash 戶口只可以做反方向：Gap 低開失敗（升穿開市區間高位）做多。
:::

[[quiz:l14-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c9', num: '9', title: '午市整固後突破 HOD／LOD', mins: 8,
  summary: '11:00 之後，價格喺全日最高位附近窄幅橫行最少 30 分鐘（6 支 5 分鐘 K，範圍 ≤ 0.3 ATR），之後升穿 HOD 就入。Stop 喺整固低位，Stop 細、R:R 好。',
  keywords: ['HOD Break', 'Consolidation', 'Midday'],
  md: `
## 9.1 規則

:::card HOD 突破（Short 版本：LOD 跌穿）
- **背景**：11:00–15:00；上晝已經升過
- **整固**：最近 6 支 K（30 分鐘）範圍 ≤ 0.3 ATR，而且高位貼近 HOD（0.1 ATR 之內）
- **觸發**：升穿 HOD
- **入場**：Buy Stop 喺 HOD + 0.01（之後 30 分鐘內有效）
- **Stop**：整固低位下面少少
- **Target**：2R；收市前一定平倉
:::

[[widget:l14-d-hodBreak]]

## 9.2 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部 | 2,554 | 45% | 14% | +0.05 | 0.00 |
| QQQ 同方向 | 2,020 | 45% | 15% | +0.05 | 0.00 |
| QQQ 反方向 | 534 | 46% | 12% | +0.04 | −0.01 |
| 只做多（HOD 突破） | 1,335 | 42% | 12% | −0.02 | −0.07 |
| 只沽空（LOD 跌穿） | 1,219 | 48% | 17% | +0.12 | +0.07 |

:::tip 點解整固要窄
窄 = Stop 細 = 同樣風險買得多股，R:R 好。闊嘅整固（例如 1 ATR）突破之後要行好遠先到 2R。
:::

[[quiz:l14-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c10', num: '10', title: '失敗突破（Trap）同雙頂', mins: 7,
  summary: '價格升穿之前高位、好多人追入，但好快跌返落嚟，再跌穿兩個高位中間嘅低位（頸線）：追高嘅人被困，沽空。Stop 喺假突破高位。呢個 Setup 我哋未用數據測試。',
  keywords: ['Failed Breakout', 'Trap', 'Double Top'],
  md: `
## 10.1 規則

:::card 失敗突破沽空（反轉：失敗跌穿做多）
- **背景**：價格第二次去到之前高位，短暫升穿
- **失敗**：好快收返之前高位下面（突破冇成交、冇延續）
- **觸發**：跌穿兩個高位中間嘅低位（頸線）
- **Stop**：假突破嘅最高位上面
- **Target**：2R，或者 VWAP、開市價
:::

[[widget:l14-d-trap]]

:::coach 同 Level 12 嘅關係
呢個就係 Level 12 第 5 章講嘅「突破之後三種劇本」入面嘅假突破。佢係 Breakout 嘅相反面：你學識認假突破，自己追突破時都會小心啲。
:::

:::warn 未測試
「失敗」好難用機械規則定義，所以呢個 Setup 冇真實統計。請用練習同 Paper Trading 自己記錄。
:::

[[quiz:l14-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c11', num: '11', title: '出場：Stop、Target、分段、跟蹤、時間止蝕', mins: 9,
  summary: '入場只係一半。出場有五種：Stop（錯咗）、Target（2R）、分段（1R 食一半）、跟蹤 Stop（EMA 9 或者上一支 K 低位）、時間止蝕（30 分鐘冇郁就走）。新手用最簡單：2R 全走、1R 移 Stop 返入場價。',
  keywords: ['Exit', 'Trailing Stop', 'Scale Out', 'Time Stop'],
  md: `
## 11.1 五種出場

| 方法 | 點做 | 好處 | 壞處 |
|---|---|---|---|
| **Stop** | 價格到 Stop 即走 | 蝕有上限 | — |
| **固定 Target** | 2R 全走 | 簡單、易跟 | 大趨勢日賺少咗 |
| **分段** | 1R 食一半，其餘 2R 或者跟蹤 | 心理舒服 | 平均每筆賺少啲 |
| **跟蹤 Stop** | Stop 跟住 5 分鐘 EMA 9，或者上一支 K 低位 | 趨勢日食晒 | 亂市俾掃好多次 |
| **時間止蝕** | 入場後 30 分鐘冇去到 1R 就走 | 唔會揸住死倉 | 有時走咗先郁 |

## 11.2 建議（新手）

:::steps 第一個月只用呢套
1. 入場同時落 Bracket：Stop + Target 2R（Level 13 第 5 章）
2. 到 +1R：Stop 移返入場價
3. 15:50 前未到 Target：收市前平倉（Day Trade 唔留倉）
4. 唔好將 Stop 移遠、唔好將 Target 移近
:::

:::tip 幾時可以提早走
- 去到之前高位（HOD、PDH）出現長上影線同大成交
- 大市（QQQ）突然大跌、跌穿 VWAP
- 有突發新聞
提早走係「計劃入面嘅」先算，唔係「驚」。
:::

[[quiz:l14-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l14-c12', num: '12', title: '辨認練習同揀你嘅 1–2 個 Setup', mins: 12,
  summary: '練到睇一眼就認得係邊個 Setup。之後只揀 1–2 個最啱你時間表同性格嘅 Setup，做 Paper Trading 記錄 30 次，計 Expectancy，先考慮用真錢。',
  keywords: ['練習', 'Playbook', 'Paper Trading'],
  md: `
## 12.1 辨認練習

睇到觸發之前（灰色 = 未發生），揀係邊個 Setup，再睇入場、Stop、Target 同結果：

[[widget:l14-spot]]

## 12.2 揀你嘅 Setup

| 你嘅情況 | 建議 Setup |
|---|---|
| 香港時間晚上 10:30 後先得閒 | 開市推動後第一次回調、VWAP 回調（10:00–11:30） |
| 只可以睇開市頭 1 小時 | 30 分鐘 ORB（加過濾）、Red-to-Green |
| 夜晚 12 點後先得閒 | 午市 HOD 突破 |
| Cash 戶口（唔可以沽空） | 只做 Long 版本：Flag、VWAP 回調、VWAP 收復、Red-to-Green、HOD 突破 |

:::steps 由學到用
1. 揀 **1–2 個** Setup，唔好 8 個一齊做
2. 用 Level 12 嘅練習紀錄或者 TradingView Replay 練 **50 次**辨認
3. Paper Trading 做 **30 次**，記低每次 R（交易日誌）
4. 計 Expectancy（Level 8）：扣成本後係正數先考慮真錢
5. 真錢由最細注開始（Level 11 第一個月計劃）
:::

[[link:tools/bracket-ticket|⚡ 打開 Bracket 落單卡]]

[[check:l14-grad]]

[[quiz:l14-final]]

[[link:level/l15|➡️ 下一課：Level 15 頭 2 小時做多]]

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l14-c1': { title: '小測：Setup 地圖', questions: [
  { q: '10:00–11:30 最常見嘅 Setup 唔包括？', options: ['開市推動後第一次回調', 'VWAP 回調', '午市整固後突破 HOD'], answer: 2, explain: 'HOD 突破係 11:30 後。' },
  { q: '一個 Setup 賺錢 % 只有 45%，係咪一定唔好？', options: ['係', '唔一定：Target 2R，平均 R 先係重點', '只要高過 30% 就好'], answer: 1, explain: '贏一次 2R 抵兩次 −1R。' },
  { q: '扣成本後平均 R 係負數，代表？', options: ['長期會蝕錢', '一定賺', '冇影響'], answer: 0, explain: '成本令細 Edge 消失。' },
  { q: '數據入面，邊類版本整體做得好啲？', options: ['沽空版本（Green-to-Red、Gap 高開失敗、LOD 跌穿）', '全部做多版本', '冇分別'], answer: 0, explain: '可能同 2024–2026 嘅跌市有關，唔一定繼續。' },
]},
'l14-c2': { title: '小測：五個部分', questions: [
  { q: 'Setup 五個部分唔包括？', options: ['背景', '觸發', '朋友推介'], answer: 2, explain: '背景、位置、觸發、Stop、出場。' },
  { q: '「穿某個價先入」應該用？', options: ['Stop（Stop Limit）單', '市價單', '限價單喺而家價下面'], answer: 0, explain: 'Level 13 第 5 章。' },
  { q: '寫唔出 Stop 喺邊，代表？', options: ['可以照做', '唔係 Setup，係感覺', 'Stop 唔重要'], answer: 1, explain: '五樣寫得出先叫 Setup。' },
]},
'l14-c3': { title: '小測：ORB', questions: [
  { q: '30 分鐘 ORB 嘅開市區間係？', options: ['09:30–10:00 嘅高低位', '昨日高低位', '盤前高低位'], answer: 0, explain: '首 30 分鐘。' },
  { q: '開市區間闊過 0.75 ATR 應該？', options: ['加大注碼', '唔做，Stop 太遠', '改用 1 分鐘'], answer: 1, explain: 'Stop 太遠，R:R 差。' },
  { q: '數據顯示機械 ORB 嘅成績係？', options: ['大賺', '差唔多打和，要加過濾', '必蝕'], answer: 1, explain: '要配合 Gap、大市、位置。' },
]},
'l14-c4': { title: '小測：Flag', questions: [
  { q: '第一次回調唔可以？', options: ['收穿 VWAP', '成交縮細', '回調 0.2 ATR'], answer: 0, explain: '收穿 VWAP = 推動失敗。' },
  { q: 'Flag 入場位係？', options: ['回調低位', '升穿 Flag K 嘅高位', '開市價'], answer: 1, explain: '用 Buy Stop。' },
  { q: '第二、第三次回調比第一次？', options: ['更好', '越後越弱', '一樣'], answer: 1, explain: '第一次最好。' },
]},
'l14-c5': { title: '小測：VWAP 回調', questions: [
  { q: 'VWAP 回調做多嘅背景係？', options: ['價格一路喺 VWAP 上面', '價格一路喺 VWAP 下面', '冇所謂'], answer: 0, explain: '趨勢日。' },
  { q: 'Stop 放喺邊？', options: ['VWAP 下面少少', '開市價', 'HOD'], answer: 0, explain: 'VWAP 失守就錯咗。' },
  { q: '強勢日回唔到 VWAP，常見嘅替代係？', options: ['5 分鐘 EMA 9 回調', '日線 200 日線', '唔做任何嘢'], answer: 0, explain: 'Stop 細啲、假訊號多啲。' },
]},
'l14-c6': { title: '小測：VWAP 收復', questions: [
  { q: 'VWAP 收復做多嘅背景？', options: ['10:00 低過開市價同 VWAP', '10:00 高過 VWAP', 'Gap 高開'], answer: 0, explain: '頭 30 分鐘賣方控制。' },
  { q: '觸發係？', options: ['第一支收市企返 VWAP 上面嘅 K，下一支穿佢高位', '一掂 VWAP 就買', '收市前買'], answer: 0, explain: '要收市確認。' },
  { q: '反轉 Setup 最大風險？', options: ['假收復，再跌返落 VWAP', '冇成交', '太易賺'], answer: 0, explain: 'Stop 一定要跟。' },
]},
'l14-c7': { title: '小測：Red-to-Green', questions: [
  { q: 'Red-to-Green 嘅觸發價係？', options: ['昨日收市價（PDC）', 'VWAP', '開市價'], answer: 0, explain: '由跌轉升嘅分界。' },
  { q: '點解穿昨收會推高價格？', options: ['早上沽空嘅人蝕錢要買返', '交易所規定', '冇原因'], answer: 0, explain: 'Short Cover。' },
  { q: 'Stop 闊過 0.75 ATR 應該？', options: ['唔做', '照做', '加注'], answer: 0, explain: 'R:R 太差。' },
]},
'l14-c8': { title: '小測：Gap Fade', questions: [
  { q: 'Gap Fade 沽空嘅觸發？', options: ['收市跌穿開市區間低位兼喺 VWAP 下面', '一開市就沽', '升穿 PMH'], answer: 0, explain: '要確認 Gap 失敗。' },
  { q: 'Gap Fade 嘅自然 Target？', options: ['昨日收市價（補 Gap）', 'PMH', '52 週高'], answer: 0, explain: '或者 2R。' },
  { q: 'Cash 戶口可以做咩版本？', options: ['Gap 低開失敗做多', 'Gap 高開沽空', '都唔得'], answer: 0, explain: 'Cash 戶口唔可以沽空。' },
]},
'l14-c9': { title: '小測：HOD 突破', questions: [
  { q: '整固要幾窄？', options: ['30 分鐘範圍 ≤ 0.3 ATR', '≥ 1 ATR', '冇要求'], answer: 0, explain: '窄 = Stop 細。' },
  { q: 'Stop 放喺？', options: ['整固低位下面', '開市價', '昨日低位'], answer: 0, explain: '跌穿整固就錯咗。' },
  { q: 'HOD 突破一般喺幾點？', options: ['11:00 之後', '09:30', '盤前'], answer: 0, explain: '午市整固之後。' },
]},
'l14-c10': { title: '小測：失敗突破', questions: [
  { q: '失敗突破沽空嘅觸發？', options: ['跌穿兩個高位中間嘅頸線', '一升穿高位就沽', '收市前沽'], answer: 0, explain: '確認追高嘅人被困。' },
  { q: 'Stop 放喺？', options: ['假突破最高位上面', '頸線', 'VWAP'], answer: 0, explain: '再升返上去就錯。' },
  { q: '呢個 Setup 有冇真實統計？', options: ['有', '冇，要自己記錄', '有，100% 準'], answer: 1, explain: '難用機械規則定義。' },
]},
'l14-c11': { title: '小測：出場', questions: [
  { q: '新手建議嘅出場方法？', options: ['2R 全走、1R 移 Stop 返入場價', '冇 Target，等到收市', 'Stop 移遠啲'], answer: 0, explain: '簡單易跟。' },
  { q: '跟蹤 Stop 嘅壞處？', options: ['亂市俾掃好多次', '冇壞處', '一定賺少'], answer: 0, explain: '趨勢日好、亂市差。' },
  { q: '以下邊個唔係提早走嘅合理原因？', options: ['QQQ 突然跌穿 VWAP', '去到 HOD 長上影線大成交', '覺得驚'], answer: 2, explain: '提早走要係計劃入面。' },
]},
'l14-final': { title: 'Level 14 總測驗', questions: [
  { q: '10:00 收市比開市高 0.5 ATR，之後回調冇穿 VWAP，出現一支高位低過上一支嘅 K。呢個係？', options: ['開市推動後第一次回調（Bull Flag）', 'Gap Fade', 'Red-to-Green'], answer: 0, explain: '入場：穿 Flag K 高位。' },
  { q: 'Gap 高開 4%，10:30 一支 K 收市跌穿開市區間低位兼喺 VWAP 下面。呢個係？', options: ['VWAP 回調做多', 'Gap Fade 沽空', 'HOD 突破'], answer: 1, explain: 'Gap 失敗。' },
  { q: '13:00 價格喺 HOD 下面 0.05 ATR 窄幅橫行 40 分鐘。合理計劃？', options: ['Buy Stop 喺 HOD 上面，Stop 喺整固低位', '而家市價買', '沽空'], answer: 0, explain: 'HOD 突破。' },
  { q: '揀 Setup 最好嘅做法？', options: ['8 個一齊做', '揀 1–2 個，練 50 次、Paper 30 次再計 Expectancy', '跟朋友做'], answer: 1, explain: '專注先有樣本。' },
  { q: '真實數據顯示 8 個 Setup 照機械規則做，扣成本後係？', options: ['大賺', '差唔多打和，Edge 要靠揀股、位置、執行同出場', '全部大蝕'], answer: 1, explain: 'Setup 只係入場嘅形狀。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l14-aplus': { title: 'A+ Setup 檢查（入場前）', items: [
  '講得出係邊個 Setup（名）',
  '背景啱：時間、大市（QQQ）同方向',
  '喺關鍵位（VWAP、PDC、HOD、開市區間）',
  '觸發價清楚，用 Stop 單入',
  'Stop 有結構依據，唔超過 0.6–0.75 ATR',
  'Target ≥ 2R，前面冇大阻力',
  '股數已經計好（落單卡）',
  '寫低「咩情況唔做」',
]},
'l14-grad': { title: 'Level 14 完成檢查', items: [
  '講得出 8 個 Setup 嘅入場、Stop、Target',
  '知道邊個 Setup 喺幾點出現',
  '知道 8 個 Setup 機械做法扣成本後差唔多打和，Edge 要靠揀股、位置同執行',
  '辨認練習做咗 50 題以上',
  '揀咗自己嘅 1–2 個 Setup',
  '用 Paper Trading 做咗 30 次並記錄 R',
]},
});

window.GLOSSARY.push(
  { term: 'First Pullback', zh: '第一次回調', def: '開市推動之後第一次細回調，常見嘅順勢入場位。第二、第三次回調通常較弱。', lv: 'l14' },
  { term: 'VWAP Pullback', zh: 'VWAP 回調', def: '趨勢日價格回到 VWAP 再順勢推進，係常見嘅延續 Setup。', lv: 'l14' },
  { term: 'Red-to-Green', zh: '由紅轉綠', def: 'Gap 低開嘅股升返穿昨日收市價，當日由跌轉升。反過嚟叫 Green-to-Red。', lv: 'l14' },
  { term: 'HOD / LOD', zh: '全日最高／最低', def: 'High of Day、Low of Day：當日到而家為止嘅最高同最低價。', lv: 'l14' },
  { term: 'Failed Breakout', zh: '失敗突破', def: '價格升穿之前高位之後好快跌返落嚟，追高嘅人被困，常見反轉訊號。', lv: 'l14' },
);
