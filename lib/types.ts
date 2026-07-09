export type Quadrant = 'do_now' | 'schedule' | 'delegate' | 'eliminate';

export interface Task {
  id: string;
  user_id: string;
  raw_title: string;
  purpose: string | null;
  deliverable: string | null;
  for_whom: string | null;
  priority_reason: string | null;
  importance: number | null; // 1-5
  urgency: number | null; // 1-5
  quadrant: Quadrant | null;
  status: 'todo' | 'doing' | 'done';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAnalysis {
  purpose: string;
  deliverable: string;
  for_whom: string;
  priority_reason: string;
  importance: number;
  urgency: number;
  quadrant: Quadrant;
  clarifying_question: string | null; // AIがさらに聞くべきことがあれば
}

// ⑧ AI壁打ち
export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ④ ケース面接・フェルミ推定トレーニング
export type CaseCategory = 'fermi' | 'market_sizing' | 'profitability' | 'strategy';

export interface CaseFeedback {
  mece: string;
  logic: string;
  hypothesis: string;
  improvement: string;
  overall_comment: string;
  score: number; // 1-10
}

export interface CaseSession {
  id: string;
  user_id: string;
  problem: string;
  category: CaseCategory | null;
  user_answer: string | null;
  feedback: CaseFeedback | null;
  status: 'pending' | 'reviewed';
  created_at: string;
  answered_at: string | null;
}
