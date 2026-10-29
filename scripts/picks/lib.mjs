// 選股共用計算：日線指標、盤前高低位、盤前相對成交量（RVOL at time）
// 輸入 K 線格式：{ time: [ISO...], open: [], high: [], low: [], close: [], volume: [] }（IBKR get_price_history 原始格式）
// Yahoo chart API 回應可以用 fromYahoo() 轉成同一格式。

export const etDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(d));
export const etHM = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d));
export const r2 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 100) / 100);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
/* EMA：頭 n 支用簡單平均做起點 */
export function ema(values, n = 9) {
  const v = values.filter((x) => typeof x === 'number' && isFinite(x));
  if (v.length < n) return null;
  const k = 2 / (n + 1); let e = avg(v.slice(0, n));
  for (let i = n; i < v.length; i++) e = v[i] * k + e * (1 - k);
  return e;
}

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
  out.ema9Daily = r2(ema(D.map((b) => b.c), 9));
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
  // EMA 9：用日內 K 線（包盤前盤後，連之前幾日做熱身），計到今日最後一支已完成嘅 K 線
  if (done.length) {
    const last = new Date(done[done.length - 1].t).getTime();
    const e9 = ema(B.filter((b) => b.d <= target && new Date(b.t).getTime() <= last).map((b) => b.c), 9);
    if (e9 != null) { out.ema9 = r2(e9); out.ema9Step = step >= 3600e3 ? '60m' : Math.round(step / 60e3) + 'm'; out.ema9Pct = r2((done[done.length - 1].c - e9) / e9 * 100); }
  }
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

/* Alpaca bars（[{t,o,h,l,c,v}]）→ 同 IBKR 一樣嘅格式 */
export function fromAlpaca(list) {
  const B = Array.isArray(list) ? list : [];
  return { time: B.map((b) => b.t), open: B.map((b) => b.o), high: B.map((b) => b.h), low: B.map((b) => b.l), close: B.map((b) => b.c), volume: B.map((b) => b.v) };
}

/* 由日內 K 線砌返每日正常時段（09:30–16:00）嘅高低位，用嚟核對 PDH/PDL */
export function rthDays(intraJson) {
  const by = {};
  bars(intraJson).filter((b) => b.hm >= '09:30' && b.hm < '16:00').forEach((b) => {
    const d = (by[b.d] = by[b.d] || { d: b.d, h: -Infinity, l: Infinity, v: 0 });
    d.h = Math.max(d.h, b.h); d.l = Math.min(d.l, b.l); d.v += b.v || 0; d.c = b.c; if (d.o == null) d.o = b.o;
  });
  return Object.values(by).sort((a, b) => (a.d < b.d ? -1 : 1));
}

/* 「5.85B」「26.06M」「1,234,567」→ 數字 */
export function parseNum(s) {
  if (s == null) return null;
  const m = String(s).replace(/,/g, '').match(/^\s*(-?[\d.]+)\s*([KMBT])?/i);
  if (!m) return null;
  const k = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[(m[2] || '').toUpperCase()] || 1;
  const v = parseFloat(m[1]) * k;
  return isFinite(v) ? v : null;
}

/* 盤前揀股 8 大指標嘅預設門檻（新手起步值，唔係驗證過嘅獲利門檻） */
export const RULES = {
  gapAbs: 3,          // 1. |盤前漲跌幅| ≥ 3%
  rvol: 2,            // 2. 盤前同時段 RVOL ≥ 2（硬性規則）
  pmVolume: 200000,   // 3. 盤前成交 ≥ 20 萬股（08:30 前用 pmVolumeEarly）
  pmVolumeEarly: 100000,
  catalyst: true,     // 4. 要有消息催化劑（新聞／公告／業績）
  floatM: 30,         // 5. 流通股 ≥ 3,000 萬
  atrPct: 2,          // 6. ATR% ≥ 2%
  spreadPct: 0.1,     // 7. 買賣差價 ≤ 0.1%
  rs: true,           // 8. 相對大市強弱：同交易方向一致地跑贏／跑輸 QQQ
  ema9: true,         // 9. EMA 9（5 分鐘，包盤前）：做多價格要喺 EMA 9 之上，沽空要喺之下
  avgVolume: 1000000, // 額外：平均成交 ≥ 100 萬股
  priceMin: 10, priceMax: 150 // 額外：新手價格範圍
};

/* 計 8 大指標：每項 {v, pass}，pass = true/false/null（null = 冇數據） */
export function screen(m, base = {}, rules = RULES) {
  const has = (v) => v != null && isFinite(v);
  const dir = has(m.gapPct) ? (m.gapPct >= 0 ? 1 : -1) : 0;
  const rsQqq = has(m.gapPct) && has(base.qqq) ? r2(m.gapPct - base.qqq) : null;
  const rsSpy = has(m.gapPct) && has(base.spy) ? r2(m.gapPct - base.spy) : null;
  const early = m.rvolCutoff && m.rvolCutoff < '08:30';
  const pmMin = early ? rules.pmVolumeEarly : rules.pmVolume;
  const cat = (m.news && m.news.length) || (m.filings && m.filings.length) || m.earningsToday ? true : m.news ? false : null;
  const c = {
    gap: { v: m.gapPct ?? null, pass: has(m.gapPct) ? Math.abs(m.gapPct) >= rules.gapAbs : null },
    rvol: { v: m.rvol ?? null, pass: has(m.rvol) ? m.rvol >= rules.rvol : null },
    pmVolume: { v: m.pmVolume ?? null, pass: has(m.pmVolume) ? m.pmVolume >= pmMin : null, min: pmMin },
    catalyst: { v: cat, pass: cat },
    float: { v: m.floatM ?? null, pass: has(m.floatM) ? m.floatM >= rules.floatM : null },
    atr: { v: m.atrPct ?? null, pass: has(m.atrPct) ? m.atrPct >= rules.atrPct : null },
    spread: { v: m.spreadPct ?? null, pass: has(m.spreadPct) ? m.spreadPct <= rules.spreadPct : null },
    rs: { v: rsQqq, pass: has(rsQqq) && dir ? rsQqq * dir > 0 : null },
    ema9: { v: m.ema9Pct ?? null, pass: has(m.ema9Pct) && dir ? m.ema9Pct * dir > 0 : null }
  };
  const extra = {
    avgVolume: { v: m.avgVol20 ?? null, pass: has(m.avgVol20) ? m.avgVol20 >= rules.avgVolume : null },
    price: { v: m.pmLast ?? null, pass: has(m.pmLast) ? m.pmLast >= rules.priceMin && m.pmLast <= rules.priceMax : null }
  };
  const vals = Object.values(c);
  return { checks: c, extra, rsSpy, rsQqq, passed: vals.filter((x) => x.pass === true).length, known: vals.filter((x) => x.pass != null).length, rvolOk: c.rvol.pass === true };
}
