/* Level 15：頭 2 小時做多 —— 專攻日線升勢股（09:30–11:30，Long only） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const L = window.SetupLab;
  if (!L) { console.warn('Level 15 需要先載入 Level 14'); return; }
  const { SET, hiOf, loOf, emaOf, esc } = L;

  /* 真實統計（scripts/research/long-am-stats.mjs 用 Alpaca 5 分鐘 K 線計，只係統計數字） */
  const STATS = {"from":"2024-01-01","to":"2026-11-06","universe":["TSLA","NVDA","AAPL","AMD","META","AMZN","MSFT","GOOGL","AVGO","NFLX","PLTR","COIN","MU","SMCI","MSTR","HOOD","ARM","INTC","ORCL","CRM","ADBE","SHOP","UBER","ABNB","SNOW","CRWD","PANW","NET","DDOG","MRVL","QCOM","LRCX","AMAT","ROKU","PYPL","RIVN","SOFI","AFRM","UPST","BABA","PDD","DIS","BA","NKE","SBUX","LLY","UNH","CVNA","DKNG","RBLX"],"source":"Alpaca SIP 5 分鐘 K 線（正常交易時段）","daysAll":33118,"daysInPlay":7132,"trendDays":{"up":2207,"mixed":2879,"down":2046},"rules":{"inPlay":"Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍","trend":"升勢 = 昨日收市 > 20 日線 > 50 日線；跌勢 = 昨日收市 < 20 日線 < 50 日線；其餘 = 橫行","nearHigh":"昨日收市喺 20 日高位 5% 之內","exit":"Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉。同一支 K 掂 Stop 同 Target 當 Stop","cost":"扣成本後 = 平均 R 減 0.05R","qqq":"入場前一支 5 分鐘 K 收市時，QQQ 喺自己 VWAP 上面（冇偷睇之後嘅價）","ema9":"5 分鐘 EMA 9 只用正常時段 K 線計（冇包盤前）"},"setups":{"orb5":{"name":"5 分鐘 ORB 做多","all":{"n":2350,"win":44.8,"target":12.8,"stop":40.5,"avgR":0.02,"avgRCost":-0.03,"avgREod":0.03},"up":{"n":666,"win":42.2,"target":12.8,"stop":43.8,"avgR":-0.03,"avgRCost":-0.08,"avgREod":-0.02},"best":{"n":278,"win":50.7,"target":10.4,"stop":38.5,"avgR":0.07,"avgRCost":0.02,"avgREod":0.16},"upBest":{"n":85,"win":40,"target":10.6,"stop":48.2,"avgR":-0.08,"avgRCost":-0.13,"avgREod":-0.01},"notUpBest":{"n":193,"win":55.4,"target":10.4,"stop":34.2,"avgR":0.13,"avgRCost":0.08,"avgREod":0.24},"upGapUp":{"n":303,"win":39.3,"target":14.5,"stop":48.8,"avgR":-0.05,"avgRCost":-0.1,"avgREod":0.02},"upGapDown":{"n":288,"win":45.5,"target":11.8,"stop":38.5,"avgR":0.01,"avgRCost":-0.04,"avgREod":-0.05}},"orb15":{"name":"15 分鐘 ORB 做多","all":{"n":2486,"win":50,"target":4.5,"stop":19.5,"avgR":0.03,"avgRCost":-0.02,"avgREod":0.04},"up":{"n":709,"win":48.2,"target":3.5,"stop":20.9,"avgR":-0.01,"avgRCost":-0.06,"avgREod":-0.03},"best":{"n":412,"win":51.9,"target":4.9,"stop":17,"avgR":0.06,"avgRCost":0.01,"avgREod":0.12},"upBest":{"n":109,"win":52.3,"target":3.7,"stop":20.2,"avgR":0.03,"avgRCost":-0.02,"avgREod":0.06},"notUpBest":{"n":303,"win":51.8,"target":5.3,"stop":15.8,"avgR":0.07,"avgRCost":0.02,"avgREod":0.14},"upGapUp":{"n":329,"win":45.6,"target":4.3,"stop":24.6,"avgR":-0.02,"avgRCost":-0.07,"avgREod":0.01},"upGapDown":{"n":297,"win":49.8,"target":3,"stop":17.5,"avgR":-0.02,"avgRCost":-0.07,"avgREod":-0.08}},"orb30":{"name":"30 分鐘 ORB 做多","all":{"n":1926,"win":50.7,"target":1.3,"stop":8.7,"avgR":0.02,"avgRCost":-0.03,"avgREod":0.02},"up":{"n":513,"win":50.5,"target":0.8,"stop":9.4,"avgR":0,"avgRCost":-0.05,"avgREod":-0.05},"best":{"n":296,"win":51.7,"target":2.4,"stop":6.1,"avgR":0.05,"avgRCost":0,"avgREod":0.13},"upBest":{"n":73,"win":61.6,"target":2.7,"stop":6.8,"avgR":0.14,"avgRCost":0.09,"avgREod":0.11},"notUpBest":{"n":223,"win":48.4,"target":2.2,"stop":5.8,"avgR":0.03,"avgRCost":-0.02,"avgREod":0.14},"upGapUp":{"n":244,"win":48.8,"target":0.4,"stop":11.9,"avgR":-0.02,"avgRCost":-0.07,"avgREod":-0.06},"upGapDown":{"n":215,"win":47.9,"target":0.9,"stop":7.9,"avgR":-0.02,"avgRCost":-0.07,"avgREod":-0.08}},"flag":{"name":"開市推動後第一次回調（Bull Flag）","all":{"n":546,"win":41.6,"target":14.8,"stop":43.4,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.02},"up":{"n":191,"win":41.9,"target":18.3,"stop":47.1,"avgR":0.02,"avgRCost":-0.03,"avgREod":0.06},"best":{"n":141,"win":46.1,"target":22,"stop":37.6,"avgR":0.17,"avgRCost":0.12,"avgREod":0.22},"upBest":{"n":52,"win":44.2,"target":26.9,"stop":46.2,"avgR":0.15,"avgRCost":0.1,"avgREod":0.25},"notUpBest":{"n":89,"win":47.2,"target":19.1,"stop":32.6,"avgR":0.18,"avgRCost":0.13,"avgREod":0.2},"upGapUp":{"n":83,"win":49.4,"target":22.9,"stop":41,"avgR":0.21,"avgRCost":0.16,"avgREod":0.29},"upGapDown":{"n":72,"win":30.6,"target":12.5,"stop":54.2,"avgR":-0.25,"avgRCost":-0.3,"avgREod":-0.27}},"vwapPull":{"name":"VWAP 第一次回調","all":{"n":1003,"win":41.8,"target":10,"stop":39.6,"avgR":-0.04,"avgRCost":-0.09,"avgREod":0},"up":{"n":293,"win":41.3,"target":13.7,"stop":41.6,"avgR":-0.01,"avgRCost":-0.06,"avgREod":0.01},"best":{"n":194,"win":42.8,"target":12.4,"stop":39.2,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.06},"upBest":{"n":59,"win":42.4,"target":16.9,"stop":49.2,"avgR":0,"avgRCost":-0.05,"avgREod":0},"notUpBest":{"n":135,"win":43,"target":10.4,"stop":34.8,"avgR":0.02,"avgRCost":-0.03,"avgREod":0.09},"upGapUp":{"n":122,"win":42.6,"target":19.7,"stop":44.3,"avgR":0.07,"avgRCost":0.02,"avgREod":0.11},"upGapDown":{"n":125,"win":37.6,"target":7.2,"stop":39.2,"avgR":-0.14,"avgRCost":-0.19,"avgREod":-0.21}},"ema9Pull":{"name":"EMA 9 回調（強勢延續）","all":{"n":1878,"win":44.4,"target":10.9,"stop":38.4,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.03},"up":{"n":562,"win":42.9,"target":11.7,"stop":40.9,"avgR":-0.03,"avgRCost":-0.08,"avgREod":-0.03},"best":{"n":433,"win":49.4,"target":14.1,"stop":34.2,"avgR":0.11,"avgRCost":0.06,"avgREod":0.16},"upBest":{"n":143,"win":51.7,"target":18.2,"stop":34.3,"avgR":0.18,"avgRCost":0.13,"avgREod":0.32},"notUpBest":{"n":290,"win":48.3,"target":12.1,"stop":34.1,"avgR":0.07,"avgRCost":0.02,"avgREod":0.08},"upGapUp":{"n":256,"win":43,"target":12.9,"stop":39.5,"avgR":0.01,"avgRCost":-0.04,"avgREod":-0.05},"upGapDown":{"n":228,"win":41.2,"target":9.6,"stop":44.7,"avgR":-0.1,"avgRCost":-0.15,"avgREod":-0.08}},"pdhBreak":{"name":"升穿昨日高位（PDH Break）","all":{"n":675,"win":44,"target":20.7,"stop":28.3,"avgR":-0.13,"avgRCost":-0.18,"avgREod":-0.11},"up":{"n":237,"win":42.2,"target":22.4,"stop":33.3,"avgR":-0.19,"avgRCost":-0.24,"avgREod":-0.14},"best":{"n":141,"win":40.4,"target":27.7,"stop":26.2,"avgR":-0.17,"avgRCost":-0.22,"avgREod":-0.16},"upBest":{"n":56,"win":35.7,"target":33.9,"stop":30.4,"avgR":-0.2,"avgRCost":-0.25,"avgREod":-0.13},"notUpBest":{"n":85,"win":43.5,"target":23.5,"stop":23.5,"avgR":-0.15,"avgRCost":-0.2,"avgREod":-0.18},"upGapUp":{"n":129,"win":42.6,"target":24,"stop":34.1,"avgR":-0.14,"avgRCost":-0.19,"avgREod":-0.08},"upGapDown":{"n":28,"win":50,"target":0,"stop":25,"avgR":-0.01,"avgRCost":-0.06,"avgREod":-0.03}},"pdhRetest":{"name":"Gap 高開後回試昨日高位（PDH Retest）","all":{"n":430,"win":42.3,"target":10.9,"stop":39.8,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.02},"up":{"n":152,"win":41.4,"target":9.2,"stop":44.1,"avgR":-0.09,"avgRCost":-0.14,"avgREod":-0.03},"best":{"n":49,"win":38.8,"target":10.2,"stop":42.9,"avgR":-0.08,"avgRCost":-0.13,"avgREod":-0.03},"upBest":{"n":21,"win":38.1,"target":4.8,"stop":42.9,"avgR":-0.11,"avgRCost":-0.16,"avgREod":0.06},"notUpBest":{"n":28,"win":39.3,"target":14.3,"stop":42.9,"avgR":-0.06,"avgRCost":-0.11,"avgREod":-0.1},"upGapUp":{"n":134,"win":41,"target":10.4,"stop":44,"avgR":-0.08,"avgRCost":-0.13,"avgREod":0.01},"upGapDown":{"n":0}},"r2g":{"name":"Red-to-Green（升穿昨收）","all":{"n":325,"win":46.2,"target":2.2,"stop":10.2,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.04},"up":{"n":96,"win":44.8,"target":2.1,"stop":11.5,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.04},"best":{"n":16,"win":56.3,"target":6.3,"stop":12.5,"avgR":0.17,"avgRCost":0.12,"avgREod":0.17},"upBest":{"n":5,"win":60,"target":0,"stop":20,"avgR":0.23,"avgRCost":0.18,"avgREod":0.27},"notUpBest":{"n":11,"win":54.5,"target":9.1,"stop":9.1,"avgR":0.15,"avgRCost":0.1,"avgREod":0.12},"upGapUp":{"n":0},"upGapDown":{"n":96,"win":44.8,"target":2.1,"stop":11.5,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.04}},"flatTop":{"name":"高位窄幅整固後突破（Flat Top／HOD Break）","all":{"n":921,"win":50.2,"target":5.1,"stop":21.5,"avgR":0.06,"avgRCost":0.01,"avgREod":0.12},"up":{"n":270,"win":52.2,"target":5.9,"stop":22.6,"avgR":0.09,"avgRCost":0.04,"avgREod":0.14},"best":{"n":191,"win":55,"target":8.4,"stop":18.3,"avgR":0.18,"avgRCost":0.13,"avgREod":0.28},"upBest":{"n":63,"win":63.5,"target":9.5,"stop":17.5,"avgR":0.25,"avgRCost":0.2,"avgREod":0.36},"notUpBest":{"n":128,"win":50.8,"target":7.8,"stop":18.8,"avgR":0.15,"avgRCost":0.1,"avgREod":0.24},"upGapUp":{"n":113,"win":58.4,"target":6.2,"stop":15.9,"avgR":0.2,"avgRCost":0.15,"avgREod":0.17},"upGapDown":{"n":121,"win":43,"target":5,"stop":26.4,"avgR":-0.04,"avgRCost":-0.09,"avgREod":0.07}}}};

  /* ---------- Level 15 專用示意圖（全部做多；教學模擬） ---------- */
  SET.amEma9 = {
    name: 'EMA 9 回調（強勢延續）', side: 1,
    anchors: [[0, 0], [5, 0.35], [9, 0.6], [12, 0.74], [15, 0.66], [16, 0.69], [20, 0.95], [24, 1.1], [45, 1.25], [77, 1.35]],
    plan(B, A) {
      const em = emaOf(B); let i = 14, best = Infinity;
      for (let k = 13; k <= 17; k++) { const d = B[k].l - em[k]; if (d < best) { best = d; i = k; } }
      B[i].l = Math.min(B[i].l, +em[i].toFixed(2));
      const entry = B[i].h + 0.01, stop = Math.min(B[i].l, em[i]) - 0.03 * A;
      return { k: i + 1, entry, stop, ema: true, wait: '開市後一路升，企喺 VWAP 同 EMA 9（紫色線）上面；回調好淺，去唔到 VWAP。', trig: 'K 線低位掂到 EMA 9 但收市守住，下一支 K 升穿佢高位。' };
    },
  };
  SET.amFlat = {
    name: '高位窄幅整固後突破（Flat Top）', side: 1,
    anchors: [[0, 0], [5, 0.4], [9, 0.62], [11, 0.56], [13, 0.61], [15, 0.57], [17, 0.61], [19, 0.59], [21, 0.9], [30, 1.05], [77, 1.15]],
    plan(B, A) {
      const hod = hiOf(B, 0, 19), bl = loOf(B, 15, 19);
      return { k: 20, entry: hod + 0.01, stop: bl - 0.02 * A, box: [13, 19, bl, hod], wait: '升完之後，喺全日高位（HOD）下面窄幅橫行 20–30 分鐘（紫色格），冇跌返落 VWAP。', trig: '升穿全日最高（HOD）。' };
    },
  };
  SET.amPdhTrap = {
    name: '反面教材：一開市追昨日高位突破（PDH Break）', side: 1,
    anchors: [[0, 0], [2, 0.2], [4, 0.38], [5, 0.47], [7, 0.3], [10, 0.12], [16, 0.0], [30, -0.1], [77, -0.05]],
    plan(B, A, s, P0) {
      const pdh = P0 + 0.36 * A;
      let k = 1; while (k < 20 && B[k].h < pdh) k++;
      return { k, entry: pdh + 0.01, stop: loOf(B, Math.max(0, k - 3), k - 1) - 0.02 * A, lines: [['PDH', pdh, '#0ea5e9']], wait: '開市後急升，行近昨日高位（PDH，藍色線）。', trig: '一升穿 PDH 就追入（呢個做法數據上係蝕錢，見下面統計）。' };
    },
  };
  const D = { longOnly: true, amLine: true };
  [['orb30', 'orb30'], ['flag', 'flag'], ['ema9', 'amEma9'], ['flat', 'amFlat'], ['vwap', 'vwapPull'], ['r2g', 'r2g'], ['pdhtrap', 'amPdhTrap']]
    .forEach(([id, key]) => { window.WIDGETS_EXTRA['l15-d-' + id] = L.diagram(key, D); });
  window.WIDGETS_EXTRA['l15-spot'] = L.spot(['orb30', 'flag', 'amEma9', 'amFlat', 'vwapPull', 'r2g'], 'l15-spot', true);

  /* ---------- 真實統計表 ---------- */
  const ORDER = ['flatTop', 'ema9Pull', 'flag', 'orb30', 'orb15', 'orb5', 'vwapPull', 'r2g', 'pdhRetest', 'pdhBreak'];
  const VIEWS = [['all', '全部'], ['up', '日線升勢'], ['best', 'A+ 過濾'], ['upBest', '升勢 + A+'], ['notUpBest', '非升勢 + A+'], ['upGapUp', '升勢 + Gap 高開'], ['upGapDown', '升勢 + Gap 低開']];
  const sg = (v) => (v == null ? '—' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2));
  window.WIDGETS_EXTRA['l15-stats'] = (el) => {
    if (!STATS || !STATS.setups) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    let view = 'all';
    const draw = () => {
      const row = (k) => { const s = STATS.setups[k], g = s && s[view]; if (!s) return ''; if (!g || !g.n) return `<tr><th scope="row">${esc(s.name)}</th><td colspan="6">—</td></tr>`;
        return `<tr class="${g.n < 100 ? 'l15-few' : ''}"><th scope="row">${esc(s.name)}</th><td>${g.n}${g.n < 100 ? ' ⚠️' : ''}</td><td>${g.win}%</td><td>${g.target}%</td><td class="${g.avgR >= 0 ? 'pos' : 'neg'}">${sg(g.avgR)}</td><td class="${g.avgRCost >= 0 ? 'pos' : 'neg'}">${sg(g.avgRCost)}</td><td class="${g.avgREod >= 0 ? 'pos' : 'neg'}">${sg(g.avgREod)}</td></tr>`; };
      el.innerHTML = `<div class="l11-w"><div class="l13-tabs">${VIEWS.map(([k, t]) => `<button class="btn sm ${k === view ? 'primary' : ''}" data-v="${k}">${t}</button>`).join('')}</div>
        <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>Setup（全部做多）</th><th>次數</th><th>賺錢 %</th><th>到 2R %</th><th>平均 R（11:30 平倉）</th><th>扣成本後</th><th>平均 R（Bracket 留到收市）</th></tr></thead><tbody>${ORDER.map(row).join('')}</tbody></table></div>
        <p class="muted">⚠️ = 少過 100 次，運氣影響大。<b>A+ 過濾</b> = 首 5 分鐘成交 ≥ 平時 2 倍，而且入場前 QQQ 喺自己 VWAP 上面。數據：${esc(STATS.source)}，${esc(STATS.from)} 至 ${esc(STATS.to)}，${STATS.universe.length} 隻成交大嘅美股，${STATS.daysInPlay.toLocaleString()} 個有人關注嘅日子（升勢 ${STATS.trendDays.up.toLocaleString()}、橫行 ${STATS.trendDays.mixed.toLocaleString()}、跌勢 ${STATS.trendDays.down.toLocaleString()}）。${esc(STATS.rules.trend)}。${esc(STATS.rules.exit)}。每個 Setup 用固定機械規則；過去統計唔代表將來。</p></div>`;
      el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.v; draw(); }));
    };
    draw();
  };

  /* ---------- 日線趨勢檢查器 ---------- */
  window.WIDGETS_EXTRA['l15-trend'] = (el) => {
    const st = (() => { try { return (Store.user().toolState || {})['l15-trend'] || null; } catch (e) { return null; } })() || { pc: 56.08, s20: 52.4, s50: 49.8, hi20: 58.9 };
    el.innerHTML = `<div class="l11-w"><div class="l10-form">
      <label>昨日收市價 <input type="number" inputmode="decimal" step="0.01" data-k="pc" value="${st.pc}"></label>
      <label>20 日線（SMA 20） <input type="number" inputmode="decimal" step="0.01" data-k="s20" value="${st.s20}"></label>
      <label>50 日線（SMA 50） <input type="number" inputmode="decimal" step="0.01" data-k="s50" value="${st.s50}"></label>
      <label>20 日最高價 <input type="number" inputmode="decimal" step="0.01" data-k="hi20" value="${st.hi20}"></label></div>
      <div class="l11-out" data-o aria-live="polite"></div></div>`;
    const show = () => {
      el.querySelectorAll('[data-k]').forEach((i) => { const v = parseFloat(i.value); if (isFinite(v)) st[i.dataset.k] = v; });
      try { const u = Store.user(); u.toolState = u.toolState || {}; u.toolState['l15-trend'] = st; Store.save(); } catch (e) {}
      const up = st.pc > st.s20 && st.s20 > st.s50, dn = st.pc < st.s20 && st.s20 < st.s50;
      const near = st.hi20 > 0 ? (st.hi20 - st.pc) / st.hi20 * 100 : null;
      const ck = (ok, t) => `<li>${ok ? '✅' : '❌'} ${t}</li>`;
      el.querySelector('[data-o]').innerHTML = `<p><span class="pk-beg ${up ? 'ok' : dn ? 'bad' : 'mid'}">${up ? '📈 日線升勢（Trend-up）' : dn ? '📉 日線跌勢' : '➖ 橫行／方向未明'}</span></p>
        <ul class="l12-sig">${ck(st.pc > st.s20, `昨收 ${st.pc} 高過 20 日線 ${st.s20}`)}${ck(st.s20 > st.s50, `20 日線高過 50 日線 ${st.s50}`)}${ck(near != null && near <= 5, `離 20 日高位 ${near == null ? '—' : near.toFixed(1)}%（5% 之內 = 貼近高位）`)}</ul>
        <p class="muted">${up ? '符合 Long 專區嘅日線條件。開市後仲要睇 A+ 過濾：首 5 分鐘成交 ≥ 平時 2 倍、QQQ 喺 VWAP 上面。' : '唔符合日線升勢。數據顯示日線趨勢本身唔係決定性，但如果你只想做 Trend-up 股，呢隻今日就唔做。'}</p>`;
    };
    el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', show));
    show();
  };
})();

