/* Level 17：名家打法 —— 著名 Day Trader 公開教嘅 Setup、選股同心法，加我哋自己嘅數據驗證 */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const L = window.SetupLab;
  if (!L) { console.warn('Level 17 需要先載入 Level 14'); return; }
  const { SET, hiOf, loOf, emaOf, esc, mk, rng, f2 } = L;
  const tsGet = (k, d) => { try { const u = Store.user(); return (u && u.toolState && u.toolState[k]) || d; } catch (e) { return d; } };
  const tsSet = (k, v) => { try { const u = Store.user(); if (!u) return; u.toolState = u.toolState || {}; u.toolState[k] = v; Store.save(); } catch (e) {} };

  /* 真實統計（scripts/research/famous-setups-stats.mjs 用 Alpaca 5 分鐘 K 線計，只係統計數字） */
  const STATS = {"from":"2024-01-01","to":"2026-11-06","universe":["TSLA","NVDA","AAPL","AMD","META","AMZN","MSFT","GOOGL","AVGO","NFLX","PLTR","COIN","MU","SMCI","MSTR","HOOD","ARM","INTC","ORCL","CRM","ADBE","SHOP","UBER","ABNB","SNOW","CRWD","PANW","NET","DDOG","MRVL","QCOM","LRCX","AMAT","ROKU","PYPL","RIVN","SOFI","AFRM","UPST","BABA","PDD","DIS","BA","NKE","SBUX","LLY","UNH","CVNA","DKNG","RBLX"],"source":"Alpaca SIP 5 分鐘 K 線（正常交易時段）","daysAll":32618,"daysInPlay":7037,"rules":{"note":"以下係我哋將公開資料寫成固定機械規則嘅簡化版本，唔等於嗰位 Trader 本人嘅做法；全部只做多；股票係 50 隻成交大嘅美股（唔係細價股）","inPlay":"Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍","aplus":"首 5 分鐘成交 ≥ 平時 2 倍，而且入場前一支 5 分鐘 K 收市時 QQQ 喺自己 VWAP 上面","exit":"Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉。同一支 K 掂 Stop 同 Target 當 Stop","cost":"扣成本後 = 平均 R 減 0.05R","gapGo":"Gap 高開 ≥ 4%；首 5 分鐘 K 波幅 ≤ 1 ATR；10:00 前升穿首 5 分鐘高位入場；Stop 放首 5 分鐘低位","abcd":"有人關注嘅日子；開市後升至少 0.5 ATR（B）；回調至少 0.2 ATR 但冇跌返升幅 60% 以上；有一支 K 唔再創新低（C 守住）。C 位版：升穿嗰支 K 高位入場；B 位版：升穿 B 入場；Stop 都放 C 下面","holyGrail":"5 分鐘圖 ADX(14) ≥ 30 而且 +DI > −DI；之前 3 支 K 都喺 20 EMA 上面，第一次回調掂線；升穿掂線嗰支 K 高位入場；Stop 放嗰支 K 低位下面。ADX 同 EMA 跨日連續計","secondDay":"第一日：升 ≥ 4%、收喺全日波幅最高 25%、全日成交 ≥ 20 日平均 1.5 倍。第二日：開市唔低過第一日波幅中間；15 分鐘 ORB 做多","nr7":"NR7 = 昨日波幅係最近 7 日最細","crabel":"Stretch = 過去 10 日「開市價到較近嗰邊高低位」嘅平均距離（呢個定義嚟自二手資料）；開市價 + Stretch 入場，Stop 放開市價 − Stretch","ep":"Gap 高開 ≥ 8%、首 5 分鐘成交 ≥ 平時 3 倍；10:00 前升穿首 5 分鐘高位入場；Stop 放入場前嘅當日低位（風險 ≤ 1.5 ATR）","kqBreakout":"昨收比 60 日內最低位高 ≥ 30%；最近 10 日高低差 ≤ 4 ATR、最近 5 日平均波幅 ≤ 之前 20 日嘅 85%；整固高位唔係最近 2 日先出現；昨收 > 10 日線 > 20 日線；11:30 前升穿整固高位（同首 5 分鐘高位）入場；Stop 放當日低位（風險 ≤ 1 ATR）","swing":"波段出場：初始 Stop；第 3 日收市如果有賺就賣一半、Stop 移到入場價；其餘等日線收市跌穿 10 日線先走；最多 40 日。單位 R"},"baseline":{"secondDay":{"note":"第一日大升收高之後，第二日開市買、收市賣（冇 Stop），單位 ATR","after":{"n":624,"up":50,"avgAtr":0.02},"other":{"n":31994,"up":49.8,"avgAtr":0}},"nr7Range":{"note":"當日高低波幅 ÷ 14 日 ATR","nr7":{"n":4841,"avg":0.85,"med":0.76},"other":{"n":27777,"avg":0.94,"med":0.84}}},"setups":{"gapGo":{"name":"Gap & Go：Gap 高開 ≥ 4%，升穿首 5 分鐘高位（Ross Cameron 式，大型股版）","all":{"n":387,"win":40.6,"target":8.5,"stop":41.9,"avgR":-0.08,"avgRCost":-0.13,"avgREod":-0.04,"avgRClose":-0.06},"aplus":{"n":102,"win":46.1,"target":7.8,"stop":32.4,"avgR":0,"avgRCost":-0.05,"avgREod":0.13,"avgRClose":0.18},"up":{"n":112,"win":36.6,"target":9.8,"stop":43.8,"avgR":-0.15,"avgRCost":-0.2,"avgREod":-0.07,"avgRClose":-0.16},"upAplus":{"n":30,"win":36.7,"target":10,"stop":36.7,"avgR":-0.08,"avgRCost":-0.13,"avgREod":0.08,"avgRClose":0.02},"nr7":{"n":46,"win":26.1,"target":2.2,"stop":69.6,"avgR":-0.49,"avgRCost":-0.54,"avgREod":-0.51,"avgRClose":-0.62},"notNr7":{"n":341,"win":42.5,"target":9.4,"stop":38.1,"avgR":-0.02,"avgRCost":-0.07,"avgREod":0.02,"avgRClose":0.02}},"abcdC":{"name":"ABCD：喺 C 位（回調守住）入場（Andrew Aziz）","all":{"n":804,"win":39.1,"target":13.7,"stop":46.8,"avgR":-0.07,"avgRCost":-0.12,"avgREod":-0.06,"avgRClose":-0.02},"aplus":{"n":238,"win":39.9,"target":16.4,"stop":45.8,"avgR":-0.03,"avgRCost":-0.08,"avgREod":0.02,"avgRClose":-0.04},"up":{"n":292,"win":35.6,"target":15.8,"stop":50.7,"avgR":-0.11,"avgRCost":-0.16,"avgREod":-0.09,"avgRClose":0.07},"upAplus":{"n":94,"win":37.2,"target":21.3,"stop":50,"avgR":0,"avgRCost":-0.05,"avgREod":0.09,"avgRClose":0.19},"nr7":{"n":80,"win":36.3,"target":12.5,"stop":50,"avgR":-0.13,"avgRCost":-0.18,"avgREod":-0.14,"avgRClose":0.04},"notNr7":{"n":724,"win":39.4,"target":13.8,"stop":46.4,"avgR":-0.06,"avgRCost":-0.11,"avgREod":-0.05,"avgRClose":-0.03}},"abcdD":{"name":"ABCD：等升穿 B 位先入場（Andrew Aziz）","all":{"n":509,"win":50.9,"target":6.7,"stop":23.4,"avgR":0.04,"avgRCost":-0.01,"avgREod":0.07,"avgRClose":0.07},"aplus":{"n":165,"win":50.3,"target":9.1,"stop":19.4,"avgR":0.1,"avgRCost":0.05,"avgREod":0.09,"avgRClose":0.05},"up":{"n":181,"win":54.1,"target":10.5,"stop":28.2,"avgR":0.1,"avgRCost":0.05,"avgREod":0.15,"avgRClose":0.22},"upAplus":{"n":65,"win":55.4,"target":13.8,"stop":21.5,"avgR":0.23,"avgRCost":0.18,"avgREod":0.42,"avgRClose":0.4},"nr7":{"n":48,"win":52.1,"target":4.2,"stop":29.2,"avgR":-0.03,"avgRCost":-0.08,"avgREod":0.24,"avgRClose":0.36},"notNr7":{"n":461,"win":50.8,"target":6.9,"stop":22.8,"avgR":0.05,"avgRCost":0,"avgREod":0.05,"avgRClose":0.04}},"holyGrail":{"name":"Holy Grail：ADX ≥ 30，第一次回調到 20 EMA（Linda Raschke）","all":{"n":2730,"win":44.8,"target":9.3,"stop":35.9,"avgR":-0.02,"avgRCost":-0.07,"avgREod":-0.02,"avgRClose":-0.01},"aplus":{"n":124,"win":36.3,"target":8.9,"stop":40.3,"avgR":-0.16,"avgRCost":-0.21,"avgREod":-0.23,"avgRClose":-0.25},"up":{"n":1003,"win":43.7,"target":10.3,"stop":38,"avgR":-0.03,"avgRCost":-0.08,"avgREod":0.04,"avgRClose":0.04},"upAplus":{"n":54,"win":27.8,"target":9.3,"stop":46.3,"avgR":-0.26,"avgRCost":-0.31,"avgREod":-0.32,"avgRClose":-0.62},"nr7":{"n":357,"win":43.1,"target":10.4,"stop":38.4,"avgR":-0.06,"avgRCost":-0.11,"avgREod":-0.07,"avgRClose":-0.1},"notNr7":{"n":2373,"win":45,"target":9.2,"stop":35.6,"avgR":-0.01,"avgRCost":-0.06,"avgREod":-0.01,"avgRClose":0}},"secondDay":{"name":"Second Day Play：第一日大升收高，第二日 15 分鐘 ORB（SMB Capital）","all":{"n":191,"win":48.7,"target":2.6,"stop":25.7,"avgR":-0.06,"avgRCost":-0.11,"avgREod":-0.05,"avgRClose":-0.05},"aplus":{"n":26,"win":42.3,"target":3.8,"stop":23.1,"avgR":-0.18,"avgRCost":-0.23,"avgREod":-0.22,"avgRClose":-0.19},"up":{"n":90,"win":56.7,"target":1.1,"stop":17.8,"avgR":0.05,"avgRCost":0,"avgREod":0.1,"avgRClose":0.11},"upAplus":{"n":15,"win":46.7,"target":0,"stop":20,"avgR":-0.21,"avgRCost":-0.26,"avgREod":-0.23,"avgRClose":-0.23},"nr7":{"n":0},"notNr7":{"n":191,"win":48.7,"target":2.6,"stop":25.7,"avgR":-0.06,"avgRCost":-0.11,"avgREod":-0.05,"avgRClose":-0.05}},"orb30":{"name":"30 分鐘 ORB（所有日子；用嚟比較 NR7 前後）（Toby Crabel）","all":{"n":10689,"win":49.6,"target":1.2,"stop":9.4,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.02,"avgRClose":0.02},"aplus":{"n":293,"win":51.9,"target":2.4,"stop":6.1,"avgR":0.05,"avgRCost":0,"avgREod":0.14,"avgRClose":0.13},"up":{"n":3515,"win":49.3,"target":1.2,"stop":10.4,"avgR":0,"avgRCost":-0.05,"avgREod":-0.01,"avgRClose":-0.01},"upAplus":{"n":73,"win":61.6,"target":2.7,"stop":6.8,"avgR":0.14,"avgRCost":0.09,"avgREod":0.11,"avgRClose":0.09},"nr7":{"n":1557,"win":50.4,"target":1.6,"stop":11,"avgR":0.02,"avgRCost":-0.03,"avgREod":0.02,"avgRClose":0.01},"notNr7":{"n":9132,"win":49.4,"target":1.1,"stop":9.1,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.01,"avgRClose":0.02}},"crabel":{"name":"Crabel ORB：開市價 + Stretch 入場（所有日子）（Toby Crabel）","all":{"n":21521,"win":42.9,"target":9.4,"stop":36.6,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.04,"avgRClose":-0.03},"aplus":{"n":269,"win":46.5,"target":8.9,"stop":30.5,"avgR":0.01,"avgRCost":-0.04,"avgREod":0.1,"avgRClose":0.05},"up":{"n":7476,"win":42.4,"target":10.2,"stop":38.9,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.05,"avgRClose":-0.04},"upAplus":{"n":76,"win":39.5,"target":10.5,"stop":36.8,"avgR":-0.07,"avgRCost":-0.12,"avgREod":-0.04,"avgRClose":-0.07},"nr7":{"n":3073,"win":43.8,"target":7.7,"stop":33.5,"avgR":-0.05,"avgRCost":-0.1,"avgREod":-0.05,"avgRClose":-0.08},"notNr7":{"n":18448,"win":42.8,"target":9.6,"stop":37.1,"avgR":-0.04,"avgRCost":-0.09,"avgREod":-0.03,"avgRClose":-0.02}},"ep":{"name":"Episodic Pivot：Gap ≥ 8% + 開市成交 ≥ 3 倍，升穿首 5 分鐘高位，Stop 放當日低位（Kullamägi）","all":{"n":61,"win":52.5,"target":8.2,"stop":27.9,"avgR":0.15,"avgRCost":0.1,"avgREod":0.25,"avgRClose":0.25,"swing":{"n":61,"win":36.1,"avgR":0.22,"medR":-1,"best":11.8,"worst":-1.38,"avgDays":3.92,"top3Share":1.96}},"aplus":{"n":32,"win":56.3,"target":9.4,"stop":28.1,"avgR":0.27,"avgRCost":0.22,"avgREod":0.42,"avgRClose":0.42,"swing":{"n":32,"win":43.8,"avgR":0.73,"medR":-1,"best":11.8,"worst":-1.38,"avgDays":4.94,"top3Share":1.12}},"up":{"n":26,"win":53.8,"target":15.4,"stop":38.5,"avgR":0.17,"avgRCost":0.12,"avgREod":0.22,"avgRClose":0.18,"swing":{"n":26,"win":23.1,"avgR":-0.37,"medR":-1,"best":2.67,"worst":-1.38,"avgDays":2.62,"top3Share":6770810159.51}},"upAplus":{"n":13,"win":53.8,"target":15.4,"stop":38.5,"avgR":0.18,"avgRCost":0.13,"avgREod":0.27,"avgRClose":0.22,"swing":{"n":13,"win":23.1,"avgR":-0.39,"medR":-1,"best":2.57,"worst":-1.38,"avgDays":2.54,"top3Share":5272237649.38}},"nr7":{"n":8,"win":25,"target":0,"stop":62.5,"avgR":-0.38,"avgRCost":-0.43,"avgREod":-0.26,"avgRClose":-0.32,"swing":{"n":8,"win":37.5,"avgR":-0.32,"medR":-1,"best":1.53,"worst":-1,"avgDays":2.25,"top3Share":2477689464.98}},"notNr7":{"n":53,"win":56.6,"target":9.4,"stop":22.6,"avgR":0.23,"avgRCost":0.18,"avgREod":0.32,"avgRClose":0.33,"swing":{"n":53,"win":35.8,"avgR":0.3,"medR":-1,"best":11.8,"worst":-1.38,"avgDays":4.17,"top3Share":1.65}}},"kqBreakout":{"name":"日線整固突破：大升後窄幅整固，升穿整固高位，Stop 放當日低位（Kullamägi）","all":{"n":51,"win":51,"target":2,"stop":19.6,"avgR":-0.06,"avgRCost":-0.11,"avgREod":0.06,"avgRClose":0.08,"swing":{"n":51,"win":37.3,"avgR":0.77,"medR":-1,"best":11.34,"worst":-3.38,"avgDays":4,"top3Share":0.74}},"aplus":{"n":0},"up":{"n":42,"win":42.9,"target":2.4,"stop":23.8,"avgR":-0.13,"avgRCost":-0.18,"avgREod":0.02,"avgRClose":0.04,"swing":{"n":42,"win":35.7,"avgR":0.9,"medR":-1,"best":11.34,"worst":-1.24,"avgDays":4.02,"top3Share":0.76}},"upAplus":{"n":0},"nr7":{"n":8,"win":37.5,"target":0,"stop":37.5,"avgR":-0.23,"avgRCost":-0.28,"avgREod":-0.53,"avgRClose":-0.53,"swing":{"n":8,"win":12.5,"avgR":-0.42,"medR":-1,"best":3.86,"worst":-1.24,"avgDays":1.38,"top3Share":1864495769.74}},"notNr7":{"n":43,"win":53.5,"target":2.3,"stop":16.3,"avgR":-0.03,"avgRCost":-0.08,"avgREod":0.17,"avgRClose":0.19,"swing":{"n":43,"win":41.9,"avgR":0.99,"medR":-1,"best":11.34,"worst":-3.38,"avgDays":4.49,"top3Share":0.68}}}}};

  /* ---------- 示意圖（全部做多；教學模擬） ---------- */
  SET.fmGapGo = {
    name: 'Gap & Go（Gap 高開，升穿首 5 分鐘高位）', side: 1,
    anchors: [[0, 0], [1, 0.1], [2, 0.16], [4, 0.36], [8, 0.62], [14, 0.85], [24, 1.0], [50, 1.15], [77, 1.2]],
    plan(B, A, s, P0) {
      const hi = B[0].h, lo = B[0].l;
      let k = 1; while (k < 12 && B[k].h <= hi) k++;
      return { k, entry: hi + 0.01, stop: lo - 0.01, pc: P0 - 0.9 * A, box: [0, 0, lo, hi], wait: '有消息，Gap 高開（灰色線係昨日收市）。首 5 分鐘 K 畫出一個細區間（紫色格）。', trig: '升穿首 5 分鐘 K 嘅高位。' };
    },
  };
  SET.fmAbcd = {
    name: 'ABCD（升 → 回調守住 → 再破頂）', side: 1,
    anchors: [[0, 0], [3, 0.3], [6, 0.66], [8, 0.52], [10, 0.4], [12, 0.45], [14, 0.5], [16, 0.72], [22, 1.02], [40, 1.15], [77, 1.25]],
    plan(B, A) {
      const b = hiOf(B, 0, 8), c = loOf(B, 8, 13);
      let k = 13; while (k < 30 && B[k].h <= b) k++;
      return { k, entry: b + 0.01, stop: c - 0.02 * A, lines: [['B', b, '#0ea5e9'], ['C', c, '#f59e0b']], wait: 'A 係開市起步；急升到 B（藍色線，全日新高）之後回調。回調冇跌返一半以上，喺 C（橙色線）守住。', trig: '保守做法：等價格升穿 B 先入場（D 段開始）。Stop 放 C 下面。' };
    },
  };
  SET.fmHoly = {
    name: 'Holy Grail（強趨勢第一次回調到 20 EMA）', side: 1,
    anchors: [[0, 0], [4, 0.42], [8, 0.78], [11, 0.98], [14, 0.82], [17, 0.66], [18, 0.7], [20, 0.92], [26, 1.2], [45, 1.4], [77, 1.5]],
    plan(B, A) {
      const em = emaOf(B, 20); let i = 17, best = Infinity;
      for (let k = 15; k <= 19; k++) { const d = B[k].l - em[k]; if (d < best) { best = d; i = k; } }
      B[i].l = Math.min(B[i].l, +em[i].toFixed(2));
      return { k: i + 1, entry: B[i].h + 0.01, stop: Math.min(B[i].l, em[i]) - 0.03 * A, ema: 20, wait: '趨勢好強（ADX 高過 30），價格一路喺 20 EMA（紫色線）上面，離線好遠。', trig: '第一次回調掂到 20 EMA；下一支 K 升穿掂線嗰支 K 嘅高位。' };
    },
  };
  SET.fmSecond = {
    name: 'Second Day Play（第一日大升收高，第二日延續）', side: 1,
    anchors: [[0, 0], [1, 0.1], [2, 0.03], [4, 0.14], [6, 0.3], [10, 0.5], [18, 0.75], [30, 0.9], [77, 1.05]],
    plan(B, A, s, P0) {
      const hi = hiOf(B, 0, 2), lo = loOf(B, 0, 2);
      let k = 3; while (k < 20 && B[k].h <= hi) k++;
      return { k, entry: hi + 0.01, stop: lo - 0.01, pc: P0 - 0.08 * A, box: [0, 2, lo, hi], lines: [['昨日高', P0 + 0.05 * A, '#0ea5e9']], wait: '昨日（第一日）有消息大升、收喺高位。今日開市冇跌返落去，頭 15 分鐘喺昨日高位附近企穩（紫色格）。', trig: '升穿頭 15 分鐘區間高位。' };
    },
  };
  const D = { longOnly: true, amLine: true };
  [['gapgo', 'fmGapGo'], ['abcd', 'fmAbcd'], ['holy', 'fmHoly'], ['second', 'fmSecond']].forEach(([id, key]) => { window.WIDGETS_EXTRA['l17-d-' + id] = L.diagram(key, D); });
  window.WIDGETS_EXTRA['l17-spot'] = L.spot(['fmGapGo', 'fmAbcd', 'fmHoly', 'fmSecond', 'amFlat', 'flag'].filter((k) => SET[k]), 'l17-spot', true);

  /* ---------- 統計：每個 Setup 嘅小卡 + 總表 ---------- */
  const sg = (v) => (v == null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2));
  const cls = (v) => (v == null ? '' : v >= 0 ? 'pos' : 'neg');
  const VIEWS = [['all', '全部'], ['aplus', 'A+ 過濾'], ['up', '日線升勢'], ['upAplus', '升勢 + A+']];
  const kpi = (key) => (el) => {
    const s = STATS && STATS.setups[key];
    if (!s) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    const cell = ([k, t]) => { const g = s[k]; return `<div><span>${t}</span>${g && g.n ? `<b class="${cls(g.avgR)}">${sg(g.avgR)}R</b><small>${g.n.toLocaleString()} 次${g.n < 100 ? ' ⚠️' : ''}｜賺錢 ${g.win}%</small>` : '<b>—</b><small>冇樣本</small>'}</div>`; };
    el.innerHTML = `<div class="l11-w"><p class="l17-kt"><b>我哋嘅測試：</b>${esc(s.name)}</p><div class="l11-kpis">${VIEWS.map(cell).join('')}</div>
      <p class="muted">平均 R = 每次用 1R 風險，平均賺蝕幾多（Target 2R、Stop、11:30 平倉）。⚠️ = 少過 100 次，運氣影響大。規則：${esc(STATS.rules[RULE[key]] || '')}。</p></div>`;
  };
  const RULE = { gapGo: 'gapGo', abcdC: 'abcd', abcdD: 'abcd', holyGrail: 'holyGrail', secondDay: 'secondDay', orb30: 'nr7', crabel: 'crabel', ep: 'ep', kqBreakout: 'kqBreakout' };
  Object.keys(RULE).forEach((k) => { window.WIDGETS_EXTRA['l17-k-' + k] = kpi(k); });

  const SHORT = { abcdD: 'ABCD：等升穿 B（Aziz）', abcdC: 'ABCD：C 位入（Aziz）', gapGo: 'Gap & Go ≥ 4%（Cameron 式）', ep: 'Episodic Pivot（Kullamägi）', holyGrail: 'Holy Grail（Raschke）', secondDay: 'Second Day Play（SMB）', orb30: '30 分鐘 ORB，所有日子（Crabel）', crabel: 'Stretch ORB（Crabel）', kqBreakout: '日線整固突破（Kullamägi）' };
  const ORDER = ['abcdD', 'abcdC', 'gapGo', 'ep', 'holyGrail', 'secondDay', 'orb30', 'crabel', 'kqBreakout'];
  window.WIDGETS_EXTRA['l17-stats'] = (el) => {
    if (!STATS || !STATS.setups) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    let view = 'all';
    const draw = () => {
      const row = (k) => { const s = STATS.setups[k], g = s && s[view]; if (!s) return ''; if (!g || !g.n) return `<tr><th scope="row">${esc(SHORT[k])}</th><td colspan="6">—</td></tr>`;
        return `<tr class="${g.n < 100 ? 'l15-few' : ''}"><th scope="row">${esc(SHORT[k])}</th><td>${g.n.toLocaleString()}${g.n < 100 ? ' ⚠️' : ''}</td><td>${g.win}%</td><td>${g.target}%</td><td class="${cls(g.avgR)}">${sg(g.avgR)}</td><td class="${cls(g.avgRCost)}">${sg(g.avgRCost)}</td><td class="${cls(g.avgREod)}">${sg(g.avgREod)}</td></tr>`; };
      const sw = (k) => { const s = STATS.setups[k], w = s && s.all.swing; if (!w) return ''; const tot = w.avgR * w.n, top = tot * w.top3Share;
        return `<tr class="l15-few"><th scope="row">${esc(SHORT[k])}</th><td>${w.n} ⚠️</td><td>${w.win}%</td><td class="${cls(w.avgR)}">${sg(w.avgR)}</td><td class="${cls(w.medR)}">${sg(w.medR)}</td><td class="pos">${sg(w.best)}</td><td>${w.avgDays} 日</td><td>${sg(top)}R／${sg(tot - top)}R</td></tr>`; };
      const b = STATS.baseline;
      el.innerHTML = `<div class="l11-w"><div class="l13-tabs">${VIEWS.map(([k, t]) => `<button class="btn sm ${k === view ? 'primary' : ''}" data-v="${k}">${t}</button>`).join('')}</div>
        <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>名家 Setup（機械版本，做多）</th><th>次數</th><th>賺錢 %</th><th>到 2R %</th><th>平均 R（11:30 平倉）</th><th>扣成本後</th><th>平均 R（Bracket 留到收市）</th></tr></thead><tbody>${ORDER.map(row).join('')}</tbody></table></div>
        <h4 class="l17-h">波段出場（Kullamägi 式：賣一半 + 10 日線 Trailing）</h4>
        <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>Setup</th><th>次數</th><th>賺錢 %</th><th>平均 R</th><th>中位數 R</th><th>最好一筆</th><th>平均持有</th><th>最大 3 筆／其餘合計</th></tr></thead><tbody>${sw('ep')}${sw('kqBreakout')}</tbody></table></div>
        <h4 class="l17-h">兩個「講法」嘅直接檢查</h4>
        <ul class="l12-sig"><li><b>「大升收高之後第二日會延續」</b>：第二日開市買、收市賣，升嘅機會 ${b.secondDay.after.up}%（${b.secondDay.after.n} 日），其他日子 ${b.secondDay.other.up}%。</li>
        <li><b>「NR7 之後波幅會擴大」</b>：NR7 之後當日波幅平均係 ${b.nr7Range.nr7.avg} ATR（${b.nr7Range.nr7.n.toLocaleString()} 日），其他日子 ${b.nr7Range.other.avg} ATR。30 分鐘 ORB 喺 NR7 之後平均 ${sg(STATS.setups.orb30.nr7.avgR)}R，其他日子 ${sg(STATS.setups.orb30.notNr7.avgR)}R。</li></ul>
        <p class="muted">⚠️ = 少過 100 次，運氣影響大。<b>A+ 過濾</b> = ${esc(STATS.rules.aplus)}。數據：${esc(STATS.source)}，${esc(STATS.from)} 至 ${esc(STATS.to)}，${STATS.universe.length} 隻成交大嘅美股，共 ${STATS.daysAll.toLocaleString()} 個交易日（有人關注嘅 ${STATS.daysInPlay.toLocaleString()} 日）。${esc(STATS.rules.exit)}。${esc(STATS.rules.swing)}。<b>${esc(STATS.rules.note)}</b>。過去統計唔代表將來。</p></div>`;
      el.querySelectorAll('[data-v]').forEach((x) => x.addEventListener('click', () => { view = x.dataset.v; draw(); }));
    };
    draw();
  };

  /* ---------- Kullamägi 日線突破示意圖（日線 K，模擬） ---------- */
  window.WIDGETS_EXTRA['l17-kq'] = (el) => {
    let seed = 41, stage = 0;
    const steps = ['① 大升一段', '② 窄幅整固', '③ 突破日入場', '④ 揸住同出場'];
    const gen = () => {
      const r = rng(seed); const g = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const P = 20 + Math.round(r() * 80); const B = []; let c = P;
      const push = (ret, vol, rg) => { const o = c * (1 + g() * 0.003); c = c * (1 + ret); const h = Math.max(o, c) * (1 + Math.abs(g()) * rg), l = Math.min(o, c) * (1 - Math.abs(g()) * rg); B.push({ o, h, l, c, v: vol * (0.8 + r() * 0.4) }); };
      for (let i = 0; i < 18; i++) push(g() * 0.012, 1, 0.008);
      for (let i = 0; i < 14; i++) push(0.026 + g() * 0.018, 1.8, 0.012);
      const top = B.length - 1;
      for (let i = 0; i < 11; i++) push((i < 3 ? -0.012 : 0.003) + g() * (0.012 - i * 0.0008), 0.9 - i * 0.04, 0.007 - i * 0.0004);
      const i0 = B.length; const pivot = Math.max(...B.slice(top - 1).map((b) => b.h));
      // 突破日
      { const o = c * 1.004; const lo = o * 0.992; c = Math.max(pivot * 1.035, o * 1.05); B.push({ o, h: c * 1.006, l: lo, c, v: 3.2 }); }
      const fail = r() < 0.45;
      if (fail) { for (let i = 0; i < 4; i++) push(-0.024 + g() * 0.008, 1.6, 0.01); for (let i = 0; i < 18; i++) push(-0.002 + g() * 0.014, 1.0, 0.009); }
      else { for (let i = 0; i < 16; i++) push(0.014 + g() * 0.016, 1.5, 0.01); for (let i = 0; i < 6; i++) push(-0.022 + g() * 0.01, 1.2, 0.01); }
      const sma = (n) => B.map((_, i) => (i >= n - 1 ? B.slice(i - n + 1, i + 1).reduce((a, b) => a + b.c, 0) / n : null));
      const s10 = sma(10), s20 = sma(20);
      const entry = pivot + 0.01, stop = B[i0].l - 0.01, risk = entry - stop;
      let half = null, exit = B.length - 1, stopped = false, st = stop;
      for (let i = i0 + 1; i < B.length; i++) { if (B[i].l <= st) { exit = i; stopped = true; break; } if (i === i0 + 3 && B[i].c > entry) { half = i; st = entry; } if (B[i].c < s10[i]) { exit = i; break; } }
      const R = (px) => (px - entry) / risk;
      const rExit = stopped ? R(st) : R(B[exit].c);
      const res = half != null ? 0.5 * R(B[half].c) + 0.5 * rExit : rExit;
      return { B, s10, s20, top, i0, pivot, entry, stop, risk, half, exit, stopped, res, rHalf: half != null ? R(B[half].c) : null, rExit };
    };
    const render = () => {
      const X = gen(), B = X.B, n = stage === 0 ? X.top + 1 : stage === 1 ? X.i0 : stage === 2 ? X.i0 + 1 : B.length;
      const W = 800, H = 330, m = { l: 8, r: 84, t: 14, b: 22 }, step = (W - m.l - m.r) / B.length;
      let lo = Math.min(...B.map((b) => b.l)), hi = Math.max(...B.map((b) => b.h)); const pd = (hi - lo) * 0.05; lo -= pd; hi += pd;
      const y = (p) => m.t + (hi - p) / (hi - lo) * (H - m.t - m.b), x = (i) => m.l + step * i + step / 2;
      const txt = [
        `股價喺 1–3 個月內大升一段（呢個例子升咗約 ${Math.round((B[X.top].c / B[17].c - 1) * 100)}%）。呢啲係市場上最強嘅股。唔好追，等佢休息。`,
        '升完之後橫行整固：波幅越嚟越窄、低位一個比一個高，貼住 10 日線（紫色）同 20 日線（藍色虛線）。整固高位（橙色線）就係突破位。',
        `突破日：升穿整固高位入場（佢會用開市頭 1、5 或 60 分鐘高位做觸發）。Entry ${f2(X.entry)}｜Stop 放<b>當日低位</b> ${f2(X.stop)}（每股風險 ${f2(X.risk)}）。`,
        X.stopped && X.half == null
          ? `突破之後冇跟進，${X.exit - X.i0} 日後跌穿 Stop：合計 ${X.res.toFixed(1)}R。<span class="muted">真實數據入面過半數突破係咁收場，所以每次只輸 1R 好重要。撳「另一個例子」睇成功嘅情況。</span>`
          : `揸 3–5 日後賣一部分（呢度第 3 日賣一半：${X.rHalf == null ? '冇賺，唔賣' : (X.rHalf >= 0 ? '+' : '') + X.rHalf.toFixed(1) + 'R'}），Stop 移返入場價；其餘${X.stopped ? '跌返入場價，打和走' : '等<b>日線收市跌穿 10 日線</b>先走'}（${(X.rExit >= 0 ? '+' : '') + X.rExit.toFixed(1)}R）。合計 ${(X.res >= 0 ? '+' : '') + X.res.toFixed(1)}R。<span class="muted">呢啲大贏家係少數；真實數據入面過半數突破係細蝕收場。</span>`,
      ];
      el.innerHTML = `<div class="l10-w"><div class="l10-bar">${steps.map((t, i) => `<button class="btn sm ${i === stage ? 'primary' : ''}" data-st="${i}">${t}</button>`).join('')}<button class="btn sm ghost" data-new>另一個例子</button></div><div class="l12-chart" data-c></div><p class="l10-read">${txt[stage]}</p></div>`;
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': '日線整固突破示意圖' });
      for (let k = 0; k <= 4; k++) { const p = lo + (hi - lo) * k / 4; mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg); }
      if (n < B.length) mk('rect', { x: m.l + step * n, y: m.t - 6, width: step * (B.length - n), height: H - m.t - m.b + 6, class: 'l12-future' }, svg);
      if (stage >= 1) mk('rect', { x: m.l + step * (X.top + 1), y: y(X.pivot), width: step * (X.i0 - X.top - 1), height: Math.max(2, y(Math.min(...B.slice(X.top + 1, X.i0).map((b) => b.l))) - y(X.pivot)), class: 'l14-box' }, svg);
      const tag = (name, p, col) => { mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), style: `stroke:${col};stroke-width:1.4;stroke-dasharray:6 4` }, svg); const gg = mk('g', {}, svg); mk('rect', { x: W - m.r + 1, y: y(p) - 9, width: m.r - 2, height: 18, rx: 4, style: `fill:${col}` }, gg); const t = mk('text', { x: W - m.r + 4, y: y(p) + 4, class: 'tag-text' }, gg); t.textContent = `${name} ${p.toFixed(2)}`; };
      if (stage >= 1) tag(stage >= 2 ? 'Entry' : '突破位', X.pivot, stage >= 2 ? '#7c3aed' : '#f59e0b');
      if (stage >= 2) tag('Stop', X.stop, '#dc2626');
      const bw = Math.max(1.6, step * 0.64);
      B.slice(0, n).forEach((b, i) => { const gg = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg); mk('line', { x1: x(i), x2: x(i), y1: y(b.h), y2: y(b.l), class: 'wick' }, gg); const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c)); mk('rect', { x: x(i) - bw / 2, y: top, width: bw, height: Math.max(1.2, bot - top), class: 'body' }, gg); });
      const line = (S, c2) => { const pts = S.map((v, i) => (v == null || i >= n ? null : x(i) + ',' + y(v))).filter(Boolean); if (pts.length > 1) mk('polyline', { points: pts.join(' '), class: c2 }, svg); };
      line(X.s10, 'l10-ema'); line(X.s20, 'l16-e20');
      const a = mk('text', { x: m.l + 6, y: m.t + 10, class: 'l10-ema-label l10-lg' }, svg); a.textContent = '10 日線';
      const b2 = mk('text', { x: m.l + 66, y: m.t + 10, class: 'l16-e20-label l10-lg' }, svg); b2.textContent = '20 日線';
      if (stage >= 2) { const t = mk('text', { x: x(X.i0), y: y(B[X.i0].l) + 16, class: 'l14-mark in', 'text-anchor': 'middle' }, svg); t.textContent = '▲ 入'; }
      if (stage >= 3) { if (X.half != null) { const t = mk('text', { x: x(X.half), y: y(B[X.half].h) - 8, class: 'l14-mark out', 'text-anchor': 'middle' }, svg); t.textContent = '賣½'; } const t = mk('text', { x: x(X.exit), y: y(B[X.exit].h) - 8, class: 'l14-mark out', 'text-anchor': 'middle' }, svg); t.textContent = '出'; }
      const ax = mk('text', { x: m.l + 4, y: H - 5, class: 'axis' }, svg); ax.textContent = '日線圖：每支 K = 1 日';
      el.querySelector('[data-c]').appendChild(svg);
      el.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', () => { stage = +b.dataset.st; render(); }));
      el.querySelector('[data-new]').addEventListener('click', () => { seed += 13; stage = 0; render(); });
    };
    render();
  };

  /* ---------- NR7 辨認練習（日線 K，模擬） ---------- */
  window.WIDGETS_EXTRA['l17-nr7'] = (el) => {
    let seed = Math.floor(Math.random() * 1e6), ans = null, X = null;
    const next = () => {
      seed += 7919; ans = null; const r = rng(seed);
      const P = 30 + r() * 200; let c = P; const B = []; const want = r() < 0.5;
      for (let i = 0; i < 7; i++) {
        let rg = P * (0.015 + r() * 0.03);
        if (i === 6) rg = want ? P * (0.006 + r() * 0.006) : P * (0.016 + r() * 0.03);
        const o = c + (r() - 0.5) * rg * 0.4, up = r() < 0.55; const body = rg * (0.3 + r() * 0.5);
        const cl = up ? o + body : o - body; const h = Math.max(o, cl) + (rg - body) * r(), l = h - rg; c = cl; B.push({ o, h, l, c: cl });
      }
      const rs = B.map((b) => b.h - b.l); X = { B, rs, is: rs[6] <= Math.min(...rs.slice(0, 6)) }; render();
    };
    const render = () => {
      const t = tsGet('l17-nr7', { n: 0, ok: 0 }), B = X.B, W = 520, H = 220, m = 30, step = (W - 2 * m) / 7;
      let lo = Math.min(...B.map((b) => b.l)), hi = Math.max(...B.map((b) => b.h)); const pd = (hi - lo) * 0.08; lo -= pd; hi += pd;
      const y = (p) => 12 + (hi - p) / (hi - lo) * (H - 44);
      el.innerHTML = `<div class="l10-w"><div class="l12-chart l17-nr7" data-c></div>
        <div class="l12-quiz">最後一支日 K（第 7 日）係唔係 NR7？ <button class="btn sm ${ans != null && X.is ? 'primary' : ''}" data-a="1" ${ans != null ? 'disabled' : ''}>係 NR7</button> <button class="btn sm ${ans != null && !X.is ? 'primary' : ''}" data-a="0" ${ans != null ? 'disabled' : ''}>唔係</button></div>
        <div class="l11-out" aria-live="polite">${ans == null ? '<p class="muted">NR7 = 今日高低波幅係最近 7 日入面最細。只睇高位減低位，唔理升定跌。</p>' : `<p>${(ans === 1) === X.is ? '✅ 啱！' : '❌ 唔啱。'}第 7 日波幅 ${X.rs[6].toFixed(2)}，之前 6 日最細係 ${Math.min(...X.rs.slice(0, 6)).toFixed(2)} → <b>${X.is ? '係 NR7' : '唔係 NR7'}</b>。</p>`}
        <p><button class="btn sm" data-next>下一題 ▶</button> <span class="muted">${t.n ? `答咗 ${t.n} 題，啱 ${t.ok} 題` : ''}</span></p></div></div>`;
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': '7 支日線 K' });
      B.forEach((b, i) => { const xx = m + step * i + step / 2, gg = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg); mk('line', { x1: xx, x2: xx, y1: y(b.h), y2: y(b.l), class: 'wick' }, gg); const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c)); mk('rect', { x: xx - step * 0.28, y: top, width: step * 0.56, height: Math.max(1.5, bot - top), class: 'body' }, gg);
        const tx = mk('text', { x: xx, y: H - 6, class: 'axis', 'text-anchor': 'middle' }, svg); tx.textContent = ans == null ? `第 ${i + 1} 日` : X.rs[i].toFixed(2); });
      el.querySelector('[data-c]').appendChild(svg);
      el.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { if (ans != null) return; ans = +b.dataset.a; const t2 = tsGet('l17-nr7', { n: 0, ok: 0 }); t2.n++; if ((ans === 1) === X.is) t2.ok++; tsSet('l17-nr7', t2); render(); }));
      el.querySelector('[data-next]').addEventListener('click', next);
    };
    next();
  };

  /* ---------- PlayBook 卡（SMB 式範本） ---------- */
  const FIELDS = [
    ['name', 'Setup 名', '例：Flat Top + A+'],
    ['big', '① 大市背景（Big Picture）', 'QQQ 喺 VWAP 上面定下面？今日有冇大數據？'],
    ['fund', '② 點解呢隻股今日有人關注（Intraday Fundamentals）', '業績、消息、升級；盤前 Gap 同成交'],
    ['tech', '③ 技術位（Technical Analysis）', '日線趨勢、昨日高、盤前高、VWAP、EMA 9'],
    ['tape', '④ 成交同盤口（Reading the Tape）', '首 5 分鐘成交係平時幾多倍？突破嗰支 K 有冇放量？'],
    ['plan', '⑤ 入場、Stop、Target 同管理（Trade Management）', 'Buy Stop 喺邊、Stop 喺邊、幾時移 Stop、幾時收工'],
    ['review', '⑥ 檢討（Trade Review）', '做完之後寫：有冇跟計劃？下次改咩？'],
  ];
  const TPL = {
    flat: { name: 'Flat Top + A+（我嘅主力）', big: 'QQQ 喺自己 VWAP 上面；今日冇 10:00 大數據。', fund: '日線升勢股，有業績或消息，盤前 Gap 高開而且成交大。', tech: '企喺 VWAP 同 EMA 9 上面；喺全日高位（HOD）下面窄幅橫行 20–30 分鐘。', tape: '首 5 分鐘成交 ≥ 平時 2 倍；整固期間成交縮細，突破嗰支 K 放量。', plan: 'Buy Stop 喺 HOD + 0.01；Stop 喺整固低位下面；Target 2R；+1R 將 Stop 移返入場價；11:30 未保本就平倉。', review: '' },
    abcd: { name: 'ABCD：等升穿 B 先入（Aziz 式，保守版）', big: 'QQQ 喺自己 VWAP 上面。', fund: '有人關注：Gap ≥ 2% 或者首 5 分鐘成交 ≥ 平時 2 倍。', tech: '開市後急升到 B（新高）；回調冇跌返一半以上，喺 C 守住，仲喺 VWAP 上面。', tape: '回調期間成交縮細；升返上 B 嘅時候成交放大。', plan: 'Buy Stop 喺 B + 0.01；Stop 喺 C 下面；Target 2R；+1R 移 Stop 返入場價；11:30 收工。', review: '' },
    ema: { name: 'EMA 9 回調（強勢延續）', big: 'QQQ 喺自己 VWAP 上面。', fund: '日線升勢股，開市成交大。', tech: 'EMA 9 向上、喺 VWAP 上面；回調好淺，低位掂到 EMA 9 但收市守住。', tape: '回調嗰幾支 K 成交細過升嗰幾支。', plan: 'Buy Stop 喺掂線嗰支 K 高位 + 0.01；Stop 喺嗰支 K 低位下面；Target 2R；11:30 收工。', review: '' },
    blank: { name: '', big: '', fund: '', tech: '', tape: '', plan: '', review: '' },
  };
  window.WIDGETS_EXTRA['l17-playbook'] = (el) => {
    let st = tsGet('l17-playbook', null) || { ...TPL.flat };
    const render = () => {
      el.innerHTML = `<div class="l11-w"><div class="l13-tabs"><span class="muted">載入範例：</span><button class="btn sm" data-t="flat">Flat Top + A+</button><button class="btn sm" data-t="abcd">ABCD 破 B</button><button class="btn sm" data-t="ema">EMA 9 回調</button><button class="btn sm ghost" data-t="blank">清空</button></div>
        <div class="l17-pb">${FIELDS.map(([k, label, ph]) => `<label>${label}${k === 'name' ? `<input type="text" data-k="${k}" value="${esc(st[k] || '')}" placeholder="${esc(ph)}">` : `<textarea rows="2" data-k="${k}" placeholder="${esc(ph)}">${esc(st[k] || '')}</textarea>`}</label>`).join('')}</div>
        <p><button class="btn sm primary" data-copy>📋 複製成文字</button> <span class="muted" data-msg aria-live="polite">會自動儲存喺你嘅帳戶。</span></p></div>`;
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { st[i.dataset.k] = i.value; tsSet('l17-playbook', st); }));
      el.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { st = { ...TPL[b.dataset.t] }; tsSet('l17-playbook', st); render(); }));
      el.querySelector('[data-copy]').addEventListener('click', async () => {
        const text = FIELDS.map(([k, label]) => `${label}\n${st[k] || '—'}`).join('\n\n');
        const msg = el.querySelector('[data-msg]');
        try { await navigator.clipboard.writeText(text); msg.textContent = '✅ 已複製，可以貼去你嘅交易日誌。'; } catch (e) { msg.textContent = '複製唔到，請手動揀選文字。'; }
      });
    };
    render();
  };
})();

