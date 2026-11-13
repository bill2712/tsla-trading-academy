#!/usr/bin/env node
/* 大市寬度（S&P 500 有幾多 % 股票喺 200 日線上面）同日內做多嘅關係（教學用）
 * 寬度數據：tradermonty.github.io/market-breadth-analysis（market-breadth-analyzer skill 用嘅公開 CSV）
 * 日內結果：50 隻大型股，「09:35 收市買、11:30 收市賣」（頭 2 小時做多嘅基準），單位 ATR；用「前一日」嘅寬度分組（開市前已知）
 * 用法：node scripts/research/breadth-check.mjs --cache DIR --breadth market_breadth_data.csv [--out data/research/breadth-check.json]
 */
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const CACHE = arg('cache'), CSV = arg('breadth'), OUT = arg('out', 'data/research/breadth-check.json');
const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n'); const hd = rows[0].split(',');
const ix = (n) => hd.indexOf(n);
const BR = new Map(); const dates = [];
rows.slice(1).forEach((l) => { const c = l.split(','); BR.set(c[0], { raw: +c[ix('Breadth_Index_Raw')], ma8: +c[ix('Breadth_Index_8MA')], ma200: +c[ix('Breadth_Index_200MA')], trend: +c[ix('Breadth_200MA_Trend')], bear: c[ix('Bearish_Signal')] === 'True' }); dates.push(c[0]); });
const prevOf = (d) => { let lo = 0, hi = dates.length - 1, ans = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (dates[m] < d) { ans = dates[m]; lo = m + 1; } else hi = m - 1; } return ans; };
const G = {}; const add = (k, v) => (G[k] = G[k] || []).push(v);
for (const f of fs.readdirSync(CACHE)) {
  if (!f.endsWith('.json') || f === 'QQQ.json') continue;
  const by = new Map();
  JSON.parse(fs.readFileSync(`${CACHE}/${f}`, 'utf8')).forEach(([d, hm, o, h, l, c]) => { if (!by.has(d)) by.set(d, []); by.get(d).push({ hm, o, h, l, c }); });
  const days = [...by.keys()].sort().map((d) => ({ d, B: by.get(d) })).filter((x) => x.B.length >= 70 && x.B[0].hm === '09:30');
  days.forEach((x, i) => { x.h = Math.max(...x.B.map((b) => b.h)); x.l = Math.min(...x.B.map((b) => b.l)); x.c = x.B[x.B.length - 1].c; if (i >= 15) { let s = 0; for (let j = i - 14; j < i; j++) s += Math.max(days[j].h - days[j].l, Math.abs(days[j].h - days[j - 1].c), Math.abs(days[j].l - days[j - 1].c)); x.atr = s / 14; } });
  days.forEach((x) => {
    if (!x.atr) return; const p = prevOf(x.d); const b = p && BR.get(p); if (!b) return;
    const r = (x.B[23].c - x.B[0].c) / x.atr; // 09:35 收市 → 11:30 收市
    add('all', r);
    add(b.ma8 < 0.4 ? 'ma8_lt40' : b.ma8 < 0.6 ? 'ma8_40_60' : 'ma8_ge60', r);
    add(b.trend > 0 ? 'trend_up' : b.trend < 0 ? 'trend_down' : 'trend_flat', r);
    add(b.ma8 > b.ma200 ? 'ma8_above_200' : 'ma8_below_200', r);
    if (b.bear) add('bearish_signal', r);
  });
}
const r2 = (v) => Math.round(v * 1000) / 1000, p1 = (v) => Math.round(v * 1000) / 10;
const out = { generatedAt: new Date().toISOString(), note: '09:35→11:30 做多基準（ATR）；用前一日大市寬度分組。寬度 = S&P 500 成分股喺 200 日線上面嘅比例（8MA = 8 日平均）', groups: {} };
Object.entries(G).forEach(([k, A]) => { out.groups[k] = { n: A.length, up: p1(A.filter((v) => v > 0).length / A.length), avgAtr: r2(A.reduce((s, v) => s + v, 0) / A.length) }; });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
Object.entries(out.groups).forEach(([k, v]) => console.log(k.padEnd(16), JSON.stringify(v)));