window.COURSE.push({
  id: 'l15',
  code: 'Level 15',
  title: '頭 2 小時做多：專攻 Trend-up 股',
  subtitle: '09:30–11:30、只做 Long、日線升勢股：數據話邊啲有用、點揀股、A+ 過濾、四個主力 Setup（Flat Top、EMA 9 回調、Bull Flag、30 分鐘 ORB）、唔好追 PDH 突破、出場同收工',
  icon: '🌅',
  color: '#c2410c',
  question: '我只炒開市頭 2 小時、只做多、只揀升勢股：應該點揀股、用邊個 Setup？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l15-c1', num: '1', title: '你嘅打法同數據真相', mins: 9,
  summary: '頭 2 小時、只做多、Trend-up 股係一個清晰嘅打法。真實數據顯示：日線升勢「本身」冇加分；真正有幫助嘅係開市成交量大（≥ 平時 2 倍）加大市（QQQ）喺 VWAP 上面。喺呢個 A+ 過濾之下，Flat Top、EMA 9 回調、Bull Flag 嘅成績最好；一開市追昨日高位突破就一直蝕。',
  keywords: ['Long only', '頭 2 小時', 'Trend-up', 'A+ 過濾'],
  md: `
:::info 呢個 Level 點嚟
用戶話：「我只炒頭 1–2 個小時，想更針對性咁炒 Long 同 Trend-up 嘅股票。」呢個 Level 專為呢個打法而寫，全部 Setup 只有做多版本，全部喺 **09:30–11:30（美東）** 之內入場。Cash 戶口都做得。
:::

## 1.1 呢個打法點解合理

- **時間集中**：頭 2 小時成交最大、波幅最大；香港時間冬令 22:30–00:30，做完可以瞓
- **只做多**：唔使借貨、冇 SSR 限制、Cash 戶口做得、虧損有上限
- **Trend-up 股**：上面少啲「蟹貨」（被套牢嘅人），突破之後阻力少

## 1.2 但係要先睇數據

我哋用 50 隻大型股、7,132 個有人關注嘅日子，測試咗 10 個做多 Setup（全部 11:30 前入場）。撳上面嘅掣睇唔同條件：

[[widget:l15-stats]]

:::key 數據話你知嘅五件事
1. **日線升勢「本身」冇加分**。「09:35 買、11:30 賣」嘅基準：升勢股升嘅機會 51%，同全部股（51%）一樣。撳「日線升勢」嗰個掣，大部分 Setup 都仲係喺 0 附近
2. **A+ 過濾先係有幫助**：首 5 分鐘成交 ≥ 平時 2 倍，而且 QQQ 喺 VWAP 上面。Flat Top 由 +0.06R 變 +0.18R，EMA 9 回調由 +0.01R 變 +0.11R，Bull Flag 由 +0.01R 變 +0.17R
3. **升勢 + A+ 一齊用最好**，但樣本少：Flat Top +0.25R（63 次）、EMA 9 回調 +0.18R（143 次）、Bull Flag +0.15R（52 次）、30 分鐘 ORB +0.14R（73 次）
4. **一開市追昨日高位（PDH）突破係蝕錢**：全部 −0.13R、升勢股更差 −0.19R，加埋 A+ 過濾都係 −0.17R
5. **升勢股 Gap 高開好過 Gap 低開**：Bull Flag 喺升勢 + Gap 高開係 +0.21R，Gap 低開係 −0.25R
:::

:::warn 點樣正確理解呢啲數字
- 我哋測試咗好多組合，**總有幾個會因為運氣而好睇**。樣本少過 100 次（有 ⚠️）嘅數字只可以當「假設」
- 「升勢 + A+」喺 2024 年最好，2026 年已經弱咗
- 機械規則 ≠ 你實際做嘅結果。要用 Paper Trading 記錄 30 次先知（第 11 章）
- 結論唔係「Trend-up 冇用」，而係：**Trend-up 係你嘅選股範圍，A+ 過濾先係你嘅入場許可**
:::

## 1.3 點解「日線升勢」本身冇加分？

聽落好奇怪：升勢股唔係應該更易升咩？原因可能有三個：

1. **大家都知**：升勢股人人都睇住，好消息已經反映喺價格入面，開市後冇額外優勢。
2. **日內同日線係兩件事**：日線升勢係幾個星期嘅方向，頭 2 小時嘅走勢主要受當日消息、成交量同大市影響。
3. **升勢股回調都多**：升咗好多嘅股，日內獲利回吐亦多，頭 2 小時經常係震盪。

所以升勢嘅作用係**縮細範圍**（唔使睇跌勢股），真正決定今日做唔做嘅，係開市後嘅成交量同大市。

## 1.4 一朝嘅實際流程（預覽）

| 時間（美東） | 做咩 | 用邊章 |
|---|---|---|
| 09:00 | 睇報告 Long 專區，揀 2–3 隻升勢股 | 揀股、A+ 過濾 |
| 09:35 | 首 5 分鐘成交夠唔夠 2 倍？QQQ 喺 VWAP 邊邊？ | A+ 過濾 |
| 10:00–11:30 | 等四個 Setup 其中一個出現 | 四個主力 Setup |
| 11:30 | 收工 | 出場同收工 |

呢個單元會逐步教晒每一格。

[[quiz:l15-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c2', num: '2', title: '咩叫 Trend-up 股？日線三個條件', mins: 7,
  summary: '日線升勢 = 昨日收市高過 20 日線，20 日線高過 50 日線；再加「貼近 20 日高位」就係強勢股。每日選股嘅 Long 專區會幫你標明；你亦可以用 TradingView 自己檢查。',
  keywords: ['SMA 20', 'SMA 50', 'Trend-up', 'Daily Trend'],
  md: `
## 2.1 定義（同每日報告、統計用同一套）

| 條件 | 點睇 |
|---|---|
| ① 昨日收市 **高過 20 日線**（SMA 20） | 短期買家賺緊錢 |
| ② **20 日線高過 50 日線**（SMA 50） | 中期方向向上 |
| ③（加分）收市喺 **20 日高位 5% 之內** | 貼近高位，上面阻力少 |

①② 都啱 = **📈 日線升勢**。兩個都相反 = 📉 跌勢。其餘 = ➖ 橫行。

## 2.2 自己檢查

喺 TradingView 日線圖加 **SMA 20** 同 **SMA 50**，將數字輸入：

[[widget:l15-trend]]

:::tip 免費版 TradingView 指標唔夠用
日線圖同 5 分鐘圖用**唔同分頁**：日線圖放 SMA 20 + SMA 50；5 分鐘圖放 VWAP + EMA 9（Level 13 第 3 章）。
:::

## 2.3 Trend-up 股嘅三種開市

| 今日開市 | 意思 | 數據（09:35 買、11:30 賣） |
|---|---|---|
| **Gap 高開**（≥ 2%） | 有新好消息，強上加強 | 升嘅機會 47%，平均 +0.01 ATR：**唔可以一開市就買** |
| **Gap 低開**（≥ 2%） | 升勢中嘅回調 | 升嘅機會 56%，平均 +0.05 ATR：反彈機會高少少，但 Setup 成績差（第 9 章） |
| **平開但開市量大** | 有人入貨 | 睇 A+ 過濾 |

:::coach 重點
Gap 高開嘅升勢股，開市即買其實**輸多過贏**（47%）。賺錢要靠「等 Setup 出現」：整固後突破、回調後再上。呢個就係第 5–8 章教嘅嘢。
:::

## 2.4 用數字判斷：三隻股例子

| 股票 | 昨收 | SMA 20 | SMA 50 | 20 日高 | 判斷 |
|---|---|---|---|---|---|
| NVDA | $184.00 | $178.50 | $172.00 | $188.40 | ① ✔ ② ✔ → 📈 升勢；離 20 日高 2.3%（5% 之內）→ ③ 加分 |
| AMD | $159.30 | $161.20 | $155.80 | $170.00 | ① ✘（低過 SMA 20）② ✔ → ➖ 橫行 |
| INTC | $21.10 | $22.40 | $23.90 | $25.50 | ① ✘ ② ✘ → 📉 跌勢 |

計「離 20 日高幾遠」：($188.40 − $184.00) ÷ $188.40 = 2.3%。

## 2.5 點解要用昨日收市，唔用今日價格？

開市前你只知道昨日收市；用盤前價會令定義每分鐘都變。報告同統計都用昨收，你自己檢查都用同一個標準，結果先可以比較。

:::warn 升勢「剛剛成立」嘅股
SMA 20 啱啱升穿 SMA 50（例如兩條線只差 0.5%），技術上係升勢，但好容易再跌返轉頭。呢類股可以照做，但記錄時標記出嚟，之後睇吓佢哋嘅表現有冇分別。
:::

[[quiz:l15-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c3', num: '3', title: '開市前揀股：Long 專區同 A+ 過濾', mins: 8,
  summary: '每日報告新增「Long 專區」：優先列出日線升勢、RVOL ≥ 2 嘅做多候選。開市後再用 A+ 過濾確認：首 5 分鐘成交 ≥ 平時 2 倍、QQQ 喺 VWAP 上面。兩樣唔齊就唔做。',
  keywords: ['Long 專區', 'RVOL', 'QQQ', 'A+ 過濾'],
  md: `
## 3.1 每日報告嘅 Long 專區

由而家開始，每日選股報告會：

- 每隻股標明 **Daily Trend**：📈 升勢／➖ 橫行／📉 跌勢
- 新增 **🎯 Long 專區（頭 2 小時做多）**：將「做多 + 日線升勢 + 盤前 RVOL ≥ 2」嘅股排最前
- 做多計劃會寫明用邊個 Setup（Flat Top、EMA 9 回調、Bull Flag、30 分鐘 ORB），同埋 **11:30 收工**
- 沽空候選照列（俾其他成員參考），但排喺後面
- 如果當日冇合格嘅升勢做多股，報告會直接寫「今日 Long 專區冇合格股」，**唔會降低標準夾硬揀**

[[link:picks|📋 打開今日選股]]

## 3.2 A+ 過濾：開市後先知

| 過濾 | 幾時知 | 點睇 |
|---|---|---|
| **首 5 分鐘成交 ≥ 平時 2 倍** | 09:35 | 報告每隻 pick 都寫咗「要見 ≥ X 萬股」 |
| **QQQ 喺自己 VWAP 上面** | 入場前一刻 | 第二個 Mon 嘅 QQQ 5 分鐘圖（Level 13 第 3 章） |

| 條件 | Flat Top | EMA 9 回調 | Bull Flag |
|---|---|---|---|
| 全部 | +0.06R | +0.01R | +0.01R |
| 只係日線升勢 | +0.09R | −0.03R | +0.02R |
| 只係 A+ 過濾 | +0.18R | +0.11R | +0.17R |
| 升勢 + A+ | +0.25R | +0.18R | +0.15R |

:::key 你嘅入場許可
**日線升勢（開市前已知）＋ 首 5 分鐘量夠（09:35 知）＋ QQQ 喺 VWAP 上面（入場前知）**，三樣齊先搵 Setup。量唔夠或者 QQQ 喺 VWAP 下面：今日呢隻唔做。
:::

[[check:l15-premarket]]

## 3.3 一朝嘅揀股例子

報告 Long 專區有四隻：

| 股票 | 日線 | 盤前 RVOL | Gap | 報告寫嘅 09:35 成交門檻 |
|---|---|---|---|---|
| NVDA | 📈 | 3.1 | +1.8% | ≥ 120 萬股 |
| AVGO | 📈 | 2.4 | +2.6% | ≥ 45 萬股 |
| LUNR | 📈 | 5.2 | +6.0% | ≥ 80 萬股 |
| AMD | ➖ | 2.2 | +1.1% | ≥ 60 萬股 |

揀 2–3 隻：NVDA、AVGO（升勢 + 大型股 + RVOL 合格）。LUNR 波幅大、Gap 大，新手可以留做觀察；AMD 唔係升勢，唔喺呢個打法範圍。

09:35 結果：

| 股票 | 首 5 分鐘成交 | QQQ vs VWAP | 許可 |
|---|---|---|---|
| NVDA | 150 萬 ✔ | 上面 ✔ | ✔ 繼續睇 |
| AVGO | 30 萬 ✘ | 上面 | ✘ 今日唔做 |

**最後只剩一隻。** 呢個好正常：好多日 A+ 過濾之後只有 0–1 隻合格，冇合格就冇交易。

:::tip QQQ 喺 VWAP 附近上上落落點算？
入場前一刻睇：最近一支 5 分鐘 K 收喺 QQQ VWAP 上面先算。如果 QQQ 正喺 VWAP 度反覆穿越，代表大市冇方向，可以當成「唔合格」，或者細注。
:::

[[quiz:l15-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c4', num: '4', title: '2 小時時間表：三段做三樣嘢', mins: 6,
  summary: '09:30–10:00 觀察同畫開市區間；10:00–10:45 做 Bull Flag、EMA 9 回調、30 分鐘 ORB；10:45–11:30 做 Flat Top；11:30 收工（已經入咗嘅單留 Bracket）。',
  keywords: ['時間表', 'Routine'],
  md: `
## 4.1 時間表（美東／香港冬令）

| 美東 | 香港（冬令） | 做咩 | Setup |
|---|---|---|---|
| 09:30–09:35 | 22:30–22:35 | **唔落單**。睇首 5 分鐘成交夠唔夠 | — |
| 09:35–10:00 | 22:35–23:00 | 畫開市區間（頭 30 分鐘高低位）；睇有冇開市推動 | 準備 |
| 10:00–10:45 | 23:00–23:45 | 主要入場時段 | Bull Flag、EMA 9 回調、30 分鐘 ORB |
| 10:45–11:30 | 23:45–00:30 | 第二個入場時段 | Flat Top（高位整固突破） |
| 11:30 | 00:30 | **收工**：冇倉就熄機；有倉就確認 Bracket 喺度 | — |

夏令時間（3 月至 11 月初）香港時間早 1 小時。

## 4.2 兩條硬規則

:::steps
1. **11:30 之後唔開新倉**：統計入面所有入場都喺 11:30 前
2. **一朝最多 2 筆**：第一筆中 Stop，可以再做一筆；兩筆都中 Stop 就收工
:::

:::tip 點解頭 5 分鐘唔做
5 分鐘 ORB 做多：全部 +0.02R、升勢股 −0.03R。我哋每日報告嘅後備 5 分鐘 ORB 紀錄都係負數。開市頭幾分鐘太亂。
:::

## 4.3 一個完整朝早（美東時間）

| 時間 | 實際 | 決定 |
|---|---|---|
| 09:30 | NVDA 開 $186.00 | 唔落單 |
| 09:35 | 首 5 分鐘 150 萬股（2.5 倍）；QQQ 喺 VWAP 上面 | 許可 ✔ |
| 10:00 | 開市區間 $185.20–187.40；10:00 收 $187.10（開市推動 0.12 ATR，唔夠 0.3）| 冇 Bull Flag；記低 ORB 區間 |
| 10:25 | 第一次回調掂 EMA 9 $186.60，守住 | EMA 9 回調觸發準備 |
| 10:30 | 升穿上一支高位 $186.95 → 入場；Stop $186.40；Target 2R $188.05 | 第一筆 |
| 10:55 | 去到 $188.05 | +2R，完成 |
| 11:05 | 高位窄幅整固 $187.70–188.10 | Flat Top 準備（已經做咗 1 筆，仲可以做第 2 筆） |
| 11:20 | 冇突破 | 唔追 |
| 11:30 | 收工 | 撤銷未觸發嘅 Buy Stop |

一朝一筆、+2R，就係呢個打法嘅理想日子。好多日子會係 0 筆（冇 Setup）或者 −1R。

## 4.4 點解要限一朝 2 筆？

- 兩筆都中 Stop，通常代表今日環境唔啱（例如大市轉弱、假突破多），再做落去只會擴大虧損。
- 限制次數會令你自然揀最好嘅 Setup，唔會為咗「有嘢做」而入場。
- 每日最大虧損 = 2R，容易控制。

[[quiz:l15-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c5', num: '5', title: 'Setup ①：高位窄幅整固後突破（Flat Top）', mins: 9,
  summary: '升完一段之後，喺全日高位下面窄幅橫行 20 分鐘以上（範圍 ≤ 0.25 ATR）、冇跌返落 VWAP，升穿 HOD 就入。Stop 喺整固低位，風險細。10 個 Setup 入面數據最好、最穩定。',
  keywords: ['Flat Top', 'HOD Break', 'Consolidation'],
  md: `
## 5.1 規則

:::card Flat Top 做多
- **背景**：開市後已經升咗最少 0.25 ATR；價格喺 VWAP 上面
- **整固**：最近 4 支 5 分鐘 K（20 分鐘）高低範圍 ≤ 0.25 ATR，而且貼住全日高位（HOD）
- **入場**：Buy Stop 喺 HOD + 0.01（之後 20 分鐘內有效）
- **Stop**：整固低位下面少少
- **Target**：2R
- **時間**：通常 10:15–11:30 出現
:::

[[widget:l15-d-flat]]

## 5.2 數據

| 條件 | 次數 | 賺錢 % | 平均 R（11:30 平倉） | 留 Bracket 到收市 |
|---|---|---|---|---|
| 全部 | 921 | 50% | +0.06 | +0.12 |
| 日線升勢 | 270 | 52% | +0.09 | +0.14 |
| A+ 過濾 | 191 | 55% | +0.18 | +0.28 |
| 升勢 + A+ | 63 | 64% | +0.25 | +0.36 |
| 升勢 + Gap 高開 | 113 | 58% | +0.20 | +0.17 |
| 升勢 + Gap 低開 | 121 | 43% | −0.04 | +0.07 |

:::coach 點解呢個最好
- 整固窄 → Stop 細 → 同樣風險買到多啲股，2R 易到
- 整固期間想賣嘅人已經賣咗，突破時阻力少
- 你有充足時間準備：預先喺 HOD 放 Buy Stop + Bracket，唔使追
:::

:::bad 唔做
- 整固已經跌穿 VWAP
- 整固範圍太闊（> 0.25 ATR），唔算「窄幅」
- 已經係第三次試 HOD 都過唔到，而且成交越嚟越細
:::

## 5.3 用數字行一次 Flat Top

NVDA，ATR $9.30（0.25 ATR = $2.33）。開市價 $184.00。

:::steps
1. **背景**：10:40 價格 $187.10，開市後已經升 $3.10（0.33 ATR ✔）；VWAP $185.60，喺上面 ✔。
2. **整固**：10:25–10:45 四支 K：最高 $187.40（= HOD）、最低 $186.80 → 範圍 $0.60（0.06 ATR ✔，好窄）。
3. **入場**：掛 Buy Stop $187.41，Limit $187.50，20 分鐘內有效。
4. **Stop**：整固低位 $186.80 − 少少 = $186.75，風險 $0.66。
5. **股數**：每筆風險 $100 → 151 股。
6. **Target**：2R = $188.73。上面 20 日高 $188.40 喺中間 → 留意可能喺度停一停。
7. **結果**：10:55 升穿成交 $187.43，11:15 去到 $188.73，+2R。
:::

## 5.4 整固「貼住 HOD」點解咁重要？

| 整固位置 | 意思 |
|---|---|
| 貼住 HOD（差 0.05 ATR 之內） | 買家唔肯讓價，賣家沽唔低 → 一突破，賣家冇貨 |
| 離 HOD 有一段距離 | 已經有回調，賣家有一定力量 → 突破 HOD 前要先收復失地 |

貼住高位嘅窄整固，代表「升完之後只係休息」，唔係「升完之後轉弱」。

[[quiz:l15-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c6', num: '6', title: 'Setup ②：EMA 9 回調（強勢延續）', mins: 9,
  summary: '強勢股開市後一路升，回調好淺、去唔到 VWAP，只係掂一掂 5 分鐘 EMA 9 就再升。K 線低位掂 EMA 9 而收市守住，下一支升穿佢高位入場，Stop 喺 EMA 9 下面少少。',
  keywords: ['EMA 9', 'Pullback', '強勢股'],
  md: `
## 6.1 規則

:::card EMA 9 回調做多
- **背景**：價格喺 VWAP 同開市價上面；EMA 9 向上；EMA 9 喺 VWAP 上面；之前兩支 K 都收喺 EMA 9 上面
- **觸發**：一支 K 低位掂到 EMA 9（0.03 ATR 之內），但收市冇跌穿
- **入場**：下一支 K 升穿佢高位（Buy Stop，10 分鐘內有效）
- **Stop**：EMA 9 同嗰支 K 低位較低嗰個，再減 0.03 ATR；Stop 闊過 0.5 ATR 唔做
- **Target**：2R
- **時間**：10:25 之後（EMA 9 要有足夠 K 線先準）
:::

[[widget:l15-d-ema9]]

## 6.2 數據

| 條件 | 次數 | 賺錢 % | 平均 R（11:30 平倉） | 留 Bracket 到收市 |
|---|---|---|---|---|
| 全部 | 1,878 | 44% | +0.01 | +0.03 |
| 日線升勢 | 562 | 43% | −0.03 | −0.03 |
| A+ 過濾 | 433 | 49% | +0.11 | +0.16 |
| 升勢 + A+ | 143 | 52% | +0.18 | +0.32 |

:::warn 冇 A+ 過濾就冇用
EMA 9 回調出現得好多（1,878 次），但全部一齊計只有 +0.01R。要**開市量夠 + QQQ 喺 VWAP 上面**先做。按年睇，升勢 + A+ 嘅成績由 2024 年 +0.37R 跌到 2026 年 +0.06R，優勢細咗。
:::

:::tip 圖表設定
TradingView 5 分鐘圖開 Extended Hours 嘅話，EMA 9 會計埋盤前 K 線，開市頭幾支已經有數（Level 10 第 8 章）。統計就只用正常時段 K 線，所以 10:25 後先有訊號。
:::

## 6.3 用數字行一次 EMA 9 回調

AVGO，ATR $8.00（0.03 ATR = $0.24、0.5 ATR = $4.00）。10:35。

:::steps
1. **背景**：價格 $352.40 > VWAP $350.10 > 開市價 $349.00 ✔；EMA 9 $352.00 向上，喺 VWAP 上面 ✔；之前兩支 K 收喺 EMA 9 上面 ✔。
2. **觸發 K**：10:35 低位 $352.10（離 EMA 9 $0.10 ✔），收 $352.60（冇跌穿 ✔）。高位 $352.90。
3. **入場**：Buy Stop $352.91，10 分鐘內有效。10:40 成交。
4. **Stop**：EMA 9 $352.00 同 K 低 $352.10 較低 = $352.00 − $0.24 = $351.76，風險 $1.15（0.14 ATR ✔）。
5. **Target**：2R = $355.21。
:::

## 6.4 點解要等 10:25 之後？

EMA 9 係最近 9 支 K 嘅平均。只用正常時段 K 線嘅話，09:30 開始要到大約 10:15 先有 9 支 K，之前嘅 EMA 9 只係少數幾支 K 嘅平均，好唔穩定。統計只用正常時段，所以規則定喺 10:25 之後。

:::bad 唔做
- 回調嗰支 K 收市跌穿 EMA 9（守唔住）
- 價格之前離 EMA 9 好遠急升，第一次回調一下插穿 EMA 9 去到 VWAP：呢個係另一個形狀（VWAP 回調），唔係 EMA 9 回調
- 10 分鐘內冇觸發：取消張單，等下一個機會
:::

[[quiz:l15-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c7', num: '7', title: 'Setup ③：開市推動後第一次回調（Bull Flag）', mins: 8,
  summary: '10:00 收市比開市高最少 0.3 ATR，之後細回調、冇穿 VWAP、冇回超過一半；出現一支高位低過上一支嘅 K，下一支升穿佢高位入場。喺升勢 + Gap 高開嘅股最好，Gap 低開就唔好做。',
  keywords: ['Bull Flag', 'First Pullback', 'Opening Drive'],
  md: `
## 7.1 規則（Level 14 第 4 章嘅做多版本）

:::card Bull Flag 做多
- **背景**：10:00 收市比開市高 ≥ 0.3 ATR（開市推動）
- **回調**：由高位回落 ≥ 0.15 ATR；唔可以收穿 VWAP；唔可以回超過升幅一半
- **入場**：回調中出現高位低過上一支嘅 K，下一支升穿佢高位（Buy Stop，15 分鐘內有效）
- **Stop**：回調最低位下面；闊過 0.6 ATR 唔做
- **Target**：2R
:::

[[widget:l15-d-flag]]

## 7.2 數據

| 條件 | 次數 | 賺錢 % | 到 2R % | 平均 R（11:30 平倉） | 留 Bracket 到收市 |
|---|---|---|---|---|---|
| 全部 | 546 | 42% | 15% | +0.01 | +0.02 |
| 日線升勢 | 191 | 42% | 18% | +0.02 | +0.06 |
| A+ 過濾 | 141 | 46% | 22% | +0.17 | +0.22 |
| 升勢 + 開市量 ≥ 2 倍 | 79 | 48% | 28% | +0.22 | +0.29 |
| 升勢 + Gap 高開 | 83 | 49% | 23% | +0.21 | +0.29 |
| 升勢 + Gap 低開 | 72 | 31% | 12% | −0.25 | −0.27 |

:::coach 點睇
賺錢 % 唔高（四成幾），靠嘅係贏嗰次去到 2R。**贏 1R 就走、輸咗唔走，呢個 Setup 一定蝕。** 升勢股 Gap 低開之後嘅 Bull Flag 特別差（−0.25R）：低開代表有壞消息，反彈多數行唔遠。
:::

## 7.3 用數字行一次 Bull Flag（做多版本）

LUNR，ATR $1.20（0.3 ATR = $0.36、0.15 ATR = $0.18、0.6 ATR = $0.72）。開市價 $14.00。

:::steps
1. **推動**：10:00 收 $14.55（比開市高 $0.55，0.46 ATR ✔）。HOD $14.70。
2. **回調**：回落到 $14.40（回 $0.30 ✔ ≥ 0.15 ATR）；VWAP $14.25 冇收穿 ✔；推動一半位 $14.35 冇跌穿 ✔。
3. **Flag K**：高位 $14.48（低過上一支 $14.56）。
4. **入場**：Buy Stop $14.49。
5. **Stop**：回調低位 $14.40 − 少少 = $14.37，風險 $0.12。
6. **股數**：風險 $100 → 833 股（要睇資金夠唔夠：833 × $14.49 ≈ $12,070）。
7. **Target**：2R = $14.73，同 HOD $14.70 好近 → HOD 先走一半。
:::

## 7.4 細價股要特別留意

LUNR 呢類股價 $10–20、波幅大嘅股：

- 股數多，買賣差價（例如 $0.02）對 R 影響大：風險只有 $0.12，差價已經佔 1/6 個 R。
- 成交可能突然消失，Stop 成交價會差。
- 停牌機會較高。

可以照做，但用較細風險（例如正常嘅一半），而且一定用 Limit 價保護入場。

[[quiz:l15-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c8', num: '8', title: 'Setup ④：30 分鐘 ORB 做多', mins: 7,
  summary: '09:30–10:00 畫開市區間，10:00–11:00 升穿高位就入，Stop 喺區間低位。單獨用差唔多打和；只喺升勢 + A+ 過濾先有少少優勢。5 分鐘同 15 分鐘 ORB 喺升勢股更差。',
  keywords: ['ORB', 'Opening Range'],
  md: `
## 8.1 規則

:::card 30 分鐘 ORB 做多
- **等**：09:30–10:00 開市區間；闊過 0.75 ATR 唔做
- **唔做**：10:00 後先跌穿區間低位
- **入場**：10:00–11:00 升穿區間高位（Buy Stop）
- **Stop**：區間低位
- **Target**：2R
:::

[[widget:l15-d-orb30]]

## 8.2 三種 ORB 比較（做多）

| 版本 | 全部 | 日線升勢 | A+ 過濾 | 升勢 + A+ |
|---|---|---|---|---|
| 5 分鐘 ORB | +0.02R | −0.03R | +0.07R | −0.08R（85 次） |
| 15 分鐘 ORB | +0.03R | −0.01R | +0.06R | +0.03R（109 次） |
| 30 分鐘 ORB | +0.02R | 0.00R | +0.05R | +0.14R（73 次） |

:::coach 點用
ORB 係四個主力 Setup 入面最弱嘅一個。Stop 係成個開市區間，通常幾闊，2R 好難喺 11:30 前到（到 2R 只有 1%）。建議：**有 Flat Top、EMA 9 回調或者 Bull Flag 就優先做嗰啲**；ORB 只喺升勢 + A+ 齊先考慮。
:::

## 8.3 用數字行一次 30 分鐘 ORB 做多

NVDA，ATR $9.30（0.75 ATR = $6.98）。09:30–10:00：高 $187.40、低 $185.20（闊 $2.20 = 0.24 ATR ✔）。10:00 後冇跌穿 $185.20 ✔。

:::steps
1. 掛 Buy Stop $187.41（10:00–11:00 有效）。
2. Stop：區間低位 $185.19，風險 $2.22。
3. 股數：風險 $100 → 45 股（比 Flat Top 少三倍，因為 Stop 闊）。
4. Target：2R = $191.85。
5. 現實：要喺 11:30 前行 $4.44（0.48 ATR），好多日都行唔到，所以數據入面到 2R 嘅比例好低，大部分係 11:30 平倉。
:::

## 8.4 點解 ORB 排最後？

| | Flat Top | ORB |
|---|---|---|
| Stop | 整固低位（通常 0.05–0.15 ATR） | 成個開市區間（通常 0.2–0.5 ATR） |
| 同樣風險買到 | 多 | 少 |
| 2R 要行 | 短 | 長 |
| 11:30 前到 2R | 較易 | 好難 |

同一隻股、同一個朝早，如果 Flat Top 同 ORB 都出現，優先做 Flat Top。

[[quiz:l15-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c9', num: '9', title: '數據話唔好做：追 PDH 突破、VWAP 回調、Gap 低開撈底', mins: 8,
  summary: '一開市追昨日高位突破：一直蝕（升勢股更差）。Gap 高開後回試 PDH、VWAP 第一次回調、升勢股 Gap 低開後 Red-to-Green：機械做法都係 0 或者負數。唔係永遠唔做得，而係唔值得放入你嘅 2 小時 Playbook。',
  keywords: ['PDH Break', 'VWAP Pullback', 'Red-to-Green'],
  md: `
## 9.1 四個「聽落好啱」但數據唔支持嘅做法

| 做法 | 全部 | 日線升勢 | 升勢 + A+ |
|---|---|---|---|
| 一開市追 PDH 突破 | −0.13R | −0.19R | −0.20R |
| Gap 高開後回試 PDH | −0.04R | −0.09R | −0.11R（21 次） |
| VWAP 第一次回調 | −0.04R | −0.01R | 0.00R |
| Red-to-Green（升穿昨收） | +0.01R | −0.04R | 樣本太少 |

## 9.2 反面教材：追 PDH 突破

[[widget:l15-d-pdhtrap]]

:::bad 點解追 PDH 突破會蝕
- PDH 係人人都見到嘅位：好多人喺度放賣單（昨日高位買入、等返家鄉嘅人）
- 開市頭 30 分鐘升到 PDH，通常已經升咗一段，追入嘅 Stop 又近，一回調就中
- 升勢股「貼近高位」更差（−0.27R）：越多人睇住，越易假突破
:::

:::tip 咁 PDH 點用？
當佢係**參考位**，唔係入場訊號：
- 價格過咗 PDH 之後喺上面**整固**（Flat Top）先入：Stop 細，數據好好多
- 入場前睇吓 Target 之前有冇 PDH：有就當阻力
:::

## 9.3 升勢股 Gap 低開：反彈機會高，但 Setup 差

升勢股 Gap 低開日，「09:35 買、11:30 賣」升嘅機會有 56%（平均 +0.05 ATR），好過 Gap 高開（47%）。但用 Setup 做（Bull Flag −0.25R、EMA 9 回調 −0.10R、Flat Top −0.04R）反而差：低開日走勢上上落落，Stop 易中。**新手唔建議撈底。**

## 9.4 追 PDH 突破點解會蝕：一個例子

NVDA PDH $186.00。09:40 價格衝上 $186.20（升穿 PDH），你即刻買：

| | 數 |
|---|---|
| 入場 | $186.25 |
| Stop（開市後最近低位） | $185.40（風險 $0.85） |
| 09:50 | 回落到 $185.60（昨日喺 $186 附近買入嘅人「打和走」） |
| 10:00 | 跌到 $185.35 → 中 Stop，−1R |
| 10:40 | 價格喺 $185.50–186.10 整固之後，11:00 先真正升穿 $186.10 |

如果等整固（Flat Top）：入場 $186.11、Stop $185.45（$0.66）、Target $187.43 → 11:20 到 Target，+2R。

**同一個 PDH，追突破輸 1R，等整固贏 2R。**

## 9.5 點解 VWAP 回調喺呢個打法冇用？

做多 VWAP 回調要價格回到 VWAP。喺頭 2 小時嘅強勢升勢股，價格經常只係回到 EMA 9 就再升；真係回到 VWAP 嘅，好多時已經代表升勢轉弱。所以呢個打法用 EMA 9 回調代替 VWAP 回調。

[[quiz:l15-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c10', num: '10', title: '出場同收工：11:30 平倉定留 Bracket？', mins: 7,
  summary: '入場即落 Bracket（Stop + 2R Target）。11:30 你收工，但張單可以留喺度：數據顯示主力 Setup 留 Bracket 到收市，平均比 11:30 平倉好少少。到 +1R 移 Stop 返入場價先收工。',
  keywords: ['Bracket', '出場', '收工'],
  md: `
## 10.1 兩種收工方法

| 方法 | 點做 | 好處 | 壞處 |
|---|---|---|---|
| **11:30 平倉** | 未到 Target 就市價賣出 | 安心瞓覺、冇持倉 | 趨勢日賺少咗 |
| **留 Bracket** | Stop 同 Target 留喺 IBKR（DAY 單，收市自動取消）；15:55 仲未成交要有人平倉 | 俾時間個 Trade 行 | 瞓著咗，中 Stop 都唔知 |

## 10.2 數據：升勢 + A+

| Setup | 11:30 平倉 | 留 Bracket 到收市 |
|---|---|---|
| Flat Top | +0.25R | +0.36R |
| EMA 9 回調 | +0.18R | +0.32R |
| Bull Flag | +0.15R | +0.25R |
| 30 分鐘 ORB | +0.14R | +0.11R |

:::steps 建議做法
1. 入場同時落 **Bracket**（Level 13 第 5 章）：Stop + Target 2R
2. 到 **+1R**：Stop 移返入場價（最差打和）
3. **11:30**：
   - 已經到 +1R、Stop 喺入場價 → 可以留 Bracket 去瞓
   - 未到 +1R → 平倉收工（唔好留一張仲有全額風險嘅單過夜瞓覺）
4. 留 Bracket 嘅話，要加一張 **15:55 平倉**嘅安排：IBKR 可以將 Target 單嘅有效期設做當日，另外設手機鬧鐘；或者請家人幫手睇。Day Trade 唔留過夜
:::

:::warn Cash 戶口留意
Cash 戶口賣出之後，資金要 T+1 先交收，同一筆錢當日唔可以再用嚟買第二次（Level 4 第 13 章）。一朝最多 2 筆，要預留資金。
:::

## 10.3 11:30 嘅決定：三個例子

| 情況 | 持倉狀態 | 做法 |
|---|---|---|
| A | 入場 $186.95，現價 $187.60（+1.2R），Stop 已移返 $186.95 | 可以留 Bracket（最差打和），Target 照留 |
| B | 入場 $186.95，現價 $187.10（+0.3R），Stop 仍然喺 $186.40 | 市價平倉，+0.3R 收工 |
| C | 入場 $186.95，現價 $186.60（−0.6R） | 平倉，−0.6R 收工；唔好因為「就快返嚟」而留 |

B 同 C 都要平倉，因為佢哋仍然有全額風險，你瞓著咗冇人管。

## 10.4 留 Bracket 嘅實際設定（IBKR 例子）

:::steps
1. 入場時已經係 Bracket：父單 Buy、子單 Stop + Limit（Target），有效期 **DAY**。
2. 到 +1R：拖 Stop 單到入場價（或者改價）。
3. 11:30 決定留 → 再加一張提醒：15:50 手機鬧鐘。
4. 15:50 未成交：手動平倉（DAY 單 16:00 收市會自動取消，但倉位唔會自動平，所以一定要平）。
:::

:::warn DAY 單取消 ≠ 平倉
好多新手以為「單係 DAY，收市自動冇咗」就安全。其實取消嘅只係 Stop 同 Target 單，你嘅股票仍然喺戶口，會變成過夜持倉，冇任何 Stop 保護。
:::

[[quiz:l15-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l15-c11', num: '11', title: '你嘅 2 小時 Playbook：辨認練習同 30 次紀錄', mins: 12,
  summary: '一頁紙 Playbook：選股三個條件、A+ 過濾、四個 Setup 嘅優先次序、收工規則。先練辨認，再用 Paper Trading 記 30 次，計返自己嘅平均 R，先決定用唔用真錢。',
  keywords: ['Playbook', '練習', 'Paper Trading'],
  md: `
## 11.1 一頁紙 Playbook

| 步驟 | 內容 |
|---|---|
| **選股**（開市前） | 每日報告 Long 專區：做多 + 📈 日線升勢 + 盤前 RVOL ≥ 2。揀 2–3 隻，設警報 |
| **許可**（開市後） | 首 5 分鐘成交 ≥ 平時 2 倍；QQQ 喺 VWAP 上面 |
| **Setup 優先次序** | ① Flat Top　② EMA 9 回調　③ Bull Flag　④ 30 分鐘 ORB |
| **唔做** | 一開市追 PDH 突破；頭 5 分鐘入場；QQQ 喺 VWAP 下面；Gap 低開撈底 |
| **落單** | Buy Stop Limit + Bracket（Stop、Target 2R）；股數用落單卡計 |
| **管理** | +1R 移 Stop 返入場價；一朝最多 2 筆 |
| **收工** | 11:30：未到 +1R 就平倉；已經保本可以留 Bracket |

[[check:l15-playbook]]

## 11.2 辨認練習（只有做多 Setup）

圖上有 11:30 收工線。睇到觸發之前，揀係邊個 Setup：

[[widget:l15-spot]]

## 11.3 由練習到真錢

:::steps
1. 辨認練習 **50 題**，準確度 70% 以上
2. 每晚用報告嘅 Long 專區 + TradingView 睇開市，**唔落單**，記低見到咩 Setup、結果點（5 個交易日）
3. **Paper Trading 30 次**：只做四個主力 Setup，記入交易日誌（Setup 名、有冇 A+、R）
4. 計自己嘅平均 R（扣 0.05R 成本）：正數先考慮真錢，由每筆 0.25% 風險開始（Level 11）
:::

[[link:tools/open-cockpit|🛫 開市前計劃表]]

[[link:tools/bracket-ticket|⚡ 交易一頁通（落單卡）]]

:::coach 最後提醒
數據入面最好嘅組合（升勢 + A+ 嘅 Flat Top）平均都只係 +0.25R 一次，而且只有 63 個樣本。呢個係一個**值得用 Paper Trading 驗證嘅假設**，唔係保證。真正嘅 Edge 要靠你自己嘅 30 次、100 次紀錄去證明。
:::

[[quiz:l15-final]]

## 11.4 30 次紀錄應該記乜？範本

| 欄位 | 例子 |
|---|---|
| 日期／股票 | 2026-11-05／NVDA |
| Setup | Flat Top |
| 日線 | 📈 |
| A+（量／QQQ） | 2.5 倍 ✔／上面 ✔ |
| 入場／Stop／Target | 187.41／186.75／188.73 |
| 實際成交 | 187.43（滑價 $0.02） |
| 結果 | +2.0R |
| 收工方式 | 到 Target |
| 有冇跟規則 | ✔ |
| 備註 | 11:00 20 日高位停咗 5 分鐘 |

30 次之後，按 Setup 同「有冇 A+」分組計平均 R。如果「有 A+」明顯好過「冇 A+」，就證明過濾喺你手上都有效。

## 11.5 自己嘅數字點樣同統計比較？

| 你嘅結果 | 可能原因 |
|---|---|
| 明顯好過統計 | 樣本太細、運氣；或者你嘅判斷真係加咗分（要再做 30 次確認） |
| 同統計差唔多 | 正常，代表你跟到規則 |
| 明顯差過統計 | 執行問題（追價、提早走、唔跟 Stop）；或者揀股同報告唔同 |

最重要係**執行同規則一致**。執行一致之後嘅結果，先有比較價值。

[[link:level/l16|➡️ 下一課：Level 16 Indicator 實戰]]

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l15-c1': { title: '小測：數據真相', questions: [
  { q: '數據顯示，日線升勢「本身」對頭 2 小時做多嘅幫助係？', options: ['好大', '差唔多冇分別', '一定蝕'], answer: 1, explain: '升勢股同全部股嘅基準差唔多。' },
  { q: 'A+ 過濾係指？', options: ['首 5 分鐘成交 ≥ 平時 2 倍 + QQQ 喺 VWAP 上面', 'P/E 低', '股價低過 $10'], answer: 0, explain: '開市量同大市方向。' },
  { q: '樣本少過 100 次嘅數字應該點睇？', options: ['當成事實', '當成假設，要自己驗證', '唔使理'], answer: 1, explain: '運氣影響大。' },
  { q: '數據入面一直蝕錢嘅做法係？', options: ['Flat Top', '一開市追 PDH 突破', 'EMA 9 回調'], answer: 1, explain: '全部條件下都係負數。' },
]},
'l15-c2': { title: '小測：Trend-up', questions: [
  { q: '日線升勢嘅定義？', options: ['昨收 > 20 日線 > 50 日線', '今日升咗', '股價過 $100'], answer: 0, explain: '同報告、統計用同一套。' },
  { q: '升勢股 Gap 高開，開市即買、11:30 賣，數據顯示？', options: ['九成賺', '輸多過贏（少過五成）', '一定蝕'], answer: 1, explain: '要等 Setup，唔好開市即買。' },
  { q: '「貼近高位」係指收市喺 20 日高位幾多之內？', options: ['5%', '25%', '50%'], answer: 0, explain: '加分條件。' },
]},
'l15-c3': { title: '小測：選股同過濾', questions: [
  { q: 'Long 專區優先列出？', options: ['做多 + 日線升勢 + 盤前 RVOL ≥ 2', '所有細價股', '跌得最多嘅股'], answer: 0, explain: '冇合格就寫冇，唔降低標準。' },
  { q: '首 5 分鐘成交夠唔夠，幾點先知？', options: ['08:00', '09:35', '收市'], answer: 1, explain: '第一支 5 分鐘 K 收市。' },
  { q: 'QQQ 喺 VWAP 下面，升勢股出現 Flat Top，應該？', options: ['照做', '唔做，A+ 過濾唔齊', '加注'], answer: 1, explain: '三樣齊先搵 Setup。' },
]},
'l15-c4': { title: '小測：時間表', questions: [
  { q: '09:30–09:35 應該？', options: ['即刻買', '唔落單，睇成交', '沽空'], answer: 1, explain: '5 分鐘 ORB 數據唔好。' },
  { q: 'Flat Top 通常喺幾時出現？', options: ['09:31', '10:15–11:30', '15:30'], answer: 1, explain: '要先升一段再整固。' },
  { q: '一朝最多做幾多筆？', options: ['2 筆', '10 筆', '冇限制'], answer: 0, explain: '兩筆都中 Stop 就收工。' },
]},
'l15-c5': { title: '小測：Flat Top', questions: [
  { q: 'Flat Top 嘅整固要求？', options: ['20 分鐘範圍 ≤ 0.25 ATR、貼住 HOD、喺 VWAP 上面', '跌穿 VWAP', '範圍越闊越好'], answer: 0, explain: '窄 = Stop 細。' },
  { q: '入場點？', options: ['Buy Stop 喺 HOD 上面', '整固中間市價買', '跌穿整固低位買'], answer: 0, explain: '突破先入。' },
  { q: 'Stop 放喺？', options: ['整固低位下面', '開市價', '昨日低位'], answer: 0, explain: '跌穿整固就錯。' },
]},
'l15-c6': { title: '小測：EMA 9 回調', questions: [
  { q: 'EMA 9 回調嘅背景？', options: ['價格喺 VWAP 上面、EMA 9 向上', '價格喺 VWAP 下面', '橫行'], answer: 0, explain: '強勢延續。' },
  { q: '觸發係？', options: ['K 線掂 EMA 9 但收市守住，下一支升穿佢高位', '收市跌穿 EMA 9', '一開市'], answer: 0, explain: '用 Buy Stop。' },
  { q: '冇 A+ 過濾，呢個 Setup 嘅平均 R 大約？', options: ['+1R', '0 附近', '−1R'], answer: 1, explain: '要開市量夠 + QQQ 配合。' },
]},
'l15-c7': { title: '小測：Bull Flag', questions: [
  { q: 'Bull Flag 入面回調唔可以？', options: ['收穿 VWAP', '成交縮細', '回 0.2 ATR'], answer: 0, explain: '收穿 VWAP = 推動失敗。' },
  { q: '升勢股邊種開市嘅 Bull Flag 數據最差？', options: ['Gap 高開', 'Gap 低開', '冇分別'], answer: 1, explain: '低開日反彈行唔遠。' },
  { q: '呢個 Setup 賺錢 % 只有四成幾，點解仲可以做？', options: ['因為贏嗰次去到 2R', '因為唔使 Stop', '因為一定贏'], answer: 0, explain: '所以唔可以贏 1R 就走。' },
]},
'l15-c8': { title: '小測：ORB', questions: [
  { q: '三種 ORB 入面，升勢股做多數據最差嘅係？', options: ['5 分鐘', '30 分鐘', '一樣'], answer: 0, explain: '開市頭幾分鐘太亂。' },
  { q: '30 分鐘 ORB 幾時先考慮？', options: ['任何時候', '升勢 + A+ 過濾齊', 'QQQ 跌緊'], answer: 1, explain: '單獨用差唔多打和。' },
  { q: '有 Flat Top 同 ORB 同時出現，優先做？', options: ['Flat Top', 'ORB', '兩個都唔做'], answer: 0, explain: 'Stop 細、數據好。' },
]},
'l15-c9': { title: '小測：唔好做', questions: [
  { q: '點解一開市追 PDH 突破容易蝕？', options: ['PDH 多人放賣單，升到嗰度已經升咗一段', '交易所唔俾', '冇成交'], answer: 0, explain: '假突破多。' },
  { q: 'PDH 最好點用？', options: ['當入場訊號', '當參考位：過咗之後喺上面整固先入', '唔理'], answer: 1, explain: 'Flat Top 嘅數據好好多。' },
  { q: '升勢股 Gap 低開，新手應該？', options: ['撈底', '唔建議做', '加大注碼'], answer: 1, explain: 'Setup 成績差。' },
]},
'l15-c10': { title: '小測：出場同收工', questions: [
  { q: '11:30 未到 +1R，建議？', options: ['留全額風險嘅單去瞓', '平倉收工', '加注'], answer: 1, explain: '唔好留全額風險瞓覺。' },
  { q: '到 +1R 應該？', options: ['Stop 移返入場價', '取消 Stop', 'Target 移近'], answer: 0, explain: '最差打和。' },
  { q: '數據顯示主力 Setup 留 Bracket 到收市，比 11:30 平倉？', options: ['通常好少少', '差好多', '一樣'], answer: 0, explain: '但要已經保本先留。' },
]},
'l15-final': { title: 'Level 15 總測驗', questions: [
  { q: '10:40，一隻日線升勢股開市量係平時 3 倍，QQQ 喺 VWAP 上面，價格喺 HOD 下面窄幅橫行 25 分鐘。計劃？', options: ['Buy Stop 喺 HOD 上面，Stop 喺整固低位，Target 2R', '市價即買', '沽空'], answer: 0, explain: 'Flat Top + A+。' },
  { q: '09:40，升勢股急升到昨日高位，啱啱穿過。應該？', options: ['追入', '唔追，等佢喺上面整固或者回調', '加注追'], answer: 1, explain: '追 PDH 突破數據係負數。' },
  { q: '首 5 分鐘成交只有平時 0.8 倍，但出現 Bull Flag。應該？', options: ['照做', '唔做，A+ 過濾唔齊', '加注'], answer: 1, explain: '量唔夠。' },
  { q: '11:45 見到靚 Setup，應該？', options: ['做', '唔做，已經過咗 11:30', '做兩倍'], answer: 1, explain: '11:30 後唔開新倉。' },
  { q: '數據入面最好嘅組合，應該當成？', options: ['保證賺', '值得用 Paper Trading 驗證嘅假設', '唔使理'], answer: 1, explain: '樣本少，要自己記錄 30 次。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l15-premarket': { title: 'Long 專區：開市前同開市後', items: [
  '報告 Long 專區揀 2–3 隻：做多 + 📈 日線升勢 + 盤前 RVOL ≥ 2',
  '每隻記低：要見首 5 分鐘成交幾多、盤前高、昨日高（PDH）',
  '設警報：盤前高、HOD',
  '09:35：首 5 分鐘成交 ≥ 平時 2 倍？唔夠就刪',
  '入場前：QQQ 喺自己 VWAP 上面？',
  '三樣齊先搵 Setup',
]},
'l15-playbook': { title: '我嘅 2 小時 Playbook', items: [
  '只做多、只做日線升勢股',
  '09:30–09:35 唔落單',
  'Setup 優先：Flat Top → EMA 9 回調 → Bull Flag → 30 分鐘 ORB',
  '唔追 PDH 突破、唔撈 Gap 低開',
  '入場即落 Bracket：Stop + Target 2R',
  '+1R 移 Stop 返入場價',
  '一朝最多 2 筆',
  '11:30 收工：未保本就平倉',
]},
});

window.GLOSSARY.push(
  { term: 'Trend-up Stock', zh: '日線升勢股', def: '昨日收市高過 20 日線，而且 20 日線高過 50 日線嘅股。每日報告嘅 Long 專區用呢個定義。', lv: 'l15' },
  { term: 'A+ Filter', zh: 'A+ 過濾', def: '入場許可：首 5 分鐘成交 ≥ 平時 2 倍，而且入場前 QQQ 喺自己 VWAP 上面。數據顯示佢比日線趨勢更影響做多 Setup 嘅成績。', lv: 'l15' },
  { term: 'Flat Top Breakout', zh: '高位整固突破', def: '價格喺全日高位下面窄幅橫行一段時間，之後升穿 HOD。Stop 放整固低位，風險細。', lv: 'l15' },
  { term: 'EMA 9 Pullback', zh: 'EMA 9 回調', def: '強勢股回調到 5 分鐘 EMA 9 就守住再升，係趨勢延續嘅入場位。', lv: 'l15' },
  { term: 'Long Focus', zh: 'Long 專區', def: '每日選股報告入面，專為「頭 2 小時、只做多、日線升勢」而設嘅候選名單。', lv: 'l15' },
);
