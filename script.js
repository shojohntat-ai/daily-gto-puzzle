// --- 状態管理 ---
let allHandsData = [];
let hands = [];
let selectedDifficulty = "初心者";
let currentStatTab = "初心者";

let currentHandIdx = 0;
let currentStreetIdx = 0;
let handScores = [];
let historyData = [];

// テーブル上のスタック（毎ハンド100BBにリセットされる）
let tableStack = 100;
let currentHandInvested = 0;

// 本日の5問セッション収支（定石ボーナス＋ハンド決着収支の累計）
let sessionProfit = 0;
let sessionTheoryBonusTotal = 0;
let sessionPotNetTotal = 0;

async function initApp() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    allHandsData = await response.json();
    renderHomeStats();
  } catch (error) {
    console.error('問題読み込み失敗:', error);
    alert("questions.json の読み込みに失敗しました。Live Serverで開いてください。");
  }
}

// 今日の日付キー（YYYY-MM-DD）を取得（1日1回公式記録判定用）
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ホーム画面のコース別タブ切り替え
function switchStatTab(difficulty) {
  currentStatTab = difficulty;
  document.getElementById('tab-beginner').classList.toggle('active', difficulty === '初心者');
  document.getElementById('tab-intermediate').classList.toggle('active', difficulty === '中級者');
  renderHomeStats();
}

// ホーム画面の統計・履歴の描画（コース別集計＆デイリー状態表示）
function renderHomeStats() {
  const savedHistory = JSON.parse(localStorage.getItem('poker_theory_v2_history') || '[]');
  const todayKey = getTodayKey();

  // 今日すでに公式プレイ済みかチェックしてバッジ更新
  const doneBeginner = savedHistory.some(r => r.dateKey === todayKey && r.difficulty === '初心者' && r.isOfficial);
  const doneInter = savedHistory.some(r => r.dateKey === todayKey && r.difficulty === '中級者' && r.isOfficial);

  const bBadge = document.getElementById('badge-beginner');
  bBadge.innerText = doneBeginner ? '✅ 本日クリア済 (練習可)' : '🌟 本日未プレイ';
  bBadge.className = 'daily-status-badge' + (doneBeginner ? ' done' : '');

  const iBadge = document.getElementById('badge-intermediate');
  iBadge.innerText = doneInter ? '✅ 本日クリア済 (練習可)' : '🌟 本日未プレイ';
  iBadge.className = 'daily-status-badge' + (doneInter ? ' done' : '');

  // 選択中のタブ（初心者 or 中級者）の「公式記録」のみを集計（周回インフレ防止！）
  const courseOfficialRecords = savedHistory.filter(r => r.difficulty === currentStatTab && r.isOfficial);
  const playedDays = courseOfficialRecords.length;

  let sumProfit = 0;
  let sumBest = 0;
  let sumChoices = 0;

  courseOfficialRecords.forEach(r => {
    sumProfit += r.profit;
    sumBest += r.bestCount;
    sumChoices += r.totalChoices;
  });

  const avgProfit = playedDays > 0 ? Math.round((sumProfit / playedDays) * 10) / 10 : 0;
  const bestRate = sumChoices > 0 ? Math.round((sumBest / sumChoices) * 100) : 0;

  document.getElementById('stat-played').innerText = `${playedDays}日`;
  const profitEl = document.getElementById('stat-avg-profit');
  profitEl.innerText = `${avgProfit >= 0 ? '+' : ''}${avgProfit} BB`;
  profitEl.style.color = avgProfit >= 0 ? '#4caf50' : '#f44336';
  document.getElementById('stat-best-rate').innerText = `${bestRate}%`;

  // 最近の履歴リスト（最新5件）
  const historyListEl = document.getElementById('recent-history-list');
  historyListEl.innerHTML = '';

  if (savedHistory.length === 0) {
    historyListEl.innerHTML = `<div style="color:#666; font-size:0.78em; text-align:center; padding:12px;">まだプレイ履歴がありません。コースを選んで5問に挑戦しましょう！</div>`;
    return;
  }

  savedHistory.slice().reverse().slice(0, 5).forEach(rec => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const diffSign = rec.profit >= 0 ? '+' : '';
    const diffColor = rec.profit >= 0 ? '#4caf50' : '#f44336';
    const modeTag = rec.isOfficial ? '🌟公式' : '🔄練習';
    row.innerHTML = `
      <div>
        <span style="font-size:0.85em; color:#aaa;">${modeTag}</span>
        <strong style="color:#fff; margin-left:4px;">${rec.difficulty}</strong>
        <span style="color:#777; font-size:0.85em; margin-left:6px;">${rec.timeStr}</span>
      </div>
      <div>
        <span style="margin-right:6px; letter-spacing:1px;">${rec.emojis}</span>
        <strong style="color:${diffColor};">${diffSign}${rec.profit} BB</strong>
      </div>
    `;
    historyListEl.appendChild(row);
  });
}

