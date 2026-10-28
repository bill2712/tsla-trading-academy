# 每日開市前選股：排程任務操作手冊

This file is the playbook for the scheduled task that publishes the daily pre-market
day-trading watchlist into the app (`#/picks`). The reader is a beginner day trader
(Hong Kong, studies this academy's Level 1–9 course). Everything the user sees must be
written in **Traditional Chinese, Cantonese style** (same tone as the course: 「係、嘅、唔、冇」).

The output is educational research, not investment advice. Never present a pick as a
recommendation to buy or sell. Never invent numbers, news, or URLs.

---

## 0. Hard safety rules

- **IBKR is read-only.** You may call only: `search_contracts`, `search_futures`,
  `get_price_snapshot`, `get_price_history`, `get_screener_asset_classes`,
  `get_screener_capabilities`, `get_screener_templates`, `get_screener_industries`,
  `get_screener_themes`, `preview_screener`, `search_earnings_insights`,
  `get_earnings_insight`, `get_company_themes`, `get_company_connections`.
- **Never** call any tool that creates, edits, or deletes anything at IBKR (orders, order
  instructions, alerts, watchlists, saved screeners), and never read account balances,
  positions, orders or trades. They are not needed.
- Only change files under `data/picks/` (and add new IDs to `scripts/picks/contracts.json`). Do not touch app code.
- If a number is unavailable, write `null` and set `"dataQuality": "partial"`. Never guess.
- Only cite news URLs that actually appeared in your search results or fetched pages.

## 1. Decide the target day

```bash
git pull origin main
node scripts/picks/market-day.mjs
```

- Use `targetDate` as the report date, and `status` from the output (`premarket` when run
  between 04:00 and 09:30 ET on the trading day, otherwise `test`).
- If the scheduled run finds today (`date`) is **not** a trading day (weekend/holiday), stop:
  no files, no commit. Final message: 「今日美股休市（原因），唔使選股。」
- If `targetHalfDay` is set, mention the early close (13:00 ET) in `market.summary` and `events`.
- If `note` says the holiday table has run out, confirm NYSE holidays with a web search.

## 2. Review the previous report (yesterday's picks)

Find the newest `data/picks/YYYY-MM-DD.json` dated **before** `targetDate` that has no `review`.
For each of its picks, get the daily bar for that date
(`get_price_history`, `step: ONE_DAY`, `step_count: 5`, `outside_rth: false`, `security_type: STK`)
and add:

```json
"review": {
  "writtenAt": "<now ISO>",
  "summary": "一兩句總結：幾多隻升穿盤前高位、邊隻最符合計劃、學到乜",
  "items": [{ "sym": "TSLA", "open": 0, "high": 0, "low": 0, "close": 0,
              "chgFromOpenPct": 0, "hitPmh": true, "verdict": "短評", "note": "可選" }]
}
```

`chgFromOpenPct = (close − open) ÷ open × 100`; `hitPmh = high > levels.pmh` (null if no pmh).
Be honest: a pick that went nowhere is a useful lesson, not something to hide.

## Contract IDs

Look up IBKR `contract_id`s in `scripts/picks/contracts.json` first. Only call
`search_contracts` for symbols not listed (its output is very long), pick the row with
`country_code: "US"` and the exact `symbol`, and add it to `contracts.json` (commit it with the
report). Screener results already include `contract_id`.

## 3. Market overview

`get_price_snapshot` with `["last","change","prior_close","volume"]` for:
SPY, QQQ, IWM, DIA (US ETFs), plus sector ETFs SMH and XLK. Try the VIX index
(`contracts.json`: IND on CBOE) and ES/NQ front-month futures
(`search_futures`, pass the contract's `exchange`). Skip any that return nothing.

Put them in `market.indices` as `{ "sym", "last", "chgPct", "note" }`.
Then web search (standard mode, one turn, several queries) for:
- `stock market futures premarket <Month D, YYYY>`
- `economic calendar today <Month D, YYYY>` (CPI, jobs, FOMC, Fed speakers, PMI…)
- `earnings before the bell <Month D, YYYY>` and `after the bell` (yesterday after close)

Write `market.bias` (one of 偏好／偏淡／中性／風險高), a 2–4 sentence `market.summary`
explaining **why** (futures, VIX, yields, key news), `market.events` with ET times and impact
(高／中／低), and `market.earnings` for relevant big names.

## 4. Find candidates

Run `preview_screener` (selector `STK`, locations `["STK.US.MAJOR"]`, 25 results each):

| Scan | scanner | filters |
|---|---|---|
| Gap up | `SCAN_changePerc_DESC` | `priceAbove 5`, `avgVolumeAbove 1000000`, `marketCapAbove1e6 300` |
| Gap down | `SCAN_changePerc_ASC` | same |
| Active now | `HIGH_STVOLUME_10MIN` | `priceAbove 5`, `avgVolumeAbove 1000000` |

Also always check this liquid core list (beginner-friendly names):
TSLA, NVDA, AAPL, AMD, META, AMZN, MSFT, GOOGL, AVGO, NFLX, PLTR, COIN, MU, SMCI.

For every name, confirm with `get_price_snapshot`
(`["last","change","prior_close","volume","bid_ask","avg_90d_usd_volume"]`).
Screener ranks can be stale; the snapshot is the source of truth. Shortlist ~12 names where
`|change %|` is meaningful (large caps ≥ 1.5–2%, others ≥ 4%) **or** there is clear news.

## 5. Data for each shortlisted name

1. Daily bars: `get_price_history` `step: ONE_DAY`, `step_count: 60`, `outside_rth: false`.
2. Pre-market bars: `get_price_history` `step: FIFTEEN_MINS`, `step_count: 24`, `outside_rth: true`.
3. Save each raw response to a temp file outside the repo and run:

```bash
node scripts/picks/calc.mjs --date <targetDate> /tmp/picks/SYM-daily.json /tmp/picks/SYM-pm.json
```

It returns `pdc, pdh, pdl, atr14, atrPct, sma20, sma50, avgVol20, trend, pmh, pml, pmLast,
pmVolume, gapPct, pmVolPct`. Use these numbers as-is.

4. Spread = ask − bid from the snapshot. Market cap / float: only if you found them
   (screener filters, earnings insight or a reliable search result), else `null`.
5. News: web search `<SYM> stock news` (and the company name). Prefer items from the last
   24 hours; say if the only news is older. For earnings movers, `search_earnings_insights`
   can add the numbers (EPS/revenue vs estimates, guidance).

## 6. Score and choose

Score 0–100:

| Part | Points | What earns them |
|---|---|---|
| Liquidity | 25 | price ≥ $10, avg volume ≥ 5M shares, spread ≤ 0.05% of price |
| In play | 25 | size of gap, pre-market volume vs normal (`pmVolPct`) |
| Catalyst | 20 | fresh, specific news (earnings, guidance, upgrade/downgrade, deal, FDA, sector news) |
| Clean levels | 15 | clear PMH/PML, PDH/PDL, gap position vs prior range, daily trend agrees |
| Market fit | 15 | direction matches futures/sector; no high-impact event right at the open |

- Grade: A ≥ 75, B 60–74, C < 60 (C goes to `watch`, not `picks`).
- `beginner`: 適合新手 = market cap ≥ $10B, price ≥ $10, avg volume ≥ 5M, normal spread,
  gap < 10%. 中等 = market cap ≥ $1B. 高風險 = smaller, low float, gap ≥ 20%, biotech
  binary news, offering/halts. Beginners should mostly see 適合新手／中等 picks.
- Pick **3–6** names (max 8), best first. If nothing qualifies, `picks: []` and say why —
  「冇好機會就唔做」 is a valid result.
- `avoid`: names moving a lot that a beginner should not touch (e.g. tiny float squeezes,
  dilution news, halted names), each with a reason.
- `focus`: always write 2–4 sentences on **TSLA** (the course's main stock): gap, PDH/PDL,
  PMH/PML, news, and whether it is worth trading today.

## 7. Write each pick (Cantonese, specific, with numbers)

- `why` — 點解今日適合 day trade, citing the data (gap %, pre-market volume vs average,
  catalyst, ATR, liquidity).
- `catalyst` — the news in one or two sentences.
- `technical` — daily trend (from `trend`), where price sits vs PDH/PDL/20-day high, key levels.
- `setup` — one named setup from the course: Gap & Go (break of PMH after the first 5-minute
  candle), Opening Range Breakout (Level 6), PDH breakout + retest (Level 3), VWAP pullback,
  gap-fill fade, intraday VCP (Level 9).
- `plan.long` / `plan.short` / `plan.noTrade` — If–Then with prices: trigger, stop, first target,
  R:R (e.g. 「如果 09:35 後升穿 PMH $412.30 並企穩，Entry $412.40、Stop $409.90（開市 5 分鐘低位
  下方）、Target $417.30（PDH 之前），約 2R」). `noTrade` = when to skip (e.g. 開市跌穿 PML、
  量唔夠、大市急跌).
- `risks` — 2–4 short items.
- `news` — 1–3 items `{title, source, url, time}`.
- `levels` — `{pmh, pml, pdh, pdl, pdc}` plus optional `other: [{label, price}]`.

Also write `news` (5–10 market-wide headlines with URLs) and `lesson` (one beginner tip tied to
today, e.g. why to wait for the first 5 minutes on a big gap day).

## 8. File format

Write `data/picks/<targetDate>.json` (overwrite if it exists — e.g. a `test` version):

```json
{
  "version": 1,
  "date": "2026-10-28",
  "generatedAt": "2026-10-28T12:20:00Z",
  "status": "premarket",
  "dataQuality": "full",
  "dataSources": ["IBKR 實時報價", "IBKR Screener", "網上新聞搜尋"],
  "headline": "一句講晒今日重點（≤ 90 字）",
  "market": { "bias": "偏好", "summary": "", "indices": [], "events": [], "earnings": [] },
  "focus": "TSLA 今日狀態…",
  "picks": [{
    "sym": "TSLA", "name": "Tesla", "grade": "A", "beginner": "適合新手", "direction": "Long",
    "score": 82, "price": 0, "prevClose": 0, "gapPct": 0, "pmVolume": 0, "pmVolPct": 0,
    "avgVolume": 0, "spread": 0, "atr": 0, "mktCapB": null, "floatM": null,
    "levels": { "pmh": 0, "pml": 0, "pdh": 0, "pdl": 0, "pdc": 0, "other": [] },
    "why": "", "catalyst": "", "technical": "", "setup": "",
    "plan": { "long": "", "short": "", "noTrade": "" },
    "risks": [], "news": []
  }],
  "watch": [{ "sym": "", "why": "" }],
  "avoid": [{ "sym": "", "why": "" }],
  "news": [{ "title": "", "source": "", "url": "https://…", "time": "", "tickers": [] }],
  "lesson": "",
  "disclaimer": "教學用途，唔係投資建議。Day Trade 風險極高，可能損失全部本金。所有數字開市前請自行喺券商／TradingView 再確認。"
}
```

Numbers are plain numbers (no `$`, no `%`, no strings). `gapPct`, `pmVolPct`, `chgPct` are
percent values (2.5 means +2.5%). `price` is the latest pre-market price.

## 9. Validate, commit, push

```bash
node scripts/picks/build.mjs        # must print ✅ — fix every ❌ and run again
git add data/picks scripts/picks/contracts.json
git commit -m "Daily picks <targetDate>"
git push origin main                # if rejected: git pull --rebase origin main, then push again
```

Retry the push up to 4 times on network errors (2s, 4s, 8s, 16s).

## 10. Final message (it becomes the push notification)

Keep it short, Cantonese, outcome first:

「📋 10/28 選股已更新：大市偏好（期指 +0.4%）。A 級：NVDA +3.1%（業績）、TSLA +1.8%；
B 級：AMD。https://bill2712.github.io/tsla-trading-academy/#/picks/2026-10-28」

If anything failed (IBKR down, partial data), say so in one line.

## Time budget

The task starts about 25 minutes before 08:30 ET. Publish by ~08:35 ET even with fewer
picks — a smaller, accurate report beats a late one. Don't spend more than ~10 minutes
on news searches.

## If IBKR is unavailable

Try Yahoo (works only if the environment's network allows `query1.finance.yahoo.com`):
`curl -s "https://query1.finance.yahoo.com/v8/finance/chart/SYM?range=3mo&interval=1d"` and
`...?range=1d&interval=15m&includePrePost=true`. If that fails too, publish a report built from
web search only, with `"dataQuality": "partial"`, `null` for unknown numbers, and say so clearly
in `market.summary`.
