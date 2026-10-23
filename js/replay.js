/* =========================================================
 * K 線重播遊戲：逐支播放，每一步做決定
 * 全部係模擬數據
 * ========================================================= */
(function () {
  const C = window.Charts;

  function brBase() {
    const pre = C.genBars([383.2, 383.9, 384.6, 383.8, 383.1, 384.2, 384.9, 384.1, 383.6, 384.5], { seed: 3, open: 383.0, start: '09:00', wick: 0.3 });
    const key = [
      { t: '09:50', o: 384.40, h: 385.65, l: 384.25, c: 385.50, v: 1.6 },
      { t: '09:55', o: 385.48, h: 385.80, l: 385.12, c: 385.34, v: 0.75 },
      { t: '10:00', o: 385.34, h: 386.05, l: 385.18, c: 385.95, v: 1.1 },
      { t: '10:05', o: 385.96, h: 386.35, l: 385.82, c: 386.21, v: 1.0 },
    ];
    return pre.concat(key);
  }
  const PLAN_LINES = [
    { y: 386.10, label: 'Entry 386.10', color: 'var(--accent)' },
    { y: 384.70, label: 'Stop 384.70', color: 'var(--down)' },
    { y: 388.90, label: 'Target 388.90', color: 'var(--up)' },
  ];
  const brIntro = [
    { show: 10, text: '開市後 TSLA 喺 $382–$385 橫行。你事前畫好 Resistance Zone $384.80–$385.20，Session VWAP 緩慢上升，15m 偏強。你今日專門練 Breakout + Retest。', q: '而家應該做乜？', options: ['即刻買入，等佢突破', 'WAIT：等阻力區出現有效突破', '喺阻力區 Short'], answer: 1, explain: '未有突破，Setup 都未出現。等市場話你知。' },
    { show: 11, text: 'Candle 1（09:50）：收 $385.50，企喺阻力區上方；成交量 1.6M，約同時段平均（0.8M）嘅兩倍。', q: '你嘅決定？', options: ['WAIT：突破只係第一步，等回測', '即刻追 Long', '即刻 Short，升太多'], answer: 0, explain: '你練緊 Breakout + Retest，唔係追突破。追突破係另一套策略。' },
    { show: 12, text: 'Candle 2（09:55）：回調，低位 $385.12 仍然喺舊阻力區入面，收 $385.34，量減少到 0.75M。', q: '點解讀？', options: ['值得觀察嘅 Retest，但未確認 → WAIT', '已經確認，即刻入場', '回測失敗，放棄'], answer: 0, explain: '回測未跌穿整個區域，量縮。係候選，但仲未有反彈證據。' },
    { show: 13, text: 'Candle 3（10:00）：喺回測區反彈，收 $385.95，接近自身高位；量回升到 1.1M。', q: '下一步？', options: ['PLAN：計 Trigger、Stop、Target 同股數', '用 $385.20（之前低位）當自己已經買咗', '冇嘢做'], answer: 0, explain: '確認出現咗，但未入場。唔可以事後聲稱自己喺低位買到（回測偏差）。' },
    { show: 13, lines: PLAN_LINES, text: '你將 Entry Trigger 設喺 $386.10（Candle 3 High 上方）。下一個阻力約 $388.70–$389.00。', q: 'Stop 最合理放邊？', options: ['$384.70：跌返舊阻力區下方 = 回測守住假設失效', '$385.95：愈近愈好，輸少啲', '唔使 Stop，等佢反彈'], answer: 0, explain: 'Stop 跟「假設喺邊度失效」，唔係跟想輸幾多。Target $388.90 → 2R。' },
    { show: 13, lines: PLAN_LINES, text: '本金 $10,000，每筆風險 0.25% = $25。每股風險 $1.40。', q: '最多買幾多整股（未計成本）？', options: ['17 股', '25 股', '7 股'], answer: 0, explain: '⌊25 ÷ 1.40⌋ = 17 股，需要約 $6,563.70 現金。' },
    { show: 14, lines: PLAN_LINES, text: 'Candle 4（10:05）：升穿 $386.10，假設模擬訂單喺 $386.10 成交，你持有 17 股。', q: '入場之後第一件事？', options: ['確認 Stop 同 Target 已生效，按計劃持有', '即刻將 Stop 移去成本價', '再加注'], answer: 0, explain: 'Position Open 狀態最重要係確認保護訂單已經生效。' },
  ];

  const SCENARIOS = {
    'l3-br-win': {
      title: 'Breakout + Retest（版本 A）', level: 'l3', icon: '🚀',
      desc: '由橫行、突破、回測、確認到入場同管理，一步步做決定。',
      build() {
        const bars = brBase().concat([
          { t: '10:10', o: 386.21, h: 386.88, l: 386.05, c: 386.65, v: 0.9 },
          { t: '10:15', o: 386.65, h: 387.40, l: 386.50, c: 387.20, v: 1.0 },
          { t: '10:20', o: 387.20, h: 388.20, l: 387.00, c: 388.00, v: 1.2 },
          { t: '10:25', o: 388.00, h: 389.05, l: 387.80, c: 388.95, v: 1.3 },
        ]);
        return { bars, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance Zone' }], vwap: true, avgVol: 0.8 };
      },
      steps: brIntro.concat([
        { show: 15, lines: PLAN_LINES, text: 'Candle 5（10:10）：收 $386.65，有浮動盈利。', q: '要唔要改計劃？', options: ['唔使，固定 2R 規則照跟', '即刻全部止賺，驚佢跌', '將 Target 拉遠到 $392'], answer: 0, explain: '回測同實際執行要一致。想研究其他出場方法，另開版本測試。' },
        { show: 17, lines: PLAN_LINES, text: 'Candle 6–7：價格繼續向上，去到 $388。' },
        { show: 18, lines: PLAN_LINES, text: 'Candle 8（10:25）：High $389.05 觸及 Target $388.90。按計劃止賺：17 × $2.80 = $47.60（未計成本），約 +2R。', q: '呢筆交易應該點記錄？', options: ['記錄 Setup、Entry、Stop、Target、結果 R 同有冇跟規則', '只記「賺咗 $47.60」', '唔使記，反正贏咗'], answer: 0, explain: '成功同失敗都要完整記錄，先可以計勝率同期望值。' },
      ]),
      outro: '版本 A 係成功例子，但一次成功唔代表策略有 Edge。試埋「版本 B」，睇吓同一個 Setup 點樣會止損。',
    },
    'l3-br-loss': {
      title: 'Breakout + Retest（版本 B：止損）', level: 'l3', icon: '🧯',
      desc: 'Level 3 第十章：入場之後市場唔跟劇本行，你點處理？',
      build() {
        const bars = brBase().concat([
          { t: '10:10', o: 386.21, h: 386.88, l: 386.05, c: 386.65, v: 0.9 },
          { t: '10:15', o: 386.65, h: 387.00, l: 385.33, c: 385.58, v: 1.3 },
          { t: '10:20', o: 385.58, h: 386.10, l: 384.60, c: 384.82, v: 1.5 },
        ]);
        return { bars, zones: [{ lo: 384.8, hi: 385.2, label: 'Resistance Zone' }], vwap: true, avgVol: 0.8 };
      },
      steps: brIntro.concat([
        { show: 15, lines: PLAN_LINES, text: 'Candle 5（10:10）：High $386.88，收 $386.65，有浮動盈利。', q: '你點做？', options: ['按原計劃，唔改 Target', '即刻移 Stop 去成本價（v1.0 冇呢條規則）', '加倉'], answer: 0, explain: '臨時加規則會令測試結果唔一致。' },
        { show: 16, lines: PLAN_LINES, text: 'Candle 6（10:15）：突然回調，Low $385.33，收 $385.58。浮盈大減，你開始緊張。', q: 'Stop $384.70 未觸發。你應該？', options: ['按原計劃繼續持有', '將 Stop 移遠到 $383.50，避免被掃', '加倉攤平成本'], answer: 0, explain: 'Stop 唔應該因為價格接近就向不利方向移動；攤平係新手大忌。' },
        { show: 17, lines: PLAN_LINES, text: 'Candle 7（10:20）：Low $384.60 跌穿 Stop $384.70。假設喺 $384.70 成交，結果 −1R（17 × $1.40 = −$23.80）。', q: '點評估呢筆交易？', options: ['跟晒規則，係正常虧損樣本，要完整記錄', '策略無效，以後唔用', '刪除紀錄當冇發生'], answer: 0, explain: '分析同執行都跟規則，結果虧損係市場不確定性。要累積足夠樣本先評估策略。' },
      ]),
      outro: '「好交易」唔等於「賺錢交易」。執行分滿分、結果 −1R，都係一筆值得驕傲嘅交易紀錄。',
    },
    'l3-bull-trap': {
      title: 'Failed Breakout（Bull Trap）', level: 'l3', icon: '🪤',
      desc: '突破之後收返落嚟 —— 你識唔識快速更新判斷？',
      build() { return C.named['bull-trap'](); },
      steps: [
        { show: 6, text: 'TSLA 喺 $380–$385 橫行。Resistance Zone $384.80–$385.20，VWAP 約 $385.30 接近橫行，下一支持約 $380.60。', q: '價格接近阻力區，你準備？', options: ['觀察阻力區嘅反應', '預先掛 Buy Stop 追突破（唔係你嘅策略）', '喺區間中間買入'], answer: 0, explain: '等市場喺關鍵位置出現反應。' },
        { show: 7, text: 'Candle 1：一度升到 $386.20，但收返 $384.60，長上影線，成交量明顯增加。', q: '點解讀？', options: ['突破未能維持，開始懷疑失敗，但未需要 Short', '突破成功，買入', '即刻全倉 Short'], answer: 0, explain: '第一個證據出現，但單一支 K 線唔夠。' },
        { show: 8, text: 'Candle 2：反彈到 $385.10，但收 $384.25，未能重新企穩阻力區上方。', q: '呢支 K 線代表？', options: ['第二個看跌證據，形成 Lower High', '準備大升，買入', '冇意義'], answer: 0, explain: '重新向上嘗試失敗，LH 出現。' },
        { show: 9, lines: [{ y: 384.0, label: 'Entry 384.00', color: 'var(--accent)' }, { y: 385.5, label: 'Stop 385.50', color: 'var(--down)' }], text: 'Candle 3：跌到 $383.90，跌穿短線低位，低於 VWAP。模擬 Short 計劃：Entry $384.00、Stop $385.50、Target $380.60。', q: 'Reward / Risk 大約係？', options: ['2.27R', '1.00R', '3.40R'], answer: 0, explain: '風險 $1.50、回報 $3.40 → 3.40 ÷ 1.50 ≈ 2.27R。' },
        { show: 13, lines: [{ y: 384.0, label: 'Entry 384.00', color: 'var(--accent)' }, { y: 385.5, label: 'Stop 385.50', color: 'var(--down)' }], text: '之後價格向 $381 移動（模擬）。', q: '以你目前新手階段，課程建議 Short 點處理？', options: ['先學分析同歷史模擬，暫時唔做真倉', '用 Margin 加大注碼', 'Short 冇風險，可以大做'], answer: 0, explain: '做空虧損理論上無限，仲有借股、Margin、Short Squeeze 等風險。' },
      ],
      outro: '假突破唔代表一定大幅反向。重點係：市場有冇提供足夠證據推翻原本突破？',
    },
    'l3-support': {
      title: 'Range Support Reversal', level: 'l3', icon: '🧲',
      desc: '去到支持區、Hammer、大綠燭、Higher Low —— 但上面有 VWAP。',
      build() { const c = C.named['l3-range'](); c.lines = []; return c; },
      steps: [
        { show: 15, lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }], text: 'TSLA 喺 $380–$385 橫行，而家由上面跌落嚟接近 $380 支持區。VWAP $382.50 接近橫行。', q: '價格去到支持區，你應該？', options: ['等 Rejection 同確認，唔係因為「平」就買', '即刻買入', '即刻 Short'], answer: 0, explain: '你唔係因為覺得 $380 好平而買，而係等市場出現承接證據。' },
        { show: 16, lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }], text: 'Candle 1：Hammer。一度跌到 $379.55（穿咗支持區），但收返 $380.05。', q: '你嘅決定？', options: ['WAIT：潛在 Bullish Rejection，未確認', '確認反轉，即刻買', '支持失守，即刻 Short'], answer: 0, explain: '低價未能維持係好跡象，但仲要後續確認。' },
        { show: 17, lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }], text: 'Candle 2：大綠燭，收 $380.78 近最高位，量增加。但價格仍然低過 VWAP。', q: '點解讀？', options: ['有後續買入動力，但日內背景未轉強', '已經係大升勢', '冇意義'], answer: 0, explain: '唔好將反彈自動解讀成大升勢。' },
        { show: 18, lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }, { y: 380.95, label: 'Entry 380.95', color: 'var(--accent)' }, { y: 379.45, label: 'Stop 379.45', color: 'var(--down)' }, { y: 384.20, label: 'Target 384.20', color: 'var(--up)' }], text: 'Candle 3：小回調，低位 $380.35 高過 Candle 1 低位 $379.55，形成短線 HL。計劃：Entry $380.95、Stop $379.45、Target $384.20 → 2.17R。', q: 'VWAP $382.50 喺中間（只係約 1.03R）。最好點處理？', options: ['事前定 VWAP 附近減倉規則再重新計，或者放棄', '照 2.17R 全倉做，唔使理 VWAP', '當 VWAP 唔存在'], answer: 0, explain: '你唔單止要判斷會唔會升，仲要判斷升到目標之前有幾多障礙。' },
        { show: 19, lines: [{ y: 382.5, label: 'VWAP 382.5', color: 'var(--vwap)' }, { y: 380.95, label: 'Entry 380.95', color: 'var(--accent)' }, { y: 379.45, label: 'Stop 379.45', color: 'var(--down)' }, { y: 384.20, label: 'Target 384.20', color: 'var(--up)' }], text: '下一支升到 $381.60，觸發 Entry（模擬）。之後點走，要睇你事前定嘅規則。' },
      ],
      outro: '呢個情境冇「標準答案結局」—— 重點係你有冇喺入場前考慮 VWAP 障礙。',
    },
    'l4-day': {
      title: 'Level 4 完整交易日', level: 'l4', icon: '📅',
      desc: '開市前準備 → 計股數（含滑價同費用）→ 確認訂單 → +1R 嘅誘惑。',
      build() { const c = C.named['l4-day'](); c.lines = []; c.marks = []; return c; },
      steps: [
        { show: 3, text: '09:30–09:45：股價喺 $383–$384.50 上落，成交量好大，VWAP 剛開始形成。PDH $385.20，阻力區 $384.80–$385.20。', q: '開市初段你應該？', options: ['未有符合條件嘅 Setup → WAIT', '開咗市就要即刻交易', '追入最高位'], answer: 0, explain: '唔需要因為開咗市就立即交易。' },
        { show: 4, text: '09:45 K 線：收 $385.55 突破阻力區，相對同時段量約 1.8 倍，VWAP $383.70 向上。', q: '你嘅策略係 Breakout + Retest，所以？', options: ['繼續等回測', '即刻追入', '放棄今日'], answer: 0, explain: '突破只係初步證據。' },
        { show: 6, text: '09:50 回測到 $385.05、量減少；09:55 反彈收 $385.95、量回升。你制定 Trigger $386.10、Stop $384.70、Target $388.90。', q: '風險預算 $25、來回費用 $2、每股滑價緩衝 $0.20、每股風險 $1.40，股數係？', options: ['14 股', '17 股', '20 股'], answer: 0, explain: '⌊(25 − 2) ÷ (1.40 + 0.20)⌋ = 14 股。' },
        { show: 7, lines: PLAN_LINES, text: '10:00 K 線：High $386.40，觸及 Trigger。你喺 TradingView 見到價格升穿 $386.10。', q: '下一步？', options: ['去券商確認 Parent 成交、數量、Stop / Target 已生效', '假設已經成交，唔使理', '再落多張單確保買到'], answer: 0, explain: 'TradingView 價格唔等於你嘅訂單一定成交。' },
        { show: 9, lines: PLAN_LINES, text: '10:10：價格升到 $387.50 = +1R。你好想將 Stop 移去成本價。', q: '但你嘅 v1.0 冇 Break-even 規則。你應該？', options: ['跟 v1.0；Break-even 另開 v1.1 測試', '即刻移 Stop 去成本', '即刻全部平倉'], answer: 0, explain: '臨時改規則令紀錄唔可比較。' },
        { show: 9, lines: PLAN_LINES, text: '兩個可能結局：A. 升到 Target → 淨賺 $37.20；B. 急跌，Stop $384.70 觸發但喺 $384.40 成交 → 實際虧損 $25.80。', q: '點解結局 B 輸多過 $25 預算？', options: ['滑價 + 費用：風險預算唔等於最大損失保證', '計錯數', '券商有問題'], answer: 0, explain: '14 × $1.70 + $2 = $25.80。所以要預留緩衝，同埋接受實際可能超出。' },
      ],
      outro: '收市後記得覆盤：Setup 符唔符合？Trigger 有冇按規則？實際成交差幾遠？有冇臨場改 Stop？',
    },
  };

  /* ---------- 遊戲 UI ---------- */
  function play(el, id) {
    const sc = SCENARIOS[id];
    if (!sc) { el.innerHTML = '<p>搵唔到呢個情境。</p>'; return; }
    const base = sc.build();
    let step = 0, score = 0, asked = 0, answered = false;
    el.innerHTML = `<div class="replay">
      <div class="rp-head"><span class="rp-icon">${sc.icon}</span><div><h2>${sc.title}</h2><p class="muted">${sc.desc}</p></div><div class="rp-score"><span>得分</span><b data-score>0</b></div></div>
      <div class="rp-chart"></div>
      <div class="rp-progress"><div class="rp-progress-fill"></div></div>
      <div class="rp-panel"></div>
      <p class="tool-fine">⚠️ 全部數字係教學模擬，唔係真實 TSLA 行情。</p></div>`;
    const chartEl = el.querySelector('.rp-chart'), panel = el.querySelector('.rp-panel');
    const draw = (s) => {
      const cfg = Object.assign({}, base, { visible: s.show, lines: (base.lines || []).concat(s.lines || []), marks: [], highlight: s.show - 1, slots: base.bars.length });
      C.candles(chartEl, cfg);
      el.querySelector('.rp-progress-fill').style.width = ((step + 1) / sc.steps.length * 100) + '%';
    };
    const render = () => {
      const s = sc.steps[step];
      answered = false;
      draw(s);
      const last = step === sc.steps.length - 1;
      panel.innerHTML = `<div class="rp-step">第 ${step + 1} / ${sc.steps.length} 步</div><p class="rp-text">${s.text}</p>
        ${s.q ? `<p class="rp-q"><b>${s.q}</b></p><div class="rp-opts">${s.options.map((o, i) => `<button class="rp-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join('')}</div><div class="rp-fb"></div>` : ''}
        <div class="rp-nav"><button class="btn primary" data-next ${s.q ? 'disabled' : ''}>${last ? '完成 ✓' : '播放下一步 ▶'}</button></div>`;
      if (s.q) {
        panel.querySelectorAll('.rp-opt').forEach((b) => b.addEventListener('click', () => {
          if (answered) return; answered = true; asked++;
          const ok = +b.dataset.i === s.answer;
          if (ok) score++;
          el.querySelector('[data-score]').textContent = score + ' / ' + asked;
          panel.querySelectorAll('.rp-opt').forEach((x) => { x.disabled = true; if (+x.dataset.i === s.answer) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          panel.querySelector('.rp-fb').innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✅ 正確！' : '❌ 再諗諗。'} ${s.explain}</div>`;
          panel.querySelector('[data-next]').disabled = false;
          panel.querySelector('[data-next]').focus();
        }));
      }
      panel.querySelector('[data-next]').addEventListener('click', () => {
        if (step < sc.steps.length - 1) { step++; render(); } else finish();
      });
    };
    const finish = () => {
      const total = sc.steps.filter((s) => s.q).length;
      const u = Store.user();
      const prev = (u.replay[id] || {}).best || 0;
      u.replay[id] = { best: Math.max(prev, score), total, ts: Date.now() };
      Store.save();
      if (score === total) Store.awardXP('replay:' + id, 15); else Store.awardXP('replaytry:' + id, 5);
      const others = Object.keys(SCENARIOS).filter((k) => k !== id);
      panel.innerHTML = `<div class="rp-end"><div class="rp-trophy">${score === total ? '🏆' : score >= total * 0.7 ? '🎖️' : '📘'}</div>
        <h3>完成！得分 ${score} / ${total}</h3><p>${sc.outro}</p>
        <div class="rp-nav"><button class="btn" data-again>↺ 再玩一次</button>${others.map((k) => `<a class="btn ghost" href="#/replay/${k}">${SCENARIOS[k].icon} ${SCENARIOS[k].title}</a>`).slice(0, 2).join('')}<a class="btn ghost" href="#/replay">全部情境</a></div></div>`;
      panel.querySelector('[data-again]').addEventListener('click', () => play(el, id));
      draw(Object.assign({}, sc.steps[sc.steps.length - 1], { show: base.bars.length }));
    };
    render();
  }

  window.Replay = { SCENARIOS, play };
})();
