/*
  # إنشاء جدول ربط الأدوار بالصلاحيات (Role-Actions Mapping)
  
  ## 1. جدول role_actions
    - جدول ربط Many-to-Many بين admin_roles و admin_actions
    - يحدد الصلاحيات المتاحة لكل دور
    - يدعم تخصيص إضافي (تعطيل/تفعيل صلاحية لدور معين)
  
  ## 2. الحقول
    - role_id: معرف الدور
    - action_id: معرف الصلاحية
    - is_enabled: هل الصلاحية مفعلة لهذا الدور؟
    - notes: ملاحظات إضافية
  
  ## 3. الأمان
    - RLS مفعل
    - القراءة: جميع المديرين
    - الكتابة: المدير العام فقط
*/

-- إنشاء جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS role_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES admin_actions(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, action_id)
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_role_actions_role_id 
ON role_actions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_actions_action_id 
ON role_actions(action_id);

CREATE INDEX IF NOT EXISTS idx_role_actions_enabled 
ON role_actions(is_enabled) WHERE is_enabled = true;

-- تفعيل RLS
ALTER TABLE role_actions ENABLE ROW LEVEL SECURITY;

-- سياسة قراءة للمديرين
CREATE POLICY "المديرون يمكنهم قراءة ربط الأدوار بالصلاحيات"
  ON role_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- سياسة كتابة للمدير العام فقط
CREATE POLICY "المدير العام يمكنه إدارة ربط الأدوار بالصلاحيات"
  ON role_actions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key = 'super_admin'
    )
  );

-- دالة للحصول على صلاحيات دور معين
CREATE OR REPLACE FUNCTION get_role_actions(p_role_id uuid)
RETURNS TABLE(
  action_id uuid,
  action_key text,
  action_name_ar text,
  action_name_en text,
  description_ar text,
  description_en text,
  scope_level text,
  is_dangerous boolean,
  requires_approval boolean,
  category_key text,
  category_name_ar text,
  is_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id as action_id,
    aa.action_key,
    aa.action_name_ar,
    aa.action_name_en,
    aa.description_ar,
    aa.description_en,
    aa.scope_level,
    aa.is_dangerous,
    aa.requires_approval,
    ac.category_key,
    ac.category_name_ar,
    ra.is_enabled
  FROM role_actions ra
  JOIN admin_actions aa ON aa.id = ra.action_id
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ra.role_id = p_role_id
    AND aa.is_active = true
    AND ac.is_active = true
  ORDER BY ac.display_order, aa.display_order;
END;
$$;

-- دالة للحصول على صلاحيات دور معين (المفعلة فقط)
CREATE OR REPLACE FUNCTION get_enabled_role_actions(p_role_id uuid)
RETURNS TABLE(
  action_id uuid,
  action_key text,
  action_name_ar text,
  scope_level text,
  is_dangerous boolean,
  requires_approval boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id as action_id,
    aa.action_key,
    aa.action_name_ar,
    aa.scope_level,
    aa.is_dangerous,
    aa.requires_approval
  FROM role_actions ra
  JOIN admin_actions aa ON aa.id = ra.action_id
  WHERE ra.role_id = p_role_id
    AND ra.is_enabled = true
    AND aa.is_active = true
  ORDER BY aa.action_key;
END;
$$;

-- دالة للتحقق من صلاحية معينة لدور
CREATE OR REPLACE FUNCTION check_role_has_action(
  p_role_id uuid,
  p_action_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_action boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM role_actions ra
    JOIN admin_actions aa ON aa.id = ra.action_id
    WHERE ra.role_id = p_role_id
      AND aa.action_key = p_action_key
      AND ra.is_enabled = true
      AND aa.is_active = true
  ) INTO v_has_action;
  
  RETURN v_has_action;
END;
$$;

-- دالة لإضافة صلاحيات لدور (batch insert)
CREATE OR REPLACE FUNCTION assign_actions_to_role(
  p_role_id uuid,
  p_action_keys text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- حذف الصلاحيات الحالية
  DELETE FROM role_actions WHERE role_id = p_role_id;
  
  -- إضافة الصلاحيات الجديدة
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT p_role_id, aa.id, true
  FROM admin_actions aa
  WHERE aa.action_key = ANY(p_action_keys)
    AND aa.is_active = true;
  
  RETURN true;
END;
$$;

-- دالة لتحديث حالة صلاحية لدور
CREATE OR REPLACE FUNCTION toggle_role_action(
  p_role_id uuid,
  p_action_id uuid,
  p_is_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE role_actions
  SET is_enabled = p_is_enabled, updated_at = now()
  WHERE role_id = p_role_id AND action_id = p_action_id;
  
  RETURN FOUND;
END;
$$;

-- دالة للحصول على عدد الصلاحيات لكل دور
CREATE OR REPLACE FUNCTION get_roles_actions_count()
RETURNS TABLE(
  role_id uuid,
  role_key text,
  role_name_ar text,
  total_actions bigint,
  enabled_actions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id as role_id,
    ar.role_key,
    ar.role_name_ar,
    COUNT(ra.id) as total_actions,
    COUNT(ra.id) FILTER (WHERE ra.is_enabled = true) as enabled_actions
  FROM admin_roles ar
  LEFT JOIN role_actions ra ON ra.role_id = ar.id
  WHERE ar.is_active = true
  GROUP BY ar.id, ar.role_key, ar.role_name_ar
  ORDER BY ar.hierarchy_level DESC;
END;
$$;
