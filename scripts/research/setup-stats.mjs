#!/usr/bin/env node
/* 常見 Day Trade Setup 真實統計（教學用）
 * 用 Alpaca 5 分鐘 K 線（09:30–16:00），只計「有人關注」嘅日子（Gap ≥ 2% 或者首 5 分鐘成交 ≥ 平時 2 倍）。
 * 每個 Setup 都用固定、機械化嘅規則：Stop 單入場、Target 2R、冇到就收市平倉；同一支 K 掂 Stop 同 Target 當 Stop（保守）。
 * 只輸出統計數字，唔輸出原始價格。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/setup-stats.mjs [--from 2024-01-01] [--to 2026-11-06] [--cache DIR] [--out data/research/setup-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/setup-stats.json');
const CACHE = arg('cache', '');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');

/* ---------- 美東時間（每個 UTC 日期只計一次時差） ---------- */
const offCache = new Map();
function etOf(ms) {
  const key = Math.floor(ms / 86400000);
  let off = offCache.get(key);
  if (off == null) {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(key * 86400000 + 12 * 3600000));
    off = 12 - Number(p.find((x) => x.type === 'hour').value); offCache.set(key, off);
  }
  const d = new Date(ms - off * 3600000);
  return { d: d.toISOString().slice(0, 10), hm: d.toISOString().slice(11, 16) };
}
/* 下載（有快取就用快取），砌成交易日：每日 78 支正常時段 K */
async function daysOf(sym) {
  const cf = CACHE ? `${CACHE}/${sym}.json` : '';
  let rows = null;
  if (cf && fs.existsSync(cf)) rows = JSON.parse(fs.readFileSync(cf, 'utf8'));
  else {
    // 每次問 6 個月，避免一次過太多頁
    rows = [];
    let a = Date.parse(FROM + 'T08:00:00Z');
    const end = Date.parse(TO + 'T23:00:00Z');
    while (a < end) {
      const b = Math.min(end, a + 183 * 86400000);
      const r = await alpacaBars([sym], '5Min', new Date(a).toISOString(), b);
      const raw = r.bars[sym];
      if (!raw || !raw.time.length) throw new Error('冇數據（可能限流）');
      raw.time.forEach((t, i) => { const e = etOf(Date.parse(t)); if (e.hm >= '09:30' && e.hm < '16:00') rows.push([e.d, e.hm, raw.open[i], raw.high[i], raw.low[i], raw.close[i], raw.volume[i]]); });
      a = b;
    }
    const last = rows.length ? rows[rows.length - 1][0] : '';
    if (last < new Date(end - 10 * 86400000).toISOString().slice(0, 10)) throw new Error('數據唔完整（最後一日 ' + last + '）');
    if (cf) fs.writeFileSync(cf, JSON.stringify(rows));
  }
  const by = new Map();
  rows.forEach(([d, hm, o, h, l, c, v]) => { if (!by.has(d)) by.set(d, []); by.get(d).push({ hm, o, h, l, c, v }); });
  const out = [];
  [...by.keys()].sort().forEach((d) => {
    const B = by.get(d);
    if (B.length < 70 || B[0].hm !== '09:30') return;
    let pv = 0, vv = 0; const vw = [];
    B.forEach((b) => { pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; vw.push(vv ? pv / vv : b.c); });
    out.push({ d, B, vw, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), v1: B[0].v });
  });
  out.forEach((x, i) => {
    const p = out[i - 1]; x.pc = p ? p.c : null;
    if (i >= 15) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      const v1 = out.slice(Math.max(0, i - 20), i).map((y) => y.v1);
      x.rvol5 = x.v1 / (v1.reduce((a, v) => a + v, 0) / v1.length);
    }
  });
  return out.filter((x) => x.atr && x.pc);
}

/* ---------- 模擬一筆交易 ----------
 * side 1 = Long，−1 = Short；由第 from 支 K 開始放 Stop 單（entry），最多等到第 until 支；
 * 開市價已經過咗 entry 就用開市價成交；同一支 K 掂 Stop 同 Target 當 Stop；冇到就收市平倉。 */
