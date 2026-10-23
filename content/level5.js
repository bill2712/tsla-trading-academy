/* Level 5：實戰驗證與交易系統開發 */
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: 'l5',
  code: 'Level 5',
  title: '實戰驗證與系統開發',
  subtitle: 'Strategy Backtesting, Statistical Edge, Forward Testing & Trading Performance Analysis',
  icon: '🔬',
  color: '#059669',
  question: '呢套方法經過完整測試後，仲有冇可重複嘅優勢？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l5-c1', num: '1', title: '從 Trading Setup 到 Trading System', mins: 6,
  summary: 'Strategy 只係想法；System 要有十二個部分嘅明確規則，仲要做版本管理。',
  keywords: ['Trading System', 'Strategy ID', '版本管理'],
  md: `
主要研究：**TSLA｜5-minute Chart｜Breakout + Retest Long｜US$10,000 模擬本金**

| Level | 你已經學識 |
|---|---|
| Level 1 | Candlestick、Volume、VWAP、Support / Resistance 等基本工具 |
| Level 2 | Price Action、Market Structure 同多指標綜合判斷 |
| Level 3 | Breakout + Retest、Reversal、Fake Breakout 三套交易 Setup |
| Level 4 | Entry、Stop Loss、Take Profit、Position Sizing、訂單執行及風險管理 |

**Level 5，我哋要解決最關鍵嘅問題：你學到嘅方法，究竟有冇可重複嘅統計優勢？**

例如 TSLA 突破 Resistance、Volume 增加、價格高於 VWAP、回測阻力區之後再出現一支 Bullish Candle。你可能覺得呢個係靚 Setup，但以下問題你仲未有答案：

1. 呢種 Setup 過去出現 100 次，有幾多次成功？
2. 平均贏幾多，平均輸幾多？
3. 如果計埋 Spread、Commission 同 Slippage，仲有冇盈利？
4. Trending Day 同 Range Day，邊種環境更適合？
5. RVOL 1.5 係咪真係比 RVOL 1.0 更有用？
6. 等 Retest 真係比直接突破入場好？
7. 用固定 2R 止賺，定按下一個阻力位止賺，結果更好？
8. 如果你喺另一段歷史時間測試，策略仲係咪有效？
9. 你係咪無意中睇咗未來 K 線，令回測結果過度樂觀？
10. 就算策略有正期望值，你係咪能夠按照規則執行？

:::info 關於數據
課程用真實歷史數據作為正式練習目標，但課程入面嘅數字例子會清楚標示為**模擬**；唔會捏造某日嘅真實逐支 K 線或者盈利結果。待你有實際 CSV，就可以用同一方法（同本平台嘅 CSV 工具）分析真正交易日。
:::

## 1.1 Strategy 只係一個交易想法

例如 **Breakout + Retest Long**：價格突破阻力區，之後回測守住，再次向上時研究入場。但呢個只係策略概念。如果你將佢交畀另外兩個交易者，可能得到三個完全唔同嘅結果：

- **A** 認為價格只要 Wick 升穿 Resistance，就叫突破。
- **B** 要求 5m Candle 收市高於 Resistance。
- **C** 要求至少兩支 Candle 保持喺 Resistance 上方。

同樣，A 可能喺 Retest 當刻買入，B 等 Hammer，C 等確認 K 線被突破。即使三個人都聲稱使用同一套 Breakout + Retest，實際交易邏輯可能完全唔同。

## 1.2 System 必須有明確規則

| 系統部分 | 要回答嘅問題 |
|---|---|
| Universe | 交易邊隻股票？ |
| Session | 交易邊個時段？ |
| Context | 乜嘢市場環境先符合？ |
| Signal | 乜嘢價格事件值得觀察？ |
| Setup | 乜嘢後續條件先形成候選機會？ |
| Entry | 幾時、用乜嘢方式進場？ |
| Stop | 邊個價格代表原本假設失效？ |
| Target | 根據乜嘢離場？ |
| Sizing | 買幾多股？ |
| Risk Limits | 每日或每筆最多承擔幾多計劃風險？ |
| Cancellation | 未成交時，幾時要取消？ |
| Evaluation | 點樣證明策略有冇統計優勢？ |

最後一項就係 Level 5 嘅核心。

## 1.3 要建立一個固定版本

:::card STRATEGY ID：TSLA-BR-LONG-v1.0
| Symbol | Chart | Setup | Direction | Capital | Status |
|---|---|---|---|---|---|
| TSLA | 5m | Breakout + Retest | Long Only | US$10,000 | Research / Unvalidated |
:::

由而家開始，如果你修改規則，例如 RVOL 由 1.5 改成 2.0、Retest 等六支變成四支、Target 由 2R 改成 3R、Stop 由回測低位改成 ATR —— 就要記錄成一個**新版本**（例如 TSLA-BR-LONG-v1.1），而唔係偷偷改掉原本 v1.0。呢個版本管理方法會令你之後能夠知道，究竟邊個改動真正改善結果。

[[quiz:l5-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c2', num: '2', title: '建立可量化交易規則', mins: 9,
  summary: '將「強勢突破」「成交量好大」「回測守住」變成數字；CLV、RVOL at Time、取消條件。',
  keywords: ['Breakout 定義', 'RVOL at Time', 'CLV', 'Retest Window', '取消條件'],
  md: `
呢章係你過去最需要解決嘅問題。因為你曾經困惑：「Support / Resistance 根本畫唔準，Swing High 又唔係每次都搵到三個，點樣真正判斷？」Level 5 要做嘅，係將呢啲主觀部分**盡量變成可測試嘅規則**。

## 2.1 主觀分析最大問題

「TSLA 出現強勢突破。」乜嘢叫強勢？如果你今日覺得一支大綠燭係強勢，聽日又覺得唔夠強勢，就無法公平比較交易。因此要開始定義明確數值。

## 2.2 先將規則分成四組

| 組別 | 例子 |
|---|---|
| **A：Market Filter 市場過濾** | 只做正常交易時段、只做明確看漲結構、避開預先定義嘅重大消息時段 |
| **B：Setup Filter 機會過濾** | 價格收市突破事前阻力區，RVOL 達到指定門檻 |
| **C：Trigger 入場觸發** | 回測確認 K 線完成後，突破其 High + $0.05 |
| **D：Exit & Risk 退出及風險** | 結構 Stop、固定 2R Target、明確訂單有效期 |

以下數值全部都係**待測試嘅初始參數**，唔係已證明最有效嘅設定。

## 2.3 先定義 Breakout

Resistance Zone：$384.80–$385.20。初步定義：5m Candle 收市價必須高於 Zone Upper $385.20。如果想避免只高出一兩仙，可以試加入固定緩衝，例如 $0.05：

$$ Breakout Close > 385.20 + 0.05，即 Close > $385.25 $$

但固定 $0.05，對 $100 股票同 $400 股票，意義唔一樣。更成熟嘅方法，可以比較固定金額、價格百分比或者 ATR 緩衝。Level 5 第一版先用固定數字，避免太多參數；之後先做敏感度測試。

## 2.4 定義 Volume Confirmation

兩種唔同計算：

- **Relative Volume**：同過去若干支 K 線平均成交量比較。
- **Relative Volume at Time**：同過去多個交易日**相同時間**嘅成交量比較。

