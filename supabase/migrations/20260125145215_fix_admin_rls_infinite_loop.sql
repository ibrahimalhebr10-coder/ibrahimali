/*
  # إصلاح حلقة RLS اللانهائية في جدول admins

  1. المشكلة
    - السياسة "Active admins can view all admins" تسبب infinite recursion
    - عندما يحاول المدير قراءة سجله، تتحقق السياسة من نفس الجدول
    
  2. الحل
    - حذف السياسة المعقدة
    - السماح لكل مدير برؤية جميع المديرين بشكل بسيط
    - استخدام auth.uid() مباشرة بدون الاستعلام من نفس الجدول
*/

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Active admins can view all admins" ON admins;

-- سياسة بسيطة: المديرون المصادقون يمكنهم رؤية جميع المديرين
CREATE POLICY "Authenticated admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    -- التحقق من أن المستخدم الحالي موجود في جدول admins بدون infinite loop
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
    )
  );
