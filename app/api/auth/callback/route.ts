import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// メールのマジックリンクをクリックした後、ここに戻ってきて
// 一時コードを正式なログインセッションに交換する
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // 失敗理由を/loginに渡して、画面上で確認できるようにする
      // (よくある原因: リンクをリクエストしたブラウザと開いたブラウザが違う)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
