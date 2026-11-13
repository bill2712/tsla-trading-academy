#!/usr/bin/env node
/* James Rich Young「Famous Four」同 Pro／Novice Gap 嘅驗證（教學用）
 * 資料：jamesrichyoung.com（獨立網站，整理 James 嘅公開片段「4 Easy Patterns For Day Trading」等）同 T3 Live／Pristine 嘅 Gap 概念。
 * 四個做多 Setup：Buy Setup、Breakout、The 123、Climactic Buy Setup；另外比較 Professional gap 同 Novice gap。
 * 呢啲係我哋嘅簡化演繹，唔等於 James 本人嘅做法。只輸出統計數字，唔輸出原始價格。
 * 用法：NODE_USE_ENV_PROXY=1 node --no-warnings scripts/research/jry-stats.mjs [--cache DIR] [--out data/research/jry-stats.json]
 */
import fs from 'node:fs';
import { alpacaBars } from '../picks/sources.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('from', '2024-01-01'), TO = arg('to', '2026-11-06');
const OUT = arg('out', 'data/research/jry-stats.json');
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


/* 一筆交易：side 1 = 做多。entry 用 Buy Stop（升穿先入）；tgt 可以係數字或者 function(i) → 當時目標價（例如追住 20MA）；冇到就收市平倉 */
function trade(D, entry, stop, from, until, tgt) {
  const B = D.B, risk = entry - stop;
  if (!(risk > 0)) return null;
  let k = -1, fill = null;
  for (let i = from; i <= Math.min(until, B.length - 2); i++) if (B[i].h >= entry) { k = i; fill = Math.max(entry, B[i].o); break; }
  if (k < 0 || fill <= stop) return null;
  const rk = fill - stop, R = (px) => (px - fill) / rk;
  for (let i = k; i < B.length; i++) {
    const b = B[i], t = typeof tgt === 'function' ? tgt(i) : tgt;
    if (b.l <= stop) return { r: R(stop), how: 'stop', k };
    if (t != null && t > fill && b.h >= t && (i > k || b.c >= t)) return { r: R(t), how: 'target', k };
  }
  return { r: R(B[B.length - 1].c), how: 'time', k };
}

