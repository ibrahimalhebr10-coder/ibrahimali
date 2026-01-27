/*
  # صلاحيات إدارة المزارع للأدمن

  ## السياسات الجديدة
  
  ### 1. farms
  - INSERT: الأدمن يستطيع إضافة مزارع جديدة
  - UPDATE: الأدمن يستطيع تعديل جميع المزارع
  - DELETE: الأدمن يستطيع حذف المزارع
  
  ### 2. farms_tree_types
  - إدارة كاملة للأدمن
  
  ### 3. farms_tree_varieties
  - إدارة كاملة للأدمن
  
  ## الأمان
  - جميع العمليات تتطلب صفة admin
  - التحقق من admins.is_active = true
*/

-- سياسات INSERT للأدمن في farms
DROP POLICY IF EXISTS "Admins can insert farms" ON farms;
CREATE POLICY "Admins can insert farms"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسات UPDATE للأدمن في farms
DROP POLICY IF EXISTS "Admins can update farms" ON farms;
CREATE POLICY "Admins can update farms"
  ON farms FOR UPDATE
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

-- سياسات DELETE للأدمن في farms
DROP POLICY IF EXISTS "Admins can delete farms" ON farms;
CREATE POLICY "Admins can delete farms"
  ON farms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسات SELECT للأدمن في farms (لرؤية جميع المزارع)
DROP POLICY IF EXISTS "Admins can view all farms" ON farms;
CREATE POLICY "Admins can view all farms"
  ON farms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- سياسات farms_tree_types
DROP POLICY IF EXISTS "Admins can manage farm tree types" ON farms_tree_types;
CREATE POLICY "Admins can manage farm tree types"
  ON farms_tree_types FOR ALL
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

-- سياسات farms_tree_varieties
DROP POLICY IF EXISTS "Admins can manage farm tree varieties" ON farms_tree_varieties;
CREATE POLICY "Admins can manage farm tree varieties"
  ON farms_tree_varieties FOR ALL
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