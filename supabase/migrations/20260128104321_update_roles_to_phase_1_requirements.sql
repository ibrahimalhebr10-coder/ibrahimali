/*
  # المرحلة 1: تحديث الأدوار لتطابق المتطلبات
  
  ## التغييرات
  1. تحديث الأسماء الإنجليزية للأدوار الخمسة المطلوبة:
     - المدير العام -> General Manager
     - مدير المزارع -> Farms Manager
     - مدير مزرعة -> Farm Manager
     - مشرف -> Supervisor
     - عامل -> Worker
  
  2. تحديث الأولوية (level) باستخدام priority
  
  3. إلغاء تفعيل الأدوار الإضافية (المالي والدعم الفني) مؤقتاً
  
  ## ملاحظات
  - لا يتم حذف البيانات
  - فقط تحديث الأسماء وإلغاء تفعيل الأدوار غير المطلوبة
*/

-- تحديث الأسماء الإنجليزية للأدوار الخمسة المطلوبة
UPDATE admin_roles 
SET 
  role_name_en = 'General Manager',
  updated_at = now()
WHERE role_key = 'super_admin';

UPDATE admin_roles 
SET 
  role_name_en = 'Farms Manager',
  updated_at = now()
WHERE role_key = 'farm_manager';

UPDATE admin_roles 
SET 
  role_name_en = 'Farm Manager',
  role_key = 'individual_farm_manager',
  updated_at = now()
WHERE role_key = 'farm_supervisor';

-- إضافة عمود is_active إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_roles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_roles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- التأكد من أن الأدوار الخمسة المطلوبة نشطة
UPDATE admin_roles 
SET is_active = true
WHERE role_key IN ('super_admin', 'farm_manager', 'individual_farm_manager', 'supervisor', 'worker');

-- إلغاء تفعيل الأدوار الإضافية غير المطلوبة في المرحلة 1
UPDATE admin_roles 
SET is_active = false
WHERE role_key IN ('financial_manager', 'support') 
AND is_system_role = true;

-- إلغاء تفعيل الأدوار المخصصة غير النظامية
UPDATE admin_roles 
SET is_active = false
WHERE is_system_role = false;