/*
  # إصلاح RLS Policies للباقات الاستثمارية
  
  1. المشكلة
    - نفس مشكلة الباقات الزراعية
    - الـ policies معقدة وتسبب مشاكل في UPDATE
    
  2. الحل
    - تبسيط الـ policies وفصلها
    - تبسيط WITH CHECK للـ UPDATE policy
    
  3. الأمان
    - الباقات النشطة متاحة للجميع للقراءة
    - الباقات غير النشطة متاحة للمديرين فقط
    - المديرون فقط يمكنهم التعديل والحذف
*/

-- حذف الـ policies القديمة
DROP POLICY IF EXISTS "Anyone can view active investment packages" ON investment_packages;
DROP POLICY IF EXISTS "Admins can manage investment packages" ON investment_packages;

-- سياسة القراءة: الجميع يمكنهم رؤية الباقات النشطة
CREATE POLICY "public_view_active_inv_packages"
  ON investment_packages FOR SELECT
  TO public
  USING (is_active = true);

-- سياسة القراءة: المديرون يمكنهم رؤية جميع الباقات
CREATE POLICY "admins_view_all_inv_packages"
  ON investment_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة الإضافة: المديرون فقط
CREATE POLICY "admins_insert_inv_packages"
  ON investment_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة التحديث: المديرون فقط (مبسطة)
CREATE POLICY "admins_update_inv_packages"
  ON investment_packages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (true);

-- سياسة الحذف: المديرون فقط
CREATE POLICY "admins_delete_inv_packages"
  ON investment_packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
