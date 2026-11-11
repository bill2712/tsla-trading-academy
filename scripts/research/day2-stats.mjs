#!/usr/bin/env node
/* 「昨日有人關注嘅股，今日仲做唔做得？」嘅基本統計（教學同每日選股用）
 * 第一日 = 有人關注（Gap ≥ 2% 或者首 5 分鐘成交 ≥ 平時 2 倍）。睇第二日：仲有冇人關注、波幅、方向有冇延續、做多 Setup 成績。
 * 用 Alpaca 5 分鐘 K 線（正常交易時段），50 隻成交大嘅美股。只輸出統計數字。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/day2-stats.mjs [--cache DIR] [--out data/research/day2-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/day2-stats.json');
const CACHE = arg('cache', '');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');
const AM_END = 23;

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
const hiOf = (B, a, b) => Math.max(...B.slice(a, b + 1).map((x) => x.h));
const loOf = (B, a, b) => Math.min(...B.slice(a, b + 1).map((x) => x.l));
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
    out.push({ d, B, vw, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), v1: B[0].v });
  });
  out.forEach((x, i) => {
    const p = out[i - 1]; x.i = i; x.pc = p ? p.c : null;
    if (i >= 21) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      x.rvol5 = x.v1 / (out.slice(i - 20, i).reduce((a, y) => a + y.v1, 0) / 20);
      x.gap = x.o / x.pc - 1;
      x.ip = Math.abs(x.gap) >= 0.02 || x.rvol5 >= 2;
    }
  });
  return out;
}
/* 15 分鐘 ORB（順 dir 方向；dir = 1 做多、−1 沽空）：Target 2R／Stop／11:30 平倉 */
function orb15(D, dir) {
  const B = D.B, hi = hiOf(B, 0, 2), lo = loOf(B, 0, 2);
  if (hi - lo > 0.75 * D.atr) return null;
  const e = dir > 0 ? hi + 0.01 : lo - 0.01, st = dir > 0 ? lo - 0.01 : hi + 0.01, risk = Math.abs(e - st), tg = e + dir * 2 * risk;
  for (let i = 3; i <= 12; i++) {
    const b = B[i];
    if (dir > 0 ? (b.l < lo && b.h <= hi) : (b.h > hi && b.l >= lo)) return null;
    if (dir > 0 ? b.h > hi : b.l < lo) {
      for (let j = i; j <= AM_END; j++) {
        const x = B[j];
        if (dir > 0 ? x.l <= st : x.h >= st) return { k: i, r: -1 };
        if ((dir > 0 ? x.h >= tg : x.l <= tg) && (j > i || (dir > 0 ? x.c >= tg : x.c <= tg))) return { k: i, r: 2 };
      }
      return { k: i, r: dir * (B[AM_END].c - e) / risk };
    }
  }
  return null;
}

