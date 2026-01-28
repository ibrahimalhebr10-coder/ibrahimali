/*
  # إضافة سياسات RLS بناءً على نظام الصلاحيات الجديد
  
  ## 1. جدول farm_tasks
    - قراءة: بناءً على صلاحيات tasks.view أو tasks.view_own
    - إنشاء: صلاحية tasks.create
    - تحديث: صلاحية tasks.update
    - حذف: صلاحية tasks.delete
  
  ## 2. جدول investor_messages
    - قراءة: صلاحية messaging.view
    - إنشاء: صلاحية messaging.create
    - إرسال: صلاحية messaging.send
  
  ## 3. دالة مساعدة
    - admin_has_action: التحقق من امتلاك المدير لصلاحية معينة
*/

-- دالة للتحقق من امتلاك المدير لصلاحية معينة
CREATE OR REPLACE FUNCTION admin_has_action(p_action_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_admin_id uuid;
  v_role_id uuid;
  v_has_action boolean;
BEGIN
  -- الحصول على معرف المدير
  SELECT id, role_id INTO v_admin_id, v_role_id
  FROM admins
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- التحقق من امتلاك الدور للصلاحية
  SELECT EXISTS(
    SELECT 1
    FROM role_actions ra
    JOIN admin_actions aa ON aa.id = ra.action_id
    WHERE ra.role_id = v_role_id
      AND aa.action_key = p_action_key
      AND ra.is_enabled = true
      AND aa.is_active = true
  ) INTO v_has_action;
  
  RETURN v_has_action;
END;
$$;

-- دالة للتحقق من الوصول للمزرعة
CREATE OR REPLACE FUNCTION admin_has_farm_access(p_farm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_admin_id uuid;
  v_role_key text;
  v_has_access boolean;
BEGIN
  -- الحصول على معرف المدير ودوره
  SELECT a.id, ar.role_key INTO v_admin_id, v_role_key
  FROM admins a
  JOIN admin_roles ar ON ar.id = a.role_id
  WHERE a.user_id = auth.uid()
    AND a.is_active = true
  LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- المدير العام يملك وصول لجميع المزارع
  IF v_role_key = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- التحقق من تعيين المزرعة
  SELECT EXISTS(
    SELECT 1
    FROM admin_farm_assignments
    WHERE admin_id = v_admin_id
      AND farm_id = p_farm_id
      AND is_active = true
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- =================================================================
-- farm_tasks RLS Policies
-- =================================================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "المديرون يمكنهم قراءة المهام" ON farm_tasks;
DROP POLICY IF EXISTS "المديرون يمكنهم إنشاء المهام" ON farm_tasks;
DROP POLICY IF EXISTS "المديرون يمكنهم تحديث المهام" ON farm_tasks;
DROP POLICY IF EXISTS "المديرون يمكنهم حذف المهام" ON farm_tasks;

-- قراءة: tasks.view (جميع المهام) أو tasks.view_own (مهامي فقط)
CREATE POLICY "قراءة المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR SELECT
  TO authenticated
  USING (
    CASE
      -- يملك صلاحية عرض جميع المهام
      WHEN admin_has_action('tasks.view') THEN
        admin_has_farm_access(farm_id)
      -- يملك صلاحية عرض مهامه فقط
      WHEN admin_has_action('tasks.view_own') THEN
        EXISTS (
          SELECT 1
          FROM admins
          WHERE user_id = auth.uid()
            AND id = farm_tasks.assigned_to
            AND is_active = true
        )
      ELSE false
    END
  );

-- إنشاء: tasks.create
CREATE POLICY "إنشاء المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_has_action('tasks.create')
    AND admin_has_farm_access(farm_id)
  );

-- تحديث: tasks.update
CREATE POLICY "تحديث المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR UPDATE
  TO authenticated
  USING (
    (admin_has_action('tasks.update') AND admin_has_farm_access(farm_id))
    OR
    (admin_has_action('tasks.complete') AND
     EXISTS (
       SELECT 1 FROM admins
       WHERE user_id = auth.uid()
         AND id = farm_tasks.assigned_to
         AND is_active = true
     ))
  )
  WITH CHECK (
    (admin_has_action('tasks.update') AND admin_has_farm_access(farm_id))
    OR
    (admin_has_action('tasks.complete') AND
     EXISTS (
       SELECT 1 FROM admins
       WHERE user_id = auth.uid()
         AND id = farm_tasks.assigned_to
         AND is_active = true
     ))
  );

-- حذف: tasks.delete
CREATE POLICY "حذف المهام بناءً على الصلاحيات"
  ON farm_tasks
  FOR DELETE
  TO authenticated
  USING (
    admin_has_action('tasks.delete')
    AND admin_has_farm_access(farm_id)
  );

-- =================================================================
-- investor_messages RLS Policies
-- =================================================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "المديرون يمكنهم قراءة الرسائل" ON investor_messages;
DROP POLICY IF EXISTS "المديرون يمكنهم إنشاء الرسائل" ON investor_messages;
DROP POLICY IF EXISTS "المديرون يمكنهم تحديث الرسائل" ON investor_messages;
DROP POLICY IF EXISTS "المديرون يمكنهم حذف الرسائل" ON investor_messages;

-- قراءة: messaging.view
CREATE POLICY "قراءة الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR SELECT
  TO authenticated
  USING (
    admin_has_action('messaging.view')
    AND admin_has_farm_access(farm_id)
  );

-- إنشاء: messaging.create
CREATE POLICY "إنشاء الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_has_action('messaging.create')
    AND admin_has_farm_access(farm_id)
  );

-- تحديث: messaging.send (تغيير الحالة من draft إلى sent)
CREATE POLICY "تحديث الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR UPDATE
  TO authenticated
  USING (
    admin_has_action('messaging.send')
    AND admin_has_farm_access(farm_id)
  )
  WITH CHECK (
    admin_has_action('messaging.send')
    AND admin_has_farm_access(farm_id)
  );

-- حذف: messaging.delete
CREATE POLICY "حذف الرسائل بناءً على الصلاحيات"
  ON investor_messages
  FOR DELETE
  TO authenticated
  USING (
    admin_has_action('messaging.delete')
    AND admin_has_farm_access(farm_id)
  );

-- =================================================================
-- Indexes للأداء
-- =================================================================

-- index لتسريع البحث عن المديرين
CREATE INDEX IF NOT EXISTS idx_admins_user_id_active
ON admins(user_id) WHERE is_active = true;

-- index لتسريع البحث عن تعيينات المزارع
CREATE INDEX IF NOT EXISTS idx_admin_farm_assignments_lookup
ON admin_farm_assignments(admin_id, farm_id) WHERE is_active = true;

-- index لتسريع البحث عن المهام حسب المسند إليه
CREATE INDEX IF NOT EXISTS idx_farm_tasks_assigned_to
ON farm_tasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- =================================================================
-- تعليقات توضيحية
-- =================================================================

COMMENT ON FUNCTION admin_has_action(text) IS 'التحقق من امتلاك المدير الحالي لصلاحية معينة من نظام role_actions';
COMMENT ON FUNCTION admin_has_farm_access(uuid) IS 'التحقق من إمكانية وصول المدير لمزرعة معينة';
