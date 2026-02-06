/*
  # منظومة المساعد الذكي المتقدم (Advanced AI Assistant System)

  ## نظرة عامة
  منظومة متكاملة للمساعد الذكي تتضمن:
  - قاعدة معرفية منظمة حسب المجالات
  - فهم ذكي للنية (Intent Recognition)
  - وعي بسياق المستخدم (Context Awareness)
  - نظام تعلم منضبط (Controlled Learning)
  - تحليلات وإحصائيات متقدمة

  ## الجداول الجديدة

  ### 1. knowledge_domains
  المجالات المعرفية الرئيسية:
  - الاستثمار الزراعي
  - الأشجار والمحاصيل
  - الحسابات والتسجيل
  - شريك النجاح
  - المتابعة والصيانة

  ### 2. knowledge_topics
  المواضيع داخل كل مجال المعرفي

  ### 3. knowledge_articles
  المقالات والمحتوى التعليمي المفصل

  ### 4. faqs (Frequently Asked Questions)
  الأسئلة الشائعة مع أجوبتها وأنماط السؤال المختلفة

  ### 5. intent_patterns
  أنماط فهم النية من السؤال

  ### 6. conversation_sessions
  جلسات المحادثة مع المستخدمين

  ### 7. conversation_messages
  الرسائل داخل كل جلسة محادثة

  ### 8. user_context_tracking
  تتبع سياق المستخدم وسلوكه في المنصة

  ### 9. learning_suggestions
  اقتراحات التحسين من النظام للإدارة

  ### 10. unanswered_questions
  الأسئلة التي لم يستطع المساعد الإجابة عليها

  ### 11. assistant_analytics
  إحصائيات وتحليلات أداء المساعد

  ## الأمان
  - جميع الجداول محمية بـ RLS
  - الإدارة لديها صلاحيات كاملة
  - المستخدمون يمكنهم القراءة والتفاعل فقط
  - الزوار يمكنهم استخدام المساعد بشكل محدود
*/

-- ==========================================
-- 1. المجالات المعرفية (Knowledge Domains)
-- ==========================================

CREATE TABLE IF NOT EXISTS knowledge_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  icon text,
  color text DEFAULT '#10b981',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم قراءة المجالات النشطة"
  ON knowledge_domains FOR SELECT
  USING (is_active = true);

CREATE POLICY "المديرون فقط يمكنهم إدارة المجالات"
  ON knowledge_domains FOR ALL
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

-- ==========================================
-- 2. المواضيع (Knowledge Topics)
-- ==========================================

