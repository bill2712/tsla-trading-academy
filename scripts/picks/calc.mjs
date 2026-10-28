// 用法：node scripts/picks/calc.mjs [--date YYYY-MM-DD] <daily.json> [premarket.json]
//   --date ＝ 目標交易日（預設今日美東日期）；昨日數據 = 呢日之前最後一支日線
//   daily.json     ＝ IBKR get_price_history 原始回應（step ONE_DAY，outside_rth false，最好 THREE_MONTHS）
//   premarket.json ＝ IBKR get_price_history 原始回應（step FIVE_MINS，outside_rth true，period ONE_DAY），可選
// 輸出：昨收、昨日高低、ATR14、SMA20/50、20 日平均成交、日線趨勢、盤前高低位同盤前成交量。
// 只計「今日之前」已完成嘅日線，避免將今日未完成嘅 K 線當成昨日。
import fs from 'node:fs';

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const etDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(iso));
const etHM = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const r2 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 100) / 100);
const args = process.argv.slice(2);
const di = args.indexOf('--date');
const today = di >= 0 ? args.splice(di, 2)[1] : etDate(new Date().toISOString());
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) { console.error('--date 要係 YYYY-MM-DD'); process.exit(1); }

function bars(j) {
  return (j.time || []).map((t, i) => ({ t, d: etDate(t), hm: etHM(t), o: j.open[i], h: j.high[i], l: j.low[i], c: j.close[i], v: j.volume ? j.volume[i] : null }))
    .filter((b) => [b.o, b.h, b.l, b.c].every((x) => typeof x === 'number' && isFinite(x)));
}

const [dailyFile, pmFile] = args;
if (!dailyFile) { console.error('用法：node scripts/picks/calc.mjs <daily.json> [premarket.json]'); process.exit(1); }
const D = bars(read(dailyFile)).filter((b) => b.d < today);
const out = { today, dailyBars: D.length };
if (D.length) {
  const last = D[D.length - 1];
  Object.assign(out, { pdDate: last.d, pdc: r2(last.c), pdh: r2(last.h), pdl: r2(last.l), pdo: r2(last.o) });
  const tr = D.map((b, i) => (i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - D[i - 1].c), Math.abs(b.l - D[i - 1].c))));
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  out.atr14 = r2(avg(tr.slice(-14)));
  out.atrPct = out.atr14 && last.c ? r2(out.atr14 / last.c * 100) : null;
  out.sma20 = D.length >= 20 ? r2(avg(D.slice(-20).map((b) => b.c))) : null;
  out.sma50 = D.length >= 50 ? r2(avg(D.slice(-50).map((b) => b.c))) : null;
  const vols = D.slice(-20).map((b) => b.v).filter((v) => v != null);
  out.avgVol20 = vols.length ? Math.round(avg(vols)) : null;
  out.high20 = r2(Math.max(...D.slice(-20).map((b) => b.h)));
  out.low20 = r2(Math.min(...D.slice(-20).map((b) => b.l)));
  const up = out.sma20 != null && last.c > out.sma20, dn = out.sma20 != null && last.c < out.sma20;
  out.trend = out.sma20 == null ? '數據不足'
    : out.sma50 == null ? (up ? '收市高過 20 日線（冇 50 日線數據）' : '收市低過 20 日線（冇 50 日線數據）')
    : up && out.sma20 > out.sma50 ? '日線升勢（收市高過 20 日線，20 日線高過 50 日線）'
    : dn && out.sma20 < out.sma50 ? '日線跌勢（收市低過 20 日線，20 日線低過 50 日線）' : '日線橫行／方向未明（20、50 日線同價格位置唔一致）';
}
if (pmFile) {
  const P = bars(read(pmFile)).filter((b) => b.d === today && b.hm >= '04:00' && b.hm < '09:30');
  if (P.length) {
    out.pmh = r2(Math.max(...P.map((b) => b.h)));
    out.pml = r2(Math.min(...P.map((b) => b.l)));
    out.pmLast = r2(P[P.length - 1].c);
    out.pmLastTime = P[P.length - 1].hm;
    out.pmVolume = P.every((b) => b.v == null) ? null : P.reduce((a, b) => a + (b.v || 0), 0);
    out.pmBars = P.length;
  } else out.pmNote = '今日未有盤前 K 線（可能太早，或者 outside_rth 未設 true）';
}
if (out.pdc != null && out.pmLast != null) out.gapPct = r2((out.pmLast - out.pdc) / out.pdc * 100);
if (out.avgVol20 && out.pmVolume != null) out.pmVolPct = r2(out.pmVolume / out.avgVol20 * 100);
console.log(JSON.stringify(out, null, 2));
