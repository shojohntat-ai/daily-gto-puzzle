// --- セオリー特化型 問題データ ---
const hands = [
  {
    level: "🔰 セオリー基礎",
    position: "BTN vs BB",
    preflop: "2.5BB Open ➔ Call",
    effStack: "100 BB",
    heroHand: '<div class="card s">A♠</div><div class="card c">K♣</div>',
    streets: [
      {
        name: "Flop",
        pot: "5.5 BB",
        board: '<div class="card s">K♠</div><div class="card d">7♦</div><div class="card h">2♥</div>',
        badge: "👑 トップペア・トップキッカー",
        prompt: "相手はチェックしました。あなたの番です。",
        options: [
          { text: "ハーフポットをベット", grade: "best",
            shortExp: "💡 セオリー通りのバリューベットです",
            outcome: "相手: Call ➔ 🃏 ターンへ",
            explanation: "最も強いキッカーを伴ったトップペアです。相手のKヒット（KQやKJ）や、ポケットペアなどからチップを引き出すために、自分からベットするのが基本のセオリーです。" },
          { text: "チェック", grade: "bad",
            shortExp: "💡 チップを稼ぐチャンスを逃しています",
            outcome: "あなた: Check ➔ 🃏 ターンへ",
            explanation: "ここでチェックしてしまうと、自分より弱い手からチップを取る機会を失い、相手に無料で次のカードを見せて逆転されるリスクを高めてしまいます。" }
        ]
      },
      {
        name: "Turn",
        pot: "11.0 BB",
        board: '<div class="card s">K♠</div><div class="card d">7♦</div><div class="card h">2♥</div><div class="card c">Q♣</div>',
        badge: "👑 依然として強い手",
        prompt: "Q♣が落ちました。相手は再びチェックしました。どうしますか？",
        options: [
          { text: "ベットを続ける", grade: "best",
            shortExp: "💡 引き続きバリューを取りに行きます",
            outcome: "相手: Fold ➔ 🏆 勝利",
            explanation: "Qが落ちましたが、あなたのAKは依然として非常に強力です。相手がKQを持っていれば大勝ちできますし、ドロー系（JTsなど）にもオッズを合わせさせないために打ち続けるのがセオリーです。" },
          { text: "ポットの2倍をベット", grade: "ok",
            shortExp: "💡 少し大きすぎます",
            outcome: "相手: Fold ➔ 🏆 勝利",
            explanation: "バリューベットの意図は良いですが、サイズが大きすぎます。これでは相手の弱い手をすべて降ろしてしまい、チップを最大限に稼げません。" }
        ]
      }
    ]
  },
  {
    level: "⚔️ ポジションとアドバンテージ",
    position: "BTN vs BB",
    preflop: "2.5BB Open ➔ Call",
    effStack: "100 BB",
    heroHand: '<div class="card h">A♥</div><div class="card h">5♥</div>',
    streets: [
      {
        name: "Flop",
        pot: "5.5 BB",
        board: '<div class="card h">J♥</div><div class="card h">7♥</div><div class="card c">2♣</div>',
        badge: "💧 ナッツフラッシュドロー",
        prompt: "相手はチェックしました。役はありませんが強力なドローがあります。",
        options: [
          { text: "チェック", grade: "ok",
            shortExp: "💡 悪くはないですが消極的です",
            outcome: "あなた: Check ➔ 🃏 ターンへ",
            explanation: "無料で次のカードを見るのも一つの手ですが、自分がプリフロップのレイザーである有利（レンジアドバンテージ）を活かしきれていません。" },
          { text: "ベット", grade: "best",
            shortExp: "💡 セミブラフのセオリーです",
            outcome: "相手: Fold ➔ 🏆 勝利",
            explanation: "まだ役は完成していませんが、強いドローを持っている時は「セミブラフ」としてベットするのがセオリーです。相手を降ろして勝つ道と、フラッシュを引いて勝つ道の2つを両立できます。" }
        ]
      }
    ]
  }
];

