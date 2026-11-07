/* Level 13：落盤效率 —— 注意力、開市前計劃、IBKR Bracket Order、Presets 同 Hotkeys、交易節奏 */
window.COURSE = window.COURSE || [];

window.COURSE.push({
  id: 'l13',
  code: 'Level 13',
  title: '落盤效率：IBKR Bracket、計算器同交易節奏',
  subtitle: '點解唔使同時睇晒、開市前將計算做晒、一個 Mon 嘅佈局、警報代你睇、IBKR Bracket Order（TWS、IBKR Desktop、手機）、Presets 同 Hotkeys、開市後管理、一日節奏',
  icon: '⚡',
  color: '#0369a1',
  question: '開市嗰陣要睇咁多嘢、計咁多數，點樣先做得切？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l13-c1', num: '1', title: '點解有經驗嘅人唔係「同時睇晒」', mins: 6,
  summary: '佢哋唔係睇得快，而係開市前已經做完九成功課：揀好 1–2 隻、計好股數、寫好 If-Then、設好警報。開市時只係核對三樣嘢。開市先開始計數，就已經遲咗。',
  keywords: ['注意力', '效率', '開市前準備'],
  md: `
:::info 呢個 Level 點嚟
用戶問：「Trading 嗰陣同時要睇咁多嘢，點做到？點樣喺 IB 入面 Set Bracket Order？有冇輔助工具可以快啲計？」呢個 Level 答晒，仲加咗兩個新工具：**🛫 開市前計劃表** 同 **⚡ IBKR Bracket 落單卡**。
:::

## 1.1 漏斗：由幾千隻股減到 1 隻

| 時間（美東） | 做咩 | 剩低幾多隻 |
|---|---|---|
| 08:00 | 睇每日選股報告（9 個 Indicator 已經篩好） | 5–7 隻 |
| 08:40 | 揀最好嘅 2–3 隻，計好股數、設警報 | 2–3 隻 |
| 09:30–09:35 | 唔落單，淨係睇 | 2–3 隻 |
| 09:35 之後 | 邊隻警報先響、條件啱，就做邊隻 | **1 隻** |

**開市時你唔需要睇幾十樣嘢**，因為大部分嘢（Gap、RVOL、Float、ATR、Spread、新聞、PDH、PMH）**開市前已經睇完**，寫咗喺計劃度。

## 1.2 開市時真正要睇嘅三樣嘢

:::key 只睇呢三樣
1. **價格到咗觸發價未？**（警報會話你知）
2. **首 5 分鐘成交夠唔夠？**（計劃已經寫咗要幾多股）
3. **價格喺 VWAP／EMA 9 啱嗰邊？**（睇一眼圖）
:::

三樣都啱 → 按計劃落單（股數、Stop、Target 已經計好）。有一樣唔啱 → 唔做。**唔需要即場諗、即場計。**

:::coach 一句講晒
如果開市嗰陣你仲要撳計數機，你已經遲咗。所有計算都應該喺 09:30 之前做完。下一章嘅工具就係幫你做呢樣嘢。
:::

[[quiz:l13-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c2', num: '2', title: '開市前將計算做晒：開市前計劃表', mins: 7,
  summary: '開市前計劃表會自動讀今日選股報告，用你嘅本金同每筆風險，一次過計好每隻嘅股數、風險金額、需要現金、唔追價、+1R 移 Stop 價同警報價位。開市時淨係核對。',
  keywords: ['計劃表', '股數', '警報'],
  md: `
## 2.1 先設定一次

撳開「⚙️ 我嘅設定」，輸入一次就得（所有落單工具共用）：

| 設定 | 建議（新手） | 點解 |
|---|---|---|
| 本金 | 你真係用嚟 Day Trade 嘅錢 | 唔係全部身家 |
| 每筆風險 | 本金 0.25–0.5% | Level 11 第一個月計劃 |
| 每隻最多用本金 | 50% | 唔好全部錢押一隻 |
| 戶口類型 | Cash 定 Margin | Cash 戶口唔可以沽空 |
| 每日虧損上限 | 3R | 蝕夠就收工 |

## 2.2 今日計劃表

[[tool:open-cockpit]]

:::tip 點用
1. **08:40 左右**打開（報告通常 08:40 前出）
2. 睇「股數」同「風險」：灰色嗰行即係唔做得（風險太大、Cash 戶口唔沽空）
3. 撳「📋 複製警報價位」，貼去 TradingView 或者 IBKR 設警報（第 4 章）
4. 想落單就撳嗰隻嘅「⚡ 落單卡」，入面有 IBKR 三張單要填嘅數字
5. **08:30 經濟數據**之後價位可能變，09:25 再睇一次圖
:::

:::warn 計劃表唔係落單指令
數字由報告計出嚟，報告係開市前嘅數據，可能有錯。落單前一定要喺圖上核對價位。App 唔會亦唔可以幫你落單。
:::

[[quiz:l13-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c3', num: '3', title: '一個 Mon 都夠：畫面點擺', mins: 6,
  summary: '一個 Mon：左邊 5 分鐘圖（畫好價位），右邊落單窗同持倉。兩個 Mon：多一個大市同警報。唔好開十個窗，越多越亂。',
  keywords: ['Layout', '畫面', 'TradingView', 'IBKR'],
  md: `
## 3.1 一個 Mon

| 位置 | 擺咩 | 用嚟 |
|---|---|---|
| 左邊大半 | TradingView 5 分鐘圖（VWAP、EMA 9、PMH／PDH 線） | 睇觸發同確認 |
| 右上 | IBKR 落單窗（Order Entry） | 落單 |
| 右下 | IBKR 持倉同訂單（Portfolio／Orders） | 睇住 Stop 有冇喺度 |
| 手機 | 警報通知 | 唔使一直望住 |

## 3.2 兩個 Mon

多出嚟嗰個擺：**QQQ／SPY 5 分鐘圖**（大市方向）、**Watchlist**（2–3 隻）、**開市前計劃表**（打印咗都得）。

:::bad 唔好咁做
- 同時開 10 隻股嘅圖：你一次只可以做好 1 隻
- 開住新聞台同 Twitter：開市時嘅新聞多數已經反映咗
- 用手機落 Day Trade 單：細 Mon 易撳錯，Stop 易漏
:::

:::tip TradingView 佈局
Level 10 已經教咗點設定時區、Extended Hours、Session Breaks 同畫價位。設好之後 **Save Layout**，每日開返同一個。
:::

[[link:c/l10-c6|📖 溫習：Level 10 第 6 章 Layout]]

[[quiz:l13-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c4', num: '4', title: '警報代你睇：唔使一直望住', mins: 6,
  summary: '每隻計劃股設兩個警報：觸發價（入場）同 Stop 價。警報響先望，冇響就唔使望。咁樣同時「睇」3 隻都唔辛苦。',
  keywords: ['Alert', '警報', 'TradingView', 'IBKR'],
  md: `
## 4.1 每隻設兩個警報

| 警報 | 例子（NVDA Long） | 響咗做咩 |
|---|---|---|
| 入場 | 升穿 191.00 | 睇三樣嘢（第 1 章），啱就落單 |
| 失效 | 跌穿 187.55（昨日 VAH） | 刪除計劃，唔再睇 |

開市前計劃表嘅「📋 複製警報價位」已經幫你列好。

## 4.2 喺邊度設

- **TradingView**：圖上右撳價位 → Add Alert → Condition 揀 Crossing（Level 10 第 11 章）。免費版警報數量有限
- **IBKR**：TWS／IBKR Desktop／手機 App 都有價格警報（Alerts），會推送到手機。注意：喺 App 設警報**唔會落單**
- 兩邊設一個就夠，唔好重複到亂

[[link:c/l10-c11|📖 溫習：Level 10 第 11 章警報]]

:::coach 點解咁有用
冇警報：你要一直望住 3 隻股嘅圖，30 分鐘就攰，仲容易「見住佢升就忍唔住追」。有警報：價格冇到你嘅位，你根本唔會望，**亦唔會亂入**。
:::

[[quiz:l13-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c5', num: '5', title: 'IBKR Bracket Order 係乜？三張單點分工', mins: 8,
  summary: 'Bracket = 一張入場母單 + 兩張子單（Profit Taker 同 Stop Loss）。子單喺母單成交之後先生效，其中一張成交，另一張自動取消。突破入場一定要用 Stop Limit 做母單，唔可以用普通 Limit。',
  keywords: ['Bracket Order', 'Parent Order', 'Profit Taker', 'Stop Loss', 'Stop Limit'],
  md: `
## 5.1 三張單

| 單 | Long 例子（本金 $10,000、每筆風險 $50） | 作用 |
|---|---|---|
| **母單**（Parent） | BUY 22 NVDA STP LMT：Stop 191.00、Limit 191.37 | 入場 |
| **子單 1：Profit Taker** | SELL 22 LMT 195.48 | 到 Target 賺錢離場 |
| **子單 2：Stop Loss** | SELL 22 STP 188.76 | 錯咗就止蝕 |

- 子單同母單**一齊建立**，但要**母單成交之後先生效**
- 兩張子單係一組（OCA）：**一張成交，另一張自動取消**
- 好處：一落單，Stop 同 Target 已經喺度，**唔會漏設 Stop**，亦唔使喺最緊張嗰刻再計

## 5.2 最重要嘅一點：突破入場用 Stop Limit

每日報告嘅計劃係「**升穿**盤前高先入」。即係話，入場價**高過**而家個價。

:::warn 用錯單種會即刻成交
- 而家 NVDA 188.90，你想「升穿 191 先買」
- 如果你落 **LMT 191.00**（限價買入）：意思係「191 或者更平都買」→ 188.90 已經平過 191，**張單即刻成交**，即係未突破就買咗
- 正確做法係 **STP LMT**（Stop Limit）：**價格去到 191.00 先觸發**，觸發後最多俾 191.37（Limit 價）
:::

| 你想點入 | 母單用 | 例子 |
|---|---|---|
| 升穿某價先買（突破） | **STP LMT** | Stop 191.00、Limit 191.37 |
| 跌穿某價先沽空（突破） | **STP LMT** | Stop 17.55、Limit 17.52 |
| 跌返落某價先買（回調） | **LMT** | Limit 186.00 |

Limit 價比 Stop 價高少少（Long）：避免觸發後追到好貴。我哋嘅落單卡用 0.05 ATR，例如 ATR 7.46 → 高 0.37。

## 5.3 試吓

由每日選股撳「⚡ 開落單卡」會自動帶入數字。你亦可以喺度直接改：

[[tool:bracket-ticket]]

:::warn 盤前同 Stop
IBKR 嘅普通 Stop（STP）**只喺 09:30–16:00 生效**，盤前唔會觸發。我哋嘅計劃係 09:35 之後先入場，所以冇問題；如果你真係要喺盤前落單，Stop 要改用 Stop Limit 兼剔 **Outside RTH**，而且有可能唔成交。新手唔建議盤前交易。
:::

[[quiz:l13-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c6', num: '6', title: 'TWS（Mosaic）：一步一步落 Bracket', mins: 9,
  summary: 'Order Entry 揀股、方向、股數、母單類型（STP LMT）→ Advanced → Attach → Bracket → 填 Profit Taker 同 Stop Loss 價 → 檢查一次 → Submit。持倉後可以用 Exit Strategy 補 Bracket。',
  keywords: ['TWS', 'Mosaic', 'Order Entry', 'Bracket'],
  md: `
:::info 先講清楚
IBKR 介面會不時更新，按鈕名或者位置可能同下面有少少唔同。**第一次一定要用 Paper Trading 戶口（模擬帳戶）練**，熟咗先用真錢。以下根據 IBKR 官方教學整理。
:::

## 6.1 新開倉：落 Bracket

:::steps TWS Mosaic Order Entry
1. Order Entry 輸入代號（例如 NVDA），撳 **BUY**（或者 SELL 沽空）
2. **Quantity**：填落單卡計出嚟嘅股數（例如 22）
3. **Type** 揀 **STP LMT**；填 **Stop Price** 191.00、**Lmt Price** 191.37；**Time in Force** 揀 DAY
4. 撳 **Advanced** 打開進階設定 → **Attach** → 揀 **Bracket**（Profit Taker + Stop Loss）
5. 兩張子單會以預設距離出現（預設係相差 1.00）。改成你嘅數字：**Profit Taker LMT 195.48**、**Stop Loss STP 188.76**
6. 核對：股數、方向、三個價。**Outside RTH 唔好剔**
7. 撳 **Submit**。喺 Orders 會見到母單同兩張子單（子單顯示等待中）
:::

## 6.2 已經有持倉：補 Bracket

如果你已經買咗，未有 Stop：喺持倉（Portfolio）右撳嗰隻股 → **Exit Strategy** → 揀 Stop Loss、Profit Taker 或者兩樣（Bracket）→ 填價 → Submit。**買咗冇 Stop，第一件事就係補 Stop。**

## 6.3 成交之後點改

- **移 Stop 返入場價**：價格到 +1R（落單卡有寫幾多）→ 喺 Orders 搵 Stop Loss 單 → 改 Stop 價 → Transmit（或者喺圖上拖條線）
- **想分兩段食糊**：Bracket 只有一張 Profit Taker。想 Target 1 賣一半、Target 2 賣其餘，就要手動改 Profit Taker 股數，再加多張單。新手建議一次過賣晒，簡單啲
- **取消**：撳母單取消，子單會一齊取消；如果已經成交，只係取消子單會令你**冇咗 Stop**，要小心

參考：IBKR 官方 [Bracket Orders 說明](https://www.interactivebrokers.com/docs/general/order-types/complex-orders/bracket-orders)、[TWS Mosaic Bracket 教學](https://www.interactivebrokers.com/campus/trading-lessons/bracket-orders-for-tws-mosaic-2/)、[Exit Strategy 工具](https://www.interactivebrokers.com/campus/traders-insight/ibkr-toolbox-using-the-exit-strategy-tool-in-tws/)

[[check:l13-ticket]]

[[quiz:l13-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c7', num: '7', title: 'IBKR Desktop 同手機 App', mins: 6,
  summary: 'IBKR Desktop：落單窗剔 Stop Loss 同 Profit Taker。手機 App：落單頁面向下碌到 Attach Order → 揀 Bracket。手機只建議用嚟睇同改 Stop，唔建議開倉。',
  keywords: ['IBKR Desktop', 'IBKR Mobile', 'Attach Order'],
  md: `
## 7.1 IBKR Desktop（新版電腦程式）

:::steps
1. 開落單窗（Order Ticket），揀方向、股數、母單類型同價
2. 喺附加訂單（Attached Orders）位置，剔 **Profit Taker** 同 **Stop Loss**
3. 填兩個價：Long 嘅 Stop 要低過入場價，Profit Taker 要高過入場價
4. 核對後提交
:::

IBKR 教學提醒：唔係每種母單類型都支援附加訂單，揀單種時留意；附加單喺正常交易時段先生效。參考：[IBKR Desktop Bracket 教學](https://www.interactivebrokers.com/campus/trading-lessons/bracket-orders-for-ibkr-desktop/)

## 7.2 手機 App（IBKR Mobile）

:::steps
1. 開落單頁面，填好母單
2. 向下碌到 **Attach Order**（Android 可能要先撳 **Show More Options**）
3. 揀 **Bracket**（或者 Profit Taker／Stop Loss）
4. 調較兩個價，提交
:::

參考：[IBKR 手機 Attached Orders 說明](https://www.ibkrguides.com/iphone/attached.htm)

:::coach 手機點用最好
手機 Mon 細，好易撳錯股數或者價。建議手機只用嚟：**收警報、睇持倉、移 Stop**。開倉喺電腦做。
:::

[[quiz:l13-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c8', num: '8', title: 'Presets 同 Hotkeys：一撳出 Bracket', mins: 8,
  summary: 'TWS Presets 可以預設每張單自動附加 Bracket；Hotkeys 可以設一個快捷鍵「Buy + Simple Bracket」。但 IBKR 冇按風險自動計股數，股數仍然要用落單卡計。新手唔好開「即時傳送」。',
  keywords: ['Order Presets', 'Hotkeys', 'TWS'],
  md: `
## 8.1 Order Presets（預設）

TWS 可以設定股票嘅預設單：例如預設 DAY、預設附加 Profit Taker 同 Stop Loss，同埋佢哋同入場價嘅距離（可以用金額、% 或者 Tick）。

:::warn Presets 嘅限制
- 預設距離係**固定**（例如 Stop 低 1.00），但每隻股嘅 ATR 唔同、每次 Stop 位唔同 → **用完預設仍然要改價**
- IBKR **冇內置「按風險金額自動計股數」**（有用戶向 IBKR 提出過呢個功能），所以**股數要自己計**，即係用落單卡
- 參考：[TWS Presets 教學](https://www.interactivebrokers.com/campus/trading-lessons/configuring-tws-presets/)
:::

## 8.2 Hotkeys（快捷鍵）

:::steps 設一個「買入 + Bracket」快捷鍵（TWS）
1. **Global Configuration**（菜單位置視乎版本）→ 左邊揀 **Hotkeys**
2. Action 揀 **Buy** → **Create Shortcut** → 按你想用嘅鍵（唔可以用 Alt 呢類保留鍵）
3. 去 **Customize**：喺 Attached Orders 剔 **Add Simple Bracket**
4. **「即時傳送」（Transmit）唔好剔**：撳快捷鍵只係喺畫面整好張單，你核對完先自己 Transmit
:::

參考：[TWS Hotkeys 說明](https://guides.interactivebrokers.com/tws/usersguidebook/configuretws/hotkeys.htm)

:::coach 新手要唔要用 Hotkeys？
Hotkeys 快，但**撳錯就即刻有倉**。我哋嘅建議：
1. 首 3 個月用落單卡 + 正常落單窗，慢少少但唔會錯
2. 要用 Hotkeys，**一定唔好開即時傳送**，同埋先喺 Paper Trading 練 50 次
3. 我哋嘅策略係 09:35 後先入，唔需要快到秒級
:::

[[quiz:l13-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l13-c9', num: '9', title: '一日交易節奏同其他提速工具', mins: 8,
  summary: '固定時間表（美東同香港時間）、落單前 30 秒檢查、+1R 移 Stop、蝕夠就收工。加上 App 入面嘅計劃表、落單卡、TradingView 警報同 Position 工具，開市時幾乎唔使計數。',
  keywords: ['Routine', '節奏', '工具'],
  md: `
## 9.1 一日時間表

美股冬令時間（11 月至 3 月）香港 = 美東 + 13 小時；夏令 + 12 小時。

| 美東 | 香港（冬令） | 做咩 |
|---|---|---|
| 08:00–08:40 | 21:00–21:40 | 每日報告出咗：睇大市同 pick |
| 08:30 | 21:30 | 經濟數據（有就等完先定計劃） |
| 08:40–09:20 | 21:40–22:20 | 開市前計劃表：揀 2–3 隻、設警報、準備落單卡 |
| 09:25 | 22:25 | 最後睇一次圖，價位有冇變 |
| 09:30–09:35 | 22:30–22:35 | **唔落單**，淨係睇 |
| 09:35–10:30 | 22:35–23:30 | 警報響 → 三樣嘢 → Bracket |
| 交易中 | | 到 +1R 移 Stop 返入場價；唔好郁 Target |
| 10:30 之後 | 23:30 之後 | 冇倉就收工；蝕夠每日上限都收工 |
| 收市後 | 翌日早上 | 記日誌、對照報告回顧 |

## 9.2 其他幫你快啲嘅工具

| 工具 | 喺邊 | 幫你做咩 |
|---|---|---|
| 🛫 開市前計劃表 | App 工具箱 | 一版睇晒今日 pick 嘅股數、風險、警報價 |
| ⚡ Bracket 落單卡 | App 工具箱、每日選股每隻 pick | 股數、三張單價錢、唔追價、+1R 價、一撳複製 |
| 📋 每日選股 | App 主頁 | 9 個 Indicator 已經篩好 |
| TradingView 警報 | TradingView | 到價先通知你 |
| TradingView Long／Short Position 工具 | TradingView 畫圖工具 | 喺圖上睇 R:R（Level 10 第 10 章） |
| IBKR Bracket／Exit Strategy | IBKR | 落單同補 Stop |
| 🛡️ Day Trading Risk Calculator | App 工具箱 | 計埋滑價同手續費 |

[[link:tools|🧰 打開工具箱]]

:::key 提速嘅真正秘訣
**唔係撳得快，係開市前已經決定咗。**開市前計好、寫好、設好警報，開市時只做三件事：等警報 → 核對三樣嘢 → 落已經計好嘅 Bracket。
:::

[[check:l13-day]]

[[quiz:l13-final]]

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l13-c1': { title: '小測：注意力', questions: [
  { q: '有經驗嘅交易者開市時點樣應付咁多資料？', options: ['同時睇晒幾十隻', '開市前已經篩好同計好，開市只核對幾樣嘢', '靠直覺'], answer: 1, explain: '九成功課喺開市前做。' },
  { q: '開市時要睇嘅三樣嘢唔包括？', options: ['價格到咗觸發價未', '首 5 分鐘成交', '公司嘅 P/E'], answer: 2, explain: 'P/E 同 Day Trade 開市無關。' },
  { q: '09:35 之後同一時間最好專心做幾多隻？', options: ['1 隻', '10 隻', '越多越好'], answer: 0, explain: '一次做好一隻。' },
]},
'l13-c2': { title: '小測：開市前計劃表', questions: [
  { q: '計劃表入面灰色嗰行代表？', options: ['最好嘅一隻', '做唔得（例如風險太大、Cash 戶口唔沽空）', '已經成交'], answer: 1, explain: '灰色 = 今日唔做。' },
  { q: '計劃表嘅數字可以直接當落單指令？', options: ['可以', '唔可以，落單前要喺圖上核對', '只係 Long 可以'], answer: 1, explain: '報告係開市前數據。' },
  { q: '新手每筆風險建議？', options: ['本金 0.25–0.5%', '本金 5%', '本金 20%'], answer: 0, explain: 'Level 11 第一個月計劃。' },
]},
'l13-c3': { title: '小測：畫面', questions: [
  { q: '一個 Mon 最主要擺咩？', options: ['10 隻股嘅圖', '5 分鐘圖 + 落單窗 + 持倉', '新聞台'], answer: 1, explain: '少而精。' },
  { q: '點解唔建議用手機開 Day Trade 倉？', options: ['手機冇報價', 'Mon 細易撳錯、易漏 Stop', '手機唔准交易'], answer: 1, explain: '手機用嚟收警報同移 Stop。' },
  { q: '第二個 Mon 可以擺？', options: ['QQQ／SPY 圖同 Watchlist', '遊戲', '更多新聞'], answer: 0, explain: '大市方向同計劃股。' },
]},
'l13-c4': { title: '小測：警報', questions: [
  { q: '每隻計劃股最少設幾多個警報？', options: ['0', '2 個（入場同失效）', '10 個'], answer: 1, explain: '入場價同失效價。' },
  { q: '喺 IBKR 設價格警報會唔會自動落單？', options: ['會', '唔會', '只係盤前會'], answer: 1, explain: '警報只係通知。' },
  { q: '警報最大好處？', options: ['唔使一直望住，減少亂入', '保證賺錢', '令成交更快'], answer: 0, explain: '冇到價就唔使望。' },
]},
'l13-c5': { title: '小測：Bracket Order', questions: [
  { q: 'Bracket Order 嘅兩張子單幾時生效？', options: ['即刻', '母單成交之後', '收市先'], answer: 1, explain: '母單成交先生效。' },
  { q: 'NVDA 而家 188.90，想「升穿 191 先買」，母單應該用？', options: ['LMT 191', 'STP LMT（Stop 191）', 'MKT'], answer: 1, explain: 'LMT 191 會即刻以 188.90 附近成交。' },
  { q: 'Profit Taker 成交之後，Stop Loss 會？', options: ['繼續生效', '自動取消', '變成市價單'], answer: 1, explain: 'OCA：一張成交另一張取消。' },
  { q: 'IBKR 普通 STP 喺盤前會唔會觸發？', options: ['會', '唔會，只喺 09:30–16:00', '只係週五會'], answer: 1, explain: '盤前要用 Stop Limit + Outside RTH。' },
]},
'l13-c6': { title: '小測：TWS', questions: [
  { q: 'TWS 喺邊度附加 Bracket？', options: ['Advanced → Attach → Bracket', 'Account → Settings', 'News'], answer: 0, explain: 'Order Entry 嘅 Advanced。' },
  { q: '子單預設距離係 1.00，應該？', options: ['照用', '改成你計劃嘅 Target 同 Stop', '刪除'], answer: 1, explain: '預設唔係你嘅計劃。' },
  { q: '已經買咗但冇 Stop，最快點補？', options: ['等收市', '持倉右撳 → Exit Strategy → Stop Loss', '唔使理'], answer: 1, explain: '第一時間補 Stop。' },
]},
'l13-c7': { title: '小測：Desktop 同手機', questions: [
  { q: 'IBKR 手機 App 附加 Bracket 喺邊？', options: ['落單頁面嘅 Attach Order', '設定頁', '新聞頁'], answer: 0, explain: 'Android 可能要先撳 Show More Options。' },
  { q: '手機最適合用嚟？', options: ['開倉', '收警報、睇持倉、移 Stop', '睇 10 隻圖'], answer: 1, explain: '開倉喺電腦做。' },
  { q: '第一次用 Bracket 應該喺邊練？', options: ['真錢戶口', 'Paper Trading 模擬戶口', '唔使練'], answer: 1, explain: '熟咗先用真錢。' },
]},
'l13-c8': { title: '小測：Presets 同 Hotkeys', questions: [
  { q: 'IBKR 有冇內置按風險金額自動計股數？', options: ['有', '冇，要自己計（用落單卡）', '只係手機有'], answer: 1, explain: 'Presets 只可以設固定股數。' },
  { q: 'Hotkey 嘅「即時傳送」新手應該？', options: ['開', '唔開，核對完先自己 Transmit', '冇所謂'], answer: 1, explain: '撳錯就即刻有倉。' },
  { q: 'Presets 預設 Stop 距離係固定金額，問題係？', options: ['冇問題', '每隻股 ATR 同 Stop 位唔同，仍然要改價', '會自動調整'], answer: 1, explain: '固定距離唔啱每隻股。' },
]},
'l13-final': { title: 'Level 13 總測驗', questions: [
  { q: '開市前最重要嘅準備係？', options: ['開多啲圖', '揀好 2–3 隻、計好股數、寫好 If-Then、設好警報', '睇多啲新聞'], answer: 1, explain: '開市前決定晒。' },
  { q: 'AMD 而家 435.80，計劃升穿 439.50 先入，Stop 428.98，你應該落？', options: ['BUY LMT 439.75', 'BUY STP LMT（Stop 439.75、Limit 稍高）+ Bracket', 'BUY MKT'], answer: 1, explain: '突破入用 Stop Limit。' },
  { q: '價格到 +1R，計劃係？', options: ['加注', '將 Stop 移返入場價', '取消 Stop'], answer: 1, explain: '保本。' },
  { q: '今日已經蝕咗 3R（每日上限），第四個警報響，應該？', options: ['再做一次博返', '收工', '加大注碼'], answer: 1, explain: '每日虧損上限係硬規則。' },
  { q: '以下邊樣唔可以加快效率又唔增加風險？', options: ['開市前計劃表', '警報', '用即時傳送 Hotkey 未練習就上真錢'], answer: 2, explain: '未練習嘅即時傳送好易出錯。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l13-ticket': { title: '落單前 30 秒檢查', items: [
  '代號啱（例如 NVDA 唔係 NVDL）',
  '方向啱（BUY／SELL）',
  '股數 = 落單卡計出嚟嗰個',
  '突破入：母單係 STP LMT，唔係 LMT',
  'Stop Loss 價同 Profit Taker 價已經改成我嘅計劃（唔係預設 1.00）',
  'TIF = DAY；Outside RTH 冇剔',
  '而家價未過「唔追價」',
  '今日仲未蝕夠每日上限',
]},
'l13-day': { title: '我嘅交易日節奏', items: [
  '08:40 前睇完報告，揀 2–3 隻',
  '開市前計劃表：股數、風險、警報價核對好',
  '每隻設好入場同失效警報',
  '09:25 再睇一次圖',
  '09:30–09:35 唔落單',
  '警報響：三樣嘢啱先落 Bracket',
  '+1R 移 Stop 返入場價',
  '蝕夠每日上限或者 10:30 冇機會就收工',
  '收市後記日誌',
]},
});

window.GLOSSARY.push(
  { term: 'Parent Order', zh: '母單', def: 'Bracket 入面負責入場嘅單。佢成交之後，附加嘅子單（Profit Taker、Stop Loss）先生效。', lv: 'l13' },
  { term: 'Attached Order', zh: '附加訂單／子單', def: '附喺母單嘅單，例如 Profit Taker 同 Stop Loss。同母單一齊建立，母單成交先生效。', lv: 'l13' },
  { term: 'Profit Taker', zh: '止賺單', def: 'IBKR 附加訂單：到 Target 價就用限價單離場。Long 時係高過入場價嘅賣出 LMT。', lv: 'l13' },
  { term: 'Order Preset', zh: '預設落單設定', def: 'TWS 可以預設單種、TIF、股數同附加訂單距離。距離係固定，唔會按每隻股嘅風險調整。', lv: 'l13' },
  { term: 'Hotkey', zh: '快捷鍵', def: 'TWS 入面一撳就建立（或者傳送）一張單嘅鍵盤快捷鍵，可以設定附加 Simple Bracket。新手唔好開即時傳送。', lv: 'l13' },
  { term: 'Transmit', zh: '傳送', def: 'IBKR 將已經填好嘅單真正送去市場。未 Transmit 嘅單只係喺畫面上。', lv: 'l13' },
  { term: 'Exit Strategy Tool', zh: '離場策略工具', def: 'TWS 工具：為已經有嘅持倉補設 Stop Loss、Profit Taker 或者 Bracket。', lv: 'l13' },
  { term: 'Pre-open Plan Sheet', zh: '開市前計劃表', def: 'App 工具：讀今日選股報告，按你嘅本金同風險計好每隻嘅股數、Stop、Target、唔追價同警報價位。', lv: 'l13' },
);
