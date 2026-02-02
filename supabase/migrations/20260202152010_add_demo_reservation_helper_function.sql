/*
  # إضافة دالة لإنشاء حجوزات تجريبية

  1. الغرض
    - تسهيل إنشاء حجوزات تجريبية من لوحة الإدارة
    - الحجوزات التجريبية لا تُفعل حساب المستخدم
    - للاختبار والتدريب فقط

  2. الاستخدام
    ```sql
    SELECT create_demo_reservation(
      p_user_id := 'uuid-here',
      p_farm_id := 'uuid-here',
      p_total_trees := 10,
      p_total_price := 5000
    );
    ```

  3. الملاحظات
    - جميع الحجوزات المُنشأة بهذه الدالة تكون is_demo = true
    - لا تُحسب في الإحصائيات
    - لا تُفعل الحساب الاستثماري
*/

-- إنشاء دالة لإنشاء حجوزات تجريبية
CREATE OR REPLACE FUNCTION create_demo_reservation(
  p_user_id uuid,
  p_farm_id uuid,
  p_total_trees integer DEFAULT 10,
  p_total_price decimal DEFAULT 1000
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id uuid;
  v_farm_name text;
BEGIN
  -- الحصول على اسم المزرعة
  SELECT name_ar INTO v_farm_name
  FROM farms
  WHERE id = p_farm_id;

  IF v_farm_name IS NULL THEN
    RAISE EXCEPTION 'المزرعة غير موجودة';
  END IF;

  -- إنشاء الحجز التجريبي
  INSERT INTO reservations (
    user_id,
    farm_id,
    farm_name,
    total_trees,
    total_price,
    tree_types,
    duration_years,
    bonus_years,
    status,
    is_demo
  ) VALUES (
    p_user_id,
    p_farm_id,
    v_farm_name,
    p_total_trees,
    p_total_price,
    'أشجار تجريبية',
    1,
    0,
    'pending',
    true
  )
  RETURNING id INTO v_reservation_id;

  -- إضافة سجل في admin_logs
  INSERT INTO admin_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'create_demo_reservation',
    jsonb_build_object(
      'reservation_id', v_reservation_id,
      'user_id', p_user_id,
      'farm_id', p_farm_id,
      'total_trees', p_total_trees,
      'total_price', p_total_price,
      'is_demo', true
    ),
    inet_client_addr()
  );

  RETURN v_reservation_id;
END;
$$;

-- إضافة تعليق على الدالة
COMMENT ON FUNCTION create_demo_reservation IS 'إنشاء حجز تجريبي للاختبار - لا يُفعل الحساب الاستثماري';

-- منح صلاحيات التنفيذ للمسؤولين
GRANT EXECUTE ON FUNCTION create_demo_reservation TO authenticated;
