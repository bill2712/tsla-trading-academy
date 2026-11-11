#!/usr/bin/env node
/* 名家 Setup 驗證（教學用）：將幾位著名 Day Trader 公開教嘅 Setup 寫成固定機械規則，
 * 用我哋 50 隻成交大嘅美股、Alpaca 5 分鐘 K 線（正常交易時段）測試。全部只做多。
 * 注意：呢啲係我哋對公開資料嘅簡化演繹，唔等於嗰位 Trader 本人嘅做法（佢哋有判斷、有選股、部份做細價股）。
 * 慣例同 long-am-stats.mjs 一樣：Buy Stop 入場（11:30 前）；Target 2R／Stop／11:30 平倉；同一支 K 掂 Stop 同 Target 當 Stop。
 * 只輸出統計數字，唔輸出原始價格。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/famous-setups-stats.mjs [--cache DIR] [--out data/research/famous-setups-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/famous-setups-stats.json');
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
    out.push({ d, B, vw, o: B[0].o, c: B[B.length - 1].c, h: Math.max(...B.map((b) => b.h)), l: Math.min(...B.map((b) => b.l)), v1: B[0].v, vol: vv });
  });
  /* 連續 5 分鐘 EMA 20 同 ADX 14（跨日連續計，同一般圖表軟件「只顯示正常時段」一樣） */
  {
    let e = null, n = 0, pb = null, sTR = 0, sP = 0, sM = 0, adx = null, dxSum = 0, dxN = 0; const k = 2 / 21;
    out.forEach((D) => {
      D.e20 = []; D.adx = []; D.dip = []; D.dim = [];
      D.B.forEach((b) => {
        n++; e = e == null ? b.c : b.c * k + e * (1 - k); D.e20.push(n >= 20 ? e : null);
        if (pb) {
          const tr = Math.max(b.h - b.l, Math.abs(b.h - pb.c), Math.abs(b.l - pb.c));
          const up = b.h - pb.h, dn = pb.l - b.l;
          const p = up > dn && up > 0 ? up : 0, m = dn > up && dn > 0 ? dn : 0;
          if (n <= 15) { sTR += tr; sP += p; sM += m; } else { sTR = sTR - sTR / 14 + tr; sP = sP - sP / 14 + p; sM = sM - sM / 14 + m; }
          if (n >= 15 && sTR > 0) {
            const dip = 100 * sP / sTR, dim = 100 * sM / sTR, dx = dip + dim > 0 ? 100 * Math.abs(dip - dim) / (dip + dim) : 0;
            if (adx == null) { dxSum += dx; dxN++; if (dxN === 14) adx = dxSum / 14; } else adx = (adx * 13 + dx) / 14;
            D.adx.push(adx); D.dip.push(dip); D.dim.push(dim);
          } else { D.adx.push(null); D.dip.push(null); D.dim.push(null); }
        } else { D.adx.push(null); D.dip.push(null); D.dim.push(null); }
        pb = b;
      });
    });
  }
  out.forEach((x, i) => {
    const p = out[i - 1]; x.i = i; x.pc = p ? p.c : null; x.pdh = p ? p.h : null; x.pdl = p ? p.l : null;
    if (i >= 60) {
      const win = out.slice(i - 14, i);
      x.atr = win.reduce((a, y, j) => { const pc = (j ? win[j - 1] : out[i - 15]).c; return a + Math.max(y.h - y.l, Math.abs(y.h - pc), Math.abs(y.l - pc)); }, 0) / 14;
      const p20 = out.slice(i - 20, i);
      x.rvol5 = x.v1 / (p20.reduce((a, y) => a + y.v1, 0) / 20);
      x.vol20 = p20.reduce((a, y) => a + y.vol, 0) / 20;
      const s10 = out.slice(i - 10, i).reduce((a, y) => a + y.c, 0) / 10, s20 = p20.reduce((a, y) => a + y.c, 0) / 20, s50 = out.slice(i - 50, i).reduce((a, y) => a + y.c, 0) / 50;
      x.s10 = s10; x.s20 = s20;
      x.trend = x.pc > s20 && s20 > s50 ? 'up' : x.pc < s20 && s20 < s50 ? 'down' : 'mixed';
      // NR7：昨日波幅係最近 7 日最細
      const r7 = out.slice(i - 7, i).map((y) => y.h - y.l);
      x.nr7 = r7[6] <= Math.min(...r7.slice(0, 6));
      // Crabel Stretch：過去 10 日「開市價到較近嗰邊極端」嘅平均距離
      x.stretch = out.slice(i - 10, i).reduce((a, y) => a + Math.min(y.o - y.l, y.h - y.o), 0) / 10;
      // 日線整固（Kullamägi 式突破用）
      const w10 = out.slice(i - 10, i);
      x.pivot = Math.max(...w10.map((y) => y.h));
      x.pivotAge = 10 - w10.findIndex((y) => y.h === x.pivot); // 1 = 昨日
      x.box10 = x.pivot - Math.min(...w10.map((y) => y.l));
      x.run60 = x.pc / Math.min(...out.slice(i - 60, i).map((y) => y.l)) - 1;
      x.tight = out.slice(i - 5, i).reduce((a, y) => a + (y.h - y.l), 0) / 5 <= 0.85 * (p20.reduce((a, y) => a + (y.h - y.l), 0) / 20);
    }
  });
  return out;
}

