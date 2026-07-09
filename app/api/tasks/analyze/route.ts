import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import type { TaskAnalysis } from '@/lib/types';

// 目的：
// ユーザーが入力した「生のタスク名」を、目的思考のタスクに変換する。
// 「目的は？」「成果物は？」「誰のため？」「優先順位は？」をAIが埋め、
// 重要度・緊急度（1-5）を自動算出してマトリクスの象限を決める。
//
// なぜAPI Route(サーバー側)で呼ぶのか：
// Gemini APIキーはサーバーの環境変数にしか置かない。
// ブラウザから直接Geminiを呼ぶとキーが誰でも見える状態でweb上に公開されてしまうため、
// 必ずこの中継地点(API Route)を経由させる。

const SYSTEM_INSTRUCTION = `
あなたはトップコンサルティングファームのプリンシパルです。
部下から曖昧なタスクを渡されたとき、必ず「目的思考」に変換してから着手させます。

与えられたタスク名から、以下を推定してJSONで返してください。
情報が不足していて確信が持てない場合は clarifying_question に1つだけ質問を入れてください。
十分に推定できる場合は clarifying_question は null にしてください。

出力は必ず次のJSON形式のみ。前置きや説明文、Markdownのコードブロックは一切付けないこと。

{
  "purpose": "このタスクの目的（なぜやるのか、1文）",
  "deliverable": "具体的な成果物（何を完成させるのか、1文）",
  "for_whom": "誰のためのタスクか",
  "priority_reason": "優先順位をこう考えた理由（1-2文）",
  "importance": 1から5の整数（ビジネスインパクトの大きさ）,
  "urgency": 1から5の整数（時間的な締切の近さ）,
  "quadrant": "do_now" | "schedule" | "delegate" | "eliminate",
  "clarifying_question": "追加で確認すべき質問、なければnull"
}

quadrantの判定基準:
- importance>=4 かつ urgency>=4 => "do_now"
- importance>=4 かつ urgency<4  => "schedule"
- importance<4  かつ urgency>=4 => "delegate"
- importance<4  かつ urgency<4  => "eliminate"
`.trim();

export async function POST(req: NextRequest) {
  try {
    const { rawTitle, userAnswer } = await req.json();

    if (!rawTitle || typeof rawTitle !== 'string') {
      return NextResponse.json({ error: 'rawTitle is required' }, { status: 400 });
    }

    const prompt = userAnswer
      ? `タスク名: ${rawTitle}\n追加で得られた回答: ${userAnswer}`
      : `タスク名: ${rawTitle}`;

    const raw = await callGemini(prompt, { systemInstruction: SYSTEM_INSTRUCTION });
    const analysis: TaskAnalysis = JSON.parse(raw);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error('task analyze error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}
