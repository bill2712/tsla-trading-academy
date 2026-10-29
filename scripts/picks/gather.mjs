// 盤前選股收集器 v3（多來源、8 大指標）
//   NODE_USE_ENV_PROXY=1 node --no-warnings scripts/picks/gather.mjs --date YYYY-MM-DD [--symbols A,B] [--out /tmp/picks/gather.json]
//   其他選項：--now ISO（測試用）、--max 80（候選池上限）、--no-yahoo（唔用 Yahoo 後備）、--base spy=-0.5,qqq=-1.2（冇指數數據時人手輸入）
//
// 價格／RVOL 來源次序（唔再靠 IBKR）：
//   1. Alpaca（環境變數 ALPACA_KEY_ID／ALPACA_SECRET_KEY）：SIP 全市場 K 線，一次問 30 隻；日線 → ATR、PDH/PDL、平均成交；
//      5 分鐘盤前 K 線（之前 10 個交易日）→ PMH/PML、盤前成交、同時段 RVOL；IEX 報價 → 買賣差價
//   2. Yahoo chart（後備，一次一個，429 就停）
//   3. IBKR 連接器（人手：calc.mjs）
// 其他：StockAnalysis 盤前榜（盤前價、成交，第二來源核對）、Alpaca 異動榜、TopBreakoutStocks、Nasdaq 業績日曆、
//   ForexFactory + Nasdaq 經濟日曆、Finviz（流通股、ATR、行業）、新聞（Alpaca/Benzinga、Google News、Seeking Alpha、
//   Finviz、MarketWatch、Investing.com、CNBC RSS）、SEC EDGAR 公告。
import fs from 'node:fs';
import path from 'node:path';
import { etDate, dailyMetrics, premarketMetrics, rthDays, screen, RULES, r2 } from './lib.mjs';
import * as S from './sources.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const NOW = opt('--now') ? Date.parse(opt('--now')) : Date.now();
const target = opt('--date', etDate(new Date(NOW)));
const outFile = opt('--out', '/tmp/picks/gather.json');
const MAX = Number(opt('--max', 80));
const useYahoo = !args.includes('--no-yahoo');
const CORE = ['TSLA', 'NVDA', 'AAPL', 'AMD', 'META', 'AMZN', 'MSFT', 'GOOGL', 'AVGO', 'NFLX', 'PLTR', 'COIN', 'MU', 'SMCI', 'MSTR', 'HOOD', 'ARM', 'INTC'];
const INDEX = ['SPY', 'QQQ', 'IWM', 'DIA', 'SMH', 'XLK', 'XLC', 'XLY', 'XLP', 'XLV', 'XLF', 'XLI', 'XLE', 'XLB', 'XLRE', 'XLU', 'XBI'];
const SECTOR_ETF = { 'Technology': 'XLK', 'Communication Services': 'XLC', 'Consumer Cyclical': 'XLY', 'Consumer Defensive': 'XLP', 'Healthcare': 'XLV', 'Financial': 'XLF', 'Industrials': 'XLI', 'Energy': 'XLE', 'Basic Materials': 'XLB', 'Real Estate': 'XLRE', 'Utilities': 'XLU' };
const userSyms = (opt('--symbols', '') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const okSym = (s) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(s || '');
const prevWeekday = (d) => { const t = new Date(d + 'T12:00:00Z'); do { t.setUTCDate(t.getUTCDate() - 1); } while ([0, 6].includes(t.getUTCDay())); return t.toISOString().slice(0, 10); };
const etMidnightISO = (d) => new Date(Date.parse(d + 'T04:00:00Z')).toISOString(); // 美東 00:00 ≈ UTC 04:00/05:00，早一個鐘冇問題

/* ---------- 1. 發掘候選 ---------- */
const result = { version: 3, generatedAt: new Date(NOW).toISOString(), target, rules: RULES, sources: S.sources, lists: {}, market: {}, symbols: {}, scanDraft: [] };
const [saG, saL, alpM, tbs, ernToday, ernPrev, ff] = await Promise.all([
  S.stockanalysisPremarket('gainers'), S.stockanalysisPremarket('losers'), S.alpacaMovers(), S.topBreakout(),
  S.nasdaqEarnings(target), S.nasdaqEarnings(prevWeekday(target)), S.ffCalendar(target)
]);
const econ = await S.nasdaqEconomic(target, ff);
result.lists = { stockanalysisGainers: saG, stockanalysisLosers: saL, alpaca: alpM, topBreakout: tbs };
const earnMap = {};
ernToday.filter((e) => e.when !== '盤後').forEach((e) => (earnMap[e.sym] = Object.assign({ day: target }, e)));
ernPrev.filter((e) => e.when === '盤後').forEach((e) => (earnMap[e.sym] = Object.assign({ day: prevWeekday(target) }, e)));
result.market.earnings = Object.values(earnMap).sort((a, b) => b.mcap - a.mcap).slice(0, 40);
result.market.economic = ff.map((e) => { const n = (econ.rows || []).find((r) => r.name && e.name && r.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])); return Object.assign({}, e, n && n.actual ? { actual: n.actual } : {}); });
result.market.economicNote = econ.note || '';

