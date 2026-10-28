/* Level 9：VCP 波幅收縮形態（Volatility Contraction Pattern） */
window.COURSE = window.COURSE || [];
window.WIDGETS_EXTRA = window.WIDGETS_EXTRA || {};

(function () {
  const C = window.Charts;
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* 由一連串「去邊個價、用幾多支 K、成交量、雜訊」砌出 K 線；轉折點嘅高低位會準確等於指定價格 */
  function build(start, legs, seed, label) {
    const r = rng(seed), bars = [], ends = [];
    let prev = start, cur = start;
    legs.forEach(([to, k, vol, nz]) => {
      for (let j = 1; j <= k; j++) {
        const c = j === k ? to : cur + (to - cur) * j / k + (r() - 0.5) * nz;
        const o = prev + (r() - 0.5) * nz * 0.3;
        const w = Math.max(nz * 0.5, Math.abs(c - o) * 0.12);
        const n = bars.length + 1;
        bars.push({ t: label ? label(n) : '第' + n + '日', o, h: Math.max(o, c) + r() * w, l: Math.min(o, c) - r() * w, c, v: +(vol * (0.8 + r() * 0.4)).toFixed(2) });
        prev = c;
      }
      ends.push({ i: bars.length - 1, p: to, up: to > cur });
      cur = to;
    });
    // 轉折位：高位嗰邊唔可以有 K 線高過佢，低位嗰邊唔可以有 K 線低過佢
    ends.forEach((e, k) => {
      const next = ends[k + 1]; if (!next) return;
      const peak = e.up && !next.up, trough = !e.up && next.up;
      if (!peak && !trough) return;
      const from = k > 0 ? ends[k - 1].i + 1 : 0, to = next.i;
      for (let i = from; i <= to; i++) {
        const b = bars[i];
        if (peak) { b.h = Math.min(b.h, e.p); b.o = Math.min(b.o, e.p); b.c = Math.min(b.c, e.p); }
        else { b.l = Math.max(b.l, e.p); b.o = Math.max(b.o, e.p); b.c = Math.max(b.c, e.p); }
        b.h = Math.max(b.h, b.o, b.c); b.l = Math.min(b.l, b.o, b.c);
      }
      if (peak) bars[e.i].h = e.p; else bars[e.i].l = e.p;
    });
    bars.forEach((b) => ['o', 'h', 'l', 'c'].forEach((x) => (b[x] = +b[x].toFixed(2))));
    return { bars, ends };
  }

  const LABEL = {
    vcp: '健康 VCP 候選',
    lowerlow: '持續 Lower Low（唔係健康 VCP）',
    range: '普通 Range（冇逐步收縮）',
    downtrend: '有收縮，但原本係跌勢',
    loose: '收縮唔夠明顯（太鬆）',
    novol: '價格收窄，但成交量冇縮',
  };
  const pc = (x) => (x * 100).toFixed(1) + '%';

  /* 隨機生成一個「日線」形態，用嚟做訓練場同示範 */
  function make(type, seed) {
    const r = rng(seed || 1), u = (a, b) => a + (b - a) * r();
    const P = Math.round(u(60, 300));
    const nz = P * 0.006;
    let start, legs, depths;
    if (type === 'vcp' || type === 'novol') {
      const d1 = u(0.16, 0.26), d2 = d1 * u(0.42, 0.6), d3 = d2 * u(0.4, 0.6);
      const h2 = P * u(0.975, 0.99), h3 = h2 * u(0.99, 1.0);
      const fv = type === 'novol' ? [1.05, 1.3, 1.55] : [0.72, 0.48, 0.32];
      start = P * 0.72;
      legs = [[P, 14, 1.25, nz], [P * (1 - d1), 6, 1.35, nz], [h2, 6, 0.95, nz * 0.9], [h2 * (1 - d2), 4, fv[0], nz * 0.7], [h3, 4, fv[0] * 0.95, nz * 0.6], [h3 * (1 - d3), 3, fv[1], nz * 0.4], [h3 * 0.996, 3, fv[1], nz * 0.3], [h3 * 0.992, 3, fv[2], nz * 0.2]];
      depths = [d1, d2, d3];
    } else if (type === 'lowerlow') {
      start = P * 0.75;
      legs = [[P, 14, 1.2, nz], [P * 0.88, 5, 1.2, nz], [P * 0.95, 5, 1.0, nz], [P * 0.855, 4, 1.2, nz], [P * 0.9, 4, 1.1, nz], [P * 0.83, 3, 1.3, nz * 0.8], [P * 0.86, 3, 1.1, nz * 0.6], [P * 0.85, 3, 1.15, nz * 0.5]];
      depths = [0.12, 0.1, 0.078];
    } else if (type === 'range') {
      start = P * 0.78;
      legs = [[P, 12, 1.1, nz], [P * 0.9, 5, 1.0, nz], [P * 0.995, 5, 1.0, nz], [P * 0.9, 5, 1.0, nz], [P * 0.99, 5, 1.0, nz], [P * 0.905, 5, 1.05, nz], [P * 0.96, 4, 1.0, nz]];
      depths = [0.1, 0.0955, 0.086];
    } else if (type === 'downtrend') {
      start = P * 1.45;
      legs = [[P * 0.82, 14, 1.3, nz], [P * 0.9, 5, 1.0, nz], [P * 0.9 * 0.88, 4, 0.9, nz * 0.8], [P * 0.89, 4, 0.8, nz * 0.7], [P * 0.89 * 0.94, 3, 0.65, nz * 0.5], [P * 0.885, 3, 0.55, nz * 0.4], [P * 0.885 * 0.97, 3, 0.45, nz * 0.3], [P * 0.88, 3, 0.4, nz * 0.2]];
      depths = [0.12, 0.06, 0.03];
    } else { // loose
      start = P * 0.72;
      legs = [[P, 14, 1.2, nz], [P * 0.8, 6, 1.2, nz], [P * 0.985, 6, 1.1, nz], [P * 0.985 * 0.82, 5, 1.15, nz], [P * 0.975, 5, 1.1, nz], [P * 0.975 * 0.835, 5, 1.1, nz], [P * 0.93, 4, 1.05, nz]];
      depths = [0.2, 0.18, 0.165];
    }
    const { bars } = build(start, legs, (seed || 1) * 7 + 3);
    const why = {
      vcp: `原有升勢 → 回調 ${depths.map(pc).join(' → ')} 逐步縮細、低位逐步抬高，最後收縮期間成交量明顯減少。係「候選」，仲要等 Pivot 突破、計清楚 Stop 同上方空間。`,
      novol: `價格回調 ${depths.map(pc).join(' → ')} 睇落收窄，但最後收縮期間成交量反而增加，唔符合 Volume Dry-Up。可能有人持續沽貨，要小心。`,
      lowerlow: '每次回調低位都低過上一次（Lower Low），即使幅度縮細，結構都係轉弱，唔應該硬叫健康看漲 VCP。',
      range: '上落幅度一直差唔多（大約 9–10%），冇 T1 > T2 > T3 嘅明顯逐步收縮，只係普通 Range。',
      downtrend: '後段確實有收縮，但之前係一段明顯跌勢。經典看漲 VCP 要求原有升勢（Stage 2），呢個更似跌勢中途整理。',
      loose: '20% → 18% → 16.5% 數學上係減少，但每次都仲跌好深、量冇縮，市場未轉成緊密整理。',
    }[type];
    return { type, label: LABEL[type], why, bars, depths };
  }

  /* TSLA 5 分鐘日內 VCP 示範（第 11、12 章同 K 線重播共用；教學模擬，唔係真實行情） */
  function intraday() {
    const k = (t, o, h, l, c, v) => ({ t, o, h, l, c, v });
    return [
      k('09:30', 386.00, 387.40, 385.80, 387.20, 3.2), k('09:35', 387.20, 388.50, 387.00, 388.30, 2.8), k('09:40', 388.30, 389.40, 388.10, 389.20, 2.5),
      k('09:45', 389.20, 390.00, 389.00, 389.70, 2.3), k('09:50', 389.70, 389.80, 388.60, 388.80, 2.0), k('09:55', 388.80, 389.00, 387.60, 387.90, 1.9),
      k('10:00', 387.90, 389.00, 387.80, 388.90, 1.5), k('10:05', 388.90, 390.00, 388.70, 389.70, 1.4), k('10:10', 389.70, 389.80, 388.90, 389.00, 1.1),
      k('10:15', 389.00, 389.20, 388.75, 389.10, 1.0), k('10:20', 389.10, 389.90, 389.00, 389.80, 0.9), k('10:25', 389.80, 390.10, 389.60, 389.75, 0.8),
      k('10:30', 389.75, 389.85, 389.55, 389.70, 0.6), k('10:35', 389.70, 390.00, 389.60, 389.90, 0.55),
      k('10:40', 389.90, 390.35, 389.85, 390.28, 1.6), k('10:45', 390.28, 390.60, 389.90, 390.05, 1.1), k('10:50', 390.05, 390.90, 389.98, 390.80, 1.3),
      k('10:55', 390.80, 391.85, 390.70, 391.70, 1.5),
    ];
  }
  const INTRA_MARKS = [{ i: 5, text: 'T1 −0.62%', pos: 'below', color: 'var(--warn)' }, { i: 9, text: 'T2 −0.32%', pos: 'below', color: 'var(--warn)' }, { i: 12, text: 'T3 −0.14%', pos: 'below', color: 'var(--warn)' }];
  const INTRA_PLAN = [{ y: 390.20, label: 'Entry 390.20', color: 'var(--accent)' }, { y: 389.40, label: 'Stop 389.40', color: 'var(--down)' }, { y: 391.80, label: 'Target 391.80', color: 'var(--up)' }];
  window.VCPGen = { make, build, intraday, LABEL, TYPES: Object.keys(LABEL), INTRA_MARKS, INTRA_PLAN };

  /* ① VCP 解剖：逐步睇 */
  window.WIDGETS_EXTRA['l9-anatomy'] = (el) => {
    const { bars } = build(80, [[120, 14, 1.3, 0.8], [96, 6, 1.5, 0.8], [118, 6, 1.0, 0.7], [106.2, 4, 0.8, 0.6], [117.5, 4, 0.7, 0.5], [111.63, 3, 0.5, 0.4], [116.9, 3, 0.42, 0.3], [117.2, 3, 0.32, 0.2], [119.4, 1, 1.7, 0.3], [121.5, 1, 1.35, 0.3], [123.6, 1, 1.15, 0.3]], 91);
    const STEPS = [
      { n: 14, t: '① 原有升勢：$80 → $120。股票本身強勢，VCP 係升勢途中嘅整理，唔係撈底。' },
      { n: 20, t: '② T1：$120 → $96（−20%）。第一次深回調，通常成交量較大（獲利沽盤、大市回落等）。' },
      { n: 30, t: '③ T2：$118 → $106.20（−10%）。回調幅度大約減半，低位抬高，成交量開始減少。' },
      { n: 43, t: '④ T3：$117.50 → $111.63（−5%），之後幾日窄幅橫行、成交量極低 —— Volume Dry-Up。Pivot = 最後收縮高位 $117.50。' },
      { n: 46, t: '⑤ 突破：價格升穿 Pivot $117.50，成交量放大。留意 $120（Base 最高位）仍然係上方阻力。突破唔等於一定成功。' },
    ];
    let s = 0;
    el.innerHTML = `<div class="vcp-anat"><div data-c></div><div class="tool-foot"><button class="btn sm" data-prev>◀ 上一步</button><span class="vcp-step" data-s></span><button class="btn sm primary" data-next>下一步 ▶</button></div><p class="vcp-cap" data-t aria-live="polite"></p><p class="tool-fine">原創教學示意（日線），唔係真實股票行情。</p></div>`;
    const draw = () => {
      const st = STEPS[s];
      const lines = [], zones = [];
      if (s >= 1) zones.push({ lo: 119.85, hi: 120.15, label: 'Base 最高位 $120（上方阻力）', color: 'var(--muted)', opacity: 0.35 });
      if (s >= 3) lines.push({ y: 117.5, label: 'Pivot 117.5', color: '#8b5cf6' });
      const marks = [{ i: 19, text: 'T1 −20%', pos: 'below', color: 'var(--warn)' }, { i: 29, text: 'T2 −10%', pos: 'below', color: 'var(--warn)' }, { i: 36, text: 'T3 −5%', pos: 'below', color: 'var(--warn)' }, { i: 43, text: '突破', color: 'var(--up)' }];
      C.candles(el.querySelector('[data-c]'), { bars, visible: st.n, slots: bars.length, lines, zones, marks, height: 260, labelEvery: 6, title: 'VCP 解剖（3T：20% → 10% → 5%）' });
      el.querySelector('[data-s]').textContent = `第 ${s + 1} / ${STEPS.length} 步`;
      el.querySelector('[data-t]').textContent = st.t;
      el.querySelector('[data-prev]').disabled = s === 0;
      el.querySelector('[data-next]').disabled = s === STEPS.length - 1;
    };
    el.querySelector('[data-prev]').addEventListener('click', () => { s = Math.max(0, s - 1); draw(); });
    el.querySelector('[data-next]').addEventListener('click', () => { s = Math.min(STEPS.length - 1, s + 1); draw(); });
    draw();
  };

  /* ② Stage 1–4 */
  window.WIDGETS_EXTRA['l9-stages'] = (el) => {
    const p = [];
    for (let i = 0; i < 12; i++) p.push(50 + Math.sin(i * 1.3) * 2.2);
    for (let i = 0; i < 16; i++) p.push(52 + i * 3.4 + Math.sin(i * 1.7) * 3);
    for (let i = 0; i < 12; i++) p.push(104 + Math.sin(i * 1.4) * 5);
    for (let i = 0; i < 14; i++) p.push(100 - i * 3.3 + Math.sin(i * 1.6) * 3);
    const lab = p.map((_, i) => (i === 5 ? 'Stage 1 底部' : i === 20 ? 'Stage 2 升勢' : i === 34 ? 'Stage 3 頂部' : i === 47 ? 'Stage 4 跌勢' : ''));
    C.line(el, { series: [{ name: '股價（示意）', data: p, color: 'var(--accent)' }], labels: lab, height: 220, format: (v) => '$' + v.toFixed(0), title: '趨勢四個階段（週線示意）', caption: '經典看漲 VCP 主要喺 Stage 2（升勢）入面搵。Stage 4 嘅「收縮」通常只係跌勢中途休息。' });
  };

  /* ③ 日內 VCP（TSLA 5m 模擬） */
  window.WIDGETS_EXTRA['l9-intraday'] = (el) => {
    const bars = intraday();
    C.candles(el, { bars, visible: 14, slots: bars.length, vwap: C.vwapOf(bars).slice(0, 14), zones: [{ lo: 391.9, hi: 392.1, label: '較大時間框架阻力 391.90–392.10', color: 'var(--down)', opacity: 0.12 }], lines: [{ y: 390.10, label: 'Pivot 390.10', color: '#8b5cf6' }], marks: INTRA_MARKS, height: 260, labelEvery: 3, title: 'TSLA 5 分鐘：0.62% → 0.32% → 0.14%（教學模擬）', caption: '每次回調幅度大約減半、低位抬高、成交量逐步減少，價格企喺上升 VWAP 上方。到呢一刻仍然只係「候選」。' });
  };
  window.WIDGETS_EXTRA['l9-intraday-trade'] = (el) => {
    const bars = intraday();
    C.candles(el, { bars, vwap: true, zones: [{ lo: 391.9, hi: 392.1, label: '阻力 391.90–392.10', color: 'var(--down)', opacity: 0.12 }], lines: INTRA_PLAN, marks: INTRA_MARKS.concat([{ i: 14, text: '①突破', color: 'var(--up)' }, { i: 15, text: '②回落', color: 'var(--warn)' }, { i: 17, text: '③到 Target', color: 'var(--up)' }]), height: 260, labelEvery: 3, title: '完整模擬交易：Entry 390.20｜Stop 389.40｜Target 391.80', caption: '結果 A（成功延續）。同一個形態亦可以去結果 B：跌穿 389.40 止蝕。兩種都係正常結果。' });
  };

  /* ④ 假 VCP 圖鑑 */
  window.WIDGETS_EXTRA['l9-fakes'] = (el) => {
    const types = ['vcp', 'lowerlow', 'range', 'downtrend', 'loose', 'novol'];
    let seed = 11;
    el.innerHTML = `<div class="vcp-gallery">${types.map((t) => `<div class="vcp-g" data-t="${t}"><div data-c></div><p><b>${LABEL[t]}</b><small data-w></small></p></div>`).join('')}</div><div class="tool-foot"><button class="btn sm" data-new>🎲 換一組例子</button><a class="btn sm primary" href="#/gym/vcp">🏋️ 去訓練場測試自己</a></div>`;
    const draw = () => {
      el.querySelectorAll('.vcp-g').forEach((box, k) => {
        const m = make(box.dataset.t, seed + k * 13);
        C.candles(box.querySelector('[data-c]'), { bars: m.bars, height: 230, labelEvery: 99 });
        box.querySelector('[data-w]').textContent = m.why;
      });
    };
    el.querySelector('[data-new]').addEventListener('click', () => { seed += 101; draw(); });
    draw();
  };
})();

