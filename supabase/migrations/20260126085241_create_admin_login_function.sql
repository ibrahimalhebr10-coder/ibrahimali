/*
  # إنشاء دالة تسجيل دخول المدير الآمنة
  
  1. الهدف
    - إنشاء دالة آمنة للتحقق من صلاحيات المدير
    - تجاوز قيود RLS بشكل كامل
    - إرجاع بيانات المدير مباشرة
  
  2. الوظائف الجديدة
    - `check_admin_access`: دالة للتحقق من صلاحيات المدير وإرجاع بياناته
  
  3. الأمان
    - الدالة تعمل مع صلاحيات SECURITY DEFINER
    - تتجاوز RLS بشكل آمن
    - تتحقق من أن المستخدم مصادق عليه
*/

-- حذف الدالة القديمة إن وجدت
DROP FUNCTION IF EXISTS check_admin_access();

-- إنشاء دالة التحقق من صلاحيات المدير
CREATE OR REPLACE FUNCTION check_admin_access()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text,
  permissions jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  current_user_id := auth.uid();
  
  -- التحقق من أن المستخدم مصادق عليه
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- إرجاع بيانات المدير
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.email,
    a.full_name,
    a.role::text,
    a.permissions,
    a.is_active,
    a.created_at,
    a.updated_at
  FROM admins a
  WHERE a.user_id = current_user_id
    AND a.is_active = true;
END;
$$;

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_access() TO anon;

-- إنشاء تعليق على الدالة
COMMENT ON FUNCTION check_admin_access() IS 'دالة آمنة للتحقق من صلاحيات المدير وإرجاع بياناته، تتجاوز قيود RLS';
