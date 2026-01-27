/*
  # إضافة عمود tree_types إلى جدول farms

  ## الهدف
  - إضافة عمود لتخزين أنواع الأشجار والأسعار لكل مزرعة
  - يتم تخزين البيانات كـ JSONB لسهولة الحفظ والاسترجاع

  ## التغييرات
  1. إضافة عمود `tree_types` من نوع `jsonb` إلى جدول `farms`
  2. القيمة الافتراضية array فارغ
  
  ## البنية المتوقعة للبيانات
  ```json
  [
    {
      "id": "tree-123456",
      "name": "زيتون زيتي",
      "subtitle": "صنف ممتاز",
      "price": 500,
      "investor_price": 450,
      "operatingFee": 50,
      "available": 100,
      "rental_duration": 5,
      "bonus_years": 1
    }
  ]
  ```

  ## ملاحظات
  - هذا العمود يخزن معلومات أنواع الأشجار الخاصة بكل مزرعة
  - يسمح بمرونة في إضافة أنواع مختلفة لكل مزرعة
*/

-- إضافة عمود tree_types إلى جدول farms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'tree_types'
  ) THEN
    ALTER TABLE farms ADD COLUMN tree_types jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- إضافة index للبحث السريع في JSONB
CREATE INDEX IF NOT EXISTS idx_farms_tree_types ON farms USING GIN (tree_types);
