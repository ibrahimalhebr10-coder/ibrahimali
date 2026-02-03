/*
  # إنشاء Trigger لإنشاء User Profile تلقائياً

  1. التغييرات
    - إنشاء دالة `handle_new_user()` التي تُنشئ user profile عند إنشاء مستخدم جديد
    - إنشاء trigger يستدعي الدالة عند إدراج مستخدم جديد في auth.users
  
  2. الوظيفة
    - عند إنشاء مستخدم في auth.users
    - يتم إنشاء سجل في user_profiles تلقائياً
    - يتم نسخ البيانات من metadata (full_name, phone_number)
  
  3. الأمان
    - الدالة تعمل بصلاحيات security definer
    - تتعامل مع البيانات بشكل آمن
*/

-- إنشاء دالة handle_new_user
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    'visitor',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone);
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger على auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- إصلاح user_profiles الحاليين الذين لديهم بيانات null
UPDATE user_profiles up
SET 
  full_name = COALESCE(au.raw_user_meta_data->>'full_name', up.full_name, 'مستخدم'),
  phone = COALESCE(au.raw_user_meta_data->>'phone_number', au.phone, up.phone)
FROM auth.users au
WHERE up.id = au.id
AND up.full_name IS NULL;
