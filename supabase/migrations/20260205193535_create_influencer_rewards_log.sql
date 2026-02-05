/*
  # سجل المكافآت للمؤثرين

  ## الوظيفة
  
  تسجيل تفصيلي لكل عملية احتساب مكافآت:
  - كل حجز يُسجل
  - كل شجرة تُحسب
  - كل مكافأة جديدة تُوثق
  - التقدم نحو المكافأة التالية واضح

  ## الجدول: influencer_rewards_log

  1. معلومات الحجز:
     - reservation_id: الحجز المرتبط
     - influencer_id: المؤثر
     - trees_added: الأشجار المضافة في هذا الحجز

  2. الحالة قبل:
     - trees_before: إجمالي الأشجار قبل الحجز
     - rewards_before: المكافآت قبل الحجز

  3. الحالة بعد:
     - trees_after: إجمالي الأشجار بعد الحجز
     - rewards_after: المكافآت بعد الحجز
     - new_rewards_earned: المكافآت الجديدة في هذا الحجز

  4. التقدم:
     - trees_in_current_batch: الأشجار في الدفعة الحالية (0-19)
     - trees_until_next_reward: كم شجرة متبقية للمكافأة التالية

  ## الفوائد
  
  - شفافية 100%: كل عملية موثقة
  - قابل للتدقيق: يمكن مراجعة أي عملية
  - تتبع التقدم: المؤثر يرى كم باقي للمكافأة التالية
  - تاريخ كامل: جميع العمليات مُسجلة
*/

-- إنشاء جدول سجل المكافآت
CREATE TABLE IF NOT EXISTS influencer_rewards_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الربط
  influencer_id uuid NOT NULL REFERENCES influencer_partners(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- الحجز
  trees_added integer NOT NULL CHECK (trees_added > 0),
  
  -- الحالة قبل
  trees_before integer NOT NULL DEFAULT 0,
  rewards_before integer NOT NULL DEFAULT 0,
  
  -- الحالة بعد
  trees_after integer NOT NULL,
  rewards_after integer NOT NULL,
  new_rewards_earned integer NOT NULL DEFAULT 0,
  
  -- التقدم
  trees_in_current_batch integer NOT NULL DEFAULT 0 CHECK (trees_in_current_batch >= 0 AND trees_in_current_batch < 20),
  trees_until_next_reward integer NOT NULL DEFAULT 20 CHECK (trees_until_next_reward > 0 AND trees_until_next_reward <= 20),
  
  -- التوقيت
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- معلومات إضافية
  notes text
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_rewards_log_influencer_id 
ON influencer_rewards_log(influencer_id);

CREATE INDEX IF NOT EXISTS idx_rewards_log_reservation_id 
ON influencer_rewards_log(reservation_id);

CREATE INDEX IF NOT EXISTS idx_rewards_log_created_at 
ON influencer_rewards_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_log_influencer_created 
ON influencer_rewards_log(influencer_id, created_at DESC);

-- RLS Policies
ALTER TABLE influencer_rewards_log ENABLE ROW LEVEL SECURITY;

-- الإدارة: قراءة جميع السجلات
CREATE POLICY "Admins can view all rewards logs"
ON influencer_rewards_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- لا أحد يستطيع التعديل يدوياً
-- فقط من خلال الدالة

-- Comments للتوضيح
COMMENT ON TABLE influencer_rewards_log IS 'سجل تفصيلي لكل عملية احتساب مكافآت - شفافية كاملة';
COMMENT ON COLUMN influencer_rewards_log.trees_added IS 'عدد الأشجار المضافة في هذا الحجز';
COMMENT ON COLUMN influencer_rewards_log.trees_before IS 'إجمالي الأشجار قبل هذا الحجز';
COMMENT ON COLUMN influencer_rewards_log.trees_after IS 'إجمالي الأشجار بعد هذا الحجز';
COMMENT ON COLUMN influencer_rewards_log.rewards_before IS 'المكافآت المكتسبة قبل هذا الحجز';
COMMENT ON COLUMN influencer_rewards_log.rewards_after IS 'المكافآت المكتسبة بعد هذا الحجز';
COMMENT ON COLUMN influencer_rewards_log.new_rewards_earned IS 'المكافآت الجديدة المكتسبة في هذا الحجز (0 أو أكثر)';
COMMENT ON COLUMN influencer_rewards_log.trees_in_current_batch IS 'الأشجار في الدفعة الحالية (0-19) - التقدم نحو المكافأة التالية';
COMMENT ON COLUMN influencer_rewards_log.trees_until_next_reward IS 'كم شجرة متبقية للحصول على المكافأة التالية (1-20)';