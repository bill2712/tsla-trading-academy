// 用法：node scripts/picks/build.mjs
// 檢查 data/picks/YYYY-MM-DD.json 格式，然後重建 data/picks/index.json（App 用嚟顯示歷史）。
// 有任何錯誤就列出嚟並且 exit 1 —— 排程任務一定要修正晒先好 commit。
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../data/picks');
const errs = [], warns = [];
const err = (f, m) => errs.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);
const req = (v) => typeof v === 'number' && Number.isFinite(v);
const nonEmpty = (v, max = 2000) => isStr(v, max) && v.trim().length > 0;
const isNum = (v) => v === null || (typeof v === 'number' && Number.isFinite(v));
const isStr = (v, max = 4000) => typeof v === 'string' && v.length <= max;
const optStr = (v, max) => v === undefined || v === null || isStr(v, max);
const BEGIN = ['適合新手', '中等', '高風險'];
const GRADE = ['A', 'B', 'C'];
const STATUS = ['premarket', 'test', 'closed'];

function checkNews(f, where, list) {
  if (list === undefined) return;
  if (!Array.isArray(list)) return err(f, `${where} 要係 array`);
  list.forEach((n, i) => {
    if (!isStr(n.title, 300) || !n.title) err(f, `${where}[${i}].title 要係字串`);
    if (n.url != null && !/^https:\/\/\S+$/.test(n.url)) err(f, `${where}[${i}].url 要係 https 連結`);
    ['source', 'time'].forEach((k) => { if (!optStr(n[k], 120)) err(f, `${where}[${i}].${k} 要係字串`); });
  });
}

