// 多來源數據收集（唔使人手抄數據）：
//   NODE_USE_ENV_PROXY=1 node --no-warnings scripts/picks/gather.mjs --date YYYY-MM-DD [--symbols TSLA,NVDA] [--movers] [--out /tmp/picks/gather.json]
// 來源（每個都係可選；失敗會記錄喺 sources，唔會令成個程式停）：
//   Yahoo Finance chart API（日線 + 5 分鐘盤前 → ATR、PDH/PDL、PMH/PML、跳空、RVOL at time）
//   Yahoo Finance RSS（個股新聞）、Finviz（流通股、沽空比例、業績日、新聞）
//   Nasdaq API（今日業績、經濟數據日曆）、SEC EDGAR（最近 3 日 8-K 等公告）
//   StockAnalysis（盤前升跌榜，用嚟發掘候選股）、Alpaca News（環境變數有 ALPACA_KEY_ID／ALPACA_SECRET_KEY 先用）
// 需要環境網絡容許：query1/query2.finance.yahoo.com、feeds.finance.yahoo.com、finviz.com、api.nasdaq.com、
//   www.sec.gov、data.sec.gov、stockanalysis.com、data.alpaca.markets
import fs from 'node:fs';
import path from 'node:path';
import { etDate, dailyMetrics, premarketMetrics, fromYahoo, r2 } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const target = opt('--date', etDate(new Date()));
const outFile = opt('--out', '/tmp/picks/gather.json');
const CORE = ['TSLA', 'NVDA', 'AAPL', 'AMD', 'META', 'AMZN', 'MSFT', 'GOOGL', 'AVGO', 'NFLX', 'PLTR', 'COIN', 'MU', 'SMCI', 'MSTR', 'HOOD', 'ARM', 'INTC'];
const INDEX = ['SPY', 'QQQ', 'IWM', 'DIA', 'SMH', 'XLK', '^VIX', '^TNX', 'ES=F', 'NQ=F', 'CL=F', 'DX-Y.NYB', 'BTC-USD'];
let symbols = (opt('--symbols', '') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
if (!symbols.length) symbols = CORE.slice();
const wantMovers = args.includes('--movers');
// Yahoo 預設唔用：佢對呢個雲端 IP 限流（HTTP 429）。價格同 RVOL 用 IBKR；Yahoo 報價同新聞交俾 trader-alerts／trader-news（一次一隻）。
const useYahoo = args.includes('--yahoo');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
// SEC 要求每個請求附真實聯絡電郵：喺 scripts/picks/config.json 填 secContact，或者設環境變數 SEC_CONTACT
let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url), 'utf8')); } catch (e) {}
// 同 trader-skill 共用：SEC_USER_AGENT（「名 電郵」）亦得
const SEC_CONTACT = process.env.SEC_CONTACT || process.env.SEC_USER_AGENT || cfg.secContact || '';
const SEC_UA = `tsla-trading-academy research ${SEC_CONTACT}`;
const sources = {};
const note = (name, ok, extra) => { const s = (sources[name] = sources[name] || { ok: 0, fail: 0 }); ok ? s.ok++ : s.fail++; if (!ok && extra && !s.error) s.error = String(extra).slice(0, 160); };

