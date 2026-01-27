/*
  # إضافة عمود رسوم الصيانة لأصناف الأشجار

  1. التغييرات
    - إضافة عمود `maintenance_fee` (رسوم التشغيل والصيانة السنوية) إلى جدول `farm_tree_varieties`
    - القيمة الافتراضية: 0
    - يجب أن تكون القيمة >= 0
  
  2. ملاحظات مهمة
    - هذا العمود ضروري لحساب رسوم الصيانة السنوية لكل نوع شجرة
    - كل نوع شجرة يمكن أن يكون له رسوم صيانة مختلفة
    - الرسوم تُعرض للمستثمر في ملخص الطلب
*/

-- Add maintenance_fee column to farm_tree_varieties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_tree_varieties' AND column_name = 'maintenance_fee'
  ) THEN
    ALTER TABLE farm_tree_varieties 
    ADD COLUMN maintenance_fee numeric NOT NULL DEFAULT 0 
    CHECK (maintenance_fee >= 0);
  END IF;
END $$;

-- Update existing records with default maintenance fees based on tree type
UPDATE farm_tree_varieties
SET maintenance_fee = CASE
  WHEN icon = '🫒' THEN 19  -- زيتون
  WHEN icon = '🌴' THEN 29  -- نخيل
  ELSE 19  -- افتراضي
END
WHERE maintenance_fee = 0;
