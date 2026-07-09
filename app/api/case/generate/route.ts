import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

// 目的：
// フェルミ推定・市場規模・収益性・戦略立案のいずれかから、
// 毎回違う切り口の問題を1問出題する。
// 過去の出題履歴をAIに渡し、同じ問題の繰り返しを避ける。

const SYSTEM_INSTRUCTION = `
あなたはトップ戦略コンサルティングファームの採用面接官です。
候補者の地頭を鍛えるための問題を1問だけ出題してください。

カテゴリはランダムに以下のいずれかから選ぶ：
- fermi（フェルミ推定：例「日本にある電柱の数は？」のような、桁の見積もり問題）
- market_sizing（市場規模：ある製品/サービスの市場規模を推定）
- profitability（収益性：ある事業の売上や利益が落ちている理由を構造的に考えさせる）
- strategy（戦略：新規事業や競争戦略の意思決定を問う）

出力は必ず次のJSON形式のみ：
{
  "problem": "問題文（1-3文、日本語）",
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
