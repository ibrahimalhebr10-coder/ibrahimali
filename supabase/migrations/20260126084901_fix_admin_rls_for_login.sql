/*
  # إصلاح سياسات RLS لجدول admins لتسهيل تسجيل الدخول
  
  1. الهدف
    - تمكين المستخدمين المصادق عليهم من قراءة بياناتهم كمديرين
    - تبسيط السياسات لتجنب أي تعارضات
  
  2. الإجراءات
    - حذف السياسات الحالية
    - إنشاء سياسات جديدة أبسط وأكثر وضوحًا
  
  3. الأمان
    - يمكن للمستخدم المصادق عليه فقط قراءة بياناته الخاصة
    - لا يمكن للمستخدمين قراءة بيانات المديرين الآخرين
*/

-- حذف السياسات الحالية
DROP POLICY IF EXISTS "simple_select_own_record" ON admins;
DROP POLICY IF EXISTS "simple_insert_own_record" ON admins;
DROP POLICY IF EXISTS "simple_update_own_record" ON admins;

-- إنشاء سياسة قراءة جديدة
CREATE POLICY "authenticated_users_can_read_own_admin_record"
  ON admins
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND is_active = true
  );

-- إنشاء سياسة إدراج جديدة
CREATE POLICY "authenticated_users_can_insert_own_admin_record"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- إنشاء سياسة تحديث جديدة
CREATE POLICY "authenticated_users_can_update_own_admin_record"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
