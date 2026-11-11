/* Level 16：Indicator 實戰 —— EMA、VWAP、ATR、RVOL、RSI、MACD：點睇、幾時做多 */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const L = window.SetupLab;
  if (!L) { console.warn('Level 16 需要先載入 Level 14'); return; }
  const { mk, esc, rng, genPath } = L;
  const sg = (v, d = 2) => (v == null || !isFinite(v) ? '—' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d));

  /* 真實統計（scripts/research/indicator-stats.mjs 用 Alpaca 5 分鐘 K 線計，只係統計數字） */
  const STATS = {"universe":["TSLA","NVDA","AAPL","AMD","META","AMZN","MSFT","GOOGL","AVGO","NFLX","PLTR","COIN","MU","SMCI","MSTR","HOOD","ARM","INTC","ORCL","CRM","ADBE","SHOP","UBER","ABNB","SNOW","CRWD","PANW","NET","DDOG","MRVL","QCOM","LRCX","AMAT","ROKU","PYPL","RIVN","SOFI","AFRM","UPST","BABA","PDD","DIS","BA","NKE","SBUX","LLY","UNH","CVNA","DKNG","RBLX"],"source":"Alpaca SIP 5 分鐘 K 線（正常交易時段）","daysInPlay":7132,"samples":21396,"rules":{"inPlay":"Gap ≥ 2% 或者首 5 分鐘成交 ≥ 過去 20 日平均 2 倍","probe":"09:50、10:10、10:30 各試一次：收市價買入，Stop 0.25 ATR，Target 0.5 ATR（2R），60 分鐘內未到就平倉","note":"同一日最多 3 個樣本，互相有重疊；EMA／RSI／MACD 用只顯示正常時段嘅 5 分鐘圖計"},"all":{"n":21396,"win":46,"up":50.4,"avgR":0.01,"avgFwd":0},"indicators":{"ema9d":{"name":"EMA 9 距離（價格 − EMA 9，ATR）","buckets":[{"label":"低過 EMA 9 超過 0.15 ATR","n":4796,"win":45.7,"avgR":0.04},{"label":"啱啱低過 EMA 9","n":5415,"win":48.7,"avgR":0.03},{"label":"高過 0–0.1 ATR（貼住）","n":4298,"win":46.8,"avgR":-0.01},{"label":"高過 0.1–0.25 ATR","n":3696,"win":45.5,"avgR":-0.01},{"label":"高過 0.25–0.5 ATR","n":2266,"win":43.4,"avgR":0.02},{"label":"高過 0.5 ATR 以上（離得遠）","n":925,"win":37.1,"avgR":-0.03}]},"slope9":{"name":"EMA 9 斜率（15 分鐘變化，ATR）","buckets":[{"label":"急跌（< −0.1）","n":5636,"win":45.9,"avgR":0.03},{"label":"向下","n":3317,"win":48.5,"avgR":0.02},{"label":"走平","n":2194,"win":48.4,"avgR":0.03},{"label":"向上","n":3958,"win":47.5,"avgR":0.01},{"label":"明顯向上（0.1–0.2）","n":2815,"win":44.5,"avgR":-0.02},{"label":"急升（> 0.2）","n":3476,"win":41.9,"avgR":0}]},"stack":{"name":"EMA 排列（價格、EMA 9、EMA 20）","buckets":[{"label":"多頭排列：價 > EMA 9 > EMA 20","n":9290,"win":44.2,"avgR":-0.02},{"label":"混亂","n":3797,"win":48.4,"avgR":0.04},{"label":"空頭排列：價 < EMA 9 < EMA 20","n":8309,"win":47,"avgR":0.04}]},"ema20d":{"name":"EMA 20 距離（ATR）","buckets":[{"label":"低過 EMA 20 超過 0.2 ATR","n":6490,"win":46.7,"avgR":0.04},{"label":"啱啱低過","n":3709,"win":49.4,"avgR":0.04},{"label":"高過 0–0.2 ATR","n":3944,"win":47.4,"avgR":0},{"label":"高過 0.2–0.5 ATR","n":4161,"win":44.4,"avgR":-0.04},{"label":"高過 0.5 ATR 以上","n":3092,"win":41.1,"avgR":0}]},"vwapd":{"name":"VWAP 距離（價格 − VWAP，ATR）","buckets":[{"label":"低過 VWAP 超過 0.3 ATR","n":1562,"win":44.1,"avgR":0.02},{"label":"啱啱低過 VWAP","n":8914,"win":46.3,"avgR":-0.01},{"label":"高過 0–0.15 ATR（貼住）","n":6160,"win":46.2,"avgR":0},{"label":"高過 0.15–0.3 ATR","n":3118,"win":47.4,"avgR":0.06},{"label":"高過 0.3–0.6 ATR","n":1453,"win":44.5,"avgR":0.07},{"label":"高過 0.6 ATR 以上","n":189,"win":36,"avgR":0.03}]},"fromOpen":{"name":"今日由開市價行咗幾多（ATR）","buckets":[{"label":"跌咗超過 0.5 ATR","n":2512,"win":44.7,"avgR":0.01},{"label":"跌咗 0–0.5 ATR","n":8256,"win":46.9,"avgR":0},{"label":"升咗 0–0.3 ATR","n":5664,"win":45.8,"avgR":0},{"label":"升咗 0.3–0.6 ATR","n":3015,"win":46,"avgR":0.04},{"label":"升咗 0.6–1 ATR","n":1379,"win":46.1,"avgR":0.08},{"label":"升咗超過 1 ATR","n":570,"win":43,"avgR":0.12}]},"range":{"name":"今日波幅用咗幾多（高 − 低，ATR）","buckets":[{"label":"少過 0.4 ATR","n":3463,"win":49.6,"avgR":0.02},{"label":"0.4–0.7 ATR","n":9468,"win":46.4,"avgR":-0.01},{"label":"0.7–1 ATR","n":4881,"win":46.4,"avgR":0.04},{"label":"1–1.5 ATR","n":2531,"win":43.4,"avgR":0.04},{"label":"超過 1.5 ATR","n":1053,"win":36.2,"avgR":0}]},"pullHod":{"name":"離全日高位幾遠（ATR）","buckets":[{"label":"貼住 HOD（< 0.05）","n":2189,"win":46.7,"avgR":0.02},{"label":"0.05–0.15 ATR","n":4234,"win":47.1,"avgR":0.03},{"label":"0.15–0.3 ATR","n":5244,"win":46.3,"avgR":0.01},{"label":"0.3–0.6 ATR","n":6081,"win":46.3,"avgR":0},{"label":"超過 0.6 ATR","n":3648,"win":43.5,"avgR":0.01}]},"atrPct":{"name":"ATR %（日線波幅 ÷ 股價）","buckets":[{"label":"少過 3%","n":3345,"win":43.2,"avgR":0.02},{"label":"3–5%","n":8304,"win":46,"avgR":0.01},{"label":"5–8%","n":7491,"win":47.2,"avgR":0.02},{"label":"8% 以上","n":2256,"win":46.6,"avgR":-0.02}]},"rvol5":{"name":"開市 RVOL（首 5 分鐘成交 ÷ 平時）","buckets":[{"label":"少過 1 倍","n":6159,"win":48.4,"avgR":0},{"label":"1–2 倍","n":7278,"win":47.2,"avgR":0.03},{"label":"2–3 倍","n":4332,"win":43.4,"avgR":-0.01},{"label":"3–5 倍","n":2157,"win":44.5,"avgR":0.03},{"label":"5 倍以上","n":1470,"win":40.2,"avgR":0.02}]},"rvolT":{"name":"累計 RVOL（到呢刻嘅成交 ÷ 平時同時段）","buckets":[{"label":"少過 1 倍","n":6606,"win":49.7,"avgR":0.02},{"label":"1–1.5 倍","n":5604,"win":47.8,"avgR":0.03},{"label":"1.5–2 倍","n":3447,"win":44.7,"avgR":0.01},{"label":"2–3 倍","n":3173,"win":42.6,"avgR":-0.01},{"label":"3 倍以上","n":2566,"win":38.7,"avgR":-0.01}]},"barVol":{"name":"呢支 K 成交 ÷ 之前 5 支平均","buckets":[{"label":"縮量（< 0.6）","n":6807,"win":45.1,"avgR":-0.01},{"label":"0.6–1","n":10870,"win":46.3,"avgR":0.02},{"label":"1–1.5","n":3041,"win":46.8,"avgR":0.02},{"label":"放量（> 1.5）","n":678,"win":47.3,"avgR":0.05}]},"rsi":{"name":"RSI 14（5 分鐘）","buckets":[{"label":"少過 30（超賣）","n":4172,"win":45.3,"avgR":0.01},{"label":"30–45","n":4575,"win":49.4,"avgR":0.07},{"label":"45–55","n":2991,"win":48.1,"avgR":0.03},{"label":"55–65","n":3213,"win":46.1,"avgR":-0.01},{"label":"65–75","n":3388,"win":43.3,"avgR":-0.04},{"label":"75 以上（超買）","n":3057,"win":43,"avgR":0}]},"hist":{"name":"MACD 柱（Histogram）","buckets":[{"label":"正數兼增加緊","n":4634,"win":44.4,"avgR":0},{"label":"正數但縮緊","n":6767,"win":45.6,"avgR":0},{"label":"負數但收窄緊","n":5999,"win":47.7,"avgR":0.04},{"label":"負數兼擴大緊","n":3996,"win":46.1,"avgR":0.01}]},"rsQ":{"name":"Relative Strength（個股 − QQQ，由開市計，%）","buckets":[{"label":"弱過 QQQ 超過 2%","n":2928,"win":44,"avgR":-0.03},{"label":"弱 0.5–2%","n":5270,"win":47,"avgR":0.01},{"label":"差唔多","n":5187,"win":47.4,"avgR":0.02},{"label":"強 0.5–2%","n":4887,"win":45.7,"avgR":0.01},{"label":"強過 QQQ 超過 2%","n":3124,"win":44.6,"avgR":0.04}]},"qVwap":{"name":"QQQ 對自己 VWAP","buckets":[{"label":"QQQ 喺 VWAP 上面","n":11550,"win":46.1,"avgR":0.02},{"label":"QQQ 喺 VWAP 下面","n":9846,"win":46,"avgR":0.01}]},"trend":{"name":"日線趨勢（20／50 日線）","buckets":[{"label":"升勢","n":6621,"win":44.2,"avgR":-0.01},{"label":"橫行","n":8637,"win":46.5,"avgR":0.02},{"label":"跌勢","n":6138,"win":47.3,"avgR":0.03}]},"dExt":{"name":"日線：昨收離 20 日線幾遠（ATR）","buckets":[{"label":"低過超過 2 ATR","n":3102,"win":47.1,"avgR":0.02},{"label":"低過 0–2 ATR","n":7707,"win":47.6,"avgR":0.03},{"label":"高過 0–1 ATR","n":3864,"win":44.6,"avgR":-0.02},{"label":"高過 1–2 ATR","n":3243,"win":43.9,"avgR":-0.02},{"label":"高過 2–3.5 ATR","n":2526,"win":45.7,"avgR":0.03},{"label":"高過 3.5 ATR 以上（離得遠）","n":954,"win":43.4,"avgR":0.01}]},"dEma9":{"name":"日線：昨收對 Daily EMA 9","buckets":[{"label":"高過 Daily EMA 9","n":10680,"win":45,"avgR":0},{"label":"低過 Daily EMA 9","n":10716,"win":47.1,"avgR":0.02}]},"gap":{"name":"今日 Gap 方向","buckets":[{"label":"Gap 高開 ≥ 2%","n":9783,"win":45.2,"avgR":-0.01},{"label":"平開（開市量大）","n":3210,"win":46.4,"avgR":0.04},{"label":"Gap 低開 ≥ 2%","n":8403,"win":46.9,"avgR":0.03}]}},"entries":{"rule":"Buy Stop 入場（11:30 前）；Target 2R；Stop；未到就 11:30 平倉","flatTop":{"name":"高位窄幅整固後突破（Flat Top）","all":{"n":1155,"win":50.3,"avgR":0.04},"aplus":{"n":222,"win":55,"avgR":0.17},"notAplus":{"n":933,"win":49.2,"avgR":0.02},"full":{"n":186,"win":57.5,"avgR":0.23},"checks":[{"key":"rvol","name":"開市 RVOL ≥ 2","yes":{"n":293,"win":50.5,"avgR":0.09},"no":{"n":862,"win":50.2,"avgR":0.03}},{"key":"qqq","name":"QQQ 喺 VWAP 上面","yes":{"n":940,"win":51,"avgR":0.05},"no":{"n":215,"win":47.4,"avgR":0.04}},{"key":"vwap","name":"價格喺 VWAP 上面","yes":{"n":1155,"win":50.3,"avgR":0.04},"no":{"n":0}},{"key":"e9vw","name":"EMA 9 喺 VWAP 上面","yes":{"n":1071,"win":50.7,"avgR":0.05},"no":{"n":84,"win":45.2,"avgR":0.03}},{"key":"stack","name":"EMA 9 喺 EMA 20 上面","yes":{"n":723,"win":54.1,"avgR":0.11},"no":{"n":432,"win":44,"avgR":-0.06}},{"key":"slope","name":"EMA 9 向上（15 分鐘升 > 0.02 ATR）","yes":{"n":978,"win":51.9,"avgR":0.08},"no":{"n":177,"win":41.2,"avgR":-0.13}},{"key":"open","name":"價格高過開市價","yes":{"n":1091,"win":49.9,"avgR":0.05},"no":{"n":64,"win":57.8,"avgR":0.01}},{"key":"rsi5070","name":"RSI 喺 50–70","yes":{"n":435,"win":49.2,"avgR":0.01},"no":{"n":720,"win":51,"avgR":0.06}},{"key":"rsi70","name":"RSI 高過 70","yes":{"n":379,"win":58.8,"avgR":0.2},"no":{"n":776,"win":46.1,"avgR":-0.03}},{"key":"macd","name":"MACD 柱係正數","yes":{"n":989,"win":51.3,"avgR":0.06},"no":{"n":166,"win":44.6,"avgR":-0.07}},{"key":"dry","name":"回調／整固嗰支 K 縮量（< 之前 5 支平均）","yes":{"n":903,"win":50.1,"avgR":0.04},"no":{"n":252,"win":51.2,"avgR":0.07}},{"key":"rs","name":"強過 QQQ（由開市計）","yes":{"n":1031,"win":50.1,"avgR":0.05},"no":{"n":124,"win":51.6,"avgR":-0.02}},{"key":"trend","name":"日線升勢","yes":{"n":326,"win":52.5,"avgR":0.08},"no":{"n":829,"win":49.5,"avgR":0.03}},{"key":"gapUp","name":"Gap 高開","yes":{"n":487,"win":56.5,"avgR":0.14},"no":{"n":668,"win":45.8,"avgR":-0.03}},{"key":"tight","name":"Stop 細過 0.2 ATR","yes":{"n":497,"win":49.3,"avgR":0.02},"no":{"n":658,"win":51.1,"avgR":0.06}},{"key":"late","name":"10:30 之後","yes":{"n":558,"win":53.9,"avgR":0.07},"no":{"n":597,"win":46.9,"avgR":0.02}}],"years":{"2024":{"aplus":{"n":78,"win":67.9,"avgR":0.41},"all":{"n":274,"win":59.1,"avgR":0.14}},"2025":{"aplus":{"n":75,"win":44,"avgR":-0.07},"all":{"n":432,"win":44.9,"avgR":-0.08}},"2026":{"aplus":{"n":69,"win":52.2,"avgR":0.14},"all":{"n":449,"win":50.1,"avgR":0.11}}}},"emaPull":{"name":"EMA 9 回調入場","all":{"n":3063,"win":42.7,"avgR":0},"aplus":{"n":649,"win":45.5,"avgR":0.09},"notAplus":{"n":2414,"win":42,"avgR":-0.03},"full":{"n":339,"win":50.1,"avgR":0.21},"checks":[{"key":"rvol","name":"開市 RVOL ≥ 2","yes":{"n":1101,"win":43.6,"avgR":0.04},"no":{"n":1962,"win":42.3,"avgR":-0.03}},{"key":"qqq","name":"QQQ 喺 VWAP 上面","yes":{"n":1946,"win":42.8,"avgR":-0.01},"no":{"n":1117,"win":42.6,"avgR":0.01}},{"key":"vwap","name":"價格喺 VWAP 上面","yes":{"n":2016,"win":43.1,"avgR":0},"no":{"n":1047,"win":42,"avgR":0}},{"key":"e9vw","name":"EMA 9 喺 VWAP 上面","yes":{"n":1515,"win":43.2,"avgR":0},"no":{"n":1548,"win":42.3,"avgR":0}},{"key":"stack","name":"EMA 9 喺 EMA 20 上面","yes":{"n":1804,"win":42,"avgR":-0.01},"no":{"n":1259,"win":43.8,"avgR":0.01}},{"key":"slope","name":"EMA 9 向上（15 分鐘升 > 0.02 ATR）","yes":{"n":2784,"win":42.9,"avgR":0},"no":{"n":279,"win":41.2,"avgR":-0.04}},{"key":"open","name":"價格高過開市價","yes":{"n":1797,"win":41.6,"avgR":-0.02},"no":{"n":1266,"win":44.4,"avgR":0.02}},{"key":"rsi5070","name":"RSI 喺 50–70","yes":{"n":1476,"win":40.9,"avgR":-0.03},"no":{"n":1587,"win":44.4,"avgR":0.02}},{"key":"rsi70","name":"RSI 高過 70","yes":{"n":573,"win":44.2,"avgR":0.03},"no":{"n":2490,"win":42.4,"avgR":-0.01}},{"key":"macd","name":"MACD 柱係正數","yes":{"n":2669,"win":42.9,"avgR":0.01},"no":{"n":394,"win":41.6,"avgR":-0.05}},{"key":"dry","name":"回調／整固嗰支 K 縮量（< 之前 5 支平均）","yes":{"n":2546,"win":41.8,"avgR":-0.01},"no":{"n":517,"win":47.4,"avgR":0.04}},{"key":"rs","name":"強過 QQQ（由開市計）","yes":{"n":1772,"win":41.5,"avgR":-0.02},"no":{"n":1291,"win":44.4,"avgR":0.02}},{"key":"trend","name":"日線升勢","yes":{"n":972,"win":42.7,"avgR":0.01},"no":{"n":2091,"win":42.8,"avgR":-0.01}},{"key":"gapUp","name":"Gap 高開","yes":{"n":1479,"win":43.5,"avgR":0.01},"no":{"n":1584,"win":42,"avgR":-0.01}},{"key":"tight","name":"Stop 細過 0.2 ATR","yes":{"n":2058,"win":42.2,"avgR":-0.02},"no":{"n":1005,"win":43.9,"avgR":0.04}},{"key":"late","name":"10:30 之後","yes":{"n":1135,"win":45.9,"avgR":0.02},"no":{"n":1928,"win":40.9,"avgR":-0.01}}],"years":{"2024":{"aplus":{"n":222,"win":46.8,"avgR":0.13},"all":{"n":783,"win":47.1,"avgR":0.08}},"2025":{"aplus":{"n":236,"win":41.5,"avgR":0.01},"all":{"n":1153,"win":36.6,"avgR":-0.14}},"2026":{"aplus":{"n":191,"win":48.7,"avgR":0.14},"all":{"n":1127,"win":46,"avgR":0.08}}}}}};

  /* ---------- ① Indicator 讀數瀏覽器：固定時間做多，按讀數分組 ---------- */
  const GROUPS = [
    ['EMA', ['ema9d', 'slope9', 'stack', 'ema20d']], ['VWAP', ['vwapd']], ['ATR', ['fromOpen', 'range', 'pullHod', 'atrPct']],
    ['成交量', ['rvol5', 'rvolT', 'barVol']], ['動量', ['rsi', 'hist']], ['大市', ['rsQ', 'qVwap']], ['日線', ['trend', 'dExt', 'dEma9', 'gap']],
  ];
  function bars(rows, max) {
    // rows: [{label, n, win, avgR}]；用橫條顯示平均 R（中間係 0）
    const m = Math.max(max || 0.1, ...rows.map((b) => Math.abs(b.avgR || 0)));
    return `<div class="l16-bars">${rows.map((b) => { const v = b.avgR || 0, w = Math.round(Math.abs(v) / m * 48);
      return `<div class="l16-row ${b.n < 300 ? 'few' : ''}"><span class="l16-lab">${esc(b.label)}</span><span class="l16-track" role="img" aria-label="平均 ${sg(v)}R"><i class="${v >= 0 ? 'pos' : 'neg'}" style="width:${w}%;${v >= 0 ? 'left:50%' : `right:50%`}"></i></span><span class="l16-val ${v >= 0 ? 'pos' : 'neg'}">${b.n ? sg(v) + 'R' : '—'}</span><span class="l16-n">${b.n ? `${b.n.toLocaleString()} 次・賺 ${b.win}%` : ''}</span></div>`; }).join('')}</div>`;
  }
  window.WIDGETS_EXTRA['l16-explorer'] = (el, only) => {
    if (!STATS) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    const keys = only || GROUPS.flatMap((g) => g[1]);
    let cur = keys[0];
    const draw = () => {
      const I = STATS.indicators[cur];
      const best = I.buckets.filter((b) => b.n >= 300).sort((a, b) => b.avgR - a.avgR)[0], worst = I.buckets.filter((b) => b.n >= 300).sort((a, b) => a.avgR - b.avgR)[0];
      const spread = best && worst ? best.avgR - worst.avgR : 0;
      el.innerHTML = `<div class="l11-w">${keys.length > 1 ? `<div class="l10-bar"><label class="l16-pick">Indicator <select data-i>${(only ? [['', keys]] : GROUPS).map(([g, ks]) => `${g ? `<optgroup label="${g}">` : ''}${ks.filter((k) => keys.includes(k)).map((k) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(STATS.indicators[k].name)}</option>`).join('')}${g ? '</optgroup>' : ''}`).join('')}</select></label></div>` : `<p class="l16-h"><b>${esc(I.name)}</b></p>`}
        ${bars(I.buckets, 0.15)}
        <p class="l10-read">${spread < 0.08 ? `最好同最差嘅組別只差 ${spread.toFixed(2)}R：<b>單睇呢個讀數，分唔出好壞</b>。` : `最好：「${esc(best.label)}」${sg(best.avgR)}R；最差：「${esc(worst.label)}」${sg(worst.avgR)}R（相差 ${spread.toFixed(2)}R，仍然好細）。`} 全部樣本平均 ${sg(STATS.all.avgR)}R。</p>
        <p class="muted">${esc(STATS.rules.probe)}。${STATS.samples.toLocaleString()} 個樣本，${STATS.daysInPlay.toLocaleString()} 個有人關注嘅日子，${STATS.universe.length} 隻大型股。淺色 = 少過 300 次。${esc(STATS.rules.note)}。</p></div>`;
      const s = el.querySelector('[data-i]'); if (s) s.addEventListener('change', () => { cur = s.value; draw(); });
    };
    draw();
  };
  // 每章用嘅細版（只顯示相關 Indicator）
  [['ema', ['ema9d', 'slope9', 'stack', 'ema20d']], ['vwap', ['vwapd']], ['atr', ['fromOpen', 'range', 'pullHod', 'atrPct']], ['vol', ['rvol5', 'rvolT', 'barVol']], ['mom', ['rsi', 'hist']], ['mkt', ['rsQ', 'qVwap']], ['daily', ['trend', 'dExt', 'dEma9', 'gap']]]
    .forEach(([id, ks]) => { window.WIDGETS_EXTRA['l16-x-' + id] = (el) => window.WIDGETS_EXTRA['l16-explorer'](el, ks); });

  /* ---------- ② 入場位嗰刻：每個讀數合格／唔合格嘅分別 ---------- */
  window.WIDGETS_EXTRA['l16-entry'] = (el) => {
    if (!STATS || !STATS.entries) { el.innerHTML = '<p class="muted">統計數據未載入。</p>'; return; }
    let cur = 'flatTop';
    const draw = () => {
      const X = STATS.entries[cur];
      const rows = X.checks.filter((c) => c.yes.n >= 150 && c.no.n >= 150).map((c) => ({ ...c, diff: c.yes.avgR - c.no.avgR })).sort((a, b) => b.diff - a.diff);
      el.innerHTML = `<div class="l11-w"><div class="l13-tabs">${Object.entries(STATS.entries).filter(([, v]) => v && v.name).map(([k, v]) => `<button class="btn sm ${k === cur ? 'primary' : ''}" data-e="${k}">${esc(v.name)}</button>`).join('')}</div>
        <div class="l11-kpis"><div><span>全部</span><b class="${X.all.avgR >= 0 ? 'pos' : 'neg'}">${sg(X.all.avgR)}R</b><small>${X.all.n.toLocaleString()} 次</small></div><div><span>A+（開市量 + QQQ）</span><b class="${X.aplus.avgR >= 0 ? 'pos' : 'neg'}">${sg(X.aplus.avgR)}R</b><small>${X.aplus.n} 次</small></div><div><span>冇 A+</span><b class="${X.notAplus.avgR >= 0 ? 'pos' : 'neg'}">${sg(X.notAplus.avgR)}R</b><small>${X.notAplus.n.toLocaleString()} 次</small></div><div><span>A+ 兼 EMA 9 向上、喺 VWAP 上面</span><b class="${X.full.avgR >= 0 ? 'pos' : 'neg'}">${sg(X.full.avgR)}R</b><small>${X.full.n} 次</small></div></div>
        <div class="l12-tablewrap"><table class="l12-t"><thead><tr><th>入場嗰刻嘅讀數</th><th>合格：平均 R</th><th>唔合格：平均 R</th><th>相差</th></tr></thead><tbody>
        ${rows.map((c) => `<tr><th scope="row">${esc(c.name)}</th><td class="${c.yes.avgR >= 0 ? 'pos' : 'neg'}">${sg(c.yes.avgR)}<small> ${c.yes.n} 次</small></td><td class="${c.no.avgR >= 0 ? 'pos' : 'neg'}">${sg(c.no.avgR)}<small> ${c.no.n} 次</small></td><td class="${c.diff >= 0 ? 'pos' : 'neg'}"><b>${sg(c.diff)}</b></td></tr>`).join('')}</tbody></table></div>
        <p class="muted">${esc(STATS.entries.rule)}。按「相差」由大到細排。相差細過 0.1R 嘅，好可能只係運氣；我哋一次過比較咗十幾個讀數，就算冇用嘅讀數都會有一兩個睇落有用。按年：${Object.entries(X.years).map(([y, v]) => `${y} 年 A+ ${sg(v.aplus.avgR)}R（${v.aplus.n} 次）`).join('、')}。</p></div>`;
      el.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.e; draw(); }));
    };
    draw();
  };

  /* ---------- ③ ATR 計算器 ---------- */
  window.WIDGETS_EXTRA['l16-atr'] = (el) => {
    const st = (() => { try { return (Store.user().toolState || {})['l16-atr'] || null; } catch (e) { return null; } })() || { atr: 9.3, pc: 168.9, open: 173.5, price: 176.2, hod: 177.4, lod: 172.8, entry: 177.45, stop: 175.6 };
    const F = [['pc', '昨日收市'], ['atr', '日線 ATR（14）'], ['open', '今日開市價'], ['price', '而家價'], ['hod', '今日最高'], ['lod', '今日最低'], ['entry', '計劃入場價'], ['stop', '計劃 Stop']];
    el.innerHTML = `<div class="l11-w"><div class="l10-form">${F.map(([k, t]) => `<label>${t} <input type="number" inputmode="decimal" step="0.01" data-k="${k}" value="${st[k]}"></label>`).join('')}</div><div class="l11-out" data-o aria-live="polite"></div></div>`;
    const show = () => {
      el.querySelectorAll('[data-k]').forEach((i) => { const v = parseFloat(i.value); if (isFinite(v)) st[i.dataset.k] = v; });
      try { const u = Store.user(); u.toolState = u.toolState || {}; u.toolState['l16-atr'] = st; Store.save(); } catch (e) {}
      const a = st.atr; if (!(a > 0)) { el.querySelector('[data-o]').innerHTML = '<p class="neg">ATR 要大過 0。</p>'; return; }
      const pct = a / st.pc * 100, used = (st.hod - st.lod) / a, from = (st.price - st.open) / a, risk = (st.entry - st.stop) / a, room = (st.pc + a - st.price) / a;
      const tag = (ok, t) => `<span class="pk-beg ${ok === true ? 'ok' : ok === false ? 'bad' : 'mid'}">${t}</span>`;
      el.querySelector('[data-o]').innerHTML = `<div class="l11-kpis">
        <div><span>ATR %</span><b>${pct.toFixed(1)}%</b><small>${pct < 2 ? '太細，Day Trade 冇肉食' : pct > 10 ? '好大，股數要細' : '適合（2–10%）'}</small></div>
        <div><span>今日波幅用咗</span><b>${used.toFixed(2)} ATR</b><small>${used > 1.5 ? '已經超過 1.5 ATR：數據顯示再追嘅勝率低' : used > 1 ? '已經行咗一日嘅量' : '仲有空間'}</small></div>
        <div><span>由開市行咗</span><b>${sg(from)} ATR</b><small>${from > 1 ? '升咗好多，Stop 要跟緊' : ''}</small></div>
        <div><span>你嘅 Stop 距離</span><b>${risk.toFixed(2)} ATR</b><small>${risk <= 0 ? 'Stop 要低過入場價' : risk < 0.1 ? '太近：正常波動都會掃到' : risk > 0.6 ? '太遠：2R 好難到' : '合理（0.1–0.6 ATR）'}</small></div>
        <div><span>2R Target 要再升</span><b>${(risk * 2).toFixed(2)} ATR</b><small>${risk > 0 ? `即係去到 ${(st.entry + 2 * (st.entry - st.stop)).toFixed(2)}` : ''}</small></div></div>
        <p>${tag(risk > 0 && risk >= 0.1 && risk <= 0.6, 'Stop 大細')} ${tag(used <= 1.5, '今日波幅')} ${tag(pct >= 2 && pct <= 10, 'ATR %')}</p>`;
    };
    el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', show));
    show();
  };

  /* ---------- ④ Indicator 分析練習圖：拖動時間，睇每個讀數同判斷 ---------- */
  const SCN = {
    trend: { name: '強勢日', rvol: 3.2, anchors: [[0, 0], [5, 0.35], [9, 0.6], [12, 0.76], [15, 0.64], [16, 0.67], [20, 0.94], [26, 1.02], [30, 0.98], [34, 1.02], [36, 1.25], [55, 1.38], [77, 1.48]] },
    fade: { name: 'Gap 高開後回落', rvol: 2.6, anchors: [[0, 0], [3, 0.28], [6, 0.08], [10, -0.2], [16, -0.1], [24, -0.5], [40, -0.72], [77, -0.6]] },
    chop: { name: '橫行日', rvol: 0.8, anchors: [[0, 0], [4, 0.15], [8, -0.1], [13, 0.12], [18, -0.08], [24, 0.1], [32, -0.1], [45, 0.08], [60, -0.05], [77, 0.05]] },
  };
  function indicators(B, A) {
    const k = (p) => 2 / (p + 1); let e9 = B[0].c, e20 = B[0].c, pv = 0, vv = 0, ag = null, al = null;
    return B.map((b, i) => {
      e9 = b.c * k(9) + e9 * (1 - k(9)); e20 = b.c * k(20) + e20 * (1 - k(20));
      pv += ((b.h + b.l + b.c) / 3) * b.v; vv += b.v;
      if (i > 0) { const ch = b.c - B[i - 1].c, g = Math.max(ch, 0), l = Math.max(-ch, 0); ag = ag == null ? g : (ag * 13 + g) / 14; al = al == null ? l : (al * 13 + l) / 14; }
      return { e9, e20, vw: pv / vv, rsi: i < 6 || al == null ? null : al === 0 ? 100 : 100 - 100 / (1 + ag / al) };
    });
  }
  window.WIDGETS_EXTRA['l16-lab'] = (el) => {
    let scn = 'trend', seed = 41, i = 16, D = null;
    const gen = () => { const r = rng(1600 + seed); const P0 = 60 + Math.round(r() * 240), A = P0 * (0.035 + r() * 0.015); const B = genPath(r, P0, A, SCN[scn].anchors, 0.9); D = { B, A, P0, I: indicators(B, A) }; };
    const read = () => {
      const { B, A, I } = D, b = B[i], x = I[i], hod = Math.max(...B.slice(0, i + 1).map((y) => y.h)), lod = Math.min(...B.slice(0, i + 1).map((y) => y.l));
      const slope = i >= 3 ? (x.e9 - I[i - 3].e9) / A : 0, d9 = (b.c - x.e9) / A, dv = (b.c - x.vw) / A, from = (b.c - B[0].o) / A, used = (hod - lod) / A;
      const seg = B.slice(Math.max(0, i - 3), i + 1), tight = i >= 8 && Math.max(...seg.map((y) => y.h)) - Math.min(...seg.map((y) => y.l)) <= 0.25 * A && hod - Math.max(...seg.map((y) => y.h)) <= 0.08 * A && hod - B[0].o >= 0.25 * A && Math.min(...seg.map((y) => y.l)) >= x.vw;
      const touch = b.l <= x.e9 + 0.03 * A && b.c >= x.e9 - 0.05 * A && i >= 2 && B[i - 1].c > I[i - 1].e9 && b.c > B[0].o && x.e9 > x.vw;
      const rv = SCN[scn].rvol;
      const rows = [
        ['開市 RVOL', `首 5 分鐘成交係平時 ${rv} 倍`, rv >= 2],
        ['VWAP', `價格${dv >= 0 ? '高過' : '低過'} VWAP ${Math.abs(dv).toFixed(2)} ATR`, dv > 0],
        ['EMA 排列', x.e9 > x.e20 ? 'EMA 9 喺 EMA 20 上面' : 'EMA 9 喺 EMA 20 下面', x.e9 > x.e20],
        ['EMA 9 斜率', slope > 0.02 ? '向上' : slope < -0.02 ? '向下' : '走平', slope > 0.02],
        ['離 EMA 9', `${d9 >= 0 ? '高過' : '低過'} ${Math.abs(d9).toFixed(2)} ATR${d9 > 0.25 ? '（離得遠）' : ''}`, d9 >= -0.05 && d9 <= 0.25],
        ['RSI 14', x.rsi == null ? '未有數（要等多幾支 K）' : x.rsi.toFixed(0) + (x.rsi >= 70 ? '（動力強）' : x.rsi <= 30 ? '（弱）' : ''), x.rsi == null ? null : x.rsi >= 50],
        ['ATR：今日用咗', `${used.toFixed(2)} ATR，由開市 ${sg(from)} ATR`, used <= 1.5],
      ];
      let v, cls = 'mid';
      if (i < 3) v = '⏳ 開市頭 15 分鐘：Indicator 未穩定，唔落單。';
      else if (i > 23) v = '🛑 已經過咗 11:30：唔開新倉（Level 15）。';
      else if (rv < 2) { v = `❌ 開市量只有平時 ${rv} 倍（要 ≥ 2 倍）：今日呢隻唔做。橫行日都會出現似入場位嘅形狀，量唔夠就唔好信。`; cls = 'bad'; }
      else if (dv < 0) { v = '❌ 價格喺 VWAP 下面：唔做多。'; cls = 'bad'; }
      else if (!(x.e9 > x.e20) || slope <= 0.02) v = '⏳ EMA 9 未向上或者未喺 EMA 20 上面：未有趨勢，等。';
      else if (tight) { v = `✅ 入場位：喺全日高位下面窄幅整固（Flat Top）。Buy Stop 放 HOD ${hod.toFixed(2)} 上面，Stop 放整固低位 ${Math.min(...seg.map((y) => y.l)).toFixed(2)} 下面。`; cls = 'ok'; }
      else if (touch) { v = `✅ 入場位：回調掂到 EMA 9 兼守住。Buy Stop 放呢支 K 高位 ${b.h.toFixed(2)} 上面，Stop 放 EMA 9／低位下面（${(Math.min(b.l, x.e9) - 0.03 * A).toFixed(2)}）。`; cls = 'ok'; }
      else if (d9 > 0.25) v = `⚠️ 讀數全部好靚，但離 EMA 9 有 ${d9.toFixed(2)} ATR：呢度追入 Stop 好遠。等回調掂 EMA 9，或者高位整固。`;
      else v = '👀 背景合格，但未有入場位：等回調掂 EMA 9 守住，或者高位窄幅整固。';
      return { rows, v, cls };
    };
    const chart = (box) => {
      const { B, I } = D, W = 800, pH = 250, rH = 70, vH = 46, H = pH + rH + vH + 24, m = { l: 8, r: 64, t: 12 }, step = (W - m.l - m.r) / B.length;
      let lo = Math.min(...B.map((b) => b.l)), hi = Math.max(...B.map((b) => b.h)); const pd = (hi - lo) * 0.05; lo -= pd; hi += pd;
      const y = (p) => m.t + (hi - p) / (hi - lo) * (pH - m.t - 4), x = (k) => m.l + step * k + step / 2;
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': 'Indicator 練習圖' });
      for (let k = 0; k <= 4; k++) { const p = lo + (hi - lo) * k / 4; mk('line', { x1: m.l, x2: W - m.r, y1: y(p), y2: y(p), class: 'grid' }, svg); const t = mk('text', { x: W - m.r + 6, y: y(p) + 4, class: 'axis' }, svg); t.textContent = p.toFixed(2); }
      if (i + 1 < B.length) mk('rect', { x: m.l + step * (i + 1), y: m.t - 4, width: step * (B.length - i - 1), height: H - 24 - m.t, class: 'l12-future' }, svg);
      const bw = Math.max(1.6, step * 0.64), vmax = Math.max(...B.map((b) => b.v)), vy0 = pH + rH + vH;
      B.slice(0, i + 1).forEach((b, k) => {
        const g = mk('g', { class: 'candle ' + (b.c >= b.o ? 'up' : 'down') }, svg);
        mk('line', { x1: x(k), x2: x(k), y1: y(b.h), y2: y(b.l), class: 'wick' }, g);
        const top = y(Math.max(b.o, b.c)), bot = y(Math.min(b.o, b.c));
        mk('rect', { x: x(k) - bw / 2, y: top, width: bw, height: Math.max(1.2, bot - top), class: 'body' }, g);
        const vh = (b.v / vmax) * (vH - 6); mk('rect', { x: x(k) - bw / 2, y: vy0 - vh, width: bw, height: vh, class: 'vol' }, g);
      });
      const line = (f, cls) => { const pts = I.slice(0, i + 1).map((v, k) => x(k) + ',' + y(f(v))); if (pts.length > 1) mk('polyline', { points: pts.join(' '), class: cls }, svg); };
      line((v) => v.vw, 'vwap-line'); line((v) => v.e20, 'l16-e20'); line((v) => v.e9, 'l10-ema');
      [['vwap-label', 'VWAP'], ['l10-ema-label', 'EMA 9'], ['l16-e20-label', 'EMA 20']].forEach(([c, t], k) => { const e = mk('text', { x: m.l + 6 + k * 62, y: m.t + 8, class: c + ' l10-lg' }, svg); e.textContent = t; });
      // RSI
      const ry = (v) => pH + 6 + (100 - v) / 100 * (rH - 12);
      [30, 50, 70].forEach((v) => { mk('line', { x1: m.l, x2: W - m.r, y1: ry(v), y2: ry(v), class: 'grid' }, svg); const t = mk('text', { x: W - m.r + 6, y: ry(v) + 4, class: 'axis' }, svg); t.textContent = 'RSI ' + v; });
      const rp = I.slice(0, i + 1).map((v, k) => (v.rsi == null ? null : x(k) + ',' + ry(v.rsi))).filter(Boolean); if (rp.length > 1) mk('polyline', { points: rp.join(' '), class: 'l16-rsi' }, svg);
      const xx = m.l + step * 24; mk('line', { x1: xx, x2: xx, y1: m.t - 4, y2: H - 24, class: 'l10-break' }, svg); const t3 = mk('text', { x: xx + 4, y: pH - 4, class: 'axis' }, svg); t3.textContent = '11:30';
      B.forEach((b, k) => { if (k % 9) return; const t = mk('text', { x: Math.max(x(k), m.l + 18), y: H - 6, class: 'axis', 'text-anchor': 'middle' }, svg); t.textContent = b.t; });
      box.innerHTML = ''; box.appendChild(svg);
    };
    const render = (full) => {
      if (full) el.innerHTML = `<div class="l10-w"><div class="l10-bar"><label>情境 <select data-s>${Object.entries(SCN).map(([k, v]) => `<option value="${k}" ${k === scn ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label><button class="btn sm" data-new>另一張圖</button><button class="btn sm" data-step="-1">◀ 上一支</button><button class="btn sm primary" data-step="1">下一支 ▶</button></div>
        <label class="l16-slider">時間 <b data-t></b><input type="range" min="1" max="60" step="1" data-r aria-label="時間"></label>
        <div class="l12-chart" data-c></div><div class="l16-panel" data-p aria-live="polite"></div></div>`;
      el.querySelector('[data-r]').value = i; el.querySelector('[data-t]').textContent = D.B[i].t;
      chart(el.querySelector('[data-c]'));
      const R = read();
      el.querySelector('[data-p]').innerHTML = `<div class="l16-reads">${R.rows.map(([n, t, ok]) => `<div class="${ok === true ? 'ok' : ok === false ? 'bad' : 'na'}"><span>${n}</span><b>${ok === true ? '✅' : ok === false ? '❌' : '・'} ${esc(t)}</b></div>`).join('')}</div><p class="l16-verdict ${R.cls}">${esc(R.v)}</p>`;
      if (full) {
        el.querySelector('[data-s]').addEventListener('change', (e) => { scn = e.target.value; i = 16; gen(); render(true); });
        el.querySelector('[data-new]').addEventListener('click', () => { seed += 13; gen(); render(true); });
        el.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { i = Math.max(1, Math.min(60, i + +b.dataset.step)); render(false); }));
        el.querySelector('[data-r]').addEventListener('input', (e) => { i = +e.target.value; render(false); });
      }
    };
    gen(); render(true);
  };
})();

