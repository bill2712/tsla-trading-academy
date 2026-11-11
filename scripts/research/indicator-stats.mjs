#!/usr/bin/env node
/* Indicator 讀數 vs 做多結果（教學用）
 * 問題：每個 Indicator 喺咩讀數做多最好？
 * 數據：Alpaca 5 分鐘 K 線（正常交易時段），只計「有人關注」嘅日子（Gap ≥ 2% 或者首 5 分鐘成交 ≥ 平時 2 倍）。
 * 做法：喺 09:50、10:10、10:30 三個時間各做一次「試單」：收市價買入，Stop = 0.25 個日線 ATR，Target = 0.5 ATR（2R），
 *       60 分鐘內未到就平倉。之後按當時各個 Indicator 嘅讀數分組，睇平均 R。同一支 K 掂 Stop 同 Target 當 Stop。
 * EMA／RSI／MACD 用「只顯示正常時段」嘅 5 分鐘圖計（數值由昨日延續）。
 * 只輸出統計數字，唔輸出原始價格。
 * 用法：node --no-warnings scripts/research/indicator-stats.mjs --cache DIR [--out data/research/indicator-stats.json]
 */
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('out', 'data/research/indicator-stats.json');
const CACHE = arg('cache', '');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');
const TIMES = [3, 7, 11]; // 第 3、7、11 支 K 收市 = 09:50、10:10、10:30
const HOLD = 12;          // 60 分鐘

function daysOf(sym) {
  const cf = `${CACHE}/${sym}.json`;
  if (!fs.existsSync(cf)) throw new Error('冇快取：先跑 setup-stats.mjs --cache');
  const rows = JSON.parse(fs.readFileSync(cf, 'utf8'));
  const by = new Map();
  rows.forEach(([d, hm, o, h, l, c, v]) => { if (!by.has(d)) by.set(d, []); by.get(d).push({ hm, o, h, l, c, v }); });
  const out = [];
  // 連續計（好似 RTH 圖表）：EMA 9、EMA 20、RSI 14、MACD(12,26,9)
  let e9 = null, e20 = null, e12 = null, e26 = null, sig = null, ag = null, al = null, prevC = null, n = 0;
  [...by.keys()].sort().forEach((d) => {
    const B = by.get(d);
    const ok = B.length >= 70 && B[0].hm === '09:30';
    let pv = 0, vv = 0, cum = 0;
    B.forEach((b) => {
      n++;
      const k = (p) => 2 / (p + 1);
      e9 = e9 == null ? b.c : b.c * k(9) + e9 * (1 - k(9));
      e20 = e20 == null ? b.c : b.c * k(20) + e20 * (1 - k(20));
      e12 = e12 == null ? b.c : b.c * k(12) + e12 * (1 - k(12));
      e26 = e26 == null ? b.c : b.c * k(26) + e26 * (1 - k(26));
      const macd = e12 - e26; sig = sig == null ? macd : macd * k(9) + sig * (1 - k(9));
      if (prevC != null) { const ch = b.c - prevC, g = Math.max(ch, 0), l = Math.max(-ch, 0); ag = ag == null ? g : (ag * 13 + g) / 14; al = al == null ? l : (al * 13 + l) / 14; }
      prevC = b.c;
      pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; cum += b.v;
      b.e9 = e9; b.e20 = e20; b.hist = macd - sig; b.rsi = al == null ? null : al === 0 ? 100 : 100 - 100 / (1 + ag / al); b.vw = vv ? pv / vv : b.c; b.cum = cum; b.warm = n > 150;
    });
    if (ok) out.push({ d, B, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), v1: B[0].v });
  });
  out.forEach((x, i) => {
    const p = out[i - 1]; x.pc = p ? p.c : null;
    if (i >= 50) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      const last20 = out.slice(i - 20, i);
      x.rvol5 = x.v1 / (last20.reduce((a, y) => a + y.v1, 0) / 20);
      x.avgCum = TIMES.map((t) => last20.reduce((a, y) => a + (y.B[t] ? y.B[t].cum : 0), 0) / 20);
      const s20 = last20.reduce((a, y) => a + y.c, 0) / 20, s50 = out.slice(i - 50, i).reduce((a, y) => a + y.c, 0) / 50;
      x.trend = x.pc > s20 && s20 > s50 ? 'up' : x.pc < s20 && s20 < s50 ? 'down' : 'mixed';
      x.dExt = (x.pc - s20) / x.atr;
      // 日線 EMA 9
      let e = out[i - 40].c; for (let j = i - 39; j < i; j++) e = out[j].c * 0.2 + e * 0.8;
      x.dEma9 = x.pc > e;
    }
  });
  return out.filter((x) => x.atr && x.pc && x.trend);
}

