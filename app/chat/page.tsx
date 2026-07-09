import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavBar } from '@/components/NavBar';
import { ChatClient } from '@/components/ChatClient';
import type { ChatMessage } from '@/lib/types';

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)
    .returns<ChatMessage[]>();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-6">
      <NavBar />
      <div>
        <h1 className="text-lg font-semibold">AI壁打ち</h1>
        <p className="text-sm text-ink-dim dark:text-ink-dark-dim">
          答えは教えません。一緒に考えを深めます。
        </p>
      </div>
      <ChatClient initialMessages={messages ?? []} />
    </div>
  );
}
