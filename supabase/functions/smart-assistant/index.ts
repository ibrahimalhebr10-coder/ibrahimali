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

interface ResponsePattern {
  patterns: string[];
  answer: string;
  category: string;
}

const responses: ResponsePattern[] = [
  {
    patterns: ["كيف", "طريقة", "خطوات", "استثمر", "احجز"],
    answer: "الاستثمار في منصتنا سهل وبسيط! كل ما عليك هو اختيار المزرعة المناسبة، حدد عدد الأشجار، واحجز حصتك. رح نتابع معك كل تفاصيل استثمارك وتحصل على تقارير دورية وصور من مزرعتك.",
    category: "investment"
  },
  {
    patterns: ["عائد", "ربح", "مكسب", "أرباح", "فائدة", "كم", "مقدار"],
    answer: "العائد يختلف حسب نوع المزرعة والأشجار اللي تختارها. كل مزرعة لها تفاصيلها الخاصة. تقدر تشوف كل التفاصيل المالية والعوائد المتوقعة في صفحة المزرعة قبل ما تحجز.",
    category: "investment"
  },
  {
    patterns: ["ضمان", "أمان", "آمن", "موثوق", "ثقة"],
    answer: "نعم! استثمارك معنا مضمون ومؤمّن. عندنا شركاء موثوقين ونتابع المزارع بشكل يومي. كمان تقدر تزور مزرعتك في أي وقت وتشوف أشجارك بنفسك.",
    category: "worried"
  },
  {
    patterns: ["مشكلة", "خطر", "خسارة", "مخاطر", "خطورة"],
    answer: "الاستثمار الزراعي من أكثر الاستثمارات استقراراً. احنا نتابع المزارع بشكل مستمر ونتخذ كل إجراءات الحماية اللازمة. في حال أي طارئ، فيه تأمين وضمانات تحمي استثمارك.",
    category: "worried"
  },
  {
    patterns: ["مدة", "متى", "وقت", "فترة", "موعد"],
    answer: "مدة الاستثمار تعتمد على نوع الأشجار. في أنواع تبدأ تنتج بعد سنة، وفي أنواع تحتاج 3-5 سنوات. كل التفاصيل موجودة في صفحة المزرعة، وراح نوافيك بكل المستجدات.",
    category: "curious"
  },
  {
    patterns: ["صيانة", "رعاية", "اهتمام", "خدمة", "متابعة"],
    answer: "لا تشيل هم! كل الصيانة والرعاية من مسؤوليتنا. عندنا فريق مختص يهتم بالمزارع 24/7، ويرسل لك تحديثات وصور دورية عن حالة أشجارك.",
    category: "curious"
  },
  {
    patterns: ["دفع", "تسديد", "مبلغ", "قسط", "تكلفة", "سعر"],
    answer: "طرق الدفع متنوعة وسهلة! تقدر تدفع كامل المبلغ، أو على دفعات حسب راحتك. ندعم جميع وسائل الدفع الإلكترونية والتحويل البنكي.",
    category: "investment"
  },
  {
    patterns: ["موقع", "مكان", "أين", "وين", "منطقة"],
    answer: "مزارعنا موزعة في مناطق زراعية متميزة في المملكة. كل مزرعة لها موقعها وخصائصها. تقدر تشوف تفاصيل الموقع في صفحة المزرعة، وطبعاً مرحب فيك تزورها!",
    category: "curious"
  },
  {
    patterns: ["زيارة", "أزور", "أشوف", "معاينة"],
    answer: "أكيد! تقدر تزور مزرعتك في أي وقت وتشوف أشجارك بعينك. بس ننصحك تنسق معنا قبل الزيارة علشان نسهل لك الوصول ونرتب لك جولة مميزة.",
    category: "curious"
  },
  {
    patterns: ["بيع", "أبيع", "تنازل", "نقل"],
    answer: "نعم، تقدر تبيع حصتك أو تنقلها لشخص آخر. عندنا إجراءات واضحة وسهلة للنقل والبيع. تواصل معنا وراح نساعدك في كل الخطوات.",
    category: "investment"
  },
  {
    patterns: ["مرحبا", "السلام", "هلا", "هاي", "أهلا"],
    answer: "أهلاً وسهلاً! سعداء بوجودك معنا في منصة الاستثمار الزراعي. كيف أقدر أساعدك اليوم؟",
    category: "greeting"
  },
  {
    patterns: ["شكرا", "ممتاز", "رائع", "جميل"],
    answer: "العفو! دايماً في الخدمة. إذا عندك أي سؤال ثاني، لا تتردد تسأل!",
    category: "positive"
  }
];

function generateAnswer(question: string): { answer: string; category: string } {
  const lowerQuestion = question.toLowerCase();

  for (const response of responses) {
    if (response.patterns.some(pattern => lowerQuestion.includes(pattern))) {
      return {
        answer: response.answer,
        category: response.category
      };
    }
  }

  return {
    answer: "شكراً على سؤالك! للحصول على إجابة دقيقة ومفصلة، أنصحك تتواصل مع فريق الدعم عبر واتساب. فريقنا جاهز يساعدك في أي وقت ويجاوب على كل استفساراتك.",
    category: "general"
  };
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

    const { answer, category } = generateAnswer(question);
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
