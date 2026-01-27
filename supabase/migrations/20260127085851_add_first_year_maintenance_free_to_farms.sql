/*
  # إضافة خيار الصيانة المجانية للسنة الأولى

  1. التعديلات
    - إضافة عمود `first_year_maintenance_free` لجدول `farms`
      - نوع boolean
      - القيمة الافتراضية true (مفعلة)
      - يمكن للإدارة التحكم فيها لكل مزرعة
  
  2. الملاحظات
    - هذا الحقل يتحكم في عرض رسالة "الصيانة للسنة الأولى مجانية"
    - رسوم الصيانة تُعرض كمعلومة فقط ولا تُضاف للإجمالي
*/

-- Add first_year_maintenance_free column to farms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'first_year_maintenance_free'
  ) THEN
    ALTER TABLE farms 
    ADD COLUMN first_year_maintenance_free boolean DEFAULT true NOT NULL;
    
    COMMENT ON COLUMN farms.first_year_maintenance_free IS 'Whether the first year maintenance is free for this farm';
  END IF;
END $$;