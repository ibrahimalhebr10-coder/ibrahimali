/*
  # إصلاح RLS Policies للباقات الزراعية
  
  1. المشكلة
    - فشل تحديث الباقات الزراعية بسبب RLS policies
    - الخطأ: "Cannot coerce the result to a single JSON object"
    - السبب: الـ policies تتطلب EXISTS check على admins
    
  2. الحل
    - تبسيط الـ UPDATE policy
    - إضافة policy للسماح للـ admins بعرض جميع الباقات
    
  3. الأمان
    - الباقات النشطة متاحة للجميع للقراءة
    - الباقات غير النشطة متاحة للمديرين فقط
    - المديرون فقط يمكنهم التعديل والحذف
*/

-- حذف الـ policies القديمة
DROP POLICY IF EXISTS "Anyone can view active agricultural packages" ON agricultural_packages;
DROP POLICY IF EXISTS "Admins can insert agricultural packages" ON agricultural_packages;
DROP POLICY IF EXISTS "Admins can update agricultural packages" ON agricultural_packages;
DROP POLICY IF EXISTS "Admins can delete agricultural packages" ON agricultural_packages;

-- سياسة القراءة: الجميع يمكنهم رؤية الباقات النشطة
CREATE POLICY "public_view_active_packages"
  ON agricultural_packages FOR SELECT
  TO public
  USING (is_active = true);

-- سياسة القراءة: المديرون يمكنهم رؤية جميع الباقات
CREATE POLICY "admins_view_all_packages"
  ON agricultural_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة الإضافة: المديرون فقط
CREATE POLICY "admins_insert_packages"
  ON agricultural_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسة التحديث: المديرون فقط (مبسطة)
CREATE POLICY "admins_update_packages"
  ON agricultural_packages FOR UPDATE
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
CREATE POLICY "admins_delete_packages"
  ON agricultural_packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
