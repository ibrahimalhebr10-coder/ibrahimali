/*
  # إصلاح دالة get_follow_up_history
  
  تحديث الدالة لاستخدام أسماء الأعمدة الصحيحة
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS get_follow_up_history(uuid);

-- إعادة إنشاء الدالة بالأعمدة الصحيحة
CREATE OR REPLACE FUNCTION get_follow_up_history(p_reservation_id uuid)
RETURNS TABLE(
  activity_id uuid,
  admin_name text,
  activity_type text,
  activity_result text,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id as activity_id,
    COALESCE(up.full_name, 'النظام') as admin_name,
    fa.activity_type,
    fa.activity_result,
    fa.notes,
    fa.created_at
  FROM follow_up_activities fa
  LEFT JOIN user_profiles up ON fa.admin_id = up.id
  WHERE fa.reservation_id = p_reservation_id
  ORDER BY fa.created_at DESC;
END;
$$;
