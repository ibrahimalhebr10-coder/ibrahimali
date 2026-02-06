import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  question: string;
  sessionId: string;
  userId?: string;
  currentPage?: string;
  userContext?: Record<string, any>;
}

interface FAQ {
  id: string;
  question_ar: string;
  answer_ar: string;
  question_variations: any;
  intent_tags: string[];
  usage_count: number;
}

interface SearchResult {
  faq: FAQ;
  score: number;
  matchType: 'exact' | 'variation' | 'keyword';
}

async function searchInKnowledgeBase(
  supabase: any,
  question: string
): Promise<SearchResult | null> {
  const lowerQuestion = question.toLowerCase().trim();

  const { data: faqs, error } = await supabase
    .from('assistant_faqs')
    .select('*')
    .eq('is_active', true)
    .eq('is_approved', true);

  if (error || !faqs || faqs.length === 0) {
    console.log('No FAQs found or error:', error);
    return null;
  }

  let bestMatch: SearchResult | null = null;
  let highestScore = 0;

  for (const faq of faqs) {
    let score = 0;
    let matchType: 'exact' | 'variation' | 'keyword' = 'keyword';

    const mainQuestion = faq.question_ar?.toLowerCase() || '';

    if (mainQuestion === lowerQuestion) {
      score = 100;
      matchType = 'exact';
    } else if (mainQuestion.includes(lowerQuestion) || lowerQuestion.includes(mainQuestion)) {
      score = 90;
      matchType = 'exact';
    }

    if (score === 0 && faq.question_variations) {
      const variations = Array.isArray(faq.question_variations)
        ? faq.question_variations
        : [];

      for (const variation of variations) {
        const varLower = (typeof variation === 'string' ? variation : '').toLowerCase();
        if (varLower === lowerQuestion) {
          score = 95;
          matchType = 'variation';
          break;
        } else if (varLower.includes(lowerQuestion) || lowerQuestion.includes(varLower)) {
          score = Math.max(score, 85);
          matchType = 'variation';
        }
      }
    }

    if (score === 0) {
      const questionWords = lowerQuestion.split(/\s+/).filter(w => w.length > 2);
      const faqWords = mainQuestion.split(/\s+/).filter(w => w.length > 2);

      const matchingWords = questionWords.filter(word =>
        faqWords.some(faqWord => faqWord.includes(word) || word.includes(faqWord))
      );

      if (matchingWords.length > 0) {
        score = (matchingWords.length / questionWords.length) * 70;
        matchType = 'keyword';
      }
    }

    if (faq.intent_tags && Array.isArray(faq.intent_tags)) {
      for (const tag of faq.intent_tags) {
        if (lowerQuestion.includes(tag.toLowerCase())) {
          score += 10;
        }
      }
    }

    if (score > highestScore && score >= 50) {
      highestScore = score;
      bestMatch = {
        faq,
        score,
        matchType
      };
    }
  }

  return bestMatch;
}

async function saveUnansweredQuestion(
  supabase: any,
  sessionId: string,
  question: string,
  userContext: Record<string, any>
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('unanswered_questions')
      .select('id, frequency')
      .eq('question', question)
      .eq('status', 'new')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('unanswered_questions')
        .update({
          frequency: existing.frequency + 1,
          session_id: sessionId
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('unanswered_questions')
        .insert({
          session_id: sessionId,
          question,
          user_context: userContext,
          current_page: userContext.currentPage || null,
          user_type: userContext.userType || 'visitor',
          frequency: 1,
          status: 'new'
        });
    }
  } catch (error) {
    console.error('Error saving unanswered question:', error);
  }
}

async function saveConversationMessage(
  supabase: any,
  sessionId: string,
  question: string,
  answer: string,
  matchedFaqId: string | null,
  confidenceScore: number,
  responseTimeMs: number
): Promise<void> {
  try {
    await supabase.from('conversation_messages').insert([
      {
        session_id: sessionId,
        message_type: 'user',
        content: question,
        created_at: new Date().toISOString()
      },
      {
        session_id: sessionId,
        message_type: 'assistant',
        content: answer,
        matched_faq_id: matchedFaqId,
        confidence_score: confidenceScore,
        response_time_ms: responseTimeMs,
        created_at: new Date().toISOString()
      }
    ]);

    await supabase
      .from('conversation_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (matchedFaqId) {
      const { data } = await supabase
        .from('assistant_faqs')
        .select('usage_count')
        .eq('id', matchedFaqId)
        .maybeSingle();

      if (data) {
        await supabase
          .from('assistant_faqs')
          .update({ usage_count: (data.usage_count || 0) + 1 })
          .eq('id', matchedFaqId);
      }
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

const defaultAnswer = `شكراً على سؤالك!

للأسف، لا أملك إجابة دقيقة على هذا السؤال حالياً. لكن فريقنا المتخصص جاهز لمساعدتك!

يمكنك التواصل معنا عبر:
• واتساب: للحصول على رد سريع ومباشر
• فريق الدعم: متاح 24/7 لخدمتك

سؤالك مهم بالنسبة لنا، وسنعمل على تحسين إجاباتنا لنخدمك بشكل أفضل.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      question,
      sessionId,
      userId,
      currentPage,
      userContext = {}
    }: RequestBody = await req.json();

    if (!question || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const searchResult = await searchInKnowledgeBase(supabase, question);
    const responseTime = Date.now() - startTime;

    let answer: string;
    let matchedFaqId: string | null = null;
    let confidenceScore: number;
    let category = 'general';

    if (searchResult && searchResult.score >= 70) {
      answer = searchResult.faq.answer_ar;
      matchedFaqId = searchResult.faq.id;
      confidenceScore = searchResult.score / 100;
      category = 'knowledge_base';
    } else {
      answer = defaultAnswer;
      confidenceScore = 0;

      await saveUnansweredQuestion(
        supabase,
        sessionId,
        question,
        {
          ...userContext,
          currentPage,
          userType: userId ? 'authenticated' : 'visitor'
        }
      );
    }

    await saveConversationMessage(
      supabase,
      sessionId,
      question,
      answer,
      matchedFaqId,
      confidenceScore,
      responseTime
    );

    return new Response(
      JSON.stringify({
        answer,
        category,
        confidence: confidenceScore,
        matchedFaqId,
        responseTime,
        source: matchedFaqId ? 'knowledge_base' : 'default'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        answer: defaultAnswer
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