/* 模擬一筆做多。opt.tgt = 自訂 Target 價（預設 2R）。回傳 rAm（11:30 平倉）、rEod（Bracket 留到收市）、rClose（冇 Target，淨係 Stop 或收市） */
function sim(D, entry, stop, from, until, opt = {}) {
  const B = D.B, risk = entry - stop;
  if (!(risk > 0)) return null;
  let k = -1, fill = null;
  for (let i = from; i <= Math.min(until, AM_END); i++) { if (B[i].h >= entry) { k = i; fill = Math.max(entry, B[i].o); break; } }
  if (k < 0 || fill <= stop) return null;
  const tgt = opt.tgt != null ? opt.tgt : entry + 2 * risk;
  if (tgt <= fill) return null;
  const R = (px) => (px - fill) / risk;
  const run = (last, useT) => {
    for (let i = k; i <= last; i++) {
      const b = B[i];
      if (b.l <= stop) return { r: R(stop), how: 'stop' };
      if (useT && b.h >= tgt && (i > k || b.c >= tgt)) return { r: R(tgt), how: 'target' };
    }
    return { r: R(B[last].c), how: 'time' };
  };
  const am = run(AM_END, true), eod = run(B.length - 1, true), cl = run(B.length - 1, false);
  return { k, fill, stopPx: stop, risk, rAm: am.r, howAm: am.how, rEod: eod.r, rClose: cl.r, howClose: cl.how, riskAtr: risk / D.atr };
}
/* 波段出場（Kullamägi 式）：初始 Stop；第 3 日收市如果有賺就賣一半、Stop 移到入場價；其餘等日線收市跌穿 10 日線先走；最多 40 日 */
function swing(days, D, t) {
  if (t.howClose === 'stop') return { r: -1, held: 0 };
  let stop = t.stopPx, half = null;
  const R = (px) => (px - t.fill) / t.risk;
  const fin = (px, n) => ({ r: half == null ? R(px) : 0.5 * half + 0.5 * R(px), held: n });
  for (let n = 1; n <= 40; n++) {
    const X = days[D.i + n];
    if (!X) return fin(days[D.i + n - 1].c, n - 1);
    if (X.o <= stop) return fin(X.o, n);
    if (X.l <= stop) return fin(stop, n);
    if (n === 3 && half == null && X.c > t.fill) { half = R(X.c); stop = Math.max(stop, t.fill); }
    const s10 = days.slice(D.i + n - 9, D.i + n + 1).reduce((a, y) => a + y.c, 0) / 10;
    if (X.c < s10) return fin(X.c, n);
  }
  return fin(days[D.i + 40].c, 40);
}
function orb(D, n, until, maxAtr) {
  const B = D.B, hi = hiOf(B, 0, n - 1), lo = loOf(B, 0, n - 1);
  if (hi - lo > maxAtr * D.atr) return null;
  for (let i = n; i <= until; i++) {
    if (B[i].l < lo && B[i].h <= hi) return null;
    if (B[i].h > hi) return sim(D, hi + 0.01, lo - 0.01, i, i);
  }
  return null;
}
/* ABCD（Aziz）：A 開市起步 → B 新高 → 回調到 C（守住，冇跌返一半以上）→ D 再破 B。回傳 C 位入場同 B 位突破入場兩個版本 */
function abcd(D) {
  const B = D.B, O = D.o, a = D.atr;
  let ext = hiOf(B, 0, 2), inPull = false, pl = null;
  for (let i = 3; i <= 21; i++) {
    const b = B[i];
    if (!inPull) {
      if (b.h > ext) { ext = b.h; continue; }
      if (ext - O >= 0.5 * a && ext - b.l >= 0.2 * a) { inPull = true; pl = b.l; }
      continue;
    }
    if (b.h > ext) return null; // 未確認 C 就已經破頂：唔係 ABCD
    if (b.l < pl) { pl = b.l; if (pl - O < 0.4 * (ext - O)) return null; continue; }
    // 呢支 K 冇再創新低 = C 守住
    const stop = pl - 0.02 * a;
    const eC = b.h + 0.01, eD = ext + 0.01;
    return {
      c: eC - stop <= 0.6 * a ? sim(D, eC, stop, i + 1, i + 3) : null,
      d: eD - stop <= 0.8 * a ? sim(D, eD, stop, i + 1, AM_END) : null,
    };
  }
  return null;
}
/* Holy Grail（Raschke）：ADX(14) ≥ 30 而且 +DI > −DI；價格第一次回調到 20 EMA；升穿掂線嗰支 K 嘅高位入場 */
function holyGrail(D) {
  const B = D.B, a = D.atr;
  for (let i = 1; i <= 21; i++) {
    const b = B[i], e = D.e20[i];
    if (e == null || D.adx[i] == null) continue;
    if (!(D.adx[i] >= 30 && D.dip[i] > D.dim[i])) continue;
    if (!(b.l <= e + 0.03 * a && b.c >= e - 0.1 * a)) continue;
    // 之前 3 支 K 都喺線上面（即係「第一次」回調到線），而且今日曾經離線至少 0.3 ATR
    let ok = i >= 3, far = false;
    for (let j = 1; j <= 3 && ok; j++) if (!(B[i - j] && B[i - j].l > D.e20[i - j])) ok = false;
    for (let j = 0; j < i; j++) if (B[j].h - D.e20[j] >= 0.3 * a) far = true;
    if (!ok || !far) continue;
    const entry = b.h + 0.01, stop = Math.min(b.l, e) - 0.03 * a;
    if (entry - stop > 0.6 * a) return null;
    const t = sim(D, entry, stop, i + 1, i + 3);
    if (!t) return null;
    const sw = hiOf(B, 0, i); // 原著目標：返到之前高位
    const alt = sw > entry + 0.2 * (entry - stop) ? sim(D, entry, stop, i + 1, i + 3, { tgt: sw }) : null;
    return { ...t, rAlt: alt ? alt.rAm : null, adxRising: D.adx[i] > D.adx[Math.max(0, i - 3)] };
  }
  return null;
}

