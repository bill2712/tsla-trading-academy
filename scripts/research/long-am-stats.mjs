#!/usr/bin/env node
/* 頭 2 小時（09:30–11:30）只做多：日線升勢股 vs 其他，10 個 Setup 嘅真實統計（教學用）
 * 用 Alpaca 5 分鐘 K 線（正常交易時段）。只計「有人關注」嘅日子（Gap ≥ 2% 或者首 5 分鐘成交 ≥ 平時 2 倍）。
 * 日線趨勢（用昨日收市計）：升勢 = 昨收 > 20 日線 > 50 日線；跌勢 = 昨收 < 20 日線 < 50 日線；其餘 = 橫行。
 * 入場：Buy Stop；一定要 11:30 前觸發。出場：Target 2R／Stop／11:30 平倉（另計揸到收市）。同一支 K 掂 Stop 同 Target 當 Stop。
 * 只輸出統計數字，唔輸出原始價格。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/long-am-stats.mjs [--cache DIR] [--out data/research/long-am-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/long-am-stats.json');
const CACHE = arg('cache', '');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');
const AM_END = 23; // 第 23 支 K（11:25–11:30）收市 = 11:30 平倉

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
async function daysOf(sym) {
  const cf = CACHE ? `${CACHE}/${sym}.json` : '';
  let rows = null;
  if (cf && fs.existsSync(cf)) rows = JSON.parse(fs.readFileSync(cf, 'utf8'));
  else {
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
    // 5 分鐘 EMA 9（只用正常時段 K，所以頭 9 支未有數）
    const em = []; let e = null; const k = 2 / 10;
    B.forEach((b, i) => { if (i < 8) { em.push(null); return; } if (e == null) e = B.slice(0, 9).reduce((a, x) => a + x.c, 0) / 9; else e = b.c * k + e * (1 - k); em.push(e); });
    out.push({ d, B, vw, em, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), v1: B[0].v });
  });
  out.forEach((x, i) => {
    const p = out[i - 1]; x.pc = p ? p.c : null; x.pdh = p ? p.h : null; x.pdl = p ? p.l : null;
    if (i >= 50) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      const v1 = out.slice(i - 20, i).map((y) => y.v1);
      x.rvol5 = x.v1 / (v1.reduce((a, v) => a + v, 0) / v1.length);
      const s20 = out.slice(i - 20, i).reduce((a, y) => a + y.c, 0) / 20, s50 = out.slice(i - 50, i).reduce((a, y) => a + y.c, 0) / 50;
      const hi20 = Math.max(...out.slice(i - 20, i).map((y) => y.h));
      x.trend = x.pc > s20 && s20 > s50 ? 'up' : x.pc < s20 && s20 < s50 ? 'down' : 'mixed';
      x.nearHigh = x.pc >= hi20 * 0.95;
      x.ret20 = x.pc / out[i - 20].c - 1;
    }
  });
  return out.filter((x) => x.atr && x.pc && x.trend);
}

/* 模擬一筆做多：由第 from 支 K 開始放 Buy Stop，最多等到第 until 支（唔可以遲過 11:30）。
 * 回傳 rAm（11:30 平倉）同 rEod（揸到收市），兩個都用 Target 2R／Stop。 */
function sim(D, entry, stop, from, until) {
  const B = D.B, risk = entry - stop;
  if (!(risk > 0)) return null;
  const tgt = entry + 2 * risk;
  let k = -1, fill = null;
  for (let i = from; i <= Math.min(until, AM_END); i++) { if (B[i].h >= entry) { k = i; fill = Math.max(entry, B[i].o); break; } }
  if (k < 0 || fill <= stop) return null;
  const R = (px) => (px - fill) / risk;
  const run = (last) => {
    for (let i = k; i <= last; i++) {
      const b = B[i];
      if (b.l <= stop) return { r: R(stop), how: 'stop' };
      if (b.h >= tgt && (i > k || b.c >= tgt)) return { r: R(tgt), how: 'target' };
    }
    return { r: R(B[last].c), how: 'time' };
  };
  const am = run(AM_END), eod = run(B.length - 1);
  return { k, rAm: am.r, howAm: am.how, rEod: eod.r, howEod: eod.how, riskAtr: risk / D.atr };
}
const hiOf = (B, a, b) => Math.max(...B.slice(a, b + 1).map((x) => x.h));
const loOf = (B, a, b) => Math.min(...B.slice(a, b + 1).map((x) => x.l));

