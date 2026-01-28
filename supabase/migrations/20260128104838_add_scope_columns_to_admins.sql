/*
  # إضافة حقول النطاق لجدول admins
  
  ## الحقول الجديدة
    - scope_type (text) - نوع النطاق
    - scope_value (jsonb) - قيمة النطاق
*/

-- إضافة حقول النطاق
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS scope_type text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS scope_value jsonb DEFAULT NULL;

-- إضافة قيد على scope_type
ALTER TABLE admins
DROP CONSTRAINT IF EXISTS admins_scope_type_check;

ALTER TABLE admins
ADD CONSTRAINT admins_scope_type_check 
CHECK (scope_type IN ('all', 'farms', 'farm', 'tasks'));

-- إنشاء index
CREATE INDEX IF NOT EXISTS idx_admins_scope_type 
ON admins(scope_type);

-- تحديث المديرين الحاليين
UPDATE admins
SET scope_type = 'all', scope_value = NULL
WHERE scope_type IS NULL OR scope_type = '';