// コースを選択して5問ゲーム開始
function startGame(difficulty) {
  selectedDifficulty = difficulty;
  hands = allHandsData.filter(h => h.difficulty === difficulty).slice(0, 5);

  currentHandIdx = 0;
  handScores = [];
  historyData = [];

  sessionProfit = 0;
  sessionTheoryBonusTotal = 0;
  sessionPotNetTotal = 0;

  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';

  updateSessionProfitUI(0);
  startHand();
}

function returnToHome() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('home-screen').style.display = 'flex';
  renderHomeStats();
}

// ★重要：各ハンド開始時、テーブル上のスタックを必ず規定値（100BB基準）にリセットする
function startHand() {
  const hand = hands[currentHandIdx];
  currentStreetIdx = 0;
  currentHandInvested = hand.preflopInvested || 2.5;
  tableStack = Math.round((100 - currentHandInvested) * 10) / 10;

  document.getElementById('villain-cards').innerHTML = `
    <div class="card back"></div>
    <div class="card back"></div>
  `;
  loadStreet();
}

// ヘッダーの「本日の収支」更新アニメーション
function updateSessionProfitUI(delta) {
  const textEl = document.getElementById('session-profit-text');
  const pillEl = document.getElementById('session-profit-pill');

  sessionProfit = Math.round((sessionProfit + delta) * 10) / 10;
  textEl.innerText = `${sessionProfit >= 0 ? '+' : ''}${sessionProfit}`;

  if (delta !== 0) {
    pillEl.classList.remove('increase', 'decrease');
    void pillEl.offsetWidth;
    pillEl.classList.add(delta > 0 ? 'increase' : 'decrease');
  }
}

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
  document.getElementById('stack-text').innerText = tableStack;
  document.getElementById('hero-invested').innerText = currentHandInvested;

  document.getElementById('street-label').innerText = street.name.toUpperCase();
  document.getElementById('board-cards').innerHTML = street.board;
  document.getElementById('hero-cards').innerHTML = hand.heroHand;
  document.getElementById('hero-badge').innerText = street.badge || "";
  document.getElementById('question-prompt').innerText = street.prompt;

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

