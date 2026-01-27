/*
  # تنظيف سياسات RLS لجدول reservations

  ## الهدف
  - توحيد سياسات RLS لجدول reservations
  - إزالة السياسات المكررة
  - استخدام طريقة موحدة للتحقق من صلاحيات الأدمن

  ## التغييرات
  1. حذف جميع سياسات الأدمن الحالية المكررة
  2. إنشاء سياسات جديدة موحدة تستخدم EXISTS مع جدول admins
  
  ## ملاحظات
  - يتم استخدام EXISTS للأداء والتوافق
  - السياسات تسمح للأدمن بإدارة جميع الحجوزات
*/

-- حذف السياسات القديمة المكررة
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON reservations;

-- إنشاء سياسة SELECT للأدمن
CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- إنشاء سياسة UPDATE للأدمن
CREATE POLICY "Admins can update all reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- إنشاء سياسة DELETE للأدمن
CREATE POLICY "Admins can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
