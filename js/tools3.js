/* =========================================================
 * 落盤效率工具（Level 7「落盤效率」單元）：Bracket 落單卡、開市前計劃表
 * 開市前將計算做晒，開市時只需要「核對 → 落單」。
 * 教學用途｜App 唔會幫你落單，亦唔會連去券商。
 * ========================================================= */
(function () {
  const TOOLS = window.TOOLS;
  const { F, money, esc, stat, big, verdict } = window.ToolUtil;
  const numOr = (v, d) => { const x = parseFloat(v); return isFinite(x) ? x : d; };
  const r2 = (v) => Math.round(v * 100) / 100;

  /* ---------- 共用：我嘅交易設定（本金、每筆風險、現金上限） ---------- */
  const SET_KEY = 'trade-settings';
  const SET_DEF = { acct: 10000, riskMode: 'pct', riskPct: 0.5, riskUsd: 50, maxPosPct: 50, cash: 'yes', dayStopR: 3 };
  function getSet() { try { return Object.assign({}, SET_DEF, (Store.user().toolState || {})[SET_KEY] || {}); } catch (e) { return Object.assign({}, SET_DEF); } }
  function putSet(s) { try { const u = Store.user(); u.toolState = u.toolState || {}; u.toolState[SET_KEY] = s; Store.save(); } catch (e) {} }
  const budgetOf = (S) => (S.riskMode === 'usd' ? S.riskUsd : (S.acct * S.riskPct) / 100);
  function settingsHTML(S) {
    return `<details class="tq-set"><summary>⚙️ 我嘅設定：本金 ${money(S.acct, 0)}・每筆風險 ${money(budgetOf(S), 0)}・每隻最多用 ${S.maxPosPct}% 本金${S.cash === 'yes' ? '・Cash 戶口' : ''}（撳開修改，所有落單工具共用）</summary>
      <div class="tool-grid">
        <label class="fld"><span>本金（USD）</span><input type="number" inputmode="decimal" data-s="acct" value="${S.acct}"></label>
        <label class="fld"><span>風險計法</span><select data-s="riskMode"><option value="pct" ${S.riskMode === 'pct' ? 'selected' : ''}>本金 %</option><option value="usd" ${S.riskMode === 'usd' ? 'selected' : ''}>固定金額</option></select></label>
        <label class="fld"><span>每筆風險（%）</span><input type="number" inputmode="decimal" step="0.05" data-s="riskPct" value="${S.riskPct}"></label>
        <label class="fld"><span>每筆風險（USD）</span><input type="number" inputmode="decimal" data-s="riskUsd" value="${S.riskUsd}"></label>
        <label class="fld"><span>每隻最多用本金（%）</span><input type="number" inputmode="decimal" step="5" data-s="maxPosPct" value="${S.maxPosPct}"></label>
        <label class="fld"><span>戶口類型</span><select data-s="cash"><option value="yes" ${S.cash === 'yes' ? 'selected' : ''}>Cash（唔可以沽空）</option><option value="no" ${S.cash !== 'yes' ? 'selected' : ''}>Margin</option></select></label>
        <label class="fld"><span>每日虧損上限（R）</span><input type="number" inputmode="decimal" step="0.5" data-s="dayStopR" value="${S.dayStopR}"></label>
      </div></details>`;
  }
  function bindSettings(el, onChange) {
    el.querySelectorAll('[data-s]').forEach((i) => i.addEventListener('change', () => {
      const S = getSet(); const k = i.dataset.s;
      S[k] = i.tagName === 'SELECT' ? i.value : numOr(i.value, S[k]);
      putSet(S); onChange();
    }));
  }

  /* 一筆交易嘅全部數字 */
  function plan(p, S) {
    const long = p.side !== 'short';
    const sg = long ? 1 : -1;
    const entry = p.entry;
    const stop = p.stopMode === 'atr' && p.atr > 0 ? r2(entry - sg * p.atrMult * p.atr) : p.stop;
    const risk = sg * (entry - stop);
    if (!(entry > 0) || !(risk > 0)) return { err: long ? 'Long 嘅 Stop 要低過 Entry。' : 'Short 嘅 Stop 要高過 Entry。' };
    const t1 = p.tMode === 'price' ? p.t1 : r2(entry + sg * p.t1R * risk);
    const t2 = p.tMode === 'price' ? (p.t2 > 0 ? p.t2 : null) : p.t2R > 0 ? r2(entry + sg * p.t2R * risk) : null;
    const rr = (sg * (t1 - entry)) / risk;
    const budget = budgetOf(S);
    const byRisk = Math.floor(budget / risk), byCash = Math.floor((S.acct * S.maxPosPct) / 100 / entry);
    const shares = Math.max(0, Math.min(byRisk, byCash));
    const lim = p.entryType === 'breakout' ? r2(entry + sg * Math.max(0.01, p.atr > 0 ? p.atr * 0.05 : entry * 0.001)) : null;
    return {
      long, sg, entry, stop, risk, t1, t2, rr, budget, byRisk, byCash, shares, lim,
      chase: p.atr > 0 ? r2(entry + sg * 0.3 * p.atr) : null,
      be: r2(entry + sg * risk),
      cash: shares * entry, riskUsd: shares * risk, t1Usd: shares * Math.abs(t1 - entry),
    };
  }
  function ticketText(p, P) {
    const act = P.long ? 'BUY' : 'SELL', ex = P.long ? 'SELL' : 'BUY';
    const parent = p.entryType === 'breakout'
      ? `${act} ${P.shares} ${p.sym} STP LMT｜Stop 價 ${F(P.entry)}｜Limit 價 ${F(P.lim)}｜DAY`
      : `${act} ${P.shares} ${p.sym} LMT ${F(P.entry)}｜DAY`;
    return [
      `【${p.sym} ${P.long ? 'Long' : 'Short'} Bracket】`,
      `母單：${parent}`,
      `Profit Taker：${ex} ${P.shares} LMT ${F(P.t1)}`,
      `Stop Loss：${ex} ${P.shares} STP ${F(P.stop)}`,
      `風險 ${money(P.riskUsd)}（每股 ${F(P.risk)}）｜R:R ${F(P.rr)}｜需要現金 ${money(P.cash, 0)}`,
      P.chase ? `唔追：09:35 已經${P.long ? '高' : '低'}過 ${F(P.chase)} 就唔做` : '',
      `到 ${F(P.be)}（+1R）可以將 Stop 移返 ${F(P.entry)}`,
      P.t2 ? `Target 2：${F(P.t2)}（Bracket 只有一個 Profit Taker，要分段就手動改）` : '',
    ].filter(Boolean).join('\n');
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); if (btn) { const o = btn.textContent; btn.textContent = '✅ 已複製'; setTimeout(() => (btn.textContent = o), 1500); } }
    catch (e) { window.prompt('複製下面文字：', text); }
  }
  /* 由網址帶入（例如由每日選股撳過嚟）：#/tools/bracket-ticket?sym=NVDA&side=long&entry=191&stop=188.76&t1=195.48&t2=197.72&atr=7.46 */
  function urlParams() {
    const q = (location.hash.split('?')[1] || '');
    const o = {}; q.split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k && v != null) o[decodeURIComponent(k)] = decodeURIComponent(v); });
    return o;
  }

  /* ---------------- ⚡ 交易一頁通（原 Bracket 落單卡）：計股數 + 實戰檢查 + IBKR 三張單 + 收市後 Net R ----------------
   * 整合咗：Position Size（基本／進階）、入場太遲重計 R:R、中途障礙、Stop vs ATR、Spread 成本、滑價、Net R */
  TOOLS['bracket-ticket'] = {
    title: '交易一頁通：股數、檢查、IBKR 落單卡', icon: '⚡', cat: '落盤效率', level: 'l13',
    desc: '實戰一個工具就夠：計股數（風險同資金兩個上限）、Target、唔追價、+1R 移 Stop；自動檢查 Stop 對 ATR、R:R、下一個阻力、成本佔幾多 R、而家價追唔追得；出 IBKR Bracket 三張單；收市後填實際成交計 Net R。可以由每日選股一撳帶入。',
    render(el, ctx) {
      const DEF = { sym: 'NVDA', side: 'long', entryType: 'breakout', entry: 191, stopMode: 'price', stop: 188.76, atr: 7.46, atrMult: 0.3, tMode: 'r', t1R: 2, t2R: 3, t1: 195.48, t2: 197.72, px: 0, obs: 0, spr: 0.02, comm: 0.005, commMin: 1, fe: 0, fx: 0 };
      const p = ctx.load(Object.assign({}, DEF));
      const u = urlParams();
      if (u.sym) {
        Object.assign(p, { sym: String(u.sym).toUpperCase().slice(0, 10), side: u.side === 'short' ? 'short' : 'long', entryType: 'breakout', stopMode: 'price', tMode: 'price' });
        ['entry', 'stop', 't1', 't2', 'atr', 'obs'].forEach((k) => { if (u[k] != null) p[k] = numOr(u[k], p[k]); });
        if (u.t2 == null) p.t2 = 0;
        if (u.obs == null) p.obs = 0;
        p.px = 0; p.fe = 0; p.fx = 0;
        ctx.save(p);
        try { history.replaceState(null, '', '#/tools/bracket-ticket'); } catch (e) {}
      }
      const fld = (k, label, step = 'any') => `<label class="fld"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" data-k="${k}" value="${p[k]}"></label>`;
      const sel = (k, label, opts) => `<label class="fld"><span>${label}</span><select data-k="${k}">${opts.map(([v, t]) => `<option value="${v}" ${String(p[k]) === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
      const draw = () => {
        const S = getSet();
        el.innerHTML = `${settingsHTML(S)}
          <div class="tool-grid">
            <label class="fld"><span>股票</span><input data-k="sym" value="${esc(p.sym)}" maxlength="10" autocapitalize="characters"></label>
            ${sel('side', '方向', [['long', 'Long 買入'], ['short', 'Short 沽空']])}
            ${sel('entryType', '入場方式', [['breakout', '突破入（升穿／跌穿先入）'], ['pullback', '回調入（等價位到）']])}
            ${fld('entry', 'Entry（觸發價）', 0.01)}
            ${sel('stopMode', 'Stop 點定', [['price', '自己輸入價'], ['atr', 'ATR 倍數']])}
            ${p.stopMode === 'atr' ? fld('atrMult', 'Stop = 幾多個 ATR', 0.05) : fld('stop', 'Stop 價', 0.01)}
            ${fld('atr', '日線 ATR（唔知可以留 0）', 0.01)}
            ${sel('tMode', 'Target 點定', [['r', 'R 倍數'], ['price', '自己輸入價']])}
            ${p.tMode === 'price' ? fld('t1', 'Target 1 價', 0.01) + fld('t2', 'Target 2 價（可 0）', 0.01) : fld('t1R', 'Target 1 = 幾多 R', 0.5) + fld('t2R', 'Target 2 = 幾多 R（可 0）', 0.5)}
          </div>
          <details class="tq-sec" ${p.px || p.obs ? 'open' : ''}><summary><b>🔍 實戰檢查（選填，0 = 唔檢查）</b></summary>
            <div class="tool-grid">
              ${fld('px', '而家價（開市後填：判斷追唔追得）', 0.01)}
              ${fld('obs', `下一個${p.side === 'short' ? '支持' : '阻力'}（例如 PDH、20 日高）`, 0.01)}
              ${fld('spr', 'Bid-Ask 差價（$）', 0.01)}
              ${fld('comm', '佣金：每股（$）', 0.001)}
              ${fld('commMin', '佣金：每張最低（$）', 0.5)}
            </div></details>
          <details class="tq-sec" ${p.fe && p.fx ? 'open' : ''}><summary><b>📝 收市後：實際成交 → 真正 R</b></summary>
            <div class="tool-grid">${fld('fe', '實際入場成交價', 0.01)}${fld('fx', '實際出場成交價', 0.01)}</div></details>
          <div class="tool-out" data-out aria-live="polite"></div>`;
        bindSettings(el, draw);
        el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => {
          const k = i.dataset.k;
          p[k] = i.tagName === 'SELECT' ? i.value : k === 'sym' ? i.value.trim().toUpperCase() : numOr(i.value, p[k]);
          ctx.save(p);
          if (i.tagName === 'SELECT') draw(); else out();
        }));
        out();
      };
      const out = () => {
        const S = getSet(), P = plan(p, S), o = el.querySelector('[data-out]');
        if (P.err) { o.innerHTML = verdict(false, P.err); return; }
        const L = P.long, act = L ? 'BUY' : 'SELL', ex = L ? 'SELL' : 'BUY';
        const warns = [];
        if (!L && S.cash === 'yes') warns.push(verdict(false, 'Cash 戶口唔可以沽空（' + (window.CURRICULUM ? CURRICULUM.chRef('l11-c8') : '') + '）。要用 Margin 戶口，仲要借到貨。'));
        if (P.shares <= 0) warns.push(verdict(false, `每股風險 ${F(P.risk)} 大過你每筆風險 ${money(P.budget)}，買唔到 1 股。揀過另一隻，或者 Stop 近啲（要有結構依據）。`));
        /* 🔍 實戰檢查 */
        const checks = [];
        if (p.atr > 0) {
          const ra = P.risk / p.atr;
          checks.push(ra < 0.05 ? verdict(null, `Stop 只係 ${F(ra, 2)} ATR：好容易俾正常波動掃走，確認係咪真係結構失效位。`)
            : ra > 0.6 ? verdict(null, `Stop ${F(ra, 2)} ATR 偏闊：2R 要行 ${F(2 * ra, 2)} ATR，日內好難到；考慮唔做或者等更好入場位。`)
            : verdict(true, `Stop 距離 ${F(ra, 2)} ATR（0.05–0.6 合理）。`));
        }
        checks.push(P.rr >= 1.995 ? verdict(true, `R:R ${F(P.rr)} : 1。`) : P.rr >= 1.5 ? verdict(null, `R:R 只有 ${F(P.rr)}（建議 ≥ 2）。`) : verdict(false, `R:R ${F(P.rr)}，低過 1.5：唔值得做。`));
        if (p.obs > 0) {
          const ro = (P.sg * (p.obs - P.entry)) / P.risk;
          checks.push(ro <= 0 ? verdict(false, `${L ? '阻力' : '支持'} ${F(p.obs)} 喺入場價錯嗰邊，檢查數字。`)
            : ro < 1 ? verdict(false, `去到${L ? '阻力' : '支持'} ${F(p.obs)} 只有 ${F(ro)} R：空間唔夠，唔做。`)
            : ro < P.rr ? verdict(null, `Target 之前有${L ? '阻力' : '支持'} ${F(p.obs)}（${F(ro)} R）：可以喺度先走一半，或者將 Target 放喺佢前面。`)
            : verdict(true, `下一個${L ? '阻力' : '支持'} ${F(p.obs)} 喺 Target 之後（${F(ro)} R），有空間。`));
        }
        if (p.px > 0) {
          const past = P.sg * (p.px - P.entry);
          if (past > 0) {
            const rk2 = P.sg * (p.px - P.stop), rr2 = rk2 > 0 ? (P.sg * (P.t1 - p.px)) / rk2 : -1;
            const atrPast = p.atr > 0 ? past / p.atr : null;
            checks.push(atrPast != null && atrPast > 0.3 ? verdict(false, `而家價已經過咗入場價 ${F(past)}（${F(atrPast, 2)} ATR > 0.3）：<b>唔追</b>，等回調或者下一個 Setup。`)
              : rr2 < 1.5 ? verdict(false, `而家價入場：每股風險變 ${F(rk2)}、R:R 跌到 ${F(rr2)}，唔值得追。`)
              : verdict(null, `而家價入場 R:R 變 ${F(rr2)}（原本 ${F(P.rr)}）。用 Limit 上限 ${F(P.lim || p.px)} 保護。`));
          } else checks.push(verdict(true, `未到入場價（仲差 ${F(-past)}${p.atr > 0 ? `，${F(-past / p.atr, 2)} ATR` : ''}）：等觸發。`));
        }
        const commOne = Math.max(p.commMin || 0, P.shares * (p.comm || 0));
        const costUsd = P.shares * (p.spr || 0) + 2 * commOne, costR = P.riskUsd > 0 ? costUsd / P.riskUsd : 0;
        if (P.shares > 0) checks.push(costR <= 0.05 ? verdict(true, `一買一賣成本約 ${money(costUsd)}（${F(costR, 3)} R）。`)
          : costR <= 0.12 ? verdict(null, `一買一賣成本約 ${money(costUsd)}，佔 ${F(costR, 2)} R：偏高。`)
          : verdict(false, `一買一賣成本約 ${money(costUsd)}，佔 ${F(costR, 2)} R：太貴（Stop 太近或者股數太少）。`));
        warns.unshift(`<div class="tq-checks"><b>🔍 實戰檢查</b>${checks.join('')}</div>`);
        if (p.fe > 0 && p.fx > 0 && P.shares > 0) {
          const net = P.sg * (p.fx - p.fe) * P.shares - 2 * commOne, netR = P.riskUsd > 0 ? net / P.riskUsd : 0;
          const slipIn = P.sg * (p.fe - P.entry);
          warns.push(`<div class="tq-sec"><b>📝 收市後結果</b><div class="stats">${stat('實際盈虧（扣佣金）', money(net), net >= 0 ? 'pos' : 'neg')}${stat('真正 R', (netR >= 0 ? '+' : '') + F(netR) + 'R', netR >= 0 ? 'pos' : 'neg')}${stat('入場滑價', F(slipIn))}</div><p class="tool-fine">用計劃風險 ${money(P.riskUsd)} 做 1R。記入交易日誌：計劃價、實際成交、R、有冇跟規則。</p></div>`);
        }
        if (P.byCash < P.byRisk) warns.push(verdict(null, `股數受「每隻最多用 ${S.maxPosPct}% 本金」限制（按風險可以買 ${P.byRisk} 股）。實際風險 ${money(P.riskUsd)}，少過預算。`));
        const parent = p.entryType === 'breakout'
          ? `<b>${act} ${P.shares} ${esc(p.sym)}</b>｜類型 <b>STP LMT</b>｜Stop 價 <b>${F(P.entry)}</b>｜Limit 價 <b>${F(P.lim)}</b>｜TIF <b>DAY</b>`
          : `<b>${act} ${P.shares} ${esc(p.sym)}</b>｜類型 <b>LMT</b>｜Limit 價 <b>${F(P.entry)}</b>｜TIF <b>DAY</b>`;
        o.innerHTML = `${big('股數', P.shares, '股', P.shares > 0 ? '' : 'neg')}
          <div class="stats">
            ${stat('Stop', F(P.stop), 'neg')}${stat('Target 1', F(P.t1), 'pos')}${P.t2 ? stat('Target 2', F(P.t2), 'pos') : ''}
            ${stat('每股風險', F(P.risk))}${stat('呢筆風險', money(-P.riskUsd), 'neg')}${stat('Target 1 賺', money(P.t1Usd), 'pos')}
            ${stat('R:R', F(P.rr) + ' : 1')}${stat('需要現金', money(P.cash, 0))}
            ${P.chase ? stat('唔追價（0.3 ATR）', F(P.chase)) : ''}${stat('+1R 移 Stop 返 Entry', F(P.be))}
          </div>
          ${warns.join('')}
          <div class="tq-ticket"><div class="tq-ticket-h">📋 IBKR Bracket（三張單）</div>
            <ol>
              <li><span>母單（入場）</span>${parent}</li>
              <li><span>子單：Profit Taker</span><b>${ex} ${P.shares}</b>｜<b>LMT ${F(P.t1)}</b></li>
              <li><span>子單：Stop Loss</span><b>${ex} ${P.shares}</b>｜<b>STP ${F(P.stop)}</b></li>
            </ol>
            <p class="tool-fine">${p.entryType === 'breakout' ? `「突破入」一定要用 <b>STP LMT</b>（Stop Limit）做母單：價格去到 ${F(P.entry)} 先觸發，最多俾 ${F(P.lim)}。如果用普通 LMT ${F(P.entry)}，而價格已經${L ? '低' : '高'}過咗，張單會即刻成交，就唔係「突破先入」。` : `「回調入」用 LMT：價格回到 ${F(P.entry)} 或者更好先成交。`} 兩張子單喺母單成交之後先生效，一張成交另一張自動取消。普通 STP 只喺 09:30–16:00 生效（盤前唔會觸發）。</p>
            <p><button class="btn primary sm" data-copy>📋 複製落單資料</button> <a class="btn ghost sm" href="#/c/l13-c5">點樣喺 IBKR 填？</a></p></div>
          <div data-ladder></div>`;
        o.querySelector('[data-copy]').addEventListener('click', (e) => copy(ticketText(p, P), e.target));
        try { if (window.Charts && Charts.rrLadder) Charts.rrLadder(o.querySelector('[data-ladder]'), { entry: P.entry, stop: P.stop, target: P.t1, side: L ? 'long' : 'short', title: `${p.sym} ${L ? 'Long' : 'Short'}` }); } catch (e) {}
      };
      draw();
    },
  };

  /* ---------------- 🛫 開市前計劃表：今日所有 pick 一版睇晒 ---------------- */
  TOOLS['tv-allinone'] = {
    title: 'TradingView 一合一指標（免費版都用得）', icon: '🧩', cat: '落盤效率', level: 'l10',
    desc: '免費版 TradingView 每個圖最多 2 個指標。呢個 Pine Script 將 VWAP、EMA 9／20、PDH／PDL／昨收、PMH／PML、開市 5 分鐘區間、今日計劃價位同 A+ 檢查表全部放入 1 個指標，用 TradingView 自己嘅即時數據。',
    render(el) {
      el.innerHTML = `<div class="l11-w">
        <p><b>點解要咁做：</b>TradingView 官網免費帳戶有即時美股報價（Cboe），但每個圖只可以加 2 個指標。TradingView 係逐個 Script 計數，所以將所有線寫入同一個 Script，就只用 1 個名額，仲剩 1 個俾你加成交量或者其他嘢。</p>
        <ol class="tv-steps">
          <li>喺電腦開 <a href="https://www.tradingview.com/chart/" target="_blank" rel="noopener noreferrer">tradingview.com/chart</a>（登入免費帳戶），揀 1 分鐘或者 5 分鐘圖</li>
          <li>圖表設定 → Symbol → 剔「Extended trading hours」（延長交易時段），先會有盤前高低</li>
          <li>下面撳「📋 複製程式碼」</li>
          <li>畫面底部撳「Pine Editor」→ 刪走入面原有內容 → 貼上 → 撳「Add to chart」（加到圖表）</li>
          <li>撳「Save」儲存，之後喺 Indicators → My scripts（我的腳本）就搵到「Day Trading 一合一（TSLA 學院）」</li>
          <li>每朝：撳指標嘅 ⚙️ 設定，將今日選股報告嘅 Entry／Stop／Target 1／Target 2 填入「今日計劃」，就會畫線同計 R:R</li>
        </ol>
        <p class="muted">包括：VWAP（09:30 起計，盤前盤後唔計）、EMA 9、EMA 20、PDH／PDL／昨收、PMH／PML、ORH／ORL（開市 5 分鐘）、今日 Entry／Stop／T1／T2、09:30–09:35 紅底、11:30 後灰底；右上角 A+ 檢查表：開市成交係平時幾多倍、QQQ 喺 VWAP 上定下、個股 vs VWAP、RS vs QQQ、11:30 倒數、計劃 R:R。每樣都可以喺設定度熄。</p>
        <p><button class="btn primary" data-copy>📋 複製程式碼</button> <button class="btn" data-dl>⬇️ 下載 .pine 檔</button> <span class="muted" data-msg aria-live="polite"></span></p>
        <details><summary>睇程式碼</summary><pre class="tv-code" data-code>載入緊…</pre></details>
        <p class="tool-fine">呢個 Script 我喺呢度冇辦法喺 TradingView 實際編譯測試；如果 Pine Editor 出錯，將紅色錯誤訊息影低畀我，我幫你改。TradingView 免費版嘅即時美股數據來自 Cboe（唔係全市場合併報價），盤前盤後同成交量會同券商有少少分別；落單以 IBKR 報價為準。</p></div>`;
      let code = '';
      fetch('assets/pine/day-trading-all-in-one.pine', { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))).then((t) => { code = t; el.querySelector('[data-code]').textContent = t; }).catch(() => { el.querySelector('[data-code]').textContent = '載入失敗，檢查網絡再試。'; });
      const msg = el.querySelector('[data-msg]');
      el.querySelector('[data-copy]').addEventListener('click', async () => { if (!code) return; try { await navigator.clipboard.writeText(code); msg.textContent = '✅ 已複製，去 TradingView 嘅 Pine Editor 貼上'; } catch (e) { msg.textContent = '複製唔到：撳「睇程式碼」自己揀晒再複製'; } });
      el.querySelector('[data-dl]').addEventListener('click', () => { if (code) App.download('day-trading-all-in-one.pine', code, 'text/plain'); });
    },
  };
  TOOLS['multichart'] = {
    title: '多圖同步看盤', icon: '📺', cat: '落盤效率', level: 'l10',
    desc: '免費版 Multi-Chart：個股 5 分鐘 + 日線 + QQQ 一齊睇，換股、十字線、時間軸同步；可以開第二個視窗放第二個螢幕。用你嘅 Alpaca 免費金鑰。',
    render(el) {
      el.innerHTML = `<div class="l11-w"><p>喺一個畫面（或者兩個螢幕）同步睇幾個圖，唔使付費。</p><p><a class="btn primary" href="#/charts">📺 打開多圖同步看盤</a></p><ul class="muted"><li>版面：1 圖、2 圖（5m + 日線）、3 圖（5m + 日線 + QQQ）、4 圖（再加 1m）</li><li>同步：換股、十字線、時間軸；第二個視窗都會同步</li><li>VWAP、EMA 9／20、SMA 20／50、PDH／PDL、PMH／PML、開市 5 分鐘區間</li><li>A+ 過濾即時檢查同 11:30 收工倒數</li></ul></div>`;
    },
  };
  TOOLS['open-cockpit'] = {
    title: '開市前計劃表', icon: '🛫', cat: '落盤效率', level: 'l13',
    desc: '自動讀今日選股報告，用你嘅本金同風險，一次過計好每隻嘅股數、Stop、Target、唔追價同警報價位。開市時淨係需要核對。',
    render(el) {
      el.innerHTML = '<p class="muted">載入緊今日報告…</p>';
      let days = [], cur = null;
      const load = async (date) => {
        try {
          if (!days.length) { const r = await fetch('data/picks/index.json', { cache: 'no-cache' }); days = (await r.json()).days || []; }
          if (!days.length) { el.innerHTML = '<p class="muted">未有選股報告。</p>'; return; }
          const d = date || days[0].date;
          const r = await fetch('data/picks/' + d + '.json', { cache: 'no-cache' });
          cur = await r.json(); show();
        } catch (e) { el.innerHTML = `<div class="tool-warn">載入唔到報告（${esc(e.message)}）。離線時用唔到。</div>`; }
      };
      const show = () => {
        const S = getSet();
        const rows = (cur.picks || []).filter((x) => x.trade && x.trade.entry > 0).map((x) => {
          const t = x.trade, side = t.side === 'Short' ? 'short' : 'long';
          const P = plan({ side, entryType: 'breakout', entry: t.entry, stopMode: 'price', stop: t.stop, atr: x.atr || 0, tMode: 'price', t1: t.target1, t2: t.target2 || 0 }, S);
          return { x, t, side, P };
        }).sort((a, b) => (a.side === 'long' ? 0 : 1) - (b.side === 'long' ? 0 : 1) || ((a.x.dailyTrend === 'up' ? 0 : 1) - (b.x.dailyTrend === 'up' ? 0 : 1)));
        const ok = rows.filter((r) => !r.P.err && r.P.shares > 0 && !(r.side === 'short' && S.cash === 'yes'));
        const link = (r) => `#/tools/bracket-ticket?sym=${encodeURIComponent(r.x.sym)}&side=${r.side}&entry=${r.t.entry}&stop=${r.t.stop}&t1=${r.t.target1}${r.t.target2 ? '&t2=' + r.t.target2 : ''}${r.x.atr ? '&atr=' + r.x.atr : ''}`;
        const alerts = rows.filter((r) => !r.P.err).map((r) => `${r.x.sym} ${r.side === 'long' ? '升穿' : '跌穿'} ${F(r.t.entry)}（入場）｜${r.side === 'long' ? '跌穿' : '升穿'} ${F(r.P.stop)}（Stop）`).join('\n');
        el.innerHTML = `${settingsHTML(S)}
          <div class="tq-head"><label>報告 <select data-day>${days.slice(0, 10).map((d) => `<option value="${d.date}" ${d.date === cur.date ? 'selected' : ''}>${d.date}${d.status === 'test' ? '（測試）' : ''}</option>`).join('')}</select></label>
          <span>${esc(cur.market && cur.market.bias ? '大市：' + cur.market.bias : '')}</span></div>
          ${cur.headline ? `<p class="tq-hl">${esc(cur.headline)}</p>` : ''}
          <div class="tbl-scroll"><table class="mini-tbl wide tq-t"><tr><th>股票</th><th>方向</th><th>入場（觸發）</th><th>Stop</th><th>Target 1</th><th>R:R</th><th>股數</th><th>風險</th><th>現金</th><th>唔追價</th><th>+1R 移 Stop</th><th></th></tr>
          ${rows.map((r) => { const P = r.P, bad = P.err || P.shares <= 0 || (r.side === 'short' && S.cash === 'yes'); return `<tr class="${bad ? 'tq-off' : ''}"><th>${esc(r.x.sym)} <small>${esc(r.x.grade || '')}</small></th><td>${r.side === 'long' ? '📈 Long' : '📉 Short'}${r.x.dailyTrend ? `<small> ${{ up: '日線升勢', mixed: '日線橫行', down: '日線跌勢' }[r.x.dailyTrend] || ''}</small>` : ''}</td><td>${F(r.t.entry)}</td><td class="neg">${P.err ? '—' : F(P.stop)}</td><td class="pos">${P.err ? '—' : F(P.t1)}</td><td>${P.err ? '—' : F(P.rr)}</td><td><b>${P.err ? '—' : P.shares}</b></td><td>${P.err ? '—' : money(P.riskUsd, 0)}</td><td>${P.err ? '—' : money(P.cash, 0)}</td><td>${P.chase ? F(P.chase) : '—'}</td><td>${P.err ? '—' : F(P.be)}</td><td>${bad ? `<small>${P.err ? esc(P.err) : r.side === 'short' && S.cash === 'yes' ? 'Cash 戶口唔沽空' : '風險太大'}</small>` : `<a class="btn sm" href="${link(r)}">⚡ 一頁通</a>`}</td></tr>`; }).join('')}
          </table></div>
          <div class="stats">${stat('做得嘅', ok.length + ' 隻')}${stat('每筆風險', money(budgetOf(S), 0))}${stat('今日最多蝕', money(budgetOf(S) * S.dayStopR, 0) + `（${S.dayStopR}R）`, 'neg')}${stat('同時揸幾多隻', '最多 1–2 隻')}</div>
          ${verdict(null, `一次最多專心睇 1–2 隻。蝕夠 ${S.dayStopR}R（${money(budgetOf(S) * S.dayStopR, 0)}）就收工。`)}
          <div class="tq-ticket"><div class="tq-ticket-h">🔔 警報價位（設喺 TradingView 或者 IBKR，等警報響先睇）</div><pre class="tq-pre">${esc(alerts)}</pre><p><button class="btn sm" data-copy>📋 複製警報價位</button> <button class="btn ghost sm" data-print>🖨️ 列印</button></p></div>
          <p class="tool-fine">數字由報告嘅 Entry／Stop／Target 同你嘅設定計出嚟。報告數據係開市前嘅，08:30 數據或者開市後價位會變；開市前要喺圖上再核對。App 唔會幫你落單。</p>`;
        bindSettings(el, show);
        el.querySelector('[data-day]').addEventListener('change', (e) => load(e.target.value));
        el.querySelector('[data-copy]').addEventListener('click', (e) => copy(alerts, e.target));
        el.querySelector('[data-print]').addEventListener('click', () => window.print());
      };
      load();
    },
  };
})();
