/* =========================================================
 * 學習功能：訓練場、錯題本（間隔重溫）、每日任務、學習日曆、
 * Level 概覽、使用指南、詞彙提示、朗讀、匯出筆記
 * 全部例子都係教學模擬
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const F = (v, d = 2) => (+v).toFixed(d);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rf = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const App = () => window.App;

  /* =========================================================
   * 每日任務 + 學習日曆
   * ========================================================= */
  const QUEST_POOL = [
    { k: 'quiz', n: 5, t: '答 5 條測驗題', icon: '📝', href: '#/quiz' },
    { k: 'drill', n: 1, t: '完成 1 次訓練場練習', icon: '🏋️', href: '#/gym' },
    { k: 'review', n: 3, t: '溫習 3 題錯題或字卡', icon: '🔁', href: '#/review' },
    { k: 'note', n: 1, t: '寫 1 個筆記或螢光筆', icon: '🖍️', href: null },
    { k: 'replay', n: 1, t: '玩 1 個 K 線重播', icon: '🎮', href: '#/replay' },
    { k: 'journal', n: 1, t: '寫 1 篇日誌或分析紀錄', icon: '📒', href: '#/tools/pa-journal' },
  ];
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function quests(uid) {
    const t = Store.today(), u = Store.user(uid);
    const a = (u.activity || {})[t] || {};
    const pid = uid || (Store.activeProfile() || {}).id || '';
    const h = hash(t + pid);
    const pool = QUEST_POOL.slice();
    const chosen = [];
    for (let i = 0; i < 2; i++) chosen.push(pool.splice((h >>> (i * 5)) % pool.length, 1)[0]);
    const last = u.last && App().CH[u.last.chapter];
    const readHref = last ? `#/c/${last.id}${u.last.section ? '/' + u.last.section : ''}` : '#/toc';
    const list = [{ k: 'sec', n: 3, t: '讀 3 個小節', icon: '📖', href: readHref }].concat(chosen).map((q) => Object.assign({}, q, { href: q.href || readHref, have: Math.min(q.n, a[q.k] || 0) }));
    return { list, done: list.every((q) => q.have >= q.n), bonus: !!u.xpLog['quest:' + t] };
  }
  function questCard() {
    const q = quests();
    return `<div class="card quest-card ${q.done ? 'all-done' : ''}"><div class="card-h">🎯 今日任務 <small>${q.done ? '全部完成 🎉' : '完成全部 +15 XP'}</small></div>
      ${q.list.map((x) => `<a class="quest ${x.have >= x.n ? 'ok' : ''}" href="${x.href}"><span class="q-ic">${x.have >= x.n ? '✅' : x.icon}</span><span class="q-t">${esc(x.t)}</span><span class="q-n">${x.have}/${x.n}</span><span class="q-bar"><i style="width:${x.have / x.n * 100}%"></i></span></a>`).join('')}</div>`;
  }
  window.addEventListener('ta:act', () => {
    if (!Store.activeProfile()) return;
    const q = quests();
    if (q.done && !q.bonus) {
      Store.awardXP('quest:' + Store.today(), 15);
      setTimeout(() => { App().toast('🎯 今日任務全部完成！+15 XP'); App().confetti(); }, 300);
    }
  });

  function heatmap(uid, compact) {
    const u = Store.user(uid), act = u.activity || {};
    const weeks = compact ? 12 : 20;
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(start.getDate() - (weeks * 7 - 1) - end.getDay());
    const ds = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const lvl = (x) => (!x ? 0 : x < 10 ? 1 : x < 30 ? 2 : x < 60 ? 3 : 4);
    let cells = '', days = 0, xp = 0, week = 0;
    const weekAgo = new Date(end); weekAgo.setDate(weekAgo.getDate() - 6);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = ds(d), a = act[k] || {}, v = a.xp || 0;
      const any = Object.keys(a).some((key) => a[key] > 0);
      if (any) days++;
      xp += v; if (d >= weekAgo) week += v;
      const detail = [a.sec && `讀 ${a.sec} 節`, a.quiz && `答 ${a.quiz} 題`, a.drill && `訓練 ${a.drill} 次`, a.review && `溫習 ${a.review}`, a.replay && `重播 ${a.replay}`, a.note && `筆記 ${a.note}`, a.journal && `日誌 ${a.journal}`].filter(Boolean).join('、');
      cells += `<i class="h${lvl(v)}" title="${k}：${v} XP${detail ? '｜' + detail : ''}"></i>`;
    }
    return `<div class="heat ${compact ? 'compact' : ''}"><div class="heat-grid" style="--w:${weeks + 1}">${cells}</div>
      <div class="heat-foot"><span>過去 ${weeks} 星期：學習 <b>${days}</b> 日・<b>${xp}</b> XP・最近 7 日 <b>${week}</b> XP</span><span class="heat-key">少 <i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i> 多</span></div></div>`;
  }

  /* =========================================================
   * 錯題本（間隔重溫）
   * ========================================================= */
  function wrongItem(key) {
    const k = key.lastIndexOf(':'); const qid = key.slice(0, k), i = +key.slice(k + 1);
    const qz = QUIZZES[qid]; if (!qz || !qz.questions[i]) return null;
    return { key, qid, i, qz, q: qz.questions[i] };
  }
  function chapterOfQuiz(qid) { return App().CHAPTERS.find((c) => c.md.includes(`[[quiz:${qid}]]`)); }
  function renderReview(view) {
    const u = Store.user();
    const all = Object.keys(u.wrong).map(wrongItem).filter(Boolean);
    const due = Store.dueWrong().map(wrongItem).filter(Boolean);
    const boxDots = (b) => '●'.repeat(b) + '○'.repeat(4 - b);
    const byQuiz = {};
    all.forEach((x) => { (byQuiz[x.qid] = byQuiz[x.qid] || []).push(x); });
    view.innerHTML = `<div class="page-head"><h1>📕 錯題本・今日溫習</h1>
      <p class="muted">喺任何測驗答錯嘅題目會自動入嚟。之後按<b>間隔重溫</b>安排：答錯 → 今日再溫；答啱 → 1、3、7、14 日後再考；連續答啱 4 次就當「掌握」，自動移出錯題本。</p></div>
      <div class="review-top">
        <div class="stat-box"><b>${due.length}</b><small>今日要溫</small></div>
        <div class="stat-box"><b>${all.length}</b><small>錯題本總數</small></div>
        <div class="stat-box"><b>${Object.keys(u.xpLog).filter((k) => k.startsWith('master:')).length}</b><small>已掌握</small></div>
        <div class="rv-actions">${due.length ? '<button class="btn primary lg" data-start>▶ 開始今日溫習</button>' : all.length ? '<button class="btn lg" data-all>🔁 再練一次全部錯題</button>' : ''}<a class="btn ghost" href="#/cards">🃏 溫字卡</a></div>
      </div>
      <div data-session></div>
      ${all.length ? `<h2 class="sec-h">全部錯題</h2>${Object.keys(byQuiz).map((qid) => { const ch = chapterOfQuiz(qid); return `<div class="card rv-group"><div class="card-h">${esc(QUIZZES[qid].title)}${ch ? ` <a href="#/c/${ch.id}">📚 ${esc(ch.level.code)} 第 ${ch.num} 章 →</a>` : ''}</div>${byQuiz[qid].map((x) => { const w = u.wrong[x.key]; return `<div class="rv-row"><span class="rv-box" title="重溫進度">${boxDots(w.box)}</span><span class="rv-q">${esc(x.q.q)}</span><small>${w.due <= Store.today() ? '<b class="due">今日</b>' : '下次：' + w.due.slice(5)}${w.miss > 1 ? `・錯咗 ${w.miss} 次` : ''}</small></div>`; }).join('')}</div>`; }).join('')}`
      : '<div class="empty">錯題本係空嘅 👍<br>去 <a href="#/quiz">測驗中心</a> 做測驗，答錯嘅題目會自動收集喺度。</div>'}`;
    const run = (items, scheduled) => {
      const box = $('[data-session]', view);
      const list = shuffle(items);
      let n = 0, right = 0;
      const show = () => {
        if (n >= list.length) {
          box.innerHTML = `<div class="card rv-done"><span>${right === list.length ? '🏆' : '📘'}</span><b>完成！答啱 ${right} / ${list.length}</b><p class="muted">${scheduled ? '答錯嘅題目今日會再出現；答啱嘅已經排咗下次重溫日期。' : '練習模式唔會改動重溫排程。'}</p><button class="btn" data-back>返回錯題本</button></div>`;
          $('[data-back]', box).addEventListener('click', () => renderReview(view));
          if (right === list.length && list.length >= 3) App().confetti();
          return;
        }
        const x = list[n], ch = chapterOfQuiz(x.qid);
        const order = shuffle(x.q.options.map((o, j) => j));
        box.innerHTML = `<div class="card rv-card"><div class="rv-prog"><span>第 ${n + 1} / ${list.length} 題</span><div class="bar"><div style="width:${n / list.length * 100}%"></div></div></div>
          <p class="qq-q">${esc(x.q.q)}</p><div class="qq-opts">${order.map((j, idx) => `<button class="qq-opt" data-j="${j}">${String.fromCharCode(65 + idx)}. ${esc(x.q.options[j])}</button>`).join('')}</div><div class="qq-fb"></div>
          <small class="muted">出自：${esc(x.qz.title)}${ch ? `（<a href="#/c/${ch.id}">${esc(ch.level.code)} 第 ${ch.num} 章</a>）` : ''}</small></div>`;
        $$('.qq-opt', box).forEach((b) => b.addEventListener('click', () => {
          const j = +b.dataset.j, ok = j === x.q.answer;
          $$('.qq-opt', box).forEach((o) => { o.disabled = true; const jj = +o.dataset.j; if (jj === x.q.answer) o.classList.add('right'); else if (jj === j) o.classList.add('wrong'); });
          if (ok) right++;
          if (scheduled) Store.recordAnswer(x.qid, x.i, ok); else if (!ok) Store.recordAnswer(x.qid, x.i, false);
          Store.logAct('review');
          if (ok) Store.awardXP(`rv:${x.key}:${Store.today()}`, 2);
          $('.qq-fb', box).innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✅ 正確' : '❌ 再諗諗'}：${esc(x.q.explain)}</div><div class="tool-foot"><button class="btn primary" data-next>${n + 1 < list.length ? '下一題 →' : '睇結果'}</button></div>`;
          $('[data-next]', box).addEventListener('click', () => { n++; show(); });
        }));
      };
      show();
      box.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70);
    };
    const st = $('[data-start]', view); if (st) st.addEventListener('click', () => run(due, true));
    const al = $('[data-all]', view); if (al) al.addEventListener('click', () => run(all, false));
  }

  /* =========================================================
   * 訓練場
   * ========================================================= */
  const CANDLE_TYPES = {
    bull: { name: '強勢陽燭（大實體、收近高位）', make() { const o = rf(98, 100), c = o + rf(3.5, 5.5); return { o, c, h: c + rf(0.05, 0.35), l: o - rf(0.05, 0.35) }; }, why: '實體佔全幅大部分、收市接近最高位：買方由頭控制到尾。' },
    bear: { name: '強勢陰燭（大實體、收近低位）', make() { const o = rf(103, 105), c = o - rf(3.5, 5.5); return { o, c, h: o + rf(0.05, 0.35), l: c - rf(0.05, 0.35) }; }, why: '實體佔全幅大部分、收市接近最低位：賣方由頭控制到尾。' },
    doji: { name: 'Doji 十字星（猶豫）', make() { const o = rf(100, 102), c = o + rf(-0.15, 0.15); return { o, c, h: Math.max(o, c) + rf(1.5, 2.8), l: Math.min(o, c) - rf(1.5, 2.8) }; }, why: '開市同收市幾乎一樣、上下影線都有：買賣雙方暫時打和。' },
    hammer: { name: 'Hammer 錘頭（下影線拒絕）', make() { const c = rf(102, 104), o = c - rf(0.3, 0.9) * (Math.random() < 0.7 ? 1 : -1); return { o, c, h: Math.max(o, c) + rf(0.02, 0.2), l: Math.min(o, c) - rf(2.6, 4) }; }, why: '長下影線 ≥ 實體兩倍、收喺上半部：曾經大跌但被買返上嚟。要喺支持區先有意義。' },
    star: { name: 'Shooting Star（上影線拒絕）', make() { const c = rf(98, 100), o = c + rf(0.3, 0.9) * (Math.random() < 0.7 ? 1 : -1); return { o, c, h: Math.max(o, c) + rf(2.6, 4), l: Math.min(o, c) - rf(0.02, 0.2) }; }, why: '長上影線 ≥ 實體兩倍、收喺下半部：曾經大升但被賣返落嚟。要喺阻力區先有意義。' },
  };
  function candleSVG(k) {
    const lo = Math.min(k.l, 96), hi = Math.max(k.h, 106), H = 220, Y = (v) => 10 + (hi - v) / (hi - lo) * (H - 20);
    const up = k.c >= k.o, col = up ? 'var(--up)' : 'var(--down)';
    const top = Y(Math.max(k.o, k.c)), bot = Y(Math.min(k.o, k.c));
    return `<svg viewBox="0 0 160 ${H}" class="drill-candle" role="img" aria-label="K 線"><line x1="80" x2="80" y1="${Y(k.h)}" y2="${Y(k.l)}" stroke="${col}" stroke-width="3"/><rect x="58" y="${top}" width="44" height="${Math.max(2, bot - top)}" fill="${col}" rx="2"/></svg>`;
  }
  function structBars(kind) {
    const pts = []; let p = ri(378, 392);
    pts.push(p);
    for (let i = 0; i < 6; i++) {
      if (kind === 'up') p += (i % 2 === 0) ? rf(2.4, 4) : -rf(1, 2);
      else if (kind === 'down') p += (i % 2 === 0) ? -rf(2.4, 4) : rf(1, 2);
      else p = pts[0] + ((i % 2 === 0) ? rf(2.2, 3.2) : rf(-0.4, 0.4)) + rf(-0.3, 0.3);
      pts.push(p);
    }
    const closes = [];
    for (let i = 1; i < pts.length; i++) for (let s = 1; s <= 3; s++) closes.push(pts[i - 1] + (pts[i] - pts[i - 1]) * s / 3 + rf(-0.25, 0.25));
    return Charts.genBars(closes, { seed: ri(1, 99999), open: pts[0], wick: 0.3 });
  }
  /* 決策規則（同「決策教練」一致） */
  function decide(s) {
    const why = []; let dec = 'PLAN';
    const rank = { PLAN: 0, WAIT: 1, SKIP: 2 }; const worst = (x) => { if (rank[x] > rank[dec]) dec = x; };
    const long = s.dir === 'long';
    if (s.bias === 'chop') { worst('SKIP'); why.push('結構混亂、反覆穿 VWAP → 容易 Overtrading。'); }
    if (s.loc === 'middle') { worst('SKIP'); why.push('唔喺重要位置 → 冇客觀失效位同目標。'); }
    if (s.stopOk === 'no') { worst('SKIP'); why.push('冇辦法清楚界定失效位。'); }
    if (s.rr < 2 - 1e-6) { worst('SKIP'); why.push(`R:R 只有 ${F(s.rr, 2)}，低過 2。`); }
    if (s.conf === 'unclosed') { worst('WAIT'); why.push('K 線未收市。'); }
    if (s.conf === 'single') { worst('WAIT'); why.push('只有單一訊號，要後續確認。'); }
    if ((long && s.bias === 'bear') || (!long && s.bias === 'bull')) { worst('WAIT'); why.push('逆住主要結構，要更多轉勢證據。'); }
    if (s.vol === 'against' && s.vwap === 'against') { worst('WAIT'); why.push('Volume 同 VWAP 都唔支持。'); }
    if (dec === 'PLAN') why.push('位置、結構、確認、失效位同 R:R 全部合格 → 可以寫模擬計劃。');
    return { dec, why };
  }
  function genDecision() {
    const target = pick(['PLAN', 'WAIT', 'SKIP']); let last = null;
    for (let t = 0; t < 400; t++) {
      const s = {
        dir: Math.random() < 0.7 ? 'long' : 'short',
        bias: pick(['bull', 'bull', 'bear', 'range', 'chop']),
        loc: pick(['key', 'key', 'edge', 'middle']),
        conf: pick(['confirmed', 'confirmed', 'single', 'unclosed']),
        vol: pick(['support', 'neutral', 'against']),
        vwap: pick(['support', 'neutral', 'against']),
        stopOk: Math.random() < 0.85 ? 'yes' : 'no',
      };
      if (s.bias === 'range' && s.loc === 'key') s.loc = 'edge';
      const entry = +rf(380, 392).toFixed(2), risk = +rf(0.8, 1.6).toFixed(2), rr = pick([1.2, 1.5, 2, 2.2, 2.5, 3]);
      const long = s.dir === 'long';
      s.entry = entry; s.stop = +(long ? entry - risk : entry + risk).toFixed(2); s.target = +(long ? entry + risk * rr : entry - risk * rr).toFixed(2);
      s.rr = Math.abs(s.target - s.entry) / Math.abs(s.entry - s.stop);
      const r = decide(s);
      Object.assign(s, r); last = s;
      if (r.dec === target) return s;
    }
    return last;
  }
  function decisionText(s) {
    const long = s.dir === 'long';
    const B = { bull: '結構 HH + HL（偏強）', bear: '結構 LH + LL（偏弱）', range: '喺區間入面橫行', chop: '冇清晰結構，反覆穿越 VWAP' };
    const L = { key: long ? '價格回到預先畫好嘅支持區' : '價格升到預先畫好嘅阻力區', edge: long ? '價格喺區間下沿' : '價格喺區間上沿', middle: '價格喺區間中間，附近冇重要位置' };
    const C = { confirmed: long ? '確認 K 已收市，並升穿訊號 K 高位' : '確認 K 已收市，並跌穿訊號 K 低位', single: long ? '只出現一支 Hammer，下一支未出' : '只出現一支 Shooting Star，下一支未出', unclosed: '訊號 K 線仲有 2 分鐘先收市' };
    const V = { support: '成交量支持呢個方向', neutral: '成交量中性', against: '成交量唔支持（例如突破量低）' };
    const W = { support: long ? '價格喺 VWAP 上方，VWAP 向上' : '價格喺 VWAP 下方，VWAP 向下', neutral: 'VWAP 橫行', against: long ? '價格喺 VWAP 下方，VWAP 向下' : '價格喺 VWAP 上方，VWAP 向上' };
    return `<p class="dr-dir">研究方向：<b>${long ? 'Long（看漲）' : 'Short（看跌）'}</b>　｜　你嘅規則：R:R 最少 2</p><ul class="dr-facts">
      <li>① ${B[s.bias]}</li><li>② ${L[s.loc]}</li><li>③ ${C[s.conf]}</li><li>④ ${V[s.vol]}；${W[s.vwap]}</li>
      <li>⑤ ${s.stopOk === 'yes' ? '可以清楚界定失效位' : '搵唔到清楚嘅失效位'}：Entry $${F(s.entry)}、Stop $${F(s.stop)}、Target $${F(s.target)}</li></ul>`;
  }
  function genRisk() {
    const type = pick(['shares', 'rr', 'r', 'loss']);
    const e = +rf(300, 420).toFixed(2), rps = pick([0.5, 0.8, 1, 1.2, 1.25, 1.4, 1.5, 2, 2.5]);
    const s = +(e - rps).toFixed(2);
    let q, ans, opts;
    const uniq = (arr) => { const out = []; arr.forEach((x) => { if (!out.includes(x)) out.push(x); }); return out; };
    if (type === 'shares') {
      const R = pick([20, 25, 30, 40, 50, 75, 100]);
      ans = Math.floor(R / rps + 1e-9);
      q = `風險預算 $${R}，Entry $${F(e)}、Stop $${F(s)}。最多買幾多股？`;
      opts = uniq([ans, Math.round(R / e * 10) || ans + 3, ans * 2, Math.max(1, ans - Math.max(2, Math.round(ans * 0.3))), ans + Math.max(2, Math.round(ans * 0.4))]).slice(0, 4).map(String);
      ans = String(ans);
    } else if (type === 'rr') {
      const m = pick([1, 1.5, 2, 2.5, 3]); const t = +(e + rps * m).toFixed(2);
      q = `Entry $${F(e)}、Stop $${F(s)}、Target $${F(t)}。R:R 係？`;
      ans = F(m, 1) + 'R'; opts = uniq([ans, (m === 1 ? '0.5' : F(1 / m, 2)) + 'R', F(m + 1, 1) + 'R', F(Math.max(0.5, m - 0.5), 1) + 'R']);
    } else if (type === 'r') {
      const m = pick([-1, -0.5, 0.5, 1, 1.5, 2]); const x = +(e + rps * m).toFixed(2);
      q = `Long：Entry $${F(e)}、Stop $${F(s)}，喺 $${F(x)} 出場。結果係幾多 R？`;
      ans = (m > 0 ? '+' : '') + F(m, 1) + 'R'; opts = uniq([ans, (m > 0 ? '−' : '+') + F(Math.abs(m), 1) + 'R', (m * 2 > 0 ? '+' : '') + F(m * 2, 1) + 'R', (m + 1 > 0 ? '+' : '') + F(m + 1, 1) + 'R']);
    } else {
      const n = pick([10, 12, 15, 17, 20, 25, 30, 40]);
      q = `買咗 ${n} 股，Entry $${F(e)}、Stop $${F(s)}。觸發 Stop（未計滑價同費用）會輸幾多？`;
      ans = '$' + F(n * rps); opts = uniq([ans, '$' + F(n * rps * 2), '$' + F(rps), '$' + F(n * rps / 2)]);
    }
    while (opts.length < 3) opts.push(String(+ans + opts.length));
    return { q, ans, opts: shuffle(opts.slice(0, 4)), why: { shares: '股數 = ⌊風險預算 ÷ 每股風險⌋，每股風險 = Entry − Stop = $' + F(rps) + '。', rr: 'R:R = (Target − Entry) ÷ (Entry − Stop)。', r: 'R = (出場 − Entry) ÷ (Entry − Stop)，每股風險 $' + F(rps) + '。', loss: '虧損 = 股數 × 每股風險（$' + F(rps) + '）。' }[type] };
  }

  const BIASES = {
    '確認偏誤': ['你想 Long TSLA，搵咗三條睇好嘅片，但冇睇日線上面嘅阻力。', '5m 出現 Hammer，你話「你睇，要升喇」，但成交量同 VWAP 都唔支持，你選擇唔理。'],
    '近因偏誤': ['Breakout 策略過去 80 筆期望值正數，但最近輸咗 3 筆，你決定以後唔再用。', '上星期 Gap & Go 連續成功，今日見到 Gap 你就覺得一定會延續。'],
    '結果偏誤': ['冇設 Stop，最後價格彈返嚟賺咗錢，你覺得自己決定啱。', '完全跟足規則，但係止蝕，你覺得今日「做錯晒」。'],
    '損失厭惡': ['浮盈 +0.5R 就急急平倉，但浮虧 −1R 嗰陣就唔肯止蝕。', 'Stop 就快到，你將 Stop 移低 $0.50「畀多啲空間」。'],
    '沉沒成本': ['已經蝕咗 $200，你話「而家走就真係蝕咗」，繼續揸住。', '研究咗一個策略三個月，數據話佢冇 Edge，但你唔捨得放棄。'],
    '過度自信': ['連贏 5 筆之後，你將每筆風險由 0.25% 加到 1%。', '你覺得自己已經「睇得穿」TSLA，唔再寫開市前報告。'],
    'FOMO 怕錯過': ['TSLA 已經升咗 3%，你怕錯過，冇 Setup 都追入。', '見到群組人人都話賺錢，你即刻開倉。'],
    '報復交易': ['啱啱止蝕，你即刻用雙倍股數再入場想追返。', '今日已經去到每日虧損上限，但你再做一筆「最後一筆」。'],
  };
  const BIAS_FIX = { '確認偏誤': '入場前寫低「乜嘢會證明我錯」。', '近因偏誤': '睇 50 筆以上嘅統計，唔好俾最近幾筆主導。', '結果偏誤': '用過程 × 結果四格評估。', '損失厭惡': '一入場就掛 Bracket，唔好臨場改。', '沉沒成本': '問自己：如果而家冇倉，我會唔會入？', '過度自信': '注碼只跟升級階梯。', 'FOMO 怕錯過': '錯過係正常，下一個 Setup 會再嚟。', '報復交易': '斷路器：連輸 2 筆停 30 分鐘。' };
  const TAPE = [
    { k: 'absorb-res', lvl: '阻力 $386.00', ans: '阻力有效：賣方喺度吸收買盤', ask0: 8200, ask1: 7900, prints: [['386.00', 1200, 'A'], ['386.00', 900, 'A'], ['386.00', 2500, 'A'], ['386.00', 1800, 'A'], ['385.99', 300, 'M'], ['385.97', 600, 'B']], why: '大量主動買盤打落 $386.00，但 Ask 大單只少咗少少，價格升唔上去 → 賣方吸收。' },
    { k: 'break-res', lvl: '阻力 $386.00', ans: '突破較可信：阻力賣單被食晒', ask0: 8200, ask1: 0, prints: [['386.00', 2500, 'A'], ['386.00', 3100, 'A'], ['386.00', 2600, 'A'], ['386.02', 1400, 'A'], ['386.05', 1900, 'A'], ['386.08', 1200, 'A']], why: 'Ask $386.00 嘅大單被連續主動買盤食晒，成交價開始升上 $386.05 以上 → 突破證據。仍然要等 K 線收市確認。' },
    { k: 'absorb-sup', lvl: '支持 $380.00', ans: '支持有效：買方喺度吸收賣盤', bid0: 9100, bid1: 8700, prints: [['380.00', 1500, 'B'], ['380.00', 2200, 'B'], ['380.00', 1700, 'B'], ['380.00', 2600, 'B'], ['380.01', 400, 'M'], ['380.03', 700, 'A']], why: '大量主動賣盤打落 $380.00，但 Bid 大單冇乜減少，價格跌唔落 → 買方吸收。' },
    { k: 'break-sup', lvl: '支持 $380.00', ans: '跌穿較可信：支持買單被打晒', bid0: 9100, bid1: 0, prints: [['380.00', 2800, 'B'], ['380.00', 3300, 'B'], ['380.00', 3000, 'B'], ['379.98', 1600, 'B'], ['379.95', 2100, 'B'], ['379.91', 1300, 'B']], why: 'Bid $380.00 嘅大單被主動賣盤打晒，成交價跌穿 $380 → 跌穿證據。' },
  ];
  function tapeHTML(t) {
    const top = t.ask0 != null ? `<p>Level 2：<b>Ask ${t.lvl.split(' ')[1]}</b> 掛單 ${t.ask0.toLocaleString()} 股 → 而家 <b>${t.ask1 ? t.ask1.toLocaleString() + ' 股' : '已經冇晒'}</b></p>` : `<p>Level 2：<b>Bid ${t.lvl.split(' ')[1]}</b> 掛單 ${t.bid0.toLocaleString()} 股 → 而家 <b>${t.bid1 ? t.bid1.toLocaleString() + ' 股' : '已經冇晒'}</b></p>`;
    return `<p class="dr-dir">位置：<b>${t.lvl}</b>（預先畫好）</p>${top}<table class="mini-tbl"><tr><th>價</th><th>股數</th><th>喺邊成交</th></tr>${t.prints.map((p) => `<tr class="${p[2] === 'A' ? 'up' : p[2] === 'B' ? 'down' : ''}"><td>${p[0]}</td><td>${p[1].toLocaleString()}</td><td>${{ A: 'Ask（主動買）', B: 'Bid（主動賣）', M: '中間' }[p[2]]}</td></tr>`).join('')}</table>`;
  }
  const DAY_WHY = { trend: '價格一直喺 VWAP 同一邊、VWAP 有斜度、回調淺。', range: 'VWAP 平，價格反覆穿越，去到邊界就返轉頭。', reversal: '早段向一個方向，之後穿過 VWAP 去另一邊並受壓。' };
  const DRILLS = {
    candle: {
      title: 'K 線形態辨識', icon: '🕯️', level: 'l1', rounds: 10,
      desc: '一支 K 線出現，你要講出佢係乜形態，或者收市位置喺邊。對應 Level 1 第 2、9 章。',
      gen() {
        const key = pick(Object.keys(CANDLE_TYPES)), T = CANDLE_TYPES[key], k = T.make();
        if (Math.random() < 0.35) {
          const cp = (k.c - k.l) / (k.h - k.l);
          const ans = cp >= 0.67 ? '收近高位（上三分一）' : cp <= 0.33 ? '收近低位（下三分一）' : '收喺中間';
          return { html: candleSVG(k) + `<p class="muted">O ${F(k.o)}｜H ${F(k.h)}｜L ${F(k.l)}｜C ${F(k.c)}</p>`, q: '呢支 K 線嘅 Close Position（收市位置）係？', opts: ['收近高位（上三分一）', '收喺中間', '收近低位（下三分一）'], ans, why: `Close Position = (C − L) ÷ (H − L) = ${F(cp * 100, 0)}%。` };
        }
        return { html: candleSVG(k), q: '呢支 K 線最似邊一種？', opts: Object.values(CANDLE_TYPES).map((x) => x.name), ans: T.name, why: T.why };
      },
    },
    structure: {
      title: '市場結構辨識', icon: '📐', level: 'l2', rounds: 8,
      desc: '睇一段走勢，判斷係 HH + HL（Uptrend）、LH + LL（Downtrend）定 Range。對應 Level 2 第 2 章。',
      gen(el) {
        const kind = pick(['up', 'down', 'range']);
        const names = { up: 'Uptrend：HH + HL', down: 'Downtrend：LH + LL', range: 'Range：喺區間上落' };
        return { chart: { bars: structBars(kind), showVolume: false, height: 210 }, q: '呢段走勢嘅 Market Structure 係？', opts: Object.values(names), ans: names[kind], why: { up: '擺動高位一個比一個高（HH），擺動低位都一個比一個高（HL）。', down: '擺動高位愈來愈低（LH），擺動低位都愈來愈低（LL）。', range: '高位同低位大致喺同一個區間，冇持續創新高或新低。' }[kind] };
      },
    },
    decision: {
      title: '情境決策：WAIT / PLAN / SKIP', icon: '🧠', level: 'l2', rounds: 8,
      desc: '每題一個隨機情境（結構、位置、確認、量、VWAP、R:R），你要作出決定。對應 Level 2 第 11–14 章。',
      gen() {
        const s = genDecision();
        return { html: decisionText(s), q: '你嘅決定係？', opts: ['WAIT — 等待更多確認', 'PLAN — 建立模擬計劃', 'SKIP — 放棄'], ans: { WAIT: 'WAIT — 等待更多確認', PLAN: 'PLAN — 建立模擬計劃', SKIP: 'SKIP — 放棄' }[s.dec], why: s.why.join(' ') + '（優先次序：SKIP 理由 > WAIT 理由 > PLAN）' };
      },
    },
    daytype: {
      title: '日類型辨識', icon: '🌗', level: 'l6', rounds: 6,
      desc: '睇一個交易日由 09:30 到 13:30 嘅走勢同 VWAP，判斷係趨勢日、區間日定反轉日。對應 Level 6 第 8 章。',
      gen() {
        const type = pick(['trend', 'range', 'reversal']);
        const d = Sim.makeDay(type, ri(1, 1e9));
        const bars = d.bars.slice(0, 48);
        const names = { trend: '趨勢日', range: '區間日', reversal: '反轉日' };
        return { chart: { bars, vwap: true, showVolume: false, height: 220, labelEvery: 8 }, q: '呢日（到 13:30 為止）較似？', opts: Object.values(names), ans: names[type], why: DAY_WHY[type] };
      },
    },
    tape: {
      title: '讀 Tape（訂單流）', icon: '📜', level: 'l7', rounds: 6,
      desc: '睇 Level 2 大單變化同 Time & Sales，判斷關鍵位置係守住定被突破。對應 Level 7 第 5 章。',
      gen() {
        const t = pick(TAPE);
        const opts = t.lvl.startsWith('阻力') ? [TAPE[0].ans, TAPE[1].ans] : [TAPE[2].ans, TAPE[3].ans];
        return { html: tapeHTML(t), q: '最合理嘅解讀係？', opts: opts.concat(['冇任何資訊，訂單流冇用']), ans: t.ans, why: t.why + '（訂單流只係確認工具，仍然要配合 K 線同計劃。）' };
      },
    },
    bias: {
      title: '認出認知偏誤', icon: '🧠', level: 'l8', rounds: 8,
      desc: '每題一個交易情境，你要講出係邊種心理偏誤。對應 Level 8 第 5 章。',
      gen() {
        const name = pick(Object.keys(BIASES));
        const opts = shuffle([name].concat(shuffle(Object.keys(BIASES).filter((x) => x !== name)).slice(0, 3)));
        return { html: `<blockquote class="dr-quote">${esc(pick(BIASES[name]))}</blockquote>`, q: '呢個係邊種偏誤？', opts, ans: name, why: '對策：' + BIAS_FIX[name] };
      },
    },
    risk: {
      title: '風險速算（60 秒）', icon: '⏱️', level: 'l3', timed: 60,
      desc: '60 秒內盡量答：股數、R:R、R 倍數、止損金額。愈快愈熟，臨場就唔會計錯數。',
      gen() { const r = genRisk(); return { html: '', q: r.q, opts: r.opts, ans: r.ans, why: r.why }; },
    },
  };
  Object.assign(DRILLS, window.DRILLS_EXTRA || {});

  function renderGym(view, id) {
    const u = Store.user();
    if (!id || !DRILLS[id]) {
      view.innerHTML = `<div class="page-head"><h1>🏋️ 訓練場</h1><p class="muted">短、快、可以無限重玩嘅練習。每次題目都係隨機生成，練到睇一眼就識判斷。每日每個練習頭 10 題答啱都有 XP。</p></div>
        <div class="tool-grid-cards">${Object.entries(DRILLS).map(([k, d]) => { const g = u.gym[k]; return `<a class="tool-tile" href="#/gym/${k}"><span>${d.icon}</span><b>${esc(d.title)}</b><small>${esc(d.desc)}</small><em>${g ? `最佳 ${g.best}${d.timed ? ' 題' : '/' + d.rounds}・玩咗 ${g.plays} 次` : '未玩過'}</em></a>`; }).join('')}</div>
        <div class="card"><div class="card-h">💡 點樣練最有效？</div><ul><li>先讀相關章節，再嚟訓練場「操肌肉記憶」。</li><li>答錯唔緊要，睇解釋 —— 解釋先係重點。</li><li>情境決策答錯時，諗吓自己係咪「太想交易」。</li><li>想深入分析一個情境：用 <a href="#/tools/decision-coach">🧠 決策教練</a> 逐項調整。</li></ul></div>`;
      return;
    }
    const D = DRILLS[id];
    let n = 0, score = 0, timer = null, left = D.timed || 0, over = false;
    view.innerHTML = `<nav class="crumbs"><a href="#/gym">訓練場</a> › ${esc(D.title)}</nav>
      <div class="drill card"><div class="drill-head"><span class="drill-ic">${D.icon}</span><b>${esc(D.title)}</b><span class="drill-score" data-score></span></div><div data-stage></div></div>`;
    const stage = $('[data-stage]', view), sc = $('[data-score]', view);
    const upd = () => { sc.textContent = D.timed ? `⏱ ${left}s・✅ ${score}` : `第 ${Math.min(n + 1, D.rounds)}/${D.rounds} 題・✅ ${score}`; };
    const end = () => {
      over = true; clearInterval(timer);
      const g = u.gym[id] = u.gym[id] || { best: 0, plays: 0 };
      const best = score > g.best; g.best = Math.max(g.best, score); g.plays++; g.ts = Date.now();
      Store.save(); Store.logAct('drill');
      Store.awardXP(`gymdone:${id}:${Store.today()}`, 5);
      const total = D.timed ? '' : ` / ${D.rounds}`;
      stage.innerHTML = `<div class="rv-done"><span>${best ? '🏆' : score >= (D.rounds || 10) * 0.8 ? '🎖️' : '💪'}</span><b>得分 ${score}${total}${best ? '・新紀錄！' : ''}</b><p class="muted">最佳：${g.best}${total}・已玩 ${g.plays} 次</p><div class="tool-foot"><button class="btn primary" data-again>↺ 再玩一次</button><a class="btn ghost" href="#/gym">其他練習</a></div></div>`;
      $('[data-again]', stage).addEventListener('click', () => renderGym(view, id));
      if (best && score >= 5) App().confetti();
    };
    const next = () => {
      if (over) return;
      if (!D.timed && n >= D.rounds) return end();
      upd();
      const r = D.gen();
      stage.innerHTML = `${r.html || ''}<div data-chart></div><p class="qq-q">${esc(r.q)}</p><div class="qq-opts">${r.opts.map((o, i) => `<button class="qq-opt" data-o="${esc(o)}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join('')}</div><div class="qq-fb"></div>`;
      if (r.chart) Charts.candles($('[data-chart]', stage), r.chart);
      $$('.qq-opt', stage).forEach((b) => b.addEventListener('click', () => {
        if (over) return;
        const ok = b.dataset.o === r.ans;
        $$('.qq-opt', stage).forEach((o) => { o.disabled = true; if (o.dataset.o === r.ans) o.classList.add('right'); else if (o === b) o.classList.add('wrong'); });
        if (ok) { score++; for (let i = 1; i <= 10; i++) if (Store.awardXP(`gym:${id}:${Store.today()}:${i}`, 2)) break; }
        n++; upd();
        if (D.timed) { $('.qq-fb', stage).innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✅' : '❌ 答案：' + esc(r.ans)}</div>`; setTimeout(next, ok ? 350 : 1400); return; }
        $('.qq-fb', stage).innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✅ 正確' : '❌ 答案：' + esc(r.ans)}｜${esc(r.why)}</div><div class="tool-foot"><button class="btn primary" data-next>${n >= D.rounds ? '睇結果' : '下一題 →'}</button></div>`;
        $('[data-next]', stage).addEventListener('click', next);
      }));
    };
    if (D.timed) {
      stage.innerHTML = `<div class="rv-done"><span>⏱️</span><b>準備好未？</b><p class="muted">${esc(D.desc)}</p><button class="btn primary lg" data-go>開始</button></div>`;
      $('[data-go]', stage).addEventListener('click', () => {
        next();
        timer = setInterval(() => { if (!location.hash.startsWith('#/gym/' + id)) { clearInterval(timer); return; } left--; upd(); if (left <= 0) end(); }, 1000);
      });
      upd();
    } else next();
  }

  /* =========================================================
   * Level 概覽
   * ========================================================= */
  const LEVEL_TIPS = {
    l1: '先打好地基：識睇 K 線、成交量、PDH/PDL、S/R 同 VWAP。唔使急住交易，目標係「睇得明」。',
    l2: '由「睇得明」進化到「有次序咁判斷」：結構 → 位置 → 確認 → Volume/VWAP → 風險 → WAIT / PLAN / SKIP。',
    l3: '將判斷變成有規則嘅 Setup：Entry Trigger、Stop、Target、Position Size，全部事前寫低。',
    l4: '執行同風險控制：訂單類型、滑價、每日虧損上限、心理同紀律。',
    l5: '驗證你嘅系統：回測、Walk-forward、樣本數、期望值，唔好俾運氣呃到。',
    l6: '學識揀日子：多時間框架、Gap、Opening Range、相對強弱、時段、事件同日類型，令你只做有利環境嘅 Setup。',
    l7: '入場之後先係真正考驗：R 分佈、ATR、出場方法、加倉、訂單流、極端行情、做空、相關性同倉位模型。',
    l8: '由學生變交易者：計劃書、每日流程、進階檢討、心理偏誤、升級階梯、策略衰退同可持續交易，最後完成畢業專題。',
    l9: '進修專題：Mark Minervini 嘅 VCP。睇突破之前嘅收縮 —— T1/T2/T3、量縮、Pivot、Stage 2，再分開研究日線同 5 分鐘版本，最後用真實數據回測。',
    qa: '你曾經問過嘅實戰問題：S/R 點畫、Zone 幾闊、Stop 放邊、點解 Replay 搵唔到 Entry。',
  };
  function renderLevel(view, id) {
    const A = App(), lv = A.LEVELS.find((l) => l.id === id);
    if (!lv) { location.hash = '#/toc'; return; }
    const u = Store.user(), st = A.levelStats(lv);
    const next = lv.chapters.find((c) => !u.read[c.id]) || lv.chapters[0];
    const quizzes = Object.keys(QUIZZES).filter((k) => k.startsWith(lv.id + '-'));
    const reps = Object.entries(Replay.SCENARIOS).filter(([, s]) => s.level === lv.id);
    const tools = Object.entries(TOOLS).filter(([, t]) => t.level === lv.id);
    const drills = Object.entries(DRILLS).filter(([, d]) => d.level === lv.id);
    const words = GLOSSARY.filter((g) => g.lv === lv.id).length;
    const mins = lv.chapters.reduce((a, c) => a + (c.mins || 0), 0);
    view.innerHTML = `<section class="lv-hero" style="--lv:${lv.color}">
        <div><div class="ch-badge">${lv.icon} ${esc(lv.code)}</div><h1>${esc(lv.title)}</h1><p class="ch-sum">${esc(lv.subtitle)}</p>
          <p class="lv-q">核心問題：「${esc(lv.question)}」</p><p>${esc(LEVEL_TIPS[lv.id] || '')}</p>
          <div class="hero-actions"><a class="btn primary lg" href="#/c/${next.id}">${st.done ? '📍 繼續' : '🚀 開始'}：第 ${next.num} 章</a></div></div>
        <div class="ring" style="--p:${st.pct * 360}deg"><div><b>${st.done}/${st.total}</b><small>章完成</small></div></div>
      </section>
      <div class="lv-facts">${[['📚', lv.chapters.length, '章'], ['⏱ 約', Math.round(mins / 60 * 10) / 10, '小時'], ['📝', quizzes.length, '份測驗'], ['🧰', tools.length, '個工具'], ['🎮', reps.length, '個重播'], ['🏋️', drills.length, '個訓練'], ['📖', words, '個詞彙']].filter((x) => x[1]).map((x) => `<span>${x[0]} ${x[1]} ${x[2]}</span>`).join('')}</div>
      <h2 class="sec-h">章節</h2>
      <ol class="lv-chs">${lv.chapters.map((c) => { const p = A.chapterPct(c); return `<li><a href="#/c/${c.id}" class="${p >= 1 ? 'done' : ''}"><span class="ch-dot ${p >= 1 ? 'done' : p > 0 ? 'part' : ''}" style="--p:${p * 360}deg"></span><span class="lc-num">${c.num}</span><span class="lc-main"><b>${esc(c.title)}</b><small>${esc(c.summary)}</small></span><em>${c.mins}′</em></a></li>`; }).join('')}</ol>
      ${drills.length || reps.length ? `<h2 class="sec-h">練習</h2><div class="quick-tools wide">${drills.map(([k, d]) => `<a href="#/gym/${k}"><span>${d.icon}</span>${esc(d.title)}</a>`).join('')}${reps.map(([k, s]) => `<a href="#/replay/${k}"><span>${s.icon}</span>${esc(s.title)}${u.replay[k] ? ` <small>（${u.replay[k].best}/${u.replay[k].total}）</small>` : ''}</a>`).join('')}</div>` : ''}
      ${tools.length ? `<h2 class="sec-h">工具</h2><div class="quick-tools wide">${tools.map(([k, t]) => `<a href="#/tools/${k}"><span>${t.icon}</span>${esc(t.title)}</a>`).join('')}</div>` : ''}
      ${quizzes.length ? `<h2 class="sec-h">測驗</h2><div class="quiz-grid">${quizzes.map((k) => { const q = QUIZZES[k], r = u.quiz[k]; return `<a class="quiz-tile ${q.final ? 'final' : ''} ${r && r.best === r.total ? 'perfect' : ''}" href="#/quiz/${k}"><b>${q.final ? '🏁 ' : ''}${esc(q.title)}</b><small>${q.questions.length} 題</small><em>${r ? `${r.best}/${r.total}` : '未做'}</em></a>`; }).join('')}</div>` : ''}`;
  }

  /* =========================================================
   * 使用指南
   * ========================================================= */
  function renderGuide(view) {
    view.innerHTML = `<div class="page-head"><h1>🧭 使用指南</h1><p class="muted">第一次用？花 2 分鐘睇完，學得快好多。</p></div>
      <div class="guide">
        <div class="card"><div class="card-h">📚 建議學習次序（每一章）</div><ol class="guide-steps">
          <li><b>讀</b>：一節一節讀，讀到邊自動記錄。唔明嘅字，<u class="gt-demo">有虛線底</u>嘅英文詞彙可以撳一下睇解釋。</li>
          <li><b>標記</b>：揀選文字 → 螢光筆／筆記／留言；小節標題旁 ☆ 加書籤。</li>
          <li><b>小測</b>：章節入面嘅 🧩 小測驗，答錯嘅題目會自動入 📕 錯題本。</li>
          <li><b>玩</b>：章節入面嘅計算器、K 線重播；之後去 🏋️ 訓練場操練。</li>
          <li><b>記錄</b>：用 🗒️ Price Action 分析紀錄卡同 📒 交易日誌，記低每次判斷，之後檢討。</li>
        </ol></div>
        <div class="card"><div class="card-h">🎯 每日 15 分鐘</div><p>主頁有「今日任務」（每日 3 個），完成全部有額外 XP。學習日曆會記錄你每日學咗幾多，連續學習有 🔥。</p><p>📕 錯題本用<b>間隔重溫</b>：答錯嘅題目會喺 1、3、7、14 日後再出現，直到你真正記得。</p></div>
        <div class="card"><div class="card-h">👨‍👩‍👧 一家人分開學</div><p>右上角頭像可以切換使用者。每個人有自己嘅進度、書籤、筆記、XP、錯題本同交易日誌；留言同影片全家共用，可以喺章節底部互相討論。</p><p>想喺唔同裝置同步：⚙️ 設定 → 匯出備份 → 喺另一部機匯入（合併）。</p></div>
        <div class="card"><div class="card-h">🔊 其他小技巧</div><ul>
          <li>章節頁頂嘅 🔊 朗讀：由你而家睇緊嘅位置開始讀出嚟（用瀏覽器內置語音）。</li>
          <li>頂部搜尋可以搵任何章節內容。</li>
          <li>⭐ 我的 → 可以將所有筆記、書籤、螢光筆匯出做 Markdown。</li>
          <li>iPhone / iPad：Safari → 分享 → 加至主畫面，就好似 App 咁用。</li>
        </ul></div>
        <div class="card"><div class="card-h">🗺️ 由邊度開始？</div><div class="quick-tools wide">${App().LEVELS.map((lv) => `<a href="#/level/${lv.id}"><span>${lv.icon}</span>${esc(lv.code)}：${esc(lv.title)}</a>`).join('')}</div></div>
      </div>`;
  }

  /* =========================================================
   * 詞彙提示（章節內英文詞彙加虛線，撳／停留顯示解釋）
   * ========================================================= */
  let GT_RE = null, GT_MAP = null;
  function buildGloss() {
    GT_MAP = {};
    const terms = [];
    GLOSSARY.forEach((g) => {
      const variants = [g.term].concat(g.term.split(/\s*[\/／]\s*|\s*[（(].*$/)).map((x) => x.trim()).filter((x, i) => /^[A-Za-z]/.test(x) && (i === 0 ? x.length >= 3 : (x.length >= 5 || /^[A-Z0-9]{3,}$/.test(x))));
      variants.forEach((v) => { if (!GT_MAP[v]) { GT_MAP[v] = g; terms.push(v); } });
    });
    terms.sort((a, b) => b.length - a.length);
    GT_RE = new RegExp('(^|[^A-Za-z])(' + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![A-Za-z])');
  }
  function glossTips(root) {
    if (Store.ui().glossTips === false || !window.GLOSSARY) return;
    if (!GT_RE) buildGloss();
    const used = new Set();
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(n) {
      const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('.embed, .hl-skip, button, a, h1, h2, h3, code, pre, svg, input, textarea, select, .gt, .callout-title, th')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((node) => {
      let cur = node;
      for (let guard = 0; guard < 6 && cur; guard++) {
        const m = GT_RE.exec(cur.nodeValue); if (!m) break;
        const g = GT_MAP[m[2]], at = m.index + m[1].length;
        if (used.has(g.term)) { cur = cur.splitText(at + m[2].length); continue; }
        used.add(g.term);
        const mid = cur.splitText(at); const rest = mid.splitText(m[2].length);
        const span = document.createElement('span'); span.className = 'gt'; span.tabIndex = 0; span.dataset.term = g.term;
        mid.parentNode.insertBefore(span, mid); span.appendChild(mid);
        cur = rest;
      }
    });
  }
  let tipEl = null;
  function showTip(t) {
    const g = GLOSSARY.find((x) => x.term === t.dataset.term); if (!g) return;
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'gt-pop'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
    tipEl.innerHTML = `<b>${esc(g.term)}</b> <small>${esc(g.zh)}</small><p>${esc(g.def)}</p>`;
    tipEl.hidden = false;
    const r = t.getBoundingClientRect(), pw = Math.min(300, innerWidth - 24);
    tipEl.style.width = pw + 'px';
    const left = Math.max(12, Math.min(r.left, innerWidth - pw - 12));
    tipEl.style.left = left + 'px';
    const h = tipEl.offsetHeight;
    tipEl.style.top = (r.bottom + 8 + h > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 8) + 'px';
  }
  const hideTip = () => { if (tipEl) tipEl.hidden = true; };
  document.addEventListener('mouseover', (e) => { const t = e.target.closest && e.target.closest('.gt'); if (t) showTip(t); });
  document.addEventListener('mouseout', (e) => { if (e.target.closest && e.target.closest('.gt')) hideTip(); });
  document.addEventListener('focusin', (e) => { const t = e.target.closest && e.target.closest('.gt'); if (t) showTip(t); });
  document.addEventListener('focusout', (e) => { if (e.target.closest && e.target.closest('.gt')) hideTip(); });
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('.gt'); if (t) showTip(t); else hideTip(); });
  window.addEventListener('scroll', hideTip, { passive: true });
  window.addEventListener('hashchange', hideTip);

  /* =========================================================
   * 朗讀（瀏覽器內置語音）
   * ========================================================= */
  const TTS = { on: false, list: [], i: 0, btn: null };
  function ttsVoice() {
    const vs = speechSynthesis.getVoices();
    return vs.find((v) => /zh[-_]HK|yue/i.test(v.lang)) || vs.find((v) => /zh[-_]TW/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
  }
  function ttsStop() {
    TTS.on = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $$('.tts-on').forEach((x) => x.classList.remove('tts-on'));
    if (TTS.btn) TTS.btn.textContent = '🔊 朗讀';
  }
  function ttsSpeak() {
    if (!TTS.on) return;
    $$('.tts-on').forEach((x) => x.classList.remove('tts-on'));
    if (TTS.i >= TTS.list.length) { ttsStop(); return; }
    const el = TTS.list[TTS.i];
    el.classList.add('tts-on');
    const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const text = el.innerText.replace(/[☆★📝💬🔗]/g, '').replace(/\$/g, '').trim();
    if (!text) { TTS.i++; ttsSpeak(); return; }
    const ut = new SpeechSynthesisUtterance(text);
    const v = ttsVoice(); if (v) { ut.voice = v; ut.lang = v.lang; } else ut.lang = 'zh-HK';
    ut.rate = Store.ui().ttsRate || 1;
    ut.onend = () => { if (TTS.on) { TTS.i++; ttsSpeak(); } };
    ut.onerror = () => { if (TTS.on) { TTS.i++; ttsSpeak(); } };
    speechSynthesis.speak(ut);
  }
  function ttsButton(content) {
    if (!('speechSynthesis' in window)) return null;
    const b = document.createElement('button'); b.className = 'btn sm ghost'; b.textContent = '🔊 朗讀'; b.title = '由而家睇緊嘅位置開始讀出嚟';
    b.addEventListener('click', () => {
      if (TTS.on) { ttsStop(); return; }
      const els = $$('h2, h3, p, li, .formula', content).filter((x) => !x.closest('.embed, .hl-skip, .my-note, table') && !(x.tagName === 'P' && x.closest('li')));
      let start = els.findIndex((x) => x.getBoundingClientRect().bottom > 80);
      TTS.list = els; TTS.i = Math.max(0, start); TTS.on = true; TTS.btn = b;
      b.textContent = '⏹ 停止朗讀';
      speechSynthesis.cancel(); ttsSpeak();
    });
    return b;
  }
  window.addEventListener('hashchange', ttsStop);
  if ('speechSynthesis' in window) speechSynthesis.getVoices();

  /* =========================================================
   * 匯出筆記（Markdown）
   * ========================================================= */
  function exportNotes() {
    const A = App(), u = Store.user(), p = Store.activeProfile() || { name: '' };
    const byCh = {};
    const add = (ch, sec, line) => { ((byCh[ch] = byCh[ch] || {})[sec] = byCh[ch][sec] || []).push(line); };
    u.bookmarks.forEach((b) => add(b.chapter, b.section, '⭐ 書籤'));
    Object.keys(u.notes).forEach((k) => { const [ch, sec] = k.split('#'); add(ch, sec, '📝 ' + u.notes[k].text.replace(/\n/g, '\n  ')); });
    u.highlights.forEach((h) => add(h.chapter, h.section, `🖍️ 「${h.text}」${h.note ? '\n  → ' + h.note : ''}`));
    let md = `# ${p.name} 嘅學習筆記\n\n匯出日期：${Store.today()}｜TSLA Day Trading 學院\n`;
    A.CHAPTERS.filter((c) => byCh[c.id]).forEach((c) => {
      md += `\n## ${c.level.code} 第 ${c.num} 章：${c.title}\n`;
      const secs = byCh[c.id];
      const order = ['_chapter'].concat(c.sections.map((s) => s.id)).concat(Object.keys(secs));
      const done = new Set();
      order.forEach((sid) => {
        if (!secs[sid] || done.has(sid)) return; done.add(sid);
        const s = c.sections.find((x) => x.id === sid);
        md += `\n### ${sid === '_chapter' ? '（整章）' : s ? s.title : sid}\n\n` + secs[sid].map((l) => '- ' + l).join('\n') + '\n';
      });
    });
    const free = Object.keys(u.notes).filter((k) => k.startsWith('_free#')).map((k) => u.notes[k]).sort((x, y) => (x.ts || 0) - (y.ts || 0));
    if (free.length) { md += '\n## 自由筆記\n'; free.forEach((n) => { md += `\n### ${n.title || '筆記'}\n\n${n.text}\n`; }); }
    if (!Object.keys(byCh).length) md += '\n（未有書籤、筆記或螢光筆）\n';
    A.download(`my-notes-${Store.today()}.md`, md, 'text/markdown');
  }

  /* =========================================================
   * 學習統計（我的 → 學習統計）
   * ========================================================= */
  function statsHTML() {
    const u = Store.user();
    const qs = Object.values(u.quiz);
    const best = qs.reduce((a, q) => a + (q.best || 0), 0), tot = qs.reduce((a, q) => a + (q.total || 0), 0);
    const sum = (k) => Object.values(u.activity).reduce((a, d) => a + (d[k] || 0), 0);
    return `${heatmap()}
      <div class="review-top">
        <div class="stat-box"><b>${sum('sec')}</b><small>讀過小節</small></div>
        <div class="stat-box"><b>${sum('quiz')}</b><small>答過題目</small></div>
        <div class="stat-box"><b>${tot ? Math.round(best / tot * 100) : 0}%</b><small>測驗最佳正確率</small></div>
        <div class="stat-box"><b>${Object.keys(u.wrong).length}</b><small>錯題本</small></div>
        <div class="stat-box"><b>${sum('drill')}</b><small>訓練場次數</small></div>
      </div>
      <h3>🏋️ 訓練場最佳</h3><div class="quick-tools wide">${Object.entries(DRILLS).map(([k, d]) => `<a href="#/gym/${k}"><span>${d.icon}</span>${esc(d.title)} <small>${u.gym[k] ? '最佳 ' + u.gym[k].best : '未玩'}</small></a>`).join('')}</div>`;
  }


  /* =========================================================
   * 學習地圖、證書、建議下一步、學習進度預計、本章重點
   * ========================================================= */
  function finalOf(lv) { return Object.keys(QUIZZES).find((k) => k.startsWith(lv.id + '-') && QUIZZES[k].final); }
  function certState(lv, uid) {
    const A = App(), u = Store.user(uid), st = A.levelStats(lv, uid), fq = finalOf(lv);
    const r = fq ? u.quiz[fq] : null;
    const scoreOk = !fq || (r && r.best / r.total >= 0.8);
    return { read: st.done === st.total, st, fq, r, scoreOk, ok: st.done === st.total && scoreOk };
  }
  const PACES = [10, 20, 30, 45, 60];
  function paceInfo() {
    const A = App(), u = Store.user();
    const pace = (u.toolState.pace && u.toolState.pace.min) || 20;
    const perLevel = []; let acc = 0;
    A.LEVELS.forEach((lv) => {
      const remain = lv.chapters.filter((c) => !u.read[c.id]).reduce((a, c) => a + (c.mins || 5) * 2, 0); // 讀 + 練習 ≈ 兩倍時間
      acc += remain;
      perLevel.push({ lv, remain, eta: Store.addDays(Math.ceil(acc / pace)) });
    });
    return { pace, total: acc, days: Math.ceil(acc / pace), eta: Store.addDays(Math.ceil(acc / pace)), perLevel };
  }
  function paceHTML() {
    const p = paceInfo();
    return `<div class="pace"><div class="tool-foot"><span>每日學習時間：</span>${PACES.map((m) => `<button class="btn sm ${m === p.pace ? 'primary' : ''}" data-pace="${m}">${m} 分鐘</button>`).join('')}</div>
      <p>${p.total ? `仲有大約 <b>${Math.round(p.total / 60)}</b> 小時（閱讀 + 練習）。按每日 ${p.pace} 分鐘，預計 <b>${p.eta}</b> 完成全部課程。` : '🎉 全部章節已完成！'}</p></div>`;
  }
  function bindPace(root, after) {
    $$('[data-pace]', root).forEach((b) => b.addEventListener('click', () => { const u = Store.user(); u.toolState.pace = { min: +b.dataset.pace }; Store.save(); after(); }));
  }

  function nextSteps() {
    const A = App(), u = Store.user(), out = [];
    const due = Store.dueWrong().length;
    if (due) out.push({ icon: '📕', t: `溫習 ${due} 題到期錯題`, s: '間隔重溫，記得更牢', href: '#/review' });
    const last = u.last && A.CH[u.last.chapter];
    if (last && !u.read[last.id]) out.push({ icon: '📍', t: `繼續讀：${last.level.code} 第 ${last.num} 章`, s: last.title, href: `#/c/${last.id}${u.last.section ? '/' + u.last.section : ''}` });
    const low = Object.keys(u.conf || {}).filter((k) => u.conf[k] === 1 && A.CH[k]);
    if (low.length) { const c = A.CH[low[0]]; out.push({ icon: '😕', t: `重溫未明白嘅章節`, s: `${c.level.code} 第 ${c.num} 章 ${c.title}`, href: `#/c/${c.id}` }); }
    const noQuiz = A.CHAPTERS.find((c) => u.read[c.id] && (c.md.match(/\[\[quiz:([\w-]+)\]\]/g) || []).some((m) => !u.quiz[m.slice(7, -2)]));
    if (noQuiz) { const qid = noQuiz.md.match(/\[\[quiz:([\w-]+)\]\]/g).map((m) => m.slice(7, -2)).find((q) => !u.quiz[q]); out.push({ icon: '📝', t: '做未完成嘅測驗', s: QUIZZES[qid] ? QUIZZES[qid].title : qid, href: `#/quiz/${qid}` }); }
    const cert = A.LEVELS.find((lv) => certState(lv).ok && !(u.toolState.certSeen || {})[lv.id]);
    if (cert) out.push({ icon: '🎓', t: `${cert.code} 證書可以領取！`, s: '列印出嚟貼喺牆', href: `#/cert/${cert.id}` });
    const readyFinal = A.LEVELS.find((lv) => { const c = certState(lv); return c.read && c.fq && !c.scoreOk; });
    if (readyFinal) out.push({ icon: '🏁', t: `${readyFinal.code} 期末測驗`, s: '80% 或以上就可以攞證書', href: `#/quiz/${finalOf(readyFinal)}` });
    const curLv = (last && last.level) || A.LEVELS[0];
    const drill = Object.entries(DRILLS).find(([k, d]) => d.level === curLv.id && !u.gym[k]);
    if (drill) out.push({ icon: drill[1].icon, t: `試吓訓練場：${drill[1].title}`, s: '配合你而家讀緊嘅 Level', href: `#/gym/${drill[0]}` });
    const nxt = A.CHAPTERS.find((c) => !u.read[c.id] && (!last || c !== last));
    if (nxt) out.push({ icon: '📖', t: `下一章：${nxt.level.code} 第 ${nxt.num} 章`, s: nxt.title, href: `#/c/${nxt.id}` });
    if (!(u.toolState.sim && u.toolState.sim.days)) out.push({ icon: '🕹️', t: '玩一日模擬交易練習場', s: '隨機交易日，逐支 K 線落單', href: '#/sim' });
    return out.slice(0, 3);
  }
  function nextCard() {
    const n = nextSteps();
    return `<div class="card next-card"><div class="card-h">🧭 建議下一步</div>${n.map((x, i) => `<a class="next-item ${i === 0 ? 'first' : ''}" href="${x.href}"><span class="ni-ic">${x.icon}</span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><span class="ni-go">›</span></a>`).join('') || '<p class="muted">全部完成！🎉</p>'}</div>`;
  }

  function renderMap(view) {
    const A = App(), u = Store.user();
    const p = Store.activeProfile() || { name: '' };
    view.innerHTML = `<div class="page-head"><h1>🗺️ 學習地圖</h1><p class="muted">由 Level 1 到 Level 8，一步步上。讀晒一個 Level 嘅章節、期末測驗 80% 或以上，就可以攞證書。</p></div>
      <div class="card">${paceHTML()}</div>
      <ol class="map">${A.LEVELS.map((lv, idx) => {
        const cs = certState(lv), pi = paceInfo().perLevel.find((x) => x.lv === lv);
        const stateCls = cs.ok ? 'done' : cs.st.done ? 'doing' : 'todo';
        return `<li class="map-node ${stateCls}" style="--lv:${lv.color}">
          <div class="map-dot"><span>${cs.ok ? '🎓' : lv.icon}</span></div>
          <div class="map-card">
            <div class="map-top"><a href="#/level/${lv.id}"><b>${esc(lv.code)}</b>　${esc(lv.title)}</a><em>${cs.st.done}/${cs.st.total}</em></div>
            <div class="map-chs">${lv.chapters.map((c) => { const pc = A.chapterPct(c); return `<a href="#/c/${c.id}" title="第 ${c.num} 章 ${esc(c.title)}" class="${pc >= 1 ? 'd' : pc > 0 ? 'p' : ''} ${u.conf && u.conf[c.id] === 1 ? 'low' : ''}"></a>`; }).join('')}</div>
            <div class="map-foot">${cs.fq ? `<span>🏁 期末：${cs.r ? `${cs.r.best}/${cs.r.total}` : '未做'}</span>` : ''}${cs.ok ? `<a class="btn sm primary" href="#/cert/${lv.id}">🎓 睇證書</a>` : `<span class="muted">${pi && pi.remain ? '預計 ' + pi.eta + ' 完成' : ''}</span>`}</div>
          </div></li>`;
      }).join('')}</ol>
      <p class="muted">小格：綠 = 讀完、半色 = 讀緊、紅框 = 你標記咗「未明」。</p>`;
    bindPace(view, () => renderMap(view));
  }

  function renderCert(view, id) {
    const A = App(), lv = A.LEVELS.find((l) => l.id === id);
    if (!lv) { location.hash = '#/map'; return; }
    const cs = certState(lv), p = Store.activeProfile() || { name: '學員' }, u = Store.user();
    if (!cs.ok) {
      view.innerHTML = `<div class="page-head"><h1>🎓 ${esc(lv.code)} 證書</h1></div><div class="card"><p>仲差少少就可以攞證書：</p><ul class="tool-list"><li>${cs.read ? '✅' : '⬜'} 讀完全部 ${cs.st.total} 章（而家 ${cs.st.done} 章）</li>${cs.fq ? `<li>${cs.scoreOk ? '✅' : '⬜'} 期末測驗 80% 或以上（${cs.r ? `最佳 ${cs.r.best}/${cs.r.total}` : '未做'}）</li>` : ''}</ul><div class="tool-foot"><a class="btn primary" href="#/level/${lv.id}">去 ${esc(lv.code)}</a>${cs.fq ? `<a class="btn" href="#/quiz/${cs.fq}">做期末測驗</a>` : ''}</div></div>`;
      return;
    }
    u.toolState.certSeen = u.toolState.certSeen || {}; if (!u.toolState.certSeen[lv.id]) { u.toolState.certSeen[lv.id] = Store.today(); Store.save(); Store.awardXP('cert:' + lv.id, 30); }
    const rk = A.rank(u.xp);
    view.innerHTML = `<div class="cert-actions no-print"><a class="btn ghost" href="#/map">← 學習地圖</a><button class="btn primary" data-print>🖨️ 列印證書</button></div>
      <div class="cert" style="--lv:${lv.color}"><div class="cert-in">
        <div class="cert-icon">${lv.icon}</div><p class="cert-small">TSLA Day Trading 學院</p><h1>結業證書</h1><p class="cert-small">茲證明</p>
        <p class="cert-name">${esc(p.emoji || '')} ${esc(p.name)}</p>
        <p>已完成</p><h2>${esc(lv.code)}：${esc(lv.title)}</h2><p class="cert-sub">${esc(lv.subtitle)}</p>
        <div class="cert-meta"><span>📚 ${cs.st.total} 章</span>${cs.r ? `<span>🏁 期末測驗 ${cs.r.best}/${cs.r.total}</span>` : ''}<span>${rk.icon} ${esc(rk.name)}・${u.xp} XP</span></div>
        <p class="cert-date">${u.toolState.certSeen[lv.id]}</p>
        <p class="cert-fine">教育用途，唔代表任何專業資格或投資能力認證。</p></div></div>`;
    $('[data-print]', view).addEventListener('click', () => window.print());
    document.body.classList.add('cert-page');
    window.addEventListener('hashchange', function off() { document.body.classList.remove('cert-page'); window.removeEventListener('hashchange', off); });
    if (!sessionStorage.getItem('ta:cert:' + lv.id)) { sessionStorage.setItem('ta:cert:' + lv.id, '1'); App().confetti(); }
  }

  function chapterRecap(c, host) {
    const keys = [];
    (c.md.match(/^:::key[^\n]*\n[\s\S]*?\n:::/gm) || []).forEach((blk) => {
      const lines = blk.split('\n'); const title = lines[0].replace(/^:::key\s*/, '').trim();
      const body = lines.slice(1, -1).join(' ').replace(/\*\*/g, '').replace(/\[\[.*?\]\]/g, '').trim();
      keys.push(title || body.slice(0, 80));
    });
    if (!keys.length && c.summary) keys.push(c.summary);
    const u = Store.user(); u.conf = u.conf || {};
    const cur = u.conf[c.id];
    host.innerHTML = `${keys.length ? `<div class="recap"><div class="card-h">🔑 本章重點</div><ul>${keys.slice(0, 6).map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>` : ''}
      <div class="conf"><span>讀完呢章，你覺得自己：</span>${[[1, '😕 未明'], [2, '🙂 大致明'], [3, '😎 好清楚']].map(([v, t]) => `<button class="btn sm ${cur === v ? 'primary' : ''}" data-conf="${v}">${t}</button>`).join('')}<small class="muted">（標記「未明」會出現喺建議下一步同學習地圖）</small></div>`;
    $$('[data-conf]', host).forEach((b) => b.addEventListener('click', () => { u.conf[c.id] = +b.dataset.conf; Store.save(); Store.awardXP('conf:' + c.id, 1); chapterRecap(c, host); App().toast(+b.dataset.conf === 1 ? '已標記，之後會提你重溫' : '已記錄 👍'); }));
  }

  window.Learn = { nextCard, nextSteps, renderMap, renderCert, chapterRecap, paceHTML, bindPace, certState, questCard, quests, heatmap, renderReview, renderGym, renderLevel, renderGuide, glossTips, ttsButton, ttsStop, exportNotes, statsHTML, DRILLS, decide };
})();
