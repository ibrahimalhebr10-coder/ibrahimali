/*
  # السماح للأدمن بالدخول المباشر على حساب شريك النجاح

  ## الهدف

  تمكين المسؤولين من الدخول المباشر على حسابات شركاء النجاح لمساعدتهم أو فحص حساباتهم

  ## التغييرات

  1. إنشاء function للحصول على بيانات تسجيل دخول مباشر للشريك
  2. التحقق من صلاحيات المسؤول
  3. التحقق من وجود حساب مستخدم للشريك (user_id)

  ## الأمان

  - فقط المسؤولون يمكنهم تنفيذ هذه العملية
  - يتطلب وجود user_id مرتبط بحساب الشريك
  - يتم تسجيل عمليات الدخول في audit log
*/

-- دالة للحصول على معلومات حساب الشريك للدخول المباشر
CREATE OR REPLACE FUNCTION admin_get_partner_login_info(partner_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id uuid;
  v_partner_user_id uuid;
  v_partner_email text;
  v_partner_name text;
  v_partner_phone text;
BEGIN
  -- التحقق من صلاحيات المسؤول
  SELECT id INTO v_admin_id
  FROM admins
  WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'operations_manager', 'marketing_manager');

  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'غير مصرح لك بالوصول'
    );
  END IF;

  -- الحصول على معلومات الشريك
  SELECT user_id, phone, name
  INTO v_partner_user_id, v_partner_phone, v_partner_name
  FROM influencer_partners
  WHERE id = partner_id;

  -- التحقق من وجود الشريك
  IF v_partner_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_account',
      'message', 'هذا الشريك لا يمتلك حساب مستخدم بعد'
    );
  END IF;

  -- الحصول على البريد الإلكتروني للشريك من جدول auth.users
  SELECT email INTO v_partner_email
  FROM auth.users
  WHERE id = v_partner_user_id;

  -- تسجيل العملية
  INSERT INTO admin_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_admin_id,
    'impersonate_partner',
    'influencer_partners',
    partner_id,
    jsonb_build_object(
      'partner_name', v_partner_name,
      'partner_email', v_partner_email,
      'partner_phone', v_partner_phone
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_partner_user_id,
    'email', v_partner_email,
    'phone', v_partner_phone,
    'name', v_partner_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unknown',
      'message', 'حدث خطأ أثناء محاولة الوصول'
    );
END;
$$;

COMMENT ON FUNCTION admin_get_partner_login_info IS 'الحصول على معلومات تسجيل الدخول لحساب شريك النجاح (للأدمن فقط)';
