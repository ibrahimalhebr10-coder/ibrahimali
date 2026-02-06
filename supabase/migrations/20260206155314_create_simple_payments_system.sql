/*
  # نظام الدفع البسيط

  ## الجدول الجديد
  - `payments`
    - تتبع عمليات الدفع فقط
    - يخزن Token من البوابة (ليس رقم البطاقة)
    - يدعم card و apple_pay
  
  ## الأمان
  - RLS مفعّل بالكامل
  - المستخدم يرى مدفوعاته فقط
  - الأدمن يرى كل شيء
*/

-- إنشاء جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'apple_pay')),
  payment_token text,
  gateway_reference text,
  gateway_response jsonb,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- تفعيل RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى مدفوعاته فقط
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- المستخدم يضيف مدفوعاته فقط
CREATE POLICY "Users can create own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- الأدمن يرى كل شيء
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- الأدمن يعدّل كل شيء
CREATE POLICY "Admins can update all payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON payments;
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Function لتحديث حالة الحجز عند اكتمال الدفع
CREATE OR REPLACE FUNCTION update_reservation_on_payment_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE reservations
    SET 
      status = 'confirmed',
      updated_at = now()
    WHERE id = NEW.reservation_id;
    
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث الحجز تلقائياً
DROP TRIGGER IF EXISTS update_reservation_on_payment_trigger ON payments;
CREATE TRIGGER update_reservation_on_payment_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_reservation_on_payment_complete();
