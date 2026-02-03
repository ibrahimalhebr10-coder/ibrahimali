/*
  # إصلاح سياسة RLS لجدول farm_offers للسماح للزوار بإرسال العروض

  1. المشكلة
    - السياسة الحالية تستخدم `TO public` لكنها لا تعمل للمستخدمين غير المسجلين
    - الخطأ: "new row violates row-level security policy"

  2. الحل
    - حذف السياسة القديمة
    - إنشاء سياسة جديدة تسمح لـ `anon` (المستخدمين غير المسجلين) بالإضافة
    - إضافة سياسة للمستخدمين المسجلين أيضاً

  3. التأثير
    - ✅ الزوار (غير المسجلين) يمكنهم إرسال عروض المزارع
    - ✅ المستخدمين المسجلين يمكنهم إرسال عروض المزارع
    - ✅ الإداريين يمكنهم مشاهدة وتحديث جميع العروض
*/

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Anyone can submit farm offer" ON farm_offers;

-- سياسة جديدة: السماح للمستخدمين غير المسجلين (anon) بإرسال عروض
CREATE POLICY "Anonymous users can submit farm offers"
  ON farm_offers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- سياسة جديدة: السماح للمستخدمين المسجلين بإرسال عروض
CREATE POLICY "Authenticated users can submit farm offers"
  ON farm_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