window.COURSE.push({
  id: 'l16',
  code: 'Level 16',
  title: 'Indicator 實戰：EMA、VWAP、ATR、RVOL、RSI',
  subtitle: '每個 Indicator 量度乜、點讀、幾時可以做多、邊個讀數先係「靚」：EMA 9／20、VWAP、ATR、RVOL、RSI、MACD、Relative Strength、日線均線；全部用真實數據驗證',
  icon: '📊',
  color: '#0e7490',
  question: 'EMA、ATR 呢啲 Indicator 點分析？幾時可以做多、幾時入場最好？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l16-c1', num: '1', title: 'Indicator 係乜？數據話「靚」唔等於「買」', mins: 9,
  summary: 'Indicator 係將價格同成交量再計一次，全部都係滯後。真實數據顯示：喺固定時間單睇任何一個讀數（包括全部轉綠）都預測唔到之後一小時。Indicator 嘅正確用法係三樣：睇背景、搵入場位、計風險。',
  keywords: ['Indicator', '滯後', '背景', '入場位'],
  md: `
:::info 呢個 Level 點嚟
用戶話：「想有一個 Level 專講 Indicator，例如 EMA、ATR，點分析、幾時可以做 Long、幾時最適合入、呢啲數據幾時最靚。」呢個 Level 逐個 Indicator 講：量度乜、點讀、數據話幾時有用。全部針對**做多**。
:::

## 1.1 四類 Indicator

| 類別 | 量度乜 | 例子 | 喺邊章 |
|---|---|---|---|
| **趨勢** | 價格平均向邊 | EMA 9、EMA 20、VWAP、日線 SMA 20／50 | 2、3、9 |
| **波幅** | 一日通常行幾遠 | ATR、ATR % | 4 |
| **成交量** | 有幾多人參與 | RVOL、成交量柱 | 5 |
| **動量** | 升跌有幾急 | RSI、MACD | 6、7 |

全部都係由**已經發生**嘅價格同成交量計出嚟，所以一定**滯後**：價格轉咗，Indicator 先跟住轉。

## 1.2 先睇數據：邊個讀數做多最好？

我哋喺 09:50、10:10、10:30 各做一次「試單」（買入、Stop 0.25 ATR、Target 0.5 ATR、最多揸 60 分鐘），共 21,396 個樣本，再按當時每個 Indicator 嘅讀數分組。揀唔同 Indicator 睇吓：

[[widget:l16-explorer]]

:::key 最重要嘅發現
**冇任何一個 Indicator 嘅讀數，單獨睇可以預測之後一小時。** 每個組別嘅平均都喺 0 附近（最多 ±0.1R）。

連「全部轉綠」都冇用：我哋預先定咗 8 個條件（喺 VWAP 上面、多頭排列、EMA 9 向上、RVOL ≥ 2、RSI 50–70、冇離 EMA 9 太遠、QQQ 喺 VWAP 上面、今日未行超過 1 ATR）：
- 合 6–7 個：平均 −0.03R（5,511 次）
- 只合 3 個或以下：平均 +0.01R（6,421 次）

即係話，**Indicator 最靚嗰陣，通常係價格已經升完一段**，嗰刻先買並冇著數。
:::

## 1.3 咁 Indicator 有咩用？

:::steps 三個正確用途
1. **睇背景**：今日買家定賣家控制？（VWAP、EMA 排列）值唔值得留意呢隻股？（RVOL、ATR %）
2. **搵入場位**：價格回到 EMA 9、喺高位整固。入場靠「事件」，唔係靠讀數（第 10 章）
3. **計風險**：Stop 放幾遠、今日仲有冇空間（ATR）
:::

:::coach 一句講晒
Indicator 話你知「而家係咩環境」，唔會話你知「而家買」。第 10 章嘅數據會顯示：喺**入場位嗰刻**，某啲讀數先真係有分別。
:::

[[quiz:l16-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c2', num: '2', title: 'EMA 9 同 EMA 20：斜率、排列、距離', mins: 10,
  summary: 'EMA 係加重近期價格嘅平均線。睇三樣：斜率（向上先考慮做多）、排列（價 > EMA 9 > EMA 20）、距離（離 EMA 9 太遠就唔追）。EMA 9 係強勢股嘅回調位；突破入場時 EMA 9 要喺 EMA 20 上面兼向上。',
  keywords: ['EMA 9', 'EMA 20', '多頭排列', '斜率'],
  md: `
## 2.1 EMA 係乜

**EMA**（Exponential Moving Average，指數移動平均）= 最近 N 支 K 嘅平均收市價，越近期比重越大。

- **EMA 9**（5 分鐘圖）≈ 最近 45 分鐘嘅平均：短線買家嘅成本
- **EMA 20**（5 分鐘圖）≈ 最近 100 分鐘嘅平均：今朝嘅趨勢
- TradingView：Indicators → **Moving Average Exponential** → Length 9（或者 20）、Source Close（Level 10 第 8 章）

## 2.2 三樣要讀嘅嘢

| 讀乜 | 點睇 | 做多嘅意思 |
|---|---|---|
| **斜率** | EMA 9 向上、走平定向下 | 向上先有趨勢；走平 = 橫行 |
| **排列** | 價格、EMA 9、EMA 20 邊個喺上面 | 價 > EMA 9 > EMA 20 = **多頭排列** |
| **距離** | 價格離 EMA 9 幾遠（用 ATR 計） | 貼住 = 可以搵入場位；離得遠 = 唔追 |

## 2.3 數據：固定時間單睇 EMA

[[widget:l16-x-ema]]

:::warn 留意
固定時間嚟睇，**多頭排列（−0.02R）反而冇空頭排列（+0.04R）咁好**，離 EMA 9 超過 0.5 ATR 嘅賺錢機會只有 37%。原因：排列靚、斜率急嗰陣，價格已經升咗一大段，隨時回調。**唔係見到多頭排列就買。**
:::

## 2.4 EMA 真正有用嘅兩個時候

**① 回調位（EMA 9 Pullback，Level 15 第 6 章）**
強勢股回調好淺，掂一掂 EMA 9 就再升。入場靠「掂到 + 守住 + 下一支升穿高位」。

**② 突破時嘅確認**
高位整固後突破（Flat Top）嗰刻：

| 入場嗰刻 | 合格 | 唔合格 |
|---|---|---|
| EMA 9 喺 EMA 20 上面 | +0.11R（723 次） | −0.06R（432 次） |
| EMA 9 向上 | +0.08R（978 次） | −0.13R（177 次） |

:::key EMA 點用（做多）
- **背景**：EMA 9 向上、喺 EMA 20 上面 → 可以搵做多機會
- **入場**：等價格**回到** EMA 9 守住，或者喺高位整固到 EMA 9 追上嚟
- **唔做**：EMA 9 走平或者向下；價格離 EMA 9 超過 0.25 ATR（追高）
- **出場參考**：5 分鐘 K 收市跌穿 EMA 9，代表短線動力轉弱
:::

[[quiz:l16-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c3', num: '3', title: 'VWAP：今日嘅平均成本', mins: 7,
  summary: 'VWAP 係今日所有成交嘅平均價。價格喺 VWAP 上面代表今日買入嘅人平均賺緊錢，買家控制。做多嘅基本條件係喺 VWAP 上面；但只係「喺上面」並唔係入場訊號。',
  keywords: ['VWAP', '平均成本'],
  md: `
## 3.1 VWAP 量度乜

**VWAP**（Volume Weighted Average Price）= 今日到而家為止，每一股平均成交價。大戶用佢衡量買得平定貴，所以好多人睇。

| 位置 | 意思 |
|---|---|
| 價格喺 VWAP **上面** | 今日買入嘅人平均賺緊，買家控制 |
| 價格喺 VWAP **下面** | 今日買入嘅人平均蝕緊，隨時有人止蝕 |
| 價格**貼住** VWAP 上上落落 | 橫行日，冇方向 |

## 3.2 數據

[[widget:l16-x-vwap]]

固定時間睇，喺 VWAP 上面（+0.03R）同下面（0.00R）分別好細。VWAP 嘅作用係**過濾**同**定位**，唔係訊號。

## 3.3 VWAP 點用（做多）

:::key
- **基本條件**：做多只喺 VWAP 上面搵。Level 15 嘅 Flat Top 規則就要求整固唔可以跌穿 VWAP
- **EMA 9 喺 VWAP 上面**：代表短線同全日都係買家控制。EMA 9 回調入場，加埋 A+ 過濾、EMA 9 向上同喺 VWAP 上面，平均 +0.21R（339 次）；全部 EMA 9 回調就只有 0.00R
- **失效線**：5 分鐘 K 收市跌穿 VWAP，做多計劃取消
- **大市都睇 VWAP**：QQQ 喺自己 VWAP 上面，係 A+ 過濾嘅一半（Level 15）
:::

:::tip 設定
TradingView 開咗 Extended Hours，Session VWAP 會由 04:00 計起（Level 10 第 8 章）。統計用嘅係 09:30 起計嘅 VWAP。兩個數會有少少唔同，開市一小時後會越嚟越近。
:::

[[quiz:l16-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c4', num: '4', title: 'ATR：唔係方向，係把尺', mins: 10,
  summary: 'ATR 係一日平均波幅。佢唔會話你知升定跌，但係量度所有嘢嘅尺：Stop 放幾遠（0.1–0.6 ATR）、今日用咗幾多波幅（超過 1.5 ATR 就唔追）、隻股夠唔夠波幅（ATR % 2–10%）。',
  keywords: ['ATR', 'ATR %', 'Stop', '波幅'],
  md: `
## 4.1 ATR 係乜

**ATR**（Average True Range，平均真實波幅）= 過去 14 日，每日（最高 − 最低，計埋 Gap）嘅平均。例如 NVDA ATR 9.3 元 = 佢平時一日上落大約 9.3 元。

**ATR 冇方向**：升市同跌市都可以有大 ATR。佢係一把**尺**。

## 4.2 三個用途

| 用途 | 點計 | 參考 |
|---|---|---|
| **① Stop 幾遠** | （入場 − Stop）÷ ATR | 0.1–0.6 ATR。太近會俾正常波動掃走，太遠 2R 好難到 |
| **② 今日用咗幾多** | （今日最高 − 最低）÷ ATR | 超過 1.5 ATR：今日嘅波幅差唔多用完 |
| **③ 揀股** | ATR ÷ 股價 = **ATR %** | 2–10% 適合 Day Trade（報告嘅 9 個指標之一） |

## 4.3 自己計

[[widget:l16-atr]]

## 4.4 數據

[[widget:l16-x-atr]]

:::key 數據點講
- **今日波幅已經超過 1.5 ATR**：之後做多賺錢機會只有 36%（其他組別四成半左右）。波幅用完就唔好追
- **ATR % 高低**本身冇分好壞（+0.02R 至 −0.02R）：佢決定嘅係你買幾多股，唔係贏面
- **Stop 大細**：Flat Top 入場，Stop 細過 0.2 ATR 係 +0.02R，大過 0.2 ATR 係 +0.06R。Stop 唔係越細越好，要放喺結構（整固低位）下面
:::

:::tip 用 ATR 講嘢
成個課程同每日報告都用 ATR 做單位（「0.3 ATR 唔追」「Stop 最多 0.5 ATR」），因為 $2 對 $20 嘅股好大、對 $700 嘅股好細，用 ATR 先比較到。報告每隻 pick 都有 ATR。
:::

[[quiz:l16-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c5', num: '5', title: 'RVOL 同成交量：有冇人參與', mins: 8,
  summary: 'RVOL 係今日成交同平時比較。RVOL ≥ 2 代表今日有新資金關注，係選股嘅硬條件。單睇 RVOL 預測唔到升跌，但喺入場位，開市量大嘅日子成績明顯好啲；配合 QQQ 喺 VWAP 上面就係 A+ 過濾。',
  keywords: ['RVOL', 'Relative Volume', '成交量'],
  md: `
## 5.1 三個成交量讀數

| 讀數 | 點計 | 幾時睇 |
|---|---|---|
| **盤前 RVOL** | 盤前成交 ÷ 平時同時段 | 開市前揀股（報告已經計好，≥ 2 先入選） |
| **開市 RVOL** | 首 5 分鐘成交 ÷ 平時首 5 分鐘 | 09:35（報告寫咗「要見 ≥ X 萬股」） |
| **成交量柱** | 呢支 K 同之前幾支比較 | 突破要放量；回調通常縮量 |

TradingView 可以加 **Relative Volume at Time**（Level 10 第 8 章）。

## 5.2 數據

[[widget:l16-x-vol]]

固定時間單睇 RVOL，高同低冇乜分別。但**喺入場位**就唔同：

| 入場位 | 開市 RVOL ≥ 2 | 少過 2 |
|---|---|---|
| EMA 9 回調 | +0.04R | −0.03R |
| Flat Top | +0.09R | +0.03R |

加埋 QQQ 喺 VWAP 上面（A+ 過濾）：EMA 9 回調 +0.09R 對 −0.03R；Flat Top +0.17R 對 +0.02R。

:::warn 一個同教科書唔同嘅結果
好多書話「回調要縮量先健康」。我哋嘅數據：EMA 9 回調嗰支 K 縮量係 −0.01R，冇縮量反而係 +0.04R。分別好細，可能只係運氣，但最少話你知：**唔使因為回調冇縮量就放棄**。
:::

:::key RVOL 點用
- **選股**：盤前 RVOL ≥ 2（硬規則）
- **09:35**：首 5 分鐘成交 ≥ 平時 2 倍，先繼續留意呢隻
- **突破**：突破嗰支 K 嘅成交要明顯大過之前幾支
- RVOL 高**唔代表會升**，只代表「今日會郁」
:::

[[quiz:l16-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c6', num: '6', title: 'RSI：動量，唔係「超買就沽」', mins: 8,
  summary: 'RSI 量度最近升幅同跌幅嘅比例，0–100。Day Trade 強勢股 RSI 可以長時間喺 70 以上。數據：高位整固突破嗰刻 RSI 高過 70 反而最好；固定時間見 RSI 高就買就冇用。',
  keywords: ['RSI', '超買', '超賣', '動量'],
  md: `
## 6.1 RSI 係乜

**RSI**（Relative Strength Index，14）比較最近 14 支 K 嘅平均升幅同平均跌幅：
- 50 = 升跌力量一樣
- 高過 50 = 最近升多過跌
- 70 以上 = 傳統叫「超買」；30 以下 = 「超賣」

## 6.2 最常見嘅誤會

:::bad 「RSI 過 70 = 超買 = 就快跌」
喺強勢日，RSI 可以成朝都喺 70 以上，價格繼續升。見 70 就沽空（或者唔敢買），會錯過最強嘅股。
:::

## 6.3 數據

[[widget:l16-x-mom]]

| 情況 | 結果 |
|---|---|
| 固定時間，RSI 65–75 | −0.04R（3,388 次）：見 RSI 高就買，冇著數 |
| 固定時間，RSI 30–45 | +0.07R（4,575 次）：稍為好啲（跌咗少少之後反彈），但好細 |
| **Flat Top 突破嗰刻**，RSI 高過 70 | +0.20R（379 次） |
| Flat Top 突破嗰刻，RSI 70 或以下 | −0.03R（776 次） |

:::key RSI 點用（做多）
- **突破**：RSI 高過 60–70 代表動力夠，係好事，唔係壞事
- **回調**：強勢股回調時 RSI 通常跌返落 45–60 就再上；跌穿 40 代表動力冇咗
- **唔好用嚟**：估頂、估底、單獨做入場訊號
- 免費版 TradingView 一個圖只有 2 個指標：RSI 排喺 VWAP 同 EMA 9 之後，冇位就唔使加
:::

[[quiz:l16-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c7', num: '7', title: 'MACD：兩條 EMA 嘅距離', mins: 6,
  summary: 'MACD 係 EMA 12 減 EMA 26，柱（Histogram）係 MACD 同訊號線嘅差。佢同 EMA 排列講緊同一樣嘢，只係畫法唔同。突破時 MACD 柱係正數較好；單獨用就冇預測力。',
  keywords: ['MACD', 'Histogram', '訊號線'],
  md: `
## 7.1 MACD 三樣嘢

| 部分 | 計法 | 意思 |
|---|---|---|
| **MACD 線** | EMA 12 − EMA 26 | 短期平均高過長期幾多 |
| **訊號線** | MACD 線嘅 EMA 9 | MACD 嘅平均 |
| **柱（Histogram）** | MACD 線 − 訊號線 | 動力加緊定減緊 |

柱係正數兼越嚟越高 = 升勢加速；正數但縮緊 = 升勢放慢。

## 7.2 數據

固定時間睇，四種柱嘅狀態都喺 0 附近（上一章個圖揀「MACD 柱」）。入場位就有少少分別：

| Flat Top 突破嗰刻 | 平均 R |
|---|---|
| MACD 柱係正數 | +0.06R（989 次） |
| MACD 柱係負數 | −0.07R（166 次） |

:::coach 要唔要加 MACD？
MACD 同「EMA 9 喺 EMA 20 上面兼向上」其實講緊同一樣嘢（都係由 EMA 計出嚟）。你已經有 EMA 9、EMA 20 嘅話，MACD 係**重複**。新手建議：**VWAP + EMA 9 + 成交量**就夠；想加第四樣就揀 EMA 20，唔使加 MACD。
:::

[[quiz:l16-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c8', num: '8', title: 'Relative Strength 同 QQQ', mins: 6,
  summary: 'Relative Strength 係個股升幅減大市升幅。強過 QQQ 嘅股代表有獨立買盤。QQQ 喺自己 VWAP 上面係做多嘅大環境條件；兩樣單獨睇都唔係訊號，但係 A+ 過濾嘅一部分。',
  keywords: ['Relative Strength', 'QQQ', '大市'],
  md: `
## 8.1 兩個讀數

| 讀數 | 點計 | 意思 |
|---|---|---|
| **Relative Strength** | 個股今日 % − QQQ 今日 % | 正數 = 強過大市，有自己嘅買盤 |
| **QQQ 對 VWAP** | QQQ 喺自己 VWAP 上面定下面 | 上面 = 大市買家控制，做多順風 |

注意：呢個 Relative Strength **唔係 RSI**。名好似，但完全唔同（Level 6）。

## 8.2 數據

[[widget:l16-x-mkt]]

固定時間單睇，兩個都冇分別。但 Level 15 嘅結果話你知：**開市量 ≥ 2 倍 + QQQ 喺 VWAP 上面**（A+ 過濾）一齊用，主力 Setup 先由 0 變正數。

:::key 點用
- **開市前**：報告每隻股有 Relative Strength；做多揀正數嘅
- **入場前**：望一望第二個 Mon 嘅 QQQ 5 分鐘圖，喺 VWAP 下面就唔做多
- **持倉中**：QQQ 突然跌穿 VWAP，係提早離場嘅合理原因（Level 14 第 11 章）
:::

[[quiz:l16-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c9', num: '9', title: '日線 Indicator：SMA 20／50、Daily EMA 9', mins: 7,
  summary: '日線均線話你知隻股嘅大方向同有幾「遠離」平均。Level 15 已經證明日線升勢本身唔加分；呢度再睇 Daily EMA 9 同離 20 日線嘅距離，結果一樣：佢哋係選股範圍，唔係入場訊號。',
  keywords: ['SMA 20', 'SMA 50', 'Daily EMA 9', '日線'],
  md: `
## 9.1 三個日線讀數

| 讀數 | 點睇 |
|---|---|
| **日線趨勢** | 昨收 > 20 日線 > 50 日線 = 升勢（Level 15 第 2 章） |
| **Daily EMA 9** | 昨收喺上面 = 短線強；報告每隻 pick 都有寫 |
| **離 20 日線幾遠** | （昨收 − 20 日線）÷ ATR。超過 3 ATR = 已經升咗好多 |

## 9.2 數據

[[widget:l16-x-daily]]

:::key 數據點講
- 日線升勢（−0.01R）、橫行（+0.02R）、跌勢（+0.03R）：冇分別
- 高過（0.00R）定低過（+0.02R）Daily EMA 9：冇分別
- 離 20 日線遠近：冇清楚規律
:::

:::coach 咁日線仲睇唔睇？
睇，但目的唔同：
- **選股範圍**：你想專做升勢股（Level 15），日線趨勢就係你嘅篩選
- **搵阻力**：20 日線、50 日線、20 日高位係好多人睇嘅位。Target 之前有冇呢啲位？
- **Flat Top 入場**，日線升勢係 +0.08R，非升勢 +0.03R：有少少幫助，但細過 EMA 排列同 RSI
:::

[[quiz:l16-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c10', num: '10', title: '幾時最靚？背景合格 + 入場位出現', mins: 12,
  summary: '「靚」唔係所有 Indicator 轉綠，而係兩樣嘢一齊出現：背景合格（VWAP 上面、EMA 9 向上兼喺 EMA 20 上面、開市量夠、QQQ 配合），同埋價格去到入場位（回調掂 EMA 9 守住，或者高位窄幅整固）。用練習圖逐支 K 睇。',
  keywords: ['入場位', '背景', 'Checklist'],
  md: `
## 10.1 兩層思考

| 層 | 問題 | 睇乜 |
|---|---|---|
| **背景**（幾時可以做多） | 而家值唔值得搵做多機會？ | 價格喺 VWAP 上面；EMA 9 向上兼喺 EMA 20 上面；開市 RVOL ≥ 2；QQQ 喺 VWAP 上面；今日波幅未過 1.5 ATR |
| **入場位**（幾時入） | 而家係咪低風險嘅位？ | ① 回調掂 EMA 9 兼守住　② 高位窄幅整固（Flat Top） |

**背景合格但冇入場位 = 等。** 呢個就係第 1 章「全部轉綠都冇用」嘅原因：轉綠嗰陣價格通常離 EMA 9 好遠，Stop 好闊。

## 10.2 數據：入場位嗰刻，邊啲讀數真係有分別

[[widget:l16-entry]]

:::key 點讀呢個表
- **Flat Top 突破**：EMA 9 向上、EMA 9 喺 EMA 20 上面、RSI 高過 70、MACD 柱正數、Gap 高開，全部都好過唔合格嗰邊。突破要嘅係**動力**
- **EMA 9 回調**：冇一個讀數單獨有大分別；要**幾樣一齊**（開市量 + QQQ + EMA 9 向上兼喺 VWAP 上面）先由 0.00R 變 +0.21R
- 相差細過 0.1R 嘅唔好當真
:::

## 10.3 練習：逐支 K 讀 Indicator

拖動時間或者撳「下一支」，睇每個讀數點變，同埋嗰刻係「等」定「入場位」。試埋「Gap 高開後回落」同「橫行日」，睇吓唔做多嘅日子係點：

[[widget:l16-lab]]

:::steps 你會留意到
1. 開市頭 15 分鐘：讀數跳嚟跳去，冇意思
2. 急升嗰陣：全部綠晒，但「離 EMA 9」變紅：唔追
3. 回調掂 EMA 9 守住：入場位出現，Stop 就喺 EMA 9 下面，好近
4. 高位橫行：EMA 9 慢慢追上嚟，整固夠窄就係 Flat Top
5. 跌穿 VWAP：做多計劃取消
:::

[[check:l16-long]]

[[quiz:l16-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l16-c11', num: '11', title: 'TradingView 設定、常見錯誤同總測驗', mins: 9,
  summary: '免費版只放 VWAP + EMA 9；付費版加 EMA 20、Relative Volume at Time。常見錯誤：Indicator 加太多、見轉綠就追、RSI 過 70 就沽、用 Indicator 代替 Stop。',
  keywords: ['TradingView', '設定', '常見錯誤'],
  md: `
## 11.1 圖表放邊幾個

| TradingView 計劃 | 5 分鐘圖 | 日線圖（另一個分頁） |
|---|---|---|
| 免費（每圖 2 個指標） | **VWAP + EMA 9**（成交量內置） | SMA 20 + SMA 50 |
| Essential（5 個） | VWAP、EMA 9、EMA 20、Relative Volume at Time | SMA 20、SMA 50、ATR |

- **ATR**：唔使放喺 5 分鐘圖。每日報告已經有每隻股嘅 ATR；或者喺日線圖加 ATR（Length 14）
- **RSI、MACD**：可有可無（第 6、7 章）

[[link:c/l10-c8|📖 溫習：Level 10 第 8 章指標設定]]

## 11.2 五個常見錯誤

:::bad
1. **加十個 Indicator**：大部分講緊同一樣嘢（EMA、MACD 都係平均線），只會令你更遲決定
2. **見全部轉綠就追**：轉綠 = 已經升完一段。等回調或者整固
3. **RSI 過 70 就驚**：強勢股嘅 RSI 就係高
4. **用 Indicator 代替 Stop**：「跌穿 EMA 9 先走」但冇實際 Stop 單，急跌時走唔切
5. **Indicator 之間打架就亂做**：背景唔清楚（例如喺 VWAP 上面但 EMA 9 向下）就係「唔做」
:::

## 11.3 一頁總結

| Indicator | 量度 | 做多點用 | 單獨有冇預測力 |
|---|---|---|---|
| EMA 9／20 | 短線趨勢 | 向上兼排好先搵機會；回調位；突破確認 | 冇 |
| VWAP | 今日平均成本 | 喺上面先做多；跌穿就取消 | 冇 |
| ATR | 波幅 | Stop 0.1–0.6 ATR；今日過咗 1.5 ATR 唔追 | 冇方向 |
| RVOL | 參與度 | 選股 ≥ 2；09:35 開市量 ≥ 2 倍 | 冇，但係入場位嘅關鍵過濾 |
| RSI | 動量 | 突破時高係好事；唔好用嚟估頂 | 冇 |
| MACD | 動量 | 同 EMA 重複，可以唔加 | 冇 |
| Relative Strength／QQQ | 大市 | 強過大市；QQQ 喺 VWAP 上面先做多 | 冇，但係 A+ 過濾 |
| 日線均線 | 大方向 | 選股範圍、搵阻力 | 冇 |

:::coach 最後
Indicator 係儀錶板，唔係自動駕駛。佢哋幫你回答「而家係咩環境」同「風險幾大」；「幾時入」要靠價格去到入場位。呢個 Level 嘅數據同 Level 14、15 一樣：全部係機械規則、過去嘅數字，請用 Paper Trading 自己驗證。
:::

[[quiz:l16-final]]

[[link:level/l17|➡️ 下一課：Level 17 名家打法]]

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l16-c1': { title: '小測：Indicator 基本', questions: [
  { q: '所有 Indicator 嘅共通點？', options: ['預知未來', '由已經發生嘅價格同成交量計出嚟，所以滯後', '只計成交量'], answer: 1, explain: '價格轉咗，Indicator 先跟住轉。' },
  { q: '數據顯示，固定時間見到 8 個條件合 6–7 個先買，結果？', options: ['大賺', '冇著數，同合得少嗰啲差唔多', '一定蝕'], answer: 1, explain: '全部轉綠通常係升完一段之後。' },
  { q: 'Indicator 嘅三個正確用途唔包括？', options: ['睇背景', '計風險', '單獨當買入訊號'], answer: 2, explain: '入場靠入場位，唔係讀數。' },
]},
'l16-c2': { title: '小測：EMA', questions: [
  { q: '多頭排列係指？', options: ['價 > EMA 9 > EMA 20', '價 < EMA 9 < EMA 20', 'EMA 9 = EMA 20'], answer: 0, explain: '短線平均高過長線平均。' },
  { q: '價格離 EMA 9 超過 0.25 ATR，做多應該？', options: ['即刻追', '唔追，等回調或者整固', '加大注碼'], answer: 1, explain: '追高嘅 Stop 好遠。' },
  { q: 'Flat Top 突破嗰刻，邊個情況數據較好？', options: ['EMA 9 喺 EMA 20 上面兼向上', 'EMA 9 向下', '冇分別'], answer: 0, explain: '突破要有趨勢配合。' },
]},
'l16-c3': { title: '小測：VWAP', questions: [
  { q: 'VWAP 代表？', options: ['今日每一股嘅平均成交價', '昨日收市價', '52 週高位'], answer: 0, explain: '今日買入嘅人嘅平均成本。' },
  { q: '5 分鐘 K 收市跌穿 VWAP，做多計劃應該？', options: ['加注', '取消', '冇影響'], answer: 1, explain: 'VWAP 係失效線。' },
  { q: '價格喺 VWAP 上面，係咪即刻可以買？', options: ['係', '唔係，只係基本條件，仲要等入場位', '要沽空'], answer: 1, explain: '過濾，唔係訊號。' },
]},
'l16-c4': { title: '小測：ATR', questions: [
  { q: 'ATR 話你知？', options: ['股價會升', '一日平均波幅有幾大', '成交量'], answer: 1, explain: '冇方向，係把尺。' },
  { q: 'ATR 10 元，入場 200、Stop 197，Stop 係幾多 ATR？', options: ['0.3 ATR', '3 ATR', '0.03 ATR'], answer: 0, explain: '3 ÷ 10 = 0.3。' },
  { q: '今日高低已經相差 1.6 ATR，仲想追入做多？', options: ['好機會', '波幅差唔多用完，數據顯示賺錢機會低', '冇關係'], answer: 1, explain: '超過 1.5 ATR 唔追。' },
  { q: 'ATR % 係？', options: ['ATR ÷ 股價', 'ATR × 成交量', 'ATR ÷ RVOL'], answer: 0, explain: '2–10% 適合 Day Trade。' },
]},
'l16-c5': { title: '小測：RVOL', questions: [
  { q: 'RVOL 3 代表？', options: ['今日成交係平時 3 倍', '升咗 3%', '有 3 個買家'], answer: 0, explain: 'Relative Volume。' },
  { q: 'RVOL 高代表隻股會升？', options: ['係', '唔係，只代表今日多人參與、會郁', '代表會跌'], answer: 1, explain: '方向要睇其他。' },
  { q: 'A+ 過濾係？', options: ['開市量 ≥ 2 倍 + QQQ 喺 VWAP 上面', 'RSI > 90', 'ATR < 1%'], answer: 0, explain: 'Level 15。' },
]},
'l16-c6': { title: '小測：RSI', questions: [
  { q: 'RSI 過 70 嘅強勢股，應該？', options: ['一定沽空', '唔使驚，強勢股 RSI 可以長時間高', '即刻賣晒'], answer: 1, explain: '超買唔等於就跌。' },
  { q: '數據：Flat Top 突破嗰刻 RSI 高過 70，比 70 以下？', options: ['好', '差', '一樣'], answer: 0, explain: '突破要動力。' },
  { q: 'RSI 唔適合用嚟？', options: ['確認動力', '估頂估底', '睇回調有幾深'], answer: 1, explain: '唔好用嚟估頂。' },
]},
'l16-c7': { title: '小測：MACD', questions: [
  { q: 'MACD 線點計？', options: ['EMA 12 − EMA 26', '最高 − 最低', '成交量 ÷ 股價'], answer: 0, explain: '兩條 EMA 嘅距離。' },
  { q: '已經有 EMA 9 同 EMA 20，再加 MACD？', options: ['必須', '重複，可以唔加', '加三個'], answer: 1, explain: '都係由 EMA 計出嚟。' },
  { q: 'MACD 柱正數兼增加緊代表？', options: ['升勢加速', '跌勢加速', '冇成交'], answer: 0, explain: '動力增加。' },
]},
'l16-c8': { title: '小測：Relative Strength', questions: [
  { q: 'Relative Strength 同 RSI？', options: ['同一樣嘢', '完全唔同：一個比大市，一個係動量指標', '都係成交量'], answer: 1, explain: '名似但唔同。' },
  { q: 'QQQ 喺 VWAP 下面，做多應該？', options: ['照做', '唔做，大環境唔配合', '加注'], answer: 1, explain: 'A+ 過濾嘅一半。' },
  { q: '個股 +3%，QQQ +1%，Relative Strength 係？', options: ['+2', '+4', '−2'], answer: 0, explain: '3 − 1。' },
]},
'l16-c9': { title: '小測：日線', questions: [
  { q: '數據：日線升勢對頭 2 小時做多？', options: ['大幅加分', '本身冇分別', '一定蝕'], answer: 1, explain: '同 Level 15 一致。' },
  { q: '日線均線嘅正確用途？', options: ['選股範圍同搵阻力位', '入場訊號', '計股數'], answer: 0, explain: '大方向同阻力。' },
  { q: '昨收離 20 日線超過 3 ATR 代表？', options: ['已經升咗好多', '啱啱開始升', '停牌'], answer: 0, explain: '離平均好遠。' },
]},
'l16-c10': { title: '小測：幾時最靚', questions: [
  { q: '「最靚」嘅做多時機係？', options: ['所有 Indicator 轉綠嗰刻', '背景合格，而且價格去到入場位', 'RSI 最高嗰刻'], answer: 1, explain: '兩層：背景 + 入場位。' },
  { q: '背景全部合格，但價格離 EMA 9 好遠，應該？', options: ['追', '等回調掂 EMA 9 或者高位整固', '沽空'], answer: 1, explain: '冇入場位就等。' },
  { q: '兩個入場位係？', options: ['回調掂 EMA 9 守住、高位窄幅整固', '開市第一分鐘、收市前', 'RSI 30 同 RSI 70'], answer: 0, explain: 'Level 15 嘅兩個主力 Setup。' },
]},
'l16-final': { title: 'Level 16 總測驗', questions: [
  { q: '10:20：價格喺 VWAP 上面，EMA 9 向上兼喺 EMA 20 上面，RSI 78，價格離 EMA 9 有 0.4 ATR。做多？', options: ['即刻買', '背景好，但離 EMA 9 太遠：等回調或者整固', '沽空，因為 RSI 超買'], answer: 1, explain: '靚背景 ≠ 入場位。' },
  { q: '同一隻股 10:40 回調，低位掂到 EMA 9、收市守住，開市量係平時 3 倍，QQQ 喺 VWAP 上面。', options: ['入場位：Buy Stop 放呢支 K 高位上面，Stop 放 EMA 9 下面', '唔做', '等 RSI 跌到 30'], answer: 0, explain: '背景 + 入場位齊。' },
  { q: 'ATR 8 元，今日已經由 100 升到 113（低位 100）。再追入？', options: ['可以', '唔好：今日已經用咗 1.6 ATR', '加倍'], answer: 1, explain: '13 ÷ 8 = 1.6 ATR。' },
  { q: '免費版 TradingView 5 分鐘圖最應該放？', options: ['RSI + MACD', 'VWAP + EMA 9', 'Bollinger + Ichimoku'], answer: 1, explain: '同報告、課程一致。' },
  { q: '呢個 Level 嘅數據應該點用？', options: ['當成保證', '當成參考同假設，用 Paper Trading 驗證', '唔使理'], answer: 1, explain: '機械規則、過去數字。' },
]},
});

Object.assign(window.CHECKLISTS, {
'l16-long': { title: '做多前：Indicator 檢查', items: [
  '背景：價格喺 VWAP 上面',
  '背景：EMA 9 向上，而且喺 EMA 20 上面',
  '背景：首 5 分鐘成交 ≥ 平時 2 倍',
  '背景：QQQ 喺自己 VWAP 上面',
  '背景：今日高低未超過 1.5 ATR',
  '入場位：回調掂 EMA 9 守住，或者高位窄幅整固（唔係離 EMA 9 好遠嘅位）',
  '風險：Stop 喺結構下面，距離 0.1–0.6 ATR',
  '有實際 Stop 單（Bracket），唔係「跌穿 EMA 先算」',
]},
});

window.GLOSSARY.push(
  { term: 'EMA', zh: '指數移動平均', def: 'Exponential Moving Average：加重近期價格嘅平均線。5 分鐘 EMA 9 代表最近約 45 分鐘嘅平均。', lv: 'l16' },
  { term: 'Bullish EMA Stack', zh: '多頭排列', def: '價格 > EMA 9 > EMA 20。代表短線趨勢向上，係做多嘅背景條件，唔係入場訊號。', lv: 'l16' },
  { term: 'Lagging Indicator', zh: '滯後指標', def: '由已經發生嘅價格同成交量計出嚟嘅指標，一定慢過價格本身。EMA、RSI、MACD 都係。', lv: 'l16' },
  { term: 'ATR %', zh: 'ATR 百分比', def: 'ATR ÷ 股價。用嚟比較唔同價位嘅股波幅有幾大；2–10% 適合 Day Trade。', lv: 'l16' },
  { term: 'RSI', zh: '相對強弱指數', def: 'Relative Strength Index：比較最近 14 支 K 嘅平均升幅同跌幅，0–100。量度動量，唔係用嚟估頂。', lv: 'l16' },
  { term: 'MACD', zh: '指數平滑異同移動平均', def: 'EMA 12 減 EMA 26。柱（Histogram）係 MACD 同訊號線嘅差，顯示動力加緊定減緊。', lv: 'l16' },
  { term: 'Extended', zh: '離均線太遠', def: '價格離 EMA 9（或者日線均線）好遠。讀數通常最靚，但呢度追入嘅 Stop 最闊。', lv: 'l16' },
);
