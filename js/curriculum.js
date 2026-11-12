/* =========================================================
 * 課程結構（2026-11-12 重新整理）
 *
 * content/level*.js 同 qa.js 係按「舊」Level 寫（l1–l17、qa），入面嘅
 * 「Level N 第 M 章」、「第 M 章」、章節編號、小節編號都係舊編號。
 * 呢個檔喺所有 content 載入之後、其他 JS 之前執行：
 *   1. 將 211 章重新分組成 9 個 Level（每個 Level 有單元），次序 = 建議學習次序
 *   2. 章節 id 完全唔變（進度、筆記、書籤、留言、測驗成績全部保留）
 *   3. 章節重新編號；小節標題顯示新編號，但小節 id 照舊（app.js 用 c.idNum 計 id）
 *   4. 將內文、測驗、清單入面嘅舊交叉參考（Level 15 第 5 章、L4、第 3 章…）
 *      換成新編號
 * 以後加新章節：喺下面 PLAN 加入章節 id。新寫嘅 content 應該直接用新編號，
 * 並喺 COURSE.push 嘅 level 物件加 `newRefs: true`（唔會再轉換）。
 * ========================================================= */
(function () {
  const OLD = (window.COURSE || []).slice();
  const OLDLV = {}; const OLDCH = {};
  OLD.forEach((l) => { OLDLV[l.id] = l; l.chapters.forEach((c) => { OLDCH[c.id] = c; c.oldLevel = l.id; c.oldNum = c.num; }); });
  const ids = (lv, a, b) => (OLDLV[lv] ? OLDLV[lv].chapters.map((c) => c.id) : []).filter((id) => { if (a == null) return true; const n = parseInt(OLDCH[id].num, 10); return n >= a && n <= b; });

  /* ---------- 新結構 ---------- */
  const PLAN = [
    { title: '圖表基本工具', icon: '🧱', color: '#ea580c', from: 'l1',
      units: [{ old: 'l1', title: '六樣工具', ch: ids('l1') }] },
    { title: 'TradingView 圖表設定', icon: '🖥️', color: '#0369a1', from: 'l10',
      units: [{ old: 'l10', title: 'TradingView 設定', ch: ids('l10') }] },
    { title: 'Price Action 同睇真圖', icon: '🧭', color: '#0891b2',
      subtitle: '市場結構、K 線同成交量深度閱讀、VWAP、S/R、工具矛盾點判斷；再用練習圖同真圖練 Swing 點、斜線、Lower High、突破 Retest、水平位，加埋你問過嘅畫線問題',
      question: '市場發生緊乜？我睇得明 Notes，點樣喺真圖都判斷到？',
      tip: '由「睇得明」進化到「有次序咁判斷」，再搬去真圖。三個單元：Price Action 核心（結構 → 位置 → 確認 → Volume／VWAP → 風險 → WAIT／PLAN／SKIP）、由 Notes 到真圖（Swing 點、斜線、突破 Retest、睇圖流程、100 張圖練習）、你問過嘅問題（S/R 點畫、Zone 幾闊、Stop 放邊）。',
      units: [
        { old: 'l2', title: 'Price Action 核心', ch: ids('l2') },
        { old: 'l12', title: '由 Notes 到真圖', ch: ids('l12', 1, 6).concat(ids('l12', 10, 12)) },
        { old: 'qa', title: '你問過嘅問題', ch: ids('qa') },
      ] },
    { title: 'Indicator 實戰', icon: '📊', color: '#4f46e5', from: 'l16',
      units: [{ old: 'l16', title: 'Indicator', ch: ids('l16') }] },
    { title: '市場環境、Gap 同開市', icon: '🌐', color: '#0d9488', from: 'l6',
      subtitle: '多時間框架、Gap 同盤前、Opening Range、相對強弱、日內時段、催化劑、日類型；再用 3 年真實數據睇 Gap 幾多會延續、開市頭 30 分鐘點分 Gap & Go／Fade／橫行',
      tip: '學識揀日子：先睇大市同多時間框架、Gap、Opening Range、相對強弱、時段、事件同日類型，令你只喺有利環境用 Setup；第二個單元用真實數據講 Gap 同開市頭 30 分鐘，最後做 Gap 預測練習。',
      units: [
        { old: 'l6', title: '市場環境', ch: ids('l6') },
        { old: 'l12', title: 'Gap 同開市頭 30 分鐘', gap: true, ch: ids('l12', 7, 9) },
      ] },
    { title: 'Setup 大全', icon: '🎯', color: '#be123c',
      subtitle: '所有 Setup 集中喺一個 Level：Setup 基本功（Breakout + Retest、S/R 反轉、假突破）→ 8 個日內常用 Setup → 頭 2 小時做多 → 名家打法 → VCP；每個都有入場、Stop、Target、唔做嘅情況同真實數據',
      question: '咩條件成立先入場？有邊啲 Setup？每個點入、點出、幾時唔做？',
      tip: '五個單元由淺到深：Setup 基本功（Setup 五個部分、Entry Trigger、Stop／Target／R:R、三套基本策略）→ 日內常用 Setup（ORB、Flag、VWAP 回調、Red-to-Green、Gap Fade…）→ 頭 2 小時做多（Flat Top、EMA 9 回調、Bull Flag、30 分鐘 ORB）→ 名家打法 → VCP。建議先讀完頭兩個單元，揀 1–2 個 Setup 專心練；名家打法同 VCP 係進修，可以遲啲先讀。',
      units: [
        { old: 'l3', title: 'Setup 基本功', ch: ids('l3') },
        { old: 'l14', title: '日內常用 Setup', ch: ids('l14') },
        { old: 'l15', title: '頭 2 小時做多', ch: ids('l15') },
        { old: 'l17', title: '名家打法', ch: ids('l17') },
        { old: 'l9', title: 'VCP 波幅收縮', ch: ids('l9') },
      ] },
    { title: '落單、風險同交易管理', icon: '🛡️', color: '#7c3aed',
      subtitle: '訂單類型、滑價、Bracket、Position Size、每日虧損上限、心理；入場之後點管理（ATR、出場、加倉、訂單流、做空、相關性、Kelly）；最後係落盤效率（開市前計劃表、IBKR Bracket、Presets、Hotkeys、交易節奏）',
      question: '點樣落單、限制風險？入咗場之後點樣管理到最合理？',
      tip: '三個單元：執行與風險管理（訂單、Position Size、Stop、每日風險、心理、Expectancy）→ 進階管理同訂單流（R 分佈、ATR、出場比較、加倉、Level 2 同 Time & Sales、做空、倉位模型）→ 落盤效率（開市前計劃表、警報、IBKR Bracket Order、Hotkeys、一日節奏）。',
      units: [
        { old: 'l4', title: '執行與風險管理', ch: ids('l4') },
        { old: 'l7', title: '進階管理同訂單流', ch: ids('l7') },
        { old: 'l13', title: '落盤效率（IBKR）', ch: ids('l13') },
      ] },
    { title: '回測同系統驗證', icon: '🔬', color: '#059669', from: 'l5',
      units: [{ old: 'l5', title: '回測', ch: ids('l5') }] },
    { title: '真錢之前同交易者表現', icon: '🏆', color: '#b45309',
      subtitle: '現實數據、香港帳戶同稅務、成本、數據、盤前落單、做空限制、停牌、騙局、點用每日報告、準備度檢查；再到交易計劃書、每日流程、檢討、心理偏誤、升級階梯、策略衰退同畢業專題',
      question: '我真係準備好用真錢未？點樣長期、穩定、健康咁進步？',
      tip: '最後一個 Level：先誠實睇現實數據同每日報告成績，補香港帳戶、稅務、成本、實時數據、盤前落單、做空限制、停牌同騙局，做準備度檢查同訂第一個月計劃；之後學交易計劃書、每日流程、進階檢討、心理偏誤、由 Paper 到真錢嘅升級階梯，最後完成畢業專題。',
      units: [
        { old: 'l11', title: '真錢之前', ch: ids('l11') },
        { old: 'l8', title: '交易者表現系統', ch: ids('l8') },
      ] },
  ];
  const OLD_TIPS = {
    l1: '先打好地基：識睇 K 線、成交量、PDH/PDL、S/R 同 VWAP。唔使急住交易，目標係「睇得明」。',
    l10: '圖表點用：將 TradingView 設定成 Day Trade 用嘅樣 —— New York 時區、Extended Hours 同盤前背景、Session Breaks、日線／15m／5m、VWAP 同 EMA 9、畫 PMH／PDH、Position 工具、警報同 Bar Replay。',
    l16: '專講 Indicator：EMA 9／20、VWAP、ATR、RVOL、RSI、MACD、Relative Strength、日線均線。每個量度乜、點讀、做多點用；真實數據顯示單睇讀數冇預測力，「靚」係背景合格加入場位出現。附逐支 K 讀 Indicator 嘅練習圖。',
    l5: '驗證你嘅系統：回測、Walk-forward、樣本數、期望值，唔好俾運氣呃到。',
  };

  /* ---------- 未編入嘅章節（以後加喺舊檔）自動放去同一個舊 Level 最後一個單元 ---------- */
  const used = new Set(); PLAN.forEach((L) => L.units.forEach((u) => u.ch.forEach((id) => used.add(id))));
  OLD.forEach((l) => l.chapters.forEach((c) => {
    if (used.has(c.id)) return;
    let host = null; PLAN.forEach((L) => L.units.forEach((u) => { if (u.old === l.id) host = u; }));
    if (host) { host.ch.push(c.id); used.add(c.id); }
  }));
  /* 完全新嘅 level（newRefs，或者唔喺 PLAN）照原樣放最後 */
  const extra = OLD.filter((l) => !PLAN.some((L) => L.units.some((u) => u.old === l.id)));

  /* ---------- 建立新 Level ---------- */
  const LEVELS = []; const LEGACY = {}; const CH2 = {};
  PLAN.forEach((P, i) => {
    const src = P.from ? OLDLV[P.from] : null, n = i + 1;
    const lv = { id: 'lv' + n, code: 'Level ' + n, title: P.title, icon: P.icon, color: P.color,
      subtitle: P.subtitle || (src && src.subtitle) || '', question: P.question || (src && src.question) || '',
      tip: P.tip || OLD_TIPS[P.from] || '', units: [], legacy: [], chapters: [] };
    P.units.forEach((u, k) => {
      const chs = u.ch.map((id) => OLDCH[id]).filter(Boolean);
      const unit = { idx: k, title: u.title, icon: (OLDLV[u.old] || {}).icon || P.icon, old: u.old, start: lv.chapters.length, count: chs.length };
      lv.units.push(unit);
      if (!lv.legacy.includes(u.old)) lv.legacy.push(u.old);
      if (u.gap) LEGACY[u.old + ':gap'] = { lv: lv.id, unit: k };
      else if (!LEGACY[u.old]) LEGACY[u.old] = { lv: lv.id, unit: k };
      chs.forEach((c) => { c.unit = k; c.unitTitle = u.title; lv.chapters.push(c); });
    });
    lv.chapters.forEach((c, j) => { c.num = j + 1; c.newLevel = lv.id; CH2[c.id] = c; });
    LEVELS.push(lv);
  });
  extra.forEach((l) => { LEVELS.push(l); l.chapters.forEach((c) => { c.newLevel = l.id; CH2[c.id] = c; }); });
  const LV = {}; LEVELS.forEach((l) => { LV[l.id] = l; });
  const lvOf = (id) => (LV[id] ? id : LEGACY[id] ? LEGACY[id].lv : id);
  const lvNum = (id) => { const l = LV[lvOf(id)]; return l ? parseInt(String(l.code).replace(/\D/g, ''), 10) : null; };
  const unitOf = (oldId, gap) => { const m = (gap && LEGACY[oldId + ':gap']) || LEGACY[oldId]; return m ? LV[m.lv].units[m.unit] : null; };

  /* ---------- 交叉參考轉換 ---------- */
  const CNUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const cn = (s) => { if (/^\d+$/.test(s)) return +s; if (s === '十') return 10; const p = s.split('十'); if (p.length === 1) return CNUM[s]; return (p[0] ? CNUM[p[0]] : 1) * 10 + (p[1] ? CNUM[p[1]] : 0); };
  const oldCh = (oldId, n) => { const l = OLDLV[oldId]; if (!l) return null; return l.chapters.find((c) => String(c.oldNum) === String(n)) || null; };
  const joinNums = (nums) => { // [3,4,5] → 3–5；[3,6] → 3、6；[1,2,3,5,6,7] → 1–3、5–7
    const a = Array.from(new Set(nums)).sort((x, y) => x - y); const out = [];
    for (let i = 0; i < a.length;) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; if (j - i >= 2) out.push(a[i] + '–' + a[j]); else for (let k = i; k <= j; k++) out.push(String(a[k])); i = j + 1; }
    return out.join('、');
  };
  /* 「2、9」「11–14」「3」→ 新章節列表 */
  function mapChList(oldId, list) {
    const out = []; let ok = true;
    list.split('、').forEach((tok) => {
      const m = tok.match(/^(\d+)\s*[–-]\s*(\d+)$/);
      const nums = m ? Array.from({ length: Math.max(0, +m[2] - +m[1] + 1) }, (_, i) => +m[1] + i) : [cn(tok.trim())];
      nums.forEach((n) => { const c = oldCh(oldId, n); if (c && CH2[c.id]) out.push(c); else ok = false; });
    });
    if (!ok || !out.length) return null;
    const lvls = Array.from(new Set(out.map((c) => c.newLevel)));
    if (lvls.length !== 1) return null;
    return { lv: lvls[0], nums: out.map((c) => c.num) };
  }
  const isNew = (ctx) => ctx && ctx.newRefs;
  function levelLabel(oldId, gap) {
    const m = (gap && LEGACY[oldId + ':gap']) || LEGACY[oldId]; const L = m ? LV[m.lv] : LV[oldId]; if (!L) return null;
    const u = m ? L.units[m.unit] : null;
    return L.code + (u && L.units.length > 1 ? '「' + u.title + '」' : '');
  }
  /* 主轉換：ctx = { old: 'l3', lv: 'lv6' }（舊 Level、新 Level），冇 ctx 就只轉有「Level N 第 M 章」同 Level 15 呢類明確參考 */
  const RE = /(?:(Level ?|L)(\d{1,2}) ?)?第 ?(\d+(?:\s*[、–-]\s*\d+)*|[一二三四五六七八九十]{1,3}) ?章|Level (\d{1,2})((?: ?(?:–|-|至|到|、) ?(?:Level )?\d{1,2}(?!\d|\s*第))*)( ?)|([（(、–\s])L(\d{1,2})((?:[–、]L?\d{1,2})*)(?=[）)、]|\s(?!第))/g;
  function fixText(s, ctx) {
    if (typeof s !== 'string' || isNew(ctx) || !/Level|第|L\d/.test(s)) return s;
    return s.replace(RE, (all, pre, preN, list, lvN, rest, sp, lpre, lN, lrest, off) => {
      if (list != null) { // 第 M 章
        const oldId = preN ? 'l' + preN : ctx && ctx.old;
        if (!oldId || !OLDLV[oldId]) return all;
        if (!preN && !ctx) return all;
        const m = mapChList(oldId, list.replace(/\s/g, ''));
        if (!m) return all;
        const L = LV[m.lv], same = !preN && ctx && ctx.lv === m.lv;
        return (same ? '' : (pre === 'L' ? 'L' + lvNum(m.lv) : L.code) + ' ') + '第 ' + joinNums(m.nums) + ' 章';
      }
      if (lvN != null) { // Level N（或者範圍／列表）
        const nums = [+lvN].concat((rest || '').match(/\d{1,2}/g) || []).map(Number);
        if (!rest && nums[0] === 2 && (!ctx || ctx.old === 'l7' || ctx.old === 'l11')) return all; // 呢度係「Level 2 掛單深度」
        if (nums.some((n) => !OLDLV['l' + n])) return all;
        if (nums.length === 1) {
          const gap = nums[0] === 12 && (!ctx || /Gap|跳空/.test(s.slice(off, off + 24))); // 報告入面講 Level 12 全部係講 Gap 數據
          const lab = levelLabel('l' + nums[0], gap); if (!lab) return all;
          return lab + (sp && !(/」$/.test(lab) && /[^\x00-\x7f]/.test(s.charAt(off + all.length))) ? sp : '');
        }
        let a = nums;
        if (/–|-|至|到/.test(rest) && nums.length === 2) a = Array.from({ length: nums[1] - nums[0] + 1 }, (_, i) => nums[0] + i);
        const nn = Array.from(new Set(a.map((n) => lvNum('l' + n))));
        return (nn.length === 1 ? 'Level ' + nn[0] : 'Level ' + joinNums(nn)) + (sp || '');
      }
      if (lN != null) { // （L1–L2）、L4、L3、L6、L9
        const nums = [+lN].concat((lrest || '').match(/\d{1,2}/g) || []).map(Number);
        if (nums.some((n) => !OLDLV['l' + n])) return all;
        let a = nums;
        if (/–/.test(lrest || '') && nums.length === 2) a = Array.from({ length: nums[1] - nums[0] + 1 }, (_, i) => nums[0] + i);
        const nn = Array.from(new Set(a.map((n) => lvNum('l' + n)))).sort((x, y) => x - y);
        return lpre + nn.map((n) => 'L' + n).join('、');
      }
      return all;
    });
  }
  const deepFix = (o, ctx) => {
    if (typeof o === 'string') return fixText(o, ctx);
    if (Array.isArray(o)) { o.forEach((v, i) => { o[i] = deepFix(v, ctx); }); return o; }
    if (o && typeof o === 'object') { Object.keys(o).forEach((k) => { if (typeof o[k] !== 'function') o[k] = deepFix(o[k], ctx); }); return o; }
    return o;
  };

  /* ---------- 套用：章節內文、標題、小節編號 ---------- */
  const NEXT_RE = /^\[\[link:level\/\w+\|[^\]]*(?:下一課|下一站|進修專題)[^\]]*\]\]\s*$/gm;
  LEVELS.forEach((L, li) => L.chapters.forEach((c, j) => {
    const owner = OLDLV[c.oldLevel] || {};
    const ctx = owner.newRefs ? { newRefs: true } : { old: c.oldLevel, lv: L.id };
    let md = c.md || '';
    if (!owner.newRefs) {
      md = md.replace(NEXT_RE, '');
      const base = parseInt(c.oldNum, 10);
      if (!isNaN(base) && L.units) {
        md = md.replace(new RegExp('^(#{2,3}\\s+)' + base + '(?=[.\\s])', 'gm'), '$1' + c.num);
        c.idNum = String(base);
      }
      md = fixText(md, ctx);
      c.title = fixText(c.title, ctx); c.summary = fixText(c.summary, ctx);
    }
    if (j === L.chapters.length - 1 && LEVELS[li + 1] && L.units) {
      const N = LEVELS[li + 1];
      md = md.replace(/\s+$/, '') + `\n\n[[link:level/${N.id}|➡️ 下一個 Level：${N.code} ${N.title}]]\n`;
    }
    c.md = md;
  }));

  /* ---------- 測驗、清單 ---------- */
  const QLV = {};
  LEVELS.forEach((L) => L.chapters.forEach((c) => { (c.md.match(/\[\[(?:quiz|check):[\w-]+\]\]/g) || []).forEach((m) => { const k = m.slice(m.indexOf(':') + 1, -2); if (!QLV[k]) QLV[k] = L.id; }); }));
  const prefixOf = (k) => k.split('-')[0];
  const quizLevel = (k) => QLV[k] || lvOf(prefixOf(k));
  [window.QUIZZES || {}, window.CHECKLISTS || {}].forEach((bag) => Object.keys(bag).forEach((k) => {
    const old = prefixOf(k); if (!OLDLV[old] || OLDLV[old].newRefs) return;
    deepFix(bag[k], { old, lv: quizLevel(k) });
  }));
  (window.GLOSSARY || []).forEach((g) => { if (g.lv) g.lv = lvOf(g.lv); });

  /* ---------- 匯出 ---------- */
  const chRef = (id) => { const c = CH2[id]; return c ? `${LV[c.newLevel].code} 第 ${c.num} 章` : ''; };
  const unitRef = (oldId) => { const u = unitOf(oldId); const L = LV[lvOf(oldId)]; return L ? L.code + (u && L.units.length > 1 ? '・' + u.title : '') : ''; };
  const unitHref = (oldId) => { const m = LEGACY[oldId]; return m ? `#/level/${m.lv}/u${m.unit}` : `#/level/${oldId}`; };
  window.COURSE.length = 0; LEVELS.forEach((l) => window.COURSE.push(l));
  window.CURRICULUM = { levels: LEVELS, legacy: LEGACY, lvOf, quizLevel, fixText, fixDeep: deepFix, chRef, unitRef, unitHref,
    finals: (lvId) => Object.keys(window.QUIZZES || {}).filter((k) => window.QUIZZES[k].final && quizLevel(k) === lvId) };
})();
