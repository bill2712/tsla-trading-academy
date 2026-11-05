// 為 TradingCalc（Market Profile）準備 K 線：昨日同前日正常時段（09:30–16:00 ET）嘅 30 分鐘 OHLCV
//   NODE_USE_ENV_PROXY=1 node --no-warnings scripts/picks/profile-candles.mjs SYM PREV_DATE PREV2_DATE [30Min|15Min]
// 輸出 JSON：{ sym, session_date, candles, prev_candles }，直接放入 workflow.run_session_structure
// （venue 隨便填 binance，因為有 candles 就唔會連交易所；session_date 用 PREV_DATE）。
import { alpacaBars, hasAlpaca } from './sources.mjs';
import { bars } from './lib.mjs';
const [sym, d1, d0, tf = '30Min'] = process.argv.slice(2);
if (!sym || !/^\d{4}-\d{2}-\d{2}$/.test(d1 || '') || !/^\d{4}-\d{2}-\d{2}$/.test(d0 || '')) { console.error('用法：profile-candles.mjs SYM 昨日 前日 [30Min|15Min]'); process.exit(1); }
if (!hasAlpaca) { console.error('要 Alpaca key'); process.exit(1); }
const r = await alpacaBars([sym], tf, `${d0}T12:00:00Z`, Date.now());
const B = bars(r.bars[sym]);
const pick = (d) => B.filter((b) => b.d === d && b.hm >= '09:30' && b.hm < '16:00').map((b) => ({ timestamp: new Date(b.t).getTime(), open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v }));
console.log(JSON.stringify({ sym, session_date: d1, timeframe: tf === '15Min' ? '15m' : '30m', candles: pick(d1), prev_candles: pick(d0) }));
