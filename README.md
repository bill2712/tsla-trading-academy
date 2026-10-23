# 📈 TSLA Day Trading 學院

由 Level 1 到 Level 5 嘅美股 Day Trading **互動學習平台**（廣東話）。內容整理自自己生成嘅 Level 3–5 課程筆記，再加上基礎重溫、補充章節、互動計算器、K 線重播遊戲、測驗同交易日誌。

> ⚠️ 所有 TSLA 價格、成交量同交易例子都係**教學模擬**，唔係即時行情、唔係投資建議、亦唔係已驗證嘅盈利策略。

## ✨ 功能一覽

| 類別 | 功能 |
|---|---|
| 📚 內容 | Level 1–2 基礎重溫（新增）、Level 3 交易策略、Level 4 執行與風險、Level 5 驗證與系統開發，共 52 章 |
| 🗺️ 目錄 | 側欄完整目錄（Level → 章 → 小節）、完整課程目錄頁、右邊「本章目錄」，撳任何一節直接跳過去 |
| 📍 閱讀進度 | 自動記錄讀到邊個小節、每章完成度圓圈、「繼續上次」、讀完自動標記完成 |
| ⭐ 書籤 | 每個小節標題旁邊 ☆，整章亦可以加書籤 |
| 📝 筆記 | 小節筆記、每章筆記；揀選文字可以加 **螢光筆**（4 種顏色）同備註 |
| 🎬 影片 | 每章可以貼 YouTube / 其他連結，YouTube 會直接嵌入播放；仲有一鍵 YouTube 搜尋建議 |
| 💬 留言 | 家庭討論區：每章留言、指定小節、引用選取文字、回覆 |
| 👨‍👩‍👧 多使用者 | 爸爸、媽媽、細路各自有自己嘅進度／書籤／筆記／分數；留言同影片全家共用；家庭進度頁 |
| 🧰 工具箱 | 34 個互動計算器：Position Size、Risk Calculator、期望值實驗室、Monte Carlo、連敗機率、Order 跳價模擬器、Order Book、VWAP、RVOL、CLV、Net R、MFE/MAE、每日風險追蹤、CSV 數據檢查器… |
| 🎮 K 線重播 | 5 個逐支 K 線決策情境（WAIT / PLAN / 入場 / 放棄），即時講解 |
| 📝 測驗 | 50 份測驗（每章小測 + 三個期末測驗），全部有詳細解析 |
| 🃏 字卡 | 80+ 個詞彙字卡（可反轉、記住已識） |
| 📒 交易日誌 | 候選紀錄 + 交易紀錄 + 自動統計（勝率、Expectancy、Profit Factor、Drawdown、按 Setup／市況分析、Equity Curve），可匯出 CSV |
| 🎯 遊戲化 | XP、等級稱號、連續學習日數、徽章、完成章節慶祝 |
| 🌓 其他 | 深色／淺色主題、字體大小、列印版面、手機版、可「加到主畫面」離線使用 |

## 🚀 點樣用

### 方法 1：GitHub Pages（建議）

1. 將呢個 repo push 上 GitHub。
2. 去 repo 嘅 **Settings → Pages**。
3. **Source** 揀 **Deploy from a branch**，Branch 揀 `main`、資料夾揀 `/ (root)`，撳 Save。
4. 等一兩分鐘，網址會係 `https://<你嘅帳號>.github.io/<repo 名>/`。

### 方法 2：自己部機

純前端、唔使安裝任何嘢。喺資料夾入面行：

```bash
python3 -m http.server 8000
```

然後打開 <http://localhost:8000>。（直接雙擊 `index.html` 大部分功能都用得，但離線快取需要用 http 開。）

## 💾 資料儲存同同步

- 所有進度、筆記、留言都儲存喺**瀏覽器 localStorage**，唔會上載去任何伺服器。
- 唔同裝置之間同步：**設定 → 匯出備份**，將 `.json` 檔傳去另一部機，再 **匯入（合併）**。合併唔會覆蓋原有資料。
- 清除瀏覽器資料會刪除紀錄，記得定期匯出備份。

## 🗂️ 檔案結構

```
index.html              主頁面
css/style.css           樣式（深淺色、手機、列印）
content/level0.js       Level 1–2 基礎重溫
content/level3.js       Level 3 課程內容
content/level4.js       Level 4 課程內容
content/level5.js       Level 5 課程內容
js/data-quizzes.js      測驗題目、可剔清單、訓練計劃
js/data-glossary.js     詞彙表／字卡
js/tools.js             互動計算器
js/charts.js            SVG K 線圖、折線圖、柱狀圖
js/replay.js            K 線重播遊戲
js/journal.js           交易日誌
js/store.js             使用者資料、匯出匯入
js/app.js               路由、目錄、章節頁、書籤筆記留言影片
sw.js                   離線快取
```

## ✏️ 點樣改內容

課程內容用 Markdown 寫喺 `content/*.js`，另外有幾個特別語法：

| 語法 | 效果 |
|---|---|
| `## 3.4 標題` | 小節（自動出現喺目錄，可以加書籤／筆記） |
| `:::warn 標題` … `:::` | 提示框（`warn` `info` `tip` `key` `coach` `good` `bad` `bar` `card` `steps`） |
| `$$ 公式 $$` | 公式框 |
| `[[tool:possize-pro]]` | 嵌入計算器（名稱見 `js/tools.js`） |
| `[[quiz:l3-c3]]` | 嵌入測驗（題目喺 `js/data-quizzes.js`） |
| `[[check:l3-plan]]` | 可剔清單 |
| `[[chart:l3-breakout]]` | K 線示意圖（喺 `js/charts.js`） |
| `[[rr:386.10,384.70,388.90]]` | Entry / Stop / Target 風險回報圖 |
| `[[replay:l3-br-win]]` | K 線重播遊戲入口 |

改完 push 上 GitHub，Pages 會自動更新。

## 📜 第三方

- [marked](https://github.com/markedjs/marked)（MIT）—— Markdown 轉換，已放喺 `js/vendor/`。
