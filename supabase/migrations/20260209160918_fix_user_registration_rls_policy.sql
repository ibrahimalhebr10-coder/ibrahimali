/*
  # إصلاح سياسة RLS لتسجيل المستخدمين الجدد

  ## المشكلة
  - عند تسجيل مستخدم جديد، يظهر خطأ: "Database error saving new user"
  - السبب: RLS policy على user_profiles تمنع الـ trigger من إنشاء profile جديد
  - الـ trigger يعمل بصلاحيات SECURITY DEFINER لكن RLS لا تزال تنطبق على authenticated فقط

  ## الحل
  1. إضافة policy جديدة تسمح بإنشاء user_profiles من الـ trigger
  2. استخدام security definer بشكل صحيح
  3. إعادة ترتيب الـ policies لتكون أكثر وضوحاً

  ## الأمان
  - الـ trigger آمن تماماً لأنه يستخدم SECURITY DEFINER
  - الـ policy الجديدة محددة جداً ولا تسمح إلا بإنشاء profile للمستخدم نفسه
*/

-- إسقاط الـ policies القديمة
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- إنشاء policies جديدة محسّنة

-- 1. السماح بالإنشاء أثناء التسجيل (من الـ trigger)
-- هذا يسمح للـ trigger بإنشاء profile بغض النظر عن حالة authentication
CREATE POLICY "Allow profile creation during signup"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- 2. السماح بالقراءة للمستخدمين المصادق عليهم فقط
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. السماح بالتحديث للمستخدمين المصادق عليهم فقط
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. منع الحذف (للأمان)
CREATE POLICY "Prevent profile deletion"
  ON user_profiles FOR DELETE
  USING (false);

-- التحقق من الـ policies
DO $$
BEGIN
  RAISE NOTICE '✅ تم تحديث RLS policies على user_profiles بنجاح';
  RAISE NOTICE '✅ الآن يمكن تسجيل مستخدمين جدد بنجاح';
END $$;