function handleChoice(selectedOpt, allOptions) {
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];
  const isFinalStreet = (currentStreetIdx === hand.streets.length - 1);

  // 1. スコア記号記録
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

  // 3. テーブル上のリアルな投資進行（毎回100BB基準のStackから減らす）
  const bestOpt = allOptions.find(o => o.grade === 'best') || allOptions[0];
  const costToContinue = isFinalStreet ? (selectedOpt.investCost || 0) : (bestOpt.investCost || 0);
  tableStack = Math.round((tableStack - costToContinue) * 10) / 10;
  currentHandInvested = Math.round((currentHandInvested + costToContinue) * 10) / 10;
  document.getElementById('stack-text').innerText = tableStack;
  document.getElementById('hero-invested').innerText = currentHandInvested;

  // 4. スコア計算（定石ボーナス ＋ ハンド決着時のポット収支 ➔ 本日の収支へ加算）
  const theoryBonus = selectedOpt.theoryBonus !== undefined ? selectedOpt.theoryBonus : 
                      (selectedOpt.grade === 'best' ? 15 : (selectedOpt.grade === 'ok' ? 0 : -15));
  const handNetResult = isFinalStreet ? (selectedOpt.handNetResult || 0) : 0;

  sessionTheoryBonusTotal = Math.round((sessionTheoryBonusTotal + theoryBonus) * 10) / 10;
  sessionPotNetTotal = Math.round((sessionPotNetTotal + handNetResult) * 10) / 10;

  const totalDelta = Math.round((theoryBonus + handNetResult) * 10) / 10;
  updateSessionProfitUI(totalDelta);

  // 5. フィードバック画面へスワップ
  document.getElementById('choice-state').style.display = 'none';
  document.getElementById('feedback-state').style.display = 'flex';

  const resultDiv = document.getElementById('feedback-result');
  document.getElementById('selected-action-tag').innerText = `選択: ${selectedOpt.text}`;

  resultDiv.className = 'feedback-grade';
  if (selectedOpt.grade === 'best') {
    resultDiv.innerText = `🏆 最善手！ (定石 +${theoryBonus} BB)`;
    resultDiv.classList.add('correct');
  } else if (selectedOpt.grade === 'ok') {
    resultDiv.innerText = `⚠️ 妥協手 (定石 ${theoryBonus >= 0 ? '+' : ''}${theoryBonus} BB)`;
    resultDiv.classList.add('ok');
  } else {
    resultDiv.innerText = `❌ 悪手 (定石 ${theoryBonus} BB)`;
    resultDiv.classList.add('wrong');
  }

  let msg = `▶ 展開: ${selectedOpt.outcome}\n`;
  if (!isFinalStreet && costToContinue > 0) {
    msg += `🪙 テーブル投資: ${costToContinue} BB (残りStack: ${tableStack} BB)\n`;
  } else if (isFinalStreet) {
    msg += `💰 ハンド決着収支: ${handNetResult >= 0 ? '+' : ''}${handNetResult} BB | 🎓 定石評価: ${theoryBonus >= 0 ? '+' : ''}${theoryBonus} BB\n`;
  }

  if (selectedOpt.grade !== 'best') {
    msg += `\n💡 指南: ${selectedOpt.explanation}`;
    if (!isFinalStreet) msg += `\n※次は定石の「${bestOpt.text}」ルートでターン以降へ進みます。`;
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
    nextBtn.innerText = `⏭ 次のハンドへ (100BBにリセットして Hand ${currentHandIdx + 2}/${hands.length} へ)`;
  } else {
    nextBtn.className = "next-btn hand-btn";
    nextBtn.innerText = `🏁 全5問完了！結果を見る`;
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

function showResult() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'flex';

  const finalEl = document.getElementById('final-profit-display');
  finalEl.innerText = `${sessionProfit >= 0 ? '+' : ''}${sessionProfit} BB`;
  finalEl.style.color = sessionProfit >= 0 ? '#4caf50' : '#f44336';

  document.getElementById('score-breakdown-text').innerText = 
    `内訳: 🎓定石評価 ${sessionTheoryBonusTotal >= 0 ? '+' : ''}${sessionTheoryBonusTotal} BB / 💰実戦ポット収支 ${sessionPotNetTotal >= 0 ? '+' : ''}${sessionPotNetTotal} BB`;

  let gridHtml = "";
  let compactEmojis = "";
  hands.forEach((hand, idx) => {
    if (handScores[idx]) {
      const line = handScores[idx].join('');
      gridHtml += `Hand ${idx + 1}: ${line} <span style="font-size:0.8em; color:#888;">(${hand.theme})</span><br>`;
      compactEmojis += line + "/";
    }
  });
  document.getElementById('emoji-grid').innerHTML = gridHtml;

  const isOfficial = savePlayHistory(sessionProfit, compactEmojis.slice(0, -1));
  const modeBadge = document.getElementById('result-mode-badge');
  modeBadge.innerText = isOfficial ? '🌟 本日の公式記録（統計に反映）' : '🔄 練習プレイ（本日の公式記録は保存済）';

  renderReviewList();
}

