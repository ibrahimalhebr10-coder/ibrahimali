/*
  # إصلاح دالة handle_new_user لاستخدام identity صحيحة

  1. التغييرات
    - تحديث دالة handle_new_user لاستخدام 'investment' كقيمة افتراضية بدلاً من 'visitor'
    - 'investment' هي القيمة الصحيحة وفقاً لـ constraint على primary_identity
  
  2. السبب
    - constraint على user_profiles يسمح فقط بـ 'agricultural' أو 'investment'
    - معظم المستخدمين يبدأون كمستثمرين
*/

-- تحديث دالة handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    phone,
    primary_identity,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    'investment', -- ✅ القيمة الصحيحة
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone);
  
  RETURN NEW;
END;
$$;
