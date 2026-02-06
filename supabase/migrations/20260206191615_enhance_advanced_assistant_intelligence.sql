/*
  # تحسين ذكاء المساعد المتقدم

  ## التحسينات الجديدة:
  
  1. ربط المعرفة بسياق الصفحة (Page Context Mapping)
  2. سيناريوهات الأسئلة الحساسة (Sensitive Scenarios)
  3. تتبع تطور الذكاء (Intelligence Evolution)
  4. سجل التعديلات مع الأسباب (Change Log with Reasons)
  5. تحليل سلوك المستخدم المتقدم (Advanced User Behavior)
  
  ## الأمان:
  - RLS policies محكمة
  - المديرون فقط يمكنهم الإدارة
  - الجميع يمكنهم القراءة حسب الصلاحيات
*/

-- ==========================================
-- 1. ربط FAQs بالصفحات (Page Context)
-- ==========================================

ALTER TABLE assistant_faqs 
ADD COLUMN IF NOT EXISTS page_contexts text[] DEFAULT '{}';

COMMENT ON COLUMN assistant_faqs.page_contexts IS 'الصفحات التي يظهر فيها هذا السؤال (مثل: /agricultural, /investment, /account)';

-- ==========================================
-- 2. سيناريوهات الأسئلة الحساسة
-- ==========================================

CREATE TABLE IF NOT EXISTS sensitive_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name text NOT NULL UNIQUE,
  scenario_name_ar text NOT NULL,
  description text,
  trigger_keywords text[] NOT NULL,
  response_template_ar text NOT NULL,
  response_template_en text NOT NULL,
  escalation_required boolean DEFAULT false,
  alert_admins boolean DEFAULT false,
  redirect_to_support boolean DEFAULT true,
  priority text DEFAULT 'high' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sensitive_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم قراءة السيناريوهات النشطة"
  ON sensitive_scenarios FOR SELECT
  USING (is_active = true);

CREATE POLICY "المديرون فقط يمكنهم إدارة السيناريوهات"
  ON sensitive_scenarios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

-- إضافة سيناريوهات حساسة أساسية
INSERT INTO sensitive_scenarios 
  (scenario_name, scenario_name_ar, description, trigger_keywords, response_template_ar, response_template_en, priority)
VALUES
  (
    'ask_guaranteed_profit',
    'السؤال عن ضمان الأرباح',
    'عندما يسأل المستخدم عن ضمان الأرباح أو العوائد',
    ARRAY['ضمان', 'مضمون', 'أكيد', 'مؤكد', 'guarantee', 'guaranteed'],
    'الاستثمار الزراعي يعتمد على عوامل طبيعية متعددة. نحن نوفر أفضل الممارسات الزراعية والإدارة المحترفة، لكن العوائد تتأثر بالظروف الطبيعية. يمكنك الاطلاع على معدلات العوائد التاريخية في صفحة كل مزرعة.',
    'Agricultural investment depends on multiple natural factors. We provide best agricultural practices and professional management, but returns are affected by natural conditions. You can review historical return rates on each farm page.',
    'high'
  ),
  (
    'complaint',
    'شكوى أو تذمر',
    'عندما يعبر المستخدم عن عدم رضا أو شكوى',
    ARRAY['شكوى', 'مشكلة', 'غير راضي', 'سيء', 'complaint', 'problem', 'issue'],
    'نعتذر عن أي إزعاج تعرضت له. رضاك مهم جداً لنا. يرجى التواصل مع فريق الدعم مباشرة عبر WhatsApp أو البريد الإلكتروني لحل المشكلة بأسرع وقت ممكن.',
    'We apologize for any inconvenience. Your satisfaction is very important to us. Please contact our support team directly via WhatsApp or email to resolve the issue as quickly as possible.',
    'critical'
  ),
  (
    'hesitation',
    'تردد في الاستثمار',
    'عندما يظهر المستخدم تردداً أو خوفاً من الاستثمار',
    ARRAY['خائف', 'متردد', 'مو متأكد', 'مترددة', 'hesitant', 'afraid', 'worried'],
    'نفهم تماماً حرصك على اتخاذ القرار الصحيح. الاستثمار الزراعي له مميزات عديدة منها الاستقرار طويل الأجل والعوائد المستدامة. ننصحك بالبدء بباقة صغيرة ومراقبة التطور. فريقنا متاح دائماً للإجابة على أي استفسار.',
    'We completely understand your care in making the right decision. Agricultural investment has many advantages including long-term stability and sustainable returns. We recommend starting with a small package and monitoring the progress. Our team is always available to answer any questions.',
    'high'
  ),
  (
    'comparison_with_competitors',
    'المقارنة مع المنافسين',
    'عندما يقارن المستخدم مع منصات أخرى',
    ARRAY['أفضل من', 'منافس', 'غيركم', 'الآخرين', 'competition', 'others', 'better'],
    'نحن نفخر بتقديم خدمة متميزة تشمل الإدارة المحترفة، الشفافية الكاملة، والتقارير الدورية. كل مزرعة لدينا تُدار وفق أعلى المعايير الزراعية. يمكنك مراجعة تفاصيل خدماتنا ومقارنتها بنفسك.',
    'We pride ourselves on providing distinguished service including professional management, complete transparency, and periodic reports. Each farm is managed according to the highest agricultural standards. You can review our service details and compare yourself.',
    'medium'
  );