async function get(url, { json = true, headers = {}, timeout = 15000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: Object.assign({ 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html,application/xml' }, headers), signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return json ? await r.json() : await r.text();
  } finally { clearTimeout(t); }
}
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
const strip = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const recent = (iso, hours) => { const t = Date.parse(iso); return isFinite(t) && Date.now() - t <= hours * 3600e3; };

/* ---------- Yahoo 價格 ---------- */
let yahoo429 = 0; // 連續被限流 3 次就唔再問 Yahoo（尊重對方限流）
let yq = Promise.resolve(); // Yahoo 一次只問一個，每個之間隔 0.5 秒，避免觸發限流
function yahooChart(sym, range, interval, prepost) {
  if (!useYahoo) return Promise.resolve(null);
  const run = yq.then(() => yahooChartNow(sym, range, interval, prepost)).finally(() => new Promise((r) => setTimeout(r, 500)));
  yq = run.catch(() => {});
  return run;
}
async function yahooChartNow(sym, range, interval, prepost) {
  if (yahoo429 >= 3) { note('Yahoo 價格', false, 'HTTP 429（Yahoo 限流，已停止再試）'); return null; }
  const host = Math.random() < 0.5 ? 'query1' : 'query2';
  const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=${prepost}`;
  for (let a = 0; a < 2; a++) {
    try { const j = await get(url); yahoo429 = 0; note('Yahoo 價格', true); return j; }
    catch (e) { if (/429/.test(e.message)) yahoo429++; if (a === 1 || !/429/.test(e.message) || yahoo429 >= 3) { note('Yahoo 價格', false, /429/.test(e.message) ? 'HTTP 429（Yahoo 限流）' : e.message); return null; } await new Promise((r) => setTimeout(r, 3000)); }
  }
  return null;
}
async function yahooMetrics(sym) {
  if (!useYahoo) return { sym, note: '價格同 RVOL 用 IBKR（Yahoo 預設關閉）' };
  const [d, i] = await Promise.all([yahooChart(sym, '1y', '1d', false), yahooChart(sym, '10d', '5m', true)]);
  if (!d) return { sym, error: 'Yahoo 日線失敗' };
  const D = fromYahoo(d), meta = D.meta || {};
  const out = Object.assign({ sym, name: meta.longName || meta.shortName || null, currency: meta.currency, exchange: meta.exchangeName }, dailyMetrics(D, target));
  if (i) Object.assign(out, premarketMetrics(fromYahoo(i), target, out.pdc));
  if (out.avgVol20 && out.pmVolume != null) out.pmVolPct = r2(out.pmVolume / out.avgVol20 * 100);
  out.rvolPass = out.rvol == null ? null : out.rvol >= 2;
  return out;
}

/* ---------- 新聞 ---------- */
async function yahooNews(sym) {
  if (!useYahoo) return [];
  if (yahoo429 >= 3) { note('Yahoo 新聞 RSS', false, 'HTTP 429（Yahoo 限流，已停止再試）'); return []; }
  try {
    const x = await get(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(sym)}&region=US&lang=en-US`, { json: false });
    const items = [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
      const g = (tag) => strip((m[1].match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1]);
      return { title: g('title'), url: g('link'), time: new Date(g('pubDate')).toISOString(), source: 'Yahoo Finance' };
    }).filter((n) => n.title && /^https:/.test(n.url) && recent(n.time, 72)).slice(0, 6);
    note('Yahoo 新聞 RSS', true); return items;
  } catch (e) { note('Yahoo 新聞 RSS', false, e.message); return []; }
}
async function finviz(sym) {
  try {
    const h = await get(`https://finviz.com/quote.ashx?t=${encodeURIComponent(sym.replace('.', '-'))}&p=d`, { json: false });
    const field = (label) => { const m = h.match(new RegExp(`>${label}<\\/td>\\s*<td[^>]*>(?:<[^>]+>)*([^<]+)`)); return m ? m[1].trim() : null; };
    const news = [...h.matchAll(/<a[^>]+class="tab-link-news"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].slice(0, 6).map((m) => ({ title: strip(m[2]), url: m[1].startsWith('http') ? m[1] : 'https://finviz.com' + m[1], source: 'Finviz' })).filter((n) => /^https:/.test(n.url));
    const ok = field('Shs Float') || news.length;
    note('Finviz', !!ok, ok ? '' : '頁面格式改咗，讀唔到欄位');
    if (!ok) return null;
    return { float: field('Shs Float'), shortFloat: field('Short Float'), earnings: field('Earnings'), relVolume: field('Rel Volume'), avgVolume: field('Avg Volume'), marketCap: field('Market Cap'), sector: field('Sector'), news };
  } catch (e) { note('Finviz', false, e.message); return null; }
}
let secMap = null;
async function secFilings(sym) {
  if (!/@/.test(SEC_CONTACT)) { sources['SEC EDGAR'] = { ok: 0, fail: 0, error: '未設定聯絡電郵（config.json secContact）' }; return []; }
  try {
    if (!secMap) { const j = await get('https://www.sec.gov/files/company_tickers.json', { headers: { 'User-Agent': SEC_UA } }); secMap = {}; Object.values(j).forEach((r) => (secMap[r.ticker] = r.cik_str)); }
    const cik = secMap[sym.replace('.', '-')]; if (!cik) return [];
    const j = await get(`https://data.sec.gov/submissions/CIK${String(cik).padStart(10, '0')}.json`, { headers: { 'User-Agent': SEC_UA } });
    const r = j.filings.recent, out = [];
    for (let k = 0; k < r.form.length && out.length < 5; k++) {
      if (!recent(r.filingDate[k] + 'T23:59:00Z', 96)) break;
      if (!/^(8-K|6-K|S-1|S-3|424B|SC 13D|SC 13G|10-Q|10-K)/.test(r.form[k])) continue;
      out.push({ form: r.form[k], date: r.filingDate[k], items: r.items ? r.items[k] : '', url: `https://www.sec.gov/Archives/edgar/data/${cik}/${r.accessionNumber[k].replace(/-/g, '')}/${r.primaryDocument[k]}` });
    }
    note('SEC EDGAR', true); return out;
  } catch (e) { note('SEC EDGAR', false, e.message); return []; }
}
async function alpacaNews(list) {
  const id = process.env.ALPACA_KEY_ID, sec = process.env.ALPACA_SECRET_KEY;
  if (!id || !sec) { sources['Alpaca 新聞'] = { ok: 0, fail: 0, error: '未設定 ALPACA_KEY_ID／ALPACA_SECRET_KEY 環境變數' }; return {}; }
  try {
    const start = new Date(Date.now() - 48 * 3600e3).toISOString();
    const j = await get(`https://data.alpaca.markets/v1beta1/news?symbols=${list.join(',')}&start=${start}&limit=50&sort=desc`, { headers: { 'APCA-API-KEY-ID': id, 'APCA-API-SECRET-KEY': sec } });
    const by = {};
    (j.news || []).forEach((n) => (n.symbols || []).forEach((s) => { (by[s] = by[s] || []).length < 5 && by[s].push({ title: n.headline, url: n.url, time: n.created_at, source: n.source || 'Alpaca/Benzinga' }); }));
    note('Alpaca 新聞', true); return by;
  } catch (e) { note('Alpaca 新聞', false, e.message); return {}; }
}

/* ---------- 日曆 ---------- */
const NASDAQ_H = { Origin: 'https://www.nasdaq.com', Referer: 'https://www.nasdaq.com/' };
async function nasdaqEarnings() {
  try {
    const j = await get(`https://api.nasdaq.com/api/calendar/earnings?date=${target}`, { headers: NASDAQ_H });
    const rows = (j.data && j.data.rows) || [];
    note('Nasdaq 業績日曆', true);
    return rows.map((r) => ({ sym: r.symbol, name: r.name, when: /pre/i.test(r.time) ? '盤前' : /after/i.test(r.time) ? '盤後' : '未公布', epsForecast: r.epsForecast, marketCap: r.marketCap }))
      .sort((a, b) => (parseFloat(String(b.marketCap).replace(/[$,]/g, '')) || 0) - (parseFloat(String(a.marketCap).replace(/[$,]/g, '')) || 0)).slice(0, 40);
  } catch (e) { note('Nasdaq 業績日曆', false, e.message); return []; }
}
// Nasdaq 欄位叫 gmt，但實際係美東時間（例如耐用品訂單 08:30）
async function nasdaqEconomic() {
  try {
    const j = await get(`https://api.nasdaq.com/api/calendar/economicevents?date=${target}`, { headers: NASDAQ_H });
    note('Nasdaq 經濟日曆', true);
    return ((j.data && j.data.rows) || []).filter((r) => /United States/i.test(r.country || '')).map((r) => ({ timeET: r.gmt, name: r.eventName, consensus: r.consensus, previous: r.previous, actual: r.actual }));
  } catch (e) { note('Nasdaq 經濟日曆', false, e.message); return []; }
}

/* ---------- 盤前升跌榜（發掘候選） ---------- */
async function stockanalysisMovers(kind) {
  try {
    const h = await get(`https://stockanalysis.com/markets/premarket/${kind}/`, { json: false });
    const NAV = new Set(['screener', 'compare', 'earnings-calendar', 'industry', 'sector', 'ipos', 'list', 'etf', 'market-cap']);
    const syms = [...new Set([...h.matchAll(/href="\/stocks\/([a-z0-9.\-]+)\/"/g)].map((m) => m[1]).filter((x) => !NAV.has(x) && /^[a-z]{1,5}(\.[a-z])?$/.test(x)).map((x) => x.toUpperCase()))].slice(0, 25);
    note('StockAnalysis 盤前榜', true); return syms;
  } catch (e) { note('StockAnalysis 盤前榜', false, e.message); return []; }
}

/* ---------- 主程式 ---------- */
const result = { generatedAt: new Date().toISOString(), target, sources, movers: {}, market: {}, symbols: {} };
if (wantMovers) {
  const [g, l] = await Promise.all([stockanalysisMovers('gainers'), stockanalysisMovers('losers')]);
  result.movers = { gainers: g, losers: l };
  symbols = [...new Set(symbols.concat(g.slice(0, 15), l.slice(0, 10)))];
}
const [earnings, econ] = await Promise.all([nasdaqEarnings(), nasdaqEconomic()]);
result.market.earnings = earnings; result.market.economic = econ;
const idx = useYahoo ? await pool(INDEX, 4, yahooMetrics) : [];
idx.forEach((m) => (result.market[m.sym] = { last: m.pmLast ?? null, pdc: m.pdc ?? null, chgPct: m.gapPct ?? null, rvol: m.rvol ?? null, trend: m.trend, error: m.error }));
const alp = await alpacaNews(symbols);
await pool(symbols, 4, async (sym) => {
  const [m, yn, fv, sec] = await Promise.all([yahooMetrics(sym), yahooNews(sym), finviz(sym), secFilings(sym)]);
  const news = [...(alp[sym] || []), ...yn, ...((fv && fv.news) || [])];
  const seen = new Set();
  m.news = news.filter((n) => { const k = n.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
  m.finviz = fv ? Object.assign({}, fv, { news: undefined }) : null;
  m.filings = sec;
  m.earningsToday = earnings.find((e) => e.sym === sym) || null;
  result.symbols[sym] = m;
});
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 1));

// 摘要：RVOL ≥ 2 先算合格
const rows = Object.values(result.symbols).sort((a, b) => Math.abs(b.gapPct || 0) - Math.abs(a.gapPct || 0));
console.log(`目標日 ${target}｜寫入 ${outFile}`);
console.log('來源：' + Object.entries(sources).map(([k, v]) => `${k} ${v.ok ? '✅' + v.ok : ''}${v.fail ? '❌' + v.fail : ''}${!v.ok && v.error ? '（' + v.error + '）' : ''}`).join('｜'));
console.log('代號     價格      跳空%   RVOL  盤前量      ATR%  新聞  公告  合格');
rows.forEach((m) => console.log([m.sym.padEnd(8), String(m.pmLast ?? m.pdc ?? '—').padEnd(9), String(m.gapPct ?? '—').padEnd(7), String(m.rvol ?? '—').padEnd(5), String(m.pmVolume ?? '—').padEnd(11), String(m.atrPct ?? '—').padEnd(5), String((m.news || []).length).padEnd(5), String((m.filings || []).length).padEnd(5), m.rvolPass ? '✅' : m.rvol == null ? '？' : '—'].join(' ')));
