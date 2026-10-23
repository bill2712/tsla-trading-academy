/* =========================================================
 * Store：所有資料存喺瀏覽器 localStorage
 * - 多個使用者（例如 爸爸 / 細路），各自有進度、書籤、筆記
 * - 留言、影片連結係「家庭共用」
 * - 可以匯出 / 匯入 JSON，喺唔同裝置之間合併資料
 * ========================================================= */
(function () {
  const KEY = 'ta:v1';
  const UIKEY = 'ta:ui';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  function emptyUser() {
    return {
      read: {},        // chapterId -> timestamp（已完成）
      visited: {},     // chapterId -> timestamp
      seen: {},        // chapterId -> { sectionId: timestamp }（讀到邊）
      last: null,      // { chapter, section, ts }
      bookmarks: [],   // { id, chapter, section, title, ts }
      notes: {},       // "chapter#section" -> { text, ts }
      highlights: [],  // { id, chapter, section, text, color, note, ts }
      quiz: {},        // quizId -> { best, last, total, answers, ts }
      checks: {},      // checkItemId -> true
      xp: 0,
      xpLog: {},       // 已經攞過 XP 嘅事件，避免重複計
      streak: { last: null, count: 0, best: 0 },
      journal: [],     // 交易日誌（已執行交易）
      candidates: [],  // 候選 Setup 紀錄
      playbooks: [],   // 自訂 Playbook（有版本紀錄）
      replays: [],     // 每日 Replay 檢討
      replay: {},      // scenarioId -> { best, ts }
      toolState: {},   // 各計算器記住嘅輸入
      wrong: {},       // 錯題本："quizId:題號" -> { box, due, miss, ts }（間隔重溫）
      activity: {},    // 學習日曆："YYYY-MM-DD" -> { xp, sec, quiz, drill, note, replay, journal, review }
      gym: {},         // 訓練場：drillId -> { best, plays, ts }
      conf: {},        // 每章自評：chapterId -> 1（未明）/ 2 / 3
    };
  }

  function emptyDB() {
    return {
      version: 1,
      profiles: [],
      active: null,
      users: {},
      shared: { comments: [], videos: [] },
    };
  }

  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyDB();
      const parsed = JSON.parse(raw);
      return Object.assign(emptyDB(), parsed);
    } catch (e) {
      console.warn('讀取資料失敗', e);
      return emptyDB();
    }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 150);
  }
  function saveNow() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('儲存失敗', e);
      window.dispatchEvent(new CustomEvent('ta:save-error'));
    }
  }
  window.addEventListener('beforeunload', saveNow);

  const listeners = new Set();
  function emit(type) {
    save();
    if (type === 'journal') logAct('journal');
    listeners.forEach((fn) => { try { fn(type); } catch (e) { console.error(e); } });
  }

  /* ---------- 使用者 ---------- */
  function profiles() { return db.profiles; }
  function activeProfile() { return db.profiles.find((p) => p.id === db.active) || null; }
  function addProfile(name, emoji, color) {
    const p = { id: uid(), name: name || '學員', emoji: emoji || '🙂', color: color || '#3b82f6', createdAt: Date.now() };
    db.profiles.push(p);
    db.users[p.id] = emptyUser();
    if (!db.active) db.active = p.id;
    emit('profiles');
    return p;
  }
  function updateProfile(id, patch) {
    const p = db.profiles.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    emit('profiles');
  }
  function removeProfile(id) {
    db.profiles = db.profiles.filter((p) => p.id !== id);
    delete db.users[id];
    if (db.active === id) db.active = db.profiles[0] ? db.profiles[0].id : null;
    emit('profiles');
  }
  function setActive(id) { db.active = id; emit('profiles'); }
  function user(id) {
    const pid = id || db.active;
    if (!pid) return emptyUser();
    if (!db.users[pid]) db.users[pid] = emptyUser();
    const u = db.users[pid];
    // 舊資料補齊新欄位
    const blank = emptyUser();
    for (const k in blank) if (u[k] === undefined) u[k] = blank[k];
    return u;
  }

  /* ---------- XP / Streak ---------- */
  function touchStreak() {
    const u = user();
    const t = today();
    if (u.streak.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    u.streak.count = u.streak.last === ys ? u.streak.count + 1 : 1;
    u.streak.best = Math.max(u.streak.best || 0, u.streak.count);
    u.streak.last = t;
    save();
  }
  function dayStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return dayStr(d); }
  /* 學習活動（每日任務、學習日曆） */
  function logAct(kind, n) {
    if (!activeProfile()) return;
    const u = user(), t = today();
    const a = u.activity[t] = u.activity[t] || {};
    a[kind] = (a[kind] || 0) + (n == null ? 1 : n);
    save();
    window.dispatchEvent(new CustomEvent('ta:act', { detail: { kind } }));
  }
  /* 錯題本：Leitner 間隔重溫（答錯 → 今日再溫；答啱 → 1、3、7、14 日後再溫；連續答啱 4 次 = 掌握） */
  const GAPS = [1, 3, 7, 14];
  function recordAnswer(qid, i, ok) {
    if (!activeProfile()) return;
    const u = user(), k = qid + ':' + i, w = u.wrong[k];
    if (!ok) u.wrong[k] = { box: 0, due: today(), miss: ((w && w.miss) || 0) + 1, ts: Date.now() };
    else if (w) {
      if (w.box >= GAPS.length - 1) { delete u.wrong[k]; awardXP('master:' + k + ':' + w.miss, 3); }
      else { w.box++; w.due = addDays(GAPS[w.box]); w.ts = Date.now(); }
    }
    logAct('quiz');
  }
  function dueWrong() { const u = user(), t = today(); return Object.keys(u.wrong).filter((k) => u.wrong[k].due <= t); }
  function awardXP(eventKey, amount) {
    const u = user();
    if (!activeProfile()) return 0;
    if (u.xpLog[eventKey]) return 0;
    u.xpLog[eventKey] = Date.now();
    u.xp += amount;
    { const t = today(); const a = u.activity[t] = u.activity[t] || {}; a.xp = (a.xp || 0) + amount; }
    emit('xp');
    window.dispatchEvent(new CustomEvent('ta:xp', { detail: { amount } }));
    return amount;
  }

  /* ---------- 閱讀進度 ---------- */
  function markVisited(ch) { const u = user(); u.visited[ch] = Date.now(); touchStreak(); save(); }
  function setLast(ch, section) { const u = user(); u.last = { chapter: ch, section: section || null, ts: Date.now() }; save(); }
  function setRead(ch, val) {
    const u = user();
    if (val) { u.read[ch] = Date.now(); awardXP('read:' + ch, 20); }
    else delete u.read[ch];
    emit('read');
  }

  /* ---------- 書籤 ---------- */
  function isBookmarked(ch, sec) { return user().bookmarks.some((b) => b.chapter === ch && b.section === sec); }
  function toggleBookmark(ch, sec, title) {
    const u = user();
    const i = u.bookmarks.findIndex((b) => b.chapter === ch && b.section === sec);
    if (i >= 0) u.bookmarks.splice(i, 1);
    else u.bookmarks.unshift({ id: uid(), chapter: ch, section: sec, title, ts: Date.now() });
    emit('bookmarks');
    return i < 0;
  }

  /* ---------- 筆記 ---------- */
  function getNote(ch, sec) { const n = user().notes[ch + '#' + sec]; return n ? n.text : ''; }
  function setNote(ch, sec, text) {
    const u = user();
    const k = ch + '#' + sec;
    if (text && text.trim()) { u.notes[k] = { text, ts: Date.now() }; awardXP('note:' + k, 3); logAct('note'); }
    else delete u.notes[k];
    emit('notes');
  }

  /* ---------- 螢光筆 ---------- */
  function addHighlight(h) { const u = user(); const x = Object.assign({ id: uid(), ts: Date.now() }, h); u.highlights.push(x); logAct('note'); emit('highlights'); return x; }
  function updateHighlight(id, patch) { const h = user().highlights.find((x) => x.id === id); if (h) Object.assign(h, patch); emit('highlights'); }
  function removeHighlight(id) { const u = user(); u.highlights = u.highlights.filter((h) => h.id !== id); emit('highlights'); }

  /* ---------- 留言（共用） ---------- */
  function addComment(c) {
    const p = activeProfile();
    const x = Object.assign({ id: uid(), ts: Date.now(), author: p ? p.id : null, name: p ? p.name : '訪客', emoji: p ? p.emoji : '🙂', color: p ? p.color : '#888' }, c);
    db.shared.comments.push(x);
    awardXP('comment:' + x.id, 2);
    emit('comments');
    return x;
  }
  function removeComment(id) {
    db.shared.comments = db.shared.comments.filter((c) => c.id !== id && c.parent !== id);
    emit('comments');
  }
  function comments(ch) { return db.shared.comments.filter((c) => !ch || c.chapter === ch); }

  /* ---------- 影片（共用） ---------- */
  function addVideo(v) {
    const p = activeProfile();
    const x = Object.assign({ id: uid(), ts: Date.now(), by: p ? p.name : '' }, v);
    db.shared.videos.push(x);
    emit('videos');
    return x;
  }
  function removeVideo(id) { db.shared.videos = db.shared.videos.filter((v) => v.id !== id); emit('videos'); }
  function videos(ch) { return db.shared.videos.filter((v) => !ch || v.chapter === ch); }

  /* ---------- 測驗 / 清單 ---------- */
  function saveQuiz(id, score, total, answers) {
    const u = user();
    const prev = u.quiz[id] || { best: 0 };
    u.quiz[id] = { best: Math.max(prev.best || 0, score), last: score, total, answers, ts: Date.now() };
    if (score === total) awardXP('quizfull:' + id, 10);
    emit('quiz');
  }
  function toggleCheck(id, val) {
    const u = user();
    if (val) { u.checks[id] = true; awardXP('check:' + id, 1); } else delete u.checks[id];
    emit('checks');
  }

  /* ---------- 匯出 / 匯入 ---------- */
  function exportJSON() {
    saveNow();
    return JSON.stringify(Object.assign({ exportedAt: new Date().toISOString(), app: 'tsla-trading-academy' }, db), null, 2);
  }
  function mergeArrById(a, b) {
    const map = new Map();
    (a || []).forEach((x) => map.set(x.id, x));
    (b || []).forEach((x) => { if (!map.has(x.id)) map.set(x.id, x); });
    return Array.from(map.values()).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  }
  function mergeUser(a, b) {
    const out = Object.assign(emptyUser(), a);
    out.read = Object.assign({}, b.read, a.read);
    out.visited = Object.assign({}, b.visited, a.visited);
    out.seen = Object.assign({}, b.seen);
    for (const k in a.seen || {}) out.seen[k] = Object.assign({}, out.seen[k], a.seen[k]);
    out.bookmarks = mergeArrById(a.bookmarks, b.bookmarks);
    out.highlights = mergeArrById(a.highlights, b.highlights);
    out.journal = mergeArrById(a.journal, b.journal);
    out.candidates = mergeArrById(a.candidates, b.candidates);
    out.playbooks = mergeArrById(a.playbooks, b.playbooks);
    out.replays = mergeArrById(a.replays, b.replays);
    out.toolState = Object.assign({}, b.toolState, a.toolState);
    out.notes = Object.assign({}, b.notes);
    for (const k in a.notes || {}) if (!out.notes[k] || (a.notes[k].ts || 0) >= (out.notes[k].ts || 0)) out.notes[k] = a.notes[k];
    out.quiz = Object.assign({}, b.quiz);
    for (const k in a.quiz || {}) if (!out.quiz[k] || (a.quiz[k].best || 0) >= (out.quiz[k].best || 0)) out.quiz[k] = a.quiz[k];
    out.checks = Object.assign({}, b.checks, a.checks);
    out.xpLog = Object.assign({}, b.xpLog, a.xpLog);
    out.xp = Math.max(a.xp || 0, b.xp || 0);
    out.replay = Object.assign({}, b.replay, a.replay);
    out.wrong = Object.assign({}, b.wrong, a.wrong);
    out.conf = Object.assign({}, b.conf, a.conf);
    out.activity = Object.assign({}, b.activity);
    for (const d in a.activity || {}) { const x = Object.assign({}, out.activity[d]); for (const k in a.activity[d]) x[k] = Math.max(x[k] || 0, a.activity[d][k] || 0); out.activity[d] = x; }
    out.gym = Object.assign({}, b.gym);
    for (const k in a.gym || {}) if (!out.gym[k] || (a.gym[k].best || 0) >= (out.gym[k].best || 0)) out.gym[k] = Object.assign({}, a.gym[k], { plays: Math.max(a.gym[k].plays || 0, (out.gym[k] || {}).plays || 0) });
    const la = a.last ? a.last.ts : 0, lb = b.last ? b.last.ts : 0;
    out.last = la >= lb ? a.last : b.last;
    out.streak = (a.streak && b.streak && (b.streak.best || 0) > (a.streak.best || 0)) ? b.streak : (a.streak || b.streak);
    return out;
  }
  function importJSON(text, mode) {
    const incoming = JSON.parse(text);
    if (!incoming || !Array.isArray(incoming.profiles)) throw new Error('檔案格式唔啱');
    if (mode === 'replace') {
      db = Object.assign(emptyDB(), incoming);
      delete db.exportedAt; delete db.app;
    } else {
      incoming.profiles.forEach((p) => {
        if (!db.profiles.some((x) => x.id === p.id)) db.profiles.push(p);
        const inc = (incoming.users || {})[p.id] || emptyUser();
        db.users[p.id] = db.users[p.id] ? mergeUser(db.users[p.id], inc) : Object.assign(emptyUser(), inc);
      });
      const sh = incoming.shared || {};
      db.shared.comments = mergeArrById(db.shared.comments, sh.comments);
      db.shared.videos = mergeArrById(db.shared.videos, sh.videos);
      if (!db.active && db.profiles[0]) db.active = db.profiles[0].id;
    }
    saveNow();
    emit('import');
  }
  function resetAll() { db = emptyDB(); saveNow(); emit('reset'); }

  /* ---------- UI 設定（每部機） ---------- */
  function ui() { try { return JSON.parse(localStorage.getItem(UIKEY) || '{}'); } catch (e) { return {}; } }
  function setUI(patch) { try { localStorage.setItem(UIKEY, JSON.stringify(Object.assign(ui(), patch))); } catch (e) {} }

  window.Store = {
    uid, today, get db() { return db; },
    profiles, activeProfile, addProfile, updateProfile, removeProfile, setActive, user,
    awardXP, logAct, recordAnswer, dueWrong, addDays, touchStreak, markVisited, setLast, setRead,
    isBookmarked, toggleBookmark, getNote, setNote,
    addHighlight, updateHighlight, removeHighlight,
    addComment, removeComment, comments, addVideo, removeVideo, videos,
    saveQuiz, toggleCheck, exportJSON, importJSON, resetAll,
    ui, setUI, save, emit,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
