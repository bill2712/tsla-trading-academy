/* =========================================================
 * 紀律：斷路器（Drawdown Circuit Breaker）＋ 落單前紀律閘（Pre-trade Discipline Gate）＋ 紀律紀錄
 * 概念參考 tradermonty/claude-trading-skills（MIT）嘅 drawdown-circuit-breaker、pre-trade-discipline-gate、
 * trader-memory-core，改寫成 Day Trade 版本：用 R 做單位，讀你自己嘅交易日誌（💵 真實＋📄 Paper）。
 * 只係提醒同紀錄；App 唔會亦唔可以阻止你喺券商落單。
 * ========================================================= */
(function () {
  const { F, esc, stat, verdict } = window.ToolUtil;
  const RULE_DEF = { dayStopR: 3, maxTrades: 3, streakN: 2, cooldownMin: 30, weekStopR: 5, monthStopR: 8, countPaper: 'yes' };
  const TS = () => window.TradeSettings;
  const rules = () => Object.assign({}, RULE_DEF, TS() ? TS().get() : {});
  const etNow = () => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    return { d: `${g('year')}-${g('month')}-${g('day')}`, hm: `${g('hour')}:${g('minute')}` };
  };
  const mins = (hm) => { const m = /^(\d{1,2}):(\d{2})/.exec(hm || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const hmOf = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const monday = (d) => { const t = new Date(d + 'T12:00:00Z'); const w = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - w); return t.toISOString().slice(0, 10); };
  const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

  /* 交易日誌入面已平倉、計到 R 嘅交易 */
  function closedTrades(uid, R) {
    const u = Store.user(uid); const J = (u && u.journal) || [];
    const ok = (k) => k === 'live' || (R.countPaper === 'yes' && k === 'paper');
    return J.filter((t) => ok(t.kind || 'replay') && t.date).map((t) => ({ t, c: window.Journal ? Journal.calc(t) : null }))
      .filter((x) => x.c && x.c.r != null).map((x) => ({ date: x.t.date, time: x.t.time || '', sym: x.t.symbol || '', r: x.c.r, kind: x.t.kind }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  /* 斷路器：TRADING_ALLOWED／COOLDOWN／HALTED */
  function breaker(uid) {
    const R = rules(), now = etNow(), T = closedTrades(uid, R);
    const today = T.filter((x) => x.date === now.d), wk = monday(now.d), mo = now.d.slice(0, 7);
    const sum = (A) => A.reduce((s, x) => s + x.r, 0);
    const dayR = sum(today), weekR = sum(T.filter((x) => x.date >= wk && x.date <= now.d)), monthR = sum(T.filter((x) => x.date.slice(0, 7) === mo));
    let streak = 0; for (let i = today.length - 1; i >= 0 && today[i].r < 0; i--) streak++;
    const active = [];
    if (dayR <= -R.dayStopR) active.push({ lvl: 'HALTED', why: `今日已經 ${F(dayR)}R，到咗每日上限 −${R.dayStopR}R`, until: '聽日' });
    if (today.length >= R.maxTrades) active.push({ lvl: 'HALTED', why: `今日已經做咗 ${today.length} 筆（上限 ${R.maxTrades} 筆）`, until: '聽日' });
    if (weekR <= -R.weekStopR) active.push({ lvl: 'HALTED', why: `本週 ${F(weekR)}R，到咗每週上限 −${R.weekStopR}R`, until: `下星期一（${addDays(wk, 7)}）` });
    if (monthR <= -R.monthStopR) active.push({ lvl: 'HALTED', why: `本月 ${F(monthR)}R，到咗每月上限 −${R.monthStopR}R：返去 Paper 檢討`, until: '下個月' });
    if (streak >= R.streakN) {
      const last = mins(today[today.length - 1].time), n = mins(now.hm);
      if (last == null) active.push({ lvl: 'COOLDOWN', why: `今日連輸 ${streak} 筆（日誌冇填時間）：休息 ${R.cooldownMin} 分鐘先再做`, until: '休息夠之後' });
      else if (n < last + R.cooldownMin) active.push({ lvl: 'COOLDOWN', why: `今日連輸 ${streak} 筆：冷靜期`, until: `美東 ${hmOf(last + R.cooldownMin)}` });
    }
    const lvl = active.some((a) => a.lvl === 'HALTED') ? 'HALTED' : active.length ? 'COOLDOWN' : 'TRADING_ALLOWED';
    return { lvl, active, dayR, weekR, monthR, streak, todayN: today.length, R, now, nTrades: T.length };
  }
  const LV = { TRADING_ALLOWED: ['✅', '可以開新倉', 'ok'], COOLDOWN: ['⏸️', '冷靜期：暫停開新倉', 'mid'], HALTED: ['⛔', '停止開新倉', 'bad'] };
  function breakerHTML(b, compact) {
    const v = LV[b.lvl];
    return `<div class="dc-cb dc-${v[2]}"><b>🧯 斷路器：${v[0]} ${v[1]}</b>
      ${b.active.map((a) => `<p>${esc(a.why)}<small>（到${esc(a.until)}）</small></p>`).join('')}
      ${compact ? '' : `<div class="stats">${stat('今日', (b.dayR >= 0 ? '+' : '') + F(b.dayR) + 'R', b.dayR >= 0 ? 'pos' : 'neg')}${stat('今日筆數', b.todayN + ' / ' + b.R.maxTrades)}${stat('今日連輸', b.streak)}${stat('本週', (b.weekR >= 0 ? '+' : '') + F(b.weekR) + 'R', b.weekR >= 0 ? 'pos' : 'neg')}${stat('本月', (b.monthR >= 0 ? '+' : '') + F(b.monthR) + 'R', b.monthR >= 0 ? 'pos' : 'neg')}</div>`}
      <p class="tool-fine">讀你嘅交易日誌（💵 真實${b.R.countPaper === 'yes' ? '＋📄 Paper' : ''}，美東 ${esc(b.now.d)}）。${b.nTrades ? '' : '日誌未有已平倉交易，所以冇嘢觸發。'}斷路器只係提醒，唔會亦唔可以阻止券商落單：觸發咗就照規則停。</p></div>`;
  }

  /* 紀律紀錄（trader memory）：每次落單前嘅決定 */
  function logArr(uid) { const u = Store.user(uid); u.toolState = u.toolState || {}; u.toolState.gateLog = u.toolState.gateLog || []; return u.toolState.gateLog; }
  function logDecision(rec) { const L = logArr(); L.push(rec); if (L.length > 300) L.splice(0, L.length - 300); Store.save(); }

  /* 落單前紀律閘：GO／NO-GO */
  const Q = [
    ['plan', '呢筆喺我今日寫低嘅計劃入面（股票、Setup、觸發價）'],
    ['stop', 'Stop 價係事前定好，而且會一齊落（Bracket）'],
    ['size', '股數係用呢頁計出嚟，冇自己加大'],
    ['calm', '我而家冷靜：唔係想追返、唔係怕錯過（Tilt ≤ 5）'],
  ];
  function evalGate(ctx) {
    const { p, P, S, ans } = ctx, b = breaker(), fails = [], warns = [];
    if (b.lvl !== 'TRADING_ALLOWED') fails.push(`斷路器：${LV[b.lvl][1]}`);
    Q.forEach(([k, t]) => { if (!ans[k]) fails.push('未確認：' + t); });
    if (!(P.shares > 0)) fails.push('股數係 0');
    if (P.rr < 1.5) fails.push(`R:R ${F(P.rr)} 低過 1.5`);
    if (!P.long && S.cash === 'yes') fails.push('Cash 戶口唔可以沽空');
    if (P.riskUsd > P.budget + 0.01) fails.push('實際風險大過每筆預算');
    if (p.px > 0 && p.atr > 0 && (P.sg * (p.px - P.entry)) / p.atr > 0.3) fails.push('而家價已經過咗入場價 0.3 ATR 以上（唔追）');
    if (P.rr < 1.995 && P.rr >= 1.5) warns.push(`R:R ${F(P.rr)} 未夠 2`);
    return { decision: fails.length ? 'NO_GO' : 'GO', fails, warns, b };
  }
  function mountGate(el, ctx) {
    const st = ctx.state; st.ans = st.ans || {};
    const draw = () => {
      const g = evalGate({ ...ctx, ans: st.ans });
      const L = logArr().slice(-5).reverse();
      el.innerHTML = `<div class="dc-gate dc-${g.decision === 'GO' ? 'ok' : 'bad'}">
        <div class="dc-gate-h"><b>🚦 落單前紀律閘</b><span class="dc-dec">${g.decision === 'GO' ? '✅ GO：可以落單' : '⛔ NO-GO：今次唔落'}</span></div>
        ${breakerHTML(g.b, true)}
        <div class="dc-qs">${Q.map(([k, t]) => `<label class="chk"><input type="checkbox" data-gq="${k}" ${st.ans[k] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>
        ${g.fails.length ? `<ul class="dc-fails">${g.fails.map((f) => `<li>❌ ${esc(f)}</li>`).join('')}</ul>` : ''}
        ${g.warns.map((w) => verdict(null, esc(w))).join('')}
        <p><button class="btn sm ${g.decision === 'GO' ? 'primary' : ''}" data-glog>📝 記錄呢個決定</button> <a class="btn sm ghost" href="#/tools/circuit-breaker">🧯 斷路器同紀律紀錄</a></p>
        ${L.length ? `<details><summary>最近紀錄（${logArr().length}）</summary><ul class="dc-log">${L.map((r) => `<li>${esc(r.date)} ${esc(r.time)}｜${esc(r.sym)}｜${r.decision === 'GO' ? '✅ GO' : '⛔ NO-GO'}${r.fails && r.fails.length ? `<small>${esc(r.fails.join('；'))}</small>` : ''}</li>`).join('')}</ul></details>` : ''}
      </div>`;
      el.querySelectorAll('[data-gq]').forEach((i) => i.addEventListener('change', () => { st.ans[i.dataset.gq] = i.checked; draw(); }));
      el.querySelector('[data-glog]').addEventListener('click', (e) => {
        const n = etNow();
        logDecision({ ts: Date.now(), date: n.d, time: n.hm, sym: ctx.p.sym, side: ctx.P.long ? 'long' : 'short', entry: ctx.P.entry, stop: ctx.P.stop, shares: ctx.P.shares, riskUsd: Math.round(ctx.P.riskUsd * 100) / 100, budget: Math.round(ctx.P.budget * 100) / 100, decision: g.decision, fails: g.fails, breaker: g.b.lvl });
        e.target.textContent = '✅ 已記錄'; setTimeout(draw, 900);
      });
    };
    draw();
  }

  /* ---------------- 🧯 斷路器工具 ---------------- */
  window.TOOLS['circuit-breaker'] = {
    title: '斷路器：今日仲可唔可以開新倉？', icon: '🧯', cat: '風險與倉位', level: 'l8',
    desc: '自動讀你嘅交易日誌：今日虧到上限、做夠筆數、連輸兩筆冷靜期、每週／每月回撤上限，一眼知道仲可唔可以開新倉；連埋落單前紀律閘嘅紀錄（幾多次 NO-GO、有冇照做）。',
    render(el) {
      const draw = () => {
        const b = breaker(), R = b.R, L = logArr();
        const go = L.filter((r) => r.decision === 'GO').length, ng = L.length - go;
        const field = (k, label, step) => `<label class="fld"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" data-r="${k}" value="${R[k]}"></label>`;
        el.innerHTML = `${breakerHTML(b, false)}
          <details class="tq-sec"><summary><b>⚙️ 斷路器規則（同交易一頁通共用設定）</b></summary><div class="tool-grid">
            ${field('dayStopR', '每日虧損上限（R）', 0.5)}${field('maxTrades', '每日最多筆數', 1)}${field('streakN', '連輸幾多筆就冷靜', 1)}
            ${field('cooldownMin', '冷靜期（分鐘）', 5)}${field('weekStopR', '每週虧損上限（R）', 0.5)}${field('monthStopR', '每月虧損上限（R）', 0.5)}
            <label class="fld"><span>計埋 Paper 交易？</span><select data-r="countPaper"><option value="yes" ${R.countPaper === 'yes' ? 'selected' : ''}>計（學緊階段建議）</option><option value="no" ${R.countPaper !== 'yes' ? 'selected' : ''}>只計真實交易</option></select></label>
          </div></details>
          <div class="tq-sec"><b>📝 紀律紀錄（落單前紀律閘）</b>
            <div class="stats">${stat('總紀錄', L.length)}${stat('GO', go, 'pos')}${stat('NO-GO', ng, ng ? 'neg' : '')}</div>
            ${L.length ? `<table class="tbl"><tr><th>美東</th><th>股票</th><th>決定</th><th>原因</th></tr>${L.slice(-15).reverse().map((r) => `<tr><td>${esc(r.date)} ${esc(r.time)}</td><td>${esc(r.sym)}</td><td>${r.decision === 'GO' ? '✅ GO' : '⛔ NO-GO'}</td><td><small>${esc((r.fails || []).join('；') || '—')}</small></td></tr>`).join('')}</table>` : '<p class="muted">未有紀錄。每次落單前喺 ⚡ 交易一頁通撳「記錄呢個決定」，呢度就會累積。</p>'}
            <p class="tool-fine">週末檢討時對照交易日誌：NO-GO 之後有冇照樣落單？嗰啲交易結果點？呢個就係「擋住自己」嘅數據。</p></div>`;
        el.querySelectorAll('[data-r]').forEach((i) => i.addEventListener('change', () => {
          const s = TS().get(); s[i.dataset.r] = i.tagName === 'SELECT' ? i.value : (parseFloat(i.value) || 0); TS().put(s); draw();
        }));
      };
      draw();
    },
  };
  window.Discipline = { rules, breaker, breakerHTML, evalGate, mountGate, logArr, Q };
})();
