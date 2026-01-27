import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface AIResponse {
  answer: string;
  category: 'curious' | 'worried' | 'investment';
  sentiment: string;
}

export interface ConversationHistory {
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

function generateSessionId(): string {
  const stored = localStorage.getItem('assistant_session_id');
  if (stored) return stored;

  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('assistant_session_id', newId);
  return newId;
}

export async function askAIAssistant(question: string): Promise<AIResponse> {
  const sessionId = generateSessionId();

  const { data: { user } } = await supabase.auth.getUser();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/smart-assistant`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        sessionId,
        userId: user?.id,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await response.json();
  return data;
}

export async function getConversationHistory(limit = 10): Promise<ConversationHistory[]> {
  const sessionId = generateSessionId();

  const { data, error } = await supabase
    .from('assistant_conversations')
    .select('question, answer, category, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function markHelpful(conversationId: string, helpful: boolean): Promise<void> {
  const { error } = await supabase
    .from('assistant_conversations')
    .update({ helpful })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function getSuggestedQuestions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('assistant_conversations')
    .select('question')
    .not('helpful', 'is', null)
    .eq('helpful', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data) {
    return [
      'ما فكرة المنصة؟',
      'هل املك الشجرة فعليا؟',
      'كيف استفيد من المحصول؟',
    ];
  }

  const uniqueQuestions = [...new Set(data.map(d => d.question))];
  return uniqueQuestions.slice(0, 3);
}
