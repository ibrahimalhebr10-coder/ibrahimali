/*
  # دوال نظام دفع رسوم الصيانة

  1. الدوال الجديدة
    - `create_maintenance_payment_record()` - إنشاء سجل دفع
    - `check_maintenance_payment_status()` - التحقق من حالة الدفع
    - `complete_maintenance_payment()` - إتمام الدفع
    - `get_maintenance_payment_stats()` - إحصائيات السداد

  2. التحديثات
    - إضافة حقول إضافية لجدول maintenance_payments
*/

-- إضافة حقول إضافية لجدول maintenance_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_payments' AND column_name = 'payment_gateway'
  ) THEN
    ALTER TABLE maintenance_payments ADD COLUMN payment_gateway text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_payments' AND column_name = 'payment_gateway_ref'
  ) THEN
    ALTER TABLE maintenance_payments ADD COLUMN payment_gateway_ref text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_payments' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE maintenance_payments ADD COLUMN transaction_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE maintenance_payments ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_payments' AND column_name = 'gateway_response'
  ) THEN
    ALTER TABLE maintenance_payments ADD COLUMN gateway_response jsonb;
  END IF;
END $$;

-- دالة لإنشاء سجل دفع جديد
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
  v_user_identity text;
  v_existing_payment uuid;
BEGIN
  -- الحصول على هوية المستخدم
  SELECT secondary_identity INTO v_user_identity
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- التحقق من عدم وجود دفع سابق
  SELECT id INTO v_existing_payment
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND user_id = p_user_id
    AND payment_status = 'paid';

  IF v_existing_payment IS NOT NULL THEN
    RAISE EXCEPTION 'تم سداد رسوم هذه الصيانة مسبقاً';
  END IF;

  -- حساب عدد الأشجار حسب الهوية
  IF v_user_identity = 'agricultural' THEN
    SELECT COALESCE(SUM(tree_count), 0) INTO v_trees_count
    FROM agricultural_tree_inventory
    WHERE user_id = p_user_id;
  ELSE
    SELECT COALESCE(SUM(total_trees), 0) INTO v_trees_count
    FROM investment_assets
    WHERE user_id = p_user_id;
  END IF;

  IF v_trees_count IS NULL OR v_trees_count = 0 THEN
    RAISE EXCEPTION 'لا توجد أشجار مسجلة للمستخدم';
  END IF;

  -- الحصول على تكلفة الشجرة
  SELECT cost_per_tree INTO v_cost_per_tree
  FROM maintenance_fees
  WHERE id = p_maintenance_fee_id;

  IF v_cost_per_tree IS NULL THEN
    RAISE EXCEPTION 'سجل الصيانة غير موجود';
  END IF;

  -- حساب المبلغ الإجمالي
  v_total_amount := v_trees_count * v_cost_per_tree;

  -- إنشاء أو تحديث سجل الدفع
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
    (SELECT farm_id FROM maintenance_fees WHERE id = p_maintenance_fee_id LIMIT 1),
    v_trees_count,
    v_total_amount,
    NULL,
    'pending',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'trees_count', v_trees_count,
    'cost_per_tree', v_cost_per_tree,
    'total_amount', v_total_amount
  );
END;
$$;

-- دالة للتحقق من حالة الدفع
CREATE OR REPLACE FUNCTION check_maintenance_payment_status(
  p_maintenance_fee_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment record;
BEGIN
  SELECT
    id,
    payment_status,
    amount_due,
    amount_paid,
    payment_date,
    transaction_id
  INTO v_payment
  FROM maintenance_payments
  WHERE maintenance_fee_id = p_maintenance_fee_id
    AND user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_payment.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_payment', false,
      'status', 'not_found'
    );
  END IF;

  RETURN jsonb_build_object(
    'has_payment', true,
    'payment_id', v_payment.id,
    'status', v_payment.payment_status,
    'amount_due', v_payment.amount_due,
    'amount_paid', v_payment.amount_paid,
    'payment_date', v_payment.payment_date,
    'transaction_id', v_payment.transaction_id
  );
END;
$$;

-- دالة لإتمام الدفع
CREATE OR REPLACE FUNCTION complete_maintenance_payment(
  p_payment_id uuid,
  p_transaction_id text,
  p_amount_paid decimal DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_gateway_response jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_status text;
  v_amount_due decimal;
BEGIN
  -- الحصول على بيانات الدفع
  SELECT payment_status, amount_due
  INTO v_payment_status, v_amount_due
  FROM maintenance_payments
  WHERE id = p_payment_id;

  IF v_payment_status IS NULL THEN
    RAISE EXCEPTION 'سجل الدفع غير موجود';
  END IF;

  IF v_payment_status = 'paid' THEN
    RAISE EXCEPTION 'تم سداد هذا الطلب مسبقاً';
  END IF;

  -- تحديث سجل الدفع
  UPDATE maintenance_payments
  SET
    payment_status = 'paid',
    amount_paid = COALESCE(p_amount_paid, amount_due),
    payment_date = now(),
    transaction_id = p_transaction_id,
    payment_method = p_payment_method,
    gateway_response = p_gateway_response,
    updated_at = now()
  WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'paid_at', now(),
    'amount_paid', COALESCE(p_amount_paid, v_amount_due)
  );
END;
$$;

-- دالة للحصول على إحصائيات السداد
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
BEGIN
  -- حساب إجمالي العملاء
  SELECT
    COUNT(DISTINCT user_id) INTO v_total_clients
  FROM (
    SELECT user_id FROM agricultural_tree_inventory
    UNION
    SELECT user_id FROM investment_assets
  ) AS all_clients;

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
    SELECT user_id, COALESCE(SUM(tree_count), 0) as trees
    FROM agricultural_tree_inventory
    GROUP BY user_id
    UNION ALL
    SELECT user_id, COALESCE(SUM(total_trees), 0) as trees
    FROM investment_assets
    GROUP BY user_id
  ),
  total_trees AS (
    SELECT SUM(trees) as total FROM client_trees
  )
  SELECT
    COALESCE(tt.total * mf.cost_per_tree, 0) INTO v_total_amount
  FROM total_trees tt
  CROSS JOIN maintenance_fees mf
  WHERE mf.id = p_maintenance_fee_id;

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

-- إضافة فهرس على transaction_id
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_transaction
  ON maintenance_payments(transaction_id);
