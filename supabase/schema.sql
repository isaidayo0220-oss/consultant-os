-- Consultant OS: Phase 1 スキーマ
-- 目的：AIタスク管理の核となる tasks テーブルのみ、まず作る
-- 将来: learnings / journals / kpis / habits テーブルを同じパターンで追加していく

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,

  -- ユーザーが最初に入力する生のタスク名
  raw_title text not null,

  -- AIとの目的思考の対話で確定する4項目
  purpose text,          -- 目的は？
  deliverable text,      -- 成果物は？
  for_whom text,         -- 誰のため？
  priority_reason text,  -- 優先順位の根拠

  -- 重要度・緊急度マトリクス（AIが自動算出、1-5の5段階）
  importance smallint check (importance between 1 and 5),
  urgency smallint check (urgency between 1 and 5),
  -- 上記2軸から自動分類される象限: "do_now" | "schedule" | "delegate" | "eliminate"
  quadrant text,

  status text not null default 'todo', -- todo | doing | done
  due_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 行レベルセキュリティ：自分のタスクしか見えない/触れないようにする
alter table tasks enable row level security;

create policy "Users can manage their own tasks"
  on tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at を自動更新
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();
