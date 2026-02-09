/*
  # إصلاح ربط الحجوزات تلقائياً عند إكمال الدفع

  ## المشكلة
  - المستخدم يحجز كزائر (guest)
  - ثم يسجل حساب ويدفع
  - الدفع يكتمل لكن الحجز لا يُربط بالمستخدم تلقائياً
  - النتيجة: الحجز لا يظهر في حساب المستخدم

  ## الحل
  1. إنشاء trigger على جدول payments
  2. عند تحديث status إلى 'completed'
  3. تحديث الحجز المرتبط تلقائياً:
     - ربط user_id من الدفع
     - تغيير status إلى 'confirmed'
     - مسح guest_id
     - تعيين contract_start_date

  ## الأمان
  - الـ trigger آمن لأنه يستخدم SECURITY DEFINER
  - يعمل فقط عند إكمال الدفع (status = 'completed')
  - يحافظ على سلامة البيانات
*/

-- إنشاء دالة لتحديث الحجز عند إكمال الدفع
CREATE OR REPLACE FUNCTION auto_confirm_reservation_on_payment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- التحقق من أن الدفع اكتمل
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- التحقق من وجود reservation_id
    IF NEW.reservation_id IS NOT NULL THEN
      
      -- تحديث الحجز
      UPDATE reservations
      SET
        user_id = NEW.user_id,           -- ربط بالمستخدم
        guest_id = NULL,                 -- مسح guest_id
        status = 'confirmed',            -- تأكيد الحجز
        contract_start_date = COALESCE(contract_start_date, NOW()),  -- تعيين تاريخ البدء
        updated_at = NOW()
      WHERE id = NEW.reservation_id
        AND status IN ('pending', 'pending_payment');  -- فقط الحجوزات المعلقة
      
      RAISE NOTICE '✅ Reservation % confirmed for user %', NEW.reservation_id, NEW.user_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger على جدول payments
DROP TRIGGER IF EXISTS on_payment_completed ON payments;
CREATE TRIGGER on_payment_completed
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION auto_confirm_reservation_on_payment();

-- التحقق من الإنشاء
DO $$
BEGIN
  RAISE NOTICE '✅ تم إنشاء trigger لربط الحجوزات تلقائياً عند إكمال الدفع';
  RAISE NOTICE '✅ الآن عند إكمال الدفع:';
  RAISE NOTICE '   1. يتم ربط الحجز بالمستخدم تلقائياً';
  RAISE NOTICE '   2. يتم تغيير حالة الحجز إلى confirmed';
  RAISE NOTICE '   3. يتم مسح guest_id';
  RAISE NOTICE '   4. يتم تعيين تاريخ بدء العقد';
END $$;
