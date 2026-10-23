/* =========================================================
 * 測驗題目同可剔清單
 * answer = 正確選項 index（由 0 開始）
 * ========================================================= */
window.QUIZZES = {
/* ---------------- Level 1–2 ---------------- */
'l0-c1': { title: '小測：時段與 R', questions: [
  { q: '課程主要研究嘅美股正常交易時段（RTH）係美東時間幾點？', options: ['04:00–09:30', '09:30–16:00', '16:00–20:00'], answer: 1, explain: 'RTH 係 09:30–16:00 ET，共 390 分鐘，即 78 支 5 分鐘 K 線。' },
  { q: '你計劃每筆最多輸 $25（1R = $25）。最後賺咗 $50，係幾多 R？', options: ['+0.5R', '+2R', '+25R'], answer: 1, explain: '$50 ÷ $25 = 2，所以係 +2R。R 令唔同股數、唔同本金嘅交易可以公平比較。' },
]},
'l0-c2': { title: '小測：K 線', questions: [
  { q: '一支 K 線有長下影線、細實體喺頂部，佢叫咩？', options: ['Shooting Star', 'Hammer', 'Marubozu'], answer: 1, explain: 'Hammer：價格曾經大跌但被買返上嚟。喺支持區出現先比較有研究價值。' },
  { q: '以下邊句最啱？', options: ['見到 Hammer 就應該即刻買', '形態嘅位置同背景比形態本身更重要', 'Doji 一定代表反轉'], answer: 1, explain: '同一個形態喺唔同位置意義完全唔同，仲要等後續確認。' },
]},
'l0-c3': { title: '小測：Volume', questions: [
  { q: '點解 RVOL 要用「同時段」比較？', options: ['因為開市同中午嘅正常成交量差好遠', '因為計算比較簡單', '因為 TradingView 只有呢個選項'], answer: 0, explain: '開市頭段成交量通常特別大，同時段比較先知道今日係咪真係異常。' },
  { q: '今日 10:00 嘅 5m Volume 係 1.6M，過去十日同時段平均 0.8M，RVOL 係？', options: ['0.5', '1.6', '2.0'], answer: 2, explain: '1.6M ÷ 0.8M = 2.0，即係平時嘅兩倍。' },
]},
'l0-c4': { title: '小測：VWAP', questions: [
  { q: '10:05 嘅 Session VWAP 應該用邊啲 K 線計？', options: ['當日全部 K 線', '當日 09:30 至 10:05 已完成嘅 K 線', '昨日全部 K 線'], answer: 1, explain: 'VWAP 只可以用當時同之前已完成嘅資料，用全日資料就係偷睇未來。' },
  { q: '價格由 VWAP 下面向上升，而你準備做 Long，VWAP 對你嚟講可能係？', options: ['一定會突破嘅位置', '可能嘅障礙，要計入回報空間', '同交易無關'], answer: 1, explain: 'Level 3 第四章例子：VWAP 喺入場同目標之間，可能令價格受阻。' },
]},
'l0-c5': { title: '小測：支持阻力', questions: [
  { q: '點解課程用「Zone」而唔係一條線？', options: ['因為市場唔會精準到一仙', '因為畫線太難', '因為 Zone 一定會守住'], answer: 0, explain: '價格反應通常喺一個範圍內發生，用區域更貼近現實。' },
  { q: '幾時畫 Support / Resistance 最啱？', options: ['睇完全日走勢之後', '開市前，用當時已知資料', '入場之後先補畫'], answer: 1, explain: '事後先畫會用咗未來資訊，令回測結果過度樂觀。' },
]},
'l0-c6': { title: '小測：市場結構', questions: [
  { q: 'LH + LL 代表乜嘢結構？', options: ['升勢', '跌勢', '一定係橫行'], answer: 1, explain: 'Lower High + Lower Low = 高位低過高位、低位低過低位，即跌勢。' },
  { q: '一個「左右各 5 支」嘅 15m Pivot High，最快幾時先確認到？', options: ['即刻', '大約 75 分鐘後', '收市後'], answer: 1, explain: '要等右邊 5 支 15m K 線完成：5 × 15 = 75 分鐘。' },
]},

/* ---------------- Level 3 ---------------- */
'l3-c1': { title: '小測：Setup 概念', questions: [
  { q: '「跌穿預定確認 K 線低位」屬於邊一層？', options: ['Signal', 'Trigger', 'Indicator'], answer: 1, explain: 'Trigger 係事前定好嘅入場觸發條件。' },
  { q: '點解「比較完整嘅模擬策略」比「見到 Shooting Star 就 Short」好？', options: ['保證賺錢', '可以重複執行、記錄同驗證', '因為用多咗指標'], answer: 1, explain: '有清楚條件嘅策略先可以測試；完整唔等於一定賺錢。' },
]},
'l3-c2': { title: '小測：開市前準備', questions: [
  { q: 'K 線反覆穿越 VWAP、冇清晰結構，屬於邊種日子？應該點做？', options: ['Trending Day，順勢追', 'Choppy Day，初學者優先觀察', 'Range Day，一定做反轉'], answer: 1, explain: 'Choppy Day 突破經常失效，No Trade 都係一個決定。' },
  { q: '開市前檢查順序最合理係？', options: ['5m → 15m → 消息', '消息 → 15m 結構 → Key Levels → 5m', '只睇 5m 就夠'], answer: 1, explain: '由大到細：先知道背景，再落到執行時間框架。' },
]},
'l3-c3': { title: '小測：Breakout + Retest', questions: [
  { q: 'Candle 1 收市突破阻力、成交量兩倍。練緊 Breakout + Retest，應該？', options: ['即刻追入', 'WAIT，等回測', '即刻 Short'], answer: 1, explain: '呢套策略要等回測同確認，唔係追突破。' },
  { q: 'TSLA 突破後直接 $385 → $387 → $390，冇回測。應該？', options: ['改做追突破', 'No Entry，接受錯過', '加大股數追'], answer: 1, explain: '錯過交易唔代表策略失敗；追突破係另一套策略，應分開測試。' },
  { q: 'Entry $386.10、Stop $384.70、Target $388.90，Reward/Risk 係？', options: ['1.0', '2.0', '2.8'], answer: 1, explain: 'Reward 2.80 ÷ Risk 1.40 = 2.0。' },
]},
'l3-c4': { title: '小測：Reversal', questions: [
  { q: 'Support Reversal 計出 2.17R，但 VWAP 喺入場上方只差約 1R。最合理係？', options: ['照做，因為 2.17R', '事前定 VWAP 附近減倉規則，或者放棄', 'VWAP 唔重要'], answer: 1, explain: '要計入目標前嘅障礙，重新評估或者放棄。' },
  { q: '初學者應該優先學邊種 Reversal？', options: ['Trend Reversal（撈底）', 'Range Reversal', '兩種一樣'], answer: 1, explain: 'Range 邊界清晰、可測試；撈底容易對抗強趨勢。' },
]},
'l3-c5': { title: '小測：假突破', questions: [
  { q: '價格升穿阻力但收返落區間，再反彈又企唔返上去，呢個形態叫？', options: ['Bear Trap', 'Bull Trap', 'Breakout + Retest'], answer: 1, explain: 'Bull Trap：向上突破失敗，返回阻力區下方。' },
  { q: '見到假突破之後，以下邊句最啱？', options: ['價格一定會向相反方向大跌', '要等向下確認，或者直接放棄', '立即 Short 最大倉位'], answer: 1, explain: '假突破唔代表一定大幅反向；仍然要確認同風險計劃。' },
]},
'l3-c6': { title: '小測：Entry Trigger', questions: [
  { q: '原本 Trigger $386.10，但價格已經升到 $387.20 你先入。應該？', options: ['照用 $386.10 計 R:R', '用 $387.20 重新計，可能放棄', '加大股數補償'], answer: 1, explain: '新 Entry 令 R:R 跌到約 0.68R，要重新評估。' },
  { q: 'Stop Order 嘅 Stop Price 係？', options: ['保證成交價', '觸發條件', '最高成交價'], answer: 1, explain: 'SEC 提醒：Stop Price 只係觸發價，成交可能偏離。' },
]},
'l3-c7': { title: '小測：止損與股數', questions: [
  { q: 'Stop Loss 應該優先根據乜嘢決定？', options: ['想輸幾多錢', '原本交易假設喺邊度失效', '固定 $0.50'], answer: 1, explain: '先定失效位，再用股數控制金額。' },
  { q: '風險預算 $25，每股風險 $1.40，最多幾多股？', options: ['17', '18', '25'], answer: 0, explain: '25 ÷ 1.40 = 17.86，向下取整 = 17 股。' },
  { q: '勝率 30%、每贏 2R、每輸 1R，期望值係？', options: ['+0.2R', '−0.1R', '+0.6R'], answer: 1, explain: '0.3 × 2 − 0.7 × 1 = −0.1R。1:2 唔保證賺錢。' },
]},
'l3-c8': { title: '小測：入場後管理', questions: [
  { q: '20 股，一半 1R 止賺、一半 2R 止賺，全部成交平均係？', options: ['2R', '1.5R', '1R'], answer: 1, explain: '0.5 × 1R + 0.5 × 2R = 1.5R。' },
  { q: '價格接近 Stop，你想將 Stop 移遠少少。呢個做法？', options: ['合理，避免被掃', '風險可能越來越大，應避免', '一定會賺'], answer: 1, explain: 'Stop 唔應該臨時向不利方向移動。' },
]},
'l3-c9': { title: '小測：幾時放棄', questions: [
  { q: 'Entry $385、Stop $383.50、上方阻力 $385.80。三個看漲訊號全部成立，應該？', options: ['一定做', '回報只有約 0.53R，可能唔值得', '加大股數'], answer: 1, explain: 'Setup 好睇唔代表值得冒險，障礙太近。' },
  { q: '「兩句話測試」係指？', options: ['入場理由 + 失效條件', '買幾多股 + 賺幾多', '同朋友傾兩句'], answer: 0, explain: '講唔出點解入場同幾時失效，就唔好勉強交易。' },
]},
'l3-c10': { title: '小測：逐支模擬', questions: [
  { q: '一筆完全跟規則嘅交易最後 −1R。點評估？', options: ['分析一定錯', '分開評估執行同結果；保留紀錄', '刪除紀錄'], answer: 1, explain: '有效策略都會有虧損；跟規則嘅虧損係正常樣本。' },
]},
'l3-c12': { title: '小測：回測', questions: [
  { q: '一支 5m K 線同時觸及 Stop 同 Target，冇更細數據。應該？', options: ['當先止賺', '標記順序不明，按保守規則處理', '當冇發生'], answer: 1, explain: '唔可以自動假設有利結果。' },
  { q: '50 筆交易 +10R，每筆成本 0.15R，扣成本後？', options: ['+10R', '+2.5R', '−2.5R'], answer: 1, explain: '50 × 0.15 = 7.5R；10 − 7.5 = 2.5R。' },
]},
'l3-c13': { title: '小測：新手錯誤', questions: [
  { q: '連輸兩筆之後最好嘅做法係？', options: ['加大第三筆股數追返', '暫停覆盤，保持固定風險', '轉做另一隻股票'], answer: 1, explain: '避免 Revenge Trading；固定風險預算。' },
]},
'l3-final': { title: 'Level 3 Setup 決策測試', final: true, questions: [
  { q: '情境 1：TSLA 阻力 $385。5m 大綠燭收 $385.60，成交量明顯增加，VWAP 向上。你專門練緊 Breakout + Retest。', options: ['立即追 Long', '等待回測或其他預先定義嘅確認', '立即 Short，因為股價太高'], answer: 1, explain: '你練緊嘅係 Breakout + Retest，突破只係第一步。要等回測守住同反彈確認，先計 Trigger、Stop、Target。追突破係另一套策略。' },
  { q: '情境 2：TSLA 喺 $380 Support 出現 Hammer，但 15m 係明顯 LH + LL，VWAP 向下。', options: ['單靠 Hammer 即刻買入', '當成已確認趨勢反轉', '暫時等待，先睇跌勢有冇停止及形成新看漲結構'], answer: 2, explain: '下跌中嘅 Hammer 唔代表跌勢完結，結構同 VWAP 都偏淡。呢個屬逆勢情境，應該等跌勢停止、形成 HL 等新證據，或者直接 Skip。' },
  { q: '情境 3：原本 Long Trigger $386，Stop $384.50，Target $389。但股價跳到 $388，你仍然未入場。', options: ['按新 Entry 重新計算風險回報，可能放棄', '照舊當自己以 $386 成交', '增加股數補償錯過嘅利潤'], answer: 0, explain: '以 $388 入場：風險 $3.50、回報只有 $1，約 0.29R。Entry Price 直接決定交易質素，應該重新計算，好大機會放棄。' },
  { q: '情境 4：你根據固定規則完成一筆 Breakout + Retest Long，但最後觸發 Stop，結果 −1R。', options: ['即刻刪除呢筆交易', '下次直接取消 Stop', '按紀錄覆盤，判斷有冇遵守規則，保留失敗樣本'], answer: 2, explain: '失敗樣本係評估策略必須嘅數據。刪除會令勝率失真；取消 Stop 會令風險無上限。' },
  { q: '情境 5：回測顯示一支 5m K 線 High 高過 Target，Low 又低過 Stop，而你冇更細價格順序資料。', options: ['當成必定先止賺', '標記先後順序不明，按事前保守規則處理', '當成無風險交易'], answer: 1, explain: 'OHLC 冇話你知 K 線內邊個價先出現。假設有利結果會高估策略，應標記並用保守方法，再做敏感度分析。' },
]},

/* ---------------- Level 4 ---------------- */
'l4-c1': { title: '小測：分析 vs 執行', questions: [
  { q: '$389 追入、Stop $384、Target $390，最後賺錢。呢個交易決策？', options: ['合理，因為賺錢', '唔合理：$5 風險博 $1 回報', '冇得評'], answer: 1, explain: '結果好唔代表決策好；要分開評估分析同執行。' },
  { q: '仲未入場，但 Setup 已失效，應該？', options: ['留住 Buy Stop 等佢觸發', '取消未成交訂單（Order Cancellation）', '改做 Short'], answer: 1, explain: '每張未成交訂單都要有取消條件。' },
]},
'l4-c2': { title: '小測：Spread 與滑價', questions: [
  { q: 'Market Buy 通常同邊一邊成交？', options: ['Bid', 'Ask', 'Last'], answer: 1, explain: '買入通常同 Ask 側嘅賣盤成交，唔保證按 Last。' },
  { q: '計劃 Entry $386.10 但成交 $386.27，Stop $384.70，Target $388.90。R:R 大約變成？', options: ['2.0', '1.68', '1.0'], answer: 1, explain: '風險 1.57、回報 2.63，2.63 ÷ 1.57 ≈ 1.68。' },
]},
'l4-c3': { title: '小測：Order 類型', questions: [
  { q: 'Stop-Limit 止損最大嘅風險係？', options: ['成交價太差', '價格跳過 Limit 可能完全賣唔出', '成交太快'], answer: 1, explain: '觸發後變 Limit 單，市場跳過咗就可能無法離場。' },
  { q: 'Time in Force 設 DAY 代表？', options: ['收市前自動平倉', '訂單只係當日有效', '可以過夜持倉'], answer: 1, explain: 'DAY 只係訂單有效期，唔會自動幫你平倉。' },
]},
'l4-c4': { title: '小測：Bracket', questions: [
  { q: '你手動沽清咗股票，下一步最重要係？', options: ['唔使理', '檢查舊 Stop / Target 有冇被取消', '再買返'], answer: 1, explain: '舊 Exit Orders 仲生效，日後可能意外開新倉。' },
]},
'l4-c5': { title: '小測：Position Sizing', questions: [
  { q: '風險 $25、費用 $2、每股風險 $1.40、滑價緩衝 $0.20，股數係？', options: ['14', '17', '16'], answer: 0, explain: '(25 − 2) ÷ (1.40 + 0.20) = 14.375 → 14 股。' },
  { q: 'Stop 距離越遠，同一風險預算下股數會？', options: ['越多', '越少', '唔變'], answer: 1, explain: '每股風險大咗，可買股數就少咗。' },
]},
'l4-c6': { title: '小測：止損深度', questions: [
  { q: 'TSLA 因消息由 $384 直接跳到 $380，Stop Market $384 會？', options: ['保證 $384 成交', '可能喺 $380 附近成交', '唔會觸發'], answer: 1, explain: 'Stop 唔能夠保證最大損失。' },
  { q: 'ATR 最合理嘅用法係？', options: ['止損一律 1×ATR', '先用結構定失效位，再用 ATR 檢查會唔會太貼', 'ATR 決定方向'], answer: 1, explain: 'ATR 唔知道邊個係重要 S/R。' },
]},
'l4-c7': { title: '小測：出場', questions: [
  { q: '一半 1R 止賺、另一半跌返原 Stop，結果係？', options: ['+1R', '0R', '−0.5R'], answer: 1, explain: '0.5 × 1R + 0.5 × (−1R) = 0R。' },
  { q: '想比較唔同出場方法，正確做法係？', options: ['同時改 Entry 同 Exit', '保持其他條件不變，每次只改 Exit Rule', '揀最好嗰次結果'], answer: 1, explain: '一次只改一樣，先知道改善嚟自邊度。' },
]},
'l4-c8': { title: '小測：持倉管理', questions: [
  { q: '日內交易輸緊錢，想「轉做 Swing 等聽日反彈」。呢個係？', options: ['靈活', '臨時改變策略同持倉風險', '專業做法'], answer: 1, explain: '持倉過夜增加跳空同消息風險。' },
]},
'l4-c9': { title: '小測：每日風險', questions: [
  { q: '帳戶由 $8,000 回到 $10,000 需要幾多回報？', options: ['20%', '25%', '30%'], answer: 1, explain: '2,000 ÷ 8,000 = 25%。' },
  { q: '今日已輸 $50（上限 $75），仲持有一筆 $25 風險嘅倉，應該？', options: ['再開新倉', '唔再開新倉', '加倉'], answer: 1, explain: '未平倉嘅潛在風險都要計入每日上限。' },
]},
'l4-c10': { title: '小測：心理', questions: [
  { q: 'FOMO 最準確嘅定義係？', options: ['買入時股價升咗好多', '交易行為偏離原定策略', '用 Market Order'], answer: 1, explain: '有測試過嘅 Momentum 策略喺急升時入場唔算 FOMO。' },
]},
'l4-c11': { title: '小測：Expectancy', questions: [
  { q: '勝率 70%、平均贏 0.5R、平均輸 1.5R，期望值？', options: ['+0.35R', '−0.10R', '+0.50R'], answer: 1, explain: '0.7 × 0.5 − 0.3 × 1.5 = 0.35 − 0.45 = −0.10R。' },
  { q: 'Gross Profit 72R、Gross Loss 55R，Profit Factor？', options: ['1.31', '0.76', '17'], answer: 0, explain: '72 ÷ 55 ≈ 1.31。' },
]},
'l4-c12': { title: '小測：回測升級', questions: [
  { q: '想等價格由下面升穿 $386.10 先買，以下邊個唔適合？', options: ['Buy Stop $386.10', '預先掛 Buy Limit $386.10', 'Buy Stop-Limit'], answer: 1, explain: '現價低過 $386.10 時，Buy Limit 會即刻用較低價成交，唔係等突破。' },
  { q: 'PDH 應該用？', options: ['當日日 K High', '上一個已完成交易日嘅 High', '盤前 High'], answer: 1, explain: '當日 High 喺開市時未知道。' },
]},
'l4-c13': { title: '小測：IBKR 實務', questions: [
  { q: '成交完成（Execution）同結算（Settlement）係咪同一樣？', options: ['係', '唔係，美加股票一般 T+1 結算', '唔係，一般 T+3'], answer: 1, explain: 'Cash Account 可能受未結算資金限制。' },
  { q: '冇訂閱即時數據嘅 IBKR Paper 帳戶，部分美股數據可能？', options: ['延遲約 15 分鐘', '比真實更快', '完全一樣'], answer: 0, explain: '混用實時圖表同延遲 Paper 帳戶會對唔上。' },
]},
'l4-c14': { title: '小測：完整模擬', questions: [
  { q: '價格到 +1R，但 v1.0 冇 Break-even 規則，你應該？', options: ['臨時移 Stop', '跟 v1.0；想試就另建 v1.1 測試', '即刻平倉'], answer: 1, explain: '臨時改規則會令測試結果唔一致。' },
]},
'l4-c15': { title: '小測：Journal', questions: [
  { q: 'Entry $385、Stop $384、最高 $386.80、最低 $384.60、Exit $385.20。MFE 係？', options: ['+0.2R', '+1.8R', '0.4R'], answer: 1, explain: '386.80 − 385 = 1.80，÷ 1R($1) = +1.8R。' },
]},
'l4-final': { title: 'Level 4：交易執行及風險測試', final: true, questions: [
  { q: '題目 1：TSLA Last $386.05、Bid $386.02、Ask $386.08。你提交 Market Buy。以下邊句最準確？', options: ['一定按照 Last $386.05 成交', '通常會向賣盤成交，但實際價格唔保證', '一定按照 Bid $386.02 成交'], answer: 1, explain: 'Market Buy 通常同 Ask 側成交；數量、流動性同變動都可能令實際成交價唔同。' },
  { q: '題目 2：你 Long TSLA，Sell Stop $384.70，但價格突然跳到 $384.20。應該點理解？', options: ['券商必須按照 $384.70 成交', 'Stop Market 可能按較差價格成交', 'Stop-Limit 可以保證一定成交'], answer: 1, explain: 'Stop Price 只係觸發條件，觸發後以市價成交，可能喺 $384.20 或更差。Stop-Limit 反而可能完全唔成交。' },
  { q: '題目 3：本金 $10,000，每筆風險預算 $25。Entry $386、Stop $384，暫時不計成本，單靠風險預算可買幾多整股？', options: ['12 股', '25 股', '50 股'], answer: 0, explain: '每股風險 $2，25 ÷ 2 = 12.5 → 12 股。' },
  { q: '題目 4：你原本測試固定 2R Target，但見到價格升到 +1R，突然將 Stop 移去 Break-even。呢個做法最大問題係？', options: ['Break-even 永遠唔會被觸發', '臨時改變退出規則，令測試結果不一致', '移動 Stop 一定會增加盈利'], answer: 1, explain: 'Break-even 係一個需要獨立測試嘅規則（v1.1），唔應該臨場加入。' },
  { q: '題目 5：一套策略勝率 70%，但平均贏 +0.5R、平均輸 −1.5R。未計成本，期望值係？', options: ['+0.35R', '−0.10R', '+0.50R'], answer: 1, explain: '0.7 × 0.5 − 0.3 × 1.5 = −0.10R。高勝率都可以係負期望值。' },
  { q: '題目 6：你用 5m 歷史數據回測，一支 Candle 同時觸及 Target 同 Stop，但無法知道先後。應該點處理？', options: ['當做先止賺', '按事前保守規則處理或取得更細數據', '當作從未發生'], answer: 1, explain: '標記 Intrabar Sequence Unknown，用保守方法並做敏感度分析，或者用 1 分鐘數據核對。' },
]},

/* ---------------- Level 5 ---------------- */
'l5-c1': { title: '小測：System', questions: [
  { q: '你將 RVOL 門檻由 1.5 改成 2.0，應該點記錄？', options: ['直接改 v1.0', '記錄為新版本，例如 v1.1', '唔使記錄'], answer: 1, explain: '版本管理先可以知道邊個改動有效。' },
]},
'l5-c2': { title: '小測：量化規則', questions: [
  { q: 'H = 386、L = 385、C = 385.8，CLV 係？', options: ['0.6', '−0.6', '0.8'], answer: 0, explain: '(2 × 385.8 − 386 − 385) ÷ 1 = 0.6，收喺上半部。' },
  { q: 'TradingView RVOL at Time 要比較單支 5m 成交量，應揀？', options: ['Cumulative 模式', 'Regular 模式', '冇分別'], answer: 1, explain: 'Cumulative 會比較由開市累積嘅成交量。' },
]},
'l5-c3': { title: '小測：數據', questions: [
  { q: '時間戳 09:30 嘅 5m K 線（開始時間標記）幾時先可以用佢嘅 Close？', options: ['09:30', '09:35 之後', '收市後'], answer: 1, explain: '佢 09:35 先完成，提早用就係前視偏差。' },
  { q: '正常完整交易日 RTH 有幾多支 5m K 線？', options: ['72', '78', '96'], answer: 1, explain: '390 分鐘 ÷ 5 = 78。' },
]},
'l5-c4': { title: '小測：資料整理', questions: [
  { q: '發現某支 K 線缺失，最好做法係？', options: ['用上一支 Candle 補上', '標記缺漏，唔好憑空製造數據', '刪除成日'], answer: 1, explain: '亂補會製造唔存在嘅訊號。' },
]},
'l5-c5': { title: '小測：狀態機', questions: [
  { q: 'Trigger $386.10，下一支 K 線最高 $386.00，結果係？', options: ['已入場', 'No Fill', '當 $386.00 入場'], answer: 1, explain: '冇觸發就冇成交。' },
  { q: '點解要有 Candidate Ledger？', options: ['靚啲', '知道有冇揀選偏差、每個 Filter 嘅影響', '冇用'], answer: 1, explain: '只記成交交易會失去大量資訊。' },
]},
'l5-c6': { title: '小測：成本', questions: [
  { q: 'Entry Fill 386.22、Stop 384.70、Exit 384.48、14 股、費用 $2，Net R 約？', options: ['−1.00R', '−1.24R', '−0.80R'], answer: 1, explain: '−26.36 ÷ 21.28 ≈ −1.24R。唔好硬記成 −1R。' },
]},
'l5-c7': { title: '小測：Journal', questions: [
  { q: '幾時記錄一個 Setup？', options: ['知道結果之後', '播放下一支 K 線之前', '收市後揀靚嘅記'], answer: 1, explain: '先記錄，再睇結果，避免事後美化。' },
]},
'l5-c8': { title: '小測：統計', questions: [
  { q: '平均贏 2R、平均輸 1R、每筆成本 0.15R，打和勝率約？', options: ['33.3%', '38.3%', '50%'], answer: 1, explain: 'p = 1.15 ÷ 3 ≈ 38.33%。' },
  { q: '100 筆、勝率 45%，95% 信賴區間大約？', options: ['44–46%', '35–55%', '0–100%'], answer: 1, explain: 'SE ≈ 4.97%，±1.96 × SE ≈ ±9.7%。' },
]},
'l5-c9': { title: '小測：Drawdown', questions: [
  { q: '兩套策略都賺 +20R，最大回撤 −5R 同 −18R，邊個較易執行？', options: ['−18R 嗰套', '−5R 嗰套', '一樣'], answer: 1, explain: '同樣回報，回撤細啲心理同資金壓力都細。' },
]},
'l5-c10': { title: '小測：Regime', questions: [
  { q: '以下邊個條件喺 09:45 入場時已經知道？', options: ['今日最終 High', '15m 最近已確認 HH + HL', '今日收市係大陽燭'], answer: 1, explain: '只可以用入場當刻已知嘅資料分類。' },
]},
'l5-c11': { title: '小測：Overfitting', questions: [
  { q: 'RVOL 1.49 大蝕、1.50 大賺、1.51 又大蝕，代表？', options: ['1.50 係神奇數字', '可能依賴歷史噪音，要小心', '應該即刻用'], answer: 1, explain: '穩健策略喺鄰近參數都應該表現接近。' },
]},
'l5-c12': { title: '小測：樣本外', questions: [
  { q: '睇完 Test 結果再修改策略，原本 Test 資料？', options: ['仍然獨立', '已變成開發資料，唔再獨立', '可以刪除'], answer: 1, explain: '要再驗證就要另一段未用過嘅資料。' },
]},
'l5-c13': { title: '小測：Forward', questions: [
  { q: '40 個訊號，30 次按規則完成，Compliance 係？', options: ['30%', '75%', '133%'], answer: 1, explain: '30 ÷ 40 = 75%。' },
]},
'l5-c14': { title: '小測：完整案例', questions: [
  { q: 'RVOL 所需歷史資料未取得，該條件應標記為？', options: ['PASS', 'UNKNOWN', 'FAIL 並刪除'], answer: 1, explain: '唔知就係唔知，唔可以當通過。' },
]},
'l5-final': { title: 'Level 5 — Strategy Validation Exam', final: true, questions: [
  { q: '問題 1：你發現 TSLA 某日升得非常勁，於是事後將嗰日標記為 Trending Day，並用呢個標籤篩選上午買入訊號。最大問題係？', options: ['用咗入場當時未必知道嘅全日結果', 'Trending Day 永遠唔應該買入', 'VWAP 無法用於 Trending Day'], answer: 0, explain: '09:45 時根本唔知道全日會點走。Regime 必須用入場當刻已知資料定義。' },
  { q: '問題 2：你喺歷史圖上找到 20 個漂亮成功 Breakout，但冇記錄失敗突破。會導致乜問題？', options: ['提高 VWAP 準確性', 'Selection Bias，策略表現可能被高估', '令交易佣金下降'], answer: 1, explain: '只揀成功例子，勝率同期望值都會被嚴重美化。' },
  { q: '問題 3：一支 5m Candle 同時觸及止損同止賺，冇更細數據。合理做法係？', options: ['一律當止賺', '標記先後不明，按固定保守方式處理或取得更細數據', '刪走所有虧損案例'], answer: 1, explain: '標記 AMBIGUOUS，用保守規則同敏感度分析。' },
  { q: '問題 4：策略勝率 40%，平均贏 1.8R，平均輸 1R，每筆成本 0.15R。期望值大約係？', options: ['+0.12R', '−0.03R', '+0.57R'], answer: 1, explain: '0.4 × 1.8 − 0.6 × 1 − 0.15 = 0.72 − 0.6 − 0.15 = −0.03R。' },
  { q: '問題 5：你測試 27 種參數組合，揀出歷史表現最好一套。下一步最重要係？', options: ['直接使用真錢', '用相同歷史資料重新宣布結果', '使用未參與參數選擇嘅樣本外資料驗證'], answer: 2, explain: '揀「最好」本身已經用咗嗰段資料，需要獨立樣本確認。' },
  { q: '問題 6：一套策略喺 IBKR Paper Trading 表現理想，代表？', options: ['有值得研究嘅模擬證據，但成交同真實市場可能不同', '已保證真實交易盈利', 'Stop 價一定可以成交'], answer: 0, explain: 'Paper 成交以 Order Book 頂部模擬，同真實深度同 Stop 行為可能唔同。' },
  { q: '問題 7：你最初規定最多等六支 5m Candle 回測，但某次第九支先回測而且最後升好多。應該？', options: ['當成 v1.0 成功交易', '按 v1.0 記錄過期，另行研究九支版本', '直接修改舊有紀錄'], answer: 1, explain: '跟 v1.0 規則記錄；九支係另一個版本（v1.x），要獨立測試。' },
  { q: '問題 8：回測樣本正期望值 +0.10R，但加入較不利滑價後變成 −0.05R。最佳理解係？', options: ['證明策略一定有效', '只應用理想成本模型', '策略對成本敏感，需要進一步驗證實際可執行性'], answer: 2, explain: '對成本敏感嘅策略，實際執行好容易由正變負。' },
]},

/* ---------------- 實戰問答 ---------------- */
'qa-c1': { title: '小測：AAPL 畫線檢討', questions: [
  { q: '$346.11 同 $347.75 兩個阻力，對即日交易最好點處理？', options: ['合併成一個 $346–348 大框', '分開畫：較近 $346.0–346.2、較高 $347.5–347.9', '只畫 $347.75，因為係最高'], answer: 1, explain: '兩組分得開嘅價格反應應該分開觀察，唔好為包晒所有 Wick 拉一個大框。' },
  { q: '分析 19 號開市頭 15 分鐘，可唔可以用 19 號下午先出現嘅低位畫 Support？', options: ['可以，反正最後都會出現', '唔可以，咁係 Look-ahead Bias', '只可以用一半'], answer: 1, explain: '開市前只可以用截至 16 號收市已知嘅資料；即日結構要隨 K 線完成先加入。' },
]},
'qa-c2': { title: '小測：Wick vs Body', questions: [
  { q: '上一交易日 High $346.65、Close $346.10，PDH 係？', options: ['$346.10', '$346.65', '$346.38（平均）'], answer: 1, explain: 'PDH / PDL 係客觀水平，用包含影線嘅真正最高最低價。' },
  { q: '三次高位喺 $346.30–346.60，另外一次因突發消息衝到 $347.80。畫阻力 Zone 時？', options: ['一定要拉到 $347.80', '可以將 $347.80 當獨立極端參考，Zone 唔使拉咁闊', '刪除所有影線只睇 Body'], answer: 1, explain: 'Zone 要反映重複出現嘅反應，唔係無條件包晒全部 High / Low。' },
  { q: '以下邊句啱？', options: ['Zone 下緣減 $0.10 就係 Stop', 'Zone 同 Stop 係兩樣嘢：Zone 係可能反應區，Stop 係假設失效位', 'Body 永遠比 Wick 重要'], answer: 1, explain: '三個原則之三：S/R Zone 同 Stop Loss 唔係同一樣嘢。' },
]},
'qa-c3': { title: '小測：Zone 闊度、目標、止損', questions: [
  { q: 'Zone 應該畫幾闊？', options: ['一律 $0.40', '由價格反應分布、波幅同時間框架決定', '愈闊愈安全'], answer: 1, explain: '先搵真正嘅價格反應，再決定闊度。' },
  { q: 'Entry $350.95、Stop $349.75、下一阻力前 Target $351.90。應該？', options: ['將 Stop 縮到 $350.80 湊夠 2R', '約 0.79R，唔符合 2R 要求 → Skip', '將 Target 拉到 $354'], answer: 1, explain: '唔可以為咗 R:R 好睇而亂移 Stop 或者無視中途阻力。' },
  { q: '股價已經創歷史新高，上面冇歷史阻力。Target 點諗？', options: ['照畫一條「歷史阻力」', '可研究 ATR、整數位、Measured Move，但唔好假裝係歷史阻力；唔清楚可以唔交易', '冇目標就唔使止損'], answer: 1, explain: '計算出嚟嘅目標同經歷史測試嘅阻力性質唔同。' },
]},
'qa-c4': { title: '小測：搵唔到 Entry', questions: [
  { q: 'Replay 一整日都冇符合條件嘅 Entry，最後 No Trade。呢個結果？', options: ['一定係分析錯', '可以係完全正確嘅結果', '應該降低標準搵一筆'], answer: 1, explain: '市場冇提供你練緊嘅 Setup，No Trade 就係正確執行。' },
  { q: '16 號下午例子：Entry $342.20、Stop $340.50、Target $343.80，策略要求最少 2R。應該？', options: ['做，因為之後真係反彈', 'Skip，R:R 只有約 0.94', '將 Target 改 $346 再做'], answer: 1, explain: '方向分析對，都可能因為入場太遲、止損太遠、障礙太近而冇合適交易。' },
  { q: '19 號 Session VWAP 應該點計？', options: ['沿用 16 號收市 VWAP', '由 19 號開市重新累積計算', '用 16 同 19 號平均'], answer: 1, explain: 'Session VWAP 每個交易時段重新計算。' },
]},
};