function savePlayHistory(profit, emojis) {
  const savedHistory = JSON.parse(localStorage.getItem('poker_theory_v2_history') || '[]');
  const todayKey = getTodayKey();

  // 今日この難易度をまだ公式クリアしていなければ isOfficial = true
  const alreadyPlayedToday = savedHistory.some(r => r.dateKey === todayKey && r.difficulty === selectedDifficulty && r.isOfficial);
  const isOfficial = !alreadyPlayedToday;

  const bestCount = historyData.filter(d => d.selectedOpt.grade === 'best').length;
  const now = new Date();
  const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  savedHistory.push({
    dateKey: todayKey,
    timeStr: timeStr,
    difficulty: selectedDifficulty,
    profit: profit,
    emojis: emojis,
    bestCount: bestCount,
    totalChoices: historyData.length,
    isOfficial: isOfficial
  });

  localStorage.setItem('poker_theory_v2_history', JSON.stringify(savedHistory));
  return isOfficial;
}

function renderReviewList() {
  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = '';

  const adBlock = document.createElement('div');
  adBlock.id = 'ad-block';
  adBlock.style.cssText = 'background:#1c1f26; border:1px dashed #444; padding:16px; text-align:center; border-radius:8px; margin-bottom:15px;';
  adBlock.innerHTML = `
    <p style="color:#ccc; font-size:0.85em; margin:0 0 12px 0;">全5問の詳しい定石解説を見るには動画広告を視聴してください。</p>
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
    header.innerHTML = `<span>Hand ${data.handIdx + 1} (${data.streetName}) - ${data.theme}</span> <span>${icon} ▼</span>`;

    const body = document.createElement('div');
    body.className = 'review-body';
    body.innerHTML = `
      <div style="font-size:0.85em; color:#fff; margin-bottom:8px;">あなたの選択: <strong>${data.selectedOpt.text}</strong></div>
      <div style="font-size:0.82em; color:#ccc; line-height:1.5; background:#14161b; padding:10px; border-radius:6px;">
        ${data.selectedOpt.explanation}
      </div>
    `;

    header.onclick = () => {
      const isVisible = body.style.display === 'block';
      body.style.display = isVisible ? 'none' : 'block';
      header.innerHTML = `<span>Hand ${data.handIdx + 1} (${data.streetName}) - ${data.theme}</span> <span>${icon} ${isVisible ? '▼' : '▲'}</span>`;
    };

    item.appendChild(header);
    item.appendChild(body);
    historyContainer.appendChild(item);
  });

  reviewList.appendChild(historyContainer);
}

function playAd() {
  alert("（15秒の動画広告再生完了）\n全5問の定石解説がアンロックされました！");
  document.getElementById('ad-block').style.display = 'none';
  document.getElementById('history-container').style.display = 'block';
}

function shareResult() {
  let shareText = `♠️ Daily Poker Theory [${selectedDifficulty} 5問]\n本日の収支: ${sessionProfit >= 0 ? '+' : ''}${sessionProfit} BB (定石:${sessionTheoryBonusTotal >= 0 ? '+' : ''}${sessionTheoryBonusTotal} / 実戦:${sessionPotNetTotal >= 0 ? '+' : ''}${sessionPotNetTotal})\n\n`;
  hands.forEach((hand, idx) => {
    if (handScores[idx]) shareText += `Hand ${idx + 1}: ${handScores[idx].join('')}\n`;
  });
  shareText += `#PokerTheory #ポーカーパズル`;
  navigator.clipboard.writeText(shareText).then(() => alert("結果をコピーしました！友達とスコアを競おう！"));
}

// メニューモーダル制御
function toggleMenuModal(show) {
  document.getElementById('menu-modal').style.display = show ? 'flex' : 'none';
}

function clearLocalData() {
  if (confirm("ローカルに保存されている成績・履歴データをすべてリセットしますか？")) {
    localStorage.removeItem('poker_theory_v2_history');
    toggleMenuModal(false);
    renderHomeStats();
  }
}

initApp();