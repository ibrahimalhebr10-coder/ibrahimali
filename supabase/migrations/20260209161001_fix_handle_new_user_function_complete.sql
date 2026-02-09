/*
  # إصلاح دالة handle_new_user بشكل كامل

  ## المشكلة
  - الدالة الحالية لا تحفظ full_name و phone من metadata
  - الدالة تستخدم 'agricultural' كقيمة افتراضية بدلاً من 'investment'
  - المستخدمون الجدد يسجلون كمستثمرين ولكن البيانات لا تُحفظ

  ## الحل
  1. تحديث الدالة لحفظ البيانات من raw_user_meta_data
  2. استخدام 'investment' كقيمة افتراضية للمستخدمين العاديين
  3. الحفاظ على منطق التحقق من الشركاء

  ## البيانات المحفوظة
  - full_name من raw_user_meta_data->>'full_name'
  - phone من raw_user_meta_data->>'phone_number'
  - primary_identity = 'investment' (للمستخدمين العاديين)
  - account_type = 'regular' أو 'partner'
*/

-- إعادة إنشاء الدالة بشكل صحيح
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_partner_exists boolean;
  v_full_name text;
  v_phone text;
  v_primary_identity text;
BEGIN
  -- استخراج البيانات من metadata
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone);
  
  -- التحقق من وجود المستخدم كشريك نجاح
  SELECT EXISTS (
    SELECT 1 FROM influencer_partners
    WHERE user_id = NEW.id
  ) INTO v_partner_exists;

  -- تحديد الهوية الأساسية بناءً على نوع الحساب
  IF v_partner_exists THEN
    -- الشريك يبدأ بهوية زراعية
    v_primary_identity := 'agricultural';
    
    -- إدراج profile للشريك
    INSERT INTO public.user_profiles (
      id,
      full_name,
      phone,
      account_type,
      primary_identity,
      created_at
    )
    VALUES (
      NEW.id,
      v_full_name,
      v_phone,
      'partner',
      v_primary_identity,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      account_type = 'partner',
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone);
  ELSE
    -- المستخدم العادي يبدأ بهوية استثمارية
    v_primary_identity := 'investment';
    
    -- إدراج profile للمستخدم العادي
    INSERT INTO public.user_profiles (
      id,
      full_name,
      phone,
      account_type,
      primary_identity,
      created_at
    )
    VALUES (
      NEW.id,
      v_full_name,
      v_phone,
      'regular',
      v_primary_identity,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone);
  END IF;
  
  RETURN NEW;
END;
$$;

-- التحقق من التحديث
DO $$
BEGIN
  RAISE NOTICE '✅ تم تحديث دالة handle_new_user بنجاح';
  RAISE NOTICE '✅ الآن يتم حفظ full_name و phone من metadata';
  RAISE NOTICE '✅ المستخدمون الجدد يبدأون بهوية استثمارية (investment)';
  RAISE NOTICE '✅ شركاء النجاح يبدأون بهوية زراعية (agricultural)';
END $$;