-- ==========================================
-- 3. تتبع تطور الذكاء (Intelligence Metrics)
-- ==========================================

CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_conversations int DEFAULT 0,
  answered_successfully int DEFAULT 0,
  unanswered_questions int DEFAULT 0,
  avg_confidence_score float DEFAULT 0,
  avg_response_time_ms int DEFAULT 0,
  satisfaction_rate float DEFAULT 0,
  helpfulness_rate float DEFAULT 0,
  learning_suggestions_count int DEFAULT 0,
  faqs_added int DEFAULT 0,
  topics_added int DEFAULT 0,
  unique_users int DEFAULT 0,
  returning_users int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE intelligence_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون فقط يمكنهم قراءة المقاييس"
  ON intelligence_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

CREATE POLICY "النظام يمكنه إضافة المقاييس"
  ON intelligence_metrics FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- 4. سجل التعديلات مع الأسباب
-- ==========================================

CREATE TABLE IF NOT EXISTS knowledge_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type text NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'approve', 'reject')),
  entity_type text NOT NULL CHECK (entity_type IN ('domain', 'topic', 'faq', 'scenario', 'pattern')),
  entity_id uuid NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  change_notes text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون يمكنهم قراءة سجل التعديلات"
  ON knowledge_change_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

CREATE POLICY "النظام يمكنه إضافة سجلات التعديل"
  ON knowledge_change_log FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- 5. تحليل سلوك المستخدم المتقدم
-- ==========================================

ALTER TABLE user_context_tracking
ADD COLUMN IF NOT EXISTS previous_questions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interaction_pattern jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS engagement_score float DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction_type text;

COMMENT ON COLUMN user_context_tracking.previous_questions IS 'آخر 5 أسئلة طرحها المستخدم';
COMMENT ON COLUMN user_context_tracking.interaction_pattern IS 'نمط تفاعل المستخدم (وقت، تكرار، نوع الأسئلة)';
COMMENT ON COLUMN user_context_tracking.engagement_score IS 'درجة تفاعل المستخدم (0-100)';
COMMENT ON COLUMN user_context_tracking.last_interaction_type IS 'نوع آخر تفاعل (question, feedback, action)';

-- ==========================================
-- 6. توليد صيغ الأسئلة تلقائياً
-- ==========================================

CREATE TABLE IF NOT EXISTS question_variations_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_name_ar text NOT NULL,
  base_pattern text NOT NULL,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  examples jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_variations_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون يمكنهم إدارة قوالب التنويع"
  ON question_variations_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

