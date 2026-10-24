/* Level 6：市場環境與多時間框架（Context is King） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

/* ---------- Level 6 示意圖（全部係教學模擬數據） ---------- */
(function () {
  const C = window.Charts;
  C.named['l6-orb'] = () => {
    const bars = [
      { t: '09:30', o: 386.0, h: 387.6, l: 385.2, c: 387.1, v: 3.1 },
      { t: '09:35', o: 387.1, h: 387.9, l: 385.8, c: 386.2, v: 2.4 },
      { t: '09:40', o: 386.2, h: 386.9, l: 385.0, c: 386.6, v: 2.0 },
    ].concat(C.genBars([386.9, 386.3, 387.4, 387.0, 388.4, 389.1, 388.6, 389.6, 390.4, 390.1, 391.0], { seed: 611, open: 386.6, start: '09:45', wick: 0.35, baseVol: 1.2 }));
    bars[7].v = 2.3;
    return { bars, vwap: true, height: 270, lines: [{ y: 387.9, label: 'ORH 387.90', color: 'var(--down)' }, { y: 385.0, label: 'ORL 385.00', color: 'var(--up)' }], zones: [{ lo: 385.0, hi: 387.9, label: '15 分鐘 Opening Range' }], marks: [{ i: 7, text: '收市突破 ORH' }, { i: 9, text: '回測', pos: 'below' }], title: '15 分鐘 Opening Range 突破（模擬）', caption: '頭三支 5m K 線（09:30–09:45）定出 ORH / ORL。突破要睇收市、成交量同 VWAP，唔係一碰就追。' };
  };
  C.named['l6-mtf'] = () => {
    const bars = C.genBars([386.2, 387.0, 387.9, 387.3, 386.8, 387.6, 388.5, 389.4, 390.2, 391.1, 391.6, 391.2, 391.8, 391.4, 390.6], { seed: 621, open: 385.8, wick: 0.35 });
    return { bars, showVolume: false, height: 240, zones: [{ lo: 391.6, hi: 392.4, label: '日線阻力（上次擺動高位）', color: 'var(--down)' }], lines: [{ y: 388.0, label: '5m 突破位 388', color: 'var(--accent)' }], marks: [{ i: 7, text: '5m 突破' }, { i: 10, text: '撞日線阻力' }], title: '5m 突破，但上面就係日線阻力', caption: '細時間框架嘅訊號，要讓位畀大時間框架嘅位置。目標喺 $392 之前，R:R 可能根本唔夠。' };
  };

  const mini = (el, list, cols) => {
    el.innerHTML = `<div class="mini-grid ${cols || ''}">${list.map(() => '<div></div>').join('')}</div><p class="tool-fine">示意圖，全部係模擬數據，唔代表真實 TSLA 行情。</p>`;
    const g = el.querySelectorAll('.mini-grid > div');
    list.forEach((cfg, i) => C.candles(g[i], Object.assign({ showVolume: false, height: 150 }, cfg)));
  };
  window.WIDGETS_EXTRA['l6-gaps'] = (el) => {
    const prev = C.genBars([383.4, 384.1, 383.6, 384.4, 384.9], { seed: 631, open: 383.0, wick: 0.3, start: '15:35' });
    const day = (closes, seed, open) => prev.concat([{ t: '', o: open, h: open, l: open, c: open, color: 'transparent' }]).concat(C.genBars(closes, { seed, open, wick: 0.35 }));
    const line = [{ y: 384.9, label: '昨收 384.90', color: 'var(--muted)' }];
    mini(el, [
      { bars: day([390.6, 391.4, 391.1, 392.3, 393.0, 393.8], 632, 389.8), lines: line, title: 'A. Gap & Go：高開後繼續升', caption: '守住開市價同 VWAP 上方' },
      { bars: day([389.2, 388.1, 387.0, 386.2, 385.4, 385.0], 633, 389.8), lines: line, title: 'B. Gap Fill：高開後回補缺口', caption: '跌返去昨日收市價附近' },
      { bars: day([390.9, 391.5, 390.2, 388.6, 387.1, 385.9], 634, 389.8), lines: line, title: 'C. Gap & Trap：先升後急跌', caption: '開市追高嘅人被困' },
      { bars: day([386.0, 385.4, 386.2, 385.6, 386.3, 385.8], 635, 385.9), lines: line, title: 'D. 細 Gap：喺昨日區間內上落', caption: '冇方向，通常唔使特別處理' },
    ], 'four');
  };
  window.WIDGETS_EXTRA['l6-daytypes'] = (el) => {
    const t = C.genBars([386.6, 387.4, 388.1, 387.8, 388.9, 389.6, 389.3, 390.4, 391.2, 390.9, 391.8, 392.6, 392.3, 393.1, 393.8], { seed: 641, open: 386.0, wick: 0.3 });
    const r = []; const rr = C.mulberry32(642); for (let i = 0; i < 15; i++) r.push(386 + Math.sin(i / 1.6) * 1.6 + (rr() - 0.5) * 0.5);
    const v = C.genBars([387.2, 388.4, 389.3, 389.8, 389.1, 388.0, 386.9, 385.8, 385.1, 384.2, 383.6, 384.0, 383.1, 382.6, 382.2], { seed: 643, open: 386.4, wick: 0.3 });
    mini(el, [
      { bars: t, vwap: true, title: 'Trend Day 趨勢日', caption: '開市附近係低位、收市附近係高位；一直喺 VWAP 上方，回調淺' },
      { bars: C.genBars(r, { seed: 644, open: 386 }), vwap: true, title: 'Range Day 區間日', caption: 'VWAP 橫行，價格反覆穿越，去到邊界就返轉頭' },
      { bars: v, vwap: true, title: 'Reversal Day 反轉日', caption: '早段升勢失敗，跌穿 VWAP 之後一直受壓' },
    ]);
  };
  window.WIDGETS_EXTRA['l6-rs'] = (el) => {
    C.line(el, {
      series: [
        { name: 'TSLA', data: [0, 0.4, 0.9, 0.7, 1.3, 1.1, 1.6, 2.0, 1.8, 2.3], color: 'var(--accent)', dots: true },
        { name: 'QQQ', data: [0, -0.1, 0.1, -0.3, -0.2, -0.5, -0.4, -0.6, -0.7, -0.5], color: 'var(--warn)', dots: true },
      ],
      labels: ['09:30', '', '10:00', '', '10:30', '', '11:00', '', '11:30', ''], height: 230, format: (x) => (x > 0 ? '+' : '') + x.toFixed(1) + '%',
      title: '相對強弱：大市跌緊，TSLA 仲企得穩（模擬）', caption: '藍：TSLA 由開市計嘅升跌幅；橙：QQQ。QQQ 創新低嗰陣 TSLA 冇跟住創新低 = 相對強勢。',
    });
  };
  window.WIDGETS_EXTRA['l6-ushape'] = (el) => {
    C.bars(el, {
      values: [100, 66, 52, 44, 37, 33, 31, 32, 35, 40, 47, 58, 88],
      labels: ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
      colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (i < 2 || i > 10 ? 'var(--accent)' : i >= 4 && i <= 8 ? 'var(--muted)' : 'var(--vwap)')),
      height: 220, format: (x) => x,
      title: '每半小時成交量（示意，開市第一個半小時 = 100）', caption: '典型「U 形」：開市同收市最多人交易，午市最靜。真實比例每日唔同，可以用自己嘅數據驗證。',
    });
  };
})();

