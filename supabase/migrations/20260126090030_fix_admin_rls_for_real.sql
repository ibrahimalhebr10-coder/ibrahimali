/*
  # إصلاح RLS للمدراء نهائياً
  
  1. الهدف
    - السماح للمستخدم المصادق بقراءة سجل المدير الخاص به فقط
  
  2. الإجراءات
    - حذف جميع السياسات القديمة
    - إنشاء سياسة محددة وواضحة
  
  3. الأمان
    - كل مستخدم يستطيع قراءة سجل المدير الخاص به فقط
*/

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "allow_authenticated_read_own" ON admins;
DROP POLICY IF EXISTS "allow_authenticated_insert_own" ON admins;
DROP POLICY IF EXISTS "allow_authenticated_update_own" ON admins;
DROP POLICY IF EXISTS "authenticated_users_can_read_own_admin_record" ON admins;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_admin_record" ON admins;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_admin_record" ON admins;

-- إنشاء سياسة بسيطة وواضحة للقراءة
CREATE POLICY "admin_select_own"
  ON admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- سياسة الإدراج
CREATE POLICY "admin_insert_own"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- سياسة التحديث
CREATE POLICY "admin_update_own"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- التأكد من تفعيل RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- اختبار السياسة
-- SELECT * FROM admins WHERE user_id = auth.uid();
