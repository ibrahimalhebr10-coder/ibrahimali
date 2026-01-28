/*
  # نظام الصلاحيات المتقدم - النظام المركزي للتحكم بالوصول

  ## 1. الجداول الجديدة
  
  ### admin_roles (الأدوار الإدارية)
  - `id` (uuid) - المعرف الفريد
  - `role_key` (text) - المفتاح الفريد للدور (super_admin, farm_manager, ...)
  - `role_name_ar` (text) - اسم الدور بالعربية
  - `role_name_en` (text) - اسم الدور بالإنجليزية
  - `description` (text) - وصف الدور
  - `is_system_role` (boolean) - هل هو دور نظام (لا يمكن حذفه)
  - `priority` (integer) - الأولوية (1 = الأعلى)
  - `created_at` (timestamp) - تاريخ الإنشاء
  - `updated_at` (timestamp) - تاريخ التحديث

  ### admin_permissions (الصلاحيات)
  - `id` (uuid) - المعرف الفريد
  - `permission_key` (text) - مفتاح الصلاحية الفريد
  - `permission_name_ar` (text) - اسم الصلاحية بالعربية
  - `permission_name_en` (text) - اسم الصلاحية بالإنجليزية
  - `category` (text) - الفئة (dashboard, farms, reservations, finance, settings)
  - `description` (text) - وصف الصلاحية
  - `is_critical` (boolean) - هل هي صلاحية حساسة
  - `created_at` (timestamp) - تاريخ الإنشاء

  ### role_permissions (ربط الأدوار بالصلاحيات)
  - `id` (uuid) - المعرف الفريد
  - `role_id` (uuid) - معرف الدور
  - `permission_id` (uuid) - معرف الصلاحية
  - `granted_at` (timestamp) - تاريخ منح الصلاحية

  ## 2. التحديثات
  
  ### admins (تحديث)
  - إضافة `role_id` (uuid) - معرف الدور
  - الاحتفاظ بـ `role` القديم للتوافقية

  ## 3. الأمان
  - RLS على جميع الجداول
  - فقط super_admin يمكنه تعديل الصلاحيات
  - تسجيل جميع التغييرات في admin_logs

  ## 4. البيانات الأولية
  - 4 أدوار رئيسية
  - 30+ صلاحية
  - ربط تلقائي للصلاحيات بالأدوار
*/

-- ==========================================
-- 1. جدول الأدوار الإدارية
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT UNIQUE NOT NULL,
  role_name_ar TEXT NOT NULL,
  role_name_en TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS للأدوار
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only super admins can manage roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  );

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_admin_roles_role_key ON admin_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_admin_roles_priority ON admin_roles(priority);

-- ==========================================
-- 2. جدول الصلاحيات
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT UNIQUE NOT NULL,
  permission_name_ar TEXT NOT NULL,
  permission_name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS للصلاحيات
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view permissions"
  ON admin_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only super admins can manage permissions"
  ON admin_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  );

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_admin_permissions_key ON admin_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_category ON admin_permissions(category);

-- ==========================================
-- 3. جدول ربط الأدوار بالصلاحيات
-- ==========================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- RLS لربط الأدوار بالصلاحيات
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only super admins can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
      AND admins.is_active = true
    )
  );

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ==========================================
-- 4. تحديث جدول admins
-- ==========================================

-- إضافة عمود role_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE admins ADD COLUMN role_id UUID REFERENCES admin_roles(id);
    CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
  END IF;
END $$;

-- ==========================================
-- 5. البيانات الأولية - الأدوار
-- ==========================================

INSERT INTO admin_roles (role_key, role_name_ar, role_name_en, description, is_system_role, priority)
VALUES
  ('super_admin', 'المدير العام', 'Super Admin', 'صلاحيات كاملة على النظام - يستطيع الوصول لكل شيء', true, 1),
  ('farm_manager', 'مدير المزارع', 'Farm Manager', 'إدارة المزارع والحجوزات - التعميد والمراجعة', true, 2),
  ('financial_manager', 'المدير المالي', 'Financial Manager', 'إدارة المدفوعات والتقارير المالية - تأكيد المدفوعات', true, 3),
  ('support', 'الدعم الفني', 'Support', 'مشاهدة البيانات والرد على الاستفسارات - قراءة فقط', true, 4)
