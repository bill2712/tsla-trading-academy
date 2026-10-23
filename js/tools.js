/* =========================================================
 * 互動工具／計算器
 * 每個工具：TOOLS[id] = { title, icon, desc, cat, render(el, ctx) }
 * ctx.load(defaults) / ctx.save(state) 會將輸入記住（每個使用者分開）
 * 全部係教學用途，唔係投資建議
 * ========================================================= */
(function () {
  const F = (n, d = 2) => (n == null || !isFinite(n) ? '—' : Number(n).toFixed(d));
  const money = (n, d = 2) => {
    if (n == null || !isFinite(n)) return '—';
    const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    return (n < 0 ? '−$' : '$') + s;
  };
  const pct = (n, d = 1) => (n == null || !isFinite(n) ? '—' : (n * 100).toFixed(d) + '%');
  const signR = (n, d = 2) => (n == null || !isFinite(n) ? '—' : (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) + 'R');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 通用：數字輸入表格 */
  function simpleTool(spec) {
    return function render(el, ctx) {
      const s = ctx.load(Object.assign({}, spec.defaults));
      const fieldsHtml = spec.fields.map((f) => {
        if (f.type === 'select') {
          return `<label class="fld"><span>${f.label}</span><select data-k="${f.k}">${f.options.map((o) => `<option value="${o[0]}" ${String(s[f.k]) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`;
        }
        if (f.type === 'range') {
          return `<label class="fld range"><span>${f.label}：<b data-show="${f.k}">${f.fmt ? f.fmt(s[f.k]) : s[f.k]}</b></span><input type="range" data-k="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${s[f.k]}"></label>`;
        }
        return `<label class="fld"><span>${f.label}</span><input type="number" inputmode="decimal" data-k="${f.k}" step="${f.step || 'any'}" value="${s[f.k]}"></label>`;
      }).join('');
      el.innerHTML = `
        ${spec.note ? `<p class="tool-note">${spec.note}</p>` : ''}
        <div class="tool-grid">${fieldsHtml}</div>
        <div class="tool-out" aria-live="polite"></div>
        <div class="tool-foot">
          <button class="btn ghost sm" data-reset>↺ 重設示例</button>
          ${spec.footnote ? `<span class="tool-footnote">${spec.footnote}</span>` : ''}
        </div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        try { out.innerHTML = spec.compute(s); if (spec.after) spec.after(out, s); }
        catch (e) { out.innerHTML = `<div class="tool-warn">計算出錯：${esc(e.message)}</div>`; }
      };
      el.querySelectorAll('[data-k]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const f = spec.fields.find((x) => x.k === inp.dataset.k);
          s[inp.dataset.k] = f && f.type === 'select' ? inp.value : parseFloat(inp.value);
          const show = el.querySelector(`[data-show="${inp.dataset.k}"]`);
          if (show) show.textContent = f.fmt ? f.fmt(s[f.k]) : s[f.k];
          ctx.save(s); update();
        });
      });
      el.querySelector('[data-reset]').addEventListener('click', () => { ctx.save(Object.assign({}, spec.defaults)); render(el, ctx); });
      update();
    };
  }

  const stat = (label, value, cls = '') => `<div class="stat ${cls}"><span>${label}</span><b>${value}</b></div>`;
  const big = (label, value, unit = '', cls = '') => `<div class="big-out ${cls}"><span>${label}</span><b>${value}</b><em>${unit}</em></div>`;
  const verdict = (ok, text) => `<div class="verdict ${ok === true ? 'ok' : ok === false ? 'bad' : 'mid'}">${text}</div>`;

  const TOOLS = {};

  /* ---------------- Position Size（Level 3 簡單版） ---------------- */
  TOOLS['possize-basic'] = {
    title: 'Long Position Size 計算器', icon: '🧮', cat: '風險與倉位', level: 'l3',
    desc: '輸入本金、風險比例、Entry、Stop、Target，計出最多可以買幾多整股。',
    render: simpleTool({
      note: '教學用途｜假設全現金買入、整股、無借貸，未計手續費及滑價。',
      defaults: { capital: 10000, riskPct: 0.25, entry: 386.10, stop: 384.70, target: 388.90 },
      fields: [
        { k: 'capital', label: '本金（USD）' }, { k: 'riskPct', label: '每筆計劃風險（%）', step: 0.05 },
        { k: 'entry', label: 'Entry（USD）', step: 0.01 }, { k: 'stop', label: 'Stop Loss（USD）', step: 0.01 },
        { k: 'target', label: 'Target（USD）', step: 0.01 },
      ],
      compute: (s) => {
        const risk = s.entry - s.stop;
        if (!(risk > 0)) return verdict(false, 'Long 嘅 Stop 必須低過 Entry。');
        const budget = s.capital * s.riskPct / 100;
        const byRisk = Math.floor(budget / risk);
        const byCash = Math.floor(s.capital / s.entry);
        const shares = Math.max(0, Math.min(byRisk, byCash));
        const rr = (s.target - s.entry) / risk;
        return `
          ${big('模擬最多整股數量（同時受風險及現金限制）', shares, '股')}
          <div class="stats">
            ${stat('計劃風險預算', money(budget))}
            ${stat('買入所需現金', money(shares * s.entry))}
            ${stat('計劃止損虧損', money(-shares * risk), 'neg')}
            ${stat('計劃目標毛利', money(shares * (s.target - s.entry)), 'pos')}
            ${stat('Reward / Risk', F(rr) + ' : 1')}
            ${stat('限制來源', byRisk <= byCash ? '風險預算' : '現金上限')}
          </div>
          ${rr < 1.5 ? verdict(null, 'R:R 低過 1.5，記得檢查目標係咪有結構依據、入場係咪太遲。') : ''}
          <p class="tool-fine">此計算器唔代表推薦股數，亦唔保證最大損失；真實交易要另外扣除佣金、匯兌、價差、滑價同預留現金。</p>`;
      },
    }),
  };

  /* ---------------- Day Trading Risk Calculator（Level 4） ---------------- */
  TOOLS['possize-pro'] = {
    title: 'Day Trading Risk Calculator', icon: '🛡️', cat: '風險與倉位', level: 'l4',
    desc: '加入滑價緩衝、來回費用、最多動用本金 %，支援 Long / Short。',
    render: simpleTool({
      note: '股票模擬｜US$｜整股｜未使用槓桿',
      defaults: { side: 'long', capital: 10000, riskPct: 0.25, entry: 386.10, stop: 384.70, target: 388.90, slip: 0.20, fees: 2, maxCap: 80 },
      fields: [
        { k: 'side', label: '方向', type: 'select', options: [['long', 'Long 買入'], ['short', 'Short 沽空（只作模擬）']] },
        { k: 'capital', label: '模擬本金（USD）' }, { k: 'riskPct', label: '每筆風險預算（%）', step: 0.05 },
        { k: 'entry', label: 'Entry Price', step: 0.01 }, { k: 'stop', label: 'Stop Price', step: 0.01 },
        { k: 'target', label: 'Target Price', step: 0.01 }, { k: 'slip', label: '估計每股不利滑價（USD）', step: 0.01 },
        { k: 'fees', label: '估計整筆來回費用（USD）', step: 0.5 }, { k: 'maxCap', label: '最多動用本金（%）', step: 5 },
      ],
      compute: (s) => {
        const long = s.side === 'long';
        const risk = long ? s.entry - s.stop : s.stop - s.entry;
        const reward = long ? s.target - s.entry : s.entry - s.target;
        if (!(risk > 0)) return verdict(false, long ? 'Long 嘅 Stop 必須低過 Entry。' : 'Short 嘅 Stop 必須高過 Entry。');
        const budget = s.capital * s.riskPct / 100;
        const perShare = risk + Math.max(0, s.slip);
        const byRisk = Math.floor((budget - s.fees) / perShare);
        const byCash = Math.floor(s.capital * s.maxCap / 100 / s.entry);
        const shares = Math.max(0, Math.min(byRisk, byCash));
        const lossBudget = shares * perShare + s.fees;
        return `
          ${big('符合目前預算限制嘅模擬整股數量', shares, '股')}
          <div class="stats">
            ${stat('風險預算', money(budget))}
            ${stat('所需資金', money(shares * s.entry))}
            ${stat('預算虧損（含緩衝及費用）', money(-lossBudget), 'neg')}
            ${stat('理想目標毛利（未扣成本）', money(shares * reward), 'pos')}
            ${stat('原定價格 Reward / Risk', F(reward / risk) + ' : 1')}
            ${stat('限制來源', byRisk <= byCash ? '風險預算' : '本金上限')}
          </div>
          ${budget <= s.fees ? verdict(false, '風險預算細過費用，呢筆交易唔合理。') : ''}
          ${!long ? verdict(null, 'Short 虧損理論上冇上限，仲要考慮借股、Margin 同 Short Squeeze。課程建議暫時只做模擬。') : ''}
          <p class="tool-fine">計算器假設整筆固定費用及指定滑價緩衝，並未模擬委託簿、稅項、匯兌或更嚴重嘅跳價。結果唔係建議持倉量，實際虧損可能超出顯示數字。</p>`;
      },
    }),
  };

  /* ---------------- 入場太遲 ---------------- */
  TOOLS['late-entry'] = {
    title: '入場太遲？重新計 R:R', icon: '⏱️', cat: '風險與倉位', level: 'l3',
    desc: '比較原本計劃 Entry 同實際可得 Entry 嘅風險回報。',
    render: simpleTool({
      defaults: { plan: 386.10, actual: 387.20, stop: 384.70, target: 388.90, minRR: 1.5 },
      fields: [
        { k: 'plan', label: '原本計劃 Entry', step: 0.01 }, { k: 'actual', label: '實際可得 Entry', step: 0.01 },
        { k: 'stop', label: 'Stop', step: 0.01 }, { k: 'target', label: 'Target', step: 0.01 }, { k: 'minRR', label: '你嘅最低 R:R 要求', step: 0.1 },
      ],
      compute: (s) => {
        const rr = (e) => (s.target - e) / (e - s.stop);
        const a = rr(s.plan), b = rr(s.actual);
        return `
          <div class="compare">
            <div class="cmp-col"><h5>原本計劃</h5>${stat('每股風險', money(s.plan - s.stop))}${stat('潛在回報', money(s.target - s.plan))}${stat('R:R', F(a) + 'R')}</div>
            <div class="cmp-arrow">→</div>
            <div class="cmp-col"><h5>實際入場</h5>${stat('每股風險', money(s.actual - s.stop))}${stat('潛在回報', money(s.target - s.actual))}${stat('R:R', F(b) + 'R', b < s.minRR ? 'neg' : 'pos')}</div>
          </div>
          ${b >= s.minRR ? verdict(true, `仍然符合 ${s.minRR}R 最低要求，但記得用實際成交價記錄。`) : verdict(false, `跌到 ${F(b)}R，低過你嘅 ${s.minRR}R 要求 —— 根據規則應該放棄。`)}`;
      },
    }),
  };

  /* ---------------- 障礙檢查 ---------------- */
  TOOLS['obstacle'] = {
    title: '中途障礙檢查（VWAP / 阻力）', icon: '🚧', cat: '風險與倉位', level: 'l3',
    desc: '目標前面有冇障礙？計出到障礙同到目標分別有幾多 R。',
    render: simpleTool({
      defaults: { entry: 380.95, stop: 379.45, target: 384.20, obstacle: 382.50 },
      fields: [
        { k: 'entry', label: 'Entry', step: 0.01 }, { k: 'stop', label: 'Stop', step: 0.01 },
        { k: 'target', label: 'Target', step: 0.01 }, { k: 'obstacle', label: '中途障礙（例如 VWAP）', step: 0.01 },
      ],
      compute: (s) => {
        const r = s.entry - s.stop;
        if (!(r > 0)) return verdict(false, 'Stop 要低過 Entry。');
        const toObs = (s.obstacle - s.entry) / r, toTgt = (s.target - s.entry) / r;
        const between = s.obstacle > s.entry && s.obstacle < s.target;
        return `
          <div class="stats">
            ${stat('每股風險', money(r))}
            ${stat('到障礙', signR(toObs), toObs < 1.2 ? 'neg' : '')}
            ${stat('到目標', signR(toTgt), 'pos')}
          </div>
          <div class="meter"><div class="meter-fill" style="width:${Math.max(0, Math.min(100, toObs / Math.max(toTgt, 0.01) * 100))}%"></div><span class="meter-label">障礙位置：目標路程嘅 ${F(Math.max(0, toObs / toTgt * 100), 0)}%</span></div>
          ${between ? (toObs < 1.2 ? verdict(false, '障礙好近（< 1.2R）。可以：A. 事前定喺障礙附近減倉規則再重新計整體回報；或 B. 直接放棄等更好位置。') : verdict(null, '障礙喺中途，但有一定空間。記得考慮價格喺障礙受阻嘅可能。')) : verdict(true, '障礙唔喺 Entry 同 Target 之間。')}`;
      },
    }),
  };

  /* ---------------- 期望值（簡單） ---------------- */
  TOOLS['expectancy-mini'] = {
    title: 'R:R ≠ 勝率：期望值快計', icon: '🎲', cat: '統計與期望值', level: 'l3',
    desc: '用勝率同 R:R 計每筆平均結果。',
    render: simpleTool({
      defaults: { wr: 40, win: 2, loss: 1 },
      fields: [
        { k: 'wr', label: '勝率', type: 'range', min: 10, max: 90, step: 1, fmt: (v) => v + '%' },
        { k: 'win', label: '每次贏（R）', step: 0.1 }, { k: 'loss', label: '每次輸（R，正數）', step: 0.1 },
      ],
      compute: (s) => {
        const p = s.wr / 100, e = p * s.win - (1 - p) * s.loss, be = s.loss / (s.win + s.loss);
        return `${big('Expectancy（每筆，未計成本）', signR(e), '', e >= 0 ? 'pos' : 'neg')}
          <div class="stats">${stat('打和勝率', pct(be))}${stat('100 筆預期結果', signR(e * 100, 1))}</div>
          <p class="tool-fine">公式：${s.wr}% × ${s.win}R − ${100 - s.wr}% × ${s.loss}R</p>`;
      },
    }),
  };

  /* ---------------- Expectancy Lab ---------------- */
  TOOLS['expectancy-lab'] = {
    title: 'Strategy Expectancy Lab', icon: '🧪', cat: '統計與期望值', level: 'l5',
    desc: '改勝率、平均盈利、虧損同成本，睇 Net Expectancy 同打和勝率點變。',
    render: simpleTool({
      note: '假設平均盈利、虧損同每筆成本固定，用嚟理解數學關係，唔係真實策略預測。',
      defaults: { wr: 40, win: 1.8, loss: 1.0, cost: 0.15 },
      fields: [
        { k: 'wr', label: 'Win Rate', type: 'range', min: 5, max: 95, step: 1, fmt: (v) => v + '%' },
        { k: 'win', label: 'Average Win', type: 'range', min: 0.2, max: 5, step: 0.1, fmt: (v) => '+' + Number(v).toFixed(1) + 'R' },
        { k: 'loss', label: 'Average Loss（絕對值）', type: 'range', min: 0.2, max: 3, step: 0.1, fmt: (v) => Number(v).toFixed(1) + 'R' },
        { k: 'cost', label: '每筆平均成本', type: 'range', min: 0, max: 0.6, step: 0.01, fmt: (v) => Number(v).toFixed(2) + 'R' },
      ],
      compute: (s) => {
        const p = s.wr / 100;
        const gross = p * s.win - (1 - p) * s.loss;
        const net = gross - s.cost;
        const be = (s.loss + s.cost) / (s.win + s.loss);
        return `${big('Net Expectancy（每筆）', signR(net, 3), '', net >= 0 ? 'pos' : 'neg')}
          <div class="stats">${stat('未扣成本', signR(gross, 3))}${stat('估算打和勝率', pct(be))}${stat('你嘅勝率', s.wr + '%', p >= be ? 'pos' : 'neg')}</div>
          ${verdict(net >= 0, net >= 0 ? '喺呢組數學假設下，平均結果為正。' : '喺呢組數學假設下，平均結果為負。')}
          <div class="mini-chart" data-chart></div>`;
      },
      after: (out, s) => {
        const xs = [], ys = [], labels = [];
        for (let w = 5; w <= 95; w += 5) { const p = w / 100; xs.push(w); ys.push(p * s.win - (1 - p) * s.loss - s.cost); labels.push(w + '%'); }
        Charts.line(out.querySelector('[data-chart]'), { series: [{ data: ys, color: 'var(--accent)', dots: true }], labels, ref: 0, height: 200, format: (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + 'R', title: 'Net Expectancy vs 勝率（其他數字不變）' });
      },
    }),
  };

  /* ---------------- 分批止賺 ---------------- */
  TOOLS['partial-tp'] = {
    title: '分批止賺結果比較', icon: '✂️', cat: '出場與管理', level: 'l3',
    desc: '比較一次過止賺同分批止賺喺唔同走勢下嘅平均結果。',
    render: simpleTool({
      defaults: { frac: 50, t1: 1, t2: 2 },
      fields: [
        { k: 'frac', label: '第一批比例', type: 'range', min: 10, max: 90, step: 10, fmt: (v) => v + '%' },
        { k: 't1', label: '第一批目標（R）', step: 0.1 }, { k: 't2', label: '第二批目標（R）', step: 0.1 },
      ],
      compute: (s) => {
        const a = s.frac / 100, b = 1 - a;
        const rows = [
          ['直達完整目標', s.t2, a * s.t1 + b * s.t2],
          ['到第一目標後回落到原 Stop', -1, a * s.t1 + b * -1],
          ['未到第一目標就止損', -1, -1],
        ];
        return `<table class="tbl"><thead><tr><th>情境</th><th>一次過（全部 ${s.t2}R）</th><th>分批（${s.frac}% @ ${s.t1}R）</th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${r[0]}</td><td class="${r[1] >= 0 ? 'pos' : 'neg'}">${signR(r[1])}</td><td class="${r[2] >= 0 ? 'pos' : 'neg'}">${signR(r[2])}</td></tr>`).join('')}
          </tbody></table>
          <p class="tool-fine">分批止賺減少咗「回吐變全輸」嘅情況，但亦降低咗大行情時嘅平均回報。邊個好要靠回測決定，未計成本。</p>`;
      },
    }),
  };

  /* ---------------- 成本影響 ---------------- */
  TOOLS['cost-impact'] = {
    title: '交易成本敏感度', icon: '💸', cat: '統計與期望值', level: 'l3',
    desc: '一批交易嘅總 R，扣除每筆成本之後仲剩幾多？',
    render: simpleTool({
      defaults: { n: 50, wins: 20, avgWin: 2, avgLoss: 1, cost: 0.15 },
      fields: [
        { k: 'n', label: '總交易數', step: 1 }, { k: 'wins', label: '盈利交易數', step: 1 },
        { k: 'avgWin', label: '平均贏（R）', step: 0.1 }, { k: 'avgLoss', label: '平均輸（R，正數）', step: 0.1 },
        { k: 'cost', label: '每筆成本（R）', step: 0.01 },
      ],
      compute: (s) => {
        const losses = Math.max(0, s.n - s.wins);
        const gross = s.wins * s.avgWin - losses * s.avgLoss;
        const costs = s.n * s.cost, net = gross - costs;
        const share = gross > 0 ? costs / gross : null;
        return `<div class="stats">
          ${stat('Gross 結果', signR(gross, 1), gross >= 0 ? 'pos' : 'neg')}
          ${stat('總成本', '−' + F(costs, 1) + 'R', 'neg')}
          ${stat('Net 結果', signR(net, 1), net >= 0 ? 'pos' : 'neg')}
          ${stat('Net Expectancy / 筆', signR(net / s.n, 3))}
          </div>
          ${share != null ? `<div class="meter"><div class="meter-fill neg" style="width:${Math.min(100, share * 100)}%"></div><span class="meter-label">成本食咗 ${F(share * 100, 0)}% 嘅毛利</span></div>` : ''}`;
      },
    }),
  };

  /* ---------------- Trade Plan ---------------- */
  TOOLS['trade-plan'] = {
    title: 'Trade Plan 十項計劃表', icon: '📝', cat: '計劃與規則', level: 'l4',
    desc: '入場前將十項寫低；自動計 R:R 同股數，可以複製文字。',
    render(el, ctx) {
      const d = { symbol: 'TSLA', tf: '5m', bias: '15m Uptrend', setup: 'Breakout + Retest', level: '$385 Resistance', trigger: 386.10, stop: 384.70, target: 388.90, risk: 25, cancel: '回測失敗，或者未入場前已不符合條件' };
      const s = ctx.load(Object.assign({}, d));
      const txt = (k, label) => `<label class="fld wide"><span>${label}</span><input type="text" data-k="${k}" value="${esc(s[k])}"></label>`;
      const num = (k, label) => `<label class="fld"><span>${label}</span><input type="number" step="0.01" data-k="${k}" value="${s[k]}"></label>`;
      el.innerHTML = `<div class="tool-grid">
          ${txt('symbol', '1. Symbol')}${txt('tf', '2. Timeframe')}${txt('bias', '3. Market Bias')}${txt('setup', '4. Setup')}${txt('level', '5. Key Level')}
          ${num('trigger', '6. Entry Trigger')}${num('stop', '7. Stop Loss')}${num('target', '8. Target')}${num('risk', '9. 風險預算（USD）→ Position Size')}
          ${txt('cancel', '10. Invalidation / Cancellation')}
        </div><div class="tool-out"></div>
        <div class="tool-foot"><button class="btn sm" data-copy>📋 複製計劃</button><button class="btn ghost sm" data-reset>↺ 重設</button></div>`;
      const out = el.querySelector('.tool-out');
      const summary = () => {
        const r = s.trigger - s.stop, rr = (s.target - s.trigger) / r, sh = r > 0 ? Math.floor(s.risk / r) : 0;
        return { r, rr, sh, text: `【Trade Plan】${s.symbol} ${s.tf}\nBias：${s.bias}\nSetup：${s.setup}\nKey Level：${s.level}\nEntry Trigger：${s.trigger}\nStop：${s.stop}\nTarget：${s.target}\nR:R：${F(rr)}\n股數：${sh}（風險預算 $${s.risk}）\n取消條件：${s.cancel}` };
      };
      const update = () => {
        const x = summary();
        out.innerHTML = x.r > 0 ? `<div class="stats">${stat('每股風險', money(x.r))}${stat('R:R', F(x.rr) + ' : 1', x.rr >= 1.5 ? 'pos' : 'neg')}${stat('股數（未計成本）', x.sh + ' 股')}${stat('所需資金', money(x.sh * s.trigger))}</div>` : verdict(false, 'Stop 要低過 Entry（Long）。');
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.type === 'number' ? parseFloat(i.value) : i.value; ctx.save(s); update(); }));
      el.querySelector('[data-copy]').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(summary().text).then(() => window.App && App.toast('已複製')); });
      el.querySelector('[data-reset]').addEventListener('click', () => { ctx.save(Object.assign({}, d)); TOOLS['trade-plan'].render(el, ctx); });
      update();
    },
  };

  /* ---------------- Spread ---------------- */
  TOOLS['spread'] = {
    title: 'Spread 成本計算', icon: '↔️', cat: '執行與成交', level: 'l4',
    desc: 'Bid / Ask 差價對你每筆目標利潤嘅影響。',
    render: simpleTool({
      defaults: { bid: 386.02, ask: 386.08, shares: 100, targetPS: 0.20 },
      fields: [{ k: 'bid', label: 'Bid', step: 0.01 }, { k: 'ask', label: 'Ask', step: 0.01 }, { k: 'shares', label: '股數', step: 1 }, { k: 'targetPS', label: '每股目標利潤', step: 0.01 }],
      compute: (s) => {
        const sp = s.ask - s.bid;
        return `<div class="stats">${stat('Spread', money(sp))}${stat('即買即賣損失', money(-sp * s.shares), 'neg')}${stat('佔每股目標', pct(sp / s.targetPS, 0), sp / s.targetPS > 0.2 ? 'neg' : '')}</div>
          <p class="tool-fine">仲未計佣金同滑價。目標越細（Scalping），Spread 嘅比例越大。</p>`;
      },
    }),
  };

  /* ---------------- Slippage ---------------- */
  TOOLS['slippage'] = {
    title: '滑價對 R:R 嘅影響', icon: '🛝', cat: '執行與成交', level: 'l4',
    desc: '計劃 Entry 同實際成交差少少，R:R 會變幾多？',
    render: simpleTool({
      defaults: { plan: 386.10, fill: 386.27, stop: 384.70, target: 388.90 },
      fields: [{ k: 'plan', label: '計劃 Entry', step: 0.01 }, { k: 'fill', label: '實際成交', step: 0.01 }, { k: 'stop', label: 'Stop', step: 0.01 }, { k: 'target', label: 'Target', step: 0.01 }],
      compute: (s) => {
        const r0 = s.plan - s.stop, r1 = s.fill - s.stop, w0 = s.target - s.plan, w1 = s.target - s.fill;
        return `<div class="compare">
          <div class="cmp-col"><h5>計劃</h5>${stat('風險', money(r0))}${stat('回報', money(w0))}${stat('R:R', F(w0 / r0))}</div>
          <div class="cmp-arrow">→</div>
          <div class="cmp-col"><h5>實際（滑價 ${money(s.fill - s.plan)}）</h5>${stat('風險', money(r1), 'neg')}${stat('回報', money(w1))}${stat('R:R', F(w1 / r1), 'neg')}</div></div>`;
      },
    }),
  };

  /* ---------------- Order Book ---------------- */
  TOOLS['orderbook'] = {
    title: '簡化 Order Book：100 股市價買入', icon: '📚', cat: '執行與成交', level: 'l4',
    desc: '最接近嘅賣盤唔夠，你嘅市價單會「食」上幾個價位。',
    render(el, ctx) {
      const d = { shares: 100, levels: [[386.08, 20], [386.12, 30], [386.20, 100], [386.30, 200]] };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      el.innerHTML = `<p class="tool-note">簡化例子：假設其他市場條件不變。實際美股有多個交易場所同更複雜嘅流動性。</p>
        <div class="tool-grid"><label class="fld"><span>Market Buy 股數</span><input type="number" data-shares value="${s.shares}" step="10"></label></div>
        <table class="tbl ob"><thead><tr><th>Ask 價</th><th>可賣股數</th><th>你食咗</th></tr></thead><tbody></tbody></table>
        <div class="tool-out"></div><div class="tool-foot"><button class="btn ghost sm" data-reset>↺ 重設示例</button></div>`;
      const tb = el.querySelector('tbody'), out = el.querySelector('.tool-out');
      const update = () => {
        let left = s.shares, cost = 0;
        const fills = s.levels.map(([p, q]) => { const t = Math.max(0, Math.min(left, q)); left -= t; cost += t * p; return t; });
        tb.innerHTML = s.levels.map(([p, q], i) => `<tr class="${fills[i] ? 'hit' : ''}"><td><input type="number" step="0.01" data-p="${i}" value="${p}"></td><td><input type="number" step="1" data-q="${i}" value="${q}"></td><td>${fills[i] ? fills[i] + ' 股' : '—'}</td></tr>`).join('');
        const filled = s.shares - left;
        const avg = filled ? cost / filled : NaN;
        out.innerHTML = `<div class="stats">${stat('平均成交價', money(avg))}${stat('比最佳 Ask 差', money(avg - s.levels[0][0]), 'neg')}${stat('額外成本', money(-(avg - s.levels[0][0]) * filled), 'neg')}</div>${left > 0 ? verdict(false, `仲有 ${left} 股未成交（掛單唔夠）。`) : ''}`;
        tb.querySelectorAll('input').forEach((i) => i.addEventListener('change', () => {
          if (i.dataset.p != null) s.levels[i.dataset.p][0] = parseFloat(i.value); else s.levels[i.dataset.q][1] = parseFloat(i.value);
          ctx.save(s); update();
        }));
      };
      el.querySelector('[data-shares]').addEventListener('input', (e) => { s.shares = parseFloat(e.target.value) || 0; ctx.save(s); update(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { ctx.save(JSON.parse(JSON.stringify(d))); TOOLS['orderbook'].render(el, ctx); });
      update();
    },
  };

  /* ---------------- Order 類型模擬器 ---------------- */
  TOOLS['order-sim'] = {
    title: 'Order 類型跳價模擬器', icon: '⚡', cat: '執行與成交', level: 'l4',
    desc: '價格平穩落、急跌、或者跳空時，Stop Market 同 Stop-Limit 會點成交？',
    render(el, ctx) {
      const d = { stop: 384.70, limit: 384.50, scenario: 'gap' };
      const s = ctx.load(Object.assign({}, d));
      const scen = {
        smooth: { name: '慢慢跌', path: [385.20, 385.00, 384.85, 384.72, 384.68, 384.60, 384.50, 384.40] },
        fast: { name: '急跌（有滑價）', path: [385.20, 384.90, 384.75, 384.55, 384.30, 384.10, 383.90] },
        gap: { name: '跳空（$384.80 → $383.90）', path: [385.20, 385.00, 384.80, 383.90, 383.70, 383.50] },
        bounce: { name: '插針後反彈', path: [385.20, 384.90, 384.65, 384.95, 385.40, 385.80] },
      };
      el.innerHTML = `<p class="tool-note">你持有 TSLA Long。設定止損，揀一個價格走勢，睇吓兩種止損單嘅結果。（簡化：每一格代表下一個可成交價。）</p>
        <div class="tool-grid">
          <label class="fld"><span>Stop（觸發價）</span><input type="number" step="0.01" data-k="stop" value="${s.stop}"></label>
          <label class="fld"><span>Stop-Limit 嘅 Limit</span><input type="number" step="0.01" data-k="limit" value="${s.limit}"></label>
          <label class="fld"><span>價格走勢</span><select data-k="scenario">${Object.entries(scen).map(([k, v]) => `<option value="${k}" ${s.scenario === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
        </div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        const path = scen[s.scenario].path;
        let trig = path.findIndex((p) => p <= s.stop);
        let mkt = '未觸發', mktCls = '', sl = '未觸發', slCls = '';
        if (trig >= 0) {
          const fp = path[trig];
          mkt = `觸發後以約 ${money(fp)} 成交（比 Stop 差 ${money(fp - s.stop)}）`; mktCls = fp < s.stop - 0.05 ? 'neg' : '';
          const ok = path.slice(trig).find((p) => p >= s.limit);
          if (ok != null) { sl = `以 ${money(Math.max(ok, s.limit))} 或更好成交`; slCls = 'pos'; }
          else { sl = `❗ 價格已跳過 Limit ${money(s.limit)}，張單掛住冇成交 —— 你仲持有一個下跌中嘅倉位`; slCls = 'neg'; }
          if (s.scenario === 'bounce') { mkt += '；之後價格反彈返上去（被插針掃走）'; }
        }
        out.innerHTML = `<div class="path">${path.map((p, i) => `<span class="pt ${i === trig ? 'trig' : ''} ${p <= s.stop ? 'below' : ''}">${F(p)}</span>`).join('<i>→</i>')}</div>
          <table class="tbl"><tbody><tr><th>Stop Market</th><td class="${mktCls}">${mkt}</td></tr><tr><th>Stop-Limit</th><td class="${slCls}">${sl}</td></tr></tbody></table>
          <p class="tool-fine">記住：唔存在一種 Order 能夠同時保證即時成交及理想價格。</p>`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.tagName === 'SELECT' ? i.value : parseFloat(i.value); ctx.save(s); update(); }));
      update();
    },
  };

  /* ---------------- ATR 檢查 ---------------- */
  TOOLS['atr-check'] = {
    title: '止損距離 vs ATR', icon: '📏', cat: '風險與倉位', level: 'l4',
    desc: '結構止損定咗之後，用 ATR 檢查會唔會太貼近正常波動。',
    render: simpleTool({
      defaults: { entry: 385.00, stop: 384.80, atr: 0.90 },
      fields: [{ k: 'entry', label: 'Entry', step: 0.01 }, { k: 'stop', label: '結構 Stop', step: 0.01 }, { k: 'atr', label: '5m ATR', step: 0.01 }],
      compute: (s) => {
        const d = Math.abs(s.entry - s.stop), m = d / s.atr;
        return `${big('止損距離 ÷ ATR', F(m), '× ATR', m < 0.5 ? 'neg' : '')}
          ${m < 0.5 ? verdict(false, '止損距離少過半支典型 K 線波幅，容易俾正常震盪掃走。考慮：等更好入場位、放棄，或者（寫入規則後）加緩衝並減股數。') : m > 3 ? verdict(null, '止損距離好遠，股數會好少；檢查係咪真係需要咁遠。') : verdict(true, '止損距離相對 ATR 唔算過貼。')}
          <p class="tool-fine">ATR 唔知道邊個係重要 S/R —— 先用結構定失效位，ATR 只係用嚟檢查。</p>`;
      },
    }),
  };

  /* ---------------- 每日風險 ---------------- */
  TOOLS['daily-risk'] = {
    title: '今日風險追蹤器', icon: '🚦', cat: '風險與倉位', level: 'l4',
    desc: '輸入今日每筆實際盈虧同持倉風險，即刻知道仲可唔可以開新倉。',
    render(el, ctx) {
      const d = { equity: 10000, perPct: 0.25, warnPct: 0.5, stopPct: 0.75, maxTrades: 3, results: [-25.8, -24.2], open: 25 };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      el.innerHTML = `<div class="tool-grid">
          <label class="fld"><span>帳戶權益</span><input type="number" data-k="equity" value="${s.equity}"></label>
          <label class="fld"><span>每筆風險 %</span><input type="number" step="0.05" data-k="perPct" value="${s.perPct}"></label>
          <label class="fld"><span>警戒線 %</span><input type="number" step="0.05" data-k="warnPct" value="${s.warnPct}"></label>
          <label class="fld"><span>停止交易 %</span><input type="number" step="0.05" data-k="stopPct" value="${s.stopPct}"></label>
          <label class="fld"><span>每日最多新交易</span><input type="number" step="1" data-k="maxTrades" value="${s.maxTrades}"></label>
          <label class="fld"><span>未平倉持倉嘅計劃風險（USD）</span><input type="number" step="1" data-k="open" value="${s.open}"></label>
        </div>
        <div class="row-add"><input type="number" step="0.01" placeholder="今日一筆已平倉淨盈虧，例如 -25.8" data-new><button class="btn sm" data-add>＋ 加入</button><button class="btn ghost sm" data-clear>清除今日</button></div>
        <div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        const realized = s.results.reduce((a, b) => a + b, 0);
        const warn = s.equity * s.warnPct / 100, stopL = s.equity * s.stopPct / 100;
        const exposure = Math.max(0, -realized) + (s.open || 0);
        const left = stopL - exposure;
        let status, cls;
        if (exposure >= stopL || s.results.length >= s.maxTrades) { status = '⛔ 停止開新倉：已到每日上限（或交易次數上限）'; cls = false; }
        else if (exposure >= warn) { status = '⚠️ 警戒：只可以開符合全部條件嘅交易，或者直接收工'; cls = null; }
        else { status = '✅ 仍喺每日風險範圍內（唔代表一定要交易）'; cls = true; }
        out.innerHTML = `<div class="chips">${s.results.map((r, i) => `<span class="chip ${r >= 0 ? 'pos' : 'neg'}">${money(r)} <button data-del="${i}" aria-label="刪除">×</button></span>`).join('') || '<span class="muted">今日未有已平倉交易</span>'}</div>
          <div class="stats">${stat('已實現盈虧', money(realized), realized >= 0 ? 'pos' : 'neg')}${stat('總風險暴露（虧損 + 持倉）', money(exposure))}${stat('距停止線', money(left), left <= 0 ? 'neg' : '')}${stat('已做交易', s.results.length + ' / ' + s.maxTrades)}</div>
          <div class="meter"><div class="meter-fill ${exposure >= warn ? 'neg' : ''}" style="width:${Math.min(100, exposure / stopL * 100)}%"></div><span class="meter-label">每日風險用咗 ${F(exposure / stopL * 100, 0)}%</span></div>
          ${verdict(cls, status)}
          <p class="tool-fine">Daily Loss Limit 係最高界線，唔係每日必須用盡嘅額度。</p>`;
        out.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { s.results.splice(+b.dataset.del, 1); ctx.save(s); update(); }));
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = parseFloat(i.value) || 0; ctx.save(s); update(); }));
      const add = () => { const v = parseFloat(el.querySelector('[data-new]').value); if (isFinite(v)) { s.results.push(v); el.querySelector('[data-new]').value = ''; ctx.save(s); update(); } };
      el.querySelector('[data-add]').addEventListener('click', add);
      el.querySelector('[data-new]').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
      el.querySelector('[data-clear]').addEventListener('click', () => { s.results = []; ctx.save(s); update(); });
      update();
    },
  };

  /* ---------------- 回本需要幾多 ---------------- */
  TOOLS['recovery'] = {
    title: '虧損後需要幾多回報先打和？', icon: '🧗', cat: '統計與期望值', level: 'l4',
    desc: '虧損越大，回本需要嘅百分比越驚人。',
    render: simpleTool({
      defaults: { loss: 20 },
      fields: [{ k: 'loss', label: '帳戶虧損', type: 'range', min: 1, max: 80, step: 1, fmt: (v) => v + '%' }],
      compute: (s) => {
        const need = s.loss / (100 - s.loss);
        return `${big('需要回報', pct(need), '先返到原水平', 'neg')}<p class="tool-fine">例如 $10,000 跌到 $${(10000 * (1 - s.loss / 100)).toLocaleString()}，要賺 ${pct(need)} 先返 $10,000。</p><div data-chart></div>`;
      },
      after: (out) => {
        const ls = [5, 10, 20, 30, 40, 50];
        Charts.bars(out.querySelector('[data-chart]'), { labels: ls.map((l) => '虧 ' + l + '%'), values: ls.map((l) => +(l / (100 - l) * 100).toFixed(1)), format: (v) => v + '%', color: 'var(--down)', title: '回本所需回報' });
      },
    }),
  };

  /* ---------------- 連敗機率 ---------------- */
  function probRun(n, q, k) {
    // n 筆交易入面出現 ≥k 連敗嘅機率（每筆獨立，輸嘅機率 q）
    let dp = new Array(k).fill(0); dp[0] = 1; let hit = 0;
    for (let i = 0; i < n; i++) {
      const nx = new Array(k).fill(0);
      for (let j = 0; j < k; j++) {
        if (!dp[j]) continue;
        nx[0] += dp[j] * (1 - q);
        if (j + 1 >= k) hit += dp[j] * q; else nx[j + 1] += dp[j] * q;
      }
      dp = nx;
    }
    return hit;
  }
  TOOLS['streak'] = {
    title: '連敗機率計算器', icon: '🔁', cat: '統計與期望值', level: 'l4',
    desc: '勝率 40% 嘅策略，做 100 筆會唔會遇到 5 連敗？（假設每筆獨立）',
    render: simpleTool({
      defaults: { wr: 40, n: 100, k: 5 },
      fields: [{ k: 'wr', label: '勝率', type: 'range', min: 10, max: 90, step: 1, fmt: (v) => v + '%' }, { k: 'n', label: '總交易數', step: 10 }, { k: 'k', label: '連敗次數（≥）', step: 1 }],
      compute: (s) => {
        const q = 1 - s.wr / 100, k = Math.max(1, Math.round(s.k)), n = Math.max(1, Math.round(s.n));
        const once = Math.pow(q, k), any = probRun(n, q, k);
        return `<div class="stats">${stat(`由某一筆開始連輸 ${k} 次`, pct(once, 2))}${stat(`${n} 筆內最少出現一次 ${k} 連敗`, pct(any, 1), any > 0.5 ? 'neg' : '')}</div>
          <div data-chart></div>
          <p class="tool-fine">真實交易結果經常唔獨立（例如連續喺 Choppy 市況落單），實際連敗可能更常見。</p>`;
      },
      after: (out, s) => {
        const q = 1 - s.wr / 100, n = Math.max(1, Math.round(s.n));
        const ks = [3, 4, 5, 6, 7, 8, 10, 12];
        Charts.bars(out.querySelector('[data-chart]'), { labels: ks.map((k) => k + ' 連敗'), values: ks.map((k) => +(probRun(n, q, k) * 100).toFixed(1)), format: (v) => v + '%', title: `${n} 筆內出現各種連敗嘅機率` });
      },
    }),
  };

  /* ---------------- R 列表統計 ---------------- */
  function rStats(rs) {
    const n = rs.length; if (!n) return null;
    const w = rs.filter((r) => r > 0), l = rs.filter((r) => r < 0);
    const gp = w.reduce((a, b) => a + b, 0), gl = -l.reduce((a, b) => a + b, 0);
    let eq = 0, peak = 0, mdd = 0, streak = 0, maxStreak = 0; const curve = [0];
    rs.forEach((r) => { eq += r; curve.push(eq); peak = Math.max(peak, eq); mdd = Math.max(mdd, peak - eq); streak = r < 0 ? streak + 1 : 0; maxStreak = Math.max(maxStreak, streak); });
    return { n, wr: w.length / n, avgW: w.length ? gp / w.length : 0, avgL: l.length ? gl / l.length : 0, exp: eq / n, total: eq, pf: gl ? gp / gl : Infinity, mdd, maxStreak, curve };
  }
  TOOLS['r-stats'] = {
    title: '策略統計（貼上逐筆 R）', icon: '📊', cat: '統計與期望值', level: 'l4',
    desc: '貼上一串 Net R（例如 2, -1, -1.2, 0.5），即刻計勝率、期望值、PF、最大回撤同連敗。',
    render(el, ctx) {
      const d = { text: '2, -1, -1, 1.8, -1.2, 2, -1, -1, -1, 2.1, 0.4, -1, 2, -1, 1.6' };
      const s = ctx.load(Object.assign({}, d));
      el.innerHTML = `<label class="fld wide"><span>逐筆 Net R（用逗號、空格或換行分隔）</span><textarea rows="3" data-t>${esc(s.text)}</textarea></label>
        <div class="tool-foot"><button class="btn sm" data-journal>由我嘅交易日誌載入</button><button class="btn ghost sm" data-reset>↺ 示例</button></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        const rs = s.text.split(/[\s,，、;]+/).map(parseFloat).filter((x) => isFinite(x));
        const st = rStats(rs);
        if (!st) { out.innerHTML = '<p class="muted">未有數據。</p>'; return; }
        out.innerHTML = `<div class="stats">
          ${stat('交易數', st.n)}${stat('勝率', pct(st.wr))}${stat('平均贏', signR(st.avgW))}${stat('平均輸', signR(-st.avgL))}
          ${stat('Expectancy', signR(st.exp, 3), st.exp >= 0 ? 'pos' : 'neg')}${stat('總結果', signR(st.total, 1), st.total >= 0 ? 'pos' : 'neg')}
          ${stat('Profit Factor', isFinite(st.pf) ? F(st.pf) : '∞')}${stat('最大回撤', '−' + F(st.mdd) + 'R', 'neg')}${stat('最長連敗', st.maxStreak + ' 筆')}
          </div><div data-chart></div>${st.n < 30 ? verdict(null, `只有 ${st.n} 筆，樣本好細，結論要非常保守。`) : ''}`;
        Charts.line(out.querySelector('[data-chart]'), { series: [{ data: st.curve, color: 'var(--accent)', dots: st.n < 60 }], ref: 0, height: 220, format: (v) => v.toFixed(1) + 'R', title: 'Equity Curve（以 R 計）' });
      };
      el.querySelector('[data-t]').addEventListener('input', (e) => { s.text = e.target.value; ctx.save(s); update(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { s.text = d.text; ctx.save(s); el.querySelector('[data-t]').value = s.text; update(); });
      el.querySelector('[data-journal]').addEventListener('click', () => {
        const rs = (window.Journal ? Journal.netRs() : []);
        if (!rs.length) { window.App && App.toast('交易日誌未有已平倉交易'); return; }
        s.text = rs.map((r) => r.toFixed(2)).join(', '); ctx.save(s); el.querySelector('[data-t]').value = s.text; update();
      });
      update();
    },
  };

  /* ---------------- 滑價壓力測試 ---------------- */
  TOOLS['stress'] = {
    title: 'Slippage Stress Test', icon: '🌡️', cat: '統計與期望值', level: 'l4',
    desc: '同一批交易喺 $0 / $0.10 / $0.30 滑價下，期望值變成點？',
    render: simpleTool({
      defaults: { wr: 45, win: 1.6, loss: 1, riskPS: 1.40, fee: 0.05 },
      fields: [
        { k: 'wr', label: '勝率 %', step: 1 }, { k: 'win', label: '平均贏（R）', step: 0.1 }, { k: 'loss', label: '平均輸（R）', step: 0.1 },
        { k: 'riskPS', label: '平均每股風險（USD）', step: 0.05 }, { k: 'fee', label: '佣金等成本（R / 筆）', step: 0.01 },
      ],
      compute: (s) => {
        const p = s.wr / 100, gross = p * s.win - (1 - p) * s.loss;
        const rows = [['理想', 0], ['一般', 0.10], ['較差', 0.30]].map(([n, sl]) => {
          const costR = (sl * 2) / s.riskPS + s.fee; // 入場同出場各滑一次
          return [n, sl, costR, gross - costR];
        });
        return `<table class="tbl"><thead><tr><th>情境</th><th>每股滑價（每邊）</th><th>成本（R / 筆）</th><th>Net Expectancy</th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${r[0]}</td><td>${money(r[1])}</td><td>${F(r[2], 3)}R</td><td class="${r[3] >= 0 ? 'pos' : 'neg'}">${signR(r[3], 3)}</td></tr>`).join('')}</tbody></table>
          ${rows[2][3] < 0 && rows[0][3] > 0 ? verdict(false, '理想時賺錢、較差時虧損 —— 策略對成交質素非常敏感。') : ''}
          <p class="tool-fine">簡化：假設入場同出場各有一次相同滑價，換算成 R。實際滑價分布未必對稱。</p>`;
      },
    }),
  };

  /* ---------------- MFE / MAE ---------------- */
  TOOLS['mfe-mae'] = {
    title: 'MFE / MAE 計算', icon: '📐', cat: '出場與管理', level: 'l4',
    desc: '持倉期間最多賺過幾多、最多輸過幾多（以 R 計）。',
    render: simpleTool({
      defaults: { entry: 385, stop: 384, high: 386.8, low: 384.6, exit: 385.2 },
      fields: [{ k: 'entry', label: 'Entry', step: 0.01 }, { k: 'stop', label: 'Initial Stop', step: 0.01 }, { k: 'high', label: '持倉期間最高', step: 0.01 }, { k: 'low', label: '持倉期間最低', step: 0.01 }, { k: 'exit', label: 'Exit', step: 0.01 }],
      compute: (s) => {
        const r = s.entry - s.stop; if (!(r > 0)) return verdict(false, 'Stop 要低過 Entry（Long）。');
        const mfe = (s.high - s.entry) / r, mae = (s.entry - s.low) / r, res = (s.exit - s.entry) / r;
        return `<div class="stats">${stat('MFE', signR(mfe), 'pos')}${stat('MAE（不利）', F(mae) + 'R', 'neg')}${stat('最終毛結果', signR(res), res >= 0 ? 'pos' : 'neg')}${stat('回吐', F(mfe - res) + 'R')}</div>
          ${mfe - res > 1 ? verdict(null, '曾經有可觀浮盈但大部分回吐。如果大量交易都係咁，值得研究 Exit Rule（要用全部交易重新測試）。') : ''}
          <p class="tool-fine">MFE / MAE 係分析工具，唔代表你可以喺最高位成交。</p>`;
      },
    }),
  };

  /* ---------------- RVOL ---------------- */
  TOOLS['rvol'] = {
    title: 'RVOL at Time 計算', icon: '📶', cat: '數據與指標', level: 'l5',
    desc: '今日某時段成交量 ÷ 過去 N 日同時段平均。',
    render(el, ctx) {
      const d = { today: 1200000, past: '820000, 760000, 910000, 700000, 850000, 780000, 840000, 760000, 790000, 790000' };
      const s = ctx.load(Object.assign({}, d));
      el.innerHTML = `<div class="tool-grid"><label class="fld"><span>今日呢個時段 Volume</span><input type="number" data-k="today" value="${s.today}"></label></div>
        <label class="fld wide"><span>過去交易日同時段 Volume（逗號分隔，唔可以包括今日或之後）</span><textarea rows="2" data-k="past">${esc(s.past)}</textarea></label><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        const xs = String(s.past).split(/[\s,，]+/).map(Number).filter((x) => isFinite(x) && x > 0);
        if (!xs.length) { out.innerHTML = '<p class="muted">請輸入過去數據。</p>'; return; }
        const avg = xs.reduce((a, b) => a + b, 0) / xs.length, rv = s.today / avg;
        out.innerHTML = `${big('RVOL at Time', F(rv), '×', rv >= 1.5 ? 'pos' : '')}<div class="stats">${stat('過去 ' + xs.length + ' 日平均', Math.round(avg).toLocaleString())}${stat('v1.0 門檻 1.5', rv >= 1.5 ? '✅ 通過' : '❌ 未達')}</div>`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.dataset.k === 'today' ? parseFloat(i.value) : i.value; ctx.save(s); update(); }));
      update();
    },
  };

  /* ---------------- CLV ---------------- */
  TOOLS['clv'] = {
    title: 'CLV 收市位置', icon: '📍', cat: '數據與指標', level: 'l5',
    desc: '(2C − H − L) ÷ (H − L)：+1 = 收喺最高，−1 = 收喺最低。',
    render: simpleTool({
      defaults: { h: 386.05, l: 385.18, c: 385.95 },
      fields: [{ k: 'h', label: 'High', step: 0.01 }, { k: 'l', label: 'Low', step: 0.01 }, { k: 'c', label: 'Close', step: 0.01 }],
      compute: (s) => {
        if (!(s.h > s.l)) return verdict(null, 'H = L（或 H < L）：CLV 無法計算，應標記為缺失，唔好當 0。');
        if (s.c > s.h || s.c < s.l) return verdict(false, 'Close 要喺 High 同 Low 之間。');
        const v = (2 * s.c - s.h - s.l) / (s.h - s.l);
        return `${big('CLV', F(v, 3), '', v >= 0 ? 'pos' : 'neg')}
          <div class="clv-bar"><span style="left:${(v + 1) / 2 * 100}%"></span><em class="l">Low −1</em><em class="m">0</em><em class="r">High +1</em></div>
          ${verdict(v >= 0, v >= 0 ? '收喺 K 線上半部（符合 v1.0 確認條件之一）' : '收喺 K 線下半部')}`;
      },
    }),
  };

  /* ---------------- VWAP 計算 ---------------- */
  TOOLS['vwap'] = {
    title: 'Session VWAP 逐支計算', icon: '〰️', cat: '數據與指標', level: 'l5',
    desc: '輸入幾支 K 線，睇 VWAP 點樣逐支累積。',
    render(el, ctx) {
      const d = { rows: [[384.80, 383.50, 384.50, 1500000], [385.20, 384.10, 385.00, 1200000], [385.60, 384.70, 385.40, 950000], [385.70, 385.05, 385.30, 800000]] };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      el.innerHTML = `<p class="tool-note">每一行係一支已完成 5m K 線（虛構數字）。VWAP 只用當時同之前嘅 K 線。</p>
        <div class="tbl-wrap"><table class="tbl vw"><thead><tr><th>#</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th><th>TP</th><th>累積 TP×V</th><th>累積 V</th><th>VWAP</th><th></th></tr></thead><tbody></tbody></table></div>
        <div class="tool-foot"><button class="btn sm" data-add>＋ 加一支</button><button class="btn ghost sm" data-reset>↺ 示例</button></div><div class="tool-out"></div>`;
      const tb = el.querySelector('tbody'), out = el.querySelector('.tool-out');
      const update = () => {
        let pv = 0, vv = 0;
        const vw = [];
        tb.innerHTML = s.rows.map((r, i) => {
          const [h, l, c, v] = r; const tp = (h + l + c) / 3; pv += tp * v; vv += v; const w = pv / vv; vw.push(w);
          return `<tr><td>${i + 1}</td>${r.map((x, j) => `<td><input type="number" step="${j === 3 ? 1000 : 0.01}" data-r="${i}" data-c="${j}" value="${x}"></td>`).join('')}<td>${F(tp)}</td><td>${(pv / 1e6).toFixed(1)}M</td><td>${(vv / 1e6).toFixed(2)}M</td><td><b>${F(w)}</b></td><td><button class="x" data-del="${i}" aria-label="刪除">×</button></td></tr>`;
        }).join('');
        const bars = s.rows.map((r, i) => ({ t: '#' + (i + 1), o: i ? s.rows[i - 1][2] : r[2], h: r[0], l: r[1], c: r[2], v: r[3] / 1e6 }));
        out.innerHTML = '<div data-chart></div>';
        Charts.candles(out.querySelector('[data-chart]'), { bars, vwap: vw, height: 200 });
        tb.querySelectorAll('input').forEach((inp) => inp.addEventListener('change', () => { s.rows[inp.dataset.r][inp.dataset.c] = parseFloat(inp.value) || 0; ctx.save(s); update(); }));
        tb.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { s.rows.splice(+b.dataset.del, 1); ctx.save(s); update(); }));
      };
      el.querySelector('[data-add]').addEventListener('click', () => { const last = s.rows[s.rows.length - 1] || [385, 384, 384.5, 800000]; s.rows.push([+(last[2] + 0.4).toFixed(2), +(last[2] - 0.3).toFixed(2), +(last[2] + 0.1).toFixed(2), 700000]); ctx.save(s); update(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { s.rows = JSON.parse(JSON.stringify(d.rows)); ctx.save(s); update(); });
      update();
    },
  };

  /* ---------------- 策略規則卡 ---------------- */
  TOOLS['rules-builder'] = {
    title: '策略規則卡（Strategy ID）', icon: '🗂️', cat: '計劃與規則', level: 'l5',
    desc: '將你嘅 v1.0 規則寫成一張卡；改規則就開新版本。',
    render(el, ctx) {
      const d = { id: 'TSLA-BR-LONG', ver: '1.0', capital: 10000, riskPct: 0.25, rvol: 1.5, window: 6, bBuf: 0.05, eBuf: 0.05, sBuf: 0.10, minRR: 1.5, target: '下一重要阻力（R:R ≥ 最低要求）', maxTrades: 3, dailyStop: 0.75, cutoff: '15:30', history: [] };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      const f = (k, l, t = 'number', st = 'any') => `<label class="fld"><span>${l}</span><input type="${t}" step="${st}" data-k="${k}" value="${esc(s[k])}"></label>`;
      el.innerHTML = `<div class="tool-grid">
        ${f('id', 'Strategy ID', 'text')}${f('ver', '版本', 'text')}${f('capital', '模擬本金')}${f('riskPct', '每筆風險 %', 'number', 0.05)}
        ${f('rvol', 'RVOL(time) ≥', 'number', 0.1)}${f('window', 'Retest 最多等幾多支', 'number', 1)}${f('bBuf', 'Breakout 收市緩衝 $', 'number', 0.01)}${f('eBuf', 'Entry = 確認 High + $', 'number', 0.01)}
        ${f('sBuf', 'Stop = Retest Low − $', 'number', 0.01)}${f('minRR', '最低 R:R', 'number', 0.1)}${f('maxTrades', '每日最多交易', 'number', 1)}${f('dailyStop', '每日停止 %', 'number', 0.05)}
        ${f('cutoff', '停止開新倉時間（ET）', 'text')}<label class="fld wide"><span>Target 規則</span><input type="text" data-k="target" value="${esc(s.target)}"></label>
        </div><div class="tool-out"></div>
        <div class="tool-foot"><button class="btn sm" data-copy>📋 複製規則卡</button><button class="btn sm" data-bump>🆕 另存新版本（記錄改動）</button></div>`;
      const out = el.querySelector('.tool-out');
      const card = () => `STRATEGY ID：${s.id}-v${s.ver}\nStatus：Research / Unvalidated\n\nA. Market Filter：RTH 09:30–16:00 ET；15m 已確認 HH+HL；避開預定重大消息時段\nB. Setup Filter：5m Close > Zone Upper + $${s.bBuf}；RVOL(time, Regular) ≥ ${s.rvol}；價格 > Session VWAP\n   Retest：突破後最多 ${s.window} 支 5m K 線內觸及原 Zone；超時 = 過期\n   Confirmation：Close > Zone Upper AND CLV ≥ 0\nC. Trigger：確認 K 線 High + $${s.eBuf}（Buy Stop；用實際 Fill 記錄）\nD. Exit & Risk：Stop = Retest Low − $${s.sBuf}；Target = ${s.target}；最低 R:R ${s.minRR}\n   Sizing：本金 $${s.capital}，每筆 ${s.riskPct}%（$${(s.capital * s.riskPct / 100).toFixed(2)}）\n   Daily：最多 ${s.maxTrades} 筆；累積虧損 ${s.dailyStop}% 停止；${s.cutoff} 後唔開新倉\nCancellation：回測跌穿失效位／未觸發已到下一阻力／R:R 不足／重大消息／超時`;
      const update = () => {
        out.innerHTML = `<pre class="rules-card">${esc(card())}</pre>${s.history.length ? `<details><summary>版本紀錄（${s.history.length}）</summary><table class="tbl"><thead><tr><th>版本</th><th>改動</th><th>日期</th></tr></thead><tbody>${s.history.map((h) => `<tr><td>v${esc(h.ver)}</td><td>${esc(h.note)}</td><td>${new Date(h.ts).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></details>` : ''}`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.type === 'number' ? parseFloat(i.value) : i.value; ctx.save(s); update(); }));
      el.querySelector('[data-copy]').addEventListener('click', () => navigator.clipboard && navigator.clipboard.writeText(card()).then(() => App.toast('已複製規則卡')));
      el.querySelector('[data-bump]').addEventListener('click', () => {
        const note = prompt('今次改咗乜？點解？（會記入版本紀錄）', '');
        if (note == null) return;
        const parts = String(s.ver).split('.'); parts[parts.length - 1] = String((parseInt(parts[parts.length - 1], 10) || 0) + 1);
        s.history.push({ ver: s.ver, note: '（舊版本）' + (note || ''), ts: Date.now() });
        s.ver = parts.join('.'); ctx.save(s); TOOLS['rules-builder'].render(el, ctx);
      });
      update();
    },
  };

  /* ---------------- 狀態機 ---------------- */
  TOOLS['state-machine'] = {
    title: '狀態機逐支播放', icon: '🤖', cat: '數據與指標', level: 'l5',
    desc: '一步步睇 Breakout + Retest 系統點樣由 IDLE 去到 EXIT / LOG。',
    render(el) {
      const states = ['IDLE', 'BREAKOUT', 'WAIT RETEST', 'WAIT CONFIRM', 'ORDER PENDING', 'POSITION OPEN', 'EXIT / LOG'];
      const seq = [['09:45', '接近 $385', 0], ['09:50', '收市突破 $385.20 → 啟動 Retest 期限', 1], ['09:55', '回調到 $385.05（觸及 Zone）', 3], ['10:00', '回測反彈、收近高位 → 定 Trigger / Stop / Target', 4], ['10:05', '突破預定 Trigger → 成交', 5], ['10:10', '短線繼續上升', 5], ['10:15', '回調但未觸 Stop', 5], ['10:20', '低位觸及預定 Stop → 平倉記錄', 6]];
      let i = 0;
      el.innerHTML = `<div class="sm-flow">${states.map((s, k) => `<div class="sm-node" data-s="${k}">${s}</div>`).join('<i>›</i>')}</div>
        <div class="sm-log"></div><div class="tool-foot"><button class="btn sm" data-prev>‹ 上一支</button><button class="btn sm primary" data-next>下一支 ›</button><button class="btn ghost sm" data-reset>↺ 由頭</button></div>`;
      const log = el.querySelector('.sm-log');
      const draw = () => {
        const [t, ev, st] = seq[i];
        el.querySelectorAll('.sm-node').forEach((n) => n.classList.toggle('on', +n.dataset.s === st));
        log.innerHTML = seq.slice(0, i + 1).map(([tt, e, ss], k) => `<div class="sm-row ${k === i ? 'cur' : ''}"><b>${tt}</b><span>${e}</span><em>${states[ss]}</em></div>`).join('');
      };
      el.querySelector('[data-next]').addEventListener('click', () => { if (i < seq.length - 1) i++; draw(); });
      el.querySelector('[data-prev]').addEventListener('click', () => { if (i > 0) i--; draw(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { i = 0; draw(); });
      draw();
    },
  };

  /* ---------------- Net R ---------------- */
  TOOLS['netr'] = {
    title: 'Net P&L 同 Net R', icon: '🧾', cat: '統計與期望值', level: 'l5',
    desc: '用實際成交價同費用計真正嘅 R（可以低過 −1R）。',
    render: simpleTool({
      defaults: { entry: 386.22, stop: 384.70, exit: 384.48, shares: 14, fees: 2 },
      fields: [{ k: 'entry', label: 'Entry Fill', step: 0.01 }, { k: 'stop', label: 'Initial Stop', step: 0.01 }, { k: 'exit', label: 'Exit Fill', step: 0.01 }, { k: 'shares', label: 'Shares', step: 1 }, { k: 'fees', label: 'Fees（來回）', step: 0.5 }],
      compute: (s) => {
        const ir = (s.entry - s.stop) * s.shares, pnl = (s.exit - s.entry) * s.shares - s.fees, r = pnl / ir;
        return `<div class="stats">${stat('Initial Risk', money(ir))}${stat('Net P&L', money(pnl), pnl >= 0 ? 'pos' : 'neg')}${stat('Net R', signR(r), r >= 0 ? 'pos' : 'neg')}</div>
          ${r < -1.05 ? verdict(null, '輸多過 1R：滑價同費用令實際虧損超出計劃。記錄真實數字，唔好硬記成 −1R。') : ''}`;
      },
    }),
  };

  /* ---------------- 信賴區間 ---------------- */
  TOOLS['ci'] = {
    title: '勝率樣本誤差（95% 區間）', icon: '🎯', cat: '統計與期望值', level: 'l5',
    desc: '贏咗幾多筆／總共幾多筆 → 真正勝率大概喺邊個範圍？',
    render: simpleTool({
      defaults: { wins: 45, n: 100 },
      fields: [{ k: 'wins', label: '盈利筆數', step: 1 }, { k: 'n', label: '總筆數', step: 1 }],
      compute: (s) => {
        const p = s.wins / s.n, se = Math.sqrt(p * (1 - p) / s.n), lo = Math.max(0, p - 1.96 * se), hi = Math.min(1, p + 1.96 * se);
        return `${big('樣本勝率', pct(p))}
          <div class="ci-bar"><div class="ci-range" style="left:${lo * 100}%;width:${(hi - lo) * 100}%"></div><div class="ci-dot" style="left:${p * 100}%"></div><em style="left:0">0%</em><em style="left:50%">50%</em><em style="left:100%">100%</em></div>
          <div class="stats">${stat('標準誤差 SE', pct(se, 2))}${stat('95% 區間（簡化）', pct(lo) + ' – ' + pct(hi))}</div>
          <p class="tool-fine">簡化二項近似，假設每筆獨立。試吓將總筆數改成 30、300，睇區間點變。</p>`;
      },
    }),
  };

  /* ---------------- Monte Carlo ---------------- */
  TOOLS['monte-carlo'] = {
    title: 'Monte Carlo 權益曲線模擬', icon: '🎰', cat: '統計與期望值', level: 'l5',
    desc: '同一套正期望值策略，隨機排列之後可以有幾大回撤同連敗？',
    render(el, ctx) {
      const d = { wr: 40, win: 2, loss: 1, cost: 0.1, n: 100, runs: 200 };
      const s = ctx.load(Object.assign({}, d));
      const f = (k, l, st) => `<label class="fld"><span>${l}</span><input type="number" step="${st}" data-k="${k}" value="${s[k]}"></label>`;
      el.innerHTML = `<p class="tool-note">假設每筆結果獨立、隨機，純粹用嚟感受「運氣」對路徑嘅影響。</p>
        <div class="tool-grid">${f('wr', '勝率 %', 1)}${f('win', '平均贏 R', 0.1)}${f('loss', '平均輸 R', 0.1)}${f('cost', '每筆成本 R', 0.01)}${f('n', '每條路徑交易數', 10)}${f('runs', '模擬次數', 50)}</div>
        <div class="tool-foot"><button class="btn sm primary" data-run>🎲 再模擬一次</button></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const run = () => {
        const n = Math.min(1000, Math.max(10, Math.round(s.n))), runs = Math.min(2000, Math.max(20, Math.round(s.runs))), p = s.wr / 100;
        const finals = [], dds = [], streaks = [], show = [];
        for (let k = 0; k < runs; k++) {
          let eq = 0, peak = 0, mdd = 0, st = 0, ms = 0; const curve = [0];
          for (let i = 0; i < n; i++) {
            const r = (Math.random() < p ? s.win : -s.loss) - s.cost;
            eq += r; peak = Math.max(peak, eq); mdd = Math.max(mdd, peak - eq); st = r < 0 ? st + 1 : 0; ms = Math.max(ms, st);
            if (k < 25) curve.push(eq);
          }
          finals.push(eq); dds.push(mdd); streaks.push(ms); if (k < 25) show.push(curve);
        }
        const q = (arr, x) => { const a = arr.slice().sort((m, n2) => m - n2); return a[Math.min(a.length - 1, Math.floor(x * a.length))]; };
        const exp = p * s.win - (1 - p) * s.loss - s.cost;
        out.innerHTML = `<div class="stats">
          ${stat('理論期望值 / 筆', signR(exp, 3), exp >= 0 ? 'pos' : 'neg')}
          ${stat('最終結果（中位數）', signR(q(finals, 0.5), 1))}
          ${stat('最差 5% 路徑', signR(q(finals, 0.05), 1), 'neg')}
          ${stat('最好 5% 路徑', signR(q(finals, 0.95), 1), 'pos')}
          ${stat('最大回撤（中位數）', '−' + F(q(dds, 0.5), 1) + 'R', 'neg')}
          ${stat('最大回撤（最差 5%）', '−' + F(q(dds, 0.95), 1) + 'R', 'neg')}
          ${stat('最長連敗（中位數）', q(streaks, 0.5) + ' 筆')}
          ${stat('最終蝕錢嘅路徑', pct(finals.filter((x) => x < 0).length / runs, 0))}
          </div><div data-chart></div>
          <p class="tool-fine">每條線係同一套策略嘅一種可能結果。理論正期望值，都可以有好長時間喺水底。</p>`;
        Charts.line(out.querySelector('[data-chart]'), { series: show.map((c) => ({ data: c, color: 'var(--accent)', width: 1.2, opacity: 0.35 })), ref: 0, height: 260, format: (v) => v.toFixed(0) + 'R', title: `${show.length} 條隨機路徑（每條 ${n} 筆）` });
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('change', () => { s[i.dataset.k] = parseFloat(i.value); ctx.save(s); run(); }));
      el.querySelector('[data-run]').addEventListener('click', run);
      run();
    },
  };

  /* ---------------- 入場時知唔知道？ ---------------- */
  TOOLS['knowable'] = {
    title: '小遊戲：09:45 入場時知唔知道？', icon: '🕵️', cat: '數據與指標', level: 'l5',
    desc: '分辨邊啲資料可以用嚟做入場判斷，邊啲係偷睇未來。',
    render(el) {
      const items = [
        ['15m 最近已確認 HH + HL', true], ['今日最終最高價', false], ['09:40 嘅 Session VWAP', true], ['今日收市係大陽燭', false],
        ['前日最高價 PDH', true], ['今日全日總成交量', false], ['盤前最高價 PMH', true], ['09:45 呢支 5m K 線嘅收市價（09:45 嗰刻）', false],
        ['過去十日 09:40 時段平均成交量', true], ['一個要右邊 5 支 15m K 線確認、10:30 先確認嘅 Pivot', false], ['前 15 分鐘 Opening Range High', true], ['全日最終 VWAP', false],
      ];
      let score = 0, done = 0;
      el.innerHTML = `<p class="tool-note">而家係美東 09:45，你準備決定入唔入場。以下每項資料，你「當時」知唔知道？</p><div class="kn-list">${items.map((it, i) => `<div class="kn-item" data-i="${i}"><span>${it[0]}</span><div><button class="btn sm" data-a="1">✅ 知道</button><button class="btn sm" data-a="0">❌ 未知</button></div></div>`).join('')}</div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      el.querySelectorAll('.kn-item').forEach((row) => {
        row.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
          if (row.classList.contains('answered')) return;
          const ok = (b.dataset.a === '1') === items[row.dataset.i][1];
          row.classList.add('answered', ok ? 'right' : 'wrong'); done++; if (ok) score++;
          row.querySelector('div').innerHTML = `<b>${ok ? '答啱' : '答錯'}</b>：${items[row.dataset.i][1] ? '當時已知' : '當時未知（用咗就係 Look-ahead Bias）'}`;
          if (done === items.length) out.innerHTML = verdict(score >= 10, `得分 ${score} / ${items.length}`);
        }));
      });
    },
  };

  /* ---------------- Overfitting 示範 ---------------- */
  TOOLS['overfit-demo'] = {
    title: 'Overfitting 示範：冇 Edge 都可以「揀」到靚結果', icon: '🎩', cat: '統計與期望值', level: 'l5',
    desc: '27 個參數組合全部係零期望值嘅隨機策略，睇吓「最好」嗰個喺樣本外會點。',
    render(el) {
      el.innerHTML = `<p class="tool-note">每個組合都係同一個「擲骰」策略：1/3 機會 +2R、2/3 機會 −1R（理論期望值 = 0）。每個組合用 60 筆樣本內交易計結果，然後再用 60 筆全新樣本外交易測試。</p>
        <div class="tool-foot"><button class="btn sm primary" data-run>🎲 再做一次</button></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const run = () => {
        const one = () => (Math.random() < 1 / 3 ? 2 : -1);
        const exp = (n) => { let t = 0; for (let i = 0; i < n; i++) t += one(); return t / n; };
        const rv = [1.0, 1.5, 2.0], rw = [3, 6, 9], tg = ['1.5R', '2R', '2.5R'];
        const combos = [];
        rv.forEach((a) => rw.forEach((b) => tg.forEach((c) => combos.push({ name: `RVOL ${a} / Retest ${b} / ${c}`, is: exp(60) }))));
        combos.sort((x, y) => y.is - x.is);
        const best = combos[0]; best.oos = exp(60);
        out.innerHTML = `<div class="compare"><div class="cmp-col"><h5>樣本內最好組合</h5><p class="muted">${best.name}</p>${stat('In-Sample Expectancy', signR(best.is, 3), 'pos')}</div><div class="cmp-arrow">→</div><div class="cmp-col"><h5>同一組合，樣本外</h5><p class="muted">全新 60 筆</p>${stat('Out-of-Sample Expectancy', signR(best.oos, 3), best.oos >= 0 ? 'pos' : 'neg')}</div></div>
          <div data-chart></div>
          ${verdict(null, '27 個組合其實全部冇 Edge，但「揀最好」總會揀到一個睇落好靚嘅。呢個就係 Selection Bias + Overfitting —— 所以一定要樣本外驗證。')}`;
        Charts.bars(out.querySelector('[data-chart]'), { labels: combos.map((_, i) => i + 1), values: combos.map((c) => +c.is.toFixed(2)), colors: combos.map((c, i) => (i === 0 ? 'var(--up)' : c.is >= 0 ? 'var(--accent)' : 'var(--down)')), format: (v) => (v > 0 ? '+' : '') + v, title: '27 個組合嘅樣本內 Expectancy（R，已排序）', height: 220 });
      };
      el.querySelector('[data-run]').addEventListener('click', run);
      run();
    },
  };

  /* ---------------- Compliance ---------------- */
  TOOLS['compliance'] = {
    title: '執行遵守率', icon: '✅', cat: '計劃與規則', level: 'l5',
    desc: '有效訊號入面，有幾多次真係按規則完成？',
    render: simpleTool({
      defaults: { ok: 30, missed: 4, late: 3, wrongType: 2, cancelStop: 1 },
      fields: [{ k: 'ok', label: '按規則完成', step: 1 }, { k: 'missed', label: '錯過', step: 1 }, { k: 'late', label: '入場太遲', step: 1 }, { k: 'wrongType', label: '下錯訂單類型', step: 1 }, { k: 'cancelStop', label: '意外取消 Stop', step: 1 }],
      compute: (s) => {
        const total = s.ok + s.missed + s.late + s.wrongType + s.cancelStop, c = s.ok / total;
        return `${big('Compliance', pct(c, 0), `（${s.ok} / ${total}）`, c >= 0.9 ? 'pos' : c < 0.75 ? 'neg' : '')}<div data-chart></div>`;
      },
      after: (out, s) => Charts.bars(out.querySelector('[data-chart]'), { labels: ['完成', '錯過', '太遲', '錯單', '冇 Stop'], values: [s.ok, s.missed, s.late, s.wrongType, s.cancelStop], colors: ['var(--up)', 'var(--warn)', 'var(--warn)', 'var(--down)', 'var(--down)'], height: 180 }),
    }),
  };

  /* ---------------- 時區 ---------------- */
  TOOLS['timezone'] = {
    title: '美股時間換算', icon: '🕰️', cat: '數據與指標', level: 'l0',
    desc: '而家美東幾點？開市收市係你當地幾點？',
    render(el) {
      const zones = [['America/New_York', '紐約（ET）'], ['America/Toronto', '多倫多'], ['America/Vancouver', '溫哥華'], ['Asia/Hong_Kong', '香港'], ['Europe/London', '倫敦']];
      const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!zones.some((z) => z[0] === local)) zones.push([local, '你部機（' + local + '）']);
      el.innerHTML = '<div class="tool-out"></div>';
      const out = el.querySelector('.tool-out');
      const fmt = (d, tz) => new Intl.DateTimeFormat('zh-HK', { timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).format(d);
      const etParts = (d) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false }).formatToParts(d); const g = (t) => (p.find((x) => x.type === t) || {}).value; return { h: +g('hour') % 24, m: +g('minute'), wd: g('weekday') }; };
      // 用今日 ET 09:30 / 16:00 換算
      const etToDate = (hh, mm) => {
        const now = new Date();
        const e = etParts(now);
        const diffMin = (hh * 60 + mm) - (e.h * 60 + e.m);
        return new Date(now.getTime() + diffMin * 60000);
      };
      const tick = () => {
        const now = new Date(); const e = etParts(now);
        const mins = e.h * 60 + e.m, weekend = e.wd === 'Sat' || e.wd === 'Sun';
        let status = '休市';
        if (!weekend) { if (mins >= 570 && mins < 960) status = '🟢 正常時段（RTH）進行中'; else if (mins >= 240 && mins < 570) status = '🟡 盤前'; else if (mins >= 960 && mins < 1200) status = '🟠 盤後'; else status = '⚪ 休市'; }
        else status = '⚪ 週末休市';
        const open = etToDate(9, 30), close = etToDate(16, 0);
        out.innerHTML = `${big('美東時間', fmt(now, 'America/New_York'), status)}
          <table class="tbl"><thead><tr><th>地點</th><th>而家</th><th>今日 RTH 開市</th><th>收市</th></tr></thead><tbody>
          ${zones.map(([tz, n]) => `<tr><td>${n}</td><td>${fmt(now, tz)}</td><td>${fmt(open, tz)}</td><td>${fmt(close, tz)}</td></tr>`).join('')}</tbody></table>
          <p class="tool-fine">未計美國假期同提早收市日。夏令時間轉換期間，各地時差會變。</p>`;
      };
      tick();
      const t = setInterval(() => { if (!document.body.contains(el)) clearInterval(t); else tick(); }, 30000);
    },
  };

  /* ---------------- K 線砌圖器 ---------------- */
  function classify(o, h, l, c) {
    const range = h - l; if (range <= 0) return { name: '（冇波幅）', why: '' };
    const body = Math.abs(c - o), up = h - Math.max(o, c), lo = Math.min(o, c) - l;
    const b = body / range;
    if (b < 0.1) return { name: 'Doji 十字星', why: '實體少過全幅 10%：買賣雙方猶豫。' };
    if (b > 0.9) return { name: c > o ? '綠色 Marubozu' : '紅色 Marubozu', why: '幾乎冇影線：一面倒，動力強。' };
    if (lo >= 2 * body && up <= body * 0.6) return { name: 'Hammer 錘頭' + (c < o ? '（紅身）' : ''), why: '長下影線 ≥ 實體兩倍、上影線好短：曾經大跌但被買返上嚟。' };
    if (up >= 2 * body && lo <= body * 0.6) return { name: 'Shooting Star 射擊之星' + (c > o ? '（綠身）' : ''), why: '長上影線 ≥ 實體兩倍、下影線好短：曾經大升但被賣返落嚟。' };
    if (up > body && lo > body) return { name: 'Spinning Top 陀螺', why: '上下影線都長、實體細：方向未明。' };
    return { name: c >= o ? '普通綠燭' : '普通紅燭', why: c >= o ? '收市高過開市。' : '收市低過開市。' };
  }
  TOOLS['candle-builder'] = {
    title: 'K 線砌圖器', icon: '🕯️', cat: '數據與指標', level: 'l0',
    desc: '拉滑桿改 OHLC，即時睇 K 線形狀同形態名稱。',
    render(el, ctx) {
      const d = { o: 100.6, h: 101.0, l: 98.2, c: 100.9 };
      const s = ctx.load(Object.assign({}, d));
      const r = (k, l) => `<label class="fld range"><span>${l}：<b data-show="${k}">${F(s[k])}</b></span><input type="range" min="97" max="104" step="0.05" data-k="${k}" value="${s[k]}"></label>`;
      el.innerHTML = `<div class="cb-wrap"><div class="cb-chart"></div><div class="cb-ctrl">${r('o', 'Open')}${r('h', 'High')}${r('l', 'Low')}${r('c', 'Close')}
        <div class="chips">${[['Hammer', [100.6, 101, 98.2, 100.9]], ['Shooting Star', [100.5, 103.2, 100.2, 100.3]], ['Doji', [100.5, 101.8, 99.2, 100.52]], ['Marubozu', [99, 102.4, 98.98, 102.38]]].map(([n, v]) => `<button class="chip btn-chip" data-preset="${v.join(',')}">${n}</button>`).join('')}</div></div></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out');
      const update = () => {
        // 保持 OHLC 合理
        const h = Math.max(s.h, s.o, s.c), l = Math.min(s.l, s.o, s.c);
        const Y = (v) => 12 + (104 - v) / 7 * 236, up = s.c >= s.o, col = up ? 'var(--up)' : 'var(--down)';
        const near = Math.abs(Y(s.o) - Y(s.c)) < 14, nud = (t, v) => (!near ? 0 : (t === 'O') === (s.o >= s.c) ? -7 : 7);
        const lab = (v, t, side) => `<text x="${side === 'l' ? 8 : 192}" y="${Y(v) + 4 + (side === 'r' ? nud(t, v) : 0)}" text-anchor="${side === 'l' ? 'start' : 'end'}">${t} ${F(v)}</text><line x1="${side === 'l' ? 58 : 122}" x2="${side === 'l' ? 78 : 142}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--border)" stroke-dasharray="3 3"/>`;
        el.querySelector('.cb-chart').innerHTML = `<svg class="cb-svg" viewBox="0 0 200 260" role="img" aria-label="K 線">
          ${lab(h, 'H', 'l')}${lab(l, 'L', 'l')}${lab(s.o, 'O', 'r')}${lab(s.c, 'C', 'r')}
          <line x1="100" x2="100" y1="${Y(h)}" y2="${Y(l)}" stroke="${col}" stroke-width="3"/>
          <rect x="80" width="40" y="${Y(Math.max(s.o, s.c))}" height="${Math.max(2, Y(Math.min(s.o, s.c)) - Y(Math.max(s.o, s.c)))}" fill="${col}" rx="3"/></svg>`;
        const k = classify(s.o, h, l, s.c), range = h - l;
        out.innerHTML = `${big('形態', k.name)}<p>${k.why}</p><div class="stats">${stat('實體佔全幅', pct(Math.abs(s.c - s.o) / range, 0))}${stat('上影線', F(h - Math.max(s.o, s.c)))}${stat('下影線', F(Math.min(s.o, s.c) - l))}${stat('CLV', range > 0 ? F((2 * s.c - h - l) / range) : '—')}</div><p class="tool-fine">提醒：形態要配合位置同後續確認先有意義。</p>`;
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = parseFloat(i.value); el.querySelector(`[data-show="${i.dataset.k}"]`).textContent = F(s[i.dataset.k]); ctx.save(s); update(); }));
      el.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { const [o, h, l, c] = b.dataset.preset.split(',').map(Number); Object.assign(s, { o, h, l, c }); ctx.save(s); TOOLS['candle-builder'].render(el, ctx); }));
      update();
    },
  };

  /* ---------------- CSV 數據檢查器 ---------------- */
  function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((x) => x.trim());
    if (!lines.length) return { head: [], rows: [] };
    const delim = (lines[0].match(/\t/g) || []).length > (lines[0].match(/,/g) || []).length ? '\t' : (lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',');
    const split = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
    const head = split(lines[0]).map((h) => h.toLowerCase());
    return { head, rows: lines.slice(1).map(split) };
  }
  const ET = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  function toET(v, dateV) {
    let d;
    if (dateV != null && dateV !== '') {
      // 分開嘅 Date 同 Time 欄，假設已經係 ET
      const t = String(v).trim().padStart(5, '0');
      return { date: String(dateV).trim(), time: t.slice(0, 5) };
    }
    if (/^\d{9,13}$/.test(String(v).trim())) { const n = +v; d = new Date(n < 1e12 ? n * 1000 : n); }
    else if (/[zZ]|[+-]\d\d:?\d\d$/.test(String(v).trim())) d = new Date(v);
    else {
      // 冇時區資料：當係 ET
      const m = String(v).trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
      if (m) return { date: m[1], time: m[2].padStart(2, '0') + ':' + m[3] };
      d = new Date(v);
    }
    if (isNaN(d)) return null;
    const p = ET.formatToParts(d); const g = (t) => (p.find((x) => x.type === t) || {}).value;
    return { date: `${g('year')}-${g('month')}-${g('day')}`, time: `${String(+g('hour') % 24).padStart(2, '0')}:${g('minute')}` };
  }
  function sampleCSV() {
    const closes = []; let p = 384; const rnd = Charts.mulberry32(99);
    for (let i = 0; i < 78; i++) { p += (rnd() - 0.48) * 0.9; closes.push(+p.toFixed(2)); }
    const bars = Charts.genBars(closes, { seed: 99, open: 384, start: '09:30', baseVol: 1 });
    let csv = 'date,time,open,high,low,close,volume\n';
    bars.forEach((b, i) => { if (i === 40) return; csv += `2026-09-18,${b.t},${b.o},${b.h},${b.l},${b.c},${Math.round(b.v * 1e6 * (i < 6 ? 2 : 1))}\n`; });
    return csv + '2026-09-18,10:00,385.1,384.9,385.3,385.0,500000\n';
  }
  TOOLS['csv-checker'] = {
    title: 'CSV 數據檢查器（5m OHLCV）', icon: '🧹', cat: '數據與指標', level: 'l5',
    desc: '貼上或上載 TradingView 匯出嘅 CSV：檢查數據質素、每日 K 線數，逐支計 Session VWAP 同 CLV。',
    render(el) {
      el.innerHTML = `<p class="tool-note">支援欄位：time（Unix 秒或日期時間）或 date + time，加 open、high、low、close、volume。所有處理都喺你部機進行，唔會上載去任何地方。</p>
        <div class="tool-foot"><label class="btn sm">📂 揀 CSV 檔<input type="file" accept=".csv,.txt,text/csv" hidden data-file></label><button class="btn ghost sm" data-sample>載入模擬示例（有故意放嘅錯誤）</button><label class="chk"><input type="checkbox" data-rth checked> 只保留 RTH（09:30–15:55 開始嘅 K 線）</label></div>
        <textarea rows="5" class="csv-in" placeholder="或者喺度貼上 CSV 內容…" data-text></textarea>
        <div class="tool-foot"><button class="btn sm primary" data-go>🔍 開始檢查</button></div><div class="tool-out"></div>`;
      const out = el.querySelector('.tool-out'), ta = el.querySelector('[data-text]');
      el.querySelector('[data-file]').addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = r.result; go(); }; r.readAsText(f); });
      el.querySelector('[data-sample]').addEventListener('click', () => { ta.value = sampleCSV(); go(); });
      el.querySelector('[data-go]').addEventListener('click', () => go());
      let processed = [];
      function go() {
        const { head, rows } = parseCSV(ta.value);
        const idx = (names) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
        const iT = idx(['time', 'datetime', 'timestamp']), iD = idx(['date']), iO = idx(['open']), iH = idx(['high']), iL = idx(['low']), iC = idx(['close']), iV = idx(['volume', 'vol']);
        if (iT < 0 || iO < 0 || iH < 0 || iL < 0 || iC < 0) { out.innerHTML = verdict(false, '搵唔到必要欄位（time/open/high/low/close）。'); return; }
        const issues = []; const bars = [];
        rows.forEach((r, n) => {
          const tt = toET(r[iT], iD >= 0 && iD !== iT ? r[iD] : null);
          const o = +r[iO], h = +r[iH], l = +r[iL], c = +r[iC], v = iV >= 0 ? +r[iV] : NaN;
          if (!tt || [o, h, l, c].some((x) => !isFinite(x))) { issues.push([n + 2, '無法讀取時間或價格']); return; }
          bars.push({ line: n + 2, date: tt.date, time: tt.time, o, h, l, c, v });
        });
        const rthOnly = el.querySelector('[data-rth]').checked;
        const inRTH = (t) => t >= '09:30' && t <= '15:55';
        const use = rthOnly ? bars.filter((b) => inRTH(b.time)) : bars;
        const byDay = {};
        use.forEach((b) => (byDay[b.date] = byDay[b.date] || []).push(b));
        const dayRows = [];
        processed = [];
        Object.keys(byDay).sort().forEach((day) => {
          const list = byDay[day];
          const sorted = list.slice().sort((a, b) => (a.time < b.time ? -1 : 1));
          if (sorted.some((b, i) => b !== list[i])) issues.push([list[0].line, `${day}：時間次序唔啱（已自動排序分析）`]);
          const seen = new Set(); let pv = 0, vv = 0, missing = 0;
          sorted.forEach((b, i) => {
            if (seen.has(b.time)) issues.push([b.line, `${day} ${b.time}：重複時間戳`]); seen.add(b.time);
            if (b.h < Math.max(b.o, b.c, b.l)) issues.push([b.line, `${day} ${b.time}：High 低過 Open/Close/Low`]);
            if (b.l > Math.min(b.o, b.c, b.h)) issues.push([b.line, `${day} ${b.time}：Low 高過 Open/Close/High`]);
            if (isFinite(b.v) && b.v < 0) issues.push([b.line, `${day} ${b.time}：負數成交量`]);
            if (isFinite(b.v) && b.v === 0) issues.push([b.line, `${day} ${b.time}：零成交量`]);
            if (i > 0) {
              const [h1, m1] = sorted[i - 1].time.split(':').map(Number), [h2, m2] = b.time.split(':').map(Number);
              const gap = (h2 * 60 + m2) - (h1 * 60 + m1);
              if (gap > 5) { missing += gap / 5 - 1; issues.push([b.line, `${day}：${sorted[i - 1].time} 同 ${b.time} 之間缺咗 ${gap / 5 - 1} 支`]); }
            }
            const tp = (b.h + b.l + b.c) / 3, vol = isFinite(b.v) ? b.v : 0; pv += tp * vol; vv += vol;
            b.vwap = vv ? pv / vv : NaN; b.clv = b.h > b.l ? (2 * b.c - b.h - b.l) / (b.h - b.l) : NaN;
            processed.push(b);
          });
          dayRows.push({ day, n: sorted.length, missing, bars: sorted });
        });
        out.innerHTML = `<div class="stats">${stat('讀到 K 線', bars.length)}${stat('分析中（' + (rthOnly ? 'RTH' : '全部') + '）', use.length)}${stat('交易日', dayRows.length)}${stat('問題', issues.length, issues.length ? 'neg' : 'pos')}</div>
          <table class="tbl"><thead><tr><th>日期（ET）</th><th>K 線數</th><th>狀態</th><th></th></tr></thead><tbody>
          ${dayRows.map((d, i) => `<tr><td>${d.day}</td><td>${d.n}</td><td>${rthOnly ? (d.n === 78 ? '✅ 完整 78 支' : d.n < 78 ? `⚠️ 少咗 ${78 - d.n} 支（提早收市？缺漏？）` : '⚠️ 多過 78 支') : '—'}</td><td><button class="btn ghost sm" data-day="${i}">睇圖</button></td></tr>`).join('')}</tbody></table>
          ${issues.length ? `<details ${issues.length < 15 ? 'open' : ''}><summary>問題清單（${issues.length}）</summary><ul class="issues">${issues.slice(0, 300).map(([ln, m]) => `<li><code>第 ${ln} 行</code> ${esc(m)}</li>`).join('')}</ul></details>` : verdict(true, '冇發現基本數據問題。')}
          <div data-daychart></div>
          <div class="tool-foot"><button class="btn sm" data-dl>⬇️ 下載整理後 CSV（含 VWAP、CLV）</button></div>
          <p class="tool-fine">缺漏 K 線唔會自動補上 —— 亂補會製造唔存在嘅訊號。</p>`;
        const showDay = (i) => {
          const d = dayRows[i]; if (!d) return;
          Charts.candles(out.querySelector('[data-daychart]'), { bars: d.bars.map((b) => ({ t: b.time, o: b.o, h: b.h, l: b.l, c: b.c, v: isFinite(b.v) ? +(b.v / 1e6).toFixed(2) : 0 })), vwap: d.bars.map((b) => b.vwap), height: 280, title: d.day + '（ET）', caption: '橙色線係逐支累積嘅 Session VWAP。' });
        };
        out.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => showDay(+b.dataset.day)));
        if (dayRows.length) showDay(0);
        out.querySelector('[data-dl]').addEventListener('click', () => {
          let csv = 'date_et,time_et,open,high,low,close,volume,session_vwap,clv\n';
          processed.forEach((b) => (csv += [b.date, b.time, b.o, b.h, b.l, b.c, isFinite(b.v) ? b.v : '', isFinite(b.vwap) ? b.vwap.toFixed(4) : '', isFinite(b.clv) ? b.clv.toFixed(4) : ''].join(',') + '\n'));
          App.download('tsla_5m_checked.csv', csv, 'text/csv');
        });
      }
    },
  };

  /* ---------------- Zone 畫法工具 ---------------- */
  TOOLS['zone-builder'] = {
    title: 'S/R Zone 畫法工具（Body + Wick）', icon: '📐', cat: '數據與指標', level: 'qa',
    desc: '輸入幾次測試嘅影線極值同實體邊緣，自動分出核心區、影線試探區同獨立極端位。',
    render(el, ctx) {
      const d = { type: 'res', tol: 0.40, rows: [[346.50, 346.05], [346.35, 346.10], [346.60, 346.00], [347.80, 346.20]] };
      const s = ctx.load(JSON.parse(JSON.stringify(d)));
      el.innerHTML = `<p class="tool-note">每一行係價格一次測試：Resistance 填「High（影線）」同「Body 上緣（開／收較高者）」；Support 填「Low（影線）」同「Body 下緣」。</p>
        <div class="tool-grid"><label class="fld"><span>類型</span><select data-k="type"><option value="res" ${s.type === 'res' ? 'selected' : ''}>Resistance 阻力</option><option value="sup" ${s.type === 'sup' ? 'selected' : ''}>Support 支持</option></select></label>
        <label class="fld"><span>影線聚集容差（$）</span><input type="number" step="0.05" data-k="tol" value="${s.tol}"></label></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th data-h1></th><th data-h2></th><th></th></tr></thead><tbody></tbody></table></div>
        <div class="tool-foot"><button class="btn sm" data-add>＋ 加一次測試</button><button class="btn ghost sm" data-reset>↺ 示例</button></div><div class="tool-out"></div>`;
      const tb = el.querySelector('tbody'), out = el.querySelector('.tool-out');
      const update = () => {
        const res = s.type === 'res';
        el.querySelector('[data-h1]').textContent = res ? 'High（影線）' : 'Low（影線）';
        el.querySelector('[data-h2]').textContent = res ? 'Body 上緣' : 'Body 下緣';
        tb.innerHTML = s.rows.map((r, i) => `<tr><td>${i + 1}</td><td><input type="number" step="0.01" data-r="${i}" data-c="0" value="${r[0]}"></td><td><input type="number" step="0.01" data-r="${i}" data-c="1" value="${r[1]}"></td><td><button class="x" data-del="${i}">×</button></td></tr>`).join('');
        const rows = s.rows.filter((r) => isFinite(r[0]) && isFinite(r[1]));
        if (rows.length < 2) { out.innerHTML = verdict(null, '最少要兩次測試先可以講係「Zone」。'); bind(); return; }
        const wicks = rows.map((r) => r[0]).sort((a, b) => a - b);
        const med = wicks[Math.floor(wicks.length / 2)];
        const inC = rows.filter((r) => Math.abs(r[0] - med) <= s.tol);
        const outl = rows.filter((r) => Math.abs(r[0] - med) > s.tol);
        const bodies = inC.map((r) => r[1]);
        const coreLo = Math.min(...bodies), coreHi = Math.max(...bodies);
        const cw = inC.map((r) => r[0]);
        const zLo = res ? coreLo : Math.min(...cw), zHi = res ? Math.max(...cw) : coreHi;
        const all = rows.flat().concat([zLo, zHi]);
        const lo = Math.min(...all) - 0.15, hi = Math.max(...all) + 0.15;
        const Y = (v) => 10 + (hi - v) / (hi - lo) * 200;
        const svg = `<svg viewBox="0 0 600 220" class="chart-svg" role="img" aria-label="Zone 示意">
          <rect x="0" y="${Y(zHi)}" width="600" height="${Math.max(2, Y(zLo) - Y(zHi))}" style="fill:var(--warn);opacity:.15"/>
          <rect x="0" y="${Y(coreHi)}" width="600" height="${Math.max(3, Y(coreLo) - Y(coreHi))}" style="fill:var(--accent);opacity:.35"/>
          ${rows.map((r, i) => { const x = 60 + i * (480 / Math.max(1, rows.length - 1)); const o = outl.includes(r); return `<line x1="${x}" x2="${x}" y1="${Y(r[0])}" y2="${Y(r[1])}" stroke="${o ? 'var(--down)' : 'var(--muted)'}" stroke-width="3"/><rect x="${x - 12}" y="${res ? Y(r[1]) : Y(r[1]) - 30}" width="24" height="30" rx="3" style="fill:${o ? 'var(--down)' : 'var(--up)'};opacity:.8"/><text x="${x + 16}" y="${Y(r[0]) + 4}" class="axis">${F(r[0])}${o ? ' 極端' : ''}</text>`; }).join('')}
          <text x="6" y="${Y(coreHi) - 4}" class="axis">核心 ${F(coreLo)}–${F(coreHi)}</text></svg>`;
        out.innerHTML = `${big(res ? '候選 Resistance Zone' : '候選 Support Zone', `$${F(zLo)}–${F(zHi)}`, `闊 $${F(zHi - zLo)}`)}
          <div class="stats">${stat('Body 核心區', `$${F(coreLo)}–${F(coreHi)}`)}${stat('影線試探區', res ? `$${F(coreHi)}–${F(zHi)}` : `$${F(zLo)}–${F(coreLo)}`)}${stat('計入 Zone 嘅測試', inC.length + ' 次')}</div>
          <figure class="chart">${svg}<figcaption>藍 = Body 核心；橙 = Wick 試探；紅 = 獨立極端位（唔包入 Zone）。</figcaption></figure>
          ${outl.length ? verdict(null, `獨立極端參考：${outl.map((r) => '$' + F(r[0])).join('、')} —— 離其他試探太遠，當成另一個參考位，唔好硬將 Zone 拉闊。`) : ''}
          ${inC.length < 2 ? verdict(false, '聚集嘅測試少過兩次，呢個 Zone 證據唔夠，等更多價格反應驗證。') : ''}
          <p class="tool-fine">簡化工具：以影線中位數 ± 容差判斷聚集。真實畫線仲要考慮時間框架、波幅同反應強弱。PDH / PDL、Swing High / Low 就直接用影線極值。</p>`;
        bind();
      };
      const bind = () => {
        tb.querySelectorAll('input').forEach((i) => i.addEventListener('change', () => { s.rows[i.dataset.r][i.dataset.c] = parseFloat(i.value); ctx.save(s); update(); }));
        tb.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { s.rows.splice(+b.dataset.del, 1); ctx.save(s); update(); }));
      };
      el.querySelectorAll('[data-k]').forEach((i) => i.addEventListener('input', () => { s[i.dataset.k] = i.tagName === 'SELECT' ? i.value : parseFloat(i.value); ctx.save(s); update(); }));
      el.querySelector('[data-add]').addEventListener('click', () => { const l = s.rows[s.rows.length - 1] || [100, 99.8]; s.rows.push([l[0], l[1]]); ctx.save(s); update(); });
      el.querySelector('[data-reset]').addEventListener('click', () => { const n = JSON.parse(JSON.stringify(d)); Object.assign(s, n); ctx.save(s); TOOLS['zone-builder'].render(el, ctx); });
      update();
    },
  };

  /* ---------------- 冇 Entry 診斷器 ---------------- */
  TOOLS['no-entry'] = {
    title: '「點解冇 Entry？」診斷器', icon: '🩺', cat: '計劃與規則', level: 'qa',
    desc: 'Replay 完一日搵唔到入場位？逐步答幾條問題，分清係冇 Setup、R:R 唔合理，定係錯過咗。',
    render(el) {
      const Q = [
        ['開市前有冇用「當刻已知資料」畫好 S/R、PDH / PDL？', '先改善準備：冇事前畫好水平，就好難客觀判斷 Breakout。下次開市前先畫，並記低畫線時間。', 'prep'],
        ['有冇一支「已完成」K 線收市突破你事前畫好嘅阻力？', '結果 1：完全冇 Breakout —— 市場冇提供你練緊嘅 Setup，No Trade 係正確結果。', 'r1'],
        ['突破後，喺你規定嘅期限內有冇回測舊阻力區？', '結果 2：有 Breakout 但冇 Retest —— 強勢直接走咗，接受錯過；追突破係另一套策略。', 'r2'],
        ['回測之後，有冇出現你規定嘅向上確認（例如收喺 Zone 上方 + 收近高位）？', '結果 3：有 Retest 但冇 Confirmation —— 繼續等待係合理。', 'r3'],
        ['用「確認之後實際可得」嘅入場價計，到下一個阻力有冇達到你嘅最低 R:R？', '結果 4：有 Confirmation 但 R:R 不合理 —— Skip 係正確執行（例如 16 號例子只有 0.94R）。', 'r4'],
        ['價格有冇真係觸發你預設嘅 Entry Trigger？', '結果 5：有完整 Setup 但冇觸發 —— 冇成交就唔計交易，照樣記入候選紀錄。', 'r5'],
        ['你當時有冇按規則落單？', '❗ 錯過咗符合條件嘅機會：記錄原因（遲咗見到？猶豫？冇準備好訂單？），呢個先係需要改善嘅執行問題。', 'miss'],
      ];
      let i = 0; const path = [];
      const draw = () => {
        if (i >= Q.length) {
          el.innerHTML = `${verdict(true, '✅ 有完整 Setup、有觸發、亦有跟規則入場 —— 呢筆應該已經喺交易日誌。記得填埋檢討。')}${trail()}<div class="tool-foot"><a class="btn sm primary" href="#/journal/trades">📒 去交易紀錄</a><button class="btn ghost sm" data-restart>↺ 再診斷</button></div>`;
        } else {
          el.innerHTML = `<p class="tool-note">第 ${i + 1} 步</p><p class="rp-q"><b>${Q[i][0]}</b></p><div class="rp-nav" style="justify-content:flex-start"><button class="btn primary" data-y>有 ✓</button><button class="btn" data-n>冇 ✗</button>${i ? '<button class="btn ghost sm" data-back>‹ 上一步</button>' : ''}</div>${trail()}`;
          el.querySelector('[data-y]').addEventListener('click', () => { path.push([i, true]); i++; draw(); });
          el.querySelector('[data-n]').addEventListener('click', () => {
            path.push([i, false]);
            const [, msg, code] = Q[i];
            el.innerHTML = `${verdict(code === 'miss' || code === 'prep' ? false : null, msg)}${trail()}<div class="tool-foot"><a class="btn sm primary" href="#/journal/replays">🔁 記錄落 Replay 日誌</a><button class="btn ghost sm" data-restart>↺ 再診斷</button></div>`;
            el.querySelector('[data-restart]').addEventListener('click', () => { i = 0; path.length = 0; draw(); });
          });
          const bk = el.querySelector('[data-back]'); if (bk) bk.addEventListener('click', () => { path.pop(); i--; draw(); });
        }
        const rs = el.querySelector('[data-restart]'); if (rs) rs.addEventListener('click', () => { i = 0; path.length = 0; draw(); });
      };
      const trail = () => (path.length ? `<ol class="trail">${path.map(([k, v]) => `<li>${esc(Q[k][0])} <b class="${v ? 'pos' : 'neg'}">${v ? '有' : '冇'}</b></li>`).join('')}</ol>` : '');
      draw();
    },
  };

  /* =========================================================
   * 內文小部件（唔係工具箱入面嘅工具）
   * ========================================================= */
  const WIDGETS = {
    funnel(el, arg) {
      const v = arg.split(',').map(Number);
      const names = ['Breakout Candidates', '出現 Retest', '完成 Confirmation', '觸發入場及模擬成交', '盈利交易'];
      el.innerHTML = `<figure class="chart funnel"><div class="chart-title">候選訊號漏斗（虛構例子）</div>${v.map((x, i) => `<div class="fn-row"><span>${names[i] || ''}</span><div class="fn-bar" style="width:${x / v[0] * 100}%"><b>${x}</b></div></div>`).join('')}<figcaption>只記成交交易，就睇唔到上面幾層流失咗幾多機會。</figcaption></figure>`;
    },
    equity(el, arg) {
      const v = arg.split(',').map(Number);
      Charts.line(el, { series: [{ data: v, color: 'var(--accent)', dots: true }], labels: v.map((_, i) => i), ref: v[0], height: 240, format: (x) => '$' + Math.round(x).toLocaleString(), title: '虛構策略 Equity Curve', caption: '示意 12 個交易階段，初始模擬資金 US$10,000，並非真實 TSLA 回測。' });
    },
    split(el, arg) {
      const [a, b, c] = arg.split(',').map(Number);
      el.innerHTML = `<figure class="chart"><div class="chart-title">時間先後分割資料（100 日例子）</div><div class="split-bar"><div class="sp train" style="flex:${a}">${a} 日<br><b>Train</b></div><div class="sp val" style="flex:${b}">${b} 日<br><b>Validate</b></div><div class="sp test" style="flex:${c}">${c} 日<br><b>Test</b></div></div><figcaption>按時間順序分割，而唔係將日子隨機打散。實際比例應按策略、資料量同市場環境決定。</figcaption></figure>`;
    },
    walkforward(el) {
      el.innerHTML = `<figure class="chart"><div class="chart-title">Walk-Forward：窗口隨時間向前移</div>${[0, 1, 2, 3].map((r) => `<div class="wf-row"><span>Round ${r + 1}</span><div class="wf-track"><div class="wf-train" style="left:${r * 14}%;width:42%">Train</div><div class="wf-test" style="left:${r * 14 + 42}%;width:14%">Test</div></div></div>`).join('')}<figcaption>只匯總每輪 Test 段（從未參與該輪調整）嘅結果。</figcaption></figure>`;
    },
    bracket(el) {
      el.innerHTML = `<figure class="chart bracket"><div class="br-parent"><small>Parent Order</small><b>BUY TSLA — 17 Shares</b><span>$386.10（示例）</span><em>Parent 成交後，相關 Exit Orders 按系統規則啟動</em></div><div class="br-lines"><i></i><i></i></div><div class="br-kids"><div class="br-kid tp"><small>Profit Taker</small><b>$388.90</b><span>Sell Limit</span></div><div class="br-kid sl"><small>Stop Loss</small><b>$384.70</b><span>Sell Stop</span></div></div><figcaption>一邊成交後，系統會嘗試取消另一邊（OCO）。仍要核對訂單狀態同部分成交。</figcaption></figure>`;
    },
    state(el) {
      const st = [['IDLE', '冇 Setup，繼續等待'], ['BREAKOUT DETECTED', '已有初步突破，啟動 Retest 等候期限'], ['WAIT RETEST', '等待回到預定價格區域'], ['WAIT CONFIRMATION', '回測出現，等向上確認'], ['ORDER PENDING', '已訂 Trigger、Stop、Target；等入場或者取消'], ['POSITION OPEN', '已成交，按固定規則管理'], ['EXIT / LOG', '平倉，記錄實際結果並返回 IDLE']];
      el.innerHTML = `<div class="state-list">${st.map((s, i) => `<div class="state-item"><span class="sn">${i + 1}</span><div><b>${s[0]}</b><small>${s[1]}</small></div></div>`).join('')}</div>`;
    },
  };

  window.TOOLS = TOOLS;
  window.WIDGETS = WIDGETS;
  window.ToolUtil = { F, money, pct, signR, esc, rStats, stat, big, verdict };
})();
