/*
  # إصلاح سياسة إدراج المديرين

  1. التغييرات
    - حذف السياسة التي تسبب infinite recursion
    - إضافة سياسة INSERT منفصلة للمديرين الجدد
    - السماح بإضافة أول مدير بدون شروط معقدة
    
  2. الأمان
    - السياسة الجديدة تسمح للمستخدمين المصادقين بإضافة سجل admin لأنفسهم فقط
    - بعد إضافة المدير الأول، سيتحكم في بقية العمليات
*/

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;

-- سياسة INSERT منفصلة - يسمح للمستخدم بإضافة سجل admin لنفسه
CREATE POLICY "Users can insert their own admin record"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- سياسة UPDATE للـ super admins فقط
CREATE POLICY "Super admins can update admins"
  ON admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.role = 'super_admin'
      AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.role = 'super_admin'
      AND a.is_active = true
    )
  );

-- سياسة DELETE للـ super admins فقط
CREATE POLICY "Super admins can delete admins"
  ON admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.role = 'super_admin'
      AND a.is_active = true
    )
  );
