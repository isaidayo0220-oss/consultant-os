import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

// 目的：
// フェルミ推定・市場規模・収益性・戦略立案のいずれかから、
// 毎回違う切り口の問題を1問出題する。
// 過去の出題履歴をAIに渡し、同じ問題の繰り返しを避ける。

const SYSTEM_INSTRUCTION = `
あなたはIT/DX領域を専門とするコンサルティングファームの採用面接官です。
候補者はこれからITコンサルタントとして働く予定です。
実務で問われる地頭・構造化思考を鍛えるための問題を1問だけ出題してください。

問題は必ず「IT・テクノロジー・DX（デジタルトランスフォーメーション）」の文脈にすること。
一般的なビジネス問題（コンビニの数、飲食店の売上等）ではなく、以下のような題材を使う：
- SaaS/クラウドサービスの利用者数や処理量の見積もり
- システムの必要スペック・インフラコストの概算
- ある企業のDX推進が進まない/失敗している理由の構造化
- IT導入プロジェクトの投資対効果（ROI）の検討
- レガシーシステム刷新・クラウド移行の意思決定
- 新しいITサービス/プロダクトの市場規模や競争戦略
- セキュリティインシデント発生時の原因の構造的な切り分け

カテゴリはランダムに以下のいずれかから選ぶ：
- fermi（フェルミ推定：ITシステムの規模・トラフィック・コストなどの桁の見積もり問題）
- market_sizing（市場規模：ITサービス/SaaSの市場規模推定）
- profitability（収益性・DX推進：IT投資の効果やDXが進まない理由を構造的に考えさせる）
- strategy（戦略：システム刷新・クラウド移行・新規ITサービスの意思決定）

出力は必ず次のJSON形式のみ：
{
  "problem": "問題文（1-3文、日本語。具体的な企業名や数値の前提はあってよいが、実在の企業名は使わない）",
  "category": "fermi" | "market_sizing" | "profitability" | "strategy"
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: recent } = await supabase
      .from('case_sessions')
      .select('problem')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const avoidList = (recent ?? []).map((r) => `- ${r.problem}`).join('\n');
    const prompt = avoidList
      ? `直近に出題した問題（これらと似た切り口は避けてください）:\n${avoidList}\n\n新しい問題を1問出題してください。`
      : '最初の問題を1問出題してください。';

    const raw = await callGemini(prompt, { systemInstruction: SYSTEM_INSTRUCTION });
    const { problem, category } = JSON.parse(raw);

    const { data: inserted, error } = await supabase
      .from('case_sessions')
      .insert({ user_id: user.id, problem, category, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('case generate error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}
