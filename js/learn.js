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
    risk: {
      title: '風險速算（60 秒）', icon: '⏱️', level: 'l3', timed: 60,
      desc: '60 秒內盡量答：股數、R:R、R 倍數、止損金額。愈快愈熟，臨場就唔會計錯數。',
      gen() { const r = genRisk(); return { html: '', q: r.q, opts: r.opts, ans: r.ans, why: r.why }; },
    },
  };

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

  window.Learn = { questCard, quests, heatmap, renderReview, renderGym, renderLevel, renderGuide, glossTips, ttsButton, ttsStop, exportNotes, statsHTML, DRILLS, decide };
})();
