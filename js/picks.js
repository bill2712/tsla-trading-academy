/* =========================================================
 * 📋 每日選股：每個交易日開市前由排程任務更新（data/picks/*.json）
 * 你可以喺每隻股票下面記錄：有冇睇、有冇做、結果幾多 R、筆記
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const F = (v, d = 2) => (num(v) == null ? '—' : v.toFixed(d));
  const P = (v, d = 2) => (num(v) == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%');
  const big = (v) => { if (num(v) == null) return '—'; const a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(Math.round(v)); };
  const cls = (v) => (num(v) == null ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : '');
  const safeUrl = (u) => (/^https:\/\//i.test(u || '') ? u : null);
  const STATUS = [['', '未記錄'], ['watch', '👀 有睇'], ['paper', '📄 模擬做咗'], ['real', '💵 真倉做咗'], ['skip', '⏭️ 冇做']];
  const BEGIN = { 適合新手: 'ok', 中等: 'mid', 高風險: 'bad' };

  let indexCache = null, indexTs = 0;
  const dayCache = {};
  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status === 404 ? 'notfound' : 'HTTP ' + r.status);
    return r.json();
  }
  async function loadIndex(force) {
    if (!force && indexCache && Date.now() - indexTs < 60000) return indexCache;
    indexCache = await getJSON('data/picks/index.json'); indexTs = Date.now();
    return indexCache;
  }
  async function loadDay(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('notfound');
    if (!dayCache[date]) dayCache[date] = await getJSON('data/picks/' + date + '.json');
    return dayCache[date];
  }

  /* ---------- 個人紀錄（toolState.picksLog，會同步到雲端） ---------- */
  const logOf = (uid) => { const u = Store.user(uid); return (u && u.toolState && u.toolState.picksLog) || {}; };
  function setLog(date, sym, patch) {
    const u = Store.user();
    u.toolState.picksLog = u.toolState.picksLog || {};
    const d = (u.toolState.picksLog[date] = u.toolState.picksLog[date] || {});
    d[sym] = Object.assign({}, d[sym], patch, { ts: Date.now() });
    if (!d[sym].status && d[sym].r == null && !d[sym].note) delete d[sym];
    if (!Object.keys(d).length) delete u.toolState.picksLog[date];
    Store.save();
  }
  function myStats() {
    const L = logOf(); let days = 0, traded = 0, rs = [];
    Object.values(L).forEach((d) => { days++; Object.values(d).forEach((x) => { if (x.status === 'paper' || x.status === 'real') { traded++; if (num(x.r) != null) rs.push(x.r); } }); });
    const tot = rs.reduce((a, b) => a + b, 0);
    return { days, traded, n: rs.length, exp: rs.length ? tot / rs.length : null, total: tot, wr: rs.length ? rs.filter((r) => r > 0).length / rs.length : null };
  }

  /* ---------- HTML 片段 ---------- */
  const newsHTML = (list) => (list || []).map((n) => { const u = safeUrl(n.url); return `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n.title)}</a>` : esc(n.title)}<small>${[n.source, n.time, (n.tickers || []).join(' ')].filter(Boolean).map(esc).join(' · ')}</small></li>`; }).join('');
  const lvl = (label, v) => (num(v) == null ? '' : `<span class="pk-lv"><em>${label}</em>$${F(v)}</span>`);

  function pickHTML(p, date, i) {
    const lg = logOf()[date] && logOf()[date][p.sym] || {};
    const L = p.levels || {};
    const me = Store.activeProfile ? Store.activeProfile() : null;
    const fam = (Store.profiles() || []).filter((f) => !me || f.id !== me.id).map((f) => { const x = (logOf(f.id)[date] || {})[p.sym]; return x && x.status ? `<span class="pk-fam" style="--c:${esc(f.color)}">${esc(f.emoji)} ${esc(f.name)}：${esc((STATUS.find((s) => s[0] === x.status) || [])[1] || '')}${num(x.r) != null ? ' ' + (x.r > 0 ? '+' : '') + x.r + 'R' : ''}</span>` : ''; }).join('');
    const plan = p.plan || {};
    return `<article class="pk-card" data-sym="${esc(p.sym)}">
      <header class="pk-head">
        <div class="pk-rank">${i + 1}</div>
        <div class="pk-title"><b>${esc(p.sym)}</b><span>${esc(p.name || '')}</span></div>
        <div class="pk-tags">${p.grade ? `<span class="pk-grade g-${esc(p.grade)}">${esc(p.grade)} 級</span>` : ''}${p.beginner ? `<span class="pk-beg ${BEGIN[p.beginner] || 'mid'}">${esc(p.beginner)}</span>` : ''}${p.direction ? `<span class="pk-dir">${esc(p.direction)}</span>` : ''}</div>
      </header>
      <div class="pk-nums">
        <div><span>盤前價</span><b>$${F(p.price)}</b></div>
        <div><span>跳空</span><b class="${cls(p.gapPct)}">${P(p.gapPct)}</b></div>
        <div><span>盤前成交</span><b>${big(p.pmVolume)}</b></div>
        <div><span>平均成交</span><b>${big(p.avgVolume)}</b></div>
        <div><span>盤前量佔日均</span><b>${num(p.pmVolPct) == null ? '—' : F(p.pmVolPct, 1) + '%'}</b></div>
        ${num(p.rvol) != null ? `<div><span>RVOL</span><b>${F(p.rvol, 1)}×</b></div>` : ''}
        <div><span>買賣差價</span><b>${num(p.spread) == null ? '—' : '$' + F(p.spread)}</b></div>
        <div><span>ATR</span><b>${num(p.atr) == null ? '—' : '$' + F(p.atr)}</b></div>
        <div><span>市值</span><b>${num(p.mktCapB) == null ? '—' : F(p.mktCapB, 1) + 'B'}</b></div>
        <div><span>流通股</span><b>${num(p.floatM) == null ? '—' : big(p.floatM * 1e6)}</b></div>
      </div>
      <div class="pk-levels">${lvl('PMH', L.pmh)}${lvl('PML', L.pml)}${lvl('PDH', L.pdh)}${lvl('PDL', L.pdl)}${lvl('昨收', L.pdc)}${(L.other || []).map((o) => lvl(esc(o.label), o.price)).join('')}</div>
      ${p.why ? `<p class="pk-why"><b>點解適合今日 Day Trade：</b>${esc(p.why)}</p>` : ''}
      ${p.catalyst ? `<p><b>📰 催化劑：</b>${esc(p.catalyst)}</p>` : ''}
      ${p.technical ? `<p><b>📈 技術面：</b>${esc(p.technical)}</p>` : ''}
      ${p.setup ? `<p><b>🎯 Setup：</b>${esc(p.setup)}</p>` : ''}
      ${plan.long || plan.short || plan.noTrade ? `<div class="pk-plan">${plan.long ? `<div class="up"><b>如果向上</b>${esc(plan.long)}</div>` : ''}${plan.short ? `<div class="down"><b>如果向下</b>${esc(plan.short)}</div>` : ''}${plan.noTrade ? `<div class="no"><b>唔做嘅情況</b>${esc(plan.noTrade)}</div>` : ''}</div>` : ''}
      ${(p.risks || []).length ? `<p class="pk-risk"><b>⚠️ 風險：</b>${p.risks.map(esc).join('；')}</p>` : ''}
      ${(p.news || []).length ? `<details class="pk-news"><summary>相關新聞（${p.news.length}）</summary><ul class="pk-newslist">${newsHTML(p.news)}</ul></details>` : ''}
      <div class="pk-log">
        <select data-st aria-label="${esc(p.sym)} 紀錄狀態">${STATUS.map(([v, t]) => `<option value="${v}" ${lg.status === v || (!lg.status && !v) ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <input data-r type="number" step="0.1" placeholder="結果（R）" value="${num(lg.r) == null ? '' : lg.r}" aria-label="${esc(p.sym)} 結果 R">
        <input data-note type="text" placeholder="筆記：有冇跟計劃？學到乜？" value="${esc(lg.note || '')}" aria-label="${esc(p.sym)} 筆記">
      </div>
      ${fam ? `<div class="pk-fams">${fam}</div>` : ''}
    </article>`;
  }

  function reviewHTML(rv) {
    if (!rv || !(rv.items || []).length) return '';
    return `<section class="card pk-review"><div class="card-h">🔁 收市後回顧 <small>${esc(rv.writtenAt ? '寫於 ' + rv.writtenAt.slice(0, 16).replace('T', ' ') + ' UTC' : '')}</small></div>
      ${rv.summary ? `<p>${esc(rv.summary)}</p>` : ''}
      <div class="tbl-scroll"><table class="mini-tbl wide"><tr><th>股票</th><th>開市</th><th>最高</th><th>最低</th><th>收市</th><th>開市後變化</th><th>升穿 PMH</th><th>評語</th></tr>
      ${rv.items.map((x) => `<tr><th>${esc(x.sym)}</th><td>$${F(x.open)}</td><td>$${F(x.high)}</td><td>$${F(x.low)}</td><td>$${F(x.close)}</td><td class="${cls(x.chgFromOpenPct)}">${P(x.chgFromOpenPct)}</td><td>${x.hitPmh === true ? '✅' : x.hitPmh === false ? '❌' : '—'}</td><td>${esc(x.verdict || '')}${x.note ? `<br><small>${esc(x.note)}</small>` : ''}</td></tr>`).join('')}</table></div>
      <p class="tool-fine">回顧只係睇返價格點樣走，唔代表按計劃一定會成交或者賺到錢。</p></section>`;
  }

  function dayHTML(d, idx) {
    const m = d.market || {};
    const st = myStats();
    const days = (idx && idx.days) || [];
    return `<div class="page-head"><h1>📋 每日選股</h1><p class="muted">每個美股交易日開市前約一小時（美東 08:30）自動更新：大市、新聞、數據同 Day Trade 候選股。全部係教學參考，<b>唔係投資建議</b>，入場前一定要自己再睇圖、計風險。</p></div>
      <div class="pk-days" role="tablist" aria-label="日期">${days.slice(0, 30).map((x) => `<a href="#/picks/${esc(x.date)}" class="pk-day ${x.date === d.date ? 'on' : ''}"><b>${esc(x.date.slice(5))}</b><small>${esc(x.bias || '')}${x.reviewed ? ' · 已回顧' : ''}</small></a>`).join('')}</div>
      <section class="pk-hero card">
        <div><div class="pk-date">${esc(d.date)}（美東）${d.status === 'test' ? '<span class="pk-beg mid">測試版</span>' : ''}</div>
          <div class="pk-bias">大市傾向：<b>${esc(m.bias || '—')}</b></div>
          <p>${esc(m.summary || '')}</p>
          <small class="muted">更新時間：${esc((d.generatedAt || '').slice(0, 16).replace('T', ' '))} UTC・數據：${esc((d.dataSources || []).join('、'))}${d.dataQuality === 'partial' ? '・⚠️ 部分數據未能取得' : ''}</small></div>
        <div class="pk-mystats"><span>我嘅紀錄</span><b>${st.traded} 筆</b><small>${st.n ? `平均 ${(st.exp >= 0 ? '+' : '') + st.exp.toFixed(2)}R・勝率 ${Math.round(st.wr * 100)}%` : '記錄咗結果先有統計'}</small></div>
      </section>
      ${(m.indices || []).length ? `<section class="card"><div class="card-h">🌐 指數、期貨同市場數據</div><div class="pk-idx">${m.indices.map((x) => `<div><span>${esc(x.sym)}</span><b>${num(x.last) == null ? '—' : F(x.last)}</b><em class="${cls(x.chgPct)}">${P(x.chgPct)}</em>${x.note ? `<small>${esc(x.note)}</small>` : ''}</div>`).join('')}</div></section>` : ''}
      ${(m.events || []).length || (m.earnings || []).length ? `<section class="card"><div class="card-h">🗓️ 今日事件</div>
        ${(m.events || []).length ? `<ul class="pk-ev">${m.events.map((e) => `<li><b>${esc(e.time || '')}</b> ${esc(e.name)} ${e.impact ? `<span class="pk-beg ${e.impact === '高' ? 'bad' : 'mid'}">${esc(e.impact)}影響</span>` : ''}${e.note ? `<small>${esc(e.note)}</small>` : ''}</li>`).join('')}</ul>` : ''}
        ${(m.earnings || []).length ? `<p><b>業績：</b>${m.earnings.map((e) => `${esc(e.sym)}（${esc(e.when || '')}${e.note ? '，' + esc(e.note) : ''}）`).join('、')}</p>` : ''}</section>` : ''}
      ${d.focus ? `<section class="card pk-focus"><div class="card-h">⚡ TSLA 今日狀態</div><p>${esc(d.focus)}</p></section>` : ''}
      <h2 class="sec-h">🎯 今日候選股（${(d.picks || []).length}）</h2>
      <div class="pk-list">${(d.picks || []).map((p, i) => pickHTML(p, d.date, i)).join('') || '<div class="empty">今日冇符合條件嘅候選股 —— 冇好機會就唔做，都係一個決定。</div>'}</div>
      ${(d.watch || []).length ? `<section class="card"><div class="card-h">👀 次選／觀察名單</div><ul class="pk-simple">${d.watch.map((x) => `<li><b>${esc(x.sym)}</b> ${esc(x.why)}</li>`).join('')}</ul></section>` : ''}
      ${(d.avoid || []).length ? `<section class="card"><div class="card-h">🚫 今日避開</div><ul class="pk-simple">${d.avoid.map((x) => `<li><b>${esc(x.sym)}</b> ${esc(x.why)}</li>`).join('')}</ul></section>` : ''}
      ${(d.news || []).length ? `<section class="card"><div class="card-h">📰 今日重要新聞</div><ul class="pk-newslist">${newsHTML(d.news)}</ul></section>` : ''}
      ${d.lesson ? `<section class="card tip-card"><div class="card-h">💡 新手提示</div><p>${esc(d.lesson)}</p></section>` : ''}
      ${reviewHTML(d.review)}
      <details class="card pk-method"><summary><b>🔍 選股方法（點樣揀出嚟）</b></summary>
        <ol><li><b>流動性先：</b>股價 $5 以上、平均每日成交 200 萬股以上；新手級要市值 10 億美元以上、買賣差價細。</li>
        <li><b>今日有人玩（In Play）：</b>盤前跳空明顯（大型股 ±2% 以上、中小型股 ±4% 以上），而且盤前成交量高過平時。</li>
        <li><b>有催化劑：</b>業績、指引、評級升降、合約、行業消息、宏觀數據。冇新聞嘅急升急跌較易假突破。</li>
        <li><b>清楚嘅價位：</b>盤前高低位（PMH／PML）、昨日高低位（PDH／PDL）、昨收，同日線趨勢（20／50 日線）。</li>
        <li><b>波幅夠但唔過份：</b>ATR 足夠做到 2R，但唔係每分鐘亂跳。</li>
        <li><b>睇大市：</b>指數期貨、VIX、相關板塊、今日經濟數據時間。大市逆風就減少交易。</li></ol>
        <p class="tool-fine">數據來源：IBKR 實時報價同 Screener（只讀）、網上新聞搜尋。由 AI 排程任務整理，可能有錯漏；所有數字開市前都要自己喺 TradingView／券商再確認。</p></details>
      <p class="disclaimer">${esc(d.disclaimer || '教學用途，唔係投資建議。Day Trade 風險極高，可能損失全部本金。')}</p>`;
  }

  function bind(view, d) {
    $$('.pk-card', view).forEach((card) => {
      const sym = card.dataset.sym;
      $('[data-st]', card).addEventListener('change', (e) => { setLog(d.date, sym, { status: e.target.value }); App.toast('已記錄 ' + sym); });
      $('[data-r]', card).addEventListener('change', (e) => { const v = e.target.value.trim() === '' ? null : parseFloat(e.target.value); if (v != null && !isFinite(v)) return; setLog(d.date, sym, { r: v }); App.toast('已記錄結果'); });
      $('[data-note]', card).addEventListener('change', (e) => { setLog(d.date, sym, { note: e.target.value.slice(0, 500) }); App.toast('已儲存筆記'); });
    });
  }

  async function render(view, date) {
    view.innerHTML = '<div class="page-head"><h1>📋 每日選股</h1><p class="muted">載入緊…</p></div>';
    let idx = null;
    try { idx = await loadIndex(true); } catch (e) {
      view.innerHTML = `<div class="page-head"><h1>📋 每日選股</h1></div><div class="empty">${e.message === 'notfound' ? '未有選股紀錄。第一份會喺下一個美股交易日開市前約一小時出現。' : '載入失敗（' + esc(e.message) + '），檢查網絡再試。'}</div>`;
      return;
    }
    const days = idx.days || [];
    const target = date || (days[0] && days[0].date);
    if (!target) { view.innerHTML = '<div class="page-head"><h1>📋 每日選股</h1></div><div class="empty">未有選股紀錄。</div>'; return; }
    try {
      const d = await loadDay(target);
      if (location.hash.split('/')[1] !== 'picks') return; // 已經轉咗頁
      view.innerHTML = dayHTML(d, idx);
      bind(view, d);
    } catch (e) {
      view.innerHTML = `<div class="page-head"><h1>📋 每日選股</h1></div><div class="empty">搵唔到 ${esc(target)} 嘅選股。<a href="#/picks">睇最新</a></div>`;
    }
  }

  /* 主頁卡片：最新一日嘅頭三隻 */
  function homeCard(el) {
    loadIndex().then((idx) => {
      const d0 = (idx.days || [])[0];
      if (!d0 || !el.isConnected) return;
      el.hidden = false;
      el.innerHTML = `<div class="card-h">📋 每日選股 <small>${esc(d0.date)}・${esc(d0.bias || '')}</small><a href="#/picks">全部 →</a></div>
        ${d0.headline ? `<p class="muted">${esc(d0.headline)}</p>` : ''}
        <div class="quick-tools">${(d0.top || []).slice(0, 4).map((t) => `<a href="#/picks/${esc(d0.date)}"><span>🎯</span><b>${esc(t.sym || t)}</b>${t.gapPct != null ? `&nbsp;<small class="${cls(t.gapPct)}">${P(t.gapPct)}</small>` : ''}${t.beginner ? `&nbsp;<small>${esc(t.beginner)}</small>` : ''}</a>`).join('')}</div>`;
    }).catch(() => {});
  }

  window.Picks = { render, homeCard, loadIndex, loadDay, myStats };
})();
