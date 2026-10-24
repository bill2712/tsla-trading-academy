/* =========================================================
 * 雲端同步：Google 登入（只限 CLOUD_CONFIG.members）+ Firestore
 *
 * Firebase 專案：見 js/cloud-config.js（tsla-academy）
 * Firestore 結構：
 *   academyMembers/{uid}              { email, name, emoji, color, updatedAt }
 *   academyUsers/{uid}/parts/{part}   { json, updatedAt, uid }   ← 每人自己嘅資料（分幾份）
 *   academyComments/{id}              { json, uid, ts }          ← 全家共用留言
 *   academyVideos/{id}                { json, uid, ts }          ← 全家共用影片
 * 每人只可以寫自己嘅資料，但可以讀全家嘅資料（見 firestore.rules）。
 * 同一個人用兩部機：每份資料以「最後修改時間」為準。
 * ========================================================= */
(function () {
  const CFG = window.CLOUD_CONFIG;
  const Cloud = { enabled: false, ready: false, user: null, status: 'off', signOut() {}, importInto() {} };
  window.Cloud = Cloud;
  if (!CFG || !window.firebase || !CFG.firebase || !CFG.firebase.apiKey) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PARTS = {
    progress: ['read', 'visited', 'seen', 'last', 'quiz', 'checks', 'xp', 'xpLog', 'streak', 'replay', 'gym', 'conf', 'wrong', 'activity'],
    marks: ['bookmarks', 'notes', 'highlights'],
    journal: ['journal', 'candidates', 'playbooks', 'replays'],
    tools: ['toolState'],
  };
  const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ':' + str.length; };
  const pick = (u, keys) => { const o = {}; keys.forEach((k) => { if (u[k] !== undefined) o[k] = u[k]; }); return o; };

  let app, auth, fs;
  try {
    app = firebase.initializeApp(CFG.firebase, 'academy');
    auth = app.auth();
    fs = app.firestore();
    try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}
  } catch (e) { console.error('Firebase 初始化失敗', e); return; }
  Cloud.enabled = true;

  /* ---------------- 登入畫面 ---------------- */
  const gate = document.createElement('div');
  gate.className = 'auth-gate';
  gate.innerHTML = '<div class="auth-card"><div class="auth-logo">📈</div><p class="auth-eyebrow">TSLA Day Trading 學院</p><div data-gate-body><p class="muted">載入中…</p></div></div>';
  document.body.appendChild(gate);
  document.body.classList.add('gated');
  const gateBody = gate.querySelector('[data-gate-body]');
  const showGate = (html) => { gateBody.innerHTML = html; gate.hidden = false; document.body.classList.add('gated'); };
  const hideGate = () => { gate.hidden = true; document.body.classList.remove('gated'); };
  function showLogin(err) {
    showGate(`<h1>家庭學習平台</h1><p class="muted">用你嘅 Google 帳號登入。進度、書籤、筆記、螢光筆會喺你部機同家人之間即時同步，你哋亦會見到對方標記咗乜。</p>
      <button class="btn lg auth-google" data-login><img src="assets/google.svg" alt="" width="22" height="22"> 使用 Google 帳號登入</button>
      ${err ? `<p class="auth-err">${esc(err)}</p>` : ''}<p class="auth-fine">只限已授權嘅家庭成員。</p>`);
    gateBody.querySelector('[data-login]').addEventListener('click', login);
  }
  function showDenied(email) {
    showGate(`<h1>冇權限</h1><p>帳號 <b>${esc(email)}</b> 未獲授權使用呢個平台。</p><p class="muted">請用家庭成員嘅 Google 帳號重新登入。</p><button class="btn lg" data-out>登出，轉另一個帳號</button>`);
    gateBody.querySelector('[data-out]').addEventListener('click', () => auth.signOut());
  }
  async function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { await auth.signInWithPopup(provider); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) { try { await auth.signInWithRedirect(provider); return; } catch (e2) { e = e2; } }
      if (e.code === 'auth/popup-closed-by-user') return;
      showLogin(e.code === 'auth/unauthorized-domain' ? '呢個網址未加入 Firebase 授權網域（Authentication → Settings → Authorized domains）。' : '登入失敗：' + (e.message || e.code));
    }
  }
  auth.getRedirectResult().catch((e) => showLogin('登入失敗：' + (e.message || e.code)));

  /* ---------------- 同步狀態 ---------------- */
  let uid = null, meta = null, unsubs = [], partSubs = {}, flushTimer = null, remoteTimer = null, remoteFlags = {};
  let ownFirstServer = false, membersLoaded = false, migrationAsked = false;
  const setStatus = (s) => { Cloud.status = s; window.dispatchEvent(new CustomEvent('ta:sync', { detail: s })); };
  const metaKey = () => 'ta:sync:' + uid;
  const loadMeta = () => { try { return Object.assign({ ts: {}, hash: {}, shared: { comments: {}, videos: {} }, prof: '' }, JSON.parse(localStorage.getItem(metaKey()) || '{}')); } catch (e) { return { ts: {}, hash: {}, shared: { comments: {}, videos: {} }, prof: '' }; } };
  const saveMeta = () => { try { localStorage.setItem(metaKey(), JSON.stringify(meta)); } catch (e) {} };
  let lastToast = 0;
  const report = (e) => {
    console.error(e);
    const quota = e && (e.code === 'resource-exhausted' || /quota/i.test(e.message || ''));
    setStatus(quota ? 'quota' : 'error');
    if (window.App && Date.now() - lastToast > 60000) {
      lastToast = Date.now();
      App.toast(e && e.code === 'permission-denied' ? '⚠️ 同步被拒：請檢查 Firestore 規則' : quota ? '⚠️ Firebase 今日免費讀取額度用完咗。本機照用得，額度重置後會自動同步。' : '⚠️ 同步失敗，會自動再試', 6000);
    }
  };
  // 監聽出錯（例如額度用完、斷線太耐）：一分鐘後自動重新連線
  let retryTimer = null;
  const listenErr = (e) => {
    report(e);
    if (retryTimer || !uid) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      const u = auth.currentUser || lastUser, m = u && memberDefaults(u.email);
      if (!u || !m || !uid) return;
      stop(); start(u, m);
    }, window.__CLOUD_RETRY_MS || 60000);
  };
  function remoteChanged(kind) {
    remoteFlags[kind] = true;
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(() => { const d = remoteFlags; remoteFlags = {}; Store.saveNow(); window.dispatchEvent(new CustomEvent('ta:remote', { detail: d })); }, 250);
  }

  function memberDefaults(email) { return CFG.members.find((m) => m.email.toLowerCase() === (email || '').toLowerCase()); }

  function prepareCache(user, member) {
    const db = Store.db;
    const project = CFG.firebase.projectId;
    if (!db.cloudCache || db.cloudProject !== project) {
      // 舊資料保留做「可合併」嘅來源：本機模式 → local-backup；之前另一個 Firebase 專案嘅快取 → old-cloud
      if ((db.profiles || []).length) { try { localStorage.setItem(db.cloudCache ? 'ta:v1:old-cloud' : 'ta:v1:local-backup', JSON.stringify(db)); } catch (e) {} }
      Store.loadDB({ cloudCache: true, cloudProject: project });
    }
    const d = Store.db;
    if (!d.users[user.uid]) d.users[user.uid] = Store.emptyUser();
    if (!d.profiles.some((p) => p.id === user.uid)) d.profiles.push({ id: user.uid, email: member.email, name: member.name, emoji: member.emoji, color: member.color, createdAt: Date.now() });
    d.active = user.uid;
  }

  let lastUser = null;
  function start(user, member) {
    lastUser = user;
    uid = user.uid; Cloud.user = { uid, email: user.email, name: user.displayName };
    meta = loadMeta();
    prepareCache(user, member);
    Store.setCloudMode({ uid, email: user.email });
    setStatus('syncing');
    Store.saveNow();
    if (window.App) App.route();
    hideGate();
    // 離線時唔好一直等：呢部機之前同步過，4 秒後照用本機快取（新機就一定要等伺服器，避免上載空白資料）
    setTimeout(() => { if (!Cloud.ready && uid && Object.keys(meta.ts).length) { Cloud.ready = true; setStatus('offline'); } }, 4000);

    unsubs.push(fs.collection('academyMembers').onSnapshot((qs) => {
      const order = CFG.members.map((m) => m.email.toLowerCase());
      const list = qs.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((p) => order.includes((p.email || '').toLowerCase()));
      if (!list.some((p) => p.id === uid)) {
        const mine = Store.db.profiles.find((p) => p.id === uid) || member;
        fs.collection('academyMembers').doc(uid).set({ email: user.email.toLowerCase(), name: mine.name, emoji: mine.emoji, color: mine.color, updatedAt: Date.now() }).catch(report);
      }
      const merged = list.map((p) => ({ id: p.id, email: p.email, name: p.name, emoji: p.emoji, color: p.color }));
      if (!merged.some((p) => p.id === uid)) merged.push(Store.db.profiles.find((p) => p.id === uid));
      merged.sort((a, b) => order.indexOf((a.email || '').toLowerCase()) - order.indexOf((b.email || '').toLowerCase()));
      Store.db.profiles = merged;
      merged.forEach((p) => { if (!Store.db.users[p.id]) Store.db.users[p.id] = Store.emptyUser(); if (!partSubs[p.id]) listenParts(p.id); });
      const mineNow = merged.find((p) => p.id === uid);
      if (mineNow) meta.prof = hash(JSON.stringify({ name: mineNow.name, emoji: mineNow.emoji, color: mineNow.color }));
      membersLoaded = true;
      remoteChanged('profiles');
    }, listenErr));
    listenParts(uid);
    unsubs.push(fs.collection('academyComments').onSnapshot((qs) => applyShared('comments', qs), listenErr));
    unsubs.push(fs.collection('academyVideos').onSnapshot((qs) => applyShared('videos', qs), listenErr));
  }

  function listenParts(pid) {
    partSubs[pid] = fs.collection('academyUsers').doc(pid).collection('parts').onSnapshot({ includeMetadataChanges: pid === uid }, (qs) => {
      const own = pid === uid;
      let changed = false;
      qs.docs.forEach((d) => {
        const part = d.id, data = d.data();
        if (!PARTS[part] || typeof data.json !== 'string') return;
        if (own) {
          if (d.metadata.hasPendingWrites || flushTimer) return; // 本機有未上載嘅修改：本機較新
          if ((data.updatedAt || 0) <= (meta.ts[part] || 0)) return;
          const h = hash(data.json);
          if (h === meta.hash[part]) { meta.ts[part] = data.updatedAt; return; }
          meta.hash[part] = h; meta.ts[part] = data.updatedAt;
        }
        try { Object.assign(Store.db.users[pid] = Store.db.users[pid] || Store.emptyUser(), JSON.parse(data.json)); changed = true; } catch (e) { console.warn('資料格式錯誤', part, e); }
      });
      if (own) {
        saveMeta();
        if (!qs.metadata.fromCache && !ownFirstServer) {
          ownFirstServer = true; Cloud.ready = true;
          if (qs.empty) maybeMigrate();
          flush(true);
          setStatus('synced');
        }
      }
      if (changed) remoteChanged(own ? 'own' : 'others');
    }, listenErr);
  }

  function applyShared(kind, qs) {
    const mine = meta.shared[kind];
    const remote = [];
    const remoteIds = new Set();
    qs.docs.forEach((d) => { try { const x = JSON.parse(d.data().json); x.id = d.id; remote.push(x); remoteIds.add(d.id); if (x.author === uid) mine[d.id] = hash(JSON.stringify(x)); } catch (e) {} });
    const local = Store.db.shared[kind] || [];
    // 未上載嘅新項目保留；本機已刪除但未同步嘅唔好加返
    const pending = local.filter((x) => x.author === uid && !remoteIds.has(x.id) && !mine[x.id]);
    const localIds = new Set(local.map((x) => x.id));
    const result = remote.filter((x) => !(x.author === uid && mine[x.id] && !localIds.has(x.id) && flushTimer)).concat(pending);
    result.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    Store.db.shared[kind] = result;
    saveMeta();
    remoteChanged('shared');
  }

  /* ---------------- 上載本機修改 ---------------- */
  function flush(force) {
    clearTimeout(flushTimer); flushTimer = null;
    if (!uid || !Cloud.ready) return;
    const u = Store.db.users[uid]; if (!u) return;
    let n = 0;
    Object.keys(PARTS).forEach((part) => {
      const json = JSON.stringify(pick(u, PARTS[part])); const h = hash(json);
      if (!force && h === meta.hash[part]) return;
      if (force && h === meta.hash[part] && meta.ts[part]) return;
      const ts = Math.max(Date.now(), (meta.ts[part] || 0) + 1);
      meta.hash[part] = h; meta.ts[part] = ts; n++;
      fs.collection('academyUsers').doc(uid).collection('parts').doc(part).set({ json, updatedAt: ts, uid }).catch(report);
    });
    ['comments', 'videos'].forEach((kind) => {
      const col = fs.collection(kind === 'comments' ? 'academyComments' : 'academyVideos');
      const mine = meta.shared[kind];
      const local = (Store.db.shared[kind] || []).filter((x) => x.author === uid);
      const ids = new Set(local.map((x) => x.id));
      local.forEach((x) => { const json = JSON.stringify(x), h = hash(json); if (mine[x.id] === h) return; mine[x.id] = h; n++; col.doc(x.id).set({ json, uid, ts: x.ts || Date.now() }).catch(report); });
      Object.keys(mine).forEach((id) => { if (!ids.has(id)) { delete mine[id]; n++; col.doc(id).delete().catch(report); } });
    });
    const p = Store.db.profiles.find((x) => x.id === uid);
    if (p && membersLoaded) {
      const ph = hash(JSON.stringify({ name: p.name, emoji: p.emoji, color: p.color }));
      if (ph !== meta.prof) { meta.prof = ph; n++; fs.collection('academyMembers').doc(uid).set({ email: (Cloud.user.email || '').toLowerCase(), name: p.name, emoji: p.emoji, color: p.color, updatedAt: Date.now() }).catch(report); }
    }
    saveMeta();
    if (n) { setStatus('syncing'); fs.waitForPendingWrites().then(() => setStatus('synced'), () => {}); }
  }
  window.addEventListener('ta:saved', () => { if (!uid || !Cloud.ready) return; if (!flushTimer) flushTimer = setTimeout(() => flush(), 1200); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && flushTimer) flush(); });
  window.addEventListener('pagehide', () => { if (flushTimer) flush(); });

  /* ---------------- 第一次登入：搬本機資料 ---------------- */
  function localProfilesFrom(data) {
    return (data && data.profiles || []).map((p) => { const u = (data.users || {})[p.id] || {}; return { p, u, read: Object.keys(u.read || {}).length, xp: u.xp || 0, notes: Object.keys(u.notes || {}).length + (u.highlights || []).length + (u.bookmarks || []).length, trades: (u.journal || []).length }; }).filter((x) => x.read || x.xp || x.notes || x.trades);
  }
  function mergeLocalInto(data, pid) {
    const src = (data.users || {})[pid]; if (!src) return;
    const me = Store.db.users[uid] = Store.mergeUser(Object.assign(Store.emptyUser(), Store.db.users[uid]), Object.assign(Store.emptyUser(), src));
    if (!me) return;
    const lp = (data.profiles || []).find((p) => p.id === pid);
    const myP = Store.db.profiles.find((p) => p.id === uid);
    const sh = data.shared || {};
    const have = new Set((Store.db.shared.comments || []).map((c) => c.id));
    (sh.comments || []).filter((c) => c.author === pid && !have.has(c.id)).forEach((c) => Store.db.shared.comments.push(Object.assign({}, c, { author: uid, name: myP ? myP.name : c.name, emoji: myP ? myP.emoji : c.emoji, color: myP ? myP.color : c.color })));
    const haveV = new Set((Store.db.shared.videos || []).map((v) => v.id));
    (sh.videos || []).filter((v) => !haveV.has(v.id)).forEach((v) => Store.db.shared.videos.push(Object.assign({}, v, { author: uid })));
    if (lp && myP && !meta.renamed && !/（之前雲端）$/.test(lp.name || '')) { myP.emoji = lp.emoji || myP.emoji; myP.color = lp.color || myP.color; }
    Store.saveNow(); flush(); if (window.App) App.route();
  }
  function askMerge(data, title) {
    const list = localProfilesFrom(data);
    if (!list.length || !window.App) return false;
    App.modal(`<h3>${title}</h3><p>呢度有之前嘅學習紀錄。揀邊個係「你」，佢嘅進度、書籤、筆記、螢光筆同交易日誌就會合併入你嘅帳號（唔會刪除任何嘢）。</p>
      <div class="prof-list">${list.map((x, i) => `<button class="prof-pick" data-mi="${i}"><span class="av" style="--c:${x.p.color}">${x.p.emoji}</span><b>${esc(x.p.name)}</b><small>讀完 ${x.read} 章・${x.xp} XP・標記 ${x.notes}・交易 ${x.trades}</small></button>`).join('')}</div>
      <div class="modal-actions"><button class="btn ghost" data-skip>唔使，由零開始</button></div>`, (box, close) => {
      box.querySelectorAll('[data-mi]').forEach((b) => b.addEventListener('click', () => { mergeLocalInto(data, list[+b.dataset.mi].p.id); close(); App.toast('已合併入你嘅帳號 ☁️'); }));
      box.querySelector('[data-skip]').addEventListener('click', close);
    }, { noFocus: true });
    return true;
  }
  function maybeMigrate() {
    if (migrationAsked || meta.migrated) return;
    migrationAsked = true; meta.migrated = true; saveMeta();
    // 合併所有可用來源（本機模式紀錄 + 之前 Firebase 專案嘅快取）
    const data = { profiles: [], users: {}, shared: { comments: [], videos: [] } };
    [['ta:v1:local-backup', ''], ['ta:v1:old-cloud', '（之前雲端）']].forEach(([key, tag]) => {
      let src = null; try { src = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (!src || !Array.isArray(src.profiles)) return;
      src.profiles.forEach((p) => { if (data.profiles.some((x) => x.id === p.id)) return; data.profiles.push(Object.assign({}, p, { name: (p.name || '') + tag })); data.users[p.id] = (src.users || {})[p.id]; });
      const sh = src.shared || {};
      ['comments', 'videos'].forEach((k) => (sh[k] || []).forEach((x) => { if (!data.shared[k].some((y) => y.id === x.id)) data.shared[k].push(x); }));
    });
    if (data.profiles.length) setTimeout(() => askMerge(data, '☁️ 搬之前嘅學習紀錄入你嘅帳號？'), 600);
  }
  Cloud.flush = () => flush();
  Cloud.importInto = (text) => { const data = JSON.parse(text); if (!data || !Array.isArray(data.profiles)) throw new Error('檔案格式唔啱'); if (!askMerge(data, '⬆️ 匯入備份')) throw new Error('備份入面冇學習紀錄'); };

  /* ---------------- 登入狀態 ---------------- */
  function stop() {
    unsubs.forEach((f) => f()); unsubs = [];
    Object.values(partSubs).forEach((f) => f()); partSubs = {};
    clearTimeout(flushTimer); flushTimer = null;
    uid = null; Cloud.user = null; Cloud.ready = false; ownFirstServer = false; membersLoaded = false; migrationAsked = false;
    Store.setCloudMode(null);
    setStatus('off');
  }
  Cloud.signOut = (clearCache) => { if (flushTimer) flush(); fs.waitForPendingWrites().catch(() => {}).then(() => auth.signOut()).then(() => { if (clearCache) { try { localStorage.removeItem('ta:v1'); } catch (e) {} location.reload(); } }); };
  auth.onAuthStateChanged((user) => {
    if (!user) { if (uid) stop(); showLogin(); return; }
    const member = memberDefaults(user.email);
    if (!member) { if (uid) stop(); showDenied(user.email); return; }
    if (uid === user.uid) return;
    if (uid) stop();
    start(user, member);
  });
})();
