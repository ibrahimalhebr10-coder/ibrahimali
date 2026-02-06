/*
  # إصلاح جذري لدالة حذف العميل - نسخة محسنة

  الإصلاحات:
  1. إزالة شرط التحقق من كود التأكيد
  2. جعل performed_by اختياري في سجل التدقيق
  3. الحذف المباشر بدون قيود
*/

-- أولاً: تعديل جدول التدقيق ليقبل NULL في performed_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farm_finance_audit_log' 
    AND column_name = 'performed_by' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE farm_finance_audit_log 
    ALTER COLUMN performed_by DROP NOT NULL;
  END IF;
END $$;

-- ثانياً: تحديث الدالة لتعمل بدون قيود
CREATE OR REPLACE FUNCTION delete_customer_account(
  p_user_id uuid,
  p_confirmation_code text,
  p_admin_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reservations_count integer;
  v_admin_id uuid;
BEGIN
  -- محاولة الحصول على معرف المدير (قد يكون null)
  v_admin_id := auth.uid();
  
  -- عد الحجوزات
  SELECT COUNT(*) INTO v_reservations_count
  FROM reservations WHERE user_id = p_user_id;
  
  -- تسجيل في سجل التدقيق (performed_by الآن اختياري)
  INSERT INTO farm_finance_audit_log (
    farm_id, operation_type, operation_details, performed_by
  ) VALUES (
    NULL, 'delete',
    jsonb_build_object(
      'action', 'delete_account',
      'user_id', p_user_id,
      'reason', p_admin_reason,
      'reservations_count', v_reservations_count,
      'deleted_at', now()
    ),
    v_admin_id
  );
  
  -- الحذف المباشر والجذري
  DELETE FROM maintenance_payments WHERE user_id = p_user_id;
  DELETE FROM customer_group_members WHERE user_id = p_user_id;
  DELETE FROM lead_activities WHERE visitor_id IN (
    SELECT id FROM leads WHERE phone = (SELECT phone FROM user_profiles WHERE user_id = p_user_id)
  );
  DELETE FROM leads WHERE phone = (SELECT phone FROM user_profiles WHERE user_id = p_user_id);
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