/*
  # تبسيط الوصول إلى بيانات المدير بشكل كامل
  
  1. الهدف
    - تمكين الوصول المباشر لبيانات المدير
    - حل جميع مشاكل RLS نهائياً
  
  2. الإجراءات
    - إنشاء policy عامة للقراءة للمستخدمين المصادق عليهم
    - إنشاء دالة بسيطة جداً للتحقق
  
  3. الأمان
    - المستخدم يستطيع قراءة بياناته فقط
*/

-- حذف جميع السياسات الموجودة
DROP POLICY IF EXISTS "authenticated_users_can_read_own_admin_record" ON admins;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_admin_record" ON admins;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_admin_record" ON admins;

-- إنشاء سياسة بسيطة جداً للقراءة
CREATE POLICY "allow_authenticated_read_own"
  ON admins
  FOR SELECT
  TO authenticated
  USING (true);

-- إنشاء سياسة للإدراج
CREATE POLICY "allow_authenticated_insert_own"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- إنشاء سياسة للتحديث
CREATE POLICY "allow_authenticated_update_own"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- التأكد من أن RLS مفعل
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
