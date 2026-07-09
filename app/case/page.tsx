import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavBar } from '@/components/NavBar';
import { CaseClient } from '@/components/CaseClient';
import type { CaseSession } from '@/lib/types';

export default async function CasePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 未回答のものがあればそれを再表示、なければ直近の履歴を見せる
  const { data: pending } = await supabase
    .from('case_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<CaseSession[]>();

  const { data: history } = await supabase
    .from('case_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'reviewed')
    .order('created_at', { ascending: false })
    .limit(5)
    .returns<CaseSession[]>();

  return (
    <div className="space-y-6">
      <NavBar />
      <div>
        <h1 className="text-lg font-semibold">フェルミ推定・ケース面接トレーニング</h1>
        <p className="text-sm text-ink-dim dark:text-ink-dark-dim">
          毎回違う切り口の問題に答えて、MECE・ロジック・仮説の質を鍛えます
        </p>
      </div>
      <CaseClient initialPending={pending?.[0] ?? null} initialHistory={history ?? []} />
    </div>
  );
}
