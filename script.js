const hands = [
  // --- 1問目（初級） ---
  {
    level: "🔰 初級",
    position: "Hero (BTN) vs Villain (BB)",
    preflop: "Heroが2.5BBオープン、Villainがコール。",
    effStack: "97.5 BB",
    heroHand: '<div class="card s">A♠</div><div class="card h">A♥</div>',
    streets: [
      {
        name: "Flop",
        pot: "5.5 BB",
        board: '<div class="card c">K♣</div><div class="card d">7♦</div><div class="card s">2♠</div>',
        prompt: "フロップ: 相手はチェックしました。あなたは最強のポケットペアを持っています。",
        options: [
          { text: "ベットする", isCorrect: true, evLoss: 0, freq: 100, type: "bet", 
            outcome: "▶ 相手のアクション: あなたのベットに対し、相手はフォールドしました。\nあなたの勝利でハンド終了です。",
            explanation: "ボードのKを持っている相手からチップを引き出せるため、必ずベットしましょう。" },
          { text: "チェックする", isCorrect: false, evLoss: -1.5, freq: 0, type: "check", 
            outcome: "▶ 結果: あなたはチェックしました。（※レール方式のため、GTO推奨の「ベット」を選び、相手がフォールドしたとして次のハンドへ進みます）",
            explanation: "チェックするとチップを稼ぐチャンスを逃してしまいます。" },
          { text: "フォールドする", isCorrect: false, evLoss: -5.5, freq: 0, type: "check", 
            outcome: "▶ 結果: あなたはフォールドしました。",
            explanation: "相手はベットすらしていません。タダで次のカードを見られる状況で自分から降りるのはあり得ません。" }
        ]
      }
    ]
  },
  // --- 2問目（初級） ---
  {
    level: "🔰 初級",
    position: "Hero (BB) vs Villain (BTN)",
    preflop: "BTNが2.5BBオープン、Hero(BB)がコール。",
    effStack: "97.5 BB",
    heroHand: '<div class="card h">8♥</div><div class="card c">9♣</div>',
    streets: [
      {
        name: "Flop (Action 1)",
        pot: "5.5 BB",
        board: '<div class="card s">A♠</div><div class="card d">Q♦</div><div class="card c">2♣</div>',
        prompt: "フロップ: OOP（先にアクションする立場）のあなたからです。何も役ができていません。どうしますか？",
        options: [
          { text: "チェック", isCorrect: true, evLoss: 0, freq: 100, type: "check", 
            outcome: "▶ 相手のアクション: あなたがチェックすると、相手はハーフポット（2.7BB）をベットしてきました。\nあなたに再びアクションが回ります。",
            explanation: "役もなく、ポジションも悪いためまずはチェックして様子を見ます。" },
          { text: "小さくベット", isCorrect: false, evLoss: -1.8, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたはベットしました。（※GTO推奨の「チェック」を選び、相手がベットしてきたとして進行します）",
            explanation: "何も当たっていない状態で自分からチップを賭けるのは無謀です。" },
          { text: "大きくベット", isCorrect: false, evLoss: -3.0, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは大きくベットしました。（※GTO推奨の「チェック」を選んで進行します）",
            explanation: "完全なブラフになりますが、相手にAやQを持たれていた場合に大損します。" }
        ]
      },
      {
        name: "Flop (Action 2)",
        pot: "5.5 BB",
        board: '<div class="card s">A♠</div><div class="card d">Q♦</div><div class="card c">2♣</div>',
        prompt: "フロップ: あなたがチェックすると、相手がハーフポット（2.7BB）をベットしてきました。",
        options: [
          { text: "フォールド（降りる）", isCorrect: true, evLoss: 0, freq: 100, type: "check", 
            outcome: "▶ 結果: あなたはフォールドしました。\n相手がポットを獲得し、ハンド終了です。",
            explanation: "勝てる見込みがないボードでチップを支払うのは無駄遣いです。素直に諦めましょう。" },
          { text: "コール（ついていく）", isCorrect: false, evLoss: -2.7, freq: 0, type: "check", 
            outcome: "▶ 結果: あなたはコールしました。（※GTO推奨の「フォールド」を選んだとしてハンド終了します）",
            explanation: "今後のストリートで強くなる見込みも薄いため、コールはチップを捨てるのと同じです。" },
          { text: "レイズ（強気に上乗せ）", isCorrect: false, evLoss: -4.5, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたはレイズしました。（※GTO推奨の「フォールド」を選んだとしてハンド終了します）",
            explanation: "ブラフでレイズしても、相手がAを持っていたらコールされてさらにチップを失います。" }
        ]
      }
    ]
  },
  // --- 3問目（中級） ---
  {
    level: "⚔️ 中級",
    position: "Hero (BTN) vs Villain (BB)",
    preflop: "Heroが2.5BBオープン、Villainがコール。",
    effStack: "97.5 BB",
    heroHand: '<div class="card h">A♥</div><div class="card h">K♥</div>',
    streets: [
      {
        name: "Flop",
        pot: "5.5 BB",
        board: '<div class="card h">J♥</div><div class="card h">7♥</div><div class="card c">2♣</div>',
        prompt: "フロップ: 相手はチェックしました。ナッツフラッシュドロー＋2オーバーです。",
        options: [
          { text: "Check", isCorrect: false, evLoss: -0.6, freq: 20, type: "check", 
            outcome: "▶ 結果: あなたはチェックしました。（※GTO推奨の「Bet 50%」に対し相手がコールしたとして進行します）",
            explanation: "チェックして無料のカードを見るのは、この強力なエクイティを活かしきれていません。" },
          { text: "Bet 33%", isCorrect: false, evLoss: -0.2, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは安く打ちました。（※GTO推奨の「Bet 50%」に対し相手がコールしたとして進行します）",
            explanation: "悪くはありませんが、ドローの価値を最大限引き出すには少しサイズが足りません。" },
          { text: "Bet 50%", isCorrect: true, evLoss: 0, freq: 80, type: "bet", 
            outcome: "▶ 相手のアクション: 相手はコールしました。\nターンへ進みます。",
            explanation: "強力なドローは、バリューとブラフの両方の性質を持つため、積極的にベットしてポットを膨らませます。" },
          { text: "Bet 100%", isCorrect: false, evLoss: -0.8, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたはポット額を打ちました。（※GTO推奨の「Bet 50%」を選んで進行します）",
            explanation: "大きすぎます。相手の弱い手をすべて降ろしてしまい、強い手にだけコールされてしまいます。" }
        ]
      },
      {
        name: "Turn",
        pot: "11.0 BB",
        board: '<div class="card h">J♥</div><div class="card h">7♥</div><div class="card c">2♣</div><div class="card s">4♠</div>',
        prompt: "ターン: あなたのフロップでのベットに対し、相手はコールしました。4♠が落ち、相手は再度チェックしてきました。",
        options: [
          { text: "Check", isCorrect: false, evLoss: -1.2, freq: 10, type: "check", 
            outcome: "▶ 結果: あなたはチェックしました。（※GTO推奨の「Bet 75%」に対し相手がフォールドしたとしてハンド終了します）",
            explanation: "ここで諦めてしまうと、フロップでのベットがただの無駄になってしまいます。" },
          { text: "Bet 33%", isCorrect: false, evLoss: -0.5, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは小さく打ちました。（※GTO推奨の「Bet 75%」に対し相手がフォールドしたとしてハンド終了します）",
            explanation: "安すぎます。相手のミドルペア等に簡単にコールされてしまいます。" },
          { text: "Bet 75%", isCorrect: true, evLoss: 0, freq: 90, type: "bet", 
            outcome: "▶ 相手のアクション: 相手はフォールドしました。\nあなたの勝利でハンド終了です。",
            explanation: "ターンのブランクカードでは、ドローの強さを盾にダブルバレルを打ちます。" },
          { text: "Overbet 150%", isCorrect: false, evLoss: -1.8, freq: 0, type: "bet", 
            outcome: "▶ 結果: オーバーベットしました。（※GTO推奨の「Bet 75%」を選んだとしてハンド終了します）",
            explanation: "ブラフとしてやりすぎです。ドローが外れたときのリスクが高すぎます。" }
        ]
      }
    ]
  },
  // --- 4問目（中級） ---
  {
    level: "⚔️ 中級",
    position: "Hero (SB) vs Villain (BTN)",
    preflop: "BTNが2.5BBオープン、Hero(SB)が9BBに3ベット、BTNコール。",
    effStack: "91.0 BB",
    heroHand: '<div class="card s">Q♠</div><div class="card c">Q♣</div>',
    streets: [
      {
        name: "Flop",
        pot: "19.0 BB",
        board: '<div class="card h">A♥</div><div class="card d">8♦</div><div class="card s">3♠</div>',
        prompt: "フロップ: QQを持っていますが、Aが落ちてしまいました。OOP（先にアクションする立場）です。",
        options: [
          { text: "Check", isCorrect: true, evLoss: 0, freq: 95, type: "check", 
            outcome: "▶ 相手のアクション: 相手もチェックで回しました。\nターンへ進みます。",
            explanation: "3ベットポットでAハイボードの場合、QQは最悪の状況になりやすいため、高頻度でチェックしてポットコントロールします。" },
          { text: "Bet 33%", isCorrect: false, evLoss: -1.8, freq: 5, type: "bet", 
            outcome: "▶ 結果: あなたはベットしました。（※GTO推奨の「チェック」で回ったとして、ターンへ進行します）",
            explanation: "ここで打っても相手のAヒットにはコールされ、自分より弱い手は降りてしまうため利益が出ません。" },
          { text: "Bet 75%", isCorrect: false, evLoss: -3.0, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは大きくベットしました。（※GTO推奨の「チェック」で回ったとして進行します）",
            explanation: "最悪の選択です。Aを持っている相手にしかコールされず自爆します。" }
        ]
      },
      {
        name: "Turn (Action 1)",
        pot: "19.0 BB",
        board: '<div class="card h">A♥</div><div class="card d">8♦</div><div class="card s">3♠</div><div class="card c">2♣</div>',
        prompt: "ターン: 2♣が落ちました。相手がフロップをチェックしたことで、相手に強いAがある可能性は低くなっています。どうしますか？",
        options: [
          { text: "Check", isCorrect: true, evLoss: 0, freq: 85, type: "check", 
            outcome: "▶ 相手のアクション: あなたがチェックすると、相手はハーフポット（9.5BB）を打ってきました。\nあなたに再びアクションが回ります。",
            explanation: "引き続きポットコントロールします。ここでチェックして相手のブラフを引き出します。" },
          { text: "Bet 33%", isCorrect: false, evLoss: -1.2, freq: 15, type: "bet", 
            outcome: "▶ 結果: あなたはベットしました。（※GTO推奨の「チェック」で進め、相手がベットしてきたとして進行します）",
            explanation: "ここで自分から打ってしまうと、やはり相手のブラフハンドを降ろしてしまい、チップを稼ぐチャンスを自ら潰してしまいます。" },
          { text: "Bet 75%", isCorrect: false, evLoss: -2.5, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは大きくベットしました。（※GTO推奨の「チェック」で進行します）",
            explanation: "ブラフ過多な相手に対しても、自分から大きく打つ理由はQQにはありません。" }
        ]
      },
      {
        name: "Turn (Action 2)",
        pot: "19.0 BB",
        board: '<div class="card h">A♥</div><div class="card d">8♦</div><div class="card s">3♠</div><div class="card c">2♣</div>',
        prompt: "ターン: あなたのチェックに対し、相手はハーフポット（9.5BB）をベットしてきました。どう対応しますか？",
        options: [
          { text: "Fold", isCorrect: false, evLoss: -4.5, freq: 0, type: "check", 
            outcome: "▶ 結果: あなたはフォールドしました。（※GTO推奨の「コール」でブラフキャッチしたとしてハンドを終了します）",
            explanation: "ここで降りてしまうと、相手のブラフに搾取されすぎてしまいます。" },
          { text: "Call", isCorrect: true, evLoss: 0, freq: 100, type: "check", 
            outcome: "▶ 結果: あなたはコールしました。\nリバーはお互いチェックでショウダウン。相手はKQ（役なし）であなたの勝利です！",
            explanation: "相手のレンジにはKハイやJTsなどのブラフが多く含まれています。QQは優秀なブラフキャッチャーとしてコールするのが正解です。" },
          { text: "Raise 50%", isCorrect: false, evLoss: -6.0, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたはレイズしました。（※GTO推奨の「コール」でブラフキャッチしたとしてハンドを終了します）",
            explanation: "レイズすると、相手のブラフはすべて降りてしまい、Aを持っている時にしかコールされず大損します。" }
        ]
      }
    ]
  },
  // --- 5問目（上級） ---
  {
    level: "👑 上級",
    position: "Hero (BB) vs Villain (BTN)",
    preflop: "BTNが2.5BBオープン、Hero(BB)がコール。フロップとターンはお互いチェック。",
    effStack: "97.5 BB",
    heroHand: '<div class="card s">A♠</div><div class="card c">K♣</div>',
    streets: [
      {
        name: "River",
        pot: "5.5 BB",
        board: '<div class="card s">T♠</div><div class="card s">9♠</div><div class="card h">4♥</div><div class="card d">2♦</div><div class="card s">3♠</div>',
        prompt: "リバー: 3枚目のスペードが落ちました。OOPのあなたはAハイです。",
        options: [
          { text: "Check", isCorrect: false, evLoss: -3.5, freq: 0, type: "check", 
            outcome: "▶ 結果: あなたはチェックしました。（※GTO推奨の「Bet 150%」で相手を降ろしたとしてハンドを終了します）",
            explanation: "Aハイではショーダウンバリューがありません。「A♠を持っている」という恩恵を最大限に活かす必要があります。" },
          { text: "Bet 33%", isCorrect: false, evLoss: -1.5, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたは小さくベットしました。（※GTO推奨の「Bet 150%」を選んだとして進行します）",
            explanation: "小さすぎます。相手のミドルペア（Tや9）にオッズが合いすぎて簡単にコールされます。" },
          { text: "Bet 75%", isCorrect: false, evLoss: -0.8, freq: 0, type: "bet", 
            outcome: "▶ 結果: あなたはポットの3/4をベットしました。（※GTO推奨の「Bet 150%」を選んだとして進行します）",
            explanation: "悪くありませんが、まだブラフとしてはサイズが足りず、相手の中途半端な手にコールされる余地を与えます。" },
          { text: "Overbet 150%", isCorrect: true, evLoss: 0, freq: 100, type: "bet", 
            outcome: "▶ 相手のアクション: 相手は長考の末、フォールドしました。\n見事なブラフ成功でハンド終了です。",
            explanation: "ナッツフラッシュのブロッカー「A♠」を持っています。相手のナッツを完全にブロックしつつブラフする最適解です。" }
        ]
      }
    ]
  }
];

