/*
  # إصلاح نهائي لـ RLS في farm_offers - تعطيل وإعادة تفعيل

  1. الخطوات
    - تعطيل RLS مؤقتاً
    - حذف جميع السياسات
    - إعادة تفعيل RLS
    - إنشاء سياسات جديدة بسيطة وواضحة

  2. السياسات النهائية
    - INSERT: متاح للجميع (anon + authenticated)
    - SELECT: للإداريين فقط
    - UPDATE: للإداريين فقط
    - DELETE: محظور تماماً
*/

-- 1. تعطيل RLS مؤقتاً
ALTER TABLE farm_offers DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع السياسات
DROP POLICY IF EXISTS "farm_offers_insert_anon" ON farm_offers;
DROP POLICY IF EXISTS "farm_offers_insert_authenticated" ON farm_offers;
DROP POLICY IF EXISTS "farm_offers_select_admins" ON farm_offers;
DROP POLICY IF EXISTS "farm_offers_update_admins" ON farm_offers;

-- 3. إعادة تفعيل RLS
ALTER TABLE farm_offers ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسة INSERT واحدة للجميع
CREATE POLICY "allow_insert_for_all"
  ON farm_offers
  FOR INSERT
  WITH CHECK (true);

-- 5. سياسة SELECT للإداريين
CREATE POLICY "allow_select_for_admins"
  ON farm_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 6. سياسة UPDATE للإداريين
CREATE POLICY "allow_update_for_admins"
  ON farm_offers
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

-- 7. التحقق من أن السياسات تم تطبيقها
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'farm_offers';
  
  IF policy_count < 3 THEN
    RAISE EXCEPTION 'Failed to create all policies. Count: %', policy_count;
  END IF;
END $$;
