/*
  # نظام إيصالات الدفع - Payment Receipts System

  ## النظرة العامة
  نظام لإدارة إيصالات التحويلات البنكية التي يرفعها المستثمرون
  مع القدرة على المراجعة والموافقة من قبل الإدارة المالية

  ## الجداول المنشأة

  ### 1. payment_receipts
  جدول يحتوي على جميع إيصالات الدفع المرفوعة

  الحقول:
  - `id` - معرف فريد للإيصال
  - `reservation_id` - معرف الحجز المرتبط
  - `user_id` - معرف المستثمر
  - `payment_method_id` - معرف وسيلة الدفع المستخدمة
  - `amount` - المبلغ المدفوع
  - `receipt_file_path` - مسار الملف في Storage
  - `receipt_file_type` - نوع الملف (image/jpeg, application/pdf, etc)
  - `notes` - ملاحظات المستثمر (اختيارية)
  - `status` - حالة الإيصال (pending, approved, rejected)
  - `reviewed_by` - معرف المدير الذي راجع الإيصال
  - `review_notes` - ملاحظات المراجعة
  - `reviewed_at` - تاريخ المراجعة
  - `created_at` - تاريخ الرفع
  - `updated_at` - تاريخ آخر تحديث

  ## الأمان
  - Row Level Security (RLS) مفعل
  - المستثمر يمكنه رفع ورؤية إيصالاته فقط
  - المدير المالي والمدير العام يمكنهم رؤية ومراجعة جميع الإيصالات
*/

-- إنشاء جدول إيصالات الدفع
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL,
  receipt_file_path TEXT NOT NULL,
  receipt_file_type TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admins(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_payment_receipts_reservation_id ON payment_receipts(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_user_id ON payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON payment_receipts(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_created_at ON payment_receipts(created_at DESC);

-- تفعيل RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: المستثمر يمكنه رفع إيصال لحجزه
CREATE POLICY "Users can upload their own receipts"
  ON payment_receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: المستثمر يمكنه رؤية إيصالاته فقط
CREATE POLICY "Users can view their own receipts"
  ON payment_receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: المستثمر يمكنه تحديث إيصالاته (قبل المراجعة فقط)
CREATE POLICY "Users can update their pending receipts"
  ON payment_receipts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: المدير المالي والمدير العام يمكنهم رؤية جميع الإيصالات
CREATE POLICY "Financial managers can view all receipts"
  ON payment_receipts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'financial_manager')
      AND admins.is_active = true
    )
  );

-- Policy: المدير المالي والمدير العام يمكنهم مراجعة الإيصالات
CREATE POLICY "Financial managers can review receipts"
  ON payment_receipts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'financial_manager')
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role IN ('super_admin', 'financial_manager')
      AND admins.is_active = true
    )
  );

-- Function: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_payment_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: تحديث updated_at عند التعديل
DROP TRIGGER IF EXISTS payment_receipts_updated_at ON payment_receipts;
CREATE TRIGGER payment_receipts_updated_at
  BEFORE UPDATE ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_receipts_updated_at();

-- Function: تحديث حالة الدفع بعد الموافقة على الإيصال
CREATE OR REPLACE FUNCTION update_payment_status_on_receipt_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE payments
    SET 
      status = 'completed',
      payment_method_id = NEW.payment_method_id,
      paid_at = now()
    WHERE reservation_id = NEW.reservation_id;

    UPDATE reservations
    SET status = 'paid'
    WHERE id = NEW.reservation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: تحديث الدفع والحجز بعد الموافقة
DROP TRIGGER IF EXISTS payment_status_on_receipt_approval ON payment_receipts;
CREATE TRIGGER payment_status_on_receipt_approval
  AFTER UPDATE ON payment_receipts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION update_payment_status_on_receipt_approval();