-- إضافة قوالب تنويع أساسية
INSERT INTO question_variations_templates 
  (template_name, template_name_ar, base_pattern, variations, examples)
VALUES
  (
    'how_to',
    'كيف؟',
    'كيف {action}',
    '[
      "كيف {action}؟",
      "ما هي طريقة {action}؟",
      "كيف يمكنني {action}؟",
      "ما هي خطوات {action}؟",
      "شرح {action}"
    ]'::jsonb,
    '[
      "كيف أستثمر؟ / ما هي طريقة الاستثمار؟ / كيف يمكنني الاستثمار؟",
      "كيف أسجل؟ / ما هي طريقة التسجيل؟ / كيف يمكنني التسجيل؟"
    ]'::jsonb
  ),
  (
    'what_is',
    'ما هو؟',
    'ما هو {subject}',
    '[
      "ما هو {subject}؟",
      "ما معنى {subject}؟",
      "شرح {subject}",
      "تعريف {subject}",
      "{subject} يعني إيه؟"
    ]'::jsonb,
    '[
      "ما هو الاستثمار الزراعي؟ / ما معنى الاستثمار الزراعي؟ / شرح الاستثمار الزراعي"
    ]'::jsonb
  ),
  (
    'how_much',
    'كم؟',
    'كم {metric}',
    '[
      "كم {metric}؟",
      "ما هو {metric}؟",
      "قيمة {metric}",
      "مقدار {metric}",
      "{metric} كم؟"
    ]'::jsonb,
    '[
      "كم التكلفة؟ / ما هي التكلفة؟ / قيمة التكلفة / التكلفة كم؟"
    ]'::jsonb
  );

-- ==========================================
-- 7. دالة حساب مؤشر الذكاء اليومي
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_daily_intelligence_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_date date := CURRENT_DATE;
  v_total_conversations int;
  v_answered int;
  v_unanswered int;
  v_avg_confidence float;
  v_avg_response_time int;
  v_satisfaction_rate float;
  v_helpfulness_rate float;
  v_suggestions_count int;
  v_faqs_added int;
  v_topics_added int;
  v_unique_users int;
  v_returning_users int;