const qqq = new Map(); daysOf('QQQ').forEach((x) => qqq.set(x.d, x));
const S = [];
/* 第二部分：喺具體入場位嗰刻嘅讀數。E = EMA 9 回調入場；F = 高位窄幅整固後突破（Flat Top） */
const E = [], F = [];
const AM_END = 23;
function trade(D, entry, stop, from, until) {
  const B = D.B, risk = entry - stop; if (!(risk > 0)) return null;
  const tgt = entry + 2 * risk; let k = -1, fill = null;
  for (let i = from; i <= Math.min(until, AM_END); i++) if (B[i].h >= entry) { k = i; fill = Math.max(entry, B[i].o); break; }
  if (k < 0 || fill <= stop) return null;
  for (let i = k; i <= AM_END; i++) { if (B[i].l <= stop) return { r: (stop - fill) / risk, k }; if (B[i].h >= tgt && (i > k || B[i].c >= tgt)) return { r: (tgt - fill) / risk, k }; }
  return { r: (B[AM_END].c - fill) / risk, k };
}
function feat(D, i, Q) {
  const B = D.B, b = B[i], a = D.atr, c = b.c;
  const hod = Math.max(...B.slice(0, i + 1).map((x) => x.h));
  const pv5 = B.slice(Math.max(0, i - 5), i).reduce((s, x) => s + x.v, 0) / Math.min(5, i);
  const qb = Q && Q.B[i];
  return { slope9: (b.e9 - B[Math.max(0, i - 3)].e9) / a, e9e20: (b.e9 - b.e20) / a, vwapd: (c - b.vw) / a, e9vw: (b.e9 - b.vw) / a, fromOpen: (c - D.o) / a, pullHod: (hod - c) / a,
    rvol5: D.rvol5, rsi: b.rsi, hist: b.hist > 0, barVol: pv5 ? b.v / pv5 : null, qVwap: qb ? qb.c > qb.vw : null, rsQ: qb ? ((c / D.o - 1) - (qb.c / Q.o - 1)) * 100 : null,
    trend: D.trend, atrPct: (a / D.pc) * 100, time: i, year: D.d.slice(0, 4), gap: D.o / D.pc - 1 >= 0.02 ? 'up' : D.o / D.pc - 1 <= -0.02 ? 'down' : 'flat' };
}
let inPlay = 0;
for (const sym of UNIVERSE) {
  let days; try { days = daysOf(sym); } catch (e) { console.error(sym, e.message); continue; }
  days.forEach((D) => {
    const g = D.o / D.pc - 1;
    if (!(Math.abs(g) >= 0.02 || D.rvol5 >= 2)) return;
    inPlay++;
    const Q = qqq.get(D.d), B = D.B, a = D.atr;
    // E：第一次回調掂 EMA 9（之前兩支收喺 EMA 9 上面，呢支低位掂到、收市守住）；下一支升穿高位入場
    for (let i = 3; i <= 21; i++) {
      const x = B[i]; if (!x.warm) break;
      if (!(B[i - 1].c > B[i - 1].e9 && B[i - 2].c > B[i - 2].e9)) continue;
      if (x.l <= x.e9 + 0.03 * a && x.c >= x.e9 - 0.05 * a) {
        const entry = x.h + 0.01, stop = Math.min(x.l, x.e9) - 0.03 * a;
        if (entry - stop <= 0.5 * a) { const t = trade(D, entry, stop, i + 1, i + 2); if (t) E.push({ r: t.r, ...feat(D, i, Q), riskAtr: (entry - stop) / a }); }
        break;
      }
    }
    // F：最近 4 支 K 範圍 ≤ 0.25 ATR、貼住 HOD、喺 VWAP 上面；升穿 HOD 入場
    for (let i = 8; i <= 21; i++) {
      if (!B[i].warm) break;
      const seg = B.slice(i - 4, i), bh = Math.max(...seg.map((x) => x.h)), bl = Math.min(...seg.map((x) => x.l));
      if (bh - bl > 0.25 * a) continue;
      const hod = Math.max(...B.slice(0, i).map((x) => x.h));
      if (hod - bh > 0.08 * a || bl < B[i - 1].vw) continue;
      const t = trade(D, hod + 0.01, bl - 0.02 * a, i, i + 3); if (t) F.push({ r: t.r, ...feat(D, i - 1, Q), riskAtr: (hod - bl) / a });
      break;
    }
    TIMES.forEach((i, ti) => {
      const b = B[i]; if (!b.warm || b.rsi == null) return;
      const c = b.c, stop = c - 0.25 * a, tgt = c + 0.5 * a, end = i + HOLD;
      let r = null;
      for (let j = i + 1; j <= end; j++) { if (B[j].l <= stop) { r = -1; break; } if (B[j].h >= tgt) { r = 2; break; } }
      if (r == null) r = (B[end].c - c) / (0.25 * a);
      const hod = Math.max(...B.slice(0, i + 1).map((x) => x.h)), lod = Math.min(...B.slice(0, i + 1).map((x) => x.l));
      const pv5 = B.slice(Math.max(0, i - 5), i).reduce((s, x) => s + x.v, 0) / Math.min(5, i);
      const qb = Q && Q.B[i];
      S.push({
        r, fwd: (B[end].c - c) / a, t: ti,
        ema9d: (c - b.e9) / a, ema20d: (c - b.e20) / a, stack: c > b.e9 && b.e9 > b.e20 ? 'bull' : c < b.e9 && b.e9 < b.e20 ? 'bear' : 'mixed',
        slope9: (b.e9 - B[i - 3].e9) / a, vwapd: (c - b.vw) / a,
        fromOpen: (c - D.o) / a, range: (hod - lod) / a, pullHod: (hod - c) / a,
        atrPct: (a / D.pc) * 100, rvol5: D.rvol5, rvolT: D.avgCum[ti] ? b.cum / D.avgCum[ti] : null,
        rsi: b.rsi, hist: b.hist / a, histUp: b.hist > B[i - 1].hist, barVol: pv5 ? b.v / pv5 : null,
        rsQ: qb ? ((c / D.o - 1) - (qb.c / Q.o - 1)) * 100 : null, qVwap: qb ? qb.c > qb.vw : null,
        trend: D.trend, dExt: D.dExt, dEma9: D.dEma9, gap: g >= 0.02 ? 'up' : g <= -0.02 ? 'down' : 'flat', year: D.d.slice(0, 4),
      });
    });
  });
  console.error(sym, days.length);
}

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
const summ = (T) => (T.length ? { n: T.length, win: p1(T.filter((t) => t.r > 0).length / T.length), up: p1(T.filter((t) => t.fwd > 0).length / T.length), avgR: r2(T.reduce((a, t) => a + t.r, 0) / T.length), avgFwd: r2(T.reduce((a, t) => a + t.fwd, 0) / T.length) } : { n: 0 });
/* 數值分組：edges = [a, b, c] → (<a)、[a,b)、[b,c)、(≥c) */
const num = (key, edges, labels) => ({ key, labels, f: (t) => { const v = t[key]; if (v == null || !isFinite(v)) return -1; let k = 0; while (k < edges.length && v >= edges[k]) k++; return k; } });
const cat = (key, vals, labels) => ({ key, labels, f: (t) => vals.indexOf(t[key]) });
const IND = {
  ema9d: { name: 'EMA 9 距離（價格 − EMA 9，ATR）', ...num('ema9d', [-0.15, 0, 0.1, 0.25, 0.5], ['低過 EMA 9 超過 0.15 ATR', '啱啱低過 EMA 9', '高過 0–0.1 ATR（貼住）', '高過 0.1–0.25 ATR', '高過 0.25–0.5 ATR', '高過 0.5 ATR 以上（離得遠）']) },
  slope9: { name: 'EMA 9 斜率（15 分鐘變化，ATR）', ...num('slope9', [-0.1, -0.02, 0.02, 0.1, 0.2], ['急跌（< −0.1）', '向下', '走平', '向上', '明顯向上（0.1–0.2）', '急升（> 0.2）']) },
  stack: { name: 'EMA 排列（價格、EMA 9、EMA 20）', ...cat('stack', ['bull', 'mixed', 'bear'], ['多頭排列：價 > EMA 9 > EMA 20', '混亂', '空頭排列：價 < EMA 9 < EMA 20']) },
  ema20d: { name: 'EMA 20 距離（ATR）', ...num('ema20d', [-0.2, 0, 0.2, 0.5], ['低過 EMA 20 超過 0.2 ATR', '啱啱低過', '高過 0–0.2 ATR', '高過 0.2–0.5 ATR', '高過 0.5 ATR 以上']) },
  vwapd: { name: 'VWAP 距離（價格 − VWAP，ATR）', ...num('vwapd', [-0.3, 0, 0.15, 0.3, 0.6], ['低過 VWAP 超過 0.3 ATR', '啱啱低過 VWAP', '高過 0–0.15 ATR（貼住）', '高過 0.15–0.3 ATR', '高過 0.3–0.6 ATR', '高過 0.6 ATR 以上']) },
  fromOpen: { name: '今日由開市價行咗幾多（ATR）', ...num('fromOpen', [-0.5, 0, 0.3, 0.6, 1], ['跌咗超過 0.5 ATR', '跌咗 0–0.5 ATR', '升咗 0–0.3 ATR', '升咗 0.3–0.6 ATR', '升咗 0.6–1 ATR', '升咗超過 1 ATR']) },
  range: { name: '今日波幅用咗幾多（高 − 低，ATR）', ...num('range', [0.4, 0.7, 1, 1.5], ['少過 0.4 ATR', '0.4–0.7 ATR', '0.7–1 ATR', '1–1.5 ATR', '超過 1.5 ATR']) },
  pullHod: { name: '離全日高位幾遠（ATR）', ...num('pullHod', [0.05, 0.15, 0.3, 0.6], ['貼住 HOD（< 0.05）', '0.05–0.15 ATR', '0.15–0.3 ATR', '0.3–0.6 ATR', '超過 0.6 ATR']) },
  atrPct: { name: 'ATR %（日線波幅 ÷ 股價）', ...num('atrPct', [3, 5, 8], ['少過 3%', '3–5%', '5–8%', '8% 以上']) },
  rvol5: { name: '開市 RVOL（首 5 分鐘成交 ÷ 平時）', ...num('rvol5', [1, 2, 3, 5], ['少過 1 倍', '1–2 倍', '2–3 倍', '3–5 倍', '5 倍以上']) },
  rvolT: { name: '累計 RVOL（到呢刻嘅成交 ÷ 平時同時段）', ...num('rvolT', [1, 1.5, 2, 3], ['少過 1 倍', '1–1.5 倍', '1.5–2 倍', '2–3 倍', '3 倍以上']) },
  barVol: { name: '呢支 K 成交 ÷ 之前 5 支平均', ...num('barVol', [0.6, 1, 1.5], ['縮量（< 0.6）', '0.6–1', '1–1.5', '放量（> 1.5）']) },
  rsi: { name: 'RSI 14（5 分鐘）', ...num('rsi', [30, 45, 55, 65, 75], ['少過 30（超賣）', '30–45', '45–55', '55–65', '65–75', '75 以上（超買）']) },
  hist: { name: 'MACD 柱（Histogram）', f: (t) => (t.hist > 0 ? (t.histUp ? 0 : 1) : t.histUp ? 2 : 3), labels: ['正數兼增加緊', '正數但縮緊', '負數但收窄緊', '負數兼擴大緊'] },
  rsQ: { name: 'Relative Strength（個股 − QQQ，由開市計，%）', ...num('rsQ', [-2, -0.5, 0.5, 2], ['弱過 QQQ 超過 2%', '弱 0.5–2%', '差唔多', '強 0.5–2%', '強過 QQQ 超過 2%']) },
  qVwap: { name: 'QQQ 對自己 VWAP', ...cat('qVwap', [true, false], ['QQQ 喺 VWAP 上面', 'QQQ 喺 VWAP 下面']) },
  trend: { name: '日線趨勢（20／50 日線）', ...cat('trend', ['up', 'mixed', 'down'], ['升勢', '橫行', '跌勢']) },
  dExt: { name: '日線：昨收離 20 日線幾遠（ATR）', ...num('dExt', [-2, 0, 1, 2, 3.5], ['低過超過 2 ATR', '低過 0–2 ATR', '高過 0–1 ATR', '高過 1–2 ATR', '高過 2–3.5 ATR', '高過 3.5 ATR 以上（離得遠）']) },
  dEma9: { name: '日線：昨收對 Daily EMA 9', ...cat('dEma9', [true, false], ['高過 Daily EMA 9', '低過 Daily EMA 9']) },
  gap: { name: '今日 Gap 方向', ...cat('gap', ['up', 'flat', 'down'], ['Gap 高開 ≥ 2%', '平開（開市量大）', 'Gap 低開 ≥ 2%']) },
};
/* Long 評分（8 項，寫程式之前已經定好，冇睇結果先揀） */
const CHECKS = [
  ['vwap', '價格喺 VWAP 上面', (t) => t.vwapd > 0],
  ['stack', '多頭排列：價 > EMA 9 > EMA 20', (t) => t.stack === 'bull'],
  ['slope', 'EMA 9 向上', (t) => t.slope9 > 0.02],
  ['rvol', '開市 RVOL ≥ 2', (t) => t.rvol5 >= 2],
  ['rsi', 'RSI 喺 50–70', (t) => t.rsi >= 50 && t.rsi <= 70],
  ['near', '冇離 EMA 9 太遠（≤ 0.25 ATR）', (t) => t.ema9d <= 0.25],
  ['qqq', 'QQQ 喺 VWAP 上面', (t) => t.qVwap === true],
  ['room', '今日未行超過 1 ATR', (t) => t.fromOpen < 1],
];
S.forEach((t) => { t.score = CHECKS.filter((c) => c[2](t)).length; });

