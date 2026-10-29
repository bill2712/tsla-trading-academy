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
  // 盤前揀股 8 大指標嘅預設門檻（同 scripts/picks/lib.mjs RULES 一樣；報告可以用 rules 覆蓋）
  const RULES = { gapAbs: 3, rvol: 2, pmVolume: 200000, pmVolumeEarly: 100000, floatM: 30, atrPct: 2, spreadPct: 0.1, avgVolume: 1000000, priceMin: 10, priceMax: 150 };
  const VERDICT = { pick: ['🎯', 'Pick 候選', 'ok'], watch: ['👀', 'Watch 觀察', 'mid'], avoid: ['🚫', 'Avoid 避開', 'bad'], skip: ['・', 'Skip 唔合', ''] };
  /* 每個指標：值、門檻文字、合唔合（true/false/null） */
  function checks(x, R, early) {
    const side = x.side === 'Short' ? -1 : x.side === 'Long' ? 1 : num(x.gapPct) == null ? 0 : x.gapPct >= 0 ? 1 : -1;
    const pmMin = early ? R.pmVolumeEarly : R.pmVolume;
    const has = (v) => num(v) != null;
    const cat = x.catalyst != null ? !!String(x.catalyst).trim() : null;
    // [key, English name, 中文, 值, 門檻, 合唔合]
    return [
      ['gap', 'Gap %', '盤前漲跌幅', P(x.gapPct, 1), `|Gap| ≥ ${R.gapAbs}%`, has(x.gapPct) ? Math.abs(x.gapPct) >= R.gapAbs : null],
      ['rvol', 'RVOL', '相對成交量（同時段）', has(x.rvol) ? (x.rvol > 999 ? '999+×' : F(x.rvol, 1) + '×') : '—', `≥ ${R.rvol}×（must）`, has(x.rvol) ? x.rvol >= R.rvol : null],
      ['pmv', 'Pre-Market Volume', '盤前成交量', big(x.pmVolume), `≥ ${big(pmMin)}`, has(x.pmVolume) ? x.pmVolume >= pmMin : null],
      ['cat', 'Catalyst', '消息催化劑', cat == null ? '—' : cat ? 'Yes' : 'No', 'news / earnings', cat],
      ['float', 'Float', '流通股數', has(x.floatM) ? big(x.floatM * 1e6) : '—', `≥ ${R.floatM}M`, has(x.floatM) ? x.floatM >= R.floatM : null],
      ['atr', 'ATR %', '波幅', has(x.atrPct) ? F(x.atrPct, 1) + '%' : '—', `≥ ${R.atrPct}%`, has(x.atrPct) ? x.atrPct >= R.atrPct : null],
      ['spr', 'Bid-Ask Spread', '買賣差價', has(x.spreadPct) ? F(x.spreadPct, 2) + '%' : '—', `≤ ${R.spreadPct}%`, has(x.spreadPct) ? x.spreadPct <= R.spreadPct : null],
      ['rs', 'Relative Strength', '相對大市強弱（vs QQQ）', has(x.rsQqq) ? P(x.rsQqq, 1) : '—', side < 0 ? 'weaker than QQQ' : 'stronger than QQQ', has(x.rsQqq) && side ? x.rsQqq * side > 0 : null],
      ['ema', 'EMA 9', '5 分鐘 9 EMA（包盤前）', has(x.ema9Pct) ? P(x.ema9Pct, 2) : '—', side < 0 ? 'price below EMA 9' : 'price above EMA 9', has(x.ema9Pct) && side ? x.ema9Pct * side > 0 : null]
    ];
  }
  const mk = (ok) => (ok === true ? 'ok' : ok === false ? 'bad' : 'na');
  function indicatorsHTML(p, R, early) {
    if (![p.atrPct, p.rsQqq, p.spreadPct, p.ema9Pct].some((v) => num(v) != null)) return '';
    const c = checks(Object.assign({ side: p.trade && p.trade.side }, p), R, early);
    const n = c.filter((x) => x[5] === true).length, k = c.filter((x) => x[5] != null).length;
    return `<div class="pk-ind" aria-label="Pre-Market Indicators"><div class="pk-ind-h"><b>Pre-Market Indicators</b><span>${n} / ${k} pass</span></div><div class="pk-ind-g">${c.map(([, t, zh, v, th, ok]) => `<div class="${mk(ok)}" title="${esc(zh)}"><span>${t}<em>${esc(zh)}</em></span><b>${esc(v)}</b><small>${ok === true ? '✅' : ok === false ? '❌' : '・'} ${esc(th)}</small></div>`).join('')}</div>${num(p.ema9) != null ? `<p class="tool-fine">EMA 9 (${esc(p.ema9Step || '5m')}) = $${F(p.ema9)}${num(p.ema9Daily) != null ? `・Daily EMA 9 = $${F(p.ema9Daily)}` : ''}</p>` : ''}</div>`;
  }
  function scanHTML(d, R, early) {
    const rows = d.scan || [];
    if (!rows.length) return '';
    const cell = (c) => `<td class="pk-c ${mk(c[5])}">${esc(c[3])}</td>`;
    const H = (en, zh) => `<th>${en}<small>${zh}</small></th>`;
    return `<section class="card pk-scan"><div class="card-h">📊 Pre-Market Scanner（盤前掃描總表）<small>${esc(d.scanTime ? '數據截至美東 ' + d.scanTime : '')}</small></div>
      <p class="muted">先睇數據，再睇下面每隻嘅分析同新聞。綠色 = 合新手起步條件，紅色 = 唔合，灰色 = 冇數據。RVOL ≥ ${R.rvol} 係硬性規則（must），其他係參考條件（唔係驗證過嘅獲利門檻）。</p>
      <div class="tbl-scroll"><table class="mini-tbl wide pk-scan-t"><thead><tr>${H('Symbol', '股票')}${H('Price', '價')}${H('Gap %', '盤前漲跌幅')}${H('RVOL', '相對成交量')}${H('Pre-Mkt Vol', '盤前成交量')}${H('Catalyst', '消息催化劑')}${H('Float', '流通股數')}${H('ATR %', '波幅')}${H('Spread %', '買賣差價')}${H('Rel. Strength', 'vs QQQ')}${H('EMA 9', '5m，價距 %')}${H('Pass', '合格')}${H('Verdict', '結論')}</tr></thead><tbody>
      ${rows.map((x) => { const c = checks(x, R, early); const v = VERDICT[x.verdict] || VERDICT.skip; const n = c.filter((y) => y[5] === true).length, k = c.filter((y) => y[5] != null).length;
        return `<tr><th>${esc(x.sym)}</th><td>${num(x.price) == null ? '—' : '$' + F(x.price)}</td>${cell(c[0])}${cell(c[1])}${cell(c[2])}<td class="pk-c ${mk(c[3][5])} pk-cat" title="${esc(x.catalyst || '')}">${esc((x.catalyst || '—').slice(0, 40))}</td>${cell(c[4])}${cell(c[5])}${cell(c[6])}${cell(c[7])}${cell(c[8])}<td>${n}/${k}</td><td><span class="pk-beg ${v[2]}">${v[0]} ${v[1]}</span>${x.note ? `<small>${esc(x.note)}</small>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="tool-fine">Thresholds：|Gap %| ≥ ${R.gapAbs}%・RVOL ≥ ${R.rvol}×・Pre-Market Volume ≥ ${big(early ? R.pmVolumeEarly : R.pmVolume)}・Float ≥ ${R.floatM}M・ATR % ≥ ${R.atrPct}%・Bid-Ask Spread ≤ ${R.spreadPct}%・Relative Strength：升嘅股要強過 QQQ、跌嘅要弱過 QQQ・EMA 9：做多價格要喺 5 分鐘 EMA 9 之上，沽空要喺之下。另外新手宜揀股價 $${R.priceMin}–${R.priceMax}、日均成交 ≥ ${big(R.avgVolume)}。盤前買賣差價通常比開市後闊，開市前再喺券商睇一次。</p></section>`;
  }

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

  function pickHTML(p, date, i, R = RULES, early = false) {
    const lg = logOf()[date] && logOf()[date][p.sym] || {};
    const L = p.levels || {};
    const me = Store.activeProfile ? Store.activeProfile() : null;
    const fam = (Store.profiles() || []).filter((f) => !me || f.id !== me.id).map((f) => { const x = (logOf(f.id)[date] || {})[p.sym]; return x && x.status ? `<span class="pk-fam" style="--c:${esc(f.color)}">${esc(f.emoji)} ${esc(f.name)}：${esc((STATUS.find((s) => s[0] === x.status) || [])[1] || '')}${num(x.r) != null ? ' ' + (x.r > 0 ? '+' : '') + x.r + 'R' : ''}</span>` : ''; }).join('');
    const plan = p.plan || {};
    return `<article class="pk-card" data-sym="${esc(p.sym)}">
      <header class="pk-head">
        <div class="pk-rank">${i + 1}</div>
        <div class="pk-title"><b>${esc(p.sym)}</b><span>${esc(p.name || '')}</span></div>
        <div class="pk-tags">${num(p.rvol) != null ? `<span class="pk-rvol ${p.rvol >= 2 ? 'ok' : 'low'}" title="盤前相對成交量（同時段）">RVOL ${F(p.rvol, 1)}×</span>` : ''}${p.grade ? `<span class="pk-grade g-${esc(p.grade)}">${esc(p.grade)} 級</span>` : ''}${p.beginner ? `<span class="pk-beg ${BEGIN[p.beginner] || 'mid'}">${esc(p.beginner)}</span>` : ''}${p.direction ? `<span class="pk-dir">${esc(p.direction)}</span>` : ''}</div>
      </header>
      <div class="pk-nums">
        <div><span>Pre-Market Price</span><b>$${F(p.price)}</b></div>
        <div><span>Gap %（vs Prior Close）</span><b class="${cls(p.gapPct)}">${P(p.gapPct)}</b></div>
        <div><span>Pre-Market Volume</span><b>${big(p.pmVolume)}</b></div>
        <div><span>Avg Volume（20D）</span><b>${big(p.avgVolume)}</b></div>
        <div><span>PM Vol % of Avg</span><b>${num(p.pmVolPct) == null ? '—' : F(p.pmVolPct, 1) + '%'}</b></div>
        <div><span>RVOL</span><b class="${num(p.rvol) != null && p.rvol >= 2 ? 'pos' : ''}">${num(p.rvol) == null ? '—' : F(p.rvol, 1) + '×'}</b></div>
        <div><span>Bid-Ask Spread</span><b>${num(p.spread) == null ? '—' : '$' + F(p.spread)}${num(p.spreadPct) != null ? ` <small>(${F(p.spreadPct, 2)}%)</small>` : ''}</b></div>
        <div><span>ATR（14D）</span><b>${num(p.atr) == null ? '—' : '$' + F(p.atr)}${num(p.atrPct) != null ? ` <small>(${F(p.atrPct, 1)}%)</small>` : ''}</b></div>
        <div><span>Market Cap</span><b>${num(p.mktCapB) == null ? '—' : F(p.mktCapB, 1) + 'B'}</b></div>
        <div><span>Float</span><b>${num(p.floatM) == null ? '—' : big(p.floatM * 1e6)}</b></div>
      </div>
      ${indicatorsHTML(p, R, early)}
      ${(p.lists || []).length ? `<div class="pk-lists">${p.lists.map((x) => `<span>📌 ${esc(x)}</span>`).join('')}</div>` : ''}
      <div class="pk-levels">${lvl('PMH', L.pmh)}${lvl('PML', L.pml)}${lvl('PDH', L.pdh)}${lvl('PDL', L.pdl)}${lvl('昨收', L.pdc)}${(L.other || []).map((o) => lvl(esc(o.label), o.price)).join('')}</div>
      ${p.why ? `<p class="pk-why"><b>點解適合今日 Day Trade：</b>${esc(p.why)}</p>` : ''}
      ${p.catalyst ? `<p><b>📰 催化劑：</b>${esc(p.catalyst)}</p>` : ''}
      ${p.technical ? `<p><b>📈 技術面：</b>${esc(p.technical)}</p>` : ''}
      ${p.setup ? `<p><b>🎯 Setup：</b>${esc(p.setup)}</p>` : ''}
      ${tradeHTML(p.trade)}
      ${pillarsHTML(p.pillars)}
      ${plan.long || plan.short || plan.noTrade ? `<div class="pk-plan">${plan.long ? `<div class="up"><b>如果向上</b>${esc(plan.long)}</div>` : ''}${plan.short ? `<div class="down"><b>如果向下</b>${esc(plan.short)}</div>` : ''}${plan.noTrade ? `<div class="no"><b>唔做嘅情況</b>${esc(plan.noTrade)}</div>` : ''}</div>` : ''}
      ${(p.risks || []).length ? `<p class="pk-risk"><b>⚠️ 風險：</b>${p.risks.map(esc).join('；')}</p>` : ''}
      ${!(p.news || []).length && p.newsNote ? `<p class="pk-risk"><b>📰 新聞：</b>${esc(p.newsNote)}</p>` : ''}
      ${(p.news || []).length ? `<details class="pk-news" open><summary>相關新聞（${p.news.length}）</summary><ul class="pk-newslist">${newsHTML(p.news)}</ul></details>` : ''}
      <div class="pk-log">
        <select data-st aria-label="${esc(p.sym)} 紀錄狀態">${STATUS.map(([v, t]) => `<option value="${v}" ${lg.status === v || (!lg.status && !v) ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <input data-r type="number" step="0.1" placeholder="結果（R）" value="${num(lg.r) == null ? '' : lg.r}" aria-label="${esc(p.sym)} 結果 R">
        <input data-note type="text" placeholder="筆記：有冇跟計劃？學到乜？" value="${esc(lg.note || '')}" aria-label="${esc(p.sym)} 筆記">
      </div>
      ${fam ? `<div class="pk-fams">${fam}</div>` : ''}
    </article>`;
  }

  function tradeHTML(t) {
    if (!t || num(t.entry) == null) return '';
    const L = t.side !== 'Short';
    const pct = (a) => (num(a) == null || !t.entry ? '' : ` <small>(${((a - t.entry) / t.entry * 100 >= 0 ? '+' : '') + ((a - t.entry) / t.entry * 100).toFixed(2)}%)</small>`);
    return `<div class="pk-trade ${L ? 'long' : 'short'}">
      <div class="pk-trade-h"><b>${L ? '📈 Long' : '📉 Short'} 交易計劃</b>${num(t.rr) != null ? `<span class="pk-rr">R:R ${F(t.rr, 2)}</span>` : ''}</div>
      ${t.trigger ? `<p class="pk-trig"><b>入場條件：</b>${esc(t.trigger)}</p>` : ''}
      <div class="pk-trade-g"><div><span>Entry</span><b>$${F(t.entry)}</b></div><div class="neg"><span>Stop</span><b>$${F(t.stop)}</b>${pct(t.stop)}</div><div class="pos"><span>Target 1</span><b>$${F(t.target1)}</b>${pct(t.target1)}</div>${num(t.target2) != null ? `<div class="pos"><span>Target 2</span><b>$${F(t.target2)}</b>${pct(t.target2)}</div>` : ''}<div><span>每股風險</span><b>$${F(Math.abs(t.entry - t.stop))}</b></div></div>
    </div>`;
  }
  const PILLARS = [['bigPicture', '🌍', '大環境'], ['fundamentals', '📰', '日內基本面'], ['technical', '📈', '技術分析'], ['tape', '📜', '睇盤（Tape）'], ['intuition', '🧭', '直覺／經驗判斷']];
  function pillarsHTML(x) {
    if (!x) return '';
    return `<details class="pk-pillars" open><summary><b>五大分析</b></summary><dl>${PILLARS.filter(([k]) => x[k]).map(([k, ic, t]) => `<div><dt>${ic} ${t}</dt><dd>${esc(x[k])}</dd></div>`).join('')}</dl></details>`;
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
    const R = Object.assign({}, RULES, d.rules || {});
    const early = !!(d.scanTime && d.scanTime < '08:30');
    const base = m.base || {};
    return `<div class="page-head"><h1>📋 每日選股</h1><p class="muted">每個美股交易日開市前約一小時（美東 08:30）自動更新：先列 8 大盤前指標總表，再列每隻候選股嘅分析、新聞同交易計劃。只有盤前 <b>RVOL ≥ 2</b> 嘅股票先會入候選名單。AI 整理嘅數據可能有延遲或者錯漏，落單前一定要喺券商再核對價位、計好股數同風險。</p></div>
      <div class="pk-days" role="tablist" aria-label="日期">${days.slice(0, 30).map((x) => `<a href="#/picks/${esc(x.date)}" class="pk-day ${x.date === d.date ? 'on' : ''}"><b>${esc(x.date.slice(5))}</b><small>${esc(x.bias || '')}${x.reviewed ? ' · 已回顧' : ''}</small></a>`).join('')}</div>
      <section class="pk-hero card">
        <div><div class="pk-date">${esc(d.date)}（美東）${d.status === 'test' ? '<span class="pk-beg mid">測試版</span>' : ''}</div>
          <div class="pk-bias">大市傾向：<b>${esc(m.bias || '—')}</b></div>
          <p>${esc(m.summary || '')}</p>
          <small class="muted">更新時間：${esc((d.generatedAt || '').slice(0, 16).replace('T', ' '))} UTC${(d.sources || []).length ? '' : '・數據：' + esc((d.dataSources || []).join('、'))}${d.dataQuality === 'partial' ? '・⚠️ 部分數據未能取得' : ''}</small>
          ${(d.sources || []).length ? `<div class="pk-src">${d.sources.map((x) => `<span class="${x.ok ? 'ok' : 'no'}" title="${esc(x.note || '')}">${x.ok ? '✅' : '❌'} ${esc(x.name)}</span>`).join('')}</div>` : ''}</div>
        <div class="pk-mystats"><span>我嘅紀錄</span><b>${st.traded} 筆</b><small>${st.n ? `平均 ${(st.exp >= 0 ? '+' : '') + st.exp.toFixed(2)}R・勝率 ${Math.round(st.wr * 100)}%` : '記錄咗結果先有統計'}</small></div>
      </section>
      ${(m.indices || []).length ? `<section class="card"><div class="card-h">🌐 指數、期貨同市場數據${num(base.qqq) != null ? `<small>相對強弱基準：SPY ${P(base.spy)}・QQQ ${P(base.qqq)}</small>` : ''}</div><div class="pk-idx">${m.indices.map((x) => `<div><span>${esc(x.sym)}</span><b>${num(x.last) == null ? '—' : F(x.last)}</b><em class="${cls(x.chgPct)}">${P(x.chgPct)}</em>${x.note ? `<small>${esc(x.note)}</small>` : ''}</div>`).join('')}</div></section>` : ''}
      ${(m.events || []).length || (m.earnings || []).length ? `<section class="card"><div class="card-h">🗓️ 今日事件</div>
        ${(m.events || []).length ? `<ul class="pk-ev">${m.events.map((e) => `<li><b>${esc(e.time || '')}</b> ${esc(e.name)} ${e.impact ? `<span class="pk-beg ${e.impact === '高' ? 'bad' : 'mid'}">${esc(e.impact)}影響</span>` : ''}${e.note ? `<small>${esc(e.note)}</small>` : ''}</li>`).join('')}</ul>` : ''}
        ${(m.earnings || []).length ? `<p><b>業績：</b>${m.earnings.map((e) => `${esc(e.sym)}（${esc(e.when || '')}${e.note ? '，' + esc(e.note) : ''}）`).join('、')}</p>` : ''}</section>` : ''}
      ${d.focus ? `<section class="card pk-focus"><div class="card-h">⚡ TSLA 今日狀態</div><p>${esc(d.focus)}</p></section>` : ''}
      ${scanHTML(d, R, early)}
      <h2 class="sec-h">🎯 今日候選股（${(d.picks || []).length}）</h2>
      ${d.fewPicksReason ? `<p class="pk-risk">ℹ️ ${esc(d.fewPicksReason)}</p>` : ''}
      <div class="pk-list">${(d.picks || []).map((p, i) => pickHTML(p, d.date, i, R, early)).join('') || '<div class="empty">今日冇符合條件嘅候選股 —— 冇好機會就唔做，都係一個決定。</div>'}</div>
      ${(d.watch || []).length ? `<section class="card"><div class="card-h">👀 次選／觀察名單</div><ul class="pk-simple">${d.watch.map((x) => `<li><b>${esc(x.sym)}</b> ${esc(x.why)}</li>`).join('')}</ul></section>` : ''}
      ${(d.avoid || []).length ? `<section class="card"><div class="card-h">🚫 今日避開</div><ul class="pk-simple">${d.avoid.map((x) => `<li><b>${esc(x.sym)}</b> ${esc(x.why)}</li>`).join('')}</ul></section>` : ''}
      ${(d.news || []).length ? `<section class="card"><div class="card-h">📰 今日重要新聞</div><ul class="pk-newslist">${newsHTML(d.news)}</ul></section>` : ''}
      ${d.lesson ? `<section class="card tip-card"><div class="card-h">💡 新手提示</div><p>${esc(d.lesson)}</p></section>` : ''}
      ${reviewHTML(d.review)}
      <details class="card pk-method"><summary><b>🔍 選股方法（點樣由幾千隻縮到 5 隻）</b></summary>
        <p>盤前揀股同入市技術（支持阻力、K 線、成交量、VWAP）係兩樣唔同嘅技能：盤前先解決「今日應該集中睇邊 3–7 隻」，開市後先用技術搵入場位。所以盤前唔靠 RSI、MACD，而係睇以下 9 個指標（頭 8 個係揀股，EMA 9 睇短線趨勢）。</p>
        <div class="tbl-scroll"><table class="mini-tbl wide"><tr><th>#</th><th>Indicator</th><th>作用</th><th>新手參考條件</th></tr>
        <tr><td>1</td><td><b>Gap %</b> 盤前漲跌幅</td><td>今日有冇明顯異動</td><td>|Gap| ≥ ${R.gapAbs}%</td></tr>
        <tr><td>2</td><td><b>Relative Volume (RVOL)</b> 相對成交量</td><td>今日成交係咪異常活躍</td><td><b>≥ ${R.rvol}×（硬性規則）</b></td></tr>
        <tr><td>3</td><td><b>Pre-Market Volume</b> 盤前成交量</td><td>有冇足夠人參與</td><td>≥ ${big(R.pmVolume)}（08:30 前 ≥ ${big(R.pmVolumeEarly)}）</td></tr>
        <tr><td>4</td><td><b>Catalyst</b> 消息催化劑</td><td>點解今日會郁</td><td>Earnings、Guidance、重大新聞、公告</td></tr>
        <tr><td>5</td><td><b>Float</b> 流通股數</td><td>容唔容易急升急跌</td><td>新手優先 ≥ ${R.floatM}M</td></tr>
        <tr><td>6</td><td><b>ATR / ATR %</b> 波幅</td><td>平日波幅夠唔夠做</td><td>ATR % ≥ ${R.atrPct}%</td></tr>
        <tr><td>7</td><td><b>Bid-Ask Spread</b> 買賣差價</td><td>入出市隱藏成本</td><td>≤ ${R.spreadPct}%</td></tr>
        <tr><td>8</td><td><b>Relative Strength</b> 相對大市強弱（唔係 RSI）</td><td>係咪跑贏／跑輸大市</td><td>Long 強過 QQQ、Short 弱過 QQQ</td></tr>
        <tr><td>9</td><td><b>EMA 9</b>（5-minute，包盤前）</td><td>短線趨勢／動能</td><td>Long 價格喺 EMA 9 之上、Short 喺之下</td></tr></table></div>
        <p><b>點計：</b>跳空 % =（盤前現價 − 昨收）÷ 昨收。RVOL = 今日 04:00 至最後一支已完成 K 線嘅盤前成交 ÷ 之前 10 個交易日同一段時間嘅平均（唔係 TradingView 嗰個只計正常時段嘅 Relative Volume）。ATR % = 14 日 ATR ÷ 昨收。Relative Strength = 個股 Gap % − QQQ Gap %。EMA 9 = 5 分鐘 K 線（包盤前）嘅 9 期指數移動平均，表入面顯示現價距離 EMA 9 幾多 %。</p>
        <p><b>常見陷阱：</b>TradingView 嘅「Pre-market Gap %」係用盤前第一個價計，「Pre-market Change %」先係對比昨收；盤前流動性低，差價會闊過開市後；$2 股票成交 100 萬股同 $100 股票成交 100 萬股，金額差好遠；跳空大唔等於一定繼續（Gap &amp; Go），亦可能回吐（Gap Fade）。</p>
        <p><b>五大分析：</b>① 大環境（指數、期貨、VIX、板塊）② 日內基本面（點解郁、消息新唔新、夠唔夠重大）③ 技術分析（日線趨勢、PDH／PDL、PMH／PML、有冇位放止蝕同目標）④ 睇盤（盤前成交分佈、差價同掛單、開市首幾分鐘成交）⑤ 直覺（綜合判斷同信心）。</p>
        <p><b>主力 Setup：開市推動（Opening Drive）</b>—— 開市後股價順住跳空方向突破開市區間（例如首 5 分鐘高位），同時成交明顯放大，先順勢入場；Stop 放開市區間另一邊或者 VWAP 下方。其他：開市區間突破（ORB）、突破後回踩、假突破。唔好見跳空就追。</p>
        <p><b>每日參考名單：</b>CNBC 盤前異動股、StockAnalysis 盤前升跌榜、TopBreakoutStocks（即將突破同昨日突破，附突破價）、TradeThatSwing 每週 Day Trade 名單、Alpaca 異動榜，同 Warrior Trading 動能準則（升 ≥ 10%、RVOL ≥ 5、$1–20、有新聞、流通股 < 2,000 萬；通常屬高風險）。</p>
        <p class="tool-fine">數據來源：Alpaca（SIP K 線計 RVOL、ATR、PMH／PML；IEX 報價計差價）、Yahoo Finance（後備）、IBKR（只讀，人手核對）、StockAnalysis（盤前價同成交）、Finviz（流通股、ATR、行業）、Nasdaq 同 ForexFactory 日曆、新聞（Alpaca／Benzinga、Google News、Seeking Alpha、Finviz、MarketWatch、Investing.com、CNBC）、SEC 公告。每日實際用到邊啲睇頂部嘅來源列。揀中一隻熱門股只代表值得研究，唔代表值得買；建議先用模擬交易記錄 20–30 日，睇下呢套條件揀出嚟嘅股係咪真係有符合你規則嘅機會。</p></details>
      <p class="disclaimer">${esc(d.disclaimer || 'Day Trade 風險極高，可能損失全部本金。報告由 AI 用公開同券商數據整理，可能有延遲或者錯誤；落單前請自行核對價位，並按自己嘅風險上限計股數。')}</p>`;
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
        <div class="quick-tools">${(d0.top || []).slice(0, 5).map((t) => `<a href="#/picks/${esc(d0.date)}"><span>🎯</span><b>${esc(t.sym || t)}</b>${t.gapPct != null ? `&nbsp;<small class="${cls(t.gapPct)}">${P(t.gapPct)}</small>` : ''}${t.rvol != null ? `&nbsp;<small>RVOL ${F(t.rvol, 1)}×</small>` : ''}${t.beginner ? `&nbsp;<small>${esc(t.beginner)}</small>` : ''}</a>`).join('')}</div>`;
    }).catch(() => {});
  }

  window.Picks = { render, homeCard, loadIndex, loadDay, myStats };
})();
