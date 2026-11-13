# Claude Skills（第三方）

以下 7 個 Skill 嚟自 [tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills)
（MIT 授權，見 `THIRD_PARTY_LICENSE-claude-trading-skills.txt`），commit 4251eaaeb05d720f5ffe8e899e3b6ec1cf48e96f（2026-11-12）。
已刪走測試資料夾，其餘原封不動。

| Skill | 用途 |
|---|---|
| pre-trade-discipline-gate | 落單前紀律檢查（GO／NO-GO） |
| drawdown-circuit-breaker | 每日／每週／每月虧損上限、連輸冷靜期 |
| position-sizer | 按風險計股數（固定比例、ATR、Kelly） |
| trader-memory-core | 交易想法由 IDEA 到平倉同檢討嘅紀錄 |
| trade-performance-coach | 交易表現檢討 |
| signal-postmortem | 訊號事後檢討 |
| market-breadth-analyzer | 大市寬度（公開 CSV） |

網站本身（`js/discipline.js`）用 JavaScript 重寫咗紀律閘同斷路器嘅 Day Trade 版本，唔會執行呢度嘅 Python。
呢啲 Skill 唔會落單、唔會讀券商戶口。每日選股排程任務唔會自動用佢哋。