CREATE TABLE IF NOT EXISTS knowledge_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES knowledge_domains(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  summary_ar text,
  summary_en text,
  content_ar text,
  content_en text,
  keywords text[], -- كلمات مفتاحية للبحث
  target_audience text DEFAULT 'all', -- all, visitor, investor, partner
  response_tone text DEFAULT 'professional', -- professional, friendly, reassuring
  detail_level text DEFAULT 'medium', -- basic, medium, detailed
  related_page_url text, -- رابط الصفحة المرتبطة
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  views_count int DEFAULT 0,
  helpful_count int DEFAULT 0,
  not_helpful_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم قراءة المواضيع النشطة"
  ON knowledge_topics FOR SELECT
  USING (is_active = true);

CREATE POLICY "المديرون فقط يمكنهم إدارة المواضيع"
  ON knowledge_topics FOR ALL
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

-- ==========================================
-- 3. الأسئلة الشائعة (FAQs)
-- ==========================================

CREATE TABLE IF NOT EXISTS assistant_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES knowledge_topics(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES knowledge_domains(id) ON DELETE CASCADE,
  question_ar text NOT NULL,
  question_en text NOT NULL,
  answer_ar text NOT NULL,
  answer_en text NOT NULL,
  question_variations jsonb DEFAULT '[]'::jsonb, -- صيغ مختلفة للسؤال
  intent_tags text[], -- tags للنية
  context_requirements jsonb DEFAULT '{}'::jsonb, -- متطلبات السياق
  target_audience text DEFAULT 'all',
  confidence_threshold float DEFAULT 0.7, -- حد الثقة للتطابق
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  is_approved boolean DEFAULT false, -- معتمد من الإدارة
  usage_count int DEFAULT 0,
  helpful_count int DEFAULT 0,
  not_helpful_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE assistant_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم قراءة الأسئلة المعتمدة"
  ON assistant_faqs FOR SELECT
  USING (is_active = true AND is_approved = true);

CREATE POLICY "المديرون يمكنهم إدارة الأسئلة"
  ON assistant_faqs FOR ALL
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

-- ==========================================
-- 4. أنماط فهم النية (Intent Patterns)
-- ==========================================

CREATE TABLE IF NOT EXISTS intent_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name text NOT NULL UNIQUE,
  intent_name_ar text NOT NULL,
  description text,
  patterns text[], -- أنماط regex أو keywords
  examples jsonb DEFAULT '[]'::jsonb, -- أمثلة على الأسئلة
  priority int DEFAULT 0, -- أولوية المطابقة
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE intent_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم قراءة الأنماط النشطة"
  ON intent_patterns FOR SELECT
  USING (is_active = true);

CREATE POLICY "المديرون فقط يمكنهم إدارة الأنماط"
  ON intent_patterns FOR ALL
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

-- ==========================================
-- 5. جلسات المحادثة (Conversation Sessions)
-- ==========================================

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_fingerprint text, -- للزوار
  user_type text DEFAULT 'visitor', -- visitor, authenticated, investor, partner, admin
  current_page text, -- الصفحة الحالية
  user_context jsonb DEFAULT '{}'::jsonb, -- سياق المستخدم
  language text DEFAULT 'ar',
  is_active boolean DEFAULT true,
  satisfaction_rating int, -- 1-5
  feedback_text text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  last_activity_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم قراءة جلساتهم"
  ON conversation_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم إنشاء جلسات"
  ON conversation_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم تحديث جلساتهم"
  ON conversation_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "الزوار يمكنهم إنشاء جلسات مؤقتة"
  ON conversation_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "المديرون يمكنهم قراءة جميع الجلسات"
  ON conversation_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

-- ==========================================
-- 6. رسائل المحادثة (Conversation Messages)
-- ==========================================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  message_type text NOT NULL, -- user, assistant, system
  content text NOT NULL,
  intent_detected text,
  confidence_score float,
  matched_faq_id uuid REFERENCES assistant_faqs(id),
  matched_topic_id uuid REFERENCES knowledge_topics(id),
  response_time_ms int, -- وقت الاستجابة بالميلي ثانية
  was_helpful boolean,
  user_feedback text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم قراءة رسائل جلساتهم"
  ON conversation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_sessions 
      WHERE conversation_sessions.id = conversation_messages.session_id 
      AND conversation_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "الجميع يمكنهم إضافة رسائل لجلساتهم"
  ON conversation_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "المديرون يمكنهم قراءة جميع الرسائل"
  ON conversation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

-- ==========================================
-- 7. تتبع سياق المستخدم (User Context Tracking)
-- ==========================================

CREATE TABLE IF NOT EXISTS user_context_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_fingerprint text,
  current_page text,
  previous_pages text[],
  time_on_page int, -- seconds
  actions_taken jsonb DEFAULT '[]'::jsonb,
  user_investments jsonb DEFAULT '{}'::jsonb,
  user_interests jsonb DEFAULT '{}'::jsonb,
  tracked_at timestamptz DEFAULT now()
);

ALTER TABLE user_context_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم قراءة سياقهم"
  ON user_context_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "النظام يمكنه تتبع السياق"
  ON user_context_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "المديرون يمكنهم قراءة جميع السياقات"
  ON user_context_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

-- ==========================================
-- 8. اقتراحات التحسين (Learning Suggestions)
-- ==========================================

CREATE TABLE IF NOT EXISTS learning_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type text NOT NULL, -- new_topic, improve_answer, new_faq, update_content
  subject_ar text NOT NULL,
  subject_en text,
  description text NOT NULL,
  confidence_score float DEFAULT 0,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  frequency int DEFAULT 1, -- عدد مرات تكرار نفس الاقتراح
  status text DEFAULT 'pending', -- pending, approved, rejected, implemented
  priority text DEFAULT 'medium', -- low, medium, high
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  implemented_at timestamptz
);

ALTER TABLE learning_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون فقط يمكنهم إدارة الاقتراحات"
  ON learning_suggestions FOR ALL
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

