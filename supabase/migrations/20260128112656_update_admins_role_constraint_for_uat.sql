/*
  # تحديث قيود الأدوار في جدول admins للاختبار
  
  1. التغييرات
    - تحديث قيد valid_role ليشمل جميع الأدوار
    - إضافة الأدوار التشغيلية: worker, supervisor, farm_supervisor
  
  2. الغرض
    - السماح بإنشاء مستخدمين اختبار لجميع الأدوار
    - دعم المرحلة 7: اختبار القبول (UAT)
*/

-- حذف القيد القديم
ALTER TABLE admins DROP CONSTRAINT IF EXISTS valid_role;

-- إضافة قيد جديد يشمل جميع الأدوار
ALTER TABLE admins ADD CONSTRAINT valid_role 
CHECK (role IN (
  'super_admin',
  'farm_manager',
  'farm_supervisor',
  'supervisor',
  'worker',
  'financial_manager',
  'support'
));
