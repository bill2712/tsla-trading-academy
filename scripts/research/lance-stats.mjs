#!/usr/bin/env node
/* Lance Breitstein（@TheOneLanceB）公開講法嘅驗證（教學用）
 * 將佢公開講過嘅三個概念寫成固定機械規則，用 50 隻成交大嘅美股、Alpaca 5 分鐘 K 線（正常時段）測試：
 *  1. VWAP 趨勢規則：「穩定喺 VWAP 下面唔做多、穩定喺 VWAP 上面唔沽空，除非投降式（capitulation）」
 *     用同一個普通入場（回調後升穿上一支 K 高位），按入場前 6 支 K 同 VWAP 嘅關係分組比較。
 *  2. 投降式急跌之後：即刻撈底（接飛刀）vs 等「V 嘅右邊」（升穿上一支 K 高位、低位唔再創新低先入）。
 *  3. 四日力竭跳空（Four-day exhaustion gap）：連升三日之後第四日大幅高開 → 等跌穿上一支 K 低位先沽空。
 * 呢啲係我哋對公開資料嘅簡化演繹，唔等於 Lance 本人嘅做法（佢有判斷、揀股、主要做極端行情同細價股）。
 * 只輸出統計數字，唔輸出原始價格。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/lance-stats.mjs [--cache DIR] [--out data/research/lance-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/lance-stats.json');
const CACHE = arg('cache', '');
const UNIVERSE = ('TSLA NVDA AAPL AMD META AMZN MSFT GOOGL AVGO NFLX PLTR COIN MU SMCI MSTR HOOD ARM INTC ORCL CRM ADBE SHOP UBER ABNB ' +
  'SNOW CRWD PANW NET DDOG MRVL QCOM LRCX AMAT ROKU PYPL RIVN SOFI AFRM UPST BABA PDD DIS BA NKE SBUX LLY UNH CVNA DKNG RBLX').split(' ');

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
    out.push({ d, B, vw, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), vol: vv });
  });
  out.forEach((x, i) => {
    const p = out[i - 1]; x.i = i; x.pc = p ? p.c : null;
    if (i >= 20) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      x.vol20 = out.slice(i - 20, i).reduce((a, y) => a + y.vol, 0) / 20;
    }
  });
  return out;
}

/* 一筆交易：side 1 = 做多、−1 = 沽空。mode 'stop' = Stop 單觸發（升穿／跌穿 entry）；'close' = 喺第 k 支 K 收市價即刻成交。
 * 出場：Target（tgt 價）／Stop／收市平倉。同一支 K 掂 Stop 同 Target 當 Stop。 */
function trade(D, side, entry, stop, from, until, tgt, mode = 'stop') {
  const B = D.B, risk = side * (entry - stop);
  if (!(risk > 0)) return null;
  let k = -1, fill = null;
  if (mode === 'close') { k = from; fill = B[from].c; }
  else for (let i = from; i <= Math.min(until, B.length - 2); i++) {
    if (side > 0 ? B[i].h >= entry : B[i].l <= entry) { k = i; fill = side > 0 ? Math.max(entry, B[i].o) : Math.min(entry, B[i].o); break; }
  }
  if (k < 0 || side * (fill - stop) <= 0) return null;
  const rk = side * (fill - stop); // 實際風險（成交價計）
  if (tgt != null && side * (tgt - fill) <= 0) return null;
  const R = (px) => (side * (px - fill)) / rk;
  for (let i = mode === 'close' ? k + 1 : k; i < B.length; i++) {
    const b = B[i];
    if (side > 0 ? b.l <= stop : b.h >= stop) return { r: R(stop), how: 'stop', k };
    if (tgt != null && (side > 0 ? b.h >= tgt : b.l <= tgt) && (i > k || mode === 'close' || (side > 0 ? b.c >= tgt : b.c <= tgt))) return { r: R(tgt), how: 'target', k };
  }
  return { r: R(B[B.length - 1].c), how: 'time', k };
}

