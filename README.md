# Consultant OS — セットアップ手順（Phase 1 MVP）

このPhase 1では「ダッシュボード」と「AIタスク管理（目的思考への変換＋重要度緊急度マトリクス）」が動きます。
スマホ・PCどちらからも同じデータを見られるよう、Supabase（無料のクラウドDB）とVercel（無料ホスティング）を使います。

## 全体の流れ（4ステップ）

1. GitHubに新しいリポジトリを作り、このプロジェクトをアップロードする
2. Supabaseでプロジェクトを作り、DBのテーブルを作る
3. Vercelでリポジトリをつなぎ、環境変数を設定してデプロイする
4. 動作確認

---

## Step 1: GitHubにリポジトリを作る

1. https://github.com/new を開く
2. Repository name: `consultant-os`
3. Public / Private どちらでもOK（Private推奨）
4. 「Create repository」

このzipファイルを展開し、中身をそのまま「Add file → Upload files」でアップロードしてください。
（Wire Deskの時と同じく、`.github`などの隠しフォルダはこのプロジェクトには含まれていないので今回は問題ありません）

## Step 2: Supabaseでプロジェクトを作る

1. https://supabase.com/dashboard へアクセスし、GitHubアカウントでログイン
2. 「New project」→ 名前は `consultant-os`、リージョンは `Northeast Asia (Tokyo)` を選択
3. データベースパスワードは自動生成のままでOK（控えておいてください）
4. プロジェクトが起動したら、左メニューの「SQL Editor」を開く
5. `supabase/schema.sql` の中身を全部コピーして貼り付け、「Run」を押す
   → これで `tasks` テーブルが作られます
6. 左メニューの「Authentication → Providers」で **Email** が有効になっていることを確認
7. 左メニューの「Project Settings → API」を開き、以下の2つをメモする：
   - `Project URL` → 後で `NEXT_PUBLIC_SUPABASE_URL` に使う
   - `anon public` キー → 後で `NEXT_PUBLIC_SUPABASE_ANON_KEY` に使う

## Step 3: Gemini APIキーを用意する

Wire Deskで使っているものと同じ取得元です：
https://aistudio.google.com/apikey

このプロジェクト専用に新しいキーを1つ発行することを推奨します（後で利用量を混同しないため）。

## Step 4: Vercelでデプロイする

1. https://vercel.com/new へアクセスし、GitHubアカウントでログイン
2. 先ほど作った `consultant-os` リポジトリを選択して「Import」
3. 「Environment Variables」に以下の3つを追加：

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Step 2でメモしたProject URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 2でメモしたanon publicキー |
   | `GEMINI_API_KEY` | Step 3で発行したキー |

4. 「Deploy」を押す（3-5分で完了）
5. 完了すると `https://consultant-os-xxxx.vercel.app` のようなURLが発行されます

## Step 5: Supabaseにログイン後のリダイレクト先を許可する

1. SupabaseのDashboard → Authentication → URL Configuration
2. 「Redirect URLs」に、Vercelで発行されたURL + `/api/auth/callback` を追加
   例: `https://consultant-os-xxxx.vercel.app/api/auth/callback`

## 動作確認

1. VercelのURLにアクセス → `/login` に自動で飛ばされる
2. メールアドレスを入力 → 届いたメールのリンクをタップ
3. ダッシュボードが表示されればOK
4. 「+ タスク追加」→ 何かタスク名を入れて「AIに目的を深掘りしてもらう」を押す
   → AIが目的・成果物・重要度緊急度を提案してくれます

---

## Phase 2: AI壁打み・フェルミ推定トレーニングを追加する場合

1. Supabaseの「SQL Editor」で `supabase/schema_phase2.sql` の中身を実行する（テーブルが2つ増えます）
2. GitHubリポジトリに、増えたファイル一式をアップロードする（`app/chat`, `app/case`, `app/api/chat`, `app/api/case`, `components/NavBar.tsx`, `components/CaseClient.tsx`, `components/ChatClient.tsx`、更新された `app/page.tsx` `app/tasks/new/page.tsx` `lib/gemini.ts` `lib/types.ts`）
3. Vercelは、GitHubへのアップロードを検知して自動で再デプロイします。新しい環境変数は不要です
4. デプロイ後、ダッシュボード上部に「フェルミ推定」「AI壁打ち」のナビゲーションが表示されればOK

## 次にやること（Phase 3の候補）

- ⑤ジャーナル（今日やったこと・学び・反省・感謝を記録）
- ⑥KPI管理（読書・運動・勉強時間などをグラフ表示）
- ⑦習慣管理（ストリーク・達成率）
- ⑧AI壁打ち（Why?/So What?で思考を深めるチャット）

このリストの順番は固定ではありません。実際に①②を数日使ってみて、
「もっとここが欲しい」と感じたものから優先して作っていきましょう。