const out = {
  generatedAt: new Date().toISOString(), universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）', from: '2024-03-15', to: '2026-11-06',
  daysInPlay: inPlay, samples: S.length,
  rules: {
    inPlay: 'Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍',
    probe: '09:50、10:10、10:30 各試一次：收市價買入，Stop 0.25 ATR，Target 0.5 ATR（2R），60 分鐘內未到就平倉',
    note: '同一日最多 3 個樣本，互相有重疊；EMA／RSI／MACD 用只顯示正常時段嘅 5 分鐘圖計',
  },
  all: summ(S),
  indicators: {}, score: {}, checks: CHECKS.map(([k, name, f]) => ({ key: k, name, yes: summ(S.filter(f)), no: summ(S.filter((t) => !f(t))) })),
  scoreByYear: {},
};
Object.entries(IND).forEach(([k, I]) => { out.indicators[k] = { name: I.name, buckets: I.labels.map((label, bi) => ({ label, ...summ(S.filter((t) => I.f(t) === bi)) })) }; });
for (let s = 0; s <= 8; s++) out.score[s] = summ(S.filter((t) => t.score === s));
out.scoreGroups = { low: summ(S.filter((t) => t.score <= 3)), mid: summ(S.filter((t) => t.score >= 4 && t.score <= 5)), high: summ(S.filter((t) => t.score >= 6 && t.score <= 7)), top: summ(S.filter((t) => t.score === 8)) };
['2024', '2025', '2026'].forEach((y) => { out.scoreByYear[y] = { low: summ(S.filter((t) => t.year === y && t.score <= 3)), high: summ(S.filter((t) => t.year === y && t.score >= 7)) }; });
/* 入場位分析：每個讀數「合格」同「唔合格」嘅平均 R */
const sm = (T) => (T.length ? { n: T.length, win: p1(T.filter((t) => t.r > 0).length / T.length), avgR: r2(T.reduce((a, t) => a + t.r, 0) / T.length) } : { n: 0 });
const ENTRY = [
  ['rvol', '開市 RVOL ≥ 2', (t) => t.rvol5 >= 2],
  ['qqq', 'QQQ 喺 VWAP 上面', (t) => t.qVwap === true],
  ['vwap', '價格喺 VWAP 上面', (t) => t.vwapd > 0],
  ['e9vw', 'EMA 9 喺 VWAP 上面', (t) => t.e9vw > 0],
  ['stack', 'EMA 9 喺 EMA 20 上面', (t) => t.e9e20 > 0],
  ['slope', 'EMA 9 向上（15 分鐘升 > 0.02 ATR）', (t) => t.slope9 > 0.02],
  ['open', '價格高過開市價', (t) => t.fromOpen > 0],
  ['rsi5070', 'RSI 喺 50–70', (t) => t.rsi >= 50 && t.rsi <= 70],
  ['rsi70', 'RSI 高過 70', (t) => t.rsi > 70],
  ['macd', 'MACD 柱係正數', (t) => t.hist],
  ['dry', '回調／整固嗰支 K 縮量（< 之前 5 支平均）', (t) => t.barVol != null && t.barVol < 1],
  ['rs', '強過 QQQ（由開市計）', (t) => t.rsQ > 0],
  ['trend', '日線升勢', (t) => t.trend === 'up'],
  ['gapUp', 'Gap 高開', (t) => t.gap === 'up'],
  ['tight', 'Stop 細過 0.2 ATR', (t) => t.riskAtr < 0.2],
  ['late', '10:30 之後', (t) => t.time >= 12],
];
const entryStats = (T) => ({ all: sm(T), checks: ENTRY.map(([k, name, f]) => ({ key: k, name, yes: sm(T.filter(f)), no: sm(T.filter((t) => !f(t))) })),
  aplus: sm(T.filter((t) => t.rvol5 >= 2 && t.qVwap === true)), notAplus: sm(T.filter((t) => !(t.rvol5 >= 2 && t.qVwap === true))),
  full: sm(T.filter((t) => t.rvol5 >= 2 && t.qVwap === true && t.e9vw > 0 && t.slope9 > 0.02)),
  years: Object.fromEntries(['2024', '2025', '2026'].map((y) => [y, { aplus: sm(T.filter((t) => t.year === y && t.rvol5 >= 2 && t.qVwap === true)), all: sm(T.filter((t) => t.year === y)) }])) });
