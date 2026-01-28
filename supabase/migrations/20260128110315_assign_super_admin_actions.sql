/*
  # تعيين صلاحيات المدير العام (Super Admin)
  
  ## الصلاحيات المعينة:
    - جميع الصلاحيات في النظام (49 صلاحية)
    - تعطيل `messaging.send` افتراضياً (يمكن تفعيلها لاحقاً)
  
  ## المنطق:
    1. الحصول على معرف دور المدير العام
    2. إضافة جميع الصلاحيات
    3. تعطيل صلاحية الإرسال المباشر للرسائل
*/

DO $$
DECLARE
  v_super_admin_role_id uuid;
BEGIN
  -- الحصول على معرف دور المدير العام
  SELECT id INTO v_super_admin_role_id
  FROM admin_roles
  WHERE role_key = 'super_admin';
  
  -- إضافة جميع الصلاحيات للمدير العام
  INSERT INTO role_actions (role_id, action_id, is_enabled)
  SELECT 
    v_super_admin_role_id,
    aa.id,
    CASE 
      WHEN aa.action_key = 'messaging.send' THEN false
      ELSE true
    END as is_enabled
  FROM admin_actions aa
  WHERE aa.is_active = true
  ON CONFLICT (role_id, action_id) DO UPDATE
  SET 
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();
  
  RAISE NOTICE 'تم تعيين جميع الصلاحيات للمدير العام (مع تعطيل messaging.send)';
END $$;
