/*
  # إنشاء نظام التشغيل والصيانة (Operations & Maintenance System)

  ## الهدف
  إنشاء نظام مستقل لإدارة الصيانة ورسوم الصيانة للمزارع
  - لا يرتبط بالمستخدمين أو الباقات أو العقود
  - يتعامل مع المزارع والأشجار فقط
  - نقطة التحكم الوحيدة لإدخال الصيانة والرسوم

  ## الجداول الجديدة

  ### 1. maintenance_records (سجلات الصيانة)
  - id (uuid, primary key)
  - farm_id (uuid, foreign key → farms)
  - maintenance_type (periodic/seasonal/emergency)
  - maintenance_date (date)
  - status (draft/published/completed)
  - created_at (timestamptz)

  ### 2. maintenance_stages (مراحل الصيانة)
  - id (uuid, primary key)
  - maintenance_id (uuid, foreign key → maintenance_records)
  - stage_title (text)
  - stage_note (text)
  - stage_date (date)
  - created_at (timestamptz)

  ### 3. maintenance_media (ميديا الصيانة)
  - id (uuid, primary key)
  - maintenance_id (uuid, foreign key → maintenance_records)
  - media_type (image/video)
  - file_path (text)
  - uploaded_at (timestamptz)

  ### 4. maintenance_fees (رسوم الصيانة)
  - id (uuid, primary key)
  - maintenance_id (uuid, foreign key → maintenance_records)
  - farm_id (uuid, foreign key → farms)
  - total_amount (numeric)
  - cost_per_tree (numeric) - محسوب تلقائياً
  - created_at (timestamptz)

  ## الأمان
  - RLS مفعل على جميع الجداول
  - الوصول محصور بالإدارة فقط
*/

-- =====================================================
-- 1. جدول سجلات الصيانة (Maintenance Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('periodic', 'seasonal', 'emergency')),
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_farm_id ON maintenance_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(maintenance_date);

-- RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance records"
  ON maintenance_records
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

-- =====================================================
-- 2. جدول مراحل الصيانة (Maintenance Stages)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  stage_title text NOT NULL,
  stage_note text,
  stage_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_stages_maintenance_id ON maintenance_stages(maintenance_id);

-- RLS
ALTER TABLE maintenance_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance stages"
  ON maintenance_stages
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

-- =====================================================
-- 3. جدول ميديا الصيانة (Maintenance Media)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  file_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_media_maintenance_id ON maintenance_media(maintenance_id);

-- RLS
ALTER TABLE maintenance_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance media"
  ON maintenance_media
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

-- =====================================================
-- 4. جدول رسوم الصيانة (Maintenance Fees)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
  cost_per_tree numeric(10, 2) NOT NULL CHECK (cost_per_tree > 0),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_fees_maintenance_id ON maintenance_fees(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_fees_farm_id ON maintenance_fees(farm_id);

-- RLS
ALTER TABLE maintenance_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance fees"
  ON maintenance_fees
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

-- =====================================================
-- 5. وظيفة حساب تلقائية لتكلفة الشجرة
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_cost_per_tree()
RETURNS TRIGGER AS $$
DECLARE
  farm_total_trees int;
BEGIN
  -- جلب عدد الأشجار الكلي للمزرعة
  SELECT total_trees INTO farm_total_trees
  FROM farms
  WHERE id = NEW.farm_id;

  -- التحقق من وجود أشجار
  IF farm_total_trees IS NULL OR farm_total_trees = 0 THEN
    RAISE EXCEPTION 'لا يمكن حساب تكلفة الشجرة: المزرعة لا تحتوي على أشجار';
  END IF;

  -- حساب تكلفة الشجرة الواحدة
  NEW.cost_per_tree := NEW.total_amount / farm_total_trees;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لحساب تكلفة الشجرة تلقائياً
CREATE TRIGGER trigger_calculate_cost_per_tree
  BEFORE INSERT OR UPDATE OF total_amount, farm_id
  ON maintenance_fees
  FOR EACH ROW
  EXECUTE FUNCTION calculate_cost_per_tree();

-- =====================================================
-- 6. Trigger لتحديث updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();

-- =====================================================
-- 7. View لعرض تفاصيل الصيانة الكاملة
-- =====================================================
CREATE OR REPLACE VIEW maintenance_full_details AS
SELECT 
  mr.id,
  mr.farm_id,
  f.name_ar as farm_name,
  f.total_trees,
  mr.maintenance_type,
  mr.maintenance_date,
  mr.status,
  mr.created_at,
  mf.total_amount,
  mf.cost_per_tree,
  COUNT(DISTINCT ms.id) as stages_count,
  COUNT(DISTINCT mm.id) as media_count
FROM maintenance_records mr
JOIN farms f ON f.id = mr.farm_id
LEFT JOIN maintenance_fees mf ON mf.maintenance_id = mr.id
LEFT JOIN maintenance_stages ms ON ms.maintenance_id = mr.id
LEFT JOIN maintenance_media mm ON mm.maintenance_id = mr.id
GROUP BY 
  mr.id, mr.farm_id, f.name_ar, f.total_trees, 
  mr.maintenance_type, mr.maintenance_date, mr.status, 
  mr.created_at, mf.total_amount, mf.cost_per_tree;

COMMENT ON TABLE maintenance_records IS 'سجلات الصيانة - نقطة التحكم الوحيدة لإدخال الصيانة';
COMMENT ON TABLE maintenance_stages IS 'مراحل الصيانة - للمرجع الإداري';
COMMENT ON TABLE maintenance_media IS 'صور وفيديوهات توثيق الصيانة';
COMMENT ON TABLE maintenance_fees IS 'رسوم الصيانة مع الحساب التلقائي لتكلفة الشجرة';
