/* =========================================================
 * 📊「我有冇 Edge？」報告卡 ＋ 🧪 研究板（預先登記假設）
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const F = (n, d = 2) => (n == null || !isFinite(n) ? '—' : Number(n).toFixed(d));
  const R = (n, d = 2) => (n == null || !isFinite(n) ? '—' : (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) + 'R');
  const P = (n, d = 0) => (n == null || !isFinite(n) ? '—' : (n * 100).toFixed(d) + '%');
  const stat = (label, value, cls) => `<div class="stat ${cls || ''}"><span>${label}</span><b>${value}</b></div>`;
  const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? '啱啱' : m < 60 ? m + ' 分鐘前' : m < 1440 ? Math.round(m / 60) + ' 小時前' : Math.round(m / 1440) + ' 日前'; };

  /* ---------------- Edge 報告卡 ---------------- */
  const LADDER = [
    ['📚', '學習中', '未夠 20 筆紀錄'],
    ['🔬', '收集樣本', '有紀錄，但未有統計證據'],
    ['⚠️', '冇證據 / 負期望值', '而家嘅方法唔應該用真錢'],
    ['🧪', '初步證據', '期望值可信範圍大過 0：繼續 Paper／前瞻測試'],
    ['🌱', '可以考慮 Micro 真倉', '證據 + 遵守率 + 樣本外都達標'],
  ];
  function edgeLevel(st, adh, oos) {
    if (!st.n || st.n < 20) return 0;
    if (st.exp <= 0 || (oos && oos.n >= 10 && oos.exp <= 0)) return 2;
    if (st.ciLo <= 0) return 1;
    if (st.n >= 50 && adh >= 0.9 && (!oos || oos.n < 10 || oos.exp > 0)) return 4;
    return 3;
  }
  function renderEdge(view) {
    const ui = Store.ui().edge || { who: Store.db.active, kind: 'all', src: 'journal' };
    const ps = Store.profiles();
    if (!ps.some((p) => p.id === ui.who)) ui.who = Store.db.active;
    const u = Store.user(ui.who);
    let rs = [], adh = null, costR = null, mistakes = null, label = '', oos = null, extra = '';
    if (ui.src === 'lab') {
      const L = (Store.user().toolState || {}).labLast;
      if (L) { rs = L.rs || []; label = '最近一次回測：' + L.desc; oos = L.oos; extra = `<p class="tool-fine">回測假設 100% 跟規則；真實交易仲要加埋執行誤差。</p>`; }
    } else {
      const ts = (u.journal || []).filter((t) => ui.kind === 'all' || (t.kind || 'live') === ui.kind).map((t) => ({ t, c: Journal.calc(t) })).filter((x) => x.c.r != null).sort((a, b) => ((a.t.date || '') + (a.t.time || '')).localeCompare((b.t.date || '') + (b.t.time || '')));
      rs = ts.map((x) => x.c.r);
      if (ts.length) {
        adh = ts.filter((x) => x.c.goodProcess).length / ts.length;
        mistakes = ts.filter((x) => !x.c.goodProcess).reduce((a, x) => a + x.c.r, 0);
        const fees = ts.filter((x) => x.t.fees && x.c.initRisk > 0).map((x) => x.t.fees / x.c.initRisk);
        costR = fees.length ? fees.reduce((a, b) => a + b, 0) / fees.length : null;
        const cut = Math.floor(ts.length * 0.7); oos = Lab.stats(rs.slice(cut));
      }
      label = `${(ps.find((p) => p.id === ui.who) || {}).name || ''} 嘅交易日誌（${{ all: '全部', replay: 'Replay', paper: 'Paper', live: '真實' }[ui.kind]}）`;
    }
    const st = Lab.stats(rs);
    const lvl = edgeLevel(st, adh == null ? 1 : adh, oos);
    const breakEvenWR = st.avgW > 0 ? st.avgL / (st.avgW + st.avgL) : null;
    let roll = [];
    if (rs.length >= 20) for (let i = 20; i <= rs.length; i++) roll.push(+(rs.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20).toFixed(3));
    view.innerHTML = `<div class="page-head"><h1>📊 我有冇 Edge？</h1><p class="muted">用統計老實咁答：你嘅方法計埋成本之後，係咪真係有優勢？定只係好彩／唔好彩？</p>
      <div class="tool-foot edge-ctl">
        <select data-src aria-label="資料來源"><option value="journal">來源：交易日誌</option><option value="lab">來源：最近一次回測</option></select>
        ${ui.src === 'journal' ? `<select data-who aria-label="邊個嘅紀錄">${ps.map((p) => `<option value="${p.id}" ${p.id === ui.who ? 'selected' : ''}>${esc(p.emoji + ' ' + p.name)}</option>`).join('')}</select>
        <select data-kind aria-label="交易類型">${[['all', '全部類型'], ['replay', 'Replay'], ['paper', 'Paper'], ['live', '真實']].map(([k, t]) => `<option value="${k}" ${ui.kind === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}
      </div></div>
      <div class="card"><p class="muted">${esc(label)}</p>
        <div class="edge-ladder">${LADDER.map((x, i) => `<div class="el ${i === lvl ? 'on' : ''} ${i === 2 ? 'warn' : ''}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div>
        ${st.n ? `<div class="stats">
          ${stat('樣本數', st.n)}${stat('勝率', P(st.wr))}${stat('平均贏', R(st.avgW))}${stat('平均輸', '−' + F(st.avgL) + 'R')}
          ${stat('期望值（每筆）', R(st.exp), st.exp >= 0 ? 'pos' : 'neg')}${stat('95% 可信範圍', R(st.ciLo) + ' ~ ' + R(st.ciHi))}${stat('期望值 > 0 機率', P(st.pPos), st.pPos >= 0.9 ? 'pos' : st.pPos < 0.6 ? 'neg' : '')}
          ${stat('打和勝率', P(breakEvenWR))}${stat('最大回撤', F(st.mdd, 1) + 'R')}${stat('最長連輸', st.mst + ' 筆')}
          ${adh != null ? stat('遵守率', P(adh), adh >= 0.9 ? 'pos' : 'neg') : ''}${mistakes != null ? stat('違規交易合共', R(mistakes, 1), mistakes < 0 ? 'neg' : '') : ''}${costR != null ? stat('平均成本', F(costR) + 'R／筆') : ''}
          ${oos && oos.n ? stat('後 30%（樣本外）', R(oos.exp) + `（${oos.n} 筆）`, oos.exp >= 0 ? 'pos' : 'neg') : ''}
        </div>` : '<div class="empty">未有已平倉交易。去 <a href="#/journal/trades">交易日誌</a> 記錄，或者用 <a href="#/lab">回測實驗室</a> 試吓。</div>'}
        ${st.n ? `<div class="verdict ${lvl >= 3 ? 'ok' : lvl === 2 ? 'bad' : 'mid'}">${esc(explain(st, lvl, adh, mistakes, oos))}</div>` : ''}
        ${extra}<div data-roll></div></div>
      <div class="card"><div class="card-h">📖 點樣睇</div><ul class="tool-list">
        <li><b>95% 可信範圍</b>：如果下限都大過 0，先算有統計證據。範圍好闊代表樣本未夠。</li>
        <li><b>期望值 > 0 機率</b>：將你嘅交易重新抽樣 1,000 次，有幾多次總結果係正數。</li>
        <li><b>打和勝率</b>：按你平均贏輸，勝率要高過呢個數先唔蝕錢。</li>
        <li><b>違規交易合共</b>：冇跟規則嘅交易加埋嘅結果；如果係負數，最快嘅改善係跟規則，唔係搵新策略。</li>
        <li><b>後 30%</b>：只睇最近嘅交易。如果前面好、後面差，可能係市場變咗或者執行變差。</li></ul></div>`;
    const save = (patch) => { Store.setUI({ edge: Object.assign({}, ui, patch) }); renderEdge(view); };
    $('[data-src]', view).value = ui.src;
    $('[data-src]', view).addEventListener('change', (e) => save({ src: e.target.value }));
    const w = $('[data-who]', view); if (w) w.addEventListener('change', (e) => save({ who: e.target.value }));
    const k = $('[data-kind]', view); if (k) k.addEventListener('change', (e) => save({ kind: e.target.value }));
    if (roll.length > 1) Charts.line($('[data-roll]', view), { series: [{ name: '最近 20 筆期望值', data: roll, color: 'var(--accent)', dots: roll.length < 60 }, { name: '0', data: roll.map(() => 0), color: 'var(--muted)' }], labels: roll.map((_, i) => String(i + 20)), height: 200, format: (x) => (x >= 0 ? '+' : '') + x.toFixed(2) + 'R', title: '滾動期望值（最近 20 筆）', caption: '一路向下：Edge 可能衰退緊，或者執行變差。' });
  }
  function explain(st, lvl, adh, mistakes, oos) {
    const parts = [];
    if (lvl === 0) parts.push(`得 ${st.n} 筆，太少，結果主要係運氣。先累積到最少 30–50 筆。`);
    if (lvl === 1) parts.push(`期望值 ${R(st.exp)}，但可信範圍包括 0，未分得出係實力定運氣。${st.need ? `按而家嘅波動，大約要 ${st.need} 筆先夠證據。` : ''}`);
    if (lvl === 2) parts.push(st.exp <= 0 ? `計埋成本期望值 ${R(st.exp)} ≤ 0：呢個方法而家冇優勢，唔應該用真錢。` : `全期好似有優勢，但最近（樣本外）期望值 ${R(oos.exp)} ≤ 0，要小心。`);
    if (lvl === 3) parts.push(`有初步證據（期望值 ${R(st.exp)}，下限 ${R(st.ciLo)}）。繼續用同一套規則 Paper／前瞻測試，唔好改規則。`);
    if (lvl === 4) parts.push(`證據、遵守率同最近表現都達標。可以考慮 Micro 真倉（正常風險嘅 1/10），按升級階梯慢慢加。`);
    if (adh != null && adh < 0.9) parts.push(`遵守率 ${P(adh)} 低過 90%：而家嘅結果唔代表你嘅策略，代表你嘅執行。`);
    if (mistakes != null && mistakes < -1) parts.push(`違規交易合共 ${R(mistakes, 1)}：跟足規則係最快嘅改善。`);
    return parts.join(' ');
  }

  /* ---------------- 研究板 ---------------- */
  function cardHTML(r, full) {
    const last = (r.results || [])[r.results.length - 1];
    const status = r.status === 'tested' ? '<span class="rs-st tested">已測試</span>' : '<span class="rs-st">已登記・未測試</span>';
    const nC = Store.comments().filter((c) => c.chapter === '_research:' + r.id).length;
    return `<div class="card rs-card"><div class="rs-head"><span class="av sm" style="--c:${r.color}">${r.emoji}</span><div><a href="#/research/${r.id}"><b>${esc(r.title)}</b></a><small class="muted"> ${esc(r.name)} · ${ago(r.ts)}</small></div>${status}</div>
      ${full ? `${r.why ? `<p><b>理由：</b>${esc(r.why)}</p>` : ''}${r.success ? `<p><b>成功標準（事前寫低）：</b>${esc(r.success)}</p>` : ''}` : ''}
      <p class="tool-fine">🔒 ${esc(r.desc || '')}（代碼 ${esc(r.hash || '')}）</p>
      ${last ? `<div class="rs-res"><span>全期 <b class="${last.all.exp >= 0 ? 'pos' : 'neg'}">${R(last.all.exp)}</b>（${last.all.n} 筆）</span><span>樣本外 <b class="${(last.oos.exp || 0) >= 0 ? 'pos' : 'neg'}">${last.oos.n ? R(last.oos.exp) : '—'}</b>（${last.oos.n || 0} 筆）</span><span>可信範圍 ${R(last.all.ciLo)} ~ ${R(last.all.ciHi)}</span></div>` : ''}
      ${full ? '' : `<div class="tool-foot"><a class="btn sm" href="#/research/${r.id}">詳情・討論（${nC}）</a></div>`}</div>`;
  }
  function renderResearch(view, id) {
    const list = Store.research().slice().sort((a, b) => b.ts - a.ts);
    if (id) {
      const r = list.find((x) => x.id === id);
      if (!r) { view.innerHTML = '<div class="empty">搵唔到呢個研究。<a href="#/research">返研究板</a></div>'; return; }
      const mine = r.author === Store.db.active;
      const all = Store.comments(), cms = all.filter((c) => c.chapter === '_research:' + r.id && !c.parent).sort((a, b) => a.ts - b.ts);
      view.innerHTML = `<nav class="crumbs"><a href="#/research">研究板</a> › ${esc(r.title)}</nav>
        ${cardHTML(r, true)}
        <div class="tool-foot"><a class="btn primary" href="#/lab/r/${r.id}">🔬 用鎖定設定去回測</a>${mine ? '<button class="btn ghost danger" data-del>刪除</button>' : ''}</div>
        <h2 class="sec-h">結果紀錄</h2>
        ${(r.results || []).length ? `<div class="tbl-scroll"><table class="mini-tbl wide"><tr><th>時間</th><th>由</th><th>交易日</th><th>全期</th><th>前段</th><th>樣本外</th><th>95% 範圍</th></tr>${r.results.map((x) => `<tr><td>${new Date(x.at).toLocaleString('zh-HK')}</td><td>${esc(x.by)}</td><td>${x.sessions}</td><td class="${x.all.exp >= 0 ? 'pos' : 'neg'}">${x.all.n ? R(x.all.exp) + '（' + x.all.n + '）' : '—'}</td><td>${x.is.n ? R(x.is.exp) + '（' + x.is.n + '）' : '—'}</td><td class="${(x.oos.exp || 0) >= 0 ? 'pos' : 'neg'}">${x.oos.n ? R(x.oos.exp) + '（' + x.oos.n + '）' : '—'}</td><td>${x.all.n ? R(x.all.ciLo) + ' ~ ' + R(x.all.ciHi) : '—'}</td></tr>`).join('')}</table></div><div class="verdict mid">${esc(r.results[r.results.length - 1].verdict || '')}</div>` : '<p class="muted">未有結果。撳「用鎖定設定去回測」，跑完撳「附加結果」。</p>'}
        <h2 class="sec-h">💬 討論・同行評審</h2>
        <p class="muted">可以講吓：規則有冇偷睇未來？樣本夠唔夠？你喺其他股票／時間段重現到嗎？</p>
        <div class="cm-list" data-cms>${cms.map((c) => App.commentHTML ? App.commentHTML(c, all, false) : esc(c.text)).join('') || '<p class="muted">未有討論。</p>'}</div>
        <textarea rows="3" class="note-ta" data-cm placeholder="寫低你嘅意見…"></textarea><div class="tool-foot"><button class="btn primary" data-send>發佈</button></div>`;
      $('[data-send]', view).addEventListener('click', () => { const t = $('[data-cm]', view).value.trim(); if (!t) return; Store.addComment({ chapter: '_research:' + r.id, text: t }); renderResearch(view, id); });
      if (App.bindComments) App.bindComments(view, () => renderResearch(view, id));
      const d = $('[data-del]', view); if (d) d.addEventListener('click', () => { if (confirm('刪除呢個研究（連結果）？')) { Store.removeResearch(r.id); location.hash = '#/research'; } });
      return;
    }
    view.innerHTML = `<div class="page-head"><h1>🧪 研究板</h1><p class="muted">每人提出假設 → <b>測試之前先登記並鎖定規則</b> → 用真實數據回測 → 附加結果 → 大家評審。比較嘅係研究質素同證據，唔係邊個賺得多。</p>
      <div class="tool-foot"><a class="btn primary" href="#/lab">＋ 去實驗室設定並登記新假設</a></div></div>
      ${list.length ? list.map((r) => cardHTML(r, false)).join('') : '<div class="empty">未有研究。例子：「TSLA 昨日高位突破回測，只順 20 日線方向，會唔會好過唔篩選？」去實驗室設定好規則，撳「📌 登記成研究假設」。</div>'}
      <div class="card"><div class="card-h">✅ 好研究嘅 5 個條件</div><ol class="tool-list"><li>測試之前寫低規則同成功標準（呢度會自動鎖定）。</li><li>樣本最少 50 筆；少過 30 筆唔好下結論。</li><li>計埋滑價同佣金。</li><li>樣本外（後 30%）都要 work。</li><li>其他人用同一設定可以重現。</li></ol></div>`;
  }

  window.Edge = { renderEdge, renderResearch };
})();
