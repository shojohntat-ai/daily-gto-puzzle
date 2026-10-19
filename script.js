// --- 状態管理 ---
let allHandsData = [];
let hands = []; // 選択された難易度の問題リスト
let selectedDifficulty = "初心者";

let currentHandIdx = 0;
let currentStreetIdx = 0;
let handScores = [];
let historyData = [];

// 統合されたプレイヤーのスタック（100 BBスタートで増減）
const INITIAL_STACK = 100;
let playerStack = INITIAL_STACK;
let currentHandInvested = 0;

// --- 初期化（JSON読み込み＆ホーム画面描画） ---
async function initApp() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    allHandsData = await response.json();
    renderHomeStats();
  } catch (error) {
    console.error('問題読み込み失敗:', error);
    alert("questions.json の読み込みに失敗しました。Live Serverで開いているか確認してください。");
  }
}

// ホーム画面の統計・履歴の描画（localStorage連携）
function renderHomeStats() {
  const savedHistory = JSON.parse(localStorage.getItem('poker_theory_history') || '[]');
  
  const totalPlayed = savedHistory.length;
  let totalProfit = 0;
  let bestCount = 0;
  let totalChoices = 0;

  savedHistory.forEach(record => {
    totalProfit += record.profit;
    bestCount += record.bestCount;
    totalChoices += record.totalChoices;
  });

  totalProfit = Math.round(totalProfit * 10) / 10;
  const bestRate = totalChoices > 0 ? Math.round((bestCount / totalChoices) * 100) : 0;

  document.getElementById('stat-played').innerText = `${totalPlayed}回`;
  const profitEl = document.getElementById('stat-profit');
  profitEl.innerText = `${totalProfit >= 0 ? '+' : ''}${totalProfit} BB`;
  profitEl.style.color = totalProfit >= 0 ? '#4caf50' : '#f44336';
  document.getElementById('stat-best-rate').innerText = `${bestRate}%`;

  // 最近の履歴リスト（最新5件）
  const historyListEl = document.getElementById('recent-history-list');
  historyListEl.innerHTML = '';

  if (savedHistory.length === 0) {
    historyListEl.innerHTML = `<div style="color:#666; font-size:0.8em; text-align:center; padding:12px;">まだプレイ履歴がありません。コースを選んで挑戦しましょう！</div>`;
    return;
  }

  savedHistory.slice().reverse().slice(0, 5).forEach(rec => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const diffSign = rec.profit >= 0 ? '+' : '';
    const diffColor = rec.profit >= 0 ? '#4caf50' : '#f44336';
    row.innerHTML = `
      <div>
        <strong style="color:#fff;">${rec.difficulty}</strong>
        <span style="color:#888; font-size:0.85em; margin-left:6px;">${rec.date}</span>
      </div>
      <div>
        <span style="margin-right:8px;">${rec.emojis}</span>
        <strong style="color:${diffColor};">${diffSign}${rec.profit} BB</strong>
      </div>
    `;
    historyListEl.appendChild(row);
  });
}

// コースを選択してゲーム開始
function startGame(difficulty) {
  selectedDifficulty = difficulty;
  hands = allHandsData.filter(h => h.difficulty === difficulty);
  
  // もし該当難易度の問題がなければ全問題を対象にする（フォールバック）
  if (hands.length === 0) hands = allHandsData;

  currentHandIdx = 0;
  handScores = [];
  historyData = [];
  playerStack = INITIAL_STACK; // 100 BBでスタート！

  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';

  updateStackUI(0);
  startHand();
}

// ホーム画面へ戻る
function returnToHome() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('home-screen').style.display = 'flex';
  renderHomeStats();
}

// 各ハンド開始時の初期化
function startHand() {
  const hand = hands[currentHandIdx];
  currentStreetIdx = 0;
  currentHandInvested = hand.preflopInvested || 2.5;

  // プリフロップの参加費をスタックから引く（Hand 1開始時のみ100BBからスタート感を出すため調整可だが、分かりやすくプリフロップ投資済みの状態から開始）
  document.getElementById('villain-cards').innerHTML = `
    <div class="card back"></div>
    <div class="card back"></div>
  `;
  loadStreet();
}

