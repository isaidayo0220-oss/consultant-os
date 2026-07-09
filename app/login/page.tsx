'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/Card';

// パスワードを覚える必要がない「マジックリンク」方式。
// メールアドレスを入れると、そこにログイン用のリンクが届く仕組み。
export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold">Consultant OS</h1>
        <p className="mb-6 text-sm text-ink-dim dark:text-ink-dark-dim">
          毎日の行動を成果につなげるAIアシスタント
        </p>

        {sent ? (
          <p className="text-sm">
            <span className="font-medium">{email}</span> 宛にログインリンクを送りました。メールを確認してください。
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-bg-dark"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              ログインリンクを送る
            </button>
            {error && <p className="text-sm text-urgent">{error}</p>}
          </form>
        )}
        {callbackError && !error && (
          <p className="mt-3 text-sm text-urgent">ログインに失敗しました: {callbackError}</p>
        )}
      </Card>
    </div>
  );
}