window.COURSE.push({
  id: 'l17',
  code: 'Level 17',
  title: '名家打法：著名 Day Trader 嘅 Setup 同秘訣',
  subtitle: 'Ross Cameron、Andrew Aziz、Mike Bellafiore（SMB）、Linda Raschke、Kristjan Kullamägi、Toby Crabel 公開教嘅 Setup、選股同心法；每個都用我哋 3 年真實數據驗證；最後砌你自己嘅 PlayBook',
  icon: '🏆',
  color: '#b45309',
  question: '著名成功嘅 Day Trader 用咩 Setup？有咩秘訣？我可以照抄嗎？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l17-c1', num: '1', title: '點樣學名家：先識分真假', mins: 9,
  summary: '名家公開教嘅 Setup 值得學，但要記住三件事：成功嘅人係少數（倖存者偏差）、好多名家同時賣課程、佢哋嘅市場同你未必一樣。呢個 Level 嘅做法：先講佢哋公開教乜，再用我哋自己嘅數據測試，最後只攞啱你嘅部分。',
  keywords: ['倖存者偏差', '賣課程', 'FTC', '驗證'],
  md: `
:::info 呢個 Level 點嚟
用戶問：「可以加入著名成功嘅幾個 Day Trader 嘅 Setup、技巧或者秘訣嗎？」可以。但我哋唔會只係抄低佢哋講嘅嘢：每個 Setup 都會寫成固定規則，用我哋 50 隻大型股、32,618 個交易日嘅 5 分鐘數據測試，話你知結果。
:::

## 1.1 呢個 Level 會講邊幾位

| 名家 | 背景 | 佢最出名嘅嘢 | 市場 |
|---|---|---|---|
| **Ross Cameron** | Warrior Trading 創辦人 | Gap & Go、細價股 Momentum | 細價、少流通股 |
| **Andrew Aziz** | Bear Bull Traders 創辦人，《How to Day Trade for a Living》作者 | ABCD、VWAP、ORB | 中至大型股 |
| **Mike Bellafiore** | 紐約自營交易公司 SMB Capital 聯合創辦人 | Stocks In Play、PlayBook、Second Day Play | 有消息嘅大型股 |
| **Linda Raschke** | 《The New Market Wizards》受訪 Trader，《Street Smarts》作者 | Holy Grail（ADX + 20 EMA） | 期貨、股票 |
| **Kristjan Kullamägi** | 網名 Qullamaggie，Momentum 波段 Trader | 日線突破、Episodic Pivot | 強勢股（揸幾日到幾星期） |
| **Toby Crabel** | 對沖基金 Crabel Capital 創辦人 | ORB 同 NR7 嘅鼻祖（1990 年著作） | 期貨 |

第 8 章再加三位主要講「心法」嘅：Al Brooks、Lance Breitstein、Brett Steenbarger。

## 1.2 學名家之前要知嘅三個陷阱

:::warn ① 倖存者偏差（Survivorship Bias）
你見到嘅名家係**少數贏咗嘅人**。用同一套方法輸咗嘅人唔會出書、唔會開 YouTube。巴西一項研究追蹤連續做 Day Trade 超過 300 日嘅散戶，[97% 係蝕錢](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101)。「佢用呢個方法贏」唔等於「呢個方法會贏」。
:::

:::warn ② 好多名家同時賣課程
教學係佢哋嘅生意。2022 年美國聯邦貿易委員會（FTC）[控告 Warrior Trading](https://www.ftc.gov/business-guidance/blog/2022/04/ftc-bids-good-night-deceptive-day-trading-earnings-claims) 喺 2018–2021 年嘅廣告用誤導嘅收入聲稱，話大部分客戶其實冇賺錢；公司最後同意賠 300 萬美元和解。呢單案件針對嘅係**賣課程嘅廣告**，唔係 Ross Cameron 本人嘅交易成績。教訓：Setup 可以學，「好易賺」嘅講法唔好信。
:::

:::warn ③ 佢嘅市場未必係你嘅市場
Ross Cameron 做 2–20 美元嘅細價股；Kullamägi 揸幾星期；Crabel 測試嘅係期貨。你做嘅係**大型股、頭 2 小時、只做多**。同一個 Setup 搬過嚟，結果可以完全唔同（第 9 章有數據）。
:::

## 1.3 呢個 Level 每一章嘅格式

1. **佢係邊個**：邊啲係可以查證嘅，邊啲係佢自己講嘅
2. **佢公開教乜**：選股、入場、Stop、出場
3. **示意圖**：一步一步睇
4. **我哋嘅測試**：寫成機械規則之後，喺我哋數據嘅成績
5. **啱唔啱你**：Long、頭 2 小時、大型升勢股
6. **攞得走嘅一樣嘢**

:::key 最重要嘅一句
名家嘅 Setup 係**起點**，唔係答案。我哋嘅機械測試亦唔等於佢本人嘅做法（佢有判斷、有經驗、有自己嘅選股）。真正屬於你嘅，係你自己用 Paper Trading 記錄過 30 次、有數據支持嘅嗰幾個。
:::

## 1.4 點樣評估一個「老師」

[[check:l17-vet]]

[[quiz:l17-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c2', num: '2', title: 'Ross Cameron：細價股 Momentum 同 Gap & Go', mins: 10,
  summary: 'Ross Cameron 專做細價、少流通股嘅爆升：五個選股條件（價格、流通股、相對成交、已經升咗幾多、有消息），用 Gap & Go 同 Bull Flag 入場。搬去大型股之後，我哋嘅數據顯示 Gap & Go 冇優勢；值得學嘅係佢嘅選股紀律。',
  keywords: ['Ross Cameron', 'Gap & Go', 'Low Float', '選股五條件'],
  md: `
## 2.1 佢係邊個

- Warrior Trading 創辦人，YouTube 上最多人睇嘅 Day Trading 頻道之一
- 佢自己公佈由幾百美元細戶口做到過千萬美元利潤（佢自己公佈嘅數字）
- 第 1 章講過：佢間公司 2022 年因為課程廣告同 FTC 和解。學佢嘅 Setup 可以，但要記住呢個背景

## 2.2 佢公開教乜：五個選股條件

佢話 Setup 之前先要揀啱股。根據佢公開嘅影片同第三方整理（唔同來源嘅數字有少少出入）：

| 條件 | 大約數字 | 點解 |
|---|---|---|
| ① 價格 | 約 2–20 美元 | 細價股升幅百分比大 |
| ② 流通股（Float） | 少過約 1,000–2,000 萬股 | 貨少，買盤一多就急升 |
| ③ 相對成交（RVOL） | 平時嘅 5 倍或以上 | 今日真係有人關注 |
| ④ 今日已經升咗 | 10% 或以上 | 已經證明有買盤 |
| ⑤ 消息 | 有新聞催化劑 | 升得有原因 |

**入場**：
- **Gap & Go**：Gap 高開，開市後升穿盤前高位或者首幾分鐘高位就入
- **Bull Flag／細回調**：急升之後第一次回調，升穿回調 K 嘅高位就入（Level 14 第 4 章教過）

**Stop**：回調低位。**出場**：分批賣，通常幾分鐘內完成。

[[widget:l17-d-gapgo]]

## 2.3 我哋嘅測試（大型股版本）

我哋冇細價股嘅數據，所以測試嘅係「大型股版本」：Gap 高開 ≥ 4%，升穿首 5 分鐘高位入場，Stop 放首 5 分鐘低位。

[[widget:l17-k-gapGo]]

- 全部 387 次：賺錢 41%，平均 **−0.08R**
- 加 A+ 過濾（102 次）：**0.00R**，即係打和
- 逐年睇好唔穩定：2024 年 −0.13R、2025 年 −0.26R、2026 年 +0.10R

:::warn 點解搬過嚟唔得
佢嘅優勢嚟自**少流通股**：貨少，買盤一湧入就升幾十個百分比。大型股流通股以十億計，Gap 高開 4% 之後好多時係橫行或者回落（Level 12 嘅 Gap 統計：只有三分一嘅 Gap 會繼續行）。同一個圖形，背後嘅供求完全唔同。
:::

## 2.4 啱唔啱你

| | |
|---|---|
| Long only | ✅ 佢都係主要做多 |
| 頭 2 小時 | ✅ 佢通常開市後一個鐘內收工 |
| 大型升勢股 | ❌ 佢做嘅係細價股。細價股波動極大、滑價大、成日停牌，**唔建議新手轉去做** |

:::key 攞得走嘅一樣嘢：先揀股，後睇圖
佢嘅五個條件其實同我哋每日選股做緊嘅嘢一樣：**有消息、成交異常大、已經有方向**。你嘅大型股版本就係 Long 專區嘅條件：Gap 高開、RVOL ≥ 2、日線升勢。冇齊條件嘅股，幾靚嘅圖形都唔做。
:::

[[link:picks|📋 睇今日選股報告嘅 Long 專區]]

**資料來源**：[FTC 公告](https://www.ftc.gov/business-guidance/blog/2022/04/ftc-bids-good-night-deceptive-day-trading-earnings-claims)、[DayTrading.com 評論](https://www.daytrading.com/warrior-trading)、[Day Trading Toolkit 評論](https://daytradingtoolkit.com/reviews/warrior-trading-review)、[Ross Cameron 選股影片摘要](https://recapio.com/digest/300-short-squeeze-today-picking-stocks-was-hard-until-i-learned-this-5-step-trick-by-ross-cameron-wa)

[[quiz:l17-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c3', num: '3', title: 'Andrew Aziz：ABCD、VWAP 同 ORB', mins: 11,
  summary: 'Andrew Aziz 嘅書教幾個簡單 Setup：ABCD、Bull Flag、VWAP、ORB。我哋測試 ABCD 嘅兩個入場位：喺 C 位（回調低位）搶先入係負數；等升穿 B 位先入係正數，加 A+ 過濾更好。教訓：等確認。',
  keywords: ['Andrew Aziz', 'ABCD', 'VWAP', '等確認'],
  md: `
## 3.1 佢係邊個

- 《How to Day Trade for a Living》作者，Bear Bull Traders 交易社群創辦人
- 佢做嘅股票比 Ross Cameron 大隻，風格較保守，啱新手入門
- 佢同樣經營收費社群，所以第 1 章嘅提醒一樣適用

## 3.2 佢公開教乜

| Setup | 佢嘅講法（簡化） |
|---|---|
| **ABCD** | 升到 B → 回調到 C 守住 → 再升破 B 去 D。喺 C 守住時入，或者升穿 B 時入；Stop 放 C 下面 |
| **Bull Flag** | 急升後窄幅回調再破頂。佢鍾意喺開市初段、VWAP 上面做 |
| **VWAP** | 佢話 VWAP 係日內最重要嘅指標：VWAP 上面搵做多，回調到 VWAP 守住就入，Stop 放 VWAP 下面 |
| **ORB** | 開市區間突破。佢提醒區間唔好大過 ATR |
| **反轉** | 急跌或急升到極端之後嘅反轉（難度高，新手唔建議） |

佢嘅選股叫 **Stocks in Play**：有消息、Gap ≥ 2%、相對成交高、ATR 夠大。同我哋「有人關注」嘅定義好接近。

## 3.3 ABCD 一步一步睇

[[widget:l17-d-abcd]]

- **A**：開市起步
- **B**：急升之後嘅新高。**呢度唔好追**，因為已經升咗一段
- **C**：回調嘅低位。重點係佢**高過 A**、冇跌返升幅一半以上，而且守住
- **D**：再升穿 B 之後嘅一段

## 3.4 我哋嘅測試：C 位入定 B 位入？

佢講咗兩個入場位。我哋兩個都測試（有人關注嘅日子，11:30 前入場）：

[[widget:l17-k-abcdC]]

[[widget:l17-k-abcdD]]

| 入場位 | 次數 | 賺錢 % | 平均 R | A+ 過濾 | 升勢 + A+ |
|---|---|---|---|---|---|
| **C 位**（回調一守住就入） | 804 | 39% | −0.07 | −0.03 | 0.00（94 次 ⚠️） |
| **B 位**（等升穿 B 先入） | 509 | 51% | +0.04 | +0.10 | +0.23（65 次 ⚠️） |

:::key 數據嘅答案：等確認
- C 位入場睇落「平啲」，但好多時 C 根本守唔住：中 Stop 嘅比例係 47%，B 位版本只有 23%
- 等升穿 B 先入，入場價高咗、Stop 闊咗，但成績由負變正
- 三年都係細細嘅正數：2024 年 +0.06R、2025 年 +0.06R、2026 年 +0.02R
- 升勢 + A+ 嗰個數字好睇，但只有 65 次，當假設用
:::

:::tip 同你已經學嘅嘢嘅關係
B 位入場嘅 ABCD，其實同 Level 15 嘅 **Flat Top**（升穿 HOD）好相似：都係「升完 → 休息 → 再破頂先入」。Level 15 嘅 Flat Top 數據係全部 +0.06R、A+ +0.18R。兩個獨立測試指向同一個方向。
:::

## 3.5 VWAP 同 ORB：Level 15 已經測試過

| Aziz 教嘅 Setup | 我哋嘅數據（做多、頭 2 小時） |
|---|---|
| VWAP 第一次回調 | 全部 −0.04R；A+ +0.01R |
| Bull Flag | 全部 +0.01R；A+ +0.17R |
| 5 分鐘 ORB | 全部 +0.02R；A+ +0.07R |
| 15 分鐘 ORB | 全部 +0.03R；A+ +0.06R |

VWAP 作為「方向過濾」好有用（VWAP 上面先做多），但「掂 VWAP 就買」本身冇優勢。

## 3.6 啱唔啱你

✅ Long、✅ 頭 2 小時、✅ 大型股。佢嘅風格同你最接近。

:::key 攞得走嘅一樣嘢
**唔好估底，等市場證明。** 寧願買貴少少，都要見到價格真係升返上去先入。
:::

**資料來源**：[Shortform 書摘](https://www.shortform.com/books/blog/how-to-day-trade-for-a-living-by-andrew-aziz.html)、[Bear Bull Traders 課堂筆記（PDF）](https://bearbulltraders.com/wp-content/uploads/2018/01/Session-4.pdf)

[[quiz:l17-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c4', num: '4', title: 'Mike Bellafiore（SMB）：Stocks In Play 同 PlayBook', mins: 10,
  summary: 'SMB Capital 係真正嘅自營交易公司。Bellafiore 嘅重點唔係某一個圖形，而係流程：只做 Stocks In Play、每筆交易都係「One Good Trade」、將自己最好嘅交易寫成 PlayBook。佢哋嘅 Second Day Play 喺我哋數據冇優勢。',
  keywords: ['SMB Capital', 'Stocks In Play', 'PlayBook', 'Second Day Play'],
  md: `
## 4.1 佢係邊個

- 紐約自營交易公司（Prop Firm）**SMB Capital** 聯合創辦人：公司用自己資金請 Trader 交易，呢點可以查證
- 著有《One Good Trade》同《The PlayBook》
- SMB 亦有收費培訓部門（SMB Training）

## 4.2 佢公開教乜

### ① Stocks In Play：只做今日有故事嘅股

佢話新手最大嘅錯係做錯股。**Stock In Play** = 今日有新消息、成交比平時大好多嘅股。呢啲股先有足夠波幅同清晰方向。

有讀者引述佢哋嘅分配大約係：七成時間做當日 In Play 嘅股，一成半做第 2–4 日延續，一成半做純技術圖形。

### ② One Good Trade：只問一條問題

唔問「呢筆賺定蝕」，而係問：**「呢筆係唔係一筆好交易？」**

好交易 = 有準備、有計劃、跟足執行、有 Stop。蝕錢嘅好交易照樣係好交易；賺錢嘅亂嚟都係壞交易。

### ③ PlayBook：將你最好嘅交易寫低

每個 Setup 寫成一頁，佢嘅範本包括：

| 欄位 | 寫乜 |
|---|---|
| 大市背景（Big Picture） | 大市今日點、有冇大事 |
| 個股原因（Intraday Fundamentals） | 點解呢隻今日 In Play |
| 技術位（Technical Analysis） | 日線同日內嘅重要位 |
| 成交同盤口（Reading the Tape） | 買賣盤同成交點配合 |
| 交易管理（Trade Management） | 入場、Stop、加減倉、出場 |
| 檢討（Trade Review） | 做得好嘅、要改嘅 |

佢仲加第五個判斷：**直覺（Intuition）**，但佢話直覺係睇過好多次之後先有。

第 11 章你會填自己嘅 PlayBook 卡。

### ④ Second Day Play

一隻股第一日因為消息大升、收喺高位；第二日開市冇跌返，就搵位做延續。

[[widget:l17-d-second]]

## 4.3 我哋嘅測試：Second Day Play

規則：第一日升 ≥ 4%、收喺全日波幅最高 25%、成交 ≥ 平時 1.5 倍；第二日開市冇跌入第一日波幅下半；15 分鐘 ORB 做多。

[[widget:l17-k-secondDay]]

- 全部 191 次：平均 **−0.06R**
- 逐年：2024 年 −0.13R、2025 年 −0.21R、2026 年 +0.15R，唔穩定
- 直接檢查「第二日會延續」呢個講法：第一日大升收高之後，第二日開市買、收市賣，升嘅機會係 **50%**（624 日），其他日子係 50%。**冇分別**

:::warn 點解同佢哋講嘅唔同
SMB 嘅 Trader 唔係見到「第一日大升」就機械咁買。佢哋會揀消息夠大、第二日盤口真係有買家嘅先做。我哋嘅測試只證明一件事：**淨係靠「昨日大升收高」呢個條件，冇優勢。**
:::

## 4.4 啱唔啱你

✅ 大型股、✅ 有消息嘅股、✅ 流程適合任何風格。SMB 嘅打法同你最夾嘅唔係某個圖形，而係**選股同檢討流程**。

:::key 攞得走嘅一樣嘢：PlayBook
唔好學 20 個 Setup。揀 2–3 個你做得最好嘅，每個寫一頁 PlayBook，之後只做 PlayBook 入面有嘅嘢。Level 15 嘅 Flat Top、EMA 9 回調就係你第一批 PlayBook 候選。
:::

**資料來源**：[SMB：The Explosive Second Day Play](https://www.smbtraining.com/blog/the-explosive-second-day-play)、[SMB：How do you find the best stocks to trade](https://www.smbtraining.com/blog/how-do-you-find-the-best-stocks-to-trade)、[TraderLion《The PlayBook》摘要](https://traderlion.com/trading-books/the-playbook-summary/)、[TraderLion《One Good Trade》摘要](https://traderlion.com/trading-books/one-good-trade-summary-review/)、[O'Reilly 書目](https://oreilly.com/library/view/the-playbook-an/9780132937672)

[[quiz:l17-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c5', num: '5', title: 'Linda Raschke：Holy Grail（ADX + 20 EMA）', mins: 9,
  summary: 'Holy Grail 係 1995 年《Street Smarts》入面嘅經典：ADX 高過 30 代表趨勢強，等第一次回調到 20 EMA 就順勢入。我哋喺 5 分鐘圖測試，成績係零附近，加 A+ 過濾反而更差。概念啱，但機械照做冇優勢。',
  keywords: ['Linda Raschke', 'Holy Grail', 'ADX', '20 EMA'],
  md: `
## 5.1 佢係邊個

- 1981 年由期權場內交易員做起，之後管理自己嘅基金
- Jack Schwager 嘅《The New Market Wizards》（1992）訪問過佢，呢點可以查證
- 1995 年同 Laurence Connors 合著《Street Smarts》，入面有 Holy Grail

## 5.2 咩係 ADX

**ADX**（Average Directional Index）量度**趨勢有幾強**，唔理方向。

| ADX（14） | 意思 |
|---|---|
| 低過 20 | 冇趨勢，橫行 |
| 20–30 | 趨勢開始形成 |
| **高過 30** | 趨勢強 |

方向要另外睇：+DI 高過 −DI = 升勢；相反 = 跌勢。喺 TradingView 加「Directional Movement Index」就有齊三條線。

## 5.3 Holy Grail 嘅規則

1. **ADX（14）高過 30**，而且向上
2. 價格**回調到 20 EMA**（有人用 20 SMA）
3. 順趨勢方向入場：升勢就喺掂線嗰支 K 嘅高位上面放 Buy Stop
4. Stop 放回調低位
5. 目標：返到之前高位；趨勢強可以揸耐啲

名字係講笑：佢哋話世界上冇聖杯，呢個只係一個簡單嘅順勢回調。

[[widget:l17-d-holy]]

## 5.4 我哋嘅測試

5 分鐘圖，做多：ADX ≥ 30、+DI > −DI、之前 3 支 K 都喺 20 EMA 上面、第一次掂線，升穿掂線 K 嘅高位入場。

[[widget:l17-k-holyGrail]]

| 條件 | 次數 | 賺錢 % | 平均 R |
|---|---|---|---|
| 所有日子 | 2,730 | 45% | −0.02 |
| 有人關注嘅日子 | 752 | 43% | −0.05 |
| ADX 仲升緊 | 795 | 43% | −0.06 |
| A+ 過濾 | 124 | 36% | −0.16 |
| 用原著目標（返到前高就走） | 2,689 | 47% | −0.02 |

:::warn 數據話乜
- 樣本好大（2,730 次），成績係**零附近**：冇優勢，亦唔係大蝕
- 加 A+ 過濾**反而更差**（−0.16R）。同其他 Setup 相反
- 可能原因：成交大嘅強勢日，價格好少會回到 20 EMA 咁深。回到嗰度嗰陣，動力多數已經完咗。強勢日用**EMA 9**（淺回調）好啲：Level 15 嘅 EMA 9 回調喺 A+ 係 +0.11R
:::

:::info 公平啲講
佢原本用喺期貨同日線圖，唔係 5 分鐘股票圖；佢本人亦會睇好多其他嘢先決定做唔做。我哋只可以話：**喺你嘅市場同時間框架，機械照做冇優勢。**
:::

## 5.5 啱唔啱你

| | |
|---|---|
| Long only | ✅ 可以只做升勢版本 |
| 頭 2 小時 | ⚠️ 開市頭半個鐘 ADX 仲受昨日影響，訊號唔穩定 |
| 大型升勢股 | ✅ |

:::key 攞得走嘅一樣嘢：先確認有趨勢，再等回調
佢嘅次序係啱嘅：**① 趨勢夠強 → ② 等回調 → ③ 回調完先入**。你嘅版本：A+ 過濾代替 ADX，EMA 9 代替 20 EMA。
:::

[[link:c/l16-c2|📐 重溫 Level 16：EMA 點讀]]

**資料來源**：[Trading Setups Review：Holy Grail](https://tradingsetupsreview.com/the-holy-grail-trading-setup)、[investingLive：Holy Grail 策略](https://investinglive.com/Education/!/how-to-trade-by-holy-grail-strategy-20210329)

[[quiz:l17-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c6', num: '6', title: 'Kristjan Kullamägi：日線突破同 Episodic Pivot', mins: 12,
  summary: 'Kullamägi（Qullamaggie）係波段 Trader：買最強嘅股，喺日線整固突破或者大消息 Gap（Episodic Pivot）當日入場，Stop 放當日低位，揸幾日至幾星期，用 10 日線 Trailing。我哋嘅數據顯示：大部分交易係細蝕，利潤嚟自極少數大贏家。',
  keywords: ['Qullamaggie', 'Episodic Pivot', '日線突破', '10 日線'],
  md: `
## 6.1 佢係邊個

- 愛沙尼亞出生、瑞典生活，網名 **Qullamaggie**，曾經長期直播交易
- 佢自己公佈由幾千美元做到過千萬美元以上（佢自己公佈，冇獨立審核）
- **佢係波段 Trader，唔係 Day Trader**：入場用日內圖，但揸幾日到幾星期。放喺呢度，係因為佢嘅入場方法同你嘅風格（強勢股、做多、開市初段）好接近

## 6.2 佢公開教乜：三個 Setup

佢叫佢哋做「三個永恆嘅 Setup」，只用喺市場上最強嘅股。

### ① 日線突破（Breakout）

1. 股價喺 1–3 個月內**大升一段**（第三方整理話約 30–100% 或以上）
2. 之後**窄幅整固** 2 星期至 2 個月：低位一個比一個高，貼住 10 日線或 20 日線
3. **突破整固高位當日入場**：用開市頭 1 分鐘、5 分鐘或 60 分鐘嘅高位做觸發
4. **Stop 放當日低位**，而且 Stop 距離唔可以大過隻股平均一日嘅波幅
5. 揸 3–5 日後賣三分一至一半，Stop 移返入場價
6. 其餘用 10 日線（快股）或 20 日線（慢股）Trailing：**日線收市跌穿就走**

[[widget:l17-kq]]

### ② Episodic Pivot（EP）

一隻沉寂咗好耐嘅股，因為**重大消息**（例如業績大幅超預期）Gap 高開 10% 以上，而且成交極大。入場：升穿開市區間高位；Stop：當日低位。

### ③ Parabolic Short

沽空短時間內升得太癲嘅股。你只做多，**跳過**。

## 6.3 我哋嘅測試

### Episodic Pivot

規則：Gap 高開 ≥ 8%、首 5 分鐘成交 ≥ 平時 3 倍；升穿首 5 分鐘高位入場；Stop 放當日低位。

[[widget:l17-k-ep]]

| 出場方法 | 次數 | 賺錢 % | 平均 R |
|---|---|---|---|
| Target 2R／11:30 平倉 | 61 ⚠️ | 52% | +0.15 |
| 冇 Target，揸到收市 | 61 ⚠️ | — | +0.25 |
| 波段：賣一半 + 10 日線 Trailing | 61 ⚠️ | 36% | +0.22（中位數 −1.00） |

### 日線整固突破

[[widget:l17-k-kqBreakout]]

| 出場方法 | 次數 | 賺錢 % | 平均 R |
|---|---|---|---|
| Target 2R／11:30 平倉 | 51 ⚠️ | 51% | −0.06 |
| 冇 Target，揸到收市 | 51 ⚠️ | — | +0.08 |
| 波段：賣一半 + 10 日線 Trailing | 51 ⚠️ | 37% | +0.77（中位數 −1.00） |

:::key 呢組數字最重要嘅發現：利潤嚟自極少數交易
- 波段出場嘅**中位數係 −1.00R**：即係一半以上嘅交易係中 Stop 收場
- EP：61 筆合計約 +13R。最大 3 筆合計 +26R，**其餘 58 筆合計 −13R**
- 日線突破：51 筆合計約 +39R，最大 3 筆佔 +29R
- 佢本人都講過勝率唔高，靠嘅係少數大贏家。**呢種打法要捱得住連續蝕，而且唔可以錯過嗰幾筆大嘅**
:::

:::warn 樣本好細
三年、50 隻大型股，只搵到 61 次 EP 同 51 次日線突破。少過 100 次嘅平均數好受一兩筆影響，只可以當參考。佢本人會喺幾千隻股入面揀，機會多好多。
:::

## 6.4 啱唔啱你

| | |
|---|---|
| Long only、強勢股 | ✅ 完全一樣 |
| 開市初段入場 | ✅ 佢用開市區間高位入場 |
| 11:30 收工 | ❌ 佢嘅利潤嚟自揸幾星期。11:30 平倉嘅版本：EP +0.15R、日線突破 −0.06R |

如果你將來想試波段，呢個係自然嘅延伸。但佢係另一種遊戲：要留倉過夜、承受 Gap 風險、接受六成以上交易蝕錢。

:::key 攞得走嘅兩樣嘢
1. **Stop 放當日低位，風險唔好大過一日平均波幅**。Stop 太闊嘅突破唔做
2. **大消息 + 極大成交嘅 Gap 日（EP）係日內做多最值得留意嘅日子**：就算 11:30 平倉都係正數，A+ 過濾之下係 +0.27R（32 次 ⚠️）。遇到呢種日子，用你 PlayBook 入面嘅 Setup 去做
:::

**資料來源**：[ChartMill：Qullamaggie Episodic Pivot](https://www.chartmill.com/trading-ideas/737-The-Qullamaggie-Episodic-Pivot-Setup)、[Qullamaggie Swing Trading Setups（Substack 整理）](https://tikamalma.substack.com/p/qullamaggie-swing-trading-setups)、[TradingSim：Episodic Pivot](https://tradingsim.com/blog/episodic-pivot-power-earnings-gap-buyable-gap-up-explained/)、[Modeling Kullamägi（獨立回測）](https://stonkscapital.substack.com/p/modeling-kullamagi-part-2-momentum)

[[quiz:l17-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c7', num: '7', title: 'Toby Crabel：ORB 同 NR7 嘅鼻祖', mins: 9,
  summary: '1990 年 Toby Crabel 用期貨數據研究開市區間突破（ORB）同「窄幅之後擴張」（NR7）。呢兩個概念今日人人都講。我哋嘅股票數據顯示：NR7 之後波幅冇特別大，ORB 喺 NR7 之後亦冇特別好。',
  keywords: ['Toby Crabel', 'ORB', 'NR7', 'Stretch'],
  md: `
## 7.1 佢係邊個

- 1990 年出版《Day Trading with Short Term Price Patterns and Opening Range Breakout》，之後絕版，二手書賣到好貴
- 之後創立對沖基金 Crabel Capital，用系統化方法交易，呢點可以查證
- 佢係用**數據統計**研究短線圖形嘅先驅。你而家學嘅 ORB，名字就係嚟自佢

## 7.2 佢嘅兩個核心概念

### ① 收縮之後會擴張

市場喺「窄幅」同「闊幅」之間循環。佢搵啲特別窄嘅日子，賭下一日會行一大段。

**NR7**（Narrow Range 7）= 今日高低波幅係**最近 7 日入面最細**。另外有 NR4、Inside Day 等。

[[widget:l17-nr7]]

### ② Opening Range Breakout（ORB）

佢嘅原版唔係用「頭 5 分鐘高位」，而係：

- 計一個叫 **Stretch** 嘅距離（根據二手資料：過去 10 日「開市價到較近嗰邊高低位」嘅平均距離）
- **開市價 + Stretch** 放 Buy Stop，**開市價 − Stretch** 放 Sell Stop
- 邊個先觸發就做邊個方向，另一張單變 Stop
- 佢發現喺 NR7 之類嘅收縮日之後，ORB 嘅成績最好

## 7.3 我哋嘅測試

### 「NR7 之後波幅會擴大」？

| | 日數 | 當日波幅（平均） | 當日波幅（中位數） |
|---|---|---|---|
| NR7 之後嗰日 | 4,841 | 0.85 ATR | 0.76 ATR |
| 其他日子 | 27,777 | 0.94 ATR | 0.84 ATR |

NR7 之後嗰日通常比 NR7 當日闊（因為 NR7 當日特別窄），但**仲係細過平常日子**。喺我哋嘅大型股數據，「窄完就爆」唔成立；更似係「靜嘅時候繼續靜」。

### ORB 喺 NR7 之後好啲？

[[widget:l17-k-orb30]]

| 30 分鐘 ORB 做多（所有日子） | 次數 | 賺錢 % | 平均 R |
|---|---|---|---|
| NR7 之後 | 1,557 | 50% | +0.02 |
| 其他日子 | 9,132 | 49% | +0.01 |

冇分別。

### 原版 Stretch 入場

[[widget:l17-k-crabel]]

開市價 + Stretch 入場，全部 21,521 次：平均 **−0.04R**；NR7 之後 −0.05R。

:::warn 點解同佢嘅研究唔同
- 佢測試嘅係 **1980 年代嘅期貨**，而家係 2024–2026 年嘅股票
- 一個方法公開咗 35 年、人人都識之後，優勢通常會消失
- 我哋只測試做多，佢係兩邊都做
- Stretch 嘅定義我哋只搵到二手資料，可能同原著有出入
:::

## 7.4 啱唔啱你

ORB 你已經識（Level 14、15）。NR7 作為選股條件，喺我哋數據冇幫助。

:::key 攞得走嘅一樣嘢：佢嘅方法，唔係佢嘅結論
Crabel 最大嘅貢獻係**方法**：將一個講法寫成清晰規則，用數據測試，先決定信唔信。呢個正正係呢個 App 由 Level 12 開始一直做緊嘅嘢。35 年前嘅結論可以過時，呢個方法唔會。
:::

**資料來源**：[TrendFollowing：Crabel 著作介紹](https://www.trendfollowing.com/2010/02/21/day-trading-with-short-term-price-patterns-and-opening-range-breakout/)、[Trading Setups Review：NR7](https://tradingsetupsreview.com/nr7-trading-strategy)、[NexusFi：Opening Range Breakout](https://nexusfi.com/a/strategies/opening-range-breakout)

[[quiz:l17-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c8', num: '8', title: '三位講心法嘅：Brooks、Breitstein、Steenbarger', mins: 9,
  summary: 'Al Brooks：大部分突破會失敗，等第二次入場。Lance Breitstein：只喺 V 嘅右邊買，A+ 先加大注碼。Brett Steenbarger：日誌同檢討係進步嘅引擎。三個觀點都同我哋嘅數據吻合。',
  keywords: ['Al Brooks', 'Lance Breitstein', 'Brett Steenbarger', '心法'],
  md: `
呢三位冇一個「招牌 Setup」可以機械測試，但佢哋嘅觀點可以直接改變你點做。

## 8.1 Al Brooks：大部分突破會失敗

- 前眼科醫生，轉做全職 Trader，寫咗幾本好厚嘅 Price Action 書，主要用 5 分鐘圖做 E-mini S&P 期貨

**佢嘅核心觀點**：
1. **市場有慣性**：橫行區間入面，大約 80% 嘅突破嘗試會失敗；趨勢入面，大約 80% 嘅反轉嘗試會失敗。（佢自己論壇都有人指出呢個數字係概略，唔係精確統計）
2. **等第二次入場（Second Entry）**：第一次突破好多時係假嘅。第一次失敗之後，第二次再試，成功機會高啲
3. **先分清楚今日係趨勢日定橫行日**，兩種日子打法相反

**同我哋數據嘅關係**：
- Level 12：只有約三分一嘅 Gap 會繼續行
- Level 15：一開市追昨日高位突破係負數
- 第 3 章：ABCD 等升穿 B（即係第二次上去）好過喺 C 估底

:::key 你點用
見到突破，先問：**「如果呢個係假突破，我喺邊度知？」** 冇答案就唔入。寧願等佢突破之後回試守住，或者整固完再破（Flat Top）。
:::

## 8.2 Lance Breitstein：V 嘅右邊

- 前自營交易公司 Trillium 嘅資深 Trader，《Chat With Traders》第 236 集有詳細訪問

**佢嘅核心觀點**：
1. **Right Side of the V**：急跌嘅時候，喺 V 嘅**左邊**（仲跌緊）買係接飛刀，冇清晰 Stop。等佢轉頭、升穿前一支 K 高位，喺**右邊**買，Stop 可以放低位。**同一個價，左邊同右邊嘅期望值完全唔同**
2. **唔係每筆交易都一樣**：普通機會用細注，A+ 機會先加大。大部分利潤嚟自少數最好嘅日子
3. **只喺最極端、最多人關注嘅股用**，唔好每個細回調都當 V

:::key 你點用
你只做多，「V 嘅右邊」即係：**回調未完唔好買，等升返先買**。同第 3 章「等確認」係同一件事。至於加注：等你有 30 次以上記錄、證明邊個 Setup 真係有優勢先考慮；之前每筆用同一個 1R。
:::

## 8.3 Brett Steenbarger：進步靠檢討

- 臨床心理學家，長期做專業 Trader 嘅教練（包括同 SMB 合作），著有《The Daily Trading Coach》

**佢嘅核心觀點**：
1. **交易係一種表現技能**，同運動、音樂一樣，靠**刻意練習**進步：定目標、做、即時回饋、改
2. **日誌要有目標**：唔係記流水帳。每次寫低「下次要改邊一樣」
3. **由長處入手**：搵出你做得最好嘅交易，做多啲；唔係淨係修補弱點
4. **贏錢日都可以係差嘅過程**，蝕錢日都可以執行得好。評估過程，唔係結果

:::key 你點用
每日收工用 5 分鐘答三條：① 今日有冇跟計劃？② 邊一筆做得最好，點解？③ 聽日只改一樣，係乜？
:::

[[link:journal|📓 去交易日誌]]

**資料來源**：[Al Brooks：MoneyShow 專欄](https://www.moneyshow.com/articles/tradingidea-48940)、[Brooks Trading Course 論壇](https://www.brookstradingcourse.com/support-forum/12-market-cycle/breakout-fail/)、[Chat With Traders 第 236 集](https://chatwithtraders.com/236)、[Lance Breitstein 訪問整理](https://retailtradersrepository.substack.com/p/lance-breitstein-trillium-interview)、[SMB × Steenbarger：專業檢討](https://www.smbtraining.com/blog/?p=50281)

[[quiz:l17-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c12', num: '8+', title: 'Lance Breitstein（@TheOneLanceB）：VWAP 方向、投降式反轉同 V 嘅右邊', mins: 11,
  summary: 'TheOneLanceB 即係 Lance Breitstein：平時只順住 VWAP 嗰邊做，極端投降式行情先逆勢，而且要等 V 嘅右邊；期望值會隨每支 K 改變。用我哋 3 年數據測試：VWAP 規則有幫助，投降式反轉喺大型股未證明有優勢。',
  keywords: ['Lance Breitstein', 'TheOneLanceB', 'V 嘅右邊', 'Capitulation', '投降式', 'VWAP', '期望值'],
  md: `
:::info 呢章點嚟
用戶問：「可唔可以加入 TheOneLanceB 嘅 Setup？」TheOneLanceB 就係 **Lance Breitstein** 喺 X（Twitter）嘅帳號。上一章已經簡單講過佢嘅「V 嘅右邊」，呢章詳細講佢公開分享嘅三個概念，再用我哋 3 年真實數據測試。
:::

## 8.1 Lance Breitstein 係邊個？

- 2011 年喺紐約自營交易公司 Trillium 開始做交易員，之後成為公開分享交易概念嘅知名交易者（X：@TheOneLanceB、YouTube、個人網站）。
- 風格：**順住趨勢做，直到市場出現極端（投降式）行情先逆勢**；好重視「同一個價，唔同時間點嘅期望值唔同」。
- 佢經常做波幅極大、成交極大嘅股（好多係細價股或者有重大消息嘅股），同我哋 50 隻大型股嘅環境唔同。

:::warn 先講清楚
以下係我哋根據佢公開帖文、網站同二手整理嘅理解，**唔係佢本人嘅完整交易系統**。部分細節（例如「成交量要兩倍」）只見於二手總結，我會標明。
:::

## 8.2 概念一：VWAP 決定你做邊個方向

佢公開講過嘅規則（意思）：**股價穩定喺 VWAP 下面就唔做多；穩定喺 VWAP 上面就唔沽空 —— 除非出現投降式行情。**

即係話，平時只順住 VWAP 嗰邊做；逆 VWAP 做，要等極端情況。

**我哋嘅數據**：用同一個普通入場（陰燭回調之後升穿上一支 K 高位做多，10:00–11:30，Target 2R），按入場前 6 支 K 同 VWAP 嘅關係分三組：

| 入場前 6 支 K | 次數 | 賺錢 % | 中 Stop % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 全部收喺 VWAP 上面 | 7,923 | 32.6% | 65% | -0.07 | -0.12 |
| 有上有落（VWAP 附近拉鋸） | 14,292 | 32.2% | 65.8% | -0.09 | -0.14 |
| 全部收喺 VWAP 下面 | 10,067 | 30.8% | 68% | -0.11 | -0.16 |

:::key 點睇
- 呢個普通入場本身三組都係負數 —— 再一次證明「升穿上一支 K」唔係 Edge。
- 但 **VWAP 上面嗰組明顯好過下面嗰組**（大約差 +0.04R，每組都有幾千到一萬次樣本），方向同 Lance 嘅規則一致。
- 所以 VWAP 規則最適合做**過濾**：佢唔會令差嘅入場變好，但可以避開更差嘅情況。課程入面「做多只喺 VWAP 上面搵」嘅規則，就係同一個道理。
:::

## 8.3 概念二：投降式（Capitulation）同「V 嘅右邊」

**投降式行情** = 恐慌性急跌（或者瘋狂急升）：價格離 VWAP 同均線好遠、斜率好急、成交量爆升。佢嘅講法係：愈恐慌，力竭之後反彈愈急。

但佢唔會喺急跌途中撈底（「接飛刀」），而係等 **V 嘅右邊**：跌勢停止、開始轉向之後先入場。佢列過幾種「趨勢轉變」嘅定義（佢強調唔係完整清單，要按情況用）：

| 趨勢轉變訊號 | 意思 |
|---|---|
| 突破趨勢線 | 下降斜線被升穿 |
| 企穩 VWAP 另一邊 | 由下面升返上去並守住 |
| 突破之前幾支 K | 例如升穿上一支 K 高位 |
| 突破均線 | 例如升穿 EMA 9 |
| 投降式急跌或者力竭式成交 | 一下大跌加極大成交，之後跌唔落 |
| 高低點轉向 | 出現 Higher Low、Higher High |
| 壞消息唔跌 | 有壞消息但價格唔再跌 |
| 相對強弱 | 開始強過大市或者同類股 |

佢亦講過呢啲訊號可以同時出現，**出現愈多，轉向嘅判斷愈有力**。

:::card 「V 嘅右邊」做多（我哋嘅寫法）
- **左邊**：一支創新低嘅 K，成交 ≥ 當日平均 2 倍，價格比 VWAP 低 0.6 ATR 以上、比開市價低 0.8 ATR 以上
- **轉向**：之後出現一支**低位冇再創新低**嘅 K
- **入場**：升穿嗰支 K 高位（Buy Stop）
- **Stop**：V 底下面少少
- **Target**：VWAP（回歸平均），或者 2R
:::

**我哋嘅數據**（50 隻大型股、34,618 個交易日入面，只有 204 日符合「投降式」條件）：

| 做法 | 次數 | 賺錢 % | 中 Stop % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 接飛刀：嗰支 K 收市即刻買，Target 2R | 204 | 36.8% | 62.7% | +0.08 | +0.03 |
| 接飛刀：Target = VWAP | 204 | 19.1% | 79.4% | -0.09 | -0.14 |
| V 嘅右邊：等轉向先買，Target 2R | 134 | 38.1% | 51.5% | -0.12 | -0.17 |
| V 嘅右邊：Target = VWAP | 134 | 39.6% | 50.7% | -0.16 | -0.21 |

:::warn 誠實講：呢個結果點理解
- **大型股好少真正投降**：三年 50 隻股只有大約 200 次，而且大部分都唔算極端。Lance 做嘅係更極端嘅行情（例如幾日連續暴跌、細價股恐慌），我哋嘅股票池測唔到。
- 喺我哋嘅樣本，**等右邊冇明顯好過接飛刀**：等右邊中 Stop 少咗（大約 51.5% 對 62.7%），但入場價高咗、風險大咗，平均 R 冇改善。樣本只有一百幾次，差距仲喺雜訊範圍。
- 所以呢個 Setup **喺大型股未證明有優勢**。如果你想研究，只可以 Paper Trading，同埋要搵真正極端嘅日子。
:::

## 8.4 概念三：期望值會隨住每支 K 改變

佢認為交易最重要嘅進階概念之一係：**同一個價，喺唔同時間點嘅期望值唔同**。每多一支 K，勝率同風險回報都喺度變，你嘅決定都要跟住變。

| 例子 | 期望值點變 |
|---|---|
| 入場後即刻向有利方向走 | 好嘅交易通常「唔回頭」，期望值上升 |
| 價格一次又一次返到入場價附近 | 期望值下降（佢嘅講法：最好嘅交易唔會成日返嚟試你個入場價） |
| 突破之後喺高位橫行好耐 | 動力消失，期望值下降 |

**實際用法**：同課程入面嘅「時間止損」一致 —— 入場後一段時間未有進展、或者反覆返到入場價，就主動離場，唔好等 Stop。

## 8.5 四日力竭跳空（沽空，二手資料）

二手整理（根據佢嘅書同訪問）提過一個形態：股價**連升三日大陽燭、成交愈嚟愈大，第四日再大幅高開** —— 呢個可能係追高資金最後一波（力竭），之後容易回落。

我哋用固定規則測試（前三日每日收市升 ≥ 0.3 ATR、第四日高開 ≥ 0.3 ATR，見頂後跌穿上一支 K 低位沽空，Target 2R）：

| 版本 | 次數 | 賺錢 % | 中 Stop % | 平均 R | 扣成本後 |
|---|---|---|---|---|---|
| 四日力竭跳空沽空 | 123 | 43.1% | 45.5% | -0.09 | -0.14 |

結果係負數。大型股連升三日之後，第四日高開好多時係延續而唔係力竭。**呢個 Setup 喺我哋嘅數據唔成立**，只係當知識了解。

## 8.6 你點樣用 Lance 嘅概念？

| 概念 | 你嘅做法（只做多、頭 2 小時、大型股） |
|---|---|
| VWAP 決定方向 | ✅ 即刻用：做多只喺 VWAP 上面；穩定喺 VWAP 下面嘅股唔做多 |
| V 嘅右邊（等確認） | ✅ 用喺所有回調入場：等跌勢停、轉頭向上先入，唔好跌緊就買 |
| 投降式反轉 | ⏸️ 只觀察、Paper：大型股好少出現，數據未證明有優勢 |
| 期望值隨時間改變 | ✅ 用時間止損：入場後一段時間冇進展就走 |
| 四日力竭跳空沽空 | ❌ 數據唔支持；Cash 戶口亦做唔到 |

:::coach 最值錢嘅一課
Lance 最常講嘅唔係某個形態，而係**揀時機同耐性**：大部分時間順住 VWAP 做，等到真正極端先考慮逆勢；冇清楚訊號就唔做。呢點同成個課程嘅「等確認、唔追、唔估底」完全一致。
:::

**資料來源**：[Lance Breitstein：Ways to define change of trend（X）](https://x.com/TheOneLanceB/status/1516798713271767040)、[Lance Breitstein：The Right Side of the V（X）](https://x.com/TheOneLanceB/status/1989689233481564629)、[Lance Breitstein：Expected value dynamics（X）](https://twitter.com/TheOneLanceB/status/1546902745373884420)、[theonelanceb.com：The Right Side of the V](https://theonelanceb.com/blog/the-right-side-of-the-v-a-game-changer-for-traders/)、[theonelanceb.com：The Best Trades Don’t Look Back](https://theonelanceb.com/blog/the-best-trades-dont-look-back/)、[二手整理：Trend, Capitulation, and Controlled Chaos（Medium）](https://laurentiuchisca.medium.com/the-simple-setup-that-made-lance-breitstein-millions-trend-capitulation-and-controlled-chaos-ee1ad3429954)。數據：data/research/lance-stats.json（由 scripts/research/lance-stats.mjs 計）。

[[quiz:l17-c12]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c9', num: '9', title: '總成績表：名家 Setup 喺我哋數據嘅表現', mins: 9,
  summary: '九個名家 Setup 版本一齊比較：大部分喺零附近。有正數嘅係「等升穿 B 嘅 ABCD」同「大消息 Gap 日（EP）」；Gap & Go、Holy Grail、Second Day Play、NR7 冇優勢。結論同之前幾個 Level 一致：選股同背景比圖形重要。',
  keywords: ['總成績', 'A+ 過濾', '樣本', '機械規則'],
  md: `
## 9.1 全部放埋一齊

撳上面嘅掣轉條件：

[[widget:l17-stats]]

## 9.2 五個發現

:::key ① 冇一個係「聖杯」
九個版本入面，大部分平均 R 都喺 −0.1 至 +0.1 之間。名家嘅 Setup 寫成機械規則之後，喺大型股嘅成績同 Level 14、15 嘅普通 Setup 差唔多。
:::

:::key ② 等確認好過估底
ABCD 喺 C 位搶先入：−0.07R（804 次）。等升穿 B 先入：+0.04R（509 次）。呢個同 Brooks 嘅「第二次入場」、Breitstein 嘅「V 嘅右邊」係同一個道理。
:::

:::key ③ A+ 過濾通常有幫助，但唔係一定
- 有幫助：ABCD 破 B +0.04 → +0.10；Gap & Go −0.08 → 0.00；EP +0.15 → +0.27
- **冇幫助**：Holy Grail −0.02 → −0.16。強勢日回到 20 EMA 已經太深
- 所以過濾條件要同 Setup 夾：強勢日做淺回調同突破，唔做深回調
:::

:::key ④ 兩個流行講法喺我哋數據唔成立
- 「大升收高，第二日會延續」：第二日升嘅機會 50%，同平日一樣
- 「NR7 之後會爆」：NR7 之後波幅 0.85 ATR，細過平日嘅 0.94 ATR
:::

:::key ⑤ 大消息 Gap 日最值得留意，但樣本細
EP（Gap ≥ 8% + 成交 ≥ 3 倍）係唯一 11:30 平倉都有明顯正數嘅：+0.15R，但只有 61 次。一年大約 20 次機會，每次都要認真準備。
:::

## 9.3 點樣正確理解

:::warn 四個限制
1. **機械規則 ≠ 名家本人**。佢哋有判斷，會揀、會避，我哋嘅規則唔識
2. **市場唔同**：Cameron 做細價股、Crabel 做期貨、Kullamägi 喺幾千隻股入面揀。我哋只有 50 隻大型股
3. **測試咗好多版本**，總有幾個會因為運氣而好睇。少過 100 次（⚠️）嘅只可以當假設
4. **只有三年數據**（2024–2026），主要係升市
:::

所以正確嘅結論**唔係**「名家呃人」，而係：

> 圖形本身唔值錢。值錢嘅係圖形背後嘅**選股、背景、時機同執行**，而呢啲正正係名家唔可以用三句說話教識你嘅部分。

## 9.4 讀成績表嘅三個步驟

1. **先睇次數**：少過 100 次（⚠️）嘅數字，就算 +0.30R 都只係線索。
2. **再睇扣成本**：每筆扣大約 0.05R。+0.04R 扣完係 −0.01R，即係冇優勢。
3. **最後睇穩定性**：唔同年份、唔同條件（例如有冇 A+）都係正數，先較可信。

**例子**：EP +0.15R（61 次）→ 次數少 ⚠️；扣成本 +0.10R；只有一個時期 → 結論：「值得用 Paper Trading 記錄，未證實」。

## 9.5 點解要測試名家 Setup？

因為網上同書本嘅例子通常係揀出嚟嘅成功例子。用固定規則喺所有符合條件嘅日子測試，先見到真實嘅平均表現。結果好多 Setup 喺零附近，唔代表名家冇本事，而係代表**佢哋嘅本事唔喺圖形本身**。

[[quiz:l17-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c10', num: '10', title: '十個共通秘訣', mins: 8,
  summary: '九位名家市場唔同、Setup 唔同，但有十樣嘢幾乎人人都講：只做有人關注嘅股、少而精、先定風險、等確認、順勢、寫 PlayBook、分級注碼、日日檢討、知道幾時唔做、接受大部分利潤嚟自少數交易。',
  keywords: ['共通原則', '少而精', '風險', '檢討'],
  md: `
睇完九位，你會發現佢哋嘅 Setup 各有不同，但講嘅原則重複又重複。呢啲先係真正嘅「秘訣」。

## 10.1 十個共通點

| # | 秘訣 | 邊個講 | 你嘅版本 |
|---|---|---|---|
| 1 | **只做今日有人關注嘅股** | Cameron（五條件）、Aziz、Bellafiore（Stocks In Play）、Kullamägi（EP） | 每日報告嘅 Long 專區：Gap 高開 + RVOL ≥ 2 |
| 2 | **少而精：只做幾個 Setup** | Bellafiore（PlayBook）、Kullamägi（三個 Setup）、Aziz | 2–3 個：Flat Top、EMA 9 回調、ABCD 破 B |
| 3 | **入場前先定 Stop 同風險** | 全部 | 每筆 1R；Bracket 單一齊落 |
| 4 | **等確認，唔估底** | Brooks（第二次入場）、Breitstein（V 嘅右邊）、Aziz（C 守住先入） | Buy Stop 放高位上面，等市場嚟觸發 |
| 5 | **順住趨勢同大市** | Raschke（ADX）、Kullamägi（最強嘅股）、Brooks | 日線升勢 + QQQ 喺 VWAP 上面 |
| 6 | **Stop 要細過平均波幅** | Kullamägi（唔大過一日波幅）、Aziz（區間細過 ATR） | 風險 ≤ 0.6 ATR，太闊就唔做 |
| 7 | **A+ 先加大，普通機會細注** | Breitstein、Bellafiore | 有 30 次記錄之前：全部用同一個 1R |
| 8 | **日日檢討，寫日誌** | Steenbarger、Bellafiore | 收工答三條問題（第 8 章） |
| 9 | **知道幾時唔做** | 全部 | 量唔夠唔做、QQQ 弱唔做、11:30 後唔做 |
| 10 | **接受利潤嚟自少數交易** | Kullamägi、Breitstein | 贏嗰次要俾佢去到 2R，唔好 1R 就走 |

:::info 留意：冇一個係「秘密指標」
十樣入面冇一樣係特別嘅指標或者神秘圖形。全部係**揀乜嚟做、幾時唔做、蝕幾多、點樣進步**。
:::

## 10.2 同我哋數據嘅對照

| 秘訣 | 我哋數據點講 |
|---|---|
| 1 只做有人關注嘅股 | A+ 過濾（開市成交 ≥ 2 倍 + QQQ）係我哋搵到最穩定嘅加分因素（Level 15、16） |
| 4 等確認 | ABCD：C 位 −0.07R vs 破 B +0.04R |
| 5 順勢 | 日線升勢「本身」冇加分，但配合 A+ 就好啲（Level 15） |
| 10 少數大贏家 | EP 波段：最大 3 筆 +26R，其餘合計 −13R |

## 10.3 每日用嘅清單

[[check:l17-principles]]

## 10.4 將十個秘訣變成一日流程

| 時間 | 秘訣 | 做咩 |
|---|---|---|
| 開市前 | 1、2、5 | 由報告揀 2–3 隻有人關注、升勢嘅股；只準備你 Playbook 入面嘅 Setup |
| 開市前 | 3、6 | 每個候選計好 Stop 同股數；Stop 闊過 0.6 ATR 嘅剔走 |
| 開市後 | 9 | 量唔夠、QQQ 弱就唔做 |
| 入場 | 4 | 用 Buy Stop 等觸發 |
| 持倉 | 10 | 唔好 1R 就走；跟 Bracket |
| 收工 | 7、8 | 記日誌，答三條問題；30 次之前唔加注 |

每一個秘訣都對應一個具體動作，咁先唔會變成「知道但做唔到」。

:::coach 揀一個開始
十個一次過做好難。建議由第 9 個（知道幾時唔做）開始：每朝寫低今日唔做嘅條件，做兩星期。好多人單靠呢一樣，虧損已經明顯減少。
:::

[[quiz:l17-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l17-c11', num: '11', title: '砌你自己嘅 PlayBook', mins: 10,
  summary: '將名家嘅嘢變成你自己嘅：揀 2–3 個啱你（Long、頭 2 小時、大型升勢股）嘅 Setup，每個填一張 PlayBook 卡，用 Paper Trading 記錄 30 次，用數據決定留邊個。附辨認練習同總測驗。',
  keywords: ['PlayBook', 'Paper Trading', '30 次', '總測驗'],
  md: `
## 11.1 邊啲啱你，邊啲唔啱

你嘅風格：**只做多、09:30–11:30、大型日線升勢股**。

| 名家 Setup | 啱唔啱 | 原因 |
|---|---|---|
| **ABCD：等升穿 B**（Aziz） | ✅ 加入 PlayBook 候選 | 數據正數（+0.04R；A+ +0.10R），同 Flat Top 同一類 |
| **大消息 Gap 日（EP）**（Kullamägi） | ✅ 當「特別日子」處理 | 一年約 20 次；用你 PlayBook 嘅 Setup 去做 |
| **Stocks In Play + PlayBook 流程**（SMB） | ✅ 即刻用 | 唔係 Setup，係流程 |
| Gap & Go（Cameron） | ❌ | 大型股 −0.08R；細價股風險太高 |
| ABCD：C 位入（Aziz） | ❌ | −0.07R |
| Holy Grail（Raschke） | ❌ 用 EMA 9 回調代替 | A+ 日 −0.16R |
| VWAP 方向規則（Breitstein） | ✅ 當過濾即刻用 | VWAP 上面做多明顯好過下面 |
| 投降式反轉、V 嘅右邊（Breitstein） | ⏸️ 只觀察 | 大型股好少出現；未證明有優勢 |
| Second Day Play（SMB） | ❌ | −0.06R，冇延續優勢 |
| NR7／Stretch ORB（Crabel） | ❌ | 冇分別 |
| 日線突破波段（Kullamägi） | ⏸️ 將來 | 要留倉過夜，係另一個課題 |

加埋 Level 15 嘅主力，你嘅候選名單：

1. **Flat Top + A+**（+0.18R）
2. **EMA 9 回調 + A+**（+0.11R）
3. **ABCD 破 B + A+**（+0.10R）

三個都係同一個結構：**強勢 → 休息 → 再破頂先入**。

## 11.2 填你嘅 PlayBook 卡

用 SMB 嘅範本。撳「載入範例」睇三個候選嘅寫法，再改成你自己嘅字眼：

[[widget:l17-playbook]]

## 11.3 辨認練習

呢度有四個名家圖形加兩個你嘅主力。睇到觸發前，估係邊個：

[[widget:l17-spot]]

## 11.4 之後點做

:::steps
1. 揀**最多 3 個** Setup，每個填好一張 PlayBook 卡
2. 用 Paper Trading（或者最細注碼）做，每筆記入交易日誌，標明係邊個 Setup
3. 每個 Setup 記夠 **30 次**先下結論
4. 30 次之後睇平均 R：正數就留，負數就改或者刪
5. 每個月重溫一次 PlayBook，只加一樣、或者刪一樣
:::

:::key 最後一句
名家嘅價值唔係俾你一個必賺嘅圖形。佢哋示範咗一件事：**揀一個細範圍，做到極熟，用記錄不斷改進。** 你而家有齊工具做同一件事。
:::

[[link:tools/bracket-ticket|⚡ 交易一頁通：計股數 + 檢查 + IBKR Bracket]]

## 11.5 總測驗

[[quiz:l17-final]]

## 11.6 一張填好嘅 PlayBook 卡：例子

| 項目 | Flat Top + A+ |
|---|---|
| 大局 | QQQ 喺自己 VWAP 上面；日線升勢 |
| 選股 | 報告 Long 專區；首 5 分鐘成交 ≥ 平時 2 倍 |
| 形態 | 開市後升 ≥ 0.25 ATR；4 支 K 範圍 ≤ 0.25 ATR，貼住 HOD；喺 VWAP 上面 |
| 入場 | Buy Stop Limit：HOD + 0.01，上限 +0.10；20 分鐘內有效 |
| Stop | 整固低位下面少少 |
| 目標 | 2R；+1R 移 Stop 返入場價 |
| 唔做 | 09:30–09:35；11:30 後；第三次試 HOD 成交縮；QQQ 跌穿 VWAP |
| 大細 | 1R = 戶口 0.25%（30 次之前唔加） |
| 記錄 | Setup 名、A+ 有冇、實際成交、R、有冇跟規則 |

卡上面每一格都要具體到「另一個人照住做都會做出同一個決定」。

## 11.7 一個月後點樣改 PlayBook？

| 數據 | 改法 |
|---|---|
| 某個 Setup 30 次平均 R 負數，而且跟晒規則 | 刪除或者暫停 |
| 某個「唔做」條件好少出現 | 保留，但唔使特別睇 |
| 好多虧損集中喺某個時間（例如 11:00 後） | 加一條時間限制 |
| 新想加嘅 Setup | 一次只加一個，先 Paper Trading 30 次 |

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l17-c1': { title: '小測：點樣學名家', questions: [
  { q: '「倖存者偏差」係指？', options: ['你只見到贏咗嘅人，見唔到用同一方法輸咗嘅人', '贏嘅人一定係靠運氣', '名家全部係假嘅'], answer: 0, explain: '所以「佢用呢個方法贏」唔等於「呢個方法會贏」。' },
  { q: 'FTC 2022 年控告 Warrior Trading，針對嘅係？', options: ['Ross Cameron 嘅交易成績', '賣課程廣告入面誤導嘅收入聲稱', 'Gap & Go 呢個 Setup'], answer: 1, explain: '案件關於廣告，唔係佢本人嘅交易。' },
  { q: '名家嘅 Setup 應該當成？', options: ['必賺公式', '起點：要用自己嘅數據同記錄驗證', '冇用嘅嘢'], answer: 1, explain: '驗證過先屬於你。' },
]},
'l17-c2': { title: '小測：Ross Cameron', questions: [
  { q: 'Ross Cameron 主要做邊類股？', options: ['大型科技股', '細價、少流通股', '指數 ETF'], answer: 1, explain: '佢嘅優勢嚟自少流通股嘅急升。' },
  { q: '我哋嘅大型股 Gap & Go 測試結果？', options: ['明顯正數', '冇優勢（負數至打和）', '冇測試'], answer: 1, explain: '大型股 Gap 之後好多時橫行或回落。' },
  { q: '佢最值得你學嘅係？', options: ['轉做細價股', '先揀啱股（有消息、量大、有方向）先睇圖', '開市第一秒就買'], answer: 1, explain: '即係你嘅 Long 專區條件。' },
]},
'l17-c3': { title: '小測：Andrew Aziz', questions: [
  { q: 'ABCD 入面，C 點最重要嘅條件係？', options: ['低過 A', '高過 A，冇跌返升幅一半以上，而且守住', '同 B 一樣高'], answer: 1, explain: 'C 守唔住就唔係 ABCD。' },
  { q: '數據顯示 ABCD 邊個入場位好啲？', options: ['C 位搶先入', '等升穿 B 先入', '兩個一樣'], answer: 1, explain: 'C 位係負數，B 位係正數。' },
  { q: 'VWAP 喺我哋數據嘅最佳用法？', options: ['掂到就買', '當方向過濾：VWAP 上面先搵做多', '唔理'], answer: 1, explain: '「掂 VWAP 就買」本身冇優勢。' },
]},
'l17-c4': { title: '小測：SMB', questions: [
  { q: 'Stock In Play 係指？', options: ['股價最平嘅股', '今日有新消息、成交異常大嘅股', '任何科技股'], answer: 1, explain: '呢啲股先有波幅同方向。' },
  { q: '「One Good Trade」評估嘅係？', options: ['呢筆賺幾多', '呢筆有冇準備、有冇跟計劃', '呢筆揸咗幾耐'], answer: 1, explain: '評估過程，唔係結果。' },
  { q: '第一日大升收高之後，第二日升嘅機會喺我哋數據係？', options: ['約一半，同平日一樣', '八成', '兩成'], answer: 0, explain: '淨係靠呢個條件冇優勢。' },
]},
'l17-c5': { title: '小測：Holy Grail', questions: [
  { q: 'ADX 量度乜？', options: ['趨勢方向', '趨勢有幾強（唔理方向）', '成交量'], answer: 1, explain: '方向要睇 +DI 同 −DI。' },
  { q: 'Holy Grail 喺邊度入場？', options: ['ADX 高過 30 時，第一次回調到 20 EMA', 'ADX 低過 20 時突破', 'RSI 低過 30'], answer: 0, explain: '強趨勢嘅第一次回調。' },
  { q: '我哋 5 分鐘圖測試，加 A+ 過濾之後？', options: ['好咗好多', '反而更差', '冇變'], answer: 1, explain: '強勢日回到 20 EMA 已經太深；用 EMA 9 好啲。' },
]},
'l17-c6': { title: '小測：Kullamägi', questions: [
  { q: '佢嘅初始 Stop 放邊度？', options: ['入場價下面 10%', '突破當日嘅低位', '20 日線'], answer: 1, explain: '而且唔可以大過一日平均波幅。' },
  { q: '佢點樣出場？', options: ['到 2R 全走', '3–5 日後賣一部分，其餘等日線收市跌穿 10 或 20 日線', '當日收市全走'], answer: 1, explain: '佢係波段 Trader。' },
  { q: '我哋波段測試嘅中位數係 −1R，但平均係正數，代表？', options: ['計錯', '大部分交易細蝕，利潤嚟自極少數大贏家', '每筆都賺'], answer: 1, explain: '要捱得住連續蝕。' },
]},
'l17-c7': { title: '小測：Toby Crabel', questions: [
  { q: 'NR7 係指？', options: ['連升 7 日', '今日波幅係最近 7 日最細', '成交係 7 日最大'], answer: 1, explain: 'Narrow Range 7。' },
  { q: '我哋數據入面，NR7 之後嗰日嘅波幅？', options: ['大過平日', '仲係細過平日', '一定係平日兩倍'], answer: 1, explain: '靜嘅時候繼續靜。' },
  { q: 'Crabel 最值得學嘅係？', options: ['佢 1990 年嘅結論', '將講法寫成規則、用數據測試嘅方法', '只做期貨'], answer: 1, explain: '結論會過時，方法唔會。' },
]},
'l17-c12': { title: '小測：Lance Breitstein', questions: [
  { q: 'Lance 嘅 VWAP 規則係？', options: ['價格喺 VWAP 下面就買平貨', '穩定喺 VWAP 下面唔做多，除非出現投降式行情', 'VWAP 冇用'], answer: 1, explain: '平時順住 VWAP 嗰邊做；我哋數據入面 VWAP 上面嘅做多亦明顯好過下面。' },
  { q: '「V 嘅右邊」即係？', options: ['跌緊嗰陣分段撈底', '等跌勢停、出現轉向訊號先入場', '等升到新高先買'], answer: 1, explain: '例如低位唔再創新低、升穿上一支 K 高位、企返 VWAP。' },
  { q: '投降式反轉喺我哋 50 隻大型股嘅數據點講？', options: ['好穩定賺錢', '好少出現，而且未證明有優勢，只宜 Paper', '一定蝕錢'], answer: 1, explain: '三年只有大約 200 次；等右邊冇明顯好過接飛刀，樣本細。' },
  { q: '「期望值隨每支 K 改變」實際點用？', options: ['入咗場就唔使理', '入場後一段時間冇進展、或者反覆返到入場價，就主動離場', '輸咗就加注'], answer: 1, explain: '即係時間止損：好嘅交易通常唔回頭。' },
] },
'l17-c8': { title: '小測：三位講心法嘅', questions: [
  { q: 'Al Brooks 話橫行區間入面嘅突破？', options: ['大部分成功', '大部分失敗', '一半一半'], answer: 1, explain: '所以要等第二次入場或者確認。' },
  { q: '「V 嘅右邊」對只做多嘅你即係？', options: ['跌緊就買', '等回調完、升返先買', '唔買'], answer: 1, explain: '同一個價，右邊有清晰 Stop。' },
  { q: 'Steenbarger 話日誌最重要係？', options: ['記低每筆賺蝕', '有目標：每次寫低下次改邊一樣', '寫得越長越好'], answer: 1, explain: '刻意練習要有回饋同目標。' },
]},
'l17-c9': { title: '小測：總成績', questions: [
  { q: '九個名家 Setup 版本嘅機械成績大致係？', options: ['全部大賺', '大部分喺零附近', '全部大蝕'], answer: 1, explain: '圖形本身唔值錢。' },
  { q: '邊個 Setup 加咗 A+ 過濾反而更差？', options: ['ABCD 破 B', 'Holy Grail', 'Episodic Pivot'], answer: 1, explain: '過濾要同 Setup 夾。' },
  { q: 'EP 嘅數字好睇，但要留意？', options: ['樣本只有幾十次', '冇任何問題', '佢係沽空'], answer: 0, explain: '少過 100 次只可以當假設。' },
]},
'l17-c10': { title: '小測：共通秘訣', questions: [
  { q: '十個共通點入面有冇「秘密指標」？', options: ['有', '冇，全部係選股、風險、紀律同檢討', '有三個'], answer: 1, explain: '呢個先係真正嘅秘訣。' },
  { q: '「少而精」對你即係？', options: ['學晒 20 個 Setup', '只做 2–3 個寫咗 PlayBook 嘅 Setup', '每日換一個新 Setup'], answer: 1, explain: '做到極熟。' },
  { q: '幾時先考慮 A+ 加大注碼？', options: ['即刻', '有 30 次以上記錄證明有優勢之後', '蝕錢之後追返'], answer: 1, explain: '之前全部用同一個 1R。' },
]},
'l17-final': { title: 'Level 17 總測驗', questions: [
  { q: '10:05，日線升勢股開市量係平時 3 倍，QQQ 喺 VWAP 上面。佢升到新高 B 之後回調，喺 C 守住咗兩支 K。最好嘅計劃？', options: ['即刻市價買', 'Buy Stop 放 B 上面，Stop 放 C 下面，Target 2R', '等跌穿 C 先買'], answer: 1, explain: 'ABCD 等升穿 B：數據正數。' },
  { q: '一隻細價股（3 美元、流通股 500 萬）盤前升咗 80%。你應該？', options: ['照 Ross Cameron 咁做', '唔做：唔係你嘅市場，風險極高', '加大注碼'], answer: 1, explain: '你做大型股。' },
  { q: '強勢 A+ 日，價格由高位回到 5 分鐘 20 EMA。數據話？', options: ['最佳買入位', '成績差：回得太深，動力多數完咗', '一定反彈'], answer: 1, explain: 'A+ 日用 EMA 9 淺回調。' },
  { q: '朋友話：「某名家用呢個 Setup 賺咗過千萬，照抄就得。」你點答？', options: ['啱，照抄', '佢嘅市場、判斷同選股未必同我一樣；我要自己記錄 30 次驗證', '名家全部係呃人'], answer: 1, explain: '倖存者偏差 + 市場唔同。' },
  { q: '今日蝕咗一筆，但有準備、跟足計劃、Stop 執行咗。呢筆係？', options: ['壞交易', '好交易（One Good Trade）', '唔使記錄'], answer: 1, explain: '評估過程，唔係結果。' },
  { q: '你嘅 PlayBook 應該有幾多個 Setup？', options: ['最多 3 個，每個有記錄支持', '越多越好', '一個都唔使'], answer: 0, explain: '少而精。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l17-vet': { title: '評估一個交易老師／課程', items: [
  '佢嘅成績係獨立查證得到，定只係自己講？',
  '佢主要收入嚟自交易，定係賣課程／訂閱？',
  '佢有冇講清楚蝕錢嘅交易同勝率？',
  '佢做嘅市場（細價股／期貨／波段）同我一樣嗎？',
  '佢嘅 Setup 有冇清晰規則，可以寫低嚟測試？',
  '有冇「好易」「保證」「幾日學識」呢類字眼？有就小心',
  '我有冇用自己嘅數據或者 Paper Trading 驗證過先落真錢？',
]},
'l17-principles': { title: '名家十個共通原則：我今日做到未？', items: [
  '只做今日有人關注嘅股（Long 專區：Gap 高開 + RVOL ≥ 2）',
  '只做 PlayBook 入面嘅 2–3 個 Setup',
  '入場前已經定好 Stop 同 1R',
  '用 Buy Stop 等確認，冇估底',
  '日線升勢 + QQQ 喺 VWAP 上面先做多',
  'Stop 距離 ≤ 0.6 ATR，太闊就放棄',
  '每筆用同一個 1R（未有 30 次記錄之前唔加注）',
  '收工寫日誌：跟計劃？最好一筆？聽日改一樣？',
  '量唔夠／QQQ 弱／過咗 11:30：冇落單',
  '贏嗰筆有俾佢行到 2R 或者 +1R 後保本',
]},
});

window.GLOSSARY.push(
  { term: 'Survivorship Bias', zh: '倖存者偏差', def: '只見到成功嘅人，見唔到用同一方法失敗嘅人，於是高估咗方法嘅成功率。', lv: 'l17' },
  { term: 'ABCD Pattern', zh: 'ABCD 圖形', def: '升到 B、回調到 C 守住（高過起點 A）、再升穿 B 去 D。數據顯示等升穿 B 先入好過喺 C 搶先入。', lv: 'l17' },
  { term: 'Stocks In Play', zh: '有人關注嘅股', def: 'SMB Capital 嘅講法：今日有新消息、成交異常大嘅股。同我哋「有人關注」嘅定義相近。', lv: 'l17' },
  { term: 'PlayBook', zh: '交易劇本', def: '將自己最好嘅 Setup 逐個寫成一頁：大市背景、個股原因、技術位、成交、管理、檢討。只做 PlayBook 入面有嘅嘢。', lv: 'l17' },
  { term: 'Second Day Play', zh: '第二日延續', def: '第一日因消息大升收高，第二日搵位做延續。我哋數據顯示淨係靠呢個條件冇優勢。', lv: 'l17' },
  { term: 'ADX', zh: '平均趨向指數', def: '量度趨勢有幾強（唔理方向）。高過 30 = 趨勢強；低過 20 = 橫行。方向睇 +DI 同 −DI。', lv: 'l17' },
  { term: 'Holy Grail Setup', zh: 'Holy Grail', def: 'Linda Raschke 嘅順勢回調：ADX 高過 30，第一次回調到 20 EMA 入場。', lv: 'l17' },
  { term: 'Episodic Pivot', zh: 'EP（大消息 Gap 日）', def: 'Kullamägi 嘅講法：重大消息令股價 Gap 高開 10% 以上而且成交極大，可能係新一段升勢嘅起點。', lv: 'l17' },
  { term: 'NR7', zh: '七日最窄', def: '今日高低波幅係最近 7 日最細。Toby Crabel 認為之後容易擴張；我哋嘅大型股數據唔支持。', lv: 'l17' },
  { term: 'Right Side of the V', zh: 'V 嘅右邊', def: 'Lance Breitstein 嘅講法：唔好喺仲跌緊（左邊）買，等轉頭升返（右邊）先買，Stop 可以放低位。', lv: 'l17' },
);
