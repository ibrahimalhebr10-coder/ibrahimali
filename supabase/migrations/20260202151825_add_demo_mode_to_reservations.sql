/*
  # إضافة نظام الحجوزات التجريبية

  1. التعديلات
    - إضافة حقل `is_demo` إلى جدول reservations
    - الحجوزات التجريبية لا تُفعل الحساب الاستثماري
    - الحجوزات التجريبية تُستخدم فقط لاختبار المنصة
  
  2. الغرض
    - السماح للإدارة بإنشاء حجوزات تجريبية
    - هذه الحجوزات لا تُحسب في النظام المالي
    - لا تُفعل حساب المستخدم
    - للاختبار والتجربة فقط

  3. القيم
    - is_demo = false: حجز فعلي عادي (افتراضي)
    - is_demo = true: حجز تجريبي (للاختبار فقط)
*/

-- إضافة حقل is_demo إلى جدول reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE reservations 
    ADD COLUMN is_demo boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- إضافة comment لتوضيح الحقل
COMMENT ON COLUMN reservations.is_demo IS 'إذا كان true، الحجز تجريبي ولا يُفعل الحساب الاستثماري';

-- إنشاء index لتسريع الاستعلامات التي تفلتر الحجوزات التجريبية
CREATE INDEX IF NOT EXISTS idx_reservations_is_demo ON reservations(is_demo);

-- إنشاء index مُركب للحجوزات الفعلية النشطة (غير التجريبية)
CREATE INDEX IF NOT EXISTS idx_reservations_active_non_demo 
ON reservations(user_id, status) 
WHERE is_demo = false;

-- تحديث جميع الحجوزات الحالية لتكون غير تجريبية (فعلية)
UPDATE reservations 
SET is_demo = false 
WHERE is_demo IS NULL;
