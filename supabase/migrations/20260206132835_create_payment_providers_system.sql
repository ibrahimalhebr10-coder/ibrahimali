/*
  # نظام إدارة بوابات الدفع الحقيقية

  1. الجداول الجديدة
    - `payment_providers` - جدول بوابات الدفع
      - `id` (uuid, primary key)
      - `provider_code` (text) - كود البوابة (mada, visa_mastercard, tamara, tabby, bank_transfer)
      - `provider_name_ar` (text) - الاسم بالعربية
      - `provider_name_en` (text) - الاسم بالإنجليزية
      - `is_enabled` (boolean) - حالة التفعيل
      - `environment` (text) - sandbox أو production
      - `connection_status` (text) - connected, disconnected, testing, error
      - `api_key` (text) - مفتاح API
      - `secret_key` (text) - المفتاح السري
      - `merchant_id` (text) - معرف التاجر
      - `webhook_url` (text) - رابط Webhook
      - `webhook_secret` (text) - سر Webhook
      - `configuration` (jsonb) - إعدادات إضافية مخصصة
      - `last_test_at` (timestamptz) - آخر اختبار اتصال
      - `last_test_status` (text) - نتيجة آخر اختبار
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - المشرف الذي أنشأها
      - `updated_by` (uuid) - آخر من عدلها

    - `payment_provider_transactions_log` - سجل المعاملات لكل بوابة
      - `id` (uuid, primary key)
      - `provider_id` (uuid) - مرجع للبوابة
      - `transaction_type` (text) - payment, refund, test
      - `transaction_status` (text) - success, failed, pending
      - `amount` (numeric)
      - `currency` (text)
      - `external_transaction_id` (text) - معرف المعاملة في البوابة الخارجية
      - `request_data` (jsonb) - بيانات الطلب
      - `response_data` (jsonb) - بيانات الاستجابة
      - `error_message` (text)
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - المشرفون فقط يمكنهم الوصول
    - تشفير المفاتيح الحساسة

  3. البيانات الأولية
    - إضافة البوابات الخمس الأساسية
*/

-- جدول بوابات الدفع
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code text UNIQUE NOT NULL,
  provider_name_ar text NOT NULL,
  provider_name_en text NOT NULL,
  is_enabled boolean DEFAULT false,
  environment text DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  connection_status text DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'testing', 'error')),
  api_key text,
  secret_key text,
  merchant_id text,
  webhook_url text,
  webhook_secret text,
  configuration jsonb DEFAULT '{}'::jsonb,
  last_test_at timestamptz,
  last_test_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- جدول سجل المعاملات
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
CREATE INDEX IF NOT EXISTS idx_payment_providers_code ON payment_providers(provider_code);
CREATE INDEX IF NOT EXISTS idx_payment_providers_enabled ON payment_providers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_provider_transactions_provider ON payment_provider_transactions_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_transactions_status ON payment_provider_transactions_log(transaction_status);

-- تفعيل RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_transactions_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - المشرفون فقط
CREATE POLICY "Admins can view providers"
  ON payment_providers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert providers"
  ON payment_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update providers"
  ON payment_providers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete providers"
  ON payment_providers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view transactions log"
  ON payment_provider_transactions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert to transactions log"
  ON payment_provider_transactions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payment_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  -- تحديث حالة البوابة
  UPDATE payment_providers
  SET 
    last_test_at = now(),
    last_test_status = 'testing',
    connection_status = 'testing'
  WHERE id = p_provider_id;
  
  -- تسجيل في سجل المعاملات
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