out.entries = { rule: 'Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉', emaPull: { name: 'EMA 9 回調入場', ...entryStats(E) }, flatTop: { name: '高位窄幅整固後突破（Flat Top）', ...entryStats(F) } };
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('inPlay', inPlay, 'samples', S.length, 'all', JSON.stringify(out.all));
Object.entries(out.indicators).forEach(([k, I]) => { console.log('\n' + I.name); I.buckets.forEach((b) => console.log('  ' + b.label.padEnd(34), String(b.n).padStart(6), 'win', b.win, 'up', b.up, 'avgR', b.avgR, 'fwd', b.avgFwd)); });
console.log('\nscore'); Object.entries(out.score).forEach(([s, g]) => console.log(' ', s, JSON.stringify(g)));
console.log('checks'); out.checks.forEach((c) => console.log(' ', c.name.padEnd(30), 'yes', c.yes.n, c.yes.avgR, 'no', c.no.n, c.no.avgR));
console.log('byYear', JSON.stringify(out.scoreByYear));

['emaPull', 'flatTop'].forEach((k) => { const X = out.entries[k]; console.log('\n== ' + X.name, JSON.stringify(X.all), 'A+', JSON.stringify(X.aplus), 'notA+', JSON.stringify(X.notAplus), 'full', JSON.stringify(X.full)); X.checks.forEach((c) => console.log('  ' + c.name.padEnd(34), 'yes', String(c.yes.n).padStart(5), c.yes.win, c.yes.avgR, ' no', String(c.no.n).padStart(5), c.no.win, c.no.avgR)); console.log('  years', JSON.stringify(X.years)); });
