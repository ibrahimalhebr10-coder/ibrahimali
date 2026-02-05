/*
  # تحديد المسار ديناميكيًا في تحويل الفائض (أولوية متوسطة)

  ## المشكلة
  - تحويل الفائض للمحفظة يُسجل دائمًا كـ path_type = investment
  - لا يمكن معرفة المسار الفعلي للتحويل

  ## الحل
  - تعديل دالة `transfer_to_platform_wallet` لاستقبال path_type
  - تسجيل العملية بالمسار الصحيح (خضراء أو ذهبية)
  - إضافة path_type إلى جدول platform_wallet_transfers للتتبع

  ## ملاحظات
  - الحساب موحد (كما هو)
  - فقط وسم العملية بدقة
  - يسهل التقارير المستقبلية
*/

-- إضافة path_type إلى جدول platform_wallet_transfers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_wallet_transfers' AND column_name = 'path_type'
  ) THEN
    ALTER TABLE platform_wallet_transfers
    ADD COLUMN path_type text NOT NULL DEFAULT 'investment'
    CHECK (path_type IN ('agricultural', 'investment'));
  END IF;
END $$;

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_platform_wallet_transfers_path_type
  ON platform_wallet_transfers(path_type);

-- حذف الدالة القديمة
DROP FUNCTION IF EXISTS transfer_to_platform_wallet(uuid, decimal);

-- إنشاء الدالة الجديدة مع path_type
CREATE OR REPLACE FUNCTION transfer_to_platform_wallet(
  p_farm_id uuid,
  p_amount decimal,
  p_path_type text DEFAULT 'investment'
)
RETURNS jsonb AS $$
DECLARE
  v_current_balance decimal;
  v_platform_share decimal;
  v_charity_share decimal;
  v_transfer_id uuid;
BEGIN
  -- التحقق من صحة path_type
  IF p_path_type NOT IN ('agricultural', 'investment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'نوع المسار غير صحيح'
    );
  END IF;

  -- Get current farm balance for the specific path
  SELECT current_balance INTO v_current_balance
  FROM get_farm_balance(p_farm_id, p_path_type);
  
  -- Validate sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'رصيد المسار غير كافٍ'
    );
  END IF;
  
  -- Calculate splits
  v_platform_share := p_amount * 0.75;
  v_charity_share := p_amount * 0.25;
  
  -- Create wallet transfer record with path_type
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
  
  -- Deduct from farm balance with correct path_type
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION transfer_to_platform_wallet IS
'تحويل فائض مالي من مزرعة إلى محفظة المنصة مع تحديد المسار.
- يتم التحقق من رصيد المسار المحدد
- يتم تسجيل العملية بالمسار الصحيح
- التقسيم: 75% منصة / 25% خيري';