例如 TSLA 10:00–10:05 嘅 5m Volume：今日 = 1,200,000 股；過去十個交易日同時段平均 = 800,000 股：

$$ RVOL(time) = 1,200,000 ÷ 800,000 = 1.5 $$

我哋可以先測試 **RVOL(time) ≥ 1.5**。

[[tool:rvol]]

:::warn TradingView 設定陷阱
TradingView 嘅 Relative Volume at Time 有 **Regular** 同 **Cumulative** 兩種模式，預設可能係 Cumulative。為咗符合今次「單支 5m Candle 成交量」嘅定義，必須明確選用 Regular 模式，並固定 Anchor Timeframe 同回望長度。否則你以為自己比較每支 5m 成交量，實際可能比較緊由開市累積到當刻嘅總成交量。
:::

## 2.5 定義 Retest

「回調到阻力附近」實在太模糊。你可以先寫：

- 最多等待突破後**六支**完整 5m K 線。
- 期間至少有一支 K 線觸及原 Resistance Zone。
- 回測期間不得符合失效條件。
- 如果六支內冇回測，Setup 過期。

六支 × 5 分鐘 = **30 分鐘**。但唔係話 30 分鐘係市場最佳設定，只係你第一個研究版本嘅參數。如果你想之後比較三支、六支、九支 K 線，應建立明確新版本測試。

## 2.6 定義回測確認

可以先測試一套較簡單嘅條件，回測期間有一支已完成 5m Candle：Low 曾到達原本 Resistance Zone；Close 收喺 Zone Upper 上方；收市價處於自身 K 線範圍上半部。最後一項可以透過 **Close Location Value** 計算：

$$ CLV = (2C − H − L) ÷ (H − L) $$

當 H 大於 L 時，CLV ≥ 0 代表 Close 處於 K 線全幅嘅上半部。如果 H = L，則呢個指標無法計算，應標記為缺失，而唔係任意當成 0。

第一版回測確認條件：**Close > ZoneUpper AND CLV ≥ 0**。呢個只是方便量化嘅定義，唔等於佢必然比其他確認方法好。

[[tool:clv]]

## 2.7 定義 Entry Trigger

假設確認 Candle High = $385.90：

$$ Entry Trigger = 385.90 + 0.05 = $385.95 $$

但要分清楚 **Signal Price、Order Trigger 同 Actual Fill Price**。例如 Trigger = $385.95，你用 Buy Stop，實際模擬成交 $386.10 —— 交易統計應該使用 $386.10 作為實際 Entry，而唔係仍然用 $385.95。

另外，如果你係喺確認 K 線收市後先建立訂單，就唔可以用確認 K 線內已出現過嘅價格，當成可以提前成交嘅證據。

## 2.8 定義取消條件

一個完整 Setup 唔可以只定義「幾時買」，仲要定義「**幾時唔買**」。

| 情況 | 行動 |
|---|---|
| 突破後六支 5m K 線都冇回測 | Setup 過期 |
| 回測跌穿預定失效水平 | 取消 Long 候選 |
| 未觸發 Entry，價格已到下一阻力附近 | 重新評估，可能取消 |
| 出現重大突發消息 | 暫停使用普通日規則 |
| 入場價跳高導致 R:R 不符合要求 | 放棄 |
| 已到預定停止開新倉時間 | 取消未成交入場單 |

當你可以喺未知道結果之前寫好以上規則，就真正開始建立 Trading System。

[[tool:rules-builder]]

