// 問題データ（ポジション、プリフロップの文脈を追加）
const questions = [
  {
    level: "🔰 初級",
    position: "Hero (BTN) vs Villain (BB)",
    preflop: "Heroが2.5BBオープンレイズ、Villainがコール。",
    pot: "5.5 BB",
    effStack: "97.5 BB",
    board: '<div class="card s">A♠</div><div class="card h">8♥</div><div class="card d">2♦</div>',
    heroHand: '<div class="card s">A♠</div><div class="card c">K♣</div>',
    prompt: "フロップ: 相手はチェックしました。トップペアを持っていますが、どうしますか？",
    options: [
      { text: "ベット", isCorrect: true, evLoss: 0, explanation: "正解です。一番強いペアを持っているので、相手からチップを引き出すためにベットしましょう。シンプルなバリューベットです。" },
      { text: "チェック", isCorrect: false, evLoss: -1.2, explanation: "チェックすると相手に無料で次のカードを見られてしまいます（フリーカードを与えてしまう）。強い手なので自分から打ちましょう。" },
      { text: "フォールド", isCorrect: false, evLoss: -5.5, explanation: "相手はまだ何もしていません。ここで降りるのはチップを捨てているのと同じです。" }
    ]
  },
  {
    level: "⚔️ 中級",
    position: "Hero (BTN) vs Villain (BB)",
    preflop: "Heroが2.5BBオープンレイズ、Villainがコール。",
    pot: "5.5 BB",
    effStack: "97.5 BB",
    board: '<div class="card s">J♠</div><div class="card h">7♥</div><div class="card d">3♦</div>',
    heroHand: '<div class="card h">A♥</div><div class="card c">K♣</div>',
    prompt: "フロップ: 相手はチェック。Aハイですが、レンジ全体のアドバンテージをどう活かしますか？",
    options: [
      { text: "Bet 33%", isCorrect: true, evLoss: 0, explanation: "正解。このようなドライボード（ドローが少ない盤面）では、オリジナルレイザーであるBTNのレンジアドバンテージを活かして、安いサイズで高頻度CBを打つのが定石です。" },
      { text: "Bet 75%", isCorrect: false, evLoss: -0.8, explanation: "サイズが大きすぎます。このボードで大きく打つと、相手の強い手にしかコールされず、Aハイの価値を落としてしまいます。" },
      { text: "Check", isCorrect: false, evLoss: -0.4, explanation: "悪くはないですが、少しパッシブすぎます。安いベットで主導権を握り、相手の弱い手をフォールドさせる方が利益的です。" }
    ]
  },
  {
    level: "👑 上級",
    position: "Hero (BB) vs Villain (BTN)",
    preflop: "BTNが2.5BBオープン、Hero(BB)がコール。フロップとターンはお互いチェックで進行。",
    pot: "5.5 BB",
    effStack: "97.5 BB",
    board: '<div class="card s">T♠</div><div class="card s">9♠</div><div class="card h">4♥</div><div class="card d">2♦</div><div class="card s">3♠</div>',
    heroHand: '<div class="card s">A♠</div><div class="card c">K♣</div>',
    prompt: "リバー: 3枚目のスペードが落ちました。OOPのあなたはAハイです。最適なアクションは？",
    options: [
      { text: "Bet 150% (All-in想定)", isCorrect: true, evLoss: 0, explanation: "GTOの最適解。あなたはナッツフラッシュのブロッカーである「A♠」を持っています。相手のナッツを完全にブロックしつつ、相手の中途半端な手（ワンペア等）を降ろす強力なブラフになります。" },
      { text: "Check", isCorrect: false, evLoss: -3.5, explanation: "チェックしてショーダウンに行ってもAハイでは勝てません。「A♠を持っている」という強烈な恩恵を捨ててしまっています。" },
      { text: "Bet 33%", isCorrect: false, evLoss: -1.5, explanation: "ブラフサイズが小さすぎます。これでは相手の弱いペア（Tヒットなど）に簡単にコールされてしまいます。ブラフはMDF（最小防衛頻度）を削るためにも適切なサイズが必要です。" }
    ]
  }
];

let currentIndex = 0;
let scoreLog = [];
let totalEVLoss = 0;

function loadQuestion() {
  const q = questions[currentIndex];
  document.getElementById('level-badge').innerText = `${q.level} (${currentIndex + 1}/${questions.length})`;
  document.getElementById('position-text').innerText = q.position;
  document.getElementById('preflop-text').innerText = q.preflop;
  document.getElementById('pot-text').innerText = q.pot;
  document.getElementById('stack-text').innerText = q.effStack;
  document.getElementById('board-cards').innerHTML = q.board;
  document.getElementById('hero-cards').innerHTML = q.heroHand;
  document.getElementById('question-prompt').innerText = q.prompt;

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  choicesDiv.style.display = 'flex';
  document.getElementById('feedback-panel').style.display = 'none';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt.text;
    btn.onclick = () => showFeedback(opt);
    choicesDiv.appendChild(btn);
  });
}

function showFeedback(option) {
  document.getElementById('choices').style.display = 'none';
  const panel = document.getElementById('feedback-panel');
  panel.style.display = 'block';

  totalEVLoss += option.evLoss;
  scoreLog.push(option.isCorrect ? '🟩' : '🟥');

  const resultText = document.getElementById('ev-result');
  if (option.isCorrect) {
    panel.className = 'feedback-panel';
    resultText.innerText = "✅ 正解！ (EV Loss: 0 BB)";
    resultText.style.color = "var(--correct)";
  } else {
    panel.className = 'feedback-panel error';
    resultText.innerText = `❌ ミス (EV Loss: ${option.evLoss} BB)`;
    resultText.style.color = "var(--incorrect)";
  }
  document.getElementById('explanation-text').innerText = option.explanation;
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    let gridHtml = "🔰 " + scoreLog[0] + "<br>" +
                   "⚔️ " + scoreLog[1] + "<br>" +
                   "👑 " + scoreLog[2];
    document.getElementById('emoji-grid').innerHTML = gridHtml;
    document.getElementById('total-ev').innerText = `合計 EV Loss: ${totalEVLoss.toFixed(1)} BB`;
  }
}

// 初期読み込み
loadQuestion();