let currentHandIdx = 0;
let currentStreetIdx = 0;
let handScores = []; 
let totalEVLoss = 0;

let historyData = [];
let isReviewMode = false;
let reviewCursor = 0;

function loadStreet() {
  const gameScreen = document.getElementById('game-screen');
  // 画面スライドアニメーションのトリガー
  gameScreen.classList.remove('slide-in');
  void gameScreen.offsetWidth; // リフローを強制してアニメーションをリセット
  gameScreen.classList.add('slide-in');

  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];

  document.getElementById('level-badge').innerText = `${hand.level} (Hand ${currentHandIdx + 1}/${hands.length})`;
  document.getElementById('position-text').innerText = hand.position;
  document.getElementById('preflop-text').innerText = hand.preflop;
  document.getElementById('stack-text').innerText = hand.effStack;
  document.getElementById('hero-cards').innerHTML = hand.heroHand;
  
  document.getElementById('pot-text').innerText = street.pot;
  document.getElementById('street-label').innerText = `Board (${street.name})`;
  document.getElementById('board-cards').innerHTML = street.board;
  document.getElementById('question-prompt').innerText = street.prompt;

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  choicesDiv.style.display = 'flex';
  document.getElementById('feedback-panel').style.display = 'none';

  street.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt.text;
    btn.onclick = () => showFeedback(opt, street.options);
    choicesDiv.appendChild(btn);
  });
}