function sim(day, side, entry, stop, from, until, targetR = 2, tgtPrice = null) {
  const B = day.B, risk = side * (entry - stop);
  if (!(risk > 0)) return null;
  const tgt = tgtPrice != null ? tgtPrice : entry + side * targetR * risk;
  let k = -1, fill = null;
  for (let i = from; i <= Math.min(until, B.length - 1); i++) {
    const b = B[i];
    if (side > 0 ? b.h >= entry : b.l <= entry) { k = i; fill = side > 0 ? Math.max(entry, b.o) : Math.min(entry, b.o); break; }
  }
  if (k < 0) return null;
  if (side * (fill - stop) <= 0) return null;
  const R = (px) => (side * (px - fill)) / risk;
  for (let i = k; i < B.length; i++) {
    const b = B[i];
    const hitS = side > 0 ? b.l <= stop : b.h >= stop;
    const hitT = side > 0 ? b.h >= tgt : b.l <= tgt;
    if (hitS) return { r: R(stop), how: 'stop', k };
    if (hitT && i > k) return { r: R(tgt), how: 'target', k };
    if (hitT && i === k && side * (b.c - tgt) >= 0) return { r: R(tgt), how: 'target', k };
  }
  return { r: R(B[B.length - 1].c), how: 'close', k };
}