const saMap = {}; [...saG, ...saL].forEach((r) => (saMap[r.sym] = r));
const tbsMap = {}; tbs.watch.forEach((x) => (tbsMap[x.sym] = Object.assign({ kind: '即將突破' }, x))); tbs.yesterday.forEach((x) => (tbsMap[x.sym] = tbsMap[x.sym] || Object.assign({ kind: '昨日突破' }, x)));
// 候選池：細價、冇乜成交嘅盤前異動股先過濾走（新手唔做 $1 以下、盤前成交 < 5 萬股）
const saPool = [...saG, ...saL].filter((r) => (r.price == null || r.price >= 1) && (r.pmVolume == null || r.pmVolume >= 50000)).map((r) => r.sym);
const pool = [...new Set([
  ...userSyms, ...saPool, ...alpM.gainers.slice(0, 20).map((x) => x.sym), ...alpM.losers.slice(0, 15).map((x) => x.sym), ...alpM.active.slice(0, 15).map((x) => x.sym),
  ...result.market.earnings.filter((e) => e.mcap >= 2e9).map((e) => e.sym), ...CORE,
  ...tbs.watch.map((x) => x.sym), ...tbs.yesterday.map((x) => x.sym)
])].filter(okSym).filter((s) => !INDEX.includes(s)).slice(0, MAX);

/* ---------- 2. 價格數據：Alpaca → Yahoo ---------- */
const all = [...INDEX, ...pool];
const dStart = new Date(NOW - 400 * 86400e3).toISOString();
const iStart = etMidnightISO(new Date(NOW - 16 * 86400e3).toISOString().slice(0, 10));
const [daily, intra, snaps] = await Promise.all([S.alpacaBars(all, '1Day', dStart, NOW), S.alpacaBars(all, '5Min', iStart, NOW), S.alpacaSnapshots(all)]);
if (!S.hasAlpaca) S.skip('Alpaca K 線', '未設定 ALPACA_KEY_ID／ALPACA_SECRET_KEY（喺環境設定加）');
const feedNote = daily.feed === 'iex' || intra.feed === 'iex' ? 'Alpaca IEX（只係一間交易所，成交量偏低；RVOL 比較仍然有效）' : 'Alpaca SIP（全市場，延遲 16 分鐘）';