function showFeedback(selectedOpt, allOptions) {
  document.getElementById('choices').style.display = 'none';
  const panel = document.getElementById('feedback-panel');
  panel.style.display = 'block';

  if (!isReviewMode) {
    totalEVLoss += selectedOpt.evLoss;
    if (!handScores[currentHandIdx]) handScores[currentHandIdx] = [];
    handScores[currentHandIdx].push(selectedOpt.isCorrect ? '🟩' : '🟥');
    
    historyData.push({
      handIdx: currentHandIdx,
      streetIdx: currentStreetIdx,
      selectedOpt: selectedOpt,
      allOptions: allOptions
    });
  }

  const resultText = document.getElementById('ev-result');
  if (selectedOpt.isCorrect) {
    panel.className = 'feedback-panel';
    resultText.innerText = `✅ あなたの選択: ${selectedOpt.text} (EV Loss: 0 BB)`;
    resultText.style.color = "var(--correct)";
  } else {
    panel.className = 'feedback-panel error';
    resultText.innerText = `❌ あなたの選択: ${selectedOpt.text} (EV Loss: ${selectedOpt.evLoss} BB)`;
    resultText.style.color = "var(--incorrect)";
  }

  const barsContainer = document.getElementById('solver-bars');
  barsContainer.innerHTML = '';
  const sortedOptions = [...allOptions].sort((a, b) => b.freq - a.freq);
  const correctOpt = sortedOptions.find(o => o.isCorrect) || sortedOptions[0];

  sortedOptions.forEach(opt => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const fillClass = opt.type === 'bet' ? 'bet' : 'check';
    const evText = opt.evLoss === 0 ? "0.0" : opt.evLoss.toFixed(1);
    
    row.innerHTML = `
      <div class="bar-label">${opt.text}</div>
      <div class="bar-track">
        <div class="bar-fill ${fillClass}" style="width: ${opt.freq}%;">${opt.freq}%</div>
      </div>
      <div class="bar-ev">${evText}</div>
    `;
    barsContainer.appendChild(row);
  });

  document.getElementById('action-outcome').innerText = selectedOpt.outcome;
  document.getElementById('explanation-text').innerText = selectedOpt.explanation;

  const hand = hands[currentHandIdx];
  const noticeEl = document.getElementById('rail-notice');
  const nextBtn = document.getElementById('next-street-btn');
  const upsellEl = document.getElementById('premium-upsell');

  // ボタンの色分けとテキスト変更ロジック
  if (isReviewMode) {
    upsellEl.style.display = 'block'; 
    noticeEl.style.display = 'none';
    nextBtn.className = "next-btn street-btn"; // 青色
    if (reviewCursor < historyData.length - 1) {
      nextBtn.innerText = "▶ 次のアクションの振り返りへ";
    } else {
      nextBtn.className = "next-btn hand-btn"; // オレンジ色
      nextBtn.innerText = "🔙 リザルト画面に戻る";
    }
  } else {
    upsellEl.style.display = 'none'; 
    if (currentStreetIdx < hand.streets.length - 1) {
      noticeEl.innerText = `※GTO推奨である「${correctOpt.text}」を選択したとして進行します。`;
      noticeEl.style.display = 'block';
      nextBtn.className = "next-btn street-btn"; // 青色
      nextBtn.innerText = `▶ 次のストリートへ進む (${hand.streets[currentStreetIdx + 1].name})`;
    } else {
      noticeEl.style.display = 'none';
      if (currentHandIdx < hands.length - 1) {
        nextBtn.className = "next-btn hand-btn"; // オレンジ色
        nextBtn.innerText = `⏭ 次のハンドへ進む (Hand ${currentHandIdx + 2}/${hands.length})`;
      } else {
        nextBtn.className = "next-btn hand-btn"; // オレンジ色
        nextBtn.innerText = `🏁 全ハンド完了！結果を見る`;
      }
    }
  }
}

