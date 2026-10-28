/* =========================================================
 * Level 9 VCP：互動工具、訓練場練習、K 線重播（教學用途，唔係投資建議）
 * ========================================================= */
(function () {
  const TOOLS = window.TOOLS;
  const { F, money, esc, stat, big, verdict, simpleTool } = window.ToolUtil;
  const G = window.VCPGen;
  const pc = (x, d = 2) => (x * 100).toFixed(d) + '%';
  const CAT = 'VCP 波幅收縮';

  /* ---------------- 收縮計算器 ---------------- */
  TOOLS['vcp-contraction'] = {
    title: 'VCP 收縮計算器', icon: '🌀', cat: CAT, level: 'l9',
    desc: '輸入每段 Swing High / Low，計 T1–T4 回調幅度、收縮比例、低位有冇抬高，同埋 Footprint。',
    render: simpleTool({
      note: '每個 T 由自己嗰次局部高位計到局部低位｜T4 唔用就填 0',
      defaults: { tf: 'daily', h1: 120, l1: 96, h2: 118, l2: 106.2, h3: 117.5, l3: 111.63, h4: 0, l4: 0 },
      fields: [
        { k: 'tf', label: '時間框架', type: 'select', options: [['daily', '日線（經典 VCP）'], ['intra', '5 分鐘（日內 VCP）']] },
        { k: 'h1', label: 'T1 Swing High', step: 0.01 }, { k: 'l1', label: 'T1 Swing Low', step: 0.01 },
        { k: 'h2', label: 'T2 Swing High', step: 0.01 }, { k: 'l2', label: 'T2 Swing Low', step: 0.01 },
        { k: 'h3', label: 'T3 Swing High', step: 0.01 }, { k: 'l3', label: 'T3 Swing Low', step: 0.01 },
        { k: 'h4', label: 'T4 Swing High（可選）', step: 0.01 }, { k: 'l4', label: 'T4 Swing Low（可選）', step: 0.01 },
      ],
      compute: (s) => {
        const T = [];
        for (let i = 1; i <= 4; i++) {
          const h = s['h' + i], l = s['l' + i];
          if (!(h > 0) && !(l > 0)) continue;
          if (!(h > 0 && l > 0)) return verdict(false, `T${i} 要同時填 High 同 Low（或者兩個都填 0）。`);
          if (l >= h) return verdict(false, `T${i} 嘅 Low 要低過 High。`);
          T.push({ i, h, l, d: (h - l) / h });
        }
        if (T.length < 2) return verdict(false, '最少要兩段收縮（2T）先可以比較。');
        const dec = T.every((t, k) => k === 0 || t.d < T[k - 1].d);
        const ratios = T.slice(1).map((t, k) => t.d / T[k].d);
        const lowsUp = T.every((t, k) => k === 0 || t.l >= T[k - 1].l);
        const maxR = Math.max(...ratios);
        const last = T[T.length - 1].d;
        const tight = s.tf === 'daily' ? last <= 0.1 : last <= 0.003;
        const scale = Math.max(...T.map((t) => t.d));
        const bars = T.map((t) => `<div class="vcp-bar"><span>T${t.i}</span><div><i style="width:${(t.d / scale * 100).toFixed(1)}%"></i></div><b>−${pc(t.d)}</b></div>`).join('');
        const fp = `${T.length}T  ${(T[0].d * 100).toFixed(s.tf === 'daily' ? 0 : 2)}/${(last * 100).toFixed(s.tf === 'daily' ? 0 : 2)}`;
        let msg;
        if (!dec) msg = verdict(false, '回調幅度冇逐段縮細 —— 未符合「逐步收縮」呢個必要結構條件。可能只係普通 Range。');
        else if (maxR > 0.85) msg = verdict(null, `數學上逐段減少，但有一段只縮到上一段嘅 ${pc(maxR, 0)}，收縮唔夠明顯（類似 20% → 18% → 17%）。`);
        else if (!lowsUp) msg = verdict(null, '幅度有縮細，但低位冇逐步抬高（出現 Lower Low），要小心結構轉弱。');
        else msg = verdict(true, `回調幅度逐段縮細（每段約為上一段嘅 ${ratios.map((r) => pc(r, 0)).join('、')}），低位逐步抬高${tight ? '，最後一段已經相當緊密' : '，但最後一段仲未算好緊密'}。`);
        return `<div class="vcp-bars">${bars}</div>
          <div class="stats">
            ${stat('收縮次數', T.length + 'T')}
            ${stat('Footprint（深度）', fp)}
            ${stat('逐段縮細', dec ? '✅ 係' : '❌ 唔係', dec ? 'pos' : 'neg')}
            ${stat('低位抬高', lowsUp ? '✅ 係' : '⚠️ 唔係', lowsUp ? 'pos' : 'neg')}
            ${stat('最後一段', '−' + pc(last), tight ? 'pos' : '')}
            ${stat('Pivot 候選（最後一段 High）', '$' + F(T[T.length - 1].h))}
          </div>
          ${msg}
          <p class="tool-fine">只檢查收縮幅度；未考慮時間順序、Volume、既有趨勢、Pivot，所以唔代表已確認 VCP。「緊密」門檻（日線 ≤ 10%、5 分鐘 ≤ 0.3%）只係教學參考。</p>`;
      },
    }),
  };

  /* ---------------- 成交量檢查 ---------------- */
  TOOLS['vcp-volume'] = {
    title: 'VCP 成交量檢查', icon: '📉', cat: CAT, level: 'l9',
    desc: '計最後收縮期間嘅量縮比例（Volume Dry-Up），同突破嗰日比平均高幾多。',
    render: simpleTool({
      note: '日線：用 50 日平均做基準｜日內：用「同時段平均」做基準（RVOL at Time）',
      defaults: { avg: 10, v1: 5.2, v2: 4.1, v3: 3.8, v4: 2.9, v5: 3.0, bo: 15 },
      fields: [
        { k: 'avg', label: '平均成交量（M）', step: 0.1 },
        { k: 'v1', label: '最後收縮 第 1 支（M）', step: 0.1 }, { k: 'v2', label: '第 2 支（M）', step: 0.1 }, { k: 'v3', label: '第 3 支（M）', step: 0.1 },
        { k: 'v4', label: '第 4 支（M）', step: 0.1 }, { k: 'v5', label: '第 5 支（M）', step: 0.1 },
        { k: 'bo', label: '突破嗰支成交量（M）', step: 0.1 },
      ],
      compute: (s) => {
        if (!(s.avg > 0)) return verdict(false, '平均成交量要大過 0。');
        const vs = [s.v1, s.v2, s.v3, s.v4, s.v5].filter((v) => v > 0);
        if (!vs.length) return verdict(false, '最少填一支收縮期成交量。');
        const m = vs.reduce((a, b) => a + b, 0) / vs.length, dry = m / s.avg, boR = s.bo / s.avg;
        return `${big('最後收縮期平均量 ÷ 基準', pc(dry, 0), dry <= 0.6 ? '明顯量縮' : dry <= 0.85 ? '輕微量縮' : '冇明顯量縮', dry <= 0.6 ? 'pos' : dry > 0.85 ? 'neg' : '')}
          <div class="stats">
            ${stat('收縮期平均', F(m) + 'M')}
            ${stat('基準平均', F(s.avg) + 'M')}
            ${stat('突破量 ÷ 基準', F(boR) + ' 倍', boR >= 1.4 ? 'pos' : '')}
            ${stat('突破量比平均', (boR >= 1 ? '+' : '') + pc(boR - 1, 0))}
          </div>
          ${dry > 0.85 ? verdict(false, '最後收縮期成交量冇明顯減少，唔符合典型 Volume Dry-Up。') : verdict(true, 'Volume Dry-Up 候選 —— 但要確認價格仍然強勢、收縮低位未被破壞，唔係「冇人有興趣」。')}
          ${s.bo > 0 ? (boR >= 1.4 ? verdict(true, '突破量高過平均 40% 以上（常見參考）。仍然要睇收市能否企穩喺 Pivot 上方。') : verdict(null, '突破量未去到平均 +40%：唔代表一定失敗，標記「確認較弱」，觀察能否維持。')) : ''}
          <p class="tool-fine">冇一個百分比可以保證突破成功。日內數據唔好同 09:30 嘅量直接比較，要用同時段平均。</p>`;
      },
    }),
  };

  /* ---------------- Trend Template ---------------- */
  TOOLS['trend-template'] = {
    title: 'Minervini Trend Template 檢查', icon: '📈', cat: CAT, level: 'l9',
    desc: '填入股價、50/150/200 日線、52 週高低位同 RS Rating，逐項檢查八個趨勢條件。',
    render: simpleTool({
      note: '數字自己喺 TradingView 讀出嚟（日線）｜篩選條件，唔係買入訊號',
      defaults: { px: 118, s50: 110, s150: 98, s200: 92, s200m: 89, lo52: 72, hi52: 125, rs: 85 },
      fields: [
        { k: 'px', label: '股價', step: 0.01 }, { k: 's50', label: '50 日 SMA', step: 0.01 }, { k: 's150', label: '150 日 SMA', step: 0.01 },
        { k: 's200', label: '200 日 SMA（今日）', step: 0.01 }, { k: 's200m', label: '200 日 SMA（約 1 個月前）', step: 0.01 },
        { k: 'lo52', label: '52 週低位', step: 0.01 }, { k: 'hi52', label: '52 週高位', step: 0.01 }, { k: 'rs', label: 'RS Rating（1–99）', step: 1 },
      ],
      compute: (s) => {
        if (!(s.px > 0 && s.lo52 > 0 && s.hi52 >= s.lo52)) return verdict(false, '股價同 52 週高低位要大過 0，而且高位 ≥ 低位。');
        const aboveLow = s.px / s.lo52 - 1, offHigh = 1 - s.px / s.hi52;
        const C = [
          ['股價高於 150 日同 200 日 SMA', s.px > s.s150 && s.px > s.s200],
          ['150 日 SMA 高於 200 日 SMA', s.s150 > s.s200],
          ['200 日 SMA 最近一個月向上', s.s200 > s.s200m],
          ['50 日 SMA 高於 150 日同 200 日 SMA', s.s50 > s.s150 && s.s50 > s.s200],
          ['股價高於 50 日 SMA', s.px > s.s50],
          [`股價高於 52 週低位至少 25%（而家 +${pc(aboveLow, 0)}）`, aboveLow >= 0.25],
          [`股價距離 52 週高位唔超過 25%（而家 −${pc(Math.max(0, offHigh), 0)}）`, offHigh <= 0.25],
          [`RS Rating ≥ 70（而家 ${s.rs}）`, s.rs >= 70],
        ];
        const n = C.filter((c) => c[1]).length;
        return `${big('符合條件', `${n} / 8`, n === 8 ? '全部符合：Stage 2 候選' : n >= 6 ? '大部分符合' : '唔似 Stage 2', n === 8 ? 'pos' : n < 6 ? 'neg' : '')}
          <ul class="tt-list">${C.map(([t, ok]) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✅' : '❌'} ${esc(t)}</li>`).join('')}</ul>
          ${n === 8 ? verdict(true, '趨勢背景符合。下一步先係搵 VCP Base、畫 T1/T2/T3 同 Pivot。') : verdict(n >= 6 ? null : false, '未完全符合 Trend Template。經典看漲 VCP 通常會先等趨勢背景改善。')}
          <p class="tool-fine">唔同書籍同工具對個別數值（例如 25% vs 30%、RS 70 vs 80）有差異。RS Rating 係相對其他股票嘅排名，唔係 RSI。</p>`;
      },
    }),
  };

  /* ---------------- VCP 交易計劃 ---------------- */
  TOOLS['vcp-plan'] = {
    title: 'VCP 交易計劃計算器', icon: '📐', cat: CAT, level: 'l9',
    desc: '由 Pivot、最後收縮低位、下一阻力計 Entry、Stop、股數（風險 + 資金兩個限制）、R:R，同埋實際成交後 R:R 點變。',
    render: simpleTool({
      note: 'Long｜US$｜整股｜現金戶口（唔用槓桿）',
      defaults: { pivot: 390.10, buf: 0.10, low: 389.55, sbuf: 0.15, res: 391.90, capital: 10000, riskPct: 0.25, fill: 390.35, minRR: 2 },
      fields: [
        { k: 'pivot', label: 'Pivot（最後收縮高位）', step: 0.01 }, { k: 'buf', label: 'Entry Buffer（$）', step: 0.01 },
        { k: 'low', label: 'Final Contraction Low', step: 0.01 }, { k: 'sbuf', label: 'Stop 緩衝（$）', step: 0.01 },
        { k: 'res', label: '下一個重要阻力', step: 0.01 }, { k: 'capital', label: '模擬本金（USD）' },
        { k: 'riskPct', label: '每筆風險預算（%）', step: 0.05 }, { k: 'fill', label: '假設實際成交價（0 = 冇滑價）', step: 0.01 },
        { k: 'minRR', label: '最低 R:R 要求', step: 0.5 },
      ],
      compute: (s) => {
        const entry = s.pivot + Math.max(0, s.buf), stop = s.low - Math.max(0, s.sbuf);
        const risk = entry - stop;
        if (!(risk > 0)) return verdict(false, 'Stop 要低過 Entry：Final Contraction Low 應該低過 Pivot。');
        const target = s.res > entry ? s.res - Math.max(0.01, s.buf) : entry + s.minRR * risk;
        const rr = (target - entry) / risk;
        const fill = s.fill > 0 ? s.fill : entry;
        const rRisk = fill - stop, rRR = rRisk > 0 ? (target - fill) / rRisk : 0;
        const budget = s.capital * s.riskPct / 100;
        const byRisk = Math.floor(budget / risk), byCash = Math.floor(s.capital / fill);
        const shares = Math.max(0, Math.min(byRisk, byCash));
        const ok = rr >= s.minRR, okFill = rRR >= s.minRR;
        return `${big('建議模擬股數', shares, byRisk <= byCash ? '受風險預算限制' : '受本金限制（資金唔夠）', byRisk > byCash ? 'neg' : '')}
          <div class="stats">
            ${stat('Entry Trigger', '$' + F(entry))}
            ${stat('Stop', '$' + F(stop), 'neg')}
            ${stat('Target（阻力之前）', '$' + F(target), 'pos')}
            ${stat('每股風險', '$' + F(risk))}
            ${stat('計劃 R:R', F(rr) + ' : 1', ok ? 'pos' : 'neg')}
            ${stat(`成交 $${F(fill)} 後 R:R`, F(rRR) + ' : 1', okFill ? 'pos' : 'neg')}
            ${stat('風險預算計到', byRisk + ' 股')}
            ${stat('本金最多買到', byCash + ' 股')}
            ${stat('所需資金', money(shares * fill))}
            ${stat('計劃止損損失', money(-shares * rRisk), 'neg')}
          </div>
          <div data-rr></div>
          ${!ok ? verdict(false, `阻力之前只有 ${F(rr)}R，低過你嘅 ${s.minRR}R 要求 —— 按規則 Skip，唔好為咗湊 R:R 移 Stop。`) : !okFill ? verdict(false, `計劃有 ${F(rr)}R，但成交價變差之後得返 ${F(rRR)}R —— 按事前規則用 Stop-Limit 上限或者取消。`) : verdict(true, `計劃同成交後都符合 ${s.minRR}R。仍然係模擬：結果可能係成功延續，亦可能止蝕。`)}
          ${byRisk > byCash ? verdict(null, '風險預算計出嚟嘅股數超過本金買得起嘅數量，所以用本金上限。實際風險會細過預算。') : ''}
          <p class="tool-fine">Target 預設喺下一阻力之前（扣返 Buffer）；如果阻力低過 Entry，就用 ${s.minRR}R 數學目標。未計佣金、跳空同隔夜風險。</p>`;
      },
      after: (out, s) => {
        const entry = s.pivot + Math.max(0, s.buf), stop = s.low - Math.max(0, s.sbuf);
        const target = s.res > entry ? s.res - Math.max(0.01, s.buf) : entry + s.minRR * (entry - stop);
        const box = out.querySelector('[data-rr]');
        if (box && entry > stop) window.Charts.rrLadder(box, { entry, stop, target, side: 'long', title: 'VCP 模擬計劃（Long）' });
      },
    }),
  };

  /* ---------------- 訓練場：VCP 定唔係 VCP？ ---------------- */
  window.DRILLS_EXTRA = window.DRILLS_EXTRA || {};
  window.DRILLS_EXTRA.vcp = {
    title: 'VCP 定唔係 VCP？', icon: '🌀', level: 'l9', rounds: 10,
    desc: '隨機生成日線形態（連成交量），判斷係健康 VCP 候選，定係 Lower Low、普通 Range、跌勢收縮、太鬆、冇量縮。對應 Level 9 第 13 章。',
    gen() {
      // 健康 VCP 出現機會高啲，避免永遠揀「唔係」都啱
      const type = Math.random() < 0.35 ? 'vcp' : G.TYPES[1 + Math.floor(Math.random() * (G.TYPES.length - 1))];
      const m = G.make(type, Math.floor(Math.random() * 1e9));
      const others = G.TYPES.filter((t) => t !== type).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [type].concat(others).sort(() => Math.random() - 0.5).map((t) => G.LABEL[t]);
      return { chart: { bars: m.bars, height: 230, labelEvery: 8 }, q: '呢個日線形態（到今日為止）較似？', opts, ans: m.label, why: m.why };
    },
  };

  /* ---------------- K 線重播：日內 VCP ---------------- */
  window.REPLAY_EXTRA = window.REPLAY_EXTRA || {};
  const PLAN = G.INTRA_PLAN;
  const RES = [{ lo: 391.9, hi: 392.1, label: '阻力 391.90–392.10', color: 'var(--down)', opacity: 0.12 }];
  window.REPLAY_EXTRA['l9-vcp'] = {
    title: '日內 VCP：收縮、Pivot 同突破（Level 9）', level: 'l9', icon: '🌀',
    desc: '跟住 TSLA 5 分鐘走勢，逐段量度 T1、T2、T3，畫 Pivot、計股數，處理滑價同突破後回落。',
    build() { return { bars: G.intraday(), vwap: true, zones: RES }; },
    steps: [
      { show: 4, text: '09:30–09:45：TSLA 由 $386 急升到 $390，成交量大。15m 偏強，VWAP 向上。', q: '而家係咪 VCP？', options: ['未係：只係 Initial Momentum Move，要等收縮出現', '係，即刻追入', '係 Short 機會，升太多'], answer: 0, explain: '強勢上升只係背景，VCP 要等之後出現逐步收縮。' },
      { show: 6, marks: G.INTRA_MARKS.slice(0, 1), text: '09:55：由 $390.00 回落到 $387.60。', q: 'T1 回調大約幾多？你應該點做？', options: ['約 0.62%：記錄 T1，等第二次回調睇幅度有冇縮細', '約 2%：放棄', '回調咗，即刻 Long'], answer: 0, explain: '(390 − 387.60) ÷ 390 ≈ 0.62%。一段回調唔係 VCP。' },
      { show: 10, marks: G.INTRA_MARKS.slice(0, 2), text: '10:15：反彈到 $390.00，再回落到 $388.75，成交量比 T1 期間少。', q: 'T2（約 0.32%）比 T1？', options: ['細咗大約一半、低位抬高 → 收縮開始成形', '大咗，形態失敗', '一樣，係 Range'], answer: 0, explain: '0.62% → 0.32%，低位 387.60 → 388.75。' },
      { show: 14, marks: G.INTRA_MARKS, lines: [{ y: 390.10, label: 'Pivot 390.10', color: '#8b5cf6' }], text: '10:35：再試 $390.10，只回落到 $389.55（約 0.14%），成交量係開市以嚟最低，相對同時段平均都偏低。', q: '下一步？', options: ['畫 Pivot $390.10、Stop 候選、下一阻力，計 R:R', '已經確認，市價買入', '量咁細冇人玩，放棄'], answer: 0, explain: '0.62% → 0.32% → 0.14% 加量縮：候選 VCP。但未突破之前唔入場。' },
      { show: 14, marks: G.INTRA_MARKS, lines: PLAN, text: 'Entry Trigger $390.20（Pivot + $0.10）、Stop $389.40（T3 低位 $389.55 下方）、Target $391.80（阻力區 $391.90 之前）。', q: '計劃 R:R 係？', options: ['2.0R', '1.0R', '3.0R'], answer: 0, explain: '回報 $1.60 ÷ 風險 $0.80 = 2.0R。' },
      { show: 14, marks: G.INTRA_MARKS, lines: PLAN, text: '本金 $10,000，每筆風險 0.25% = $25。每股風險 $0.80 → 風險預算計到 ⌊25 ÷ 0.80⌋ = 31 股。', q: '但 31 股 × $390 ≈ $12,100。現金戶口應該買幾多？', options: ['25 股：股數取風險同資金兩個限制較細者', '31 股，冇問題', '100 股'], answer: 0, explain: '⌊10,000 ÷ 390.20⌋ = 25 股。實際風險 25 × 0.80 = $20，細過預算。' },
      { show: 15, marks: G.INTRA_MARKS, lines: PLAN, text: '10:40 Candle 1：開 $389.90、高 $390.35、收 $390.28，成交量明顯放大。你嘅 Buy Stop 觸發，但實際成交 $390.35。', q: '成交後嘅 R:R 變成？', options: ['約 1.53R', '仍然 2R', '約 3R'], answer: 0, explain: '風險 $0.95、回報 $1.45 → 1.53R。如果規則要求成交時仍有 2R，就應該事前用 Stop-Limit 上限（例如 $390.25）處理，而唔係假裝喺 $390.20 成交。' },
      { show: 16, marks: G.INTRA_MARKS, lines: PLAN, text: '10:45 Candle 2：高 $390.60，但收返 $390.05，Pivot 附近。未跌穿 T3 Low，亦未觸發 Stop。', q: '你嘅規則係固定 Stop / Target，應該？', options: ['按原定規則持有', '將 Stop 移去 $388 俾多啲位', '加倉攤平'], answer: 0, explain: '除非事前寫明「收返 Pivot 下方即退出」，否則按原計劃。移 Stop 係最常見嘅錯誤之一。' },
      { show: 18, marks: G.INTRA_MARKS, lines: PLAN, text: '10:55：高位 $391.85，觸及 Target $391.80。今次係結果 A（成功延續）。', q: '日誌最值得記低嘅係？', options: ['T1/T2/T3 深度、量縮、Pivot、實際 Fill 同滑價、有冇跟規則', '「今日好好彩」', '唔使記，贏咗就得'], answer: 0, explain: '同一個形態下次可能係結果 B（止蝕）。記錄先可以之後統計 VCP 嘅真實表現。' },
    ],
    outro: 'Level 9 嘅重點：收縮係 Setup、突破係 Trigger，兩者都唔保證方向。事前畫 Pivot、Stop、下一阻力，用實際成交價計 R:R，按原定規則管理。',
  };
})();