const T = { buy: [], buy2R: [], brk: [], brkEarly: [], o123: [], clim: [], clim2R: [] };
const gap = { proUp: [], novUp: [], midUp: [], proDn: [], novDn: [], midDn: [] };
let days = 0;
for (const sym of UNIVERSE) {
  let DD = null;
  for (let k = 0; k < 4 && !DD; k++) { try { DD = await daysOf(sym); } catch (e) { console.error(sym, '失敗：', e.message); await new Promise((r) => setTimeout(r, 15000 * (k + 1))); } }
  if (!DD) continue;
  /* 5 分鐘 20MA（跨日連續計，同一般圖表一樣） */
  { const q = []; DD.forEach((D) => { D.ma = D.B.map((b) => { q.push(b.c); if (q.length > 20) q.shift(); return q.length === 20 ? q.reduce((s, v) => s + v, 0) / 20 : null; }); }); }
  DD.forEach((D) => {
    if (!(D.atr && D.pc)) return;
    days++;
    const B = D.B, a = D.atr, M = D.ma;
    const up = (i) => M[i] != null && M[i - 3] != null && M[i] > M[i - 3];
    const dn = (i) => M[i] != null && M[i - 3] != null && M[i] < M[i - 3];
    const hod = (i) => Math.max(...B.slice(0, i + 1).map((x) => x.h));

    /* ① Buy Setup：上升趨勢回調到上升緊嘅 20MA；回調最少 3 支 lower high；回咗推動大約一半（35–70%）；升穿上一支 K 高位入場 */
    for (let i = 8; i <= 66 && !T.buy.done; i++) {
      if (!up(i)) continue;
      let j = i, lh = 0; while (j > 1 && B[j].h < B[j - 1].h) { lh++; j--; } // j = 推動高位
      if (lh < 3) continue;
      const H = B[j].h; let L = Infinity; for (let x = Math.max(0, j - 12); x <= j; x++) L = Math.min(L, B[x].l);
      const push = H - L; if (push < 0.4 * a) continue;
      const pl = Math.min(...B.slice(j + 1, i + 1).map((x) => x.l)), ret = (H - pl) / push;
      if (ret < 0.35 || ret > 0.7) continue;
      if (!(B[i].l <= M[i] + 0.1 * a && B[i].c >= M[i] - 0.1 * a)) continue;
      const entry = B[i].h + 0.01, stop = pl - 0.02 * a;
      if (entry - stop > 0.6 * a) continue;
      const h = hod(i);
      const t1 = trade(D, entry, stop, i + 1, i + 2, h > entry ? h : null);
      const t2 = trade(D, entry, stop, i + 1, i + 2, entry + 2 * (entry - stop));
      if (t1) T.buy.push(t1); if (t2) T.buy2R.push(t2);
      if (t1 || t2) break;
    }

    /* ② Breakout：強勢推動之後橫行（靠時間整固）：最少 4 支 K、範圍 ≤ 0.3 ATR、冇跌穿 20MA；20MA 追到上嚟（離整固低位 ≤ 0.1 ATR）先算；升穿整固高位入場 */
    for (let i = 10; i <= 66; i++) {
      const s = i - 3; // 最近 4 支 K（s..i）
      const bh = Math.max(...B.slice(s, i + 1).map((x) => x.h)), bl = Math.min(...B.slice(s, i + 1).map((x) => x.l));
      if (bh - bl > 0.3 * a || M[i] == null || !up(i)) continue;
      const lo12 = Math.min(...B.slice(Math.max(0, s - 12), s).map((x) => x.l));
      if (bh - lo12 < 0.6 * a || bh < hod(i) - 0.05 * a) continue; // 之前有強勢推動、整固喺高位
      if (B.slice(s, i + 1).some((x, k2) => x.c < M[s + k2])) continue; // 收穿 20MA = 唔乾淨
      const ready = bl - M[i] <= 0.1 * a;
      const t = trade(D, bh + 0.01, bl - 0.02 * a, i + 1, i + 3, bh + 0.01 + 2 * (bh + 0.01 - (bl - 0.02 * a)));
      if (t) { (ready ? T.brk : T.brkEarly).push(t); break; }
    }

    /* ③ The 123（開市）：第 1 支 K 明顯大陽燭；第 2 支細（≤ 1/3）、唔高過第 1 支；第 3（或 4）支升穿兩支最高位入場；Stop 放第 2 支低位下面 */
    { const b0 = B[0], b1 = B[1], r0 = b0.h - b0.l, r1 = b1.h - b1.l;
      if (b0.c > b0.o && r0 >= 0.15 * a && (b0.c - b0.l) / r0 >= 0.7 && r1 <= r0 / 3 && b1.h <= b0.h) {
        const entry = Math.max(b0.h, b1.h) + 0.01, stop = b1.l - 0.01;
        const t = trade(D, entry, stop, 2, 3, entry + 2 * (entry - stop)); if (t) T.o123.push(t);
      } }

    /* ④ Climactic Buy：跌勢加速：連續 3 支陰燭、一支大過一支、成交一支多過一支；收市低過下跌緊嘅 20MA ≥ 0.6 ATR；
     *    之後 3 支 K 內出現陽燭（反轉 K），升穿佢高位入場；Stop 放反轉 K 低位下面；Target = 掂返 20MA（跟住 20MA 更新） */
    for (let i = 6; i <= 54; i++) {
      const x = [B[i - 2], B[i - 1], B[i]];
      if (!x.every((b) => b.c < b.o)) continue;
      const rg = x.map((b) => b.h - b.l);
      if (!(rg[0] < rg[1] && rg[1] < rg[2] && x[0].v < x[1].v && x[1].v < x[2].v)) continue;
      if (!(dn(i) && M[i] - B[i].c >= 0.6 * a)) continue;
      let done = false;
      for (let j = i + 1; j <= i + 3 && !done; j++) {
        if (!(B[j].c > B[j].o)) continue;
        const entry = B[j].h + 0.01, stop = B[j].l - 0.02 * a;
        if (entry - stop > 0.6 * a) { done = true; break; }
        const t = trade(D, entry, stop, j + 1, j + 2, (k) => M[k]);
        const t2 = trade(D, entry, stop, j + 1, j + 2, entry + 2 * (entry - stop));
        if (t) T.clim.push(t); if (t2) T.clim2R.push(t2);
        done = true;
      }
      if (done) break;
    }

    /* ⑤ Professional vs Novice gap（Sami／T3 嘅概念）：Gap ≥ 2%。
     *    Pro 向上 = 之前兩日都係跌（逆住之前方向）；Novice 向上 = 之前兩日都係升（順住之前方向，可能力竭） */
    const P1 = DD[D.i - 1], P2 = DD[D.i - 2], P3 = DD[D.i - 3];
    if (P1 && P2 && P3) {
      const g = D.o / D.pc - 1, d1 = P1.c - P2.c, d2 = P2.c - P3.c, res = (D.c - D.o) / a;
      if (g >= 0.02) (d1 < 0 && d2 < 0 ? gap.proUp : d1 > 0 && d2 > 0 ? gap.novUp : gap.midUp).push(res);
      if (g <= -0.02) (d1 > 0 && d2 > 0 ? gap.proDn : d1 < 0 && d2 < 0 ? gap.novDn : gap.midDn).push(-res);
    }
  });
  console.error(sym, DD.length);
}

