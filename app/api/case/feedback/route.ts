import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_INSTRUCTION = `
あなたはIT/DX領域を専門とするコンサルティングファームの採用面接官です。
候補者の回答を、次の4つの観点で評価してください。

- mece: 論点の漏れ・重複はないか（具体的に何が漏れているか指摘する）
- logic: 論理の飛躍や矛盾はないか
- hypothesis: 仮説の質（検証可能で、大胆さと妥当性のバランスが取れているか）
- improvement: 次に改善すべき最も重要な1点

厳しくも建設的に、次の成長につながるフィードバックにしてください。
出力は必ず次のJSON形式のみ：

{
  "mece": "評価コメント（2-3文）",
  "logic": "評価コメント（2-3文）",
  "hypothesis": "評価コメント（2-3文）",
  "improvement": "次に直すべき最重要ポイント（1-2文）",
  "overall_comment": "総合コメント（1-2文、励ましを含める）",
  "score": 1から10の整数
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answer } = await req.json();
    if (!sessionId || !answer) {
      return NextResponse.json({ error: 'sessionId and answer are required' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: session } = await supabase
      .from('case_sessions')
      .select('problem')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'session not found' }, { status: 404 });

    const prompt = `問題: ${session.problem}\n\n候補者の回答: ${answer}`;
    const raw = await callGemini(prompt, { systemInstruction: SYSTEM_INSTRUCTION });
    const feedback = JSON.parse(raw);

    const { data: updated, error } = await supabase
      .from('case_sessions')
      .update({
        user_answer: answer,
        feedback,
        status: 'reviewed',
        answered_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (err) {
    console.error('case feedback error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}