BEGIN
  -- إجمالي المحادثات اليوم
  SELECT COUNT(DISTINCT id)
  INTO v_total_conversations
  FROM conversation_sessions
  WHERE DATE(started_at) = v_date;

  -- الأسئلة المجابة بنجاح (confidence > 0.5)
  SELECT COUNT(*)
  INTO v_answered
  FROM conversation_messages
  WHERE DATE(created_at) = v_date
    AND message_type = 'assistant'
    AND confidence_score > 0.5;

  -- الأسئلة غير المجابة
  SELECT COUNT(*)
  INTO v_unanswered
  FROM unanswered_questions
  WHERE DATE(created_at) = v_date;

  -- متوسط الثقة
  SELECT COALESCE(AVG(confidence_score), 0)
  INTO v_avg_confidence
  FROM conversation_messages
  WHERE DATE(created_at) = v_date
    AND confidence_score IS NOT NULL;

  -- متوسط وقت الاستجابة
  SELECT COALESCE(AVG(response_time_ms), 0)::int
  INTO v_avg_response_time
  FROM conversation_messages
  WHERE DATE(created_at) = v_date
    AND response_time_ms IS NOT NULL;

  -- معدل الرضا
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE satisfaction_rating >= 4)::float / COUNT(*))
      ELSE 0
    END
  INTO v_satisfaction_rate
  FROM conversation_sessions
  WHERE DATE(started_at) = v_date
    AND satisfaction_rating IS NOT NULL;

  -- معدل الفائدة
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE was_helpful = true)::float / COUNT(*))
      ELSE 0
    END
  INTO v_helpfulness_rate
  FROM conversation_messages
  WHERE DATE(created_at) = v_date
    AND was_helpful IS NOT NULL;

  -- عدد الاقتراحات
  SELECT COUNT(*)
  INTO v_suggestions_count
  FROM learning_suggestions
  WHERE DATE(created_at) = v_date;

  -- FAQs المضافة
  SELECT COUNT(*)
  INTO v_faqs_added
  FROM assistant_faqs
  WHERE DATE(created_at) = v_date;

  -- المواضيع المضافة
  SELECT COUNT(*)
  INTO v_topics_added
  FROM knowledge_topics
  WHERE DATE(created_at) = v_date;

  -- المستخدمون الفريدون
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_fingerprint))
  INTO v_unique_users
  FROM conversation_sessions
  WHERE DATE(started_at) = v_date;

  -- المستخدمون العائدون
  SELECT COUNT(DISTINCT user_id)
  INTO v_returning_users
  FROM conversation_sessions
  WHERE DATE(started_at) = v_date
    AND user_id IN (
      SELECT DISTINCT user_id
      FROM conversation_sessions
      WHERE DATE(started_at) < v_date
        AND user_id IS NOT NULL
    );

  -- إدراج أو تحديث المقاييس
  INSERT INTO intelligence_metrics (
    metric_date,
    total_conversations,
    answered_successfully,
    unanswered_questions,
    avg_confidence_score,
    avg_response_time_ms,
    satisfaction_rate,
    helpfulness_rate,
    learning_suggestions_count,
    faqs_added,
    topics_added,
    unique_users,
    returning_users
  ) VALUES (
    v_date,
    v_total_conversations,
    v_answered,
    v_unanswered,
    v_avg_confidence,
    v_avg_response_time,
    v_satisfaction_rate,
    v_helpfulness_rate,
    v_suggestions_count,
    v_faqs_added,
    v_topics_added,
    v_unique_users,
    v_returning_users
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    answered_successfully = EXCLUDED.answered_successfully,
    unanswered_questions = EXCLUDED.unanswered_questions,
    avg_confidence_score = EXCLUDED.avg_confidence_score,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    satisfaction_rate = EXCLUDED.satisfaction_rate,
    helpfulness_rate = EXCLUDED.helpfulness_rate,
    learning_suggestions_count = EXCLUDED.learning_suggestions_count,
    faqs_added = EXCLUDED.faqs_added,
    topics_added = EXCLUDED.topics_added,
    unique_users = EXCLUDED.unique_users,
    returning_users = EXCLUDED.returning_users;
END;
$$;

-- ==========================================
-- 8. دالة توليد صيغ الأسئلة
-- ==========================================

CREATE OR REPLACE FUNCTION generate_question_variations(
  p_base_question text,
  p_template_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_variations jsonb := '[]'::jsonb;
  v_template record;
BEGIN
  -- إذا تم تحديد قالب محدد
  IF p_template_id IS NOT NULL THEN
    SELECT * INTO v_template
    FROM question_variations_templates
    WHERE id = p_template_id AND is_active = true;
    
    IF FOUND THEN
      v_variations := v_template.variations;
    END IF;
  ELSE
    -- توليد صيغ أساسية تلقائياً
    v_variations := jsonb_build_array(
      p_base_question,
      p_base_question || '؟',
      'ممكن ' || p_base_question,
      'كيف ' || p_base_question,
      'ما هو ' || p_base_question
    );
  END IF;
  
  RETURN v_variations;
END;
$$;

-- ==========================================
-- إنشاء Indexes إضافية
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_page_contexts 
  ON assistant_faqs USING gin(page_contexts);

CREATE INDEX IF NOT EXISTS idx_sensitive_scenarios_keywords 
  ON sensitive_scenarios USING gin(trigger_keywords);

CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_date 
  ON intelligence_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_change_log_entity 
  ON knowledge_change_log(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_context_previous_questions 
  ON user_context_tracking USING gin(previous_questions);
