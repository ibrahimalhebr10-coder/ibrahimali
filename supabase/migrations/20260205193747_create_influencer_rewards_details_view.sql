/*
  # عرض تفاصيل المكافآت للمؤثرين

  ## الوظيفة
  
  View يعرض معلومات المؤثر مع التقدم نحو المكافأة التالية
*/

-- إنشاء View
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
  
  -- التقدم نحو المكافأة التالية
  (ip.total_trees_booked % 20) AS trees_in_current_batch,
  (20 - (ip.total_trees_booked % 20)) AS trees_until_next_reward,
  ROUND(((ip.total_trees_booked % 20)::decimal / 20.0) * 100, 1) AS progress_percentage,
  
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
COMMENT ON VIEW influencer_rewards_details IS 'عرض شامل لتفاصيل المؤثرين مع التقدم نحو المكافأة التالية';

-- منح الصلاحيات
GRANT SELECT ON influencer_rewards_details TO authenticated;
GRANT SELECT ON influencer_rewards_details TO anon;