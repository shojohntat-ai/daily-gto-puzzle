// --- Supabase 接続設定 ---
const supabaseUrl = 'https://gacwxlqpewjajpxsffnx.supabase.co'; 
const supabaseKey = 'sb_publishable_MGA1XNEMGEyHZ9vYvuYLUg_RVHGI2wN';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- ゲスト用ユーザーIDの生成・取得 ---
// （※ログイン機能を実装するまでの間、ブラウザ固有の仮IDとして使います）
function getOrCreateUserId() {
  let uid = localStorage.getItem('poker_theory_guest_id');
  if (!uid) {
    uid = crypto.randomUUID(); // 重複しないUUIDを自動生成
    localStorage.setItem('poker_theory_guest_id', uid);
  }
  return uid;
}
const currentUserId = getOrCreateUserId();

// --- 状態管理 ---
let allHandsData = [];
let hands = [];
let selectedDifficulty = "初心者";
let currentStatTab = "初心者";

let currentHandIdx = 0;
let currentStreetIdx = 0;
let handScores = [];
let historyData = [];

// クラウドから取得した自分の全履歴を保持する配列
let cloudHistory = [];

let tableStack = 100;
let currentHandInvested = 0;

let sessionProfit = 0;
let sessionTheoryBonusTotal = 0;
let sessionPotNetTotal = 0;

// --- アプリ初期化（問題データ＆履歴をSupabaseから取得） ---
async function initApp() {
  try {
    const todayKey = getTodayKey();

    // 1. Supabaseから「今日の日付」の問題を取得（hand_order昇順）
    let { data: questionData, error: qError } = await supabaseClient
      .from('daily_questions')
      .select('*')
      .eq('publish_date', todayKey)
      .order('hand_order', { ascending: true });

    if (qError) throw qError;

    // ※もし今日の日付の問題がまだ登録されていない場合の安全策（フォールバック）
    // 最新の日付の問題を取得して遊べるようにする
    if (!questionData || questionData.length === 0) {
      console.warn("本日の問題が見つからないため、登録されている全問題から読み込みます。");
      const { data: fallbackData } = await supabaseClient
        .from('daily_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      questionData = fallbackData || [];
    }

    // SupabaseのDBカラム名（スネークケース）をアプリのプロパティ名にマッピング
    allHandsData = questionData.map(q => ({
      difficulty: q.difficulty,
      theme: q.theme,
      position: q.position,
      villainPos: q.villain_pos,
      preflopInvested: Number(q.preflop_invested),
      heroHand: q.hero_hand,
      villainHand: q.villain_hand,
      streets: q.streets
    }));

    // 2. Supabaseから自分の過去のプレイ履歴をすべて取得
    const { data: historyDataFromCloud, error: hError } = await supabaseClient
      .from('daily_records')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true });

    // (initApp関数内、Supabaseから daily_records 取得の直後)
    if (hError) {
      console.warn('クラウド履歴の取得に失敗しました。ローカル保存分を使用します。', hError);
    }
    
    // クラウド取得分、またはローカル保存分のフォールバック
    const localSavedHistory = localStorage.getItem('poker_theory_local_history');
    const parsedLocal = localSavedHistory ? JSON.parse(localSavedHistory) : [];
    
    cloudHistory = (historyDataFromCloud && historyDataFromCloud.length > 0) 
      ? historyDataFromCloud 
      : parsedLocal;

    renderHomeStats();
  } catch (error) {
    console.error('初期化エラー:', error);
    alert("データの読み込みに失敗しました。通信環境やLive Serverを確認してください。");
  }
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function switchStatTab(difficulty) {
  currentStatTab = difficulty;
  document.getElementById('tab-beginner').classList.toggle('active', difficulty === '初心者');
  document.getElementById('tab-intermediate').classList.toggle('active', difficulty === '中級者');
  renderHomeStats();
}

