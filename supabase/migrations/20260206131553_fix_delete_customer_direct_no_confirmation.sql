/*
  # إصلاح جذري لدالة حذف العميل - بدون قيود

  تم إزالة جميع القيود:
  - إزالة شرط التحقق من كود التأكيد المعقد
  - الحذف يتم مباشرة بدون أي شروط
  - الدالة تقبل أي قيمة للمعامل p_confirmation_code
*/

CREATE OR REPLACE FUNCTION delete_customer_account(
  p_user_id uuid,
  p_confirmation_code text,
  p_admin_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reservations_count integer;
BEGIN
  -- تم إزالة شرط التحقق من الكود - الحذف مباشر
  
  SELECT COUNT(*) INTO v_reservations_count
  FROM reservations WHERE user_id = p_user_id;
  
  -- تسجيل في سجل التدقيق
  INSERT INTO farm_finance_audit_log (
    farm_id, operation_type, operation_details, performed_by
  ) VALUES (
    NULL, 'delete',
    jsonb_build_object(
      'action', 'delete_account',
      'user_id', p_user_id,
      'reason', p_admin_reason,
      'reservations_count', v_reservations_count
    ),
    auth.uid()
  );
  
  -- الحذف المباشر
  DELETE FROM reservations WHERE user_id = p_user_id;
  DELETE FROM user_profiles WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم حذف الحساب نهائياً',
    'reservations_deleted', v_reservations_count
  );
END;
$$;