let currentHandIdx = 0; let currentStreetIdx = 0;
let handScores = []; 
let historyData = [];

function loadStreet() {
  const hand = hands[currentHandIdx];
  const street = hand.streets[currentStreetIdx];

  document.getElementById('level-badge').innerText = `${hand.level} (Hand ${currentHandIdx + 1}/${hands.length})`;
  document.getElementById('position-text').innerText = hand.position;
  document.getElementById('stack-text').innerText = hand.effStack;
  document.getElementById('hero-cards').innerHTML = hand.heroHand;
  document.getElementById('pot-text').innerText = street.pot;
  document.getElementById('street-label').innerText = `Board (${street.name})`;
  document.getElementById('board-cards').innerHTML = street.board;
  
  // バッジとプロンプトの更新
  document.getElementById('hero-badge').innerText = street.badge || "";
  document.getElementById('question-prompt').innerText = street.prompt;

  // 選択肢とフィードバックエリアのリセット
  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  document.getElementById('instant-feedback').style.display = 'none';

  street.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = opt.text;
    btn.onclick = () => handleChoice(opt, index, street.options);
    choicesDiv.appendChild(btn);
  });
}

function handleChoice(selectedOpt, selectedIndex, allOptions) {
  // 1. ボタンの状態変更（アニメーションと色）
  const buttons = document.querySelectorAll('.choice-btn');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === selectedIndex) {
      if (selectedOpt.grade === 'best') {
        btn.classList.add('correct');
      } else if (selectedOpt.grade === 'ok') {
        btn.style.backgroundColor = '#f57c00';
        btn.style.borderColor = '#f57c00';
        btn.style.color = '#fff';
      } else {
        btn.classList.add('wrong');
      }
    }
  });

  // 2. スコアと履歴の保存
  if (!handScores[currentHandIdx]) handScores[currentHandIdx] = [];
  handScores[currentHandIdx].push(selectedOpt.grade === 'best' ? '🟩' : (selectedOpt.grade === 'ok' ? '🟨' : '🟥'));
  
  historyData.push({
    handIdx: currentHandIdx,
    streetName: hands[currentHandIdx].streets[currentStreetIdx].name,
    selectedOpt: selectedOpt,
    allOptions: allOptions
  });

  // 3. 即時フィードバックの表示
  const feedbackDiv = document.getElementById('instant-feedback');
  const msgDiv = document.getElementById('system-message');
  const expDiv = document.getElementById('short-explanation');
  const nextBtn = document.getElementById('next-btn');

  const bestOpt = allOptions.find(o => o.grade === 'best') || allOptions[0];

  let resultMsg = selectedOpt.outcome;
  
  // ミス（妥協手・悪手）の場合は、正解のルートを提示して進行する
  if (selectedOpt.grade !== 'best') {
    resultMsg += `\n(※解説: ${selectedOpt.explanation})`;
    resultMsg += `\n\n▶ セオリー推奨の「${bestOpt.text}」を選んだとして進行します。`;
  }

  let gradeIcon = selectedOpt.grade === 'best' ? '🏆 最善手' : (selectedOpt.grade === 'ok' ? '⚠️ 妥協手' : '❌ 悪手');
  msgDiv.innerText = `${gradeIcon}\n\n${resultMsg}`;
  expDiv.innerText = selectedOpt.shortExp;

  const hand = hands[currentHandIdx];
  if (currentStreetIdx < hand.streets.length - 1) {
    nextBtn.className = "next-btn";
    nextBtn.innerText = `▶ 次へ (${hand.streets[currentStreetIdx + 1].name})`;
  } else {
    if (currentHandIdx < hands.length - 1) {
      nextBtn.className = "next-btn hand-btn";
      nextBtn.innerText = `⏭ 次のハンドへ (Hand ${currentHandIdx + 2}/${hands.length})`;
    } else {
      nextBtn.className = "next-btn hand-btn";
      nextBtn.innerText = `🏁 全ハンド完了！結果を見る`;
    }
  }

  feedbackDiv.style.display = 'flex';
}