function nextStep() {
  if (isReviewMode) {
    reviewCursor++;
    if (reviewCursor < historyData.length) {
      renderReview(reviewCursor);
    } else {
      backToResult();
    }
    return;
  }

  const hand = hands[currentHandIdx];
  if (currentStreetIdx < hand.streets.length - 1) {
    currentStreetIdx++;
    loadStreet();
  } else {
    currentHandIdx++;
    currentStreetIdx = 0;
    if (currentHandIdx < hands.length) {
      loadStreet();
    } else {
      showResult();
    }
  }
}

function showResult() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';
  document.getElementById('back-to-result-btn').style.display = 'none';
  
  let gridHtml = "";
  hands.forEach((hand, idx) => {
    gridHtml += `Hand ${idx + 1} (${hand.level}): ${handScores[idx].join('')}<br>`;
  });
  
  document.getElementById('emoji-grid').innerHTML = gridHtml;
  document.getElementById('total-ev').innerText = `合計 EV Loss: ${totalEVLoss.toFixed(1)} BB`;
}

function startReview() {
  isReviewMode = true;
  reviewCursor = 0;
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('back-to-result-btn').style.display = 'inline-block';
  renderReview(reviewCursor);
}

function renderReview(idx) {
  const gameScreen = document.getElementById('game-screen');
  gameScreen.classList.remove('slide-in');
  void gameScreen.offsetWidth; 
  gameScreen.classList.add('slide-in');

  const data = historyData[idx];
  currentHandIdx = data.handIdx;
  currentStreetIdx = data.streetIdx;
  
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];

  document.getElementById('level-badge').innerText = `${hand.level} (Hand ${currentHandIdx + 1}/${hands.length}) - 振り返り`;
  document.getElementById('position-text').innerText = hand.position;
  document.getElementById('preflop-text').innerText = hand.preflop;
  document.getElementById('stack-text').innerText = hand.effStack;
  document.getElementById('hero-cards').innerHTML = hand.heroHand;
  document.getElementById('pot-text').innerText = street.pot;
  document.getElementById('street-label').innerText = `Board (${street.name})`;
  document.getElementById('board-cards').innerHTML = street.board;
  document.getElementById('question-prompt').innerText = street.prompt;

  showFeedback(data.selectedOpt, data.allOptions);
}

function backToResult() {
  isReviewMode = false;
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';
  document.getElementById('back-to-result-btn').style.display = 'none';
}

function shareResult() {
  let shareText = "Daily GTO Puzzle\n";
  hands.forEach((hand, idx) => {
    shareText += `Hand ${idx + 1}: ${handScores[idx].join('')}\n`;
  });
  shareText += `EV Loss: ${totalEVLoss.toFixed(1)} BB\n#GTOPuzzle`;
  
  navigator.clipboard.writeText(shareText).then(() => {
    alert("クリップボードにコピーしました！");
  });
}

loadStreet();