/*
  # إصلاح نظام عرض العقود بشكل جذري

  ## المشكلة
  - عدم ظهور العقود في لوحة الإدارة
  - أسماء أعمدة خاطئة في الـ service
  - عدم وجود تواريخ بداية ونهاية للعقود
  
  ## التغييرات
  1. إضافة عمود contract_type لتحديد نوع العقد (زراعي/استثماري)
  2. إضافة عمود contract_end_date لتخزين تاريخ نهاية العقد
  3. تحديث البيانات الموجودة بالقيم المناسبة
  
  ## الأعمدة الجديدة
  - contract_type: نوع العقد (agricultural/investment)
  - contract_end_date: تاريخ نهاية العقد (محسوب من البداية + المدة + السنوات المجانية)
*/

-- إضافة عمود contract_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'contract_type'
  ) THEN
    ALTER TABLE reservations 
    ADD COLUMN contract_type text DEFAULT 'agricultural' CHECK (contract_type IN ('agricultural', 'investment'));
  END IF;
END $$;

-- إضافة عمود contract_end_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'contract_end_date'
  ) THEN
    ALTER TABLE reservations 
    ADD COLUMN contract_end_date timestamptz;
  END IF;
END $$;

-- تحديث contract_start_date للحجوزات النشطة التي ليس لها تاريخ بداية
UPDATE reservations
SET contract_start_date = created_at
WHERE contract_start_date IS NULL 
  AND status IN ('active', 'confirmed', 'completed');

-- حساب وتحديث contract_end_date بناءً على تاريخ البداية والمدة
UPDATE reservations
SET contract_end_date = contract_start_date + 
  INTERVAL '1 year' * (COALESCE(duration_years, 0) + COALESCE(bonus_years, 0))
WHERE contract_start_date IS NOT NULL 
  AND status IN ('active', 'confirmed', 'completed');

-- إنشاء أو تحديث دالة لحساب تاريخ نهاية العقد تلقائياً
CREATE OR REPLACE FUNCTION calculate_contract_end_date()
RETURNS trigger AS $$
BEGIN
  IF NEW.contract_start_date IS NOT NULL THEN
    NEW.contract_end_date := NEW.contract_start_date + 
      INTERVAL '1 year' * (COALESCE(NEW.duration_years, 0) + COALESCE(NEW.bonus_years, 0));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لحساب تاريخ النهاية تلقائياً
DROP TRIGGER IF EXISTS set_contract_end_date ON reservations;
CREATE TRIGGER set_contract_end_date
  BEFORE INSERT OR UPDATE OF contract_start_date, duration_years, bonus_years
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_end_date();

-- إنشاء index لتحسين الأداء عند البحث عن العقود
CREATE INDEX IF NOT EXISTS idx_reservations_contract_dates 
  ON reservations(contract_start_date, contract_end_date);

CREATE INDEX IF NOT EXISTS idx_reservations_contract_type 
  ON reservations(contract_type);

-- إنشاء view لعرض العقود مع معلومات المستخدم والمزرعة
CREATE OR REPLACE VIEW contracts_with_details AS
SELECT 
  r.id,
  r.user_id,
  r.farm_id,
  r.farm_name,
  r.status,
  r.contract_type,
  r.total_trees as number_of_trees,
  r.tree_types,
  r.duration_years,
  r.bonus_years,
  r.contract_start_date,
  r.contract_end_date,
  r.total_price,
  r.created_at,
  r.updated_at,
  up.full_name as user_name,
  up.phone as user_phone,
  f.name_ar as farm_full_name,
  f.location as farm_location
FROM reservations r
LEFT JOIN user_profiles up ON r.user_id = up.id
LEFT JOIN farms f ON r.farm_id = f.id
WHERE r.status IN ('active', 'confirmed', 'completed');

-- منح الصلاحيات للـ view
GRANT SELECT ON contracts_with_details TO authenticated;
