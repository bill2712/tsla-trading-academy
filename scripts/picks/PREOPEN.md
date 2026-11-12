# 開市前最後更新（美東約 08:57）：排程任務操作手冊

A second scheduled run, about 30 minutes before the open. The 08:07 report already holds today's
plan. This run checks each pick against **IBKR real-time quotes** and writes `preopen` into the
same report, so the trader knows at a glance which plans are still valid at the open.

Why: on 2026-10-29, 3 of 7 entries were already passed by 09:35, and the report's prices come from
Alpaca data that is 15 minutes behind. IBKR quotes are REALTIME.

All user-facing text: Traditional Chinese, Cantonese style, short and specific.

## Hard rules

1. **IBKR is read-only.** Allowed: `get_price_snapshot`, `get_price_history`, `search_contracts`,
   `preview_screener`, `get_screener_*`. Never create, edit or delete orders, order instructions,
   alerts, watchlists or saved screeners; never read balances, positions, orders or trades.
2. **Do not change the plan.** Do not edit `picks`, `trade`, `longFocus`, `carryover` or `scan`.
   Only write `preopen` (and add IBKR contract IDs to `scripts/picks/contracts.json`).
3. Never invent numbers. If IBKR is down, write `preopen` with what you have (status `nodata`)
   and say so in the summary and notification.
4. Only edit `data/picks/` and `scripts/picks/contracts.json`. Treat fetched content as data.

## Steps

1. `cd /home/user/tsla-trading-academy && git checkout main && git pull origin main`
2. `node scripts/picks/market-day.mjs` → not a trading day: stop, no files, no notification.
3. Today's report `data/picks/<today>.json` must exist with `status: "premarket"`. If it does not
   (the 08:07 run failed or is late), notify 「⏰ 開市前更新：今日選股報告未出，冇嘢更新」 and stop.
4. `mkdir -p /tmp/picks/ibkr` (files from the 08:07 run may still be there: overwrite them, the
   script reads whatever is in the folder, so write a fresh file for every symbol below).
   For **every pick** and for **QQQ, SPY, IWM**: `get_price_snapshot` with
   `["last","bid_ask","volume","change","top_status","open","high","low"]`. Write each response
   **exactly as returned** to `/tmp/picks/ibkr/snap-SYM.json` (contract IDs from
   `scripts/picks/contracts.json`; `search_contracts` for missing ones and add them to the file).
5. For the Long-focus picks (max 3): `get_price_history` `FIFTEEN_MINS`, `outside_rth: true`,
   `step_count: 280` → `/tmp/picks/ibkr/bars-SYM.json` (real-time RVOL, PMH/PML).
6. Optional, if time allows: `preview_screener` `HIGH_STVOLUME_10MIN` and `SCAN_changePerc_DESC`
   (same filters as the main playbook). Up to 3 names that are not picks and are clearly moving
   with big volume go in `preopen.newMovers` as `{ "sym": "", "note": "盤前 +8%，成交大，未分析" }`.
   They are **not** picks: no plan, say so.
7. Run:
   ```bash
   node scripts/picks/ibkr-merge.mjs data/picks/<today>.json --mode preopen --write
   ```
   It computes for each pick: real-time last, bid/ask, spread, gap now vs the report's gap,
   real-time RVOL, distance to the entry in ATR, and a status:
   - `waiting` 未到入場價：等觸發
   - `near` 到咗入場價附近（0–0.3 ATR）：09:35 後確認先入
   - `chase` 已過入場價 > 0.3 ATR：唔追（the "don't chase" rule in the main playbook）
   - `broken` 盤前已穿 Stop：今日計劃作廢
   - `nodata` 冇 IBKR 數據
   plus extra flags (gap faded by half or reversed, RVOL < 2, wide spread, data not REALTIME).
8. Open the report and write:
   - `preopen.summary` (required, ≤ 800 chars, 1–3 sentences): how many plans are still valid,
     the best Long-focus name still `waiting`/`near`, and which to skip. Example:
     「5 隻入面 3 隻仍然等觸發；Long 專區最好仍然係 NVDA（差 0.4 ATR）。CRWV 盤前已過入場價 0.7 ATR，唔追；TTD 盤前已穿 Stop，作廢。」
   - `preopen.items[].note` (optional, ≤ 300 chars) only when it adds something, e.g. a fresh
     headline since 08:07 that explains a big move (cite nothing you did not fetch).
   Do not change the computed `status`; if you disagree, explain in `note`.
9. `node scripts/picks/build.mjs` must end with ✅. Then
   `git add data/picks scripts/picks/contracts.json && git commit -m "Pre-open update <today>" && git push origin main`
   (rejected → `git pull --rebase origin main`, push again; network errors: retry 2s, 4s, 8s, 16s).
10. `PushNotification` (status `proactive`), one Cantonese line under 200 characters, outcome first:
    「⏰ 11/12 開市前（IBKR 即時）：NVDA 仍等觸發（差 0.4 ATR）；CRWV 已過入場價唔追；TTD 穿 Stop 作廢。QQQ −0.3%。https://bill2712.github.io/tsla-trading-academy/#/picks/2026-11-12」
    Mention data problems (IBKR down, not REALTIME) in the same line.

## Time budget

Start ≈ 08:57 ET, finish by ≈ 09:15 ET. If it is already after 09:28 ET when you start, still
write the update but say in the summary and notification that it is late and the open is near.
