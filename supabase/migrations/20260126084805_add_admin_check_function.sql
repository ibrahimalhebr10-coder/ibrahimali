/*
  # إضافة دالة للتحقق من صلاحيات المدير
  
  1. الهدف
    - إنشاء دالة آمنة للتحقق من صلاحيات المدير
    - تجاوز قيود RLS للتحقق من البيانات
  
  2. الوظائف الجديدة
    - `get_admin_by_user_id`: دالة للحصول على بيانات المدير بناءً على user_id
  
  3. الأمان
    - الدالة تعمل مع صلاحيات SECURITY DEFINER
    - التحقق من أن المستخدم مصادق عليه
*/

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
  -- التحقق من أن المستخدم مصادق عليه
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- التحقق من أن المستخدم يطلب بياناته الخاصة
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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
  WHERE a.user_id = p_user_id
    AND a.is_active = true;
END;
$$;

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION get_admin_by_user_id(uuid) TO authenticated;