window.COURSE.push({
  id: 'l6',
  code: 'Level 6',
  title: '市場環境與多時間框架',
  subtitle: 'Market Context, Multi-Timeframe, Gaps, Opening Range, Relative Strength & Catalysts',
  icon: '🌐',
  color: '#0d9488',
  question: '今日呢個市場環境，值唔值得用我嘅 Setup？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l6-c1', num: '1', title: '由 Setup 到 Context：同一個 Setup，唔同日子', mins: 7,
  summary: '同一個 Breakout + Retest，喺趨勢日、區間日、新聞日嘅結果可以完全唔同。Level 6 教你先判斷「今日係咩市」。',
  keywords: ['Context', '市場環境', 'A+ Setup', 'Level 6–8'],
  md: `
:::info Level 6–8 係進階內容
Level 1–5 已經教咗你：睇圖（L1）、判斷（L2）、Setup（L3）、執行同風險（L4）、驗證（L5）。Level 6–8 唔係教更多指標，而係令你嘅判斷**更有選擇性、更穩定、更可持續**。所有 TSLA 價格同例子都係**教學模擬**。
:::

| Level | 主題 | 核心問題 |
|---|---|---|
| Level 6 | 市場環境與多時間框架 | 今日呢個環境，值唔值得用我嘅 Setup？ |
| Level 7 | 進階交易管理與訂單流 | 入咗場之後，點樣將每筆交易管理到最合理？ |
| Level 8 | 交易者表現系統 | 點樣令自己長期、穩定、健康咁進步？ |

## 1.1 點解同一個 Setup 會有唔同結果？

假設你喺 Level 5 驗證咗 Breakout + Retest Long。你翻查紀錄，發現：

| 當日環境 | 例子 | 常見結果 |
|---|---|---|
| 趨勢日，TSLA 比大市強 | 開市後一直喺 VWAP 上方 | 突破之後容易延續 |
| 區間日，VWAP 橫行 | 價格喺 $384–$388 上落 | 突破好多時係假突破 |
| 重要數據公布前 | CPI、FOMC 前一小時 | 波幅收窄，之後突然大幅跳動 |
| 個股有新聞 | 交付數字、業績 | 跳空、Spread 闊、滑價大 |

:::key Setup 決定「可唔可以入場」，Context 決定「值唔值得入場」
專業交易者唔係每次見到 Setup 都做，而係只做**喺有利環境出現嘅 Setup**。
:::

## 1.2 Context 嘅五層

:::steps
1. **大市**：QQQ / SPY 今日偏強、偏弱，定冇方向？
2. **同類股**：大型科技股、電動車股有冇一齊郁？
3. **個股**：TSLA 今日有冇新聞？有冇跳空？位置喺日線圖邊度？
4. **時段**：開市、午市、收市前，波幅同成交量唔同。
5. **日類型**：今日似趨勢日、區間日，定反轉日？
:::

## 1.3 A+、B、C 級 Setup

| 級別 | 條件 | 建議做法 |
|---|---|---|
| A+ | Setup 合格 + 大市同方向 + TSLA 相對強弱配合 + 喺重要位置 + 時段合適 | 正常風險（例如 0.25% 本金） |
| B | Setup 合格，但有一至兩項 Context 中性 | 減半風險，或者只做 Paper |
| C | Setup 合格，但 Context 唔利（例如逆大市、事件前、午市冇量） | 唔做，記錄落「候選」 |

:::coach 教練補充：學識「唔做」
好多新手以為進步 = 做多啲交易。其實進階交易者嘅進步，好多時係**做少啲、但做得好啲**。Level 6 最重要嘅成果，係令你有清晰理由講「今日唔適合」。
:::

[[quiz:l6-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c2', num: '2', title: '多時間框架分析：由大到細', mins: 9,
  summary: '日線定方向同重要位置、15 分鐘定日內背景、5 分鐘負責執行。細時間框架嘅訊號要讓位畀大時間框架嘅位置。',
  keywords: ['Multi-Timeframe', 'Top-down', '日線', '對齊'],
  md: `
## 2.1 Top-down：由大睇到細

| 時間框架 | 角色 | 你要搵嘅嘢 |
|---|---|---|
| 日線（Daily） | 大方向 + 重要位置 | 最近擺動高低位、上次跳空位、日線趨勢 |
| 60 分鐘 / 15 分鐘 | 日內背景 | 今日結構（HH/HL 定 LH/LL）、PDH / PDL、Pre-market 高低位 |
| 5 分鐘 | 執行 | Setup、Entry Trigger、Stop |
| 1 分鐘（可選） | 微調 | 只用嚟睇入場細節，唔好用嚟改變大判斷 |

:::tip 時間框架比例
常見做法係每層相差大約 3–6 倍（例如 日線 → 60m → 15m → 5m）。太接近（5m 同 3m）冇額外資訊；太遠（日線同 1m）又連唔起。
:::

## 2.2 大時間框架嘅位置 > 細時間框架嘅訊號

[[chart:l6-mtf]]

5 分鐘圖喺 $388 出現一個靚靚嘅突破。但係如果你打開日線圖，會見到 $391.60–$392.40 係上次擺動高位（日線阻力）。

- Entry $388.30、Stop $386.90（風險 $1.40）
- 日線阻力喺 $391.60 → 去到阻力之前最多 $3.30 → 約 **2.4R**
- 如果你本來打算拎 4R，呢個目標根本唔現實

:::key 一句記住
**細圖搵入場，大圖搵位置。** 5 分鐘嘅突破撞正日線阻力，好多時只係「去咗阻力」，唔係「突破咗阻力」。
:::

## 2.3 對齊矩陣

| 日線 | 15m | 5m | 解讀 | 做法 |
|---|---|---|---|---|
| 升勢 | 升勢 | 回調完再升 | 三層對齊 | A+ Long 候選 |
| 升勢 | 升勢 | 跌緊 | 細圖回調中 | WAIT：等 5m 轉返向上 |
| 升勢 | 跌勢 | 跌勢 | 日內逆大方向 | B 級或者唔做 |
| 跌勢 | 升勢 | 升勢 | 跌勢中反彈 | 小心阻力，目標要保守 |
| 區間 | 區間 | 任何 | 冇方向 | 只喺區間邊界做，或者唔做 |

[[tool:mtf-align]]

## 2.4 常見錯誤

:::bad 錯誤一：睇得太多時間框架
同時睇 1m、3m、5m、15m、30m、60m、日線，總有一個支持你想做嘅方向。**固定用三個**，事前寫落 Playbook。
:::

:::bad 錯誤二：入場後轉去細圖「搵理由」
入場之後見到 1 分鐘有支大紅燭就嚇到平倉。管理交易要用**入場時嘅時間框架**同事前定好嘅規則。
:::

[[quiz:l6-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c3', num: '3', title: '跳空（Gap）與 Pre-market', mins: 9,
  summary: 'Gap 嘅大小、方向、相對日線位置同成交量，決定今日開市可能點走。Pre-market 高低位係重要參考位。',
  keywords: ['Gap', 'Gap & Go', 'Gap Fill', 'Pre-market', 'PMH / PML'],
  md: `
## 3.1 乜嘢係 Gap？

$$ Gap % = (今日開市價 − 昨日收市價) ÷ 昨日收市價 × 100% $$

例如 TSLA 昨日收 $384.90，今日開 $389.80：Gap = +1.27%（模擬）。

美股正式交易時間係美東 09:30–16:00（香港夏令時間 21:30–04:00；冬令時間 22:30–05:00）。開市前（Pre-market）同收市後（After-hours）都可以交易，但通常**成交量少、Spread 闊**，所以好多 Gap 其實喺 Pre-market 已經形成。

## 3.2 點樣將 Gap 分類？

| 問題 | 點解重要 |
|---|---|
| Gap 有幾大？（相對 ATR） | 細過半個 ATR 嘅 Gap 好多時冇特別意義；大過 1 個 ATR 代表有特別事件 |
| 開喺昨日區間入面，定喺 PDH / PDL 外面？ | 開喺區間外面，代表市場接受咗新價格嘅機會較大 |
| 有冇新聞？ | 有實質新聞（業績、交付數字）嘅 Gap 比冇新聞嘅 Gap 更容易延續 |
| Pre-market 成交量大唔大？ | 量少嘅 Pre-market 高低位，參考價值較低 |
| 大市同方向嗎？ | TSLA 高開但 QQQ 低開，要更小心 |

[[widget:l6-gaps]]

## 3.3 四種常見劇本

:::card A. Gap & Go（缺口延續）
高開之後守住開市價同 VWAP，升穿 Pre-market High（PMH）。通常要有新聞同大成交量配合。
:::

:::card B. Gap Fill（回補缺口）
高開之後慢慢跌返去昨日收市價。好多人覺得「缺口一定會補」—— **唔一定**，要用你自己嘅數據驗證，唔好當係定律。
:::

:::card C. Gap & Trap（缺口陷阱）
開市頭幾分鐘衝高，吸引人追入，之後急跌穿開市價同 VWAP。追高嘅人被困，賣壓加大。
:::

:::card D. 細 Gap / 區間內 Gap
開市價仲喺昨日區間入面，市場未有新共識。通常當普通日咁處理。
:::

## 3.4 Pre-market High / Low

- **PMH / PML** 係開市前嘅最高位同最低位，同 PDH / PDL 一樣，係值得事前畫好嘅參考位。
- 但係 Pre-market 成交量少，有時一兩張單就造出一個高位，所以要配合成交量睇。
- 開市後突破 PMH 並守住，係 Gap & Go 嘅常見確認；跌穿開市價同 VWAP，係 Gap 失敗嘅常見警號。

[[tool:gap-analyzer]]

:::warn Day Trader 嘅好處：唔使過夜
Gap 對過夜持倉嘅人係風險（Stop 可能被跳過），對 Day Trader 嚟講係**資訊**。所以 Day Trader 一般收市前平倉，唔揹過夜 Gap 風險。
:::

[[quiz:l6-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c4', num: '4', title: 'Opening Range 與開市頭 30 分鐘', mins: 8,
  summary: '開市頭 5／15／30 分鐘嘅高低位（ORH / ORL）係當日第一個重要區域。學識分辨四種開市模式，同埋點解新手應該先觀察。',
  keywords: ['Opening Range', 'ORB', 'ORH / ORL', '開市模式'],
  md: `
## 4.1 Opening Range 係乜？

**Opening Range（OR）** = 開市後一段固定時間（常用 5、15 或 30 分鐘）嘅最高位（ORH）同最低位（ORL）。

[[chart:l6-orb]]

## 4.2 四種開市模式

| 模式 | 樣子 | 意思 |
|---|---|---|
| Open-Drive 開市直衝 | 開市後一面倒向一個方向，幾乎冇回頭 | 一方好有信心，唔好逆住做 |
| Open-Test-Drive 先試再衝 | 先試一邊（例如試 PDH 失敗），再大力衝向另一邊 | 試探完搵到方向 |
| Open-Rejection-Reverse 開市反轉 | 開市衝一個方向，但好快被打返轉頭 | 開市嗰邊嘅方向被否定 |
| Open-Auction 開市拉鋸 | 喺 OR 入面上上落落 | 未有共識，等突破 |

:::tip 呢個分類嚟自 Market Profile 理論
唔使背名，重點係問自己：開市嗰股力，係**被接受**定**被拒絕**？
:::

## 4.3 Opening Range Breakout（ORB）規則例子

:::steps
1. 09:30–09:45 記錄 ORH / ORL（15 分鐘 OR）。
2. 等一支 5m K 線**收市**喺 ORH 上方，成交量高過同時段平均，價格喺 VWAP 上方。
3. Entry：突破 K 線高位上方；或者等回測 ORH 守住。
4. Stop：OR 中間位或者回測低位下方（OR 太闊嘅話，Stop 用 ORL 就太遠）。
5. Target：下一個重要位置（PDH、PMH、日線阻力），唔好求「一定要 2R」而亂設。
6. 如果 OR 闊度大過平時（例如超過日 ATR 嘅一半），風險太大 → 降注碼或唔做。
:::

[[replay:l6-orb]]

## 4.4 點解新手應該等？

:::warn 開市頭 5–15 分鐘
- Spread 最闊、滑價最大
- 價格好快，Stop 好易被掃
- 好多開市訂單係隔夜累積，方向未必代表全日

新手可以將開市頭 15 分鐘定為「**只觀察、只記錄**」時間，用嚟畫 OR、睇 RS、判斷開市模式。
:::

[[quiz:l6-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c5', num: '5', title: '相對強弱：TSLA vs 大市', mins: 8,
  summary: '比較 TSLA 同 QQQ / SPY 由同一個起點嘅升跌幅。大市跌而 TSLA 企穩 = 相對強勢；做 Long 揀強，做 Short 揀弱。',
  keywords: ['Relative Strength', 'QQQ', 'SPY', 'Beta', '背馳'],
  md: `
## 5.1 點樣計相對強弱？

$$ 相對強弱 = TSLA 升跌幅 − QQQ 升跌幅（同一個起點計） $$

起點可以係昨日收市價，或者今日開市價。重點係**兩隻都用同一個起點**。

| | 由開市計 | 解讀 |
|---|---|---|
| QQQ | −0.5% | 大市弱 |
| TSLA | +2.3% | 大市跌，TSLA 升 → 明顯相對強勢 |

[[widget:l6-rs]]

## 5.2 Beta：TSLA 本身波幅較大

TSLA 嘅波幅長期大過大市（Beta 大過 1，而且會隨時間改變）。所以：

- QQQ +1%，TSLA +1% → 表面一樣，其實 TSLA **偏弱**（按 Beta 佢「應該」升多啲）。
- QQQ −1%，TSLA −0.5% → TSLA 跌，但係**相對抗跌**。

:::tip 簡單做法
唔使計精確 Beta。只要留意：大市創新低嗰陣，TSLA 有冇跟住創新低？大市反彈嗰陣，TSLA 有冇反彈得更勁？
:::

## 5.3 RS 背馳

:::card 正面背馳（偏強）
QQQ 跌穿早上低位，但 TSLA 守住自己嘅 Higher Low。當大市止跌，TSLA 往往係最先突破嗰隻。
:::

:::card 負面背馳（偏弱）
QQQ 創新高，但 TSLA 升唔過早上高位。就算大市好，TSLA 嘅 Long 都要小心。
:::

## 5.4 點樣用

| 你想做 | 揀乜嘢環境 |
|---|---|
| Long | 大市偏強 + TSLA 比大市更強 |
| Short（進階） | 大市偏弱 + TSLA 比大市更弱 |
| 唔做 | TSLA 同大市互相矛盾，又冇新聞解釋 |

[[tool:rel-strength]]

:::warn RS 唔係入場訊號
相對強弱係 **Context**，幫你揀方向同揀股，唔代表而家就要入場。入場仍然要等你嘅 Setup 同 Trigger。
:::

[[quiz:l6-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c6', num: '6', title: '日內時段：開市、午市、收市前', mins: 7,
  summary: '成交量通常係 U 形：開市同收市最多，午市最少。唔同時段要用唔同期望，香港時間仲要顧及休息。',
  keywords: ['時段', 'U 形成交量', 'Lunch Lull', 'Power Hour', '香港時間'],
  md: `
## 6.1 時段表（美東 / 香港）

| 美東時間 | 香港（夏令） | 香港（冬令） | 特點 |
|---|---|---|---|
| 04:00–09:30 | 16:00–21:30 | 17:00–22:30 | Pre-market：量少、Spread 闊 |
| 09:30–10:00 | 21:30–22:00 | 22:30–23:00 | 開市：最快、最多假動作 |
| 10:00–11:30 | 22:00–23:30 | 23:00–00:30 | 早市趨勢：好多日內方向喺度確立 |
| 11:30–14:00 | 23:30–02:00 | 00:30–03:00 | 午市（Lunch Lull）：量少、容易上落 |
| 14:00–15:00 | 02:00–03:00 | 03:00–04:00 | FOMC 日 14:00 公布；午後重新活躍 |
| 15:00–16:00 | 03:00–04:00 | 04:00–05:00 | Power Hour：收市前大量交易 |

:::info 夏令時間
美國夏令時間一般由三月第二個星期日到十一月第一個星期日。香港冇夏令時間，所以兩地時差會由 12 小時變 13 小時。可以用 [[link:tools/timezone|🕐 美股時間換算]] 工具。
:::

## 6.2 U 形成交量

[[widget:l6-ushape]]

:::key 實際影響
- 同一個突破，喺 10:00 同喺 12:30，可靠程度可能好唔同。
- 午市量少，用 **RVOL at Time**（同時段比較）先公平。
- 好多交易者嘅規則係：午市唔開新倉，或者減半風險。
:::

## 6.3 香港交易者嘅現實

:::coach 教練補充：唔好用健康換交易
美股開市係香港夜晚。比較可持續嘅做法：
- 只做開市後頭 60–90 分鐘，之後瞓覺。
- 平日夜晚只觀察，週末用 Replay 練習。
- 仲讀緊書：唔好熬夜，平日用 Replay 同訓練場學習已經足夠。

**疲倦會直接影響判斷**，呢個係風險管理嘅一部分。
:::

[[quiz:l6-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c7', num: '7', title: '催化劑與事件日', mins: 9,
  summary: '業績、交付數字、CPI、FOMC 等事件會令波幅、Spread 同跳空風險大增。每朝檢查事件日曆，事前定好規則。',
  keywords: ['Catalyst', 'Earnings', 'CPI', 'FOMC', 'LULD', 'Halt'],
  md: `
## 7.1 有時間表嘅事件

| 事件 | 時間（美東） | 對 TSLA 嘅影響 |
|---|---|---|
| TSLA 季度業績 | 通常收市後公布 | 第二日大跳空，波幅極大 |
| TSLA 季度交付數字 | 通常每季開頭幾日 | 開市前後大幅波動 |
| CPI 通脹數據 | 08:30（開市前） | 影響整個大市開市方向 |
| 非農就業（NFP） | 通常每月第一個星期五 08:30 | 同上 |
| FOMC 利率決議 | 14:00，記者會 14:30 | 公布前靜、公布後急 |
| 期權到期 | 每星期五；每月第三個星期五較重要 | 有時令某啲價位附近特別「黐」 |

:::warn 日子同時間會變
以上係常見安排，實際日期以官方公布為準。每朝開市前用經濟日曆同公司公告檢查一次。
:::

## 7.2 冇時間表嘅事件

- 管理層喺社交媒體發言
- 監管消息、召回、訴訟
- 分析師升級／降級評級
- 突發宏觀消息

呢類事件**冇辦法預先避開**，所以 Stop 同倉位大細要一早預咗「突發」嘅可能。

## 7.3 Trading Halt 同 LULD

:::card Limit Up–Limit Down（LULD）
美股有價格波動區間機制：如果價格喺短時間內郁得太急、超出容許範圍，交易可能暫停（通常 5 分鐘）。大型股嘅區間一般係 5%，開市後同收市前一段時間會放寬。
:::

:::card News Pending Halt
公司有重大消息要公布時，交易所可以暫停交易直至消息發佈。暫停期間你**冇辦法平倉**，Stop 都唔會執行。
:::

## 7.4 事件日規則例子

:::steps
1. 每朝寫低今日事件同時間。
2. 重要數據公布前後 15 分鐘唔開新倉。
3. TSLA 業績／交付數字當日：只觀察，或者風險減半。
4. FOMC 日：14:00 前唔留倉。
5. 如果出現 Halt：記錄，唔好喺重開一刻衝動入場。
:::

[[tool:event-risk]]

[[quiz:l6-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c8', num: '8', title: '日類型：趨勢日、區間日、反轉日', mins: 9,
  summary: '大約 10:30 前，用 OR 闊度、VWAP 位置、RVOL 同 RS 估計今日日類型，再揀合適嘅 Playbook。',
  keywords: ['Day Type', 'Trend Day', 'Range Day', 'Reversal Day'],
  md: `
## 8.1 三種主要日類型

[[widget:l6-daytypes]]

| 特徵 | 趨勢日 | 區間日 | 反轉日 |
|---|---|---|---|
| VWAP | 有斜度，價格一直喺一邊 | 平，價格反覆穿越 | 早段一邊，之後穿過去另一邊 |
| 回調 | 淺、快 | 去到邊界就返轉頭 | 早段方向失敗 |
| 成交量 | 早段大，持續 | 平均或偏少 | 轉向時放大 |
| 收市 | 接近當日極端 | 接近中間 | 接近相反方向 |

## 8.2 10:30 前嘅早期線索

:::steps
1. **OR 闊度**：OR 好窄（細過平時）→ 有機會之後突破成趨勢日；OR 好闊 → 可能已經郁咗大部分。
2. **VWAP**：價格開市後 45 分鐘都冇返過 VWAP 另一邊 → 趨勢日機會高。
3. **RVOL**：比平時高好多 → 有事發生，波幅大。
4. **RS**：TSLA 同大市同方向而且更強 → 趨勢延續機會高。
:::

:::warn 估錯好正常
日類型係「機率」唔係「答案」。早上似趨勢日，下晝都可以變區間。重點係**一旦證據改變，就更新判斷**。
:::

## 8.3 配對 Playbook

| 日類型 | 適合 | 唔適合 |
|---|---|---|
| 趨勢日 | 順勢回調入場、突破 + 回測 | 摸頂摸底、逆勢反轉 |
| 區間日 | 區間邊界反轉（Level 3 Setup B） | 追突破 |
| 反轉日 | 假突破（Setup C）、VWAP 失守後回測 | 堅持早上嘅方向 |
| 唔清楚 | 只觀察 | 任何 Setup |

[[link:gym/daytype|🏋️ 去訓練場練「日類型辨識」]]

[[quiz:l6-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l6-c9', num: '9', title: '開市前報告、TSLA 綜合案例與測驗', mins: 10,
  summary: '將 Level 6 所有元素寫成一份 10 分鐘開市前報告，用一個完整 TSLA 模擬案例練習，最後完成 Level 6 測驗。',
  keywords: ['開市前報告', 'Game Plan', 'If-Then', '測驗'],
  md: `
## 9.1 十分鐘開市前報告

[[check:l6-premarket]]

## 9.2 If–Then 劇本

專業交易者唔係「預測」今日點走，而係寫好**幾個劇本**，等市場話你知係邊個。

:::card 例子（模擬）：TSLA 高開 1.8%，交付數字好過預期；QQQ 低開 0.6%
- **背景**：昨收 $384.90，PDH $386.20；Pre-market High $391.40、Low $388.60；日線阻力 $395。
- **劇本 A（Gap & Go）**：守住 $388.60 同 VWAP，09:45 後收市升穿 PMH $391.40，RS 繼續強 → 研究 Long，目標日線阻力前，Stop 喺回測低位下方。
- **劇本 B（Gap 失敗）**：跌穿開市價同 VWAP，返入 PDH 下方 → 唔做 Long；記錄 Gap & Trap。
- **劇本 C（拉鋸）**：喺 $388.60–$391.40 上落到 10:30 → 唔做，等午市後再評估或者收工。
- **事件**：今日 10:00 有經濟數據 → 09:45–10:15 唔開新倉。
:::

:::key 呢份報告點用？
開市後，你只需要做一件事：**認出而家係邊個劇本**。如果冇一個劇本出現，就係 No Trade。
:::

## 9.3 Level 6 測驗

[[quiz:l6-final]]

## 9.4 Level 6 畢業自我檢查

[[check:l6-grad]]

[[link:level/l7|➡️ 下一站：Level 7 進階交易管理]]
`},
  ],
});

/* ---------- Level 6 測驗、清單、詞彙 ---------- */
Object.assign(window.QUIZZES, {
'l6-c1': { title: '小測：Context', questions: [
  { q: '同一個 Breakout + Retest，點解結果可以差好遠？', options: ['因為圖表軟件唔同', '因為當日市場環境（趨勢、區間、事件）唔同', '因為 Setup 一定冇用'], answer: 1, explain: 'Setup 決定可唔可以入場，Context 決定值唔值得入場。' },
  { q: 'Setup 合格，但係逆大市、而且係 CPI 公布前 5 分鐘，最合理係？', options: ['正常風險入場', 'C 級：唔做，記錄落候選', '加大注碼'], answer: 1, explain: '多項 Context 唔利，就算 Setup 合格都唔值得做。' },
  { q: 'Level 6 最重要嘅能力係？', options: ['學更多指標', '有清晰理由講「今日唔適合」', '每日一定要交易'], answer: 1, explain: '進階嘅進步好多時係做少啲、做得好啲。' },
]},
'l6-c2': { title: '小測：多時間框架', questions: [
  { q: '5m 突破 $388，但日線阻力喺 $391.60，Entry $388.30、Stop $386.90。去到日線阻力最多約幾多 R？', options: ['約 1R', '約 2.4R', '約 5R'], answer: 1, explain: '(391.60 − 388.30) ÷ 1.40 ≈ 2.36R。' },
  { q: '「細圖搵入場，大圖搵______」', options: ['指標', '位置', '新聞'], answer: 1, explain: '大時間框架嘅重要位置優先過細時間框架嘅訊號。' },
  { q: '日線升勢、15m 升勢、5m 正在回調，最合理係？', options: ['即刻 Short', 'WAIT：等 5m 回調完、轉返向上', '唔理 5m，即刻買'], answer: 1, explain: '大方向一致，等細圖出現執行訊號。' },
  { q: '入場之後轉去 1 分鐘圖，見到大紅燭就平倉，問題係？', options: ['冇問題，愈快愈好', '用咗唔同時間框架「搵理由」，冇跟入場時嘅規則', '應該轉去日線圖'], answer: 1, explain: '管理交易要用入場時嘅時間框架同事前規則。' },
]},
'l6-c3': { title: '小測：Gap', questions: [
  { q: '昨收 $384.90，今開 $389.80，Gap 約係？', options: ['+0.5%', '+1.27%', '+4.9%'], answer: 1, explain: '(389.80 − 384.90) ÷ 384.90 ≈ 1.27%。' },
  { q: '「缺口一定會補」呢句說話點睇？', options: ['定律', '唔一定，要用自己數據驗證', '永遠唔會補'], answer: 1, explain: 'Gap Fill 係常見劇本之一，唔係定律。' },
  { q: '以下邊個係 Gap 失敗嘅常見警號？', options: ['守住 VWAP', '跌穿開市價同 VWAP', '升穿 PMH'], answer: 1, explain: '開市追高嘅人被困，賣壓可能加大。' },
  { q: '點解 Pre-market 高低位要配合成交量睇？', options: ['因為 Pre-market 量少，一兩張單就可以造出高低位', '因為 Pre-market 冇價格', '唔使理成交量'], answer: 0, explain: '量少嘅位置參考價值較低。' },
]},
'l6-c4': { title: '小測：Opening Range', questions: [
  { q: '15 分鐘 Opening Range 係指？', options: ['開市後 09:30–09:45 嘅最高同最低位', '昨日收市前 15 分鐘', 'Pre-market 頭 15 分鐘'], answer: 0, explain: 'ORH / ORL 係當日第一個重要區域。' },
  { q: '開市衝高，好快被打返轉頭，跌穿開市價，屬於？', options: ['Open-Drive', 'Open-Rejection-Reverse', 'Open-Auction'], answer: 1, explain: '開市嗰邊嘅方向被市場拒絕。' },
  { q: 'OR 闊度超過日 ATR 一半，ORB 最合理做法？', options: ['加大注碼', '風險太大，降注碼或者唔做', 'Stop 唔使設'], answer: 1, explain: 'Stop 要放好遠，每股風險太大。' },
]},
'l6-c5': { title: '小測：相對強弱', questions: [
  { q: 'QQQ −0.5%，TSLA +2.3%（同一起點），代表？', options: ['TSLA 相對弱', 'TSLA 明顯相對強勢', '冇意義'], answer: 1, explain: '大市跌、TSLA 升 = 相對強勢。' },
  { q: 'QQQ +1%，TSLA +1%，考慮到 TSLA 波幅通常較大，點解讀？', options: ['TSLA 偏強', 'TSLA 可能偏弱', '完全一樣'], answer: 1, explain: '按 Beta，TSLA「應該」升多啲。' },
  { q: '相對強弱係？', options: ['入場訊號', 'Context，用嚟揀方向同揀股', '止蝕工具'], answer: 1, explain: '入場仍然要等 Setup 同 Trigger。' },
]},
'l6-c6': { title: '小測：時段', questions: [
  { q: '美東 09:30 喺香港夏令期間係幾點？', options: ['20:30', '21:30', '22:30'], answer: 1, explain: '夏令時差 12 小時；冬令 13 小時（22:30）。' },
  { q: '典型日內成交量分佈係？', options: ['平均分佈', 'U 形：開市同收市多，午市少', '午市最多'], answer: 1, explain: '所以要用同時段 RVOL 比較。' },
  { q: '午市突破可靠程度較低，常見規則係？', options: ['加大注碼', '唔開新倉或者減半風險', '只用 1 分鐘圖'], answer: 1, explain: '量少容易假突破。' },
]},
'l6-c7': { title: '小測：事件日', questions: [
  { q: 'TSLA 業績通常喺幾時公布？', options: ['開市中', '通常收市後', '星期六'], answer: 1, explain: '所以第二日開市經常大跳空。' },
  { q: 'Trading Halt 期間，你嘅 Stop 會點？', options: ['照常執行', '冇辦法執行，要等恢復交易', '自動取消倉位'], answer: 1, explain: '暫停期間冇成交。' },
  { q: 'FOMC 14:00 公布，合理規則係？', options: ['13:59 入場博方向', '公布前唔留倉，公布後等市場穩定先評估', '完全唔理'], answer: 1, explain: '公布前後波幅同 Spread 都會急變。' },
]},
'l6-c8': { title: '小測：日類型', questions: [
  { q: '開市後 45 分鐘價格一直喺上升嘅 VWAP 上方、回調好淺，較似？', options: ['趨勢日', '區間日', '反轉日'], answer: 0, explain: '趨勢日特徵：VWAP 有斜度，價格一直喺一邊。' },
  { q: '區間日最唔適合邊種做法？', options: ['區間邊界反轉', '追突破', '只觀察'], answer: 1, explain: '區間日突破好多時係假突破。' },
  { q: '早上判斷係趨勢日，下晝跌穿 VWAP 並守唔返，應該？', options: ['堅持早上判斷', '更新判斷，日類型可能變咗', '加倉'], answer: 1, explain: '日類型係機率，證據改變就要更新。' },
]},
'l6-final': { title: 'Level 6 測驗：市場環境', final: true, questions: [
  { q: 'Setup 合格但 Context 中性（大市冇方向、TSLA RS 一般），按 A+/B/C 分級應該？', options: ['A+：正常風險', 'B：減半風險或者只做 Paper', 'C：一定唔做'], answer: 1, explain: '有一兩項 Context 中性 = B 級。' },
  { q: '以下邊個最能說明「大時間框架位置優先」？', options: ['1m 出現 Hammer 就入場', '5m 突破但撞正日線阻力，目標要設喺阻力之前', '只睇日線'], answer: 1, explain: '細圖搵入場，大圖搵位置。' },
  { q: 'TSLA 高開 +2%，有交付數字新聞，開喺 PDH 上方，開市後守住 VWAP 並升穿 PMH，較似？', options: ['Gap & Go', 'Gap Fill', '區間日'], answer: 0, explain: '有新聞、喺區間外、守住 VWAP、升穿 PMH。' },
  { q: '開市頭 5 分鐘對新手最大問題係？', options: ['冇成交量', 'Spread 闊、滑價大、假動作多', '冇價格'], answer: 1, explain: '新手可以先觀察、記錄 OR。' },
  { q: 'QQQ 跌穿早上低位，TSLA 守住 HL，代表？', options: ['TSLA 正面背馳（相對強）', 'TSLA 一定會跌', '冇分別'], answer: 0, explain: '大市止跌時 TSLA 可能最先突破。' },
  { q: '12:45（美東）出現一個突破，成交量只係開市時嘅三分一，應該點評估？', options: ['同開市一樣', '用 RVOL at Time 同時段比較，並考慮午市規則', '成交量少 = 一定假突破'], answer: 1, explain: '午市量本身就少，要公平比較。' },
  { q: '今日 08:30 有 CPI，TSLA 開市後波幅極大，你嘅規則係事件日風險減半，你應該？', options: ['照規則減半風險', '既然波幅大，加大注碼', '改規則'], answer: 0, explain: '事前規則就係為呢啲時刻而設。' },
  { q: '開市前報告最主要嘅用途係？', options: ['預測今日收市價', '寫好幾個 If–Then 劇本，開市後認出係邊個', '證明自己啱'], answer: 1, explain: '冇一個劇本出現，就係 No Trade。' },
]},
});
Object.assign(window.CHECKLISTS, {
'l6-premarket': { title: '十分鐘開市前報告', resettable: true, items: [
  '大市：QQQ / SPY Pre-market 升定跌？期貨方向？',
  '事件：今日有冇經濟數據、FOMC、TSLA 公告？時間寫低',
  'TSLA 新聞：有冇催化劑？Gap 幾多 %？相對 ATR 大定細？',
  '日線：趨勢方向、最近擺動高低位、上方阻力同下方支持',
  '日內位置：PDH、PDL、昨收、PMH、PML',
  'Gap 分類：喺昨日區間內定外？有冇量？',
  '劇本 A / B / C：每個都有觸發條件、失效條件、目標',
  '今日最大風險同最多交易次數（例如 2 筆）',
  '自己狀態：瞓得夠唔夠？情緒點？（唔好就只觀察）',
]},
'l6-grad': { title: 'Level 6 畢業自我檢查', items: [
  '可以講出 Context 嘅五層',
  '識用日線、15m、5m 做 Top-down 分析',
  '可以將 Gap 分類，並講出四種常見劇本',
  '識畫 Opening Range，分辨四種開市模式',
  '識計 TSLA 對 QQQ 嘅相對強弱',
  '知道唔同時段嘅特點同香港時間',
  '每朝會檢查事件日曆，並有事件日規則',
  '可以喺 10:30 前講出今日較似邊種日類型',
  '每個交易日都寫開市前報告同 If–Then 劇本',
]},
});
window.GLOSSARY.push(
  { term: 'Context', zh: '市場環境／背景', def: '大市、同類股、個股新聞、時段、日類型等，決定一個 Setup 值唔值得做。', lv: 'l6' },
  { term: 'Multi-Timeframe', zh: '多時間框架', def: '用大時間框架定方向同位置，細時間框架負責執行。', lv: 'l6' },
  { term: 'Top-down Analysis', zh: '由上而下分析', def: '由日線 → 15m → 5m 逐層分析。', lv: 'l6' },
  { term: 'Gap', zh: '跳空／缺口', def: '今日開市價同昨日收市價之間嘅差距。', lv: 'l6' },
  { term: 'Gap & Go', zh: '缺口延續', def: '跳空之後繼續向同一方向走。', lv: 'l6' },
  { term: 'Gap Fill', zh: '回補缺口', def: '跳空之後價格返回昨日收市價附近。', lv: 'l6' },
  { term: 'Pre-market High / Low', zh: '盤前高位／低位（PMH / PML）', def: '開市前交易嘅最高同最低位，量少時參考價值較低。', lv: 'l6' },
  { term: 'Opening Range', zh: '開市區間', def: '開市後固定時間（例如 15 分鐘）嘅最高位（ORH）同最低位（ORL）。', lv: 'l6' },
  { term: 'ORB', zh: '開市區間突破', def: 'Opening Range Breakout：價格突破 ORH / ORL 嘅策略。', lv: 'l6' },
  { term: 'Open-Drive', zh: '開市直衝', def: '開市後一面倒向一個方向，幾乎冇回頭。', lv: 'l6' },
  { term: 'Relative Strength', zh: '相對強弱', def: '個股升跌幅減大市升跌幅（同一起點）。', lv: 'l6' },
  { term: 'Beta', zh: '貝他系數', def: '個股相對大市嘅波動程度，大過 1 = 波幅比大市大。', lv: 'l6' },
  { term: 'QQQ', zh: '納指 100 ETF', def: '追蹤 Nasdaq-100 嘅 ETF，常用嚟代表科技股大市。', lv: 'l6' },
  { term: 'Lunch Lull', zh: '午市淡靜', def: '美東約 11:30–14:00，成交量較少、容易上落。', lv: 'l6' },
  { term: 'Power Hour', zh: '收市前一小時', def: '美東 15:00–16:00，成交量再次增加。', lv: 'l6' },
  { term: 'Catalyst', zh: '催化劑', def: '令股價大幅郁動嘅消息，例如業績、交付數字、經濟數據。', lv: 'l6' },
  { term: 'FOMC', zh: '聯儲局議息會議', def: '公布利率決定，通常美東 14:00，記者會 14:30。', lv: 'l6' },
  { term: 'CPI', zh: '消費物價指數', def: '通脹數據，通常美東 08:30 公布，影響開市方向。', lv: 'l6' },
  { term: 'LULD', zh: '漲跌幅限制機制', def: 'Limit Up–Limit Down：價格短時間郁得太急可能觸發交易暫停。', lv: 'l6' },
  { term: 'Trading Halt', zh: '停牌／交易暫停', def: '交易所暫停某股票交易；期間 Stop 都唔會執行。', lv: 'l6' },
  { term: 'Trend Day', zh: '趨勢日', def: '開市附近係一個極端、收市附近係另一個極端，價格一直喺 VWAP 一邊。', lv: 'l6' },
  { term: 'Range Day', zh: '區間日', def: 'VWAP 平，價格反覆穿越，去到邊界就返轉頭。', lv: 'l6' },
  { term: 'Reversal Day', zh: '反轉日', def: '早段方向失敗，之後轉向另一邊。', lv: 'l6' },
  { term: 'If-Then Plan', zh: '如果－就 劇本', def: '開市前寫好幾個劇本同觸發條件，開市後認出係邊個。', lv: 'l6' },
);
