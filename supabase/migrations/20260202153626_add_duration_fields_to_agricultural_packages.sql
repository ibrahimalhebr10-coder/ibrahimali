/*
  # إضافة حقول المدة للباقات الزراعية

  1. تعديلات على جدول agricultural_packages
    - إضافة `base_duration_years` (integer) - مدة الانتفاع الأساسية بالسنوات
    - إضافة `bonus_free_years` (integer) - سنوات إضافية مجانية

  2. ملاحظات
    - هذه الحقول مهمة لحساب المدة الإجمالية للباقة
    - base_duration_years = المدة الأساسية المدفوعة
    - bonus_free_years = السنوات المجانية الإضافية
    - المدة الإجمالية = base_duration_years + bonus_free_years
*/

-- Add duration fields to agricultural_packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agricultural_packages' AND column_name = 'base_duration_years'
  ) THEN
    ALTER TABLE agricultural_packages ADD COLUMN base_duration_years integer NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agricultural_packages' AND column_name = 'bonus_free_years'
  ) THEN
    ALTER TABLE agricultural_packages ADD COLUMN bonus_free_years integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update existing packages with proper duration values
UPDATE agricultural_packages
SET base_duration_years = 1, bonus_free_years = 3
WHERE package_name = 'عقد سنة';

UPDATE agricultural_packages
SET base_duration_years = 4, bonus_free_years = 0
WHERE package_name = 'عقد 4 سنوات';
