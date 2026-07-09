'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';

export function ChatClient({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    setError(null);

    // 楽観的にユーザーの発言をすぐ表示する
    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimisticUser]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { reply } = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: `temp-reply-${Date.now()}`,
          user_id: '',
          role: 'assistant',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <p className="text-sm text-ink-dim dark:text-ink-dark-dim">
            考えていること、悩んでいることを何でも書いてみてください。
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-card px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-accent text-white'
                : 'border border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-urgent">{error}</p>}

      <div className="flex gap-2 border-t border-border pt-3 dark:border-border-dark">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-bg-dark"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  );
}
