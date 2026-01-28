/*
  # إضافة الدوال المساعدة والسياسات لنظام النطاق
  
  ## الدوال
    - update_admin_scope_from_assignments
    - get_admin_assigned_farms
    - get_farm_assigned_admins
    - assign_farm_to_admin
    - unassign_farm_from_admin
  
  ## السياسات
    - سياسات RLS لجدول admin_farm_assignments
*/

-- إضافة السياسات الأمنية
CREATE POLICY "read_farm_assignments"
  ON admin_farm_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "create_farm_assignments"
  ON admin_farm_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key IN ('super_admin', 'farm_manager')
    )
  );

CREATE POLICY "delete_farm_assignments"
  ON admin_farm_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN admin_roles ar ON ar.id = a.role_id
      WHERE a.id = auth.uid()
        AND ar.role_key IN ('super_admin', 'farm_manager')
    )
  );

-- دالة لتحديث scope_value بناءً على التعيينات
CREATE OR REPLACE FUNCTION update_admin_scope_from_assignments(p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scope_type text;
  v_farm_ids jsonb;
BEGIN
  SELECT scope_type INTO v_scope_type
  FROM admins
  WHERE id = p_admin_id;

  IF v_scope_type IN ('farms', 'farm') THEN
    SELECT jsonb_agg(farm_id)
    INTO v_farm_ids
    FROM admin_farm_assignments
    WHERE admin_id = p_admin_id;

    IF v_scope_type = 'farm' AND jsonb_array_length(COALESCE(v_farm_ids, '[]'::jsonb)) > 0 THEN
      UPDATE admins
      SET scope_value = jsonb_build_object('farm_id', v_farm_ids->0)
      WHERE id = p_admin_id;
    ELSIF v_scope_type = 'farms' THEN
      UPDATE admins
      SET scope_value = jsonb_build_object('farm_ids', COALESCE(v_farm_ids, '[]'::jsonb))
      WHERE id = p_admin_id;
    END IF;
  END IF;
END;
$$;

-- دالة للحصول على المزارع المعينة للمدير
CREATE OR REPLACE FUNCTION get_admin_assigned_farms(p_admin_id uuid)
RETURNS TABLE(
  farm_id uuid,
  farm_name_ar text,
  farm_name_en text,
  assigned_at timestamptz,
  assigned_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name_ar,
    f.name_en,
    afa.assigned_at,
    a.full_name as assigned_by_name
  FROM admin_farm_assignments afa
  JOIN farms f ON f.id = afa.farm_id
  LEFT JOIN admins a ON a.id = afa.assigned_by
  WHERE afa.admin_id = p_admin_id
  ORDER BY afa.assigned_at DESC;
END;
$$;

-- دالة للحصول على المديرين المعينين لمزرعة
CREATE OR REPLACE FUNCTION get_farm_assigned_admins(p_farm_id uuid)
RETURNS TABLE(
  admin_id uuid,
  full_name text,
  email text,
  role_name_ar text,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.full_name,
    a.email,
    ar.role_name_ar,
    afa.assigned_at
  FROM admin_farm_assignments afa
  JOIN admins a ON a.id = afa.admin_id
  LEFT JOIN admin_roles ar ON ar.id = a.role_id
  WHERE afa.farm_id = p_farm_id
    AND a.is_active = true
  ORDER BY afa.assigned_at DESC;
END;
$$;

-- دالة لتعيين مزرعة لمدير
CREATE OR REPLACE FUNCTION assign_farm_to_admin(
  p_admin_id uuid,
  p_farm_id uuid,
  p_assigned_by uuid,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id uuid;
BEGIN
  INSERT INTO admin_farm_assignments (
    admin_id,
    farm_id,
    assigned_by,
    notes
  ) VALUES (
    p_admin_id,
    p_farm_id,
    p_assigned_by,
    p_notes
  )
  ON CONFLICT (admin_id, farm_id) DO UPDATE
  SET 
    assigned_by = p_assigned_by,
    assigned_at = now(),
    notes = p_notes
  RETURNING id INTO v_assignment_id;

  PERFORM update_admin_scope_from_assignments(p_admin_id);

  RETURN v_assignment_id;
END;
$$;

-- دالة لإلغاء تعيين مزرعة من مدير
CREATE OR REPLACE FUNCTION unassign_farm_from_admin(
  p_admin_id uuid,
  p_farm_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_farm_assignments
  WHERE admin_id = p_admin_id
    AND farm_id = p_farm_id;

  PERFORM update_admin_scope_from_assignments(p_admin_id);

  RETURN FOUND;
END;
$$;

-- تحديث scope للمديرين الحاليين
UPDATE admins
SET scope_type = 'all', scope_value = NULL
WHERE email = 'admin@olivefarms.test';

UPDATE admins
SET scope_type = 'farm', scope_value = NULL
WHERE email = 'test.farm.manager@olivefarms.test';
