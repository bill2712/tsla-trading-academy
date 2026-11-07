/* =========================================================
 * 落盤效率工具（Level 13）：Bracket 落單卡、開市前計劃表
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

  /* ---------------- ⚡ Bracket 落單卡 ---------------- */
  TOOLS['bracket-ticket'] = {
    title: 'IBKR Bracket 落單卡', icon: '⚡', cat: '落盤效率', level: 'l13',
    desc: '輸入 Entry、Stop（或者 ATR 倍數），即刻計股數、Target、唔追價、+1R 移 Stop 價，同埋 IBKR Bracket 三張單要填嘅數字；可以由每日選股一撳帶入。',
    render(el, ctx) {
      const DEF = { sym: 'NVDA', side: 'long', entryType: 'breakout', entry: 191, stopMode: 'price', stop: 188.76, atr: 7.46, atrMult: 0.3, tMode: 'r', t1R: 2, t2R: 3, t1: 195.48, t2: 197.72 };
      const p = ctx.load(Object.assign({}, DEF));
      const u = urlParams();
      if (u.sym) {
        Object.assign(p, { sym: String(u.sym).toUpperCase().slice(0, 10), side: u.side === 'short' ? 'short' : 'long', entryType: 'breakout', stopMode: 'price', tMode: 'price' });
        ['entry', 'stop', 't1', 't2', 'atr'].forEach((k) => { if (u[k] != null) p[k] = numOr(u[k], p[k]); });
        if (u.t2 == null) p.t2 = 0;
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
        if (!L && S.cash === 'yes') warns.push(verdict(false, 'Cash 戶口唔可以沽空（Level 11 第 8 章）。要用 Margin 戶口，仲要借到貨。'));
        if (P.shares <= 0) warns.push(verdict(false, `每股風險 ${F(P.risk)} 大過你每筆風險 ${money(P.budget)}，買唔到 1 股。揀過另一隻，或者 Stop 近啲（要有結構依據）。`));
        if (P.rr < 1.5) warns.push(verdict(null, `R:R 只有 ${F(P.rr)}，低過 1.5。`));
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
        });
        const ok = rows.filter((r) => !r.P.err && r.P.shares > 0 && !(r.side === 'short' && S.cash === 'yes'));
        const link = (r) => `#/tools/bracket-ticket?sym=${encodeURIComponent(r.x.sym)}&side=${r.side}&entry=${r.t.entry}&stop=${r.t.stop}&t1=${r.t.target1}${r.t.target2 ? '&t2=' + r.t.target2 : ''}${r.x.atr ? '&atr=' + r.x.atr : ''}`;
        const alerts = rows.filter((r) => !r.P.err).map((r) => `${r.x.sym} ${r.side === 'long' ? '升穿' : '跌穿'} ${F(r.t.entry)}（入場）｜${r.side === 'long' ? '跌穿' : '升穿'} ${F(r.P.stop)}（Stop）`).join('\n');
        el.innerHTML = `${settingsHTML(S)}
          <div class="tq-head"><label>報告 <select data-day>${days.slice(0, 10).map((d) => `<option value="${d.date}" ${d.date === cur.date ? 'selected' : ''}>${d.date}${d.status === 'test' ? '（測試）' : ''}</option>`).join('')}</select></label>
          <span>${esc(cur.market && cur.market.bias ? '大市：' + cur.market.bias : '')}</span></div>
          ${cur.headline ? `<p class="tq-hl">${esc(cur.headline)}</p>` : ''}
          <div class="tbl-scroll"><table class="mini-tbl wide tq-t"><tr><th>股票</th><th>方向</th><th>入場（觸發）</th><th>Stop</th><th>Target 1</th><th>R:R</th><th>股數</th><th>風險</th><th>現金</th><th>唔追價</th><th>+1R 移 Stop</th><th></th></tr>
          ${rows.map((r) => { const P = r.P, bad = P.err || P.shares <= 0 || (r.side === 'short' && S.cash === 'yes'); return `<tr class="${bad ? 'tq-off' : ''}"><th>${esc(r.x.sym)} <small>${esc(r.x.grade || '')}</small></th><td>${r.side === 'long' ? '📈 Long' : '📉 Short'}</td><td>${F(r.t.entry)}</td><td class="neg">${P.err ? '—' : F(P.stop)}</td><td class="pos">${P.err ? '—' : F(P.t1)}</td><td>${P.err ? '—' : F(P.rr)}</td><td><b>${P.err ? '—' : P.shares}</b></td><td>${P.err ? '—' : money(P.riskUsd, 0)}</td><td>${P.err ? '—' : money(P.cash, 0)}</td><td>${P.chase ? F(P.chase) : '—'}</td><td>${P.err ? '—' : F(P.be)}</td><td>${bad ? `<small>${P.err ? esc(P.err) : r.side === 'short' && S.cash === 'yes' ? 'Cash 戶口唔沽空' : '風險太大'}</small>` : `<a class="btn sm" href="${link(r)}">⚡ 落單卡</a>`}</td></tr>`; }).join('')}
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
