/*
  # إضافة دعم أنواع متعددة من الأشجار لعروض المزارع

  1. التغييرات
    - إضافة عمود `tree_varieties` من نوع JSONB لتخزين أنواع الأشجار المتعددة
    - كل نوع يحتوي على: type (نوع الشجر)، count (العدد)
    - إضافة عمود `total_tree_count` لحساب الإجمالي الكلي
    - الحفاظ على الأعمدة القديمة للتوافق مع البيانات الموجودة

  2. البنية الجديدة
    tree_varieties: [
      { type: "زيتون", count: 200 },
      { type: "نخيل", count: 150 }
    ]
    total_tree_count: 350
*/

-- إضافة أعمدة جديدة لدعم أنواع متعددة من الأشجار
DO $$
BEGIN
  -- إضافة عمود tree_varieties إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_offers' AND column_name = 'tree_varieties'
  ) THEN
    ALTER TABLE farm_offers
    ADD COLUMN tree_varieties JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- إضافة عمود total_tree_count إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farm_offers' AND column_name = 'total_tree_count'
  ) THEN
    ALTER TABLE farm_offers
    ADD COLUMN total_tree_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- تحديث البيانات الموجودة: تحويل current_crop_type و tree_count إلى tree_varieties
UPDATE farm_offers
SET 
  tree_varieties = jsonb_build_array(
    jsonb_build_object('type', current_crop_type, 'count', tree_count)
  ),
  total_tree_count = tree_count
WHERE tree_varieties = '[]'::jsonb AND current_crop_type IS NOT NULL AND current_crop_type != '';

-- إضافة تعليق توضيحي
COMMENT ON COLUMN farm_offers.tree_varieties IS 'مصفوفة من أنواع الأشجار المختلفة مع أعدادها، مثال: [{"type": "زيتون", "count": 200}]';
COMMENT ON COLUMN farm_offers.total_tree_count IS 'الإجمالي الكلي لجميع الأشجار من جميع الأنواع';
