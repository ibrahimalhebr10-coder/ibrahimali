/*
  # توحيد حالات الحجوزات والمدفوعات - الإصلاح النهائي
  
  ## المشكلة
  - كان هناك تضارب بين الحالات القديمة والجديدة
  - `waiting_for_payment`, `paid`, `payment_submitted` لم تعد مستخدمة
  
  ## التدفق الجديد
  1. إنشاء حجز → status = 'pending'
  2. دفع ناجح → payments.status = 'completed' + Trigger يحدث reservations.status = 'confirmed'
  3. نقل للمزرعة → status = 'transferred_to_harvest'
  
  ## الحالات النهائية المعتمدة
  - temporary: حجز مؤقت قبل تسجيل الدخول
  - pending: بانتظار الدفع
  - confirmed: تم التأكيد والدفع
  - completed: مكتمل
  - transferred_to_harvest: في مزرعتي
  - cancelled: ملغي
*/

-- التأكد من أن الـ constraint يحتوي على القيم الصحيحة فقط
DO $$ 
BEGIN
  -- حذف الـ constraint القديم
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reservations_status_check'
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
  END IF;
  
  -- إضافة الـ constraint الجديد والنهائي
  ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check 
  CHECK (status = ANY (ARRAY[
    'temporary'::text,
    'pending'::text,
    'confirmed'::text,
    'completed'::text,
    'transferred_to_harvest'::text,
    'cancelled'::text
  ]));
END $$;

-- إضافة comment للتوضيح
COMMENT ON COLUMN reservations.status IS 
'حالة الحجز: temporary (مؤقت), pending (بانتظار الدفع), confirmed (مؤكد ومدفوع), completed (مكتمل), transferred_to_harvest (في مزرعتي), cancelled (ملغي)';
