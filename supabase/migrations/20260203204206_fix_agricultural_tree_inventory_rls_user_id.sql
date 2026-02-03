/*
  # إصلاح سياسات RLS - استخدام user_id بدلاً من id
  
  1. المشكلة:
    - السياسة تتحقق من: admins.id = auth.uid()
    - لكن admins.id ≠ auth.uid()
    - admins.user_id = auth.uid() ✅
  
  2. الحل:
    - تغيير جميع السياسات لاستخدام user_id بدلاً من id
    - هذا يطابق المعمارية الصحيحة للنظام
*/

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Anyone can view tree inventory" ON agricultural_tree_inventory;
DROP POLICY IF EXISTS "Admins can insert tree inventory" ON agricultural_tree_inventory;
DROP POLICY IF EXISTS "Admins can update tree inventory" ON agricultural_tree_inventory;
DROP POLICY IF EXISTS "Admins can delete tree inventory" ON agricultural_tree_inventory;

-- سياسة القراءة: الجميع
CREATE POLICY "Anyone can view tree inventory"
  ON agricultural_tree_inventory
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- سياسة الإضافة: فقط الأدمن (باستخدام user_id)
CREATE POLICY "Admins can insert tree inventory"
  ON agricultural_tree_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

-- سياسة التحديث: فقط الأدمن (باستخدام user_id)
CREATE POLICY "Admins can update tree inventory"
  ON agricultural_tree_inventory
  FOR UPDATE
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

-- سياسة الحذف: فقط الأدمن (باستخدام user_id)
CREATE POLICY "Admins can delete tree inventory"
  ON agricultural_tree_inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );
