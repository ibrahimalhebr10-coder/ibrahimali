/*
  # إضافة صلاحيات الصيانة والمعدات
  
  ## 1. صلاحيات الصيانة (Maintenance)
    - عرض جدول الصيانة
    - جدولة صيانة دورية
    - تسجيل صيانة طارئة
    - تحديث حالة الصيانة
    - الموافقة على الصيانة
  
  ## 2. صلاحيات المعدات (Equipment)
    - عرض المعدات
    - إضافة معدات
    - تحديث معلومات المعدات
    - تسجيل استخدام المعدات
    - نقل معدات
    - إيقاف تشغيل معدات
*/

DO $$
DECLARE
  v_maintenance_id uuid;
  v_equipment_id uuid;
BEGIN
  -- الحصول على معرفات المجموعات
  SELECT id INTO v_maintenance_id
  FROM action_categories
  WHERE category_key = 'maintenance';
  
  SELECT id INTO v_equipment_id
  FROM action_categories
  WHERE category_key = 'equipment';

  -- صلاحيات الصيانة
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
      v_maintenance_id,
      'maintenance.view',
      'عرض جدول الصيانة',
      'View Maintenance Schedule',
      'عرض جدول الصيانة الدورية والطارئة',
      'View routine and emergency maintenance schedule',
      'farm',
      false,
      false,
      1
    ),
    (
      v_maintenance_id,
      'maintenance.schedule',
      'جدولة صيانة دورية',
      'Schedule Routine Maintenance',
      'جدولة أعمال الصيانة الدورية المخططة',
      'Schedule planned routine maintenance work',
      'farm',
      false,
      false,
      2
    ),
    (
      v_maintenance_id,
      'maintenance.emergency',
      'تسجيل صيانة طارئة',
      'Log Emergency Maintenance',
      'تسجيل أعمال الصيانة الطارئة غير المخططة',
      'Log unplanned emergency maintenance work',
      'farm',
      false,
      false,
      3
    ),
    (
      v_maintenance_id,
      'maintenance.update',
      'تحديث حالة الصيانة',
      'Update Maintenance Status',
      'تحديث حالة أعمال الصيانة الجارية',
      'Update status of ongoing maintenance work',
      'farm',
      false,
      false,
      4
    ),
    (
      v_maintenance_id,
      'maintenance.complete',
      'إكمال صيانة',
      'Complete Maintenance',
      'وضع علامة إكمال على أعمال الصيانة',
      'Mark maintenance work as complete',
      'farm',
      false,
      false,
      5
    ),
    (
      v_maintenance_id,
      'maintenance.approve',
      'الموافقة على الصيانة',
      'Approve Maintenance',
      'الموافقة على أعمال الصيانة المكتملة',
      'Approve completed maintenance work',
      'farm',
      false,
      true,
      6
    ),
    (
      v_maintenance_id,
      'maintenance.cancel',
      'إلغاء صيانة',
      'Cancel Maintenance',
      'إلغاء أعمال صيانة مجدولة',
      'Cancel scheduled maintenance work',
      'farm',
      false,
      false,
      7
    )
  ON CONFLICT (action_key) DO UPDATE
  SET
    action_name_ar = EXCLUDED.action_name_ar,
    action_name_en = EXCLUDED.action_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;

  -- صلاحيات المعدات
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
      v_equipment_id,
      'equipment.view',
      'عرض المعدات',
      'View Equipment',
      'عرض قائمة المعدات والأدوات المتاحة',
      'View list of available equipment and tools',
      'farm',
      false,
      false,
      1
    ),
    (
      v_equipment_id,
      'equipment.add',
      'إضافة معدات',
      'Add Equipment',
      'إضافة معدات وأدوات جديدة للمزرعة',
      'Add new equipment and tools to the farm',
      'farm',
      false,
      false,
      2
    ),
    (
      v_equipment_id,
      'equipment.update',
      'تحديث معلومات المعدات',
      'Update Equipment Info',
      'تحديث بيانات ومعلومات المعدات',
      'Update equipment data and information',
      'farm',
      false,
      false,
      3
    ),
    (
      v_equipment_id,
      'equipment.log_usage',
      'تسجيل استخدام المعدات',
      'Log Equipment Usage',
      'تسجيل ساعات وأوقات استخدام المعدات',
      'Log equipment usage hours and times',
      'farm',
      false,
      false,
      4
    ),
    (
      v_equipment_id,
      'equipment.transfer',
      'نقل معدات',
      'Transfer Equipment',
      'نقل معدات بين المواقع أو المزارع',
      'Transfer equipment between locations or farms',
      'farm',
      false,
      true,
      5
    ),
    (
      v_equipment_id,
      'equipment.deactivate',
      'إيقاف تشغيل معدات',
      'Deactivate Equipment',
      'إيقاف تشغيل معدات معطلة أو قديمة',
      'Deactivate broken or old equipment',
      'farm',
      false,
      true,
      6
    ),
    (
      v_equipment_id,
      'equipment.delete',
      'حذف معدات',
      'Delete Equipment',
      'حذف معدات نهائياً من النظام',
      'Permanently delete equipment from the system',
      'farm',
      true,
      true,
      7
    )
  ON CONFLICT (action_key) DO UPDATE
  SET
    action_name_ar = EXCLUDED.action_name_ar,
    action_name_en = EXCLUDED.action_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;
END $$;