const r2 = (v) => Math.round(v * 100) / 100, p1 = (v) => Math.round(v * 1000) / 10;
const avg = (A) => A.reduce((s, v) => s + v, 0) / A.length;
function summ(X) { X = X.filter(Boolean); if (!X.length) return { n: 0 }; return { n: X.length, win: p1(X.filter((t) => t.r > 0).length / X.length), target: p1(X.filter((t) => t.how === 'target').length / X.length), stop: p1(X.filter((t) => t.how === 'stop').length / X.length), avgR: r2(avg(X.map((t) => t.r))), avgRCost: r2(avg(X.map((t) => t.r)) - 0.05) }; }
const gs = (A) => (A.length ? { n: A.length, withGap: p1(A.filter((v) => v > 0).length / A.length), avgAtr: r2(avg(A)) } : { n: 0 });
const NAMES = {
  buy: 'Buy Setup：回調到上升 20MA，升穿上一支 K 高位入場，Target = 全日高位（HOD）',
  buy2R: 'Buy Setup：同上，Target 2R',
  brk: 'Breakout：靠時間整固、20MA 追到上嚟先突破，Target 2R',
  brkEarly: 'Breakout（太早）：20MA 未追到上嚟就突破，Target 2R',
  o123: 'The 123（開市）：大陽燭 → 細休息 K → 升穿兩支高位，Target 2R',
  clim: 'Climactic Buy：加速急跌之後反轉 K，Target = 掂返 20MA',
  clim2R: 'Climactic Buy：同上，Target 2R',
};
const out = {
  generatedAt: new Date().toISOString(), from: FROM, to: TO, universe: UNIVERSE, source: 'Alpaca SIP 5 分鐘 K 線（正常交易時段）', days,
  rules: {
    note: '以下係我哋根據 jamesrichyoung.com（獨立整理 James Rich Young 公開片段嘅網站）同 T3 Live／Pristine 資料寫成嘅機械規則，唔等於 James 本人嘅做法（佢會揀股、睇大市、有經驗判斷，而且好多係細價 Gap 股）；股票係 50 隻成交大嘅美股；全部只做多',
    ma: '5 分鐘 20 期簡單移動平均（20MA），跨日連續計；「上升」= 比 3 支 K 前高',
    buy: '09:30–15:00；20MA 上升；之前 12 支 K 內有 ≥ 0.4 ATR 嘅推動；之後最少 3 支連續 lower high；回調幅度 35–70%；回調 K 低位掂到 20MA（0.1 ATR 內）而收市冇跌穿太多；升穿嗰支 K 高位入場（2 支 K 內）；Stop 放回調低位下面；風險 ≤ 0.6 ATR',
    brk: '最近 4 支 K 範圍 ≤ 0.3 ATR、喺全日高位附近、之前 12 支 K 有 ≥ 0.6 ATR 推動；4 支 K 冇收市跌穿 20MA；「準備好」= 20MA 已經追到整固低位 0.1 ATR 內；升穿整固高位入場（3 支 K 內）；Stop 放整固低位下面',
    o123: '09:30 第 1 支 K：陽燭、波幅 ≥ 0.15 ATR、收喺上面 30%；第 2 支波幅 ≤ 第 1 支三分一而且唔高過第 1 支；第 3 或第 4 支升穿兩支最高位入場；Stop 放第 2 支低位下面',
    clim: '10:00–14:00；連續 3 支陰燭，波幅同成交量一支大過一支；收市低過下跌緊嘅 20MA ≥ 0.6 ATR；之後 3 支 K 內第一支陽燭做反轉 K；升穿佢高位入場；Stop 放佢低位下面；風險 ≤ 0.6 ATR',
    exit: 'Target／Stop／收市平倉；同一支 K 掂 Stop 同 Target 當 Stop。扣成本後 = 平均 R 減 0.05R',
    gap: 'Gap ≥ 2%（向上）或 ≤ −2%（向下）。Pro = 逆住之前兩日方向（向上 Gap 之前兩日都跌）；Novice = 順住之前兩日方向。結果 = 開市到收市，向 Gap 方向計，單位 ATR',
  },
  setups: {},
  gaps: { proUp: gs(gap.proUp), novUp: gs(gap.novUp), midUp: gs(gap.midUp), proDn: gs(gap.proDn), novDn: gs(gap.novDn), midDn: gs(gap.midDn) },
};
Object.keys(T).forEach((k) => { out.setups[k] = { name: NAMES[k], ...summ(T[k]) }; });
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('days', days);
Object.entries(out.setups).forEach(([k, s]) => console.log(k.padEnd(9), JSON.stringify({ n: s.n, win: s.win, target: s.target, stop: s.stop, avgR: s.avgR, cost: s.avgRCost })));
console.log('gaps', JSON.stringify(out.gaps));