const T = { vwapAbove: [], vwapBelow: [], vwapMixed: [], knife2R: [], knifeVwap: [], rsv2R: [], rsvVwap: [], exhaustShort: [] };
let days = 0, capDays = 0;
for (const sym of UNIVERSE) {
  let DD = null;
  for (let k = 0; k < 4 && !DD; k++) { try { DD = await daysOf(sym); } catch (e) { console.error(sym, '失敗：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); } }
  if (!DD) continue;
  DD.forEach((D) => {
    if (!(D.atr && D.pc)) return;
    days++;
    const B = D.B, a = D.atr;

    /* 1. VWAP 趨勢規則：10:00–11:30，第一次「陰燭回調之後升穿上一支 K 高位」做多 */
    for (let i = 7; i <= 23; i++) {
      const p = B[i - 1];
      if (!(p.c < p.o)) continue;
      const entry = p.h + 0.01, stop = Math.min(p.l, B[i - 2].l, B[i - 3].l) - 0.01;
      if (entry - stop > 0.5 * a || entry - stop < 0.03 * a) continue;
      if (!(B[i].h >= entry)) continue;
      const t = trade(D, 1, entry, stop, i, i, entry + 2 * (entry - stop));
      if (!t) break;
      let up = 0, dn = 0; for (let j = i - 6; j < i; j++) { if (B[j].c > D.vw[j]) up++; else dn++; }
      (up === 6 ? T.vwapAbove : dn === 6 ? T.vwapBelow : T.vwapMixed).push(t);
      break;
    }

    /* 2. 投降式急跌：10:00–14:00，一支 K 創當日新低、成交 ≥ 當日之前平均 2.5 倍、波幅 ≥ 0.25 ATR、
     *    收市離 VWAP ≥ 1.0 ATR、比開市價低 ≥ 1.25 ATR。 */
    for (let i = 6; i <= 54; i++) {
      const b = B[i];
      const prevLo = Math.min(...B.slice(0, i).map((x) => x.l));
      if (!(b.l < prevLo)) continue;
      const avgV = B.slice(1, i).reduce((s, x) => s + x.v, 0) / (i - 1);
      if (!(b.v >= 2 * avgV && b.h - b.l >= 0.2 * a && D.vw[i] - b.c >= 0.6 * a && D.o - b.c >= 0.8 * a)) continue;
      const deep = b.v >= 2.5 * avgV && D.vw[i] - b.c >= 1.0 * a && D.o - b.c >= 1.25 * a;
      capDays++;
      // 2a. 接飛刀：嗰支 K 收市即刻買，Stop 放嗰支 K 低位下面 0.05 ATR
      const st = b.l - 0.05 * a;
      const tag = (t) => t && Object.assign(t, { deep });
      T.knife2R.push(tag(trade(D, 1, b.c, st, i, i, b.c + 2 * (b.c - st), 'close')));
      T.knifeVwap.push(tag(trade(D, 1, b.c, st, i, i, D.vw[i], 'close')));
      // 2b. V 嘅右邊：之後 8 支 K 內，第一支「低位冇再創新低」嘅 K 出現後，升穿佢高位先入；Stop 放 V 底下面 0.05 ATR
      let vLow = b.l, done = false;
      for (let j = i + 1; j <= Math.min(i + 8, B.length - 3) && !done; j++) {
        if (B[j].l < vLow) { vLow = B[j].l; continue; }
        const entry = B[j].h + 0.01, stop = vLow - 0.05 * a;
        if (entry - stop > 0.8 * a) { done = true; break; }
        const t2 = trade(D, 1, entry, stop, j + 1, j + 3, entry + 2 * (entry - stop));
        const tv = trade(D, 1, entry, stop, j + 1, j + 3, D.vw[j]);
        if (t2) T.rsv2R.push(tag(t2)); if (tv) T.rsvVwap.push(tag(tv));
        done = true;
      }
      break;
    }

    /* 3. 四日力竭跳空（沽空）：之前三日每日收市升 ≥ 0.5 ATR、成交逐日增加；今日高開 ≥ 0.5 ATR。
     *    10:30 前創新高之後，第一支「高位冇再創新高」嘅 K 出現，跌穿佢低位先沽空；Stop 放今日高位上面 0.05 ATR；Target 2R。 */
    const P1 = DD[D.i - 1], P2 = DD[D.i - 2], P3 = DD[D.i - 3], P4 = DD[D.i - 4];
    if (P1 && P2 && P3 && P4 && P1.c - P2.c >= 0.3 * a && P2.c - P3.c >= 0.3 * a && P3.c - P4.c >= 0.3 * a && D.o - D.pc >= 0.3 * a) {
      const deep = P1.vol > P2.vol && P2.vol > P3.vol && D.o - D.pc >= 0.5 * a;
      let hi = B[0].h;
      for (let j = 1; j <= 12; j++) {
        if (B[j].h > hi) { hi = B[j].h; continue; }
        const entry = B[j].l - 0.01, stop = hi + 0.05 * a;
        if (stop - entry > 0.8 * a) break;
        const t = trade(D, -1, entry, stop, j + 1, j + 3, entry - 2 * (stop - entry));
        if (t) T.exhaustShort.push(Object.assign(t, { deep }));
        break;
      }
    }
  });
  console.error(sym, DD.length);
}

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
const avg = (A) => A.reduce((s, v) => s + v, 0) / A.length;
function summ(X) {
  X = X.filter(Boolean);
  if (!X.length) return { n: 0 };
  return { n: X.length, win: p1(X.filter((t) => t.r > 0).length / X.length), target: p1(X.filter((t) => t.how === 'target').length / X.length), stop: p1(X.filter((t) => t.how === 'stop').length / X.length), avgR: r2(avg(X.map((t) => t.r))), avgRCost: r2(avg(X.map((t) => t.r)) - 0.05) };
}
const NAMES = {
  vwapAbove: '回調後升穿上一支 K 高位做多：入場前 6 支 K 全部收喺 VWAP 上面',
  vwapBelow: '同上，但入場前 6 支 K 全部收喺 VWAP 下面（Lance 話唔做）',
  vwapMixed: '同上，入場前 6 支 K 有上有落（VWAP 附近拉鋸）',
  knife2R: '投降式急跌：嗰支 K 收市即刻買（接飛刀），Target 2R',
  knifeVwap: '投降式急跌：即刻買，Target = VWAP',
  rsv2R: '投降式急跌：等「V 嘅右邊」（唔再創新低、升穿上一支 K 高位）先買，Target 2R',
  rsvVwap: '投降式急跌：等 V 嘅右邊先買，Target = VWAP',
  exhaustShort: '四日力竭跳空：連升三日 + 第四日高開，見頂後跌穿上一支 K 低位沽空，Target 2R',
};
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  days, capitulationDays: capDays,
  rules: {
    note: '以下係我哋將 Lance Breitstein 公開講法寫成固定機械規則嘅簡化版本，唔等於佢本人嘅做法；股票係 50 隻成交大嘅美股',
    vwap: '10:00–11:30；上一支 K 係陰燭；升穿上一支 K 高位入場；Stop 放最近 3 支 K 最低位下面；風險 0.03–0.5 ATR；Target 2R；未到就收市平倉；每日只計第一個訊號',
    capitulation: '10:00–14:00；創當日新低嘅一支 K：成交 ≥ 當日之前平均 2 倍、波幅 ≥ 0.2 ATR、收市低過 VWAP ≥ 0.6 ATR、低過開市價 ≥ 0.8 ATR；每日只計第一次。deep = 更極端（成交 ≥ 2.5 倍、離 VWAP ≥ 1 ATR、低過開市價 ≥ 1.25 ATR）',
    knife: '嗰支 K 收市價即刻買；Stop 放嗰支 K 低位下面 0.05 ATR',
    rightSide: '之後 8 支 K 內，第一支低位冇再創新低嘅 K 出現，升穿佢高位先入（3 支 K 內有效）；Stop 放 V 底下面 0.05 ATR；風險 ≤ 0.8 ATR',
    exhaust: '前三日每日收市升 ≥ 0.3 ATR；今日高開 ≥ 0.3 ATR（deep = 三日成交逐日增加而且高開 ≥ 0.5 ATR）；10:30 前見頂後第一支冇再創新高嘅 K，跌穿佢低位沽空；Stop 放今日高位上面 0.05 ATR；Target 2R',
    exit: '出場：Target／Stop／收市平倉；同一支 K 掂 Stop 同 Target 當 Stop。扣成本後 = 平均 R 減 0.05R',
  },
  setups: {},
};
Object.keys(T).forEach((k) => { out.setups[k] = { name: NAMES[k], ...summ(T[k]) }; const dp = T[k].filter((t) => t && t.deep); if (dp.length) out.setups[k].deep = summ(dp); });
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('days', days, 'capitulation days', capDays);
Object.entries(out.setups).forEach(([k, s]) => console.log(k.padEnd(13), JSON.stringify({ n: s.n, win: s.win, target: s.target, stop: s.stop, avgR: s.avgR, cost: s.avgRCost }), s.deep ? 'deep ' + JSON.stringify(s.deep) : ''));
