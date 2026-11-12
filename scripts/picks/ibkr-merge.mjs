// IBKR 即時數據 → 選股報告
// IBKR 連接器只可以由 Claude 呼叫，所以排程任務先將每個原始回應「原封不動」寫入檔案，再用呢個 script 計：
//   <dir>/snap-SYM.json = get_price_snapshot 回應（market_data_names: last, bid_ask, volume, change, top_status, open, high, low）
//   <dir>/bars-SYM.json = get_price_history 回應（step FIVE_MINS、outside_rth true、period ONE_WEEK）
// 用法：
//   node scripts/picks/ibkr-merge.mjs data/picks/YYYY-MM-DD.json --mode premarket [--apply-spread] [--write]
//   node scripts/picks/ibkr-merge.mjs data/picks/YYYY-MM-DD.json --mode preopen [--write]
//   其他選項：--dir /tmp/picks/ibkr（預設）、--now ISO（測試用）
// premarket：每隻 pick 加 ibkr（即時價、買賣盤、盤前成交、即時 RVOL、PMH／PML），印出同收集器數字嘅差別。
// preopen：開市前最後更新（d.preopen）：每隻 pick 而家距離入場價幾遠、係咪已經過咗（唔追）、係咪穿咗 Stop。
// 只寫入報告檔，唔會落單、唔會改 IBKR 任何嘢。
import fs from 'node:fs';
import path from 'node:path';
import { premarketMetrics, r2, etHM } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a) => /\.json$/.test(a) && !a.startsWith('--'));
const mode = opt('--mode', 'premarket');
const dir = opt('--dir', '/tmp/picks/ibkr');
const NOW = opt('--now') ? Date.parse(opt('--now')) : Date.now();
const write = args.includes('--write'), applySpread = args.includes('--apply-spread');
if (!file || !['premarket', 'preopen'].includes(mode)) { console.error('用法：node scripts/picks/ibkr-merge.mjs data/picks/YYYY-MM-DD.json --mode premarket|preopen [--write]'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
const r3 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 1000) / 1000);
const readJSON = (f) => { try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; } catch (e) { console.error('⚠️ 讀唔到', f, e.message); return null; } };

/* get_price_snapshot：回應嘅 key 用「-」（bid-ask、top-status）；last.price 有時係 null（同上一筆一樣價） */
function snapOf(sym) {
  const j = readJSON(path.join(dir, `snap-${sym}.json`)); if (!j) return null;
  const ba = j['bid-ask'] || j.bid_ask || {}, L = j.last || {};
  const o = {
    status: (j['top-status'] || j.top_status || {}).status || null,
    last: num(L.price), ts: L.ts ? new Date(L.ts * 1000).toISOString() : null, halted: L.halted === true,
    bid: num(ba.bid) == null ? null : r2(ba.bid), ask: num(ba.ask) == null ? null : r2(ba.ask), bidSize: num(ba.bid_size), askSize: num(ba.ask_size),
    volume: num((j.volume || {}).volume), chgPct: num((j.change || {}).change_pct),
  };
  if (o.bid > 0 && o.ask >= o.bid) { o.spread = r2(o.ask - o.bid); o.spreadPct = r3(((o.ask - o.bid) / ((o.ask + o.bid) / 2)) * 100); if (o.last == null) { o.last = r2((o.bid + o.ask) / 2); o.lastFromMid = true; } }
  return o;
}
const barsOf = (sym) => readJSON(path.join(dir, `bars-${sym}.json`));
const atET = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(NOW));

function ibkrFor(p) {
  const s = snapOf(p.sym), B = barsOf(p.sym);
  if (!s && !B) return null;
  const pdc = p.prevClose ?? (p.levels || {}).pdc;
  const m = B ? premarketMetrics(B, d.date, pdc, NOW) : {};
  const x = Object.assign({ at: new Date(NOW).toISOString(), atET }, s || {});
  if (m.pmh != null) Object.assign(x, { pmh: m.pmh, pml: m.pml, pmVolume: m.pmVolume ?? null, pmLast: m.pmLast ?? null, rvol: m.rvol ?? null, rvolCutoff: m.rvolCutoff ?? null, ema9: m.ema9 ?? null, ema9Pct: m.ema9Pct ?? null });
  if (x.last == null && m.pmLast != null) x.last = m.pmLast;
  if (pdc && x.last != null) x.gapNow = r2((x.last / pdc - 1) * 100);
  Object.keys(x).forEach((k) => x[k] === undefined && delete x[k]);
  return x;
}
const pct = (a, b) => (a == null || !b ? null : r2((a / b - 1) * 100));
const warns = [];
const addSource = (name, ok, note) => { d.sources = d.sources || []; const i = d.sources.findIndex((x) => x.name === name); const v = { name, ok, ...(note ? { note } : {}) }; if (i >= 0) d.sources[i] = v; else d.sources.push(v); };

