/*
  # إضافة نظام التجميع المالي لرسوم الصيانة

  ## المشكلة
  - كل سجل صيانة مرتبط برسوم منفصلة (one-to-one)
  - لا يمكن تجميع عدة سجلات صيانة تحت رسوم واحدة

  ## الحل
  1. إعادة هيكلة جدول maintenance_fees ليكون مستقلاً
     - إزالة maintenance_id من الجدول الرئيسي
     - إضافة حقول وصفية (عنوان، فترة)
  
  2. إنشاء جدول وسيط maintenance_fee_records
     - ربط رسوم بأكثر من سجل صيانة (many-to-one)
  
  ## الميزات الجديدة
  - رسوم صيانة واحدة تغطي أكثر من سجل صيانة
  - مثال: رسوم شهر يناير تشمل (ري + تسميد + تقليم)
  - تجميع مالي مرن للمزارع
*/

-- Step 1: Create new grouped maintenance fees table
CREATE TABLE IF NOT EXISTS maintenance_fees_grouped (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  fee_title text NOT NULL,
  fee_period text,
  total_amount numeric(10,2) NOT NULL,
  cost_per_tree numeric(10,2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create linking table for maintenance records
CREATE TABLE IF NOT EXISTS maintenance_fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id uuid NOT NULL REFERENCES maintenance_fees_grouped(id) ON DELETE CASCADE,
  maintenance_id uuid NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fee_id, maintenance_id)
);

-- Step 3: Enable RLS
ALTER TABLE maintenance_fees_grouped ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_fee_records ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies for maintenance_fees_grouped
CREATE POLICY "Admins can view grouped fees"
  ON maintenance_fees_grouped FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert grouped fees"
  ON maintenance_fees_grouped FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update grouped fees"
  ON maintenance_fees_grouped FOR UPDATE
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

CREATE POLICY "Admins can delete grouped fees"
  ON maintenance_fees_grouped FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Step 5: RLS Policies for maintenance_fee_records
CREATE POLICY "Admins can view fee records"
  ON maintenance_fee_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert fee records"
  ON maintenance_fee_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete fee records"
  ON maintenance_fee_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_fees_grouped_farm 
  ON maintenance_fees_grouped(farm_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_fee_records_fee 
  ON maintenance_fee_records(fee_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_fee_records_maintenance 
  ON maintenance_fee_records(maintenance_id);

-- Step 7: Migrate existing data from old system
INSERT INTO maintenance_fees_grouped (farm_id, fee_title, total_amount, cost_per_tree, status)
SELECT 
  mf.farm_id,
  'رسوم صيانة - ' || mr.maintenance_date::text as fee_title,
  mf.total_amount,
  mf.cost_per_tree,
  'published' as status
FROM maintenance_fees mf
JOIN maintenance_records mr ON mr.id = mf.maintenance_id
WHERE NOT EXISTS (
  SELECT 1 FROM maintenance_fees_grouped
  WHERE maintenance_fees_grouped.farm_id = mf.farm_id
);

-- Step 8: Link migrated records
INSERT INTO maintenance_fee_records (fee_id, maintenance_id)
SELECT 
  mfg.id as fee_id,
  mf.maintenance_id
FROM maintenance_fees mf
JOIN maintenance_records mr ON mr.id = mf.maintenance_id
JOIN maintenance_fees_grouped mfg ON mfg.farm_id = mf.farm_id
WHERE NOT EXISTS (
  SELECT 1 FROM maintenance_fee_records
  WHERE maintenance_fee_records.maintenance_id = mf.maintenance_id
)
LIMIT 1;

-- Step 9: Create helper function to get fees for a maintenance record
CREATE OR REPLACE FUNCTION get_maintenance_record_fees(p_maintenance_id uuid)
RETURNS TABLE (
  fee_id uuid,
  fee_title text,
  total_amount numeric,
  cost_per_tree numeric,
  status text,
  records_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mfg.id,
    mfg.fee_title,
    mfg.total_amount,
    mfg.cost_per_tree,
    mfg.status,
    COUNT(mfr.maintenance_id) as records_count
  FROM maintenance_fees_grouped mfg
  JOIN maintenance_fee_records mfr ON mfr.fee_id = mfg.id
  WHERE mfr.maintenance_id = p_maintenance_id
  GROUP BY mfg.id, mfg.fee_title, mfg.total_amount, mfg.cost_per_tree, mfg.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to get all records in a fee group
CREATE OR REPLACE FUNCTION get_fee_maintenance_records(p_fee_id uuid)
RETURNS TABLE (
  maintenance_id uuid,
  maintenance_type text,
  maintenance_date date,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.maintenance_type,
    mr.maintenance_date,
    mr.status
  FROM maintenance_records mr
  JOIN maintenance_fee_records mfr ON mfr.maintenance_id = mr.id
  WHERE mfr.fee_id = p_fee_id
  ORDER BY mr.maintenance_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
