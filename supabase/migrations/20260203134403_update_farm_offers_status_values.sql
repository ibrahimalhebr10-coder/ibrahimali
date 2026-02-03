/*
  # تحديث حالات farm_offers حسب المتطلبات

  1. الحالات الجديدة
    - قيد التقييم (under_review) - افتراضي
    - قبول مبدئي (preliminary_accepted)
    - تم التواصل (contacted)
    - غير مناسب حاليًا (not_suitable)

  2. التغييرات
    - إزالة جميع الحالات القديمة الأخرى
    - الإبقاء فقط على الحالات الأربعة المطلوبة
*/

-- حذف القيد القديم
ALTER TABLE farm_offers DROP CONSTRAINT IF EXISTS farm_offers_status_check;

-- إضافة القيد الجديد بالحالات المطلوبة فقط
ALTER TABLE farm_offers
  ADD CONSTRAINT farm_offers_status_check
  CHECK (status IN (
    'under_review',           -- قيد التقييم (افتراضي)
    'preliminary_accepted',   -- قبول مبدئي
    'contacted',              -- تم التواصل
    'not_suitable'            -- غير مناسب حاليًا
  ));

-- تحديث الحالة الافتراضية إن لم تكن موجودة
ALTER TABLE farm_offers
  ALTER COLUMN status SET DEFAULT 'under_review';

COMMENT ON COLUMN farm_offers.status IS 'حالة الطلب: under_review (قيد التقييم), preliminary_accepted (قبول مبدئي), contacted (تم التواصل), not_suitable (غير مناسب حاليًا)';
