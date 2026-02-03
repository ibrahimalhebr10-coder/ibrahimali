/*
  # إصلاح شامل لسياسات RLS في farm_offers

  1. المشكلة
    - لا زالت رسالة "new row violates row-level security policy"
    - المستخدمون غير المسجلين لا يمكنهم إرسال العروض

  2. الحل
    - حذف جميع السياسات القديمة
    - التأكد من تفعيل RLS
    - إنشاء سياسات جديدة نظيفة ومحددة

  3. السياسات الجديدة
    - سياسة INSERT لـ anon
    - سياسة INSERT لـ authenticated  
    - سياسة SELECT للإداريين
    - سياسة UPDATE للإداريين
*/

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Anyone can submit farm offer" ON farm_offers;
DROP POLICY IF EXISTS "Anonymous users can submit farm offers" ON farm_offers;
DROP POLICY IF EXISTS "Authenticated users can submit farm offers" ON farm_offers;
DROP POLICY IF EXISTS "Admins can view all offers" ON farm_offers;
DROP POLICY IF EXISTS "Admins can update offers" ON farm_offers;

-- 2. التأكد من تفعيل RLS
ALTER TABLE farm_offers ENABLE ROW LEVEL SECURITY;

-- 3. إنشاء سياسة INSERT للمستخدمين غير المسجلين (anon)
CREATE POLICY "farm_offers_insert_anon"
  ON farm_offers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. إنشاء سياسة INSERT للمستخدمين المسجلين
CREATE POLICY "farm_offers_insert_authenticated"
  ON farm_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. إنشاء سياسة SELECT للإداريين فقط
CREATE POLICY "farm_offers_select_admins"
  ON farm_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 6. إنشاء سياسة UPDATE للإداريين فقط
CREATE POLICY "farm_offers_update_admins"
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

-- 7. التحقق من أن الجدول يقبل القيم الافتراضية للحقول المطلوبة
COMMENT ON TABLE farm_offers IS 'جدول عروض المزارع - يسمح لأي شخص (مسجل أو غير مسجل) بإرسال عروض';
COMMENT ON POLICY "farm_offers_insert_anon" ON farm_offers IS 'السماح للمستخدمين غير المسجلين بإرسال عروض المزارع';
COMMENT ON POLICY "farm_offers_insert_authenticated" ON farm_offers IS 'السماح للمستخدمين المسجلين بإرسال عروض المزارع';
