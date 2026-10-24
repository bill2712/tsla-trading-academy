/* Level 1：六樣工具（零基礎圖表閱讀） */
window.COURSE = window.COURSE || [];

/* ---------- Level 1–2 用到嘅示意圖 ---------- */
(function () {
  const C = window.Charts;
  C.named['patterns'] = () => ({
    title: '常見單支／兩支 K 線形態',
    showVolume: false, height: 260, slots: 13, labelEvery: 1,
    bars: [
      { t: 'Hammer', o: 100.6, h: 101.0, l: 98.2, c: 100.9 },
      { t: '', color: 'transparent' },
      { t: 'Shoot. Star', o: 100.5, h: 103.2, l: 100.2, c: 100.3 },
      { t: '', color: 'transparent' },
      { t: 'Doji', o: 100.5, h: 101.8, l: 99.2, c: 100.52 },
      { t: '', color: 'transparent' },
      { t: 'Bull Engulf', o: 101.2, h: 101.4, l: 100.2, c: 100.4 },
      { t: '', o: 100.2, h: 101.9, l: 100.0, c: 101.8 },
      { t: '', color: 'transparent' },
      { t: 'Bear Engulf', o: 100.3, h: 101.4, l: 100.1, c: 101.2 },
      { t: '', o: 101.4, h: 101.6, l: 99.7, c: 99.9 },
      { t: '', color: 'transparent' },
      { t: 'Marubozu', o: 99.0, h: 102.4, l: 98.98, c: 102.38 },
    ].map((b) => (b.color === 'transparent' ? Object.assign(b, { o: 100, h: 100, l: 100, c: 100 }) : b)),
    yMin: 97.5, yMax: 103.6,
    caption: '形態本身唔係買賣訊號 —— 位置（例如喺支持定阻力）同背景先係重點。',
  });
  C.named['structure-up'] = () => ({
    bars: C.genBars([100, 101.2, 102.4, 101.5, 100.9, 102.2, 103.6, 104.4, 103.4, 102.8, 104.1, 105.6, 106.3, 105.4, 104.9, 106.2, 107.4], { seed: 81, open: 99.6, wick: 0.4 }), showVolume: false, height: 250,
    marks: [{ i: 2, text: 'H' }, { i: 4, text: 'L', pos: 'below' }, { i: 7, text: 'HH' }, { i: 9, text: 'HL', pos: 'below' }, { i: 12, text: 'HH' }, { i: 14, text: 'HL', pos: 'below' }],
    title: 'Uptrend：Higher High + Higher Low', caption: '新高與回調低位持續抬高。',
  });
  C.named['structure-down'] = () => ({
    bars: C.genBars([107, 105.8, 104.6, 105.5, 106.1, 104.8, 103.4, 102.6, 103.6, 104.2, 102.9, 101.4, 100.7, 101.6, 102.1, 100.8, 99.6], { seed: 83, open: 107.4, wick: 0.4 }), showVolume: false, height: 250,
    marks: [{ i: 2, text: 'L', pos: 'below' }, { i: 4, text: 'H' }, { i: 7, text: 'LL', pos: 'below' }, { i: 9, text: 'LH' }, { i: 12, text: 'LL', pos: 'below' }, { i: 14, text: 'LH' }],
    title: 'Downtrend：Lower High + Lower Low', caption: '反彈高位同下跌低位持續下降。',
  });
  C.named['structure-range'] = () => {
    const c = []; const r = C.mulberry32(91);
    for (let i = 0; i < 24; i++) c.push(382.5 + Math.sin(i / 2.4) * 2.1 + (r() - 0.5) * 0.5);
    return { bars: C.genBars(c, { seed: 91, open: 382.5 }), showVolume: false, height: 230, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance $385', color: 'var(--down)' }, { lo: 379.8, hi: 380.2, label: 'Support $380', color: 'var(--up)' }], title: 'Sideways / Range：橫行', caption: '每次到 $385 跌返落嚟、每次接近 $380 反彈。' };
  };
  C.named['sr-flip'] = () => ({
    bars: C.genBars([100.5, 101.6, 102.6, 101.8, 101.0, 101.9, 102.7, 101.9, 101.3, 102.4, 103.6, 104.1, 103.3, 103.0, 103.9, 104.8, 105.4], { seed: 85, open: 100.2, wick: 0.35 }), showVolume: false, height: 250,
    zones: [{ lo: 102.8, hi: 103.1, label: '舊阻力 → 新支持（S/R Flip）' }],
    marks: [{ i: 2, text: '受阻' }, { i: 6, text: '受阻' }, { i: 10, text: '突破' }, { i: 13, text: '回測守住', pos: 'below' }],
    title: 'Support / Resistance Zone 與角色轉換', caption: '用「區域」而唔係一條線；突破之後，舊阻力有機會變新支持。',
  });
  C.named['vwap-demo'] = () => {
    const bars = C.genBars([384.2, 384.9, 385.6, 385.1, 385.8, 386.4, 386.0, 386.9, 387.4, 386.8, 387.6, 388.2], { seed: 87, open: 383.8, baseVol: 1.2 });
    bars[0].v = 2.4; bars[1].v = 1.8; bars[2].v = 1.6;
    return { bars, vwap: true, height: 230, title: 'Session VWAP 示意', caption: 'VWAP 由開市第一支 K 線開始累積；開市初段成交量大，所以早段 K 線對 VWAP 影響最大。' };
  };
  C.named['pdh-test'] = () => {
    const bars = C.genBars([183.2, 183.9, 184.5, 184.8, 184.2, 184.7, 185.4, 185.9, 185.3, 185.1, 185.8, 186.5], { seed: 95, open: 182.8, wick: 0.35 });
    return { bars, showVolume: false, height: 240, lines: [{ y: 185, label: 'PDH 185', color: 'var(--down)' }], marks: [{ i: 3, text: '試探' }, { i: 6, text: '突破' }, { i: 9, text: '回測', pos: 'below' }], title: '價格接近昨日高位（PDH）', caption: 'NVDA 例子：PDH $185 係觀察位置，唔係自動買賣訊號。' };
  };
  C.named['luxalgo-steps'] = () => {
    const closes = [380, 381.2, 383, 381.8, 380.6, 381.5, 382.3, 380.9, 378.4, 376.2, 373.8, 372.6, 373.4, 372.9, 374.2, 378.5, 382.6, 385.4, 388.2, 387.1];
    const bars = C.genBars(closes, { seed: 97, open: 379.6, wick: 0.6, baseVol: 0.9 });
    [15, 16, 17, 18].forEach((i) => (bars[i].v = 2.2 + i * 0.05));
    return { bars, height: 260, lines: [{ y: 388.55, label: '388.55', color: 'var(--down)' }], zones: [{ lo: 381.8, hi: 382.4, label: '原本上方區域 ~$382' }], marks: [{ i: 16, text: '大成交量突破' }], title: '大成交量突破原本區域', caption: '比起「Indicator 又畫咗條新線」，更值得研究嘅係：突破後如果回落到 $382 附近，阻力會唔會變支持。' };
  };
})();

window.COURSE.unshift({
  id: 'l1',
  code: 'Level 1',
  title: '六樣工具：零基礎圖表閱讀',
  subtitle: 'Candlestick、Volume、前高、前低、Support / Resistance、VWAP —— 由零開始識睇圖，再學點樣配合應用',
  icon: '🧱',
  color: '#ea580c',
  question: '我睇緊乜嘢？圖表上發生緊乜？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l1-c0', num: '0', title: '開始之前：美股時段與 R', mins: 5,
  summary: '（平台補充）盤前、正常時段、盤後；時區換算；Long / Short；課程成日講嘅「R」係乜。',
  keywords: ['RTH', '美東時間', 'Long', 'Short', 'R 倍數'],
  md: `
:::info 平台補充章節
呢章唔係原本課程內容，而係為咗方便由零開始（例如 Ivan）而補充嘅基本知識。
:::

## 0.1 美股一日分三段

| 時段 | 美東時間（ET） | 特點 |
|---|---|---|
| 盤前 Pre-market | 04:00–09:30 | 成交量少、價差闊，價格可以好跳 |
| **正常時段 RTH** | **09:30–16:00** | 成交最多，課程主要研究呢段 |
| 盤後 After-hours | 16:00–20:00 | 好多公司喺呢段公布財報 |

你住溫哥華的話，美股正常交易時段通常係 **6:30 AM–1:00 PM**（兩地同時採用夏令時間期間）。課程講嘅「一日 78 支 5 分鐘 K 線」，就係 RTH 嘅 390 分鐘 ÷ 5。

[[tool:timezone]]

## 0.2 必識基本詞彙

| 詞彙 | 意思 |
|---|---|
| Ticker | 股票代號，例如 TSLA、NVDA、AAPL |
| Long | 買入，預期價格上升先賺錢 |
| Short | 沽空：借股票賣出，預期價格下跌先賺錢（風險理論上無限） |
| Day Trading | 即日買賣，收市前平倉 |
| Timeframe | 每支 K 線代表幾耐，例如 5m = 5 分鐘 |
| Paper Trading | 用模擬錢交易 |

## 0.3 R 倍數：課程最常用嘅「單位」

**R = 你一筆交易計劃承擔嘅風險**。如果計劃最多輸 $25，咁 1R = $25：賺 $50 = +2R；輸 $25 = −1R；輸 $30 = −1.2R。用 R 嘅好處：唔理買幾多股、本金大定細，都可以公平比較每筆交易。

[[quiz:l1-c0]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c1', num: '1', title: '六樣工具總覽', mins: 4,
  summary: '六樣嘢唔係六個獨立指標，而係六種閱讀同一張圖嘅方法。建議學習次序同 5 日計劃。',
  keywords: ['Candlestick', 'Volume', 'PDH', 'PDL', 'S/R', 'VWAP'],
  md: `
呢度將六樣嘢整理成一套 **美股 Day Trading 零基礎圖表閱讀課程**。最重要係：**唔好將六樣嘢當成六個獨立指標死記**。你真正要學嘅係，點樣將佢哋放喺同一張圖，理解價格正在做乜。

## 1.1 六樣嘢各自有咩用途？

| # | 工具 | 用嚟睇乜 | 你要識 |
|---|---|---|---|
| 1 | **Candlestick K 線** | 每一段時間內，價格點樣開、升、跌、收 | Open、High、Low、Close、Body、Wick |
| 2 | **Volume 成交量** | 某段時間有幾多股票成交 | 成交量增加或減少、突破時有冇配合 |
| 3 | **Previous High 前高** | 價格之前到過嘅高位，尤其係昨日高位 | PDH 同突破、受阻、回測 |
| 4 | **Previous Low 前低** | 價格之前到過嘅低位，尤其係昨日低位 | PDL、跌穿、反彈同假跌穿 |
| 5 | **Support / Resistance** | 價格過往邊啲區域容易停頓或轉向 | 畫**區域**，而唔係神奇線 |
| 6 | **VWAP** | 當日價格相對成交量加權平均價嘅位置 | 價格喺上方、下方，以及反覆穿越時代表乜 |

:::key 學習次序
先學 **K 線、前高前低同支持阻力**，再加**成交量**，最後先加 **VWAP**。咁會容易理解好多。
:::

## 1.2 用 5 日完成第一輪學習

每日用同一隻股票（例如 NVDA），唔好日日換。

[[check:l1-5day]]

第一輪目標唔係搵到一個穩賺策略，而係**可以自己解釋圖表上發生緊乜**。完成後再開始學 Breakout + Retest，並用 Replay 或模擬盤驗證。

[[quiz:l1-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c2', num: '2', title: 'Candlestick K 線（第一課）', mins: 7,
  summary: 'OHLC、Body、Wick；陽燭陰燭；點樣讀一支 K 線。內有互動 K 線砌圖器。',
  keywords: ['OHLC', 'Body', 'Wick', '陽燭', '陰燭'],
  md: `
## 2.1 一支 K 線究竟講緊乜？

每支 K 線都代表一段時間嘅價格變化。例如你選擇 5-minute chart，每支 K 線就代表 5 分鐘內嘅價格。

| 英文 | 中文 | 意思 |
|---|---|---|
| Open | 開市／開盤價 | 呢段時間開始時嘅價格 |
| High | 最高價 | 呢段時間曾經到過嘅最高價 |
| Low | 最低價 | 呢段時間曾經到過嘅最低價 |
| Close | 收市／收盤價 | 呢段時間結束時嘅價格 |
| Body | 實體 | Open 同 Close 之間嘅部分 |
| Wick / Shadow | 影線 | 顯示超出實體嘅高位或低位 |

- **陽燭（綠色）**：Close 高過 Open。
- **陰燭（紅色）**：Close 低過 Open。

:::tip 注意
TradingView 可以自訂顏色，所以要以 Open、Close 嘅**實際位置**為準，唔好淨係睇顏色。
:::

## 2.2 點樣解讀一支 K 線？

假設 NVDA 某支 5 分鐘 K 線：Open = $180、High = $183、Low = $179、Close = $182。你應該得出：

1. 價格由 $180 開始。
2. 期間最高升到 $183。
3. 最低跌到 $179。
4. 最後收喺 $182，高過開盤價，所以係陽燭。

但**唔好直接推論「陽燭就一定繼續升」**。你仲要睇佢出現喺邊個位置、成交量，以及後續價格反應。

## 2.3 自己砌一支 K 線

拉吓滑桿，睇吓 K 線點變、同埋系統認唔認到係咩形態：

[[tool:candle-builder]]

## 2.4 練習

:::coach 練習
打開 NVDA 嘅 5-minute chart，隨便揀 **20 支已完成嘅 K 線**，逐支講出 Open、High、Low、Close。未做到呢一步，先唔好背一堆 Hammer、Doji 等形態名。

想再練多啲？去 **🏋️ 訓練場 → K 線形態辨識**。
:::

延伸閱讀：Investopedia「Understanding Basic Candlestick Charts」（有 K 線結構圖解）；YouTube 搜尋 [Candlesticks for Beginners](https://www.youtube.com/results?search_query=candlesticks+for+beginners)。

[[quiz:l1-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c3', num: '3', title: 'Volume 成交量（第二課）', mins: 5,
  summary: '成交量代表成交咗幾多股；三種入門情況；TradingView 點樣開 Volume。',
  keywords: ['Volume', '成交量', '突破'],
  md: `
## 3.1 Volume 係乜？

**Volume 代表指定時間內成交咗幾多股票**（美股通常以股數計算）。例如 5 分鐘內成交 20,000 股，下一個 5 分鐘成交 100,000 股 —— 第二段成交活動明顯較多。

:::warn 重要
**成交量大唔代表價格一定升**，因為每宗成交都有買方同賣方。
:::

## 3.2 入門只要識睇三種情況

| 情況 | 現象 | 可能代表 |
|---|---|---|
| A | 價格升，成交量亦增加 | 上升走勢得到較多成交活動支持，值得繼續觀察 |
| B | 價格跌，成交量亦增加 | 下跌走勢可能正在加強，但仍要結合價位同整體市場判斷 |
| C | 突破前高，但成交量冇明顯增加 | 突破嘅支持力度可能較弱，留意會唔會跌返入原本區間 |

TradingView 嘅成交量教學亦指出，突破時成交量增加可以為價格走勢提供支持，但**成交量只係參考，唔係判定真假突破嘅保證**。

## 3.3 TradingView 點樣開 Volume？

:::steps
1. 打開 TradingView。
2. 輸入股票代號，例如 NVDA。
3. 按上方 **Indicators（指標）**。
4. 搜尋 **Volume**，選擇內置成交量指標。
5. 圖表下方應該會出現一組直柱。
:::

## 3.4 練習

:::coach 練習
揀 **10 個歷史上曾經突破高位嘅例子**，觀察突破前後成交量有冇增加。記低結果，**唔好只挑選成功突破嘅例子**。
:::

延伸閱讀：TradingView 官方 Volume 指南；YouTube 搜尋 [Stock Volume Analysis for Beginners](https://www.youtube.com/results?search_query=stock+volume+analysis+for+beginners)。

[[quiz:l1-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c4', num: '4', title: '前高與前低 PDH / PDL（第三、四課）', mins: 6,
  summary: 'Swing High 同 PDH 嘅分別；接近前高前低時四種可能；點樣畫；真正用途。',
  keywords: ['PDH', 'PDL', 'Swing High', '假跌穿'],
  md: `
## 4.1 先分清楚兩個概念

- **Previous High / Swing High**：過去某一段走勢中形成嘅高位。
- **PDH（Previous Day High）**：上一個交易日嘅最高價。

做日內交易時，PDH 特別容易用嚟建立當日嘅價格參考。

## 4.2 點解前高值得留意？

假設昨日 NVDA 最高升到 $185，今日開市後股價升到 $184.80。$185 就係一個值得觀察嘅位置，因為市場可能：

1. 到 $185 附近**受阻**，回落。
2. **突破** $185，繼續上升。
3. 短暫升穿 $185，但很快跌返落去，形成**假突破**。
4. 突破後回落**測試** $185，再重新上升。

[[chart:pdh-test]]

:::key 重點
**前高係觀察位置，唔係自動買入訊號。**
:::

## 4.3 點樣畫 PDH？

:::steps
1. 先切換去 **1D（日線）**圖。
2. 找到上一個完整交易日嘅 K 線。
3. 由該支 K 線**最高點**拉一條水平線。
4. 標記為 **PDH**。
5. 切返 5-minute chart，觀察當日價格接近該水平線時嘅反應。
:::

## 4.4 前低 PDL：方向相反

前低嘅邏輯同前高相似，但方向相反。**PDL** = 上一個交易日嘅最低價。假設昨日 NVDA 最低跌到 $178，今日股價跌返去 $178 附近，你要觀察：

| 情況 | 可能代表 |
|---|---|
| 守住 $178 | 價格可能反彈 |
| 跌穿 $178 | 可能繼續向下 |
| 跌穿後迅速升返 $178 以上 | 可能係**假跌穿** |
| 跌穿後反彈，但升唔返 $178 | 原本支持區可能變成**阻力區** |

以上都只係可能情境，唔係必然規律。

## 4.5 前高前低嘅真正用途

唔係每日畫十幾條線，而係**開市之前先知道**：

- 上方最近嘅重要參考位係邊度？
- 下方最近嘅重要參考位係邊度？
- 現價距離呢啲位置有幾遠？

咁你先可以有計劃地觀察市場。

:::coach 練習
- 喺 NVDA 圖表畫出最近 **5 個交易日嘅 PDH**，逐日檢查下一個交易日價格有冇接近、穿越或者受阻。
- 再標記 **PDH 同 PDL**，睇價格係突破、反彈，定係喺附近橫行。每一種情況都要記錄，**避免只記住符合自己預期嘅例子**。
:::

延伸閱讀：Stoic Edge「Previous Day High, Low and Close」；YouTube 搜尋 [Previous Day High and Low Explained](https://www.youtube.com/results?search_query=previous+day+high+and+low+explained)。

[[quiz:l1-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c5', num: '5', title: 'Support / Resistance（第五課）', mins: 6,
  summary: '支持阻力最簡單嘅理解；點樣畫（2–4 個區域）；突破後角色互換。',
  keywords: ['Support', 'Resistance', 'Zone', '角色互換'],
  md: `
呢一課非常重要，因為**前高、前低其實都可以成為支持位或阻力位**。

## 5.1 最簡單嘅理解方式

- **Support（支持位）**：價格跌到附近，可能放慢下跌、反彈。
- **Resistance（阻力位）**：價格升到附近，可能放慢上升、回落。

想像價格喺兩個區域之間移動：上面 $105 附近係阻力區，下面 $100 附近係支持區，價格可能反覆升跌。

[[chart:structure-range]]

## 5.2 點樣畫支持位與阻力位？

用 TradingView 開啟一隻股票嘅 5-minute chart：

:::steps
1. 先找價格**曾經多次停頓、反彈或回落**嘅區域。
2. 用 Horizontal Line（水平線）標出參考位置。
3. 如果幾次反應集中喺相近但唔完全相同嘅價位，可以視為**一個區域**，而唔係強求精準到一個價位。
4. **優先保留最明顯嘅 2–4 個區域**，避免整張圖都係線。
:::

## 5.3 點樣理解「突破後角色互換」？

假設某股票多次升到 $105 都回落：$105 原本係阻力區 → 之後價格升穿 $105 → 價格回落到 $105 附近，冇再明顯跌穿 → 如果之後重新上升，交易者可能將 $105 視為**潛在支持區**。

[[chart:sr-flip]]

但**唔係每次突破都會成功**。價格可能只係短暫穿越，之後又跌返落去。CME Group 嘅技術分析課程有一節專門講支持位、阻力位、前高前低，以及突破後角色可能互換。

:::coach 練習
揀 NVDA 最近一日嘅圖，嘗試**只畫 2 個支持區同 2 個阻力區**。畫完再向左拖動圖表，睇自己有冇根據已知走勢過度畫線。

想學 Zone 點樣由 Body 同 Wick 組成？睇 **💡 實戰問答 → 畫 S/R 跟影線定實體**。
:::

延伸閱讀：CME Group「Support and Resistance」（約 8 分鐘，最推薦）；YouTube 搜尋 [Support and Resistance for Beginners](https://www.youtube.com/results?search_query=support+and+resistance+for+beginners)。

[[quiz:l1-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c6', num: '6', title: 'VWAP（最後一課）', mins: 6,
  summary: '成交量加權平均價；三種基本情況；TradingView 點樣加；自己計一次。',
  keywords: ['VWAP', 'Session', '滯後'],
  md: `
## 6.1 VWAP 係乜？

**VWAP** 全名係 **Volume Weighted Average Price**。簡單講，佢係按成交量加權計算出嚟嘅平均價格，日內交易者會用佢觀察當日價格走勢。

[[chart:vwap-demo]]

## 6.2 點樣睇 VWAP？

| 情況 | 解讀 |
|---|---|
| **A：價格喺 VWAP 上方** | 當日價格高於成交量加權平均價，可以作為**偏強**嘅觀察線索，但唔代表一定繼續升 |
| **B：價格喺 VWAP 下方** | 可以作為**偏弱**嘅觀察線索，但唔代表一定繼續跌 |
| **C：價格不斷穿越 VWAP** | 市場可能處於反覆拉鋸，單靠 VWAP 未必容易判斷方向 |

:::warn 記住
VWAP 本身會**滯後於價格**，而且不能單獨預測未來走勢。
:::

## 6.3 TradingView 點樣加 VWAP？

:::steps
1. 打開 TradingView 圖表。
2. 選擇 NVDA，並切換去 5-minute chart。
3. 點擊 **Indicators（指標）**。
4. 搜尋 **VWAP**，選擇內置 VWAP 指標。
5. 確認計算週期係 **Session**，即按交易時段重新計算；入門階段先唔好改其他參數。
:::

## 6.4 自己計一次 VWAP

[[tool:vwap]]

:::coach 練習
開啟 NVDA 過去 5 個交易日嘅 5-minute chart，觀察價格位於 VWAP 上方、下方，以及反覆穿越時有咩分別。記低觀察結果，**唔好直接用呢啲現象落真倉**。
:::

延伸閱讀：TradingView 官方 VWAP 指南；TradingView 官方 YouTube「How to use VWAP」。

[[quiz:l1-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c7', num: '7', title: '將六樣嘢合併：真正點樣睇圖', mins: 5,
  summary: '價格接近昨日高位，你會點解讀？六樣嘢嘅分工。',
  keywords: ['綜合', '分工', 'PDH'],
  md: `
呢個先係你學完之後要做到嘅事。假設 NVDA 今日開市後一路向上，接近昨日高位 $185。

:::bar 模擬情境：價格接近昨日高位（純屬教學例子）
| 項目 | 狀態 |
|---|---|
| PDH / 阻力參考位 | $185.00 |
| K 線 | 價格逐步上升，收盤接近 $185 |
| 成交量 | 比前幾支 K 線增加 |
| VWAP | 位於現價下方 |
:::

[[quiz:l1-c7]]

:::key 最合理嘅入門思路
等待更多價格反應，再按照事先訂好嘅入場條件及風險計劃決定。即使成交量增加、價格高於 VWAP，都**唔代表突破一定成功**。
:::

## 7.1 六樣嘢其實分工唔同

| 工具 | 分工 |
|---|---|
| K 線 | 描述價格行為 |
| Volume | 提供成交活動嘅背景 |
| 前高、前低 | 提供重要參考價位 |
| 支持、阻力 | 幫你理解價格可能遇到嘅區域 |
| VWAP | 提供當日成交量加權平均價嘅參考 |

:::key 一句講晒
佢哋**唔係六個買賣訊號**，而係**六種閱讀同一張圖嘅方法**。
:::
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c8', num: '8', title: '問答：Indicator 畫阻力位，點解畫成咁？', mins: 7,
  summary: 'LuxAlgo Pivot 指標嘅 75 分鐘確認延遲；應該「每日畫」定「見 Peak 就畫」？初學者畫線標準。',
  keywords: ['LuxAlgo', 'Pivot', '確認延遲', '畫線規則'],
  md: `
:::info 你問過
「用咗 Indicator 去畫阻力位，點解佢畫成咁？同埋我要用一日 5min interval 去畫？定係好似佢咁見到 Peak 就畫？」
:::

你個 Indicator 唔係畫錯，而係佢同「手動畫 Support / Resistance」嘅邏輯有少少唔同。

## 8.1 點解你張圖會畫成咁？

你用緊嘅係 **Support and Resistance Levels with Breaks [LuxAlgo]**。佢係用 **Pivot High / Pivot Low** 自動搵局部高低位，所以先會見到紅線、藍線一段段跳住畫，而唔係畫兩三條由左去右嘅長線。官方說明亦確認，呢個指標係 pivot-based，並用成交量去標示較重要嘅突破。

你左上角見到「15 15 20」，其實係：

| 數字 | 意思 |
|---|---|
| 15 | Left Bars |
| 15 | Right Bars |
| 20 | Volume Threshold |

即係喺 5-minute chart 上，佢要睇「前面 15 支 K + 呢支 K + 後面 15 支 K」先決定嗰個位置係咪 Pivot。所以 **15 支 × 5 分鐘 = 75 分鐘**。假設 10:00 出現一個高位，呢個 Indicator 並唔係 10:00 已經知道「呢度係阻力位」，佢要等之後大約 75 分鐘，確認後面冇更高嘅高位，先可以確認呢個 Pivot High。

:::warn 非常重要
你而家倒轉睇張歷史圖，會覺得佢每條線都畫得好準；但**實戰當刻，條線其實係遲咗一段時間先確認**。因此唔建議初學階段完全依賴呢個 Indicator。
:::

TSLA 圖上 Indicator 畫咗好多紅線：381 → 383 → 381.5 → 382.3 → 378 → 373.5 → 388.55。唔係話 TSLA 同時有七個咁重要嘅阻力位，佢真正表達嘅係：「**喺嗰一段時間，最新被確認嘅 Pivot High 喺呢度**」。之後市場形成新 Pivot High，Indicator 就改用新水平，所以先會出現階梯式線。藍線亦係同一原理（Pivot Low → Support）。

## 8.2 咁應該「每一日 5min 畫」，定係「見 Peak 就畫」？

答案係：**兩樣都唔完全啱**。唔係只睇今日一日，亦都唔係見到每個 Peak 就畫。對 5-minute Day Trading，用呢套簡單規則：

:::steps
1. 開市之前先畫 **Previous Day High（PDH）同 Previous Day Low（PDL）**。
2. 再睇最近 **1–3 個交易日**，有冇非常明顯嘅大高位／大低位。
3. 開市之後用 5-minute chart，只有出現**明顯 Swing High / Swing Low** 先考慮新增。
4. 如果同一個價位附近反應過**兩三次**，重要性明顯增加。
5. 唔好每個細 Peak 都畫；一張圖正常大約 **3–6 個**主要水平／區域已經夠。
:::

:::key 記住一句
**Peak 只係候選位置；有市場反應嘅 Peak，先值得當 Support / Resistance。**
:::

## 8.3 你張圖其實有一個好好嘅實例

[[chart:luxalgo-steps]]

價格本來喺大約 $372–374 附近活動，之後突然出現幾支好大嘅綠色 5-minute candle，而且下面 Volume 明顯放大，價格一路去到 $388。呢個時候最值得研究嘅唔係「Indicator 又畫咗條新紅線」，而係：**$382 左右原本係一個重要價格區域 → TSLA 大成交量突破 → 之後如果回落到 $382 附近，要觀察 Resistance 會唔會變 Support**。

呢個就係 **Resistance → Breakout → Retest → Potential Support**。

## 8.4 Support / Resistance 唔應該當成一條精準線

例如 Indicator 話 Resistance = $388.55，唔好理解成「$388.54 冇事，$388.55 就神奇地變成阻力」。實際交易更傾向理解：**$388.0–$388.6 = Resistance Zone**。價格係喺一個範圍產生供求反應，而唔係 Wall Street 所有人都設定 $388.55。唯一有時會畫得比較精準嘅係 **PDH / PDL / Premarket High / Premarket Low**，因為佢哋本身就係一個客觀價格。

## 8.5 建議嘅圖表分工同畫線標準

| 圖表 | 用途 |
|---|---|
| Daily | 睇大方向、重大歷史位置 |
| 15 min | 搵比較明顯嘅 Intraday S/R |
| 5 min | 你主要 Day Trading 圖表 |
| 1 min | 暫時唔好用，太多 noise |

初學甚至只需要：**15m 搵位 → 5m 睇反應**。

- 兩次去到 $388 左右都跌返落嚟 → **畫**。
- $380.2、$380.8、$381.1、$380.6 每個細 Peak → **唔好四個都畫**，可以理解成 $380–381 一個區域。

:::coach 建議練習
關咗 LuxAlgo，自己只畫：**PDH + PDL + 2 個最明顯 Resistance / Support + VWAP + Volume**。然後再開返 Indicator，睇下你同佢有幾接近。呢個練習會比直接睇 Indicator 快好多學識真正嘅 Price Action。
:::

[[quiz:l1-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c9', num: '9', title: '由明白到應用（上）：三層次與四種 K 線', mins: 9,
  summary: '位置 → K 線反應 → Volume → VWAP → 風險 → 決定。Shooting Star、Engulfing、Hammer 點樣配合 Volume 同 VWAP。',
  keywords: ['三層次', 'Shooting Star', 'Engulfing', 'Hammer', 'Relative Volume'],
  md: `
:::info 你問過
「都明白之後，點樣應用？睇到 6 樣嘢入面唔同情況，我應該點反應點做？例如見人哋 Candle 有唔同 foresee 跌嘅形態，又點樣可以配合 Volume、Average Price 去做下一步嘅判斷？」
:::

你而家其實去到學 Day Trading 最重要嘅階段：**由「識睇圖」進步到「識根據圖表作出決定」**。

:::key 核心觀念
Day Trading 唔係預測下一支 K 線升定跌，而係**識別一個可能出現嘅走勢，等待證據支持，再決定值唔值得承擔風險**。
:::

## 9.1 六樣工具應該點樣配合？分三個層次

| 層次 | 工具 | 真正用途 | 你要問自己 |
|---|---|---|---|
| ① 位置 | Previous High / Low、Support / Resistance | 參考位、支持阻力區 | 價格正喺邊個重要區域？ |
| ② 價格反應 | Candlestick | 睇買賣雙方嘅價格結果 | 價格喺呢個位置出現咩反應？ |
| ② 成交確認 | Volume | 評估成交活動 | 呢個反應有冇足夠成交量支持？ |
| ③ 市場背景 | VWAP | 判斷日內價格相對強弱 | 價格處於 VWAP 上方定下方？ |

:::steps
1. **位置**
2. **K 線反應**
3. **Volume**
4. **VWAP**
5. **交易風險**
6. **決定**
:::

例如見到一支 Shooting Star，唔應該即刻覺得 TSLA 會跌。你應該問：「佢係咪出現喺 Resistance 附近？成交量有冇增加？價格仲係咪企喺 VWAP 上面？下一支 K 線有冇確認下跌？」 —— 呢個先係 **Price Action Analysis**。

## 9.2 先學識四種最常用嘅 K 線形態

[[chart:patterns]]

### 1. Shooting Star（射擊之星）—— 潛在看跌訊號

特徵：上影線明顯較長；實體相對較小，位於整支 K 線下方；價格曾經上升，但收市前由高位回落。可能係買方嘗試推高價格，但未能維持高位。

假設 TSLA 上升到阻力位 $388，出現 Shooting Star，Volume 明顯高於近期水平，價格**高於 VWAP**。唔應該見到 Shooting Star 就立即 Short —— 因為價格仍然高於 VWAP，整體日內走勢可能仍然偏強。下一步觀察：下一支 5-minute candle 會唔會**跌穿 Shooting Star 嘅最低位**？如果跌穿之後繼續出現 Lower High、Lower Low，甚至失守 VWAP，先有更多理由考慮市場轉弱。相反，如果下一支直接升穿 Shooting Star 嘅高位，原本嘅看跌判斷就受到破壞。

:::key 關鍵
Shooting Star 係**警告**，唔係已確認轉勢。
:::

### 2. Bearish Engulfing（看跌吞噬）

前一支係綠色 Candle，下一支係較大嘅紅色 Candle，實體覆蓋前一支綠色實體。例如 TSLA 第一支 Open $385 → Close $387，第二支 Open $387.50 → Close $384.50。

| 情況 | 解讀 |
|---|---|
| 出現喺 Resistance | 看跌訊號較值得留意 |
| 紅燭成交量明顯增加 | 下跌成交活動增加 |
| 價格失守 VWAP | 日內走勢偏弱嘅證據增加 |
| 下一支再跌穿前低 | 提供進一步確認 |
| 價格重新升穿吞噬形態高位 | 看跌判斷可能失效 |

但如果 Bearish Engulfing 出現喺強勢上升途中，而 TSLA 仍然遠高於 VWAP，佢亦可能只係普通 **Pullback（回調）**。**形態出現嘅位置，往往比形態本身更重要。**

### 3. Hammer（鎚頭）—— 潛在看漲訊號

下影線長，實體細，實體位於 K 線較高位置。假設 Support 喺 $380，股價跌到 $379.50，之後反彈，5 分鐘收喺 $380.80。如果同時出現：明顯下影線、支持區附近成交量增加、下一支升穿 Hammer 高位、價格重新站穩 VWAP —— 就比單獨一支 Hammer 提供更多看漲證據。

:::warn 注意
Hammer 出現時有高成交量並唔一定係好事。如果之後立即**大成交量跌穿 Hammer 低位**，反而代表支持可能失效。
:::

### 4. Bullish Engulfing（看漲吞噬）

同 Bearish Engulfing 相反：前面係紅燭，後面一支較大綠燭嘅實體覆蓋前一支紅燭實體。如果喺 Support、Previous Low 或 VWAP 附近出現，值得觀察有冇反彈，但仍然需要後續價格確認。

## 9.3 Volume 到底點樣幫你判斷真假訊號？

| K 線形態 | Volume | 可能意思 | 初步反應 |
|---|---|---|---|
| 大綠燭 | 高 | 上升得到較多成交活動支持 | 觀察能否持續或回測 |
| 大綠燭 | 低 | 上升力度未有明顯成交量確認 | 避免單憑突破追入 |
| 大紅燭 | 高 | 下跌活動增加 | 留意支持會否失守 |
| 大紅燭 | 低 | 下跌成交活動較少 | 觀察有冇反彈 |
| Shooting Star | 高 | 高位出現激烈買賣及價格回落 | 留意下一支 K 線 |
| Hammer | 高 | 低位出現激烈買賣及價格收復 | 留意支持能否守住 |

:::key 一定要清楚
**高 Volume 唔等於多咗賣家，低 Volume 亦唔等於冇人買。** 每宗成交都有買賣雙方。Volume 只係成交總量，唔能夠單靠佢判斷邊一方主動，亦唔保證價格會朝某個方向繼續移動。
:::

另外要學埋 **Relative Volume**：美股開市頭 5 分鐘通常比午市成交量大，所以唔應該直接將 9:30 AM 嘅 Volume 同 1:30 PM 比較，更理想係比較過去多日**同一時間**嘅 5 分鐘成交量（TradingView 指標：Relative Volume at Time）。

[[tool:rvol]]

## 9.4 VWAP 點樣令你嘅判斷更完整？

**VWAP 應該用嚟判斷交易方向嘅背景，而唔係當成買賣按鈕。**

:::bad 情況 A：TSLA 喺 VWAP 上方出現 Bearish Engulfing
TSLA = $388、VWAP = $383，股價仍然高於 VWAP。一支 Bearish Engulfing 可能只係短線回調。**先觀察**，唔好因為一支紅燭就假設上升趨勢已經完結。
:::

:::good 情況 B：TSLA 跌穿 VWAP 後，再出現 Bearish Engulfing
TSLA 原本 $388，之後跌穿 VWAP $385，反彈去 $385 附近但升唔返上去，再出現 Bearish Engulfing，而且跌破前一個 Swing Low。市場已經失守 VWAP，反彈未能重新站穩，價格結構亦開始轉弱 —— **係更值得研究嘅看跌情境**。但仍然要計算入場價、止損同可能目標，唔可以因為三個訊號一致就追價。
:::

[[quiz:l1-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l1-c10', num: '10', title: '由明白到應用（下）：五個情境與決策表', mins: 10,
  summary: 'Breakout、受阻轉弱、支持反彈、假突破、圍住 VWAP；決策速查表；用 TSLA 圖完整分析；Entry / Stop / R:R 入門。',
  keywords: ['情境', '決策表', 'Fake Breakout', 'No Trade', 'Risk / Reward'],
  md: `
## 10.1 五個常見情境

### 情境一：突破阻力位 —— Breakout

TSLA 喺 $380–$385 橫行，$385 係 Resistance。突然出現大綠燭突破 $385、Volume 比之前明顯增加、股價高於 VWAP、下一個重要高位係 $390。

**唔好一見大綠燭就急住追**，因為有可能係 Fake Breakout。其中一種比較容易建立風險界線嘅學習方法係等待 **Breakout + Retest**：股價由 $385 升到 $387，之後回落到 $385 附近，如果守得住，再出現一支強勢綠燭收市，可以研究模擬 Long。

- **Entry**：回測守穩後，突破確認 K 線高位。
- **Stop Loss**：回測低位下方（跌穿即代表支持判斷可能失效）。
- **Take Profit**：參考下一個重要 Resistance，例如 $390。

如果下一個阻力位太近，潛在利潤唔足夠彌補止損風險，即使形態好靚都可以放棄。

### 情境二：遇到阻力後轉弱 —— Bearish Reversal

阻力位 $388.50，VWAP $386，股價升到 $389：

:::steps
1. **第一支：Shooting Star**（最高 $389，收市 $387.80，Volume 明顯增加）→ 決定：**等**。一支 Shooting Star 唔代表必定跌。
2. **第二支：大紅燭**，跌穿第一支 K 線嘅低位 → 短線看跌訊號增強。
3. **觀察 VWAP**：如果價格持續跌穿 VWAP，反彈又無法重新企穩，並形成 Lower High，轉弱證據進一步增加。
4. **制定模擬計劃**：等待跌穿後回測失敗先研究做空，而唔係大紅燭已經跌咗好多先追；止損設喺令看跌情境失效嘅高位上方；止賺參考下一個支持位。
:::

:::key 重點
唔係 Shooting Star 叫你 Short，而係**之後嘅市場反應逐步支持看跌情境**。如果價格重新升穿阻力區，就要重新評估。
:::

### 情境三：跌到支持位後反彈 —— Bullish Reversal

Support $380，股價由 $385 跌到 $380，出現 Hammer、Volume 增加、原本低於 VWAP 之後開始收復、下一支升穿 Hammer 高位。可以開始研究反彈情境，而唔係一見 $380 就買。假設價格重新企穩 VWAP，再回測不破，並形成 Higher Low，證據會增加。但如果跌穿 $380，而且連續 5-minute candles 都無法收復支持區，原本嘅反彈假設就應該放棄。

### 情境四：假突破 —— Fake Breakout

阻力 $385，TSLA 一度升到 $386，但成交量未有明顯增加、下一支跌返 $385 以下、再下一支亦無法升返上去。

- **未進場**：放棄原本 Breakout Long 計劃。
- **已模擬進場**：按事前訂定嘅止損或失效條件處理。
- **可唔可以立即 Short？** 未必。假突破唔一定會演變成持續下跌。

### 情境五：價格圍住 VWAP 上上落落

VWAP = $385，股價一時 $384.50、一時 $385.50，K 線紅綠交替，Volume 普通，又冇突破重要高低位 → **唔做交易**。

:::key 好重要嘅能力
你唔係需要每隔五分鐘都估升跌。當冇清晰優勢、冇合理止損位置，又或者潛在回報不足，就唔應該勉強交易。
:::

[[replay:l3-bull-trap]]

## 10.2 一張決策表：幫你知道下一步點做

| 市場情況 | K 線 | Volume | VWAP | 初學者反應 |
|---|---|---|---|---|
| 接近阻力 | Shooting Star | 增加 | 上方 | 等下一支確認，暫不追 Long |
| 接近阻力 | Bearish Engulfing | 增加 | 下方 | 研究看跌情境，檢查風險回報 |
| 接近支持 | Hammer | 增加 | 下方 | 等反彈確認，唔好立即買 |
| 接近支持 | Bullish Engulfing | 增加 | 重新站穩上方 | 研究看漲情境 |
| 突破阻力 | 大綠燭 | 增加 | 上方 | 等收市及回測，避免追高 |
| 跌穿支持 | 大紅燭 | 增加 | 下方 | 等回測，觀察支持會否變阻力 |
| 突破阻力 | 小綠燭 | 低 | 上方 | 小心假突破，等更多證據 |
| 無重要價位 | 紅綠交替 | 普通 | 不斷穿越 | 不交易 |

呢張表**唔係機械式買賣系統**，佢只係幫你決定下一步應該觀察乜。

## 10.3 用你之前嘅 TSLA 圖做一次完整分析

TSLA 5-minute，用 LuxAlgo 自動畫 S/R，右邊有一段急升、成交量明顯增加，圖上有一條約 $388.55 嘅紅色水平線。

| 步驟 | 問題 | 決定 |
|---|---|---|
| 1 | 價格而家喺邊度？接近 $388.55，可能遇到 Resistance | 唔追 Long，先睇價格反應 |
| 2 | 出現咩 Candle？假設長上影線 | 開始留意有冇受阻，但唔立即 Short |
| 3 | Volume 有冇增加？長上影線伴隨明顯增加嘅成交量 | 提高警覺，睇下一支會唔會繼續轉弱 |
| 4 | VWAP 喺邊？假設 $383，由 $388 跌到 $386 仍然高過 VWAP | 可能只係強勢上升後嘅 Pullback |
| 5 | 買、賣定等？ | 睇以下三個結果 |

- **結果 A**：再次升穿 $388.55，成交量增加 → 放棄「即將反轉」假設，改為觀察突破能否維持。
- **結果 B**：一直無法升穿，開始形成 LH、LL → 短線看跌證據增強，可以研究模擬做空計劃，但仍要考慮 VWAP、下方支持位同風險回報。
- **結果 C**：喺 $386–$388 之間反覆橫行 → 冇明確方向，唔做交易。

**同一個 Resistance，可以有三種唔同發展。你唔需要提前估中邊個結果，只需要知道每個結果發生時，自己應該點樣反應。**

## 10.4 真正進場之前，你仲欠一項重要知識

市場分析同交易執行係兩回事。就算你正確判斷 TSLA 可能上升，都唔代表任何價位買入都合理。

- **Entry**：點樣確認你嘅交易假設值得嘗試？
- **Stop Loss**：價格去到邊度，代表你嘅分析可能錯咗？
- **Risk / Reward**：你願意承受幾多風險，去爭取幾多潛在利潤？

[[rr:385,384,387]]

每承擔 $1 風險，爭取 $2 潛在回報（1:2）。但即使有 1:2，亦**唔代表策略一定賺錢**：交易勝率、滑價、手續費同實際執行都會影響結果，止損單亦唔保證一定以指定價格成交。FINRA 特別提醒，頻繁日內交易有重大虧損風險，使用 Margin 更可能放大損失。所以先用 TradingView Paper Trading 或 Bar Replay 練習。

## 10.5 下一步應該點樣練習？

唔建議繼續不停學新 Indicators。用 TSLA 5-minute chart，開 TradingView Bar Replay 遮住未來嘅 K 線，每出現一支已經完成嘅 Candle，按以下順序問自己：

[[check:l1-6q]]

最初 20–30 個歷史情境，甚至可以唔落模擬盤，只記錄判斷同之後結果。**特別要記錄判斷失敗嘅情況**，因為你需要知道自己套方法喺咩市場環境下最容易出錯。

| 階段 | 學習內容 |
|---|---|
| Level 1 | Candlestick、Volume、PDH、PDL、S/R、VWAP（已了解基本概念） |
| Level 2 | Price Action + Volume + VWAP 綜合判斷（現在開始） |
| Level 3 | Breakout、Retest、Reversal、Fake Breakout |
| Level 4 | Entry、Stop Loss、Take Profit、Risk / Reward |
| Level 5 | TradingView Replay、交易紀錄、策略驗證 |

[[quiz:l1-final]]
`},
  ],
});
