import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// サーバー側（API Route / Server Component）から呼ぶ用。
// ログイン中のユーザーの cookie を読んで「誰が呼んでいるか」を判定する
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Componentからの呼び出し時は無視してOK（middlewareが処理する）
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // 同上
          }
        },
      },
    }
  );
}
