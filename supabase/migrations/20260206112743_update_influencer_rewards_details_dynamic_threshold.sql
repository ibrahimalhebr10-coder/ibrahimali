/*
  # تحديث عرض تفاصيل المكافآت ليقرأ القيمة الديناميكية

  1. التغييرات
    - تحديث view `influencer_rewards_details` ليقرأ `trees_required_for_reward` من جدول `influencer_settings`
    - إضافة حقل `trees_required_for_reward` إلى الـ view
    - استخدام القيمة الديناميكية في حساب التقدم بدلاً من 20 hardcoded
  
  2. الهدف
    - جعل شريط التقدم يتحدث تلقائياً عند تغيير الإعدادات
    - عرض القيمة الصحيحة في لوحة شريك المسيرة
*/

-- حذف الـ view القديم
DROP VIEW IF EXISTS influencer_rewards_details;

-- إنشاء view جديد مع قراءة القيمة الديناميكية
CREATE OR REPLACE VIEW influencer_rewards_details AS
SELECT
  ip.id,
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
COMMENT ON VIEW influencer_rewards_details IS 'عرض شامل لتفاصيل المؤثرين مع التقدم نحو المكافأة التالية - مع قراءة ديناميكية من الإعدادات';

-- منح الصلاحيات
GRANT SELECT ON influencer_rewards_details TO authenticated;
GRANT SELECT ON influencer_rewards_details TO anon;