const qqq = new Map();
(await daysOf('QQQ')).forEach((x) => qqq.set(x.d, x));
const T = { gapGo: [], abcdC: [], abcdD: [], holyGrail: [], secondDay: [], orb30: [], crabel: [], ep: [], kqBreakout: [] };
const NAMES = {
  gapGo: 'Gap & Go：Gap 高開 ≥ 4%，升穿首 5 分鐘高位（Ross Cameron 式，大型股版）',
  abcdC: 'ABCD：喺 C 位（回調守住）入場（Andrew Aziz）',
  abcdD: 'ABCD：等升穿 B 位先入場（Andrew Aziz）',
  holyGrail: 'Holy Grail：ADX ≥ 30，第一次回調到 20 EMA（Linda Raschke）',
  secondDay: 'Second Day Play：第一日大升收高，第二日 15 分鐘 ORB（SMB Capital）',
  orb30: '30 分鐘 ORB（所有日子；用嚟比較 NR7 前後）（Toby Crabel）',
  crabel: 'Crabel ORB：開市價 + Stretch 入場（所有日子）（Toby Crabel）',
  ep: 'Episodic Pivot：Gap ≥ 8% + 開市成交 ≥ 3 倍，升穿首 5 分鐘高位，Stop 放當日低位（Kullamägi）',
  kqBreakout: '日線整固突破：大升後窄幅整固，升穿整固高位，Stop 放當日低位（Kullamägi）',
};
const second = { after: [], other: [] }; // 第二日基準：開市買、收市賣（ATR）
const rangeStat = { nr7: [], other: [] }; // NR7 之後當日波幅 ÷ ATR
let allDays = 0, inPlayDays = 0;
for (const sym of UNIVERSE) {
  let days = null;
  for (let k = 0; k < 4 && !days; k++) { try { days = await daysOf(sym); } catch (e) { console.error(sym, '失敗：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); } }
  if (!days) continue;
  days.forEach((D) => {
    if (!(D.atr && D.pc && D.trend)) return;
    allDays++;
    const g = D.o / D.pc - 1, ip = Math.abs(g) >= 0.02 || D.rvol5 >= 2;
    if (ip) inPlayDays++;
    const Q = qqq.get(D.d);
    const tag = { ip, trend: D.trend, rvolHi: D.rvol5 >= 2, year: D.d.slice(0, 4), nr7: D.nr7, gap: g };
    const add = (k, t, extra) => { if (t) T[k].push({ ...tag, ...t, ...extra, q: Q && Q.B[t.k - 1] ? Q.B[t.k - 1].c > Q.vw[t.k - 1] : null }); };

    // Ross Cameron 式 Gap & Go（大型股版）
    if (g >= 0.04) add('gapGo', orb(D, 1, 6, 1.0));
    // Aziz ABCD（只計有人關注嘅日子）
    if (ip) { const r = abcd(D); if (r) { add('abcdC', r.c); add('abcdD', r.d); } }
    // Raschke Holy Grail（所有日子都搵；另外分「有人關注」）
    add('holyGrail', holyGrail(D));
    // SMB Second Day Play
    const P = days[D.i - 1], PP = days[D.i - 2];
    const day1 = P && PP && P.vol20 && P.c / PP.c - 1 >= 0.04 && (P.c - P.l) / Math.max(1e-9, P.h - P.l) >= 0.75 && P.vol >= 1.5 * P.vol20;
    (day1 ? second.after : second.other).push((D.c - D.o) / D.atr);
    if (day1 && D.o >= (P.h + P.l) / 2) add('secondDay', orb(D, 3, 12, 0.75));
    // Crabel：NR7 之後波幅、ORB
    (D.nr7 ? rangeStat.nr7 : rangeStat.other).push((D.h - D.l) / D.atr);
    add('orb30', orb(D, 6, 18, 0.75));
    if (D.stretch > 0.02 * D.atr) add('crabel', sim(D, D.o + D.stretch, D.o - D.stretch, 0, AM_END));
    // Kullamägi Episodic Pivot
    if (g >= 0.08 && D.rvol5 >= 3) {
      const B = D.B; let t = null;
      for (let i = 1; i <= 6 && !t; i++) if (B[i].h > B[0].h) { const st = loOf(B, 0, i - 1) - 0.01; t = B[0].h + 0.01 - st <= 1.5 * D.atr ? sim(D, B[0].h + 0.01, st, i, i) : null; if (!t) break; }
      if (t) add('ep', t, { sw: swing(days, D, t), gap10: g >= 0.10 });
    }
    // Kullamägi 日線整固突破
    if (D.run60 >= 0.30 && D.pivotAge >= 3 && D.box10 <= 4 * D.atr && D.tight && D.pc > D.s10 && D.pc > D.s20 && D.s10 > D.s20 && D.o < D.pivot + 0.5 * D.atr) {
      const B = D.B, lvl = Math.max(D.pivot, B[0].h) + 0.01; let t = null;
      for (let i = 1; i <= AM_END; i++) if (B[i].h >= lvl) { const st = loOf(B, 0, i - 1) - 0.01; if (lvl - st <= D.atr && lvl - st >= 0.1 * D.atr) t = sim(D, lvl, st, i, i); break; }
      if (t) add('kqBreakout', t, { sw: swing(days, D, t) });
    }
  });
  console.error(sym, days.length);
}

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
const avg = (A) => A.reduce((a, v) => a + v, 0) / A.length;
const med = (A) => { const s = [...A].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
function summ(X) {
  if (!X.length) return { n: 0 };
  const o = {
    n: X.length, win: p1(X.filter((t) => t.rAm > 0).length / X.length), target: p1(X.filter((t) => t.howAm === 'target').length / X.length),
    stop: p1(X.filter((t) => t.howAm === 'stop').length / X.length), avgR: r2(avg(X.map((t) => t.rAm))), avgRCost: r2(avg(X.map((t) => t.rAm)) - 0.05),
    avgREod: r2(avg(X.map((t) => t.rEod))), avgRClose: r2(avg(X.map((t) => t.rClose))),
  };
  const alt = X.filter((t) => t.rAlt != null); if (alt.length) { o.altN = alt.length; o.altAvgR = r2(avg(alt.map((t) => t.rAlt))); o.altWin = p1(alt.filter((t) => t.rAlt > 0).length / alt.length); }
  const sw = X.filter((t) => t.sw); if (sw.length) {
    const rs = sw.map((t) => t.sw.r);
    o.swing = { n: sw.length, win: p1(rs.filter((r) => r > 0).length / rs.length), avgR: r2(avg(rs)), medR: r2(med(rs)), best: r2(Math.max(...rs)), worst: r2(Math.min(...rs)), avgDays: r2(avg(sw.map((t) => t.sw.held))), top3Share: r2([...rs].sort((a, b) => b - a).slice(0, 3).reduce((a, v) => a + v, 0) / Math.max(1e-9, rs.reduce((a, v) => a + v, 0))) };
  }
  return o;
}
const SEG = {
  all: () => true, ip: (t) => t.ip, notIp: (t) => !t.ip,
  aplus: (t) => t.rvolHi && t.q === true, notAplus: (t) => !(t.rvolHi && t.q === true),
  up: (t) => t.trend === 'up', upAplus: (t) => t.trend === 'up' && t.rvolHi && t.q === true,
  nr7: (t) => t.nr7, notNr7: (t) => !t.nr7, nr7Ip: (t) => t.nr7 && t.ip,
  adxRising: (t) => t.adxRising === true, gap10: (t) => t.gap10 === true,
  y2024: (t) => t.year === '2024', y2025: (t) => t.year === '2025', y2026: (t) => t.year === '2026',
};
const bs = (A) => (A.length ? { n: A.length, up: p1(A.filter((v) => v > 0).length / A.length), avgAtr: r2(avg(A)) } : { n: 0 });
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）',
  daysAll: allDays, daysInPlay: inPlayDays,
  rules: {
    note: '以下係我哋將公開資料寫成固定機械規則嘅簡化版本，唔等於嗰位 Trader 本人嘅做法；全部只做多；股票係 50 隻成交大嘅美股（唔係細價股）',
    inPlay: 'Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍',
    aplus: '首 5 分鐘成交 ≥ 平時 2 倍，而且入場前一支 5 分鐘 K 收市時 QQQ 喺自己 VWAP 上面',
    exit: 'Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉。同一支 K 掂 Stop 同 Target 當 Stop',
    cost: '扣成本後 = 平均 R 減 0.05R',
    gapGo: 'Gap 高開 ≥ 4%；首 5 分鐘 K 波幅 ≤ 1 ATR；10:00 前升穿首 5 分鐘高位入場；Stop 放首 5 分鐘低位',
    abcd: '有人關注嘅日子；開市後升至少 0.5 ATR（B）；回調至少 0.2 ATR 但冇跌返升幅 60% 以上；有一支 K 唔再創新低（C 守住）。C 位版：升穿嗰支 K 高位入場；B 位版：升穿 B 入場；Stop 都放 C 下面',
    holyGrail: '5 分鐘圖 ADX(14) ≥ 30 而且 +DI > −DI；之前 3 支 K 都喺 20 EMA 上面，第一次回調掂線；升穿掂線嗰支 K 高位入場；Stop 放嗰支 K 低位下面。ADX 同 EMA 跨日連續計',
    secondDay: '第一日：升 ≥ 4%、收喺全日波幅最高 25%、全日成交 ≥ 20 日平均 1.5 倍。第二日：開市唔低過第一日波幅中間；15 分鐘 ORB 做多',
    nr7: 'NR7 = 昨日波幅係最近 7 日最細',
    crabel: 'Stretch = 過去 10 日「開市價到較近嗰邊高低位」嘅平均距離（呢個定義嚟自二手資料）；開市價 + Stretch 入場，Stop 放開市價 − Stretch',
    ep: 'Gap 高開 ≥ 8%、首 5 分鐘成交 ≥ 平時 3 倍；10:00 前升穿首 5 分鐘高位入場；Stop 放入場前嘅當日低位（風險 ≤ 1.5 ATR）',
    kqBreakout: '昨收比 60 日內最低位高 ≥ 30%；最近 10 日高低差 ≤ 4 ATR、最近 5 日平均波幅 ≤ 之前 20 日嘅 85%；整固高位唔係最近 2 日先出現；昨收 > 10 日線 > 20 日線；11:30 前升穿整固高位（同首 5 分鐘高位）入場；Stop 放當日低位（風險 ≤ 1 ATR）',
    swing: '波段出場：初始 Stop；第 3 日收市如果有賺就賣一半、Stop 移到入場價；其餘等日線收市跌穿 10 日線先走；最多 40 日。單位 R',
  },
  baseline: {
    secondDay: { note: '第一日大升收高之後，第二日開市買、收市賣（冇 Stop），單位 ATR', after: bs(second.after), other: bs(second.other) },
    nr7Range: { note: '當日高低波幅 ÷ 14 日 ATR', nr7: { n: rangeStat.nr7.length, avg: r2(avg(rangeStat.nr7)), med: r2(med(rangeStat.nr7)) }, other: { n: rangeStat.other.length, avg: r2(avg(rangeStat.other)), med: r2(med(rangeStat.other)) } },
  },
  setups: {},
};
Object.keys(T).forEach((k) => { out.setups[k] = { name: NAMES[k] }; Object.entries(SEG).forEach(([s, f]) => (out.setups[k][s] = summ(T[k].filter(f)))); });
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('days', allDays, 'inPlay', inPlayDays);
console.log('baseline', JSON.stringify(out.baseline));
Object.entries(out.setups).forEach(([k, s]) => {
  console.log(k.padEnd(11), ['all', 'ip', 'aplus', 'up', 'upAplus', 'nr7', 'notNr7', 'y2024', 'y2025', 'y2026'].map((x) => `${x}:${s[x].n}/${s[x].win}%/${s[x].avgR}/${s[x].avgREod}/${s[x].avgRClose}`).join('  '));
  if (s.all.swing) console.log('   swing', JSON.stringify(s.all.swing), 'aplus', JSON.stringify(s.aplus.swing || {}));
  if (s.all.altN) console.log('   alt', s.all.altN, s.all.altWin, s.all.altAvgR, 'ip', s.ip.altN, s.ip.altAvgR, 'rising', JSON.stringify(s.adxRising));
});