function metricsFrom(sym, D, I, src) {
  const m = Object.assign({ sym, dataSource: src }, dailyMetrics(D, target));
  if (!m.pdc) return Object.assign(m, { error: '冇日線數據' });
  if (I) {
    Object.assign(m, premarketMetrics(I, target, m.pdc, NOW));
    const prev = rthDays(I).filter((d) => d.d < target).pop();
    // PDH/PDL 用正常時段（09:30–16:00）；日線可能包埋盤前盤後，差得遠就記低
    if (prev && prev.d === m.pdDate) { m.pdhDaily = m.pdh; m.pdlDaily = m.pdl; m.pdh = r2(prev.h); m.pdl = r2(prev.l); }
  }
  if (m.avgVol20 && m.pmVolume != null) m.pmVolPct = r2(m.pmVolume / m.avgVol20 * 100);
  return m;
}
const M = {};
all.forEach((s) => { if (daily.bars[s]) M[s] = metricsFrom(s, daily.bars[s], intra.bars[s], feedNote); });
// Yahoo 後備：Alpaca 冇數據嘅先問；指數同盤前異動優先；一次一個
const missing = all.filter((s) => !M[s] || M[s].rvol == null);
if (useYahoo && missing.length) {
  const order = [...missing].sort((a, b) => (INDEX.includes(b) - INDEX.includes(a)) || (Math.abs((saMap[b] || {}).chgPct || 0) - Math.abs((saMap[a] || {}).chgPct || 0))).slice(0, 40);
  for (const s of order) {
    if (S.yahooBlocked()) break;
    const ysym = s.replace('.', '-');
    const D = await S.yahooChart(ysym, '1y', '1d', false); if (!D) continue;
    const I = await S.yahooChart(ysym, '15d', '5m', true);
    const m = metricsFrom(s, D, I, 'Yahoo（後備）');
    if (!M[s] || (m.rvol != null && M[s].rvol == null)) M[s] = m;
  }
} else if (!useYahoo) S.skip('Yahoo 價格（後備）', '用咗 --no-yahoo');

