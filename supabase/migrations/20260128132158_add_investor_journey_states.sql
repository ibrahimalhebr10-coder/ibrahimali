/*
  # إضافة حالات رحلة المستثمر (Investor Journey States)

  1. التغييرات
    - إضافة حالات جديدة لجدول reservations:
      - `payment_submitted`: تم رفع إيصال السداد وبانتظار المراجعة
      - `transferred_to_harvest`: تم نقل الأشجار إلى محصولي

  2. الحالات الكاملة لرحلة المستثمر
    - `pending`: محجوز مؤقتاً باسم المستثمر (بانتظار اعتماد الإدارة)
    - `waiting_for_payment`: معتمد من الإدارة وبانتظار السداد
    - `payment_submitted`: تم رفع إيصال السداد (بانتظار مراجعة الإيصال)
    - `paid`: سداد معتمد ونهائي
    - `transferred_to_harvest`: تم نقل الأشجار إلى قسم محصولي
    - `cancelled`: ملغي

  3. التدفق المنطقي
    pending → waiting_for_payment → payment_submitted → paid → transferred_to_harvest
                                                            ↓
                                                        cancelled (في أي مرحلة)

  4. ملاحظات
    - الحالة الافتراضية تبقى 'pending'
    - كل حالة تمثل مرحلة واضحة في رحلة الاستثمار
    - transferred_to_harvest تعني أن المستثمر أصبح له أشجار فعلية في محصولي
*/

-- تحديث قيود الحالات في جدول reservations
DO $$
BEGIN
  -- إزالة القيد القديم
  ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

  -- إضافة القيد الجديد مع الحالات الكاملة
  ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending',
    'waiting_for_payment',
    'payment_submitted',
    'paid',
    'transferred_to_harvest',
    'cancelled'
  ));
END $$;

-- إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_reservations_payment_submitted
ON reservations(status)
WHERE status = 'payment_submitted';

CREATE INDEX IF NOT EXISTS idx_reservations_transferred
ON reservations(status)
WHERE status = 'transferred_to_harvest';

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN reservations.status IS 'حالة الحجز في رحلة المستثمر: pending, waiting_for_payment, payment_submitted, paid, transferred_to_harvest, cancelled';