/* ---------- 各個 Setup（Long 規則，Short 係鏡像） ---------- */
const SETUPS = {
  orb15: { name: '15 分鐘 ORB', fn: (D) => orb(D, 3, 18) },
  orb30: { name: '30 分鐘 ORB', fn: (D) => orb(D, 6, 24) },
  flag: { name: '開市推動後第一次回調（Bull／Bear Flag）', fn: flag },
  vwapPull: { name: 'VWAP 回調（趨勢延續）', fn: vwapPull },
  vwapReclaim: { name: 'VWAP 收復（反轉）', fn: vwapReclaim },
  r2g: { name: 'Red-to-Green／Green-to-Red（穿昨收）', fn: r2g },
  gapFade: { name: 'Gap 失敗回落（Gap Fade）', fn: gapFade },
  hodBreak: { name: '午市整固後突破 HOD／LOD', fn: hodBreak },
};
function orb(D, n, until) {
  const B = D.B, hi = Math.max(...B.slice(0, n).map((b) => b.h)), lo = Math.min(...B.slice(0, n).map((b) => b.l));
  if (hi - lo > 0.75 * D.atr) return [];
  // 邊邊先穿就做邊邊（每日最多一筆）
  for (let i = n; i <= until; i++) {
    const b = B[i];
    if (b.h > hi && b.l < lo) return [];
    if (b.h > hi) return [{ side: 1, t: sim(D, 1, hi + 0.01, lo - 0.01, i, i), i }];
    if (b.l < lo) return [{ side: -1, t: sim(D, -1, lo - 0.01, hi + 0.01, i, i), i }];
  }
  return [];
}
function flag(D) {
  const B = D.B, vw = D.vw, O = D.o, a = D.atr;
  const drive = B[5].c - O;
  if (Math.abs(drive) < 0.3 * a) return [];
  const s = Math.sign(drive);
  let ext = s > 0 ? Math.max(...B.slice(0, 6).map((b) => b.h)) : Math.min(...B.slice(0, 6).map((b) => b.l));
  let inPull = false, pl = null;
  for (let i = 6; i <= 24; i++) {
    const b = B[i];
    if (s * (b.c - vw[i]) < 0) return []; // 收穿 VWAP：失效
    if (!inPull) {
      if (s > 0 ? b.h > ext : b.l < ext) { ext = s > 0 ? b.h : b.l; continue; }
      if (s * (ext - (s > 0 ? b.l : b.h)) >= 0.15 * a) { inPull = true; pl = s > 0 ? b.l : b.h; }
      continue;
    }
    pl = s > 0 ? Math.min(pl, b.l) : Math.max(pl, b.h);
    if (s * (pl - O) < 0.5 * s * (ext - O)) return []; // 回調超過推動嘅一半：失效
    const p = B[i - 1];
    // 呢支 K 嘅高位低過上一支（Flag 形成），下一支 K 穿佢高位入場
    if (s > 0 ? b.h < p.h : b.l > p.l) {
      const entry = s > 0 ? b.h + 0.01 : b.l - 0.01, stop = pl - s * 0.02 * a;
      if (s * (entry - stop) > 0.6 * a) return [];
      return [{ side: s, t: sim(D, s, entry, stop, i + 1, Math.min(i + 3, 30)), i }];
    }
  }
  return [];
}
function vwapPull(D) {
  const B = D.B, vw = D.vw, a = D.atr;
  const s = Math.sign(B[5].c - vw[5]);
  if (!s) return [];
  for (let i = 3; i < 6; i++) if (s * (B[i].c - vw[i]) < 0) return [];
  for (let i = 6; i <= 60; i++) {
    const b = B[i];
    if (s * (b.c - vw[i]) < -0.05 * a) return []; // 收穿 VWAP：趨勢失效
    const touch = s > 0 ? b.l <= vw[i] + 0.05 * a : b.h >= vw[i] - 0.05 * a;
    if (touch) {
      const entry = s > 0 ? b.h + 0.01 : b.l - 0.01;
      const stop = s > 0 ? Math.min(b.l, vw[i]) - 0.05 * a : Math.max(b.h, vw[i]) + 0.05 * a;
      if (s * (entry - stop) > 0.6 * a) return [];
      return [{ side: s, t: sim(D, s, entry, stop, i + 1, i + 3), i }];
    }
  }
  return [];
}
function vwapReclaim(D) {
  const B = D.B, vw = D.vw, a = D.atr;
  const s = B[5].c < vw[5] && B[5].c < D.o ? 1 : B[5].c > vw[5] && B[5].c > D.o ? -1 : 0;
  if (!s) return [];
  for (let i = 6; i <= 42; i++) {
    const b = B[i];
    if (s * (b.c - vw[i]) > 0) {
      const entry = s > 0 ? b.h + 0.01 : b.l - 0.01;
      const seg = B.slice(Math.max(0, i - 5), i + 1);
      const stop = s > 0 ? Math.min(...seg.map((x) => x.l)) - 0.02 * a : Math.max(...seg.map((x) => x.h)) + 0.02 * a;
      if (s * (entry - stop) > 0.6 * a) return [];
      return [{ side: s, t: sim(D, s, entry, stop, i + 1, i + 3), i }];
    }
  }
  return [];
}
function r2g(D) {
  const B = D.B, a = D.atr, g = D.o / D.pc - 1;
  if (Math.abs(g) < 0.02) return [];
  const s = g < 0 ? 1 : -1; // Gap 低開 → 升穿昨收做多；Gap 高開 → 跌穿昨收沽空
  let ext = s > 0 ? B[0].l : B[0].h;
  for (let i = 1; i <= 24; i++) {
    const b = B[i];
    if (s > 0 ? b.h >= D.pc : b.l <= D.pc) {
      const stop = ext - s * 0.02 * a;
      if (s * (D.pc - stop) > 0.75 * a) return [];
      return [{ side: s, t: sim(D, s, D.pc + s * 0.01, stop, i, i), i }];
    }
    ext = s > 0 ? Math.min(ext, b.l) : Math.max(ext, b.h);
  }
  return [];
}
function gapFade(D) {
  const B = D.B, vw = D.vw, a = D.atr, g = D.o / D.pc - 1;
  if (Math.abs(g) < 0.02) return [];
  const s = g > 0 ? -1 : 1; // Gap 高開失敗 → 沽空
  const orH = Math.max(...B.slice(0, 6).map((b) => b.h)), orL = Math.min(...B.slice(0, 6).map((b) => b.l));
  for (let i = 6; i <= 30; i++) {
    const b = B[i];
    const broke = s < 0 ? b.c < orL && b.c < vw[i] : b.c > orH && b.c > vw[i];
    if (broke) {
      const entry = s < 0 ? b.l - 0.01 : b.h + 0.01;
      const seg = B.slice(Math.max(0, i - 2), i + 1);
      const stop = s < 0 ? Math.max(...seg.map((x) => x.h)) + 0.02 * a : Math.min(...seg.map((x) => x.l)) - 0.02 * a;
      if (s * (entry - stop) > 0.6 * a) return [];
      const t = sim(D, s, entry, stop, i + 1, i + 3);
      if (t) t.fill = s < 0 ? Math.min(...B.slice(i + 1).map((x) => x.l)) <= D.pc : Math.max(...B.slice(i + 1).map((x) => x.h)) >= D.pc;
      return [{ side: s, t, i }];
    }
  }
  return [];
}
function hodBreak(D) {
  const B = D.B, a = D.atr;
  for (let i = 24; i <= 66; i++) {
    const base = B.slice(i - 6, i);
    const bh = Math.max(...base.map((b) => b.h)), bl = Math.min(...base.map((b) => b.l));
    if (bh - bl > 0.3 * a) continue;
    const hod = Math.max(...B.slice(0, i).map((b) => b.h)), lod = Math.min(...B.slice(0, i).map((b) => b.l));
    if (hod - bh <= 0.1 * a) return [{ side: 1, t: sim(D, 1, hod + 0.01, bl - 0.02 * a, i, i + 6), i }];
    if (bl - lod <= 0.1 * a) return [{ side: -1, t: sim(D, -1, lod - 0.01, bh + 0.02 * a, i, i + 6), i }];
  }
  return [];
}

