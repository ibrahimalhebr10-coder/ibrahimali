/*
  # إضافة دالة تبديل وضع الدفع
  
  دالة تسمح للمدير بتحويل الحجز بين "الدفع الآن" و "الدفع لاحقاً"
  
  1. New Functions
    - `toggle_payment_mode` - تبديل وضع الدفع للحجز
    - `convert_to_immediate_payment` - تحويل للدفع الفوري
    - `convert_to_flexible_payment` - تحويل للدفع المرن
*/

-- دالة تبديل وضع الدفع
CREATE OR REPLACE FUNCTION toggle_payment_mode(
  p_reservation_id uuid,
  p_enable_flexible boolean,
  p_payment_days integer DEFAULT 7,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_mode boolean;
  v_new_deadline timestamptz;
BEGIN
  -- التحقق من أن المستخدم مدير
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- جلب الوضع الحالي
  SELECT flexible_payment_enabled INTO v_current_mode
  FROM reservations
  WHERE id = p_reservation_id;

  -- إذا كان التحويل للدفع المرن، حساب الموعد النهائي
  IF p_enable_flexible THEN
    v_new_deadline := now() + (p_payment_days || ' days')::interval;
  ELSE
    v_new_deadline := NULL;
  END IF;

  -- تحديث الحجز
  UPDATE reservations
  SET 
    flexible_payment_enabled = p_enable_flexible,
    payment_deadline = v_new_deadline,
    status = CASE 
      WHEN p_enable_flexible THEN 'pending_payment'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_reservation_id;

  -- تسجيل النشاط
  PERFORM add_follow_up_activity(
    p_reservation_id,
    'payment_mode_changed',
    'other',
    CASE 
      WHEN p_enable_flexible THEN 
        'تم التحويل للدفع المرن (الدفع لاحقاً) - ' || p_payment_days || ' أيام. ' || COALESCE(p_reason, '')
      ELSE 
        'تم التحويل للدفع الفوري (الدفع الآن). ' || COALESCE(p_reason, '')
    END
  );

  RETURN json_build_object(
    'success', true,
    'old_mode', v_current_mode,
    'new_mode', p_enable_flexible,
    'payment_deadline', v_new_deadline,
    'message', CASE 
      WHEN p_enable_flexible THEN 'تم التحويل للدفع المرن بنجاح'
      ELSE 'تم التحويل للدفع الفوري بنجاح'
    END
  );
END;
$$;

-- دالة مباشرة للتحويل للدفع الفوري
CREATE OR REPLACE FUNCTION convert_to_immediate_payment(
  p_reservation_id uuid,
  p_reason text DEFAULT 'تحويل للدفع الفوري'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN toggle_payment_mode(p_reservation_id, false, 0, p_reason);
END;
$$;

-- دالة مباشرة للتحويل للدفع المرن
CREATE OR REPLACE FUNCTION convert_to_flexible_payment(
  p_reservation_id uuid,
  p_payment_days integer DEFAULT 7,
  p_reason text DEFAULT 'تحويل للدفع المرن'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN toggle_payment_mode(p_reservation_id, true, p_payment_days, p_reason);
END;
$$;