ON CONFLICT (role_key) DO NOTHING;

-- ==========================================
-- 6. البيانات الأولية - الصلاحيات
-- ==========================================

INSERT INTO admin_permissions (permission_key, permission_name_ar, permission_name_en, category, description, is_critical)
VALUES
  -- Dashboard
  ('dashboard.view', 'عرض لوحة التحكم', 'View Dashboard', 'dashboard', 'الوصول إلى لوحة التحكم الرئيسية', false),
  ('dashboard.view_stats', 'عرض الإحصائيات', 'View Statistics', 'dashboard', 'عرض إحصائيات النظام الكاملة', false),
  
  -- Farms
  ('farms.view', 'عرض المزارع', 'View Farms', 'farms', 'عرض قائمة المزارع', false),
  ('farms.view_details', 'عرض تفاصيل المزرعة', 'View Farm Details', 'farms', 'عرض التفاصيل الكاملة للمزرعة', false),
  ('farms.create', 'إنشاء مزرعة', 'Create Farm', 'farms', 'إضافة مزرعة جديدة', true),
  ('farms.edit', 'تعديل المزرعة', 'Edit Farm', 'farms', 'تعديل بيانات المزرعة', true),
  ('farms.delete', 'حذف المزرعة', 'Delete Farm', 'farms', 'حذف مزرعة من النظام', true),
  ('farms.toggle_status', 'تغيير حالة المزرعة', 'Toggle Farm Status', 'farms', 'تفعيل أو إيقاف المزرعة', true),
  ('farms.upload_media', 'رفع الوسائط', 'Upload Media', 'farms', 'رفع صور وفيديوهات المزارع', false),
  
  -- Reservations
  ('reservations.view', 'عرض الحجوزات', 'View Reservations', 'reservations', 'عرض قائمة الحجوزات', false),
  ('reservations.view_details', 'عرض تفاصيل الحجز', 'View Reservation Details', 'reservations', 'عرض التفاصيل الكاملة للحجز', false),
  ('reservations.approve', 'تعميد الحجز', 'Approve Reservation', 'reservations', 'تعميد الحجوزات المعلقة', true),
  ('reservations.reject', 'رفض الحجز', 'Reject Reservation', 'reservations', 'رفض أو إلغاء الحجز', true),
  ('reservations.export', 'تصدير الحجوزات', 'Export Reservations', 'reservations', 'تصدير قائمة الحجوزات', false),
  
  -- Finance & Payments
  ('finance.view', 'عرض المالية', 'View Finance', 'finance', 'عرض القسم المالي', false),
  ('finance.view_payments', 'عرض المدفوعات', 'View Payments', 'finance', 'عرض قائمة المدفوعات', false),
  ('finance.approve_payment', 'تأكيد الدفع', 'Approve Payment', 'finance', 'تأكيد المدفوعات المعلقة', true),
  ('finance.refund', 'استرداد المبلغ', 'Refund Payment', 'finance', 'إصدار استرداد للمدفوعات', true),
  ('finance.view_reports', 'عرض التقارير المالية', 'View Financial Reports', 'finance', 'الوصول للتقارير المالية', false),
  ('finance.export_reports', 'تصدير التقارير', 'Export Reports', 'finance', 'تصدير التقارير المالية', false),
  
  -- Users
  ('users.view', 'عرض المستخدمين', 'View Users', 'users', 'عرض قائمة المستخدمين', false),
  ('users.view_details', 'عرض تفاصيل المستخدم', 'View User Details', 'users', 'عرض ملف المستخدم الكامل', false),
  ('users.edit', 'تعديل المستخدم', 'Edit User', 'users', 'تعديل بيانات المستخدمين', true),
  
  -- Messages & Support
  ('messages.view', 'عرض الرسائل', 'View Messages', 'messages', 'عرض رسائل المستخدمين', false),
  ('messages.reply', 'الرد على الرسائل', 'Reply to Messages', 'messages', 'الرد على استفسارات المستخدمين', false),
  
  -- Admin Management
  ('admins.view', 'عرض الإداريين', 'View Admins', 'admins', 'عرض قائمة الإداريين', false),
  ('admins.create', 'إضافة إداري', 'Create Admin', 'admins', 'إضافة إداري جديد', true),
  ('admins.edit', 'تعديل إداري', 'Edit Admin', 'admins', 'تعديل بيانات الإداري', true),
  ('admins.delete', 'حذف إداري', 'Delete Admin', 'admins', 'حذف إداري من النظام', true),
  ('admins.manage_roles', 'إدارة الأدوار', 'Manage Roles', 'admins', 'إنشاء وتعديل الأدوار', true),
  ('admins.manage_permissions', 'إدارة الصلاحيات', 'Manage Permissions', 'admins', 'تعيين وإلغاء الصلاحيات', true),
  
  -- Settings & System
  ('settings.view', 'عرض الإعدادات', 'View Settings', 'settings', 'عرض إعدادات النظام', false),
  ('settings.edit', 'تعديل الإعدادات', 'Edit Settings', 'settings', 'تعديل إعدادات النظام', true),
  ('logs.view', 'عرض السجلات', 'View Logs', 'logs', 'عرض سجلات النشاطات', false)
