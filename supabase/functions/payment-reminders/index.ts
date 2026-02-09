import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReminderResult {
  success: boolean;
  message: string;
  sent: number;
  skipped: number;
  processed_at?: string;
  error?: string;
}

interface ExpiredResult {
  success: boolean;
  message: string;
  cancelled: number;
  processed_at?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("⏰ Starting payment reminders processing...");

    // 1. معالجة التذكيرات
    const { data: reminderData, error: reminderError } = await supabase
      .rpc("process_payment_reminders");

    if (reminderError) {
      console.error("❌ Error processing reminders:", reminderError);
      throw reminderError;
    }

    const reminderResult = reminderData as ReminderResult;
    console.log("✅ Reminders processed:", reminderResult);

    // 2. معالجة الحجوزات المنتهية (اختياري)
    const { data: expiredData, error: expiredError } = await supabase
      .rpc("process_expired_reservations");

    if (expiredError) {
      console.error("⚠️ Error processing expired reservations:", expiredError);
      // لا نرفع استثناء هنا، فقط نسجل الخطأ
    }

    const expiredResult = expiredData as ExpiredResult;
    console.log("✅ Expired reservations processed:", expiredResult);

    // 3. إرجاع النتيجة الكاملة
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      reminders: reminderResult,
      expired: expiredResult,
      summary: {
        reminders_sent: reminderResult.sent || 0,
        reminders_skipped: reminderResult.skipped || 0,
        reservations_cancelled: expiredResult?.cancelled || 0,
      }
    };

    console.log("🎉 Processing completed successfully:", response.summary);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("❌ Fatal error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
