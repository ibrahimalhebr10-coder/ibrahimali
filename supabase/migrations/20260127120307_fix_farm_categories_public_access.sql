/*
  # إصلاح الوصول العام للفئات

  1. Changes
    - تحديث سياسة الوصول لجدول farm_categories لتسمح للزوار (anon) بقراءة البيانات
    - السابق: authenticated فقط
    - الجديد: authenticated و anon

  2. Security
    - الزوار يمكنهم القراءة فقط (SELECT)
    - لا يمكنهم الكتابة أو التعديل
*/

-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view active categories" ON farm_categories;

-- Create new policy for public access (anon + authenticated)
CREATE POLICY "Public can view active categories"
  ON farm_categories
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
