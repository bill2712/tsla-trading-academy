/* =========================================================
 * App：路由、目錄、章節頁、書籤／筆記／螢光筆／影片／留言、
 *      閱讀進度、搜尋、使用者、設定
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = $('#view');

  /* ---------------- 課程資料整理 ---------------- */
  const LEVELS = window.COURSE;
  const CHAPTERS = [];
  const CH = {};
  LEVELS.forEach((lv) => {
    lv.chapters.forEach((c, i) => {
      c.level = lv; c.index = i;
      c.sections = parseSections(c.md);
      CHAPTERS.push(c); CH[c.id] = c;
    });
  });
  CHAPTERS.forEach((c, i) => { c.prev = CHAPTERS[i - 1] || null; c.next = CHAPTERS[i + 1] || null; });

  function secIdFor(title, idx, used) {
    const m = title.match(/^(\d+(?:\.\d+)*)\s/);
    let id = m ? 's-' + m[1].replace(/\./g, '-') : 's-x' + (idx + 1);
    while (used.has(id)) id += '_';
    used.add(id);
    return id;
  }
  function parseSections(md) {
    const used = new Set(); const out = [];
    let inBlock = false;
    md.split('\n').forEach((line) => {
      const t = line.trim();
      if (/^:::/.test(t)) { inBlock = t !== ':::'; return; }
      if (inBlock) return;
      const m = line.match(/^##\s+(.+)$/);
      if (m) { const title = m[1].replace(/\*\*/g, '').trim(); out.push({ id: secIdFor(title, out.length, used), title }); }
    });
    return out;
  }

  /* ---------------- 小工具 ---------------- */
  function toast(msg, ms = 2200) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    $('#toast-root').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
  }
  function modal(html, onMount, opts = {}) {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="modal-x" data-close aria-label="關閉">×</button>${html}</div>`;
    root.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    if (onMount) onMount(wrap.querySelector('.modal'), close);
    const f = wrap.querySelector('input,textarea,select'); if (f && !opts.noFocus) setTimeout(() => f.focus(), 50);
    return close;
  }
  function download(name, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function ago(ts) {
    const d = (Date.now() - ts) / 1000;
    const rtf = new Intl.RelativeTimeFormat('zh-HK', { numeric: 'auto' });
    if (d < 60) return '啱啱';
    if (d < 3600) return rtf.format(-Math.round(d / 60), 'minute');
    if (d < 86400) return rtf.format(-Math.round(d / 3600), 'hour');
    if (d < 86400 * 30) return rtf.format(-Math.round(d / 86400), 'day');
    return new Date(ts).toLocaleDateString('zh-HK');
  }
  const go = (h) => { if (location.hash === h) route(); else location.hash = h; };

  /* ---------------- 進度計算 ---------------- */
  function seenMap(uid) { const u = Store.user(uid); u.seen = u.seen || {}; return u.seen; }
  function chapterPct(c, uid) {
    const u = Store.user(uid);
    if (u.read[c.id]) return 1;
    const s = (u.seen || {})[c.id] || {};
    const n = c.sections.length || 1;
    return Math.min(0.99, Object.keys(s).length / n);
  }
  function levelStats(lv, uid) {
    const u = Store.user(uid);
    const done = lv.chapters.filter((c) => u.read[c.id]).length;
    const pctSum = lv.chapters.reduce((a, c) => a + chapterPct(c, uid), 0);
    return { done, total: lv.chapters.length, pct: pctSum / lv.chapters.length };
  }
  function overall(uid) {
    const u = Store.user(uid);
    const done = CHAPTERS.filter((c) => u.read[c.id]).length;
    return { done, total: CHAPTERS.length, pct: CHAPTERS.reduce((a, c) => a + chapterPct(c, uid), 0) / CHAPTERS.length };
  }
  const RANKS = [[0, '新手觀察員', '🌱'], [100, '圖表學徒', '🕯️'], [300, 'Setup 獵人', '🎯'], [600, '風險管理員', '🛡️'], [1000, '系統建構師', '🏗️'], [1500, '策略驗證師', '🔬'], [2200, '紀律大師', '🧘']];
  function rank(xp) {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i][0]) { r = RANKS[i]; next = RANKS[i + 1] || null; } }
    return { name: r[1], icon: r[2], min: r[0], next };
  }
  function badges(uid) {
    const u = Store.user(uid);
    const list = [];
    LEVELS.forEach((lv) => { const s = levelStats(lv, uid); if (s.done === s.total) list.push(['🏅', lv.code + ' 畢業']); });
    const fulls = Object.keys(u.quiz).filter((k) => QUIZZES[k] && QUIZZES[k].final && u.quiz[k].best === u.quiz[k].total);
    if (fulls.length) list.push(['💯', `期末測驗滿分 ×${fulls.length}`]);
    if ((u.streak.best || 0) >= 7) list.push(['🔥', '連續學習 7 日']);
    if ((u.streak.best || 0) >= 3) list.push(['✨', '連續學習 3 日']);
    if ((u.journal || []).length >= 10) list.push(['📒', '記錄 10 筆交易']);
    if (Object.keys(u.notes).length >= 10) list.push(['✍️', '寫咗 10 個筆記']);
    if (Object.keys(u.replay || {}).length >= 3) list.push(['🎮', '玩過 3 個重播']);
    if (u.highlights.length >= 10) list.push(['🖍️', '螢光筆達人']);
    return list;
  }

  /* ---------------- Markdown → HTML ---------------- */
  marked.setOptions({ gfm: true, breaks: false });
  const CALLOUT = {
    warn: ['⚠️', '注意'], info: ['ℹ️', '補充'], tip: ['💡', '小貼士'], key: ['🔑', '重點'], coach: ['🧑‍🏫', '教練補充'],
    good: ['✅', ''], bad: ['❌', ''], bar: ['🕯️', ''], card: ['📇', ''],
  };
  function renderMD(md) {
    const lines = md.replace(/^\n+/, '').split('\n');
    const out = []; let buf = [];
    const flush = () => { if (buf.length) { out.push(marked.parse(buf.join('\n'))); buf = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const t = line.trim();
      const m = t.match(/^:::([\w-]+)\s*(.*)$/);
      if (m) {
        const inner = [];
        i++;
        while (i < lines.length && lines[i].trim() !== ':::') { inner.push(lines[i]); i++; }
        flush();
        out.push(callout(m[1], m[2], inner.join('\n')));
        continue;
      }
      const f = t.match(/^\$\$(.+)\$\$$/);
      if (f) { flush(); out.push(`<div class="formula">${esc(f[1].trim())}</div>`); continue; }
      const e = t.match(/^\[\[([\w-]+)(?::(.*))?\]\]$/);
      if (e) { flush(); out.push(`<div class="embed" data-type="${esc(e[1])}" data-arg="${esc(e[2] || '')}"></div>`); continue; }
      buf.push(line);
    }
    flush();
    return out.join('\n');
  }
  function callout(type, title, inner) {
    if (type === 'steps') return `<div class="steps">${marked.parse(inner)}</div>`;
    if (type === 'bracket' || type === 'state') return `<div class="embed" data-type="${type}"></div>`;
    const [icon, def] = CALLOUT[type] || ['📌', ''];
    const head = title || def;
    return `<div class="callout c-${type}">${head ? `<div class="callout-title"><span>${icon}</span>${marked.parseInline(head)}</div>` : ''}<div class="callout-body">${marked.parse(inner)}</div></div>`;
  }

  /* ---------------- 內嵌元件 ---------------- */
  function toolCtx(id) {
    return {
      load(defaults) { const st = Store.user().toolState[id]; return st ? Object.assign(defaults, JSON.parse(JSON.stringify(st))) : defaults; },
      save(s) { Store.user().toolState[id] = JSON.parse(JSON.stringify(s)); Store.save(); },
    };
  }
  function mountEmbeds(root) {
    $$('.embed', root).forEach((el) => {
      const type = el.dataset.type, arg = el.dataset.arg;
      try {
        if (type === 'chart') { const fn = Charts.named[arg]; if (fn) Charts.candles(el, fn()); }
        else if (type === 'rr' || type === 'rr-short') { const [e, s, t] = arg.split(',').map(Number); Charts.rrLadder(el, { entry: e, stop: s, target: t, side: type === 'rr' ? 'long' : 'short', title: type === 'rr' ? '模擬交易計劃（Long）' : '模擬交易計劃（Short）' }); }
        else if (type === 'tool') mountTool(el, arg, true);
        else if (type === 'quiz') renderQuiz(el, arg);
        else if (type === 'check') renderChecklist(el, arg);
        else if (type === 'replay') { const sc = Replay.SCENARIOS[arg]; if (sc) { const best = (Store.user().replay[arg] || {}); el.innerHTML = `<div class="replay-card"><span class="rc-icon">${sc.icon}</span><div><b>🎮 互動 K 線重播：${esc(sc.title)}</b><p>${esc(sc.desc)}</p>${best.best != null ? `<small>最佳得分：${best.best} / ${best.total}</small>` : ''}</div><a class="btn primary" href="#/replay/${arg}">開始 ▶</a></div>`; } }
        else if (type === 'chart-funnel') WIDGETS.funnel(el, arg);
        else if (type === 'chart-equity') WIDGETS.equity(el, arg);
        else if (type === 'split') WIDGETS.split(el, arg);
        else if (type === 'walkforward') WIDGETS.walkforward(el);
        else if (type === 'bracket') WIDGETS.bracket(el);
        else if (type === 'state') WIDGETS.state(el);
        else if (type === 'link') { const [to, text] = arg.split('|'); el.innerHTML = `<a class="btn primary" href="#/${esc(to)}">${esc(text || to)}</a>`; }
      } catch (err) { console.error(err); el.innerHTML = `<div class="tool-warn">元件載入失敗：${esc(type)}</div>`; }
    });
  }
  function mountTool(el, id, embedded) {
    const t = TOOLS[id];
    if (!t) { el.innerHTML = `<div class="tool-warn">搵唔到工具：${esc(id)}</div>`; return; }
    el.innerHTML = `<div class="tool-card"><div class="tool-card-head"><span class="ti">${t.icon}</span><div><b>${esc(t.title)}</b><small>${esc(t.desc)}</small></div>${embedded ? `<a class="tool-open" href="#/tools/${id}" title="全頁打開">↗</a>` : ''}</div><div class="tool-body"></div></div>`;
    t.render(el.querySelector('.tool-body'), toolCtx(id));
  }

  /* ---------------- 測驗 ---------------- */
  function renderQuiz(el, id) {
    const qz = QUIZZES[id];
    if (!qz) { el.innerHTML = ''; return; }
    const final = !!qz.final;
    const ans = new Array(qz.questions.length).fill(null);
    const prev = Store.user().quiz[id];
    el.innerHTML = `<div class="quiz ${final ? 'final' : 'mini'}">
      <div class="quiz-head"><span>${final ? '🏁' : '🧩'}</span><div><b>${esc(qz.title)}</b><small>${qz.questions.length} 題${final ? '｜每題只有一個最合適答案，答晒先睇解析' : '｜揀答案即刻有解釋'}</small></div><span class="quiz-score">${prev ? `最佳 ${prev.best}/${prev.total}` : ''}</span></div>
      ${qz.questions.map((q, i) => `<div class="qq" data-q="${i}"><p class="qq-q"><b>${final ? '' : 'Q' + (i + 1) + '. '}</b>${esc(q.q)}</p><div class="qq-opts">${q.options.map((o, j) => `<button class="qq-opt" data-j="${j}">${String.fromCharCode(65 + j)}. ${esc(o)}</button>`).join('')}</div><div class="qq-fb"></div></div>`).join('')}
      ${final ? '<div class="quiz-foot"><button class="btn primary" data-submit disabled>提交並查看詳細解析</button></div>' : ''}
      <div class="quiz-result"></div></div>`;
    const showFb = (i) => {
      const q = qz.questions[i], box = el.querySelector(`[data-q="${i}"]`);
      const ok = ans[i] === q.answer;
      box.querySelectorAll('.qq-opt').forEach((b) => { b.disabled = true; const j = +b.dataset.j; if (j === q.answer) b.classList.add('right'); else if (j === ans[i]) b.classList.add('wrong'); });
      box.querySelector('.qq-fb').innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✅ 正確' : '❌ 正確答案係 ' + String.fromCharCode(65 + q.answer)}：${esc(q.explain)}</div>`;
    };
    const finish = () => {
      const score = ans.filter((a, i) => a === qz.questions[i].answer).length;
      Store.saveQuiz(id, score, qz.questions.length, ans);
      qz.questions.forEach((q, i) => { if (ans[i] === q.answer) Store.awardXP(`q:${id}:${i}`, 5); });
      const r = el.querySelector('.quiz-result');
      const all = score === qz.questions.length;
      r.innerHTML = `<div class="quiz-done ${all ? 'perfect' : ''}"><span>${all ? '🎉' : score / qz.questions.length >= 0.6 ? '👍' : '📖'}</span> 得分 <b>${score} / ${qz.questions.length}</b> ${all ? '全中！' : ''}<button class="btn ghost sm" data-retry>↺ 再做一次</button></div>`;
      r.querySelector('[data-retry]').addEventListener('click', () => renderQuiz(el, id));
      if (all) confetti();
    };
    el.querySelectorAll('.qq').forEach((box) => {
      const i = +box.dataset.q;
      box.querySelectorAll('.qq-opt').forEach((b) => b.addEventListener('click', () => {
        if (ans[i] != null && !final) return;
        ans[i] = +b.dataset.j;
        if (final) {
          box.querySelectorAll('.qq-opt').forEach((x) => x.classList.toggle('picked', x === b));
          const btn = el.querySelector('[data-submit]'); btn.disabled = ans.some((a) => a == null);
          el.querySelector('.quiz-score').textContent = `已答 ${ans.filter((a) => a != null).length}/${ans.length}`;
        } else {
          showFb(i);
          if (ans.every((a) => a != null)) finish();
        }
      }));
    });
    const sub = el.querySelector('[data-submit]');
    if (sub) sub.addEventListener('click', () => { qz.questions.forEach((_, i) => showFb(i)); sub.remove(); finish(); });
  }

  /* ---------------- 清單 ---------------- */
  function renderChecklist(el, id) {
    const cl = CHECKLISTS[id];
    if (!cl) return;
    const u = Store.user();
    const groups = cl.groups || [{ title: '', items: cl.items }];
    let k = 0;
    const html = groups.map((g, gi) => `${g.title ? `<div class="cl-group">${esc(g.title)}</div>` : ''}${g.items.map((it) => { const cid = `${id}:${k++}`; return `<label class="cl-item"><input type="checkbox" data-c="${cid}" ${u.checks[cid] ? 'checked' : ''}><span>${esc(it)}</span></label>`; }).join('')}`).join('');
    el.innerHTML = `<div class="checklist"><div class="cl-head"><b>☑️ ${esc(cl.title)}</b><span class="cl-count"></span>${cl.resettable ? '<button class="btn ghost sm" data-reset>重設</button>' : ''}</div><div class="cl-bar"><div></div></div>${html}</div>`;
    const upd = () => {
      const boxes = $$('input[type=checkbox]', el), n = boxes.filter((b) => b.checked).length;
      el.querySelector('.cl-count').textContent = `${n} / ${boxes.length}`;
      el.querySelector('.cl-bar div').style.width = (n / boxes.length * 100) + '%';
      if (n === boxes.length && boxes.length) el.querySelector('.checklist').classList.add('complete'); else el.querySelector('.checklist').classList.remove('complete');
    };
    $$('input[type=checkbox]', el).forEach((b) => b.addEventListener('change', () => { Store.toggleCheck(b.dataset.c, b.checked); upd(); }));
    const rs = el.querySelector('[data-reset]');
    if (rs) rs.addEventListener('click', () => { $$('input[type=checkbox]', el).forEach((b) => { b.checked = false; Store.toggleCheck(b.dataset.c, false); }); upd(); });
    upd();
  }

  /* ---------------- 慶祝 ---------------- */
  function confetti() {
    const c = document.createElement('div'); c.className = 'confetti';
    for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 0.5 + 's'; s.style.background = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]; c.appendChild(s); }
    document.body.appendChild(c); setTimeout(() => c.remove(), 2200);
  }
  window.addEventListener('ta:xp', (e) => toast(`<b>+${e.detail.amount} XP</b> ⭐`, 1400));

  /* ---------------- 目錄（側欄） ---------------- */
  function renderTOC(activeCh, activeRoute) {
    const ui = Store.ui();
    const open = ui.tocOpen || {};
    const u = Store.user();
    const last = u.last && CH[u.last.chapter];
    const link = (href, icon, text, on) => `<a class="toc-link ${on ? 'on' : ''}" href="${href}"><span>${icon}</span>${text}</a>`;
    $('#toc').innerHTML = `
      ${last ? `<a class="toc-continue" href="#/c/${last.id}${u.last.section ? '/' + u.last.section : ''}"><small>📍 繼續上次</small><b>${esc(last.level.code)} · ${esc(last.title)}</b></a>` : ''}
      ${link('#/', '🏠', '主頁', activeRoute === 'home')}
      ${link('#/toc', '🗺️', '完整課程目錄', activeRoute === 'toc')}
      <div class="toc-sep">課程</div>
      ${LEVELS.map((lv) => {
        const st = levelStats(lv);
        const isOpen = open[lv.id] != null ? open[lv.id] : (activeCh ? activeCh.level === lv : false);
        return `<div class="toc-level ${isOpen ? 'open' : ''}" data-lv="${lv.id}" style="--lv:${lv.color}">
          <button class="toc-lv-head" data-toggle="${lv.id}" aria-expanded="${isOpen}"><span class="lv-icon">${lv.icon}</span><span class="lv-text"><b>${esc(lv.code)}</b><small>${esc(lv.title)}</small></span><span class="lv-prog">${st.done}/${st.total}</span><span class="caret">▾</span></button>
          <div class="toc-bar"><div style="width:${st.pct * 100}%"></div></div>
          <ol class="toc-chs">${lv.chapters.map((c) => {
            const p = chapterPct(c); const on = activeCh && activeCh.id === c.id;
            return `<li class="${on ? 'on' : ''}"><a href="#/c/${c.id}" class="toc-ch"><span class="ch-dot ${p >= 1 ? 'done' : p > 0 ? 'part' : ''}" style="--p:${p * 360}deg"></span><span class="ch-num">${c.num}</span><span class="ch-t">${esc(c.title)}</span></a>
              ${on && c.sections.length ? `<ul class="toc-secs">${c.sections.map((s) => `<li><a href="#/c/${c.id}/${s.id}" data-sec-link="${s.id}" class="${seenMap()[c.id] && seenMap()[c.id][s.id] ? 'seen' : ''}">${esc(s.title)}</a></li>`).join('')}</ul>` : ''}</li>`;
          }).join('')}</ol></div>`;
      }).join('')}
      <div class="toc-sep">互動學習</div>
      ${link('#/tools', '🧰', '工具箱（計算器）', activeRoute === 'tools')}
      ${link('#/replay', '🎮', 'K 線重播遊戲', activeRoute === 'replay')}
      ${link('#/quiz', '📝', '測驗中心', activeRoute === 'quiz')}
      ${link('#/cards', '🃏', '詞彙字卡', activeRoute === 'cards')}
      ${link('#/glossary', '📖', '詞彙表', activeRoute === 'glossary')}
      <div class="toc-sep">我的</div>
      ${link('#/journal', '📒', '交易日誌', activeRoute === 'journal')}
      ${link('#/me', '⭐', '書籤・筆記・螢光筆', activeRoute === 'me')}
      ${link('#/board', '💬', '家庭討論區', activeRoute === 'board')}
      ${link('#/family', '👨‍👩‍👧', '家庭進度', activeRoute === 'family')}
      ${link('#/settings', '⚙️', '設定・備份・同步', activeRoute === 'settings')}
      <p class="toc-foot">教育用途，不構成投資建議。</p>`;
    $$('[data-toggle]', $('#toc')).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.toggle; const box = b.closest('.toc-level');
      const now = !box.classList.contains('open');
      box.classList.toggle('open', now); b.setAttribute('aria-expanded', now);
      const o = Store.ui().tocOpen || {}; o[id] = now; Store.setUI({ tocOpen: o });
    }));
    const on = $('.toc-chs li.on', $('#toc'));
    if (on) { const sb = $('#sidebar'); const r = on.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight) on.scrollIntoView({ block: 'center' }); }
  }

  /* ---------------- 右邊：本頁目錄 ---------------- */
  function renderRail(c) {
    const rail = $('#rightrail');
    if (!c) { rail.innerHTML = ''; rail.classList.remove('has'); return; }
    rail.classList.add('has');
    rail.innerHTML = `<div class="rail-inner"><div class="rail-title">本章目錄</div><ul>${c.sections.map((s) => `<li><a href="#/c/${c.id}/${s.id}" data-rail="${s.id}">${esc(s.title)}</a></li>`).join('')}<li class="rail-end"><a href="#/c/${c.id}/ch-end">🎬 影片・💬 討論・📝 筆記</a></li></ul></div>`;
  }

  /* ---------------- 主頁 ---------------- */
  const TIPS = [
    '錯過交易，唔代表策略失敗。', 'Stop 跟「假設喺邊度失效」，唔係跟想輸幾多。', 'No Trade 都係一個決定。', '先記錄 Setup，再播放下一支 K 線。',
    '1:2 Risk / Reward 唔代表一定賺錢 —— 要睇埋勝率同成本。', '好交易 ≠ 賺錢交易；跟規則先係你可以控制嘅部分。', '每次只改一個參數，舊版本要保留。',
    'Daily Loss Limit 係界線，唔係額度。', '入場價唔係細節，佢直接決定成筆交易嘅風險。', '一日零筆交易，都可以係一個完整而正確嘅測試結果。',
    'Reversal 唔係預測頂底，而係等市場出現轉向嘅證據。', 'Paper Trading 有 Edge，唔保證真實交易有 Edge。',
  ];
  function renderHome() {
    const p = Store.activeProfile();
    const u = Store.user();
    const ov = overall();
    const rk = rank(u.xp);
    const last = u.last && CH[u.last.chapter];
    const nextCh = CHAPTERS.find((c) => !u.read[c.id]);
    const day = Math.floor(Date.now() / 86400000);
    const tip = TIPS[day % TIPS.length];
    const word = GLOSSARY[day % GLOSSARY.length];
    const fam = Store.profiles();
    const recent = Store.comments().slice(-4).reverse();
    view.innerHTML = `
      <section class="hero">
        <div class="hero-main">
          <p class="hero-hi">${p ? `${p.emoji} 你好，${esc(p.name)}！` : '👋 歡迎！'}</p>
          <h1>TSLA Day Trading 學院</h1>
          <p class="hero-sub">由 K 線基礎到策略驗證，一步步建立<b>可執行、可回測</b>嘅交易系統。所有例子都係教學模擬。</p>
          <div class="hero-actions">
            ${last ? `<a class="btn primary lg" href="#/c/${last.id}${u.last.section ? '/' + u.last.section : ''}">📍 繼續：${esc(last.level.code)} 第 ${last.num} 章</a>` : `<a class="btn primary lg" href="#/c/${(nextCh || CHAPTERS[0]).id}">🚀 開始學習</a>`}
            <a class="btn lg" href="#/toc">🗺️ 睇完整目錄</a>
          </div>
        </div>
        <div class="hero-side">
          <div class="ring" style="--p:${ov.pct * 360}deg"><div><b>${Math.round(ov.pct * 100)}%</b><small>總進度</small></div></div>
          <div class="hero-stats">
            <div><span>${rk.icon}</span><b>${rk.name}</b><small>${u.xp} XP${rk.next ? ` · 再 ${rk.next[0] - u.xp} XP 升「${rk.next[1]}」` : ''}</small></div>
            <div><span>🔥</span><b>${u.streak.count || 0} 日</b><small>連續學習（最高 ${u.streak.best || 0}）</small></div>
            <div><span>✅</span><b>${ov.done} / ${ov.total}</b><small>已完成章節</small></div>
          </div>
        </div>
      </section>

      <section class="road">
        <h2 class="sec-h">學習路線</h2>
        <div class="road-grid">${LEVELS.map((lv, i) => { const st = levelStats(lv); const first = lv.chapters.find((c) => !u.read[c.id]) || lv.chapters[0]; return `
          <a class="lv-card" href="#/c/${first.id}" style="--lv:${lv.color}">
            <div class="lv-card-top"><span class="lv-big">${lv.icon}</span><span class="lv-step">${i + 1}</span></div>
            <b>${esc(lv.code)}</b><h3>${esc(lv.title)}</h3>
            <p class="lv-q">「${esc(lv.question)}」</p>
            <div class="lv-prog-row"><div class="bar"><div style="width:${st.pct * 100}%"></div></div><small>${st.done}/${st.total} 章</small></div>
          </a>`; }).join('')}</div>
      </section>

      <section class="home-grid">
        <div class="card tip-card"><div class="card-h">💡 今日一句</div><p class="big-quote">「${esc(tip)}」</p></div>
        <div class="card word-card"><div class="card-h">📖 今日詞彙</div><p class="w-term">${esc(word.term)}</p><p class="w-zh">${esc(word.zh)}</p><p>${esc(word.def)}</p><a href="#/cards">玩字卡 →</a></div>
        <div class="card"><div class="card-h">🧰 常用工具</div><div class="quick-tools">${['possize-pro', 'expectancy-lab', 'daily-risk', 'monte-carlo', 'order-sim', 'csv-checker'].map((id) => `<a href="#/tools/${id}"><span>${TOOLS[id].icon}</span>${esc(TOOLS[id].title)}</a>`).join('')}</div></div>
        <div class="card"><div class="card-h">🎮 K 線重播遊戲</div><div class="quick-tools">${Object.entries(Replay.SCENARIOS).map(([id, s]) => `<a href="#/replay/${id}"><span>${s.icon}</span>${esc(s.title)}${u.replay[id] ? ` <small>（${u.replay[id].best}/${u.replay[id].total}）</small>` : ''}</a>`).join('')}</div></div>
        ${fam.length > 1 ? `<div class="card"><div class="card-h">👨‍👩‍👧 家庭進度</div>${fam.map((f) => { const o = overall(f.id); return `<div class="fam-row"><span class="av" style="--c:${f.color}">${f.emoji}</span><b>${esc(f.name)}</b><div class="bar"><div style="width:${o.pct * 100}%;background:${f.color}"></div></div><small>${Math.round(o.pct * 100)}%</small></div>`; }).join('')}<a href="#/family">詳細 →</a></div>` : ''}
        <div class="card"><div class="card-h">💬 最新討論</div>${recent.length ? recent.map((c) => `<a class="mini-c" href="#/c/${c.chapter}/${c.section || 'ch-end'}"><span class="av sm" style="--c:${c.color}">${c.emoji}</span><span><b>${esc(c.name)}</b>：${esc(c.text.slice(0, 60))}<small> · ${CH[c.chapter] ? esc(CH[c.chapter].level.code + ' 第' + CH[c.chapter].num + '章') : ''}</small></span></a>`).join('') : '<p class="muted">未有留言。喺任何章節底部或者揀選文字都可以留言，同屋企人討論。</p>'}<a href="#/board">討論區 →</a></div>
      </section>
      <p class="disclaimer">本平台內容整理自你自己生成嘅課程筆記，並加入補充內容同互動工具。所有 TSLA 價格、成交量同交易例子均為教學模擬，<b>唔係即時行情、唔係投資建議、亦唔係已驗證嘅盈利策略</b>。真實交易可能出現跳空、滑價、訂單未成交，以及超出預計止損嘅損失。</p>`;
  }

  /* ---------------- 完整目錄頁 ---------------- */
  function renderFullTOC() {
    const u = Store.user();
    view.innerHTML = `<div class="page-head"><h1>🗺️ 完整課程目錄</h1><p class="muted">撳任何章節或小節直接跳過去。✓ = 已完成，◐ = 讀緊。</p>
      <div class="tool-foot"><input type="search" class="filter" placeholder="篩選目錄…" data-filter></div></div>
      <div class="full-toc">${LEVELS.map((lv) => { const st = levelStats(lv); return `<section class="ft-level" style="--lv:${lv.color}">
        <header><span>${lv.icon}</span><div><b>${esc(lv.code)}：${esc(lv.title)}</b><small>${esc(lv.subtitle)}</small></div><em>${st.done}/${st.total}</em></header>
        <ol>${lv.chapters.map((c) => { const p = chapterPct(c); const seen = seenMap()[c.id] || {}; return `<li class="ft-ch" data-text="${esc((c.title + ' ' + c.sections.map((s) => s.title).join(' ') + ' ' + (c.keywords || []).join(' ')).toLowerCase())}">
          <a class="ft-ch-a" href="#/c/${c.id}"><span class="ch-dot ${p >= 1 ? 'done' : p > 0 ? 'part' : ''}" style="--p:${p * 360}deg"></span><b>第 ${c.num} 章　${esc(c.title)}</b><small>⏱ ${c.mins} 分鐘</small></a>
          <p class="ft-sum">${esc(c.summary)}</p>
          ${c.sections.length ? `<ul class="ft-secs">${c.sections.map((s) => `<li><a href="#/c/${c.id}/${s.id}" class="${seen[s.id] ? 'seen' : ''}">${esc(s.title)}</a></li>`).join('')}</ul>` : ''}</li>`; }).join('')}</ol></section>`; }).join('')}</div>`;
    const f = $('[data-filter]', view);
    f.addEventListener('input', () => { const q = f.value.trim().toLowerCase(); $$('.ft-ch', view).forEach((li) => (li.style.display = !q || li.dataset.text.includes(q) ? '' : 'none')); });
  }

  /* ---------------- 章節頁 ---------------- */
  let scrollHandler = null;
  function renderChapter(c, secTarget) {
    const u = Store.user();
    Store.markVisited(c.id);
    const lv = c.level;
    view.innerHTML = `<article class="chapter" style="--lv:${lv.color}">
      <nav class="crumbs"><a href="#/">主頁</a> › <a href="#/toc">${esc(lv.code)}</a> › 第 ${c.num} 章</nav>
      <header class="ch-head">
        <div class="ch-badge">${lv.icon} ${esc(lv.code)}｜第 ${c.num} 章</div>
        <h1>${esc(c.title)}</h1>
        <p class="ch-sum">${esc(c.summary)}</p>
        <div class="ch-meta"><span>⏱ 約 ${c.mins} 分鐘</span><span class="ch-pct"></span>${(c.keywords || []).map((k) => `<span class="kw">${esc(k)}</span>`).join('')}</div>
        <div class="ch-actions">
          <button class="btn sm" data-bm-ch>${Store.isBookmarked(c.id, '_chapter') ? '★ 已加書籤' : '☆ 書籤本章'}</button>
          <a class="btn sm" href="#/c/${c.id}/ch-end">🎬 影片 (${Store.videos(c.id).length})</a>
          <a class="btn sm" href="#/c/${c.id}/ch-end">💬 討論 (${Store.comments(c.id).length})</a>
          <button class="btn sm ghost" data-print>🖨️ 列印</button>
        </div>
      </header>
      <div class="content" data-content>${renderMD(c.md)}</div>
      <section class="ch-end" id="ch-end">
        <div class="done-box ${u.read[c.id] ? 'is-done' : ''}">
          <button class="btn lg ${u.read[c.id] ? '' : 'primary'}" data-done>${u.read[c.id] ? '✓ 已完成本章（撳取消）' : '✓ 標記本章已完成（+20 XP）'}</button>
          ${c.next ? `<a class="btn lg ghost" href="#/c/${c.next.id}">下一章：${esc(c.next.title)} →</a>` : ''}
        </div>
        <div class="panel" data-chnote></div>
        <div class="panel" data-videos></div>
        <div class="panel" data-comments></div>
      </section>
      <nav class="pager">
        ${c.prev ? `<a href="#/c/${c.prev.id}" class="pg prev"><small>← 上一章</small><b>${esc(c.prev.level.code)} · ${esc(c.prev.title)}</b></a>` : '<span></span>'}
        ${c.next ? `<a href="#/c/${c.next.id}" class="pg next"><small>下一章 →</small><b>${esc(c.next.level.code)} · ${esc(c.next.title)}</b></a>` : '<span></span>'}
      </nav></article>`;
    const content = $('[data-content]', view);
    $$('table', content).forEach((t) => { const w = document.createElement('div'); w.className = 'tbl-scroll'; t.parentNode.insertBefore(w, t); w.appendChild(t); });
    wrapSections(content, c);
    mountEmbeds(content);
    applyHighlights(content, c);
    renderChapterNote(c);
    renderVideos(c);
    renderComments(c);
    $('[data-bm-ch]', view).addEventListener('click', (e) => { const on = Store.toggleBookmark(c.id, '_chapter', c.title); e.target.textContent = on ? '★ 已加書籤' : '☆ 書籤本章'; toast(on ? '已加入書籤' : '已移除書籤'); });
    $('[data-print]', view).addEventListener('click', () => window.print());
    $('[data-done]', view).addEventListener('click', () => {
      const now = !Store.user().read[c.id];
      Store.setRead(c.id, now);
      if (now) { confetti(); toast('🎉 完成！'); }
      renderChapter(c, 'ch-end'); renderTOC(c, 'chapter');
    });
    updatePctLabel(c);
    // 捲動到目標
    const flash = sessionStorage.getItem('ta:flash'); sessionStorage.removeItem('ta:flash');
    requestAnimationFrame(() => {
      let target = secTarget ? document.getElementById(secTarget) : null;
      if (!target && !secTarget && u.last && u.last.chapter === c.id && u.last.section && u.last.section !== 'ch-end' && false) target = document.getElementById(u.last.section);
      if (target) { target.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }
      else window.scrollTo(0, 0);
      if (flash) {
        const scope = target && target.classList.contains('sec') ? target : content;
        const m = wrapText(scope, flash, () => { const x = document.createElement('mark'); x.className = 'flash'; return x; });
        if (m && m[0]) { m[0].scrollIntoView({ block: 'center' }); }
      }
    });
    // 閱讀進度
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    let ticking = false;
    scrollHandler = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; onChapterScroll(c); }); };
    window.addEventListener('scroll', scrollHandler, { passive: true });
    setTimeout(() => onChapterScroll(c), 400);
  }
  function updatePctLabel(c) {
    const el = $('.ch-pct', view); if (el) { const p = chapterPct(c); el.textContent = p >= 1 ? '✅ 已完成' : `📖 已讀 ${Math.round(p * 100)}%`; }
  }
  let lastSaveSec = null;
  function onChapterScroll(c) {
    const content = $('[data-content]', view); if (!content) return;
    const docH = document.documentElement.scrollHeight - innerHeight;
    $('#readbar-fill').style.width = (docH > 0 ? Math.min(100, scrollY / docH * 100) : 100) + '%';
    const secs = $$('.sec', content);
    let current = null;
    const seen = seenMap(); seen[c.id] = seen[c.id] || {};
    let changed = false;
    secs.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top < 120) current = s.id;
      if (s.id !== 'intro' && r.bottom < innerHeight - 40 && r.bottom > 60 && !seen[c.id][s.id]) { seen[c.id][s.id] = Date.now(); changed = true; }
    });
    const end = $('#ch-end'); const atEnd = end && end.getBoundingClientRect().top < innerHeight;
    if (atEnd) current = 'ch-end';
    if (current && current !== lastSaveSec) { lastSaveSec = current; Store.setLast(c.id, current === 'intro' ? null : current); }
    $$('[data-rail]').forEach((a) => a.classList.toggle('on', a.dataset.rail === current));
    $$('[data-sec-link]').forEach((a) => { a.classList.toggle('on', a.dataset.secLink === current); if (seen[c.id][a.dataset.secLink]) a.classList.add('seen'); });
    if (changed) {
      Store.save(); updatePctLabel(c);
      const allSeen = c.sections.every((s) => seen[c.id][s.id]);
      if (allSeen && atEnd && !Store.user().read[c.id]) { Store.setRead(c.id, true); toast('🎉 已讀晒全章，自動標記完成'); const db = $('[data-done]', view); if (db) { db.textContent = '✓ 已完成本章（撳取消）'; db.classList.remove('primary'); db.parentElement.classList.add('is-done'); } renderTOC(c, 'chapter'); }
      const dot = $('.toc-chs li.on .ch-dot'); if (dot) { const p = chapterPct(c); dot.style.setProperty('--p', p * 360 + 'deg'); dot.classList.toggle('part', p > 0 && p < 1); }
    }
  }

  /* 將 h2 分組成 section，加工具列 */
  function wrapSections(content, c) {
    const nodes = Array.from(content.childNodes);
    const frag = document.createDocumentFragment();
    let cur = document.createElement('section'); cur.className = 'sec'; cur.id = 'intro'; cur.dataset.sec = 'intro';
    let k = 0;
    nodes.forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'H2') {
        if (cur.childNodes.length) frag.appendChild(cur);
        const meta = c.sections[k++] || { id: 's-x' + k, title: n.textContent };
        cur = document.createElement('section'); cur.className = 'sec'; cur.id = meta.id; cur.dataset.sec = meta.id; cur.dataset.title = meta.title;
      }
      cur.appendChild(n);
    });
    if (cur.childNodes.length) frag.appendChild(cur);
    content.innerHTML = ''; content.appendChild(frag);
    $$('.sec', content).forEach((s) => {
      const h = s.querySelector(':scope > h2'); if (!h) return;
      const sid = s.id;
      const tools = document.createElement('div'); tools.className = 'sec-tools hl-skip';
      const nC = Store.comments(c.id).filter((x) => x.section === sid).length;
      tools.innerHTML = `<button data-a="bm" title="書籤" class="${Store.isBookmarked(c.id, sid) ? 'on' : ''}">${Store.isBookmarked(c.id, sid) ? '★' : '☆'}</button><button data-a="note" title="筆記">📝</button><button data-a="cm" title="留言">💬${nC ? `<sup>${nC}</sup>` : ''}</button><button data-a="link" title="複製連結">🔗</button>`;
      h.appendChild(tools);
      if (seenMap()[c.id] && seenMap()[c.id][sid]) h.classList.add('seen');
      const showNote = () => {
        let box = s.querySelector(':scope > .my-note');
        const txt = Store.getNote(c.id, sid);
        if (!txt) { if (box) box.remove(); return; }
        if (!box) { box = document.createElement('div'); box.className = 'my-note hl-skip'; h.after(box); }
        box.innerHTML = `<div class="mn-head">📝 我嘅筆記 <button data-edit>編輯</button></div><div class="mn-body">${esc(txt).replace(/\n/g, '<br>')}</div>`;
        box.querySelector('[data-edit]').addEventListener('click', editNote);
      };
      const editNote = () => {
        modal(`<h3>📝 筆記：${esc(s.dataset.title)}</h3><textarea rows="7" class="note-ta" placeholder="寫低你嘅理解、疑問、例子…（只有你自己睇到）">${esc(Store.getNote(c.id, sid))}</textarea><div class="modal-actions"><button class="btn ghost" data-del>刪除</button><button class="btn primary" data-save>儲存</button></div>`, (box, close) => {
          box.querySelector('[data-save]').addEventListener('click', () => { Store.setNote(c.id, sid, box.querySelector('textarea').value); showNote(); close(); toast('已儲存筆記'); });
          box.querySelector('[data-del]').addEventListener('click', () => { Store.setNote(c.id, sid, ''); showNote(); close(); });
        });
      };
      showNote();
      tools.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const a = b.dataset.a;
        if (a === 'bm') { const on = Store.toggleBookmark(c.id, sid, s.dataset.title); b.textContent = on ? '★' : '☆'; b.classList.toggle('on', on); toast(on ? '已加書籤' : '已移除書籤'); }
        if (a === 'note') editNote();
        if (a === 'cm') commentModal(c, sid, '');
        if (a === 'link') { const url = location.href.split('#')[0] + `#/c/${c.id}/${sid}`; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('已複製連結'), () => prompt('複製呢條連結：', url)); }
      });
    });
  }

  /* ---------------- 螢光筆 ---------------- */
  function textNodesIn(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
      const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('.embed, .hl-skip, button, script, style, svg, input, textarea, select')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } });
    const out = []; while (w.nextNode()) out.push(w.currentNode); return out;
  }
  function wrapText(root, text, makeEl) {
    if (!text) return null;
    const nodes = textNodesIn(root);
    let norm = ''; const map = []; let prevSpace = true;
    nodes.forEach((n, ni) => { const v = n.nodeValue; for (let i = 0; i < v.length; i++) { const ch = v[i]; if (/\s/.test(ch)) { if (prevSpace) continue; norm += ' '; map.push([ni, i]); prevSpace = true; } else { norm += ch; map.push([ni, i]); prevSpace = false; } } });
    const needle = text.replace(/\s+/g, ' ').trim();
    const k = norm.indexOf(needle); if (k < 0) return null;
    const [sn, so] = map[k], [en, eo] = map[k + needle.length - 1];
    const made = [];
    for (let ni = en; ni >= sn; ni--) {
      let node = nodes[ni];
      const a = ni === sn ? so : 0, b = ni === en ? eo + 1 : node.nodeValue.length;
      if (b <= a) continue;
      if (b < node.nodeValue.length) node.splitText(b);
      if (a > 0) node = node.splitText(a);
      if (!node.nodeValue.trim() && ni !== sn && ni !== en) continue;
      const m = makeEl(); node.parentNode.insertBefore(m, node); m.appendChild(node); made.unshift(m);
    }
    return made;
  }
  function applyHighlights(content, c) {
    Store.user().highlights.filter((h) => h.chapter === c.id).forEach((h) => {
      const scope = content.querySelector(`[data-sec="${h.section}"]`) || content;
      wrapText(scope, h.text, () => { const m = document.createElement('mark'); m.className = `hl hl-${h.color || 'yellow'}${h.note ? ' has-note' : ''}`; m.dataset.hl = h.id; if (h.note) m.title = h.note; return m; });
    });
  }
  function hlModal(id) {
    const h = Store.user().highlights.find((x) => x.id === id); if (!h) return;
    modal(`<h3>🖍️ 螢光筆</h3><blockquote class="quote">${esc(h.text)}</blockquote>
      <label class="fld wide"><span>備註</span><textarea rows="4" data-note placeholder="加啲解釋或者問題…">${esc(h.note || '')}</textarea></label>
      <div class="hl-colors">${['yellow', 'green', 'pink', 'blue'].map((col) => `<button class="dot-btn ${col} ${h.color === col ? 'on' : ''}" data-col="${col}" aria-label="${col}"></button>`).join('')}</div>
      <div class="modal-actions"><button class="btn ghost" data-del>🗑️ 刪除螢光筆</button><button class="btn" data-cm>💬 留言討論</button><button class="btn primary" data-save>儲存</button></div>`, (box, close) => {
      let color = h.color;
      $$('[data-col]', box).forEach((b) => b.addEventListener('click', () => { color = b.dataset.col; $$('[data-col]', box).forEach((x) => x.classList.toggle('on', x === b)); }));
      box.querySelector('[data-save]').addEventListener('click', () => { Store.updateHighlight(id, { note: box.querySelector('[data-note]').value, color }); close(); route(); });
      box.querySelector('[data-del]').addEventListener('click', () => { Store.removeHighlight(id); close(); route(); });
      box.querySelector('[data-cm]').addEventListener('click', () => { close(); commentModal(CH[h.chapter], h.section, h.text); });
    });
  }
  // 選取文字彈出工具列
  const pop = $('#selection-pop');
  let selInfo = null;
  function checkSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { pop.hidden = true; selInfo = null; return; }
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    const content = $('[data-content]');
    if (!content || text.length < 2 || text.length > 600 || !content.contains(range.commonAncestorContainer)) { pop.hidden = true; selInfo = null; return; }
    const anc = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (anc.closest('.embed, .hl-skip')) { pop.hidden = true; return; }
    const sec = anc.closest('.sec');
    const m = location.hash.match(/^#\/c\/([^/]+)/);
    if (!m) return;
    selInfo = { chapter: m[1], section: sec ? sec.id : 'intro', text };
    const r = range.getBoundingClientRect();
    pop.hidden = false;
    const pw = pop.offsetWidth || 300;
    pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left + r.width / 2 - pw / 2)) + 'px';
    if (r.bottom < 60 || r.top > innerHeight) { pop.hidden = true; return; }
    pop.style.top = Math.max(68, Math.min(innerHeight - 56, r.top > 110 ? r.top - 50 : r.bottom + 10)) + 'px';
  }
  window.addEventListener('scroll', () => { if (!pop.hidden || selInfo) { clearTimeout(selTimer); selTimer = setTimeout(checkSelection, 80); } }, { passive: true });
  let selTimer;
  document.addEventListener('selectionchange', () => { clearTimeout(selTimer); selTimer = setTimeout(checkSelection, 250); });
  pop.addEventListener('mousedown', (e) => e.preventDefault());
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !selInfo) return;
    const act = b.dataset.act; const info = selInfo; selInfo = null;
    if (!Store.activeProfile()) { askProfile(); return; }
    window.getSelection().removeAllRanges(); pop.hidden = true;
    if (act.startsWith('hl-') && act !== 'hl-note' && act !== 'hl-comment') { Store.addHighlight({ chapter: info.chapter, section: info.section, text: info.text, color: act.slice(3) }); Store.awardXP('hl:' + info.text.slice(0, 30), 1); route(); }
    if (act === 'hl-note') {
      modal(`<h3>📝 為選取文字加備註</h3><blockquote class="quote">${esc(info.text)}</blockquote><textarea rows="4" data-note placeholder="你嘅備註…"></textarea><div class="modal-actions"><button class="btn primary" data-save>儲存</button></div>`, (box, close) => {
        box.querySelector('[data-save]').addEventListener('click', () => { Store.addHighlight({ chapter: info.chapter, section: info.section, text: info.text, color: 'yellow', note: box.querySelector('[data-note]').value }); close(); route(); });
      });
    }
    if (act === 'hl-comment') commentModal(CH[info.chapter], info.section, info.text);
  });
  view.addEventListener('click', (e) => { const m = e.target.closest('mark.hl'); if (m) hlModal(m.dataset.hl); });

  /* ---------------- 章節筆記 ---------------- */
  function renderChapterNote(c) {
    const el = $('[data-chnote]', view);
    const txt = Store.getNote(c.id, '_chapter');
    const secNotes = c.sections.filter((s) => Store.getNote(c.id, s.id));
    const hls = Store.user().highlights.filter((h) => h.chapter === c.id);
    el.innerHTML = `<h3>📝 我嘅本章筆記 <small>（只有目前使用者睇到）</small></h3>
      <textarea rows="4" data-n placeholder="總結本章、寫低未明白嘅地方、你自己嘅例子…">${esc(txt)}</textarea>
      <div class="note-foot"><span class="muted" data-st>${txt ? '已儲存' : ''}</span><span class="muted">小節筆記 ${secNotes.length} 個 · 螢光筆 ${hls.length} 個 · 喺內文揀選文字就可以加螢光筆</span></div>`;
    let t;
    $('[data-n]', el).addEventListener('input', (e) => { clearTimeout(t); $('[data-st]', el).textContent = '儲存中…'; t = setTimeout(() => { Store.setNote(c.id, '_chapter', e.target.value); $('[data-st]', el).textContent = '已儲存 ✓'; }, 600); });
  }

  /* ---------------- 影片 ---------------- */
  function ytId(url) {
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function videoHTML(v, withChapter) {
    const id = ytId(v.url);
    const ch = CH[v.chapter];
    return `<div class="video-item" data-vid="${v.id}">
      ${id ? `<button class="yt-thumb" data-yt="${id}" aria-label="播放 ${esc(v.title)}"><img loading="lazy" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt=""><span class="yt-play">▶</span></button>` : `<a class="link-thumb" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">🔗<small>${esc((v.url.match(/^https?:\/\/([^/]+)/) || [])[1] || '連結')}</small></a>`}
      <div class="video-meta"><b>${esc(v.title || v.url)}</b>
      <small>${withChapter && ch ? `<a href="#/c/${ch.id}">${esc(ch.level.code)} 第 ${ch.num} 章</a> · ` : ''}${v.section && ch ? `📍 ${esc((ch.sections.find((s) => s.id === v.section) || {}).title || '')} · ` : ''}${v.by ? esc(v.by) + ' 加入 · ' : ''}${ago(v.ts)}</small>
      ${v.note ? `<p>${esc(v.note)}</p>` : ''}
      <div class="video-acts"><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">喺新視窗打開</a><button data-delv="${v.id}">刪除</button></div></div></div>`;
  }
  function bindVideoEvents(root, after) {
    $$('[data-yt]', root).forEach((b) => b.addEventListener('click', () => {
      const ifr = document.createElement('iframe');
      ifr.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
      ifr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen'; ifr.allowFullscreen = true; ifr.className = 'yt-frame';
      b.replaceWith(ifr);
    }));
    $$('[data-delv]', root).forEach((b) => b.addEventListener('click', () => { if (confirm('刪除呢條影片連結？（全家共用）')) { Store.removeVideo(b.dataset.delv); after(); } }));
  }
  function renderVideos(c) {
    const el = $('[data-videos]', view);
    const vids = Store.videos(c.id);
    const kws = (c.keywords || []).slice(0, 4);
    el.innerHTML = `<h3>🎬 相關影片 <small>（全家共用）</small></h3>
      <div class="video-list">${vids.map((v) => videoHTML(v)).join('') || '<p class="muted">未有影片。搵到好嘅教學片，貼條連結落嚟就可以喺度直接播放（YouTube 會自動嵌入）。</p>'}</div>
      <form class="video-form">
        <input type="url" required placeholder="貼上影片連結（YouTube 或其他網址）" data-url>
        <input type="text" placeholder="標題（可選）" data-title>
        <select data-sec><option value="">（整章）</option>${c.sections.map((s) => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
        <button class="btn primary">＋ 加入影片</button>
      </form>
      <div class="yt-suggest"><span class="muted">🔍 去 YouTube 搵：</span>${kws.map((k) => `<a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(k + ' day trading')}">${esc(k)}</a>`).join('')}<a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(c.title + ' 交易 教學')}">${esc(c.title)}</a></div>`;
    $('form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      if (!Store.activeProfile()) { askProfile(); return; }
      let url = $('[data-url]', el).value.trim(); if (!/^https?:\/\//.test(url)) url = 'https://' + url;
      Store.addVideo({ chapter: c.id, url, title: $('[data-title]', el).value.trim(), section: $('[data-sec]', el).value || null });
      Store.awardXP('video:' + url, 2);
      renderVideos(c); toast('已加入影片');
    });
    bindVideoEvents(el, () => renderVideos(c));
  }

  /* ---------------- 留言 ---------------- */
  function commentHTML(cm, all, withChapter) {
    const me = Store.activeProfile();
    const ch = CH[cm.chapter];
    const sec = ch && cm.section ? ch.sections.find((s) => s.id === cm.section) : null;
    const replies = all.filter((x) => x.parent === cm.id);
    return `<div class="cm" data-cm="${cm.id}">
      <span class="av" style="--c:${cm.color}">${cm.emoji}</span>
      <div class="cm-body">
        <div class="cm-head"><b>${esc(cm.name)}</b><small>${ago(cm.ts)}</small>${withChapter && ch ? `<a class="cm-sec" href="#/c/${ch.id}${sec ? '/' + sec.id : ''}">${esc(ch.level.code)} 第 ${ch.num} 章${sec ? ' · ' + esc(sec.title) : ''}</a>` : sec ? `<a class="cm-sec" href="#/c/${ch.id}/${sec.id}">📍 ${esc(sec.title)}</a>` : ''}</div>
        ${cm.quote ? `<blockquote class="quote sm">${esc(cm.quote)}</blockquote>` : ''}
        <div class="cm-text">${esc(cm.text).replace(/\n/g, '<br>')}</div>
        <div class="cm-acts"><button data-reply="${cm.id}">↩︎ 回覆</button>${me && me.id === cm.author ? `<button data-delc="${cm.id}">刪除</button>` : ''}</div>
        ${replies.length ? `<div class="cm-replies">${replies.map((r) => commentHTML(r, all, false)).join('')}</div>` : ''}
      </div></div>`;
  }
  function bindComments(root, after) {
    $$('[data-reply]', root).forEach((b) => b.addEventListener('click', () => {
      const parent = Store.comments().find((x) => x.id === b.dataset.reply); if (!parent) return;
      commentModal(CH[parent.chapter], parent.section, '', parent, after);
    }));
    $$('[data-delc]', root).forEach((b) => b.addEventListener('click', () => { if (confirm('刪除呢個留言（連埋回覆）？')) { Store.removeComment(b.dataset.delc); after(); } }));
  }
  function renderComments(c) {
    const el = $('[data-comments]', view);
    const list = Store.comments(c.id);
    const roots = list.filter((x) => !x.parent).sort((a, b) => b.ts - a.ts);
    const p = Store.activeProfile();
    el.innerHTML = `<h3>💬 家庭討論 <small>（全家共用）</small></h3>
      <form class="cm-form"><span class="av" style="--c:${p ? p.color : '#888'}">${p ? p.emoji : '🙂'}</span><div><textarea rows="2" placeholder="${p ? `以「${esc(p.name)}」身份留言：問題、心得、考吓屋企人…` : '請先建立使用者'}" data-t></textarea>
      <div class="cm-form-foot"><select data-sec><option value="">（整章）</option>${c.sections.map((s) => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select><button class="btn primary sm">發佈</button></div></div></form>
      <div class="cm-list">${roots.map((r) => commentHTML(r, list)).join('') || '<p class="muted">未有討論。第一個發問啦！</p>'}</div>`;
    $('form', el).addEventListener('submit', (e) => {
      e.preventDefault(); if (!p) { askProfile(); return; }
      const t = $('[data-t]', el).value.trim(); if (!t) return;
      Store.addComment({ chapter: c.id, section: $('[data-sec]', el).value || null, text: t });
      renderComments(c);
    });
    bindComments(el, () => renderComments(c));
  }
  function commentModal(c, section, quote, parent, after) {
    if (!Store.activeProfile()) { askProfile(); return; }
    const sec = c.sections.find((s) => s.id === section);
    modal(`<h3>💬 ${parent ? '回覆 ' + esc(parent.name) : '留言'}${sec ? `<small> · ${esc(sec.title)}</small>` : ''}</h3>
      ${parent ? `<blockquote class="quote sm">${esc(parent.text)}</blockquote>` : ''}${quote ? `<blockquote class="quote">${esc(quote)}</blockquote>` : ''}
      <textarea rows="4" data-t placeholder="寫低你嘅問題或者想法…"></textarea>
      <div class="modal-actions"><button class="btn primary" data-send>發佈</button></div>`, (box, close) => {
      box.querySelector('[data-send]').addEventListener('click', () => {
        const t = box.querySelector('[data-t]').value.trim(); if (!t) return;
        Store.addComment({ chapter: c.id, section: section && section !== 'intro' ? section : null, text: t, quote: quote || null, parent: parent ? parent.id : null });
        close(); toast('已發佈'); if (after) after(); else if (location.hash.startsWith('#/c/')) { renderComments(c); }
      });
    });
  }

  /* ---------------- 工具箱 ---------------- */
  function renderTools(id) {
    if (id) {
      const t = TOOLS[id];
      const usedIn = CHAPTERS.filter((c) => c.md.includes(`[[tool:${id}]]`));
      view.innerHTML = `<nav class="crumbs"><a href="#/tools">工具箱</a> › ${esc(t ? t.title : id)}</nav><div data-tool></div>
        ${usedIn.length ? `<p class="muted">📚 相關章節：${usedIn.map((c) => `<a href="#/c/${c.id}">${esc(c.level.code)} 第 ${c.num} 章 ${esc(c.title)}</a>`).join('、')}</p>` : ''}`;
      mountTool($('[data-tool]', view), id, false);
      return;
    }
    const cats = {};
    Object.entries(TOOLS).forEach(([k, t]) => (cats[t.cat] = cats[t.cat] || []).push([k, t]));
    view.innerHTML = `<div class="page-head"><h1>🧰 工具箱</h1><p class="muted">${Object.keys(TOOLS).length} 個互動計算器同小工具。你輸入過嘅數字會自動記住（每個使用者分開）。全部係教學用途。</p></div>
      ${Object.entries(cats).map(([cat, list]) => `<h2 class="sec-h">${esc(cat)}</h2><div class="tool-grid-cards">${list.map(([k, t]) => `<a class="tool-tile" href="#/tools/${k}"><span>${t.icon}</span><b>${esc(t.title)}</b><small>${esc(t.desc)}</small><em>${esc((LEVELS.find((l) => l.id === t.level) || {}).code || '')}</em></a>`).join('')}</div>`).join('')}`;
  }

  /* ---------------- 重播列表 ---------------- */
  function renderReplay(id) {
    if (id) { view.innerHTML = '<div data-rp></div>'; Replay.play($('[data-rp]', view), id); return; }
    const u = Store.user();
    view.innerHTML = `<div class="page-head"><h1>🎮 K 線重播遊戲</h1><p class="muted">好似 TradingView Bar Replay 咁，K 線一支一支出現。每一步你要做決定：WAIT、PLAN、入場、定放棄？答完即刻有解釋。</p></div>
      <div class="tool-grid-cards">${Object.entries(Replay.SCENARIOS).map(([k, s]) => `<a class="tool-tile" href="#/replay/${k}"><span>${s.icon}</span><b>${esc(s.title)}</b><small>${esc(s.desc)}</small><em>${u.replay[k] ? `最佳 ${u.replay[k].best}/${u.replay[k].total}` : '未玩過'}</em></a>`).join('')}</div>`;
  }

  /* ---------------- 測驗中心 ---------------- */
  function renderQuizCenter(id) {
    if (id) {
      const ch = CHAPTERS.find((c) => c.md.includes(`[[quiz:${id}]]`));
      view.innerHTML = `<nav class="crumbs"><a href="#/quiz">測驗中心</a> › ${esc((QUIZZES[id] || {}).title || id)}</nav><div data-q></div>${ch ? `<p class="muted">📚 出自：<a href="#/c/${ch.id}">${esc(ch.level.code)} 第 ${ch.num} 章 ${esc(ch.title)}</a></p>` : ''}`;
      renderQuiz($('[data-q]', view), id); return;
    }
    const u = Store.user();
    const ids = Object.keys(QUIZZES);
    const totalQ = ids.reduce((a, k) => a + QUIZZES[k].questions.length, 0);
    const doneQ = ids.reduce((a, k) => a + (u.quiz[k] ? u.quiz[k].best : 0), 0);
    view.innerHTML = `<div class="page-head"><h1>📝 測驗中心</h1><p class="muted">總共 ${ids.length} 份測驗、${totalQ} 條題目。你已經答啱過 ${doneQ} 條。</p><div class="bar big"><div style="width:${doneQ / totalQ * 100}%"></div></div></div>
      ${LEVELS.map((lv) => { const qs = ids.filter((k) => k.startsWith(lv.id + '-')); return `<h2 class="sec-h">${lv.icon} ${esc(lv.code)}：${esc(lv.title)}</h2><div class="quiz-grid">${qs.map((k) => { const q = QUIZZES[k], r = u.quiz[k]; const ch = CHAPTERS.find((c) => c.md.includes(`[[quiz:${k}]]`)); return `<a class="quiz-tile ${q.final ? 'final' : ''} ${r && r.best === r.total ? 'perfect' : ''}" href="#/quiz/${k}"><b>${q.final ? '🏁 ' : ''}${esc(q.title)}</b><small>${ch ? '第 ' + ch.num + ' 章 · ' : ''}${q.questions.length} 題</small><em>${r ? `${r.best}/${r.total}${r.best === r.total ? ' ⭐' : ''}` : '未做'}</em></a>`; }).join('')}</div>`; }).join('')}`;
  }

  /* ---------------- 字卡 ---------------- */
  function renderCards() {
    const st = Store.user().toolState;
    st.cards = st.cards || { known: {}, lv: 'all' };
    const S = st.cards;
    let deck = [], i = 0, flipped = false;
    const build = () => { deck = GLOSSARY.filter((g) => S.lv === 'all' || g.lv === S.lv).filter((g) => !S.onlyNew || !S.known[g.term]); deck.sort(() => Math.random() - 0.5); i = 0; flipped = false; };
    build();
    view.innerHTML = `<div class="page-head"><h1>🃏 詞彙字卡</h1><p class="muted">撳張卡反轉。識就撳「識咗 ✓」，唔肯定就撳「再溫 ↺」。鍵盤：空白鍵反轉、← → 轉卡。</p>
      <div class="tool-foot"><select data-lv><option value="all">全部 Level</option>${LEVELS.map((l) => `<option value="${l.id}" ${S.lv === l.id ? 'selected' : ''}>${esc(l.code)}</option>`).join('')}</select><label class="chk"><input type="checkbox" data-new ${S.onlyNew ? 'checked' : ''}> 只溫未識嘅</label><button class="btn ghost sm" data-shuffle>🔀 洗牌</button></div></div>
      <div class="fc-stage"><div class="fc-count"></div><button class="flashcard" data-card><div class="fc-inner"><div class="fc-front"></div><div class="fc-back"></div></div></button>
      <div class="fc-nav"><button class="btn" data-prev>←</button><button class="btn" data-again>再溫 ↺</button><button class="btn primary" data-know>識咗 ✓</button><button class="btn" data-next>→</button></div>
      <div class="fc-known"></div></div>`;
    const card = $('[data-card]', view);
    const show = () => {
      const total = GLOSSARY.filter((g) => S.lv === 'all' || g.lv === S.lv);
      const known = total.filter((g) => S.known[g.term]).length;
      $('.fc-known', view).innerHTML = `<div class="bar"><div style="width:${total.length ? known / total.length * 100 : 0}%"></div></div><small>已識 ${known} / ${total.length}</small>`;
      if (!deck.length) { $('.fc-front', view).innerHTML = '🎉 全部識晒！'; $('.fc-back', view).innerHTML = ''; $('.fc-count', view).textContent = ''; return; }
      const g = deck[i];
      card.classList.toggle('flipped', flipped);
      $('.fc-front', view).innerHTML = `<small>${esc((LEVELS.find((l) => l.id === g.lv) || {}).code || '')}</small><b>${esc(g.term)}</b>${S.known[g.term] ? '<em>✓ 已識</em>' : ''}<span class="muted">撳一下睇答案</span>`;
      $('.fc-back', view).innerHTML = `<b>${esc(g.zh)}</b><p>${esc(g.def)}</p>`;
      $('.fc-count', view).textContent = `${i + 1} / ${deck.length}`;
    };
    card.addEventListener('click', () => { flipped = !flipped; show(); });
    const nav = (d) => { if (!deck.length) return; i = (i + d + deck.length) % deck.length; flipped = false; show(); };
    $('[data-prev]', view).addEventListener('click', () => nav(-1));
    $('[data-next]', view).addEventListener('click', () => nav(1));
    $('[data-know]', view).addEventListener('click', () => { if (!deck.length) return; S.known[deck[i].term] = true; Store.awardXP('card:' + deck[i].term, 1); Store.save(); if (S.onlyNew) { deck.splice(i, 1); if (i >= deck.length) i = 0; flipped = false; show(); } else nav(1); });
    $('[data-again]', view).addEventListener('click', () => { if (!deck.length) return; delete S.known[deck[i].term]; Store.save(); nav(1); });
    $('[data-lv]', view).addEventListener('change', (e) => { S.lv = e.target.value; Store.save(); build(); show(); });
    $('[data-new]', view).addEventListener('change', (e) => { S.onlyNew = e.target.checked; Store.save(); build(); show(); });
    $('[data-shuffle]', view).addEventListener('click', () => { build(); show(); });
    const onKey = (e) => { if (!location.hash.startsWith('#/cards')) { document.removeEventListener('keydown', onKey); return; } if (e.target.closest('input,textarea,select')) return; if (e.key === ' ') { e.preventDefault(); flipped = !flipped; show(); } if (e.key === 'ArrowRight') nav(1); if (e.key === 'ArrowLeft') nav(-1); };
    document.addEventListener('keydown', onKey);
    show();
  }

  /* ---------------- 詞彙表 ---------------- */
  function renderGlossary() {
    view.innerHTML = `<div class="page-head"><h1>📖 詞彙表</h1><p class="muted">${GLOSSARY.length} 個課程用到嘅詞彙。</p><input type="search" class="filter" placeholder="搵詞彙…" data-f></div>
      ${LEVELS.map((lv) => `<section class="gl-sec" data-lv="${lv.id}"><h2 class="sec-h">${lv.icon} ${esc(lv.code)}</h2><dl class="gloss">${GLOSSARY.filter((g) => g.lv === lv.id).map((g) => `<div class="gl-item" data-t="${esc((g.term + g.zh + g.def).toLowerCase())}"><dt>${esc(g.term)} <small>${esc(g.zh)}</small></dt><dd>${esc(g.def)}</dd></div>`).join('')}</dl></section>`).join('')}`;
    $('[data-f]', view).addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('.gl-item', view).forEach((x) => (x.style.display = !q || x.dataset.t.includes(q) ? '' : 'none')); });
  }

  /* ---------------- 我的 ---------------- */
  function renderMe(tab) {
    tab = tab || 'bookmarks';
    const u = Store.user();
    const secTitle = (ch, sid) => { const c = CH[ch]; if (!c) return ''; if (sid === '_chapter') return '（整章）'; const s = c.sections.find((x) => x.id === sid); return s ? s.title : ''; };
    const chLabel = (ch) => { const c = CH[ch]; return c ? `${c.level.code} 第 ${c.num} 章 · ${c.title}` : ch; };
    const tabs = [['bookmarks', '⭐ 書籤', u.bookmarks.length], ['notes', '📝 筆記', Object.keys(u.notes).length], ['highlights', '🖍️ 螢光筆', u.highlights.length], ['videos', '🎬 影片', Store.videos().length]];
    let body = '';
    if (tab === 'bookmarks') body = u.bookmarks.length ? `<ul class="me-list">${u.bookmarks.map((b) => `<li><a href="#/c/${b.chapter}${b.section !== '_chapter' ? '/' + b.section : ''}"><b>${esc(secTitle(b.chapter, b.section) || b.title)}</b><small>${esc(chLabel(b.chapter))} · ${ago(b.ts)}</small></a><button data-unbm="${b.chapter}|${b.section}" title="移除">×</button></li>`).join('')}</ul>` : '<div class="empty">未有書籤。每個小節標題右邊有 ☆，撳一下就加書籤。</div>';
    if (tab === 'notes') { const ks = Object.keys(u.notes).sort((a, b) => u.notes[b].ts - u.notes[a].ts); body = ks.length ? `<ul class="me-list notes">${ks.map((k) => { const [ch, sid] = k.split('#'); return `<li><a href="#/c/${ch}${sid !== '_chapter' ? '/' + sid : '/ch-end'}"><b>${esc(secTitle(ch, sid))}</b><small>${esc(chLabel(ch))} · ${ago(u.notes[k].ts)}</small><p>${esc(u.notes[k].text).replace(/\n/g, '<br>')}</p></a></li>`; }).join('')}</ul>` : '<div class="empty">未有筆記。每個小節標題右邊有 📝；每章底部亦有「本章筆記」。</div>'; }
    if (tab === 'highlights') body = u.highlights.length ? `<ul class="me-list">${u.highlights.slice().reverse().map((h) => `<li><a href="#/c/${h.chapter}/${h.section}"><mark class="hl hl-${h.color}">${esc(h.text)}</mark>${h.note ? `<p>📝 ${esc(h.note)}</p>` : ''}<small>${esc(chLabel(h.chapter))} · ${ago(h.ts)}</small></a></li>`).join('')}</ul>` : '<div class="empty">未有螢光筆。喺課文入面用滑鼠（或者手指長按）揀選文字，就會彈出螢光筆工具。</div>';
    if (tab === 'videos') { const vs = Store.videos().slice().reverse(); body = vs.length ? `<div class="video-list">${vs.map((v) => videoHTML(v, true)).join('')}</div>` : '<div class="empty">未有影片。每章底部可以加影片連結。</div>'; }
    view.innerHTML = `<div class="page-head"><h1>⭐ 我嘅書籤・筆記・螢光筆</h1><p class="muted">書籤、筆記同螢光筆屬於「${esc((Store.activeProfile() || {}).name || '')}」；影片係全家共用。</p></div>
      <div class="tabs">${tabs.map(([k, l, n]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/me/${k}">${l}（${n}）</a>`).join('')}</div>${body}`;
    $$('[data-unbm]', view).forEach((b) => b.addEventListener('click', () => { const [ch, s] = b.dataset.unbm.split('|'); Store.toggleBookmark(ch, s); renderMe('bookmarks'); }));
    bindVideoEvents(view, () => renderMe('videos'));
  }

  function renderBoard() {
    const all = Store.comments();
    const roots = all.filter((x) => !x.parent).sort((a, b) => b.ts - a.ts);
    view.innerHTML = `<div class="page-head"><h1>💬 家庭討論區</h1><p class="muted">全部章節嘅留言集中喺度。想發問：去相關章節底部，或者揀選課文文字撳「💬 留言」。</p></div>
      <div class="cm-list">${roots.map((r) => commentHTML(r, all, true)).join('') || '<div class="empty">未有留言。</div>'}</div>`;
    bindComments(view, renderBoard);
  }

  /* ---------------- 家庭進度 ---------------- */
  function renderFamily() {
    const ps = Store.profiles();
    view.innerHTML = `<div class="page-head"><h1>👨‍👩‍👧 家庭進度</h1><p class="muted">同一部機（或者匯入咗備份）嘅所有使用者。可以睇吓邊個讀到邊、互相鼓勵！</p><button class="btn primary sm" data-add>＋ 加家庭成員</button></div>
      <div class="fam-cards">${ps.map((p) => { const u = Store.user(p.id); const o = overall(p.id); const rk = rank(u.xp); const bd = badges(p.id); const last = u.last && CH[u.last.chapter]; return `
        <div class="fam-card ${p.id === Store.db.active ? 'me' : ''}" style="--c:${p.color}">
          <div class="fam-top"><span class="av lg" style="--c:${p.color}">${p.emoji}</span><div><b>${esc(p.name)}</b><small>${rk.icon} ${rk.name} · ${u.xp} XP · 🔥${u.streak.count || 0}</small></div>${p.id !== Store.db.active ? `<button class="btn sm" data-switch="${p.id}">切換</button>` : '<em>使用中</em>'}</div>
          ${LEVELS.map((lv) => { const s = levelStats(lv, p.id); return `<div class="fam-lv"><span>${lv.icon} ${esc(lv.code)}</span><div class="bar"><div style="width:${s.pct * 100}%;background:${lv.color}"></div></div><small>${s.done}/${s.total}</small></div>`; }).join('')}
          <p class="fam-last">${last ? `📍 讀緊：${esc(last.level.code)} 第 ${last.num} 章 ${esc(last.title)}（${ago(u.last.ts)}）` : '未開始'}</p>
          <div class="badges">${bd.map((b) => `<span title="${esc(b[1])}">${b[0]} ${esc(b[1])}</span>`).join('') || '<span class="muted">未有徽章</span>'}</div>
        </div>`; }).join('')}</div>
      <h2 class="sec-h">逐章完成情況</h2>
      <div class="tbl-wrap"><table class="tbl fam-tbl"><thead><tr><th>章節</th>${ps.map((p) => `<th>${p.emoji}<br><small>${esc(p.name)}</small></th>`).join('')}</tr></thead><tbody>
      ${CHAPTERS.map((c) => `<tr><td><a href="#/c/${c.id}">${esc(c.level.code)} · ${c.num}. ${esc(c.title)}</a></td>${ps.map((p) => { const v = chapterPct(c, p.id); return `<td class="c">${v >= 1 ? '✅' : v > 0 ? `<span class="pc">${Math.round(v * 100)}%</span>` : '·'}</td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div>`;
    $$('[data-switch]', view).forEach((b) => b.addEventListener('click', () => { Store.setActive(b.dataset.switch); toast('已切換使用者'); route(); }));
    $('[data-add]', view).addEventListener('click', () => profileForm());
  }

  /* ---------------- 使用者 ---------------- */
  const EMOJIS = ['🙂', '😎', '🧑', '👩', '👨', '👧', '👦', '🧒', '🐯', '🐼', '🦊', '🐻', '🚀', '⭐', '🦄', '🐲'];
  const COLORS = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777', '#0891b2', '#ca8a04', '#dc2626'];
  function profileForm(p, first) {
    let emoji = p ? p.emoji : EMOJIS[Store.profiles().length % EMOJIS.length];
    let color = p ? p.color : COLORS[Store.profiles().length % COLORS.length];
    modal(`<h3>${first ? '👋 歡迎嚟到 TSLA Day Trading 學院！' : p ? '編輯使用者' : '＋ 新增家庭成員'}</h3>
      ${first ? '<p>每個家庭成員可以有自己嘅檔案：<b>閱讀進度、書籤、筆記、螢光筆、測驗分數</b>各自分開；<b>留言同影片</b>就全家共用，方便討論。</p>' : ''}
      <label class="fld wide"><span>名稱</span><input data-name maxlength="20" value="${esc(p ? p.name : first ? '' : '')}" placeholder="例如：爸爸、媽媽、阿仔"></label>
      <div class="pick"><span>頭像</span><div class="emoji-pick">${EMOJIS.map((e) => `<button type="button" data-e="${e}" class="${e === emoji ? 'on' : ''}">${e}</button>`).join('')}</div></div>
      <div class="pick"><span>顏色</span><div class="color-pick">${COLORS.map((c) => `<button type="button" data-col="${c}" style="background:${c}" class="${c === color ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div></div>
      <div class="modal-actions">${p && Store.profiles().length > 1 ? '<button class="btn ghost danger" data-del>刪除呢個使用者</button>' : ''}<button class="btn primary" data-save>${first ? '開始學習 🚀' : '儲存'}</button></div>`, (box, close) => {
      $$('[data-e]', box).forEach((b) => b.addEventListener('click', () => { emoji = b.dataset.e; $$('[data-e]', box).forEach((x) => x.classList.toggle('on', x === b)); }));
      $$('[data-col]', box).forEach((b) => b.addEventListener('click', () => { color = b.dataset.col; $$('[data-col]', box).forEach((x) => x.classList.toggle('on', x === b)); }));
      box.querySelector('[data-save]').addEventListener('click', () => {
        const name = box.querySelector('[data-name]').value.trim() || '學員';
        if (p) Store.updateProfile(p.id, { name, emoji, color });
        else { const np = Store.addProfile(name, emoji, color); Store.setActive(np.id); }
        close(); renderProfileChip(); route();
        if (first) toast(`歡迎你，${esc(name)}！`);
      });
      const del = box.querySelector('[data-del]');
      if (del) del.addEventListener('click', () => { if (confirm(`確定刪除「${p.name}」？佢嘅進度、書籤、筆記會一併刪除（留言會保留）。`)) { Store.removeProfile(p.id); close(); renderProfileChip(); route(); } });
    }, { noFocus: false });
  }
  function askProfile() { if (!Store.profiles().length) profileForm(null, true); }
  function renderProfileChip() {
    const p = Store.activeProfile();
    const btn = $('#btn-profile');
    btn.innerHTML = p ? `<span class="av sm" style="--c:${p.color}">${p.emoji}</span><span class="pc-name">${esc(p.name)}</span><span class="pc-xp">${Store.user().xp} XP</span>` : '<span class="av sm">🙂</span><span class="pc-name">建立使用者</span>';
  }
  $('#btn-profile').addEventListener('click', () => {
    if (!Store.profiles().length) { profileForm(null, true); return; }
    modal(`<h3>👤 切換使用者</h3><div class="prof-list">${Store.profiles().map((p) => `<div class="prof-row ${p.id === Store.db.active ? 'on' : ''}"><button class="prof-pick" data-pick="${p.id}"><span class="av" style="--c:${p.color}">${p.emoji}</span><b>${esc(p.name)}</b><small>${Store.user(p.id).xp} XP · ${Math.round(overall(p.id).pct * 100)}%</small></button><button class="btn ghost sm" data-edit="${p.id}">編輯</button></div>`).join('')}</div>
      <div class="modal-actions"><a class="btn ghost" href="#/family" data-close>家庭進度</a><button class="btn primary" data-new>＋ 新增家庭成員</button></div>`, (box, close) => {
      $$('[data-pick]', box).forEach((b) => b.addEventListener('click', () => { Store.setActive(b.dataset.pick); close(); renderProfileChip(); route(); toast('已切換'); }));
      $$('[data-edit]', box).forEach((b) => b.addEventListener('click', () => { close(); profileForm(Store.profiles().find((p) => p.id === b.dataset.edit)); }));
      box.querySelector('[data-new]').addEventListener('click', () => { close(); profileForm(); });
    }, { noFocus: true });
  });

  /* ---------------- 設定 ---------------- */
  function renderSettings() {
    const ps = Store.profiles();
    view.innerHTML = `<div class="page-head"><h1>⚙️ 設定・備份・同步</h1></div>
      <div class="card"><div class="card-h">👤 使用者</div>${ps.map((p) => `<div class="prof-row"><span class="av" style="--c:${p.color}">${p.emoji}</span><b>${esc(p.name)}</b><button class="btn ghost sm" data-edit="${p.id}">編輯</button></div>`).join('')}<button class="btn sm" data-new>＋ 新增家庭成員</button></div>
      <div class="card"><div class="card-h">🎨 顯示</div>
        <div class="tool-foot"><span>主題：</span><button class="btn sm" data-theme="">跟系統</button><button class="btn sm" data-theme="light">☀️ 淺色</button><button class="btn sm" data-theme="dark">🌙 深色</button></div>
        <div class="tool-foot"><span>字體大小：</span>${[0.9, 1, 1.1, 1.2, 1.35].map((f) => `<button class="btn sm" data-font="${f}">${Math.round(f * 100)}%</button>`).join('')}</div></div>
      <div class="card"><div class="card-h">💾 備份同同步（唔同裝置之間）</div>
        <p>所有資料只儲存喺<b>呢部機嘅瀏覽器</b>（唔會上載去任何伺服器）。想喺爸爸部電腦同細路部 iPad 之間同步：</p>
        <ol><li>喺 A 機撳「⬇️ 匯出備份」，得到一個 .json 檔。</li><li>用 WhatsApp / AirDrop / Email 傳去 B 機。</li><li>喺 B 機撳「⬆️ 匯入（合併）」揀個檔 —— 進度、書籤、筆記、留言、影片會<b>合併</b>，唔會覆蓋 B 機原有資料。</li><li>B 機再匯出，傳返 A 機合併，兩邊就一致。</li></ol>
        <div class="tool-foot"><button class="btn primary" data-export>⬇️ 匯出備份（全部使用者）</button><label class="btn">⬆️ 匯入（合併）<input type="file" accept=".json,application/json" hidden data-import="merge"></label><label class="btn ghost">⬆️ 匯入（完全取代）<input type="file" accept=".json,application/json" hidden data-import="replace"></label></div></div>
      <div class="card"><div class="card-h">🧹 重設</div><p class="muted">清除呢部機所有使用者同資料（建議先匯出備份）。</p><button class="btn ghost danger" data-reset>清除全部資料</button></div>
      <div class="card"><div class="card-h">📱 加到手機主畫面</div><p>iPhone / iPad：用 Safari 打開 → 分享 → 「加至主畫面」。Android：Chrome 選單 → 「安裝應用程式」。加咗之後可以好似 App 咁開，部分內容離線都睇到。</p></div>
      <div class="card"><div class="card-h">ℹ️ 關於</div><p>內容整理自你用 ChatGPT 生成嘅 Level 3–5 課程筆記，加上 Level 1–2 基礎重溫、新手錯誤章節、互動計算器、K 線重播遊戲、測驗、字卡同交易日誌。所有 TSLA 數字均為教學模擬，不構成投資建議。部分平台規則（例如 PDT、T+1、IBKR 數據）會變，請以官方最新公布為準。</p></div>`;
    $$('[data-edit]', view).forEach((b) => b.addEventListener('click', () => profileForm(ps.find((p) => p.id === b.dataset.edit))));
    $('[data-new]', view).addEventListener('click', () => profileForm());
    $$('[data-theme]', view).forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme)));
    $$('[data-font]', view).forEach((b) => b.addEventListener('click', () => setFont(+b.dataset.font)));
    $('[data-export]', view).addEventListener('click', () => { download(`trading-academy-backup-${Store.today()}.json`, Store.exportJSON(), 'application/json'); toast('已匯出'); });
    $$('[data-import]', view).forEach((inp) => inp.addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const mode = inp.dataset.import;
      if (mode === 'replace' && !confirm('完全取代會清除呢部機現有資料，確定？')) return;
      const r = new FileReader();
      r.onload = () => { try { Store.importJSON(r.result, mode); toast('匯入成功'); renderProfileChip(); route(); } catch (err) { alert('匯入失敗：' + err.message); } };
      r.readAsText(f);
    }));
    $('[data-reset]', view).addEventListener('click', () => { if (confirm('真係要清除全部資料？呢個動作冇得還原。')) { Store.resetAll(); renderProfileChip(); go('#/'); setTimeout(askProfile, 300); } });
  }

  /* ---------------- 主題 / 字體 ---------------- */
  function setTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); Store.setUI({ theme: t || null }); }
  function setFont(f) { document.documentElement.style.setProperty('--font-scale', f); Store.setUI({ font: f }); }
  $('#btn-theme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });
  $('#btn-font').addEventListener('click', () => {
    const steps = [0.9, 1, 1.1, 1.2, 1.35];
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale')) || 1;
    const nx = steps[(steps.findIndex((s) => Math.abs(s - cur) < 0.01) + 1) % steps.length];
    setFont(nx); toast(`字體 ${Math.round(nx * 100)}%`, 1000);
  });

  /* ---------------- 搜尋 ---------------- */
  const strip = (md) => md.replace(/^:::.*$/gm, ' ').replace(/^\[\[.*\]\]$/gm, ' ').replace(/<[^>]+>/g, ' ').replace(/[*_`#>|]/g, ' ').replace(/\$\$/g, ' ').replace(/-{3,}/g, ' ').replace(/\s+/g, ' ');
  const INDEX = [];
  CHAPTERS.forEach((c) => {
    const parts = c.md.split(/^##\s+/m);
    INDEX.push({ kind: 'ch', c, sec: null, title: c.title, text: strip(parts[0] + ' ' + c.summary + ' ' + (c.keywords || []).join(' ')) });
    parts.slice(1).forEach((p, i) => { const title = (c.sections[i] || {}).title || p.split('\n')[0]; INDEX.push({ kind: 'sec', c, sec: c.sections[i] && c.sections[i].id, title, text: strip(p) }); });
  });
  GLOSSARY.forEach((g) => INDEX.push({ kind: 'gl', title: g.term + '（' + g.zh + '）', text: g.def }));
  Object.entries(TOOLS).forEach(([k, t]) => INDEX.push({ kind: 'tool', id: k, title: t.title, text: t.desc }));
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const terms = q.split(/\s+/);
    const res = [];
    INDEX.forEach((it) => {
      const hay = (it.title + ' ' + it.text).toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return;
      let score = it.title.toLowerCase().includes(terms[0]) ? 10 : 0; score += (hay.split(terms[0]).length - 1);
      const pos = it.text.toLowerCase().indexOf(terms[0]);
      const snip = pos >= 0 ? (pos > 30 ? '…' : '') + it.text.slice(Math.max(0, pos - 30), pos + 70) + '…' : it.text.slice(0, 90);
      res.push({ it, score, snip });
    });
    return res.sort((a, b) => b.score - a.score).slice(0, 14);
  }
  const sInput = $('#search'), sRes = $('#search-results');
  const hlTerm = (s, q) => { const t = q.trim().split(/\s+/)[0]; if (!t) return esc(s); const i = s.toLowerCase().indexOf(t.toLowerCase()); if (i < 0) return esc(s); return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + t.length)) + '</mark>' + esc(s.slice(i + t.length)); };
  function showResults() {
    const q = sInput.value; const r = search(q);
    if (!q.trim()) { sRes.hidden = true; return; }
    sRes.hidden = false;
    sRes.innerHTML = r.length ? r.map(({ it, snip }, i) => {
      const href = it.kind === 'gl' ? '#/glossary' : it.kind === 'tool' ? '#/tools/' + it.id : `#/c/${it.c.id}${it.sec ? '/' + it.sec : ''}`;
      const where = it.kind === 'gl' ? '📖 詞彙' : it.kind === 'tool' ? '🧰 工具' : `${it.c.level.code} 第 ${it.c.num} 章`;
      return `<a class="sr ${i === 0 ? 'on' : ''}" href="${href}" data-q="${esc(q.trim().split(/\s+/)[0])}"><small>${where}</small><b>${hlTerm(it.title, q)}</b><span>${hlTerm(snip, q)}</span></a>`;
    }).join('') : '<div class="sr-empty">搵唔到相關內容</div>';
  }
  sInput.addEventListener('input', showResults);
  sInput.addEventListener('focus', showResults);
  sInput.addEventListener('keydown', (e) => {
    const items = $$('.sr', sRes); let i = items.findIndex((x) => x.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; items[i] && items[i].classList.remove('on'); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[i].classList.add('on'); items[i].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && items[i]) { e.preventDefault(); items[i].click(); }
    if (e.key === 'Escape') { sRes.hidden = true; sInput.blur(); }
  });
  sRes.addEventListener('click', (e) => { const a = e.target.closest('.sr'); if (!a) return; sessionStorage.setItem('ta:flash', a.dataset.q); sRes.hidden = true; sInput.value = ''; closeMenu(); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) sRes.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !e.target.closest('input,textarea,select')) { e.preventDefault(); sInput.focus(); } });

  /* ---------------- 手機選單 ---------------- */
  const openMenu = () => { document.body.classList.add('menu-open'); $('#scrim').hidden = false; };
  const closeMenu = () => { document.body.classList.remove('menu-open'); $('#scrim').hidden = true; };
  $('#btn-menu').addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  $('#scrim').addEventListener('click', closeMenu);
  $('#toc').addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

  /* ---------------- 路由 ---------------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/');
    const r = parts[0] || 'home';
    pop.hidden = true;
    if (scrollHandler && r !== 'c') { window.removeEventListener('scroll', scrollHandler); scrollHandler = null; }
    $('#readbar-fill').style.width = '0';
    document.body.dataset.route = r;
    let activeCh = null;
    if (r === 'c' && CH[parts[1]]) {
      activeCh = CH[parts[1]];
      const same = view.querySelector('.chapter') && view.dataset.ch === activeCh.id;
      if (same && parts[2]) { const t = document.getElementById(parts[2]); if (t) { t.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); renderTOC(activeCh, 'chapter'); return; } }
      view.dataset.ch = activeCh.id;
      renderChapter(activeCh, parts[2]);
      renderRail(activeCh);
      document.title = `${activeCh.title}｜${activeCh.level.code}｜TSLA Day Trading 學院`;
    } else {
      view.dataset.ch = '';
      renderRail(null);
      window.scrollTo(0, 0);
      const titles = { home: '主頁', toc: '完整目錄', tools: '工具箱', replay: 'K 線重播', quiz: '測驗中心', cards: '字卡', glossary: '詞彙表', me: '我的', board: '討論區', family: '家庭進度', settings: '設定', journal: '交易日誌' };
      document.title = (titles[r] ? titles[r] + '｜' : '') + 'TSLA Day Trading 學院';
      if (r === 'toc') renderFullTOC();
      else if (r === 'tools') renderTools(parts[1]);
      else if (r === 'replay') renderReplay(parts[1]);
      else if (r === 'quiz') renderQuizCenter(parts[1]);
      else if (r === 'cards') renderCards();
      else if (r === 'glossary') renderGlossary();
      else if (r === 'me') renderMe(parts[1]);
      else if (r === 'board') renderBoard();
      else if (r === 'family') renderFamily();
      else if (r === 'settings') renderSettings();
      else if (r === 'journal') Journal.render(view, parts[1]);
      else renderHome();
    }
    renderTOC(activeCh, r === 'c' ? 'chapter' : r);
    renderProfileChip();
    $('#main').focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  window.App = { toast, modal, download, go, route, CH, CHAPTERS, LEVELS, renderQuiz, mountTool };

  /* ---------------- 啟動 ---------------- */
  Store.touchStreak();
  route();
  if (!Store.profiles().length) setTimeout(() => profileForm(null, true), 400);
  window.addEventListener('ta:save-error', () => toast('⚠️ 儲存失敗：瀏覽器可能封鎖咗本機儲存（例如私密瀏覽）'));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