// --- ホーム画面の統計（クラウドデータを使用） ---
function renderHomeStats() {
  const todayKey = getTodayKey();

  const doneBeginner = cloudHistory.some(r => r.date_key === todayKey && r.difficulty === '初心者' && r.is_official);
  const doneInter = cloudHistory.some(r => r.date_key === todayKey && r.difficulty === '中級者' && r.is_official);

  const bBadge = document.getElementById('badge-beginner');
  bBadge.innerText = doneBeginner ? '✅ 本日クリア済 (練習可)' : '🌟 本日未プレイ';
  bBadge.className = 'daily-status-badge' + (doneBeginner ? ' done' : '');

  const iBadge = document.getElementById('badge-intermediate');
  iBadge.innerText = doneInter ? '✅ 本日クリア済 (練習可)' : '🌟 本日未プレイ';
  iBadge.className = 'daily-status-badge' + (doneInter ? ' done' : '');

  const courseOfficialRecords = cloudHistory.filter(r => r.difficulty === currentStatTab && r.is_official);
  const playedDays = courseOfficialRecords.length;

  let sumProfit = 0;
  let sumBest = 0;
  let sumChoices = 0;

  courseOfficialRecords.forEach(r => {
    sumProfit += r.profit;
    sumBest += r.best_count;
    sumChoices += r.total_choices;
  });

  const avgProfit = playedDays > 0 ? Math.round((sumProfit / playedDays) * 10) / 10 : 0;
  const bestRate = sumChoices > 0 ? Math.round((sumBest / sumChoices) * 100) : 0;

  document.getElementById('stat-played').innerText = `${playedDays}日`;
  const profitEl = document.getElementById('stat-avg-profit');
  profitEl.innerText = `${avgProfit >= 0 ? '+' : ''}${avgProfit} BB`;
  profitEl.style.color = avgProfit >= 0 ? '#4caf50' : '#f44336';
  document.getElementById('stat-best-rate').innerText = `${bestRate}%`;

  const historyListEl = document.getElementById('recent-history-list');
  historyListEl.innerHTML = '';

  if (cloudHistory.length === 0) {
    historyListEl.innerHTML = `<div style="color:#666; font-size:0.78em; text-align:center; padding:12px;">まだプレイ履歴がありません。コースを選んで5問に挑戦しましょう！</div>`;
    return;
  }

  // 最新5件を表示
  cloudHistory.slice().reverse().slice(0, 5).forEach(rec => {
    const row = document.createElement('div');
    row.className = 'history-row';
    const diffSign = rec.profit >= 0 ? '+' : '';
    const diffColor = rec.profit >= 0 ? '#4caf50' : '#f44336';
    const modeTag = rec.is_official ? '🌟公式' : '🔄練習';
    row.innerHTML = `
      <div>
        <span style="font-size:0.85em; color:#aaa;">${modeTag}</span>
        <strong style="color:#fff; margin-left:4px;">${rec.difficulty}</strong>
        <span style="color:#777; font-size:0.85em; margin-left:6px;">${rec.time_str}</span>
      </div>
      <div>
        <span style="margin-right:6px; letter-spacing:1px;">${rec.emojis}</span>
        <strong style="color:${diffColor};">${diffSign}${rec.profit} BB</strong>
      </div>
    `;
    historyListEl.appendChild(row);
  });
}