-- ==========================================
-- 9. الأسئلة غير المجابة (Unanswered Questions)
-- ==========================================

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  question text NOT NULL,
  user_type text,
  user_context jsonb DEFAULT '{}'::jsonb,
  current_page text,
  frequency int DEFAULT 1,
  status text DEFAULT 'new', -- new, reviewed, answered, ignored
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون فقط يمكنهم إدارة الأسئلة غير المجابة"
  ON unanswered_questions FOR ALL
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

-- ==========================================
-- 10. إحصائيات المساعد (Assistant Analytics)
-- ==========================================

CREATE TABLE IF NOT EXISTS assistant_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL, -- sessions, messages, satisfaction, response_time, etc.
  metric_value float NOT NULL,
  metric_details jsonb DEFAULT '{}'::jsonb,
  time_period text DEFAULT 'day', -- hour, day, week, month
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE assistant_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المديرون فقط يمكنهم قراءة الإحصائيات"
  ON assistant_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid() 
      AND admins.is_active = true
    )
  );

CREATE POLICY "النظام يمكنه إضافة إحصائيات"
  ON assistant_analytics FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- إنشاء Indexes للأداء
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_knowledge_topics_domain 
  ON knowledge_topics(domain_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_topic 
  ON assistant_faqs(topic_id) WHERE is_active = true AND is_approved = true;

CREATE INDEX IF NOT EXISTS idx_assistant_faqs_domain 
  ON assistant_faqs(domain_id) WHERE is_active = true AND is_approved = true;

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user 
  ON conversation_sessions(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_conversation_messages_session 
  ON conversation_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status 
  ON unanswered_questions(status) WHERE status = 'new';

CREATE INDEX IF NOT EXISTS idx_learning_suggestions_status 
  ON learning_suggestions(status) WHERE status = 'pending';

-- ==========================================
-- إضافة بيانات أولية
-- ==========================================

-- المجالات المعرفية الأساسية
INSERT INTO knowledge_domains (name_ar, name_en, description_ar, description_en, icon, color, display_order) VALUES
  ('الاستثمار الزراعي', 'Agricultural Investment', 'كل ما يتعلق بالاستثمار في المزارع والأشجار', 'Everything about farm and tree investments', '🌾', '#10b981', 1),
  ('الأشجار والمحاصيل', 'Trees and Crops', 'معلومات عن أنواع الأشجار والمحاصيل المتاحة', 'Information about available tree types and crops', '🌳', '#22c55e', 2),
  ('الحسابات والتسجيل', 'Accounts and Registration', 'إدارة الحسابات وعملية التسجيل', 'Account management and registration process', '👤', '#3b82f6', 3),
  ('شريك النجاح', 'Success Partner', 'برنامج شريك النجاح والتسويق بالعمولة', 'Success Partner program and affiliate marketing', '🤝', '#f59e0b', 4),
  ('المتابعة والصيانة', 'Monitoring and Maintenance', 'متابعة الاستثمارات ورسوم الصيانة', 'Investment monitoring and maintenance fees', '🔧', '#8b5cf6', 5)
ON CONFLICT DO NOTHING;

-- أنماط النية الأساسية
INSERT INTO intent_patterns (intent_name, intent_name_ar, description, patterns, priority) VALUES
  ('ask_profit', 'الاستفسار عن الأرباح', 'السؤال عن العوائد والأرباح المتوقعة', ARRAY['ربح', 'عائد', 'أرباح', 'مكسب', 'فائدة'], 10),
  ('ask_process', 'الاستفسار عن العملية', 'السؤال عن كيفية البدء والخطوات', ARRAY['كيف', 'طريقة', 'خطوات', 'عملية', 'إجراءات'], 8),
  ('ask_security', 'الاستفسار عن الأمان', 'السؤال عن الأمان والضمانات', ARRAY['آمن', 'ضمان', 'موثوق', 'حماية', 'أمان'], 9),
  ('ask_duration', 'الاستفسار عن المدة', 'السؤال عن مدة العقد والاستثمار', ARRAY['مدة', 'فترة', 'سنة', 'شهر', 'متى'], 7),
  ('ask_cost', 'الاستفسار عن التكلفة', 'السؤال عن الأسعار والتكاليف', ARRAY['سعر', 'تكلفة', 'كم', 'مبلغ', 'قيمة'], 10)
ON CONFLICT DO NOTHING;