function orb(D, n, until, maxAtr) {
  const B = D.B, hi = hiOf(B, 0, n - 1), lo = loOf(B, 0, n - 1);
  if (hi - lo > maxAtr * D.atr) return null;
  for (let i = n; i <= until; i++) {
    if (B[i].l < lo && B[i].h <= hi) return null; // 先跌穿區間低位：唔做多
    if (B[i].h > hi) return sim(D, hi + 0.01, lo - 0.01, i, i);
  }
  return null;
}
const SETUPS = {
  orb5: { name: '5 分鐘 ORB 做多', fn: (D) => orb(D, 1, 6, 0.5) },
  orb15: { name: '15 分鐘 ORB 做多', fn: (D) => orb(D, 3, 12, 0.75) },
  orb30: { name: '30 分鐘 ORB 做多', fn: (D) => orb(D, 6, 18, 0.75) },
  flag: {
    name: '開市推動後第一次回調（Bull Flag）', fn(D) {
      const B = D.B, vw = D.vw, O = D.o, a = D.atr;
      if (B[5].c - O < 0.3 * a) return null;
      let ext = hiOf(B, 0, 5), inPull = false, pl = null;
      for (let i = 6; i <= 21; i++) {
        const b = B[i];
        if (b.c < vw[i]) return null;
        if (!inPull) { if (b.h > ext) { ext = b.h; continue; } if (ext - b.l >= 0.15 * a) { inPull = true; pl = b.l; } continue; }
        pl = Math.min(pl, b.l);
        if (pl - O < 0.5 * (ext - O)) return null;
        if (b.h < B[i - 1].h) {
          const entry = b.h + 0.01, stop = pl - 0.02 * a;
          if (entry - stop > 0.6 * a) return null;
          return sim(D, entry, stop, i + 1, i + 3);
        }
      }
      return null;
    },
  },
  vwapPull: {
    name: 'VWAP 第一次回調', fn(D) {
      const B = D.B, vw = D.vw, a = D.atr;
      for (let i = 3; i < 6; i++) if (B[i].c < vw[i]) return null;
      for (let i = 6; i <= 21; i++) {
        const b = B[i];
        if (b.c < vw[i] - 0.05 * a) return null;
        if (b.l <= vw[i] + 0.05 * a) {
          const entry = b.h + 0.01, stop = Math.min(b.l, vw[i]) - 0.05 * a;
          if (entry - stop > 0.6 * a) return null;
          return sim(D, entry, stop, i + 1, i + 3);
        }
      }
      return null;
    },
  },
  ema9Pull: {
    name: 'EMA 9 回調（強勢延續）', fn(D) {
      const B = D.B, vw = D.vw, em = D.em, a = D.atr;
      for (let i = 11; i <= 21; i++) {
        const b = B[i];
        if (em[i] == null || em[i - 3] == null) continue;
        const strong = em[i - 1] > em[i - 3] && B[i - 1].c > em[i - 1] && B[i - 2].c > em[i - 2] && b.c > vw[i] && b.c > D.o && em[i] > vw[i];
        if (!strong) continue;
        if (b.l <= em[i] + 0.03 * a && b.c >= em[i] - 0.05 * a) {
          const entry = b.h + 0.01, stop = Math.min(b.l, em[i]) - 0.03 * a;
          if (entry - stop > 0.5 * a) return null;
          return sim(D, entry, stop, i + 1, i + 2);
        }
      }
      return null;
    },
  },
  pdhBreak: {
    name: '升穿昨日高位（PDH Break）', fn(D) {
      const B = D.B, a = D.atr;
      if (!(D.o < D.pdh) || D.pdh - D.o > a) return null;
      for (let i = 1; i <= AM_END; i++) {
        if (B[i].h >= D.pdh) {
          const stop = loOf(B, Math.max(0, i - 3), i - 1) - 0.02 * a;
          const risk = D.pdh + 0.01 - stop;
          if (risk > 0.6 * a || risk < 0.05 * a) return null;
          return sim(D, D.pdh + 0.01, stop, i, i);
        }
      }
      return null;
    },
  },
  pdhRetest: {
    name: 'Gap 高開後回試昨日高位（PDH Retest）', fn(D) {
      const B = D.B, a = D.atr;
      if (!(D.o > D.pdh)) return null;
      for (let i = 1; i <= 18; i++) {
        const b = B[i];
        if (b.c < D.pdh - 0.1 * a) return null; // 收穿昨日高：失敗
        if (b.l <= D.pdh + 0.05 * a && b.c > D.pdh) {
          const entry = b.h + 0.01, stop = Math.min(b.l, D.pdh) - 0.05 * a;
          if (entry - stop > 0.6 * a) return null;
          return sim(D, entry, stop, i + 1, i + 3);
        }
      }
      return null;
    },
  },
  r2g: {
    name: 'Red-to-Green（升穿昨收）', fn(D) {
      const B = D.B, a = D.atr;
      if (D.o / D.pc - 1 > -0.02) return null;
      let ext = B[0].l;
      for (let i = 1; i <= AM_END; i++) {
        if (B[i].h >= D.pc) { const stop = ext - 0.02 * a; if (D.pc - stop > 0.75 * a) return null; return sim(D, D.pc + 0.01, stop, i, i); }
        ext = Math.min(ext, B[i].l);
      }
      return null;
    },
  },
  flatTop: {
    name: '高位窄幅整固後突破（Flat Top／HOD Break）', fn(D) {
      const B = D.B, vw = D.vw, a = D.atr;
      for (let i = 8; i <= 21; i++) {
        const bh = hiOf(B, i - 4, i - 1), bl = loOf(B, i - 4, i - 1);
        if (bh - bl > 0.25 * a) continue;
        const hod = hiOf(B, 0, i - 1);
        if (hod - bh > 0.08 * a || bl < vw[i - 1] || hod - D.o < 0.25 * a) continue;
        return sim(D, hod + 0.01, bl - 0.02 * a, i, i + 3);
      }
      return null;
    },
  },
};

