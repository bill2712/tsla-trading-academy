// 選股收集器用嘅數據來源。每個來源失敗都只會記低（note），唔會令成個程式停。
// 原則：只用公開頁面、RSS 或者有 API key 嘅官方 API；遇到限流（429）或者封鎖（403）就停，唔會繞過。
import fs from 'node:fs';
import { fromAlpaca, fromYahoo, parseNum, r2 } from './lib.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url), 'utf8')); } catch (e) {}
const SEC_CONTACT = process.env.SEC_CONTACT || process.env.SEC_USER_AGENT || cfg.secContact || '';
const SEC_UA = `tsla-trading-academy research ${SEC_CONTACT}`;
const ALPACA_ID = process.env.ALPACA_KEY_ID || process.env.APCA_API_KEY_ID || '';
const ALPACA_SECRET = process.env.ALPACA_SECRET_KEY || process.env.APCA_API_SECRET_KEY || '';
export const hasAlpaca = !!(ALPACA_ID && ALPACA_SECRET);

export const sources = {};
export const note = (name, ok, extra) => { const s = (sources[name] = sources[name] || { ok: 0, fail: 0 }); ok ? s.ok++ : s.fail++; if (!ok && extra && !s.error) s.error = String(extra).slice(0, 200); };
export const skip = (name, why) => { sources[name] = { ok: 0, fail: 0, error: why }; };

