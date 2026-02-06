/*
  # إصلاح جذري: RPC function تستخدم id بدلاً من user_id
  
  1. المشكلة
    - جدول user_profiles يستخدم عمود "id" وليس "user_id"
    - RPC function كانت تبحث بـ "user_id" فلا تجد البيانات
  
  2. الحل
    - تحديث check_account_type للبحث بـ "id"
    - إصلاح جميع الاستعلامات
*/

-- حذف النسخة القديمة
DROP FUNCTION IF EXISTS check_account_type();

-- إنشاء النسخة الصحيحة
CREATE OR REPLACE FUNCTION check_account_type()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_primary_identity text;
  v_has_reservations boolean;
  v_is_partner boolean;
  v_account_type text;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  v_user_id := auth.uid();
  
  -- إذا لم يكن هناك مستخدم مسجل، نرجع none
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'account_type', 'none',
      'has_reservations', false,
      'is_partner', false
    );
  END IF;

  -- قراءة primary_identity من user_profiles
  -- ✅ استخدام "id" بدلاً من "user_id"
  SELECT primary_identity INTO v_primary_identity
  FROM user_profiles
  WHERE id = v_user_id;

  -- التحقق من وجود حجوزات مؤكدة
  SELECT EXISTS (
    SELECT 1 FROM reservations
    WHERE user_id = v_user_id
    AND status = 'active'
  ) INTO v_has_reservations;

  -- التحقق من كونه شريك نجاح نشط
  SELECT EXISTS (
    SELECT 1 FROM influencer_partners
    WHERE user_id = v_user_id
    AND status = 'active'
  ) INTO v_is_partner;

  -- تحديد نوع الحساب بناءً على primary_identity
  IF v_primary_identity = 'agricultural' THEN
    v_account_type := 'farmer';
  ELSIF v_primary_identity = 'investment' THEN
    v_account_type := 'investor';
  ELSE
    -- إذا لم يكن عنده primary_identity، نتحقق من الحجوزات
    IF v_has_reservations THEN
      v_account_type := 'farmer'; -- default للي عنده حجوزات
    ELSIF v_is_partner THEN
      v_account_type := 'partner';
    ELSE
      v_account_type := 'none';
    END IF;
  END IF;

  -- إرجاع النتيجة
  RETURN json_build_object(
    'account_type', v_account_type,
    'has_reservations', COALESCE(v_has_reservations, false),
    'is_partner', COALESCE(v_is_partner, false)
  );
END;
$$;