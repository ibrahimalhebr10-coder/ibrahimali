/*
  # إصلاح دالة add_follow_up_activity
  
  تحديث الدالة لاستخدام أسماء الأعمدة الصحيحة
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS add_follow_up_activity(uuid, text, text, text);

-- إعادة إنشاء الدالة بالأعمدة الصحيحة
CREATE OR REPLACE FUNCTION add_follow_up_activity(
  p_reservation_id uuid,
  p_activity_type text,
  p_activity_result text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO follow_up_activities (
    reservation_id,
    admin_id,
    activity_type,
    activity_result,
    notes
  ) VALUES (
    p_reservation_id,
    auth.uid(),
    p_activity_type,
    p_activity_result,
    p_notes
  ) RETURNING id INTO v_activity_id;

  -- تحديث تاريخ آخر متابعة
  UPDATE reservations
  SET last_follow_up_date = now()
  WHERE id = p_reservation_id;

  RETURN v_activity_id;
END;
$$;
