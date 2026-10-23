/* Level 1–2 基礎重溫（平台新增內容） */
window.COURSE = window.COURSE || [];

/* 呢個 Level 用到嘅示意圖 */
(function () {
  const C = window.Charts;
  C.named['patterns'] = () => ({
    title: '常見單支／兩支 K 線形態',
    showVolume: false, height: 260, slots: 13, labelEvery: 1,
    bars: [
      { t: 'Hammer', o: 100.6, h: 101.0, l: 98.2, c: 100.9 },
      { t: '', o: 0, h: 0, l: 0, c: 0, color: 'transparent' },
      { t: 'Shoot. Star', o: 100.5, h: 103.2, l: 100.2, c: 100.3 },
      { t: '', o: 0, h: 0, l: 0, c: 0, color: 'transparent' },
      { t: 'Doji', o: 100.5, h: 101.8, l: 99.2, c: 100.52 },
      { t: '', o: 0, h: 0, l: 0, c: 0, color: 'transparent' },
      { t: 'Bull Engulf', o: 101.2, h: 101.4, l: 100.2, c: 100.4 },
      { t: '', o: 100.2, h: 101.9, l: 100.0, c: 101.8 },
      { t: '', o: 0, h: 0, l: 0, c: 0, color: 'transparent' },
      { t: 'Bear Engulf', o: 100.3, h: 101.4, l: 100.1, c: 101.2 },
      { t: '', o: 101.4, h: 101.6, l: 99.7, c: 99.9 },
      { t: '', o: 0, h: 0, l: 0, c: 0, color: 'transparent' },
      { t: 'Marubozu', o: 99.0, h: 102.4, l: 98.98, c: 102.38 },
    ].map((b) => (b.color === 'transparent' ? Object.assign(b, { o: 100, h: 100, l: 100, c: 100 }) : b)),
    yMin: 97.5, yMax: 103.6,
    caption: '形態本身唔係買賣訊號 —— 位置（例如喺支持定阻力）同背景先係重點。',
  });
  C.named['structure-up'] = () => {
    const closes = [100, 101.2, 102.4, 101.5, 100.9, 102.2, 103.6, 104.4, 103.4, 102.8, 104.1, 105.6, 106.3, 105.4, 104.9, 106.2, 107.4];
    return {
      bars: C.genBars(closes, { seed: 81, open: 99.6, wick: 0.4 }), showVolume: false, height: 260,
      marks: [{ i: 2, text: 'H' }, { i: 4, text: 'L', pos: 'below' }, { i: 7, text: 'HH' }, { i: 9, text: 'HL', pos: 'below' }, { i: 12, text: 'HH' }, { i: 14, text: 'HL', pos: 'below' }],
      title: 'Uptrend：Higher High + Higher Low', caption: '每個高位高過上一個高位（HH），每個低位高過上一個低位（HL）。',
    };
  };
  C.named['structure-down'] = () => {
    const closes = [107, 105.8, 104.6, 105.5, 106.1, 104.8, 103.4, 102.6, 103.6, 104.2, 102.9, 101.4, 100.7, 101.6, 102.1, 100.8, 99.6];
    return {
      bars: C.genBars(closes, { seed: 83, open: 107.4, wick: 0.4 }), showVolume: false, height: 260,
      marks: [{ i: 2, text: 'L', pos: 'below' }, { i: 4, text: 'H' }, { i: 7, text: 'LL', pos: 'below' }, { i: 9, text: 'LH' }, { i: 12, text: 'LL', pos: 'below' }, { i: 14, text: 'LH' }],
      title: 'Downtrend：Lower High + Lower Low', caption: '高位一個比一個低（LH），低位一個比一個低（LL）。',
    };
  };
  C.named['sr-flip'] = () => {
    const closes = [100.5, 101.6, 102.6, 101.8, 101.0, 101.9, 102.7, 101.9, 101.3, 102.4, 103.6, 104.1, 103.3, 103.0, 103.9, 104.8, 105.4];
    return {
      bars: C.genBars(closes, { seed: 85, open: 100.2, wick: 0.35 }), showVolume: false, height: 260,
      zones: [{ lo: 102.8, hi: 103.1, label: '舊阻力 → 新支持（S/R Flip）' }],
      marks: [{ i: 2, text: '受阻' }, { i: 6, text: '受阻' }, { i: 10, text: '突破' }, { i: 13, text: '回測守住', pos: 'below' }],
      title: 'Support / Resistance Zone 與角色轉換', caption: '用「區域」而唔係一條線；突破之後，舊阻力有機會變新支持。',
    };
  };
  C.named['vwap-demo'] = () => {
    const closes = [384.2, 384.9, 385.6, 385.1, 385.8, 386.4, 386.0, 386.9, 387.4, 386.8, 387.6, 388.2];
    const bars = C.genBars(closes, { seed: 87, open: 383.8, baseVol: 1.2 });
    bars[0].v = 2.4; bars[1].v = 1.8; bars[2].v = 1.6;
    return { bars, vwap: true, height: 240, title: 'Session VWAP 示意', caption: 'VWAP 由開市第一支 K 線開始累積；開市初段成交量大，所以早段 K 線對 VWAP 影響最大。' };
  };
})();

