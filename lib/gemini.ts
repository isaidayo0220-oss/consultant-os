// Wire Desk (gemini-client.js) で解決済みの落とし穴を踏襲:
// - gemini-2.5-flash を使う（1.5-flash は廃止済み）
// - thinkingConfig で空応答を防ぐ
// - JSON構造化出力にして、Markdown崩れによるパース失敗を防ぐ
// - 429(レート制限)に対して指数バックオフでリトライ

const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiOptions = {
  systemInstruction?: string;
  maxOutputTokens?: number;
  format?: 'json' | 'text'; // 'text'は壁打ちチャットなど自由文が欲しい場面用
  history?: { role: 'user' | 'model'; text: string }[]; // 複数ターンの会話履歴
};

export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY が設定されていません');

  const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

  const historyContents = (options.history ?? []).map((h) => ({
    role: h.role,
    parts: [{ text: h.text }],
  }));

  const body = {
    contents: [...historyContents, { role: 'user', parts: [{ text: prompt }] }],
    ...(options.systemInstruction && {
      systemInstruction: { parts: [{ text: options.systemInstruction }] },
    }),
    generationConfig: {
      ...(options.format !== 'text' && { responseMimeType: 'application/json' }),
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      thinkingConfig: { thinkingBudget: 0 }, // 即応答を優先（空応答対策）
    },
  };

  const maxRetries = 4;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const waitMs = 2 ** attempt * 1000; // 指数バックオフ: 1s, 2s, 4s, 8s
      lastError = new Error('Gemini rate limited (429)');
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini から空の応答が返りました');
    return text;
  }

  throw lastError ?? new Error('Gemini呼び出しに失敗しました');
}