function nextStep() {
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
  
  let gridHtml = "";
  hands.forEach((hand, idx) => {
    if(handScores[idx]) gridHtml += `Hand ${idx + 1} (${hand.level}): ${handScores[idx].join('')}<br>`;
  });
  document.getElementById('emoji-grid').innerHTML = gridHtml;
  
  // レビューリストの生成
  renderReviewList();
}

// 振り返りリスト（アコーディオン）を生成する関数
function renderReviewList() {
  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = '';
  
  // 広告視聴前のアピール用ダミーボタン（リワード広告のモック）
  const adBlock = document.createElement('div');
  adBlock.id = 'ad-block';
  adBlock.style.backgroundColor = '#1a1a1a';
  adBlock.style.border = '1px dashed #444';
  adBlock.style.padding = '20px';
  adBlock.style.textAlign = 'center';
  adBlock.style.borderRadius = '8px';
  adBlock.style.marginBottom = '20px';
  adBlock.innerHTML = `
    <p style="color: #ccc; font-size: 0.9em; margin-bottom: 15px;">詳しいセオリー解説を見るには動画広告を視聴してください。</p>
    <button style="background-color: #1976d2; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;" onclick="playAd()">▶ 動画広告を見て解説をアンロック</button>
  `;
  reviewList.appendChild(adBlock);

  // 実際の履歴リスト（初期状態では非表示）
  const historyContainer = document.createElement('div');
  historyContainer.id = 'history-container';
  historyContainer.style.display = 'none';

  historyData.forEach((data, i) => {
    const item = document.createElement('div');
    item.className = 'review-item';
    
    const header = document.createElement('div');
    header.className = 'review-header';
    let icon = data.selectedOpt.grade === 'best' ? '✅' : (data.selectedOpt.grade === 'ok' ? '⚠️' : '❌');
    header.innerHTML = `<span>Hand ${data.handIdx + 1} (${data.streetName})</span> <span>${icon} ▼</span>`;
    
    const body = document.createElement('div');
    body.className = 'review-body';
    
    body.innerHTML = `
      <p style="font-size: 0.9em; color: #ccc; margin-bottom: 15px;">あなたの選択: <strong>${data.selectedOpt.text}</strong></p>
      <div style="font-size: 0.9em; color: #ccc; line-height: 1.6; background: #1a1a1a; padding: 15px; border-radius: 6px; border: 1px solid #333;">${data.selectedOpt.explanation}</div>
    `;

    header.onclick = () => {
      body.style.display = body.style.display === 'block' ? 'none' : 'block';
      header.innerHTML = `<span>Hand ${data.handIdx + 1} (${data.streetName})</span> <span>${icon} ${body.style.display === 'block' ? '▲' : '▼'}</span>`;
    };

    item.appendChild(header);
    item.appendChild(body);
    historyContainer.appendChild(item);
  });
  
  reviewList.appendChild(historyContainer);
}

// リワード広告（モック）の再生関数
function playAd() {
  alert("（ここに15〜30秒の動画広告が流れます）\n\n視聴完了！今日のセオリー解説がアンロックされました。");
  document.getElementById('ad-block').style.display = 'none';
  document.getElementById('history-container').style.display = 'block';
}

function shareResult() {
  let shareText = "Daily Poker Theory\n";
  hands.forEach((hand, idx) => { if(handScores[idx]) shareText += `Hand ${idx + 1}: ${handScores[idx].join('')}\n`; });
  shareText += `#PokerTheory`;
  navigator.clipboard.writeText(shareText).then(() => alert("クリップボードにコピーしました！"));
}

// 初期起動
loadStreet();