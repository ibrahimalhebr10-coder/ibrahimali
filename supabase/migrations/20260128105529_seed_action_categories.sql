/*
  # إضافة مجموعات الصلاحيات السبعة
  
  ## المجموعات:
    1. التشغيل (Operations)
    2. المهام (Tasks)
    3. الصيانة (Maintenance)
    4. المعدات (Equipment)
    5. المالية التشغيلية (Operational Finance)
    6. المراسلة (Messaging)
    7. الإشراف (Supervision)
*/

-- إضافة مجموعات الصلاحيات
INSERT INTO action_categories (
  category_key,
  category_name_ar,
  category_name_en,
  description_ar,
  description_en,
  icon,
  display_order,
  is_active
) VALUES
  (
    'operations',
    'التشغيل',
    'Operations',
    'صلاحيات متعلقة بتشغيل المزرعة اليومي',
    'Permissions related to daily farm operations',
    'Settings',
    1,
    true
  ),
  (
    'tasks',
    'المهام',
    'Tasks',
    'صلاحيات إدارة وتنفيذ المهام',
    'Permissions for managing and executing tasks',
    'CheckSquare',
    2,
    true
  ),
  (
    'maintenance',
    'الصيانة',
    'Maintenance',
    'صلاحيات الصيانة الدورية والطارئة',
    'Permissions for routine and emergency maintenance',
    'Wrench',
    3,
    true
  ),
  (
    'equipment',
    'المعدات',
    'Equipment',
    'صلاحيات إدارة المعدات والأدوات',
    'Permissions for managing equipment and tools',
    'Truck',
    4,
    true
  ),
  (
    'operational_finance',
    'المالية التشغيلية',
    'Operational Finance',
    'صلاحيات المصروفات والمشتريات التشغيلية',
    'Permissions for operational expenses and purchases',
    'DollarSign',
    5,
    true
  ),
  (
    'messaging',
    'المراسلة',
    'Messaging',
    'صلاحيات التواصل مع المستثمرين',
    'Permissions for communicating with investors',
    'MessageSquare',
    6,
    true
  ),
  (
    'supervision',
    'الإشراف',
    'Supervision',
    'صلاحيات الإشراف والمراقبة',
    'Permissions for supervision and monitoring',
    'Eye',
    7,
    true
  )
ON CONFLICT (category_key) DO UPDATE
SET
  category_name_ar = EXCLUDED.category_name_ar,
  category_name_en = EXCLUDED.category_name_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;
