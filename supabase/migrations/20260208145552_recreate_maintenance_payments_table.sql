/*
  # إعادة إنشاء جدول maintenance_payments

  ## المشكلة
  جدول maintenance_payments غير موجود في قاعدة البيانات
  رغم وجود migration له، مما يسبب خطأ 404 عند استدعاء get_client_maintenance_records

  ## الحل
  إعادة إنشاء الجدول بشكل صحيح مع RLS policies

  ## الجدول
  - id (uuid, primary key)
  - user_id (uuid, foreign key → auth.users)
  - maintenance_fee_id (uuid, foreign key → maintenance_fees)
  - farm_id (uuid, foreign key → farms)
  - tree_count (int)
  - amount_due (numeric)
  - amount_paid (numeric)
  - payment_status (text: pending/paid)
  - payment_date (timestamptz)
  - created_at, updated_at (timestamptz)

  ## الأمان
  - RLS enabled
  - Users can only see their own payments
  - Admins can see all payments
*/

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS maintenance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  maintenance_fee_id uuid NOT NULL REFERENCES maintenance_fees(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tree_count int NOT NULL CHECK (tree_count > 0),
  amount_due numeric(10, 2) NOT NULL CHECK (amount_due > 0),
  amount_paid numeric(10, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_user_id ON maintenance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_fee_id ON maintenance_payments(maintenance_fee_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_farm_id ON maintenance_payments(farm_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_status ON maintenance_payments(payment_status);

-- Unique constraint: one payment record per user per maintenance fee
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_payments_unique 
ON maintenance_payments(user_id, maintenance_fee_id) 
WHERE payment_status != 'cancelled';

-- Enable RLS
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own maintenance payments" ON maintenance_payments;
DROP POLICY IF EXISTS "Users can create own maintenance payments" ON maintenance_payments;
DROP POLICY IF EXISTS "Users can update own maintenance payments" ON maintenance_payments;
DROP POLICY IF EXISTS "Admins can view all maintenance payments" ON maintenance_payments;
DROP POLICY IF EXISTS "Admins can manage all maintenance payments" ON maintenance_payments;

-- RLS Policies: Users can view their own payments
CREATE POLICY "Users can view own maintenance payments"
  ON maintenance_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies: Users can create their own payments
CREATE POLICY "Users can create own maintenance payments"
  ON maintenance_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies: Users can update their own payments
CREATE POLICY "Users can update own maintenance payments"
  ON maintenance_payments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies: Admins can view and manage all payments
CREATE POLICY "Admins can manage all maintenance payments"
  ON maintenance_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Trigger: update updated_at on change
CREATE OR REPLACE FUNCTION update_maintenance_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_maintenance_payment_updated_at ON maintenance_payments;
CREATE TRIGGER trigger_update_maintenance_payment_updated_at
  BEFORE UPDATE ON maintenance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_payment_updated_at();

-- Trigger: set payment_date when status changes to 'paid'
CREATE OR REPLACE FUNCTION update_payment_date_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    NEW.payment_date = COALESCE(NEW.payment_date, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_date ON maintenance_payments;
CREATE TRIGGER trigger_update_payment_date
  BEFORE UPDATE OF payment_status ON maintenance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_date_on_status_change();

COMMENT ON TABLE maintenance_payments IS 'سدادات رسوم الصيانة من العملاء';
