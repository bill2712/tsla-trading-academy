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
    'l6-orb': {
      title: '開市區間突破 + 相對強弱（Level 6）', level: 'l6', icon: '🌅',
      desc: '畫 Opening Range、睇 TSLA vs QQQ、等突破同回測，再用 PDH 定目標。',
      build() {
        const k = (t, o, h, l, c, v) => ({ t, o, h, l, c, v });
        const bars = [
          k('09:30', 386.00, 387.60, 385.20, 387.10, 3.1), k('09:35', 387.10, 387.90, 385.80, 386.20, 2.4), k('09:40', 386.20, 386.90, 385.00, 386.60, 2.0),
          k('09:45', 386.60, 387.50, 386.30, 387.30, 1.4), k('09:50', 387.30, 387.70, 386.80, 387.00, 1.1), k('09:55', 387.00, 388.60, 386.90, 388.40, 1.9),
          k('10:00', 388.40, 388.70, 387.80, 388.00, 1.0), k('10:05', 388.00, 388.90, 387.90, 388.80, 1.4), k('10:10', 388.80, 389.60, 388.60, 389.40, 1.5),
          k('10:15', 389.40, 390.10, 389.10, 389.90, 1.3), k('10:20', 389.90, 390.60, 389.50, 390.40, 1.2), k('10:25', 390.40, 391.20, 390.10, 391.00, 1.3), k('10:30', 391.00, 392.10, 390.80, 391.90, 1.4),
        ];
        return { bars, vwap: true, zones: [{ lo: 385.0, hi: 387.9, label: 'Opening Range 385.00–387.90' }], lines: [{ y: 392.0, label: 'PDH 392.00', color: 'var(--muted)' }], avgVol: 1.2 };
      },
      steps: [
        { show: 3, text: '09:30–09:45：TSLA 開市後上上落落，最高 $387.90、最低 $385.00。PDH 喺 $392.00。', q: '開市頭 15 分鐘，你應該做乜？', options: ['記錄 ORH $387.90、ORL $385.00，觀察開市模式', '追第一支大綠燭', '喺 OR 中間買入'], answer: 0, explain: '頭 15 分鐘 Spread 闊、假動作多，先畫區域。呢個開市較似 Open-Auction（拉鋸）。' },
        { show: 5, text: '09:50：QQQ 由開市計 +0.1%，TSLA +0.6%。價格喺 VWAP 上方。', q: 'TSLA 相對大市係？', options: ['相對強：Context 支持研究 Long', '相對弱', '冇得比較'], answer: 0, explain: '同一起點，TSLA 跑贏 QQQ。RS 係 Context，唔係入場訊號。' },
        { show: 6, text: '09:55：收市 $388.40，企喺 ORH 上方；成交量 1.9M，高過同時段平均約 1.2M。', q: '你嘅決定？', options: ['WAIT：突破只係第一步，等回測', '即刻市價追入', 'Short，升太多'], answer: 0, explain: '你嘅 Playbook 係突破 + 回測，唔係追突破。' },
        { show: 7, text: '10:00：回落到 $387.80（輕微入返 ORH 附近），收 $388.00，量減少到 1.0M。', q: '點解讀？', options: ['值得觀察嘅回測：未跌穿區域、量縮', '突破失敗，放棄', '已確認，即刻買'], answer: 0, explain: '回測守住，但仲要等反彈確認。' },
        { show: 8, lines: [{ y: 388.95, label: 'Entry 388.95', color: 'var(--accent)' }, { y: 387.70, label: 'Stop 387.70', color: 'var(--down)' }, { y: 391.80, label: 'Target 391.80', color: 'var(--up)' }], text: '10:05：收 $388.80，高位 $388.90。計劃：Entry $388.95（確認 K 高位上方）、Stop $387.70（回測低位下方）、Target $391.80（PDH 之前）。', q: 'R:R 大約係？', options: ['約 2.28R', '約 1.2R', '約 3.5R'], answer: 0, explain: '風險 $1.25、回報 $2.85 → 2.28R，符合 2R 要求。' },
        { show: 9, lines: [{ y: 388.95, label: 'Entry 388.95', color: 'var(--accent)' }, { y: 387.70, label: 'Stop 387.70', color: 'var(--down)' }, { y: 391.80, label: 'Target 391.80', color: 'var(--up)' }], text: '10:10：升穿 $388.95，觸發入場。風險預算 $25，每股預留 $0.05 滑價。', q: '股數係？', options: ['19 股', '25 股', '12 股'], answer: 0, explain: '⌊25 ÷ (1.25 + 0.05)⌋ = 19 股。' },
        { show: 13, lines: [{ y: 388.95, label: 'Entry 388.95', color: 'var(--accent)' }, { y: 387.70, label: 'Stop 387.70', color: 'var(--down)' }, { y: 391.80, label: 'Target 391.80', color: 'var(--up)' }], text: '10:30：高位 $392.10，觸及 Target $391.80。按計劃止賺 ≈ +2.28R。', q: '日誌入面最值得記低嘅係？', options: ['OR 回測、RS 強、PDH 限制目標 —— 同埋有冇跟規則', '「今日好好彩」', '唔使記'], answer: 0, explain: '記錄 Context 先可以之後做數據切片（例如 RS 強 vs 弱嘅表現）。' },
      ],
      outro: 'Level 6 嘅重點：Opening Range 畀你第一個區域，RS 畀你方向，PDH 等大時間框架位置限制你嘅目標。',
    },
    'l7-manage': {
      title: '持倉管理：+1R 減倉、移 Stop、Trailing（Level 7）', level: 'l7', icon: '🎛️',
      desc: '入咗場之後先係真正考驗：跟管理規則 v2.0，逐支決定。',
      build() {
        const k = (t, o, h, l, c, v) => ({ t, o, h, l, c, v });
        const pre = C.genBars([385.2, 385.6, 385.1, 385.5, 385.9, 386.2], { seed: 721, open: 384.9, wick: 0.3 });
        const bars = pre.concat([
          k('10:00', 386.20, 386.90, 386.10, 386.70, 1.3), k('10:05', 386.70, 387.30, 386.50, 387.10, 1.1), k('10:10', 387.10, 387.60, 386.90, 387.40, 1.0),
          k('10:15', 387.40, 387.95, 387.20, 387.70, 1.2), k('10:20', 387.70, 387.80, 387.00, 387.10, 0.9), k('10:25', 387.10, 387.30, 386.85, 387.20, 0.8),
          k('10:30', 387.20, 388.10, 387.10, 388.00, 1.3), k('10:35', 388.00, 388.70, 387.90, 388.60, 1.2), k('10:40', 388.60, 389.20, 388.40, 389.10, 1.2),
          k('10:45', 389.10, 389.30, 388.90, 389.00, 0.9), k('10:50', 389.00, 389.60, 388.95, 389.50, 1.1), k('10:55', 389.50, 389.55, 388.50, 388.60, 1.6), k('11:00', 388.60, 388.90, 388.20, 388.40, 1.0),
        ]);
        return { bars, vwap: true, avgVol: 1.0 };
      },
      steps: [
        { show: 7, lines: [{ y: 386.40, label: 'Entry 386.40', color: 'var(--accent)' }, { y: 385.00, label: 'Stop 385.00', color: 'var(--down)' }], text: '10:00：Long 20 股 @ $386.40，Stop $385.00（風險 $1.40 × 20 = $28）。管理規則 v2.0：+1R 平一半、Stop 移去成本、之後跟 5m HL Trailing、45 分鐘未到 +1R 就走。', q: '入場後第一件事？', options: ['確認 Stop 單已經生效', '即刻計今日賺幾多', '轉去 1 分鐘圖'], answer: 0, explain: '一入場就確認保護訂單。' },
        { show: 10, lines: [{ y: 386.40, label: 'Entry 386.40', color: 'var(--accent)' }, { y: 385.00, label: 'Stop 385.00', color: 'var(--down)' }, { y: 387.80, label: '+1R 387.80', color: 'var(--up)' }], text: '10:15：高位 $387.95，觸及 +1R（$387.80）。', q: '按 v2.0 規則？', options: ['平 10 股 @ $387.80，餘下 10 股 Stop 移去 $386.40', '全部平倉', '唔郁，等 3R'], answer: 0, explain: '規則事前寫好，臨場照做。' },
        { show: 12, lines: [{ y: 386.40, label: 'Stop（成本）386.40', color: 'var(--down)' }], text: '10:20–10:25：回調到 $386.85，好接近成本價。你開始驚「還返晒」。', q: '應該？', options: ['跟規則：Stop 喺成本，繼續持有', '即刻平晒，驚還返', '將 Stop 移低啲，畀多啲空間'], answer: 0, explain: '最壞情況已經係打和（餘下部分）。移遠 Stop 係違規。' },
        { show: 13, lines: [{ y: 386.75, label: 'Trail 386.75', color: 'var(--down)' }], text: '10:30：升穿之前高位 $387.95，確認 $386.85 係新 HL。', q: '結構 Trailing 下，Stop 移去邊？', options: ['$386.75（HL 下方 $0.10）', '$388.00', '唔使移'], answer: 0, explain: 'Trailing 跟住最近已確認嘅 HL。' },
        { show: 17, lines: [{ y: 388.80, label: 'Trail 388.80', color: 'var(--down)' }], text: '10:45 形成 HL $388.90，10:50 升穿 $389.20 創新高 $389.60。', q: '新嘅 Trailing Stop？', options: ['$388.80', '$386.75 唔使改', '$389.50'], answer: 0, explain: 'HL $388.90 − $0.10。' },
        { show: 18, lines: [{ y: 388.80, label: 'Trail 388.80', color: 'var(--down)' }], text: '10:55：大紅燭跌穿 $388.80，餘下 10 股喺 $388.80 出場。', q: '成筆交易總結果係？（初始風險 $28）', options: ['約 +1.36R（$14 + $24 = $38）', '+2.0R', '+1.71R'], answer: 0, explain: '10 × 1.40 + 10 × 2.40 = $38；38 ÷ 28 ≈ 1.36R。' },
        { show: 19, text: '如果用固定 2R 目標（$389.20），10:40 已經觸及：20 × 2.80 = $56 = +2R。', q: '咁係咪代表固定目標一定好啲？', options: ['唔係：一筆交易唔可以比較方法，要用大量樣本', '係，以後只用固定目標', '係，Trailing 冇用'], answer: 0, explain: '試吓工具「出場方法比較模擬」，同埋用你嘅日誌數據比較。' },
      ],
      outro: '管理規則最大價值係「一致」：唔理今次結果，照規則做，先有可比較嘅數據。',
    },
    'l2-shooting': {
      title: '阻力區 Shooting Star（Level 2 情境 2）', level: 'l2', icon: '🌠',
      desc: '升到阻力區，出現長上影線、量增加 —— 係反轉，定只係暫停？',
      build() {
        const pre = C.genBars([385.2, 385.9, 386.6, 386.2, 387.1, 387.8, 388.4, 388.1, 388.9], { seed: 21, open: 384.8, start: '09:35', wick: 0.25 });
        pre.forEach((b, i) => { b.v = 0.9 + (i % 3) * 0.15; });
        const key = [
          { t: '10:20', o: 389.20, h: 390.45, l: 389.05, c: 389.50, v: 1.4 },
          { t: '10:25', o: 389.50, h: 390.50, l: 389.20, c: 389.40, v: 2.0 },
          { t: '10:30', o: 389.50, h: 389.60, l: 388.20, c: 388.70, v: 1.5 },
          { t: '10:35', o: 388.70, h: 388.90, l: 387.60, c: 387.80, v: 1.3 },
          { t: '10:40', o: 387.80, h: 388.10, l: 387.10, c: 387.30, v: 1.1 },
        ];
        return { bars: pre.concat(key), zones: [{ lo: 389.5, hi: 390.5, label: '阻力區 389.50–390.50' }], lines: [{ y: 386.5, label: 'VWAP ≈ 386.50', color: 'var(--vwap)' }], avgVol: 1.0 };
      },
      steps: [
        { show: 9, text: 'TSLA 由 $385 一路升到 $388.90，結構係 HH + HL，價格喺 VWAP（約 $386.50）上方。你事前畫好阻力區 $389.50–$390.50。', q: '價格接近阻力區，第一件事係？', options: ['觀察阻力區反應，唔追高', '升勢 = 即刻追買', '預估會跌，即刻 Short'], answer: 0, explain: '位置最重要：升勢遇到阻力，就係要觀察反應嘅時候。' },
        { show: 10, text: '10:20：一度升到 $390.45，收 $389.50，上影線開始變長。', q: '呢支 K 線你會點標記？', options: ['可能遇到賣壓，但未有結論 → WAIT', '已經反轉，Short', '突破成功，買入'], answer: 0, explain: '單一支 K 線只係線索。' },
        { show: 11, text: '10:25：Open $389.50、High $390.50、Low $389.20、Close $389.40，成交量 2M（平均約 1M 嘅 2 倍）。長上影線、細實體、收近低位 —— Shooting Star。', q: '量大 + Shooting Star 喺阻力區，代表？', options: ['阻力區出現明顯賣壓，係潛在轉弱訊號（未確認）', '一定會大跌', '量大一定係好消息'], answer: 0, explain: '高成交量提升咗呢個位置嘅重要性，但唔代表一定反轉。' },
        { show: 11, text: '升勢 + 價格喺 VWAP 上方 vs. 阻力區 + Shooting Star + 2M 量。兩組證據互相矛盾。', q: 'Level 2 嘅正確結論係？', options: ['WAIT：等下一支跌穿 Shooting Star 低位 $389.20', '即刻 Short，Shooting Star 係看跌', '即刻買，升勢未完'], answer: 0, explain: '上升結構仍然存在，但阻力區出現明顯賣壓。確認條件：跌穿 $389.20。失效條件：升穿並守穩 $390.50 上方。' },
        { show: 12, text: '10:30：Open $389.50、High $389.60、Low $388.20、Close $388.70。跌穿咗 Shooting Star 低位 $389.20。', q: '而家點解讀？', options: ['看跌證據增加；但下方仲有 VWAP $386.50 作為潛在支持', '確定大跌市，全倉 Short', '冇變化'], answer: 0, explain: '轉弱訊號有後續確認，但升勢未正式改變，VWAP 可能有承接。' },
        { show: 14, text: '之後兩支繼續回落到 $387.30（模擬），向 VWAP 靠近。', q: '如果你係新手，最好嘅學習方法係？', options: ['用 Replay 記錄分析、確認條件同失效條件，之後檢查結果', '直接用真錢做 Short', '只記住「Shooting Star = 跌」'], answer: 0, explain: '真正要學嘅係「點樣等確認」同「點樣界定失效」，唔係背形態。' },
      ],
      outro: '同一支 Shooting Star，喺阻力區 + 量大先有意義；仲要等跌穿低位確認。如果之後重新企穩 $390.50 上方，看跌假設就失效。',
    },
    'l2-pullback': {
      title: '升勢回調 + Higher Low（Level 2 情境 3）', level: 'l2', icon: '🪜',
      desc: '回調量逐步減少、守住 HL、Bullish Engulfing —— 練「等確認」。',
      build() {
        const bars = [
          { t: '09:35', o: 380.00, h: 381.40, l: 379.80, c: 381.20, v: 1.0 },
          { t: '09:40', o: 381.20, h: 383.30, l: 381.00, c: 383.00, v: 1.2 },
          { t: '09:45', o: 383.00, h: 385.20, l: 382.80, c: 385.00, v: 1.3 },
          { t: '09:50', o: 385.00, h: 385.10, l: 383.80, c: 384.00, v: 0.8 },
          { t: '09:55', o: 384.00, h: 384.20, l: 383.00, c: 383.40, v: 0.7 },
          { t: '10:00', o: 383.40, h: 386.20, l: 383.30, c: 386.00, v: 1.2 },
          { t: '10:05', o: 386.00, h: 388.40, l: 385.80, c: 388.20, v: 1.3 },
          { t: '10:10', o: 388.20, h: 390.20, l: 388.00, c: 390.00, v: 1.4 },
          { t: '10:15', o: 390.00, h: 390.10, l: 387.80, c: 388.00, v: 0.8 },
          { t: '10:20', o: 388.00, h: 388.20, l: 385.90, c: 386.10, v: 0.55 },
          { t: '10:25', o: 386.10, h: 386.40, l: 385.40, c: 385.80, v: 0.35 },
          { t: '10:30', o: 385.60, h: 387.40, l: 385.50, c: 387.20, v: 1.1 },
          { t: '10:35', o: 387.20, h: 388.10, l: 387.00, c: 387.90, v: 1.0 },
          { t: '10:40', o: 387.90, h: 389.30, l: 387.70, c: 389.10, v: 1.1 },
        ];
        return { bars, lines: [{ y: 384.5, label: 'VWAP ≈ 384.50', color: 'var(--vwap)' }, { y: 383, label: '前 HL 383', color: 'var(--muted)' }], avgVol: 1.0 };
      },
      steps: [
        { show: 8, text: 'TSLA：$380 → $385 → 回調 $383 → $390。結構係 HH + HL，價格喺 VWAP（約 $384.50）上方。', q: '而家嘅市場 Bias 係？', options: ['偏強（Uptrend）', '偏弱', '冇方向'], answer: 0, explain: '高位愈來愈高、低位都愈來愈高。' },
        { show: 11, text: '之後連續三支紅燭：$390 → $388 → $386，成交量 800K → 550K → 350K。', q: '回調中量逐步減少，最合理解讀？', options: ['賣壓未有持續擴大，可能只係正常回調', '大跌市開始', '量細 = 冇人理，冇意義'], answer: 0, explain: '回調量縮通常比回調量增健康，但仍然只係輔助證據。' },
        { show: 11, text: '價格仍然高過前一個 HL $383，亦未失守 VWAP。', q: '而家可唔可以買？', options: ['WAIT：回調未完、未有反彈確認', '即刻買，量縮一定反彈', '即刻 Short'], answer: 0, explain: '有回調、有量縮，但仲未見到買盤重新取得控制。' },
        { show: 12, text: '10:30：Bullish Engulfing，Open $385.60 → Close $387.20，成交量 1.1M（明顯回升）。', q: '呢支 K 線代表？', options: ['買盤重新進入，形成潛在 Higher Low', '升勢已經完', '冇意義'], answer: 0, explain: '可以考慮制定計劃：Entry 喺確認位附近，Stop 喺新 HL 下方。' },
        { show: 12, lines: [{ y: 387.3, label: 'Entry 387.30', color: 'var(--accent)' }, { y: 385.3, label: 'Stop 385.30', color: 'var(--down)' }, { y: 390.2, label: 'Target 390.20', color: 'var(--up)' }], text: '模擬計劃：Entry $387.30（升穿 Engulfing 高位附近）、Stop $385.30（新 HL 下方）、Target $390.20（前高附近）。', q: 'R:R 大約係？', options: ['約 1.45R —— 唔夠 2R，要再考慮', '約 3R', '約 0.5R'], answer: 0, explain: '風險 $2.00、回報 $2.90 → 1.45R。方向判斷正確，唔代表交易值得做。' },
        { show: 14, text: '之後價格升到 $389.10（模擬）。', q: '如果 R:R 唔夠你嘅規則，正確做法？', options: ['照規則 SKIP，喺日誌記「有確認但 R:R 唔夠」', '睇到升就後悔，下次唔理 R:R', '刪除紀錄'], answer: 0, explain: '錯過一筆合理放棄嘅交易唔係錯誤。長期跟規則先有可比較嘅數據。' },
      ],
      outro: '情境 3 嘅重點：回調量縮 + 守住 HL + 量回升嘅 Engulfing = 一組完整證據。之後仲要計 R:R 先決定 PLAN 定 SKIP。',
    },
    'l2-chop': {
      title: 'VWAP 附近反覆上落（Level 2 情境 6）', level: 'l2', icon: '🌀',
      desc: '冇明確 HH/HL、反覆穿 VWAP、量冇方向 —— 練習「No Trade」。',
      build() {
        const pts = [385.4, 384.6, 385.6, 384.4, 385.8, 384.9, 384.3, 385.7, 384.7, 385.9, 384.5, 385.2, 384.4, 385.6];
        const bars = C.genBars(pts, { seed: 61, open: 385.0, start: '10:30', wick: 0.35 });
        bars.forEach((b, i) => { b.v = [0.9, 1.1, 0.8, 1.0, 1.2, 0.85, 0.95, 1.05, 0.9, 1.0, 1.15, 0.8, 0.9, 1.0][i]; });
        return { bars, zones: [{ lo: 384, hi: 386, label: '區間 384–386' }], lines: [{ y: 385, label: 'VWAP ≈ 385', color: 'var(--vwap)' }], avgVol: 1.0 };
      },
      steps: [
        { show: 4, text: 'TSLA 喺 $384–$386 之間上落，VWAP 約 $385 而且接近橫行。', q: '第 4 支 K 線收喺 VWAP 下方，係唔係「跌穿 VWAP」訊號？', options: ['唔係：VWAP 橫行時穿上穿落好常見', '係，即刻 Short', '係，即刻買'], answer: 0, explain: 'VWAP 平坦時，價格反覆穿越代表市場未有明確方向。' },
        { show: 7, text: '價格又升返 VWAP 上方，然後再跌落。成交量冇明顯放大。', q: '呢類市況最大嘅風險係？', options: ['Overtrading：成日以為突破，結果反覆止損', '錯過大升市', '冇風險'], answer: 0, explain: '反覆入場 = 反覆付出交易成本同止損。' },
        { show: 10, text: '第 10 支升到 $385.9，好似要突破 $386。', q: '你應該？', options: ['WAIT：等有效突破 $386 並守穩，或者形成清晰結構', '即刻追 Long', '每次去到邊界都 Short'], answer: 0, explain: '有效突破要有收市確認、量配合、守穩。' },
        { show: 14, text: '最後幾支仍然喺區間入面。', q: '今日嘅 Replay 日誌最好點寫？', options: ['「No Trade：結構混亂、反覆穿 VWAP、冇量確認」', '「今日冇做嘢，浪費時間」', '唔使記'], answer: 0, explain: 'No Trade 都係一個決定，值得記錄。日後你會發現呢啲日子幫你避開好多虧損。' },
      ],
      outro: '「唔交易」係專業交易者最常用嘅決定之一。分辨唔到方向嘅時候，等待本身就係策略。',
    },
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
  const shuffled = (n) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
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
      const cfg = Object.assign({}, base, { bars: base.bars.slice(0, s.show), vwap: base.vwap === true ? C.vwapOf(base.bars).slice(0, s.show) : base.vwap, lines: (base.lines || []).concat(s.lines || []), marks: s.marks || [], highlight: s.show - 1, slots: base.bars.length });
      C.candles(chartEl, cfg);
      el.querySelector('.rp-progress-fill').style.width = ((step + 1) / sc.steps.length * 100) + '%';
    };
    const render = () => {
      const s = sc.steps[step];
      answered = false;
      draw(s);
      const last = step === sc.steps.length - 1;
      panel.innerHTML = `<div class="rp-step">第 ${step + 1} / ${sc.steps.length} 步</div><p class="rp-text">${s.text}</p>
        ${s.q ? `<p class="rp-q"><b>${s.q}</b></p><div class="rp-opts">${shuffled(s.options.length).map((i, k) => `<button class="rp-opt" data-i="${i}">${String.fromCharCode(65 + k)}. ${s.options[i]}</button>`).join('')}</div><div class="rp-fb"></div>` : ''}
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
      Store.save(); Store.logAct('replay');
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

  Object.assign(SCENARIOS, window.REPLAY_EXTRA || {});
  { const ord = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'qa']; const keys = Object.keys(SCENARIOS).sort((a, b) => ord.indexOf(SCENARIOS[a].level) - ord.indexOf(SCENARIOS[b].level)); const sorted = {}; keys.forEach((k) => (sorted[k] = SCENARIOS[k])); Object.keys(SCENARIOS).forEach((k) => delete SCENARIOS[k]); Object.assign(SCENARIOS, sorted); }
  window.Replay = { SCENARIOS, play };
})();
