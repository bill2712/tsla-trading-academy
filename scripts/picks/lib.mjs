// 選股共用計算：日線指標、盤前高低位、盤前相對成交量（RVOL at time）
// 輸入 K 線格式：{ time: [ISO...], open: [], high: [], low: [], close: [], volume: [] }（IBKR get_price_history 原始格式）
// Yahoo chart API 回應可以用 fromYahoo() 轉成同一格式。

export const etDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(d));
export const etHM = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d));
export const r2 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 100) / 100);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export function bars(j) {
  if (!j || !Array.isArray(j.time)) return [];
  return j.time.map((t, i) => ({ t, d: etDate(t), hm: etHM(t), o: j.open[i], h: j.high[i], l: j.low[i], c: j.close[i], v: j.volume ? j.volume[i] : null }))
    .filter((b) => [b.o, b.h, b.l, b.c].every((x) => typeof x === 'number' && isFinite(x)));
}

export function fromYahoo(resp) {
  const r = resp && resp.chart && resp.chart.result && resp.chart.result[0];
  if (!r || !r.timestamp) return { time: [], open: [], high: [], low: [], close: [], volume: [] };
  const q = r.indicators.quote[0];
  return { time: r.timestamp.map((s) => new Date(s * 1000).toISOString()), open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume, meta: r.meta };
}

/* 日線：只用 target 日之前已完成嘅 K 線 */
export function dailyMetrics(dailyJson, target) {
  const D = bars(dailyJson).filter((b) => b.d < target);
  const out = { dailyBars: D.length };
  if (!D.length) return out;
  const last = D[D.length - 1];
  Object.assign(out, { pdDate: last.d, pdc: r2(last.c), pdh: r2(last.h), pdl: r2(last.l), pdo: r2(last.o) });
  const tr = D.map((b, i) => (i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - D[i - 1].c), Math.abs(b.l - D[i - 1].c))));
  out.atr14 = r2(avg(tr.slice(-14)));
  out.atrPct = out.atr14 && last.c ? r2(out.atr14 / last.c * 100) : null;
  out.sma20 = D.length >= 20 ? r2(avg(D.slice(-20).map((b) => b.c))) : null;
  out.sma50 = D.length >= 50 ? r2(avg(D.slice(-50).map((b) => b.c))) : null;
  const vols = D.slice(-20).map((b) => b.v).filter((v) => v != null);
  out.avgVol20 = vols.length ? Math.round(avg(vols)) : null;
  out.high20 = r2(Math.max(...D.slice(-20).map((b) => b.h)));
  out.low20 = r2(Math.min(...D.slice(-20).map((b) => b.l)));
  out.high52w = D.length >= 200 ? r2(Math.max(...D.slice(-252).map((b) => b.h))) : null;
  const up = out.sma20 != null && last.c > out.sma20, dn = out.sma20 != null && last.c < out.sma20;
  out.trend = out.sma20 == null ? '數據不足'
    : out.sma50 == null ? (up ? '收市高過 20 日線（冇 50 日線數據）' : '收市低過 20 日線（冇 50 日線數據）')
    : up && out.sma20 > out.sma50 ? '日線升勢（收市高過 20 日線，20 日線高過 50 日線）'
    : dn && out.sma20 < out.sma50 ? '日線跌勢（收市低過 20 日線，20 日線低過 50 日線）' : '日線橫行／方向未明（20、50 日線同價格位置唔一致）';
  return out;
}

/* 盤前（04:00–09:30 美東）：高低位、最新價、成交量；如果數據有幾日，再計 RVOL at time */
export function premarketMetrics(intraJson, target, pdc, now = Date.now()) {
  const B = bars(intraJson);
  const isPm = (b) => b.hm >= '04:00' && b.hm < '09:30';
  const P = B.filter((b) => b.d === target && isPm(b));
  const out = {};
  if (!P.length) { out.pmNote = '今日未有盤前 K 線（太早、數據唔包盤前，或者唔係交易日）'; return out; }
  out.pmh = r2(Math.max(...P.map((b) => b.h)));
  out.pml = r2(Math.min(...P.map((b) => b.l)));
  out.pmLast = r2(P[P.length - 1].c);
  out.pmLastTime = P[P.length - 1].hm;
  out.pmVolume = P.every((b) => b.v == null) ? null : P.reduce((a, b) => a + (b.v || 0), 0);
  out.pmBars = P.length;
  if (pdc) out.gapPct = r2((out.pmLast - pdc) / pdc * 100);
  // RVOL at time：今日由 04:00 到最後一支「已完成」K 線嘅累積成交，對比之前每日同一段時間嘅平均
  // （未完成嗰支唔計，否則 08:07 嘅 08:00 K 線只有 7 分鐘成交，會低估 RVOL）
  const step = B.length > 1 ? Math.min(...B.slice(1).map((b, i) => new Date(b.t) - new Date(B[i].t)).filter((x) => x > 0)) : 0;
  const done = P.filter((b) => new Date(b.t).getTime() + step <= now);
  const cutoff = done.length ? done[done.length - 1].hm : null;
  const days = [...new Set(B.map((b) => b.d))].filter((d) => d < target).sort().slice(-10);
  const prior = cutoff ? days.map((d) => B.filter((b) => b.d === d && isPm(b) && b.hm <= cutoff).reduce((a, b) => a + (b.v || 0), 0)).filter((v) => v > 0) : [];
  const todayDone = done.reduce((a, b) => a + (b.v || 0), 0);
  if (cutoff && out.pmVolume != null && prior.length >= 3) {
    out.pmAvgSameTime = Math.round(avg(prior));
    out.rvol = r2(todayDone / out.pmAvgSameTime);
    out.rvolDays = prior.length;
    out.rvolCutoff = cutoff;
  } else out.rvolNote = !cutoff ? '今日仲未有完成嘅盤前 K 線' : '之前日子嘅盤前數據唔夠 3 日，計唔到 RVOL';
  // 開市第一支 K 線平均成交（之前日子），用嚟寫「開市推動」嘅成交量確認門檻
  const open = days.map((d) => B.find((b) => b.d === d && b.hm === '09:30')).filter((b) => b && b.v);
  if (open.length >= 3) out.avgOpenBarVol = Math.round(avg(open.map((b) => b.v)));
  return out;
}
