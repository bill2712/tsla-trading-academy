// 用法：node scripts/picks/build.mjs
// 檢查 data/picks/YYYY-MM-DD.json 格式，然後重建 data/picks/index.json（App 用嚟顯示歷史）。
// 有任何錯誤就列出嚟並且 exit 1 —— 排程任務一定要修正晒先好 commit。
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../data/picks');
const errs = [];
const err = (f, m) => errs.push(`${f}: ${m}`);
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
  if (d.version !== 1) err(f, 'version 要係 1');
  if (d.date !== date) err(f, `date（${d.date}）要同檔名一樣`);
  if (!isStr(d.generatedAt, 40) || isNaN(Date.parse(d.generatedAt))) err(f, 'generatedAt 要係 ISO 時間');
  if (!STATUS.includes(d.status)) err(f, `status 要係 ${STATUS.join('/')}`);
  if (d.dataQuality && !['full', 'partial'].includes(d.dataQuality)) err(f, 'dataQuality 要係 full 或 partial');
  if (!Array.isArray(d.dataSources)) err(f, 'dataSources 要係 array');
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
    });
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
    top: d.picks.slice(0, 5).map((p) => ({ sym: p.sym, gapPct: p.gapPct ?? null, beginner: p.beginner || null })),
    reviewed: !!(d.review && (d.review.items || []).length),
  });
}
if (errs.length) { console.error('❌ 格式錯誤：\n' + errs.map((e) => ' - ' + e).join('\n')); process.exit(1); }
fs.writeFileSync(path.join(DIR, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), days }, null, 1) + '\n');
console.log(`✅ ${days.length} 日選股通過檢查，已更新 index.json`);
