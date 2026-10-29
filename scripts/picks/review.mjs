// 收市後回顧：用 Alpaca 5 分鐘 K 線（正常時段）檢查每隻 pick 嘅計劃
//   NODE_USE_ENV_PROXY=1 node --no-warnings scripts/picks/review.mjs data/picks/YYYY-MM-DD.json [--write]
// 每隻：開高低收、開市後變化、有冇升穿／跌穿 PMH／PML、入場價有冇觸發（09:35 後）、之後 Target 1 定 Stop 先到。
// 同一支 K 線兩樣都掂到 → 當 Stop 先到（保守）。--write 會將 review 寫返入報告（保留你寫嘅 summary）。
import fs from 'node:fs';
import { alpacaBars, hasAlpaca } from './sources.mjs';
import { bars as toBars, r2 } from './lib.mjs';
const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!hasAlpaca) { console.error('要 Alpaca key（環境變數或者 ~/.config/tsla-picks/alpaca.env）'); process.exit(1); }
const syms = d.picks.map((p) => p.sym);
const { bars } = await alpacaBars(syms, '5Min', `${d.date}T13:00:00Z`, Date.now());
const items = d.picks.map((p) => {
  const B = toBars(bars[p.sym]).filter((b) => b.d === d.date && b.hm >= '09:30' && b.hm < '16:00');
  if (!B.length) return { sym: p.sym, open: null, high: null, low: null, close: null, chgFromOpenPct: null, hitPmh: null, verdict: '冇數據', note: '' };
  const o = B[0].o, c = B[B.length - 1].c, h = Math.max(...B.map((b) => b.h)), l = Math.min(...B.map((b) => b.l));
  const t = p.trade || {}, L = p.levels || {}, long = t.side !== 'Short';
  // 09:35 後價格穿過入場價先算觸發；如果嗰支 K 線一開已經穿咗，就當開市價成交（R 用實際成交價計）；
  // 穿過入場價超過 0.3 ATR 先開始 = 按「唔追」規則唔做
  let trig = null, fill = null, out = '未觸發', chase = false;
  const atr = p.atr || Math.abs(t.entry - t.stop) * 2.5;
  for (const b of B) {
    if (!trig) {
      if (b.hm < '09:35' || !(long ? b.h >= t.entry : b.l <= t.entry)) continue;
      const gapThrough = long ? b.o - t.entry : t.entry - b.o;
      if (gapThrough > 0.3 * atr) { chase = true; trig = b.hm; out = `${b.hm} 一開已經穿入場價 ${r2(gapThrough)}（> 0.3 ATR），按規則唔追`; break; }
      trig = b.hm; fill = gapThrough > 0 ? b.o : t.entry;
    }
    const risk = Math.abs(fill - t.stop);
    const stopHit = long ? b.l <= t.stop : b.h >= t.stop, tgtHit = long ? b.h >= t.target1 : b.l <= t.target1;
    if (stopHit) { out = `${b.hm} 中 Stop（−1R）`; break; }
    if (tgtHit) { out = `${b.hm} 到 Target 1（+${r2(Math.abs(t.target1 - fill) / risk)}R）`; break; }
  }
  if (trig && !chase && out === '未觸發') out = `收市前未到 Stop／Target（收市計 ${r2((long ? c - fill : fill - c) / Math.abs(fill - t.stop))}R）`;
  if (fill != null && fill !== t.entry) out += `；成交價 ${r2(fill)}（跳過入場價）`;
  // 後備計劃：5 分鐘開市區間突破（ORB）。主計劃唔追或者冇觸發時，順原本方向做首 5 分鐘高／低位突破；
  // Stop 放區間另一邊（最多 0.5 ATR），Target = 2R。
  let orb = '';
  if (chase || !trig) {
    const R0 = B[0], rangeTop = R0.h, rangeBot = R0.l;
    const e = long ? rangeTop + 0.01 : rangeBot - 0.01;
    let st = long ? rangeBot : rangeTop; if (Math.abs(e - st) > 0.5 * atr) st = long ? e - 0.5 * atr : e + 0.5 * atr;
    const risk = Math.abs(e - st), tg = long ? e + 2 * risk : e - 2 * risk;
    let ot = null, res = '冇觸發';
    for (const b of B.slice(1)) {
      if (!ot) { if (long ? b.h >= e : b.l <= e) ot = b.hm; else continue; }
      if (long ? b.l <= st : b.h >= st) { res = `${b.hm} 中 Stop（−1R）`; break; }
      if (long ? b.h >= tg : b.l <= tg) { res = `${b.hm} 到 2R`; break; }
    }
    if (ot && res === '冇觸發') res = `收市計 ${r2((long ? c - e : e - c) / risk)}R`;
    orb = `後備 5 分鐘 ORB：入 ${r2(e)}／Stop ${r2(st)}／目標 ${r2(tg)} → ${ot ? ot + ' 觸發，' + res : '冇觸發'}`;
  }
  return { sym: p.sym, open: r2(o), high: r2(h), low: r2(l), close: r2(c), chgFromOpenPct: r2((c - o) / o * 100), hitPmh: L.pmh != null ? h > L.pmh : null, hitPml: L.pml != null ? l < L.pml : null,
    verdict: chase ? out : trig ? `${trig} 觸發 → ${out}` : '未觸發（入場價冇到）', orb, side: t.side };
});
items.forEach((x) => console.log(`${x.sym.padEnd(6)} ${x.side.padEnd(5)} 開 ${x.open} 高 ${x.high} 低 ${x.low} 收 ${x.close}（開市後 ${x.chgFromOpenPct}%）\n   主計劃：${x.verdict}${x.orb ? '\n   ' + x.orb : ''}`));
if (process.argv.includes('--write')) {
  d.review = Object.assign({ writtenAt: new Date().toISOString(), summary: (d.review && d.review.summary) || '' }, { items: items.map(({ side, hitPml, orb, ...x }) => Object.assign(x, { verdict: x.verdict + (orb ? '｜' + orb : ''), note: (d.review && (d.review.items || []).find((y) => y.sym === x.sym) || {}).note || '' })) });
  fs.writeFileSync(file, JSON.stringify(d, null, 1) + '\n'); console.log('已寫入 review');
}
