/* =========================================================
 * 工具地圖：每個工具喺 Day Trade 邊個階段用、係咪實戰必用
 * stage：pre 開市前｜open 開市頭 15 分鐘｜entry 入場一刻｜hold 持倉中｜post 收市後｜week 每週／每月｜learn 學習研究
 * use：live 🔴 交易日實戰用｜prep 🟡 準備時用（開市前／週末）｜review 🔵 檢討用｜learn ⚪ 學習參考（唔使喺交易日開）
 * merged：呢個計算已經包喺邊個一合一工具
 * ========================================================= */
(function () {
  const STAGES = [
    { k: 'pre', icon: '🌅', t: '開市前', et: '08:30–09:25', hk: '21:30–22:25（冬令）', job: '揀股、畫線、計好股數、設警報' },
    { k: 'open', icon: '👀', t: '開市頭 15 分鐘', et: '09:30–09:45', hk: '22:30–22:45', job: '唔落單：睇成交夠唔夠、QQQ、開市區間' },
    { k: 'entry', icon: '⚡', t: '入場一刻', et: '09:45–11:30', hk: '22:45–00:30', job: '警報響 → 核對三樣嘢 → 落已經計好嘅 Bracket' },
    { k: 'hold', icon: '🛡️', t: '持倉中', et: '入場後', hk: '', job: '+1R 移 Stop、睇 QQQ、留意每日上限同情緒' },
    { k: 'post', icon: '📝', t: '收市後', et: '收工後 10 分鐘', hk: '', job: '記日誌、計實際 R、寫一句教訓' },
    { k: 'week', icon: '📊', t: '每週／每月', et: '星期六', hk: '', job: '統計、檢討、決定改一樣嘢' },
    { k: 'learn', icon: '📚', t: '學習研究', et: '有時間先用', hk: '', job: '理解概念、練習、回測；交易日唔使開' },
  ];
  const USES = {
    live: { icon: '🔴', t: '實戰必用', d: '交易日要用，開市前開定' },
    prep: { icon: '🟡', t: '準備時用', d: '開市前或者週末準備用，開市後唔使再開' },
    review: { icon: '🔵', t: '檢討用', d: '收市後、週末檢討用' },
    learn: { icon: '⚪', t: '學習參考', d: '幫你明白概念；實戰時唔使開' },
  };
  const DESK = 'bracket-ticket';
  const M = {
    /* ---- 實戰 ---- */
    'open-cockpit': { stage: 'pre', use: 'live', when: '08:40 報告出咗之後開：一次過計晒今日每隻 pick 嘅股數、Stop、Target、唔追價同警報價。' },
    [DESK]: { stage: 'entry', use: 'live', when: '開市前準備每隻嘅落單資料；觸發時照住三張單落 Bracket。已經整合咗落單前紀律閘、計股數、Stop 檢查、障礙、成本、追價重計、實際 Net R。' },
    multichart: { stage: 'open', use: 'live', when: '開市前開定：個股 5 分鐘 + 日線 + QQQ 一個畫面，頂部 A+ 過濾即時檢查。' },
    'tv-allinone': { stage: 'open', use: 'live', when: '設定一次就得；之後每日喺 TradingView 開住，VWAP、EMA、PDH／PMH、開市區間一個指標睇晒。' },
    'circuit-breaker': { stage: 'pre', use: 'live', when: '開市前望一眼：今日、本週、本月有冇到虧損上限；交易中連輸兩筆會自動入冷靜期。交易一頁通嘅紀律閘會自動讀佢。' },
    'daily-risk': { stage: 'hold', use: 'live', when: '每平一筆就更新：去到每日虧損上限即刻停。' },
    'tilt-check': { stage: 'hold', use: 'live', when: '連輸兩筆、或者覺得想追返嗰陣做一次（30 秒）。' },
    /* ---- 開市前準備 ---- */
    'gap-analyzer': { stage: 'pre', use: 'prep', when: '報告冇覆蓋嘅股、或者想自己判斷 Gap 劇本時用。' },
    'event-risk': { stage: 'pre', use: 'prep', when: '有 CPI、FOMC、業績嘅日子，開市前做一次決定注碼同避開時段。' },
    'mtf-align': { stage: 'pre', use: 'prep', when: '開市前對每隻候選做一次：日線、15 分鐘、5 分鐘方向一唔一致。' },
    'rel-strength': { stage: 'open', use: 'prep', when: '想自己計強弱時用；實戰時多圖看盤頂部已經即時顯示相對 QQQ 強弱。' },
    'trade-plan': { stage: 'pre', use: 'prep', when: '想將一筆計劃寫成十項文字（例如練習、覆盤）時用；實戰落單用 ⚡ 交易一頁通。' },
    'zone-builder': { stage: 'pre', use: 'prep', when: '畫 S/R 區域時唔肯定闊度先用。' },
    'trend-template': { stage: 'pre', use: 'prep', when: '週末揀 VCP／升勢股時檢查日線條件。' },
    'vcp-plan': { stage: 'pre', use: 'prep', when: '做 VCP 突破先用：由 Pivot 計入場、Stop、股數。' },
    timezone: { stage: 'pre', use: 'prep', when: '夏令／冬令轉換嗰兩個星期確認開市時間。' },
    /* ---- 檢討 ---- */
    'weekly-review': { stage: 'week', use: 'review', when: '星期六：由交易日誌自動計期望值、遵守率、錯誤成本同切片。' },
    'r-stats': { stage: 'week', use: 'review', when: '想快速計一串 R 嘅勝率、期望值、回撤時用（唔用日誌嘅話）。' },
    'mfe-mae': { stage: 'post', use: 'review', when: '收市後檢討：持倉期間最多賺過、最多輸過幾多 R，用嚟調 Stop／Target。' },
    compliance: { stage: 'week', use: 'review', when: '每週計一次：有效訊號入面跟規則嘅比例。' },
    'scale-ladder': { stage: 'week', use: 'review', when: '每月一次：決定升級、留級定降級。' },
    'plan-doc': { stage: 'week', use: 'prep', when: '開始真錢之前寫一次；之後每季檢討。' },
    'rules-builder': { stage: 'week', use: 'prep', when: '改規則嗰陣開新版本；平日唔使開。' },
    'pa-journal': { stage: 'post', use: 'review', when: 'Replay 或者收市後覆盤一張圖時填。' },
    /* ---- 已經整合入交易一頁通 ---- */
    'possize-basic': { stage: 'learn', use: 'learn', merged: DESK, when: '學股數點計時用；實戰用 ⚡ 交易一頁通（已包）。' },
    'possize-pro': { stage: 'learn', use: 'learn', merged: DESK, when: '學滑價同費用點影響股數；實戰用 ⚡ 交易一頁通（已包）。' },
    'late-entry': { stage: 'learn', use: 'learn', merged: DESK, when: '學追價點樣改變 R:R；實戰喺 ⚡ 交易一頁通輸入「而家價」就會自動重計。' },
    obstacle: { stage: 'learn', use: 'learn', merged: DESK, when: '學 Target 前有障礙點計；實戰喺 ⚡ 交易一頁通填「下一個阻力」。' },
    'atr-check': { stage: 'learn', use: 'learn', merged: DESK, when: '學 Stop 同 ATR 嘅關係；⚡ 交易一頁通會自動檢查。' },
    spread: { stage: 'learn', use: 'learn', merged: DESK, when: '學 Spread 成本；⚡ 交易一頁通會計成本佔幾多 R。' },
    slippage: { stage: 'learn', use: 'learn', merged: DESK, when: '學滑價點影響 R:R；⚡ 交易一頁通嘅追價重計同成本已包。' },
    netr: { stage: 'learn', use: 'learn', merged: DESK, when: '學真正 R 點計；⚡ 交易一頁通「收市後」一格已包。' },
    /* ---- 學習參考 ---- */
    'decision-coach': { stage: 'learn', use: 'learn', when: 'Replay 練習時用嚟練 WAIT／PLAN／SKIP 判斷。' },
    'no-entry': { stage: 'learn', use: 'learn', when: 'Replay 成日搵唔到入場位時用嚟診斷。' },
    'candle-builder': { stage: 'learn', use: 'learn', when: '學 K 線結構。' },
    clv: { stage: 'learn', use: 'learn', when: '學收市位置。' },
    vwap: { stage: 'learn', use: 'learn', when: '學 VWAP 點計。' },
    rvol: { stage: 'learn', use: 'learn', when: '學 RVOL 點計；實戰時報告同多圖看盤已經計好。' },
    'expectancy-mini': { stage: 'learn', use: 'learn', when: '學勝率同 R:R 點樣砌成期望值。' },
    'expectancy-lab': { stage: 'learn', use: 'learn', when: '研究成本同勝率對期望值嘅影響。' },
    'cost-impact': { stage: 'learn', use: 'learn', when: '研究成本點食掉利潤。' },
    stress: { stage: 'learn', use: 'learn', when: '研究滑價壓力測試。' },
    recovery: { stage: 'learn', use: 'learn', when: '明白點解要控制回撤。' },
    streak: { stage: 'learn', use: 'learn', when: '預備心理：正常策略都會連敗幾多次。' },
    ci: { stage: 'learn', use: 'learn', when: '判斷樣本夠唔夠。' },
    'monte-carlo': { stage: 'learn', use: 'learn', when: '睇同一個策略可能嘅回撤範圍；設停止條件時參考。' },
    'kelly-ror': { stage: 'learn', use: 'learn', when: '決定每筆風險 % 之前研究。' },
    'overfit-demo': { stage: 'learn', use: 'learn', when: '學過度擬合。' },
    knowable: { stage: 'learn', use: 'learn', when: '學回測時點樣避免偷睇未來。' },
    'state-machine': { stage: 'learn', use: 'learn', when: '學系統點樣逐支 K 決定。' },
    'csv-checker': { stage: 'learn', use: 'learn', when: '自己做回測前檢查數據。' },
    'partial-tp': { stage: 'learn', use: 'learn', when: '研究分批止賺。' },
    'trail-sim': { stage: 'learn', use: 'learn', when: '研究出場方法。' },
    'corr-risk': { stage: 'learn', use: 'learn', when: '同時揸幾個倉之前研究總風險。' },
    orderbook: { stage: 'learn', use: 'learn', when: '學市價單點樣食穿盤口。' },
    'order-sim': { stage: 'learn', use: 'learn', when: '學 Stop Market 同 Stop Limit 嘅分別。' },
    'vcp-contraction': { stage: 'learn', use: 'learn', when: '學 VCP 收縮點量度。' },
    'vcp-volume': { stage: 'learn', use: 'learn', when: '學 VCP 量縮點量度。' },
  };
  /* 唔係工具但係每日流程要用嘅頁面 */
  const PAGES = {
    pre: [['#/picks', '📋', '每日選股報告', 'live']],
    post: [['#/journal', '📒', '交易日誌', 'live']],
    week: [['#/edge', '📊', '我有冇 Edge？', 'review']],
    learn: [['#/replay', '🎮', 'K 線重播', 'learn'], ['#/sim', '🕹️', '模擬交易練習場', 'learn'], ['#/lab', '🔬', '回測實驗室', 'learn']],
  };
  const info = (id) => M[id] || { stage: 'learn', use: 'learn', when: '' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function badge(id) { const u = USES[info(id).use]; return `<i class="tm-badge u-${info(id).use}" title="${esc(u.d)}">${u.icon} ${u.t}</i>`; }
  function banner(id) {
    const m = info(id), u = USES[m.use], st = STAGES.find((s) => s.k === m.stage) || STAGES[6], T = window.TOOLS || {};
    return `<div class="tm-banner u-${m.use}"><b>${u.icon} ${u.t}</b><span>${st.icon} ${st.t}${st.et ? `（美東 ${st.et}）` : ''}</span>
      ${m.when ? `<p>🕒 幾時用：${esc(m.when)}</p>` : ''}
      ${m.merged && T[m.merged] ? `<p class="tm-merged">🧩 呢個計算已經包喺 <a href="#/tools/${m.merged}">${T[m.merged].icon} ${esc(T[m.merged].title)}</a>：實戰時開嗰個就夠，呢度留俾你學概念。</p>` : ''}</div>`;
  }
  /* 工具箱頂部：每日流程地圖 */
  function workflow(embed) {
    const T = window.TOOLS || {};
    const by = {}; STAGES.forEach((s) => (by[s.k] = []));
    Object.keys(T).forEach((id) => { const m = info(id); if (!m.merged) (by[m.stage] || by.learn).push(id); });
    const order = { live: 0, prep: 1, review: 2, learn: 3 };
    const item = (href, icon, title, use) => `<a class="tm-item u-${use}" href="${href}"><span>${icon}</span><b>${esc(title)}</b><i>${USES[use].icon}</i></a>`;
    return `<section class="tm-flow">${embed ? '' : '<h2 class="sec-h">🗺️ 每日流程：邊個階段用邊個工具</h2>'}
      <p class="muted">${Object.values(USES).map((u) => `${u.icon} <b>${u.t}</b>：${u.d}`).join('　')}</p>
      <div class="tm-stages">${STAGES.filter((s) => s.k !== 'learn').map((s) => {
        const ids = by[s.k].sort((a, b) => order[info(a).use] - order[info(b).use]);
        return `<div class="tm-stage"><div class="tm-st-h"><span>${s.icon}</span><b>${s.t}</b><small>${esc(s.et)}${s.hk ? `｜香港 ${esc(s.hk)}` : ''}</small></div>
          <p class="tm-job">${esc(s.job)}</p>
          ${(PAGES[s.k] || []).map((p) => item(p[0], p[1], p[2], p[3])).join('')}
          ${ids.map((id) => item('#/tools/' + id, T[id].icon, T[id].title, info(id).use)).join('')}</div>`;
      }).join('')}</div>
      <p class="tm-tip">💡 交易日真正要開嘅只有 🔴：<b>每日選股 → 開市前計劃表 → 🧯 斷路器 → 多圖看盤 → ⚡ 交易一頁通（頂部係落單前紀律閘）→ 交易日誌</b>。其他留返開市前、週末或者學習時先用。</p>
      <details class="tm-learn"><summary>📚 學習研究用（${by.learn.length} 個工具 + Replay、模擬、回測）：交易日唔使開</summary>
        <div class="tm-learn-grid">${(PAGES.learn || []).map((p) => item(p[0], p[1], p[2], p[3])).join('')}${by.learn.map((id) => item('#/tools/' + id, T[id].icon, T[id].title, 'learn')).join('')}</div></details>
      <p class="muted">🧩 已經整合入 ⚡ 交易一頁通嘅 ${Object.keys(M).filter((k) => M[k].merged && T[k]).length} 個計算器（計股數、滑價同費用、追價重計、障礙、Stop 對 ATR、Spread、實際 Net R），喺下面「學習參考」仍然搵到。</p></section>`;
  }
  window.ToolMap = { STAGES, USES, info, badge, banner, workflow };
})();