// スタック表示の更新＆アニメーション（1つの数字に完全統合！）
function updateStackUI(change) {
  const stackSpan = document.getElementById('stack-text');
  const stackPill = document.getElementById('stack-display');
  
  playerStack = Math.round((playerStack + change) * 10) / 10;
  stackSpan.innerText = playerStack;

  if (change !== 0) {
    stackPill.classList.remove('increase', 'decrease');
    void stackPill.offsetWidth;
    stackPill.classList.add(change > 0 ? 'increase' : 'decrease');
  }
}

// ストリート画面の描画
function loadStreet() {
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];

  document.getElementById('difficulty-badge').innerText = hand.difficulty;
  document.getElementById('hand-theme').innerText = `テーマ: ${hand.theme}`;
  document.getElementById('hand-progress').innerText = `Hand ${currentHandIdx + 1}/${hands.length}`;
  document.getElementById('position-text').innerText = hand.position;
  document.getElementById('villain-pos').innerText = hand.villainPos || "BB";
  document.getElementById('villain-action').innerText = street.villainAction || "Check";

  document.getElementById('pot-text').innerText = street.pot;
  document.getElementById('stack-text').innerText = playerStack;
  document.getElementById('hero-invested').innerText = Math.round(currentHandInvested * 10) / 10;

  document.getElementById('street-label').innerText = street.name.toUpperCase();
  document.getElementById('board-cards').innerHTML = street.board;
  document.getElementById('hero-cards').innerHTML = hand.heroHand;
  document.getElementById('hero-badge').innerText = street.badge || "";
  document.getElementById('question-prompt').innerText = street.prompt;

  // 選択肢パネルを表示
  document.getElementById('choice-state').style.display = 'flex';
  document.getElementById('feedback-state').style.display = 'none';

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';

  street.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt.text;
    btn.onclick = () => handleChoice(opt, street.options);
    choicesDiv.appendChild(btn);
  });
}

