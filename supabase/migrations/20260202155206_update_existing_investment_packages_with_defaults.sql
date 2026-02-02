/*
  # تحديث الباقات الاستثمارية الموجودة

  1. تحديث الباقات الموجودة بالقيم الافتراضية
    - base_duration_years = 4
    - bonus_free_years = 0
    - min_trees = 50
    - tree_increment = 50
    - quick_select_options = [100, 200, 500, 1000]

  2. ملاحظات
    - جميع الباقات الاستثمارية الموجودة ستحصل على هذه القيم
    - يمكن تعديلها لاحقاً من لوحة التحكم
*/

-- Update all existing investment packages with default values
UPDATE investment_packages
SET
  base_duration_years = 4,
  bonus_free_years = 0,
  min_trees = 50,
  tree_increment = 50,
  quick_select_options = '[100, 200, 500, 1000]'::jsonb
WHERE base_duration_years IS NULL OR bonus_free_years IS NULL;

-- Ensure all packages have the required fields
ALTER TABLE investment_packages 
  ALTER COLUMN base_duration_years SET NOT NULL,
  ALTER COLUMN bonus_free_years SET NOT NULL,
  ALTER COLUMN min_trees SET NOT NULL,
  ALTER COLUMN tree_increment SET NOT NULL;