window.COURSE.push({
  id: 'l9',
  code: 'Level 9',
  title: 'VCP 波幅收縮形態',
  subtitle: 'Volatility Contraction Pattern：T1/T2/T3、Volume Dry-Up、Pivot Breakout、Stage 2、日內 VCP、回測驗證',
  icon: '🌀',
  color: '#4d7c0f',
  question: '突破之前，價格同成交量有冇出現有意義嘅收縮？',
  chapters: [
/* ------------------------------------------------------------------ */
{
  id: 'l9-c1', num: '1', title: 'VCP 究竟係乜？點解佢特別？', mins: 7,
  summary: 'VCP（Volatility Contraction Pattern）由 Mark Minervini 推廣：升勢中嘅股票，回調一次比一次細、成交量愈來愈少，最後收窄到好緊密，再突破關鍵位。',
  keywords: ['VCP', 'Mark Minervini', '波幅收縮', 'Breakout Setup'],
  md: `
:::info 開始之前
本 Level 適合已完成 **Level 1–5** 嘅學員。所有價格例子都係**教學模擬**，唔係真實行情，亦唔係投資建議。
:::

**VCP** 全名係 **Volatility Contraction Pattern（波幅收縮形態）**，係美國交易員 **Mark Minervini** 推廣嘅技術形態分析方法。

佢嘅核心理念唔係「見到阻力就買」，亦唔係「見到三角形就突破」，而係觀察：

> 一隻原本處於升勢嘅股票，經過幾次調整後，每次回落幅度愈來愈細，成交量逐漸減少，價格慢慢收窄到一個好緊密嘅區間。當價格重新突破關鍵水平，就**可能**出現另一段上升。

:::key 兩個版本，唔好撈亂
- **經典 VCP** 主要係 **Swing Trading Setup**，用 **Daily / Weekly Chart** 研究，持倉可能幾日至幾星期。
- **5-minute VCP** 係將「收縮」概念套用到 **Day Trading** 嘅變體（第 11 章）。

你平時用 TSLA、AAPL、MSFT、BRK.B 嘅 5m / 15m Chart 練習，所以本 Level 會**分開教**，避免將兩套時間框架嘅規則混淆。
:::

## 1.1 先睇一個典型 VCP

撳「下一步」逐步睇一個 VCP 點樣形成：

[[widget:l9-anatomy]]

觀察上面張圖，有三個重要現象：

:::steps
1. **股價原本有上升動力** —— 唔係一隻長期下跌、突然橫行嘅股票。
2. **每一次向下調整幅度減少** —— 第一次跌好多，第二次跌少啲，第三次只係輕微回落。
3. **成交量逐漸萎縮** —— 尤其最後嗰段細幅波動期間，成交活動通常會變得好安靜。
:::

當價格再次升穿最後收縮區嘅關鍵高位，就產生一個**值得研究**嘅 Breakout Setup。

## 1.2 同普通 Breakout 最大分別

你之前學（Level 3）：「TSLA 升穿 $385 Resistance，回測守住，再研究 Long。」—— 主要關心**突破同突破後嘅反應**。

VCP 會再追問**突破之前**嘅事：

| 問題 | 點解重要 |
|---|---|
| 突破之前有冇幾段逐漸縮小嘅回調？ | VCP 嘅核心結構 |
| 成交量有冇同步減少？ | 賣壓可能減弱嘅線索 |
| 最後嗰段收縮係咪比較緊密？ | 令 Stop 位置清晰 |
| 股價係咪處於原本強勢嘅趨勢之中？ | 經典 VCP 嘅背景條件 |
| 突破附近有冇明確 Pivot？ | 事前知道邊度觸發 |
| 突破前嘅風險可唔可以清楚界定？ | 先計到 R:R 同股數 |

所以 VCP 嘅分析起點比普通 Breakout **更早**：

$$ VCP = 特定嘅突破前整理結構 + Pivot Breakout Setup $$

## 1.3 VCP 唔係預測一定上升

一隻股票波幅收縮，可以係：

- 買賣雙方逐步達成短期價格平衡；
- 市場參與程度下降；
- 上升動力暫時消失；
- 重大消息（例如財報）前嘅觀望；
- 下一段上升之前嘅整理；
- **亦可以係下一段下跌之前嘅整理。**

:::warn 單憑波幅收縮，唔能夠知道下一步一定向上
經典 VCP 會結合**既有升勢、相對強度、成交量同 Pivot**，嘗試篩選較值得研究嘅向上突破情境 —— 但任何形態都可以失敗。收縮係 **Setup**，唔係盈利保證。
:::

[[quiz:l9-c1]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c2', num: '2', title: 'VCP 由邊五個部分組成？', mins: 7,
  summary: '原有升勢、逐步收縮（T1/T2/T3）、成交量萎縮、Pivot、突破。T 係一次回調（Contraction），唔係 Timeframe；常見 2–4 次。',
  keywords: ['T1 T2 T3', 'Contraction', '3T', 'Footprint'],
  md: `
## 2.1 五個核心部分

| # | 部分 | 意思 |
|---|---|---|
| 1 | **Prior Uptrend**（原有升勢） | 形成 VCP 之前，股價通常已經有一段上升 |
| 2 | **Progressive Contractions**（逐步收縮） | T1、T2、T3… 一連串愈來愈細嘅回調 |
| 3 | **Volume Dry-Up**（成交量萎縮） | 最後整理期間，成交活動明顯減少 |
| 4 | **Pivot Point**（突破參考價） | 最後收縮區域上方，一個清晰可觀察嘅關鍵價格 |
| 5 | **Breakout**（突破） | 價格真正向上突破 Pivot，之後觀察能否維持 |

## 2.2 T1、T2、T3 係咩？

網上研究 VCP 經常見到 **3T**、**4T**、**20% → 10% → 5%** 呢類寫法。

:::key T = Contraction（一次收縮／回調），唔係 Timeframe
| | 回調 | 意思 |
|---|---|---|
| **T1** | −20% | 第一次深度回調 |
| **T2** | −10% | 第二次較淺回調 |
| **T3** | −5% | 最後緊密收縮 |

三次回調、愈來愈細 → 一個典型嘅 **3T VCP**。
:::

經典描述通常有約 **2–6 次**收縮，**常見 2–4 次**，每次幅度大致較前一次明顯縮細。呢個係**形態特徵**，唔係要求所有股票必須精確減半。

## 2.3 唔係每次都需要 Higher High

你之前一直練習 HH、HL。但 VCP 可以係另一種結構：

- 每一次反彈嘅 **High 都差唔多**，但每一次回調嘅 **Low 愈來愈高** → 形成近似 Ascending Triangle；
- 亦可以係每次反彈高位**稍為下降**，但回調幅度同時大幅縮細。

:::tip 重點
VCP 嘅重點係**整段價格波動逐漸收窄**，並非每一段都必須產生 HH。
:::

## 2.4 補充：Minervini 嘅「Footprint」寫法

Minervini 喺書中用一個簡短記號描述一個 Base，方便比較：

$$ 7W  32/4  3T $$

| 部分 | 意思 |
|---|---|
| **7W** | 整個 Base 用咗 7 星期形成（日內版可以寫 90m＝90 分鐘） |
| **32/4** | 最深一次回調 32%，最淺（最後）一次 4% |
| **3T** | 一共 3 次收縮 |

:::coach 教練補充
記錄每個候選 VCP 嘅 Footprint，之後做回測（第 15 章）就可以比較：「最後收縮少過 5% 嘅 VCP，係咪表現好啲？」—— 用數據回答，唔好靠印象。
:::

[[quiz:l9-c2]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c3', num: '3', title: 'VCP 點解有可能有效？Supply 同 Demand', mins: 8,
  summary: '回調愈來愈細、成交量同步減少，可以理解成「潛在供應逐步被消化」—— 但呢個係可以回測嘅假設，唔係已證實嘅因果。',
  keywords: ['Supply', 'Demand', 'Volume Dry-Up', '假設'],
  md: `
如果你只係學識畫 T1、T2、T3，而唔理解背後邏輯，就好容易將任何三角形都誤認為 VCP。

## 3.1 一個例子：$80 升到 $120

股價上升期間，有唔同投資者入場：有人 $85 買、有人 $100 買、有人 $118 先追入。當股票升到 $120，部分持有人選擇獲利，**供應增加**，價格開始回調。

**第一次回調 T1**：$120 → $96

$$ (120 − 96) ÷ 120 × 100% = 20% $$

跌幅相當明顯，可能係獲利沽盤、消息、大市回落等因素造成。之後價格開始反彈。

**第二次回調 T2**：重新升到 $118，再跌到 $106.20

$$ (118 − 106.20) ÷ 118 × 100% = 10% $$

今次跌幅比第一次細。呢個現象**可能**表示下跌幅度正在減弱。

:::warn 我哋只知道回調幅度縮細
唔可以單靠價格變動，就證實賣家已經減少，或者有機構正在吸貨。買賣方嘅身份同動機，需要更多市場資料先有機會了解。
:::

**第三次回調 T3**：反彈至 $117.50，然後只跌到 $111.63

$$ (117.50 − 111.63) ÷ 117.50 × 100% ≈ 5% $$

你而家見到：**20% → 10% → 5%** —— 典型嘅漸進收縮。

## 3.2 Volume Dry-Up 點解重要？

如果同時觀察到：

| 階段 | 成交量 |
|---|---|
| T1 回調 | 相對高 |
| T2 回調 | 較低 |
| T3 回調 | 再減少 |

市場就呈現一個值得研究嘅現象：**價格回落幅度同成交活動一齊減少。**

VCP 理論將呢個理解成**潛在供應逐步被消化、賣壓減弱**。但技術圖表本身無法證明有幾多股由「弱手」轉移畀「強手」，亦無法確認機構買入嘅實際數量。

:::key 正確態度
將佢視為一個**可以回測嘅供需假設**，而唔係已證實嘅因果關係。
:::

## 3.3 點解最後窄幅整理特別值得觀察？

假設股價嘅高低波幅：第一段 $24 → 第二段 $11.80 → 第三段 $5.87。市場由大幅上落，變成較細幅度嘅波動。

如果最後價格重新突破附近高位，而成交量亦重新增加，代表價格**開始離開之前嘅緊密區間** —— 呢個就係 VCP 交易者想捕捉嘅事件。

:::bad 但價格一樣可能…
向下突破、假突破、或者一直橫行。
:::

$$ 收縮 = Setup；Pivot Breakout = Trigger；兩者都唔係未來方向保證 $$

[[quiz:l9-c3]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c4', num: '4', title: '點樣喺 Chart 畫出 T1、T2、T3', mins: 10,
  summary: '每個 T 係自己嗰次局部高位到局部低位嘅回調；用 Wick 極值計百分比；低位要等確認先算。用計算器練習。',
  keywords: ['Swing High', 'Swing Low', 'Price Range Tool', '收縮計算'],
  md: `
呢章同你之前問「Swing High / Swing Low 點樣畫」直接相關。

## 4.1 用 Wick 定 Body？

VCP 要分開唔同用途：

| 要畫嘅嘢 | 主要依據 |
|---|---|
| T1、T2、T3 回調百分比 | 對應 Swing High / Low 嘅 **Wick 極值** |
| Pivot / Resistance Zone | 最後收縮高位、密集 Body 同 Wick |
| Final Contraction Low | 最後一次收縮嘅相關低位 Wick |
| Stop Loss | 結構失效位置，唔係機械式跟 Wick 減幾仙 |
| Tight Closing Range | 多支 Candle 嘅 **Close** 分佈 |

計 T1、T2、T3 時，通常用 **High 到 Low 嘅實際價格極值**。但偶爾一支異常長 Wick 可能係 Shakeout 或特殊事件，值得單獨標記，而唔係毫無判斷咁當成代表整段波幅。

## 4.2 一步一步畫

:::steps
1. **T1**：Daily Chart 第一個明顯 Swing High = $120 → 最低 Swing Low = $96。用 TradingView **Price Range Tool** 量度：−20%。
2. **等確認**：唔係價格第一次跌到 $96 就一定完成 —— 佢下一日可能跌到 $92。要等價格開始反彈，或者按預先定義嘅 Swing 確認規則，先確認該段低位。
3. **T2**：$96 反彈到 $118，再回落至 $106.20 → **由 $118 計**，唔係由 $120 計：−10%。
4. **T3**：$106.20 → $117.50，再回落至 $111.63：約 −5%。
:::

:::warn Replay 時嘅陷阱
做 Replay 時，低位未被確認之前，唔可以當成已知嘅最終 T1 Low。否則就係 **Look-ahead Bias**（用咗當時未知嘅資料）。
:::

:::key 每個 T 都係自己嗰次局部高位至局部低位
| Contraction | Swing High | Swing Low | 回調幅度 |
|---|---|---|---|
| T1 | $120.00 | $96.00 | −20.0% |
| T2 | $118.00 | $106.20 | −10.0% |
| T3 | $117.50 | $111.63 | −5.0% |
:::

你見到三個特徵：回調百分比逐步減少、回調低位逐步提高、波幅逐步收窄。但仲差**成交量**同 **Pivot** 分析。

## 4.3 互動：自己計算收縮

改動每段 Swing High / Low，睇吓係咪仍然符合「逐步收縮」：

[[tool:vcp-contraction]]

## 4.4 如果係 20% → 18% → 17% 呢？

數學上確實逐步減少，但**唔係典型嘅強收縮結構**：每次跌幅仍然好大，市場未出現明顯轉向緊密整理嘅特徵。

反過來 20% → 10% → 5%，每段大致減半，就更符合典型描述。但唔代表 20% → 12% → 7% 就無效 —— **VCP 唔係一條必須完美減半嘅數學公式。**

## 4.5 一定要三個 T？

| Pattern | 意義 |
|---|---|
| 2T | 兩次明顯收縮 |
| 3T | 三次明顯收縮 |
| 4T | 四次明顯收縮 |
| 5T / 6T | 更長整理期間嘅多次收縮 |

:::tip 重點係收縮嘅品質
多啲 T 唔代表一定更好。整理過長，甚至開始破壞原本上升結構，同樣可能有問題。
:::

[[quiz:l9-c4]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c5', num: '5', title: '必要背景：Stage 2 同 Trend Template', mins: 9,
  summary: '經典 VCP 優先喺 Stage 2 升勢股票入面搵。Minervini Trend Template 用 50/150/200 日線、52 週高低位同 RS Rating 篩選。RS ≠ RSI。',
  keywords: ['Stage 2', 'Trend Template', 'RS Rating', 'SMA 50/150/200'],
  md: `
呢度係經典 VCP 同你平時 5m Day Trading 最大分別之一。你做日內分析習慣用 15m 結構、5m Entry、Session VWAP；但 Minervini 嘅經典方法，會**先搵較長期處於強勢趨勢嘅股票**，再研究有冇 VCP Base。

## 5.1 Stage 1–4

[[widget:l9-stages]]

| Stage | 典型市場表現 |
|---|---|
| Stage 1 | 底部整理，長期方向未明 |
| **Stage 2** | **上升趨勢** |
| Stage 3 | 高位整理，升勢可能減弱 |
| Stage 4 | 下降趨勢 |

經典看漲 VCP 優先搵 **Stage 2** 股票：股票本身已經處於上升環境，VCP 係升勢途中嘅整理，而唔係隨意估一隻跌咗好多嘅股票終於見底。

## 5.2 Minervini Trend Template（八項）

不同書籍版本同工具對少數數值有差異，以下係常見完整版本：

| # | 條件 | 主要作用 |
|---|---|---|
| 1 | 股價高於 150 日及 200 日 SMA | 長期價格偏強 |
| 2 | 150 SMA 高於 200 SMA | 中長期方向排列 |
| 3 | 200 SMA 至少最近一個月向上 | 避免長期下降均線 |
| 4 | 50 SMA 高於 150 SMA 同 200 SMA | 中短期動力較強 |
| 5 | 股價高於 50 SMA | 近期價格維持較強 |
| 6 | 股價至少高於 52 週低位約 25%–30% | 避免仍接近全年最低位 |
| 7 | 股價距離 52 週高位唔超過約 25% | 研究接近高位嘅股票 |
| 8 | RS Rating 達到較高水平（例如 70 或以上） | 搵相對強勢股票 |

:::warn 呢啲係策略篩選條件
唔係經科學證實嘅最佳門檻。用嚟縮窄研究範圍，唔係買入訊號。
:::

用下面工具逐項檢查一隻股票（數字自己喺 TradingView 讀出嚟填）：

[[tool:trend-template]]

## 5.3 RS 同 RSI 完全唔同

| | 全名 | 計乜 |
|---|---|---|
| **RS / RS Rating** | Relative Strength Ranking | 一隻股票**相對其他股票或大市**嘅價格表現 |
| **RSI** | Relative Strength Index | 一隻股票**自身**近期升跌幅度計出嚟嘅動量指標 |

所以 **RS Rating 90 唔等於 RSI 90**。喺 TradingView 加 RSI，唔可以直接當成 Minervini 嘅 RS Ranking。你喺 Level 6 學過嘅「TSLA vs QQQ 相對強弱」概念上較接近 RS。

## 5.4 補充：大市環境

Minervini 好重視**大市方向**：好多突破喺大市轉弱時一齊失敗。一個簡單嘅研究版篩選：

- QQQ / SPY 收市喺 50 日線上方，而且 50 日線向上 → 可以研究 VCP 突破；
- 大市喺 200 日線下方、連續派發日 → 只觀察、唔交易，或者降低風險。

:::coach 呢個係假設，要測試
「大市好先做」聽落合理，但要用回測驗證佢係咪真係改善你嘅結果（同 Lab 入面「加 vs 唔加 20 日線」嘅 A/B 比較一樣道理）。
:::

## 5.5 5m 可唔可以照用 50 / 150 / 200？

唔應該直接將「50 日 SMA」變成「5m 上嘅 SMA50」然後話兩者一樣：

- Daily SMA50 ≈ 過去約 **50 個交易日**；
- 5m SMA50 ≈ 過去 50 支 5 分鐘 K，約 **250 分鐘**。

兩者描述完全唔同嘅趨勢尺度。建議：

- **Daily / Weekly**：研究經典 VCP 結構；
- **15m / 5m**：研究日內波幅收縮同突破時機；
- 做 Day Trading，可以先將 **Daily Trend 當背景過濾**，而唔係照搬經典 Swing 嘅所有持倉規則。

[[quiz:l9-c5]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c6', num: '6', title: 'Pivot Point：突破位置點樣畫？', mins: 7,
  summary: 'Pivot 係最後緊密整理區上方、事前識別嘅突破參考價，唔一定等於整個 Base 最高位。上方阻力要保留，會影響 R:R。',
  keywords: ['Pivot', 'Resistance Zone', 'Buffer', '下一阻力'],
  md: `
## 6.1 Pivot 係乜？

**Pivot** 係 VCP 最後緊密整理區域上方，一個**預先識別**嘅突破參考價格。

- 唔係數學上嘅傳統 Daily Pivot Point 指標；
- 亦**唔一定**等於整個 Base 嘅最高價。

## 6.2 一個例子

| 位置 | 價格 |
|---|---|
| 整個 Base 最高位 | $120.00 |
| 最後一段 T3 高位 | $117.50 |
| 最後一段 T3 低位 | $111.63 |

如果將 Final Contraction High **$117.50 作為 Pivot**，可以研究 $117.50 附近嘅突破。但上方仍然有 **$120.00** 高位：

$$ Pivot = $117.50；下一阻力 = $120.00 附近 $$

## 6.3 呢個會影響 Risk / Reward

假設 Entry $117.60、Stop $112.50：

$$ 每股風險 = 117.60 − 112.50 = $5.10 $$
$$ 到阻力回報 = 120 − 117.60 = $2.40 $$
$$ R:R = 2.40 ÷ 5.10 ≈ 0.47 $$

如果你嘅規則要求**最近重要阻力之前至少有 2R 空間**，就應該 **Skip**。

:::info 經典 Swing VCP 嘅分別
經典 VCP 未必將整筆交易目標限制喺第一個歷史高位，交易者可能研究突破高位後嘅持續趨勢。但喺你目前嘅風險回報框架，**仍然必須清楚知道上方最近阻力喺邊**，唔可以當佢唔存在。
:::

## 6.4 畫線定畫 Zone？

Pivot 可以係一個相對清晰嘅水平，但附近嘅 Resistance Zone 仍然值得保留。例如：

- Final High：$119.85；附近幾支 Candle High：$119.70、$119.90、$119.80；
- **Pivot Reference** = $119.90；**Candidate Resistance Zone** = $119.70–$119.90；
- 想突破成個 Zone 先觸發 → Entry Trigger 研究 $120.00 附近。

:::warn Buffer 唔係固定 $0.10
$0.10 只係假設，要視乎股票最細報價單位、波幅、Spread 同測試規則決定。$20 嘅股票同 $400 嘅 TSLA，用同一個 $0.10 意義完全唔同 —— 可以考慮用價格嘅百分比，或者 ATR 嘅一小部分。
:::

[[quiz:l9-c6]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c7', num: '7', title: 'Volume：量縮同突破量', mins: 9,
  summary: '兩個階段：收縮期 Volume Dry-Up、突破時 Volume Expansion。日線用 50 日平均做基準；5m 要用同時段 RVOL。大量 ≠ 突破成功。',
  keywords: ['Volume Dry-Up', 'Breakout Volume', 'RVOL at Time', '量價'],
  md: `
VCP 唔係只畫三個愈來愈細嘅 V 字就完成。成交量係佢一個重要特徵。

## 7.1 兩個完全唔同嘅階段

| 階段 | 觀察 | 理論意義 |
|---|---|---|
| **A：Volume Dry-Up** | 收縮期間成交逐步減少，尤其最後 T3 / T4 | 供應壓力可能減弱 |
| **B：Breakout Volume Expansion** | 突破 Pivot 時成交量較基準增加 | 突破有較多參與 |

## 7.2 Volume Dry-Up 點判斷？（Daily 例子）

過去 50 個交易日平均 = **10M 股**。最近 T3 期間：

| 日 | Volume |
|---|---|
| Day 1 | 5.2M |
| Day 2 | 4.1M |
| Day 3 | 3.8M |
| Day 4 | 2.9M |
| Day 5 | 3.0M |

$$ 最近 5 日平均 = (5.2 + 4.1 + 3.8 + 2.9 + 3.0) ÷ 5 = 3.8M $$
$$ 相對 50 日平均 = 3.8 ÷ 10 = 0.38（即 38%） $$

呢個可以視為明顯 Volume Dry-Up 候選 —— 但冇一個百分比可以保證後續突破成功。

[[tool:vcp-volume]]

## 7.3 點解唔係 Volume 愈細愈好？

Volume 減少可能有好多原因：假期前夕、股票冇人有興趣、等財報、整體流動性下降、股價開始失去上升動力…

:::key Volume Dry-Up 必須結合價格
價格仍然保持相對強勢、收縮低位未被持續破壞、最後區間逐步收窄。如果股價**一路跌、成交量同時愈來愈低**，唔可以自動叫做健康 VCP。
:::

## 7.4 突破時 Volume 要幾大？

部分 VCP 教學會用「突破量比 50 日平均高 **40%–50%** 或以上」做確認參考。但呢個唔係每個成功突破都必須符合嘅自然法則，亦**唔應該照搬去 5m Chart**。

日內要用 **同時段相對成交量（RVOL at Time）**：

$$ 今日 10:30–10:35 成交 1.8M ÷ 過去 10 日同時段平均 0.9M = RVOL 2.0 $$

即嗰支 5m K 線嘅成交係歷史同時段平均嘅兩倍，對日內突破分析更有意義。

:::tip TradingView 設定
TradingView「Relative Volume at Time」有 **Regular** 同 **Cumulative** 兩種模式。想比較單支 5m K 線，揀 **Regular**，並固定 Anchor 同 Length 設定。
:::

## 7.5 「突破量大」唔等於「突破成功」

價格升穿 Pivot、Volume 係正常兩倍，但嗰支 K 線最後留低長上影線，**收返 Pivot 下方** → 呢個係 **High Volume + Failed Breakout 候選**。

正確分析次序仍然係：

:::steps
1. 價格係咪突破？
2. 收市能否企穩？
3. 後續能否守住？
4. 成交量係支持，定令你需要更小心？
:::

[[quiz:l9-c7]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c8', num: '8', title: 'VCP 三種 Entry 方法', mins: 9,
  summary: 'Pivot Breakout（最早、易遇假突破）、收市確認（較遲、有跳空風險）、Breakout + Retest（結構清楚、可能冇回測）。三種要分開回測。',
  keywords: ['Pivot Breakout', 'Close Confirmation', 'Retest', 'Buy Stop'],
  md: `
你之前學過 **Confirmation、Entry Trigger、Actual Fill** 要分開（Level 4）。VCP 一樣。

## 8.1 方法 A：Pivot Breakout Entry

最直接嘅 VCP 入場方式。最後收縮區間 High $120、Low $117.50，Pivot $120 → 價格突破時，按預先選定嘅訂單方式嘗試入場，例如 **Entry Trigger $120.10**。

:::warn Trigger ≠ 成交價
- **Buy Stop Market**：觸發後價格可能跳到 $120.30，令你買貴咗。
- **Buy Stop-Limit**：可以限制最高成交價，但可能完全買唔到。
:::

| 優點 | 缺點 |
|---|---|
| 較早參與價格離開緊密區間嘅過程 | 突破當刻未必知道會唔會收返 Pivot 下方 → 假突破 |

要用固定規則處理訂單觸發、滑價同失效條件。

## 8.2 方法 B：Breakout Candle Close Entry

唔想喺未完成 K 線之前入場，可以要求**一支已完成 K 線收喺 Pivot 上方**。例如 Pivot $120，Daily K 線：開 $119.50、高 $121.20、低 $119.20、**收 $120.80** → 之後交易時段研究入場。

:::bad 但翌日可能跳空高開到 $123
原本計劃嘅風險回報就變咗。收市確認入場**唔一定更好**，佢只係**更遲取得確認**。經典 Daily VCP，隔夜風險同跳空必須考慮。
:::

## 8.3 方法 C：Breakout + Retest Entry

就係你最熟悉嘅 Level 3 Setup：Pivot $120 → 突破到 $122 → 回調到 $120.20 → 再出現反彈 → 等回測確認先研究入場。

| 方法 | 幾時入場 | 主要取捨 |
|---|---|---|
| Pivot Breakout | 價格突破 Pivot 時 | 較早參與，但易遇假突破 |
| Close Confirmation | 已完成 K 線收喺 Pivot 上方 | 確認較多，但可能較遲、有跳空 |
| Breakout + Retest | 突破後回測再確認 | 結構較清晰，但可能完全冇回測 |

:::key 三種方法都可以獨立回測
但唔應該混合成同一套策略結果。每個方法一個 Strategy ID（例如 VCP-A、VCP-B、VCP-C）。
:::

## 8.4 有冇 Early Entry？

有啲交易者會喺 Pivot 之前提早入場，例如 T3 期間已經由低位形成細 Higher Low，或者出現較強成交量嘅向上 K 線突破好短線嘅阻力。呢啲有時叫 **Early Entry / Cheat Entry**，唔同交易者定義唔完全一樣。

- 好處：買得較近止損位；
- 問題：未等到真正 Pivot Breakout，形態可能繼續整理，甚至整個 VCP 失敗。

:::coach 現階段建議
先練**標準 Pivot Breakout**。唔好一開始同時研究 Early Entry、Pocket Pivot、Shakeout Entry 等多種技巧 —— 一次測一樣先知邊樣有效。
:::

[[quiz:l9-c8]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c9', num: '9', title: 'Stop Loss、Target 同 Position Size', mins: 9,
  summary: '最常見 Stop 參考：最後收縮低位下方。2R Target 只係數學目標，要先睇上方阻力。股數 = 風險預算 ÷ 每股風險，仲要睇夠唔夠錢。',
  keywords: ['Final Contraction Low', '2R', 'Position Sizing', '隔夜風險'],
  md: `
VCP 其中一個特色：最後收縮區域可能比較緊密，令**失效位置較容易界定**。但唔代表一定可以放一個好近嘅 Stop。

## 9.1 最常見 Stop 參考：Final Contraction Low

T3 High $120、T3 Low $117.50、Pivot $120，研究突破 $120.10 入場。如果價格跌穿最後收縮低位 $117.50，「緊密整理後向上突破」嘅假設就可能被破壞 → Stop 放喺 **Final Contraction Low 下方嘅適當位置**。

要考慮：

- 有冇極端 Wick？
- 當前波幅有幾大？
- Spread 同 Slippage 可能有幾多？
- 跌穿 $117.50 係咪真係破壞關鍵結構？
- 有冇其他近啲而且有效嘅結構失效位？

:::warn 唔好用一條公式套晒所有股票
「T3 Low − $0.10」唔係萬能。Stop 跟**假設喺邊度失效**，唔係跟你想輸幾多（Level 3 已經學過）。
:::

## 9.2 完整計算例子（虛構股票 ABC）

| 項目 | 價格 |
|---|---|
| 最後 T3 High / Pivot | $119.90 |
| 最後 T3 Low | $117.50 |
| 模擬 Entry | $120.00 |
| 模擬 Stop | $117.30 |
| 每股風險 | $2.70 |
| 2R Target | $125.40 |

$$ 風險 = 120 − 117.30 = $2.70；2R = $5.40；Target = 120 + 5.40 = $125.40 $$

:::key 2R 只係數學目標
$125.40 唔代表係下一個 Resistance，更唔代表股價會升到嗰度。如果上方 $122 已經有明顯歷史阻力，就應該先考慮嗰個障礙。
:::

## 9.3 用 US$10,000 模擬本金計股數

$$ 風險預算 = 10,000 × 0.25% = $25 $$
$$ 股數 = ⌊25 ÷ 2.70⌋ = 9 股 $$
$$ 所需資金 = 9 × 120 = $1,080；計劃止損損失 = 9 × 2.70 = $24.30 $$

如果實際滑價或交易費用增加，損失可能超過 $25。經典 Daily VCP 可能持倉多日甚至幾星期，**隔夜跳空、財報同消息風險**令呢個風險預算更加唔可以當成最大損失保證。

:::tip 兩個限制，取較細
股數受**風險預算**同**可用資金**兩個限制。例如 TSLA $390、每股風險只係 $0.80：風險預算計出 31 股，但 31 × $390 ≈ $12,100 超過 $10,000 本金 → 現金戶口最多只可以買 25 股。下面工具會自動幫你檢查。
:::

[[tool:vcp-plan]]

## 9.4 一定要用 2R Target？

唔一定。固定 2R 係一套**容易測試**嘅 Exit Rule。但經典 VCP 較偏向捕捉延續趨勢，有啲交易者會研究：

- 固定 R 倍數離場；
- 根據關鍵移動平均線（例如 10 / 20 / 50 日線）管理持倉；
- 以後續 Higher Low 移動止損；
- 分批止賺（Level 7）；
- 出現明顯失效訊號先退出。

每種做法都會改變勝率、平均盈利、回撤同持倉時間。

:::coach 建議嘅研究版本
**VCP Pivot Entry + Final Contraction Structure Stop + 固定 2R Target** —— 當作一個待驗證嘅研究版本。但唔好將佢誤認為 Mark Minervini 完整原版管理系統。
:::

[[quiz:l9-c9]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c10', num: '10', title: 'VCP vs 其他 Setup', mins: 7,
  summary: 'VCP 睇突破之前嘅收縮；Breakout + Retest 睇突破之後嘅回測。Bull Flag、Ascending Triangle 可以同時有 VCP 特徵；Failed Breakout 唔一定係 Failed VCP。',
  keywords: ['Breakout + Retest', 'Bull Flag', 'Ascending Triangle', 'Failed Breakout'],
  md: `
你已經練過 Breakout + Retest、Resistance Reversal、Failed Breakout。加上 VCP，容易覺得全部都係睇 Support / Resistance —— 其實佢哋關注嘅重點唔同。

## 10.1 VCP vs Breakout + Retest

| 比較 | VCP | Breakout + Retest |
|---|---|---|
| 主要觀察 | **突破前**價格收縮 | **突破及回測** |
| 要唔要逐步收縮 | 典型 VCP 需要 | 唔一定 |
| Volume | 特別留意 Dry-Up | 特別留意突破／回測量 |
| 入場時機 | 可以喺 Pivot Breakout | 通常等突破後回測 |
| 經典時間框架 | Daily / Weekly | 多個時間框架都得 |
| 主要風險 | 假突破、整理失敗 | 回測失敗、追價太遲 |

## 10.2 VCP vs Bull Flag

Bull Flag：先有一段明顯**快速上升**（旗桿），之後相對短暫嘅回調或橫行，再研究突破延續。VCP 可以有相似外形，但更重視**多次回調幅度逐步減少**同 **Volume Dry-Up**。

$$ 一個 Bull Flag 可能包含 VCP 結構；但唔係所有 Bull Flag 都係 VCP $$

## 10.3 VCP vs Ascending Triangle

Ascending Triangle：價格多次接近相同 Resistance，同時 Higher Low 逐步抬高。VCP 有時會呈現相似三角形，但要額外檢查每次 **Contraction Depth** 同 **Volume** 係咪逐漸減少。兩者唔係互相排斥。

## 10.4 VCP vs Failed Breakout

你之前標記過 BRK.B：Resistance $532.67，價格升穿之後快速跌返落去 —— 呢個係值得研究嘅 **Failed Breakout** 情境，但唔代表佢一定係 **Failed VCP**。

:::key 名稱要準確
要叫 Failed VCP，突破之前應該已經有**符合條件嘅逐步收縮結構**。如果之前只係普通橫行，或者直接衝高再跌，就只係一般 Failed Breakout。準確命名，之後做數據切片先有意義。
:::

[[quiz:l9-c10]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c11', num: '11', title: '5-minute 日內 VCP', mins: 10,
  summary: '日內唔可以照搬 20%→10%→5%，要睇相對近期日內波幅：0.62%→0.32%→0.14%。量縮要比同時段；Pivot 上方有冇大阻力；VWAP 做背景過濾。',
  keywords: ['Intraday VCP', '5m', 'VWAP', '同時段成交量'],
  md: `
返到你平時練習嘅 TradingView TSLA、AAPL、MSFT、BRK.B。

:::warn 5m VCP 唔應該照搬 20% → 10% → 5%
TSLA 可能成個上午都只喺幾美元之間活動。你要研究嘅係**相對近期日內波幅**有冇收縮。呢個係經典 Swing VCP 嘅**日內應用版本**，必須獨立測試。
:::

日內要睇：

- 相對近期日內波幅有冇收縮；
- 每一段回調幅度有冇減少；
- 每一次 Low 會唔會逐步提高；
- 成交量有冇減弱（**相對同時段**）；
- 價格係咪接近重要日內 Pivot；
- 突破時 Volume 有冇相對同時段放大。

## 11.1 例子：TSLA 上午急升之後

[[widget:l9-intraday]]

| 段 | 走勢 | 回調 |
|---|---|---|
| 初始動力 | 09:30–09:45 由 $386 升到 $390，量大 | —（只係強勢，未係 VCP） |
| **T1** | $390.00 → $387.60 | (390 − 387.60) ÷ 390 ≈ **0.62%** |
| **T2** | $390.00 → $388.75 | (390 − 388.75) ÷ 390 ≈ **0.32%** |
| **T3** | $390.10 → $389.55 | (390.10 − 389.55) ÷ 390.10 ≈ **0.14%** |

**0.62% → 0.32% → 0.14%** —— 一個相當明顯嘅日內收縮序列。但仍然要檢查 Volume 同 Pivot，而唔係見到三個百分比就即刻買。

## 11.2 5m VCP 最易犯嘅四個錯

:::bad 錯誤 A：將任何 Sideways 當成 VCP
$388 → $389 → $388 → $389 → $388：每次波動差唔多，冇逐步縮細，只係 Range。
:::

:::bad 錯誤 B：日內自然量縮當成 Dry-Up
美股開市頭段通常最活躍，中午自然減少。將 09:30 嘅量同 12:30 直接比較，會以為出現 Volume Dry-Up。要比較**同時段基準**，或者至少分清「一般日內成交量季節性下降」同「收縮期間額外出現嘅量縮」。
:::

:::bad 錯誤 C：低位一路下移，卻畫成 Bullish VCP
T1 Low $388、T2 Low $387.50、T3 Low $386.80 —— 就算 K 線實體睇落縮細，結構已經可能持續轉弱。
:::

:::bad 錯誤 D：突破 Pivot，但上方即刻有更大阻力
5m Pivot $390，但 15m 重要阻力 $390.40。$390.20 入場、Stop $389.20：每股風險 $1，到阻力只有 $0.20 → 要 Skip。同你之前學嘅「下一個 Resistance」完全一致。
:::

## 11.3 5m VCP 同 VWAP 點配合？

VWAP 係日內**背景過濾器**，唔係 VCP 本身嘅必需成分：

| 情境 | 建議 |
|---|---|
| A：價格維持 VWAP 上方，VWAP 向上 | 配合收縮、量縮同 Pivot Breakout，值得優先研究看漲延續 |
| B：價格反覆穿越橫行 VWAP | 容易係 Choppy Market，現階段可以先 Skip |
| C：價格低於向下 VWAP | 就算短線收縮，都未必係理想嘅看漲延續背景 |

:::info 補充：日內版嘅時間
日內 VCP 較常見喺開市後 30–120 分鐘（初始動力之後嘅整理）。午市（Lunch Lull）成交本身細，收縮好多時只係冇人交易。呢個都係假設，可以喺 Lab 用「最早／最遲訊號時間」測試。
:::

[[quiz:l9-c11]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c12', num: '12', title: '完整模擬交易：由收縮到平倉', mins: 9,
  summary: '用第 11 章 TSLA 例子行一次：Pivot $390.10、Entry $390.20、Stop $389.40、Target $391.80（2R）。實際 Fill $390.35 → 變 1.53R。按原定規則管理。',
  keywords: ['Trade Plan', 'Fill', '滑價', '結果 A / B'],
  md: `
:::info 虛構行情
以下用嚟練習逐步決策，唔係真實 TSLA 數據。
:::

## 12.1 市場背景

- 15m：偏強，近期 HH + HL；
- TSLA 由 $386 快速升到 $390；
- Session VWAP 喺價格下方，向上；
- 較大時間框架下一個阻力區：約 **$391.90–$392.10**。

## 12.2 三次收縮完成

| Contraction | High | Low | 回調 |
|---|---|---|---|
| T1 | $390.00 | $387.60 | 0.62% |
| T2 | $390.00 | $388.75 | 0.32% |
| T3 | $390.10 | $389.55 | 0.14% |

假設 Volume 喺 T1、T2、T3 期間逐步減少，而且相對同時段數據亦支持成交減弱 → 可以建立**候選 VCP**。但仍然未入場。

## 12.3 畫 Pivot、寫計劃

- T3 High = **$390.10** → 候選 Pivot；
- 教學用 Buffer $0.10 → **Entry Trigger $390.20**；
- Stop 候選 = **$389.40**（最後收縮低位 $389.55 下方）；
- Target 候選 = **$391.80**（阻力區之前）。

[[rr:390.20,389.40,391.80]]

$$ 風險 $0.80／股；回報 $1.60／股；R:R = 2.00 $$

## 12.4 Candle 1：嘗試突破

開 $389.90、高 $390.35、低 $389.85、收 $390.28 → 觸及 Trigger $390.20。如果事前設咗 Buy Stop 並觸發，可能產生模擬成交。

:::warn 實際 Fill 係咪真係 $390.20？
假設成交 **$390.35**：

$$ 風險 = 390.35 − 389.40 = $0.95；回報 = 391.80 − 390.35 = $1.45；R:R ≈ 1.53 $$

原本 2R 嘅交易，因為成交價不利，變成 1.53R。如果你策略要求成交時至少仍有 2R，就應該按預設嘅價格限制或取消規則處理（例如 Stop-Limit 上限 $390.25），而唔係假裝已經喺 $390.20 買入。
:::

## 12.5 Candle 2：突破後回落

開 $390.28、高 $390.60、低 $389.90、收 $390.05 —— 曾經上升，但收返 Pivot 附近。係咪代表 VCP 已經失敗？**未必**：

- 只係短暫跌返 Pivot 附近；
- 未破壞 T3 Low；
- 未觸發事前 Stop。

用固定 Stop / Target 嘅策略，就**按原定規則管理**。如果你原本規定「任何 K 線收返 Pivot 下方就退出」，亦要**事前寫清楚**並獨立測試呢種 Exit Rule。

## 12.6 Candle 3：兩種結果

[[widget:l9-intraday-trade]]

:::good 結果 A：成功延續
價格重新升到 $391.80，按 Target 成交，模擬交易獲利。
:::

:::bad 結果 B：跌穿 Final Contraction Low
價格由 $390 跌到 $389.20，Stop $389.40 被觸發，交易失敗。你**唔應該**因為佢「睇落係好靚嘅 VCP」，就將 Stop 移去 $388。
:::

:::key VCP 係一個市場假設，唔係一定成功嘅訊號
用 K 線重播逐支親自做一次決定：
:::

[[replay:l9-vcp]]

[[quiz:l9-c12]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c13', num: '13', title: '真 VCP vs 假 VCP、常見錯誤', mins: 8,
  summary: '五類誤判：持續 Lower Low、普通 Range、跌勢中收縮、離 Pivot 太遠、Pivot 突破失敗。VCP 唔等於「大戶吸晒貨」；任何聲稱 80–90% 勝率都要問清楚點計。',
  keywords: ['假 VCP', 'Lower Low', 'Failed VCP', 'Shakeout'],
  md: `
開始接觸 VCP，你可能發現「周圍都好似有」。但唔係所有收窄嘅圖形都係值得研究嘅 VCP。

## 13.1 五個容易誤判嘅情況

| | 情況 | 點解唔係健康 VCP |
|---|---|---|
| A | **持續 Lower Low** | 每次回調都創新低，冇顯示底部逐步改善 |
| B | **普通 Range** | 上下振幅差唔多，冇 T1 > T2 > T3 |
| C | **收縮但趨勢偏弱** | 原本處於 Downtrend，應先等趨勢改變 |
| D | **收縮，但距離 Pivot 仲好遠** | 未形成容易識別嘅最後突破位置 → 只係 Watchlist |
| E | **Pivot Breakout 失敗** | 突破後守唔住，甚至跌穿最後收縮低位 → Failed VCP Breakout 候選 |

## 13.2 圖鑑：真 vs 假

每張圖都係隨機生成嘅教學例子，撳「換一組」睇更多：

[[widget:l9-fakes]]

## 13.3 VCP 係咪一定有大戶吸貨？

**唔可以單憑圖形確認。** 網上有啲教學話「機構已經吸晒貨，突破必升」—— 呢個講法過度確定。成交量下降同波幅收縮只係觀察到嘅市場特徵，可以支持某種供需假設，但唔能夠證實實際機構持倉、交易動機或者未來方向。

:::warn 聽到「VCP 勝率 80%、90%」？
要求對方提供：樣本股票、測試期間、精確 VCP 定義、Entry、Stop、Exit、成交成本，同埋樣本外驗證。目前**冇一個**可以合理套用到所有市場、所有時間框架嘅公認 VCP 勝率。
:::

## 13.4 補充：Shakeout（洗盤）

有時最後收縮期間會出現一支**短暫跌穿前低、但好快收返上去**嘅 K 線（長下影線）。Minervini 等交易者會將佢理解為 Shakeout —— 洗走弱手後再上。

:::coach 小心「事後解釋」
問題係：同一支 K 線，如果之後繼續跌，就會叫「破位」；如果之後升返，就叫「Shakeout」。**事前**你要有清楚規則（例如：收市必須返回前低上方、量要細），否則就係用結果去改名，屬於 Look-ahead Bias。
:::

## 13.5 七個常見錯誤（總結）

:::steps
1. 將任何三角形、任何橫行都叫 VCP。
2. 唔理原有趨勢，跌勢中都搵 VCP。
3. 用 5m 圖照搬日線嘅 20/10/5% 同 50/150/200 日線。
4. 量縮唔比較同時段，誤判日內自然量縮。
5. 突破上方有大阻力都照入，R:R 唔夠。
6. 實際 Fill 差咗都假裝喺 Trigger 價成交。
7. 事後移動 T3 位置、Stop 或者 Pivot，令結果「好睇啲」。
:::

[[link:gym/vcp|🏋️ 去訓練場：VCP 定唔係 VCP？]]

[[quiz:l9-c13]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c14', num: '14', title: 'TradingView 設定同畫線步驟', mins: 8,
  summary: '經典同日內分兩套 Layout。八個畫線步驟：趨勢 → T1 → T2 → T3 → Volume → Pivot → Stop 同下一阻力 → 等 Trigger。Screener 只係初步篩選。',
  keywords: ['TradingView', 'Layout', 'Price Range Tool', 'Screener'],
  md: `
## 14.1 Layout A：經典 Swing VCP

| 項目 | 建議 |
|---|---|
| Chart | Daily |
| 輔助 Chart | Weekly |
| Moving Average | SMA 50 / 150 / 200 |
| Volume | Daily Volume + Volume SMA50 |
| RS | 對大市指數（QQQ / SPY）做相對強度比較 |
| 畫圖工具 | Price Range、Horizontal Ray、Rectangle |
| 主要目的 | 觀察幾星期嘅 T1 / T2 / T3 同 Pivot |

可以先研究 TSLA 或 MSFT 過去幾個月嘅 Daily Chart 學習辨認收縮。但唔應該假設任何日期都必然存在 VCP。

## 14.2 Layout B：5m 日內 VCP

| 項目 | 建議 |
|---|---|
| 主圖 | 5m |
| 結構背景 | 15m |
| 更高層背景 | Daily |
| Volume | 5m Volume |
| Relative Volume | Relative Volume at Time（Regular） |
| VWAP | Session VWAP |
| 畫圖工具 | Price Range、Horizontal Ray、Rectangle |
| 主要目的 | 研究日內逐步收縮同 Pivot Breakout |

[[check:l9-tv]]

## 14.3 八個畫線步驟

:::steps
1. **先搵趨勢**：Daily VCP 先檢查較長期 Uptrend；日內 VCP 檢查 15m 結構係咪偏強。
2. **第一個明顯 High → Low**：用 Price Range Tool 量度 T1。
3. **等反彈再回調**：量度 T2，判斷回調幅度有冇減少。
4. **搵第三段緊密收縮**：量度 T3，留意最後 Low 同前段相比係咪提高。
5. **檢查 Volume**：唔只睇柱高，仲要考慮時段同正常成交量。
6. **畫最後收縮高位 Pivot**：附近有幾個接近 High，可以用窄 Zone。
7. **搵最後收縮低位同下一個重要障礙**：先研究 Stop、上方空間，再計風險回報。
8. **等指定突破 Trigger**：未有突破之前，只係 Candidate。
:::

## 14.4 有冇 Indicator 自動搵 VCP？

有啲第三方 Screener 同 TradingView Script 會用 Trend Template、收縮 Range、低 Volume、接近近期高位等條件篩選候選股票，例如：

- [ChartMill：VCP 教學及篩選方法](https://www.chartmill.com/documentation/technical-analysis/chart-patterns/531-Volatility-Contraction-Pattern-VCP-How-to-Spot-and-Trade-It)
- [MarketInOut：VCP Screener](https://www.marketinout.com/stock-screener/vcp-volatility-contraction-pattern)
- [TradingView：Relative Volume at Time 說明](https://www.tradingview.com/support/solutions/43000705489-relative-volume-at-time/)

:::warn 自動偵測嘅限制
任何 Screener 都必須自己決定點樣定義 Swing、Contraction 同 Volume Dry-Up。唔同工具對同一張 Chart 可能得出唔同結果。
:::

:::coach 建議
先**手動畫 20–30 個歷史候選 VCP**，學識判斷價格結構後，再將自動 Scanner 當成初步篩選工具，而唔係買入訊號。
:::

[[quiz:l9-c14]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c15', num: '15', title: 'Backtesting：VCP 有冇 Edge？', mins: 10,
  summary: '先寫死研究版規則（VCP-DAILY-v1.0 / VCP-INTRADAY-5M-v1.0），記錄所有候選（包括失敗同冇成交），日線同日內分開統計。可以喺實驗室用真實數據測日內 VCP。',
  keywords: ['VCP-DAILY-v1.0', 'Backtest', 'Expectancy', 'Out-of-Sample'],
  md: `
你已經學到 Level 5 Backtesting，而家將同一個框架用喺 VCP。VCP 比普通突破多咗 T1、T2、T3 同 Volume Dry-Up，所以要記錄更多資料。

## 15.1 第一套研究規則

:::card VCP-DAILY-v1.0（未驗證）
| 項目 | 規則 |
|---|---|
| Timeframe | Daily |
| 方向 | Long |
| Trend Filter | Stage 2 候選 |
| Contractions | 至少 3 段已確認回調 |
| 深度 | T1 > T2 > T3 |
| Volume | 最後收縮量低於事前選定基準 |
| Entry | 突破最後收縮 Pivot |
| Stop | 最後收縮低位下方嘅事前規則 |
| Exit | 先用固定 R 研究版本 |
| Risk Budget | 0.25% 模擬預算 |
:::

真正自動回測，仲要更精確：

- Swing High / Low 用左右幾支 K 線確認？
- 最短 Base 長度幾多日？
- 最後收縮 Volume 低過邊個平均值幾多？
- Pivot 係最後 T3 High、區間 High，定更高嘅 Base High？
- 成交前突然 Gap Up 點處理？
- 財報即將公布係咪排除？
- 止損係價格觸發定收市確認？
- 多個候選同時出現時點分配本金？

呢啲**全部**都會影響回測結果。

## 15.2 要記錄嘅數據

| 欄位 | 用途 |
|---|---|
| Symbol | 股票 |
| Base Start / End | VCP 形成期間 |
| T1 / T2 / T3 Depth | 每次回調 |
| Average Volume Ratio | 量縮程度 |
| Pivot | 突破參考位 |
| Initial Stop | 初始失效位置 |
| Entry Trigger / Fill | 觸發同實際成交 |
| Result in R | 標準化結果 |
| Market Regime | 當刻市況 |
| Breakout Volume | 突破時成交量 |
| Failed / Success / No Fill | 結果分類 |

:::warn 所有候選都要記錄
包括失敗、未突破、冇成交嘅情況。只儲存成功突破圖表，會令策略睇落比實際有效（**Selection Bias**）。
:::

## 15.3 日線同日內要分開統計

千祈唔好將 100 筆 Daily VCP 同 100 筆 5m Intraday VCP 合併成 200 筆再計總勝率。兩者嘅持倉時間、交易成本、價格波幅、Volume 基準、消息風險同出場規則都唔同。分開建立：

- **VCP-DAILY-v1.0**
- **VCP-INTRADAY-5M-v1.0**

## 15.4 三個最重要嘅績效指標

| 指標 | 問題 |
|---|---|
| **Net Expectancy** | 扣除成本後，平均每筆幾多 R？ |
| **Maximum Drawdown** | 最嚴重回撤有幾大？ |
| **Out-of-Sample** | 換另一段歷史、規則不變，結果能否維持？ |

就算回測有正期望值，都未必足以抵銷市場變化、滑價、跳空同執行偏差。

## 15.5 動手：用真實數據測試日內 VCP

回測實驗室已經加入 **「日內 VCP 突破」** 策略（只做 Long），用真實 5 分鐘 K 線：

:::steps
1. 每支收咗嘅 K 線，回望最近 3 段（每段預設 4 支 = 20 分鐘）。
2. 要求每段波幅 ≤ 上一段 × **收縮比例**（預設 0.75），而且每段低位唔低過上一段。
3. 最後一段平均成交量 ≤ 第一段 × **量縮比例**（預設 0.8）。
4. 價格喺 Session VWAP 上方，Pivot 接近今日高位。
5. Pivot = 最後一段高位；突破 Pivot + $0.01 入場；Stop = 最後一段低位 − 緩衝。
:::

[[link:lab|🔬 去回測實驗室，揀「日內 VCP 突破」]]

:::warn 合格 VCP 好少
規則要求連續兩次明顯收縮、低位抬高、量縮、喺 VWAP 上方同今日高位附近 —— 一隻股票一年可能只有十幾次甚至幾次。所以要用**長日期範圍**（例如 2016 至今），或者分別測試幾隻股票（TSLA、AAPL、MSFT、NVDA），先夠 30 筆以上樣本。唔好為咗多啲交易而不斷放寬條件 —— 嗰個就係 Overfitting 嘅開始。
:::

:::coach 先登記，後測試
想研究「加 20 日線順勢篩選會唔會改善 VCP」？先喺實驗室撳「📌 登記成研究假設」，寫低成功標準，再跑測試。結果會出現喺 [研究板](#/research)，全家都睇到，避免事後先改規則。
:::

[[quiz:l9-c15]]
`},
/* ------------------------------------------------------------------ */
{
  id: 'l9-c16', num: '16', title: '練習、畢業測驗同四階段訓練計劃', mins: 9,
  summary: '速查表八條問題、VCP 知識測試、四階段練習：日線辨認 → 5m 分辨收縮同橫行 → Pivot Breakout → 同 Breakout + Retest 比較。',
  keywords: ['速查表', '畢業測驗', '訓練計劃', 'Journal'],
  md: `
## 16.1 VCP 速查表：以後睇圖問自己八條問題

[[check:l9-8q]]

## 16.2 四階段訓練計劃

我唔建議你突然放棄之前學嘅 Breakout + Retest、全面改學 VCP —— 兩者可以互相補充。

| 階段 | 做乜 | 完成標準 |
|---|---|---|
| **1. 日線辨認** | 揀 10–20 個歷史股票圖表，練畫原有升勢、T1/T2/T3、回調 %、Volume Dry-Up、Pivot、Final Contraction Low | 唔使交易，只練畫形態 |
| **2. 5m 分辨** | 用 TSLA、AAPL 歷史 Replay，遇到整理就問：「有冇愈來愈細嘅 Contraction？」 | 冇就照實叫 Range，唔好硬畫 T1、T2、T3 |
| **3. Pivot Breakout** | 穩定辨認候選之後，先研究 Entry Trigger、Stop、Volume 確認、下一阻力、R:R | 冇符合條件就記錄 No Trade |
| **4. 比較策略** | Breakout + Retest vs Intraday VCP Pivot | 用數據比較，唔好靠感覺 |

## 16.3 一個值得研究嘅新假設

:::card 「VCP + Retest」組合
「只有先形成 VCP 嘅 Breakout，我先做後續 Retest Long。」

呢個係一個有意思嘅新策略假設 —— 結合 Level 3 同 Level 9。但仍然需要回測，唔可以預先假定佢一定更好。可以喺研究板登記，再收集樣本。
:::

## 16.4 練習工具

- 🏋️ [訓練場：VCP 定唔係 VCP？](#/gym/vcp) —— 隨機生成真假 VCP，練眼力。
- 🎮 [K 線重播：日內 VCP 突破](#/replay/l9-vcp) —— 逐支做決定。
- 🕹️ [模擬交易練習場](#/sim) —— 用真實歷史日子練，日誌 Setup 揀「D：VCP Pivot Breakout」。
- 🔬 [回測實驗室](#/lab) —— 日內 VCP 策略。

## 16.5 VCP 畢業測驗

[[quiz:l9-final]]

## 16.6 Level 9 畢業自我檢查

[[check:l9-grad]]

:::key 最後嘅核心建議
先將 VCP 當成**「突破前嘅市場結構篩選方法」**，而唔係另一個見到就買嘅 Indicator。你之前花咗好多時間學畫 Support / Resistance、HH / HL、Volume、VWAP —— 其實全部都可以用嚟理解 VCP。今次只係進一步研究：**價格接近阻力之前，波幅同成交量係咪已經出現有意義嘅收縮。**
:::

[[link:map|🗺️ 睇你嘅學習地圖同證書]]
`},
  ],
});

Object.assign(window.QUIZZES, {
'l9-c1': { title: '小測：VCP 核心概念', questions: [
  { q: 'VCP 全名係？', options: ['Volume Confirmation Pattern', 'Volatility Contraction Pattern', 'Vertical Channel Pivot'], answer: 1, explain: 'Volatility Contraction Pattern：波幅收縮形態，由 Mark Minervini 推廣。' },
  { q: 'VCP 同普通 Breakout 最大分別？', options: ['VCP 唔使理突破', 'VCP 更重視突破之前嘅收縮結構同量縮', '兩者完全一樣'], answer: 1, explain: 'VCP 嘅分析起點比普通 Breakout 更早。' },
  { q: '經典 VCP 主要用邊個時間框架？', options: ['1 分鐘', '5 分鐘', 'Daily / Weekly'], answer: 2, explain: '經典 VCP 係 Swing Setup；5m 係日內變體。' },
]},
'l9-c2': { title: '小測：VCP 結構', questions: [
  { q: '「3T」入面嘅 T 係指？', options: ['Timeframe', 'Contraction（一次回調）', 'Target'], answer: 1, explain: 'T = Contraction。3T = 三次收縮。' },
  { q: '以下邊個唔係 VCP 五個核心部分之一？', options: ['Prior Uptrend', 'Volume Dry-Up', 'RSI 超賣'], answer: 2, explain: '五部分：原有升勢、逐步收縮、量縮、Pivot、突破。' },
  { q: '「7W 32/4 3T」入面 32/4 係？', options: ['最深 32%、最淺 4% 回調', '32 日、4 星期', 'RS 32、RSI 4'], answer: 0, explain: 'Footprint：Base 長度、最深/最淺回調、收縮次數。' },
]},
'l9-c3': { title: '小測：供求原理', questions: [
  { q: '$118 跌到 $106.20，回調幾多？', options: ['約 5%', '約 10%', '約 20%'], answer: 1, explain: '(118 − 106.20) ÷ 118 ≈ 10%。' },
  { q: '回調細咗、量少咗，可以肯定有機構吸貨？', options: ['可以', '唔可以，只係支持一個可回測嘅供需假設', '一定係散戶走晒'], answer: 1, explain: '圖表無法證明買賣方身份同動機。' },
  { q: '收縮同 Pivot Breakout 嘅角色？', options: ['收縮 = Setup，突破 = Trigger，兩者都唔保證方向', '收縮 = 保證升', '突破 = 保證升'], answer: 0, explain: '任何形態都可以失敗。' },
]},
'l9-c4': { title: '小測：畫 T1、T2、T3', questions: [
  { q: 'T2 應該由邊度計起？', options: ['T1 嘅最高位 $120', 'T2 自己嗰次局部高位（例如 $118）', '今日開市價'], answer: 1, explain: '每個 T 都係自己嗰次局部高位至局部低位。' },
  { q: '價格第一次跌到 $96，可唔可以即刻當 T1 Low 已確認？', options: ['可以', '要等反彈或按 Swing 確認規則', '睇心情'], answer: 1, explain: '佢可能再跌到 $92；Replay 時要避免 Look-ahead。' },
  { q: '20% → 18% → 17% 屬於？', options: ['典型強收縮', '數學上減少，但收縮唔夠明顯', '一定係 4T'], answer: 1, explain: '每次仍然跌好深，未轉成緊密整理。' },
]},
'l9-c5': { title: '小測：Stage 2 同 Trend Template', questions: [
  { q: '經典看漲 VCP 優先喺邊個 Stage 搵？', options: ['Stage 1', 'Stage 2', 'Stage 4'], answer: 1, explain: 'Stage 2 = 上升趨勢。' },
  { q: 'RS Rating 90 等於 RSI 90？', options: ['係', '唔係：RS 比較其他股票，RSI 係自身動量', '只喺 5m 先一樣'], answer: 1, explain: '兩個完全唔同嘅指標。' },
  { q: 'Daily SMA50 同 5m SMA50 嘅關係？', options: ['一樣', '完全唔同嘅趨勢尺度（50 日 vs 約 250 分鐘）', '5m 嗰條長啲'], answer: 1, explain: '唔可以直接照搬。' },
]},
'l9-c6': { title: '小測：Pivot', questions: [
  { q: 'Base 最高 $120、T3 High $117.50，Pivot 點理解？', options: ['一定係 $120', '可以研究 $117.50 Pivot，同時保留 $120 作上方阻力', '用 T3 Low'], answer: 1, explain: 'Pivot 同下一阻力唔一定相同。' },
  { q: 'Entry $117.60、Stop $112.50、阻力 $120，R:R 約？', options: ['0.47', '2.0', '1.5'], answer: 0, explain: '2.40 ÷ 5.10 ≈ 0.47，規則要 2R 就 Skip。' },
  { q: 'Buffer $0.10 適用於所有股票？', options: ['係', '唔係，要視乎價格、波幅、Spread', '只適用 TSLA'], answer: 1, explain: '可以用百分比或 ATR 嘅一部分。' },
]},
'l9-c7': { title: '小測：Volume', questions: [
  { q: '最近 5 日平均 3.8M、50 日平均 10M，量縮比例？', options: ['38%', '62%', '3.8 倍'], answer: 0, explain: '3.8 ÷ 10 = 0.38。' },
  { q: '日內比較突破量，最合適用？', options: ['同 09:30 嗰支比', 'RVOL at Time（同時段平均）', '同昨日收市比'], answer: 1, explain: '日內成交量有時段規律。' },
  { q: '突破量大，但收返 Pivot 下方留長上影線？', options: ['突破成功', 'High Volume + Failed Breakout 候選', '一定再升'], answer: 1, explain: '價格行為優先，成交量係輔助。' },
]},
'l9-c8': { title: '小測：Entry 方法', questions: [
  { q: 'Buy Stop Market 嘅主要風險？', options: ['一定買唔到', '觸發後可能以更差價格成交', '冇風險'], answer: 1, explain: 'Trigger ≠ Fill。' },
  { q: '收市確認入場嘅缺點？', options: ['冇缺點', '較遲，翌日可能跳空令 R:R 改變', '一定假突破'], answer: 1, explain: '確認較多但較遲。' },
  { q: '三種 Entry 方法嘅回測結果應該？', options: ['混埋一齊計', '分開，每個方法一個 Strategy ID', '只計贏嘅'], answer: 1, explain: '唔同方法唔可以混合比較。' },
]},
'l9-c9': { title: '小測：Stop、Target、股數', questions: [
  { q: 'VCP 最常見嘅 Stop 參考？', options: ['Final Contraction Low 下方', 'Entry 下方固定 $0.05', 'T1 Low'], answer: 0, explain: '跌穿最後收縮低位，假設可能被破壞。' },
  { q: '本金 $10,000、風險 0.25%、每股風險 $2.70，最多幾股？', options: ['9 股', '25 股', '37 股'], answer: 0, explain: '⌊25 ÷ 2.70⌋ = 9。' },
  { q: '風險預算計到 31 股 × $390，但本金只有 $10,000（現金戶口）？', options: ['照買 31 股', '最多 25 股：股數取風險同資金限制較細者', '借錢買'], answer: 1, explain: '⌊10,000 ÷ 390⌋ = 25。' },
]},
'l9-c10': { title: '小測：VCP vs 其他 Setup', questions: [
  { q: 'VCP 主要觀察突破之前定之後？', options: ['之前嘅收縮', '之後嘅回測', '都唔睇'], answer: 0, explain: 'Breakout + Retest 先係睇之後。' },
  { q: 'Bull Flag 同 VCP 嘅關係？', options: ['完全互斥', 'Bull Flag 可能包含 VCP 結構，但唔係全部都係', '一定一樣'], answer: 1, explain: '要檢查逐步收縮同量縮。' },
  { q: '突破失敗前只係普通橫行，應該叫？', options: ['Failed VCP', '一般 Failed Breakout', '成功 VCP'], answer: 1, explain: '冇收縮結構就唔係 VCP。' },
]},
'l9-c11': { title: '小測：日內 VCP', questions: [
  { q: 'TSLA 5m 回調 0.62% → 0.32% → 0.14%，下一步？', options: ['即刻買', '檢查 Volume（同時段）、Pivot、上方阻力', '放棄'], answer: 1, explain: '三個百分比只係結構，未係入場訊號。' },
  { q: '中午成交量自然減少，就算 Volume Dry-Up？', options: ['係', '唔一定，要比同時段基準', '永遠唔係'], answer: 1, explain: '要分清日內季節性。' },
  { q: '價格反覆穿越橫行 VWAP，日內 VCP 點處理？', options: ['優先做', '容易係 Choppy，現階段可以 Skip', '做 Short'], answer: 1, explain: 'VWAP 係背景過濾。' },
]},
'l9-c12': { title: '小測：完整模擬交易', questions: [
  { q: 'Entry $390.20、Stop $389.40、Target $391.80，R:R？', options: ['1.0', '2.0', '3.0'], answer: 1, explain: '1.60 ÷ 0.80 = 2.0。' },
  { q: '實際 Fill $390.35，R:R 變成？', options: ['約 1.53', '仍然 2.0', '約 2.5'], answer: 0, explain: '1.45 ÷ 0.95 ≈ 1.53。' },
  { q: 'Candle 2 收返 Pivot 附近但未觸發 Stop，固定 Stop/Target 策略應該？', options: ['按原定規則管理', '將 Stop 移去 $388', '即刻加倉'], answer: 0, explain: '除非事前寫明「收返 Pivot 下方即退出」。' },
]},
'l9-c13': { title: '小測：真假 VCP', questions: [
  { q: '每次回調低位都低過上一次，係？', options: ['健康 VCP', '持續 Lower Low，結構轉弱', 'Bull Flag'], answer: 1, explain: '唔應該硬叫看漲 VCP。' },
  { q: '網站話 VCP 勝率 90%，你應該？', options: ['即刻相信', '要求定義、樣本、成本、樣本外驗證', '加大注碼'], answer: 1, explain: '冇公認通用勝率。' },
  { q: '一支 K 跌穿前低後收返，事後先叫 Shakeout，問題係？', options: ['冇問題', '用結果改名（Look-ahead），要事前寫規則', 'Shakeout 一定升'], answer: 1, explain: '同一支 K，結果唔同就叫法唔同。' },
]},
'l9-c14': { title: '小測：TradingView 設定', questions: [
  { q: '經典 VCP Layout 嘅移動平均線？', options: ['SMA 50 / 150 / 200', 'EMA 9 / 21', '冇需要'], answer: 0, explain: '對應 Trend Template。' },
  { q: '日內 VCP 嘅 Relative Volume 揀邊個模式比較單支 K？', options: ['Cumulative', 'Regular', '隨便'], answer: 1, explain: 'Regular 比較單支 K 線同時段。' },
  { q: '自動 VCP Screener 結果應該當成？', options: ['買入訊號', '初步篩選工具', '冇用'], answer: 1, explain: '唔同工具定義唔同。' },
]},
'l9-c15': { title: '小測：VCP 回測', questions: [
  { q: '回測 VCP 應該記錄邊啲候選？', options: ['只記成功突破', '所有候選，包括失敗、未突破、冇成交', '只記最靚嘅'], answer: 1, explain: '否則有 Selection Bias。' },
  { q: '100 筆日線 VCP 同 100 筆 5m VCP？', options: ['合併計 200 筆', '分開統計', '只計日線'], answer: 1, explain: '持倉時間、成本、波幅都唔同。' },
  { q: '以下邊個唔係三個最重要嘅績效指標之一？', options: ['Net Expectancy', 'Maximum Drawdown', '最大單筆盈利'], answer: 2, explain: '第三個係 Out-of-Sample 表現。' },
]},
'l9-final': { title: 'VCP Setup 畢業測驗', final: true, questions: [
  { q: '股票回調依次 20%、10%、5%，但整體長期 Downtrend，50/150/200 SMA 都向下。應該點理解？', options: ['一定係經典 Bullish VCP', '有收縮特徵，但缺乏典型上升趨勢背景', '已經確認可以買入'], answer: 1, explain: '經典看漲 VCP 要求原有升勢（Stage 2）。' },
  { q: '一個 VCP 整體最高位 $120，最後 T3 High $117.50。Pivot 應該點理解？', options: ['一定係 $120，其他位置冇用', '可以研究 $117.50 嘅最後收縮 Pivot，同時保留 $120 作上方阻力', '應該直接用 T3 Low'], answer: 1, explain: 'Pivot 同上方阻力要分開處理。' },
  { q: 'T1、T2、T3 收縮逐漸變細，但突破 Pivot 時 Volume 異常低。最佳反應？', options: ['直接認定突破必定成功', '唔可以買，因為低量突破永遠失敗', '標記成交量確認較弱，觀察能否維持突破同進一步測試'], answer: 2, explain: '成交量係輔助證據，唔係絕對規則。' },
  { q: 'TSLA 5m 開市後 Volume 高，中午自然減少。呢個就係 VCP Volume Dry-Up？', options: ['唔一定，需要比較同時段 Volume 同價格收縮', '係，只要柱愈來愈矮就算', '一定唔係，因為 5m 冇 Volume 意義'], answer: 0, explain: '日內成交量有時段規律。' },
  { q: '一個好靚嘅 VCP：Entry $120、Stop $117、下一個重要阻力 $121。你原本要求最近阻力之前至少 2R，應該？', options: ['因為係 VCP 就照買', '將 Stop 改到 $119.90，湊夠 R:R', '按照既定 R:R 規則放棄，或者研究另一個獨立策略'], answer: 2, explain: 'Stop 跟結構，唔可以為咗湊 R:R 而移。' },
  { q: '你喺歷史圖見到 Pivot 突破後升咗 15%，於是事後調整 T3，令突破價更靚。主要問題？', options: ['Look-ahead / Selection Bias', '移動平均線失效', 'Volume 指標錯誤'], answer: 0, explain: '用咗當時未知嘅結果去改規則。' },
  { q: '日內 VCP：Trigger $390.20，實際成交 $390.35，Stop $389.40，Target $391.80。你嘅規則要求成交時至少 2R，應該？', options: ['當自己喺 $390.20 買咗', '按事前規則處理（例如 Stop-Limit 上限或取消），唔可以假裝冇滑價', '將 Target 改到 $392.30'], answer: 1, explain: '實際 R:R 只有約 1.53。' },
  { q: '以下邊個最似「持續 Lower Low」嘅假 VCP？', options: ['低位 $96 → $106 → $111', '低位 $388 → $387.50 → $386.80', '高位差唔多，低位抬高'], answer: 1, explain: '低位一路下移，結構轉弱。' },
  { q: '本金 $10,000、風險 0.25%、TSLA $390、每股風險 $0.80，現金戶口最多買幾股？', options: ['31 股', '25 股', '12 股'], answer: 1, explain: '風險計 31 股，但資金只夠 ⌊10,000 ÷ 390⌋ = 25 股。' },
  { q: '學完 VCP，最合理嘅下一步係？', options: ['即刻真錢做每一個收縮', '手動畫 20–30 個歷史候選，再用固定規則回測同 Paper', '放棄 Breakout + Retest'], answer: 1, explain: '先練辨認，再驗證，最後先考慮真倉。' },
]},
});
Object.assign(window.CHECKLISTS, {
'l9-8q': { title: 'VCP 速查表：八條問題', resettable: true, items: [
  '股票原本係咪 Uptrend？（日線 Stage 2／日內 15m 偏強）',
  '有冇清晰嘅 T1、T2，甚至 T3？',
  '每次回調幅度係咪逐步減少？',
  '最後收縮期間 Volume 有冇 Dry-Up？（日內要比同時段）',
  '最後一段價格係咪變得比較緊密？',
  '我能否事前畫出清晰 Pivot？',
  '突破 Pivot 時有冇合理嘅確認證據？',
  'Entry、Stop、下一障礙同風險回報係咪合理？',
]},
'l9-tv': { title: 'TradingView 設定清單', items: [
  'Layout A（Daily）：SMA 50 / 150 / 200',
  'Layout A：Volume + Volume SMA50',
  'Layout A：加一個 QQQ 或 SPY 比較（相對強度）',
  'Layout B（5m）：Session VWAP',
  'Layout B：Relative Volume at Time（Regular）',
  'Layout B：15m 結構圖 + Daily 背景圖',
  '常用畫圖工具：Price Range、Horizontal Ray、Rectangle',
  '兩套 Layout 分開儲存，唔好撈亂規則',
]},
'l9-grad': { title: 'Level 9 畢業自我檢查', items: [
  '講得出 VCP 五個核心部分',
  '識用 Wick 極值計 T1、T2、T3，知道每個 T 由自己嘅局部高位計',
  '分得清 RS Rating 同 RSI',
  '識用 Trend Template 做背景篩選',
  '識畫 Pivot，同時標記上方阻力，計 R:R',
  '識判斷 Volume Dry-Up（日線用 50 日平均、日內用同時段）',
  '分得清三種 Entry 方法同各自取捨',
  '計得出 Stop、股數（風險同資金兩個限制）',
  '喺訓練場「VCP 定唔係 VCP？」攞到 8/10 或以上',
  '手動畫咗 20 個歷史候選 VCP，有記錄 Footprint',
  '喺回測實驗室測試過日內 VCP，有記錄結果',
]},
});
window.GLOSSARY.push(
  { term: 'VCP', zh: '波幅收縮形態', def: 'Volatility Contraction Pattern：升勢中嘅股票回調一次比一次細、成交量減少，最後收窄再突破 Pivot。由 Mark Minervini 推廣。', lv: 'l9' },
  { term: 'Contraction (T)', zh: '收縮／一次回調', def: 'VCP 入面每一次由局部高位到局部低位嘅回調，叫 T1、T2、T3…', lv: 'l9' },
  { term: 'Volume Dry-Up', zh: '成交量萎縮', def: '收縮期間（尤其最後一段）成交量明顯低過平均，可能代表賣壓減弱。', lv: 'l9' },
  { term: 'VCP Pivot', zh: 'VCP 突破參考價', def: '最後緊密整理區上方、事前識別嘅突破價格；唔一定等於 Base 最高位。', lv: 'l9' },
  { term: 'Base', zh: '整理底座', def: '兩段升勢之間嘅整理區域，VCP 係其中一種 Base。', lv: 'l9' },
  { term: 'Stage Analysis', zh: '趨勢階段分析', def: '將走勢分成 Stage 1 底部、2 升勢、3 頂部、4 跌勢。經典 VCP 喺 Stage 2 搵。', lv: 'l9' },
  { term: 'Trend Template', zh: '趨勢模板', def: 'Minervini 嘅八項趨勢篩選：50/150/200 日線排列、52 週高低位距離、RS Rating 等。', lv: 'l9' },
  { term: 'RS Rating', zh: '相對強度評級', def: '一隻股票相對其他股票嘅價格表現排名（例如 1–99），唔係 RSI。', lv: 'l9' },
  { term: 'Final Contraction Low', zh: '最後收縮低位', def: 'VCP 最後一次收縮嘅低位，常用嚟做 Stop 參考。', lv: 'l9' },
  { term: 'Breakout Volume', zh: '突破成交量', def: '突破 Pivot 時嘅成交量，日線常用 50 日平均做基準，日內用同時段 RVOL。', lv: 'l9' },
  { term: 'Footprint', zh: '形態足跡', def: '描述 Base 嘅記號，例如「7W 32/4 3T」= 7 星期、最深 32% 最淺 4%、3 次收縮。', lv: 'l9' },
  { term: 'Shakeout', zh: '洗盤', def: '短暫跌穿前低後迅速收返上去嘅走勢；要事前定規則，避免事後改名。', lv: 'l9' },
  { term: 'Cheat Entry', zh: '提早入場', def: '喺正式 Pivot 突破之前、最後收縮期間嘅提早入場方法，定義因人而異。', lv: 'l9' },
  { term: 'Bull Flag', zh: '牛旗', def: '急升（旗桿）之後短暫回調或橫行，再研究向上突破延續。', lv: 'l9' },
  { term: 'Ascending Triangle', zh: '上升三角形', def: '高位多次喺同一阻力，低位逐步抬高嘅整理形態。', lv: 'l9' },
  { term: 'Failed VCP', zh: 'VCP 突破失敗', def: '有合格收縮結構，但突破 Pivot 後守唔住，甚至跌穿最後收縮低位。', lv: 'l9' },
);
