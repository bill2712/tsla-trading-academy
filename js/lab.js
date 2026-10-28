/* =========================================================
 * 🔬 真實數據回測實驗室
 * 逐支 5 分鐘 K 線模擬，唔睇未來數據：訊號用已收市 K 線、20 日線同 ATR20 用昨日或之前數據。
 * 入場：Stop 單（突破訊號 K 高／低位）；出場：Stop 先判（保守）、Target、收市平倉。
 * ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const F = (n, d = 2) => (n == null || !isFinite(n) ? '—' : Number(n).toFixed(d));
  const R = (n, d = 2) => (n == null || !isFinite(n) ? '—' : (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) + 'R');
  const P = (n, d = 0) => (n == null || !isFinite(n) ? '—' : (n * 100).toFixed(d) + '%');
  const today = () => new Date().toISOString().slice(0, 10);
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

  const STRATS = {
    orb: { name: '開市區間突破（ORB）', desc: '頭 15 分鐘高低位；收市突破後，升穿／跌穿訊號 K 線入場。Stop：區間中位。' },
    pdh: { name: '昨日高位突破 + 回測', desc: 'Long：收市突破 PDH → 回測 PDH 守住 → 升穿回測 K 高位入場。Short：PDL 相反。Stop：回測低位下方。' },
    vcp: { name: '日內 VCP 突破（只做 Long）', desc: '回望最近 3 段（每段 N 支 5 分鐘 K）：波幅逐段收縮（每段 ≤ 上一段 × 收縮比例）、低位唔低過上一段、最後一段平均量 ≤ 第一段 × 量縮比例、價格喺上升 VWAP 上方、整理喺今日高位附近。升穿最後一段高位（Pivot）入場；Stop：最後一段低位下方。' },
    vwap: { name: 'VWAP 順勢回調', desc: 'Long：連續 6 支收喺上升 VWAP 上方，回調掂 VWAP 守住 → 升穿嗰支高位入場。Stop：回調低位下方。' },
  };
  const DEFAULTS = { sym: 'TSLA', start: daysAgo(365), end: today(), strat: 'pdh', dir: 'long', orMins: 15, trend20: 'off', rvolMin: 0, tStart: '09:45', tEnd: '11:30', maxPerDay: 1, exit: 'R', rMult: 2, atrStop: 0.1, atrTgt: 0.2, buffer: 0.05, slip: 0.02, comm: 0.005, split: 0.7, vcpSeg: 4, vcpRatio: 0.75, vcpVol: 0.8 };

  /* ---------------- 統計 ---------------- */
  function stats(rs) {
    const n = rs.length;
    if (!n) return { n: 0 };
    const w = rs.filter((r) => r > 0), l = rs.filter((r) => r <= 0);
    const total = rs.reduce((a, b) => a + b, 0), exp = total / n;
    const sd = n > 1 ? Math.sqrt(rs.reduce((a, r) => a + (r - exp) ** 2, 0) / (n - 1)) : 0;
    const se = sd / Math.sqrt(n);
    let eq = 0, pk = 0, mdd = 0, st = 0, mst = 0;
    rs.forEach((r) => { eq += r; pk = Math.max(pk, eq); mdd = Math.max(mdd, pk - eq); st = r <= 0 ? st + 1 : 0; mst = Math.max(mst, st); });
    const gw = w.reduce((a, b) => a + b, 0), gl = -l.reduce((a, b) => a + b, 0);
    // bootstrap：期望值 > 0 嘅機率
    let pos = 0; const B = Math.min(1000, Math.max(200, 20000 / Math.max(n, 1) | 0));
    let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let b = 0; b < B; b++) { let s = 0; for (let i = 0; i < n; i++) s += rs[(rnd() * n) | 0]; if (s > 0) pos++; }
    return { n, wr: w.length / n, avgW: w.length ? gw / w.length : 0, avgL: l.length ? gl / l.length : 0, exp, sd, se, ciLo: exp - 1.96 * se, ciHi: exp + 1.96 * se, pf: gl ? gw / gl : (gw ? Infinity : 0), total, mdd, mst, pPos: pos / B, need: exp > 0 && sd > 0 ? Math.ceil((1.96 * sd / exp) ** 2) : null };
  }
  function verdict(all, oos) {
    if (!all || all.n === 0) return { tone: 'bad', text: '冇交易：條件太嚴，或者數據範圍太短。' };
    if (all.n < 30) return { tone: 'mid', text: `只有 ${all.n} 筆交易，樣本太少（少於 30），任何結論都唔可靠。擴大日期範圍或者放寬條件再試。` };
    if (oos && oos.n >= 10 && oos.exp <= 0) return { tone: 'bad', text: `樣本外（後段）期望值 ${R(oos.exp)} ≤ 0：前段好睇但後段唔work，好可能係「調出嚟」嘅結果，冇證據有優勢。` };
    if (all.ciLo <= 0) return { tone: 'mid', text: `期望值 ${R(all.exp)}，但 95% 可信範圍包括 0（${R(all.ciLo)} 至 ${R(all.ciHi)}）：未有統計證據證明有優勢${all.need ? `，大約要 ${all.need} 筆先夠判斷` : ''}。` };
    return { tone: 'good', text: `計埋成本期望值 ${R(all.exp)}，95% 可信範圍 ${R(all.ciLo)} 至 ${R(all.ciHi)} 都大過 0，樣本外亦正數：有初步證據。下一步唔係即刻真錢，而係 Paper／前瞻測試同小注 Micro 真倉。` };
  }

  /* ---------------- 回測引擎 ---------------- */
  function clean(S) {
    const o = Object.assign({}, S);
    Object.keys(DEFAULTS).forEach((k) => { if (typeof DEFAULTS[k] === 'number' && !isFinite(+o[k])) o[k] = DEFAULTS[k]; });
    o.maxPerDay = Math.max(1, Math.min(10, Math.round(o.maxPerDay)));
    o.split = Math.min(0.95, Math.max(0.05, o.split));
    o.rMult = Math.max(0.1, o.rMult); o.atrStop = Math.max(0.005, o.atrStop); o.atrTgt = Math.max(0.005, o.atrTgt);
    o.slip = Math.max(0, o.slip); o.comm = Math.max(0, o.comm); o.buffer = Math.max(0, o.buffer); o.orMins = Math.max(5, o.orMins);
    o.vcpSeg = Math.max(2, Math.min(12, Math.round(o.vcpSeg))); o.vcpRatio = Math.min(1, Math.max(0.1, o.vcpRatio)); o.vcpVol = Math.min(2, Math.max(0.1, o.vcpVol));
    return o;
  }
  function run(sessions, S) {
    S = clean(S);
    const trades = [];
    const tS = S.tStart, tE = S.tEnd, orN = Math.max(1, Math.round(S.orMins / 5));
    sessions.forEach((s, si) => {
      const bars = s.bars; if (bars.length < 10) return;
      const up = s.sma20 != null && s.pc != null ? (s.pc > s.sma20 && (s.sma20Prev == null || s.sma20 >= s.sma20Prev)) : null;
      const dn = s.sma20 != null && s.pc != null ? (s.pc < s.sma20 && (s.sma20Prev == null || s.sma20 <= s.sma20Prev)) : null;
      const allow = (side) => {
        if (S.dir !== 'both' && S.dir !== side) return false;
        if (S.trend20 === 'with') return side === 'long' ? up === true : dn === true;
        if (S.trend20 === 'against') return side === 'long' ? dn === true : up === true;
        return true;
      };
      if (S.exit === 'atr' && !s.atr20) return;
      let pv = 0, vv = 0; const vw = [];
      let orH = -Infinity, orL = Infinity;
      let brokeUp = -1, brokeDn = -1, pend = null, pos = null, count = 0, dayHi = -Infinity;
      const lastIdx = bars.length - 1;
      for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        const tp = (b.h + b.l + b.c) / 3; pv += tp * (b.v || 1); vv += (b.v || 1); vw[i] = pv / vv;
        // 1) 持倉出場
        if (pos && i > pos.i0) exitCheck(pos, b, i, false);
        // 2) 掛單入場
        if (!pos && pend) {
          if (i > pend.until) pend = null;
          else {
            const L = pend.side === 'long';
            const invalid = L ? b.o <= pend.stop : b.o >= pend.stop;
            const hit = L ? b.h >= pend.trig : b.l <= pend.trig;
            if (invalid) pend = null;
            else if (hit) {
              const fill = L ? Math.max(pend.trig, b.o) + S.slip : Math.min(pend.trig, b.o) - S.slip;
              let stop = pend.stop, target;
              if (S.exit === 'atr') { stop = L ? fill - S.atrStop * s.atr20 : fill + S.atrStop * s.atr20; target = L ? fill + S.atrTgt * s.atr20 : fill - S.atrTgt * s.atr20; }
              const risk = L ? fill - stop : stop - fill;
              if (risk > 0.01) {
                if (S.exit !== 'atr') target = L ? fill + S.rMult * risk : fill - S.rMult * risk;
                pos = { side: pend.side, i0: i, entry: fill, stop, target, risk, time: b.t, rvol: pend.rvol, sig: pend.sig, hi: b.h, lo: b.l };
                count++;
                exitCheck(pos, b, i, true);
              }
              pend = null;
            }
          }
        }
        // 3) 收市平倉
        if (pos && i === lastIdx) closePos(pos, pos.side === 'long' ? b.c - S.slip : b.c + S.slip, i, '收市');
        // 4) 收市後計訊號（只用已完成 K 線）
        dayHi = Math.max(dayHi, b.h);
        if (s.pdh != null && brokeUp < 0 && b.c > s.pdh) brokeUp = i;
        if (s.pdl != null && brokeDn < 0 && b.c < s.pdl) brokeDn = i;
        if (i < orN) { orH = Math.max(orH, b.h); orL = Math.min(orL, b.l); continue; }
        if (pos || pend || count >= S.maxPerDay || i >= lastIdx - 1) continue;
        if (b.t < tS || b.t > tE) continue;
        const rvol = s.avgCum && s.avgCum[b.slot] ? s.cum[b.slot] / s.avgCum[b.slot] : null;
        if (S.rvolMin > 0 && !(rvol >= S.rvolMin)) continue;
        const prev = bars[i - 1];
        let sig = null;
        if (S.strat === 'orb') {
          const mid = (orH + orL) / 2;
          if (b.c > orH && prev.c <= orH && allow('long')) sig = { side: 'long', trig: b.h + 0.01, stop: mid };
          else if (b.c < orL && prev.c >= orL && allow('short')) sig = { side: 'short', trig: b.l - 0.01, stop: mid };
        } else if (S.strat === 'pdh') {
          if (s.pdh == null) continue;
          const tol = b.c * 0.001;
          if (brokeUp >= 0 && i > brokeUp && i - brokeUp <= 8 && b.l <= s.pdh + tol && b.c > s.pdh && allow('long')) sig = { side: 'long', trig: b.h + 0.01, stop: Math.min(b.l, s.pdh) - S.buffer };
          else if (brokeDn >= 0 && i > brokeDn && i - brokeDn <= 8 && b.h >= s.pdl - tol && b.c < s.pdl && allow('short')) sig = { side: 'short', trig: b.l - 0.01, stop: Math.max(b.h, s.pdl) + S.buffer };
        } else if (S.strat === 'vcp') {
          const n = S.vcpSeg, a0 = i - 3 * n + 1;
          if (a0 < 0) continue;
          // r = 呢段入面由最高位回落嘅最大幅度（回調深度），唔係成段高低差，咁先唔會將上升段當成收縮
          const seg = (k) => { let h = -Infinity, l = Infinity, v = 0, r = 0; for (let j = a0 + k * n; j < a0 + (k + 1) * n; j++) { h = Math.max(h, bars[j].h); l = Math.min(l, bars[j].l); r = Math.max(r, h - bars[j].l); v += bars[j].v || 0; } return { h, l, r, v: v / n }; };
          const s1 = seg(0), s2 = seg(1), s3 = seg(2);
          const top = Math.max(s1.h, s2.h, s3.h);
          const ok = s1.r > 0 && s2.r <= S.vcpRatio * s1.r && s3.r <= S.vcpRatio * s2.r && s2.l >= s1.l && s3.l >= s2.l
            && s1.v > 0 && s3.v <= S.vcpVol * s1.v && b.c > vw[i] && vw[i] >= vw[Math.max(0, i - n)]
            && top >= dayHi - 1e-9 && s3.h >= top - 0.5 * s1.r;
          if (ok && allow('long')) sig = { side: 'long', trig: s3.h + 0.01, stop: s3.l - S.buffer, until: i + n };
        } else if (S.strat === 'vwap') {
          if (i < 7) continue;
          let above = true, below = true;
          for (let k = i - 6; k < i; k++) { if (bars[k].c <= vw[k]) above = false; if (bars[k].c >= vw[k]) below = false; }
          if (above && vw[i] > vw[i - 6] && b.l <= vw[i] * 1.0005 && b.c > vw[i] && allow('long')) sig = { side: 'long', trig: b.h + 0.01, stop: Math.min(b.l, vw[i]) - S.buffer };
          else if (below && vw[i] < vw[i - 6] && b.h >= vw[i] * 0.9995 && b.c < vw[i] && allow('short')) sig = { side: 'short', trig: b.l - 0.01, stop: Math.max(b.h, vw[i]) + S.buffer };
        }
        if (sig) pend = Object.assign({ until: i + 2 }, sig, { rvol, sig: b.t });
      }
      function exitCheck(p, b, i, first) {
        const L = p.side === 'long';
        p.hi = Math.max(p.hi, b.h); p.lo = Math.min(p.lo, b.l);
        if (!first && (L ? b.o <= p.stop : b.o >= p.stop)) return closePos(p, L ? b.o - S.slip : b.o + S.slip, i, '跳空穿 Stop');
        if (L ? b.l <= p.stop : b.h >= p.stop) return closePos(p, L ? p.stop - S.slip : p.stop + S.slip, i, '止蝕');
        if (L ? b.h >= p.target : b.l <= p.target) return closePos(p, first ? p.target : (L ? Math.max(p.target, b.o) : Math.min(p.target, b.o)), i, '到 Target');
      }
      function closePos(p, px, i, why) {
        const d = p.side === 'long' ? 1 : -1;
        const gross = (px - p.entry) * d;
        const rNet = (gross - 2 * S.comm) / p.risk;
        trades.push({ date: s.date, si, time: p.time, sig: p.sig, side: p.side, entry: p.entry, stop: p.stop, target: p.target, exit: px, exitTime: bars[i].t, why, r: rNet, rGross: gross / p.risk, mfe: ((p.side === 'long' ? p.hi - p.entry : p.entry - p.lo)) / p.risk, mae: ((p.side === 'long' ? p.entry - p.lo : p.hi - p.entry)) / p.risk, rvol: p.rvol, trend: up ? 'up' : dn ? 'down' : 'flat' });
        pos = null;
      }
    });
    return trades;
  }
  function analyse(sessions, S) {
    S = clean(S);
    const trades = run(sessions, S);
    const cut = Math.floor(sessions.length * S.split);
    const isT = trades.filter((t) => t.si < cut), oosT = trades.filter((t) => t.si >= cut);
    return { trades, cutDate: sessions[cut] ? sessions[cut].date : null, all: stats(trades.map((t) => t.r)), is: stats(isT.map((t) => t.r)), oos: stats(oosT.map((t) => t.r)) };
  }
  const settingsHash = (S) => { const k = Object.keys(DEFAULTS).filter((x) => !x.startsWith('vcp') || S.strat === 'vcp').sort(); const str = JSON.stringify(k.map((x) => [x, S[x]])); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  function describe(S) {
    const st = STRATS[S.strat] ? STRATS[S.strat].name : S.strat;
    const dir = { long: '只做 Long', short: '只做 Short', both: 'Long + Short' }[S.dir];
    const tr = { off: '唔用 20 日線', with: '只順 20 日線方向', against: '只逆 20 日線方向（對照組）' }[S.trend20];
    const ex = S.exit === 'atr' ? `Stop ${S.atrStop}×ATR20、Target ${S.atrTgt}×ATR20` : `Stop 結構位、Target ${S.rMult}R`;
    return `${S.sym}｜${S.start} 至 ${S.end}｜${st}｜${dir}｜${tr}｜${S.tStart}–${S.tEnd}${S.rvolMin ? '｜RVOL ≥ ' + S.rvolMin : ''}｜${ex}｜每日最多 ${S.maxPerDay} 筆${S.strat === 'vcp' ? `｜VCP：每段 ${S.vcpSeg} 支、收縮 ≤ ${S.vcpRatio}、量縮 ≤ ${S.vcpVol}` : ''}｜滑價 $${S.slip}、佣金 $${S.comm}／股／邊`;
  }

  /* ---------------- 頁面 ---------------- */
  function statRow(label, st) {
    if (!st || !st.n) return `<tr><th>${label}</th><td colspan="8" class="muted">冇交易</td></tr>`;
    return `<tr><th>${label}</th><td>${st.n}</td><td>${P(st.wr)}</td><td><b class="${st.exp >= 0 ? 'pos' : 'neg'}">${R(st.exp)}</b></td><td>${R(st.ciLo)} ~ ${R(st.ciHi)}</td><td>${P(st.pPos)}</td><td>${st.pf === Infinity ? '∞' : F(st.pf)}</td><td>${R(st.total, 1)}</td><td>${F(st.mdd, 1)}R</td></tr>`;
  }
  const STAT_HEAD = '<tr><th></th><th>筆數</th><th>勝率</th><th>期望值</th><th>95% 可信範圍</th><th>期望值&gt;0 機率</th><th>PF</th><th>總 R</th><th>最大回撤</th></tr>';
  function groupTable(trades, keyFn, title) {
    const m = {}; trades.forEach((t) => { const k = keyFn(t); (m[k] = m[k] || []).push(t.r); });
    const rows = Object.keys(m).sort().map((k) => { const st = stats(m[k]); return `<tr><th>${esc(k)}</th><td>${st.n}</td><td>${P(st.wr)}</td><td class="${st.exp >= 0 ? 'pos' : 'neg'}">${R(st.exp)}</td><td>${R(st.total, 1)}</td></tr>`; }).join('');
    return `<h4>${title}</h4><div class="tbl-scroll"><table class="mini-tbl wide"><tr><th></th><th>筆數</th><th>勝率</th><th>期望值</th><th>總 R</th></tr>${rows}</table></div>`;
  }

  function render(view, researchId) {
    const u = Store.user();
    const research = researchId ? Store.research().find((r) => r.id === researchId) : null;
    const S = Object.assign({}, DEFAULTS, (u.toolState.lab || {}), research ? research.settings : {});
    const locked = !!research;
    const md = MarketData.last;
    const sel = (k, opts) => `<select data-k="${k}" ${locked ? 'disabled' : ''}>${opts.map(([v, t]) => `<option value="${v}" ${String(S[k]) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    const num = (k, step) => `<input type="number" step="${step}" data-k="${k}" value="${S[k]}" ${locked ? 'disabled' : ''}>`;
    const txt = (k, type) => `<input type="${type || 'text'}" data-k="${k}" value="${esc(S[k])}" ${locked ? 'disabled' : ''}>`;
    view.innerHTML = `<div class="page-head"><h1>🔬 真實數據回測實驗室</h1><p class="muted">用真實歷史 5 分鐘 K 線測試規則。訊號只用已收市嘅 K 線，20 日線同 ATR20 只用昨日或之前嘅數據；計埋滑價同佣金。<b>過去有效唔保證將來有效</b>，但過去都冇效嘅方法，就唔值得用真錢試。</p></div>
      ${research ? `<div class="card lab-locked">🔒 <b>研究模式：</b>「${esc(research.title)}」（${esc(research.name)} 登記）—— 設定已經鎖定，唔可以改，確保冇「事後調參數」。<a href="#/lab">離開研究模式</a></div>` : ''}
      <div class="card"><div class="card-h">① 數據</div>
        <div class="tool-grid"><label class="fld"><span>代號（美股，或者 BTC-USD）</span>${txt('sym')}</label><label class="fld"><span>開始日期</span>${txt('start', 'date')}</label><label class="fld"><span>結束日期</span>${txt('end', 'date')}</label></div>
        <div class="tool-foot"><button class="btn primary" data-load>⬇️ 載入數據</button><span class="muted" data-mdinfo>${md ? `已載入 ${esc(md.sym)}：${md.sessions.length} 個交易日（${md.sessions[0] ? md.sessions[0].date : ''} 至 ${md.sessions.length ? md.sessions[md.sessions.length - 1].date : ''}）・來源 ${md.src === 'alpaca' ? 'Alpaca ' + (md.feed || '').toUpperCase() : 'Binance'}` : '未載入。第一次會由 Alpaca 下載，之後存喺呢部機。'}</span></div></div>
      <div class="card"><div class="card-h">② 規則</div>
        <div class="tool-grid">
          <label class="fld"><span>策略</span>${sel('strat', Object.entries(STRATS).map(([k, v]) => [k, v.name]))}</label>
          <label class="fld"><span>方向</span>${sel('dir', [['long', '只做 Long'], ['short', '只做 Short'], ['both', 'Long + Short']])}</label>
          <label class="fld"><span>20 日線篩選</span>${sel('trend20', [['off', '唔用'], ['with', '只順 20 日線方向'], ['against', '只逆方向（對照組）']])}</label>
          <label class="fld"><span>最低 RVOL（0 = 唔用）</span>${num('rvolMin', 0.1)}</label>
          <label class="fld"><span>最早訊號時間（美東）</span>${txt('tStart', 'time')}</label>
          <label class="fld"><span>最遲訊號時間（美東）</span>${txt('tEnd', 'time')}</label>
          <label class="fld"><span>每日最多交易</span>${num('maxPerDay', 1)}</label>
          <label class="fld"><span>出場方式</span>${sel('exit', [['R', '結構 Stop + 固定 R 目標'], ['atr', '用 20 日平均波幅（ATR20）']])}</label>
          <label class="fld" data-show="R"><span>目標（R 倍數）</span>${num('rMult', 0.5)}</label>
          <label class="fld" data-show="atr"><span>Stop（ATR20 嘅幾多倍）</span>${num('atrStop', 0.01)}</label>
          <label class="fld" data-show="atr"><span>Target（ATR20 嘅幾多倍）</span>${num('atrTgt', 0.01)}</label>
          <label class="fld" data-sv><span>VCP：每段幾多支 5 分鐘 K</span>${num('vcpSeg', 1)}</label>
          <label class="fld" data-sv><span>VCP：收縮比例上限（0.75 = 每段 ≤ 上一段 75%）</span>${num('vcpRatio', 0.05)}</label>
          <label class="fld" data-sv><span>VCP：量縮比例上限（最後段量 ÷ 第一段量）</span>${num('vcpVol', 0.05)}</label>
          <label class="fld"><span>Stop 緩衝（$）</span>${num('buffer', 0.01)}</label>
          <label class="fld"><span>滑價（$／股／每邊）</span>${num('slip', 0.01)}</label>
          <label class="fld"><span>佣金（$／股／每邊）</span>${num('comm', 0.001)}</label>
          <label class="fld"><span>前段（調規則）比例</span>${num('split', 0.05)}</label>
        </div>
        <p class="tool-fine" data-sdesc>${esc((STRATS[S.strat] || {}).desc || '')}</p>
        <div class="tool-foot"><button class="btn primary" data-run>▶ 回測</button>${locked ? '' : '<button class="btn" data-ab>⚖️ 比較：加 vs 唔加 20 日線</button><button class="btn ghost" data-reg>📌 登記成研究假設</button>'}<button class="btn ghost" data-reset ${locked ? 'hidden' : ''}>↺ 預設</button></div></div>
      <div data-out></div>`;
    const form = view;
    const showExit = () => $$('[data-show]', form).forEach((x) => (x.hidden = x.dataset.show !== S.exit));
    showExit();
    const showStrat = () => $$('[data-sv]', form).forEach((x) => (x.hidden = S.strat !== 'vcp'));
    showStrat();
    $$('[data-k]', form).forEach((i) => i.addEventListener('input', () => {
      const k = i.dataset.k;
      if (typeof DEFAULTS[k] === 'number') { const v = parseFloat(i.value); i.classList.toggle('bad', !isFinite(v)); if (!isFinite(v)) return; S[k] = v; }
      else { if ((k === 'start' || k === 'end') && !/^\d{4}-\d{2}-\d{2}$/.test(i.value)) return; S[k] = i.value; }
      if (k === 'sym') S.sym = i.value.trim().toUpperCase();
      if (k === 'exit') showExit();
      if (k === 'strat') { $('[data-sdesc]', form).textContent = STRATS[S.strat].desc; showStrat(); }
      if (!locked) { u.toolState.lab = Object.assign({}, S); Store.save(); }
    }));
    const out = $('[data-out]', view);
    const need = async () => {
      const m = MarketData.last;
      if (m && m.sym === S.sym && m.startDate === S.start && m.endDate === S.end) return m;
      return load();
    };
    const load = async () => {
      const info = $('[data-mdinfo]', view);
      info.textContent = '下載緊…';
      try {
        const m = await MarketData.load(S.sym, S.start, S.end, (d, n, mon) => { info.textContent = `下載緊 ${mon}（${d}/${n} 個月）…`; });
        info.textContent = `已載入 ${m.sym}：${m.sessions.length} 個交易日・來源 ${m.src === 'alpaca' ? 'Alpaca ' + (m.feed || '').toUpperCase() : 'Binance'}`;
        return m;
      } catch (e) {
        info.innerHTML = `<span class="neg">${esc(e.message)}</span>${/金鑰/.test(e.message) ? ' <a href="#/settings">去設定 →</a>' : ''}`;
        throw e;
      }
    };
    $('[data-load]', view).addEventListener('click', () => load().catch(() => {}));
    $('[data-run]', view).addEventListener('click', async () => {
      let m; try { m = await need(); } catch (e) { return; }
      out.innerHTML = '<p class="muted">計緊…</p>';
      setTimeout(() => showResult(out, m, S, research), 20);
    });
    const ab = $('[data-ab]', view);
    if (ab) ab.addEventListener('click', async () => {
      let m; try { m = await need(); } catch (e) { return; }
      out.innerHTML = '<p class="muted">計緊…</p>';
      setTimeout(() => {
        const a = analyse(m.sessions, Object.assign({}, S, { trend20: 'off' }));
        const b = analyse(m.sessions, Object.assign({}, S, { trend20: 'with' }));
        const c = analyse(m.sessions, Object.assign({}, S, { trend20: 'against' }));
        const better = b.all.n >= 30 && a.all.n >= 30 && b.oos.n >= 10 && b.oos.exp > a.oos.exp && b.all.exp > a.all.exp;
        out.innerHTML = `<div class="card"><div class="card-h">⚖️ 20 日線篩選有冇幫助？</div><p class="tool-fine">${esc(describe(S))}</p>
          <div class="tbl-scroll"><table class="mini-tbl wide">${STAT_HEAD}${statRow('唔用 20 日線', a.all)}${statRow('只順 20 日線', b.all)}${statRow('只逆 20 日線（對照）', c.all)}</table></div>
          <h4>只睇樣本外（${esc(a.cutDate || '')} 之後）</h4>
          <div class="tbl-scroll"><table class="mini-tbl wide">${STAT_HEAD}${statRow('唔用', a.oos)}${statRow('順 20 日線', b.oos)}${statRow('逆 20 日線', c.oos)}</table></div>
          <div class="verdict ${better ? 'ok' : 'mid'}">${better ? `順 20 日線嘅版本，全期同樣本外期望值都高過唔用（${R(a.all.exp)} → ${R(b.all.exp)}）。值得登記成研究假設，喺其他時間段同其他股票再驗證。` : `今次數據入面，20 日線篩選冇清楚改善（全期 ${R(a.all.exp)} vs ${R(b.all.exp)}；樣本外 ${R(a.oos.exp)} vs ${R(b.oos.exp)}）。篩選會減少交易數目，樣本少咗結論更不穩定。`}</div>
          <p class="tool-fine">「逆 20 日線」係對照組：如果佢同「順」差唔多，代表 20 日線方向對呢個策略冇乜影響。</p></div>`;
      }, 20);
    });
    const reg = $('[data-reg]', view);
    if (reg) reg.addEventListener('click', () => registerModal(S));
    const rs = $('[data-reset]', view);
    if (rs) rs.addEventListener('click', () => { u.toolState.lab = Object.assign({}, DEFAULTS); Store.save(); render(view); });
  }

  function showResult(out, m, S, research) {
    const res = analyse(m.sessions, S);
    const v = verdict(res.all, res.oos);
    const t = res.trades;
    const u = Store.user();
    u.toolState.labLast = { at: Date.now(), desc: describe(S), sym: S.sym, all: res.all, is: res.is, oos: res.oos, rs: t.map((x) => +x.r.toFixed(3)).slice(-2000) };
    Store.save();
    let eq = 0; const curve = [0]; t.forEach((x) => { eq += x.r; curve.push(+eq.toFixed(2)); });
    const step = Math.max(1, Math.ceil(curve.length / 150));
    const pts = curve.filter((_, i) => i % step === 0 || i === curve.length - 1);
    const cutI = t.findIndex((x) => res.cutDate && x.date >= res.cutDate);
    const mine = research && research.author === Store.db.active;
    out.innerHTML = `<div class="card"><div class="card-h">③ 結果</div><p class="tool-fine">${esc(describe(S))}｜交易日 ${m.sessions.length} 日；前段至 ${esc(res.cutDate || '—')} 之前</p>
      <div class="tbl-scroll"><table class="mini-tbl wide">${STAT_HEAD}${statRow('全期', res.all)}${statRow('前段（調規則）', res.is)}${statRow('後段（樣本外驗證）', res.oos)}</table></div>
      <div class="verdict ${v.tone === 'good' ? 'ok' : v.tone === 'bad' ? 'bad' : 'mid'}">${esc(v.text)}</div>
      <div data-eq></div>
      ${res.all.n ? `<div class="lab-grid">${groupTable(t, (x) => x.date.slice(0, 4), '按年份')}${groupTable(t, (x) => x.time.slice(0, 2) + ':00', '按入場時間（美東）')}${groupTable(t, (x) => ({ up: '20 日線向上', down: '20 日線向下', flat: '其他' }[x.trend]), '按當日 20 日線方向')}${groupTable(t, (x) => x.why, '按出場原因')}</div>` : ''}
      <div class="tool-foot">${research ? (mine ? '<button class="btn primary" data-attach>📎 將結果附加到研究</button>' : '<span class="muted">只有登記人可以附加結果；你可以喺研究板留言講你嘅重現結果。</span>') : ''}<a class="btn ghost" href="#/edge">📊 睇 Edge 報告卡</a></div>
      <h4>交易明細（最近 ${Math.min(200, t.length)} 筆，撳日期可以喺模擬器重播嗰日）</h4>
      <div class="tbl-scroll"><table class="mini-tbl wide"><tr><th>日期</th><th>方向</th><th>入場</th><th>Entry</th><th>Stop</th><th>Target</th><th>出場</th><th>原因</th><th>R</th></tr>${t.slice(-200).reverse().map((x) => `<tr><td><a href="#/sim/real/${encodeURIComponent(m.sym)}/${x.date}">${x.date}</a></td><td>${x.side === 'long' ? '▲ Long' : '▼ Short'}</td><td>${x.time}</td><td>${F(x.entry)}</td><td>${F(x.stop)}</td><td>${F(x.target)}</td><td>${x.exitTime} @ ${F(x.exit)}</td><td>${esc(x.why)}</td><td class="${x.r >= 0 ? 'pos' : 'neg'}">${R(x.r)}</td></tr>`).join('')}</table></div></div>`;
    if (pts.length > 1) Charts.line($('[data-eq]', out), { series: [{ name: '累積 R', data: pts, color: 'var(--accent)' }], labels: pts.map((_, i) => (i === 0 ? '0' : String(Math.min(t.length, i * step)))), height: 220, format: (x) => (x >= 0 ? '+' : '') + x.toFixed(0) + 'R', title: '累積結果（R，已扣成本）', caption: cutI > 0 ? `第 ${cutI} 筆之後係樣本外（${res.cutDate} 起）。` : '' });
    const at = $('[data-attach]', out);
    if (at) at.addEventListener('click', () => {
      const r = Store.research().find((x) => x.id === research.id); if (!r) return;
      const pack = (st) => (st && st.n ? { n: st.n, wr: st.wr, exp: st.exp, ciLo: st.ciLo, ciHi: st.ciHi, pPos: st.pPos, total: st.total, mdd: st.mdd } : { n: 0 });
      const results = (r.results || []).concat([{ at: Date.now(), by: Store.activeProfile().name, sym: S.sym, sessions: m.sessions.length, feed: m.feed, all: pack(res.all), is: pack(res.is), oos: pack(res.oos), verdict: v.text }]);
      Store.updateResearch(r.id, { results, status: 'tested' });
      App.toast('已附加結果 📎'); location.hash = '#/research/' + r.id;
    });
  }

  function registerModal(S) {
    App.modal(`<h3>📌 登記研究假設</h3><p class="muted">登記之後規則會<b>鎖定</b>，唔可以再改。咁先可以避免「試到啱為止」。要改就登記一個新版本。</p>
      <label class="fld wide"><span>假設（一句講晒）</span><input data-t placeholder="例如：TSLA 昨日高位突破回測，只順 20 日線方向，期望值會高過唔篩選"></label>
      <label class="fld wide"><span>點解你覺得會 work？</span><textarea rows="2" data-why placeholder="例如：Alex 話佢用 20 日線決定方向"></textarea></label>
      <label class="fld wide"><span>點樣先算成功？（事前寫低）</span><textarea rows="2" data-ok placeholder="例如：樣本外期望值 ≥ +0.1R，而且交易數 ≥ 50"></textarea></label>
      <p class="tool-fine">${esc(describe(S))}</p>
      <div class="modal-actions"><button class="btn primary" data-save>登記並鎖定</button></div>`, (box, close) => {
      box.querySelector('[data-save]').addEventListener('click', () => {
        const title = box.querySelector('[data-t]').value.trim(); if (!title) { App.toast('寫低假設先'); return; }
        const settings = Object.assign({}, S);
        const r = Store.addResearch({ title, why: box.querySelector('[data-why]').value.trim(), success: box.querySelector('[data-ok]').value.trim(), settings, hash: settingsHash(settings), desc: describe(settings), status: 'registered' });
        close(); App.toast('已登記 🔒'); location.hash = '#/research/' + r.id;
      });
    });
  }

  window.Lab = { render, run, analyse, stats, verdict, describe, settingsHash, STRATS, DEFAULTS };
})();
