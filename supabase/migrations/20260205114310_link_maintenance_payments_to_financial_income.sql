/*
  # ربط رسوم الصيانة بالإيرادات المالية (أولوية عالية جدًا)

  ## المشكلة
  - سداد رسوم الصيانة لا ينعكس تلقائيًا كإيراد مالي
  - الإيرادات تُضاف يدويًا فقط

  ## الحل
  عند نجاح أي عملية سداد إلكترونية (مدى / فيزا):
  - يتم تلقائيًا إنشاء عملية إيراد في قسم المالية
  - مربوطة بـ: farm_id, path_type, user_id (مرجع فقط)
  - تحديث ملخص المزرعة مباشرة

  ## التنفيذ
  1. تعديل دالة `complete_maintenance_payment`
  2. إضافة INSERT تلقائي إلى `farm_financial_transactions`
  3. التحويل البنكي يبقى يدوي (كما هو)

  ## الأمان
  - الربط تلقائي فقط للسداد الإلكتروني
  - لا تدخل يدوي في السداد الإلكتروني
*/

-- تعديل دالة إتمام الدفع لإضافة إيراد مالي تلقائيًا
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
  v_farm_id uuid;
  v_path_type text;
  v_user_id uuid;
  v_maintenance_fee_id uuid;
  v_financial_transaction_id uuid;
BEGIN
  -- الحصول على بيانات الدفع
  SELECT
    mp.payment_status,
    mp.amount_due,
    mp.farm_id,
    mp.user_id,
    mp.maintenance_fee_id
  INTO
    v_payment_status,
    v_amount_due,
    v_farm_id,
    v_user_id,
    v_maintenance_fee_id
  FROM maintenance_payments mp
  WHERE mp.id = p_payment_id;

  IF v_payment_status IS NULL THEN
    RAISE EXCEPTION 'سجل الدفع غير موجود';
  END IF;

  IF v_payment_status = 'paid' THEN
    RAISE EXCEPTION 'تم سداد هذا الطلب مسبقاً';
  END IF;

  -- الحصول على path_type من maintenance_fees
  SELECT path_type INTO v_path_type
  FROM maintenance_fees
  WHERE id = v_maintenance_fee_id;

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

  -- ✅ إضافة إيراد مالي تلقائيًا (فقط للسداد الإلكتروني)
  -- التحويل البنكي (bank_transfer) يبقى يدوي
  IF p_payment_method IS NOT NULL AND p_payment_method != 'bank_transfer' THEN
    INSERT INTO farm_financial_transactions (
      farm_id,
      path_type,
      transaction_type,
      amount,
      description,
      transaction_date,
      created_by
    ) VALUES (
      v_farm_id,
      v_path_type,
      'income',
      COALESCE(p_amount_paid, v_amount_due),
      'إيراد رسوم صيانة - سداد إلكتروني (' || p_payment_method || ')',
      now(),
      v_user_id
    )
    RETURNING id INTO v_financial_transaction_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'paid_at', now(),
    'amount_paid', COALESCE(p_amount_paid, v_amount_due),
    'financial_transaction_id', v_financial_transaction_id,
    'auto_linked', CASE
      WHEN v_financial_transaction_id IS NOT NULL THEN true
      ELSE false
    END
  );
END;
$$;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION complete_maintenance_payment IS
'إتمام دفع رسوم الصيانة مع ربط تلقائي بالإيرادات المالية.
- السداد الإلكتروني (مدى/فيزا): يُنشئ إيراد تلقائيًا
- التحويل البنكي: يتطلب إضافة يدوية للإيراد';