[[quiz:l5-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c3', num: '3', title: '取得 TSLA 真實歷史數據', mins: 7,
  summary: 'TradingView CSV vs IBKR API、匯出步驟、一日 78 支 K 線、時間戳陷阱。',
  keywords: ['CSV', 'TradingView', 'IBKR API', 'RTH', '78 支 K 線', '時間戳'],
  md: `
你喺 TradingView 睇到一張歷史圖，唔代表已經有一份足夠完整、可以直接進行專業回測嘅數據集。需要確認：**價格來源、時區、交易時段、時間戳定義、OHLCV 完整程度，以及資料有冇被調整或缺漏。**

## 3.1 最初應該用 TradingView 定 IBKR？

| 工具 | 優點 | 限制 | 建議用途 |
|---|---|---|---|
| TradingView Bar Replay | 視覺化逐支 K 線，容易理解 Price Action | 歷史深度受產品及訂閱限制 | 第一階段人工 Replay |
| TradingView CSV | 可以匯出圖表價格及指標數據 | 可匯出內容取決於已載入圖表資料 | Excel 數據分析 |
| IBKR Historical Data | 可以透過 API 取得歷史 OHLCV | 受市場數據權限、API 使用條件及資料範圍限制 | 後期較系統化測試 |
| IBKR Paper Trading | 學習訂單及模擬實時交易 | 模擬成交同真實市場可能不同 | Forward Testing |

TradingView 官方確認可以透過圖表工具列嘅 **Download chart data** 將價格及指標數據匯出 CSV，匯出內容取決於圖表已載入嘅資料。IBKR 官方亦提供 Historical Bars API，支援指定資料類型、K 線間隔及是否只使用 Regular Trading Hours。建議你第一階段先用 TradingView，唔使即刻學 API。

## 3.2 TradingView 真正操作流程

:::steps
1. 打開 TradingView Supercharts，搜尋 **NASDAQ:TSLA**。
2. 將 Chart Interval 設為 **5 minutes**。
3. 將圖表時區設為 **New York / America/New_York**，以免混淆開市時間。
4. 先只研究 **Regular Trading Hours（9:30 AM–4:00 PM ET）**，盤前盤後另外處理。
5. 加入 Session VWAP 同 Volume。Relative Volume at Time 如有使用，要記錄其設定。
6. 將圖表移動到希望研究嘅歷史日期，確保相關 K 線已經載入。
7. 由圖表上方選單選擇 **Download chart data**，下載 CSV（選項會受你嘅產品權限影響）。
8. 核對 CSV 時間戳、日期、Open、High、Low、Close、Volume。
9. 儲存原始 CSV，唔好直接覆蓋。另建整理後版本用作回測。
:::

TradingView 對 Bar Replay 歷史深度有訂閱及 Interval 限制，實際仍受該 Symbol 可提供嘅資料影響。因此唔好因為搵唔到某年某月 5m Candle，就假設該交易日不存在。

:::tip 本平台幫到你
匯出 CSV 之後，可以直接貼落 **🧰 工具箱 → CSV 數據檢查器**：佢會自動檢查 High/Low 邏輯、重複時間、缺漏 K 線、每日係咪 78 支，同埋逐支計 Session VWAP 同 CLV。
:::

## 3.3 一個完整正常美股交易日有幾多支 5m Candle？

美股正常交易時段 9:30 AM–4:00 PM ET，即 390 分鐘：

$$ 390 ÷ 5 = 78 支 $$

但要留意：提早收市日唔會有完整 78 支；市場假期可能完全冇交易；資料供應商嘅時間戳可能標示 Candle 開始或結束時間；個別資料可能缺失或者存在異常；如果包含 Extended Hours，K 線數量會更多。

## 3.4 開始時間同結束時間最容易混亂

例如你見到「2026-09-18 09:30」，有啲資料來源代表呢支 K 線由 09:30 開始、09:35 結束，但亦有啲系統用另一套時間標記方式。今次我哋統一：**Bar Timestamp = Candle Start Time（美東時間）**。

| Bar Timestamp | 真正覆蓋時間 |
|---|---|
| 09:30 | 09:30–09:35 |
| 09:35 | 09:35–09:40 |
| 09:40 | 09:40–09:45 |
| 09:45 | 09:45–09:50 |

:::warn 最重要
如果 09:30 Candle 係 09:35 先完成，你唔可以喺 09:30 就使用佢嘅 Close、High、Low 或完整 Volume 進行判斷。呢個係回測最常見嘅**前視偏差**來源之一。
:::

[[quiz:l5-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c4', num: '4', title: '資料整理與 Session VWAP', mins: 7,
  summary: 'Data Quality Check、Session VWAP 逐支累積同每日重置、RVOL at Time 正確分母。',
  keywords: ['OHLCV', 'Data Quality', 'Session VWAP', 'RVOL'],
  md: `
假設你已經取得 CSV，基本格式應該至少包含：

| Date ET | Time ET | Open | High | Low | Close | Volume |
|---|---|---|---|---|---|---|
| 模擬日 | 09:30 | 384.00 | 384.80 | 383.50 | 384.50 | 1,500,000 |
| 模擬日 | 09:35 | 384.50 | 385.20 | 384.10 | 385.00 | 1,200,000 |
| 模擬日 | 09:40 | 385.00 | 385.60 | 384.70 | 385.40 | 950,000 |

表內係虛構數字，只用嚟解釋數據格式。

## 4.1 每一行都要通過 Data Quality Check

- High 應該大於或等於 Open、Close、Low。
- Low 應該小於或等於 Open、Close、High。
- Volume 唔應該係負數。
- 同一日嘅時間應該正確排序。
- 唔應該無端出現重複時間戳。
- 留意零成交量、缺漏 K 線及異常巨大價格變動。

:::warn 唔好亂補
唔好隨便將缺漏價格用上一支 Candle 補上。因為咁樣可能創造原本不存在嘅 Support、Resistance、VWAP 同交易訊號。
:::

## 4.2 Session VWAP 必須逐支累積

$$ TP(i) = (High + Low + Close) ÷ 3 $$
$$ VWAP(t) = Σ[TP(i) × Volume(i)] ÷ Σ Volume(i)   （i 由當日第一支到第 t 支） $$

重點係：**只可以使用當時同之前已完成嘅 Candle。** 例如你分析 10:05 時，你唔可以用埋下午 2:00 嘅 Volume 去重新計算當時 VWAP，更唔可以用當日全部成交量嘅最終 VWAP，假裝開市時已經知道。

Excel 計算：假設 H 欄係 Typical Price，I 欄係 TP × Volume，J 欄係當日累積 TP × Volume，K 欄係當日累積 Volume，就可以用 <code>=IFERROR(J7/K7,"")</code> 計算每一行嘅 Session VWAP。但**當新交易日開始，累積必須重置**。

[[tool:vwap]]

## 4.3 RVOL at Time 點樣計先唔會出錯？

假設你想知道今日 10:00 嘅成交量是否異常，你需要取過去十個交易日相同 10:00–10:05 時段嘅 Volume，再計平均：

$$ RVOL(10:00) = 今日 10:00 Volume ÷ 過去十日 10:00 平均 Volume $$

但注意：過去十日**唔可以包括今日之後**嘅未來交易日；而且唔可以用今日全日最終平均成交量作分母。

建議初期直接記錄 TradingView 顯示嘅已完成 K 線 RVOL at Time（Regular 模式），之後再學習用完整多日 CSV 自行計算。

[[quiz:l5-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c5', num: '5', title: '逐支 K 線回測與狀態機', mins: 9,
  summary: '用 State Machine 一步步處理；分開 Candidate Ledger 同 Trade Ledger；No Fill 同 Ambiguous。',
  keywords: ['State Machine', 'Candidate Ledger', 'Trade Ledger', 'No Fill', 'AMBIGUOUS'],
  md: `
回測最容易出現嘅問題，就係**事後知道結果，再返回過去尋找最漂亮嘅 Setup**。呢種方法唔能夠證明策略有效。

## 5.1 我哋使用固定 State Machine（狀態機）

一套交易策略唔應該每支 K 線都重新估一次「買定唔買」，可以按以下順序：

:::state
:::

一個重要細節：**每個狀態都應該有失效或者過期條件**。例如 WAIT RETEST 超過六支 Candle，就返回 IDLE；ORDER PENDING 期間如果重要支持失守，就取消待成交訂單。你唔可以因為未入場，就將一個兩小時前嘅 Setup 無限制保留。

## 5.2 真正逐支 Replay 例子

以下係虛構教學序列。事前標記 Resistance Zone = $384.80–$385.20，VWAP 正向上，15m 看漲結構已經確認。

| K 線 | 價格事件 | 系統狀態 |
|---|---|---|
| 09:45 | 接近 $385 | IDLE |
| 09:50 | 收市突破 $385.20 | BREAKOUT |
| 09:55 | 回調到 $385.05 | WAIT CONFIRM |
| 10:00 | 回測反彈、收近高位 | ORDER PENDING |
| 10:05 | 突破預定 Trigger | POSITION OPEN |
| 10:10 | 短線繼續上升 | POSITION OPEN |
| 10:15 | 回調但未觸 Stop | POSITION OPEN |
| 10:20 | 低位觸及預定 Stop | EXIT / LOG |

時間為示例 K 線開始時間 ET。決策必須根據當時已完成嘅 K 線及可用報價。

[[tool:state-machine]]

## 5.3 第一步：先記錄每個候選 Setup

呢度係整個 Level 5 最關鍵嘅改變：**唔係只有成交咗嘅交易先記錄**。你應該記錄：

- 符合初步 Breakout 條件嘅機會。
- 回測成功嘅機會。
- 回測失敗嘅機會。
- 有 Setup 但未觸發 Entry 嘅機會。
- 因為 R:R 不足而放棄嘅機會。
- 因為超過時間限制而取消嘅機會。

點解？假設你研究咗 50 個 Breakout：20 個冇回測、10 個回測失敗、20 個符合入場候選條件，而你最後只做咗其中 12 筆模擬交易。如果只記錄 12 筆，將來就無法知道：係咪你挑選咗最漂亮嘅 12 筆？或者另有 8 筆因為入場價、流動性或者風險條件而取消？

所以要分開：**Candidate Ledger（候選紀錄）** 同 **Trade Ledger（已執行交易紀錄）**。本平台嘅交易日誌兩樣都有。

## 5.4 第二步：入場 Trigger 發生先開始計交易

確認 Candle High = $386.05，設定 Buy Stop Trigger $386.10、Stop $384.70、Target $388.90。

- 如果下一支 Candle 最高只去到 $386.00：**No Fill**。唔可以將交易當成已經入場。
- 如果下一支 Candle 突然跳到 $386.50：亦唔可以直接假設一定以 $386.10 成交。應按事前選定嘅執行模型處理，例如使用保守填價假設，或者將呢筆交易標記為需要更高解析度數據。

## 5.5 第三步：處理 Stop 同 Target 嘅先後順序

已經 Long：Entry $386.10、Stop $384.70、Target $388.90。下一支 Candle High $389.10、Low $384.50。單靠呢支 5m OHLC，你無法知道先達到 Target 定 Stop，因此不能直接當成 +2R。你可以：

1. 使用 1-minute、秒級或更細數據核對。
2. 如果無法取得，標記 **AMBIGUOUS**。
3. 事前定義保守處理方法，並做不同假設下嘅敏感度分析。

亦要檢查如果係 Entry 同 Stop 喺同一支 K 線出現，係咪知道 Trigger 後價格先後。冇完整盤中路徑，就唔好假裝知道每一筆成交。

## 5.6 第四步：逐日完成後先計算績效

當一日 Replay 完成，你應該有：當日有幾多初步 Breakout？幾多有 Retest？幾多符合確認條件？幾多真正 Trigger Entry？幾多成交後止賺或止損？幾多需要標記為成交先後不明？總淨 P&L 同 Net R？有冇違反規則？

:::key 記住
真正嘅策略測試，唔係每一日一定要有交易。**一日零筆交易，亦可以係一個完整而且正確嘅測試結果。**
:::

[[quiz:l5-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c6', num: '6', title: '交易成本與成交模擬', mins: 7,
  summary: '四種價格要分開；R 倍數用實際成交計；每套策略最少做三個成本情境。',
  keywords: ['Fill', 'Net R', 'Cost Scenario', 'Paper Trading'],
  md: `
之前你學過 Entry $386.10、Stop $384.70、Target $388.90，計劃 Reward / Risk = 2R。但回測**唔可以直接假設每次都能夠按照呢三個價位完美成交**。

## 6.1 四種必須區分嘅價格

| 價格 | 意思 |
|---|---|
| Signal Price | 技術訊號對應嘅價格 |
| Order Trigger | 入場訂單嘅觸發水平 |
| Actual Fill | 真正或模擬成交價格 |
| Exit Fill | 實際或模擬離場成交價格 |

假設 Trigger $386.10，實際 Buy Fill $386.22；Stop Trigger $384.70，實際 Sell Fill $384.48。每股實際虧損：386.22 − 384.48 = **$1.74**，而唔係原本計劃嘅 $1.40。

## 6.2 R 倍數要用一個固定定義

$$ Initial Risk = (Entry Fill − Initial Stop) × Shares $$
$$ Net P&L = (Exit Fill − Entry Fill) × Shares − Fees $$
$$ Net R = Net P&L ÷ Initial Risk $$

例如 Entry Fill $386.22、Initial Stop $384.70、Exit Fill $384.48、Shares 14、Fees $2：

- 初始計劃風險：(386.22 − 384.70) × 14 = **$21.28**
- 實際淨虧損：(384.48 − 386.22) × 14 − 2 = **−$26.36**
- Net R = −26.36 ÷ 21.28 ≈ **−1.24R**

即係明明你原本設咗約 1R 嘅止損，最後仍然可能輸超過 1R。用 Excel 時應該保留負數結果，唔好自動將所有止損硬性記成 −1R。

[[tool:netr]]

## 6.3 必須測試三個成交成本情境

| 成交成本模型 | 平均每筆成本 | 結果（示例） |
|---|---|---|
| Ideal | 0R | +0.15R |
| Base | 0.10R | +0.05R |
| Stress | 0.25R | −0.10R |

點理解？呢套策略可能有少量理論優勢，但**對成交成本極度敏感**。尤其 5-minute Day Trading，如果每筆預期盈利唔大，Spread 同 Slippage 就可能成為決定性因素。因此每套策略都做至少三個 Cost Scenarios，而唔係只睇理想回測。仲要留意成本可能隨股票波幅、訂單大小、交易時段而改變，未必可以用一個固定滑價值完全代表。

## 6.4 IBKR Paper Trading 成交唔等於真實成交

IBKR 官方解釋，Paper Trading 係模擬環境，成交主要以 Order Book 頂部資料模擬，並唔完整反映真實深度；Stop 及其他複雜訂單嘅行為亦可能同 Live Trading 有差異。因此：**Paper Trading 正期望值係有用嘅研究證據，但唔係真實盈利保證。**

[[quiz:l5-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c7', num: '7', title: '完整 Trading Journal', mins: 6,
  summary: '原課程嘅 Excel 工作簿結構，同本平台內置交易日誌嘅用法。',
  keywords: ['Journal', 'Candidates', 'Trades', 'Dashboard'],
  md: `
原課程附有一份 **TSLA Level 5 Backtesting Workbook（Excel .xlsx，7 個工作表）**，自動計算 VWAP、Net R、勝率、Expectancy、Profit Factor、Drawdown。本平台將同樣嘅結構做成網頁版 **📒 交易日誌**，唔使開 Excel 都用得。

## 7.1 工作簿入面有乜？

| 工作表 | 用途 | 本平台對應 |
|---|---|---|
| START_HERE | 使用方法、重要注意事項、官方數據來源 | 本章 |
| RULES | 定義策略版本、本金、風險、RVOL、Retest 參數 | 工具箱 → 策略規則卡 |
| BARS_5M | 輸入 OHLCV，自動計算 Session VWAP、CLV、RVOL | 工具箱 → CSV 數據檢查器 |
| CANDIDATES | 記錄所有候選 Setup，包括未成交、取消及放棄 | 交易日誌 → 候選紀錄 |
| TRADES | 記錄已執行模擬交易及實際成交價格 | 交易日誌 → 交易紀錄 |
| DASHBOARD | 自動統計 Net R、勝率、Expectancy、Drawdown | 交易日誌 → 統計 |
| PRACTICE_EXAMPLE | 虛構 TSLA 逐支 K 線示範 | 互動練習 → K 線重播 |

## 7.2 第一次使用建議次序

:::steps
1. **打開 RULES**：檢查 Strategy ID、模擬本金、每筆風險比例、最低 R:R、Retest 最多等待幾多支 Candle、RVOL 門檻。呢啲設定應該喺正式測試之前決定。
2. **輸入 BARS_5M**：將確認過嘅歷史 RTH 5m Candle，按交易日期同美東時間由早至晚輸入。
3. **用 TradingView Replay 觀察**：當出現符合候選條件嘅 Setup，就填 CANDIDATES。即使最後冇落模擬單，亦要記錄原因。
4. **將真正已成交嘅模擬交易填入 TRADES**：包括 Planned Entry、Actual Entry、Initial Stop、Target、Shares、Actual Exit、Round-trip Fees。
5. **查看 DASHBOARD**：總交易數、勝率、平均 Win / Loss、Net Expectancy、Profit Factor、Drawdown、執行規則遵守比例等。
:::

:::info 留意
Dashboard 嘅 Drawdown 係根據逐筆已實現盈虧計算嘅 Equity 曲線，唔係盤中浮動權益嘅完整最大回撤。
:::

## 7.3 點解需要兩份紀錄？

| 假設某段回測樣本 | 數量 |
|---|---|
| Breakout Candidates | 80 |
| 出現 Retest | 50 |
| 完成 Confirmation | 32 |
| 觸發入場及模擬成交 | 24 |
| 盈利交易 | 10 |

以上全部係虛構例子。如果你只記 24 筆已成交交易，就會失去之前 80 個候選訊號嘅資訊。你需要知道：有幾多機會根本冇 Retest？有幾多完成確認但未能成交？有幾多被風險回報條件排除？係咪某個 Filter 令大部分訊號消失？呢啲都係 Trading System Development 嘅一部分。

[[chart-funnel:80,50,32,24,10]]

## 7.4 你必須養成一個習慣

:::key 先記錄 Setup，再播放下一支 Candle
唔好等知道輸贏之後先返去補填。否則好容易將失敗機會解釋成：「其實嗰個唔算真正 Setup。」久而久之，策略勝率就會被人為美化。
:::

[[link:journal|📒 打開交易日誌]]

[[quiz:l5-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c8', num: '8', title: 'Trading Statistics', mins: 9,
  summary: 'Net vs Gross Expectancy、打和勝率、樣本誤差、同一日交易唔獨立。',
  keywords: ['Net Expectancy', 'Breakeven Win Rate', '信賴區間', 'Bootstrap'],
  md: `
你已經學識計 Win Rate、Profit Factor 同 Expectancy。但 Level 5 要更深入：**單單睇勝率，甚至單單睇正期望值，都不足以證明策略具有穩定優勢。**

## 8.1 先用 30 筆模擬交易理解統計

一套 Breakout + Retest 策略完成 30 筆交易：12 筆盈利、18 筆虧損；平均盈利 +1.8R、平均虧損 −1R。

$$ Win Rate = 12 ÷ 30 = 40% $$
$$ Gross Profit = 12 × 1.8R = 21.6R；Gross Loss = 18 × 1R = 18R $$
$$ Gross Result = 21.6R − 18R = +3.6R；Expectancy = 3.6R ÷ 30 = +0.12R $$

咁係咪證明策略賺錢？**仲未。**

## 8.2 加入交易成本

假設每筆交易平均成本 = 0.15R：30 × 0.15R = 4.5R。

$$ Net Result = 3.6R − 4.5R = −0.9R；Net Expectancy = −0.9R ÷ 30 = −0.03R $$

| 勝率 | 未扣成本 | 扣成本後 |
|---|---|---|
| 40% | +0.12R | **−0.03R** |

所以你之後應該優先研究 **Net Expectancy**，唔係單純 Gross Expectancy。

## 8.3 Breakeven Win Rate（打和勝率）

平均盈利 +2R、平均虧損 −1R，未計成本時：

$$ Breakeven Win Rate = 1 ÷ (2 + 1) = 33.33% $$

如果每筆另有固定成本 0.15R：p(2) − (1 − p)(1) − 0.15 = 0，解得：

$$ p = 1.15 ÷ 3 ≈ 38.33% $$

即係喺呢個簡化模型下，需要高過約 38.33% 勝率，平均結果先可以轉正。但真實交易通常唔係每筆精準 +2R 或 −1R，可能有 +1.5R、+0.3R、−0.4R、−1.2R。因此正式計算最好直接使用**逐筆 Net R**。

## 8.4 互動實驗：Strategy Expectancy Lab

[[tool:expectancy-lab]]

:::tip 試以下組合
- 勝率 35%，平均盈利 2.5R。
- 勝率 60%，平均盈利只有 0.6R。
- 成本由 0.05R 增加到 0.30R。

你會發現：有啲低勝率策略可以有正期望值；有啲高勝率策略仍然可能虧損；而成本越高，策略越需要更大平均利潤或者更高勝率去補償。
:::

## 8.5 樣本數量：100 筆交易足唔足夠？

測試咗 100 筆，45 筆贏，勝率 45%。你可唔可以話「我套策略真正勝率就係 45%」？**唔可以。** 因為樣本本身有隨機波動。用最簡單嘅二項分布近似、暫時假設每筆結果獨立：

$$ SE = √( p(1 − p) ÷ n ) = √(0.45 × 0.55 ÷ 100) ≈ 4.97% $$

以簡單常態近似，95% 信賴區間幅度約為 1.96 × 4.97% ≈ 9.74%，即大約 **35.3%–54.7%**。

呢個只係解釋樣本不確定性嘅簡化示例。真實交易可能有連續相關、市況變化、選樣偏差。但佢告訴你一件重要事情：**就算有 100 筆交易，勝率估計仍然可能存在相當大嘅不確定性。**

[[tool:ci]]

## 8.6 唔好將同一日十筆交易當成十份獨立證據

例如 TSLA 某日持續單邊上升，你有五筆 Breakout + Retest Long，全部贏。呢五筆交易可能受到同一個市場環境影響，並非完全獨立。

如果你之後想更深入估算不確定性，可以使用**按交易日分組嘅 Bootstrap（重抽樣）**方法 —— 抽取一整日嘅交易結果，而唔係完全打散每筆交易。呢個可以保留部分同一日內交易之間嘅相關性，但亦唔能夠解決所有時間序列問題。

對現階段嘅你，最重要係：唔好用太少、太集中嘅樣本，對策略抱有過高信心。

[[quiz:l5-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c9', num: '9', title: 'Equity Curve、Drawdown、連敗', mins: 8,
  summary: '同樣賺 +20R，回撤可以差好遠；MAE / MFE 點用；每日結果分析。內有 Monte Carlo 模擬器。',
  keywords: ['Equity Curve', 'Max Drawdown', 'MAE', 'MFE', 'Monte Carlo'],
  md: `
Level 4 你已經學過 Drawdown。Level 5 需要真正用佢去判斷策略嘅風險特徵。

## 9.1 Equity Curve 係乜？

Equity Curve 即係你嘅模擬帳戶價值隨交易結果改變嘅曲線。

[[chart-equity:10000,10050,9980,9900,10060,10010,9850,9720,9800,9950,10100,10060,10200]]

你應該留意：呢條曲線最後上升，唔代表中途冇大幅回撤；亦唔代表未來會按照同一條曲線發展。

## 9.2 兩套策略，總盈利一樣，風險可能差好遠

| 指標 | Strategy A | Strategy B |
|---|---|---|
| 總 Net R | +20R | +20R |
| 最大回撤 | −5R | −18R |
| 最大連敗 | 4 筆 | 11 筆 |
| Equity 波動 | 相對平穩 | 非常大 |

只睇最後總利潤，兩者似乎冇分別。但如果 Strategy B 中途出現 −18R 回撤，對你嘅資金同策略執行能力，可能係非常大嘅挑戰。因此一套策略除咗 Expectancy，仲要研究**到達該收益過程中承受咗幾多風險**。

[[tool:monte-carlo]]

## 9.3 Maximum Adverse Excursion（MAE）

Long TSLA $386，Initial Stop $384.50，Initial Risk = $1.50。持倉期間最低曾到 $385.40，股價曾經對你不利移動 $0.60：

$$ MAE = 0.60 ÷ 1.50 = 0.4R $$

如果大量成功交易嘅 MAE 都非常細，但你原本 Stop 放到 3R 距離先會觸發，可能值得研究止損是否過遠。但**唔可以單憑成功交易嘅 MAE 去縮窄 Stop** —— 因為咁樣忽略咗失敗交易同本來會因較窄 Stop 被提早排除嘅盈利交易。正確方法係：重新用全部符合條件嘅歷史交易，測試新止損規則。

## 9.4 Maximum Favorable Excursion（MFE）

同一筆交易，持倉期間最高 $388.40：MFE = $2.40 ÷ $1.50 = **1.6R**，即持倉期間曾有 +1.6R 浮動毛利。

你可以利用 MFE 分析：原本固定 2R Target，係咪太遠？有幾多筆交易曾經到 1.5R，但最後仍然止損？有幾多筆能夠達到 3R？但再次提醒：MFE 係過程統計，唔等於你實際能夠喺最高點賣出。

## 9.5 用每日結果分析風險

| 日期 | 交易數 | Net R | 當日市場環境 |
|---|---|---|---|
| Day 1 | 2 | +2.0R | Trend |
| Day 2 | 0 | 0R | Chop |
| Day 3 | 3 | −2.7R | Range |
| Day 4 | 1 | +1.8R | Trend |
| Day 5 | 2 | −1.4R | News |

全部虛構。你應該問：係咪某些市況容易連敗？係咪每日最大交易次數影響結果？係咪某個時間段經常出現不利滑價？係咪使用同一套 Setup，於不同日子有巨大表現差異？但要小心避免只根據幾日樣本就得出結論。

[[quiz:l5-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c10', num: '10', title: '市場環境分類 Market Regime', mins: 7,
  summary: '同一套策略某啲日子好用、某啲唔好用；Regime 一定要用「入場當刻已知」嘅資料分類。',
  keywords: ['Market Regime', 'Trend Regime', 'Volatility Regime', 'ATR'],
  md: `
**Market Regime**，即係當時市場處於乜嘢狀態。之前你學過 Uptrend、Downtrend、Range、Choppy Market，Level 5 要進一步將佢哋加入回測。

## 10.1 假設同一套 Setup 有三種表現

| Market Regime | Trades | Net Expectancy |
|---|---|---|
| Trending | 40 | +0.32R |
| Range | 35 | −0.08R |
| Choppy | 25 | −0.30R |

如果結果經過足夠驗證，你可能發現 Breakout + Retest 喺某種明確趨勢環境較有研究價值，但喺橫行或者混亂市場表現較差。咁下一步可能唔係增加 MACD 或 RSI，而係研究：**可唔可以喺入場之前，客觀識別當刻市場環境？**

## 10.2 最重要：唔可以用「全日結果」倒轉分類

例如你睇完 TSLA 一整日由 $380 升到 $400，之後話：「今日係 Trending Day，所以早上全部 Long Signal 都應該保留。」**呢個係錯誤做法。** 因為早上 9:45，你根本未知道今日最後會升到 $400。你需要定義**入場當刻可判斷**嘅 Market Regime：

| 條件 | 當時可否知道？ |
|---|---|
| 15m 最近已確認 HH + HL | ✅ 可以 |
| 當時價格高於已計算 Session VWAP | ✅ 可以 |
| VWAP 最近幾支已完成 K 線斜率向上 | ✅ 可以 |
| 前 30 分鐘 Opening Range High | ⏰ 10:00 之後可以 |
| 今日最終 High / Low | ❌ 當時唔可以 |
| 今日收市係大陽燭 | ❌ 當時唔可以 |

任何必須等收市後先知道嘅資訊，都唔可以用嚟決定早上入場。

[[tool:knowable]]

## 10.3 點樣定義 Trend Regime？

初學版可以試：

- 15m 最近兩個已確認 Swing High / Low 符合 HH + HL。
- 價格高於 Session VWAP。
- VWAP 最近三支已完成 5m K 線向上。
- 價格唔係反覆穿越同一價格區間。

但你要記住：每一個 Swing 都要有固定定義，而且**只可以喺其確認時間之後使用**。否則你用 Pivot Indicator 畫出嚟嘅歷史結構，可能引入未來資料。

## 10.4 Volatility Regime（波幅環境）

同樣係 TSLA，有啲日子每支 5m Candle 只波動 $0.50，有啲日子可能波動 $3–$5。你應該比較：ATR、當時已完成 Opening Range 嘅寬度、最近若干支 Candle 嘅平均 Range。但唔應該用全日最終波幅分類當日上午市況。

低波幅、中波幅、高波幅門檻，亦應該**由訓練資料定義，再套用到獨立測試資料**。唔好睇完結果先搵最有利嘅門檻。

[[quiz:l5-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c11', num: '11', title: 'Overfitting 與敏感度分析', mins: 8,
  summary: '回測愈改愈靚反而愈危險；27 個參數組合同 Selection Bias；Strategy Version Log。',
  keywords: ['Overfitting', 'Selection Bias', 'Sensitivity', 'Version Log'],
  md: `
**Overfitting（過度擬合）** 係系統化交易最重要嘅陷阱之一。簡單講：你不斷修改策略，令佢完美配合過去發生過嘅行情，但未必適合未來。

## 11.1 一個典型例子

第一版規則：RVOL ≥ 1.5、Retest 最多六支 Candle、Target 2R。回測結果唔理想，於是你開始修改：

:::steps
1. RVOL 改 2.0。
2. Retest 只等四支。
3. Target 改 2.5R。
4. 加上 VWAP 斜率限制。
5. 禁止星期一交易。
6. 只做 10:15–11:30。
:::

最後你得到一套喺歷史數據入面非常漂亮嘅策略。但問題係：你已經使用過去結果，不斷尋找最適合該段歷史嘅條件，有機會只係將**歷史上偶然出現嘅特徵當成真正規律**。

[[tool:overfit-demo]]

## 11.2 Parameter Optimization 可以用，但必須有紀律

| 參數 | 研究數值 |
|---|---|
| RVOL | 1.0、1.5、2.0 |
| Retest Window | 3、6、9 支 |
| Target | 1.5R、2R、2.5R |

$$ 3 × 3 × 3 = 27 種組合 $$

你可能發現其中一種組合喺過去數據表現最好。但如果你只將最好嗰個結果公開，忽略其餘 26 個，就有 **Selection Bias（選擇偏差）** 風險。

## 11.3 睇一個虛構優化結果

| 參數組合 | Net Expectancy |
|---|---|
| RVOL 1.0 / Retest 6 / Target 2R | +0.08R |
| RVOL 1.5 / Retest 6 / Target 2R | +0.12R |
| RVOL 2.0 / Retest 6 / Target 2R | +0.09R |
| RVOL 1.5 / Retest 3 / Target 2R | +0.10R |
| RVOL 1.5 / Retest 9 / Target 2R | +0.11R |

假設不同合理參數都得到正值，可能比只有一個極端組合獲利更值得研究。相反，如果 RVOL = 1.49 得到嚴重虧損、RVOL = 1.50 得到非常高盈利、RVOL = 1.51 又再次大幅虧損，就要小心策略是否過度依賴特定歷史噪音。當然，鄰近參數表現接近亦唔足以單獨證明優勢；只係一項穩健性檢查。

## 11.4 Sensitivity Analysis（敏感度分析）

你應該問：**如果稍微改變一個參數，結果會唔會完全崩潰？** 例如：

- Entry Buffer 由 $0.05 變 $0.10。
- 滑價增加 $0.05。
- Target 由 2R 改 1.8R。
- VWAP 確認晚一支 Candle。
- 某些原本假設可成交嘅 Limit Order，實際冇成交。

一套策略如果只有非常理想情況先勉強賺錢，未必適合真實執行。

## 11.5 建立 Strategy Version Log

| 版本 | 修改 | 修改原因 | 測試狀態 |
|---|---|---|---|
| v1.0 | 初始固定規則 | 建立基準 | 待驗證 |
| v1.1 | RVOL 門檻變更 | 研究成交量確認價值 | 待測試 |
| v1.2 | Retest Window 變更 | 研究時間敏感度 | 待測試 |
| v1.3 | Exit Rule 變更 | 研究盈利回吐 | 待測試 |

記錄之外，仲要保留：使用過邊段訓練資料、使用過邊段樣本外資料、結果係咪已經被你用嚟調整策略。**一段資料如果已經多次用嚟揀參數，就唔應該再當成完全獨立嘅新測試。**

:::tip 小技巧
用每章底部嘅「📝 筆記」功能記低你每個版本嘅改動同原因，日後搵返好方便。
:::

[[quiz:l5-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c12', num: '12', title: 'In-Sample / Out-of-Sample / Walk-Forward', mins: 7,
  summary: 'Train / Validate / Test 三段按時間切；睇完 Test 再改就唔再獨立；Walk-Forward 滾動測試。',
  keywords: ['In-Sample', 'Out-of-Sample', 'Walk-Forward', 'Validation'],
  md: `
呢章係真正驗證交易策略非常重要嘅部分。

## 12.1 In-Sample（樣本內）係乜？

In-Sample 係你用嚟建立策略、調整參數、研究失敗原因、選擇模型版本嘅歷史數據。例如你有 100 個已完成交易日，先用較早 60 日研究策略，呢 60 日就係 In-Sample。

## 12.2 Out-of-Sample（樣本外）係乜？

假設你已經用頭 60 日將規則固定成 v1.0，然後用**未參與任何調整**嘅後續 20 日測試，呢 20 日就係 Out-of-Sample。你要檢查：策略係咪仍然出現相似嘅 Setup？成交成本敏感度有冇惡化？Net Expectancy 是否仍然合理？最大回撤有冇大幅增加？

如果樣本外結果大幅變差，可能代表之前策略過度擬合，或者市場環境已經改變。**唔應該直接將樣本外失敗例子移除，再宣稱策略有效。**

## 12.3 用一個 100 日例子理解

[[split:60,20,20]]

| 階段 | 用途 | 可否調整策略？ |
|---|---|---|
| Train | 建立初始規則 | 可以 |
| Validation | 選擇版本及檢查穩定性 | 可以比較，但須記錄所有調整 |
| Test | 最後獨立驗證 | 不應根據結果繼續優化同一測試 |

當你睇完 Test 結果並根據佢修改策略，原本 Test 就已經成為開發資料，唔再完全獨立。如果要重新驗證，應保留另一段未被使用嘅資料。

## 12.4 Walk-Forward Testing（滾動向前測試）

市場會改變：TSLA 波幅增加、市場交易活動改變、消息日比例改變、某種突破方式開始經常失效。因此你可以使用 Walk-Forward 方法：

[[walkforward]]

真正嘅 Walk-Forward 應該只匯總各輪**從未參與該輪參數調整**嘅測試結果，而唔係只揀表現最好嗰一輪。如果有持倉或訊號跨越分割邊界，仲需要避免樣本之間嘅標籤或價格資訊洩漏。

## 12.5 策略最終應通過乜嘢測試？

[[check:l5-pass]]

即使全部符合，亦只係代表有比較充分嘅研究基礎，**唔係未來盈利保證**。

[[quiz:l5-c12]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c13', num: '13', title: 'Forward Paper Trading', mins: 6,
  summary: '用未知嘅未來價格測試自己能否按規則執行；記錄每個階段時間；Execution Error Rate。',
  keywords: ['Forward Testing', 'Compliance', 'Missed Trade', 'Paper Trading'],
  md: `
假設你完成咗歷史 Backtesting，結果顯示策略可能有正期望值。下一步係：**用未知嘅未來價格，測試自己能否真正按照規則執行**。唔係立即使用真錢。

## 13.1 Forward Testing 應該點做？

你可以使用 TradingView Paper Trading 或 IBKR Paper Trading，但必須將策略規則固定。例如：

| 項目 | 設定 |
|---|---|
| Strategy ID | TSLA-BR-LONG-v1.0 |
| 本金 | US$10,000（由你獨立追蹤嘅模擬研究資金） |
| 方向 | Long Only |
| 時間框架 | 5m |
| Setup | Breakout + Retest |
| Entry | 突破已完成確認 Candle 嘅 High 加預定 Buffer |
| Stop | 按事前結構規則 |
| Target | 下一阻力位或者你已經測試過嘅固定方式 |
| 每日限制 | 最多新交易次數及虧損限制亦要事前寫清 |

## 13.2 要記錄每個階段嘅時間

| Event | Time (ET) |
|---|---|
| Key Level 畫好 | 09:25 |
| Breakout Candle 完成 | 09:55 |
| Retest 出現 | 10:05 |
| Confirmation 完成 | 10:10 |
| Entry Order 提交 | 10:10:15 |
| Entry Fill | 10:12:04 |
| Exit Fill | 10:28:37 |

呢啲時間係虛構示例。你應該記錄嘅係：**訊號幾時已經可以知道，同訂單幾時真正提交及成交**。如果因為自己遲咗見到訊號，Entry 已經唔符合原本 R:R，就記錄為 Missed Trade 或 Skip。唔好假裝自己一定可以喺最理想時刻成交。

## 13.3 Execution Error Rate（執行錯誤率）

除咗 Win Rate，你仲應該研究：有幾多次符合策略嘅 Setup，實際無法按照規則執行？例如總共 40 個有效模擬入場訊號，其中 30 次按規則完成、4 次錯過、3 次入場太遲、2 次下錯訂單類型、1 次意外取消咗 Stop：

$$ Compliance = 30 ÷ 40 = 75% $$

代表只有 75% 機會按照預定計劃完成。即使策略本身可能有統計優勢，你嘅實際執行仍然需要改善。

[[tool:compliance]]

## 13.4 TradingView Replay 同 IBKR Paper 有乜唔同？

TradingView 官方有獨立 Replay Trading 模式，可以喺歷史 Bar Replay 進行模擬交易及設定相關成本；佢同一般 Paper Trading 係兩種唔同環境。IBKR Paper Trading 則用模擬方式處理訂單，並唔會喺真實交易所完成成交，其成交及 Stop 行為可能同 Live Trading 有差別。建議：

- **階段 A**：TradingView Replay，專心訓練策略訊號。
- **階段 B**：IBKR Paper，專心訓練訂單執行、Bracket、取消及持倉管理。
- **階段 C**：將兩者嘅數據同你嘅 Journal 比較，了解策略與實際模擬執行之間嘅差異。

唔好假設喺 Replay 可以用某個價成交，IBKR Paper 或真實市場就一定可以做到。

[[quiz:l5-c13]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c14', num: '14', title: 'TSLA 完整案例', mins: 8,
  summary: '由原始 K 線到交易結果：取得數據 → 掃描突破 → Retest → Trigger → 成交 → 退出 → 記錄。',
  keywords: ['完整案例', 'UNKNOWN', 'Fill 模型'],
  md: `
呢章將成套 Level 5 串連一次。但今次要特別區分：**圖表研究、策略判斷、交易回測、統計結論，係四個唔同階段。**

## 14.1 第一階段：取得一日 TSLA 數據

揀任何一個資料完整嘅正常交易日，需要當日完整 5m OHLCV，以及計算歷史水平所需嘅先前交易日資料。

:::steps
1. 確認日期、時區、交易所及交易時段。
2. 取得當日 78 支 RTH 5m K 線。
3. 取得前一交易日 High / Low。
4. 如使用 Premarket High / Low，另行取得盤前資料。
5. 使用過去交易日資料確認 15m 結構。
6. 確保所有水平喺入場訊號之前已經可知。
7. 計算當日逐支 Session VWAP。
8. 根據事前定義計算 RVOL at Time。
:::

完成之後，先開始掃描 Setup。

## 14.2 第二階段：逐支掃描 Breakout

原本 Resistance Zone = $384.80–$385.20。當日 09:50 Candle：Open $384.85、High $385.80、Low $384.72、Close $385.56、Volume 1.55M。

可以初步判斷 Close 高於 Zone Upper，但仲需要確認：RVOL 有冇達到 1.5？當時價格係咪高於 Session VWAP？15m Market Filter 有冇符合？有冇事件風險或其他取消條件？因此就算見到一支靚突破 Candle，仍然唔可以立即當作完整合格 Setup。

:::warn UNKNOWN 唔等於 PASS
如果 RVOL 所需歷史資料未有取得，就應標記該條件為 **UNKNOWN**，唔係直接當作通過。
:::

## 14.3 第三階段：Retest

下一支 Low $385.04、Close $385.31，即價格回到舊阻力區，然後收喺區域上方。你可以開始研究：Retest 是否符合預定觸及區域條件？Close 是否符合回測要求？下一步需要咩確認？如果規則要等下一支 Candle 出現向上確認，就繼續 WAIT。唔可以因為已經知道未來價格會反彈，就提前入場。

## 14.4 第四階段：Confirmation 同 Trigger

另一支已完成 Candle：High $386.02、Close $385.94。v1.0 Entry Rule：High + $0.05：

$$ Entry Trigger = $386.07 $$

止損按事前定義嘅 Retest Low 減緩衝：Retest Low $385.04 − $0.10 = **$384.94**。

$$ 每股風險 = 386.07 − 384.94 = $1.13 $$
$$ Target $388.50：Reward = 388.50 − 386.07 = $2.43 $$
$$ Reward / Risk = 2.43 ÷ 1.13 ≈ 2.15R $$

但依然要檢查 VWAP、RVOL 及其他必須條件有冇真正符合。計到 R:R 合理，唔代表自動可以入場。

## 14.5 第五階段：成交確認

下一支價格最高 $386.35，即曾經到過 Trigger。但應按照已選定嘅 Order Fill 模型處理：如果使用 Buy Stop，你仲需要模擬不利滑價；如果實際係 Stop-Limit，可能因市場直接跳過可接受價位而未成交。唔可以所有符合 Trigger 嘅交易，都直接假設完美成交。

## 14.6 第六階段：退出

之後價格下跌到 $384.60，原本 Stop $384.94 已經被穿越。你需要根據交易路徑及訂單模型，估算 Exit Fill，然後記錄：Gross P&L、Commission、Slippage、Net P&L、Net R、MFE、MAE、Rule Compliance。如果同一支 Candle 同時有其他重要觸發事件，必須處理時間順序不明嘅問題。呢個完整流程，先叫做一筆可以納入正式研究嘅回測交易。

## 14.7 但只得一日，唔可以得出策略結論

就算你完成當日全部 78 支 Candle，搵到兩筆成功交易，你仍然唔可以話「Breakout + Retest 對 TSLA 有效」。最多可以話：「根據呢一日可得資料，按照預定回測假設，策略產生咗某些交易結果。」要估算可重複性，仍然需要跨日、跨市況、足夠數量嘅樣本。

[[quiz:l5-c14]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c15', num: '15', title: '30 日實踐計劃', mins: 6,
  summary: '四個星期：數據與規則 → 正式回測 → 統計分析 → 獨立驗證。每日可以剔。',
  keywords: ['30 日計劃', '訓練'],
  md: `
建議將 Level 5 分成四個階段，避免一次過混合數據研究、交易執行同參數優化。每完成一日就剔一格。

[[check:l5-plan]]

:::warn 30 日係訓練流程，唔係策略驗證期限
如果交易數量太少，應繼續擴大樣本，而唔係硬性喺第 21 日宣稱策略有效。如果樣本不足、數據唔可靠或者條件未固定，就應該延長研究。
:::
`},
/* ------------------------------------------------------------------ */
{
  id: 'l5-c16', num: '16', title: 'Level 5 測驗與畢業標準', mins: 9,
  summary: '八題策略驗證測驗、十二項畢業清單、Level 1–5 完整進化。',
  keywords: ['測驗', '畢業標準', 'Level 1–5'],
  md: `
呢部分會集中測試你係咪真正明白「**策略驗證**」同「**事後分析**」嘅分別。

## 16.1 Level 5 —— Strategy Validation Exam

[[quiz:l5-final]]

## 16.2 Level 5 畢業標準：由「識睇圖」變成「識驗證策略」

[[check:l5-grad]]

## 16.3 Level 1 至 Level 5 嘅完整進化

| Level | 階段 | 最重要問題 |
|---|---|---|
| 1 | Tools | 我睇緊乜嘢指標？ |
| 2 | Price Action | 市場發生緊乜？ |
| 3 | Trading Setups | 乜嘢條件值得研究入場？ |
| 4 | Execution & Risk | 點樣執行及限制風險？ |
| 5 | Strategy Validation | 呢套方法經過完整測試後，仲有冇可重複嘅優勢？ |

## 16.4 而家最優先做嘅一件事

你已經學咗五個 Level。如果繼續無止境學更多技術指標，你可能會越學越覺得複雜。反而，建議你而家先集中做好一個實際任務：

:::key 用一個真實 TSLA 交易日，完整 Replay 78 支 5-minute Candle
唔需要第一日就交易。先根據當時已知嘅資料，畫好 PDH、PDL 同重要支持阻力，逐支記錄市場結構、價格反應、Volume、VWAP，以及每個 Breakout + Retest 候選。之後先記錄真正符合條件嘅模擬交易，再將方法複製到第二日、第三日，逐步建立完整樣本。
:::

有實際 TSLA 5-minute CSV 之後，就可以由純教學例子，正式轉為分析真實歷史資料，逐支核對 Setup、計算交易結果，再判斷方法是否值得進一步測試。

你喺 Level 5 最需要建立嘅能力，唔係解釋點解過去某支股票升咗，而係**喺當時未知道結果嘅情況下，仍然可以按照明確規則作決定，並用完整數據檢查呢套規則究竟有冇價值**。

[[link:journal|📒 開始記錄你嘅第一筆模擬交易]]
`},
  ],
});
