# 每日開市前選股：排程任務操作手冊（v2）

This is the playbook for the scheduled task that publishes the daily pre-market day-trading
watchlist into the app (`#/picks`). The reader is a day trader in Hong Kong who **uses this
report to make real trading decisions**. Treat every number as if money depends on it:
verify, cross-check, and never fill gaps with guesses.

All user-facing text: **Traditional Chinese, Cantonese style** (係、嘅、唔、冇), concise and specific.

---

## 0. Hard rules

1. **RVOL ≥ 2 to enter `picks`.** RVOL = pre-market relative volume at time: cumulative volume
   from 04:00 ET to the last completed bar today ÷ the average for the same window over the
   previous ~10 sessions (computed by `gather.mjs` / `calc.mjs`). No RVOL number → not a pick
   (put it in `watch` with the reason).
2. **Aim for 5–7 picks** (max 8). Widen the search (more scans, more movers, more sectors)
   before giving up. If fewer than 5 pass RVOL ≥ 2, publish what passes and write
   `fewPicksReason` (e.g. 「今日只有 4 隻盤前 RVOL ≥ 2，其餘放觀察名單」). Never lower the bar.
3. **Every pick needs** price, change from close (gapPct), pre-market volume, average volume,
   RVOL, ATR, spread, PMH/PML/PDH/PDL/PDC, catalyst + at least one news link (or `newsNote`
   saying you searched and found none), the five-pillar analysis, and a numeric trade plan.
   `node scripts/picks/build.mjs` enforces this.
4. **Multiple sources.** Don't rely on one feed. Cross-check price/gap between at least two
   sources when possible (e.g. IBKR snapshot vs Yahoo). If they disagree by > 0.5%, say so and
   use the more recent quote. Record every source you tried in `sources` (ok true/false).
5. **IBKR is read-only.** Allowed: `search_contracts`, `search_futures`, `get_price_snapshot`,
   `get_price_history`, `get_screener_*`, `preview_screener`, `search_earnings_insights`,
   `get_earnings_insight`, `get_company_themes`, `get_company_connections`. **Never** create,
   edit or delete orders, order instructions, alerts, watchlists or saved screeners, and never
   read account balances, positions, orders or trades.
6. Only edit `data/picks/` and `scripts/picks/contracts.json`. Never invent numbers, news or URLs.
7. **TSLA section (`focus`) is optional** — include it only when TSLA is genuinely worth
   trading today (RVOL ≥ 2, or |gap| ≥ 2%, or important news). Otherwise omit the field.

## 1. Setup and target day

```bash
cd /home/user/tsla-trading-academy && git checkout main && git pull origin main
node scripts/picks/market-day.mjs
```

Use `targetDate` and `status`. If today is not a trading day, stop (no files, no commit) and
notify 「今日美股休市（原因）」. Mention a half day (13:00 close) in summary and events.

## 2. Review yesterday's report

Newest `data/picks/*.json` before `targetDate` without `review`: for each pick get the daily
bar (IBKR `get_price_history` ONE_DAY step_count 5, or Yahoo) and fill
`review.items[]` = `{sym, open, high, low, close, chgFromOpenPct, hitPmh, verdict, note}`.
In `verdict`, judge the **plan**: did the trigger happen? would Target 1 or Stop have hit first
(use 5-min bars if needed)? Summarise honestly in `review.summary` — this is how the user
learns which kinds of picks work.

## 3. Collect data — use all sources

### 3a. Automatic collector (Nasdaq, StockAnalysis, Finviz, Yahoo, SEC, RSS, Alpaca)

```bash
NODE_USE_ENV_PROXY=1 node --no-warnings scripts/picks/gather.mjs --date <targetDate> --movers --out /tmp/picks/gather.json
```

(`NODE_USE_ENV_PROXY=1` is required — without it Node cannot reach the internet in this sandbox.)
Known status: Nasdaq calendars, StockAnalysis pre-market movers and Finviz news work. Yahoo often
answers HTTP 429 from this cloud IP — the collector stops after 3 refusals; do not try to get
around rate limits. SEC needs `secContact` in `scripts/picks/config.json`; if empty it is skipped.
Use the Nasdaq economic calendar (`timeET`, consensus, previous, actual) for `market.events` and
the Nasdaq earnings list for `market.earnings`.

Prints which sources worked, plus a table (price, gap %, RVOL, pre-market volume, ATR %,
news count, SEC filings). Add `--symbols A,B,C` to check extra names (e.g. from IBKR scans).
If every source fails (network blocked), continue with 3b + 3c and set `dataQuality: partial`.

### 3b. IBKR (real-time confirmation + discovery)

Contract IDs: `scripts/picks/contracts.json` first; `search_contracts` only for new symbols
(US row, exact symbol), then add them to the file.

- Market: `get_price_snapshot` `["last","change","volume"]` for SPY, QQQ, IWM, DIA, SMH, XLK,
  VIX (IND/CBOE); ES/NQ via `search_futures` if useful.