if (mode === 'premarket') {
  let n = 0;
  (d.picks || []).forEach((p) => {
    const x = ibkrFor(p);
    if (!x) { warns.push(`${p.sym}：冇 IBKR 檔案（${dir}/snap-${p.sym}.json）`); return; }
    p.ibkr = x; n++;
    if (x.status && x.status !== 'REALTIME') warns.push(`${p.sym}：IBKR 數據狀態係 ${x.status}（唔係即時）`);
    const dp = pct(x.last, p.price); if (dp != null && Math.abs(dp) > 0.5) warns.push(`${p.sym}：IBKR 即時價 ${x.last} 同報告價 ${p.price} 差 ${dp}%（報告價係收集器時間，可能已經郁咗）`);
    if (x.rvol != null && x.rvol < 2) warns.push(`${p.sym}：IBKR 即時 RVOL ${x.rvol}（< 2；收集器 ${p.rvol}）→ 跟手冊：加風險、降一級；< 1.2 就移去 watch`);
    if (x.spreadPct != null && x.spreadPct > 0.15) warns.push(`${p.sym}：IBKR 買賣差價 ${x.spreadPct}%（偏闊）`);
    if (applySpread && x.status === 'REALTIME' && x.spreadPct != null) {
      p.spread = x.spread; p.spreadPct = r2(x.spreadPct); p.spreadFrom = 'IBKR';
      const row = (d.scan || []).find((r) => r.sym === p.sym); if (row) row.spreadPct = p.spreadPct;
    }
    console.log(`${p.sym.padEnd(6)} IBKR ${x.status || '—'} ${atET}｜Last ${x.last}（報告 ${p.price}）｜Bid ${x.bid} × ${x.bidSize} / Ask ${x.ask} × ${x.askSize}（${x.spreadPct ?? '—'}%）｜盤前成交 ${x.pmVolume ?? '—'}｜RVOL ${x.rvol ?? '—'}（收集器 ${p.rvol}）｜PMH ${x.pmh ?? '—'}（報告 ${(p.levels || {}).pmh}）`);
  });
  addSource('IBKR 即時報價同盤前 K 線', n > 0, n ? `${n} 隻 pick，美東 ${atET}` : '冇數據');
} else {
  /* 開市前最後更新 */
  const prev = d.preopen || {};
  const items = (d.picks || []).map((p) => {
    const x = ibkrFor(p), t = p.trade || {}, long = t.side !== 'Short', atr = p.atr || Math.abs((t.entry || 0) - (t.stop || 0)) * 2.5 || null;
    const old = (prev.items || []).find((y) => y.sym === p.sym) || {};
    const it = { sym: p.sym, side: t.side || null, entry: t.entry ?? null, stop: t.stop ?? null, target1: t.target1 ?? null };
    if (!x || x.last == null) return Object.assign(it, { status: 'nodata', reason: '冇 IBKR 即時數據', note: old.note || '' });
    Object.assign(it, { last: x.last, bid: x.bid ?? null, ask: x.ask ?? null, spreadPct: x.spreadPct ?? null, gapNow: x.gapNow ?? null, gapReport: p.gapPct ?? null, rvol: x.rvol ?? null, pmh: x.pmh ?? null, pml: x.pml ?? null, dataStatus: x.status || null });
    const L = x.last, past = t.entry == null || !atr ? null : ((long ? L - t.entry : t.entry - L) / atr);
    const broken = t.stop != null && (long ? L <= t.stop : L >= t.stop);
    it.distAtr = past == null ? null : r2(-past); // 正數 = 未到入場價；負數 = 已經過咗
    if (broken) { it.status = 'broken'; it.reason = `盤前已經${long ? '跌穿' : '升穿'} Stop ${t.stop}：今日計劃作廢`; }
    else if (past != null && past > 0.3) { it.status = 'chase'; it.reason = `已經${long ? '高過' : '低過'}入場價 ${t.entry}（${r2(past)} ATR）：開市唔追；等回調有新 Setup 先算`; }
    else if (past != null && past >= 0) { it.status = 'near'; it.reason = `已經喺入場價 ${t.entry} 附近：09:35 後見到確認先入，唔好一開市即追`; }
    else if (past != null) { it.status = 'waiting'; it.reason = `未到入場價 ${t.entry}（差 ${r2(-past)} ATR）：按計劃等觸發`; }
    else { it.status = 'nodata'; it.reason = '計劃冇入場價'; }
    const extra = [];
    if (p.gapPct != null && x.gapNow != null && Math.sign(p.gapPct) === Math.sign(x.gapNow || 0) && Math.abs(x.gapNow) < Math.abs(p.gapPct) / 2) extra.push(`盤前幅度收窄咗一半以上（${p.gapPct}% → ${x.gapNow}%）`);
    if (p.gapPct != null && x.gapNow != null && Math.sign(p.gapPct) !== Math.sign(x.gapNow) && x.gapNow !== 0) extra.push(`盤前方向已經反轉（${p.gapPct}% → ${x.gapNow}%）`);
    if (x.rvol != null && x.rvol < 2) extra.push(`即時 RVOL 得 ${x.rvol}（< 2）`);
    if (x.spreadPct != null && x.spreadPct > 0.15) extra.push(`買賣差價 ${x.spreadPct}% 偏闊`);
    if (x.status && x.status !== 'REALTIME') extra.push(`IBKR 數據係 ${x.status}`);
    if (extra.length) it.reason += '；' + extra.join('；');
    it.note = old.note || '';
    return it;
  });
  const market = ['QQQ', 'SPY', 'IWM'].map((s) => { const x = snapOf(s); return x && x.last != null ? { sym: s, last: x.last, chgPct: x.chgPct ?? null, status: x.status || null } : null; }).filter(Boolean);
  d.preopen = { at: new Date(NOW).toISOString(), atET, source: 'IBKR', market, items, summary: prev.summary || '', newMovers: prev.newMovers || [] };
  items.forEach((it) => console.log(`${it.sym.padEnd(6)} ${String(it.status).padEnd(8)} Last ${it.last ?? '—'}｜Entry ${it.entry}｜${it.reason}`));
  if (!d.preopen.summary) warns.push('preopen.summary 仲係空：寫 1–3 句廣東話總結（邊隻仲可以等、邊隻唔追／作廢）');
  market.forEach((m) => console.log(`${m.sym} ${m.last}（${m.chgPct}%）${m.status || ''}`));
}
if (warns.length) console.log('⚠️\n - ' + warns.join('\n - '));
if (write) { fs.writeFileSync(file, JSON.stringify(d, null, 1) + '\n'); console.log('已寫入', file); }