function checkDay(f, d) {
  const date = f.replace('.json', '');
  if (d.version !== 1 && d.version !== 2) err(f, 'version 要係 1 或 2（新報告用 2）');
  if (d.date !== date) err(f, `date（${d.date}）要同檔名一樣`);
  if (!isStr(d.generatedAt, 40) || isNaN(Date.parse(d.generatedAt))) err(f, 'generatedAt 要係 ISO 時間');
  if (!STATUS.includes(d.status)) err(f, `status 要係 ${STATUS.join('/')}`);
  if (d.dataQuality && !['full', 'partial'].includes(d.dataQuality)) err(f, 'dataQuality 要係 full 或 partial');
  if (d.version === 1 && !Array.isArray(d.dataSources)) err(f, 'dataSources 要係 array');
  const m = d.market;
  if (!m || typeof m !== 'object') err(f, '冇 market');
  else {
    if (!isStr(m.bias, 20) || !m.bias) err(f, 'market.bias 要係短字串（例如 偏好／偏淡／中性／風險高）');
    if (!isStr(m.summary, 1500)) err(f, 'market.summary 要係字串');
    (m.indices || []).forEach((x, i) => { if (!isStr(x.sym, 20) || !isNum(x.last) || !isNum(x.chgPct)) err(f, `market.indices[${i}] 要有 sym、last（數字或 null）、chgPct（數字或 null）`); });
    (m.events || []).forEach((x, i) => { if (!isStr(x.name, 200)) err(f, `market.events[${i}].name`); });
    (m.earnings || []).forEach((x, i) => { if (!isStr(x.sym, 12)) err(f, `market.earnings[${i}].sym`); });
  }
  if (!Array.isArray(d.picks)) err(f, 'picks 要係 array');
  else {
    if (d.status !== 'closed' && d.picks.length > 10) err(f, 'picks 最多 10 隻');
    const seen = new Set();
    d.picks.forEach((p, i) => {
      const w = `picks[${i}]`;
      if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(p.sym || '')) err(f, `${w}.sym 要係大階股票代號`);
      if (seen.has(p.sym)) err(f, `${w}.sym 重複 ${p.sym}`); seen.add(p.sym);
      ['price', 'prevClose', 'gapPct', 'pmVolume', 'pmVolPct', 'avgVolume', 'rvol', 'spread', 'atr', 'mktCapB', 'floatM', 'score'].forEach((k) => { if (p[k] !== undefined && !isNum(p[k])) err(f, `${w}.${k} 要係數字或 null`); });
      if (p.price == null) err(f, `${w}.price 唔可以空（冇價就唔好揀）`);
      if (p.beginner && !BEGIN.includes(p.beginner)) err(f, `${w}.beginner 要係 ${BEGIN.join('/')}`);
      if (p.grade && !GRADE.includes(p.grade)) err(f, `${w}.grade 要係 A/B/C`);
      ['name', 'catalyst', 'technical', 'setup', 'why', 'direction'].forEach((k) => { if (!optStr(p[k], 1500)) err(f, `${w}.${k} 要係字串`); });
      if (!p.why) err(f, `${w}.why（點解適合今日 day trade）唔可以空`);
      if (p.levels) Object.entries(p.levels).forEach(([k, v]) => { if (k === 'other') { (v || []).forEach((o, j) => { if (!isStr(o.label, 30) || !isNum(o.price)) err(f, `${w}.levels.other[${j}]`); }); } else if (!isNum(v)) err(f, `${w}.levels.${k} 要係數字或 null`); });
      if (p.plan) ['long', 'short', 'noTrade'].forEach((k) => { if (!optStr(p.plan[k], 800)) err(f, `${w}.plan.${k}`); });
      if (p.risks && !(Array.isArray(p.risks) && p.risks.every((r) => isStr(r, 300)))) err(f, `${w}.risks 要係字串 array`);
      checkNews(f, `${w}.news`, p.news);
      if (d.version === 2) checkPickV2(f, w, p);
    });
    if (d.version === 2 && d.status === 'premarket' && d.picks.length < 5 && !nonEmpty(d.fewPicksReason)) err(f, `只有 ${d.picks.length} 隻候選股：目標係 5–7 隻；如果真係唔夠 RVOL ≥ 2 嘅股票，要寫 fewPicksReason 解釋`);
    if (d.version === 2 && d.picks.length > 8) err(f, 'picks 最多 8 隻');
  }
  if (d.version === 2) {
    if (!Array.isArray(d.sources) || !d.sources.length) err(f, 'sources 要列出每個數據來源 [{name, ok, note}]');
    else d.sources.forEach((x, i) => { if (!nonEmpty(x.name, 80) || typeof x.ok !== 'boolean') err(f, `sources[${i}] 要有 name 同 ok（true/false）`); });
    if (Array.isArray(d.sources) && d.sources.filter((x) => x.ok).length < 2) warn(f, '少過 2 個數據來源成功，報告可信度較低');
  }
  ['watch', 'avoid'].forEach((k) => (d[k] || []).forEach((x, i) => { if (!isStr(x.sym, 12) || !isStr(x.why, 500)) err(f, `${k}[${i}] 要有 sym 同 why`); }));
  checkNews(f, 'news', d.news);
  if (!optStr(d.lesson, 1500) || !optStr(d.focus, 1500) || !optStr(d.disclaimer, 600)) err(f, 'lesson／focus／disclaimer 要係字串');
  if (d.review) {
    if (!Array.isArray(d.review.items)) err(f, 'review.items 要係 array');
    else d.review.items.forEach((x, i) => {
      if (!isStr(x.sym, 12)) err(f, `review.items[${i}].sym`);
      ['open', 'high', 'low', 'close', 'chgFromOpenPct'].forEach((k) => { if (!isNum(x[k] ?? null)) err(f, `review.items[${i}].${k} 要係數字或 null`); });
      if (x.hitPmh != null && typeof x.hitPmh !== 'boolean') err(f, `review.items[${i}].hitPmh 要係 true/false/null`);
    });
  }
}