const qqq = new Map();
(await daysOf('QQQ')).forEach((x) => qqq.set(x.d, x));
const rows = []; // 每個「第二日」一行
let all = 0, allIp = 0, allRv = 0; const allRange = [];
for (const sym of UNIVERSE) {
  let days = null;
  for (let k = 0; k < 4 && !days; k++) { try { days = await daysOf(sym); } catch (e) { console.error(sym, '失敗：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); } }
  if (!days) continue;
  days.forEach((D) => {
    const P = days[D.i - 1];
    if (!D.atr || !P || !P.atr) return;
    all++; if (D.ip) allIp++; if (D.rvol5 >= 2) allRv++; allRange.push((D.h - D.l) / D.atr);
    if (!P.ip) return;
    // 第一日方向：收市對前收（即係包埋 Gap）；±2% 以內當「冇方向」
    const chg1 = P.c / P.pc - 1, dir = chg1 >= 0.02 ? 1 : chg1 <= -0.02 ? -1 : 0;
    const pos = (P.c - P.l) / Math.max(1e-9, P.h - P.l); // 第一日收市喺全日波幅嘅位置（1 = 最高）
    const strong = dir > 0 ? pos >= 0.75 : dir < 0 ? pos <= 0.25 : false; // 收喺順方向嗰邊
    const Q = qqq.get(D.d);
    const o = dir ? orb15(D, dir) : null;
    rows.push({
      dir, strong, ip2: D.ip, rv2: D.rvol5 >= 2, rv2lvl: D.rvol5, gapWith: dir ? D.gap * dir >= 0.005 : null, gapAgainst: dir ? D.gap * dir <= -0.005 : null,
      range: (D.h - D.l) / D.atr, amRange: (hiOf(D.B, 0, AM_END) - loOf(D.B, 0, AM_END)) / D.atr,
      cont: dir ? (D.c - D.o) * dir > 0 : null, contAm: dir ? (D.B[AM_END].c - D.B[1].o) * dir > 0 : null, amMove: dir ? (D.B[AM_END].c - D.B[1].o) * dir / D.atr : null,
      beyond: dir ? (dir > 0 ? D.h > P.h : D.l < P.l) : null, // 第二日有冇行過第一日高／低位
      orb: o ? o.r : null, orbQ: o && Q && Q.B[o.k - 1] ? (dir > 0 ? Q.B[o.k - 1].c > Q.vw[o.k - 1] : Q.B[o.k - 1].c < Q.vw[o.k - 1]) : null,
    });
  });
  console.error(sym, days.length);
}
const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
const avg = (A) => (A.length ? A.reduce((a, v) => a + v, 0) / A.length : null);
const pct = (A, f) => (A.length ? p1(A.filter(f).length / A.length) : null);
const dirRows = rows.filter((x) => x.dir);
const grp = (A) => {
  const O = A.filter((x) => x.orb != null);
  return { n: A.length, cont: pct(A, (x) => x.cont), contAm: pct(A, (x) => x.contAm), amMoveAtr: A.length ? r2(avg(A.map((x) => x.amMove))) : null, beyond: pct(A, (x) => x.beyond), rangeAtr: A.length ? r2(avg(A.map((x) => x.range))) : null,
    orbN: O.length, orbWin: pct(O, (x) => x.orb > 0), orbAvgR: O.length ? r2(avg(O.map((x) => x.orb))) : null };
};
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  rules: {
    day1: '第一日「有人關注」= Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍',
    dir: '第一日方向 = 收市對前一日收市：升 ≥ 2% 當向上、跌 ≥ 2% 當向下；其餘當冇方向',
    strong: '收得強 = 第一日收市喺全日波幅順方向嗰邊嘅 25% 之內',
    cont: '延續 = 第二日開市到收市，方向同第一日一樣',
    orb: '第二日順第一日方向做 15 分鐘 ORB：Target 2R／Stop／11:30 平倉',
    aplus: '第二日首 5 分鐘成交 ≥ 平時 2 倍，而且入場前 QQQ 喺自己 VWAP 同一邊',
  },
  base: { days: all, inPlayPct: p1(allIp / all), rvol2Pct: p1(allRv / all), rangeAtr: r2(avg(allRange)) },
  afterInPlay: {
    n: rows.length, inPlayAgainPct: pct(rows, (x) => x.ip2), rvol2AgainPct: pct(rows, (x) => x.rv2), rangeAtr: r2(avg(rows.map((x) => x.range))),
    rangeAtrIfRvol2: r2(avg(rows.filter((x) => x.rv2).map((x) => x.range))), rangeAtrIfQuiet: r2(avg(rows.filter((x) => !x.rv2).map((x) => x.range))),
  },
  direction: {
    all: grp(dirRows), up: grp(dirRows.filter((x) => x.dir > 0)), down: grp(dirRows.filter((x) => x.dir < 0)),
    strong: grp(dirRows.filter((x) => x.strong)), weak: grp(dirRows.filter((x) => !x.strong)),
    rvol2: grp(dirRows.filter((x) => x.rv2)), quiet: grp(dirRows.filter((x) => !x.rv2)),
    gapWith: grp(dirRows.filter((x) => x.gapWith)), gapAgainst: grp(dirRows.filter((x) => x.gapAgainst)),
    strongRvol2: grp(dirRows.filter((x) => x.strong && x.rv2)),
    aplus: grp(dirRows.filter((x) => x.rv2 && x.orbQ === true)), notAplus: grp(dirRows.filter((x) => x.orb != null && !(x.rv2 && x.orbQ === true))),
    upRvol2: grp(dirRows.filter((x) => x.dir > 0 && x.rv2)), upQuiet: grp(dirRows.filter((x) => x.dir > 0 && !x.rv2)),
    upAplus: grp(dirRows.filter((x) => x.dir > 0 && x.rv2 && x.orbQ === true)),
  },
};
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('base', JSON.stringify(out.base));
console.log('afterInPlay', JSON.stringify(out.afterInPlay));
Object.entries(out.direction).forEach(([k, g]) => console.log(k.padEnd(12), JSON.stringify(g)));
