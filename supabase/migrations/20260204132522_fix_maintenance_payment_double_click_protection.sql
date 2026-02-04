/*
  # إصلاح معالجة الدفع المكرر

  1. التغييرات
    - تحديث دالة `complete_maintenance_payment` لإرجاع النتيجة بدلاً من رمي خطأ إذا كان الدفع مكتملاً
    - السماح بإعادة تحميل صفحة النتيجة دون أخطاء

  2. الفوائد
    - تجربة مستخدم أفضل
    - عدم رمي أخطاء عند إعادة تحميل الصفحة
    - حماية من الدفع المكرر مع رسالة واضحة
*/

-- تحديث دالة إتمام الدفع لدعم إعادة تحميل الصفحة
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
  v_payment record;
BEGIN
  -- الحصول على بيانات الدفع
  SELECT 
    payment_status, 
    amount_due,
    amount_paid,
    payment_date,
    transaction_id
  INTO v_payment
  FROM maintenance_payments
  WHERE id = p_payment_id;

  IF v_payment.payment_status IS NULL THEN
    RAISE EXCEPTION 'سجل الدفع غير موجود';
  END IF;

  -- إذا كان الدفع مكتملاً بالفعل، نرجع النتيجة الموجودة
  IF v_payment.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'payment_id', p_payment_id,
      'paid_at', v_payment.payment_date,
      'amount_paid', v_payment.amount_paid,
      'already_paid', true,
      'message', 'تم سداد هذا الطلب مسبقاً'
    );
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
    'amount_paid', COALESCE(p_amount_paid, v_payment.amount_due),
    'already_paid', false
  );
END;
$$;
