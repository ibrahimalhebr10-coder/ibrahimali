/*
  # إنشاء سجل مركزي للصلاحيات (Actions Registry)
  
  ## 1. جدول action_categories
    - مجموعات الصلاحيات (التشغيل، المهام، الصيانة، إلخ)
    - وصف ومعلومات عن كل مجموعة
  
  ## 2. جدول admin_actions
    - سجل جميع الصلاحيات المتاحة في النظام
    - كل صلاحية تنتمي لمجموعة
    - معلومات تفصيلية عن كل صلاحية
  
  ## 3. المجموعات السبع
    1. التشغيل (Operations)
    2. المهام (Tasks)
    3. الصيانة (Maintenance)
    4. المعدات (Equipment)
    5. المالية التشغيلية (Operational Finance)
    6. المراسلة (Messaging)
    7. الإشراف (Supervision)
  
  ## 4. الأمان
    - تفعيل RLS على كلا الجدولين
    - سياسات قراءة للجميع
    - سياسات كتابة للمدير العام فقط
*/

-- إنشاء جدول مجموعات الصلاحيات
CREATE TABLE IF NOT EXISTS action_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text UNIQUE NOT NULL,
  category_name_ar text NOT NULL,
  category_name_en text NOT NULL,
  description_ar text,
  description_en text,
  icon text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول الصلاحيات
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES action_categories(id) ON DELETE CASCADE,
  action_key text UNIQUE NOT NULL,
  action_name_ar text NOT NULL,
  action_name_en text NOT NULL,
  description_ar text,
  description_en text,
  scope_level text DEFAULT 'farm',
  is_dangerous boolean DEFAULT false,
  requires_approval boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- إضافة قيد على scope_level
ALTER TABLE admin_actions
ADD CONSTRAINT admin_actions_scope_level_check
CHECK (scope_level IN ('system', 'farm', 'task', 'own'));

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_category_id 
ON admin_actions(category_id);

CREATE INDEX IF NOT EXISTS idx_admin_actions_action_key 
ON admin_actions(action_key);

CREATE INDEX IF NOT EXISTS idx_admin_actions_scope_level 
ON admin_actions(scope_level);

CREATE INDEX IF NOT EXISTS idx_action_categories_category_key 
ON action_categories(category_key);

-- تفعيل RLS
ALTER TABLE action_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- سياسات قراءة للمديرين
CREATE POLICY "المديرون يمكنهم قراءة مجموعات الصلاحيات"
  ON action_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "المديرون يمكنهم قراءة الصلاحيات"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- سياسات كتابة للمدير العام فقط
CREATE POLICY "المدير العام يمكنه إدارة مجموعات الصلاحيات"
  ON action_categories
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

CREATE POLICY "المدير العام يمكنه إدارة الصلاحيات"
  ON admin_actions
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

-- دالة للحصول على جميع الصلاحيات مع مجموعاتها
CREATE OR REPLACE FUNCTION get_all_actions_with_categories()
RETURNS TABLE(
  action_id uuid,
  action_key text,
  action_name_ar text,
  action_name_en text,
  action_description_ar text,
  action_description_en text,
  scope_level text,
  is_dangerous boolean,
  requires_approval boolean,
  category_id uuid,
  category_key text,
  category_name_ar text,
  category_name_en text
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
    aa.description_ar as action_description_ar,
    aa.description_en as action_description_en,
    aa.scope_level,
    aa.is_dangerous,
    aa.requires_approval,
    ac.id as category_id,
    ac.category_key,
    ac.category_name_ar,
    ac.category_name_en
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE aa.is_active = true
    AND ac.is_active = true
  ORDER BY ac.display_order, aa.display_order;
END;
$$;

-- دالة للحصول على صلاحيات مجموعة معينة
CREATE OR REPLACE FUNCTION get_actions_by_category(p_category_key text)
RETURNS TABLE(
  action_id uuid,
  action_key text,
  action_name_ar text,
  action_name_en text,
  description_ar text,
  description_en text,
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
    aa.action_name_en,
    aa.description_ar,
    aa.description_en,
    aa.scope_level,
    aa.is_dangerous,
    aa.requires_approval
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = p_category_key
    AND aa.is_active = true
    AND ac.is_active = true
  ORDER BY aa.display_order;
END;
$$;
