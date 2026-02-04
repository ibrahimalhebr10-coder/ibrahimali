/*
  # إصلاح سياسات RLS للجداول الإدارية المتبقية
  
  1. المشكلة:
    - السياسات تستخدم: admins.id = auth.uid() ❌
    - يجب استخدام: admins.user_id = auth.uid() ✅
  
  2. الجداول المتأثرة:
    - action_categories (مجموعات الصلاحيات)
    - admin_actions (الصلاحيات)
    - admin_farm_assignments (تعيينات المزارع)
    - role_actions (ربط الأدوار بالصلاحيات)
    - storage.objects (الملفات المرفوعة)
  
  3. الحل:
    - حذف السياسات القديمة
    - إنشاء سياسات جديدة بالفحص الصحيح
*/

-- 1. action_categories
DROP POLICY IF EXISTS "المديرون يمكنهم قراءة مجموعات الص" ON action_categories;

CREATE POLICY "Admins can read action categories"
  ON action_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

-- 2. admin_actions
DROP POLICY IF EXISTS "المديرون يمكنهم قراءة الصلاحيات" ON admin_actions;

CREATE POLICY "Admins can read admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

-- 3. admin_farm_assignments
DROP POLICY IF EXISTS "read_farm_assignments" ON admin_farm_assignments;

CREATE POLICY "Admins can read farm assignments"
  ON admin_farm_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

-- 4. role_actions
DROP POLICY IF EXISTS "المديرون يمكنهم قراءة ربط الأدوار " ON role_actions;

CREATE POLICY "Admins can read role actions"
  ON role_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

-- 5. storage.objects (agricultural_media bucket)
-- نحتاج إلى إصلاح سياسات storage bucket بشكل منفصل
DROP POLICY IF EXISTS "Admins can upload agricultural media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update agricultural media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete agricultural media" ON storage.objects;

CREATE POLICY "Admins can upload agricultural media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'agricultural_media' 
    AND EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can update agricultural media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'agricultural_media' 
    AND EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can delete agricultural media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'agricultural_media' 
    AND EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.user_id = auth.uid()
        AND admins.is_active = true
    )
  );
