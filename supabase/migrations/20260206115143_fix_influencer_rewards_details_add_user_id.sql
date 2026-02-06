/*
  # إصلاح view influencer_rewards_details لإضافة user_id
  
  ## المشكلة
  الـ view الحالي لا يحتوي على user_id، مما يجعل من المستحيل تصفية البيانات حسب المستخدم الحالي من الكود.
  هذا يتسبب في محاولة جلب أي سجل مفعّل بدلاً من سجل المستخدم الحالي.
  
  ## الحل
  إعادة إنشاء الـ view مع إضافة user_id إلى الأعمدة المرجعة
  
  ## التغييرات
  1. حذف الـ view القديم
  2. إنشاء view جديد مع user_id
  3. منح الصلاحيات المناسبة
*/

-- حذف الـ view القديم
DROP VIEW IF EXISTS influencer_rewards_details;

-- إنشاء view جديد مع user_id
CREATE OR REPLACE VIEW influencer_rewards_details AS
SELECT
  ip.id,
  ip.user_id,
  ip.name AS referral_code,
  ip.display_name AS partner_name,
  ip.is_active,
  
  -- الإحصائيات
  ip.total_bookings,
  ip.total_trees_booked,
  ip.total_rewards_earned,
  
  -- قراءة عدد الأشجار المطلوبة من الإعدادات (القيمة الديناميكية)
  COALESCE(
    (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
    20
  ) AS trees_required_for_reward,
  
  -- التقدم نحو المكافأة التالية (باستخدام القيمة الديناميكية)
  (ip.total_trees_booked % COALESCE(
    (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
    20
  )) AS trees_in_current_batch,
  
  (COALESCE(
    (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
    20
  ) - (ip.total_trees_booked % COALESCE(
    (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
    20
  ))) AS trees_until_next_reward,
  
  ROUND((
    (ip.total_trees_booked % COALESCE(
      (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
      20
    ))::decimal / 
    COALESCE(
      (SELECT trees_required_for_reward FROM influencer_settings LIMIT 1),
      20
    )::decimal
  ) * 100, 1) AS progress_percentage,
  
  -- معلومات إضافية
  ip.last_booking_at,
  ip.created_at,
  ip.updated_at,
  ip.notes,
  
  -- عدد السجلات في اللوق
  (
    SELECT COUNT(*)
    FROM influencer_rewards_log
    WHERE influencer_id = ip.id
  ) AS total_log_entries
FROM influencer_partners ip;

-- Comment
COMMENT ON VIEW influencer_rewards_details IS 'عرض شامل لتفاصيل المؤثرين مع التقدم نحو المكافأة التالية - يتضمن user_id للتصفية';

-- منح الصلاحيات
GRANT SELECT ON influencer_rewards_details TO authenticated;
GRANT SELECT ON influencer_rewards_details TO anon;
