/*
  # إصلاح مسار المصادقة للمديرين
  
  1. المشكلة
    - RLS policies تمنع قراءة بيانات المدير مباشرة بعد تسجيل الدخول
    - هناك تعارض في التوقيت بين المصادقة والتحقق من الصلاحيات
  
  2. الحل
    - إنشاء database function مع SECURITY DEFINER للتحقق من صلاحيات المدير
    - هذه الدالة تتجاوز RLS وتعمل بصلاحيات المالك
    - تُستخدم مباشرة بعد تسجيل الدخول للتحقق من الصلاحيات
  
  3. الدوال الجديدة
    - `get_admin_by_user_id(uuid)`: تُرجع بيانات المدير بناءً على user_id
    - تعمل مع SECURITY DEFINER لتجاوز RLS
    - تتحقق من is_active = true
  
  4. الأمان
    - الدالة محمية ولا تقبل إلا user_id صحيح
    - تتحقق من حالة is_active
    - لا تكشف معلومات حساسة إذا لم يكن المستخدم مديراً
*/

-- حذف الدالة إذا كانت موجودة
DROP FUNCTION IF EXISTS get_admin_by_user_id(uuid);

-- إنشاء دالة للحصول على بيانات المدير
CREATE OR REPLACE FUNCTION get_admin_by_user_id(p_user_id uuid)
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
BEGIN
  -- إرجاع بيانات المدير إذا كان نشطاً
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.email,
    a.full_name,
    a.role,
    a.permissions,
    a.is_active,
    a.created_at,
    a.updated_at
  FROM admins a
  WHERE a.user_id = p_user_id
    AND a.is_active = true
  LIMIT 1;
END;
$$;

-- منح الصلاحية لجميع المستخدمين المصادقين لاستدعاء هذه الدالة
GRANT EXECUTE ON FUNCTION get_admin_by_user_id(uuid) TO authenticated;

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION get_admin_by_user_id(uuid) IS 'Returns admin data for a given user_id if the admin is active. Uses SECURITY DEFINER to bypass RLS.';