- Discovery scans (`preview_screener`, selector `STK`, locations `["STK.US.MAJOR"]`, 25 each):
  `SCAN_changePerc_DESC` and `SCAN_changePerc_ASC` with `priceAbove 5`, `avgVolumeAbove 1000000`,
  `marketCapAbove1e6 300`; `HIGH_STVOLUME_10MIN` with `priceAbove 5`; and an RVOL scan
  `SCAN_stVolumeVsAvg10min_DESC` with `priceAbove 5`, `avgVolumeAbove 1000000`.
- For each shortlisted name: `get_price_snapshot`
  `["last","change","volume","bid_ask","avg_90d_usd_volume"]` (spread = ask − bid).
- **RVOL when Yahoo is unavailable:** `get_price_history` `step: ONE_HOUR`, `period: TWO_WEEKS`,
  `outside_rth: true`, plus daily `ONE_DAY` `step_count: 60`. Save both raw responses to
  `/tmp/picks/SYM-*.json` and run
  `node scripts/picks/calc.mjs --date <targetDate> /tmp/picks/SYM-daily.json /tmp/picks/SYM-1h.json`.
  It returns `rvol`, `rvolPass`, `pmh/pml`, `gapPct`, `atr14`, levels and trend.

### 3c. Daily reference lists (check every run)

Use the **web search tool with `allowed_domains`** (these sites block scripted access; don't
scrape them or call their internal APIs):

| Source | Search | Use it for |
|---|---|---|
| CNBC (`cnbc.com`) | `stocks making the biggest moves premarket <Month D, YYYY>` and `stock market today live updates <Month D>` | Today's premarket movers with the reason, market tone |
| TradeThatSwing (`tradethatswing.com`) | `best stocks for day trading this week` | Weekly list of liquid, high-range day-trading names (high volatility %, big $ movement, mid-priced high volume). Tag picks that are on it. |
| Warrior Trading (`warriortrading.com`) | `day trading watch list` | Its live scanner table is not publicly readable — use its stock-selection criteria: up ≥ 10% / big gap, RVOL ≥ 5×, price $1–20, fresh news, float < 20M. Names that meet all five get the tag 「Warrior 動能準則」 and are usually 高風險. |

For each pick, set `lists` to the lists it appears on, e.g.
`["CNBC 盤前異動", "TradeThatSwing 本週名單", "StockAnalysis 盤前升幅榜", "Warrior 動能準則"]`.
Being on several lists raises confidence but never replaces the RVOL ≥ 2 rule.

### 3d. News and calendar (web search + the collector's feeds)

- Web search (several queries in one turn): `stock market futures premarket <Month D, YYYY>`,
  `economic calendar <Month D, YYYY>`, `<SYM> stock news <Month D>` for each candidate, and
  `stocks moving premarket <Month D, YYYY>`.
- Prefer news from the last 24 h. For each pick explain **why it is moving** (earnings,
  guidance, upgrade/downgrade, deal, FDA, filing, sector move, macro). Use SEC filings
  (8-K, S-3/424B = possible dilution) from the collector as hard evidence.
- Only cite URLs that appeared in tool results.

## 4. Choose the picks

1. Pool = collector table + IBKR scans + CNBC premarket movers + TradeThatSwing weekly list + core liquid names (TSLA, NVDA, AAPL, AMD, META, AMZN,
   MSFT, GOOGL, AVGO, NFLX, PLTR, COIN, MU, SMCI, MSTR, HOOD, ARM).
2. Filter: price ≥ $5, average volume ≥ 1M shares, normal spread (≤ ~0.15% of price for large
   caps), **RVOL ≥ 2**.
3. Score 0–100: liquidity 20, RVOL/in-play 25, catalyst 20, clean levels 15, market fit 10,
   tape quality 10. Grade A ≥ 75, B 60–74 (C does not go in `picks`).
4. `beginner`: 適合新手 = cap ≥ $10B, price ≥ $10, avg vol ≥ 5M, gap < 10%; 中等 = cap ≥ $1B;
   高風險 = smaller / low float / gap ≥ 20% / binary news / dilution.
5. `watch` = interesting names that failed a rule (say which, e.g. 「RVOL 1.4，未夠 2」).
   `avoid` = big movers a trader should not touch (tiny float, dilution, halts, wide spread).

## 5. Five-pillar analysis for every pick (`pillars`)

| Field | What to write |
|---|---|
| `bigPicture` | Index futures / SPY / QQQ direction, VIX, sector ETF, events today — does it help or hurt this trade? |
| `fundamentals` | Why it is moving today (news, earnings numbers, guidance, filings) and how strong / fresh the catalyst is. |
| `technical` | Daily trend (20/50-day), where the gap sits vs PDH/PDL/20-day high, PMH/PML, key levels, room to target. |
| `tape` | Pre-market volume pattern (steady or one spike?), RVOL, spread and bid/ask size, holding near PMH or fading — and what volume you need at the open. |
| `intuition` | Overall judgment and confidence (高／中／低) with the one thing that would change your mind. |

## 6. Trade plan for every pick (`trade` + `plan`)