export async function get(url, { json = true, headers = {}, timeout = 20000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: Object.assign({ 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html,application/xml;q=0.9,*/*;q=0.8' }, headers), signal: ctl.signal });
    if (!r.ok) { let body = ''; try { body = (await r.text()).slice(0, 160); } catch (e) {} const err = new Error('HTTP ' + r.status + (body ? ' ' + body : '')); err.status = r.status; throw err; }
    return json ? await r.json() : await r.text();
  } finally { clearTimeout(t); }
}
export async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
export const strip = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, c) => String.fromCharCode(+c)).replace(/\s+/g, ' ').trim();
export const recent = (iso, hours, now = Date.now()) => { const t = Date.parse(iso); return isFinite(t) && now - t <= hours * 3600e3 && t <= now + 3600e3; };
const iso = (s) => { const t = Date.parse(s); return isFinite(t) ? new Date(t).toISOString() : null; };

/* ================= 價格數據 ================= */

/* ---------- Alpaca（主要來源；要 ALPACA_KEY_ID／ALPACA_SECRET_KEY） ----------
   免費 Basic 方案：SIP（全市場）歷史數據要早過而家 15 分鐘；IEX 即時但只係一間交易所（約 2–3% 成交）。
   所以成交量／RVOL 用 SIP（截到 16 分鐘前），買賣差價用 IEX 最新報價（只作參考）。 */
const AH = () => ({ 'APCA-API-KEY-ID': ALPACA_ID, 'APCA-API-SECRET-KEY': ALPACA_SECRET });
const ABASE = 'https://data.alpaca.markets';
async function alpacaBarsFeed(symbols, timeframe, startISO, endISO, feed) {
  const out = {}; let token = null, pages = 0;
  do {
    const q = new URLSearchParams({ symbols: symbols.join(','), timeframe, start: startISO, end: endISO, limit: '10000', adjustment: 'split', feed, sort: 'asc' });
    if (token) q.set('page_token', token);
    const j = await get(`${ABASE}/v2/stocks/bars?${q}`, { headers: AH(), timeout: 30000 });
    Object.entries(j.bars || {}).forEach(([s, list]) => { (out[s] = out[s] || []).push(...list); });
    token = j.next_page_token; pages++;
  } while (token && pages < 60);
  return out;
}
/* 每次最多 30 隻一齊問；SIP 唔得（例如方案唔包）就轉 IEX，並記低 */
export async function alpacaBars(symbols, timeframe, startISO, now = Date.now()) {
  if (!hasAlpaca) return { bars: {}, feed: null };
  const name = `Alpaca ${timeframe} K 線`;
  const endSip = new Date(now - 16 * 60e3).toISOString();
  const res = {}; let feed = 'sip';
  for (let i = 0; i < symbols.length; i += 30) {
    const chunk = symbols.slice(i, i + 30);
    try { Object.assign(res, await alpacaBarsFeed(chunk, timeframe, startISO, endSip, feed)); note(name, true); }
    catch (e) {
      if (feed === 'sip' && (e.status === 403 || e.status === 422)) {
        feed = 'iex';
        try { Object.assign(res, await alpacaBarsFeed(chunk, timeframe, startISO, new Date(now).toISOString(), 'iex')); note(name, true); note(name + '（SIP 唔得，改用 IEX）', false, e.message); }
        catch (e2) { note(name, false, e2.message); }
      } else note(name, false, e.message);
    }
  }
  const conv = {}; Object.entries(res).forEach(([s, list]) => (conv[s] = fromAlpaca(list)));
  return { bars: conv, feed };
}
/* IEX 最新報價（買賣差價）同最新成交 */
export async function alpacaSnapshots(symbols) {
  if (!hasAlpaca) return {};
  const out = {};
  for (let i = 0; i < symbols.length; i += 50) {
    try {
      const j = await get(`${ABASE}/v2/stocks/snapshots?symbols=${symbols.slice(i, i + 50).join(',')}&feed=iex`, { headers: AH() });
      Object.entries(j || {}).forEach(([s, x]) => {
        const q = (x && x.latestQuote) || {}, t = (x && x.latestTrade) || {};
        out[s] = { bid: q.bp || null, ask: q.ap || null, bidSize: q.bs || null, askSize: q.as || null, quoteTime: q.t || null, last: t.p || null, lastTime: t.t || null };
      });
      note('Alpaca IEX 報價', true);
    } catch (e) { note('Alpaca IEX 報價', false, e.message); }
  }
  return out;
}
/* Alpaca 市場異動榜（升跌榜、最活躍） */
export async function alpacaMovers() {
  if (!hasAlpaca) { skip('Alpaca 異動榜', '未設定 ALPACA_KEY_ID／ALPACA_SECRET_KEY'); return { gainers: [], losers: [], active: [] }; }
  const out = { gainers: [], losers: [], active: [] };
  try {
    const j = await get(`${ABASE}/v1beta1/screener/stocks/movers?top=50`, { headers: AH() });
    out.gainers = (j.gainers || []).map((x) => ({ sym: x.symbol, chgPct: r2(x.percent_change), price: x.price }));
    out.losers = (j.losers || []).map((x) => ({ sym: x.symbol, chgPct: r2(x.percent_change), price: x.price }));
    out.moversUpdated = j.last_updated || null;
    note('Alpaca 異動榜', true);
  } catch (e) { note('Alpaca 異動榜', false, e.message); }
  try {
    const j = await get(`${ABASE}/v1beta1/screener/stocks/most-actives?by=volume&top=50`, { headers: AH() });
    out.active = (j.most_actives || []).map((x) => ({ sym: x.symbol, volume: x.volume, trades: x.trade_count }));
    note('Alpaca 最活躍', true);
  } catch (e) { note('Alpaca 最活躍', false, e.message); }
  return out;
}

/* ---------- Yahoo（後備；一次一個請求，連續 3 次 429 就停） ---------- */
let yahoo429 = 0, yq = Promise.resolve();
export const yahooBlocked = () => yahoo429 >= 3;
export function yahooChart(sym, range, interval, prepost) {
  const run = yq.then(() => yahooChartNow(sym, range, interval, prepost)).finally(() => new Promise((r) => setTimeout(r, 700)));
  yq = run.catch(() => {});
  return run;
}
async function yahooChartNow(sym, range, interval, prepost) {
  if (yahoo429 >= 3) return null;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=${prepost}`;
  try { const j = await get(url); yahoo429 = 0; note('Yahoo 價格（後備）', true); return fromYahoo(j); }
  catch (e) { if (e.status === 429) yahoo429++; note('Yahoo 價格（後備）', false, e.status === 429 ? (yahoo429 >= 3 ? 'HTTP 429 限流，連續 3 次，已停止再問' : 'HTTP 429 限流') : e.message); return null; }
}

/* ================= 基本資料 ================= */

/* ---------- Finviz：流通股、ATR、平均成交、市值、行業、業績日、新聞 ---------- */
export async function finviz(sym) {
  try {
    const h = await get(`https://finviz.com/quote.ashx?t=${encodeURIComponent(sym.replace('.', '-'))}&p=d`, { json: false });
    const field = (label) => {
      const i = h.indexOf('>' + label + '<'); if (i < 0) return null;
      const m = h.slice(i, i + 700).match(/snapshot-td-content">(?:<[^>]+>)*([^<]+)/);
      return m ? strip(m[1]) : null;
    };
    const cat = [...h.matchAll(/class="quote-header_category"([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => strip((m[1].match(/title="([^"]+)"/) || [])[1] || m[2]));
    const news = [...h.matchAll(/<a[^>]+class="tab-link-news"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].slice(0, 8).map((m) => ({ title: strip(m[2]), url: m[1].startsWith('http') ? m[1] : 'https://finviz.com' + m[1], source: 'Finviz' })).filter((n) => /^https:/.test(n.url));
    const fl = field('Shs Float');
    const ok = fl || news.length || field('Market Cap');
    note('Finviz', !!ok, ok ? '' : '頁面格式改咗，讀唔到欄位');
    if (!ok) return null;
    const num = (k) => parseNum(field(k));
    return {
      floatM: fl ? r2(parseNum(fl) / 1e6) : null, sharesOutM: field('Shs Outstand') ? r2(num('Shs Outstand') / 1e6) : null,
      shortFloat: field('Short Float'), earnings: field('Earnings'), relVolumeRth: num('Rel Volume'), avgVolume: num('Avg Volume'),
      marketCapB: field('Market Cap') ? r2(num('Market Cap') / 1e9) : null, atr14: num('ATR (14)'), volatility: field('Volatility'),
      prevClose: num('Prev Close'), price: num('Price'),
      sector: cat[0] || null, industry: cat[1] || null, country: cat[2] || null, news
    };
  } catch (e) { note('Finviz', false, e.message); return null; }
}

/* ================= 新聞 ================= */
function rssItems(x, source, hours, now) {
  return [...String(x).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const g = (tag) => strip((m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1]);
    let title = g('title'), src = source;
    const s2 = g('source'); if (s2) { src = `${s2}（${source}）`; title = title.replace(new RegExp(`\\s+-\\s+${s2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), ''); }
    return { title, url: g('link') || g('guid'), time: iso(g('pubDate')), source: src };
  }).filter((n) => n.title && /^https:\/\//.test(n.url) && (!hours || recent(n.time, hours, now)));
}
export async function googleNews(sym, name, now) {
  try {
    const q = encodeURIComponent(`${sym} stock${name ? ' OR "' + name.replace(/"/g, '').slice(0, 40) + '"' : ''} when:2d`);
    const x = await get(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { json: false });
    note('Google News', true); return rssItems(x, 'Google News', 48, now).slice(0, 8);
  } catch (e) { note('Google News', false, e.message); return []; }
}
export async function seekingAlpha(sym, now) {
  try {
    const x = await get(`https://seekingalpha.com/api/sa/combined/${encodeURIComponent(sym)}.xml`, { json: false });
    note('Seeking Alpha', true); return rssItems(x, 'Seeking Alpha', 48, now).slice(0, 6);
  } catch (e) { note('Seeking Alpha', false, e.message); return []; }
}
const MARKET_FEEDS = [
  ['MarketWatch', 'https://feeds.content.dowjones.io/public/rss/mw_topstories'],
  ['MarketWatch 市場', 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse'],
  ['Seeking Alpha 快訊', 'https://seekingalpha.com/market_currents.xml'],
  ['Investing.com', 'https://www.investing.com/rss/news_25.rss']
];  // CNBC RSS 對程式回 403（封鎖），唔好再試；CNBC 用網上搜尋睇
export async function marketNews(now) {
  const all = [];
  await pool(MARKET_FEEDS, 3, async ([name, url]) => {
    try { const x = await get(url, { json: false }); all.push(...rssItems(x, name, 24, now).slice(0, 15)); note(name + ' RSS', true); }
    catch (e) { note(name + ' RSS', false, e.message); }
  });
  return all.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
}
export async function alpacaNews(list, now) {
  if (!hasAlpaca) { skip('Alpaca／Benzinga 新聞', '未設定 ALPACA_KEY_ID／ALPACA_SECRET_KEY'); return {}; }
  const by = {};
  try {
    const start = new Date(now - 48 * 3600e3).toISOString();
    for (let i = 0; i < list.length; i += 25) {
      let token = null, pages = 0;
      do {
        const q = new URLSearchParams({ symbols: list.slice(i, i + 25).join(','), start, limit: '50', sort: 'desc' });
        if (token) q.set('page_token', token);
        const j = await get(`${ABASE}/v1beta1/news?${q}`, { headers: AH() });
        (j.news || []).forEach((n) => (n.symbols || []).forEach((s) => { const a = (by[s] = by[s] || []); if (a.length < 6) a.push({ title: n.headline, url: n.url, time: iso(n.created_at), source: `${n.source || 'benzinga'}（Alpaca）`, summary: strip(n.summary).slice(0, 240) }); }));
        token = j.next_page_token; pages++;
      } while (token && pages < 4);
    }
    note('Alpaca／Benzinga 新聞', true);
  } catch (e) { note('Alpaca／Benzinga 新聞', false, e.message); }
  return by;
}
let secMap = null;
export async function secFilings(sym, now) {
  if (!/@/.test(SEC_CONTACT)) { skip('SEC EDGAR', '未設定聯絡電郵（config.json secContact）'); return []; }
  try {
    if (!secMap) { const j = await get('https://www.sec.gov/files/company_tickers.json', { headers: { 'User-Agent': SEC_UA } }); secMap = {}; Object.values(j).forEach((r) => (secMap[r.ticker] = r.cik_str)); }
    const cik = secMap[sym.replace('.', '-')]; if (!cik) return [];
    const j = await get(`https://data.sec.gov/submissions/CIK${String(cik).padStart(10, '0')}.json`, { headers: { 'User-Agent': SEC_UA } });
    const r = j.filings.recent, out = [];
    for (let k = 0; k < r.form.length && out.length < 5; k++) {
      if (!recent(r.filingDate[k] + 'T23:59:00Z', 96, now)) break;
      if (!/^(8-K|6-K|S-1|S-3|424B|SC 13D|SC 13G|10-Q|10-K)/.test(r.form[k])) continue;
      out.push({ form: r.form[k], date: r.filingDate[k], items: r.items ? r.items[k] : '', url: `https://www.sec.gov/Archives/edgar/data/${cik}/${r.accessionNumber[k].replace(/-/g, '')}/${r.primaryDocument[k]}` });
    }
    note('SEC EDGAR', true); return out;
  } catch (e) { note('SEC EDGAR', false, e.message); return []; }
}

/* ================= 名單（發掘候選） ================= */

/* StockAnalysis 盤前升跌榜：代號、盤前 %、盤前價、盤前成交、市值 */
export async function stockanalysisPremarket(kind) {
  try {
    const h = await get(`https://stockanalysis.com/markets/premarket/${kind}/`, { json: false });
    const tb = (h.match(/<tbody[\s\S]*?<\/tbody>/) || [''])[0];
    const rows = [...tb.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => {
      const cells = [...m[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1]));
      const sym = (m[0].match(/href="\/stocks\/([a-z0-9.\-]+)\/"/) || [])[1];
      if (!sym || cells.length < 7) return null;
      return { sym: sym.toUpperCase(), name: cells[2], chgPct: parseNum(cells[3]), price: parseNum(cells[4]), pmVolume: parseNum(cells[5]), marketCapB: cells[6] ? r2(parseNum(cells[6]) / 1e9) : null };
    }).filter(Boolean);
    note('StockAnalysis 盤前榜', rows.length > 0, rows.length ? '' : '讀唔到表格');
    return rows;
  } catch (e) { note('StockAnalysis 盤前榜', false, e.message); return []; }
}

/* TopBreakoutStocks：即將突破（下個突破價）同昨日突破。只用免費公開部分（Top 10 係會員專用，唔讀）。
   呢啲名單用正常時段數據，唔包盤前；用嚟加關鍵價位同標籤。 */
export async function topBreakout() {
  const out = { watch: [], yesterday: [], updated: null };
  const cellsOf = (row) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1]));
  try {
    const h = await get('https://www.topbreakoutstocks.com/stockstowatch/', { json: false });
    out.updated = (strip(h).match(/last updated ([^A-Z]*[AP]M [A-Z]{3}, \w{3} \w{3} \d+ \d{4})/) || [])[1] || null;
    let section = 'gain';
    h.split(/<tr/).forEach((part) => {
      if (/HIGH FREQUENCY|breakout often/i.test(part)) section = 'freq';
      const sym = (part.match(/class="symblink">([A-Z.\-]+)</) || [])[1];
      if (!sym) return;
      const c = cellsOf('<tr' + part);
      if (c.length < 8) return;
      out.watch.push({ sym, list: section === 'freq' ? '常突破' : '突破後升幅高', avgHigh: c[1], avgLow: c[2], avgClose: c[3], count: parseNum(c[4]), range: c[5], breakoutPrice: parseNum(c[6]), belowPct: parseNum(c[7]) });
    });
    note('TopBreakoutStocks 即將突破', out.watch.length > 0, out.watch.length ? '' : '讀唔到表格');
  } catch (e) { note('TopBreakoutStocks 即將突破', false, e.message); }
  try {
    const h = await get('https://www.topbreakoutstocks.com/breakoutgainers/', { json: false });
    h.split(/<tr/).forEach((part) => {
      const sym = (part.match(/class="symblink">([A-Z.\-]+)</) || [])[1];
      if (!sym) return;
      const c = cellsOf('<tr' + part);
      if (c.length >= 5) out.yesterday.push({ sym, range: c[1], breakoutPrice: parseNum(c[2]), price: parseNum(c[3]), gainPct: parseNum(c[4]) });
    });
    note('TopBreakoutStocks 昨日突破', out.yesterday.length > 0, out.yesterday.length ? '' : '讀唔到表格');
  } catch (e) { note('TopBreakoutStocks 昨日突破', false, e.message); }
  return out;
}

/* ================= 日曆 ================= */
const NASDAQ_H = { Origin: 'https://www.nasdaq.com', Referer: 'https://www.nasdaq.com/' };
const addDay = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export async function nasdaqEarnings(date) {
  try {
    const j = await get(`https://api.nasdaq.com/api/calendar/earnings?date=${date}`, { headers: NASDAQ_H });
    const rows = (j.data && j.data.rows) || [];
    note('Nasdaq 業績日曆', true);
    return rows.map((r) => ({ sym: r.symbol, name: r.name, when: /pre/i.test(r.time) ? '盤前' : /after/i.test(r.time) ? '盤後' : '未公布', epsForecast: r.epsForecast, marketCap: r.marketCap, mcap: parseFloat(String(r.marketCap).replace(/[$,]/g, '')) || 0 }))
      .sort((a, b) => b.mcap - a.mcap).slice(0, 60);
  } catch (e) { note('Nasdaq 業績日曆', false, e.message); return []; }
}
/* ForexFactory 每週日曆（有準確日期時間，美東時區）——用嚟定今日有咩數據 */
export async function ffCalendar(date) {
  try {
    const j = await get('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    const rows = (j || []).filter((r) => r.country === 'USD' && String(r.date).slice(0, 10) === date)
      .map((r) => ({ timeET: /T(\d\d:\d\d)/.test(r.date) ? r.date.match(/T(\d\d:\d\d)/)[1] : '', name: r.title, impact: { High: '高', Medium: '中', Low: '低', Holiday: '假期' }[r.impact] || r.impact, consensus: r.forecast || '', previous: r.previous || '' }));
    note('ForexFactory 經濟日曆', true);
    return rows;
  } catch (e) { note('ForexFactory 經濟日曆', false, e.message); return []; }
}
/* Nasdaq 經濟日曆：佢個 date 參數會錯開一日（2026-10 實測：問 10/29 得到 10/28 嘅數據）。
   所以問 date 同 date+1，揀同 ForexFactory 事件名最夾嗰份；冇 FF 就唔用（寧願冇，唔好用錯日）。 */
export async function nasdaqEconomic(date, ff) {
  const fetchDay = async (d) => {
    const j = await get(`https://api.nasdaq.com/api/calendar/economicevents?date=${d}`, { headers: NASDAQ_H });
    return ((j.data && j.data.rows) || []).filter((r) => /United States/i.test(r.country || '')).map((r) => ({ timeET: r.gmt, name: strip(r.eventName), consensus: strip(r.consensus), previous: strip(r.previous), actual: strip(r.actual) }));
  };
  try {
    const [a, b] = await Promise.all([fetchDay(date), fetchDay(addDay(date, 1))]);
    note('Nasdaq 經濟日曆', true);
    if (!ff || !ff.length) return { rows: [], note: '冇 ForexFactory 對照，唔用 Nasdaq（佢日期會錯開）' };
    const words = (rows) => new Set(rows.flatMap((r) => r.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3)));
    const target = words(ff);
    const score = (rows) => [...words(rows)].filter((w) => target.has(w)).length;
    const sa = score(a), sb = score(b);
    if (!sa && !sb) return { rows: [], note: 'Nasdaq 同 ForexFactory 對唔上，唔用' };
    return sb > sa ? { rows: b, note: `用咗 date=${addDay(date, 1)} 嘅結果（Nasdaq 日期錯開一日）` } : { rows: a, note: '' };
  } catch (e) { note('Nasdaq 經濟日曆', false, e.message); return { rows: [], note: e.message }; }
}