function startGame(difficulty) {
  selectedDifficulty = difficulty;
  hands = allHandsData.filter(h => h.difficulty === difficulty).slice(0, 5);

  if (hands.length === 0) {
    alert("本日の問題が見つかりませんでした。");
    return;
  }

  // 中断セーブがあるか確認
  const saved = localStorage.getItem(getSaveKey(difficulty));
  if (saved) {
    try {
      const p = JSON.parse(saved);
      currentHandIdx = p.currentHandIdx;
      currentStreetIdx = p.currentStreetIdx;
      handScores = p.handScores || [];
      historyData = p.historyData || [];
      sessionProfit = p.sessionProfit || 0;
      sessionTheoryBonusTotal = p.sessionTheoryBonusTotal || 0;
      sessionPotNetTotal = p.sessionPotNetTotal || 0;
      tableStack = p.tableStack !== undefined ? p.tableStack : 100;
      currentHandInvested = p.currentHandInvested || 0;
    } catch (e) {
      console.error("セーブデータ読み込み失敗、初期化します", e);
      resetNewGame();
    }
  } else {
    resetNewGame();
  }

  document.getElementById('home-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';

  updateSessionProfitUI(0);
  
  // 復帰時：手札や相手カードを正しく描画
  const hand = hands[currentHandIdx];
  document.getElementById('villain-cards').innerHTML = `
    <div class="card back"></div>
    <div class="card back"></div>
  `;
  loadStreet();
}

function resetNewGame() {
  currentHandIdx = 0;
  currentStreetIdx = 0;
  handScores = [];
  historyData = [];
  sessionProfit = 0;
  sessionTheoryBonusTotal = 0;
  sessionPotNetTotal = 0;
  tableStack = 100;
  currentHandInvested = 0;
}

function returnToHome() {
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('home-screen').style.display = 'flex';
  renderHomeStats();
}

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

// カードHTML内の余計なバックスラッシュを除去して安全に描画
function sanitizeCardHtml(htmlStr) {
  if (!htmlStr) return "";
  return htmlStr.replace(/\\/g, ''); // すべてのバックスラッシュを消去
}

// --- オートセーブ（中断復帰・リセマラ防止） ---
const SAVE_KEY_PREFIX = 'poker_progress_';

function getSaveKey(difficulty) {
  return `${SAVE_KEY_PREFIX}${getTodayKey()}_${difficulty}`;
}

// 1アクションごとに進行状況を保存
function saveCurrentProgress() {
  const saveKey = getSaveKey(selectedDifficulty);
  const progressData = {
    dateKey: getTodayKey(),
    difficulty: selectedDifficulty,
    currentHandIdx: currentHandIdx,
    currentStreetIdx: currentStreetIdx,
    handScores: handScores,
    historyData: historyData,
    sessionProfit: sessionProfit,
    sessionTheoryBonusTotal: sessionTheoryBonusTotal,
    sessionPotNetTotal: sessionPotNetTotal,
    tableStack: tableStack,
    currentHandInvested: currentHandInvested
  };
  localStorage.setItem(saveKey, JSON.stringify(progressData));
}

// セッション完了時に進行中データを消去
function clearCurrentProgress(difficulty) {
  localStorage.removeItem(getSaveKey(difficulty));
}

function loadStreet() {
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];
  const todayKey = getTodayKey(); // "2026-10-24" のような文字列
  const [year, month, day] = todayKey.split('-');

  document.getElementById('difficulty-badge').innerText = hand.difficulty;
  document.getElementById('hand-theme').innerText = `${Number(month)}月${Number(day)}日の問題`;
  document.getElementById('hand-progress').innerText = `Hand ${currentHandIdx + 1}/${hands.length}`;
  document.getElementById('position-text').innerText = hand.position;
  document.getElementById('villain-pos').innerText = hand.villainPos || "BB";
  document.getElementById('villain-action').innerText = street.villainAction || "Check";

  document.getElementById('pot-text').innerText = street.pot;
  document.getElementById('stack-text').innerText = tableStack;
  document.getElementById('hero-invested').innerText = currentHandInvested;

  document.getElementById('street-label').innerText = street.name.toUpperCase();
  document.getElementById('board-cards').innerHTML = sanitizeCardHtml(street.board);
  document.getElementById('hero-cards').innerHTML = sanitizeCardHtml(hand.heroHand);
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
  const bestOpt = allOptions.find(o => o.grade === 'best') || allOptions[0];

  // 1. スコア記号記録
  if (!handScores[currentHandIdx]) handScores[currentHandIdx] = [];
  handScores[currentHandIdx].push(selectedOpt.grade === 'best' ? '🟩' : (selectedOpt.grade === 'ok' ? '🟨' : '🟥'));

  historyData.push({
    handIdx: currentHandIdx,
    theme: hand.theme,
    streetName: street.name,
    selectedOpt: selectedOpt,
    bestOpt: bestOpt
  });

  // 2. ショーダウン演出
  if (selectedOpt.showdown || isFinalStreet) {
    const vCards = document.getElementById('villain-cards');
    vCards.innerHTML = sanitizeCardHtml(hand.villainHand);
    vCards.querySelectorAll('.card').forEach(c => c.classList.add('reveal'));
  }

  // 3. テーブル投資処理（定石の投資額で次へ進む）
  const costToContinue = isFinalStreet ? (selectedOpt.investCost || 0) : (bestOpt.investCost || 0);
  tableStack = Math.round((tableStack - costToContinue) * 10) / 10;
  currentHandInvested = Math.round((currentHandInvested + costToContinue) * 10) / 10;
  document.getElementById('stack-text').innerText = tableStack;
  document.getElementById('hero-invested').innerText = currentHandInvested;

  // 4. スコア計算
  const theoryBonus = selectedOpt.theoryBonus !== undefined ? selectedOpt.theoryBonus : 
                      (selectedOpt.grade === 'best' ? 15 : (selectedOpt.grade === 'ok' ? 0 : -15));
  const handNetResult = isFinalStreet ? (selectedOpt.handNetResult || 0) : 0;

  sessionTheoryBonusTotal = Math.round((sessionTheoryBonusTotal + theoryBonus) * 10) / 10;
  sessionPotNetTotal = Math.round((sessionPotNetTotal + handNetResult) * 10) / 10;

  const totalDelta = Math.round((theoryBonus + handNetResult) * 10) / 10;
  updateSessionProfitUI(totalDelta);
  saveCurrentProgress();

  // 5. フィードバック画面へスワップ表示
  document.getElementById('choice-state').style.display = 'none';
  document.getElementById('feedback-state').style.display = 'flex';

  const resultDiv = document.getElementById('feedback-result');
  const comparisonDiv = document.getElementById('action-comparison');
  
  resultDiv.className = 'feedback-grade';
  
  if (selectedOpt.grade === 'best') {
    resultDiv.innerText = `🏆 正解！ 最善手`;
    resultDiv.classList.add('correct');
    comparisonDiv.innerHTML = `<span class="action-tag best">あなたの選択: ${selectedOpt.text}</span>`;
  } else {
    resultDiv.innerText = selectedOpt.grade === 'ok' ? `⚠️ 妥協手` : `❌ 不正解（ミス）`;
    resultDiv.classList.add(selectedOpt.grade === 'ok' ? 'ok' : 'wrong');
    // あなたの選択と正解を並べて表示
    comparisonDiv.innerHTML = `
      <span class="action-tag user">あなた: ${selectedOpt.text}</span>
      <span class="action-tag best">正解: ${bestOpt.text}</span>
    `;
  }

  // 分かりやすい2段構成の解説文をHTMLで構築
// 分かりやすい2段構成の解説文をHTMLで構築（余計な改行スペースを排除）

let htmlMsg = "";
// 最終ストリート（決着時）ならテーマを初公開する
if (isFinalStreet) {
  htmlMsg += `<div style="margin-bottom: 10px; font-size: 1.05em; font-weight: bold; color: #64b5f6;">💡 今回のテーマ: ${hand.theme}</div>`;
}
htmlMsg += `<div style="margin-bottom: 10px; color: #aaa; font-size: 0.88em; font-weight: bold;">▶ 展開: ${selectedOpt.outcome}</div>`;
  if (selectedOpt.grade === 'best') {
    htmlMsg += `
      <div class="feedback-box-section">
        <div class="feedback-box-title best-title">💡 定石の理由 (+${theoryBonus} BB)</div>
        <div class="feedback-box-desc">${selectedOpt.explanation}</div>
      </div>
    `;
  } else {
    htmlMsg += `
      <div class="feedback-box-section">
        <div class="feedback-box-title wrong-title">❌ なぜ「${selectedOpt.text}」はダメなのか？</div>
        <div class="feedback-box-desc">${selectedOpt.explanation}</div>
      </div>
      <div class="feedback-box-section" style="border-top: 1px dashed #444; padding-top: 8px; margin-top: 8px;">
        <div class="feedback-box-title best-title">🏆 正解は「${bestOpt.text}」</div>
        <div class="feedback-box-desc">${bestOpt.explanation}</div>
      </div>
    `;
    if (!isFinalStreet) {
      htmlMsg += `<div style="margin-top: 8px; font-size: 0.82em; color: #888;">※正解の「${bestOpt.text}」を選んだ前提で次のストリートへ進みます。</div>`;
    }
  }

  document.getElementById('system-message').innerHTML = htmlMsg;

  // 次へ進むボタン
  const nextBtn = document.getElementById('next-btn');
  if (!isFinalStreet) {
    nextBtn.className = "next-btn";
    nextBtn.innerText = `▶ ${hand.streets[currentStreetIdx + 1].name} へ進む`;
  } else if (currentHandIdx < hands.length - 1) {
    nextBtn.className = "next-btn hand-btn";
    nextBtn.innerText = `⏭ 次のハンドへ (Hand ${currentHandIdx + 2}/${hands.length})`;
  } else {
    nextBtn.className = "next-btn hand-btn";
    nextBtn.innerText = `🏁 全ハンド完了！結果を見る`;
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
      showResult(); // Async関数に変更したのでそのまま呼び出す
    }
  }
}

