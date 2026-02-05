/*
  # عرض سجل نشاط المؤثر (مبسط)

  ## الهدف
  
  سجل بسيط وتحفيزي للمؤثر في حسابه الشخصي
  
  ## المحتويات
  
  1. التاريخ
  2. اسم المزرعة
  3. عدد الأشجار المكتسبة (المكافآت)
  4. التقدم (X/20)
  
  ## القيود
  
  - لا تفاصيل مالية
  - لا معلومات العملاء
  - لا تعقيد
  - فقط التحفيز والتقدم
*/

CREATE OR REPLACE VIEW influencer_activity_log AS
SELECT
  rl.id,
  rl.influencer_id,
  ip.user_id,
  
  -- التاريخ
  rl.created_at,
  DATE(rl.created_at) AS activity_date,
  
  -- المزرعة
  f.name_ar AS farm_name,
  f.location AS farm_location,
  
  -- الأشجار
  rl.trees_added AS trees_referred,
  rl.new_rewards_earned AS trees_earned,
  
  -- التقدم بعد هذا الحجز
  rl.trees_in_current_batch,
  rl.trees_until_next_reward,
  
  -- ملاحظات تحفيزية
  rl.notes,
  
  -- الحجز (للربط فقط)
  rl.reservation_id

FROM influencer_rewards_log rl
JOIN influencer_partners ip ON rl.influencer_id = ip.id
JOIN reservations r ON rl.reservation_id = r.id
JOIN farms f ON r.farm_id = f.id
ORDER BY rl.created_at DESC;

-- Comment
COMMENT ON VIEW influencer_activity_log IS 'سجل نشاط المؤثر المبسط - للعرض في حسابه الشخصي (لا تفاصيل مالية)';

-- RLS: السماح للمؤثر برؤية سجله فقط
DROP POLICY IF EXISTS "Influencers can view own activity log" ON influencer_rewards_log;

CREATE POLICY "Influencers can view own activity log"
ON influencer_rewards_log
FOR SELECT
TO authenticated
USING (
  influencer_id IN (
    SELECT id FROM influencer_partners
    WHERE user_id = auth.uid()
  )
);

-- منح الصلاحيات
GRANT SELECT ON influencer_activity_log TO authenticated;
GRANT SELECT ON influencer_activity_log TO anon;