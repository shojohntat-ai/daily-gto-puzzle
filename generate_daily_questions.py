import os
import json
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from google import genai
from google.genai import types
JST = timezone(timedelta(hours=9), 'JST')

load_dotenv()

# ==========================================
# 1. 接続設定
# ==========================================
SUPABASE_URL = "https://gacwxlqpewjajpxsffnx.supabase.co"

# 環境変数からキーを取得（ハードコードは絶対に避ける）
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# キーが取得できなかった場合のエラー処理
if not SUPABASE_SERVICE_ROLE_KEY or not GEMINI_API_KEY:
    raise ValueError("環境変数に API_KEY が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# 配信対象日（テスト用に明日の日付を指定）
TARGET_DATE = datetime.now(JST).strftime('%Y-%m-%d')




# ==========================================
# 2. Geminiへのプロンプト指示（強化版）
# ==========================================
SYSTEM_INSTRUCTION = """
あなたはWebアプリ「Daily Poker Theory」向けの問題自動生成エンジンです。
ポーカー初心者が直感的に定石（セオリー）を学べるパズルデータを、厳格なJSON形式で出力してください。

【カードHTMLの仕様（最重要）】
カードは必ず以下の形式で出力すること：
<div class="card s">A♠</div> (s=スペード黒, h=ハート赤, d=ダイヤ青, c=クラブ緑)
※文字抜けを防ぐため、必ずクラス名（s, h, d, c）を付与すること。

【ゲームルールと数値の整合性】
1. テーブルスタック: 各問題の開始時は100BB持ち（プリフロップ投資後 97.5BB 等）。
2. アクション選択肢 (options) の厳格ルール【必須】:
   - 各ストリートの "options" 配列には、必ず【厳密に4つの選択肢】を含めること（2個や3個は不可）。
   - 4つのうち「best」は必ず1つ、残りの3つは「ok」または「bad」とすること。
   - ボタン表記は「Check」「Call」「Fold」「33% Bet (1.8 BB)」「All-in」など、純粋なアクション名と数値のみ。
3. フィードバックと解説:
   - shortExp: 「ドライボードの鉄則サイズ！」「稼げるチャンスの放棄」など簡潔に。
   - outcome: 「あなた: 1.8BB Bet ➔ 相手: Call ➔ 🃏 ターンへ」のように進行を明記。
   - explanation: 「なぜその手なのか/なぜダメなのか」を初心者向けに具体的に説明。
4. 投資額とボーナス (必須):
   - investCost: そのアクションを選んだ際の投資BB額（Check/Foldは0）。
   - theoryBonus: bestは+15〜+25、okは0〜+5、badは-10〜-25。
5. 最終ストリート（決着時）の必須項目:
   - 最終ストリートの各optionには、必ず以下を含めること：
     - "showdown": true
     - "handNetResult": 最終的なポット収支の数値（勝利時は獲得プラス値、フォールド時はマイナス値）。
   - 原則として「bestを選べばプレイヤーが勝利してハンド収支がプラスになる」展開にすること。
"""

def generate_questions_for(difficulty: str, count: int = 5):
    prompt = f"""
    難易度「{difficulty}」の問題を {count} 問生成してください。
    全問が3ストリート完走型である必要はありません。1手完結型、2ストリート型、3ストリート完走型をバランスよく混ぜてください。

    【重要】各ストリートの "options" には、必ず【4つの選択肢】（bestが1つ、他3つはokまたはbad）を入れてください。

    出力形式（JSON配列のみ）：
    [
      {{
        "theme": "ハンドのテーマ（例: ① ドライボードのトップペア）",
        "position": "BTN vs BB",
        "villainPos": "BB",
        "preflopInvested": 2.5,
        "heroHand": "<div class=\\"card s\\">A♠</div><div class=\\"card c\\">K♣</div>",
        "villainHand": "<div class=\\"card h\\">K♥</div><div class=\\"card d\\">T♦</div>",
        "streets": [
          {{
            "name": "Flop",
            "pot": "5.5",
            "villainAction": "Check",
            "board": "<div class=\\"card s\\">K♠</div><div class=\\"card d\\">7♦</div><div class=\\"card h\\">2♥</div>",
            "badge": "👑 トップペア・最強キッカー",
            "prompt": "相手はチェック。どうしますか？",
            "options": [
              {{
                "text": "33% Bet (1.8 BB)",
                "grade": "best",
                "investCost": 1.8,
                "theoryBonus": 15,
                "shortExp": "ドライボードの鉄則サイズ！",
                "outcome": "あなた: 1.8BB Bet ➔ 相手: Call",
                "explanation": "ドライなボードでは小さく打つことで、相手の弱いペアからも広くコールを引き出せます。"
              }},
              {{
                "text": "Check",
                "grade": "bad",
                "investCost": 0,
                "theoryBonus": -15,
                "shortExp": "バリューを取り逃がしています",
                "outcome": "定石の33% Betルートへ進行",
                "explanation": "チェックすると相手にフリーカードを与えてしまいます。"
              }},
              {{
                "text": "75% Bet (4.1 BB)",
                "grade": "ok",
                "investCost": 1.8,
                "theoryBonus": 5,
                "shortExp": "少し大きめです",
                "outcome": "定石の33% Betルートへ進行",
                "explanation": "悪くありませんが相手の弱い手が降りやすくなります。"
              }},
              {{
                "text": "All-in",
                "grade": "bad",
                "investCost": 1.8,
                "theoryBonus": -20,
                "shortExp": "極端すぎます",
                "outcome": "定石の33% Betルートへ進行",
                "explanation": "相手が逃げてしまいます。"
              }}
            ]
          }}
        ]
      }}
    ]
    """

    response = ai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    return json.loads(response.text)

# ==========================================
# 3. Supabaseへの一括登録処理
# ==========================================
def main():
    print(f"--- 📅 配信日: {TARGET_DATE} の問題生成を開始 ---")
    
    # 初心者5問 ＋ 中級者5問
    difficulties = ["初心者", "中級者"]
    
    for diff in difficulties:
        print(f"🤖 Geminiで {diff} コースの問題を生成中...")
        questions = generate_questions_for(diff, count=5)
        
        insert_payload = []
        for idx, q in enumerate(questions, start=1):
            insert_payload.append({
                "publish_date": TARGET_DATE,
                "difficulty": diff,
                "hand_order": idx,
                "theme": q.get("theme", f"問題 {idx}"),
                "position": q.get("position", "BTN vs BB"),
                "villain_pos": q.get("villainPos", "BB"),
                "preflop_invested": q.get("preflopInvested", 2.5),
                "hero_hand": q.get("heroHand", ""),
                "villain_hand": q.get("villainHand", ""),
                "streets": q.get("streets", [])
            })
        
        # Supabaseへ一括投入（upsertで重複防止）
        print(f"💾 Supabaseの daily_questions に {len(insert_payload)} 件を登録中...")
        res = supabase.table("daily_questions").upsert(
            insert_payload,
            on_conflict="publish_date,difficulty,hand_order"
        ).execute()
        print(f"✅ {diff} コースの登録完了！")

    print(f"🎉 すべての自動登録が正常に完了しました！ (配信日: {TARGET_DATE})")

if __name__ == "__main__":
    main()