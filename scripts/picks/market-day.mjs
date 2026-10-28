// 用法：node scripts/picks/market-day.mjs [YYYY-MM-DD]
// 輸出今日（美東時間）係咪美股交易日、係咪半日市、距離開市幾多分鐘。
const HOLIDAYS = {
  // NYSE 全日休市
  '2026-01-01': '元旦', '2026-01-19': '馬丁路德金紀念日', '2026-02-16': '總統日', '2026-04-03': '耶穌受難日',
  '2026-05-25': '陣亡將士紀念日', '2026-06-19': '六月節', '2026-07-03': '獨立日（補假）', '2026-09-07': '勞動節',
  '2026-11-26': '感恩節', '2026-12-25': '聖誕節',
  '2027-01-01': '元旦', '2027-01-18': '馬丁路德金紀念日', '2027-02-15': '總統日', '2027-03-26': '耶穌受難日',
  '2027-05-31': '陣亡將士紀念日', '2027-06-18': '六月節（補假）', '2027-07-05': '獨立日（補假）', '2027-09-06': '勞動節',
  '2027-11-25': '感恩節', '2027-12-24': '聖誕節（補假）',
};
const HALF = { '2026-11-27': '感恩節翌日（13:00 收市）', '2026-12-24': '平安夜（13:00 收市）', '2027-11-26': '感恩節翌日（13:00 收市）' };
const now = new Date();
const et = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map((p) => [p.type, p.value]));
const p = et(now);
const date = process.argv[2] || `${p.year}-${p.month}-${p.day}`;
const wd = new Date(date + 'T12:00:00Z').getUTCDay();
const weekend = wd === 0 || wd === 6;
const holiday = HOLIDAYS[date] || null;
const known = Number(date.slice(0, 4)) <= 2027;
const minsToOpen = process.argv[2] ? null : (9 * 60 + 30) - (Number(p.hour) * 60 + Number(p.minute));
const isTD = (ds) => { const w = new Date(ds + 'T12:00:00Z').getUTCDay(); return w !== 0 && w !== 6 && !HOLIDAYS[ds]; };
const nextTD = (ds) => { let t = new Date(ds + 'T12:00:00Z'); do { t = new Date(t.getTime() + 86400000); } while (!isTD(t.toISOString().slice(0, 10))); return t.toISOString().slice(0, 10); };
// 開市前（美東 09:30 前）準備今日；已經開市或者收咗市，就準備下一個交易日
const targetDate = process.argv[2] ? date : (isTD(date) && minsToOpen > 0 ? date : nextTD(date));
const inPremarketWindow = !process.argv[2] && targetDate === date && minsToOpen > 0 && minsToOpen <= 330;
console.log(JSON.stringify({
  date, nowET: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`, weekday: ['日', '一', '二', '三', '四', '五', '六'][wd],
  isTradingDay: !weekend && !holiday, halfDay: HALF[date] || null, reason: weekend ? '週末' : holiday, minsToOpen,
  targetDate, targetHalfDay: HALF[targetDate] || null, inPremarketWindow,
  status: inPremarketWindow ? 'premarket' : 'test',
  note: known ? undefined : '假期表只去到 2027 年，請用網上搜尋確認 NYSE 假期',
}, null, 2));
