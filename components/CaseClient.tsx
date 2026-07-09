'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import type { CaseSession } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  fermi: 'フェルミ推定',
  market_sizing: '市場規模',
  profitability: '収益性',
  strategy: '戦略',
};

export function CaseClient({
  initialPending,
  initialHistory,
}: {
  initialPending: CaseSession | null;
  initialHistory: CaseSession[];
}) {
  const [current, setCurrent] = useState<CaseSession | null>(initialPending);
  const [history, setHistory] = useState<CaseSession[]>(initialHistory);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/case/generate', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      setCurrent(await res.json());
      setAnswer('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '出題に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!current || !answer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/case/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: current.id, answer }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const reviewed: CaseSession = await res.json();
      setCurrent(reviewed);
      setHistory([reviewed, ...history]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'フィードバック取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!current || current.status === 'reviewed' ? (
        <Card className="text-center">
          <p className="mb-3 text-sm text-ink-dim dark:text-ink-dark-dim">
            {current ? '前回の問題は回答済みです' : 'まだ今日の問題を出題していません'}
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? '出題中…' : '新しい問題を出題する'}
          </button>
        </Card>
      ) : null}

      {current && current.status === 'pending' && (
        <Card className="space-y-4">
          <div>
            <span className="mb-1 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] text-accent dark:bg-accent/10 dark:text-accent-dark">
              {current.category ? CATEGORY_LABEL[current.category] : ''}
            </span>
            <p className="mt-2 text-sm font-medium">{current.problem}</p>
          </div>
          <textarea
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="考え方のプロセスも含めて書いてみましょう（結論だけでなく、なぜそう考えたか）"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-bg-dark"
          />
          <button
            onClick={submitAnswer}
            disabled={!answer || loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'AIが評価しています…' : '回答してフィードバックをもらう'}
          </button>
        </Card>
      )}

      {current && current.status === 'reviewed' && current.feedback && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{current.problem}</p>
            <span className="font-mono text-sm text-accent dark:text-accent-dark">
              {current.feedback.score}/10
            </span>
          </div>
          <p className="text-sm text-ink-dim dark:text-ink-dark-dim">「{current.user_answer}」</p>
          <hr className="border-border dark:border-border-dark" />
          <FeedbackRow label="MECE" value={current.feedback.mece} />
          <FeedbackRow label="ロジック" value={current.feedback.logic} />
          <FeedbackRow label="仮説の質" value={current.feedback.hypothesis} />
          <FeedbackRow label="次の改善点" value={current.feedback.improvement} />
          <p className="text-sm">{current.feedback.overall_comment}</p>
        </Card>
      )}

      {error && <p className="text-sm text-urgent">{error}</p>}

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink-dim dark:text-ink-dark-dim">
            過去の記録
          </h2>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id}>
                <Card className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1">{h.problem}</span>
                  {h.feedback && (
                    <span className="shrink-0 font-mono text-xs text-ink-dim dark:text-ink-dark-dim">
                      {h.feedback.score}/10
                    </span>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FeedbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-dim dark:text-ink-dark-dim">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