Main setup: **Opening Drive (開市推動)** — after the open, price breaks the opening range in the
direction of the gap with a clear volume surge. Alternatives: PMH/PDH breakout + retest
(Level 3), ORB 15m (Level 6), VWAP pullback, gap-fill fade, intraday VCP (Level 9).

`trade` (numbers only, validated):

```json
"trade": { "side": "Long", "trigger": "09:35 後升穿首 5 分鐘高位，而首 5 分鐘成交 ≥ 平時 2 倍（約 120 萬股）",
           "entry": 412.40, "stop": 409.90, "target1": 417.30, "target2": 421.00, "rr": 1.96 }
```

- Long: stop < entry < target1. Short: reverse. `rr` = |target1 − entry| ÷ |entry − stop|.
- Stop at structure (opening-range low, PML, VWAP) — normally ≤ 0.3–0.5 ATR for day trades.
- Target 1 before the next real level (PDH, 20-day high, PMH); aim ≥ 2R, never below 1.5R.
- Use `avgOpenBarVol` from the collector to write the opening-volume condition.
- `plan.long` / `plan.short` / `plan.noTrade`: short If–Then text, including when **not** to
  trade (e.g. opens below PML, no volume surge, market dumps, R:R < 1.5 after the open).
- `risks`: 2–4 items.

## 7. File format (version 2)

`data/picks/<targetDate>.json` (overwrite a `test` version):

```json
{
  "version": 2, "date": "YYYY-MM-DD", "generatedAt": "<ISO>", "status": "premarket",
  "dataQuality": "full",
  "sources": [{ "name": "IBKR 實時報價", "ok": true }, { "name": "Yahoo Finance", "ok": false, "note": "網絡封鎖" }],
  "headline": "一句講晒今日重點（≤ 90 字）",
  "market": { "bias": "偏好／偏淡／中性／風險高", "summary": "", "indices": [{ "sym": "QQQ", "last": 0, "chgPct": 0, "note": "" }],
              "events": [{ "time": "08:30 ET", "name": "", "impact": "高", "note": "" }], "earnings": [{ "sym": "", "when": "盤前", "note": "" }] },
  "focus": "（可選）TSLA 今日真係值得做先寫",
  "fewPicksReason": "（可選）少過 5 隻時必填",
  "picks": [{
    "sym": "", "name": "", "grade": "A", "beginner": "中等", "direction": "Long", "score": 80,
    "price": 0, "prevClose": 0, "gapPct": 0, "pmVolume": 0, "pmVolPct": 0, "avgVolume": 0,
    "rvol": 2.4, "spread": 0, "atr": 0, "mktCapB": null, "floatM": null,
    "levels": { "pmh": 0, "pml": 0, "pdh": 0, "pdl": 0, "pdc": 0, "other": [{ "label": "20 日高", "price": 0 }] },
    "why": "", "catalyst": "", "technical": "", "setup": "開市推動（Opening Drive）",
    "pillars": { "bigPicture": "", "fundamentals": "", "technical": "", "tape": "", "intuition": "" },
    "trade": { "side": "Long", "trigger": "", "entry": 0, "stop": 0, "target1": 0, "target2": null, "rr": 0 },
    "plan": { "long": "", "short": "", "noTrade": "" },
    "risks": [], "news": [{ "title": "", "source": "", "url": "https://…", "time": "" }], "newsNote": "（冇新聞先寫）",
    "lists": ["CNBC 盤前異動", "TradeThatSwing 本週名單"]
  }],
  "watch": [{ "sym": "", "why": "" }], "avoid": [{ "sym": "", "why": "" }],
  "news": [{ "title": "", "source": "", "url": "https://…", "time": "", "tickers": [] }],
  "lesson": "今日一個實戰提示",
  "disclaimer": "Day Trade 風險極高，可能損失全部本金。報告由 AI 整理，可能有延遲或錯誤；落單前請自行核對價位，並按自己嘅風險上限計股數。"
}
```

Numbers are plain numbers. `gapPct`, `pmVolPct`, `chgPct` are percents (2.5 = +2.5%).

## 8. Validate, commit, push

```bash
node scripts/picks/build.mjs      # must end with ✅; fix every ❌; read every ⚠️
git add data/picks scripts/picks/contracts.json
git commit -m "Daily picks <targetDate>"
git push origin main               # rejected → git pull --rebase origin main, push again
```

Retry network failures up to 4 times (2s, 4s, 8s, 16s).

## 9. Notify

`PushNotification` (status `proactive`), one Cantonese line under 200 characters, outcome first:
「📋 10/28 選股：大市偏好。NVDA +3.1% RVOL 4.2（業績）、AMD +2.4% RVOL 2.6…（共 6 隻）
https://bill2712.github.io/tsla-trading-academy/#/picks/2026-10-28」.
If a step failed or data was partial, say so in the same line.

## Time budget

Start ≈ 08:07 ET; publish by ≈ 08:40 ET. Quality first, but a report after 09:15 ET is useless —
if short on time, publish fewer, fully-checked picks and say so.
