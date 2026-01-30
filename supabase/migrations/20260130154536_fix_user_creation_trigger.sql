/*
  # إصلاح مشكلة إنشاء المستخدمين الجدد

  ## المشكلة
  عند محاولة تسجيل مستخدم جديد، يظهر خطأ:
  "Database error saving new user"

  ## السبب
  الـ trigger الموجود على auth.users يحاول إنشاء سجل في user_messaging_preferences
  لكن قد تكون هناك مشكلة في الأذونات أو تعريف الجدول.

  ## الحل
  1. التأكد من وجود الجدول user_messaging_preferences
  2. إعادة إنشاء الـ function بشكل آمن
  3. إعادة إنشاء الـ trigger

  ## التغييرات
  - إنشاء جدول user_messaging_preferences إذا لم يكن موجوداً
  - إعادة تعريف الـ function بشكل آمن
  - إعادة تعريف الـ trigger
  - إضافة RLS policies آمنة
*/

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS user_messaging_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sms_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE user_messaging_preferences ENABLE ROW LEVEL SECURITY;

-- حذف الـ policies القديمة إن وجدت وإعادة إنشائها
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own messaging preferences" ON user_messaging_preferences;
  DROP POLICY IF EXISTS "Users can insert own messaging preferences" ON user_messaging_preferences;
  DROP POLICY IF EXISTS "Users can update own messaging preferences" ON user_messaging_preferences;
  DROP POLICY IF EXISTS "Allow service role to insert" ON user_messaging_preferences;
END $$;

-- السماح للمستخدمين بقراءة بياناتهم فقط
CREATE POLICY "Users can read own messaging preferences"
  ON user_messaging_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- السماح للمستخدمين بإدخال بياناتهم
CREATE POLICY "Users can insert own messaging preferences"
  ON user_messaging_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمين بتحديث بياناتهم
CREATE POLICY "Users can update own messaging preferences"
  ON user_messaging_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- السماح لـ service_role بالإدخال (للـ trigger)
CREATE POLICY "Allow service role to insert"
  ON user_messaging_preferences
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- إعادة إنشاء الـ function بشكل آمن
CREATE OR REPLACE FUNCTION create_user_messaging_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_messaging_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- تسجيل الخطأ لكن السماح بإكمال إنشاء المستخدم
    RAISE WARNING 'Failed to create messaging preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS on_auth_user_created_messaging_prefs ON auth.users;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER on_auth_user_created_messaging_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_messaging_preferences();

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_user_messaging_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_messaging_preferences_timestamp ON user_messaging_preferences;

CREATE TRIGGER update_user_messaging_preferences_timestamp
  BEFORE UPDATE ON user_messaging_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_messaging_preferences_updated_at();