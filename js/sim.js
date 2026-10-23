/* =========================================================
 * 模擬交易練習場：隨機生成一個交易日，逐支 5 分鐘 K 線播放，
 * 自己落單（Long / Short + Stop + Target），自動計 R。
 * 全部係隨機模擬數據，唔係真實行情。
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const F = (n, d = 2) => (n == null || !isFinite(n) ? '—' : Number(n).toFixed(d));
  const signR = (n) => (n == null || !isFinite(n) ? '—' : (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + 'R');
  const money = (n) => (n < 0 ? '−$' : '$') + Math.abs(n).toFixed(2);
  const TYPES = { trend: '趨勢日', range: '區間日', reversal: '反轉日' };
  const MARKET = { trend: 'Trending', range: 'Range', reversal: 'Choppy' };
  const N = 78, SLIP = 0.02;
  const narrow = () => innerWidth < 700;
  const winN = () => (narrow() ? 26 : 42);

  function rngOf(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function makeDay(type, seed) {
    const r = rngOf(seed);
    if (type === 'random') type = ['trend', 'trend', 'range', 'range', 'reversal'][Math.floor(r() * 5)];
    const pc = Math.round((370 + r() * 40) * 100) / 100;
    const pdh = +(pc + 1 + r() * 4).toFixed(2), pdl = +(pc - 3 - r() * 6).toFixed(2);
    const dir = r() < 0.5 ? 1 : -1;
    const gap = (type === 'trend' ? dir * (0.3 + r() * 1.2) : (r() - 0.5) * 1.2) / 100 * pc;
    const open = +(pc + gap).toFixed(2);
    const vol = 0.42 + r() * 0.18;
    const bars = []; let p = open; const center = open + (r() - 0.5) * 1.5; const amp = 2 + r() * 1.5;
    const turn = 18 + Math.floor(r() * 14);
    for (let i = 0; i < N; i++) {
      let drift = 0;
      if (type === 'trend') drift = dir * (0.11 + r() * 0.05) * (i < 60 ? 1 : 0.4) - dir * Math.max(0, Math.sin(i / 3.3)) * 0.08;
      else if (type === 'range') drift = (center + Math.sin(i / 4.2) * amp - p) * 0.18;
      else drift = i < turn ? dir * 0.13 : -dir * 0.15 * (i < turn + 30 ? 1 : 0.4);
      const shock = gauss(r) * vol * (i < 6 ? 1.7 : i > 66 ? 1.2 : 1);
      const o = i === 0 ? open : p + gauss(r) * 0.03;
      const c = o + drift + shock;
      const h = Math.max(o, c) + Math.abs(gauss(r)) * vol * 0.45, l = Math.min(o, c) - Math.abs(gauss(r)) * vol * 0.45;
      const mins = 9 * 60 + 30 + i * 5;
      const u = i < 12 ? 2.4 - i * 0.12 : i > 66 ? 1.1 + (i - 66) * 0.09 : 0.75 + Math.abs(Math.sin(i / 7)) * 0.2;
      bars.push({ t: String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'), o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2), v: +(u * (0.7 + r() * 0.6) * (type === 'trend' ? 1.15 : 1)).toFixed(2) });
      p = c;
    }
    return { type, seed, pc, pdh, pdl, open, bars };
  }

  let keyHandler = null, autoTimer = null;
  function play(view) {
    clearInterval(autoTimer);
    const ui = Store.ui().sim || { type: 'random', risk: 0.25, cap: 10000, zoom: 'win' };
    const saveUI = () => Store.setUI({ sim: ui });
    let day = makeDay(ui.type, Math.floor(Math.random() * 1e9));
    let i = 5, pos = null, pend = null, trades = [], auto = null, done = false;

    view.innerHTML = `<div class="page-head"><h1>🕹️ 模擬交易練習場</h1><p class="muted">隨機生成一個交易日（5 分鐘 K 線，09:30–16:00）。你逐支播放，自己決定幾時入場、Stop 同 Target 放邊。收市自動平倉，最後先話你知今日係咩日類型。全部係隨機模擬，唔係真實行情。</p></div>
      <div class="sim-bar">
        <label>日類型 <select data-set="type"><option value="random">🎲 隨機（唔話你知）</option><option value="trend">趨勢日</option><option value="range">區間日</option><option value="reversal">反轉日</option></select></label>
        <label>每筆風險 <select data-set="risk"><option value="0.25">0.25%</option><option value="0.5">0.5%</option><option value="1">1%</option></select></label>
        <label>顯示 <select data-set="zoom"><option value="win">最近一段</option><option value="all">全日</option></select></label>
        <button class="btn sm ghost" data-new>🔄 新一日</button>
      </div>
      <div class="sim-wrap">
        <div class="sim-main"><div class="sim-info" data-info></div><div data-chart></div>
          <div class="sim-ctrl"><button class="btn primary" data-next>▶ 下一支 <kbd>→</kbd></button><button class="btn" data-n5>⏩ 5 支</button><button class="btn" data-auto>⏯ 自動</button><button class="btn ghost" data-eod>⏭ 播到收市</button></div></div>
        <aside class="sim-side"><div data-order></div><div data-log></div></aside>
      </div>`;
    view.querySelector('[data-set=type]').value = ui.type; view.querySelector('[data-set=risk]').value = String(ui.risk); view.querySelector('[data-set=zoom]').value = ui.zoom;

    const risk$ = () => ui.cap * ui.risk / 100;
    const cur = () => day.bars[i];
    const vwapAll = () => Charts.vwapOf(day.bars.slice(0, i + 1));

    function draw() {
      const all = day.bars.slice(0, i + 1);
      const WIN = winN();
      const start = ui.zoom === 'all' ? 0 : Math.max(0, all.length - WIN);
      const vis = all.slice(start);
      const lines = [{ y: day.pdh, label: 'PDH ' + F(day.pdh), color: 'var(--muted)' }, { y: day.pdl, label: 'PDL ' + F(day.pdl), color: 'var(--muted)' }, { y: day.pc, label: '昨收 ' + F(day.pc), color: 'var(--muted)' }];
      const L = pos || pend;
      if (L) { lines.push({ y: L.entry, label: (pos ? '入 ' : '觸發 ') + F(L.entry), color: 'var(--accent)' }, { y: L.stop, label: 'Stop ' + F(L.stop), color: 'var(--down)' }); if (L.target) lines.push({ y: L.target, label: 'Tgt ' + F(L.target), color: 'var(--up)' }); }
      const marks = [];
      trades.concat(pos ? [pos] : []).forEach((t) => { if (t.inIdx >= start) marks.push({ i: t.inIdx - start, text: t.side === 'long' ? '▲' : '▼', pos: t.side === 'long' ? 'below' : 'above', color: 'var(--accent)' }); if (t.outIdx != null && t.outIdx >= start) marks.push({ i: t.outIdx - start, text: t.r >= 0 ? '✓' : '✕', color: t.r >= 0 ? 'var(--up)' : 'var(--down)' }); });
      const vw = vwapAll().slice(start);
      lines.forEach((ln, k) => { if (k >= 3) ln.fit = true; });
      Charts.candles($('[data-chart]', view), { bars: vis, slots: ui.zoom === 'all' ? N : WIN, vwap: vw, lines, marks, height: narrow() ? 560 : 320, showVolume: !narrow(), fitLines: false, labelEvery: ui.zoom === 'all' ? 12 : narrow() ? 5 : 6 });
      const b = cur(), vwNow = vwapAll()[i];
      const ch = (b.c - day.pc) / day.pc * 100;
      const hi = Math.max(...all.map((x) => x.h)), lo = Math.min(...all.map((x) => x.l));
      $('[data-info]', view).innerHTML = `<span><b>${b.t}</b> ET</span><span>收 <b>$${F(b.c)}</b> <em class="${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '+' : ''}${F(ch)}%</em></span><span>VWAP <b>$${F(vwNow)}</b></span><span>今日高 $${F(hi)}／低 $${F(lo)}</span><span>開市 $${F(day.open)}</span><span>第 ${i + 1}/${N} 支</span>`;
      renderOrder(); renderLog();
    }

    function renderOrder() {
      const box = $('[data-order]', view);
      if (done) { box.innerHTML = ''; return; }
      const b = cur();
      if (pos) {
        const live = (pos.side === 'long' ? b.c - pos.entry : pos.entry - b.c) / pos.rps;
        box.innerHTML = `<div class="card sim-pos"><div class="card-h">📍 持倉中：${pos.side === 'long' ? 'Long' : 'Short'} ${pos.shares} 股</div>
          <div class="stats">${stat('入場', '$' + F(pos.entry))}${stat('浮動', signR(live), live >= 0 ? 'pos' : 'neg')}${stat('浮動盈虧', money(live * pos.rps * pos.shares), live >= 0 ? 'pos' : 'neg')}</div>
          <div class="tool-grid"><label class="fld"><span>Stop</span><input type="number" step="0.01" data-ps value="${pos.stop}"></label><label class="fld"><span>Target（可留空）</span><input type="number" step="0.01" data-pt value="${pos.target || ''}"></label></div>
          <div class="tool-foot"><button class="btn sm" data-upd>更新 Stop／Target</button><button class="btn sm" data-be>Stop 移去成本</button><button class="btn sm danger" data-flat>以 $${F(b.c)} 平倉</button></div>
          <p class="tool-fine">Stop 移遠會被記錄為「移遠 Stop」錯誤。</p></div>`;
        box.querySelector('[data-upd]').addEventListener('click', () => {
          const ns = parseFloat(box.querySelector('[data-ps]').value), nt = parseFloat(box.querySelector('[data-pt]').value);
          const wrongSide = pos.side === 'long' ? ns >= b.c : ns <= b.c;
          if (!isFinite(ns) || wrongSide) { App.toast('Stop 位置唔啱'); return; }
          if ((pos.side === 'long' && ns < pos.stop) || (pos.side === 'short' && ns > pos.stop)) pos.widened = true;
          pos.stop = ns; pos.target = isFinite(nt) ? nt : null; draw(); App.toast('已更新');
        });
        box.querySelector('[data-be]').addEventListener('click', () => { if ((pos.side === 'long' && b.c <= pos.entry) || (pos.side === 'short' && b.c >= pos.entry)) { App.toast('而家價格未有利，唔可以移去成本'); return; } pos.stop = pos.entry; draw(); });
        box.querySelector('[data-flat]').addEventListener('click', () => { exit(b.c, i, '手動平倉'); draw(); });
        return;
      }
      if (pend) {
        box.innerHTML = `<div class="card"><div class="card-h">⏳ 等待觸發：${pend.side === 'long' ? 'Buy' : 'Sell'} Stop $${F(pend.entry)}</div><p>${pend.shares} 股｜Stop $${F(pend.stop)}｜Target ${pend.target ? '$' + F(pend.target) : '—'}</p><button class="btn sm" data-cancel>取消掛單</button></div>`;
        box.querySelector('[data-cancel]').addEventListener('click', () => { pend = null; draw(); });
        return;
      }
      const last = ui.last || {};
      box.innerHTML = `<div class="card"><div class="card-h">📝 落單</div>
        <div class="seg"><button data-side="long" class="${last.side !== 'short' ? 'on' : ''}">▲ Long</button><button data-side="short" class="${last.side === 'short' ? 'on' : ''}">▼ Short</button></div>
        <div class="tool-grid">
          <label class="fld"><span>入場方式</span><select data-otype><option value="mkt">市價（下一支開市成交）</option><option value="stop">Stop 觸發價</option></select></label>
          <label class="fld" data-trig hidden><span>觸發價</span><input type="number" step="0.01" data-tp value="${F(b.h + 0.05)}"></label>
          <label class="fld"><span>Stop</span><input type="number" step="0.01" data-st value="${F(b.l - 0.10)}"></label>
          <label class="fld"><span>Target（可留空）</span><input type="number" step="0.01" data-tg></label>
          <label class="fld wide"><span>入場理由（寫低先落單，會存入日誌）</span><input data-why placeholder="例如：回測 ORH 守住，VWAP 上方，RS 強"></label>
        </div><div data-calc class="sim-calc"></div>
        <div class="tool-foot"><button class="btn primary" data-go>確認落單</button></div>
        <p class="tool-fine">每筆風險 ${ui.risk}%（$${F(risk$())}）。市價單假設滑價 $${SLIP}。</p></div>`;
      let side = last.side === 'short' ? 'short' : 'long';
      const q = (s) => box.querySelector(s);
      const calc = () => {
        const mk = q('[data-otype]').value === 'mkt';
        q('[data-trig]').hidden = mk;
        const e = mk ? b.c : parseFloat(q('[data-tp]').value), st = parseFloat(q('[data-st]').value), tg = parseFloat(q('[data-tg]').value);
        const rps = side === 'long' ? e - st : st - e;
        if (!(rps > 0)) { q('[data-calc]').innerHTML = '<span class="neg">Stop 要喺入場價嘅' + (side === 'long' ? '下方' : '上方') + '</span>'; return null; }
        const sh = Math.floor(risk$() / (rps + SLIP));
        const rr = isFinite(tg) ? (side === 'long' ? tg - e : e - tg) / rps : null;
        q('[data-calc]').innerHTML = `每股風險 $${F(rps)}｜<b>${sh} 股</b>｜${rr != null ? `R:R <b class="${rr >= 2 ? 'pos' : 'neg'}">${F(rr)}</b>` : '冇 Target（手動／Trailing）'}${sh < 1 ? '<br><span class="neg">風險預算唔夠買 1 股</span>' : ''}`;
        return { mk, e, st, tg: isFinite(tg) ? tg : null, rps, sh, rr };
      };
      box.querySelectorAll('[data-side]').forEach((x) => x.addEventListener('click', () => {
        side = x.dataset.side; box.querySelectorAll('[data-side]').forEach((y) => y.classList.toggle('on', y === x));
        q('[data-st]').value = F(side === 'long' ? b.l - 0.10 : b.h + 0.10); q('[data-tp]').value = F(side === 'long' ? b.h + 0.05 : b.l - 0.05); calc();
      }));
      box.querySelectorAll('input,select').forEach((x) => x.addEventListener('input', calc));
      calc();
      q('[data-go]').addEventListener('click', () => {
        const c = calc(); if (!c || c.sh < 1) return;
        if (i >= N - 2) { App.toast('就收市，唔開新倉'); return; }
        ui.last = { side }; saveUI();
        const o = { side, entry: c.mk ? null : c.e, stop: c.st, target: c.tg, shares: c.sh, why: q('[data-why]').value.trim(), planRR: c.rr, mk: c.mk, placedIdx: i };
        if (c.mk) { pend = Object.assign(o, { entry: c.e, market: true }); } else pend = o;
        App.toast(c.mk ? '市價單：下一支開市成交' : '已掛 Stop 單'); draw();
      });
    }
    const stat = (l, v, cls) => `<div class="stat ${cls || ''}"><span>${l}</span><b>${v}</b></div>`;

    function exit(px, idx, why) {
      const d = pos.side === 'long' ? 1 : -1;
      pos.exit = +px.toFixed(2); pos.outIdx = idx; pos.outWhy = why;
      pos.r = (pos.exit - pos.entry) * d / pos.rps;
      pos.pnl = (pos.exit - pos.entry) * d * pos.shares;
      trades.push(pos); pos = null;
      App.toast(`${why}：${signR(trades[trades.length - 1].r)}`);
    }

    function step() {
      if (done) return;
      if (i >= N - 1) { finish(); return; }
      i++;
      const b = cur();
      if (pend) {
        const L = pend.side === 'long';
        let fill = null;
        if (pend.market) fill = b.o + (L ? SLIP : -SLIP);
        else if (L ? b.h >= pend.entry : b.l <= pend.entry) fill = L ? Math.max(pend.entry, b.o) : Math.min(pend.entry, b.o);
        if (fill != null) {
          const rps = L ? fill - pend.stop : pend.stop - fill;
          if (rps <= 0) { App.toast('跳空跳過咗 Stop，單取消'); pend = null; }
          else { pos = Object.assign({}, pend, { entry: +fill.toFixed(2), rps, origStop: pend.stop, inIdx: i, time: b.t, hi: b.h, lo: b.l }); pend = null; }
        }
      }
      if (pos) {
        const L = pos.side === 'long';
        pos.hi = Math.max(pos.hi, b.h); pos.lo = Math.min(pos.lo, b.l);
        const stopHit = L ? b.l <= pos.stop : b.h >= pos.stop;
        const gapStop = L ? b.o <= pos.stop : b.o >= pos.stop;
        const tgtHit = pos.target != null && (L ? b.h >= pos.target : b.l <= pos.target);
        if (gapStop && pos.inIdx !== i) exit(b.o, i, '跳空穿 Stop');
        else if (stopHit) exit(pos.stop, i, pos.stop === pos.entry ? '成本價止蝕' : '止蝕');
        else if (tgtHit) exit(pos.target, i, '到 Target');
      }
      if (i >= N - 1) { if (pos) exit(cur().c, i, '收市平倉'); pend = null; draw(); finish(); return; }
      draw();
    }

    function renderLog() {
      const box = $('[data-log]', view);
      if (!trades.length) { box.innerHTML = '<div class="card muted sim-tip">💡 提示：先睇開市頭幾支、畫低 PDH／PDL／VWAP 關係，等你嘅 Setup 出現先落單。一日零交易都係合理結果。</div>'; return; }
      const tot = trades.reduce((a, t) => a + t.r, 0);
      box.innerHTML = `<div class="card"><div class="card-h">📋 今日交易（${trades.length}）<small class="${tot >= 0 ? 'pos' : 'neg'}">${signR(tot)}</small></div>${trades.map((t, k) => `<div class="sim-trade"><b>${k + 1}. ${t.side === 'long' ? 'Long' : 'Short'}</b> ${t.time} @ $${F(t.entry)} → $${F(t.exit)}（${t.outWhy}）<em class="${t.r >= 0 ? 'pos' : 'neg'}">${signR(t.r)}</em></div>`).join('')}</div>`;
    }

    function finish() {
      if (done) return; done = true; clearInterval(auto);
      if (pos) exit(cur().c, i, '收市平倉');
      i = N - 1; draw();
      const tot = trades.reduce((a, t) => a + t.r, 0), pnl = trades.reduce((a, t) => a + t.pnl, 0);
      const u = Store.user(); const st = u.toolState.sim = u.toolState.sim || { days: 0, trades: 0, r: 0, guess: 0 };
      st.days++; st.trades += trades.length; st.r = +(st.r + tot).toFixed(2); Store.save();
      Store.logAct('drill'); Store.awardXP('sim:' + day.seed, 5);
      App.modal(`<h3>🔔 收市！</h3><p>今日其實係：<b>${TYPES[day.type]}</b>（開市 $${F(day.open)}，收市 $${F(day.bars[N - 1].c)}）</p>
        <div class="stats">${stat('交易筆數', trades.length)}${stat('總 R', signR(tot), tot >= 0 ? 'pos' : 'neg')}${stat('模擬盈虧', money(pnl), pnl >= 0 ? 'pos' : 'neg')}</div>
        <p class="muted">累積：${st.days} 日、${st.trades} 筆、${signR(st.r)}</p>
        ${trades.length ? `<label class="fld"><span>你有冇跟足自己嘅規則？</span><select data-fol><option value="yes">✅ 有</option><option value="no">❌ 冇</option></select></label><label class="fld"><span>一句教訓</span><input data-lesson placeholder="例如：區間日唔應該追突破"></label>` : '<p>今日冇交易 —— 如果係因為冇 Setup，呢個係好決定 👍</p>'}
        <div class="modal-actions">${trades.length ? '<button class="btn" data-save>📒 存入交易日誌（Replay）</button>' : ''}<button class="btn primary" data-again>🔄 再嚟一日</button></div>`, (box, close) => {
        const sv = box.querySelector('[data-save]');
        if (sv) sv.addEventListener('click', () => {
          const fol = box.querySelector('[data-fol]').value, lesson = box.querySelector('[data-lesson]').value;
          u.journal = u.journal || [];
          trades.forEach((t) => u.journal.push({ id: Store.uid(), ts: Date.now(), kind: 'replay', date: Store.today(), time: t.time, symbol: 'SIM', setup: '模擬器練習', market: MARKET[day.type], side: t.side, plannedEntry: t.entry, entry: t.entry, stop: t.origStop != null ? t.origStop : t.stop, target: t.target, shares: t.shares, exit: t.exit, fees: 0, hi: t.hi, lo: t.lo, followed: fol, analysis: t.r > 0 ? 'correct' : 'wrong', mistakes: t.widened ? ['移遠 Stop'] : [], reason: t.why, lesson, notes: `模擬器：${TYPES[day.type]}；出場：${t.outWhy}` }));
          Store.emit('journal'); App.toast('已存入 📒 交易日誌'); sv.disabled = true;
        });
        box.querySelector('[data-again]').addEventListener('click', () => { close(); play(view); });
      });
    }

    view.querySelector('[data-next]').addEventListener('click', step);
    view.querySelector('[data-n5]').addEventListener('click', () => { for (let k = 0; k < 5 && !done; k++) step(); });
    view.querySelector('[data-eod]').addEventListener('click', () => { if (pos || pend) { if (!confirm('你有持倉／掛單，會按規則自動處理直到收市。繼續？')) return; } while (!done) step(); });
    view.querySelector('[data-auto]').addEventListener('click', (e) => {
      if (auto) { clearInterval(auto); auto = null; e.target.textContent = '⏯ 自動'; return; }
      e.target.textContent = '⏸ 暫停';
      auto = autoTimer = setInterval(() => { if (!location.hash.startsWith('#/sim') || done) { clearInterval(auto); auto = null; return; } step(); }, 900);
    });
    view.querySelector('[data-new]').addEventListener('click', () => { if (trades.length && !done && !confirm('放棄今日？')) return; clearInterval(auto); play(view); });
    view.querySelectorAll('[data-set]').forEach((s) => s.addEventListener('change', () => { ui[s.dataset.set] = s.dataset.set === 'risk' ? +s.value : s.value; saveUI(); if (s.dataset.set === 'zoom') draw(); else if (s.dataset.set === 'type' && !trades.length && !pos) play(view); }));
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = (e) => { if (!location.hash.startsWith('#/sim')) { document.removeEventListener('keydown', keyHandler); keyHandler = null; return; } if (e.target.closest('input,textarea,select,.modal')) return; if (e.key === 'ArrowRight') { e.preventDefault(); step(); } };
    document.addEventListener('keydown', keyHandler);
    draw();
  }

  window.Sim = { play, makeDay };
})();
