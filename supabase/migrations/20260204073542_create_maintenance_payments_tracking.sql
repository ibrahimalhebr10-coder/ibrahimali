/*
  # إنشاء نظام تتبع سدادات رسوم الصيانة

  ## الهدف
  تتبع سدادات العملاء لرسوم الصيانة المستحقة عليهم
  - يربط العميل بسجل رسوم الصيانة
  - يحفظ المبلغ المسدد
  - يحفظ حالة السداد

  ## الجدول الجديد

  ### maintenance_payments (سدادات رسوم الصيانة)
  - id (uuid, primary key)
  - user_id (uuid, foreign key → user_profiles)
  - maintenance_fee_id (uuid, foreign key → maintenance_fees)
  - farm_id (uuid, foreign key → farms)
  - tree_count (int) - عدد أشجار العميل في المزرعة
  - amount_due (numeric) - المبلغ المستحق (محسوب)
  - amount_paid (numeric) - المبلغ المسدد
  - payment_status (text) - حالة السداد (pending/paid)
  - payment_date (timestamptz) - تاريخ السداد
  - created_at (timestamptz)

  ## الأمان
  - RLS مفعل
  - العميل يرى سداداته فقط
  - الإدارة ترى كل السدادات
*/

-- =====================================================
-- 1. جدول سدادات رسوم الصيانة
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  maintenance_fee_id uuid NOT NULL REFERENCES maintenance_fees(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  tree_count int NOT NULL CHECK (tree_count > 0),
  amount_due numeric(10, 2) NOT NULL CHECK (amount_due > 0),
  amount_paid numeric(10, 2) DEFAULT 0 CHECK (amount_paid >= 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_user_id ON maintenance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_fee_id ON maintenance_payments(maintenance_fee_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_farm_id ON maintenance_payments(farm_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_status ON maintenance_payments(payment_status);

-- Unique constraint: عميل واحد لكل رسوم صيانة
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_payments_unique 
ON maintenance_payments(user_id, maintenance_fee_id);

-- RLS
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;

-- العميل يرى سداداته فقط
CREATE POLICY "Users can view own maintenance payments"
  ON maintenance_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- العميل يُنشئ سداداته فقط
CREATE POLICY "Users can create own maintenance payments"
  ON maintenance_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- العميل يحدث سداداته فقط
CREATE POLICY "Users can update own maintenance payments"
  ON maintenance_payments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- الإدارة ترى كل السدادات
CREATE POLICY "Admins can view all maintenance payments"
  ON maintenance_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- الإدارة تحدث كل السدادات
CREATE POLICY "Admins can update all maintenance payments"
  ON maintenance_payments
  FOR UPDATE
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

-- =====================================================
-- 2. Trigger لتحديث updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_maintenance_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_payment_updated_at
  BEFORE UPDATE ON maintenance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_payment_updated_at();

-- =====================================================
-- 3. Trigger لتحديث تاريخ السداد عند تغيير الحالة
-- =====================================================
CREATE OR REPLACE FUNCTION update_payment_date_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    NEW.payment_date = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_date
  BEFORE UPDATE OF payment_status ON maintenance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_date_on_status_change();

-- =====================================================
-- 4. وظيفة للحصول على صيانات المزارع الخاصة بالعميل
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_maintenance_records(client_user_id uuid)
RETURNS TABLE (
  maintenance_id uuid,
  farm_id uuid,
  farm_name text,
  maintenance_type text,
  maintenance_date date,
  status text,
  total_amount numeric,
  cost_per_tree numeric,
  client_tree_count bigint,
  client_due_amount numeric,
  payment_status text,
  payment_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id as maintenance_id,
    mr.farm_id,
    f.name_ar as farm_name,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status,
    mf.total_amount,
    mf.cost_per_tree,
    COUNT(DISTINCT ia.id) as client_tree_count,
    (COUNT(DISTINCT ia.id) * mf.cost_per_tree) as client_due_amount,
    COALESCE(mp.payment_status, 'pending') as payment_status,
    mp.id as payment_id
  FROM maintenance_records mr
  JOIN farms f ON f.id = mr.farm_id
  LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
  LEFT JOIN investment_assets ia ON ia.farm_id = mr.farm_id AND ia.user_id = client_user_id
  LEFT JOIN maintenance_payments mp ON mp.maintenance_fee_id = mf.id AND mp.user_id = client_user_id
  WHERE mr.status = 'published'
    AND ia.id IS NOT NULL
  GROUP BY 
    mr.id, mr.farm_id, f.name_ar, mr.maintenance_type, 
    mr.maintenance_date, mr.status, mf.total_amount, 
    mf.cost_per_tree, mp.payment_status, mp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. View لعرض ملخص السدادات
-- =====================================================
CREATE OR REPLACE VIEW maintenance_payments_summary AS
SELECT 
  mp.id,
  mp.user_id,
  up.full_name,
  up.phone,
  mp.farm_id,
  f.name_ar as farm_name,
  mr.maintenance_type,
  mr.maintenance_date,
  mp.tree_count,
  mp.amount_due,
  mp.amount_paid,
  mp.payment_status,
  mp.payment_date,
  mp.created_at
FROM maintenance_payments mp
JOIN user_profiles up ON up.id = mp.user_id
JOIN farms f ON f.id = mp.farm_id
JOIN maintenance_fees mf ON mf.id = mp.maintenance_fee_id
JOIN maintenance_records mr ON mr.id = mf.maintenance_id
ORDER BY mp.created_at DESC;

COMMENT ON TABLE maintenance_payments IS 'سدادات رسوم الصيانة من العملاء';
COMMENT ON FUNCTION get_client_maintenance_records IS 'جلب صيانات المزارع المملوكة للعميل مع حساب المستحقات';
