/*
  # إضافة حقل is_open_for_booking لجدول farms

  1. التغييرات
    - إضافة عمود is_open_for_booking لجدول farms
      - النوع: boolean
      - القيمة الافتراضية: true
      - يحدد ما إذا كان الحجز مفتوح أم مغلق للمزرعة

  2. ملاحظات
    - هذا العمود منفصل عن status
    - status: يحدد حالة المزرعة (active, closed, upcoming)
    - is_open_for_booking: يحدد ما إذا كان يمكن الحجز فيها أم لا
*/

-- إضافة العمود إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farms' AND column_name = 'is_open_for_booking'
  ) THEN
    ALTER TABLE farms
    ADD COLUMN is_open_for_booking boolean DEFAULT true NOT NULL;

    COMMENT ON COLUMN farms.is_open_for_booking IS 'Whether booking is open for this farm';
  END IF;
END $$;

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_farms_is_open_for_booking
ON farms(is_open_for_booking)
WHERE is_open_for_booking = true AND status = 'active';
