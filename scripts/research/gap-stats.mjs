#!/usr/bin/env node
/* 跳空（Gap）真實統計：Gap ≥ 3% 嘅日子，收市係延續、橫行定回落？
 * 用 Alpaca 5 分鐘 K 線（正常交易時段 09:30–16:00）。只輸出統計數字（唔包原始價格）。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/gap-stats.mjs [--from 2024-01-01] [--to 2026-11-05] [--out data/research/gap-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

/* 快速美東時間：每個 UTC 日期只用 Intl 計一次時差 */
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
function toBars(raw) {
  return raw.time.map((t, i) => { const e = etOf(Date.parse(t)); return { d: e.d, hm: e.hm, o: raw.open[i], h: raw.high[i], l: raw.low[i], c: raw.close[i], v: raw.volume[i] }; });
}

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-05');
const OUT = arg('out', 'data/research/gap-stats.json');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');
const MIN_GAP = 3;

const days = [];
async function one(sym) {
  const r = await alpacaBars([sym], '5Min', FROM + 'T08:00:00Z', Date.parse(TO + 'T23:00:00Z'));
  const raw = r.bars[sym];
  if (!raw || !raw.time.length) { console.error(sym, '冇數據'); return; }
  const by = new Map();
  for (const b of toBars(raw)) {
    if (b.hm < '09:30' || b.hm >= '16:00') continue;
    if (!by.has(b.d)) by.set(b.d, []);
    by.get(b.d).push(b);
  }
  const list = [...by.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).filter(([, B]) => B.length >= 60)
    .map(([d, B]) => ({ d, B, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((x) => x.h)), l: Math.min(...B.map((x) => x.l)), v1: B[0].hm === '09:30' ? B[0].v : null }));
  let n = 0;
  for (let i = 15; i < list.length; i++) {
    const x = list[i], p = list[i - 1];
    const gap = (x.o / p.c - 1) * 100;
    if (Math.abs(gap) < MIN_GAP) continue;
    const win = list.slice(i - 14, i);
    const atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : list[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
    const v1s = list.slice(Math.max(0, i - 20), i).map((y) => y.v1).filter((v) => v != null);
    const v1avg = v1s.length ? v1s.reduce((a, v) => a + v, 0) / v1s.length : null;
    const dir = gap > 0 ? 1 : -1;
    const first = x.B.filter((b) => b.hm < '10:00');
    if (first.length < 5 || x.B[0].hm !== '09:30') continue;
    const p10 = first[first.length - 1].c;
    let pv = 0, vv = 0; first.forEach((b) => { pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v; });
    const vwap10 = vv ? pv / vv : p10;
    const fromOpenAtr = (dir * (x.c - x.o)) / atr;
    const after10Atr = (dir * (x.c - p10)) / atr;
    days.push({
      sym, year: x.d.slice(0, 4), dir, gap: Math.abs(gap), gapAtr: Math.abs(x.o - p.c) / atr,
      full: dir > 0 ? x.o > p.h : x.o < p.l,
      fill: dir > 0 ? x.l <= p.c : x.h >= p.c,
      outcome: fromOpenAtr >= 0.25 ? 'go' : fromOpenAtr <= -0.25 ? 'fade' : 'flat',
      fromOpenAtr, after10Atr,
      first5: dir * (x.B[0].c - x.o) > 0,
      hold10: dir * (p10 - x.o) > 0,
      vwap10: dir * (p10 - vwap10) > 0,
      rvol5: v1avg ? x.v1 / v1avg : null,
      mfeAtr: (dir > 0 ? x.h - x.o : x.o - x.l) / atr,
    });
    n++;
  }
  console.error(sym, list.length, '日，Gap ≥ 3%：', n);
}
const queue = [...UNIVERSE];
await Promise.all([0, 1, 2].map(async () => { while (queue.length) await one(queue.shift()); }));

const pct = (a, f) => (a.length ? Math.round((a.filter(f).length / a.length) * 1000) / 10 : null);
const avg = (a, f) => (a.length ? Math.round((a.reduce((s, x) => s + f(x), 0) / a.length) * 100) / 100 : null);
function summ(a) {
  return {
    n: a.length,
    go: pct(a, (x) => x.outcome === 'go'), flat: pct(a, (x) => x.outcome === 'flat'), fade: pct(a, (x) => x.outcome === 'fade'),
    fill: pct(a, (x) => x.fill),
    closeBeyondOpen: pct(a, (x) => x.fromOpenAtr > 0),
    avgFromOpenAtr: avg(a, (x) => x.fromOpenAtr),
    after10Win: pct(a, (x) => x.after10Atr > 0), avgAfter10Atr: avg(a, (x) => x.after10Atr),
    avgMfeAtr: avg(a, (x) => x.mfeAtr),
  };
}
const groups = {};
const add = (k, f) => (groups[k] = summ(days.filter(f)));
add('all', () => true);
add('up', (x) => x.dir > 0); add('down', (x) => x.dir < 0);
add('gap3to5', (x) => x.gap < 5); add('gap5to8', (x) => x.gap >= 5 && x.gap < 8); add('gap8plus', (x) => x.gap >= 8);
add('full', (x) => x.full); add('partial', (x) => !x.full);
add('first5with', (x) => x.first5); add('first5against', (x) => !x.first5);
add('hold10', (x) => x.hold10); add('lose10', (x) => !x.hold10);
add('vwap10with', (x) => x.vwap10); add('vwap10against', (x) => !x.vwap10);
add('rvol5hi', (x) => x.rvol5 != null && x.rvol5 >= 3); add('rvol5lo', (x) => x.rvol5 != null && x.rvol5 < 1.5);
add('allThree', (x) => x.first5 && x.hold10 && x.vwap10); add('noneThree', (x) => !x.first5 && !x.hold10 && !x.vwap10);
add('allThreeRvol', (x) => x.first5 && x.hold10 && x.vwap10 && x.rvol5 != null && x.rvol5 >= 3);
const years = {}; [...new Set(days.map((x) => x.year))].sort().forEach((y) => (years[y] = summ(days.filter((x) => x.year === y))));

const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, minGapPct: MIN_GAP, universe: UNIVERSE,
  source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  definitions: {
    go: '收市比開市價再向 Gap 方向行多過 0.25 ATR',
    fade: '收市比開市價向反方向行多過 0.25 ATR',
    flat: '其餘（收市同開市價相差唔夠 0.25 ATR）',
    fill: '當日有冇掂返昨日收市價（補 Gap）',
    after10: '10:00 嗰刻向 Gap 方向入，揸到收市',
    rvol5: '開市首 5 分鐘成交 ÷ 過去 20 日首 5 分鐘平均',
  },
  groups, years,
};
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(groups, null, 1));
