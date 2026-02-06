/*
  # تحسين دوال المساعد الذكي

  1. New Functions
    - `search_faqs_advanced` - بحث متقدم في الأسئلة والأجوبة
    - `get_assistant_analytics` - إحصائيات متقدمة
    - `mark_faq_as_used` - تسجيل استخدام السؤال
    - `mark_faq_as_helpful` - تسجيل فائدة السؤال

  2. Changes
    - تحسين دالة `search_faqs` القديمة

  3. Security
    - دوال عامة للجميع (للقراءة)
    - دوال محمية للتعديل
*/

-- إنشاء دالة بحث متقدمة في الأسئلة والأجوبة
CREATE OR REPLACE FUNCTION search_faqs(search_query TEXT)
RETURNS TABLE (
  id UUID,
  question_ar TEXT,
  question_en TEXT,
  answer_ar TEXT,
  answer_en TEXT,
  question_variations JSONB,
  intent_tags TEXT[],
  is_active BOOLEAN,
  is_approved BOOLEAN,
  usage_count INTEGER,
  helpful_count INTEGER,
  score REAL
)
SECURITY DEFINER
AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  -- تنظيف النص
  normalized_query := LOWER(TRIM(search_query));

  RETURN QUERY
  SELECT
    f.id,
    f.question_ar,
    f.question_en,
    f.answer_ar,
    f.answer_en,
    f.question_variations,
    f.intent_tags,
    f.is_active,
    f.is_approved,
    f.usage_count,
    f.helpful_count,
    CASE
      -- مطابقة تامة للسؤال الأساسي
      WHEN LOWER(f.question_ar) = normalized_query THEN 100.0
      -- مطابقة تامة في الصيغ البديلة
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(f.question_variations) AS variation
        WHERE LOWER(variation) = normalized_query
      ) THEN 95.0
      -- تطابق جزئي في السؤال
      WHEN LOWER(f.question_ar) LIKE '%' || normalized_query || '%' THEN 80.0
      -- تطابق جزئي في الصيغ البديلة
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(f.question_variations) AS variation
        WHERE LOWER(variation) LIKE '%' || normalized_query || '%'
      ) THEN 70.0
      -- تطابق في الكلمات المفتاحية
      WHEN EXISTS (
        SELECT 1 FROM unnest(f.intent_tags) AS tag
        WHERE LOWER(tag) = normalized_query
      ) THEN 60.0
      -- تطابق جزئي في الإجابة
      WHEN LOWER(f.answer_ar) LIKE '%' || normalized_query || '%' THEN 50.0
      ELSE 0.0
    END AS score
  FROM assistant_faqs f
  WHERE f.is_active = TRUE
    AND f.is_approved = TRUE
    AND (
      LOWER(f.question_ar) LIKE '%' || normalized_query || '%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(f.question_variations) AS variation
        WHERE LOWER(variation) LIKE '%' || normalized_query || '%'
      )
      OR EXISTS (
        SELECT 1 FROM unnest(f.intent_tags) AS tag
        WHERE LOWER(tag) LIKE '%' || normalized_query || '%'
      )
      OR LOWER(f.answer_ar) LIKE '%' || normalized_query || '%'
    )
  ORDER BY score DESC, f.usage_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل استخدام سؤال
CREATE OR REPLACE FUNCTION mark_faq_as_used(faq_id UUID)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE assistant_faqs
  SET
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = NOW()
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل فائدة سؤال
CREATE OR REPLACE FUNCTION mark_faq_as_helpful(faq_id UUID)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE assistant_faqs
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على إحصائيات متقدمة
CREATE OR REPLACE FUNCTION get_assistant_analytics()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_faqs', (SELECT COUNT(*) FROM assistant_faqs),
    'active_faqs', (SELECT COUNT(*) FROM assistant_faqs WHERE is_active = TRUE),
    'approved_faqs', (SELECT COUNT(*) FROM assistant_faqs WHERE is_approved = TRUE),
    'total_usage', (SELECT COALESCE(SUM(usage_count), 0) FROM assistant_faqs),
    'total_helpful', (SELECT COALESCE(SUM(helpful_count), 0) FROM assistant_faqs),
    'avg_usage_per_faq', (
      SELECT ROUND(COALESCE(AVG(usage_count), 0), 2)
      FROM assistant_faqs
      WHERE is_active = TRUE
    ),
    'total_variations', (
      SELECT SUM(jsonb_array_length(question_variations))
      FROM assistant_faqs
      WHERE question_variations IS NOT NULL
    ),
    'unanswered_count', (
      SELECT COUNT(*)
      FROM unanswered_questions
      WHERE status = 'new'
    ),
    'most_used_faqs', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'question_ar', question_ar,
          'usage_count', usage_count
        )
      )
      FROM (
        SELECT id, question_ar, usage_count
        FROM assistant_faqs
        WHERE is_active = TRUE
        ORDER BY usage_count DESC
        LIMIT 5
      ) top_used
    ),
    'most_helpful_faqs', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'question_ar', question_ar,
          'helpful_count', helpful_count
        )
      )
      FROM (
        SELECT id, question_ar, helpful_count
        FROM assistant_faqs
        WHERE is_active = TRUE
        ORDER BY helpful_count DESC
        LIMIT 5
      ) top_helpful
    ),
    'recent_unanswered', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'question', question,
          'frequency', frequency,
          'created_at', created_at
        )
      )
      FROM (
        SELECT id, question, frequency, created_at
        FROM unanswered_questions
        WHERE status = 'new'
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- إضافة عمود last_used_at إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assistant_faqs' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE assistant_faqs ADD COLUMN last_used_at TIMESTAMPTZ;
  END IF;
END $$;

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_active_approved
ON assistant_faqs(is_active, is_approved)
WHERE is_active = TRUE AND is_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_usage_count
ON assistant_faqs(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_helpful_count
ON assistant_faqs(helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status
ON unanswered_questions(status)
WHERE status = 'new';

-- منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION search_faqs(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_faq_as_used(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_faq_as_helpful(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_assistant_analytics() TO authenticated;
