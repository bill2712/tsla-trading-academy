/* =========================================================
 * Level 6–8 互動工具（教學用途，唔係投資建議）
 * ========================================================= */
(function () {
  const TOOLS = window.TOOLS;
  const { F, money, pct, signR, esc, stat, big, verdict, simpleTool } = window.ToolUtil;
  const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const table = (head, rows) => `<div class="tbl-scroll"><table class="mini-tbl wide"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;

  /* ---------------- 多時間框架對齊 ---------------- */
  TOOLS['mtf-align'] = {
    title: '多時間框架對齊檢查', icon: '🧭', cat: '市場環境', level: 'l6',
    desc: '揀日線、15 分鐘、5 分鐘嘅狀態同你想做嘅方向，睇吓對齊程度同建議。',
    render: simpleTool({
      note: '教學用途｜大時間框架嘅位置同方向優先。',
      defaults: { dir: 'long', d1: 'up', m15: 'up', m5: 'pull', room: 2.4 },
      fields: [
        { k: 'dir', label: '你想研究嘅方向', type: 'select', options: [['long', 'Long'], ['short', 'Short']] },
        { k: 'd1', label: '日線', type: 'select', options: [['up', '升勢'], ['down', '跌勢'], ['range', '區間']] },
        { k: 'm15', label: '15 分鐘', type: 'select', options: [['up', '升勢 HH+HL'], ['down', '跌勢 LH+LL'], ['range', '區間']] },
        { k: 'm5', label: '5 分鐘', type: 'select', options: [['pull', '回調完、轉返順大方向'], ['with', '順大方向推進中'], ['against', '逆大方向走緊'], ['chop', '冇方向']] },
        { k: 'room', label: '去到大時間框架阻力／支持前有幾多 R', step: 0.1 },
      ],
      compute: (s) => {
        const want = s.dir === 'long' ? 'up' : 'down';
        let score = 0; const notes = [];
        if (s.d1 === want) { score += 3; notes.push('✅ 日線同方向'); } else if (s.d1 === 'range') { score += 1; notes.push('➖ 日線區間：目標要保守'); } else notes.push('❌ 日線相反：屬逆大勢交易');
        if (s.m15 === want) { score += 3; notes.push('✅ 15 分鐘同方向'); } else if (s.m15 === 'range') { score += 1; notes.push('➖ 15 分鐘區間'); } else notes.push('❌ 15 分鐘相反');
        if (s.m5 === 'pull') { score += 3; notes.push('✅ 5 分鐘回調完、轉返順勢：最佳執行時機'); } else if (s.m5 === 'with') { score += 2; notes.push('➖ 5 分鐘推進中：小心追高，等回調'); } else if (s.m5 === 'against') notes.push('⏳ 5 分鐘逆向：等佢轉返'); else notes.push('❌ 5 分鐘冇方向');
        if (s.room < 1.5) notes.push(`❌ 去到大時間框架位置前只有 ${F(s.room, 1)}R：空間唔夠`);
        else if (s.room < 2) notes.push(`➖ 空間 ${F(s.room, 1)}R：勉強`); else { score += 1; notes.push(`✅ 空間 ${F(s.room, 1)}R`); }
        const grade = s.room < 1.5 ? 'C' : score >= 9 ? 'A+' : score >= 6 ? 'B' : 'C';
        const act = { 'A+': '三層對齊：可以按正常風險等你嘅 Setup 同 Trigger。', B: '部分對齊：減半風險、只做最清晰嘅 Trigger，或者只做 Paper。', C: '唔對齊或者空間唔夠：記錄落候選，唔做。' }[grade];
        return `${big('對齊級別', grade, `（${score}/10 分）`, grade === 'A+' ? 'pos' : grade === 'C' ? 'neg' : '')}<ul class="tool-list">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>${verdict(grade === 'A+' ? true : grade === 'C' ? false : null, act)}`;
      },
    }),
  };

  /* ---------------- Gap 分析 ---------------- */
  TOOLS['gap-analyzer'] = {
    title: 'Gap 分類器', icon: '🕳️', cat: '市場環境', level: 'l6',
    desc: '輸入昨日收市、PDH / PDL、今日開市、日 ATR，自動計 Gap %、相對 ATR，同埋要留意嘅劇本。',
    render: simpleTool({
      note: '教學用途｜數字例子係模擬。',
      defaults: { pc: 384.90, pdh: 386.20, pdl: 380.40, open: 389.80, atr: 14, news: 'yes', pmvol: 'high', mkt: 'down' },
      fields: [
        { k: 'pc', label: '昨日收市', step: 0.01 }, { k: 'pdh', label: 'PDH 昨日高位', step: 0.01 }, { k: 'pdl', label: 'PDL 昨日低位', step: 0.01 },
        { k: 'open', label: '今日開市（或 Pre-market 價）', step: 0.01 }, { k: 'atr', label: '日 ATR（$）', step: 0.1 },
        { k: 'news', label: '有冇實質新聞？', type: 'select', options: [['yes', '有（業績、交付數字等）'], ['no', '冇／唔清楚']] },
        { k: 'pmvol', label: 'Pre-market 成交量', type: 'select', options: [['high', '明顯多過平時'], ['normal', '一般'], ['low', '好少']] },
        { k: 'mkt', label: '大市（QQQ）Pre-market', type: 'select', options: [['up', '升'], ['flat', '平'], ['down', '跌']] },
      ],
      compute: (s) => {
        const gap = s.open - s.pc, gp = gap / s.pc, ga = Math.abs(gap) / s.atr;
        const up = gap > 0;
        const outside = up ? s.open > s.pdh : s.open < s.pdl;
        const size = ga < 0.25 ? '細' : ga < 0.75 ? '中' : '大';
        const same = (up && s.mkt === 'up') || (!up && s.mkt === 'down');
        const lines = [];
        lines.push(`${outside ? '📍 開喺昨日區間<b>外面</b>（' + (up ? 'PDH 上方' : 'PDL 下方') + '）：市場可能已經接受新價格。' : '📍 開喺昨日區間<b>入面</b>：未有新共識，較似普通日。'}`);
        lines.push(`📏 Gap 大小 ${F(ga, 2)} × ATR（${size}）。${ga < 0.25 ? '細 Gap 通常唔使特別處理。' : ga >= 0.75 ? '大 Gap：有事發生，波幅同 Spread 都會大，倉位要細。' : ''}`);
        lines.push(s.news === 'yes' ? '📰 有實質新聞：延續（Gap & Go）嘅機會較高，但開市頭幾分鐘假動作都多。' : '📰 冇明顯新聞：Gap Fill 或者拉鋸嘅機會較高（要用自己數據驗證）。');
        lines.push(s.pmvol === 'low' ? '🔇 Pre-market 量少：PMH / PML 參考價值較低。' : s.pmvol === 'high' ? '🔊 Pre-market 量多：PMH / PML 係重要參考位。' : '🔉 Pre-market 量一般。');
        lines.push(same ? '🌐 大市同方向：有利延續。' : s.mkt === 'flat' ? '🌐 大市平：睇 TSLA 自己嘅力度。' : '🌐 大市相反：要更小心，留意 RS。');
        const watch = up
          ? ['A. Gap & Go：守住開市價同 VWAP，升穿 PMH 並守住', 'B. Gap Fill：跌穿開市價同 VWAP，向昨收 ' + F(s.pc) + ' 回落', 'C. Gap & Trap：開市衝高後急跌穿開市價（追高者被困）']
          : ['A. Gap & Go（向下）：守喺開市價同 VWAP 下方，跌穿 PML', 'B. Gap Fill：重返開市價同 VWAP 上方，向昨收 ' + F(s.pc) + ' 回升', 'C. Gap & Trap：開市急跌後急速收復開市價'];
        return `${big('Gap', (gp >= 0 ? '+' : '') + F(gp * 100, 2) + '%', `（${gap >= 0 ? '+' : '−'}$${F(Math.abs(gap))}）`, gp >= 0 ? 'pos' : 'neg')}
          <ul class="tool-list">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
          <h5>開市後要留意嘅劇本</h5><ul class="tool-list">${watch.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
          <p class="tool-fine">Gap 分類係 Context，唔係入場訊號。開市頭 15 分鐘建議先觀察。</p>`;
      },
    }),
  };

  /* ---------------- 相對強弱 ---------------- */
  TOOLS['rel-strength'] = {
    title: '相對強弱計算（TSLA vs QQQ）', icon: '💪', cat: '市場環境', level: 'l6',
    desc: '輸入兩隻嘅起點價同現價，計升跌幅差、按 Beta 調整後嘅相對強弱。',
    render: simpleTool({
      note: '起點可以用昨日收市或者今日開市，但兩隻要一致。Beta 只係粗略估計，會隨時間改變。',
      defaults: { s0: 384.90, s1: 393.75, b0: 590.00, b1: 587.05, beta: 2 },
      fields: [
        { k: 's0', label: 'TSLA 起點價', step: 0.01 }, { k: 's1', label: 'TSLA 現價', step: 0.01 },
        { k: 'b0', label: 'QQQ 起點價', step: 0.01 }, { k: 'b1', label: 'QQQ 現價', step: 0.01 },
        { k: 'beta', label: 'TSLA Beta（粗略）', step: 0.1 },
      ],
      compute: (s) => {
        const a = s.s1 / s.s0 - 1, b = s.b1 / s.b0 - 1;
        const raw = a - b, adj = a - s.beta * b;
        const lvl = adj > 0.01 ? '明顯相對強' : adj > 0.003 ? '略強' : adj < -0.01 ? '明顯相對弱' : adj < -0.003 ? '略弱' : '同大市差唔多';
        return `<div class="stats">${stat('TSLA 升跌', pct(a, 2), a >= 0 ? 'pos' : 'neg')}${stat('QQQ 升跌', pct(b, 2), b >= 0 ? 'pos' : 'neg')}${stat('簡單差距', pct(raw, 2), raw >= 0 ? 'pos' : 'neg')}${stat('按 Beta 預期 TSLA', pct(s.beta * b, 2))}${stat('Beta 調整後 RS', pct(adj, 2), adj >= 0 ? 'pos' : 'neg')}</div>
          ${verdict(adj > 0.003 ? true : adj < -0.003 ? false : null, `TSLA ${lvl}。${adj > 0.003 ? '做 Long 較有利（仍然要等 Setup）。' : adj < -0.003 ? 'Long 要小心；Short（進階）較符合 RS。' : '方向唔明顯，Context 中性。'}`)}`;
      },
    }),
  };

  /* ---------------- 事件日風險 ---------------- */
  TOOLS['event-risk'] = {
    title: '事件日風險檢查', icon: '📅', cat: '市場環境', level: 'l6',
    desc: '剔選今日有咩事件，得出風險級別、建議注碼同避開時段。',
    render(el, ctx) {
      const EV = [
        ['earn', 'TSLA 業績（昨晚／今晚）', 3], ['deliv', 'TSLA 季度交付數字', 3], ['cpi', 'CPI 通脹數據（08:30 ET）', 2], ['nfp', '非農就業（08:30 ET）', 2],
        ['fomc', 'FOMC 利率決議（14:00 ET）', 3], ['opex', '每月期權到期（第三個星期五）', 1], ['event', 'TSLA 產品／股東大會', 2], ['news', '突發新聞／Halt 剛剛出現', 3], ['tired', '自己瞓得唔夠／情緒差', 2],
      ];
      const s = ctx.load({ on: {} });
      el.innerHTML = `<div class="tag-pick col">${EV.map(([k, t]) => `<label><input type="checkbox" data-e="${k}" ${s.on[k] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div><div class="tool-out"></div><p class="tool-fine">事件日期同時間以官方公布為準。</p>`;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const on = EV.filter(([k]) => s.on[k]);
        const score = on.reduce((a, e) => a + e[2], 0), max = on.reduce((a, e) => Math.max(a, e[2]), 0);
        const lv = max >= 3 || score >= 5 ? 'high' : score >= 2 ? 'mid' : 'low';
        const rules = [];
        if (s.on.earn || s.on.deliv) rules.push('TSLA 自身事件：只觀察，或者風險減半；開市頭 15 分鐘唔入場。');
        if (s.on.cpi || s.on.nfp) rules.push('08:30 數據：開市方向可能大幅改變，唔好預先持倉。');
        if (s.on.fomc) rules.push('FOMC：13:45 後唔開新倉、14:00 前平倉；14:30 記者會期間波幅仍大。');
        if (s.on.opex) rules.push('期權到期日：某啲整數價位附近可能特別黐，突破要更多確認。');
        if (s.on.news) rules.push('突發新聞／Halt：重開嗰刻唔好衝動入場，等 15 分鐘再評估。');
        if (s.on.tired) rules.push('自己狀態差：今日只觀察，做 Replay 都可以。');
        out.innerHTML = `${big('今日事件風險', { high: '高', mid: '中', low: '低' }[lv], '', lv === 'high' ? 'neg' : lv === 'low' ? 'pos' : '')}
          ${stat('建議風險', { high: '0（只觀察）或 1/2', mid: '1/2', low: '正常' }[lv])}
          ${rules.length ? `<ul class="tool-list">${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : verdict(true, '冇剔選事件：照常按計劃，但仍要留意突發新聞。')}`;
      };
      el.querySelectorAll('[data-e]').forEach((c) => c.addEventListener('change', () => { s.on[c.dataset.e] = c.checked; ctx.save(s); upd(); }));
      upd();
    },
  };

  /* ---------------- 出場方法模擬 ---------------- */
  function simTrades(p, seed) {
    const r = rng(seed), out = { fixed: [], atr: [], struct: [], time: [] };
    for (let n = 0; n < p.n; n++) {
      const path = []; let c = 0;
      for (let i = 0; i < p.bars; i++) {
        const o = c; c = o + p.drift + p.vol * gauss(r);
        const h = Math.max(o, c) + Math.abs(gauss(r)) * p.vol * 0.45, l = Math.min(o, c) - Math.abs(gauss(r)) * p.vol * 0.45;
        path.push({ o, h, l, c });
      }
      const run = (mode) => {
        let stop = -1, hi = 0;
        for (let i = 0; i < path.length; i++) {
          const b = path[i];
          if (b.o <= stop) return b.o;
          if (b.l <= stop) return stop;
          if ((mode === 'fixed' || mode === 'time') && b.h >= p.target) return Math.max(p.target, b.o);
          if (mode === 'time' && i + 1 >= p.tbars && b.c < 0.5 && b.c > stop) return b.c;
          hi = Math.max(hi, b.h);
          if (mode === 'atr') stop = Math.max(stop, hi - p.k * p.vol * 1.6);
          if (mode === 'struct' && i >= 2) { const lo = Math.min(path[i].l, path[i - 1].l, path[i - 2].l); if (hi >= 1) stop = Math.max(stop, lo); }
        }
        return path[path.length - 1].c;
      };
      out.fixed.push(run('fixed')); out.atr.push(run('atr')); out.struct.push(run('struct')); out.time.push(run('time'));
    }
    return out;
  }
  const sumStats = (rs) => { const n = rs.length, w = rs.filter((x) => x > 0); let eq = 0, pk = 0, dd = 0; rs.forEach((x) => { eq += x; pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq); }); return { exp: eq / n, wr: w.length / n, avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0, best: Math.max(...rs), dd }; };
  TOOLS['trail-sim'] = {
    title: '出場方法比較模擬', icon: '🎯', cat: '交易管理', level: 'l7',
    desc: '用同一批隨機價格路徑，比較固定目標、ATR Trailing、結構 Trailing、時間止損嘅期望值同回撤。',
    render(el, ctx) {
      const d = { drift: 0.03, vol: 0.35, bars: 30, target: 2, k: 2, tbars: 8, n: 400, seed: 7 };
      const s = ctx.load(Object.assign({}, d));
      const f = (k, l, step) => `<label class="fld"><span>${l}</span><input type="number" step="${step}" data-k="${k}" value="${s[k]}"></label>`;
      el.innerHTML = `<p class="tool-note">價格以 R 為單位（Entry = 0，初始 Stop = −1R）。「趨勢傾向」= 每支 K 線平均有利移動；設 0 = 冇 Edge。全部係隨機模擬，唔代表真實市場。</p>
        <div class="tool-grid">${f('drift', '趨勢傾向（每支，R）', 0.01)}${f('vol', '波幅（每支，R）', 0.05)}${f('bars', '最多持有 K 線數', 1)}${f('target', '固定目標（R）', 0.5)}${f('k', 'ATR Trailing 倍數', 0.5)}${f('tbars', '時間止損（K 線數）', 1)}${f('n', '模擬筆數', 50)}</div>
        <div class="tool-out"></div><div class="tool-foot"><button class="btn sm" data-re>🎲 重新抽樣</button><button class="btn ghost sm" data-reset>↺ 重設</button></div>`;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const p = Object.assign({}, s, { n: Math.min(2000, Math.max(50, s.n | 0)), bars: Math.min(120, Math.max(3, s.bars | 0)) });
        const res = simTrades(p, s.seed);
        const names = { fixed: `固定 ${F(p.target, 1)}R 目標`, atr: `ATR Trailing（${F(p.k, 1)}×）`, struct: '結構 Trailing（3 支低位）', time: `時間止損（${p.tbars} 支未到 +0.5R 就走）＋固定目標` };
        const st = {}; Object.keys(res).forEach((k) => (st[k] = sumStats(res[k])));
        const best = Object.keys(st).sort((a, b) => st[b].exp - st[a].exp)[0];
        out.innerHTML = table(['出場方法', '期望值', '勝率', '平均贏', '最大單筆', '最大回撤'], Object.keys(st).map((k) => [`${k === best ? '🏅 ' : ''}${names[k]}`, `<b class="${st[k].exp >= 0 ? 'pos' : 'neg'}">${signR(st[k].exp)}</b>`, pct(st[k].wr, 0), signR(st[k].avgW), signR(st[k].best, 1), F(st[k].dd, 1) + 'R']))
          + `<p class="tool-fine">試吓：將「趨勢傾向」設 0 —— 冇 Edge 時，任何出場方法都救唔到期望值。再試高波幅、長持有時間，Trailing 通常較著數；短線、低趨勢時，固定目標可能較好。每次「重新抽樣」結果都會唔同，所以真實策略要用大量樣本比較。</p>`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = parseFloat(i.value) || 0; ctx.save(s); upd(); }));
      el.querySelector('[data-re]').addEventListener('click', () => { s.seed = Math.floor(Math.random() * 1e6); ctx.save(s); upd(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { ctx.save(Object.assign({}, d)); TOOLS['trail-sim'].render(el, ctx); });
      upd();
    },
  };

  /* ---------------- 相關性與總風險 ---------------- */
  TOOLS['corr-risk'] = {
    title: '多倉位總風險（相關性）', icon: '🔗', cat: '交易管理', level: 'l7',
    desc: '輸入最多 4 個倉嘅方向同風險金額，加上相關性假設，睇真實嘅總風險同 Heat 上限。',
    render(el, ctx) {
      const d = { cap: 10000, heat: 0.5, rho: 0.7, pos: [{ s: 'TSLA', d: 'long', r: 25 }, { s: 'NVDA', d: 'long', r: 25 }, { s: 'QQQ', d: 'long', r: 25 }, { s: '', d: 'long', r: 0 }] };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      el.innerHTML = `<div class="tool-grid"><label class="fld"><span>本金（USD）</span><input type="number" data-g="cap" value="${s.cap}"></label><label class="fld"><span>總風險上限 Heat（% 本金）</span><input type="number" step="0.05" data-g="heat" value="${s.heat}"></label><label class="fld range"><span>同方向倉位相關性：<b data-rv>${F(s.rho, 2)}</b></span><input type="range" min="0" max="1" step="0.05" data-g="rho" value="${s.rho}"></label></div>
        <div class="pos-rows">${s.pos.map((p, i) => `<div class="tool-grid pos-row"><label class="fld"><span>倉 ${i + 1} 股票</span><input data-p="${i}" data-f="s" value="${esc(p.s)}"></label><label class="fld"><span>方向</span><select data-p="${i}" data-f="d"><option value="long" ${p.d === 'long' ? 'selected' : ''}>Long</option><option value="short" ${p.d === 'short' ? 'selected' : ''}>Short</option></select></label><label class="fld"><span>風險（$）</span><input type="number" data-p="${i}" data-f="r" value="${p.r}"></label></div>`).join('')}</div>
        <div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const ps = s.pos.filter((p) => p.r > 0);
        const sum = ps.reduce((a, p) => a + p.r, 0);
        let v = 0; ps.forEach((a) => ps.forEach((b) => { const sign = a.d === b.d ? 1 : -1; v += a.r * b.r * (a === b ? 1 : sign * s.rho); }));
        const eff = Math.sqrt(Math.max(0, v));
        const same = ps.filter((p) => p.d === 'long').reduce((a, p) => a + p.r, 0), sameS = ps.filter((p) => p.d === 'short').reduce((a, p) => a + p.r, 0);
        const worst = Math.max(same, sameS);
        const cap = s.cap * s.heat / 100;
        out.innerHTML = `<div class="stats">${stat('表面總風險（相加）', money(sum))}${stat('同方向最壞情況', money(worst), 'neg')}${stat('按相關性估計嘅「等效風險」', money(eff))}${stat('Heat 上限', money(cap))}</div>
          ${verdict(worst <= cap ? true : false, worst <= cap ? '同方向最壞情況都喺 Heat 上限之內。' : `同方向倉位一齊觸發 Stop 會蝕 ${money(worst)}，超過上限 ${money(cap)}。考慮減細倉位，或者只揀最好嗰個。`)}
          <p class="tool-fine">相關性愈高，「等效風險」愈接近直接相加。大市急跌時相關性通常會升高，所以要以「同方向最壞情況」做上限，唔好靠分散嘅錯覺。</p>`;
      };
      el.querySelectorAll('[data-g]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.g] = parseFloat(i.value) || 0; if (i.dataset.g === 'rho') el.querySelector('[data-rv]').textContent = F(s.rho, 2); ctx.save(s); upd(); }));
      el.querySelectorAll('[data-p]').forEach((i) => i.addEventListener('input', () => { const p = s.pos[+i.dataset.p]; p[i.dataset.f] = i.dataset.f === 'r' ? parseFloat(i.value) || 0 : i.value; ctx.save(s); upd(); }));
      upd();
    },
  };

  /* ---------------- Kelly 與破產風險 ---------------- */
  TOOLS['kelly-ror'] = {
    title: 'Kelly 與破產風險模擬', icon: '🎲', cat: '統計與期望值', level: 'l7',
    desc: '輸入勝率、平均 R、每筆風險 %，計 Kelly，並用 Monte Carlo 估計大回撤機率同權益分佈。',
    render(el, ctx) {
      const d = { wr: 45, avgW: 2, risk: 1, n: 200, dd: 30, seed: 3 };
      const s = ctx.load(Object.assign({}, d));
      const f = (k, l, step) => `<label class="fld"><span>${l}</span><input type="number" step="${step}" data-k="${k}" value="${s[k]}"></label>`;
      el.innerHTML = `<p class="tool-note">假設每筆輸 = −1R、贏 = +平均 R，固定比例注碼（每筆冒當時權益嘅 X%）。模擬 1,000 條權益曲線。</p>
        <div class="tool-grid">${f('wr', '勝率（%）', 1)}${f('avgW', '平均贏（R）', 0.1)}${f('risk', '每筆風險（% 權益）', 0.25)}${f('n', '交易筆數', 10)}${f('dd', '「破產」回撤門檻（%）', 5)}</div>
        <div class="tool-out"></div><div data-chart></div><div class="tool-foot"><button class="btn sm" data-re>🎲 重新模擬</button><button class="btn ghost sm" data-reset>↺ 重設</button></div>`;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const W = s.wr / 100, R = s.avgW, f0 = s.risk / 100, N = Math.min(1000, Math.max(10, s.n | 0));
        const kelly = W - (1 - W) / R, exp = W * R - (1 - W);
        const r = rng(s.seed), sims = 1000, ends = [], paths = []; let ruined = 0;
        const step = Math.max(1, Math.floor(N / 20));
        for (let k = 0; k < sims; k++) {
          let eq = 1, pk = 1, hit = false; const pth = [1];
          for (let i = 0; i < N; i++) { eq *= r() < W ? 1 + f0 * R : 1 - f0; pk = Math.max(pk, eq); if (!hit && (pk - eq) / pk >= s.dd / 100) hit = true; if ((i + 1) % step === 0) pth.push(eq); }
          if (hit) ruined++; ends.push(eq); paths.push(pth);
        }
        ends.sort((a, b) => a - b);
        const q = (p) => ends[Math.floor(p * (ends.length - 1))];
        const pctl = (pp) => paths[0].map((_, i) => { const col = paths.map((x) => x[i]).sort((a, b) => a - b); return (col[Math.floor(pp * (col.length - 1))] - 1) * 100; });
        out.innerHTML = `<div class="stats">${stat('每筆期望值', signR(exp), exp >= 0 ? 'pos' : 'neg')}${stat('Kelly %', kelly > 0 ? F(kelly * 100, 1) + '%' : '≤ 0（冇 Edge）')}${stat('½ Kelly', kelly > 0 ? F(kelly * 50, 1) + '%' : '—')}${stat('你嘅風險 / Kelly', kelly > 0 ? F(f0 / kelly, 2) + '×' : '—')}${stat(`回撤 ≥ ${s.dd}% 機率`, pct(ruined / sims, 1), ruined / sims > 0.1 ? 'neg' : '')}${stat('權益中位數', pct(q(0.5) - 1, 1), q(0.5) >= 1 ? 'pos' : 'neg')}${stat('最差 5%', pct(q(0.05) - 1, 1), 'neg')}</div>
          ${verdict(ruined / sims < 0.05 ? true : ruined / sims > 0.2 ? false : null, kelly <= 0 ? '期望值 ≤ 0：任何注碼方法都唔會長期賺錢，注碼愈大輸得愈快。' : f0 > kelly / 2 ? '每筆風險超過半個 Kelly：回撤會非常大。真實勝率同 R 只係估計，建議大幅降低。' : `每筆 ${s.risk}% 喺呢組假設下回撤風險${ruined / sims < 0.05 ? '較低' : '仍然唔細'}。記住真實勝率同 R 會變。`)}`;
        window.Charts.line(el.querySelector('[data-chart]'), { series: [{ name: '90%', data: pctl(0.9), color: 'var(--up)' }, { name: '中位數', data: pctl(0.5), color: 'var(--accent)', dots: true }, { name: '10%', data: pctl(0.1), color: 'var(--down)' }], labels: paths[0].map((_, i) => (i === 0 ? '0' : String(i * step))), height: 220, format: (x) => (x >= 0 ? '+' : '') + x.toFixed(0) + '%', title: '權益變化分佈（第 10／50／90 百分位）', caption: '綠：好運嘅 10%；藍：中位數；紅：差運嘅 10%。同一套策略，運氣可以令結果相差好遠。' });
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = parseFloat(i.value) || 0; ctx.save(s); upd(); }));
      el.querySelector('[data-re]').addEventListener('click', () => { s.seed = Math.floor(Math.random() * 1e6); ctx.save(s); upd(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { ctx.save(Object.assign({}, d)); TOOLS['kelly-ror'].render(el, ctx); });
      upd();
    },
  };

  /* ---------------- 交易計劃書 ---------------- */
  const PLAN = [
    ['purpose', '1. 目的', '我點解交易？例如：學習系統化思維；一年內完成 Level 1–8 同畢業專題。'],
    ['capital', '2. 資金', '例如：風險資金 US$10,000，輸晒都唔影響生活；唔借錢、唔用槓桿。'],
    ['market', '3. 市場同時間', '例如：只做 TSLA；美東 09:45–11:00（香港 21:45–23:00）；23:30 前收工。'],
    ['strategy', '4. 策略（最多 2–3 個 Playbook）', '例如：TSLA-BR-LONG v2.0；Range Support Reversal（Paper 研究中）。'],
    ['risk', '5. 風險規則', '例如：每筆 0.25%；每日最多虧損 0.75% 或 2 筆；每週最多 2%；每月最多 5%。'],
    ['routine', '6. 每日流程', '例如：開市前報告 → 只做劇本內 Setup → 收市後記錄同每日評分。'],
    ['review', '7. 記錄同檢討', '例如：每日記錄；星期六週檢討；每月第一個星期日月檢討。'],
    ['scale', '8. 升級規則', '例如：Paper 50 筆、期望值 ≥ +0.15R、遵守率 ≥ 90% 先升 Micro。'],
    ['stop', '9. 停止條件', '例如：回撤超過 8R 或者遵守率連續 2 週 < 85% → 降級；回撤 15R → 暫停一個月重新評估。'],
    ['life', '10. 生活界線', '例如：瞓得唔夠只觀察；星期五晚陪家人唔睇市；考試期間暫停。'],
  ];
  TOOLS['plan-doc'] = {
    title: '交易計劃書產生器', icon: '📜', cat: '計劃與規則', level: 'l8',
    desc: '填十個部分，自動整理成一份可以列印、複製或者下載嘅交易計劃書。',
    render(el, ctx) {
      const s = ctx.load({ name: '', version: '1.0' });
      el.innerHTML = `<div class="tool-grid"><label class="fld"><span>名稱</span><input data-k="name" value="${esc(s.name)}" placeholder="例如：Bill 嘅 TSLA 交易計劃"></label><label class="fld"><span>版本</span><input data-k="version" value="${esc(s.version)}"></label>
        ${PLAN.map(([k, t, ph]) => `<label class="fld wide"><span>${t}</span><textarea rows="2" data-k="${k}" placeholder="${esc(ph)}">${esc(s[k] || '')}</textarea></label>`).join('')}</div>
        <div class="tool-foot"><button class="btn sm primary" data-print>🖨️ 預覽／列印</button><button class="btn sm" data-copy>📋 複製</button><button class="btn sm" data-dl>⬇️ 下載 .md</button><button class="btn ghost sm" data-ex>填入示例</button></div>`;
      const md = () => `# ${s.name || '我嘅交易計劃書'}（v${s.version || '1.0'}）\n\n更新日期：${Store.today()}\n\n` + PLAN.map(([k, t]) => `## ${t}\n\n${(s[k] || '（未填）').trim()}\n`).join('\n') + '\n---\n教學用途，唔構成投資建議。';
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.value; ctx.save(s); }));
      el.querySelector('[data-copy]').addEventListener('click', () => (navigator.clipboard ? navigator.clipboard.writeText(md()) : Promise.reject()).then(() => App.toast('已複製'), () => prompt('複製：', md())));
      el.querySelector('[data-dl]').addEventListener('click', () => App.download(`trading-plan-v${s.version || '1'}.md`, md(), 'text/markdown'));
      el.querySelector('[data-ex]').addEventListener('click', () => { if (PLAN.some(([k]) => s[k]) && !confirm('用示例覆蓋已填內容？')) return; PLAN.forEach(([k, , ph]) => (s[k] = ph.replace(/^例如：/, ''))); ctx.save(s); TOOLS['plan-doc'].render(el, ctx); });
      el.querySelector('[data-print]').addEventListener('click', () => {
        App.modal(`<div class="plan-print"><h2>${esc(s.name || '我嘅交易計劃書')} <small>v${esc(s.version)}</small></h2><p class="muted">更新日期：${Store.today()}</p>${PLAN.map(([k, t]) => `<h4>${t}</h4><p>${esc(s[k] || '（未填）').replace(/\n/g, '<br>')}</p>`).join('')}<p class="tool-fine">教學用途，唔構成投資建議。</p></div><div class="modal-actions"><button class="btn primary" data-p>🖨️ 列印</button></div>`, (box) => {
          box.querySelector('[data-p]').addEventListener('click', () => { document.body.classList.add('print-modal'); window.print(); setTimeout(() => document.body.classList.remove('print-modal'), 500); });
        }, { wide: true });
      });
    },
  };

  /* ---------------- 自動週檢討 ---------------- */
  TOOLS['weekly-review'] = {
    title: '自動週／月檢討報告', icon: '📊', cat: '統計與期望值', level: 'l8',
    desc: '由你嘅交易日誌自動計：期望值、遵守率、錯誤成本、按 Setup／市況／時段切片、最常犯錯誤。',
    render(el, ctx) {
      const s = ctx.load({ days: 7, kind: 'all' });
      el.innerHTML = `<div class="tool-grid"><label class="fld"><span>期間</span><select data-k="days"><option value="7">最近 7 日</option><option value="30">最近 30 日</option><option value="90">最近 90 日</option><option value="0">全部</option></select></label>
        <label class="fld"><span>類型</span><select data-k="kind"><option value="all">全部</option><option value="replay">Replay</option><option value="paper">Paper</option><option value="live">真實</option></select></label></div><div class="tool-out"></div>`;
      el.querySelector('[data-k=days]').value = String(s.days); el.querySelector('[data-k=kind]').value = s.kind;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const all = (Store.user().journal || []);
        const since = s.days ? Store.addDays(-s.days + 1) : '0000';
        const ts = all.filter((t) => (t.date || '') >= since && (s.kind === 'all' || (t.kind || 'live') === s.kind)).map((t) => ({ t, c: Journal.calc(t) })).filter((x) => x.c.r != null);
        if (!ts.length) { out.innerHTML = `<div class="empty">呢段期間未有已平倉交易。<br><a href="#/journal/trades">📒 去交易日誌記錄</a>（入面可以載入示範資料試吓）</div>`; return; }
        const rs = ts.map((x) => x.c.r), n = rs.length, tot = rs.reduce((a, b) => a + b, 0);
        const good = ts.filter((x) => x.c.goodProcess), bad = ts.filter((x) => !x.c.goodProcess);
        const costMist = bad.reduce((a, x) => a + x.c.r, 0);
        const slice = (key) => { const m = {}; ts.forEach((x) => { const k = key(x) || '（未填）'; (m[k] = m[k] || []).push(x.c.r); }); return Object.entries(m).map(([k, v]) => [esc(k), v.length, `<b class="${v.reduce((a, b) => a + b, 0) >= 0 ? 'pos' : 'neg'}">${signR(v.reduce((a, b) => a + b, 0) / v.length)}</b>`, signR(v.reduce((a, b) => a + b, 0), 1)]).sort((a, b) => b[1] - a[1]); };
        const hour = (x) => { const h = (x.t.time || '').slice(0, 2); const m = +(x.t.time || '').slice(3, 5); if (!h) return ''; const v = +h + m / 60; return v < 10 ? '09:30–10:00' : v < 11.5 ? '10:00–11:30' : v < 14 ? '11:30–14:00' : '14:00 後'; };
        const mist = {}; ts.forEach((x) => (x.t.mistakes || []).forEach((m) => (mist[m] = (mist[m] || 0) + 1)));
        const topM = Object.entries(mist).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const best = ts.slice().sort((a, b) => b.c.r - a.c.r)[0], worst = ts.slice().sort((a, b) => a.c.r - b.c.r)[0];
        const summary = `【${s.days ? '最近 ' + s.days + ' 日' : '全部'}檢討】${n} 筆，總 ${signR(tot, 1)}，期望值 ${signR(tot / n)}，勝率 ${pct(rs.filter((r) => r > 0).length / n, 0)}，遵守率 ${pct(good.length / n, 0)}，錯誤成本 ${signR(costMist, 1)}。${topM.length ? '最常犯：' + topM.map((m) => m[0]).join('、') + '。' : ''}`;
        out.innerHTML = `<div class="stats">${stat('交易筆數', n)}${stat('總 R', signR(tot, 1), tot >= 0 ? 'pos' : 'neg')}${stat('期望值', signR(tot / n), tot >= 0 ? 'pos' : 'neg')}${stat('勝率', pct(rs.filter((r) => r > 0).length / n, 0))}${stat('遵守率', pct(good.length / n, 0), good.length / n >= 0.9 ? 'pos' : 'neg')}${stat('錯誤成本', signR(costMist, 1), costMist < 0 ? 'neg' : '')}${stat('跟規則交易期望值', good.length ? signR(good.reduce((a, x) => a + x.c.r, 0) / good.length) : '—')}</div>
          <h5>按 Setup</h5>${table(['Setup', '筆數', '期望值', '總 R'], slice((x) => (x.t.setup || '').split('：')[0]))}
          <h5>按市況</h5>${table(['市況', '筆數', '期望值', '總 R'], slice((x) => x.t.market))}
          <h5>按時段（美東）</h5>${table(['時段', '筆數', '期望值', '總 R'], slice(hour))}
          ${topM.length ? `<h5>最常犯錯誤</h5><ul class="tool-list">${topM.map((m) => `<li>${esc(m[0])} × ${m[1]}</li>`).join('')}</ul>` : ''}
          <p>🏅 最好：${esc(best.t.date)} ${signR(best.c.r)}｜📉 最差：${esc(worst.t.date)} ${signR(worst.c.r)}</p>
          ${verdict(costMist < 0 ? false : true, costMist < 0 ? `如果全部跟規則，結果會係 ${signR(tot - costMist, 1)}。下星期最值得改善：${topM.length ? esc(topM[0][0]) : '遵守率'}。` : '冇違規虧損 👍 繼續累積樣本，唔好因為少數結果亂改規則。')}
          <p class="tool-fine">樣本少於 20 筆時，切片結果只係線索，唔係結論。</p>
          <div class="tool-foot"><button class="btn sm" data-copy>📋 複製摘要</button></div>`;
        out.querySelector('[data-copy]').addEventListener('click', () => (navigator.clipboard ? navigator.clipboard.writeText(summary) : Promise.reject()).then(() => App.toast('已複製'), () => prompt('複製：', summary)));
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('change', () => { s[i.dataset.k] = i.dataset.k === 'days' ? +i.value : i.value; ctx.save(s); upd(); }));
      upd();
    },
  };

  /* ---------------- Tilt 自我檢查 ---------------- */
  const TQ = [['sleep', '琴晚瞓得點？', ['夠，精神好', '一般', '唔夠／好攰']], ['losses', '今日連續輸咗幾筆？', ['0', '1', '2 筆或以上']], ['urge', '有冇好想「追返」？', ['冇', '少少', '好想']], ['body', '身體感覺', ['放鬆', '有啲緊張', '心跳快／手震／好煩']], ['rules', '今日有冇違規？', ['冇', '一次細違規', '改過 Stop／加過倉／做咗計劃外交易']], ['focus', '專注程度', ['好專注', '有啲分心', '不停 Refresh 帳戶']]];
  TOOLS['tilt-check'] = {
    title: 'Tilt 自我檢查', icon: '🌡️', cat: '心理與紀律', level: 'l8',
    desc: '六條問題，得出 1–10 分 Tilt 指數同建議行動；可以記錄，睇吓自己嘅情緒模式。',
    render(el, ctx) {
      const s = ctx.load({ a: {}, log: [] });
      el.innerHTML = `${TQ.map(([k, q, opts]) => `<div class="fld wide"><span>${q}</span><div class="tag-pick">${opts.map((o, i) => `<label><input type="radio" name="tilt-${k}" data-q="${k}" value="${i}" ${s.a[k] === i ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div></div>`).join('')}<div class="tool-out"></div><div class="tool-foot"><button class="btn sm primary" data-log>📝 記錄今次</button></div><div data-hist></div>`;
      const out = el.querySelector('.tool-out');
      const score = () => { const v = TQ.reduce((a, [k]) => a + (s.a[k] || 0), 0); return Math.max(1, Math.round(1 + v / 12 * 9)); };
      const act = (x) => (x <= 3 ? ['平靜、專注', '正常交易', true] : x <= 5 ? ['有啲煩躁', '只做 A+ Setup', null] : x <= 7 ? ['明顯不安', '停 30 分鐘，行開，飲水，深呼吸', false] : ['Tilt！', '今日收工，平晒倉，聽日再嚟', false]);
      const hist = () => { el.querySelector('[data-hist]').innerHTML = s.log.length ? `<h5>最近紀錄</h5>${table(['時間', '分數', '狀態'], s.log.slice(-8).reverse().map((l) => [new Date(l.ts).toLocaleString('zh-HK', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }), l.v, act(l.v)[0]]))}` : ''; };
      const upd = () => { const v = score(), a = act(v); out.innerHTML = `${big('Tilt 指數', v, '/ 10', v <= 3 ? 'pos' : v >= 6 ? 'neg' : '')}${verdict(a[2], `${a[0]} → ${a[1]}`)}`; };
      el.querySelectorAll('[data-q]').forEach((r) => r.addEventListener('change', () => { s.a[r.dataset.q] = +r.value; ctx.save(s); upd(); }));
      el.querySelector('[data-log]').addEventListener('click', () => { s.log.push({ ts: Date.now(), v: score() }); s.log = s.log.slice(-60); ctx.save(s); hist(); App.toast('已記錄'); });
      upd(); hist();
    },
  };

  /* ---------------- 升級階梯 ---------------- */
  const STAGES = ['Replay', 'Paper', 'Micro 真倉', '細倉', '正常倉'];
  const NEED = [{ n: 20, exp: 0, adh: 90, dd: 99, unit: '個交易日' }, { n: 50, exp: 0.15, adh: 90, dd: 8, unit: '筆' }, { n: 30, exp: 0.10, adh: 95, dd: 8, unit: '筆' }, { n: 50, exp: 0.10, adh: 95, dd: 10, unit: '筆' }];
  TOOLS['scale-ladder'] = {
    title: '升級階梯評估', icon: '🪜', cat: '計劃與規則', level: 'l8',
    desc: '輸入你而家嘅階段同數據，按預設標準判斷：升級、留級，定降級。可以由交易日誌自動填數。',
    render(el, ctx) {
      const s = ctx.load({ stage: 1, n: 32, exp: 0.18, adh: 92, dd: 5, bad: 0 });
      el.innerHTML = `<div class="tool-grid"><label class="fld"><span>而家階段</span><select data-k="stage">${STAGES.map((t, i) => `<option value="${i}" ${+s.stage === i ? 'selected' : ''}>${i + 1}. ${t}</option>`).join('')}</select></label>
        <label class="fld"><span>今級樣本數</span><input type="number" data-k="n" value="${s.n}"></label><label class="fld"><span>期望值（R）</span><input type="number" step="0.01" data-k="exp" value="${s.exp}"></label>
        <label class="fld"><span>遵守率（%）</span><input type="number" data-k="adh" value="${s.adh}"></label><label class="fld"><span>最大回撤（R）</span><input type="number" step="0.5" data-k="dd" value="${s.dd}"></label>
        <label class="fld"><span>連續遵守率 &lt; 85% 嘅星期數</span><input type="number" data-k="bad" value="${s.bad}"></label></div>
        <div class="tool-foot"><button class="btn sm" data-auto>📒 由交易日誌自動填</button></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const upd = () => {
        const st = +s.stage;
        if (st >= 4) { out.innerHTML = verdict(s.bad >= 2 || s.dd > 15 ? false : true, s.bad >= 2 || s.dd > 15 ? '表現轉差：降一級到「細倉」。降級係保護，唔係失敗。' : '已經係最高一級。繼續監察滾動期望值同遵守率。'); return; }
        const nd = NEED[st];
        const checks = [[s.n >= nd.n, `樣本 ${s.n} / ${nd.n} ${nd.unit}`], [s.exp >= nd.exp, `期望值 ${signR(s.exp)}（要 ≥ ${signR(nd.exp)}）`], [s.adh >= nd.adh, `遵守率 ${s.adh}%（要 ≥ ${nd.adh}%）`]];
        if (nd.dd < 99) checks.push([s.dd < nd.dd, `最大回撤 ${s.dd}R（要 < ${nd.dd}R）`]);
        const demote = s.bad >= 2 && st > 0;
        const ok = checks.every((c) => c[0]);
        out.innerHTML = `<ul class="tool-list">${checks.map((c) => `<li>${c[0] ? '✅' : '⬜'} ${c[1]}</li>`).join('')}</ul>${demote ? verdict(false, `連續 ${s.bad} 星期遵守率低過 85%：降一級到「${STAGES[st - 1]}」。`) : ok ? verdict(true, `符合標準，可以升級到「${STAGES[st + 1]}」。升級後樣本重新計。`) : verdict(null, `留喺「${STAGES[st]}」，繼續累積樣本。未達標：${checks.filter((c) => !c[0]).map((c) => c[1].split('（')[0]).join('、')}。`)}`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = parseFloat(i.value) || 0; ctx.save(s); upd(); }));
      el.querySelector('[data-auto]').addEventListener('click', () => {
        const kind = ['replay', 'paper', 'live', 'live', 'live'][+s.stage];
        const ts = (Store.user().journal || []).filter((t) => (t.kind || 'live') === kind).map((t) => Journal.calc(t)).filter((c) => c.r != null);
        if (!ts.length) { App.toast('交易日誌入面未有呢類交易'); return; }
        let eq = 0, pk = 0, dd = 0; ts.forEach((c) => { eq += c.r; pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq); });
        Object.assign(s, { n: ts.length, exp: +(eq / ts.length).toFixed(2), adh: Math.round(ts.filter((c) => c.goodProcess).length / ts.length * 100), dd: +dd.toFixed(1) });
        ctx.save(s); TOOLS['scale-ladder'].render(el, ctx); App.toast(`已由 ${ts.length} 筆 ${kind} 交易填入`);
      });
      upd();
    },
  };
})();
