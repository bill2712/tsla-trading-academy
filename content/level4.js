/* Level 4：專業交易執行與風險管理 */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: 'l4',
  code: 'Level 4',
  title: '交易執行與風險管理',
  subtitle: 'Trade Execution, Position Sizing, Risk Management & Trading System Development',
  icon: '🛡️',
  color: '#7c3aed',
  question: '點樣執行及限制風險？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l4-c1', num: '1', title: '從分析到執行', mins: 6,
  summary: '分析正確 ≠ 交易正確。一份完整 Trade Plan 要有十個部分，連「取消條件」都要寫。',
  keywords: ['Trade Plan', 'Execution Quality', 'Order Cancellation'],
  md: `
:::info 教學對象
已完成 Level 1–3｜主要使用 TSLA 5-minute Chart｜以約 US$10,000 模擬本金為例。本課程屬教育及模擬用途，不構成個人投資建議。TSLA 例子均為假設行情；真實交易可能發生跳空、滑價、流動性不足、訂單未成交甚至超出預計止損嘅損失。
:::

Level 3，你開始建立三套 Trading Setups：Breakout + Retest、Support / Resistance Reversal、Failed Breakout / Breakdown。**Level 4 係由技術分析進入真正嘅交易執行。**

假設你分析 TSLA 正確，睇到 Breakout + Retest，亦等到確認訊號。但究竟應該買幾多股？用 Market 定 Limit Order？Stop Loss 放邊？跌穿止損後券商一定能夠執行嗎？升咗 1R 應該點做？連續輸五次又應該點算？你仲需要識得判斷：一套策略究竟真係有統計優勢，定只係因為你挑選咗啲漂亮嘅歷史圖表？

:::steps
1. **Setup → Entry → Position Size → Order Execution**
2. **Stop Loss → Trade Management → Exit**
3. **Journal → Backtesting → Strategy Evaluation**
:::

## 1.1 先理解一個重要分別：分析正確，唔代表交易一定賺錢

例如你分析 TSLA 喺 $385 突破阻力，認為可能向 $390 上升，之後 TSLA 真係升到 $390 —— 你估中咗方向。但你實際交易可能係：$389 先追入，Stop Loss 放 $384，Target $390。即係每股承擔 **$5** 嘅計劃風險，只為爭取 **$1** 潛在利潤。就算最後賺錢，亦唔代表呢個交易決策合理。

同樣地，你亦可能 $385.50 入場、Stop $384.50、Target $388.50，最後價格跌到 $384.50 止損離場。你輸咗錢，但交易可能**完全符合原定規則**。

| 評估層面 | 問題 |
|---|---|
| Analysis Quality | 分析有冇客觀依據？ |
| Execution Quality | 有冇按照事前定義嘅規則執行？ |

短期結果唔一定可以證明兩者好壞。

## 1.2 一個完整 Trade Plan 要有十個部分

| 項目 | 模擬 TSLA 例子 |
|---|---|
| Symbol | TSLA |
| Timeframe | 5m |
| Market Bias | 15m Uptrend |
| Setup | Breakout + Retest |
| Key Level | $385 Resistance |
| Entry Trigger | 確認 K 線高位上方 $386.10 |
| Stop Loss | $384.70 |
| Target | $388.90 |
| Position Size | 根據本金及止損距離計算 |
| Invalidation / Cancellation | 回測失敗，或者未入場前已不符合條件 |

你必須區分兩種情況：

- **Trade Invalidation**：已經入場後，原本交易假設受到破壞。
- **Order Cancellation**：仲未入場，但 Setup 已失效，所以取消未成交嘅入場訂單。

例如 TSLA 未到你嘅 Entry Trigger，就已經跌穿重要支持。你唔應該繼續留住原本未成交嘅 Buy Stop，等佢日後意外觸發。

:::key Level 4 最重要嘅原則之一
每張未成交訂單，都應該有明確嘅**取消條件**，而唔係只關心已成交持倉。
:::

[[tool:trade-plan]]

[[quiz:l4-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c2', num: '2', title: 'Bid / Ask / Spread / Slippage', mins: 7,
  summary: '你見到嘅價格，未必係你真正成交嘅價格。Spread 同滑價點樣食掉你嘅 R。',
  keywords: ['Bid', 'Ask', 'Spread', 'Slippage', 'Order Book'],
  md: `
呢章係初學者經常完全冇學過，但實際交易非常重要嘅知識。

## 2.1 股票點解會有三種價格？

| Bid | Last | Ask |
|---|---|---|
| **$386.02** | **$386.05** | **$386.08** |
| 最高顯示買價 | 最近成交價 | 最低顯示賣價 |

**Bid–Ask Spread = Ask − Bid = $0.06**

- **Bid**：目前市場上有人願意出價買入嘅最高顯示價格。
- **Ask**：有人願意賣出嘅最低顯示價格。
- **Last**：最近一宗成交嘅價格。

當你用 Market Buy Order，通常會同 **Ask** 側嘅賣盤成交，而唔係保證按照 Last 買入。用 Market Sell Order，則通常會同 **Bid** 側嘅買盤成交。實際成交仲會受到訂單數量、交易所報價同市場變動影響。

## 2.2 Spread 對 Day Trading 有幾大影響？

如果你以 $386.08 買入，然後立即以 $386.02 賣出：每股價格損失 $0.06。假設 100 股：100 × 0.06 = **$6**，仲未計佣金及其他費用。

如果你做嘅係每股只打算賺 $0.20 嘅 Scalping，$0.06 Spread 已經相當於潛在目標嘅 **30%**。而且你可能唔止遇到 Spread，仲可能遇到 Slippage。

[[tool:spread]]

## 2.3 Slippage —— 滑價究竟係乜？

假設 TSLA 正在快速向上，你原本計劃 Entry = $386.10，但當你落單時，市場已經升到 $386.27，最後以 $386.27 成交。你比預計入場價高咗 $0.17 —— 呢個就係相對原計劃嘅不利成交偏差。

如果 Stop 保持 $384.70：原本每股風險 $1.40 → 實際 **$1.57**。Target 仍然 $388.90：原本潛在回報 $2.80 → 實際 **$2.63**。Reward / Risk 由 **2.0 降至約 1.68**。同一個 Setup，成交價唔同，交易質素就會改變。

[[tool:slippage]]

## 2.4 點解 Volume 好大都可能出現 Slippage？

因為 Volume 反映某段時間**已經發生**嘅成交總量。但你落單嘅嗰一刻，最接近市場價嘅掛單未必有足夠數量滿足你嘅 Order。

[[tool:orderbook]]

實際美股仲有多個交易場所同更複雜嘅流動性來源，所以上面只係簡化說明。美國 SEC 對訂單執行嘅官方解釋亦指出，Market Order 唔保證價格，並可能因為流動性而出現多個成交價。

:::key 第二章核心
你以後唔應該只研究：「TSLA 係咪會由 $385 升到 $390？」
仲要研究：「**我實際買得到乜價？賣得到乜價？成交成本會唔會食咗大部分潛在利潤？**」
:::

