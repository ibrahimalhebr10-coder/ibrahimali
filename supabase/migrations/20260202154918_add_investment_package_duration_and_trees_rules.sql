/*
  # إضافة حقول المدة وقواعد الأشجار للباقات الاستثمارية

  1. تعديلات على جدول investment_packages
    - إضافة `base_duration_years` (integer) - مدة الاستثمار الأساسية بالسنوات
    - إضافة `bonus_free_years` (integer) - سنوات إضافية مجانية
    - إضافة `min_trees` (integer) - الحد الأدنى للأشجار (50)
    - إضافة `tree_increment` (integer) - مضاعفات الأشجار (50)
    - إضافة `quick_select_options` (jsonb) - أزرار الاختيار السريع [100, 200, 500, 1000]

  2. ملاحظات مهمة
    - الباقة تمثل العقد (ليس عدد الأشجار)
    - الحد الأدنى للاستثمار: 50 شجرة
    - يجب أن يكون العدد من مضاعفات 50 فقط
    - حقوق المستثمر: الثمار + الزيوت + جميع المخلفات
*/

-- Add duration and tree rules fields
DO $$
BEGIN
  -- Base duration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_packages' AND column_name = 'base_duration_years'
  ) THEN
    ALTER TABLE investment_packages ADD COLUMN base_duration_years integer NOT NULL DEFAULT 4;
  END IF;

  -- Bonus years
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_packages' AND column_name = 'bonus_free_years'
  ) THEN
    ALTER TABLE investment_packages ADD COLUMN bonus_free_years integer NOT NULL DEFAULT 0;
  END IF;

  -- Minimum trees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_packages' AND column_name = 'min_trees'
  ) THEN
    ALTER TABLE investment_packages ADD COLUMN min_trees integer NOT NULL DEFAULT 50;
  END IF;

  -- Tree increment (mضاعفات)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_packages' AND column_name = 'tree_increment'
  ) THEN
    ALTER TABLE investment_packages ADD COLUMN tree_increment integer NOT NULL DEFAULT 50;
  END IF;

  -- Quick select options
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_packages' AND column_name = 'quick_select_options'
  ) THEN
    ALTER TABLE investment_packages ADD COLUMN quick_select_options jsonb DEFAULT '[100, 200, 500, 1000]'::jsonb;
  END IF;
END $$;

-- Add check constraint to ensure tree_increment is valid
ALTER TABLE investment_packages DROP CONSTRAINT IF EXISTS check_tree_increment;
ALTER TABLE investment_packages ADD CONSTRAINT check_tree_increment 
  CHECK (tree_increment > 0 AND tree_increment <= min_trees);

-- Add check constraint to ensure min_trees is at least 50
ALTER TABLE investment_packages DROP CONSTRAINT IF EXISTS check_min_trees;
ALTER TABLE investment_packages ADD CONSTRAINT check_min_trees 
  CHECK (min_trees >= 50);

-- Add check constraint to ensure durations are positive
ALTER TABLE investment_packages DROP CONSTRAINT IF EXISTS check_durations;
ALTER TABLE investment_packages ADD CONSTRAINT check_durations 
  CHECK (base_duration_years > 0 AND bonus_free_years >= 0);
