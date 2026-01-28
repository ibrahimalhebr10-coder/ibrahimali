/*
  # تعيين صلاحيات جميع الأدوار (إصدار محدث)
  
  ## ملاحظة: استخدام الأدوار الموجودة
    - super_admin → المدير العام ✓
    - farm_manager → مدير المزارع
    - farm_supervisor → مدير مزرعة
    - supervisor → مشرف
    - worker → عامل
  
  ## 1. مدير المزارع (farm_manager)
    - عرض التشغيل: operations.view, operations.view_reports
    - إدارة الصيانة: جميع صلاحيات maintenance (7 صلاحيات)
    - الاطلاع على المراسلات: messaging.view
  
  ## 2. مدير مزرعة (farm_supervisor)
    - إدارة التشغيل: جميع صلاحيات operations (6 صلاحيات)
    - إدارة المهام: جميع صلاحيات tasks (9 صلاحيات)
    - إرسال مراسلات للمستثمرين: جميع صلاحيات messaging (6 صلاحيات)
  
  ## 3. مشرف (supervisor)
    - إدارة المهام فقط: tasks.* (9 صلاحيات)
    - بدون مراسلة أو مالية
  
  ## 4. عامل (worker)
    - عرض المهام المكلف بها: tasks.view_own
    - إغلاق مهامه فقط: tasks.complete
*/

DO $$
DECLARE
  v_farms_manager_role_id uuid;
  v_farm_supervisor_role_id uuid;
  v_supervisor_role_id uuid;
  v_worker_role_id uuid;
BEGIN
  -- الحصول على معرفات الأدوار
  SELECT id INTO v_farms_manager_role_id
  FROM admin_roles WHERE role_key = 'farm_manager';
  
  SELECT id INTO v_farm_supervisor_role_id
  FROM admin_roles WHERE role_key = 'farm_supervisor';
  
  SELECT id INTO v_supervisor_role_id
  FROM admin_roles WHERE role_key = 'supervisor';
  
  SELECT id INTO v_worker_role_id
  FROM admin_roles WHERE role_key = 'worker';

  -- التحقق من وجود الأدوار
  IF v_farms_manager_role_id IS NULL THEN
    RAISE EXCEPTION 'دور farm_manager غير موجود';
  END IF;
  
  IF v_farm_supervisor_role_id IS NULL THEN
    RAISE EXCEPTION 'دور farm_supervisor غير موجود';
  END IF;
  
  IF v_supervisor_role_id IS NULL THEN
    RAISE EXCEPTION 'دور supervisor غير موجود';
  END IF;
  
  IF v_worker_role_id IS NULL THEN
    RAISE EXCEPTION 'دور worker غير موجود';
  END IF;

  -- ============================================
  -- 1. مدير المزارع (farm_manager)
  -- ============================================
  
  -- عرض التشغيل
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farms_manager_role_id, aa.id, true
  FROM admin_actions aa
  WHERE aa.action_key IN (
    'operations.view',
    'operations.view_reports'
  )
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  -- جميع صلاحيات الصيانة
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farms_manager_role_id, aa.id, true
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = 'maintenance'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  -- الاطلاع على المراسلات
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farms_manager_role_id, aa.id, true
  FROM admin_actions aa
  WHERE aa.action_key = 'messaging.view'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  RAISE NOTICE 'تم تعيين صلاحيات مدير المزارع';

  -- ============================================
  -- 2. مدير مزرعة (farm_supervisor)
  -- ============================================
  
  -- جميع صلاحيات التشغيل
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farm_supervisor_role_id, aa.id, true
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = 'operations'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  -- جميع صلاحيات المهام
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farm_supervisor_role_id, aa.id, true
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = 'tasks'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  -- جميع صلاحيات المراسلة
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_farm_supervisor_role_id, aa.id, true
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = 'messaging'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  RAISE NOTICE 'تم تعيين صلاحيات مدير مزرعة';

  -- ============================================
  -- 3. مشرف (supervisor)
  -- ============================================
  
  -- جميع صلاحيات المهام فقط
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_supervisor_role_id, aa.id, true
  FROM admin_actions aa
  JOIN action_categories ac ON ac.id = aa.category_id
  WHERE ac.category_key = 'tasks'
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  RAISE NOTICE 'تم تعيين صلاحيات المشرف';

  -- ============================================
  -- 4. عامل (worker)
  -- ============================================
  
  -- عرض المهام الخاصة وإغلاقها فقط
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT v_worker_role_id, aa.id, true
  FROM admin_actions aa
  WHERE aa.action_key IN (
    'tasks.view_own',
    'tasks.complete'
  )
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = now();
  
  RAISE NOTICE 'تم تعيين صلاحيات العامل';

END $$;
