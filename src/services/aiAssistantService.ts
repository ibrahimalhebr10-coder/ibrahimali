import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface AIResponse {
  answer: string;
  category: string;
  confidence: number;
  matchedFaqId?: string;
  responseTime: number;
  source: 'knowledge_base' | 'default';
}

export interface ConversationHistory {
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

async function ensureConversationSession(sessionId: string, userId?: string): Promise<void> {
  try {
    const { data: existingSession } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (!existingSession) {
      const userType = userId ? 'authenticated' : 'visitor';
      await supabase
        .from('conversation_sessions')
        .insert({
          id: sessionId,
          user_id: userId || null,
          user_type: userType,
          current_page: window.location.pathname,
          language: 'ar',
          is_active: true
        });
    }
  } catch (error) {
    console.error('Error ensuring conversation session:', error);
  }
}

function generateSessionId(): string {
  const stored = localStorage.getItem('assistant_session_id');
  if (stored) return stored;

  const newId = crypto.randomUUID();
  localStorage.setItem('assistant_session_id', newId);
  return newId;
}

export async function askAIAssistant(question: string): Promise<AIResponse> {
  const sessionId = generateSessionId();

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  await ensureConversationSession(sessionId, user?.id);

  const currentPage = window.location.pathname;
  const userContext = {
    currentPage,
    userAgent: navigator.userAgent,
    language: navigator.language
  };

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
        currentPage,
        userContext
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
    .from('conversation_messages')
    .select('content, message_type, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit * 2);

  if (error) {
    console.error('Error loading history:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const conversations: ConversationHistory[] = [];

  for (let i = 0; i < data.length - 1; i += 2) {
    if (data[i].message_type === 'assistant' && data[i + 1]?.message_type === 'user') {
      conversations.push({
        question: data[i + 1].content,
        answer: data[i].content,
        category: 'general',
        created_at: data[i].created_at
      });
    }
  }

  return conversations.slice(0, limit);
}

export async function markHelpful(messageId: string, helpful: boolean): Promise<void> {
  const { error } = await supabase
    .from('conversation_messages')
    .update({ was_helpful: helpful })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking helpful:', error);
  }
}

export async function getSuggestedQuestions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('assistant_faqs')
    .select('question_ar, usage_count')
    .eq('is_active', true)
    .eq('is_approved', true)
    .order('usage_count', { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    return [
      'ما فكرة المنصة؟',
      'هل املك الشجرة فعليا؟',
      'كيف استفيد من المحصول؟',
      'ماذا لو حصلت مشكلة في المزرعة؟',
      'هل يوجد التزام طويل؟'
    ];
  }

  return data.map(faq => faq.question_ar);
}