// 選択肢を選んだ時の処理
function handleChoice(selectedOpt, allOptions) {
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];
  const isFinalStreet = (currentStreetIdx === hand.streets.length - 1);

  // 1. 履歴記録
  if (!handScores[currentHandIdx]) handScores[currentHandIdx] = [];
  handScores[currentHandIdx].push(selectedOpt.grade === 'best' ? '🟩' : (selectedOpt.grade === 'ok' ? '🟨' : '🟥'));

  historyData.push({
    handIdx: currentHandIdx,
    theme: hand.theme,
    streetName: street.name,
    selectedOpt: selectedOpt
  });

  // 2. ショーダウン演出
  if (selectedOpt.showdown || isFinalStreet) {
    const vCards = document.getElementById('villain-cards');
    vCards.innerHTML = hand.villainHand;
    vCards.querySelectorAll('.card').forEach(c => c.classList.add('reveal'));
  }

  // 3. スタック増減計算（投資・決着・セオリーボーナスをすべてStackに統合）
  const bestOpt = allOptions.find(o => o.grade === 'best') || allOptions[0];
  const costToContinue = bestOpt.investCost || 0;
  currentHandInvested += costToContinue;
  document.getElementById('hero-invested').innerText = Math.round(currentHandInvested * 10) / 10;

  // セオリーボーナス
  const theoryBonus = selectedOpt.theoryBonus !== undefined ? selectedOpt.theoryBonus : 
                      (selectedOpt.grade === 'best' ? 15 : (selectedOpt.grade === 'ok' ? 0 : -15));

  // ハンド決着時のポット収支（最終ストリートのみ発生）
  const handNetResult = selectedOpt.handNetResult || 0;

  // 今回のアクションによるスタック変動（道中は ボーナス - 投資額、最終局面は ボーナス + 最終ポット収支）
  let stackDelta = 0;
  if (!isFinalStreet) {
    stackDelta = theoryBonus - costToContinue;
  } else {
    stackDelta = theoryBonus + handNetResult;
  }
  updateStackUI(stackDelta);

  // 4. フィードバック画面へスワップ
  document.getElementById('choice-state').style.display = 'none';
  document.getElementById('feedback-state').style.display = 'flex';

  const resultDiv = document.getElementById('feedback-result');
  document.getElementById('selected-action-tag').innerText = `選択: ${selectedOpt.text}`;

  resultDiv.className = 'feedback-grade';
  if (selectedOpt.grade === 'best') {
    resultDiv.innerText = `🏆 最善手！ (${stackDelta >= 0 ? '+' : ''}${Math.round(stackDelta*10)/10} BB)`;
    resultDiv.classList.add('correct');
  } else if (selectedOpt.grade === 'ok') {
    resultDiv.innerText = `⚠️ 妥協手 (${stackDelta >= 0 ? '+' : ''}${Math.round(stackDelta*10)/10} BB)`;
    resultDiv.classList.add('ok');
  } else {
    resultDiv.innerText = `❌ 悪手 (${stackDelta >= 0 ? '+' : ''}${Math.round(stackDelta*10)/10} BB)`;
    resultDiv.classList.add('wrong');
  }

  let msg = `▶ 展開: ${selectedOpt.outcome}\n`;
  msg += `🎓 定石ボーナス: ${theoryBonus >= 0 ? '+' : ''}${theoryBonus} BB （${selectedOpt.shortExp}）\n`;

  if (!isFinalStreet && costToContinue > 0) {
    msg += `🪙 ポットへ投資: -${costToContinue} BB\n`;
  } else if (isFinalStreet && handNetResult !== 0) {
    msg += `💰 ポット決着収支: ${handNetResult > 0 ? '+' : ''}${handNetResult} BB\n`;
  }

  if (selectedOpt.grade !== 'best') {
    msg += `\n💡 指南: ${selectedOpt.explanation}`;
    if (!isFinalStreet) msg += `\n※次は定石の「${bestOpt.text}」ルートで進行します。`;
  } else {
    msg += `\n💡 定石メモ: ${selectedOpt.explanation}`;
  }

  document.getElementById('system-message').innerText = msg;

  const nextBtn = document.getElementById('next-btn');
  if (!isFinalStreet) {
    nextBtn.className = "next-btn";
    nextBtn.innerText = `▶ ${hand.streets[currentStreetIdx + 1].name} へ進む`;
  } else if (currentHandIdx < hands.length - 1) {
    nextBtn.className = "next-btn hand-btn";
    nextBtn.innerText = `⏭ 次のハンドへ (Hand ${currentHandIdx + 2}/${hands.length})`;
  } else {
    nextBtn.className = "next-btn hand-btn";
    nextBtn.innerText = `🏁 最終結果を見る`;
  }
}

function nextStep() {
  const hand = hands[currentHandIdx];
  if (currentStreetIdx < hand.streets.length - 1) {
    currentStreetIdx++;
    loadStreet();
  } else {
    currentHandIdx++;
    if (currentHandIdx < hands.length) {
      startHand();
    } else {
      showResult();
    }
  }
}

// リザルト表示＆履歴の保存
function showResult() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'flex';
  document.getElementById('final-score').innerText = playerStack;

  const diff = Math.round((playerStack - INITIAL_STACK) * 10) / 10;
  const diffEl = document.getElementById('score-diff-text');
  diffEl.innerText = `トータル収支: ${diff >= 0 ? '+' : ''}${diff} BB`;
  diffEl.style.color = diff >= 0 ? '#4caf50' : '#f44336';

  let gridHtml = "";
  let flatEmojis = "";
  hands.forEach((hand, idx) => {
    if (handScores[idx]) {
      const line = handScores[idx].join('');
      gridHtml += `Hand ${idx + 1}: ${line}<br>`;
      flatEmojis += line + " ";
    }
  });
  document.getElementById('emoji-grid').innerHTML = gridHtml;

  // 履歴をlocalStorageに保存
  savePlayHistory(diff, flatEmojis.trim());

  renderReviewList();
}

