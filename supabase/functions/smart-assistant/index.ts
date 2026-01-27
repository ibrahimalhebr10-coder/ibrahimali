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
}

interface KnowledgeItem {
  topic: string;
  content: string;
  keywords: string[];
  priority: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { question, sessionId, userId }: RequestBody = await req.json();

    if (!question || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const knowledgeBase = await supabase
      .from("assistant_knowledge_base")
      .select("*")
      .order("priority", { ascending: false });

    const recentConversations = await supabase
      .from("assistant_conversations")
      .select("question, answer, category")
      .order("created_at", { ascending: false })
      .limit(20);

    const learningContext = recentConversations.data
      ?.map((conv) => `س: ${conv.question}\nج: ${conv.answer}`)
      .join("\n\n") || "";

    const knowledgeContext = knowledgeBase.data
      ?.map((kb: KnowledgeItem) => `[${kb.topic}]: ${kb.content}`)
      .join("\n\n") || "";

    const systemPrompt = `أنت مساعد ذكي لمنصة استثمار زراعي سعودية. دورك هو الإجابة على أسئلة المستخدمين بطريقة ودية، واضحة، ومطمئنة.

قواعد مهمة:
1. استخدم اللغة العربية السعودية البسيطة والودية
2. كن موجزاً - الإجابة المثالية 2-4 أسطر
3. لا تبيع أو تضغط على المستخدم
4. طمئن المستخدم إذا كان السؤال يحمل قلقاً
5. كن إيجابياً لكن واقعياً
6. لا تذكر أرقام أو تفاصيل غير موجودة في قاعدة المعرفة
7. إذا لم تعرف الإجابة، قل ذلك بصراحة واقترح التواصل مع الدعم

قاعدة المعرفة:
${knowledgeContext}

أمثلة من محادثات سابقة للتعلم منها:
${learningContext}

اجب على السؤال التالي بأسلوب ودي ومطمئن:`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error("OpenAI API request failed");
    }

    const openaiData = await openaiResponse.json();
    const answer = openaiData.choices[0]?.message?.content || "عذراً، لم أستطع معالجة سؤالك. حاول مرة أخرى.";

    const category = detectCategory(question);
    const sentiment = detectSentiment(question);

    await supabase.from("assistant_conversations").insert({
      user_id: userId || null,
      session_id: sessionId,
      question,
      answer,
      category,
      sentiment,
    });

    return new Response(
      JSON.stringify({
        answer,
        category,
        sentiment,
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
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function detectCategory(question: string): string {
  const lowerQuestion = question.toLowerCase();

  const investmentKeywords = ["استثمار", "عائد", "ربح", "فائدة", "مالي", "تكلفة", "سعر"];
  const worriedKeywords = ["مشكلة", "خطر", "خسارة", "ضمان", "تأمين", "ماذا لو", "هل يوجد"];
  const curiousKeywords = ["كيف", "ماذا", "ما هو", "ما هي", "اشرح", "وضح"];

  if (investmentKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "investment";
  }
  if (worriedKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "worried";
  }
  if (curiousKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "curious";
  }

  return "curious";
}

function detectSentiment(question: string): string {
  const lowerQuestion = question.toLowerCase();

  const negativeKeywords = ["مشكلة", "خطر", "خسارة", "قلق", "خوف", "سيء"];
  const positiveKeywords = ["ممتاز", "رائع", "جيد", "اعجبني", "مهتم"];

  if (negativeKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "negative";
  }
  if (positiveKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "positive";
  }

  return "neutral";
}
