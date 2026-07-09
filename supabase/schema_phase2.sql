-- Consultant OS: Phase 2 追加スキーマ
-- Supabase の SQL Editor で、Phase 1 の schema.sql に続けて実行してください

-- ⑧ AI壁打ち：会話ログをすべて保存し、後で「思考の軌跡」を振り返れるようにする
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "Users can manage their own chat messages"
  on chat_messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ④ ケース面接・フェルミ推定トレーニング
create table if not exists case_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,

  problem text not null,       -- 出題内容
  category text,               -- 'fermi' | 'market_sizing' | 'profitability' | 'strategy' など

  user_answer text,            -- ユーザーの回答（未回答の間はnull）
  feedback jsonb,              -- {mece, logic, hypothesis, improvement, overall_comment, score}

  status text not null default 'pending', -- pending(出題のみ) | reviewed(回答+フィードバック済み)

  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table case_sessions enable row level security;

create policy "Users can manage their own case sessions"
  on case_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
