// 用法：node scripts/picks/calc.mjs [--date YYYY-MM-DD] [--now ISO] <daily.json> [intraday.json]
//   --date        ＝ 目標交易日（預設今日美東日期）；「昨日」= 呢日之前最後一支日線
//   daily.json    ＝ IBKR get_price_history 原始回應（step ONE_DAY，outside_rth false，step_count 60）
//   intraday.json ＝ IBKR get_price_history 原始回應（outside_rth true）。
//                   要計 RVOL：用 step ONE_HOUR、period TWO_WEEKS（包到之前 10 日盤前）。
//                   只要盤前高低位：用 step FIFTEEN_MINS、step_count 24。
//   亦接受 Yahoo chart API 原始回應（會自動轉格式）。
// 輸出：昨收、昨日高低、ATR14、20/50 日線、平均成交、趨勢、盤前高低位、盤前成交、跳空 %、RVOL at time。
import fs from 'node:fs';
import { etDate, dailyMetrics, premarketMetrics, fromYahoo, r2 } from './lib.mjs';

const read = (f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.chart ? fromYahoo(j) : j; };
const args = process.argv.slice(2);
const di = args.indexOf('--date');
const target = di >= 0 ? args.splice(di, 2)[1] : etDate(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) { console.error('--date 要係 YYYY-MM-DD'); process.exit(1); }
const ni = args.indexOf('--now');
const now = ni >= 0 ? Date.parse(args.splice(ni, 2)[1]) : Date.now();
const [dailyFile, intraFile] = args;
if (!dailyFile) { console.error('用法：node scripts/picks/calc.mjs [--date YYYY-MM-DD] <daily.json> [intraday.json]'); process.exit(1); }

const out = Object.assign({ target }, dailyMetrics(read(dailyFile), target));
if (intraFile) Object.assign(out, premarketMetrics(read(intraFile), target, out.pdc, now));
if (out.avgVol20 && out.pmVolume != null) out.pmVolPct = r2(out.pmVolume / out.avgVol20 * 100);
out.rvolPass = out.rvol == null ? null : out.rvol >= 2;
console.log(JSON.stringify(out, null, 2));
