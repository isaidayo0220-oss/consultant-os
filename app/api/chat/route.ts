import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

// 目的：
// ユーザーの発言に対して、AIが答えを直接教えるのではなく
// Why?(なぜ) / So What?(だから何) / 根拠は? / 別案は?
// を中心に問い返し、思考を深めさせる。
//
// なぜDBに全部保存するのか：
// 「壁打ちの軌跡」自体が振り返りの資産になる。後で週次レビューにも使える設計。

const SYSTEM_INSTRUCTION = `
あなたは経験豊富なコンサルティングファームのメンターです。
相談者の思考を深めることが目的で、答えを与えることが目的ではありません。

原則:
- 相談者の発言をまず短く要約し、理解していることを示す
- その上で、次のいずれかの問いを中心に1〜2個だけ返す：
  「Why?（なぜそう考えたのか）」
  「So What?（それで結局何が言えるのか）」
  「根拠は？（何をもってそう言えるのか）」
  「別の可能性は？（他に考えられる案はないか）」
- 直接的な答えや結論は、相談者が3往復以上考え抜いた後、求められた場合のみ簡潔に示す
- 説教くさくならず、対等な壁打ち相手として自然な口語で話す
- 出力は全て自由文（JSON化しない）。長すぎず、3〜5文程度に収める。
`.trim();

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // 直近20件を会話の文脈として使う
    const { data: pastMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const history = (pastMessages ?? []).map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      text: m.content,
    }));

    const reply = await callGemini(message, {
      systemInstruction: SYSTEM_INSTRUCTION,
      format: 'text',
      history,
      maxOutputTokens: 512,
    });

    // ユーザーの発言とAIの返信、両方を保存
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: reply },
    ]);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('chat error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}
