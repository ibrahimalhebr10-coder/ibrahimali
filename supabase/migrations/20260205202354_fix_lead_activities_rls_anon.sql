/*
  # إصلاح RLS Policy لجدول lead_activities

  ## المشكلة
  السياسة الحالية لا تسمح للمستخدمين غير المسجلين (anonymous) بإضافة أنشطة

  ## الحل
  تحديث السياسة للسماح لكل من:
  - المستخدمين المسجلين (authenticated)
  - المستخدمين غير المسجلين (anon)

  ## التغييرات
  - حذف السياسة القديمة "Anyone can insert activities"
  - إنشاء سياسة جديدة تسمح لـ authenticated و anon
*/

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Anyone can insert activities" ON lead_activities;

-- إنشاء سياسة جديدة تسمح للجميع بالإضافة (authenticated + anon)
CREATE POLICY "Authenticated and anonymous can insert activities"
  ON lead_activities FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
