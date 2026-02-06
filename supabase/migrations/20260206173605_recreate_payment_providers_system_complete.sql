/*
  # إعادة إنشاء نظام بوابات الدفع بشكل كامل
  
  المشكلة:
  - جدول payment_providers غير موجود في قاعدة البيانات
  - تبويب المدفوعات اختفى من لوحة التحكم
  
  الحل:
  1. إنشاء جدول payment_providers مع جميع الحقول اللازمة
  2. إنشاء سياسات RLS صحيحة للـ Admins
  3. إضافة البيانات الأولية للبوابات السعودية
  4. إنشاء دوال مساعدة
*/

-- حذف الجدول إذا كان موجوداً (للتأكد من البداية النظيفة)
DROP TABLE IF EXISTS payment_provider_transactions_log CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;

-- إنشاء جدول بوابات الدفع
CREATE TABLE payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT UNIQUE NOT NULL,
  provider_name_ar TEXT NOT NULL,
  provider_name_en TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_enabled BOOLEAN DEFAULT false,
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'testing', 'error')),
  
  -- بيانات الاتصال
  api_key TEXT,
  secret_key TEXT,
  merchant_id TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- إعدادات إضافية
  configuration JSONB DEFAULT '{}'::jsonb,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  
  -- بيانات التتبع
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- إنشاء جدول سجل المعاملات
CREATE TABLE payment_provider_transactions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES payment_providers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'test')),
  transaction_status TEXT NOT NULL CHECK (transaction_status IN ('success', 'failed', 'pending')),
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'SAR',
  external_transaction_id TEXT,
  request_data JSONB DEFAULT '{}'::jsonb,
  response_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX idx_payment_providers_code ON payment_providers(provider_code);
CREATE INDEX idx_payment_providers_enabled ON payment_providers(is_enabled);
CREATE INDEX idx_payment_providers_order ON payment_providers(display_order);
CREATE INDEX idx_provider_transactions_provider ON payment_provider_transactions_log(provider_id);
CREATE INDEX idx_provider_transactions_status ON payment_provider_transactions_log(transaction_status);

-- تفعيل RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_transactions_log ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للـ Admins
CREATE POLICY "admins_can_view_all_providers"
  ON payment_providers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_can_insert_providers"
  ON payment_providers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_can_update_providers"
  ON payment_providers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_can_delete_providers"
  ON payment_providers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins_can_view_transactions"
  ON payment_provider_transactions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "system_can_log_transactions"
  ON payment_provider_transactions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- دالة تحديث updated_at تلقائياً
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

-- إضافة البيانات الأولية لبوابات الدفع السعودية
INSERT INTO payment_providers (
  provider_code, 
  provider_name_ar, 
  provider_name_en,
  display_order,
  is_enabled,
  environment,
  connection_status
) VALUES
  ('mada', 'مدى', 'Mada', 1, false, 'sandbox', 'disconnected'),
  ('visa_mastercard', 'فيزا/ماستركارد', 'Visa/Mastercard', 2, false, 'sandbox', 'disconnected'),
  ('apple_pay', 'Apple Pay', 'Apple Pay', 3, false, 'sandbox', 'disconnected'),
  ('tabby', 'تابي - اشتري الآن وادفع لاحقاً', 'Tabby - Buy Now Pay Later', 4, false, 'sandbox', 'disconnected'),
  ('tamara', 'تمارا - قسّط مشترياتك', 'Tamara - Split Your Purchase', 5, false, 'sandbox', 'disconnected'),
  ('bank_transfer', 'تحويل بنكي', 'Bank Transfer', 6, true, 'production', 'connected')
ON CONFLICT (provider_code) DO NOTHING;