const qqq = new Map();
(await daysOf('QQQ')).forEach((x) => qqq.set(x.d, x));
const trades = Object.fromEntries(Object.keys(SETUPS).map((k) => [k, []]));
const base = [];
let allDays = 0, inPlay = 0; const trendDays = { up: 0, mixed: 0, down: 0 };
for (const sym of UNIVERSE) {
  let days = null;
  for (let k = 0; k < 4 && !days; k++) { try { days = await daysOf(sym); } catch (e) { console.error(sym, '失敗：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); } }
  if (!days) continue;
  days.forEach((D) => {
    allDays++;
    const g = D.o / D.pc - 1;
    if (!(Math.abs(g) >= 0.02 || D.rvol5 >= 2)) return;
    inPlay++; trendDays[D.trend]++;
    const Q = qqq.get(D.d);
    const tag = { trend: D.trend, nearHigh: D.nearHigh, gap: g >= 0.02 ? 'up' : g <= -0.02 ? 'down' : 'flat', rvolHi: D.rvol5 >= 2, year: D.d.slice(0, 4), ret20: D.ret20 };
    // 基準：09:35 買入、11:30 賣出（冇 Stop），用 ATR 計
    base.push({ ...tag, am: (D.B[AM_END].c - D.B[1].o) / D.atr, q: Q ? Q.B[1].o > Q.vw[0] : null });
    Object.entries(SETUPS).forEach(([k, S]) => {
      const t = S.fn(D);
      if (!t) return;
      trades[k].push({ ...tag, ...t, q: Q && Q.B[t.k - 1] ? Q.B[t.k - 1].c > Q.vw[t.k - 1] : null, early: t.k <= 11 });
    });
  });
  console.error(sym, days.length);
}

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
function summ(T) {
  if (!T.length) return { n: 0 };
  const avg = (f) => T.reduce((a, t) => a + f(t), 0) / T.length;
  return {
    n: T.length, win: p1(T.filter((t) => t.rAm > 0).length / T.length), target: p1(T.filter((t) => t.howAm === 'target').length / T.length),
    stop: p1(T.filter((t) => t.howAm === 'stop').length / T.length), avgR: r2(avg((t) => t.rAm)), avgRCost: r2(avg((t) => t.rAm) - 0.05), avgREod: r2(avg((t) => t.rEod)),
  };
}
const SEG = {
  all: () => true,
  up: (t) => t.trend === 'up', mixed: (t) => t.trend === 'mixed', down: (t) => t.trend === 'down',
  upNearHigh: (t) => t.trend === 'up' && t.nearHigh,
  upGapUp: (t) => t.trend === 'up' && t.gap === 'up', upGapDown: (t) => t.trend === 'up' && t.gap === 'down',
  upQqq: (t) => t.trend === 'up' && t.q === true, upQqqNot: (t) => t.trend === 'up' && t.q === false,
  upRvol: (t) => t.trend === 'up' && t.rvolHi,
  upBest: (t) => t.trend === 'up' && t.q === true && t.rvolHi,
  best: (t) => t.q === true && t.rvolHi,
  notUpBest: (t) => t.trend !== 'up' && t.q === true && t.rvolHi,
  upBest2024: (t) => t.trend === 'up' && t.q === true && t.rvolHi && t.year === '2024',
  upBest2025: (t) => t.trend === 'up' && t.q === true && t.rvolHi && t.year === '2025',
  upBest2026: (t) => t.trend === 'up' && t.q === true && t.rvolHi && t.year === '2026',
  upStrong20: (t) => t.trend === 'up' && t.ret20 >= 0.1,
  upEarly: (t) => t.trend === 'up' && t.early, upLate: (t) => t.trend === 'up' && !t.early,
  up2024: (t) => t.trend === 'up' && t.year === '2024', up2025: (t) => t.trend === 'up' && t.year === '2025', up2026: (t) => t.trend === 'up' && t.year === '2026',
};
const bsum = (T) => (T.length ? { n: T.length, up: p1(T.filter((t) => t.am > 0).length / T.length), avgAtr: r2(T.reduce((a, t) => a + t.am, 0) / T.length) } : { n: 0 });
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  daysAll: allDays, daysInPlay: inPlay, trendDays,
  rules: {
    inPlay: 'Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍',
    trend: '升勢 = 昨日收市 > 20 日線 > 50 日線；跌勢 = 昨日收市 < 20 日線 < 50 日線；其餘 = 橫行',
    nearHigh: '昨日收市喺 20 日高位 5% 之內',
    exit: 'Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉。同一支 K 掂 Stop 同 Target 當 Stop',
    cost: '扣成本後 = 平均 R 減 0.05R',
    qqq: '入場前一支 5 分鐘 K 收市時，QQQ 喺自己 VWAP 上面（冇偷睇之後嘅價）',
    ema9: '5 分鐘 EMA 9 只用正常時段 K 線計（冇包盤前）',
  },
  baseline: {
    note: '09:35 買入、11:30 賣出（冇 Stop），單位 ATR',
    all: bsum(base), up: bsum(base.filter((t) => t.trend === 'up')), mixed: bsum(base.filter((t) => t.trend === 'mixed')), down: bsum(base.filter((t) => t.trend === 'down')),
    upGapUp: bsum(base.filter((t) => t.trend === 'up' && t.gap === 'up')), upGapDown: bsum(base.filter((t) => t.trend === 'up' && t.gap === 'down')),
    downGapUp: bsum(base.filter((t) => t.trend === 'down' && t.gap === 'up')), downGapDown: bsum(base.filter((t) => t.trend === 'down' && t.gap === 'down')),
    upNearHigh: bsum(base.filter((t) => t.trend === 'up' && t.nearHigh)),
  },
  setups: {},
};
Object.entries(SETUPS).forEach(([k, S]) => { out.setups[k] = { name: S.name }; Object.entries(SEG).forEach(([s, f]) => (out.setups[k][s] = summ(trades[k].filter(f)))); });
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('days', allDays, 'inPlay', inPlay, trendDays);
console.log('baseline', JSON.stringify(out.baseline));
Object.entries(out.setups).forEach(([k, s]) => console.log(k.padEnd(10), ['all', 'up', 'best', 'upBest', 'notUpBest', 'upBest2024', 'upBest2025', 'upBest2026', 'upQqq', 'upRvol'].map((x) => `${x}:${s[x].n}/${s[x].win}%/${s[x].avgR}/${s[x].avgREod}`).join('  ')));