// --- リザルト画面表示 ＆ Supabaseへの保存 ---
async function showResult() {
  // 全問解き終わったので中断データをクリア
  clearCurrentProgress(selectedDifficulty);

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

  // クラウドへ保存
  const isOfficial = await savePlayHistory(sessionProfit, compactEmojis.slice(0, -1));
  const modeBadge = document.getElementById('result-mode-badge');
  modeBadge.innerText = isOfficial ? '🌟 本日の公式記録（統計に反映）' : '🔄 練習プレイ（本日の公式記録は保存済）';

  renderReviewList();
}

// --- Supabaseへの保存処理 ---
async function savePlayHistory(profit, emojis) {
  const todayKey = getTodayKey();

  // 今日この難易度をすでに公式クリアしているかチェック
  const alreadyPlayedToday = cloudHistory.some(r => r.date_key === todayKey && r.difficulty === selectedDifficulty && r.is_official);
  const isOfficial = !alreadyPlayedToday;

  const bestCount = historyData.filter(d => d.selectedOpt.grade === 'best').length;
  const now = new Date();
  const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newRecord = {
    user_id: currentUserId,
    date_key: todayKey,
    difficulty: selectedDifficulty,
    profit: profit,
    emojis: emojis,
    best_count: bestCount,
    total_choices: historyData.length,
    time_str: timeStr,
    is_official: isOfficial
  };

  // 1. ローカル側には即時追加してUIの更新漏れを防ぐ
  cloudHistory.push(newRecord);
  
  // スマホのローカルストレージにもバックアップ保存
  try {
    localStorage.setItem('poker_theory_local_history', JSON.stringify(cloudHistory));
  } catch (e) {
    console.warn("LocalStorage save error", e);
  }

  // 2. Supabaseへ非同期送信
  try {
    const { data, error } = await supabaseClient
      .from('daily_records')
      .insert([newRecord])
      .select();

    if (error) {
      console.error('Supabase保存エラー詳細:', error);
    }
  } catch (error) {
    console.error('Supabase通信例外:', error);
  }

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
  const siteUrl = "https://holdemdaily.com";
  let shareText = `♠️ Hold'em Daily [${selectedDifficulty} 5問]\n本日の収支: ${sessionProfit >= 0 ? '+' : ''}${sessionProfit} BB (定石:${sessionTheoryBonusTotal >= 0 ? '+' : ''}${sessionTheoryBonusTotal} / 実戦:${sessionPotNetTotal >= 0 ? '+' : ''}${sessionPotNetTotal})\n\n`;
  hands.forEach((hand, idx) => {
    if (handScores[idx]) shareText += `Hand ${idx + 1}: ${handScores[idx].join('')}\n`;
  });
  shareText += `\n今日の定石に挑戦 ➔ ${siteUrl}\n#HoldemDaily #ポーカーパズル`;
  navigator.clipboard.writeText(shareText).then(() => alert("結果をコピーしました！友達とスコアを競おう！"));
}

// メニューモーダル制御
function toggleMenuModal(show) {
  document.getElementById('menu-modal').style.display = show ? 'flex' : 'none';
}

// （※ローカルデータ消去の代わりに、将来のログアウト機能のモックに変更）
function clearLocalData() {
  alert("現在クラウド同期中のため、履歴は安全に保管されています。\n将来ここに『ログアウト（別アカウントへの切り替え）』が実装されます。");
}

initApp();