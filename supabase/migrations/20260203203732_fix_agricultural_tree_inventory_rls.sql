/*
  # إصلاح سياسات RLS لجدول agricultural_tree_inventory
  
  1. المشكلة:
    - السياسة الحالية لا تسمح بإضافة الأشجار
    - تتطلب وجود المستخدم في جدول admins
  
  2. الحل:
    - حذف السياسة القديمة
    - إنشاء سياسات جديدة أكثر وضوحاً:
      * سياسة SELECT: الجميع يمكنهم القراءة
      * سياسة INSERT: فقط الأدمن
      * سياسة UPDATE: فقط الأدمن
      * سياسة DELETE: فقط الأدمن
*/

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Admins have full access to tree inventory" ON agricultural_tree_inventory;

-- سياسة القراءة: الجميع
CREATE POLICY "Anyone can view tree inventory"
  ON agricultural_tree_inventory
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- سياسة الإضافة: فقط الأدمن
CREATE POLICY "Admins can insert tree inventory"
  ON agricultural_tree_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- سياسة التحديث: فقط الأدمن
CREATE POLICY "Admins can update tree inventory"
  ON agricultural_tree_inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- سياسة الحذف: فقط الأدمن
CREATE POLICY "Admins can delete tree inventory"
  ON agricultural_tree_inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );
