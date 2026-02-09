/*
  # إصلاح دالة extend_payment_deadline
  
  تحديث الدالة لاستخدام add_follow_up_activity بدلاً من log_follow_up_activity
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS extend_payment_deadline(uuid, integer, text);

-- إعادة إنشاء الدالة
CREATE OR REPLACE FUNCTION extend_payment_deadline(
  p_reservation_id uuid,
  p_extra_days integer,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن المستخدم هو مدير
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- تمديد موعد الدفع
  UPDATE reservations
  SET payment_deadline = payment_deadline + (p_extra_days || ' days')::interval
  WHERE id = p_reservation_id
    AND status = 'pending_payment';

  -- تسجيل النشاط
  PERFORM add_follow_up_activity(
    p_reservation_id,
    'deadline_extended',
    'other',
    'تم تمديد موعد الدفع ' || p_extra_days || ' أيام. السبب: ' || p_reason
  );

  RETURN true;
END;
$$;
