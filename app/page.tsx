import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/Card';
import { NavBar } from '@/components/NavBar';
import type { Task } from '@/lib/types';

const QUADRANT_LABEL: Record<string, string> = {
  do_now: '今すぐやる',
  schedule: '計画する',
  delegate: '任せる',
  eliminate: 'やめる',
};

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'done')
    .order('urgency', { ascending: false })
    .returns<Task[]>();

  const doneCountRes = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'done');
  const totalCountRes = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true });

  const done = doneCountRes.count ?? 0;
  const total = totalCountRes.count ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <NavBar />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">おはようございます</h1>
          <p className="text-sm text-ink-dim dark:text-ink-dark-dim">
            今日の思考と行動を整えましょう
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + タスク追加
        </Link>
      </header>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-dim dark:text-ink-dark-dim">
            全体の進捗
          </span>
          <span className="font-mono text-sm">
            {done}/{total}（{progress}%）
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border dark:bg-border-dark">
          <div
            className="h-1.5 rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink-dim dark:text-ink-dark-dim">
          今日のタスク
        </h2>

        {!tasks || tasks.length === 0 ? (
          <Card className="text-sm text-ink-dim dark:text-ink-dark-dim">
            まだタスクがありません。右上の「+ タスク追加」から、最初のタスクを目的思考で登録しましょう。
          </Card>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.raw_title}</p>
                    {t.purpose && (
                      <p className="mt-0.5 text-xs text-ink-dim dark:text-ink-dark-dim">
                        {t.purpose}
                      </p>
                    )}
                  </div>
                  {t.quadrant && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[11px] text-accent dark:bg-accent/10 dark:text-accent-dark">
                      {QUADRANT_LABEL[t.quadrant]}
                    </span>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