function savePlayHistory(profit, emojis) {
  const savedHistory = JSON.parse(localStorage.getItem('poker_theory_history') || '[]');
  const bestCount = historyData.filter(d => d.selectedOpt.grade === 'best').length;
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}/${today.getDate()} ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;

  savedHistory.push({
    difficulty: selectedDifficulty,
    profit: profit,
    emojis: emojis,
    bestCount: bestCount,
    totalChoices: historyData.length,
    date: dateStr
  });

  localStorage.setItem('poker_theory_history', JSON.stringify(savedHistory));
}

function renderReviewList() {
  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = '';

  const adBlock = document.createElement('div');
  adBlock.id = 'ad-block';
  adBlock.style.cssText = 'background:#1c1f26; border:1px dashed #444; padding:16px; text-align:center; border-radius:8px; margin-bottom:15px;';
  adBlock.innerHTML = `
    <p style="color:#ccc; font-size:0.85em; margin:0 0 12px 0;">全ストリートの詳しい定石解説を見るには動画広告を視聴してください。</p>
    <button style="background:#2196f3; color:white; border:none; padding:11px 16px; border-radius:6px; font-weight:bold; cursor:pointer; width:100%;" onclick="playAd()">▶ 動画広告を見て解説をアンロック</button>
  `;
  reviewList.appendChild(adBlock);

  const historyContainer = document.createElement('div');
  historyContainer.id = 'history-container';
  historyContainer.style.display = 'none';

  historyData.forEach((data) => {
    const item = document.createElement('div');
    item.className = 'review-item';

    const header = document.createElement('div');
    header.className = 'review-header';
    let icon = data.selectedOpt.grade === 'best' ? '✅ 最善手' : (data.selectedOpt.grade === 'ok' ? '⚠️ 妥協手' : '❌ 悪手');
    header.innerHTML = `<span>Hand ${data.handIdx + 1} - ${data.streetName}</span> <span>${icon} ▼</span>`;

    const body = document.createElement('div');
    body.className = 'review-body';
    body.innerHTML = `
      <div style="font-size:0.8em; color:#64b5f6; margin-bottom:4px;">${data.theme}</div>
      <div style="font-size:0.85em; color:#fff; margin-bottom:8px;">あなたの選択: <strong>${data.selectedOpt.text}</strong></div>
      <div style="font-size:0.82em; color:#ccc; line-height:1.5; background:#14161b; padding:10px; border-radius:6px;">
        ${data.selectedOpt.explanation}
      </div>
    `;

    header.onclick = () => {
      const isVisible = body.style.display === 'block';
      body.style.display = isVisible ? 'none' : 'block';
      header.innerHTML = `<span>Hand ${data.handIdx + 1} - ${data.streetName}</span> <span>${icon} ${isVisible ? '▼' : '▲'}</span>`;
    };

    item.appendChild(header);
    item.appendChild(body);
    historyContainer.appendChild(item);
  });

  reviewList.appendChild(historyContainer);
}

function playAd() {
  alert("（15秒の動画広告再生完了）\n本日のすべての定石解説がアンロックされました！");
  document.getElementById('ad-block').style.display = 'none';
  document.getElementById('history-container').style.display = 'block';
}

function shareResult() {
  const diff = Math.round((playerStack - INITIAL_STACK) * 10) / 10;
  let shareText = `♠️ Daily Poker Theory [${selectedDifficulty}]\n最終スタック: ${playerStack} BB (${diff >= 0 ? '+' : ''}${diff} BB)\n\n`;
  hands.forEach((hand, idx) => {
    if (handScores[idx]) shareText += `Hand ${idx + 1}: ${handScores[idx].join('')}\n`;
  });
  shareText += `#PokerTheory #ポーカーパズル`;
  navigator.clipboard.writeText(shareText).then(() => alert("結果をコピーしました！友達にシェアしよう！"));
}

initApp();