[[quiz:l4-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c3', num: '3', title: 'Market、Limit、Stop Orders', mins: 8,
  summary: '四種基本 Order 嘅真正風險、Time in Force，同一個互動「跳價模擬器」。',
  keywords: ['Market Order', 'Limit Order', 'Stop Order', 'Stop-Limit', 'DAY', 'GTC', 'RTH'],
  md: `
你日後使用 IBKR，最需要先掌握四種基本 Order。

## 3.1 Market Order（市價單）

意思係你希望盡快以市場可得價格成交。假設 TSLA Ask = $386.08，你提交 Market Buy 17 股。如果市場流動性正常，可能接近當時 Ask 成交；但如果股價突然跳升，實際成交價可能更高。

- **優點**：通常較容易成交。
- **缺點**：成交價格唔保證。

唔建議初學者喺突然暴升、重要消息公布或者極闊 Spread 嘅時候，直接用 Market Order 追價。

## 3.2 Limit Order（限價單）

假設 TSLA Ask = $386.08，你只願意最高出 $386.00 買入，可以提交 **Buy Limit $386.00**。意思係只有當市場可以按照 $386.00 或更低價格成交，你嘅買單先有機會執行。但即使市場曾經成交 $386.00，亦唔代表你張單一定成交，因為可能有其他訂單排喺前面。

- **優點**：限制可接受成交價格。
- **缺點**：可能無法成交。

## 3.3 Stop Order（觸發單）

Stop Order **唔一定係止損**。可以分成：

- **Buy Stop**：通常設定喺現價以上，適合某些突破觸發情境。
- **Sell Stop**：通常設定喺現價以下，可用於 Long Position 嘅止損。

假設 TSLA 而家 $385.80，你希望價格突破 $386.10 先入場，可以研究使用 Buy Stop $386.10。當觸發條件成立，標準 Stop Market Order 會變成 Market Order —— 但唔保證最後以 $386.10 成交。

同樣地，假設你已經 Long TSLA（Entry $386.10，Sell Stop $384.70），若價格觸發 $384.70，Stop Market Order 會嘗試以市場可得價格沽出。如果市場快速跌穿，實際可能係 $384.60、$384.30，甚至更低。SEC 對 Stop Order 嘅說明清楚指出：**Stop Price 係觸發條件，而唔係成交價格保證。**

## 3.4 Stop-Limit Order（止損限價單）

假設你持有 TSLA，設定 Sell Stop = $384.70、Sell Limit = $384.50。當 Stop 被觸發後，就會產生一張最低接受 $384.50 嘅 Sell Limit Order。

如果 TSLA 急速由 $384.80 跳到 $383.90，市場已經冇人願意按 $384.50 或以上買入，你嘅 Sell Limit **可能完全無法成交**。即係你原本打算限制損失，但最後可能仍然持有一個持續下跌嘅倉位 —— 呢個係 Stop-Limit 嘅主要風險。

[[tool:order-sim]]

## 3.5 四種 Order 快速比較

| Order | 優先考慮 | 最大問題 |
|---|---|---|
| Market | 成交速度 | 不能保證價格 |
| Limit | 成交價格界線 | 不能保證成交 |
| Stop Market | 到達觸發價後嘗試執行 | 可能嚴重滑價 |
| Stop-Limit | 觸發後限制成交價 | 可能完全無法離場 |

:::key 記住
唔存在一種 Order 能夠**同時保證即時成交及理想價格**。
:::

## 3.6 Time in Force（訂單有效期）

| 設定 | 意思 | 初學者注意 |
|---|---|---|
| DAY | 通常當日有效 | 適合當日交易計劃，但要核對交易時段 |
| GTC | Good Till Cancelled，持續有效至取消或券商到期 | 舊訂單可能日後意外觸發 |
| IOC | Immediate or Cancel | 即時可成交部分先成交，其餘取消 |
| RTH | Regular Trading Hours | 訂單是否容許喺正常交易時段外生效 |

你要特別分清楚：**DAY 唔等於「保證收市前幫你平倉」**。DAY 只係訂單有效期設定。如果你想做真正 Day Trading，不持倉過夜，需要另外設立收市前平倉規則。

盤前、盤後是否支援某類 Stop Order、是否可觸發，都要根據券商及產品規則確認，唔可以假設所有訂單喺 Extended Hours 同正常時段有一樣行為。

[[quiz:l4-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c4', num: '4', title: 'Bracket Order 與 IBKR', mins: 6,
  summary: '一次過預先安排 Entry、Stop、Target；五個最常見陷阱。',
  keywords: ['Bracket Order', 'OCO', 'Parent Order', 'Profit Taker', 'IBKR'],
  md: `
如果你已經識得設定 Entry、Stop、Target，下一步就係學習 Bracket Order。呢個對初學者特別值得研究。

## 4.1 Bracket Order 係乜？

一組基本 Long Bracket 通常包含**三張互相關聯嘅訂單**：

:::bracket
:::

一邊按設定觸發及成交後，系統會嘗試取消另一邊。仍要核對訂單狀態、部分成交、連線及平台執行限制。IBKR 官方課程有介紹 Bracket Orders，包含 Parent Order、Profit Taker 同 Stop Loss，以及相關子訂單嘅取消關係。

## 4.2 IBKR Desktop 點樣設定？

以下係一般學習流程，實際介面可能因平台版本、帳戶及產品而不同。

:::steps
1. 先切換到 **Paper Trading**。
2. 選擇 TSLA，同確認正確股票及交易所。
3. 建立 BUY Parent Order。
4. 設定 Quantity、Order Type 同入場價。
5. 喺 Attached Orders 加入 Profit Taker 同 Stop Loss。
6. 設定各自價格、有效期及交易時段。
7. Preview 全部訂單，確認方向及數量。
8. 提交前核對是否三張相關訂單。
9. 提交後檢查狀態，而唔係假設全部已生效。
:::

官方教學可以喺 IBKR Campus 搜尋「IBKR Desktop — Bracket Orders」；如果你使用 TWS Mosaic，對應官方教學係「Bracket Orders for TWS Mosaic」。

## 4.3 Bracket Order 最重要嘅陷阱

| # | 陷阱 | 你要做乜 |
|---|---|---|
| 1 | **Parent 未成交** | Stop 同 Target 未必已經係保護持倉嘅有效訂單 |
| 2 | **Parent 只成交部分股數**（例如想買 17 股，暫時只成交 8 股） | 檢查相關 Exit Orders 嘅實際數量及狀態 |
| 3 | **手動平倉，但舊 Exit Orders 仲存在** | 檢查 Stop / Target 有冇被正確取消，避免日後意外產生新倉位 |
| 4 | **修改止損後，冇確認平台接受修改** | 畫面顯示新價格，唔代表新 Order 一定已經提交及生效 |
| 5 | **Profit Taker 同 Stop Loss 嘅交易時段設定唔同** | 例如一張只喺 RTH 生效，另一張容許 Extended Hours，實際保護範圍會唔同 |

:::warn 記住
Bracket Order 幫助你安排訂單，但**唔係盈利或者最大虧損保證**。
:::

:::coach 教練補充：Paper Trading「消防演習」
喺 Paper 帳戶做一次「演習」：開一個 Bracket → 故意手動平倉 → 檢查剩低嘅 Order 有冇自動取消 → 再試一次部分成交（例如用好遠嘅 Limit）。真錢之前做過一次，你就唔會喺市場急跌時先學點取消訂單。
:::

[[quiz:l4-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c5', num: '5', title: 'Position Sizing', mins: 9,
  summary: '由「如果錯咗要輸幾多」倒推股數，再加滑價緩衝同費用。內有完整風險計算器。',
  keywords: ['Position Sizing', 'Risk Budget', 'Slippage Buffer', 'Account Equity'],
  md: `
真正有經驗嘅交易者，唔會只問：「我覺得 TSLA 會升，買 10 股定 100 股？」而係會先問：「**如果我判斷錯，呢筆交易按照計劃需要承擔幾多風險？**」然後倒轉計算股數。

## 5.1 你要分清楚三個概念

| 名稱 | 意思 |
|---|---|
| Account Equity | 帳戶總權益，例如 $10,000 |
| Position Value | 你持有股票嘅市值，例如 $6,500 |
| Planned Trade Risk | 由 Entry 到 Stop 嘅預計損失，例如 $25 |

呢三樣唔係同一回事。你買入約 $6,500 TSLA，唔代表你每次交易都打算輸 $6,500。但同時，計劃止損只係降低風險嘅措施，**唔保證最大損失只有 $25**。如果發生跳空、停牌、急速流動性消失，實際損失可能大很多。

## 5.2 第一個公式：每股計劃風險

$$ Risk Per Share = Entry − Stop = 386.10 − 384.70 = $1.40 $$

買一股，計劃虧損 $1.40；十股 $14；一百股 $140。股數越大，絕對風險越大。

## 5.3 第二個公式：設定 Risk Budget

| 每筆風險預算 | 金額（本金 $10,000） |
|---|---|
| 0.25% | $25 |
| 0.50% | $50 |
| 1.00% | $100 |

呢啲係示範用嘅風險比例，唔係公認安全標準。對初學者，以 0.25% 作為第一輪練習假設，方便控制模擬虧損幅度同觀察系統表現。

## 5.4 第三個公式：計算股數

$$ Shares = ⌊ Risk Budget ÷ Risk Per Share ⌋ = ⌊ 25 ÷ 1.40 ⌋ = 17 股 $$

所需買入本金：17 × 386.10 = **$6,563.70**；計劃止損虧損：17 × 1.40 = **$23.80**。呢個係未計交易成本及滑價嘅版本。

## 5.5 加入 Slippage 後，結果會唔同

假設原本 Stop $384.70，但價格快速跌穿，最終只能以 $384.40 沽出。實際每股價格損失變成 386.10 − 384.40 = **$1.70**；17 股 = $28.90；再加佣金及其他費用 $2 → 總虧損 **$30.90**，已經超出原定 $25 風險預算。

:::key 結論
Position Size 應該考慮合理嘅成交成本與滑價情境，而唔係只用理想止損價計算。
:::

$$ 估計每股損失 = Entry − Stop + Slippage Buffer $$
$$ Shares = ⌊ (Risk Budget − 估計費用) ÷ 估計每股損失 ⌋ $$

呢個仍然只係預算方法，唔係最壞情況保證。

## 5.6 點解唔應該每次都用盡本金？

本金 $10,000，TSLA 現價 $386，全部用嚟買大約可買 25 股整股。但問題唔止係止損，仲有：

- 單一股票佔據接近全部資金。
- 價格急速變動可能令實際虧損高於計劃。
- 冇足夠可用現金處理其他交易。
- 帳戶可能涉及未結算資金、匯兌或費用。
- 如果使用 Margin，實際槓桿風險更高。

所以 Position Sizing 應該**同時符合**：風險預算上限、可用現金上限、你自己設定嘅最大持倉集中度。

## 5.7 互動練習：Day Trading Risk Calculator

[[tool:possize-pro]]

:::tip 練習題
1. 風險預算 0.25%。
2. 改成 0.50%。
3. 將 Stop 由 $384.70 改成 $383.70。

你應該發現：**止損距離越遠，在同一風險預算之下，可持有股數通常越少**。但如果受本金上限限制，即使風險預算增加，股數亦未必再增加。
:::

[[quiz:l4-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c6', num: '6', title: 'Stop Loss 深度分析', mins: 8,
  summary: 'Wick 下方定 Support 下方？硬性止損 vs 收市止損、ATR 嘅正確用法、點解唔好移遠 Stop。',
  keywords: ['Wick Stop', 'Close Stop', 'ATR', '移 Stop'],
  md: `
你可能會問：「如果我買喺 $385，止損放 $384.50，但 TSLA 經常上下震盪 $1，咪成日被掃走？」問題唔一定係你用錯止損，可能係：

- 止損放喺正常價格波動範圍內。
- 你嘅 Entry 太接近重要障礙。
- 你使用嘅交易策略本身唔適合當時波幅。
- 你將細小 5m Swing 當成重要結構。
- 你設定止損只考慮可承受金額，冇考慮 Price Action。

## 6.1 第一個原則：先決定失效位置，再決定股數

假設 TSLA Support Zone：$384.80–$385.20；回測低位：$384.65。你研究 Breakout + Retest Long。如果價格持續跌返整個區域下方，你原本嘅 S/R Flip 假設就可能失效。Stop 可以考慮設喺結構低位下方嘅合理位置，再考慮一定波動緩衝。

但唔應該：「我只想每股輸 $0.30，所以 Stop 放 Entry 減 $0.30。」當技術上需要較遠 Stop，但你接受唔到，就應該**減少股數或者放棄 Setup**。

## 6.2 三種止損方法

| 止損類型 | 根據乜設定 | 適用情境 |
|---|---|---|
| Structure Stop | Swing Low / Swing High | 趨勢及回調交易 |
| Zone Invalidation Stop | 支持／阻力區是否失守 | Breakout + Retest |
| Volatility-Based Stop | ATR 等波幅參考 | 波幅較大或需緩衝嘅情境 |

## 6.3 Wick Stop 定 Candle Close Stop？

假設你買入 TSLA，Stop 參考水平係 $384.70。

| | A：價格觸及即離場 | B：等 5m 收市低於先離場 |
|---|---|---|
| 做法 | Sell Stop Market，符合觸發條件即執行 | 例如短暫跌到 $384.60 但收 $385.30，唔當失效 |
| 好處 | 唔需要等 5 分鐘，條件易界定 | 唔容易被短暫下影線掃走 |
| 問題 | 可能被短暫 Wick 觸發，之後再反彈 | 如果快速跌到 $382，要等收市先處理，虧損可能大增 |

因此 Candle Close Stop 係一種**策略判斷規則**，唔等於有實際訂單保障嘅硬性止損。對初學者，建議先研究有明確價格觸發嘅硬性風險規則，再將收市確認用於 Setup、入場或者非緊急退出分析，而唔係用佢代替全部風險控制。

## 6.4 點解唔應該見到 Wick 就立即將 Stop 移遠？

你原本 Stop $384.70，TSLA 一度跌到 $384.75，你覺得「就快俾人掃走」，於是改到 $384；之後又跌到 $384.10，你再改到 $383。到最後原本每股計劃風險 $1.40，可能變成 **$3.10** —— 你已經唔係跟策略，而係不斷希望市場反彈。

:::warn 規則
止損**唔應該**因為價格接近就臨時向不利方向移動。如果回測發現 Stop 經常太近，應該喺交易後分析，下一輪策略測試再正式調整規則。
:::

## 6.5 ATR 可以點協助？

ATR = Average True Range，用嚟衡量平均價格波動幅度。假設 TSLA 5m ATR = $0.90，你原本 Stop 距離 Entry 只有 $0.20 —— 可以理解為止損距離相對近期典型 K 線波幅可能非常細，容易受到正常震盪影響。

但 ATR 唔代表下一支 K 線一定波動 $0.90，亦唔代表止損應自動設為 1× ATR。比較合理嘅用法：**先利用 Market Structure 確定技術失效位置，再用 ATR 評估止損距離是否過度貼近正常波動。**

[[tool:atr-check]]

## 6.6 最重要：Stop Loss 唔可以保證最大損失

Entry $386、Stop $384，你預計只輸每股 $2。但 TSLA 因重大消息急跌，下一個可成交價係 $380。即使 Stop Market 被觸發，實際成交可能接近 $380，每股損失變成 **$6**。如果使用 Stop-Limit，則有可能完全賣唔出。

:::key 風險控制必須包含
Position Size + Stop Plan + 滑價風險 + 事件風險 + 每日虧損上限。**單靠一張 Stop Order 唔夠。**
:::

[[quiz:l4-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c7', num: '7', title: 'Take Profit 與出場規則', mins: 7,
  summary: 'Fixed Target、Partial、Break-even、Trailing 四種方法比較，同正確測試次序。',
  keywords: ['Fixed Target', 'Partial Exit', 'Break-even Stop', 'Trailing Stop'],
  md: `
假設你買入 TSLA：Entry $385、Stop $384，每股風險 $1 即 1R。股價向上升到 $386.50，你已經有 +1.5R 浮動盈利。應該立即止賺？等 $387？還是移動 Stop？**呢個唔應該臨場靠情緒決定。**

## 7.1 方法 A：Fixed Target

事前設 Entry $385、Stop $384、Target $387 → Risk $1，Reward $2，目標 = 2R。到達 Target 按原定規則平倉，觸發 Stop 就離場。

- **優點**：簡單，容易回測。
- **缺點**：價格可能一度升到 +1.8R，之後回落到 Stop，結果變成 −1R。呢個唔代表方法錯，而係固定目標策略本身會面對嘅結果。

## 7.2 方法 B：Partial Take Profit

買入 20 股，10 股到 1R 止賺，10 股到 2R 止賺：

$$ 兩邊都成交：0.5(1R) + 0.5(2R) = 1.5R $$
$$ 第一半到 1R，第二半跌返原本 Stop：0.5(1R) + 0.5(−1R) = 0R $$

分批止賺可能降低回吐，但亦可能降低大行情嘅平均回報。佢**唔係必然更好**。

[[tool:partial-tp]]

## 7.3 方法 C：Break-even Stop

Entry $385、Stop $384，價格升到 $386（+1R），你將 Stop 移到 $385。你可能覺得「最少呢筆交易唔使輸」。但請小心：

1. 真實成交仍可能有滑價同費用。
2. 價格可能正常回調到 $385，之後再升到 $389 —— 你就被提早帶離市場。

Break-even Stop **唔係免費嘅保護**。你需要測試：移到 Break-even 後，勝率點變？平均盈利點變？有幾多交易被提早離場？整體 Expectancy 係增加定減少？

## 7.4 方法 D：Trailing Stop

假設 TSLA 正在形成一連串 Higher Low，你可以研究一種固定規則：**每當一個新嘅 5m Higher Low 被確認，將 Stop 移到相應結構下方。**

[[chart:trailing]]

呢個方法可能捕捉到較大趨勢，但亦可能因為一個普通 Pullback 而過早離場。

:::warn Pivot Indicator 陷阱
如果需要未來 15 支 K 線先確認 Pivot，就唔可以喺回測時將 Stop 假裝早 75 分鐘已經上移，否則會出現 **Look-ahead Bias**。
:::

## 7.5 四種 Exit Strategy 比較

| 方法 | 優點 | 潛在問題 |
|---|---|---|
| Fixed Target | 簡單、易測試 | 可能錯過延續或回吐浮盈 |
| Partial Exit | 可分階段鎖定部分盈利 | 降低完整目標時嘅平均收益 |
| Break-even Stop | 可能減低部分回吐 | 容易被正常波動觸發 |
| Structure Trailing | 可能參與長趨勢 | 退出時機不穩定，較難統一測試 |

## 7.6 Level 4 建議點練？

:::steps
1. **第一輪回測**：固定 Stop + 固定 Target。
2. **第二輪**：保持 Entry Setup 不變，測試 Partial Exit。
3. **第三輪**：保持其他條件一致，測試 Break-even 或 Trailing Stop。
:::

咁你先可以知道改善係咪真係由 Exit Rule 帶來。唔好一次過同時改 Entry、Stop、Target、時間同 Volume 條件。

[[quiz:l4-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c8', num: '8', title: 'Trade Management 持倉決策', mins: 6,
  summary: '五個持倉狀態、三種中途結果、Time Stop、唔好持倉過夜。',
  keywords: ['Pending Entry', 'Position Open', 'Time Stop', '過夜'],
  md: `
呢章係將知識轉成實際操作。假設 TSLA Breakout + Retest：Entry $386、Stop $384.50、Target $389，1R = $1.50，計劃 Target = +2R。

## 8.1 持倉狀態應該點樣分類？

| 狀態 | 意思 | 你最重要嘅工作 |
|---|---|---|
| Pending Entry | Setup 成立，但仲未成交 | 檢查 Setup 仲成唔成立；失效就**取消未成交訂單** |
| Position Open | 已經持倉 | 確認 Stop 同 Target 是否已按計劃生效 |
| Favorable Movement | 價格按預期發展 | 唔代表必須即刻改 Stop（除非策略本身有固定 Trailing / Partial 規則） |
| Adverse Movement | 價格向不利方向移動 | 唔代表應該立即加倉攤低成本；新手唔建議 Martingale 或無限制 Averaging Down |
| Exit / Flat | 已經平倉 | 檢查訂單狀態、實際成交價、費用、R 結果、有冇剩低未取消訂單，然後填 Journal |

## 8.2 TSLA 交易中途出現三種結果

:::good 結果 A：價格快速達到 Target
按照預定出場規則處理，唔應該單憑「仲好似有力」而臨時取消 Target。
:::

:::bad 結果 B：價格跌穿 Stop
按照預定止損機制處理，之後記錄**實際成交價格**，而唔係假設必定按 Stop Price 成交。
:::

:::info 結果 C：價格一直橫行
如果你嘅策略有 Time Stop，就按事前規則評估。如果冇，就唔應該臨時發明新規則令自己覺得安心。
:::

## 8.3 Time Stop（時間退出）

假設你研究 Momentum Breakout，理論上突破後應該有一定延續，但入場後三支 5m Candle 都冇繼續推進。你可以測試：「入場後三支已完成 5m Candle 都無法達到指定進展，就按預設條件退出。」

三支 Candle 只係教學參數，唔係普遍最佳設定。你需要透過回測比較 3 支、5 支，或者完全唔用 Time Stop，邊一種真正改善整套策略嘅表現。

## 8.4 Day Trading 應唔應該持倉過夜？

如果你定義自己為純 Day Trader，原則上應該有明確嘅當日平倉規則，例如：「如果到指定收市前時間仍然持倉，按照預先定義嘅方式退出。」原因係持倉過夜會增加公司消息風險、隔夜跳空、盤前流動性問題，以及原定 Stop 可能無法按預期價格成交嘅風險。

:::warn 千祈唔好
因為日內交易輸咗錢，就臨時話：「不如轉做 Swing Trading，等聽日反彈。」呢個等於**臨時改變交易策略同持倉風險**。
:::

[[quiz:l4-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c9', num: '9', title: '每日風險管理與 Drawdown', mins: 9,
  summary: 'Daily Loss Limit、Drawdown 點計、點解蝕得愈多愈難追返、連敗嘅機率。',
  keywords: ['Daily Loss Limit', 'Drawdown', '連敗', 'Kill Switch'],
  md: `
到目前為止，我哋集中研究單一交易。但一個真正嘅 Trading System，仲要管理：**一日、一星期、一個月，以及整個帳戶嘅累積風險。**

## 9.1 單筆風險同每日風險有乜分別？

Account Equity = $10,000，每筆模擬風險 = 0.25%（$25）。一日連續輸三筆：3 × 25 = $75（0.75%）；連續輸五筆：$125（1.25%）。雖然每筆風險只係 0.25%，但頻繁交易可以令當日總損失迅速增加，所以要有每日風險限制。

## 9.2 建立 Daily Loss Limit

| 限制 | 教學示例 |
|---|---|
| 每筆預算風險 | 0.25%（$25） |
| 每日累積虧損警戒 | 0.50%（$50） |
| 每日停止交易門檻 | 0.75%（$75） |
| 每日新交易數量 | 最多 3 筆 |
| 同時持倉 | 初期只研究一筆 |
| 連續虧損處理 | 連敗後暫停並覆盤 |

呢啲數字係示範訓練規則，唔係適合所有人嘅風險標準。每日限制應以**包括交易成本嘅實際盈虧**計算，而唔係只用預期止損金額。另外，亦要計入**已持倉但尚未平倉嘅潛在風險**：例如你今日已經輸 $50，而家仲持有一筆最大計劃風險 $25 嘅交易 —— 即使目前只實現 $50 虧損，整體風險已經可能達到每日 $75 上限，所以唔應該再增加新倉。

[[tool:daily-risk]]

## 9.3 Daily Loss Limit 唔應該變成賭博工具

假設你已經輸咗 $50，你心諗：「今日仲有 $25 可以輸，不如搵多一個 Setup 博返本。」呢種思維有問題。**Daily Loss Limit 係最高可接受嘅風險界線，唔係每天必須用盡嘅交易額度。** 如果今日冇清晰 Setup，完全可以零交易。

## 9.4 Drawdown —— 回撤究竟係乜？

Drawdown 係指帳戶由**某個歷史高位**下降嘅幅度。假設模擬帳戶：$10,000 → $10,500 → $10,200 → $9,450。歷史高位係 $10,500，目前 $9,450：

$$ 回撤金額 = 10,500 − 9,450 = $1,050 $$
$$ 回撤比例 = 1,050 ÷ 10,500 = 10% $$

注意：Drawdown 唔係單純計算你最初入金幾多，佢係以**之前帳戶高位**作比較。

## 9.5 點解 Drawdown 大咗，就更難賺返？

帳戶由 $10,000 跌到 $8,000（虧損 20%），你唔係賺返 20% 就打和：8,000 × 1.20 = 9,600。要由 $8,000 回到 $10,000，需要：

$$ (10,000 − 8,000) ÷ 8,000 = 25% $$

[[tool:recovery]]

所以你唔應該將目標設定成「最快幾時可以賺到最多？」，而係先建立方法，**避免累積虧損令帳戶難以恢復**。

## 9.6 連續輸十次係咪代表策略失敗？

未必。假設某個策略真實勝率 40%，即每筆失敗概率 60%。如果簡化假設每筆結果互相獨立，連續十次失敗嘅概率：

$$ 0.6^10 ≈ 0.60% $$

呢個數字唔代表長期交易只有 0.60% 機會遇到十連敗。因為當你累積交易好多次，就會有**更多機會**出現連敗區間。而且市場交易結果經常並非獨立，例如連續喺不適合策略嘅 Choppy Market 落單，可能造成多次類似失敗。

[[tool:streak]]

## 9.7 應唔應該連輸三次就停？

可以作為一種測試規則，但唔係統計學必然要求。例如：「連續三筆虧損後，暫停今日所有新交易，進行覆盤。」

- **好處**：避免情緒化 Revenge Trading。
- **缺點**：可能錯過之後本來符合策略、而且成功嘅機會。

訓練時可以將「三連敗停止」當成行為保護措施，之後再用回測數據評估對整體結果嘅影響。

[[quiz:l4-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c10', num: '10', title: 'Trading Psychology', mins: 6,
  summary: 'FOMO、Revenge Trading、Loss Aversion、Overconfidence、Analysis Paralysis 同個人 Kill Switch。',
  keywords: ['FOMO', 'Revenge Trading', 'Kill Switch', '心理'],
  md: `
市場分析可以透過練習改善，但真實交易仲涉及即時情緒。例如你見到 TSLA 突破 $385，升到 $389。你明明練緊 Breakout + Retest，但市場一直唔回測，你開始焦急，最後追入 $389 —— 呢個就係 **FOMO（Fear of Missing Out）**。

## 10.1 五個最常見嘅交易心理陷阱

| 心理陷阱 | 實際表現 | 建議訓練反應 |
|---|---|---|
| FOMO | 見股價暴升就追 | 檢查有冇符合原定 Setup |
| Revenge Trading | 止損後即刻再交易追回虧損 | 暫停，重新分析 |
| Loss Aversion | 唔願意承認交易失效 | 按事前風險規則處理 |
| Overconfidence | 連贏後突然加大股數 | 保持固定風險預算 |
| Analysis Paralysis | 加太多指標，永遠無法決定 | 只保留固定分析流程 |

## 10.2 FOMO 同正常 Momentum Trading 有乜分別？

唔係所有價格快速上升時買入，都叫 FOMO。如果你本身有一套經過測試嘅 Momentum Breakout Strategy，有客觀 Entry、Stop、Position Sizing，快速突破時入場可以係策略嘅一部分。

但如果你原本計劃等 Retest，因為股價唔回測，所以臨時放棄原有規則追入，咁就屬於偏離計劃。

:::key FOMO 嘅真正定義
FOMO 主要係**交易行為偏離策略**，而唔係單純取決於你買入時股價升咗幾多。
:::

## 10.3 Revenge Trading 點樣發生？

第一筆 TSLA：−1R。第二筆 TSLA：−1R。你開始覺得：「我今日唔可以輸住收市。」第三筆你突然增加倉位，原本計劃只承擔 $25 風險，變成 $100。

呢個時候，**即使第三筆最後賺錢，都唔代表做法合理**，因為你破壞咗 Position Sizing 規則。你可以喺 Journal 加一欄：**Did I Follow My Plan? Yes / No**，先分開評估執行品質同盈虧。

## 10.4 點樣建立一個個人 Kill Switch？

Kill Switch 即係停止新交易嘅預設條件。例如模擬訓練期間：

[[check:l4-kill]]

尤其最後一點：你應該喺開始實際交易前，知道券商嘅**緊急平倉方式、取消訂單方法同支援聯絡渠道**。唔應該第一次學習點取消訂單，係喺市場已經快速下跌嘅時候。

:::coach 教練補充：「HALT」自我檢查
覺得想即刻落單嗰陣問自己：我係咪 **H**ungry（肚餓）、**A**ngry（嬲緊）、**L**onely（覺得孤單／冇人傾）、**T**ired（攰）？任何一個係「係」，就先行開 10 分鐘。呢個方法源自習慣管理，對交易衝動一樣有用。
:::

[[quiz:l4-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c11', num: '11', title: 'Expectancy、Profit Factor、勝率', mins: 9,
  summary: '勝率高唔等於賺錢；成本可能食晒你嘅 Edge；評估策略要睇十個數據。',
  keywords: ['Expectancy', 'Profit Factor', 'Max Drawdown', '樣本數'],
  md: `
呢章係 Level 4 最值得反覆閱讀嘅部分之一。因為你前面學咗好多技術分析，但究竟可唔可以盈利，仍然需要數據驗證。

## 11.1 勝率高，唔代表策略賺錢

| 指標 | Strategy A | Strategy B |
|---|---|---|
| 勝率 | 70% | 40% |
| 平均贏 | +0.5R | +2R |
| 平均輸 | −1.5R | −1R |

$$ E(A) = 0.7(0.5) − 0.3(1.5) = −0.10R $$
$$ E(B) = 0.4(2) − 0.6(1) = +0.20R $$

雖然 A 70% 交易都贏，但平均每筆係**負期望值**。B 雖然只贏 40%，但扣成本前平均每筆 +0.20R。

:::key 所以
Trading Edge 唔係單靠勝率，而係**勝率同平均盈虧比例共同決定**。
:::

## 11.2 Expectancy（期望值）公式

$$ E = P(W) × Avg(W) − P(L) × Avg(L) $$

P(W) = 勝率；P(L) = 敗率；Avg(W) = 平均贏幾多 R；Avg(L) = 平均輸幾多 R（以正數表示虧損幅度）。呢條公式暫時假設冇打和交易；如果有 Break-even 或部分退出，就應使用每筆實際淨 R 嘅平均值。

[[tool:expectancy-lab]]

## 11.3 一個更接近真實嘅例子：100 筆交易

45 筆贏（平均 +1.6R）、55 筆輸（平均 −1R）：45 × 1.6R = 72R；55 × (−1R) = −55R；Gross Result = **+17R**；平均每筆 **+0.17R**。表面上好似唔錯 —— 但請睇埋交易成本。

## 11.4 成交成本可能食晒你的 Edge

假設每筆來回交易（Spread、Slippage、佣金等）平均相當於 0.15R：100 × 0.15R = 15R。扣除成本：17R − 15R = **+2R**，平均每筆只得 **+0.02R**。呢個優勢可能非常脆弱，如果實際成交再差少少，結果就有機會轉負。

所以初學者唔應該只回測「價格有冇到達 Target」，仲應該估算：**我真正做得到嘅 Entry、Stop、Target、佣金同滑價，會將結果改變幾多？**

## 11.5 Profit Factor（盈利因子）

$$ Profit Factor = Gross Profits ÷ Gross Losses = 72 ÷ 55 ≈ 1.31 $$

意思係每累積 1R 毛虧損，策略產生約 1.31R 毛盈利。但如果未計成本，呢個 Profit Factor 可能過度樂觀。回測時最好同時記錄 Gross PF 同 Net PF。

## 11.6 Maximum Drawdown

模擬 Equity Curve：$10,000 → $10,250 → $10,100 → $9,850 → $10,050。之前最高值 $10,250，最低跌到 $9,850：

$$ (10,250 − 9,850) ÷ 10,250 ≈ 3.90% $$

你唔應該只關心策略最後有冇賺錢，仲要問：**中途有冇出現你接受唔到嘅回撤？**

## 11.7 真正評估一套策略，要睇邊幾個數據？

| 指標 | 作用 |
|---|---|
| Number of Trades | 樣本數量 |
| Win Rate | 盈利交易比例 |
| Average Win | 平均盈利 R |
| Average Loss | 平均虧損 R |
| Net Expectancy | 扣成本後平均每筆結果 |
| Profit Factor | 總盈利與總虧損比例 |
| Maximum Drawdown | 最大回撤 |
| Longest Losing Streak | 最長連敗 |
| Rule Compliance | 有冇遵守交易規則 |
| Performance by Market Type | 策略適合邊種市況 |

最後一項特別重要：Breakout + Retest 可能喺 Trending Day 表現較好，但喺 Choppy Day 經常遇到 Fake Breakout。如果將所有日子混埋一齊，只計一個整體勝率，可能會掩蓋策略真正嘅弱點。

[[tool:r-stats]]

## 11.8 需要幾多交易樣本先夠？

| 階段 | 樣本數 | 用途 |
|---|---|---|
| 初步練習 | 約 20–30 個 | 睇自己識唔識一致執行 |
| 第一輪研究 | 約 100 筆 | 初步估算策略表現 |
| 更深入驗證 | 數百筆及多個市場環境 | 研究穩定性及變化 |

即使 100 筆交易有正 Expectancy，都唔代表真實市場可以保持：樣本可能來自同一種市況；規則可能根據該批歷史數據調整過；交易結果可能高度相關；模擬成交可能過於理想；價格波幅同交易成本會改變。需要再用未參與策略調整嘅資料，以及之後嘅 Forward Paper Trading 驗證。

[[quiz:l4-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c12', num: '12', title: '回測升級及 Forward Testing', mins: 9,
  summary: '將主觀描述變成明確規則；Look-ahead Bias、K 線內順序、滑價壓力測試、樣本外測試。',
  keywords: ['可量化規則', 'RVOL', 'Buy Stop', 'Out-of-Sample', 'Forward Testing'],
  md: `
Level 3 你已經學過 Bar Replay。但 Level 4 要做得更加嚴謹：**如果另一個人完全按照你寫低嘅規則睇同一批歷史數據，佢能否得到近似嘅交易結果？** 如果答案係唔得，代表你嘅策略可能仍然太主觀。

## 12.1 將主觀描述變成明確規則

你原本寫：「成交量明顯增加就考慮 Breakout。」問題係「明顯」係幾多？10%？50%？定 200%？你可以將佢改成待測試嘅明確條件：「突破 Candle 嘅 **Relative Volume at Time ≥ 1.5**。」注意 1.5 並唔係市場公認最佳值，佢只係一個可以用數據測試嘅假設參數。

| 主觀規則 | 更容易測試嘅寫法 |
|---|---|
| 價格強勢 | 15m 已確認 HH + HL |
| 成交量好大 | RVOL ≥ 1.5 |
| 突破阻力 | 5m Close 高於事前標記嘅 Zone Upper |
| 回測守住 | 價格重新接近 Zone，並符合預定守住條件 |
| 等確認 | 下一支已完成 K 線收高於回測確認價 |
| 止損太遠 | 計算後 R:R 低於事前最低門檻 |
| 市場太亂 | 根據事前定義嘅 Chop 條件標記 No Trade |

最後一項你仲需要自己訂明具體定義，例如最近六支 Candle 反覆穿越 VWAP 幾多次。否則即使其他規則寫得好仔細，最後仍然可以憑主觀感覺將失敗樣本排除。

## 12.2 建立一套完整可測試 Setup：Breakout + Retest Long v1.0

**市場條件**：股票 TSLA；Timeframe 5m；15m 最近已確認結構 HH + HL；重要 Resistance 交易前已經標記；Session 使用固定 RTH 設定；Volume 使用同一種數據來源。

**Setup 條件**：

1. 一支已完成 5m Candle 收喺 Resistance Zone Upper 上方。
2. 該支 Candle 嘅 RVOL at Time ≥ 1.5。
3. 價格位於當時 Session VWAP 上方。
4. 之後六支已完成 5m Candle 之內，價格回到事前定義嘅回測區。
5. 回測期間沒有觸發事前定義嘅失效條件。
6. 出現指定向上確認，例如確認 K 線收喺區域上方。

**Entry 規則**：確認 K 線完成後，下一階段以突破該 K 線 High 作入場 Trigger。

:::warn 重要補充：唔好用 Buy Limit 等突破
如果你要等股價由下方升穿 $386.10 才買，唔應該簡單將一張 Buy Limit $386.10 預先掛喺市場上。因為當市價仍低於 $386.10 時，普通 Buy Limit **可能立即按較低價格成交**，根本唔係等突破先買。

實際執行可以研究：
- **Buy Stop $386.10**：觸發後轉 Market，可能滑價。
- **Buy Stop-Limit**：例如 Stop $386.10、Limit $386.25，控制最高買入價但可能未能成交。
- 等觸發後再按預設規則人工下單。

三種方式要分開測試，亦要確認相關 Parent Order 可以配合你所用嘅 Bracket 類型。
:::

**Stop 規則**：使用回測低位下方嘅事前緩衝，例如 Stop = Retest Low − $0.10（$0.10 只係教學參數）。如果止損距離過大，股數要相應減少；如果無法取得合理風險回報，就放棄交易。

**Target 規則**：先搵下一個重要 Resistance。如果目標位置無法提供事前最低要求嘅 Reward / Risk，就跳過。

**Exit 規則**：第一版只測試固定 Stop、固定 Target、預定日內離場時間，暫時唔使用主觀移動止損。

## 12.3 何謂 Look-ahead Bias？

例如你將 15m Pivot High 設定成左右各五支 K 線。當一個局部高位形成後，需要等待右邊五支 15m K 線先可以確認，即係大約 **75 分鐘後**先知道。如果你喺歷史回測時，將呢個 Pivot 當成 75 分鐘前已經確認，策略結果就會被美化。

同樣道理：回測時唔可以使用當日未完成嘅日 K 線 High / Low，當成開市時已知嘅 PDH / PDL。PDH / PDL 應該取**上一個已完成交易日**嘅數據。

## 12.4 5m OHLC 無法確認同一支 K 線內嘅成交順序

Long TSLA，Stop $384、Target $388。下一支 5m Candle：Open $386、High $388.50、Low $383.50、Close $386.20 —— High 已經觸及 Target，Low 亦已經觸及 Stop，但單靠 OHLC，你唔知道邊個先發生。如果你直接將呢筆交易計算成 +2R，可能嚴重高估策略。

比較嚴謹嘅做法：先使用更細粒度、品質可靠嘅歷史資料確認順序；如果冇，就標記為「**Intrabar Sequence Unknown**」，並按預先定義嘅保守方法處理，同時做敏感度分析。唔好讓回測系統偷偷替你選擇有利結果。

## 12.5 Slippage Stress Test

| 情境 | 每股不利滑價假設 |
|---|---|
| 理想情況 | $0.00 |
| 一般情況 | $0.10 |
| 較差情況 | $0.30 |

如果某套策略 $0 滑價時賺錢、$0.10 滑價時打和、$0.30 滑價時嚴重虧損，即係佢對成交質素非常敏感。而且實際滑價未必可以用固定金額完全模擬，因為消息日、開市頭段及流動性變化都可能令結果分布不對稱。

[[tool:stress]]

## 12.6 Out-of-Sample Testing

假設你收集 200 筆歷史 Setup，唔應該用晒 200 筆資料調整策略參數，之後再用同一批資料宣布策略有效。可以按時間先後分成兩部分：第一部分用嚟建立及調整策略；第二部分喺策略參數固定後，用嚟做獨立測試。如果獨立測試表現大幅惡化，就要研究策略係咪只適合之前嗰段市場。

## 12.7 Forward Testing

完成歷史回測後，開始 Paper Trading。同歷史回測唔同，Forward Testing 係面對**真正未知**嘅下一段行情。你需要記錄：實際畫線係咪一致？訊號有冇按時出現？訂單會唔會因為成交條件而錯過？實際執行能否維持原定風險？模擬結果扣除合理成本後，有冇接近歷史測試？

:::info 記住
Paper Trading 成交模擬唔一定同真實市場流動性完全一致。歷史有 Edge，唔等於模擬執行有 Edge；模擬有 Edge，亦唔保證真實交易有 Edge。
:::

[[quiz:l4-c12]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c13', num: '13', title: '加拿大／IBKR 實務', mins: 8,
  summary: 'Cash vs Margin、PDT 規則轉變、T+1 結算、報價數據來源、Paper Trading 延遲、加拿大稅務。',
  keywords: ['IBKR', 'PDT', 'T+1', 'NBBO', 'CRA', 'TFSA'],
  md: `
因為你主要研究美股 TSLA，而且考慮使用 IBKR，呢章講實際帳戶層面。呢部分同前面純技術教學唔同，涉及平台規定及稅務，**所以必須根據實際帳戶同最新政策核對**。

## 13.1 Cash Account 同 Margin Account 有乜分別？

| 項目 | Cash Account | Margin Account |
|---|---|---|
| 借錢交易 | 一般不允許 | 視資格及 Margin 規則 |
| 做空股票 | 一般不允許 | 視借股供應及交易權限 |
| 資金使用 | 受可用／已結算資金限制 | 受購買力與保證金要求限制 |
| 強制平倉風險 | 冇一般借貸 Margin Call 機制，但仍有市場損失風險 | 可能因保證金不足被強制減倉或平倉 |
| 適合你目前學習階段？ | 可先了解現金交易限制 | 暫時唔需要靠槓桿學習 |

## 13.2 US$25,000 PDT Rule：2026 年有重要變化

美國傳統 Pattern Day Trader（PDT）制度，涉及 Margin Account 喺五個工作天內達到特定日內交易次數，以及 US$25,000 最低 Equity 規定。

根據課程整理時（2026 年 10 月）嘅資料，規則正處於轉換階段：FINRA 新嘅 Intraday Margin Standards 已於 2026 年 6 月 4 日開始生效，並容許部分券商使用過渡期至 2027 年 10 月 20 日。新制度取代部分舊 PDT 要求，但唔代表所有券商所有帳戶即時取消舊有限制。IBKR Canada 官方頁面亦指出，過渡期間仍可能有帳戶受舊 PDT 規則約束。

:::warn 唔可以簡單話
「我喺加拿大，PDT 一定唔適用。」亦唔可以簡單話「我得 $10,000，就一定完全唔可以 Day Trade。」

正確方法係查核你實際帳戶嘅：法律實體、Cash 或 Margin 類型、當前交易限制、Day Trade 相關可用額度，以及 IBKR 已切換至哪套規則。而家仍然係學習階段，唔應該為咗突破任何交易次數限制而開槓桿或使用更複雜金融產品。
:::

## 13.3 T+1 Settlement —— 現金幾時真正結算？

美國同加拿大一般股票交易已經轉為 **T+1 Settlement**，即係正常情況下交易日之後一個工作日結算。例如星期一賣出股票，通常星期二完成結算；遇到市場假期等情況則可能有所不同。加拿大 CIRO 有相關 T+1 制度說明。

但要區分：**成交完成（Trade Execution）唔等於資金已經完成結算（Settlement）**。Cash Account 可能受到未結算資金使用限制。你要睇 IBKR 顯示嘅 Settled Cash、Available Funds 同帳戶購買力，而唔係見到一筆賣出就假設可以無限制即日反覆使用全部資金。

## 13.4 你喺 IBKR 見到嘅美股報價，未必係全市場綜合報價

IBKR Canada 官方資料指出，部分美股可獲免費即時串流報價，但所提供嘅 Cboe One / IEX 數據屬於 **Non-consolidated**，即係唔一定包含全美交易場所整合後嘅完整 NBBO 報價。而 Consolidated Market Data 會使用多個市場來源整合最佳 Bid / Ask。

對你嚟講：TradingView 顯示嘅 TSLA 價格，同 IBKR TWS 嘅 Last、Bid、Ask，可能因為數據來源、延遲或時段設定而有所差異。尤其當你使用 5-minute Candle、Volume、VWAP、Relative Volume，你最好核對圖表同模擬訂單使用嘅數據來源，避免用一套數據判斷，另一套數據執行，卻以為兩者完全同步。

## 13.5 IBKR Paper Trading 亦可能使用延遲數據

IBKR 官方 Paper Trader 資料指出，未訂閱相應即時市場數據嘅模擬帳戶，部分美股數據可能**延遲約 15 分鐘**。所以做練習時，你要分清楚：

| 環境 | 用途 |
|---|---|
| TradingView Bar Replay | 歷史行情逐步回放 |
| IBKR Paper Trading | 模擬訂單環境 |
| TradingView Paper Trading | 另一套模擬交易環境 |

三者唔係完全相同。如果你將一個實時圖表同一個延遲報價嘅 Paper Account 混合使用，可能導致模擬觸發、價格同成交結果互相對唔上。

## 13.6 加拿大稅務：頻繁交易唔一定當普通 Capital Gains

加拿大 CRA 判斷股票交易收益係 Capital Gains 定 Business Income，會考慮多個因素，包括交易頻率、持有時間、專業知識、投入時間、借貸情況、交易意圖等。冇單一因素可以自動決定分類。

如果你打算長期高頻 Day Trading，需要事先了解有冇可能被視為 Business Income。而如果你考慮使用 **TFSA** 做頻繁交易，更要小心 —— CRA 指出，TFSA 如涉及經營交易業務，可能引發相關稅務後果。

另外，加拿大申報美股相關收益時，通常要保留適當 **CAD 換算紀錄**，而唔係只看 USD 盈虧。你日後嘅 Journal，除咗記錄 USD P&L，最好亦保留：交易日期、手續費、匯率、CAD 換算值，以及券商月結單。

:::info 免責
實際分類及申報方法應由熟悉加拿大證券交易稅務嘅專業人士按你嘅情況判斷。本平台嘅交易日誌有「匯率」欄，可以幫你預留 CAD 換算紀錄。
:::

[[quiz:l4-c13]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c14', num: '14', title: 'TSLA 完整交易模擬', mins: 9,
  summary: '由開市前準備、計股數、觸發、+1R，到兩種結局同收市後覆盤。',
  keywords: ['完整流程', '模擬交易單', '覆盤'],
  md: `
呢章將 Level 1 至 Level 4 全部連接起來，模擬一個完整 Day Trading 決策流程。以下係**虛構 TSLA 交易日**，並非實際歷史成交紀錄。

[[chart:l4-day]]

## 14.1 開市前：準備分析

| 項目 | 模擬數據 |
|---|---|
| Previous Day High | $385.20 |
| Previous Day Low | $378.50 |
| Premarket High | $384.90 |
| Premarket Low | $381.20 |
| 15m Structure | 開始出現 HH + HL |
| 主要 Resistance Zone | $384.80–$385.20 |
| 下一阻力 | $388.70–$389.00 |

你應該先做：① 標記 PDH / PDL；② 標記 Premarket High / Low；③ 將 $384.80–$385.20 視為重要價格區域；④ 檢查當日有冇重要消息；⑤ 預先決定今日主要研究邊一套 Setup。假設你選擇 **Breakout + Retest Long**。此刻未有交易。

## 14.2 9:30–9:45 ET：開市初段

股價喺 $383–$384.50 上落，Volume 明顯高於盤中其他時段嘅典型水平，Session VWAP 開始形成。你要問：價格有冇接近重要 Resistance？有冇真正突破？15m 結構有冇改變？如果目前未有符合條件嘅 Setup：**WAIT**。唔需要因為開咗市就立即交易。

## 14.3 9:45–9:50 ET：突破發生

TSLA Open $384.35、High $385.75、Low $384.20、Close $385.55；相對同時段 Volume 約 1.8 倍；Session VWAP $383.70，向上。市場已經提供初步突破證據，但你策略需要 Retest，所以繼續等待。

## 14.4 9:50–9:55 ET：價格回測

Open $385.55、High $385.80、Low $385.05、Close $385.35；Volume 減少。價格回到舊 Resistance Zone，暫時未有明顯失守 —— **Retest Candidate**，但仲未有完成反彈確認。

## 14.5 9:55–10:00 ET：反彈確認

Open $385.34、High $386.05、Low $385.12、Close $385.95；Volume 回升。目前有：價格收復向上；回測低位仍然接近舊 Resistance Zone；價格持續高於 VWAP；上方仍然有一定距離先到下一阻力。於是你制定模擬計劃。

## 14.6 計算完整交易

| TSLA —— 模擬交易單 | |
|---|---|
| Setup | Breakout + Retest |
| Direction | Long |
| Entry Trigger | $386.10 |
| Stop Loss | $384.70 |
| Target | $388.90 |
| 原定 R:R | 2.00 |
| 風險預算 | $25 |
| 假設每股不利滑價緩衝 | $0.20 |
| 假設來回費用 | $2 |

$$ Shares = ⌊ (25 − 2) ÷ (1.40 + 0.20) ⌋ = 14 股 $$

所需買入資金：14 × 386.10 = **$5,405.40**。如果止損以比預計低 $0.20 嘅價格成交，連同假設費用：14 × 1.60 + 2 = **$24.40**。但 $0.20 只係假設緩衝，唔代表實際最多滑價 $0.20。

## 14.7 10:00–10:05 ET：Entry Trigger

TSLA Open $385.95、High $386.40、Low $385.80、Close $386.25。你嘅 Trigger $386.10 被觸及，假設模擬訂單最終按照 $386.10 成交，你持有 14 股 TSLA。而家應該確認：

[[check:l4-fillcheck]]

你唔應該只見到 TradingView 價格上升，就假設 IBKR 一定已經按你希望嘅價格成交。

## 14.8 10:05–10:10 ET：價格開始上升

TSLA 升到 $387。每股浮動毛利 = 387 − 386.10 = $0.90；每股原定風險 $1.40 → 目前大約 **+0.64R**。按照你目前固定 Target / Stop 嘅第一版策略，唔需要臨時修改。你可以記錄 MFE，但繼續跟原定管理規則。

## 14.9 10:10–10:15 ET：到達 +1R

價格升到 $387.50，距離 Entry $1.40，即 **+1R**。你可能想將 Stop 移到 Break-even，但你原本 v1.0 冇呢個規則，所以唔應該因為見到盈利就臨時改變。如果你想研究 Break-even Stop，應該另建 **v1.1** 版本，用同一批合適嘅測試方法比較兩者。

## 14.10 10:15–10:20 ET：兩種可能結局

:::good 結局 A：繼續升到 Target
TSLA 到達 $388.90，假設可以按 Target 完全成交。每股盈利 $2.80 × 14 股 = $39.20；扣總費用 $2 → **淨盈利 $37.20**。呢個結果係正數，但唔代表下次相同 Setup 一定贏。
:::

:::bad 結局 B：突然反轉到 Stop
股價由 $387.50 跌到 $384.40。Stop $384.70 觸發，但只能喺 $384.40 成交。每股虧損 $1.70 × 14 股 = $23.80；再加總費用 $2 → **實際虧損 $25.80**。即使原本預算風險 $25，實際損失仍然略為超出 —— 呢個正正係點解風險預算唔等於最大損失保證。
:::

## 14.11 收市後：應該點樣 Review？

你唔應該只記「今日 TSLA 賺 $37.20」或者「今日 TSLA 輸 $25.80」。你應該記低：

| 問題 | 目的 |
|---|---|
| Setup 有冇符合原定條件？ | 檢查分析一致性 |
| Entry Trigger 有冇按規則出現？ | 檢查入場 |
| 實際成交價同預期差幾遠？ | 衡量滑價 |
| Stop / Target 是否成功建立？ | 檢查執行 |
| 有冇臨場移 Stop？ | 檢查紀律 |
| 市場屬於 Trending 定 Range？ | 分析策略適用性 |
| 結果有幾多 R？ | 標準化比較 |
| 有冇違反規則？ | 改善執行品質 |

呢份紀錄比單純輸贏金額更有長期研究價值。

[[replay:l4-day]]

[[quiz:l4-c14]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c15', num: '15', title: '交易規則與量化測試', mins: 7,
  summary: 'Trading System v1.0、Google Sheets / 本平台日誌欄位、Net P&L 同 Net R 公式、MFE / MAE。',
  keywords: ['Trading System v1.0', 'Journal', 'Net R', 'MFE', 'MAE'],
  md: `
你而家已經有足夠知識，開始整理一套 v1.0 Trading System。建議你先唔好建立太複雜嘅策略，先固定：**TSLA + 5m + Breakout & Retest Long**。

## 15.1 模擬 Trading System v1.0

| 類別 | 規則 |
|---|---|
| 股票 | TSLA |
| 主要圖表 | 5m |
| 市場方向 | 15m 偏強 |
| 入場 Setup | Breakout + Retest |
| Volume | 記錄同時段 RVOL |
| VWAP | 價格高於 Session VWAP |
| Entry | 突破已完成確認 K 線高位 |
| Stop | 回測結構失效位置下方 |
| Target | 下一重要阻力，且符合事前 R:R 要求 |
| 每筆模擬風險預算 | 0.25% |
| 每日風險限制 | 以第九章訓練規則作示例 |
| Exit | 固定 Stop / Target，另外制定收市前退出規則 |
| 交易次數 | 每日最多 3 筆作訓練上限 |
| No Trade | Setup 未符合、風險回報不合格、平台異常 |

呢張表仍有部分需要進一步量化，例如「15m 偏強」同「確認 K 線」嘅嚴格定義，但佢已經可以作為正式規則文件嘅起點。

## 15.2 點樣記錄交易？

建議欄位（Google Sheets 版本）：

| Column | 名稱 | Column | 名稱 |
|---|---|---|---|
| A | Date | I | Exit Price |
| B | Symbol | J | Round-trip Costs |
| C | Setup | K | Net P&L |
| D | Market Type | L | Net R |
| E | Entry Price | M | MFE |
| F | Stop Price | N | MAE |
| G | Target Price | O | Rule Followed? |
| H | Shares | P | Notes |

**Net P&L（Long）**：

$$ Net P&L = (Exit − Entry) × Shares − Costs $$

Google Sheets 第 2 行：<code>=(I2-E2)*H2-J2</code>

**Net R**（以原定價格風險作分母）：

$$ Net R = Net P&L ÷ ((Entry − Stop) × Shares) $$

Google Sheets：<code>=IFERROR(K2/((E2-F2)*H2),"")</code>

如果真實止損發生滑價，Net R 可以低於 −1R。如果有分批止賺、多次入場、做空或者移動止損，需要更完整嘅逐筆成交紀錄先可以精確計算。

:::tip 唔想用 Google Sheets？
本平台嘅 **📒 交易日誌** 已經內置晒以上欄位同公式，仲會自動畫 Equity Curve，亦可以匯出 CSV 去 Excel / Google Sheets。
:::

## 15.3 MFE 同 MAE 係乜？

- **MFE：Maximum Favorable Excursion** —— 持倉期間，價格曾經向有利方向移動最多幾多。
- **MAE：Maximum Adverse Excursion** —— 持倉期間，價格曾經向不利方向移動最多幾多。

Long：Entry $385、Stop $384、Target $387；持倉期間最高 $386.80、最低 $384.60；最終 Exit $385.20。則 MFE = $1.80 = **+1.8R**；MAE = $0.40 = **0.4R 不利波動**；最終毛結果 = **+0.2R**。

呢筆交易雖然最後只賺 +0.2R，但曾經有 +1.8R 浮動盈利。如果大量交易都出現類似情況，就值得研究 Exit Rule 是否適合策略。但唔應該只因為見到 MFE 好高，就事後假設自己一定可以喺最高位止賺 —— MFE / MAE 係分析工具，唔係實際可保證成交嘅價格。

[[tool:mfe-mae]]

## 15.4 每星期應該檢查邊啲問題？

[[check:l4-weekly]]

先找出最明顯嘅問題，然後**每次只修改一項策略條件**。保留原本版本，避免改完之後再也無法比較。

[[quiz:l4-c15]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l4-c16', num: '16', title: 'Level 4 測驗與訓練計劃', mins: 9,
  summary: '六題執行及風險測驗、四星期訓練、十個畢業重點同你嘅第一套模擬系統。',
  keywords: ['測驗', '訓練計劃', '畢業標準'],
  md: `
## 16.1 Level 4 學習測驗

[[quiz:l4-final]]

## 16.2 四星期實戰訓練安排

唔建議你讀完就立即開始真錢 Day Trading。比較合理嘅次序係先學執行，再學資金管理，最後驗證策略。

| 星期 | 訓練重點 | 完成要求 |
|---|---|---|
| Week 1 | Order Execution | 用模擬平台熟習 Market、Limit、Stop、Bracket、取消訂單 |
| Week 2 | Risk Management | 完成 20 個 Position Sizing、Stop、Target 計算 |
| Week 3 | Replay & Trade Management | 使用同一套 Setup，逐支 K 線執行及記錄所有符合條件嘅交易 |
| Week 4 | Journal & Review | 計算 Expectancy、Net R、Drawdown，檢查執行錯誤 |

[[check:l4-plan]]

:::info 留意
呢四星期係建立操作基礎，唔係策略盈利能力認證。
:::

## 16.3 Level 4 真正要學識嘅十個重點

[[check:l4-grad]]

## 16.4 你的第一套模擬 Trading System

| 項目 | 設定 |
|---|---|
| 股票 | TSLA |
| 主要 Timeframe | 5m |
| 市場背景 | 15m |
| 策略 | Breakout + Retest Long |
| 工具 | Price Action、Volume、VWAP、S/R、PDH、PDL |
| 本金 | 模擬 US$10,000 |
| 每筆訓練風險預算 | 0.25% |
| 管理方法 | 固定 Stop / Target |
| 測試方法 | Bar Replay → Journal → Forward Paper Trading |

呢啲只係第一版研究參數，未經驗證有盈利能力。

:::key 由呢句……
「TSLA 出現大綠燭、Volume 好大，我覺得應該買。」
:::

:::good ……變成呢句
「15m 結構偏強，5m 價格突破事前畫好嘅 Resistance，成交量增加。回測守住後出現確認，下一個阻力提供合理空間。我已經訂好入場 Trigger、失效位置、股數及退出方法。如果唔符合條件，我就放棄。」
:::

Level 4 嘅真正畢業標準，唔係識得落單，而係**即使價格急速變動、交易連續失敗，你仍然能夠根據事前寫好嘅規則管理風險、記錄結果同理性檢討**。

完成呢一步之後，Level 5 就應該由講理論轉向實際驗證：用真實歷史 TSLA 交易日，逐支 5m Candle 建立完整交易紀錄，再分析你嘅第一套 Setup 究竟有冇可重複嘅統計優勢。
`},
  ],
});
