/*
  # إضافة صلاحيات المالية والمراسلة والإشراف
  
  ## 1. صلاحيات المالية التشغيلية (Operational Finance)
    - عرض المصروفات
    - تسجيل مصروفات
    - الموافقة على مصروفات
    - عرض الفواتير
    - إضافة فواتير
  
  ## 2. صلاحيات المراسلة (Messaging)
    - عرض الرسائل
    - إنشاء رسائل
    - إرسال رسائل
    - حذف رسائل
  
  ## 3. صلاحيات الإشراف (Supervision)
    - عرض لوحة الإشراف
    - مراقبة الأداء
    - مراجعة العمليات
    - إنشاء تقارير
    - الموافقة على العمليات الحرجة
*/

DO $$
DECLARE
  v_finance_id uuid;
  v_messaging_id uuid;
  v_supervision_id uuid;
BEGIN
  -- الحصول على معرفات المجموعات
  SELECT id INTO v_finance_id
  FROM action_categories
  WHERE category_key = 'operational_finance';
  
  SELECT id INTO v_messaging_id
  FROM action_categories
  WHERE category_key = 'messaging';
  
  SELECT id INTO v_supervision_id
  FROM action_categories
  WHERE category_key = 'supervision';

  -- صلاحيات المالية التشغيلية
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
      v_finance_id,
      'finance.view_expenses',
      'عرض المصروفات',
      'View Expenses',
      'عرض المصروفات التشغيلية للمزرعة',
      'View operational expenses for the farm',
      'farm',
      false,
      false,
      1
    ),
    (
      v_finance_id,
      'finance.record_expense',
      'تسجيل مصروفات',
      'Record Expenses',
      'تسجيل مصروفات تشغيلية جديدة',
      'Record new operational expenses',
      'farm',
      false,
      false,
      2
    ),
    (
      v_finance_id,
      'finance.approve_expense',
      'الموافقة على مصروفات',
      'Approve Expenses',
      'الموافقة على المصروفات المسجلة',
      'Approve recorded expenses',
      'farm',
      false,
      true,
      3
    ),
    (
      v_finance_id,
      'finance.view_invoices',
      'عرض الفواتير',
      'View Invoices',
      'عرض فواتير الموردين والمشتريات',
      'View supplier and purchase invoices',
      'farm',
      false,
      false,
      4
    ),
    (
      v_finance_id,
      'finance.add_invoice',
      'إضافة فواتير',
      'Add Invoices',
      'إضافة فواتير جديدة للنظام',
      'Add new invoices to the system',
      'farm',
      false,
      false,
      5
    ),
    (
      v_finance_id,
      'finance.request_payment',
      'طلب صرف مالي',
      'Request Payment',
      'طلب صرف مبالغ مالية للمصروفات',
      'Request payment disbursement for expenses',
      'farm',
      false,
      false,
      6
    ),
    (
      v_finance_id,
      'finance.view_reports',
      'عرض التقارير المالية',
      'View Financial Reports',
      'الوصول إلى التقارير المالية التشغيلية',
      'Access operational financial reports',
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

  -- صلاحيات المراسلة
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
      v_messaging_id,
      'messaging.view',
      'عرض الرسائل',
      'View Messages',
      'عرض رسائل المستثمرين والمراسلات',
      'View investor messages and correspondence',
      'farm',
      false,
      false,
      1
    ),
    (
      v_messaging_id,
      'messaging.create',
      'إنشاء رسائل',
      'Create Messages',
      'إنشاء رسائل جديدة للمستثمرين',
      'Create new messages for investors',
      'farm',
      false,
      false,
      2
    ),
    (
      v_messaging_id,
      'messaging.send',
      'إرسال رسائل',
      'Send Messages',
      'إرسال الرسائل للمستثمرين',
      'Send messages to investors',
      'farm',
      false,
      true,
      3
    ),
    (
      v_messaging_id,
      'messaging.reply',
      'الرد على رسائل',
      'Reply to Messages',
      'الرد على استفسارات المستثمرين',
      'Reply to investor inquiries',
      'farm',
      false,
      false,
      4
    ),
    (
      v_messaging_id,
      'messaging.attach_files',
      'إرفاق ملفات',
      'Attach Files',
      'إرفاق ملفات وصور مع الرسائل',
      'Attach files and images with messages',
      'farm',
      false,
      false,
      5
    ),
    (
      v_messaging_id,
      'messaging.delete',
      'حذف رسائل',
      'Delete Messages',
      'حذف رسائل من النظام',
      'Delete messages from the system',
      'farm',
      true,
      true,
      6
    )
  ON CONFLICT (action_key) DO UPDATE
  SET
    action_name_ar = EXCLUDED.action_name_ar,
    action_name_en = EXCLUDED.action_name_en,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en;

  -- صلاحيات الإشراف
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
      v_supervision_id,
      'supervision.view_dashboard',
      'عرض لوحة الإشراف',
      'View Supervision Dashboard',
      'الوصول إلى لوحة الإشراف الشاملة',
      'Access comprehensive supervision dashboard',
      'farm',
      false,
      false,
      1
    ),
    (
      v_supervision_id,
      'supervision.monitor_performance',
      'مراقبة الأداء',
      'Monitor Performance',
      'مراقبة أداء العمليات والعاملين',
      'Monitor operations and staff performance',
      'farm',
      false,
      false,
      2
    ),
    (
      v_supervision_id,
      'supervision.review_operations',
      'مراجعة العمليات',
      'Review Operations',
      'مراجعة والتحقق من العمليات المنفذة',
      'Review and verify executed operations',
      'farm',
      false,
      false,
      3
    ),
    (
      v_supervision_id,
      'supervision.create_reports',
      'إنشاء تقارير',
      'Create Reports',
      'إنشاء تقارير إشرافية مفصلة',
      'Create detailed supervision reports',
      'farm',
      false,
      false,
      4
    ),
    (
      v_supervision_id,
      'supervision.approve_critical',
      'الموافقة على العمليات الحرجة',
      'Approve Critical Operations',
      'الموافقة على العمليات والقرارات الحرجة',
      'Approve critical operations and decisions',
      'farm',
      true,
      true,
      5
    ),
    (
      v_supervision_id,
      'supervision.view_logs',
      'عرض سجلات النشاط',
      'View Activity Logs',
      'عرض سجلات نشاط المديرين والعاملين',
      'View activity logs of administrators and staff',
      'farm',
      false,
      false,
      6
    ),
    (
      v_supervision_id,
      'supervision.manage_alerts',
      'إدارة التنبيهات',
      'Manage Alerts',
      'إدارة تنبيهات النظام والإشعارات',
      'Manage system alerts and notifications',
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
END $$;
