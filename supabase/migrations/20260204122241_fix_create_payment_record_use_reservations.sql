/*
  # إصلاح دالة create_maintenance_payment_record لاستخدام جدول reservations

  1. التغييرات
    - تحديث `create_maintenance_payment_record()` لاستخدام جدول `reservations`
    - إزالة الاعتماد على `agricultural_tree_inventory` و `investment_assets`
    - حساب عدد الأشجار من الحجوزات النشطة

  2. الهدف
    - إصلاح خطأ "column user_id does not exist"
    - جعل الدالة تعمل مع البنية الحالية للقاعدة
*/

-- إصلاح دالة create_maintenance_payment_record لاستخدام reservations
CREATE OR REPLACE FUNCTION create_maintenance_payment_record(
  p_maintenance_fee_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trees_count integer;
  v_cost_per_tree decimal(10,2);
  v_total_amount decimal(10,2);
  v_payment_id uuid;
  v_farm_id uuid;
  v_existing_payment uuid;
BEGIN
  -- التحقق من عدم وجود دفع سابق مكتمل
  SELECT id INTO v_existing_payment
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND user_id = p_user_id
    AND payment_status = 'paid';

  IF v_existing_payment IS NOT NULL THEN
    RAISE EXCEPTION 'تم سداد رسوم هذه الصيانة مسبقاً';
  END IF;

  -- الحصول على معلومات رسوم الصيانة
  SELECT cost_per_tree, farm_id
  INTO v_cost_per_tree, v_farm_id
  FROM maintenance_fees
  WHERE id = p_maintenance_fee_id;

  IF v_cost_per_tree IS NULL THEN
    RAISE EXCEPTION 'سجل الصيانة غير موجود';
  END IF;

  -- حساب عدد الأشجار من الحجوزات النشطة للمستخدم في هذه المزرعة
  SELECT COALESCE(SUM(total_trees), 0) INTO v_trees_count
  FROM reservations
  WHERE user_id = p_user_id
    AND farm_id = v_farm_id
    AND status IN ('confirmed', 'active');

  IF v_trees_count IS NULL OR v_trees_count = 0 THEN
    RAISE EXCEPTION 'لا توجد أشجار مسجلة للمستخدم في هذه المزرعة';
  END IF;

  -- حساب المبلغ الإجمالي
  v_total_amount := v_trees_count * v_cost_per_tree;

  -- إنشاء سجل دفع جديد
  INSERT INTO maintenance_payments (
    user_id,
    maintenance_fee_id,
    farm_id,
    tree_count,
    amount_due,
    amount_paid,
    payment_status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_maintenance_fee_id,
    v_farm_id,
    v_trees_count,
    v_total_amount,
    NULL,
    'pending',
    now(),
    now()
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'trees_count', v_trees_count,
    'cost_per_tree', v_cost_per_tree,
    'total_amount', v_total_amount
  );
END;
$$;

-- إصلاح دالة get_maintenance_payment_stats لاستخدام reservations
CREATE OR REPLACE FUNCTION get_maintenance_payment_stats(
  p_maintenance_fee_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_clients integer;
  v_paid_count integer;
  v_unpaid_count integer;
  v_total_amount decimal(10,2);
  v_paid_amount decimal(10,2);
  v_remaining_amount decimal(10,2);
  v_pending_count integer;
  v_farm_id uuid;
  v_cost_per_tree decimal(10,2);
BEGIN
  -- الحصول على معلومات رسوم الصيانة
  SELECT farm_id, cost_per_tree
  INTO v_farm_id, v_cost_per_tree
  FROM maintenance_fees
  WHERE id = p_maintenance_fee_id;

  -- حساب إجمالي العملاء (الذين لديهم حجوزات نشطة في المزرعة)
  SELECT COUNT(DISTINCT user_id) INTO v_total_clients
  FROM reservations
  WHERE farm_id = v_farm_id
    AND status IN ('confirmed', 'active');

  -- حساب عدد المسددين
  SELECT COUNT(DISTINCT user_id) INTO v_paid_count
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND payment_status = 'paid';

  -- حساب عدد الدفعات المعلقة
  SELECT COUNT(DISTINCT user_id) INTO v_pending_count
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND payment_status = 'pending';

  -- حساب عدد غير المسددين
  v_unpaid_count := v_total_clients - COALESCE(v_paid_count, 0);

  -- حساب المبلغ المسدد
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_paid_amount
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND payment_status = 'paid';

  -- حساب المبلغ الإجمالي المتوقع
  WITH client_trees AS (
    SELECT user_id, COALESCE(SUM(total_trees), 0) as trees
    FROM reservations
    WHERE farm_id = v_farm_id
      AND status IN ('confirmed', 'active')
    GROUP BY user_id
  )
  SELECT COALESCE(SUM(trees * v_cost_per_tree), 0) INTO v_total_amount
  FROM client_trees;

  -- حساب المبلغ المتبقي
  v_remaining_amount := v_total_amount - v_paid_amount;

  RETURN jsonb_build_object(
    'total_clients', v_total_clients,
    'paid_count', COALESCE(v_paid_count, 0),
    'pending_count', COALESCE(v_pending_count, 0),
    'unpaid_count', v_unpaid_count,
    'total_amount', v_total_amount,
    'paid_amount', v_paid_amount,
    'remaining_amount', v_remaining_amount,
    'payment_percentage',
      CASE
        WHEN v_total_clients > 0 THEN ROUND((COALESCE(v_paid_count, 0)::decimal / v_total_clients) * 100, 2)
        ELSE 0
      END,
    'collection_percentage',
      CASE
        WHEN v_total_amount > 0 THEN ROUND((v_paid_amount / v_total_amount) * 100, 2)
        ELSE 0
      END
  );
END;
$$;