window.COURSE.unshift({
  id: 'l0',
  code: 'Level 1–2',
  title: '基礎重溫：工具與 Price Action',
  subtitle: 'Candlestick、Volume、VWAP、Support / Resistance、Market Structure（平台新增，方便由零開始或者溫習）',
  icon: '🧱',
  color: '#ea580c',
  question: '我睇緊乜嘢指標？市場發生緊乜？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l0-c1', num: '1', title: '美股交易時段與基本術語', mins: 6,
  summary: '盤前、正常時段、盤後；美東時間點樣換算；Long / Short、Ticker、Share 等基本字。',
  keywords: ['RTH', 'Pre-market', 'ET', 'Long', 'Short'],
  md: `
:::info 平台新增章節
Level 1–2 嘅原始內容唔喺 PDF 入面。呢部分係按 Level 3–5 需要用到嘅基礎知識重新整理，方便未讀過 Level 1–2 嘅家人（例如細路）由零開始，或者作快速溫習。
:::

## 1.1 美股一日分三段

| 時段 | 美東時間（ET） | 特點 |
|---|---|---|
| 盤前 Pre-market | 04:00–09:30 | 成交量少、價差闊，價格可以好跳 |
| **正常時段 RTH** | **09:30–16:00** | 成交最多，課程主要研究呢段 |
| 盤後 After-hours | 16:00–20:00 | 好多公司喺呢段公布財報 |

課程講嘅「一日 78 支 5 分鐘 K 線」，就係指 RTH 嘅 390 分鐘 ÷ 5。

## 1.2 時區換算

美國有夏令時間（大約 3 月中至 11 月初），所以同其他地方嘅時差會變。

[[tool:timezone]]

:::tip 建議
TradingView 圖表時區設做 **America/New_York**，所有紀錄都用美東時間，咁就唔會因為時差搞亂。
:::

## 1.3 必識基本詞彙

| 詞彙 | 意思 |
|---|---|
| Ticker | 股票代號，例如 TSLA（Tesla） |
| Share | 股；美股通常可以一股一股買 |
| Long | 買入，預期價格上升先賺錢 |
| Short | 沽空：借股票賣出，預期價格下跌先賺錢（風險理論上無限） |
| Day Trading | 即日買賣，收市前平倉，唔持倉過夜 |
| Timeframe | 每支 K 線代表幾耐，例如 5m = 5 分鐘 |
| Paper Trading | 用模擬錢交易，唔涉及真錢 |
| Broker 券商 | 例如 IBKR，幫你落單嘅公司 |

## 1.4 R 倍數：課程最常用嘅「單位」

課程成日講「+2R」「−1R」。**R = 你一筆交易計劃承擔嘅風險**。

- 如果你計劃最多輸 $25，咁 1R = $25。
- 賺 $50 = +2R；輸 $25 = −1R；輸 $30 = −1.2R。

用 R 嘅好處：唔理你買 10 股定 100 股、本金大定細，都可以公平比較每筆交易。

[[quiz:l0-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l0-c2', num: '2', title: 'Candlestick K 線', mins: 8,
  summary: 'OHLC、實體、影線；Hammer、Shooting Star、Doji、Engulfing、Marubozu。內有互動 K 線砌圖器。',
  keywords: ['OHLC', 'Body', 'Wick', 'Hammer', 'Shooting Star', 'Doji', 'Engulfing'],
  md: `
## 2.1 一支 K 線有四個價格（OHLC）

| 英文 | 中文 | 意思 |
|---|---|---|
| Open | 開市價 | 呢段時間第一筆成交 |
| High | 最高價 | 呢段時間最高成交 |
| Low | 最低價 | 呢段時間最低成交 |
| Close | 收市價 | 呢段時間最後一筆成交 |

- **實體（Body）**：Open 同 Close 之間。Close 高過 Open = 綠燭（升）；Close 低過 Open = 紅燭（跌）。
- **影線（Wick / Shadow）**：實體以外，伸去 High 同 Low 嘅幼線。長影線代表價格曾經去到嗰度，但**守唔住**。

## 2.2 自己砌一支 K 線

拉吓下面嘅滑桿，睇吓 K 線點變，同埋系統認唔認到係咩形態。

[[tool:candle-builder]]

## 2.3 常見形態

[[chart:patterns]]

| 形態 | 樣子 | 可能代表 |
|---|---|---|
| **Hammer** | 細實體喺上面，長下影線 | 價格曾經大跌但被買返上嚟（喺支持位先有意義） |
| **Shooting Star** | 細實體喺下面，長上影線 | 價格曾經大升但被賣返落嚟（喺阻力位先有意義） |
| **Doji** | 開市≈收市，實體極細 | 買賣雙方打和，猶豫 |
| **Bullish Engulfing** | 綠燭實體完全包住上一支紅燭 | 買方力量突然轉強 |
| **Bearish Engulfing** | 紅燭實體完全包住上一支綠燭 | 賣方力量突然轉強 |
| **Marubozu** | 大實體、幾乎冇影線 | 一面倒，動力強 |

:::key 最重要嘅一句
**位置比形態重要。** 一支 Hammer 喺區間中間，幾乎冇意義；喺事前畫好嘅支持區出現，先值得留意。仲要等後續 K 線確認（Level 3 會詳細教）。
:::

:::coach 教練補充：影線係「腳印」
想像價格係一個人去試探：長上影線 = 佢行上去試過，但俾人推返落嚟；長下影線 = 佢跌落去試過，但有人接住。腳印話你知「邊度有人守住」。
:::

[[quiz:l0-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l0-c3', num: '3', title: 'Volume 成交量與 RVOL', mins: 6,
  summary: '成交量係「有幾多人參與」；同時段比較先公平；RVOL 點計。',
  keywords: ['Volume', 'RVOL', 'Relative Volume at Time'],
  md: `
## 3.1 Volume 係乜？

Volume = 一段時間入面成交咗幾多股。佢話你知**有幾多人參與呢個價格變動**。

- 突破阻力時 Volume 大 → 較多人參與，可能較有說服力。
- 突破時 Volume 細 → 可能只係少數人推高，較容易失敗（但唔係一定）。

## 3.2 點解要「同時段」比較？

美股開市頭 30 分鐘同收市前，成交量通常特別大；中午最少。所以 10:00 嘅 1.2M 股同 13:00 嘅 1.2M 股意義完全唔同。

**RVOL at Time（同時段相對成交量）**：

$$ RVOL = 今日呢個時段嘅 Volume ÷ 過去 N 日同一時段平均 Volume $$

- RVOL = 1.0 → 同平時差唔多
- RVOL = 1.5 → 比平時多 50%
- RVOL = 0.6 → 比平時少

[[tool:rvol]]

## 3.3 Volume 嘅常見誤解

| 誤解 | 事實 |
|---|---|
| Volume 大 = 一定升 | Volume 大只代表參與多，買賣都可以 |
| Volume 大 = 唔會有滑價 | Volume 係**已經發生**嘅成交，唔代表你落單嗰刻有足夠掛單（Level 4 第二章） |
| 綠燭 Volume = 買家數量 | 每一宗成交都有一個買家同一個賣家 |

[[quiz:l0-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l0-c4', num: '4', title: 'VWAP 成交量加權平均價', mins: 7,
  summary: '當日「平均成本線」；逐支累積、每日重置；常見用法同陷阱。',
  keywords: ['VWAP', 'Session VWAP', 'Typical Price'],
  md: `
## 4.1 VWAP 係乜？

**VWAP（Volume Weighted Average Price）** = 由開市到而家，所有成交嘅「成交量加權平均價」。可以理解為**當日市場參與者嘅平均成本**。

$$ Typical Price = (High + Low + Close) ÷ 3 $$
$$ VWAP = Σ(Typical Price × Volume) ÷ Σ Volume （由開市累積到而家） $$

[[chart:vwap-demo]]

## 4.2 點樣用 VWAP？

| 情況 | 一般解讀 |
|---|---|
| 價格企喺 VWAP 上面，VWAP 向上 | 日內偏強 |
| 價格喺 VWAP 下面，VWAP 向下 | 日內偏弱 |
| 價格反覆穿越 VWAP | 冇方向、混亂（Choppy） |
| 價格由下面升近 VWAP | VWAP 可能成為**障礙**（Level 3 第四章例子） |

## 4.3 自己計一次 VWAP

[[tool:vwap]]

:::warn 兩個常見錯誤
1. **用咗未來資料**：10:05 嘅 VWAP 只可以用 09:30–10:05 嘅 K 線計，唔可以用全日最終 VWAP。
2. **冇每日重置**：Session VWAP 每個交易日由零開始累積。
:::

[[quiz:l0-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l0-c5', num: '5', title: 'Support / Resistance 支持與阻力', mins: 7,
  summary: '用區域唔用線；邊度畫；S/R Flip；PDH / PDL / PMH / PML。',
  keywords: ['Support', 'Resistance', 'Zone', 'S/R Flip', 'PDH', 'PDL'],
  md: `
## 5.1 乜嘢係支持同阻力？

- **Support 支持**：價格跌到呢度，過去多次有人買入，令價格停低或反彈。
- **Resistance 阻力**：價格升到呢度，過去多次有人賣出，令價格停低或回落。

## 5.2 畫「區域」，唔好畫「一條線」

市場唔會精準到一仙。$385.00 嘅阻力，實際可能係 $384.80–$385.20 呢個範圍。所以課程全部用 **Zone**（例如 Resistance Zone $384.80–$385.20）。

[[chart:sr-flip]]

## 5.3 邊啲位置值得畫？

| 水平 | 點解重要 |
|---|---|
| PDH / PDL（前日高／低） | 好多人睇，容易有反應 |
| PMH / PML（盤前高／低） | 開市前已經知道嘅重要位 |
| 明顯 15m Swing High / Low | 最近真實出現過轉向嘅位置 |
| 整數位（例如 $380、$400） | 心理關口 |

:::key 黃金規則
**開市前畫好，唔好事後補畫。** 事後先畫，等於睇咗答案先做題目（Look-ahead Bias）。
:::

## 5.4 S/R Flip 角色轉換

阻力被有效突破之後，價格回落到舊阻力，如果守得住，舊阻力就可能變成新支持 —— 呢個就係 Level 3 **Breakout + Retest** 嘅核心概念。反過來，支持跌穿後亦可能變阻力。

[[quiz:l0-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l0-c6', num: '6', title: 'Market Structure 市場結構', mins: 7,
  summary: 'HH / HL / LH / LL、Swing 要確認先用得、多時間框架由大到細。',
  keywords: ['HH', 'HL', 'LH', 'LL', 'Swing', 'Multi-timeframe'],
  md: `
## 6.1 四個字母組合

| 縮寫 | 全寫 | 意思 |
|---|---|---|
| HH | Higher High | 新高位高過上一個高位 |
| HL | Higher Low | 新低位高過上一個低位 |
| LH | Lower High | 新高位低過上一個高位 |
| LL | Lower Low | 新低位低過上一個低位 |

[[chart:structure-up]]

[[chart:structure-down]]

- **HH + HL** = Uptrend 升勢
- **LH + LL** = Downtrend 跌勢
- 高低位冇規律、互相重疊 = Range 或 Chop

## 6.2 Swing 要「確認」先可以用

一個 Swing High 要等之後有幾支 K 線冇再創新高，先可以確認佢係高位。例如「左右各 5 支 K 線」嘅 Pivot，要等右邊 5 支完成先知道 —— 喺 15m 圖即係 **75 分鐘之後**。回測時一定要記住呢個延遲（Level 4 第十二章）。

## 6.3 多時間框架：由大到細

:::steps
1. **15m 圖**：判斷大方向（HH + HL？LH + LL？橫行？）
2. **畫 Key Levels**：PDH、PDL、PMH、PML、明顯 Swing
3. **5m 圖**：喺大方向同重要位置附近，等 Setup
:::

## 6.4 Level 2 綜合判斷清單

見到一個訊號，用以下五個問題檢查：

[[check:l0-combo]]

答「係」越多，情境越完整。但記住：呢個只係**分析**，Level 3 先教你點將分析變成有規則嘅交易計劃。

[[quiz:l0-c6]]
`},
  ],
});
