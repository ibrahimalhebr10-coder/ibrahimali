/*
  # إصلاح صلاحيات RLS لجداول admin_logs و reservations
  
  1. المشكلة
    - جدول admin_logs يسبب خطأ "permission denied for table users"
    - جدول reservations لا يسمح للأدمن بقراءة البيانات للتحقق من الحجوزات
  
  2. الحل
    - إنشاء دالة مساعدة is_admin() للتحقق من صلاحيات الأدمن
    - حذف الـ policies القديمة
    - إنشاء policies جديدة مبسطة
    - إضافة policies للأدمن لجدول reservations
  
  3. الجداول المتأثرة
    - admin_logs: تحديث policies للقراءة والإنشاء
    - reservations: إضافة policies للأدمن
*/

-- إنشاء دالة مساعدة للتحقق من أن المستخدم admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = $1
    AND admins.is_active = true
  );
$$;

-- حذف الـ policies القديمة لجدول admin_logs
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can create logs" ON admin_logs;

-- إنشاء policies جديدة مبسطة لجدول admin_logs
CREATE POLICY "Admins can view logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- إضافة policy للأدمن لقراءة جدول reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON reservations;

CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- إضافة policy للأدمن لتحديث حالة الحجوزات
CREATE POLICY "Admins can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- إضافة policy للأدمن لحذف الحجوزات
CREATE POLICY "Admins can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