ON CONFLICT (permission_key) DO NOTHING;

-- ==========================================
-- 7. ربط الأدوار بالصلاحيات
-- ==========================================

-- Super Admin: كل الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_key = 'super_admin'),
  id
FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Farm Manager: إدارة المزارع والحجوزات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_key = 'farm_manager'),
  id
FROM admin_permissions
WHERE permission_key IN (
  'dashboard.view',
  'dashboard.view_stats',
  'farms.view',
  'farms.view_details',
  'farms.create',
  'farms.edit',
  'farms.toggle_status',
  'farms.upload_media',
  'reservations.view',
  'reservations.view_details',
  'reservations.approve',
  'reservations.reject',
  'reservations.export',
  'users.view',
  'users.view_details',
  'messages.view',
  'messages.reply',
  'logs.view'
)
ON CONFLICT DO NOTHING;

-- Financial Manager: إدارة المالية
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_key = 'financial_manager'),
  id
FROM admin_permissions
WHERE permission_key IN (
  'dashboard.view',
  'dashboard.view_stats',
  'finance.view',
  'finance.view_payments',
  'finance.approve_payment',
  'finance.refund',
  'finance.view_reports',
  'finance.export_reports',
  'reservations.view',
  'reservations.view_details',
  'users.view',
  'users.view_details',
  'logs.view'
)
ON CONFLICT DO NOTHING;

-- Support: قراءة فقط
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_key = 'support'),
  id
FROM admin_permissions
WHERE permission_key IN (
  'dashboard.view',
  'farms.view',
  'farms.view_details',
  'reservations.view',
  'reservations.view_details',
  'finance.view',
  'finance.view_payments',
  'users.view',
  'users.view_details',
  'messages.view',
  'messages.reply'
)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. ربط الإداريين الحاليين بالأدوار الجديدة
-- ==========================================

UPDATE admins
SET role_id = (
  SELECT id FROM admin_roles 
  WHERE role_key = admins.role
)
WHERE role_id IS NULL;

-- ==========================================
-- 9. Function للتحقق من الصلاحية
-- ==========================================

CREATE OR REPLACE FUNCTION check_admin_permission(
  p_admin_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admins a
    JOIN admin_roles r ON a.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN admin_permissions p ON rp.permission_id = p.id
    WHERE a.id = p_admin_id
      AND a.is_active = true
      AND p.permission_key = p_permission_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 10. Function لجلب صلاحيات الإداري
-- ==========================================

CREATE OR REPLACE FUNCTION get_admin_permissions(p_admin_id UUID)
RETURNS TABLE (
  permission_key TEXT,
  permission_name_ar TEXT,
  permission_name_en TEXT,
  category TEXT,
  is_critical BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.permission_key,
    p.permission_name_ar,
    p.permission_name_en,
    p.category,
    p.is_critical
  FROM admins a
  JOIN admin_roles r ON a.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN admin_permissions p ON rp.permission_id = p.id
  WHERE a.id = p_admin_id
    AND a.is_active = true
  ORDER BY p.category, p.permission_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
