'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/Card';
import { NavBar } from '@/components/NavBar';
import { TaskMatrix } from '@/components/TaskMatrix';
import type { TaskAnalysis } from '@/lib/types';

type Step = 'input' | 'clarify' | 'review';

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [rawTitle, setRawTitle] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(answer?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTitle, userAnswer: answer }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '分析に失敗しました');
      const data: TaskAnalysis = await res.json();
      setAnalysis(data);
      setStep(data.clarifying_question ? 'clarify' : 'review');
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!analysis) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      raw_title: rawTitle,
      purpose: analysis.purpose,
      deliverable: analysis.deliverable,
      for_whom: analysis.for_whom,
      priority_reason: analysis.priority_reason,
      importance: analysis.importance,
      urgency: analysis.urgency,
      quadrant: analysis.quadrant,
    });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/');
  }

  return (
    <div className="space-y-6">
      <NavBar />
      <h1 className="text-lg font-semibold">タスクを目的思考に変換する</h1>

      {step === 'input' && (
        <Card className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-ink-dim dark:text-ink-dark-dim">
              何をやりますか？
            </label>
            <input
              autoFocus
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              placeholder="例：来週の提案資料を作る"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-bg-dark"
            />
          </div>
          <button
            disabled={!rawTitle || loading}
            onClick={() => analyze()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'AIが考えています…' : 'AIに目的を深掘りしてもらう'}
          </button>
        </Card>
      )}

      {step === 'clarify' && analysis && (
        <Card className="space-y-4">
          <p className="text-sm text-ink-dim dark:text-ink-dark-dim">AIからの質問</p>
          <p className="text-sm font-medium">{analysis.clarifying_question}</p>
          <input
            autoFocus
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-bg-dark"
          />
          <button
            disabled={!userAnswer || loading}
            onClick={() => analyze(userAnswer)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'AIが考えています…' : '回答する'}
          </button>
        </Card>
      )}

      {step === 'review' && analysis && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <Field label="目的" value={analysis.purpose} />
            <Field label="成果物" value={analysis.deliverable} />
            <Field label="誰のため" value={analysis.for_whom} />
            <Field label="優先順位の根拠" value={analysis.priority_reason} />
          </Card>

          <Card className="flex flex-col items-center gap-3">
            <p className="self-start text-xs text-ink-dim dark:text-ink-dark-dim">
              重要度・緊急度マトリクス
            </p>
            <TaskMatrix importance={analysis.importance} urgency={analysis.urgency} />
          </Card>

          <button
            disabled={loading}
            onClick={handleSave}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? '保存しています…' : 'このタスクを保存する'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-urgent">{error}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-dim dark:text-ink-dark-dim">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