/* =========================================================
 * 可剔清單：items 或 groups
 * ========================================================= */
window.CHECKLISTS = {
'l0-combo': { title: 'Level 2 綜合判斷五問', items: [
  '訊號係咪出現喺事前畫好嘅 Key Level 附近？',
  '15m 結構支持呢個方向嗎？',
  '成交量（RVOL）有冇配合？',
  '價格同 VWAP 嘅關係支持呢個方向嗎？',
  '目標方向前面有冇太近嘅障礙？',
]},
'l3-premarket': { title: '開市前清單', resettable: true, items: [
  '查咗今日有冇財報、CPI、非農、Fed 等重大事件',
  '檢查咗有冇明顯 Gap Up / Gap Down',
  '15m 結構：HH+HL / LH+LL / 橫行（已判斷）',
  '畫好 PDH、PDL',
  '畫好 PMH、PML',
  '畫好明顯 15m Swing High / Low',
  '切返 5m，只保留 Candle + Volume + VWAP + Key Levels',
  '決定今日主要研究邊一套 Setup',
]},
'l3-pretrade': { title: '入場前 10 秒檢查', resettable: true, items: [
  '我講得出入場理由（第一句）',
  '我講得出失效條件（第二句）',
  'Entry、Stop、Target、股數已經寫低',
  '用實際可得價格計過 R:R，仍然符合最低要求',
  '目標前冇太近嘅障礙（VWAP、阻力）',
  '市場唔係 Choppy／唔係重大消息時段',
  '今日未到每日虧損上限',
]},
'l3-plan': { title: 'Level 3 四星期訓練計劃', groups: [
  { title: '第一星期：只研究 Breakout + Retest', items: ['Day 1｜找出 10 個突破阻力嘅歷史例子', 'Day 2｜分辨有效突破同假突破', 'Day 3｜尋找突破後回測', 'Day 4｜為每個例子寫 Entry Trigger', 'Day 5｜畫 Stop，同下一個阻力 Target', 'Day 6｜記錄成功同失敗 Setup', 'Day 7｜覆盤全部案例，檢查自己有冇偷睇未來'] },
  { title: '第二星期：只研究 Range Reversal', items: ['Day 8｜尋找明顯 Range', 'Day 9｜手動標記 Range 支持同阻力', 'Day 10｜尋找 Hammer、Rejection、Engulfing', 'Day 11｜觀察後續有冇形成 HL / LH', 'Day 12｜加入 Volume、VWAP 背景', 'Day 13｜制定完整模擬 Entry / Stop / Target', 'Day 14｜覆盤策略適合及不適合嘅市場環境'] },
  { title: '第三星期：只研究 Failed Breakout / Breakdown', items: ['Day 15｜尋找十個假突破例子', 'Day 16｜練習辨認突破失敗', 'Day 17｜觀察失敗後嘅市場結構', 'Day 18｜分析 VWAP 同 Volume', 'Day 19｜設定失效條件', 'Day 20｜使用 Replay 記錄模擬交易', 'Day 21｜覆盤 Bull Trap / Bear Trap 結果'] },
  { title: '第四星期：完整 Trading System', items: ['Day 22｜決定只選一套 Setup 作主要練習', 'Day 23｜寫出完整交易規則', 'Day 24｜規定入場、止損、目標及 No-Trade 條件', 'Day 25｜開始進行連續樣本 Replay', 'Day 26｜記錄每筆 R、成交量、VWAP、市場類型', 'Day 27｜檢查有冇違反規則', 'Day 28｜初步整理結果，決定需要延長測試嘅部分'] },
]},
'l3-grad': { title: 'Level 3 畢業自我檢查', items: [
  '可以分辨 Trending、Range、Choppy 市場',
  '可以事前畫好重要支持同阻力',
  '知道三套 Setup 適合乜嘢市況',
  '可以分辨 Signal、Setup、Confirmation、Trigger',
  '有能力事前制定 Entry、Stop、Target',
  '可以根據實際價格計算 Reward / Risk',
  '知道乜嘢情況應該 WAIT、PLAN 或 SKIP',
  '能夠用 Replay 避免偷睇未來',
  '能夠記錄失敗交易而唔係只記錄成功',
  '可以用 Win Rate、Avg Win/Loss、Expectancy 初步評估策略',
]},
'l4-kill': { title: '個人 Kill Switch（任何一項出現就停止開新倉）', items: [
  '當日達到虧損上限',
  '已經超過預設交易次數',
  '發現自己無法遵守 Entry 規則',
  '券商報價延遲或數據不同步',
  'Bracket Order 出現異常而未查明',
  '出現重大突發消息，原本策略環境改變',
  '電腦、網絡或者交易平台出問題',
  '我已經知道券商緊急平倉、取消訂單同支援聯絡方法',
]},
'l4-fillcheck': { title: '成交後即刻確認', resettable: true, items: [
  'Parent Order 已經成交？',
  '實際數量是否 14 股？',
  'Stop 是否已生效？',
  'Target 是否已生效？',
  '相關訂單有效期係咪符合日內計劃？',
]},
'l4-weekly': { title: '每星期覆盤', resettable: true, items: [
  '哪一種 Setup 出現最多？',
  '哪一種 Setup 扣除成本後表現較好？',
  '哪一種市場類型最容易連續虧損？',
  '成交價格平均偏離計劃幾多？',
  '有幾多交易因為 Rule Violation 失敗？',
  '止損距離是否經常過近？',
  'Target 是否經常被前方 S/R 擋住？',
  '有冇利用事後資料令回測變得過度樂觀？',
]},
'l4-plan': { title: 'Level 4 四星期訓練', groups: [
  { title: 'Week 1：訂單操作（Paper Trading）', items: ['能夠建立 Parent Buy Order', '加入 Stop Loss 同 Profit Taker', '檢查三張訂單之間嘅關係', '確認 Parent 未成交同已成交時，Exit Orders 嘅狀態', '修改及取消訂單', '知道點樣完全平倉，並檢查有冇剩餘未成交訂單'] },
  { title: 'Week 2：Position Sizing', items: ['每日用五個歷史 Setup 計 Entry、Stop、每股風險', '計模擬股數、所需本金', '計 Target 同 Reward / Risk', '加入不同滑價及佣金假設', '總共完成至少 20 個不同情境'] },
  { title: 'Week 3：Trade Management', items: ['只選 Breakout + Retest Long', '使用 Bar Replay', '每次事前寫 Entry Trigger、Stop、Target、Quantity、取消條件', '播放未來 K 線，唔一邊睇一邊改規則', '冇符合條件就如實記錄 No Trade'] },
  { title: 'Week 4：用數據分析自己', items: ['總交易數目、Win Rate', 'Avg Winner、Avg Loser', 'Expectancy、Profit Factor', '最大回撤、最大連敗', '有幾多次違反規則', '成交成本對整體結果有幾大影響'] },
]},
'l4-grad': { title: 'Level 4 十個重點', items: [
  '分清分析正確同交易執行正確',
  '明白 Bid、Ask、Spread 同 Slippage',
  '知道 Market、Limit、Stop、Stop-Limit 嘅真正風險',
  '能夠喺模擬平台正確建立及檢查 Bracket Order',
  '根據風險預算同技術止損計算股數',
  '用市場結構界定 Stop，而唔係隨意選擇金額',
  '比較 Fixed Target、Partial Exit、Trailing Stop',
  '建立每日虧損上限及停止交易規則',
  '計算 Expectancy、Profit Factor 同 Drawdown',
  '建立可回測、可記錄、可修訂嘅策略版本',
]},
'l5-pass': { title: '策略研究流程檢查', items: [
  '規則能由其他人獨立理解及重複',
  '原始數據完整程度已檢查',
  '冇明顯使用未來資料',
  '符合條件嘅失敗交易有被保留',
  '計入合理成交成本',
  '分別有樣本內同樣本外結果',
  '對參數及滑價做過敏感度分析',
  '回撤同連敗符合事前訂定嘅風險承受條件',
  '之後 Forward Paper Trading 冇發現重大執行差異',
]},
'l5-plan': { title: 'Level 5 三十日實踐計劃', groups: [
  { title: 'Week 1：建立正確數據與規則', items: ['Day 1｜建立 TSLA-BR-LONG-v1.0（所有主要規則寫清楚）', 'Day 2｜TradingView 匯出 CSV（有可核對嘅原始資料）', 'Day 3｜時區同 RTH 整理（K 線時間正確）', 'Day 4｜OHLCV Quality Check（無未處理嘅重複或異常）', 'Day 5｜Session VWAP 計算（新交易日正確重置）', 'Day 6｜RVOL at Time（固定歷史同時段比較方法）', 'Day 7｜首次人工 Replay（能記錄全部候選 Setup）'] },
  { title: 'Week 2：正式回測', items: ['Day 8｜掃描 Breakout（冇事後補畫水平）', 'Day 9｜掃描 Retest（每個候選均有等待期限）', 'Day 10｜記錄 Confirmation（冇用未完成 K 線）', 'Day 11｜記錄 Entry Trigger（價格、時間及訂單模型清晰）', 'Day 12｜記錄 Stop / Target（有客觀失效依據）', 'Day 13｜處理 Slippage（計入不同成本情境）', 'Day 14｜覆盤（可以重現每個模擬決定）'] },
  { title: 'Week 3：統計與系統分析', items: ['Day 15｜Win Rate / Avg Win / Avg Loss（數據正確）', 'Day 16｜Expectancy / Profit Factor（使用 Net P&L）', 'Day 17｜Drawdown / Losing Streak（能量化回撤）', 'Day 18｜MFE / MAE（分辨有利及不利波幅）', 'Day 19｜Market Regime 分類（只使用當時已知資料）', 'Day 20｜Cost Stress Test（測試不同成交成本）', 'Day 21｜第一份回測報告（記錄限制及不確定性）'] },
  { title: 'Week 4：獨立驗證與 Forward Testing', items: ['Day 22｜固定 v1.0 參數，唔再事後修改', 'Day 23｜準備未參與優化嘅歷史資料', 'Day 24｜執行 Out-of-Sample 測試', 'Day 25｜比較樣本內外結果', 'Day 26｜檢查最大回撤及成本敏感度', 'Day 27｜建立 Paper Trading 流程', 'Day 28｜練習真正未知行情中識別 Setup', 'Day 29｜檢查訂單及風險執行能力', 'Day 30｜完成研究總結，決定需要繼續測試乜'] },
]},
'qa-replay-review': { title: 'Replay 完成後評分表', resettable: true, items: [
  '有事前畫好 S/R',
  '畫線只用咗當刻可得資訊（冇 Look-ahead Bias）',
  '有出現指定 Setup（冇都可以係正確 No Trade）',
  'Setup 有出現 Confirmation（冇就繼續等待係合理）',
  '有觸發 Entry（冇成交就唔計交易）',
  'Risk / Reward 合理（唔合理就 Skip）',
  '全程按固定規則執行',
]},
'l5-grad': { title: 'Level 5 畢業自我檢查', items: [
  '可以取得並整理真實 5m OHLCV 歷史資料',
  '可以檢查交易日期、時間戳、RTH 同數據完整性',
  '可以使用當時可得資訊計算 VWAP 同 RVOL',
  '可以寫出客觀 Breakout + Retest 規則',
  '能夠逐支 Replay 而唔偷睇未來',
  '可以分開記錄全部候選訊號及已成交交易',
  '可以處理成交滑價、成本及同一支 Candle 內嘅不確定性',
  '能夠計算 Net Expectancy、Profit Factor、Drawdown',
  '能夠根據當刻資訊分類 Market Regime',
  '知道點樣避免 Overfitting 同 Selection Bias',
  '完成樣本外驗證同成本敏感度分析',
  '能夠用 Paper Trading 按固定規則進行未知行情測試',
]},
};
