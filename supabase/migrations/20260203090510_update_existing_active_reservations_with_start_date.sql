/*
  # تحديث الحجوزات النشطة الموجودة بتاريخ بداية العقد

  1. التعديلات
    - تحديث جميع الحجوزات النشطة التي ليس لديها contract_start_date
    - تعيين contract_start_date = approved_at للحجوزات المعتمدة
    - تعيين contract_start_date = created_at للحجوزات النشطة بدون تاريخ اعتماد
  
  2. ملاحظات
    - هذه migration لمرة واحدة لتحديث البيانات الموجودة
    - الحجوزات الجديدة ستحصل على contract_start_date تلقائياً من خلال trigger
*/

-- تحديث الحجوزات النشطة التي لديها approved_at
UPDATE reservations
SET contract_start_date = approved_at
WHERE status = 'active'
  AND approved_at IS NOT NULL
  AND contract_start_date IS NULL;

-- تحديث الحجوزات النشطة المتبقية (بدون approved_at)
UPDATE reservations
SET contract_start_date = created_at
WHERE status = 'active'
  AND approved_at IS NULL
  AND contract_start_date IS NULL;

-- عرض نتيجة التحديث
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM reservations
  WHERE status = 'active' AND contract_start_date IS NOT NULL;
  
  RAISE NOTICE 'تم تحديث % حجز نشط بتاريخ بداية العقد', updated_count;
END $$;
