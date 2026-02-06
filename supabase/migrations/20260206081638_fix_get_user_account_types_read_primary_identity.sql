/*
  # إصلاح جذري نهائي: get_user_account_types تقرأ primary_identity
  
  1. المشكلة الحقيقية
    - Frontend يستدعي get_user_account_types
    - هذه الـ function تبحث فقط عن reservations و partners
    - لا تقرأ primary_identity من user_profiles
    - لذلك ترجع 'none' حتى لو المستخدم عنده primary_identity!
  
  2. الحل النهائي
    - تحديث get_user_account_types لتقرأ primary_identity أولاً
    - إذا كان primary_identity موجود، نستخدمه مباشرة
    - نطابق التسميات: agricultural->farmer, investment->investor
*/

-- حذف النسخة القديمة
DROP FUNCTION IF EXISTS get_user_account_types();

-- إنشاء النسخة الصحيحة النهائية
CREATE OR REPLACE FUNCTION get_user_account_types()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_primary_identity text;
  v_has_reservations boolean := false;
  v_has_partner boolean := false;
  v_account_type text;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  v_user_id := auth.uid();
  
  -- إذا لم يكن هناك مستخدم مسجل، نرجع none
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'has_regular_account', false,
      'has_partner_account', false,
      'account_type', 'none'
    );
  END IF;

  -- ✅ الخطوة 1: قراءة primary_identity من user_profiles
  SELECT primary_identity INTO v_primary_identity
  FROM user_profiles
  WHERE id = v_user_id;

  -- ✅ الخطوة 2: التحقق من الحجوزات
  SELECT EXISTS (
    SELECT 1 FROM reservations
    WHERE user_id = v_user_id
    LIMIT 1
  ) INTO v_has_reservations;

  -- ✅ الخطوة 3: التحقق من شريك النجاح
  SELECT EXISTS (
    SELECT 1 FROM influencer_partners
    WHERE user_id = v_user_id
    AND status = 'active'
    AND is_active = true
    LIMIT 1
  ) INTO v_has_partner;

  -- ✅ الخطوة 4: تحديد account_type بناءً على primary_identity أولاً
  IF v_primary_identity = 'agricultural' THEN
    v_account_type := 'regular';  -- للمزارعين
    v_has_reservations := true;   -- نعتبره regular
  ELSIF v_primary_identity = 'investment' THEN
    v_account_type := 'regular';  -- للمستثمرين أيضاً
    v_has_reservations := true;   -- نعتبره regular
  ELSIF v_has_partner THEN
    v_account_type := 'partner';  -- شريك نجاح فقط
  ELSIF v_has_reservations THEN
    v_account_type := 'regular';  -- عنده حجوزات
  ELSE
    v_account_type := 'none';     -- لا شيء
  END IF;

  -- ✅ إرجاع النتيجة
  RETURN jsonb_build_object(
    'has_regular_account', v_has_reservations OR v_primary_identity IS NOT NULL,
    'has_partner_account', v_has_partner,
    'account_type', v_account_type,
    'primary_identity', COALESCE(v_primary_identity, 'none')
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'has_regular_account', false,
      'has_partner_account', false,
      'account_type', 'none',
      'error', SQLERRM
    );
END;
$$;