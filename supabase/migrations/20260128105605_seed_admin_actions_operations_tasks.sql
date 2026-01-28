/*
  # إضافة صلاحيات التشغيل والمهام
  
  ## 1. صلاحيات التشغيل (Operations)
    - عرض حالة التشغيل
    - تحديث حالة التشغيل
    - بدء موسم جديد
    - إغلاق موسم
    - تسجيل العمليات اليومية
  
  ## 2. صلاحيات المهام (Tasks)
    - عرض المهام
    - إنشاء مهام
    - تعيين مهام
    - تحديث حالة المهام
    - إلغاء مهام
    - الموافقة على إكمال المهام
*/

-- الحصول على معرفات المجموعات
DO $$
DECLARE
  v_operations_id uuid;
  v_tasks_id uuid;
BEGIN
  -- الحصول على معرف مجموعة التشغيل
  SELECT id INTO v_operations_id
  FROM action_categories
  WHERE category_key = 'operations';
  
  -- الحصول على معرف مجموعة المهام
  SELECT id INTO v_tasks_id
  FROM action_categories
  WHERE category_key = 'tasks';

  -- صلاحيات التشغيل
  INSERT INTO admin_actions (
    category_id,
    action_key,
    action_name_ar,
    action_name_en,
    description_ar,
    description_en,
    scope_level,
    is_dangerous,
    requires_approval,
    display_order
  ) VALUES
    (
      v_operations_id,
      'operations.view',
      'عرض حالة التشغيل',
      'View Operations Status',
      'القدرة على عرض حالة تشغيل المزرعة الحالية',
      'Ability to view current farm operation status',
      'farm',
      false,
      false,
      1
    ),
    (
      v_operations_id,
      'operations.update',
      'تحديث حالة التشغيل',
      'Update Operations Status',
      'تحديث حالة العمليات التشغيلية اليومية',
      'Update daily operational status',
      'farm',
      false,
      false,
      2
    ),
    (
      v_operations_id,
      'operations.start_season',
      'بدء موسم جديد',
      'Start New Season',
      'بدء موسم زراعي جديد للمزرعة',
      'Start a new agricultural season for the farm',
      'farm',
      true,
      true,
      3
    ),
    (
      v_operations_id,
      'operations.close_season',
      'إغلاق موسم',
      'Close Season',
      'إغلاق الموسم الزراعي الحالي',
      'Close the current agricultural season',
      'farm',
      true,
      true,
      4
    ),
    (
      v_operations_id,
      'operations.log_daily',
      'تسجيل العمليات اليومية',
      'Log Daily Operations',
      'تسجيل الأنشطة والعمليات اليومية',
      'Log daily activities and operations',
      'farm',
      false,
      false,
      5
    ),
    (
      v_operations_id,
      'operations.view_reports',
      'عرض التقارير التشغيلية',
      'View Operational Reports',
      'الوصول إلى التقارير التشغيلية والإحصائيات',
      'Access operational reports and statistics',
      'farm',
      false,
      false,
      6
    )
  ON CONFLICT (action_key) DO UPDATE
  SET
    action_name_ar = EXCLUDED.action_name_ar,
    action_name_en = EXCLUDED.action_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;

  -- صلاحيات المهام
  INSERT INTO admin_actions (
    category_id,
    action_key,
    action_name_ar,
    action_name_en,
    description_ar,
    description_en,
    scope_level,
    is_dangerous,
    requires_approval,
    display_order
  ) VALUES
    (
      v_tasks_id,
      'tasks.view',
      'عرض المهام',
      'View Tasks',
      'القدرة على عرض المهام المسندة والمتاحة',
      'Ability to view assigned and available tasks',
      'farm',
      false,
      false,
      1
    ),
    (
      v_tasks_id,
      'tasks.view_own',
      'عرض المهام الخاصة',
      'View Own Tasks',
      'عرض المهام المسندة للمستخدم فقط',
      'View only tasks assigned to the user',
      'own',
      false,
      false,
      2
    ),
    (
      v_tasks_id,
      'tasks.create',
      'إنشاء مهام',
      'Create Tasks',
      'إنشاء مهام جديدة وتعيينها',
      'Create new tasks and assign them',
      'farm',
      false,
      false,
      3
    ),
    (
      v_tasks_id,
      'tasks.assign',
      'تعيين مهام',
      'Assign Tasks',
      'تعيين المهام للعاملين والمشرفين',
      'Assign tasks to workers and supervisors',
      'farm',
      false,
      false,
      4
    ),
    (
      v_tasks_id,
      'tasks.update',
      'تحديث حالة المهام',
      'Update Task Status',
      'تحديث حالة تنفيذ المهام',
      'Update task execution status',
      'task',
      false,
      false,
      5
    ),
    (
      v_tasks_id,
      'tasks.complete',
      'إكمال مهام',
      'Complete Tasks',
      'وضع علامة إكمال على المهام المسندة',
      'Mark assigned tasks as complete',
      'own',
      false,
      false,
      6
    ),
    (
      v_tasks_id,
      'tasks.approve',
      'الموافقة على إكمال المهام',
      'Approve Task Completion',
      'الموافقة على المهام المكتملة من قبل العاملين',
      'Approve tasks completed by workers',
      'farm',
      false,
      false,
      7
    ),
    (
      v_tasks_id,
      'tasks.cancel',
      'إلغاء مهام',
      'Cancel Tasks',
      'إلغاء المهام غير المكتملة',
      'Cancel uncompleted tasks',
      'farm',
      false,
      false,
      8
    ),
    (
      v_tasks_id,
      'tasks.delete',
      'حذف مهام',
      'Delete Tasks',
      'حذف المهام نهائياً من النظام',
      'Permanently delete tasks from the system',
      'farm',
      true,
      true,
      9
    )
  ON CONFLICT (action_key) DO UPDATE
  SET
    action_name_ar = EXCLUDED.action_name_ar,
    action_name_en = EXCLUDED.action_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;
END $$;
