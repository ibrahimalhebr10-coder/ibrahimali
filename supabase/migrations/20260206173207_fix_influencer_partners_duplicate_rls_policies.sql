/*
  # إصلاح سياسات RLS المكررة لجدول المؤثرين
  
  المشكلة:
  - يوجد سياستين متضاربتين للقراءة (SELECT)
  - إحداها تشترط is_active = true والأخرى لا
  - هذا يسبب اختفاء وظهور البيانات بشكل عشوائي
  
  الحل:
  1. حذف جميع السياسات المكررة القديمة
  2. إنشاء سياسات واضحة وبسيطة بدون تضارب
  3. سياسة واحدة للـ admins بدون شرط is_active
  4. سياسة منفصلة للشركاء لعرض بياناتهم الخاصة
*/

-- حذف جميع السياسات المكررة القديمة
DROP POLICY IF EXISTS "Admins can view all influencer partners" ON influencer_partners;
DROP POLICY IF EXISTS "Admins can view all partners" ON influencer_partners;
DROP POLICY IF EXISTS "Admins can insert influencer partners" ON influencer_partners;
DROP POLICY IF EXISTS "Admins can update influencer partners" ON influencer_partners;
DROP POLICY IF EXISTS "Admins can update partners" ON influencer_partners;
DROP POLICY IF EXISTS "Admins can delete influencer partners" ON influencer_partners;
DROP POLICY IF EXISTS "Influencers can view own data" ON influencer_partners;
DROP POLICY IF EXISTS "Partners can view their own record" ON influencer_partners;
DROP POLICY IF EXISTS "Partners can update their own record" ON influencer_partners;

-- إنشاء سياسات RLS واضحة وبسيطة

-- 1. سياسة القراءة للـ Admins (بدون شرط is_active لتجنب المشاكل)
CREATE POLICY "admins_can_view_all_partners"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- 2. سياسة الإدراج للـ Admins
CREATE POLICY "admins_can_insert_partners"
  ON influencer_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- 3. سياسة التحديث للـ Admins
CREATE POLICY "admins_can_update_partners"
  ON influencer_partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- 4. سياسة الحذف للـ Admins
CREATE POLICY "admins_can_delete_partners"
  ON influencer_partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
    )
  );

-- 5. سياسة القراءة للشركاء (لعرض بياناتهم الخاصة)
CREATE POLICY "partners_can_view_own_data"
  ON influencer_partners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. سياسة التحديث للشركاء (لتحديث بياناتهم الخاصة فقط)
CREATE POLICY "partners_can_update_own_data"
  ON influencer_partners
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. سياسة تسجيل شركاء جدد
CREATE POLICY "users_can_register_as_partner"
  ON influencer_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND phone IS NOT NULL 
    AND name IS NOT NULL 
    AND status IN ('pending', 'active')
  );
