/*
  # إصلاح شامل لجميع سياسات RLS في قسم "مزرعتي"
  
  1. المشكلة:
    - جميع السياسات تستخدم: admins.id = auth.uid() ❌
    - يجب استخدام: admins.user_id = auth.uid() ✅
  
  2. الجداول المتأثرة:
    المسار الزراعي:
    - agricultural_growth_stages (مراحل النمو)
    - agricultural_operations (العمليات الزراعية)
    - agricultural_documentation (التوثيق)
    - agricultural_experience_content (باني التجربة)
    
    المسار الاستثماري:
    - investment_status_tracking (حالة الاستثمار)
    - investment_agricultural_assets (الأصول الزراعية)
    - investment_expansion_opportunities (فرص التوسع)
    - investment_experience_content (باني التجربة)
    - investment_products_yields (المنتجات)
    - investment_waste_yields (المخلفات)
  
  3. الحل:
    - حذف جميع السياسات القديمة
    - إنشاء سياسات جديدة بالفحص الصحيح
*/

-- ============================================
-- المسار الزراعي (Agricultural Path)
-- ============================================

-- 1. agricultural_growth_stages
DROP POLICY IF EXISTS "Admins have full access to growth stages" ON agricultural_growth_stages;

CREATE POLICY "Admins have full access to growth stages"
  ON agricultural_growth_stages
  FOR ALL
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

-- 2. agricultural_operations
DROP POLICY IF EXISTS "Admins have full access to operations" ON agricultural_operations;

CREATE POLICY "Admins have full access to operations"
  ON agricultural_operations
  FOR ALL
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

-- 3. agricultural_documentation
DROP POLICY IF EXISTS "Admins have full access to documentation" ON agricultural_documentation;

CREATE POLICY "Admins have full access to documentation"
  ON agricultural_documentation
  FOR ALL
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

-- 4. agricultural_experience_content
DROP POLICY IF EXISTS "Admins have full access to experience content" ON agricultural_experience_content;

CREATE POLICY "Admins have full access to experience content"
  ON agricultural_experience_content
  FOR ALL
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

-- ============================================
-- المسار الاستثماري (Investment Path)
-- ============================================

-- 5. investment_status_tracking
DROP POLICY IF EXISTS "Admins have full access to investment status" ON investment_status_tracking;

CREATE POLICY "Admins have full access to investment status"
  ON investment_status_tracking
  FOR ALL
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

-- 6. investment_agricultural_assets
DROP POLICY IF EXISTS "Admins have full access to investment assets" ON investment_agricultural_assets;

CREATE POLICY "Admins have full access to investment assets"
  ON investment_agricultural_assets
  FOR ALL
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

-- 7. investment_expansion_opportunities
DROP POLICY IF EXISTS "Admins have full access to expansion opportunities" ON investment_expansion_opportunities;

CREATE POLICY "Admins have full access to expansion opportunities"
  ON investment_expansion_opportunities
  FOR ALL
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

-- 8. investment_experience_content
DROP POLICY IF EXISTS "Admins have full access to investment experience content" ON investment_experience_content;

CREATE POLICY "Admins have full access to investment experience content"
  ON investment_experience_content
  FOR ALL
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

-- 9. investment_products_yields
DROP POLICY IF EXISTS "Admins have full access to products yields" ON investment_products_yields;

CREATE POLICY "Admins have full access to products yields"
  ON investment_products_yields
  FOR ALL
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

-- 10. investment_waste_yields
DROP POLICY IF EXISTS "Admins have full access to waste yields" ON investment_waste_yields;

CREATE POLICY "Admins have full access to waste yields"
  ON investment_waste_yields
  FOR ALL
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