/* ---------- 3. 大市基準 ---------- */
const idx = {};
INDEX.forEach((s) => { const m = M[s]; if (m) idx[s] = { last: m.pmLast ?? null, pdc: m.pdc ?? null, chgPct: m.gapPct ?? null, rvol: m.rvol ?? null, trend: m.trend, time: m.pmLastTime || null, source: m.dataSource }; });
result.market.indices = idx;
// 冇 Alpaca／Yahoo 嘅時候，可以用 --base spy=-0.5,qqq=-1.2（例如由 trader-alerts quote 或 IBKR 攞）
const baseArg = Object.fromEntries((opt('--base', '') || '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split('='); return [k.trim().toLowerCase(), Number(v)]; }));
const base = { spy: idx.SPY && idx.SPY.chgPct != null ? idx.SPY.chgPct : baseArg.spy ?? null, qqq: idx.QQQ && idx.QQQ.chgPct != null ? idx.QQQ.chgPct : baseArg.qqq ?? null };
result.market.base = Object.assign({ from: idx.QQQ && idx.QQQ.chgPct != null ? idx.QQQ.source : (baseArg.qqq != null ? '--base（人手輸入）' : null) }, base);

/* ---------- 4. 每隻股票：買賣差價、第二來源核對、初步排序 ---------- */
pool.forEach((s) => {
  const m = M[s] || { sym: s, error: '冇價格數據（Alpaca 未設定／Yahoo 限流）' };
  const sa = saMap[s];
  if (sa) {
    m.stockanalysis = { price: sa.price, chgPct: sa.chgPct, pmVolume: sa.pmVolume, marketCapB: sa.marketCapB };
    if (m.pmLast == null && sa.price != null) { m.pmLast = sa.price; m.gapPct = sa.chgPct; m.pmVolume = sa.pmVolume; m.priceFrom = 'StockAnalysis'; }
    else if (m.pmLast && sa.price) m.xcheckPct = r2((sa.price - m.pmLast) / m.pmLast * 100);
  }
  const q = snaps[s];
  if (q && q.bid > 0 && q.ask > 0 && q.ask >= q.bid) { const mid = (q.bid + q.ask) / 2; m.spread = r2(q.ask - q.bid); m.spreadPct = r2((q.ask - q.bid) / mid * 100); m.quote = Object.assign({ feed: 'IEX' }, q); }
  if (q && q.last && q.lastTime && NOW - Date.parse(q.lastTime) < 10 * 60e3) m.lastIex = q.last;
  m.lists = [];
  if (saG.find((x) => x.sym === s)) m.lists.push('StockAnalysis 盤前升幅榜');
  if (saL.find((x) => x.sym === s)) m.lists.push('StockAnalysis 盤前跌幅榜');
  if (alpM.gainers.find((x) => x.sym === s) || alpM.losers.find((x) => x.sym === s)) m.lists.push('Alpaca 異動榜');
  if (alpM.active.find((x) => x.sym === s)) m.lists.push('Alpaca 最活躍');
  if (tbsMap[s]) { m.topBreakout = tbsMap[s]; m.lists.push(tbsMap[s].kind === '即將突破' ? 'TopBreakoutStocks 即將突破' : 'TopBreakoutStocks 昨日突破'); }
  if (earnMap[s]) { m.earningsToday = earnMap[s]; }
  M[s] = m;
});
// 詳細資料（Finviz、新聞、SEC）只查最有機會嘅 40 隻：RVOL ≥ 2 先，之後跳空大、盤前成交多
const rank = (m) => (m.rvol >= 2 ? 1000 : 0) + Math.min(Math.abs(m.gapPct || 0), 50) * 10 + Math.min((m.pmVolume || 0) / 1e5, 100) + (CORE.includes(m.sym) ? 5 : 0) + (earnMap[m.sym] ? 50 : 0);
const short = pool.map((s) => M[s]).filter((m) => m.pmLast != null || m.pdc != null).sort((a, b) => rank(b) - rank(a)).slice(0, 40).map((m) => m.sym);

/* ---------- 5. 新聞 + 基本資料 ---------- */
const [alpNews, mktNews] = await Promise.all([S.alpacaNews(short, NOW), S.marketNews(NOW)]);
result.market.news = mktNews.slice(0, 40);
await S.pool(short, 4, async (s) => {
  const m = M[s];
  const fv = await S.finviz(s);
  const [gn, sa, sec] = await Promise.all([S.googleNews(s, null, NOW), S.seekingAlpha(s, NOW), S.secFilings(s, NOW)]);
  if (fv) {
    m.finviz = Object.assign({}, fv, { news: undefined });
    m.floatM = fv.floatM; m.marketCapB = fv.marketCapB; m.sector = fv.sector; m.industry = fv.industry; m.shortFloat = fv.shortFloat;
    if (fv.atr14 && m.atr14) m.atrCheckPct = r2((fv.atr14 - m.atr14) / m.atr14 * 100);
    if (m.pdc == null && fv.prevClose) { m.pdc = fv.prevClose; m.pdcFrom = 'Finviz'; }
    if (m.atrPct == null && fv.atr14 && m.pdc) { m.atr14 = fv.atr14; m.atrPct = r2(fv.atr14 / m.pdc * 100); m.atrFrom = 'Finviz'; }
    if (m.avgVol20 == null && fv.avgVolume) m.avgVol20 = fv.avgVolume;
  }
  const seen = new Set();
  const mentions = (n) => new RegExp(`\\b${s}\\b`).test(n.title) || n.source.includes('Alpaca') || n.source === 'Finviz' || n.source.includes('Seeking Alpha');
  m.news = [...(alpNews[s] || []), ...((fv && fv.news) || []), ...sa, ...gn.filter((n) => mentions(n) || !fv)]
    .filter((n) => { const k = n.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 10);
  m.newsSources = [...new Set(m.news.map((n) => n.source.replace(/（.*）/, '')))];
  m.filings = sec;
  const etf = m.industry === 'Semiconductors' ? 'SMH' : m.industry && /Biotechnology/.test(m.industry) ? 'XBI' : SECTOR_ETF[m.sector];
  if (etf && idx[etf] && idx[etf].chgPct != null && m.gapPct != null) { m.sectorEtf = etf; m.rsSector = r2(m.gapPct - idx[etf].chgPct); }
});

/* ---------- 6. 8 大指標 ---------- */
pool.forEach((s) => {
  const m = M[s];
  if (m.pmLast == null) return;
  m.screen = screen(m, base);
  m.rsSpy = m.screen.rsSpy; m.rsQqq = m.screen.rsQqq;
  result.symbols[s] = m;
});
const rows = Object.values(result.symbols).sort((a, b) => (b.screen.rvolOk - a.screen.rvolOk) || (b.screen.passed - a.screen.passed) || Math.abs(b.gapPct || 0) - Math.abs(a.gapPct || 0));
result.scanDraft = rows.slice(0, 30).map((m) => ({
  sym: m.sym, price: m.pmLast, gapPct: m.gapPct ?? null, rvol: m.rvol ?? null, pmVolume: m.pmVolume ?? null, avgVolume: m.avgVol20 ?? null,
  floatM: m.floatM ?? null, atrPct: m.atrPct ?? null, spreadPct: m.spreadPct ?? null, rsQqq: m.rsQqq ?? null,
  catalyst: m.earningsToday ? `業績（${m.earningsToday.when}）` : (m.news && m.news[0] ? m.news[0].title.slice(0, 80) : ''), passed: m.screen.passed, verdict: '', note: ''
}));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 1));

/* ---------- 7. 摘要 ---------- */
const fmt = (v, d = 1) => (v == null ? '—' : typeof v === 'number' ? (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.abs(v) >= 1e3 ? Math.round(v / 1e3) + 'K' : v.toFixed(d)) : String(v));
const mark = (p) => (p === true ? '✅' : p === false ? '❌' : '・');
console.log(`目標日 ${target}｜寫入 ${outFile}｜候選池 ${pool.length} 隻，有價格 ${rows.length} 隻`);
console.log('來源：' + Object.entries(S.sources).map(([k, v]) => `${k} ${v.ok ? '✅' + v.ok : ''}${v.fail ? '❌' + v.fail : ''}${!v.ok && v.error ? '（' + v.error + '）' : ''}`).join('｜'));
console.log(`大市：` + ['SPY', 'QQQ', 'IWM', 'SMH'].map((s) => `${s} ${idx[s] ? fmt(idx[s].chgPct, 2) + '%' : '—'}`).join('  ') + (base.qqq != null && !idx.QQQ ? `（RS 基準用 --base：SPY ${base.spy}%、QQQ ${base.qqq}%）` : '') + (result.market.economic.length ? `｜今日數據：${result.market.economic.filter((e) => e.impact === '高').map((e) => e.timeET + ' ' + e.name).join('、') || '冇高影響'}` : ''));
console.log('代號    價格     跳空%  RVOL  盤前量   流通M   ATR%  差價%  RS/QQQ 消息 8項   來源');
rows.slice(0, 45).forEach((m) => { const c = m.screen.checks; console.log([m.sym.padEnd(7), fmt(m.pmLast, 2).padEnd(8), (mark(c.gap.pass) + fmt(m.gapPct)).padEnd(7), (mark(c.rvol.pass) + fmt(m.rvol)).padEnd(6), (mark(c.pmVolume.pass) + fmt(m.pmVolume)).padEnd(8), (mark(c.float.pass) + (m.floatM == null ? '—' : String(Math.round(m.floatM)))).padEnd(7), (mark(c.atr.pass) + fmt(m.atrPct)).padEnd(6), (mark(c.spread.pass) + fmt(m.spreadPct, 2)).padEnd(6), (mark(c.rs.pass) + fmt(m.rsQqq)).padEnd(7), (mark(c.catalyst.pass) + String((m.news || []).length)).padEnd(4), `${m.screen.passed}/${m.screen.known}`.padEnd(5), (m.dataSource || m.priceFrom || '').slice(0, 14)].join(' ')); });
