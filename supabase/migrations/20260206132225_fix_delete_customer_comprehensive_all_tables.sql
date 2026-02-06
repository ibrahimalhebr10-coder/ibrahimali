/*
  # إصلاح شامل لدالة حذف العميل - حذف من جميع الجداول

  التحديثات:
  1. حذف من جميع الجداول المرتبطة بـ user_id
  2. ترتيب الحذف بشكل صحيح لتجنب انتهاكات foreign key
  3. معالجة الأخطاء بشكل أفضل
*/

CREATE OR REPLACE FUNCTION delete_customer_account(
  p_user_id uuid,
  p_confirmation_code text,
  p_admin_reason text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reservations_count integer;
  v_admin_id uuid;
  v_email text;
  v_phone text;
BEGIN
  -- محاولة الحصول على معرف المدير
  v_admin_id := auth.uid();
  
  -- الحصول على بيانات المستخدم قبل الحذف
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  SELECT phone INTO v_phone FROM user_profiles WHERE user_id = p_user_id;
  
  -- عد الحجوزات
  SELECT COUNT(*) INTO v_reservations_count
  FROM reservations WHERE user_id = p_user_id;
  
  -- تسجيل في سجل التدقيق
  BEGIN
    INSERT INTO farm_finance_audit_log (
      farm_id, operation_type, operation_details, performed_by
    ) VALUES (
      NULL, 'delete',
      jsonb_build_object(
        'action', 'delete_account',
        'user_id', p_user_id,
        'email', v_email,
        'phone', v_phone,
        'reason', p_admin_reason,
        'reservations_count', v_reservations_count,
        'deleted_at', now()
      ),
      v_admin_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أخطاء التدقيق
    NULL;
  END;
  
  -- الحذف الشامل من جميع الجداول المرتبطة
  -- ترتيب الحذف مهم جداً لتجنب انتهاكات foreign key
  
  -- 1. حذف البيانات التابعة للجداول الرئيسية
  DELETE FROM user_notifications WHERE user_id = p_user_id;
  DELETE FROM user_messaging_preferences WHERE user_id = p_user_id;
  DELETE FROM messages WHERE user_id = p_user_id;
  DELETE FROM assistant_conversations WHERE user_id = p_user_id;
  
  -- 2. حذف البيانات المالية
  DELETE FROM payment_receipts WHERE user_id = p_user_id;
  DELETE FROM payment_transactions WHERE user_id = p_user_id;
  DELETE FROM payments WHERE user_id = p_user_id;
  DELETE FROM transactions WHERE user_id = p_user_id;
  DELETE FROM maintenance_payments WHERE user_id = p_user_id;
  
  -- 3. حذف بيانات الشراكة والتسويق
  DELETE FROM influencer_partners WHERE user_id = p_user_id;
  DELETE FROM lead_scores WHERE user_id = p_user_id;
  DELETE FROM lead_activities WHERE user_id = p_user_id;
  DELETE FROM leads WHERE phone = v_phone OR email = v_email;
  
  -- 4. حذف البيانات الإدارية
  DELETE FROM customer_group_members WHERE user_id = p_user_id;
  DELETE FROM admins WHERE user_id = p_user_id;
  
  -- 5. حذف البيانات الزراعية والاستثمارية
  DELETE FROM investments WHERE user_id = p_user_id;
  DELETE FROM farmer_farms WHERE user_id = p_user_id;
  
  -- 6. حذف الحجوزات (مهم جداً)
  DELETE FROM reservations WHERE user_id = p_user_id;
  
  -- 7. حذف الملف الشخصي
  DELETE FROM user_profiles WHERE user_id = p_user_id;
  
  -- 8. حذف الحساب من المصادقة (آخر خطوة)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم حذف الحساب نهائياً من جميع الأنظمة',
    'reservations_deleted', v_reservations_count,
    'email', v_email,
    'phone', v_phone
  );
  
EXCEPTION WHEN OTHERS THEN
  -- في حالة حدوث أي خطأ، نرجع تفاصيله
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;