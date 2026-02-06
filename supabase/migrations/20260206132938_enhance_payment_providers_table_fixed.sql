/*
  # تحسين جدول بوابات الدفع بالأعمدة المطلوبة

  الإضافات:
  1. environment - البيئة (sandbox/production)
  2. connection_status - حالة الاتصال
  3. api_key - مفتاح API
  4. secret_key - المفتاح السري
  5. merchant_id - معرف التاجر
  6. webhook_url - رابط Webhook
  7. webhook_secret - سر Webhook
  8. last_test_at - آخر اختبار
  9. last_test_status - نتيجة آخر اختبار
  10. updated_by - آخر من عدل
*/

-- إضافة الأعمدة الجديدة
DO $$ BEGIN
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS environment text DEFAULT 'sandbox';
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'disconnected';
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS api_key text;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS secret_key text;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS merchant_id text;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS webhook_url text;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS webhook_secret text;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS last_test_at timestamptz;
  ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS last_test_status text;
  
  -- إضافة العمود مع foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_providers' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE payment_providers ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- إضافة القيود
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'check_environment'
  ) THEN
    ALTER TABLE payment_providers 
    ADD CONSTRAINT check_environment 
    CHECK (environment IN ('sandbox', 'production'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'check_connection_status'
  ) THEN
    ALTER TABLE payment_providers 
    ADD CONSTRAINT check_connection_status 
    CHECK (connection_status IN ('connected', 'disconnected', 'testing', 'error'));
  END IF;
END $$;

-- تحديث السجلات الموجودة
UPDATE payment_providers
SET 
  environment = 'sandbox',
  connection_status = 'disconnected'
WHERE environment IS NULL OR connection_status IS NULL;

-- إنشاء جدول سجل المعاملات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS payment_provider_transactions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES payment_providers(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'test')),
  transaction_status text NOT NULL CHECK (transaction_status IN ('success', 'failed', 'pending')),
  amount numeric(10, 2),
  currency text DEFAULT 'SAR',
  external_transaction_id text,
  request_data jsonb DEFAULT '{}'::jsonb,
  response_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_provider_transactions_provider ON payment_provider_transactions_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_transactions_status ON payment_provider_transactions_log(transaction_status);

-- تفعيل RLS على جدول سجل المعاملات
ALTER TABLE payment_provider_transactions_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DROP POLICY IF EXISTS "Admins can view transactions log" ON payment_provider_transactions_log;
CREATE POLICY "Admins can view transactions log"
  ON payment_provider_transactions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert to transactions log" ON payment_provider_transactions_log;
CREATE POLICY "System can insert to transactions log"
  ON payment_provider_transactions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- دالة لتحديث updated_at و updated_by تلقائياً
CREATE OR REPLACE FUNCTION update_payment_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON payment_providers;
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_provider_updated_at();

-- دالة لاختبار اتصال البوابة
CREATE OR REPLACE FUNCTION test_provider_connection(p_provider_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE payment_providers
  SET 
    last_test_at = now(),
    last_test_status = 'testing',
    connection_status = 'testing'
  WHERE id = p_provider_id;
  
  INSERT INTO payment_provider_transactions_log (
    provider_id, transaction_type, transaction_status,
    request_data, response_data
  ) VALUES (
    p_provider_id, 'test', 'pending',
    jsonb_build_object('test_initiated_at', now()),
    jsonb_build_object('status', 'testing')
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم بدء اختبار الاتصال',
    'provider_id', p_provider_id
  );
END;
$$;

-- دالة للحصول على إحصائيات البوابات
CREATE OR REPLACE FUNCTION get_providers_statistics()
RETURNS TABLE (
  provider_code text,
  provider_name_ar text,
  is_enabled boolean,
  connection_status text,
  total_transactions bigint,
  successful_transactions bigint,
  failed_transactions bigint,
  total_amount numeric,
  last_transaction_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.provider_code,
    pp.provider_name_ar,
    pp.is_enabled,
    pp.connection_status,
    COUNT(ptl.id) as total_transactions,
    COUNT(CASE WHEN ptl.transaction_status = 'success' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN ptl.transaction_status = 'failed' THEN 1 END) as failed_transactions,
    COALESCE(SUM(CASE WHEN ptl.transaction_status = 'success' THEN ptl.amount ELSE 0 END), 0) as total_amount,
    MAX(ptl.created_at) as last_transaction_at
  FROM payment_providers pp
  LEFT JOIN payment_provider_transactions_log ptl ON pp.id = ptl.provider_id
  GROUP BY pp.id, pp.provider_code, pp.provider_name_ar, pp.is_enabled, pp.connection_status
  ORDER BY pp.provider_code;
END;
$$;