/*
  # إضافة تاريخ بداية العقد للحجوزات

  1. التعديلات
    - إضافة حقل `contract_start_date` لجدول `reservations`
      - تاريخ بداية العقد الفعلي
      - يمكن أن يكون مختلفاً عن تاريخ الموافقة
      - الافتراضي هو تاريخ الموافقة approved_at
  
  2. ملاحظات
    - هذا الحقل سيستخدم لحساب العد التنازلي لعمر العقد
    - يتم تعيينه تلقائياً عند الموافقة على الحجز
*/

-- إضافة حقل contract_start_date
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS contract_start_date timestamptz;

-- تحديث السجلات الموجودة: إذا كان approved_at موجود، استخدمه كبداية العقد
UPDATE reservations 
SET contract_start_date = approved_at 
WHERE approved_at IS NOT NULL 
  AND contract_start_date IS NULL;

-- إنشاء دالة لتعيين contract_start_date تلقائياً عند الموافقة
CREATE OR REPLACE FUNCTION set_contract_start_date()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تغيير الحالة إلى active وتم تعيين approved_at
  IF NEW.status = 'active' 
     AND NEW.approved_at IS NOT NULL 
     AND OLD.approved_at IS NULL 
     AND NEW.contract_start_date IS NULL 
  THEN
    NEW.contract_start_date := NEW.approved_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
DROP TRIGGER IF EXISTS trigger_set_contract_start_date ON reservations;
CREATE TRIGGER trigger_set_contract_start_date
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_start_date();