// v2：認真用嚟交易，每隻候選股一定要有齊數據同可執行計劃
function checkPickV2(f, w, p) {
  if (!req(p.rvol)) err(f, `${w}.rvol 一定要有（盤前 RVOL at time）；計唔到就唔可以放入 picks，改放 watch`);
  else if (p.rvol < 2) err(f, `${w}.rvol = ${p.rvol}，規則要求 ≥ 2 先可以入候選名單（可以放 watch）`);
  ['price', 'prevClose', 'gapPct', 'pmVolume', 'avgVolume', 'atr', 'spread'].forEach((k) => { if (!req(p[k])) err(f, `${w}.${k} 一定要有數字`); });
  const L = p.levels || {};
  ['pmh', 'pml', 'pdh', 'pdl', 'pdc'].forEach((k) => { if (!req(L[k])) err(f, `${w}.levels.${k} 一定要有數字`); });
  if (!GRADE.includes(p.grade)) err(f, `${w}.grade 一定要有（A/B/C）`);
  if (!BEGIN.includes(p.beginner)) err(f, `${w}.beginner 一定要有`);
  ['why', 'catalyst', 'technical', 'setup'].forEach((k) => { if (!nonEmpty(p[k])) err(f, `${w}.${k} 唔可以空`); });
  const P5 = p.pillars || {};
  ['bigPicture', 'fundamentals', 'technical', 'tape', 'intuition'].forEach((k) => { if (!nonEmpty(P5[k], 800)) err(f, `${w}.pillars.${k}（五大分析）唔可以空`); });
  const t = p.trade;
  if (!t || typeof t !== 'object') err(f, `${w}.trade（Entry／Stop／Target／R:R）一定要有`);
  else {
    if (!['Long', 'Short'].includes(t.side)) err(f, `${w}.trade.side 要係 Long 或 Short`);
    ['entry', 'stop', 'target1', 'rr'].forEach((k) => { if (!req(t[k])) err(f, `${w}.trade.${k} 一定要有數字`); });
    if (!nonEmpty(t.trigger, 400)) err(f, `${w}.trade.trigger（幾時先入場）唔可以空`);
    if (t.target2 != null && !req(t.target2)) err(f, `${w}.trade.target2 要係數字或 null`);
    if (req(t.entry) && req(t.stop) && req(t.target1)) {
      const L2 = t.side === 'Long';
      if (L2 ? !(t.stop < t.entry && t.entry < t.target1) : !(t.stop > t.entry && t.entry > t.target1)) err(f, `${w}.trade：${t.side} 嘅 Stop／Entry／Target 次序唔啱`);
      const rr = Math.abs(t.target1 - t.entry) / Math.abs(t.entry - t.stop);
      if (req(t.rr) && Math.abs(rr - t.rr) > 0.15) err(f, `${w}.trade.rr 寫 ${t.rr}，但按價錢計係 ${rr.toFixed(2)}`);
      if (rr < 1.5) warn(f, `${w}.trade R:R 只有 ${rr.toFixed(2)}`);
      if (req(p.atr) && Math.abs(t.entry - t.stop) > p.atr) warn(f, `${w}.trade Stop 闊過一個 ATR，檢查下`);
    }
  }
  if (!(p.news || []).length && !nonEmpty(p.newsNote, 300)) err(f, `${w} 冇新聞：要搵到最少 1 條有連結嘅新聞，或者用 newsNote 講明搜尋過但冇新聞`);
}

const files = fs.readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
const days = [];
for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { err(f, 'JSON 格式錯：' + e.message); continue; }
  const before = errs.length;
  checkDay(f, d);
  if (errs.length > before) continue;
  const m = d.market || {};
  days.push({
    date: d.date, status: d.status, bias: m.bias, headline: (d.headline || m.summary || '').slice(0, 90), n: d.picks.length,
    top: d.picks.slice(0, 7).map((p) => ({ sym: p.sym, gapPct: p.gapPct ?? null, rvol: p.rvol ?? null, beginner: p.beginner || null, grade: p.grade || null })),
    reviewed: !!(d.review && (d.review.items || []).length),
  });
}
if (warns.length) console.warn('⚠️ 提醒：\n' + warns.map((e) => ' - ' + e).join('\n'));
if (errs.length) { console.error('❌ 格式錯誤：\n' + errs.map((e) => ' - ' + e).join('\n')); process.exit(1); }
fs.writeFileSync(path.join(DIR, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), days }, null, 1) + '\n');
console.log(`✅ ${days.length} 日選股通過檢查，已更新 index.json`);
