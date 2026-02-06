/*
  # نظام الدفع البسيط والنظيف

  ## الجداول الجديدة
  
  ### `payment_records`
  - معلومات عملية الدفع
  - ربط مع الحجز
  - تتبع حالة الدفع
  - معلومات طريقة الدفع
  
  ## الأمان
  - تفعيل RLS
  - سياسات وصول بسيطة وواضحة
*/

-- جدول سجلات الدفع البسيط
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  
  -- معلومات الدفع
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL, -- 'bank_transfer', 'card', 'wallet'
  payment_status text NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  
  -- معلومات إضافية
  reference_number text,
  notes text,
  receipt_url text,
  
  -- تواريخ
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- سياسات بسيطة
CREATE POLICY "allow_all_payment_records"
  ON payment_records
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_payment_records_reservation 
  ON payment_records(reservation_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_user 
  ON payment_records(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_status 
  ON payment_records(payment_status);
