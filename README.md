# 📈 TSLA Day Trading 學院

由 Level 1 到 Level 5 嘅美股 Day Trading **互動學習平台**（廣東話）。內容整理自自己生成嘅 Level 1–5 課程筆記同實戰問答，再加上補充章節、互動計算器、K 線重播、訓練場、測驗、錯題本同交易日誌。

> ⚠️ 所有 TSLA 價格、成交量同交易例子都係**教學模擬**，唔係即時行情、唔係投資建議、亦唔係已驗證嘅盈利策略。

## ✨ 功能一覽

| 類別 | 功能 |
|---|---|
| 📚 內容 | **Level 1** 六樣工具（K 線、Volume、PDH/PDL、S/R、VWAP、LuxAlgo）、**Level 2** Price Action 實戰（結構、Bias、K 線深度、Volume、VWAP、六個 TSLA 情境、WAIT/PLAN/SKIP）、Level 3 交易策略、Level 4 執行與風險、Level 5 驗證與系統開發、💡 實戰問答，共 77 章 |
| 🗺️ 目錄 | 側欄完整目錄、每個 Level 概覽頁（章節、練習、工具、測驗）、完整課程目錄頁、右邊「本章目錄」 |
| 📍 閱讀進度 | 自動記錄讀到邊個小節、每章完成度、「繼續上次」 |
| 🏋️ 訓練場 | 隨機生成、可以無限重玩：K 線形態辨識、市場結構辨識（HH/HL vs LH/LL vs Range）、情境決策（WAIT / PLAN / SKIP）、60 秒風險速算 |
| 📕 錯題本 | 測驗答錯自動收集，按間隔重溫（1、3、7、14 日）再考，答啱 4 次當掌握 |
| 🎯 每日任務 | 每日 3 個小任務（讀小節、答題、訓練、溫習、筆記、重播、日誌），完成全部有額外 XP；📅 學習日曆熱圖 |
| 📖 詞彙提示 | 章節內英文詞彙自動加虛線，撳一下睇中文解釋（可喺設定關閉） |
| 🔊 朗讀 | 由你睇緊嘅位置開始讀出課文（瀏覽器內置語音，可調速度） |
| ⭐ 書籤・📝 筆記 | 小節書籤、筆記、螢光筆（4 色）＋備註；可以一鍵匯出 Markdown |
| 🎬 影片・💬 留言 | 每章貼 YouTube 連結；家庭討論區（每章、指定小節、引用文字、回覆） |
| 👨‍👩‍👧 多使用者 | 每人獨立進度／筆記／XP／錯題本／日誌；家庭進度頁有每人學習日曆同今日任務 |
| 🧰 工具箱 | 38 個互動工具，新增 🧠 決策教練（逐項輸入 → WAIT / PLAN / SKIP 同理由）、🗒️ Price Action 分析紀錄卡（可存入 Replay 日誌）、升級版 K 線砌圖器（Body Ratio、Close Position） |
| 🎮 K 線重播 | 8 個逐支 K 線情境，新增 Level 2：阻力區 Shooting Star、升勢回調 + Higher Low、VWAP 附近反覆上落 |
| 📝 測驗・🃏 字卡 | 74 份測驗（全部有解析）；100+ 詞彙字卡 |
| 📒 交易日誌・📘 Playbook | 真實／Paper／Replay 交易、過程 × 結果四格、Playbook 版本紀錄、Replay 日誌、檢討 |
| 🌓 其他 | 深淺色、字體大小、列印、手機版、加到主畫面離線使用 |

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
content/level1.js       Level 1 六樣工具
content/level2.js       Level 2 Price Action
content/level3.js       Level 3 課程內容
content/level4.js       Level 4 課程內容
content/level5.js       Level 5 課程內容
content/qa.js           實戰問答（你問過嘅問題同 AAPL 案例）
js/data-quizzes.js      測驗題目、可剔清單、訓練計劃
js/data-glossary.js     詞彙表／字卡
js/tools.js             互動計算器
js/charts.js            SVG K 線圖、折線圖、柱狀圖
js/replay.js            K 線重播遊戲
js/journal.js           交易日誌
js/learn.js             訓練場、錯題本、每日任務、學習日曆、Level 概覽、詞彙提示、朗讀
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
| `[[widget:res-outcomes]]` | 內文示意圖（名稱見 `js/tools.js` 嘅 `WIDGETS`） |

改完 push 上 GitHub，Pages 會自動更新。

## 📜 第三方

- [marked](https://github.com/markedjs/marked)（MIT）—— Markdown 轉換，已放喺 `js/vendor/`。
