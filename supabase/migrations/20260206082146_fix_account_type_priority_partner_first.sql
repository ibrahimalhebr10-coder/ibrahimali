/*
  # إصلاح جذري: أولوية التحقق من الشريك أولاً
  
  1. المشكلة الحقيقية
    - RPC تتحقق من primary_identity أولاً وتفرض account_type='regular'
    - حتى لو كان المستخدم شريك نجاح، ترجع regular!
    - هذا يسبب تداخل حساب الشريك مع حساب العميل
  
  2. الحل الصحيح
    - نتحقق من is_partner و has_reservations أولاً
    - إذا has_partner AND has_reservations → account_type='both'
    - إذا has_partner فقط → account_type='partner'
    - إذا has_reservations أو primary_identity → account_type='regular'
    - primary_identity يستخدم كـ fallback فقط
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
      'account_type', 'none',
      'primary_identity', 'none'
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

  -- ✅ الخطوة 3: التحقق من شريك النجاح (الأهم!)
  SELECT EXISTS (
    SELECT 1 FROM influencer_partners
    WHERE user_id = v_user_id
    AND status = 'active'
    AND is_active = true
    LIMIT 1
  ) INTO v_has_partner;

  -- ✅ الخطوة 4: تحديد account_type بالأولوية الصحيحة
  -- 1. التحقق من both أولاً
  IF v_has_partner AND v_has_reservations THEN
    v_account_type := 'both';
  
  -- 2. شريك فقط
  ELSIF v_has_partner THEN
    v_account_type := 'partner';
  
  -- 3. عميل عادي (عنده حجوزات أو primary_identity)
  ELSIF v_has_reservations OR v_primary_identity IS NOT NULL THEN
    v_account_type := 'regular';
  
  -- 4. لا شيء
  ELSE
    v_account_type := 'none';
  END IF;

  -- ✅ إرجاع النتيجة الصحيحة
  RETURN jsonb_build_object(
    'has_regular_account', v_has_reservations OR v_primary_identity IS NOT NULL,
    'has_partner_account', v_has_partner,
    'account_type', v_account_type,
    'primary_identity', COALESCE(v_primary_identity, 'none'),
    'debug_has_reservations', v_has_reservations,
    'debug_has_partner', v_has_partner
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