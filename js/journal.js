/* =========================================================
 * 交易日誌：Candidates（候選紀錄）+ Trades（已執行交易）+ Dashboard
 * 每個使用者分開儲存
 * ========================================================= */
(function () {
  const U = () => window.ToolUtil;
  const SETUPS = ['A：Breakout + Retest', 'B：Range Reversal', 'C：Failed Breakdown Reclaim', '其他'];
  const MARKETS = ['Trending', 'Range', 'Choppy', 'News'];
  const STAGES = ['Breakout', 'Retest', 'Confirmation', 'Order Pending', 'Filled'];
  const OUTCOMES = ['已成交（Traded）', '冇回測／過期', '回測失敗', 'R:R 不足放棄', '未觸發（No Fill）', '消息／時間取消', '其他'];

  function list() { const u = Store.user(); u.journal = u.journal || []; return u.journal; }
  function cands() { const u = Store.user(); u.candidates = u.candidates || []; return u.candidates; }

  const has = (x) => typeof x === 'number' && isFinite(x);
  function calc(t) {
    const long = t.side !== 'short';
    const dir = long ? 1 : -1;
    const riskPS = (t.entry - t.stop) * dir;
    const initRisk = riskPS * t.shares;
    const closed = has(t.exit);
    const pnl = closed ? (t.exit - t.entry) * dir * t.shares - (t.fees || 0) : null;
    const r = closed && initRisk > 0 ? pnl / initRisk : null;
    const pe = has(t.plannedEntry) ? t.plannedEntry : t.entry;
    const plannedRR = riskPS > 0 && has(t.target) ? ((t.target - pe) * dir) / ((pe - t.stop) * dir) : null;
    const mfe = has(long ? t.hi : t.lo) && riskPS > 0 ? ((long ? t.hi - t.entry : t.entry - t.lo)) / riskPS : null;
    const mae = has(long ? t.lo : t.hi) && riskPS > 0 ? ((long ? t.entry - t.lo : t.hi - t.entry)) / riskPS : null;
    const slip = has(t.plannedEntry) ? (t.entry - t.plannedEntry) * dir : null;
    return { riskPS, initRisk, pnl, r, plannedRR, mfe, mae, slip, closed, cad: pnl != null && has(t.fx) ? pnl * t.fx : null };
  }

  function netRs() { return list().slice().sort(byDate).map(calc).filter((c) => c.r != null).map((c) => c.r); }
  const byDate = (a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || ''));

  /* ---------- 表單 ---------- */
  function tradeForm(t, onSave) {
    const { esc } = U();
    const v = (k, d = '') => (t[k] == null || (typeof t[k] === 'number' && !isFinite(t[k])) ? d : t[k]);
    const sel = (k, opts) => `<select name="${k}">${opts.map((o) => `<option ${v(k) === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    const num = (k, l, st = '0.01') => `<label class="fld"><span>${l}</span><input type="number" step="${st}" name="${k}" value="${esc(v(k))}"></label>`;
    App.modal(`<h3>${t.id ? '編輯交易' : '新增模擬交易'}</h3>
      <form class="jform">
        <div class="tool-grid">
          <label class="fld"><span>日期（ET）</span><input type="date" name="date" value="${esc(v('date', Store.today()))}"></label>
          <label class="fld"><span>時間（ET）</span><input type="time" name="time" value="${esc(v('time'))}"></label>
          <label class="fld"><span>Symbol</span><input name="symbol" value="${esc(v('symbol', 'TSLA'))}"></label>
          <label class="fld"><span>策略版本</span><input name="version" value="${esc(v('version', 'TSLA-BR-LONG-v1.0'))}"></label>
          <label class="fld"><span>Setup</span>${sel('setup', SETUPS)}</label>
          <label class="fld"><span>Market Type</span>${sel('market', MARKETS)}</label>
          <label class="fld"><span>方向</span><select name="side"><option value="long" ${v('side', 'long') === 'long' ? 'selected' : ''}>Long</option><option value="short" ${v('side') === 'short' ? 'selected' : ''}>Short</option></select></label>
          ${num('plannedEntry', '計劃 Entry（Trigger）')}${num('entry', '實際 Entry Fill *')}${num('stop', 'Initial Stop *')}${num('target', 'Target')}
          ${num('shares', 'Shares *', '1')}${num('exit', '實際 Exit Fill（未平倉留空）')}${num('fees', '來回費用（USD）')}
          ${num('hi', '持倉期間最高（MFE 用）')}${num('lo', '持倉期間最低（MAE 用）')}${num('fx', 'USD→CAD 匯率（稅務紀錄，可留空）', '0.0001')}
          <label class="fld"><span>有冇跟足規則？</span><select name="followed"><option value="yes" ${v('followed', 'yes') === 'yes' ? 'selected' : ''}>✅ Yes</option><option value="no" ${v('followed') === 'no' ? 'selected' : ''}>❌ No</option></select></label>
          <label class="fld"><span>RVOL / VWAP 背景</span><input name="context" value="${esc(v('context'))}" placeholder="例如 RVOL 1.8 / Above rising"></label>
          <label class="fld wide"><span>備註 / 覆盤</span><textarea name="notes" rows="2">${esc(v('notes'))}</textarea></label>
        </div>
        <div class="tool-out" data-preview></div>
        <div class="modal-actions"><button type="button" class="btn ghost" data-close>取消</button><button class="btn primary" type="submit">儲存</button></div>
      </form>`, (box, close) => {
      const form = box.querySelector('form');
      const read = () => {
        const fd = new FormData(form); const o = {};
        fd.forEach((val, k) => { o[k] = val; });
        ['plannedEntry', 'entry', 'stop', 'target', 'shares', 'exit', 'fees', 'hi', 'lo', 'fx'].forEach((k) => { o[k] = o[k] === '' ? null : parseFloat(o[k]); });
        return o;
      };
      const prev = () => {
        const o = read(); const c = calc(o); const { stat, signR, money, F } = U();
        box.querySelector('[data-preview]').innerHTML = c.riskPS > 0 ? `<div class="stats">${stat('Initial Risk', money(c.initRisk))}${stat('計劃 R:R', c.plannedRR != null ? F(c.plannedRR) : '—')}${stat('Net P&L', c.pnl != null ? money(c.pnl) : '未平倉', c.pnl >= 0 ? 'pos' : 'neg')}${stat('Net R', c.r != null ? signR(c.r) : '—', c.r >= 0 ? 'pos' : 'neg')}</div>` : (o.entry && o.stop ? '<div class="verdict bad">Stop 方向唔啱（Long 嘅 Stop 要低過 Entry）。</div>' : '');
      };
      form.addEventListener('input', prev); prev();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const o = read();
        if (!has(o.entry) || !has(o.stop) || !has(o.shares)) { App.toast('請填 Entry、Stop 同 Shares'); return; }
        onSave(o); close();
      });
    });
  }

  function candForm(c, onSave) {
    const { esc } = U();
    const v = (k, d = '') => (c[k] == null ? d : c[k]);
    const sel = (k, opts) => `<select name="${k}">${opts.map((o) => `<option ${v(k) === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    App.modal(`<h3>${c.id ? '編輯候選 Setup' : '新增候選 Setup'}</h3>
      <p class="muted">記住：先記錄 Setup，再播放下一支 K 線。冇成交、取消、放棄都要記。</p>
      <form class="jform"><div class="tool-grid">
        <label class="fld"><span>日期（ET）</span><input type="date" name="date" value="${esc(v('date', Store.today()))}"></label>
        <label class="fld"><span>突破 K 線時間</span><input type="time" name="time" value="${esc(v('time'))}"></label>
        <label class="fld"><span>Setup</span>${sel('setup', SETUPS)}</label>
        <label class="fld"><span>Market Type</span>${sel('market', MARKETS)}</label>
        <label class="fld"><span>最遠去到邊個階段</span>${sel('stage', STAGES)}</label>
        <label class="fld"><span>結果</span>${sel('outcome', OUTCOMES)}</label>
        <label class="fld"><span>RVOL</span><input type="number" step="0.1" name="rvol" value="${esc(v('rvol'))}"></label>
        <label class="fld"><span>Key Level</span><input name="level" value="${esc(v('level'))}" placeholder="例如 384.80–385.20"></label>
        <label class="fld wide"><span>備註</span><textarea name="notes" rows="2">${esc(v('notes'))}</textarea></label>
      </div><div class="modal-actions"><button type="button" class="btn ghost" data-close>取消</button><button class="btn primary" type="submit">儲存</button></div></form>`, (box, close) => {
      box.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault(); const fd = new FormData(e.target); const o = {}; fd.forEach((val, k) => (o[k] = val));
        o.rvol = o.rvol === '' ? null : parseFloat(o.rvol); onSave(o); close();
      });
    });
  }

  /* ---------- 頁面 ---------- */
  function render(el, tab) {
    tab = tab || 'stats';
    const { esc, stat, signR, money, pct, F, rStats, verdict } = U();
    const trades = list().slice().sort(byDate);
    const cs = cands().slice().sort(byDate);
    el.innerHTML = `<div class="page-head"><h1>📒 交易日誌</h1><p class="muted">對應 Level 5 嘅回測工作簿：<b>候選紀錄</b>（所有 Setup，包括冇成交）＋ <b>交易紀錄</b>（已執行模擬交易）＋ <b>自動統計</b>。資料只儲存喺呢部機、目前使用者名下。</p></div>
      <div class="tabs" role="tablist">
        <a href="#/journal/stats" class="tab ${tab === 'stats' ? 'on' : ''}">📊 統計</a>
        <a href="#/journal/trades" class="tab ${tab === 'trades' ? 'on' : ''}">🧾 交易紀錄（${trades.length}）</a>
        <a href="#/journal/cands" class="tab ${tab === 'cands' ? 'on' : ''}">🔎 候選紀錄（${cs.length}）</a>
      </div><div class="jbody"></div>`;
    const body = el.querySelector('.jbody');

    if (tab === 'trades') {
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增交易</button><button class="btn sm" data-csv>⬇️ 匯出 CSV</button>${trades.length ? '' : '<button class="btn ghost sm" data-demo>載入 5 筆示範交易</button>'}</div>
        ${trades.length ? `<div class="tbl-wrap"><table class="tbl jt"><thead><tr><th>日期</th><th>Setup</th><th>市況</th><th>Entry</th><th>Stop</th><th>Exit</th><th>股數</th><th>Net P&L</th><th>Net R</th><th>MFE</th><th>跟規則</th><th></th></tr></thead><tbody>
        ${trades.map((t) => { const c = calc(t); return `<tr><td>${esc(t.date)}<br><small>${esc(t.time || '')}</small></td><td>${esc((t.setup || '').split('：')[0])}</td><td>${esc(t.market)}</td><td>${F(t.entry)}</td><td>${F(t.stop)}</td><td>${c.closed ? F(t.exit) : '<i>持倉中</i>'}</td><td>${t.shares}</td><td class="${c.pnl >= 0 ? 'pos' : 'neg'}">${c.pnl != null ? money(c.pnl) : '—'}</td><td class="${c.r >= 0 ? 'pos' : 'neg'}"><b>${c.r != null ? signR(c.r) : '—'}</b></td><td>${c.mfe != null ? F(c.mfe, 1) + 'R' : '—'}</td><td>${t.followed === 'no' ? '❌' : '✅'}</td><td class="row-acts"><button data-edit="${t.id}" title="編輯">✏️</button><button data-del="${t.id}" title="刪除">🗑️</button></td></tr>${t.notes ? `<tr class="note-row"><td colspan="12">📝 ${esc(t.notes)}</td></tr>` : ''}`; }).join('')}
        </tbody></table></div>` : '<div class="empty">未有交易紀錄。用 Bar Replay 練習時，每筆符合 Playbook 嘅模擬交易都記低喺度。</div>'}`;
      body.querySelector('[data-add]').addEventListener('click', () => tradeForm({}, (o) => { o.id = Store.uid(); o.ts = Date.now(); list().push(o); Store.awardXP('trade:' + o.id, 3); Store.emit('journal'); render(el, 'trades'); }));
      body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const t = list().find((x) => x.id === b.dataset.edit); tradeForm(t, (o) => { Object.assign(t, o); Store.emit('journal'); render(el, 'trades'); }); }));
      body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢筆交易？（課程提醒：失敗交易都係重要樣本）')) return; const u = Store.user(); u.journal = u.journal.filter((x) => x.id !== b.dataset.del); Store.emit('journal'); render(el, 'trades'); }));
      const demo = body.querySelector('[data-demo]');
      if (demo) demo.addEventListener('click', () => {
        const base = { symbol: 'TSLA', version: 'DEMO（示範，可刪除）', side: 'long', fees: 2, followed: 'yes' };
        [
          { date: '2026-09-14', time: '09:55', setup: SETUPS[0], market: 'Trending', plannedEntry: 386.10, entry: 386.10, stop: 384.70, target: 388.90, shares: 14, exit: 388.90, hi: 389.05, lo: 385.80 },
          { date: '2026-09-15', time: '10:20', setup: SETUPS[0], market: 'Range', plannedEntry: 391.05, entry: 391.18, stop: 389.90, target: 393.60, shares: 16, exit: 389.80, hi: 391.90, lo: 389.70 },
          { date: '2026-09-16', time: '10:05', setup: SETUPS[1], market: 'Range', plannedEntry: 380.95, entry: 380.95, stop: 379.45, target: 384.20, shares: 14, exit: 382.40, hi: 382.60, lo: 380.40, notes: 'VWAP 附近按規則減倉離場' },
          { date: '2026-09-17', time: '11:10', setup: SETUPS[0], market: 'Choppy', plannedEntry: 395.20, entry: 395.40, stop: 394.10, target: 397.80, shares: 17, exit: 393.95, hi: 395.70, lo: 393.90, followed: 'no', notes: 'Choppy 日唔應該做；追價入場' },
          { date: '2026-09-18', time: '09:50', setup: SETUPS[2], market: 'Trending', plannedEntry: 380.85, entry: 380.90, stop: 379.60, target: 383.50, shares: 17, exit: 383.50, hi: 383.70, lo: 380.30 },
        ].forEach((t) => list().push(Object.assign({ id: Store.uid(), ts: Date.now() }, base, t)));
        Store.emit('journal'); render(el, 'trades');
      });
      body.querySelector('[data-csv]').addEventListener('click', () => {
        let csv = 'Date,Time,Symbol,Version,Setup,Market,Side,PlannedEntry,EntryFill,Stop,Target,Shares,ExitFill,Fees,NetPnL,InitialRisk,NetR,PlannedRR,MFE_R,MAE_R,FX_CAD,PnL_CAD,RuleFollowed,Context,Notes\n';
        const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
        trades.forEach((t) => { const c = calc(t); csv += [t.date, t.time, t.symbol, q(t.version), q(t.setup), t.market, t.side, t.plannedEntry, t.entry, t.stop, t.target, t.shares, t.exit, t.fees, c.pnl != null ? c.pnl.toFixed(2) : '', c.initRisk.toFixed(2), c.r != null ? c.r.toFixed(3) : '', c.plannedRR != null ? c.plannedRR.toFixed(2) : '', c.mfe != null ? c.mfe.toFixed(2) : '', c.mae != null ? c.mae.toFixed(2) : '', t.fx || '', c.cad != null ? c.cad.toFixed(2) : '', t.followed, q(t.context), q(t.notes)].join(',') + '\n'; });
        App.download('trade_journal.csv', '﻿' + csv, 'text/csv');
      });
      return;
    }

    if (tab === 'cands') {
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增候選 Setup</button><button class="btn sm" data-csv>⬇️ 匯出 CSV</button></div>
        ${cs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>日期</th><th>時間</th><th>Setup</th><th>市況</th><th>階段</th><th>結果</th><th>RVOL</th><th>備註</th><th></th></tr></thead><tbody>
        ${cs.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.time)}</td><td>${esc((c.setup || '').split('：')[0])}</td><td>${esc(c.market)}</td><td>${esc(c.stage)}</td><td>${esc(c.outcome)}</td><td>${c.rvol != null ? c.rvol : '—'}</td><td>${esc(c.notes || '')}</td><td class="row-acts"><button data-edit="${c.id}">✏️</button><button data-del="${c.id}">🗑️</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty">未有候選紀錄。每一個符合初步 Breakout 條件嘅機會都應該記錄，包括最後冇入場嘅。</div>'}`;
      body.querySelector('[data-add]').addEventListener('click', () => candForm({}, (o) => { o.id = Store.uid(); o.ts = Date.now(); cands().push(o); Store.awardXP('cand:' + o.id, 1); Store.emit('journal'); render(el, 'cands'); }));
      body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const c = cands().find((x) => x.id === b.dataset.edit); candForm(c, (o) => { Object.assign(c, o); Store.emit('journal'); render(el, 'cands'); }); }));
      body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢個候選紀錄？')) return; const u = Store.user(); u.candidates = u.candidates.filter((x) => x.id !== b.dataset.del); Store.emit('journal'); render(el, 'cands'); }));
      body.querySelector('[data-csv]').addEventListener('click', () => {
        const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
        let csv = 'Date,Time,Setup,Market,Stage,Outcome,RVOL,KeyLevel,Notes\n';
        cs.forEach((c) => (csv += [c.date, c.time, q(c.setup), c.market, c.stage, q(c.outcome), c.rvol == null ? '' : c.rvol, q(c.level), q(c.notes)].join(',') + '\n'));
        App.download('candidates.csv', '﻿' + csv, 'text/csv');
      });
      return;
    }

    // 統計
    const closed = trades.map((t) => ({ t, c: calc(t) })).filter((x) => x.c.r != null);
    const rs = closed.map((x) => x.c.r);
    const st = rStats(rs);
    const comp = trades.length ? trades.filter((t) => t.followed !== 'no').length / trades.length : null;
    const pnlSum = closed.reduce((a, x) => a + x.c.pnl, 0);
    const slips = trades.map((t) => calc(t).slip).filter((x) => x != null);
    const avgSlip = slips.length ? slips.reduce((a, b) => a + b, 0) / slips.length : null;
    const group = (key, keys) => keys.map((k) => { const g = closed.filter((x) => (x.t[key] || '') === k).map((x) => x.c.r); const s = rStats(g); return { k, s }; }).filter((x) => x.s);
    const funnel = STAGES.map((s, i) => cs.filter((c) => STAGES.indexOf(c.stage) >= i).length);
    body.innerHTML = !st ? `<div class="empty">未有已平倉交易。去「交易紀錄」新增，或者載入示範交易睇吓效果。</div>` : `
      <div class="stats">
        ${stat('已平倉交易', st.n)}${stat('勝率', pct(st.wr))}${stat('平均贏', signR(st.avgW))}${stat('平均輸', signR(-st.avgL))}
        ${stat('Net Expectancy', signR(st.exp, 3), st.exp >= 0 ? 'pos' : 'neg')}${stat('總 Net R', signR(st.total, 2), st.total >= 0 ? 'pos' : 'neg')}
        ${stat('Net P&L', money(pnlSum), pnlSum >= 0 ? 'pos' : 'neg')}${stat('Profit Factor', isFinite(st.pf) ? F(st.pf) : '∞')}
        ${stat('最大回撤（已實現）', '−' + F(st.mdd) + 'R', 'neg')}${stat('最長連敗', st.maxStreak + ' 筆')}
        ${stat('規則遵守率', comp != null ? pct(comp, 0) : '—', comp >= 0.9 ? 'pos' : 'neg')}${stat('平均入場滑價 / 股', avgSlip != null ? money(avgSlip, 3) : '—')}
      </div>
      ${st.n < 30 ? verdict(null, `樣本只有 ${st.n} 筆。課程建議：20–30 筆睇自己識唔識一致執行；約 100 筆先初步估算表現。`) : ''}
      <div data-eq></div>
      <div class="grid-2">
        <div><h4>按 Setup</h4>${tbl(group('setup', SETUPS))}</div>
        <div><h4>按市場環境</h4>${tbl(group('market', MARKETS))}</div>
      </div>
      ${cs.length ? `<h4>候選漏斗</h4><div data-funnel></div>` : ''}
      <p class="tool-fine">Drawdown 係根據逐筆已實現 R 計算，唔係盤中浮動權益嘅完整最大回撤。</p>`;
    function tbl(rows) {
      if (!rows.length) return '<p class="muted">—</p>';
      return `<table class="tbl"><thead><tr><th>類別</th><th>筆數</th><th>勝率</th><th>Expectancy</th><th>總 R</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.k.split('：')[0])}</td><td>${r.s.n}</td><td>${pct(r.s.wr, 0)}</td><td class="${r.s.exp >= 0 ? 'pos' : 'neg'}">${signR(r.s.exp)}</td><td>${signR(r.s.total, 1)}</td></tr>`).join('')}</tbody></table>`;
    }
    if (st) Charts.line(body.querySelector('[data-eq]'), { series: [{ data: st.curve, color: 'var(--accent)', dots: st.n < 80 }], labels: st.curve.map((_, i) => i), ref: 0, height: 240, format: (v) => v.toFixed(1) + 'R', title: 'Equity Curve（累積 Net R）' });
    const fEl = body.querySelector('[data-funnel]');
    if (fEl) fEl.innerHTML = `<figure class="chart funnel">${STAGES.map((s, i) => `<div class="fn-row"><span>${s}</span><div class="fn-bar" style="width:${funnel[0] ? funnel[i] / funnel[0] * 100 : 0}%"><b>${funnel[i]}</b></div></div>`).join('')}</figure>`;
  }

  window.Journal = { render, netRs, calc };
})();