/* ---------- 主程式 ---------- */
const qqq = new Map();
(await daysOf('QQQ')).forEach((x) => qqq.set(x.d, x));
const trades = Object.fromEntries(Object.keys(SETUPS).map((k) => [k, []]));
let inPlay = 0, allDays = 0;
const queue = [...UNIVERSE];
await Promise.all([0].map(async () => {
  while (queue.length) {
    const sym = queue.shift();
    let days = null;
    for (let k = 0; k < 4 && !days; k++) {
      try { days = await daysOf(sym); } catch (e) { console.error(sym, '失敗，等', 15 * (k + 1), '秒再試：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); }
    }
    if (!days) continue;
    let n = 0;
    days.forEach((D) => {
      allDays++;
      const g = D.o / D.pc - 1;
      if (!(Math.abs(g) >= 0.02 || D.rvol5 >= 2)) return;
      inPlay++; n++;
      const Q = qqq.get(D.d);
      Object.entries(SETUPS).forEach(([k, S]) => {
        S.fn(D).forEach((x) => {
          if (!x.t) return;
          const qAligned = Q && Q.B[x.i] ? Math.sign(Q.B[x.i].c - Q.vw[x.i]) === x.side : null;
          trades[k].push({ r: x.t.r, how: x.t.how, side: x.side, q: qAligned, gapWith: Math.sign(g) === x.side, year: D.d.slice(0, 4), fill: x.t.fill, hour: Math.floor((570 + x.t.k * 5) / 60) });
        });
      });
    });
    console.error(sym, days.length, '日，有人關注', n);
  }
}));

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
function summ(T) {
  if (!T.length) return { n: 0 };
  const win = T.filter((t) => t.r > 0).length, tgt = T.filter((t) => t.how === 'target').length, stp = T.filter((t) => t.how === 'stop').length;
  const avg = T.reduce((a, t) => a + t.r, 0) / T.length;
  let eq = 0, pk = 0, dd = 0; T.forEach((t) => { eq += t.r; pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq); });
  return { n: T.length, win: p1(win / T.length), target: p1(tgt / T.length), stop: p1(stp / T.length), avgR: r2(avg), avgRCost: r2(avg - 0.05) };
}
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  daysAll: allDays, daysInPlay: inPlay,
  rules: {
    inPlay: 'Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍',
    exit: 'Target 2R；同一支 K 掂 Stop 同 Target 當 Stop；冇到就收市平倉',
    cost: 'avgRCost = 平均 R 減 0.05R（大約嘅佣金同滑價）',
    qqq: '入場訊號嗰刻 QQQ 喺自己嘅 VWAP 同方向（做多：QQQ 喺 VWAP 上面）',
  },
  setups: {},
};
Object.entries(SETUPS).forEach(([k, S]) => {
  const T = trades[k];
  out.setups[k] = {
    name: S.name, all: summ(T), long: summ(T.filter((t) => t.side > 0)), short: summ(T.filter((t) => t.side < 0)),
    qqqWith: summ(T.filter((t) => t.q === true)), qqqAgainst: summ(T.filter((t) => t.q === false)),
    gapWith: summ(T.filter((t) => t.gapWith)), gapAgainst: summ(T.filter((t) => !t.gapWith)),
    years: Object.fromEntries([...new Set(T.map((t) => t.year))].sort().map((y) => [y, summ(T.filter((t) => t.year === y))])),
    ...(k === 'gapFade' ? { fillRate: p1(T.filter((t) => t.fill).length / Math.max(1, T.length)) } : {}),
  };
});
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
Object.entries(out.setups).forEach(([k, s]) => console.log(k.padEnd(12), JSON.stringify(s.all), 'QQQ順', JSON.stringify(s.qqqWith), 'QQQ逆', JSON.stringify(s.qqqAgainst)));
