/*
  # إصلاح دالة تحويل الفائض المالي - استخدام الرصيد الكلي

  1. التغييرات
    - تعديل دالة `transfer_to_platform_wallet` لقبول p_path_type كـ NULL
    - عند NULL: التحويل من الرصيد الكلي (جميع المسارات)
    - عند تحديد المسار: التحويل من ذلك المسار فقط

  2. المنطق الجديد
    - إذا كان p_path_type = NULL:
      * التحقق من الرصيد الكلي
      * خصم المبلغ من المسارات بشكل ذكي (الإيجابية أولاً)
    - إذا كان p_path_type محدد:
      * التحقق من رصيد ذلك المسار فقط
      * خصم المبلغ من المسار المحدد

  3. الهدف
    - زر "دفع فائض مالي" يجب أن يظهر بناءً على الرصيد الكلي
    - الدفع يكون من الرصيد الكلي وليس من مسار واحد
*/

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS transfer_to_platform_wallet(uuid, decimal, text);

-- إنشاء الدالة الجديدة مع p_path_type كـ NULL-able
CREATE OR REPLACE FUNCTION transfer_to_platform_wallet(
  p_farm_id uuid,
  p_amount decimal,
  p_path_type text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_current_balance decimal;
  v_agricultural_balance decimal;
  v_investment_balance decimal;
  v_platform_share decimal;
  v_charity_share decimal;
  v_transfer_id uuid;
  v_amount_from_agricultural decimal := 0;
  v_amount_from_investment decimal := 0;
BEGIN
  -- إذا كان p_path_type محدد، نستخدم المنطق القديم (من مسار واحد)
  IF p_path_type IS NOT NULL THEN
    -- التحقق من صحة path_type
    IF p_path_type NOT IN ('agricultural', 'investment') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'نوع المسار غير صحيح'
      );
    END IF;

    -- الحصول على رصيد المسار المحدد
    SELECT current_balance INTO v_current_balance
    FROM get_farm_balance(p_farm_id, p_path_type);

    -- التحقق من كفاية الرصيد
    IF v_current_balance < p_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'رصيد المسار غير كافٍ'
      );
    END IF;

    -- حساب التقسيم
    v_platform_share := p_amount * 0.75;
    v_charity_share := p_amount * 0.25;

    -- إنشاء سجل التحويل
    INSERT INTO platform_wallet_transfers (
      farm_id,
      path_type,
      transfer_amount,
      platform_share,
      charity_share,
      transferred_by
    ) VALUES (
      p_farm_id,
      p_path_type,
      p_amount,
      v_platform_share,
      v_charity_share,
      auth.uid()
    ) RETURNING id INTO v_transfer_id;

    -- خصم من رصيد المزرعة
    INSERT INTO farm_financial_transactions (
      farm_id,
      path_type,
      transaction_type,
      amount,
      description,
      created_by
    ) VALUES (
      p_farm_id,
      p_path_type,
      'expense',
      p_amount,
      'تحويل فائض مالي إلى محفظة المنصة - ' ||
      CASE p_path_type
        WHEN 'agricultural' THEN 'أشجاري الخضراء'
        WHEN 'investment' THEN 'أشجاري الذهبية'
      END,
      auth.uid()
    );

    RETURN jsonb_build_object(
      'success', true,
      'transfer_id', v_transfer_id,
      'path_type', p_path_type,
      'platform_share', v_platform_share,
      'charity_share', v_charity_share
    );
  END IF;

  -- المنطق الجديد: p_path_type = NULL (تحويل من الرصيد الكلي)

  -- الحصول على الرصيد الكلي
  SELECT current_balance INTO v_current_balance
  FROM get_farm_balance(p_farm_id, NULL);

  -- التحقق من كفاية الرصيد الكلي
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الرصيد الكلي للمزرعة غير كافٍ'
    );
  END IF;

  -- الحصول على أرصدة المسارين
  SELECT current_balance INTO v_agricultural_balance
  FROM get_farm_balance(p_farm_id, 'agricultural');

  SELECT current_balance INTO v_investment_balance
  FROM get_farm_balance(p_farm_id, 'investment');

  -- توزيع المبلغ بشكل ذكي (نأخذ من الإيجابي أولاً)
  IF v_investment_balance > 0 AND p_amount <= v_investment_balance THEN
    -- كل المبلغ من الذهبية
    v_amount_from_investment := p_amount;
    v_amount_from_agricultural := 0;
  ELSIF v_agricultural_balance > 0 AND p_amount <= v_agricultural_balance THEN
    -- كل المبلغ من الخضراء
    v_amount_from_agricultural := p_amount;
    v_amount_from_investment := 0;
  ELSIF v_investment_balance > 0 AND v_agricultural_balance > 0 THEN
    -- نوزع بين الاثنين
    IF v_investment_balance >= p_amount / 2 THEN
      v_amount_from_investment := LEAST(v_investment_balance, p_amount);
      v_amount_from_agricultural := p_amount - v_amount_from_investment;
    ELSE
      v_amount_from_agricultural := LEAST(v_agricultural_balance, p_amount);
      v_amount_from_investment := p_amount - v_amount_from_agricultural;
    END IF;
  ELSIF v_investment_balance > 0 THEN
    v_amount_from_investment := p_amount;
  ELSIF v_agricultural_balance > 0 THEN
    v_amount_from_agricultural := p_amount;
  END IF;

  -- حساب التقسيم
  v_platform_share := p_amount * 0.75;
  v_charity_share := p_amount * 0.25;

  -- إنشاء سجل التحويل (بدون path_type محدد)
  INSERT INTO platform_wallet_transfers (
    farm_id,
    path_type,
    transfer_amount,
    platform_share,
    charity_share,
    transferred_by
  ) VALUES (
    p_farm_id,
    'investment',
    p_amount,
    v_platform_share,
    v_charity_share,
    auth.uid()
  ) RETURNING id INTO v_transfer_id;

  -- خصم من المسار الاستثماري (إذا كان هناك مبلغ)
  IF v_amount_from_investment > 0 THEN
    INSERT INTO farm_financial_transactions (
      farm_id,
      path_type,
      transaction_type,
      amount,
      description,
      created_by
    ) VALUES (
      p_farm_id,
      'investment',
      'expense',
      v_amount_from_investment,
      'تحويل فائض مالي إلى محفظة المنصة - جزء من أشجاري الذهبية',
      auth.uid()
    );
  END IF;

  -- خصم من المسار الزراعي (إذا كان هناك مبلغ)
  IF v_amount_from_agricultural > 0 THEN
    INSERT INTO farm_financial_transactions (
      farm_id,
      path_type,
      transaction_type,
      amount,
      description,
      created_by
    ) VALUES (
      p_farm_id,
      'agricultural',
      'expense',
      v_amount_from_agricultural,
      'تحويل فائض مالي إلى محفظة المنصة - جزء من أشجاري الخضراء',
      auth.uid()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'path_type', 'total',
    'from_investment', v_amount_from_investment,
    'from_agricultural', v_amount_from_agricultural,
    'platform_share', v_platform_share,
    'charity_share', v_charity_share
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transfer_to_platform_wallet IS
'تحويل فائض مالي من مزرعة إلى محفظة المنصة.
- إذا كان p_path_type = NULL: التحويل من الرصيد الكلي (توزيع ذكي)
- إذا كان p_path_type محدد: التحويل من ذلك المسار فقط
- التقسيم: 75% منصة / 25% خيري';
