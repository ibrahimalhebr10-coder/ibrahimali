/*
  # تبسيط سياسات RLS لجدول admins

  1. المشكلة
    - السياسات الحالية تسبب infinite recursion
    - عند محاولة قراءة سجل من admins، تحتاج السياسة للتحقق من admins نفسه
    
  2. الحل
    - السماح لكل مستخدم مصادق برؤية سجله الخاص فقط
    - بعد تسجيل الدخول، يمكن للكود أن يتحقق من صلاحيات المدير
    - إزالة التحققات المعقدة من RLS
*/

-- حذف جميع السياسات الموجودة
DROP POLICY IF EXISTS "Users can view their own admin record" ON admins;
DROP POLICY IF EXISTS "Authenticated admins can view all admins" ON admins;

-- سياسة بسيطة جداً: كل مستخدم يرى سجله فقط
CREATE POLICY "Users view own admin record"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
