import { createBrowserClient } from '@supabase/ssr';

// ブラウザ（Reactコンポーネント）から呼ぶ用。
// anon keyは公開されて問題ない鍵（RLSで守られているため）
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
