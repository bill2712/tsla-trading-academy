/* =========================================================
 * 交易日誌 + Playbook + Replay 日誌 + 檢討
 * - 交易分三類：Replay 模擬、Paper Trading、真實交易
 * - 每個使用者分開儲存，可以切換睇其他家庭成員嘅紀錄
 * ========================================================= */
(function () {
  const U = () => window.ToolUtil;
  const has = (x) => typeof x === 'number' && isFinite(x);
  const SETUPS = ['A：Breakout + Retest', 'B：Range Reversal', 'C：Failed Breakdown Reclaim', '其他'];
  const MARKETS = ['Trending', 'Range', 'Choppy', 'News'];
  const STAGES = ['Breakout', 'Retest', 'Confirmation', 'Order Pending', 'Filled'];
  const OUTCOMES = ['已成交（Traded）', '冇回測／過期', '回測失敗', 'R:R 不足放棄', '未觸發（No Fill）', '消息／時間取消', '其他'];
  const KINDS = [['replay', '🔁 Replay 模擬'], ['paper', '📄 Paper Trading'], ['live', '💵 真實交易']];
  const KIND_SHORT = { replay: 'Replay', paper: 'Paper', live: '真實' };
  const ANALYSIS = [['correct', '✅ 判斷正確'], ['partial', '➗ 部分正確'], ['wrong', '❌ 判斷錯誤'], ['na', '— 未評估']];
  const EMOTIONS = ['冷靜', '自信', '猶豫', 'FOMO 怕錯過', '恐懼', '貪心', '想翻本', '疲倦／分心'];
  const MISTAKES = ['追價／入場太遲', '未確認就入場', '冇等 Retest', '逆勢交易', 'Stop 放錯位', '移遠 Stop', '提早止賺', '過大倉位', '冇計 R:R', 'Choppy 日硬做', '消息日冇避開', '畫線用咗未來資料', '冇事前記錄 Setup', '其他'];
  const REPLAY_OUT = ['完全冇 Breakout', '有 Breakout，冇 Retest', '有 Retest，冇 Confirmation', '有 Confirmation，R:R 不合理', '有完整 Setup，冇觸發', '有交易（已記錄）', '錯過咗符合條件嘅機會'];
  const REPLAY_SHORT = ['冇 Breakout', '冇 Retest', '冇確認', 'R:R 唔夠', '冇觸發', '有交易', '錯過咗'];
  const REPLAY_CHECKS = ['有事前畫好 S/R', '只用咗當刻可得資訊畫線', '有出現指定 Setup', 'Setup 有 Confirmation', '有觸發 Entry', 'R:R 合理', '全程按固定規則執行'];
  const PB_FIELDS = [
    ['market', '市場環境'], ['levels', '重要價位'], ['signal', '第一訊號／Setup 條件'], ['confirm', '確認'], ['trigger', 'Entry Trigger'],
    ['stop', 'Stop 規則'], ['target', 'Target 規則'], ['minRR', '最低 R:R'], ['sizing', '倉位／風險'], ['manage', '持倉管理'], ['skip', '放棄／No Trade 條件'], ['notes', '備註'],
  ];
  const TEMPLATES = [
    { name: 'A：Breakout + Retest Long', direction: 'Long', tf: '5m（15m 判斷背景）', market: '15m 偏強，或者由 Range 開始向上突破', levels: '事前標記 Resistance', signal: '已完成 5m Candle 收喺 Resistance Zone 上方；記錄突破時 RVOL；價格喺 VWAP 上方', confirm: '價格返回舊 Resistance Zone 後出現向上反彈，形成較高低位或重新突破短線高位', trigger: '突破指定確認 K 線 High', stop: '回測低位或整個 Zone 下方（按結構同波幅決定緩衝）', target: '下一重要阻力位之前', minRR: '2', sizing: '每筆 0.25% 本金', manage: '固定 Stop / Target；收市前平倉', skip: '跌穿區域、回測失敗、回報空間不足、Choppy、消息時段' },
    { name: 'B：Range Support Reversal Long', direction: 'Long', tf: '5m', market: '明顯橫行區間', levels: 'Range 下邊界 Support', signal: 'Hammer、下影線 Rejection 或類似價格反應；記錄支持區成交量', confirm: '後續反彈，停止創新低，可能形成 HL', trigger: '突破指定確認 Candle High', stop: '造成反彈嘅重要低位下方', target: '區間中部障礙（VWAP）或上方阻力', minRR: '2', sizing: '每筆 0.25% 本金', manage: '事前定 VWAP 附近處理規則', skip: '支持失守、跌勢明顯加速、VWAP 障礙太近、風險回報不足' },
    { name: 'C：Failed Breakdown Reclaim Long', direction: 'Long', tf: '5m', market: '原本有明顯 Support', levels: 'Support Zone', signal: '價格向下跌穿 Support，隨後重新收復 Support Zone', confirm: '回測守住舊 Support，形成 HL', trigger: '突破確認 Candle High', stop: '重新收復失敗或相關結構低位下方', target: '下一阻力區', minRR: '2', sizing: '每筆 0.25% 本金', manage: '固定 Stop / Target', skip: '再次失守、沒有後續反彈、風險回報不足' },
    { name: 'TSLA-BR-LONG', version: '1.0', direction: 'Long', tf: '5m', market: 'RTH；15m 已確認 HH+HL；避開預定重大消息', levels: '開市前畫好 PDH/PDL、PMH/PML、15m Zone', signal: '5m Close > Zone Upper + $0.05；RVOL(time, Regular) ≥ 1.5；價格 > Session VWAP', confirm: '突破後 6 支 K 線內回測 Zone；Close > Zone Upper 且 CLV ≥ 0', trigger: '確認 K 線 High + $0.05（Buy Stop，用實際 Fill 記錄）', stop: 'Retest Low − 緩衝（按波幅）', target: '下一重要阻力之前，R:R ≥ 最低要求', minRR: '2', sizing: '本金 $10,000，每筆 0.25%', manage: '固定 Stop / Target；15:30 後唔開新倉；收市前平倉', skip: '回測跌穿失效位、未觸發已到下一阻力、R:R 不足、重大消息、超時、每日虧損上限' },
  ];

  let viewPid = null;
  const U2 = () => Store.user(viewPid || undefined);
  const arr = (k) => { const u = U2(); u[k] = u[k] || []; return u[k]; };
  const byDate = (a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || ''));
  const kindOf = (t) => t.kind || 'replay';

  function calc(t) {
    const long = t.side !== 'short';
    const dir = long ? 1 : -1;
    const riskPS = (t.entry - t.stop) * dir;
    const initRisk = riskPS * t.shares;
    const closed = has(t.exit);
    const pnl = closed ? (t.exit - t.entry) * dir * t.shares - (has(t.fees) ? t.fees : 0) : null;
    const r = closed && initRisk > 0 ? pnl / initRisk : null;
    const pe = has(t.plannedEntry) ? t.plannedEntry : t.entry;
    const plannedRR = riskPS > 0 && has(t.target) ? ((t.target - pe) * dir) / ((pe - t.stop) * dir) : null;
    const mfe = has(long ? t.hi : t.lo) && riskPS > 0 ? (long ? t.hi - t.entry : t.entry - t.lo) / riskPS : null;
    const mae = has(long ? t.lo : t.hi) && riskPS > 0 ? (long ? t.entry - t.lo : t.hi - t.entry) / riskPS : null;
    const slip = has(t.plannedEntry) ? (t.entry - t.plannedEntry) * dir : null;
    const goodProcess = t.followed !== 'no' && !(t.mistakes || []).length;
    return { riskPS, initRisk, pnl, r, plannedRR, mfe, mae, slip, closed, goodProcess, cad: pnl != null && has(t.fx) ? pnl * t.fx : null };
  }
  function netRs() { return arr('journal').slice().sort(byDate).map(calc).filter((c) => c.r != null).map((c) => c.r); }
  const pbName = (id) => { const p = arr('playbooks').find((x) => x.id === id); return p ? `${p.name}${p.version ? ' v' + p.version : ''}` : ''; };
  const csvQ = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  function markBackup() { Store.setUI({ lastBackup: Date.now() }); }

  /* ---------- 交易表單 ---------- */
  function tradeForm(t, onSave) {
    const { esc } = U();
    const v = (k, d = '') => (t[k] == null || (typeof t[k] === 'number' && !isFinite(t[k])) ? d : t[k]);
    const sel = (k, opts, d) => `<select name="${k}">${opts.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(v(k, d)) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    const num = (k, l, st = '0.01') => `<label class="fld"><span>${l}</span><input type="number" step="${st}" name="${k}" value="${esc(v(k))}"></label>`;
    const pbs = [['', '（未指定）']].concat(arr('playbooks').map((p) => [p.id, `${p.name}${p.version ? ' v' + p.version : ''}`]));
    const ms = t.mistakes || [];
    App.modal(`<h3>${t.id ? '編輯交易' : '新增交易紀錄'}</h3>
      <form class="jform">
        <div class="form-sec">① 基本資料</div>
        <div class="tool-grid">
          <label class="fld"><span>類型</span>${sel('kind', KINDS, 'replay')}</label>
          <label class="fld"><span>日期（ET）</span><input type="date" name="date" value="${esc(v('date', Store.today()))}"></label>
          <label class="fld"><span>時間（ET）</span><input type="time" name="time" value="${esc(v('time'))}"></label>
          <label class="fld"><span>Symbol</span><input name="symbol" value="${esc(v('symbol', 'TSLA'))}"></label>
          <label class="fld"><span>Playbook</span>${sel('playbookId', pbs, '')}</label>
          <label class="fld"><span>Setup</span>${sel('setup', SETUPS)}</label>
          <label class="fld"><span>Market Type（當時判斷）</span>${sel('market', MARKETS)}</label>
          <label class="fld"><span>方向</span>${sel('side', [['long', 'Long'], ['short', 'Short']], 'long')}</label>
          <label class="fld wide"><span>入場理由（兩句話：點解入？幾時失效？）</span><textarea name="reason" rows="2" placeholder="例如：突破 $385 後回測守住，出現向上確認。跌穿 $384.70 代表假設失效。">${esc(v('reason'))}</textarea></label>
        </div>
        <div class="form-sec">② 價格同結果</div>
        <div class="tool-grid">
          ${num('plannedEntry', '計劃 Entry（Trigger）')}${num('entry', '實際 Entry Fill *')}${num('stop', 'Initial Stop *')}${num('target', 'Target')}
          ${num('shares', 'Shares *', '1')}${num('exit', '實際 Exit Fill（未平倉留空）')}${num('fees', '來回費用（USD）')}
          ${num('hi', '持倉期間最高（MFE）')}${num('lo', '持倉期間最低（MAE）')}${num('fx', 'USD→CAD 匯率（真實交易稅務用）', '0.0001')}
          <label class="fld"><span>RVOL / VWAP 背景</span><input name="context" value="${esc(v('context'))}" placeholder="例如 RVOL 1.8 / Above rising"></label>
          <label class="fld"><span>圖表截圖連結</span><input type="url" name="chartUrl" value="${esc(v('chartUrl'))}" placeholder="TradingView / GoCharting 分享連結"></label>
        </div>
        <div class="tool-out" data-preview></div>
        <div class="form-sec">③ 檢討（判斷啱唔啱？執行好唔好？）</div>
        <div class="tool-grid">
          <label class="fld"><span>方向／分析判斷</span>${sel('analysis', ANALYSIS, 'na')}</label>
          <label class="fld"><span>有冇跟足規則？</span>${sel('followed', [['yes', '✅ Yes'], ['no', '❌ No']], 'yes')}</label>
          <label class="fld"><span>當時情緒</span>${sel('emotion', [['', '—']].concat(EMOTIONS.map((e) => [e, e])), '')}</label>
        </div>
        <div class="fld wide"><span>犯咗邊啲錯？（可多選）</span><div class="tag-pick">${MISTAKES.map((m) => `<label><input type="checkbox" name="mistakes" value="${esc(m)}" ${ms.includes(m) ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div></div>
        <div class="tool-grid">
          <label class="fld wide"><span>學到乜／教訓</span><textarea name="lesson" rows="2">${esc(v('lesson'))}</textarea></label>
          <label class="fld wide"><span>下次點改善</span><textarea name="improve" rows="2">${esc(v('improve'))}</textarea></label>
          <label class="fld wide"><span>其他備註</span><textarea name="notes" rows="2">${esc(v('notes'))}</textarea></label>
        </div>
        <div class="modal-actions"><button type="button" class="btn ghost" data-close>取消</button><button class="btn primary" type="submit">儲存</button></div>
      </form>`, (box, close) => {
      const form = box.querySelector('form');
      const read = () => {
        const fd = new FormData(form); const o = {};
        fd.forEach((val, k) => { if (k !== 'mistakes') o[k] = val; });
        o.mistakes = fd.getAll('mistakes');
        ['plannedEntry', 'entry', 'stop', 'target', 'shares', 'exit', 'fees', 'hi', 'lo', 'fx'].forEach((k) => { o[k] = o[k] === '' || o[k] == null ? null : parseFloat(o[k]); });
        return o;
      };
      const prev = () => {
        const o = read(); const c = calc(o); const { stat, signR, money, F } = U();
        box.querySelector('[data-preview]').innerHTML = c.riskPS > 0 ? `<div class="stats">${stat('Initial Risk', money(c.initRisk))}${stat('計劃 R:R', c.plannedRR != null ? F(c.plannedRR) : '—', c.plannedRR != null && c.plannedRR < 1.5 ? 'neg' : '')}${stat('Net P&L', c.pnl != null ? money(c.pnl) : '未平倉', c.pnl >= 0 ? 'pos' : 'neg')}${stat('Net R', c.r != null ? signR(c.r) : '—', c.r >= 0 ? 'pos' : 'neg')}</div>` : (has(o.entry) && has(o.stop) ? '<div class="verdict bad">Stop 方向唔啱（Long 嘅 Stop 要低過 Entry；Short 相反）。</div>' : '');
      };
      form.addEventListener('input', prev); prev();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const o = read();
        if (!has(o.entry) || !has(o.stop) || !has(o.shares)) { App.toast('請填 Entry、Stop 同 Shares'); return; }
        onSave(o); close();
      });
    }, { wide: true });
  }

  function tradeDetail(t, el, tab) {
    const { esc, stat, signR, money, F } = U();
    const c = calc(t);
    const q = (c.goodProcess ? (c.r > 0 ? 'q1' : 'q2') : (c.r > 0 ? 'q3' : 'q4'));
    App.modal(`<h3>${esc(t.symbol || '')} · ${esc(t.date || '')} ${esc(t.time || '')} <small>${esc(KIND_SHORT[kindOf(t)])}</small></h3>
      <p class="muted">${esc(pbName(t.playbookId) || t.setup || '')} · ${esc(t.market || '')} · ${t.side === 'short' ? 'Short' : 'Long'}</p>
      ${t.reason ? `<blockquote class="quote">💬 ${esc(t.reason)}</blockquote>` : ''}
      <div class="stats">${stat('Entry', F(t.entry))}${stat('Stop', F(t.stop))}${stat('Target', has(t.target) ? F(t.target) : '—')}${stat('Exit', c.closed ? F(t.exit) : '持倉中')}
        ${stat('Net P&L', c.pnl != null ? money(c.pnl) : '—', c.pnl >= 0 ? 'pos' : 'neg')}${stat('Net R', c.r != null ? signR(c.r) : '—', c.r >= 0 ? 'pos' : 'neg')}${stat('計劃 R:R', c.plannedRR != null ? F(c.plannedRR) : '—')}${stat('MFE / MAE', (c.mfe != null ? F(c.mfe, 1) + 'R' : '—') + ' / ' + (c.mae != null ? F(c.mae, 1) + 'R' : '—'))}</div>
      ${c.closed ? `<div class="pq-badge ${q}">${{ q1: '🟢 好過程 + 好結果：應得嘅贏', q2: '🟡 好過程 + 壞結果：正常虧損，唔使改規則', q3: '🟠 壞過程 + 好結果：運氣好，最危險！', q4: '🔴 壞過程 + 壞結果：應得嘅輸，要改執行' }[q]}</div>` : ''}
      <table class="tbl"><tbody>
        <tr><th>判斷</th><td>${esc((ANALYSIS.find((a) => a[0] === (t.analysis || 'na')) || [])[1])}</td></tr>
        <tr><th>跟規則</th><td>${t.followed === 'no' ? '❌ No' : '✅ Yes'}</td></tr>
        <tr><th>情緒</th><td>${esc(t.emotion || '—')}</td></tr>
        <tr><th>錯誤</th><td>${(t.mistakes || []).map((m) => `<span class="chip neg">${esc(m)}</span>`).join(' ') || '—'}</td></tr>
        <tr><th>教訓</th><td>${esc(t.lesson || '—')}</td></tr>
        <tr><th>改善</th><td>${esc(t.improve || '—')}</td></tr>
        <tr><th>背景</th><td>${esc(t.context || '—')}</td></tr>
        <tr><th>備註</th><td>${esc(t.notes || '—')}</td></tr>
        ${t.chartUrl ? `<tr><th>圖表</th><td><a href="${esc(t.chartUrl)}" target="_blank" rel="noopener noreferrer">打開截圖 ↗</a></td></tr>` : ''}
      </tbody></table>
      <div class="modal-actions"><button class="btn primary" data-edit>✏️ 編輯／補充檢討</button></div>`, (box, close) => {
      box.querySelector('[data-edit]').addEventListener('click', () => { close(); tradeForm(t, (o) => { Object.assign(t, o); Store.emit('journal'); render(el, tab); }); });
    }, { wide: true, noFocus: true });
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
        <label class="fld"><span>Symbol</span><input name="symbol" value="${esc(v('symbol', 'TSLA'))}"></label>
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

  /* ---------- Playbook 表單 ---------- */
  function pbForm(p, onSave) {
    const { esc } = U();
    const v = (k, d = '') => (p[k] == null ? d : p[k]);
    App.modal(`<h3>${p.id ? '編輯 Playbook' : '新增 Playbook'}</h3>
      <p class="muted">將你嘅策略寫成固定規則。改規則時用「另存新版本」，舊版本會記入歷史，方便日後比較。</p>
      <form class="jform"><div class="tool-grid">
        <label class="fld wide"><span>名稱 *</span><input name="name" required value="${esc(v('name'))}" placeholder="例如 AAPL Breakout + Retest Long"></label>
        <label class="fld"><span>版本</span><input name="version" value="${esc(v('version', '1.0'))}"></label>
        <label class="fld"><span>狀態</span><select name="status">${['🧪 測試中', '✅ 使用中', '⏸️ 停用'].map((s) => `<option ${v('status', '🧪 測試中') === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="fld"><span>方向</span><select name="direction">${['Long', 'Short', 'Long / Short'].map((s) => `<option ${v('direction', 'Long') === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="fld"><span>Timeframe</span><input name="tf" value="${esc(v('tf', '5m'))}"></label>
        ${PB_FIELDS.map(([k, l]) => `<label class="fld wide"><span>${l}</span><textarea name="${k}" rows="${k === 'minRR' ? 1 : 2}">${esc(v(k))}</textarea></label>`).join('')}
      </div><div class="modal-actions"><button type="button" class="btn ghost" data-close>取消</button><button class="btn primary" type="submit">儲存</button></div></form>`, (box, close) => {
      box.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); const o = {}; fd.forEach((val, k) => (o[k] = val)); onSave(o); close(); });
    }, { wide: true });
  }

  /* ---------- Replay 日誌表單 ---------- */
  function replayForm(r, onSave) {
    const { esc } = U();
    const v = (k, d = '') => (r[k] == null ? d : r[k]);
    const checks = r.checks || {};
    const pbs = [['', '（未指定）']].concat(arr('playbooks').map((p) => [p.id, `${p.name}${p.version ? ' v' + p.version : ''}`]));
    App.modal(`<h3>${r.id ? '編輯 Replay 日誌' : '🔁 新增 Replay 日誌'}</h3>
      <p class="muted">唔好只用「今日有冇入市」判斷自己啱唔啱。用以下評分表，分清係冇 Setup、R:R 唔合理，定係錯過咗。</p>
      <form class="jform"><div class="tool-grid">
        <label class="fld"><span>Replay 嘅交易日</span><input type="date" name="date" value="${esc(v('date', Store.today()))}"></label>
        <label class="fld"><span>Symbol</span><input name="symbol" value="${esc(v('symbol', 'TSLA'))}"></label>
        <label class="fld"><span>Timeframe</span><input name="tf" value="${esc(v('tf', '5m / 15m'))}"></label>
        <label class="fld"><span>今日集中練邊套</span><select name="playbookId">${pbs.map(([id, n]) => `<option value="${esc(id)}" ${v('playbookId') === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="fld"><span>當時判斷嘅市況</span><select name="market">${MARKETS.map((m) => `<option ${v('market') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <label class="fld"><span>候選 Setup 數</span><input type="number" step="1" name="cands" value="${esc(v('cands', 0))}"></label>
        <label class="fld"><span>模擬交易數</span><input type="number" step="1" name="trades" value="${esc(v('trades', 0))}"></label>
      </div>
      <div class="form-sec">評分表（有就剔）</div>
      <div class="tag-pick col">${REPLAY_CHECKS.map((c, i) => `<label><input type="checkbox" name="c${i}" ${checks[i] ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div>
      <div class="tool-grid">
        <label class="fld wide"><span>今日主要結果</span><select name="outcome">${REPLAY_OUT.map((o) => `<option ${v('outcome') === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="fld wide"><span>畫咗邊啲 Key Levels（開市前）</span><textarea name="levels" rows="2" placeholder="例如 PDH 346.65 / 346.0–346.2 / 342.10 / 340.6–341.0">${esc(v('levels'))}</textarea></label>
        <label class="fld wide"><span>過程記錄（幾點發生乜）</span><textarea name="notes" rows="3">${esc(v('notes'))}</textarea></label>
        <label class="fld wide"><span>學到乜／下次改善</span><textarea name="lesson" rows="2">${esc(v('lesson'))}</textarea></label>
        <label class="fld wide"><span>圖表截圖連結</span><input type="url" name="chartUrl" value="${esc(v('chartUrl'))}"></label>
      </div>
      <div class="modal-actions"><button type="button" class="btn ghost" data-close>取消</button><button class="btn primary" type="submit">儲存</button></div></form>`, (box, close) => {
      box.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault(); const fd = new FormData(e.target); const o = { checks: {} };
        fd.forEach((val, k) => { if (/^c\d$/.test(k)) o.checks[k.slice(1)] = true; else o[k] = val; });
        o.cands = parseInt(o.cands, 10) || 0; o.trades = parseInt(o.trades, 10) || 0;
        onSave(o); close();
      });
    }, { wide: true });
  }

  /* ---------- 統計輔助 ---------- */
  function filtered() {
    const f = Store.ui().jFilter || {};
    return arr('journal').slice().sort(byDate).filter((t) => (!f.kind || f.kind === 'all' || (f.kind === 'sim' ? kindOf(t) !== 'live' : kindOf(t) === f.kind)) && (!f.pb || t.playbookId === f.pb));
  }
  function filterBar() {
    const { esc } = U();
    const f = Store.ui().jFilter || {};
    const pbs = arr('playbooks');
    return `<div class="jfilter"><span class="muted">篩選：</span>${[['all', '全部'], ['live', '💵 真實'], ['sim', '🧪 全部模擬'], ['paper', '📄 Paper'], ['replay', '🔁 Replay']].map(([k, l]) => `<button class="chip btn-chip ${(f.kind || 'all') === k ? 'on' : ''}" data-fk="${k}">${l}</button>`).join('')}
      <select data-fpb aria-label="篩選"><option value="">所有 Playbook</option>${pbs.map((p) => `<option value="${esc(p.id)}" ${f.pb === p.id ? 'selected' : ''}>${esc(p.name)}${p.version ? ' v' + esc(p.version) : ''}</option>`).join('')}</select></div>`;
  }
  function bindFilter(el, tab) {
    el.querySelectorAll('[data-fk]').forEach((b) => b.addEventListener('click', () => { const f = Store.ui().jFilter || {}; f.kind = b.dataset.fk; Store.setUI({ jFilter: f }); render(el, tab); }));
    const s = el.querySelector('[data-fpb]'); if (s) s.addEventListener('change', () => { const f = Store.ui().jFilter || {}; f.pb = s.value; Store.setUI({ jFilter: f }); render(el, tab); });
  }
  function countBy(list, fn) { const m = {}; list.forEach((x) => [].concat(fn(x) || []).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); }

  /* ---------- 頁面 ---------- */
  function render(el, tab) {
    tab = tab || 'stats';
    const { esc, stat, signR, money, pct, F, rStats, verdict } = U();
    const me = Store.activeProfile();
    if (!viewPid || !Store.profiles().some((p) => p.id === viewPid)) viewPid = me ? me.id : null;
    const owner = Store.profiles().find((p) => p.id === viewPid);
    const readonly = me && owner && me.id !== owner.id;
    const all = arr('journal');
    const trades = filtered();
    const cs = arr('candidates').slice().sort(byDate);
    const pbs = arr('playbooks');
    const reps = arr('replays').slice().sort(byDate).reverse();
    const lb = Store.ui().lastBackup;
    const needBackup = (all.length + reps.length + pbs.length) > 0 && (!lb || Date.now() - lb > 7 * 864e5);
    el.innerHTML = `<div class="page-head"><h1>📒 交易日誌 & Playbook</h1>
      <p class="muted">記錄<b>真實交易</b>同<b>模擬交易</b>（Paper / Replay）、管理你嘅 <b>Playbook</b>、逐日寫 <b>Replay 檢討</b>，再用數據評估自己判斷啱唔啱、執行好唔好。資料只儲存喺呢部機。</p>
      ${Store.profiles().length > 1 ? `<div class="jowner"><span class="muted">睇邊個嘅日誌：</span>${Store.profiles().map((p) => `<button class="chip btn-chip ${p.id === viewPid ? 'on' : ''}" data-owner="${p.id}">${p.emoji} ${esc(p.name)}</button>`).join('')}${readonly ? '<span class="chip">👀 檢視緊其他人嘅紀錄</span>' : ''}</div>` : ''}
      ${needBackup ? `<div class="verdict mid">💾 ${lb ? `上次備份係 ${Math.round((Date.now() - lb) / 864e5)} 日前` : '你未備份過'}。交易紀錄只存喺呢部機，清除瀏覽器資料會唔見。<button class="btn sm" data-backup>⬇️ 即刻備份</button></div>` : ''}</div>
      <div class="tabs" role="tablist">
        <a href="#/journal/stats" class="tab ${tab === 'stats' ? 'on' : ''}">📊 總覽</a>
        <a href="#/journal/trades" class="tab ${tab === 'trades' ? 'on' : ''}">🧾 交易（${all.length}）</a>
        <a href="#/journal/playbooks" class="tab ${tab === 'playbooks' ? 'on' : ''}">📘 Playbook（${pbs.length}）</a>
        <a href="#/journal/replays" class="tab ${tab === 'replays' ? 'on' : ''}">🔁 Replay 日誌（${reps.length}）</a>
        <a href="#/journal/cands" class="tab ${tab === 'cands' ? 'on' : ''}">🔎 候選（${cs.length}）</a>
        <a href="#/journal/review" class="tab ${tab === 'review' ? 'on' : ''}">🧠 檢討</a>
      </div><div class="jbody"></div>`;
    el.querySelectorAll('[data-owner]').forEach((b) => b.addEventListener('click', () => { viewPid = b.dataset.owner; render(el, tab); }));
    const bk = el.querySelector('[data-backup]'); if (bk) bk.addEventListener('click', () => { App.download(`trading-academy-backup-${Store.today()}.json`, Store.exportJSON(), 'application/json'); markBackup(); App.toast('已匯出備份'); render(el, tab); });
    const body = el.querySelector('.jbody');
    const save = (key, o, existing, xp) => {
      if (existing) Object.assign(existing, o);
      else { o.id = Store.uid(); o.ts = Date.now(); arr(key).push(o); if (xp && !readonly) Store.awardXP(xp + ':' + o.id, 3); }
      Store.emit('journal'); render(el, tab);
    };

    /* ----- 交易 ----- */
    if (tab === 'trades') {
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增交易</button><button class="btn sm" data-csv>⬇️ 匯出 CSV</button>${all.length ? '' : '<button class="btn ghost sm" data-demo>載入 5 筆示範交易</button>'}</div>${filterBar()}
        ${trades.length ? `<div class="tbl-wrap"><table class="tbl jt"><thead><tr><th>日期</th><th>類型</th><th>Playbook／Setup</th><th>市況</th><th>Entry</th><th>Exit</th><th>Net R</th><th>判斷</th><th>過程</th><th></th></tr></thead><tbody>
        ${trades.slice().reverse().map((t) => { const c = calc(t); return `<tr class="clickable" data-view="${t.id}"><td>${esc(t.date)}<br><small>${esc(t.symbol || '')} ${esc(t.time || '')}</small></td><td><span class="kind k-${kindOf(t)}">${KIND_SHORT[kindOf(t)]}</span></td><td>${esc(pbName(t.playbookId) || (t.setup || '').split('：')[0])}</td><td>${esc(t.market)}</td><td>${F(t.entry)}</td><td>${c.closed ? F(t.exit) : '<i>持倉中</i>'}</td><td class="${c.r >= 0 ? 'pos' : 'neg'}"><b>${c.r != null ? signR(c.r) : '—'}</b></td><td>${{ correct: '✅', partial: '➗', wrong: '❌' }[t.analysis] || '·'}</td><td>${c.goodProcess ? '👍' : `⚠️${(t.mistakes || []).length ? ' ' + t.mistakes.length : ''}`}</td><td class="row-acts"><button data-edit="${t.id}" title="編輯">✏️</button><button data-del="${t.id}" title="刪除">🗑️</button></td></tr>`; }).join('')}
        </tbody></table></div><p class="tool-fine">撳任何一行睇詳細同檢討。👍 = 跟足規則又冇犯錯；⚠️ = 有違規或錯誤。</p>` : '<div class="empty">未有交易紀錄。真實交易、Paper Trading、Bar Replay 模擬交易都可以記喺度，再用「類型」分開統計。</div>'}`;
      bindFilter(body, tab);
      body.querySelector('[data-add]').addEventListener('click', () => tradeForm({ kind: (Store.ui().jFilter || {}).kind === 'live' ? 'live' : undefined, playbookId: (Store.ui().jFilter || {}).pb }, (o) => save('journal', o, null, 'trade')));
      body.querySelectorAll('[data-view]').forEach((r) => r.addEventListener('click', (e) => { if (e.target.closest('button')) return; tradeDetail(all.find((x) => x.id === r.dataset.view), el, tab); }));
      body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const t = all.find((x) => x.id === b.dataset.edit); tradeForm(t, (o) => save('journal', o, t)); }));
      body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢筆交易？（失敗交易都係重要樣本，建議保留）')) return; const u = U2(); u.journal = u.journal.filter((x) => x.id !== b.dataset.del); Store.emit('journal'); render(el, tab); }));
      const demo = body.querySelector('[data-demo]');
      if (demo) demo.addEventListener('click', () => {
        const base = { symbol: 'TSLA', side: 'long', fees: 2, followed: 'yes', kind: 'replay', analysis: 'correct', notes: '示範資料，可刪除' };
        [
          { date: '2026-09-14', time: '09:55', setup: SETUPS[0], market: 'Trending', plannedEntry: 386.10, entry: 386.10, stop: 384.70, target: 388.90, shares: 14, exit: 388.90, hi: 389.05, lo: 385.80, emotion: '冷靜', reason: '突破 $385 後回測守住，出現向上確認。跌穿 $384.70 失效。', lesson: '跟足計劃，等到確認先入。' },
          { date: '2026-09-15', time: '10:20', setup: SETUPS[0], market: 'Range', plannedEntry: 391.05, entry: 391.18, stop: 389.90, target: 393.60, shares: 16, exit: 389.80, hi: 391.90, lo: 389.70, emotion: '冷靜', analysis: 'wrong', lesson: 'Range 日突破容易失敗；規則冇錯，屬正常虧損樣本。' },
          { date: '2026-09-16', time: '10:05', setup: SETUPS[1], market: 'Range', plannedEntry: 380.95, entry: 380.95, stop: 379.45, target: 384.20, shares: 14, exit: 382.40, hi: 382.60, lo: 380.40, analysis: 'partial', lesson: 'VWAP 附近按規則減倉離場。' },
          { date: '2026-09-17', time: '11:10', setup: SETUPS[0], market: 'Choppy', plannedEntry: 395.20, entry: 395.40, stop: 394.10, target: 397.80, shares: 17, exit: 393.95, hi: 395.70, lo: 393.90, followed: 'no', analysis: 'wrong', emotion: 'FOMO 怕錯過', mistakes: ['追價／入場太遲', 'Choppy 日硬做'], lesson: 'Choppy 日唔應該做；追價入場。', improve: '開市前先判斷市況，Choppy 就觀察唔落單。' },
          { date: '2026-09-18', time: '09:50', setup: SETUPS[2], market: 'Trending', plannedEntry: 380.85, entry: 380.90, stop: 379.60, target: 383.50, shares: 17, exit: 383.50, hi: 383.70, lo: 380.30, kind: 'paper' },
        ].forEach((t) => all.push(Object.assign({ id: Store.uid(), ts: Date.now() }, base, t)));
        Store.emit('journal'); render(el, tab);
      });
      body.querySelector('[data-csv]').addEventListener('click', () => {
        let csv = 'Date,Time,Type,Symbol,Playbook,Setup,Market,Side,PlannedEntry,EntryFill,Stop,Target,Shares,ExitFill,Fees,NetPnL,InitialRisk,NetR,PlannedRR,MFE_R,MAE_R,FX_CAD,PnL_CAD,Analysis,RuleFollowed,Emotion,Mistakes,Reason,Lesson,Improve,Context,ChartURL,Notes\n';
        trades.forEach((t) => { const c = calc(t); csv += [t.date, t.time, KIND_SHORT[kindOf(t)], t.symbol, csvQ(pbName(t.playbookId)), csvQ(t.setup), t.market, t.side, t.plannedEntry, t.entry, t.stop, t.target, t.shares, t.exit, t.fees, c.pnl != null ? c.pnl.toFixed(2) : '', c.initRisk.toFixed(2), c.r != null ? c.r.toFixed(3) : '', c.plannedRR != null ? c.plannedRR.toFixed(2) : '', c.mfe != null ? c.mfe.toFixed(2) : '', c.mae != null ? c.mae.toFixed(2) : '', t.fx || '', c.cad != null ? c.cad.toFixed(2) : '', t.analysis || '', t.followed, csvQ(t.emotion), csvQ((t.mistakes || []).join('; ')), csvQ(t.reason), csvQ(t.lesson), csvQ(t.improve), csvQ(t.context), csvQ(t.chartUrl), csvQ(t.notes)].map((x) => (x == null ? '' : x)).join(',') + '\n'; });
        App.download('trade_journal.csv', '﻿' + csv, 'text/csv');
      });
      return;
    }

    /* ----- Playbook ----- */
    if (tab === 'playbooks') {
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增 Playbook</button><span class="muted">或者由範本加入：</span>${TEMPLATES.map((t, i) => `<button class="btn ghost sm" data-tpl="${i}">${esc(t.name)}${t.version ? ' v' + t.version : ''}</button>`).join('')}</div>
        ${pbs.length ? `<div class="pb-list">${pbs.map((p) => {
          const ts = all.filter((t) => t.playbookId === p.id);
          const rs = ts.map(calc).filter((c) => c.r != null).map((c) => c.r);
          const st = rStats(rs);
          const comp = ts.length ? ts.filter((t) => calc(t).goodProcess).length / ts.length : null;
          return `<div class="pb-card">
            <div class="pb-head"><div><b>${esc(p.name)}</b> <span class="chip">v${esc(p.version || '1.0')}</span> <span class="chip">${esc(p.status || '')}</span><br><small class="muted">${esc(p.direction || '')} · ${esc(p.tf || '')} · 更新 ${new Date(p.updated || p.ts).toLocaleDateString('zh-HK')}</small></div>
            <div class="pb-acts"><button class="btn sm" data-pedit="${p.id}">✏️ 編輯</button><button class="btn sm" data-pver="${p.id}">🆕 新版本</button><button class="btn ghost sm" data-pcopy="${p.id}">📋 複製文字</button><button class="btn ghost sm" data-pdel="${p.id}">🗑️</button></div></div>
            <div class="stats">${stat('交易', ts.length + ' 筆')}${stat('勝率', st ? pct(st.wr, 0) : '—')}${stat('Expectancy', st ? signR(st.exp) : '—', st && st.exp >= 0 ? 'pos' : 'neg')}${stat('總 R', st ? signR(st.total, 1) : '—')}${stat('好過程比例', comp != null ? pct(comp, 0) : '—')}</div>
            <details><summary>睇完整規則</summary><table class="tbl"><tbody>${PB_FIELDS.filter(([k]) => p[k]).map(([k, l]) => `<tr><th>${l}</th><td>${esc(p[k]).replace(/\n/g, '<br>')}</td></tr>`).join('')}</tbody></table>
            ${(p.history || []).length ? `<p><b>版本紀錄</b></p><ul class="pb-hist">${p.history.slice().reverse().map((h) => `<li><b>v${esc(h.ver)}</b> → ${new Date(h.ts).toLocaleDateString('zh-HK')}：${esc(h.note)}</li>`).join('')}</ul>` : ''}</details>
          </div>`; }).join('')}</div>` : '<div class="empty">未有 Playbook。由範本開始最快：A／B／C 係 Level 3 嘅三套 Setup，TSLA-BR-LONG v1.0 係 Level 4–5 嘅量化版本。之後可以改成你自己（例如 AAPL）嘅版本。</div>'}
        <p class="tool-fine">每次改規則都用「新版本」：舊版本嘅內容同改動原因會記入歷史；交易紀錄揀返對應 Playbook，就可以比較唔同版本嘅表現。</p>`;
      body.querySelector('[data-add]').addEventListener('click', () => pbForm({}, (o) => { o.updated = Date.now(); o.history = []; save('playbooks', o); }));
      body.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => { const t = JSON.parse(JSON.stringify(TEMPLATES[+b.dataset.tpl])); t.version = t.version || '1.0'; t.status = '🧪 測試中'; t.updated = Date.now(); t.history = []; save('playbooks', t); App.toast('已加入 Playbook'); }));
      body.querySelectorAll('[data-pedit]').forEach((b) => b.addEventListener('click', () => { const p = pbs.find((x) => x.id === b.dataset.pedit); pbForm(p, (o) => { o.updated = Date.now(); save('playbooks', o, p); }); }));
      body.querySelectorAll('[data-pver]').forEach((b) => b.addEventListener('click', () => {
        const p = pbs.find((x) => x.id === b.dataset.pver);
        const note = prompt(`由 v${p.version || '1.0'} 升級：今次改咗乜？點解？`, ''); if (note == null) return;
        const parts = String(p.version || '1.0').split('.'); parts[parts.length - 1] = String((parseInt(parts[parts.length - 1], 10) || 0) + 1);
        const snapshot = {}; PB_FIELDS.forEach(([k]) => (snapshot[k] = p[k]));
        p.history = p.history || []; p.history.push({ ver: p.version || '1.0', note: note || '（冇填原因）', ts: Date.now(), snapshot });
        p.version = parts.join('.'); p.updated = Date.now();
        Store.emit('journal'); render(el, tab);
        pbForm(p, (o) => { o.updated = Date.now(); save('playbooks', o, p); });
      }));
      body.querySelectorAll('[data-pcopy]').forEach((b) => b.addEventListener('click', () => {
        const p = pbs.find((x) => x.id === b.dataset.pcopy);
        const txt = `【Playbook】${p.name} v${p.version || '1.0'}（${p.status || ''}）\n方向：${p.direction || ''}｜Timeframe：${p.tf || ''}\n` + PB_FIELDS.filter(([k]) => p[k]).map(([k, l]) => `${l}：${p[k]}`).join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => App.toast('已複製'), () => prompt('複製以下文字：', txt));
      }));
      body.querySelectorAll('[data-pdel]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢個 Playbook？（相關交易紀錄會保留，但唔再連結）')) return; const u = U2(); u.playbooks = u.playbooks.filter((x) => x.id !== b.dataset.pdel); Store.emit('journal'); render(el, tab); }));
      return;
    }

    /* ----- Replay 日誌 ----- */
    if (tab === 'replays') {
      const outs = countBy(reps, (r) => r.outcome);
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增 Replay 日誌</button><a class="btn ghost sm" href="#/tools/no-entry">🩺 「點解冇 Entry？」診斷器</a><button class="btn sm" data-csv>⬇️ 匯出 CSV</button></div>
        ${reps.length ? `<div class="grid-2"><div data-outchart></div><div class="card"><div class="card-h">點解讀？</div><p class="tool-fine">「完全冇 Breakout」、「冇 Retest」、「R:R 不合理」多 → 市場冇提供你練緊嘅 Setup，或者你嘅 Playbook 要求好嚴，No Trade 係正確結果。<br>「錯過咗符合條件嘅機會」多 → 執行問題：準備唔夠、猶豫、睇唔到訊號。<br>評分表分數低 → 準備同紀律要改善。</p></div></div>
        <div class="rp-list">${reps.map((r) => { const sc = Object.keys(r.checks || {}).length; return `<div class="rp-item"><div class="rp-item-h"><b>${esc(r.date)} · ${esc(r.symbol || '')}</b><span class="chip">${esc(r.outcome || '')}</span><span class="chip ${sc >= 6 ? 'pos' : sc <= 3 ? 'neg' : ''}">評分 ${sc}/7</span><span class="muted">${esc(pbName(r.playbookId))} · ${esc(r.market || '')} · 候選 ${r.cands || 0} · 交易 ${r.trades || 0}</span>
          <span class="row-acts"><button data-redit="${r.id}">✏️</button><button data-rdel="${r.id}">🗑️</button></span></div>
          ${r.levels ? `<p class="muted">📏 ${esc(r.levels)}</p>` : ''}${r.notes ? `<p>${esc(r.notes).replace(/\n/g, '<br>')}</p>` : ''}${r.lesson ? `<p>💡 <b>${esc(r.lesson)}</b></p>` : ''}${r.chartUrl ? `<a href="${esc(r.chartUrl)}" target="_blank" rel="noopener noreferrer">📈 圖表</a>` : ''}
          <div class="rp-checks">${REPLAY_CHECKS.map((c, i) => `<span class="${(r.checks || {})[i] ? 'ok' : 'no'}">${(r.checks || {})[i] ? '✓' : '✗'} ${esc(c)}</span>`).join('')}</div></div>`; }).join('')}</div>` : '<div class="empty">未有 Replay 日誌。每 Replay 完一日（例如 AAPL 10 月 19 日），就喺度記低準備咗乜、出現咗乜、點解有／冇交易。</div>'}`;
      if (reps.length) Charts.bars(body.querySelector('[data-outchart]'), { labels: outs.map((o) => REPLAY_SHORT[REPLAY_OUT.indexOf(o[0])] || o[0].slice(0, 6)), values: outs.map((o) => o[1]), title: 'Replay 結果分佈', height: 220 });
      body.querySelector('[data-add]').addEventListener('click', () => replayForm({}, (o) => save('replays', o, null, 'replaylog')));
      body.querySelectorAll('[data-redit]').forEach((b) => b.addEventListener('click', () => { const r = reps.find((x) => x.id === b.dataset.redit); replayForm(r, (o) => save('replays', o, r)); }));
      body.querySelectorAll('[data-rdel]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢篇 Replay 日誌？')) return; const u = U2(); u.replays = u.replays.filter((x) => x.id !== b.dataset.rdel); Store.emit('journal'); render(el, tab); }));
      body.querySelector('[data-csv]').addEventListener('click', () => {
        let csv = 'Date,Symbol,TF,Playbook,Market,Candidates,Trades,Outcome,Score,' + REPLAY_CHECKS.map(csvQ).join(',') + ',Levels,Notes,Lesson,ChartURL\n';
        reps.forEach((r) => (csv += [r.date, r.symbol, csvQ(r.tf), csvQ(pbName(r.playbookId)), r.market, r.cands, r.trades, csvQ(r.outcome), Object.keys(r.checks || {}).length].concat(REPLAY_CHECKS.map((_, i) => ((r.checks || {})[i] ? 'Y' : 'N')), [csvQ(r.levels), csvQ(r.notes), csvQ(r.lesson), csvQ(r.chartUrl)]).join(',') + '\n'));
        App.download('replay_log.csv', '﻿' + csv, 'text/csv');
      });
      return;
    }

    /* ----- 候選 ----- */
    if (tab === 'cands') {
      body.innerHTML = `<div class="tool-foot"><button class="btn primary sm" data-add>＋ 新增候選 Setup</button><button class="btn sm" data-csv>⬇️ 匯出 CSV</button></div>
        ${cs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>日期</th><th>時間</th><th>Symbol</th><th>Setup</th><th>市況</th><th>階段</th><th>結果</th><th>RVOL</th><th>備註</th><th></th></tr></thead><tbody>
        ${cs.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.time)}</td><td>${esc(c.symbol || '')}</td><td>${esc((c.setup || '').split('：')[0])}</td><td>${esc(c.market)}</td><td>${esc(c.stage)}</td><td>${esc(c.outcome)}</td><td>${c.rvol != null ? c.rvol : '—'}</td><td>${esc(c.notes || '')}</td><td class="row-acts"><button data-edit="${c.id}">✏️</button><button data-del="${c.id}">🗑️</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty">未有候選紀錄。每一個符合初步 Breakout 條件嘅機會都應該記錄，包括最後冇入場嘅。</div>'}`;
      body.querySelector('[data-add]').addEventListener('click', () => candForm({}, (o) => save('candidates', o, null, 'cand')));
      body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const c = cs.find((x) => x.id === b.dataset.edit); candForm(c, (o) => save('candidates', o, c)); }));
      body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { if (!confirm('刪除呢個候選紀錄？')) return; const u = U2(); u.candidates = u.candidates.filter((x) => x.id !== b.dataset.del); Store.emit('journal'); render(el, tab); }));
      body.querySelector('[data-csv]').addEventListener('click', () => {
        let csv = 'Date,Time,Symbol,Setup,Market,Stage,Outcome,RVOL,KeyLevel,Notes\n';
        cs.forEach((c) => (csv += [c.date, c.time, c.symbol, csvQ(c.setup), c.market, c.stage, csvQ(c.outcome), c.rvol == null ? '' : c.rvol, csvQ(c.level), csvQ(c.notes)].join(',') + '\n'));
        App.download('candidates.csv', '﻿' + csv, 'text/csv');
      });
      return;
    }

    /* ----- 檢討 ----- */
    if (tab === 'review') {
      const mist = countBy(trades, (t) => t.mistakes);
      const emo = countBy(trades, (t) => t.emotion);
      const items = trades.filter((t) => t.lesson || t.improve || (t.mistakes || []).length).map((t) => ({ d: t.date, kind: '交易', t, txt: t.lesson, imp: t.improve, tags: t.mistakes || [] }))
        .concat(reps.filter((r) => r.lesson).map((r) => ({ d: r.date, kind: 'Replay', r, txt: r.lesson, tags: [r.outcome] })))
        .sort((a, b) => (b.d || '').localeCompare(a.d || ''));
      const emoStats = emo.map(([e]) => { const rs = trades.filter((t) => t.emotion === e).map(calc).filter((c) => c.r != null).map((c) => c.r); const s = rStats(rs); return [e, rs.length, s ? s.exp : null]; });
      body.innerHTML = `${filterBar()}
        <div class="grid-2"><div class="card"><div class="card-h">🔁 我最常犯嘅錯</div>${mist.length ? mist.slice(0, 8).map(([m, n]) => `<div class="fam-row"><b style="min-width:9em">${esc(m)}</b><div class="bar"><div style="width:${n / mist[0][1] * 100}%;background:var(--down)"></div></div><small>${n}</small></div>`).join('') : '<p class="muted">未有標記錯誤。記交易時喺「犯咗邊啲錯」剔返。</p>'}</div>
        <div class="card"><div class="card-h">🧠 情緒 vs 結果</div>${emoStats.length ? `<table class="tbl"><thead><tr><th>情緒</th><th>已平倉</th><th>平均 R</th></tr></thead><tbody>${emoStats.map(([e, n, x]) => `<tr><td>${esc(e)}</td><td>${n}</td><td class="${x >= 0 ? 'pos' : 'neg'}">${x != null ? signR(x) : '—'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">記交易時揀返「當時情緒」，就會見到邊種狀態最容易蝕錢。</p>'}</div></div>
        <h3>📜 教訓時間線</h3>
        ${items.length ? `<div class="lesson-list">${items.map((x) => `<div class="lesson ${x.kind === 'Replay' ? 'rp' : ''}"><small>${esc(x.d)} · ${x.kind}${x.t ? ` · ${esc(x.t.symbol || '')} ${KIND_SHORT[kindOf(x.t)]} ${calc(x.t).r != null ? signR(calc(x.t).r) : ''}` : ''}</small>${x.txt ? `<p>💡 ${esc(x.txt)}</p>` : ''}${x.imp ? `<p>➡️ 下次：${esc(x.imp)}</p>` : ''}<div>${x.tags.filter(Boolean).map((g) => `<span class="chip">${esc(g)}</span>`).join(' ')}</div></div>`).join('')}</div>` : '<div class="empty">未有檢討內容。每筆交易同每日 Replay 寫一句「學到乜」，日後返嚟睇會好有用。</div>'}`;
      bindFilter(body, tab);
      return;
    }

    /* ----- 總覽 ----- */
    const closed = trades.map((t) => ({ t, c: calc(t) })).filter((x) => x.c.r != null);
    const rs = closed.map((x) => x.c.r);
    const st = rStats(rs);
    const comp = trades.length ? trades.filter((t) => t.followed !== 'no').length / trades.length : null;
    const pnlSum = closed.reduce((a, x) => a + x.c.pnl, 0);
    const slips = trades.map((t) => calc(t).slip).filter((x) => x != null);
    const avgSlip = slips.length ? slips.reduce((a, b) => a + b, 0) / slips.length : null;
    const judged = trades.filter((t) => ['correct', 'partial', 'wrong'].includes(t.analysis));
    const acc = judged.length ? (judged.filter((t) => t.analysis === 'correct').length + 0.5 * judged.filter((t) => t.analysis === 'partial').length) / judged.length : null;
    const quad = { q1: 0, q2: 0, q3: 0, q4: 0 };
    closed.forEach(({ c }) => { quad[c.goodProcess ? (c.r > 0 ? 'q1' : 'q2') : (c.r > 0 ? 'q3' : 'q4')]++; });
    const group = (rows) => rows.map(([label, list]) => { const s = rStats(list.map((x) => x.c.r)); return { k: label, s }; }).filter((x) => x.s);
    const bySetup = group(SETUPS.map((s) => [s.split('：')[0], closed.filter((x) => x.t.setup === s)]));
    const byMkt = group(MARKETS.map((m) => [m, closed.filter((x) => x.t.market === m)]));
    const byKind = group(KINDS.map(([k, l]) => [l, closed.filter((x) => kindOf(x.t) === k)]));
    const byPb = group(pbs.map((p) => [`${p.name} v${p.version || '1.0'}`, closed.filter((x) => x.t.playbookId === p.id)]));
    const tbl = (rows) => (!rows.length ? '<p class="muted">—</p>' : `<table class="tbl"><thead><tr><th>類別</th><th>筆數</th><th>勝率</th><th>Expectancy</th><th>總 R</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.k)}</td><td>${r.s.n}</td><td>${pct(r.s.wr, 0)}</td><td class="${r.s.exp >= 0 ? 'pos' : 'neg'}">${signR(r.s.exp)}</td><td>${signR(r.s.total, 1)}</td></tr>`).join('')}</tbody></table>`);
    const funnel = STAGES.map((s, i) => cs.filter((c) => STAGES.indexOf(c.stage) >= i).length);
    body.innerHTML = filterBar() + (!st ? `<div class="empty">未有已平倉交易（呢個篩選之下）。去「交易」新增，或者載入示範交易睇吓效果。</div>` : `
      <div class="stats">
        ${stat('已平倉交易', st.n)}${stat('勝率', pct(st.wr))}${stat('平均贏', signR(st.avgW))}${stat('平均輸', signR(-st.avgL))}
        ${stat('Net Expectancy', signR(st.exp, 3), st.exp >= 0 ? 'pos' : 'neg')}${stat('總 Net R', signR(st.total, 2), st.total >= 0 ? 'pos' : 'neg')}
        ${stat('Net P&L', money(pnlSum), pnlSum >= 0 ? 'pos' : 'neg')}${stat('Profit Factor', isFinite(st.pf) ? F(st.pf) : '∞')}
        ${stat('最大回撤（已實現）', '−' + F(st.mdd) + 'R', 'neg')}${stat('最長連敗', st.maxStreak + ' 筆')}
        ${stat('規則遵守率', comp != null ? pct(comp, 0) : '—', comp >= 0.9 ? 'pos' : 'neg')}${stat('判斷準確度', acc != null ? pct(acc, 0) : '未評估')}
        ${stat('平均入場滑價 / 股', avgSlip != null ? money(avgSlip, 3) : '—')}
      </div>
      ${st.n < 30 ? verdict(null, `樣本只有 ${st.n} 筆。課程建議：20–30 筆睇自己識唔識一致執行；約 100 筆先初步估算表現。`) : ''}
      <h3>🧭 過程 × 結果</h3>
      <div class="pq">
        <div class="pq-cell q1"><b>${quad.q1}</b><span>好過程 + 贏</span><small>應得嘅贏，繼續保持</small></div>
        <div class="pq-cell q3"><b>${quad.q3}</b><span>壞過程 + 贏</span><small>運氣好 —— 最危險，會養成壞習慣</small></div>
        <div class="pq-cell q2"><b>${quad.q2}</b><span>好過程 + 輸</span><small>正常虧損，唔使改規則</small></div>
        <div class="pq-cell q4"><b>${quad.q4}</b><span>壞過程 + 輸</span><small>應得嘅輸，要改執行</small></div>
      </div>
      <p class="tool-fine">「好過程」= 跟足規則而且冇標記錯誤。長遠要提高嘅係左邊兩格嘅比例，唔係單次輸贏。</p>
      <div data-eq></div>
      <div class="grid-2"><div><h4>按類型（真實 vs 模擬）</h4>${tbl(byKind)}</div><div><h4>按 Playbook</h4>${tbl(byPb)}</div><div><h4>按 Setup</h4>${tbl(bySetup)}</div><div><h4>按市場環境</h4>${tbl(byMkt)}</div></div>
      ${cs.length ? `<h4>候選漏斗</h4><figure class="chart funnel">${STAGES.map((s, i) => `<div class="fn-row"><span>${s}</span><div class="fn-bar" style="width:${funnel[0] ? funnel[i] / funnel[0] * 100 : 0}%"><b>${funnel[i]}</b></div></div>`).join('')}</figure>` : ''}
      <p class="tool-fine">Drawdown 係根據逐筆已實現 R 計算，唔係盤中浮動權益嘅完整最大回撤。真實交易同模擬交易建議分開睇（用上面篩選）。</p>`);
    bindFilter(body, tab);
    if (st) Charts.line(body.querySelector('[data-eq]'), { series: [{ data: st.curve, color: 'var(--accent)', dots: st.n < 80 }], labels: st.curve.map((_, i) => i), ref: 0, height: 240, format: (v) => v.toFixed(1) + 'R', title: 'Equity Curve（累積 Net R）' });
  }

  window.Journal = { render, netRs, calc, markBackup };
})();
